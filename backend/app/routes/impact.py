from fastapi import APIRouter
from app.services.optimization_engine import OptimizationEngine
from app.schemas.ev import OptimizationImpact

router = APIRouter()
optimizer = OptimizationEngine()

@router.get("/{zone_id}", response_model=OptimizationImpact)
async def get_optimization_impact(zone_id: int):
    """Get before/after optimization impact for a zone"""
    result = optimizer.compare_optimization(zone_id)
    return OptimizationImpact(**result)