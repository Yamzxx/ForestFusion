from pydantic import BaseModel
from typing import Optional, List

class VegetationObservation(BaseModel):
    timestamp: str
    ndvi: float
    ndmi: Optional[float] = None
    nbr: Optional[float] = None
    satellite_pass_id: Optional[str] = None
    satellite_name: str = "Sentinel-2 MSI L2A"
    cloud_cover_percent: Optional[float] = None
    spatial_resolution: Optional[str] = "10m"
    quality_flag: Optional[str] = None

class VegetationDataResponse(BaseModel):
    status: str  # "unconfigured", "configured", "no_data", "available"
    message: str
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    provider: str = "Copernicus Data Space Ecosystem (Sentinel-2 MSI L2A)"
    is_configured: bool = False
    latest_observation: Optional[VegetationObservation] = None
    observations: List[VegetationObservation] = []
    setup_instructions: Optional[List[str]] = None
