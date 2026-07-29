import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserJwtPayload } from '../decorators/current-user.decorator';

export const JWT_SECRET = process.env.JWT_SECRET || 'restaurantos_jwt_secret_key_2026';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
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
