import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Trees, 
  Flame, 
  TrendingUp,
  BarChart3, 
  FileText, 
  Database,
  Cpu,
  Settings, 
  ShieldAlert 
} from 'lucide-react';
import type { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

interface NavGroup {
  label?: string;
  items: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard }
    ]
  },
  {
    label: 'RISK INTELLIGENCE',
    items: [
      { id: 'risk-map', label: 'Risk Map', icon: Map },
      { id: 'decision-support', label: 'Decision Support', icon: FileText, badge: 'Platt' }
    ]
  },
  {
    label: 'FOREST MONITORING',
    items: [
      { id: 'forest-health', label: 'Forest Health', icon: Trees },
      { id: 'satellite-observations', label: 'Satellite Observations', icon: Flame }
    ]
  },
  {
    label: 'ANALYTICS',
    items: [
      { id: 'temporal-analysis', label: 'Temporal Analysis', icon: TrendingUp },
      { id: 'model-analytics', label: 'Model Analytics', icon: BarChart3 }
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'data-sources', label: 'Data Sources', icon: Database },
      { id: 'model-info', label: 'Model Information', icon: Cpu },
      { id: 'settings', label: 'Settings', icon: Settings }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  // Normalize alias tabs to canonical item id
  const normalizedActiveTab = 
    activeTab === 'alerts' ? 'decision-support' :
    activeTab === 'historical-fires' ? 'satellite-observations' :
    activeTab === 'analytics' ? 'model-analytics' :
    activeTab;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Trees className="brand-icon" />
        </div>
        <div className="brand-text">
          <span className="brand-title">ForestFusion</span>
          <span className="brand-subtitle">Wildfire Research Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="nav-group-section">
            {group.label && <div className="nav-group-label">{group.label}</div>}
            {group.items.map((item) => {
              const IconComponent = item.icon;
              const isActive = normalizedActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTab(item.id)}
                >
                  <IconComponent className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge" style={{ backgroundColor: '#1d5234', color: '#ffffff' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-mini">
          <ShieldAlert className="status-mini-icon" />
          <div className="status-mini-info">
            <span className="status-mini-title">CSE Research Platform</span>
            <span className="status-mini-sub">Calibrated Decision Support</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
