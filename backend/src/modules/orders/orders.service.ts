import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AutoDeductionService } from '../auto-deduction/auto-deduction.service';
import { StopListService } from '../stop-list/stop-list.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { CustomerService } from '../customer/customer.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CouponService } from '../coupon/coupon.service';
import { NotificationService } from '../notification/notification.service';

export class CreateOrderDto {
  qrSlug?: string;
  type?: 'DINE_IN_QR' | 'PICKUP' | 'DELIVERY';
  customerPhone?: string;
  customerName?: string;
  deliveryAddress?: string;
  appliedPoints?: number;
  couponCode?: string;
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
    private readonly customerService: CustomerService,
    private readonly loyaltyService: LoyaltyService,
    private readonly couponService: CouponService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Creates a new public order from guest (QR-menu or Online app).
   * Initial status is NEW (stock deduction does not happen until kitchen ACCEPTED).
   */
  async createPublicOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Заказ должен содержать хотя бы одну позицию.');
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

    const orderType = dto.type || (table ? 'DINE_IN_QR' : 'PICKUP');

    if (orderType === 'DELIVERY') {
      if (!dto.deliveryAddress || !dto.deliveryAddress.trim()) {
        throw new BadRequestException('Укажите адрес доставки!');
      }
    }

    // Resolve or create Customer if phone provided
    let customer: any = null;
    if (dto.customerPhone) {
      customer = await this.customerService.findOrCreateByPhone(dto.customerPhone, dto.customerName);
    }

    // Validate item availability & calculate total price
    let subtotal = 0;
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
      subtotal += itemTotal;

      orderItemsData.push({
        posItemId: menuItem.posItemId,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.sellingPrice,
      });
    }

    // Apply Coupon if provided
    let discountAmount = 0;
    let couponId: string | null = null;

    if (dto.couponCode) {
      const validated = await this.couponService.validateCoupon(dto.couponCode, subtotal, customer?.id);
      discountAmount = validated.discountAmount;
      couponId = validated.couponId;
      await this.couponService.markCouponUsed(couponId);
    }

    // Calculate final total amount after coupon and loyalty points redemption
    const appliedPoints = dto.appliedPoints || 0;
    if (customer && appliedPoints > 0) {
      if (customer.loyaltyPoints < appliedPoints) {
        throw new BadRequestException(`Недостаточно баллов! На балансе: ${customer.loyaltyPoints} Б.`);
      }
    }

    const finalTotal = Math.max(0, subtotal - discountAmount - appliedPoints);

    const count = await this.prisma.order.count();
    const orderNumber = `ORD-${1001 + count}`;

    const order = await this.prisma.order.create({
      data: {
        branchId: branch.id,
        orderNumber,
        type: orderType,
        status: 'NEW',
        tableId: table ? table.id : null,
        customerId: customer?.id || null,
        customerPhone: customer?.phone || dto.customerPhone || null,
        deliveryAddress: orderType === 'DELIVERY' ? dto.deliveryAddress?.trim() : null,
        deliveryStatus: orderType === 'DELIVERY' ? 'PENDING_ASSIGNMENT' : null,
        totalAmount: finalTotal,
        discountAmount,
        appliedPoints,
        couponId,
        comment: dto.comment || (table ? `Заказ со стола ${table.label}` : 'Онлайн-заказ'),
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
        table: true,
        customer: true,
        courier: true,
      },
    });

    if (customer && appliedPoints > 0) {
      await this.loyaltyService.redeemPoints(customer.id, appliedPoints, order.id, order.orderNumber);
    }

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
        customer: true,
        courier: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Updates order status and manages auto-deduction, customer stats, loyalty points, and stock reversals.
   */
  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, table: true, customer: true },
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
        customerPhone: order.customerPhone || undefined,
        items: order.items.map((i) => ({
          posItemId: i.posItemId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      });
    }

    // 2. Notification on READY status for PICKUP / DINE_IN
    if (status === 'READY' && order.customerPhone) {
      await this.notificationService.sendNotification(
        order.customerPhone,
        'ORDER_READY',
        `Ваш заказ ${order.orderNumber} готов к выдаче! Приятного аппетита.`,
      );
    }

    // 3. Transition to COMPLETED: Increment customer stats & Earn 5% loyalty points
    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      let customerId = order.customerId;
      if (!customerId && order.customerPhone) {
        const c = await this.customerService.findOrCreateByPhone(order.customerPhone);
        if (c) customerId = c.id;
      }

      if (customerId) {
        // Increment totalSpent & visitsCount
        await this.customerService.updateCustomerStats(customerId, order.totalAmount, 1);
        // Earn loyalty points
        await this.loyaltyService.earnPointsForOrder(customerId, order.id, order.orderNumber, order.totalAmount);
      }
    }

    // 4. Transition to CANCELLED: Stock reversal & Customer stats / Loyalty reversal
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

      // Reverse customer stats & loyalty points if order was previously COMPLETED
      if (previousStatus === 'COMPLETED' && order.customerId) {
        await this.customerService.updateCustomerStats(order.customerId, -order.totalAmount, -1);
        await this.loyaltyService.reverseEarnedPoints(order.customerId, order.id, order.orderNumber);
      }
    }

    // Update order record
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status, customerId: order.customerId },
      include: { items: true, table: true, customer: true, courier: true },
    });

    // Broadcast WS event
    this.eventsGateway.emitOrderStatusChanged(order.branchId, order.id, status, updatedOrder);

    return updatedOrder;
  }

  /**
   * Assigns an available courier to a delivery order (Dispatcher action).
   */
  async assignCourier(orderId: string, courierId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { courier: true, items: true, table: true, customer: true },
    });

    if (!order) {
      throw new NotFoundException(`Заказ ${orderId} не найден.`);
    }

    if (order.type !== 'DELIVERY') {
      throw new BadRequestException('Назначить курьера можно только для заказов типа DELIVERY.');
    }

    const courier = await this.prisma.courier.findUnique({
      where: { id: courierId },
    });

    if (!courier) {
      throw new NotFoundException(`Курьер ${courierId} не найден.`);
    }

    if (courier.status !== 'AVAILABLE') {
      throw new BadRequestException(`Нельзя назначить курьера ${courier.name}. Он должен быть в статусе AVAILABLE (текущий: ${courier.status}).`);
    }

    // Update order with courier and set deliveryStatus to ASSIGNED
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        courierId,
        deliveryStatus: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: {
        courier: true,
        items: true,
        customer: true,
      },
    });

    // Update courier status to ON_DELIVERY
    await this.prisma.courier.update({
      where: { id: courierId },
      data: { status: 'ON_DELIVERY' },
    });

    this.logger.log(`Order ${order.orderNumber} assigned to Courier ${courier.name} (${courier.phone}).`);

    // Broadcast WS event
    this.eventsGateway.emitDeliveryAssigned(updatedOrder.branchId, updatedOrder);

    return updatedOrder;
  }

  /**
   * Updates delivery status of an assigned order (Courier action).
   * Status progression: ASSIGNED -> PICKED_UP -> EN_ROUTE -> DELIVERED / FAILED.
   */
  async updateDeliveryStatus(orderId: string, deliveryStatus: string, failureReason?: string) {
    const validStatuses = ['ASSIGNED', 'PICKED_UP', 'EN_ROUTE', 'DELIVERED', 'FAILED'];
    if (!validStatuses.includes(deliveryStatus)) {
      throw new BadRequestException(`Недопустимый статус доставки: ${deliveryStatus}`);
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { courier: true },
    });

    if (!order) {
      throw new NotFoundException(`Заказ ${orderId} не найден.`);
    }

    if (deliveryStatus === 'FAILED' && (!failureReason || !failureReason.trim())) {
      throw new BadRequestException('Для статуса FAILED обязательна причина неуспешной доставки (failureReason).');
    }

    const updateData: any = {
      deliveryStatus,
    };

    if (deliveryStatus === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    } else if (deliveryStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    } else if (deliveryStatus === 'FAILED') {
      updateData.failureReason = failureReason?.trim();
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        courier: true,
        items: true,
        customer: true,
      },
    });

    // Handle DELIVERED: transition main order status to COMPLETED (triggers Phase 3 loyalty points) & free courier
    if (deliveryStatus === 'DELIVERED') {
      await this.updateOrderStatus(orderId, 'COMPLETED');
      if (order.courierId) {
        await this.prisma.courier.update({
          where: { id: order.courierId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    // Handle FAILED: free courier back to AVAILABLE
    if (deliveryStatus === 'FAILED' && order.courierId) {
      await this.prisma.courier.update({
        where: { id: order.courierId },
        data: { status: 'AVAILABLE' },
      });
    }

    this.logger.log(`Order ${order.orderNumber} delivery status updated to ${deliveryStatus}`);

    // Broadcast WS event
    this.eventsGateway.emitDeliveryStatusChanged(updatedOrder.branchId, {
      orderId: updatedOrder.id,
      deliveryStatus,
      order: updatedOrder,
    });

    return updatedOrder;
  }
}
