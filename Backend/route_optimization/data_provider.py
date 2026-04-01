from route_optimization.database_service import ro_db
from inventory.database_service import inventory_db


class RODataProvider:
    def get_order_by_id(self, order_id: str):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM customer_orders WHERE order_id = %s", (order_id,))
        order = cursor.fetchone()

        cursor.execute(
            """
            SELECT product_id, quantity
            FROM customer_order_items
            WHERE order_id = %s
            ORDER BY id ASC
            """,
            (order_id,),
        )
        items = cursor.fetchall()

        conn.close()
        return {"order": order, "items": items}

    def get_warehouses_for_products(self, product_ids: list[str]):
        if not product_ids:
            return {}

        conn = inventory_db.get_connection()
        cursor = conn.cursor(dictionary=True)

        placeholders = ",".join(["%s"] * len(product_ids))
        cursor.execute(
            f"""
            SELECT im.product_id, w.warehouse_id, w.city, w.latitude, w.longitude,
                   im.current_stock AS available_quantity
            FROM inventory_master im
            JOIN warehouses w ON im.warehouse_id = w.warehouse_id
            WHERE im.product_id IN ({placeholders}) AND im.current_stock > 0
            """,
            tuple(product_ids),
        )
        rows = cursor.fetchall()
        conn.close()

        grouped: dict[str, list] = {product_id: [] for product_id in product_ids}
        for row in rows:
            grouped.setdefault(row["product_id"], []).append(row)
        return grouped


data_provider = RODataProvider()
