from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.vegetation import router as vegetation_router
from app.api.fire import router as fire_router
from app.api.data_prep import router as data_prep_router
from app.api.dataset_analysis import router as dataset_analysis_router
from app.api.ml import router as ml_router

app = FastAPI(
    title="ForestFusion API",
    description="Wildfire Risk Prediction and Forest Health Monitoring Platform API",
    version="0.1.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(vegetation_router, prefix="/api", tags=["Vegetation"])
app.include_router(fire_router, prefix="/api", tags=["FireDetections"])
app.include_router(data_prep_router, prefix="/api", tags=["DataPreparation"])
app.include_router(dataset_analysis_router, prefix="/api", tags=["DatasetAnalysis"])
app.include_router(ml_router, prefix="/api", tags=["MachineLearning"])

@app.get("/")
async def root():
    return {
        "name": "ForestFusion API",
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "vegetation_check": "/api/vegetation",
        "fire_detections_check": "/api/fire-detections",
        "data_readiness_check": "/api/data-readiness",
        "dataset_analysis_check": "/api/dataset-analysis",
        "ml_baseline_predict": "/api/ml/predict",
        "ml_baseline_evaluation": "/api/ml/baseline-evaluation"
    }


