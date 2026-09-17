"""
VANVAS Copilot API Endpoint
Authenticated conversational travel intelligence backed by Gemini Free-First architecture and VANVAS tools.
"""
import time
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, Trip, TripMember, Place
from app.api.deps import get_current_user
from app.providers.ai.factory import AIFactory
from app.providers.ai.tools import VANVAS_COPILOT_TOOLS
from app.providers.ai.dispatcher import AIToolDispatcher
from app.services.copilot_context import build_copilot_context

logger = logging.getLogger("vanvas.api.copilot")
router = APIRouter()


class CopilotChatRequest(BaseModel):
    message: str = Field(..., max_length=1000, description="The user's query or instruction for Copilot")
    trip_id: Optional[str] = Field(None, description="Optional active trip ID for contextual reasoning")
    destination_slug: Optional[str] = Field(None, description="Optional destination slug")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional client state")


class CopilotChatResponse(BaseModel):
    message: str
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    places: List[Dict[str, Any]] = Field(default_factory=list)
    plan: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None


@router.post("/chat", response_model=CopilotChatResponse)
async def copilot_chat(
    req: CopilotChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Authenticated endpoint to chat with VANVAS Copilot.
    Reasons over verified destination, trip, weather, and place facts through registered tools.
    """
    start_time = time.time()
    clean_msg = req.message.strip()
    if not clean_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Security check: Trip Authorization
    if req.trip_id:
        trip = db.query(Trip).filter(Trip.id == req.trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found.")
        is_creator = (trip.user_id == current_user.id)
        is_member = bool(db.query(TripMember).filter(
            TripMember.trip_id == trip.id, TripMember.user_id == current_user.id
        ).first())
        if not is_creator and not is_member:
            raise HTTPException(status_code=403, detail="Unauthorized: You do not have access to this trip.")

    # 2. Assemble context & system instruction
    context_data = build_copilot_context(
        db=db,
        user=current_user,
        trip_id=req.trip_id,
        destination_slug=req.destination_slug,
    )

    # 3. Initialize AI Provider & Tool Dispatcher
    ai_provider = AIFactory.get_provider()
    dispatcher = AIToolDispatcher(db=db, user=current_user)

    messages = [
        {"role": "user", "content": clean_msg}
    ]

    # 4. Execute AI reasoning with registered tools
    try:
        ai_res = await ai_provider.chat_with_tools(
            messages=messages,
            tools=VANVAS_COPILOT_TOOLS,
            tool_dispatcher=dispatcher,
            system_instruction=context_data["system_instruction"],
            temperature=0.6,
            max_turns=3,
        )
    except Exception as e:
        logger.error(f"Copilot reasoning exception: {e}")
        return CopilotChatResponse(
            message="VANVAS AI is temporarily resting. Your trips, maps, and valley guides remain fully active.",
            error=str(e),
            metadata={"provider": ai_provider.name, "latency_ms": round((time.time() - start_time) * 1000, 2)}
        )

    response_text = ai_res.get("text", "I have gathered your journey details.")
    executed_tools = ai_res.get("tool_calls", [])

    # 5. Extract referenced places and plans from tool results
    referenced_places: List[Dict[str, Any]] = []
    recommended_plan: Optional[Dict[str, Any]] = None
    actions: List[Dict[str, Any]] = []

    seen_place_ids = set()

    for tc in executed_tools:
        name = tc.get("name")
        res = tc.get("result", {})

        if name == "get_quick_plan" and isinstance(res, dict) and "items" in res:
            recommended_plan = res
            actions.append({
                "action_type": "view_quick_plan",
                "title": res.get("headline", "Quick Micro-Plan"),
                "payload": res
            })

        elif name in ["search_places", "get_nearby_places"] and isinstance(res, dict) and "places" in res:
            for p in res.get("places", []):
                pid = p.get("place_id")
                if pid and pid not in seen_place_ids:
                    seen_place_ids.add(pid)
                    referenced_places.append(p)

        elif name == "get_place" and isinstance(res, dict) and "place_id" in res:
            pid = res.get("place_id")
            if pid and pid not in seen_place_ids:
                seen_place_ids.add(pid)
                referenced_places.append(res)

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return CopilotChatResponse(
        message=response_text,
        actions=actions,
        places=referenced_places[:4],
        plan=recommended_plan,
        metadata={
            "provider": ai_provider.name,
            "model": ai_provider.model,
            "is_enabled": ai_provider.is_enabled,
            "tools_executed_count": len(executed_tools),
            "latency_ms": latency_ms,
        },
        error=ai_res.get("error_code")
    )
