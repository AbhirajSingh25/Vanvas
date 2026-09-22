import pytest
import pytest_asyncio
import os
import re
from typing import Dict, Any, List
from app.database.session import SessionLocal
from app.models.models import Place, Destination, Hotel
from app.providers.artwork_provider import CuratedArtworkProvider

@pytest.mark.asyncio
async def test_global_artwork_governance_all_seed_places():
    db = SessionLocal()
    provider = CuratedArtworkProvider()
    
    places = db.query(Place).all()
    assert len(places) > 0, "No places found in database"
    
    destinations = {d.id: d for d in db.query(Destination).all()}
    
    # Track resolved assets to detect collisions
    asset_to_exact_places: Dict[str, List[str]] = {}
    
    audit_rows = []
    
    for p in places:
        dest = destinations.get(p.destination_id)
        dest_name = dest.name if dest else "Unknown"
        cat_name = p.category or ""
        
        res = await provider.resolve_place_artwork(
            place_name=p.name,
            destination_name=dest_name,
            category=cat_name,
            existing_image_url=p.image_url
        )
        
        img_url = res["image_url"]
        tier = res["tier"]
        theme = res.get("semantic_category")
        
        audit_rows.append({
            "place": p.name,
            "destination": dest_name,
            "category": cat_name,
            "resolved_asset": img_url,
            "tier": tier,
            "theme": theme
        })
        
        # Rule 1: No deprecated assets (no .svg, no placeholder)
        assert ".svg" not in img_url.lower(), f"Deprecated SVG vector artwork found for {p.name}: {img_url}"
        assert "placeholder" not in img_url.lower(), f"Placeholder asset found for {p.name}: {img_url}"
        
        # Rule 2: If resolved to an exact landmark, ensure no two distinct landmarks share the exact asset
        if tier == "exact_place":
            if img_url not in asset_to_exact_places:
                asset_to_exact_places[img_url] = []
            asset_to_exact_places[img_url].append(f"{dest_name}:{p.name}")
            
    # Assert zero exact asset collisions among different places
    for asset, place_list in asset_to_exact_places.items():
        assert len(place_list) == 1, f"EXACT ASSET COLLISION: {asset} shared across {place_list}"
        
    print(f"\n[GOVERNANCE PASS] Verified {len(places)} seed places with zero exact collisions.")

@pytest.mark.asyncio
async def test_jaipur_dedicated_landmarks():
    provider = CuratedArtworkProvider()
    
    # 1. Hawa Mahal
    res = await provider.resolve_place_artwork("Hawa Mahal (Palace of Winds)", "Jaipur", "Culture & Heritage")
    assert res["image_url"] == "/images/places/jaipur/hawa-mahal.webp"
    assert res["tier"] == "exact_place"
    
    # 2. Nahargarh Fort Sunset Bastion
    res = await provider.resolve_place_artwork("Nahargarh Fort Sunset Bastion", "Jaipur", "Nature & Trails")
    assert res["image_url"] == "/images/places/jaipur/nahargarh-fort.webp"
    assert res["tier"] == "exact_place"
    
    # 3. Amber Fort & Maota Lake
    res = await provider.resolve_place_artwork("Amber Fort & Maota Lake", "Jaipur", "Culture & Heritage")
    assert res["image_url"] == "/images/places/jaipur/amber-fort.webp"
    assert res["tier"] == "exact_place"

@pytest.mark.asyncio
async def test_leh_dedicated_landmarks():
    provider = CuratedArtworkProvider()
    
    # 1. Leh Palace
    res = await provider.resolve_place_artwork("Leh Palace", "Leh", "Culture & Heritage")
    assert res["image_url"] == "/images/places/leh/leh-palace.webp"
    assert res["tier"] == "exact_place"
    
    # 2. Pangong Tso
    res = await provider.resolve_place_artwork("Pangong Tso Alpine Lake", "Leh", "Nature & Trails")
    assert res["image_url"] == "/images/places/leh/pangong-tso.webp"
    assert res["tier"] == "exact_place"
    
    # 3. Thiksey Monastery
    res = await provider.resolve_place_artwork("Thiksey Monastery (Gompa)", "Leh", "Culture & Heritage")
    assert res["image_url"] == "/images/places/leh/thiksey-monastery-gompa.webp"
    assert res["tier"] == "exact_place"

@pytest.mark.asyncio
async def test_stays_never_inherit_landmarks():
    db = SessionLocal()
    provider = CuratedArtworkProvider()
    
    hotels = db.query(Hotel).all()
    assert len(hotels) > 0, "No hotels found in database"
    
    for h in hotels:
        dest = db.query(Destination).filter(Destination.id == h.destination_id).first()
        dest_name = dest.name if dest else "Universal"
        
        res = await provider.resolve_place_artwork(
            place_name=h.name,
            destination_name=dest_name,
            category="stay",
            existing_image_url=h.image_url
        )
        
        img = res["image_url"]
        assert "stay.webp" in img or res["semantic_category"] == "stay", f"Stay {h.name} received invalid asset: {img}"
        assert "palace.webp" not in img and "fort.webp" not in img and "monastery.webp" not in img, f"Stay {h.name} received landmark asset: {img}"

@pytest.mark.asyncio
async def test_no_false_positive_collisions():
    provider = CuratedArtworkProvider()
    
    # Palolem Beach must NOT resolve to Anjuna Beach
    res_palolem = await provider.resolve_place_artwork("Palolem Beach Crescent Cove", "Goa", "Nature & Trails")
    assert res_palolem["image_url"] == "/images/places/goa/categories/beach.webp"
    assert res_palolem["image_url"] != "/images/places/goa/anjuna-beach.webp"
    
    # Anjuna Beach must resolve to dedicated Anjuna Beach
    res_anjuna = await provider.resolve_place_artwork("Anjuna Beach & Flea Market", "Goa", "Nature & Trails")
    assert res_anjuna["image_url"] == "/images/places/goa/anjuna-beach.webp"
    assert res_anjuna["tier"] == "exact_place"
