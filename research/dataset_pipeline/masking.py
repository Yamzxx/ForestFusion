"""
Quality masking and reflectance conversion module for Sentinel-2 Level-2A imagery.
"""

from typing import Set, Dict, Any, Tuple
import numpy as np

from .config import SCL_CLASSES, DEFAULT_VALID_SCL_CLASSES


def convert_dn_to_surface_reflectance(
    dn_array: np.ndarray,
    scale_factor: float = 10000.0,
    boa_offset: float = -1000.0,
    clamp_to_physical: bool = True
) -> np.ndarray:
    """
    Convert raw Sentinel-2 L2A Digital Numbers (DN) to physical Bottom-Of-Atmosphere (BOA) reflectance.
    
    Formula:
        Reflectance = (DN + BOA_ADD_OFFSET) / QUANTIFICATION_VALUE
        
    Scientific Note:
        For ESA Processing Baseline >= 04.00 (January 2022 onwards, including all 2024 imagery),
        BOA_ADD_OFFSET is -1000.0 DN to represent dark surfaces without negative truncation.
        For baseline < 04.00, BOA_ADD_OFFSET is 0.0.
    """
    # Cast to float32 to prevent integer underflow/overflow
    float_dn = dn_array.astype(np.float32)
    reflectance = (float_dn + boa_offset) / scale_factor

    if clamp_to_physical:
        # Valid surface reflectance physically spans [0.0, 1.0]
        # (Slight values up to 1.2 may occur for extreme specular glint; values < 0 are unphysical noise)
        reflectance = np.clip(reflectance, 0.0, 1.0)

    return reflectance


def create_scl_quality_mask(
    scl_array: np.ndarray,
    valid_classes: Set[int] = DEFAULT_VALID_SCL_CLASSES
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Evaluate Scene Classification Layer (SCL) and produce a boolean valid-pixel mask.
    
    Parameters:
        scl_array: 2D numpy array of integer SCL class values.
        valid_classes: Set of integer classes considered valid (default: {4, 5}).
        
    Returns:
        valid_mask: Boolean 2D array where True indicates valid terrestrial pixels.
        stats: Dictionary of pixel counts and percentages for each SCL class.
    """
    total_pixels = scl_array.size
    valid_mask = np.isin(scl_array, list(valid_classes))

    # Compute class distribution statistics
    class_stats: Dict[str, Any] = {
        "total_pixels": int(total_pixels),
        "valid_pixels": int(np.sum(valid_mask)),
        "valid_percentage": round(float(np.sum(valid_mask) / total_pixels * 100.0), 2),
        "class_breakdown": {}
    }

    unique_vals, counts = np.unique(scl_array, return_counts=True)
    for val, count in zip(unique_vals, counts):
        class_name = SCL_CLASSES.get(int(val), f"UNKNOWN_{val}")
        class_stats["class_breakdown"][class_name] = {
            "code": int(val),
            "pixel_count": int(count),
            "percentage": round(float(count / total_pixels * 100.0), 2),
            "is_valid": int(val) in valid_classes
        }

    return valid_mask, class_stats
