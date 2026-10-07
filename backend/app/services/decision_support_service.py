from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.schemas.spatial_prediction import SpatialPredictionRequest
from app.schemas.decision_support import (
    ShapContributorDetail,
    DecisionSupportSummary,
    DecisionSupportAttentionItem,
    DecisionSupportAttentionListResponse
)
from app.services.spatial_prediction_service import predict_spatial_wildfire_risk, predict_spatial_batch
from app.services.fire_service import get_fire_detections

MONITORED_DECISION_SECTORS: List[SpatialPredictionRequest] = [
    SpatialPredictionRequest(
        latitude=11.664,
        longitude=76.627,
        location_name="Bandipur Core Forest Sector A",
        environmental_inputs={
            "temperature_2m": 34.2,
            "relative_humidity_2m": 22.0,
            "wind_speed_10m": 21.0,
            "precipitation": 0.0,
            "ndvi": 0.42,
            "ndmi": -0.15,
            "month": 4
        }
    ),
    SpatialPredictionRequest(
        latitude=11.986,
        longitude=76.124,
        location_name="Nagarhole Southern Reserve",
        environmental_inputs={
            "temperature_2m": 31.0,
            "relative_humidity_2m": 32.0,
            "wind_speed_10m": 14.0,
            "precipitation": 0.0,
            "ndvi": 0.61,
            "ndmi": 0.08,
            "month": 4
        }
    ),
    SpatialPredictionRequest(
        latitude=11.685,
        longitude=76.132,
        location_name="Wayanad High Altitude Range",
        environmental_inputs={
            "temperature_2m": 26.5,
            "relative_humidity_2m": 58.0,
            "wind_speed_10m": 9.0,
            "precipitation": 1.2,
            "ndvi": 0.78,
            "ndmi": 0.31,
            "month": 4
        }
    ),
    SpatialPredictionRequest(
        latitude=11.562,
        longitude=76.534,
        location_name="Mudumalai Buffer Perimeter",
        environmental_inputs={
            "temperature_2m": 33.8,
            "relative_humidity_2m": 25.0,
            "wind_speed_10m": 19.0,
            "precipitation": 0.0,
            "ndvi": 0.49,
            "ndmi": -0.05,
            "month": 4
        }
    )
]

def determine_attention_status(calibrated_prob: float, risk_category: str) -> tuple[str, str, str]:
    """
    Map Platt-calibrated probability to decision-support attention status:
    - P >= 0.75: HIGH_ATTENTION_CRITICAL_REVIEW
    - 0.55 <= P < 0.75: ELEVATED_ATTENTION_RECOMMENDED
    - 0.35 <= P < 0.55: MODERATE_REVIEW
    - P < 0.35: NORMAL_MONITORING
    """
    if calibrated_prob >= 0.75:
        return (
            "HIGH_ATTENTION_CRITICAL_REVIEW",
            "High Attention / Critical Review Recommended",
            f"Calibrated wildfire hazard probability is {calibrated_prob*100:.1f}% ({risk_category} Risk). High attention and review recommended."
        )
    elif calibrated_prob >= 0.55:
        return (
            "ELEVATED_ATTENTION_RECOMMENDED",
            "Elevated Attention Recommended",
            f"Calibrated wildfire hazard probability is {calibrated_prob*100:.1f}% ({risk_category} Risk). Analyst review recommended."
        )
    elif calibrated_prob >= 0.35:
        return (
            "MODERATE_REVIEW",
            "Moderate Review",
            f"Calibrated wildfire hazard probability is {calibrated_prob*100:.1f}% ({risk_category} Risk). Standard routine monitoring."
        )
    else:
        return (
            "NORMAL_MONITORING",
            "Normal Monitoring",
            f"Calibrated wildfire hazard probability is {calibrated_prob*100:.1f}% ({risk_category} Risk). Baseline normal conditions."
        )

def evaluate_decision_support(req: SpatialPredictionRequest) -> DecisionSupportSummary:
    """
    Generate Decision Support Summary for a requested geographic location.
    Consumes validated XGBoost prediction, Platt calibration, TreeSHAP explanation,
    environmental context, and historical FIRMS detections.
    """
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # 1. Run Spatial Risk Prediction
    sp_resp = predict_spatial_wildfire_risk(req)

    if not sp_resp.is_prediction_available:
        return DecisionSupportSummary(
            location_name=req.location_name or f"Point ({req.latitude:.3f}°, {req.longitude:.3f}°)",
            latitude=req.latitude,
            longitude=req.longitude,
            prediction_timestamp=now_iso,
            model_name_version="XGBoost v1.0 (Calibrated)",
            predicted_class=0,
            calibrated_probability=0.0,
            raw_model_probability=0.0,
            risk_category="Unavailable",
            attention_status_code="UNAVAILABLE",
            attention_status_label="Data Unavailable",
            attention_highlight_reason=sp_resp.error_message or "Required meteorological telemetry missing.",
            shap_contributors=[],
            environmental_evidence={},
            vegetation_evidence={},
            historical_context={},
            decision_support_recommendations=["Unable to provide decision support due to missing environmental data."],
            data_freshness={"prediction_timestamp": now_iso, "status": "Telemetry Missing"},
            is_available=False,
            error_message=sp_resp.error_message
        )

    # 2. Determine Attention Status
    att_code, att_label, att_reason = determine_attention_status(
        sp_resp.calibrated_probability, sp_resp.risk_category
    )

    # 3. Format SHAP Contributors
    shap_details: List[ShapContributorDetail] = []
    if sp_resp.shap_explanation and sp_resp.shap_explanation.top_contributors:
        for contrib in sp_resp.shap_explanation.top_contributors:
            direction = "INCREASED_RISK" if contrib.shap_value >= 0 else "DECREASED_RISK"
            action_word = "increased" if contrib.shap_value >= 0 else "decreased"
            stmt = f"Feature '{contrib.feature}' (value: {contrib.feature_value}) {action_word} model margin prediction by {abs(contrib.shap_value):.3f} SHAP units."
            shap_details.append(ShapContributorDetail(
                feature=contrib.feature,
                shap_value=contrib.shap_value,
                feature_value=contrib.feature_value,
                direction=direction,
                explanatory_statement=stmt
            ))

    # 4. Fetch Historical Satellite Context
    firms_resp = get_fire_detections(days=14, source="VIIRS_SNPP_NRT", country="IND")
    firms_count = len(firms_resp.detections) if firms_resp.detections else 0

    # 5. Non-Operational Decision-Support Recommendations
    recs = [
        f"Review sector relative humidity ({sp_resp.features_used.relative_humidity_2m}%) and wind speed ({sp_resp.features_used.wind_speed_10m} km/h) telemetry.",
        f"Inspect recent Copernicus Sentinel-2 canopy vigor (NDVI: {sp_resp.features_used.ndvi}) and moisture index.",
        f"Cross-reference with NASA FIRMS active-fire satellite detections ({firms_count} hotspots detected in regional swath past 14 days).",
        "Continue monitoring sector telemetry if elevated model hazard score persists."
    ]

    return DecisionSupportSummary(
        location_name=sp_resp.location_name,
        latitude=sp_resp.latitude,
        longitude=sp_resp.longitude,
        prediction_timestamp=now_iso,
        model_name_version=sp_resp.model_version,
        predicted_class=sp_resp.prediction_class,
        calibrated_probability=sp_resp.calibrated_probability,
        raw_model_probability=sp_resp.raw_model_probability,
        risk_category=sp_resp.risk_category,
        attention_status_code=att_code,
        attention_status_label=att_label,
        attention_highlight_reason=att_reason,
        shap_contributors=shap_details,
        environmental_evidence={
            "temperature_2m": f"{sp_resp.features_used.temperature_2m} °C",
            "relative_humidity_2m": f"{sp_resp.features_used.relative_humidity_2m} %",
            "wind_speed_10m": f"{sp_resp.features_used.wind_speed_10m} km/h",
            "precipitation": f"{sp_resp.features_used.precipitation} mm"
        },
        vegetation_evidence={
            "ndvi": sp_resp.features_used.ndvi,
            "ndmi": sp_resp.features_used.ndmi,
            "foliage_status": "Normal Canopy Density"
        },
        historical_context={
            "regional_firms_hotspots_14d": firms_count,
            "firms_provider": "NASA FIRMS (EOSDIS VIIRS/MODIS)",
            "historical_note": "Satellite thermal anomaly detections mark radiometer pixel hotspots, not confirmed ground wildfires."
        },
        decision_support_recommendations=recs,
        data_freshness={
            "prediction_timestamp": now_iso,
            "telemetry_source": sp_resp.features_used.telemetry_source,
            "calibration_method": sp_resp.calibration_method
        },
        is_available=True,
        error_message=None
    )

def get_attention_list() -> DecisionSupportAttentionListResponse:
    """
    Evaluate decision-support attention items across monitored forest sectors.
    """
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    items: List[DecisionSupportAttentionItem] = []
    elevated_count = 0

    for sector in MONITORED_DECISION_SECTORS:
        summary = evaluate_decision_support(sector)
        if summary.is_available:
            if summary.calibrated_probability >= 0.55:
                elevated_count += 1

            top_feat = summary.shap_contributors[0].feature if summary.shap_contributors else "Relative Humidity"
            items.append(DecisionSupportAttentionItem(
                location_name=summary.location_name,
                latitude=summary.latitude,
                longitude=summary.longitude,
                risk_category=summary.risk_category,
                calibrated_probability=summary.calibrated_probability,
                attention_status_code=summary.attention_status_code,
                attention_status_label=summary.attention_status_label,
                primary_shap_contributor=top_feat,
                prediction_timestamp=summary.prediction_timestamp,
                telemetry_source=summary.data_freshness.get("telemetry_source", "Open-Meteo")
            ))

    items.sort(key=lambda x: x.calibrated_probability, reverse=True)

    return DecisionSupportAttentionListResponse(
        total_locations=len(items),
        elevated_attention_count=elevated_count,
        attention_items=items,
        data_freshness_notes=f"Evaluated across {len(items)} monitored forest sectors at {now_iso}."
    )
