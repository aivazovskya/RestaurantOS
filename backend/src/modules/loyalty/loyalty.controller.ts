import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

@Controller('api/v1/customers/:id/loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('history')
  async getLoyaltyHistory(@Param('id') customerId: string) {
    return await this.loyaltyService.getLoyaltyHistory(customerId);
  }

  @Post('adjust')
  async adjustPoints(
    @Param('id') customerId: string,
    @Body() body: { points: number; comment: string },
  ) {
    if (typeof body.points !== 'number' || !body.comment) {
      throw new BadRequestException('Поля "points" (число) и "comment" (строка) обязательны.');
    }
    return await this.loyaltyService.adjustPointsManually(customerId, body.points, body.comment);
  }
}
