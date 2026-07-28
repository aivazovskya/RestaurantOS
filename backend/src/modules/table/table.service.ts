import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../common/gateways/events.gateway';

export class CreateReservationDto {
  branchId?: string;
  tableId?: string;
  customerName: string;
  customerPhone: string;
  reservedFor: string | Date;
  partySize?: number;
  notes?: string;
}

@Injectable()
export class TableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getTables() {
    let tables = await this.prisma.diningTable.findMany({
      orderBy: { label: 'asc' },
    });

    if (tables.length === 0) {
      // Seed default tables for the main branch
      const branch = await this.prisma.branch.findFirst();
      if (branch) {
        await this.prisma.diningTable.createMany({
          data: [
            { branchId: branch.id, label: 'Стол 1', qrSlug: 'table-1' },
            { branchId: branch.id, label: 'Стол 2', qrSlug: 'table-2' },
            { branchId: branch.id, label: 'Стол 3', qrSlug: 'table-3' },
            { branchId: branch.id, label: 'Стол 7', qrSlug: 'table-7' },
            { branchId: branch.id, label: 'VIP Кабинка', qrSlug: 'vip-1' },
          ],
        });
        tables = await this.prisma.diningTable.findMany({ orderBy: { label: 'asc' } });
      }
    }

    return tables;
  }

  async getPublicMenuBySlug(qrSlug: string) {
    const table = await this.prisma.diningTable.findUnique({
      where: { qrSlug },
      include: { branch: true },
    });

    if (!table) {
      throw new NotFoundException(`Table with QR Slug "${qrSlug}" not found.`);
    }

    const menuItems = await this.prisma.menuItem.findMany({
      orderBy: { category: 'asc' },
    });

    // Format menu items for guest: mask detailed stock shortage reasons with generic wording
    const guestItems = menuItems.map((item) => ({
      id: item.id,
      posItemId: item.posItemId,
      name: item.name,
      description: item.description,
      category: item.category,
      sellingPrice: item.sellingPrice,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      displayStatus: item.isAvailable ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE',
      statusMessage: item.isAvailable ? null : 'Временно недоступно',
    }));

    return {
      table: {
        id: table.id,
        branchId: table.branchId,
        label: table.label,
        qrSlug: table.qrSlug,
        branchName: table.branch?.name || 'Almaty Dostyk',
      },
      items: guestItems,
    };
  }

  async callWaiter(qrSlug: string) {
    const table = await this.prisma.diningTable.findUnique({
      where: { qrSlug },
      include: { branch: true },
    });

    if (!table) {
      throw new NotFoundException(`Table "${qrSlug}" not found.`);
    }

    const branchId = table.branchId;
    const payload = {
      tableId: table.id,
      tableLabel: table.label,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };

    this.eventsGateway.emitWaiterCalled(branchId, payload);

    return {
      status: 'SUCCESS',
      message: `Официант вызван на ${table.label}`,
      payload,
    };
  }

  /**
   * Creates a table reservation (Phase 2 feature).
   */
  async createReservation(dto: CreateReservationDto) {
    if (!dto.customerName || !dto.customerPhone || !dto.reservedFor) {
      throw new BadRequestException('Имя, телефон и дата/время бронирования обязательны!');
    }

    let branchId = dto.branchId;
    if (!branchId) {
      const branch = await this.prisma.branch.findFirst();
      if (!branch) throw new NotFoundException('Branch not found');
      branchId = branch.id;
    }

    const reservation = await this.prisma.tableReservation.create({
      data: {
        branchId,
        tableId: dto.tableId || null,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        reservedFor: new Date(dto.reservedFor),
        partySize: dto.partySize || 2,
        notes: dto.notes || null,
        status: 'CONFIRMED',
      },
      include: {
        table: true,
        branch: true,
      },
    });

    return reservation;
  }

  /**
   * Gets list of table reservations.
   */
  async getReservations(branchId?: string) {
    const targetBranch = branchId
      ? await this.prisma.branch.findUnique({ where: { id: branchId } })
      : await this.prisma.branch.findFirst();

    if (!targetBranch) return [];

    return await this.prisma.tableReservation.findMany({
      where: { branchId: targetBranch.id },
      include: { table: true },
      orderBy: { reservedFor: 'asc' },
    });
  }

  /**
   * Cancels a table reservation.
   */
  async cancelReservation(id: string) {
    const reservation = await this.prisma.tableReservation.findUnique({ where: { id } });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found.`);
    }

    return await this.prisma.tableReservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
