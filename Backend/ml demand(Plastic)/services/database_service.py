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

    def get_recent_sessions(self, limit=10):
        """Fetch recent analysis sessions with summary metrics."""
        conn = None
        cursor = None
        sessions = []

        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                '''
                SELECT
                    session_id,
                    file_name,
                    total_products,
                    total_predictions AS prediction_count,
                    avg_demand,
                    avg_confidence,
                    created_at,
                    updated_at
                FROM analysis_sessions
                ORDER BY created_at DESC
                LIMIT %s
                ''',
                (max(1, int(limit)),)
            )
            sessions = cursor.fetchall() or []
            return sessions
        except Error as e:
            logger.error(f"❌ Error fetching recent sessions: {e}")
            return []
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_session(self, session_id):
        """Fetch a session with all associated predictions and explanations."""
        conn = None
        cursor = None

        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                '''
                SELECT
                    session_id,
                    file_name,
                    total_products,
                    total_predictions AS prediction_count,
                    avg_demand,
                    avg_confidence,
                    created_at,
                    updated_at
                FROM analysis_sessions
                WHERE session_id = %s
                ''',
                (session_id,)
            )
            session_row = cursor.fetchone()
            if not session_row:
                return None

            cursor.execute(
                '''
                SELECT
                    id,
                    product_id,
                    product_type,
                    plastic_type,
                    sale_amount,
                    discount,
                    predicted_demand,
                    confidence,
                    input_data,
                    created_at
                FROM predictions
                WHERE session_id = %s
                ORDER BY id ASC
                ''',
                (session_id,)
            )
            predictions = cursor.fetchall() or []

            for pred in predictions:
                raw_input = pred.get('input_data')
                if isinstance(raw_input, str):
                    try:
                        pred['input_data'] = json.loads(raw_input)
                    except json.JSONDecodeError:
                        pred['input_data'] = {}
                pred['prediction'] = float(pred.get('predicted_demand') or 0)

            cursor.execute(
                '''
                SELECT
                    id,
                    product_id,
                    product_type,
                    manufacturing_insights,
                    supply_recommendations,
                    demand_indicators,
                    risk_assessment,
                    created_at
                FROM explanations
                WHERE session_id = %s
                ORDER BY id ASC
                ''',
                (session_id,)
            )
            explanations = cursor.fetchall() or []

            for exp in explanations:
                for json_col, fallback in (
                    ('manufacturing_insights', []),
                    ('supply_recommendations', []),
                    ('demand_indicators', []),
                    ('risk_assessment', {}),
                ):
                    raw_val = exp.get(json_col)
                    if isinstance(raw_val, str):
                        try:
                            exp[json_col] = json.loads(raw_val)
                        except json.JSONDecodeError:
                            exp[json_col] = fallback

            session_row['predictions'] = predictions
            session_row['explanations'] = explanations
            return session_row
        except Error as e:
            logger.error(f"❌ Error fetching session {session_id}: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def delete_session(self, session_id):
        """Delete a saved analysis session and all dependent records."""
        conn = None
        cursor = None

        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM analysis_sessions WHERE session_id = %s",
                (session_id,)
            )
            conn.commit()
            return True
        except Error as e:
            logger.error(f"❌ Error deleting session {session_id}: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_latest_session_for_product(self, product_id):
        """Fetch most recent forecast row for a product with session metadata."""
        conn = None
        cursor = None

        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                '''
                SELECT
                    p.product_id,
                    p.product_type,
                    p.plastic_type,
                    p.predicted_demand,
                    p.confidence,
                    p.created_at,
                    p.session_id,
                    s.file_name,
                    s.created_at AS session_created_at
                FROM predictions p
                INNER JOIN analysis_sessions s
                    ON p.session_id = s.session_id
                WHERE p.product_id = %s
                ORDER BY p.created_at DESC, p.id DESC
                LIMIT 1
                ''',
                (product_id,)
            )
            return cursor.fetchone()
        except Error as e:
            logger.error(f"❌ Error fetching latest forecast for product {product_id}: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()


db_service = DatabaseService()
db_service.create_tables()
