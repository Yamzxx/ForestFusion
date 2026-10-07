from fastapi import APIRouter
from app.schemas.spatial_prediction import SpatialPredictionRequest
from app.schemas.decision_support import (
    DecisionSupportSummary,
    DecisionSupportAttentionListResponse
)
from app.services.decision_support_service import (
    evaluate_decision_support,
    get_attention_list
)

router = APIRouter()

@router.post("/ml/decision-support/evaluate", response_model=DecisionSupportSummary)
async def evaluate_location_decision_support(req: SpatialPredictionRequest):
    """
    Generate model-backed risk attention assessment and decision-support summary for a location.
    Consumes validated XGBoost prediction, Platt calibration, TreeSHAP explanation,
    environmental evidence context, and historical FIRMS detections.
    """
    return evaluate_decision_support(req)

@router.get("/ml/decision-support/attention-list", response_model=DecisionSupportAttentionListResponse)
async def get_monitored_attention_list():
    """
    Get dashboard risk attention list across monitored forest sectors.
    """
    return get_attention_list()
