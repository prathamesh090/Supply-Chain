import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', 'Satyam@mysql')
        self.database = os.getenv('DB_NAME', 'chainlink_pro')
        self.port = os.getenv('DB_PORT', '3306')

    def get_connection(self):
        try:
            connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=self.port
            )
            return connection
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return None

    def init_db(self):
        """Initialize database tables"""
        connection = self.get_connection()
        if connection:
            try:
                cursor = connection.cursor()
                
                # Create users table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        full_name VARCHAR(255) NOT NULL,
                        company_id VARCHAR(255),
                        role ENUM('admin', 'user') DEFAULT 'user',
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create companies table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS companies (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        company_name VARCHAR(255) NOT NULL,
                        business_type VARCHAR(100),
                        industry VARCHAR(100),
                        company_location TEXT,
                        gstin VARCHAR(20),
                        pan VARCHAR(20),
                        country_code VARCHAR(10),
                        registration_number VARCHAR(100),
                        verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                        verification_data JSON,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ''')
                
                # Create user_company mapping table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS user_company (
                        user_id INT,
                        company_id INT,
                        is_primary BOOLEAN DEFAULT FALSE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                        PRIMARY KEY (user_id, company_id)
                    )
                ''')
                
                connection.commit()
                print("Database tables created successfully")
                
            except Error as e:
                print(f"Error creating tables: {e}")
            finally:
                cursor.close()
                connection.close()

# Database instance
db = Database()