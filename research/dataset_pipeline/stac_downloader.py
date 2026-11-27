"""
Lightweight Cloud-Optimized GeoTIFF (COG) Downloader via Element84 Earth Search STAC.
Clips ONLY the small Amrabad Tiger Reserve AOI window directly from public Sentinel-2 L2A COGs
over HTTPS byte-range requests, avoiding massive 1 GB+ full-tile downloads.
"""

import json
import logging
import urllib.request
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from .config import DEFAULT_RAW_DIR
from .raster_io import check_rasterio_installed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ForestFusion.STACDownloader")

EARTH_SEARCH_STAC_URL = "https://earth-search.aws.element84.com/v1/search"

# Compact forested AOI within Amrabad Tiger Reserve (~13 km x 13 km)
DEFAULT_AMRABAD_SMALL_BBOX = (78.90, 16.22, 79.02, 16.34)

ASSET_TO_BAND = {
    "red": "B04",
    "nir": "B08",
    "swir16": "B11",
    "swir22": "B12",
    "scl": "SCL"
}


def search_sentinel2_stac_scenes(
    bbox: Tuple[float, float, float, float] = DEFAULT_AMRABAD_SMALL_BBOX,
    date_range: str = "2024-01-01T00:00:00Z/2024-12-31T23:59:59Z",
    max_cloud_cover: float = 15.0,
    limit: int = 30
) -> List[Dict[str, Any]]:
    """Query public Element84 Earth Search STAC API for Sentinel-2 L2A scenes."""
    payload_dict = {
        "collections": ["sentinel-2-l2a"],
        "bbox": list(bbox),
        "datetime": date_range,
        "query": {"eo:cloud_cover": {"lt": max_cloud_cover}},
        "limit": limit
    }
    payload = json.dumps(payload_dict).encode("utf-8")

    for attempt in range(3):
        try:
            req = urllib.request.Request(
                EARTH_SEARCH_STAC_URL,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "ForestFusion-Research-Pipeline/1.0"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data.get("features", [])
        except Exception as exc:
            logger.warning(f"STAC query attempt {attempt + 1} via urllib failed: {exc}")

    # Fallback to system curl.exe (uses Schannel TLS on Windows)
    import subprocess
    res = subprocess.run(
        [
            "curl.exe", "-s", "-X", "POST", EARTH_SEARCH_STAC_URL,
            "-H", "Content-Type: application/json",
            "-d", json.dumps(payload_dict)
        ],
        capture_output=True,
        text=True,
        check=True
    )
    data = json.loads(res.stdout)
    return data.get("features", [])


def download_clipped_cog_band(
    cog_url: str,
    output_path: Path,
    bbox_wgs84: Tuple[float, float, float, float]
) -> Dict[str, Any]:
    """
    Read ONLY the specified WGS84 bounding box window from a remote COG URL
    and save it as a compressed local GeoTIFF.
    """
    check_rasterio_installed()
    import rasterio
    from rasterio.warp import transform_bounds
    from rasterio.windows import from_bounds

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif"):
        with rasterio.open(cog_url) as src:
            minx, miny, maxx, maxy = transform_bounds("EPSG:4326", src.crs, *bbox_wgs84)
            window = from_bounds(minx, miny, maxx, maxy, transform=src.transform)
            window = window.round_offsets().round_lengths()

            data = src.read(1, window=window)
            win_transform = src.window_transform(window)

            profile = src.profile.copy()
            profile.update({
                "driver": "GTiff",
                "height": data.shape[0],
                "width": data.shape[1],
                "transform": win_transform,
                "compress": "deflate",
                "tiled": True
            })

            with rasterio.open(output_path, "w", **profile) as dst:
                dst.write(data, 1)

    size_kb = round(output_path.stat().st_size / 1024.0, 1)
    return {"file": str(output_path), "shape": list(data.shape), "size_kb": size_kb}


def download_amrabad_sample_scenes(
    max_scenes: int = 4,
    bbox: Tuple[float, float, float, float] = DEFAULT_AMRABAD_SMALL_BBOX,
    output_root: Optional[Path] = None
) -> List[Dict[str, Any]]:
    """
    Download up to `max_scenes` real 2024 Sentinel-2 L2A scenes (one per distinct month
    where available) clipped strictly to the small Amrabad AOI.
    """
    check_rasterio_installed()
    target_root = output_root or DEFAULT_RAW_DIR
    target_root.mkdir(parents=True, exist_ok=True)

    logger.info(f"Searching Earth Search STAC for 2024 Sentinel-2 L2A scenes over {bbox}...")
    features = search_sentinel2_stac_scenes(bbox=bbox)
    if not features:
        raise RuntimeError("No matching Sentinel-2 L2A scenes found from STAC API.")

    # Prefer tile 44QKD (covers central Amrabad) and pick 1 cleanest scene per month
    selected_by_month: Dict[str, Dict[str, Any]] = {}
    for feat in sorted(features, key=lambda f: f["properties"].get("eo:cloud_cover", 100.0)):
        dt_str = feat["properties"]["datetime"][:10]
        month_key = dt_str[:7]
        tile_id = feat["id"]
        if "44QKD" not in tile_id and month_key in selected_by_month:
            continue
        if month_key not in selected_by_month:
            selected_by_month[month_key] = feat

    chosen = sorted(selected_by_month.values(), key=lambda f: f["properties"]["datetime"])[:max_scenes]
    downloaded_scenes: List[Dict[str, Any]] = []

    for feat in chosen:
        acq_date = feat["properties"]["datetime"][:10]
        scene_folder = target_root / f"scene_{acq_date}"
        scene_folder.mkdir(parents=True, exist_ok=True)

        logger.info(
            f"Downloading clipped AOI for {feat['id']} (Date: {acq_date}, "
            f"Scene Cloud: {feat['properties'].get('eo:cloud_cover'):.2f}%)..."
        )

        band_logs: Dict[str, Any] = {}
        for asset_key, band_name in ASSET_TO_BAND.items():
            asset = feat["assets"].get(asset_key)
            if not asset:
                raise RuntimeError(f"Asset '{asset_key}' missing in STAC item {feat['id']}")
            out_tif = scene_folder / f"{band_name}.tif"
            info = download_clipped_cog_band(asset["href"], out_tif, bbox)
            band_logs[band_name] = info
            logger.info(f"  - Saved {band_name}.tif ({info['shape'][1]}x{info['shape'][0]} px, {info['size_kb']} KB)")

        meta_out = scene_folder / "stac_source_metadata.json"
        with open(meta_out, "w", encoding="utf-8") as f:
            json.dump({
                "stac_id": feat["id"],
                "acquisition_date": acq_date,
                "datetime_utc": feat["properties"]["datetime"],
                "scene_cloud_cover_pct": feat["properties"].get("eo:cloud_cover"),
                "bbox_wgs84": list(bbox),
                "bands": band_logs
            }, f, indent=2)

        downloaded_scenes.append({"scene_dir": str(scene_folder), "date": acq_date, "bands": band_logs})

    return downloaded_scenes


if __name__ == "__main__":
    download_amrabad_sample_scenes(max_scenes=4)
