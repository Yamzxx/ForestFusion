import type { HealthStatus, MonitoredZone, RecentObservation, HistoricalTrendPoint } from '../types';

export const fetchHealthStatus = async (): Promise<HealthStatus | null> => {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: HealthStatus = await response.json();
    return data;
  } catch (error) {
    console.warn('Backend API connection check failed:', error);
    return null;
  }
};

// DEMO / MOCK DATA FOR DAY 1 DASHBOARD SHELL
// Note: All values are explicitly flagged as DEMO DATA for initial prototype UI.
export const DEMO_MONITORED_ZONES: MonitoredZone[] = [
  {
    id: 'zone-1',
    name: 'Bandipur Core Forest Sector A',
    lat: 11.664,
    lng: 76.627,
    riskLevel: 'High',
    ndvi: 0.42,
    ndmi: -0.15,
    nbr: 0.18,
    temp: 34.2,
    humidity: 22,
    windSpeed: 21,
    lastUpdated: '10 mins ago (Demo)',
    isDemo: true,
  },
  {
    id: 'zone-2',
    name: 'Nagarhole Southern Reserve',
    lat: 11.986,
    lng: 76.124,
    riskLevel: 'Moderate',
    ndvi: 0.61,
    ndmi: 0.08,
    nbr: 0.38,
    temp: 31.0,
    humidity: 32,
    windSpeed: 14,
    lastUpdated: '25 mins ago (Demo)',
    isDemo: true,
  },
  {
    id: 'zone-3',
    name: 'Wayanad High Altitude Range',
    lat: 11.685,
    lng: 76.132,
    riskLevel: 'Low',
    ndvi: 0.78,
    ndmi: 0.31,
    nbr: 0.62,
    temp: 26.5,
    humidity: 58,
    windSpeed: 9,
    lastUpdated: '40 mins ago (Demo)',
    isDemo: true,
  },
  {
    id: 'zone-4',
    name: 'Mudumalai Buffer Perimeter',
    lat: 11.562,
    lng: 76.534,
    riskLevel: 'High',
    ndvi: 0.49,
    ndmi: -0.05,
    nbr: 0.22,
    temp: 33.8,
    humidity: 25,
    windSpeed: 19,
    lastUpdated: '1 hour ago (Demo)',
    isDemo: true,
  }
];

export const DEMO_HISTORICAL_TREND: HistoricalTrendPoint[] = [
  { month: 'Jan', recordedFires: 3, avgTemperature: 28.5, avgNDVI: 0.72, isDemo: true },
  { month: 'Feb', recordedFires: 8, avgTemperature: 31.2, avgNDVI: 0.65, isDemo: true },
  { month: 'Mar', recordedFires: 19, avgTemperature: 34.8, avgNDVI: 0.48, isDemo: true },
  { month: 'Apr', recordedFires: 24, avgTemperature: 36.1, avgNDVI: 0.41, isDemo: true },
  { month: 'May', recordedFires: 12, avgTemperature: 33.4, avgNDVI: 0.55, isDemo: true },
  { month: 'Jun', recordedFires: 2, avgTemperature: 27.8, avgNDVI: 0.76, isDemo: true },
  { month: 'Jul', recordedFires: 1, avgTemperature: 26.1, avgNDVI: 0.81, isDemo: true },
  { month: 'Aug', recordedFires: 0, avgTemperature: 26.5, avgNDVI: 0.84, isDemo: true },
  { month: 'Sep', recordedFires: 2, avgTemperature: 28.0, avgNDVI: 0.79, isDemo: true },
  { month: 'Oct', recordedFires: 4, avgTemperature: 29.2, avgNDVI: 0.75, isDemo: true },
  { month: 'Nov', recordedFires: 6, avgTemperature: 28.8, avgNDVI: 0.73, isDemo: true },
  { month: 'Dec', recordedFires: 5, avgTemperature: 27.5, avgNDVI: 0.74, isDemo: true }
];

export const DEMO_RECENT_OBSERVATIONS: RecentObservation[] = [
  {
    id: 'obs-101',
    timestamp: '14:32 UTC (Demo)',
    zoneName: 'Bandipur Sector A',
    type: 'Weather Update',
    message: 'Low relative humidity (22%) detected across Sector A. Wildfire hazard elevated.',
    severity: 'warning',
    isDemo: true
  },
  {
    id: 'obs-102',
    timestamp: '12:15 UTC (Demo)',
    zoneName: 'Nagarhole South',
    type: 'Satellite Pass',
    message: 'Sentinel-2 L2A tile ingested. NDVI average calculated at 0.61.',
    severity: 'info',
    isDemo: true
  },
  {
    id: 'obs-103',
    timestamp: '09:40 UTC (Demo)',
    zoneName: 'Mudumalai Buffer',
    type: 'Sensor Reading',
    message: 'Thermal anomaly indicator triggered in mock telemetry feed.',
    severity: 'critical',
    isDemo: true
  },
  {
    id: 'obs-104',
    timestamp: '06:10 UTC (Demo)',
    zoneName: 'Wayanad Range',
    type: 'System Log',
    message: 'Geospatial bounding box index check complete. 0 anomalies detected.',
    severity: 'info',
    isDemo: true
  }
];
