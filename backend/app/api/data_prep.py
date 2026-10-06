from fastapi import APIRouter, Query
from typing import Optional
from app.schemas.data_prep import DataReadinessReport
from app.services.data_prep_service import evaluate_data_readiness

router = APIRouter()

@router.get("/data-readiness", response_model=DataReadinessReport)
async def get_data_readiness_assessment(
    lat: Optional[float] = Query(11.6667, description="Latitude decimal degrees for target assessment region"),
    lng: Optional[float] = Query(76.6333, description="Longitude decimal degrees for target assessment region"),
    days: Optional[int] = Query(7, ge=1, le=30, description="Number of past days for telemetry evaluation")
):
    """
    Evaluate actual connected backend dataset streams (Open-Meteo, Copernicus, NASA FIRMS),
    run data validation guardrails, summarize candidate features, and report honest ML readiness.
    """
    return evaluate_data_readiness(lat=lat or 11.6667, lng=lng or 76.6333, sample_days=days or 7)
