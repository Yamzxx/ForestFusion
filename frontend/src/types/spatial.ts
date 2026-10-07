import type { LocalShapExplanationResponse } from './shapExplanation';

export interface SpatialFeatureTelemetry {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  precipitation: number;
  ndvi: number;
  ndmi?: number;
  month: number;
  telemetry_source: string;
}

export interface SpatialPredictionRequest {
  latitude: number;
  longitude: number;
  location_name?: string;
  environmental_inputs?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation?: number;
    ndvi?: number;
    ndmi?: number;
    month?: number;
    latitude?: number;
    longitude?: number;
  };
}

export interface SpatialPredictionResponse {
  latitude: number;
  longitude: number;
  location_name: string;
  prediction_class: number;
  calibrated_probability: number;
  raw_model_probability: number;
  raw_margin: number;
  risk_category: string;
  risk_level_code: string;
  calibration_method: string;
  model_version: string;
  features_used: SpatialFeatureTelemetry;
  shap_explanation?: LocalShapExplanationResponse | null;
  is_prediction_available: boolean;
  error_message?: string | null;
  scientific_disclaimer: string;
}

export interface SpatialBatchPredictionRequest {
  locations: SpatialPredictionRequest[];
}

export interface SpatialBatchPredictionResponse {
  predictions: SpatialPredictionResponse[];
  total_requested: number;
  total_valid: number;
  spatial_coverage_notes: string;
}
