# schemas.py
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class Explainability(BaseModel):
    score_components: Dict[str, float]
    rules_version: str

class InherentRiskRequest(BaseModel):
    text: str
    supplier_id: Optional[str] = None

class InherentRiskResult(BaseModel):
    risk_category: str
    risk_level: str
    confidence: float
    risk_score: float

    normalized_score: float
    decayed_score: float
    decay_lambda: float

    explanation: str
    signals: List[str]
    explainability: Explainability

    time_horizon: str
    impact_areas: List[str]
    model_version: str
    created_at: datetime

class SupplierRiskIndex(BaseModel):
    supplier_id: str
    rolling_risk_score: float
    risk_level: str
    event_count: int
    category_breakdown: Dict[str, int]

class InherentRiskAPIResponse(BaseModel):
    status: str
    result: Optional[InherentRiskResult] = None
    supplier_risk_index: Optional[SupplierRiskIndex] = None
    message: Optional[str] = None
