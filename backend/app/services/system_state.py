import asyncio
import math
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List

DEFAULT_CENTER = {"lat": 12.9716, "lng": 77.5946}

DEFAULT_ZONES = [
    {"id": 1, "name": "Indiranagar", "lat": 12.9784, "lng": 77.6408},
    {"id": 2, "name": "Koramangala", "lat": 12.9279, "lng": 77.6271},
    {"id": 3, "name": "Whitefield", "lat": 12.9698, "lng": 77.7499},
    {"id": 4, "name": "Electronic City", "lat": 12.8399, "lng": 77.6770},
    {"id": 5, "name": "Jayanagar", "lat": 12.9299, "lng": 77.5826},
]

STATION_CAPACITY_OPTIONS = [50, 100, 150, 200]


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def generate_initial_stations() -> List[Dict[str, Any]]:
    stations: List[Dict[str, Any]] = []
    base_lat, base_lng = DEFAULT_CENTER["lat"], DEFAULT_CENTER["lng"]

    for i in range(1, 21):
        lat_offset = random.uniform(-0.08, 0.08)
        lng_offset = random.uniform(-0.08, 0.08)
        capacity = random.choice(STATION_CAPACITY_OPTIONS)
        load = round(random.uniform(10, capacity * 0.4), 1)
        zone_id = (i % len(DEFAULT_ZONES)) + 1
        station = {
            "id": i,
            "name": f"Station {chr(65 + ((i - 1) % 26))}{(i % 9) + 1}",
            "lat": base_lat + lat_offset,
            "lng": base_lng + lng_offset,
            "load": load,
            "capacity": capacity,
            "zone_id": zone_id,
            "status": "GREEN",
            "wait_time": 0,
            "distance": round(haversine(base_lat + lat_offset, base_lng + lng_offset, DEFAULT_CENTER["lat"], DEFAULT_CENTER["lng"]), 2),
            "is_best_option": False,
        }
        stations.append(station)

    return stations


class SystemStateEngine:
    def __init__(self):
        self.zones = DEFAULT_ZONES
        self.stations = generate_initial_stations()
        self.state = {
            "zones": self.zones,
            "stations": self.stations,
            "nearby_stations": [],
            "demand": [],
            "predictions": [],
            "alerts": [],
            "timestamp": datetime.now(),
        }
        self.update_system_state()

    def _compute_station_distance(self, station: Dict[str, Any], location: Dict[str, float]) -> float:
        return round(haversine(station["lat"], station["lng"], location["lat"], location["lng"]), 2)

    def _update_station_loads(self) -> None:
        hour = datetime.now().hour
        is_peak = 18 <= hour <= 22

        for station in self.stations:
            change = random.uniform(-5, 8) if is_peak else random.uniform(-6, 5)
            new_load = max(0, min(station["capacity"], station["load"] + change))
            station["load"] = round(new_load, 1)

            utilization = new_load / max(station["capacity"], 1)
            if utilization >= 0.85:
                station["status"] = "RED"
            elif utilization >= 0.55:
                station["status"] = "YELLOW"
            else:
                station["status"] = "GREEN"

            station["wait_time"] = int(max(0, (utilization - 0.45) * 25))
            station["distance"] = round(self._compute_station_distance(station, DEFAULT_CENTER), 2)
            station["is_best_option"] = station["status"] == "GREEN" and station["wait_time"] <= 5

    def _compute_zone_demand(self) -> List[Dict[str, Any]]:
        demand: List[Dict[str, Any]] = []
        for zone in self.zones:
            zone_stations = [s for s in self.stations if s["zone_id"] == zone["id"]]
            current_load = round(sum(s["load"] for s in zone_stations), 1)
            noise = random.uniform(-6, 6)
            trend = "stable"
            if noise > 3:
                trend = "increasing"
            elif noise < -3:
                trend = "decreasing"

            predicted_demand = round(max(0, current_load + (current_load * 0.08 if trend == "increasing" else -current_load * 0.05 if trend == "decreasing" else current_load * 0.02)), 1)
            demand.append({
                "zone_id": zone["id"],
                "current_demand": current_load,
                "trend": trend,
                "timestamp": datetime.now(),
                "predicted_demand": predicted_demand,
                "active_sessions": random.randint(4, 16),
            })

        return demand

    def _compute_predictions(self, demand: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        predictions: List[Dict[str, Any]] = []
        for item in demand:
            predictions.append({
                "zone_id": item["zone_id"],
                "predicted_demand": item["predicted_demand"],
                "confidence": 0.85 if item["trend"] == "increasing" else 0.92 if item["trend"] == "stable" else 0.78,
                "window_hours": [
                    datetime.now().isoformat(),
                    (datetime.now() + timedelta(hours=3)).isoformat(),
                ],
            })
        return predictions

    def _compute_alerts(self, demand: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        alerts: List[Dict[str, Any]] = []
        for item in demand:
            if item["current_demand"] >= 180 or item["trend"] == "increasing":
                alerts.append({
                    "zone_id": item["zone_id"],
                    "alert_type": "overload_risk",
                    "severity": "high" if item["current_demand"] >= 180 else "medium",
                    "message": f"Zone {item['zone_id']} demand is {item['current_demand']}kW and trending {item['trend']}",
                    "timestamp": datetime.now(),
                })

        for station in [s for s in self.stations if s["status"] == "RED"]:
            alerts.append({
                "zone_id": station["zone_id"],
                "alert_type": "station_overload",
                "severity": "high",
                "message": f"{station['name']} is overloaded with {station['load']}kW", 
                "timestamp": datetime.now(),
            })

        return alerts

    def _compute_nearby_stations(self, location: Dict[str, float]) -> List[Dict[str, Any]]:
        sorted_stations = sorted(self.stations, key=lambda station: self._compute_station_distance(station, location))
        nearest = [dict(station) for station in sorted_stations[:5]]
        best = min(nearest, key=lambda x: x["wait_time"])
        for station in nearest:
            station["is_best_option"] = station["id"] == best["id"]
            station["distance"] = self._compute_station_distance(station, location)
        return nearest

    def update_system_state(self) -> None:
        self._update_station_loads()
        demand = self._compute_zone_demand()
        self.state["demand"] = demand
        self.state["predictions"] = self._compute_predictions(demand)
        self.state["alerts"] = self._compute_alerts(demand)
        self.state["nearby_stations"] = self._compute_nearby_stations(DEFAULT_CENTER)
        self.state["timestamp"] = datetime.now()
        self.state["stations"] = self.stations

    def get_state(self) -> Dict[str, Any]:
        return self.state

    async def run_loop(self) -> None:
        while True:
            try:
                self.update_system_state()
            except Exception:
                pass
            await asyncio.sleep(3)


system_state_engine = SystemStateEngine()
