import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

export const DEFAULT_LOYALTY_RATE = 0.05; // 5% cashback in points
export const POINTS_TO_KZT_RATE = 1; // Explicit conversion rate: 1 point = 1 KZT

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Earns 5% points for a COMPLETED order using atomic increment.
   */
  async earnPointsForOrder(customerId: string, orderId: string, orderNumber: string, totalAmount: number, txClient?: any) {
    if (!customerId || totalAmount <= 0) return null;
    const db = txClient || this.prisma;

    const points = Math.floor(totalAmount * DEFAULT_LOYALTY_RATE);
    if (points <= 0) return null;

    // Check idempotency
    const existing = await db.loyaltyTransaction.findFirst({
      where: { customerId, orderId, type: 'EARNED' },
    });
    if (existing) return existing;

    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (!customer) return null;

    // Atomic points increment
    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { increment: points } },
    });

    const tx = await db.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'EARNED',
        points,
        orderId,
        comment: `Начисление 5% баллов за заказ ${orderNumber} (${totalAmount.toLocaleString('ru-RU')} ₸)`,
      },
    });

    this.logger.log(`Earned ${points} loyalty points for Customer ${customer.phone} on Order ${orderNumber}`);

    // Notify guest via SMS/WhatsApp
    await this.notificationService.sendNotification(
      customer.phone,
      'POINTS_EARNED',
      `Вам начислено +${points} баллов за заказ ${orderNumber}! Ваш баланс: ${updatedCustomer.loyaltyPoints} Б.`,
    );

    return tx;
  }

  /**
   * Redeems loyalty points for an order discount using atomic conditional update.
   */
  async redeemPoints(customerId: string, pointsToRedeem: number, orderId?: string, orderNumber?: string, txClient?: any) {
    if (pointsToRedeem <= 0) return null;
    const db = txClient || this.prisma;

    // Atomic check-and-decrement: only update if current balance >= pointsToRedeem
    const result = await db.customer.updateMany({
      where: { id: customerId, loyaltyPoints: { gte: pointsToRedeem } },
      data: { loyaltyPoints: { decrement: pointsToRedeem } },
    });

    if (result.count === 0) {
      const customer = await db.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new NotFoundException(`Customer ${customerId} not found.`);
      }
      throw new BadRequestException(
        `Недостаточно баллов лояльности! Баланс: ${customer.loyaltyPoints} Б, запрошено: ${pointsToRedeem} Б.`,
      );
    }

    const customer = await db.customer.findUnique({ where: { id: customerId } });

    const tx = await db.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'REDEEMED',
        points: -pointsToRedeem,
        orderId: orderId || null,
        comment: `Списание баллов при оплате заказа ${orderNumber || 'касса/онлайн'} (-${pointsToRedeem} ₸)`,
      },
    });

    this.logger.log(`Redeemed ${pointsToRedeem} points for Customer ${customer?.phone || customerId}`);
    return tx;
  }

  /**
   * Reverses earned points if a COMPLETED order is CANCELLED using atomic decrement.
   */
  async reverseEarnedPoints(customerId: string, orderId: string, orderNumber: string, txClient?: any) {
    const db = txClient || this.prisma;

    const earnedTx = await db.loyaltyTransaction.findFirst({
      where: { customerId, orderId, type: 'EARNED' },
    });

    if (!earnedTx) return null;

    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (!customer) return null;

    const pointsToDeduct = earnedTx.points;

    // Atomic decrement (ensuring non-negative result via transaction check if needed)
    await db.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { decrement: pointsToDeduct } },
    });

    return await db.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'MANUAL_ADJUSTMENT',
        points: -pointsToDeduct,
        orderId,
        comment: `Отмена начислений баллов по отмененному заказу ${orderNumber}`,
      },
    });
  }

  /**
   * Manual points adjustment by manager/staff with required comment.
   */
  async adjustPointsManually(customerId: string, points: number, comment: string, txClient?: any) {
    if (!comment || comment.trim().length === 0) {
      throw new BadRequestException('При корректировке баллов обязателен комментарий!');
    }
    const db = txClient || this.prisma;

    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found.`);
    }

    await db.customer.update({
      where: { id: customerId },
      data: points > 0 ? { loyaltyPoints: { increment: points } } : { loyaltyPoints: { decrement: Math.abs(points) } },
    });

    const tx = await db.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'MANUAL_ADJUSTMENT',
        points,
        comment: `Ручная корректировка менеджера: ${comment}`,
      },
    });

    this.logger.log(`Manual points adjustment for ${customer.phone}: ${points > 0 ? '+' : ''}${points} points.`);
    return tx;
  }

  /**
   * Fetches loyalty transaction history for a customer.
   */
  async getLoyaltyHistory(customerId: string) {
    return await this.prisma.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
