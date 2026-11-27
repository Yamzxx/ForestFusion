"""
Spatial grid construction and zonal statistics extraction for Amrabad Tiger Reserve.
Aggregates 10m Sentinel-2 spectral indices onto reproducible 1 km x 1 km UTM grid cells.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from .config import STUDY_AREA_METADATA
from .raster_io import check_rasterio_installed

try:
    import rasterio
    from rasterio.warp import transform_bounds, transform as rio_transform
    from rasterio.windows import from_bounds
except ImportError:
    rasterio = None
    transform_bounds = None
    rio_transform = None
    from_bounds = None


@dataclass
class GridCell:
    """Represents a single spatial sampling unit in the Amrabad Tiger Reserve grid."""
    cell_id: str
    utm_minx: float
    utm_miny: float
    utm_maxx: float
    utm_maxy: float
    centroid_lat: float
    centroid_lon: float
    epsg: int


def build_utm_grid_for_bounds(
    utm_bounds: Tuple[float, float, float, float],
    cell_size_m: float = 1000.0,
    epsg: int = 32644
) -> List[GridCell]:
    """
    Construct a deterministic square grid over UTM bounds (minx, miny, maxx, maxy).
    Computes WGS84 (EPSG:4326) centroid coordinates for each cell to enable
    joins with Open-Meteo weather and NASA FIRMS fire detection coordinates.
    """
    check_rasterio_installed()

    minx, miny, maxx, maxy = utm_bounds
    # Snap grid origin to clean multiples of cell_size_m for reproducibility
    start_x = np.floor(minx / cell_size_m) * cell_size_m
    start_y = np.floor(miny / cell_size_m) * cell_size_m

    xs = np.arange(start_x, maxx, cell_size_m)
    ys = np.arange(start_y, maxy, cell_size_m)

    utm_cx_list: List[float] = []
    utm_cy_list: List[float] = []
    cell_boxes: List[Tuple[str, float, float, float, float]] = []

    for row_idx, y0 in enumerate(ys):
        y1 = y0 + cell_size_m
        cy = (y0 + y1) / 2.0
        for col_idx, x0 in enumerate(xs):
            x1 = x0 + cell_size_m
            cx = (x0 + x1) / 2.0
            cell_id = f"ATR_{int(x0)}_{int(y0)}"
            cell_boxes.append((cell_id, float(x0), float(y0), float(x1), float(y1)))
            utm_cx_list.append(float(cx))
            utm_cy_list.append(float(cy))

    if not cell_boxes:
        return []

    # Transform all UTM centroids to WGS84 (EPSG:4326) in one vectorized call
    src_crs = f"EPSG:{epsg}"
    dst_crs = "EPSG:4326"
    lons, lats = rio_transform(src_crs, dst_crs, utm_cx_list, utm_cy_list)

    grid_cells: List[GridCell] = []
    for (cid, x0, y0, x1, y1), lon, lat in zip(cell_boxes, lons, lats):
        grid_cells.append(
            GridCell(
                cell_id=cid,
                utm_minx=x0,
                utm_miny=y0,
                utm_maxx=x1,
                utm_maxy=y1,
                centroid_lat=round(float(lat), 6),
                centroid_lon=round(float(lon), 6),
                epsg=epsg
            )
        )

    return grid_cells


def get_amrabad_aoi_utm_bounds(epsg: int = 32644) -> Tuple[float, float, float, float]:
    """
    Convert the configured Amrabad Tiger Reserve WGS84 bounding box into UTM coordinates.
    """
    check_rasterio_installed()
    bbox = STUDY_AREA_METADATA["approx_bbox_wgs84"]
    return transform_bounds(
        "EPSG:4326",
        f"EPSG:{epsg}",
        bbox["min_lon"],
        bbox["min_lat"],
        bbox["max_lon"],
        bbox["max_lat"]
    )


def extract_zonal_stats_for_raster(
    raster_path: Path,
    grid_cells: List[GridCell],
    index_prefix: str,
    min_valid_pixel_ratio: float = 0.50
) -> Dict[str, Dict[str, Any]]:
    """
    Extract per-grid-cell zonal statistics from a processed Sentinel-2 index GeoTIFF.
    Strictly excludes nodata/masked pixels and flags cells that fall below min_valid_pixel_ratio.
    
    Returns:
        Dictionary mapping cell_id -> dictionary of computed zonal statistics.
    """
    check_rasterio_installed()

    if not raster_path.exists():
        raise FileNotFoundError(f"Processed index raster not found: {raster_path}")

    results: Dict[str, Dict[str, Any]] = {}

    with rasterio.open(raster_path) as src:
        nodata = src.nodata
        r_left, r_bottom, r_right, r_top = src.bounds

        for cell in grid_cells:
            # Skip cells completely outside raster extent
            if (
                cell.utm_maxx <= r_left
                or cell.utm_minx >= r_right
                or cell.utm_maxy <= r_bottom
                or cell.utm_miny >= r_top
            ):
                continue

            # Clip cell window to raster bounds
            win_left = max(cell.utm_minx, r_left)
            win_bottom = max(cell.utm_miny, r_bottom)
            win_right = min(cell.utm_maxx, r_right)
            win_top = min(cell.utm_maxy, r_top)

            window = from_bounds(win_left, win_bottom, win_right, win_top, transform=src.transform)
            data = src.read(1, window=window)

            if data.size == 0:
                continue

            # Identify valid (unmasked, non-nodata, finite) pixels
            valid_mask = np.isfinite(data)
            if nodata is not None:
                valid_mask &= (data != nodata)

            valid_pixels = data[valid_mask]
            valid_ratio = float(valid_pixels.size) / float(data.size)

            if valid_ratio < min_valid_pixel_ratio or valid_pixels.size == 0:
                results[cell.cell_id] = {
                    f"{index_prefix}_valid_pixel_ratio": round(valid_ratio, 4),
                    f"{index_prefix}_is_usable": False,
                    f"{index_prefix}_mean": None,
                    f"{index_prefix}_std": None,
                    f"{index_prefix}_p10": None,
                    f"{index_prefix}_p50": None,
                    f"{index_prefix}_p90": None
                }
            else:
                results[cell.cell_id] = {
                    f"{index_prefix}_valid_pixel_ratio": round(valid_ratio, 4),
                    f"{index_prefix}_is_usable": True,
                    f"{index_prefix}_mean": round(float(np.mean(valid_pixels)), 4),
                    f"{index_prefix}_std": round(float(np.std(valid_pixels)), 4),
                    f"{index_prefix}_p10": round(float(np.percentile(valid_pixels, 10)), 4),
                    f"{index_prefix}_p50": round(float(np.percentile(valid_pixels, 50)), 4),
                    f"{index_prefix}_p90": round(float(np.percentile(valid_pixels, 90)), 4)
                }

    return results
