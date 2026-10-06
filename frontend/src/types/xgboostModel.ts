import type { BaselineFeaturesInput } from './mlModel';

export interface XGBoostHyperparameters {
  n_estimators: number;
  learning_rate: number;
  max_depth: number;
  subsample: number;
  colsample_bytree: number;
  gamma: number;
  min_child_weight: number;
  scale_pos_weight: number;
  random_state: number;
}

export interface FeatureImportanceItem {
  feature_name: string;
  gain_importance: number;
  weight_importance: number;
  rank: number;
}

export interface ModelComparisonRow {
  model_name: string;
  model_type: string;
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
  is_best_f1: boolean;
}

export interface ModelComparisonReport {
  evaluation_timestamp: string;
  dataset_split: string;
  target_definition: string;
  comparison_table: ModelComparisonRow[];
  best_overall_model: string;
  best_f1_model: string;
  xgboost_feature_importances: FeatureImportanceItem[];
  xgboost_hyperparameters: XGBoostHyperparameters;
  scientific_conclusions: string[];
  disclaimer: string;
}

export interface XGBoostPredictionResponse {
  model_name: string;
  model_type: string;
  prediction_class: number;
  prediction_label: string;
  wildfire_risk_probability: number;
  calibrated_probability?: number;
  raw_model_probability?: number;
  probability_calibration_applied?: boolean;
  calibration_method?: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  baseline_risk_probability: number;
  probability_delta: number;
  top_influential_features: Array<{
    feature: string;
    value: number;
    importance_rank: number;
    note: string;
  }>;
  input_validation_status: string;
}
