import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export class CreateCourierDto {
  name: string;
  phone: string;
  vehicleType: 'CAR' | 'SCOOTER' | 'BICYCLE' | 'ON_FOOT';
  branchId?: string;
}

@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new courier profile.
   */
  async createCourier(dto: CreateCourierDto) {
    if (!dto.name || !dto.phone || !dto.vehicleType) {
      throw new BadRequestException('Имя, телефон и тип транспорта курьера обязательны.');
    }

    const cleanPhone = dto.phone.replace(/[^\d+]/g, '');

    const existing = await this.prisma.courier.findUnique({ where: { phone: cleanPhone } });
    if (existing) {
      throw new BadRequestException(`Курьер с телефоном ${cleanPhone} уже зарегистрирован.`);
    }

    let branchId = dto.branchId;
    if (!branchId) {
      const mainBranch = await this.prisma.branch.findFirst();
      if (!mainBranch) {
        throw new NotFoundException('Филиал ресторана не найден.');
      }
      branchId = mainBranch.id;
    }

    return await this.prisma.courier.create({
      data: {
        name: dto.name,
        phone: cleanPhone,
        vehicleType: dto.vehicleType,
        status: 'OFFLINE',
        branchId,
      },
    });
  }

  /**
   * Fetches list of couriers filtered by branchId and status.
   */
  async getCouriers(branchId?: string, status?: 'OFFLINE' | 'AVAILABLE' | 'ON_DELIVERY') {
    let targetBranchId = branchId;
    if (!targetBranchId) {
      const branch = await this.prisma.branch.findFirst();
      if (branch) targetBranchId = branch.id;
    }

    return await this.prisma.courier.findMany({
      where: {
        ...(targetBranchId ? { branchId: targetBranchId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        deliveries: {
          where: {
            deliveryStatus: { in: ['ASSIGNED', 'PICKED_UP', 'EN_ROUTE'] },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Fetches courier details with active assigned deliveries.
   */
  async getCourierById(id: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { id },
      include: {
        deliveries: {
          include: {
            items: true,
            table: true,
            customer: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!courier) {
      throw new NotFoundException(`Courier ${id} not found.`);
    }

    return courier;
  }

  /**
   * Updates courier shift status (OFFLINE / AVAILABLE / ON_DELIVERY).
   */
  async updateCourierStatus(courierId: string, status: 'OFFLINE' | 'AVAILABLE' | 'ON_DELIVERY') {
    const courier = await this.prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) {
      throw new NotFoundException(`Courier ${courierId} not found.`);
    }

    const updated = await this.prisma.courier.update({
      where: { id: courierId },
      data: { status },
    });

    this.logger.log(`Courier ${courier.name} (${courier.phone}) status updated to ${status}`);
    return updated;
  }
}
