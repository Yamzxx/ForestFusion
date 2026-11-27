"""
Spatial grid alignment and resampling module for Sentinel-2 multi-resolution bands.
"""

from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np

from .raster_io import check_rasterio_installed

try:
    import rasterio
    from rasterio.warp import reproject, Resampling
    from rasterio.transform import Affine
except ImportError:
    rasterio = None
    reproject = None
    Resampling = None


def align_band_to_reference(
    src_path: Path,
    ref_meta: Dict[str, Any],
    is_categorical: bool = False
) -> np.ndarray:
    """
    Reproject and resample a source band onto the exact grid, CRS, dimensions,
    and affine transform of the reference band.
    
    Parameters:
        src_path: Path to the raw source raster band (e.g. B11 at 20m or SCL at 20m).
        ref_meta: Metadata dictionary of the reference band (e.g. B04 at 10m).
        is_categorical: If True (e.g. SCL), strictly uses Nearest Neighbor resampling.
                       If False (continuous reflectance), uses Bilinear resampling.
    """
    check_rasterio_installed()

    ref_crs = ref_meta["crs"]
    ref_transform = ref_meta["transform"]
    ref_width = ref_meta["width"]
    ref_height = ref_meta["height"]

    # Choose scientifically appropriate resampling algorithm
    resample_alg = Resampling.nearest if is_categorical else Resampling.bilinear

    with rasterio.open(src_path) as src:
        # Check if band is already perfectly identical in grid, transform, and shape
        if (
            src.crs == ref_crs
            and src.transform == ref_transform
            and src.width == ref_width
            and src.height == ref_height
        ):
            # No resampling needed; return raw array
            return src.read(1)

        # Allocate destination array
        destination = np.empty((ref_height, ref_width), dtype=src.dtypes[0])

        reproject(
            source=rasterio.band(src, 1),
            destination=destination,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=ref_transform,
            dst_crs=ref_crs,
            resampling=resample_alg
        )

    return destination
