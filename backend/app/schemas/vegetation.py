from pydantic import BaseModel
from typing import Optional, List

class VegetationObservation(BaseModel):
    timestamp: str
    ndvi: float
    ndmi: Optional[float] = None
    nbr: Optional[float] = None
    satellite_pass_id: Optional[str] = None
    satellite_name: str = "Sentinel-2"
    cloud_cover_percent: Optional[float] = None

class VegetationDataResponse(BaseModel):
    status: str  # "unconfigured", "configured", "no_data", "available"
    message: str
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    provider: str = "Sentinel-2 / Copernicus (GEE Target)"
    is_configured: bool = False
    latest_observation: Optional[VegetationObservation] = None
    observations: List[VegetationObservation] = []
