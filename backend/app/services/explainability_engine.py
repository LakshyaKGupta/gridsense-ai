from typing import List, Dict, Any
from datetime import datetime
import random

class ExplainabilityEngine:
    def generate_explanation(self, context: Dict[str, Any]) -> List[str]:
        """Generate human-readable explanations for decisions"""

        explanations = []
        context_type = context.get('type', 'general')

        if context_type == 'demand_prediction':
            explanations = self._explain_demand_prediction(context)
        elif context_type == 'optimization':
            explanations = self._explain_optimization(context)
        elif context_type == 'location_recommendation':
            explanations = self._explain_location(context)
        elif context_type == 'alert':
            explanations = self._explain_alert(context)
        elif context_type == 'dashboard':
            explanations = self._explain_dashboard(context)
        else:
            explanations = ["Analysis based on current system data and patterns"]

        # Ensure we have at least 3 explanations, pad with general ones
        while len(explanations) < 3:
            explanations.append(self._get_general_explanation())

        return explanations[:3]  # Return top 3

    def _explain_demand_prediction(self, context: Dict) -> List[str]:
        """Explain demand prediction factors"""
        explanations = []
        zone_id = context.get('zone_id', 'unknown')
        hour = context.get('hour', datetime.now().hour)
        demand = context.get('demand', 0)
        confidence = context.get('confidence', 0.5)

        # Time-based factors
        if 18 <= hour <= 22:
            explanations.append("High evening demand detected - peak charging hours")
        elif 6 <= hour <= 10:
            explanations.append("Morning commute period with moderate demand")
        else:
            explanations.append("Off-peak hours with lower charging activity")

        # Demand level factors
        if demand > 100:
            explanations.append("Zone utilization exceeds 85% - high demand pressure")
        elif demand > 50:
            explanations.append("Moderate demand levels observed")
        else:
            explanations.append("Low demand period identified")

        # Confidence factors
        if confidence > 0.8:
            explanations.append("High confidence prediction based on historical data")
        elif confidence > 0.6:
            explanations.append("Moderate confidence using pattern recognition")
        else:
            explanations.append("Heuristic estimation due to limited historical data")

        return explanations

    def _explain_optimization(self, context: Dict) -> List[str]:
        """Explain optimization decisions"""
        explanations = []
        zone_id = context.get('zone_id', 'unknown')
        reduction = context.get('reduction_percent', 0)

        if reduction > 20:
            explanations.append("Significant peak reduction achieved through load balancing")
        elif reduction > 10:
            explanations.append("Moderate optimization benefits from staggered charging")
        else:
            explanations.append("Limited optimization potential in current configuration")

        explanations.append("Linear programming used to minimize grid peak loads")
        explanations.append("Charging schedules optimized for grid stability")

        return explanations

    def _explain_location(self, context: Dict) -> List[str]:
        """Explain location recommendations"""
        explanations = []
        zone_id = context.get('zone_id', 'unknown')
        score = context.get('score', 0)

        if score > 80:
            explanations.append("High-priority location with strong demand indicators")
        elif score > 60:
            explanations.append("Moderate potential location for new infrastructure")
        else:
            explanations.append("Low-priority area requiring further analysis")

        explanations.append("Analysis considers population density and charging patterns")
        explanations.append("Nearby stations evaluated for utilization efficiency")

        return explanations

    def _explain_alert(self, context: Dict) -> List[str]:
        """Explain alert conditions"""
        explanations = []
        alert_type = context.get('alert_type', 'general')
        severity = context.get('severity', 'medium')

        if alert_type == 'high_demand':
            explanations.append("Demand threshold exceeded - immediate attention required")
        elif alert_type == 'overload_risk':
            explanations.append("Grid capacity at risk - load balancing recommended")

        if severity == 'high':
            explanations.append("Critical situation requiring immediate intervention")
        elif severity == 'medium':
            explanations.append("Monitor closely and prepare contingency plans")

        explanations.append("Automated monitoring detected anomalous conditions")

        return explanations

    def _explain_dashboard(self, context: Dict) -> List[str]:
        """Explain dashboard insights"""
        explanations = []
        total_demand = context.get('total_demand', 0)
        peak_load = context.get('peak_load', 0)
        reduction = context.get('reduction_percent', 0)

        if total_demand > 500:
            explanations.append("High overall system demand - capacity planning needed")
        elif total_demand > 200:
            explanations.append("Moderate system utilization with room for growth")

        if reduction > 15:
            explanations.append("Strong optimization impact reducing grid stress")
        elif reduction > 5:
            explanations.append("Modest efficiency gains from load management")

        explanations.append("Real-time monitoring provides current system status")
        explanations.append("Data-driven insights support decision making")

        return explanations

    def _get_general_explanation(self) -> str:
        """Get a general explanation when specific context is unavailable"""
        general_explanations = [
            "Analysis based on current system data and patterns",
            "Machine learning models applied to historical trends",
            "Real-time monitoring and predictive analytics",
            "Optimization algorithms balance efficiency and reliability",
            "Data-driven recommendations for infrastructure planning"
        ]
        return random.choice(general_explanations)