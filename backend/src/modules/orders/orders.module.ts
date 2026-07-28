import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AutoDeductionModule } from '../auto-deduction/auto-deduction.module';
import { StopListModule } from '../stop-list/stop-list.module';

@Module({
  imports: [AutoDeductionModule, StopListModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
