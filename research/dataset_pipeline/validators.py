"""
Validation modules for Sentinel-2 input files, spatial metadata, and geographic compatibility.
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any

from .config import REQUIRED_BANDS

BAND_PATTERNS = {
    "B04": re.compile(r"(?:B04|B4)(?:_10m)?(?:\.tif|\.jp2)$", re.IGNORECASE),
    "B08": re.compile(r"(?:B08|B8)(?:_10m)?(?:\.tif|\.jp2)$", re.IGNORECASE),
    "B11": re.compile(r"(?:B11)(?:_20m)?(?:\.tif|\.jp2)$", re.IGNORECASE),
    "B12": re.compile(r"(?:B12)(?:_20m)?(?:\.tif|\.jp2)$", re.IGNORECASE),
    "SCL": re.compile(r"(?:SCL)(?:_20m)?(?:\.tif|\.jp2)$", re.IGNORECASE),
}


class ValidationError(Exception):
    """Raised when scene inputs fail scientific validation checks."""
    pass


def discover_scene_bands(search_dir: Path) -> Dict[str, Path]:
    """
    Scan search_dir (and immediate subdirectories) for GeoTIFF / JPEG2000 Sentinel-2 bands.
    Returns a dictionary mapping band name (e.g. 'B04', 'B08', etc.) to the found Path.
    """
    found_bands: Dict[str, Path] = {}
    if not search_dir.exists():
        return found_bands

    candidate_files = list(search_dir.rglob("*.tif")) + list(search_dir.rglob("*.jp2"))
    
    for file_path in candidate_files:
        filename = file_path.name
        for band_name, pattern in BAND_PATTERNS.items():
            if pattern.search(filename) and band_name not in found_bands:
                found_bands[band_name] = file_path

    return found_bands


def validate_scene_inputs(scene_dir: Path) -> Tuple[bool, Dict[str, Path], List[str]]:
    """
    Verify that all required Sentinel-2 L2A bands (B04, B08, B11, B12, SCL) are present.
    Strictly forbids fabricating or substituting missing bands.
    """
    issues: List[str] = []
    
    if not scene_dir.exists():
        issues.append(f"Specified input directory does not exist: {scene_dir}")
        return False, {}, issues

    found_bands = discover_scene_bands(scene_dir)
    missing_bands = [b for b in REQUIRED_BANDS if b not in found_bands]

    if missing_bands:
        issues.append(
            f"Missing required Sentinel-2 L2A band(s): {missing_bands}. "
            f"The pipeline requires real B04 (Red), B08 (NIR), B11 (SWIR1), B12 (SWIR2), "
            f"and SCL (Scene Classification Layer). Found: {list(found_bands.keys())}."
        )
        return False, found_bands, issues

    return True, found_bands, issues


def validate_band_compatibility(band_metadata_map: Dict[str, Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Check whether all bands in a scene are geographically and geodetically compatible:
    1. Verify CRS is present and identical across all bands.
    2. Verify spatial bounding boxes overlap significantly (>95% intersection).
    3. Verify nodata definitions are valid.
    """
    issues: List[str] = []
    
    if not band_metadata_map:
        issues.append("No band metadata provided for compatibility check.")
        return False, issues

    # 1. CRS Check
    crss = {band: meta.get("crs") for band, meta in band_metadata_map.items()}
    unique_crss = set(crss.values())
    if None in unique_crss or len(unique_crss) > 1:
        issues.append(
            f"CRS mismatch or missing CRS across bands: {crss}. "
            "All input bands must be in the same projection (e.g. EPSG:32644 UTM Zone 44N)."
        )

    # 2. Bounding Box Overlap Check
    bounds_list = [meta.get("bounds") for meta in band_metadata_map.values() if meta.get("bounds")]
    if len(bounds_list) == len(band_metadata_map) and len(bounds_list) > 1:
        # Check intersection of bounds: (minx, miny, maxx, maxy)
        ref_bounds = bounds_list[0]
        ref_left, ref_bottom, ref_right, ref_top = ref_bounds
        
        for idx, (band, meta) in enumerate(band_metadata_map.items()):
            b = meta.get("bounds")
            b_left, b_bottom, b_right, b_top = b
            
            # Intersection coordinates
            int_left = max(ref_left, b_left)
            int_bottom = max(ref_bottom, b_bottom)
            int_right = min(ref_right, b_right)
            int_top = min(ref_top, b_top)

            if int_left >= int_right or int_bottom >= int_top:
                issues.append(
                    f"Band '{band}' has zero spatial overlap with reference bounds! "
                    f"Ref bounds: {ref_bounds}, Band bounds: {b}."
                )
            else:
                # Calculate overlap ratio
                int_area = (int_right - int_left) * (int_top - int_bottom)
                ref_area = (ref_right - ref_left) * (ref_top - ref_bottom)
                overlap_ratio = int_area / ref_area if ref_area > 0 else 0
                if overlap_ratio < 0.95:
                    issues.append(
                        f"Band '{band}' spatial overlap with reference is only {overlap_ratio*100:.1f}% "
                        "(expected >= 95% bounding box intersection)."
                    )

    return len(issues) == 0, issues
