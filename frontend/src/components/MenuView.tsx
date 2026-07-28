import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, AlertTriangle, Lock, CheckCircle, ShieldAlert } from 'lucide-react';
import { setManualStop, restoreManualStop } from '../services/api';

interface MenuViewProps {
  menuItems: any[];
  onRefresh: () => void;
}

export const MenuView: React.FC<MenuViewProps> = ({ menuItems, onRefresh }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDishId, setTargetDishId] = useState<string | null>(null);
  const [stopReason, setStopReason] = useState('Санитарная проверка / Решение менеджера');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleManualStopClick = (dishId: string) => {
    setTargetDishId(dishId);
    setIsModalOpen(true);
  };

  const handleConfirmManualStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDishId) return;
    await setManualStop(targetDishId, stopReason);
    setIsModalOpen(false);
    onRefresh();
  };

  const handleRestoreClick = async (dishId: string) => {
    await restoreManualStop(dishId);
    onRefresh();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Меню и Технологические карты</h1>
          <p className="page-subtitle">Рецептуры блюд, себестоимость и автоматический стоп-лист по остаткам сырья</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {menuItems.map((dish) => {
          const isExpanded = expandedId === dish.id;
          const recipeItems = dish.recipeCard?.items || [];

          return (
            <div
              key={dish.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: !dish.isAvailable ? 'rgba(231, 0, 11, 0.4)' : undefined,
                background: !dish.isAvailable ? 'rgba(231, 0, 11, 0.03)' : undefined,
              }}
            >
              <div>
                {dish.imageUrl && (
                  <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px', position: 'relative' }}>
                    <img src={dish.imageUrl} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: !dish.isAvailable ? 'grayscale(0.6)' : undefined }} />
                    {!dish.isAvailable && (
                      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(231,0,11,0.9)', color: '#fff', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldAlert size={14} /> В СТОП-ЛИСТЕ
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: !dish.isAvailable ? 'var(--color-twilight-blue)' : 'var(--color-whiteout)' }}>
                    {dish.name}
                  </h3>
                  
                  {dish.isAvailable ? (
                    <span className="badge badge-success">
                      <CheckCircle size={12} /> В наличии
                    </span>
                  ) : dish.stopListSource === 'MANUAL' ? (
                    <span className="badge badge-danger">
                      <Lock size={12} /> Стоп (Вручную)
                    </span>
                  ) : (
                    <span className="badge badge-danger">
                      <AlertCircleIcon size={12} /> Стоп (Авто)
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--color-twilight-blue)', marginBottom: '14px' }}>
                  {dish.description || 'Без описания'}
                </p>

                {/* Stop List Reason Alert Box if unavailable */}
                {!dish.isAvailable && dish.stopListReason && (
                  <div style={{ background: 'rgba(231, 0, 11, 0.1)', border: '1px solid rgba(231, 0, 11, 0.3)', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.8rem', color: '#f87171' }}>
                    <strong>Причина снятия:</strong> {dish.stopListReason}
                  </div>
                )}

                {/* Price & Cost Summary */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-twilight-blue)', textTransform: 'uppercase' }}>Цена</span>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{dish.sellingPrice?.toLocaleString('ru-RU')} ₸</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-twilight-blue)', textTransform: 'uppercase' }}>Себестоимость</span>
                    <div style={{ fontWeight: 600, color: 'var(--color-emerald)' }}>{dish.calculatedPrimeCost?.toLocaleString('ru-RU')} ₸</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-twilight-blue)', textTransform: 'uppercase' }}>Food Cost</span>
                    <div style={{ fontWeight: 600, color: dish.foodCostPercent > 35 ? '#f87171' : '#34d399' }}>
                      {dish.foodCostPercent}%
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', marginBottom: '14px', fontFamily: 'var(--font-code)' }}>
                  Nexium POS ID: {dish.posItemId}
                </div>
              </div>

              {/* Action buttons & Accordion */}
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {dish.isAvailable ? (
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.8rem', color: '#f87171', borderColor: 'rgba(231,0,11,0.3)' }}
                      onClick={() => handleManualStopClick(dish.id)}
                    >
                      <Lock size={14} /> В стоп-лист
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      onClick={() => handleRestoreClick(dish.id)}
                    >
                      <CheckCircle size={14} /> Снять со стоп-листа
                    </button>
                  )}
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.8rem' }}
                  onClick={() => toggleExpand(dish.id)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} /> Техкарта ({recipeItems.length} ингредиентов)
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                    <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>Ингредиент</th>
                          <th>Брутто (Склад)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipeItems.map((ri: any) => (
                          <tr key={ri.id}>
                            <td style={{ fontWeight: 500 }}>{ri.ingredient?.name}</td>
                            <td style={{ fontFamily: 'var(--font-code)', color: 'var(--color-signal-blue)' }}>
                              {ri.grossAmount} {ri.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Manual Stop-List Override */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Ручная постановка в стоп-лист</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmManualStop}>
              <div className="form-group">
                <label className="form-label">Укажите причину снятия с продажи</label>
                <input
                  required
                  className="form-input"
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  placeholder="Например, Ремонт оборудования / Жалоба гостя"
                />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '16px' }}>
                ℹ️ <strong>Примечание:</strong> Блюдо, поставленное в стоп-лист вручную, не будет автоматически возвращаться в продажу при приходах товара — только через ручной переключатель менеджером.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-danger">Подтвердить стоп-лист</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function AlertCircleIcon({ size }: { size: number }) {
  return <AlertTriangle size={size} />;
}
