import logging
import json
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
                    gstin VARCHAR(20),
                    profile_completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
                )
                '''
            )
            for ddl in [
                "ALTER TABLE supplier_profiles ADD COLUMN company_legal_name VARCHAR(255) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN phone VARCHAR(30) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN manufacturing_state VARCHAR(120) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN factory_address TEXT NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN company_overview TEXT NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN website_url VARCHAR(255) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN support_email VARCHAR(255) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN contact_person VARCHAR(255) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN city VARCHAR(120) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN country VARCHAR(120) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN website VARCHAR(255) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN categories TEXT NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN technical_capabilities TEXT NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN lead_time_defaults VARCHAR(120) NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN stock_service_notes TEXT NULL",
                "ALTER TABLE supplier_profiles ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE",
                "ALTER TABLE supplier_profiles ADD COLUMN gstin VARCHAR(20) NULL",
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
                CREATE TABLE IF NOT EXISTS supplier_risk_inputs (
                    supplier_id INT PRIMARY KEY,
                    delivery_delay_days FLOAT DEFAULT 0,
                    defect_rate_pct FLOAT DEFAULT 0,
                    price_variance_pct FLOAT DEFAULT 0,
                    compliance_flag TINYINT DEFAULT 0,
                    trust_score FLOAT DEFAULT 50,
                    plastic_type VARCHAR(120) DEFAULT 'Unknown',
                    defective_units INT DEFAULT 0,
                    quantity INT DEFAULT 1,
                    unit_price FLOAT DEFAULT 0,
                    negotiated_price FLOAT DEFAULT 0,
                    compliance VARCHAR(10) DEFAULT 'No',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
                )
                '''
            )
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS supplier_inquiries (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    manufacturer_id INT NOT NULL,
                    supplier_id INT NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    status ENUM('open', 'replied', 'closed') DEFAULT 'open',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (manufacturer_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
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
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS rfq_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    manufacturer_id INT NOT NULL,
                    supplier_id INT NOT NULL,
                    product_name VARCHAR(255) NOT NULL,
                    quantity INT NOT NULL,
                    budget_unit_price FLOAT,
                    target_delivery_date DATE,
                    specifications TEXT,
                    status ENUM('sent', 'viewed', 'quoted', 'negotiating', 'accepted', 'rejected', 'closed') DEFAULT 'sent',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (manufacturer_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
                )
                '''
            )
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS rfq_quotes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    rfq_id INT NOT NULL,
                    supplier_id INT NOT NULL,
                    version INT DEFAULT 1,
                    unit_price FLOAT NOT NULL,
                    total_amount FLOAT NOT NULL,
                    lead_time_days INT,
                    valid_until DATE,
                    terms_conditions TEXT,
                    is_current BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (rfq_id) REFERENCES rfq_requests(id) ON DELETE CASCADE,
                    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE
                )
                '''
            )
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS rfq_messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    rfq_id INT NOT NULL,
                    sender_id INT NOT NULL,
                    message TEXT NOT NULL,
                    parent_message_id INT NULL,
                    is_system_generated BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (rfq_id) REFERENCES rfq_requests(id) ON DELETE CASCADE,
                    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (parent_message_id) REFERENCES rfq_messages(id) ON DELETE SET NULL
                )
                '''
            )
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS user_notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    link VARCHAR(255),
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    rfq_id INT NULL,
                    type VARCHAR(50) NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                '''
            )
            conn.commit()

            # Migration: add columns if they don't exist
            try:
                cursor.execute("ALTER TABLE user_notifications ADD COLUMN rfq_id INT NULL")
                conn.commit()
            except: pass
            try:
                cursor.execute("ALTER TABLE user_notifications ADD COLUMN type VARCHAR(50) NULL")
                conn.commit()
            except: pass

        finally:
            if cursor: cursor.close()
            if conn: conn.close()

    @staticmethod
    def create_supplier_profile(user_id: int, payload: Dict[str, Any], cursor=None) -> None:
        conn = None
        if not cursor:
            conn = SupplierPortalDB.get_connection()
            if not conn:
                raise RuntimeError("Database connection failed")
            cursor = conn.cursor()
        
        try:
            cursor.execute(
                '''
                INSERT INTO supplier_profiles
                (supplier_id, company_legal_name, contact_person, phone, manufacturing_state, factory_address, company_overview, support_email, gstin, profile_completed)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
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
                    payload.get("gstin"),
                    False,
                ),
            )
            if conn:
                conn.commit()
        finally:
            if conn:
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
            # Handle password change if present
            if "new_password" in fields:
                from .auth_service import SupplierAuthService
                password = fields.pop("new_password")
                if password:
                    hashed = SupplierAuthService.hash_password(password)
                    cursor.execute("UPDATE users SET password_hash=%s WHERE id=%s", (hashed, supplier_id))

            # Update profile fields
            if fields:
                set_clause = ", ".join([f"{k}=%s" for k in fields.keys()])
                values = list(fields.values()) + [supplier_id]
                cursor.execute(f"UPDATE supplier_profiles SET {set_clause} WHERE supplier_id=%s", tuple(values))

            # Update completion status
            cursor.execute("SELECT * FROM supplier_profiles WHERE supplier_id=%s", (supplier_id,))
            cols = [desc[0] for desc in cursor.description]
            row = cursor.fetchone()
            if row:
                profile = dict(zip(cols, row))
                completed = SupplierPortalDB.is_supplier_profile_complete(profile)
                cursor.execute("UPDATE supplier_profiles SET profile_completed=%s WHERE supplier_id=%s", (completed, supplier_id))

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
                  COALESCE(sc.status, 'none') AS connection_status,
                  sri.trust_score,
                  sri.delivery_delay_days,
                  sri.defect_rate_pct,
                  (SELECT COUNT(*) FROM supplier_certificate_verifications scv WHERE scv.supplier_id = sp.supplier_id AND scv.verified = TRUE) as verified_count
                FROM supplier_profiles sp
                LEFT JOIN users u ON u.id = sp.supplier_id
                LEFT JOIN supplier_connections sc
                  ON sc.supplier_id=sp.supplier_id AND sc.manufacturer_id=%s
                LEFT JOIN supplier_risk_inputs sri ON sri.supplier_id = sp.supplier_id
                WHERE {' AND '.join(where)}
                  AND (u.id IS NULL OR u.is_active=TRUE)
                ORDER BY sp.company_legal_name
            '''
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # Enrich rows with breakdown logic
            for row in rows:
                row["trust_breakdown"] = SupplierPortalDB.calculate_trust_breakdown(row)
                row["trust_score"] = row.get("trust_score") or 70

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
    def get_supplier_connections(supplier_id: int) -> List[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return []
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                '''
                SELECT sc.id, sc.status, sc.created_at,
                       mp.company_name, mp.contact_person, mp.email, mp.city, mp.country
                FROM supplier_connections sc
                JOIN manufacturer_profiles mp ON mp.manufacturer_id = sc.manufacturer_id
                WHERE sc.supplier_id = %s
                ORDER BY sc.created_at DESC
                ''',
                (supplier_id,)
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def create_inquiry(manufacturer_id: int, supplier_id: int, subject: str, message: str) -> int:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            cursor.execute(
                '''
                INSERT INTO supplier_inquiries (manufacturer_id, supplier_id, subject, message)
                VALUES (%s, %s, %s, %s)
                ''',
                (manufacturer_id, supplier_id, subject, message)
            )
            conn.commit()
            return int(cursor.lastrowid)
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_supplier_inquiries(supplier_id: int) -> List[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return []
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                '''
                SELECT si.*, mp.company_name AS manufacturer_name
                FROM supplier_inquiries si
                JOIN manufacturer_profiles mp ON mp.manufacturer_id = si.manufacturer_id
                WHERE si.supplier_id = %s
                ORDER BY si.created_at DESC
                ''',
                (supplier_id,)
            )
            return cursor.fetchall()
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
                    json.dumps(payload.get("matched_keywords")) if payload.get("matched_keywords") else None,
                ),
            )
            conn.commit()
            return int(cursor.lastrowid)
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def list_connected_suppliers_for_risk() -> List[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return []
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                '''
                SELECT DISTINCT
                    sp.supplier_id,
                    sp.company_legal_name,
                    sp.categories
                FROM supplier_connections sc
                JOIN supplier_profiles sp ON sp.supplier_id = sc.supplier_id
                WHERE sc.status = 'active'
                '''
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def upsert_supplier_risk_input(supplier_id: int, fields: Dict[str, Any]) -> None:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            payload = {
                "delivery_delay_days": fields.get("delivery_delay_days", 0),
                "defect_rate_pct": fields.get("defect_rate_pct", 0),
                "price_variance_pct": fields.get("price_variance_pct", 0),
                "compliance_flag": fields.get("compliance_flag", 0),
                "trust_score": fields.get("trust_score", 50),
                "plastic_type": fields.get("plastic_type", "Unknown"),
                "defective_units": fields.get("defective_units", 0),
                "quantity": fields.get("quantity", 1),
                "unit_price": fields.get("unit_price", 0),
                "negotiated_price": fields.get("negotiated_price", 0),
                "compliance": fields.get("compliance", "No"),
            }
            cursor.execute(
                '''
                INSERT INTO supplier_risk_inputs
                (supplier_id, delivery_delay_days, defect_rate_pct, price_variance_pct, compliance_flag, trust_score, plastic_type, defective_units, quantity, unit_price, negotiated_price, compliance)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON DUPLICATE KEY UPDATE
                    delivery_delay_days=VALUES(delivery_delay_days),
                    defect_rate_pct=VALUES(defect_rate_pct),
                    price_variance_pct=VALUES(price_variance_pct),
                    compliance_flag=VALUES(compliance_flag),
                    trust_score=VALUES(trust_score),
                    plastic_type=VALUES(plastic_type),
                    defective_units=VALUES(defective_units),
                    quantity=VALUES(quantity),
                    unit_price=VALUES(unit_price),
                    negotiated_price=VALUES(negotiated_price),
                    compliance=VALUES(compliance)
                ''',
                (
                    supplier_id,
                    payload["delivery_delay_days"],
                    payload["defect_rate_pct"],
                    payload["price_variance_pct"],
                    payload["compliance_flag"],
                    payload["trust_score"],
                    payload["plastic_type"],
                    payload["defective_units"],
                    payload["quantity"],
                    payload["unit_price"],
                    payload["negotiated_price"],
                    payload["compliance"],
                ),
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def calculate_trust_breakdown(row: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates a breakdown of trust metrics based on delivery, quality, and verification.
        """
        delay = row.get("delivery_delay_days") or 2
        defect = row.get("defect_rate_pct") or 1.5
        vcount = row.get("verified_count") or 0
        
        # Logic for breakdown (simplified SCM proxy)
        return {
            "reliability": max(0, 100 - (delay * 10)),
            "quality": max(0, 100 - (defect * 20)),
            "response_time": 85, # Mock: real systems would track avg message reply time
            "verification": min(100, vcount * 25)
        }

    @staticmethod
    def create_rfq(manufacturer_id: int, supplier_id: int, product_name: str, quantity: int, budget_unit_price: float = None, target_delivery_date: str = None, specifications: str = None) -> int:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            cursor.execute(
                '''
                INSERT INTO rfq_requests (manufacturer_id, supplier_id, product_name, quantity, budget_unit_price, target_delivery_date, specifications)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''',
                (manufacturer_id, supplier_id, product_name, quantity, budget_unit_price, target_delivery_date, specifications)
            )
            rfq_id = int(cursor.lastrowid)
            conn.commit()
            return rfq_id
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_rfqs(user_id: int, role: str) -> List[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return []
        cursor = conn.cursor(dictionary=True)
        try:
            if role != "supplier":
                cursor.execute(
                    '''
                    SELECT r.*, COALESCE(sp.company_legal_name, u.full_name, 'Supplier') as supplier_name
                    FROM rfq_requests r
                    LEFT JOIN supplier_profiles sp ON sp.supplier_id = r.supplier_id
                    LEFT JOIN users u ON u.id = r.supplier_id
                    WHERE r.manufacturer_id = %s
                    ORDER BY r.created_at DESC
                    ''', (user_id,)
                )
            else:
                cursor.execute(
                    '''
                    SELECT r.*, COALESCE(mp.company_name, u.full_name, 'Manufacturer') as manufacturer_name
                    FROM rfq_requests r
                    LEFT JOIN manufacturer_profiles mp ON mp.manufacturer_id = r.manufacturer_id
                    LEFT JOIN users u ON u.id = r.manufacturer_id
                    WHERE r.supplier_id = %s
                    ORDER BY r.created_at DESC
                    ''', (user_id,)
                )
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def submit_quote(rfq_id: int, supplier_id: int, unit_price: float, lead_time_days: int, valid_until: str = None, terms: str = None) -> int:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            # Mark previous quotes as not current
            cursor.execute("UPDATE rfq_quotes SET is_current=FALSE WHERE rfq_id=%s AND supplier_id=%s", (rfq_id, supplier_id))
            
            # Get current version
            cursor.execute("SELECT MAX(version) as max_v FROM rfq_quotes WHERE rfq_id=%s AND supplier_id=%s", (rfq_id, supplier_id))
            row = cursor.fetchone()
            next_version = (row[0] or 0) + 1
            
            # Fetch quantity from RFQ
            cursor.execute("SELECT quantity FROM rfq_requests WHERE id=%s", (rfq_id,))
            qty_row = cursor.fetchone()
            total_amount = unit_price * (qty_row[0] if qty_row else 1)

            cursor.execute(
                '''
                INSERT INTO rfq_quotes (rfq_id, supplier_id, version, unit_price, total_amount, lead_time_days, valid_until, terms_conditions, is_current)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                ''',
                (rfq_id, supplier_id, next_version, unit_price, total_amount, lead_time_days, valid_until, terms)
            )
            quote_id = int(cursor.lastrowid)
            
            # Update RFQ status
            cursor.execute("UPDATE rfq_requests SET status='quoted' WHERE id=%s", (rfq_id,))
            
            conn.commit()
            return quote_id
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def add_rfq_message(rfq_id: int, sender_id: int, message: str, is_system: bool = False) -> int:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            raise RuntimeError("Database connection failed")
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO rfq_messages (rfq_id, sender_id, message, is_system_generated) VALUES (%s, %s, %s, %s)",
                (rfq_id, sender_id, message, is_system)
            )
            msg_id = int(cursor.lastrowid)
            
            # If not system message, and status is quoted, move to negotiating
            if not is_system:
                cursor.execute("UPDATE rfq_requests SET status='negotiating' WHERE id=%s AND status='quoted'", (rfq_id,))
            
            conn.commit()
            return msg_id
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_rfq_details(rfq_id: int) -> Optional[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return None
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                '''
                SELECT r.*, 
                       COALESCE(sp.company_legal_name, us.full_name, 'Supplier') as supplier_name,
                       COALESCE(mp.company_name, um.full_name, 'Manufacturer') as manufacturer_name
                FROM rfq_requests r
                LEFT JOIN supplier_profiles sp ON sp.supplier_id = r.supplier_id
                LEFT JOIN users us ON us.id = r.supplier_id
                LEFT JOIN manufacturer_profiles mp ON mp.manufacturer_id = r.manufacturer_id
                LEFT JOIN users um ON um.id = r.manufacturer_id
                WHERE r.id=%s
                ''', (rfq_id,)
            )
            rfq = cursor.fetchone()
            if not rfq: return None
            
            cursor.execute("SELECT * FROM rfq_quotes WHERE rfq_id=%s ORDER BY version DESC", (rfq_id,))
            rfq["quotes"] = cursor.fetchall()
            
            cursor.execute(
                '''
                SELECT m.*, u.full_name as sender_name
                FROM rfq_messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.rfq_id = %s
                ORDER BY m.created_at ASC
                ''', (rfq_id,)
            )
            rfq["messages"] = cursor.fetchall()
            
            # Enrich with supplier trust breakdown
            cursor.execute(
                '''
                SELECT sri.*, (SELECT COUNT(*) FROM supplier_certificate_verifications scv WHERE scv.supplier_id = sri.supplier_id AND scv.verified = TRUE) as verified_count
                FROM supplier_risk_inputs sri
                WHERE sri.supplier_id = %s
                ''', (rfq["supplier_id"],)
            )
            risk_row = cursor.fetchone()
            if risk_row:
                rfq["supplier_trust_breakdown"] = SupplierPortalDB.calculate_trust_breakdown(risk_row)
            else:
                rfq["supplier_trust_breakdown"] = SupplierPortalDB.calculate_trust_breakdown({})
                
            return rfq
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def create_notification(user_id: int, title: str, message: str, link: str = None, rfq_id: int = None, n_type: str = None) -> None:
        conn = SupplierPortalDB.get_connection()
        if not conn: return
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO user_notifications (user_id, title, message, link, rfq_id, type) VALUES (%s, %s, %s, %s, %s, %s)", (user_id, title, message, link, rfq_id, n_type))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def update_rfq_status(rfq_id: int, status: str) -> None:
        conn = SupplierPortalDB.get_connection()
        if not conn: return
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE rfq_requests SET status=%s WHERE id=%s", (status, rfq_id))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_supplier_risk_input(supplier_id: int) -> Optional[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return None
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM supplier_risk_inputs WHERE supplier_id=%s", (supplier_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_supplier_verifications(supplier_id: int) -> List[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return []
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT id, doc_type, file_name, verified, reason, expiry_date, template_match, document_type_valid FROM supplier_certificate_verifications WHERE supplier_id=%s ORDER BY created_at DESC",
                (supplier_id,)
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
    @staticmethod
    def get_comparison_data(manufacturer_id: int, product_name: str) -> List[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return []
        cursor = conn.cursor(dictionary=True)
        try:
            # Find all RFQs for this product by this manufacturer
            cursor.execute(
                '''
                SELECT 
                    r.id as rfq_id, r.status as rfq_status, r.quantity, r.created_at as rfq_created_at,
                    r.product_name as rfq_product_name,
                    sp.company_legal_name, sp.supplier_id,
                    q.unit_price, q.lead_time_days, q.created_at as quote_date, q.version as quote_version,
                    sri.trust_score, sri.delivery_delay_days, sri.defect_rate_pct,
                    (SELECT COUNT(*) FROM supplier_certificate_verifications scv WHERE scv.supplier_id = sp.supplier_id AND scv.verified = TRUE) as verified_count
                FROM rfq_requests r
                JOIN supplier_profiles sp ON sp.supplier_id = r.supplier_id
                LEFT JOIN rfq_quotes q ON q.rfq_id = r.id AND q.is_current = TRUE
                LEFT JOIN supplier_risk_inputs sri ON sri.supplier_id = sp.supplier_id
                WHERE r.manufacturer_id = %s AND r.product_name LIKE %s
                ORDER BY q.unit_price ASC, sri.trust_score DESC
                ''', (manufacturer_id, f"%{product_name}%")
            )
            rows = cursor.fetchall()
            for row in rows:
                if isinstance(row["rfq_created_at"], datetime): row["rfq_created_at"] = row["rfq_created_at"].isoformat()
                if row["quote_date"] and isinstance(row["quote_date"], datetime): row["quote_date"] = row["quote_date"].isoformat()
                row["trust_breakdown"] = SupplierPortalDB.calculate_trust_breakdown(row)
            return rows
        finally:
            cursor.close()
            conn.close()

from datetime import datetime
