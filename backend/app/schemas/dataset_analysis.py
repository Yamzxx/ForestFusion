from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SourceCoverageDetail(BaseModel):
    source_name: str
    provider: str
    is_configured: bool
    status: str
    record_count: int
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    geographic_extent: str

class QualityAnalysisMetrics(BaseModel):
    total_records_inspected: int
    valid_record_count: int
    missing_values_summary: Dict[str, int]
    missing_value_percentage: float
    duplicate_count: int
    invalid_coordinate_count: int
    out_of_bounds_value_count: int
    exclusion_reasons: List[str]

class TemporalSpatialDistribution(BaseModel):
    temporal_span_days: int
    has_temporal_gaps: bool
    temporal_coverage_notes: str
    spatial_overlap_status: str
    spatial_representation: str
    grid_cell_density: str

class FireDataAnalysisDetail(BaseModel):
    total_observations: int
    provider_source: str
    observation_nature: str  # "Satellite Radiometer Thermal Anomaly Hotspots (375m/1km)"
    confidence_ratings_present: bool
    can_derive_defensible_binary_labels: bool = False
    labeling_limitations: List[str]

class FeatureLeakageAudit(BaseModel):
    features_audited: List[str]
    has_leakage_risk: bool = False
    leakage_notes: List[str]

class DatasetAnalysisReport(BaseModel):
    analysis_timestamp: str
    ml_readiness_classification: str  # "READY FOR BASELINE MODEL" | "PARTIALLY READY — DATA QUALITY/CONFIGURATION WORK REQUIRED" | "NOT READY — MORE REAL DATA REQUIRED"
    classification_justification: str
    dataset_overview: List[SourceCoverageDetail]
    quality_metrics: QualityAnalysisMetrics
    temporal_spatial_distribution: TemporalSpatialDistribution
    fire_data_analysis: FireDataAnalysisDetail
    feature_leakage_audit: FeatureLeakageAudit
    target_defensibility_assessment: str
    biggest_remaining_blocker: str
    recommended_next_step: str
