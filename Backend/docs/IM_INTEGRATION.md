# Inventory Management (IM) Integration with Supplier Risk Assessment (SRA)

This document describes how the Inventory Management (IM) system should use Supplier Risk Assessment (SRA) outputs to improve supply reliability, safety stock planning, and supplier selection.

The goal is to make inventory decisions **risk-aware**, ensuring that operational disruptions or financially unstable suppliers do not cause stockouts.

---

# 1. Integration Overview

The Inventory Management system uses supplier risk signals to adjust inventory strategies.

Integration flow:

```
Inventory Management System
        ↓
Request supplier risk
        ↓
SRA API (/api/integrated-risk/{supplier_id})
        ↓
Receive risk score
        ↓
Adjust safety stock
        ↓
Plan inventory replenishment
```

The SRA system provides the **risk intelligence layer** for inventory decision-making.

---

# 2. Primary API Used by IM

The main endpoint used by the Inventory Management system is:

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

The IM system primarily uses:

```
integrated_risk_score
integrated_risk_level
```

---

# 3. Risk-Based Safety Stock Adjustment

Inventory Management can increase safety stock levels for suppliers with higher risk.

Example safety stock formula:

```
SafetyStock =
    BaseSafetyStock × RiskMultiplier
```

Example risk multiplier table:

| Risk Level | Multiplier |
| ---------- | ---------- |
| Low        | 1.0        |
| Medium     | 1.3        |
| High       | 1.6        |
| Critical   | 2.0        |

Example calculation:

```
BaseSafetyStock = 100 units
RiskLevel = Medium
Multiplier = 1.3
```

```
AdjustedSafetyStock = 130 units
```

This prevents stockouts when supplier reliability decreases.

---

# 4. Supplier Prioritization

When multiple suppliers provide the same material, IM should prefer suppliers with lower risk scores.

Example supplier comparison:

| Supplier | Risk Score | Priority                    |
| -------- | ---------- | --------------------------- |
| BASF     | 29         | Preferred                   |
| Dow      | 45         | Secondary                   |
| SABIC    | 70         | Avoid if alternatives exist |

Selection logic example:

```
if risk_score < 40:
    preferred_supplier
elif risk_score < 70:
    secondary_supplier
else:
    avoid_supplier
```

---

# 5. Monitoring Operational Risk Events

Inventory systems can also monitor recent incidents that may disrupt supply.

Endpoint:

```
GET /api/risk-events/recent
```

Example response:

```json
{
  "events": [
    {
      "supplier_id": "PLASTIC-19749e1e",
      "event_text": "Explosion at BASF polymer production plant",
      "risk_level": "High"
    }
  ]
}
```

If a supplier experiences high-risk events, the IM system may:

* increase safety stock
* reorder earlier
* temporarily switch suppliers

---

# 6. Monitoring Global Supply Chain Disruptions

Global events affecting logistics or regions can also influence inventory planning.

Endpoint:

```
GET /api/global-risk
```

Example events:

```
Trade Sanctions affecting Europe
Port Strike affecting Asia-Pacific
Regional Conflict affecting Middle East
```

If a supplier operates in an affected region, the IM system should:

```
increase safety stock
increase reorder frequency
activate backup suppliers
```

---

# 7. Risk-Aware Inventory Planning Pipeline

Recommended IM workflow:

```
Material demand forecast
        ↓
Identify suppliers
        ↓
Fetch supplier risk scores
        ↓
Adjust safety stock levels
        ↓
Generate purchase orders
```

This ensures inventory buffers account for supply risk.

---

# 8. Example Inventory Planning Scenario

Material: Polypropylene

Suppliers:

| Supplier | Risk Score |
| -------- | ---------- |
| BASF     | 29         |
| Dow      | 45         |

Safety stock calculation:

```
BaseSafetyStock = 100 units
```

BASF:

```
RiskLevel = Low
AdjustedSafetyStock = 100
```

Dow:

```
RiskLevel = Medium
AdjustedSafetyStock = 130
```

The system therefore prioritizes BASF for supply planning.

---

# 9. Recommended Data Refresh Strategy

Inventory systems should periodically refresh risk information.

| Data               | Refresh Interval |
| ------------------ | ---------------- |
| Supplier risk      | every 5 minutes  |
| Operational events | every 1 minute   |
| Global risk events | every 10 minutes |

---

# 10. Future Enhancements

Potential improvements to SRA–IM integration:

* predictive supply disruption models
* automated supplier switching
* dynamic safety stock algorithms
* regional supply risk forecasting

These features can significantly improve supply chain resilience.

