import mysql.connector
from mysql.connector import pooling, Error
import json
from datetime import datetime
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseService:
    def __init__(self):

        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', 'Satyam@mysql')
        self.database = os.getenv('DB_NAME', 'chainlink_pro')
        self.port = os.getenv('DB_PORT', '3306')

        try:
            self.connection_pool = pooling.MySQLConnectionPool(
                pool_name="ml_pool",
                pool_size=5,
                pool_reset_session=True,
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=int(self.port),
                autocommit=False
            )
            logger.info("✅ Database connection pool created successfully")

        except Error as e:
            logger.error(f"❌ Error creating connection pool: {e}")
            self.connection_pool = None


    def get_connection(self):
        """Get connection from pool"""

        try:
            if self.connection_pool:
                return self.connection_pool.get_connection()

            return mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=int(self.port),
                autocommit=False
            )

        except Error as e:
            logger.error(f"❌ Connection failed: {e}")
            raise


    def create_tables(self):

        conn = None
        cursor = None

        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.database}")
            cursor.execute(f"USE {self.database}")

            logger.info("🔄 Creating/verifying tables...")

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS analysis_sessions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(255) UNIQUE NOT NULL,
                    file_name VARCHAR(500),
                    total_products INT DEFAULT 0,
                    total_predictions INT DEFAULT 0,
                    avg_demand DECIMAL(15,2) DEFAULT 0,
                    avg_confidence DECIMAL(5,4) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
                        ON UPDATE CURRENT_TIMESTAMP
                )
            ''')

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS predictions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(255),
                    product_id VARCHAR(255),
                    product_type VARCHAR(255),
                    plastic_type VARCHAR(100),
                    sale_amount DECIMAL(15,2),
                    discount DECIMAL(5,4),
                    predicted_demand DECIMAL(15,2),
                    confidence DECIMAL(5,4),
                    input_data LONGTEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id)
                    REFERENCES analysis_sessions(session_id)
                    ON DELETE CASCADE
                )
            ''')

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS explanations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(255),
                    product_id VARCHAR(255),
                    product_type VARCHAR(255),
                    manufacturing_insights LONGTEXT,
                    supply_recommendations LONGTEXT,
                    demand_indicators LONGTEXT,
                    risk_assessment LONGTEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id)
                    REFERENCES analysis_sessions(session_id)
                    ON DELETE CASCADE
                )
            ''')

            conn.commit()

            logger.info("✅ Tables created/verified successfully")
            return True

        except Error as e:
            logger.error(f"❌ Table creation failed: {e}")
            if conn:
                conn.rollback()
            return False

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()


    def save_analysis_session(self, session_data):

        conn = None
        cursor = None

        try:

            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute('''
                INSERT INTO analysis_sessions
                (session_id, file_name, total_products,
                 total_predictions, avg_demand, avg_confidence)
                VALUES (%s,%s,%s,%s,%s,%s)
                ON DUPLICATE KEY UPDATE
                file_name = VALUES(file_name),
                total_products = VALUES(total_products),
                total_predictions = VALUES(total_predictions),
                avg_demand = VALUES(avg_demand),
                avg_confidence = VALUES(avg_confidence)
            ''', (

                session_data['session_id'],
                session_data.get('file_name', 'unknown'),
                session_data.get('total_products', 0),
                session_data.get('total_predictions', 0),
                float(session_data.get('avg_demand', 0)),
                float(session_data.get('avg_confidence', 0))

            ))

            conn.commit()

            logger.info("✅ Session saved")
            return True

        except Error as e:

            logger.error(f"❌ Error saving session: {e}")

            if conn:
                conn.rollback()

            return False

        finally:

            if cursor:
                cursor.close()

            if conn:
                conn.close()


    def save_predictions(self, session_id, predictions):

        conn = None
        cursor = None

        try:

            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute(
                "DELETE FROM predictions WHERE session_id=%s",
                (session_id,)
            )

            for pred in predictions:

                cursor.execute('''
                    INSERT INTO predictions
                    (session_id, product_id, product_type,
                     plastic_type, sale_amount, discount,
                     predicted_demand, confidence, input_data)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ''', (

                    session_id,
                    pred.get("product_id"),
                    pred.get("product_type"),
                    pred.get("plastic_type"),
                    float(pred.get("sale_amount", 0)),
                    float(pred.get("discount", 0)),
                    float(pred.get("predicted_demand", 0)),
                    float(pred.get("confidence", 0)),
                    json.dumps(pred.get("input_data", {}))
                ))

            conn.commit()

            logger.info("✅ Predictions saved")
            return True

        except Error as e:

            logger.error(f"❌ Error saving predictions: {e}")

            if conn:
                conn.rollback()

            return False

        finally:

            if cursor:
                cursor.close()

            if conn:
                conn.close()


    def save_explanations(self, session_id, explanations):

        conn = None
        cursor = None

        try:

            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute(
                "DELETE FROM explanations WHERE session_id=%s",
                (session_id,)
            )

            for exp in explanations:

                cursor.execute('''
                    INSERT INTO explanations
                    (session_id, product_id, product_type,
                     manufacturing_insights,
                     supply_recommendations,
                     demand_indicators,
                     risk_assessment)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                ''', (

                    session_id,
                    exp.get("product_id"),
                    exp.get("product_type"),
                    json.dumps(exp.get("manufacturing_insights", [])),
                    json.dumps(exp.get("supply_recommendations", [])),
                    json.dumps(exp.get("demand_indicators", [])),
                    json.dumps(exp.get("risk_assessment", {}))
                ))

            conn.commit()

            logger.info("✅ Explanations saved")
            return True

        except Error as e:

            logger.error(f"❌ Error saving explanations: {e}")

            if conn:
                conn.rollback()

            return False

        finally:

            if cursor:
                cursor.close()

            if conn:
                conn.close()


db_service = DatabaseService()
db_service.create_tables()