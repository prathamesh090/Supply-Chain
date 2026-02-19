# risk_integration/schemas.py

from pydantic import BaseModel
from typing import Dict, Optional


# ---------- Financial Risk ----------

class FinancialRiskResponse(BaseModel):
    status: str
    supplier_name: str
    risk_score: float
    risk_level: str
    probabilities: Dict[str, float]
    explanation: str
    model_type: str


# ---------- Inherent Risk ----------

class InherentRiskSummary(BaseModel):
    supplier_id: str
    rolling_risk_score: float
    risk_level: str
    event_count: int
    category_breakdown: Dict[str, int]


# ---------- Integrated Risk ----------

class IntegrationMetadata(BaseModel):
    financial_weight: float
    inherent_weight: float
    integration_version: str


class IntegratedRiskResponse(BaseModel):
    status: str
    supplier_id: str
    supplier_name: str

    financial_risk: FinancialRiskResponse
    inherent_risk: Optional[InherentRiskSummary]

    integrated_risk_score: float
    integrated_risk_level: str

    integration_metadata: IntegrationMetadata
