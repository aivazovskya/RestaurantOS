import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';

export interface ChatResponseDto {
  sessionId: string;
  replyText: string;
  data?: any;
  chartType?: 'line' | 'bar' | 'pie';
  toolsCalled: string[];
}

/**
 * AiChatService
 * Deterministic intent-routed analytics AI Assistant for restaurant owners.
 * Guarantees ZERO hallucinations by querying ground-truth SQL metrics directly from AnalyticsService.
 */
@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Processes user message via robust natural language intent matching and tool dispatching.
   */
  async processChatMessage(message: string, sessionId?: string): Promise<ChatResponseDto> {
    const cleanSessionId = sessionId || `session-${Date.now()}`;
    const queryLower = message.toLowerCase().trim();
    const toolsCalled: string[] = [];

    // Helper regex array check
    const matchesAny = (keywords: string[]) => keywords.some((kw) => queryLower.includes(kw));

    // Intent 1: Revenue / Income / Sales / Money / Cashier
    if (matchesAny(['выручк', 'заработ', 'доход', 'продаж', 'деньг', 'прибыль', 'касс', 'получили', 'финанс', 'оборот', 'сколько'])) {
      toolsCalled.push('getRevenue');
      const revData = await this.analyticsService.getRevenue(undefined, undefined, 'day');

      const text = `💰 **Анализ выручки ресторана**:\n` +
        `• Общая выручка за последние 30 дней: **${revData.totalRevenue.toLocaleString('ru-RU')} ₸**\n` +
        `• Всего выполненных заказов: **${revData.totalOrders}**\n` +
        `• Средний чек: **${revData.averageCheck.toLocaleString('ru-RU')} ₸**\n\n` +
        `**Разбивка по каналам продаж**:\n` +
        `- Касса Nexium (POS): **${revData.byType.POS_CASHIER?.amount.toLocaleString('ru-RU') || 0} ₸** (${revData.byType.POS_CASHIER?.count || 0} чеков)\n` +
        `- QR-заказы в зале: **${revData.byType.DINE_IN_QR?.amount.toLocaleString('ru-RU') || 0} ₸** (${revData.byType.DINE_IN_QR?.count || 0} заказов)\n` +
        `- Самовывоз (Pickup): **${revData.byType.PICKUP?.amount.toLocaleString('ru-RU') || 0} ₸** (${revData.byType.PICKUP?.count || 0} заказов)\n` +
        `- Курьерская доставка: **${revData.byType.DELIVERY?.amount.toLocaleString('ru-RU') || 0} ₸** (${revData.byType.DELIVERY?.count || 0} доставок)`;

      return {
        sessionId: cleanSessionId,
        replyText: text,
        data: revData,
        chartType: 'line',
        toolsCalled,
      };
    }

    // Intent 2: Top / Bottom sold items / Popularity
    if (matchesAny(['топ', 'бюдо', 'блюд', 'худш', 'лучш', 'популяр', 'продали', 'ходов', 'лидер', 'хит', 'меню', 'аутсайдер'])) {
      toolsCalled.push('getTopItems');
      const topData = await this.analyticsService.getTopItems();

      const topNames = topData.topByQuantity.map((i, idx) => `${idx + 1}. **${i.name}** — ${i.quantity} шт. (${i.revenue.toLocaleString('ru-RU')} ₸)`).join('\n');
      const bottomNames = topData.bottomByQuantity.slice(0, 3).map((i, idx) => `${idx + 1}. ${i.name} — всего ${i.quantity} шт.`).join('\n');

      const text = `🏆 **Рейтинг блюд меню**:\n\n` +
        `**Самые популярные блюда (Топ по продажам)**:\n${topNames || 'Данные отсутствуют'}\n\n` +
        `**Аутсайдеры продаж (Анти-топ)**:\n${bottomNames || 'Данные отсутствуют'}`;

      return {
        sessionId: cleanSessionId,
        replyText: text,
        data: topData,
        chartType: 'bar',
        toolsCalled,
      };
    }

    // Intent 3: Purchase Forecast & Stock depletion / Inventory
    if (matchesAny(['законч', 'фарш', 'прогноз', 'закуп', 'остат', 'склад', 'хватит', 'дефицит', 'сырь', 'продук'])) {
      toolsCalled.push('getPurchaseForecast');
      const forecastData = await this.analyticsService.getPurchaseForecast();

      const criticalList = forecastData.forecastItems
        .filter((i) => i.urgency === 'CRITICAL' || i.urgency === 'WARNING')
        .map((i) => `• ⚠️ **${i.ingredientName}**: остаток **${i.currentStock} ${i.unit}** (хватит на ~${i.daysRemaining ?? '?'} дн., средний расход ${i.dailyBurnRate} ${i.unit}/день). Закупить: **${i.recommendedPurchaseQty} ${i.unit}**`)
        .join('\n');

      const text = `📦 **Прогноз закупок и истощения склада**:\n` +
        `• Надежность прогноза: **${forecastData.confidenceLevel}** (${forecastData.confidenceNote})\n` +
        `• Позиций в критической зоне (<=3 дн.): **${forecastData.criticalItemsCount}**\n` +
        `• Позиций под угрозой (<=7 дн.): **${forecastData.warningItemsCount}**\n\n` +
        `**Ингредиенты, требующие срочной закупки**:\n` +
        (criticalList || 'Все запасы в норме! Ни один ингредиент не исчерпается в ближайшие 7 дней.');

      return {
        sessionId: cleanSessionId,
        replyText: text,
        data: forecastData,
        chartType: 'bar',
        toolsCalled,
      };
    }

    // Intent 4: Anomaly Detection / Security / Fraud / Write-offs
    if (matchesAny(['подозрительн', 'аномали', 'списан', 'нарушен', 'безопасн', 'воровст', 'краж', 'махинац', 'афер'])) {
      toolsCalled.push('getFlaggedOperations');
      const flagData = await this.analyticsService.getFlaggedOperations();

      const flagList = flagData.flaggedItems.slice(0, 5).map((f) => 
        `• [${f.severity === 'HIGH' ? '🔴 ВЫСОКИЙ' : '🟡 СРЕДНИЙ'}] **${f.title}**:\n  _${f.description}_ (${new Date(f.timestamp).toLocaleDateString('ru-RU')})`
      ).join('\n\n');

      const text = `🛡️ **Анализ безопасности и аномальных операций**:\n` +
        `• Всего выявлено зафиксированных событий: **${flagData.totalFlaggedCount}**\n` +
        `• Из них с высокой степенью рисков: **${flagData.highSeverityCount}**\n\n` +
        `**Зафиксированные аномалии**:\n` +
        (flagList || 'Подозрительных операций и аномалий за период не обнаружено.');

      return {
        sessionId: cleanSessionId,
        replyText: text,
        data: flagData,
        toolsCalled,
      };
    }

    // Intent 5: Stock shortage incidents & Stop-list frequency
    if (matchesAny(['инцидент', 'нехватк', 'стоп', 'сбой', 'задерж', 'проблем'])) {
      toolsCalled.push('getStockIncidents');
      toolsCalled.push('getStopListFrequency');
      const [incData, stopData] = await Promise.all([
        this.analyticsService.getStockIncidents(),
        this.analyticsService.getStopListFrequency(),
      ]);

      const incList = incData.summary.slice(0, 3).map((i) => `• **${i.ingredientName}**: ${i.count} инцидентов (недостача ${i.totalShortage.toFixed(2)})`).join('\n');
      const stopList = stopData.frequencyList.slice(0, 3).map((s) => `• **${s.dishName}**: ${s.total} раз в стоп-листе (${s.autoCount} авто / ${s.manualCount} вручную)`).join('\n');

      const text = `⚠️ **Отчёт по сбоям кухни и стоп-листам**:\n` +
        `• Всего инцидентов нехватки сырья при чеках: **${incData.totalIncidentsCount}**\n` +
        `• Всего событий стоп-листа: **${stopData.totalEventsCount}**\n\n` +
        `**Дефицитные ингредиенты**:\n${incList || 'Нет'}\n\n` +
        `**Часто блокируемые блюда**:\n${stopList || 'Нет'}`;

      return {
        sessionId: cleanSessionId,
        replyText: text,
        data: { incData, stopData },
        toolsCalled,
      };
    }

    // Default Fallback: Out of scope polite response
    return {
      sessionId: cleanSessionId,
      replyText: `🤖 Я — AI-ассистент владельца **Restaurant OS Kazakhstan**.\n\n` +
        `Я специализируюсь на аналитике вашего ресторана на основе реальных данных кассы, склада и доставки.\n\n` +
        `**Вы можете спросить меня**:\n` +
        `• _«Какая выручка за прошлую неделю?»_\n` +
        `• _«Какие блюда продаются лучше всего?»_\n` +
        `• _«Когда закончится фарш и что нужно докупить?»_\n` +
        `• _«Есть ли подозрительные списания на складе?»_\n` +
        `• _«Как часто блюда попадают в стоп-лист?»_`,
      toolsCalled: [],
    };
  }
}
