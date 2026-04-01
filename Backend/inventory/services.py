# inventory/services.py

import sys
from pathlib import Path

# ── Import SRA module from ml_supplier_risk folder ──────────────────
sys.path.append(str(Path(__file__).resolve().parent.parent / "ml_supplier_risk"))

from supplier_risk_predictor import SupplierRiskPredictor

# ── Initialize predictor ONCE when server starts ─────────────────────
try:
    _predictor = SupplierRiskPredictor()
    print("✅ Inventory: Supplier risk predictor loaded successfully")
except Exception as e:
    print(f"⚠️  Inventory: Could not load supplier risk predictor: {e}")
    _predictor = None


# ── Fetch supplier risk level from SRA ───────────────────────────────

def get_supplier_risk_level(supplier_name: str) -> str:
    """
    Matches supplier_name against SRA predictions.
    Returns: "Low", "Medium", or "High"
    Falls back to "Low" if SRA unavailable or name not found.
    """
    if not _predictor or not supplier_name:
        return "Low"

    try:
        all_suppliers = _predictor.predict_all_suppliers()
        for s in all_suppliers:
            if s["supplier_name"].strip().lower() == supplier_name.strip().lower():
                return s["predicted_risk"]  # "Low" / "Medium" / "High"
    except Exception as e:
        print(f"⚠️  Could not fetch risk for supplier '{supplier_name}': {e}")

    return "Low"  # safe default if supplier not found


# ── Core Inventory Calculation ────────────────────────────────────────

def calculate_inventory_status(
    current_stock: int,
    global_forecasted_demand: float,
    lead_time: int,
    demand_weight: float,
    supplier_name: str = ""
) -> dict:
    """
    Research-aligned heuristic inventory calculation.

    Step 1: warehouse_demand = global_demand x demand_weight
    Step 2: daily_demand     = warehouse_demand / 30
    Step 3: base_safety_stock = daily_demand x lead_time
    Step 4: risk_multiplier  from SRA module
    Step 5: safety_stock     = base_safety_stock x multiplier
    Step 6: ROP              = (daily_demand x lead_time) + safety_stock
    Step 7: Status           = Healthy / Reorder Soon / Stockout Risk
    """

    # Step 1 — split global demand by warehouse weight
    warehouse_demand = global_forecasted_demand * demand_weight

    # Step 2 — daily demand for this warehouse
    daily_demand = round(warehouse_demand / 30, 4) if warehouse_demand > 0 else 0

    # Step 3 — base safety stock
    base_safety_stock = daily_demand * lead_time

    # Step 4 — get risk level from SRA
    risk_level = get_supplier_risk_level(supplier_name)
    multipliers = {
        "Low":    1.0,
        "Medium": 1.3,
        "High":   1.6
    }
    multiplier = multipliers.get(risk_level, 1.0)

    # Step 5 — adjusted safety stock
    safety_stock = round(base_safety_stock * multiplier, 2)

    # Step 6 — reorder point
    rop = round((daily_demand * lead_time) + safety_stock, 2)

    # Step 7 — status and suggested action
    if current_stock > rop:
        status           = "Healthy"
        suggested_action = "No action needed"
    elif current_stock <= rop and current_stock > safety_stock:
        status           = "Reorder Soon"
        suggested_action = "Place Replenishment Order"
    else:
        status           = "Stockout Risk"
        suggested_action = "Urgent Replenishment"

    return {
        "global_forecasted_demand": round(global_forecasted_demand, 2),
        "warehouse_demand":         round(warehouse_demand, 2),
        "daily_demand":             round(daily_demand, 2),
        "supplier_risk_level":      risk_level,
        "risk_multiplier":          multiplier,
        "safety_stock":             safety_stock,
        "ROP":                      rop,
        "status":                   status,
        "suggested_action":         suggested_action
    }



#  What This File Does

# get_supplier_risk_level("Delta_Logistics")
#         ↓
# searches ml_supplier_risk predictions
#         ↓
# returns "Medium"
#         ↓
# calculate_inventory_status(
#     current_stock = 100,
#     global_demand = 924,
#     lead_time     = 5,
#     demand_weight = 0.60,   ← Mumbai
#     supplier_name = "Delta_Logistics"
# )
#         ↓
# warehouse_demand = 924 x 0.60 = 554.4
# daily_demand     = 554.4 / 30 = 18.48
# base_safety      = 18.48 x 5  = 92.4
# multiplier       = 1.3 (Medium)
# safety_stock     = 92.4 x 1.3 = 120.12
# ROP              = 92.4 + 120.12 = 212.52
# status           = Stockout Risk (100 < 120.12)