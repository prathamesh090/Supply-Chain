from .predictor import predict_inherent_risk
from .repository import exists, insert

from .predictor import predict_inherent_risk
from .repository import exists, insert

def process_inherent_risk(text: str):
    if exists(text):
        result = predict_inherent_risk(text)
        return {
            "status": "exists",
            "result": result
        }

    result = predict_inherent_risk(text)

    insert(
        text=text,
        category=result["category"],
        confidence=result["confidence"]
    )

    return {
        "status": "stored",
        "result": result
    }
