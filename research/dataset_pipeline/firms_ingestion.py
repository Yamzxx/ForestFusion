"""
NASA FIRMS (VIIRS / MODIS) archive active fire detection ingestion.
Maps satellite thermal anomaly records to Amrabad Tiger Reserve UTM grid cells.

SCIENTIFIC INTEGRITY NOTICE:
    NASA FIRMS detections represent satellite-observed thermal anomalies,
    NOT exhaustive ground-truth wildfire ignition or burn labels.
    Missing detections can occur due to cloud cover, dense canopy, or satellite
    overpass timing; detections can also include non-wildfire thermal sources.
"""

import csv
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from .aoi_grid import GridCell
from .config import STUDY_AREA_METADATA
from .raster_io import check_rasterio_installed

try:
    from rasterio.warp import transform as rio_transform
except ImportError:
    rio_transform = None


@dataclass
class FirmsDetection:
    """Represents a single parsed NASA FIRMS satellite thermal anomaly record."""
    latitude: float
    longitude: float
    acq_date: str
    acq_time: str
    frp: Optional[float]
    confidence: str
    instrument: str
    satellite: str
    utm_x: Optional[float] = None
    utm_y: Optional[float] = None


def load_firms_archive_csvs(
    firms_dir: Path,
    clip_to_study_bbox: bool = True,
    target_epsg: int = 32644
) -> List[FirmsDetection]:
    """
    Load and validate NASA FIRMS archive CSV files from data/raw/firms/.
    Projects WGS84 coordinates to UTM Zone 44N for exact grid cell assignment.
    """
    check_rasterio_installed()

    if not firms_dir.exists():
        return []

    csv_files = sorted(firms_dir.glob("*.csv"))
    if not csv_files:
        return []

    bbox = STUDY_AREA_METADATA["approx_bbox_wgs84"]
    detections: List[FirmsDetection] = []

    for csv_path in csv_files:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                continue

            required_cols = {"latitude", "longitude", "acq_date"}
            if not required_cols.issubset(set(reader.fieldnames)):
                raise ValueError(
                    f"FIRMS CSV '{csv_path.name}' is missing required columns {required_cols}. "
                    f"Found: {reader.fieldnames}"
                )

            for row in reader:
                lat = float(row["latitude"])
                lon = float(row["longitude"])

                if clip_to_study_bbox:
                    if not (
                        bbox["min_lat"] <= lat <= bbox["max_lat"]
                        and bbox["min_lon"] <= lon <= bbox["max_lon"]
                    ):
                        continue

                frp_raw = row.get("frp", "").strip()
                frp_val = float(frp_raw) if frp_raw else None

                detections.append(
                    FirmsDetection(
                        latitude=lat,
                        longitude=lon,
                        acq_date=row["acq_date"].strip(),
                        acq_time=(row.get("acq_time") or "").strip(),
                        frp=frp_val,
                        confidence=(row.get("confidence") or "").strip(),
                        instrument=(row.get("instrument") or "").strip(),
                        satellite=(row.get("satellite") or "").strip()
                    )
                )

    if detections:
        lons = [d.longitude for d in detections]
        lats = [d.latitude for d in detections]
        xs, ys = rio_transform("EPSG:4326", f"EPSG:{target_epsg}", lons, lats)
        for det, x, y in zip(detections, xs, ys):
            det.utm_x = float(x)
            det.utm_y = float(y)

    return detections


def aggregate_firms_to_grid_for_window(
    detections: List[FirmsDetection],
    grid_cells: List[GridCell],
    scene_date: str,
    lookahead_days: int = 5
) -> Dict[str, Dict[str, Any]]:
    """
    Aggregate satellite thermal anomaly detections per grid cell within
    [scene_date, scene_date + lookahead_days].
    
    Returns:
        Dictionary mapping cell_id -> FIRMS detection summary (never labeled as ground truth).
    """
    start_dt = datetime.strptime(scene_date, "%Y-%m-%d").date()
    end_dt = start_dt + timedelta(days=lookahead_days)

    # Filter detections within temporal window
    window_detections: List[FirmsDetection] = []
    for d in detections:
        try:
            d_dt = datetime.strptime(d.acq_date, "%Y-%m-%d").date()
        except ValueError:
            continue
        if start_dt <= d_dt <= end_dt:
            window_detections.append(d)

    cell_summaries: Dict[str, Dict[str, Any]] = {}
    for cell in grid_cells:
        matching: List[FirmsDetection] = []
        for d in window_detections:
            if d.utm_x is None or d.utm_y is None:
                continue
            if (
                cell.utm_minx <= d.utm_x < cell.utm_maxx
                and cell.utm_miny <= d.utm_y < cell.utm_maxy
            ):
                matching.append(d)

        frp_vals = [m.frp for m in matching if m.frp is not None]
        cell_summaries[cell.cell_id] = {
            "firms_detection_count": len(matching),
            "firms_has_detection": 1 if len(matching) > 0 else 0,
            "firms_max_frp_mw": round(max(frp_vals), 2) if frp_vals else 0.0
        }

    return cell_summaries
