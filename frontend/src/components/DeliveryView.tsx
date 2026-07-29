import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  UserCheck, 
  Plus, 
  RefreshCw,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { 
  fetchOrders, 
  fetchCouriers, 
  createCourier, 
  resetCourierPin,
  assignCourierToOrder, 
  updateCourierStatus,
  fetchTables,
  WS_BASE,
  getAuthToken
} from '../services/api';
import { io } from 'socket.io-client';

interface DeliveryViewProps {
  branchId?: string;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({ branchId: propBranchId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string | null>(propBranchId || null);

  // New Courier Form State
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierPhone, setNewCourierPhone] = useState('+7707');
  const [newCourierVehicle, setNewCourierVehicle] = useState<'CAR' | 'SCOOTER' | 'BICYCLE' | 'ON_FOOT'>('CAR');
  const [newCourierPin, setNewCourierPin] = useState('');
  const [courierError, setCourierError] = useState<string | null>(null);

  // Display Created/Reset PIN Modal
  const [createdPinModalInfo, setCreatedPinModalInfo] = useState<{ name: string; phone: string; pinCode: string } | null>(null);

  // Assignment Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [allOrders, allCouriers] = await Promise.all([
        fetchOrders().catch(() => []),
        fetchCouriers().catch(() => []),
      ]);
      setOrders(allOrders.filter((o: any) => o.type === 'DELIVERY') || []);
      setCouriers(allCouriers || []);
    } catch (e) {
      console.error('Failed to load delivery data:', e);
    }
  };

  useEffect(() => {
    loadData();

    if (!propBranchId) {
      fetchTables()
        .then((tables) => {
          if (tables && tables.length > 0 && tables[0].branchId) {
            setBranchId(tables[0].branchId);
          }
        })
        .catch((e) => console.error('Error loading tables for DeliveryView branchId:', e));
    }
  }, [propBranchId]);

  useEffect(() => {
    if (!branchId) return;

    const token = getAuthToken();
    // WebSockets live updates with real branchId and JWT auth
    const socket = io(`${WS_BASE}/events`, {
      auth: { token },
      query: { branchId },
    });

    socket.on('order.created', (newOrder: any) => {
      if (newOrder.type === 'DELIVERY') {
        setOrders((prev) => [newOrder, ...prev]);
      }
    });

    socket.on('order.status_changed', (payload: any) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === payload.orderId ? { ...o, ...payload.order } : o))
      );
    });

    socket.on('delivery.assigned', (updatedOrder: any) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      loadData();
    });

    socket.on('delivery.status_changed', (payload: any) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === payload.orderId ? { ...o, ...payload.order } : o))
      );
      loadData();
    });

    return () => {
      socket.disconnect();
    };
  }, [branchId]);

  const handleCreateCourierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourierError(null);

    try {
      const result = await createCourier({
        name: newCourierName.trim(),
        phone: newCourierPhone.trim(),
        vehicleType: newCourierVehicle,
        pinCode: newCourierPin.trim() || undefined,
      });

      setNewCourierName('');
      setNewCourierPhone('+7707');
      setNewCourierPin('');
      setShowCourierModal(false);

      if (result.generatedPinCode) {
        setCreatedPinModalInfo({
          name: result.name,
          phone: result.phone,
          pinCode: result.generatedPinCode,
        });
      }

      loadData();
    } catch (err: any) {
      setCourierError(err.message || 'Ошибка добавления курьера');
    }
  };

  const handleResetPin = async (courier: any) => {
    if (!window.confirm(`Сбросить PIN-код для курьера ${courier.name}?`)) return;
    try {
      const result = await resetCourierPin(courier.id);
      setCreatedPinModalInfo({
        name: result.name,
        phone: result.phone,
        pinCode: result.generatedPinCode,
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка сброса PIN-кода');
    }
  };

  const handleCourierStatusToggle = async (courier: any) => {
    const nextStatus = courier.status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
    try {
      await updateCourierStatus(courier.id, nextStatus);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedCourierId) return;

    setAssignmentError(null);
    try {
      await assignCourierToOrder(selectedOrder.id, selectedCourierId);
      setSelectedOrder(null);
      setSelectedCourierId('');
      loadData();
    } catch (err: any) {
      setAssignmentError(err.message || 'Ошибка назначения курьера');
    }
  };

  const availableCouriers = couriers.filter((c) => c.status === 'AVAILABLE');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Курьерская Доставка & Диспетчерская</h1>
          <p className="page-subtitle">Управление курьерами, выданными PIN-кодами и назначением заказов в реальном времени</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={16} /> Обновить
          </button>
          <button className="btn btn-primary" onClick={() => setShowCourierModal(true)}>
            <Plus size={16} /> Добавить курьера
          </button>
        </div>
      </div>

      {/* Couriers Fleet Grid */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#fff' }}>Штат Курьеров ({couriers.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {couriers.map((courier) => (
            <div key={courier.id} className="card" style={{ background: '#121824', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{courier.name}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-twilight-blue)' }}>{courier.phone}</div>
                </div>
                <span className={`badge ${courier.status === 'AVAILABLE' ? 'badge-success' : courier.status === 'ON_DELIVERY' ? 'badge-info' : 'badge-neutral'}`}>
                  {courier.status === 'AVAILABLE' ? 'В сети' : courier.status === 'ON_DELIVERY' ? 'На доставке' : 'Офлайн'}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--color-twilight-blue)', marginBottom: '12px' }}>
                Транспорт: <strong>{courier.vehicleType}</strong> | Активных заказов: <strong>{courier.deliveries?.length || 0}</strong>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem' }}
                  onClick={() => handleCourierStatusToggle(courier)}
                >
                  {courier.status === 'AVAILABLE' ? 'Снять со смены' : 'Вывести в сеть'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#f59e0b', borderColor: '#f59e0b40' }}
                  title="Сбросить PIN-код курьера"
                  onClick={() => handleResetPin(courier)}
                >
                  <KeyRound size={14} /> PIN
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Orders List */}
      <div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#fff' }}>Заказы на Доставку</h3>
        <div className="card" style={{ background: '#121824', padding: '0', overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#090d14', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 16px' }}>№ Заказа</th>
                <th style={{ padding: '12px 16px' }}>Адрес Доставки</th>
                <th style={{ padding: '12px 16px' }}>Телефон</th>
                <th style={{ padding: '12px 16px' }}>Сумма</th>
                <th style={{ padding: '12px 16px' }}>Статус Заказа</th>
                <th style={{ padding: '12px 16px' }}>Курьер & Статус Доставки</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Действие</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-twilight-blue)' }}>
                    Заказов типа DELIVERY пока нет.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#38bdf8' }}>{order.orderNumber}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#ef4444" />
                        {order.deliveryAddress || 'Не указан'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-twilight-blue)' }}>{order.customerPhone || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#34d399' }}>{order.totalAmount} KZT</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-info">{order.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {order.courier ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{order.courier.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>{order.deliveryStatus}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>Не назначен</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {!order.courierId && order.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => { setSelectedOrder(order); setSelectedCourierId(''); setAssignmentError(null); }}
                        >
                          <UserCheck size={14} /> Назначить
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Courier */}
      {showCourierModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#121824', padding: '24px', borderRadius: '14px', width: '90%', maxWidth: '420px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Добавить нового курьера</h3>

            {courierError && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>
                ⚠️ {courierError}
              </div>
            )}

            <form onSubmit={handleCreateCourierSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '4px' }}>ФИО курьера:</label>
                <input
                  type="text"
                  required
                  value={newCourierName}
                  onChange={(e) => setNewCourierName(e.target.value)}
                  placeholder="Фархад Абдуллаев"
                  style={{ width: '100%', padding: '8px 12px', background: '#090d14', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '4px' }}>Телефон:</label>
                <input
                  type="text"
                  required
                  value={newCourierPhone}
                  onChange={(e) => setNewCourierPhone(e.target.value)}
                  placeholder="+77071234567"
                  style={{ width: '100%', padding: '8px 12px', background: '#090d14', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '4px' }}>Тип транспорта:</label>
                <select
                  value={newCourierVehicle}
                  onChange={(e) => setNewCourierVehicle(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', background: '#090d14', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '8px' }}
                >
                  <option value="CAR">🚗 Автомобиль</option>
                  <option value="SCOOTER">🛵 Скутер / Мопед</option>
                  <option value="BICYCLE">🚲 Велосипед</option>
                  <option value="ON_FOOT">🚶 Пеший</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '4px' }}>PIN-код для входа (необязательно, сгенерируется автоматически):</label>
                <input
                  type="text"
                  maxLength={6}
                  value={newCourierPin}
                  onChange={(e) => setNewCourierPin(e.target.value)}
                  placeholder="Оставьте пустым для авто-генерации"
                  style={{ width: '100%', padding: '8px 12px', background: '#090d14', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Создать курьера</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourierModal(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Display Created or Reset PIN Code */}
      {createdPinModalInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#121824', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', border: '1px solid #10b981', textAlign: 'center' }}>
            <CheckCircle2 size={42} color="#34d399" style={{ marginBottom: '10px' }} />
            <h3 style={{ margin: '0 0 6px 0', color: '#fff' }}>PIN-код курьера выдан!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-twilight-blue)', margin: '0 0 16px 0' }}>
              Передайте этот PIN-код курьеру <strong>{createdPinModalInfo.name}</strong> ({createdPinModalInfo.phone}) для входа в приложение CourierView:
            </p>

            <div style={{
              background: '#090d14',
              border: '1px dashed #34d399',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '8px',
              color: '#34d399',
              marginBottom: '16px',
            }}>
              {createdPinModalInfo.pinCode}
            </div>

            <p style={{ fontSize: '0.75rem', color: '#f59e0b', margin: '0 0 16px 0' }}>
              ⚠️ Запишите этот код. В базе данных он сохраняется в зашифрованном виде (bcrypt).
            </p>

            <button className="btn btn-primary" style={{ width: '100%', padding: '10px' }} onClick={() => setCreatedPinModalInfo(null)}>
              Понятно, закрыть
            </button>
          </div>
        </div>
      )}

      {/* Modal: Assign Courier */}
      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#121824', padding: '24px', borderRadius: '14px', width: '90%', maxWidth: '420px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Назначить курьера на заказ {selectedOrder.orderNumber}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-twilight-blue)', marginBottom: '14px' }}>
              Адрес: {selectedOrder.deliveryAddress || 'Не указан'}
            </p>

            {assignmentError && (
              <div style={{ padding: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>
                ⚠️ {assignmentError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-twilight-blue)', marginBottom: '6px' }}>Доступные курьеры (в сети):</label>
                {availableCouriers.length === 0 ? (
                  <div style={{ color: '#f59e0b', fontSize: '0.85rem', background: '#090d14', padding: '10px', borderRadius: '8px' }}>
                    Нет свободных курьеров со статусом "В сети". Выведите курьера на смену выше.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedCourierId}
                    onChange={(e) => setSelectedCourierId(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#090d14', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '8px' }}
                  >
                    <option value="">-- Выберите курьера --</option>
                    {availableCouriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) — {c.vehicleType}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={availableCouriers.length === 0} className="btn btn-primary" style={{ flex: 1 }}>Подтвердить назначение</button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
