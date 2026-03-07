from datetime import datetime

from risk_integration.integrated_engine import compute_integrated_risk
from risk_global.global_risk_engine import compute_global_risk


def _risk_level(score: float):

    if score <= 25:
        return "Low"
    elif score <= 50:
        return "Moderate"
    elif score <= 75:
        return "High"
    else:
        return "Critical"


def compute_risk_feed(supplier_id: str):

    integrated = compute_integrated_risk(supplier_id)

    if integrated["status"] != "ok":
        return integrated

    global_risk = compute_global_risk()

    supplier_score = integrated["integrated_risk_score"]

    events = global_risk["events"]

    global_score = 0

    if events:
        global_score = max(event["risk_score"] for event in events)

    final_score = round((0.7 * supplier_score) + (0.3 * global_score), 2)

    final_level = _risk_level(final_score)

    return {

        "supplier_id": supplier_id,
        "supplier_name": integrated["supplier_name"],

        "supplier_risk_score": supplier_score,
        "supplier_risk_level": integrated["integrated_risk_level"],

        "global_risk_score": global_score,
        "global_event_count": global_risk["event_count"],

        "final_risk_score": final_score,
        "final_risk_level": final_level,

        "risk_scope": integrated["risk_scope"],

        "valid_from": integrated["valid_from"],
        "valid_to": integrated["valid_to"]
    }