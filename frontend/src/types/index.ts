export * from './weather';
export * from './vegetation';
export * from './fire';



export type NavigationTab = 
  | 'overview' 
  | 'risk-map' 
  | 'what-if'
  | 'decision-support'
  | 'forest-health' 
  | 'satellite-observations' 
  | 'temporal-analysis' 
  | 'model-analytics' 
  | 'data-sources' 
  | 'model-info' 
  | 'settings'
  // Backward compatibility aliases
  | 'alerts'
  | 'historical-fires' 
  | 'analytics';


export interface HealthStatus {
  status: string;
  app: string;
  version: string;
  environment: string;
  services?: Record<string, string>;
}

export interface MonitoredZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
  ndvi: number;
  ndmi: number;
  nbr: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  lastUpdated: string;
  isDemo: boolean;
}

export interface RecentObservation {
  id: string;
  timestamp: string;
  zoneName: string;
  type: 'Satellite Pass' | 'Sensor Reading' | 'System Log' | 'Weather Update';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isDemo: boolean;
}

export interface HistoricalTrendPoint {
  month: string;
  recordedFires: number;
  avgTemperature: number;
  avgNDVI: number;
  isDemo: boolean;
}
