from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from app.services.time_series_engine import (
    get_system_state,
    get_zone_predictions,
    get_multi_day_forecast,
    get_recommendations,
    set_demo_scenario,
    TimeSeriesEngine
)

router = APIRouter()
_engine = TimeSeriesEngine()


class ScenarioRequest(BaseModel):
    scenario: str


class ZoneRequest(BaseModel):
    zone_id: int


@router.get("/state")
async def get_state():
    """
    Get complete system state with time-series data.
    All components should read from this single source.
    """
    return get_system_state()


@router.get("/zones/{zone_id}/predictions")
async def get_zone_predictions_endpoint(zone_id: int, hours: int = 24):
    """Get predictions for a specific zone."""
    return get_zone_predictions(zone_id)


@router.get("/zones/{zone_id}/forecast")
async def get_multi_day_forecast_endpoint(zone_id: int):
    """Get multi-day forecast."""
    return get_multi_day_forecast(zone_id)


@router.get("/zones/{zone_id}/recommendations")
async def get_zone_recommendations_endpoint(zone_id: int):
    """Get recommendations for a zone."""
    return get_recommendations(zone_id)


@router.post("/scenario")
async def set_scenario_endpoint(request: ScenarioRequest):
    """Activate a demo scenario."""
    valid_scenarios = ['evening_peak', 'high_growth', 'station_outage', 'normal']
    if request.scenario not in valid_scenarios:
        return {"error": f"Invalid scenario. Choose from: {valid_scenarios}"}
    
    set_demo_scenario(request.scenario)
    return {"status": "success", "scenario": request.scenario}


@router.get("/validation/raw")
async def get_raw_data():
    """
    Debug endpoint to show raw time-series data.
    """
    state = get_system_state()
    return {
        "zones": [
            {
                "id": z["id"],
                "name": z["name"],
                "time_series": z.get("time_series", {}),
                "current_demand": z["current_demand"],
                "predictions": z["predictions"]["summary"] if z.get("predictions") else None
            }
            for z in state["zones"]
        ],
        "metadata": {
            "current_hour": state["current_hour"],
            "timestamp": state["timestamp"],
            "scenario": state.get("scenario", "normal")
        }
    }


@router.get("/validation/health")
async def health_check():
    """Check system health and consistency."""
    state = get_system_state()
    
    # Validate data consistency
    issues = []
    
    for zone in state["zones"]:
        # Check for sudden jumps
        if zone.get("predictions") and zone["predictions"].get("values"):
            values = zone["predictions"]["values"]
            for i in range(1, len(values)):
                diff = abs(values[i]["value"] - values[i-1]["value"])
                if diff > values[i-1]["value"] * 0.3:
                    issues.append(f"Zone {zone['id']}: Sudden jump detected ({diff:.1f} kW)")
        
        # Check for confidence decay
        if zone.get("predictions") and zone["predictions"].get("values"):
            conf_values = [v["confidence"] for v in zone["predictions"]["values"]]
            if conf_values[0] - conf_values[-1] > 0.3:
                issues.append(f"Zone {zone['id']}: Confidence decay too steep")
    
    return {
        "status": "healthy" if not issues else "warnings",
        "issues": issues if issues else "No issues detected",
        "timestamp": state["timestamp"]
    }


# Auto-update system state every 3 seconds in background
import threading
import time

def background_updater():
    """Update time pointer in background."""
    while True:
        time.sleep(3)
        # Time pointer updates naturally with datetime.now()

update_thread = threading.Thread(target=background_updater, daemon=True)
update_thread.start()