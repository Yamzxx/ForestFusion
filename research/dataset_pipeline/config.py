"""
Configuration dataclasses and constants for the Sentinel-2 Preprocessing Pipeline.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Set, Optional

# Standard Root Paths relative to workspace root
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_RAW_DIR = WORKSPACE_ROOT / "data" / "raw" / "sentinel2"
DEFAULT_INTERIM_DIR = WORKSPACE_ROOT / "data" / "interim" / "sentinel2"
DEFAULT_PROCESSED_DIR = WORKSPACE_ROOT / "data" / "processed" / "sentinel2"
DEFAULT_METADATA_DIR = WORKSPACE_ROOT / "data" / "metadata" / "sentinel2"

# Step 2: Multi-source dataset construction paths
DEFAULT_RAW_WEATHER_DIR = WORKSPACE_ROOT / "data" / "raw" / "weather"
DEFAULT_RAW_FIRMS_DIR = WORKSPACE_ROOT / "data" / "raw" / "firms"
DEFAULT_RAW_AOI_DIR = WORKSPACE_ROOT / "data" / "raw" / "aoi"
DEFAULT_DATASET_PROCESSED_DIR = WORKSPACE_ROOT / "data" / "processed" / "dataset"
DEFAULT_DATASET_METADATA_DIR = WORKSPACE_ROOT / "data" / "metadata" / "dataset"

# Study Area: Amrabad Tiger Reserve, Telangana, India
STUDY_AREA_METADATA = {
    "name": "Amrabad Tiger Reserve",
    "state": "Telangana",
    "country": "India",
    "landscape": "Nallamala Forest Range",
    "approx_bbox_wgs84": {
        "min_lon": 78.70,
        "min_lat": 16.10,
        "max_lon": 79.40,
        "max_lat": 16.60
    },
    "expected_utm_epsg": 32644  # WGS 84 / UTM Zone 44N
}

# Required Sentinel-2 L2A Bands
REQUIRED_BANDS: List[str] = ["B04", "B08", "B11", "B12", "SCL"]

# Native band spatial resolutions (meters)
NATIVE_BAND_RESOLUTIONS: Dict[str, float] = {
    "B04": 10.0,
    "B08": 10.0,
    "B11": 20.0,
    "B12": 20.0,
    "SCL": 20.0
}

# Sentinel-2 Scene Classification Layer (SCL) Class Definitions
SCL_CLASSES: Dict[int, str] = {
    0: "NO_DATA",
    1: "SATURATED_OR_DEFECTIVE",
    2: "DARK_AREA_PIXELS",
    3: "CLOUD_SHADOWS",
    4: "VEGETATION",
    5: "NOT_VEGETATED",
    6: "WATER",
    7: "UNCLASSIFIED",
    8: "CLOUD_MEDIUM_PROBABILITY",
    9: "CLOUD_HIGH_PROBABILITY",
    10: "THIN_CIRRUS",
    11: "SNOW_OR_ICE"
}

# Default Valid Terrestrial SCL Classes for Forest/Wildfire Susceptibility Analysis
# Retain classes 4 (Vegetation) and 5 (Not-vegetated / soil / fuel bed)
DEFAULT_VALID_SCL_CLASSES: Set[int] = {4, 5}

@dataclass
class PreprocessingConfig:
    """Configuration settings for Sentinel-2 scene preprocessing."""
    raw_dir: Path = field(default_factory=lambda: DEFAULT_RAW_DIR)
    interim_dir: Path = field(default_factory=lambda: DEFAULT_INTERIM_DIR)
    processed_dir: Path = field(default_factory=lambda: DEFAULT_PROCESSED_DIR)
    metadata_dir: Path = field(default_factory=lambda: DEFAULT_METADATA_DIR)
    
    # Target grid resolution in meters (defaults to 10m to match native B04/B08)
    target_resolution_m: float = 10.0
    
    # Reference band used to anchor the affine transform and coordinate bounds
    reference_band: str = "B04"
    
    # Reflectance quantification parameters
    # ESA Processing Baseline >= 04.00 (all 2024 data) includes an offset of -1000 DN.
    quantification_value: float = 10000.0
    boa_add_offset: float = -1000.0  # Set to 0.0 for legacy scenes before Jan 25, 2022
    clamp_reflectance: bool = True   # Clamp valid surface reflectance to [0.0, 1.0]
    
    # Quality Masking Policy
    valid_scl_classes: Set[int] = field(default_factory=lambda: set(DEFAULT_VALID_SCL_CLASSES))
    mask_water: bool = True          # Exclude Class 6 (Water)
    mask_cloud_shadows: bool = True  # Exclude Class 3 (Cloud Shadows)
    mask_clouds: bool = True         # Exclude Classes 8, 9, 10
    
    # Resampling Algorithms
    # For continuous reflectance bands (B11, B12): bilinear (or cubic)
    # For categorical classification layer (SCL): nearest (NEVER average discrete classes!)
    resampling_method_continuous: str = "bilinear"
    resampling_method_categorical: str = "nearest"
    
    # Numerical safety epsilon for index denominator checks
    denominator_epsilon: float = 1e-6
    
    # Derived index output nodata value
    nodata_value: float = -9999.0
    
    # GeoTIFF compression format
    compression: str = "deflate"


@dataclass
class DatasetBuildConfig:
    """Configuration settings for Step 2: AOI Grid, Multi-Source Ingestion, and Dataset Merging."""
    sentinel_processed_dir: Path = field(default_factory=lambda: DEFAULT_PROCESSED_DIR)
    sentinel_metadata_dir: Path = field(default_factory=lambda: DEFAULT_METADATA_DIR)
    raw_weather_dir: Path = field(default_factory=lambda: DEFAULT_RAW_WEATHER_DIR)
    raw_firms_dir: Path = field(default_factory=lambda: DEFAULT_RAW_FIRMS_DIR)
    raw_aoi_dir: Path = field(default_factory=lambda: DEFAULT_RAW_AOI_DIR)
    dataset_output_dir: Path = field(default_factory=lambda: DEFAULT_DATASET_PROCESSED_DIR)
    dataset_metadata_dir: Path = field(default_factory=lambda: DEFAULT_DATASET_METADATA_DIR)

    # Spatial grid cell size in meters (projected in UTM Zone 44N / EPSG:32644)
    grid_cell_size_m: float = 1000.0

    # Minimum fraction of valid (unmasked) 10m Sentinel-2 pixels required to retain a grid cell
    min_valid_pixel_ratio: float = 0.50

    # Antecedent weather lookback window (days before scene acquisition date)
    weather_lookback_days: int = 7

    # Forward/around temporal window (days) for associating NASA FIRMS active thermal detections
    # Note: Satellite thermal detections are NOT exhaustive ground-truth ignition labels.
    firms_lookahead_days: int = 5
    firms_min_confidence: Optional[str] = None  # e.g., "nominal" or "high" for VIIRS, or >=50 for MODIS

