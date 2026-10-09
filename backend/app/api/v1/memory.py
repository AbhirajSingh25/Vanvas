"""
VANVAS Traveller Memory API Router (Phase 5)
REST endpoints for inspecting, confirming, editing, deleting, clearing,
and exporting traveller travel memories and learning preferences.
"""
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User, TravellerMemory, MemoryObservation, UserPreference
from app.api.deps import get_current_user
from app.schemas.schemas import (
    TravellerMemoryResponse,
    TravellerMemoryCreateRequest,
    TravellerMemoryUpdateRequest,
    TravellerMemorySettingsRequest,
    MemoryObservationRequest,
    MemoryObservationResponse,
    TravellerMemoryExportResponse,
    MemoryPersonalizationContextResponse,
)
from app.services.traveller_memory_service import TravellerMemoryService

router = APIRouter()


@router.get("", response_model=List[TravellerMemoryResponse])
def get_memories(
    category: Optional[str] = None,
    trip_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists active travel memories for the authenticated user, ordered by conflict resolution precedence.
    """
    memories = TravellerMemoryService.get_active_memories(
        db=db,
        user_id=current_user.id,
        trip_id=trip_id,
        category=category
    )
    return memories


@router.post("/explicit", response_model=TravellerMemoryResponse, status_code=status.HTTP_201_CREATED)
def create_explicit_preference(
    payload: TravellerMemoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Explicitly adds or updates a travel preference directly from user settings or conversational input.
    """
    try:
        memory = TravellerMemoryService.create_or_update_explicit_preference(
            db=db,
            user_id=current_user.id,
            category=payload.category,
            preference_key=payload.preference_key,
            preference_value=payload.preference_value,
            trip_id=payload.trip_id,
            is_trip_specific=payload.is_trip_specific,
            source_event=payload.source_event or "USER_EXPLICIT_SETTING",
            source_reference=payload.source_reference
        )
        return memory
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{memory_id}/confirm", response_model=TravellerMemoryResponse)
def confirm_preference(
    memory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Promotes an inferred memory to a confirmed, explicit preference.
    """
    memory = TravellerMemoryService.confirm_preference(
        db=db,
        user_id=current_user.id,
        memory_id=memory_id
    )
    if not memory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel memory not found or already removed.")
    return memory


@router.post("/{memory_id}/reject", response_model=TravellerMemoryResponse)
def reject_preference(
    memory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rejects an inferred memory, removing it from active context and ranking.
    """
    memory = TravellerMemoryService.reject_preference(
        db=db,
        user_id=current_user.id,
        memory_id=memory_id
    )
    if not memory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel memory not found or already removed.")
    return memory


@router.put("/{memory_id}", response_model=TravellerMemoryResponse)
def edit_preference(
    memory_id: str,
    payload: TravellerMemoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Edits and corrects a stored travel preference.
    """
    try:
        memory = TravellerMemoryService.edit_preference(
            db=db,
            user_id=current_user.id,
            memory_id=memory_id,
            new_value=payload.preference_value
        )
        if not memory:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel memory not found or already removed.")
        return memory
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{memory_id}")
def delete_preference(
    memory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes an individual travel memory immediately.
    """
    success = TravellerMemoryService.delete_preference(
        db=db,
        user_id=current_user.id,
        memory_id=memory_id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel memory not found.")
    return {"message": "Memory removed successfully.", "memory_id": memory_id}


@router.post("/clear")
def clear_all_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clears all saved travel memories and observation history for the authenticated user.
    """
    count = TravellerMemoryService.clear_user_memories(
        db=db,
        user_id=current_user.id
    )
    return {"message": f"Successfully cleared {count} travel preferences and all observation history."}


@router.post("/reset-inferred")
def reset_inferred_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resets learned inferred preferences while preserving explicit user configurations.
    """
    count = TravellerMemoryService.reset_inferred_preferences(
        db=db,
        user_id=current_user.id
    )
    return {"message": f"Successfully reset {count} inferred travel preferences."}


@router.put("/settings")
def update_learning_settings(
    payload: TravellerMemorySettingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggles preference learning on/off or pauses future learning.
    """
    enabled, paused = TravellerMemoryService.update_learning_settings(
        db=db,
        user_id=current_user.id,
        enabled=payload.memory_learning_enabled,
        paused=payload.memory_learning_paused
    )
    return {
        "memory_learning_enabled": enabled,
        "memory_learning_paused": paused,
        "message": "Traveller memory settings updated."
    }


@router.get("/context", response_model=MemoryPersonalizationContextResponse)
def get_personalization_context(
    trip_id: Optional[str] = None,
    destination_slug: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the sanitized, active personalization context for recommendation and Copilot reasoning.
    """
    ctx = TravellerMemoryService.build_personalization_context(
        db=db,
        user_id=current_user.id,
        trip_id=trip_id,
        destination_slug=destination_slug
    )
    return ctx


@router.get("/export", response_model=TravellerMemoryExportResponse)
def export_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exports all stored memories and observations for the authenticated user in portable JSON format.
    """
    learning_enabled, learning_paused = TravellerMemoryService.get_user_learning_state(db, current_user.id)
    memories = db.query(TravellerMemory).filter(
        TravellerMemory.user_id == current_user.id,
        TravellerMemory.status == "ACTIVE"
    ).all()
    observations = db.query(MemoryObservation).filter(
        MemoryObservation.user_id == current_user.id
    ).order_by(MemoryObservation.created_at.desc()).limit(200).all()

    return TravellerMemoryExportResponse(
        user_id=current_user.id,
        exported_at=datetime.now(timezone.utc),
        learning_enabled=learning_enabled,
        learning_paused=learning_paused,
        memories=memories,
        observations=observations
    )


@router.post("/observations", response_model=MemoryObservationResponse, status_code=status.HTTP_201_CREATED)
def record_observation(
    payload: MemoryObservationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests an observation event with idempotency protection.
    """
    obs = TravellerMemoryService.record_observation(
        db=db,
        user_id=current_user.id,
        event_type=payload.event_type,
        category=payload.category,
        observed_key=payload.observed_key,
        observed_value=payload.observed_value,
        trip_id=payload.trip_id,
        source_id=payload.source_id,
        metadata=payload.metadata,
        idempotency_key=payload.idempotency_key
    )
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="Observation recorded or skipped due to learning settings/sensitive filtering."
        )
    return obs
