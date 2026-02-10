# Plastic Inherent Risk – Backend Service

## Overview

This module implements a **production-grade Plastic Inherent Risk Engine** that detects, scores, explains, and aggregates **supplier-specific risk events** from unstructured text such as news or reports.

It is designed to operate as an **event-driven risk signal service** and act as a foundational input to higher-level supplier risk analytics.

---

## What This Service Does

### Core Capabilities

* **Text-based inherent risk detection** using an NLP model
* **Risk enrichment** (category, severity, explanation, impact areas)
* **Score normalization and temporal decay**
* **Supplier-level rolling risk index**
* **Idempotent event storage**
* **Explainable outputs suitable for UI and audits**

This service is **self-contained** and owns:

* Inference
* Scoring logic
* Persistence
* Aggregation

---

## Phase Coverage

### Phase 1 – Inference Infrastructure (Completed)

* Model loading and inference
* FastAPI endpoint
* SQLite persistence
* Deduplication

### Phase 2 – Risk Intelligence Layer (Completed)

* Risk severity scoring
* Category-based weighting
* Temporal decay (half-life based)
* Supplier-level rolling risk index
* Explainability metadata
* Stable API contract

---

## Architecture

```
plastic_inherent_risk/
│
├── predictor.py               # NLP inference
├── enrichment.py              # Risk enrichment & explanations
├── normalization.py           # Normalization + decay logic
├── supplier_repository.py     # Supplier risk aggregation
├── service.py                 # Orchestration layer
├── schemas.py                 # API contracts
├── router.py                  # FastAPI routes
├── repository.py              # Event persistence
├── database.py                # SQLite initialization
├── constants.py               # Risk taxonomy & rules
├── plastic_risk.db            # SQLite database (gitignored)
└── README.md
```

---

## API

### POST `/plastic/inherent-risk/predict`

Processes a **supplier-specific risk event**.

#### Request

```json
{
  "supplier_id": "SUPPLIER_ABC_001",
  "text": "Government announces new single-use plastic ban"
}
```

#### Response (New Event)

```json
{
  "status": "stored",
  "result": {
    "risk_category": "Regulatory & Compliance",
    "risk_level": "High",
    "risk_score": 32.79,
    "normalized_score": 32.79,
    "decayed_score": 32.79,
    "explanation": "...",
    "signals": ["regulatory_ban", "government_action"],
    "explainability": { ... }
  },
  "supplier_risk_index": {
    "supplier_id": "SUPPLIER_ABC_001",
    "rolling_risk_score": 32.79,
    "risk_level": "Low",
    "event_count": 1
  }
}
```

#### Response (Duplicate Event)

```json
{
  "status": "exists",
  "result": { ... },
  "supplier_risk_index": { ... }
}
```

---

### GET `/plastic/inherent-risk/supplier/{supplier_id}/risk-index`

Returns the **current rolling inherent risk index** for a supplier.

---

## Risk Model Design

* **Input**: Unstructured text (news, reports, disclosures)
* **Model**: Transformer-based classifier
* **Outputs**:

  * Risk category
  * Confidence
* **Post-model logic**:

  * Category weighting
  * Severity scoring
  * Temporal decay
  * Supplier aggregation

The model itself is **unchanged** during Phase 2; intelligence is layered on top.

---

## Persistence & Idempotency

* SQLite used as an event store
* Each risk event is uniquely identified by `(supplier_id, text_hash)`
* Enables:

  * Safe replays
  * Deterministic aggregation
  * Historical analysis

---

## Key Design Principles

* Supplier risk is **event-driven**
* Inherent risk ≠ financial risk
* Explainability is mandatory
* Backend is the single source of truth
* Frontend only consumes computed risk

---

## Status

**Phase 2 complete.
API is stable.
Ready for integration.**