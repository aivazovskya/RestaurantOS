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
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let SeedService = class SeedService {
    prisma;
    logger = new common_1.Logger('SeedService');
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onApplicationBootstrap() {
        await this.seedDataIfNeeded();
    }
    async seedDataIfNeeded() {
        const orgCount = await this.prisma.organization.count();
        if (orgCount > 0) {
            this.logger.log('Database already seeded.');
            return;
        }
        this.logger.log('Seeding initial Kazakhstan Restaurant OS demo data...');
        const org = await this.prisma.organization.create({
            data: {
                name: 'Ресторанная группа Алматы (FoodCorp KZ)',
                bin: '220340019284',
                branches: {
                    create: [
                        {
                            name: 'Алматы Достык (Флагман)',
                            address: 'пр. Достык 105, Алматы',
                            phone: '+7 (727) 390-11-22',
                            warehouses: {
                                create: [
                                    { name: 'Главный склад кухни', isMain: true },
                                    { name: 'Барный склад', isMain: false },
                                ],
                            },
                            posIntegrations: {
                                create: [
                                    {
                                        provider: 'NEXIUM',
                                        apiKey: 'nx_live_9f81a7b2',
                                        apiSecret: 'nx_sec_991823719237',
                                        webhookSecret: 'whsec_kz_restaurant_os_2026',
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            include: {
                branches: {
                    include: { warehouses: true },
                },
            },
        });
        const mainWarehouse = org.branches[0].warehouses.find((w) => w.isMain) || org.branches[0].warehouses[0];
        const barWarehouse = org.branches[0].warehouses.find((w) => !w.isMain) || mainWarehouse;
        const farsh = await this.prisma.ingredient.create({
            data: {
                organizationId: org.id,
                name: 'Фарш говяжий (высший сорт)',
                code: 'ING-001',
                category: 'MEAT',
                mainUnit: 'KG',
                costPerUnit: 2800,
                minStockLevel: 10.0,
                lossPercentage: 5.0,
            },
        });
        const bun = await this.prisma.ingredient.create({
            data: {
                organizationId: org.id,
                name: 'Булочка Бриошь для бургера',
                code: 'ING-002',
                category: 'GROCERY',
                mainUnit: 'PCS',
                costPerUnit: 180,
                minStockLevel: 50.0,
                lossPercentage: 0.0,
            },
        });
        const cheese = await this.prisma.ingredient.create({
            data: {
                organizationId: org.id,
                name: 'Сыр Чеддер (ломтики)',
                code: 'ING-003',
                category: 'DAIRY',
                mainUnit: 'KG',
                costPerUnit: 4200,
                minStockLevel: 3.0,
                lossPercentage: 0.0,
            },
        });
        const sauce = await this.prisma.ingredient.create({
            data: {
                organizationId: org.id,
                name: 'Соус Бургер фирменный',
                code: 'ING-004',
                category: 'GROCERY',
                mainUnit: 'KG',
                costPerUnit: 1500,
                minStockLevel: 2.0,
                lossPercentage: 0.0,
            },
        });
        const tomato = await this.prisma.ingredient.create({
            data: {
                organizationId: org.id,
                name: 'Томаты свежие',
                code: 'ING-005',
                category: 'VEGETABLES',
                mainUnit: 'KG',
                costPerUnit: 850,
                minStockLevel: 5.0,
                lossPercentage: 10.0,
            },
        });
        const lemon = await this.prisma.ingredient.create({
            data: {
                organizationId: org.id,
                name: 'Лимоны свежие',
                code: 'ING-006',
                category: 'BEVERAGES',
                mainUnit: 'KG',
                costPerUnit: 1100,
                minStockLevel: 4.0,
                lossPercentage: 12.0,
            },
        });
        const syrup = await this.prisma.ingredient.create({
            data: {
                organizationId: org.id,
                name: 'Сахарный сироп 100%',
                code: 'ING-007',
                category: 'BEVERAGES',
                mainUnit: 'L',
                costPerUnit: 600,
                minStockLevel: 5.0,
                lossPercentage: 0.0,
            },
        });
        const soda = await this.prisma.ingredient.create({
            data: {
                organizationId: org.id,
                name: 'Вода газированная',
                code: 'ING-008',
                category: 'BEVERAGES',
                mainUnit: 'L',
                costPerUnit: 250,
                minStockLevel: 20.0,
                lossPercentage: 0.0,
            },
        });
        const initialBalances = [
            { ingredientId: farsh.id, warehouseId: mainWarehouse.id, qty: 25.0 },
            { ingredientId: bun.id, warehouseId: mainWarehouse.id, qty: 120.0 },
            { ingredientId: cheese.id, warehouseId: mainWarehouse.id, qty: 8.0 },
            { ingredientId: sauce.id, warehouseId: mainWarehouse.id, qty: 5.0 },
            { ingredientId: tomato.id, warehouseId: mainWarehouse.id, qty: 15.0 },
            { ingredientId: lemon.id, warehouseId: barWarehouse.id, qty: 10.0 },
            { ingredientId: syrup.id, warehouseId: barWarehouse.id, qty: 12.0 },
            { ingredientId: soda.id, warehouseId: barWarehouse.id, qty: 45.0 },
        ];
        for (const b of initialBalances) {
            await this.prisma.stockBalance.create({
                data: {
                    warehouseId: b.warehouseId,
                    ingredientId: b.ingredientId,
                    quantity: b.qty,
                },
            });
        }
        const burger = await this.prisma.menuItem.create({
            data: {
                organizationId: org.id,
                posItemId: 'NEX-DISH-001',
                name: 'Бургер Говяжий Классический',
                description: 'Сочная говяжья котлета 150g, бриошь, сыр чеддер, соус, томат',
                category: 'Бургеры',
                sellingPrice: 3500,
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
                recipeCard: {
                    create: {
                        yieldAmount: 1.0,
                        yieldUnit: 'PCS',
                        items: {
                            create: [
                                { ingredientId: farsh.id, grossAmount: 0.16, netAmount: 0.15, unit: 'KG' },
                                { ingredientId: bun.id, grossAmount: 1.0, netAmount: 1.0, unit: 'PCS' },
                                { ingredientId: cheese.id, grossAmount: 0.03, netAmount: 0.03, unit: 'KG' },
                                { ingredientId: sauce.id, grossAmount: 0.025, netAmount: 0.025, unit: 'KG' },
                                { ingredientId: tomato.id, grossAmount: 0.04, netAmount: 0.035, unit: 'KG' },
                            ],
                        },
                    },
                },
            },
        });
        const lemonade = await this.prisma.menuItem.create({
            data: {
                organizationId: org.id,
                posItemId: 'NEX-DISH-002',
                name: 'Лимонад Классический 0.5L',
                description: 'Свежевыжатый сок лимона, сахарный сироп, газированная вода, лед',
                category: 'Напитки',
                sellingPrice: 1500,
                imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
                recipeCard: {
                    create: {
                        yieldAmount: 1.0,
                        yieldUnit: 'PCS',
                        items: {
                            create: [
                                { ingredientId: lemon.id, grossAmount: 0.1, netAmount: 0.08, unit: 'KG' },
                                { ingredientId: syrup.id, grossAmount: 0.05, netAmount: 0.05, unit: 'L' },
                                { ingredientId: soda.id, grossAmount: 0.35, netAmount: 0.35, unit: 'L' },
                            ],
                        },
                    },
                },
            },
        });
        this.logger.log('Demo data successfully seeded for Restaurant OS Kazakhstan!');
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SeedService);
//# sourceMappingURL=seed.service.js.map