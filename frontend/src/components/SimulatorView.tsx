import React, { useState } from 'react';
import { Zap, ShoppingBag, Plus, Minus, CheckCircle, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { simulateNexiumReceipt } from '../services/api';

interface SimulatorViewProps {
  menuItems: any[];
  onReceiptProcessed: () => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ menuItems, onReceiptProcessed }) => {
  const [cart, setCart] = useState<{ [posItemId: string]: { dish: any; quantity: number } }>({
    'NEX-DISH-001': { dish: menuItems.find((m) => m.posItemId === 'NEX-DISH-001') || { name: 'Бургер Говяжий Классический', sellingPrice: 3500, isAvailable: true }, quantity: 2 },
    'NEX-DISH-002': { dish: menuItems.find((m) => m.posItemId === 'NEX-DISH-002') || { name: 'Лимонад Классический 0.5L', sellingPrice: 1500, isAvailable: true }, quantity: 1 },
  });

  const [tableNumber, setTableNumber] = useState('Стол 7');
  const [paymentType, setPaymentType] = useState('KASPI_QR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const updateQuantity = (dish: any, delta: number) => {
    if (!dish.isAvailable && delta > 0) return; // Prevent adding unavailable dish

    const key = dish.posItemId;
    const current = cart[key]?.quantity || 0;
    const next = current + delta;

    if (next <= 0) {
      const copy = { ...cart };
      delete copy[key];
      setCart(copy);
    } else {
      setCart({
        ...cart,
        [key]: { dish, quantity: next },
      });
    }
  };

  const totalAmount = Object.values(cart).reduce((sum, item) => sum + item.dish.sellingPrice * item.quantity, 0);

  const handleSimulate = async () => {
    setIsProcessing(true);
    setLastResult(null);

    const payload = {
      receiptId: `REC-KZ-${Math.floor(10000 + Math.random() * 90000)}`,
      tableNumber,
      paymentType,
      totalAmount,
      items: Object.entries(cart).map(([posItemId, item]) => ({
        posItemId,
        name: item.dish.name,
        quantity: item.quantity,
        price: item.dish.sellingPrice,
      })),
    };

    try {
      const res = await simulateNexiumReceipt(payload);
      setLastResult(res);
      onReceiptProcessed();
    } catch (err: any) {
      setLastResult({ error: err.message || 'Ошибка симуляции' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Симулятор кассы Nexium POS</h1>
          <p className="page-subtitle">Тестирование интеграции Event Bus, автосписания сырья и превентивного стоп-листа</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: POS Terminal Order Form */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} color="var(--color-signal-blue)" />
              Кассовый терминал Nexium (POS)
            </h2>
            <span className="badge badge-info">Nexium v4.2 Emulator</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">Стол / Заказ</label>
              <input className="form-input" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Способ оплаты</label>
              <select className="form-select" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="KASPI_QR">Kaspi QR (KZ)</option>
                <option value="CARD">Банковская карта</option>
                <option value="CASH">Наличные</option>
              </select>
            </div>
          </div>

          {/* Dish Picker */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ marginBottom: '10px' }}>Выберите блюда для чека:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {menuItems.map((dish) => {
                const qty = cart[dish.posItemId]?.quantity || 0;
                const isStopped = !dish.isAvailable;

                return (
                  <div
                    key={dish.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: isStopped ? 'rgba(231,0,11,0.04)' : 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isStopped ? 'rgba(231,0,11,0.3)' : 'var(--color-border)',
                      opacity: isStopped && qty === 0 ? 0.6 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {dish.name}
                        {isStopped && (
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                            <ShieldAlert size={10} /> СТОП-ЛИСТ
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-twilight-blue)' }}>
                        {dish.sellingPrice?.toLocaleString('ru-RU')} ₸
                        {isStopped && dish.stopListReason && (
                          <span style={{ marginLeft: '6px', color: '#f87171' }}>({dish.stopListReason})</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => updateQuantity(dish, -1)}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 600, width: '20px', textAlign: 'center' }}>{qty}</span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', cursor: isStopped ? 'not-allowed' : 'pointer' }}
                        disabled={isStopped}
                        onClick={() => updateQuantity(dish, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt Total & Trigger Button */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--color-twilight-blue)' }}>Итого по чеку:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-emerald)' }}>{totalAmount.toLocaleString('ru-RU')} ₸</span>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem', justifyContent: 'center' }}
              disabled={isProcessing || Object.keys(cart).length === 0}
              onClick={handleSimulate}
            >
              <Zap size={18} />
              {isProcessing ? 'Обработка через Event Bus...' : 'Провести чек через Nexium Event Bus'}
            </button>
          </div>
        </div>

        {/* Right Column: Event Bus Processing Output */}
        <div className="card" style={{ background: '#090d14', borderColor: 'rgba(43, 127, 255, 0.2)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowRight size={18} color="var(--color-signal-blue)" />
            Результат списания и автопересчета стоп-листа
          </h2>

          {!lastResult ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-twilight-blue)' }}>
              <Zap size={36} color="var(--color-twilight-blue)" style={{ marginBottom: '12px' }} />
              <p>Нажмите <strong>«Провести чек»</strong>, чтобы увидеть, как списание сырья автоматически пересчитывает доступность блюд в стоп-листе.</p>
            </div>
          ) : (
            <div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 600, marginBottom: '6px' }}>
                  <CheckCircle size={18} /> Статус: {lastResult.status}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-twilight-blue)' }}>
                  Чек <strong>{lastResult.receiptId}</strong> обработан складом <strong>«{lastResult.warehouseName}»</strong>
                </div>
              </div>

              {/* Deducted Ingredients Breakdown */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>Списанное сырье со склада:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {lastResult.deductions?.map((d: any) => (
                  <div key={d.ingredientId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <span>{d.name}</span>
                    <strong style={{ color: '#f87171' }}>-{d.qty} {d.mainUnit}</strong>
                  </div>
                ))}
              </div>

              {/* Incident Warnings if any */}
              {lastResult.incidents && lastResult.incidents.length > 0 && (
                <div style={{ background: 'rgba(231, 0, 11, 0.1)', border: '1px solid rgba(231, 0, 11, 0.3)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ color: '#f87171', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <AlertTriangle size={16} /> Дефицит сырья — Блюда автоматически переведены в Стоп-лист!
                  </div>
                  {lastResult.incidents.map((inc: any, i: number) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-twilight-blue)' }}>
                      • {inc.name}: нехватка {inc.shortage} {inc.unit}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
