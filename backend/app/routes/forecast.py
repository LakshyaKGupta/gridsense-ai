from fastapi import APIRouter, Query, HTTPException
from app.services.demand_predictor import DemandPredictor, ZONE_TYPES
from datetime import datetime
from typing import Optional

router = APIRouter()
predictor = DemandPredictor()


@router.get("/zone/{zone_id}")
async def get_zone_forecast(
    zone_id: int,
    hours: int = Query(default=24, ge=1, le=72, description="Forecast horizon (1–72 hours)"),
):
    """
    XGBoost demand forecast for a specific zone.
    Returns hourly predictions with confidence intervals and model metadata.
    """
    try:
        result = await predictor.forecast_demand(zone_id, hours)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/zone/{zone_id}/now")
async def get_zone_current_demand(zone_id: int):
    """
    Single-point XGBoost prediction for the current hour.
    Useful for the Operator Cockpit KPI cards.
    """
    try:
        demand, confidence, factors = predictor.predict_demand(zone_id, datetime.now())
        return {
            "zone_id": zone_id,
            "zone_type": ZONE_TYPES.get(zone_id, "residential"),
            "predicted_demand": round(demand, 2),
            "confidence": confidence,
            "confidence_tier": "High" if confidence > 0.8 else "Medium" if confidence >= 0.6 else "Low",
            "factors": factors,
            "model": "XGBoost" if predictor.trained else "Heuristic",
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/zones/all")
async def get_all_zones_forecast(hours: int = Query(default=6, ge=1, le=24)):
    """
    Batch XGBoost forecast for all 12 Bengaluru zones.
    Used by the Operator Cockpit grid-wide view.
    """
    results = []
    for zone_id in range(1, 13):
        try:
            result = await predictor.forecast_demand(zone_id, hours)
            results.append(result)
        except Exception:
            continue
    return {
        "zones": results,
        "hours": hours,
        "model": "XGBoost" if predictor.trained else "Heuristic",
        "timestamp": datetime.now().isoformat(),
    }


# Legacy /{zone_id} route — preserved for backward compatibility
@router.get("/{zone_id}")
async def get_demand_forecast_legacy(zone_id: int, hours: int = 24):
    """Legacy route — prefer /zone/{zone_id} for XGBoost forecasts."""
    try:
        result = await predictor.forecast_demand(zone_id, hours)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))