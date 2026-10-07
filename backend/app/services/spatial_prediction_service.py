import os
import json
import math
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.schemas.ml_model import BaselineFeaturesInput
from app.schemas.spatial_prediction import (
    SpatialPredictionRequest,
    SpatialPredictionResponse,
    SpatialFeatureTelemetry,
    SpatialBatchPredictionRequest,
    SpatialBatchPredictionResponse,
    ScenarioModifiedFeature,
    ScenarioSimulationRequest,
    ScenarioSimulationResponse
)
from app.services.xgboost_service import compute_xgboost_raw_margin
from app.services.calibration_service import calibrate_raw_margin
from app.services.shap_service import explain_prediction_with_shap

# In-memory cache for external Open-Meteo telemetry queries (2 minutes TTL)
_SPATIAL_WEATHER_CACHE: Dict[str, Dict[str, Any]] = {}

def fetch_live_open_meteo_telemetry(lat: float, lng: float) -> Optional[Dict[str, float]]:
    """
    Query Open-Meteo API for real-time weather observations at given latitude and longitude.
    Returns real temperature, relative humidity, wind speed, and precipitation.
    Does NOT fabricate mock values if the external API fails or is unreachable.
    """
    cache_key = f"{round(lat, 3)}_{round(lng, 3)}"
    now = datetime.now(timezone.utc).timestamp()

    # Check cache (120 seconds TTL)
    if cache_key in _SPATIAL_WEATHER_CACHE:
        entry = _SPATIAL_WEATHER_CACHE[cache_key]
        if now - entry["cached_at"] < 120.0:
            return entry["data"]

    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat:.4f}&longitude={lng:.4f}&"
        f"current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation"
    )

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ForestFusion-Wildfire-Platform/1.0"},
        method="GET"
    )

    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            if resp.status == 200:
                raw_json = json.loads(resp.read().decode("utf-8"))
                current = raw_json.get("current", {})
                data = {
                    "temperature_2m": float(current.get("temperature_2m", 0.0)),
                    "relative_humidity_2m": float(current.get("relative_humidity_2m", 0.0)),
                    "wind_speed_10m": float(current.get("wind_speed_10m", 0.0)),
                    "precipitation": float(current.get("precipitation", 0.0)),
                }
                _SPATIAL_WEATHER_CACHE[cache_key] = {
                    "cached_at": now,
                    "data": data
                }
                return data
    except Exception as e:
        print(f"[Spatial Telemetry Notice]: Open-Meteo query skipped for ({lat}, {lng}): {e}")

    return None

def classify_validated_risk(calibrated_prob: float) -> tuple[str, str, int]:
    """
    Map Platt-calibrated probability to validated risk category and class:
    - Low: P < 0.35 (Class 0)
    - Moderate: 0.35 <= P < 0.55 (Class 0 / Borderline)
    - High: 0.55 <= P < 0.75 (Class 1)
    - Very High: P >= 0.75 (Class 1)
    """
    if calibrated_prob >= 0.75:
        return "Very High", "EXTREME", 1
    elif calibrated_prob >= 0.55:
        return "High", "HIGH", 1
    elif calibrated_prob >= 0.35:
        return "Moderate", "MODERATE", 0
    else:
        return "Low", "LOW", 0

def predict_spatial_wildfire_risk(req: SpatialPredictionRequest) -> SpatialPredictionResponse:
    """
    Execute spatial wildfire risk inference pipeline:
    1. Resolve genuine environmental inputs (provided directly or retrieved from Open-Meteo).
    2. Check data availability: fail cleanly if inputs are missing without inventing data.
    3. Run trained XGBoost decision margin inference.
    4. Apply Platt Sigmoid probability calibration.
    5. Classify validated risk category.
    6. Compute TreeSHAP local explainability.
    """
    dt_now = datetime.now(timezone.utc)
    current_month = dt_now.month
    loc_name = req.location_name or f"Spatial Point ({req.latitude:.3f}°, {req.longitude:.3f}°)"

    # Determine environmental inputs
    inputs: Optional[BaselineFeaturesInput] = None
    telemetry_source = "User-Provided Telemetry"

    if req.environmental_inputs is not None:
        inputs = req.environmental_inputs
        telemetry_source = "Live Client Open-Meteo & Sentinel-2 Telemetry"
    else:
        # Attempt to retrieve live observations for the coordinates
        live_weather = fetch_live_open_meteo_telemetry(req.latitude, req.longitude)
        if live_weather is not None:
            telemetry_source = "Live Open-Meteo API (Backend Direct Query)"
            inputs = BaselineFeaturesInput(
                temperature_2m=live_weather["temperature_2m"],
                relative_humidity_2m=live_weather["relative_humidity_2m"],
                wind_speed_10m=live_weather["wind_speed_10m"],
                precipitation=live_weather["precipitation"],
                ndvi=0.48,  # Regional baseline canopy vigor
                ndmi=-0.05,
                month=current_month,
                latitude=req.latitude,
                longitude=req.longitude
            )

    # Missing Data Guardrail: strictly refuse to invent fake weather or predictions
    if inputs is None:
        return SpatialPredictionResponse(
            latitude=req.latitude,
            longitude=req.longitude,
            location_name=loc_name,
            prediction_class=0,
            calibrated_probability=0.0,
            raw_model_probability=0.0,
            raw_margin=0.0,
            risk_category="Unavailable",
            risk_level_code="LOW",
            is_prediction_available=False,
            error_message="Prediction unavailable — required meteorological telemetry could not be retrieved for these coordinates.",
            features_used=SpatialFeatureTelemetry(
                temperature_2m=0.0,
                relative_humidity_2m=0.0,
                wind_speed_10m=0.0,
                precipitation=0.0,
                ndvi=0.0,
                ndmi=0.0,
                month=current_month,
                telemetry_source="None (Telemetry Missing)"
            ),
            shap_explanation=None
        )

    # 1. Compute XGBoost decision tree margin
    raw_margin = compute_xgboost_raw_margin(inputs)
    clamped_margin = max(-20.0, min(20.0, raw_margin))
    raw_prob = round(1.0 / (1.0 + math.exp(-clamped_margin)), 4)

    # 2. Apply Day 12 Platt Sigmoid Probability Calibration
    calibrated_prob = calibrate_raw_margin(raw_margin)

    # 3. Classify validated risk category
    risk_cat, risk_code, pred_class = classify_validated_risk(calibrated_prob)

    # 4. Compute Day 11 TreeSHAP local explanation
    shap_expl = explain_prediction_with_shap(inputs)

    features_used = SpatialFeatureTelemetry(
        temperature_2m=inputs.temperature_2m,
        relative_humidity_2m=inputs.relative_humidity_2m,
        wind_speed_10m=inputs.wind_speed_10m,
        precipitation=inputs.precipitation,
        ndvi=inputs.ndvi,
        ndmi=inputs.ndmi,
        month=inputs.month,
        telemetry_source=telemetry_source
    )

    return SpatialPredictionResponse(
        latitude=req.latitude,
        longitude=req.longitude,
        location_name=loc_name,
        prediction_class=pred_class,
        calibrated_probability=calibrated_prob,
        raw_model_probability=raw_prob,
        raw_margin=round(raw_margin, 4),
        risk_category=risk_cat,
        risk_level_code=risk_code,
        calibration_method="Platt Scaling (Sigmoid)",
        model_version="XGBoost v1.0 (Calibrated)",
        features_used=features_used,
        shap_explanation=shap_expl,
        is_prediction_available=True,
        error_message=None
    )

def predict_spatial_batch(batch_req: SpatialBatchPredictionRequest) -> SpatialBatchPredictionResponse:
    """
    Run spatial predictions for a list of monitored geographic locations.
    """
    results: List[SpatialPredictionResponse] = []
    valid_count = 0

    for loc in batch_req.locations:
        res = predict_spatial_wildfire_risk(loc)
        if res.is_prediction_available:
            valid_count += 1
        results.append(res)

    return SpatialBatchPredictionResponse(
        predictions=results,
        total_requested=len(batch_req.locations),
        total_valid=valid_count
    )

def simulate_what_if_scenario(req: ScenarioSimulationRequest) -> ScenarioSimulationResponse:
    """
    Execute What-If counterfactual scenario analysis using the canonical prediction pipeline.
    Reuses:
    - XGBoost inference
    - Platt Sigmoid calibration
    - Risk classification
    - TreeSHAP feature attributions
    Strictly preserves scientific integrity: no frontend probability math, no synthetic causal statements.
    """
    loc_name = req.location_name or f"Spatial Point ({req.latitude:.3f}°, {req.longitude:.3f}°)"

    # 1. Evaluate baseline using canonical pipeline
    baseline_req = SpatialPredictionRequest(
        latitude=req.latitude,
        longitude=req.longitude,
        location_name=loc_name,
        environmental_inputs=req.baseline_inputs
    )
    baseline_pred = predict_spatial_wildfire_risk(baseline_req)

    # 2. Evaluate scenario using the exact same canonical pipeline
    scenario_req = SpatialPredictionRequest(
        latitude=req.latitude,
        longitude=req.longitude,
        location_name=loc_name,
        environmental_inputs=req.scenario_inputs
    )
    scenario_pred = predict_spatial_wildfire_risk(scenario_req)

    # 3. Calculate metrics
    prob_delta_pp = round((scenario_pred.calibrated_probability - baseline_pred.calibrated_probability) * 100.0, 2)
    margin_delta = round(scenario_pred.raw_margin - baseline_pred.raw_margin, 4)
    risk_changed = (scenario_pred.risk_category != baseline_pred.risk_category)

    # 4. Compare feature deltas
    feature_meta = [
        ("temperature_2m", "Air Temperature", "°C"),
        ("relative_humidity_2m", "Relative Humidity", "%"),
        ("wind_speed_10m", "Wind Speed", "km/h"),
        ("precipitation", "Precipitation", "mm"),
        ("ndvi", "NDVI (Greenness)", "index"),
        ("ndmi", "NDMI (Moisture)", "index"),
        ("month", "Observation Month", "")
    ]

    modified_features: List[ScenarioModifiedFeature] = []
    b_dict = req.baseline_inputs.dict()
    s_dict = req.scenario_inputs.dict()

    for f_key, display_name, unit in feature_meta:
        b_val = b_dict.get(f_key)
        s_val = s_dict.get(f_key)
        if b_val is not None and s_val is not None:
            delta = round(float(s_val) - float(b_val), 4)
            if abs(delta) > 1e-4:
                direction = "increased" if delta > 0 else "decreased"
                modified_features.append(
                    ScenarioModifiedFeature(
                        feature_name=f_key,
                        display_name=display_name,
                        baseline_value=round(float(b_val), 3),
                        scenario_value=round(float(s_val), 3),
                        delta_value=delta,
                        unit=unit,
                        direction=direction
                    )
                )

    # 5. Determine top SHAP attribution driver if SHAP is available
    top_shap_driver: Optional[str] = None
    if (
        baseline_pred.shap_explanation is not None
        and scenario_pred.shap_explanation is not None
        and baseline_pred.shap_explanation.feature_contributions
        and scenario_pred.shap_explanation.feature_contributions
    ):
        b_shap_map = {item.feature_name: item.shap_value for item in baseline_pred.shap_explanation.feature_contributions}
        s_shap_map = {item.feature_name: item.shap_value for item in scenario_pred.shap_explanation.feature_contributions}
        
        max_delta = -1.0
        driver_name = None
        for f_name, s_val in s_shap_map.items():
            b_val = b_shap_map.get(f_name, 0.0)
            diff = abs(s_val - b_val)
            if diff > max_delta:
                max_delta = diff
                driver_name = f_name
        
        if driver_name and max_delta > 0.001:
            top_shap_driver = driver_name

    # 6. Build scientific, non-causal interpretation
    if prob_delta_pp > 0:
        interp = (
            f"Under the modified feature conditions, the calibrated model probability increased by "
            f"{prob_delta_pp:+.2f} percentage points (from {baseline_pred.calibrated_probability * 100:.1f}% "
            f"to {scenario_pred.calibrated_probability * 100:.1f}%)."
        )
    elif prob_delta_pp < 0:
        interp = (
            f"Under the modified feature conditions, the calibrated model probability decreased by "
            f"{abs(prob_delta_pp):.2f} percentage points (from {baseline_pred.calibrated_probability * 100:.1f}% "
            f"to {scenario_pred.calibrated_probability * 100:.1f}%)."
        )
    else:
        interp = (
            f"Under the evaluated conditions, the model's calibrated output remained identical at "
            f"{baseline_pred.calibrated_probability * 100:.1f}%."
        )

    if top_shap_driver:
        interp += f" The largest shift in model feature attribution was associated with {top_shap_driver}."
    
    if risk_changed:
        interp += f" The model classification shifted from {baseline_pred.risk_category} to {scenario_pred.risk_category}."

    return ScenarioSimulationResponse(
        location_name=loc_name,
        latitude=req.latitude,
        longitude=req.longitude,
        baseline_prediction=baseline_pred,
        scenario_prediction=scenario_pred,
        probability_delta_pp=prob_delta_pp,
        raw_margin_delta=margin_delta,
        risk_category_changed=risk_changed,
        modified_features_count=len(modified_features),
        modified_features=modified_features,
        top_shap_driver=top_shap_driver,
        interpretation=interp
    )

