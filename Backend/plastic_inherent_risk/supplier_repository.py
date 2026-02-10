# supplier_repository.py

from .database import get_connection
import json
from datetime import datetime, timedelta, timezone

ROLLING_WINDOW_DAYS = 180

def compute_supplier_index(supplier_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    since = datetime.now(timezone.utc) - timedelta(days=ROLLING_WINDOW_DAYS)

    cursor.execute(
        """
        SELECT category, decayed_score, created_at
        FROM inherent_risk
        WHERE supplier_id = ?
          AND created_at >= ?
        """,
        (supplier_id, since)
    )

    rows = cursor.fetchall()
    if not rows:
        conn.close()
        return None

    scores = []
    breakdown = {}

    for r in rows:
        score = r["decayed_score"]
        scores.append(score)

        breakdown[r["category"]] = breakdown.get(r["category"], 0) + 1

    rolling_score = round(sum(scores) / len(scores), 2)

    if rolling_score >= 70:
        level = "High"
    elif rolling_score >= 40:
        level = "Medium"
    else:
        level = "Low"

    cursor.execute(
        """
        INSERT OR REPLACE INTO supplier_risk_index
        (supplier_id, rolling_risk_score, risk_level,
         last_event_at, event_count, category_breakdown)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            supplier_id,
            rolling_score,
            level,
            datetime.now(timezone.utc),
            len(scores),
            json.dumps(breakdown)
        )
    )

    conn.commit()
    conn.close()

    return {
        "supplier_id": supplier_id,
        "rolling_risk_score": rolling_score,
        "risk_level": level,
        "event_count": len(scores),
        "category_breakdown": breakdown
    }

def get_supplier_index(supplier_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT supplier_id, rolling_risk_score, risk_level,
               event_count, category_breakdown
        FROM supplier_risk_index
        WHERE supplier_id = ?
        """,
        (supplier_id,)
    )

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "supplier_id": row["supplier_id"],
        "rolling_risk_score": row["rolling_risk_score"],
        "risk_level": row["risk_level"],
        "event_count": row["event_count"],
        "category_breakdown": json.loads(row["category_breakdown"])
    }
