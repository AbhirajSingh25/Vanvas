import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.providers.artwork_provider import CuratedArtworkProvider, OptionalAIArtworkProvider
from app.services.place_visual_resolver import PlaceVisualResolverService

@pytest.mark.asyncio
async def test_exact_place_artwork_resolution():
    resolver = PlaceVisualResolverService()
    
    # 1. Mussoorie Landour Bakehouse
    res_lb = await resolver.resolve_place(
        place_name="Landour Bakehouse",
        destination_name="Mussoorie",
        category="Cafés & Bakery"
    )
    assert res_lb["tier"] == "exact_place"
    assert "mussoorie" in res_lb["image_url"]
    assert res_lb["badge"] == "VANVAS ARTWORK"

    # 2. Udaipur City Palace
    res_cp = await resolver.resolve_place(
        place_name="City Palace of Udaipur",
        destination_name="Udaipur",
        category="Culture & Heritage"
    )
    assert res_cp["tier"] == "exact_place"
    assert "udaipur" in res_cp["image_url"]

    # 3. Manali Hadimba Temple
    res_ht = await resolver.resolve_place(
        place_name="Hadimba Devi Cedar Forest Temple",
        destination_name="Manali",
        category="Culture & Heritage"
    )
    assert res_ht["tier"] == "exact_place"
    assert "manali" in res_ht["image_url"]

@pytest.mark.asyncio
async def test_destination_category_fallback_resolution():
    resolver = PlaceVisualResolverService()
    
    # Unknown cafe in Mussoorie
    res_cafe = await resolver.resolve_place(
        place_name="Random Hill View Cafe",
        destination_name="Mussoorie",
        category="Cafés & Bakery"
    )
    assert res_cafe["tier"] == "destination_category"
    assert "mussoorie" in res_cafe["image_url"]

    # Unknown palace in Udaipur
    res_palace = await resolver.resolve_place(
        place_name="New Lake View Haveli",
        destination_name="Udaipur",
        category="Culture & Heritage"
    )
    assert res_palace["tier"] == "destination_category"
    assert "udaipur" in res_palace["image_url"]

@pytest.mark.asyncio
async def test_artwork_api_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/artwork/place?place_name=Landour+Bakehouse&destination=Mussoorie&category=Cafes")
        assert r.status_code == 200
        data = r.json()
        assert data["tier"] == "exact_place"
        assert "mussoorie" in data["image_url"]

        # Metadata endpoint
        r_meta = await client.get("/api/v1/artwork/metadata?key=mussoorie:landour-bakehouse")
        assert r_meta.status_code == 200
        meta = r_meta.json()
        assert meta["place_name"] == "Landour Bakehouse"
        assert meta["source"] == "curated_artwork"
        assert "api_key" not in meta
