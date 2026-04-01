# route_optimization/router.py

from fastapi import APIRouter
from route_optimization.schemas import (
    CustomerOrderRequest,
    RouteOptimizationResponse
)

router = APIRouter(
    prefix="/ro",
    tags=["Route Optimization"]
)


@router.get("/health")
def health_check():
    return {
        "status": "success",
        "module": "Route Optimization",
        "message": "RO module is running"
    }

from route_optimization.service import ro_service

@router.get("/run/{order_id}")
def run_route_optimization(order_id: str):
    return ro_service.run_optimization(order_id)

# @router.post("/run/{order_id}")
# def run_route_optimization(order_id: str):
#     return ro_service.run_optimization(order_id)

@router.get("/plan/{order_id}")
def get_fulfillment_plan(order_id: str):
    return ro_service.get_fulfillment_plan(order_id)

@router.get("/kpis/{order_id}")
def get_ro_kpis(order_id: str):
    return ro_service.get_order_kpis(order_id)

@router.get("/history")
def get_ro_history():
    return ro_service.get_order_history()

@router.get("/explain/{order_id}")
def explain_ro_decision(order_id: str):
    return ro_service.explain_order_decision(order_id)

@router.get("/chart-data/{order_id}")
def get_chart_data(order_id: str):
    return ro_service.get_chart_data(order_id)

@router.get("/dashboard-summary")
def get_dashboard_summary():
    return ro_service.get_dashboard_summary()