# Supplier Risk Assessment (SRA) Backend

## Overview

The Supplier Risk Assessment (SRA) backend is a supply chain intelligence system that continuously evaluates supplier reliability by integrating multiple risk signals.

The system processes structured and unstructured data sources to generate real-time supplier risk insights.

These insights are used by planning systems such as:

* Route Optimization (RO)
* Inventory Management (IM)
* Supply Chain Monitoring Dashboards

The backend exposes unified APIs that allow external systems to consume supplier risk intelligence.

---

# Core Capabilities

The system evaluates supplier risk across multiple dimensions.

### Financial Risk

Evaluates the financial stability of suppliers using a machine learning model.

Model:

```
XGBoost
```

The model predicts supplier financial risk using operational and financial indicators.

---

### Operational (Inherent) Risk

Detects operational disruptions affecting suppliers using natural language processing.

Model:

```
DistilBERT
```

The classifier processes incident descriptions such as:

```
factory fire
chemical leak
production shutdown
labor strike
```

These events are converted into structured risk signals.

---

### Global (Geopolitical) Risk

Tracks macro-level disruptions that affect supply chains.

Examples:

```
trade sanctions
regional conflicts
port strikes
```

These events influence supplier reliability based on geographic exposure.

---

# System Architecture

The SRA backend is composed of modular risk engines.

```
Supplier Registry
        ↓
Inherent Risk Engine
        ↓
Financial Risk Engine
        ↓
Integrated Risk Engine
        ↓
Unified Risk Feed API
```

Supporting modules include:

```
Global Risk Engine
Risk Event Monitoring
News Simulation Engine
```

Each component operates independently and communicates through APIs.

---

# Repository Structure

```
Backend/

docs/
    SRA_OVERVIEW.md
    SRA_ARCHITECTURE.md
    SRA_DATA_FLOW.md
    SRA_API_REFERENCE.md
    SRA_DATABASE_SCHEMA.md
    SRA_MODEL_SETUP.md
    FRONTEND_INTEGRATION.md
    RO_INTEGRATION.md
    IM_INTEGRATION.md

plastic_inherent_risk/
risk_global/
risk_feed/
risk_integration/
supplier_registry/

main.py
requirements.txt
```

The `docs` directory contains detailed documentation for the system architecture and integrations.

---

# Installation

Clone the repository.

```
git clone https://github.com/PranaliChitre/Major_project.git
```

Navigate to the backend directory.

```
cd Backend
```

Create a Python virtual environment.

```
python -m venv venv
```

Activate the environment.

Linux / macOS

```
source venv/bin/activate
```

Windows

```
venv\Scripts\activate
```

Install dependencies.

```
pip install -r requirements.txt
```

---

# Model Setup

The DistilBERT model used by the Inherent Risk Engine is hosted in GitHub Releases.

Download the model files from:

```
https://github.com/PranaliChitre/Major_project/releases/tag/v1.0-sra-model
```

Place the files in the following directory:

```
Backend/plastic_inherent_risk/model/
```

Expected structure:

```
Backend/
    plastic_inherent_risk/
        model/
            model.safetensors
            tokenizer.json
            tokenizer_config.json
            config.json
            label_map.json
```

The model will automatically load when the backend starts.

---

# Running the Backend

Start the backend server.

```
python Backend/main.py
```

If successful, the server will start at:

```
http://localhost:8000
```

API documentation will be available at:

```
http://localhost:8000/docs
```

---

# Quick API Test

After starting the backend you can verify the system using:

curl http://localhost:8000/

To test the full Supplier Risk Assessment workflow using terminal commands, see:

Backend/docs/SRA_API_REFERENCE.md

# Key API Endpoints

### Integrated Supplier Risk

```
GET /api/integrated-risk/{supplier_id}
```

Returns the combined financial and operational risk score for a supplier.

---

### Risk Event Monitoring

```
GET /api/risk-events/recent
```

Returns recent operational risk events detected by the system.

---

### Global Risk Events

```
GET /api/global-risk
```

Returns active geopolitical disruptions affecting supply chains.

---

### Unified Risk Feed

```
GET /api/risk-feed/{supplier_id}
```

Provides a consolidated risk feed for a supplier.

---

# Real-Time News Simulation

The backend includes a simulated event stream used for demonstration purposes.

The simulator generates supply chain disruption events such as:

```
factory accidents
equipment failures
logistics disruptions
```

These events are automatically processed by the Inherent Risk Engine and update supplier risk scores in real time.

---

# Documentation

Detailed architecture and integration documentation can be found in:

```
Backend/docs/
```

Key documents include:

```
SRA_OVERVIEW.md
SRA_ARCHITECTURE.md
SRA_MODEL_SETUP.md
SRA_API_REFERENCE.md
```

---

# Technology Stack

| Component            | Technology     |
| -------------------- | -------------- |
| API Framework        | FastAPI        |
| NLP Model            | DistilBERT     |
| Financial Risk Model | XGBoost        |
| Data Processing      | Pandas / NumPy |
| Event Storage        | SQLite         |
| Database             | MySQL          |
| Server               | Uvicorn        |

---

# Future Improvements

Potential future enhancements include:

* expanded risk datasets
* improved entity recognition
* multilingual event detection
* enhanced supply chain analytics

---

# License

This project is developed for academic research in supply chain risk assessment.

