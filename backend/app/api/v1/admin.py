from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, Trip, Destination, Place, Hotel, RentalOption
from app.schemas.schemas import (
    AdminDashboardStats, ProviderHealthStatus, PlaceBase, PlaceResponse,
    CreativeArtGenerateRequest, CreativeArtGenerateResponse
)
from app.api.deps import get_current_admin
from app.providers.provider_factory import ProviderFactory
from app.providers.ai.factory import AIFactory
from app.core.config import settings

router = APIRouter()

class AITestRequest(BaseModel):
    prompt: str = "Suggest a 1-day slow travel walking trail in Mussoorie."
    system_instruction: Optional[str] = "You are VANVAS Copilot, a calm Himalayan travel guide."

@router.get("/health")
def get_system_health():
    """
    Public system health diagnostic endpoint checking status of all real-data providers.
    """
    return {
        "status": "healthy",
        "providers": ProviderFactory.get_provider_health()
    }

@router.get("/ai/health")
async def get_ai_provider_health():
    """
    Diagnostic endpoint to check the health and configuration of the AI provider (Gemini / Disabled).
    """
    ai_provider = AIFactory.get_provider()
    health = await ai_provider.health_check()
    return {
        "status": health.get("status", "unknown"),
        "active_provider": ai_provider.name,
        "model": ai_provider.model,
        "is_enabled": ai_provider.is_enabled,
        "configured_ai_provider_setting": settings.AI_PROVIDER,
        "details": health
    }

@router.post("/ai/test")
async def test_ai_provider(
    req: AITestRequest,
    current_admin: User = Depends(get_current_admin)
):
    """
    Admin-only diagnostic endpoint to test generation with the configured AI provider.
    """
    ai_provider = AIFactory.get_provider()
    res = await ai_provider.generate_response(
        prompt=req.prompt,
        system_instruction=req.system_instruction
    )
    return res

@router.get("/stats", response_model=AdminDashboardStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    total_users = db.query(User).count()
    total_trips = db.query(Trip).count()
    total_dest = db.query(Destination).count()
    total_places = db.query(Place).count()
    active_trips = db.query(Trip).filter(Trip.status == "active").count()

    provider_health_raw = ProviderFactory.get_provider_health()
    health_statuses = [ProviderHealthStatus(**h) for h in provider_health_raw]

    return AdminDashboardStats(
        total_users=total_users,
        total_trips=total_trips,
        total_destinations=total_dest,
        total_places=total_places,
        active_trips_count=active_trips,
        provider_health=health_statuses
    )

@router.post("/places", response_model=PlaceResponse)
def admin_create_place(
    place_in: PlaceBase,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    new_place = Place(**place_in.model_dump())
    db.add(new_place)
    db.commit()
    db.refresh(new_place)
    return new_place

@router.delete("/places/{place_id}")
def admin_delete_place(
    place_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    
    db.delete(place)
    db.commit()
    return {"success": True, "message": f"Place '{place.name}' removed successfully"}

@router.post("/creative-art/generate", response_model=CreativeArtGenerateResponse)
async def admin_generate_creative_art(
    req: CreativeArtGenerateRequest,
    current_admin: User = Depends(get_current_admin)
):
    """
    Admin-protected endpoint to trigger programmatic destination artwork generation.
    Supports OpenAI gpt-image-2 and Curated CreativeArtProvider workflows.
    Validates visual role, terrain type, aspect ratio, and strictly sanitizes slugs against path traversal.
    """
    import re
    # Validate visual role
    valid_roles = ["illustration", "hero", "card", "place"]
    if req.visual_role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid visual_role '{req.visual_role}'. Must be one of: {valid_roles}"
        )

    # Validate terrain type
    valid_terrains = ["himalayan", "high_desert", "coastal", "desert", "valley", "river_ghat", "tropical", "general"]
    if req.terrain_type not in valid_terrains:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid terrain_type '{req.terrain_type}'. Must be one of: {valid_terrains}"
        )

    # Validate aspect ratio
    valid_ratios = ["square", "tall", "wide", "hero"]
    if req.aspect_ratio not in valid_ratios:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid aspect_ratio '{req.aspect_ratio}'. Must be one of: {valid_ratios}"
        )

    # Path traversal validation on slug
    if ".." in req.slug or "/" in req.slug or "\\" in req.slug:
        raise HTTPException(
            status_code=400,
            detail="Invalid slug format. Path traversal characters ('..', '/', '\\') are prohibited."
        )

    clean_slug = re.sub(r"[^a-zA-Z0-9_-]", "", req.slug.lower().replace(" ", "-")).strip("-")
    if not clean_slug:
        raise HTTPException(status_code=400, detail="Slug cannot be empty or solely special characters.")

    provider = ProviderFactory.get_creative_art_provider()
    result = await provider.generate_destination_art(
        destination_name=req.destination_name,
        slug=clean_slug,
        terrain_type=req.terrain_type,
        visual_role=req.visual_role,
        aspect_ratio=req.aspect_ratio,
        state=req.state,
        elevation_meters=req.elevation_meters,
        auto_promote=req.auto_promote
    )

    return CreativeArtGenerateResponse(**result)
