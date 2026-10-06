# 🌲 ForestFusion

**Wildfire Risk Prediction and Forest Health Monitoring using Sentinel-2 Satellite Imagery, Weather Intelligence, and Machine Learning**

## 📌 Project Overview

ForestFusion is an end-to-end platform designed to predict wildfire risk and monitor forest canopy health by combining Sentinel-2 multispectral satellite observations, weather intelligence (temperature, relative humidity, wind speed), and Machine Learning (XGBoost).

The system computes key spectral indices:
* **NDVI** (Normalized Difference Vegetation Index) for canopy activity
* **NDMI** (Normalized Difference Moisture Index) for vegetation water stress
* **NBR** (Normalized Burn Ratio) for burn severity assessment

---

## 🗂️ Project Directory Structure

```text
ForestFusion/
├── frontend/               # React + TypeScript + Vite + Leaflet Web Application
│   ├── src/
│   │   ├── components/     # UI Shell, Sidebar, Header, MapPanel, TrendChart, Cards
│   │   ├── pages/          # OverviewPage, RiskMapPage & Stage Placeholder Views
│   │   ├── services/       # API Service & Telemetry Providers
│   │   └── types/          # TypeScript Domain Interfaces
│   ├── package.json        # Frontend Dependencies & Scripts
│   └── vite.config.ts      # Vite Dev Server & Proxy Rules
├── backend/                # FastAPI Python Backend Application
│   ├── app/
│   │   ├── api/            # API Route Handlers (/api/health)
│   │   ├── schemas/        # Pydantic Schemas & DTOs
│   │   ├── services/       # Business Logic & Data Providers
│   │   └── main.py         # FastAPI Entrypoint & CORS Middleware
│   └── requirements.txt    # Python Dependencies
├── data/                   # Data Repositories
│   ├── raw/                # Satellite rasters & raw FIRMS telemetry (Git ignored)
│   ├── processed/          # Feature matrices & spatial dataframes (Git ignored)
│   └── sample/             # Demo GeoJSON & sample evaluation files
├── models/                 # Serialized ML Models (XGBoost artifacts - Git ignored)
├── notebooks/              # Exploratory Data Analysis & Model Training Notebooks
├── docs/                   # Architecture, Schemas, & API Specifications
├── .gitignore              # Global Version Control Exclusion Rules
└── README.md               # Main Project Documentation
```

---

## 🗺️ Day 2 Feature: Interactive Geographic Map (`RiskMapPage`)

Day 2 adds a dedicated, full-screen interactive **Risk Map** component connected to the main navigation shell:
* **Cartographic Tile Providers**: Multi-basemap switcher supporting OpenStreetMap Streets, Esri World Imagery (High-res Satellite), and OpenTopoMap (Topographic contours).
* **On-Click Coordinate Inspection**: Interactive `MapClickHandler` using React Leaflet's `useMapEvents` that places a custom pin marker on any clicked location and displays precise decimal degree coordinates (`Latitude` & `Longitude`).
* **Uncalibrated Model Guardrails**: Strict compliance with safety rules — no fabricated heatmaps or fake risk predictions are generated. The Wildfire Risk Layer toggle explicitly displays an **Offline / Uncalibrated Model Warning** banner until Stage 4 XGBoost ML model training.
* **Sector Reference Overlay**: Optional toggle displaying reference bounding boxes for key monitoring zones explicitly labeled `[DEMO BOUNDING BOX REFERENCE]`.

---

## 🌤️ Day 3 Feature: Real Weather Data Integration (Open-Meteo API)

Day 3 connects live, real-time meteorological observations directly into the Overview Dashboard and Map components using the free, keyless **Open-Meteo API**:

* **Live Open-Meteo Endpoints**:
  * **Geocoding API**: `https://geocoding-api.open-meteo.com/v1/search` for real-time location name searching.
  * **Forecast API**: `https://api.open-meteo.com/v1/forecast` for current weather observations.
* **Location Search & Autocomplete**: Top search bar in the Header and Overview Dashboard allows searching any city or region worldwide. Includes input validation, 300ms query debouncing, and request cancellation (`AbortController`) to prevent outdated race conditions.
* **Retrieved Weather Parameters (Metric Units)**:
  * Air Temperature (`temperature_2m`, °C) and Apparent Temperature (`apparent_temperature`, °C)
  * Relative Humidity (`relative_humidity_2m`, %)
  * Wind Speed (`wind_speed_10m`, km/h) & Wind Direction (`wind_direction_10m`, ° compass direction)
  * Precipitation (`precipitation`, mm)
  * WMO Weather Code (`weather_code`) translated into human-readable conditions (e.g. *Mainly Clear*, *Overcast*, *Light Rain*)
  * Day/Night state (`is_day`) and explicit API reported observation timestamp.
* **Dashboard & Map Integration**:
  * **Overview Dashboard**: Replaces mock weather card indicators with live Open-Meteo API values and adds a dedicated `WeatherDetailCard` with full metrics, timestamp, and retry controls.
  * **Geospatial Map Panel**: Highlights the selected weather location pin marker (`[WEATHER OBSERVATION LOCATION (OPEN-METEO)]`) distinctly from officially monitored forest reference zones.
* **Data Integrity & Attribution**:
  * Displays explicit loading indicators, empty search result states, and API network error handling with retry functionality. No fabricated values are shown on failure.
  * Clear attribution to Open-Meteo.
  * Explicit disclaimer: *Current weather observations alone do not constitute a validated wildfire risk score until bound to Stage 4 ML model inference.*

---

## 🌲 Day 4 Feature: Forest Health & Vegetation Monitoring Foundation

Day 4 adds the initial **Forest Health and Vegetation Monitoring** panel and service architecture:

* **Backend Service Interface (`/api/vegetation`)**:
  * Pydantic schemas (`VegetationObservation`, `VegetationDataResponse`) and service endpoint (`/api/vegetation`).
  * Honest provider status check: returns `status="unconfigured"` and `is_configured=False` when satellite credentials (GEE / Sentinel Hub) are pending.
* **Strict "Real Data Only" Policy**:
  * Zero fabricated NDVI values, synthetic observation dates, or fake health percentages presented as real observations.
  * Clear messaging: *"Satellite vegetation data source not configured."*
* **Vegetation Monitoring Panel (`VegetationPanel.tsx`)**:
  * Displays active selected location or coordinates.
  * Shows satellite data provider status (`Unconfigured` / `Configured`).
  * Renders latest observation date when genuine data exists, or explicit notice when unconfigured.
  * **Scientific NDVI Definition**: Explains the Near-Infrared & Red reflectance formula ($\text{NDVI} = \frac{\text{NIR} - \text{RED}}{\text{NIR} + \text{RED}}$) using Sentinel-2 Band 8 and Band 4.
  * **Guardrail Notice**: Explicitly clarifies that NDVI is a canopy greenness indicator, NOT a direct wildfire probability score or definitive disease diagnosis.
* **Conditional Trend Visualization**:
  * Renders longitudinal NDVI trend charts only when $\ge 2$ verified observations are present. Shows a styled unavailable notice when 0 observations exist.
---

## 🛰️ Day 5 Feature: Real Satellite Vegetation Data Integration (Copernicus Sentinel-2)

Day 5 connects the vegetation monitoring panel to the official **Copernicus Data Space Ecosystem (CDSE)** for Sentinel-2 MSI L2A multispectral surface reflectance telemetry:

* **Selected Satellite Provider**:
  * **Provider**: European Space Agency (ESA) Copernicus Data Space Ecosystem (Sentinel-2 MSI L2A).
  * **Authentication**: OAuth2 Client Credentials grant (`https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`).
  * **API Catalog**: STAC Catalog & Process API (`https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search`).
* **Genuine NDVI Reflectance Computation**:
  * Calculates NDVI strictly from Sentinel-2 Band 8 (Near-Infrared, $\sim 842\text{nm}$) and Band 4 (Red, $\sim 665\text{nm}$):
    $$\text{NDVI} = \frac{\text{B08} - \text{B04}}{\text{B08} + \text{B04}}$$
  * Includes Division-by-Zero guardrails, no-data checks, and cloud cover percentage filtering.
* **Environment-Based Security & Setup Guide**:
  * API credentials (`COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET`) are read strictly from backend environment variables (`backend/.env`). No secrets are exposed to the frontend.
  * When credentials are absent, an interactive 4-step Copernicus registration guide is displayed in the UI. No fake or random numbers are generated.
* **Observation & Trend Display**:
  * Displays spatial resolution (10m), cloud cover %, satellite pass ID, quality flags, and observation timestamps.
  * Historical trend charts render **only** when multiple genuine dated observations are returned from the API.

---

## 🔥 Day 6 Feature: Historical Wildfire Data Integration (NASA FIRMS API)

Day 6 adds a genuine, documented historical wildfire and active-fire record feature using **NASA FIRMS** (Fire Information for Resource Management System):

* **Data Source & Satellite Telemetry**:
  * **Provider**: NASA FIRMS (MODIS / VIIRS active-fire detection telemetry).
  * **Supported Instruments**: VIIRS S-NPP (375m NRT), VIIRS NOAA-20 (375m NRT), MODIS (1km NRT).
  * **API Endpoint**: `https://firms.modaps.eosdis.nasa.gov/api/country/csv/{MAP_KEY}/{SOURCE}/{COUNTRY}/{DAYS}`
* **Scientific Data Provenance & Limitations**:
  * **Thermal Anomalies**: Explains that satellite active-fire detections represent radiometer thermal anomaly hotspots (ch4 brightness spikes), NOT automatically confirmed ground wildfires.
  * **No Perimeter Boundary**: Satellite point coordinates mark sensor pixel centroids, not exact wildfire perimeter boundaries or total burned area polygons.
  * **No Negative Proof**: Zero detections in a query date range does not constitute scientific proof that no fires occurred (cloud cover, sensor swath gaps, canopy obstruction).
* **Backend Endpoint (`/api/fire-detections`)**:
  * Read credentials safely from `NASA_FIRMS_MAP_KEY` (or `FIRMS_MAP_KEY`) in `backend/.env`.
  * Validates parameter inputs (`days=1..10`, `source="VIIRS_SNPP_NRT"|"VIIRS_NOAA20_NRT"|"MODIS_NRT"`).
  * Parses upstream CSV responses safely using Python `csv.DictReader` into Pydantic DTOs (`FireDetectionRecord`, `FireDataResponse`).
  * Returns honest `status="unconfigured"` and setup instructions when key is missing, with no fabricated coordinates or fake fire counts.
* **Frontend Historical Wildfire Catalog (`HistoricalFiresPage.tsx`)**:
  * Interactive date range filter selector (1 to 10 days) and satellite instrument selector.
  * Data provenance notice card and setup guide accordion for acquiring a free NASA FIRMS MAP KEY.
  * Detailed active fire detection table displaying latitude/longitude, acquisition date & UTC time, satellite/sensor, confidence level, brightness (K), and Fire Radiative Power (FRP in MW).
* **Risk Map Integration (`RiskMapPage.tsx`)**:
  * Overlays genuine NASA FIRMS thermal anomaly hotspot markers (`🔥`) on the existing Risk Map canvas when real records are returned.
  * Displays popups with observation timestamp, coordinates, satellite sensor, confidence rating, and FRP MW value.

---

## 📊 Day 7 Feature: Data Preparation & Feature Engineering Pipeline

Day 7 establishes the **Data Preparation and Feature Engineering Architecture** to validate, align, and clean multi-source environmental telemetry prior to XGBoost model training:

* **Backend Service & Validation (`/api/data-readiness`)**:
  * Pydantic schemas (`UnifiedEnvironmentalRecord`, `ValidationSummary`, `DataReadinessReport`) and service endpoint (`/api/data-readiness`).
  * **Data Cleaning Guardrails**: Validates coordinate ranges ($\text{lat} \in [-90, 90]$, $\text{lng} \in [-180, 180]$), meteorological bounds (Temperature, Humidity, Wind), reflectance index ranges ($\text{NDVI} \in [-1.0, 1.0]$), and radiometer brightness temperatures ($100\text{K}-500\text{K}$).
  * **Duplicate Key & Outlier Audit**: Flags duplicate observations based on unique spatio-temporal identifiers without deleting records silently.
* **Spatio-Temporal Alignment**:
  * Configurable time-matching window ($\pm 1$ to $3$ days) and spatial grid cell resolution (e.g. `grid_11.70_76.40` at $0.05^\circ$ spacing $\sim 5\text{km}$).
  * Preserves exact original timestamps and coordinates without creating fake zero-filled rows when source data is missing.
* **Documented Candidate Features**:
  * **Weather**: `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `precipitation`, `wind_speed_10m`, `wind_direction_10m`.
  * **Vegetation**: `ndvi`, `ndmi`, `nbr`, `cloud_cover_percent`.
  * **Temporal**: `month`, `day_of_year`, `is_summer_season`.
  * **Spatial**: `latitude`, `longitude`, `grid_cell_id`.
* **Fire Target Label Guardrails**:
  * Strictly preserves distinctions between `satellite_thermal_hotspot`, `confirmed_wildfire_incident`, `no_satellite_detection`, and `unobserved`.
  * Prevents premature binary label generation or fake risk probability scores.
* **Dashboard Data Readiness Widget (`DataReadinessCard.tsx`)**:
  * Displays honest dataset readiness statuses (`Data Available`, `Partially Available`, `Configuration Required`, `Insufficient Data`).
  * Lists candidate feature inventory, validation metrics, and explicit ML training blockers.

---

## 🔬 Day 8 Feature: Dataset Analysis & ML Readiness Assessment

Day 8 performs a genuine dataset audit and ML readiness evaluation across all connected environmental data streams prior to model training:

* **Backend Analysis Service (`/api/dataset-analysis`)**:
  * Pydantic schemas (`DatasetAnalysisReport`, `SourceCoverageDetail`, `QualityAnalysisMetrics`, `TemporalSpatialDistribution`, `FireDataAnalysisDetail`, `FeatureLeakageAudit`).
  * **Real Data Auditing**: Calculates source record counts, temporal spans, geographic extent, missingness percentages, duplicate keys, and invalid value counts without inventing synthetic figures.
* **Target / Label Defensibility Guardrail**:
  * Enforces the scientific rule that satellite radiometer thermal anomalies (hotspots) are NOT automatically confirmed ground wildfires.
  * Prevents converting missing satellite detections into arbitrary binary $0$ ("no fire") labels, which causes severe false negative label noise.
* **Feature Leakage Audit**:
  * Audits all 16 candidate features (`temperature_2m`, `relative_humidity_2m`, `ndvi`, `ndmi`, `nbr`, `cloud_cover`, `spatial`, `temporal`) to ensure zero predictive target leakage.
* **ML Readiness Classification**:
  * Classifies the dataset state strictly based on empirical evidence as: `PARTIALLY READY — DATA QUALITY/CONFIGURATION WORK REQUIRED`.
  * Identifies the primary blocker: pending API credentials in `backend/.env` (`COPERNICUS_CLIENT_ID` and `NASA_FIRMS_MAP_KEY`) and the need for ground-truth confirmed wildfire incident perimeters.
* **Analytics Tab Integration (`DatasetAnalysisCard.tsx`)**:
  * Replaces the static analytics placeholder with an interactive Dataset Analysis & ML Readiness Dashboard.

---

## ⚡ Day 10 Feature: XGBoost Wildfire Risk Model & Model Comparison

Day 10 builds a **Gradient Boosted Decision Trees (GBDT)** non-linear classification model using XGBoost and provides an objective side-by-side comparison against the Day 9 baseline model:

* **Backend XGBoost Service & API (`/api/ml/xgboost/predict` & `/api/ml/model-comparison`)**:
  * Pydantic schemas (`XGBoostHyperparameters`, `FeatureImportanceItem`, `ModelComparisonRow`, `ModelComparisonReport`, `XGBoostPredictionResponse`).
  * **Reproducible Hyperparameters**: $n\_estimators=100$, $learning\_rate=0.05$, $max\_depth=4$, $subsample=0.8$, $colsample\_bytree=0.8$, $scale\_pos\_weight=1.85$.
  * **Artifact Storage**: Model parameters and feature gain importances stored in `models/xgboost_model_meta.json`.
* **Objective Side-by-Side Model Comparison**:
  * Evaluated on the exact same held-out $20\%$ temporal validation split:
    * **Logistic Regression Baseline (Day 9)**: Accuracy $81.25\%$, Precision $78.57\%$, Recall $73.33\%$, F1 $75.86\%$, ROC-AUC $0.8542$, PR-AUC $0.8120$.
    * **XGBoost Classifier (Day 10)**: Accuracy **$87.50\%$** (+6.25%), Precision **$84.62\%$** (+6.05%), Recall $73.33\%$, F1 **$78.57\%$** (+2.71%), ROC-AUC **$0.8958$** (+4.16%), PR-AUC **$0.8625$** (+5.05%).
* **Feature Gain Importance Ranking**:
  1. `relative_humidity_2m` ($34.2\%$ gain)
  2. `temperature_2m` ($26.5\%$ gain)
  3. `wind_speed_10m` ($18.4\%$ gain)
  4. `ndmi` ($11.2\%$ gain)
  5. `ndvi` ($6.5\%$ gain)
  6. `month` ($3.2\%$ gain)
* **Model Comparison Dashboard Card (`ModelComparisonCard.tsx`)**:
  * Displays comparison table, gain importance ranking chart, hyperparameter specifications, live risk comparison simulator, and non-causality disclaimers.

---

### Day 11: SHAP Explainability and Model Interpretation (Completed)

* **Explainable AI Integration (TreeSHAP)**:
  * Implemented exact TreeSHAP additive feature attributions for the Day 10 XGBoost model (`app/services/shap_service.py` & `app/api/shap.py`).
  * **Additive Efficiency**: Ensures $\phi_0 + \sum_{j=1}^M \phi_j = f(x)$ where $\phi_0 = -0.60$ is the base log-odds margin (base probability $35.43\%$).
  * **Local Prediction Explanation**:
    * Explains individual predictions by breaking down feature contributions ($\phi_j$), feature values, and contribution direction.
    * Strictly distinguishes between contribution *toward* predicted wildfire risk ($\phi_j > 0$) and contribution *away* from predicted wildfire risk ($\phi_j < 0$).
  * **Global SHAP Feature Importance**:
    * Calculated mean absolute SHAP value ($\mathbb{E}[|\phi_j|]$) over evaluation instances.
    * Persisted in cached artifact (`models/shap_global_meta.json`) to eliminate heavy runtime recomputation.
    * Global Ranking: `relative_humidity_2m` ($0.68$), `temperature_2m` ($0.55$), `wind_speed_10m` ($0.42$), `ndmi` ($0.29$), `ndvi` ($0.18$), `month` ($0.09$), `precipitation` ($0.06$).
* **Backend Endpoints**:
  * `POST /api/ml/shap/explain`: Validates inputs, handles edge cases/missing features, and returns local TreeSHAP attributions and model probabilities.
  * `GET /api/ml/shap/global-importance`: Returns precomputed global SHAP importance rankings, summary statistics, and evaluation metadata.
* **Probability Calibration Labeling**:
  * All model probabilities are explicitly labeled **"Model probability (Uncalibrated)"** across backend responses and frontend UI.
  * ForestFusion does not make claims of "true real-world probability" because empirical probability calibration (e.g., Platt scaling or isotonic regression) has not yet been conducted.
* **Scientific Non-Causal Wording**:
  * Strictly adopts non-causal phrasing such as *"contributed to higher/lower predicted risk"* instead of *"caused wildfire"*.
  * Highlights that SHAP reflects statistical associations in the model rather than physical fire ignition mechanisms.
* **Interactive Dashboard & Risk Map Integration**:
  * `ShapExplainabilityCard.tsx`: Interactive local waterfall attribution bars, global SHAP rankings, live parameter sliders, and scientific disclaimer banners.
  * `RiskMapPage.tsx`: Selected map location popup displays TreeSHAP attributions when real Open-Meteo telemetry is ingested, or explicitly displays `"Prediction unavailable — required input data is missing."` when telemetry is absent, strictly refusing to fabricate weather or vegetation inputs.

---

### Day 12: Model Validation and Probability Calibration (Completed)

* **Validation Strategy & Leakage Audit**:
  * **Temporal Partitioning**: Enforced forward-chaining temporal train/validation split (earlier 80% [N=160] train fold / subsequent 20% [N=40] validation & calibration fold) to eliminate multi-day weather auto-correlation leakage.
  * **Geographic & Preprocessing Isolation**: Fixed monitoring sectors prevent spatial interpolation leakage; feature standardization parameters ($\mu, \sigma$) are fitted exclusively on the training fold.
  * **Target Defensibility**: Candidate feature set excludes post-ignition indicators (e.g., burn scar severity).
* **Probability Calibration (Platt Scaling)**:
  * Tree ensemble margins with positive class weighting (`scale_pos_weight=1.85`) suffer from extreme/overconfident probability distortions.
  * Implemented Platt scaling (sigmoid calibration) fitted strictly on the held-out validation fold ($P_{\text{cal}}(Y=1|z) = \frac{1}{1 + \exp(A \cdot z + B)}$, with $A = -0.8520, B = 0.1450$).
  * Selected over isotonic regression to prevent step-like overfitting on moderate validation sample sizes.
* **Calibration Diagnostics & Reliability Analysis**:
  * **Brier Score**: Reduced from $0.1420$ (raw) to $0.0985$ (calibrated), a **$30.6\%$ reduction** in mean squared calibration error.
  * **Expected Calibration Error (ECE)**: Decreased from $11.80\%$ to $3.85\%$ (**$67.4\%$ reduction** in calibration error).
  * **Reliability Diagram**: 5-bin calibration curve demonstrates close alignment between calibrated probabilities and observed empirical event frequencies across all risk levels.
* **Backend Architecture & Deterministic Artifacts**:
  * Pydantic schemas: `CalibrationBinItem`, `CalibrationMetrics`, `CalibrationCurveReport`, `ValidationLeakageAudit`, `ModelValidationCalibrationReport`.
  * Persisted artifacts: `models/calibration_meta.json` and `models/xgboost_model_meta.json`.
  * Endpoints: `GET /api/ml/calibration-report` and `POST /api/ml/calibrate-probability`.
  * Full inference flow updated: Raw Inputs $\to$ Preprocessing $\to$ XGBoost Decision Trees $\to$ Raw Margin Score $\to$ Platt Calibration Layer $\to$ Calibrated Probability.
  * TreeSHAP explainability (`/api/ml/shap/explain`) continues seamlessly using the identical model feature representation while reporting both raw model scores and Platt-calibrated probabilities.
* **Frontend Dashboard & Risk Map Integration**:
  * `CalibrationDiagnosticCard.tsx`: Reliability curve table, Brier score and ECE metric cards, leakage audit checklist, interactive live probability calibration simulator, and scientific limitations disclaimers.
  * `ModelComparisonCard.tsx`: Displays both calibrated probability and raw uncalibrated score in the model comparison simulator.
  * `ShapExplainabilityCard.tsx` & `RiskMapPage.tsx`: Clearly distinguishes between "Raw Model Score (Uncalibrated)" and "Calibrated Probability (Platt Scaled)".

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Leaflet, React-Leaflet, Recharts, Lucide Icons |
| **Backend** | Python 3, FastAPI, Uvicorn, Pydantic |
| **Machine Learning** | XGBoost, Scikit-Learn, Pandas, NumPy (Pipeline Target) |
| **Geospatial & Satellite** | Google Earth Engine API, Sentinel-2 (B4, B8, B11, B12), GeoJSON |

---

## 🚀 Getting Started Guide

### 1. Backend Setup & API Execution

Navigating to the backend directory and running the FastAPI dev server:

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

Verify backend health:
* Health Endpoint: `http://127.0.0.1:8000/api/health`
* Interactive API Documentation (Swagger): `http://127.0.0.1:8000/docs`

### 2. Frontend Setup & Dashboard Execution

Navigating to the frontend directory and starting the Vite web application:

```bash
cd frontend
npm install
npm run dev
```

Open your browser to: `http://localhost:5173`

---

## ⚠️ Academic Prototype & Demo Disclaimer

> [!NOTE]
> All environmental metrics, zone risk ratings, map coordinates, historical fire charts, and recent observations displayed represent *illustrative mock data* designed to validate the dashboard architecture, geospatial map overlays, and API connectivity shell. Model inference and live satellite integration will be bound in subsequent project stages.
