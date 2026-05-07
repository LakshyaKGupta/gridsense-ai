from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Dict, List, Optional


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class UserWorkspaceService:
    def __init__(self) -> None:
        self._store: Dict[str, Dict] = {}

    def _default_state(self) -> Dict:
        return {
            "history": [],
            "saved": {
                "stations": [],
                "routes": [],
                "windows": [],
            },
            "alerts": [
                {
                    "id": "pricing-window",
                    "title": "Off-peak window available",
                    "message": "Charging after 11 PM should reduce cost and queue pressure.",
                    "severity": "info",
                    "read": False,
                    "dismissed": False,
                    "created_at": _now_iso(),
                }
            ],
            "wallet": {
                "balance_inr": 1800.0,
                "monthly_savings_inr": 0.0,
                "transactions": [],
            },
            "settings": {
                "notification_enabled": True,
                "queue_alerts": True,
                "price_alerts": True,
                "preferred_speed": "fast",
                "privacy_mode": False,
            },
        }

    def get_state(self, user_key: str) -> Dict:
        if user_key not in self._store:
            self._store[user_key] = self._default_state()
        return self._store[user_key]

    def get_serializable_state(self, user_key: str) -> Dict:
        return deepcopy(self.get_state(user_key))

    def save_station(self, user_key: str, station: Dict) -> Dict:
        state = self.get_state(user_key)
        stations = [item for item in state["saved"]["stations"] if int(item["id"]) != int(station["id"])]
        stations.insert(
            0,
            {
                "id": int(station["id"]),
                "name": str(station["name"]),
                "operator": str(station.get("operator") or "EV Operator"),
                "lat": float(station["lat"]),
                "lng": float(station["lng"]),
                "saved_at": _now_iso(),
            },
        )
        state["saved"]["stations"] = stations[:12]
        return self.get_serializable_state(user_key)

    def unsave_station(self, user_key: str, station_id: int) -> Dict:
        state = self.get_state(user_key)
        state["saved"]["stations"] = [item for item in state["saved"]["stations"] if int(item["id"]) != int(station_id)]
        return self.get_serializable_state(user_key)

    def save_route(self, user_key: str, route_item: Dict) -> Dict:
        state = self.get_state(user_key)
        routes = [item for item in state["saved"]["routes"] if item["station_id"] != int(route_item["station_id"])]
        routes.insert(0, {**route_item, "saved_at": _now_iso()})
        state["saved"]["routes"] = routes[:12]
        return self.get_serializable_state(user_key)

    def save_window(self, user_key: str, window: Dict) -> Dict:
        state = self.get_state(user_key)
        windows = [item for item in state["saved"]["windows"] if item["time_label"] != window["time_label"]]
        windows.insert(0, {**window, "saved_at": _now_iso()})
        state["saved"]["windows"] = windows[:12]
        return self.get_serializable_state(user_key)

    def remove_saved_window(self, user_key: str, time_label: str) -> Dict:
        state = self.get_state(user_key)
        state["saved"]["windows"] = [item for item in state["saved"]["windows"] if item["time_label"] != time_label]
        return self.get_serializable_state(user_key)

    def schedule_charge(self, user_key: str, schedule: Dict) -> Dict:
        state = self.get_state(user_key)
        state["history"].insert(
            0,
            {
                "id": f"session-{len(state['history']) + 1}",
                "type": "scheduled_charge",
                "station_name": schedule["station_name"],
                "time_label": schedule["time_label"],
                "estimated_cost_inr": float(schedule["estimated_cost_inr"]),
                "energy_kwh": float(schedule["energy_kwh"]),
                "created_at": _now_iso(),
            },
        )
        state["alerts"].insert(
            0,
            {
                "id": f"scheduled-{len(state['alerts']) + 1}",
                "title": "Charging window scheduled",
                "message": f"{schedule['station_name']} at {schedule['time_label']} has been saved to your plan.",
                "severity": "info",
                "read": False,
                "dismissed": False,
                "created_at": _now_iso(),
            },
        )
        return self.get_serializable_state(user_key)

    def record_navigation(self, user_key: str, trip: Dict) -> Dict:
        state = self.get_state(user_key)
        state["history"].insert(
            0,
            {
                "id": f"nav-{len(state['history']) + 1}",
                "type": "navigation",
                "station_name": trip["station_name"],
                "distance_km": float(trip["distance_km"]),
                "eta_minutes": int(trip["eta_minutes"]),
                "created_at": _now_iso(),
            },
        )
        return self.get_serializable_state(user_key)

    def update_alert(self, user_key: str, alert_id: str, *, read: Optional[bool] = None, dismissed: Optional[bool] = None) -> Dict:
        state = self.get_state(user_key)
        for alert in state["alerts"]:
            if alert["id"] == alert_id:
                if read is not None:
                    alert["read"] = read
                if dismissed is not None:
                    alert["dismissed"] = dismissed
        return self.get_serializable_state(user_key)

    def recharge_wallet(self, user_key: str, amount_inr: float) -> Dict:
        state = self.get_state(user_key)
        wallet = state["wallet"]
        wallet["balance_inr"] = round(float(wallet["balance_inr"]) + float(amount_inr), 2)
        wallet["transactions"].insert(
            0,
            {
                "id": f"wallet-{len(wallet['transactions']) + 1}",
                "type": "recharge",
                "amount_inr": float(amount_inr),
                "created_at": _now_iso(),
            },
        )
        return self.get_serializable_state(user_key)

    def update_settings(self, user_key: str, patch: Dict) -> Dict:
        state = self.get_state(user_key)
        state["settings"] = {**state["settings"], **patch}
        return self.get_serializable_state(user_key)


user_workspace_service = UserWorkspaceService()
