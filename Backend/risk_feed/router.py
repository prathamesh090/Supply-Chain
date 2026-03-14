from fastapi import APIRouter, HTTPException

from .risk_feed_engine import compute_risk_feed
from .schemas import RiskFeedResponse


router = APIRouter(
    prefix="/api/risk-feed",
    tags=["Unified Risk Feed"]
)


@router.get("/{supplier_id}", response_model=RiskFeedResponse)
def get_risk_feed(supplier_id: str):
    result = compute_risk_feed(supplier_id)

    if result.get("status") == "not_found":
        raise HTTPException(
            status_code=404,
            detail=result.get("message", f"Supplier '{supplier_id}' not found")
        )

    if "final_risk_score" not in result:
        raise HTTPException(
            status_code=500,
            detail="Unable to compute risk feed for supplier"
        )

    return result
