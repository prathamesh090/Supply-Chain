from typing import List, Dict, Optional
from plastic_inherent_risk.database import get_connection


# ---------------------------------------
# Store Event
# ---------------------------------------

def store_event(
    event_text: str,
    category: str,
    risk_level: str,
    risk_score: float,
    supplier_id: Optional[str] = None,
    source: str = "news"
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO risk_event_history
        (supplier_id, event_text, category, risk_level, risk_score, source)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            supplier_id,
            event_text,
            category,
            risk_level,
            risk_score,
            source
        )
    )

    conn.commit()
    conn.close()


# ---------------------------------------
# Get Recent Events (Dashboard Feed)
# ---------------------------------------

def get_recent_events(limit: int = 20) -> List[Dict]:

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM risk_event_history
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,)
    )

    rows = cursor.fetchall()
    conn.close()

    events = []

    for row in rows:
        events.append({
            "event_id": row["event_id"],
            "supplier_id": row["supplier_id"],
            "event_text": row["event_text"],
            "category": row["category"],
            "risk_level": row["risk_level"],
            "risk_score": row["risk_score"],
            "source": row["source"],
            "created_at": row["created_at"]
        })

    return events


# ---------------------------------------
# Get Events For Supplier Timeline
# ---------------------------------------

def get_supplier_events(supplier_id: str) -> List[Dict]:

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM risk_event_history
        WHERE supplier_id = ?
        ORDER BY created_at DESC
        """,
        (supplier_id,)
    )

    rows = cursor.fetchall()
    conn.close()

    events = []

    for row in rows:
        events.append({
            "event_id": row["event_id"],
            "event_text": row["event_text"],
            "category": row["category"],
            "risk_level": row["risk_level"],
            "risk_score": row["risk_score"],
            "created_at": row["created_at"]
        })

    return events

def get_recent_events(limit: int = 20):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT supplier_id,
               event_text,
               category,
               risk_level,
               source,
               created_at
        FROM risk_event_history
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,)
    )

    rows = cursor.fetchall()

    conn.close()

    return [dict(row) for row in rows]