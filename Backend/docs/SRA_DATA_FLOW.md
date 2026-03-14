# Supplier Risk Assessment (SRA) Data Flow

## 1. Overview

This document explains how data moves through the Supplier Risk Assessment system from event generation to final risk consumption.

The SRA system processes multiple sources of risk data and aggregates them into a unified risk assessment used by operational systems.

The data flow follows this pipeline:

```
News / Events
     ↓
Inherent Risk Engine
     ↓
Financial Risk Engine
     ↓
Integrated Risk Engine
     ↓
Risk Feed API
     ↓
RO / IM / Frontend
```

Additionally, macro-level disruptions are modeled through the Global Risk module.

---

# 2. Supplier Registration Flow

All risk engines depend on supplier identity.

The Supplier Registry provides this foundation.

### Flow

```
Supplier Data
     ↓
Supplier Registry
     ↓
supplier_id generated
     ↓
supplier metadata stored
```

### Supplier Metadata

Typical supplier attributes include:

```
supplier_id
supplier_name
region
material_type
tier_level
```

### Example

```
supplier_id: PLASTIC-19749e1e
supplier_name: BASF
region: Europe
material: Polypropylene
tier: Tier-1
```

The `supplier_id` becomes the primary key used across the system.

---

# 3. Operational Risk Event Flow

Operational disruptions originate from event text inputs or simulated news events.

### Event Pipeline

```
News Event
     ↓
Supplier Mapping
     ↓
Risk Prediction Model
     ↓
Risk Enrichment
     ↓
Normalization
     ↓
Time Decay
     ↓
SQLite Storage
```

### Step-by-step processing

#### 1. Event generation

Example simulated event:

```
Explosion at BASF polymer production plant
```

#### 2. Supplier detection

The system attempts to identify the supplier referenced in the event.

```
match_supplier_from_text()
```

Output:

```
supplier_id: PLASTIC-19749e1e
```

#### 3. Risk prediction

The ML classifier predicts the inherent risk level.

```
predict_inherent_risk()
```

Example output:

```
category: Safety & Chemical
risk_score: 82
risk_level: High
confidence: 0.91
```

#### 4. Risk enrichment

Additional contextual information is generated.

```
enrich_risk()
```

Outputs include:

```
signals
explanation
adjusted_score
```

#### 5. Risk normalization

Risk scores are normalized to a standardized range.

```
normalize_score()
```

#### 6. Time decay

Risk events lose impact over time.

```
apply_decay()
```

This prevents old events from dominating risk calculations.

#### 7. Storage

Events are stored in SQLite:

```
plastic_risk.db
```

Table:

```
risk_event_history
```

---

# 4. Financial Risk Flow

Financial risk is evaluated using a trained machine learning model.

### Pipeline

```
Supplier Features
     ↓
Financial Risk Model
     ↓
Probability Estimation
     ↓
Risk Score
```

### Model

```
XGBoost classifier
```

### Example Output

```
risk_score: 5
risk_level: Low

probabilities:
Low: 0.82
Medium: 0.18
```

The financial model predicts the **likelihood of supplier financial distress**.

---

# 5. Integrated Risk Calculation

The Integrated Risk Engine merges operational and financial signals.

### Inputs

```
Financial Risk
+
Inherent Risk
```

### Formula

```
IntegratedRisk =
    0.6 × FinancialRisk
  + 0.4 × InherentRisk
```

### Example

```
Financial Risk Score: 5
Inherent Risk Score: 65.5
```

```
IntegratedRisk =
    0.6 × 5
  + 0.4 × 65.5
```

```
IntegratedRisk = 29.2
```

Result:

```
risk_level: Low
```

---

# 6. Global Risk Event Flow

Global disruptions are loaded during system startup.

### Event Loader

```
load_global_events()
```

Example events:

```
Trade Sanctions
Regional Conflict
Port Strike
```

### Event Structure

```
event_id
event_type
risk_score
risk_level
affected_regions
affects
valid_from
valid_to
```

These events represent **macro supply chain disruptions**.

---

# 7. Risk Feed Aggregation

Applications do not need to call multiple endpoints.

The Risk Feed API aggregates all risk signals.

### Endpoint

```
GET /api/risk-feed/{supplier_id}
```

### Aggregation pipeline

```
supplier_id
     ↓
Financial Risk Engine
     ↓
Inherent Risk Engine
     ↓
Integrated Risk Engine
     ↓
Unified Response
```

### Example Response

```
financial_risk
inherent_risk
integrated_risk_score
integrated_risk_level
```

---

# 8. Risk Event Monitoring Flow

Operational risk events are exposed for analytics.

Endpoint:

```
GET /api/risk-events/recent
```

Used for:

```
risk dashboards
analytics
event monitoring
```

Example event:

```
Cooling system failure halts BASF polymer extrusion unit
risk_level: Medium
```

---

# 9. Real-Time Risk Simulation

The system includes a background simulator.

### Simulation loop

```
generate_event()
     ↓
process_inherent_risk()
     ↓
store_event()
```

Example generated events:

```
Factory fire
Chemical leak
Logistics disruption
Maintenance shutdown
```

These events continuously update the risk database.

---

# 10. Risk Consumption

The final risk output is consumed by:

### Frontend Dashboard

Displays:

```
supplier risk levels
recent incidents
risk trends
```

### Route Optimization (RO)

RO uses risk scores to:

```
avoid high-risk suppliers
avoid risky routes
select resilient supply paths
```

### Inventory Management (IM)

IM uses risk scores to:

```
increase safety stock
prioritize reliable suppliers
trigger contingency planning
```

