# route_optimization/data_provider.py

from route_optimization.database_service import ro_db
from inventory.database_service import inventory_db


class RODataProvider:

    def get_order_by_id(self, order_id: str):
        conn = ro_db.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT *
            FROM customer_orders
            WHERE order_id = %s
        """, (order_id,))
        order = cursor.fetchone()

        cursor.execute("""
            SELECT product_id, quantity
            FROM customer_order_items
            WHERE order_id = %s
        """, (order_id,))
        items = cursor.fetchall()

        conn.close()

        return {
            "order": order,
            "items": items
        }

    def get_warehouses_for_product(self, product_id: str):
        conn = inventory_db.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                w.warehouse_id,
                w.city,
                w.latitude,
                w.longitude,
                im.current_stock AS available_quantity
            FROM inventory_master im
            JOIN warehouses w
                ON im.warehouse_id = w.warehouse_id
            WHERE im.product_id = %s
            AND im.current_stock > 0
        """, (product_id,))

        warehouses = cursor.fetchall()
        conn.close()

        return warehouses


data_provider = RODataProvider()