# constants.py

CATEGORY_BASE_WEIGHT = {
    "Safety & Chemical": 0.9,
    "Regulatory & Compliance": 0.85,
    "Macro & Geopolitical": 0.8,
    "Governance & Legal": 0.8,
    "Environmental": 0.7,
    "Operational": 0.65,
    "Financial": 0.6,
    "Positive": 0.2,
}

CATEGORY_RISK_LEVEL = {
    "Safety & Chemical": "High",
    "Regulatory & Compliance": "High",
    "Macro & Geopolitical": "High",
    "Governance & Legal": "High",
    "Environmental": "Medium",
    "Operational": "Medium",
    "Financial": "Medium",
    "Positive": "Low",
}

CATEGORY_EXPLANATIONS = {
    "Safety & Chemical":
        "Incidents involving hazardous materials or unsafe operations can disrupt production, endanger workforce safety, and trigger regulatory scrutiny.",
    "Regulatory & Compliance":
        "Regulatory developments affecting plastic usage can increase compliance cost, operational adjustments, and legal exposure for suppliers.",
    "Macro & Geopolitical":
        "Geopolitical or macroeconomic events may disrupt supply chains, energy availability, or trade routes impacting plastic suppliers.",
    "Governance & Legal":
        "Legal or governance issues can affect supplier reliability, contractual stability, and long-term compliance standing.",
    "Environmental":
        "Environmental incidents or investigations may lead to penalties, reputational damage, and stricter operational controls.",
    "Operational":
        "Operational disruptions can reduce production capacity, delay deliveries, and affect supply continuity.",
    "Financial":
        "Financial stress may weaken supplier stability, increasing the risk of delayed fulfillment or insolvency.",
    "Positive":
        "Positive developments such as certifications or sustainability initiatives improve supplier resilience and compliance posture.",
}

SIGNAL_KEYWORDS = {
    "government": "government_action",
    "ban": "regulatory_ban",
    "policy": "policy_change",
    "fire": "safety_incident",
    "toxic": "environmental_hazard",
    "emission": "environmental_emissions",
    "shutdown": "operational_shutdown",
    "strike": "labor_disruption",
    "price": "cost_pressure",
    "bankruptcy": "financial_distress",
    "certification": "sustainability_certification",
}
