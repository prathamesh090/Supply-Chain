import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'chainlink_pro')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key')
    ALGORITHM = os.getenv('ALGORITHM', 'HS256')
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))
    
    GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')

settings = Settings()
