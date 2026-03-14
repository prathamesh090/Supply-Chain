# Supplier Risk Assessment (SRA) Architecture

## 1. System Overview

The Supplier Risk Assessment (SRA) system evaluates supply chain risk by combining multiple risk dimensions into a unified assessment.

The system analyzes:

* Supplier financial stability
* Operational incidents
* Real-time risk events
* Global geopolitical disruptions

These signals are aggregated into an **Integrated Risk Score** used by:

* Route Optimization (RO)
* Inventory Management (IM)
* Frontend risk dashboards

The architecture follows a **modular risk engine design**, where each module produces a specific risk signal.

---

# 2. High-Level Architecture

```
                  +----------------------+
                  |   Supplier Registry  |
                  |----------------------|
                  | supplier_id          |
                  | supplier_name        |
                  | region               |
                  | materials            |
                  +----------+-----------+
                             |
                             |
                +------------v-------------+
                |    Inherent Risk Engine  |
                |--------------------------|
                | Event classification     |
                | Risk normalization       |
                | Time decay               |
                +------------+-------------+
                             |
                             |
         +-------------------v-------------------+
         |        Financial Risk Engine          |
         |---------------------------------------|
         | XGBoost financial risk prediction     |
         | Operational financial indicators      |
         +-------------------+-------------------+
                             |
                             |
               +-------------v-------------+
               |    Integrated Risk Engine |
               |---------------------------|
               | Combines risk sources     |
               | Weighted risk scoring     |
               +-------------+-------------+
                             |
                             |
             +---------------v---------------+
             |         Risk Feed API         |
             |--------------------------------|
             | Unified risk output for apps   |
             +---------------+---------------+
                             |
         +-------------------+-------------------+
         |                                       |
+--------v--------+                     +--------v--------+
| Route Optimization |                 | Inventory Mgmt  |
| (RO Engine)        |                 | (IM System)     |
+--------------------+                 +-----------------+
```

---

# 3. Core Modules

## 3.1 Supplier Registry

The Supplier Registry is the **identity layer** for the entire SRA system.

It stores supplier metadata used by all modules.

### Responsibilities

* Assign unique `supplier_id`
* Maintain supplier metadata
* Map suppliers to geographic regions
* Link suppliers to materials or product types

### Example supplier record

```
supplier_id: PLASTIC-19749e1e
supplier_name: BASF
region: Europe
materials: Polypropylene
tier: Tier-1
```

### Used by

```
Inherent Risk Engine
Financial Risk Engine
Integrated Risk Engine
Route Optimization
Inventory Management
```

---

# 3.2 Inherent Risk Engine

The Inherent Risk Engine detects **operational risks** affecting suppliers.

These include:

* industrial accidents
* production disruptions
* chemical leaks
* labor strikes
* facility shutdowns

### Processing Pipeline

```
News/Event Text
      ↓
Supplier Detection
      ↓
ML Risk Classification
      ↓
Risk Scoring
      ↓
Normalization
      ↓
Time Decay
      ↓
SQLite Storage
```

### Example event

```
Explosion at BASF polymer production plant
category: Safety & Chemical
risk_level: High
risk_score: 82
```

### Storage

Events are stored in:

```
SQLite database
plastic_risk.db
```

Table:

```
risk_event_history
```

---

# 3.3 Financial Risk Engine

The Financial Risk Engine predicts **supplier financial stability** using machine learning.

### Model

```
XGBoost classifier
```

### Inputs

```
financial indicators
operational performance metrics
supplier features
```

### Outputs

```
risk_score
risk_level
probabilities
model explanation
```

### Example output

```
risk_score: 5
risk_level: Low
probabilities:
   Low: 0.82
   Medium: 0.18
```

---

# 3.4 Integrated Risk Engine

The Integrated Risk Engine combines:

```
Financial Risk
+
Inherent Risk
```

to compute the **overall supplier risk level**.

### Weighted formula

```
IntegratedRisk = 
    0.6 × FinancialRisk
  + 0.4 × InherentRisk
```

### Output

```
integrated_risk_score
integrated_risk_level
risk_scope
validity_window
```

Example:

```
integrated_risk_score: 29.22
risk_level: Low
```

---

# 3.5 Global Risk Engine

The Global Risk Engine models **macro-level disruptions** affecting supply chains.

Examples include:

```
trade sanctions
regional conflicts
port strikes
logistics disruptions
```

### Event structure

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

Example:

```
event_id: GEO-001
event_type: Trade Sanctions
affected_regions: Europe
affects: suppliers, routes
risk_level: High
```

These events are stored in an **in-memory repository** and loaded at startup.

---

# 3.6 Risk Feed API

The Risk Feed API provides a **single unified endpoint** for applications.

Instead of calling multiple services, applications request:

```
/api/risk-feed/{supplier_id}
```

The API returns:

```
financial risk
inherent risk
integrated risk
```

This simplifies frontend integration.

---

# 3.7 Risk Event Monitoring

This module exposes historical risk events.

Endpoint:

```
/api/risk-events/recent
```

Used for:

```
risk dashboards
analytics
monitoring
```

---

# 3.8 News Simulation Engine

To simulate real-time risk signals, the system includes a **background news generator**.

The simulator periodically generates supply chain events such as:

```
factory fire
chemical leak
production shutdown
logistics disruption
```

These events automatically trigger the Inherent Risk Engine.

---

# 4. Technology Stack

| Layer              | Technology         |
| ------------------ | ------------------ |
| API framework      | FastAPI            |
| ML models          | XGBoost / LightGBM |
| Data processing    | Pandas / NumPy     |
| Risk event storage | SQLite             |
| Supplier database  | MySQL              |
| API server         | Uvicorn            |

---

# 5. Key System Properties

### Modular Architecture

Each risk component operates independently.

### Real-Time Risk Updates

New events automatically update supplier risk.

### Extensible Design

Additional risk modules can be added without modifying existing components.

### Unified Risk Interface

All applications consume risk through the **Risk Feed API**.