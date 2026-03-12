# Supplier Risk Assessment (SRA) API Reference

This document describes all API endpoints exposed by the **Supplier Risk Assessment (SRA)** backend.

These APIs are consumed by:

* Frontend risk dashboards
* Route Optimization (RO)
* Inventory Management (IM)

All endpoints are served through the **FastAPI backend server**.

Base URL (local development):

```
http://localhost:8000
```

---

# 1. Complete System Testing Guide (Terminal)

The following steps allow developers to **fully test the SRA system using only terminal commands**.

This guide demonstrates:

* starting the backend
* triggering risk events
* verifying database updates
* observing supplier risk changes
* validating integrated risk calculations

---

## Step 1 — Start Backend Server

From the project root run:

```
python Backend/main.py
```

Expected output:

```
Uvicorn running on http://0.0.0.0:8000
```

API documentation:

```
http://localhost:8000/docs
```

---

## Step 2 — Verify Backend Health

Test if the backend is running:

```
curl http://localhost:8000/
```

Example response:

```json
{
  "message": "Company Verification API is running",
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## Step 3 — Trigger an Operational Risk Event

Send an event describing a disruption affecting a supplier.

```
curl -X POST http://localhost:8000/api/plastic-inherent-risk \
-H "Content-Type: application/json" \
-d '{"text": "Explosion at BASF polymer production plant"}'
```

Example response:

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

This step runs the **DistilBERT inherent risk classifier**.

---

## Step 4 — Verify Event Stored in Database

Open the SQLite database:

```
sqlite3 Backend/plastic_inherent_risk/plastic_risk.db
```

Check stored events:

```
SELECT supplier_id,event_text,risk_level,created_at
FROM risk_event_history
ORDER BY created_at DESC
LIMIT 5;
```

Example result:

```
PLASTIC-19749e1e | Explosion at BASF polymer production plant | High | 2026-03-11
```

Exit database:

```
.quit
```

---

## Step 5 — View Recent Risk Events

```
curl http://localhost:8000/api/risk-events/recent
```

Example response:

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

## Step 6 — Check Integrated Supplier Risk

```
curl http://localhost:8000/api/integrated-risk/PLASTIC-19749e1e
```

Example response:

```json
{
  "integrated_risk_score": 29.2,
  "integrated_risk_level": "Low"
}
```

This endpoint combines:

* Financial risk
* Inherent risk

---

## Step 7 — View Unified Risk Feed

```
curl http://localhost:8000/api/risk-feed/PLASTIC-19749e1e
```

This endpoint aggregates all risk signals used by the **frontend dashboard**.

---

## Step 8 — View Global Supply Chain Risk Events

```
curl http://localhost:8000/api/global-risk
```

Example response:

```json
{
  "event_count": 3,
  "events": [
    {
      "event_type": "Trade Sanctions",
      "risk_level": "High"
    }
  ]
}
```

---

# 2. Supplier Financial Risk

## Endpoint

```
GET /api/supplier-risk/{supplier_id}
```

## Purpose

Predicts financial stability of a supplier using the **XGBoost model**.

---

## Example Request

```
curl http://localhost:8000/api/supplier-risk/PLASTIC-19749e1e
```

---

## Example Response

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

---

## Edge Cases

### Supplier not found

```json
{
  "status": "error",
  "message": "supplier_not_found"
}
```

### Invalid supplier ID

The system validates supplier IDs before computing risk.

---

# 3. Inherent Risk Event Processing

## Endpoint

```
POST /api/plastic-inherent-risk
```

## Purpose

Processes unstructured event text using **DistilBERT NLP model**.

Steps performed:

```
Event Text
↓
Supplier detection
↓
Risk classification
↓
Risk normalization
↓
Time decay
↓
Database storage
```

---

## Request

```json
{
 "text": "Explosion at BASF polymer production plant"
}
```

---

## Response

```json
{
 "status": "stored",
 "result": {
   "risk_category": "Safety & Chemical",
   "risk_level": "High",
   "risk_score": 82,
   "normalized_score": 76.4,
   "decayed_score": 74.2
 },
 "supplier_risk_index": 63.5
}
```

---

## Edge Cases

### Supplier not detected in text

```json
{
 "status": "no_supplier_found"
}
```

### Duplicate event

If the same event text already exists:

```
status: exists
```

The system prevents duplicate entries.

---

# 4. Risk Event Monitoring

## Endpoint

```
GET /api/risk-events/recent
```

Returns the most recent operational risk events stored in SQLite.

Used for:

* monitoring dashboards
* risk analytics
* incident timeline visualization

---

# 5. Integrated Supplier Risk

## Endpoint

```
GET /api/integrated-risk/{supplier_id}
```

Computes combined supplier risk.

---

## Formula

```
IntegratedRisk =
0.6 × FinancialRisk
+
0.4 × InherentRisk
```

---

## Example Response

```json
{
 "supplier_id": "PLASTIC-19749e1e",
 "integrated_risk_score": 29.2,
 "integrated_risk_level": "Low"
}
```

---

# 6. Global Risk Events

## Endpoint

```
GET /api/global-risk
```

Returns macro supply chain disruptions.

Examples:

* trade sanctions
* regional conflicts
* port strikes

---

# 7. Unified Risk Feed

## Endpoint

```
GET /api/risk-feed/{supplier_id}
```

Recommended endpoint for frontend dashboards.

Aggregates:

```
financial risk
inherent risk
integrated risk
```

---

# 8. Health Check

```
GET /
```

Used to verify backend availability.

---

# 9. Recommended API Usage

### Frontend Dashboard

Use:

```
/api/risk-feed/{supplier_id}
```

---

### Route Optimization

Use:

```
/api/integrated-risk/{supplier_id}
```

to evaluate supplier reliability.

---

### Inventory Management

Use:

```
/api/integrated-risk/{supplier_id}
```

to adjust safety stock levels.
