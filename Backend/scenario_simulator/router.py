# scenario_simulator/router.py
"""
Scenario Simulator — Cascade Engine
Simulates supply chain shocks across Demand → Risk → Inventory → Distribution
without modifying any live data.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import sys
from pathlib import Path
import math

# ── Import shared modules ─────────────────────────────────────────────
sys.path.append(str(Path(__file__).resolve().parent.parent))
sys.path.append(str(Path(__file__).resolve().parent.parent / "ml_supplier_risk"))

router = APIRouter(prefix="/scenario", tags=["Scenario Simulator"])

# ── Pydantic Models ───────────────────────────────────────────────────

class ScenarioParameters(BaseModel):
    surge_pct: float = 0.0              # Demand surge (+%)
    failure_pct: float = 0.0           # Supplier capacity loss (%)
    supplier_name: Optional[str] = None # Supplier to fail
    price_change_pct: float = 0.0      # Price shock (+/- %)
    season: Optional[str] = None        # Q1 / Q2 / Q3 / Q4
    seasonal_multiplier: float = 1.0   # Season demand multiplier
    route_cost_increase_pct: float = 0.0  # Logistics disruption

class ScenarioRequest(BaseModel):
    scenario_type: str  # demand_spike | supplier_failure | price_shock | seasonal | logistics_disruption
    parameters: ScenarioParameters

# ── DB helpers ────────────────────────────────────────────────────────

def get_db_connection():
    import os, mysql.connector
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "chainlink_pro"),
            port=int(os.getenv("DB_PORT", "3306"))
        )
        return conn
    except Exception as e:
        return None


def fetch_latest_forecast() -> List[Dict]:
    """Pull average predicted_demand per product from the latest session."""
    conn = get_db_connection()
    if not conn:
        return _mock_forecast()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT product_id,
                   AVG(predicted_demand) AS forecasted_demand,
                   product_type,
                   plastic_type
            FROM predictions
            WHERE session_id = (
                SELECT session_id FROM analysis_sessions
                ORDER BY created_at DESC LIMIT 1
            )
            GROUP BY product_id, product_type, plastic_type
        """)
        rows = cursor.fetchall()
        # Merge with mock data if we have very FEW products, to ensure simulation is interesting
        if rows and len(rows) < 5:
            mock = _mock_forecast()
            existing_pids = {r["product_id"] for r in rows}
            for m in mock:
                if m["product_id"] not in existing_pids:
                    rows.append(m)
        return rows if rows else _mock_forecast()
    except Exception:
        return _mock_forecast()
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


def fetch_inventory_snapshot() -> List[Dict]:
    """Pull current inventory for all warehouse/product combos."""
    conn = get_db_connection()
    if not conn:
        return _mock_inventory()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT im.product_id, im.warehouse_id, im.current_stock,
                   im.lead_time, im.supplier_name,
                   w.demand_weight, w.total_capacity, w.name AS warehouse_name, w.city
            FROM inventory_master im
            JOIN warehouses w ON im.warehouse_id = w.id
        """)
        rows = cursor.fetchall()
        return rows if rows else _mock_inventory()
    except Exception:
        return _mock_inventory()
    finally:
        cursor.close(); conn.close()


def fetch_supplier_risks() -> Dict[str, str]:
    """Return {supplier_name: risk_level} map from SRA module."""
    try:
        from supplier_risk_predictor import SupplierRiskPredictor
        predictor = SupplierRiskPredictor()
        all_preds = predictor.predict_all_suppliers()
        return {s["supplier_name"]: s["predicted_risk"] for s in all_preds}
    except Exception:
        return {}


# ── Mock data fallbacks (when DB not connected) ───────────────────────

PLASTIC_TYPES = ["PET", "HDPE", "LDPE", "LLDPE", "PP", "PVC"]
PRODUCT_IDS   = [f"{pt}-{str(i).zfill(3)}" for pt in PLASTIC_TYPES for i in range(1, 3)]
SUPPLIERS     = ["Alpha_Polymers", "Delta_Logistics", "Sigma_Plastics", "BrightChem", "IndoPlast"]

def _mock_forecast() -> List[Dict]:
    import random; random.seed(42)
    return [
        {
            "product_id": pid,
            "forecasted_demand": random.uniform(300, 1200),
            "product_type": pid.split("-")[0] + " Granules",
            "plastic_type": pid.split("-")[0]
        }
        for pid in PRODUCT_IDS
    ]

def _mock_inventory() -> List[Dict]:
    import random; random.seed(7)
    rows = []
    for i, pid in enumerate(PRODUCT_IDS):
        for wh_id, wh_name, city, wt in [(1, "Mumbai WH", "Mumbai", 0.6), (2, "Bhopal WH", "Bhopal", 0.4)]:
            rows.append({
                "product_id": pid,
                "warehouse_id": wh_id,
                "current_stock": random.randint(50, 600),
                "lead_time": random.randint(3, 10),
                "supplier_name": SUPPLIERS[i % len(SUPPLIERS)],
                "demand_weight": wt,
                "total_capacity": 5000,
                "warehouse_name": wh_name,
                "city": city,
            })
    return rows


# ── Inventory formulas (mirrors inventory/services.py) ────────────────

RISK_MULTIPLIERS = {"Low": 1.0, "Medium": 1.3, "High": 1.6}

def compute_status(current_stock: float, daily_demand: float, lead_time: int, risk_mult: float) -> Dict:
    safety_stock = round(daily_demand * lead_time * risk_mult, 2)
    rop = round((daily_demand * lead_time) + safety_stock, 2)
    if current_stock > rop:
        status = "Healthy"
    elif current_stock > safety_stock:
        status = "Reorder Soon"
    else:
        status = "Stockout Risk"
    return {"safety_stock": safety_stock, "rop": rop, "status": status}


# ── Demand modifier by scenario ───────────────────────────────────────

SEASONAL_MULTIPLIERS = {"Q1": 0.85, "Q2": 1.10, "Q3": 1.25, "Q4": 0.95}

PRICE_ELASTICITY = -0.35  # 1% price increase → 0.35% demand decrease

def apply_demand_modifier(base_demand: float, scenario_type: str, params: ScenarioParameters) -> float:
    d = base_demand
    if scenario_type == "demand_spike":
        d *= (1 + params.surge_pct / 100)
    elif scenario_type == "price_shock":
        d *= (1 + PRICE_ELASTICITY * params.price_change_pct / 100)
    elif scenario_type == "seasonal":
        mult = SEASONAL_MULTIPLIERS.get(params.season or "Q1", 1.0) if not params.seasonal_multiplier or params.seasonal_multiplier == 1.0 else params.seasonal_multiplier
        d *= mult
    # supplier_failure and logistics_disruption don't affect demand directly
    return max(0, d)


# ── Main Simulation Engine ────────────────────────────────────────────

@router.post("/simulate")
def run_simulation(req: ScenarioRequest):
    """
    Cascade simulator: Demand → Risk → Inventory → Distribution
    Returns a structured multi-stage impact breakdown.
    """
    scenario_type = req.scenario_type
    params = req.parameters

    valid_types = {"demand_spike", "supplier_failure", "price_shock", "seasonal", "logistics_disruption"}
    if scenario_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Unknown scenario_type. Must be one of: {valid_types}")

    # ── Stage 1: Demand ───────────────────────────────────────────────
    forecast_rows = fetch_latest_forecast()
    forecast_map: Dict[str, float] = {
        r["product_id"]: float(r["forecasted_demand"] or 0)
        for r in forecast_rows
    }
    product_info: Dict[str, Dict] = {
        r["product_id"]: {
            "product_type": r.get("product_type", ""),
            "plastic_type": r.get("plastic_type", "")
        }
        for r in forecast_rows
    }

    baseline_total = sum(forecast_map.values())
    simulated_forecast: Dict[str, float] = {
        pid: apply_demand_modifier(demand, scenario_type, params)
        for pid, demand in forecast_map.items()
    }
    simulated_total = sum(simulated_forecast.values())
    demand_delta_pct = ((simulated_total - baseline_total) / baseline_total * 100) if baseline_total > 0 else 0.0

    # Per-product demand breakdown (top 6 by delta)
    demand_breakdown = sorted([
        {
            "product_id": pid,
            "plastic_type": product_info.get(pid, {}).get("plastic_type", ""),
            "baseline": round(forecast_map[pid], 1),
            "simulated": round(simulated_forecast[pid], 1),
            "delta_pct": round(((simulated_forecast[pid] - forecast_map[pid]) / forecast_map[pid] * 100) if forecast_map[pid] > 0 else 0, 1)
        }
        for pid in forecast_map
    ], key=lambda x: abs(x["delta_pct"]), reverse=True)[:8]

    demand_stage = {
        "baseline_total": round(baseline_total, 1),
        "simulated_total": round(simulated_total, 1),
        "delta_pct": round(demand_delta_pct, 2),
        "affected_products": len([p for p in simulated_forecast if abs(simulated_forecast[p] - forecast_map.get(p, 0)) > 0.1]),
        "breakdown": demand_breakdown,
    }

    # ── Stage 2: Risk ─────────────────────────────────────────────────
    supplier_risks = fetch_supplier_risks()
    risk_level_changes = []
    affected_suppliers = []

    if scenario_type == "supplier_failure" and params.supplier_name:
        target = params.supplier_name
        old_risk = supplier_risks.get(target, "Low")
        # Proportionally escalate risk based on failure_pct
        if params.failure_pct >= 70:
            new_risk = "High"
        elif params.failure_pct >= 30:
            new_risk = "Medium"
        else:
            new_risk = old_risk
        if new_risk != old_risk:
            supplier_risks[target] = new_risk
            risk_level_changes.append({"supplier": target, "from": old_risk, "to": new_risk})
            affected_suppliers.append(target)
    elif scenario_type == "logistics_disruption":
        # Escalate all Medium → High if cost spike > 30%
        for sup, lvl in supplier_risks.items():
            if lvl == "Medium" and params.route_cost_increase_pct > 30:
                risk_level_changes.append({"supplier": sup, "from": "Medium", "to": "High"})
                supplier_risks[sup] = "High"
                affected_suppliers.append(sup)

    def resolve_risk(supplier_name: str, default="Low") -> str:
        if not supplier_name:
            return default
        for k, v in supplier_risks.items():
            if k.strip().lower() == supplier_name.strip().lower():
                return v
        return default

    risk_stage = {
        "affected_suppliers": affected_suppliers,
        "risk_level_changes": risk_level_changes,
        "total_suppliers_monitored": len(supplier_risks),
    }

    # ── Stage 3: Inventory ────────────────────────────────────────────
    inventory_rows = fetch_inventory_snapshot()
    status_changes = []
    stockout_count = 0
    healthy_count = 0
    reorder_count = 0
    product_status_map: Dict[str, Dict] = {}

    for row in inventory_rows:
        pid = row["product_id"]
        current_stock = float(row["current_stock"] or 0)
        lead_time = int(row["lead_time"] or 5)
        supplier_name = row.get("supplier_name") or ""
        demand_weight = float(row.get("demand_weight") or 0.5)

        # Baseline inventory status
        base_demand = forecast_map.get(pid, 0)
        base_daily = round(base_demand * demand_weight / 30, 4)
        base_risk = resolve_risk(supplier_name)
        baseline_inv = compute_status(current_stock, base_daily, lead_time, RISK_MULTIPLIERS.get(base_risk, 1.0))

        # Simulated inventory status
        sim_demand = simulated_forecast.get(pid, base_demand)
        sim_daily = round(sim_demand * demand_weight / 30, 4)
        sim_risk = resolve_risk(supplier_name)
        sim_inv = compute_status(current_stock, sim_daily, lead_time, RISK_MULTIPLIERS.get(sim_risk, 1.0))

        if baseline_inv["status"] != sim_inv["status"]:
            status_changes.append({
                "product_id": pid,
                "warehouse": row.get("city", ""),
                "from": baseline_inv["status"],
                "to": sim_inv["status"],
                "current_stock": int(current_stock),
                "new_rop": sim_inv["rop"],
                "new_safety_stock": sim_inv["safety_stock"],
            })

        if sim_inv["status"] == "Stockout Risk":
            stockout_count += 1
        elif sim_inv["status"] == "Healthy":
            healthy_count += 1
        else:
            reorder_count += 1

        pid_key = f"{pid}_{row['warehouse_id']}"
        product_status_map[pid_key] = {"baseline": baseline_inv["status"], "simulated": sim_inv["status"]}

    # Average safety stock delta
    avg_ss_delta = 0.0
    if status_changes:
        avg_ss_delta = round(
            sum((sc["new_safety_stock"] / max(sc["current_stock"], 1) * 100) for sc in status_changes) / len(status_changes),
            1
        )

    inventory_stage = {
        "total_items": len(inventory_rows),
        "status_changes": status_changes[:10],  # cap at 10 for response size
        "stockout_count": stockout_count,
        "healthy_count": healthy_count,
        "reorder_count": reorder_count,
        "safety_stock_increase_avg_pct": avg_ss_delta,
        "newly_at_risk": len([s for s in status_changes if s["to"] == "Stockout Risk"]),
    }

    # ── Stage 4: Distribution ─────────────────────────────────────────
    cost_increase = params.route_cost_increase_pct if scenario_type == "logistics_disruption" else 0.0
    unserviceable_routes = 0
    affected_regions = set()

    if stockout_count > 0:
        for sc in status_changes:
            if sc["to"] == "Stockout Risk":
                affected_regions.add(sc["warehouse"])
                unserviceable_routes += 1

    if scenario_type == "logistics_disruption":
        # Simulate route degradation
        unserviceable_routes += math.ceil(len(inventory_rows) * params.route_cost_increase_pct / 300)
        if params.route_cost_increase_pct > 20:
            affected_regions.add("Long-haul routes")

    distribution_stage = {
        "unserviceable_routes": unserviceable_routes,
        "cost_increase_pct": round(cost_increase, 1),
        "affected_regions": list(affected_regions),
        "est_cost_impact_inr": round(baseline_total * cost_increase / 100 * 15, 0),  # ₹15/unit avg
    }

    # ── Severity Score (0–100) ────────────────────────────────────────
    #  Weighted composite:
    #   30% from demand delta magnitude
    #   25% from stockout ratio
    #   25% from risk changes
    #   20% from distribution disruption

    demand_severity = min(abs(demand_delta_pct) * 2, 30)
    stockout_ratio = (stockout_count / max(len(inventory_rows), 1)) * 100
    inventory_severity = min(stockout_ratio * 0.5, 25)
    risk_severity = min(len(risk_level_changes) * 8, 25)
    dist_severity = min(unserviceable_routes * 3 + cost_increase * 0.5, 20)

    severity_score = int(min(100, demand_severity + inventory_severity + risk_severity + dist_severity))

    # ── Summary text ──────────────────────────────────────────────────
    SCENARIO_LABELS = {
        "demand_spike": f"Demand surge of +{params.surge_pct:.0f}%",
        "supplier_failure": f"Supplier failure ({params.supplier_name or 'unknown'}, {params.failure_pct:.0f}% capacity loss)",
        "price_shock": f"Price {'increase' if params.price_change_pct >= 0 else 'decrease'} of {abs(params.price_change_pct):.0f}%",
        "seasonal": f"{params.season or 'Seasonal'} demand shift",
        "logistics_disruption": f"Logistics disruption (+{params.route_cost_increase_pct:.0f}% route costs)",
    }
    label = SCENARIO_LABELS.get(scenario_type, scenario_type)
    summary_parts = [f"{label} causes:"]
    if abs(demand_delta_pct) > 0.5:
        direction = "increase" if demand_delta_pct > 0 else "decrease"
        summary_parts.append(f"a {abs(demand_delta_pct):.1f}% demand {direction}")
    if inventory_stage["newly_at_risk"] > 0:
        summary_parts.append(f"{inventory_stage['newly_at_risk']} product(s) newly at stockout risk")
    if affected_regions:
        summary_parts.append(f"affecting {', '.join(list(affected_regions)[:3])}")
    if cost_increase > 0:
        summary_parts.append(f"with a {cost_increase:.0f}% logistics cost spike")
    
    if len(summary_parts) == 1:
        summary_parts.append("no significant downstream status changes detected.")
        
    summary = " — ".join(summary_parts)

    return {
        "scenario_type": scenario_type,
        "parameters": params.model_dump(),
        "stages": {
            "demand": demand_stage,
            "risk": risk_stage,
            "inventory": inventory_stage,
            "distribution": distribution_stage,
        },
        "severity_score": severity_score,
        "summary": summary,
        "data_source": "live" if get_db_connection() else "mock",
    }


# ── Endpoint: List available suppliers for the UI dropdown ───────────
@router.get("/suppliers")
def get_available_suppliers():
    """Returns supplier names for the scenario simulator dropdown."""
    risks = fetch_supplier_risks()
    if risks:
        return [
            {"name": name, "current_risk": level}
            for name, level in risks.items()
        ]
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT DISTINCT supplier_name FROM inventory_master WHERE supplier_name IS NOT NULL AND supplier_name != ''")
            rows = cursor.fetchall()
            return [{"name": r["supplier_name"], "current_risk": "Unknown"} for r in rows]
        except Exception:
            pass
        finally:
            cursor.close(); conn.close()
    return [{"name": s, "current_risk": "Low"} for s in SUPPLIERS]
