from fastapi import APIRouter

from .event_repository import get_recent_events
from .event_schemas import RiskEventListResponse


router = APIRouter(
    prefix="/api/risk-events",
    tags=["Risk Event Monitoring"]
)


@router.get("/recent", response_model=RiskEventListResponse)
def get_recent_risk_events():

    events = get_recent_events()

    return {"events": events}