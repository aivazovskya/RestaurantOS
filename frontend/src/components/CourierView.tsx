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

export const CourierView: React.FC = () => {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [courierData, setCourierData] = useState<any | null>(null);

  // Failure reason modal
  const [failedOrderId, setFailedOrderId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [failureError, setFailureError] = useState<string | null>(null);

  const loadCouriers = async () => {
    try {
      const list = await fetchCouriers();
      setCouriers(list || []);
      if (list && list.length > 0 && !selectedCourierId) {
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
    loadCouriers();
  }, []);

  useEffect(() => {
    if (selectedCourierId) {
      loadCourierDetail(selectedCourierId);
    }
  }, [selectedCourierId]);

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
          <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => selectedCourierId && loadCourierDetail(selectedCourierId)}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Courier Identity Selector */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', display: 'block', marginBottom: '4px' }}>Выберите профиль курьера:</label>
          <select
            value={selectedCourierId}
            onChange={(e) => setSelectedCourierId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
          >
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.vehicleType}) — {c.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Shift Toggle Banner */}
        {courierData && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '10px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)' }}>Статус смены:</span>
              <div style={{ fontWeight: 700, color: courierData.status === 'AVAILABLE' ? 'var(--color-emerald)' : courierData.status === 'ON_DELIVERY' ? '#38bdf8' : '#f87171' }}>
                {courierData.status === 'AVAILABLE' ? '🟢 НА СМЕНЕ (AVAILABLE)' : courierData.status === 'ON_DELIVERY' ? '🚴 В ПУТИ (ON_DELIVERY)' : '🔴 НЕ НА СМЕНЕ (OFFLINE)'}
              </div>
            </div>

            <button
              className={`btn ${courierData.status === 'OFFLINE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              onClick={handleToggleShift}
              disabled={courierData.status === 'ON_DELIVERY'}
            >
              <Power size={14} /> {courierData.status === 'OFFLINE' ? 'Выйти на смену' : 'Завершить смену'}
            </button>
          </div>
        )}
      </div>

      {/* Deliveries Queue */}
      <div>
        <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PackageCheck size={18} color="var(--color-emerald)" /> Назначенные доставки ({activeDeliveries.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeDeliveries.map((ord: any) => (
            <div key={ord.id} style={{ background: '#121824', padding: '16px', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{ord.orderNumber}</span>
                <span className="badge badge-info">{ord.deliveryStatus}</span>
              </div>

              {/* Delivery Address */}
              <div style={{ background: '#090d14', padding: '12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)' }}>АДРЕС ДОСТАВКИ:</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={18} /> {ord.deliveryAddress || 'Не указан'}
                </div>
              </div>

              {/* Customer Contact */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{ord.customer?.name || 'Клиент'}</div>
                  <div style={{ color: 'var(--color-twilight-blue)' }}>{ord.customerPhone}</div>
                </div>
                {ord.customerPhone && (
                  <a
                    href={`tel:${ord.customerPhone}`}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none', color: '#38bdf8' }}
                  >
                    <Phone size={14} /> Позвонить
                  </a>
                )}
              </div>

              {/* Items List */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.8rem' }}>
                {ord.items?.map((it: any) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{it.name} x{it.quantity}</span>
                    <strong style={{ color: 'var(--color-emerald)' }}>{it.price * it.quantity} ₸</strong>
                  </div>
                ))}
              </div>

              {/* Action Buttons Progress */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ord.deliveryStatus === 'ASSIGNED' && (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', background: '#3b82f6', borderColor: '#3b82f6' }}
                    onClick={() => handleStatusProgress(ord.id, 'PICKED_UP')}
                  >
                    <PackageCheck size={16} /> Забрал заказ из ресторана
                  </button>
                )}

                {ord.deliveryStatus === 'PICKED_UP' && (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', background: '#8b5cf6', borderColor: '#8b5cf6' }}
                    onClick={() => handleStatusProgress(ord.id, 'EN_ROUTE')}
                  >
                    <Navigation size={16} /> Выехал к клиенту (В пути)
                  </button>
                )}

                {ord.deliveryStatus === 'EN_ROUTE' && (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', background: 'var(--color-emerald)', borderColor: 'var(--color-emerald)' }}
                    onClick={() => handleStatusProgress(ord.id, 'DELIVERED')}
                  >
                    <CheckCircle2 size={16} /> Доставлено и оплачено ({ord.totalAmount?.toLocaleString('ru-RU')} ₸)
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '8px', justifyContent: 'center', color: '#f87171', fontSize: '0.8rem' }}
                  onClick={() => setFailedOrderId(ord.id)}
                >
                  <XCircle size={14} /> Не доставлено (Сбой)
                </button>
              </div>
            </div>
          ))}

          {activeDeliveries.length === 0 && (
            <div style={{ background: '#121824', padding: '30px', borderRadius: '14px', textAlign: 'center', color: 'var(--color-twilight-blue)', border: '1px solid var(--color-border)' }}>
              У вас нет активных назначенных доставок.
            </div>
          )}
        </div>
      </div>

      {/* Failure Reason Modal */}
      {failedOrderId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={handleFailSubmit} style={{ background: '#121824', padding: '24px', borderRadius: '14px', width: '100%', maxWidth: '400px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ color: '#fff', margin: '0 0 14px 0' }}>Причина невыполнения доставки</h3>
            {failureError && <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '10px' }}>⚠️ {failureError}</div>}

            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '6px' }}>
              Укажите причину (Клиент не ответил, Неверный адрес и т.д.)
            </label>
            <input
              type="text"
              placeholder="Например: Клиент не открыл дверь"
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#090d14', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setFailedOrderId(null)}>Отмена</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>Подтвердить сбой</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
