# ForestFusion Step 3: Offline Dataset Audit, Spatiotemporal Splitting & XGBoost Training

This module is completely isolated from the live FastAPI backend (`backend/`). It operates strictly on real, preprocessed research datasets produced by Steps 1 and 2 (`data/processed/dataset/amrabad_2024_dataset.csv`).

---

## 1. Modules Overview

- **`dataset_audit.py`**: Inspects `amrabad_2024_dataset.csv` for missingness, spatial/temporal coverage, feature distributions, and class imbalance. Outputs `data/metadata/dataset/eda_audit.json`.
- **`split_strategy.py`**: Implements leakage-free splitting:
  - `temporal_holdout_split`: Chronological split by `acquisition_date` when multiple dates exist.
  - `spatial_block_split`: Macro-block (`~5.5 km`) `GroupShuffleSplit` so adjacent `1 km` grid cells do not leak between train and test sets.
- **`train_xgboost.py`**: Trains a Logistic Regression baseline, an imbalance-aware `XGBClassifier` (`scale_pos_weight`), applies **Platt Sigmoid Calibration**, evaluates with ROC-AUC, PR-AUC, Brier Score, Precision, Recall, F1, and computes **TreeSHAP** global feature importances. Saves artifacts to `research/modeling/artifacts/`.

---

## 2. Manual Execution Order (After Steps 1 & 2)

```bash
# 1. Install modeling dependencies
pip install -r research/modeling/requirements.txt

# 2. Audit the merged dataset
python -m research.modeling.dataset_audit

# 3. Train baseline + calibrated XGBoost + TreeSHAP evaluation
python -m research.modeling.train_xgboost
```
