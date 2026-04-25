from fastapi import APIRouter
from app.services.demand_predictor import DemandPredictor
from app.schemas.ev import DemandForecast

router = APIRouter()
predictor = DemandPredictor()

@router.get("/{zone_id}", response_model=DemandForecast)
async def get_demand_forecast(zone_id: int, hours: int = 24):
    """Get demand forecast for a zone"""
    result = await predictor.forecast_demand(zone_id, hours)
    return DemandForecast(**result)