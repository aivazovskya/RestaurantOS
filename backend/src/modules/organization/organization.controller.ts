import { Controller, Get } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('api/v1/organization')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get('dashboard-summary')
  async getDashboardSummary() {
    return await this.orgService.getDashboardSummary();
  }
}
