import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AutoDeductionModule } from '../auto-deduction/auto-deduction.module';
import { StopListModule } from '../stop-list/stop-list.module';
import { CustomerModule } from '../customer/customer.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { CouponModule } from '../coupon/coupon.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    AutoDeductionModule,
    StopListModule,
    CustomerModule,
    LoyaltyModule,
    CouponModule,
    NotificationModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
