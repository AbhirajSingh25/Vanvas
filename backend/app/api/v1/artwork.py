from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from app.services.place_visual_resolver import PlaceVisualResolverService

router = APIRouter()

@router.get("/place")
async def resolve_place_artwork(
    place_name: str = Query(..., min_length=1),
    destination: Optional[str] = Query(None),
    destination_slug: Optional[str] = Query(None),
    category: str = Query("Attraction"),
    locality: Optional[str] = None
):
    """
    Resolves artwork for a specific place adhering to the multi-tier hierarchy:
    EXACT PLACE ARTWORK -> DESTINATION + CATEGORY -> DESTINATION HERO -> REGIONAL FALLBACK
    """
    dest = destination or destination_slug or "India"
    res = await PlaceVisualResolverService.resolve_place(
        place_name=place_name,
        destination_name=dest,
        category=category,
        locality=locality
    )
    return res

@router.get("/metadata")
async def get_artwork_metadata(
    key: str = Query(..., min_length=1)
):
    """
    Retrieves structured metadata brief for an artwork key.
    """
    meta = await PlaceVisualResolverService.get_metadata(key)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Metadata for '{key}' not found")
    return meta
