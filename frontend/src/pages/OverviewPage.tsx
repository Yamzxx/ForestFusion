import React from 'react';
import { MapPin, Trees, Thermometer, ShieldAlert } from 'lucide-react';
import { MetricCard } from '../components/Card';
import { MapPanel } from '../components/MapPanel';
import { TrendChart } from '../components/TrendChart';
import { ObservationsPanel } from '../components/ObservationsPanel';
import { WeatherDetailCard } from '../components/WeatherDetailCard';
import type { WeatherState, GeocodingLocation } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import { DEMO_MONITORED_ZONES, DEMO_HISTORICAL_TREND, DEMO_RECENT_OBSERVATIONS } from '../services/apiService';

interface OverviewPageProps {
  weatherState: WeatherState;
  vegetationState?: VegetationState;
  onRetryWeather: () => void;
  onSelectLocation: (location: GeocodingLocation) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  weatherState,
  vegetationState,
  onRetryWeather,
  onSelectLocation,
}) => {
  const { data, loading, error, selectedLocation } = weatherState;

  // Format weather value string for MetricCard 3
  const getWeatherCardValue = () => {
    if (loading) return 'Loading...';
    if (error || !data) return 'API Offline';
    return `${data.current.temperature_2m.toFixed(1)}°C | ${data.current.relative_humidity_2m}% RH`;
  };

  const getWeatherCardSubtitle = () => {
    if (loading) return `Fetching weather for ${selectedLocation.name}...`;
    if (error) return error;
    if (!data) return 'No live weather available';
    return `${data.locationName}: Wind ${data.current.wind_speed_10m} km/h (${data.wmoDescription})`;
  };

  const getWeatherBadgeText = () => {
    if (loading) return 'OPEN-METEO LOADING';
    if (error) return 'OPEN-METEO ERROR';
    return 'LIVE OPEN-METEO';
  };

  const getWeatherBadgeType = (): 'info' | 'warning' | 'success' | 'danger' => {
    if (loading) return 'info';
    if (error) return 'warning';
    return 'success';
  };

  return (
    <div className="page-container overview-page">
      {/* Top 4 Summary Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="MONITORED REGIONS"
          value="4 Key Zones"
          subtitle="Bandipur, Nagarhole, Wayanad & Mudumalai"
          icon={<MapPin className="metric-icon green" />}
          badgeText="DEMO ZONES"
          badgeType="info"
        />

        <MetricCard
          title="FOREST HEALTH (NDVI)"
          value={
            vegetationState?.data?.is_configured 
              ? (vegetationState.data.latest_observation?.ndvi !== undefined 
                  ? vegetationState.data.latest_observation.ndvi.toFixed(2) 
                  : 'No Data')
              : 'Unconfigured'
          }
          subtitle={
            vegetationState?.data?.is_configured
              ? 'Sentinel-2 Multispectral NDVI Ingestion'
              : 'Satellite Source Unconfigured (GEE Target)'
          }
          icon={<Trees className="metric-icon green" />}
          badgeText={vegetationState?.data?.is_configured ? 'LIVE SATELLITE' : 'SATELLITE UNCONFIGURED'}
          badgeType={vegetationState?.data?.is_configured ? 'success' : 'warning'}
        />

        <MetricCard
          title="WEATHER PARAMETERS"
          value={getWeatherCardValue()}
          subtitle={getWeatherCardSubtitle()}
          icon={<Thermometer className="metric-icon amber" />}
          badgeText={getWeatherBadgeText()}
          badgeType={getWeatherBadgeType()}
        />

        <MetricCard
          title="WILDFIRE RISK LEVEL"
          value="MODERATE RISK"
          subtitle="2 Sectors High Risk (Low NDMI + High Temp)"
          icon={<ShieldAlert className="metric-icon orange" />}
          badgeText="DEMO UNCALIBRATED MODEL"
          badgeType="warning"
        />
      </div>

      {/* Live Open-Meteo Weather Detailed Observations Section */}
      <div className="section-row">
        <WeatherDetailCard 
          weatherState={weatherState} 
          onRetry={onRetryWeather}
          onSelectLocation={onSelectLocation}
        />
      </div>

      {/* Main Interactive Map Panel */}
      <div className="section-row">
        <MapPanel 
          zones={DEMO_MONITORED_ZONES} 
          selectedWeatherLocation={selectedLocation}
          weatherData={data}
        />
      </div>

      {/* Lower Section: Trend Chart + Observations */}
      <div className="section-grid-two-col">
        <TrendChart data={DEMO_HISTORICAL_TREND} />
        <ObservationsPanel observations={DEMO_RECENT_OBSERVATIONS} />
      </div>
    </div>
  );
};


