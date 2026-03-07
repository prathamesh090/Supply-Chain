# SUPPLIER RISK ASSESSMENT (SRA) – ARCHITECTURE & INTEGRATION GUIDE

# 1. Purpose

Supplier Risk Assessment (**SRA**) is a centralized backend intelligence layer that evaluates **supplier reliability and supply chain disruption risk**.

It combines multiple risk signals:

1. **Financial & Operational Risk Model**
   (structured supplier performance metrics)

2. **Inherent Risk Model**
   (AI-based risk detection from unstructured text such as news or incident reports)

3. **Global / Macro Risk Layer**
   (regional disruptions affecting multiple suppliers)

4. **Integrated Risk Engine**
   (unified planning-ready risk score)

SRA provides:

* A normalized **numeric risk score (0–100)**
* A **categorical risk level (Low / Medium / High)**
* Explainability for dashboards
* Structured outputs for **Route Optimization (RO)**
* Structured outputs for **Inventory Management (IM)**
* A unified **risk feed API** for frontend dashboards

SRA is a **decision-support system**.
It does **not directly automate operational decisions**.

---

# 2. High-Level Architecture

```
                    External Risk Signals
                 (News / Events / Incidents)
                            │
                            ▼
                Inherent Risk Detection Engine
                POST /plastic/inherent-risk/predict
                            │
                            ▼
                    inherent_risk table
                            │
                            ▼
                 Supplier Risk Aggregation
                 supplier_risk_index table
                            │
                            │
      Structured Supplier Data ──► Financial Risk Model
                            │
                            ▼
                   Integrated Risk Engine
             GET /api/integrated-risk/{supplier_id}
                            │
                            ▼
                     Global Risk Engine
                  GET /api/global-risk
                            │
                            ▼
                     Unified Risk Feed
                GET /api/risk-feed/{supplier_id}
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   Frontend Dashboard   Route Optimization   Inventory Mgmt
```

---

# 3. Core Design Principles

The SRA system is designed with the following principles:

### Event-driven risk

Risk changes when **new events occur** (incidents, legal actions, accidents).

### Normalized scoring

All risk signals are normalized to:

```
0 – 100
```

This enables consistent integration across modules.

### Time-aware risk

Risk signals include:

```
valid_from
valid_to
```

Ensuring planning algorithms apply risk **only within valid periods**.

### Explainability

Every risk score includes explanations for:

* dashboards
* auditability
* debugging

### Backend as single source of truth

All modules consume **structured API outputs**, not internal model results.

---

# 4. Data Storage

SRA uses **SQLite storage** for risk events and supplier metadata.

Database file:

```
plastic_inherent_risk/plastic_risk.db
```

---

# 4.1 supplier_registry

Stores known suppliers and metadata.

Purpose:

```
Resolve supplier names detected in news text
```

Schema:

| Column        | Description                        |
| ------------- | ---------------------------------- |
| supplier_id   | unique supplier identifier         |
| supplier_name | canonical supplier name            |
| aliases       | alternative names detected in text |
| country       | supplier country                   |
| region        | geographic region                  |
| created_at    | record creation time               |

Example:

```
supplier_id: PLASTIC-19749e1e
supplier_name: basf
country: Germany
region: Germany
```

---

# 4.2 inherent_risk

Stores individual detected risk events.

Each row represents **one risk event extracted from text**.

Schema:

| Column           | Description           |
| ---------------- | --------------------- |
| id               | event ID              |
| supplier_id      | affected supplier     |
| text             | original text         |
| category         | risk category         |
| confidence       | model confidence      |
| risk_level       | Low / Medium / High   |
| risk_score       | normalized risk score |
| normalized_score | normalized score      |
| decayed_score    | time-decayed score    |
| decay_lambda     | decay parameter       |
| explanation      | model explanation     |
| signals          | detected signals      |
| created_at       | timestamp             |

---

# 4.3 supplier_risk_index

Aggregated supplier risk state.

Updated automatically when new events occur.

Schema:

| Column             | Description               |
| ------------------ | ------------------------- |
| supplier_id        | supplier                  |
| rolling_risk_score | aggregated risk score     |
| risk_level         | Low / Medium / High       |
| event_count        | number of detected events |
| last_event_at      | last detected event       |
| category_breakdown | category distribution     |
| updated_at         | update timestamp          |

---

# 5. Component Breakdown

---

# 5.1 Inherent Risk Engine (AI Event Detection)

Purpose:

Detect **risk signals from unstructured text** such as:

* news articles
* accident reports
* regulatory actions
* production shutdowns

Model:

```
DistilBERT classifier
```

---

### Endpoint

```
POST /plastic/inherent-risk/predict
```

---

### Input

```json
{
  "text": "Explosion at BASF polymer manufacturing facility"
}
```

Supplier name is resolved using the **supplier registry mapping engine**.

---

### Output (Event-Level Response)

```json
{
  "status": "stored",
  "result": {
    "risk_category": "Safety & Chemical",
    "risk_level": "High",
    "confidence": 0.84,
    "risk_score": 75.98,
    "explanation": "Incidents involving hazardous materials can disrupt production",
    "time_horizon": "short_term"
  },
  "supplier_risk_index": {
    "supplier_id": "PLASTIC-19749e1e",
    "rolling_risk_score": 74.46,
    "risk_level": "High",
    "event_count": 3
  }
}
```

---

### Key Behavior

* Duplicate events prevented using text hash
* Risk aggregation updates automatically
* Event history stored for audit
* Rolling supplier risk index updated

---

# 5.2 Financial & Operational Risk Model

Purpose:

Evaluate supplier reliability using **structured supplier metrics**.

Inputs include:

* Delivery delay rate
* Defect rate
* Price variance
* Compliance performance
* Trust score

Model:

```
XGBoost classification model
```

---

### Internal Output

```json
{
  "risk_score": 5.0,
  "risk_level": "Low",
  "probabilities": {
    "Low": 0.82,
    "Medium": 0.17
  }
}
```

This output is consumed internally by the **Integrated Risk Engine**.

---

# 5.3 Integrated Risk Engine

The **primary planning signal** used across the platform.

---

### Endpoint

```
GET /api/integrated-risk/{supplier_id}
```

---

### Output Schema

```json
{
  "status": "ok",
  "supplier_id": "PLASTIC-19749e1e",
  "supplier_name": "basf",

  "financial_risk": {
    "risk_score": 5,
    "risk_level": "Low"
  },

  "inherent_risk": {
    "rolling_risk_score": 74.46,
    "risk_level": "High",
    "event_count": 3
  },

  "integrated_risk_score": 32.78,
  "integrated_risk_level": "Low",

  "risk_scope": ["supplier","distribution"],

  "valid_from": "2026-03-07",
  "valid_to": "2026-04-06"
}
```

---

### Integration Logic

```
Integrated Risk Score =
   (0.6 × Financial Score)
 + (0.4 × Inherent Score)
```

Weights are configurable.

---

# 5.4 Global Risk Engine

Handles **macro disruptions affecting multiple suppliers or regions**.

Examples:

* geopolitical conflict
* logistics disruptions
* natural disasters
* regulatory changes

---

### Endpoint

```
GET /api/global-risk
```

---

### Example Event

```json
{
  "event_id": "GLOBAL_2026_001",
  "event_type": "Geopolitical",
  "risk_score": 75,
  "risk_level": "High",
  "affected_regions": ["Asia"],
  "affects": ["distribution","inventory"],
  "valid_from": "2026-03-01",
  "valid_to": "2026-04-30"
}
```

Global risk affects **multiple suppliers simultaneously**.

---

# 5.5 Unified Risk Feed

This endpoint combines:

* integrated supplier risk
* global risk impact

---

### Endpoint

```
GET /api/risk-feed/{supplier_id}
```

---

### Output

```json
{
  "supplier_id": "PLASTIC-19749e1e",
  "supplier_name": "basf",

  "supplier_risk_score": 32.78,
  "supplier_risk_level": "Low",

  "global_risk_score": 75,

  "final_risk_score": 39.61,
  "final_risk_level": "Moderate",

  "risk_scope": ["supplier","distribution"]
}
```

This is the **main API used by frontend dashboards**.

---

# 6. Frontend Dashboard Design

The dashboard should include:

---

## 6.1 Supplier Risk Summary

Display:

```
Supplier Name
Final Risk Level
Final Risk Score
Validity Period
```

Example:

```
Supplier: BASF
Risk Level: MODERATE
Score: 39.61 / 100
Valid: Mar 7 – Apr 6
```

---

## 6.2 Risk Breakdown

Two panels:

### Financial Risk

* risk score
* risk level
* explanation

### Inherent Risk

* rolling risk score
* event count
* category breakdown

---

## 6.3 Event Timeline

| Date  | Category | Level | Description                   |
| ----- | -------- | ----- | ----------------------------- |
| Mar 7 | Safety   | High  | Explosion at polymer facility |

---

# 7. How Route Optimization (RO) Uses SRA

RO consumes:

```
integrated_risk_score
risk_scope
valid_from
valid_to
```

Example usage:

```
total_cost =
   transport_cost
 + (integrated_risk_score × risk_weight)
```

If:

```
"distribution" ∉ risk_scope
```

Then no penalty is applied.

---

# 8. How Inventory Management (IM) Uses SRA

IM adjusts safety stock.

Inputs:

```
integrated_risk_level
risk_scope
```

Example:

```
Low → multiplier 1.0
Medium → multiplier 1.3
High → multiplier 1.6
```

If:

```
"inventory" ∉ risk_scope
```

Then safety stock remains unchanged.

---

# 9. Risk Exposure (Future KPI)

Derived metric:

```
risk_exposure =
   integrated_risk_score × allocated_volume
```

This metric is used for:

* analytics dashboards
* supplier risk comparison
* supply chain stress testing

---

# 10. Current Implementation Status

Completed:

```
Inherent Risk Engine
Financial Risk Model Integration
Supplier Risk Aggregation
Integrated Risk Engine
Global Risk Layer
Unified Risk Feed API
SQLite persistence
Duplicate event protection
```

Future Enhancements:

```
automated news ingestion
multi-supplier event detection
real-time alerting
risk trend analytics
```

---

# 11. Final System Goal

SRA transforms risk from **static reporting** into **real-time supply chain intelligence**.

The system provides:

* unified supplier risk scoring
* explainable AI risk detection
* time-aware planning signals
* integration with optimization and inventory modules

It acts as the **risk intelligence layer for the entire supply chain platform**.

---