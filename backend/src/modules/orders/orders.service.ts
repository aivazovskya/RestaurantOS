import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AutoDeductionService } from '../auto-deduction/auto-deduction.service';
import { StopListService } from '../stop-list/stop-list.service';
import { EventsGateway } from '../../common/gateways/events.gateway';

export class CreateOrderDto {
  qrSlug?: string;
  type?: 'DINE_IN_QR' | 'PICKUP' | 'DELIVERY';
  customerPhone?: string;
  comment?: string;
  items: Array<{
    posItemId: string;
    quantity: number;
  }>;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly autoDeductionService: AutoDeductionService,
    private readonly stopListService: StopListService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Creates a new public order from guest (QR-menu or Online app).
   * Initial status is NEW (stock deduction does not happen until kitchen ACCEPTED).
   */
  async createPublicOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least 1 item.');
    }

    // Resolve branch and table if QR slug is provided
    let branch = await this.prisma.branch.findFirst();
    let table: any = null;

    if (dto.qrSlug) {
      table = await this.prisma.diningTable.findUnique({
        where: { qrSlug: dto.qrSlug },
        include: { branch: true },
      });
      if (table && table.branch) {
        branch = table.branch;
      }
    }

    if (!branch) {
      throw new NotFoundException('Active branch not found for order creation.');
    }

    // Validate item availability & calculate total price
    let totalAmount = 0;
    const orderItemsData: Array<{ posItemId: string; name: string; quantity: number; price: number }> = [];

    for (const item of dto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { posItemId: item.posItemId },
      });

      if (!menuItem) {
        throw new NotFoundException(`MenuItem with POS ID ${item.posItemId} not found.`);
      }

      if (!menuItem.isAvailable) {
        throw new BadRequestException(`Блюдо "${menuItem.name}" находится в стоп-листе и недоступно для заказа.`);
      }

      const itemTotal = menuItem.sellingPrice * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        posItemId: menuItem.posItemId,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.sellingPrice,
      });
    }

    const count = await this.prisma.order.count();
    const orderNumber = `ORD-${1001 + count}`;

    const order = await this.prisma.order.create({
      data: {
        branchId: branch.id,
        orderNumber,
        type: dto.type || (table ? 'DINE_IN_QR' : 'PICKUP'),
        status: 'NEW',
        tableId: table ? table.id : null,
        customerPhone: dto.customerPhone || null,
        totalAmount,
        comment: dto.comment || (table ? `Заказ со стола ${table.label}` : 'Онлайн-заказ'),
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    this.logger.log(`New Order ${order.orderNumber} created in NEW status.`);

    // Broadcast WS event to KDS & Staff
    this.eventsGateway.emitOrderCreated(branch.id, order);

    return order;
  }

  async getOrders(branchId?: string, status?: string) {
    const targetBranch = branchId
      ? await this.prisma.branch.findUnique({ where: { id: branchId } })
      : await this.prisma.branch.findFirst();

    if (!targetBranch) return [];

    return await this.prisma.order.findMany({
      where: {
        branchId: targetBranch.id,
        ...(status ? { status } : {}),
      },
      include: {
        items: true,
        table: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Updates order status and manages auto-deduction and stock reversals.
   */
  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, table: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    const previousStatus = order.status;
    if (previousStatus === status) {
      return order;
    }

    // 1. Transition to ACCEPTED: Execute Auto-Deduction with namespace ONLINE-{order.id}
    if (status === 'ACCEPTED' && previousStatus === 'NEW') {
      // Re-verify that items are not on stop-list
      for (const item of order.items) {
        const menuItem = await this.prisma.menuItem.findUnique({ where: { posItemId: item.posItemId } });
        if (menuItem && !menuItem.isAvailable) {
          throw new BadRequestException(`Нельзя принять заказ: блюдо "${menuItem.name}" уже находится в стоп-листе!`);
        }
      }

      await this.autoDeductionService.processReceipt({
        receiptId: `ONLINE-${order.id}`,
        branchId: order.branchId,
        tableNumber: order.table ? order.table.label : 'Онлайн-заказ',
        paymentType: 'ONLINE_ORDER',
        totalAmount: order.totalAmount,
        items: order.items.map((i) => ({
          posItemId: i.posItemId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      });
    }

    // 2. Transition to CANCELLED (if order was previously ACCEPTED or later): Perform Stock Reversal
    if (status === 'CANCELLED' && ['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'].includes(previousStatus)) {
      const deductionMovement = await this.prisma.stockMovement.findFirst({
        where: { referenceId: `ONLINE-${order.id}` },
        include: { items: true },
      });

      if (deductionMovement) {
        const warehouseId = deductionMovement.warehouseId;
        const reversalItems: Array<{ ingredientId: string; quantity: number; unitCost: number }> = [];
        const affectedIngredientIds: string[] = [];

        for (const item of deductionMovement.items) {
          const positiveQty = Math.abs(item.quantity);
          const balance = await this.prisma.stockBalance.findUnique({
            where: {
              warehouseId_ingredientId: {
                warehouseId,
                ingredientId: item.ingredientId,
              },
            },
          });

          if (balance) {
            await this.prisma.stockBalance.update({
              where: { id: balance.id },
              data: { quantity: balance.quantity + positiveQty },
            });
          }

          reversalItems.push({
            ingredientId: item.ingredientId,
            quantity: positiveQty,
            unitCost: item.unitCost,
          });

          affectedIngredientIds.push(item.ingredientId);
        }

        await this.prisma.stockMovement.create({
          data: {
            warehouseId,
            type: 'ORDER_CANCELLATION_REVERSAL',
            referenceId: `ONLINE-${order.id}`,
            comment: `Возврат сырья по отмененному заказу ${order.orderNumber}`,
            items: { create: reversalItems },
          },
        });

        // Recalculate stop-list for restored ingredients
        await this.stopListService.recalculateForIngredients(affectedIngredientIds, warehouseId);
      }
    }

    // Update order record
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true, table: true },
    });

    // Broadcast WS event
    this.eventsGateway.emitOrderStatusChanged(order.branchId, order.id, status, updatedOrder);

    return updatedOrder;
  }
}
