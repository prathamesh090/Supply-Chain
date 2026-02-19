from typing import Dict, Any
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
ML_PATH = BASE_DIR / "ml_supplier_risk"

sys.path.insert(0, str(ML_PATH))

from ml_supplier_risk.supplier_risk_predictor import SupplierRiskPredictor

# Singleton instance
_predictor = SupplierRiskPredictor()


def get_financial_risk_for_supplier(supplier_name: str) -> Dict[str, Any]:
    """
    Production-safe wrapper for financial/operational model.
    """

    input_data = {
        "supplier": supplier_name,
        "delivery_delay_days": 0,
        "defect_rate_pct": 0,
        "price_variance_pct": 0,
        "compliance_flag": 1,
        "trust_score": 50,
        "Plastic_Type": "Unknown",
        "defective_units": 0,
        "quantity": 1,
        "unit_price": 0,
        "negotiated_price": 0,
        "compliance": "Yes",
        "order_date": None,
        "delivery_date": None
    }

    result = _predictor.predict_single_supplier(input_data)

    return {
        "status": "ok",
        "supplier_name": supplier_name,
        "risk_score": result["risk_score"],
        "risk_level": result["predicted_risk"],
        "probabilities": result["probabilities"],
        "explanation": result["risk_summary"],
        "model_type": "financial_operational_xgboost_v1"
    }
