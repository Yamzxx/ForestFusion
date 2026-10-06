export interface SourceCoverageDetail {
  source_name: string;
  provider: string;
  is_configured: boolean;
  status: string;
  record_count: number;
  date_start?: string | null;
  date_end?: string | null;
  geographic_extent: string;
}

export interface QualityAnalysisMetrics {
  total_records_inspected: number;
  valid_record_count: number;
  missing_values_summary: Record<string, number>;
  missing_value_percentage: number;
  duplicate_count: number;
  invalid_coordinate_count: number;
  out_of_bounds_value_count: number;
  exclusion_reasons: string[];
}

export interface TemporalSpatialDistribution {
  temporal_span_days: number;
  has_temporal_gaps: boolean;
  temporal_coverage_notes: string;
  spatial_overlap_status: string;
  spatial_representation: string;
  grid_cell_density: string;
}

export interface FireDataAnalysisDetail {
  total_observations: number;
  provider_source: string;
  observation_nature: string;
  confidence_ratings_present: boolean;
  can_derive_defensible_binary_labels: boolean;
  labeling_limitations: string[];
}

export interface FeatureLeakageAudit {
  features_audited: string[];
  has_leakage_risk: boolean;
  leakage_notes: string[];
}

export interface DatasetAnalysisReport {
  analysis_timestamp: string;
  ml_readiness_classification: 'READY FOR BASELINE MODEL' | 'PARTIALLY READY — DATA QUALITY/CONFIGURATION WORK REQUIRED' | 'NOT READY — MORE REAL DATA REQUIRED';
  classification_justification: string;
  dataset_overview: SourceCoverageDetail[];
  quality_metrics: QualityAnalysisMetrics;
  temporal_spatial_distribution: TemporalSpatialDistribution;
  fire_data_analysis: FireDataAnalysisDetail;
  feature_leakage_audit: FeatureLeakageAudit;
  target_defensibility_assessment: string;
  biggest_remaining_blocker: string;
  recommended_next_step: string;
}

export interface DatasetAnalysisState {
  report: DatasetAnalysisReport | null;
  loading: boolean;
  error: string | null;
}
