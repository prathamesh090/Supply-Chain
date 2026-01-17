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
