import os
import json
import csv
import io
import urllib.request
import urllib.parse
from datetime import datetime
from typing import Optional, List
from app.schemas.fire import FireDataResponse, FireDetectionRecord

FIRMS_API_BASE = "https://firms.modaps.eosdis.nasa.gov/api"
FIRMS_SETUP_INSTRUCTIONS = [
    "1. Request a free NASA FIRMS API Map Key at https://firms.modaps.eosdis.nasa.gov/api/map_key.",
    "2. Check your email for your unique NASA FIRMS MAP_KEY.",
    "3. Set environment variable NASA_FIRMS_MAP_KEY='your_map_key' in backend environment or .env file.",
    "4. Restart the FastAPI backend server (cd backend && python -m uvicorn app.main:app --reload --port 8000)."
]

def fetch_firms_detections_from_api(
    map_key: str,
    source: str = "VIIRS_SNPP_NRT",
    days: int = 7,
    country: str = "IND"
) -> List[FireDetectionRecord]:
    """
    Fetch genuine satellite active-fire detections from NASA FIRMS API.
    Parses returned CSV data into FireDetectionRecord objects.
    """
    url = f"{FIRMS_API_BASE}/country/csv/{map_key}/{source}/{country}/{days}"
    records: List[FireDetectionRecord] = []

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "ForestFusion-Wildfire-Platform/1.0"},
            method="GET"
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status == 200:
                csv_text = response.read().decode("utf-8")
                # Parse CSV response
                reader = csv.DictReader(io.StringIO(csv_text))
                for i, row in enumerate(reader):
                    try:
                        lat = float(row.get("latitude", 0.0))
                        lng = float(row.get("longitude", 0.0))
                        brightness = float(row.get("bright_ti4", row.get("brightness", 0.0)))
                        bright_t31 = float(row.get("bright_ti5", row.get("bright_t31", 0.0))) if row.get("bright_ti5") or row.get("bright_t31") else None
                        frp_val = float(row.get("frp", 0.0)) if row.get("frp") else None

                        conf_raw = row.get("confidence", "nominal")
                        sat_raw = row.get("satellite", "VIIRS S-NPP")
                        inst_raw = row.get("instrument", "VIIRS")

                        record_id = f"firms-{source.lower()}-{row.get('acq_date', 'date')}-{i+1}"

                        records.append(FireDetectionRecord(
                            id=record_id,
                            latitude=lat,
                            longitude=lng,
                            brightness=round(brightness, 1),
                            bright_t31=round(bright_t31, 1) if bright_t31 else None,
                            acq_date=row.get("acq_date", datetime.utcnow().strftime("%Y-%m-%d")),
                            acq_time=row.get("acq_time", "0000"),
                            satellite="S-NPP" if sat_raw == "N" else "NOAA-20" if sat_raw == "1" else sat_raw,
                            instrument=inst_raw,
                            confidence=conf_raw,
                            frp=round(frp_val, 1) if frp_val else None,
                            daynight=row.get("daynight", "D"),
                            is_confirmed_incident=False,
                            detection_type="Satellite Active-Fire Thermal Anomaly (NASA FIRMS)"
                        ))
                    except (ValueError, TypeError) as parse_err:
                        continue
    except Exception as err:
        print(f"[NASA FIRMS API Fetch Error]: {err}")

    return records

def get_fire_detections(
    days: int = 7,
    source: str = "VIIRS_SNPP_NRT",
    country: str = "IND"
) -> FireDataResponse:
    """
    Service layer query for historical active-fire satellite detections.
    Checks environment for NASA_FIRMS_MAP_KEY.
    Returns honest unconfigured response if credentials are not set.
    """
    map_key = os.getenv("NASA_FIRMS_MAP_KEY") or os.getenv("FIRMS_MAP_KEY")

    if not map_key:
        return FireDataResponse(
            status="unconfigured",
            message="NASA FIRMS Map Key not configured in backend environment. Set NASA_FIRMS_MAP_KEY to retrieve live satellite active-fire thermal anomaly detections.",
            provider="NASA FIRMS (EOSDIS / VIIRS & MODIS)",
            is_configured=False,
            total_detections=0,
            detections=[],
            source_instrument=source,
            days_searched=days,
            setup_instructions=FIRMS_SETUP_INSTRUCTIONS
        )

    detections = fetch_firms_detections_from_api(map_key=map_key, source=source, days=days, country=country)

    if detections:
        return FireDataResponse(
            status="available",
            message=f"Retrieved {len(detections)} satellite active-fire thermal anomaly detections from NASA FIRMS ({source}, past {days} days).",
            provider="NASA FIRMS (EOSDIS / VIIRS & MODIS)",
            is_configured=True,
            total_detections=len(detections),
            detections=detections,
            source_instrument=source,
            days_searched=days,
            setup_instructions=None
        )

    return FireDataResponse(
        status="no_data",
        message=f"NASA FIRMS API connected, but 0 satellite thermal anomalies detected for the specified region in the past {days} days.",
        provider="NASA FIRMS (EOSDIS / VIIRS & MODIS)",
        is_configured=True,
        total_detections=0,
        detections=[],
        source_instrument=source,
        days_searched=days,
        setup_instructions=None
    )
