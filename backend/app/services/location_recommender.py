from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Zone, ChargingStation, ChargingSession
from app.services.demand_predictor import DemandPredictor
from typing import List, Dict
from datetime import datetime
import math

class LocationRecommender:
    def recommend_new_stations(self) -> List[Dict]:
        """Recommend zones for new charging stations"""
        db = SessionLocal()
        predictor = DemandPredictor()
        try:
            zones = db.query(Zone).all()
            recommendations = []

            for zone in zones:
                # Calculate demand density
                sessions = db.query(ChargingSession).join(ChargingSession.station).filter(
                    ChargingSession.station.has(zone_id=zone.id)
                ).count()

                stations_count = db.query(ChargingStation).filter(ChargingStation.zone_id == zone.id).count()

                # Simulate demand prediction for peak hour
                peak_hour = datetime.now().replace(hour=20, minute=0, second=0, microsecond=0)
                demand, confidence, _ = predictor.predict_demand(zone.id, peak_hour)

                # Calculate scores
                demand_density = demand / max(stations_count, 1)
                growth_rate = min(sessions / max(stations_count, 1), 10)  # Cap at 10

                # Grid stress (inverse of utilization)
                total_capacity = sum(s.capacity for s in db.query(ChargingStation).filter(ChargingStation.zone_id == zone.id).all())
                current_load = sum(s.current_load for s in db.query(ChargingStation).filter(ChargingStation.zone_id == zone.id).all())
                utilization = current_load / max(total_capacity, 1)
                grid_stress = max(0, utilization - 0.8)  # Stress above 80% utilization

                # Composite score
                score = demand_density * growth_rate * (1 - grid_stress)

                if score > 0:
                    recommendations.append({
                        "zone_id": zone.id,
                        "zone_name": zone.name,
                        "score": round(score, 2),
                        "justification": f"High demand ({demand:.1f} kW), growth rate {growth_rate:.1f}, grid stress {grid_stress:.2f}"
                    })

            # Sort by score descending
            recommendations.sort(key=lambda x: x['score'], reverse=True)
            return recommendations[:5]  # Top 5

        finally:
            db.close()