# Frontend Integration Guide for Supplier Risk Assessment (SRA)

## 1. Purpose

This document explains how the frontend application interacts with the Supplier Risk Assessment backend.

The frontend uses SRA APIs to visualize:

* supplier reliability
* operational disruptions
* financial risk
* geopolitical supply chain risks

The frontend acts as a **monitoring and decision support interface** for supply chain managers.

---

# 2. Base API URL

Local development server:

```
http://localhost:8000
```

All frontend requests are sent to this backend server.

---

# 3. Core Frontend Data Sources

The frontend uses four main APIs.

| API                                  | Purpose                         |
| ------------------------------------ | ------------------------------- |
| `/api/risk-feed/{supplier_id}`       | Main supplier risk data         |
| `/api/risk-events/recent`            | Recent operational incidents    |
| `/api/global-risk`                   | Global supply chain disruptions |
| `/api/integrated-risk/{supplier_id}` | Detailed supplier risk analysis |

---

# 4. Main Supplier Risk Dashboard

The dashboard shows overall supplier reliability.

Frontend should call:

```
GET /api/risk-feed/{supplier_id}
```

Example request:

```
http://localhost:8000/api/risk-feed/PLASTIC-19749e1e
```

Example response:

```json
{
 "supplier_id": "PLASTIC-19749e1e",
 "financial_risk": {
   "risk_score": 5,
   "risk_level": "Low"
 },
 "inherent_risk": {
   "rolling_risk_score": 65.5,
   "risk_level": "Medium",
   "event_count": 11
 },
 "integrated_risk": {
   "score": 29.2,
   "level": "Low"
 }
}
```

---

# 5. Recommended UI Layout

Example dashboard:

```
Supplier: BASF

Financial Risk     Low
Operational Risk   Medium
Integrated Risk    Low
```

Recommended visual indicators:

| Risk Level | Color  |
| ---------- | ------ |
| Low        | Green  |
| Medium     | Yellow |
| High       | Red    |

This allows supply chain managers to quickly identify risky suppliers.

---

# 6. Operational Incident Feed

Frontend should display recent incidents.

API:

```
GET /api/risk-events/recent
```

Example response:

```json
{
 "events":[
   {
     "supplier_id":"PLASTIC-19749e1e",
     "event_text":"Explosion at BASF polymer production plant",
     "risk_level":"High"
   }
 ]
}
```

Suggested UI:

```
Recent Incidents

Explosion at BASF polymer production plant (High Risk)
Cooling system failure at BASF plant (Medium Risk)
```

---

# 7. Global Supply Chain Risk Dashboard

Frontend should visualize macro disruptions.

API:

```
GET /api/global-risk
```

Example response:

```json
{
 "event_count":3,
 "events":[
   {
     "event_type":"Trade Sanctions",
     "risk_level":"High",
     "affected_regions":["Europe"]
   }
 ]
}
```

Suggested UI:

```
Global Supply Chain Risks

Trade Sanctions – Europe
Regional Conflict – Middle East
Port Strike – Asia-Pacific
```

---

# 8. Supplier Risk Drilldown Page

Detailed supplier analysis page.

API:

```
GET /api/integrated-risk/{supplier_id}
```

Frontend can display:

* supplier risk score
* historical incidents
* risk trend

Example UI:

```
Supplier Risk Details

Financial Risk Score: 5
Operational Risk Score: 65
Integrated Risk Score: 29
```

---

# 9. Risk Explanation Display

Risk APIs return explanations describing why a supplier is considered risky.

Example:

```json
{
 "financial_risk":{
   "risk_level":"Low",
   "explanation":"Predicted low financial risk based on financial indicators"
 }
}
```

Frontend should display this explanation to improve transparency.

Example UI:

```
Risk Explanation

Financial Risk:
Predicted low financial risk based on financial indicators.

Operational Risk:
Recent safety incidents increased risk score.
```

---

# 10. Data Refresh Strategy

Recommended polling intervals:

| Data Type     | Refresh Rate |
| ------------- | ------------ |
| Supplier Risk | 30 seconds   |
| Risk Events   | 10 seconds   |
| Global Risk   | 5 minutes    |

---

# 11. Supplier Risk Update Flow

Supplier risk automatically updates when new events occur.

Process:

```
News Event
↓
Inherent Risk Engine
↓
Event stored in SQLite
↓
Supplier risk index updated
↓
Integrated risk recalculated
↓
Frontend dashboard refresh
```

This allows the system to detect disruptions **in real time**.

---

# 12. Integration with Other Modules

SRA is connected to two major systems.

### Route Optimization (RO)

RO uses supplier risk scores to:

* avoid high risk suppliers
* select safer supply routes

API used:

```
/api/integrated-risk/{supplier_id}
```

---

### Inventory Management (IM)

IM uses supplier risk to adjust inventory levels.

Example logic:

```
High supplier risk
→ increase safety stock
→ choose alternate supplier
```

