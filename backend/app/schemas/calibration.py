from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.schemas.ml_model import ModelEvaluationMetrics

class CalibrationBinItem(BaseModel):
    bin_index: int
    bin_range: str
    sample_count: int
    mean_predicted_prob_raw: float
    mean_predicted_prob_calibrated: float
    observed_positive_rate: float

class CalibrationMetrics(BaseModel):
    brier_score_raw: float = Field(..., description="Mean squared error of raw model probabilities against binary labels")
    brier_score_calibrated: float = Field(..., description="Mean squared error of Platt-calibrated probabilities")
    brier_score_improvement_pct: float = Field(..., description="Percentage improvement in Brier score")
    ece_raw: float = Field(..., description="Expected Calibration Error before calibration")
    ece_calibrated: float = Field(..., description="Expected Calibration Error after calibration")
    ece_improvement_pct: float = Field(..., description="Percentage reduction in ECE")

class CalibrationCurveReport(BaseModel):
    method: str = "Platt Scaling (Sigmoid Logistic Calibration)"
    fitted_parameters: Dict[str, float] = Field(..., description="Fitted sigmoid parameters: slope A and intercept B")
    calibration_bins: List[CalibrationBinItem]
    metrics: CalibrationMetrics
    histogram_raw: List[int]
    histogram_calibrated: List[int]
    bin_edges: List[float]

class ValidationLeakageAudit(BaseModel):
    temporal_leakage_prevented: bool = True
    geographic_leakage_prevented: bool = True
    preprocessing_leakage_prevented: bool = True
    target_leakage_prevented: bool = True
    duplicate_leakage_prevented: bool = True
    strategy_description: str
    audit_notes: List[str]

class ModelValidationCalibrationReport(BaseModel):
    evaluation_timestamp: str
    dataset_split: str
    train_samples_count: int
    val_samples_count: int
    test_samples_count: int
    positive_class_ratio_val: float
    leakage_audit: ValidationLeakageAudit
    baseline_evaluation: ModelEvaluationMetrics
    xgboost_evaluation: ModelEvaluationMetrics
    calibration_analysis: CalibrationCurveReport
    scientific_conclusions: List[str]
    disclaimer: str = (
        "SCIENTIFIC NOTICE: Calibrated probabilities represent empirical frequencies estimated on the held-out "
        "validation distribution. They do not constitute deterministic or operational wildfire event guarantees."
    )
