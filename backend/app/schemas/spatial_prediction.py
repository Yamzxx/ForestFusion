from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.schemas.ml_model import BaselineFeaturesInput
from app.schemas.shap_explanation import LocalShapExplanationResponse

class SpatialFeatureTelemetry(BaseModel):
    temperature_2m: float = Field(..., description="Air temperature at 2m in °C")
    relative_humidity_2m: float = Field(..., description="Relative humidity percentage [0-100]")
    wind_speed_10m: float = Field(..., description="Wind speed at 10m in km/h")
    precipitation: float = Field(0.0, description="Precipitation in mm")
    ndvi: float = Field(0.45, description="Vegetation greenness index NDVI [-1.0 to 1.0]")
    ndmi: Optional[float] = Field(-0.05, description="Canopy moisture index NDMI [-1.0 to 1.0]")
    month: int = Field(..., description="Observation month [1-12]")
    telemetry_source: str = Field("Open-Meteo & Copernicus Sentinel-2", description="Telemetry data provider")

class SpatialPredictionRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude decimal degrees")
    location_name: Optional[str] = Field(None, description="Human readable name of location or sector")
    environmental_inputs: Optional[BaselineFeaturesInput] = Field(None, description="Direct environmental feature inputs if already retrieved")

class SpatialPredictionResponse(BaseModel):
    latitude: float
    longitude: float
    location_name: str
    prediction_class: int  # 0: Low/Normal, 1: Elevated Hazard
    calibrated_probability: float  # Platt-calibrated probability
    raw_model_probability: float  # Uncalibrated XGBoost probability
    raw_margin: float
    risk_category: str  # "Low", "Moderate", "High", "Very High"
    risk_level_code: str  # "LOW", "MODERATE", "HIGH", "EXTREME"
    calibration_method: str = "Platt Scaling (Sigmoid)"
    model_version: str = "XGBoost v1.0 (Calibrated)"
    features_used: SpatialFeatureTelemetry
    shap_explanation: Optional[LocalShapExplanationResponse] = None
    is_prediction_available: bool = True
    error_message: Optional[str] = None
    scientific_disclaimer: str = (
        "SCIENTIFIC NOTICE: Model predictions represent statistical wildfire-weather hazard likelihoods "
        "calibrated against historical satellite thermal anomaly distributions. They are NOT operational "
        "emergency warning triggers or guarantees of wildfire ignition."
    )

class SpatialBatchPredictionRequest(BaseModel):
    locations: List[SpatialPredictionRequest]

class SpatialBatchPredictionResponse(BaseModel):
    predictions: List[SpatialPredictionResponse]
    total_requested: int
    total_valid: int
    spatial_coverage_notes: str = (
        "Model predictions are computed strictly for monitored locations with verified meteorological "
        "and satellite observations. Predictions are not fabricated across unmonitored locations."
    )

class ScenarioModifiedFeature(BaseModel):
    feature_name: str
    display_name: str
    baseline_value: float
    scenario_value: float
    delta_value: float
    unit: str
    direction: str  # "increased", "decreased"

class ScenarioSimulationRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_name: Optional[str] = None
    baseline_inputs: BaselineFeaturesInput
    scenario_inputs: BaselineFeaturesInput

class ScenarioSimulationResponse(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    baseline_prediction: SpatialPredictionResponse
    scenario_prediction: SpatialPredictionResponse
    probability_delta_pp: float
    raw_margin_delta: float
    risk_category_changed: bool
    modified_features_count: int
    modified_features: List[ScenarioModifiedFeature]
    top_shap_driver: Optional[str] = None
    interpretation: str
    scientific_disclaimer: str = (
        "SCIENTIFIC NOTICE: Scenario analysis modifies model inputs and evaluates the resulting "
        "trained model response. It does not establish physical causation and should not be "
        "interpreted as an operational wildfire forecast."
    )
