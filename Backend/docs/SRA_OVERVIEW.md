# Supplier Risk Assessment (SRA) – System Overview

## 1. System Purpose

The **Supplier Risk Assessment (SRA)** system evaluates the reliability and stability of suppliers in a supply chain.

It continuously monitors multiple risk dimensions and produces a **unified supplier risk score** used by planning systems such as:

* Route Optimization (RO)
* Inventory Management (IM)
* Supply chain monitoring dashboards

The system converts **unstructured real-world events** into structured risk intelligence.

Example events:

* factory fire
* chemical leak
* labor strike
* regulatory investigation
* geopolitical disruption

These events are processed automatically and influence supplier risk scores in near real time.

---

# 2. Risk Dimensions

The SRA system evaluates suppliers across three major dimensions.

## Financial Risk

Financial risk evaluates the operational and financial stability of suppliers.

This component uses a **machine learning model** trained on supplier financial indicators.

Model:

```
XGBoost classifier
```

Output:

```
risk_score
risk_level
probabilities
explanation
```

This score represents the **financial reliability of a supplier**.

---

## Operational (Inherent) Risk

Operational risk represents real-world disruptions affecting supplier operations.

Examples:

```
industrial accidents
production shutdowns
chemical incidents
labor strikes
equipment failures
```

These events are detected from text sources using a **DistilBERT-based NLP classifier**.

Model:

```
DistilBERT (fine-tuned for supply-chain risk classification)
```

The model converts incident descriptions into structured risk signals.

Example:

Input:

```
Explosion at BASF polymer production facility
```

Output:

```
risk_category: Safety & Chemical
risk_level: High
risk_score: 76
```

These signals update the **Supplier Risk Index**.

---

## Global (Geopolitical) Risk

Global risk represents macro-level disruptions affecting supply chains.

Examples:

```
trade sanctions
regional conflicts
port strikes
geopolitical instability
```

These events affect:

```
suppliers
transport routes
logistics networks
```

Global events are registered in the **Global Risk Engine** and evaluated based on supplier region.

---

# 3. Core Design Principles

The SRA system is designed using several architectural principles.

## Event-Driven Risk

Risk scores change when **new events occur**.

Examples:

```
factory incidents
legal actions
operational disruptions
```

Each event triggers recalculation of the supplier risk index.

---

## Normalized Risk Scoring

All risk signals are normalized to a unified scale.

```
0 – 100
```

This ensures consistent integration across:

```
financial risk
operational risk
global risk
```

---

## Time-Aware Risk

Risk signals include validity windows.

```
valid_from
valid_to
```

Planning algorithms only apply risk signals **during their active period**.

Example:

```
Trade sanctions valid from March to May
```

---

## Explainability

Each risk prediction includes explanations used for:

```
risk dashboards
auditability
model debugging
decision transparency
```

Example:

```
Predicted high risk due to chemical safety incident at supplier facility
```

---

## Backend as Single Source of Truth

All systems consume risk information through **API endpoints**, not through internal model outputs.

Examples:

```
/api/integrated-risk/{supplier_id}
/api/risk-feed/{supplier_id}
/api/global-risk
```

This ensures consistent risk interpretation across the platform.

---

# 4. Event Processing Pipeline

Operational risk events are processed through the following pipeline.

```
Event text
      ↓
Supplier Detection (NER)
      ↓
DistilBERT Risk Classification
      ↓
Risk Scoring & Normalization
      ↓
Risk Event Storage
      ↓
Supplier Risk Index Update
      ↓
Integrated Risk Engine
      ↓
Unified Risk Feed API
```

---

# 5. System Components

The SRA architecture is composed of modular risk engines.

```
Supplier Registry
        ↓
Inherent Risk Engine
        ↓
Financial Risk Engine
        ↓
Integrated Risk Engine
        ↓
Risk Feed API
```

Supporting modules:

```
Global Risk Engine
Risk Event Monitoring
News Simulation Engine
```

Each module is independent and can evolve without breaking the overall architecture.

---

# 6. Key Features

### Real-Time Risk Monitoring

Operational events update supplier risk scores automatically.

---

### Machine Learning Risk Detection

DistilBERT identifies supply chain disruptions from incident text.

---

### Modular Risk Architecture

Each risk engine operates independently and feeds a unified integration layer.

---

### Unified Risk API

Applications access supplier risk through a unified API.

```
GET /api/risk-feed/{supplier_id}
```

---

# 7. Technology Stack

| Layer           | Technology          |
| --------------- | ------------------- |
| API Framework   | FastAPI             |
| ML Models       | DistilBERT, XGBoost |
| Data Processing | Pandas, NumPy       |
| Event Storage   | SQLite              |
| User Database   | MySQL               |
| Server          | Uvicorn             |

---

# 8. System Status

The SRA backend currently includes the following modules:

```
Supplier Registry
Financial Risk Engine
Inherent Risk Engine (DistilBERT)
Risk Event Monitoring
Integrated Risk Engine
Global Risk Engine
Risk Feed API
Real-time News Simulation
```

The system is capable of **automatically detecting operational disruptions and updating supplier risk intelligence in real time**.

