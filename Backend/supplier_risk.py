from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
import os
from typing import List, Dict, Any, Optional
import pandas as pd
from Supplier_Portal_Dashboard.database import SupplierPortalDB

# Add the ml-supplier-risk directory to Python path
current_dir = os.path.dirname(__file__)
ml_supplier_path = os.path.join(current_dir, "ml-supplier-risk")
sys.path.insert(0, ml_supplier_path)

# Try to import supplier risk predictor
try:
    from ml_supplier_risk.supplier_risk_predictor import SupplierRiskPredictor
    PREDICTOR_AVAILABLE = True
    predictor = SupplierRiskPredictor()
except ImportError as e:
    print(f"Warning: Could not import SupplierRiskPredictor: {e}")
    PREDICTOR_AVAILABLE = False
    predictor = None

router = APIRouter(prefix="/api/supplier-risk", tags=["Supplier Risk"])

# Pydantic models for request validation
class SupplierRiskData(BaseModel):
    supplier_name: str
    delivery_delay_days: Optional[float] = 0
    defect_rate_pct: Optional[float] = 0
    price_variance_pct: Optional[float] = 0
    compliance_flag: Optional[int] = 0
    trust_score: Optional[float] = 50
    Plastic_Type: Optional[str] = "Unknown"
    defective_units: Optional[int] = 0
    quantity: Optional[int] = 1
    unit_price: Optional[float] = 0
    negotiated_price: Optional[float] = 0
    compliance: Optional[str] = "No"
    order_date: Optional[str] = None
    delivery_date: Optional[str] = None

class BatchPredictionRequest(BaseModel):
    suppliers: List[SupplierRiskData]

@router.get("/health")
async def health_check():
    """Check if supplier risk predictor is available"""
    return {
        "status": "healthy" if PREDICTOR_AVAILABLE else "partial",
        "predictor_available": PREDICTOR_AVAILABLE,
        "message": "Supplier risk service is running"
    }

@router.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    if not PREDICTOR_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Supplier risk predictor is not available"
        )
    
    try:
        info = predictor.get_model_info()
        return {
            "success": True,
            "info": info
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get model info: {str(e)}"
        )

@router.post("/predict")
async def predict_supplier_risk(supplier_data: SupplierRiskData):
    """Predict risk for a single supplier"""
    if not PREDICTOR_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Supplier risk predictor is not available"
        )
    
    try:
        # Convert to dict
        data_dict = supplier_data.dict()
        
        # Make prediction
        result = predictor.predict_single_supplier(data_dict)
        
        return {
            "success": True,
            "supplier_name": supplier_data.supplier_name,
            "predicted_risk": result["predicted_risk"],
            "risk_score": result["risk_score"],
            "risk_score_ui": result["risk_score_ui"],
            "probabilities": result["probabilities"],
            "risk_summary": result["risk_summary"],
            "analysis_date": pd.Timestamp.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/predict/batch")
async def predict_batch_supplier_risk(request: BatchPredictionRequest):
    """Predict risk scores for multiple suppliers"""
    if not PREDICTOR_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Supplier risk predictor is not available"
        )
    
    results = []
    for supplier in request.suppliers:
        try:
            data_dict = supplier.dict()
            result = predictor.predict_single_supplier(data_dict)
            results.append({
                "supplier_name": supplier.supplier_name,
                "predicted_risk": result["predicted_risk"],
                "risk_score": result["risk_score"],
                "risk_score_ui": result["risk_score_ui"],
                "probabilities": result["probabilities"],
                "risk_summary": result["risk_summary"]
            })
        except Exception as e:
            results.append({
                "supplier_name": supplier.supplier_name,
                "error": str(e),
                "risk_score": None,
                "predicted_risk": "ERROR"
            })
    
    return {
        "success": True,
        "total_suppliers": len(request.suppliers),
        "successful_predictions": len([r for r in results if r.get("error") is None]),
        "predictions": results
    }

@router.get("/all-suppliers")
async def get_all_suppliers_risk():
    """Get risk predictions for all suppliers in the dataset"""
    if not PREDICTOR_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Supplier risk predictor is not available"
        )
    
    try:
        predictions = predictor.predict_all_suppliers()
        return {
            "success": True,
            "total_suppliers": len(predictions),
            "predictions": predictions
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get supplier predictions: {str(e)}"
        )

@router.get("/rankings")
async def get_supplier_rankings():
    """Get all suppliers ranked by risk score"""
    if not PREDICTOR_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Supplier risk predictor is not available"
        )

    try:
        rankings = predictor.get_supplier_rankings()
        known_names = {str(item.get("supplier_name", "")).strip().lower() for item in rankings}

        # Ensure connected suppliers from DB are represented in risk list.
        db_suppliers = SupplierPortalDB.list_suppliers(manufacturer_id=0, active_only=False)
        for supplier in db_suppliers:
            supplier_name = (supplier.get("company_legal_name") or "").strip()
            if not supplier_name or supplier_name.lower() in known_names:
                continue

            predicted = predictor.predict_single_supplier({"supplier_name": supplier_name})
            rankings.append({
                "supplier_name": supplier_name,
                "predicted_risk": predicted["predicted_risk"],
                "risk_score": predicted["risk_score"],
                "risk_score_ui": predicted["risk_score_ui"],
                "risk_level": predicted["predicted_risk"],
                "probabilities": predicted["probabilities"],
                "avg_delivery_delay_days": 0,
                "avg_defect_rate_percent": 0,
                "avg_price_variance_percent": 0,
                "compliance_rate": 0,
                "trust_score": 50,
                "plastic_types": [],
                "risk_summary": f"{supplier_name} risk profile generated from onboarding defaults.",
            })

        rankings.sort(key=lambda x: float(x.get("risk_score", 0)), reverse=True)
        for idx, supplier in enumerate(rankings, start=1):
            supplier["risk_rank"] = idx
            supplier["total_suppliers"] = len(rankings)

        return {
            "success": True,
            "rankings": rankings
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get rankings: {str(e)}"
        )

@router.get("/distribution")
async def get_risk_distribution():
    """Get risk distribution statistics"""
    if not PREDICTOR_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Supplier risk predictor is not available"
        )
    
    try:
        distribution = predictor.get_risk_distribution()
        return {
            "success": True,
            "distribution": distribution
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get distribution: {str(e)}"
        )

@router.get("/features")
async def get_feature_requirements():
    """Get the required features for prediction"""
    features = [
        {"name": "supplier_name", "type": "string", "required": True, "description": "Supplier name or identifier"},
        {"name": "delivery_delay_days", "type": "float", "required": False, "default": 0, "description": "Average delivery delay in days"},
        {"name": "defect_rate_pct", "type": "float", "required": False, "default": 0, "description": "Defect rate percentage"},
        {"name": "price_variance_pct", "type": "float", "required": False, "default": 0, "description": "Price variance percentage"},
        {"name": "compliance_flag", "type": "int", "required": False, "default": 0, "description": "Compliance flag (0 or 1)"},
        {"name": "trust_score", "type": "float", "required": False, "default": 50, "description": "Trust score (0-100)"},
        {"name": "Plastic_Type", "type": "string", "required": False, "default": "Unknown", "description": "Type of plastic supplied"},
        {"name": "defective_units", "type": "int", "required": False, "default": 0, "description": "Number of defective units"},
        {"name": "quantity", "type": "int", "required": False, "default": 1, "description": "Total quantity supplied"},
        {"name": "unit_price", "type": "float", "required": False, "default": 0, "description": "Unit price"},
        {"name": "negotiated_price", "type": "float", "required": False, "default": 0, "description": "Negotiated price"},
        {"name": "compliance", "type": "string", "required": False, "default": "No", "description": "Compliance status (Yes/No)"}
    ]
    
    return {
        "features": features,
        "note": "Only 'supplier_name' is required. Other fields will use defaults if not provided."
    }