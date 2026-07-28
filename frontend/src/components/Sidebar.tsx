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
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
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

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
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

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--color-stone)' }}>
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
