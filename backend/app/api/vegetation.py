from fastapi import APIRouter, Query
from typing import Optional
from app.schemas.vegetation import VegetationDataResponse
from app.services.vegetation_service import get_vegetation_data

router = APIRouter()

@router.get("/vegetation", response_model=VegetationDataResponse)
async def fetch_vegetation_data(
    lat: Optional[float] = Query(None, description="Latitude decimal degrees"),
    lng: Optional[float] = Query(None, description="Longitude decimal degrees"),
    location_name: Optional[str] = Query(None, description="Name of target monitoring zone or region")
):
    """
    Get satellite vegetation health and NDVI observation telemetry for a location.
    Returns status 'unconfigured' if no verified satellite data provider is bound.
    """
    return get_vegetation_data(lat=lat, lng=lng, location_name=location_name)
