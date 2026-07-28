import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Gift, 
  Award, 
  MessageSquare, 
  Search, 
  Plus, 
  ShoppingBag, 
  X,
  History
} from 'lucide-react';
import { 
  fetchCustomers, 
  fetchCustomerById, 
  adjustLoyaltyPoints, 
  fetchCoupons, 
  createCoupon, 
  fetchNotificationLogs 
} from '../services/api';

export const CRMView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'coupons' | 'notifications'>('customers');
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);

  // Manual Adjust Modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState<number>(100);
  const [adjustComment, setAdjustComment] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Coupon Creation Form state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FIXED_AMOUNT'>('PERCENT');
  const [newCouponValue, setNewCouponValue] = useState<number>(10);
  const [newCouponError, setNewCouponError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [custData, coupData, notifData] = await Promise.all([
        fetchCustomers(searchQuery).catch(() => []),
        fetchCoupons().catch(() => []),
        fetchNotificationLogs().catch(() => []),
      ]);
      setCustomers(custData || []);
      setCoupons(coupData || []);
      setNotificationLogs(notifData || []);
    } catch (e) {
      console.error('Error loading CRM data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleOpenCustomerDetail = async (id: string) => {
    try {
      const detail = await fetchCustomerById(id);
      setSelectedCustomer(detail);
    } catch (e) {
      alert('Ошибка загрузки профиля клиента');
    }
  };

  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!adjustComment.trim()) {
      setAdjustError('Введите обязательный комментарий для аудита!');
      return;
    }

    try {
      setAdjustError(null);
      await adjustLoyaltyPoints(selectedCustomer.id, adjustPoints, adjustComment);
      setShowAdjustModal(false);
      setAdjustComment('');
      handleOpenCustomerDetail(selectedCustomer.id);
      loadData();
    } catch (err: any) {
      setAdjustError(err.message || 'Ошибка выполнения транзакции');
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || newCouponValue <= 0) {
      setNewCouponError('Заполните код и значение скидки.');
      return;
    }

    try {
      setNewCouponError(null);
      await createCoupon({
        code: newCouponCode,
        discountType: newCouponType,
        discountValue: newCouponValue,
      });
      setShowCouponModal(false);
      setNewCouponCode('');
      setNewCouponValue(10);
      loadData();
    } catch (err: any) {
      setNewCouponError(err.message || 'Ошибка создания купона');
    }
  };

  const totalPointsInSystem = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  const totalRevenueFromCRM = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Metrics Banner */}
      <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users color="var(--color-signal-blue)" size={26} /> CRM & Система лояльности (Казахстан)
            </h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-twilight-blue)' }}>
              Управление базой гостей, 5% кэшбэк-баллы, персональные промокоды и SMS/WhatsApp уведомления
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{ background: 'var(--color-signal-blue)', borderColor: 'var(--color-signal-blue)', fontSize: '0.85rem' }}
              onClick={() => setShowCouponModal(true)}
            >
              <Plus size={16} /> Создать промокод
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <div style={{ background: '#090d14', borderRadius: '10px', padding: '14px 18px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', fontWeight: 600 }}>ВСЕГО КЛИЕНТОВ</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{customers.length}</div>
          </div>
          <div style={{ background: '#090d14', borderRadius: '10px', padding: '14px 18px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', fontWeight: 600 }}>БАЛЛОВ НА БАЛАНСАХ</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fbbf24', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={20} /> {totalPointsInSystem.toLocaleString('ru-RU')} Б
            </div>
          </div>
          <div style={{ background: '#090d14', borderRadius: '10px', padding: '14px 18px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', fontWeight: 600 }}>ВЫРУЧКА ОТ CRM ГОСТЕЙ</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-emerald)', marginTop: '4px' }}>
              {totalRevenueFromCRM.toLocaleString('ru-RU')} ₸
            </div>
          </div>
          <div style={{ background: '#090d14', borderRadius: '10px', padding: '14px 18px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', fontWeight: 600 }}>АКТИВНЫХ КУПОНОВ</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
              {coupons.filter((c) => !c.isUsed).length}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveSubTab('customers')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'customers' ? 'var(--color-signal-blue)' : 'transparent',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={16} /> База клиентов ({customers.length})
        </button>

        <button
          onClick={() => setActiveSubTab('coupons')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'coupons' ? 'var(--color-signal-blue)' : 'transparent',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Gift size={16} /> Скидочные купоны ({coupons.length})
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'notifications' ? 'var(--color-signal-blue)' : 'transparent',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <MessageSquare size={16} /> SMS & WhatsApp лог ({notificationLogs.length})
        </button>
      </div>

      {/* Subtab 1: Customers List */}
      {activeSubTab === 'customers' && (
        <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-twilight-blue)' }} />
              <input
                type="text"
                placeholder="Поиск по телефону или имени..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: '#090d14',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-twilight-blue)' }}>
                <th style={{ padding: '12px' }}>Клиент / Телефон</th>
                <th style={{ padding: '12px' }}>Визиты</th>
                <th style={{ padding: '12px' }}>Сумма покупок</th>
                <th style={{ padding: '12px' }}>Баланс лояльности</th>
                <th style={{ padding: '12px' }}>Дата регистрации</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>
                    <div style={{ color: '#fff' }}>{c.name || 'Без имени'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-signal-blue)' }}>{c.phone}</div>
                  </td>
                  <td style={{ padding: '12px', color: '#fff', fontWeight: 600 }}>{c.visitsCount} визитов</td>
                  <td style={{ padding: '12px', color: 'var(--color-emerald)', fontWeight: 700 }}>
                    {c.totalSpent?.toLocaleString('ru-RU')} ₸
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-warning" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      ⭐ {c.loyaltyPoints} Б
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--color-twilight-blue)', fontSize: '0.8rem' }}>
                    {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => handleOpenCustomerDetail(c.id)}
                    >
                      Карточка клиента
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-twilight-blue)' }}>
                    Клиенты не найдены.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 2: Coupons List */}
      {activeSubTab === 'coupons' && (
        <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>Действующие скидочные купоны</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-twilight-blue)' }}>
                <th style={{ padding: '12px' }}>Промокод</th>
                <th style={{ padding: '12px' }}>Тип и размер скидки</th>
                <th style={{ padding: '12px' }}>Принадлежность</th>
                <th style={{ padding: '12px' }}>Статус</th>
                <th style={{ padding: '12px' }}>Дата создания</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coup) => (
                <tr key={coup.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem', color: 'var(--color-signal-blue)' }}>
                    {coup.code}
                  </td>
                  <td style={{ padding: '12px', color: '#fff', fontWeight: 600 }}>
                    {coup.discountType === 'PERCENT' ? `${coup.discountValue}%` : `${coup.discountValue.toLocaleString('ru-RU')} ₸`}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--color-twilight-blue)' }}>
                    {coup.customer ? `${coup.customer.name} (${coup.customer.phone})` : 'Общий промокод'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {coup.isUsed ? (
                      <span className="badge badge-danger">Использован</span>
                    ) : (
                      <span className="badge badge-success">Активен</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--color-twilight-blue)' }}>
                    {new Date(coup.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 3: Notification Logs */}
      {activeSubTab === 'notifications' && (
        <div style={{ background: '#121824', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>Лог отправленных SMS & WhatsApp сообщений</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-twilight-blue)' }}>
                <th style={{ padding: '12px' }}>Телефон</th>
                <th style={{ padding: '12px' }}>Канал</th>
                <th style={{ padding: '12px' }}>Тип</th>
                <th style={{ padding: '12px' }}>Текст сообщения</th>
                <th style={{ padding: '12px' }}>Статус</th>
                <th style={{ padding: '12px' }}>Время</th>
              </tr>
            </thead>
            <tbody>
              {notificationLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#fff' }}>{log.customerPhone}</td>
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-info">{log.channel}</span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--color-signal-blue)' }}>{log.type}</td>
                  <td style={{ padding: '12px', color: '#e2e8f0' }}>{log.message}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${log.status === 'SENT' ? 'badge-success' : log.status === 'QUEUED' ? 'badge-warning' : 'badge-danger'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--color-twilight-blue)', fontSize: '0.8rem' }}>
                    {new Date(log.createdAt).toLocaleTimeString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Detail Drawer Modal */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '560px', background: '#090d14', borderLeft: '1px solid var(--color-border)', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem' }}>{selectedCustomer.name || 'Гость'}</h2>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-signal-blue)', fontWeight: 600 }}>{selectedCustomer.phone}</span>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div style={{ background: '#121824', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', border: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)' }}>БАЛАНС БАЛЛОВ</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>{selectedCustomer.loyaltyPoints} Б</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)' }}>ВСЕГО ПОТРАЧЕНО</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-emerald)' }}>{selectedCustomer.totalSpent?.toLocaleString('ru-RU')} ₸</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)' }}>ВИЗИТОВ</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{selectedCustomer.visitsCount}</div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
              onClick={() => setShowAdjustModal(true)}
            >
              <Award size={16} /> Начислить / Списать баллы вручную
            </button>

            {/* Unified Order History */}
            <div>
              <h3 style={{ color: '#fff', fontSize: '1rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={16} /> Единая история заказов (Касса + QR/Онлайн)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedCustomer.orders?.map((ord: any) => (
                  <div key={ord.id} style={{ background: '#121824', padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{ord.orderNumber} ({ord.type})</span>
                      <span className={`badge ${ord.status === 'COMPLETED' ? 'badge-success' : ord.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                        {ord.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '8px' }}>
                      {new Date(ord.createdAt).toLocaleString('ru-RU')}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                      {ord.items?.map((it: any) => (
                        <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{it.name} x{it.quantity}</span>
                          <strong style={{ color: 'var(--color-emerald)' }}>{it.price * it.quantity} ₸</strong>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                      <span>Итого:</span>
                      <span style={{ color: 'var(--color-emerald)' }}>{ord.totalAmount?.toLocaleString('ru-RU')} ₸</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Loyalty Transactions Log */}
            <div>
              <h3 style={{ color: '#fff', fontSize: '1rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} /> Лог баллов лояльности
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCustomer.loyaltyLog?.map((log: any) => (
                  <div key={log.id} style={{ background: '#121824', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{log.comment}</div>
                      <div style={{ color: 'var(--color-twilight-blue)', fontSize: '0.75rem' }}>{new Date(log.createdAt).toLocaleString('ru-RU')}</div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: log.points > 0 ? '#34d399' : '#f87171' }}>
                      {log.points > 0 ? `+${log.points}` : log.points} Б
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Points Adjustment Modal */}
      {showAdjustModal && selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleAdjustPointsSubmit} style={{ background: '#121824', padding: '24px', borderRadius: '14px', width: '420px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ color: '#fff', margin: '0 0 14px 0' }}>Ручная корректировка баллов</h3>
            {adjustError && <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '10px' }}>⚠️ {adjustError}</div>}
            
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '6px' }}>
              Количество баллов (положительное = приход, отрицательное = списание)
            </label>
            <input
              type="number"
              value={adjustPoints}
              onChange={(e) => setAdjustPoints(parseInt(e.target.value, 10) || 0)}
              style={{ width: '100%', padding: '10px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff', marginBottom: '14px' }}
            />

            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '6px' }}>
              Причина / Комментарий (Обязательно для аудита)
            </label>
            <input
              type="text"
              placeholder="Например: Компенсация от управляющего"
              value={adjustComment}
              onChange={(e) => setAdjustComment(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>Отмена</button>
              <button type="submit" className="btn btn-primary">Применить</button>
            </div>
          </form>
        </div>
      )}

      {/* Coupon Creation Modal */}
      {showCouponModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreateCouponSubmit} style={{ background: '#121824', padding: '24px', borderRadius: '14px', width: '420px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ color: '#fff', margin: '0 0 14px 0' }}>Создание нового промокода</h3>
            {newCouponError && <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '10px' }}>⚠️ {newCouponError}</div>}

            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '6px' }}>Промокод</label>
            <input
              type="text"
              placeholder="e.g. WELCOME10"
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff', marginBottom: '14px', textTransform: 'uppercase' }}
            />

            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '6px' }}>Тип скидки</label>
            <select
              value={newCouponType}
              onChange={(e: any) => setNewCouponType(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff', marginBottom: '14px' }}
            >
              <option value="PERCENT">Процент от суммы (%)</option>
              <option value="FIXED_AMOUNT">Фиксированная сумма (₸)</option>
            </select>

            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '6px' }}>Размер скидки</label>
            <input
              type="number"
              value={newCouponValue}
              onChange={(e) => setNewCouponValue(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', padding: '10px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCouponModal(false)}>Отмена</button>
              <button type="submit" className="btn btn-primary">Создать купон</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
