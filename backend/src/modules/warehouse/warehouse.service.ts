import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async getIngredients() {
    return await this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createIngredient(data: any) {
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

    // Initialize balance in main warehouse
    const warehouse = await this.prisma.warehouse.findFirst();
    if (warehouse) {
      await this.prisma.stockBalance.create({
        data: {
          warehouseId: warehouse.id,
          ingredientId: ingredient.id,
          quantity: Number(data.initialStock) || 0,
        },
      });
    }

    return ingredient;
  }

  async getBalances(warehouseId?: string) {
    const targetWarehouse = warehouseId
      ? await this.prisma.warehouse.findUnique({ where: { id: warehouseId } })
      : await this.prisma.warehouse.findFirst();

    if (!targetWarehouse) return [];

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

  async addStockReceipt(dto: { warehouseId?: string; invoiceNumber?: string; items: Array<{ ingredientId: string; quantity: number; unitCost: number }> }) {
    let warehouse = dto.warehouseId
      ? await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } })
      : await this.prisma.warehouse.findFirst();

    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const movementItems: Array<{ ingredientId: string; quantity: number; unitCost: number }> = [];

    for (const item of dto.items) {
      const ingredient = await this.prisma.ingredient.findUnique({ where: { id: item.ingredientId } });
      if (!ingredient) continue;

      const qty = Number(item.quantity);
      const cost = Number(item.unitCost) || ingredient.costPerUnit;

      // Update balance
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
      } else {
        await this.prisma.stockBalance.create({
          data: {
            warehouseId: warehouse.id,
            ingredientId: ingredient.id,
            quantity: qty,
          },
        });
      }

      // Update ingredient cost if provided
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

    return movement;
  }

  async addManualWriteOff(dto: { warehouseId?: string; reason?: string; items: Array<{ ingredientId: string; quantity: number }> }) {
    let warehouse = dto.warehouseId
      ? await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } })
      : await this.prisma.warehouse.findFirst();

    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const movementItems: Array<{ ingredientId: string; quantity: number; unitCost: number }> = [];

    for (const item of dto.items) {
      const ingredient = await this.prisma.ingredient.findUnique({ where: { id: item.ingredientId } });
      if (!ingredient) continue;

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
    }

    return await this.prisma.stockMovement.create({
      data: {
        warehouseId: warehouse.id,
        type: 'MANUAL_WRITE_OFF',
        comment: dto.reason || 'Ручное списание (порча/брак)',
        items: { create: movementItems },
      },
      include: { items: { include: { ingredient: true } } },
    });
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
}
