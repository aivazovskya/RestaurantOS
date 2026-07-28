import React, { useState, useEffect } from 'react';
import { ShoppingBag, Bell, CheckCircle, ShieldAlert, Plus, Minus, ArrowRight } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { fetchPublicMenu, callWaiter, createPublicOrder } from '../services/api';

interface GuestMenuViewProps {
  qrSlug?: string;
  onClosePreview?: () => void;
}

export const GuestMenuView: React.FC<GuestMenuViewProps> = ({ qrSlug = 'table-7', onClosePreview }) => {
  const [menuData, setMenuData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<{ [posItemId: string]: { item: any; quantity: number } }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [waiterToast, setWaiterToast] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMenu = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPublicMenu(qrSlug);
      setMenuData(data.table);
      setItems(data.items || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка загрузки меню');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [qrSlug]);

  useEffect(() => {
    const branchId = menuData?.branchId;
    if (!branchId) return;

    // Subscribe to WebSockets for live stop-list updates with real branchId
    const socket: Socket = io('http://localhost:3001/events', {
      query: { branchId },
    });

    socket.on('stoplist.changed', (payload: any) => {
      setItems((prevItems) =>
        prevItems.map((it) => {
          if (it.posItemId === payload.posItemId || it.id === payload.menuItemId) {
            return {
              ...it,
              isAvailable: payload.isAvailable,
              displayStatus: payload.isAvailable ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE',
              statusMessage: payload.isAvailable ? null : 'Временно недоступно',
            };
          }
          return it;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [menuData?.branchId]);

  const categories = ['ALL', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = selectedCategory === 'ALL' ? items : items.filter((i) => i.category === selectedCategory);

  const updateCart = (item: any, delta: number) => {
    if (!item.isAvailable && delta > 0) return;

    const key = item.posItemId;
    const current = cart[key]?.quantity || 0;
    const next = current + delta;

    if (next <= 0) {
      const copy = { ...cart };
      delete copy[key];
      setCart(copy);
    } else {
      setCart({
        ...cart,
        [key]: { item, quantity: next },
      });
    }
  };

  const cartTotal = Object.values(cart).reduce((sum, c) => sum + c.item.sellingPrice * c.quantity, 0);

  const handleCallWaiterClick = async () => {
    try {
      const res = await callWaiter(qrSlug);
      setWaiterToast(res.message || 'Официант уведомлен!');
      setTimeout(() => setWaiterToast(null), 4000);
    } catch (err: any) {
      setWaiterToast('Ошибка вызова официанта');
    }
  };

  const [orderType, setOrderType] = useState<'DINE_IN_QR' | 'DELIVERY'>('DINE_IN_QR');
  const [deliveryAddress, setDeliveryAddress] = useState('г. Алматы, пр. Достык 120, кв. 45');
  const [customerPhone, setCustomerPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedPoints, setAppliedPoints] = useState<number>(0);

  const handlePlaceOrder = async () => {
    if (Object.keys(cart).length === 0) return;

    setIsSubmittingOrder(true);
    setErrorMessage(null);

    const payload = {
      qrSlug,
      type: orderType,
      deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
      customerPhone: customerPhone || undefined,
      couponCode: couponCode ? couponCode.trim() : undefined,
      appliedPoints: appliedPoints > 0 ? appliedPoints : undefined,
      items: Object.entries(cart).map(([posItemId, c]) => ({
        posItemId,
        quantity: c.quantity,
      })),
    };

    try {
      const order = await createPublicOrder(payload);
      setOrderSuccess(order);
      setCart({});
      setCouponCode('');
      setAppliedPoints(0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка оформления заказа');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 20px', textAlign: 'center', background: '#090d14', minHeight: '100vh', color: 'var(--color-twilight-blue)' }}>
        Загрузка меню ресторана...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', background: '#090d14', minHeight: '100vh', paddingBottom: '100px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Mobile Top Header */}
      <div style={{ background: '#121824', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-signal-blue)', textTransform: 'uppercase', fontWeight: 600 }}>
            {menuData?.branchName || 'Ресторан'}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            {menuData?.label || 'Стол 7'}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onClosePreview && (
            <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={onClosePreview}>
              Вернуться в панель
            </button>
          )}
          <button
            className="btn btn-primary"
            style={{ padding: '8px 12px', fontSize: '0.8rem', background: '#e7000b', borderColor: '#e7000b' }}
            onClick={handleCallWaiterClick}
          >
            <Bell size={14} /> Вызвать официанта
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {waiterToast && (
        <div style={{ background: 'rgba(43, 127, 255, 0.9)', color: '#fff', padding: '12px 20px', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
          🔔 {waiterToast}
        </div>
      )}

      {/* Order Success Modal Banner */}
      {orderSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', margin: '16px', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <CheckCircle size={32} color="#34d399" style={{ marginBottom: '8px' }} />
          <h3 style={{ margin: '0 0 6px 0', color: '#34d399', fontSize: '1.1rem' }}>Заказ {orderSuccess.orderNumber} отправлен на кухню!</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-twilight-blue)', margin: 0 }}>
            Повара уже готовят ваше блюдо. Статус появится на экране кухни KDS.
          </p>
          <button className="btn btn-secondary" style={{ marginTop: '12px', width: '100%', fontSize: '0.8rem' }} onClick={() => setOrderSuccess(null)}>
            Сделать еще один заказ
          </button>
        </div>
      )}

      {errorMessage && (
        <div style={{ background: 'rgba(231,0,11,0.15)', border: '1px solid rgba(231,0,11,0.4)', margin: '16px', padding: '14px', borderRadius: '12px', color: '#f87171', fontSize: '0.85rem' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 20px', overflowX: 'auto', borderBottom: '1px solid var(--color-border)' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: selectedCategory === cat ? 'var(--color-signal-blue)' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat === 'ALL' ? 'Все меню' : cat}
          </button>
        ))}
      </div>

      {/* Menu Item Cards */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredItems.map((dish) => {
          const qty = cart[dish.posItemId]?.quantity || 0;
          const isStopped = !dish.isAvailable;

          return (
            <div
              key={dish.id}
              style={{
                background: '#121824',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid',
                borderColor: isStopped ? 'rgba(231,0,11,0.3)' : 'var(--color-border)',
                opacity: isStopped ? 0.65 : 1,
                display: 'flex',
                gap: '12px',
              }}
            >
              {dish.imageUrl && (
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  <img src={dish.imageUrl} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isStopped ? 'grayscale(0.8)' : undefined }} />
                </div>
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isStopped ? 'var(--color-twilight-blue)' : '#fff', marginBottom: '4px' }}>
                    {dish.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', marginBottom: '8px' }}>
                    {dish.description}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-emerald)' }}>
                    {dish.sellingPrice?.toLocaleString('ru-RU')} ₸
                  </div>

                  {isStopped ? (
                    <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldAlert size={12} /> Временно недоступно
                    </span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {qty > 0 && (
                        <>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => updateCart(dish, -1)}>
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{qty}</span>
                        </>
                      )}
                      <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => updateCart(dish, 1)}>
                        <Plus size={12} /> {qty === 0 && 'В заказ'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar */}
      {Object.keys(cart).length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '480px', margin: '0 auto', background: '#121824', borderTop: '1px solid var(--color-border)', padding: '14px 16px', zIndex: 100 }}>
          {/* Order Type Switcher */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setOrderType('DINE_IN_QR')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: orderType === 'DINE_IN_QR' ? 'var(--color-signal-blue)' : '#090d14',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🍽️ Заказать в зале (Стол 7)
            </button>
            <button
              type="button"
              onClick={() => setOrderType('DELIVERY')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: orderType === 'DELIVERY' ? 'var(--color-signal-blue)' : '#090d14',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🚴 Курьерская доставка
            </button>
          </div>

          {orderType === 'DELIVERY' && (
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Адрес доставки (Улица, дом, квартира)..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: '#090d14', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600 }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Ваш телефон (+7...)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: '#090d14', color: '#fff', fontSize: '0.78rem' }}
            />
            <input
              type="text"
              placeholder="Промокод"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: '#090d14', color: '#fff', fontSize: '0.78rem', textTransform: 'uppercase' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-twilight-blue)' }}>Итого к оплате:</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-emerald)' }}>{cartTotal.toLocaleString('ru-RU')} ₸</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem', justifyContent: 'center', background: 'var(--color-emerald)', borderColor: 'var(--color-emerald)' }}
            disabled={isSubmittingOrder}
            onClick={handlePlaceOrder}
          >
            <ShoppingBag size={18} />
            {isSubmittingOrder ? 'Отправка заказа...' : orderType === 'DELIVERY' ? 'Оформить курьерскую доставку' : 'Оформить заказ на Стол 7'}
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
