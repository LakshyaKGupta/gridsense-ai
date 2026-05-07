from fastapi import APIRouter
from typing import List
from app.services.ev_stations import get_real_stations
from app.services.location_recommender import LocationRecommender
from app.schemas.ev import LocationRecommendation

router = APIRouter()
recommender = LocationRecommender()

@router.get("/recommend", response_model=List[LocationRecommendation])
async def get_recommendations():
    """Get top expansion-priority OSM coordinates for the frontend planning map."""
    await get_real_stations()
    recommendations = recommender.recommend_new_stations()
    return [LocationRecommendation(**rec) for rec in recommendations]
