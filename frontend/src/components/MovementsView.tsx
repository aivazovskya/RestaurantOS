import React, { useState } from 'react';
import { History, AlertOctagon } from 'lucide-react';

interface MovementsViewProps {
  movements: any[];
  incidents: any[];
}

export const MovementsView: React.FC<MovementsViewProps> = ({ movements, incidents }) => {
  const [activeSubTab, setActiveSubTab] = useState<'movements' | 'incidents'>('movements');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">История движений и Инциденты</h1>
          <p className="page-subtitle">Полный аудит операций склада, приходов и предупреждений о нехватке</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
          <button
            className={`btn ${activeSubTab === 'movements' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveSubTab('movements')}
          >
            <History size={14} /> Журнал движений ({movements.length})
          </button>
          <button
            className={`btn ${activeSubTab === 'incidents' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveSubTab('incidents')}
          >
            <AlertOctagon size={14} /> Предупреждения о нехватке ({incidents.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'movements' ? (
        <div className="card">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Дата и Время</th>
                  <th>Тип Движения</th>
                  <th>Склад</th>
                  <th>Номер документа / Чека</th>
                  <th>Детали списания / прихода</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mov) => (
                  <tr key={mov.id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(mov.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td>
                      {mov.type === 'AUTO_DEDUCTION' && <span className="badge badge-success">⚡ Автосписание Nexium</span>}
                      {mov.type === 'RECEIPT' && <span className="badge badge-info">📦 Приход от поставщика</span>}
                      {mov.type === 'MANUAL_WRITE_OFF' && <span className="badge badge-danger">⚠️ Ручное списание</span>}
                    </td>
                    <td style={{ fontWeight: 600 }}>{mov.warehouse?.name || 'Главный склад'}</td>
                    <td style={{ fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
                      {mov.referenceId || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {mov.items?.map((item: any) => (
                          <div key={item.id} style={{ fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600 }}>{item.ingredient?.name}:</span>{' '}
                            <span style={{ color: item.quantity > 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>
                              {item.quantity > 0 ? `+${item.quantity}` : item.quantity} {item.ingredient?.mainUnit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Время инцидента</th>
                  <th>Номер чека Nexium</th>
                  <th>Ингредиент</th>
                  <th>Запрошено</th>
                  <th>Доступно на складе</th>
                  <th>Нехватка (Дефицит)</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      Инцидентов нехватки не зафиксировано. Все списания прошли в пределах остатков!
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id}>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(inc.createdAt).toLocaleString('ru-RU')}
                      </td>
                      <td style={{ fontFamily: 'var(--font-code)' }}>{inc.receiptId}</td>
                      <td style={{ fontWeight: 700 }}>{inc.ingredientName}</td>
                      <td>{inc.requestedQty}</td>
                      <td style={{ color: '#fbbf24' }}>{inc.availableQty}</td>
                      <td style={{ color: '#f87171', fontWeight: 800 }}>-{inc.shortageQty}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
