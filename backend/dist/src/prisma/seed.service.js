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
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let SeedService = SeedService_1 = class SeedService {
    prisma;
    logger = new common_1.Logger(SeedService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedDemoData() {
        const existingOrg = await this.prisma.organization.findFirst();
        if (existingOrg) {
            this.logger.log('Database already seeded.');
            return;
        }
        this.logger.log('Seeding initial Kazakhstan Restaurant OS demo data...');
        const org = await this.prisma.organization.create({
            data: {
                name: 'FoodCorp Kazakhstan',
                bin: '990140001234',
            },
        });
        const mainBranch = await this.prisma.branch.create({
            data: {
                organizationId: org.id,
                name: 'Almaty Dostyk',
                address: 'пр. Достык 120, Алматы',
                phone: '+7 727 333 4455',
            },
        });
        const warehouse = await this.prisma.warehouse.create({
            data: {
                branchId: mainBranch.id,
                name: 'Главный склад кухни',
                isMain: true,
            },
        });
        const ingredients = [
            { name: 'Фарш говяжий (Брикет)', category: 'MEAT', mainUnit: 'KG', costPerUnit: 3200, minStockLevel: 2.0, isSemiFinished: true },
            { name: 'Булочка для бургера Бриошь', category: 'GROCERY', mainUnit: 'PCS', costPerUnit: 120, minStockLevel: 20.0 },
            { name: 'Сыр Чеддер слайсы', category: 'DAIRY', mainUnit: 'PCS', costPerUnit: 45, minStockLevel: 30.0 },
            { name: 'Соус Фирменный', category: 'GROCERY', mainUnit: 'KG', costPerUnit: 1800, minStockLevel: 1.0 },
            { name: 'Салат Айсберг', category: 'VEGETABLES', mainUnit: 'KG', costPerUnit: 950, minStockLevel: 1.0 },
            { name: 'Помидоры свежие', category: 'VEGETABLES', mainUnit: 'KG', costPerUnit: 1100, minStockLevel: 1.5 },
            { name: 'Огурцы маринованные', category: 'VEGETABLES', mainUnit: 'KG', costPerUnit: 1400, minStockLevel: 1.0 },
            { name: 'Картофель фри (заморозка)', category: 'VEGETABLES', mainUnit: 'KG', costPerUnit: 850, minStockLevel: 5.0 },
            { name: 'Масло фритюрное', category: 'GROCERY', mainUnit: 'L', costPerUnit: 920, minStockLevel: 5.0 },
            { name: 'Сироп Лимонадный', category: 'BEVERAGES', mainUnit: 'L', costPerUnit: 2400, minStockLevel: 2.0 },
            { name: 'Вода газированная', category: 'BEVERAGES', mainUnit: 'L', costPerUnit: 180, minStockLevel: 10.0 },
            { name: 'Лимоны свежие', category: 'VEGETABLES', mainUnit: 'KG', costPerUnit: 1300, minStockLevel: 1.0 },
        ];
        const createdIngredients = {};
        for (const ing of ingredients) {
            const created = await this.prisma.ingredient.create({
                data: {
                    organizationId: org.id,
                    name: ing.name,
                    category: ing.category,
                    mainUnit: ing.mainUnit,
                    costPerUnit: ing.costPerUnit,
                    minStockLevel: ing.minStockLevel,
                    isSemiFinished: ing.isSemiFinished || false,
                },
            });
            createdIngredients[ing.name] = created;
            let initialQty = 10.0;
            if (ing.mainUnit === 'PCS')
                initialQty = 100.0;
            if (ing.mainUnit === 'L')
                initialQty = 25.0;
            await this.prisma.stockBalance.create({
                data: {
                    warehouseId: warehouse.id,
                    ingredientId: created.id,
                    quantity: initialQty,
                },
            });
        }
        const dish1 = await this.prisma.menuItem.create({
            data: {
                organizationId: org.id,
                posItemId: 'NEX-DISH-001',
                name: 'Бургер Говяжий Классический',
                description: 'Сочная котлета из 100% говядины, сыр чеддер, свежий салат и фирменный соус в булочке бриошь',
                category: 'Бургеры',
                sellingPrice: 3500,
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
                isAvailable: true,
            },
        });
        await this.prisma.recipeCard.create({
            data: {
                menuItemId: dish1.id,
                yieldAmount: 1.0,
                yieldUnit: 'PCS',
                items: {
                    create: [
                        { ingredientId: createdIngredients['Фарш говяжий (Брикет)'].id, grossAmount: 0.16, netAmount: 0.14, unit: 'KG' },
                        { ingredientId: createdIngredients['Булочка для бургера Бриошь'].id, grossAmount: 1.0, netAmount: 1.0, unit: 'PCS' },
                        { ingredientId: createdIngredients['Сыр Чеддер слайсы'].id, grossAmount: 2.0, netAmount: 2.0, unit: 'PCS' },
                        { ingredientId: createdIngredients['Соус Фирменный'].id, grossAmount: 0.03, netAmount: 0.03, unit: 'KG' },
                        { ingredientId: createdIngredients['Салат Айсберг'].id, grossAmount: 0.02, netAmount: 0.02, unit: 'KG' },
                        { ingredientId: createdIngredients['Помидоры свежие'].id, grossAmount: 0.03, netAmount: 0.03, unit: 'KG' },
                    ],
                },
            },
        });
        const dish2 = await this.prisma.menuItem.create({
            data: {
                organizationId: org.id,
                posItemId: 'NEX-DISH-002',
                name: 'Лимонад Классический 0.5L',
                description: 'Освежающий натуральный лимонад с кусочками свежего лимона',
                category: 'Напитки',
                sellingPrice: 1500,
                imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
                isAvailable: true,
            },
        });
        await this.prisma.recipeCard.create({
            data: {
                menuItemId: dish2.id,
                yieldAmount: 1.0,
                yieldUnit: 'PCS',
                items: {
                    create: [
                        { ingredientId: createdIngredients['Сироп Лимонадный'].id, grossAmount: 0.05, netAmount: 0.05, unit: 'L' },
                        { ingredientId: createdIngredients['Вода газированная'].id, grossAmount: 0.4, netAmount: 0.4, unit: 'L' },
                        { ingredientId: createdIngredients['Лимоны свежие'].id, grossAmount: 0.05, netAmount: 0.04, unit: 'KG' },
                    ],
                },
            },
        });
        const dish3 = await this.prisma.menuItem.create({
            data: {
                organizationId: org.id,
                posItemId: 'NEX-DISH-003',
                name: 'Картофель Фри XL',
                description: 'Золотистый хрустящий картофель фри с морской солью',
                category: 'Закуски',
                sellingPrice: 1200,
                imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
                isAvailable: true,
            },
        });
        await this.prisma.recipeCard.create({
            data: {
                menuItemId: dish3.id,
                yieldAmount: 1.0,
                yieldUnit: 'PCS',
                items: {
                    create: [
                        { ingredientId: createdIngredients['Картофель фри (заморозка)'].id, grossAmount: 0.25, netAmount: 0.22, unit: 'KG' },
                        { ingredientId: createdIngredients['Масло фритюрное'].id, grossAmount: 0.03, netAmount: 0.03, unit: 'L' },
                    ],
                },
            },
        });
        const customer1 = await this.prisma.customer.create({
            data: {
                phone: '+77015550101',
                name: 'Арман Нурланов',
                loyaltyPoints: 1250,
                totalSpent: 45000,
                visitsCount: 8,
            },
        });
        const customer2 = await this.prisma.customer.create({
            data: {
                phone: '+77771234567',
                name: 'Айгерим Бекова',
                loyaltyPoints: 450,
                totalSpent: 15000,
                visitsCount: 3,
            },
        });
        await this.prisma.loyaltyTransaction.createMany({
            data: [
                { customerId: customer1.id, type: 'EARNED', points: 750, comment: 'Приветственный бонус за подписку' },
                { customerId: customer1.id, type: 'EARNED', points: 500, comment: 'Начисление 5% за визит' },
                { customerId: customer2.id, type: 'EARNED', points: 450, comment: 'Начисление 5% за первый заказ' },
            ],
        });
        await this.prisma.coupon.createMany({
            data: [
                { code: 'WELCOME10', discountType: 'PERCENT', discountValue: 10 },
                { code: 'KZVIP500', discountType: 'FIXED_AMOUNT', discountValue: 500 },
                { code: 'BDAY20', discountType: 'PERCENT', discountValue: 20, customerId: customer1.id },
            ],
        });
        await this.prisma.courier.createMany({
            data: [
                { name: 'Алихан Смагулов', phone: '+77071112233', vehicleType: 'CAR', status: 'AVAILABLE', branchId: mainBranch.id },
                { name: 'Ерасыл Касымов', phone: '+77084445566', vehicleType: 'SCOOTER', status: 'AVAILABLE', branchId: mainBranch.id },
                { name: 'Диас Каримов', phone: '+77097778899', vehicleType: 'BICYCLE', status: 'OFFLINE', branchId: mainBranch.id },
            ],
        });
        this.logger.log('Demo data successfully seeded for Restaurant OS Kazakhstan (Phase 4 Courier Delivery)!');
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SeedService);
//# sourceMappingURL=seed.service.js.map