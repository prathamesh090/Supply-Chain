from typing import Dict, Any, Optional

from risk_integration.financial_service import get_financial_risk_for_supplier
from plastic_inherent_risk.supplier_repository import get_supplier_index
from supplier_registry.repository import get_supplier_by_id


FINANCIAL_WEIGHT = 0.6
INHERENT_WEIGHT = 0.4


def _risk_level_from_score(score: float) -> str:
    if score >= 70:
        return "High"
    elif score >= 40:
        return "Medium"
    return "Low"


def compute_integrated_risk(supplier_id: str) -> Dict[str, Any]:
    """
    Combines Financial + Inherent Risk into a unified score.
    """

    supplier = get_supplier_by_id(supplier_id)
    if not supplier:
        return {
            "status": "not_found",
            "message": "Supplier not found in registry."
        }

    supplier_name = supplier["supplier_name"]

    # Financial Risk
    financial = get_financial_risk_for_supplier(supplier_name)

    # Inherent Rolling Risk
    inherent_index = get_supplier_index(supplier_id)

    financial_score = financial.get("risk_score", 0) if financial["status"] == "ok" else 0
    inherent_score = inherent_index.get("rolling_risk_score", 0) if inherent_index else 0

    # Integrated Score
    integrated_score = round(
        (FINANCIAL_WEIGHT * financial_score) +
        (INHERENT_WEIGHT * inherent_score),
        2
    )

    integrated_level = _risk_level_from_score(integrated_score)

    return {
        "status": "ok",
        "supplier_id": supplier_id,
        "supplier_name": supplier_name,

        "financial_risk": financial if financial["status"] == "ok" else None,
        "inherent_risk": inherent_index,

        "integrated_risk_score": integrated_score,
        "integrated_risk_level": integrated_level,

        "integration_metadata": {
            "financial_weight": FINANCIAL_WEIGHT,
            "inherent_weight": INHERENT_WEIGHT,
            "integration_version": "v1"
        }
    }
