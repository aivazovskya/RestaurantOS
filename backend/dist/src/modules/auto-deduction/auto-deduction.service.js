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
var AutoDeductionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoDeductionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const unit_converter_1 = require("../../common/utils/unit-converter");
let AutoDeductionService = AutoDeductionService_1 = class AutoDeductionService {
    prisma;
    logger = new common_1.Logger(AutoDeductionService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processReceipt(payload) {
        const existingMovement = await this.prisma.stockMovement.findFirst({
            where: { referenceId: payload.receiptId },
        });
        if (existingMovement) {
            return {
                status: 'SKIPPED',
                message: `Receipt ${payload.receiptId} has already been processed for auto-deduction.`,
                movementId: existingMovement.id,
            };
        }
        let warehouse = await this.prisma.warehouse.findFirst({
            where: payload.branchId ? { branchId: payload.branchId } : {},
        });
        if (!warehouse) {
            warehouse = await this.prisma.warehouse.findFirst();
        }
        if (!warehouse) {
            throw new common_1.NotFoundException('No active warehouse found for auto-deduction.');
        }
        const deductionsMap = new Map();
        const incidentsList = [];
        if (payload.items && Array.isArray(payload.items)) {
            for (const posItem of payload.items) {
                const menuItem = await this.prisma.menuItem.findUnique({
                    where: { posItemId: posItem.posItemId },
                    include: {
                        recipeCard: {
                            include: {
                                items: {
                                    include: {
                                        ingredient: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (!menuItem || !menuItem.recipeCard) {
                    this.logger.warn(`No recipe card found for POS Item ${posItem.posItemId} (${posItem.name})`);
                    continue;
                }
                await this.resolveRecipeDeductions(menuItem.recipeCard.items, posItem.quantity, deductionsMap);
            }
        }
        if (deductionsMap.size === 0) {
            return {
                status: 'NO_OP',
                message: 'No ingredients matched recipe cards for this receipt.',
                receiptId: payload.receiptId,
            };
        }
        const movementItemsData = [];
        for (const [ingredientId, deduction] of deductionsMap.entries()) {
            let balance = await this.prisma.stockBalance.findUnique({
                where: {
                    warehouseId_ingredientId: {
                        warehouseId: warehouse.id,
                        ingredientId: ingredientId,
                    },
                },
            });
            const currentQty = balance ? balance.quantity : 0.0;
            const newQty = currentQty - deduction.qty;
            if (balance) {
                await this.prisma.stockBalance.update({
                    where: { id: balance.id },
                    data: { quantity: newQty },
                });
            }
            else {
                await this.prisma.stockBalance.create({
                    data: {
                        warehouseId: warehouse.id,
                        ingredientId: ingredientId,
                        quantity: newQty,
                    },
                });
            }
            if (newQty < 0) {
                incidentsList.push({
                    ingredientId,
                    name: deduction.name,
                    requested: deduction.qty,
                    available: currentQty,
                    shortage: Math.abs(newQty),
                });
                await this.prisma.deductionIncident.create({
                    data: {
                        receiptId: payload.receiptId,
                        ingredientId,
                        ingredientName: deduction.name,
                        requestedQty: deduction.qty,
                        availableQty: currentQty,
                        shortageQty: Math.abs(newQty),
                    },
                });
            }
            movementItemsData.push({
                ingredientId,
                quantity: -deduction.qty,
                unitCost: deduction.unitCost,
            });
        }
        const movement = await this.prisma.stockMovement.create({
            data: {
                warehouseId: warehouse.id,
                type: 'AUTO_DEDUCTION',
                referenceId: payload.receiptId,
                comment: `Автосписание по чеку Nexium ${payload.receiptId} (Стол: ${payload.tableNumber || 'N/A'})`,
                items: {
                    create: movementItemsData,
                },
            },
            include: {
                items: true,
            },
        });
        return {
            status: 'SUCCESS',
            receiptId: payload.receiptId,
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            movementId: movement.id,
            deductedIngredientsCount: deductionsMap.size,
            deductions: Array.from(deductionsMap.values()),
            incidents: incidentsList,
        };
    }
    async resolveRecipeDeductions(recipeItems, soldQuantity, deductionsMap) {
        for (const item of recipeItems) {
            const ingredient = item.ingredient;
            const grossInMainUnit = unit_converter_1.UnitConverter.convertToMainUnit(item.grossAmount, item.unit, ingredient.mainUnit);
            const totalDeductionQty = grossInMainUnit * soldQuantity;
            if (ingredient.isSemiFinished && ingredient.subRecipeId) {
                const subRecipe = await this.prisma.recipeCard.findUnique({
                    where: { id: ingredient.subRecipeId },
                    include: {
                        items: {
                            include: { ingredient: true },
                        },
                    },
                });
                if (subRecipe && subRecipe.items) {
                    const subYield = subRecipe.yieldAmount || 1.0;
                    const subFactor = totalDeductionQty / subYield;
                    await this.resolveRecipeDeductions(subRecipe.items, subFactor, deductionsMap);
                    continue;
                }
            }
            const existing = deductionsMap.get(ingredient.id);
            if (existing) {
                existing.qty += totalDeductionQty;
            }
            else {
                deductionsMap.set(ingredient.id, {
                    ingredientId: ingredient.id,
                    name: ingredient.name,
                    mainUnit: ingredient.mainUnit,
                    qty: totalDeductionQty,
                    unitCost: ingredient.costPerUnit,
                });
            }
        }
    }
};
exports.AutoDeductionService = AutoDeductionService;
exports.AutoDeductionService = AutoDeductionService = AutoDeductionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AutoDeductionService);
//# sourceMappingURL=auto-deduction.service.js.map