import { Controller, Get, Post, Patch, Param, Body, Query, ForbiddenException } from '@nestjs/common';
import { OrdersService, CreateOrderDto } from './orders.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post('public/orders')
  async createPublicOrder(@Body() dto: CreateOrderDto) {
    return await this.ordersService.createPublicOrder(dto);
  }

  @Get('orders')
  async getOrders(
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    // If courier is fetching orders, filter by courier's assigned deliveries or branch
    if (user?.role === 'COURIER' && user.courierId) {
      return await this.ordersService.getOrdersForCourier(user.courierId);
    }
    return await this.ordersService.getOrders(branchId, status);
  }

  @Roles('OWNER', 'MANAGER', 'CHEF')
  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return await this.ordersService.updateOrderStatus(id, body.status);
  }

  @Roles('OWNER', 'MANAGER')
  @Post('orders/:id/assign-courier')
  async assignCourier(@Param('id') id: string, @Body() body: { courierId: string }) {
    return await this.ordersService.assignCourier(id, body.courierId);
  }

  @Roles('COURIER', 'OWNER', 'MANAGER')
  @Patch('orders/:id/delivery-status')
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() body: { status: string; failureReason?: string },
    @CurrentUser() user?: any,
  ) {
    if (user?.role === 'COURIER' && user.courierId) {
      const order = await this.ordersService.getOrderById(id);
      if (order && order.courierId !== user.courierId) {
        throw new ForbiddenException('Вы можете обновлять статус только своих доставок.');
      }
    }
    return await this.ordersService.updateDeliveryStatus(id, body.status, body.failureReason);
  }
}
