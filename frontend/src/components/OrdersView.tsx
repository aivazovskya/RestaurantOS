import React, { useState, useEffect } from 'react';
import { RefreshCw, XCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { fetchOrders, updateOrderStatus, fetchTables, WS_BASE, getAuthToken } from '../services/api';


interface OrdersViewProps {
  branchId?: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ branchId: propBranchId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string | null>(propBranchId || null);

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    loadOrders();

    if (!propBranchId) {
      fetchTables()
        .then((tables) => {
          if (tables && tables.length > 0 && tables[0].branchId) {
            setBranchId(tables[0].branchId);
          }
        })
        .catch((e) => console.error('Error loading tables for OrdersView branchId:', e));
    }
  }, [propBranchId]);

  useEffect(() => {
    if (!branchId) return;

    const token = getAuthToken();
    const socket: Socket = io(`${WS_BASE}/events`, {
      auth: { token },
      query: { branchId },
    });

    socket.on('order.created', (newOrder: any) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
    });

    socket.on('order.status_changed', (payload: any) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === payload.orderId ? payload.order : o))
      );
    });

    socket.on('delivery.status_changed', (payload: any) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === payload.orderId ? payload.order : o))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [branchId]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Вы действительно хотите отменить заказ? Если заказ был принят, сырье автоматически вернется на склад!')) return;

    try {
      await updateOrderStatus(orderId, 'CANCELLED');
      loadOrders();
    } catch (err: any) {
      alert(`Ошибка отмены: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Заказы (QR & Онлайн)</h1>
          <p className="page-subtitle">История и отслеживание онлайн-заказов с автоматическим реверсивным списанием при отмене</p>
        </div>
        <button className="btn btn-secondary" onClick={loadOrders}>
          <RefreshCw size={16} /> Обновить
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Номер заказа</th>
              <th>Тип / Источник</th>
              <th>Стол / Данные</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Время создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-twilight-blue)' }}>
                  Заказов пока нет
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{o.orderNumber}</td>
                  <td>
                    <span className="badge badge-info">{o.type}</span>
                  </td>
                  <td>{o.table?.label || o.customerPhone || 'Онлайн'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-emerald)' }}>{o.totalAmount?.toLocaleString('ru-RU')} ₸</td>
                  <td>
                    <span
                      className={`badge ${
                        o.status === 'NEW'
                          ? 'badge-danger'
                          : o.status === 'READY' || o.status === 'COMPLETED'
                          ? 'badge-success'
                          : o.status === 'CANCELLED'
                          ? 'badge-secondary'
                          : 'badge-warning'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-twilight-blue)' }}>
                    {new Date(o.createdAt).toLocaleString('ru-RU')}
                  </td>
                  <td>
                    {o.status !== 'CANCELLED' && o.status !== 'COMPLETED' && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#f87171' }}
                        onClick={() => handleCancelOrder(o.id)}
                      >
                        <XCircle size={12} /> Отменить заказ
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
  );
};
