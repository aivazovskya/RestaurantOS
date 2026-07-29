import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('ingredients')
  async getIngredients() {
    return await this.warehouseService.getIngredients();
  }

  @Roles('OWNER', 'MANAGER', 'STOREKEEPER')
  @Post('ingredients')
  async createIngredient(@Body() data: any) {
    return await this.warehouseService.createIngredient(data);
  }

  @Get('balances')
  async getBalances(@Query('warehouseId') warehouseId?: string) {
    return await this.warehouseService.getBalances(warehouseId);
  }

  @Roles('OWNER', 'MANAGER', 'STOREKEEPER')
  @Post('receipts')
  async addStockReceipt(@Body() dto: any) {
    return await this.warehouseService.addStockReceipt(dto);
  }

  @Roles('OWNER', 'MANAGER', 'STOREKEEPER')
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
