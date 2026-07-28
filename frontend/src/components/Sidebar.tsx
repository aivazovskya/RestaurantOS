import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  UtensilsCrossed, 
  History, 
  Zap,
  Building2
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Дашборд обзора', icon: LayoutDashboard },
    { id: 'warehouse', label: 'Склад и Остатки', icon: Boxes },
    { id: 'menu', label: 'Меню и Техкарты', icon: UtensilsCrossed },
    { id: 'movements', label: 'История движений', icon: History },
    { id: 'simulator', label: 'Симулятор Nexium POS', icon: Zap },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-icon">
          <Building2 size={22} />
        </div>
        <div>
          <div className="brand-title">Restaurant OS</div>
          <span className="brand-tag">Kazakhstan v1.0</span>
        </div>
      </div>

      <nav className="nav-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div><strong>Интеграция:</strong> Nexium POS</div>
        <div style={{ color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          Event Bus Active
        </div>
      </div>
    </aside>
  );
};
