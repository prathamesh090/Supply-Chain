from typing import Dict, Any

from risk_integration.financial_service import get_financial_risk_for_supplier
from plastic_inherent_risk.supplier_repository import get_supplier_index
from supplier_registry.repository import resolve_supplier_identifier
from datetime import datetime, timedelta

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

    supplier = resolve_supplier_identifier(supplier_id)
    if not supplier:
        return {
            "status": "not_found",
            "message": f"Supplier '{supplier_id}' not found in registry."
        }

    canonical_supplier_id = supplier["supplier_id"]
    supplier_name = supplier["supplier_name"]

    # Financial Risk
    financial = get_financial_risk_for_supplier(supplier_name)

    # Inherent Rolling Risk
    inherent_index = get_supplier_index(canonical_supplier_id)

    financial_score = financial.get("risk_score", 0) if financial["status"] == "ok" else 0
    inherent_score = inherent_index.get("rolling_risk_score", 0) if inherent_index else 0

    # Integrated Score
    integrated_score = round(
        (FINANCIAL_WEIGHT * financial_score) +
        (INHERENT_WEIGHT * inherent_score),
        2
    )

    integrated_level = _risk_level_from_score(integrated_score)

    # --------------------------
    # Planning Metadata
    # --------------------------

    valid_from = datetime.utcnow().date()
    valid_to = valid_from + timedelta(days=30)

    risk_scope = ["supplier"]

    if inherent_score >= 40:
        risk_scope.append("distribution")

    if integrated_score >= 50:
        risk_scope.append("inventory")

    return {
        "status": "ok",
        "supplier_id": canonical_supplier_id,
        "supplier_name": supplier_name,

        "financial_risk": financial if financial["status"] == "ok" else None,
        "inherent_risk": inherent_index,

        "integrated_risk_score": integrated_score,
        "integrated_risk_level": integrated_level,

        "risk_scope": risk_scope,
        "valid_from": str(valid_from),
        "valid_to": str(valid_to),

        "integration_metadata": {
            "financial_weight": FINANCIAL_WEIGHT,
            "inherent_weight": INHERENT_WEIGHT,
            "integration_version": "v1"
        }
    }
