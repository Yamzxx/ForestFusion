from pydantic import BaseModel
from typing import Optional, List

class FireDetectionRecord(BaseModel):
    id: str
    latitude: float
    longitude: float
    brightness: float
    bright_t31: Optional[float] = None
    acq_date: str
    acq_time: str
    satellite: str = "VIIRS S-NPP"
    instrument: str = "VIIRS"
    confidence: str = "nominal"
    frp: Optional[float] = None
    daynight: Optional[str] = "D"
    is_confirmed_incident: bool = False
    detection_type: str = "Satellite Thermal Anomaly (Active-Fire Hotspot)"

class FireDataResponse(BaseModel):
    status: str  # "unconfigured", "configured", "no_data", "available"
    message: str
    provider: str = "NASA FIRMS (EOSDIS / VIIRS & MODIS)"
    is_configured: bool = False
    total_detections: int = 0
    detections: List[FireDetectionRecord] = []
    source_instrument: Optional[str] = "VIIRS_SNPP_NRT"
    days_searched: Optional[int] = 7
    data_provenance: str = "NASA Fire Information for Resource Management System (FIRMS)"
    data_limitations: str = "Satellite active-fire detections represent radiometer thermal anomalies (hotspots) at 375m/1km pixel resolution. They are not automatically confirmed ground wildfires or exact burn boundaries."
    setup_instructions: Optional[List[str]] = None
