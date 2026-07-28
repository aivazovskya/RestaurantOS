import { Controller, Get, Post, Patch, Param, Query, Body, BadRequestException } from '@nestjs/common';
import { CourierService, CreateCourierDto } from './courier.service';

@Controller('api/v1/couriers')
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Get()
  async getCouriers(
    @Query('branchId') branchId?: string,
    @Query('status') status?: 'OFFLINE' | 'AVAILABLE' | 'ON_DELIVERY',
  ) {
    return await this.courierService.getCouriers(branchId, status);
  }

  @Post()
  async createCourier(@Body() dto: CreateCourierDto) {
    return await this.courierService.createCourier(dto);
  }

  @Get(':id')
  async getCourierById(@Param('id') id: string) {
    return await this.courierService.getCourierById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'OFFLINE' | 'AVAILABLE' | 'ON_DELIVERY' },
  ) {
    if (!body || !body.status) {
      throw new BadRequestException('Поле "status" обязательно.');
    }
    return await this.courierService.updateCourierStatus(id, body.status);
  }
}
