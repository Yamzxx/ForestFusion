export interface ValidationSummary {
  records_examined: number;
  valid_records: number;
  rejected_records: number;
  rejection_reasons: string[];
  duplicate_records_detected: number;
  missing_value_fields: Record<string, number>;
  spatial_coverage_bounds?: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  };
  temporal_range?: {
    start_date: string;
    end_date: string;
  };
}

export interface DataReadinessReport {
  status: 'data_available' | 'partially_available' | 'configuration_required' | 'insufficient_data';
  is_ml_ready: boolean;
  readiness_percentage: number;
  weather_provider_status: string;
  satellite_provider_status: string;
  fire_provider_status: string;
  total_aligned_samples: number;
  validation_summary: ValidationSummary;
  candidate_features: string[];
  ml_training_blockers: string[];
  required_next_steps: string[];
  disclaimer: string;
}

export interface DataPrepState {
  report: DataReadinessReport | null;
  loading: boolean;
  error: string | null;
}
