import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Play, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { fetchOrders, updateOrderStatus, fetchTables } from '../services/api';

interface KDSViewProps {
  branchId?: string;
  onRefreshOrders?: () => void;
}

export const KDSView: React.FC<KDSViewProps> = ({ branchId: propBranchId, onRefreshOrders }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string | null>(propBranchId || null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [notification, setNotification] = useState<string | null>(null);

  const loadAllOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data || []);
    } catch (e) {
      console.error('Error loading orders for KDS:', e);
    }
  };

  useEffect(() => {
    loadAllOrders();

    if (!propBranchId) {
      fetchTables()
        .then((tables) => {
          if (tables && tables.length > 0 && tables[0].branchId) {
            setBranchId(tables[0].branchId);
          }
        })
        .catch((e) => console.error('Error loading tables for KDS branchId:', e));
    }

    // Ticking timer for real-time order elapsed duration
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [propBranchId]);

  useEffect(() => {
    if (!branchId) return;

    // Socket.IO subscription for live order events with real branchId
    const socket: Socket = io('http://localhost:3001/events', {
      query: { branchId },
    });

    socket.on('order.created', (newOrder: any) => {
      setOrders((prev) => [newOrder, ...prev]);
      setNotification(`🔔 НОВЫЙ ЗАКАЗ ${newOrder.orderNumber} (${newOrder.table?.label || 'Онлайн'})`);
      setTimeout(() => setNotification(null), 5000);
    });

    socket.on('order.status_changed', (payload: any) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === payload.orderId ? payload.order : o))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [branchId]);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (onRefreshOrders) onRefreshOrders();
    } catch (err: any) {
      alert(`Ошибка смены статуса: ${err.message}`);
    }
  };

  const getElapsedTime = (createdAtStr: string) => {
    const start = new Date(createdAtStr).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((currentTime - start) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const newOrders = orders.filter((o) => o.status === 'NEW');
  const preparingOrders = orders.filter((o) => ['ACCEPTED', 'PREPARING'].includes(o.status));
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <div style={{ background: '#090d14', minHeight: 'calc(100vh - 40px)', margin: '-24px', padding: '24px' }}>
      {/* KDS Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#121824', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ChefHat size={28} color="var(--color-signal-blue)" />
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              KDS (Kitchen Display System — Экран кухни)
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-twilight-blue)' }}>
              Онлайн-табло заказов в реальном времени с автосписанием при принятии
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={loadAllOrders}>
            <RefreshCw size={14} /> Обновить
          </button>
          <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Volume2 size={12} /> WebSockets Active
          </span>
        </div>
      </div>

      {/* New Order Alert Banner */}
      {notification && (
        <div style={{ background: 'rgba(231,0,11,0.9)', color: '#fff', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontWeight: 700, textAlign: 'center', fontSize: '1rem' }}>
          {notification}
        </div>
      )}

      {/* KDS Kanban 3 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Column 1: NEW */}
        <div style={{ background: '#121824', borderRadius: '12px', border: '1px solid rgba(231,0,11,0.3)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #e7000b' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f87171', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> НОВЫЕ (Ожидают принятия)
            </h3>
            <span className="badge badge-danger" style={{ fontSize: '0.85rem' }}>{newOrders.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {newOrders.map((order) => (
              <div key={order.id} style={{ background: '#090d14', borderRadius: '10px', padding: '14px', border: '1px solid rgba(231,0,11,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{order.orderNumber}</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-signal-blue)', fontWeight: 600 }}>
                      {order.table?.label || (order.type === 'DINE_IN_QR' ? 'Заказ за столом' : 'Самовывоз')}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.85rem', color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> {getElapsedTime(order.createdAt)}
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                  {order.items?.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <strong style={{ color: 'var(--color-emerald)' }}>x{item.quantity}</strong>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', justifyContent: 'center', background: '#e7000b', borderColor: '#e7000b' }}
                  onClick={() => handleStatusChange(order.id, 'ACCEPTED')}
                >
                  <Play size={16} /> Принять и списать сырье
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: PREPARING */}
        <div style={{ background: '#121824', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.3)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #f59e0b' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} /> ГОТОВИТСЯ НА КУХНЕ
            </h3>
            <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>{preparingOrders.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {preparingOrders.map((order) => (
              <div key={order.id} style={{ background: '#090d14', borderRadius: '10px', padding: '14px', border: '1px solid rgba(245,158,11,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{order.orderNumber}</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-signal-blue)', fontWeight: 600 }}>
                      {order.table?.label || 'Онлайн'}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>
                    ⏱️ {getElapsedTime(order.createdAt)}
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
                  {order.items?.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <strong style={{ color: 'var(--color-emerald)' }}>x{item.quantity}</strong>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', justifyContent: 'center', background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
                  onClick={() => handleStatusChange(order.id, 'READY')}
                >
                  <CheckCircle2 size={16} /> Блюдо Готово!
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: READY */}
        <div style={{ background: '#121824', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #10b981' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} /> ГОТОВО К ВЫДАЧЕ
            </h3>
            <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>{readyOrders.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {readyOrders.map((order) => (
              <div key={order.id} style={{ background: '#090d14', borderRadius: '10px', padding: '14px', border: '1px solid rgba(16,185,129,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{order.orderNumber}</span>
                    <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
                      {order.table?.label || 'Выдача'}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '8px', justifyContent: 'center', fontSize: '0.8rem' }}
                  onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                >
                  Завершить заказ
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
