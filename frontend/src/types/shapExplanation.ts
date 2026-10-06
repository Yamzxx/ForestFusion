export interface LocalShapContribution {
  feature_name: string;
  feature_value: number;
  shap_value: number;
  contribution_direction: string;
  attribution_magnitude: number;
  human_explanation: string;
}

export interface LocalShapExplanationResponse {
  model_name: string;
  model_version: string;
  base_value: number;
  base_probability: number;
  output_margin: number;
  model_probability: number;
  probability_label: string;
  calibrated_probability?: number;
  calibration_method?: string;
  predicted_class: number;
  predicted_label: string;
  feature_contributions: LocalShapContribution[];
  additivity_check_valid: boolean;
  input_validation_status: string;
  scientific_disclaimer: string;
}

export interface GlobalShapImportanceItem {
  feature_name: string;
  mean_abs_shap_value: number;
  rank: number;
  relative_importance: number;
}

export interface GlobalShapReport {
  model_name: string;
  evaluation_samples_count: number;
  explanation_method: string;
  global_feature_importances: GlobalShapImportanceItem[];
  scientific_interpretation: string[];
  disclaimer: string;
}
