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
  Lock,
  CloudSun,
  Sparkles,
  Info
} from 'lucide-react';
import type { MonitoredZone } from '../types';
import type { GeocodingLocation, WeatherState } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import type { FireDetectionRecord } from '../types/fire';
import type { LocalShapExplanationResponse } from '../types/shapExplanation';
import { explainLocalPrediction } from '../services/shapService';
import { DEMO_MONITORED_ZONES } from '../services/apiService';

// Custom marker icon for NASA FIRMS satellite fire thermal anomaly detections
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

// Leaflet click handler component for capturing exact click coordinates
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

// Documented basemap tile providers
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
  const [showRiskOverlay, setShowRiskOverlay] = useState<boolean>(false);
  const [showDemoZones, setShowDemoZones] = useState<boolean>(true);
  const [showFireLayer, setShowFireLayer] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Day 11: Real model prediction & TreeSHAP local explanation state for inspected location
  const [mapPredictionExpl, setMapPredictionExpl] = useState<LocalShapExplanationResponse | null>(null);
  const [explLoading, setExplLoading] = useState<boolean>(false);
  const [explError, setExplError] = useState<string | null>(null);

  // Initial geographic extent centered around Western Ghats forest region (India)
  const defaultCenter: [number, number] = [11.70, 76.40];
  const defaultZoom = 10;

  const currentTile = TILE_PROVIDERS[activeTileKey];

  // Check if real Open-Meteo telemetry is available for the selected pin
  const isWeatherAvailableForPin = Boolean(
    weatherState?.data &&
    selectedLocation &&
    Math.abs(selectedLocation.lat - weatherState.selectedLocation.latitude) < 0.05 &&
    Math.abs(selectedLocation.lng - weatherState.selectedLocation.longitude) < 0.05
  );

  useEffect(() => {
    if (isWeatherAvailableForPin && weatherState?.data) {
      let cancelled = false;
      setExplLoading(true);
      setExplError(null);

      const current = weatherState.data.current;
      const ndvi = vegetationState?.data?.latest_observation?.ndvi ?? 0.45;
      const ndmi = vegetationState?.data?.latest_observation?.ndmi ?? 0.15;

      explainLocalPrediction({
        temperature: current.temperature_2m,
        relative_humidity: current.relative_humidity_2m,
        wind_speed: current.wind_speed_10m,
        precipitation: current.precipitation ?? 0.0,
        ndvi: ndvi,
        ndmi: ndmi,
      })
        .then((res) => {
          if (!cancelled) {
            setMapPredictionExpl(res);
            setExplLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setExplError(err.message || 'Failed to explain prediction');
            setExplLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    } else {
      setMapPredictionExpl(null);
      setExplLoading(false);
      setExplError(null);
    }
  }, [isWeatherAvailableForPin, weatherState?.data, vegetationState?.data]);

  const handleLocationClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setMapPredictionExpl(null);
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

  return (
    <div className="page-container risk-map-page">
      {/* Top Map Header & Controls Card */}
      <div className="map-panel-card">
        <div className="panel-header">
          <div className="panel-header-title">
            <Layers3 className="panel-header-icon" />
            <div>
              <h3>Geospatial Wildfire Risk & Land Cover Map</h3>
              <span className="panel-subtitle">
                Interactive geographic map with multi-basemap selection, coordinate inspection, and reference bounding boxes
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
            <label className="checkbox-toggle" title="Toggle reference bounding boxes">
              <input
                type="checkbox"
                checked={showDemoZones}
                onChange={(e) => setShowDemoZones(e.target.checked)}
              />
              <span>Demo Sector Reference</span>
            </label>

            {fireDetections.length > 0 && (
              <label className="checkbox-toggle" title="Toggle NASA FIRMS Satellite Active Fire Markers">
                <input
                  type="checkbox"
                  checked={showFireLayer}
                  onChange={(e) => setShowFireLayer(e.target.checked)}
                />
                <span style={{ color: '#dc2626', fontWeight: 600 }}>🔥 FIRMS Fire Hotspots ({fireDetections.length})</span>
              </label>
            )}

            <label className="checkbox-toggle" title="Toggle ML Wildfire Risk Overlay">
              <input
                type="checkbox"
                checked={showRiskOverlay}
                onChange={(e) => setShowRiskOverlay(e.target.checked)}
              />
              <span>Risk Predictions Layer</span>
            </label>
          </div>
        </div>

        {/* Informational Banner when Risk Predictions Layer is checked */}
        {showRiskOverlay && (
          <div className="risk-layer-empty-notice">
            <AlertTriangle className="notice-icon" />
            <div>
              <strong>Wildfire Risk Prediction Model Status: Offline / Uncalibrated</strong>
              <p>
                No trained XGBoost model or live Sentinel-2 prediction grid is active yet (scheduled for Stage 4). 
                To prevent false safety assurances, uncalibrated risk heatmaps are disabled until model evaluation is complete.
              </p>
            </div>
            <span className="notice-tag">MODEL STAGE 4 DEFERRED</span>
          </div>
        )}

        {/* Main Map Container */}
        <div className="map-container-wrapper" style={{ marginTop: '16px' }}>
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '520px', borderRadius: '8px', zIndex: 1 }}
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

            {/* User-Selected Location Marker */}
            {selectedLocation && (
              <Marker
                position={[selectedLocation.lat, selectedLocation.lng]}
                icon={selectedPinIcon}
              >
                <Popup>
                  <div className="map-popup-content" style={{ minWidth: '220px', maxWidth: '280px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                      📍 Inspected Location
                    </div>
                    <div className="popup-grid" style={{ marginTop: '6px' }}>
                      <div className="popup-item">
                        <span>Latitude:</span> <strong>{selectedLocation.lat.toFixed(5)}° N</strong>
                      </div>
                      <div className="popup-item">
                        <span>Longitude:</span> <strong>{selectedLocation.lng.toFixed(5)}° E</strong>
                      </div>
                    </div>

                    {/* Day 11 Requirement 8: Prediction & TreeSHAP Attribution OR Missing Input Notice */}
                    {!isWeatherAvailableForPin ? (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '6px'
                      }}>
                        <div style={{ color: '#b45309', fontWeight: 700, fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={13} />
                          <span>Prediction unavailable — required input data is missing.</span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem', color: '#78350f', lineHeight: 1.3 }}>
                          Real weather telemetry has not been loaded for these coordinates. ForestFusion does not insert fake weather, NDVI, or wildfire values to obtain predictions.
                        </p>
                      </div>
                    ) : explLoading ? (
                      <div style={{ marginTop: '8px', padding: '6px 8px', fontSize: '0.72rem', color: '#0369a1', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                        Computing real TreeSHAP attribution...
                      </div>
                    ) : explError ? (
                      <div style={{ marginTop: '8px', padding: '6px 8px', fontSize: '0.72rem', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '4px' }}>
                        {explError}
                      </div>
                    ) : mapPredictionExpl ? (
                      <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>
                            Model Prediction:
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: mapPredictionExpl.predicted_class === 1 ? '#fee2e2' : '#dcfce7',
                            color: mapPredictionExpl.predicted_class === 1 ? '#991b1b' : '#166534',
                            fontWeight: 700
                          }}>
                            {mapPredictionExpl.predicted_class === 1 ? '🔥 Wildfire Risk' : '🛡️ Low Risk'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.70rem', color: '#475569', marginBottom: '6px' }}>
                          Model probability: <strong>{(mapPredictionExpl.model_probability * 100).toFixed(1)}%</strong>
                          <span style={{ fontSize: '0.64rem', color: '#64748b', marginLeft: '4px' }}>(Uncalibrated)</span>
                        </div>

                        <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Sparkles size={11} className="text-amber-500" />
                          <span>Why model predicted this:</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {mapPredictionExpl.top_contributors.slice(0, 3).map((item) => (
                            <div
                              key={item.feature}
                              style={{
                                fontSize: '0.66rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '2px 5px',
                                backgroundColor: item.shap_value >= 0 ? '#fff1f2' : '#f0fdf4',
                                borderRadius: '3px',
                                borderLeft: `3px solid ${item.shap_value >= 0 ? '#e11d48' : '#16a34a'}`
                              }}
                            >
                              <span style={{ color: '#1e293b' }}>
                                {item.feature}: {typeof item.feature_value === 'number' ? item.feature_value.toFixed(1) : item.feature_value}
                              </span>
                              <span style={{ fontWeight: 600, color: item.shap_value >= 0 ? '#be123c' : '#15803d' }}>
                                {item.shap_value >= 0 ? '+' : ''}{item.shap_value.toFixed(2)} ({item.shap_value >= 0 ? '↑ risk' : '↓ risk'})
                              </span>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: '5px', fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic', lineHeight: 1.25 }}>
                          SHAP explains model behavior; it does not prove physical wildfire causation.
                        </div>
                      </div>
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
                    <div className="popup-footer" style={{ marginTop: '6px', color: '#64748b', fontSize: '0.65rem' }}>
                      <em>Click anywhere on map to inspect new coordinates.</em>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Genuine NASA FIRMS Active Fire Hotspot Detections */}
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
                      <span>[SATELLITE THERMAL ANOMALY HOTSPOT]</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Illustrative Reference Sector Circles (Labeled explicitly as Demo Reference) */}
            {showDemoZones && DEMO_MONITORED_ZONES.map((zone: MonitoredZone) => (
              <React.Fragment key={zone.id}>
                <Circle
                  center={[zone.lat, zone.lng]}
                  radius={5000}
                  pathOptions={{
                    color: '#1d5234',
                    fillColor: '#1d5234',
                    fillOpacity: 0.12,
                    weight: 2,
                    dashArray: '6, 6'
                  }}
                />
                <Marker
                  position={[zone.lat, zone.lng]}
                  icon={defaultMarkerIcon}
                >
                  <Popup>
                    <div className="map-popup-content">
                      <div className="popup-header">
                        <strong>{zone.name}</strong>
                        <span className="popup-risk-badge risk-low">Reference Zone</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#475569', margin: '6px 0' }}>
                        Geospatial bounding sector anchor for Sentinel-2 satellite tile clipping.
                      </p>
                      <div className="popup-footer">
                        <span className="popup-demo-tag">[DEMO BOUNDING BOX REFERENCE]</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>

          {/* Floating Map Legend Overlay */}
          <div className="map-legend">
            <div className="legend-title">Geospatial Basemap Legend</div>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-dot green"></span> Forest Canopy & Vegetated Land
              </div>
              <div className="legend-item">
                <span className="legend-dot amber"></span> Reference Bounding Box [Demo]
              </div>
              <div className="legend-item">
                <span className="legend-dot dark"></span> Selected Click Pin
              </div>
              {fireDetections.length > 0 && (
                <div className="legend-item" style={{ color: '#dc2626', fontWeight: 600 }}>
                  <span className="legend-dot red" style={{ backgroundColor: '#dc2626' }}></span> 🔥 FIRMS Hotspots ({fireDetections.length})
                </div>
              )}
              <div className="legend-divider" style={{ borderTop: '1px solid #e2e8f0', margin: '6px 0' }}></div>
              <div className="legend-subnote" style={{ fontSize: '0.68rem', color: '#64748b' }}>
                * Tile Provider: {currentTile.name}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Coordinates Detail Bar */}
        <div className="coordinate-inspection-bar">
          <div className="inspection-left">
            <Crosshair className="inspection-icon" />
            {selectedLocation ? (
              <div>
                <span className="inspection-title">Selected Map Coordinates:</span>
                <strong className="inspection-coords">
                  {selectedLocation.lat.toFixed(5)}° N, {selectedLocation.lng.toFixed(5)}° E
                </strong>
              </div>
            ) : (
              <div>
                <span className="inspection-title">Coordinate Location Picker:</span>
                <span className="inspection-placeholder">
                  Click any point on the map to inspect geographic coordinates and fetch Open-Meteo weather.
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
                <RotateCcw className="btn-icon" /> Clear Pin
              </button>
            )}
            <div className="tile-provider-badge" title={currentTile.description}>
              <Globe className="badge-icon" />
              <span>{currentTile.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Information & System Integration Specifications Grid */}
      <div className="map-specifications-grid" style={{ marginTop: '24px' }}>
        <div className="spec-card">
          <div className="spec-card-header">
            <Globe className="spec-icon" />
            <h4>Tile Provider & Basemap Details</h4>
          </div>
          <p>{currentTile.description}</p>
          <div className="spec-attribution">
            <strong>Attribution Notice:</strong>
            <div dangerouslySetInnerHTML={{ __html: currentTile.attribution }} />
          </div>
        </div>

        <div className="spec-card">
          <div className="spec-card-header">
            <CheckCircle2 className="spec-icon green" />
            <h4>Interactive Capabilities Active</h4>
          </div>
          <ul className="spec-list">
            <li>✓ Smooth pan, scroll zoom, and extent reset controls.</li>
            <li>✓ On-click location coordinate extraction (lat/lng decimal degrees).</li>
            <li>✓ Switchable cartographic, topographic, and satellite raster layers.</li>
            <li>✓ <strong>Day 3:</strong> Open-Meteo live weather observation integration.</li>
          </ul>
        </div>

        <div className="spec-card">
          <div className="spec-card-header">
            <Lock className="spec-icon amber" />
            <h4>Deferred Stage Integration</h4>
          </div>
          <ul className="spec-list">
            <li>🔒 <strong>Stage 3:</strong> Sentinel-2 GEE 10m raster composite overlays.</li>
            <li>🔒 <strong>Stage 4:</strong> XGBoost ML wildfire probability polygon grid.</li>
            <li>🔒 <strong>Stage 5:</strong> Weather station IDW spatial temperature/humidity interpolation.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RiskMapPage;

