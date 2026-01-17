import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier
import numpy as np

# ---------- Paths ----------
DATA_PATH = Path(__file__).resolve().parent / "data" / "suppliers_cleaned.xlsx"
MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"
ENCODER_PATH = Path(__file__).resolve().parent / "label_encoder.pkl"

# ---------- Load raw data ----------
df_raw = pd.read_excel(DATA_PATH)
df_raw.columns = df_raw.columns.str.strip()
print("Data loaded:", df_raw.shape)
print("Columns:", df_raw.columns.tolist())

# ---------- Feature engineering ----------
df_raw["order_date"] = pd.to_datetime(df_raw["order_date"], errors="coerce")
df_raw["delivery_date"] = pd.to_datetime(df_raw["delivery_date"], errors="coerce")
df_raw["delivery_delay_days"] = ((df_raw["delivery_date"] - df_raw["order_date"]).dt.days
                                 .clip(lower=0)
                                 .fillna(0)
                                 .astype(int))

df_raw["defective_units"] = df_raw.get("defective_units", 0).fillna(0)
df_raw["quantity"] = df_raw.get("quantity", 1).fillna(1)
df_raw["defect_rate_pct"] = (df_raw["defective_units"] / df_raw["quantity"]) * 100

df_raw["unit_price"] = df_raw.get("unit_price", df_raw.get("negotiated_price", 0)).fillna(0)
df_raw["negotiated_price"] = df_raw.get("negotiated_price", df_raw.get("unit_price", 0)).fillna(0)
df_raw["price_variance_pct"] = ((df_raw["unit_price"] - df_raw["negotiated_price"]) / df_raw["negotiated_price"]) * 100
df_raw["price_variance_pct"] = df_raw["price_variance_pct"].replace([np.inf, -np.inf], 0).fillna(0)

df_raw["compliance_flag"] = df_raw["compliance"].apply(lambda x: 1 if str(x).lower() == "yes" else 0)
df_raw["trust_score"] = df_raw.get("trust_score", 50).fillna(50)

# ---------- Multi-hot encode Plastic_Type ----------
plastic_types = df_raw["Plastic_Type"].unique()
for ptype in plastic_types:
    df_raw[f"Plastic_{ptype}"] = (df_raw["Plastic_Type"] == ptype).astype(int)

# ---------- Aggregate by supplier ----------
NUM_COLS = ["delivery_delay_days", "defect_rate_pct", "price_variance_pct",
            "compliance_flag", "trust_score"]
PLASTIC_COLS = [f"Plastic_{p}" for p in plastic_types]

agg_dict = {col: "mean" for col in NUM_COLS + PLASTIC_COLS}
agg_df = df_raw.groupby("supplier").agg(agg_dict).reset_index()

print(f"Aggregated suppliers: {len(agg_df)}")

# ---------- Risk scoring ----------
def risk_score_row(r):
    delivery_risk   = min(100, r["delivery_delay_days"] * 10)
    defect_risk     = r["defect_rate_pct"]
    price_risk      = r["price_variance_pct"]
    compliance_risk = (1 - r["compliance_flag"]) * 100
    trust_risk      = max(0, 100 - r["trust_score"])

    score = (
        0.30 * delivery_risk +
        0.25 * defect_risk +
        0.20 * compliance_risk +
        0.15 * price_risk +
        0.10 * trust_risk
    )
    return max(0, min(100, round(score, 2)))

scores = agg_df.apply(risk_score_row, axis=1)

def label_from_score(s):
    if s <= 40: return "Low"
    if s <= 70: return "Medium"
    return "High"

y_all = scores.apply(label_from_score)

# ---------- DEBUG: Check class distribution ----------
print("\n=== Risk Score Distribution ===")
print(f"Score range: {scores.min():.2f} - {scores.max():.2f}")
print(f"Score mean: {scores.mean():.2f}")
print("\n=== Class Distribution ===")
class_counts = y_all.value_counts()
print(class_counts)

# ---------- Handle insufficient data or class imbalance ----------
if len(agg_df) < 10:
    print(f"\n WARNING: Only {len(agg_df)} suppliers found. Need at least 10 for reliable training.")
    print("Creating synthetic data for demonstration...")
    
    # Create some synthetic variations
    synthetic_rows = []
    for _, row in agg_df.iterrows():
        # Create variations with some noise
        for i in range(3):
            new_row = row.copy()
            # Add some random variation to numeric columns
            for col in NUM_COLS:
                if col == "compliance_flag":
                    continue  # Keep this binary
                noise_factor = 0.1 + (i * 0.05)  # 10%, 15%, 20% variation
                new_row[col] *= (1 + np.random.uniform(-noise_factor, noise_factor))
            new_row["supplier"] = f"{row['supplier']}_variant_{i+1}"
            synthetic_rows.append(new_row)
    
    if synthetic_rows:
        synthetic_df = pd.DataFrame(synthetic_rows)
        agg_df = pd.concat([agg_df, synthetic_df], ignore_index=True)
        
        # Recalculate scores and labels for all data
        scores = agg_df.apply(risk_score_row, axis=1)
        y_all = scores.apply(label_from_score)
        
        print(f" Extended dataset to {len(agg_df)} suppliers")
        print("Updated class distribution:")
        print(y_all.value_counts())

# ---------- Create better class distribution ----------
unique_classes = y_all.unique()
class_counts = y_all.value_counts()

# If we have severe class imbalance or missing classes, create balanced synthetic data
if len(unique_classes) < 3 or class_counts.min() < 2:
    print(f"\n WARNING: Imbalanced or insufficient class distribution")
    print("Creating balanced synthetic data for robust training...")
    
    # Calculate how many samples we need for each class
    target_samples_per_class = max(5, len(agg_df) // 3)
    
    synthetic_rows = []
    base_suppliers = agg_df.copy()
    
    # Create Low risk samples (scores 10-40)
    low_needed = max(0, target_samples_per_class - len(y_all[y_all == "Low"]))
    for i in range(low_needed):
        base_row = base_suppliers.iloc[i % len(base_suppliers)].copy()
        # Modify to create low risk
        base_row["delivery_delay_days"] *= np.random.uniform(0.1, 0.3)  # Very low delays
        base_row["defect_rate_pct"] *= np.random.uniform(0.1, 0.4)      # Low defects
        base_row["price_variance_pct"] *= np.random.uniform(0.1, 0.3)   # Low price variance
        base_row["compliance_flag"] = 1                                  # Always compliant
        base_row["trust_score"] = max(base_row["trust_score"], np.random.uniform(80, 95))  # High trust
        base_row["supplier"] = f"synthetic_low_risk_{i+1}"
        synthetic_rows.append(base_row)
    
    # Create Medium risk samples (scores 41-70)
    medium_needed = max(0, target_samples_per_class - len(y_all[y_all == "Medium"]))
    for i in range(medium_needed):
        base_row = base_suppliers.iloc[i % len(base_suppliers)].copy()
        # Modify to create medium risk
        base_row["delivery_delay_days"] = np.random.uniform(3, 7)        # Medium delays
        base_row["defect_rate_pct"] = np.random.uniform(5, 15)           # Medium defects
        base_row["price_variance_pct"] = np.random.uniform(5, 15)        # Medium price variance
        base_row["compliance_flag"] = np.random.choice([0, 1])           # Mixed compliance
        base_row["trust_score"] = np.random.uniform(50, 75)              # Medium trust
        base_row["supplier"] = f"synthetic_medium_risk_{i+1}"
        synthetic_rows.append(base_row)
    
    # Create High risk samples (scores 71-100)
    high_needed = max(0, target_samples_per_class - len(y_all[y_all == "High"]))
    for i in range(high_needed):
        base_row = base_suppliers.iloc[i % len(base_suppliers)].copy()
        # Modify to create high risk
        base_row["delivery_delay_days"] = np.random.uniform(8, 15)       # High delays
        base_row["defect_rate_pct"] = np.random.uniform(15, 30)          # High defects
        base_row["price_variance_pct"] = np.random.uniform(15, 25)       # High price variance
        base_row["compliance_flag"] = 0                                  # Non-compliant
        base_row["trust_score"] = np.random.uniform(20, 50)              # Low trust
        base_row["supplier"] = f"synthetic_high_risk_{i+1}"
        synthetic_rows.append(base_row)
    
    if synthetic_rows:
        synthetic_df = pd.DataFrame(synthetic_rows)
        agg_df = pd.concat([agg_df, synthetic_df], ignore_index=True)
        
        # Recalculate scores and labels for all data
        scores = agg_df.apply(risk_score_row, axis=1)
        y_all = scores.apply(label_from_score)
        
        print(f" Extended dataset to {len(agg_df)} suppliers")
        print("Balanced class distribution:")
        print(y_all.value_counts())

# ---------- Encode labels ----------
label_encoder = LabelEncoder()
y_all_encoded = label_encoder.fit_transform(y_all)
joblib.dump(label_encoder, ENCODER_PATH)

print(f"\n=== Encoded Classes ===")
print(f"Classes: {label_encoder.classes_}")
print(f"Number of classes: {len(label_encoder.classes_)}")

# ---------- Features ----------
X_all = agg_df[NUM_COLS + PLASTIC_COLS]
print(f"Feature matrix shape: {X_all.shape}")

# ---------- Check for minimum samples ----------
if len(X_all) < 5:
    raise ValueError(f"Insufficient data: only {len(X_all)} samples. Need at least 5 for training.")

# ---------- Train-test split with better handling ----------
unique_classes = y_all.unique()
min_samples_per_class = y_all.value_counts().min()

if len(unique_classes) <= 1:
    raise ValueError(f"Cannot train model with only {len(unique_classes)} class(es). Need at least 2.")

# Calculate appropriate test size
if min_samples_per_class >= 3:
    # We have enough samples per class for stratified split
    test_size = max(0.2, 2 / len(agg_df))  # At least 2 samples in test, or 20%
    test_size = min(0.4, test_size)  # Don't use more than 40% for testing
    
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X_all, y_all_encoded, test_size=test_size, random_state=42, stratify=y_all_encoded
        )
        print(" Used stratified split")
        stratified = True
    except ValueError as e:
        print(f" Stratified split failed ({e}), using random split...")
        X_train, X_test, y_train, y_test = train_test_split(
            X_all, y_all_encoded, test_size=test_size, random_state=42
        )
        stratified = False
else:
    # Too few samples per class, use simple random split
    print(" Too few samples per class for stratified split, using random split...")
    test_size = max(0.2, 1 / len(agg_df))
    test_size = min(0.3, test_size)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X_all, y_all_encoded, test_size=test_size, random_state=42
    )
    stratified = False

print(f"Using test_size: {test_size:.2f}")
print(f"Training set: {len(X_train)} samples")
print(f"Test set: {len(X_test)} samples")

# Check what classes are in train and test
train_classes = set(y_train)
test_classes = set(y_test)
print(f"Classes in train set: {[label_encoder.classes_[i] for i in train_classes]}")
print(f"Classes in test set: {[label_encoder.classes_[i] for i in test_classes]}")

# ---------- Model pipeline ----------
num_classes = len(label_encoder.classes_)
print(f"Configuring XGBoost for {num_classes} classes")

# Configure XGBoost based on number of classes
if num_classes == 2:
    objective = "binary:logistic"
    eval_metric = "logloss"
else:
    objective = "multi:softprob"
    eval_metric = "mlogloss"

model = XGBClassifier(
    n_estimators=min(100, len(X_train) * 2),  # Reduce estimators for small datasets
    learning_rate=0.1,
    max_depth=min(4, len(X_train.columns)),  # Prevent overfitting with small data
    subsample=0.8,
    colsample_bytree=0.8,
    objective=objective,
    eval_metric=eval_metric,
    random_state=42,
    num_class=num_classes if num_classes > 2 else None  # Explicitly set for multiclass
)

pipe = Pipeline(steps=[
    ("model", model)
])

# ---------- Train ----------
print("\n=== Training Model ===")
pipe.fit(X_train, y_train)

# ---------- Evaluate ----------
y_pred = pipe.predict(X_test)

# Get unique classes that appear in test predictions
unique_test_classes = np.unique(y_test)
unique_pred_classes = np.unique(y_pred)
all_test_classes = np.unique(np.concatenate([unique_test_classes, unique_pred_classes]))

print(f"Test set contains classes: {[label_encoder.classes_[i] for i in unique_test_classes]}")
print(f"Predictions contain classes: {[label_encoder.classes_[i] for i in unique_pred_classes]}")

print("\n=== Model Performance ===")
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.3f}")

print("\n=== Classification Report ===")
try:
    # Only include classes that appear in the test set for the report
    test_class_names = [label_encoder.classes_[i] for i in all_test_classes]
    print(classification_report(
        y_test, y_pred, 
        labels=all_test_classes,
        target_names=test_class_names, 
        digits=3,
        zero_division=0
    ))
except Exception as e:
    print(f"Could not generate full classification report: {e}")
    print("Basic performance metrics:")
    for class_idx in all_test_classes:
        class_name = label_encoder.classes_[class_idx]
        class_mask = y_test == class_idx
        if class_mask.sum() > 0:
            class_accuracy = (y_pred[class_mask] == class_idx).sum() / class_mask.sum()
            print(f"  {class_name}: {class_accuracy:.3f} ({class_mask.sum()} samples)")

# ---------- Save ----------
joblib.dump(pipe, MODEL_PATH)
print(f"\n Saved model pipeline to: {MODEL_PATH}")
print(f" Saved label encoder to: {ENCODER_PATH}")

# ---------- Quick prediction test ----------
print("\n=== Testing Predictions ===")
sample_indices = list(range(min(5, len(X_all))))
sample_pred = pipe.predict(X_all.iloc[sample_indices])
sample_pred_labels = label_encoder.inverse_transform(sample_pred)
sample_suppliers = agg_df.iloc[sample_indices]["supplier"].tolist()

for i, (supplier, pred_label) in enumerate(zip(sample_suppliers, sample_pred_labels)):
    risk_score = scores.iloc[sample_indices[i]]
    print(f"  {supplier}: {pred_label} risk (score: {risk_score:.2f})")

print(f"\n Model training completed successfully!")
print(f" Final dataset: {len(agg_df)} suppliers")
print(f" Classes: {label_encoder.classes_.tolist()}")
print(f" Model ready for predictions!")