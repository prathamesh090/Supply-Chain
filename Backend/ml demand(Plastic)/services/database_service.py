import mysql.connector
import json
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseService:
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', 'root')
        self.database = os.getenv('DB_NAME', 'chainlink_pro')
        self.port = os.getenv('DB_PORT', '3306')

    def get_connection(self):
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
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS analysis_sessions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(255) UNIQUE,
                    file_name VARCHAR(255),
                    total_products INT,
                    total_predictions INT,
                    avg_demand DECIMAL(10,2),
                    avg_confidence DECIMAL(5,4),
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
                    sale_amount DECIMAL(10,2),
                    discount DECIMAL(5,4),
                    predicted_demand DECIMAL(10,2),
                    confidence DECIMAL(5,4),
                    input_data JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX session_idx (session_id),
                    INDEX product_idx (product_id),
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
                    manufacturing_insights JSON,
                    supply_recommendations JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX session_idx (session_id),
                    INDEX product_idx (product_id),
                    FOREIGN KEY (session_id) 
                        REFERENCES analysis_sessions(session_id)
                        ON DELETE CASCADE
                )
            ''')

            conn.commit()
            print("✅ Database tables created successfully in chainlink_pro")

        except Exception as e:
            print(f"❌ Error creating tables: {e}")
        finally:
            cursor.close()
            conn.close()

    def save_analysis_session(self, session_data):
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute('''
                INSERT INTO analysis_sessions 
                (session_id, file_name, total_products, 
                 total_predictions, avg_demand, avg_confidence)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                file_name = VALUES(file_name),
                total_products = VALUES(total_products),
                total_predictions = VALUES(total_predictions),
                avg_demand = VALUES(avg_demand),
                avg_confidence = VALUES(avg_confidence),
                updated_at = CURRENT_TIMESTAMP
            ''', (
                session_data['session_id'],
                session_data['file_name'],
                session_data['total_products'],
                session_data['total_predictions'],
                session_data['avg_demand'],
                session_data['avg_confidence']
            ))

            conn.commit()
            return True

        except Exception as e:
            print(f"❌ Error saving analysis session: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def save_predictions(self, session_id, predictions):
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                'DELETE FROM predictions WHERE session_id = %s',
                (session_id,)
            )

            for pred in predictions:
                cursor.execute('''
                    INSERT INTO predictions 
                    (session_id, product_id, product_type, plastic_type,
                     sale_amount, discount, predicted_demand, 
                     confidence, input_data)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    session_id,
                    pred.get('product_id'),
                    pred.get('product_type'),
                    pred.get('plastic_type'),
                    pred.get('sale_amount', 0),
                    pred.get('discount', 0),
                    pred.get('predicted_demand', 0),
                    pred.get('confidence', 0),
                    json.dumps(pred.get('input_data', {}))
                ))

            conn.commit()
            return True

        except Exception as e:
            print(f"❌ Error saving predictions: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def save_explanations(self, session_id, explanations):
        conn = self.get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                'DELETE FROM explanations WHERE session_id = %s',
                (session_id,)
            )

            for exp in explanations:
                cursor.execute('''
                    INSERT INTO explanations 
                    (session_id, product_id, product_type,
                     manufacturing_insights, supply_recommendations)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (
                    session_id,
                    exp.get('product_id'),
                    exp.get('product_type'),
                    json.dumps(exp.get('manufacturing_insights', [])),
                    json.dumps(exp.get('supply_recommendations', []))
                ))

            conn.commit()
            return True

        except Exception as e:
            print(f"❌ Error saving explanations: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    # ================= UPDATED METHOD =================

    def get_recent_sessions(self, limit=10):
        """Get recent prediction sessions"""
        connection = self.get_connection()
        if not connection:
            return []

        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute('''
                SELECT 
                    session_id,
                    file_name,
                    created_at,
                    total_predictions AS prediction_count,
                    total_products,
                    avg_demand
                FROM analysis_sessions 
                ORDER BY created_at DESC 
                LIMIT %s
            ''', (limit,))

            sessions = cursor.fetchall()

            for session in sessions:
                if session.get('created_at'):
                    session['created_at'] = session['created_at'].isoformat()

            return sessions

        except Exception as e:
            print(f"❌ Error getting sessions: {e}")
            return []
        finally:
            cursor.close()
            connection.close()

    # ================= UPDATED METHOD =================

    def get_session(self, session_id):
        """Get session with all data"""
        connection = self.get_connection()
        if not connection:
            return None

        try:
            cursor = connection.cursor(dictionary=True)

            cursor.execute('''
                SELECT 
                    session_id,
                    file_name,
                    created_at,
                    total_predictions,
                    total_products,
                    avg_demand,
                    avg_confidence
                FROM analysis_sessions 
                WHERE session_id = %s
            ''', (session_id,))

            session = cursor.fetchone()
            if not session:
                return None

            if session.get('created_at'):
                session['created_at'] = session['created_at'].isoformat()

            cursor.execute('''
                SELECT 
                    id,
                    session_id,
                    product_id,
                    product_type,
                    plastic_type AS Plastic_Type,
                    sale_amount,
                    discount,
                    predicted_demand AS prediction,
                    confidence,
                    input_data
                FROM predictions 
                WHERE session_id = %s
            ''', (session_id,))
            predictions = cursor.fetchall()

            for pred in predictions:
                if isinstance(pred.get('input_data'), str):
                    try:
                        pred['input_data'] = json.loads(pred['input_data'])
                    except:
                        pred['input_data'] = {}

            cursor.execute('''
                SELECT 
                    id,
                    session_id,
                    product_id,
                    product_type,
                    manufacturing_insights,
                    supply_recommendations
                FROM explanations 
                WHERE session_id = %s
            ''', (session_id,))
            explanations_data = cursor.fetchall()

            explanations = []
            for exp in explanations_data:
                mi = exp.get('manufacturing_insights', [])
                sr = exp.get('supply_recommendations', [])

                if isinstance(mi, str):
                    try:
                        mi = json.loads(mi)
                    except:
                        mi = []

                if isinstance(sr, str):
                    try:
                        sr = json.loads(sr)
                    except:
                        sr = []

                explanations.append({
                    "product_id": exp.get("product_id"),
                    "product_type": exp.get("product_type"),
                    "manufacturing_insights": mi,
                    "supply_recommendations": sr
                })

            return {
                "session": session,
                "predictions": predictions,
                "explanations": explanations
            }

        except Exception as e:
            print(f"❌ Error getting session: {e}")
            return None
        finally:
            cursor.close()
            connection.close()


# Initialize database tables
db_service = DatabaseService()
db_service.create_tables()
