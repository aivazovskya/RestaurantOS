import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { StopListService } from './stop-list.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

  @Roles('OWNER', 'MANAGER')
  @Post('items/:id/manual-stop')
  async manualStop(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user?: any,
  ) {
    return await this.stopListService.setManualStatus(id, false, body?.reason, user?.userId);
  }

  @Roles('OWNER', 'MANAGER')
  @Post('items/:id/manual-restore')
  async manualRestore(
    @Param('id') id: string,
    @CurrentUser() user?: any,
  ) {
    return await this.stopListService.setManualStatus(id, true, undefined, user?.userId);
  }
}
