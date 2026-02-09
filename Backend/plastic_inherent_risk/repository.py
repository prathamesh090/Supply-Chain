from .database import get_connection, init_db
import hashlib

init_db()

def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()

def exists(text: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT 1 FROM inherent_risk WHERE text_hash = ?",
        (_hash(text),)
    )
    result = cursor.fetchone()
    conn.close()
    return result is not None

def insert(text: str, category: str, confidence: float):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO inherent_risk (text, text_hash, category, confidence)
        VALUES (?, ?, ?, ?)
        """,
        (text, _hash(text), category, confidence)
    )
    conn.commit()
    conn.close()
