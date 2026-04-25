from fastapi import APIRouter
from app.services.optimization_engine import OptimizationEngine
from app.schemas.ev import OptimizationResult

router = APIRouter()
engine = OptimizationEngine()

@router.get("/{zone_id}", response_model=OptimizationResult)
async def get_optimization(zone_id: int):
    """Get optimized charging schedule for a zone"""
    result = engine.optimize_charging_schedule(zone_id)
    return OptimizationResult(**result)