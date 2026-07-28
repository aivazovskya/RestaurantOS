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
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let MenuService = class MenuService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMenuItems() {
        const items = await this.prisma.menuItem.findMany({
            include: {
                recipeCard: {
                    include: {
                        items: {
                            include: { ingredient: true },
                        },
                    },
                },
            },
            orderBy: { category: 'asc' },
        });
        return items.map((dish) => {
            let primeCost = 0;
            if (dish.recipeCard && dish.recipeCard.items) {
                for (const rItem of dish.recipeCard.items) {
                    const costPerUnit = rItem.ingredient.costPerUnit || 0;
                    const qtyInMainUnit = rItem.unit === 'G' || rItem.unit === 'ML' ? rItem.grossAmount / 1000 : rItem.grossAmount;
                    primeCost += qtyInMainUnit * costPerUnit;
                }
            }
            const foodCostPercent = dish.sellingPrice > 0 ? (primeCost / dish.sellingPrice) * 100 : 0;
            return {
                ...dish,
                calculatedPrimeCost: Math.round(primeCost),
                foodCostPercent: Math.round(foodCostPercent * 10) / 10,
            };
        });
    }
    async createMenuItem(data) {
        const org = await this.prisma.organization.findFirst();
        const menuItem = await this.prisma.menuItem.create({
            data: {
                organizationId: org ? org.id : 'default-org',
                posItemId: data.posItemId || `NEX-DISH-${Math.floor(100 + Math.random() * 900)}`,
                name: data.name,
                description: data.description || '',
                category: data.category || 'Основные блюда',
                sellingPrice: Number(data.sellingPrice) || 0,
                imageUrl: data.imageUrl || '',
            },
        });
        if (data.recipeItems && Array.isArray(data.recipeItems) && data.recipeItems.length > 0) {
            await this.saveRecipeCard(menuItem.id, data.recipeItems);
        }
        return menuItem;
    }
    async saveRecipeCard(menuItemId, recipeItems) {
        const existing = await this.prisma.recipeCard.findUnique({
            where: { menuItemId },
        });
        if (existing) {
            await this.prisma.recipeCard.delete({ where: { id: existing.id } });
        }
        const recipeCard = await this.prisma.recipeCard.create({
            data: {
                menuItemId,
                yieldAmount: 1.0,
                yieldUnit: 'PCS',
                items: {
                    create: recipeItems.map((ri) => ({
                        ingredientId: ri.ingredientId,
                        grossAmount: Number(ri.grossAmount),
                        netAmount: Number(ri.netAmount || ri.grossAmount),
                        unit: ri.unit || 'KG',
                    })),
                },
            },
            include: { items: { include: { ingredient: true } } },
        });
        return recipeCard;
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenuService);
//# sourceMappingURL=menu.service.js.map