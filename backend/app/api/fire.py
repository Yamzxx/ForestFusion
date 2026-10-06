from fastapi import APIRouter, Query
from typing import Optional
from app.schemas.fire import FireDataResponse
from app.services.fire_service import get_fire_detections

router = APIRouter()

@router.get("/fire-detections", response_model=FireDataResponse)
async def fetch_active_fire_detections(
    days: int = Query(7, ge=1, le=30, description="Number of past days to query (1-30)"),
    source: str = Query("VIIRS_SNPP_NRT", description="Satellite instrument source (VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT, MODIS_NRT)"),
    country: str = Query("IND", description="ISO3 country code filter")
):
    """
    Get satellite active-fire thermal anomaly detections from NASA FIRMS API.
    Returns status 'unconfigured' if NASA_FIRMS_MAP_KEY is not set in environment.
    """
    return get_fire_detections(days=days, source=source, country=country)
