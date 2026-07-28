import React from 'react';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  ArrowDownRight, 
  Activity,
  CheckCircle2,
  Zap
} from 'lucide-react';

interface DashboardViewProps {
  summaryData: any;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ summaryData, onNavigateTab }) => {
  const stats = summaryData?.stats || {
    totalStockValue: 0,
    totalIngredients: 0,
    lowStockCount: 0,
    negativeStockCount: 0,
    totalMovements: 0,
    autoDeductionsCount: 0,
    incidentsCount: 0,
  };

  const recentMovements = summaryData?.recentMovements || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Обзор склада и операций</h1>
          <p className="page-subtitle">Ресторанная группа Алматы (Флагман Достык) • Фаза 0 + Фаза 1 MVP</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigateTab('simulator')}>
          <Zap size={16} />
          Тест кассы Nexium
        </button>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="card metric-card">
          <div className="metric-icon emerald">
            <DollarSign size={24} />
          </div>
          <span className="metric-label">Стоимость запасов</span>
          <span className="metric-value">{stats.totalStockValue?.toLocaleString('ru-RU')} ₸</span>
        </div>

        <div className="card metric-card">
          <div className="metric-icon cyan">
            <Package size={24} />
          </div>
          <span className="metric-label">Позиций на складе</span>
          <span className="metric-value">{stats.totalIngredients}</span>
        </div>

        <div className="card metric-card">
          <div className="metric-icon amber">
            <AlertTriangle size={24} />
          </div>
          <span className="metric-label">Низкий остаток</span>
          <span className="metric-value" style={{ color: stats.lowStockCount > 0 ? '#f59e0b' : 'inherit' }}>
            {stats.lowStockCount}
          </span>
        </div>

        <div className="card metric-card">
          <div className="metric-icon rose">
            <ArrowDownRight size={24} />
          </div>
          <span className="metric-label">Автосписаний Nexium</span>
          <span className="metric-value" style={{ color: '#10b981' }}>
            {stats.autoDeductionsCount}
          </span>
        </div>
      </div>

      {/* Integration Banner */}
      <div className="card" style={{ marginBottom: '28px', background: 'var(--color-warm-taupe)', borderColor: 'var(--color-stone)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '9999px', background: 'var(--color-eggshell)', color: 'var(--color-ink)', border: '1px solid var(--color-stone)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--color-ink)' }}>Интеграция с POS-кассой Nexium активна</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-smoke)', marginTop: '2px' }}>
                Каждая транзакция из Nexium транслируется через Event Bus и мгновенно списывает ингредиенты по технологической карте блюда.
              </p>
            </div>
          </div>
          <span className="badge badge-success"> Event Bus Sync OK</span>
        </div>
      </div>

      {/* Activity Log Grid */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 300, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink)', fontFamily: 'var(--font-waldenburg)' }}>
            <Activity size={18} color="var(--color-ink)" />
            Последние движения по складам
          </h2>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => onNavigateTab('movements')}>
            Смотреть всю историю
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Дата / Время</th>
                <th>Тип операции</th>
                <th>Чек / Документ</th>
                <th>Ингредиенты</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    История движений пока пуста. Проведите чек через симулятор Nexium!
                  </td>
                </tr>
              ) : (
                recentMovements.map((mov: any) => (
                  <tr key={mov.id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(mov.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td>
                      {mov.type === 'AUTO_DEDUCTION' && <span className="badge badge-success">⚡ Автосписание Nexium</span>}
                      {mov.type === 'RECEIPT' && <span className="badge badge-info">📦 Приход от поставщика</span>}
                      {mov.type === 'MANUAL_WRITE_OFF' && <span className="badge badge-danger">⚠️ Ручное списание</span>}
                    </td>
                    <td style={{ fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
                      {mov.referenceId || 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {mov.items?.map((item: any) => (
                          <span key={item.id} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                            {item.ingredient?.name}: <strong>{item.quantity > 0 ? `+${item.quantity}` : item.quantity} {item.ingredient?.mainUnit}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
