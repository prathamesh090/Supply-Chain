from route_optimization.data_provider import data_provider
from route_optimization.allocation_engine import allocation_engine
from route_optimization.database_service import ro_db


class RouteOptimizationService:
    def run_optimization(self, order_id: str):
        order_data = data_provider.get_order_by_id(order_id)

        if not order_data["order"]:
            return {"status": "ERROR", "message": f"Order {order_id} not found"}

        order = order_data["order"]
        items = order_data["items"]
        if not items:
            return {"status": "ERROR", "message": f"Order {order_id} has no items"}

        product_ids = [item["product_id"] for item in items]
        warehouses_by_product = data_provider.get_warehouses_for_products(product_ids)

        result = allocation_engine.generate_fulfillment_plan(
            order=order,
            order_items=items,
            warehouses_by_product=warehouses_by_product,
        )

        self.save_fulfillment_plan(order_id=order_id, result=result)
        self.update_order_status(order_id, result["status"])

        if result["allocations"]:
            self.update_inventory_stock(result)

        return {"order_id": order_id, **result}

    def save_fulfillment_plan(self, order_id: str, result: dict):
        conn = ro_db.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM route_fulfillment_plan WHERE order_id = %s", (order_id,))

        for allocation in result["allocations"]:
            cursor.execute(
                """
                INSERT INTO route_fulfillment_plan (
                    order_id, product_id, warehouse_id, allocated_quantity,
                    distance_km, transport_cost, decision_reason,
                    fulfillment_status, shortage_quantity
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    order_id,
                    allocation["product_id"],
                    allocation["warehouse_id"],
                    allocation["allocated_quantity"],
                    allocation["distance_km"],
                    allocation["transport_cost"],
                    allocation["decision_reason"],
                    result["status"],
                    allocation.get("shortage_quantity", 0),
                ),
            )

        conn.commit()
        conn.close()

    def update_order_status(self, order_id: str, status: str):
        conn = ro_db.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE customer_orders SET order_status = %s WHERE order_id = %s", (status, order_id))
        conn.commit()
        conn.close()

    def update_inventory_stock(self, result: dict):
        from inventory.database_service import inventory_db

        conn = inventory_db.get_connection()
        cursor = conn.cursor()

        for allocation in result["allocations"]:
            cursor.execute(
                """
                UPDATE inventory_master
                SET current_stock = GREATEST(0, current_stock - %s)
                WHERE warehouse_id = %s AND product_id = %s
                """,
                (
                    allocation["allocated_quantity"],
                    allocation["warehouse_id"],
                    allocation["product_id"],
                ),
            )

        conn.commit()
        conn.close()

    def get_fulfillment_plan(self, order_id: str):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT order_id, product_id, warehouse_id, allocated_quantity, distance_km,
                   transport_cost, decision_reason, fulfillment_status, shortage_quantity, created_at
            FROM route_fulfillment_plan
            WHERE order_id = %s
            ORDER BY created_at DESC, product_id, transport_cost ASC
            """,
            (order_id,),
        )
        allocations = cursor.fetchall()
        conn.close()

        if not allocations:
            return {"status": "ERROR", "message": f"No fulfillment plan found for {order_id}"}

        total_shortage = sum(float(item.get("shortage_quantity") or 0) for item in allocations)
        return {
            "order_id": order_id,
            "status": allocations[0]["fulfillment_status"],
            "allocations": allocations,
            "shortage": round(total_shortage, 2),
        }

    def get_order_kpis(self, order_id: str):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COALESCE(SUM(quantity),0) AS requested_quantity FROM customer_order_items WHERE order_id = %s", (order_id,))
        requested = float(cursor.fetchone()["requested_quantity"])

        cursor.execute(
            """
            SELECT COALESCE(SUM(allocated_quantity),0) AS allocated_quantity,
                   COALESCE(SUM(transport_cost),0) AS total_transport_cost,
                   COALESCE(AVG(distance_km),0) AS average_distance_km,
                   COUNT(DISTINCT warehouse_id) AS warehouse_count_used,
                   MAX(fulfillment_status) AS status,
                   COALESCE(SUM(shortage_quantity),0) AS shortage
            FROM route_fulfillment_plan WHERE order_id = %s
            """,
            (order_id,),
        )
        plan = cursor.fetchone()
        conn.close()

        allocated = float(plan["allocated_quantity"])
        shortage = float(plan.get("shortage") or max(0, requested - allocated))
        rate = round((allocated / requested) * 100, 2) if requested > 0 else 0

        return {
            "order_id": order_id,
            "requested_quantity": requested,
            "allocated_quantity": allocated,
            "shortage": shortage,
            "fulfillment_rate": rate,
            "warehouse_count_used": int(plan["warehouse_count_used"]),
            "total_transport_cost": round(float(plan["total_transport_cost"]), 2),
            "average_distance_km": round(float(plan["average_distance_km"]), 2),
            "status": plan["status"],
        }

    def get_order_history(self):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT order_id, fulfillment_status,
                   SUM(allocated_quantity) AS total_allocated,
                   SUM(transport_cost) AS total_cost,
                   SUM(shortage_quantity) AS shortage,
                   MAX(created_at) AS latest_plan_time
            FROM route_fulfillment_plan
            GROUP BY order_id, fulfillment_status
            ORDER BY latest_plan_time DESC
            """
        )
        history = cursor.fetchall()
        conn.close()
        return {"orders": history}

    def explain_order_decision(self, order_id: str):
        plan = self.get_fulfillment_plan(order_id)
        if plan.get("status") == "ERROR":
            return plan

        traces = []
        for idx, allocation in enumerate(plan["allocations"], start=1):
            traces.append(
                {
                    "step": idx,
                    "warehouse_id": allocation["warehouse_id"],
                    "product_id": allocation["product_id"],
                    "reason": allocation["decision_reason"],
                    "allocated_quantity": allocation["allocated_quantity"],
                    "transport_cost": allocation["transport_cost"],
                    "distance_km": allocation["distance_km"],
                }
            )

        return {
            "order_id": order_id,
            "status": plan["status"],
            "shortage": plan.get("shortage", 0),
            "decision_summary": [f"Step {item['step']}: {item['reason']}" for item in traces],
            "explanation": traces,
        }

    def get_chart_data(self, order_id: str):
        plan = self.get_fulfillment_plan(order_id)
        if plan.get("status") == "ERROR":
            return plan

        labels, allocated_quantities, costs, distances = [], [], [], []
        for allocation in plan["allocations"]:
            label = f"P{allocation['product_id']}-W{allocation['warehouse_id']}"
            labels.append(label)
            allocated_quantities.append(allocation["allocated_quantity"])
            costs.append(allocation["transport_cost"])
            distances.append(allocation["distance_km"])

        return {
            "order_id": order_id,
            "labels": labels,
            "allocated_quantities": allocated_quantities,
            "transport_costs": costs,
            "distances_km": distances,
        }

    def get_dashboard_summary(self):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT COUNT(DISTINCT order_id) AS total_orders,
                   SUM(CASE WHEN fulfillment_status='FULLY_FULFILLED' THEN 1 ELSE 0 END) AS fully_fulfilled,
                   SUM(CASE WHEN fulfillment_status='PARTIALLY_FULFILLED' THEN 1 ELSE 0 END) AS partially_fulfilled,
                   SUM(CASE WHEN fulfillment_status='INFEASIBLE' THEN 1 ELSE 0 END) AS infeasible_orders
            FROM (SELECT order_id, MAX(fulfillment_status) AS fulfillment_status
                  FROM route_fulfillment_plan GROUP BY order_id) summary
            """
        )
        summary = cursor.fetchone()

        cursor.execute(
            """
            SELECT AVG(CASE WHEN requested.total_requested > 0
                            THEN (COALESCE(allocated.total_allocated,0)/requested.total_requested) * 100
                            ELSE 0 END) AS average_fulfillment_rate
            FROM (SELECT order_id, SUM(quantity) AS total_requested
                  FROM customer_order_items GROUP BY order_id) requested
            LEFT JOIN (SELECT order_id, SUM(allocated_quantity) AS total_allocated
                       FROM route_fulfillment_plan GROUP BY order_id) allocated
            ON requested.order_id = allocated.order_id
            """
        )
        avg_rate = cursor.fetchone()
        conn.close()

        return {
            "total_orders": summary["total_orders"] or 0,
            "fully_fulfilled": summary["fully_fulfilled"] or 0,
            "partially_fulfilled": summary["partially_fulfilled"] or 0,
            "infeasible_orders": summary["infeasible_orders"] or 0,
            "average_fulfillment_rate": round(float(avg_rate["average_fulfillment_rate"] or 0), 2),
        }


ro_service = RouteOptimizationService()
