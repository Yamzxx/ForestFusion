from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from app.schemas.calibration import ModelValidationCalibrationReport
from app.services.calibration_service import (
    get_model_validation_calibration_report,
    calibrate_raw_margin,
    calibrate_raw_probability,
    save_calibration_artifact
)

router = APIRouter()

class CalibrateProbabilityRequest(BaseModel):
    raw_probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Raw uncalibrated model probability [0.0 - 1.0]")
    raw_margin: Optional[float] = Field(None, description="Raw XGBoost decision margin (log-odds)")

class CalibrateProbabilityResponse(BaseModel):
    raw_probability: float
    raw_margin: Optional[float] = None
    calibrated_probability: float
    calibration_method: str = "Platt Scaling (Sigmoid Logistic Calibration)"
    calibration_formula: str = "P_calibrated = 1 / (1 + exp(-0.8520 * margin + 0.1450))"
    interpretation: str
    scientific_disclaimer: str = (
        "Calibrated probabilities estimate empirical class frequency within the validation data distribution. "
        "They do NOT guarantee deterministic real-world wildfire ignition."
    )

@router.get("/ml/calibration-report", response_model=ModelValidationCalibrationReport)
async def get_calibration_and_validation_report():
    """
    Retrieve comprehensive Model Validation and Probability Calibration report:
    - Train/Validation/Test split leakage audit (temporal, spatial, preprocessing, target)
    - Classification metrics for Baseline Logistic Regression vs XGBoost Classifier
    - Platt Scaling calibration curve and reliability diagram (binned predicted vs observed)
    - Brier score and Expected Calibration Error (ECE) before and after calibration
    - Probability distribution histograms
    """
    return get_model_validation_calibration_report()

@router.post("/ml/calibrate-probability", response_model=CalibrateProbabilityResponse)
async def calibrate_probability_endpoint(req: CalibrateProbabilityRequest):
    """
    Apply fitted Platt Scaling calibration to a given raw model probability or margin score.
    """
    if req.raw_margin is not None:
        margin = req.raw_margin
        cal_prob = calibrate_raw_margin(margin)
        raw_p = round(1.0 / (1.0 + 2.718281828459045 ** (-margin)), 4)
    elif req.raw_probability is not None:
        raw_p = req.raw_probability
        cal_prob = calibrate_raw_probability(raw_p)
        margin = None
    else:
        raw_p = 0.50
        cal_prob = calibrate_raw_probability(raw_p)
        margin = 0.0

    delta = round(cal_prob - raw_p, 4)
    if delta < 0:
        interp = f"Platt scaling corrected overconfident raw probability from {raw_p:.1%} down to {cal_prob:.1%} ({delta:+.1%})."
    elif delta > 0:
        interp = f"Platt scaling adjusted conservative raw probability from {raw_p:.1%} up to {cal_prob:.1%} ({delta:+.1%})."
    else:
        interp = f"Raw probability {raw_p:.1%} aligns closely with the empirical validation distribution base rate."

    return CalibrateProbabilityResponse(
        raw_probability=raw_p,
        raw_margin=margin,
        calibrated_probability=cal_prob,
        interpretation=interp
    )
