<div align="center">

# 🔗 AI-Driven Supply Chain Management Platform

### *End-to-End Planning Intelligence — From Source to Deliver*

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML_Engine-FF6600?style=for-the-badge)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/SHAP-Explainable_AI-FF4B4B?style=for-the-badge)](https://shap.readthedocs.io/)

> **A production-grade, AI-augmented supply chain planning platform** that synchronizes demand forecasting, supplier risk assessment, inventory planning, and distribution optimization into a single unified decision-support pipeline — designed for plastic manufacturers, architected for any industry.

</div>

---

## 📌 What Makes This Different

Most supply chain tools address **one problem** in isolation. This platform connects **four interdependent planning stages** so that the output of each module becomes the input of the next:

```
┌─────────────────────┐
│  Demand Forecasting │  ← XGBoost · 92 features · SHAP explainability
└────────┬────────────┘
         │ demand signals per product/region
         ▼
┌─────────────────────┐
│  Supplier Risk SRA  │  ← Weighted composite risk scoring model
└────────┬────────────┘
         │ risk-adjusted supplier ratings
         ▼
┌─────────────────────┐
│  Inventory Planning │  ← Dynamic safety stock · Risk-aware ROP
└────────┬────────────┘
         │ warehouse inventory levels + constraints
         ▼
┌─────────────────────┐
│ Distribution Plan   │  ← Cost-risk optimized allocation per region
└─────────────────────┘
```

**This is not four dashboards. It is one synchronized planning pipeline.**

---

## 🚀 Core Features

### 📊 Feature 1 — AI-Powered Demand Forecasting

| Detail | Value |
|---|---|
| Model | XGBoost (Gradient Boosted Trees) |
| Engineered Features | 92 (lag variables, rolling stats, seasonality, price effects) |
| Prediction Accuracy | **98.57%** |
| Explainability | SHAP (per-prediction feature attribution) |
| Batch Capacity | Up to 1,000 products |
| Output | Demand forecast + visual explanation per driver |

```python
# SHAP-powered explainability example
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)
# → "This forecast is 40% driven by price drop, 35% by seasonal trend"
```

Traditional forecasting treats demand as a black box. This system tells planners **exactly why** each forecast was generated — enabling confident, defensible planning decisions.

---

### ⚠️ Feature 2 — Supplier Risk Assessment (SRA)

Suppliers are evaluated across **5 weighted risk dimensions**:

```
Risk Score = 0.30 × Delivery Risk
           + 0.25 × Defect Risk
           + 0.20 × Compliance Risk
           + 0.15 × Price Volatility Risk
           + 0.10 × Trust Risk
```

| Risk Level | Score Range | Action |
|---|---|---|
| 🟢 Low | < 0.35 | Standard procurement |
| 🟡 Medium | 0.35 – 0.65 | Enhanced monitoring |
| 🔴 High | > 0.65 | Contingency sourcing |

**Business Value:** Identifies unreliable suppliers *before* disruption occurs — not after delivery failures.

---

### 📦 Feature 3 — Risk-Aware Inventory Planning

Integrates demand forecasts **and** supplier risk to compute dynamic safety stock:

```
ROP = (Average Daily Demand × Lead Time) + Safety Stock

Safety Stock = Z × σ_demand × √Lead Time × Risk Multiplier
```

| Supplier Risk | Safety Stock Multiplier |
|---|---|
| 🟢 Low | 1.0× (baseline) |
| 🟡 Medium | 1.3× (+30% buffer) |
| 🔴 High | 1.6× (+60% buffer) |

**Result:** Inventory decisions that reflect real supply uncertainty — not static assumptions.

---

### 🚚 Feature 4 — Distribution Optimization

For each product × region pair, the algorithm:

1. Filters warehouses with sufficient inventory above safety stock
2. Calculates base transportation cost by distance
3. Applies risk penalty for high-risk supply sources
4. Selects warehouse with **minimum total cost (transport + risk)**
5. Allocates demand and updates warehouse inventory

**Output:** A complete distribution allocation plan — optimized for cost and risk simultaneously.

---

## 🏗 System Architecture

```
Frontend (React + TypeScript + Tailwind)
    │
    ├── Manufacturer Portal
    │     ├── Demand Forecasting Dashboard (Recharts + SHAP charts)
    │     ├── Supplier Risk Monitor (Leaflet maps + risk heatmaps)
    │     ├── Inventory Management (dynamic ROP table)
    │     └── Distribution Plan View
    │
    └── Supplier Portal
          ├── Profile & Compliance Setup
          ├── Risk Score Dashboard
          └── Order & Delivery Tracking

Backend (Python FastAPI)
    │
    ├── /ml-demand      → XGBoost forecasting engine
    ├── /supplier-risk  → Risk scoring service
    ├── /inventory      → ROP / safety stock calculator
    ├── /route-optimize → Distribution allocation engine
    ├── /auth           → JWT authentication (dual-role)
    └── /ad-generator   → AI-powered marketing content

Database: MySQL + SQLite
ML: XGBoost · Scikit-learn · SHAP · Pandas · NumPy
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite · TailwindCSS · Recharts · Leaflet |
| **Backend** | Python · FastAPI · Flask |
| **Machine Learning** | XGBoost · Scikit-learn · SHAP |
| **Database** | MySQL · SQLite |
| **Data Processing** | Pandas · NumPy |
| **Auth** | JWT · bcrypt |
| **AI Features** | Groq API (chatbot) · Freepik Mystic (ad generation) |
| **Maps** | Leaflet.js · React-Leaflet |

---

## 💼 Business Impact

| Problem | Solution | Impact |
|---|---|---|
| Demand uncertainty | ML forecast with 98.57% accuracy | Reduced over/understocking |
| Supplier disruptions | Proactive risk scoring | Early warning before failures |
| Static safety stock | Risk-multiplied dynamic stock | Better working capital use |
| Manual distribution | Automated cost-risk allocation | Lower logistics cost |
| Opaque AI decisions | SHAP explainability | Planner-defensible recommendations |

---

## 🏭 Industry Focus & Expansion Path

**Currently demonstrated for:** Plastic Manufacturing (PET, HDPE, LDPE, LLDPE, PP, PVC)

**Modular expansion ready for:**
- 🧪 Chemicals & Specialty Materials
- 🍫 Food & Beverages (FMCG)
- 💊 Pharmaceuticals
- 📦 Paper & Packaging
- 🛒 Consumer Goods

---

## 🔮 Roadmap

- [ ] **Scenario Simulation** — "What-if" analysis for demand shocks and supplier failures
- [ ] **Rolling Horizon Planning** — 12–36 month forecasting with confidence intervals
- [ ] **ERP Integration Layer** — SAP / Oracle live data connectors
- [ ] **Constraint-Based Optimization** — Linear programming for network-wide optimization
- [ ] **Collaborative Planning Workflows** — Multi-user sign-off and approval chains
- [ ] **Real-Time Supplier Monitoring** — Live risk feed integration

---

## 🚦 Getting Started

### Prerequisites

```bash
Node.js >= 18 · Python >= 3.11 · MySQL
```

### Frontend Setup

```bash
cd Supply-Chain
npm install
npm run dev
# → Runs on http://localhost:8080
```

### Backend Setup

```bash
cd Backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → API at http://localhost:8000
# → Docs at http://localhost:8000/docs
```

### Environment Variables

```env
# Backend/.env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=supply_chain_db
SECRET_KEY=your_secret_key
GROQ_API_KEY=your_groq_key
```

---

## 📁 Project Structure

```
Supply-Chain/
├── src/
│   ├── pages/
│   │   ├── DemandForcast.tsx          # Forecasting dashboard
│   │   ├── SupplierRisk.tsx           # Supplier risk monitor
│   │   ├── InventoryManagement.tsx    # Inventory planning
│   │   ├── SupplierDashboard.tsx      # Supplier portal
│   │   └── AdGenerator.tsx            # AI ad generator
│   └── components/                    # Reusable UI components
│
└── Backend/
    ├── main.py                        # FastAPI main application
    ├── ml demand(Plastic)/            # XGBoost forecasting engine
    ├── ml_supplier_risk/              # Risk scoring model
    ├── inventory/                     # Inventory planning logic
    ├── route_optimization/            # Distribution optimizer
    ├── supplier_registry/             # Supplier management
    └── risk_integration/              # Risk data aggregation
```

---

<div align="center">

**Built with a deep conviction that supply chain planning should be unified, intelligent, and explainable.**

*From source to deliver — synchronized.*

</div>
