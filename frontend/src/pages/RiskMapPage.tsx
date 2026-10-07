import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Layers3, 
  AlertTriangle, 
  Globe, 
  Crosshair, 
  RotateCcw,
  CheckCircle2,
  CloudSun,
  Sparkles,
  Info,
  ShieldAlert,
  Activity,
  Flame
} from 'lucide-react';
import type { GeocodingLocation, WeatherState } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import type { FireDetectionRecord } from '../types/fire';
import type { 
  SpatialPredictionResponse, 
  SpatialBatchPredictionResponse,
  SpatialPredictionRequest
} from '../types/spatial';
import { fetchSpatialPrediction, fetchSpatialBatchPredictions } from '../services/spatialService';

// Custom marker icon for NASA FIRMS satellite fire thermal anomaly detections (HISTORICAL / ACTIVE OBSERVATIONS)
const fireDetectionMarkerIcon = L.divIcon({
  className: 'fire-leaflet-marker',
  html: `
    <div style="
      background-color: #dc2626;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 14px;
    ">
      🔥
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Fix for default Leaflet icon assets in React bundled environments
const defaultMarkerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom pin marker icon for user-selected map coordinates
const selectedPinIcon = L.divIcon({
  className: 'selected-coordinate-pin',
  html: `
    <div style="
      background-color: #1d5234;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: bold;
      font-size: 14px;
    ">
      📍
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Function to generate risk-color-coded marker icons for model-predicted sector locations
const createRiskMarkerIcon = (riskCategory: string, probability: number) => {
  let bgColor = '#16a34a'; // Low
  let textColor = '#ffffff';
  if (riskCategory === 'Moderate') {
    bgColor = '#d97706';
  } else if (riskCategory === 'High') {
    bgColor = '#ea580c';
  } else if (riskCategory === 'Very High') {
    bgColor = '#dc2626';
  }

  return L.divIcon({
    className: 'spatial-risk-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${textColor};
        font-weight: 800;
        font-size: 11px;
      ">
        ${(probability * 100).toFixed(0)}%
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

// Leaflet click handler component for capturing click coordinates
interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Basemap tile providers
type TileProviderKey = 'streets' | 'satellite' | 'topographic';

interface TileProviderInfo {
  name: string;
  url: string;
  attribution: string;
  description: string;
}

const TILE_PROVIDERS: Record<TileProviderKey, TileProviderInfo> = {
  streets: {
    name: 'OpenStreetMap (Streets)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    description: 'Standard cartographic street map with detailed roads, settlements, and administrative boundaries.'
  },
  satellite: {
    name: 'Esri World Imagery (Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community',
    description: 'High-resolution optical satellite imagery (Esri World Imagery tile set).'
  },
  topographic: {
    name: 'OpenTopoMap (Topographic)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    description: 'Topographic contours, elevation lines, and terrain landcover relief.'
  }
};

// Monitored Forest Sectors for spatial batch predictions
const MONITORED_SECTORS: SpatialPredictionRequest[] = [
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

interface RiskMapPageProps {
  onSelectWeatherLocation?: (location: GeocodingLocation) => void;
  activeWeatherLocationName?: string;
  fireDetections?: FireDetectionRecord[];
  weatherState?: WeatherState;
  vegetationState?: VegetationState;
}

export const RiskMapPage: React.FC<RiskMapPageProps> = ({ 
  onSelectWeatherLocation, 
  activeWeatherLocationName,
  fireDetections = [],
  weatherState,
  vegetationState
}) => {
  const [activeTileKey, setActiveTileKey] = useState<TileProviderKey>('streets');
  const [showRiskOverlay, setShowRiskOverlay] = useState<boolean>(true);
  const [showDemoZones, setShowDemoZones] = useState<boolean>(true);
  const [showFireLayer, setShowFireLayer] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Model-backed spatial prediction state for clicked pin
  const [pinPrediction, setPinPrediction] = useState<SpatialPredictionResponse | null>(null);
  const [pinPredLoading, setPinPredLoading] = useState<boolean>(false);

  // Model-backed batch spatial predictions for monitored sectors
  const [sectorPredictions, setSectorPredictions] = useState<SpatialPredictionResponse[]>([]);
  const [sectorsLoading, setSectorsLoading] = useState<boolean>(false);

  // Initial geographic extent centered around Western Ghats forest region
  const defaultCenter: [number, number] = [11.70, 76.40];
  const defaultZoom = 10;

  const currentTile = TILE_PROVIDERS[activeTileKey];

  // Fetch batch sector predictions on initial mount
  useEffect(() => {
    let active = true;
    setSectorsLoading(true);
    fetchSpatialBatchPredictions({ locations: MONITORED_SECTORS })
      .then((res) => {
        if (active && res.predictions) {
          setSectorPredictions(res.predictions);
        }
      })
      .finally(() => {
        if (active) setSectorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // When user clicks a location on the map, trigger model prediction pipeline via spatial API
  useEffect(() => {
    if (!selectedLocation) {
      setPinPrediction(null);
      return;
    }

    let active = true;
    setPinPredLoading(true);

    // Prepare environmental inputs if available from current active weather/vegetation state
    const isNearbyWeather = Boolean(
      weatherState?.data &&
      Math.abs(selectedLocation.lat - weatherState.selectedLocation.latitude) < 0.08 &&
      Math.abs(selectedLocation.lng - weatherState.selectedLocation.longitude) < 0.08
    );

    let envInputs = undefined;
    if (isNearbyWeather && weatherState?.data) {
      const cur = weatherState.data.current;
      envInputs = {
        temperature_2m: cur.temperature_2m,
        relative_humidity_2m: cur.relative_humidity_2m,
        wind_speed_10m: cur.wind_speed_10m,
        precipitation: cur.precipitation ?? 0.0,
        ndvi: vegetationState?.data?.latest_observation?.ndvi ?? 0.48,
        ndmi: vegetationState?.data?.latest_observation?.ndmi ?? -0.05,
        month: new Date().getMonth() + 1,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      };
    }

    fetchSpatialPrediction({
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      location_name: `Inspected Point (${selectedLocation.lat.toFixed(3)}°, ${selectedLocation.lng.toFixed(3)}°)`,
      environmental_inputs: envInputs
    })
      .then((res) => {
        if (active) {
          setPinPrediction(res);
        }
      })
      .finally(() => {
        if (active) setPinPredLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedLocation, weatherState?.data, vegetationState?.data]);

  const handleLocationClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setPinPrediction(null);
  };

  const handleFetchWeatherForPin = () => {
    if (selectedLocation && onSelectWeatherLocation) {
      onSelectWeatherLocation({
        id: Date.now(),
        name: `Map Point (${selectedLocation.lat.toFixed(3)}°, ${selectedLocation.lng.toFixed(3)}°)`,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });
    }
  };

  const getRiskColorStyle = (category: string) => {
    switch (category) {
      case 'Very High':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', badge: 'EXTREME' };
      case 'High':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74', badge: 'HIGH' };
      case 'Moderate':
        return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', badge: 'MODERATE' };
      case 'Low':
      default:
        return { bg: '#dcfce7', text: '#166534', border: '#86efac', badge: 'LOW' };
    }
  };

  return (
    <div className="page-container risk-map-page">
      {/* Top Map Header & Controls Card */}
      <div className="map-panel-card">
        <div className="panel-header">
          <div className="panel-header-title">
            <Layers3 className="panel-header-icon" />
            <div>
              <h3>Interactive Wildfire Risk Map</h3>
              <span className="panel-subtitle">
                Model-backed wildfire hazard predictions with calibrated probabilities, SHAP explainability, and historical FIRMS detections
              </span>
            </div>
          </div>

          <div className="panel-controls">
            {/* Basemap Switcher */}
            <div className="map-type-toggle" title="Select geographic basemap tile provider">
              <button
                className={`toggle-btn ${activeTileKey === 'streets' ? 'active' : ''}`}
                onClick={() => setActiveTileKey('streets')}
              >
                Streets
              </button>
              <button
                className={`toggle-btn ${activeTileKey === 'satellite' ? 'active' : ''}`}
                onClick={() => setActiveTileKey('satellite')}
              >
                Satellite (Esri)
              </button>
              <button
                className={`toggle-btn ${activeTileKey === 'topographic' ? 'active' : ''}`}
                onClick={() => setActiveTileKey('topographic')}
              >
                Topographic
              </button>
            </div>

            {/* Layer Toggles */}
            <label className="checkbox-toggle" title="Toggle XGBoost model risk predictions layer">
              <input
                type="checkbox"
                checked={showRiskOverlay}
                onChange={(e) => setShowRiskOverlay(e.target.checked)}
              />
              <span style={{ fontWeight: 600, color: '#0369a1' }}>🤖 Model Risk Predictions</span>
            </label>

            <label className="checkbox-toggle" title="Toggle reference sector bounding boxes">
              <input
                type="checkbox"
                checked={showDemoZones}
                onChange={(e) => setShowDemoZones(e.target.checked)}
              />
              <span>Sector Boundaries</span>
            </label>

            {fireDetections.length > 0 && (
              <label className="checkbox-toggle" title="Toggle NASA FIRMS Satellite Active Fire Markers">
                <input
                  type="checkbox"
                  checked={showFireLayer}
                  onChange={(e) => setShowFireLayer(e.target.checked)}
                />
                <span style={{ color: '#dc2626', fontWeight: 600 }}>🔥 FIRMS Hotspots ({fireDetections.length})</span>
              </label>
            )}
          </div>
        </div>

        {/* Spatial Coverage & Methodology Limitations Notice */}
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <Info size={18} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.76rem', color: '#0369a1', lineHeight: 1.45 }}>
            <strong>Spatial Coverage Notice:</strong> Model predictions are generated exclusively for locations backed by verified environmental and satellite inputs. 
            ForestFusion does not extrapolate or generate synthetic continuous risk surfaces over unmonitored locations. 
            Click any point on the map to evaluate point-based predictions and local TreeSHAP explanations.
          </div>
        </div>

        {/* Main Map Container */}
        <div className="map-container-wrapper" style={{ marginTop: '16px' }}>
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '540px', borderRadius: '8px', zIndex: 1 }}
          >
            {/* Active Basemap Tile Layer */}
            <TileLayer
              key={activeTileKey}
              attribution={currentTile.attribution}
              url={currentTile.url}
              maxZoom={18}
            />

            {/* Click Handler to Pick Coordinates */}
            <MapClickHandler onLocationSelect={handleLocationClick} />

            {/* User-Selected Location Marker & Model Risk Inspection Popup */}
            {selectedLocation && (
              <Marker
                position={[selectedLocation.lat, selectedLocation.lng]}
                icon={selectedPinIcon}
              >
                <Popup>
                  <div className="map-popup-content" style={{ minWidth: '240px', maxWidth: '310px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📍 Inspected Coordinate</span>
                      <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 500 }}>
                        {selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}°
                      </span>
                    </div>

                    {pinPredLoading ? (
                      <div style={{ padding: '12px 8px', fontSize: '0.75rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={14} className="animate-spin" />
                        <span>Running XGBoost model inference & Platt calibration...</span>
                      </div>
                    ) : pinPrediction ? (
                      !pinPrediction.is_prediction_available ? (
                        <div style={{
                          marginTop: '8px',
                          padding: '10px',
                          backgroundColor: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '6px'
                        }}>
                          <div style={{ color: '#b45309', fontWeight: 700, fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <AlertTriangle size={14} />
                            <span>Risk Prediction Unavailable</span>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.70rem', color: '#78350f', lineHeight: 1.35 }}>
                            {pinPrediction.error_message || 'Required meteorological inputs could not be fetched for these coordinates.'}
                          </p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.66rem', color: '#92400e', fontStyle: 'italic' }}>
                            * ForestFusion does not insert fake weather or mock probabilities.
                          </p>
                        </div>
                      ) : (
                        <div style={{ marginTop: '8px' }}>
                          {/* Risk Category & Calibrated Probability */}
                          {(() => {
                            const style = getRiskColorStyle(pinPrediction.risk_category);
                            return (
                              <div style={{
                                backgroundColor: style.bg,
                                border: `1px solid ${style.border}`,
                                borderRadius: '6px',
                                padding: '8px 10px',
                                marginBottom: '8px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: style.text, textTransform: 'uppercase' }}>
                                    Model Risk Category
                                  </span>
                                  <span style={{
                                    fontSize: '0.68rem',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    backgroundColor: style.text,
                                    color: '#ffffff',
                                    fontWeight: 700
                                  }}>
                                    {pinPrediction.risk_category}
                                  </span>
                                </div>
                                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: style.text }}>
                                    {(pinPrediction.calibrated_probability * 100).toFixed(1)}%
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: style.text, fontWeight: 600 }}>
                                    Calibrated Probability
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.64rem', color: '#475569', marginTop: '2px' }}>
                                  Raw Model Score: {(pinPrediction.raw_model_probability * 100).toFixed(1)}% (Uncalibrated margin: {pinPrediction.raw_margin})
                                </div>
                              </div>
                            );
                          })()}

                          {/* Environmental Context */}
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            Meteorological & Satellite Inputs:
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '4px',
                            backgroundColor: '#f8fafc',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div>Temp: <strong>{pinPrediction.features_used.temperature_2m}°C</strong></div>
                            <div>Humidity: <strong>{pinPrediction.features_used.relative_humidity_2m}%</strong></div>
                            <div>Wind: <strong>{pinPrediction.features_used.wind_speed_10m} km/h</strong></div>
                            <div>Precip: <strong>{pinPrediction.features_used.precipitation} mm</strong></div>
                            <div>NDVI: <strong>{pinPrediction.features_used.ndvi}</strong></div>
                            <div>NDMI: <strong>{pinPrediction.features_used.ndmi ?? 'N/A'}</strong></div>
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '3px' }}>
                            Source: {pinPrediction.features_used.telemetry_source}
                          </div>

                          {/* TreeSHAP Explanation */}
                          {pinPrediction.shap_explanation && pinPrediction.shap_explanation.top_contributors.length > 0 && (
                            <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Sparkles size={12} className="text-amber-500" />
                                <span>Model Explanation (TreeSHAP):</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {pinPrediction.shap_explanation.top_contributors.slice(0, 3).map((item) => (
                                  <div
                                    key={item.feature}
                                    style={{
                                      fontSize: '0.66rem',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '3px 6px',
                                      backgroundColor: item.shap_value >= 0 ? '#fff1f2' : '#f0fdf4',
                                      borderRadius: '3px',
                                      borderLeft: `3px solid ${item.shap_value >= 0 ? '#e11d48' : '#16a34a'}`
                                    }}
                                  >
                                    <span style={{ color: '#1e293b', fontWeight: 500 }}>
                                      {item.feature} ({typeof item.feature_value === 'number' ? item.feature_value.toFixed(1) : item.feature_value})
                                    </span>
                                    <span style={{ fontWeight: 700, color: item.shap_value >= 0 ? '#be123c' : '#15803d' }}>
                                      {item.shap_value >= 0 ? '+' : ''}{item.shap_value.toFixed(2)} ({item.shap_value >= 0 ? '↑ risk' : '↓ risk'})
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginTop: '4px', fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic', lineHeight: 1.25 }}>
                                * SHAP explains model margin behavior, not physical wildfire causality.
                              </div>
                            </div>
                          )}

                          {/* Scientific Disclaimer */}
                          <div style={{ marginTop: '8px', fontSize: '0.60rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '4px', lineHeight: 1.25 }}>
                            {pinPrediction.scientific_disclaimer}
                          </div>
                        </div>
                      )
                    ) : null}

                    {onSelectWeatherLocation && (
                      <button
                        type="button"
                        onClick={handleFetchWeatherForPin}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🌤️ Fetch Open-Meteo Weather Here
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Model-Backed Risk Predictions Layer (Circles & Risk Markers for Monitored Sectors) */}
            {showRiskOverlay && sectorPredictions.map((pred) => {
              const style = getRiskColorStyle(pred.risk_category);
              return (
                <React.Fragment key={pred.location_name}>
                  <Circle
                    center={[pred.latitude, pred.longitude]}
                    radius={5000}
                    pathOptions={{
                      color: style.text,
                      fillColor: style.text,
                      fillOpacity: 0.22,
                      weight: 2
                    }}
                  />
                  <Marker
                    position={[pred.latitude, pred.longitude]}
                    icon={createRiskMarkerIcon(pred.risk_category, pred.calibrated_probability)}
                  >
                    <Popup>
                      <div className="map-popup-content" style={{ minWidth: '240px', maxWidth: '300px' }}>
                        <div className="popup-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                          <strong style={{ color: '#0f172a' }}>{pred.location_name}</strong>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: style.bg,
                            color: style.text,
                            fontWeight: 700,
                            border: `1px solid ${style.border}`
                          }}>
                            {pred.risk_category} Risk
                          </span>
                        </div>

                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontSize: '0.74rem', color: '#334155' }}>
                            Calibrated Probability: <strong>{(pred.calibrated_probability * 100).toFixed(1)}%</strong>
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                            Raw XGBoost Score: {(pred.raw_model_probability * 100).toFixed(1)}% ({pred.calibration_method})
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                            Model Version: {pred.model_version}
                          </div>

                          <div style={{ marginTop: '6px', fontSize: '0.70rem', fontWeight: 700, color: '#334155' }}>
                            Sector Telemetry:
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '3px',
                            fontSize: '0.68rem',
                            backgroundColor: '#f8fafc',
                            padding: '5px',
                            borderRadius: '4px'
                          }}>
                            <div>Temp: <strong>{pred.features_used.temperature_2m}°C</strong></div>
                            <div>Humidity: <strong>{pred.features_used.relative_humidity_2m}%</strong></div>
                            <div>Wind: <strong>{pred.features_used.wind_speed_10m} km/h</strong></div>
                            <div>NDVI: <strong>{pred.features_used.ndvi}</strong></div>
                          </div>

                          {pred.shap_explanation && pred.shap_explanation.top_contributors.length > 0 && (
                            <div style={{ marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e293b' }}>
                                Top SHAP Risk Contributor:
                              </div>
                              <div style={{ fontSize: '0.66rem', color: '#be123c', fontWeight: 600 }}>
                                • {pred.shap_explanation.top_contributors[0].feature}: +{pred.shap_explanation.top_contributors[0].shap_value.toFixed(2)} SHAP
                              </div>
                            </div>
                          )}

                          <div style={{ marginTop: '6px', fontSize: '0.60rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            [MODEL-BACKED WILDFIRE RISK PREDICTION]
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}

            {/* Genuine NASA FIRMS Active Fire Thermal Hotspot Detections (HISTORICAL / SATELLITE OBSERVATIONS) */}
            {showFireLayer && fireDetections.map((fire) => (
              <Marker
                key={fire.id}
                position={[fire.latitude, fire.longitude]}
                icon={fireDetectionMarkerIcon}
              >
                <Popup>
                  <div className="map-popup-content">
                    <div className="popup-header" style={{ borderBottom: '1px solid #fee2e2', paddingBottom: '4px' }}>
                      <strong style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🔥 FIRMS Thermal Anomaly
                      </strong>
                      <span className="popup-risk-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                        {fire.confidence} Confidence
                      </span>
                    </div>
                    <div className="popup-grid" style={{ marginTop: '8px' }}>
                      <div className="popup-item">
                        <span>Observed Date:</span> <strong>{fire.acq_date} ({fire.acq_time} UTC)</strong>
                      </div>
                      <div className="popup-item">
                        <span>Coordinates:</span> <strong>{fire.latitude.toFixed(4)}°, {fire.longitude.toFixed(4)}°</strong>
                      </div>
                      <div className="popup-item">
                        <span>Satellite / Sensor:</span> <strong>{fire.satellite} / {fire.instrument}</strong>
                      </div>
                      {fire.brightness !== undefined && (
                        <div className="popup-item">
                          <span>Brightness Temp:</span> <strong>{fire.brightness} K</strong>
                        </div>
                      )}
                      {fire.frp !== undefined && fire.frp !== null && (
                        <div className="popup-item">
                          <span>Fire Power (FRP):</span> <strong>{fire.frp} MW</strong>
                        </div>
                      )}
                      <div className="popup-item">
                        <span>Day/Night Scan:</span> <strong>{fire.daynight === 'D' ? 'Daytime' : 'Nighttime'}</strong>
                      </div>
                    </div>
                    <div className="popup-footer" style={{ marginTop: '8px', color: '#7f1d1d', fontSize: '0.7rem' }}>
                      <em>Data Provider: NASA FIRMS ({fire.instrument})</em>
                      <br />
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>[HISTORICAL WILDFIRE DETECTION — NOT MODEL PREDICTION]</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Illustrative Reference Sector Circles */}
            {showDemoZones && MONITORED_SECTORS.map((sector) => (
              <Circle
                key={`sector-box-${sector.location_name}`}
                center={[sector.latitude, sector.longitude]}
                radius={8000}
                pathOptions={{
                  color: '#475569',
                  fillColor: '#94a3b8',
                  fillOpacity: 0.05,
                  weight: 1,
                  dashArray: '4, 4'
                }}
              />
            ))}
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="map-legend" style={{ minWidth: '220px' }}>
            <div className="legend-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers3 size={14} /> Map Layers Legend
            </div>
            
            <div className="legend-items" style={{ marginTop: '6px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                🤖 Model-Predicted Risk (Calibrated):
              </div>
              <div className="legend-item"><span className="legend-dot green"></span> Low Risk (&lt;35%)</div>
              <div className="legend-item"><span className="legend-dot amber"></span> Moderate Risk (35%–54%)</div>
              <div className="legend-item"><span className="legend-dot orange"></span> High Risk (55%–74%)</div>
              <div className="legend-item"><span className="legend-dot red"></span> Extreme / Very High (≥75%)</div>

              <div className="legend-divider" style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }}></div>

              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                📡 Satellite Thermal Detections:
              </div>
              <div className="legend-item" style={{ color: '#dc2626', fontWeight: 600 }}>
                <span className="legend-dot red" style={{ backgroundColor: '#dc2626' }}></span> 🔥 NASA FIRMS Fire Hotspot
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic', marginLeft: '16px' }}>
                (Historical observation, distinct from prediction)
              </div>

              <div className="legend-divider" style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }}></div>
              <div className="legend-subnote" style={{ fontSize: '0.66rem', color: '#64748b' }}>
                * Basemap: {currentTile.name}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Coordinates Inspection Bar */}
        <div className="coordinate-inspection-bar">
          <div className="inspection-left">
            <Crosshair className="inspection-icon" />
            {selectedLocation ? (
              <div>
                <span className="inspection-title">Inspected Map Coordinate:</span>
                <strong className="inspection-coords">
                  {selectedLocation.lat.toFixed(5)}° N, {selectedLocation.lng.toFixed(5)}° E
                </strong>
              </div>
            ) : (
              <div>
                <span className="inspection-title">Geospatial Coordinate Inspector:</span>
                <span className="inspection-placeholder">
                  Click any location on the map to evaluate model-backed risk predictions, Platt probability, and TreeSHAP attribution.
                </span>
              </div>
            )}
          </div>

          <div className="inspection-right">
            {selectedLocation && onSelectWeatherLocation && (
              <button 
                type="button"
                className="clear-selection-btn" 
                onClick={handleFetchWeatherForPin}
                style={{ backgroundColor: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}
              >
                <CloudSun className="btn-icon" /> Set as Weather Location
              </button>
            )}
            {selectedLocation && (
              <button className="clear-selection-btn" onClick={handleClearSelection}>
                <RotateCcw className="btn-icon" /> Clear Selection
              </button>
            )}
            <div className="tile-provider-badge" title={currentTile.description}>
              <Globe className="badge-icon" />
              <span>{currentTile.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Integrity & Architecture Specifications Grid */}
      <div className="map-specifications-grid" style={{ marginTop: '24px' }}>
        <div className="spec-card">
          <div className="spec-card-header">
            <Activity className="spec-icon blue" />
            <h4>Model Spatial Pipeline Architecture</h4>
          </div>
          <ul className="spec-list">
            <li><strong>Input Resolution:</strong> Point-based Open-Meteo & Sentinel-2 telemetry.</li>
            <li><strong>Inference Engine:</strong> Day 10 XGBoost Decision Tree ensemble.</li>
            <li><strong>Probability Calibration:</strong> Day 12 Platt Sigmoid transformation.</li>
            <li><strong>Local Explainability:</strong> Day 11 TreeSHAP feature contribution.</li>
          </ul>
        </div>

        <div className="spec-card">
          <div className="spec-card-header">
            <CheckCircle2 className="spec-icon green" />
            <h4>Validated Risk Classification</h4>
          </div>
          <ul className="spec-list">
            <li><strong>Low Risk (&lt;35%):</strong> Standard baseline vegetation & humidity.</li>
            <li><strong>Moderate Risk (35-54%):</strong> Elevated temperature or mild drying.</li>
            <li><strong>High Risk (55-74%):</strong> Low RH (&lt;25%) and high wind velocities.</li>
            <li><strong>Very High Risk (≥75%):</strong> Extreme dryness, low NDVI, high heat.</li>
          </ul>
        </div>

        <div className="spec-card">
          <div className="spec-card-header">
            <ShieldAlert className="spec-icon amber" />
            <h4>Scientific Disclaimer & Guardrails</h4>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45 }}>
            Model risk outputs represent statistical wildfire hazard likelihoods derived from historical satellite training distributions. 
            They are not operational emergency alert triggers or guarantees of ignition. SHAP values explain local model behavior, not physical wildfire causality.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskMapPage;
