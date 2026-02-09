import torch
from .model_loader import load_model

# Load once (singleton behavior)
tokenizer, model, id_to_label, device = load_model()

def predict_inherent_risk(text: str) -> dict:
    """
    Pure ML inference.
    No DB, no rules, no side effects.
    """

    if not text or not isinstance(text, str):
        return {
            "category": "Unknown",
            "confidence": 0.0
        }

    inputs = tokenizer(
        text,
        truncation=True,
        padding=True,
        max_length=128,
        return_tensors="pt"
    )

    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)

    pred_id = torch.argmax(probs, dim=1).item()

    return {
        "category": id_to_label[pred_id],
        "confidence": round(probs[0][pred_id].item(), 4)
    }
