"""
Spectral indices computation module for Sentinel-2 surface reflectance.
Calculates NDVI, NDMI, and NBR with division safeguards and quality mask preservation.
"""

from typing import Dict, Any, Tuple, Optional
import numpy as np


def compute_normalized_difference(
    band_a: np.ndarray,
    band_b: np.ndarray,
    valid_mask: Optional[np.ndarray] = None,
    epsilon: float = 1e-6,
    nodata_value: float = -9999.0
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Generic safe normalized difference index computation: (A - B) / (A + B).
    
    Parameters:
        band_a: 2D numpy array of calibrated surface reflectance (e.g. B08).
        band_b: 2D numpy array of calibrated surface reflectance (e.g. B04, B11, B12).
        valid_mask: Optional boolean 2D mask (True for valid pixels).
        epsilon: Minimum denominator threshold to prevent division by zero.
        nodata_value: Nodata filler for invalid or masked pixels.
        
    Returns:
        index_array: Float32 2D array of computed index.
        stats: Dictionary of descriptive statistics across valid pixels.
    """
    numerator = band_a - band_b
    denominator = band_a + band_b

    # Identify mathematically valid denominator locations
    math_valid = np.abs(denominator) >= epsilon

    # Combine with SCL quality mask if provided
    if valid_mask is not None:
        compute_mask = math_valid & valid_mask
    else:
        compute_mask = math_valid

    # Allocate output array with nodata filler
    index_array = np.full(band_a.shape, nodata_value, dtype=np.float32)

    # Compute index only on strictly valid pixels
    np.divide(
        numerator,
        denominator,
        out=index_array,
        where=compute_mask
    )

    # Clamp physically valid range [-1.0, 1.0]
    # Pixels where compute_mask is True are checked; any outside are flagged as invalid
    valid_values = index_array[compute_mask]
    out_of_bounds = (valid_values < -1.0) | (valid_values > 1.0)
    
    if np.any(out_of_bounds):
        # Invalidate unphysical spikes (often caused by sub-pixel cloud edge glint)
        index_array[compute_mask & ((index_array < -1.0) | (index_array > 1.0))] = nodata_value
        compute_mask = compute_mask & (index_array >= -1.0) & (index_array <= 1.0)
        valid_values = index_array[compute_mask]

    stats: Dict[str, Any] = {
        "valid_pixel_count": int(valid_values.size),
        "total_pixel_count": int(index_array.size),
        "valid_percentage": round(float(valid_values.size / index_array.size * 100.0), 2) if index_array.size > 0 else 0.0,
        "mean": round(float(np.mean(valid_values)), 4) if valid_values.size > 0 else None,
        "std": round(float(np.std(valid_values)), 4) if valid_values.size > 0 else None,
        "min": round(float(np.min(valid_values)), 4) if valid_values.size > 0 else None,
        "max": round(float(np.max(valid_values)), 4) if valid_values.size > 0 else None,
        "p25": round(float(np.percentile(valid_values, 25)), 4) if valid_values.size > 0 else None,
        "median": round(float(np.median(valid_values)), 4) if valid_values.size > 0 else None,
        "p75": round(float(np.percentile(valid_values, 75)), 4) if valid_values.size > 0 else None
    }

    return index_array, stats


def compute_ndvi(
    b08: np.ndarray,
    b04: np.ndarray,
    valid_mask: Optional[np.ndarray] = None,
    nodata_value: float = -9999.0
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Normalized Difference Vegetation Index:
        NDVI = (B08 - B04) / (B08 + B04)
    Measures canopy greenness and photosynthetic vigor.
    """
    return compute_normalized_difference(
        band_a=b08,
        band_b=b04,
        valid_mask=valid_mask,
        nodata_value=nodata_value
    )


def compute_ndmi(
    b08: np.ndarray,
    b11: np.ndarray,
    valid_mask: Optional[np.ndarray] = None,
    nodata_value: float = -9999.0
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Normalized Difference Moisture Index:
        NDMI = (B08 - B11) / (B08 + B11)
    Measures liquid water content in the canopy. Declining NDMI indicates fuel desiccation.
    """
    return compute_normalized_difference(
        band_a=b08,
        band_b=b11,
        valid_mask=valid_mask,
        nodata_value=nodata_value
    )


def compute_nbr(
    b08: np.ndarray,
    b12: np.ndarray,
    valid_mask: Optional[np.ndarray] = None,
    nodata_value: float = -9999.0
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Normalized Burn Ratio:
        NBR = (B08 - B12) / (B08 + B12)
    Sensitive to live vegetation moisture (B08) vs. charcoal, ash, and dry biomass (B12).
    """
    return compute_normalized_difference(
        band_a=b08,
        band_b=b12,
        valid_mask=valid_mask,
        nodata_value=nodata_value
    )
