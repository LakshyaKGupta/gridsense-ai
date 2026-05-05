import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.services.demand_predictor import DemandPredictor, SCENARIO_MULTIPLIERS
from app.services.ev_stations import calculate_route, get_real_stations
from app.services.location_recommender import LocationRecommender
from app.services.zone_catalog import ZONE_CATALOG, get_zone, get_zone_by_name, nearest_zone


SCENARIO_LABELS = {
    "normal": "Normal",
    "evening_peak": "Evening Peak",
    "high_growth": "High Growth",
    "outage": "Outage",
}

SERVICE_AREA_CENTER = {"lat": 12.9716, "lng": 77.5946}
SERVICE_AREA_RADIUS_KM = 60.0


class PortalService:
    def __init__(self):
        self.predictor = DemandPredictor()
        self.recommender = LocationRecommender()
        self.active_scenario = "normal"

    def set_scenario(self, scenario: str) -> str:
        self.active_scenario = scenario if scenario in SCENARIO_MULTIPLIERS else "normal"
        return self.active_scenario

    async def get_operator_dashboard(self, zone_name: Optional[str], scenario: Optional[str]) -> Dict:
        scenario_key = self.set_scenario(scenario or self.active_scenario)
        selected_zone = get_zone_by_name(zone_name)
        zone_id = int(selected_zone["id"])
        now = datetime.now()

        current = self.predictor.predict_demand_details(zone_id, now, scenario_key)
        forecast_points: List[Dict] = []
        for offset in range(24):
            target_time = now + timedelta(hours=offset)
            point = self.predictor.predict_demand_details(zone_id, target_time, scenario_key)
            forecast_points.append({
                "hour": offset,
                "label": target_time.strftime("%H:%M"),
                "predicted_demand": point["prediction"],
                "confidence_lower": point["confidence_lower"],
                "confidence_upper": point["confidence_upper"],
                "status": point["status"],
                "timestamp": point["timestamp"],
                "explanation": point["explanation"],
            })
        peak_point = max(forecast_points, key=lambda item: item["predicted_demand"])

        recommendations = self.recommender.recommend_new_stations()
        planning_insights = []
        for item in recommendations[:3]:
            planning_insights.append({
                "headline": f"Add 3 chargers in {item['zone_name']}",
                "reason": item["justification"],
                "impact": "Expands coverage in the highest-pressure zone and reduces spillover into adjacent feeders.",
                "confidence": f"{min(95, max(62, int(item['score'] * 6)))}%",
            })

        baseline = self.predictor.predict_demand_details(zone_id, now, "normal")
        zone_rankings = []
        at_risk_count = 0
        constrained_count = 0
        highest_headroom_zone = None
        for zone in ZONE_CATALOG:
            zone_current = self.predictor.predict_demand_details(int(zone["id"]), now, scenario_key)
            headroom = round(zone_current["capacity"] - zone_current["prediction"], 2)
            utilization_percent = round((zone_current["prediction"] / max(zone_current["capacity"], 1)) * 100, 1)
            zone_summary = {
                "id": int(zone["id"]),
                "name": str(zone["name"]),
                "predicted_load": zone_current["prediction"],
                "capacity": zone_current["capacity"],
                "headroom_kw": headroom,
                "utilization_percent": utilization_percent,
                "status": zone_current["status"],
                "type": str(zone["zone_type"]),
                "active": int(zone["id"]) == zone_id,
            }
            zone_rankings.append(zone_summary)
            if zone_current["status"] == "OVERLOAD RISK":
                at_risk_count += 1
            elif zone_current["status"] == "CONSTRAINED":
                constrained_count += 1

            if highest_headroom_zone is None or headroom > highest_headroom_zone["headroom_kw"]:
                highest_headroom_zone = zone_summary

        zone_rankings.sort(key=lambda item: item["utilization_percent"], reverse=True)
        scenario_delta = round(current["prediction"] - baseline["prediction"], 2)
        action_queue = [
            {
                "priority": "Immediate",
                "title": f"Dispatch queue balancing in {selected_zone['name']}",
                "reason": current["explanation"]["reason"],
                "impact": f"Reduces the current scenario overrun by up to {max(8, abs(int(current['prediction'] - current['capacity'])))} kW.",
                "confidence": current["explanation"]["confidence"],
            },
            {
                "priority": "Next 2 Hours",
                "title": f"Shift public charging demand away from {data_point_label(peak_point)}",
                "reason": f"Peak forecast remains at {peak_point['predicted_demand']:.0f} kW with upper bound {peak_point['confidence_upper']:.0f} kW.",
                "impact": "Targeted load shifting reduces feeder stress during the highest-confidence congestion window.",
                "confidence": peak_point["explanation"]["confidence"],
            },
            {
                "priority": "Planning",
                "title": planning_insights[0]["headline"] if planning_insights else "Review charger placement priorities",
                "reason": planning_insights[0]["reason"] if planning_insights else current["explanation"]["reason"],
                "impact": planning_insights[0]["impact"] if planning_insights else "Improves headroom in the most constrained growth corridor.",
                "confidence": planning_insights[0]["confidence"] if planning_insights else current["explanation"]["confidence"],
            },
        ]

        return {
            "role": "operator",
            "scenario": scenario_key,
            "scenario_options": [
                {"id": key, "label": label, "active": key == scenario_key}
                for key, label in SCENARIO_LABELS.items()
            ],
            "zone": selected_zone,
            "grid_stress": {
                "predicted_load": current["prediction"],
                "capacity": current["capacity"],
                "status": current["status"],
                "delta_kw": round(current["prediction"] - current["capacity"], 2),
                "explanation": current["explanation"],
            },
            "forecast": {
                "zone_id": zone_id,
                "zone_name": selected_zone["name"],
                "curve": forecast_points,
                "peak": {
                    "label": datetime.fromisoformat(peak_point["timestamp"]).strftime("%H:%M"),
                    "predicted_demand": peak_point["predicted_demand"],
                    "confidence_upper": peak_point["confidence_upper"],
                },
                "model": current["model"],
            },
            "network_summary": {
                "zones_at_risk": at_risk_count,
                "constrained_zones": constrained_count,
                "peak_window": data_point_label(peak_point),
                "highest_headroom_zone": highest_headroom_zone["name"] if highest_headroom_zone else selected_zone["name"],
                "scenario_delta_kw": scenario_delta,
            },
            "action_queue": action_queue,
            "zone_rankings": zone_rankings,
            "planning_insights": planning_insights,
            "all_zones": [
                {
                    "id": int(zone["id"]),
                    "name": str(zone["name"]),
                    "lat": float(zone["lat"]),
                    "lng": float(zone["lng"]),
                    "capacity": float(zone["capacity"]),
                    "type": str(zone["zone_type"]),
                    "active": int(zone["id"]) == zone_id,
                }
                for zone in ZONE_CATALOG
            ],
        }

    async def get_user_dashboard(
        self,
        lat: float,
        lng: float,
        selected_station_id: Optional[int],
        vehicle_model: Optional[str],
        battery_capacity_kwh: Optional[float],
        home_charging_access: Optional[bool],
        typical_charging_time: Optional[str],
    ) -> Dict:
        service_area_notice = None
        if self._distance_km(lat, lng, SERVICE_AREA_CENTER["lat"], SERVICE_AREA_CENTER["lng"]) > SERVICE_AREA_RADIUS_KM:
            lat = SERVICE_AREA_CENTER["lat"]
            lng = SERVICE_AREA_CENTER["lng"]
            service_area_notice = "Live location was outside the Bengaluru service area, so recommendations were anchored to central Bengaluru."

        user_location = {"lat": lat, "lng": lng}
        nearest_zone_meta = nearest_zone(lat, lng)
        zone_id = int(nearest_zone_meta["id"])
        current = self.predictor.predict_demand_details(zone_id, datetime.now(), "normal")
        stations = await get_real_stations(user_location)
        nearest_station = stations[0] if stations else None
        selected_station = next((station for station in stations if station["id"] == selected_station_id), None) if selected_station_id else None
        route_station = selected_station or nearest_station
        route = None
        if route_station:
            route = await calculate_route(lat, lng, route_station["lat"], route_station["lng"])

        charging_windows = await self._build_charging_windows(zone_id)
        best_window = charging_windows[0] if charging_windows else None
        decision_support = self._build_user_decision_support(
            stations=stations,
            route=route,
            nearest_station=nearest_station,
            selected_station=route_station,
            battery_capacity_kwh=battery_capacity_kwh,
            home_charging_access=home_charging_access,
        )
        alternatives = self._build_station_alternatives(stations, battery_capacity_kwh)

        return {
            "role": "user",
            "zone": nearest_zone_meta,
            "effective_location": user_location,
            "profile_context": {
                "vehicle_model": vehicle_model or "Not provided",
                "battery_capacity_kwh": battery_capacity_kwh,
                "home_charging_access": home_charging_access,
                "typical_charging_time": typical_charging_time or "flexible",
            },
            "service_area_notice": service_area_notice,
            "nearest_station": nearest_station,
            "selected_station": route_station,
            "route": route,
            "station_options": stations[:6],
            "alternatives": alternatives,
            "decision_support": decision_support,
            "charging_recommendation": best_window,
            "load_context": current,
        }

    async def _build_charging_windows(self, zone_id: int) -> List[Dict]:
        windows = []
        now = datetime.now()
        for offset in range(1, 9):
            target_time = now + timedelta(hours=offset)
            point = self.predictor.predict_demand_details(zone_id, target_time, "normal")
            windows.append(point)

        windows.sort(key=lambda item: item["prediction"])
        recommendations = []
        for point in windows[:3]:
            target_hour = datetime.fromisoformat(point["timestamp"]).strftime("%-I %p")
            load_reduction = max(5, int((1 - (point["prediction"] / max(point["capacity"], 1))) * 40))
            recommendations.append({
                "time_label": target_hour,
                "predicted_demand": point["prediction"],
                "headline": f"Avoid 7-9 PM. Charge at {target_hour} to reduce wait by {load_reduction}%.",
                "reason": point["explanation"]["reason"],
                "impact": point["explanation"]["impact"],
                "confidence": point["explanation"]["confidence"],
            })
        return recommendations

    def _build_station_alternatives(self, stations: List[Dict], battery_capacity_kwh: Optional[float]) -> List[Dict]:
        target_energy = max(12.0, min((battery_capacity_kwh or 45) * 0.42, 32.0))
        alternatives = []
        for station in stations[:5]:
            drive_minutes = max(4, int(round(station["distance"] * 3.8)))
            charge_minutes = max(18, int(round(target_energy / 1.1)))
            total_minutes = drive_minutes + int(round(station["wait_time"])) + charge_minutes
            score = round((station["capacity"] - station["load"]) - (station["distance"] * 12) - (station["wait_time"] * 3), 1)
            alternatives.append({
                "id": station["id"],
                "name": station["name"],
                "operator": station.get("operator") or "EV Operator",
                "status": station["status"],
                "distance_km": station["distance"],
                "wait_time_minutes": round(station["wait_time"]),
                "estimated_total_minutes": total_minutes,
                "score": score,
                "reason": self._station_reason(station),
            })
        alternatives.sort(key=lambda item: item["estimated_total_minutes"])
        if alternatives:
            best_id = alternatives[0]["id"]
            for option in alternatives:
                option["is_best"] = option["id"] == best_id
        return alternatives

    def _build_user_decision_support(
        self,
        stations: List[Dict],
        route: Optional[Dict],
        nearest_station: Optional[Dict],
        selected_station: Optional[Dict],
        battery_capacity_kwh: Optional[float],
        home_charging_access: Optional[bool],
    ) -> Dict:
        target_energy = round(max(12.0, min((battery_capacity_kwh or 45) * 0.42, 32.0)), 1)
        public_tariff = 19.5
        home_tariff = 8.2
        public_cost = round(target_energy * public_tariff, 0)
        home_cost = round(target_energy * home_tariff, 0) if home_charging_access else None
        route_minutes = route["duration_minutes"] if route else max(5, int(round((selected_station or nearest_station or {}).get("distance", 0) * 4)))
        queue_minutes = round((selected_station or nearest_station or {}).get("wait_time", 0))
        charge_minutes = max(18, int(round(target_energy / 1.1)))
        total_session_minutes = route_minutes + queue_minutes + charge_minutes
        best_alternative = min(stations[:5], key=lambda station: station["wait_time"] + (station["distance"] * 3.8)) if stations else None
        best_alternative_minutes = 0
        if best_alternative:
            best_alternative_minutes = max(4, int(round(best_alternative["distance"] * 3.8))) + int(round(best_alternative["wait_time"])) + charge_minutes

        return {
            "target_energy_kwh": target_energy,
            "estimated_session_minutes": total_session_minutes,
            "public_cost_inr": public_cost,
            "home_cost_inr": home_cost,
            "savings_vs_home_inr": round(public_cost - home_cost, 0) if home_cost is not None else None,
            "queue_time_savings_minutes": max(0, total_session_minutes - best_alternative_minutes),
            "route_provider": route["provider"] if route else "haversine",
            "home_charge_recommended": bool(home_charging_access and home_cost is not None and public_cost - home_cost >= 120),
        }

    def _station_reason(self, station: Dict) -> str:
        if station["status"] == "GREEN":
            return "Low queue pressure and strong capacity headroom."
        if station["status"] == "YELLOW":
            return "Moderate queue pressure but still serviceable for a planned stop."
        return "High congestion risk. Use only if route convenience outweighs queue delay."

    def _distance_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        radius = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lng = math.radians(lng2 - lng1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
        )
        return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def data_point_label(point: Dict) -> str:
    return datetime.fromisoformat(point["timestamp"]).strftime("%H:%M")
