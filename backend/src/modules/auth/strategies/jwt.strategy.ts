import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserJwtPayload } from '../decorators/current-user.decorator';

export const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET не задан в переменных окружения. Приложение не может запуститься без него.');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET!,
    });
  }

  async validate(payload: any): Promise<UserJwtPayload> {
    return {
      sub: payload.sub,
      userId: payload.sub,
      role: payload.role,
      organizationId: payload.organizationId,
      branchIds: payload.branchIds || [],
      courierId: payload.courierId,
      email: payload.email,
      fullName: payload.fullName,
    };
  }
}
