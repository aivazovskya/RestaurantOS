import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CredentialProvider, VerifiedUserPayload } from './credential-provider.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class LocalCredentialProvider implements CredentialProvider {
  constructor(private readonly prisma: PrismaService) {}

  async verify(identifier: string, secret: string): Promise<VerifiedUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { email: identifier.toLowerCase().trim() },
      include: { branches: true },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль.');
    }

    const isMatch = await bcrypt.compare(secret, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Неверный email или пароль.');
    }

    const branchIds = user.branches.map((ub) => ub.branchId);

    return {
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
      branchIds,
      fullName: user.fullName,
      email: user.email,
    };
  }

  async verifyCourierPin(phone: string, pinCode: string): Promise<VerifiedUserPayload> {
    const courier = await this.prisma.courier.findUnique({
      where: { phone: phone.trim() },
    });

    if (!courier) {
      throw new UnauthorizedException('Курьер с таким номером телефона не найден.');
    }

    if (!courier.pinCode) {
      throw new UnauthorizedException('PIN-код для курьера не установлен.');
    }

    let isMatch = false;
    if (courier.pinCode.startsWith('$2a$') || courier.pinCode.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(pinCode, courier.pinCode);
    } else {
      isMatch = courier.pinCode === pinCode.trim();
    }

    if (!isMatch) {
      throw new UnauthorizedException('Неверный PIN-код.');
    }

    return {
      userId: courier.id,
      role: 'COURIER',
      branchIds: [courier.branchId],
      courierId: courier.id,
      fullName: courier.name,
    };
  }
}
