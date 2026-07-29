import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { email?: string; password?: string }) {
    if (!body || !body.email || !body.password) {
      throw new BadRequestException('Укажите "email" и "password".');
    }
    return await this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('courier-login')
  async courierLogin(@Body() body: { phone?: string; pinCode?: string }) {
    if (!body || !body.phone || !body.pinCode) {
      throw new BadRequestException('Укажите "phone" и "pinCode".');
    }
    return await this.authService.courierLogin(body.phone, body.pinCode);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: { refreshToken?: string }) {
    if (!body || !body.refreshToken) {
      throw new BadRequestException('Поле "refreshToken" обязательно.');
    }
    return await this.authService.refreshToken(body.refreshToken);
  }

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return await this.authService.getMe(user.sub, user.role);
  }
}
