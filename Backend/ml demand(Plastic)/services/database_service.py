import mysql.connector
from mysql.connector import pooling, Error
import json
from datetime import datetime
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', 'root')
        self.database = os.getenv('DB_NAME', 'chainlink_pro')
        self.port = os.getenv('DB_PORT', '3306')
        
        # Create connection pool for better performance
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
        """Get a connection from the pool or create a new one"""
        try:
            if self.connection_pool:
                return self.connection_pool.get_connection()
            else:
                # Fallback to direct connection
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
        """Create tables if they don't exist with proper indexing"""
        conn = None
        cursor = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Create database if not exists
            try:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.database}")
            except:
                pass
            cursor.execute(f"USE {self.database}")
            
            logger.info("🔄 Creating/verifying database tables...")
            tables_created = []
            
            # Analysis sessions table
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
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_session_id (session_id),
                    INDEX idx_created_at (created_at),
                    FULLTEXT INDEX ft_file_name (file_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ''')
            tables_created.append('analysis_sessions')
            logger.info("✅ analysis_sessions table created/verified")
            
            # Predictions table with better indexing
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS predictions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(255) NOT NULL,
                    product_id VARCHAR(255),
                    product_type VARCHAR(255),
                    plastic_type VARCHAR(100),
                    sale_amount DECIMAL(15,2) DEFAULT 0,
                    discount DECIMAL(5,4) DEFAULT 0,
                    predicted_demand DECIMAL(15,2) DEFAULT 0,
                    confidence DECIMAL(5,4) DEFAULT 0,
                    input_data LONGTEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_session_id (session_id),
                    INDEX idx_product_id (product_id),
                    INDEX idx_created_at (created_at),
                    INDEX idx_demand (predicted_demand),
                    FOREIGN KEY (session_id) 
                        REFERENCES analysis_sessions(session_id)
                        ON DELETE CASCADE ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ''')
            tables_created.append('predictions')
            logger.info("✅ predictions table created/verified")
            
            # Explanations table with better indexing
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS explanations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(255) NOT NULL,
                    product_id VARCHAR(255),
                    product_type VARCHAR(255),
                    manufacturing_insights LONGTEXT,
                    supply_recommendations LONGTEXT,
                    demand_indicators LONGTEXT,
                    risk_assessment LONGTEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_session_id (session_id),
                    INDEX idx_product_id (product_id),
                    INDEX idx_created_at (created_at),
                    FOREIGN KEY (session_id) 
                        REFERENCES analysis_sessions(session_id)
                        ON DELETE CASCADE ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ''')
            tables_created.append('explanations')
            logger.info("✅ explanations table created/verified")
            
            conn.commit()
            logger.info(f"✅ All tables verified/created: {', '.join(tables_created)}")
            return True
            
        except Error as e:
            logger.error(f"❌ Error creating tables: {e}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            return False
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def save_analysis_session(self, session_data):
        """Save analysis session with proper error handling"""
        conn = None
        cursor = None
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            logger.info(f"💾 Saving analysis session: {session_data['session_id']}")
            
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
                session_data.get('file_name', 'unknown'),
                session_data.get('total_products', 0),
                session_data.get('total_predictions', 0),
                float(session_data.get('avg_demand', 0)),
                float(session_data.get('avg_confidence', 0))
            ))
            
            conn.commit()
            logger.info(f"✅ Session saved successfully: {session_data['session_id']}")
            return True

        except Error as e:
            logger.error(f"❌ Error saving analysis session: {e}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            return False
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def save_predictions(self, session_id, predictions):
        """Save predictions with proper batch handling"""
        conn = None
        cursor = None
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            logger.info(f"💾 Saving {len(predictions)} predictions for session: {session_id}")
            
            # Delete existing predictions for this session
            cursor.execute('DELETE FROM predictions WHERE session_id = %s', (session_id,))
            
            # Batch insert predictions
            for pred in predictions:
                input_data_json = json.dumps(pred.get('input_data', {}))
                
                cursor.execute('''
                    INSERT INTO predictions 
                    (session_id, product_id, product_type, plastic_type,
                     sale_amount, discount, predicted_demand, 
                     confidence, input_data)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    session_id,
                    pred.get('product_id', 'N/A'),
                    pred.get('product_type', 'N/A'),
                    pred.get('plastic_type', 'N/A'),
                    float(pred.get('sale_amount', 0)),
                    float(pred.get('discount', 0)),
                    float(pred.get('predicted_demand', 0)),
                    float(pred.get('confidence', 0)),
                    input_data_json
                ))
            
            conn.commit()
            logger.info(f"✅ {len(predictions)} predictions saved successfully")
            return True

        except Error as e:
            logger.error(f"❌ Error saving predictions: {e}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            return False
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def save_explanations(self, session_id, explanations):
        """Save explanations with proper error handling"""
        conn = None
        cursor = None
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            logger.info(f"💾 Saving {len(explanations)} explanations for session: {session_id}")
            
            # Delete existing explanations for this session
            cursor.execute('DELETE FROM explanations WHERE session_id = %s', (session_id,))
            
            # Batch insert explanations
            for exp in explanations:
                mi_json = json.dumps(exp.get('manufacturing_insights', []))
                sr_json = json.dumps(exp.get('supply_recommendations', []))
                di_json = json.dumps(exp.get('demand_indicators', []))
                ra_json = json.dumps(exp.get('risk_assessment', {}))
                
                cursor.execute('''
                    INSERT INTO explanations 
                    (session_id, product_id, product_type,
                     manufacturing_insights, supply_recommendations,
                     demand_indicators, risk_assessment)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''', (
                    session_id,
                    exp.get('product_id', 'N/A'),
                    exp.get('product_type', 'N/A'),
                    mi_json,
                    sr_json,
                    di_json,
                    ra_json
                ))
            
            conn.commit()
            logger.info(f"✅ {len(explanations)} explanations saved successfully")
            return True

        except Error as e:
            logger.error(f"❌ Error saving explanations: {e}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            return False
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_recent_sessions(self, limit=10):
        """Get recent prediction sessions with better query"""
        connection = None
        cursor = None
        
        try:
            connection = self.get_connection()
            cursor = connection.cursor(dictionary=True, buffered=True)
            
            cursor.execute('''
                SELECT 
                    session_id,
                    file_name,
                    created_at,
                    total_predictions AS prediction_count,
                    total_products,
                    avg_demand,
                    avg_confidence
                FROM analysis_sessions 
                ORDER BY created_at DESC 
                LIMIT %s
            ''', (limit,))
            
            sessions = cursor.fetchall()
            
            # Format dates
            for session in sessions:
                if session.get('created_at'):
                    session['created_at'] = session['created_at'].isoformat()
            
            logger.info(f"✅ Retrieved {len(sessions)} recent sessions")
            return sessions

        except Error as e:
            logger.error(f"❌ Error getting sessions: {e}")
            return []
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def get_latest_session_for_product(self, product_id):
        """Get the latest forecast for a specific product"""
        connection = None
        cursor = None
        
        try:
            connection = self.get_connection()
            cursor = connection.cursor(dictionary=True, buffered=True)
            
            # Get latest prediction for product
            cursor.execute('''
                SELECT 
                    p.id,
                    p.session_id,
                    p.product_id,
                    p.product_type,
                    p.plastic_type,
                    p.predicted_demand,
                    p.confidence,
                    p.created_at,
                    s.file_name,
                    s.created_at as session_created_at
                FROM predictions p
                JOIN analysis_sessions s ON p.session_id = s.session_id
                WHERE p.product_id = %s
                ORDER BY p.created_at DESC
                LIMIT 1
            ''', (product_id,))
            
            result = cursor.fetchone()
            
            if result:
                result['created_at'] = result['created_at'].isoformat() if result['created_at'] else None
                result['session_created_at'] = result['session_created_at'].isoformat() if result['session_created_at'] else None
                logger.info(f"✅ Found latest forecast for product {product_id}")
            else:
                logger.info(f"ℹ️ No forecast found for product {product_id}")
            
            return result

        except Error as e:
            logger.error(f"❌ Error getting latest forecast: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def get_session(self, session_id):
        """Get complete session with all data"""
        connection = None
        cursor = None
        
        try:
            connection = self.get_connection()
            cursor = connection.cursor(dictionary=True, buffered=True)
            
            logger.info(f"🔍 Fetching session: {session_id}")
            
            # Get session info
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
                logger.warning(f"⚠️ Session not found: {session_id}")
                return None
            
            if session.get('created_at'):
                session['created_at'] = session['created_at'].isoformat()
            
            # Get predictions
            cursor.execute('''
                SELECT 
                    id,
                    session_id,
                    product_id,
                    product_type,
                    plastic_type,
                    sale_amount,
                    discount,
                    predicted_demand AS prediction,
                    confidence,
                    input_data,
                    created_at
                FROM predictions 
                WHERE session_id = %s
                ORDER BY created_at DESC
            ''', (session_id,))
            
            predictions = cursor.fetchall()
            
            # Parse JSON fields
            for pred in predictions:
                if pred.get('input_data'):
                    try:
                        pred['input_data'] = json.loads(pred['input_data'])
                    except:
                        pred['input_data'] = {}
                if pred.get('created_at'):
                    pred['created_at'] = pred['created_at'].isoformat()
            
            # Get explanations
            cursor.execute('''
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
                ORDER BY created_at DESC
            ''', (session_id,))
            
            explanations_data = cursor.fetchall()
            
            # Parse JSON fields
            explanations = []
            for exp in explanations_data:
                parsed_exp = {
                    "product_id": exp.get("product_id"),
                    "product_type": exp.get("product_type"),
                    "manufacturing_insights": [],
                    "supply_recommendations": [],
                    "demand_indicators": [],
                    "risk_assessment": {}
                }
                
                # Parse manufacturing_insights
                if exp.get('manufacturing_insights'):
                    try:
                        parsed_exp['manufacturing_insights'] = json.loads(exp['manufacturing_insights'])
                    except:
                        parsed_exp['manufacturing_insights'] = []
                
                # Parse supply_recommendations
                if exp.get('supply_recommendations'):
                    try:
                        parsed_exp['supply_recommendations'] = json.loads(exp['supply_recommendations'])
                    except:
                        parsed_exp['supply_recommendations'] = []
                
                # Parse demand_indicators
                if exp.get('demand_indicators'):
                    try:
                        parsed_exp['demand_indicators'] = json.loads(exp['demand_indicators'])
                    except:
                        parsed_exp['demand_indicators'] = []
                
                # Parse risk_assessment
                if exp.get('risk_assessment'):
                    try:
                        parsed_exp['risk_assessment'] = json.loads(exp['risk_assessment'])
                    except:
                        parsed_exp['risk_assessment'] = {}
                
                explanations.append(parsed_exp)
            
            logger.info(f"✅ Session loaded with {len(predictions)} predictions and {len(explanations)} explanations")
            
            return {
                "session": session,
                "predictions": predictions,
                "explanations": explanations
            }

        except Error as e:
            logger.error(f"❌ Error getting session: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def delete_session(self, session_id):
        """Delete session and all related data"""
        connection = None
        cursor = None
        
        try:
            connection = self.get_connection()
            cursor = connection.cursor()
            
            logger.info(f"🗑️ Deleting session: {session_id}")
            
            # Delete cascades automatically due to FK constraint
            cursor.execute('DELETE FROM analysis_sessions WHERE session_id = %s', (session_id,))
            
            connection.commit()
            logger.info(f"✅ Session deleted successfully: {session_id}")
            return True

        except Error as e:
            logger.error(f"❌ Error deleting session: {e}")
            if connection:
                try:
                    connection.rollback()
                except:
                    pass
            return False
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()


# Initialize database service
db_service = DatabaseService()
db_service.create_tables()
