import json
from typing import Optional, List, Dict
from plastic_inherent_risk.database import get_connection


# ----------------------------
# Create Supplier
# ----------------------------

def create_supplier(
    supplier_id: str,
    supplier_name: str,
    aliases: Optional[List[str]] = None,
    country: Optional[str] = None,
    region: Optional[str] = None
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO supplier_registry
        (supplier_id, supplier_name, aliases, country, region)
        VALUES (?, ?, ?, ?, ?)
    """, (
        supplier_id,
        supplier_name,
        json.dumps(aliases or []),
        country,
        region
    ))

    conn.commit()
    conn.close()


# ----------------------------
# Get Supplier By ID
# ----------------------------

def get_supplier_by_id(supplier_id: str) -> Optional[Dict]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM supplier_registry
        WHERE supplier_id = ?
    """, (supplier_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "supplier_id": row["supplier_id"],
        "supplier_name": row["supplier_name"],
        "aliases": json.loads(row["aliases"]) if row["aliases"] else [],
        "country": row["country"],
        "region": row["region"]
    }


# ----------------------------
# Get All Suppliers
# ----------------------------

def get_all_suppliers() -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM supplier_registry")
    rows = cursor.fetchall()
    conn.close()

    suppliers = []
    for row in rows:
        suppliers.append({
            "supplier_id": row["supplier_id"],
            "supplier_name": row["supplier_name"],
            "aliases": json.loads(row["aliases"]) if row["aliases"] else [],
            "country": row["country"],
            "region": row["region"]
        })

    return suppliers


# ----------------------------
# Resolve Supplier By Name or Alias
# ----------------------------

def resolve_supplier_by_name(name: str) -> Optional[Dict]:
    """
    Try to match supplier by:
    - exact name
    - alias match
    Case-insensitive
    """

    name_lower = name.lower()

    suppliers = get_all_suppliers()

    for supplier in suppliers:
        if supplier["supplier_name"].lower() == name_lower:
            return supplier

        for alias in supplier["aliases"]:
            if alias.lower() == name_lower:
                return supplier

    return None