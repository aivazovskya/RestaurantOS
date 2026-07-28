import { Module } from '@nestjs/common';
import { AutoDeductionService } from './auto-deduction.service';
import { StopListModule } from '../stop-list/stop-list.module';
import { CustomerModule } from '../customer/customer.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { CouponModule } from '../coupon/coupon.module';

@Module({
  imports: [
    StopListModule,
    CustomerModule,
    LoyaltyModule,
    CouponModule,
  ],
  providers: [AutoDeductionService],
  exports: [AutoDeductionService],
})
export class AutoDeductionModule {}
