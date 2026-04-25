from typing import List, Dict
from datetime import datetime
from app.services.demand_predictor import DemandPredictor
from app.services.optimization_engine import OptimizationEngine
from app.services.simulation_engine import SimulationEngine
from app.services.alert_system import AlertSystem
from app.services.location_recommender import LocationRecommender
from app.database import SessionLocal
from app.models import Zone

class DashboardService:
    def __init__(self):
        self.predictor = DemandPredictor()
        self.optimizer = OptimizationEngine()
        self.simulator = SimulationEngine()
        self.alert_system = AlertSystem()
        self.recommender = LocationRecommender()

    async def get_dashboard_summary(self) -> Dict:
        """Get comprehensive dashboard summary"""
        # Try cache first
        try:
            from app.utils.cache import get_cache, set_cache
            cached = get_cache("dashboard:summary")
            if cached:
                return cached
        except Exception:
            cached = None

        # Get all zones
        db = SessionLocal()
        try:
            zones = db.query(Zone).all()
            zone_ids = [z.id for z in zones]
        finally:
            db.close()

        # Calculate total demand and realtime snapshot
        total_demand = 0
        realtime_snapshot = []
        peak_load = 0

        for zone_id in zone_ids:
            try:
                demand_data = await self.simulator.get_realtime_demand(zone_id)
                total_demand += demand_data.get('current_demand', 0)
                peak_load = max(peak_load, demand_data.get('current_demand', 0))
                realtime_snapshot.append(demand_data)
            except Exception as e:
                print(f"Error getting demand for zone {zone_id}: {e}")
                continue

        # Calculate optimized peak (average reduction across zones)
        total_reduction = 0
        valid_zones = 0

        for zone_id in zone_ids:
            try:
                impact = self.optimizer.compare_optimization(zone_id)
                total_reduction += impact.get('reduction_percent', 0)
                valid_zones += 1
            except Exception as e:
                print(f"Error calculating optimization for zone {zone_id}: {e}")
                continue

        avg_reduction = total_reduction / valid_zones if valid_zones > 0 else 0
        optimized_peak = peak_load * (1 - avg_reduction / 100)

        # Get alerts
        try:
            alerts = await self.alert_system.check_alerts()
            high_risk_zones = list(set([a['zone_id'] for a in alerts if a['severity'] == 'high']))
        except Exception as e:
            print(f"Error getting alerts: {e}")
            high_risk_zones = []

        # Get recommendations
        try:
            recommendations = self.recommender.recommend_new_stations()
            recommended_zones = [r['zone_id'] for r in recommendations]
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            recommended_zones = []

        result = {
            "total_demand": total_demand,
            "peak_load": peak_load,
            "optimized_peak": optimized_peak,
            "reduction_percent": avg_reduction,
            "high_risk_zones": high_risk_zones,
            "recommended_zones": recommended_zones,
            "realtime_snapshot": realtime_snapshot,
            "timestamp": datetime.now()
        }

        # Cache the result for short period
        try:
            set_cache("dashboard:summary", result, expire=30)
        except Exception:
            pass

        return result