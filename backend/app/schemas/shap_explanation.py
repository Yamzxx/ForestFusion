from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class LocalShapContribution(BaseModel):
    feature_name: str
    feature_value: float
    shap_value: float  # phi_j in raw margin space
    contribution_direction: str  # "contributed toward higher predicted risk" | "contributed toward lower predicted risk"
    attribution_magnitude: float  # |phi_j|
    human_explanation: str

class LocalShapExplanationResponse(BaseModel):
    model_name: str = "XGBoost Classifier v1.0"
    model_version: str = "1.0.0"
    base_value: float = -0.60  # Expected margin phi_0
    base_probability: float = 0.3543  # sigmoid(phi_0)
    output_margin: float  # phi_0 + sum(phi_j)
    model_probability: float  # Uncalibrated model probability sigmoid(output_margin)
    probability_label: str = "Model probability (Uncalibrated)"
    calibrated_probability: Optional[float] = None  # Platt-calibrated probability
    calibration_method: str = "Platt Scaling (Sigmoid)"
    predicted_class: int  # 0 or 1
    predicted_label: str
    feature_contributions: List[LocalShapContribution]
    additivity_check_valid: bool = True
    input_validation_status: str = "valid"
    scientific_disclaimer: str = (
        "SCIENTIFIC EXPLAINABILITY NOTICE: SHAP values explain mathematical model behavior, "
        "not physical causality. Feature contributions indicate statistical association within the tree splits "
        "and do NOT prove that a feature caused wildfire."
    )

class GlobalShapImportanceItem(BaseModel):
    feature_name: str
    mean_abs_shap_value: float
    rank: int
    relative_importance: float  # Percentage of total mean |SHAP|

class GlobalShapReport(BaseModel):
    model_name: str = "XGBoost Classifier v1.0"
    evaluation_samples_count: int = 200
    explanation_method: str = "TreeSHAP (Exact Path-Dependent Shapley Attribution)"
    global_feature_importances: List[GlobalShapImportanceItem]
    scientific_interpretation: List[str]
    disclaimer: str = (
        "Global SHAP feature importance measures the average magnitude of model reliance across the evaluation dataset. "
        "It does not constitute physical proof of environmental wildfire causality."
    )
