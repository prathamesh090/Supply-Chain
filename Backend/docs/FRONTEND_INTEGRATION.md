# Frontend Integration Guide for Supplier Risk Assessment (SRA)

This document explains how the frontend application should interact with the Supplier Risk Assessment backend APIs to display risk insights, monitoring dashboards, and supplier analytics.

The frontend communicates with the backend using REST APIs exposed by the FastAPI server.

Base API URL (local development):

```
http://localhost:8000
```

---

# 1. Recommended Integration Strategy

Frontend applications should avoid calling multiple APIs individually when possible.

Instead, the **primary endpoint for supplier risk visualization** is:

```
GET /api/risk-feed/{supplier_id}
```

This endpoint aggregates:

* financial risk
* inherent operational risk
* integrated supplier risk

Example request:

```
GET http://localhost:8000/api/risk-feed/PLASTIC-19749e1e
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

This response can power the **supplier risk dashboard**.

---

# 2. Supplier Risk Dashboard

The main frontend dashboard should visualize supplier risk levels.

Recommended UI components:

### Risk Summary Cards

Display three main metrics:

| Metric           | Source API                     |
| ---------------- | ------------------------------ |
| Financial Risk   | `/api/risk-feed/{supplier_id}` |
| Operational Risk | `/api/risk-feed/{supplier_id}` |
| Integrated Risk  | `/api/risk-feed/{supplier_id}` |

Example UI layout:

```
---------------------------------
Supplier: BASF
---------------------------------

Financial Risk      Low
Operational Risk    Medium
Integrated Risk     Low
```

---

# 3. Operational Incident Feed

The frontend can display recent incidents affecting suppliers.

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
      "category": "Safety & Chemical",
      "risk_level": "High",
      "created_at": "2026-03-11T17:37:33"
    }
  ]
}
```

Suggested UI:

```
Recent Risk Events

• Explosion at BASF polymer production plant (High Risk)
• Cooling system failure halts BASF polymer extrusion unit (Medium Risk)
```

---

# 4. Global Risk Monitoring

To visualize geopolitical or macro supply chain disruptions, the frontend should call:

```
GET /api/global-risk
```

Example response:

```json
{
  "event_count": 3,
  "events": [
    {
      "event_type": "Trade Sanctions",
      "risk_level": "High",
      "affected_regions": ["Europe"]
    }
  ]
}
```

Suggested UI:

```
Global Supply Chain Risks

Trade Sanctions affecting Europe
Regional Conflict in Middle East
Port Strike in Asia-Pacific
```

---

# 5. Supplier Risk Drilldown

For detailed risk analysis, the frontend can query the integrated risk endpoint directly.

Endpoint:

```
GET /api/integrated-risk/{supplier_id}
```

Example usage:

```
GET /api/integrated-risk/PLASTIC-19749e1e
```

Suggested UI components:

* supplier risk timeline
* risk trend chart
* event breakdown by category

---

# 6. Data Refresh Strategy

Risk data should be refreshed periodically.

Recommended polling intervals:

| Data Type          | Refresh Interval |
| ------------------ | ---------------- |
| Supplier Risk      | 30 seconds       |
| Operational Events | 10 seconds       |
| Global Risk Events | 5 minutes        |

This ensures dashboards remain up-to-date without excessive API traffic.

---

# 7. Error Handling

Frontend should handle API failures gracefully.

Example error response:

```json
{
  "status": "error",
  "message": "supplier_not_found"
}
```

Recommended behavior:

* show fallback UI
* retry API request
* notify user if supplier is unavailable

---

# 8. Performance Recommendations

To reduce network overhead:

* cache supplier risk responses
* batch supplier queries if possible
* avoid frequent polling of global risk events

---

# 9. Security Considerations

When deployed in production:

* restrict API access via authentication
* configure CORS to allow trusted frontend domains
* validate supplier IDs before sending requests

---

# 10. Frontend Architecture Recommendation

A typical frontend integration flow:

```
User selects supplier
       ↓
Call /api/risk-feed/{supplier_id}
       ↓
Render risk dashboard
       ↓
Fetch /api/risk-events/recent
       ↓
Display incident timeline
       ↓
Fetch /api/global-risk
       ↓
Show macro supply chain risks
```

This approach provides a complete risk view for each supplier.

