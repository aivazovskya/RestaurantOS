import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { OrdersService, CreateOrderDto } from './orders.service';

@Controller('api/v1')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('public/orders')
  async createPublicOrder(@Body() dto: CreateOrderDto) {
    return await this.ordersService.createPublicOrder(dto);
  }

  @Get('orders')
  async getOrders(@Query('branchId') branchId?: string, @Query('status') status?: string) {
    return await this.ordersService.getOrders(branchId, status);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return await this.ordersService.updateOrderStatus(id, body.status);
  }
}
