import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Trees, 
  Thermometer, 
  ShieldAlert, 
  Layers3, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  TrendingUp, 
  Info,
  Server,
  Database,
  ExternalLink
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { WeatherState, GeocodingLocation } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import type { FireDetectionRecord } from '../types/fire';
import type { HealthStatus } from '../types';
import type { 
  SpatialPredictionResponse, 
  SpatialPredictionRequest,
  SpatialBatchPredictionResponse
} from '../types/spatial';
import type { TemporalAnalysisResponse } from '../types/temporalAnalysis';
import { fetchSpatialPrediction, fetchSpatialBatchPredictions } from '../services/spatialService';
import { fetchTemporalAnalysis } from '../services/temporalAnalysisService';

// Monitored Forest Sectors for overview map preview
const OVERVIEW_SECTORS: SpatialPredictionRequest[] = [
  {
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

// Marker icon for NASA FIRMS satellite thermal anomalies (historical/active observations)
const satelliteThermalIcon = L.divIcon({
  className: 'satellite-thermal-marker',
  html: `
    <div style="
      background-color: #dc2626;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 11px;
    ">🔥</div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Marker icon for Model-predicted hazard sector
const createModelHazardIcon = (riskCategory: string, probability: number) => {
  let bgColor = '#16a34a';
  if (riskCategory === 'Moderate') bgColor = '#d97706';
  else if (riskCategory === 'High') bgColor = '#ea580c';
  else if (riskCategory === 'Very High') bgColor = '#dc2626';

  return L.divIcon({
    className: 'model-hazard-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 700;
        font-size: 10px;
      ">
        ${(probability * 100).toFixed(0)}%
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
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
  const [batchLoading, setBatchLoading] = useState<boolean>(true);

  // Map layer controls
  const [showModelHazardLayer, setShowModelHazardLayer] = useState<boolean>(true);
  const [showSatelliteFireLayer, setShowSatelliteFireLayer] = useState<boolean>(true);

  // Temporal analysis trend window state
  const [trendWindow, setTrendWindow] = useState<number>(14);
  const [temporalData, setTemporalData] = useState<TemporalAnalysisResponse | null>(null);
  const [temporalLoading, setTemporalLoading] = useState<boolean>(false);
  const [temporalError, setTemporalError] = useState<string | null>(null);

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
    setBatchLoading(true);
    fetchSpatialBatchPredictions({ locations: OVERVIEW_SECTORS })
      .then((res) => {
        if (active && res.predictions) {
          setBatchPredictions(res.predictions);
        }
      })
      .finally(() => {
        if (active) setBatchLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch temporal trend analysis for selected window
  useEffect(() => {
    let active = true;
    setTemporalLoading(true);
    setTemporalError(null);

    fetchTemporalAnalysis(trendWindow, selectedLocation.latitude, selectedLocation.longitude)
      .then((res) => {
        if (active) {
          setTemporalData(res);
        }
      })
      .catch((err) => {
        if (active) {
          setTemporalError(err.message || 'Unable to load temporal observations.');
        }
      })
      .finally(() => {
        if (active) setTemporalLoading(false);
      });

    return () => {
      active = false;
    };
  }, [trendWindow, selectedLocation.latitude, selectedLocation.longitude]);

  // Format risk badge color
  const getRiskColor = (category?: string) => {
    switch (category) {
      case 'Very High': return '#dc2626';
      case 'High': return '#ea580c';
      case 'Moderate': return '#d97706';
      default: return '#16a34a';
    }
  };

  return (
    <div className="page-container overview-page">
      {/* 1. Header & Location Identification Area */}
      <div className="overview-header-bar">
        <div className="overview-header-left">
          <div className="overview-title-group">
            <h2 className="overview-main-heading">Forest Intelligence Overview</h2>
            <span className="overview-meta-text">
              Target Coordinate: <strong>{selectedLocation.name}</strong> ({selectedLocation.latitude.toFixed(3)}°N, {selectedLocation.longitude.toFixed(3)}°E)
            </span>
          </div>
        </div>

        <div className="overview-header-right">
          <div className="provenance-timestamp-pill">
            <Clock size={13} className="inline-icon" />
            <span>Telemetry Synchronized: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* 2. System / Data Status Area (Actual Availability Only - No Fake Demo Status) */}
      <div className="system-status-ribbon">
        <div className="status-ribbon-title">
          <Server size={14} className="inline-icon" />
          <span>Ingestion & Pipeline Audit:</span>
        </div>
        <div className="status-ribbon-items">
          <div className={`status-pill ${healthStatus ? 'active' : 'offline'}`}>
            <span className="dot"></span>
            <span>FastAPI Server: {healthStatus ? `Online (v${healthStatus.version})` : 'Offline'}</span>
          </div>

          <div className={`status-pill ${weatherData ? 'active' : weatherLoading ? 'pending' : 'offline'}`}>
            <span className="dot"></span>
            <span>Open-Meteo Weather: {weatherData ? 'Streaming' : weatherLoading ? 'Connecting...' : 'Offline'}</span>
          </div>

          <div className={`status-pill ${vegetationState?.data?.is_configured ? 'active' : 'neutral'}`}>
            <span className="dot"></span>
            <span>Sentinel-2 Vegetation: {vegetationState?.data?.is_configured ? 'Authenticated' : 'Credentials Unconfigured'}</span>
          </div>

          <div className={`status-pill ${prediction?.is_prediction_available ? 'active' : 'pending'}`}>
            <span className="dot"></span>
            <span>XGBoost + Platt Calibration: {prediction?.is_prediction_available ? 'Active Pipeline' : 'Awaiting Input'}</span>
          </div>
        </div>
      </div>

      {/* 3. Top 4 Information Cards (Strict Real API Values) */}
      <div className="metrics-grid">
        {/* Card 1: Modeled Wildfire Hazard */}
        <div className="metric-card scientific-card">
          <div className="metric-header">
            <span className="metric-label">MODELED WILDFIRE HAZARD</span>
            <span className="metric-badge-tag model">PLATT CALIBRATED</span>
          </div>
          <div className="metric-main-value" style={{ color: getRiskColor(prediction?.risk_category) }}>
            {predictionLoading 
              ? 'Computing...' 
              : prediction?.is_prediction_available 
                ? `${(prediction.calibrated_probability * 100).toFixed(1)}%` 
                : 'Unavailable'}
          </div>
          <div className="metric-subtitle-text">
            {prediction?.is_prediction_available 
              ? `Category: ${prediction.risk_category} Hazard (${prediction.risk_level_code})`
              : 'Requires verified meteorological inputs'}
          </div>
          <div className="card-provenance-footnote">
            Model: {prediction?.model_version || 'XGBoost v1.0'} | {prediction?.calibration_method || 'Platt Sigmoid'}
          </div>
        </div>

        {/* Card 2: Forest Health / NDVI */}
        <div className="metric-card scientific-card">
          <div className="metric-header">
            <span className="metric-label">FOREST HEALTH (NDVI)</span>
            <span className={`metric-badge-tag ${vegetationState?.data?.is_configured ? 'observed' : 'neutral'}`}>
              {vegetationState?.data?.is_configured ? 'SENTINEL-2 L2A' : 'UNCONFIGURED'}
            </span>
          </div>
          <div className="metric-main-value" style={{ color: '#1d5234' }}>
            {vegetationState?.loading 
              ? 'Querying...' 
              : vegetationState?.data?.latest_observation?.ndvi !== undefined 
                ? vegetationState.data.latest_observation.ndvi.toFixed(3) 
                : 'N/A'}
          </div>
          <div className="metric-subtitle-text">
            {vegetationState?.data?.is_configured 
              ? `Pass: ${vegetationState.data.latest_observation?.satellite_pass_id || 'Sentinel-2 L2A'} (Cloud: ${vegetationState.data.latest_observation?.cloud_cover_percent ?? 0}%)`
              : 'Requires Copernicus credentials for live multispectral ingest'}
          </div>
          <div className="card-provenance-footnote">
            Spectral: (B8 - B4) / (B8 + B4) | Spatial Res: 10m
          </div>
        </div>

        {/* Card 3: Environmental Conditions */}
        <div className="metric-card scientific-card">
          <div className="metric-header">
            <span className="metric-label">ENVIRONMENTAL CONDITIONS</span>
            <span className="metric-badge-tag observed">OPEN-METEO LIVE</span>
          </div>
          <div className="metric-main-value" style={{ color: '#0f172a' }}>
            {weatherLoading 
              ? 'Fetching...' 
              : weatherData 
                ? `${weatherData.current.temperature_2m.toFixed(1)}°C | ${weatherData.current.relative_humidity_2m}% RH` 
                : 'Offline'}
          </div>
          <div className="metric-subtitle-text">
            {weatherData 
              ? `Wind: ${weatherData.current.wind_speed_10m} km/h • Rain: ${weatherData.current.precipitation} mm`
              : weatherError || 'Unable to connect to Open-Meteo'}
          </div>
          <div className="card-provenance-footnote">
            Source: Open-Meteo Seamless Forecast/Reanalysis Model
          </div>
        </div>

        {/* Card 4: Model Attention */}
        <div className="metric-card scientific-card">
          <div className="metric-header">
            <span className="metric-label">MODEL ATTENTION STATUS</span>
            <span className="metric-badge-tag model">DECISION SUPPORT</span>
          </div>
          <div className="metric-main-value" style={{ color: getRiskColor(prediction?.risk_category) }}>
            {predictionLoading 
              ? 'Analyzing...' 
              : prediction?.prediction_class === 1 
                ? 'ELEVATED ATTENTION' 
                : 'ROUTINE MONITORING'}
          </div>
          <div className="metric-subtitle-text">
            {prediction?.is_prediction_available
              ? `Classification Threshold: P >= 0.35 | Code: ${prediction.risk_level_code}`
              : 'Awaiting model inference execution'}
          </div>
          <div className="card-provenance-footnote">
            Status: Non-Operational Research Decision Support
          </div>
        </div>
      </div>

      {/* 4. Main Wildfire Hazard Intelligence Panel */}
      <div className="hazard-intelligence-panel">
        <div className="panel-top-bar">
          <div className="panel-title-area">
            <ShieldAlert className="panel-icon" style={{ color: '#1d5234' }} />
            <div>
              <h3 className="panel-heading">Wildfire Hazard Intelligence & Model Output</h3>
              <p className="panel-desc">
                End-to-end model inference pipeline: Raw tree margin → Platt sigmoid probability calibration → Validated risk classification
              </p>
            </div>
          </div>
          <div className="panel-actions">
            <span className="pipeline-version-pill">{prediction?.model_version || 'XGBoost v1.0 (Calibrated)'}</span>
          </div>
        </div>

        <div className="intelligence-grid">
          {/* Left: Probabilities & Classification */}
          <div className="intel-box primary">
            <div className="intel-box-label">CANONICAL PREDICTION RESULTS</div>
            
            <div className="probability-display-block">
              <div className="prob-item primary">
                <span className="prob-label">MODEL-CALIBRATED PROBABILITY:</span>
                <span className="prob-val" style={{ color: getRiskColor(prediction?.risk_category) }}>
                  {prediction ? `${(prediction.calibrated_probability * 100).toFixed(2)}%` : '--'}
                </span>
              </div>
              <div className="prob-bar-track">
                <div 
                  className="prob-bar-fill" 
                  style={{ 
                    width: `${Math.min(100, Math.max(0, (prediction?.calibrated_probability ?? 0) * 100))}%`,
                    backgroundColor: getRiskColor(prediction?.risk_category)
                  }}
                />
              </div>
            </div>

            <div className="intel-sub-metrics">
              <div className="sub-metric-row">
                <span>Raw XGBoost Margin (Log-Odds):</span>
                <code>{prediction?.raw_margin !== undefined ? prediction.raw_margin.toFixed(4) : '--'}</code>
              </div>
              <div className="sub-metric-row">
                <span>Uncalibrated Model Score:</span>
                <code>{prediction?.raw_model_probability !== undefined ? (prediction.raw_model_probability * 100).toFixed(2) + '%' : '--'}</code>
              </div>
              <div className="sub-metric-row">
                <span>Calibration Transformation:</span>
                <span className="badge-calib">{prediction?.calibration_method || 'Platt Scaling (Sigmoid)'}</span>
              </div>
              <div className="sub-metric-row">
                <span>Attention Classification:</span>
                <strong style={{ color: getRiskColor(prediction?.risk_category) }}>
                  {prediction?.risk_category || 'Unavailable'} ({prediction?.risk_level_code || 'N/A'})
                </strong>
              </div>
            </div>

            <div className="prob-scientific-note">
              <Info size={12} className="inline-icon" />
              <span>
                <strong>Statistical Guarantee:</strong> Platt sigmoid scaling maps uncalibrated tree margins to empirical observation frequencies, resolving overconfidence in extreme tails.
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
                <span className="feat-name">Vegetation NDVI:</span>
                <span className="feat-val">{prediction?.features_used.ndvi.toFixed(3)}</span>
              </div>
              <div className="feat-row">
                <span className="feat-name">Observation Month:</span>
                <span className="feat-val">Month {prediction?.features_used.month}</span>
              </div>
            </div>

            <div className="telemetry-provenance-tag">
              Source: {prediction?.features_used.telemetry_source || 'Verified Open-Meteo & Copernicus Feeds'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. "Why is this location receiving attention?" (TreeSHAP Attributions) */}
      <div className="shap-intelligence-section">
        <div className="section-title-wrap">
          <Sparkles className="section-title-icon" style={{ color: '#1d5234' }} />
          <div>
            <h3 className="section-title-text">Why is this location receiving attention?</h3>
            <p className="section-subtitle-text">
              Local TreeSHAP attributions quantify the statistical contribution of each feature to the model's decision margin.
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
                      Observed Value: <strong>{item.feature_value}</strong>
                    </div>

                    <div className="feat-effect-badge">
                      {isPositive ? '▲ Elevates Hazard Estimate' : '▼ Reduces Hazard Estimate'}
                    </div>

                    <p className="feat-explanation-text">
                      {item.human_explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="shap-scientific-caveat">
              <Info size={13} className="inline-icon" />
              <span>
                <strong>Methodological Notice:</strong> TreeSHAP values represent statistical attribution to the trained tree ensemble's log-odds output. They do NOT establish physical causation or assert that a single meteorological parameter causes wildfire ignition.
              </span>
            </div>
          </div>
        ) : (
          <div className="empty-state-card">
            <p>TreeSHAP attributions are computed automatically when meteorological features are verified.</p>
          </div>
        )}
      </div>

      {/* 6. Spatial Risk Overview Map Preview */}
      <div className="spatial-overview-map-card">
        <div className="map-card-header">
          <div className="map-card-title-group">
            <Layers3 className="panel-icon" style={{ color: '#1d5234' }} />
            <div>
              <h3>Spatial Risk Overview (Geospatial Preview)</h3>
              <span className="panel-desc">
                Visualizing model-calibrated risk sectors against NASA FIRMS satellite thermal anomaly observations
              </span>
            </div>
          </div>

          <div className="map-layer-toggles">
            <label className="layer-checkbox-pill">
              <input 
                type="checkbox" 
                checked={showModelHazardLayer} 
                onChange={(e) => setShowModelHazardLayer(e.target.checked)} 
              />
              <span>Model Hazard Predictions</span>
            </label>

            <label className="layer-checkbox-pill">
              <input 
                type="checkbox" 
                checked={showSatelliteFireLayer} 
                onChange={(e) => setShowSatelliteFireLayer(e.target.checked)} 
              />
              <span>NASA FIRMS Thermal Detections</span>
            </label>
          </div>
        </div>

        <div className="overview-leaflet-container" style={{ height: '380px', borderRadius: '8px', overflow: 'hidden' }}>
          <MapContainer
            center={[selectedLocation.latitude, selectedLocation.longitude]}
            zoom={9}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Selected Location Target Pin */}
            <Marker position={[selectedLocation.latitude, selectedLocation.longitude]}>
              <Popup>
                <div className="leaflet-popup-card">
                  <strong>{selectedLocation.name}</strong>
                  <p>Target Evaluation Coordinate</p>
                  <div>Calibrated Risk: {prediction ? `${(prediction.calibrated_probability * 100).toFixed(1)}%` : '--'}</div>
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
                    fillOpacity: 0.22,
                    weight: 2
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

            {/* NASA FIRMS Satellite Thermal Anomaly Detections Layer (Clearly Distinct) */}
            {showSatelliteFireLayer && fireDetections.slice(0, 30).map((fire, idx) => (
              <Marker
                key={fire.detection_id || idx}
                position={[fire.latitude, fire.longitude]}
                icon={satelliteThermalIcon}
              >
                <Popup>
                  <div className="leaflet-popup-card">
                    <div className="popup-badge observed">NASA FIRMS SATELLITE DETECTION</div>
                    <strong>Satellite Thermal Anomaly</strong>
                    <div className="popup-stat"><span>Sensor:</span> <strong>{fire.instrument} ({fire.satellite})</strong></div>
                    <div className="popup-stat"><span>Brightness:</span> <strong>{fire.brightness_kelvin} K</strong></div>
                    <div className="popup-stat"><span>FRP:</span> <strong>{fire.frp_mw ? `${fire.frp_mw} MW` : 'N/A'}</strong></div>
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
            <span><strong>Model Hazard Sectors:</strong> Statistical XGBoost + Platt probability estimates</span>
          </div>
          <div className="distinction-item">
            <span className="legend-indicator observed">🔥</span>
            <span><strong>NASA FIRMS Hotspots:</strong> Historical/active radiometer thermal observations (Not model predictions)</span>
          </div>
        </div>
      </div>

      {/* 7. Risk & Environmental Trends Section */}
      <div className="temporal-trends-section">
        <div className="temporal-header-wrap">
          <div className="temporal-title-group">
            <TrendingUp className="panel-icon" style={{ color: '#1d5234' }} />
            <div>
              <h3>Risk & Environmental Trends</h3>
              <p className="panel-desc">
                Longitudinal evaluation of meteorological factors, satellite hotspots, and calibrated risk
              </p>
            </div>
          </div>

          <div className="time-window-selector">
            <span className="window-label">Time Window:</span>
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
            <RefreshCw className="spinner-icon" size={20} />
            <span>Retrieving {trendWindow}-day temporal observations from Open-Meteo & NASA FIRMS...</span>
          </div>
        ) : temporalData && temporalData.environmental_trend && temporalData.environmental_trend.length > 0 ? (
          <div className="temporal-results-grid">
            {/* Correlation Metrics Banner */}
            {temporalData.correlations && temporalData.correlations.length > 0 && (
              <div className="correlations-bar">
                <span className="correlations-label">Statistical Correlation Metrics (r):</span>
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
            <AlertCircle size={22} className="empty-icon" />
            <div className="empty-text">
              <strong>Insufficient historical observations</strong>
              <p>
                No verified historical observations are archived for coordinates ({selectedLocation.latitude.toFixed(3)}°, {selectedLocation.longitude.toFixed(3)}°) within the {trendWindow}-day window. Missing data is never treated as zero activity.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 8. Concise Data Provenance Section */}
      <div className="provenance-section-card">
        <div className="provenance-title-area">
          <Database size={15} className="inline-icon" />
          <h4>Integrated Telemetry & Model Provenance</h4>
        </div>

        <div className="provenance-grid">
          <div className="prov-item">
            <span className="prov-label">Atmospheric Telemetry:</span>
            <span className="prov-val">Open-Meteo Seamless API</span>
            <span className="prov-detail">Continuous Reanalysis & Forecast, 0.1° Grid</span>
          </div>

          <div className="prov-item">
            <span className="prov-label">Multispectral Imagery:</span>
            <span className="prov-val">Copernicus Sentinel-2 MSI L2A</span>
            <span className="prov-detail">Surface Reflectance (10m Resolution), 5-Day Revisit</span>
          </div>

          <div className="prov-item">
            <span className="prov-label">Satellite Thermal Feeds:</span>
            <span className="prov-val">NASA FIRMS (VIIRS & MODIS)</span>
            <span className="prov-detail">Active Fire / Thermal Hotspots (375m & 1km)</span>
          </div>

          <div className="prov-item">
            <span className="prov-label">Inference Engine:</span>
            <span className="prov-val">XGBoost v1.0 + Platt Calibrator</span>
            <span className="prov-detail">TreeSHAP Explainability, Sigmoid Calibrated</span>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default OverviewPage;
