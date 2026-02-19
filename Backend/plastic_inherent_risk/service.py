# service.py

from datetime import datetime, timezone

from .predictor import predict_inherent_risk
from .repository import exists, insert
from .enrichment import enrich_risk
from .normalization import normalize_score, apply_decay, decay_lambda
from .supplier_repository import compute_supplier_index
from supplier_registry.mapping_engine import match_supplier_from_text

def process_inherent_risk(text: str, supplier_id: str | None):
    # Auto-detect supplier if not provided
    if not supplier_id:
        match = match_supplier_from_text(text)
        if not match:
            return {
                "status": "no_supplier_found",
                "message": "No supplier identified from text.",
                "result": None,
                "supplier_risk_index": None
            }
        supplier_id = match["supplier_id"]

    base = predict_inherent_risk(text)

    enriched = enrich_risk(
        text=text,
        category=base["category"],
        confidence=base["confidence"]
    )

    created_at = datetime.now(timezone.utc)

    normalized = normalize_score(enriched["risk_score"])
    decayed = apply_decay(
        normalized_score=normalized,
        created_at=created_at,
        category=enriched["risk_category"]
    )

    enriched.update({
        "normalized_score": normalized,
        "decayed_score": decayed,
        "decay_lambda": decay_lambda(enriched["risk_category"]),
        "created_at": created_at
    })

    if exists(text, supplier_id):
        supplier_index = compute_supplier_index(supplier_id)
        return {
            "status": "exists",
            "result": enriched,
            "supplier_risk_index": supplier_index
        }

    insert(
        supplier_id=supplier_id,
        text=text,
        category=enriched["risk_category"],
        confidence=enriched["confidence"],
        risk_level=enriched["risk_level"],
        risk_score=enriched["risk_score"],
        normalized_score=normalized,
        decayed_score=decayed,
        decay_lambda=enriched["decay_lambda"],
        explanation=enriched["explanation"],
        signals=enriched["signals"],
    )

    supplier_index = compute_supplier_index(supplier_id)

    return {
        "status": "stored",
        "result": enriched,
        "supplier_risk_index": supplier_index
    }
