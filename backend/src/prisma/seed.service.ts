import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedDemoData() {
    // Check if organization already exists
    const existingOrg = await this.prisma.organization.findFirst();
    if (existingOrg) {
      this.logger.log('Database already seeded.');
      return;
    }

    this.logger.log('Seeding initial Kazakhstan Restaurant OS demo data...');

    // 1. Create Organization & Branch
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

    // 2. Create Warehouse
    const warehouse = await this.prisma.warehouse.create({
      data: {
        branchId: mainBranch.id,
        name: 'Главный склад кухни',
        isMain: true,
      },
    });

    // 3. Create Ingredients (12 items)
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

    const createdIngredients: Record<string, any> = {};

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

      // Seed initial Stock Balance
      let initialQty = 10.0;
      if (ing.mainUnit === 'PCS') initialQty = 100.0;
      if (ing.mainUnit === 'L') initialQty = 25.0;

      await this.prisma.stockBalance.create({
        data: {
          warehouseId: warehouse.id,
          ingredientId: created.id,
          quantity: initialQty,
        },
      });
    }

    // 4. Create Menu Items & Recipe Cards
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

    // 5. Create Demo Customers & Loyalty Profiles
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

    // Seed Loyalty Transactions history
    await this.prisma.loyaltyTransaction.createMany({
      data: [
        { customerId: customer1.id, type: 'EARNED', points: 750, comment: 'Приветственный бонус за подписку' },
        { customerId: customer1.id, type: 'EARNED', points: 500, comment: 'Начисление 5% за визит' },
        { customerId: customer2.id, type: 'EARNED', points: 450, comment: 'Начисление 5% за первый заказ' },
      ],
    });

    // 6. Create Demo Coupons
    await this.prisma.coupon.createMany({
      data: [
        { code: 'WELCOME10', discountType: 'PERCENT', discountValue: 10 },
        { code: 'KZVIP500', discountType: 'FIXED_AMOUNT', discountValue: 500 },
        { code: 'BDAY20', discountType: 'PERCENT', discountValue: 20, customerId: customer1.id },
      ],
    });

    // 7. Create Demo Couriers (Phase 4)
    await this.prisma.courier.createMany({
      data: [
        { name: 'Алихан Смагулов', phone: '+77071112233', vehicleType: 'CAR', status: 'AVAILABLE', branchId: mainBranch.id },
        { name: 'Ерасыл Касымов', phone: '+77084445566', vehicleType: 'SCOOTER', status: 'AVAILABLE', branchId: mainBranch.id },
        { name: 'Диас Каримов', phone: '+77097778899', vehicleType: 'BICYCLE', status: 'OFFLINE', branchId: mainBranch.id },
      ],
    });

    this.logger.log('Demo data successfully seeded for Restaurant OS Kazakhstan (Phase 4 Courier Delivery)!');
  }
}
