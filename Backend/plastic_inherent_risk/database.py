# database.py

import sqlite3
import csv
from pathlib import Path

DB_PATH = Path(__file__).parent / "plastic_risk.db"
SUPPLIER_DATASET = Path(__file__).parent.parent / "data" / "sra" / "entities_to_monitor_plastic.csv"


def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():

    conn = get_connection()
    cursor = conn.cursor()

    # -------------------------
    # inherent risk events
    # -------------------------
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

    # -------------------------
    # supplier rolling index
    # -------------------------
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

    # -------------------------
    # supplier registry
    # -------------------------
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS supplier_registry (
            supplier_id TEXT PRIMARY KEY,
            supplier_name TEXT NOT NULL,
            aliases TEXT,
            country TEXT,
            region TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS risk_event_history (

            event_id INTEGER PRIMARY KEY AUTOINCREMENT,

            supplier_id TEXT,

            event_text TEXT NOT NULL,

            category TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            risk_score REAL NOT NULL,

            source TEXT DEFAULT 'news',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()

    # -------------------------
    # AUTO SEED SUPPLIERS
    # -------------------------

    cursor.execute("SELECT COUNT(*) FROM supplier_registry")
    count = cursor.fetchone()[0]

    if count == 0:

        if not SUPPLIER_DATASET.exists():
            raise FileNotFoundError(
                f"SRA dataset missing: {SUPPLIER_DATASET}"
            )

        with open(SUPPLIER_DATASET) as f:
            reader = csv.DictReader(f)

            for row in reader:
                cursor.execute(
                    """
                    INSERT INTO supplier_registry
                    (supplier_id, supplier_name, country, region)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        row["uid"],
                        row["plant_name"],
                        row["country"],
                        row["country"]
                    )
                )

        conn.commit()
        print("✓ Supplier registry seeded")

    else:
        print("✓ Supplier registry already initialized")

    conn.close()