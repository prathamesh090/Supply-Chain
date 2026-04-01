import json
import logging
from typing import Any, Dict

import requests

from .config import ensure_groq_configured, settings

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def analyze_certificate_with_groq(doc_type: str, extracted_text: str) -> Dict[str, Any]:
    ensure_groq_configured()

    prompt = (
        "You validate supplier compliance certificates. Return strict JSON with keys: "
        "template_match(boolean), document_type_valid(boolean), summary(string), signals(array of strings). "
        f"Expected document type: {doc_type}. "
        "Do not evaluate or mention supplier/company name. "
        "Only evaluate template/format consistency and whether doc type appears valid from text. "
        f"Document text: {extracted_text[:6000]}"
    )

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": "Respond with compact JSON only."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
    }
    response = requests.post(
        GROQ_URL,
        headers={
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=20,
    )
    response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        logger.warning("Groq response was not valid JSON. Falling back to heuristic parse.")
        lowered = content.lower()
        return {
            "template_match": "template" in lowered and "not" not in lowered,
            "document_type_valid": doc_type.lower() in lowered or "valid" in lowered,
            "summary": content[:300],
            "signals": [],
        }
