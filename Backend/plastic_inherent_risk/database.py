# database.py

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "plastic_risk.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _column_exists(cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return column in [row["name"] for row in cursor.fetchall()]


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inherent_risk (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            supplier_id TEXT NOT NULL,

            text TEXT NOT NULL,
            text_hash TEXT UNIQUE NOT NULL,

            category TEXT NOT NULL,
            confidence REAL NOT NULL,
            risk_level TEXT NOT NULL,

            risk_score REAL NOT NULL,
            normalized_score REAL NOT NULL,
            decayed_score REAL NOT NULL,
            decay_lambda REAL NOT NULL,

            explanation TEXT NOT NULL,
            signals TEXT NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS supplier_risk_index (
            supplier_id TEXT PRIMARY KEY,

            rolling_risk_score REAL NOT NULL,
            risk_level TEXT NOT NULL,

            last_event_at TIMESTAMP NOT NULL,
            event_count INTEGER NOT NULL,

            category_breakdown TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    conn.close()
