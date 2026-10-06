export interface BaselineFeaturesInput {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  precipitation?: number;
  ndvi: number;
  ndmi?: number;
  cloud_cover_percent?: number;
  latitude?: number;
  longitude?: number;
  month?: number;
}

export interface FeatureContribution {
  feature_name: string;
  feature_value: number;
  coefficient_weight: number;
  contribution_score: number;
  direction: string;
}

export interface BaselinePredictionResponse {
  model_name: string;
  model_type: string;
  prediction_class: number;
  prediction_label: string;
  wildfire_risk_probability: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  log_odds_score: number;
  intercept: number;
  feature_contributions: FeatureContribution[];
  input_validation_status: string;
  scientific_disclaimer: string;
}

export interface ModelEvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc?: number;
  pr_auc?: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
}

export interface BaselineModelEvaluationReport {
  model_name: string;
  status: string;
  trained_timestamp: string;
  train_samples_count: number;
  val_samples_count: number;
  positive_class_ratio: number;
  selected_features: string[];
  coefficients: Record<string, number>;
  intercept: number;
  evaluation_metrics: ModelEvaluationMetrics;
  training_strategy: string;
  class_imbalance_handling: string;
  scientific_limitations: string[];
}
