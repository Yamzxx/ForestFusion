from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ShapContributorDetail(BaseModel):
    feature: str = Field(..., description="Feature metric name (e.g. temperature_2m)")
    shap_value: float = Field(..., description="TreeSHAP attribution contribution value")
    feature_value: Any = Field(..., description="Observed feature value")
    direction: str = Field(..., description="Risk direction ('INCREASED_RISK' or 'DECREASED_RISK')")
    explanatory_statement: str = Field(..., description="Neutral explanation of feature contribution to model score")

class DecisionSupportSummary(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    prediction_timestamp: str
    model_name_version: str = "XGBoost v1.0 (Calibrated)"
    predicted_class: int
    calibrated_probability: float
    raw_model_probability: float
    risk_category: str  # Low, Moderate, High, Very High
    attention_status_code: str  # NORMAL_MONITORING, MODERATE_REVIEW, ELEVATED_ATTENTION_RECOMMENDED, HIGH_ATTENTION_CRITICAL_REVIEW
    attention_status_label: str
    attention_highlight_reason: str
    shap_contributors: List[ShapContributorDetail]
    environmental_evidence: Dict[str, Any]
    vegetation_evidence: Dict[str, Any]
    historical_context: Dict[str, Any]
    decision_support_recommendations: List[str]
    data_freshness: Dict[str, str]
    is_available: bool = True
    error_message: Optional[str] = None
    scientific_disclaimer: str = (
        "SCIENTIFIC NOTICE: ForestFusion provides model-based decision support derived from statistical training distributions. "
        "Model-predicted risk is not confirmation of a wildfire and should not be interpreted as an operational emergency warning. "
        "SHAP values explain internal model behavior, not physical causality."
    )

class DecisionSupportAttentionItem(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    risk_category: str
    calibrated_probability: float
    attention_status_code: str
    attention_status_label: str
    primary_shap_contributor: str
    prediction_timestamp: str
    telemetry_source: str

class DecisionSupportAttentionListResponse(BaseModel):
    total_locations: int
    elevated_attention_count: int
    attention_items: List[DecisionSupportAttentionItem]
    data_freshness_notes: str
