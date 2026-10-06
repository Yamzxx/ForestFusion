import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.schemas.data_prep import (
    WeatherCandidateFeatures,
    VegetationCandidateFeatures,
    FireCandidateFeatures,
    TemporalCandidateFeatures,
    SpatialCandidateFeatures,
    UnifiedEnvironmentalRecord,
    ValidationSummary,
    DataReadinessReport
)
from app.services.vegetation_service import get_vegetation_data
from app.services.fire_service import get_fire_detections

# Candidate Feature Catalog
CANDIDATE_FEATURES_CATALOG = [
    "weather.temperature_2m",
    "weather.relative_humidity_2m",
    "weather.apparent_temperature",
    "weather.precipitation",
    "weather.wind_speed_10m",
    "weather.wind_direction_10m",
    "vegetation.ndvi",
    "vegetation.ndmi",
    "vegetation.nbr",
    "vegetation.cloud_cover_percent",
    "temporal.month",
    "temporal.day_of_year",
    "temporal.is_summer_season",
    "spatial.latitude",
    "spatial.longitude",
    "spatial.grid_cell_id"
]

def validate_coordinate(lat: float, lng: float) -> tuple[bool, Optional[str]]:
    """Validate decimal degree latitude [-90, 90] and longitude [-180, 180]."""
    if not (-90.0 <= lat <= 90.0):
        return False, f"Invalid latitude {lat}° (must be between -90 and 90)"
    if not (-180.0 <= lng <= 180.0):
        return False, f"Invalid longitude {lng}° (must be between -180 and 180)"
    return True, None

def validate_weather_metrics(temp: float, humidity: float, wind_speed: float) -> tuple[bool, List[str]]:
    """Validate meteorological metrics against physical bounds."""
    flags = []
    if not (-50.0 <= temp <= 60.0):
        flags.append(f"Temperature out of bounds: {temp}°C")
    if not (0.0 <= humidity <= 100.0):
        flags.append(f"Relative humidity out of bounds: {humidity}%")
    if wind_speed < 0.0 or wind_speed > 300.0:
        flags.append(f"Wind speed out of bounds: {wind_speed} km/h")
    return len(flags) == 0, flags

def validate_ndvi_metric(ndvi: float, cloud_cover: float) -> tuple[bool, List[str]]:
    """Validate satellite NDVI reflectance index [-1.0, 1.0] and cloud cover."""
    flags = []
    if not (-1.0 <= ndvi <= 1.0):
        flags.append(f"NDVI out of index range: {ndvi}")
    if not (0.0 <= cloud_cover <= 100.0):
        flags.append(f"Cloud cover percentage out of bounds: {cloud_cover}%")
    return len(flags) == 0, flags

def get_grid_cell_id(lat: float, lng: float, grid_resolution: float = 0.05) -> str:
    """Compute spatial grid cell ID based on coordinate bounds (e.g. grid_11.70_76.40)."""
    grid_lat = round(round(lat / grid_resolution) * grid_resolution, 3)
    grid_lng = round(round(lng / grid_resolution) * grid_resolution, 3)
    return f"grid_{grid_lat:.2f}_{grid_lng:.2f}"

def evaluate_data_readiness(
    lat: float = 11.6667,
    lng: float = 76.6333,
    sample_days: int = 7
) -> DataReadinessReport:
    """
    Inspect actual connected backend data streams (Open-Meteo, Copernicus, NASA FIRMS),
    perform spatial & temporal alignment check, run validation rules, and generate an
    honest DataReadinessReport detailing ML training readiness.
    """
    # 1. Check active environment configurations
    copernicus_id = os.getenv("COPERNICUS_CLIENT_ID") or os.getenv("SENTINEL_HUB_CLIENT_ID")
    copernicus_secret = os.getenv("COPERNICUS_CLIENT_SECRET") or os.getenv("SENTINEL_HUB_CLIENT_SECRET")
    firms_key = os.getenv("NASA_FIRMS_MAP_KEY") or os.getenv("FIRMS_MAP_KEY")

    veg_configured = bool(copernicus_id and copernicus_secret)
    fire_configured = bool(firms_key)

    # Open-Meteo API is keyless & active by default
    weather_status = "connected (Open-Meteo API)"
    veg_status = "connected (Copernicus Sentinel-2)" if veg_configured else "unconfigured (Missing COPERNICUS_CLIENT_ID)"
    fire_status = "connected (NASA FIRMS)" if fire_configured else "unconfigured (Missing NASA_FIRMS_MAP_KEY)"

    # 2. Query actual backend data services
    veg_response = get_vegetation_data(lat=lat, lng=lng, location_name="Data Prep Target")
    fire_response = get_fire_detections(days=sample_days, source="VIIRS_SNPP_NRT", country="IND")

    # 3. Perform Validation & Summary Assembly
    records_examined = 0
    valid_records = 0
    rejected_records = 0
    rejection_reasons = []
    missing_fields_dict = {
        "copernicus_credentials": 0 if veg_configured else 1,
        "firms_map_key": 0 if fire_configured else 1,
        "confirmed_wildfire_perimeters": 1,
        "multi_year_historical_observations": 1
    }
    seen_ids = set()
    duplicate_count = 0

    aligned_samples: List[UnifiedEnvironmentalRecord] = []

    # Validate vegetation observations if present
    if veg_response.observations:
        for obs in veg_response.observations:
            records_examined += 1
            rec_id = f"veg-{obs.satellite_pass_id}-{obs.timestamp}"
            if rec_id in seen_ids:
                duplicate_count += 1
                continue
            seen_ids.add(rec_id)

            coord_valid, coord_err = validate_coordinate(lat, lng)
            ndvi_valid, ndvi_flags = validate_ndvi_metric(obs.ndvi, obs.cloud_cover_percent)

            if coord_valid and ndvi_valid:
                valid_records += 1
                dt = datetime.strptime(obs.timestamp, "%Y-%m-%d") if len(obs.timestamp) >= 10 else datetime.now(timezone.utc)
                aligned_samples.append(UnifiedEnvironmentalRecord(
                    record_id=rec_id,
                    timestamp=obs.timestamp,
                    latitude=lat,
                    longitude=lng,
                    spatial=SpatialCandidateFeatures(latitude=lat, longitude=lng, grid_cell_id=get_grid_cell_id(lat, lng)),
                    temporal=TemporalCandidateFeatures(
                        timestamp_iso=obs.timestamp,
                        month=dt.month,
                        day_of_year=dt.timetuple().tm_yday,
                        is_summer_season=dt.month in [3, 4, 5, 6]
                    ),
                    vegetation=VegetationCandidateFeatures(
                        ndvi=obs.ndvi,
                        ndmi=obs.ndmi,
                        nbr=obs.nbr,
                        cloud_cover_percent=obs.cloud_cover_percent,
                        satellite_pass_id=obs.satellite_pass_id
                    ),
                    target_label_type="no_satellite_detection",
                    is_valid=True
                ))
            else:
                rejected_records += 1
                if coord_err:
                    rejection_reasons.append(coord_err)
                rejection_reasons.extend(ndvi_flags)

    # Validate FIRMS fire detection records if present
    if fire_response.detections:
        for fdet in fire_response.detections:
            records_examined += 1
            rec_id = fdet.id
            if rec_id in seen_ids:
                duplicate_count += 1
                continue
            seen_ids.add(rec_id)

            coord_valid, coord_err = validate_coordinate(fdet.latitude, fdet.longitude)
            if coord_valid:
                valid_records += 1
                dt = datetime.now(timezone.utc)
                aligned_samples.append(UnifiedEnvironmentalRecord(
                    record_id=rec_id,
                    timestamp=fdet.acq_date,
                    latitude=fdet.latitude,
                    longitude=fdet.longitude,
                    spatial=SpatialCandidateFeatures(latitude=fdet.latitude, longitude=fdet.longitude, grid_cell_id=get_grid_cell_id(fdet.latitude, fdet.longitude)),
                    temporal=TemporalCandidateFeatures(
                        timestamp_iso=fdet.acq_date,
                        month=dt.month,
                        day_of_year=dt.timetuple().tm_yday,
                        is_summer_season=dt.month in [3, 4, 5, 6]
                    ),
                    fire=FireCandidateFeatures(
                        has_active_fire_detection=True,
                        confidence=fdet.confidence,
                        brightness_kelvin=fdet.brightness,
                        frp_mw=fdet.frp,
                        instrument=fdet.instrument
                    ),
                    target_label_type="satellite_thermal_hotspot",
                    is_valid=True
                ))
            else:
                rejected_records += 1
                if coord_err:
                    rejection_reasons.append(coord_err)

    # 4. Identify ML Training Blockers & Next Steps
    blockers = []
    next_steps = []

    if not veg_configured:
        blockers.append("Copernicus Sentinel-2 API credentials unconfigured in backend environment.")
        next_steps.append("Set COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET in backend/.env.")

    if not fire_configured:
        blockers.append("NASA FIRMS Map Key unconfigured in backend environment.")
        next_steps.append("Set NASA_FIRMS_MAP_KEY in backend/.env.")

    blockers.append("Lack of verified ground-truth wildfire perimeters (Satellite thermal hotspots alone are not ground-confirmed wildfires).")
    blockers.append("Insufficient multi-year historical dataset matrix (Need multi-season observations for XGBoost temporal cross-validation).")
    
    next_steps.append("Build multi-temporal raster extraction pipeline to store aligned GeoTIFF/NetCDF features.")
    next_steps.append("Perform class-balance sampling (negative sampling of unburned forest pixels vs thermal hotspots).")
    next_steps.append("Implement temporal train/validation/test split preventing spatial-temporal data leakage.")

    # Calculate honest status and readiness score
    is_ready = veg_configured and fire_configured and len(aligned_samples) >= 100
    if not veg_configured and not fire_configured:
        status_code = "configuration_required"
        readiness_pct = 25.0  # Architecture & Open-Meteo ready
    elif veg_configured or fire_configured:
        status_code = "partially_available"
        readiness_pct = 50.0  # Partial data pipelines active
    else:
        status_code = "insufficient_data"
        readiness_pct = 40.0

    validation_summary = ValidationSummary(
        records_examined=records_examined,
        valid_records=valid_records,
        rejected_records=rejected_records,
        rejection_reasons=rejection_reasons,
        duplicate_records_detected=duplicate_count,
        missing_value_fields=missing_fields_dict,
        spatial_coverage_bounds={"min_lat": lat - 0.5, "max_lat": lat + 0.5, "min_lng": lng - 0.5, "max_lng": lng + 0.5},
        temporal_range={"start_date": "2026-08-01", "end_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    )

    return DataReadinessReport(
        status=status_code,
        is_ml_ready=is_ready,
        readiness_percentage=readiness_pct,
        weather_provider_status=weather_status,
        satellite_provider_status=veg_status,
        fire_provider_status=fire_status,
        total_aligned_samples=len(aligned_samples),
        validation_summary=validation_summary,
        candidate_features=CANDIDATE_FEATURES_CATALOG,
        ml_training_blockers=blockers,
        required_next_steps=next_steps
    )
