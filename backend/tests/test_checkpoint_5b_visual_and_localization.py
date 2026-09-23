import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.providers.artwork_provider import CuratedArtworkProvider
from app.services.place_visual_resolver import PlaceVisualResolverService

@pytest.mark.asyncio
async def test_checkpoint_5b_hindi_localization():
    """Verify all 12 curated destinations have canonical Hindi names."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/destinations")
        assert r.status_code == 200
        destinations = r.json()
        
        dest_map = {d["slug"]: d for d in destinations}
        
        # Test required destinations
        assert "leh" in dest_map
        assert dest_map["leh"]["hindi_name"] == "लेह"
        
        assert "spiti" in dest_map
        assert dest_map["spiti"]["hindi_name"] == "स्पीति घाटी"
        
        assert "munnar" in dest_map
        assert dest_map["munnar"]["hindi_name"] == "मुन्नार"
        
        # Verify all 12 have non-empty Hindi names
        curated_slugs = ["manali", "rishikesh", "kasol", "dharamshala", "goa", "jaipur", "mussoorie", "udaipur", "varanasi", "leh", "spiti", "munnar"]
        for slug in curated_slugs:
            assert slug in dest_map, f"Missing destination {slug}"
            assert dest_map[slug]["hindi_name"], f"Destination {slug} missing hindi_name"

@pytest.mark.asyncio
async def test_checkpoint_5b_dharamshala_exact_landmarks():
    """Verify Dharamshala landmarks resolve to distinct, semantically accurate exact place artworks."""
    resolver = PlaceVisualResolverService()
    
    # 1. Bhagsunag Waterfall
    res_bw = await resolver.resolve_place(
        place_name="Bhagsunag Waterfall & Shiva Café",
        destination_name="Dharamshala",
        category="Nature & Trails"
    )
    assert res_bw["tier"] == "exact_place"
    assert "bhagsunag-waterfall" in res_bw["image_url"]
    
    # 2. Namgyal Monastery
    res_nm = await resolver.resolve_place(
        place_name="Namgyal Monastery & Tsuglagkhang Complex",
        destination_name="Dharamshala",
        category="Culture & Heritage"
    )
    assert res_nm["tier"] == "exact_place"
    assert "namgyal-monastery" in res_nm["image_url"]
    
    # 3. Triund Trek
    res_tt = await resolver.resolve_place(
        place_name="Triund High Ridge Himalayan Trek",
        destination_name="Dharamshala",
        category="Adventure"
    )
    assert res_tt["tier"] == "exact_place"
    assert "triund-trek" in res_tt["image_url"]
    
    # 4. Norbulingka Institute
    res_ni = await resolver.resolve_place(
        place_name="Norbulingka Tibetan Cultural Institute",
        destination_name="Dharamshala",
        category="Culture & Heritage"
    )
    assert res_ni["tier"] == "exact_place"
    assert "norbulingka-institute" in res_ni["image_url"]
    
    # 5. Illiterati Cafe
    res_ic = await resolver.resolve_place(
        place_name="Illiterati Books & Artisan Coffee",
        destination_name="Dharamshala",
        category="Cafés & Bakery"
    )
    assert res_ic["tier"] == "exact_place"
    assert "illiterati-cafe" in res_ic["image_url"]
    
    # Verify all 5 resolved URLs are completely unique
    urls = [res_bw["image_url"], res_nm["image_url"], res_tt["image_url"], res_ni["image_url"], res_ic["image_url"]]
    assert len(set(urls)) == 5, f"Dharamshala cards share image URLs: {urls}"

@pytest.mark.asyncio
async def test_checkpoint_5b_semantic_category_artworks():
    """Verify category fallback resolves semantically (cafe looks like cafe, waterfall looks like waterfall)."""
    resolver = PlaceVisualResolverService()
    
    # Cafe
    res_cafe = await resolver.resolve_place("Unknown Mountain Bean Cafe", "Manali", "Cafés & Bakery")
    assert "cafe" in res_cafe["image_url"]
    
    # Stay / Homestay
    res_stay = await resolver.resolve_place("Rustic Alpine Homestay", "Manali", "Stays & Sanctuaries")
    assert "stay" in res_stay["image_url"]
    
    # Waterfall
    res_wf = await resolver.resolve_place("Hidden Forest Cascade", "Manali", "Nature & Trails")
    assert "waterfall" in res_wf["image_url"] or "nature" in res_wf["image_url"]

@pytest.mark.asyncio
async def test_checkpoint_5b_mobility_rentals():
    """Verify mobility listings in API use high quality editorial artwork paths, not SVGs."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/rentals?destination_id=dest-manali")
        assert r.status_code == 200
        rentals = r.json()
        assert len(rentals) > 0
        for rental in rentals:
            img = rental.get("image_url", "")
            assert not img.endswith(".svg"), f"Rental {rental.get('vehicle_name')} has .svg image: {img}"
            if "/images/vehicles/" in img:
                assert img.endswith(".jpg") or img.endswith(".webp"), f"Invalid vehicle image format: {img}"
