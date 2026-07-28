import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';

@Controller('api/v1/warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('ingredients')
  async getIngredients() {
    return await this.warehouseService.getIngredients();
  }

  @Post('ingredients')
  async createIngredient(@Body() data: any) {
    return await this.warehouseService.createIngredient(data);
  }

  @Get('balances')
  async getBalances(@Query('warehouseId') warehouseId?: string) {
    return await this.warehouseService.getBalances(warehouseId);
  }

  @Post('receipts')
  async addStockReceipt(@Body() dto: any) {
    return await this.warehouseService.addStockReceipt(dto);
  }

  @Post('write-offs')
  async addManualWriteOff(@Body() dto: any) {
    return await this.warehouseService.addManualWriteOff(dto);
  }

  @Get('movements')
  async getMovements() {
    return await this.warehouseService.getMovements();
  }

  @Get('incidents')
  async getIncidents() {
    return await this.warehouseService.getIncidents();
  }
}
