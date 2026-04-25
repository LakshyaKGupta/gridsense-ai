from typing import List, Dict
from app.services.location_recommender import LocationRecommender
from app.services.demand_predictor import DemandPredictor
from app.database import SessionLocal
from app.models import Zone
from app.utils.cache import get_cache, set_cache

class ROIEngine:
    def __init__(self):
        self.recommender = LocationRecommender()
        self.predictor = DemandPredictor()

    async def calculate_roi_for_recommendations(self) -> List[Dict]:
        """Asynchronously calculate ROI for location recommendations"""
        cached = get_cache("roi:recommendations")
        if cached:
            return cached

        recommendations = self.recommender.recommend_new_stations()
        roi_calculations = []

        for rec in recommendations:
            zone_id = rec['zone_id']
            roi_data = await self._calculate_zone_roi(zone_id, rec)

            roi_calculations.append({
                "zone_id": zone_id,
                "zone_name": rec.get('zone_name', f"Zone {zone_id}"),
                "expected_utilization": roi_data['utilization'],
                "estimated_roi": roi_data['roi'],
                "payback_period_months": roi_data['payback_months'],
                "justification": rec.get('justification', "Strategic location for infrastructure")
            })

        set_cache("roi:recommendations", roi_calculations, expire=900)
        return roi_calculations

    async def _calculate_zone_roi(self, zone_id: int, recommendation: Dict) -> Dict:
        """Asynchronously calculate detailed ROI for a zone"""

        # A single 24h forecast is enough to estimate daily utilization and keeps the ROI
        # endpoint responsive for dashboard refresh cycles.
        forecast = await self.predictor.forecast_demand(zone_id, hours=24)
        avg_daily_demand = sum(f['predicted_demand'] for f in forecast['forecasts']) if forecast.get('forecasts') else 0

        # Estimate utilization (simplified model)
        # Assume new station can handle 20% of zone demand
        utilization_rate = min(0.85, avg_daily_demand * 0.2 / 50)  # 50kW station capacity

        # Revenue calculations
        avg_price_per_kwh = 0.25  # $0.25/kWh
        operating_hours_per_day = 16  # Average daily operating hours
        daily_revenue = utilization_rate * 50 * operating_hours_per_day * avg_price_per_kwh

        # Costs
        station_cost = 50000  # $50k installation cost
        maintenance_cost_yearly = 2000  # $2k/year
        electricity_cost_markup = 0.05  # 5% of revenue

        # Annual calculations
        annual_revenue = daily_revenue * 365
        annual_costs = maintenance_cost_yearly + (annual_revenue * electricity_cost_markup)
        annual_profit = annual_revenue - annual_costs

        # ROI calculation
        if station_cost > 0:
            roi = (annual_profit / station_cost) * 100
            payback_months = (station_cost / annual_profit) * 12 if annual_profit > 0 else 999
            payback_months = min(payback_months, 120)
            payback_months_int = int(round(payback_months))
        else:
            roi = 0
            payback_months = 0
            payback_months_int = 0

        return {
            "utilization": utilization_rate,
            "roi": roi,
            "payback_months": payback_months_int  # Integer months to payback
        }
