# SUPPLIER RISK ASSESSMENT (SRA) – ARCHITECTURE & INTEGRATION GUIDE

# 1. Purpose

Supplier Risk Assessment (SRA) is a centralized backend intelligence layer that evaluates supplier risk using:

1. **Financial & Operational Risk Model** (structured performance metrics)
2. **Inherent Risk Model** (event/news-based risk detection)
3. **Integrated Risk Engine** (unified planning-ready risk signal)

SRA provides:

* A normalized numeric risk score (0–100)
* A categorical risk level (Low / Medium / High)
* Explainability for dashboards
* Structured outputs for Route Optimization (RO)
* Structured outputs for Inventory Management (IM)

SRA is a decision-support system.
It does not automate operational decisions.

---

# 2. High-Level Architecture

```
News Text ───────────► Inherent Risk Engine
                             │
Structured Financial Data ─► Financial Risk Model
                             │
                             ▼
                    Integrated Risk Engine
                             │
                             ▼
              API: /api/integrated-risk/{supplier_id}
                             │
      ┌──────────────────────┼──────────────────────┐
      ▼                      ▼                      ▼
Route Optimization      Inventory Mgmt          Dashboard
```

---

# 3. Core Design Principles

* Risk is event-driven.
* Risk is normalized (0–100).
* Risk is time-aware.
* Risk is explainable.
* Backend is single source of truth.
* Modules consume structured outputs only.

---

# 4. Component Breakdown

---

# 4.1 Inherent Risk Engine (News-Based)

### Purpose

Detect supplier-specific risk events from unstructured text.

### Endpoint

```
POST /plastic/inherent-risk/predict
```

### Input

```json
{
  "text": "Alpha Inc faces regulatory action from government"
}
```

Supplier is resolved internally via mapping engine.

---

### Output (Event-Level Response)

```json
{
  "status": "stored",
  "result": {
    "risk_category": "Governance & Legal",
    "risk_level": "High",
    "confidence": 0.7395,
    "risk_score": 59.16,
    "normalized_score": 59.16,
    "decayed_score": 59.16,
    "explanation": "Legal or governance issues can affect supplier reliability...",
    "impact_areas": ["contracts", "compliance", "reputation"],
    "time_horizon": "short_term",
    "created_at": "2026-02-11T17:03:08Z"
  },
  "supplier_risk_index": {
    "supplier_id": "SUPPLIER_ALPHA_001",
    "rolling_risk_score": 59.16,
    "risk_level": "Medium",
    "event_count": 1
  }
}
```

### Key Behavior

* Duplicate events are prevented.
* Supplier rolling risk index is automatically updated.
* Historical events are stored for audit.

---

# 4.2 Financial & Operational Risk Model

### Purpose

Evaluate supplier reliability using structured metrics:

* Delivery delay rate
* Defect rate
* Price variance
* Compliance performance
* Trust score

This model is consumed internally by the Integrated Risk Engine.

---

### Output Structure (Internal)

```json
{
  "risk_score": 5.0,
  "risk_level": "Low",
  "probabilities": {
    "Low": 0.82,
    "Medium": 0.17
  },
  "explanation": "Predicted low risk (score: 5.0/100)"
}
```

---

# 4.3 Integrated Risk Engine (Primary Planning Signal)

This is the final risk output consumed by other modules.

### Endpoint

```
GET /api/integrated-risk/{supplier_id}
```

---

## Final Output Schema (Planning-Ready)

```json
{
  "status": "ok",
  "supplier_id": "SUPPLIER_ALPHA_001",
  "supplier_name": "Alpha_Inc",

  "financial_risk": {
    "risk_score": 5.0,
    "risk_level": "Low"
  },

  "inherent_risk": {
    "rolling_risk_score": 59.16,
    "risk_level": "Medium",
    "event_count": 1
  },

  "integrated_risk_score": 26.66,
  "integrated_risk_level": "Low",

  "risk_scope": ["supplier", "distribution", "inventory"],

  "valid_from": "2026-02-10",
  "valid_to": "2026-03-10"
}
```

---

## Integration Logic

```
Integrated Score =
  (0.6 × Financial Score) +
  (0.4 × Inherent Score)
```

Weights are configurable.

---

# 5. Supplier → Warehouse Mapping (Critical for RO)

Route Optimization allocates from warehouses, not suppliers.

Therefore, a mapping layer is required:

```
warehouse_supplier_mapping
```

| warehouse_id | supplier_id |
| ------------ | ----------- |

Before RO consumes risk:

```
warehouse risk = integrated_risk of its mapped supplier
```

SRA does not compute warehouse-level risk directly.
Mapping is performed in the planning layer.

---

# 6. Time Validity

All integrated risk outputs include:

```
valid_from
valid_to
```

This ensures:

* Risk is aligned with planning time buckets.
* RO and IM apply risk only during active period.
* Risk is not treated as permanently static.

---

# 7. Risk Scope

Each integrated response includes:

```
risk_scope
```

Possible values:

* supplier
* distribution
* inventory

This allows:

* RO to apply penalties only when distribution is affected.
* IM to adjust safety stock only when inventory risk exists.
* Future modules to selectively consume risk.

---

# 8. Dashboard Display Design

UI should have three logical sections.

---

## 8.1 Primary Supplier Risk Card

Display:

* Supplier Name
* Integrated Risk Level (large badge)
* Integrated Risk Score (0–100 gauge)
* Validity period

Example:

```
Supplier: Alpha_Inc
Integrated Risk: LOW
Score: 26.66 / 100
Valid: Feb 10 – Mar 10
```

This is the decision-driving signal.

---

## 8.2 Risk Breakdown Section

### Financial Panel

* Risk Level
* Risk Score
* Key metrics summary
* Explanation

### Inherent Panel

* Rolling Risk Score
* Risk Level
* Event Count
* Category breakdown chart
* Latest event explanation

---

## 8.3 Event Timeline

Display recent events:

| Date | Category | Level | Explanation |
| ---- | -------- | ----- | ----------- |

Supports auditability.

---

# 9. How Other Modules Consume SRA

---

# 9.1 Route Optimization (RO)

Consumes:

```
integrated_risk_score
risk_scope
valid_from
valid_to
```

Usage:

```
total_cost = transport_cost + (integrated_risk_score × risk_weight)
```

If "distribution" ∉ risk_scope → no penalty applied.

RO does not use explanations.

---

# 9.2 Inventory Management (IM)

Consumes:

```
integrated_risk_level
risk_scope
```

Usage:

```
Low    → multiplier = 1.0
Medium → multiplier = 1.3
High   → multiplier = 1.6
```

If "inventory" ∉ risk_scope → base safety stock applied.

---

# 9.3 Risk Exposure (Future KPI)

Derived metric:

```
risk_exposure = integrated_risk_score × allocated_volume
```

Can be computed inside RO.

Used for analytics dashboards.

---

# 10. Global / Macro Risk Layer (In Progress)

Handles events affecting:

* Multiple suppliers
* Regions
* Logistics
* Inventory planning

Planned schema:

```json
{
  "event_id": "GLOBAL_2026_001",
  "event_type": "Geopolitical",
  "risk_score": 75,
  "risk_level": "High",
  "affected_regions": ["Asia"],
  "affects": ["distribution", "inventory"],
  "valid_from": "2026-02-01",
  "valid_to": "2026-03-30"
}
```

This enables:

* Regional penalty in RO
* Global safety stock adjustment in IM
* Macro risk dashboard

---

# 11. Current Status

Completed:

* Inherent Risk Engine
* Financial Risk Integration
* Integrated Risk Engine
* Duplicate handling
* Planning-ready normalized scoring
* Time validity
* Risk scope support
* API endpoints

In Progress:

* Global Risk Event Layer
* Multi-supplier event handling

---

# 12. Final System Goal

SRA provides:

* Unified supplier risk score
* Explainable breakdown
* Time-aware planning signal
* Cross-module integration capability

It transforms risk from reporting into a structured planning intelligence layer.

---