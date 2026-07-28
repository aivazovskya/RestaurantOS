import { Controller, Get, Post, Param, Query, Body, BadRequestException } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('api/v1/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async getCustomers(@Query('search') search?: string) {
    return await this.customerService.getCustomers(search);
  }

  @Post('by-phone')
  async findOrCreateByPhone(@Body() body: { phone: string; name?: string }) {
    if (!body || !body.phone) {
      throw new BadRequestException('Phone number is required.');
    }
    return await this.customerService.findOrCreateByPhone(body.phone, body.name);
  }

  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    return await this.customerService.getCustomerById(id);
  }
}
