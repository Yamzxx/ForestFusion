import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  SlidersHorizontal,
  ShieldAlert,
  Trees, 
  Satellite, 
  TrendingUp, 
  BarChart3, 
  BookOpen, 
  Database, 
  Cpu, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Radio
} from 'lucide-react';
import type { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

interface NavGroup {
  label: string;
  items: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tag?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'WORKSPACE',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard }
    ]
  },
  {
    label: 'RISK INTELLIGENCE',
    items: [
      { id: 'risk-map', label: 'Risk Map', icon: Map },
      { id: 'what-if', label: 'What-If Simulation', icon: SlidersHorizontal },
      { id: 'decision-support', label: 'Decision Support', icon: ShieldAlert }
    ]
  },
  {
    label: 'FOREST MONITORING',
    items: [
      { id: 'forest-health', label: 'Forest Health', icon: Trees },
      { id: 'satellite-observations', label: 'Satellite Observations', icon: Satellite }
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
    label: 'KNOWLEDGE',
    items: [
      { id: 'alerts', label: 'Forest Knowledge', icon: BookOpen }
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'data-sources', label: 'Data Sources', icon: Database },
      { id: 'model-info', label: 'Model Architecture', icon: Cpu },
      { id: 'settings', label: 'Settings', icon: Settings }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Normalize alias tabs to canonical item id
  const normalizedActiveTab = 
    activeTab === 'historical-fires' ? 'satellite-observations' :
    activeTab === 'analytics' ? 'model-analytics' :
    activeTab;

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper" title="ForestFusion Intelligence Core">
          <Trees className="brand-icon" size={18} />
        </div>
        {!isCollapsed && (
          <div className="brand-text">
            <div className="brand-title-row">
              <span className="brand-title">ForestFusion</span>
              <span className="brand-version-chip">v1.0</span>
            </div>
            <span className="brand-subtitle">Wildfire Research Platform</span>
          </div>
        )}
      </div>

      {/* Collapse / Expand Toggle Button */}
      <button 
        type="button" 
        className="sidebar-collapse-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
        aria-label={isCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="nav-group-section">
            {!isCollapsed && (
              <div className="nav-group-label">{group.label}</div>
            )}
            {group.items.map((item) => {
              const IconComponent = item.icon;
              const isActive = normalizedActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="nav-icon-container">
                    <IconComponent className="nav-icon" />
                  </div>
                  {!isCollapsed && (
                    <span className="nav-label">{item.label}</span>
                  )}
                  {isActive && <span className="nav-active-pip" />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer with Live Telemetry Status */}
      <div className="sidebar-footer">
        <div className="system-status-mini" title="Calibrated XGBoost & Satellite Ingest">
          <div className="status-mini-indicator">
            <Radio size={14} className="text-emerald-400" />
            <span className="status-dot success" />
          </div>
          {!isCollapsed && (
            <div className="status-mini-info">
              <span className="status-mini-title">Telemetry Active</span>
              <span className="status-mini-sub">Western Ghats 11.66°N</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
