import React from 'react';
import { Search, Server, AlertTriangle } from 'lucide-react';
import type { HealthStatus, NavigationTab } from '../types';

interface HeaderProps {
  activeTab: NavigationTab;
  healthStatus: HealthStatus | null;
  healthLoading: boolean;
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  'overview': { title: 'Dashboard Overview', subtitle: 'Real-time environmental metrics summary & geospatial risk overview' },
  'risk-map': { title: 'Geospatial Risk Map', subtitle: 'Interactive Sentinel-2 & XGBoost wildfire risk visualization' },
  'forest-health': { title: 'Forest Health Indicators', subtitle: 'NDVI, NDMI, and NBR vegetation vigor & moisture index tracking' },
  'historical-fires': { title: 'Historical Wildfire Analysis', subtitle: 'Longitudinal burn severity and historical ignition location catalog' },
  'analytics': { title: 'Environmental Analytics', subtitle: 'Correlational analysis between meteorology and vegetation stress' },
  'alerts': { title: 'Risk Alert Engine', subtitle: 'Threshold-based warning triggers and notification dispatch rules' },
  'settings': { title: 'System Settings', subtitle: 'Geospatial bounds, backend API configuration, and model parameters' },
};

export const Header: React.FC<HeaderProps> = ({ activeTab, healthStatus, healthLoading }) => {
  const currentTabInfo = TAB_TITLES[activeTab] || { title: 'ForestFusion', subtitle: 'Monitoring Platform' };

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="header-title">{currentTabInfo.title}</h1>
        <p className="header-subtitle">{currentTabInfo.subtitle}</p>
      </div>

      <div className="header-center">
        <div className="search-box">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Search region, forest sector, or coordinates..." 
            className="search-input"
            readOnly
            title="Search feature ready for future database integration"
          />
        </div>
      </div>

      <div className="header-right">
        {/* API Connection Indicator */}
        <div className={`api-health-badge ${healthStatus ? 'online' : healthLoading ? 'checking' : 'offline'}`}>
          <Server className="badge-icon" />
          <span>
            {healthLoading 
              ? 'Connecting API...' 
              : healthStatus 
                ? `FastAPI: Connected (v${healthStatus.version})` 
                : 'FastAPI: Offline (Start Backend)'}
          </span>
        </div>

        {/* Demo Status Indicator */}
        <div className="demo-mode-badge" title="Initial prototype shell displaying mock environmental indices and static demonstration datasets.">
          <AlertTriangle className="badge-icon" />
          <span>DEMO MODE (Mock Data)</span>
        </div>
      </div>
    </header>
  );
};
