# Day 15 — Risk Attention & Decision Support Layer

## Overview

Day 15 implements the **Risk Attention & Decision Support Layer** in ForestFusion (`DecisionSupportPage.tsx`), transforming raw model inference scores into actionable, scientifically guarded decision support for analysts and researchers.

The platform provides:
1. **Risk Attention Notifications**: Highlighting locations with elevated model-predicted hazard probabilities without making operational emergency claims.
2. **Multi-Source Contextual Evidence Matrix**: Consolidating meteorological telemetry, satellite vegetation indices, and historical NASA FIRMS fire hotspots.
3. **TreeSHAP Model Attribution**: Neutral explanations detailing why the model assigned a specific score (*"Low relative humidity increased model margin prediction by +0.38 SHAP units"*).
4. **Analyst Decision-Support Guidance**: Non-operational recommendations (e.g., *"Review sector relative humidity telemetry", "Cross-reference with recent satellite passes"*).
5. **Data Freshness & Provider Provenance**: Explicit timestamps, telemetry sources, and calibration methods.

---

## 1. Risk Attention Concept & Status Methodology

The decision-support engine maps Platt-calibrated hazard probabilities $P_{\text{calibrated}}$ to validated attention statuses:

| Calibrated Probability Range | Validated Risk Category | Attention Status Code | Attention Status Label | Analyst Review Recommendation |
|---|---|---|---|---|
| $P \ge 0.75$ | **Very High** | `HIGH_ATTENTION_CRITICAL_REVIEW` | High Attention / Critical Review Recommended | Immediate review of environmental dryness & satellite telemetry |
| $0.55 \le P < 0.75$ | **High** | `ELEVATED_ATTENTION_RECOMMENDED` | Elevated Attention Recommended | Analyst review of humidity and wind speed telemetry |
| $0.35 \le P < 0.55$ | **Moderate** | `MODERATE_REVIEW` | Moderate Review | Routine monitoring of sector telemetry |
| $P < 0.35$ | **Low** | `NORMAL_MONITORING` | Normal Monitoring | Baseline normal conditions |

---

## 2. Decision Support API Architecture

### 1. Evaluate Location Decision Support
* **Endpoint**: `POST /api/ml/decision-support/evaluate`
* **Request**: `SpatialPredictionRequest` (latitude, longitude, optional feature inputs)
* **Response**: `DecisionSupportSummary`
  - `attention_status_code` & `attention_status_label`
  - `calibrated_probability` & `raw_model_probability`
  - `shap_contributors`: List of TreeSHAP attribution statements
  - `environmental_evidence`: Temperature, Humidity, Wind, Precipitation
  - `vegetation_evidence`: NDVI, NDMI
  - `historical_context`: NASA FIRMS satellite hotspot count (14-day window)
  - `decision_support_recommendations`: List of non-operational analyst steps
  - `data_freshness`: Timestamps, telemetry source, calibration method

### 2. Monitored Sector Attention List
* **Endpoint**: `GET /api/ml/decision-support/attention-list`
* **Response**: `DecisionSupportAttentionListResponse` (List of monitored sector attention items sorted by calibrated probability)

---

## 3. Strict Terminology & Non-Operational Guardrails

To prevent false safety assurances or panic, the interface enforces strict terminology guardrails:

* **Permitted Terminology**:
  - *Elevated model-predicted risk*
  - *Risk attention notification*
  - *Decision-support review recommended*
  - *Statistical wildfire hazard likelihood*

* **Prohibited Terminology**:
  - *Fire imminent / Wildfire guaranteed*
  - *Emergency alert / Dispatch team*
  - *Evacuate / Public warning*

---

## 4. Multi-Source Evidence Matrix

1. **Meteorological Evidence**: Real-time Open-Meteo observations (Air temperature, relative humidity, wind velocity, precipitation).
2. **Satellite Vegetation Evidence**: Copernicus Sentinel-2 L2A spectral indices (NDVI foliage vigor, NDMI canopy moisture).
3. **Historical Satellite Evidence**: NASA FIRMS VIIRS/MODIS radiometer thermal anomaly counts over a 14-day window.
4. **Model Evidence**: Raw XGBoost decision tree margin and Platt Sigmoid probability scaling.

---

## 5. TreeSHAP Attribution Interpretation

The decision support panel presents local TreeSHAP feature contributions:
* **Positive SHAP (+)**: Feature increased predicted wildfire hazard score (e.g., low relative humidity, high temperature).
* **Negative SHAP (-)**: Feature suppressed predicted hazard score (e.g., high canopy moisture, precipitation).
* **Language Safeguard**: Explicitly labeled as **Model Explanation** (*"Feature 'relative_humidity_2m' (22.0%) increased model margin prediction by +0.38 SHAP units"*), NOT physical causation (*"Low humidity caused a fire"*).

---

## 6. Scientific Limitations & Guardrails

1. **Decision Support Prototype**: ForestFusion is an academic research decision-support prototype and does not provide operational emergency dispatch or public warning services.
2. **Prediction vs Confirmation**: Model risk predictions represent statistical hazard probabilities derived from historical satellite training distributions; they are not confirmation of an active wildfire.
3. **Radiometer Pixel Anomalies**: NASA FIRMS satellite fire detections represent radiometer thermal anomalies, not ground-confirmed wildfire perimeters.
4. **Data Freshness Dependency**: Decision-support evaluations depend on the freshness and availability of external telemetry providers.
