import React from 'react';
import { 
  CloudSun, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  Clock, 
  MapPin, 
  RefreshCw, 
  AlertTriangle,
  Info,
  Compass
} from 'lucide-react';
import type { WeatherState, GeocodingLocation } from '../types/weather';
import { getWindDirectionText } from '../services/weatherService';

interface WeatherDetailCardProps {
  weatherState: WeatherState;
  onRetry: () => void;
  onSelectLocation?: (location: GeocodingLocation) => void;
}

export const WeatherDetailCard: React.FC<WeatherDetailCardProps> = ({
  weatherState,
  onRetry,
}) => {
  const { data, loading, error, selectedLocation } = weatherState;

  // Format ISO timestamp to clear readable string
  const formatApiTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return `${date.toISOString().replace('T', ' ').substring(0, 16)} UTC (${isoString})`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="weather-detail-card">
      <div className="panel-header">
        <div className="panel-header-title">
          <CloudSun className="panel-header-icon" />
          <div>
            <h3>Live Environmental Weather Observations</h3>
            <span className="panel-subtitle">
              Direct telemetry from Open-Meteo API for selected geographic location
            </span>
          </div>
        </div>

        <div className="panel-controls">
          <span className="open-meteo-attribution-badge">
            <Info className="badge-icon" /> Open-Meteo Data Source
          </span>
          <button
            type="button"
            className="retry-weather-btn"
            onClick={onRetry}
            disabled={loading}
            title="Refresh current weather data"
          >
            <RefreshCw className={`btn-icon ${loading ? 'spinner' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="weather-state-box loading-state">
          <RefreshCw className="state-icon spinner" />
          <div className="state-text">
            <strong>Fetching Live Weather Observations...</strong>
            <p>Requesting Open-Meteo current forecast metrics for {selectedLocation.name}...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="weather-state-box error-state">
          <AlertTriangle className="state-icon error-color" />
          <div className="state-text">
            <strong>Weather Data Retrieval Failed</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="error-retry-btn" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}

      {/* Loaded Weather Data View */}
      {!loading && !error && data && (
        <div className="weather-content-wrapper">
          {/* Active Location & Condition Banner */}
          <div className="weather-main-bar">
            <div className="location-info-group">
              <div className="location-title">
                <MapPin className="loc-pin-icon" />
                <h4>{data.locationName}</h4>
                <span className="location-region-tag">
                  {[data.region, data.country].filter(Boolean).join(', ')}
                </span>
              </div>
              <div className="location-coords">
                Coordinates: {data.latitude.toFixed(4)}° N, {data.longitude.toFixed(4)}° E | Timezone: {data.timezone}
              </div>
            </div>

            <div className="condition-status-pill">
              <CloudSun className="condition-icon" />
              <span className="condition-text">{data.wmoDescription}</span>
            </div>
          </div>

          {/* 4 Metrics Detailed Grid */}
          <div className="weather-metrics-grid">
            <div className="weather-metric-box">
              <div className="box-header">
                <Thermometer className="box-icon red" />
                <span className="box-label">AIR TEMPERATURE</span>
              </div>
              <div className="box-value">{data.current.temperature_2m.toFixed(1)} {data.units.temperature}</div>
              <div className="box-sub">
                {data.current.apparent_temperature !== undefined 
                  ? `Feels like: ${data.current.apparent_temperature.toFixed(1)} ${data.units.temperature}`
                  : 'Apparent Temp: N/A'}
              </div>
            </div>

            <div className="weather-metric-box">
              <div className="box-header">
                <Droplets className="box-icon blue" />
                <span className="box-label">RELATIVE HUMIDITY</span>
              </div>
              <div className="box-value">{data.current.relative_humidity_2m} {data.units.humidity}</div>
              <div className="box-sub">Canopy air moisture content</div>
            </div>

            <div className="weather-metric-box">
              <div className="box-header">
                <Wind className="box-icon teal" />
                <span className="box-label">WIND SPEED & DIR</span>
              </div>
              <div className="box-value">{data.current.wind_speed_10m.toFixed(1)} {data.units.windSpeed}</div>
              <div className="box-sub">
                <Compass className="inline-icon" />
                Direction: {data.current.wind_direction_10m !== undefined 
                  ? `${data.current.wind_direction_10m}° (${getWindDirectionText(data.current.wind_direction_10m)})`
                  : 'N/A'}
              </div>
            </div>

            <div className="weather-metric-box">
              <div className="box-header">
                <CloudRain className="box-icon purple" />
                <span className="box-label">PRECIPITATION</span>
              </div>
              <div className="box-value">{data.current.precipitation.toFixed(1)} {data.units.precipitation}</div>
              <div className="box-sub">Current precipitation rate</div>
            </div>
          </div>

          {/* API Time Stamp & Disclaimers Footer */}
          <div className="weather-footer-info">
            <div className="api-timestamp-row">
              <Clock className="timestamp-icon" />
              <span>
                <strong>API Reported Observation Time:</strong> {formatApiTime(data.current.time)}
              </span>
            </div>

            <div className="weather-disclaimer-notice">
              <Info className="disc-icon" />
              <span>
                <strong>Data Source & Method:</strong> Live current weather observations provided by Open-Meteo API. Metric units applied (°C, km/h, mm). Note: Current weather indicators alone do not constitute a calibrated wildfire risk score until bound to Stage 4 ML pipeline.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
