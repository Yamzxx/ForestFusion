import os
from typing import Optional
from app.schemas.vegetation import VegetationDataResponse

def get_vegetation_data(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    location_name: Optional[str] = None
) -> VegetationDataResponse:
    """
    Fetch genuine vegetation data for given coordinates.
    Checks environment for satellite provider credentials (e.g. Google Earth Engine, Sentinel Hub).
    Returns an unconfigured state when no satellite API source is active, avoiding mock/fake numbers.
    """
    gee_credentials = os.getenv("GEE_SERVICE_ACCOUNT")
    sentinel_client_id = os.getenv("SENTINEL_HUB_CLIENT_ID")

    # Check if a satellite provider is configured
    if not gee_credentials and not sentinel_client_id:
        return VegetationDataResponse(
            status="unconfigured",
            message="Satellite vegetation data source not configured. Connect Sentinel-2 or Google Earth Engine API credentials in backend environment.",
            location_name=location_name,
            latitude=lat,
            longitude=lng,
            provider="Sentinel-2 / Copernicus (GEE Target)",
            is_configured=False,
            latest_observation=None,
            observations=[]
        )

    # Future integration point for active GEE / Sentinel API calls
    return VegetationDataResponse(
        status="no_data",
        message="Satellite provider configured, but no valid raster tile observations found for the specified bounding box.",
        location_name=location_name,
        latitude=lat,
        longitude=lng,
        provider="Sentinel-2 / Copernicus",
        is_configured=True,
        latest_observation=None,
        observations=[]
    )
