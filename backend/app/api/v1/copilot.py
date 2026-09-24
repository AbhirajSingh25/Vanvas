"""
VANVAS Copilot API Endpoint
Authenticated persistent conversational travel intelligence backed by Gemini Free-First architecture,
4-layer Context Engine, and verified VANVAS database tools.
"""
import time
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User, Trip, TripMember, Place, Conversation, ConversationMessage
from app.api.deps import get_current_user
from app.providers.ai.factory import AIFactory
from app.providers.ai.tools import VANVAS_COPILOT_TOOLS
from app.providers.ai.dispatcher import AIToolDispatcher
from app.services.copilot_context import (
    CopilotContextEngine,
    extract_session_decisions,
)
from app.services.storage_service import StorageService
from app.core.rate_limiter import rate_limit

logger = logging.getLogger("vanvas.api.copilot")
router = APIRouter()


class CopilotChatRequest(BaseModel):
    message: str = Field(..., max_length=1000, description="The user's query or instruction for Copilot")
    conversation_id: Optional[str] = Field(None, description="Optional active conversation ID for persistent multi-turn session")
    trip_id: Optional[str] = Field(None, description="Optional active trip ID for contextual reasoning")
    destination_slug: Optional[str] = Field(None, description="Optional destination slug")
    image_url: Optional[str] = Field(None, description="Optional persistent URL of an uploaded image")
    image_base64: Optional[str] = Field(None, description="Optional base64 image data")
    image_mime_type: Optional[str] = Field("image/jpeg", description="MIME type for image")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional client state")


class ImageUploadResponse(BaseModel):
    image_url: str
    message: str


@router.post("/upload-image", response_model=ImageUploadResponse)
async def upload_copilot_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload an image for Ask VANVAS reasoning (e.g. photo of monument, menu, trail map, ticket).
    Returns persistent public URL.
    """
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds maximum allowable size of 10MB.")

    mime_type = file.content_type or "image/jpeg"
    ext = ".jpg"
    if "png" in mime_type:
        ext = ".png"
    elif "webp" in mime_type:
        ext = ".webp"

    unique_key = f"chat/{current_user.id}/{uuid.uuid4().hex}{ext}"
    try:
        url = StorageService.upload_chat_image(storage_key=unique_key, file_bytes=content, content_type=mime_type)
        return ImageUploadResponse(image_url=url, message="Image uploaded successfully.")
    except Exception as e:
        logger.error(f"Chat image upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")


@router.get("/image/{key_path:path}")
def serve_copilot_image(key_path: str):
    """Serves locally stored chat images."""
    if ".." in key_path or key_path.startswith("/") or key_path.startswith("\\"):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    file_bytes, mime_type = StorageService.read_local_file(f"chat/{key_path}" if not key_path.startswith("chat/") else key_path)
    if file_bytes is None:
        raise HTTPException(status_code=404, detail="Image not found.")

    return Response(
        content=file_bytes,
        media_type=mime_type or "image/jpeg",
        headers={
            "Cache-Control": "public, max-age=86400, immutable",
            "X-Content-Type-Options": "nosniff",
        }
    )



class CopilotChatResponse(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    places: List[Dict[str, Any]] = Field(default_factory=list)
    plan: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None


@router.post("/chat", response_model=CopilotChatResponse, dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60))])
async def copilot_chat(
    req: CopilotChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Authenticated endpoint to chat with VANVAS Copilot with persistent multi-turn memory.
    Reasons over verified destination, trip, weather, and place facts through registered tools.
    """
    start_time = time.time()
    clean_msg = req.message.strip()
    if not clean_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Security check: Trip Authorization
    trip = None
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

    # 2. Resolve Conversation
    conv: Optional[Conversation] = None
    if req.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == req.conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        if conv.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized: You do not have access to this conversation.")
        # Link trip or destination if provided and not previously set
        if req.trip_id and not conv.trip_id:
            conv.trip_id = req.trip_id
        if req.destination_slug:
            conv.destination_slug = req.destination_slug
    elif req.trip_id:
        # Look for user's recent conversation for this trip
        conv = db.query(Conversation).filter(
            Conversation.user_id == current_user.id,
            Conversation.trip_id == req.trip_id
        ).order_by(Conversation.updated_at.desc()).first()

        if not conv:
            title = f"Expedition Chat: {trip.title}" if trip else "Mountain Expedition Session"
            conv = Conversation(
                user_id=current_user.id,
                trip_id=req.trip_id,
                destination_slug=req.destination_slug or (trip.destination.slug if trip and trip.destination else None),
                title=title,
            )
            db.add(conv)
            db.flush()
    else:
        # Standalone conversation without trip
        title = f"Exploration: {req.destination_slug.title()}" if req.destination_slug else "Spontaneous Valley Exploration"
        conv = Conversation(
            user_id=current_user.id,
            destination_slug=req.destination_slug,
            title=title,
        )
        db.add(conv)
        db.flush()

    # 3. Extract & Merge Session Decisions
    new_decisions = extract_session_decisions(clean_msg)
    if new_decisions:
        CopilotContextEngine.update_conversation_decisions(
            db=db,
            user=current_user,
            conversation_id=conv.id,
            new_decisions=new_decisions,
        )

    # 4. Persist User Message
    user_metadata = {}
    if req.image_url:
        user_metadata["image_url"] = req.image_url

    user_msg = ConversationMessage(
        conversation_id=conv.id,
        role="user",
        content=clean_msg,
        metadata_json=json.dumps(user_metadata) if user_metadata else None,
    )
    db.add(user_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    # 5. Assemble Context via ContextEngine
    context_data = CopilotContextEngine.build_full_context(
        db=db,
        user=current_user,
        conversation_id=conv.id,
        trip_id=req.trip_id or conv.trip_id,
        destination_slug=req.destination_slug or conv.destination_slug,
    )

    # 6. Initialize AI Provider & Tool Dispatcher
    ai_provider = AIFactory.get_provider()
    dispatcher = AIToolDispatcher(db=db, user=current_user)

    # Format multi-turn messages for AI provider
    raw_recent = context_data.get("recent_messages", [])
    messages_for_ai = []
    for rm in raw_recent:
        role = rm.get("role", "user")
        content = rm.get("content", "")
        messages_for_ai.append({"role": role, "content": content})

    active_user_turn = {
        "role": "user",
        "content": clean_msg,
        "image_url": req.image_url,
        "image_base64": req.image_base64,
        "image_mime_type": req.image_mime_type,
    }

    if not messages_for_ai or messages_for_ai[-1].get("content") != clean_msg:
        messages_for_ai.append(active_user_turn)
    else:
        messages_for_ai[-1] = active_user_turn

    # 7. Execute AI reasoning with registered tools
    try:
        ai_res = await ai_provider.chat_with_tools(
            messages=messages_for_ai,
            tools=VANVAS_COPILOT_TOOLS,
            tool_dispatcher=dispatcher,
            system_instruction=context_data["system_instruction"],
            temperature=0.6,
            max_turns=3,
        )
    except Exception as e:
        logger.error(f"Copilot reasoning exception: {e}")
        return CopilotChatResponse(
            conversation_id=conv.id,
            message="VANVAS AI is temporarily resting. Your trips, maps, and valley guides remain fully active.",
            error=str(e),
            metadata={"provider": ai_provider.name, "latency_ms": round((time.time() - start_time) * 1000, 2)}
        )

    response_text = ai_res.get("text", "I have gathered your journey details.")
    executed_tools = ai_res.get("tool_calls", [])

    # 8. Extract referenced places and plans from tool results
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

        elif name == "save_place" and isinstance(res, dict):
            actions.append({
                "action_type": "save_place",
                "title": res.get("message", "Place Saved"),
                "payload": res
            })
            p = res.get("place", {})
            pid = p.get("id")
            if pid and pid not in seen_place_ids:
                seen_place_ids.add(pid)
                referenced_places.append({
                    "place_id": pid,
                    "name": p.get("name", ""),
                    "category": p.get("category", "Attraction"),
                })

        elif name == "add_place_to_itinerary" and isinstance(res, dict):
            actions.append({
                "action_type": "add_place_to_itinerary",
                "title": res.get("message", "Added to Itinerary"),
                "payload": res
            })
            p = res.get("place", {})
            pid = p.get("id")
            if pid and pid not in seen_place_ids:
                seen_place_ids.add(pid)
                referenced_places.append({
                    "place_id": pid,
                    "name": p.get("name", ""),
                    "category": p.get("category", "Attraction"),
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

    metadata_dict = {
        "provider": ai_provider.name,
        "model": ai_provider.model,
        "is_enabled": ai_provider.is_enabled,
        "tools_executed_count": len(executed_tools),
        "latency_ms": latency_ms,
    }
    if ai_res.get("error_code"):
        metadata_dict["error_code"] = ai_res.get("error_code")

    # 9. Persist Assistant Response & Sanitized Compact Tool Audit
    def _sanitize_dict(d: Any) -> Any:
        if isinstance(d, dict):
            sanitized = {}
            for k, v in d.items():
                if any(sec in k.lower() for sec in ["token", "secret", "password", "key", "auth", "credential", "cookie"]):
                    sanitized[k] = "[REDACTED]"
                else:
                    sanitized[k] = _sanitize_dict(v)
            return sanitized
        elif isinstance(d, list):
            return [_sanitize_dict(i) for i in d]
        elif isinstance(d, str) and any(sec in d.lower() for sec in ["bearer ", "jwt "]):
            return "[REDACTED]"
        return d

    compact_tool_calls = json.dumps([
        {"name": tc.get("name"), "args": _sanitize_dict(tc.get("arguments", {}))}
        for tc in executed_tools
    ]) if executed_tools else None

    compact_tool_results = json.dumps([
        {"name": tc.get("name"), "summary": str(_sanitize_dict(tc.get("result", {})))[:300]}
        for tc in executed_tools
    ]) if executed_tools else None

    assistant_msg = ConversationMessage(
        conversation_id=conv.id,
        role="assistant",
        content=response_text,
        tool_calls=compact_tool_calls,
        tool_results=compact_tool_results,
        metadata_json=json.dumps(metadata_dict),
    )
    db.add(assistant_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    return CopilotChatResponse(
        conversation_id=conv.id,
        message=response_text,
        actions=actions,
        places=referenced_places[:4],
        plan=recommended_plan,
        metadata=metadata_dict,
        error=ai_res.get("error_code")
    )

