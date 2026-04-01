# route_optimization/schemas.py

from pydantic import BaseModel
from typing import List


class OrderItem(BaseModel):
    product_id: str
    quantity: int


class CustomerOrderRequest(BaseModel):
    order_id: str
    customer_region: str
    customer_lat: float
    customer_lon: float
    items: List[OrderItem]


class AllocationResponse(BaseModel):
    warehouse_id: str
    allocated_quantity: int
    distance_km: float
    transport_cost: float
    decision_reason: str


class RouteOptimizationResponse(BaseModel):
    order_id: str
    status: str
    allocations: List[AllocationResponse]