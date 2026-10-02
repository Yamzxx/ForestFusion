from fastapi import APIRouter
from app.schemas.health import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def get_health():
    return HealthResponse(
        status="ok",
        app="ForestFusion Wildfire Risk & Health Monitoring Platform",
        version="0.1.0",
        environment="development",
        services={
            "database": "not_connected (deferred to later stage)",
            "ml_model": "not_loaded (deferred to later stage)",
            "satellite_feed": "simulated (demo mode)"
        }
    )
