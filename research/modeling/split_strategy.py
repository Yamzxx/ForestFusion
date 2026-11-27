"""
Step 3B: Spatiotemporal Train/Test Splitting Utilities.
Avoids naive random splitting to prevent spatial autocorrelation and temporal leakage.
"""

from typing import Tuple, Any
import numpy as np


def create_spatial_block_ids(df: Any, block_size_deg: float = 0.05) -> Any:
    """
    Assign each row to a coarse spatial macro-block (~5.5 km at 16°N)
    based on centroid_lat and centroid_lon so adjacent 1 km cells stay together
    during cross-validation or train/test splitting.
    """
    lat_bin = np.floor(df["centroid_lat"] / block_size_deg).astype(int)
    lon_bin = np.floor(df["centroid_lon"] / block_size_deg).astype(int)
    return lat_bin.astype(str) + "_" + lon_bin.astype(str)


def temporal_holdout_split(
    df: Any,
    date_col: str = "acquisition_date",
    test_fraction: float = 0.25
) -> Tuple[Any, Any]:
    """
    Split dataset chronologically by unique acquisition dates.
    Earlier dates form the training set; latest dates form the holdout test set.
    Requires at least 2 distinct dates; falls back to spatial_block_split if only 1 date exists.
    """
    unique_dates = sorted(df[date_col].dropna().unique().tolist())
    if len(unique_dates) < 2:
        raise ValueError(
            f"Temporal split requires >= 2 distinct acquisition dates, found {len(unique_dates)}. "
            "Use spatial_block_split() when evaluating on a single-date scene."
        )

    split_idx = max(1, int(len(unique_dates) * (1.0 - test_fraction)))
    split_idx = min(split_idx, len(unique_dates) - 1)

    train_dates = set(unique_dates[:split_idx])
    test_dates = set(unique_dates[split_idx:])

    train_df = df[df[date_col].isin(train_dates)].copy()
    test_df = df[df[date_col].isin(test_dates)].copy()
    return train_df, test_df


def spatial_block_split(
    df: Any,
    test_size: float = 0.25,
    block_size_deg: float = 0.05,
    random_state: int = 42
) -> Tuple[Any, Any]:
    """
    Split dataset by spatial macro-blocks using GroupShuffleSplit so neighboring
    grid cells do not leak between train and test splits.
    """
    from sklearn.model_selection import GroupShuffleSplit

    groups = create_spatial_block_ids(df, block_size_deg=block_size_deg)
    splitter = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
    train_idx, test_idx = next(splitter.split(df, groups=groups))
    return df.iloc[train_idx].copy(), df.iloc[test_idx].copy()
