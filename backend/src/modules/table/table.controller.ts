import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { TableService, CreateReservationDto } from './table.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get('tables')
  async getTables() {
    return await this.tableService.getTables();
  }

  @Public()
  @Get('public/menu/:qrSlug')
  async getPublicMenu(@Param('qrSlug') qrSlug: string) {
    return await this.tableService.getPublicMenuBySlug(qrSlug);
  }

  @Public()
  @Post('public/tables/:qrSlug/call-waiter')
  async callWaiter(@Param('qrSlug') qrSlug: string) {
    return await this.tableService.callWaiter(qrSlug);
  }

  @Post('tables/reservations')
  async createReservation(@Body() dto: CreateReservationDto) {
    return await this.tableService.createReservation(dto);
  }

  @Get('tables/reservations')
  async getReservations(@Query('branchId') branchId?: string) {
    return await this.tableService.getReservations(branchId);
  }

  @Patch('tables/reservations/:id/cancel')
  async cancelReservation(@Param('id') id: string) {
    return await this.tableService.cancelReservation(id);
  }
}
