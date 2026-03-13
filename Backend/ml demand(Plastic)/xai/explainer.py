# # xai/explainer.py - COMPLETELY DYNAMIC VERSION
# import numpy as np
# import pandas as pd
# import shap
# from io import BytesIO
# import base64
# import matplotlib
# matplotlib.use('Agg')
# import matplotlib.pyplot as plt
# import seaborn as sns

# class XAIExplainer:
#     def __init__(self, models, feature_names):
#         self.models = models
#         self.feature_names = feature_names
#         self.shap_explainer = None
#         self.column_mappings = self._create_column_mappings()
        
#     def _create_column_mappings(self):
#         """Dynamically create mappings based on actual feature names"""
#         mappings = {}
        
#         # Map feature names to human-readable labels
#         for feature in self.feature_names:
#             if 'sale_amount' in feature:
#                 mappings[feature] = 'Product Price'
#             elif 'discount' in feature:
#                 mappings[feature] = 'Discount Rate'
#             elif 'Plastic_Type' in feature:
#                 mappings[feature] = 'Material Type'
#             elif 'product_type' in feature:
#                 mappings[feature] = 'Product Category'
#             elif 'application_segment' in feature:
#                 mappings[feature] = 'Market Application'
#             elif 'precpt' in feature:
#                 mappings[feature] = 'Weather Conditions'
#             elif 'holiday_flag' in feature:
#                 mappings[feature] = 'Holiday Effect'
#             elif 'is_weekend' in feature:
#                 mappings[feature] = 'Weekend Effect'
#             elif 'quantity' in feature:
#                 mappings[feature] = 'Historical Sales'
#             elif 'lag_' in feature:
#                 mappings[feature] = f'Previous Day {feature.split("_")[1]}'
#             elif 'rolling_' in feature:
#                 mappings[feature] = f'{feature.split("_")[1]}-Day Average'
#             elif 'sale_per_hour' in feature:
#                 mappings[feature] = 'Sales Rate per Hour'
#             elif 'effective_price' in feature:
#                 mappings[feature] = 'Final Price'
#             elif 'price_discount' in feature:
#                 mappings[feature] = 'Price-Discount Strategy'
#             elif 'cluster' in feature:
#                 mappings[feature] = 'Product Grouping'
#             elif 'percentile' in feature:
#                 mappings[feature] = 'Market Position'
#             elif 'competitor' in feature:
#                 mappings[feature] = 'Competitive Pressure'
#             else:
#                 # Default: humanize the feature name
#                 mappings[feature] = feature.replace('_', ' ').title()
        
#         return mappings
    
#     def explain(self, input_data, feature_names, row_data=None):
#         """Generate dynamic XAI explanations based on actual data"""
#         model_for_explanation = self._get_model_for_explanation()
        
#         if model_for_explanation is None:
#             return {"error": "No valid model available for explanation"}
        
#         # Get SHAP explanation
#         shap_explanation = self.shap_explanation(input_data, feature_names, model_for_explanation)
        
#         # Generate insights based on actual data values
#         manufacturing_insights = self.generate_dynamic_insights(shap_explanation, row_data)
#         supply_recommendations = self.generate_dynamic_recommendations(shap_explanation, row_data)
        
#         explanations = {
#             "manufacturing_insights": manufacturing_insights,
#             "supply_recommendations": supply_recommendations,
#             "product_context": self._get_product_context(row_data) if row_data else {},
#             "demand_indicators": self.get_dynamic_indicators(row_data),
#             "risk_assessment": self.assess_dynamic_risk(row_data),
#             "feature_analysis": self.analyze_feature_impacts(shap_explanation),
#             "data_quality": self.assess_data_quality(row_data)
#         }
        
#         return explanations
    
#     def generate_dynamic_insights(self, shap_explanation, row_data):
#         """Generate insights dynamically based on actual data values"""
#         insights = []
        
#         if not row_data:
#             return [{"text": "Upload data to generate insights", "type": "neutral", "icon": "📊"}]
        
#         if 'error' in shap_explanation:
#             return [{"text": "Analyzing your data patterns...", "type": "neutral", "icon": "🔍"}]
        
#         # Extract actual values from the data
#         values = self._extract_values(row_data)
        
#         # Generate insights based on actual values, not hardcoded thresholds
#         insights.extend(self._generate_price_insights(values))
#         insights.extend(self._generate_demand_insights(values))
#         insights.extend(self._generate_market_insights(values))
#         insights.extend(self._generate_temporal_insights(values))
        
#         # Add SHAP-based insights if available
#         if 'error' not in shap_explanation:
#             insights.extend(self._generate_shap_insights(shap_explanation, values))
        
#         # Ensure we have meaningful insights
#         if not insights:
#             insights.append({
#                 "text": "Review your product data for specific opportunities",
#                 "type": "neutral", 
#                 "icon": "📈",
#                 "impact": "medium"
#             })
        
#         return insights[:6]  # Return top 6 insights
    
#     def _extract_values(self, row_data):
#         """Extract and normalize values from row data"""
#         values = {}
        
#         # Your actual column names
#         columns = [
#             'product_id', 'sale_amount', 'discount', 'holiday_flag', 'precpt',
#             'Plastic_Type', 'quantity', 'year', 'month', 'day', 'week_of_year',
#             'is_weekend', 'lag_1', 'rolling_7', 'sale_per_hour', 'product_type',
#             'application_segment'
#         ]
        
#         for col in columns:
#             values[col] = row_data.get(col, None)
        
#         # Calculate derived values
#         values['effective_price'] = values.get('sale_amount', 0) * (1 - values.get('discount', 0))
#         values['revenue'] = values.get('sale_amount', 0) * values.get('quantity', 0)
        
#         return values
    
#     def _generate_price_insights(self, values):
#         """Generate price-related insights based on actual values"""
#         insights = []
#         sale_amount = values.get('sale_amount', 0)
#         discount = values.get('discount', 0)
        
#         if sale_amount > 0:
#             # Dynamic thresholds based on typical ranges
#             if sale_amount > 150:
#                 insights.append({
#                     "text": "Premium pricing segment indicates high-value product positioning",
#                     "type": "positive",
#                     "icon": "💰",
#                     "impact": "high"
#                 })
#             elif sale_amount < 50:
#                 insights.append({
#                     "text": "Competitive pricing may drive volume in value segments",
#                     "type": "info",
#                     "icon": "📊",
#                     "impact": "medium"
#                 })
            
#             if discount > 0.2:
#                 insights.append({
#                     "text": "Significant discounting may stimulate demand but impact margins",
#                     "type": "warning",
#                     "icon": "🎯",
#                     "impact": "medium"
#                 })
#             elif discount < 0.05:
#                 insights.append({
#                     "text": "Minimal discounting suggests strong brand positioning",
#                     "type": "positive",
#                     "icon": "🛡️",
#                     "impact": "high"
#                 })
        
#         return insights
    
#     def _generate_demand_insights(self, values):
#         """Generate demand-related insights"""
#         insights = []
#         quantity = values.get('quantity', 0)
#         rolling_avg = values.get('rolling_7', 0)
        
#         if quantity > 0:
#             # Dynamic demand analysis
#             if quantity > 1000:
#                 insights.append({
#                     "text": "High volume product with significant market demand",
#                     "type": "positive",
#                     "icon": "📈",
#                     "impact": "high"
#                 })
#             elif quantity > 500:
#                 insights.append({
#                     "text": "Solid demand levels supporting current production",
#                     "type": "positive",
#                     "icon": "✅",
#                     "impact": "medium"
#                 })
            
#             # Trend analysis
#             if rolling_avg > 0 and quantity > rolling_avg * 1.2:
#                 insights.append({
#                     "text": "Current demand exceeds 7-day average trend",
#                     "type": "positive",
#                     "icon": "🚀",
#                     "impact": "high"
#                 })
        
#         return insights
    
#     def _generate_market_insights(self, values):
#         """Generate market and segment insights"""
#         insights = []
        
#         plastic_type = values.get('Plastic_Type', '')
#         product_type = values.get('product_type', '')
#         application = values.get('application_segment', '')
        
#         # Material-specific insights
#         if plastic_type:
#             material_context = {
#                 'PET': "widely used in packaging and beverages",
#                 'HDPE': "preferred for durable containers and industrial use",
#                 'PP': "versatile material with automotive and consumer applications",
#                 'PVC': "common in construction and infrastructure projects"
#             }
            
#             if plastic_type in material_context:
#                 insights.append({
#                     "text": f"{plastic_type} is {material_context[plastic_type]}",
#                     "type": "info",
#                     "icon": "🔬",
#                     "impact": "medium"
#                 })
        
#         # Application segment insights
#         if application:
#             segment_context = {
#                 'Packaging': "subject to retail and consumer demand patterns",
#                 'Industrial': "driven by B2B contracts and industrial activity",
#                 'Consumer': "influenced by seasonal and promotional activities",
#                 'Construction': "dependent on infrastructure and building cycles"
#             }
            
#             if application in segment_context:
#                 insights.append({
#                     "text": f"{application} segment {segment_context[application]}",
#                     "type": "info",
#                     "icon": "🏢",
#                     "impact": "medium"
#                 })
        
#         return insights
    
#     def _generate_temporal_insights(self, values):
#         """Generate time-based insights"""
#         insights = []
        
#         month = values.get('month', None)
#         is_weekend = values.get('is_weekend', 0)
#         holiday_flag = values.get('holiday_flag', 0)
        
#         # Seasonal patterns
#         if month in [4, 5, 6]:  # Spring months
#             insights.append({
#                 "text": "Spring season typically shows increased packaging demand",
#                 "type": "info",
#                 "icon": "🌱",
#                 "impact": "medium"
#             })
#         elif month in [10, 11, 12]:  # Fall/Winter
#             insights.append({
#                 "text": "Year-end period may affect industrial demand patterns",
#                 "type": "info",
#                 "icon": "🎄",
#                 "impact": "medium"
#             })
        
#         # Weekend/holiday effects
#         if is_weekend == 1:
#             insights.append({
#                 "text": "Weekend data may reflect different consumption patterns",
#                 "type": "info",
#                 "icon": "📅",
#                 "impact": "low"
#             })
        
#         if holiday_flag == 1:
#             insights.append({
#                 "text": "Holiday period can influence retail and packaging demand",
#                 "type": "info",
#                 "icon": "🎉",
#                 "impact": "medium"
#             })
        
#         return insights
    
#     def _generate_shap_insights(self, shap_explanation, values):
#         """Generate insights from SHAP values"""
#         insights = []
        
#         # Get top influential features
#         feature_impacts = []
#         for i, feature in enumerate(shap_explanation.get('feature_names', [])):
#             impact = shap_explanation['shap_values'][i]
#             feature_impacts.append((feature, impact))
        
#         # Sort by absolute impact
#         feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
        
#         # Create insights from top features
#         for feature, impact in feature_impacts[:3]:
#             human_name = self.column_mappings.get(feature, feature)
            
#             if abs(impact) > 0.1:  # Significant impact threshold
#                 direction = "increasing" if impact > 0 else "reducing"
#                 insights.append({
#                     "text": f"{human_name} is {direction} predicted demand",
#                     "type": "positive" if impact > 0 else "warning",
#                     "icon": "📊",
#                     "impact": "high" if abs(impact) > 0.2 else "medium"
#                 })
        
#         return insights
    
#     def generate_dynamic_recommendations(self, shap_explanation, row_data):
#         """Generate recommendations based on actual data patterns"""
#         recommendations = []
        
#         if not row_data:
#             return [{
#                 "text": "Upload your product data for specific recommendations",
#                 "type": "neutral",
#                 "icon": "📥",
#                 "action": "data_upload"
#             }]
        
#         values = self._extract_values(row_data)
        
#         # Production recommendations based on volume
#         quantity = values.get('quantity', 0)
#         if quantity > 800:
#             recommendations.append({
#                 "text": "Consider scaling production to meet high demand levels",
#                 "type": "urgent",
#                 "icon": "🏭",
#                 "action": "scale_production"
#             })
#         elif quantity > 400:
#             recommendations.append({
#                 "text": "Maintain current production with quality focus",
#                 "type": "stable",
#                 "icon": "⚖️",
#                 "action": "maintain_production"
#             })
        
#         # Inventory recommendations based on material type
#         plastic_type = values.get('Plastic_Type', '')
#         if plastic_type:
#             recommendations.append({
#                 "text": f"Monitor {plastic_type} raw material market trends",
#                 "type": "planning",
#                 "icon": "📦",
#                 "action": "inventory_management"
#             })
        
#         # Pricing strategy recommendations
#         discount = values.get('discount', 0)
#         if discount > 0.15:
#             recommendations.append({
#                 "text": "Review discount strategy for optimal margin balance",
#                 "type": "optimization",
#                 "icon": "💳",
#                 "action": "pricing_review"
#             })
        
#         # Market segment recommendations
#         application = values.get('application_segment', '')
#         if application:
#             recommendations.append({
#                 "text": f"Analyze {application} segment growth opportunities",
#                 "type": "strategic",
#                 "icon": "🎯",
#                 "action": "market_analysis"
#             })
        
#         return recommendations[:4]
    
#     def get_dynamic_indicators(self, row_data):
#         """Get dynamic indicators based on actual data"""
#         if not row_data:
#             return {}
        
#         values = self._extract_values(row_data)
#         indicators = {}
        
#         # Price positioning (dynamic ranges)
#         sale_amount = values.get('sale_amount', 0)
#         if sale_amount > 120:
#             indicators['price_position'] = 'premium'
#         elif sale_amount > 70:
#             indicators['price_position'] = 'mid-market'
#         else:
#             indicators['price_position'] = 'value'
        
#         # Volume classification
#         quantity = values.get('quantity', 0)
#         if quantity > 750:
#             indicators['volume_tier'] = 'high-volume'
#         elif quantity > 350:
#             indicators['volume_tier'] = 'medium-volume'
#         else:
#             indicators['volume_tier'] = 'low-volume'
        
#         # Market timing
#         month = values.get('month', None)
#         if month in [3, 4, 5]:
#             indicators['seasonal_trend'] = 'spring-demand'
#         elif month in [9, 10, 11]:
#             indicators['seasonal_trend'] = 'autumn-demand'
#         else:
#             indicators['seasonal_trend'] = 'standard-demand'
        
#         return indicators
    
#     def assess_dynamic_risk(self, row_data):
#         """Dynamically assess risks based on data patterns"""
#         risks = []
        
#         if not row_data:
#             return {
#                 "overall_risk": "unknown",
#                 "risk_factors": [{"factor": "Data Required", "risk_level": "unknown", "description": "Upload data for risk assessment"}],
#                 "confidence": "low"
#             }
        
#         values = self._extract_values(row_data)
        
#         # Demand volatility risk
#         quantity = values.get('quantity', 0)
#         rolling_avg = values.get('rolling_7', 0)
        
#         if rolling_avg > 0 and abs(quantity - rolling_avg) / rolling_avg > 0.3:
#             risks.append({
#                 "factor": "Demand Volatility",
#                 "risk_level": "medium",
#                 "description": "Current demand significantly differs from recent average",
#                 "mitigation": "Implement flexible production planning"
#             })
        
#         # Price competition risk
#         discount = values.get('discount', 0)
#         if discount > 0.25:
#             risks.append({
#                 "factor": "Price Competition",
#                 "risk_level": "medium",
#                 "description": "High discount rates may indicate market pressure",
#                 "mitigation": "Review competitive positioning and value proposition"
#             })
        
#         # General risks
#         risks.extend([
#             {
#                 "factor": "Supply Chain",
#                 "risk_level": "low",
#                 "description": "Standard supply chain monitoring recommended",
#                 "mitigation": "Maintain supplier relationships and safety stock"
#             },
#             {
#                 "factor": "Market Conditions",
#                 "risk_level": "low",
#                 "description": "Monitor industry trends and economic indicators",
#                 "mitigation": "Regular market analysis and scenario planning"
#             }
#         ])
        
#         return {
#             "overall_risk": "low" if len([r for r in risks if r['risk_level'] == 'high']) == 0 else "medium",
#             "risk_factors": risks[:3],
#             "confidence": "high"
#         }
    
#     def assess_data_quality(self, row_data):
#         """Assess the quality and completeness of provided data"""
#         if not row_data:
#             return {"score": 0, "issues": ["No data provided"], "status": "poor"}
        
#         # Check for critical fields
#         critical_fields = ['product_id', 'sale_amount', 'quantity', 'Plastic_Type']
#         missing_fields = [field for field in critical_fields if field not in row_data or row_data[field] is None]
        
#         # Check data validity
#         issues = []
#         if missing_fields:
#             issues.append(f"Missing critical fields: {', '.join(missing_fields)}")
        
#         sale_amount = row_data.get('sale_amount', 0)
#         if sale_amount <= 0:
#             issues.append("Invalid sale amount")
        
#         quantity = row_data.get('quantity', 0)
#         if quantity < 0:
#             issues.append("Invalid quantity")
        
#         # Calculate quality score
#         score = max(0, 100 - len(issues) * 20)
#         status = "excellent" if score >= 80 else "good" if score >= 60 else "fair" if score >= 40 else "poor"
        
#         return {
#             "score": score,
#             "issues": issues,
#             "status": status,
#             "message": "Data quality good" if score >= 60 else "Review data quality"
#         }
    
#     def analyze_feature_impacts(self, shap_explanation):
#         """Analyze feature impacts dynamically"""
#         if 'error' in shap_explanation:
#             return {"error": "Unable to analyze feature impacts"}
        
#         feature_impacts = []
#         for i, feature in enumerate(shap_explanation.get('feature_names', [])):
#             impact = shap_explanation['shap_values'][i]
#             human_name = self.column_mappings.get(feature, feature)
            
#             feature_impacts.append({
#                 "feature": human_name,
#                 "technical_name": feature,
#                 "impact": impact,
#                 "direction": "increases" if impact > 0 else "decreases",
#                 "magnitude": abs(impact),
#                 "significance": "high" if abs(impact) > 0.2 else "medium" if abs(impact) > 0.1 else "low"
#             })
        
#         # Sort by impact magnitude
#         feature_impacts.sort(key=lambda x: x['magnitude'], reverse=True)
        
#         return {
#             "top_positive": [f for f in feature_impacts if f['impact'] > 0][:3],
#             "top_negative": [f for f in feature_impacts if f['impact'] < 0][:3],
#             "most_influential": feature_impacts[:5],
#             "total_features": len(feature_impacts)
#         }
    
#     def _get_product_context(self, row_data):
#         """Extract product context dynamically"""
#         if not row_data:
#             return {}
        
#         return {
#             "product_id": row_data.get('product_id', 'Unknown'),
#             "plastic_type": row_data.get('Plastic_Type', 'Unknown'),
#             "product_type": row_data.get('product_type', 'Unknown'),
#             "application": row_data.get('application_segment', 'Unknown'),
#             "current_price": f"${row_data.get('sale_amount', 0):.2f}",
#             "discount_rate": f"{(row_data.get('discount', 0) * 100):.1f}%",
#             "historical_volume": row_data.get('quantity', 0),
#             "data_quality": self.assess_data_quality(row_data)['status']
#         }
    
#     def _get_model_for_explanation(self):
#         """Get the best model for explanations"""
#         if not self.models:
#             return None
        
#         preferred_models = ['xgboost', 'lightgbm', 'random_forest']
#         for model_name in preferred_models:
#             if model_name in self.models:
#                 return self.models[model_name]
        
#         return list(self.models.values())[0]
    
#     def shap_explanation(self, input_data, feature_names, model):
#         """Generate SHAP values explanation"""
#         try:
#             if hasattr(input_data, 'iloc'):
#                 input_data_values = input_data.values
#             else:
#                 input_data_values = input_data.reshape(1, -1) if len(input_data.shape) == 1 else input_data
            
#             explainer = shap.TreeExplainer(model)
#             shap_values = explainer.shap_values(input_data_values)
            
#             if isinstance(shap_values, list):
#                 shap_values = shap_values[0]
            
#             if hasattr(shap_values, 'shape') and len(shap_values.shape) > 1:
#                 shap_values = shap_values[0]
            
#             return {
#                 "shap_values": shap_values.tolist() if hasattr(shap_values, 'tolist') else [float(shap_values)],
#                 "base_value": float(explainer.expected_value),
#                 "feature_names": feature_names
#             }
#         except Exception as e:
#             print(f"SHAP explanation error: {e}")
#             return {"error": f"SHAP explanation failed: {str(e)}"}

# xai/explainer.py - IMPROVED VERSION
import numpy as np
import pandas as pd
import shap
from io import BytesIO
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

class XAIExplainer:
    def __init__(self, models, feature_names):
        self.models = models
        self.feature_names = feature_names
        self.shap_explainer = None
        
    def explain(self, input_data, feature_names, row_data=None):
        """Generate explanations based on actual product data and SHAP analysis"""
        print(f"Starting explanation for product: {row_data.get('product_id', 'Unknown') if row_data else 'Unknown'}")
        
        # Get model for explanation
        model_for_explanation = self._get_model_for_explanation()
        if model_for_explanation is None:
            return {"error": "No valid model available for explanation"}
        
        # Get SHAP explanation
        shap_explanation = self.shap_explanation(input_data, feature_names, model_for_explanation)
        
        # Generate explanations based on actual data
        manufacturing_insights = self.generate_product_specific_insights(shap_explanation, row_data)
        supply_recommendations = self.generate_actionable_recommendations(shap_explanation, row_data)
        feature_analysis = self.analyze_feature_impacts_detailed(shap_explanation, row_data)
        
        # Enhanced: add temporal, lag/momentum, and price elasticity analysis
        temporal_insights = self._generate_temporal_pattern_analysis(shap_explanation, input_data, row_data)
        lag_momentum = self._generate_lag_momentum_analysis(shap_explanation, input_data)
        price_elasticity = self._generate_price_elasticity_insights(shap_explanation, input_data, row_data)
        
        # Merge extra insights into manufacturing_insights
        manufacturing_insights.extend(temporal_insights)
        manufacturing_insights.extend(lag_momentum)
        manufacturing_insights.extend(price_elasticity)
        
        # Deduplicate and cap
        seen_texts = set()
        unique_insights = []
        for insight in manufacturing_insights:
            text = insight.get('text', '')
            if text and text not in seen_texts:
                seen_texts.add(text)
                unique_insights.append(insight)
        manufacturing_insights = unique_insights[:8]  # Return top 8 insights
        
        explanations = {
            "manufacturing_insights": manufacturing_insights,
            "supply_recommendations": supply_recommendations,
            "product_context": self._get_detailed_product_context(row_data),
            "demand_indicators": self.get_demand_indicators(row_data),
            "risk_assessment": self.assess_comprehensive_risk(row_data, shap_explanation),
            "feature_analysis": feature_analysis,
            "prediction_quality": self.assess_prediction_quality(shap_explanation),
            "unique_product_characteristics": self.identify_unique_factors(row_data, shap_explanation)
        }
        
        print(f"Generated {len(manufacturing_insights)} insights and {len(supply_recommendations)} recommendations")
        return explanations
    
    def _generate_temporal_pattern_analysis(self, shap_explanation, input_data, row_data):
        """Analyze temporal features like cyclical encodings, shock periods, and seasons"""
        insights = []
        
        if not hasattr(input_data, 'iloc') and not hasattr(input_data, 'columns'):
            return insights
        
        try:
            df = input_data if hasattr(input_data, 'iloc') else pd.DataFrame([input_data])
            
            # Check shock period indicators
            if 'covid_period' in df.columns and df['covid_period'].iloc[0] == 1:
                insights.append({
                    "text": "Data falls within COVID impact period (2021-2022) — demand patterns may reflect pandemic disruptions",
                    "type": "warning",
                    "icon": "🦠",
                    "impact": "high",
                    "category": "temporal"
                })
            
            if 'plastic_ban_period' in df.columns and df['plastic_ban_period'].iloc[0] == 1:
                insights.append({
                    "text": "Post-plastic-ban period (after Jul 2022) — regulatory shifts are influencing material demand",
                    "type": "info",
                    "icon": "⚖️",
                    "impact": "high",
                    "category": "temporal"
                })
            
            if 'price_spike_period' in df.columns and df['price_spike_period'].iloc[0] == 1:
                insights.append({
                    "text": "Historical price spike period (Mar-Sep 2022) — pricing volatility affects baseline demand",
                    "type": "warning",
                    "icon": "📈",
                    "impact": "medium",
                    "category": "temporal"
                })
            
            if 'export_period' in df.columns and df['export_period'].iloc[0] == 1:
                insights.append({
                    "text": "Export-active period (post Feb 2025) — international demand channels contributing to forecast",
                    "type": "positive",
                    "icon": "🌍",
                    "impact": "medium",
                    "category": "temporal"
                })
            
            # Seasonal analysis
            if 'quarter' in df.columns:
                quarter = int(df['quarter'].iloc[0])
                quarter_context = {
                    1: ("Q1 (Jan-Mar) typically shows lower packaging demand post-holiday season", "info"),
                    2: ("Q2 (Apr-Jun) spring season drives increased production and packaging needs", "positive"),
                    3: ("Q3 (Jul-Sep) monsoon/summer season creates mixed demand patterns", "info"),
                    4: ("Q4 (Oct-Dec) festival season drives peak demand for consumer plastics", "positive")
                }
                if quarter in quarter_context:
                    text, itype = quarter_context[quarter]
                    insights.append({
                        "text": text,
                        "type": itype,
                        "icon": "📅",
                        "impact": "medium",
                        "category": "temporal"
                    })
            
            # Weekend effect
            if 'weekend' in df.columns and df['weekend'].iloc[0] == 1:
                insights.append({
                    "text": "Weekend data point — industrial demand typically lower, consumer patterns may differ",
                    "type": "info",
                    "icon": "🗓️",
                    "impact": "low",
                    "category": "temporal"
                })
            
            # Festival effects
            if 'festival_flag' in df.columns and df['festival_flag'].iloc[0] == 1:
                extra = ""
                if 'major_festival' in df.columns and df['major_festival'].iloc[0] == 1:
                    extra = " (major festival detected — Diwali/Holi/Ganesh Chaturthi/Dussehra level)"
                insights.append({
                    "text": f"Festival period active{extra} — consumer packaging demand may spike 15-30%",
                    "type": "positive",
                    "icon": "🎉",
                    "impact": "high",
                    "category": "temporal"
                })
        except Exception as e:
            print(f"Temporal analysis error: {e}")
        
        return insights[:3]  # Limit temporal insights
    
    def _generate_lag_momentum_analysis(self, shap_explanation, input_data):
        """Analyze lag features, rolling means, and EWMA to describe recent demand trends"""
        insights = []
        
        if not hasattr(input_data, 'iloc') and not hasattr(input_data, 'columns'):
            return insights
        
        try:
            df = input_data if hasattr(input_data, 'iloc') else pd.DataFrame([input_data])
            
            # Check lag differences for trend
            lag_diff_1 = float(df['lag_diff_1'].iloc[0]) if 'lag_diff_1' in df.columns else None
            lag_diff_7 = float(df['lag_diff_7'].iloc[0]) if 'lag_diff_7' in df.columns else None
            
            if lag_diff_1 is not None and lag_diff_7 is not None:
                if lag_diff_1 > 0 and lag_diff_7 > 0:
                    insights.append({
                        "text": f"Demand momentum is positive — both daily (+{lag_diff_1:.0f}) and weekly (+{lag_diff_7:.0f}) trends are upward",
                        "type": "positive",
                        "icon": "📈",
                        "impact": "high",
                        "category": "momentum"
                    })
                elif lag_diff_1 < 0 and lag_diff_7 < 0:
                    insights.append({
                        "text": f"Demand is declining — daily ({lag_diff_1:.0f}) and weekly ({lag_diff_7:.0f}) momentum both negative",
                        "type": "warning",
                        "icon": "📉",
                        "impact": "high",
                        "category": "momentum"
                    })
                elif lag_diff_1 > 0 and lag_diff_7 < 0:
                    insights.append({
                        "text": "Short-term recovery detected — daily trend is positive despite negative weekly trend",
                        "type": "info",
                        "icon": "🔄",
                        "impact": "medium",
                        "category": "momentum"
                    })
            
            # Rolling mean comparison
            rm3 = float(df['rolling_mean_3'].iloc[0]) if 'rolling_mean_3' in df.columns else None
            rm28 = float(df['rolling_mean_28'].iloc[0]) if 'rolling_mean_28' in df.columns else None
            
            if rm3 is not None and rm28 is not None and rm28 > 0:
                ratio = rm3 / rm28
                if ratio > 1.15:
                    insights.append({
                        "text": f"Short-term demand ({rm3:.0f} avg/3d) is {((ratio-1)*100):.0f}% above monthly baseline ({rm28:.0f} avg/28d) — surge detected",
                        "type": "positive",
                        "icon": "🚀",
                        "impact": "high",
                        "category": "momentum"
                    })
                elif ratio < 0.85:
                    insights.append({
                        "text": f"Short-term demand ({rm3:.0f} avg/3d) is {((1-ratio)*100):.0f}% below monthly baseline ({rm28:.0f} avg/28d) — slowdown detected",
                        "type": "warning",
                        "icon": "⏬",
                        "impact": "medium",
                        "category": "momentum"
                    })
                else:
                    insights.append({
                        "text": f"Demand is stable — 3-day average ({rm3:.0f}) aligns with 28-day baseline ({rm28:.0f})",
                        "type": "positive",
                        "icon": "✅",
                        "impact": "low",
                        "category": "momentum"
                    })
            
            # Volatility from rolling std
            rs3 = float(df['rolling_std_3'].iloc[0]) if 'rolling_std_3' in df.columns else None
            if rs3 is not None and rm3 is not None and rm3 > 0:
                cv = rs3 / rm3  # coefficient of variation
                if cv > 0.3:
                    insights.append({
                        "text": f"High demand volatility detected (CV={cv:.2f}) — consider safety stock buffers",
                        "type": "warning",
                        "icon": "⚡",
                        "impact": "medium",
                        "category": "momentum"
                    })
        except Exception as e:
            print(f"Lag momentum analysis error: {e}")
        
        return insights[:2]  # Limit momentum insights
    
    def _generate_price_elasticity_insights(self, shap_explanation, input_data, row_data):
        """Analyze price features and discount interactions"""
        insights = []
        
        if not hasattr(input_data, 'iloc') and not hasattr(input_data, 'columns'):
            return insights
        
        try:
            df = input_data if hasattr(input_data, 'iloc') else pd.DataFrame([input_data])
            
            unit_price = float(df['unit_price'].iloc[0]) if 'unit_price' in df.columns else None
            effective_price = float(df['effective_price'].iloc[0]) if 'effective_price' in df.columns else None
            discount_pct = float(df['discount_pct'].iloc[0]) if 'discount_pct' in df.columns else None
            discount_intensity = float(df['discount_intensity'].iloc[0]) if 'discount_intensity' in df.columns else None
            is_discount = int(df['is_discount'].iloc[0]) if 'is_discount' in df.columns else None
            
            if unit_price and effective_price and unit_price > 0:
                price_gap = unit_price - effective_price
                if price_gap > 0:
                    insights.append({
                        "text": f"Pricing analysis: ₹{unit_price:.0f} list price → ₹{effective_price:.0f} effective price (₹{price_gap:.0f} discount value captured by buyer)",
                        "type": "info",
                        "icon": "💲",
                        "impact": "medium",
                        "category": "pricing"
                    })
            
            if discount_pct is not None and discount_pct > 15:
                # Check SHAP impact of discount features
                if 'shap_values' in shap_explanation and 'feature_names' in shap_explanation:
                    discount_features = ['discount_pct', 'discount_intensity', 'is_discount', 'effective_price']
                    total_discount_impact = 0
                    for fn, sv in zip(shap_explanation['feature_names'], shap_explanation['shap_values']):
                        if fn in discount_features:
                            total_discount_impact += sv
                    
                    if total_discount_impact > 0.1:
                        insights.append({
                            "text": f"Heavy discounting ({discount_pct:.0f}%) is actively driving demand up (SHAP impact: +{total_discount_impact:.3f}) — price-sensitive segment",
                            "type": "positive",
                            "icon": "🎯",
                            "impact": "high",
                            "category": "pricing"
                        })
                    elif total_discount_impact < -0.1:
                        insights.append({
                            "text": f"Despite {discount_pct:.0f}% discount, model predicts lower demand — discounting alone may not drive this product's sales",
                            "type": "warning",
                            "icon": "⚠️",
                            "impact": "medium",
                            "category": "pricing"
                        })
        except Exception as e:
            print(f"Price elasticity analysis error: {e}")
        
        return insights[:2]  # Limit pricing insights
    
    def _make_feature_readable(self, feature_name):
        """Convert technical feature names to readable format — comprehensive mapping"""
        mappings = {
            # Time features
            'year': 'Year',
            'month': 'Month',
            'week_of_year': 'Week of Year',
            'day_of_week': 'Day of Week',
            'day_of_month': 'Day of Month',
            'quarter': 'Quarter',
            'day_of_year': 'Day of Year',
            'weekend': 'Weekend Flag',
            'is_month_start': 'Month Start',
            'is_month_end': 'Month End',
            'days_to_month_end': 'Days to Month End',
            'days_from_month_start': 'Days from Month Start',
            # Cyclical encodings
            'sin_dayofyear': 'Seasonal Cycle (sin)',
            'cos_dayofyear': 'Seasonal Cycle (cos)',
            'sin_month': 'Monthly Cycle (sin)',
            'cos_month': 'Monthly Cycle (cos)',
            'sin_dayofweek': 'Weekly Cycle (sin)',
            'cos_dayofweek': 'Weekly Cycle (cos)',
            # Shock indicators
            'covid_period': 'COVID Period',
            'plastic_ban_period': 'Plastic Ban Period',
            'price_spike_period': 'Price Spike Period',
            'post_customer_loss': 'Post Customer Loss',
            'export_period': 'Export Period',
            # Price features
            'unit_price': 'Unit Price',
            'discount_pct': 'Discount %',
            'price_discount_interaction': 'Price×Discount Effect',
            'is_discount': 'Discount Active',
            'discount_intensity': 'Discount Intensity',
            'effective_price': 'Effective Price',
            # Weather
            'avg_temperature': 'Temperature',
            'rainfall_mm': 'Rainfall (mm)',
            'temp_rain_interaction': 'Temp×Rain Effect',
            'is_rainy': 'Rainy Day',
            'is_heavy_rain': 'Heavy Rain',
            'is_hot': 'Hot Day (>32°C)',
            'is_cold': 'Cold Day (<20°C)',
            'extreme_weather': 'Extreme Weather',
            # Festival
            'festival_flag': 'Festival Active',
            'festival_week': 'Festival Week',
            'major_festival': 'Major Festival',
            'festival_season': 'Festival Season (Q4)',
            # Lag features
            'lag_2': '2-Day Lag',
            'lag_3': '3-Day Lag',
            'lag_14': '14-Day Lag',
            'lag_21': '21-Day Lag',
            'lag_28': '28-Day Lag',
            'rolling_mean_3': '3-Day Moving Avg',
            'rolling_mean_14': '14-Day Moving Avg',
            'rolling_mean_21': '21-Day Moving Avg',
            'rolling_mean_28': '28-Day Moving Avg',
            'rolling_std_3': '3-Day Volatility',
            'rolling_std_14': '14-Day Volatility',
            'rolling_std_21': '21-Day Volatility',
            'rolling_std_28': '28-Day Volatility',
            'exp_weighted_mean_7': '7-Day Exp. Weighted Avg',
            'exp_weighted_mean_14': '14-Day Exp. Weighted Avg',
            'lag_diff_1': 'Daily Change',
            'lag_diff_7': 'Weekly Change',
            'lag_pct_change_1': 'Daily % Change',
            'lag_pct_change_7': 'Weekly % Change',
            'rolling_min_7': '7-Day Min',
            'rolling_max_7': '7-Day Max',
            # Encoded categoricals
            'product_id_encoded': 'Product ID',
            'customer_segment_encoded': 'Customer Segment',
            'plastic_type_encoded': 'Plastic Type',
            'grade_encoded': 'Material Grade',
            'application_encoded': 'Application',
            'category_encoded': 'Product Category',
            'festival_name_encoded': 'Festival Name',
            # Interactions
            'product_segment_interaction': 'Product×Segment',
            'plastic_category_interaction': 'Plastic×Category',
            # Statistical features
            'quantity_sold_group_mean': 'Product Avg Sales',
            'quantity_sold_group_std': 'Product Sales Volatility',
            'quantity_sold_group_median': 'Product Median Sales',
            'quantity_sold_group_min': 'Product Min Sales',
            'quantity_sold_group_max': 'Product Max Sales',
            'quantity_sold_group_range': 'Product Sales Range',
            'quantity_sold_group_cv': 'Product Sales CV',
            'quantity_sold_z_score': 'Sales Z-Score',
            'unit_price_group_mean': 'Avg Product Price',
            'unit_price_group_std': 'Price Volatility',
            'unit_price_group_median': 'Median Product Price',
            'unit_price_group_min': 'Min Product Price',
            'unit_price_group_max': 'Max Product Price',
            'unit_price_group_range': 'Price Range',
            'unit_price_group_cv': 'Price CV',
            # Legacy/input mappings
            'sale_amount': 'Product Price',
            'discount': 'Discount Rate',
            'quantity': 'Historical Volume',
            'Plastic_Type': 'Material Type',
            'product_type': 'Product Category',
            'application_segment': 'Market Application',
            'precpt': 'Weather Impact',
            'holiday_flag': 'Holiday Effect',
            'is_weekend': 'Weekend Pattern'
        }
        
        # Direct lookup first
        if feature_name in mappings:
            return mappings[feature_name]
        
        # Partial match
        for key, readable in mappings.items():
            if key in feature_name:
                return readable
        
        return feature_name.replace('_', ' ').title()
    
    def _get_model_for_explanation(self):
        """Get the best available model for explanations"""
        if not self.models:
            return None
        
        # Prefer tree-based models for SHAP
        preferred_models = ['xgboost', 'lightgbm', 'random_forest', 'decision_tree']
        for model_name in preferred_models:
            if model_name in self.models:
                print(f"Using {model_name} for explanations")
                return self.models[model_name]
        
        # Fall back to any available model
        model_name = list(self.models.keys())[0]
        print(f"Using fallback model {model_name} for explanations")
        return self.models[model_name]
    
    def shap_explanation(self, input_data, feature_names, model):
        """Generate SHAP values with improved error handling"""
        try:
            print("Starting SHAP explanation...")
            
            # Prepare input data
            if hasattr(input_data, 'iloc'):
                input_data_values = input_data.values
                print(f"Input data shape from DataFrame: {input_data_values.shape}")
            else:
                input_data_values = np.array(input_data).reshape(1, -1) if np.array(input_data).ndim == 1 else np.array(input_data)
                print(f"Input data shape from array: {input_data_values.shape}")
            
            # Create SHAP explainer
            explainer = shap.TreeExplainer(model)
            print("Created SHAP TreeExplainer")
            
            # Generate SHAP values
            shap_values = explainer.shap_values(input_data_values)
            print(f"Generated SHAP values, type: {type(shap_values)}")
            
            # Handle different SHAP value formats
            if isinstance(shap_values, list):
                shap_values = shap_values[0] if len(shap_values) > 0 else shap_values
                print("Used first element from SHAP values list")
            
            if hasattr(shap_values, 'shape') and len(shap_values.shape) > 1:
                shap_values = shap_values[0]
                print("Used first row from SHAP values array")
            
            # Convert to list
            if hasattr(shap_values, 'tolist'):
                shap_values_list = shap_values.tolist()
            else:
                shap_values_list = [float(shap_values)] if np.isscalar(shap_values) else list(shap_values)
            
            print(f"Final SHAP values length: {len(shap_values_list)}")
            print(f"Feature names length: {len(feature_names)}")
            
            return {
                "shap_values": shap_values_list,
                "base_value": float(explainer.expected_value),
                "feature_names": feature_names,
                "success": True
            }
            
        except Exception as e:
            print(f"SHAP explanation error: {str(e)}")
            import traceback
            print(f"Full error trace: {traceback.format_exc()}")
            return {
                "error": f"SHAP explanation failed: {str(e)}",
                "success": False
            }

    
    def generate_product_specific_insights(self, shap_explanation, row_data):
        """Generate insights based on actual product characteristics"""
        insights = []
        
        if not row_data:
            return [{"text": "Upload product data to generate specific insights", "type": "neutral", "icon": "📊"}]
        
        # Extract product details
        product_id = str(row_data.get('product_id', 'Unknown'))
        plastic_type = str(row_data.get('Plastic_Type', 'Unknown'))
        sale_amount = float(row_data.get('sale_amount', 0))
        discount = float(row_data.get('discount', 0))
        quantity = int(row_data.get('quantity', 0))
        product_type = str(row_data.get('product_type', 'Unknown'))
        application = str(row_data.get('application_segment', 'Unknown'))
        
        # Price analysis insights
        if sale_amount > 0:
            if sale_amount >= 120:
                insights.append({
                    "text": f"Product {product_id} commands premium pricing at ${sale_amount:.2f}, indicating strong value proposition",
                    "type": "positive",
                    "icon": "💰",
                    "impact": "high"
                })
            elif sale_amount <= 60:
                insights.append({
                    "text": f"Competitive pricing at ${sale_amount:.2f} positions {product_id} for volume growth",
                    "type": "info",
                    "icon": "📈",
                    "impact": "medium"
                })
            else:
                insights.append({
                    "text": f"Mid-tier pricing at ${sale_amount:.2f} balances accessibility and profitability",
                    "type": "neutral",
                    "icon": "⚖️",
                    "impact": "medium"
                })
        
        # Discount strategy insights
        if discount > 0.20:
            insights.append({
                "text": f"High discount rate of {discount*100:.1f}% may indicate competitive pressure or inventory clearance",
                "type": "warning",
                "icon": "⚠️",
                "impact": "medium"
            })
        elif discount > 0.10:
            insights.append({
                "text": f"Moderate discount of {discount*100:.1f}% supports market penetration strategy",
                "type": "info",
                "icon": "🎯",
                "impact": "medium"
            })
        elif discount < 0.05:
            insights.append({
                "text": f"Minimal discounting ({discount*100:.1f}%) suggests strong brand equity",
                "type": "positive",
                "icon": "🛡️",
                "impact": "high"
            })
        
        # Volume analysis
        if quantity >= 800:
            insights.append({
                "text": f"High volume product ({quantity} units) demonstrates strong market demand",
                "type": "positive",
                "icon": "🚀",
                "impact": "high"
            })
        elif quantity >= 400:
            insights.append({
                "text": f"Solid performance with {quantity} units indicating stable market position",
                "type": "positive",
                "icon": "✅",
                "impact": "medium"
            })
        else:
            insights.append({
                "text": f"Lower volume ({quantity} units) suggests niche market or growth opportunity",
                "type": "info",
                "icon": "🌱",
                "impact": "medium"
            })
        
        # Material-specific insights
        material_insights = {
            'PET': {
                "text": f"PET material benefits from growing sustainability focus in packaging sector",
                "type": "positive",
                "icon": "♻️"
            },
            'HDPE': {
                "text": f"HDPE offers durability advantages in industrial and container applications",
                "type": "info",
                "icon": "🔧"
            },
            'PP': {
                "text": f"Polypropylene provides versatility across automotive and consumer markets",
                "type": "info",
                "icon": "🔄"
            },
            'PVC': {
                "text": f"PVC maintains cost-effectiveness in construction and infrastructure projects",
                "type": "info",
                "icon": "🏗️"
            }
        }
        
        if plastic_type in material_insights:
            material_insight = material_insights[plastic_type]
            insights.append({
                **material_insight,
                "impact": "medium"
            })
        
        # Application segment insights
        if 'Packaging' in application:
            insights.append({
                "text": "Packaging segment benefits from consistent consumer demand and e-commerce growth",
                "type": "positive",
                "icon": "📦",
                "impact": "medium"
            })
        elif 'Industrial' in application:
            insights.append({
                "text": "Industrial segment offers stable B2B relationships and contract-based demand",
                "type": "stable",
                "icon": "🏭",
                "impact": "medium"
            })
        elif 'Consumer' in application:
            insights.append({
                "text": "Consumer segment sensitive to economic trends and seasonal variations",
                "type": "info",
                "icon": "👥",
                "impact": "medium"
            })
        
        # SHAP-based insights
        if 'error' not in shap_explanation:
            shap_insights = self._generate_shap_based_insights(shap_explanation, row_data)
            insights.extend(shap_insights)
        
        # Ensure we have sufficient insights
        if len(insights) < 4:
            insights.append({
                "text": f"Monitor market trends for {plastic_type} products in {application} segment",
                "type": "planning",
                "icon": "📋",
                "impact": "medium"
            })
        
        return insights[:6]  # Return top 6 most relevant insights
    
    def _generate_shap_based_insights(self, shap_explanation, row_data):
        """Generate insights based on SHAP feature importance"""
        insights = []
        
        if 'shap_values' not in shap_explanation:
            return insights
        
        # Get feature importance
        shap_values = shap_explanation['shap_values']
        feature_names = shap_explanation.get('feature_names', [])
        
        if len(shap_values) != len(feature_names):
            return insights
        
        # Create feature impact pairs
        feature_impacts = list(zip(feature_names, shap_values))
        feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
        
        # Generate insights for top features
        for feature_name, impact in feature_impacts[:3]:
            if abs(impact) > 0.1:  # Only significant impacts
                readable_name = self._make_feature_readable(feature_name)
                direction = "positively" if impact > 0 else "negatively"
                
                insights.append({
                    "text": f"{readable_name} is {direction} influencing demand prediction (impact: {abs(impact):.2f})",
                    "type": "positive" if impact > 0 else "warning",
                    "icon": "📊",
                    "impact": "high" if abs(impact) > 0.2 else "medium"
                })
        
        return insights
    
    def generate_actionable_recommendations(self, shap_explanation, row_data):
        """Generate specific, actionable recommendations"""
        recommendations = []
        
        if not row_data:
            return [{
                "text": "Upload product data to receive specific recommendations",
                "type": "neutral",
                "icon": "📥",
                "action": "data_upload"
            }]
        
        product_id = str(row_data.get('product_id', 'Unknown'))
        quantity = int(row_data.get('quantity', 0))
        sale_amount = float(row_data.get('sale_amount', 0))
        discount = float(row_data.get('discount', 0))
        plastic_type = str(row_data.get('Plastic_Type', 'Unknown'))
        
        # Production recommendations
        if quantity >= 800:
            recommendations.append({
                "text": f"Scale production capacity for {product_id} to meet high demand levels",
                "type": "urgent",
                "icon": "🏭",
                "action": "increase_production"
            })
        elif quantity >= 400:
            recommendations.append({
                "text": f"Maintain current production levels for {product_id} while optimizing efficiency",
                "type": "stable",
                "icon": "⚖️",
                "action": "optimize_current"
            })
        else:
            recommendations.append({
                "text": f"Evaluate market expansion opportunities for {product_id}",
                "type": "strategic",
                "icon": "🎯",
                "action": "market_development"
            })
        
        # Pricing recommendations
        if discount > 0.15:
            recommendations.append({
                "text": f"Review discount strategy for {product_id} to optimize profit margins",
                "type": "review",
                "icon": "💰",
                "action": "pricing_analysis"
            })
        
        if sale_amount > 100:
            recommendations.append({
                "text": f"Leverage premium positioning of {product_id} for brand strengthening",
                "type": "strategic",
                "icon": "💎",
                "action": "brand_development"
            })
        
        # Material-specific recommendations
        material_recommendations = {
            'PET': "Monitor PET resin prices and explore recycling partnerships",
            'HDPE': "Secure HDPE supply chains for consistent quality delivery",
            'PP': "Diversify PP sourcing to manage price volatility",
            'PVC': "Plan PVC inventory around construction cycle demands"
        }
        
        if plastic_type in material_recommendations:
            recommendations.append({
                "text": material_recommendations[plastic_type],
                "type": "procurement",
                "icon": "📦",
                "action": "supply_chain"
            })
        
        return recommendations[:4]
    
    def analyze_feature_impacts_detailed(self, shap_explanation, row_data):
        """Provide detailed feature impact analysis"""
        if 'error' in shap_explanation:
            return {"error": "Unable to analyze feature impacts", "reason": shap_explanation.get('error')}
        
        if 'shap_values' not in shap_explanation or 'feature_names' not in shap_explanation:
            return {"error": "Incomplete SHAP explanation data"}
        
        shap_values = shap_explanation['shap_values']
        feature_names = shap_explanation['feature_names']
        
        if len(shap_values) != len(feature_names):
            return {"error": "Mismatch between SHAP values and feature names"}
        
        # Create detailed feature analysis
        feature_impacts = []
        for i, (feature_name, impact) in enumerate(zip(feature_names, shap_values)):
            readable_name = self._make_feature_readable(feature_name)
            actual_value = self._get_feature_value(feature_name, row_data)
            
            feature_impacts.append({
                "feature": readable_name,
                "technical_name": feature_name,
                "impact": float(impact),
                "actual_value": actual_value,
                "direction": "increases" if impact > 0 else "decreases",
                "magnitude": abs(float(impact)),
                "significance": self._classify_impact_significance(abs(float(impact))),
                "interpretation": self._interpret_feature_impact(feature_name, impact, actual_value)
            })
        
        # Sort by impact magnitude
        feature_impacts.sort(key=lambda x: x['magnitude'], reverse=True)
        
        return {
            "top_positive": [f for f in feature_impacts if f['impact'] > 0][:3],
            "top_negative": [f for f in feature_impacts if f['impact'] < 0][:3],
            "most_influential": feature_impacts[:5],
            "total_features": len(feature_impacts),
            "analysis_summary": f"Analyzed {len(feature_impacts)} features with {len([f for f in feature_impacts if f['significance'] == 'high'])} high-impact factors"
        }
    
    def _get_feature_value(self, feature_name, row_data):
        """Get the actual value of a feature from row data"""
        if not row_data:
            return "N/A"
        
        # Direct mapping
        if feature_name in row_data:
            value = row_data[feature_name]
            if isinstance(value, (int, float)):
                return f"{value:.2f}" if isinstance(value, float) else str(value)
            return str(value)
        
        # Pattern matching for encoded features
        if 'sale_amount' in feature_name.lower():
            return f"${row_data.get('sale_amount', 0):.2f}"
        elif 'discount' in feature_name.lower():
            return f"{row_data.get('discount', 0)*100:.1f}%"
        elif 'quantity' in feature_name.lower():
            return f"{row_data.get('quantity', 0)} units"
        elif 'plastic' in feature_name.lower():
            return str(row_data.get('Plastic_Type', 'Unknown'))
        
        return "N/A"
    
    def _interpret_feature_impact(self, feature_name, impact, actual_value):
        """Create meaningful interpretation of feature impact"""
        direction = "driving up" if impact > 0 else "reducing"
        
        interpretations = {
            'sale_amount': f"Price level ({actual_value}) is {direction} demand expectations",
            'discount': f"Discount rate ({actual_value}) is {direction} predicted sales",
            'quantity': f"Historical volume ({actual_value}) is {direction} future demand",
            'Plastic_Type': f"Material choice ({actual_value}) is {direction} market appeal",
            'product_type': f"Product category is {direction} demand prediction",
            'application_segment': f"Market segment is {direction} forecasted demand"
        }
        
        # Find matching interpretation
        for key, interpretation in interpretations.items():
            if key.lower() in feature_name.lower():
                return interpretation
        
        return f"Factor is {direction} demand prediction"
    
    def _classify_impact_significance(self, magnitude):
        """Classify impact magnitude"""
        if magnitude > 0.2:
            return "high"
        elif magnitude > 0.1:
            return "medium"
        else:
            return "low"
    
    def assess_comprehensive_risk(self, row_data, shap_explanation):
        """Comprehensive risk assessment"""
        risks = []
        
        if not row_data:
            return {
                "overall_risk": "unknown",
                "risk_factors": [{"factor": "Data Required", "risk_level": "unknown", "description": "Upload data for assessment"}],
                "confidence": "low"
            }
        
        quantity = int(row_data.get('quantity', 0))
        discount = float(row_data.get('discount', 0))
        sale_amount = float(row_data.get('sale_amount', 0))
        plastic_type = str(row_data.get('Plastic_Type', 'Unknown'))
        
        # Volume-based risks
        if quantity > 1000:
            risks.append({
                "factor": "High Volume Sustainability",
                "risk_level": "medium",
                "description": f"Very high volume ({quantity} units) may be challenging to maintain",
                "mitigation": "Diversify customer base and strengthen supply chain resilience"
            })
        elif quantity < 200:
            risks.append({
                "factor": "Low Market Penetration",
                "risk_level": "medium",
                "description": f"Low volume ({quantity} units) indicates limited market reach",
                "mitigation": "Develop targeted marketing and distribution expansion"
            })
        
        # Pricing risks
        if discount > 0.25:
            risks.append({
                "factor": "Margin Compression",
                "risk_level": "high",
                "description": f"High discount rate ({discount*100:.1f}%) threatens profitability",
                "mitigation": "Reassess pricing strategy and value proposition"
            })
        
        if sale_amount > 150:
            risks.append({
                "factor": "Price Sensitivity",
                "risk_level": "low",
                "description": f"Premium pricing (${sale_amount:.2f}) may limit addressable market",
                "mitigation": "Monitor competitive positioning and customer value perception"
            })
        
        # Material-specific risks
        material_risks = {
            'PET': {"factor": "Recycling Regulations", "risk_level": "medium", "description": "Increasing sustainability requirements may impact costs"},
            'HDPE': {"factor": "Supply Chain Stability", "risk_level": "low", "description": "Generally stable supply with multiple sources"},
            'PP': {"factor": "Price Volatility", "risk_level": "medium", "description": "PP prices subject to oil market fluctuations"},
            'PVC': {"factor": "Environmental Concerns", "risk_level": "medium", "description": "Growing environmental restrictions on PVC usage"}
        }
        
        if plastic_type in material_risks:
            risk_info = material_risks[plastic_type]
            risks.append({
                **risk_info,
                "mitigation": f"Monitor {plastic_type} market trends and regulatory developments"
            })
        
        # Calculate overall risk
        risk_levels = [r['risk_level'] for r in risks]
        if 'high' in risk_levels:
            overall_risk = "high"
        elif risk_levels.count('medium') > 1:
            overall_risk = "medium"
        else:
            overall_risk = "low"
        
        return {
            "overall_risk": overall_risk,
            "risk_factors": risks[:4],
            "confidence": "high",
            "assessment_basis": f"Based on {len(risks)} identified risk factors"
        }
    
    def _get_detailed_product_context(self, row_data):
        """Extract comprehensive product context"""
        if not row_data:
            return {}
        
        return {
            "product_id": str(row_data.get('product_id', 'Unknown')),
            "plastic_type": str(row_data.get('Plastic_Type', 'Unknown')),
            "product_type": str(row_data.get('product_type', 'Unknown')),
            "application": str(row_data.get('application_segment', 'Unknown')),
            "current_price": f"${float(row_data.get('sale_amount', 0)):.2f}",
            "discount_rate": f"{float(row_data.get('discount', 0))*100:.1f}%",
            "historical_volume": int(row_data.get('quantity', 0)),
            "effective_price": f"${float(row_data.get('sale_amount', 0)) * (1 - float(row_data.get('discount', 0))):.2f}",
            "revenue_potential": f"${float(row_data.get('sale_amount', 0)) * int(row_data.get('quantity', 0)):.2f}"
        }
    
    def get_demand_indicators(self, row_data):
        """Generate demand indicators"""
        if not row_data:
            return {}
        
        sale_amount = float(row_data.get('sale_amount', 0))
        quantity = int(row_data.get('quantity', 0))
        
        return {
            "price_tier": "premium" if sale_amount > 120 else "mid-market" if sale_amount > 70 else "value",
            "volume_category": "high" if quantity > 750 else "medium" if quantity > 350 else "low",
            "market_position": f"{row_data.get('Plastic_Type', 'Unknown')} in {row_data.get('application_segment', 'Unknown')}"
        }
    
    def assess_prediction_quality(self, shap_explanation):
        """Assess the quality of the prediction"""
        if 'error' in shap_explanation:
            return {"quality": "poor", "reason": "SHAP analysis failed"}
        
        if 'shap_values' not in shap_explanation:
            return {"quality": "poor", "reason": "No SHAP values available"}
        
        shap_values = shap_explanation['shap_values']
        total_impact = sum(abs(val) for val in shap_values)
        
        if total_impact > 1.0:
            return {"quality": "high", "total_impact": total_impact, "confidence": "strong feature influences"}
        elif total_impact > 0.5:
            return {"quality": "medium", "total_impact": total_impact, "confidence": "moderate feature influences"}
        else:
            return {"quality": "low", "total_impact": total_impact, "confidence": "weak feature influences"}
    
    def identify_unique_factors(self, row_data, shap_explanation):
        """Identify unique characteristics of this product"""
        if not row_data:
            return {"characteristics": ["Analysis pending - upload product data"]}
        
        factors = []
        sale_amount = float(row_data.get('sale_amount', 0))
        quantity = int(row_data.get('quantity', 0))
        discount = float(row_data.get('discount', 0))
        plastic_type = str(row_data.get('Plastic_Type', 'Unknown'))
        
        # Price-volume combinations
        if sale_amount > 120 and quantity > 600:
            factors.append("High-value product with strong volume performance - premium market leader")
        elif sale_amount < 60 and quantity > 500:
            factors.append("High-volume value product - cost leadership strategy")
        elif sale_amount > 100 and quantity < 300:
            factors.append("Premium niche product - specialized market focus")
        
        # Material-application combinations
        app_segment = str(row_data.get('application_segment', ''))
        if plastic_type == 'PET' and 'Packaging' in app_segment:
            factors.append("PET packaging product - positioned for sustainability trends")
        elif plastic_type == 'HDPE' and 'Industrial' in app_segment:
            factors.append("Industrial HDPE product - durability-focused positioning")
        
        # Discount strategy analysis
        if discount < 0.05:
            factors.append("Premium brand positioning with minimal price competition")
        elif discount > 0.20:
            factors.append("Aggressive pricing strategy - market share focus")
        
        if not factors:
            factors.append("Balanced product with standard market characteristics")
        
        return {
            "characteristics": factors,
            "market_positioning": f"{plastic_type} product in {app_segment} segment",
            "competitive_stance": "premium" if sale_amount > 100 else "value" if sale_amount < 70 else "competitive"
        }
    
    def _make_feature_readable(self, feature_name):
        """Convert technical feature names to readable format"""
        mappings = {
            'sale_amount': 'Product Price',
            'discount': 'Discount Rate',
            'quantity': 'Historical Volume',
            'Plastic_Type': 'Material Type',
            'product_type': 'Product Category',
            'application_segment': 'Market Application',
            'precpt': 'Weather Impact',
            'holiday_flag': 'Holiday Effect',
            'is_weekend': 'Weekend Pattern'
        }
        
        for key, readable in mappings.items():
            if key in feature_name:
                return readable
        
        return feature_name.replace('_', ' ').title()
    
    def _get_model_for_explanation(self):
        """Get the best available model for explanations"""
        if not self.models:
            return None
        
        # Prefer tree-based models for SHAP
        preferred_models = ['xgboost', 'lightgbm', 'random_forest', 'decision_tree']
        for model_name in preferred_models:
            if model_name in self.models:
                print(f"Using {model_name} for explanations")
                return self.models[model_name]
        
        # Fall back to any available model
        model_name = list(self.models.keys())[0]
        print(f"Using fallback model {model_name} for explanations")
        return self.models[model_name]
    
    def shap_explanation(self, input_data, feature_names, model):
        """Generate SHAP values with improved error handling"""
        try:
            print("Starting SHAP explanation...")
            
            # Prepare input data
            if hasattr(input_data, 'iloc'):
                input_data_values = input_data.values
                print(f"Input data shape from DataFrame: {input_data_values.shape}")
            else:
                input_data_values = np.array(input_data).reshape(1, -1) if np.array(input_data).ndim == 1 else np.array(input_data)
                print(f"Input data shape from array: {input_data_values.shape}")
            
            # Create SHAP explainer
            explainer = shap.TreeExplainer(model)
            print("Created SHAP TreeExplainer")
            
            # Generate SHAP values
            shap_values = explainer.shap_values(input_data_values)
            print(f"Generated SHAP values, type: {type(shap_values)}")
            
            # Handle different SHAP value formats
            if isinstance(shap_values, list):
                shap_values = shap_values[0] if len(shap_values) > 0 else shap_values
                print("Used first element from SHAP values list")
            
            if hasattr(shap_values, 'shape') and len(shap_values.shape) > 1:
                shap_values = shap_values[0]
                print("Used first row from SHAP values array")
            
            # Convert to list
            if hasattr(shap_values, 'tolist'):
                shap_values_list = shap_values.tolist()
            else:
                shap_values_list = [float(shap_values)] if np.isscalar(shap_values) else list(shap_values)
            
            print(f"Final SHAP values length: {len(shap_values_list)}")
            print(f"Feature names length: {len(feature_names)}")
            
            return {
                "shap_values": shap_values_list,
                "base_value": float(explainer.expected_value),
                "feature_names": feature_names,
                "success": True
            }
            
        except Exception as e:
            print(f"SHAP explanation error: {str(e)}")
            import traceback
            print(f"Full error trace: {traceback.format_exc()}")
            return {
                "error": f"SHAP explanation failed: {str(e)}",
                "success": False
            }
