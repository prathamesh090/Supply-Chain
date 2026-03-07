from fastapi import APIRouter

from .risk_feed_engine import compute_risk_feed
from .schemas import RiskFeedResponse


router = APIRouter(
    prefix="/api/risk-feed",
    tags=["Unified Risk Feed"]
)


@router.get("/{supplier_id}", response_model=RiskFeedResponse)
def get_risk_feed(supplier_id: str):

    return compute_risk_feed(supplier_id)