from fastapi import APIRouter
from app.schemas.spatial_prediction import (
    SpatialPredictionRequest,
    SpatialPredictionResponse,
    SpatialBatchPredictionRequest,
    SpatialBatchPredictionResponse
)
from app.services.spatial_prediction_service import (
    predict_spatial_wildfire_risk,
    predict_spatial_batch
)

router = APIRouter()

@router.post("/ml/spatial-prediction", response_model=SpatialPredictionResponse)
async def get_spatial_prediction(req: SpatialPredictionRequest):
    """
    Generate model-backed wildfire risk prediction and TreeSHAP attribution for a geographic coordinate.
    Executes:
    1. Meteorological & vegetation feature resolution (or direct validation).
    2. Missing-input protection (returns clean error instead of synthetic values).
    3. Trained XGBoost tree margin inference.
    4. Platt Sigmoid probability calibration.
    5. Validated risk classification (Low, Moderate, High, Very High).
    6. Local TreeSHAP attribution.
    """
    return predict_spatial_wildfire_risk(req)

@router.post("/ml/spatial-predictions-batch", response_model=SpatialBatchPredictionResponse)
async def get_spatial_predictions_batch(req: SpatialBatchPredictionRequest):
    """
    Batch evaluation of model-backed spatial risk predictions for monitored forest sectors.
    """
    return predict_spatial_batch(req)
