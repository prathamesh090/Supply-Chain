# inventory/database_service.py

import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

class InventoryDatabaseService:
    def __init__(self):
        self.host     = os.getenv('DB_HOST', 'localhost')
        self.user     = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', 'Satyam@mysql')
        self.database = os.getenv('DB_NAME', 'chainlink_pro')
        self.port     = os.getenv('DB_PORT', '3306')

    def get_connection(self):
        # Step 1: connect WITHOUT selecting DB first
        conn = mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            port=int(self.port)
        )
        cursor = conn.cursor()

        # Step 2: create chainlink_pro if not exists
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.database}")
        cursor.close()
        conn.close()

        # Step 3: connect again WITH database selected
        return mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database,
            port=int(self.port)
        )

    def create_tables(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            # ── Table 1: warehouses ──────────────────────────────────
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS warehouses (
                    warehouse_id   INT           AUTO_INCREMENT PRIMARY KEY,
                    name           VARCHAR(255)  NOT NULL,
                    city           VARCHAR(100)  NOT NULL,
                    latitude       DECIMAL(9,6)  NOT NULL,
                    longitude      DECIMAL(9,6)  NOT NULL,
                    demand_weight  DECIMAL(3,2)  NOT NULL DEFAULT 0.50,
                    total_capacity INT           NOT NULL DEFAULT 0
                )
            ''')

            # ── Insert Mumbai and Bhopal (only if table is empty) ────
            cursor.execute("SELECT COUNT(*) FROM warehouses")
            count = cursor.fetchone()[0]

            if count == 0:
                cursor.execute('''
                    INSERT INTO warehouses 
                        (name, city, latitude, longitude, demand_weight, total_capacity)
                    VALUES
                        (%s, %s, %s, %s, %s, %s),
                        (%s, %s, %s, %s, %s, %s)
                ''', (
                    'Mumbai Warehouse', 'Mumbai', 19.076090, 72.877426, 0.60, 10000,
                    'Bhopal Warehouse', 'Bhopal', 23.259933, 77.412615, 0.40, 6000
                ))
                print("✅ Warehouses inserted: Mumbai and Bhopal")
            else:
                print("ℹ️  Warehouses already exist — skipping insert")

            # ── Table 2: inventory_master ────────────────────────────
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS inventory_master (
                    product_id    VARCHAR(100)  NOT NULL,
                    warehouse_id  INT           NOT NULL,
                    current_stock INT           NOT NULL DEFAULT 0,
                    lead_time     INT           NOT NULL DEFAULT 7,
                    supplier_name VARCHAR(255)           DEFAULT '',
                    PRIMARY KEY (product_id, warehouse_id),
                    FOREIGN KEY (warehouse_id) 
                        REFERENCES warehouses(warehouse_id)
                        ON DELETE CASCADE
                )
            ''')

            conn.commit()
            print("✅ Inventory tables created successfully in chainlink_pro")

        except Exception as e:
            print(f"❌ Error creating inventory tables: {e}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()

    # ── Save / Update inventory ──────────────────────────────────────

    def save_inventory(self, product_id, warehouse_id,
                       current_stock, lead_time, supplier_name=""):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO inventory_master
                    (product_id, warehouse_id, current_stock,
                     lead_time, supplier_name)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    current_stock = VALUES(current_stock),
                    lead_time     = VALUES(lead_time),
                    supplier_name = VALUES(supplier_name)
            ''', (product_id, warehouse_id, current_stock,
                  lead_time, supplier_name))
            conn.commit()
            return True
        except Exception as e:
            print(f"❌ Error saving inventory: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    # ── Get all products for a warehouse ────────────────────────────

    def get_inventory_by_warehouse(self, warehouse_id):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute('''
                SELECT product_id, current_stock,
                       lead_time, supplier_name
                FROM inventory_master
                WHERE warehouse_id = %s
            ''', (warehouse_id,))
            return cursor.fetchall()
        except Exception as e:
            print(f"❌ Error fetching inventory: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    # ── Get warehouse info (with capacity) ──────────────────────────

    def get_warehouse(self, warehouse_id):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute('''
                SELECT warehouse_id, name, city,
                       latitude, longitude,
                       demand_weight, total_capacity
                FROM warehouses
                WHERE warehouse_id = %s
            ''', (warehouse_id,))
            return cursor.fetchone()
        except Exception as e:
            print(f"❌ Error fetching warehouse: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    # ── Get all warehouses ───────────────────────────────────────────

    def get_all_warehouses(self):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute('''
                SELECT warehouse_id, name, city,
                       latitude, longitude,
                       demand_weight, total_capacity
                FROM warehouses
            ''')
            return cursor.fetchall()
        except Exception as e:
            print(f"❌ Error fetching warehouses: {e}")
            return []
        finally:
            cursor.close()
            conn.close()

    # ── Update stock (reduce after order) ───────────────────────────

    def update_stock(self, product_id, warehouse_id, quantity):
        conn = self.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # Check current stock first
            cursor.execute('''
                SELECT current_stock FROM inventory_master
                WHERE product_id = %s AND warehouse_id = %s
            ''', (product_id, warehouse_id))
            row = cursor.fetchone()

            if not row:
                return {"success": False, "error": "Product not found"}

            if row["current_stock"] < quantity:
                return {
                    "success": False,
                    "error": f"Insufficient stock. Available: {row['current_stock']}"
                }

            new_stock = row["current_stock"] - quantity
            cursor.execute('''
                UPDATE inventory_master
                SET current_stock = %s
                WHERE product_id = %s AND warehouse_id = %s
            ''', (new_stock, product_id, warehouse_id))
            conn.commit()

            return {"success": True, "new_stock": new_stock}

        except Exception as e:
            conn.rollback()
            return {"success": False, "error": str(e)}
        finally:
            cursor.close()
            conn.close()


# ── Auto-run when server starts ─────────────────────────────────────
inventory_db = InventoryDatabaseService()
inventory_db.create_tables()




# What This File Does
# ```
# When imported →
#     1. Connects to MySQL (no DB selected)
#     2. Creates chainlink_pro if not exists  ← same as demand forecasting
#     3. Creates warehouses table
#     4. Inserts Mumbai + Bhopal (only if empty — safe to restart)
#     5. Creates inventory_master table
#     6. Ready to use
# ```

# ---

# Copy this into `inventory/database_service.py` and tell me:

# 1. Any errors? ✅
# 2. Do you see these lines when you run the server?
# ```
# ✅ Warehouses inserted: Mumbai and Bhopal
# ✅ Inventory tables created successfully in chainlink_pro