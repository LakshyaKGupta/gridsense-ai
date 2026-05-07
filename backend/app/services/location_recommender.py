from __future__ import annotations

from datetime import datetime
from typing import Dict, List

from app.services.demand_predictor import predict_demand
from app.services.simulation_engine import generate_current_state, get_registered_stations
from app.services.zone_catalog import nearest_zone


class LocationRecommender:
    def recommend_new_stations(self) -> List[Dict]:
        """
        Score real OSM station coordinates for expansion priority.

        The frontend currently expects the legacy recommendation fields, so the
        payload keeps those fields and adds the coordinate metadata needed by the map.
        """
        stations = get_registered_stations()
        if not stations:
            return []

        evening_peak = datetime.now().replace(hour=19, minute=0, second=0, microsecond=0)
        recommendations: List[Dict] = []

        for station in stations:
            state = generate_current_state(station, evening_peak)
            predicted_demand = predict_demand(int(station["id"]), evening_peak)
            capacity = float(state["capacity"])
            wait_time = float(state["wait_time"])
            utilization = predicted_demand / max(capacity, 1.0)
            zone_meta = nearest_zone(float(station["lat"]), float(station["lng"]))

            # Weighted score tuned for expansion planning:
            # demand pressure + queue pressure + utilization pressure
            grid_stress_score = round(
                (predicted_demand * 0.52)
                + (wait_time * 7.5)
                + (utilization * 120.0),
                2,
            )

            recommendations.append(
                {
                    "station_id": int(station["id"]),
                    "zone_id": int(zone_meta["id"]),
                    "zone_name": str(zone_meta["name"]),
                    "name": str(station["name"]),
                    "lat": float(station["lat"]),
                    "lng": float(station["lng"]),
                    "score": grid_stress_score,
                    "grid_stress_score": grid_stress_score,
                    "predicted_demand": round(predicted_demand, 2),
                    "wait_time": round(wait_time, 1),
                    "capacity": round(capacity, 1),
                    "status": state["status"],
                    "operator": station.get("operator", "Unknown"),
                    "justification": (
                        f"{station['name']} is projected at {predicted_demand:.0f} kW near 7 PM "
                        f"with ~{wait_time:.0f} min wait and {utilization * 100:.0f}% utilization."
                    ),
                }
            )

        recommendations.sort(key=lambda item: item["grid_stress_score"], reverse=True)
        return recommendations[:5]
