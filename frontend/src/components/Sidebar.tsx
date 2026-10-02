import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Trees, 
  Flame, 
  BarChart3, 
  Bell, 
  Settings, 
  ShieldAlert 
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

const NAV_ITEMS: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'risk-map', label: 'Risk Map', icon: Map },
  { id: 'forest-health', label: 'Forest Health', icon: Trees },
  { id: 'historical-fires', label: 'Historical Fires', icon: Flame },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Trees className="brand-icon" />
        </div>
        <div className="brand-text">
          <span className="brand-title">ForestFusion</span>
          <span className="brand-subtitle">Wildfire & Health Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-label">MAIN NAVIGATION</div>
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <IconComponent className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.id === 'alerts' && (
                <span className="nav-badge">Demo</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-mini">
          <ShieldAlert className="status-mini-icon" />
          <div className="status-mini-info">
            <span className="status-mini-title">Stage 1 Foundation</span>
            <span className="status-mini-sub">Dashboard Shell Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
