"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const stop_list_service_1 = require("../stop-list/stop-list.service");
let WarehouseService = class WarehouseService {
    prisma;
    stopListService;
    constructor(prisma, stopListService) {
        this.prisma = prisma;
        this.stopListService = stopListService;
    }
    async getIngredients() {
        return await this.prisma.ingredient.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async createIngredient(data) {
        const org = await this.prisma.organization.findFirst();
        const ingredient = await this.prisma.ingredient.create({
            data: {
                organizationId: org ? org.id : 'default-org',
                name: data.name,
                code: data.code || `ING-${Math.floor(100 + Math.random() * 900)}`,
                category: data.category || 'GROCERY',
                mainUnit: data.mainUnit || 'KG',
                costPerUnit: Number(data.costPerUnit) || 0,
                minStockLevel: Number(data.minStockLevel) || 0,
                lossPercentage: Number(data.lossPercentage) || 0,
                isSemiFinished: Boolean(data.isSemiFinished),
            },
        });
        const warehouse = await this.prisma.warehouse.findFirst();
        if (warehouse) {
            await this.prisma.stockBalance.create({
                data: {
                    warehouseId: warehouse.id,
                    ingredientId: ingredient.id,
                    quantity: Number(data.initialStock) || 0,
                },
            });
            await this.stopListService.recalculateForIngredients([ingredient.id], warehouse.id);
        }
        return ingredient;
    }
    async getBalances(warehouseId) {
        const targetWarehouse = warehouseId
            ? await this.prisma.warehouse.findUnique({ where: { id: warehouseId } })
            : await this.prisma.warehouse.findFirst();
        if (!targetWarehouse)
            return [];
        const balances = await this.prisma.stockBalance.findMany({
            where: { warehouseId: targetWarehouse.id },
            include: { ingredient: true },
            orderBy: { ingredient: { name: 'asc' } },
        });
        return balances.map((b) => ({
            id: b.id,
            ingredientId: b.ingredientId,
            name: b.ingredient.name,
            code: b.ingredient.code,
            category: b.ingredient.category,
            quantity: b.quantity,
            unit: b.ingredient.mainUnit,
            costPerUnit: b.ingredient.costPerUnit,
            totalCost: b.quantity * b.ingredient.costPerUnit,
            minStockLevel: b.ingredient.minStockLevel,
            isLowStock: b.quantity <= b.ingredient.minStockLevel,
            isNegative: b.quantity < 0,
        }));
    }
    async addStockReceipt(dto) {
        let warehouse = dto.warehouseId
            ? await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } })
            : await this.prisma.warehouse.findFirst();
        if (!warehouse)
            throw new common_1.NotFoundException('Warehouse not found');
        const movementItems = [];
        const updatedIngredientIds = [];
        for (const item of dto.items) {
            const ingredient = await this.prisma.ingredient.findUnique({ where: { id: item.ingredientId } });
            if (!ingredient)
                continue;
            const qty = Number(item.quantity);
            const cost = Number(item.unitCost) || ingredient.costPerUnit;
            const balance = await this.prisma.stockBalance.findUnique({
                where: {
                    warehouseId_ingredientId: {
                        warehouseId: warehouse.id,
                        ingredientId: ingredient.id,
                    },
                },
            });
            if (balance) {
                await this.prisma.stockBalance.update({
                    where: { id: balance.id },
                    data: { quantity: balance.quantity + qty },
                });
            }
            else {
                await this.prisma.stockBalance.create({
                    data: {
                        warehouseId: warehouse.id,
                        ingredientId: ingredient.id,
                        quantity: qty,
                    },
                });
            }
            if (cost > 0) {
                await this.prisma.ingredient.update({
                    where: { id: ingredient.id },
                    data: { costPerUnit: cost },
                });
            }
            movementItems.push({
                ingredientId: ingredient.id,
                quantity: qty,
                unitCost: cost,
            });
            updatedIngredientIds.push(ingredient.id);
        }
        const movement = await this.prisma.stockMovement.create({
            data: {
                warehouseId: warehouse.id,
                type: 'RECEIPT',
                referenceId: dto.invoiceNumber || `INV-${Date.now()}`,
                comment: `Приход от поставщика (Накладная: ${dto.invoiceNumber || 'Б/Н'})`,
                items: {
                    create: movementItems,
                },
            },
            include: { items: { include: { ingredient: true } } },
        });
        await this.stopListService.recalculateForIngredients(updatedIngredientIds, warehouse.id);
        return movement;
    }
    async addManualWriteOff(dto) {
        let warehouse = dto.warehouseId
            ? await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } })
            : await this.prisma.warehouse.findFirst();
        if (!warehouse)
            throw new common_1.NotFoundException('Warehouse not found');
        const movementItems = [];
        const updatedIngredientIds = [];
        for (const item of dto.items) {
            const ingredient = await this.prisma.ingredient.findUnique({ where: { id: item.ingredientId } });
            if (!ingredient)
                continue;
            const qty = Number(item.quantity);
            const balance = await this.prisma.stockBalance.findUnique({
                where: {
                    warehouseId_ingredientId: {
                        warehouseId: warehouse.id,
                        ingredientId: ingredient.id,
                    },
                },
            });
            if (balance) {
                await this.prisma.stockBalance.update({
                    where: { id: balance.id },
                    data: { quantity: balance.quantity - qty },
                });
            }
            movementItems.push({
                ingredientId: ingredient.id,
                quantity: -qty,
                unitCost: ingredient.costPerUnit,
            });
            updatedIngredientIds.push(ingredient.id);
        }
        const movement = await this.prisma.stockMovement.create({
            data: {
                warehouseId: warehouse.id,
                type: 'MANUAL_WRITE_OFF',
                comment: dto.reason || 'Ручное списание (порча/брак)',
                items: { create: movementItems },
            },
            include: { items: { include: { ingredient: true } } },
        });
        await this.stopListService.recalculateForIngredients(updatedIngredientIds, warehouse.id);
        return movement;
    }
    async getMovements() {
        return await this.prisma.stockMovement.findMany({
            include: {
                warehouse: true,
                items: {
                    include: { ingredient: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async getIncidents() {
        return await this.prisma.deductionIncident.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.WarehouseService = WarehouseService;
exports.WarehouseService = WarehouseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stop_list_service_1.StopListService])
], WarehouseService);
//# sourceMappingURL=warehouse.service.js.map