from fastapi import APIRouter
from .global_risk_engine import compute_global_risk
from .schemas import GlobalRiskResponse

router = APIRouter(
    prefix="/api/global-risk",
    tags=["Global Risk"]
)


@router.get(
    "/",
    response_model=GlobalRiskResponse
)
def get_global_risk():

    return compute_global_risk()