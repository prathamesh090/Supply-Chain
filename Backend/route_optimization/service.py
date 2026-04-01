# route_optimization/service.py

from route_optimization.data_provider import data_provider
from route_optimization.allocation_engine import allocation_engine
from route_optimization.database_service import ro_db


class RouteOptimizationService:

    def run_optimization(self, order_id: str):
        # STEP 1 — fetch order + items
        order_data = data_provider.get_order_by_id(order_id)

        if not order_data["order"]:
            return {
                "status": "ERROR",
                "message": f"Order {order_id} not found"
            }

        order = order_data["order"]
        items = order_data["items"]

        # STEP 2 — get warehouses
        # current version: shared warehouse pool
        # later: product-aware inventory from IM
        product_id = items[0]["product_id"]
        warehouses = data_provider.get_warehouses_for_product(product_id)

        # STEP 3 — generate fulfillment plan
        result = allocation_engine.generate_fulfillment_plan(
            order=order,
            order_items=items,
            warehouses=warehouses
        )

        # STEP 4 — persist result
        self.save_fulfillment_plan(
            order_id=order_id,
            result=result
        )

        # STEP 5 — update order status
        self.update_order_status(order_id, result["status"])

        # STEP 6 — reduce IM stock
        if result["allocations"]:
            self.update_inventory_stock(result)

        return {
            "order_id": order_id,
            **result
        }

    def save_fulfillment_plan(self, order_id: str, result: dict):
        conn = ro_db.get_connection()
        cursor = conn.cursor()

        # Remove previous plan for same order
        cursor.execute("""
            DELETE FROM route_fulfillment_plan
            WHERE order_id = %s
        """, (order_id,))

        # Insert fresh latest plan
        for allocation in result["allocations"]:
            cursor.execute("""
                INSERT INTO route_fulfillment_plan (
                    order_id,
                    warehouse_id,
                    allocated_quantity,
                    distance_km,
                    transport_cost,
                    decision_reason,
                    fulfillment_status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                order_id,
                allocation["warehouse_id"],
                allocation["allocated_quantity"],
                allocation["distance_km"],
                allocation["transport_cost"],
                allocation["decision_reason"],
                result["status"]
            ))

        conn.commit()
        conn.close()

    def update_order_status(self, order_id: str, status: str):
        conn = ro_db.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE customer_orders
            SET order_status = %s
            WHERE order_id = %s
        """, (status, order_id))

        conn.commit()
        conn.close()

    def update_inventory_stock(self, result: dict):
        from inventory.database_service import inventory_db

        conn = inventory_db.get_connection()
        cursor = conn.cursor()

        for allocation in result["allocations"]:
            cursor.execute("""
                UPDATE inventory_master
                SET current_stock = current_stock - %s
                WHERE warehouse_id = %s
                AND product_id = %s
            """, (
                allocation["allocated_quantity"],
                allocation["warehouse_id"],
                allocation["product_id"]
            ))

        conn.commit()
        conn.close()

    def get_fulfillment_plan(self, order_id: str):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                order_id,
                warehouse_id,
                allocated_quantity,
                distance_km,
                transport_cost,
                decision_reason,
                fulfillment_status,
                created_at
            FROM route_fulfillment_plan
            WHERE order_id = %s
            ORDER BY created_at DESC, warehouse_id ASC
        """, (order_id,))

        allocations = cursor.fetchall()
        conn.close()

        if not allocations:
            return {
                "status": "ERROR",
                "message": f"No fulfillment plan found for {order_id}"
            }

        return {
            "order_id": order_id,
            "status": allocations[0]["fulfillment_status"],
            "allocations": allocations
        }
    
    def get_order_kpis(self, order_id: str):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)

        # total requested
        cursor.execute("""
            SELECT COALESCE(SUM(quantity), 0) AS requested_quantity
            FROM customer_order_items
            WHERE order_id = %s
        """, (order_id,))
        requested = cursor.fetchone()["requested_quantity"]

        # total allocated + metrics
        cursor.execute("""
            SELECT
                COALESCE(SUM(allocated_quantity), 0) AS allocated_quantity,
                COALESCE(SUM(transport_cost), 0) AS total_transport_cost,
                COALESCE(AVG(distance_km), 0) AS average_distance_km,
                COUNT(DISTINCT warehouse_id) AS warehouse_count_used,
                MAX(fulfillment_status) AS status
            FROM route_fulfillment_plan
            WHERE order_id = %s
        """, (order_id,))
        plan = cursor.fetchone()

        conn.close()

        allocated = plan["allocated_quantity"]
        shortage = max(0, requested - allocated)

        fulfillment_rate = (
            round((allocated / requested) * 100, 2)
            if requested > 0 else 0
        )

        return {
            "order_id": order_id,
            "requested_quantity": requested,
            "allocated_quantity": allocated,
            "shortage": shortage,
            "fulfillment_rate": fulfillment_rate,
            "warehouse_count_used": plan["warehouse_count_used"],
            "total_transport_cost": plan["total_transport_cost"],
            "average_distance_km": round(
                plan["average_distance_km"], 2
            ),
            "status": plan["status"]
        }
    
    def get_order_history(self):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                order_id,
                fulfillment_status,
                SUM(allocated_quantity) AS total_allocated,
                SUM(transport_cost) AS total_cost,
                MAX(created_at) AS latest_plan_time
            FROM route_fulfillment_plan
            GROUP BY order_id, fulfillment_status
            ORDER BY latest_plan_time DESC
        """)

        history = cursor.fetchall()
        conn.close()

        return {
            "orders": history
        }
    
    def explain_order_decision(self, order_id: str):
        plan = self.get_fulfillment_plan(order_id)

        if plan.get("status") == "ERROR":
            return plan

        explanations = []

        for allocation in plan["allocations"]:
            explanations.append({
                "warehouse_id": allocation["warehouse_id"],
                "reason": allocation["decision_reason"],
                "allocated_quantity": allocation["allocated_quantity"]
            })

        return {
            "order_id": order_id,
            "status": plan["status"],
            "explanation": explanations
        }

    def get_chart_data(self, order_id: str):
        plan = self.get_fulfillment_plan(order_id)

        if plan.get("status") == "ERROR":
            return plan

        labels = []
        allocated_quantities = []
        costs = []
        distances = []

        for allocation in plan["allocations"]:
            labels.append(f"W{allocation['warehouse_id']}")
            allocated_quantities.append(
                allocation["allocated_quantity"]
            )
            costs.append(allocation["transport_cost"])
            distances.append(allocation["distance_km"])

        return {
            "order_id": order_id,
            "labels": labels,
            "allocated_quantities": allocated_quantities,
            "transport_costs": costs,
            "distances_km": distances
        }

    def get_dashboard_summary(self):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                COUNT(DISTINCT order_id) AS total_orders,
                SUM(
                    CASE
                        WHEN fulfillment_status = 'FULLY_FULFILLED'
                        THEN 1 ELSE 0
                    END
                ) AS fully_fulfilled,
                SUM(
                    CASE
                        WHEN fulfillment_status = 'PARTIALLY_FULFILLED'
                        THEN 1 ELSE 0
                    END
                ) AS partially_fulfilled,
                SUM(
                    CASE
                        WHEN fulfillment_status = 'INFEASIBLE'
                        THEN 1 ELSE 0
                    END
                ) AS infeasible_orders
            FROM (
                SELECT
                    order_id,
                    MAX(fulfillment_status) AS fulfillment_status
                FROM route_fulfillment_plan
                GROUP BY order_id
            ) summary
        """)

        summary = cursor.fetchone()

        cursor.execute("""
            SELECT
                AVG(
                    CASE
                        WHEN requested.total_requested > 0
                        THEN (
                            allocated.total_allocated /
                            requested.total_requested
                        ) * 100
                        ELSE 0
                    END
                ) AS average_fulfillment_rate
            FROM (
                SELECT
                    order_id,
                    SUM(quantity) AS total_requested
                FROM customer_order_items
                GROUP BY order_id
            ) requested
            LEFT JOIN (
                SELECT
                    order_id,
                    SUM(allocated_quantity) AS total_allocated
                FROM route_fulfillment_plan
                GROUP BY order_id
            ) allocated
            ON requested.order_id = allocated.order_id
        """)

        avg_rate = cursor.fetchone()

        conn.close()

        return {
            "total_orders": summary["total_orders"] or 0,
            "fully_fulfilled": summary["fully_fulfilled"] or 0,
            "partially_fulfilled": summary["partially_fulfilled"] or 0,
            "infeasible_orders": summary["infeasible_orders"] or 0,
            "average_fulfillment_rate": round(
                avg_rate["average_fulfillment_rate"] or 0,
                2
            )
        }

ro_service = RouteOptimizationService()