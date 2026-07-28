import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Award, 
  Package, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { 
  fetchRevenueAnalytics, 
  fetchTopItemsAnalytics, 
  fetchPurchaseForecast, 
  fetchFlaggedOperations, 
  fetchStockIncidentsAnalytics, 
  fetchStopListFrequencyAnalytics 
} from '../services/api';
import { AIChatWidget } from './AIChatWidget';

export const AnalyticsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'revenue' | 'top-items' | 'forecast' | 'anomalies' | 'incidents'>('revenue');
  const [showAiModal, setShowAiModal] = useState(false);

  // Data states
  const [revenueData, setRevenueData] = useState<any | null>(null);
  const [topItemsData, setTopItemsData] = useState<any | null>(null);
  const [forecastData, setForecastData] = useState<any | null>(null);
  const [flaggedData, setFlaggedData] = useState<any | null>(null);
  const [incidentsData, setIncidentsData] = useState<any | null>(null);
  const [stopListData, setStopListData] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const [rev, top, fore, flag, inc, stop] = await Promise.all([
        fetchRevenueAnalytics().catch(() => null),
        fetchTopItemsAnalytics().catch(() => null),
        fetchPurchaseForecast().catch(() => null),
        fetchFlaggedOperations().catch(() => null),
        fetchStockIncidentsAnalytics().catch(() => null),
        fetchStopListFrequencyAnalytics().catch(() => null),
      ]);

      setRevenueData(rev);
      setTopItemsData(top);
      setForecastData(fore);
      setFlaggedData(flag);
      setIncidentsData(inc);
      setStopListData(stop);
    } catch (e) {
      console.error('Error loading analytics:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles color="var(--color-signal-blue)" size={26} /> AI-Аналитика & Помощник Владельца
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-twilight-blue)' }}>
              Детерминированные SQL-агрегации, прогноз закупок сырья и ассистент с защитой от галлюцинаций
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={loadData}>
              <RefreshCw size={16} /> Обновить
            </button>
            <button
              className="btn btn-primary"
              style={{ background: 'var(--color-signal-blue)', borderColor: 'var(--color-signal-blue)', fontSize: '0.88rem', padding: '10px 18px' }}
              onClick={() => setShowAiModal(true)}
            >
              <MessageSquare size={18} /> Чат с AI-помощником
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <div style={{ background: '#090d14', borderRadius: '10px', padding: '14px 18px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', fontWeight: 600 }}>ВЫРУЧКА (30 ДНЕЙ)</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-emerald)', marginTop: '4px' }}>
              {revenueData?.totalRevenue?.toLocaleString('ru-RU') || 0} ₸
            </div>
          </div>
          <div style={{ background: '#090d14', borderRadius: '10px', padding: '14px 18px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', fontWeight: 600 }}>СРЕДНИЙ ЧЕК</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {revenueData?.averageCheck?.toLocaleString('ru-RU') || 0} ₸
            </div>
          </div>
          <div style={{ background: '#090d14', borderRadius: '10px', padding: '14px 18px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', fontWeight: 600 }}>ПОЗИЦИЙ ДЛЯ ЗАКУПКИ</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
              {forecastData?.criticalItemsCount || 0} критич.
            </div>
          </div>
          <div style={{ background: '#090d14', borderRadius: '10px', padding: '14px 18px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', fontWeight: 600 }}>ВЫЯВЛЕНО АНОМАЛИЙ</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f87171', marginTop: '4px' }}>
              {flaggedData?.totalFlaggedCount || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveSubTab('revenue')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'revenue' ? 'var(--color-signal-blue)' : 'transparent',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={16} /> Анализ выручки
        </button>

        <button
          onClick={() => setActiveSubTab('top-items')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'top-items' ? 'var(--color-signal-blue)' : 'transparent',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Award size={16} /> Топ & Анти-топ блюд
        </button>

        <button
          onClick={() => setActiveSubTab('forecast')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'forecast' ? 'var(--color-signal-blue)' : 'transparent',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Package size={16} /> Прогноз закупок
        </button>

        <button
          onClick={() => setActiveSubTab('anomalies')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'anomalies' ? 'var(--color-signal-blue)' : 'transparent',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={16} /> Аномалии & Безопасность
        </button>

        <button
          onClick={() => setActiveSubTab('incidents')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'incidents' ? 'var(--color-signal-blue)' : 'transparent',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} /> Сбои & Стоп-листы
        </button>
      </div>

      {/* Subtab 1: Revenue Breakdowns */}
      {activeSubTab === 'revenue' && revenueData && (
        <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>Выручка по каналам продаж</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: '#090d14', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-twilight-blue)' }}>Касса Nexium (POS)</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                {revenueData.byType.POS_CASHIER?.amount?.toLocaleString('ru-RU') || 0} ₸
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)' }}>{revenueData.byType.POS_CASHIER?.count || 0} чеков</span>
            </div>
            <div style={{ background: '#090d14', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-twilight-blue)' }}>QR-Заказы в зале</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                {revenueData.byType.DINE_IN_QR?.amount?.toLocaleString('ru-RU') || 0} ₸
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)' }}>{revenueData.byType.DINE_IN_QR?.count || 0} заказов</span>
            </div>
            <div style={{ background: '#090d14', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-twilight-blue)' }}>Самовывоз (Pickup)</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                {revenueData.byType.PICKUP?.amount?.toLocaleString('ru-RU') || 0} ₸
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)' }}>{revenueData.byType.PICKUP?.count || 0} заказов</span>
            </div>
            <div style={{ background: '#090d14', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-twilight-blue)' }}>Курьерская доставка</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                {revenueData.byType.DELIVERY?.amount?.toLocaleString('ru-RU') || 0} ₸
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)' }}>{revenueData.byType.DELIVERY?.count || 0} доставок</span>
            </div>
          </div>

          <h4 style={{ color: '#fff', margin: '0 0 12px 0' }}>Динамика выручки по дням</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-twilight-blue)' }}>
                <th style={{ padding: '10px' }}>Дата</th>
                <th style={{ padding: '10px' }}>Количество заказов</th>
                <th style={{ padding: '10px' }}>Выручка</th>
              </tr>
            </thead>
            <tbody>
              {revenueData.timeline?.map((t: any) => (
                <tr key={t.date} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{t.date}</td>
                  <td style={{ padding: '10px', color: 'var(--color-twilight-blue)' }}>{t.count} заказов</td>
                  <td style={{ padding: '10px', color: 'var(--color-emerald)', fontWeight: 700 }}>{t.total?.toLocaleString('ru-RU')} ₸</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 2: Top & Bottom Items */}
      {activeSubTab === 'top-items' && topItemsData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpRight color="var(--color-emerald)" size={18} /> Топ-10 лидеров продаж
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-twilight-blue)' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>Блюдо</th>
                  <th style={{ padding: '8px' }}>Продано</th>
                  <th style={{ padding: '8px' }}>Выручка</th>
                </tr>
              </thead>
              <tbody>
                {topItemsData.topByQuantity?.map((item: any, idx: number) => (
                  <tr key={item.posItemId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', color: 'var(--color-signal-blue)', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '8px', color: '#fff' }}>{item.quantity} шт.</td>
                    <td style={{ padding: '8px', color: 'var(--color-emerald)', fontWeight: 700 }}>{item.revenue?.toLocaleString('ru-RU')} ₸</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowDownRight color="#f87171" size={18} /> Аутсайдеры продаж (Анти-топ)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-twilight-blue)' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>Блюдо</th>
                  <th style={{ padding: '8px' }}>Продано</th>
                  <th style={{ padding: '8px' }}>Выручка</th>
                </tr>
              </thead>
              <tbody>
                {topItemsData.bottomByQuantity?.map((item: any, idx: number) => (
                  <tr key={item.posItemId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', color: '#f87171', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '8px', color: '#fff' }}>{item.quantity} шт.</td>
                    <td style={{ padding: '8px', color: 'var(--color-twilight-blue)' }}>{item.revenue?.toLocaleString('ru-RU')} ₸</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Inventory Forecast */}
      {activeSubTab === 'forecast' && forecastData && (
        <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#fff' }}>Rule-Based Прогноз истощения запасов склада</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-twilight-blue)' }}>{forecastData.confidenceNote}</span>
            </div>
            <span className={`badge ${forecastData.confidenceLevel === 'HIGH' ? 'badge-success' : 'badge-warning'}`}>
              Достоверность: {forecastData.confidenceLevel}
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-twilight-blue)' }}>
                <th style={{ padding: '10px' }}>Ингредиент</th>
                <th style={{ padding: '10px' }}>Текущий остаток</th>
                <th style={{ padding: '10px' }}>Дневной расход</th>
                <th style={{ padding: '10px' }}>Хватит на дней</th>
                <th style={{ padding: '10px' }}>Рекомендуемая закупка</th>
                <th style={{ padding: '10px' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.forecastItems?.map((i: any) => (
                <tr key={i.ingredientId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px', color: '#fff', fontWeight: 600 }}>{i.ingredientName}</td>
                  <td style={{ padding: '10px', color: '#fff' }}>{i.currentStock} {i.unit}</td>
                  <td style={{ padding: '10px', color: 'var(--color-twilight-blue)' }}>{i.dailyBurnRate} {i.unit}/день</td>
                  <td style={{ padding: '10px', fontWeight: 700, color: i.urgency === 'CRITICAL' ? '#f87171' : i.urgency === 'WARNING' ? '#fbbf24' : 'var(--color-emerald)' }}>
                    {i.daysRemaining !== null ? `~${i.daysRemaining} дн.` : '—'}
                  </td>
                  <td style={{ padding: '10px', color: '#38bdf8', fontWeight: 700 }}>
                    {i.recommendedPurchaseQty > 0 ? `${i.recommendedPurchaseQty} ${i.unit}` : 'Не требуется'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge ${i.urgency === 'CRITICAL' ? 'badge-danger' : i.urgency === 'WARNING' ? 'badge-warning' : 'badge-success'}`}>
                      {i.urgency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 4: Anomalies */}
      {activeSubTab === 'anomalies' && flaggedData && (
        <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>Журнал выявленных подозрительных операций</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flaggedData.flaggedItems?.map((f: any) => (
              <div key={f.id} style={{ background: '#090d14', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{f.title}</span>
                  <span className={`badge ${f.severity === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                    {f.severity}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' }}>{f.description}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-twilight-blue)' }}>
                  {new Date(f.timestamp).toLocaleString('ru-RU')}
                </div>
              </div>
            ))}

            {flaggedData.flaggedItems?.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-twilight-blue)' }}>
                Подозрительных операций не выведено.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 5: Incidents & Stop-lists */}
      {activeSubTab === 'incidents' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#fff' }}>Инциденты дефицита сырья при чеках</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-twilight-blue)' }}>
                  <th style={{ padding: '8px' }}>Ингредиент</th>
                  <th style={{ padding: '8px' }}>Случаев</th>
                  <th style={{ padding: '8px' }}>Недостача</th>
                </tr>
              </thead>
              <tbody>
                {incidentsData?.summary?.map((inc: any) => (
                  <tr key={inc.ingredientName} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>{inc.ingredientName}</td>
                    <td style={{ padding: '8px', color: '#f87171', fontWeight: 700 }}>{inc.count} раз</td>
                    <td style={{ padding: '8px', color: '#fff' }}>{inc.totalShortage.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: '#fff' }}>Частота блокировки блюд в стоп-лист</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-twilight-blue)' }}>
                  <th style={{ padding: '8px' }}>Блюдо</th>
                  <th style={{ padding: '8px' }}>Автоматически</th>
                  <th style={{ padding: '8px' }}>Вручную</th>
                </tr>
              </thead>
              <tbody>
                {stopListData?.frequencyList?.map((s: any) => (
                  <tr key={s.dishName} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>{s.dishName}</td>
                    <td style={{ padding: '8px', color: '#38bdf8' }}>{s.autoCount} раз</td>
                    <td style={{ padding: '8px', color: 'var(--color-twilight-blue)' }}>{s.manualCount} раз</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Chat Modal Widget */}
      {showAiModal && <AIChatWidget onClose={() => setShowAiModal(false)} />}
    </div>
  );
};
