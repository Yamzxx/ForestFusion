from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router

app = FastAPI(
    title="ForestFusion API",
    description="Wildfire Risk Prediction and Forest Health Monitoring Platform API",
    version="0.1.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router, prefix="/api", tags=["Health"])

@app.get("/")
async def root():
    return {
        "name": "ForestFusion API",
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }
