from pydantic import BaseModel
from typing import List


class RiskFeedResponse(BaseModel):

    supplier_id: str
    supplier_name: str

    supplier_risk_score: float
    supplier_risk_level: str

    global_risk_score: float
    global_event_count: int

    final_risk_score: float
    final_risk_level: str

    risk_scope: List[str]

    valid_from: str
    valid_to: str