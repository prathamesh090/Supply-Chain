from pydantic import BaseModel
from typing import List


class GlobalRiskEvent(BaseModel):
    event_id: str
    event_type: str
    risk_score: float
    risk_level: str

    affected_regions: List[str]
    affects: List[str]

    valid_from: str
    valid_to: str


class GlobalRiskResponse(BaseModel):
    status: str
    event_count: int
    events: List[GlobalRiskEvent]