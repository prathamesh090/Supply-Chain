import logging
from typing import Any, Dict, List, Optional

import mysql.connector
from mysql.connector import Error

from .config import settings

logger = logging.getLogger(__name__)


class SupplierPortalDB:
    @staticmethod
    def get_connection():
        try:
            return mysql.connector.connect(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                database=settings.DB_NAME,
            )
        except Error as e:
            logger.error("Database connection error: %s", e)
            return None

    @staticmethod
    def init_tables() -> None:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return
        cursor = conn.cursor()
        try:
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS supplier_profiles (
                    supplier_id INT PRIMARY KEY,
                    company_legal_name VARCHAR(255) NOT NULL,
                    phone VARCHAR(30),
                    manufacturing_state VARCHAR(120),
                    factory_address TEXT,
                    company_overview TEXT,
                    website_url VARCHAR(255),
                    support_email VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
                )
                '''
            )
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS supplier_materials (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    supplier_id INT NOT NULL,
                    material_name VARCHAR(255) NOT NULL,
                    category VARCHAR(120),
                    technical_specifications TEXT,
                    lead_time_days INT,
                    stock_status ENUM('in_stock','low_stock','out_of_stock') DEFAULT 'in_stock',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
                )
                '''
            )
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS supplier_connections (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    manufacturer_id INT NOT NULL,
                    supplier_id INT NOT NULL,
                    status ENUM('pending','active','rejected') DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uniq_connection (manufacturer_id, supplier_id),
                    FOREIGN KEY (manufacturer_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
                )
                '''
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def create_supplier_profile(user_id: int, payload: Dict[str, Any]) -> None:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            cursor.execute(
                '''
                INSERT INTO supplier_profiles
                (supplier_id, company_legal_name, phone, manufacturing_state, factory_address, company_overview, support_email)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
                ''',
                (
                    user_id,
                    payload.get("company_legal_name"),
                    payload.get("phone"),
                    payload.get("manufacturing_state"),
                    payload.get("factory_address"),
                    payload.get("company_overview"),
                    payload.get("email"),
                ),
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_supplier_profile(supplier_id: int) -> Optional[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return None
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM supplier_profiles WHERE supplier_id=%s", (supplier_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def update_supplier_profile(supplier_id: int, fields: Dict[str, Any]) -> None:
        if not fields:
            return
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            sets = ", ".join([f"{k}=%s" for k in fields])
            values = list(fields.values()) + [supplier_id]
            cursor.execute(f"UPDATE supplier_profiles SET {sets} WHERE supplier_id=%s", values)
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def add_material(supplier_id: int, payload: Dict[str, Any]) -> int:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            cursor.execute(
                '''
                INSERT INTO supplier_materials
                (supplier_id, material_name, category, technical_specifications, lead_time_days, stock_status)
                VALUES (%s,%s,%s,%s,%s,%s)
                ''',
                (
                    supplier_id,
                    payload.get("material_name"),
                    payload.get("category"),
                    payload.get("technical_specifications"),
                    payload.get("lead_time_days"),
                    payload.get("stock_status") or "in_stock",
                ),
            )
            conn.commit()
            return int(cursor.lastrowid)
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_supplier_materials(supplier_id: int) -> List[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return []
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM supplier_materials WHERE supplier_id=%s ORDER BY material_name", (supplier_id,))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def list_suppliers(manufacturer_id: int, search: Optional[str] = None, active_only: bool = False) -> List[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return []
        cursor = conn.cursor(dictionary=True)
        try:
            where = ["sp.company_legal_name IS NOT NULL"]
            params: List[Any] = [manufacturer_id]
            if search:
                where.append("(sp.company_legal_name LIKE %s OR sp.company_overview LIKE %s)")
                params.extend([f"%{search}%", f"%{search}%"])
            if active_only:
                where.append("sc.status='active'")

            query = f'''
                SELECT
                  sp.supplier_id AS supplier_id,
                  sp.company_legal_name,
                  sp.company_overview,
                  sp.phone,
                  sp.support_email,
                  COALESCE(sc.status, 'none') AS connection_status
                FROM supplier_profiles sp
                LEFT JOIN users u ON u.id = sp.supplier_id
                LEFT JOIN supplier_connections sc
                  ON sc.supplier_id=sp.supplier_id AND sc.manufacturer_id=%s
                WHERE {' AND '.join(where)}
                  AND (u.id IS NULL OR u.is_active=TRUE)
                ORDER BY sp.company_legal_name
            '''
            cursor.execute(query, params)
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def upsert_connection(manufacturer_id: int, supplier_id: int, status: str = "active") -> None:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            cursor.execute(
                '''
                INSERT INTO supplier_connections (manufacturer_id, supplier_id, status)
                VALUES (%s,%s,%s)
                ON DUPLICATE KEY UPDATE status=VALUES(status)
                ''',
                (manufacturer_id, supplier_id, status),
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()
