from pathlib import Path
import json
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification

# Base directory: Backend/plastic_inherent_risk/
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model():
    """
    Loads tokenizer, model, and label mappings.
    This runs ONCE at service startup.
    """

    tokenizer = DistilBertTokenizer.from_pretrained(MODEL_DIR)
    model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)

    model.to(device)
    model.eval()

    with open(MODEL_DIR / "label_map.json", "r") as f:
        label_map = json.load(f)

    # label_map structure:
    # { "label_to_id": {...}, "id_to_label": {...} }
    id_to_label = {
        int(k): v for k, v in label_map["id_to_label"].items()
    }

    return tokenizer, model, id_to_label, device
