# SUPPLIER RISK ASSESSMENT (SRA) – ARCHITECTURE & INTEGRATION GUIDE

# 1. Overview

Supplier Risk Assessment (SRA) is a backend intelligence layer that evaluates supplier risk using:

1. **Financial & Operational Risk Model** (structured performance data)
2. **Inherent Risk Model** (news/event-based risk detection)
3. **Integrated Risk Engine** (final unified risk score)

SRA is designed to:

* Provide decision-driving risk signals
* Be consumed by Route Optimization (RO)
* Be consumed by Inventory Management (IM)
* Provide explainable dashboards for monitoring

SRA does **not** automate decisions.
It provides structured intelligence.

---

# 2. High-Level Architecture

```
News Text ───────► Inherent Risk Engine
                       │
Financial Data ─────► Financial Risk Model
                       │
                       ▼
                Integrated Risk Engine
                       │
                       ▼
               API: /api/integrated-risk/{supplier_id}
                       │
      ┌────────────────┼────────────────┐
      ▼                ▼                ▼
     RO               IM             Dashboard
```

---

# 3. Component Breakdown

---

# 3.1 Inherent Risk Engine (News-Based)

### Purpose

Detect supplier-specific risk from unstructured text.

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

### Output (Event-Level)

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

### What This Means

* Each news event becomes a stored risk event.
* A rolling supplier risk index is updated automatically.
* Duplicate events are prevented.

---

# 3.2 Financial & Operational Risk Model

### Purpose

Evaluate supplier reliability based on:

* Delivery delays
* Defect rate
* Price variance
* Compliance
* Trust score

### Used Internally By:

```
GET /api/integrated-risk/{supplier_id}
```

### Output Structure

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

# 3.3 Integrated Risk Engine (Primary Signal)

This is the **final risk output** consumed by other modules.

### Endpoint

```
GET /api/integrated-risk/{supplier_id}
```

### Final Output

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
  "integrated_risk_level": "Low"
}
```

### Integration Logic

```
Integrated Score = 
  (0.6 × Financial Score) +
  (0.4 × Inherent Score)
```

Weights are configurable.

---

# 4. Final Dashboard Display Design

The UI should be divided into 3 logical sections.

---

# 4.1 Main Supplier Risk Card (Primary View)

Display:

* Supplier Name
* Integrated Risk Level (Large Badge)
* Integrated Risk Score (0–100 Gauge)

Example:

```
Supplier: Alpha_Inc
Integrated Risk: LOW
Score: 26.66 / 100
```

This is the **decision-driving signal**.

---

# 4.2 Risk Breakdown Section

Two side-by-side panels:

### Financial Risk Panel

* Risk Level
* Risk Score
* Key Metrics (delivery delay, defect rate, etc.)
* Explanation

### Inherent Risk Panel

* Rolling Risk Score
* Risk Level
* Event Count
* Category Breakdown Chart
* Latest Event Explanation

This provides transparency.

---

# 4.3 Event Timeline Section

List of recent risk events:

| Date | Category | Level | Explanation |
| ---- | -------- | ----- | ----------- |

This supports auditability.

---

# 5. How Other Modules Consume SRA

---

# 5.1 Route Optimization (RO)

Consumes:

```
integrated_risk_score
```

Usage:

```
total_cost = transport_cost + (integrated_risk_score × risk_weight)
```

High risk increases allocation penalty.

RO does NOT use explanations.

---

# 5.2 Inventory Management (IM)

Consumes:

```
integrated_risk_level
```

Usage:

```
Low    → multiplier = 1.0
Medium → multiplier = 1.3
High   → multiplier = 1.6
```

Used in safety stock calculation.

IM does NOT need breakdown details.

---

# 6. What Is Currently Being Completed

The following extension is in progress:

---

# 6.1 Global / Macro Risk Layer

Purpose:

Handle events affecting:

* Multiple suppliers
* Regions
* Logistics
* Inventory planning

Example:

* Shipping disruption
* Oil crisis
* Regulatory bans

Planned Output Schema:

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

This will allow:

* RO to apply regional risk penalties
* IM to adjust safety stock globally
* Dashboard to display active macro risks

---

# 7. Design Principles

* Risk is event-driven
* Risk is normalized (0–100)
* Risk is explainable
* Backend is single source of truth
* Modules consume structured outputs only

---

# 8. Current Status

Completed:

* Inherent Risk Engine
* Financial Risk Integration
* Integrated Risk Engine
* API Endpoints
* Duplicate Handling
* Dashboard-ready response format

In Progress:

* Global Risk Event Layer
* Multi-supplier event handling

---

# 9. Final System Goal

SRA provides:

* A unified supplier risk score
* Explainable breakdown
* Planning-ready numeric signals
* Cross-module integration capability

It transforms risk from reporting into a decision-support intelligence layer.

---