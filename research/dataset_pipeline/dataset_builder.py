"""
Step 2 Orchestrator: Spatiotemporal Research Dataset Builder for ForestFusion.
Integrates processed Sentinel-2 spectral indices (NDVI, NDMI, NBR) per UTM grid cell
with historical meteorological features and NASA FIRMS satellite thermal anomalies.

Does NOT train models, fabricate missing data, or label FIRMS detections as ground truth.
"""

import csv
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

from .config import DatasetBuildConfig, STUDY_AREA_METADATA
from .aoi_grid import (
    GridCell,
    get_amrabad_aoi_utm_bounds,
    build_utm_grid_for_bounds,
    extract_zonal_stats_for_raster
)
from .weather_ingestion import (
    load_local_weather_csv,
    fetch_open_meteo_daily_history,
    compute_antecedent_weather_features
)
from .firms_ingestion import (
    load_firms_archive_csvs,
    aggregate_firms_to_grid_for_window
)
from .raster_io import check_rasterio_installed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ForestFusion.DatasetBuilder")


def _extract_date_from_scene_id(scene_id: str, metadata_dir: Path) -> Optional[str]:
    """Attempt to parse YYYY-MM-DD acquisition date from scene metadata or folder name."""
    meta_file = metadata_dir / f"{scene_id}_metadata.json"
    if meta_file.exists():
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
            if meta.get("acquisition_date"):
                return meta["acquisition_date"]

    # Match YYYY-MM-DD or YYYYMMDD in scene_id
    match_iso = re.search(r"(\d{4}-\d{2}-\d{2})", scene_id)
    if match_iso:
        return match_iso.group(1)

    match_compact = re.search(r"(20\d{2})(\d{2})(\d{2})", scene_id)
    if match_compact:
        return f"{match_compact.group(1)}-{match_compact.group(2)}-{match_compact.group(3)}"

    return None


class SpatiotemporalDatasetBuilder:
    """Builds a clean, tabular research dataset from preprocessed Sentinel-2, weather, and FIRMS data."""

    def __init__(self, config: Optional[DatasetBuildConfig] = None):
        self.config = config or DatasetBuildConfig()
        self.config.dataset_output_dir.mkdir(parents=True, exist_ok=True)
        self.config.dataset_metadata_dir.mkdir(parents=True, exist_ok=True)

    def build_dataset(self, default_scene_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute Step 2 dataset construction across all preprocessed Sentinel-2 scenes.
        """
        check_rasterio_installed()

        # 1. Discover preprocessed Sentinel-2 scene directories
        if not self.config.sentinel_processed_dir.exists():
            logger.error("Processed Sentinel-2 directory does not exist.")
            return {"status": "FAILED_NO_PROCESSED_SCENES"}

        scene_dirs = [
            d for d in sorted(self.config.sentinel_processed_dir.iterdir())
            if d.is_dir() and (d / "NDVI.tif").exists()
        ]

        if not scene_dirs:
            logger.error(
                f"No preprocessed Sentinel-2 scenes found in '{self.config.sentinel_processed_dir}'.\n"
                ">> Action Required: Run Step 1 (python -m research.dataset_pipeline.pipeline) "
                "on real Sentinel-2 imagery first."
            )
            return {
                "status": "FAILED_NO_PROCESSED_SCENES",
                "searched_dir": str(self.config.sentinel_processed_dir)
            }

        # 2. Build Amrabad Tiger Reserve UTM Spatial Grid
        epsg = STUDY_AREA_METADATA["expected_utm_epsg"]
        utm_bounds = get_amrabad_aoi_utm_bounds(epsg=epsg)
        grid_cells: List[GridCell] = build_utm_grid_for_bounds(
            utm_bounds=utm_bounds,
            cell_size_m=self.config.grid_cell_size_m,
            epsg=epsg
        )
        logger.info(
            f"Constructed Amrabad spatial grid: {len(grid_cells)} cells "
            f"({self.config.grid_cell_size_m}m x {self.config.grid_cell_size_m}m, EPSG:{epsg})"
        )

        # 3. Load NASA FIRMS satellite thermal anomaly archive (if provided)
        firms_detections = load_firms_archive_csvs(
            firms_dir=self.config.raw_firms_dir,
            clip_to_study_bbox=True,
            target_epsg=epsg
        )
        firms_available = len(firms_detections) > 0
        if not firms_available:
            logger.warning(
                f"No NASA FIRMS CSV detections found in '{self.config.raw_firms_dir}'. "
                "FIRMS columns will be marked as None (data unavailable) — NOT fabricated."
            )
        else:
            logger.info(f"Loaded {len(firms_detections)} NASA FIRMS detections within Amrabad AOI.")

        # 4. Load local weather CSVs (fallback to Open-Meteo Archive API per scene date)
        local_weather = load_local_weather_csv(self.config.raw_weather_dir)
        center_lat = (
            STUDY_AREA_METADATA["approx_bbox_wgs84"]["min_lat"]
            + STUDY_AREA_METADATA["approx_bbox_wgs84"]["max_lat"]
        ) / 2.0
        center_lon = (
            STUDY_AREA_METADATA["approx_bbox_wgs84"]["min_lon"]
            + STUDY_AREA_METADATA["approx_bbox_wgs84"]["max_lon"]
        ) / 2.0

        # 5. Extract & Join Features per Scene
        dataset_rows: List[Dict[str, Any]] = []
        scene_audit: List[Dict[str, Any]] = []

        for scene_dir in scene_dirs:
            scene_id = scene_dir.name
            scene_date = _extract_date_from_scene_id(scene_id, self.config.sentinel_metadata_dir) or default_scene_date

            if not scene_date:
                logger.warning(
                    f"Skipping scene '{scene_id}': Unable to determine acquisition date (YYYY-MM-DD). "
                    "Include date in folder name or pass --scene-date."
                )
                continue

            logger.info(f"Processing scene '{scene_id}' (Date: {scene_date})...")

            # 5a. Zonal statistics for NDVI, NDMI, NBR
            ndvi_stats = extract_zonal_stats_for_raster(
                scene_dir / "NDVI.tif", grid_cells, "ndvi", self.config.min_valid_pixel_ratio
            )
            ndmi_stats = extract_zonal_stats_for_raster(
                scene_dir / "NDMI.tif", grid_cells, "ndmi", self.config.min_valid_pixel_ratio
            )
            nbr_stats = extract_zonal_stats_for_raster(
                scene_dir / "NBR.tif", grid_cells, "nbr", self.config.min_valid_pixel_ratio
            )

            # 5b. Weather features for scene_date and antecedent window
            dt_obj = datetime.strptime(scene_date, "%Y-%m-%d").date()
            lookback_start = (dt_obj - timedelta(days=self.config.weather_lookback_days)).isoformat()

            weather_source = "local_csv"
            daily_weather = local_weather
            if scene_date not in daily_weather:
                logger.info(f"  - Querying Open-Meteo Historical Archive for {lookback_start}..{scene_date}...")
                daily_weather = fetch_open_meteo_daily_history(
                    lat=center_lat,
                    lon=center_lon,
                    start_date=lookback_start,
                    end_date=scene_date
                )
                weather_source = "open_meteo_archive_api"

            weather_feats = compute_antecedent_weather_features(
                target_date=scene_date,
                daily_records=daily_weather,
                lookback_days=self.config.weather_lookback_days
            )

            # 5c. NASA FIRMS thermal detections within lookahead window
            firms_by_cell = (
                aggregate_firms_to_grid_for_window(
                    detections=firms_detections,
                    grid_cells=grid_cells,
                    scene_date=scene_date,
                    lookahead_days=self.config.firms_lookahead_days
                )
                if firms_available
                else {}
            )

            # 5d. Assemble clean grid-cell rows (only cells intersecting raster & passing valid_pixel_ratio)
            usable_cells = 0
            for cell in grid_cells:
                s_ndvi = ndvi_stats.get(cell.cell_id)
                s_ndmi = ndmi_stats.get(cell.cell_id)
                s_nbr = nbr_stats.get(cell.cell_id)
                if not (s_ndvi and s_ndmi and s_nbr):
                    continue

                if not (s_ndvi["ndvi_is_usable"] and s_ndmi["ndmi_is_usable"] and s_nbr["nbr_is_usable"]):
                    continue

                usable_cells += 1
                firms_cell = firms_by_cell.get(cell.cell_id, {
                    "firms_detection_count": None,
                    "firms_has_detection": None,
                    "firms_max_frp_mw": None
                })

                row = {
                    "scene_id": scene_id,
                    "acquisition_date": scene_date,
                    "cell_id": cell.cell_id,
                    "centroid_lat": cell.centroid_lat,
                    "centroid_lon": cell.centroid_lon,
                    **s_ndvi,
                    **s_ndmi,
                    **s_nbr,
                    **weather_feats,
                    **firms_cell
                }
                dataset_rows.append(row)

            scene_audit.append({
                "scene_id": scene_id,
                "acquisition_date": scene_date,
                "usable_grid_cells": usable_cells,
                "weather_source": weather_source
            })
            logger.info(f"  - Extracted {usable_cells} usable grid cells for '{scene_id}'.")

        if not dataset_rows:
            logger.error("No usable grid cells were extracted across processed scenes.")
            return {"status": "FAILED_NO_USABLE_CELLS", "scenes": scene_audit}

        # 6. Write output CSV
        output_csv = self.config.dataset_output_dir / "amrabad_2024_dataset.csv"
        fieldnames = list(dataset_rows[0].keys())
        try:
            with open(output_csv, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(dataset_rows)
        except PermissionError:
            output_csv = self.config.dataset_output_dir / "amrabad_2024_dataset_with_firms.csv"
            logger.warning(f"Primary CSV is open/locked; writing instead to: {output_csv}")
            with open(output_csv, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(dataset_rows)

        # 7. Write dataset provenance manifest
        manifest = {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "study_area": STUDY_AREA_METADATA,
            "grid_cell_size_m": self.config.grid_cell_size_m,
            "min_valid_pixel_ratio": self.config.min_valid_pixel_ratio,
            "weather_lookback_days": self.config.weather_lookback_days,
            "firms_lookahead_days": self.config.firms_lookahead_days,
            "firms_archive_available": firms_available,
            "scientific_notes": [
                "firms_has_detection reflects satellite thermal anomalies, NOT exhaustive ground-truth wildfire labels.",
                "Grid cells with < min_valid_pixel_ratio unmasked Sentinel-2 pixels were excluded."
            ],
            "total_rows": len(dataset_rows),
            "columns": fieldnames,
            "scenes_included": scene_audit,
            "output_csv": str(output_csv.resolve())
        }
        manifest_path = self.config.dataset_metadata_dir / "dataset_manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        logger.info(f"Dataset built successfully: {len(dataset_rows)} rows -> {output_csv}")
        return {
            "status": "SUCCESS",
            "total_rows": len(dataset_rows),
            "output_csv": str(output_csv),
            "manifest_file": str(manifest_path)
        }


def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="ForestFusion Step 2: Spatiotemporal Dataset Builder (Amrabad Tiger Reserve)"
    )
    parser.add_argument(
        "--scene-date",
        type=str,
        default=None,
        help="Fallback acquisition date (YYYY-MM-DD) if not encoded in scene folder/metadata"
    )
    args = parser.parse_args()

    builder = SpatiotemporalDatasetBuilder()
    result = builder.build_dataset(default_scene_date=args.scene_date)
    print(f"\nDataset Builder Status: {result['status']}")


if __name__ == "__main__":
    main()
