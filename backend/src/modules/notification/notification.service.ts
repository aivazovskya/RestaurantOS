import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * NotificationService
 * NOTE: Currently operates in SIMULATION / MOCK mode for demo & MVP purposes.
 * Real SMS / WhatsApp Business API providers (e.g. Mobizon, Twilio, Meta Graph API)
 * should be integrated here for production deployment.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Queue notification (SMS / WhatsApp) for a customer (best-effort, non-blocking).
   * Note: Dispatches in mock simulation mode with a 500ms async delay.
   */
  async sendNotification(
    customerPhone: string,
    type: string,
    message: string,
    channel: 'SMS' | 'WHATSAPP' = 'SMS',
  ) {
    if (!customerPhone) return null;

    try {
      const log = await this.prisma.notificationLog.create({
        data: {
          customerPhone,
          type,
          channel,
          message,
          status: 'QUEUED',
        },
      });

      // Asynchronous non-blocking dispatch simulation (Kazakhstan SMS/WhatsApp gateway mock)
      setTimeout(async () => {
        try {
          await this.prisma.notificationLog.update({
            where: { id: log.id },
            data: { status: 'SENT' },
          });
          this.logger.log(`[MOCK GATEWAY ${channel}] Sent "${type}" to ${customerPhone}: "${message}"`);
        } catch (e: any) {
          await this.prisma.notificationLog.update({
            where: { id: log.id },
            data: { status: 'FAILED', error: e.message },
          });
        }
      }, 500);

      return log;
    } catch (e: any) {
      this.logger.error(`Failed to queue notification for ${customerPhone}: ${e.message}`);
      return null;
    }
  }

  /**
   * Fetches notification logs for audit & debugging.
   */
  async getNotificationLogs(take = 50) {
    return await this.prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
