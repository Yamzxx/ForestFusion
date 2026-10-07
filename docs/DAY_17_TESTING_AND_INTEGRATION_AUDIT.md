# Day 17 — Full System Testing & Scientific Integrity Audit

## Overview

Day 17 completes a comprehensive **System Testing, Architecture Audit, and Scientific Integrity Inspection** for **ForestFusion**. 

This audit verifies that:
1. The end-to-end platform functions reliably across all backend API endpoints and frontend views.
2. Predictions, probabilities, explanations, and risk attention statuses derive from a single canonical machine learning pipeline.
3. No synthetic data, uncalibrated probabilities, or fabricated observations are substituted for missing telemetry.
4. Satellite thermal anomaly observations are strictly distinguished from model hazard predictions.
5. All non-operational guardrails and scientific disclaimers are enforced.

---

## 1. System Architecture Audit

### A. Backend Router Audit

| Endpoint Route | HTTP Method | Service Handler | Audit Status |
|---|---|---|---|
| `/api/health` | `GET` | `app.api.health` | Verified (Health check & environment status) |
| `/api/vegetation` | `GET` | `app.api.vegetation` | Verified (Copernicus Sentinel-2 telemetry) |
| `/api/fire-detections` | `GET` | `app.api.fire` | Verified (NASA FIRMS active-fire satellite telemetry) |
| `/api/data-readiness` | `GET` | `app.api.data_prep` | Verified (Data preparation & readiness audit) |
| `/api/dataset-analysis` | `GET` | `app.api.dataset_analysis` | Verified (Dataset coverage, missingness & target audit) |
| `/api/ml/predict` | `POST` | `app.api.ml` | Verified (Day 9 Baseline Logistic Regression inference) |
| `/api/ml/baseline-evaluation` | `GET` | `app.api.ml` | Verified (Day 9 Baseline model evaluation report) |
| `/api/ml/xgboost/predict` | `POST` | `app.api.xgboost` | Verified (Day 10 XGBoost Classifier inference) |
| `/api/ml/model-comparison` | `GET` | `app.api.xgboost` | Verified (Day 10 Baseline vs XGBoost comparison report) |
| `/api/ml/shap/explain` | `POST` | `app.api.shap` | Verified (Day 11 TreeSHAP local attribution) |
| `/api/ml/shap/global-importance` | `GET` | `app.api.shap` | Verified (Day 11 TreeSHAP global feature importance) |
| `/api/ml/calibration-report` | `GET` | `app.api.calibration` | Verified (Day 12 Platt Sigmoid calibration report) |
| `/api/ml/calibrate-probability` | `POST` | `app.api.calibration` | Verified (Day 12 Platt probability transformation) |
| `/api/ml/spatial-prediction` | `POST` | `app.api.spatial` | Verified (Day 13 Point-based spatial risk prediction) |
| `/api/ml/spatial-predictions-batch` | `POST` | `app.api.spatial` | Verified (Day 13 Sector batch risk predictions) |
| `/api/ml/temporal-analysis` | `GET` | `app.api.temporal_analysis` | Verified (Day 14 Historical trends & Pearson $r$) |
| `/api/ml/decision-support/evaluate` | `POST` | `app.api.decision_support` | Verified (Day 15 Location decision support summary) |
| `/api/ml/decision-support/attention-list` | `GET` | `app.api.decision_support` | Verified (Day 15 Monitored sector risk attention list) |

---

## 2. Canonical Prediction Pipeline Audit

All prediction endpoints (`/api/ml/spatial-prediction`, `/api/ml/spatial-predictions-batch`, `/api/ml/temporal-analysis`, `/api/ml/decision-support/evaluate`) consume one canonical backend prediction pipeline:

$$\text{Inputs} \xrightarrow{\text{Pydantic Validation}} \text{XGBoost Margin} \xrightarrow{\text{Platt Sigmoid Scaling}} P_{\text{calibrated}} \xrightarrow{\text{Risk Classification}} \text{TreeSHAP Attribution}$$

* **Service Module**: `backend/app/services/spatial_prediction_service.py` (`predict_spatial_wildfire_risk`)
* **Single Source of Truth**: Probability calculations, margin transformations, and risk categories are computed exclusively by the backend model service. Frontend components do not recalculate model probabilities.

---

## 3. Scientific Integrity Audit Findings

### A. Data Authenticity & Missing Data Protection
* **Real Telemetry Stream**: Integrated live Open-Meteo weather intelligence, Copernicus Sentinel-2 STAC catalog, and NASA FIRMS active-fire satellite telemetry.
* **Missing Telemetry Guardrail**: When environmental inputs cannot be fetched for requested coordinates, the system returns `is_prediction_available: false` with the explicit message:
  > *Prediction unavailable — required meteorological telemetry could not be retrieved for these coordinates.*
* **Zero Synthetic Extrapolation**: The platform strictly refuses to invent fake weather or mock probabilities to populate unmonitored locations.

### B. Labeling & Provenance Safeguards
* **Satellite Hotspot vs. Ground Wildfire**: NASA FIRMS fire detections are explicitly labeled: **`[HISTORICAL WILDFIRE DETECTION — NOT MODEL PREDICTION]`**.
* **Radiometer Pixel Anomalies**: Clear documentation and UI notices clarify that satellite active-fire detections represent radiometer thermal anomalies ($375\text{m}$ / $1\text{km}$ resolution), NOT confirmed ground wildfires.

### C. Model Calibration & Explainability
* **Platt Sigmoid Scaling**: Raw XGBoost decision tree margins are scaled using fitted Platt parameters ($A = -1.15, B = 0.05$), ensuring reported probabilities ($0-100\%$) reflect empirical hazard frequencies.
* **TreeSHAP Attribution**: Local TreeSHAP contributions explain feature influence on decision margins (*"Feature 'relative_humidity_2m' (22.0%) increased model margin prediction by +0.38 SHAP units"*). Physical causality claims are strictly prohibited.

### D. Non-Operational Decision Support Guardrails
* **Approved Language**: *"Elevated model-predicted risk"*, *"Risk attention notification"*, *"Analyst review recommended"*, *"Statistical wildfire hazard likelihood"*.
* **Prohibited Language**: *"Fire guaranteed"*, *"Emergency alert"*, *"Dispatch firefighters"*, *"Evacuate"*.

---

## 4. Resilience & Edge Case Audit

1. **Relative Path Uniformity**: All frontend API service modules now fetch endpoints via relative `/api/...` paths, eliminating hardcoded hostnames and ensuring compatibility with Vite proxying.
2. **Zero Division Safeguard**: `calculate_pearson_r` in `temporal_analysis_service.py` checks for zero variance ($\text{den} = 0.0$), returning `0.0` safely.
3. **Coordinate Bounds Check**: Pydantic models validate latitude ($[-90, 90]$) and longitude ($[-180, 180]$) decimal degrees.
4. **Fault Isolation**: Offline or unconfigured external services (e.g. pending NASA FIRMS API key) return structured status reports (`is_configured: false`) without crashing other dashboard modules.

---

## 5. End-to-End Test & Verification Checklist

To execute a complete system verification:

1. **Backend Health Check**:
   - Request `GET /` and `GET /api/health`. Verify `status: "online"` and router endpoints.
2. **Location Search & State Synchronization**:
   - In the frontend header search bar, enter `Bandipur`, `Wayanad`, or `Nagarhole`.
   - Verify that weather telemetry, vegetation metrics, spatial predictions, and decision-support panels update across tabs.
3. **Interactive Spatial Map (`/risk-map`)**:
   - Toggle basemaps (Streets, Satellite, Topographic).
   - Toggle layer visibility (Model Risk Predictions, Sector Boundaries, FIRMS Hotspots).
   - Click any coordinate on the map. Verify that the inspection popup renders **Calibrated Probability**, **Raw Model Score**, **Environmental Context**, **TreeSHAP Attribution**, and **Scientific Disclaimer**.
4. **Historical Risk Trends & Temporal Analysis (`/historical-fires`)**:
   - Toggle between **Temporal Analysis** and **FIRMS Detections Log**.
   - Select analysis windows ($7$, $14$, $30$, $60$ days). Verify that daily satellite fire count bar charts, environmental metric cards, model risk tables, and Pearson correlation coefficients ($r$) load correctly.
5. **Risk Attention & Decision Support (`/alerts`)**:
   - Inspect the **Monitored Sector Risk Attention List**.
   - Filter by risk level (Very High, High, Moderate, Low).
   - Select a sector and verify the **Risk Attention Summary Banner**, **Model Inference Metrics**, **TreeSHAP Attributions**, **Multi-Source Evidence Matrix**, **Analyst Recommendations**, and **Data Freshness Banner**.
6. **Model Comparison & Calibration (`/` Overview Page)**:
   - Verify that Baseline Logistic Regression vs XGBoost Classifier comparison metrics ($81.25\%$ vs $87.50\%$ accuracy, $0.7586$ vs $0.7857$ F1-score) and Platt Sigmoid calibration diagnostic charts render properly.
