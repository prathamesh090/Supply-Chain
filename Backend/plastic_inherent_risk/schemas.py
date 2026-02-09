from pydantic import BaseModel

class InherentRiskRequest(BaseModel):
    text: str


class InherentRiskResult(BaseModel):
    category: str
    confidence: float


class InherentRiskAPIResponse(BaseModel):
    status: str          # "stored" | "exists"
    result: InherentRiskResult
