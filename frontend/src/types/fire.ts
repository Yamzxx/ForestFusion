export interface FireDetectionRecord {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number;
  bright_t31?: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: string;
  confidence: string;
  frp?: number;
  daynight?: string;
  is_confirmed_incident: boolean;
  detection_type: string;
}

export interface FireDataResponse {
  status: 'unconfigured' | 'configured' | 'no_data' | 'available';
  message: string;
  provider: string;
  is_configured: boolean;
  total_detections: number;
  detections: FireDetectionRecord[];
  source_instrument?: string;
  days_searched?: number;
  data_provenance: string;
  data_limitations: string;
  setup_instructions?: string[];
}

export interface FireState {
  data: FireDataResponse | null;
  loading: boolean;
  error: string | null;
}
