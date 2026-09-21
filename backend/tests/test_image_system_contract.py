import pytest
import os
from pathlib import Path
from app.providers.artwork_provider import CuratedArtworkProvider
from app.services.place_visual_resolver import PlaceVisualResolverService

@pytest.fixture
def provider():
    return CuratedArtworkProvider()

@pytest.mark.asyncio
async def test_moon_dance_cafe_exact_resolution(provider):
    """1. Moon Dance Cafe -> cafe-specific visual with truthful exact artwork tier."""
    res = await provider.resolve_place_artwork(
        place_name="Moon Dance Café & German Bakery",
        destination_name="Kasol",
        category="Cafés & Bakery"
    )
    assert res["tier"] == "exact_place"
    assert res["semantic_category"] == "cafe"
    assert "moon-dance-cafe" in res["image_url"]
    assert res["badge_label"] == "VANVAS PLACE ARTWORK"

@pytest.mark.asyncio
async def test_chalal_trail_exact_resolution(provider):
    """2. Chalal Pine Riverside Trail -> trail/nature visual."""
    res = await provider.resolve_place_artwork(
        place_name="Chalal Pine Riverside Trail",
        destination_name="Kasol",
        category="Nature & Trails"
    )
    assert res["tier"] == "exact_place"
    assert res["semantic_category"] in ["trail", "nature"]
    assert "chalal-trail" in res["image_url"]
    assert res["badge_label"] == "VANVAS PLACE ARTWORK"

@pytest.mark.asyncio
async def test_manali_temple_visual(provider):
    """3. Manali temple -> temple visual."""
    res = await provider.resolve_place_artwork(
        place_name="Hadimba Devi Cedar Forest Temple",
        destination_name="Manali",
        category="Culture & Heritage"
    )
    assert res["tier"] == "exact_place"
    assert "hadimba-temple" in res["image_url"]
    assert res["semantic_category"] == "spiritual"

@pytest.mark.asyncio
async def test_goa_beach_visual(provider):
    """4. Goa beach -> beach/nature visual."""
    res = await provider.resolve_place_artwork(
        place_name="Anjuna Beach Coastline",
        destination_name="Goa",
        category="Nature & Trails"
    )
    assert res["tier"] == "exact_place"
    assert res["semantic_category"] == "beach" or res["semantic_category"] == "nature"

@pytest.mark.asyncio
async def test_jaipur_palace_visual(provider):
    """5. Jaipur palace -> heritage visual."""
    res = await provider.resolve_place_artwork(
        place_name="Hawa Mahal Palace of Winds",
        destination_name="Jaipur",
        category="Culture & Heritage"
    )
    assert res["tier"] == "exact_place"
    assert "hawa-mahal" in res["image_url"]
    assert res["semantic_category"] in ["heritage", "spiritual"]

@pytest.mark.asyncio
async def test_varanasi_ghat_visual(provider):
    """6. Varanasi ghat -> river/ghat visual."""
    res = await provider.resolve_place_artwork(
        place_name="Dashashwamedh Ghat Evening Maha Aarti",
        destination_name="Varanasi",
        category="Culture & Heritage"
    )
    assert res["tier"] == "exact_place"
    assert "dashashwamedh-ghat-aarti" in res["image_url"]
    assert res["semantic_category"] == "spiritual"

@pytest.mark.asyncio
async def test_delhi_cafe_arbitrary(provider):
    """7. Delhi cafe -> cafe visual."""
    res = await provider.resolve_place_artwork(
        place_name="Blue Tokai Coffee Roasters",
        destination_name="Delhi",
        category="Cafés & Bakery"
    )
    assert res["semantic_category"] == "cafe"
    assert "cafe" in res["image_url"]
    assert res["tier"] in ["destination_category", "regional_fallback", "universal_fallback"]

@pytest.mark.asyncio
async def test_pune_restaurant_arbitrary(provider):
    """8. Pune restaurant -> food visual."""
    res = await provider.resolve_place_artwork(
        place_name="Vaishali Pure Veg Restaurant",
        destination_name="Pune",
        category="Local Food"
    )
    assert res["semantic_category"] == "food"
    assert "food" in res["image_url"] or "cafe" in res["image_url"]

@pytest.mark.asyncio
async def test_kolkata_market_arbitrary(provider):
    """9. Kolkata market -> market visual."""
    res = await provider.resolve_place_artwork(
        place_name="New Market Hogg Market",
        destination_name="Kolkata",
        category="Shops & Markets"
    )
    assert res["semantic_category"] == "shopping"

@pytest.mark.asyncio
async def test_gokarna_beach_arbitrary(provider):
    """10. Gokarna beach -> beach visual."""
    res = await provider.resolve_place_artwork(
        place_name="Om Beach Cliff",
        destination_name="Gokarna",
        category="Nature & Trails"
    )
    assert res["semantic_category"] == "beach" or res["semantic_category"] == "nature"
    assert "coastal" in res["image_url"] or "beach" in res["image_url"] or "nature" in res["image_url"]

@pytest.mark.asyncio
async def test_ayodhya_temple_arbitrary(provider):
    """11. Ayodhya temple -> temple visual."""
    res = await provider.resolve_place_artwork(
        place_name="Shri Ram Janmabhoomi Mandir",
        destination_name="Ayodhya",
        category="Culture & Heritage"
    )
    assert res["semantic_category"] == "spiritual"

@pytest.mark.asyncio
async def test_arbitrary_hotel_stay_visual(provider):
    """12. Arbitrary hotel -> accommodation visual."""
    res = await provider.resolve_place_artwork(
        place_name="Grand Heritage Mountain Resort",
        destination_name="Shimla",
        category="Stays & Resorts"
    )
    assert res["semantic_category"] == "stay"
    assert "stay" in res["image_url"]

@pytest.mark.asyncio
async def test_arbitrary_waterfall_visual(provider):
    """13. Arbitrary waterfall -> waterfall visual."""
    res = await provider.resolve_place_artwork(
        place_name="Nohkalikai Waterfall Cascade",
        destination_name="Cherrapunji",
        category="Nature & Trails"
    )
    assert res["semantic_category"] == "waterfall"
    assert "waterfall" in res["image_url"] or "nature" in res["image_url"] or "valley" in res["image_url"]

@pytest.mark.asyncio
async def test_broken_primary_fallback(provider):
    """14 & 15. Broken primary URL / missing image -> guaranteed fallback."""
    res = await provider.resolve_place_artwork(
        place_name="Unknown Unseeded Secret Corner",
        destination_name="UnseededRemoteVillage",
        category="Mystic Viewpoint"
    )
    assert res["image_url"] is not None
    assert res["fallback_url"] is not None
    assert res["image_url"].startswith("/") or res["image_url"].startswith("http")

def test_no_unrelated_category_collision(provider):
    """16. Unrelated category collision detection."""
    warnings = provider.detect_artwork_collisions()
    assert len(warnings) == 0, f"Found unexpected collisions: {warnings}"

def test_exact_registry_unique_assets(provider):
    """17. No duplicate exact-place assignments across destinations."""
    asset_to_dest = {}
    for key, item in provider.PLACE_ARTWORK_REGISTRY.items():
        dest = key.split(":")[0]
        url = item["image_url"]
        if url in asset_to_dest:
            assert asset_to_dest[url] == dest, f"Asset {url} shared between {dest} and {asset_to_dest[url]}"
        asset_to_dest[url] = dest

@pytest.mark.asyncio
async def test_image_contract_consistency(provider):
    """18. Single Image Contract fields consistency."""
    res = await provider.resolve_place_artwork(
        place_name="Moon Dance Café & German Bakery",
        destination_name="Kasol",
        category="Cafés & Bakery"
    )
    required_keys = ["url", "fallback_url", "source", "source_type", "provenance", "semantic_category", "exactness", "alt_text", "badge_label"]
    for k in required_keys:
        assert k in res, f"Missing ImageContract key: {k}"
    assert res["badge_label"] == "VANVAS PLACE ARTWORK"
    assert res["exactness"] == "exact"
