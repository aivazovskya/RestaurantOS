import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to parse date range or set sensible defaults (last 30 days).
   */
  private parseDateRange(from?: string, to?: string) {
    const endDate = to ? new Date(to) : new Date();
    let startDate = from ? new Date(from) : new Date();
    if (!from) {
      startDate.setDate(endDate.getDate() - 30);
    }
    return { startDate, endDate };
  }

  /**
   * 5.0 Revenue analytics by period and order type.
   */
  async getRevenue(from?: string, to?: string, groupBy: 'day' | 'week' | 'month' = 'day') {
    const { startDate, endDate } = this.parseDateRange(from, to);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ['COMPLETED', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
      select: {
        id: true,
        type: true,
        totalAmount: true,
        createdAt: true,
      },
    });

    let totalRevenue = 0;
    const byType: { [type: string]: { amount: number; count: number } } = {
      POS_CASHIER: { amount: 0, count: 0 },
      DINE_IN_QR: { amount: 0, count: 0 },
      PICKUP: { amount: 0, count: 0 },
      DELIVERY: { amount: 0, count: 0 },
    };

    const periodMap: { [key: string]: { date: string; total: number; count: number } } = {};

    for (const ord of orders) {
      totalRevenue += ord.totalAmount;

      const typeKey = ord.type || 'POS_CASHIER';
      if (!byType[typeKey]) {
        byType[typeKey] = { amount: 0, count: 0 };
      }
      byType[typeKey].amount += ord.totalAmount;
      byType[typeKey].count += 1;

      // Format date bucket key
      const dateObj = new Date(ord.createdAt);
      let dateKey = dateObj.toISOString().split('T')[0]; // day default
      if (groupBy === 'month') {
        dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!periodMap[dateKey]) {
        periodMap[dateKey] = { date: dateKey, total: 0, count: 0 };
      }
      periodMap[dateKey].total += ord.totalAmount;
      periodMap[dateKey].count += 1;
    }

    const timeline = Object.values(periodMap).sort((a, b) => a.date.localeCompare(b.date));
    const totalOrders = orders.length;
    const averageCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      startDate,
      endDate,
      groupBy,
      totalRevenue,
      totalOrders,
      averageCheck,
      byType,
      timeline,
    };
  }

  /**
   * 5.0 Top & bottom sold menu items.
   */
  async getTopItems(from?: string, to?: string, limit: number = 10) {
    const { startDate, endDate } = this.parseDateRange(from, to);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['COMPLETED', 'ACCEPTED', 'PREPARING', 'READY'] },
        },
      },
    });

    const itemMap: { [posItemId: string]: { name: string; posItemId: string; quantity: number; revenue: number } } = {};

    for (const item of orderItems) {
      if (!itemMap[item.posItemId]) {
        itemMap[item.posItemId] = {
          posItemId: item.posItemId,
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
      }
      itemMap[item.posItemId].quantity += item.quantity;
      itemMap[item.posItemId].revenue += item.price * item.quantity;
    }

    const sortedByQty = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
    const sortedByRevenue = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);

    const topByQuantity = sortedByQty.slice(0, limit);
    const topByRevenue = sortedByRevenue.slice(0, limit);
    const bottomByQuantity = [...sortedByQty].reverse().slice(0, limit);

    return {
      startDate,
      endDate,
      totalUniqueItemsSold: Object.keys(itemMap).length,
      topByQuantity,
      topByRevenue,
      bottomByQuantity,
    };
  }

  /**
   * 5.0 Stock shortage incidents frequency & financial impact.
   */
  async getStockIncidents(from?: string, to?: string) {
    const { startDate, endDate } = this.parseDateRange(from, to);

    const incidents = await this.prisma.deductionIncident.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const incidentMap: { [ingredientName: string]: { ingredientName: string; count: number; totalShortage: number } } = {};

    for (const inc of incidents) {
      if (!incidentMap[inc.ingredientName]) {
        incidentMap[inc.ingredientName] = {
          ingredientName: inc.ingredientName,
          count: 0,
          totalShortage: 0,
        };
      }
      incidentMap[inc.ingredientName].count += 1;
      incidentMap[inc.ingredientName].totalShortage += inc.shortageQty;
    }

    const summary = Object.values(incidentMap).sort((a, b) => b.count - a.count);

    return {
      startDate,
      endDate,
      totalIncidentsCount: incidents.length,
      summary,
      incidents,
    };
  }

  /**
   * 5.0 Stop-list events frequency and reasons (AUTO vs MANUAL).
   */
  async getStopListFrequency(from?: string, to?: string) {
    const { startDate, endDate } = this.parseDateRange(from, to);

    const events = await this.prisma.stopListEvent.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    const itemEventMap: { [dishName: string]: { dishName: string; autoCount: number; manualCount: number; total: number } } = {};

    for (const ev of events) {
      if (!itemEventMap[ev.menuItemName]) {
        itemEventMap[ev.menuItemName] = {
          dishName: ev.menuItemName,
          autoCount: 0,
          manualCount: 0,
          total: 0,
        };
      }

      const isAuto = ev.action && ev.action.startsWith('AUTO');
      if (isAuto) {
        itemEventMap[ev.menuItemName].autoCount += 1;
      } else {
        itemEventMap[ev.menuItemName].manualCount += 1;
      }
      itemEventMap[ev.menuItemName].total += 1;
    }

    const frequencyList = Object.values(itemEventMap).sort((a, b) => b.total - a.total);

    return {
      startDate,
      endDate,
      totalEventsCount: events.length,
      frequencyList,
      recentEvents: events.slice(0, 20),
    };
  }

  /**
   * 5.2 Rule-based Inventory Purchase Forecast.
   */
  async getPurchaseForecast(branchId?: string, daysWindow: number = 14) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysWindow);

    // Fetch all stock balances
    const balances = await this.prisma.stockBalance.findMany({
      include: {
        ingredient: true,
        warehouse: true,
      },
    });

    // Fetch auto-deduction stock movements over historical window
    const movements = await this.prisma.stockMovementItem.findMany({
      where: {
        stockMovement: {
          type: 'AUTO_DEDUCTION',
          createdAt: { gte: startDate, lte: endDate },
        },
      },
    });

    const consumptionMap: { [ingredientId: string]: number } = {};
    for (const mov of movements) {
      const positiveQty = Math.abs(mov.quantity);
      consumptionMap[mov.ingredientId] = (consumptionMap[mov.ingredientId] || 0) + positiveQty;
    }

    // Historical data confidence check
    const earliestMovement = await this.prisma.stockMovement.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    let confidenceLevel: 'HIGH' | 'LOW_DATA' = 'HIGH';
    let dataDaysAvailable = daysWindow;
    if (earliestMovement) {
      const daysDiff = (new Date().getTime() - new Date(earliestMovement.createdAt).getTime()) / (1000 * 3600 * 24);
      if (daysDiff < 7) {
        confidenceLevel = 'LOW_DATA';
        dataDaysAvailable = Math.max(1, Math.round(daysDiff));
      }
    }

    const forecastItems: Array<{
      ingredientId: string;
      ingredientName: string;
      unit: string;
      currentStock: number;
      dailyBurnRate: number;
      daysRemaining: number | null;
      recommendedPurchaseQty: number;
      urgency: 'CRITICAL' | 'WARNING' | 'NORMAL';
    }> = [];

    for (const bal of balances) {
      const totalUsed = consumptionMap[bal.ingredientId] || 0;
      const dailyBurnRate = Number((totalUsed / dataDaysAvailable).toFixed(2));

      let daysRemaining: number | null = null;
      let urgency: 'CRITICAL' | 'WARNING' | 'NORMAL' = 'NORMAL';
      let recommendedPurchaseQty = 0;

      if (dailyBurnRate > 0) {
        daysRemaining = Number((bal.quantity / dailyBurnRate).toFixed(1));
        if (daysRemaining <= 3) {
          urgency = 'CRITICAL';
        } else if (daysRemaining <= 7) {
          urgency = 'WARNING';
        }

        // Recommend purchasing enough stock for 14 days + minStockLevel
        const neededFor14Days = dailyBurnRate * 14;
        recommendedPurchaseQty = Math.max(0, Number((neededFor14Days + (bal.ingredient.minStockLevel || 0) - bal.quantity).toFixed(2)));
      }

      forecastItems.push({
        ingredientId: bal.ingredientId,
        ingredientName: bal.ingredient.name,
        unit: bal.ingredient.mainUnit,
        currentStock: bal.quantity,
        dailyBurnRate,
        daysRemaining,
        recommendedPurchaseQty,
        urgency,
      });
    }

    // Sort by urgency: CRITICAL first, then WARNING, then daysRemaining asc
    forecastItems.sort((a, b) => {
      const urgencyScore = { CRITICAL: 0, WARNING: 1, NORMAL: 2 };
      if (urgencyScore[a.urgency] !== urgencyScore[b.urgency]) {
        return urgencyScore[a.urgency] - urgencyScore[b.urgency];
      }
      return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
    });

    return {
      daysWindow: dataDaysAvailable,
      confidenceLevel,
      confidenceNote: confidenceLevel === 'LOW_DATA' 
        ? `Прогноз построен на основе ${dataDaysAvailable} дней истории. Точность вырастет по мере накопления данных.`
        : `Прогноз построен на основе скользящей статистики за последние ${daysWindow} дней.`,
      criticalItemsCount: forecastItems.filter((i) => i.urgency === 'CRITICAL').length,
      warningItemsCount: forecastItems.filter((i) => i.urgency === 'WARNING').length,
      forecastItems,
    };
  }

  /**
   * 5.3 Heuristic Rule-Based Anomaly & Suspicious Operations Detection.
   */
  async getFlaggedOperations(from?: string, to?: string) {
    const { startDate, endDate } = this.parseDateRange(from, to);

    const flaggedItems: Array<{
      id: string;
      type: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      title: string;
      description: string;
      timestamp: Date;
      entityId?: string;
    }> = [];

    // Rule 1: Rapid manual stop-list toggling (>3 events for same dish in range)
    const stopListEvents = await this.prisma.stopListEvent.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    const stopListCounts: { [dish: string]: number } = {};
    for (const ev of stopListEvents) {
      const isAuto = ev.action && ev.action.startsWith('AUTO');
      if (!isAuto) {
        stopListCounts[ev.menuItemName] = (stopListCounts[ev.menuItemName] || 0) + 1;
      }
    }

    for (const [dishName, count] of Object.entries(stopListCounts)) {
      if (count >= 3) {
        flaggedItems.push({
          id: `FLAG-STOP-${dishName}`,
          type: 'RAPID_STOPLIST_TOGGLE',
          severity: 'MEDIUM',
          title: `Частое ручное управление стоп-листом: ${dishName}`,
          description: `Блюдо "${dishName}" переключалось вручную в стоп-лист ${count} раз(а) за выбранный период.`,
          timestamp: new Date(),
        });
      }
    }

    // Rule 2: Manual stock write-offs without comments
    const manualMovements = await this.prisma.stockMovement.findMany({
      where: {
        type: { in: ['MANUAL_WRITE_OFF', 'INVENTORY_ADJUST'] },
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { items: { include: { ingredient: true } } },
    });

    for (const mov of manualMovements) {
      if (!mov.comment || mov.comment.trim().length < 5) {
        flaggedItems.push({
          id: `FLAG-MOV-${mov.id}`,
          type: 'UNEXPLAINED_MANUAL_WRITE_OFF',
          severity: 'HIGH',
          title: 'Ручное списание сырья без подробного комментария',
          description: `Списание со склада (${mov.type}) на сумму позиций без пояснительного комментария аудита.`,
          timestamp: mov.createdAt,
          entityId: mov.id,
        });
      }
    }

    // Rule 3: Cancelled orders after ACCEPTED / READY status
    const cancelledOrders = await this.prisma.order.findMany({
      where: {
        status: 'CANCELLED',
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    for (const ord of cancelledOrders) {
      flaggedItems.push({
        id: `FLAG-ORD-${ord.id}`,
        type: 'ORDER_CANCELLED_AFTER_ACCEPT',
        severity: 'HIGH',
        title: `Отмена заказа ${ord.orderNumber} на сумму ${ord.totalAmount} ₸`,
        description: `Заказ был отменен после принятия кухней. Сырьё было автоматически возвращено на склад.`,
        timestamp: ord.createdAt,
        entityId: ord.id,
      });
    }

    // Rule 4: Manual loyalty adjustments without comments or negative adjustments
    const manualLoyalty = await this.prisma.loyaltyTransaction.findMany({
      where: {
        type: 'MANUAL_ADJUSTMENT',
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { customer: true },
    });

    for (const loy of manualLoyalty) {
      if (!loy.comment || loy.comment.trim().length < 5) {
        flaggedItems.push({
          id: `FLAG-LOY-${loy.id}`,
          type: 'SUSPICIOUS_LOYALTY_ADJUSTMENT',
          severity: 'MEDIUM',
          title: `Ручное изменение баллов лояльности (${loy.points > 0 ? '+' : ''}${loy.points} Б)`,
          description: `Корректировка баллов для гостя ${loy.customer.name || loy.customer.phone} выполнена без развернутой причины.`,
          timestamp: loy.createdAt,
          entityId: loy.id,
        });
      }
    }

    // Sort by timestamp desc
    flaggedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      startDate,
      endDate,
      totalFlaggedCount: flaggedItems.length,
      highSeverityCount: flaggedItems.filter((i) => i.severity === 'HIGH').length,
      flaggedItems,
    };
  }
}
