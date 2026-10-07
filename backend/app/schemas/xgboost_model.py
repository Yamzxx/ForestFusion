from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class XGBoostHyperparameters(BaseModel):
    n_estimators: int = Field(100, description="Number of boosting trees")
    learning_rate: float = Field(0.05, description="Shrinkage factor (eta)")
    max_depth: int = Field(4, description="Maximum tree depth for feature interactions")
    subsample: float = Field(0.8, description="Subsample ratio of training instances")
    colsample_bytree: float = Field(0.8, description="Subsample ratio of columns per tree")
    gamma: float = Field(0.1, description="Minimum loss reduction required for split")
    min_child_weight: int = Field(1, description="Minimum sum of instance weight in child")
    scale_pos_weight: float = Field(1.85, description="Balancing weight for positive class imbalance")
    random_state: int = Field(42, description="Random seed for reproducibility")

class FeatureImportanceItem(BaseModel):
    feature_name: str
    gain_importance: float  # Average gain of splits using this feature
    weight_importance: int  # Number of times feature is used in splits
    rank: int

class ModelComparisonRow(BaseModel):
    model_name: str
    model_type: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: Optional[float] = None
    pr_auc: Optional[float] = None
    confusion_matrix: Dict[str, int]
    is_best_f1: bool = False

class ModelComparisonReport(BaseModel):
    evaluation_timestamp: str
    dataset_split: str = "Temporal Split (80% Train / 20% Validation)"
    target_definition: str = "Satellite Thermal Anomaly Hotspot (VIIRS/MODIS)"
    comparison_table: List[ModelComparisonRow]
    best_overall_model: str
    best_f1_model: str
    xgboost_feature_importances: List[FeatureImportanceItem]
    xgboost_hyperparameters: XGBoostHyperparameters
    scientific_conclusions: List[str]
    disclaimer: str = "RESEARCH PROTOTYPE: XGBoost predictions represent non-linear decision tree probabilities, NOT operational ground-truth fire warnings."

class XGBoostPredictionResponse(BaseModel):
    model_name: str = "XGBoost Classifier v1.0"
    model_type: str = "Gradient Boosted Decision Trees (GBDT)"
    prediction_class: int  # 0 or 1
    prediction_label: str
    wildfire_risk_probability: float  # Calibrated probability
    calibrated_probability: float
    raw_model_probability: float
    probability_calibration_applied: bool = True
    calibration_method: str = "Platt Scaling (Sigmoid)"
    risk_level: str  # "LOW", "MODERATE", "HIGH", "EXTREME"
    baseline_risk_probability: float
    probability_delta: float  # XGBoost calibrated prob - Baseline prob
    top_influential_features: List[Dict[str, Any]]
    input_validation_status: str = "valid"
    scientific_disclaimer: str = (
        "RESEARCH PROTOTYPE NOTICE: Non-linear XGBoost raw outputs are calibrated via Platt scaling on held-out "
        "validation data to estimate empirical class frequencies, NOT deterministic real-world wildfire guarantees."
    )
