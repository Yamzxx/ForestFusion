from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class BaselineFeaturesInput(BaseModel):
    temperature_2m: float = Field(..., description="Air temperature at 2m in °C")
    relative_humidity_2m: float = Field(..., description="Relative humidity percentage [0-100]")
    wind_speed_10m: float = Field(..., description="Wind speed at 10m in km/h")
    precipitation: float = Field(0.0, description="Precipitation in mm")
    ndvi: float = Field(0.45, description="Normalized Difference Vegetation Index [-1.0 to 1.0]")
    ndmi: Optional[float] = Field(-0.05, description="Normalized Difference Moisture Index [-1.0 to 1.0]")
    cloud_cover_percent: float = Field(10.0, description="Satellite scene cloud cover percentage [0-100]")
    latitude: float = Field(11.6667, description="Latitude decimal degrees")
    longitude: float = Field(76.6333, description="Longitude decimal degrees")
    month: int = Field(4, description="Observation month [1-12]")

class FeatureContribution(BaseModel):
    feature_name: str
    feature_value: float
    coefficient_weight: float
    contribution_score: float  # log-odds contribution
    direction: str  # "Increases Risk" or "Decreases Risk"

class BaselinePredictionResponse(BaseModel):
    model_name: str = "Logistic Regression Baseline v1.0"
    model_type: str = "Interpretable Linear Binary Classifier"
    prediction_class: int  # 0: Low/Normal Hazard, 1: Elevated Thermal Anomaly Hazard
    prediction_label: str
    wildfire_risk_probability: float  # [0.0, 1.0]
    risk_level: str  # "LOW", "MODERATE", "HIGH", "EXTREME"
    log_odds_score: float
    intercept: float
    feature_contributions: List[FeatureContribution] = []
    input_validation_status: str = "valid"
    scientific_disclaimer: str = (
        "RESEARCH PROTOTYPE NOTICE: Baseline model outputs represent statistical risk probabilities "
        "derived from meteorological and satellite inputs. They are NOT operational emergency warning triggers."
    )

class ModelEvaluationMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: Optional[float] = None
    pr_auc: Optional[float] = None
    confusion_matrix: Dict[str, int]  # {"true_negative": N, "false_positive": N, "false_negative": N, "true_positive": N}

class BaselineModelEvaluationReport(BaseModel):
    model_name: str = "Logistic Regression Baseline v1.0"
    status: str  # "trained_baseline" or "unconfigured_telemetry"
    trained_timestamp: str
    train_samples_count: int
    val_samples_count: int
    positive_class_ratio: float
    selected_features: List[str]
    coefficients: Dict[str, float]
    intercept: float
    evaluation_metrics: ModelEvaluationMetrics
    training_strategy: str = "Temporal Train/Validation Split (80% Historical Train / 20% Validation)"
    class_imbalance_handling: str = "Balanced Class Weighting (inverse frequency penalization)"
    scientific_limitations: List[str]
