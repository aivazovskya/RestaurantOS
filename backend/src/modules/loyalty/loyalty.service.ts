import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

export const DEFAULT_LOYALTY_RATE = 0.05; // 5% cashback in points

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Earns 5% points for a COMPLETED order.
   */
  async earnPointsForOrder(customerId: string, orderId: string, orderNumber: string, totalAmount: number) {
    if (!customerId || totalAmount <= 0) return null;

    const points = Math.floor(totalAmount * DEFAULT_LOYALTY_RATE);
    if (points <= 0) return null;

    // Check if points were already earned for this order (idempotency)
    const existing = await this.prisma.loyaltyTransaction.findFirst({
      where: { customerId, orderId, type: 'EARNED' },
    });
    if (existing) return existing;

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return null;

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: customer.loyaltyPoints + points },
    });

    const tx = await this.prisma.loyaltyTransaction.create({
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
      `Вам начислено +${points} баллов за заказ ${orderNumber}! Ваш баланс: ${customer.loyaltyPoints + points} Б.`,
    );

    return tx;
  }

  /**
   * Redeems loyalty points for an order discount.
   */
  async redeemPoints(customerId: string, pointsToRedeem: number, orderId?: string, orderNumber?: string) {
    if (pointsToRedeem <= 0) return null;

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found.`);
    }

    if (customer.loyaltyPoints < pointsToRedeem) {
      throw new BadRequestException(
        `Недостаточно баллов лояльности! Баланс: ${customer.loyaltyPoints} Б, запрошено: ${pointsToRedeem} Б.`,
      );
    }

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: customer.loyaltyPoints - pointsToRedeem },
    });

    const tx = await this.prisma.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'REDEEMED',
        points: -pointsToRedeem,
        orderId: orderId || null,
        comment: `Списание баллов при оплате заказа ${orderNumber || 'касса/онлайн'} (-${pointsToRedeem} ₸)`,
      },
    });

    this.logger.log(`Redeemed ${pointsToRedeem} points for Customer ${customer.phone}`);
    return tx;
  }

  /**
   * Reverses earned points if a COMPLETED order is CANCELLED.
   */
  async reverseEarnedPoints(customerId: string, orderId: string, orderNumber: string) {
    const earnedTx = await this.prisma.loyaltyTransaction.findFirst({
      where: { customerId, orderId, type: 'EARNED' },
    });

    if (!earnedTx) return null;

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return null;

    const pointsToDeduct = earnedTx.points;
    const newBalance = Math.max(0, customer.loyaltyPoints - pointsToDeduct);

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: newBalance },
    });

    return await this.prisma.loyaltyTransaction.create({
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
  async adjustPointsManually(customerId: string, points: number, comment: string) {
    if (!comment || comment.trim().length === 0) {
      throw new BadRequestException('При корректировке баллов обязателен комментарий!');
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found.`);
    }

    const newBalance = Math.max(0, customer.loyaltyPoints + points);

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: newBalance },
    });

    const tx = await this.prisma.loyaltyTransaction.create({
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
