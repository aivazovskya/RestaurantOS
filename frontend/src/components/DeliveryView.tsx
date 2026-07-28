import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  UserCheck, 
  Plus, 
  ShoppingBag, 
  RefreshCw 
} from 'lucide-react';
import { 
  fetchOrders, 
  fetchCouriers, 
  createCourier, 
  assignCourierToOrder, 
  updateCourierStatus 
} from '../services/api';
import { io } from 'socket.io-client';

export const DeliveryView: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);

  // New Courier Form State
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierPhone, setNewCourierPhone] = useState('+7707');
  const [newCourierVehicle, setNewCourierVehicle] = useState<'CAR' | 'SCOOTER' | 'BICYCLE' | 'ON_FOOT'>('CAR');
  const [courierError, setCourierError] = useState<string | null>(null);

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

    // WebSockets live updates
    const socket = io('http://localhost:3001/events', {
      query: { branchId: 'default-branch' },
    });

    socket.on('order.created', (newOrder: any) => {
      if (newOrder.type === 'DELIVERY') {
        setOrders((prev) => [newOrder, ...prev]);
      }
    });

    socket.on('delivery.assigned', (updatedOrder: any) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      fetchCouriers().then((res) => setCouriers(res || []));
    });

    socket.on('delivery.status_changed', (payload: any) => {
      setOrders((prev) => prev.map((o) => (o.id === payload.orderId ? payload.order : o)));
      fetchCouriers().then((res) => setCouriers(res || []));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateCourierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourierError(null);

    try {
      await createCourier({
        name: newCourierName.trim(),
        phone: newCourierPhone.trim(),
        vehicleType: newCourierVehicle,
      });

      setNewCourierName('');
      setNewCourierPhone('+7707');
      setShowCourierModal(false);
      loadData();
    } catch (err: any) {
      setCourierError(err.message || 'Ошибка добавления курьера');
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
          <p className="page-subtitle">Управление курьерами, назначение заказов и отслеживание статусов доставки в реальном времени</p>
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

      {/* Couriers Roster Grid */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 300, marginBottom: '14px', fontFamily: 'var(--font-waldenburg)', color: 'var(--color-ink)' }}>
          Курьерский состав филиала ({couriers.length})
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {couriers.map((courier) => (
            <div key={courier.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-ink)' }}>{courier.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-smoke)', margin: '2px 0' }}>
                  📞 {courier.phone} • {courier.vehicleType === 'CAR' ? '🚗 Авто' : courier.vehicleType === 'SCOOTER' ? '🛵 Скутер' : courier.vehicleType === 'BICYCLE' ? '🚲 Велосипед' : '🚶 Пеший'}
                </div>
              </div>

              <button
                className={`badge ${courier.status === 'AVAILABLE' ? 'badge-success' : courier.status === 'ON_DELIVERY' ? 'badge-warning' : 'badge-secondary'}`}
                style={{ cursor: courier.status === 'ON_DELIVERY' ? 'default' : 'pointer', border: 'none' }}
                onClick={() => courier.status !== 'ON_DELIVERY' && handleCourierStatusToggle(courier)}
              >
                {courier.status === 'AVAILABLE' ? 'Смена: Активен' : courier.status === 'ON_DELIVERY' ? 'На доставке' : 'Оффлайн'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Orders Dispatcher Table */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 300, marginBottom: '14px', fontFamily: 'var(--font-waldenburg)', color: 'var(--color-ink)' }}>
        Заказы на доставку
      </h2>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Номер заказа</th>
              <th>Клиент / Телефон</th>
              <th>Адрес доставки</th>
              <th>Сумма</th>
              <th>Назначенный курьер</th>
              <th>Статус доставки</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-smoke)' }}>
                  Нет заказов на доставку
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{o.orderNumber}</td>
                  <td>{o.customerPhone || 'Не указан'}</td>
                  <td style={{ fontSize: '0.85rem', color: '#0447ff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {o.deliveryAddress || 'Самовывоз / Зал'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--color-emerald)' }}>{o.totalAmount?.toLocaleString('ru-RU')} ₸</td>
                  <td>
                    {o.courier ? (
                      <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                        👤 {o.courier.name} ({o.courier.phone})
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#d13000', fontWeight: 500 }}>
                        ⚠️ Не назначен
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        o.deliveryStatus === 'DELIVERED'
                          ? 'badge-success'
                          : o.deliveryStatus === 'EN_ROUTE' || o.deliveryStatus === 'PICKED_UP'
                          ? 'badge-warning'
                          : o.deliveryStatus === 'ASSIGNED'
                          ? 'badge-info'
                          : o.deliveryStatus === 'FAILED'
                          ? 'badge-danger'
                          : 'badge-secondary'
                      }`}
                    >
                      {o.deliveryStatus || 'PENDING_ASSIGNMENT'}
                    </span>
                  </td>
                  <td>
                    {!o.courier && o.status !== 'CANCELLED' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => setSelectedOrder(o)}
                      >
                        <UserCheck size={12} /> Назначить курьера
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Courier */}
      {showCourierModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Регистрация нового курьера</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowCourierModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCourierSubmit}>
              {courierError && (
                <div style={{ background: 'rgba(209,48,0,0.1)', color: '#d13000', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.82rem' }}>
                  {courierError}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">ФИО Курьера</label>
                <input required className="form-input" value={newCourierName} onChange={(e) => setNewCourierName(e.target.value)} placeholder="Например, Арман Сериков" />
              </div>
              <div className="form-group">
                <label className="form-label">Номер телефона (смены/уведомления)</label>
                <input required className="form-input" value={newCourierPhone} onChange={(e) => setNewCourierPhone(e.target.value)} placeholder="+77071234567" />
              </div>
              <div className="form-group">
                <label className="form-label">Транспортное средство</label>
                <select className="form-select" value={newCourierVehicle} onChange={(e: any) => setNewCourierVehicle(e.target.value)}>
                  <option value="CAR">🚗 Автомобиль</option>
                  <option value="SCOOTER">🛵 Скутер / Мопед</option>
                  <option value="BICYCLE">🚲 Велосипед</option>
                  <option value="ON_FOOT">🚶 Пеший курьер</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourierModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Зарегистрировать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Courier to Order */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Назначить курьера на заказ {selectedOrder.orderNumber}</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              {assignmentError && (
                <div style={{ background: 'rgba(209,48,0,0.1)', color: '#d13000', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.82rem' }}>
                  {assignmentError}
                </div>
              )}
              <div style={{ background: 'var(--color-warm-taupe)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div><strong>Адрес:</strong> {selectedOrder.deliveryAddress}</div>
                <div><strong>Клиент:</strong> {selectedOrder.customerPhone || 'Без телефона'}</div>
                <div><strong>Сумма:</strong> {selectedOrder.totalAmount?.toLocaleString('ru-RU')} ₸</div>
              </div>

              <div className="form-group">
                <label className="form-label">Выберите доступного курьера на смене</label>
                {availableCouriers.length === 0 ? (
                  <div style={{ color: '#d13000', fontSize: '0.85rem' }}>⚠️ Нет доступных курьеров со статусом AVAILABLE! Переключите курьера в активную смену.</div>
                ) : (
                  <select className="form-select" value={selectedCourierId} onChange={(e) => setSelectedCourierId(e.target.value)} required>
                    <option value="">-- Выберите курьера --</option>
                    {availableCouriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) • {c.vehicleType}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={availableCouriers.length === 0 || !selectedCourierId}>
                  Подтвердить назначение
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
