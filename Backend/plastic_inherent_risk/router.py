from fastapi import APIRouter
from .schemas import InherentRiskRequest, InherentRiskAPIResponse
from .service import process_inherent_risk

router = APIRouter(
    prefix="/plastic/inherent-risk",
    tags=["Plastic Inherent Risk"]
)

@router.post(
    "/predict",
    response_model=InherentRiskAPIResponse
)
def predict_risk(request: InherentRiskRequest):
    return process_inherent_risk(request.text)
