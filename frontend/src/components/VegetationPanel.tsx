import React, { useState } from 'react';
import { 
  Trees, 
  MapPin, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  ShieldAlert, 
  Info, 
  HelpCircle,
  Activity,
  Layers,
  Key,
  ChevronDown,
  ChevronUp,
  Globe
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import type { VegetationState } from '../types/vegetation';
import type { GeocodingLocation } from '../types/weather';

interface VegetationPanelProps {
  vegetationState: VegetationState;
  selectedLocation?: GeocodingLocation | null;
  onRetry: () => void;
  onSelectLocationPrompt?: () => void;
}

export const VegetationPanel: React.FC<VegetationPanelProps> = ({
  vegetationState,
  selectedLocation,
  onRetry,
}) => {
  const { data, loading, error } = vegetationState;
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(true);

  const hasLocation = Boolean(selectedLocation && (selectedLocation.name || selectedLocation.latitude));

  return (
    <div className="vegetation-panel-card">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <Trees className="panel-header-icon" />
          <div>
            <h3>Forest Health & Satellite Vegetation Monitoring</h3>
            <span className="panel-subtitle">
              Copernicus Sentinel-2 MSI L2A multispectral satellite telemetry and NDVI spectral vigor analysis
            </span>
          </div>
        </div>

        <div className="panel-controls">
          <span className={`status-badge-pill ${data?.is_configured ? 'configured' : 'unconfigured'}`}>
            <Globe className="pill-icon" />
            {data?.is_configured ? 'COPERNICUS SATELLITE CONNECTED' : 'COPERNICUS SATELLITE UNCONFIGURED'}
          </span>
          <button
            type="button"
            className="retry-weather-btn"
            onClick={onRetry}
            disabled={loading}
            title="Refresh satellite data pipeline"
          >
            <RefreshCw className={`btn-icon ${loading ? 'spinner' : ''}`} />
            <span>Check API Pipeline</span>
          </button>
        </div>
      </div>

      {/* Selected Location Information Bar */}
      <div className="vegetation-location-bar">
        <div className="location-bar-left">
          <MapPin className="bar-pin-icon" />
          {hasLocation && selectedLocation ? (
            <div>
              <span className="bar-title">Target Monitoring Location:</span>
              <strong className="bar-location-name">{selectedLocation.name}</strong>
              <span className="bar-coords">
                ({selectedLocation.latitude.toFixed(4)}° N, {selectedLocation.longitude.toFixed(4)}° E)
                {selectedLocation.admin1 ? ` — ${selectedLocation.admin1}, ${selectedLocation.country || ''}` : ''}
              </span>
            </div>
          ) : (
            <div>
              <span className="bar-title">Target Location:</span>
              <span className="bar-placeholder">
                No location selected. Search a location in the header or select a pin on the Geospatial Map.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="weather-state-box loading-state" style={{ marginTop: '16px' }}>
          <RefreshCw className="state-icon spinner" />
          <div className="state-text">
            <strong>Querying Copernicus Satellite Vegetation Service...</strong>
            <p>Checking Sentinel-2 L2A raster tile availability for {selectedLocation?.name || 'target location'}...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="weather-state-box error-state" style={{ marginTop: '16px' }}>
          <AlertCircle className="state-icon error-color" />
          <div className="state-text">
            <strong>Satellite Vegetation Service Error</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="error-retry-btn" onClick={onRetry}>
            Retry API Check
          </button>
        </div>
      )}

      {/* Main Content View */}
      {!loading && !error && (
        <div className="vegetation-content" style={{ marginTop: '16px' }}>
          
          {/* Top Status & Latest Observation Grid */}
          <div className="vegetation-status-grid">
            {/* Status Card */}
            <div className="veg-status-box">
              <div className="veg-box-label">
                <Layers className="box-sub-icon" />
                SATELLITE DATA PROVIDER
              </div>
              <div className={`veg-box-value ${data?.is_configured ? 'configured-text' : 'unconfigured'}`}>
                {data?.provider || 'Copernicus Data Space Ecosystem'}
              </div>
              <p className="veg-box-desc">
                {data?.is_configured 
                  ? 'Authenticated. Querying Sentinel-2 MSI L2A surface reflectance tiles.' 
                  : (data?.message || 'Copernicus API credentials not configured in backend environment.')}
              </p>
            </div>

            {/* Latest Observation Date Card */}
            <div className="veg-status-box">
              <div className="veg-box-label">
                <Clock className="box-sub-icon" />
                LATEST SATELLITE PASS DATE
              </div>
              <div className="veg-box-value neutral">
                {data?.latest_observation?.timestamp ? data.latest_observation.timestamp : 'No Pass Records'}
              </div>
              <p className="veg-box-desc">
                {data?.latest_observation 
                  ? `Pass ID: ${data.latest_observation.satellite_pass_id || 'Sentinel-2 L2A'} | Res: ${data.latest_observation.spatial_resolution || '10m'}` 
                  : 'Genuine observation pass dates render when Copernicus API credentials are authenticated.'}
              </p>
            </div>

            {/* NDVI Metric Card */}
            <div className="veg-status-box">
              <div className="veg-box-label">
                <Activity className="box-sub-icon" />
                CALCULATED NDVI METRIC
              </div>
              <div className="veg-box-value neutral">
                {data?.latest_observation?.ndvi !== undefined ? data.latest_observation.ndvi.toFixed(3) : 'N/A'}
              </div>
              <p className="veg-box-desc">
                {data?.latest_observation?.ndvi !== undefined 
                  ? `Quality: ${data.latest_observation.quality_flag || 'Clear pixel'} (Cloud: ${data.latest_observation.cloud_cover_percent || 0}%)` 
                  : 'No fabricated NDVI numbers presented. Real reflectance computation requires Copernicus API connection.'}
              </p>
            </div>
          </div>

          {/* Copernicus API Configuration Instructions (Rendered when Unconfigured) */}
          {!data?.is_configured && (
            <div className="copernicus-setup-card">
              <div className="setup-card-header" onClick={() => setShowSetupGuide(!showSetupGuide)}>
                <div className="setup-header-left">
                  <Key className="setup-icon" />
                  <div>
                    <h4>Copernicus Sentinel-2 API Integration Setup Guide</h4>
                    <span className="setup-sub">
                      How to connect live Sentinel-2 satellite reflectance telemetry in ForestFusion
                    </span>
                  </div>
                </div>
                <button type="button" className="toggle-setup-btn">
                  {showSetupGuide ? <ChevronUp className="btn-icon" /> : <ChevronDown className="btn-icon" />}
                </button>
              </div>

              {showSetupGuide && (
                <div className="setup-card-body">
                  <p className="setup-intro">
                    ForestFusion enforces a strict <strong>Real Data Only</strong> policy. To retrieve live Sentinel-2 L2A satellite bands (Band 8 Near-Infrared & Band 4 Red) for any selected map coordinate, configure free Copernicus API credentials:
                  </p>
                  
                  <ol className="setup-steps-list">
                    {(data?.setup_instructions || [
                      "1. Register a free user account at Copernicus Data Space Ecosystem (https://dataspace.copernicus.eu).",
                      "2. Go to User Dashboard -> OAuth Clients and click 'Create Client'.",
                      "3. Set environment variables COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET in backend environment or .env file.",
                      "4. Restart the FastAPI backend server (cd backend && python -m uvicorn app.main:app --reload --port 8000)."
                    ]).map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>

                  <div className="setup-note-box">
                    <Info className="note-icon" />
                    <span>
                      <strong>Environment Variables Required:</strong> Set <code>COPERNICUS_CLIENT_ID</code> and <code>COPERNICUS_CLIENT_SECRET</code> (or <code>SENTINEL_HUB_CLIENT_ID</code> & <code>SENTINEL_HUB_CLIENT_SECRET</code>) in <code>backend/.env</code>.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scientific NDVI Explanation & Formulas Card */}
          <div className="ndvi-explanation-card">
            <div className="explanation-header">
              <Info className="exp-icon" />
              <h4>Normalized Difference Vegetation Index (NDVI) Scientific Definition</h4>
            </div>

            <div className="explanation-body">
              <div className="formula-display-box">
                <span className="formula-title">Mathematical Formula:</span>
                <code className="formula-text">NDVI = (NIR - RED) / (NIR + RED)</code>
                <span className="formula-sub">Sentinel-2 Band 8 (NIR ~842nm) & Band 4 (Red ~665nm) | Resolution: 10 meters</span>
              </div>

              <div className="explanation-paragraphs">
                <p>
                  <strong>What NDVI Measures:</strong> NDVI quantifies vegetation greenness and canopy photosynthetic density by taking advantage of the contrast between chlorophyll absorption in red light wavelengths and structural scattering in near-infrared wavelengths. Values range strictly from <strong>-1.0 to +1.0</strong>:
                </p>
                <ul className="ndvi-range-list">
                  <li><strong>0.6 to 0.9:</strong> Dense, healthy forest canopy or lush active vegetation.</li>
                  <li><strong>0.2 to 0.5:</strong> Sparse vegetation, shrubland, or senescent crop cover.</li>
                  <li><strong>0.0 to 0.1:</strong> Bare soil, rock outcroppings, or urban surfaces.</li>
                  <li><strong>Negative (&lt; 0.0):</strong> Water bodies, snow, or cloud shadows.</li>
                </ul>
              </div>
            </div>

            {/* Explicit Guardrail Notice */}
            <div className="ndvi-guardrail-banner">
              <ShieldAlert className="guardrail-icon" />
              <div>
                <strong>Important Scientific Distinction:</strong>
                <p>
                  NDVI is a remote-sensing indicator of <em>canopy greenness and leaf area density</em>. It does <strong>not</strong> represent a direct wildfire risk score, ignition probability, or a definitive diagnosis of tree disease. Comprehensive wildfire risk assessment requires integrating canopy moisture (NDMI), meteorology, and calibrated ML inference.
                </p>
              </div>
            </div>
          </div>

          {/* Trend Visualization Section (Real Data Only Guardrail) */}
          <div className="vegetation-trend-section">
            <div className="panel-header-title" style={{ marginBottom: '12px' }}>
              <Activity className="panel-header-icon" />
              <h4>Longitudinal NDVI Observation Trend</h4>
            </div>

            {data && data.observations && data.observations.length >= 2 ? (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.observations} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="timestamp" stroke="#64748b" fontSize={12} />
                    <YAxis domain={[-0.2, 1.0]} stroke="#166534" fontSize={12} label={{ value: 'NDVI', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f291e', color: '#fff', borderRadius: '6px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="ndvi" name="NDVI Vigor" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="trend-unavailable-box">
                <HelpCircle className="unavail-icon" />
                <div>
                  <strong>Trend Visualization Unavailable (0 Verified Observations)</strong>
                  <p>
                    No genuine historical satellite observations recorded for this location yet. Longitudinal trend charts render automatically when at least 2 verified satellite pass rasters are ingested into the database.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
