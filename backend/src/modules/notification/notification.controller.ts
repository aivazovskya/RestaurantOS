import { Controller, Get, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('api/v1/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('logs')
  async getLogs(@Query('take') take?: string) {
    const limit = take ? parseInt(take, 10) : 50;
    return await this.notificationService.getNotificationLogs(limit);
  }
}
