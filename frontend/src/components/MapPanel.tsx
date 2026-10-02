import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Layers, MapPin, Layers3, AlertTriangle } from 'lucide-react';
import { MonitoredZone } from '../types';

interface MapPanelProps {
  zones: MonitoredZone[];
}

// Function to create color-coded SVG div icons for Leaflet markers
const createCustomMarkerIcon = (riskLevel: string) => {
  let color = '#27ae60'; // Low risk - green
  if (riskLevel === 'Moderate') color = '#f39c12'; // Moderate - amber
  if (riskLevel === 'High') color = '#e67e22'; // High - orange
  if (riskLevel === 'Extreme') color = '#d9534f'; // Extreme - red

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
      ">
        ▲
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const MapPanel: React.FC<MapPanelProps> = ({ zones }) => {
  const [activeTile, setActiveTile] = useState<'streets' | 'satellite'>('streets');
  const [showRiskOverlay, setShowRiskOverlay] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<MonitoredZone | null>(null);

  // Default coordinates centered around Western Ghats forest region (India)
  const mapCenter: [number, number] = [11.7, 76.4];

  const tileUrls = {
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  const tileAttribution = {
    streets: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  };

  return (
    <div className="map-panel-card">
      <div className="panel-header">
        <div className="panel-header-title">
          <Layers3 className="panel-header-icon" />
          <div>
            <h3>Geospatial Wildfire Risk Map</h3>
            <span className="panel-subtitle">Sentinel-2 Bounding Box Grid & Zone Monitoring</span>
          </div>
        </div>

        <div className="panel-controls">
          <div className="map-type-toggle">
            <button
              className={`toggle-btn ${activeTile === 'streets' ? 'active' : ''}`}
              onClick={() => setActiveTile('streets')}
            >
              Streets
            </button>
            <button
              className={`toggle-btn ${activeTile === 'satellite' ? 'active' : ''}`}
              onClick={() => setActiveTile('satellite')}
            >
              Satellite
            </button>
          </div>

          <label className="checkbox-toggle">
            <input
              type="checkbox"
              checked={showRiskOverlay}
              onChange={(e) => setShowRiskOverlay(e.target.checked)}
            />
            <span>Show Risk Overlay</span>
          </label>

          <span className="demo-badge-pill">
            <AlertTriangle className="pill-icon" /> DEMO GEOSPATIAL MAP
          </span>
        </div>
      </div>

      <div className="map-container-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={10}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '420px', borderRadius: '8px' }}
        >
          <TileLayer
            attribution={tileAttribution[activeTile]}
            url={tileUrls[activeTile]}
          />

          {showRiskOverlay && zones.map((zone) => {
            const circleColor = 
              zone.riskLevel === 'High' ? '#e67e22' : 
              zone.riskLevel === 'Moderate' ? '#f39c12' : '#27ae60';

            return (
              <React.Fragment key={zone.id}>
                <Circle
                  center={[zone.lat, zone.lng]}
                  radius={4500}
                  pathOptions={{
                    color: circleColor,
                    fillColor: circleColor,
                    fillOpacity: 0.25,
                    weight: 2
                  }}
                />

                <Marker
                  position={[zone.lat, zone.lng]}
                  icon={createCustomMarkerIcon(zone.riskLevel)}
                  eventHandlers={{
                    click: () => setSelectedZone(zone)
                  }}
                >
                  <Popup>
                    <div className="map-popup-content">
                      <div className="popup-header">
                        <strong>{zone.name}</strong>
                        <span className={`popup-risk-badge risk-${zone.riskLevel.toLowerCase()}`}>
                          {zone.riskLevel} Risk (Demo)
                        </span>
                      </div>
                      <div className="popup-grid">
                        <div className="popup-item"><span>NDVI Vigor:</span> <strong>{zone.ndvi}</strong></div>
                        <div className="popup-item"><span>NDMI Moisture:</span> <strong>{zone.ndmi}</strong></div>
                        <div className="popup-item"><span>NBR Burn Index:</span> <strong>{zone.nbr}</strong></div>
                        <div className="popup-item"><span>Temp / Humidity:</span> <strong>{zone.temp}°C / {zone.humidity}%</strong></div>
                        <div className="popup-item"><span>Wind Speed:</span> <strong>{zone.windSpeed} km/h</strong></div>
                      </div>
                      <div className="popup-footer">
                        <em>Telemetry updated {zone.lastUpdated}</em>
                        <br />
                        <span className="popup-demo-tag">[ILLUSTRATIVE MOCK DATA]</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="map-legend">
          <div className="legend-title">Risk Legend (Demo Scale)</div>
          <div className="legend-items">
            <div className="legend-item"><span className="legend-dot green"></span> Low Risk</div>
            <div className="legend-item"><span className="legend-dot amber"></span> Moderate Risk</div>
            <div className="legend-item"><span className="legend-dot orange"></span> High Risk</div>
            <div className="legend-item"><span className="legend-dot red"></span> Extreme Risk</div>
          </div>
        </div>
      </div>

      {selectedZone && (
        <div className="map-selected-zone-bar">
          <MapPin className="zone-bar-icon" />
          <span>Selected Sector: <strong>{selectedZone.name}</strong> ({selectedZone.lat.toFixed(3)}, {selectedZone.lng.toFixed(3)})</span>
          <span className="zone-bar-metrics">NDVI: {selectedZone.ndvi} | Temp: {selectedZone.temp}°C | Wind: {selectedZone.windSpeed} km/h</span>
          <button className="zone-bar-close" onClick={() => setSelectedZone(null)}>Close</button>
        </div>
      )}
    </div>
  );
};
