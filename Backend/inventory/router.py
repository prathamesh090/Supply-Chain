# inventory/router.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from inventory.database_service import inventory_db
from inventory.services import calculate_inventory_status

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory Management"]
)


# ── Pydantic Models ───────────────────────────────────────────────────

class AddInventoryRequest(BaseModel):
    product_id:    str
    warehouse_id:  int
    current_stock: int
    lead_time:     int
    supplier_name: Optional[str] = ""


class UpdateInventoryRequest(BaseModel):
    product_id:   str
    warehouse_id: int
    quantity:     int


# ── Helper: Fetch global forecast from predictions table ─────────────

def fetch_forecast_map() -> dict:
    """
    Fetches AVG predicted_demand per product from latest session.
    Returns: { "PROD001": 924.0, "PROD002": 285.5, ... }
    """
    conn = inventory_db.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                product_id,
                AVG(predicted_demand) AS forecasted_demand
            FROM predictions
            WHERE session_id = (
                SELECT session_id
                FROM analysis_sessions
                ORDER BY created_at DESC
                LIMIT 1
            )
            GROUP BY product_id
        """)
        rows = cursor.fetchall()
        return {
            row["product_id"]: float(row["forecasted_demand"])
            for row in rows
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching forecast data: {str(e)}"
        )
    finally:
        cursor.close()
        conn.close()


# ── API 0: List All Warehouses ────────────────────────────────────────

@router.get("/warehouses")
def get_all_warehouses():
    """
    Returns all warehouses with location, capacity and demand weight.
    Used by:
      - Frontend to build warehouse dropdown
      - Route Optimization module for lat/long
    """
    warehouses = inventory_db.get_all_warehouses()
    if not warehouses:
        raise HTTPException(status_code=404, detail="No warehouses found")
    return warehouses


# ── API 1: Add Inventory ──────────────────────────────────────────────

@router.post("/")
def add_inventory(data: AddInventoryRequest):
    """
    Add or update a product's inventory in a warehouse.
    current_stock and lead_time simulate ERP/supplier system input.
    ON DUPLICATE KEY UPDATE — safe to call multiple times.
    """
    success = inventory_db.save_inventory(
        product_id=data.product_id,
        warehouse_id=data.warehouse_id,
        current_stock=data.current_stock,
        lead_time=data.lead_time,
        supplier_name=data.supplier_name
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to save inventory"
        )

    return {
        "message":       "Inventory added/updated successfully",
        "product_id":    data.product_id,
        "warehouse_id":  data.warehouse_id,
        "current_stock": data.current_stock,
        "lead_time":     data.lead_time,
        "supplier_name": data.supplier_name
    }

# ── Bulk Add Models ───────────────────────────────────────────────────

class BulkProductItem(BaseModel):
    product_id:    str
    current_stock: int
    lead_time:     int
    supplier_name: Optional[str] = ""

class BulkAddInventoryRequest(BaseModel):
    warehouse_id: int
    products:     list[BulkProductItem]

# ── API: Bulk Add Inventory ───────────────────────────────────────────

@router.post("/bulk")
def bulk_add_inventory(data: BulkAddInventoryRequest):
    """Add multiple products to a warehouse in one single call."""
    success_list = []
    failed_list  = []

    for product in data.products:
        success = inventory_db.save_inventory(
            product_id=product.product_id,
            warehouse_id=data.warehouse_id,
            current_stock=product.current_stock,
            lead_time=product.lead_time,
            supplier_name=product.supplier_name
        )
        if success:
            success_list.append(product.product_id)
        else:
            failed_list.append(product.product_id)

    return {
        "message":      f"{len(success_list)} products added successfully",
        "warehouse_id": data.warehouse_id,
        "success":      success_list,
        "failed":       failed_list
    }


# ── API 2: Inventory Dashboard ────────────────────────────────────────

@router.get("/{warehouse_id}")
def get_inventory_dashboard(warehouse_id: int):
    """
    Full inventory dashboard for one warehouse.

    Flow:
    1. Fetch warehouse info (demand_weight, capacity)
    2. Fetch all products for this warehouse
    3. Fetch global AVG forecast from predictions table
    4. For each product:
       - Split demand by warehouse weight
       - Get supplier risk from SRA
       - Calculate safety_stock, ROP, status
    5. Calculate capacity utilization
    6. Return summary cards + product table
    """

    # Step 1 — warehouse info
    warehouse = inventory_db.get_warehouse(warehouse_id)
    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail=f"Warehouse {warehouse_id} not found"
        )

    demand_weight  = float(warehouse["demand_weight"])
    total_capacity = int(warehouse["total_capacity"])

    # Step 2 — products in this warehouse
    inventory_rows = inventory_db.get_inventory_by_warehouse(warehouse_id)

    if not inventory_rows:
        return {
            "warehouse_id":       warehouse_id,
            "warehouse_name":     warehouse["name"],
            "city":               warehouse["city"],
            "demand_weight":      f"{int(demand_weight * 100)}%",
            "total_capacity":     total_capacity,
            "current_utilization": 0,
            "utilization_pct":    "0%",
            "total_products":     0,
            "summary": {
                "Healthy":       0,
                "Reorder Soon":  0,
                "Stockout Risk": 0
            },
            "products": []
        }

    # Step 3 — global forecast from predictions table
    forecast_map = fetch_forecast_map()
    if not forecast_map:
        raise HTTPException(
            status_code=404,
            detail="No forecast data found. Please run Demand Forecasting first."
        )


    # Step 4 — calculate per product
    products         = []
    summary          = {"Healthy": 0, "Reorder Soon": 0, "Stockout Risk": 0}
    total_stock_used = 0

    for item in inventory_rows:
        product_id    = item["product_id"]
        current_stock = item["current_stock"]
        lead_time     = item["lead_time"]
        supplier_name = item.get("supplier_name") or ""

        global_demand = forecast_map.get(product_id, 0)

        calc = calculate_inventory_status(
            current_stock=current_stock,
            global_forecasted_demand=global_demand,
            lead_time=lead_time,
            demand_weight=demand_weight,
            supplier_name=supplier_name
        )

        summary[calc["status"]] += 1
        total_stock_used += current_stock

        products.append({
            "product_id":               product_id,
            "current_stock":            current_stock,
            "global_forecasted_demand": calc["global_forecasted_demand"],
            "warehouse_demand":         calc["warehouse_demand"],
            "supplier_name":            supplier_name,
            "supplier_risk":            calc["supplier_risk_level"],
            "risk_multiplier":          calc["risk_multiplier"],
            "daily_demand":             calc["daily_demand"],
            "safety_stock":             calc["safety_stock"],
            "ROP":                      calc["ROP"],
            "status":                   calc["status"],
            "suggested_action":         calc["suggested_action"]
        })

    # Step 5 — capacity utilization
    utilization_pct = round((total_stock_used / total_capacity) * 100, 1) \
                      if total_capacity > 0 else 0

    # Step 6 — full dashboard response
    return {
        "warehouse_id":        warehouse_id,
        "warehouse_name":      warehouse["name"],
        "city":                warehouse["city"],
        "demand_weight":       f"{int(demand_weight * 100)}%",
        "total_capacity":      total_capacity,
        "current_utilization": total_stock_used,
        "utilization_pct":     f"{utilization_pct}%",
        "total_products":      len(products),
        "summary":             summary,
        "products":            products
    }


# ── API 3: Check Availability ─────────────────────────────────────────

@router.get("/check/{product_id}/{warehouse_id}/{qty}")
def check_availability(product_id: str, warehouse_id: int, qty: int):
    """
    Check if enough stock exists for a given quantity.
    Called by Order Processing teammate.
    """
    conn = inventory_db.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT current_stock FROM inventory_master
            WHERE product_id = %s AND warehouse_id = %s
        """, (product_id, warehouse_id))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail=f"Product '{product_id}' not found in warehouse {warehouse_id}"
            )

        current_stock = row["current_stock"]
        return {
            "product_id":    product_id,
            "warehouse_id":  warehouse_id,
            "requested_qty": qty,
            "current_stock": current_stock,
            "available":     current_stock >= qty
        }
    finally:
        cursor.close()
        conn.close()


# ── API 4: Update Inventory (reduce stock) ────────────────────────────

@router.post("/update")
def update_inventory(data: UpdateInventoryRequest):
    """
    Reduce stock after order is dispatched.
    Called by Order Processing teammate.
    """
    result = inventory_db.update_stock(
        product_id=data.product_id,
        warehouse_id=data.warehouse_id,
        quantity=data.quantity
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )

    return {
        "message":      "Stock updated successfully",
        "product_id":   data.product_id,
        "warehouse_id": data.warehouse_id,
        "reduced_by":   data.quantity,
        "new_stock":    result["new_stock"]
    }