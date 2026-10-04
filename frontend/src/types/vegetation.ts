export interface VegetationObservation {
  timestamp: string;
  ndvi: number;
  ndmi?: number;
  nbr?: number;
  satellite_pass_id?: string;
  satellite_name: string;
  cloud_cover_percent?: number;
}

export interface VegetationDataResponse {
  status: 'unconfigured' | 'configured' | 'no_data' | 'available';
  message: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  provider: string;
  is_configured: bool;
  latest_observation?: VegetationObservation;
  observations: VegetationObservation[];
}

export interface VegetationState {
  data: VegetationDataResponse | null;
  loading: boolean;
  error: string | null;
}
