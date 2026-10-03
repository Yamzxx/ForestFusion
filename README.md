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
