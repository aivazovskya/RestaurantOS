import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { StopListService } from './stop-list.service';

@Controller('api/v1/menu')
export class StopListController {
  constructor(private readonly stopListService: StopListService) {}

  @Get('stop-list')
  async getStopList() {
    return await this.stopListService.getStopList();
  }

  @Get('stop-list/history')
  async getStopListHistory() {
    return await this.stopListService.getStopListHistory();
  }

  @Post('items/:id/manual-stop')
  async manualStop(@Param('id') id: string, @Body() body: { reason?: string; userId?: string }) {
    return await this.stopListService.setManualStatus(id, false, body?.reason, body?.userId);
  }

  @Post('items/:id/manual-restore')
  async manualRestore(@Param('id') id: string, @Body() body?: { userId?: string }) {
    return await this.stopListService.setManualStatus(id, true, undefined, body?.userId);
  }
}
