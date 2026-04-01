# route_optimization/allocation_engine.py

from route_optimization.cost_engine import cost_engine


class AllocationEngine:

    def generate_fulfillment_plan(
        self,
        order: dict,
        order_items: list,
        warehouses: list
    ):
        allocations = []
        decision_summary = []

        customer_lat = order["customer_lat"]
        customer_lon = order["customer_lon"]

        overall_status = "FULLY_FULFILLED"

        for item in order_items:
            product_id = item["product_id"]
            required_quantity = item["quantity"]

            # STEP 1 — Feasibility Check
            total_available = sum(
                warehouse["available_quantity"]
                for warehouse in warehouses
            )

            if total_available == 0:
                return {
                    "status": "INFEASIBLE",
                    "allocations": [],
                    "decision_summary": [
                        "No warehouse inventory available"
                    ],
                    "shortage": required_quantity
                }

            # STEP 2 — Compute distance + cost
            warehouse_costs = []

            for warehouse in warehouses:
                distance = cost_engine.haversine_distance(
                    warehouse["latitude"],
                    warehouse["longitude"],
                    customer_lat,
                    customer_lon
                )

                transport_cost = cost_engine.transport_cost(distance)

                warehouse_costs.append({
                    "warehouse_id": warehouse["warehouse_id"],
                    "available_quantity": warehouse["available_quantity"],
                    "distance_km": distance,
                    "transport_cost": transport_cost
                })

            # STEP 3 — Sort by lowest transport cost
            warehouse_costs.sort(
                key=lambda x: x["transport_cost"]
            )

            # STEP 4 — Greedy Allocation
            remaining_quantity = required_quantity

            for warehouse in warehouse_costs:
                if remaining_quantity <= 0:
                    break

                available = warehouse["available_quantity"]

                if available <= 0:
                    continue

                allocated_quantity = min(
                    remaining_quantity,
                    available
                )

                allocations.append({
                    "product_id": product_id,
                    "warehouse_id": warehouse["warehouse_id"],
                    "allocated_quantity": allocated_quantity,
                    "distance_km": warehouse["distance_km"],
                    "transport_cost": warehouse["transport_cost"],
                    "decision_reason": (
                        "Selected based on lowest transport cost "
                        "and feasible inventory"
                    )
                })

                decision_summary.append(
                    f"{warehouse['warehouse_id']} allocated "
                    f"{allocated_quantity} units"
                )

                remaining_quantity -= allocated_quantity

            # STEP 5 — Final status
            if remaining_quantity > 0:
                overall_status = "PARTIALLY_FULFILLED"

                decision_summary.append(
                    f"Shortage of {remaining_quantity} units"
                )

            return {
                "status": overall_status,
                "allocations": allocations,
                "decision_summary": decision_summary,
                "shortage": max(0, remaining_quantity)
            }


allocation_engine = AllocationEngine()