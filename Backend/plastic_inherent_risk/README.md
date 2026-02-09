# Plastic Inherent Risk – Backend Service

## Purpose

This module provides a backend service for **Plastic Supplier Inherent Risk Detection**
using NLP-based classification on unstructured text (e.g., news, reports).

The service is designed to:
- Run model inference
- Deduplicate previously processed risk texts
- Persist risk signals for downstream systems

This module intentionally focuses on **infrastructure and inference only**.
Risk interpretation and enrichment are handled in a later phase.

---

## Scope (Phase 1)

✔ Model inference  
✔ FastAPI endpoint  
✔ SQLite persistence  
✔ Deduplication logic  
✔ Backend integration  

❌ Risk level calculation  
❌ Severity scoring  
❌ Business explanation  

These are addressed in **Phase 2**.

---

## Architecture

```

plastic_inherent_risk/
│
├── model/                     # Trained transformer artifacts
├── model_loader.py            # Loads model & tokenizer once
├── predictor.py               # Runs inference
├── schemas.py                 # API request/response schemas
├── service.py                 # Business logic
├── repository.py              # SQLite queries
├── database.py                # DB initialization
├── router.py                  # FastAPI router
├── plastic_risk.db            # SQLite database (gitignored)
└── README.md

````

---

## API Endpoint

### POST `/plastic/inherent-risk/predict`

#### Request
```json
{
  "text": "Government announces new single-use plastic ban"
}
````

#### Response (First occurrence)

```json
{
  "status": "stored",
  "result": {
    "category": "Regulatory & Compliance",
    "confidence": 0.3858
  }
}
```

#### Response (Duplicate text)

```json
{
  "status": "exists",
  "result": {
    "category": "Regulatory & Compliance",
    "confidence": 0.3858
  }
}
```

---

## Model

* Transformer-based text classifier
* Fine-tuned on plastic risk taxonomy
* Outputs:

  * Risk category
  * Confidence score

Model is loaded **once at startup** for performance.

---

## Persistence

* SQLite database (`plastic_risk.db`)
* Auto-created on first run
* Table: `inherent_risk`
* Used for:

  * Deduplication
  * Historical risk storage
  * Future aggregation

Database file is **not committed**.

---

## Design Notes

* Backend owns all inference and persistence
* Frontend never controls storage
* Designed for irregular, event-driven inputs (e.g., news)
* Compatible with later migration to MySQL/Postgres