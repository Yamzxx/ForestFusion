from fastapi import APIRouter
from app.schemas.ml_model import (
    BaselineFeaturesInput,
    BaselinePredictionResponse,
    BaselineModelEvaluationReport
)
from app.services.ml_baseline_service import (
    predict_baseline_risk,
    evaluate_baseline_model,
    save_baseline_artifact
)

router = APIRouter()

@router.post("/ml/predict", response_model=BaselinePredictionResponse)
async def predict_wildfire_baseline_risk(inputs: BaselineFeaturesInput):
    """
    Run baseline Logistic Regression inference on environmental feature inputs.
    Returns prediction class, risk probability [0.0-1.0], risk level, log-odds score,
    and feature contribution breakdown.
    """
    return predict_baseline_risk(inputs)

@router.get("/ml/baseline-evaluation", response_model=BaselineModelEvaluationReport)
async def get_baseline_model_evaluation():
    """
    Retrieve baseline Logistic Regression model evaluation report, confusion matrix,
    feature weights, and scientific limitations documentation.
    """
    return evaluate_baseline_model()

@router.post("/ml/train-baseline", response_model=BaselineModelEvaluationReport)
async def trigger_baseline_model_training():
    """
    Trigger baseline Logistic Regression pipeline evaluation and serialize model artifact.
    """
    save_baseline_artifact()
    return evaluate_baseline_model()
