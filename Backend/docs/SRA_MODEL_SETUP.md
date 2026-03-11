# SRA Model Setup (DistilBERT Risk Classifier)

## 1. Overview

The **Inherent Risk Engine** uses a transformer-based Natural Language Processing (NLP) model to detect operational disruptions affecting suppliers.

The system processes **unstructured incident text** such as:

* news reports
* industrial incident descriptions
* regulatory announcements
* operational disruption reports

and converts them into **structured supply chain risk signals**.

These signals are used by the **Supplier Risk Assessment (SRA)** system to update supplier risk scores.

---

# 2. Model Architecture

The risk classification model is based on:

```
DistilBERT
```

DistilBERT is a lightweight transformer architecture derived from BERT that maintains strong NLP performance while reducing computational cost.

Advantages of using DistilBERT for this system:

* faster inference compared to full BERT
* lower memory usage
* efficient processing of real-time event streams
* strong contextual understanding of incident descriptions

The model is **fine-tuned for supply chain risk classification**.

---

# 3. Model Objective

The model performs **text classification** to detect risk events affecting plastic suppliers.

Input:

```
Unstructured incident text
```

Output:

```
risk_category
risk_level
risk_score
confidence
```

Example:

Input text:

```
Explosion at BASF polymer production facility
```

Model prediction:

```
risk_category: Safety & Chemical
risk_level: High
risk_score: 76
confidence: 0.91
```

These predictions are used by the **Inherent Risk Engine** to update supplier risk scores.

---

# 4. Risk Categories

The model predicts predefined supply chain risk categories.

Example categories:

```
Safety & Chemical
Operational
Environmental
Regulatory
Logistics
```

Each category represents a specific type of disruption that may impact supplier reliability.

These categories are later mapped to **risk scores and severity levels** used in the SRA system.

---

# 5. Event Processing Pipeline

Operational events are processed through the following pipeline:

```
Event Text
      ↓
Supplier Detection (NER / Matching)
      ↓
DistilBERT Risk Classification
      ↓
Risk Category Prediction
      ↓
Risk Scoring
      ↓
Risk Normalization
      ↓
Risk Event Storage
      ↓
Supplier Risk Index Update
```

This pipeline enables automated conversion of real-world incidents into structured risk intelligence.

---

# 6. Model Storage

Large machine learning models are **not stored directly in the repository** to keep the project lightweight.

Instead, the trained model is hosted in **GitHub Releases**.

Download the model from:

```
https://github.com/PranaliChitre/Major_project/releases/tag/v1.0-sra-model
```

The release contains the following files:

```
model.safetensors
tokenizer.json
tokenizer_config.json
config.json
label_map.json
```

---

# 7. Model Installation

After downloading the files, place them in the following directory:

```
Backend/plastic_inherent_risk/model/
```

Expected folder structure:

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

When the backend server starts, the model will be automatically loaded from this directory.

---

# 8. Model Loading

During backend startup, the model is loaded by the Inherent Risk Engine.

Successful initialization produces a log message similar to:

```
Model and encoder loaded successfully
```

This indicates that the DistilBERT classifier is ready for inference.

---

# 9. API Usage

The model is exposed through the Inherent Risk API.

Endpoint:

```
POST /plastic/inherent-risk/predict
```

Example request:

```json
{
  "text": "Explosion at BASF polymer manufacturing facility"
}
```

Example response:

```json
{
  "risk_category": "Safety & Chemical",
  "risk_level": "High",
  "risk_score": 76.2,
  "confidence": 0.91
}
```

---

# 10. Integration with the SRA System

The DistilBERT classifier is part of the **Inherent Risk Engine** within the Supplier Risk Assessment architecture.

Integration flow:

```
DistilBERT Risk Classifier
        ↓
Risk Event Detection
        ↓
Risk Event Database Storage
        ↓
Supplier Risk Index Update
        ↓
Integrated Risk Engine
        ↓
Unified Risk Feed API
```

This architecture enables continuous monitoring of supplier disruptions.

---

# 11. Model Versioning

Model versions are managed through **GitHub Releases**.

Example release:

```
v1.0-sra-model
```

Future versions may include:

* additional training data
* improved entity recognition
* expanded risk categories
* multilingual event detection
* improved classification accuracy

