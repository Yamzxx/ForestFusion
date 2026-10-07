from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.vegetation import router as vegetation_router
from app.api.fire import router as fire_router
from app.api.data_prep import router as data_prep_router
from app.api.dataset_analysis import router as dataset_analysis_router
from app.api.ml import router as ml_router
from app.api.xgboost import router as xgboost_router
from app.api.shap import router as shap_router
from app.api.calibration import router as calibration_router
from app.api.spatial import router as spatial_router
from app.api.temporal_analysis import router as temporal_analysis_router
from app.api.decision_support import router as decision_support_router

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
app.include_router(xgboost_router, prefix="/api", tags=["XGBoostMachineLearning"])
app.include_router(shap_router, prefix="/api", tags=["SHAPExplainability"])
app.include_router(calibration_router, prefix="/api", tags=["ModelValidationAndCalibration"])
app.include_router(spatial_router, prefix="/api", tags=["SpatialPrediction"])
app.include_router(temporal_analysis_router, prefix="/api", tags=["TemporalAnalysis"])
app.include_router(decision_support_router, prefix="/api", tags=["DecisionSupport"])

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
        "ml_baseline_evaluation": "/api/ml/baseline-evaluation",
        "ml_xgboost_predict": "/api/ml/xgboost/predict",
        "ml_model_comparison": "/api/ml/model-comparison",
        "ml_shap_explain": "/api/ml/shap/explain",
        "ml_shap_global_importance": "/api/ml/shap/global-importance",
        "ml_calibration_report": "/api/ml/calibration-report",
        "ml_calibrate_probability": "/api/ml/calibrate-probability",
        "ml_spatial_prediction": "/api/ml/spatial-prediction",
        "ml_spatial_predictions_batch": "/api/ml/spatial-predictions-batch",
        "ml_temporal_analysis": "/api/ml/temporal-analysis",
        "ml_decision_support_evaluate": "/api/ml/decision-support/evaluate",
        "ml_decision_support_attention_list": "/api/ml/decision-support/attention-list"
    }


