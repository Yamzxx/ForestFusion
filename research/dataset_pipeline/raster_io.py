"""
Raster I/O utilities using rasterio with robust error handling and metadata extraction.
"""

from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np

# Lazy check for rasterio dependency
try:
    import rasterio
    from rasterio.transform import Affine
    from rasterio.enums import Resampling
    RASTERIO_AVAILABLE = True
except ImportError:
    rasterio = None
    Affine = None
    Resampling = None
    RASTERIO_AVAILABLE = False


def check_rasterio_installed():
    """Raise actionable error if rasterio is not installed."""
    if not RASTERIO_AVAILABLE:
        raise ImportError(
            "The Python geospatial library 'rasterio' is required to read and write Sentinel-2 GeoTIFFs.\n"
            "Please install it manually using:\n"
            "    pip install rasterio>=1.3.0\n"
            "or install all research requirements via:\n"
            "    pip install -r research/dataset_pipeline/requirements.txt"
        )


def read_raster_metadata(file_path: Path) -> Dict[str, Any]:
    """
    Read full spatial and radiometric metadata from a raster file without loading pixel arrays.
    """
    check_rasterio_installed()
    
    if not file_path.exists():
        raise FileNotFoundError(f"Raster file not found: {file_path}")

    with rasterio.open(file_path) as src:
        # Extract pixel resolution in CRS units
        res_x = abs(src.transform[0])
        res_y = abs(src.transform[4])
        
        meta = {
            "file_path": str(file_path.resolve()),
            "filename": file_path.name,
            "crs": str(src.crs),
            "crs_epsg": src.crs.to_epsg() if src.crs else None,
            "width": src.width,
            "height": src.height,
            "count": src.count,
            "dtype": str(src.dtypes[0]),
            "nodata": src.nodata,
            "bounds": (src.bounds.left, src.bounds.bottom, src.bounds.right, src.bounds.top),
            "transform": tuple(src.transform),
            "resolution": (res_x, res_y),
            "driver": src.driver,
            "tags": dict(src.tags())
        }
    return meta


def read_band_array(file_path: Path, band_idx: int = 1) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Read raster pixel array and its associated metadata dictionary.
    """
    check_rasterio_installed()
    
    with rasterio.open(file_path) as src:
        array = src.read(band_idx)
        profile = src.profile.copy()
        meta = {
            "crs": src.crs,
            "transform": src.transform,
            "width": src.width,
            "height": src.height,
            "nodata": src.nodata,
            "dtype": str(src.dtypes[0])
        }
    return array, meta


def write_geotiff(
    output_path: Path,
    array: np.ndarray,
    transform: Any,
    crs: Any,
    nodata: float = -9999.0,
    dtype: str = "float32",
    compression: str = "deflate"
) -> Path:
    """
    Write a 2D numpy array to a single-band GeoTIFF with spatial georeferencing and compression.
    """
    check_rasterio_installed()
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    height, width = array.shape
    
    profile = {
        "driver": "GTiff",
        "height": height,
        "width": width,
        "count": 1,
        "dtype": dtype,
        "crs": crs,
        "transform": transform,
        "nodata": nodata,
        "compress": compression,
        "tiled": True,
        "blockxsize": 256,
        "blockysize": 256
    }

    # Cast array safely
    out_array = array.astype(dtype)
    
    with rasterio.open(output_path, "w", **profile) as dst:
        dst.write(out_array, 1)

    return output_path
