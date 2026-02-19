import re
from typing import Optional, Dict
from .repository import get_all_suppliers


def normalize_text(text: str) -> str:
    """
    Lowercase and remove special characters
    """
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return text


def match_supplier_from_text(text: str) -> Optional[Dict]:
    """
    Match supplier based on name or aliases.
    Returns:
        {
            supplier_id,
            supplier_name,
            match_type
        }
    or None
    """

    normalized_text = normalize_text(text)

    suppliers = get_all_suppliers()

    for supplier in suppliers:
        supplier_name = supplier["supplier_name"].lower()

        # Direct name match
        if supplier_name in normalized_text:
            return {
                "supplier_id": supplier["supplier_id"],
                "supplier_name": supplier["supplier_name"],
                "match_type": "name"
            }

        # Alias match
        for alias in supplier.get("aliases", []):
            if alias.lower() in normalized_text:
                return {
                    "supplier_id": supplier["supplier_id"],
                    "supplier_name": supplier["supplier_name"],
                    "match_type": "alias"
                }

    return None
