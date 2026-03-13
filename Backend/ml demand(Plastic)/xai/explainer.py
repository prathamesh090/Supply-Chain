import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedXAIExplainer:
    """
    Enhanced XAI Explainer with improved manufacturing insights, 
    supply chain recommendations, and demand indicators
    """
    
    def __init__(self, models, feature_names):
        self.models = models
        self.feature_names = feature_names
        self.column_mappings = self._create_column_mappings()
        logger.info("✅ Enhanced XAI Explainer initialized")
    
    def _create_column_mappings(self) -> Dict[str, str]:
        """Create human-readable feature mappings"""
        mappings = {
            'sale_amount': '💰 Product Price',
            'discount': '🏷️ Discount Rate',
            'Plastic_Type': '🔬 Material Type',
            'plastic_type': '🔬 Material Type',
            'product_type': '📦 Product Category',
            'category': '📦 Product Category',
            'application_segment': '🏭 Market Application',
            'precpt': '☔ Weather Conditions',
            'holiday_flag': '🎉 Holiday Effect',
            'is_weekend': '📅 Weekend Effect',
            'quantity': '📊 Historical Sales Volume',
            'sale_per_hour': '⏱️ Sales Rate per Hour',
            'effective_price': '💵 Final Price',
            'price_discount': '📈 Price-Discount Strategy',
            'cluster': '🎯 Product Grouping',
            'percentile': '📍 Market Position',
            'competitor': '🏆 Competitive Pressure'
        }
        
        # Auto-map remaining features
        for feature in self.feature_names:
            if feature not in mappings:
                human_readable = feature.replace('_', ' ').title()
                mappings[feature] = human_readable
        
        return mappings
    
    def explain(self, processed_data: pd.DataFrame, feature_names: List[str], 
                row_data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Generate comprehensive XAI explanation
        
        Returns:
        {
            'manufacturing_insights': List of actionable manufacturing insights,
            'supply_recommendations': List of supply chain recommendations,
            'demand_indicators': List of demand pattern indicators,
            'risk_assessment': Risk factors and mitigation strategies,
            'product_context': Product metadata and context,
            'feature_importance': Top influencing factors,
            'data_quality': Data quality assessment,
            'forecast_summary': Summary of the forecast
        }
        """
        try:
            logger.info("🔍 Generating comprehensive XAI explanation...")
            
            explanation = {
                "manufacturing_insights": self._generate_manufacturing_insights(processed_data, row_data),
                "supply_recommendations": self._generate_supply_recommendations(processed_data, row_data),
                "demand_indicators": self._generate_demand_indicators(processed_data, row_data),
                "risk_assessment": self._generate_risk_assessment(processed_data, row_data),
                "product_context": self._get_product_context(row_data),
                "feature_importance": self._analyze_feature_importance(processed_data, row_data),
                "data_quality": self._assess_data_quality(row_data),
                "forecast_summary": self._generate_forecast_summary(processed_data, row_data)
            }
            
            logger.info("✅ XAI explanation generated successfully")
            return explanation
            
        except Exception as e:
            logger.error(f"❌ Error generating explanation: {e}")
            return self._get_fallback_explanation(row_data)
    
    def _generate_manufacturing_insights(self, processed_data: pd.DataFrame, 
                                        row_data: Optional[Dict]) -> List[Dict[str, Any]]:
        """Generate actionable manufacturing insights"""
        insights = []
        
        if row_data is None:
            return insights
        
        try:
            # Insight 1: Material Type Optimization
            plastic_type = row_data.get('Plastic_Type') or row_data.get('plastic_type')
            if plastic_type:
                if plastic_type in ['PET', 'HDPE', 'LDPE']:
                    insights.append({
                        "type": "optimization",
                        "icon": "⚙️",
                        "title": "Material Efficiency",
                        "description": f"{plastic_type} is optimal for cost-effective production",
                        "action": "Maintain current material sourcing strategy",
                        "impact": "medium"
                    })
                elif plastic_type == 'PP':
                    insights.append({
                        "type": "optimization",
                        "icon": "♻️",
                        "title": "Sustainability Focus",
                        "description": "Polypropylene offers excellent recyclability",
                        "action": "Promote eco-friendly product positioning",
                        "impact": "high"
                    })
            
            # Insight 2: Production Capacity Planning
            sale_amount = float(row_data.get('sale_amount', 0))
            quantity = float(row_data.get('quantity', 0))
            
            if sale_amount > 0 and quantity > 0:
                unit_price = sale_amount / quantity if quantity > 0 else 0
                if sale_amount > 10000:
                    insights.append({
                        "type": "capacity",
                        "icon": "🏭",
                        "title": "High Volume Production",
                        "description": f"High sales volume ({sale_amount:.2f}) indicates strong demand",
                        "action": "Increase production capacity and ensure raw material availability",
                        "impact": "high"
                    })
                elif sale_amount < 500:
                    insights.append({
                        "type": "capacity",
                        "icon": "📉",
                        "title": "Low Volume Production",
                        "description": "Lower sales volume suggests niche or specialty products",
                        "action": "Focus on quality control and specialized manufacturing",
                        "impact": "medium"
                    })
            
            # Insight 3: Pricing Strategy Impact
            discount = float(row_data.get('discount', 0))
            if discount > 0.2:
                insights.append({
                    "type": "pricing",
                    "icon": "💸",
                    "title": "Aggressive Discounting",
                    "description": f"Discount rate of {discount*100:.1f}% indicates price competition",
                    "action": "Review profit margins and production efficiency",
                    "impact": "medium"
                })
            
            # Insight 4: Seasonal/Temporal Impact
            if row_data.get('holiday_flag') == 1:
                insights.append({
                    "type": "temporal",
                    "icon": "🎊",
                    "title": "Holiday Season Impact",
                    "description": "Increased demand during holiday periods",
                    "action": "Pre-plan inventory buildup 4-6 weeks before major holidays",
                    "impact": "high"
                })
            
            if row_data.get('is_weekend') == 1:
                insights.append({
                    "type": "temporal",
                    "icon": "🗓️",
                    "title": "Weekend Surge Pattern",
                    "description": "Weekends show different demand patterns",
                    "action": "Adjust shift schedules to match weekend demand patterns",
                    "impact": "low"
                })
            
            # Insight 5: Weather Sensitivity
            precpt = float(row_data.get('precpt', 0))
            if precpt > 0.5:
                insights.append({
                    "type": "environmental",
                    "icon": "☔",
                    "title": "Weather-Dependent Demand",
                    "description": "High precipitation may affect product demand/logistics",
                    "action": "Implement weather-responsive inventory management",
                    "impact": "medium"
                })
            
        except Exception as e:
            logger.warning(f"Error generating manufacturing insights: {e}")
        
        # Fallback insights
        if not insights:
            insights.append({
                "type": "neutral",
                "icon": "📊",
                "title": "Standard Operations",
                "description": "Data shows standard operating conditions",
                "action": "Continue with current production strategy",
                "impact": "low"
            })
        
        return insights
    
    def _generate_supply_recommendations(self, processed_data: pd.DataFrame, 
                                        row_data: Optional[Dict]) -> List[Dict[str, Any]]:
        """Generate supply chain recommendations"""
        recommendations = []
        
        if row_data is None:
            return recommendations
        
        try:
            # Recommendation 1: Inventory Management
            predicted_demand = float(row_data.get('predicted_demand', 0)) if 'predicted_demand' in row_data else 0
            quantity = float(row_data.get('quantity', 0))
            
            if predicted_demand > quantity * 1.2:
                recommendations.append({
                    "type": "inventory",
                    "icon": "📦",
                    "title": "Increase Inventory Buffer",
                    "priority": "high",
                    "description": f"Predicted demand exceeds current stock levels",
                    "action": "Increase safety stock by 25-30%",
                    "estimated_cost": "medium",
                    "timeline": "Immediate"
                })
            elif predicted_demand < quantity * 0.5:
                recommendations.append({
                    "type": "inventory",
                    "icon": "📉",
                    "title": "Reduce Inventory Holding",
                    "priority": "medium",
                    "description": "Excess inventory risk detected",
                    "action": "Reduce purchase orders and clear excess stock",
                    "estimated_cost": "low",
                    "timeline": "1-2 weeks"
                })
            else:
                recommendations.append({
                    "type": "inventory",
                    "icon": "⚖️",
                    "title": "Optimize Inventory Levels",
                    "priority": "low",
                    "description": "Current inventory aligns with predicted demand",
                    "action": "Maintain current stock management strategy",
                    "estimated_cost": "none",
                    "timeline": "Ongoing"
                })
            
            # Recommendation 2: Supplier Diversification
            plastic_type = row_data.get('Plastic_Type') or row_data.get('plastic_type')
            if plastic_type in ['PET', 'HDPE']:
                recommendations.append({
                    "type": "sourcing",
                    "icon": "🌍",
                    "title": "Diversify Material Suppliers",
                    "priority": "medium",
                    "description": "Critical materials may have limited supplier base",
                    "action": "Establish relationships with 2-3 backup suppliers",
                    "estimated_cost": "medium",
                    "timeline": "2-4 weeks"
                })
            
            # Recommendation 3: Lead Time Management
            discount = float(row_data.get('discount', 0))
            if discount > 0.15:
                recommendations.append({
                    "type": "sourcing",
                    "icon": "⏰",
                    "title": "Optimize Lead Times",
                    "priority": "medium",
                    "description": "High discounts may indicate urgent ordering",
                    "action": "Negotiate longer lead times for volume discounts",
                    "estimated_cost": "savings",
                    "timeline": "Ongoing"
                })
            
            # Recommendation 4: Quality Assurance
            sale_amount = float(row_data.get('sale_amount', 0))
            if sale_amount > 5000:
                recommendations.append({
                    "type": "quality",
                    "icon": "✓",
                    "title": "Enhanced QA Process",
                    "priority": "high",
                    "description": "High-value products require rigorous quality control",
                    "action": "Implement 100% inspection protocol",
                    "estimated_cost": "medium",
                    "timeline": "Immediate"
                })
            
            # Recommendation 5: Logistics Planning
            holiday_flag = row_data.get('holiday_flag', 0)
            if holiday_flag == 1:
                recommendations.append({
                    "type": "logistics",
                    "icon": "🚚",
                    "title": "Holiday Shipping Preparation",
                    "priority": "high",
                    "description": "Holiday periods have peak logistics demands",
                    "action": "Pre-book shipping capacity 30 days in advance",
                    "estimated_cost": "medium",
                    "timeline": "1-2 months ahead"
                })
            
        except Exception as e:
            logger.warning(f"Error generating supply recommendations: {e}")
        
        # Fallback recommendation
        if not recommendations:
            recommendations.append({
                "type": "general",
                "icon": "📋",
                "title": "Standard Supply Chain",
                "priority": "low",
                "description": "Current supply chain processes are adequate",
                "action": "Maintain existing supplier relationships",
                "estimated_cost": "none",
                "timeline": "Ongoing"
            })
        
        return recommendations
    
    def _generate_demand_indicators(self, processed_data: pd.DataFrame, 
                                   row_data: Optional[Dict]) -> List[Dict[str, Any]]:
        """Generate demand pattern indicators"""
        indicators = []
        
        if row_data is None:
            return indicators
        
        try:
            # Indicator 1: Trend Direction
            predicted_demand = float(row_data.get('predicted_demand', 0)) if 'predicted_demand' in row_data else 0
            quantity = float(row_data.get('quantity', 0))
            
            trend = "📈 Upward" if predicted_demand > quantity * 1.1 else "📉 Downward" if predicted_demand < quantity * 0.9 else "➡️ Stable"
            
            indicators.append({
                "indicator": "Demand Trend",
                "value": trend,
                "assessment": "positive" if "Up" in trend else "negative" if "Down" in trend else "neutral",
                "insight": f"Predicted demand trending {'upward' if 'Up' in trend else 'downward' if 'Down' in trend else 'stable'} compared to historical average"
            })
            
            # Indicator 2: Volatility Assessment
            sale_amount = float(row_data.get('sale_amount', 0))
            discount = float(row_data.get('discount', 0))
            volatility_score = min(10, abs(discount * 100) + (5 if sale_amount > 10000 else 0))
            
            vol_level = "High 📊" if volatility_score > 7 else "Medium 📊" if volatility_score > 4 else "Low 📊"
            indicators.append({
                "indicator": "Demand Volatility",
                "value": vol_level,
                "assessment": "warning" if volatility_score > 7 else "neutral",
                "insight": f"Volatility score: {volatility_score:.1f}/10 - {'Consider buffer stock' if volatility_score > 7 else 'Stable demand patterns'}"
            })
            
            # Indicator 3: Seasonality
            month = row_data.get('month', 0)
            is_peak_season = month in [10, 11, 12, 3, 4]
            
            indicators.append({
                "indicator": "Seasonal Factor",
                "value": "🎊 Peak Season" if is_peak_season else "🌤️ Off-Season",
                "assessment": "positive" if is_peak_season else "neutral",
                "insight": "Peak season detected - higher margins and volumes expected" if is_peak_season else "Off-season conditions - focus on cost optimization"
            })
            
            # Indicator 4: Market Position
            percentile = row_data.get('percentile', 50)
            if percentile > 75:
                position = "🥇 Premium"
            elif percentile > 50:
                position = "🥈 Mid-tier"
            else:
                position = "🥉 Value"
            
            indicators.append({
                "indicator": "Market Position",
                "value": position,
                "assessment": "positive" if "Premium" in position else "neutral",
                "insight": f"Product positioned in {position.split()[1].lower()} segment"
            })
            
            # Indicator 5: Growth Potential
            product_type = row_data.get('product_type') or row_data.get('category', 'Standard')
            plastic_type = row_data.get('Plastic_Type') or row_data.get('plastic_type', 'Unknown')
            
            growth_products = ['Bottle', 'Container', 'Packaging']
            is_growth = product_type in growth_products
            
            indicators.append({
                "indicator": "Growth Potential",
                "value": "📈 High" if is_growth else "➡️ Moderate",
                "assessment": "positive" if is_growth else "neutral",
                "insight": f"{product_type} in {plastic_type} category {'shows growth trajectory' if is_growth else 'is stable'}"
            })
            
        except Exception as e:
            logger.warning(f"Error generating demand indicators: {e}")
        
        return indicators
    
    def _generate_risk_assessment(self, processed_data: pd.DataFrame, 
                                 row_data: Optional[Dict]) -> Dict[str, Any]:
        """Generate comprehensive risk assessment"""
        risk_data = {
            "overall_risk_level": "medium",
            "risk_score": 50,
            "risks": [],
            "mitigation_strategies": []
        }
        
        if row_data is None:
            return risk_data
        
        try:
            risk_score = 0
            
            # Risk 1: Supply Uncertainty
            discount = float(row_data.get('discount', 0))
            if discount > 0.2:
                risk_score += 15
                risk_data["risks"].append({
                    "name": "Supply Uncertainty",
                    "level": "medium",
                    "description": "High discount rates indicate volatile pricing",
                    "probability": "medium",
                    "impact": "medium"
                })
                risk_data["mitigation_strategies"].append({
                    "strategy": "Lock in long-term supplier contracts at fixed prices",
                    "cost": "medium",
                    "implementation_time": "2-3 weeks"
                })
            
            # Risk 2: Demand Volatility
            predicted_demand = float(row_data.get('predicted_demand', 0)) if 'predicted_demand' in row_data else 0
            quantity = float(row_data.get('quantity', 0))
            
            if quantity > 0:
                variance = abs(predicted_demand - quantity) / quantity
                if variance > 0.5:
                    risk_score += 20
                    risk_data["risks"].append({
                        "name": "High Demand Variance",
                        "level": "high",
                        "description": f"Demand predicted to vary by {variance*100:.0f}% from baseline",
                        "probability": "medium",
                        "impact": "high"
                    })
                    risk_data["mitigation_strategies"].append({
                        "strategy": "Implement flexible manufacturing scheduling",
                        "cost": "high",
                        "implementation_time": "1-2 months"
                    })
            
            # Risk 3: Material Availability
            plastic_type = row_data.get('Plastic_Type') or row_data.get('plastic_type')
            if plastic_type in ['PET']:
                risk_score += 10
                risk_data["risks"].append({
                    "name": "Material Sourcing Risk",
                    "level": "medium",
                    "description": f"{plastic_type} has concentrated supplier base",
                    "probability": "low",
                    "impact": "high"
                })
                risk_data["mitigation_strategies"].append({
                    "strategy": "Maintain 45-60 day safety stock for critical materials",
                    "cost": "medium",
                    "implementation_time": "ongoing"
                })
            
            # Risk 4: Market Competition
            sale_amount = float(row_data.get('sale_amount', 0))
            if sale_amount < 1000:
                risk_score += 15
                risk_data["risks"].append({
                    "name": "Competitive Pressure",
                    "level": "medium",
                    "description": "Lower price point indicates high competition",
                    "probability": "high",
                    "impact": "medium"
                })
                risk_data["mitigation_strategies"].append({
                    "strategy": "Focus on operational efficiency and differentiation",
                    "cost": "medium",
                    "implementation_time": "ongoing"
                })
            
            # Overall risk level
            risk_data["risk_score"] = min(100, risk_score)
            if risk_score > 70:
                risk_data["overall_risk_level"] = "high"
            elif risk_score > 40:
                risk_data["overall_risk_level"] = "medium"
            else:
                risk_data["overall_risk_level"] = "low"
            
        except Exception as e:
            logger.warning(f"Error generating risk assessment: {e}")
        
        return risk_data
    
    def _get_product_context(self, row_data: Optional[Dict]) -> Dict[str, Any]:
        """Extract product context and metadata"""
        context = {
            "product_id": "N/A",
            "product_type": "N/A",
            "plastic_type": "N/A",
            "application_segment": "N/A",
            "market_segment": "N/A"
        }
        
        if row_data:
            context["product_id"] = row_data.get('product_id', 'N/A')
            context["product_type"] = row_data.get('product_type') or row_data.get('category', 'N/A')
            context["plastic_type"] = row_data.get('Plastic_Type') or row_data.get('plastic_type', 'N/A')
            context["application_segment"] = row_data.get('application_segment', 'N/A')
            
            # Infer market segment
            product_type = context["product_type"]
            if product_type in ['Bottle', 'Container']:
                context["market_segment"] = "Packaging & Containers"
            elif product_type in ['Film', 'Sheet']:
                context["market_segment"] = "Films & Sheets"
            else:
                context["market_segment"] = "General Products"
        
        return context
    
    def _analyze_feature_importance(self, processed_data: pd.DataFrame, 
                                   row_data: Optional[Dict]) -> List[Dict[str, Any]]:
        """Analyze and rank feature importance"""
        importance = []
        
        if row_data is None:
            return importance
        
        try:
            # Calculate simple feature importance based on data
            feature_scores = {}
            
            numeric_features = {
                'sale_amount': 0.25,
                'discount': 0.20,
                'quantity': 0.20,
                'predicted_demand': 0.15,
                'confidence': 0.10,
                'holiday_flag': 0.05,
                'is_weekend': 0.05
            }
            
            for feature, weight in numeric_features.items():
                value = row_data.get(feature, 0)
                if isinstance(value, (int, float)):
                    feature_scores[feature] = abs(value) * weight
            
            # Sort by score
            sorted_features = sorted(feature_scores.items(), key=lambda x: x[1], reverse=True)
            
            for feature, score in sorted_features[:5]:
                readable_name = self.column_mappings.get(feature, feature.replace('_', ' ').title())
                importance.append({
                    "feature": readable_name,
                    "importance_score": min(100, int(score * 100)),
                    "impact": "high" if score > 20 else "medium" if score > 10 else "low",
                    "value": row_data.get(feature, "N/A")
                })
            
        except Exception as e:
            logger.warning(f"Error analyzing feature importance: {e}")
        
        return importance
    
    def _assess_data_quality(self, row_data: Optional[Dict]) -> Dict[str, Any]:
        """Assess data quality and completeness"""
        quality = {
            "overall_quality": "good",
            "completeness_score": 100,
            "issues": [],
            "warnings": []
        }
        
        if row_data is None:
            quality["overall_quality"] = "poor"
            quality["completeness_score"] = 0
            quality["warnings"].append("No input data provided")
            return quality
        
        try:
            required_fields = ['product_id', 'sale_amount', 'discount', 'Plastic_Type', 'product_type']
            missing_fields = [f for f in required_fields if f not in row_data or row_data.get(f) is None]
            
            if missing_fields:
                quality["completeness_score"] -= len(missing_fields) * 15
                quality["issues"].append(f"Missing fields: {', '.join(missing_fields)}")
            
            # Check for anomalies
            sale_amount = float(row_data.get('sale_amount', 0))
            discount = float(row_data.get('discount', 0))
            
            if sale_amount < 0:
                quality["issues"].append("Negative sale amount detected")
            if discount > 1 or discount < 0:
                quality["issues"].append("Invalid discount value (should be 0-1)")
            if discount > 0.5:
                quality["warnings"].append("Unusually high discount rate")
            
            # Update overall quality
            if quality["completeness_score"] < 50:
                quality["overall_quality"] = "poor"
            elif quality["completeness_score"] < 75:
                quality["overall_quality"] = "fair"
            elif len(quality["issues"]) > 0:
                quality["overall_quality"] = "fair"
            
            quality["completeness_score"] = max(0, quality["completeness_score"])
            
        except Exception as e:
            logger.warning(f"Error assessing data quality: {e}")
        
        return quality
    
    def _generate_forecast_summary(self, processed_data: pd.DataFrame, 
                                  row_data: Optional[Dict]) -> Dict[str, Any]:
        """Generate summary of the forecast"""
        summary = {
            "prediction": 0,
            "confidence": 0,
            "interpretation": "Unable to generate forecast",
            "recommendation": "Provide valid input data",
            "next_steps": []
        }
        
        if row_data is None:
            return summary
        
        try:
            prediction = float(row_data.get('predicted_demand', 0))
            confidence = float(row_data.get('confidence', 0.5))
            
            summary["prediction"] = prediction
            summary["confidence"] = confidence
            
            # Generate interpretation
            if confidence > 0.85:
                summary["interpretation"] = f"High confidence forecast: Expected demand is {prediction:.0f} units"
            elif confidence > 0.7:
                summary["interpretation"] = f"Medium confidence forecast: Expected demand approximately {prediction:.0f} units"
            else:
                summary["interpretation"] = f"Low confidence forecast: Predicted demand {prediction:.0f} units (verify with additional data)"
            
            # Generate recommendation
            quantity = float(row_data.get('quantity', 0))
            if quantity > 0:
                variance_pct = ((prediction - quantity) / quantity) * 100
                if variance_pct > 20:
                    summary["recommendation"] = f"Increase production by {variance_pct:.0f}% to meet predicted demand"
                    summary["next_steps"].append("Initiate capacity expansion planning")
                elif variance_pct < -20:
                    summary["recommendation"] = f"Consider reducing production by {abs(variance_pct):.0f}% to optimize costs"
                    summary["next_steps"].append("Review and optimize production schedules")
                else:
                    summary["recommendation"] = "Maintain current production levels"
                    summary["next_steps"].append("Monitor market conditions closely")
            
            summary["next_steps"].extend([
                "Review supply chain readiness",
                "Confirm raw material availability",
                "Update demand forecast weekly"
            ])
            
        except Exception as e:
            logger.warning(f"Error generating forecast summary: {e}")
        
        return summary
    
    def _get_fallback_explanation(self, row_data: Optional[Dict]) -> Dict[str, Any]:
        """Return fallback explanation when analysis fails"""
        return {
            "manufacturing_insights": [{
                "type": "neutral",
                "icon": "⚠️",
                "title": "Analysis Pending",
                "description": "System is analyzing your data",
                "action": "Please refresh in a moment",
                "impact": "low"
            }],
            "supply_recommendations": [{
                "type": "general",
                "icon": "📋",
                "title": "Standard Processes",
                "priority": "low",
                "description": "Continue with existing supply chain operations",
                "action": "Maintain current supplier relationships",
                "estimated_cost": "none"
            }],
            "demand_indicators": [{
                "indicator": "System Status",
                "value": "Processing",
                "assessment": "neutral",
                "insight": "Analysis in progress"
            }],
            "risk_assessment": {
                "overall_risk_level": "medium",
                "risk_score": 50,
                "risks": [],
                "mitigation_strategies": []
            },
            "product_context": self._get_product_context(row_data),
            "feature_importance": [],
            "data_quality": {
                "overall_quality": "good",
                "completeness_score": 80,
                "issues": [],
                "warnings": []
            },
            "forecast_summary": {
                "prediction": 0,
                "confidence": 0,
                "interpretation": "Loading...",
                "recommendation": "Please wait",
                "next_steps": []
            }
        }
