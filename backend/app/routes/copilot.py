from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional

from app.services.operator_copilot import OperatorCopilot
from app.utils.auth import require_role

router = APIRouter()
copilot_instance = OperatorCopilot()


class CopilotQueryRequest(BaseModel):
    query: str
    zone_name: Optional[str] = None
    scenario: str = "normal"


@router.post("/copilot/ask")
async def ask_copilot(
    request: CopilotQueryRequest,
    session: dict = Depends(require_role("operator")),
):
    """
    Ask the Operator Copilot a question about grid operations.
    
    Query examples:
    - "What zones are at highest risk?"
    - "Why is there a peak at 8 PM in Whitefield?"
    - "What should I do to prevent overload?"
    - "What's the impact of smart charging?"
    """
    result = await copilot_instance.answer(
        query=request.query,
        zone_name=request.zone_name,
        scenario=request.scenario,
    )
    return result


@router.get("/copilot/history")
async def get_copilot_history(
    limit: int = Query(default=20, ge=1, le=100),
    session: dict = Depends(require_role("operator")),
):
    """Get recent copilot conversation history."""
    return {
        "messages": copilot_instance.get_conversation_history(limit),
        "total_messages": len(copilot_instance.conversation_history),
    }


@router.post("/copilot/clear")
async def clear_copilot_history(
    session: dict = Depends(require_role("operator")),
):
    """Clear the copilot conversation history."""
    copilot_instance.clear_history()
    return {"status": "cleared"}
