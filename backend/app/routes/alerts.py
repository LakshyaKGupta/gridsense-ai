from fastapi import APIRouter
from typing import List
from app.services.alert_system import AlertSystem
from app.schemas.ev import Alert

router = APIRouter()
alert_system = AlertSystem()

@router.get("/", response_model=List[Alert])
async def get_alerts():
    """Get current system alerts"""
    alerts = await alert_system.check_alerts()
    return [Alert(**alert) for alert in alerts]