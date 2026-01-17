import pickle
import traceback
import pandas as pd
import numpy as np
from xai.explainer import XAIExplainer
import logging
from .database_service import db_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(self, model_path='models/demand_model.pkl'):
        self.model_data = self.load_model(model_path)
        self.models = self.model_data.get('models', {})
        self.feature_names = self.model_data.get('feature_names', [])
        self.label_encoders = self.model_data.get('label_encoders', {})
        
        # Pass feature names to explainer
        self.explainer = XAIExplainer(self.models, self.feature_names)
        
        logger.info(f"Model loaded with {len(self.models)} models")
        logger.info(f"Features: {len(self.feature_names)}")
        logger.info(f"Sample features: {self.feature_names[:5]}")

    def load_model(self, model_path):
        """Load your actual trained model"""
        try:
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            logger.info(f"Model loaded successfully")
            logger.info(f"Available models: {list(model_data.get('models', {}).keys())}")
            logger.info(f"Feature names sample: {model_data.get('feature_names', [])[:10]}")
            
            return model_data
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def preprocess_data(self, df):
        """Simplified preprocessing focusing on essential features"""
        logger.info("Preprocessing input data...")
        
        processed_df = df.copy()
        
        # 1. Ensure basic features that your model expects
        if 'effective_price' not in processed_df.columns:
            processed_df['effective_price'] = processed_df['sale_amount'] * (1 - processed_df.get('discount', 0))
        
        # 2. Encode categorical features using your model's encoders
        categorical_cols = ['Plastic_Type', 'product_type', 'application_segment']
        
        for col in categorical_cols:
            if col in processed_df.columns and col in self.label_encoders:
                try:
                    # Handle unseen categories
                    unique_vals = processed_df[col].unique()
                    for val in unique_vals:
                        if val not in self.label_encoders[col].classes_:
                            logger.warning(f"Unseen category '{val}' in {col}, mapping to default")
                            default_val = self.label_encoders[col].classes_[0]
                            processed_df[col] = processed_df[col].replace(val, default_val)
                    
                    encoded_col = f'{col}_encoded'
                    processed_df[encoded_col] = self.label_encoders[col].transform(processed_df[col].astype(str))
                except Exception as e:
                    logger.error(f"Error encoding {col}: {e}")
                    # Simple fallback
                    processed_df[f'{col}_encoded'] = pd.factorize(processed_df[col])[0]
        
        # 3. Select only features your model expects
        available_features = [f for f in self.feature_names if f in processed_df.columns]
        missing_features = set(self.feature_names) - set(available_features)
        
        logger.info(f"Available features: {len(available_features)}, Missing: {len(missing_features)}")
        
        # Add default values for missing features
        for feature in missing_features:
            processed_df[feature] = 0  # Default value
        
        # Ensure correct feature order
        final_features = [f for f in self.feature_names if f in processed_df.columns]
        processed_df = processed_df[final_features]
        
        # Handle any remaining missing values
        processed_df = processed_df.fillna(0)
        
        logger.info(f"Preprocessing complete. Final shape: {processed_df.shape}")
        return processed_df
    
    def predict(self, input_data):
        """Make prediction using your ensemble model"""
        try:
            df = pd.DataFrame([input_data])
            processed_data = self.preprocess_data(df)
            
            # Get predictions from each model
            predictions = {}
            for model_name, model in self.models.items():
                try:
                    pred = model.predict(processed_data)
                    predictions[model_name] = float(pred[0])
                except Exception as e:
                    logger.warning(f"Model {model_name} prediction failed: {e}")
                    continue
            
            # Simple average ensemble (adjust weights based on your model)
            if predictions:
                ensemble_pred = np.mean(list(predictions.values()))
                confidence = self.calculate_confidence(predictions)
            else:
                ensemble_pred = 0
                confidence = 0.5
            
            return {
                "prediction": max(0, ensemble_pred),  # Ensure non-negative
                "model_predictions": predictions,
                "confidence": confidence
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {"error": str(e)}
    
    def explain_prediction(self, input_data):
        """Generate XAI explanations for your actual model"""
        try:
            df = pd.DataFrame([input_data])
            processed_data = self.preprocess_data(df)
            
            # Get explanation using your actual features
            explanation = self.explainer.explain(processed_data, self.feature_names, input_data)
            return explanation
            
        except Exception as e:
            logger.error(f"Explanation error: {e}")
            return {
                "error": str(e),
                "manufacturing_insights": ["Analysis temporarily unavailable"],
                "supply_recommendations": ["Please try again shortly"]
            }
    
    def batch_predict(self, batch_data):
        """Process multiple predictions"""
        try:
            logger.info(f"Processing {len(batch_data)} predictions")
            
            df = pd.DataFrame(batch_data)
            processed_data = self.preprocess_data(df)
            
            results = []
            for i, (index, row) in enumerate(processed_data.iterrows()):
                # Get prediction
                prediction_result = self._predict_single_row(row)
                
                # Get explanation
                explanation = self.explain_prediction(batch_data[i])
                
                results.append({
                    "id": batch_data[i].get('product_id', f"row_{i}"),
                    "prediction": prediction_result["prediction"],
                    "confidence": prediction_result["confidence"],
                    "input_data": batch_data[i],
                    "explanation": explanation
                })
            
            return {"predictions": results}
            
        except Exception as e:
            logger.error(f"Batch prediction error: {e}")
            raise
    
    def _predict_single_row(self, row_data):
        """Predict single row"""
        df_row = pd.DataFrame([row_data])
        
        predictions = {}
        for model_name, model in self.models.items():
            try:
                pred = model.predict(df_row)
                predictions[model_name] = float(pred[0])
            except Exception as e:
                continue
        
        if predictions:
            ensemble_pred = np.mean(list(predictions.values()))
            confidence = self.calculate_confidence(predictions)
        else:
            ensemble_pred = 0
            confidence = 0.5
        
        return {
            "prediction": max(0, ensemble_pred),
            "confidence": confidence,
            "model_predictions": predictions
        }
    
    def calculate_confidence(self, predictions):
        """Calculate prediction confidence"""
        if not predictions:
            return 0.5
            
        values = list(predictions.values())
        if len(values) == 1:
            return 0.8
            
        std_dev = np.std(values)
        max_val = max(values)
        if max_val > 0:
            confidence = 1 - (std_dev / max_val)
        else:
            confidence = 0.5
            
        return max(0.1, min(0.99, confidence))
    
    def save_analysis_to_db(self, session_id, file_name, predictions, explanations):
        """Save analysis results to MySQL database"""
        try:
            # Calculate session statistics
            product_ids = set()
            for p in predictions:
                product_id = p.get('input_data', {}).get('product_id')
                if product_id:
                    product_ids.add(product_id)
            
            total_products = len(product_ids)
            total_predictions = len(predictions)
            avg_demand = np.mean([p['prediction'] for p in predictions]) if predictions else 0
            avg_confidence = np.mean([p['confidence'] for p in predictions]) if predictions else 0
            
            # Save session
            session_data = {
                'session_id': session_id,
                'file_name': file_name,
                'total_products': total_products,
                'total_predictions': total_predictions,
                'avg_demand': float(avg_demand),
                'avg_confidence': float(avg_confidence)
            }
            
            db_service.save_analysis_session(session_data)
            
            # Prepare predictions for database
            db_predictions = []
            for pred in predictions:
                input_data = pred.get('input_data', {})
                db_predictions.append({
                    'product_id': input_data.get('product_id'),
                    'product_type': input_data.get('product_type'),
                    'plastic_type': input_data.get('Plastic_Type'),
                    'sale_amount': input_data.get('sale_amount', 0),
                    'discount': input_data.get('discount', 0),
                    'predicted_demand': pred.get('prediction', 0),
                    'confidence': pred.get('confidence', 0),
                    'input_data': input_data
                })
            
            db_service.save_predictions(session_id, db_predictions)
            
            # Prepare explanations for database
            db_explanations = []
            for exp in explanations:
                db_explanations.append({
                    'product_id': exp.get('product_id'),
                    'product_type': exp.get('product_type'),
                    'manufacturing_insights': exp.get('manufacturing_insights', []),
                    'supply_recommendations': exp.get('supply_recommendations', [])
                })
            
            db_service.save_explanations(session_id, db_explanations)
            
            print(f"✅ Analysis saved to database with session ID: {session_id}")
            return True
        except Exception as e:
            print(f"❌ Error saving analysis to database: {e}")
            return False
