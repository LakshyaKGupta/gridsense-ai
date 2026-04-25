from fastapi import APIRouter, Depends
from datetime import datetime
from app.services.demand_predictor import DemandPredictor
from app.schemas.ev import DemandPrediction

router = APIRouter()
predictor = DemandPredictor()

@router.get("/{zone_id}", response_model=DemandPrediction)
async def get_demand_prediction(zone_id: int, hour: int = None):
    """Get demand prediction for a zone"""
    if hour is None:
        target_time = datetime.now()
    else:
        target_time = datetime.now().replace(hour=hour, minute=0, second=0, microsecond=0)

    demand, confidence, factors = predictor.predict_demand(zone_id, target_time)

    return DemandPrediction(
        demand=demand,
        confidence=confidence,
        factors=factors
    )