import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DemoNoticeBanner } from './components/DemoNoticeBanner';
import { OverviewPage } from './pages/OverviewPage';
import { RiskMapPage } from './pages/RiskMapPage';
import { 
  ForestHealthPage, 
  HistoricalFiresPage, 
  AnalyticsPage, 
  AlertsPage, 
  SettingsPage 
} from './pages/PlaceholderPages';
import { fetchHealthStatus } from './services/apiService';
import type { NavigationTab, HealthStatus } from './types';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      setHealthLoading(true);
      const data = await fetchHealthStatus();
      if (isMounted) {
        setHealthStatus(data);
        setHealthLoading(false);
      }
    };

    checkHealth();
    // Poll backend health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'risk-map':
        return <RiskMapPage />;
      case 'forest-health':
        return <ForestHealthPage />;
      case 'historical-fires':
        return <HistoricalFiresPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="app-shell">
      {/* Dark Forest-Green Navigation Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="app-main-content">
        {/* Top Header */}
        <Header 
          activeTab={activeTab} 
          healthStatus={healthStatus} 
          healthLoading={healthLoading} 
        />

        {/* Demo Disclaimer Banner */}
        <DemoNoticeBanner />

        {/* Dynamic Page View */}
        <div className="content-container">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
}

export default App;
