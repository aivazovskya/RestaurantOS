import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProcessPosReceiptDto } from './dto/process-receipt.dto';
import { RecipeResolverService } from '../../common/services/recipe-resolver.service';
import { StopListService } from '../stop-list/stop-list.service';
import { CustomerService } from '../customer/customer.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CouponService } from '../coupon/coupon.service';

@Injectable()
export class AutoDeductionService {
  private readonly logger = new Logger(AutoDeductionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeResolver: RecipeResolverService,
    private readonly stopListService: StopListService,
    private readonly customerService: CustomerService,
    private readonly loyaltyService: LoyaltyService,
    private readonly couponService: CouponService,
  ) {}

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

    // 3. Resolve all recipe items for sold menu items using RecipeResolverService
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

        if (!menuItem || !menuItem.recipeCard || !menuItem.recipeCard.items) {
          this.logger.warn(`No recipe card found for POS Item ${posItem.posItemId} (${posItem.name})`);
          continue;
        }

        const requirements = await this.recipeResolver.resolveIngredientRequirements(
          menuItem.recipeCard.items,
          posItem.quantity,
        );

        for (const req of requirements) {
          const existing = deductionsMap.get(req.ingredientId);
          if (existing) {
            existing.qty += req.requiredGrossAmount;
          } else {
            deductionsMap.set(req.ingredientId, {
              ingredientId: req.ingredientId,
              name: req.name,
              mainUnit: req.mainUnit,
              qty: req.requiredGrossAmount,
              unitCost: req.unitCost,
            });
          }
        }
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

    // 6. Recalculate Auto Stop-List for affected ingredients
    await this.stopListService.recalculateForIngredients(
      Array.from(deductionsMap.keys()),
      warehouse.id,
    );

    // 7. Unified Order Record for POS Cashier sales & Customer Loyalty linking
    let createdOrder: any = null;
    if (!payload.receiptId.startsWith('ONLINE-')) {
      let customer: any = null;
      if (payload.customerPhone) {
        customer = await this.customerService.findOrCreateByPhone(
          payload.customerPhone,
          payload.customerName,
        );
      }

      let discountAmount = 0;
      let couponId: string | null = null;

      if (payload.couponCode) {
        try {
          const validated = await this.couponService.validateCoupon(
            payload.couponCode,
            payload.totalAmount,
            customer?.id,
          );
          discountAmount = validated.discountAmount;
          couponId = validated.couponId;
          await this.couponService.markCouponUsed(validated.couponId);
        } catch (e: any) {
          this.logger.warn(`Coupon validation failed for receipt ${payload.receiptId}: ${e.message}`);
        }
      }

      const count = await this.prisma.order.count();
      const orderNumber = `POS-${1001 + count}`;

      const orderItems = (payload.items || []).map((i) => ({
        posItemId: i.posItemId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));

      const finalAmount = Math.max(0, payload.totalAmount - discountAmount - (payload.appliedPoints || 0));

      createdOrder = await this.prisma.order.create({
        data: {
          branchId: warehouse.branchId,
          orderNumber,
          type: 'POS_CASHIER',
          status: 'COMPLETED',
          customerId: customer?.id || null,
          customerPhone: customer?.phone || payload.customerPhone || null,
          totalAmount: finalAmount,
          discountAmount,
          appliedPoints: payload.appliedPoints || 0,
          couponId,
          comment: `Чек кассы Nexium ${payload.receiptId} (Стол: ${payload.tableNumber || 'Касса'})`,
          items: {
            create: orderItems,
          },
        },
      });

      if (customer) {
        if (payload.appliedPoints && payload.appliedPoints > 0) {
          try {
            await this.loyaltyService.redeemPoints(
              customer.id,
              payload.appliedPoints,
              createdOrder.id,
              createdOrder.orderNumber,
            );
          } catch (e: any) {
            this.logger.warn(`Failed to redeem points for POS receipt ${payload.receiptId}: ${e.message}`);
          }
        }

        // Increment customer aggregate stats
        await this.customerService.updateCustomerStats(customer.id, finalAmount, 1);

        // Earn loyalty points (5%)
        await this.loyaltyService.earnPointsForOrder(
          customer.id,
          createdOrder.id,
          createdOrder.orderNumber,
          finalAmount,
        );
      }
    }

    return {
      status: 'SUCCESS',
      receiptId: payload.receiptId,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      movementId: movement.id,
      orderId: createdOrder?.id || null,
      deductedIngredientsCount: deductionsMap.size,
      deductions: Array.from(deductionsMap.values()),
      incidents: incidentsList,
    };
  }
}
