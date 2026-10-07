# Day 13 — Interactive Wildfire Risk Map

## Overview

Day 13 integrates the validated XGBoost machine learning model, Platt Sigmoid probability calibration (Day 12), and local TreeSHAP explainability (Day 11) into an interactive geospatial Leaflet map interface (`RiskMapPage.tsx`).

The platform enables users to:
1. Inspect point-based wildfire hazard predictions dynamically across geographical coordinates.
2. View batch wildfire risk assessments for monitored forest sectors (Bandipur, Nagarhole, Wayanad, Mudumalai).
3. Evaluate Platt-calibrated hazard probabilities alongside raw, uncalibrated model scores.
4. Inspect TreeSHAP feature attributions explaining local model decisions.
5. Distinguish historical satellite active-fire detections (NASA FIRMS observations) from model predictions.

---

## 1. Spatial Prediction Flow

```
Geographic Coordinate (Lat, Lng)
   ↓
Environmental Telemetry Resolution (Open-Meteo Weather API + Sentinel-2 Vegetation Indices)
   ↓
Feature Representation & Data Validation
   ↓
Trained XGBoost Decision Margin Inference (`compute_xgboost_raw_margin`)
   ↓
Platt Sigmoid Probability Calibration (`calibrate_raw_margin`)
   ↓
Validated Risk Classification (`classify_validated_risk`)
   ↓
TreeSHAP Feature Attribution (`explain_prediction_with_shap`)
   ↓
Interactive Leaflet Visualization & Inspection Popup
```

---

## 2. API Endpoints

### 1. Point Spatial Prediction Endpoint
* **Endpoint**: `POST /api/ml/spatial-prediction`
* **Request Schema**: `SpatialPredictionRequest`
  - `latitude`: float (decimal degrees)
  - `longitude`: float (decimal degrees)
  - `location_name`: optional string
  - `environmental_inputs`: optional direct telemetry overrides (`BaselineFeaturesInput`)
* **Response Schema**: `SpatialPredictionResponse`
  - `calibrated_probability`: float [0.0, 1.0] (Platt-calibrated)
  - `raw_model_probability`: float [0.0, 1.0] (Uncalibrated XGBoost probability)
  - `raw_margin`: float (untransformed tree output)
  - `risk_category`: string ("Low", "Moderate", "High", "Very High")
  - `risk_level_code`: string ("LOW", "MODERATE", "HIGH", "EXTREME")
  - `features_used`: `SpatialFeatureTelemetry`
  - `shap_explanation`: `LocalShapExplanationResponse`
  - `is_prediction_available`: boolean
  - `error_message`: optional string
  - `scientific_disclaimer`: string

### 2. Batch Spatial Predictions Endpoint
* **Endpoint**: `POST /api/ml/spatial-predictions-batch`
* **Request Schema**: `SpatialBatchPredictionRequest` (list of `SpatialPredictionRequest` objects)
* **Response Schema**: `SpatialBatchPredictionResponse`

---

## 3. Validated Risk Classification Methodology

The probability thresholding maps Platt-calibrated output $P_{\text{calibrated}}$ to validated risk categories:

| Risk Category | Risk Code | Calibrated Probability Range | Class | Model & Environmental Interpretation |
|---|---|---|---|---|
| **Low** | `LOW` | $P < 0.35$ | 0 | Baseline humidity, high canopy moisture, low ambient heat |
| **Moderate** | `MODERATE` | $0.35 \le P < 0.55$ | 0 | Borderline drying or moderate temperature elevation |
| **High** | `HIGH` | $0.55 \le P < 0.75$ | 1 | Low relative humidity ($<25\%$), elevated wind speed |
| **Very High** | `EXTREME` | $P \ge 0.75$ | 1 | Severe vegetation dryness, high ambient temperature, strong winds |

---

## 4. Layer Distinction: Historical Observations vs. Model Predictions

* **Model-Predicted Risk Layer**:
  - Color-coded circles & badges representing statistical wildfire hazard likelihoods derived from XGBoost inference and Platt calibration.
  - Category colors: Green (Low), Amber (Moderate), Orange (High), Red (Very High).

* **Historical Wildfire / Thermal Anomaly Layer**:
  - Red flame markers representing NASA FIRMS satellite thermal anomaly observations (VIIRS/MODIS).
  - Explicitly labeled as: **`[HISTORICAL WILDFIRE DETECTION — NOT MODEL PREDICTION]`**.
  - Prevents confusing historical thermal anomaly detections with model hazard predictions.

---

## 5. TreeSHAP Attribution Interpretation

For inspected map coordinates, the popup provides local TreeSHAP feature contributions:
* **Positive SHAP (+)**: Feature increased predicted wildfire hazard score (e.g., higher temperature, lower relative humidity).
* **Negative SHAP (-)**: Feature suppressed predicted hazard score (e.g., recent precipitation, high vegetation moisture).
* **Language Safeguard**: Explicitly labeled as **Model Explanation** (*"Higher temperature contributed positively to this model prediction"*), NOT physical causation (*"High temperature caused the wildfire"*).

---

## 6. Spatial Limitations & Missing Data Protection

1. **No Synthetic Extrapolation**: Model predictions are evaluated strictly where meteorological and satellite inputs are available. The system does not invent continuous heatmaps over unmonitored coordinates.
2. **Missing Data Handling**: If telemetry cannot be retrieved for requested coordinates, the system returns `is_prediction_available: false` with a clear message: *"Prediction unavailable — required meteorological telemetry could not be retrieved for these coordinates."* Fake weather or mock predictions are strictly prohibited.
3. **Scientific Guardrails**: The interface displays a scientific disclaimer reminding users that predictions are statistical hazard indicators based on historical satellite training distributions, not operational emergency alerts.
