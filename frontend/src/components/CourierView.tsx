import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Navigation, 
  PackageCheck, 
  Power,
  RefreshCw
} from 'lucide-react';
import { 
  fetchCouriers, 
  fetchCourierById, 
  updateCourierStatus, 
  updateDeliveryStatus 
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CourierView: React.FC = () => {
  const { user, courierLogin, logout } = useAuth();
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [courierData, setCourierData] = useState<any | null>(null);

  // Quick PIN login state inside CourierView if not authenticated
  const [loginPhone, setLoginPhone] = useState('+77071112233');
  const [loginPin, setLoginPin] = useState('1234');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Failure reason modal
  const [failedOrderId, setFailedOrderId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [failureError, setFailureError] = useState<string | null>(null);

  const loadCouriers = async () => {
    try {
      const list = await fetchCouriers();
      setCouriers(list || []);
      if (list && list.length > 0 && !selectedCourierId && (!user || user.role !== 'COURIER')) {
        setSelectedCourierId(list[0].id);
      }
    } catch (e) {
      console.error('Error loading couriers list:', e);
    }
  };

  const loadCourierDetail = async (id: string) => {
    if (!id) return;
    try {
      const data = await fetchCourierById(id);
      setCourierData(data);
    } catch (e) {
      console.error('Error loading courier detail:', e);
    }
  };

  useEffect(() => {
    if (user?.role === 'COURIER' && user.courierId) {
      setSelectedCourierId(user.courierId);
      loadCourierDetail(user.courierId);
    } else {
      loadCouriers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourierId) {
      loadCourierDetail(selectedCourierId);
    }
  }, [selectedCourierId]);

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);
    try {
      await courierLogin(loginPhone, loginPin);
    } catch (err: any) {
      setLoginError(err.message || 'Ошибка входа по PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleShift = async () => {
    if (!courierData) return;
    const nextStatus = courierData.status === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE';
    try {
      await updateCourierStatus(courierData.id, nextStatus);
      loadCourierDetail(courierData.id);
    } catch (err: any) {
      alert(err.message || 'Ошибка переключения смены');
    }
  };

  const handleStatusProgress = async (orderId: string, nextStatus: string) => {
    try {
      await updateDeliveryStatus(orderId, nextStatus);
      if (courierData) loadCourierDetail(courierData.id);
    } catch (err: any) {
      alert(err.message || 'Ошибка изменения статуса');
    }
  };

  const handleFailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failedOrderId || !failureReason.trim()) {
      setFailureError('Укажите обязательную причину невыполнения доставки!');
      return;
    }

    try {
      setFailureError(null);
      await updateDeliveryStatus(failedOrderId, 'FAILED', failureReason);
      setFailedOrderId(null);
      setFailureReason('');
      if (courierData) loadCourierDetail(courierData.id);
    } catch (err: any) {
      setFailureError(err.message || 'Ошибка отмены доставки');
    }
  };

  // If not logged in as COURIER and no token present, show PIN login card
  if (!user || (user.role !== 'COURIER' && user.role !== 'OWNER' && user.role !== 'MANAGER')) {
    return (
      <div style={{ maxWidth: '440px', margin: '40px auto', padding: '24px', background: '#121824', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ background: '#8b5cf620', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Bike size={30} color="#a78bfa" />
          </div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>Вход для Курьера</h2>
          <p style={{ color: 'var(--color-twilight-blue)', fontSize: '0.85rem', marginTop: '4px' }}>
            Введите номер телефона и PIN-код курьера
          </p>
        </div>

        {loginError && (
          <div style={{ padding: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {loginError}
          </div>
        )}

        <form onSubmit={handlePinLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '4px' }}>Телефон:</label>
            <input
              type="text"
              required
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '4px' }}>PIN-код:</label>
            <input
              type="password"
              required
              maxLength={6}
              value={loginPin}
              onChange={(e) => setLoginPin(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px' }}
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            {isSubmitting ? 'Авторизация...' : 'Войти в приложение курьера'}
          </button>
        </form>
      </div>
    );
  }

  const activeDeliveries = courierData?.deliveries?.filter((d: any) =>
    ['ASSIGNED', 'PICKED_UP', 'EN_ROUTE'].includes(d.deliveryStatus)
  ) || [];

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '100vh', background: '#090d14', color: '#fff', padding: '16px 12px' }}>
      {/* Mobile App Header */}
      <div style={{ background: '#121824', padding: '16px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bike color="#38bdf8" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Экран Курьера</h2>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => selectedCourierId && loadCourierDetail(selectedCourierId)}>
              <RefreshCw size={14} />
            </button>
            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ef4444' }} onClick={logout} title="Выйти">
              <Power size={14} />
            </button>
          </div>
        </div>

        {/* Courier Identity Selector for Management, or Locked Profile for Courier */}
        {user.role === 'COURIER' ? (
          <div style={{ background: '#090d14', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user.fullName || 'Авторизованный курьер'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)' }}>{user.phone || 'PIN-авторизация прошла успешно'}</div>
            </div>
            <span className="badge badge-info">PIN OK</span>
          </div>
        ) : (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', display: 'block', marginBottom: '4px' }}>Эмуляция курьера (для Owner/Manager):</label>
            <select
              value={selectedCourierId}
              onChange={(e) => setSelectedCourierId(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: '#090d14', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '8px' }}
            >
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) — {c.status}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Shift Toggle Button */}
        {courierData && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)' }}>Статус смены:</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: courierData.status === 'AVAILABLE' ? '#34d399' : courierData.status === 'ON_DELIVERY' ? '#60a5fa' : '#9ca3af' }}>
                {courierData.status === 'AVAILABLE' ? '🟢 В сети (Готов к заказам)' : courierData.status === 'ON_DELIVERY' ? '🔵 На доставке' : '🔴 Офлайн (Смена закрыта)'}
              </div>
            </div>
            <button
              onClick={handleToggleShift}
              disabled={courierData.status === 'ON_DELIVERY'}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: courierData.status === 'ON_DELIVERY' ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                background: courierData.status === 'OFFLINE' ? '#10b981' : '#ef4444',
                color: '#fff',
              }}
            >
              {courierData.status === 'OFFLINE' ? 'Выйти на смену' : 'Завершить смену'}
            </button>
          </div>
        )}
      </div>

      {/* Active Assigned Deliveries List */}
      <div>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 10px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PackageCheck size={18} color="#38bdf8" />
          Текущие заказы на доставку ({activeDeliveries.length})
        </h3>

        {activeDeliveries.length === 0 ? (
          <div style={{ background: '#121824', padding: '30px', borderRadius: '12px', textAlign: 'center', color: 'var(--color-twilight-blue)', border: '1px dashed var(--color-border)' }}>
            Нет назначенных доставок. Ожидайте новых заказов от диспетчера.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeDeliveries.map((order: any) => (
              <div key={order.id} style={{ background: '#121824', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8' }}>{order.orderNumber}</span>
                  <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{order.deliveryStatus}</span>
                </div>

                <div style={{ fontSize: '0.88rem', marginBottom: '8px', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Адрес:</strong> {order.deliveryAddress || 'Не указан'}
                  </div>
                </div>

                {order.customerPhone && (
                  <div style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--color-twilight-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} />
                    <a href={`tel:${order.customerPhone}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                      {order.customerPhone} ({order.customer?.name || 'Клиент'})
                    </a>
                  </div>
                )}

                <div style={{ fontSize: '0.85rem', background: '#090d14', padding: '8px', borderRadius: '6px', marginBottom: '12px' }}>
                  Сумма заказа: <strong style={{ color: '#34d399' }}>{order.totalAmount} KZT</strong>
                </div>

                {/* Courier Action Buttons based on delivery state */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {order.deliveryStatus === 'ASSIGNED' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleStatusProgress(order.id, 'PICKED_UP')}
                      style={{ flex: 1, padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <PackageCheck size={16} /> Zabral iz restrana (PICKED_UP)
                    </button>
                  )}

                  {order.deliveryStatus === 'PICKED_UP' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleStatusProgress(order.id, 'EN_ROUTE')}
                      style={{ flex: 1, padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Navigation size={16} /> Поехал к клиенту (EN_ROUTE)
                    </button>
                  )}

                  {order.deliveryStatus === 'EN_ROUTE' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusProgress(order.id, 'DELIVERED')}
                      style={{ flex: 1, padding: '10px', fontSize: '0.85rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <CheckCircle2 size={16} /> Заказ доставлен (DELIVERED)
                    </button>
                  )}

                  {/* Failure button always available when order is active */}
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setFailedOrderId(order.id); setFailureReason(''); setFailureError(null); }}
                    style={{ padding: '10px', color: '#ef4444', borderColor: '#ef444430', fontSize: '0.85rem' }}
                  >
                    <XCircle size={16} /> Отмена
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Failure Reason Modal */}
      {failedOrderId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#121824', padding: '20px', borderRadius: '14px', width: '90%', maxWidth: '380px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>Причина неотправки / отмены доставки</h3>

            {failureError && (
              <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '8px' }}>
                ⚠️ {failureError}
              </div>
            )}

            <form onSubmit={handleFailSubmit}>
              <textarea
                rows={3}
                required
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="Например: Клиент не выходит на связь / Неверный адрес..."
                style={{ width: '100%', padding: '8px', background: '#090d14', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '8px', marginBottom: '14px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>Подтвердить сбой</button>
                <button type="button" className="btn btn-secondary" onClick={() => setFailedOrderId(null)}>Закрыть</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
