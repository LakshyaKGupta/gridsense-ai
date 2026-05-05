from typing import Dict, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.services.portal_service import PortalService
from app.utils.auth import require_role

router = APIRouter()
portal_service = PortalService()


class ScenarioRequest(BaseModel):
    scenario: str


@router.get("/operator")
async def get_operator_dashboard(
    zone: Optional[str] = Query(default=None),
    scenario: Optional[str] = Query(default="normal"),
    session: Dict = Depends(require_role("operator")),
):
    return await portal_service.get_operator_dashboard(zone, scenario)


@router.get("/user")
async def get_user_dashboard(
    lat: float = Query(...),
    lng: float = Query(...),
    selected_station_id: Optional[int] = Query(default=None),
    vehicle_model: Optional[str] = Query(default=None),
    battery_capacity_kwh: Optional[float] = Query(default=None),
    home_charging_access: Optional[bool] = Query(default=None),
    typical_charging_time: Optional[str] = Query(default=None),
    session: Dict = Depends(require_role("user")),
):
    return await portal_service.get_user_dashboard(
        lat=lat,
        lng=lng,
        selected_station_id=selected_station_id,
        vehicle_model=vehicle_model,
        battery_capacity_kwh=battery_capacity_kwh,
        home_charging_access=home_charging_access,
        typical_charging_time=typical_charging_time,
    )


@router.post("/scenario")
async def set_portal_scenario(request: ScenarioRequest):
    return {"scenario": portal_service.set_scenario(request.scenario)}
