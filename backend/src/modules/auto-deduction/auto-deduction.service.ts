import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UnitConverter } from '../../common/utils/unit-converter';
import { ProcessPosReceiptDto } from './dto/process-receipt.dto';

@Injectable()
export class AutoDeductionService {
  private readonly logger = new Logger(AutoDeductionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processReceipt(payload: ProcessPosReceiptDto) {
    // 1. Idempotency Check: check if movement for receiptId already processed
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

    // 2. Resolve target warehouse (Branch main warehouse or first warehouse)
    let warehouse = await this.prisma.warehouse.findFirst({
      where: payload.branchId ? { branchId: payload.branchId } : {},
    });

    if (!warehouse) {
      warehouse = await this.prisma.warehouse.findFirst();
    }

    if (!warehouse) {
      throw new NotFoundException('No active warehouse found for auto-deduction.');
    }

    // Accumulator for ingredient deductions: ingredientId -> { ingredient, deductedQty, unitCost }
    const deductionsMap = new Map<
      string,
      { ingredientId: string; name: string; mainUnit: string; qty: number; unitCost: number }
    >();

    const incidentsList: Array<{
      ingredientId: string;
      name: string;
      requested: number;
      available: number;
      shortage: number;
    }> = [];

    // 3. Resolve all recipe items for sold menu items
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

        await this.resolveRecipeDeductions(
          menuItem.recipeCard.items,
          posItem.quantity,
          deductionsMap,
        );
      }
    }

    if (deductionsMap.size === 0) {
      return {
        status: 'NO_OP',
        message: 'No ingredients matched recipe cards for this receipt.',
        receiptId: payload.receiptId,
      };
    }

    // 4. Perform atomic Stock Balance updates & Record Movement
    const movementItemsData: Array<{ ingredientId: string; quantity: number; unitCost: number }> = [];

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
      } else {
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

    // 5. Create Movement Audit Log
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

  private async resolveRecipeDeductions(
    recipeItems: any[],
    soldQuantity: number,
    deductionsMap: Map<string, { ingredientId: string; name: string; mainUnit: string; qty: number; unitCost: number }>,
  ) {
    for (const item of recipeItems) {
      const ingredient = item.ingredient;
      const grossInMainUnit = UnitConverter.convertToMainUnit(
        item.grossAmount,
        item.unit,
        ingredient.mainUnit,
      );

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
      } else {
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
}
