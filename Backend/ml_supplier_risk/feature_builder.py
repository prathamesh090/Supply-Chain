# backend/ml/feature_builder.py
from typing import List
import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin

class FeatureBuilder(BaseEstimator, TransformerMixin):
    """
    Build model-ready features from raw supplier rows.
    This is used in both training and inference so behavior matches.
    """

    def __init__(self):
        self.numeric_features_: List[str] = [
            "delivery_delay_days",
            "defect_rate_pct",
            "price_variance_pct",
            "trust_score",
            "quantity"
        ]
        self.categorical_features_: List[str] = [
            "order_status",
            "supplier",
            "plastic_type"
        ]

    @staticmethod
    def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df.columns = (
            df.columns.astype(str)
              .str.strip()
              .str.replace(" ", "_")
              .str.replace("-", "_")
              .str.lower()
        )
        # handle common typos/variants
        rename_map = {
            "compilance": "compliance",
            "orderdate": "order_date",
            "deliverydate": "delivery_date",
            "plastic_types": "plastic_type",
            "plastic": "plastic_type",
        }
        df = df.rename(columns=rename_map)
        return df

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        df = pd.DataFrame(X).copy()
        df = self._normalize_columns(df)

        # Ensure expected columns exist
        for col in ["order_date", "delivery_date", "order_status",
                    "quantity", "unit_price", "negotiated_price",
                    "defective_units", "compliance", "trust_score",
                    "supplier", "plastic_type"]:
            if col not in df.columns:
                df[col] = np.nan

        # Parse dates
        df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")
        df["delivery_date"] = pd.to_datetime(df["delivery_date"], errors="coerce")

        # Delivery delay (days), no negative (early delivery -> 0)
        df["delivery_delay_days"] = (
            (df["delivery_date"] - df["order_date"]).dt.days
        ).fillna(0).clip(lower=0)

        # Numeric safe casts
        for col in ["quantity", "unit_price", "negotiated_price", "defective_units", "trust_score"]:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        # Defect rate %
        df["defect_rate_pct"] = 0.0
        qmask = df["quantity"] > 0
        df.loc[qmask, "defect_rate_pct"] = (df.loc[qmask, "defective_units"] / df.loc[qmask, "quantity"]) * 100
        df["defect_rate_pct"] = df["defect_rate_pct"].clip(lower=0, upper=100)

        # Price variance % (only if paying more than negotiated)
        df["price_variance_pct"] = 0.0
        pmask = df["negotiated_price"] > 0
        df.loc[pmask, "price_variance_pct"] = (
            (df.loc[pmask, "unit_price"] - df.loc[pmask, "negotiated_price"])
            / df.loc[pmask, "negotiated_price"]
        ) * 100
        df["price_variance_pct"] = df["price_variance_pct"].clip(lower=0)

        # Normalize compliance → Yes/No
        comp = df["compliance"].astype(str).str.strip().str.lower()
        df["compliance_flag"] = comp.isin(["yes", "y", "true", "1"]).astype(int)

        # For cancelled orders, add strong delivery penalty (the model will learn this)
        status = df["order_status"].astype(str).str.strip().str.lower()
        cancelled_mask = status.eq("cancelled")
        df.loc[cancelled_mask, "delivery_delay_days"] = np.maximum(
            df.loc[cancelled_mask, "delivery_delay_days"], 10
        )

        # Minimal set the model will consume
        out = pd.DataFrame({
            "delivery_delay_days": df["delivery_delay_days"],
            "defect_rate_pct": df["defect_rate_pct"],
            "price_variance_pct": df["price_variance_pct"],
            "trust_score": df["trust_score"],
            "quantity": df["quantity"],
            "order_status": df["order_status"].astype(str).fillna("Unknown"),
            "supplier": df["supplier"].astype(str).fillna("Unknown"),
            "plastic_type": df["plastic_type"].astype(str).fillna("Unknown"),
            # keep raw compliance flag as numeric too (helps)
            "compliance_flag": df["compliance_flag"]
        })

        # Include compliance_flag in numeric features if missing
        if "compliance_flag" not in self.numeric_features_:
            self.numeric_features_.append("compliance_flag")

        return out

    def numeric_features(self) -> List[str]:
        return self.numeric_features_

    def categorical_features(self) -> List[str]:
        return self.categorical_features_
