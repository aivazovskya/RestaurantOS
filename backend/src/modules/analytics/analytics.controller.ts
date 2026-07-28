import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  async getRevenue(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    return await this.analyticsService.getRevenue(from, to, groupBy);
  }

  @Get('top-items')
  async getTopItems(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return await this.analyticsService.getTopItems(from, to, parsedLimit);
  }

  @Get('stock-incidents')
  async getStockIncidents(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return await this.analyticsService.getStockIncidents(from, to);
  }

  @Get('stoplist-frequency')
  async getStopListFrequency(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return await this.analyticsService.getStopListFrequency(from, to);
  }

  @Get('purchase-forecast')
  async getPurchaseForecast(
    @Query('branchId') branchId?: string,
    @Query('days') days?: string,
  ) {
    const parsedDays = days ? parseInt(days, 10) : 14;
    return await this.analyticsService.getPurchaseForecast(branchId, parsedDays);
  }

  @Get('flagged-operations')
  async getFlaggedOperations(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return await this.analyticsService.getFlaggedOperations(from, to);
  }
}
