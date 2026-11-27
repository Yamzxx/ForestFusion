import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Layers3, 
  Sparkles,
  Activity,
  Search
} from 'lucide-react';
import type { GeocodingLocation, WeatherState } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import type { FireDetectionRecord } from '../types/fire';
import type { 
  SpatialPredictionResponse, 
  SpatialPredictionRequest
} from '../types/spatial';
import { fetchSpatialPrediction, fetchSpatialBatchPredictions } from '../services/spatialService';

// Scientific marker icon for NASA FIRMS satellite thermal anomaly observations
const fireDetectionMarkerIcon = L.divIcon({
  className: 'fire-leaflet-marker',
  html: `
    <div style="
      background-color: #DC2626;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1.5px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 8px;
      font-weight: 700;
    ">●</div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Scientific pin marker icon for inspected map coordinates
const selectedPinIcon = L.divIcon({
  className: 'selected-coordinate-pin',
  html: `
    <div style="
      background-color: #10B981;
      width: 20px;
      height: 20px;
      border-radius: 3px;
      border: 1.5px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 11px;
      font-family: monospace;
    ">
      +
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Scientific marker icon for model-predicted sector locations
const createRiskMarkerIcon = (riskCategory: string, probability: number) => {
  let bgColor = '#10B981';
  if (riskCategory === 'Moderate') {
    bgColor = '#D97706';
  } else if (riskCategory === 'High') {
    bgColor = '#EA580C';
  } else if (riskCategory === 'Very High') {
    bgColor = '#DC2626';
  }

  return L.divIcon({
    className: 'spatial-risk-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 26px;
        height: 26px;
        border-radius: 3px;
        border: 1.5px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
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
    iconAnchor: [13, 13],
  });
};

// Leaflet click handler component for capturing coordinates
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
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    description: 'Standard cartographic street map with administrative boundaries and settlements.'
  },
  satellite: {
    name: 'Esri World Imagery (Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; High-resolution optical satellite imagery',
    description: 'High-resolution optical satellite surface imagery (Copernicus / Esri World Imagery).'
  },
  topographic: {
    name: 'OpenTopoMap (Topographic)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    description: 'Topographic elevation contours and mountain terrain relief.'
  }
};

// Monitored Forest Sectors
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
  const defaultCenter: [number, number] = [11.6667, 76.6333];
  const defaultZoom = 9;

  const [activeTileKey, setActiveTileKey] = useState<TileProviderKey>('satellite');
  const [showRiskOverlay, setShowRiskOverlay] = useState<boolean>(true);
  const [showDemoZones, setShowDemoZones] = useState<boolean>(true);
  const [showFireLayer, setShowFireLayer] = useState<boolean>(true);

  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pinPrediction, setPinPrediction] = useState<SpatialPredictionResponse | null>(null);
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [sectorPredictions, setSectorPredictions] = useState<SpatialPredictionResponse[]>([]);
  const [_sectorsLoading, setSectorsLoading] = useState<boolean>(false);

  const currentTile = TILE_PROVIDERS[activeTileKey];

  // Batch predict monitored sectors on mount
  useEffect(() => {
    let active = true;
    setSectorsLoading(true);

    fetchSpatialBatchPredictions({ locations: MONITORED_SECTORS })
      .then((res) => {
        if (active && res.predictions) {
          setSectorPredictions(res.predictions);
        }
      })
      .catch((err) => {
        console.error('Failed to load batch predictions for sectors:', err);
      })
      .finally(() => {
        if (active) setSectorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Handle click on map to evaluate point
  const handleLocationClick = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setPinLoading(true);
    setPinError(null);
    setPinPrediction(null);

    const inputs = weatherState?.data ? {
      temperature_2m: weatherState.data.current.temperature_2m,
      relative_humidity_2m: weatherState.data.current.relative_humidity_2m,
      wind_speed_10m: weatherState.data.current.wind_speed_10m,
      precipitation: weatherState.data.current.precipitation,
      ndvi: vegetationState?.data?.latest_observation?.ndvi ?? 0.45,
      ndmi: -0.05,
      month: new Date().getMonth() + 1
    } : undefined;

    try {
      const pred = await fetchSpatialPrediction({
        latitude: lat,
        longitude: lng,
        location_name: `Point (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
        environmental_inputs: inputs
      });
      setPinPrediction(pred);
    } catch (err: any) {
      setPinError(err.message || 'Failed to compute point prediction');
    } finally {
      setPinLoading(false);
    }
  };

  const handleClearPin = () => {
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

  const getRiskColor = (category?: string) => {
    switch (category) {
      case 'Very High': return '#DC2626';
      case 'High': return '#EA580C';
      case 'Moderate': return '#D97706';
      default: return '#10B981';
    }
  };

  return (
    <div className="page-container risk-map-page" style={{ padding: 0 }}>
      {/* Top Scientific Toolbar: Copernicus / NASA Worldview inspired */}
      <div 
        className="map-top-toolbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 20px',
          backgroundColor: '#0E1418',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layers3 size={18} style={{ color: '#10B981' }} />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
              Geospatial Wildfire Susceptibility & Observation Viewer
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Calibrated tree ensemble risk surface overlayed with Sentinel-2 MSI and NASA FIRMS active fire detections
              {activeWeatherLocationName ? ` • Focus: ${activeWeatherLocationName}` : ''}
            </span>
          </div>
        </div>

        {/* Layer Controls & Basemap Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Basemap Selection */}
          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            {(['satellite', 'streets', 'topographic'] as const).map(key => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTileKey(key)}
                style={{
                  backgroundColor: activeTileKey === key ? '#10B981' : '#111917',
                  color: activeTileKey === key ? '#0B0F12' : '#94A3B8',
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Layer Toggles */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#F1F5F9', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showRiskOverlay}
              onChange={(e) => setShowRiskOverlay(e.target.checked)}
              style={{ accentColor: '#10B981' }}
            />
            <span>● Model Risk Predictions</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#F1F5F9', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showDemoZones}
              onChange={(e) => setShowDemoZones(e.target.checked)}
              style={{ accentColor: '#10B981' }}
            />
            <span>Sector Perimeters</span>
          </label>

          {fireDetections.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#F87171', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showFireLayer}
                onChange={(e) => setShowFireLayer(e.target.checked)}
                style={{ accentColor: '#DC2626' }}
              />
              <span>● FIRMS Hotspots ({fireDetections.length})</span>
            </label>
          )}
        </div>
      </div>

      {/* Main Map-First Workspace */}
      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 170px)', minHeight: '600px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
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

          {/* User-Selected Location Marker & Inspection Popup */}
          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={selectedPinIcon}
            >
              <Popup>
                <div style={{ minWidth: '260px', maxWidth: '320px', padding: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#F1F5F9', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Inspected Coordinate</span>
                    <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                      {selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}°
                    </span>
                  </div>

                  {pinLoading && (
                    <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '0.78rem' }}>
                      <Activity className="animate-spin" size={16} />
                      <span>Computing point-based TreeSHAP inference...</span>
                    </div>
                  )}

                  {pinError && (
                    <div style={{ padding: '8px 0', color: '#DC2626', fontSize: '0.74rem' }}>
                      {pinError}
                    </div>
                  )}

                  {pinPrediction && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{
                        padding: '8px 10px',
                        backgroundColor: '#162420',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.25)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.70rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
                            Model Risk Category
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: getRiskColor(pinPrediction.risk_category),
                            color: '#FFFFFF',
                            fontWeight: 700
                          }}>
                            {pinPrediction.risk_category}
                          </span>
                        </div>
                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: getRiskColor(pinPrediction.risk_category) }}>
                            {(pinPrediction.calibrated_probability * 100).toFixed(1)}%
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                            Calibrated Probability
                          </span>
                        </div>
                      </div>

                      {/* Inputs Table */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '4px',
                        backgroundColor: '#111917',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        <div>Temp: <strong>{pinPrediction.features_used.temperature_2m}°C</strong></div>
                        <div>RH: <strong>{pinPrediction.features_used.relative_humidity_2m}%</strong></div>
                        <div>Wind: <strong>{pinPrediction.features_used.wind_speed_10m} km/h</strong></div>
                        <div>NDVI: <strong>{pinPrediction.features_used.ndvi}</strong></div>
                      </div>

                      {/* TreeSHAP Local Contributors */}
                      {pinPrediction.shap_explanation?.feature_contributions && (
                        <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px' }}>
                          <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={11} style={{ color: '#F59E0B' }} />
                            <span>Primary Drivers (TreeSHAP):</span>
                          </div>
                          {pinPrediction.shap_explanation.feature_contributions.slice(0, 3).map((item) => (
                            <div
                              key={item.feature_name}
                              style={{
                                fontSize: '0.66rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '2px 4px',
                                color: '#CBD5E1'
                              }}
                            >
                              <span>{item.feature_name.replace(/_/g, ' ')}</span>
                              <strong style={{ color: item.shap_value >= 0 ? '#F87171' : '#10B981' }}>
                                {item.shap_value >= 0 ? `+${item.shap_value.toFixed(3)}` : item.shap_value.toFixed(3)}
                              </strong>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={handleFetchWeatherForPin}
                          style={{
                            flex: 1,
                            backgroundColor: '#10B981',
                            color: '#0B0F12',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            fontSize: '0.68rem',
                            fontWeight: 700
                          }}
                        >
                          Focus Telemetry
                        </button>
                        <button
                          type="button"
                          onClick={handleClearPin}
                          style={{
                            backgroundColor: '#14201C',
                            color: '#94A3B8',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            fontSize: '0.68rem'
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Model Risk Overlay & Circle Perimeters for Monitored Sectors */}
          {showRiskOverlay && sectorPredictions.map((sector, idx) => (
            <React.Fragment key={idx}>
              <Circle
                center={[sector.latitude, sector.longitude]}
                radius={6000}
                pathOptions={{
                  color: getRiskColor(sector.risk_category),
                  fillColor: getRiskColor(sector.risk_category),
                  fillOpacity: 0.22,
                  weight: 1.5,
                }}
              />
              <Marker
                position={[sector.latitude, sector.longitude]}
                icon={createRiskMarkerIcon(sector.risk_category, sector.calibrated_probability)}
              >
                <Popup>
                  <div style={{ minWidth: '220px', padding: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.80rem', color: '#F1F5F9', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '4px' }}>
                      {sector.location_name}
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94A3B8' }}>Calibrated Probability:</span>
                      <strong style={{ color: getRiskColor(sector.risk_category) }}>
                        {(sector.calibrated_probability * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ color: '#94A3B8' }}>Risk Classification:</span>
                      <strong style={{ color: getRiskColor(sector.risk_category) }}>{sector.risk_category}</strong>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '4px' }}>
                      Model: {sector.model_version} ({sector.calibration_method})
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* NASA FIRMS Active Fire Observations */}
          {showFireLayer && fireDetections.slice(0, 100).map((fire, idx) => (
            <Marker
              key={fire.id || idx}
              position={[fire.latitude, fire.longitude]}
              icon={fireDetectionMarkerIcon}
            >
              <Popup>
                <div style={{ minWidth: '220px', padding: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#F87171', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '4px' }}>
                    NASA FIRMS Thermal Anomaly
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#E2E8F0' }}>
                    <div>Sensor: <strong>{fire.instrument} ({fire.satellite})</strong></div>
                    <div>Brightness: <strong>{fire.brightness} K</strong></div>
                    <div>FRP: <strong>{fire.frp ? `${fire.frp} MW` : 'N/A'}</strong></div>
                    <div>Acquisition: <strong>{fire.acq_date} {fire.acq_time} UTC</strong></div>
                    <div>Confidence: <strong>{fire.confidence || 'Nominal'}</strong></div>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '0.65rem', color: '#94A3B8', fontStyle: 'italic' }}>
                    * Spaceborne radiometer detection. Not a model forecast.
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Copernicus-style Scientific Map Legend */}
        <div 
          className="map-scientific-legend"
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: 'rgba(14, 20, 24, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '4px',
            padding: '12px 16px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
            fontSize: '0.72rem',
            color: '#F1F5F9',
            maxWidth: '260px'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#10B981', marginBottom: '8px' }}>
            Map Layers &amp; Classification
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10B981', borderRadius: '2px' }} />
              <span>Low Susceptibility (&lt; 25%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#D97706', borderRadius: '2px' }} />
              <span>Moderate Susceptibility (25 - 50%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#EA580C', borderRadius: '2px' }} />
              <span>High Susceptibility (50 - 75%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#DC2626', borderRadius: '2px' }} />
              <span>Very High Susceptibility (&gt; 75%)</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '5px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#DC2626', borderRadius: '50%', border: '1px solid #FFF' }} />
              <span>NASA FIRMS Radiometer Hotspot</span>
            </div>
          </div>
        </div>

        {/* Floating Sector Quick-Selector on Map */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '60px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(14, 20, 24, 0.90)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '4px',
            padding: '6px 12px',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Search size={12} style={{ color: '#94A3B8' }} />
          <span style={{ fontSize: '0.70rem', color: '#94A3B8', fontWeight: 600 }}>Sectors:</span>
          {MONITORED_SECTORS.map((s, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => handleLocationClick(s.latitude, s.longitude)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#F1F5F9',
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '0.70rem',
                fontWeight: 600
              }}
            >
              {s.location_name ? s.location_name.split(' ')[0] : 'Sector'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiskMapPage;
