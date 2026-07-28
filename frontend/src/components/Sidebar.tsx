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
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--color-signal-blue)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-whiteout)', letterSpacing: '-0.02em' }}>
            Restaurant OS
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-signal-blue)', fontWeight: 600 }}>
            Kazakhstan Core v2.0
          </div>
        </div>
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
              <Icon size={18} color={isActive ? 'var(--color-signal-blue)' : 'var(--color-twilight-blue)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Branch & POS Status Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-twilight-blue)', marginBottom: '4px' }}>
          Филиал: <strong>Almaty Dostyk</strong>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-emerald)' }}></span>
          Nexium POS Connected
        </div>
      </div>
    </aside>
  );
};
