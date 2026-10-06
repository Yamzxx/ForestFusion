import type { ModelEvaluationMetrics } from './mlModel';

export interface CalibrationBinItem {
  bin_index: number;
  bin_range: string;
  sample_count: number;
  mean_predicted_prob_raw: number;
  mean_predicted_prob_calibrated: number;
  observed_positive_rate: number;
}

export interface CalibrationMetrics {
  brier_score_raw: number;
  brier_score_calibrated: number;
  brier_score_improvement_pct: number;
  ece_raw: number;
  ece_calibrated: number;
  ece_improvement_pct: number;
}

export interface CalibrationCurveReport {
  method: string;
  fitted_parameters: {
    slope_A: number;
    intercept_B: number;
  };
  calibration_bins: CalibrationBinItem[];
  metrics: CalibrationMetrics;
  histogram_raw: number[];
  histogram_calibrated: number[];
  bin_edges: number[];
}

export interface ValidationLeakageAudit {
  temporal_leakage_prevented: boolean;
  geographic_leakage_prevented: boolean;
  preprocessing_leakage_prevented: boolean;
  target_leakage_prevented: boolean;
  duplicate_leakage_prevented: boolean;
  strategy_description: string;
  audit_notes: string[];
}

export interface ModelValidationCalibrationReport {
  evaluation_timestamp: string;
  dataset_split: string;
  train_samples_count: number;
  val_samples_count: number;
  test_samples_count: number;
  positive_class_ratio_val: number;
  leakage_audit: ValidationLeakageAudit;
  baseline_evaluation: ModelEvaluationMetrics;
  xgboost_evaluation: ModelEvaluationMetrics;
  calibration_analysis: CalibrationCurveReport;
  scientific_conclusions: string[];
  disclaimer: string;
}

export interface CalibrateProbabilityResponse {
  raw_probability: number;
  raw_margin?: number | null;
  calibrated_probability: number;
  calibration_method: string;
  calibration_formula: string;
  interpretation: string;
  scientific_disclaimer: string;
}
