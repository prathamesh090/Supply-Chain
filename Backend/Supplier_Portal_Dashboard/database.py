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
                    contact_person VARCHAR(255),
                    manufacturing_state VARCHAR(120),
                    city VARCHAR(120),
                    country VARCHAR(120),
                    factory_address TEXT,
                    company_overview TEXT,
                    website VARCHAR(255),
                    categories TEXT,
                    technical_capabilities TEXT,
                    lead_time_defaults VARCHAR(120),
                    stock_service_notes TEXT,
                    website_url VARCHAR(255),
                    support_email VARCHAR(255),
                    profile_completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
                )
                '''
            )
            for ddl in [
                "ALTER TABLE supplier_profiles ADD COLUMN contact_person VARCHAR(255) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN city VARCHAR(120) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN country VARCHAR(120) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN website VARCHAR(255) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN categories TEXT NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN technical_capabilities TEXT NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN lead_time_defaults VARCHAR(120) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN stock_service_notes TEXT NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE",
            ]:
                try:
                    cursor.execute(ddl)
                except Exception:
                    pass
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
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS supplier_certificate_verifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    supplier_id INT NULL,
                    doc_type VARCHAR(120) NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_type VARCHAR(120) NOT NULL,
                    expiry_date DATE NULL,
                    expiry_valid BOOLEAN DEFAULT FALSE,
                    template_match BOOLEAN DEFAULT FALSE,
                    document_type_valid BOOLEAN DEFAULT FALSE,
                    verified BOOLEAN DEFAULT FALSE,
                    reason TEXT,
                    matched_keywords JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE SET NULL
                )
                '''
            )
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS manufacturer_profiles (
                    manufacturer_id INT PRIMARY KEY,
                    company_name VARCHAR(255),
                    contact_person VARCHAR(255),
                    email VARCHAR(255),
                    phone VARCHAR(30),
                    address TEXT,
                    city VARCHAR(120),
                    state VARCHAR(120),
                    country VARCHAR(120),
                    business_description TEXT,
                    website VARCHAR(255),
                    profile_completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (manufacturer_id) REFERENCES users(id) ON DELETE CASCADE
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
                (supplier_id, company_legal_name, contact_person, phone, manufacturing_state, factory_address, company_overview, support_email, profile_completed)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ''',
                (
                    user_id,
                    payload.get("company_legal_name"),
                    payload.get("contact_person"),
                    payload.get("phone"),
                    payload.get("manufacturing_state"),
                    payload.get("factory_address"),
                    payload.get("company_overview"),
                    payload.get("email"),
                    False,
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
    def is_supplier_profile_complete(profile: Optional[Dict[str, Any]]) -> bool:
        if not profile:
            return False
        required = [
            "company_legal_name",
            "company_overview",
            "contact_person",
            "phone",
            "factory_address",
            "city",
            "manufacturing_state",
            "country",
            "support_email",
        ]
        return all(str(profile.get(key) or "").strip() for key in required)

    @staticmethod
    def update_supplier_profile(supplier_id: int, fields: Dict[str, Any]) -> None:
        if not fields:
            return
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            profile = SupplierPortalDB.get_supplier_profile(supplier_id) or {}
            merged = {**profile, **fields}
            fields["profile_completed"] = SupplierPortalDB.is_supplier_profile_complete(merged)
            sets = ", ".join([f"{k}=%s" for k in fields])
            values = list(fields.values()) + [supplier_id]
            cursor.execute(f"UPDATE supplier_profiles SET {sets} WHERE supplier_id=%s", values)
            if cursor.rowcount == 0:
                cursor.execute(
                    '''
                    INSERT INTO supplier_profiles (supplier_id, company_legal_name, support_email, profile_completed)
                    VALUES (%s, %s, %s, %s)
                    ''',
                    (
                        supplier_id,
                        fields.get("company_legal_name") or "Supplier",
                        fields.get("support_email"),
                        fields["profile_completed"],
                    ),
                )
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
                  sp.city,
                  sp.manufacturing_state,
                  sp.country,
                  sp.categories,
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
            rows = cursor.fetchall()

            # Fallback for legacy datasets where suppliers were only inserted into supplier_auth.
            if not rows:
                cursor.execute("SHOW TABLES LIKE 'supplier_auth'")
                has_supplier_auth = cursor.fetchone() is not None
                if has_supplier_auth:
                    legacy_where = ["sa.supplier_id IS NOT NULL"]
                    legacy_params: List[Any] = [manufacturer_id]
                    if search:
                        legacy_where.append("(sa.email LIKE %s OR COALESCE(sp.company_legal_name,'') LIKE %s)")
                        legacy_params.extend([f"%{search}%", f"%{search}%"])
                    if active_only:
                        legacy_where.append("sc.status='active'")

                    legacy_query = f'''
                        SELECT
                          sa.supplier_id AS supplier_id,
                          COALESCE(sp.company_legal_name, SUBSTRING_INDEX(sa.email, '@', 1)) AS company_legal_name,
                          sp.company_overview,
                          sp.phone,
                          sp.city,
                          sp.manufacturing_state,
                          sp.country,
                          sp.categories,
                          COALESCE(sp.support_email, sa.email) AS support_email,
                          COALESCE(sc.status, 'none') AS connection_status
                        FROM supplier_auth sa
                        LEFT JOIN supplier_profiles sp ON sp.supplier_id = sa.supplier_id
                        LEFT JOIN supplier_connections sc
                          ON sc.supplier_id=sa.supplier_id AND sc.manufacturer_id=%s
                        WHERE {' AND '.join(legacy_where)}
                        ORDER BY company_legal_name
                    '''
                    cursor.execute(legacy_query, legacy_params)
                    rows = cursor.fetchall()

            return rows
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_manufacturer_profile(manufacturer_id: int) -> Optional[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return None
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM manufacturer_profiles WHERE manufacturer_id=%s", (manufacturer_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def update_manufacturer_profile(manufacturer_id: int, fields: Dict[str, Any]) -> None:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            required = ["company_name", "contact_person", "email", "phone"]
            merged = {**(SupplierPortalDB.get_manufacturer_profile(manufacturer_id) or {}), **fields}
            fields["profile_completed"] = all(str(merged.get(k) or "").strip() for k in required)
            sets = ", ".join([f"{k}=%s" for k in fields])
            values = list(fields.values()) + [manufacturer_id]
            cursor.execute(f"UPDATE manufacturer_profiles SET {sets} WHERE manufacturer_id=%s", values)
            if cursor.rowcount == 0:
                cursor.execute(
                    '''
                    INSERT INTO manufacturer_profiles
                    (manufacturer_id, company_name, contact_person, email, phone, address, city, state, country, business_description, website, profile_completed)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ''',
                    (
                        manufacturer_id,
                        fields.get("company_name"),
                        fields.get("contact_person"),
                        fields.get("email"),
                        fields.get("phone"),
                        fields.get("address"),
                        fields.get("city"),
                        fields.get("state"),
                        fields.get("country"),
                        fields.get("business_description"),
                        fields.get("website"),
                        fields["profile_completed"],
                    ),
                )
            conn.commit()
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

    @staticmethod
    def save_certificate_verification(payload: Dict[str, Any]) -> int:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            cursor.execute(
                '''
                INSERT INTO supplier_certificate_verifications
                (supplier_id, doc_type, file_name, file_type, expiry_date, expiry_valid, template_match, document_type_valid, verified, reason, matched_keywords)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ''',
                (
                    payload.get("supplier_id"),
                    payload.get("doc_type"),
                    payload.get("file_name"),
                    payload.get("file_type"),
                    payload.get("expiry_date"),
                    bool(payload.get("expiry_valid")),
                    bool(payload.get("template_match")),
                    bool(payload.get("document_type_valid")),
                    bool(payload.get("verified")),
                    payload.get("reason"),
                    payload.get("matched_keywords") and str(payload.get("matched_keywords")),
                ),
            )
            conn.commit()
            return int(cursor.lastrowid)
        finally:
            cursor.close()
            conn.close()
