from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class WeatherCandidateFeatures(BaseModel):
    temperature_2m: float
    relative_humidity_2m: float
    apparent_temperature: Optional[float] = None
    precipitation: float
    wind_speed_10m: float
    wind_direction_10m: Optional[float] = None

class VegetationCandidateFeatures(BaseModel):
    ndvi: float
    ndmi: Optional[float] = None
    nbr: Optional[float] = None
    cloud_cover_percent: float
    satellite_pass_id: Optional[str] = None

class FireCandidateFeatures(BaseModel):
    has_active_fire_detection: bool
    confidence: Optional[str] = None
    brightness_kelvin: Optional[float] = None
    frp_mw: Optional[float] = None
    instrument: Optional[str] = None

class TemporalCandidateFeatures(BaseModel):
    timestamp_iso: str
    month: int
    day_of_year: int
    is_summer_season: bool

class SpatialCandidateFeatures(BaseModel):
    latitude: float
    longitude: float
    grid_cell_id: Optional[str] = None

class UnifiedEnvironmentalRecord(BaseModel):
    record_id: str
    timestamp: str
    latitude: float
    longitude: float
    spatial: SpatialCandidateFeatures
    temporal: TemporalCandidateFeatures
    weather: Optional[WeatherCandidateFeatures] = None
    vegetation: Optional[VegetationCandidateFeatures] = None
    fire: Optional[FireCandidateFeatures] = None
    target_label_type: str = "unlabeled_observation"  # "satellite_thermal_hotspot", "no_satellite_detection", "unobserved"
    is_valid: bool = True
    validation_flags: List[str] = []

class ValidationSummary(BaseModel):
    records_examined: int = 0
    valid_records: int = 0
    rejected_records: int = 0
    rejection_reasons: List[str] = []
    duplicate_records_detected: int = 0
    missing_value_fields: Dict[str, int] = {}
    spatial_coverage_bounds: Optional[Dict[str, float]] = None
    temporal_range: Optional[Dict[str, str]] = None

class DataReadinessReport(BaseModel):
    status: str  # "data_available", "partially_available", "configuration_required", "insufficient_data"
    is_ml_ready: bool = False
    readiness_percentage: float = 0.0
    weather_provider_status: str
    satellite_provider_status: str
    fire_provider_status: str
    total_aligned_samples: int = 0
    validation_summary: ValidationSummary
    candidate_features: List[str] = []
    ml_training_blockers: List[str] = []
    required_next_steps: List[str] = []
    disclaimer: str = "Strict real-data policy enforced: No synthetic data or uncalibrated labels used for ML readiness metrics."
