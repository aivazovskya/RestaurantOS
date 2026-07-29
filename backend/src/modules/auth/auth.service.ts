import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LOCAL_CREDENTIAL_PROVIDER } from './auth.constants';
import { LocalCredentialProvider } from './credential-providers/local-credential.provider';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(LOCAL_CREDENTIAL_PROVIDER)
    private readonly credentialProvider: LocalCredentialProvider,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(email: string, password: string) {
    const verifiedPayload = await this.credentialProvider.verify(email, password);

    const payload = {
      sub: verifiedPayload.userId,
      role: verifiedPayload.role,
      organizationId: verifiedPayload.organizationId,
      branchIds: verifiedPayload.branchIds,
      email: verifiedPayload.email,
      fullName: verifiedPayload.fullName,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '2h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: verifiedPayload.userId,
        fullName: verifiedPayload.fullName,
        email: verifiedPayload.email,
        role: verifiedPayload.role,
        organizationId: verifiedPayload.organizationId,
        branchIds: verifiedPayload.branchIds,
      },
    };
  }

  async courierLogin(phone: string, pinCode: string) {
    const verifiedPayload = await this.credentialProvider.verifyCourierPin(phone, pinCode);

    const payload = {
      sub: verifiedPayload.userId,
      role: 'COURIER',
      courierId: verifiedPayload.courierId,
      branchIds: verifiedPayload.branchIds,
      fullName: verifiedPayload.fullName,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '2h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: verifiedPayload.userId,
        fullName: verifiedPayload.fullName,
        role: 'COURIER',
        courierId: verifiedPayload.courierId,
        branchId: verifiedPayload.branchIds[0] || null,
        branchIds: verifiedPayload.branchIds,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const newPayload = {
        sub: payload.sub,
        role: payload.role,
        organizationId: payload.organizationId,
        branchIds: payload.branchIds || [],
        courierId: payload.courierId,
        email: payload.email,
        fullName: payload.fullName,
      };

      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '2h' });
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Недействительный или просроченный refresh-токен');
    }
  }

  async getMe(userId: string, role: string) {
    if (role === 'COURIER') {
      const courier = await this.prisma.courier.findUnique({
        where: { id: userId },
        include: { branch: true },
      });
      if (!courier) {
        throw new UnauthorizedException('Пользователь не найден');
      }
      return {
        id: courier.id,
        fullName: courier.name,
        phone: courier.phone,
        role: 'COURIER',
        courierId: courier.id,
        branchId: courier.branchId,
        branchIds: [courier.branchId],
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { branches: { include: { branch: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      organizationId: user.organizationId,
      branchIds: user.branches.map((ub) => ub.branchId),
      branches: user.branches.map((ub) => ub.branch),
    };
  }
}
