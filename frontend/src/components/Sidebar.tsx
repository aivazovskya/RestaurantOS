import React from 'react';
import { 
  LayoutDashboard, 
  Warehouse, 
  BookOpen, 
  ArrowLeftRight, 
  Zap, 
  ChefHat, 
  ShoppingBag, 
  QrCode,
  ShieldCheck,
  Users,
  Truck,
  Bike,
  Sparkles,
  LogOut,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLoginModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenLoginModal }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'analytics', label: 'AI Аналитика & Чат', icon: Sparkles },
    { id: 'crm', label: 'CRM и Лояльность', icon: Users },
    { id: 'delivery', label: 'Курьерская доставка', icon: Truck },
    { id: 'courier-app', label: 'Экран курьера', icon: Bike },
    { id: 'warehouse', label: 'Склад и Остатки', icon: Warehouse },
    { id: 'menu', label: 'Меню и Техкарты', icon: BookOpen },
    { id: 'kds', label: 'KDS (Экран кухни)', icon: ChefHat },
    { id: 'orders', label: 'Заказы (QR & Онлайн)', icon: ShoppingBag },
    { id: 'movements', label: 'Движение сырья', icon: ArrowLeftRight },
    { id: 'simulator', label: 'Симулятор POS', icon: Zap },
    { id: 'guest-menu', label: 'QR-Меню Гостя', icon: QrCode },
  ];

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'OWNER': return { bg: '#3b82f620', border: '#3b82f6', color: '#60a5fa', label: '👑 OWNER' };
      case 'MANAGER': return { bg: '#10b98120', border: '#10b981', color: '#34d399', label: '💼 MANAGER' };
      case 'STOREKEEPER': return { bg: '#f59e0b20', border: '#f59e0b', color: '#fbbf24', label: '📦 STOREKEEPER' };
      case 'CHEF': return { bg: '#ec489920', border: '#ec4899', color: '#f472b6', label: '👨‍🍳 CHEF' };
      case 'COURIER': return { bg: '#8b5cf620', border: '#8b5cf6', color: '#a78bfa', label: '🛵 COURIER' };
      default: return { bg: '#6b728020', border: '#6b7280', color: '#9ca3af', label: '🔒 ГОСТЬ' };
    }
  };

  const badge = getRoleBadgeStyle(user?.role);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--color-ink)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: '1.1rem', color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
            Restaurant OS
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-smoke)', fontWeight: 400 }}>
            Kazakhstan Core v2.0
          </div>
        </div>
      </div>

      {/* User Auth Profile Box */}
      <div style={{
        background: '#121824',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '10px 12px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge" style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, fontSize: '0.7rem' }}>
            {badge.label}
          </span>
          {user ? (
            <button
              onClick={logout}
              title="Выйти из аккаунта"
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
            >
              <LogOut size={13} />
              Выход
            </button>
          ) : (
            <button
              onClick={onOpenLoginModal}
              style={{ background: 'var(--color-primary, #3b82f6)', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
            >
              <LogIn size={13} />
              Войти
            </button>
          )}
        </div>
        {user ? (
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.fullName || user.email || 'Пользователь'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-twilight-blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email || user.phone}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.78rem', color: 'var(--color-twilight-blue)' }}>
            Авторизуйтесь для RBAC-доступа к модулям.
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} color={isActive ? '#ffffff' : 'var(--color-smoke)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Branch & POS Status Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-stone)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-smoke)', marginBottom: '6px' }}>
          Филиал: <strong style={{ color: 'var(--color-ink)', fontWeight: 500 }}>Almaty Dostyk</strong>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-emerald)' }}></span>
          Nexium POS Connected
        </div>
      </div>
    </aside>
  );
};
