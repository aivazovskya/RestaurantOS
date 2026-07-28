import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { WarehouseView } from './components/WarehouseView';
import { MenuView } from './components/MenuView';
import { MovementsView } from './components/MovementsView';
import { SimulatorView } from './components/SimulatorView';
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
            {activeTab === 'warehouse' && (
              <WarehouseView balances={balances} onRefresh={loadAllData} />
            )}
            {activeTab === 'menu' && (
              <MenuView menuItems={menuItems} onRefresh={loadAllData} />
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
