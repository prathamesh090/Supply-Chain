# normalization.py

import math
from datetime import datetime, timezone

HALF_LIFE_DAYS = {
    "Regulatory & Compliance": 180,
    "Environmental": 365,
    "Operational": 90,
    "Financial": 120,
    "Safety & Chemical": 60,
    "Governance & Legal": 180,
    "Macro & Geopolitical": 150,
    "Positive": 9999
}

MAX_RISK_SCORE = 100.0

def normalize_score(risk_score: float) -> float:
    return min((risk_score / MAX_RISK_SCORE) * 100, 100)

def decay_lambda(category: str) -> float:
    half_life = HALF_LIFE_DAYS.get(category, 180)
    return math.log(2) / half_life

def apply_decay(normalized_score: float, created_at: datetime, category: str) -> float:
    now = datetime.now(timezone.utc)
    age_days = (now - created_at).days
    lam = decay_lambda(category)
    return round(normalized_score * math.exp(-lam * age_days), 2)
