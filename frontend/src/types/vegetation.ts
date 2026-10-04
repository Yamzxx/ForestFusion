export interface VegetationObservation {
  timestamp: string;
  ndvi: number;
  ndmi?: number;
  nbr?: number;
  satellite_pass_id?: string;
  satellite_name: string;
  cloud_cover_percent?: number;
  spatial_resolution?: string;
  quality_flag?: string;
}

export interface VegetationDataResponse {
  status: 'unconfigured' | 'configured' | 'no_data' | 'available';
  message: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  provider: string;
  is_configured: boolean;
  latest_observation?: VegetationObservation;
  observations: VegetationObservation[];
  setup_instructions?: string[];
}

export interface VegetationState {
  data: VegetationDataResponse | null;
  loading: boolean;
  error: string | null;
}
