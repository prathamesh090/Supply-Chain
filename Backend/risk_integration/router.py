from fastapi import APIRouter, HTTPException
from .integrated_engine import compute_integrated_risk
from .schemas import IntegratedRiskResponse

router = APIRouter(
    prefix="/api/integrated-risk",
    tags=["Integrated Risk"]
)

@router.get(
    "/{supplier_id}",
    response_model=IntegratedRiskResponse
)
def get_integrated_risk(supplier_id: str):

    result = compute_integrated_risk(supplier_id)

    if result["status"] != "ok":
        raise HTTPException(
            status_code=404,
            detail=result.get("message", f"Supplier '{supplier_id}' not found")
        )

    return result
