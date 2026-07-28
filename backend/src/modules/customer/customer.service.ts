import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalizes phone number format.
   */
  cleanPhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Finds existing customer by phone or creates a new profile.
   */
  async findOrCreateByPhone(phone: string, name?: string) {
    if (!phone) return null;
    const clean = this.cleanPhone(phone);
    if (!clean) return null;

    let customer = await this.prisma.customer.findUnique({
      where: { phone: clean },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          phone: clean,
          name: name || `Гость ${clean.slice(-4)}`,
        },
      });
    } else if (name && !customer.name) {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: { name },
      });
    }

    return customer;
  }

  /**
   * Gets list of all registered customers with optional search by phone or name.
   */
  async getCustomers(query?: string) {
    return await this.prisma.customer.findMany({
      where: query
        ? {
            OR: [
              { phone: { contains: query } },
              { name: { contains: query } },
            ],
          }
        : {},
      include: {
        _count: {
          select: { orders: true, coupons: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets detailed customer profile with order history and loyalty transaction log.
   */
  async getCustomerById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: true,
            table: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        loyaltyLog: {
          orderBy: { createdAt: 'desc' },
        },
        coupons: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }

    return customer;
  }

  /**
   * Updates customer aggregate totals (totalSpent and visitsCount) when order status changes.
   */
  async updateCustomerStats(customerId: string, spentDelta: number, visitsDelta: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return;

    const newSpent = Math.max(0, customer.totalSpent + spentDelta);
    const newVisits = Math.max(0, customer.visitsCount + visitsDelta);

    return await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpent: newSpent,
        visitsCount: newVisits,
      },
    });
  }
}
