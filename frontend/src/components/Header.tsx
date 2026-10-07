import React from 'react';
import { Server, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
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

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  'overview': { title: 'Forest Intelligence Overview', subtitle: 'Real-time environmental observations and calibrated wildfire hazard intelligence' },
  'risk-map': { title: 'Geospatial Risk Map', subtitle: 'Interactive spatial hazard assessment with Sentinel-2 vegetation and satellite thermal detections' },
  'what-if': { title: 'What-If Risk Simulator', subtitle: 'Explore how modified environmental conditions affect the model\'s output' },
  'decision-support': { title: 'Risk Attention & Decision Support', subtitle: 'Analyst-oriented evidence, Platt-calibrated probabilities, and TreeSHAP feature attributions' },
  'forest-health': { title: 'Forest Health Indicators', subtitle: 'Copernicus Sentinel-2 multispectral vegetation vigor tracking (NDVI, NDMI, NBR)' },
  'satellite-observations': { title: 'Satellite Thermal Observations', subtitle: 'NASA FIRMS radiometer thermal anomaly detections (VIIRS / MODIS)' },
  'temporal-analysis': { title: 'Temporal Risk & Environmental Trends', subtitle: 'Longitudinal analysis across 7D, 14D, 30D, and 60D observation windows' },
  'model-analytics': { title: 'Model Analytics & Calibration Diagnostics', subtitle: 'XGBoost performance, Platt calibration reliability curves, and global TreeSHAP' },
  'data-sources': { title: 'Telemetry & Data Sources', subtitle: 'Operational connectivity and provenance tracking across Open-Meteo, Copernicus, and NASA FIRMS' },
  'model-info': { title: 'Model Architecture & Pipeline', subtitle: 'Scientific pipeline specifications, hyper-parameters, and calibration documentation' },
  'settings': { title: 'System Configuration', subtitle: 'API parameters, coordinate bounds, and operational settings' },
  // Backward compatibility aliases
  'alerts': { title: 'Risk Attention & Decision Support', subtitle: 'Analyst-oriented evidence and TreeSHAP feature attributions' },
  'historical-fires': { title: 'Satellite Thermal Observations', subtitle: 'NASA FIRMS active fire and thermal anomaly detections' },
  'analytics': { title: 'Model Analytics & Calibration Diagnostics', subtitle: 'XGBoost performance and calibration reliability curves' },
};

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  healthStatus, 
  healthLoading,
  onSelectLocation,
  selectedLocationName
}) => {
  const currentTabInfo = TAB_TITLES[activeTab] || { title: 'ForestFusion', subtitle: 'Research Platform' };

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="header-title">{currentTabInfo.title}</h1>
        <p className="header-subtitle">{currentTabInfo.subtitle}</p>
      </div>

      <div className="header-center">
        {onSelectLocation ? (
          <WeatherSearch 
            onSelectLocation={onSelectLocation}
            selectedLocationName={selectedLocationName}
            placeholder="Search region, city or forest sector (Open-Meteo)..."
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

      <div className="header-right">
        {/* API Connection Indicator */}
        <div className={`api-health-badge ${healthStatus ? 'online' : healthLoading ? 'checking' : 'offline'}`}>
          <Server className="badge-icon" />
          <span>
            {healthLoading 
              ? 'Connecting API...' 
              : healthStatus 
                ? `FastAPI: Connected (v${healthStatus.version})` 
                : 'FastAPI: Offline'}
          </span>
        </div>

        {/* Real Pipeline Status Badge (No static DEMO badge) */}
        {healthStatus ? (
          <div className="pipeline-status-badge online" title="Canonical XGBoost model, Platt probability calibration, and Open-Meteo weather telemetry active.">
            <CheckCircle2 className="badge-icon" style={{ color: '#16a34a' }} />
            <span>ML Pipeline: Calibrated</span>
          </div>
        ) : (
          <div className="pipeline-status-badge offline" title="Backend service offline. Please start FastAPI backend.">
            <AlertCircle className="badge-icon" style={{ color: '#dc2626' }} />
            <span>Backend Offline</span>
          </div>
        )}
      </div>
    </header>
  );
};

