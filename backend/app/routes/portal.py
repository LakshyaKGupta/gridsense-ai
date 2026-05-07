from typing import Dict, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.services.portal_service import PortalService
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
