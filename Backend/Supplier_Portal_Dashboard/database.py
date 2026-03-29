import mysql.connector
from mysql.connector import Error
from typing import Optional, List, Dict, Any
from .config import settings
import logging

logger = logging.getLogger(__name__)

class SupplierPortalDB:
    
    @staticmethod
    def get_connection():
        try:
            conn = mysql.connector.connect(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                database=settings.DB_NAME
            )
            return conn
        except Error as e:
            logger.error(f"Database connection error: {e}")
            return None
    
    # Auth Operations
    @staticmethod
    def create_supplier_auth(supplier_id: int, email: str, password_hash: str) -> bool:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            query = "INSERT INTO supplier_auth (supplier_id, email, password_hash) VALUES (%s, %s, %s)"
            cursor.execute(query, (supplier_id, email, password_hash))
            conn.commit()
            cursor.close()
            return True
        except Error as e:
            logger.error(f"Error creating auth: {e}")
            return False
        finally:
            conn.close()
    
    @staticmethod
    def get_supplier_auth(email: str) -> Optional[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM supplier_auth WHERE email = %s"
            cursor.execute(query, (email,))
            result = cursor.fetchone()
            cursor.close()
            return result
        except Error as e:
            logger.error(f"Error getting auth: {e}")
            return None
        finally:
            conn.close()
    
    @staticmethod
    def supplier_exists(email: str) -> bool:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            query = "SELECT id FROM supplier_auth WHERE email = %s"
            cursor.execute(query, (email,))
            result = cursor.fetchone()
            cursor.close()
            return result is not None
        except Error:
            return False
        finally:
            conn.close()
    
    @staticmethod
    def update_password(supplier_id: int, password_hash: str) -> bool:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            query = "UPDATE supplier_auth SET password_hash = %s WHERE supplier_id = %s"
            cursor.execute(query, (password_hash, supplier_id))
            conn.commit()
            cursor.close()
            return True
        except Error as e:
            logger.error(f"Error updating password: {e}")
            return False
        finally:
            conn.close()
    
    @staticmethod
    def update_last_login(supplier_id: int) -> bool:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            query = "UPDATE supplier_auth SET last_login = CURRENT_TIMESTAMP WHERE supplier_id = %s"
            cursor.execute(query, (supplier_id,))
            conn.commit()
            cursor.close()
            return True
        except Error as e:
            logger.error(f"Error updating last login: {e}")
            return False
        finally:
            conn.close()
    
    # Profile Operations
    @staticmethod
    def get_profile(supplier_id: int) -> Optional[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM supplier_profiles WHERE supplier_id = %s"
            cursor.execute(query, (supplier_id,))
            result = cursor.fetchone()
            cursor.close()
            return result
        except Error as e:
            logger.error(f"Error getting profile: {e}")
            return None
        finally:
            conn.close()
    
    @staticmethod
    def create_profile(supplier_id: int) -> bool:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            query = "INSERT INTO supplier_profiles (supplier_id) VALUES (%s)"
            cursor.execute(query, (supplier_id,))
            conn.commit()
            cursor.close()
            return True
        except Error as e:
            logger.error(f"Error creating profile: {e}")
            return False
        finally:
            conn.close()
    
    @staticmethod
    def update_profile(supplier_id: int, profile_data: Dict[str, Any]) -> bool:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return False
        
        try:
            import json
            cursor = conn.cursor()
            
            # Sanitize profile_data payload from React
            sanitized_data = {}
            for key, v in profile_data.items():
                if v == "":
                    sanitized_data[key] = None
                elif isinstance(v, (list, dict)):
                    sanitized_data[key] = json.dumps(v)
                else:
                    sanitized_data[key] = v
                    
            fields = [f"{key} = %s" for key in sanitized_data.keys()]
            values = list(sanitized_data.values())
            values.append(supplier_id)
            
            query = f"UPDATE supplier_profiles SET {', '.join(fields)} WHERE supplier_id = %s"
            cursor.execute(query, values)
            conn.commit()
            cursor.close()
            return True
        except Error as e:
            logger.error(f"Error updating profile: {e}")
            return False
        finally:
            conn.close()
    
    # Product Operations
    @staticmethod
    def get_products(supplier_id: int) -> List[Dict[str, Any]]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT * FROM supplier_pricing WHERE supplier_id = %s"
            cursor.execute(query, (supplier_id,))
            results = cursor.fetchall()
            cursor.close()
            return results
        except Error as e:
            logger.error(f"Error getting products: {e}")
            return []
        finally:
            conn.close()
    
    @staticmethod
    def add_product(supplier_id: int, product_data: Dict[str, Any]) -> Optional[int]:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor()
            query = """
                INSERT INTO supplier_pricing
                (supplier_id, plastic_type, grade, product_name, application, category, price_per_unit, bulk_discount_percent)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                supplier_id,
                product_data['plastic_type'],
                product_data['grade'],
                product_data.get('product_name'),
                product_data.get('application'),
                product_data.get('category'),
                product_data['price_per_unit'],
                product_data.get('bulk_discount_percent', 0)
            ))
            conn.commit()
            product_id = cursor.lastrowid
            cursor.close()
            return product_id
        except Error as e:
            logger.error(f"Error adding product: {e}")
            return None
        finally:
            conn.close()
    
    @staticmethod
    def update_product(product_id: int, product_data: Dict[str, Any]) -> bool:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            query = "UPDATE supplier_pricing SET price_per_unit = %s, bulk_discount_percent = %s WHERE id = %s"
            cursor.execute(query, (
                product_data['price_per_unit'],
                product_data.get('bulk_discount_percent', 0),
                product_id
            ))
            conn.commit()
            cursor.close()
            return True
        except Error as e:
            logger.error(f"Error updating product: {e}")
            return False
        finally:
            conn.close()
    
    @staticmethod
    def delete_product(product_id: int) -> bool:
        conn = SupplierPortalDB.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            query = "DELETE FROM supplier_pricing WHERE id = %s"
            cursor.execute(query, (product_id,))
            conn.commit()
            cursor.close()
            return True
        except Error as e:
            logger.error(f"Error deleting product: {e}")
            return False
        finally:
            conn.close()
