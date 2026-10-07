export interface FireActivityPoint {
  date: string;
  detection_count: number;
  avg_brightness_kelvin?: number | null;
  max_frp_mw?: number | null;
  observation_source: string;
}

export interface EnvironmentalTrendPoint {
  date: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  precipitation: number;
  ndvi: number;
  ndmi: number;
}

export interface ModelRiskTrendPoint {
  date: string;
  calibrated_probability: number;
  raw_model_probability: number;
  risk_category: string;
  primary_contributor: string;
}

export interface CorrelationMetric {
  variable_x: string;
  variable_y: string;
  pearson_r: number;
  sample_size: number;
  interpretation: string;
  disclaimer: string;
}

export interface TemporalAnalysisResponse {
  start_date: string;
  end_date: string;
  total_days: number;
  fire_activity_trend: FireActivityPoint[];
  environmental_trend: EnvironmentalTrendPoint[];
  model_risk_trend: ModelRiskTrendPoint[];
  correlations: CorrelationMetric[];
  temporal_coverage_notes: string;
  scientific_disclaimer: string;
}
