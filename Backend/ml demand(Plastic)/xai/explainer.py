import numpy as np
import pandas as pd
import logging
import shap

logger = logging.getLogger(__name__)


class XAIExplainer:

    def __init__(self, model, feature_names):
        self.model = model
        self.feature_names = feature_names
        self.shap_explainer = None

    # -----------------------------
    # SHAP EXPLANATION
    # -----------------------------
    def generate_shap_explanation(self, input_df):

        try:
            if self.shap_explainer is None:
                self.shap_explainer = shap.TreeExplainer(self.model)

            shap_values = self.shap_explainer.shap_values(input_df)

            feature_importance = {}

            for i, feature in enumerate(self.feature_names):
                feature_importance[feature] = float(shap_values[0][i])

            return feature_importance

        except Exception as e:
            logger.error(f"SHAP explanation error: {e}")
            return {}

    # -----------------------------
    # MAIN EXPLAIN FUNCTION
    # -----------------------------
    def explain(self, row_data, feature_names=None, raw_input=None):
        # Support callers that pass either:
        # - explain(row_dict)
        # - explain(processed_df, feature_names, raw_input)
        if isinstance(row_data, pd.DataFrame):
            input_df = row_data.copy()
            row_for_rules = raw_input or {}
        else:
            cols = feature_names or self.feature_names
            input_df = pd.DataFrame([row_data], columns=cols)
            row_for_rules = row_data if isinstance(row_data, dict) else {}

        shap_explanation = self.generate_shap_explanation(input_df)

        manufacturing_insights = self._generate_manufacturing_insights(row_for_rules)

        supply_recommendations = self._generate_supply_recommendations(row_for_rules)

        feature_analysis = self._analyze_feature_contribution(shap_explanation)

        explanations = {
            "manufacturing_insights": manufacturing_insights,
            "supply_recommendations": supply_recommendations,
            "product_context": self._get_detailed_product_context(row_for_rules),
            "demand_indicators": self.get_demand_indicators(row_for_rules),
            "risk_assessment": self.assess_comprehensive_risk(row_for_rules, shap_explanation),
            "feature_analysis": feature_analysis,
            "prediction_quality": self.assess_prediction_quality(shap_explanation),
            "unique_product_characteristics": self.identify_unique_factors(row_for_rules, shap_explanation)
        }

        return explanations

    # -----------------------------
    # MANUFACTURING INSIGHTS
    # -----------------------------
    def _generate_manufacturing_insights(self, row):

        insights = []

        if "price" in row and row["price"] > 100:
            insights.append("High price product may reduce demand")

        if "inventory" in row and row["inventory"] < 50:
            insights.append("Low inventory risk detected")

        return insights

    # -----------------------------
    # SUPPLY RECOMMENDATIONS
    # -----------------------------
    def _generate_supply_recommendations(self, row):

        recommendations = []

        if "inventory" in row and row["inventory"] < 50:
            recommendations.append("Increase supply immediately")

        if "lead_time" in row and row["lead_time"] > 10:
            recommendations.append("Consider faster suppliers")

        return recommendations

    # -----------------------------
    # FEATURE CONTRIBUTION ANALYSIS
    # -----------------------------
    def _analyze_feature_contribution(self, shap_values):

        positive = {}
        negative = {}

        for feature, value in shap_values.items():

            if value > 0:
                positive[feature] = value
            else:
                negative[feature] = value

        return {
            "positive_drivers": positive,
            "negative_drivers": negative
        }

    # -----------------------------
    # PRODUCT CONTEXT
    # -----------------------------
    def _get_detailed_product_context(self, row):

        return {
            "product": row.get("product", "unknown"),
            "category": row.get("category", "unknown")
        }

    # -----------------------------
    # DEMAND INDICATORS
    # -----------------------------
    def get_demand_indicators(self, row):

        indicators = []

        if "sales_last_month" in row and row["sales_last_month"] > 500:
            indicators.append("High demand trend")

        if "season" in row and row["season"] == "festival":
            indicators.append("Seasonal demand spike")

        return indicators

    # -----------------------------
    # RISK ANALYSIS
    # -----------------------------
    def assess_comprehensive_risk(self, row, shap_values):

        risk_score = 0

        if "inventory" in row and row["inventory"] < 30:
            risk_score += 2

        if "lead_time" in row and row["lead_time"] > 15:
            risk_score += 1

        return {
            "risk_score": risk_score,
            "risk_level": "HIGH" if risk_score >= 2 else "LOW"
        }

    # -----------------------------
    # PREDICTION QUALITY
    # -----------------------------
    def assess_prediction_quality(self, shap_values):

        magnitude = sum(abs(v) for v in shap_values.values())

        if magnitude > 5:
            quality = "HIGH CONFIDENCE"
        else:
            quality = "MEDIUM CONFIDENCE"

        return {
            "confidence": quality
        }

    # -----------------------------
    # UNIQUE FACTORS
    # -----------------------------
    def identify_unique_factors(self, row, shap_values):

        sorted_features = sorted(
            shap_values.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )

        return sorted_features[:3]
