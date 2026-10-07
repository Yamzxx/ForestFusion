export interface ShapContributorDetail {
  feature: string;
  shap_value: number;
  feature_value: any;
  direction: 'INCREASED_RISK' | 'DECREASED_RISK';
  explanatory_statement: string;
}

export interface DecisionSupportSummary {
  location_name: string;
  latitude: number;
  longitude: number;
  prediction_timestamp: string;
  model_name_version: string;
  predicted_class: number;
  calibrated_probability: number;
  raw_model_probability: number;
  risk_category: string;
  attention_status_code: 'NORMAL_MONITORING' | 'MODERATE_REVIEW' | 'ELEVATED_ATTENTION_RECOMMENDED' | 'HIGH_ATTENTION_CRITICAL_REVIEW' | 'UNAVAILABLE';
  attention_status_label: string;
  attention_highlight_reason: string;
  shap_contributors: ShapContributorDetail[];
  environmental_evidence: Record<string, any>;
  vegetation_evidence: Record<string, any>;
  historical_context: Record<string, any>;
  decision_support_recommendations: string[];
  data_freshness: Record<string, string>;
  is_available: boolean;
  error_message?: string | null;
  scientific_disclaimer: string;
}

export interface DecisionSupportAttentionItem {
  location_name: string;
  latitude: number;
  longitude: number;
  risk_category: string;
  calibrated_probability: number;
  attention_status_code: string;
  attention_status_label: string;
  primary_shap_contributor: string;
  prediction_timestamp: string;
  telemetry_source: string;
}

export interface DecisionSupportAttentionListResponse {
  total_locations: number;
  elevated_attention_count: number;
  attention_items: DecisionSupportAttentionItem[];
  data_freshness_notes: string;
}
