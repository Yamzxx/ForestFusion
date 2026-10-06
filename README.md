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
