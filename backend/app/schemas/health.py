from pydantic import BaseModel
from typing import Dict, Any

class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    services: Dict[str, Any]
