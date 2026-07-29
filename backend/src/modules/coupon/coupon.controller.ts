import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { CouponService, CreateCouponDto } from './coupon.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1/coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  async getCoupons() {
    return await this.couponService.getCoupons();
  }

  @Roles('OWNER', 'MANAGER')
  @Post()
  async createCoupon(@Body() dto: CreateCouponDto) {
    return await this.couponService.createCoupon(dto);
  }

  @Public()
  @Post('validate')
  async validateCoupon(
    @Body() body: { code: string; totalAmount: number; customerId?: string },
  ) {
    if (!body || !body.code || typeof body.totalAmount !== 'number') {
      throw new BadRequestException('Укажите "code" и "totalAmount".');
    }
    return await this.couponService.validateCoupon(body.code, body.totalAmount, body.customerId);
  }
}
