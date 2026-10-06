from fastapi import APIRouter, Query
from typing import Optional
from app.schemas.dataset_analysis import DatasetAnalysisReport
from app.services.dataset_analysis_service import run_dataset_analysis

router = APIRouter()

@router.get("/dataset-analysis", response_model=DatasetAnalysisReport)
async def get_dataset_analysis_report(
    lat: Optional[float] = Query(11.6667, description="Latitude decimal degrees for target assessment region"),
    lng: Optional[float] = Query(76.6333, description="Longitude decimal degrees for target assessment region"),
    days: Optional[int] = Query(7, ge=1, le=30, description="Number of past days for telemetry evaluation")
):
    """
    Perform a genuine dataset audit across all connected environmental data streams,
    evaluating coverage, quality, temporal/spatial alignment, target label defensibility,
    and ML training readiness.
    """
    return run_dataset_analysis(lat=lat or 11.6667, lng=lng or 76.6333, sample_days=days or 7)
