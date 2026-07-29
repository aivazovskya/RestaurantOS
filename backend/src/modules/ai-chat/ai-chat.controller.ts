import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('OWNER', 'MANAGER')
@Controller('api/v1/ai')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('chat')
  async chat(@Body() body: { message: string; sessionId?: string }) {
    if (!body || !body.message || !body.message.trim()) {
      throw new BadRequestException('Поле "message" обязательно для общения с AI-ассистентом.');
    }
    return await this.aiChatService.processChatMessage(body.message, body.sessionId);
  }
}
