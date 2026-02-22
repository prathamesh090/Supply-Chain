# import pickle
# import traceback
# import pandas as pd
# import numpy as np
# from xai.explainer import XAIExplainer
# import logging
# from .database_service import db_service

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# class PredictionService:
#     def __init__(self, model_path='models/demand_model.pkl'):
#         self.model_data = self.load_model(model_path)
#         self.models = self.model_data.get('models', {})
#         self.feature_names = self.model_data.get('feature_names', [])
#         self.label_encoders = self.model_data.get('label_encoders', {})
        
#         # Pass feature names to explainer
#         self.explainer = XAIExplainer(self.models, self.feature_names)
        
#         logger.info(f"Model loaded with {len(self.models)} models")
#         logger.info(f"Features: {len(self.feature_names)}")
#         logger.info(f"Sample features: {self.feature_names[:5]}")

#     def load_model(self, model_path):
#         """Load your actual trained model"""
#         try:
#             with open(model_path, 'rb') as f:
#                 model_data = pickle.load(f)
            
#             logger.info(f"Model loaded successfully")
#             logger.info(f"Available models: {list(model_data.get('models', {}).keys())}")
#             logger.info(f"Feature names sample: {model_data.get('feature_names', [])[:10]}")
            
#             return model_data
#         except Exception as e:
#             logger.error(f"Error loading model: {e}")
#             raise
    
#     def preprocess_data(self, df):
#         """Simplified preprocessing focusing on essential features"""
#         logger.info("Preprocessing input data...")
        
#         processed_df = df.copy()
        
#         # 1. Ensure basic features that your model expects
#         if 'effective_price' not in processed_df.columns:
#             processed_df['effective_price'] = processed_df['sale_amount'] * (1 - processed_df.get('discount', 0))
        
#         # 2. Encode categorical features using your model's encoders
#         categorical_cols = ['Plastic_Type', 'product_type', 'application_segment']
        
#         for col in categorical_cols:
#             if col in processed_df.columns and col in self.label_encoders:
#                 try:
#                     # Handle unseen categories
#                     unique_vals = processed_df[col].unique()
#                     for val in unique_vals:
#                         if val not in self.label_encoders[col].classes_:
#                             logger.warning(f"Unseen category '{val}' in {col}, mapping to default")
#                             default_val = self.label_encoders[col].classes_[0]
#                             processed_df[col] = processed_df[col].replace(val, default_val)
                    
#                     encoded_col = f'{col}_encoded'
#                     processed_df[encoded_col] = self.label_encoders[col].transform(processed_df[col].astype(str))
#                 except Exception as e:
#                     logger.error(f"Error encoding {col}: {e}")
#                     # Simple fallback
#                     processed_df[f'{col}_encoded'] = pd.factorize(processed_df[col])[0]
        
#         # 3. Select only features your model expects
#         available_features = [f for f in self.feature_names if f in processed_df.columns]
#         missing_features = set(self.feature_names) - set(available_features)
        
#         logger.info(f"Available features: {len(available_features)}, Missing: {len(missing_features)}")
        
#         # Add default values for missing features
#         for feature in missing_features:
#             processed_df[feature] = 0  # Default value
        
#         # Ensure correct feature order
#         final_features = [f for f in self.feature_names if f in processed_df.columns]
#         processed_df = processed_df[final_features]
        
#         # Handle any remaining missing values
#         processed_df = processed_df.fillna(0)
        
#         logger.info(f"Preprocessing complete. Final shape: {processed_df.shape}")
#         return processed_df
    
#     def predict(self, input_data):
#         """Make prediction using your ensemble model"""
#         try:
#             df = pd.DataFrame([input_data])
#             processed_data = self.preprocess_data(df)
            
#             # Get predictions from each model
#             predictions = {}
#             for model_name, model in self.models.items():
#                 try:
#                     pred = model.predict(processed_data)
#                     predictions[model_name] = float(pred[0])
#                 except Exception as e:
#                     logger.warning(f"Model {model_name} prediction failed: {e}")
#                     continue
            
#             # Simple average ensemble (adjust weights based on your model)
#             if predictions:
#                 ensemble_pred = np.mean(list(predictions.values()))
#                 confidence = self.calculate_confidence(predictions)
#             else:
#                 ensemble_pred = 0
#                 confidence = 0.5
            
#             return {
#                 "prediction": max(0, ensemble_pred),  # Ensure non-negative
#                 "model_predictions": predictions,
#                 "confidence": confidence
#             }
            
#         except Exception as e:
#             logger.error(f"Prediction error: {e}")
#             return {"error": str(e)}
    
#     def explain_prediction(self, input_data):
#         """Generate XAI explanations for your actual model"""
#         try:
#             df = pd.DataFrame([input_data])
#             processed_data = self.preprocess_data(df)
            
#             # Get explanation using your actual features
#             explanation = self.explainer.explain(processed_data, self.feature_names, input_data)
#             return explanation
            
#         except Exception as e:
#             logger.error(f"Explanation error: {e}")
#             return {
#                 "error": str(e),
#                 "manufacturing_insights": ["Analysis temporarily unavailable"],
#                 "supply_recommendations": ["Please try again shortly"]
#             }
    
#     def batch_predict(self, batch_data):
#         """Process multiple predictions"""
#         try:
#             logger.info(f"Processing {len(batch_data)} predictions")
            
#             df = pd.DataFrame(batch_data)
#             processed_data = self.preprocess_data(df)
            
#             results = []
#             for i, (index, row) in enumerate(processed_data.iterrows()):
#                 # Get prediction
#                 prediction_result = self._predict_single_row(row)
                
#                 # Get explanation
#                 explanation = self.explain_prediction(batch_data[i])
                
#                 results.append({
#                     "id": batch_data[i].get('product_id', f"row_{i}"),
#                     "prediction": prediction_result["prediction"],
#                     "confidence": prediction_result["confidence"],
#                     "input_data": batch_data[i],
#                     "explanation": explanation
#                 })
            
#             return {"predictions": results}
            
#         except Exception as e:
#             logger.error(f"Batch prediction error: {e}")
#             raise
    
#     def _predict_single_row(self, row_data):
#         """Predict single row"""
#         df_row = pd.DataFrame([row_data])
        
#         predictions = {}
#         for model_name, model in self.models.items():
#             try:
#                 pred = model.predict(df_row)
#                 predictions[model_name] = float(pred[0])
#             except Exception as e:
#                 continue
        
#         if predictions:
#             ensemble_pred = np.mean(list(predictions.values()))
#             confidence = self.calculate_confidence(predictions)
#         else:
#             ensemble_pred = 0
#             confidence = 0.5
        
#         return {
#             "prediction": max(0, ensemble_pred),
#             "confidence": confidence,
#             "model_predictions": predictions
#         }
    
#     def calculate_confidence(self, predictions):
#         """Calculate prediction confidence"""
#         if not predictions:
#             return 0.5
            
#         values = list(predictions.values())
#         if len(values) == 1:
#             return 0.8
            
#         std_dev = np.std(values)
#         max_val = max(values)
#         if max_val > 0:
#             confidence = 1 - (std_dev / max_val)
#         else:
#             confidence = 0.5
            
#         return max(0.1, min(0.99, confidence))
    
#     def save_analysis_to_db(self, session_id, file_name, predictions, explanations):
#         """Save analysis results to MySQL database"""
#         try:
#             # Calculate session statistics
#             product_ids = set()
#             for p in predictions:
#                 product_id = p.get('input_data', {}).get('product_id')
#                 if product_id:
#                     product_ids.add(product_id)
            
#             total_products = len(product_ids)
#             total_predictions = len(predictions)
#             avg_demand = np.mean([p['prediction'] for p in predictions]) if predictions else 0
#             avg_confidence = np.mean([p['confidence'] for p in predictions]) if predictions else 0
            
#             # Save session
#             session_data = {
#                 'session_id': session_id,
#                 'file_name': file_name,
#                 'total_products': total_products,
#                 'total_predictions': total_predictions,
#                 'avg_demand': float(avg_demand),
#                 'avg_confidence': float(avg_confidence)
#             }
            
#             db_service.save_analysis_session(session_data)
            
#             # Prepare predictions for database
#             db_predictions = []
#             for pred in predictions:
#                 input_data = pred.get('input_data', {})
#                 db_predictions.append({
#                     'product_id': input_data.get('product_id'),
#                     'product_type': input_data.get('product_type'),
#                     'plastic_type': input_data.get('Plastic_Type'),
#                     'sale_amount': input_data.get('sale_amount', 0),
#                     'discount': input_data.get('discount', 0),
#                     'predicted_demand': pred.get('prediction', 0),
#                     'confidence': pred.get('confidence', 0),
#                     'input_data': input_data
#                 })
            
#             db_service.save_predictions(session_id, db_predictions)
            
#             # Prepare explanations for database
#             db_explanations = []
#             for exp in explanations:
#                 db_explanations.append({
#                     'product_id': exp.get('product_id'),
#                     'product_type': exp.get('product_type'),
#                     'manufacturing_insights': exp.get('manufacturing_insights', []),
#                     'supply_recommendations': exp.get('supply_recommendations', [])
#                 })
            
#             db_service.save_explanations(session_id, db_explanations)
            
#             print(f"✅ Analysis saved to database with session ID: {session_id}")
#             return True
#         except Exception as e:
#             print(f"❌ Error saving analysis to database: {e}")
#             return False


import joblib
import traceback
import pandas as pd
import numpy as np
from xai.explainer import XAIExplainer
import logging
from .database_service import db_service
import os
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(self, model_path=None):
        self.model = None
        self.encoders = {}
        self.feature_names = []
        
        # Get the base directory
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Set default model path if not provided
        if model_path is None:
            model_path = os.path.join(self.base_dir, 'models', 'plastic_demand_model.pkl')
        
        self.model_path = model_path
        
        # Load the XGBoost model
        self.load_model(model_path)
        
        # Initialize explainer with the model (as a dictionary)
        self.explainer = XAIExplainer({"xgboost": self.model}, self.feature_names)
        
        logger.info(f"✅ XGBoost model loaded successfully")
        logger.info(f"📊 Expected features: {len(self.feature_names)}")

    def load_model(self, model_path):
        """Load the XGBoost model from train.py"""
        try:
            # Check multiple possible paths
            possible_paths = [
                model_path,  # Original path
                os.path.join(self.base_dir, 'models', 'plastic_demand_model.pkl'),
                os.path.join(self.base_dir, 'models', 'demand_model.pkl'),
                os.path.join(os.getcwd(), 'models', 'plastic_demand_model.pkl'),
                os.path.join(os.getcwd(), 'plastic_demand_model.pkl')
            ]
            
            loaded = False
            for path in possible_paths:
                if os.path.exists(path):
                    logger.info(f"✅ Found model at: {path}")
                    self.model = joblib.load(path)
                    loaded = True
                    break
            
            if not loaded:
                raise FileNotFoundError(f"Model not found. Tried: {possible_paths}")
            
            # Get feature names if available
            if hasattr(self.model, 'feature_names_in_'):
                self.feature_names = list(self.model.feature_names_in_)
                logger.info(f"📊 Model expects {len(self.feature_names)} features")
            else:
                # Define default feature names based on train.py
                self.feature_names = self._get_default_feature_names()
                logger.warning(f"Using default feature names: {len(self.feature_names)} features")
            
            # Load encoders from the models directory
            encoders_dir = os.path.dirname(model_path)
            if not os.path.exists(encoders_dir):
                encoders_dir = os.path.join(self.base_dir, 'models')
            
            self._load_encoders(encoders_dir)
            
        except Exception as e:
            logger.error(f"❌ Error loading model: {e}")
            traceback.print_exc()
            raise
    
    def _load_encoders(self, encoders_dir):
        """Load label encoders from the models directory"""
        encoder_files = {
            'product_id': 'product_encoder.pkl',
            'customer_segment': 'segment_encoder.pkl',
            'plastic_type': 'plastic_type_encoder.pkl',
            'grade': 'grade_encoder.pkl',
            'application': 'application_encoder.pkl',
            'category': 'category_encoder.pkl',
            'festival_name': 'festival_encoder.pkl'
        }
        
        for col_name, filename in encoder_files.items():
            filepath = os.path.join(encoders_dir, filename)
            if os.path.exists(filepath):
                try:
                    self.encoders[col_name] = joblib.load(filepath)
                    logger.info(f"✅ Loaded encoder: {col_name}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not load encoder {col_name}: {e}")
            else:
                logger.warning(f"⚠️ Encoder not found: {filepath}")
    
    def _get_default_feature_names(self):
        """Return the feature names from train.py"""
        return [
            'year', 'month', 'week_of_year', 'day_of_week', 'day_of_month',
            'quarter', 'day_of_year', 'weekend', 'is_month_start', 'is_month_end',
            'days_to_month_end', 'days_from_month_start', 'sin_dayofyear',
            'cos_dayofyear', 'sin_month', 'cos_month', 'sin_dayofweek', 'cos_dayofweek',
            'covid_period', 'plastic_ban_period', 'price_spike_period',
            'post_customer_loss', 'export_period', 'unit_price', 'discount_pct',
            'price_discount_interaction', 'is_discount', 'discount_intensity',
            'effective_price', 'avg_temperature', 'rainfall_mm', 'temp_rain_interaction',
            'is_rainy', 'is_heavy_rain', 'is_hot', 'is_cold', 'extreme_weather',
            'festival_flag', 'festival_week', 'major_festival', 'festival_season',
            'lag_2', 'lag_3', 'lag_14', 'lag_21', 'lag_28', 'rolling_mean_3',
            'rolling_mean_14', 'rolling_mean_21', 'rolling_mean_28', 'rolling_std_3',
            'rolling_std_14', 'rolling_std_21', 'rolling_std_28', 'exp_weighted_mean_7',
            'exp_weighted_mean_14', 'lag_diff_1', 'lag_diff_7', 'lag_pct_change_1',
            'lag_pct_change_7', 'rolling_min_7', 'rolling_max_7', 'product_id_encoded',
            'customer_segment_encoded', 'plastic_type_encoded', 'grade_encoded',
            'application_encoded', 'category_encoded', 'festival_name_encoded',
            'product_segment_interaction', 'plastic_category_interaction',
            'quantity_sold_group_mean', 'quantity_sold_group_std', 'quantity_sold_group_median',
            'quantity_sold_group_min', 'quantity_sold_group_max', 'quantity_sold_group_range',
            'quantity_sold_group_cv', 'quantity_sold_z_score', 'unit_price_group_mean',
            'unit_price_group_std', 'unit_price_group_median', 'unit_price_group_min',
            'unit_price_group_max', 'unit_price_group_range', 'unit_price_group_cv'
        ]
    
    def preprocess_data(self, df):
        """Feature engineering matching train.py - FULLY CALCULATED from data"""
        logger.info("🔧 Preprocessing input data with full feature engineering...")
        
        processed_df = df.copy()
        
        # Ensure date is datetime
        if 'date' in processed_df.columns:
            processed_df['date'] = pd.to_datetime(processed_df['date'])
        else:
            processed_df['date'] = pd.Timestamp.now()
            logger.warning("No date column found, using current date")
        
        # ===== TIME FEATURES (These will VARY based on actual dates) =====
        processed_df['year'] = processed_df['date'].dt.year
        processed_df['month'] = processed_df['date'].dt.month
        processed_df['week_of_year'] = processed_df['date'].dt.isocalendar().week.astype('int64')
        processed_df['day_of_week'] = processed_df['date'].dt.dayofweek
        processed_df['day_of_month'] = processed_df['date'].dt.day
        processed_df['quarter'] = processed_df['date'].dt.quarter
        processed_df['day_of_year'] = processed_df['date'].dt.dayofyear
        processed_df['weekend'] = (processed_df['day_of_week'] >= 5).astype(int)
        processed_df['is_month_start'] = processed_df['date'].dt.is_month_start.astype(int)
        processed_df['is_month_end'] = processed_df['date'].dt.is_month_end.astype(int)
        processed_df['days_to_month_end'] = processed_df['date'].dt.days_in_month - processed_df['date'].dt.day
        processed_df['days_from_month_start'] = processed_df['date'].dt.day - 1
        
        # Cyclical encoding (These will VARY with dates)
        processed_df['sin_dayofyear'] = np.sin(2 * np.pi * processed_df['day_of_year'] / 365.25)
        processed_df['cos_dayofyear'] = np.cos(2 * np.pi * processed_df['day_of_year'] / 365.25)
        processed_df['sin_month'] = np.sin(2 * np.pi * processed_df['month'] / 12)
        processed_df['cos_month'] = np.cos(2 * np.pi * processed_df['month'] / 12)
        processed_df['sin_dayofweek'] = np.sin(2 * np.pi * processed_df['day_of_week'] / 7)
        processed_df['cos_dayofweek'] = np.cos(2 * np.pi * processed_df['day_of_week'] / 7)
        
        # ===== SHOCK INDICATORS (Based on actual dates) =====
        processed_df['covid_period'] = ((processed_df['year'] == 2021) | (processed_df['year'] == 2022)).astype(int)
        processed_df['plastic_ban_period'] = (processed_df['date'] >= '2022-07-01').astype(int)
        processed_df['price_spike_period'] = ((processed_df['date'] >= '2022-03-01') & (processed_df['date'] < '2022-09-01')).astype(int)
        processed_df['post_customer_loss'] = (processed_df['date'] >= '2024-06-01').astype(int)
        processed_df['export_period'] = (processed_df['date'] >= '2025-02-01').astype(int)
        
        # ===== PRICE FEATURES (From input data) =====
        # Map input fields to expected feature names
        if 'unit_price' not in processed_df.columns:
            if 'sale_amount' in processed_df.columns:
                processed_df['unit_price'] = processed_df['sale_amount']
                logger.info("Using sale_amount as unit_price")
            else:
                processed_df['unit_price'] = 100
                logger.warning("No unit_price or sale_amount found, using default 100")
        
        if 'discount_pct' not in processed_df.columns:
            if 'discount' in processed_df.columns:
                # Check if discount is in decimal (0-1) or percentage
                if processed_df['discount'].max() <= 1:
                    processed_df['discount_pct'] = processed_df['discount'] * 100
                    logger.info("Converted discount (decimal) to discount_pct")
                else:
                    processed_df['discount_pct'] = processed_df['discount']
                    logger.info("Using discount as discount_pct")
            else:
                processed_df['discount_pct'] = 0
                logger.info("No discount found, using 0")
        
        # These will VARY based on actual price and discount
        processed_df['price_discount_interaction'] = processed_df['unit_price'] * (1 - processed_df['discount_pct']/100)
        processed_df['is_discount'] = (processed_df['discount_pct'] > 0).astype(int)
        processed_df['discount_intensity'] = processed_df['discount_pct']
        processed_df['effective_price'] = processed_df['unit_price'] * (1 - processed_df['discount_pct']/100)
        
        # ===== WEATHER FEATURES (From input or sensible defaults) =====
        if 'avg_temperature' in processed_df.columns:
            processed_df['avg_temperature'] = pd.to_numeric(processed_df['avg_temperature'], errors='coerce').fillna(25)
        else:
            processed_df['avg_temperature'] = 25
        
        if 'rainfall_mm' in processed_df.columns:
            processed_df['rainfall_mm'] = pd.to_numeric(processed_df['rainfall_mm'], errors='coerce').fillna(0)
        else:
            processed_df['rainfall_mm'] = 0
        
        # Weather interactions (will VARY if weather data provided)
        processed_df['temp_rain_interaction'] = processed_df['avg_temperature'] * processed_df['rainfall_mm']
        processed_df['is_rainy'] = (processed_df['rainfall_mm'] > 5).astype(int)
        processed_df['is_heavy_rain'] = (processed_df['rainfall_mm'] > 20).astype(int)
        processed_df['is_hot'] = (processed_df['avg_temperature'] > 32).astype(int)
        processed_df['is_cold'] = (processed_df['avg_temperature'] < 20).astype(int)
        processed_df['extreme_weather'] = ((processed_df['avg_temperature'] > 35) | 
                                        (processed_df['avg_temperature'] < 15) | 
                                        (processed_df['rainfall_mm'] > 50)).astype(int)
        
        # ===== FESTIVAL FEATURES (From input) =====
        if 'is_festival' in processed_df.columns:
            processed_df['festival_flag'] = processed_df['is_festival'].astype(int)
        else:
            processed_df['festival_flag'] = 0
        
        # Calculate festival_week based on actual data
        try:
            if 'festival_flag' in processed_df.columns and len(processed_df) > 0:
                processed_df['festival_week'] = processed_df.groupby(['year', 'week_of_year'])['festival_flag'].transform('max').astype(int)
            else:
                processed_df['festival_week'] = 0
        except Exception as e:
            logger.warning(f"Could not calculate festival_week: {e}")
            processed_df['festival_week'] = 0
        
        major_festivals = ['Diwali', 'Holi', 'Ganesh Chaturthi', 'Dussehra']
        if 'festival_name' in processed_df.columns:
            processed_df['major_festival'] = processed_df['festival_name'].isin(major_festivals).astype(int)
        else:
            processed_df['major_festival'] = 0
        
        processed_df['festival_season'] = (processed_df['quarter'] == 4).astype(int)
        
        # ===== ENCODE CATEGORICAL VARIABLES =====
        # Map input column names to expected ones
        col_mapping = {
            'Plastic_Type': 'plastic_type',
            'product_type': 'category',
            'application_segment': 'application'
        }
        
        for input_col, expected_col in col_mapping.items():
            if input_col in processed_df.columns and expected_col not in processed_df.columns:
                processed_df[expected_col] = processed_df[input_col]
        
        # Apply encoders if available
        categorical_cols = ['product_id', 'customer_segment', 'plastic_type', 
                        'grade', 'application', 'category', 'festival_name']
        
        for col in categorical_cols:
            if col in processed_df.columns and col in self.encoders:
                try:
                    # Convert column to string type first
                    processed_df[col] = processed_df[col].astype(str)
                    
                    # Handle unseen categories
                    unique_vals = processed_df[col].unique()
                    for val in unique_vals:
                        if val not in self.encoders[col].classes_:
                            logger.warning(f"Unseen category '{val}' in {col}, using default")
                            # Use the most common class as default
                            default_val = self.encoders[col].classes_[0]
                            processed_df.loc[processed_df[col] == val, col] = default_val
                    
                    # Transform
                    processed_df[f'{col}_encoded'] = self.encoders[col].transform(processed_df[col])
                except Exception as e:
                    logger.error(f"Error encoding {col}: {e}")
                    processed_df[f'{col}_encoded'] = 0
            else:
                # Create default encoded column
                processed_df[f'{col}_encoded'] = 0
        
        # Create interaction features (will VARY based on encodings)
        processed_df['product_segment_interaction'] = processed_df['product_id_encoded'] * 10 + processed_df['customer_segment_encoded']
        processed_df['plastic_category_interaction'] = processed_df['plastic_type_encoded'] * 10 + processed_df['category_encoded']
        
        # ===== LAG FEATURES - CALCULATED FROM ACTUAL QUANTITY SOLD =====
        if 'quantity_sold' in processed_df.columns:
            # Sort by date for proper lag calculation
            if 'date' in processed_df.columns:
                processed_df = processed_df.sort_values('date')
            
            # Calculate lags for each product separately
            for product_id in processed_df['product_id'].unique() if 'product_id' in processed_df.columns else [None]:
                mask = processed_df['product_id'] == product_id if product_id is not None else slice(None)
                
                for lag in [2, 3, 14, 21, 28]:
                    col_name = f'lag_{lag}'
                    processed_df.loc[mask, col_name] = processed_df.loc[mask, 'quantity_sold'].shift(lag)
            
            # Fill NaN lags with forward fill then 0
            for lag in [2, 3, 14, 21, 28]:
                col_name = f'lag_{lag}'
                if col_name in processed_df.columns:
                    processed_df[col_name] = processed_df[col_name].ffill().fillna(0)
            
            # Rolling features
            for window in [3, 14, 21, 28]:
                mean_col = f'rolling_mean_{window}'
                std_col = f'rolling_std_{window}'
                
                # Calculate rolling statistics
                rolling = processed_df['quantity_sold'].rolling(window, min_periods=1)
                processed_df[mean_col] = rolling.mean().bfill().fillna(processed_df['quantity_sold'])
                processed_df[std_col] = rolling.std().fillna(0)
            
            # EWMA
            processed_df['exp_weighted_mean_7'] = processed_df['quantity_sold'].ewm(span=7, adjust=False).mean().fillna(processed_df['quantity_sold'])
            processed_df['exp_weighted_mean_14'] = processed_df['quantity_sold'].ewm(span=14, adjust=False).mean().fillna(processed_df['quantity_sold'])
            
            # Momentum
            processed_df['lag_diff_1'] = processed_df['quantity_sold'].diff(1).fillna(0)
            processed_df['lag_diff_7'] = processed_df['quantity_sold'].diff(7).fillna(0)
            processed_df['lag_pct_change_1'] = processed_df['quantity_sold'].pct_change(1).fillna(0)
            processed_df['lag_pct_change_7'] = processed_df['quantity_sold'].pct_change(7).fillna(0)
            
            # Rolling min/max
            processed_df['rolling_min_7'] = processed_df['quantity_sold'].rolling(7, min_periods=1).min().fillna(processed_df['quantity_sold'])
            processed_df['rolling_max_7'] = processed_df['quantity_sold'].rolling(7, min_periods=1).max().fillna(processed_df['quantity_sold'])
        else:
            # No quantity_sold, use defaults
            logger.warning("No quantity_sold column found, using zeros for lag features")
            for lag in [2, 3, 14, 21, 28]:
                processed_df[f'lag_{lag}'] = 0
            for window in [3, 14, 21, 28]:
                processed_df[f'rolling_mean_{window}'] = 0
                processed_df[f'rolling_std_{window}'] = 0
            processed_df['exp_weighted_mean_7'] = 0
            processed_df['exp_weighted_mean_14'] = 0
            processed_df['lag_diff_1'] = 0
            processed_df['lag_diff_7'] = 0
            processed_df['lag_pct_change_1'] = 0
            processed_df['lag_pct_change_7'] = 0
            processed_df['rolling_min_7'] = 0
            processed_df['rolling_max_7'] = 0
        
        # ===== STATISTICAL FEATURES - CALCULATED FROM ACTUAL DATA =====
        stat_features = ['quantity_sold_group_mean', 'quantity_sold_group_std', 
                        'quantity_sold_group_median', 'quantity_sold_group_min',
                        'quantity_sold_group_max', 'quantity_sold_group_range',
                        'quantity_sold_group_cv', 'quantity_sold_z_score',
                        'unit_price_group_mean', 'unit_price_group_std',
                        'unit_price_group_median', 'unit_price_group_min',
                        'unit_price_group_max', 'unit_price_group_range',
                        'unit_price_group_cv']
        
        # Calculate statistics per product if possible
        if 'product_id' in processed_df.columns and 'quantity_sold' in processed_df.columns:
            for col in ['quantity_sold', 'unit_price']:
                if col in processed_df.columns:
                    # Group by product
                    group_stats = processed_df.groupby('product_id')[col].agg(['mean', 'std', 'median', 'min', 'max']).reset_index()
                    group_stats.columns = ['product_id', f'{col}_group_mean', f'{col}_group_std', 
                                        f'{col}_group_median', f'{col}_group_min', f'{col}_group_max']
                    
                    # Merge back
                    processed_df = processed_df.merge(group_stats, on='product_id', how='left')
                    
                    # Calculate derived stats
                    processed_df[f'{col}_group_range'] = processed_df[f'{col}_group_max'] - processed_df[f'{col}_group_min']
                    processed_df[f'{col}_group_cv'] = (processed_df[f'{col}_group_std'] / 
                                                    processed_df[f'{col}_group_mean'].replace(0, 1)).fillna(0)
                    
                    # Calculate z-scores
                    processed_df[f'{col}_z_score'] = ((processed_df[col] - processed_df[f'{col}_group_mean']) / 
                                                    processed_df[f'{col}_group_std'].replace(0, 1)).fillna(0)
        else:
            # No product grouping, calculate overall statistics
            for col in ['quantity_sold', 'unit_price']:
                if col in processed_df.columns:
                    mean_val = processed_df[col].mean()
                    std_val = processed_df[col].std()
                    median_val = processed_df[col].median()
                    min_val = processed_df[col].min()
                    max_val = processed_df[col].max()
                    
                    processed_df[f'{col}_group_mean'] = mean_val
                    processed_df[f'{col}_group_std'] = std_val if not pd.isna(std_val) else 1
                    processed_df[f'{col}_group_median'] = median_val
                    processed_df[f'{col}_group_min'] = min_val
                    processed_df[f'{col}_group_max'] = max_val
                    processed_df[f'{col}_group_range'] = max_val - min_val
                    processed_df[f'{col}_group_cv'] = (std_val / mean_val) if mean_val > 0 and not pd.isna(std_val) else 0
                    processed_df[f'{col}_z_score'] = ((processed_df[col] - mean_val) / std_val) if std_val > 0 else 0
                else:
                    # Default values
                    for stat in stat_features:
                        if stat not in processed_df.columns:
                            processed_df[stat] = 0
        
        # Ensure all required features exist
        for feature in self.feature_names:
            if feature not in processed_df.columns:
                logger.warning(f"Missing feature: {feature}, adding with default 0")
                processed_df[feature] = 0
        
        # Select and order features as expected by model
        final_features = [f for f in self.feature_names if f in processed_df.columns]
        processed_df = processed_df[final_features]
        
        # Fill any remaining NaN values
        processed_df = processed_df.fillna(0)
        processed_df = processed_df.replace([np.inf, -np.inf], 0)
        
        # Ensure all data is numeric
        for col in processed_df.columns:
            if not pd.api.types.is_numeric_dtype(processed_df[col]):
                try:
                    processed_df[col] = pd.to_numeric(processed_df[col], errors='coerce').fillna(0)
                except:
                    processed_df[col] = 0
        
        logger.info(f"✅ Preprocessing complete. Final shape: {processed_df.shape}")
        logger.info(f"✅ Features with variance: {(processed_df.var() > 0).sum()} out of {len(processed_df.columns)}")
        
        return processed_df
    
    def _calculate_confidence(self, prediction):
        """Calculate confidence score for prediction"""
        # Simple confidence based on prediction magnitude
        base_confidence = 0.85
        
        # Adjust confidence based on prediction value (very high/low predictions might be less certain)
        if prediction > 10000:  # Very high demand
            confidence = base_confidence * 0.9
        elif prediction < 10:  # Very low demand
            confidence = base_confidence * 0.95
        else:
            confidence = base_confidence
        
        return min(0.99, max(0.5, confidence))
    
    def explain_prediction(self, input_data):
        """Generate XAI explanations"""
        try:
            df = pd.DataFrame([input_data])
            processed_data = self.preprocess_data(df)
            
            # Get explanation using XAIExplainer
            explanation = self.explainer.explain(processed_data, self.feature_names, input_data)
            return explanation
            
        except Exception as e:
            logger.error(f"❌ Explanation error: {e}")
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
            
            # Make batch predictions
            predictions = self.model.predict(processed_data)
            
            results = []
            for i, (index, row) in enumerate(processed_data.iterrows()):
                prediction = float(predictions[i])
                confidence = self._calculate_confidence(prediction)
                
                # Get explanation for this row
                explanation = self.explain_prediction(batch_data[i])
                
                # Get input data with proper field mapping
                input_item = batch_data[i]
                
                results.append({
                    "id": input_item.get('product_id', f"row_{i}"),
                    "prediction": max(0, prediction),
                    "confidence": confidence,
                    "input_data": {
                        "product_id": input_item.get('product_id', 'N/A'),
                        "product_type": input_item.get('product_type', input_item.get('category', 'N/A')),
                        "Plastic_Type": input_item.get('Plastic_Type', input_item.get('plastic_type', 'N/A')),
                        "sale_amount": input_item.get('sale_amount', input_item.get('unit_price', 0)),
                        "discount": input_item.get('discount', input_item.get('discount_pct', 0)) / 100 if input_item.get('discount_pct', 0) > 1 else input_item.get('discount', 0)
                    },
                    "explanation": explanation
                })
            
            return {"predictions": results}
            
        except Exception as e:
            logger.error(f"❌ Batch prediction error: {e}")
            traceback.print_exc()
            raise
    
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
            
            logger.info(f"✅ Analysis saved to database with session ID: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving analysis to database: {e}")
            return False
