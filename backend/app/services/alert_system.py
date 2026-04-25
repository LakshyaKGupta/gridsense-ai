from typing import List, Dict
from datetime import datetime
from app.services.demand_predictor import DemandPredictor
from app.services.simulation_engine import SimulationEngine
from app.database import SessionLocal
from app.models import Zone

class AlertSystem:
    def __init__(self):
        self.predictor = DemandPredictor()
        self.simulator = SimulationEngine()
        self.demand_threshold = 150  # kW threshold for high demand
        self.capacity_threshold = 0.9  # 90% capacity utilization

    async def check_alerts(self) -> List[Dict]:
        """Asynchronously check for system alerts"""
        alerts = []

        # Get all zones
        db = SessionLocal()
        try:
            zones = db.query(Zone).all()

            for zone in zones:
                # Check demand alerts
                demand_alerts = await self._check_demand_alerts(zone.id)
                alerts.extend(demand_alerts)

                # Check capacity alerts
                capacity_alerts = await self._check_capacity_alerts(zone.id)
                alerts.extend(capacity_alerts)

        finally:
            db.close()

        return alerts

    async def _check_demand_alerts(self, zone_id: int) -> List[Dict]:
        """Async check for high demand alerts"""
        alerts = []
        current_demand = await self.simulator.get_realtime_demand(zone_id)
        demand_value = current_demand.get('current_demand', 0)

        if demand_value > self.demand_threshold:
            severity = "high" if demand_value > self.demand_threshold * 1.5 else "medium"

            alerts.append({
                "zone_id": zone_id,
                "alert_type": "high_demand",
                "severity": severity,
                "message": f"Zone {zone_id} demand at {demand_value:.1f} kW - exceeds threshold",
                "timestamp": datetime.now()
            })

        return alerts

    async def _check_capacity_alerts(self, zone_id: int) -> List[Dict]:
        """Async check for capacity overload alerts"""
        alerts = []

        db = SessionLocal()
        try:
            # Get zone capacity
            from app.models import ChargingStation
            stations = db.query(ChargingStation).filter(ChargingStation.zone_id == zone_id).all()
            total_capacity = sum(s.capacity for s in stations)

            if total_capacity > 0:
                # Get current demand
                current_demand = await self.simulator.get_realtime_demand(zone_id)
                demand_value = current_demand.get('current_demand', 0)

                utilization = demand_value / total_capacity

                if utilization > self.capacity_threshold:
                    severity = "high" if utilization > 0.95 else "medium"

                    alerts.append({
                        "zone_id": zone_id,
                        "alert_type": "overload_risk",
                        "severity": severity,
                        "message": f"Zone {zone_id} at {utilization:.1%} capacity utilization",
                        "timestamp": datetime.now()
                    })

        finally:
            db.close()

        return alerts