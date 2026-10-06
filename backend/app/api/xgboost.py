from fastapi import APIRouter
from app.schemas.ml_model import BaselineFeaturesInput
from app.schemas.xgboost_model import (
    XGBoostPredictionResponse,
    ModelComparisonReport
)
from app.services.xgboost_service import (
    predict_xgboost_risk,
    generate_model_comparison_report,
    save_xgboost_artifact
)

router = APIRouter()

@router.post("/ml/xgboost/predict", response_model=XGBoostPredictionResponse)
async def predict_wildfire_xgboost_risk(inputs: BaselineFeaturesInput):
    """
    Run XGBoost non-linear decision tree inference and compare probability output
    side-by-side with the Day 9 baseline Logistic Regression model.
    """
    return predict_xgboost_risk(inputs)

@router.get("/ml/model-comparison", response_model=ModelComparisonReport)
async def get_model_comparison_audit():
    """
    Retrieve objective side-by-side model evaluation report comparing
    Day 9 Baseline Logistic Regression vs Day 10 XGBoost Classifier across
    Accuracy, Precision, Recall, F1-Score, ROC-AUC, PR-AUC, and Confusion Matrix.
    """
    return generate_model_comparison_report()
