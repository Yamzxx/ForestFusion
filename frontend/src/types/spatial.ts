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

export interface ScenarioModifiedFeature {
  feature_name: string;
  display_name: string;
  baseline_value: number;
  scenario_value: number;
  delta_value: number;
  unit: string;
  direction: 'increased' | 'decreased';
}

export interface ScenarioSimulationRequest {
  latitude: number;
  longitude: number;
  location_name?: string;
  baseline_inputs: {
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
  scenario_inputs: {
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

export interface ScenarioSimulationResponse {
  location_name: string;
  latitude: number;
  longitude: number;
  baseline_prediction: SpatialPredictionResponse;
  scenario_prediction: SpatialPredictionResponse;
  probability_delta_pp: number;
  raw_margin_delta: number;
  risk_category_changed: boolean;
  modified_features_count: number;
  modified_features: ScenarioModifiedFeature[];
  top_shap_driver?: string | null;
  interpretation: string;
  scientific_disclaimer: string;
}

