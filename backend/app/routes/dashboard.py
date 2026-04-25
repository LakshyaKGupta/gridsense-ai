from fastapi import APIRouter
from app.services.dashboard_service import DashboardService
from app.schemas.ev import DashboardSummary

router = APIRouter()
dashboard_service = DashboardService()

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary():
    """Get comprehensive dashboard summary"""
    result = await dashboard_service.get_dashboard_summary()
    return DashboardSummary(**result)