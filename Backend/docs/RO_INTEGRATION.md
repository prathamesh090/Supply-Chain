# Route Optimization (RO) Integration with Supplier Risk Assessment (SRA)

This document explains how the Route Optimization (RO) engine should use the Supplier Risk Assessment (SRA) system to compute safer and more resilient supply routes.

The SRA system provides risk intelligence that allows RO to avoid unreliable suppliers, risky regions, and disrupted supply chain segments.

---

# 1. Integration Overview

The Route Optimization engine consumes supplier risk scores from the SRA system and incorporates them into route selection algorithms.

The integration flow is:

```
Route Optimization Engine
        ↓
Request supplier risk
        ↓
SRA API (/api/integrated-risk/{supplier_id})
        ↓
Receive supplier risk score
        ↓
Apply risk penalties to routes
        ↓
Compute optimal route
```

The SRA system acts as the **risk intelligence layer** for route decision making.

---

# 2. Primary API Used by RO

The main endpoint used by the Route Optimization engine is:

```
GET /api/integrated-risk/{supplier_id}
```

Example request:

```
GET http://localhost:8000/api/integrated-risk/PLASTIC-19749e1e
```

Example response:

```json
{
  "status": "ok",
  "supplier_id": "PLASTIC-19749e1e",
  "supplier_name": "basf",
  "financial_risk": {...},
  "inherent_risk": {
    "rolling_risk_score": 65.5,
    "risk_level": "Medium"
  },
  "integrated_risk_score": 29.2,
  "integrated_risk_level": "Low"
}
```

---

# 3. Risk Score Usage in Route Optimization

The `integrated_risk_score` returned by the SRA system should be incorporated into route cost calculations.

A typical route cost function may be:

```
RouteCost =
    DistanceCost
  + TransportationCost
  + RiskPenalty
```

Where:

```
RiskPenalty = SupplierRiskScore × RiskWeight
```

Example:

```
DistanceCost = 120
TransportCost = 80
SupplierRiskScore = 29
RiskWeight = 0.5
```

```
RiskPenalty = 14.5
```

```
TotalRouteCost = 214.5
```

Routes with higher supplier risk will therefore become less attractive.

---

# 4. Supplier Filtering Strategy

RO may optionally exclude suppliers whose risk exceeds a defined threshold.

Example filtering rule:

| Risk Score | Action                      |
| ---------- | --------------------------- |
| 0–30       | Safe supplier               |
| 30–60      | Monitor risk                |
| 60–80      | Avoid if alternatives exist |
| 80+        | Block supplier              |

Example logic:

```
if integrated_risk_score > 80:
    exclude_supplier()
```

---

# 5. Using Operational Risk Events

RO can also use recent operational incidents.

Endpoint:

```
GET /api/risk-events/recent
```

Example event:

```
Explosion at BASF polymer production plant
risk_level: High
```

RO may temporarily penalize routes associated with suppliers experiencing recent disruptions.

Example:

```
if recent_event.risk_level == "High":
    route_penalty += 20
```

---

# 6. Using Global Risk Events

RO should monitor global disruptions affecting regions and logistics routes.

Endpoint:

```
GET /api/global-risk
```

Example response:

```
Trade Sanctions affecting Europe
Regional Conflict affecting Middle East
Port Strike affecting Asia-Pacific
```

If a route passes through affected regions, additional penalties should be applied.

Example rule:

```
if route.region in affected_regions:
    route_cost += disruption_penalty
```

---

# 7. Risk-Aware Route Optimization Pipeline

Recommended RO workflow:

```
Supplier candidates identified
        ↓
Fetch supplier risk
        ↓
Fetch global risk events
        ↓
Compute route risk penalties
        ↓
Apply route optimization algorithm
        ↓
Select safest and cheapest route
```

This approach ensures the routing engine avoids risky suppliers and unstable logistics regions.

---

# 8. Example Risk-Aware Route Calculation

Suppose three suppliers are available.

| Supplier | Distance | Risk Score |
| -------- | -------- | ---------- |
| BASF     | 120 km   | 29         |
| Dow      | 140 km   | 45         |
| SABIC    | 160 km   | 15         |

Route cost calculation:

```
RouteCost = Distance + (RiskScore × 0.5)
```

Results:

```
BASF  = 120 + 14.5 = 134.5
Dow   = 140 + 22.5 = 162.5
SABIC = 160 + 7.5  = 167.5
```

RO selects **BASF** as the optimal supplier.

---

# 9. Recommended Risk Refresh Strategy

RO should periodically refresh supplier risk information.

Recommended refresh interval:

| Data               | Interval         |
| ------------------ | ---------------- |
| Supplier risk      | every 1 minute   |
| Global risk events | every 5 minutes  |
| Incident feed      | every 30 seconds |

---

# 10. Future Enhancements

Possible improvements to SRA–RO integration include:

* route risk prediction models
* regional risk scoring
* logistics corridor risk monitoring
* predictive disruption forecasting

These enhancements would allow route optimization to anticipate disruptions before they occur.

