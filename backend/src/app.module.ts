import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { SeedService } from './prisma/seed.service';
import { OrganizationModule } from './modules/organization/organization.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { MenuModule } from './modules/menu/menu.module';
import { AutoDeductionModule } from './modules/auto-deduction/auto-deduction.module';
import { NexiumPosModule } from './modules/nexium-pos/nexium-pos.module';
import { StopListModule } from './modules/stop-list/stop-list.module';
import { TableModule } from './modules/table/table.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomerModule } from './modules/customer/customer.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    OrganizationModule,
    WarehouseModule,
    MenuModule,
    AutoDeductionModule,
    NexiumPosModule,
    StopListModule,
    TableModule,
    OrdersModule,
    CustomerModule,
    LoyaltyModule,
    CouponModule,
    NotificationModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
