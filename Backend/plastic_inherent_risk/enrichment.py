# enrichment.py

from datetime import datetime
from .constants import (
    CATEGORY_BASE_WEIGHT,
    CATEGORY_RISK_LEVEL,
    CATEGORY_EXPLANATIONS,
    SIGNAL_KEYWORDS,
)

def extract_signals(text: str):
    text_lower = text.lower()
    signals = set()

    for keyword, signal in SIGNAL_KEYWORDS.items():
        if keyword in text_lower:
            signals.add(signal)

    return list(signals)

def enrich_risk(text: str, category: str, confidence: float):
    base_weight = CATEGORY_BASE_WEIGHT.get(category, 0.5)
    raw_score = round(base_weight * confidence * 100, 2)

    return {
        "risk_category": category,
        "risk_level": CATEGORY_RISK_LEVEL.get(category, "Medium"),
        "confidence": round(confidence, 4),
        "risk_score": raw_score,

        "explanation": CATEGORY_EXPLANATIONS.get(
            category,
            "Risk identified based on supplier-related developments."
        ),

        "signals": extract_signals(text),

        "explainability": {
            "score_components": {
                "category_weight": base_weight,
                "confidence": round(confidence, 4),
                "raw_score": raw_score
            },
            "rules_version": "plastic-risk-rules-v1"
        },

        "time_horizon": "short_term",
        "impact_areas": infer_impact_areas(category),
        "model_version": "plastic-inherent-risk-v1",
    }

def infer_impact_areas(category: str):
    mapping = {
        "Safety & Chemical": ["operations", "workforce", "compliance"],
        "Regulatory & Compliance": ["legal", "operations", "cost"],
        "Macro & Geopolitical": ["supply_chain", "energy", "trade"],
        "Governance & Legal": ["contracts", "compliance", "reputation"],
        "Environmental": ["compliance", "reputation", "operations"],
        "Operational": ["production", "delivery"],
        "Financial": ["liquidity", "fulfillment"],
        "Positive": ["resilience", "compliance"],
    }
    return mapping.get(category, ["operations"])
