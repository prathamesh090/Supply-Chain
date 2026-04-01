from route_optimization.cost_engine import cost_engine


class AllocationEngine:
    def generate_fulfillment_plan(self, order: dict, order_items: list, warehouses_by_product: dict):
        allocations = []
        decision_summary = []
        total_shortage = 0

        customer_lat = float(order["customer_lat"])
        customer_lon = float(order["customer_lon"])

        total_requested = sum(int(item["quantity"]) for item in order_items)
        total_allocated = 0

        for item in order_items:
            product_id = item["product_id"]
            required_quantity = int(item["quantity"])
            remaining_quantity = required_quantity
            product_warehouses = warehouses_by_product.get(product_id, [])

            total_available = sum(int(warehouse["available_quantity"]) for warehouse in product_warehouses)
            if total_available <= 0:
                total_shortage += required_quantity
                decision_summary.append(f"Product {product_id}: no warehouse inventory available.")
                continue

            warehouse_costs = []
            for warehouse in product_warehouses:
                distance = cost_engine.haversine_distance(
                    float(warehouse["latitude"]),
                    float(warehouse["longitude"]),
                    customer_lat,
                    customer_lon,
                )
                transport_cost = cost_engine.transport_cost(distance)
                warehouse_costs.append(
                    {
                        "warehouse_id": warehouse["warehouse_id"],
                        "available_quantity": int(warehouse["available_quantity"]),
                        "distance_km": distance,
                        "transport_cost": transport_cost,
                    }
                )

            warehouse_costs.sort(key=lambda x: x["transport_cost"])

            for warehouse in warehouse_costs:
                if remaining_quantity <= 0:
                    break
                available = warehouse["available_quantity"]
                if available <= 0:
                    continue

                allocated_quantity = min(remaining_quantity, available)
                total_allocated += allocated_quantity

                allocations.append(
                    {
                        "product_id": product_id,
                        "warehouse_id": warehouse["warehouse_id"],
                        "allocated_quantity": allocated_quantity,
                        "distance_km": warehouse["distance_km"],
                        "transport_cost": warehouse["transport_cost"],
                        "decision_reason": (
                            f"Selected for product {product_id} because it had stock and lower transport cost. "
                            f"Distance {warehouse['distance_km']} km, cost {warehouse['transport_cost']}."
                        ),
                        "shortage_quantity": 0,
                    }
                )
                remaining_quantity -= allocated_quantity

                decision_summary.append(
                    f"Product {product_id}: warehouse {warehouse['warehouse_id']} allocated {allocated_quantity} units."
                )

            if remaining_quantity > 0:
                total_shortage += remaining_quantity
                decision_summary.append(f"Product {product_id}: shortage of {remaining_quantity} units after using all feasible warehouses.")

        if total_allocated == 0:
            overall_status = "INFEASIBLE"
        elif total_shortage > 0:
            overall_status = "PARTIALLY_FULFILLED"
        else:
            overall_status = "FULLY_FULFILLED"

        if not decision_summary:
            decision_summary.append("No allocation created.")

        for allocation in allocations:
            if total_shortage > 0:
                allocation["shortage_quantity"] = total_shortage

        return {
            "status": overall_status,
            "allocations": allocations,
            "decision_summary": decision_summary,
            "shortage": total_shortage,
            "requested_quantity": total_requested,
            "allocated_quantity": total_allocated,
        }


allocation_engine = AllocationEngine()
