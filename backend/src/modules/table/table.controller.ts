import { Controller, Get, Post, Param } from '@nestjs/common';
import { TableService } from './table.service';

@Controller('api/v1')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get('tables')
  async getTables() {
    return await this.tableService.getTables();
  }

  @Get('public/menu/:qrSlug')
  async getPublicMenu(@Param('qrSlug') qrSlug: string) {
    return await this.tableService.getPublicMenuBySlug(qrSlug);
  }

  @Post('public/tables/:qrSlug/call-waiter')
  async callWaiter(@Param('qrSlug') qrSlug: string) {
    return await this.tableService.callWaiter(qrSlug);
  }
}
