"""
Main Sentinel-2 Preprocessing Pipeline for ForestFusion.
Orchestrates validation, alignment, SCL quality masking, index computation,
and structured metadata logging.
"""

import sys
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List

from .config import PreprocessingConfig, STUDY_AREA_METADATA, REQUIRED_BANDS
from .validators import validate_scene_inputs, validate_band_compatibility, ValidationError
from .raster_io import (
    read_raster_metadata,
    read_band_array,
    write_geotiff,
    check_rasterio_installed
)
from .alignment import align_band_to_reference
from .masking import convert_dn_to_surface_reflectance, create_scl_quality_mask
from .indices import compute_ndvi, compute_ndmi, compute_nbr

# Configure clean logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ForestFusion.Sentinel2Pipeline")


class Sentinel2PreprocessingPipeline:
    """
    Modular, reproducible preprocessing pipeline for Copernicus Sentinel-2 L2A imagery.
    """

    def __init__(self, config: Optional[PreprocessingConfig] = None):
        self.config = config or PreprocessingConfig()
        # Ensure directory paths exist
        self.config.raw_dir.mkdir(parents=True, exist_ok=True)
        self.config.interim_dir.mkdir(parents=True, exist_ok=True)
        self.config.processed_dir.mkdir(parents=True, exist_ok=True)
        self.config.metadata_dir.mkdir(parents=True, exist_ok=True)

    def run_scene_preprocessing(self, scene_input_dir: Optional[Path] = None) -> Dict[str, Any]:
        """
        Execute full preprocessing on a target Sentinel-2 scene.
        
        Parameters:
            scene_input_dir: Directory containing the scene GeoTIFF bands.
                             Defaults to self.config.raw_dir if None.
                             
        Returns:
            Dictionary containing processing status, output file paths, and audit metadata.
        """
        check_rasterio_installed()
        target_dir = scene_input_dir or self.config.raw_dir
        logger.info(f"Initiating Sentinel-2 preprocessing check on directory: {target_dir}")

        # 1. Validation: Discover input files
        is_valid, band_paths, issues = validate_scene_inputs(target_dir)
        if not is_valid:
            error_msg = "\n".join(f"  - {issue}" for issue in issues)
            logger.error(
                f"Scene validation failed for {target_dir}:\n{error_msg}\n\n"
                f">> Action Required: Please place real Sentinel-2 Level-2A GeoTIFF files "
                f"(B04, B08, B11, B12, and SCL) in '{target_dir}'.\n"
                ">> The pipeline will NOT fabricate synthetic imagery or missing bands."
            )
            return {
                "status": "FAILED_MISSING_INPUTS",
                "target_directory": str(target_dir),
                "issues": issues,
                "found_bands": {b: str(p) for b, p in band_paths.items()},
                "processed_at": datetime.now(timezone.utc).isoformat()
            }

        logger.info(f"Successfully validated all required bands: {list(band_paths.keys())}")

        # Derive a Scene Identifier (from folder name or common filename prefix)
        scene_id = target_dir.name if target_dir != self.config.raw_dir else "scene_" + datetime.now().strftime("%Y%m%d_%H%M%S")

        # 2. Read Metadata for each band
        logger.info("Reading spatial and radiometric metadata across all bands...")
        band_meta_map: Dict[str, Dict[str, Any]] = {}
        for band_name, path in band_paths.items():
            band_meta_map[band_name] = read_raster_metadata(path)

        # 3. Check Geographic & CRS Compatibility
        compat_valid, compat_issues = validate_band_compatibility(band_meta_map)
        if not compat_valid:
            error_msg = "\n".join(f"  - {ci}" for ci in compat_issues)
            logger.error(f"Geographic compatibility validation failed:\n{error_msg}")
            raise ValidationError(f"Band compatibility check failed:\n{error_msg}")

        # Select Reference Band (Anchor Grid, default: B04 at 10m)
        ref_band_name = self.config.reference_band
        if ref_band_name not in band_meta_map:
            ref_band_name = "B04"
        ref_meta = band_meta_map[ref_band_name]

        logger.info(
            f"Using {ref_band_name} as reference grid: "
            f"Dimensions={ref_meta['width']}x{ref_meta['height']}, "
            f"Resolution={ref_meta['resolution']}m, CRS={ref_meta['crs']}"
        )

        # 4. Grid Alignment and Resampling onto 10m Unified Grid
        logger.info("Harmonizing and aligning bands onto reference grid...")
        aligned_bands: Dict[str, Any] = {}
        scene_interim_dir = self.config.interim_dir / scene_id
        scene_interim_dir.mkdir(parents=True, exist_ok=True)

        for band_name, file_path in band_paths.items():
            is_cat = (band_name == "SCL")
            logger.info(f"  - Aligning {band_name} (Categorical={is_cat})...")
            aligned_array = align_band_to_reference(
                src_path=file_path,
                ref_meta=ref_meta,
                is_categorical=is_cat
            )
            aligned_bands[band_name] = aligned_array

            # Save intermediate aligned band
            interim_path = scene_interim_dir / f"{band_name}_aligned_10m.tif"
            write_geotiff(
                output_path=interim_path,
                array=aligned_array,
                transform=ref_meta["transform"],
                crs=ref_meta["crs"],
                nodata=ref_meta["nodata"] if ref_meta["nodata"] is not None else -9999.0,
                dtype="uint16" if band_name != "SCL" else "uint8"
            )

        # 5. SCL Quality Masking
        logger.info("Evaluating Scene Classification Layer (SCL) quality mask...")
        scl_array = aligned_bands["SCL"]
        valid_mask, scl_stats = create_scl_quality_mask(
            scl_array=scl_array,
            valid_classes=self.config.valid_scl_classes
        )
        logger.info(f"  - SCL Terrestrial Valid Pixels: {scl_stats['valid_percentage']}% of scene")

        # Save SCL valid mask raster in interim folder
        mask_path = scene_interim_dir / "valid_mask.tif"
        write_geotiff(
            output_path=mask_path,
            array=valid_mask.astype("uint8"),
            transform=ref_meta["transform"],
            crs=ref_meta["crs"],
            nodata=0,
            dtype="uint8"
        )

        # 6. Reflectance Scaling
        logger.info("Converting Digital Numbers to Bottom-of-Atmosphere (BOA) Surface Reflectance...")
        logger.info(
            f"  - Scale Factor: {self.config.quantification_value}, "
            f"BOA Offset: {self.config.boa_add_offset}"
        )
        refl_bands: Dict[str, Any] = {}
        for band_name in ["B04", "B08", "B11", "B12"]:
            refl_bands[band_name] = convert_dn_to_surface_reflectance(
                dn_array=aligned_bands[band_name],
                scale_factor=self.config.quantification_value,
                boa_offset=self.config.boa_add_offset,
                clamp_to_physical=self.config.clamp_reflectance
            )

        # 7. Compute Spectral Indices
        logger.info("Calculating research spectral indices with quality masking...")
        scene_processed_dir = self.config.processed_dir / scene_id
        scene_processed_dir.mkdir(parents=True, exist_ok=True)

        # 7a. NDVI
        logger.info("  - Computing NDVI (B08, B04)...")
        ndvi_arr, ndvi_stats = compute_ndvi(
            b08=refl_bands["B08"],
            b04=refl_bands["B04"],
            valid_mask=valid_mask,
            nodata_value=self.config.nodata_value
        )
        ndvi_path = scene_processed_dir / "NDVI.tif"
        write_geotiff(
            output_path=ndvi_path,
            array=ndvi_arr,
            transform=ref_meta["transform"],
            crs=ref_meta["crs"],
            nodata=self.config.nodata_value,
            dtype="float32",
            compression=self.config.compression
        )

        # 7b. NDMI
        logger.info("  - Computing NDMI (B08, B11)...")
        ndmi_arr, ndmi_stats = compute_ndmi(
            b08=refl_bands["B08"],
            b11=refl_bands["B11"],
            valid_mask=valid_mask,
            nodata_value=self.config.nodata_value
        )
        ndmi_path = scene_processed_dir / "NDMI.tif"
        write_geotiff(
            output_path=ndmi_path,
            array=ndmi_arr,
            transform=ref_meta["transform"],
            crs=ref_meta["crs"],
            nodata=self.config.nodata_value,
            dtype="float32",
            compression=self.config.compression
        )

        # 7c. NBR
        logger.info("  - Computing NBR (B08, B12)...")
        nbr_arr, nbr_stats = compute_nbr(
            b08=refl_bands["B08"],
            b12=refl_bands["B12"],
            valid_mask=valid_mask,
            nodata_value=self.config.nodata_value
        )
        nbr_path = scene_processed_dir / "NBR.tif"
        write_geotiff(
            output_path=nbr_path,
            array=nbr_arr,
            transform=ref_meta["transform"],
            crs=ref_meta["crs"],
            nodata=self.config.nodata_value,
            dtype="float32",
            compression=self.config.compression
        )

        # 8. Structured Metadata Audit Generation
        logger.info("Generating comprehensive processing metadata manifest...")
        metadata_manifest: Dict[str, Any] = {
            "scene_id": scene_id,
            "study_area": STUDY_AREA_METADATA,
            "processed_timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "pipeline_version": "1.0.0",
            "spatial_reference": {
                "crs": str(ref_meta["crs"]),
                "crs_epsg": ref_meta.get("crs_epsg"),
                "grid_resolution_meters": self.config.target_resolution_m,
                "raster_dimensions": {
                    "width": ref_meta["width"],
                    "height": ref_meta["height"]
                },
                "bounds_extent": ref_meta["bounds"],
                "affine_transform": list(ref_meta["transform"])
            },
            "source_files": {b: str(p.resolve()) for b, p in band_paths.items()},
            "reflectance_calibration": {
                "quantification_value": self.config.quantification_value,
                "boa_add_offset": self.config.boa_add_offset,
                "clamped_to_physical": self.config.clamp_reflectance,
                "formula": "Reflectance = (DN + BOA_ADD_OFFSET) / QUANTIFICATION_VALUE"
            },
            "quality_masking_policy": {
                "layer": "Scene Classification Layer (SCL)",
                "retained_valid_classes": sorted(list(self.config.valid_scl_classes)),
                "retained_class_names": ["VEGETATION (4)", "NOT_VEGETATED (5)"],
                "excluded_classes_policy": "Masked out classes 0 (No Data), 1 (Defective), 2 (Dark Area), 3 (Cloud Shadow), 6 (Water), 7 (Unclassified), 8 (Cloud Med Prob), 9 (Cloud High Prob), 10 (Thin Cirrus), 11 (Snow/Ice)",
                "mask_statistics": scl_stats
            },
            "derived_indices": {
                "NDVI": {
                    "formula": "(B08 - B04) / (B08 + B04)",
                    "file_path": str(ndvi_path.resolve()),
                    "statistics": ndvi_stats
                },
                "NDMI": {
                    "formula": "(B08 - B11) / (B08 + B11)",
                    "file_path": str(ndmi_path.resolve()),
                    "statistics": ndmi_stats
                },
                "NBR": {
                    "formula": "(B08 - B12) / (B08 + B12)",
                    "file_path": str(nbr_path.resolve()),
                    "statistics": nbr_stats
                }
            },
            "intermediate_layers": {
                "interim_directory": str(scene_interim_dir.resolve()),
                "mask_file": str(mask_path.resolve())
            }
        }

        metadata_path = self.config.metadata_dir / f"{scene_id}_metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata_manifest, f, indent=2)

        logger.info(f"Processing successfully completed! Manifest saved to: {metadata_path}")

        return {
            "status": "SUCCESS",
            "scene_id": scene_id,
            "metadata_file": str(metadata_path),
            "output_indices": {
                "NDVI": str(ndvi_path),
                "NDMI": str(ndmi_path),
                "NBR": str(nbr_path)
            },
            "interim_dir": str(scene_interim_dir)
        }


def main():
    """Command-line entry point to execute the pipeline manually."""
    import argparse
    parser = argparse.ArgumentParser(
        description="ForestFusion Sentinel-2 Preprocessing Pipeline (Amrabad Tiger Reserve)"
    )
    parser.add_argument(
        "--input-dir",
        type=str,
        default=None,
        help="Path to folder containing raw Sentinel-2 GeoTIFF bands (defaults to data/raw/sentinel2)"
    )
    args = parser.parse_args()

    input_path = Path(args.input_dir) if args.input_dir else None
    pipeline = Sentinel2PreprocessingPipeline()
    result = pipeline.run_scene_preprocessing(input_path)
    
    if result["status"] == "SUCCESS":
        print("\nPipeline execution completed successfully.")
        print(f"Metadata manifest: {result['metadata_file']}")
    else:
        print(f"\nPipeline status: {result['status']}")


if __name__ == "__main__":
    main()
