import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export class CreateCouponDto {
  code: string;
  discountType: 'PERCENT' | 'FIXED_AMOUNT';
  discountValue: number;
  customerId?: string;
  expiresAt?: string | Date;
}

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new coupon (generic promo code or personal customer coupon).
   */
  async createCoupon(dto: CreateCouponDto) {
    if (!dto.code || dto.discountValue <= 0) {
      throw new BadRequestException('Код купона и размер скидки обязательны.');
    }

    const cleanCode = dto.code.trim().toUpperCase();

    const existing = await this.prisma.coupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      throw new BadRequestException(`Купон с кодом "${cleanCode}" уже существует.`);
    }

    return await this.prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: dto.discountType || 'PERCENT',
        discountValue: dto.discountValue,
        customerId: dto.customerId || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  /**
   * Lists all coupons.
   */
  async getCoupons() {
    return await this.prisma.coupon.findMany({
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Validates coupon eligibility and computes discount amount for an order.
   */
  async validateCoupon(code: string, totalAmount: number, customerId?: string, txClient?: any) {
    if (!code) {
      throw new BadRequestException('Укажите код купона.');
    }

    const db = txClient || this.prisma;
    const cleanCode = code.trim().toUpperCase();
    const coupon = await db.coupon.findUnique({
      where: { code: cleanCode },
      include: { customer: true },
    });

    if (!coupon) {
      throw new NotFoundException(`Купон "${cleanCode}" не найден.`);
    }

    if (coupon.isUsed) {
      throw new BadRequestException(`Купон "${cleanCode}" уже был использован!`);
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      throw new BadRequestException(`Срок действия купона "${cleanCode}" истёк.`);
    }

    if (coupon.customerId && coupon.customerId !== customerId) {
      throw new BadRequestException(`Купон "${cleanCode}" является персональным и принадлежит другому клиенту.`);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENT') {
      discountAmount = Math.round(totalAmount * (coupon.discountValue / 100));
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(totalAmount, Math.max(0, discountAmount));
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount,
    };
  }

  /**
   * Atomically validates and marks a coupon as used to prevent double-redemption races.
   */
  async redeemCoupon(code: string, totalAmount: number, customerId?: string, txClient?: any) {
    const db = txClient || this.prisma;
    const validated = await this.validateCoupon(code, totalAmount, customerId, db);

    const result = await db.coupon.updateMany({
      where: {
        id: validated.couponId,
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(`Купон "${code}" уже был использован параллельным запросом!`);
    }

    return validated;
  }

  /**
   * Marks coupon as used once an order is created or completed.
   */
  async markCouponUsed(couponId: string, txClient?: any) {
    const db = txClient || this.prisma;
    return await db.coupon.update({
      where: { id: couponId },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });
  }

  /**
   * Releases (restores) coupon back to unused state if an order is cancelled.
   */
  async releaseCoupon(couponId: string, txClient?: any) {
    if (!couponId) return null;
    const db = txClient || this.prisma;

    try {
      return await db.coupon.update({
        where: { id: couponId },
        data: {
          isUsed: false,
          usedAt: null,
        },
      });
    } catch (e: any) {
      this.logger.warn(`Failed to release coupon ${couponId}: ${e.message}`);
      return null;
    }
  }
}
