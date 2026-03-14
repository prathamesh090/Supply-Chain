# 🚀 AI-Driven Supply Chain Management & Logistics Planning System

An **AI-powered supply chain planning platform** that helps manufacturers optimize demand forecasting, supplier risk monitoring, inventory planning, and distribution allocation.

The system acts as a **planning-level supply chain decision-support engine**, enabling companies to make data-driven supply chain decisions before execution begins.

The platform is currently demonstrated for the **plastic manufacturing industry**, with a modular architecture that supports future expansion to industries such as:

- Food & Beverages  
- Chemicals  
- Paper & Packaging  
- Consumer Goods  

---

# 📌 Project Vision

Modern supply chains are highly complex and vulnerable to disruptions such as:

- demand uncertainty  
- supplier failures  
- inventory imbalance  
- inefficient distribution planning  

Traditional systems rely heavily on manual planning and fragmented tools.

This project introduces an **AI-assisted supply chain planning platform** that integrates forecasting, risk intelligence, inventory planning, and distribution optimization into a single decision-support system.

---

# 🏗 System Architecture
Demand Forecasting
        ↓
Supplier Risk Assessment
        ↓
Inventory Management
        ↓
Route Optimization
        ↓
Distribution Planning Output


Each module contributes critical insights to the next stage, forming a **complete supply chain planning pipeline**.

---

# 📊 Feature 1 — AI-Powered Demand Forecasting

## Problem

Manufacturers struggle with demand uncertainty which leads to:

- Overstocking (high inventory holding costs)
- Stockouts causing lost revenue
- Poor production planning

Traditional forecasting techniques fail to capture complex patterns like:

- seasonality
- pricing effects
- promotions
- market fluctuations

---

## Solution

The system uses an **XGBoost machine learning model** trained on historical sales data with advanced feature engineering.

It analyzes multiple demand drivers and produces accurate demand predictions along with explainable insights.

---

## Technology Stack

- Python  
- XGBoost  
- Flask REST API  
- SHAP Explainability  
- MySQL  
- Pandas  
- NumPy  

---

## Key Features

- 98.57% prediction accuracy  
- 92 engineered demand features  
- Batch prediction for up to 1000 products  
- SHAP-based model explainability  
- REST API integration  
- Prediction storage in database

---

## Business Impact

- Reduced forecasting errors  
- Improved production planning  
- Better procurement decisions  
- Early identification of demand spikes  

---

# ⚠️ Feature 2 — Supplier Risk Assessment (SRA)

## Problem

Supply chains are exposed to supplier disruptions including:

- delivery delays  
- quality defects  
- regulatory violations  
- operational instability  

Traditional supplier evaluation relies only on historical performance and often fails to detect emerging risks early.

---

## Solution

The Supplier Risk Assessment system evaluates suppliers using operational performance metrics and a machine learning–assisted risk scoring model.

The system analyzes supplier data including:

- delivery performance  
- defect rates  
- compliance records  
- pricing variance  
- trust scores  

These metrics are combined into a unified supplier risk score.
--
## Risk Scoring Model
Risk Score =
0.30 × Delivery Risk
0.25 × Defect Risk
0.20 × Compliance Risk
0.15 × Price Risk
0.10 × Trust Risk

---

## Risk Categories
- Low Risk  
- Medium Risk  
- High Risk  
---
## Technology

- Python  
- XGBoost  
- FastAPI / Flask  
- SQLite / MySQL  
---
## Business Value

- Early identification of unreliable suppliers  
- Data-driven supplier evaluation  
- Risk-aware supply chain planning  
- Improved procurement strategies  

---

# 📦 Feature 3 — Inventory Management (Risk-Aware Inventory Planning)

## Problem

Manufacturers must balance two critical risks:

- Overstocking → higher storage costs  
- Stockouts → production disruption and lost sales  

Traditional inventory systems rarely integrate demand forecasts and supplier risk simultaneously.
---
## Solution
The system integrates **demand forecasts and supplier risk scores** to calculate dynamic safety stock and reorder points.
The inventory planning model follows a research-aligned approach.

Reorder Point (ROP) =
Demand During Lead Time + Safety Stock


Safety stock is adjusted using supplier risk levels to represent uncertainty.

---

## Risk-Based Safety Stock Adjustment

| Risk Level | Multiplier |
|-------------|-------------|
| Low | 1.0 |
| Medium | 1.3 |
| High | 1.6 |

---

## Inventory Status Classification

The system categorizes inventory into:

- Healthy Inventory  
- Reorder Soon  
- Stockout Risk  

---

## Example Dashboard Table

| Product | Current Stock | Safety Stock | ROP | Status |
|--------|---------------|--------------|-----|-------|
| P101 | 120 | 60 | 150 | Reorder Soon |
| P102 | 400 | 80 | 200 | Healthy |
| P103 | 40 | 50 | 120 | Stockout Risk |

---

## Business Value

- Reduced stockout incidents  
- Smarter replenishment planning  
- Risk-aware inventory decisions  
- Better working capital management  

---

# 🚚 Feature 4 — Route Planning & Distribution Optimization

## Problem

Manufacturers must decide:

**Which warehouse should supply which customer region at minimum cost while respecting inventory and risk constraints.**

Manual planning often results in:

- inefficient transportation costs  
- longer delivery distances  
- high reliance on risky supply sources  

---

## Solution

The system implements a **planning-level distribution allocation algorithm** inspired by supply chain routing research.

The algorithm determines:

- best warehouse for each region  
- optimal product allocation  
- cost vs risk trade-offs  

This module generates **distribution plans**, not vehicle routes.

---

## Inputs

### From Demand Forecasting

- forecast demand per region and product  

### From Inventory Management

- warehouse inventory levels  
- safety stock constraints  

### From Supplier Risk Assessment

- warehouse risk scores  

---

## Decision Logic

For each product and region:

1. Filter warehouses with sufficient inventory  
2. Calculate transportation cost  
3. Apply risk penalty  
4. Select warehouse with lowest total cost  
5. Allocate demand and update inventory  

---

## Example Distribution Plan

| Product | Region | Warehouse | Quantity |
|--------|-------|-----------|---------|
| PET | R2 | W1 | 10,000 kg |
| HDPE | R1 | W1 | 5,000 kg |

---

## Business Impact

- Reduced logistics cost  
- Improved demand fulfillment  
- Lower supply chain risk  
- Balanced warehouse utilization  

---

# 🛠 Tech Stack

### Frontend
- React.js  
- Tailwind CSS  

### Backend
- Python  
- FastAPI / Flask  

### Machine Learning
- XGBoost  
- Scikit-learn  
- SHAP  

### Database
- MySQL  
- SQLite  

### Data Processing
- Pandas  
- NumPy  

---

# 🔮 Future Enhancements

- Multi-period supply chain planning  
- Scenario simulation for demand changes  
- Real-time supplier monitoring  
- ERP / logistics system integration  
- Industry expansion beyond plastics  

AI-Driven Supply Chain Management & Logistics Planning Project


