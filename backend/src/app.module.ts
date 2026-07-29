import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { SeedService } from './prisma/seed.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
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
import { CourierModule } from './modules/courier/courier.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
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
    CourierModule,
    AnalyticsModule,
    AiChatModule,
  ],
  providers: [
    SeedService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
