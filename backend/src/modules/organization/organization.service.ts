import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    const org = await this.prisma.organization.findFirst({
      include: {
        branches: {
          include: { warehouses: true },
        },
      },
    });

    const balances = await this.prisma.stockBalance.findMany({
      include: { ingredient: true },
    });

    let totalStockValue = 0;
    let lowStockCount = 0;
    let negativeStockCount = 0;

    for (const b of balances) {
      totalStockValue += b.quantity * b.ingredient.costPerUnit;
      if (b.quantity <= b.ingredient.minStockLevel) {
        lowStockCount++;
      }
      if (b.quantity < 0) {
        negativeStockCount++;
      }
    }

    const movementsCount = await this.prisma.stockMovement.count();
    const autoDeductionsCount = await this.prisma.stockMovement.count({
      where: { type: 'AUTO_DEDUCTION' },
    });
    const incidentsCount = await this.prisma.deductionIncident.count();

    const recentMovements = await this.prisma.stockMovement.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { ingredient: true } },
      },
    });

    return {
      organization: org,
      stats: {
        totalStockValue: Math.round(totalStockValue),
        totalIngredients: balances.length,
        lowStockCount,
        negativeStockCount,
        totalMovements: movementsCount,
        autoDeductionsCount,
        incidentsCount,
      },
      recentMovements,
    };
  }
}
