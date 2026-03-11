# Supplier Risk Assessment (SRA) API Reference

This document describes all API endpoints exposed by the Supplier Risk Assessment system. These endpoints are used by the frontend dashboard, Route Optimization (RO), and Inventory Management (IM).

All endpoints are served from the FastAPI backend.

Base URL (local development):

```
http://localhost:8000
```

---

# 1. Supplier Financial Risk

## Endpoint

```
GET /api/supplier-risk/{supplier_id}
```

## Description

Returns the financial risk prediction for a supplier using the trained machine learning model.

## Path Parameters

| Parameter   | Type   | Description                |
| ----------- | ------ | -------------------------- |
| supplier_id | string | Unique supplier identifier |

Example:

```
/api/supplier-risk/PLASTIC-19749e1e
```

## Response

```json
{
  "status": "ok",
  "supplier_name": "basf",
  "risk_score": 5,
  "risk_level": "Low",
  "probabilities": {
    "Low": 0.82,
    "Medium": 0.18
  },
  "explanation": "Predicted low risk (score: 5.0/100)",
  "model_type": "financial_operational_xgboost_v1"
}
```

## Fields

| Field         | Description                                        |
| ------------- | -------------------------------------------------- |
| risk_score    | numeric financial risk score                       |
| risk_level    | categorical risk classification                    |
| probabilities | probability distribution of predicted risk classes |
| explanation   | model explanation                                  |
| model_type    | ML model used                                      |

---

# 2. Inherent Risk Event Processing

## Endpoint

```
POST /api/plastic-inherent-risk
```

## Description

Processes an operational event and computes the inherent risk impact on a supplier.

## Request Body

```json
{
  "text": "Explosion at BASF polymer production plant"
}
```

Supplier detection is performed automatically.

## Response

```json
{
  "status": "stored",
  "result": {
    "risk_category": "Safety & Chemical",
    "risk_level": "High",
    "risk_score": 82,
    "normalized_score": 76.4,
    "decayed_score": 74.2,
    "confidence": 0.91
  },
  "supplier_risk_index": 63.5
}
```

## Fields

| Field               | Description                 |
| ------------------- | --------------------------- |
| risk_category       | classified risk category    |
| risk_level          | severity level              |
| risk_score          | raw model risk score        |
| normalized_score    | normalized risk score       |
| decayed_score       | time-decayed score          |
| supplier_risk_index | rolling supplier risk score |

---

# 3. Risk Event Monitoring

## Endpoint

```
GET /api/risk-events/recent
```

## Description

Returns recently recorded operational risk events.

Used by monitoring dashboards and analytics tools.

## Response

```json
{
  "events": [
    {
      "supplier_id": "PLASTIC-19749e1e",
      "event_text": "Explosion at BASF polymer production plant",
      "category": "Safety & Chemical",
      "risk_level": "High",
      "source": "inherent_ai",
      "created_at": "2026-03-11T17:37:33"
    }
  ]
}
```

---

# 4. Integrated Supplier Risk

## Endpoint

```
GET /api/integrated-risk/{supplier_id}
```

## Description

Computes the combined risk score for a supplier using financial and operational risk signals.

## Response

```json
{
  "status": "ok",
  "supplier_id": "PLASTIC-19749e1e",
  "supplier_name": "basf",
  "financial_risk": { ... },
  "inherent_risk": {
    "rolling_risk_score": 65.5,
    "risk_level": "Medium",
    "event_count": 11
  },
  "integrated_risk_score": 29.2,
  "integrated_risk_level": "Low",
  "valid_from": "2026-03-11",
  "valid_to": "2026-04-10"
}
```

## Integration Formula

```
Integrated Risk =
    0.6 × Financial Risk
  + 0.4 × Inherent Risk
```

---

# 5. Global Risk Events

## Endpoint

```
GET /api/global-risk
```

## Description

Returns currently active geopolitical or macro supply chain risk events.

## Response

```json
{
  "status": "ok",
  "event_count": 3,
  "events": [
    {
      "event_id": "GEO-001",
      "event_type": "Trade Sanctions",
      "risk_score": 85,
      "risk_level": "High",
      "affected_regions": ["Europe"],
      "affects": ["suppliers", "routes"],
      "valid_from": "2026-03-01",
      "valid_to": "2026-05-01"
    }
  ]
}
```

## Fields

| Field            | Description                      |
| ---------------- | -------------------------------- |
| event_type       | type of geopolitical disruption  |
| affected_regions | impacted geographic regions      |
| affects          | impacted supply chain components |

---

# 6. Unified Risk Feed

## Endpoint

```
GET /api/risk-feed/{supplier_id}
```

## Description

Provides a unified risk response combining multiple risk modules.

Recommended endpoint for frontend dashboards.

## Response

```json
{
  "supplier_id": "PLASTIC-19749e1e",
  "financial_risk": {...},
  "inherent_risk": {...},
  "integrated_risk": {
    "score": 29.2,
    "level": "Low"
  }
}
```

---

# 7. Health Check

## Endpoint

```
GET /
```

## Response

```json
{
  "message": "Company Verification API is running",
  "status": "healthy",
  "version": "1.0.0"
}
```

Used to verify backend availability.

---

# 8. API Consumption Strategy

Recommended usage for applications.

## Frontend Dashboard

Use:

```
/api/risk-feed/{supplier_id}
```

Display:

* financial risk
* operational risk
* integrated risk

## Route Optimization (RO)

Use:

```
/api/integrated-risk/{supplier_id}
```

to evaluate supplier reliability when computing routes.

## Inventory Management (IM)

Use:

```
/api/integrated-risk/{supplier_id}
```

to adjust safety stock levels and supplier selection.

