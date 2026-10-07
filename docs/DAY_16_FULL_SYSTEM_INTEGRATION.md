# Day 16 — Full System Integration

## Overview

Day 16 integrates all components developed in Days 1–15 into a single, cohesive, end-to-end scientific platform for **Wildfire Risk Prediction and Forest Health Monitoring** (`ForestFusion`).

The integrated system unifies:
1. **Real Data Telemetry**: Live Open-Meteo weather intelligence, Copernicus Sentinel-2 vegetation telemetry, and NASA FIRMS satellite active-fire thermal anomaly records.
2. **Canonical Prediction Pipeline**: Single authoritative model inference flow (XGBoost Classifier + Platt Sigmoid Probability Calibration).
3. **Explainability & Attribution**: Local TreeSHAP feature attribution explaining model decision margins.
4. **Interactive Spatial Map**: Multi-basemap Leaflet interface with point-based risk inspection and satellite fire layer separation.
5. **Temporal Risk Analysis**: Multi-variable historical trends, daily fire activity counts, and Pearson statistical correlation ($r$).
6. **Risk Attention & Decision Support**: Risk attention notifications, multi-source evidence matrices, analyst recommendations, and data freshness tracking.

---

## 1. End-to-End Architecture Overview

```
User Location Selection / Search (Header / Map / Coordinates)
  │
  ├──► Live Open-Meteo Weather Service ──► Temperature, Humidity, Wind, Precip
  ├──► Copernicus Sentinel-2 Telemetry ──► NDVI, NDMI Canopy Vigor & Moisture
  └──► NASA FIRMS Satellite Telemetry ──► Active Fire Thermal Anomaly Hotspots
  │
  ▼
Canonical Prediction Pipeline (`predict_spatial_wildfire_risk`)
  ├── 1. Feature Validation & Grid Coordinate Mapping
  ├── 2. Trained XGBoost Decision Tree Margin Inference
  ├── 3. Platt Sigmoid Probability Calibration ($P_{\text{calibrated}}$)
  ├── 4. Validated Risk Classification (Low, Moderate, High, Very High)
  └── 5. Local TreeSHAP Feature Attribution
  │
  ▼
Unified Interface Consumption
  ├──► Overview Page (System Health, Weather Detail, ML Comparison, Calibration Report, SHAP)
  ├──► Interactive Risk Map (Leaflet Point Inspector, Sector Circles, FIRMS Layer)
  ├──► Forest Health Page (Sentinel-2 NDVI/NDMI Vegetation Degradation)
  ├──► Historical Fires & Temporal Analysis (Daily Trends, Pearson Correlation r)
  └──► Risk Attention & Decision Support (Sector Attention List, Evidence Matrix, Guidance)
```

---

## 2. One Canonical Prediction Pipeline

To ensure absolute consistency across all pages and API endpoints, a single authoritative backend pipeline executes all model inferences:

* **Service Module**: `backend/app/services/spatial_prediction_service.py`
* **Inference Sequence**:
  $$\text{Inputs} \rightarrow \text{Validation} \rightarrow \text{XGBoost Margin} \rightarrow \text{Platt Scaling} \rightarrow \text{Risk Class} \rightarrow \text{TreeSHAP Attribution}$$
* **Consuming Endpoints**:
  - `POST /api/ml/spatial-prediction`
  - `POST /api/ml/spatial-predictions-batch`
  - `GET /api/ml/temporal-analysis`
  - `POST /api/ml/decision-support/evaluate`
  - `GET /api/ml/decision-support/attention-list`

No page or frontend module recalculates probabilities or risk categories independently.

---

## 3. Shared Location Context & User Journey

* **State Management**: The top-level application state (`App.tsx`) maintains a single `selectedLocation` object (`GeocodingLocation`).
* **Cross-Page Synchronization**:
  - Selecting a location in the header search bar updates the active location across Overview, Risk Map, Forest Health, Temporal Analysis, and Decision Support pages.
  - Clicking any point on the Leaflet map allows setting the inspected coordinate as the active weather & model location.

---

## 4. Data Transparency & Category Isolation

The system enforces strict visual and conceptual isolation between data types:

1. **Satellite Thermal Detections**: Radiometer thermal anomalies from NASA FIRMS (`[HISTORICAL WILDFIRE DETECTION — NOT MODEL PREDICTION]`).
2. **Environmental Observations**: Observed weather from Open-Meteo and vegetation indices from Sentinel-2 (`[ENVIRONMENTAL METRIC]`).
3. **Model Predictions**: Calibrated XGBoost hazard probabilities (`[MODEL PREDICTION — CALIBRATED XGBOOST]`).

---

## 5. Scientific Integrity Safeguards

1. **Real Data Only**: No fake weather, fake wildfire detections, or synthetic predictions are manufactured.
2. **Missing Data Protection**: If environmental telemetry cannot be retrieved, the pipeline returns a clear error (`is_prediction_available: false`).
3. **Non-Operational Language**: Enforces decision-support terminology (*"Elevated model-predicted risk"*, *"Analyst review recommended"*) and explicitly prohibits operational alert claims (*"Fire imminent"*, *"Emergency dispatch"*).
4. **Correlation vs Causation**: Displays explicit scientific disclaimers on all statistical correlation charts (*"Correlation indicates statistical co-occurrence over the selected time window and does not establish physical causation"*).
