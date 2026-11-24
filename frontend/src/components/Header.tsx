import React, { useState, useEffect } from 'react';
import { Clock, MapPin } from 'lucide-react';
import type { HealthStatus, NavigationTab } from '../types';
import type { GeocodingLocation } from '../types/weather';
import { WeatherSearch } from './WeatherSearch';

interface HeaderProps {
  activeTab: NavigationTab;
  healthStatus: HealthStatus | null;
  healthLoading: boolean;
  onSelectLocation?: (location: GeocodingLocation) => void;
  selectedLocationName?: string;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string; category?: string }> = {
  'overview': { title: 'Forest Intelligence Overview', subtitle: 'Real-time telemetry, calibrated wildfire hazard, and forest canopy health', category: 'WORKSPACE' },
  'risk-map': { title: 'Geospatial Wildfire Risk Map', subtitle: 'Spatial hazard assessment with Sentinel-2 vegetation and satellite thermal detections', category: 'RISK INTELLIGENCE' },
  'what-if': { title: 'What-If Risk Simulation', subtitle: 'Environmental scenario parameters and model sensitivity analysis', category: 'RISK INTELLIGENCE' },
  'decision-support': { title: 'Decision Support & Action Protocol', subtitle: 'Operational mitigation protocols, priority sectors, and SHAP decision rationale', category: 'RISK INTELLIGENCE' },
  'forest-health': { title: 'Forest Health & Canopy Vigour', subtitle: 'Sentinel-2 multispectral tracking (NDVI, NDMI, NBR)', category: 'FOREST MONITORING' },
  'satellite-observations': { title: 'Satellite Observations & Thermal Feeds', subtitle: 'Sentinel-2 passes and NASA FIRMS active fire detections', category: 'FOREST MONITORING' },
  'temporal-analysis': { title: 'Temporal Risk & Environmental Trends', subtitle: 'Multi-window longitudinal telemetry analysis (7D, 14D, 30D, 60D)', category: 'ANALYTICS' },
  'model-analytics': { title: 'Model Analytics & Calibration Diagnostics', subtitle: 'XGBoost evaluation, Platt reliability curves, and TreeSHAP attribution', category: 'ANALYTICS' },
  'alerts': { title: 'Forest Knowledge & Scientific Field Guide', subtitle: 'Ecosystem concepts, spectral physics, wildfire behavior, and machine learning', category: 'KNOWLEDGE' },
  'data-sources': { title: 'Telemetry & Data Sources', subtitle: 'Operational data pipeline connectivity, sensor provenance, and latency', category: 'SYSTEM' },
  'model-info': { title: 'Model Architecture & Methodology', subtitle: 'Scientific specifications, hyper-parameters, and Platt calibration formulation', category: 'SYSTEM' },
  'settings': { title: 'Platform Settings & Configuration', subtitle: 'Coordinate systems, units, detection thresholds, and cache controls', category: 'SYSTEM' },
  // Backward compatibility aliases
  'historical-fires': { title: 'Satellite Observations & Thermal Feeds', subtitle: 'NASA FIRMS active fire and thermal anomaly detections', category: 'FOREST MONITORING' },
  'analytics': { title: 'Model Analytics & Calibration Diagnostics', subtitle: 'XGBoost performance and calibration reliability curves', category: 'ANALYTICS' },
};

// Quick forest sector presets
const FOREST_SECTOR_PRESETS: GeocodingLocation[] = [
  { id: 101, name: 'Bandipur Core Sector A', latitude: 11.664, longitude: 76.627, country: 'India', admin1: 'Karnataka' },
  { id: 102, name: 'Nagarhole Southern Reserve', latitude: 11.986, longitude: 76.124, country: 'India', admin1: 'Karnataka' },
  { id: 103, name: 'Wayanad Altitude Range', latitude: 11.685, longitude: 76.132, country: 'India', admin1: 'Kerala' },
  { id: 104, name: 'Mudumalai Buffer Perimeter', latitude: 11.562, longitude: 76.534, country: 'India', admin1: 'Tamil Nadu' }
];

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  healthStatus, 
  healthLoading,
  onSelectLocation,
  selectedLocationName
}) => {
  const currentTabInfo = TAB_TITLES[activeTab] || { title: 'ForestFusion', subtitle: 'Research Platform', category: 'WORKSPACE' };
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header">
      {/* Left: Dynamic Page Title & Sector Selector */}
      <div className="header-left">
        <div className="header-category-label">{currentTabInfo.category}</div>
        <h1 className="header-title">{currentTabInfo.title}</h1>
        <p className="header-subtitle">{currentTabInfo.subtitle}</p>

        {/* Quick Forest Sector Shortcut Chips */}
        {onSelectLocation && (
          <div className="forest-preset-chips" title="Switch target forest monitoring sector">
            <span className="preset-chip-label">
              <MapPin size={11} className="inline-icon" /> Sectors:
            </span>
            {FOREST_SECTOR_PRESETS.map((preset) => {
              const isActive = selectedLocationName?.includes(preset.name.split(' ')[0]);
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`preset-chip ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectLocation(preset)}
                >
                  {preset.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Center: Live Geocoding Weather Search */}
      <div className="header-center">
        {onSelectLocation ? (
          <WeatherSearch 
            onSelectLocation={onSelectLocation}
            selectedLocationName={selectedLocationName}
            placeholder="Search region, coordinates or forest sector..."
          />
        ) : (
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search region, forest sector, or coordinates..." 
              className="search-input"
              readOnly
            />
          </div>
        )}
      </div>

      {/* Right: Scientific Status Dots & Timestamp */}
      <div className="header-right">
        {/* Real-time Clock */}
        <div className="header-clock" title="System Telemetry Timestamp">
          <Clock size={12} className="text-slate-400" />
          <span className="clock-digits">{currentTime || 'Syncing...'}</span>
        </div>

        {/* Status Indicators: Small Colored Dot + Plain Text (No Oval Badges!) */}
        <div className="header-status-group">
          {/* API Connection Indicator */}
          <div 
            className="status-indicator"
            title={healthStatus ? `FastAPI Server v${healthStatus.version} Active` : 'FastAPI Server Offline'}
          >
            <span className={`status-dot ${healthStatus ? 'online' : healthLoading ? 'warning' : 'danger'}`} />
            <span className="status-text">
              {healthLoading 
                ? 'Connecting API' 
                : healthStatus 
                  ? `API Connected (v${healthStatus.version})` 
                  : 'API Offline'}
            </span>
          </div>

          {/* Model Status Indicator */}
          <div 
            className="status-indicator"
            title={healthStatus ? 'Canonical XGBoost with Platt probability calibration online' : 'Backend ML Pipeline unavailable'}
          >
            <span className={`status-dot ${healthStatus ? 'online' : 'offline'}`} />
            <span className="status-text">
              {healthStatus ? 'XGBoost + Platt Active' : 'Model Standby'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
