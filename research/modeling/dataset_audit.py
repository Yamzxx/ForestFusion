"""
Step 3A: Research Dataset Quality & Exploratory Data Audit.
Inspects amrabad_2024_dataset.csv for missingness, spatial/temporal coverage,
feature distributions, and class imbalance prior to model training.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ForestFusion.DatasetAudit")

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_DATASET_PATH = WORKSPACE_ROOT / "data" / "processed" / "dataset" / "amrabad_2024_dataset.csv"
DEFAULT_AUDIT_OUTPUT = WORKSPACE_ROOT / "data" / "metadata" / "dataset" / "eda_audit.json"


def run_dataset_audit(
    dataset_path: Optional[Path] = None,
    output_path: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Audit the real merged spatiotemporal dataset without fabricating or altering data.
    """
    try:
        import pandas as pd
    except ImportError as exc:
        raise ImportError(
            "pandas is required for dataset auditing. Install via:\n"
            "    pip install -r research/modeling/requirements.txt"
        ) from exc

    csv_path = dataset_path or DEFAULT_DATASET_PATH
    out_path = output_path or DEFAULT_AUDIT_OUTPUT

    if not csv_path.exists():
        logger.error(
            f"Dataset not found at '{csv_path}'.\n"
            ">> Action Required: Run Step 1 (pipeline.py) and Step 2 (dataset_builder.py) "
            "on real Amrabad Tiger Reserve data first."
        )
        return {"status": "FAILED_DATASET_NOT_FOUND", "expected_path": str(csv_path)}

    df = pd.read_csv(csv_path)
    if df.empty:
        logger.error(f"Dataset '{csv_path}' is empty (0 rows).")
        return {"status": "FAILED_EMPTY_DATASET"}

    missing_summary = {
        col: {
            "missing_count": int(df[col].isna().sum()),
            "missing_pct": round(float(df[col].isna().mean() * 100.0), 2)
        }
        for col in df.columns
    }

    target_col = "firms_has_detection"
    target_summary: Dict[str, Any] = {"available": False}
    if target_col in df.columns and df[target_col].notna().any():
        valid_target = df[target_col].dropna()
        pos_count = int((valid_target == 1).sum())
        neg_count = int((valid_target == 0).sum())
        target_summary = {
            "available": True,
            "labeled_rows": int(valid_target.size),
            "positive_firms_detections": pos_count,
            "negative_no_detection": neg_count,
            "positive_rate_pct": round(float(pos_count / valid_target.size * 100.0), 3),
            "note": "Positive rows indicate satellite FIRMS thermal anomaly detections, not exhaustive ground truth."
        }

    numeric_cols = [
        c for c in [
            "ndvi_mean", "ndmi_mean", "nbr_mean",
            "weather_temp_max_c", "weather_rh_min_pct",
            "weather_wind_max_kmh", "weather_precip_sum_7d_mm"
        ]
        if c in df.columns
    ]
    feature_stats = {}
    for col in numeric_cols:
        s = df[col].dropna()
        if not s.empty:
            feature_stats[col] = {
                "count": int(s.size),
                "mean": round(float(s.mean()), 4),
                "std": round(float(s.std()), 4),
                "min": round(float(s.min()), 4),
                "median": round(float(s.median()), 4),
                "max": round(float(s.max()), 4)
            }

    audit_report = {
        "status": "SUCCESS",
        "audited_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_path": str(csv_path.resolve()),
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
        "unique_scenes": int(df["scene_id"].nunique()) if "scene_id" in df.columns else None,
        "unique_dates": sorted(df["acquisition_date"].dropna().unique().tolist()) if "acquisition_date" in df.columns else [],
        "unique_grid_cells": int(df["cell_id"].nunique()) if "cell_id" in df.columns else None,
        "target_distribution": target_summary,
        "feature_distributions": feature_stats,
        "missingness": missing_summary
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(audit_report, f, indent=2)

    logger.info(f"Dataset audit complete ({len(df)} rows). Report saved to: {out_path}")
    return audit_report


if __name__ == "__main__":
    run_dataset_audit()
