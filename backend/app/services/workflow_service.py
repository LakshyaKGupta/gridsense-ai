import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.services.portal_service import PortalService

_workflow_events: List[Dict] = []
_action_states: Dict[str, Dict] = {}


class WorkflowService:
    def __init__(self, portal_service: PortalService):
        self.portal_service = portal_service

    def acknowledge_action(self, action_title: str, operator_email: str) -> Dict:
        state = _action_states.get(action_title)
        if not state:
            state = {
                "id": str(uuid.uuid4()),
                "title": action_title,
                "status": "acknowledged",
                "acknowledged_by": operator_email,
                "acknowledged_at": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "history": [],
            }
            _action_states[action_title] = state
        elif state["status"] == "pending":
            state["status"] = "acknowledged"
            state["acknowledged_by"] = operator_email
            state["acknowledged_at"] = datetime.now(timezone.utc).isoformat()

        event = {
            "id": str(uuid.uuid4()),
            "action_title": action_title,
            "event_type": "acknowledged",
            "operator": operator_email,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": f"Action acknowledged by {operator_email}",
        }
        _workflow_events.append(event)
        state["history"].append(event)

        return state

    def update_action_status(self, action_title: str, new_status: str, operator_email: str, notes: str = "") -> Dict:
        state = _action_states.get(action_title)
        if not state:
            return {"error": "Action not found"}

        valid_transitions = {
            "pending": ["acknowledged", "in-progress"],
            "acknowledged": ["in-progress", "resolved"],
            "in-progress": ["resolved", "escalated"],
            "resolved": [],
            "escalated": ["in-progress", "resolved"],
        }

        current_status = state["status"]
        if new_status not in valid_transitions.get(current_status, []):
            return {"error": f"Invalid transition from {current_status} to {new_status}"}

        old_status = state["status"]
        state["status"] = new_status
        state["updated_at"] = datetime.now(timezone.utc).isoformat()

        event = {
            "id": str(uuid.uuid4()),
            "action_title": action_title,
            "event_type": f"status_change",
            "operator": operator_email,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": f"Status changed from {old_status} to {new_status}. {notes}",
            "old_status": old_status,
            "new_status": new_status,
        }
        _workflow_events.append(event)
        state["history"].append(event)

        return state

    def get_action_state(self, action_title: str) -> Optional[Dict]:
        return _action_states.get(action_title)

    def get_all_action_states(self) -> List[Dict]:
        return list(_action_states.values())

    def get_event_timeline(self, limit: int = 50) -> List[Dict]:
        sorted_events = sorted(_workflow_events, key=lambda e: e["timestamp"], reverse=True)
        return sorted_events[:limit]

    def sync_action_queue(self, action_queue: List[Dict]) -> List[Dict]:
        for action in action_queue:
            title = action.get("title", "")
            if title and title not in _action_states:
                _action_states[title] = {
                    "id": str(uuid.uuid4()),
                    "title": title,
                    "status": "pending",
                    "priority": action.get("priority", "MEDIUM"),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "history": [],
                }

        enriched_queue = []
        for action in action_queue:
            title = action.get("title", "")
            state = _action_states.get(title)
            action["workflow_status"] = state["status"] if state else "pending"
            action["workflow_id"] = state["id"] if state else None
            action["acknowledged_by"] = state.get("acknowledged_by") if state else None
            action["acknowledged_at"] = state.get("acknowledged_at") if state else None
            enriched_queue.append(action)

        return enriched_queue
