"""
Step 3C: Offline Baseline & XGBoost Training, Platt Calibration, and TreeSHAP Evaluation.
Runs strictly on real data in data/processed/dataset/amrabad_2024_dataset.csv.
Saves research artifacts to research/modeling/artifacts/ (isolated from live backend).
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

from .split_strategy import temporal_holdout_split, spatial_block_split

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ForestFusion.TrainXGBoost")

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_DATASET_PATH = WORKSPACE_ROOT / "data" / "processed" / "dataset" / "amrabad_2024_dataset.csv"
DEFAULT_ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"

CANDIDATE_FEATURE_COLS: List[str] = [
    "ndvi_mean",
    "ndmi_mean",
    "nbr_mean",
    "ndvi_std",
    "ndmi_std",
    "weather_temp_max_c",
    "weather_rh_min_pct",
    "weather_wind_max_kmh",
    "weather_precip_sum_7d_mm",
    "weather_dry_days_7d"
]


def _check_modeling_deps():
    missing = []
    for pkg in ["pandas", "numpy", "sklearn", "xgboost", "shap", "joblib"]:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        raise ImportError(
            f"Missing required modeling packages: {missing}.\n"
            "Install them manually via:\n"
            "    pip install -r research/modeling/requirements.txt"
        )


def _evaluate_binary_predictions(y_true, y_prob, threshold: float = 0.50) -> Dict[str, Any]:
    from sklearn.metrics import (
        roc_auc_score,
        average_precision_score,
        brier_score_loss,
        accuracy_score,
        precision_score,
        recall_score,
        f1_score,
        confusion_matrix
    )

    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])

    return {
        "roc_auc": round(float(roc_auc_score(y_true, y_prob)), 4),
        "pr_auc_average_precision": round(float(average_precision_score(y_true, y_prob)), 4),
        "brier_score": round(float(brier_score_loss(y_true, y_prob)), 4),
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "confusion_matrix_tn_fp_fn_tp": [int(x) for x in cm.ravel()]
    }


def train_and_evaluate(
    dataset_path: Optional[Path] = None,
    artifacts_dir: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Train Baseline Logistic Regression and XGBoost (+ Platt Scaling + TreeSHAP)
    on real Amrabad Tiger Reserve dataset.
    """
    _check_modeling_deps()
    import numpy as np
    import pandas as pd
    import joblib
    from sklearn.pipeline import Pipeline
    from sklearn.impute import SimpleImputer
    from sklearn.preprocessing import StandardScaler
    from sklearn.linear_model import LogisticRegression
    from sklearn.calibration import CalibratedClassifierCV
    from xgboost import XGBClassifier
    import shap

    csv_path = dataset_path or DEFAULT_DATASET_PATH
    out_dir = artifacts_dir or DEFAULT_ARTIFACTS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    if not csv_path.exists():
        logger.error(f"Dataset not found: '{csv_path}'. Run Step 1 and Step 2 first.")
        return {"status": "FAILED_DATASET_NOT_FOUND"}

    df = pd.read_csv(csv_path)
    target_col = "firms_has_detection"

    if target_col not in df.columns or df[target_col].isna().all():
        logger.error(
            "Target column 'firms_has_detection' is missing or entirely empty. "
            "Place real NASA FIRMS CSVs in data/raw/firms/ and re-run Step 2 (dataset_builder.py)."
        )
        return {"status": "FAILED_NO_TARGETS"}

    df = df[df[target_col].notna()].copy()
    df[target_col] = df[target_col].astype(int)

    unique_classes = sorted(df[target_col].unique().tolist())
    if len(unique_classes) < 2:
        logger.error(
            f"Dataset contains only class {unique_classes} in '{target_col}'. "
            "Both positive (1) and negative (0) examples are required for binary classification."
        )
        return {"status": "FAILED_SINGLE_CLASS", "classes_found": unique_classes}

    feature_cols = [c for c in CANDIDATE_FEATURE_COLS if c in df.columns and df[c].notna().any()]
    if not feature_cols:
        logger.error("No usable feature columns found in dataset.")
        return {"status": "FAILED_NO_FEATURES"}

    # Spatiotemporal split (chronological if >=2 dates, else spatial block)
    unique_dates = df["acquisition_date"].nunique() if "acquisition_date" in df.columns else 1
    if unique_dates >= 2:
        train_df, test_df = temporal_holdout_split(df, date_col="acquisition_date", test_fraction=0.25)
        split_method = "temporal_holdout"
    else:
        train_df, test_df = spatial_block_split(df, test_size=0.25)
        split_method = "spatial_block_holdout"

    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]

    if y_test.nunique() < 2 or y_train.nunique() < 2:
        logger.warning("Holdout split yielded single class in train or test; falling back to spatial_block_split.")
        train_df, test_df = spatial_block_split(df, test_size=0.25, random_state=7)
        X_train, y_train = train_df[feature_cols], train_df[target_col]
        X_test, y_test = test_df[feature_cols], test_df[target_col]
        split_method = "spatial_block_holdout"

    logger.info(
        f"Training with {len(feature_cols)} features | Split={split_method} | "
        f"Train={len(X_train)} rows (pos={int(y_train.sum())}) | "
        f"Test={len(X_test)} rows (pos={int(y_test.sum())})"
    )

    # 1. Baseline: Logistic Regression
    baseline_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42))
    ])
    baseline_pipe.fit(X_train, y_train)
    baseline_probs = baseline_pipe.predict_proba(X_test)[:, 1]
    baseline_metrics = _evaluate_binary_predictions(y_test, baseline_probs)

    # 2. XGBoost Classifier
    neg_count = int((y_train == 0).sum())
    pos_count = max(1, int((y_train == 1).sum()))
    scale_pos = neg_count / pos_count

    xgb_imputer = SimpleImputer(strategy="median")
    X_train_imp = xgb_imputer.fit_transform(X_train)
    X_test_imp = xgb_imputer.transform(X_test)

    xgb_model = XGBClassifier(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=4,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos,
        eval_metric="logloss",
        random_state=42
    )
    xgb_model.fit(X_train_imp, y_train)
    xgb_raw_probs = xgb_model.predict_proba(X_test_imp)[:, 1]
    xgb_raw_metrics = _evaluate_binary_predictions(y_test, xgb_raw_probs)

    # 3. Platt Sigmoid Calibration
    calibrated_xgb = CalibratedClassifierCV(xgb_model, method="sigmoid", cv=3)
    calibrated_xgb.fit(X_train_imp, y_train)
    xgb_cal_probs = calibrated_xgb.predict_proba(X_test_imp)[:, 1]
    xgb_cal_metrics = _evaluate_binary_predictions(y_test, xgb_cal_probs)

    # 4. TreeSHAP Global Feature Importance
    explainer = shap.TreeExplainer(xgb_model)
    shap_values = explainer.shap_values(X_test_imp)
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    shap_ranking = sorted(
        [
            {"feature": feat, "mean_abs_shap": round(float(val), 5)}
            for feat, val in zip(feature_cols, mean_abs_shap)
        ],
        key=lambda x: x["mean_abs_shap"],
        reverse=True
    )

    # 5. Save Artifacts (Research-Only)
    joblib.dump(baseline_pipe, out_dir / "baseline_logreg.joblib")
    joblib.dump({"imputer": xgb_imputer, "model": xgb_model, "calibrated": calibrated_xgb}, out_dir / "xgboost_calibrated.joblib")

    report = {
        "status": "SUCCESS",
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_path": str(csv_path.resolve()),
        "split_method": split_method,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "features_used": feature_cols,
        "scale_pos_weight": round(float(scale_pos), 3),
        "metrics": {
            "baseline_logistic_regression": baseline_metrics,
            "xgboost_uncalibrated": xgb_raw_metrics,
            "xgboost_platt_calibrated": xgb_cal_metrics
        },
        "treeshap_global_importance": shap_ranking,
        "scientific_caveat": "Model trained against NASA FIRMS thermal anomaly detections, not exhaustive ground-truth fire labels."
    }

    report_path = out_dir / "training_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    logger.info(f"Training & evaluation complete. Report saved to: {report_path}")
    return report


if __name__ == "__main__":
    train_and_evaluate()
