# route_optimization/database_service.py

import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv("Backend/.env")


class RouteOptimizationDB:
    def __init__(self):
        self.host = os.getenv("DB_HOST")
        self.user = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
        self.database = os.getenv("DB_NAME")
        self.port = int(os.getenv("DB_PORT", 3306))

    def get_connection(self):
        return mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database,
            port=self.port
        )

    def create_tables(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customer_orders (
                order_id VARCHAR(50) PRIMARY KEY,
                customer_region VARCHAR(100) NOT NULL,
                customer_lat DOUBLE NOT NULL,
                customer_lon DOUBLE NOT NULL,
                order_status VARCHAR(50) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customer_order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id VARCHAR(50),
                product_id VARCHAR(50),
                quantity INT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES customer_orders(order_id)
                    ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS route_fulfillment_plan (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id VARCHAR(50),
                warehouse_id VARCHAR(50),
                allocated_quantity INT,
                distance_km DOUBLE,
                transport_cost DOUBLE,
                decision_reason TEXT,
                fulfillment_status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()
        print("✅ RO tables created successfully")


ro_db = RouteOptimizationDB()
ro_db.create_tables()