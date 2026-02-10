# router.py

from fastapi import APIRouter, HTTPException
from .schemas import (
    InherentRiskRequest,
    InherentRiskAPIResponse,
    SupplierRiskIndex
)
from .service import process_inherent_risk
from .supplier_repository import get_supplier_index

router = APIRouter(
    prefix="/plastic/inherent-risk",
    tags=["Plastic Inherent Risk"]
)

@router.post(
    "/predict",
    response_model=InherentRiskAPIResponse
)
def predict_risk(request: InherentRiskRequest):
    return process_inherent_risk(
        text=request.text,
        supplier_id=request.supplier_id
    )

@router.get(
    "/supplier/{supplier_id}/risk-index",
    response_model=SupplierRiskIndex
)
def get_supplier_risk_index(supplier_id: str):
    result = get_supplier_index(supplier_id)
    if not result:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return result
