import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

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
          // Simple estimate for prime cost
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

  async createMenuItem(data: any) {
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

  async saveRecipeCard(menuItemId: string, recipeItems: Array<{ ingredientId: string; grossAmount: number; netAmount?: number; unit?: string }>) {
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
}
