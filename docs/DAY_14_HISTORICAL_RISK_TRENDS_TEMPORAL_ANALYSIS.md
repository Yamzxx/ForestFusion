# Day 14 — Historical Risk Trends & Temporal Analysis

## Overview

Day 14 implements **Historical Risk Trends and Temporal Analysis** in ForestFusion, allowing users to analyze how wildfire observations, environmental conditions, and model-backed risk predictions change over time across selectable timeframes.

The platform provides:
1. Daily aggregation of satellite active-fire detections from NASA FIRMS.
2. Multi-variable environmental trend visualization (Air Temperature, Relative Humidity, Wind Speed, Precipitation, NDVI).
3. Daily model-backed wildfire risk inference evaluated by the calibrated XGBoost pipeline across historical observation dates.
4. Statistical correlation analysis (Pearson $r$) between observed environmental parameters and model risk.
5. Clear separation between **Observations** (NASA FIRMS & Open-Meteo) and **Model Predictions** (XGBoost + Platt Calibration).

---

## 1. Temporal Datasets & Resolutions

| Dataset | Provider / Source | Temporal Resolution | Metrics Extracted |
|---|---|---|---|
| **Satellite Thermal Detections** | NASA FIRMS (VIIRS S-NPP / MODIS) | Daily acquisition dates (`acq_date`) | Fire detection count, average brightness (K), max FRP (MW) |
| **Meteorological History** | Open-Meteo Intelligence API | Daily steps | Max temperature (°C), mean RH (%), max wind speed (km/h), precip sum (mm) |
| **Vegetation Indices** | Copernicus Sentinel-2 MSI L2A | Satellite pass dates | NDVI (greenness), NDMI (canopy moisture) |
| **Model Risk Trend** | XGBoost v1.0 + Platt Calibration | Daily model evaluations | Calibrated probability ($0-100\%$), raw margin, risk level, primary SHAP contributor |

---

## 2. API Endpoint Specification

* **Endpoint**: `GET /api/ml/temporal-analysis`
* **Query Parameters**:
  - `days`: int (default `14`, range `1` to `90`)
  - `lat`: float (default `11.6667`)
  - `lng`: float (default `76.6333`)
* **Response Schema**: `TemporalAnalysisResponse`
  - `start_date`: string (YYYY-MM-DD)
  - `end_date`: string (YYYY-MM-DD)
  - `total_days`: int
  - `fire_activity_trend`: List of `FireActivityPoint` objects
  - `environmental_trend`: List of `EnvironmentalTrendPoint` objects
  - `model_risk_trend`: List of `ModelRiskTrendPoint` objects
  - `correlations`: List of `CorrelationMetric` objects (Pearson $r$)
  - `temporal_coverage_notes`: string
  - `scientific_disclaimer`: string

---

## 3. Strict Separation of Observations & Predictions

To maintain scientific integrity, the interface and backend strictly isolate three data types:

1. **Satellite Thermal Observations**:
   - Radiometer thermal anomalies recorded by VIIRS/MODIS sensors.
   - Labeled as: **`[SATELLITE OBSERVATION — NASA FIRMS]`**.
   - Not labeled as confirmed ground wildfires.

2. **Environmental Observations**:
   - Physical weather and satellite reflectance metrics measured by Open-Meteo and Copernicus.
   - Labeled as: **`[ENVIRONMENTAL METRIC]`**.

3. **Model-Predicted Risk**:
   - Statistical hazard probabilities computed by the trained XGBoost model and transformed via Platt Sigmoid calibration.
   - Labeled as: **`[MODEL PREDICTION — CALIBRATED XGBOOST]`**.

---

## 4. Statistical Correlation Methodology (Pearson $r$)

Where aligned daily data exists, the platform evaluates the Pearson correlation coefficient:

$$r = \frac{\sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^n (x_i - \bar{x})^2} \sqrt{\sum_{i=1}^n (y_i - \bar{y})^2}}$$

* **Interpretation Wording**: Neutral statistical co-occurrence (e.g., *"Air temperature and model-predicted risk probability exhibited a positive Pearson correlation coefficient of r = +0.74 over the 14-day period"*).
* **Causation Guardrail**: Explicit disclaimer displayed on every chart: *"Correlation indicates statistical co-occurrence over the selected time window and does not establish physical causation."*

---

## 5. Scientific Limitations & Guardrails

1. **Pixel Resolution Limitations**: Satellite fire detections reflect $375\text{m}$ (VIIRS) or $1\text{km}$ (MODIS) pixel thermal anomalies and are not confirmed ground wildfire perimeters.
2. **Missing Observations**: Absence of a satellite fire detection does not prove that no fire occurred (cloud cover, orbital pass gaps, canopy obstruction).
3. **No Synthetic Extrapolation**: Trends are evaluated strictly for dates supported by actual environmental observations.
4. **Decision Support System**: ForestFusion is a research prototype for decision support, not an operational emergency warning or dispatch system.
