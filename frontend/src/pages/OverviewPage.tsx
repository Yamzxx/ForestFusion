import React from 'react';
import { MapPin, Trees, Thermometer, ShieldAlert } from 'lucide-react';
import { MetricCard } from '../components/Card';
import { MapPanel } from '../components/MapPanel';
import { TrendChart } from '../components/TrendChart';
import { ObservationsPanel } from '../components/ObservationsPanel';
import { DEMO_MONITORED_ZONES, DEMO_HISTORICAL_TREND, DEMO_RECENT_OBSERVATIONS } from '../services/apiService';

export const OverviewPage: React.FC = () => {
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
          value="0.68 Avg"
          subtitle="Moderate-High Vegetation Canopy Density"
          icon={<Trees className="metric-icon green" />}
          badgeText="DEMO SATELLITE MOCK"
          badgeType="success"
        />

        <MetricCard
          title="WEATHER PARAMETERS"
          value="31.5°C | 28% RH"
          subtitle="Wind: 18 km/h | Dry season dry-spells"
          icon={<Thermometer className="metric-icon amber" />}
          badgeText="DEMO WEATHER MOCK"
          badgeType="warning"
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

      {/* Main Interactive Map Panel */}
      <div className="section-row">
        <MapPanel zones={DEMO_MONITORED_ZONES} />
      </div>

      {/* Lower Section: Trend Chart + Observations */}
      <div className="section-grid-two-col">
        <TrendChart data={DEMO_HISTORICAL_TREND} />
        <ObservationsPanel observations={DEMO_RECENT_OBSERVATIONS} />
      </div>
    </div>
  );
};
