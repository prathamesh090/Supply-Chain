from pydantic import BaseModel
from datetime import datetime


class RiskEvent(BaseModel):
    supplier_id: str
    event_text: str
    category: str
    risk_level: str
    source: str
    created_at: datetime


class RiskEventListResponse(BaseModel):
    events: list[RiskEvent]