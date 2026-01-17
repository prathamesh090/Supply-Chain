# Backend/ml/router_ml.py
from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io
import logging

from .routes.predict import predict_batch  # your main inference function

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/batch-predict")
async def batch_predict(file: UploadFile = File(...)):
    """Run batch prediction on uploaded CSV"""
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        result = predict_batch(df)
        return {"status": "success", "predictions": result}
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
