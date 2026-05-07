from typing import Dict, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.services.portal_service import PortalService
from app.services.user_workspace_service import user_workspace_service
from app.services.workflow_service import WorkflowService
from app.utils.auth import require_role

router = APIRouter()
portal_service = PortalService()
workflow_service = WorkflowService(portal_service)


class ScenarioRequest(BaseModel):
    scenario: str


class ActionAcknowledgeRequest(BaseModel):
    action_title: str


class ActionStatusUpdateRequest(BaseModel):
    action_title: str
    new_status: str
    notes: str = ""


class SaveStationRequest(BaseModel):
    station_id: int


class SaveRouteRequest(BaseModel):
    station_id: int
    station_name: str
    distance_km: float
    eta_minutes: int


class SaveWindowRequest(BaseModel):
    time_label: str
    predicted_demand: float
    headline: str


class ScheduleChargeRequest(BaseModel):
    station_name: str
    time_label: str
    estimated_cost_inr: float
    energy_kwh: float


class AlertUpdateRequest(BaseModel):
    alert_id: str
    read: Optional[bool] = None
    dismissed: Optional[bool] = None


class WalletRechargeRequest(BaseModel):
    amount_inr: float


class SettingsUpdateRequest(BaseModel):
    notification_enabled: Optional[bool] = None
    queue_alerts: Optional[bool] = None
    price_alerts: Optional[bool] = None
    preferred_speed: Optional[str] = None
    privacy_mode: Optional[bool] = None


@router.get("/operator")
async def get_operator_dashboard(
    zone: Optional[str] = Query(default=None),
    scenario: Optional[str] = Query(default="normal"),
    session: Dict = Depends(require_role("operator")),
):
    result = await portal_service.get_operator_dashboard(zone, scenario)
    result["action_queue"] = workflow_service.sync_action_queue(result["action_queue"])
    result["workflow"] = {
        "active_actions": workflow_service.get_all_action_states(),
        "recent_events": workflow_service.get_event_timeline(limit=20),
    }
    return result


@router.get("/user")
async def get_user_dashboard(
    lat: float = Query(...),
    lng: float = Query(...),
    selected_station_id: Optional[int] = Query(default=None),
    vehicle_model: Optional[str] = Query(default=None),
    battery_capacity_kwh: Optional[float] = Query(default=None),
    battery_percent: Optional[float] = Query(default=None),
    home_charging_access: Optional[bool] = Query(default=None),
    typical_charging_time: Optional[str] = Query(default=None),
    destination: Optional[str] = Query(default=None),
    session: Dict = Depends(require_role("user")),
):
    return await portal_service.get_user_dashboard(
        lat=lat,
        lng=lng,
        selected_station_id=selected_station_id,
        vehicle_model=vehicle_model,
        battery_capacity_kwh=battery_capacity_kwh,
        battery_percent=battery_percent,
        home_charging_access=home_charging_access,
        typical_charging_time=typical_charging_time,
        destination=destination,
        user_key=session.get("email", "anonymous"),
    )


@router.post("/scenario")
async def set_portal_scenario(request: ScenarioRequest):
    return {"scenario": portal_service.set_scenario(request.scenario)}


@router.post("/workflow/acknowledge")
async def acknowledge_action(
    request: ActionAcknowledgeRequest,
    session: Dict = Depends(require_role("operator")),
):
    operator_email = session.get("email", "unknown")
    result = workflow_service.acknowledge_action(request.action_title, operator_email)
    return result


@router.post("/workflow/update-status")
async def update_action_status(
    request: ActionStatusUpdateRequest,
    session: Dict = Depends(require_role("operator")),
):
    operator_email = session.get("email", "unknown")
    result = workflow_service.update_action_status(
        request.action_title, request.new_status, operator_email, request.notes
    )
    if "error" in result:
        return {"error": result["error"]}
    return result


@router.get("/workflow/timeline")
async def get_workflow_timeline(
    limit: int = Query(default=50),
    session: Dict = Depends(require_role("operator")),
):
    return {"events": workflow_service.get_event_timeline(limit)}


@router.get("/workflow/actions")
async def get_workflow_actions(
    session: Dict = Depends(require_role("operator")),
):
    return {"actions": workflow_service.get_all_action_states()}


@router.post("/user/save-station")
async def save_station(
    request: SaveStationRequest,
    session: Dict = Depends(require_role("user")),
):
    station = await portal_service.get_station_by_id(request.station_id)
    if not station:
        return {"error": "Station not found"}
    return user_workspace_service.save_station(session.get("email", "anonymous"), station)


@router.post("/user/unsave-station")
async def unsave_station(
    request: SaveStationRequest,
    session: Dict = Depends(require_role("user")),
):
    return user_workspace_service.unsave_station(session.get("email", "anonymous"), request.station_id)


@router.post("/user/save-route")
async def save_route(
    request: SaveRouteRequest,
    session: Dict = Depends(require_role("user")),
):
    return user_workspace_service.save_route(session.get("email", "anonymous"), request.model_dump())


@router.post("/user/save-window")
async def save_window(
    request: SaveWindowRequest,
    session: Dict = Depends(require_role("user")),
):
    return user_workspace_service.save_window(session.get("email", "anonymous"), request.model_dump())


@router.post("/user/remove-window")
async def remove_window(
    request: SaveWindowRequest,
    session: Dict = Depends(require_role("user")),
):
    return user_workspace_service.remove_saved_window(session.get("email", "anonymous"), request.time_label)


@router.post("/user/schedule")
async def schedule_charge(
    request: ScheduleChargeRequest,
    session: Dict = Depends(require_role("user")),
):
    return user_workspace_service.schedule_charge(session.get("email", "anonymous"), request.model_dump())


@router.post("/user/record-navigation")
async def record_navigation(
    request: SaveRouteRequest,
    session: Dict = Depends(require_role("user")),
):
    return user_workspace_service.record_navigation(session.get("email", "anonymous"), request.model_dump())


@router.post("/user/alert")
async def update_user_alert(
    request: AlertUpdateRequest,
    session: Dict = Depends(require_role("user")),
):
    return user_workspace_service.update_alert(
        session.get("email", "anonymous"),
        request.alert_id,
        read=request.read,
        dismissed=request.dismissed,
    )


@router.post("/user/wallet/recharge")
async def recharge_wallet(
    request: WalletRechargeRequest,
    session: Dict = Depends(require_role("user")),
):
    return user_workspace_service.recharge_wallet(session.get("email", "anonymous"), request.amount_inr)


@router.post("/user/settings")
async def update_user_settings(
    request: SettingsUpdateRequest,
    session: Dict = Depends(require_role("user")),
):
    return user_workspace_service.update_settings(
        session.get("email", "anonymous"),
        {key: value for key, value in request.model_dump().items() if value is not None},
    )
