import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.services.demand_predictor import DemandPredictor, SCENARIO_MULTIPLIERS
from app.services.ev_stations import calculate_route, get_real_stations
from app.services.user_workspace_service import user_workspace_service
from app.services.location_recommender import LocationRecommender
from app.services.zone_catalog import ZONE_CATALOG, get_zone, get_zone_by_name, nearest_zone
from app.services.system_state import system_state_engine


SCENARIO_LABELS = {
    "normal": "Normal",
    "evening_peak": "Evening Peak",
    "high_growth": "High Growth",
    "outage": "Station Outage",
    "festival_surge": "Festival Surge",
}

SERVICE_AREA_CENTER = {"lat": 12.9716, "lng": 77.5946}
SERVICE_AREA_RADIUS_KM = 60.0


def _now_iso() -> str:
    return datetime.now().isoformat()


class PortalService:
    def __init__(self):
        self.predictor = DemandPredictor()
        self.recommender = LocationRecommender()
        self.active_scenario = "normal"

    def set_scenario(self, scenario: str) -> str:
        self.active_scenario = scenario if scenario in SCENARIO_MULTIPLIERS else "normal"
        return self.active_scenario

    async def get_station_by_id(self, station_id: int) -> Optional[Dict]:
        stations = await get_real_stations()
        return next((station for station in stations if int(station["id"]) == int(station_id)), None)

    async def get_operator_dashboard(self, zone_name: Optional[str], scenario: Optional[str]) -> Dict:
        scenario_key = self.set_scenario(scenario or self.active_scenario)
        selected_zone = get_zone_by_name(zone_name)
        zone_id = int(selected_zone["id"])
        now = datetime.now()
        await get_real_stations()

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
                "lat": float(zone["lat"]),
                "lng": float(zone["lng"]),
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
        overload_percent = round(max(0, ((current["prediction"] - current["capacity"]) / max(current["capacity"], 1)) * 100), 1)

        # Determine risk level based on overload percentage
        if overload_percent > 20:
            risk_level = "CRITICAL"
            risk_color = "red"
        elif overload_percent > 10:
            risk_level = "HIGH"
            risk_color = "orange"
        elif overload_percent > 0:
            risk_level = "MEDIUM"
            risk_color = "yellow"
        else:
            risk_level = "LOW"
            risk_color = "green"

        # Build actionable recommendations based on actual grid state
        action_queue = [
            {
                "priority": risk_level,
                "risk_color": risk_color,
                "title": f"{selected_zone['name']} projected to {'exceed' if overload_percent > 0 else 'remain within'} safe load by {overload_percent}% at {data_point_label(peak_point)}",
                "reason": current["explanation"]["reason"],
                "actions": [
                    f"Shift fleet charging to 11 PM window" if overload_percent > 10 else "Monitor load patterns",
                    f"Redirect users to {highest_headroom_zone['name'] if highest_headroom_zone else 'adjacent'} corridor" if overload_percent > 15 else "Maintain current routing",
                    f"Add 4 charging ports within 60 days" if overload_percent > 20 else "Review capacity planning" if overload_percent > 5 else "No immediate action required",
                ],
                "impact": f"Reduces the current scenario overrun by up to {max(8, abs(int(current['prediction'] - current['capacity'])))} kW.",
                "confidence": current["explanation"]["confidence"],
            },
            {
                "priority": "HIGH" if overload_percent > 10 else "MEDIUM",
                "risk_color": "orange" if overload_percent > 10 else "yellow",
                "title": f"Shift public charging demand away from {data_point_label(peak_point)}",
                "reason": f"Peak forecast remains at {peak_point['predicted_demand']:.0f} kW with upper bound {peak_point['confidence_upper']:.0f} kW.",
                "actions": [
                    "Enable dynamic pricing for 7-9 PM window",
                    "Send push notifications for off-peak incentives",
                    "Coordinate with fleet operators for schedule adjustment",
                ],
                "impact": "Targeted load shifting reduces feeder stress during the highest-confidence congestion window.",
                "confidence": peak_point["explanation"]["confidence"],
            },
            {
                "priority": "MEDIUM",
                "risk_color": "yellow",
                "title": planning_insights[0]["headline"] if planning_insights else "Review charger placement priorities",
                "reason": planning_insights[0]["reason"] if planning_insights else current["explanation"]["reason"],
                "actions": [
                    "Conduct site survey for recommended locations",
                    "Evaluate transformer capacity for new installations",
                    "Apply for grid connection permits",
                ],
                "impact": planning_insights[0]["impact"] if planning_insights else "Improves headroom in the most constrained growth corridor.",
                "confidence": planning_insights[0]["confidence"] if planning_insights else current["explanation"]["confidence"],
            },
        ]

        spatial_data = self._build_spatial_data(zone_rankings, scenario_key)

        risk_engine = self._build_live_risk_engine(
            zone_meta=selected_zone,
            grid_stress={"predicted_load": current["prediction"], "capacity": current["capacity"], "overload_percent": overload_percent},
            forecast_points=forecast_points,
            peak_point=peak_point,
        )

        ops_summary = self._build_ai_ops_summary(
            zone_meta=selected_zone,
            scenario_key=scenario_key,
            grid_stress={"predicted_load": current["prediction"], "capacity": current["capacity"], "overload_percent": overload_percent},
            peak_point=peak_point,
            scenario_delta_kw=scenario_delta,
            highest_headroom_zone=highest_headroom_zone["name"] if highest_headroom_zone else str(selected_zone["name"]),
        )

        top_risk_zones = self._build_top_risk_zones(zone_rankings, scenario_key=scenario_key)
        event_ticker = self._build_event_ticker(
            scenario_key=scenario_key,
            selected_zone=str(selected_zone["name"]),
            risk_level=risk_level,
            overload_percent=overload_percent,
            peak_label=data_point_label(peak_point),
            top_risk_zones=top_risk_zones,
        )

        forecast_center = self._build_forecast_center(
            zone_id=zone_id,
            zone_name=str(selected_zone["name"]),
            scenario_key=scenario_key,
        )

        stations_workspace = await self._build_operator_station_workspace(selected_zone["name"])
        incidents = self._build_incidents(action_queue, selected_zone["name"], peak_point)
        system_health = self._build_system_health(
            selected_zone_name=str(selected_zone["name"]),
            scenario_key=scenario_key,
            forecast_center=forecast_center,
        )

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
                "overload_percent": overload_percent,
                "explanation": current["explanation"],
            },
            "risk_engine": risk_engine,
            "ops_summary": ops_summary,
            "event_ticker": event_ticker,
            "top_risk_zones": top_risk_zones,
            "forecast_center": forecast_center,
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
                "total_zones": len(ZONE_CATALOG),
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
            "spatial": spatial_data,
            "incidents": incidents,
            "stations": stations_workspace,
            "system_health": system_health,
        }

    def _build_forecast_center(self, zone_id: int, zone_name: str, scenario_key: str) -> Dict:
        """
        Multi-horizon forecast center payload:
        - 6h / 24h / 72h curves
        - confidence visualization inputs
        - baseline comparison (unmanaged vs optimized vs current strategy)
        - explainability for horizon peaks
        - drift detection (predicted vs live observed demand)
        """
        now = datetime.now()

        def build_curve(hours: int, scenario: str) -> List[Dict]:
            points: List[Dict] = []
            for offset in range(hours):
                target_time = now + timedelta(hours=offset)
                point = self.predictor.predict_demand_details(zone_id, target_time, scenario)
                points.append({
                    "hour": offset,
                    "label": target_time.strftime("%H:%M") if hours <= 24 else target_time.strftime("%a %H:%M"),
                    "timestamp": point["timestamp"],
                    "predicted_demand": point["prediction"],
                    "confidence_lower": point["confidence_lower"],
                    "confidence_upper": point["confidence_upper"],
                    "status": point["status"],
                    "explanation": point["explanation"],
                })
            return points

        horizon_6 = build_curve(6, scenario_key)
        horizon_24 = build_curve(24, scenario_key)
        horizon_72 = build_curve(72, scenario_key)

        def peak_summary(curve: List[Dict]) -> Dict:
            peak = max(curve, key=lambda p: p["predicted_demand"]) if curve else None
            if not peak:
                return {"label": "--:--", "predicted_demand": 0, "confidence_upper": 0, "confidence_lower": 0, "explanation": {}}
            return {
                "label": data_point_label(peak),
                "predicted_demand": float(peak["predicted_demand"]),
                "confidence_upper": float(peak["confidence_upper"]),
                "confidence_lower": float(peak["confidence_lower"]),
                "explanation": peak.get("explanation") or {},
            }

        peak_6 = peak_summary(horizon_6)
        peak_24 = peak_summary(horizon_24)
        peak_72 = peak_summary(horizon_72)

        # Baseline comparison curves (deterministic)
        unmanaged_24 = build_curve(24, "normal")
        current_24 = horizon_24
        optimized_24 = []
        for p in current_24:
            optimized_24.append({
                **p,
                "predicted_demand": round(float(p["predicted_demand"]) * 0.82, 3),
                "confidence_lower": round(float(p["confidence_lower"]) * 0.82, 3),
                "confidence_upper": round(float(p["confidence_upper"]) * 0.82, 3),
            })

        unmanaged_peak = max((p["predicted_demand"] for p in unmanaged_24), default=0.0)
        current_peak = max((p["predicted_demand"] for p in current_24), default=0.0)
        optimized_peak = max((p["predicted_demand"] for p in optimized_24), default=0.0)

        # Drift detection based on live observed demand (system_state_engine)
        drift_percent = 0.0
        anomaly = False
        observed_kw = None
        try:
            state = system_state_engine.get_state()
            demand_rows = state.get("demand") or []
            match = next((row for row in demand_rows if int(row.get("zone_id", -1)) == int(zone_id)), None)
            if match:
                observed_kw = float(match.get("current_demand", 0.0))
                predicted_now = float(current_24[0]["predicted_demand"]) if current_24 else float(current_peak)
                drift_percent = round(abs(observed_kw - predicted_now) / max(predicted_now, 1.0) * 100.0, 1)
                anomaly = drift_percent >= 15.0
        except Exception:
            observed_kw = None
            drift_percent = 0.0
            anomaly = False

        # Reliability score: penalize drift + uncertainty width at peak.
        peak_width = max(1.0, float(peak_24["confidence_upper"]) - float(peak_24["confidence_lower"]))
        peak_value = max(1.0, float(peak_24["predicted_demand"]))
        uncertainty_ratio = peak_width / peak_value
        reliability = int(round(max(35.0, min(98.0, 92.0 - (drift_percent * 1.2) - (uncertainty_ratio * 100.0 * 0.45)))))

        return {
            "zone_id": zone_id,
            "zone_name": zone_name,
            "scenario": scenario_key,
            "horizons": {
                "h6": {"hours": 6, "curve": horizon_6, "peak": peak_6},
                "h24": {"hours": 24, "curve": horizon_24, "peak": peak_24},
                "h72": {"hours": 72, "curve": horizon_72, "peak": peak_72},
            },
            "baseline_comparison": {
                "unmanaged": {"label": "Unmanaged charging", "peak_kw": round(float(unmanaged_peak), 1)},
                "optimized": {"label": "Optimized charging", "peak_kw": round(float(optimized_peak), 1)},
                "current": {"label": "Current AI strategy", "peak_kw": round(float(current_peak), 1)},
                "delta_vs_unmanaged_kw": round(float(current_peak - unmanaged_peak), 1),
                "reduction_vs_unmanaged_percent": round(max(0.0, (unmanaged_peak - optimized_peak) / max(unmanaged_peak, 1.0) * 100.0), 1),
                "curves": {
                    "unmanaged_24h": unmanaged_24,
                    "optimized_24h": optimized_24,
                    "current_24h": current_24,
                },
            },
            "drift": {
                "observed_kw": observed_kw,
                "drift_percent": drift_percent,
                "anomaly": anomaly,
                "reliability_score": reliability,
            },
            "generated_at": now.isoformat(),
        }

    def _build_live_risk_engine(self, zone_meta: Dict, grid_stress: Dict, forecast_points: List[Dict], peak_point: Dict) -> Dict:
        capacity = float(grid_stress["capacity"])
        peak_upper = float(peak_point.get("confidence_upper", peak_point.get("predicted_demand", 0)))
        peak_lower = float(peak_point.get("confidence_lower", peak_point.get("predicted_demand", 0)))
        peak_pred = float(peak_point.get("predicted_demand", 0))

        # Overload probability: deterministic estimate derived from peak confidence interval vs capacity.
        if peak_lower >= capacity:
            overload_prob = 0.92
        elif peak_upper <= capacity:
            overload_prob = 0.08
        else:
            band = max(peak_upper - peak_lower, 1.0)
            overload_prob = float(min(0.92, max(0.08, (peak_pred - capacity) / band + 0.5)))

        overload_percent = float(grid_stress["overload_percent"])
        peak_pressure = min(1.0, max(0.0, overload_percent / 25.0))
        risk_score = int(round(min(100.0, max(0.0, (overload_prob * 70.0) + (peak_pressure * 30.0)))))

        # Confidence level: combine model explanation + interval width.
        interval_width = max(1.0, peak_upper - peak_lower)
        width_ratio = interval_width / max(capacity, 1.0)
        if width_ratio < 0.08:
            confidence_level = "HIGH"
        elif width_ratio < 0.16:
            confidence_level = "MEDIUM"
        else:
            confidence_level = "LOW"

        projected_peak_timing = data_point_label(peak_point)

        # Risk band
        if risk_score >= 80:
            band = "CRITICAL"
        elif risk_score >= 60:
            band = "HIGH"
        elif risk_score >= 35:
            band = "MEDIUM"
        else:
            band = "LOW"

        return {
            "zone": str(zone_meta.get("name", "")),
            "overload_probability": round(overload_prob, 3),
            "risk_score": risk_score,
            "risk_band": band,
            "projected_peak_timing": projected_peak_timing,
            "confidence_level": confidence_level,
        }

    def _build_ai_ops_summary(
        self,
        zone_meta: Dict,
        scenario_key: str,
        grid_stress: Dict,
        peak_point: Dict,
        scenario_delta_kw: float,
        highest_headroom_zone: str,
    ) -> Dict:
        zone_name = str(zone_meta.get("name", "Selected zone"))
        zone_type = str(zone_meta.get("zone_type", "mixed")).replace("_", " ")
        peak_label = data_point_label(peak_point)
        capacity = float(grid_stress["capacity"])
        predicted_peak = float(peak_point.get("predicted_demand", grid_stress["predicted_load"]))
        overload_kw = max(0.0, predicted_peak - capacity)
        overload_percent = float(grid_stress["overload_percent"])

        if overload_percent > 20:
            urgency = "CRITICAL"
        elif overload_percent > 10:
            urgency = "HIGH"
        elif overload_percent > 0:
            urgency = "MEDIUM"
        else:
            urgency = "LOW"

        demand_driver = "weekday office return traffic + commercial spillover" if zone_type in ("commercial", "industrial") else "residential return traffic + local fast-charging demand"
        scenario_phrase = SCENARIO_LABELS.get(scenario_key, scenario_key)

        if urgency in ("CRITICAL", "HIGH"):
            primary_reco = "activate off-peak pricing incentives and push reroutes to high-headroom corridors"
        elif urgency == "MEDIUM":
            primary_reco = "pre-stage incentives for the 7–9 PM window and monitor queue growth"
        else:
            primary_reco = "maintain current routing and keep incentives on standby"

        briefing = (
            f"{zone_name} is projected to exceed safe transformer load by {overload_percent:.0f}% "
            f"(~{overload_kw:.0f} kW) around {peak_label} under the {scenario_phrase} scenario. "
            f"Primary drivers: {demand_driver}. Recommend {primary_reco}."
        )

        return {
            "urgency": urgency,
            "briefing": briefing,
            "signals": {
                "scenario": scenario_key,
                "scenario_delta_kw": round(float(scenario_delta_kw), 2),
                "peak_time": peak_label,
                "predicted_peak_kw": round(predicted_peak, 1),
                "capacity_kw": round(capacity, 1),
                "suggested_relief_zone": highest_headroom_zone,
            },
        }

    def _build_top_risk_zones(self, zone_rankings: List[Dict], scenario_key: str) -> List[Dict]:
        now = datetime.now()
        scored = []
        for zone in zone_rankings:
            zone_id = int(zone["id"])
            point = self.predictor.predict_demand_details(zone_id, now, scenario_key)
            overload_percent = round(max(0.0, ((point["prediction"] - point["capacity"]) / max(point["capacity"], 1)) * 100), 1)
            risk_score = int(round(min(100.0, max(0.0, overload_percent * 3.4 + zone["utilization_percent"] * 0.25))))
            confidence = point.get("explanation", {}).get("confidence", "MEDIUM")

            if overload_percent > 15:
                action = "Trigger off-peak incentives + reroute demand"
            elif overload_percent > 5:
                action = "Prepare targeted incentives for peak window"
            elif zone["utilization_percent"] > 85:
                action = "Watch queue growth; pre-stage notifications"
            else:
                action = "Monitor"

            scored.append({
                "zone": zone["name"],
                "current_load": round(float(point["prediction"]), 1),
                "predicted_peak": round(float(point["prediction"]), 1),
                "overload_risk": round(float(overload_percent), 1),
                "confidence": confidence,
                "recommended_action": action,
                "_score": risk_score,
            })

        scored.sort(key=lambda item: item["_score"], reverse=True)
        return [{k: v for k, v in item.items() if not k.startswith("_")} for item in scored[:6]]

    def _build_event_ticker(
        self,
        scenario_key: str,
        selected_zone: str,
        risk_level: str,
        overload_percent: float,
        peak_label: str,
        top_risk_zones: List[Dict],
    ) -> List[Dict]:
        now = datetime.now().isoformat()
        events: List[Dict] = []

        # Scenario state
        events.append({
            "timestamp": now,
            "type": "scenario",
            "severity": "INFO",
            "message": f"Scenario set to {SCENARIO_LABELS.get(scenario_key, scenario_key)} (focus: {selected_zone}).",
        })

        # Selected zone risk
        if overload_percent > 0:
            events.append({
                "timestamp": now,
                "type": "zone_overload_risk",
                "severity": risk_level,
                "message": f"{selected_zone} overload risk {overload_percent:.0f}% near {peak_label}.",
            })
        else:
            events.append({
                "timestamp": now,
                "type": "zone_status",
                "severity": "LOW",
                "message": f"{selected_zone} remains within capacity; peak projected near {peak_label}.",
            })

        # Network highlight
        if top_risk_zones:
            leader = top_risk_zones[0]
            events.append({
                "timestamp": now,
                "type": "network",
                "severity": "HIGH" if float(leader.get("overload_risk", 0)) > 10 else "MEDIUM",
                "message": f"Top risk zone now: {leader.get('zone')} ({leader.get('overload_risk')}% overload risk).",
            })

        return events[:12]

    async def get_user_dashboard(
        self,
        lat: float,
        lng: float,
        selected_station_id: Optional[int],
        vehicle_model: Optional[str],
        battery_capacity_kwh: Optional[float],
        battery_percent: Optional[float],
        home_charging_access: Optional[bool],
        typical_charging_time: Optional[str],
        destination: Optional[str],
        user_key: str,
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
            battery_percent=battery_percent,
            home_charging_access=home_charging_access,
        )
        alternatives = self._build_station_alternatives(stations, battery_capacity_kwh)
        route_planner = self._build_user_route_planner(
            route=route,
            route_station=route_station,
            alternatives=alternatives,
            destination=destination,
            battery_percent=battery_percent,
        )
        workspace_state = user_workspace_service.get_serializable_state(user_key)
        workspace_state["alerts"] = self._merge_user_alerts(
            existing_alerts=workspace_state["alerts"],
            recommendation=best_window,
            route_station=route_station,
            queue_minutes=int(round(route_station.get("wait_time", 0))) if route_station else 0,
        )

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
            "station_options": stations[:24],
            "alternatives": alternatives,
            "decision_support": decision_support,
            "charging_recommendation": best_window,
            "load_context": current,
            "route_planner": route_planner,
            "workspace_state": workspace_state,
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
        for station in stations[:8]:
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
        battery_percent: Optional[float],
        home_charging_access: Optional[bool],
    ) -> Dict:
        remaining_percent = max(5.0, min(95.0, float(battery_percent if battery_percent is not None else 38.0)))
        target_energy = round(max(10.0, min((battery_capacity_kwh or 45) * (0.78 - (remaining_percent / 100.0)), 34.0)), 1)
        public_tariff_base = 19.5
        home_tariff = 8.2
        public_cost = round(target_energy * public_tariff_base, 0)
        home_cost = round(target_energy * home_tariff, 0) if home_charging_access else None
        route_minutes = route["duration_minutes"] if route else max(5, int(round((selected_station or nearest_station or {}).get("distance", 0) * 4)))
        queue_minutes = round((selected_station or nearest_station or {}).get("wait_time", 0))
        charge_minutes = max(18, int(round(target_energy / 1.1)))
        total_session_minutes = route_minutes + queue_minutes + charge_minutes
        best_alternative = min(stations[:8], key=lambda station: station["wait_time"] + (station["distance"] * 3.8)) if stations else None
        best_alternative_minutes = 0
        if best_alternative:
            best_alternative_minutes = max(4, int(round(best_alternative["distance"] * 3.8))) + int(round(best_alternative["wait_time"])) + charge_minutes

        # Calculate congestion risk comparison
        nearest_congestion = nearest_station.get("load", 0) / max(nearest_station.get("capacity", 1), 1) if nearest_station else 0
        best_congestion = best_alternative.get("load", 0) / max(best_alternative.get("capacity", 1), 1) if best_alternative else 0
        congestion_reduction = round(max(0, (nearest_congestion - best_congestion) * 100), 0) if best_alternative else 0

        # Determine best time window recommendation
        best_time_benefit = ""
        if queue_minutes > 15:
            best_time_benefit = f"save {max(5, int(queue_minutes * 0.6))} mins waiting by choosing lower-congestion station"
        elif home_charging_access:
            best_time_benefit = "home charging available — consider overnight for lowest cost"
        else:
            best_time_benefit = "current window is reasonable for your location"

        return {
            "target_energy_kwh": target_energy,
            "estimated_session_minutes": total_session_minutes,
            "public_cost_inr": public_cost,
            "home_cost_inr": home_cost,
            "savings_vs_home_inr": round(public_cost - home_cost, 0) if home_cost is not None else None,
            "queue_time_savings_minutes": max(0, total_session_minutes - best_alternative_minutes),
            "route_provider": route["provider"] if route else "haversine",
            "home_charge_recommended": bool(home_charging_access and home_cost is not None and public_cost - home_cost >= 120),
            "congestion_reduction_percent": int(congestion_reduction),
            "best_time_benefit": best_time_benefit,
            "recommended_action": self._get_recommended_action(
                stations=stations,
                nearest_station=nearest_station,
                best_alternative=best_alternative,
                home_charging_access=home_charging_access,
                home_cost=home_cost,
                public_cost=public_cost,
            ),
            "charge_now": self._build_charge_now_engine(
                stations=stations,
                route_minutes_default=route_minutes,
                target_energy_kwh=target_energy,
                home_charging_access=bool(home_charging_access),
                home_cost_inr=home_cost,
                public_tariff_base=public_tariff_base,
            ),
        }

    def _build_user_route_planner(
        self,
        route: Optional[Dict],
        route_station: Optional[Dict],
        alternatives: List[Dict],
        destination: Optional[str],
        battery_percent: Optional[float],
    ) -> Dict:
        route_options = []
        for option in alternatives[:3]:
            arrival_queue = int(round(option["wait_time_minutes"] + max(0, option["distance_km"] - 2)))
            route_options.append(
                {
                    "station_id": option["id"],
                    "station_name": option["name"],
                    "eta_minutes": option["estimated_total_minutes"] - 22,
                    "queue_at_arrival_minutes": arrival_queue,
                    "total_stop_minutes": option["estimated_total_minutes"],
                    "headline": option["reason"],
                    "why": f"{option['distance_km']:.1f} km detour with {arrival_queue} min expected queue at arrival.",
                }
            )

        return {
            "destination": destination or "Flexible charging stop",
            "battery_percent": battery_percent if battery_percent is not None else 38,
            "current_route": route,
            "selected_station_name": route_station["name"] if route_station else None,
            "route_options": route_options,
        }

    def _merge_user_alerts(self, existing_alerts: List[Dict], recommendation: Optional[Dict], route_station: Optional[Dict], queue_minutes: int) -> List[Dict]:
        alerts = [alert for alert in existing_alerts if not alert.get("dismissed")]
        dynamic_alerts: List[Dict] = []
        if recommendation:
            dynamic_alerts.append(
                {
                    "id": f"window-{recommendation['time_label']}",
                    "title": "Recommended charging window",
                    "message": recommendation["headline"],
                    "severity": "info",
                    "read": False,
                    "dismissed": False,
                    "created_at": _now_iso(),
                }
            )
        if route_station and queue_minutes >= 15:
            dynamic_alerts.append(
                {
                    "id": f"queue-{route_station['id']}",
                    "title": "Queue pressure rising",
                    "message": f"{route_station['name']} is showing ~{queue_minutes} min queue pressure.",
                    "severity": "high",
                    "read": False,
                    "dismissed": False,
                    "created_at": _now_iso(),
                }
            )

        alert_ids = {alert["id"] for alert in alerts}
        for alert in dynamic_alerts:
            if alert["id"] not in alert_ids:
                alerts.insert(0, alert)
        return alerts[:12]

    async def _build_operator_station_workspace(self, selected_zone_name: str) -> List[Dict]:
        stations = await get_real_stations()
        workspace = []
        prioritized = sorted(
            stations,
            key=lambda station: (0 if station["zone_name"] == selected_zone_name else 1, -station["load"], station["distance"]),
        )
        for station in prioritized[:24]:
            utilization = round((station["load"] / max(station["capacity"], 1)) * 100, 1)
            workspace.append(
                {
                    **station,
                    "utilization_percent": utilization,
                    "queue_trend": "rising" if station["wait_time"] >= 10 else "stable" if station["wait_time"] >= 4 else "clearing",
                    "predicted_wait_growth": max(0, round(station["wait_time"] * 0.35, 1)),
                    "health_score": max(45, int(round(100 - utilization * 0.55))),
                    "connector_availability": max(1, int(round((station["capacity"] - station["load"]) / 35))),
                    "active_sessions": max(1, int(round(station["load"] / 28))),
                    "load_capacity_ratio": round(station["load"] / max(station["capacity"], 1), 3),
                    "downtime_probability": round(min(0.42, max(0.04, utilization / 180)), 3),
                }
            )
        return workspace

    def _build_incidents(self, action_queue: List[Dict], selected_zone_name: str, peak_point: Dict) -> List[Dict]:
        incidents = []
        for index, action in enumerate(action_queue):
            incidents.append(
                {
                    "id": f"incident-{index + 1}",
                    "title": action["title"],
                    "zone": selected_zone_name,
                    "severity": action["priority"],
                    "status": "pending",
                    "timeline_headline": f"Peak handling window around {data_point_label(peak_point)}",
                    "reason": action["reason"],
                    "impact": action["impact"],
                }
            )
        return incidents

    def _build_system_health(self, selected_zone_name: str, scenario_key: str, forecast_center: Dict) -> Dict:
        state = system_state_engine.get_state()
        demand_rows = state.get("demand") or []
        current_zone = next((row for row in demand_rows if row.get("zone_name") == selected_zone_name), None)
        latency_ms = 110 if forecast_center["drift"]["reliability_score"] >= 80 else 190
        return {
            "backend_latency_ms": latency_ms,
            "api_health": "healthy",
            "polling_health": "healthy",
            "forecast_engine_status": "active",
            "db_connectivity": "connected",
            "model_drift_percent": forecast_center["drift"]["drift_percent"],
            "memory_usage_mb": 186,
            "uptime_hours": 24,
            "cache_health": "warm",
            "transport_status": "polling",
            "heartbeat_at": _now_iso(),
            "selected_zone_observed_kw": current_zone.get("current_demand") if current_zone else None,
            "scenario": scenario_key,
        }

    def _build_charge_now_engine(
        self,
        stations: List[Dict],
        route_minutes_default: int,
        target_energy_kwh: float,
        home_charging_access: bool,
        home_cost_inr: Optional[float],
        public_tariff_base: float,
    ) -> Dict:
        """
        Deterministic "Charge Now" decision engine.
        Produces the 5 user-facing answers (best / wait saved / cheapest / fastest / lowest congestion)
        based strictly on backend station state + route + queue + a simple congestion-aware tariff model.
        """
        if not stations:
            return {
                "best_station_right_now": None,
                "wait_time_saved": {"minutes": 0, "why": "No stations available to compare."},
                "cheapest_option": None,
                "fastest_option": None,
                "lowest_congestion_option": None,
            }

        def drive_minutes(station: Dict) -> int:
            return max(4, int(round(float(station.get("distance", 0.0)) * 3.8)))

        def utilization(station: Dict) -> float:
            return float(station.get("load", 0.0)) / max(float(station.get("capacity", 1.0)), 1.0)

        def dynamic_price_per_kwh(station: Dict) -> float:
            util = utilization(station)
            surge = min(0.25, max(0.0, (util - 0.55) * 0.6))  # up to +25% in heavy congestion
            return round(public_tariff_base * (1.0 + surge), 2)

        def total_minutes(station: Dict) -> int:
            queue = int(round(float(station.get("wait_time", 0.0))))
            charge = max(18, int(round(float(target_energy_kwh) / 1.1)))
            return drive_minutes(station) + queue + charge

        # Candidate set: nearby stations list already sorted by proximity in get_real_stations()
        candidates = stations[:10]

        # Best station right now: minimize (drive + wait), but avoid RED if possible.
        non_red = [s for s in candidates if s.get("status") != "RED"]
        best_pool = non_red if non_red else candidates
        best_now = min(best_pool, key=lambda s: drive_minutes(s) + float(s.get("wait_time", 0.0)))

        # Fastest option: minimize full session time.
        fastest = min(best_pool, key=lambda s: total_minutes(s))

        # Lowest congestion: minimize utilization.
        lowest_cong = min(candidates, key=lambda s: utilization(s))

        # Cheapest option:
        # - prefer home if available (explicitly cheapest in this model)
        # - else choose station with lowest congestion-adjusted price, tie-break by drive+wait
        cheapest_station = min(candidates, key=lambda s: (dynamic_price_per_kwh(s), drive_minutes(s) + float(s.get("wait_time", 0.0))))
        if home_charging_access and home_cost_inr is not None:
            cheapest = {
                "type": "home",
                "headline": "Cheapest: Charge at home",
                "estimated_cost_inr": float(home_cost_inr),
                "why": f"Home tariff ₹8.2/kWh is lower than public tariff (₹{public_tariff_base}/kWh baseline).",
                "confidence": "High",
            }
        else:
            cheapest_price = dynamic_price_per_kwh(cheapest_station)
            cheapest_cost = round(float(target_energy_kwh) * cheapest_price, 0)
            cheapest = {
                "type": "station",
                "station_id": int(cheapest_station["id"]),
                "station_name": str(cheapest_station["name"]),
                "station_lat": float(cheapest_station["lat"]),
                "station_lng": float(cheapest_station["lng"]),
                "estimated_cost_inr": float(cheapest_cost),
                "why": f"Lowest congestion-adjusted tariff now (~₹{cheapest_price}/kWh) driven by {int(round(utilization(cheapest_station)*100))}% utilization.",
                "confidence": "Medium",
            }

        # Wait time saved vs nearest (first station in list is closest / "nearest")
        nearest = candidates[0]
        nearest_wait = int(round(float(nearest.get("wait_time", 0.0))))
        best_wait = int(round(float(best_now.get("wait_time", 0.0))))
        wait_saved = max(0, nearest_wait - best_wait)

        def station_card(station: Dict, headline: str, why: str, confidence: str) -> Dict:
            return {
                "station_id": int(station["id"]),
                "station_name": str(station["name"]),
                "station_lat": float(station["lat"]),
                "station_lng": float(station["lng"]),
                "distance_km": round(float(station.get("distance", 0.0)), 2),
                "wait_time_minutes": int(round(float(station.get("wait_time", 0.0)))),
                "utilization_percent": int(round(utilization(station) * 100.0)),
                "estimated_total_minutes": total_minutes(station),
                "headline": headline,
                "why": why,
                "confidence": confidence,
            }

        return {
            "best_station_right_now": station_card(
                best_now,
                headline="Best station right now",
                why=f"Lowest combined travel + queue time among nearby options ({drive_minutes(best_now)} min drive, {int(round(float(best_now.get('wait_time', 0.0))))} min queue).",
                confidence="High" if best_now.get("status") == "GREEN" else "Medium",
            ),
            "wait_time_saved": {
                "minutes": int(wait_saved),
                "why": f"Saves {int(wait_saved)} mins queue vs nearest station ({nearest_wait} → {best_wait} mins).",
            },
            "cheapest_option": cheapest,
            "fastest_option": station_card(
                fastest,
                headline="Fastest overall",
                why=f"Lowest end-to-end session time (~{total_minutes(fastest)} mins) including drive + queue + charge estimate.",
                confidence="Medium",
            ),
            "lowest_congestion_option": station_card(
                lowest_cong,
                headline="Lowest congestion",
                why=f"Lowest utilization now ({int(round(utilization(lowest_cong) * 100))}% of capacity) → lower queue growth risk.",
                confidence="Medium",
            ),
        }

    def _get_recommended_action(
        self,
        stations: List[Dict],
        nearest_station: Optional[Dict],
        best_alternative: Optional[Dict],
        home_charging_access: Optional[bool],
        home_cost: Optional[float],
        public_cost: float,
    ) -> Dict:
        """Generate a clear, actionable recommendation for the user."""
        if home_charging_access and home_cost is not None and public_cost - home_cost >= 200:
            return {
                "type": "home_charge",
                "headline": "Charge at home tonight",
                "why": f"Save ₹{int(public_cost - home_cost)} vs public charging. Home rate is ₹8.2/kWh vs ₹19.5/kWh.",
                "benefits": [
                    f"Save ₹{int(public_cost - home_cost)} on charging cost",
                    "No travel time or queue wait",
                    "Charge during off-peak hours (11 PM – 6 AM)",
                ],
                "confidence": "High",
            }

        if best_alternative and nearest_station and best_alternative["id"] != nearest_station.get("id"):
            wait_savings = max(0, int(nearest_station.get("wait_time", 0) - best_alternative.get("wait_time", 0)))
            congestion_diff = int(max(0, (nearest_station.get("load", 0) / max(nearest_station.get("capacity", 1), 1) - best_alternative.get("load", 0) / max(best_alternative.get("capacity", 1), 1)) * 100))
            return {
                "type": "alternate_station",
                "headline": f"Go to {best_alternative['name']}",
                "why": f"{congestion_diff}% lower congestion than nearest station with {wait_savings} min shorter wait.",
                "benefits": [
                    f"Save {wait_savings} mins waiting" if wait_savings > 0 else "Shorter queue expected",
                    f"{congestion_diff}% lower congestion than nearby alternatives",
                    "Predicted low demand for next 2 hours",
                ],
                "confidence": "84%",
            }

        if nearest_station:
            return {
                "type": "nearest_station",
                "headline": f"Charge at {nearest_station['name']}",
                "why": f"Nearest option at {nearest_station['distance']:.1f} km with acceptable queue time.",
                "benefits": [
                    f"Only {nearest_station['distance']:.1f} km away",
                    f"Estimated {int(nearest_station.get('wait_time', 0))} min wait",
                    "Good availability right now",
                ],
                "confidence": "High",
            }

        return {
            "type": "unknown",
            "headline": "No stations nearby",
            "why": "No charging stations found in your area.",
            "benefits": [],
            "confidence": "N/A",
        }

    def _station_reason(self, station: Dict) -> str:
        if station["status"] == "GREEN":
            return "Low queue pressure and strong capacity headroom."
        if station["status"] == "YELLOW":
            return "Moderate queue pressure but still serviceable for a planned stop."
        return "High congestion risk. Use only if route convenience outweighs queue delay."

    def _build_spatial_data(self, zone_rankings: List[Dict], scenario_key: str) -> Dict:
        heatmap_points = []
        overload_zones = []
        congestion_corridors = []

        for zone in zone_rankings:
            utilization = zone["utilization_percent"]
            intensity = min(1.0, utilization / 100)

            heatmap_points.append({
                "id": zone["id"],
                "name": zone["name"],
                "lat": float(zone["lat"]),
                "lng": float(zone["lng"]),
                "intensity": round(intensity, 3),
                "predicted_load": zone["predicted_load"],
                "capacity": zone["capacity"],
                "utilization_percent": zone["utilization_percent"],
                "status": zone["status"],
            })

            if zone["status"] in ("OVERLOAD RISK", "CONSTRAINED"):
                radius_km = 2.5 if zone["status"] == "OVERLOAD RISK" else 1.8
                overload_zones.append({
                    "id": zone["id"],
                    "name": zone["name"],
                    "lat": float(zone["lat"]),
                    "lng": float(zone["lng"]),
                    "radius_km": radius_km,
                    "status": zone["status"],
                    "overload_percent": round(max(0, ((zone["predicted_load"] - zone["capacity"]) / max(zone["capacity"], 1)) * 100), 1),
                })

        high_stress_zones = [z for z in zone_rankings if z["status"] in ("OVERLOAD RISK", "CONSTRAINED")]
        for i, zone_a in enumerate(high_stress_zones):
            for zone_b in high_stress_zones[i + 1:]:
                dist = self._distance_km(zone_a["lat"], zone_a["lng"], zone_b["lat"], zone_b["lng"])
                if dist < 15:
                    congestion_corridors.append({
                        "from_zone_id": zone_a["id"],
                        "from_zone_name": zone_a["name"],
                        "to_zone_id": zone_b["id"],
                        "to_zone_name": zone_b["name"],
                        "distance_km": round(dist, 1),
                        "combined_load": round(zone_a["predicted_load"] + zone_b["predicted_load"], 1),
                        "severity": "CRITICAL" if zone_a["status"] == "OVERLOAD RISK" and zone_b["status"] == "OVERLOAD RISK" else "HIGH",
                    })

        return {
            "heatmap_points": heatmap_points,
            "overload_zones": overload_zones,
            "congestion_corridors": congestion_corridors,
        }

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
