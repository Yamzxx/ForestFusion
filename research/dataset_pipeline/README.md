# ForestFusion: Sentinel-2 Satellite Preprocessing Pipeline

This module implements the reproducible, modular foundation for ingesting, validating, aligning, quality-masking, and computing spectral indices from **Copernicus Sentinel-2 Level-2A (L2A)** multispectral satellite imagery.

It is designed as an independent research engineering pipeline for our initial study area: **Amrabad Tiger Reserve, Telangana, India** (covering the Nallamala forest landscape, approximately 16.1°N to 16.6°N, 78.7°E to 79.4°E, native Sentinel-2 UTM Zone 44N / EPSG:32644).

---

## 1. Directory Structure

```text
data/
├── raw/
│   └── sentinel2/       <-- PLACE YOUR RAW SENTINEL-2 RASTER FILES HERE
├── interim/
│   └── sentinel2/       <-- GENERATED: Resampled, harmonized, and quality-masked bands
├── processed/
│   └── sentinel2/       <-- GENERATED: Final calibrated index GeoTIFFs (NDVI, NDMI, NBR)
└── metadata/
    └── sentinel2/       <-- GENERATED: Detailed JSON processing and audit metadata
```

### Purpose of Each Directory
- **`data/raw/sentinel2/`**: Read-only landing folder for raw Sentinel-2 L2A GeoTIFF bands. The pipeline **never modifies or deletes** files placed here.
- **`data/interim/sentinel2/`**: Holds intermediate preprocessed raster layers. Because B04/B08 are 10m and B11/B12/SCL are 20m, this folder stores bands resampled onto a unified grid with reflectance conversion and valid data masks applied. Keeping them separate enables visual inspection in QGIS/GIS tools before index derivation.
- **`data/processed/sentinel2/`**: Stores final, research-ready spectral index rasters (`NDVI.tif`, `NDMI.tif`, `NBR.tif`) encoded as `float32` GeoTIFFs with proper CRS, affine geotransform, and nodata definitions.
- **`data/metadata/sentinel2/`**: Stores machine-readable JSON execution manifests detailing input file hashes/paths, CRS, bounding boxes, pixel resolutions, SCL mask statistics, and scale factor configurations.

---

## 2. Supported Bands & Input Requirements

The pipeline expects **Level-2A (Bottom-Of-Atmosphere / Surface Reflectance)** raster inputs (GeoTIFF `.tif` or `.jp2` converted to GeoTIFF):

| Band Name | Description | Native Resolution | Primary Role in ForestFusion |
|---|---|---|---|
| **B04** | Red (~665 nm) | 10 meters | Chlorophyll absorption; baseline for NDVI |
| **B08** | Near Infrared (NIR, ~842 nm) | 10 meters | Mesophyll cell leaf reflectance; canopy density |
| **B11** | Shortwave Infrared 1 (SWIR-1, ~1610 nm) | 20 meters | Canopy fuel moisture absorption; key for NDMI |
| **B12** | Shortwave Infrared 2 (SWIR-2, ~2190 nm) | 20 meters | Hydroxyl & post-fire char/ash absorption; key for NBR |
| **SCL** | Scene Classification Layer | 20 meters | Pixel-level quality, cloud, shadow & land classification |

### How to Name and Place Raw Files
Place your bands in `data/raw/sentinel2/` for a specific acquisition date. The pipeline automatically scans and detects bands using flexible regex patterns. 

**Recommended naming examples:**
- Flat files: `Amrabad_20240315_B04.tif`, `Amrabad_20240315_B08.tif`, `Amrabad_20240315_B11.tif`, `Amrabad_20240315_B12.tif`, `Amrabad_20240315_SCL.tif`
- Standard Copernicus SAFE exports: `T44QND_20240315T052641_B04_10m.jp2` (or `.tif`)
- Subfolder organization: You may also organize by scene subdirectories (e.g., `data/raw/sentinel2/2024-03-15/`).

---

## 3. Reflectance Scaling & Baseline Specifications

Sentinel-2 Level-2A products package surface reflectance values as 16-bit unsigned integers (`uint16` Digital Numbers, DN) to optimize storage:
$$\text{Reflectance} = \frac{\text{DN} + \text{BOA\_ADD\_OFFSET}}{\text{QUANTIFICATION\_VALUE}}$$

### Baseline Notice (ESA PB 04.00+):
- **For imagery processed before January 25, 2022 (Processing Baseline < 04.00)**:
  - `QUANTIFICATION_VALUE` = `10000.0`
  - `BOA_ADD_OFFSET` = `0.0`
  - $\text{Reflectance} = \frac{\text{DN}}{10000.0}$
- **For imagery processed after January 25, 2022 (Processing Baseline >= 04.00, including all 2024 data)**:
  - ESA introduced an offset to preserve negative reflectance values caused by dark surface/atmospheric noise.
  - `QUANTIFICATION_VALUE` = `10000.0`
  - `BOA_ADD_OFFSET` = `-1000.0`
  - $\text{Reflectance} = \frac{\text{DN} - 1000.0}{10000.0}$
- **Pipeline Implementation**: The pipeline allows configuring or automatically detecting the processing baseline. Default assumes 2024 L2A data with `offset = -1000.0` and `scale = 10000.0`. Valid reflectance is clamped to $[0.0, 1.0]$.

---

## 4. Quality Masking via Scene Classification Layer (SCL)

Sentinel-2 L2A provides a 20-meter Scene Classification Layer (SCL) with 12 discrete integer classes:

| Class Value | Class Label | Masking Action | Scientific Rationale |
|---|---|---|---|
| **0** | NO_DATA | **Masked (Invalid)** | Unobserved or border pixels. |
| **1** | SATURATED_OR_DEFECTIVE | **Masked (Invalid)** | Optical sensor saturation; corrupted radiance. |
| **2** | DARK_AREA_PIXELS | **Masked (Invalid)** | Topographic cast shadows or deep terrain darkness. |
| **3** | CLOUD_SHADOWS | **Masked (Invalid)** | Severe spectral attenuation in NIR & SWIR; creates false drought/burn signals. |
| **4** | VEGETATION | **Retained (Valid)** | Core forested and vegetative canopy target. |
| **5** | NOT_VEGETATED | **Retained (Valid)** | Bare soil, dry ground, rocks; vital for background fuel & soil moisture context. |
| **6** | WATER | **Masked (Invalid)** | Water bodies distort NDMI/NBR ratios and are non-combustible. |
| **7** | UNCLASSIFIED | **Masked (Invalid)** | Ambiguous spectral signature; low classification confidence. |
| **8** | CLOUD_MEDIUM_PROBABILITY | **Masked (Invalid)** | Atmospheric contamination. |
| **9** | CLOUD_HIGH_PROBABILITY | **Masked (Invalid)** | Opaque cloud cover completely obscures surface reflectance. |
| **10** | THIN_CIRRUS | **Masked (Invalid)** | Semi-transparent ice crystals; distorts shortwave infrared bands. |
| **11** | SNOW_OR_ICE | **Masked (Invalid)** | Irrelevant to tropical deciduous forest in Telangana; severe high reflectance. |

### Limitations of SCL Masking (Documented for Research Rigor):
1. **Cloud Edge Leakage**: The automated ESA sen2cor algorithm often fails to detect diffuse edges or sub-pixel cloud fringes around convective clouds.
2. **False Cloud Detections on Bare Rock**: In semi-arid regions and rocky cliffs (common in the Nallamala hills), highly reflective exposed granite or chalky limestone is occasionally misclassified as cloud (Class 8/9).
3. **Topographic Shadow Confusion**: Steep ravines may be mislabeled as water (Class 6) or dark area (Class 2).
4. **Scene vs. Local Cloud Cover**: A scene reported as having "10% cloud cover" globally across its 100×100 km tile may still have 90% cloud cover directly over the Amrabad Tiger Reserve study polygon. Local masking via SCL is essential.

---

## 5. Spectral Indices Computed

All indices are computed only on unmasked, geometrically aligned valid terrestrial pixels:

1. **Normalized Difference Vegetation Index (NDVI)**:
   $$\text{NDVI} = \frac{\text{B08} - \text{B04}}{\text{B08} + \text{B04}}$$
   *Measures canopy chlorophyll absorption, photosynthetic greenness, and vegetative vigor.*

2. **Normalized Difference Moisture Index (NDMI)**:
   $$\text{NDMI} = \frac{\text{B08} - \text{B11}}{\text{B08} + \text{B11}}$$
   *Measures liquid water content in the vegetative canopy. Declining NDMI directly indicates fuel dehydration and elevated wildfire flammability.*

3. **Normalized Burn Ratio (NBR)**:
   $$\text{NBR} = \frac{\text{B08} - \text{B12}}{\text{B08} + \text{B12}}$$
   *Sensitive to living vegetation moisture (B08) vs. charcoal, ash, and dry combustible biomass (B12). Essential for both pre-fire fuel build-up and post-fire burn scar severity assessment.*

### Division Safeguards:
- Evaluates $|B08 + \text{Band}_{x}| \ge 10^{-6}$. If denominator is zero or near-zero, the pixel is assigned `NaN`.
- Resulting indices are strictly bounded to $[-1.0, +1.0]$. Values outside this physical range are flagged and masked.

---

## 6. Grid Harmonization & Resampling Strategy

- **Target Grid**: 10 meters (matches the high spatial resolution of B04 and B08).
- **Continuous Reflectance Bands (B11, B12)**: Resampled from 20m to 10m using **Bilinear Interpolation** to preserve smooth physical radiative gradients without introducing high-frequency ringing.
- **Categorical SCL Layer**: Resampled from 20m to 10m using **Nearest-Neighbor Interpolation** to prevent illegal blended intermediate values (e.g., blending Class 3 Cloud Shadow and Class 5 Bare Soil into 4 Vegetation).

---

## 7. Step 2: Spatial Grid, Weather & FIRMS Integration (`dataset_builder.py`)

Once Step 1 (`pipeline.py`) has generated clean `NDVI.tif`, `NDMI.tif`, and `NBR.tif` rasters in `data/processed/sentinel2/`, Step 2 constructs the spatiotemporal tabular dataset:

1. **Spatial Grid (`aoi_grid.py`)**:
   - Divides the Amrabad Tiger Reserve AOI into deterministic **1 km × 1 km UTM Zone 44N (`EPSG:32644`)** grid cells.
   - Extracts zonal statistics (`mean`, `std`, `p10`, `p50`, `p90`, `valid_pixel_ratio`) per cell.
   - Automatically excludes cells where fewer than **50%** of 10m pixels are valid (unmasked) to prevent cloud-contaminated samples.

2. **Historical Weather (`weather_ingestion.py`)**:
   - Reads local weather CSVs from `data/raw/weather/` or queries the **Open-Meteo Historical Weather Archive API** for the scene acquisition date and a 7-day antecedent lookback window (`temp_max_c`, `rh_min_pct`, `wind_max_kmh`, `precip_sum_7d_mm`, `dry_days_7d`).

3. **NASA FIRMS Thermal Anomalies (`firms_ingestion.py`)**:
   - Reads real NASA FIRMS VIIRS/MODIS archive CSVs placed in `data/raw/firms/`.
   - Aggregates satellite-detected active fire hotspots (`firms_detection_count`, `firms_max_frp_mw`, `firms_has_detection`) per grid cell within a configurable lookahead window.
   - **Scientific Caveat**: `firms_has_detection` represents *satellite thermal anomaly detections*, NOT exhaustive ground-truth wildfire labels.

4. **Manual Execution Order**:
   ```bash
   # Step 1: Preprocess raw Sentinel-2 GeoTIFFs
   python -m research.dataset_pipeline.pipeline

   # Step 2: Build merged spatiotemporal dataset
   python -m research.dataset_pipeline.dataset_builder
   ```
   Outputs are saved to `data/processed/dataset/amrabad_2024_dataset.csv` and `data/metadata/dataset/dataset_manifest.json`.

