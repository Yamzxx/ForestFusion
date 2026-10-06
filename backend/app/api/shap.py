from fastapi import APIRouter
from app.schemas.ml_model import BaselineFeaturesInput
from app.schemas.shap_explanation import (
    LocalShapExplanationResponse,
    GlobalShapReport
)
from app.services.shap_service import (
    explain_prediction_with_shap,
    get_global_shap_report
)

router = APIRouter()

@router.post("/ml/shap/explain", response_model=LocalShapExplanationResponse)
async def explain_individual_prediction(inputs: BaselineFeaturesInput):
    """
    Generate an individual TreeSHAP local explanation answering:
    'Why did the model make this prediction?'
    Returns exact additive feature contributions (phi_j), base expected value (phi_0),
    uncalibrated model probability, and directional contribution flags.
    """
    return explain_prediction_with_shap(inputs)

@router.get("/ml/shap/global-importance", response_model=GlobalShapReport)
async def get_global_shap_feature_importance():
    """
    Retrieve global feature importance report based on mean absolute TreeSHAP values
    across the evaluation dataset.
    """
    return get_global_shap_report()
