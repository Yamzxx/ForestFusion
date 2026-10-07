import React from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Layers, 
  CloudSun, 
  Flame, 
  RefreshCw,
  Info
} from 'lucide-react';
import type { WeatherState } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import type { FireState } from '../types/fire';
import type { HealthStatus } from '../types';

interface DataSourcesPageProps {
  healthStatus: HealthStatus | null;
  weatherState: WeatherState;
  vegetationState: VegetationState;
  fireState: FireState;
  onRetryWeather: () => void;
  onRetryVegetation: () => void;
  onRetryFires: () => void;
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({
  healthStatus,
  weatherState,
  vegetationState,
  fireState,
  onRetryWeather,
  onRetryVegetation,
  onRetryFires
}) => {
  return (
    <div className="page-container data-sources-page">
      {/* Header */}
      <div className="section-title-wrap" style={{ marginBottom: '20px' }}>
        <Database className="section-title-icon" style={{ color: '#1d5234' }} />
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c2826' }}>
            Data Sources & Ingestion Telemetry Status
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#72857b' }}>
            Operational telemetry connections, API endpoint endpoints, and observation metadata verification
          </p>
        </div>
      </div>

      <div className="data-sources-grid">
        {/* Source 1: Open-Meteo Weather API */}
        <div className="source-detail-card">
          <div className="source-card-header">
            <div className="source-card-title">
              <CloudSun className="source-icon" style={{ color: '#0284c7' }} />
              <div>
                <h3>Open-Meteo Weather API</h3>
                <span className="source-subtitle">Atmospheric & Meteorological Telemetry</span>
              </div>
            </div>
            <span className={`source-status-badge ${weatherState.data ? 'active' : weatherState.loading ? 'pending' : 'offline'}`}>
              {weatherState.data ? 'CONNECTED & STREAMING' : weatherState.loading ? 'CONNECTING...' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="source-specs-list">
            <div className="spec-row">
              <span className="spec-label">Endpoint URL:</span>
              <code>https://api.open-meteo.com/v1/forecast</code>
            </div>
            <div className="spec-row">
              <span className="spec-label">Ingested Variables:</span>
              <span>temperature_2m, relative_humidity_2m, wind_speed_10m, precipitation, weather_code</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Spatial Resolution:</span>
              <span>0.1° (~11 km grid resolution)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Temporal Resolution:</span>
              <span>Hourly & Daily aggregations</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Current Active Location:</span>
              <strong>{weatherState.selectedLocation.name} ({weatherState.selectedLocation.latitude.toFixed(3)}°, {weatherState.selectedLocation.longitude.toFixed(3)}°)</strong>
            </div>
          </div>

          <div className="source-footer">
            <span className="source-status-desc">
              {weatherState.data 
                ? `Live observation: ${weatherState.data.current.temperature_2m}°C, ${weatherState.data.current.relative_humidity_2m}% RH.`
                : weatherState.error || 'Awaiting connection.'}
            </span>
            <button type="button" className="source-retry-btn" onClick={onRetryWeather} disabled={weatherState.loading}>
              <RefreshCw size={12} className={weatherState.loading ? 'spinner' : ''} /> Check Connection
            </button>
          </div>
        </div>

        {/* Source 2: Copernicus Sentinel-2 MSI */}
        <div className="source-detail-card">
          <div className="source-card-header">
            <div className="source-card-title">
              <Layers className="source-icon" style={{ color: '#16a34a' }} />
              <div>
                <h3>Copernicus Sentinel-2 MSI L2A</h3>
                <span className="source-subtitle">Multispectral Surface Reflectance & Vegetation Vigor</span>
              </div>
            </div>
            <span className={`source-status-badge ${vegetationState.data?.is_configured ? 'active' : 'unconfigured'}`}>
              {vegetationState.data?.is_configured ? 'AUTHENTICATED' : 'CREDENTIALS REQUIRED'}
            </span>
          </div>

          <div className="source-specs-list">
            <div className="spec-row">
              <span className="spec-label">Provider:</span>
              <span>Copernicus Data Space Ecosystem (CDSE) / Sentinel Hub</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Processed Bands:</span>
              <span>Band 4 (Red 665nm), Band 8 (NIR 842nm), Band 11 (SWIR 1610nm), Band 12 (SWIR2 2190nm)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Derived Indices:</span>
              <span>NDVI = (B8-B4)/(B8+B4), NDMI = (B8-B11)/(B8+B11), NBR = (B8-B12)/(B8+B12)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Spatial Resolution:</span>
              <span>10m (B4, B8) / 20m (B11, B12)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Status Details:</span>
              <span>{vegetationState.data?.message || 'Sentinel-2 L2A tile query engine active.'}</span>
            </div>
          </div>

          <div className="source-footer">
            <span className="source-status-desc">
              {vegetationState.data?.is_configured 
                ? `Latest pass: ${vegetationState.data.latest_observation?.timestamp || 'Synchronized'}` 
                : 'Configure Copernicus credentials in backend environment to enable direct GEE/CDSE tile downloads.'}
            </span>
            <button type="button" className="source-retry-btn" onClick={onRetryVegetation} disabled={vegetationState.loading}>
              <RefreshCw size={12} className={vegetationState.loading ? 'spinner' : ''} /> Check Pipeline
            </button>
          </div>
        </div>

        {/* Source 3: NASA FIRMS Active Fire System */}
        <div className="source-detail-card">
          <div className="source-card-header">
            <div className="source-card-title">
              <Flame className="source-icon" style={{ color: '#ea580c' }} />
              <div>
                <h3>NASA FIRMS Thermal Hotspots</h3>
                <span className="source-subtitle">Satellite Radiometer Thermal Anomaly Detections</span>
              </div>
            </div>
            <span className={`source-status-badge ${fireState.data?.is_configured ? 'active' : 'unconfigured'}`}>
              {fireState.data?.is_configured ? 'API ACTIVE' : 'MAP-KEY UNCONFIGURED'}
            </span>
          </div>

          <div className="source-specs-list">
            <div className="spec-row">
              <span className="spec-label">Data System:</span>
              <span>NASA Fire Information for Resource Management System (FIRMS)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Satellite Sensors:</span>
              <span>VIIRS (S-NPP & NOAA-20) 375m; MODIS (Terra & Aqua) 1km</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Attributes Recorded:</span>
              <span>Brightness Temperature (K), Fire Radiative Power (MW), Scan/Track, Confidence Code</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Total Detections Logged:</span>
              <strong>{fireState.data?.total_detections ?? 0} thermal anomaly detections</strong>
            </div>
            <div className="spec-row">
              <span className="spec-label">Scientific Nature:</span>
              <em>Thermal radiometer anomalies. Not operational fire confirmations.</em>
            </div>
          </div>

          <div className="source-footer">
            <span className="source-status-desc">
              {fireState.data?.is_configured 
                ? `Archived and NRT telemetry active for South Asia / Western Ghats ROI.` 
                : 'Configure NASA FIRMS MAP_KEY in backend/.env for real-time VIIRS 375m streaming.'}
            </span>
            <button type="button" className="source-retry-btn" onClick={onRetryFires} disabled={fireState.loading}>
              <RefreshCw size={12} className={fireState.loading ? 'spinner' : ''} /> Check Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourcesPage;
