import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { WarehouseView } from './components/WarehouseView';
import { MenuView } from './components/MenuView';
import { MovementsView } from './components/MovementsView';
import { SimulatorView } from './components/SimulatorView';
import { KDSView } from './components/KDSView';
import { OrdersView } from './components/OrdersView';
import { GuestMenuView } from './public/GuestMenuView';
import { CRMView } from './components/CRMView';
import { DeliveryView } from './components/DeliveryView';
import { CourierView } from './components/CourierView';
import { AnalyticsView } from './components/AnalyticsView';
import { 
  fetchDashboardSummary, 
  fetchBalances, 
  fetchMenuItems, 
  fetchMovements, 
  fetchIncidents 
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllData = async () => {
    try {
      const [summary, bal, menu, mov, inc] = await Promise.all([
        fetchDashboardSummary().catch(() => null),
        fetchBalances().catch(() => []),
        fetchMenuItems().catch(() => []),
        fetchMovements().catch(() => []),
        fetchIncidents().catch(() => []),
      ]);

      setSummaryData(summary);
      setBalances(bal);
      setMenuItems(menu);
      setMovements(mov);
      setIncidents(inc);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (activeTab === 'guest-menu') {
    return <GuestMenuView qrSlug="table-7" onClosePreview={() => setActiveTab('dashboard')} />;
  }

  if (activeTab === 'courier-app') {
    return (
      <div style={{ background: '#090d14', minHeight: '100vh' }}>
        <div style={{ padding: '10px 16px', background: '#121824', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setActiveTab('dashboard')}>
            ← Назад в панель Restaurant OS
          </button>
          <span className="badge badge-info">PWA Courier Emulator</span>
        </div>
        <CourierView />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-twilight-blue)' }}>
            Загрузка данных Restaurant OS...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView summaryData={summaryData} onNavigateTab={setActiveTab} />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsView />
            )}
            {activeTab === 'crm' && (
              <CRMView />
            )}
            {activeTab === 'delivery' && (
              <DeliveryView />
            )}
            {activeTab === 'warehouse' && (
              <WarehouseView balances={balances} onRefresh={loadAllData} />
            )}
            {activeTab === 'menu' && (
              <MenuView menuItems={menuItems} onRefresh={loadAllData} />
            )}
            {activeTab === 'kds' && (
              <KDSView onRefreshOrders={loadAllData} />
            )}
            {activeTab === 'orders' && (
              <OrdersView />
            )}
            {activeTab === 'movements' && (
              <MovementsView movements={movements} incidents={incidents} />
            )}
            {activeTab === 'simulator' && (
              <SimulatorView menuItems={menuItems} onReceiptProcessed={loadAllData} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
