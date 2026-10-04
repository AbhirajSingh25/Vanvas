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
    extract_explicit_destination,
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


from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings
from app.api.deps import security

def get_current_user_for_image(
    token: Optional[str] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    raw_token = credentials.credentials if credentials else token
    if not raw_token:
        if not settings.is_production:
            demo_user = db.query(User).filter(User.email == "traveller@vanvas.com").first()
            if demo_user:
                return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view private chat images",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        if not settings.is_production:
            demo_user = db.query(User).filter(User.email == "traveller@vanvas.com").first()
            if demo_user:
                return demo_user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.get("/image/{key_path:path}")
def serve_copilot_image(
    key_path: str,
    token: Optional[str] = None,
    current_user: User = Depends(get_current_user_for_image),
):
    """
    Serves locally stored private conversation chat images.
    Requires authentication and validates that the requesting user owns the image or is an admin.
    """
    if ".." in key_path or key_path.startswith("/") or key_path.startswith("\\"):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    # Validate image ownership from key_path (e.g. "chat/{user_id}/xxx.jpg" or "{user_id}/xxx.jpg")
    clean = key_path.replace("\\", "/").strip("/")
    parts = clean.split("/")
    owner_id = None
    if parts[0] == "chat" and len(parts) >= 3:
        owner_id = parts[1]
    elif len(parts) >= 2:
        owner_id = parts[0]

    if owner_id and current_user.role != "admin" and current_user.id != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized: You do not have access to this conversation image.")

    file_bytes, mime_type = StorageService.read_local_file(f"chat/{clean}" if not clean.startswith("chat/") else clean)
    if file_bytes is None:
        raise HTTPException(status_code=404, detail="Image not found.")

    return Response(
        content=file_bytes,
        media_type=mime_type or "image/jpeg",
        headers={
            "Cache-Control": "private, max-age=3600",
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

    # 3. Extract & Merge Session Decisions + Location Override
    explicit_dest = extract_explicit_destination(clean_msg)
    if explicit_dest:
        conv.destination_slug = explicit_dest
    elif req.destination_slug:
        conv.destination_slug = req.destination_slug

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
        destination_slug=explicit_dest or req.destination_slug or conv.destination_slug,
    )

    # 5.5. FAST PATH ROUTING: Deterministic Intent Handling (< 1s Latency)
    msg_clean_lower = clean_msg.lower().strip()
    dest_target_slug = explicit_dest or req.destination_slug or (trip.destination.slug if trip and trip.destination else None) or conv.destination_slug

    # A. "What's Next" Fast Path
    if msg_clean_lower in ["what's next", "whats next", "what is next", "next stop", "what is next on our itinerary right now?"]:
        if trip and trip.itineraries:
            # 1. Determine active itinerary day
            req_ctx = req.context or {}
            active_day_num = req_ctx.get("activeDayNumber") or req_ctx.get("selected_day") or req_ctx.get("day_number")
            if not active_day_num and trip.start_date:
                try:
                    today_d = datetime.now(timezone.utc).date()
                    trip_start_d = trip.start_date.date() if isinstance(trip.start_date, datetime) else trip.start_date
                    day_diff = (today_d - trip_start_d).days + 1
                    if 1 <= day_diff <= len(trip.itineraries):
                        active_day_num = day_diff
                except Exception:
                    pass
            if not active_day_num:
                active_day_num = 1

            # 2. Determine current local time in minutes (IST +5:30)
            now_dt = datetime.now(timezone.utc)
            ist_hour = (now_dt.hour + 5 + (now_dt.minute + 30) // 60) % 24
            ist_min = (now_dt.minute + 30) % 60
            curr_time_mins = ist_hour * 60 + ist_min

            # Find active day itinerary
            active_it = next((it for it in trip.itineraries if it.day_number == active_day_num), trip.itineraries[0])

            # 3. Sort today's items chronologically, ignoring completed/skipped/cancelled
            today_items = sorted(
                [item for item in active_it.items if (item.status or "").lower() not in ["completed", "skipped", "cancelled"]],
                key=lambda x: x.start_time or "00:00"
            )

            # 4. Find the next upcoming item
            next_it = None
            for item in today_items:
                try:
                    parts = (item.end_time or item.start_time or "23:59").split(":")
                    item_end_mins = int(parts[0]) * 60 + int(parts[1])
                    if item_end_mins >= curr_time_mins:
                        next_it = item
                        break
                except Exception:
                    next_it = item
                    break

            if not next_it and today_items:
                # If all upcoming today are uncompleted, take the first uncompleted
                next_it = today_items[0]

            if next_it:
                fast_resp_text = f"Next on Day {active_it.day_number} at {next_it.start_time}: {next_it.title}. {next_it.notes or 'Enjoy your visit!'}"
                fast_meta = {"provider": "vanvas_fast_path", "latency_ms": round((time.time() - start_time) * 1000, 2), "intent": "whats_next"}
                assistant_msg = ConversationMessage(
                    conversation_id=conv.id,
                    role="assistant",
                    content=fast_resp_text,
                    metadata_json=json.dumps(fast_meta),
                )
                db.add(assistant_msg)
                db.commit()
                return CopilotChatResponse(
                    conversation_id=conv.id,
                    message=fast_resp_text,
                    actions=[{"action_type": "navigate_trip", "title": "View Itinerary", "payload": {"trip_id": trip.id}}],
                    places=[{
                        "place_id": next_it.place_id or next_it.id,
                        "name": next_it.title,
                        "category": next_it.category or "Stop",
                        "approx_cost": next_it.estimated_cost,
                    }],
                    metadata=fast_meta
                )
            else:
                # 5. If all today is finished: show "Today is done" and next planned day summary
                next_day_num = active_it.day_number + 1
                next_day_it = next((it for it in trip.itineraries if it.day_number == next_day_num), None)
                if next_day_it and next_day_it.items:
                    first_tm = next_day_it.items[0]
                    fast_resp_text = f"Today is done! Rest well tonight. Tomorrow (Day {next_day_num}) begins at {first_tm.start_time} with {first_tm.title}."
                else:
                    fast_resp_text = "Today is done! All planned activities for today are complete. Rest well and enjoy your evening."

                fast_meta = {"provider": "vanvas_fast_path", "latency_ms": round((time.time() - start_time) * 1000, 2), "intent": "whats_next_day_done"}
                assistant_msg = ConversationMessage(
                    conversation_id=conv.id,
                    role="assistant",
                    content=fast_resp_text,
                    metadata_json=json.dumps(fast_meta),
                )
                db.add(assistant_msg)
                db.commit()
                return CopilotChatResponse(
                    conversation_id=conv.id,
                    message=fast_resp_text,
                    actions=[{"action_type": "navigate_trip", "title": "View Itinerary", "payload": {"trip_id": trip.id}}],
                    places=[],
                    metadata=fast_meta
                )

    # B. "Where are we staying" / "Hotel" Fast Path
    if any(k in msg_clean_lower for k in ["where are we staying", "where am i staying", "our hotel", "our stay", "where's my hotel"]):
        hotel_obj = trip.hotel if trip and trip.hotel else None
        if not hotel_obj and dest_target_slug:
            dest_rec = db.query(Destination).filter((Destination.slug == dest_target_slug) | (Destination.id == dest_target_slug)).first()
            if dest_rec and getattr(dest_rec, "hotels", None):
                hotel_obj = dest_rec.hotels[0]
        if hotel_obj:
            fast_resp_text = f"You are staying at {hotel_obj.name} in {hotel_obj.address}. Check-in is at {hotel_obj.check_in_time}."
            fast_meta = {"provider": "vanvas_fast_path", "latency_ms": round((time.time() - start_time) * 1000, 2), "intent": "stay_info"}
            assistant_msg = ConversationMessage(
                conversation_id=conv.id,
                role="assistant",
                content=fast_resp_text,
                metadata_json=json.dumps(fast_meta),
            )
            db.add(assistant_msg)
            db.commit()
            return CopilotChatResponse(
                conversation_id=conv.id,
                message=fast_resp_text,
                actions=[{"action_type": "view_stays", "title": "View Stays", "payload": {"destination": dest_target_slug}}],
                places=[],
                metadata=fast_meta
            )

    # C. "Departure / Leave Timing" Fast Path
    if any(k in msg_clean_lower for k in ["what time should i leave", "when should i leave", "what time should we leave", "when to depart", "departure time"]):
        t_json = trip.transport_details_json if trip else None
        t_mode = ((trip.transport_mode if trip else "") or "bus").lower()
        if t_json:
            try:
                t_data = json.loads(t_json) if isinstance(t_json, str) else t_json
                dep_time = t_data.get("departure_time")
                dep_loc = t_data.get("departure_location")
                arr_time = t_data.get("arrival_time")
                op_name = t_data.get("operator_name")
                if dep_time and dep_loc:
                    op_prefix = f"This {op_name or t_mode.replace('_', ' ').title()}"
                    arr_suffix = f", arriving at {arr_time}" if arr_time else ""
                    fast_resp_text = f"{op_prefix} departs at {dep_time} from {dep_loc}{arr_suffix}."
                elif dep_time:
                    fast_resp_text = f"This {t_mode.replace('_', ' ').title()} departs at {dep_time}."
                else:
                    fast_resp_text = f"VANVAS recommends leaving around 05:30–06:30 AM based on estimated route timing for your journey."
            except Exception:
                fast_resp_text = "VANVAS recommends leaving around 05:30–06:30 AM based on estimated route timing."
        elif "road" in t_mode or "car" in t_mode or "cab" in t_mode or "drive" in t_mode:
            fast_resp_text = "VANVAS recommends leaving around 05:30–06:30 AM based on estimated route timing to beat city exit traffic and arrive before mountain dusk."
        else:
            fast_resp_text = "VANVAS recommends leaving around 05:30–06:30 AM based on estimated route timing (or around 20:00–21:00 for overnight bus options)."

        fast_meta = {"provider": "vanvas_fast_path", "latency_ms": round((time.time() - start_time) * 1000, 2), "intent": "departure_timing"}
        assistant_msg = ConversationMessage(
            conversation_id=conv.id,
            role="assistant",
            content=fast_resp_text,
            metadata_json=json.dumps(fast_meta),
        )
        db.add(assistant_msg)
        db.commit()
        return CopilotChatResponse(
            conversation_id=conv.id,
            message=fast_resp_text,
            actions=[],
            places=[],
            metadata=fast_meta
        )

    # D. Simple Food / Cafes Fast Path
    is_simple_food_query = any(k in msg_clean_lower for k in [
        "best food", "food in ", "best cafes", "where to eat", "good food", "top cafes", "cafes in "
    ]) or msg_clean_lower in ["food", "cafes", "cafés", "dinner", "breakfast", "lunch"]

    if is_simple_food_query and dest_target_slug:
        dest_rec = db.query(Destination).filter((Destination.slug == dest_target_slug) | (Destination.id == dest_target_slug)).first()
        if dest_rec:
            food_places = db.query(Place).filter(
                Place.destination_id == dest_rec.id,
                Place.is_active == True,
                Place.category.in_(["Café", "Food", "Restaurant", "Local Food", "Cafés & Bakery"])
            ).order_by(Place.rating.desc().nullslast()).limit(4).all()

            if not food_places:
                food_places = db.query(Place).filter(
                    Place.destination_id == dest_rec.id,
                    Place.is_active == True
                ).order_by(Place.rating.desc().nullslast()).limit(4).all()

            if food_places:
                places_data = [{
                    "place_id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "approx_cost": p.approx_cost,
                    "rating": p.rating,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "description": p.description or f"Curated dining in {dest_rec.name}",
                } for p in food_places]

                fast_resp_text = f"Top verified dining & cafes in {dest_rec.name}:"
                fast_meta = {"provider": "vanvas_fast_path", "latency_ms": round((time.time() - start_time) * 1000, 2), "intent": "food_places"}
                assistant_msg = ConversationMessage(
                    conversation_id=conv.id,
                    role="assistant",
                    content=fast_resp_text,
                    metadata_json=json.dumps(fast_meta),
                )
                db.add(assistant_msg)
                db.commit()
                return CopilotChatResponse(
                    conversation_id=conv.id,
                    message=fast_resp_text,
                    actions=[{"action_type": "navigate_destination", "title": f"Explore {dest_rec.name}", "payload": {"slug": dest_rec.slug}}],
                    places=places_data,
                    metadata=fast_meta
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
            max_turns=1,
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

        elif name == "replan_day" and isinstance(res, dict):
            actions.append({
                "action_type": "replan_applied",
                "title": res.get("message", "Schedule Updated"),
                "payload": res
            })

        elif name in ["get_budget_summary", "get_split_balances"] and isinstance(res, dict):
            actions.append({
                "action_type": "open_wallet",
                "title": "Open Wallet & Split",
                "payload": res
            })

        elif name == "search_stays" and isinstance(res, dict) and "stays" in res:
            actions.append({
                "action_type": "view_stays",
                "title": "Explore Verified Stays",
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

