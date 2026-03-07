# Plastic Inherent Risk Detection Engine

This module is part of the **Supplier Risk Assessment (SRA)** system.

It detects supplier risk events from unstructured text such as
news articles, incident reports, or regulatory announcements.

The system uses a **DistilBERT-based classifier** to identify
risk categories affecting plastic suppliers.

---

# Model

The trained model is hosted in the GitHub Releases section.

Download it from:

https://github.com/PranaliChitre/Major_project/releases/tag/v1.0-sra-model

Files included:

- model.safetensors
- tokenizer.json
- tokenizer_config.json
- config.json
- label_map.json

---

# Model Setup

After downloading the files, place them in:

Backend/plastic_inherent_risk/model/

Expected folder structure:

    Backend/
        plastic_inherent_risk/
            model/
                model.safetensors
                tokenizer.json
                tokenizer_config.json
                config.json
                label_map.json

The backend server will automatically load the model at startup.

---

# API Endpoint

The model is accessed through the API:

POST /plastic/inherent-risk/predict

Example request:

    {
    "text": "Explosion at BASF polymer manufacturing facility"
    }

Example response:

    {
    "risk_category": "Safety & Chemical",
    "risk_level": "High",
    "risk_score": 75.98
    }

---

# How It Fits Into SRA

The pipeline is:

    News / Event Text
            ↓
    DistilBERT Risk Classifier
            ↓
    Risk Event Storage
            ↓
    Supplier Risk Index Update
            ↓
    Integrated Risk Engine
            ↓
    Unified Risk Feed API

---

# Related Modules

```

risk_integration/  → combines financial + inherent risk
risk_global/       → global macro risk events
risk_feed/         → unified risk dashboard feed
supplier_registry/ → supplier metadata

```

---

# Notes

Large ML models are not stored directly in the Git repository.

They are hosted in **GitHub Releases** to keep the repository lightweight.
```

---