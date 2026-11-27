"""
Historical meteorological data ingestion and fire-weather feature aggregation.
Supports local CSV archives in data/raw/weather/ or Open-Meteo Historical Archive API.
Never fabricates synthetic weather data when real records are unavailable.
"""

import csv
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


def fetch_open_meteo_daily_history(
    lat: float,
    lon: float,
    start_date: str,
    end_date: str,
    timeout: int = 15
) -> Dict[str, Dict[str, Optional[float]]]:
    """
    Query the real Open-Meteo Historical Weather Archive API for daily variables.
    Dates must be formatted as 'YYYY-MM-DD'.
    
    Returns:
        Dictionary keyed by date string ('YYYY-MM-DD') containing daily metrics.
        Raises RuntimeError if the API is unreachable or returns invalid data.
    """
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "start_date": start_date,
        "end_date": end_date,
        "daily": ",".join([
            "temperature_2m_max",
            "temperature_2m_mean",
            "relative_humidity_2m_min",
            "relative_humidity_2m_mean",
            "wind_speed_10m_max",
            "precipitation_sum"
        ]),
        "timezone": "Asia/Kolkata"
    }
    url = f"{OPEN_METEO_ARCHIVE_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ForestFusion-Research-Pipeline/1.0"},
        method="GET"
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status != 200:
                raise RuntimeError(f"Open-Meteo Archive API returned HTTP {resp.status}")
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        raise RuntimeError(
            f"Failed to fetch real historical weather from Open-Meteo ({url}): {exc}. "
            "Verify internet connectivity or place local weather CSVs in data/raw/weather/."
        ) from exc

    daily = payload.get("daily", {})
    dates = daily.get("time", [])
    if not dates:
        raise RuntimeError(f"Open-Meteo Archive API returned empty daily records for {start_date}..{end_date}")

    records_by_date: Dict[str, Dict[str, Optional[float]]] = {}
    for idx, d_str in enumerate(dates):
        records_by_date[d_str] = {
            "temp_max_c": daily.get("temperature_2m_max", [None])[idx],
            "temp_mean_c": daily.get("temperature_2m_mean", [None])[idx],
            "rh_min_pct": daily.get("relative_humidity_2m_min", [None])[idx],
            "rh_mean_pct": daily.get("relative_humidity_2m_mean", [None])[idx],
            "wind_speed_max_kmh": daily.get("wind_speed_10m_max", [None])[idx],
            "precip_sum_mm": daily.get("precipitation_sum", [None])[idx]
        }

    return records_by_date


def load_local_weather_csv(weather_dir: Path) -> Dict[str, Dict[str, Optional[float]]]:
    """
    Load local historical daily weather CSV files from data/raw/weather/.
    Expected columns: date (YYYY-MM-DD), temp_max_c, temp_mean_c, rh_min_pct,
    rh_mean_pct, wind_speed_max_kmh, precip_sum_mm.
    """
    records_by_date: Dict[str, Dict[str, Optional[float]]] = {}
    if not weather_dir.exists():
        return records_by_date

    csv_files = sorted(weather_dir.glob("*.csv"))
    for csv_path in csv_files:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                d_str = (row.get("date") or row.get("time") or "").strip()
                if not d_str:
                    continue

                def _to_float(val: Optional[str]) -> Optional[float]:
                    if val is None or val.strip() == "":
                        return None
                    return float(val)

                records_by_date[d_str] = {
                    "temp_max_c": _to_float(row.get("temp_max_c") or row.get("temperature_2m_max")),
                    "temp_mean_c": _to_float(row.get("temp_mean_c") or row.get("temperature_2m_mean")),
                    "rh_min_pct": _to_float(row.get("rh_min_pct") or row.get("relative_humidity_2m_min")),
                    "rh_mean_pct": _to_float(row.get("rh_mean_pct") or row.get("relative_humidity_2m_mean")),
                    "wind_speed_max_kmh": _to_float(row.get("wind_speed_max_kmh") or row.get("wind_speed_10m_max")),
                    "precip_sum_mm": _to_float(row.get("precip_sum_mm") or row.get("precipitation_sum"))
                }

    return records_by_date


def compute_antecedent_weather_features(
    target_date: str,
    daily_records: Dict[str, Dict[str, Optional[float]]],
    lookback_days: int = 7
) -> Dict[str, Optional[float]]:
    """
    Compute fire-weather summary features for target_date and the preceding lookback_days window.
    Returns None for metrics if required daily observations are missing.
    """
    dt = datetime.strptime(target_date, "%Y-%m-%d").date()
    day_rec = daily_records.get(target_date, {})

    precip_vals: List[float] = []
    temp_max_vals: List[float] = []
    rh_min_vals: List[float] = []
    dry_days = 0

    for offset in range(0, lookback_days):
        d_key = (dt - timedelta(days=offset)).isoformat()
        rec = daily_records.get(d_key)
        if not rec:
            continue
        if rec.get("precip_sum_mm") is not None:
            p = float(rec["precip_sum_mm"])
            precip_vals.append(p)
            if p < 1.0:
                dry_days += 1
        if rec.get("temp_max_c") is not None:
            temp_max_vals.append(float(rec["temp_max_c"]))
        if rec.get("rh_min_pct") is not None:
            rh_min_vals.append(float(rec["rh_min_pct"]))

    return {
        "weather_temp_max_c": day_rec.get("temp_max_c"),
        "weather_temp_mean_c": day_rec.get("temp_mean_c"),
        "weather_rh_min_pct": day_rec.get("rh_min_pct"),
        "weather_rh_mean_pct": day_rec.get("rh_mean_pct"),
        "weather_wind_max_kmh": day_rec.get("wind_speed_max_kmh"),
        "weather_precip_day_mm": day_rec.get("precip_sum_mm"),
        f"weather_precip_sum_{lookback_days}d_mm": round(sum(precip_vals), 2) if precip_vals else None,
        f"weather_temp_max_{lookback_days}d_avg_c": round(sum(temp_max_vals) / len(temp_max_vals), 2) if temp_max_vals else None,
        f"weather_rh_min_{lookback_days}d_avg_pct": round(sum(rh_min_vals) / len(rh_min_vals), 2) if rh_min_vals else None,
        f"weather_dry_days_{lookback_days}d": dry_days if precip_vals else None
    }
