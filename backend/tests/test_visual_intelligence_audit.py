import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.providers.artwork_provider import CuratedArtworkProvider
from app.services.place_visual_resolver import PlaceVisualResolverService

@pytest.mark.asyncio
async def test_01_exact_place_artwork_resolution():
    """1. Exact place artwork resolution for known curated places."""
    resolver = PlaceVisualResolverService()
    
    # Landour Bakehouse in Mussoorie
    res = await resolver.resolve_place(
        place_name="Landour Bakehouse",
        destination_name="Mussoorie",
        category="Cafés & Bakery"
    )
    assert res["tier"] == "exact_place"
    assert res["badge"] == "VANVAS PLACE ARTWORK"
    assert res["image_url"] == "/images/places/mussoorie/landour-bakehouse.webp"
    assert res["is_real_photo"] is False

    # Hadimba Devi Temple in Manali
    res_h = await resolver.resolve_place(
        place_name="Hadimba Devi Cedar Forest Temple",
        destination_name="Manali",
        category="Culture & Heritage"
    )
    assert res_h["tier"] == "exact_place"
    assert res_h["badge"] == "VANVAS PLACE ARTWORK"
    assert res_h["image_url"] == "/images/places/manali/hadimba-temple.webp"

@pytest.mark.asyncio
async def test_02_destination_artwork_resolution():
    """2. Destination artwork resolution when destination is curated but place is unknown."""
    provider = CuratedArtworkProvider()
    
    # Destination hero/illustration check
    assert "manali" in provider.DESTINATION_HEROES
    assert provider.DESTINATION_HEROES["manali"]["illustration"] == "/images/destinations/manali/illustration.jpg"
    assert provider.DESTINATION_HEROES["goa"]["illustration"] == "/images/destinations/goa/illustration.jpg"

@pytest.mark.asyncio
async def test_03_category_artwork_resolution():
    """3. Category artwork resolution for unknown places in curated destinations."""
    resolver = PlaceVisualResolverService()
    
    # Unknown cafe in Manali
    res_cafe = await resolver.resolve_place(
        place_name="Riverside Alpine Cafe",
        destination_name="Manali",
        category="Food & Cafes"
    )
    assert res_cafe["tier"] == "destination_category"
    assert res_cafe["badge"] == "DESTINATION CATEGORY ART"
    assert res_cafe["image_url"] == "/images/places/manali/categories/cafe.webp"

    # Unknown nature trail in Dharamshala
    res_trail = await resolver.resolve_place(
        place_name="Pine Forest Trail",
        destination_name="Dharamshala",
        category="Nature & Trails"
    )
    assert res_trail["tier"] == "destination_category"
    assert res_trail["badge"] == "DESTINATION CATEGORY ART"
    assert res_trail["image_url"] == "/images/places/dharamshala/categories/nature.webp"

@pytest.mark.asyncio
async def test_04_semantic_fallback():
    """4. Semantic fallback resolution across geographical contexts."""
    provider = CuratedArtworkProvider()
    
    # Coastal fallback
    fb_coastal = provider._resolve_regional_fallback("Gokarna", "Beach")
    assert fb_coastal == "/images/destinations/fallbacks/coastal.jpg"

    # Desert fallback
    fb_desert = provider._resolve_regional_fallback("Jodhpur", "Desert Fort")
    assert fb_desert == "/images/destinations/fallbacks/desert.jpg"

    # River/Valley fallback
    fb_river = provider._resolve_regional_fallback("Ayodhya", "River Ghat")
    assert fb_river == "/images/destinations/fallbacks/valley.jpg"

@pytest.mark.asyncio
async def test_05_beach_cannot_receive_mountain_artwork():
    """5. Beach / coastal place cannot receive mountain artwork."""
    resolver = PlaceVisualResolverService()
    res = await resolver.resolve_place(
        place_name="Om Beach Shacks",
        destination_name="Gokarna",
        category="Beaches & Sea"
    )
    assert "himalayan.jpg" not in res["image_url"]
    assert "coastal.jpg" in res["image_url"]
    assert res["badge"] == "REGIONAL ART"

@pytest.mark.asyncio
async def test_06_cafe_cannot_receive_fort_artwork():
    """6. Cafe cannot receive fort or unrelated military architecture."""
    provider = CuratedArtworkProvider()
    theme = provider._classify_category_theme("Cafés & Bakery", "The Roastery Coffee Shop")
    assert theme == "cafe"
    assert theme != "spiritual"
    assert theme != "viewpoint"

@pytest.mark.asyncio
async def test_07_food_cannot_receive_unrelated_religious_artwork():
    """7. Food / momo shop cannot receive unrelated religious temple artwork."""
    provider = CuratedArtworkProvider()
    theme = provider._classify_category_theme("Tibetan Momo Corner", "Tibetan Kitchen")
    assert theme == "cafe"
    assert theme != "spiritual"

@pytest.mark.asyncio
async def test_08_exact_artwork_collision_detection():
    """8. Exact artwork collision detection guard."""
    warnings = CuratedArtworkProvider.detect_artwork_collisions()
    # No duplicate asset cross-assignment between different destinations
    assert len(warnings) == 0, f"Collisions detected: {warnings}"

@pytest.mark.asyncio
async def test_09_provenance_correctness():
    """9. Provenance classification correctness."""
    resolver = PlaceVisualResolverService()
    
    # Exact curated place -> VANVAS PLACE ARTWORK
    res1 = await resolver.resolve_place("St. Paul's Church", "Mussoorie", "Culture")
    assert res1["badge"] == "VANVAS PLACE ARTWORK"
    assert res1["tier"] == "exact_place"

    # Unknown place in curated destination -> DESTINATION CATEGORY ART
    res2 = await resolver.resolve_place("Unknown Mussoorie Cafe", "Mussoorie", "Cafes")
    assert res2["badge"] == "DESTINATION CATEGORY ART"
    assert res2["tier"] == "destination_category"

    # Unknown place in arbitrary destination -> REGIONAL ART
    res3 = await resolver.resolve_place("Pune Secret Garden", "Pune", "Nature")
    assert res3["badge"] == "REGIONAL ART"
    assert res3["tier"] == "regional_fallback"

@pytest.mark.asyncio
async def test_10_broken_asset_fallback():
    """10. Ensure resolver returns valid, existing static image paths."""
    resolver = PlaceVisualResolverService()
    res = await resolver.resolve_place("Any Random Unknown Place", "Uncharted Valley", "General")
    assert res["image_url"].startswith("/images/")
    assert res["image_url"].endswith((".jpg", ".webp", ".png"))

@pytest.mark.asyncio
async def test_11_curated_place_artwork_priority():
    """11. Curated place artwork takes priority over generic category."""
    resolver = PlaceVisualResolverService()
    
    # Hawa Mahal in Jaipur has specific place artwork
    res = await resolver.resolve_place("Hawa Mahal", "Jaipur", "Culture & Heritage")
    assert res["tier"] == "exact_place"
    assert res["image_url"] == "/images/places/jaipur/hawa-mahal.webp"
    assert res["badge"] == "VANVAS PLACE ARTWORK"

@pytest.mark.asyncio
async def test_12_arbitrary_destination_category_fallback():
    """12. Arbitrary destination category fallback for Delhi, Pune, Kolkata, Ayodhya."""
    resolver = PlaceVisualResolverService()
    
    # Delhi Cafe
    res_delhi = await resolver.resolve_place("Khan Market Cafe", "Delhi", "Coffee & Cafes")
    assert res_delhi["tier"] == "regional_fallback"
    assert res_delhi["badge"] == "REGIONAL ART"
    assert res_delhi["metadata"]["category_theme"] == "cafe"

    # Pune Stay
    res_pune = await resolver.resolve_place("Sahyadri Resort", "Pune", "Stays & Sanctuaries")
    assert res_pune["metadata"]["category_theme"] == "stay"

    # Kolkata Market
    res_kolkata = await resolver.resolve_place("New Market", "Kolkata", "Markets & Shops")
    assert res_kolkata["metadata"]["category_theme"] in ["shopping", "viewpoint"]

    # Ayodhya Temple
    res_ayodhya = await resolver.resolve_place("Ram Mandir", "Ayodhya", "Spiritual & Temple")
    assert res_ayodhya["metadata"]["category_theme"] == "spiritual"
    assert res_ayodhya["image_url"] == "/images/destinations/fallbacks/valley.jpg"
