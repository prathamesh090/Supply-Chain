import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    DB_HOST: str = os.getenv('DB_HOST', 'localhost')
    DB_USER: str = os.getenv('DB_USER', 'root')
    DB_PASSWORD: str = os.getenv('DB_PASSWORD', '')
    DB_NAME: str = os.getenv('DB_NAME', 'chainlink_pro')
    DB_PORT: int = int(os.getenv('DB_PORT', 3306))

    SECRET_KEY: str = os.getenv('SECRET_KEY', 'your-secret-key')
    ALGORITHM: str = os.getenv('ALGORITHM', 'HS256')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440'))

    GROQ_API_KEY: str = os.getenv('GROQ_API_KEY', '').strip()
    GROQ_MODEL: str = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')


settings = Settings()


def ensure_groq_configured() -> None:
    if not settings.GROQ_API_KEY:
        raise RuntimeError('GROQ_API_KEY is missing. Set it in your backend environment before verifying certificates.')
