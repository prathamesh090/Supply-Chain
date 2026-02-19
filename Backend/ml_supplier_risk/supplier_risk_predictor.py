# backend/ml/supplier_risk_predictor.py
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

class SupplierRiskPredictor:
    def __init__(self):
        # ---------- Paths ----------
        self.DATA_PATH = Path(__file__).resolve().parent / "data" / "suppliers_cleaned.xlsx"
        self.MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"
        self.ENCODER_PATH = Path(__file__).resolve().parent / "label_encoder.pkl"
        
        # Load model and encoder
        self.pipe = None
        self.label_encoder = None
        self.training_plastic_types = None
        self.feature_columns = None
        
        self._load_model()
        self._load_training_features()
    
    def _load_model(self):
        """Load the trained model and label encoder"""
        try:
            self.pipe = joblib.load(self.MODEL_PATH)
            self.label_encoder = joblib.load(self.ENCODER_PATH)
            print("✅ Model and encoder loaded successfully")
            print(f"Model classes: {self.label_encoder.classes_}")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    
    def _load_training_features(self):
        """Get the plastic types and feature columns used during training"""
        try:
            # Try to load training data
            if not self.DATA_PATH.exists():
                print(f"Warning: Data file not found: {self.DATA_PATH}")
                raise FileNotFoundError(f"Data file not found: {self.DATA_PATH}")
            
            # Try different methods to read the file
            try:
                # First try with openpyxl
                df_training = pd.read_excel(self.DATA_PATH, engine='openpyxl')
            except:
                try:
                    # Try without engine specification
                    df_training = pd.read_excel(self.DATA_PATH)
                except Exception as e:
                    print(f"Error reading Excel file: {e}")
                    # If it's actually a CSV file
                    if str(self.DATA_PATH).lower().endswith('.csv'):
                        df_training = pd.read_csv(self.DATA_PATH)
                    else:
                        raise
            
            df_training.columns = df_training.columns.str.strip()
            
            # Check if Plastic_Type column exists
            if "Plastic_Type" in df_training.columns:
                self.training_plastic_types = df_training["Plastic_Type"].unique()
                print(f"Found plastic types: {list(self.training_plastic_types)}")
            else:
                # Check for similar column names
                plastic_cols = [col for col in df_training.columns if 'plastic' in col.lower() or 'type' in col.lower()]
                if plastic_cols:
                    self.training_plastic_types = df_training[plastic_cols[0]].unique()
                    print(f"Found plastic types in column '{plastic_cols[0]}': {list(self.training_plastic_types)}")
                else:
                    # Fallback if column doesn't exist
                    self.training_plastic_types = ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Other"]
                    print(f"No plastic type column found, using default: {self.training_plastic_types}")
            
            # Define feature columns
            num_cols = ["delivery_delay_days", "defect_rate_pct", "price_variance_pct",
                       "compliance_flag", "trust_score"]
            plastic_cols = [f"Plastic_{ptype}" for ptype in self.training_plastic_types]
            self.feature_columns = num_cols + plastic_cols
            
            print(f"Training plastic types: {list(self.training_plastic_types)}")
            print(f"Total features: {len(self.feature_columns)}")
            
        except Exception as e:
            print(f"Warning: Could not load training data: {e}")
            print("Using fallback configuration...")
            # Enhanced fallback
            self.training_plastic_types = ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Other"]
            num_cols = ["delivery_delay_days", "defect_rate_pct", "price_variance_pct",
                       "compliance_flag", "trust_score"]
            plastic_cols = [f"Plastic_{ptype}" for ptype in self.training_plastic_types]
            self.feature_columns = num_cols + plastic_cols
            print(f"Using fallback plastic types: {self.training_plastic_types}")

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess supplier data exactly as done during training"""
        df = df.copy()
        
        # ---------- Fill missing values ----------
        df["defective_units"] = df.get("defective_units", 0).fillna(0)
        df["quantity"] = df.get("quantity", 1).fillna(1)
        df["unit_price"] = df.get("unit_price", df.get("negotiated_price", 0)).fillna(0)
        df["negotiated_price"] = df.get("negotiated_price", df.get("unit_price", 0)).fillna(0)
        df["compliance"] = df.get("compliance", "No").fillna("No")
        df["trust_score"] = df.get("trust_score", 50).fillna(50)
        df["Plastic_Type"] = df.get("Plastic_Type", "Unknown").fillna("Unknown")

        # ---------- Feature engineering (match training exactly) ----------
        df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")
        df["delivery_date"] = pd.to_datetime(df["delivery_date"], errors="coerce")
        df["delivery_delay_days"] = ((df["delivery_date"] - df["order_date"]).dt.days
                                     .clip(lower=0)
                                     .fillna(0)
                                     .astype(int))
        
        df["defect_rate_pct"] = (df["defective_units"] / df["quantity"]) * 100
        
        df["price_variance_pct"] = ((df["unit_price"] - df["negotiated_price"]) / df["negotiated_price"]) * 100
        df["price_variance_pct"] = df["price_variance_pct"].replace([np.inf, -np.inf], 0).fillna(0)
        
        df["compliance_flag"] = df["compliance"].apply(lambda x: 1 if str(x).lower() == "yes" else 0)

        # ---------- Multi-hot encode Plastic_Type ----------
        for ptype in self.training_plastic_types:
            df[f"Plastic_{ptype}"] = (df["Plastic_Type"] == ptype).astype(int)

        return df
    
    def calculate_risk_score_from_features(self, row: pd.Series) -> float:
        """Calculate risk score using the same formula as training"""
        delivery_risk = min(100, row["delivery_delay_days"] * 10)
        defect_risk = row["defect_rate_pct"]
        price_risk = row["price_variance_pct"]
        compliance_risk = (1 - row["compliance_flag"]) * 100
        trust_risk = max(0, 100 - row["trust_score"])

        score = (
            0.30 * delivery_risk +
            0.25 * defect_risk +
            0.20 * compliance_risk +
            0.15 * price_risk +
            0.10 * trust_risk
        )
        return max(0, min(100, round(score, 2)))
    
    def predict_all_suppliers(self) -> List[Dict[str, Any]]:
        """Get risk predictions for all suppliers in the dataset"""
        # Load dataset
        if not self.DATA_PATH.exists():
            raise FileNotFoundError(f"Data file not found: {self.DATA_PATH}")
        
        # Try different methods to read the file
        try:
            if str(self.DATA_PATH).lower().endswith('.xlsx'):
                try:
                    df = pd.read_excel(self.DATA_PATH, engine='openpyxl')
                except:
                    df = pd.read_excel(self.DATA_PATH)
            else:
                df = pd.read_csv(self.DATA_PATH)
        except Exception as e:
            raise Exception(f"Failed to read data file: {e}")
        
        df.columns = df.columns.str.strip()
        
        # Check for supplier column
        if "supplier" not in df.columns:
            # Try to find supplier column
            supplier_cols = [col for col in df.columns if 'supplier' in col.lower() or 'name' in col.lower()]
            if supplier_cols:
                df = df.rename(columns={supplier_cols[0]: "supplier"})
            else:
                # Create a dummy supplier column
                df["supplier"] = [f"Supplier_{i+1}" for i in range(len(df))]
        
        # Preprocess data
        df = self.preprocess_data(df)

        # Aggregate by supplier (same as training)
        agg_dict = {col: "mean" for col in self.feature_columns}
        agg_df = df.groupby("supplier").agg(agg_dict).reset_index()
        
        # Ensure we have all required features
        missing_features = [col for col in self.feature_columns if col not in agg_df.columns]
        if missing_features:
            print(f"Warning: Missing features {missing_features}, filling with zeros")
            for col in missing_features:
                agg_df[col] = 0
        
        # Prepare features for prediction in correct order
        X_pred = agg_df[self.feature_columns]
        
        # Make predictions
        preds_encoded = self.pipe.predict(X_pred)
        preds_label = self.label_encoder.inverse_transform(preds_encoded)
        probas = self.pipe.predict_proba(X_pred)

        # Build output
        output = []
        classes = self.label_encoder.classes_
        
        for i in range(len(agg_df)):
            supplier_name = agg_df.iloc[i]['supplier']
            supplier_row = agg_df.iloc[i]
            
            # Create probability map
            proba_map = {}
            for j, cls in enumerate(classes):
                proba_map[str(cls)] = float(probas[i, j])
            
            # Calculate risk score using the training formula
            risk_score_formula = self.calculate_risk_score_from_features(supplier_row)
            
            # Also calculate UI-friendly risk score from probabilities
            risk_score_ui = round(100 * proba_map.get("Medium", 0), 1)
            if "High" in proba_map:
                risk_score_ui = round(100 * (proba_map.get("High", 0) + 0.5 * proba_map.get("Medium", 0)), 1)
            
            # Build supplier profile
            supplier_profile = {
                "supplier_name": supplier_name,
                "predicted_risk": str(preds_label[i]),
                "risk_score": risk_score_formula,  # Use the formula-based score
                "risk_score_ui": risk_score_ui,   # Keep UI-friendly score separate
                "risk_level": str(preds_label[i]),
                "probabilities": proba_map,
                
                # Key metrics
                "avg_delivery_delay_days": round(float(supplier_row['delivery_delay_days']), 2),
                "avg_defect_rate_percent": round(float(supplier_row['defect_rate_pct']), 2),
                "avg_price_variance_percent": round(float(supplier_row['price_variance_pct']), 2),
                "compliance_rate": round(float(supplier_row['compliance_flag']) * 100, 1),
                "trust_score": round(float(supplier_row['trust_score']), 1),
                
                # Plastic types
                "plastic_types": [ptype for ptype in self.training_plastic_types 
                                if supplier_row[f'Plastic_{ptype}'] > 0],
                
                # Summary
                "risk_summary": f"{supplier_name} has {str(preds_label[i]).lower()} risk (score: {risk_score_formula:.1f}/100)"
            }
            
            output.append(supplier_profile)
        
        # Sort by risk score (highest first)
        output.sort(key=lambda x: x["risk_score"], reverse=True)
        
        return output
    
    def predict_single_supplier(self, supplier_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict risk for a single supplier"""
        # Convert to DataFrame
        df = pd.DataFrame([supplier_data])
        
        # Preprocess
        df = self.preprocess_data(df)
        
        # Ensure all features exist
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Extract features in correct order
        X_pred = df[self.feature_columns]
        
        # Make prediction
        pred_encoded = self.pipe.predict(X_pred)[0]
        pred_label = self.label_encoder.inverse_transform([pred_encoded])[0]
        probas = self.pipe.predict_proba(X_pred)[0]
        
        # Build probability map
        classes = self.label_encoder.classes_
        proba_map = {str(cls): float(probas[j]) for j, cls in enumerate(classes)}
        
        # Calculate risk scores
        risk_score_formula = self.calculate_risk_score_from_features(df.iloc[0])
        risk_score_ui = round(100 * proba_map.get("Medium", 0), 1)
        if "High" in proba_map:
            risk_score_ui = round(100 * (proba_map.get("High", 0) + 0.5 * proba_map.get("Medium", 0)), 1)
        
        return {
            "predicted_risk": str(pred_label),
            "risk_score": risk_score_formula,
            "risk_score_ui": risk_score_ui,
            "probabilities": proba_map,
            "supplier_data": supplier_data,
            "risk_summary": f"Predicted {str(pred_label).lower()} risk (score: {risk_score_formula:.1f}/100)"
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            "status": "loaded",
            "model_classes": list(self.label_encoder.classes_),
            "expected_features": len(self.feature_columns),
            "feature_columns": self.feature_columns,
            "plastic_types": list(self.training_plastic_types)
        }
    
    def get_supplier_rankings(self) -> List[Dict[str, Any]]:
        """Get all suppliers ranked by risk score"""
        predictions = self.predict_all_suppliers()
        
        # Add rank information
        for i, supplier in enumerate(predictions):
            supplier["risk_rank"] = i + 1
            supplier["total_suppliers"] = len(predictions)
        
        return predictions
    
    def get_risk_distribution(self) -> Dict[str, Any]:
        """Get risk distribution statistics"""
        predictions = self.predict_all_suppliers()
        
        risk_counts = {"Low": 0, "Medium": 0, "High": 0}
        risk_scores = []
        
        for pred in predictions:
            risk_level = pred["predicted_risk"]
            if risk_level in risk_counts:
                risk_counts[risk_level] += 1
            risk_scores.append(pred["risk_score"])
        
        return {
            "total_suppliers": len(predictions),
            "risk_distribution": risk_counts,
            "risk_distribution_percent": {
                level: round(count / len(predictions) * 100, 1) 
                for level, count in risk_counts.items()
            },
            "average_risk_score": round(np.mean(risk_scores), 2),
            "median_risk_score": round(np.median(risk_scores), 2),
            "risk_score_range": {
                "min": round(min(risk_scores), 2),
                "max": round(max(risk_scores), 2)
            }
        }