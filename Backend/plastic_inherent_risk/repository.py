# repository.py

from .database import get_connection
import hashlib
import json

def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def exists(text: str, supplier_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT 1
        FROM inherent_risk
        WHERE text_hash = ? AND supplier_id = ?
        """,
        (_hash(text), supplier_id)
    )
    found = cursor.fetchone() is not None
    conn.close()
    return found

def insert(
    supplier_id: str,
    text: str,
    category: str,
    confidence: float,
    risk_level: str,
    risk_score: float,
    normalized_score: float,
    decayed_score: float,
    decay_lambda: float,
    explanation: str,
    signals: list[str],
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO inherent_risk (
            supplier_id,
            text,
            text_hash,
            category,
            confidence,
            risk_level,
            risk_score,
            normalized_score,
            decayed_score,
            decay_lambda,
            explanation,
            signals
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            supplier_id,
            text,
            _hash(text),
            category,
            confidence,
            risk_level,
            risk_score,
            normalized_score,
            decayed_score,
            decay_lambda,
            explanation,
            json.dumps(signals)
        )
    )

    conn.commit()
    conn.close()
