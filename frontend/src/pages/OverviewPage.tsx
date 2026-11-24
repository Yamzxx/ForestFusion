import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Layers3, 
  RefreshCw, 
  Sparkles, 
  Info,
  Server,
  Database,
  Compass,
  Wind,
  Trees,
  Flame,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { WeatherState, GeocodingLocation } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import type { FireDetectionRecord } from '../types/fire';
import type { HealthStatus } from '../types';
import type { 
  SpatialPredictionResponse, 
  SpatialPredictionRequest
} from '../types/spatial';
import type { TemporalAnalysisResponse } from '../types/temporalAnalysis';
import { fetchSpatialPrediction, fetchSpatialBatchPredictions } from '../services/spatialService';
import { fetchTemporalAnalysis } from '../services/temporalAnalysisService';
import { StatCard } from '../components/ui/StatCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ProbabilityBar } from '../components/ui/ProbabilityBar';

// Monitored Forest Sectors for overview map preview & quick jump
const OVERVIEW_SECTORS: (SpatialPredictionRequest & { id: number })[] = [
  {
    id: 1,
    latitude: 11.664,
    longitude: 76.627,
    location_name: 'Bandipur Core Forest Sector A',
    environmental_inputs: {
      temperature_2m: 34.2,
      relative_humidity_2m: 22.0,
      wind_speed_10m: 21.0,
      precipitation: 0.0,
      ndvi: 0.42,
      ndmi: -0.15,
      month: 4
    }
  },
  {
    id: 2,
    latitude: 11.986,
    longitude: 76.124,
    location_name: 'Nagarhole Southern Reserve',
    environmental_inputs: {
      temperature_2m: 31.0,
      relative_humidity_2m: 32.0,
      wind_speed_10m: 14.0,
      precipitation: 0.0,
      ndvi: 0.61,
      ndmi: 0.08,
      month: 4
    }
  },
  {
    id: 3,
    latitude: 11.685,
    longitude: 76.132,
    location_name: 'Wayanad High Altitude Range',
    environmental_inputs: {
      temperature_2m: 26.5,
      relative_humidity_2m: 58.0,
      wind_speed_10m: 9.0,
      precipitation: 1.2,
      ndvi: 0.78,
      ndmi: 0.31,
      month: 4
    }
  },
  {
    id: 4,
    latitude: 11.562,
    longitude: 76.534,
    location_name: 'Mudumalai Buffer Perimeter',
    environmental_inputs: {
      temperature_2m: 33.8,
      relative_humidity_2m: 25.0,
      wind_speed_10m: 19.0,
      precipitation: 0.0,
      ndvi: 0.49,
      ndmi: -0.05,
      month: 4
    }
  }
];

// Precise scientific marker icon for NASA FIRMS satellite thermal anomalies
const satelliteThermalIcon = L.divIcon({
  className: 'satellite-thermal-pin',
  html: `
    <div style="
      background-color: #DC2626;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 700;
    ">●</div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

// Marker icon for Model-predicted hazard sector
const createModelHazardIcon = (riskCategory: string, probability: number) => {
  let bgColor = '#10B981';
  if (riskCategory === 'Moderate') {
    bgColor = '#D97706';
  } else if (riskCategory === 'High') {
    bgColor = '#EA580C';
  } else if (riskCategory === 'Very High') {
    bgColor = '#DC2626';
  }

  return L.divIcon({
    className: 'model-hazard-pin',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 26px;
        height: 26px;
        border-radius: 4px;
        border: 1px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 10px;
        font-family: var(--font-mono, monospace);
      ">
        ${(probability * 100).toFixed(0)}%
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

interface OverviewPageProps {
  weatherState: WeatherState;
  vegetationState?: VegetationState;
  fireDetections?: FireDetectionRecord[];
  healthStatus?: HealthStatus | null;
  onRetryWeather: () => void;
  onSelectLocation: (location: GeocodingLocation) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  weatherState,
  vegetationState,
  fireDetections = [],
  healthStatus,
  onRetryWeather,
  onSelectLocation
}) => {
  const { data: weatherData, loading: weatherLoading, error: weatherError, selectedLocation } = weatherState;

  // Canonical Backend Prediction for Selected Location
  const [prediction, setPrediction] = useState<SpatialPredictionResponse | null>(null);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(true);

  // Batch predictions for monitored forest sectors on map
  const [batchPredictions, setBatchPredictions] = useState<SpatialPredictionResponse[]>([]);

  // Map layer controls
  const [showModelHazardLayer, setShowModelHazardLayer] = useState<boolean>(true);
  const [showSatelliteFireLayer, setShowSatelliteFireLayer] = useState<boolean>(true);

  // Temporal analysis trend window state
  const [trendWindow, setTrendWindow] = useState<number>(14);
  const [temporalData, setTemporalData] = useState<TemporalAnalysisResponse | null>(null);
  const [temporalLoading, setTemporalLoading] = useState<boolean>(false);

  // Fetch prediction whenever selectedLocation or weather changes
  useEffect(() => {
    let active = true;
    setPredictionLoading(true);

    const req: SpatialPredictionRequest = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      location_name: selectedLocation.name,
      environmental_inputs: weatherData ? {
        temperature_2m: weatherData.current.temperature_2m,
        relative_humidity_2m: weatherData.current.relative_humidity_2m,
        wind_speed_10m: weatherData.current.wind_speed_10m,
        precipitation: weatherData.current.precipitation,
        ndvi: vegetationState?.data?.latest_observation?.ndvi ?? 0.45,
        ndmi: -0.05,
        month: new Date().getMonth() + 1
      } : undefined
    };

    fetchSpatialPrediction(req)
      .then((res) => {
        if (active) {
          setPrediction(res);
        }
      })
      .catch((err) => {
        console.error('Error fetching prediction:', err);
      })
      .finally(() => {
        if (active) setPredictionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedLocation, weatherData, vegetationState]);

  // Fetch batch predictions for overview map
  useEffect(() => {
    let active = true;
    fetchSpatialBatchPredictions({ locations: OVERVIEW_SECTORS })
      .then((res) => {
        if (active && res.predictions) {
          setBatchPredictions(res.predictions);
        }
      })
      .catch((err) => console.error('Batch predictions error:', err));

    return () => {
      active = false;
    };
  }, []);

  // Fetch temporal trend analysis for selected window
  useEffect(() => {
    let active = true;
    setTemporalLoading(true);

    fetchTemporalAnalysis(trendWindow, selectedLocation.latitude, selectedLocation.longitude)
      .then((res) => {
        if (active) {
          setTemporalData(res);
        }
      })
      .catch((err) => {
        console.error('Temporal analysis fetch error:', err);
      })
      .finally(() => {
        if (active) setTemporalLoading(false);
      });

    return () => {
      active = false;
    };
  }, [trendWindow, selectedLocation.latitude, selectedLocation.longitude]);

  // Risk category color
  const getRiskColor = (category?: string) => {
    switch (category) {
      case 'Very High': return '#DC2626';
      case 'High': return '#EA580C';
      case 'Moderate': return '#D97706';
      default: return '#10B981';
    }
  };

  return (
    <div className="page-container overview-page">
      {/* 1. Official Government Environmental Research Hero Banner */}
      <section 
        className="overview-hero-card"
        style={{
          background: 'linear-gradient(90deg, rgba(23, 69, 47, 0.95) 0%, rgba(23, 69, 47, 0.86) 60%, rgba(16, 52, 35, 0.78) 100%), url(/assets/images/canopy_aerial.jpg) no-repeat center 35%',
          backgroundSize: 'cover',
          border: '1px solid #DCE3DD',
          borderRadius: '4px',
          padding: '24px 28px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          marginBottom: '20px'
        }}
      >
        <div className="hero-top-row">
          <div className="hero-target-info">
            <div className="hero-sector-badge">
              <Compass size={13} style={{ color: '#10B981' }} />
              <span>MONITORED FOREST BIOSPHERE</span>
            </div>
            <h2 className="hero-sector-title">{selectedLocation.name}</h2>
            <div className="hero-coordinates-tag">
              <span className="coord-val">{selectedLocation.latitude.toFixed(4)}°N</span>
              <span className="coord-divider">•</span>
              <span className="coord-val">{selectedLocation.longitude.toFixed(4)}°E</span>
              {selectedLocation.country && (
                <>
                  <span className="coord-divider">•</span>
                  <span className="coord-region">{[selectedLocation.admin1, selectedLocation.country].filter(Boolean).join(', ')}</span>
                </>
              )}
            </div>
          </div>

          <div className="hero-actions">
            {/* Quick Sector Switchers */}
            <div className="hero-sector-shortcuts">
              <span className="shortcuts-label">Target Sector:</span>
              <div className="shortcuts-pills">
                {OVERVIEW_SECTORS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    className={`shortcut-sector-btn ${selectedLocation.name === (sec.location_name || 'Forest Sector') ? 'active' : ''}`}
                    onClick={() => onSelectLocation({
                      id: sec.id,
                      name: sec.location_name || 'Forest Sector',
                      latitude: sec.latitude,
                      longitude: sec.longitude
                    })}
                  >
                    {(sec.location_name || 'Sector').split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh Telemetry Button */}
            <button
              type="button"
              className="hero-refresh-btn"
              onClick={onRetryWeather}
              disabled={weatherLoading}
              title="Refresh meteorological telemetry"
            >
              <RefreshCw size={13} className={weatherLoading ? 'spinner' : ''} />
              <span>{weatherLoading ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Clean Scientific Pipeline Ingestion Status Bar (Dot indicators, no oval badges) */}
        <div className="system-status-ribbon">
          <div className="status-ribbon-title">
            <Server size={13} className="inline-icon" />
            <span>Pipeline Provenance:</span>
          </div>
          <div className="status-ribbon-items">
            <div className="status-indicator">
              <span className={`status-dot ${healthStatus ? 'online' : 'danger'}`} />
              <span>FastAPI Server: {healthStatus ? `Online (v${healthStatus.version})` : 'Offline'}</span>
            </div>

            <div className="status-indicator">
              <span className={`status-dot ${weatherData ? 'online' : weatherLoading ? 'warning' : 'offline'}`} />
              <span>Open-Meteo: {weatherData ? 'Telemetry Active' : weatherLoading ? 'Querying...' : 'Offline'}</span>
            </div>

            <div className="status-indicator">
              <span className={`status-dot ${vegetationState?.data?.is_configured ? 'online' : 'muted'}`} />
              <span>Sentinel-2: {vegetationState?.data?.is_configured ? 'MSI Authenticated' : 'Credentials Standby'}</span>
            </div>

            <div className="status-indicator">
              <span className={`status-dot ${prediction?.is_prediction_available ? 'online' : 'warning'}`} />
              <span>XGBoost + Platt: {prediction?.is_prediction_available ? 'Calibrated' : 'Awaiting Inputs'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Four Dedicated Photographic Monitoring Metrics */}
      <section className="metrics-grid">
        {/* Card 1: Wildfire Hazard (wildfire_aerial_hazard.jpg) */}
        <StatCard
          title="WILDFIRE HAZARD PROBABILITY"
          icon={<Flame size={18} className="text-amber-500" />}
          backgroundImage="/assets/images/wildfire_aerial_hazard.jpg"
          overlayGradient="linear-gradient(135deg, rgba(23, 69, 47, 0.88) 0%, rgba(16, 52, 35, 0.94) 100%)"
          variant={
            prediction?.risk_category === 'Very High' ? 'crimson' :
            prediction?.risk_category === 'High' ? 'amber' :
            prediction?.risk_category === 'Moderate' ? 'amber' : 'emerald'
          }
          value={
            predictionLoading ? (
              <span className="text-sm text-slate-400">Computing...</span>
            ) : prediction?.is_prediction_available ? (
              <span style={{ color: getRiskColor(prediction.risk_category) }}>
                {(prediction.calibrated_probability * 100).toFixed(1)}%
              </span>
            ) : (
              'Unavailable'
            )
          }
          subtitle={
            prediction?.is_prediction_available ? (
              <div className="metric-badge-row">
                <RiskBadge level={prediction.risk_category} size="sm" />
                <span className="text-xs text-slate-400 font-mono">Margin: {prediction.raw_margin.toFixed(3)}</span>
              </div>
            ) : (
              'Awaiting inputs'
            )
          }
          footnote={`Method: ${prediction?.calibration_method || 'Platt Sigmoid'} | ${prediction?.model_version || 'XGBoost v1.0'}`}
        />

        {/* Card 2: Forest Health / NDVI (canopy_aerial.jpg) */}
        <StatCard
          title="CANOPY VIGOUR (NDVI)"
          icon={<Trees size={18} className="text-emerald-500" />}
          backgroundImage="/assets/images/canopy_aerial.jpg"
          overlayGradient="linear-gradient(135deg, rgba(23, 69, 47, 0.88) 0%, rgba(16, 52, 35, 0.94) 100%)"
          variant="emerald"
          value={
            vegetationState?.loading ? (
              <span className="text-sm text-slate-400">Querying...</span>
            ) : vegetationState?.data?.latest_observation?.ndvi !== undefined ? (
              <span style={{ color: '#10B981' }}>
                {vegetationState.data.latest_observation.ndvi.toFixed(3)}
              </span>
            ) : (
              'N/A'
            )
          }
          subtitle={
            vegetationState?.data?.is_configured 
              ? `Sentinel-2 L2A | Cloud: ${vegetationState.data.latest_observation?.cloud_cover_percent ?? 0}%`
              : 'Copernicus Hub credentials required for live tile ingest'
          }
          footnote="Index: (B8 - B4) / (B8 + B4) | Resolution: 10m"
        />

        {/* Card 3: Environmental Telemetry (environmental_mist.jpg) */}
        <StatCard
          title="ENVIRONMENTAL TELEMETRY"
          icon={<Wind size={18} className="text-cyan-400" />}
          backgroundImage="/assets/images/environmental_mist.jpg"
          overlayGradient="linear-gradient(135deg, rgba(23, 69, 47, 0.88) 0%, rgba(16, 52, 35, 0.94) 100%)"
          variant="cyan"
          value={
            weatherLoading ? (
              <span className="text-sm text-slate-400">Fetching...</span>
            ) : weatherData ? (
              <span>
                {weatherData.current.temperature_2m.toFixed(1)}°C <span className="text-slate-500 font-light">|</span> {weatherData.current.relative_humidity_2m}% RH
              </span>
            ) : (
              'Offline'
            )
          }
          subtitle={
            weatherData ? (
              <span>Wind: <strong>{weatherData.current.wind_speed_10m} km/h</strong> • Rain: <strong>{weatherData.current.precipitation} mm</strong></span>
            ) : (
              weatherError || 'Open-Meteo connection unavailable'
            )
          }
          footnote="Source: Open-Meteo Seamless Numerical Weather Model"
        />

        {/* Card 4: Model Attention Status (forest_surveillance_dark.jpg) */}
        <StatCard
          title="OPERATIONAL ATTENTION"
          icon={<ShieldAlert size={18} className="text-amber-400" />}
          backgroundImage="/assets/images/forest_surveillance_dark.jpg"
          overlayGradient="linear-gradient(135deg, rgba(23, 69, 47, 0.88) 0%, rgba(16, 52, 35, 0.94) 100%)"
          variant={prediction?.prediction_class === 1 ? 'crimson' : 'emerald'}
          value={
            predictionLoading ? (
              <span className="text-sm text-slate-400">Evaluating...</span>
            ) : prediction?.prediction_class === 1 ? (
              <span style={{ color: '#DC2626' }}>ELEVATED ATTENTION</span>
            ) : (
              <span style={{ color: '#10B981' }}>ROUTINE MONITORING</span>
            )
          }
          subtitle={
            prediction?.is_prediction_available
              ? `Threshold P ≥ 0.35 | Code: ${prediction.risk_level_code}`
              : 'Model awaiting parameter evaluation'
          }
          footnote="Operational Protocol: Priority Field Surveillance"
        />
      </section>

      {/* 3. Wildfire Hazard Intelligence Panel */}
      <section className="hazard-intelligence-panel">
        <div className="panel-top-bar">
          <div className="panel-title-area">
            <div className="panel-icon-wrap">
              <ShieldAlert className="panel-icon" />
            </div>
            <div>
              <h3 className="panel-heading">Wildfire Hazard Inference &amp; Platt Calibration</h3>
              <p className="panel-desc">
                Inference pipeline: XGBoost raw log-odds margins → Platt sigmoid transformation → Empirical risk probability
              </p>
            </div>
          </div>
          <div className="panel-actions">
            <span className="status-indicator">
              <Sparkles size={13} style={{ color: '#10B981' }} />
              <span className="font-mono text-xs">{prediction?.model_version || 'XGBoost v1.0 (Calibrated)'}</span>
            </span>
          </div>
        </div>

        <div className="intelligence-grid">
          {/* Left: Probabilities & Classification */}
          <div className="intel-box primary">
            <div className="intel-box-label">CANONICAL PROBABILITY ESTIMATE</div>
            
            <div className="probability-display-block">
              <div className="prob-item primary">
                <span className="prob-label">PLATT-CALIBRATED PROBABILITY:</span>
                <span className="prob-val" style={{ color: getRiskColor(prediction?.risk_category) }}>
                  {prediction ? `${(prediction.calibrated_probability * 100).toFixed(2)}%` : '--'}
                </span>
              </div>
              
              <ProbabilityBar 
                value={prediction?.calibrated_probability ?? 0}
                height={10}
                showThresholds={true}
                showLabels={true}
              />
            </div>

            <div className="intel-sub-metrics">
              <div className="sub-metric-row">
                <span>Raw XGBoost Decision Margin (Log-Odds):</span>
                <code className="mono-badge">{prediction?.raw_margin !== undefined ? prediction.raw_margin.toFixed(4) : '--'}</code>
              </div>
              <div className="sub-metric-row">
                <span>Uncalibrated Model Score:</span>
                <code className="mono-badge">{prediction?.raw_model_probability !== undefined ? (prediction.raw_model_probability * 100).toFixed(2) + '%' : '--'}</code>
              </div>
              <div className="sub-metric-row">
                <span>Probability Calibration Method:</span>
                <span className="text-xs font-medium text-emerald-400">{prediction?.calibration_method || 'Platt Scaling (Sigmoid)'}</span>
              </div>
              <div className="sub-metric-row">
                <span>Classification Assessment:</span>
                <span style={{ color: getRiskColor(prediction?.risk_category), fontWeight: 700 }}>
                  {prediction?.risk_category || 'Unavailable'} ({prediction?.risk_level_code || 'N/A'})
                </span>
              </div>
            </div>

            <div className="prob-scientific-note">
              <Info size={13} className="inline-icon text-emerald-400" />
              <span>
                <strong>Research Note:</strong> Platt sigmoid scaling fits empirical frequencies P(y=1|f) = 1 / [1 + exp(Af + B)] on holdout validation data, preventing overconfident tails.
              </span>
            </div>
          </div>

          {/* Right: Resolved Feature Vector */}
          <div className="intel-box secondary">
            <div className="intel-box-label">INPUT FEATURE VECTOR (OBSERVED TELEMETRY)</div>
            
            <div className="feature-vector-table">
              <div className="feat-row">
                <span className="feat-name">Air Temperature (2m):</span>
                <span className="feat-val">{prediction?.features_used.temperature_2m.toFixed(1)}°C</span>
              </div>
              <div className="feat-row">
                <span className="feat-name">Relative Humidity (2m):</span>
                <span className="feat-val">{prediction?.features_used.relative_humidity_2m.toFixed(1)}%</span>
              </div>
              <div className="feat-row">
                <span className="feat-name">Wind Speed (10m):</span>
                <span className="feat-val">{prediction?.features_used.wind_speed_10m.toFixed(1)} km/h</span>
              </div>
              <div className="feat-row">
                <span className="feat-name">Precipitation:</span>
                <span className="feat-val">{prediction?.features_used.precipitation.toFixed(1)} mm</span>
              </div>
              <div className="feat-row">
                <span className="feat-name">Vegetation Index (NDVI):</span>
                <span className="feat-val">{prediction?.features_used.ndvi.toFixed(3)}</span>
              </div>
              <div className="feat-row">
                <span className="feat-name">Calendar Month:</span>
                <span className="feat-val">Month {prediction?.features_used.month}</span>
              </div>
            </div>

            <div className="telemetry-provenance-tag">
              <Database size={11} className="inline-icon" />
              <span>Telemetry: {prediction?.features_used.telemetry_source || 'Open-Meteo ECMWF / Copernicus Feeds'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TreeSHAP Feature Attributions */}
      <section className="shap-intelligence-section">
        <div className="section-title-wrap">
          <div className="section-title-icon-wrap">
            <Sparkles className="section-title-icon" />
          </div>
          <div>
            <h3 className="section-title-text">Why is this sector receiving attention?</h3>
            <p className="section-subtitle-text">
              Local TreeSHAP attributions quantify the additive contribution of each variable to the tree ensemble log-odds margin.
            </p>
          </div>
        </div>

        {prediction?.shap_explanation?.feature_contributions && prediction.shap_explanation.feature_contributions.length > 0 ? (
          <div className="shap-contributions-container">
            <div className="shap-cards-grid">
              {prediction.shap_explanation.feature_contributions.map((item, idx) => {
                const isPositive = item.shap_value > 0;
                return (
                  <div key={idx} className={`shap-feat-card ${isPositive ? 'elevating' : 'reducing'}`}>
                    <div className="feat-card-top">
                      <span className="feat-card-name">{item.feature_name.replace(/_/g, ' ')}</span>
                      <span className={`feat-shap-val ${isPositive ? 'pos' : 'neg'}`}>
                        {item.shap_value > 0 ? `+${item.shap_value.toFixed(3)}` : item.shap_value.toFixed(3)}
                      </span>
                    </div>

                    <div className="feat-observed-line">
                      Observed: <strong>{item.feature_value}</strong>
                    </div>

                    <div className="feat-effect-badge">
                      {isPositive ? '▲ Increases Hazard Score' : '▼ Decreases Hazard Score'}
                    </div>

                    <p className="feat-explanation-text">
                      {item.human_explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="shap-scientific-caveat">
              <Info size={13} className="inline-icon text-amber-400" />
              <span>
                <strong>Methodological Distinction:</strong> TreeSHAP estimates statistical reliance within the tree ensemble and does not claim sole physical causation.
              </span>
            </div>
          </div>
        ) : (
          <div className="empty-state-card">
            <Info size={15} className="inline-icon" />
            <p>TreeSHAP attributions will generate automatically when inputs are processed.</p>
          </div>
        )}
      </section>

      {/* 5. Spatial Risk Overview Map Preview */}
      <section className="spatial-overview-map-card">
        <div className="map-card-header">
          <div className="map-card-title-group">
            <div className="panel-icon-wrap">
              <Layers3 className="panel-icon" />
            </div>
            <div>
              <h3>Geospatial Wildfire Risk Preview</h3>
              <span className="panel-desc">
                Spatial overlay of calibrated hazard predictions against NASA FIRMS radiometer thermal detections
              </span>
            </div>
          </div>

          <div className="map-layer-toggles">
            <label className="checkbox-toggle">
              <input 
                type="checkbox" 
                checked={showModelHazardLayer} 
                onChange={(e) => setShowModelHazardLayer(e.target.checked)} 
              />
              <span>Model Hazard Sectors</span>
            </label>

            <label className="checkbox-toggle">
              <input 
                type="checkbox" 
                checked={showSatelliteFireLayer} 
                onChange={(e) => setShowSatelliteFireLayer(e.target.checked)} 
              />
              <span>NASA FIRMS Thermal Detections ({fireDetections.length})</span>
            </label>
          </div>
        </div>

        <div className="overview-leaflet-container" style={{ height: '380px', borderRadius: '4px', overflow: 'hidden' }}>
          <MapContainer
            center={[selectedLocation.latitude, selectedLocation.longitude]}
            zoom={9}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Selected Location Target Pin */}
            <Marker position={[selectedLocation.latitude, selectedLocation.longitude]}>
              <Popup>
                <div className="leaflet-popup-card">
                  <div className="popup-badge target">TARGET EVALUATION POINT</div>
                  <strong>{selectedLocation.name}</strong>
                  <div className="popup-stat">
                    <span>Coordinates:</span>
                    <code>{selectedLocation.latitude.toFixed(3)}°N, {selectedLocation.longitude.toFixed(3)}°E</code>
                  </div>
                  <div className="popup-stat">
                    <span>Calibrated Risk:</span>
                    <strong>{prediction ? `${(prediction.calibrated_probability * 100).toFixed(1)}%` : '--'}</strong>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Model-Predicted Hazard Sectors Layer */}
            {showModelHazardLayer && batchPredictions.map((sector, idx) => (
              <React.Fragment key={idx}>
                <Circle
                  center={[sector.latitude, sector.longitude]}
                  radius={5000}
                  pathOptions={{
                    color: getRiskColor(sector.risk_category),
                    fillColor: getRiskColor(sector.risk_category),
                    fillOpacity: 0.20,
                    weight: 1.5
                  }}
                />
                <Marker
                  position={[sector.latitude, sector.longitude]}
                  icon={createModelHazardIcon(sector.risk_category, sector.calibrated_probability)}
                >
                  <Popup>
                    <div className="leaflet-popup-card">
                      <div className="popup-badge model">MODEL HAZARD ESTIMATE</div>
                      <strong>{sector.location_name}</strong>
                      <div className="popup-stat">
                        <span>Calibrated Probability:</span>
                        <strong>{(sector.calibrated_probability * 100).toFixed(1)}%</strong>
                      </div>
                      <div className="popup-stat">
                        <span>Risk Category:</span>
                        <strong style={{ color: getRiskColor(sector.risk_category) }}>{sector.risk_category}</strong>
                      </div>
                      <div className="popup-stat">
                        <span>Model:</span> <code>{sector.model_version}</code>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}

            {/* NASA FIRMS Satellite Thermal Anomaly Detections Layer */}
            {showSatelliteFireLayer && fireDetections.slice(0, 30).map((fire, idx) => (
              <Marker
                key={fire.id || idx}
                position={[fire.latitude, fire.longitude]}
                icon={satelliteThermalIcon}
              >
                <Popup>
                  <div className="leaflet-popup-card">
                    <div className="popup-badge observed">NASA FIRMS HOTSPOT OBSERVATION</div>
                    <strong>Spaceborne Radiometer Detection</strong>
                    <div className="popup-stat"><span>Sensor:</span> <strong>{fire.instrument} ({fire.satellite})</strong></div>
                    <div className="popup-stat"><span>Brightness:</span> <strong>{fire.brightness} K</strong></div>
                    <div className="popup-stat"><span>FRP:</span> <strong>{fire.frp ? `${fire.frp} MW` : 'N/A'}</strong></div>
                    <div className="popup-stat"><span>Acquired:</span> <strong>{fire.acq_date} {fire.acq_time} UTC</strong></div>
                    <div className="popup-note">
                      * Historical radiometer hotspot. Not a model prediction.
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Legend explicitly distinguishing prediction from observation */}
        <div className="map-distinction-legend">
          <div className="distinction-item">
            <span className="legend-indicator model">●</span>
            <span><strong>Model Hazard Sectors:</strong> Calibrated XGBoost probabilities</span>
          </div>
          <div className="distinction-item">
            <span className="legend-indicator observed">●</span>
            <span><strong>NASA FIRMS Hotspots:</strong> Observed radiometer thermal detections (Not model predictions)</span>
          </div>
        </div>
      </section>

      {/* 6. Risk & Environmental Trends Section */}
      <section className="temporal-trends-section">
        <div className="temporal-header-wrap">
          <div className="temporal-title-group">
            <div className="panel-icon-wrap">
              <TrendingUp className="panel-icon" />
            </div>
            <div>
              <h3>Longitudinal Environmental &amp; Risk Trend</h3>
              <p className="panel-desc">
                Multi-window alignment of temperature, humidity, wind velocity, and active satellite detections
              </p>
            </div>
          </div>

          <div className="time-window-selector">
            <span className="window-label">Observation Window:</span>
            {[7, 14, 30, 60].map((days) => (
              <button
                key={days}
                type="button"
                className={`window-btn ${trendWindow === days ? 'active' : ''}`}
                onClick={() => setTrendWindow(days)}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        {temporalLoading ? (
          <div className="loading-state-box">
            <RefreshCw className="spinner-icon spinner" size={18} />
            <span>Retrieving {trendWindow}-day observations...</span>
          </div>
        ) : temporalData && temporalData.environmental_trend && temporalData.environmental_trend.length > 0 ? (
          <div className="temporal-results-grid">
            {/* Correlation Metrics Banner */}
            {temporalData.correlations && temporalData.correlations.length > 0 && (
              <div className="correlations-bar">
                <span className="correlations-label">Empirical Pearson Correlations (r):</span>
                {temporalData.correlations.map((c, cIdx) => (
                  <div key={cIdx} className="corr-item-chip">
                    <span className="corr-vars">{c.variable_x} ↔ {c.variable_y}:</span>
                    <strong className="corr-val">{c.pearson_r > 0 ? `+${c.pearson_r.toFixed(2)}` : c.pearson_r.toFixed(2)}</strong>
                    <span className="corr-n">(n={c.sample_size})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Daily Environmental and Risk Table Preview */}
            <div className="temporal-table-wrap">
              <table className="scientific-data-table">
                <thead>
                  <tr>
                    <th>Observation Date</th>
                    <th>Max Temp (°C)</th>
                    <th>Mean RH (%)</th>
                    <th>Wind (km/h)</th>
                    <th>Precip (mm)</th>
                    <th>Model Calibrated Risk</th>
                    <th>Satellite Hotspots</th>
                  </tr>
                </thead>
                <tbody>
                  {temporalData.environmental_trend.slice(-7).map((env, idx) => {
                    const riskMatch = temporalData.model_risk_trend.find(m => m.date === env.date);
                    const fireMatch = temporalData.fire_activity_trend.find(f => f.date === env.date);
                    return (
                      <tr key={idx}>
                        <td><strong>{env.date}</strong></td>
                        <td>{env.temperature_2m.toFixed(1)}°C</td>
                        <td>{env.relative_humidity_2m.toFixed(0)}%</td>
                        <td>{env.wind_speed_10m.toFixed(1)}</td>
                        <td>{env.precipitation.toFixed(1)}</td>
                        <td>
                          {riskMatch ? (
                            <span className="risk-table-tag" style={{ color: getRiskColor(riskMatch.risk_category) }}>
                              {(riskMatch.calibrated_probability * 100).toFixed(1)}% ({riskMatch.risk_category})
                            </span>
                          ) : '--'}
                        </td>
                        <td>
                          {fireMatch && fireMatch.detection_count > 0 ? (
                            <span className="hotspot-badge">{fireMatch.detection_count} detections</span>
                          ) : (
                            <span className="zero-text">0 recorded</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state-box">
            <AlertCircle size={20} className="empty-icon" />
            <div className="empty-text">
              <strong>Historical data not archived for selected window</strong>
              <p>
                No verified observations recorded for coordinates ({selectedLocation.latitude.toFixed(3)}°, {selectedLocation.longitude.toFixed(3)}°) within the {trendWindow}-day window. Missing data is reported as unavailable.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 7. Model & Telemetry Provenance */}
      <section className="provenance-section-card">
        <div className="provenance-title-area">
          <Database size={15} className="inline-icon" />
          <h4>Telemetry Ingestion &amp; Model Provenance</h4>
        </div>

        <div className="provenance-grid">
          <div className="prov-item">
            <span className="prov-label">Atmospheric Telemetry:</span>
            <span className="prov-val">Open-Meteo High-Resolution API</span>
            <span className="prov-detail">ECMWF / GFS numerical weather reanalysis (0.1° grid)</span>
          </div>

          <div className="prov-item">
            <span className="prov-label">Multispectral Imagery:</span>
            <span className="prov-val">Copernicus Sentinel-2 MSI L2A</span>
            <span className="prov-detail">Bottom-Of-Atmosphere surface reflectance (10m - 20m)</span>
          </div>

          <div className="prov-item">
            <span className="prov-label">Satellite Thermal Feeds:</span>
            <span className="prov-val">NASA FIRMS (VIIRS 375m &amp; MODIS 1km)</span>
            <span className="prov-detail">Spaceborne infrared active fire detections</span>
          </div>

          <div className="prov-item">
            <span className="prov-label">Inference Engine:</span>
            <span className="prov-val">XGBoost v1.0 + Platt Calibrator</span>
            <span className="prov-detail">Additive TreeSHAP explainability, Platt sigmoid calibrated</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OverviewPage;
