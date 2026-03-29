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
                    self._safe_float(pred.get("sale_amount", 0)),
                    self._safe_float(pred.get("discount", 0)),
                    self._safe_float(pred.get("predicted_demand", 0)),
                    self._safe_float(pred.get("confidence", 0.5), default=0.5),
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
        """Return latest saved analysis sessions for history dashboard."""
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
                    created_at,
                    updated_at,
                    total_products,
                    total_predictions AS prediction_count,
                    avg_demand,
                    avg_confidence
                FROM analysis_sessions
                ORDER BY created_at DESC
                LIMIT %s
                ''',
                (int(limit),)
            )

            sessions = cursor.fetchall() or []
            return [self._serialize_row(session) for session in sessions]

        except Error as e:
            logger.error(f"❌ Error fetching recent sessions: {e}")
            return []

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_session(self, session_id):
        """Return one session with associated predictions and explanations."""
        conn = None
        session_cursor = None
        prediction_cursor = None
        explanation_cursor = None

        try:
            conn = self.get_connection()

            session_cursor = conn.cursor(dictionary=True)
            session_cursor.execute(
                '''
                SELECT
                    session_id,
                    file_name,
                    created_at,
                    updated_at,
                    total_products,
                    total_predictions AS prediction_count,
                    avg_demand,
                    avg_confidence
                FROM analysis_sessions
                WHERE session_id = %s
                ''',
                (session_id,)
            )
            session = session_cursor.fetchone()
            if not session:
                return None

            prediction_cursor = conn.cursor(dictionary=True)
            prediction_cursor.execute(
                '''
                SELECT
                    id,
                    session_id,
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
            predictions = prediction_cursor.fetchall() or []

            explanation_cursor = conn.cursor(dictionary=True)
            explanation_cursor.execute(
                '''
                SELECT
                    id,
                    session_id,
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
            explanations = explanation_cursor.fetchall() or []

            parsed_predictions = [self._parse_prediction_row(row) for row in predictions]
            parsed_explanations = [self._parse_explanation_row(row) for row in explanations]

            session_payload = self._serialize_row(session)
            session_payload["predictions"] = parsed_predictions
            session_payload["explanations"] = parsed_explanations
            return session_payload

        except Error as e:
            logger.error(f"❌ Error fetching session {session_id}: {e}")
            return None

        finally:
            if explanation_cursor:
                explanation_cursor.close()
            if prediction_cursor:
                prediction_cursor.close()
            if session_cursor:
                session_cursor.close()
            if conn:
                conn.close()

    def delete_session(self, session_id):
        """Delete a saved analysis session and all dependent rows."""
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
        """Get the most recent saved prediction for a product."""
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
                JOIN analysis_sessions s
                    ON s.session_id = p.session_id
                WHERE p.product_id = %s
                ORDER BY p.created_at DESC, p.id DESC
                LIMIT 1
                ''',
                (product_id,)
            )
            row = cursor.fetchone()
            return self._serialize_row(row) if row else None
        except Error as e:
            logger.error(f"❌ Error fetching latest forecast for {product_id}: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    @staticmethod
    def _safe_float(value, default=0.0):
        try:
            if value is None or value == "":
                return float(default)
            return float(value)
        except (TypeError, ValueError):
            return float(default)

    @staticmethod
    def _parse_json_maybe(value, fallback):
        if value is None:
            return fallback
        if isinstance(value, (dict, list)):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return fallback
        return fallback

    def _parse_prediction_row(self, row):
        parsed = self._serialize_row(row)
        parsed["input_data"] = self._parse_json_maybe(parsed.get("input_data"), {})
        parsed["sale_amount"] = self._safe_float(parsed.get("sale_amount"), default=0)
        parsed["discount"] = self._safe_float(parsed.get("discount"), default=0)
        parsed["predicted_demand"] = self._safe_float(parsed.get("predicted_demand"), default=0)
        parsed["confidence"] = self._safe_float(parsed.get("confidence"), default=0.5)
        return parsed

    def _parse_explanation_row(self, row):
        parsed = self._serialize_row(row)
        parsed["manufacturing_insights"] = self._parse_json_maybe(
            parsed.get("manufacturing_insights"), []
        )
        parsed["supply_recommendations"] = self._parse_json_maybe(
            parsed.get("supply_recommendations"), []
        )
        parsed["demand_indicators"] = self._parse_json_maybe(
            parsed.get("demand_indicators"), []
        )
        parsed["risk_assessment"] = self._parse_json_maybe(
            parsed.get("risk_assessment"), {}
        )
        return parsed

    @staticmethod
    def _serialize_row(row):
        if not row:
            return row
        serialized = {}
        for key, value in row.items():
            if isinstance(value, datetime):
                serialized[key] = value.isoformat()
            else:
                serialized[key] = value
        return serialized


db_service = DatabaseService()
db_service.create_tables()
