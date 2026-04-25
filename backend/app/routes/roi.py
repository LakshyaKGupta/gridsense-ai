from fastapi import APIRouter
from typing import List
from app.services.roi_engine import ROIEngine
from app.schemas.ev import ROIRecommendation

router = APIRouter()
roi_engine = ROIEngine()

@router.get("/", response_model=List[ROIRecommendation])
async def get_roi_recommendations():
    """Get ROI analysis for location recommendations"""
    recommendations = await roi_engine.calculate_roi_for_recommendations()
    return [ROIRecommendation(**rec) for rec in recommendations]