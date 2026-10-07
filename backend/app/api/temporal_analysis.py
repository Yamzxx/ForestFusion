from fastapi import APIRouter, Query
from app.schemas.temporal_analysis import TemporalAnalysisResponse
from app.services.temporal_analysis_service import get_temporal_analysis

router = APIRouter()

@router.get("/ml/temporal-analysis", response_model=TemporalAnalysisResponse)
async def get_temporal_risk_analysis(
    days: int = Query(14, ge=1, le=90, description="Timeframe window in days [1 to 90]"),
    lat: float = Query(11.6667, ge=-90.0, le=90.0, description="Latitude decimal degrees"),
    lng: float = Query(76.6333, ge=-180.0, le=180.0, description="Longitude decimal degrees")
):
    """
    Generate historical risk trends and temporal analysis report across a date range.
    Performs:
    1. Historical NASA FIRMS satellite fire-detection daily aggregation.
    2. Daily environmental observation trend extraction (temperature, humidity, wind, NDVI).
    3. Model-backed spatial prediction evaluation over observation dates (XGBoost + Platt Calibration).
    4. Pearson statistical correlation analysis (r) between environmental variables and fire/risk trends.
    """
    return get_temporal_analysis(days=days, lat=lat, lng=lng)
