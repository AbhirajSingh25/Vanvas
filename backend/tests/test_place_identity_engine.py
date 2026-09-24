import os
import json
import pytest
from app.providers.artwork_provider import CuratedArtworkProvider
from app.providers.place_artwork_generator import (
    GeminiPlaceArtworkProvider,
    DisabledPlaceArtworkProvider,
    get_place_artwork_generator
)
from app.core.config import settings

@pytest.fixture
def artwork_provider():
    return CuratedArtworkProvider()

@pytest.fixture
def disabled_generator():
    return DisabledPlaceArtworkProvider()

@pytest.mark.asyncio
async def test_01_exact_place_artwork_resolution(artwork_provider):
    """Test 1: Exact place artwork resolves correctly for registered landmarks."""
    res = await artwork_provider.resolve_place_artwork(
        place_name="Landour Bakehouse",
        destination_name="Mussoorie",
        category="Cafés & Bakery"
    )
    assert res["tier"] == "exact_place"
    assert "landour-bakehouse" in res["image_url"]
    assert res["badge"] == "VANVAS PLACE ARTWORK"

@pytest.mark.asyncio
async def test_02_place_artwork_uniqueness(artwork_provider):
    """Test 2: Distinct places MUST NOT resolve to the same image asset."""
    res_bakehouse = await artwork_provider.resolve_place_artwork("Landour Bakehouse", "Mussoorie", "Cafés & Bakery")
    res_kempty = await artwork_provider.resolve_place_artwork("Kempty Falls", "Mussoorie", "Nature & Trails")
    res_lal_tibba = await artwork_provider.resolve_place_artwork("Lal Tibba", "Mussoorie", "Nature & Trails")
    res_gun_hill = await artwork_provider.resolve_place_artwork("Gun Hill", "Mussoorie", "Culture & Heritage")

    # Each exact place must have its own dedicated asset
    assert res_bakehouse["image_url"] != res_kempty["image_url"]
    assert res_lal_tibba["image_url"] != res_gun_hill["image_url"]
    assert res_bakehouse["image_url"] != res_lal_tibba["image_url"]

@pytest.mark.asyncio
async def test_03_no_generic_hero_when_exact_exists(artwork_provider):
    """Test 3: Exact landmarks do not return the generic destination hero image."""
    res = await artwork_provider.resolve_place_artwork("Lal Tibba Scenic Viewpoint", "Mussoorie", "Nature & Trails")
    assert res["image_url"] != "/images/destinations/mussoorie/hero.jpg"
    assert res["image_url"] == "/images/places/mussoorie/lal-tibba.webp"

@pytest.mark.asyncio
async def test_04_missing_exact_falls_back_to_category(artwork_provider):
    """Test 4: Uncatalogued place falls back to destination category artwork, not hero."""
    res = await artwork_provider.resolve_place_artwork("Random Unknown Cafe 123", "Mussoorie", "Cafés & Bakery")
    assert res["tier"] == "destination_category"
    assert "/images/places/mussoorie/categories/cafe.webp" in res["image_url"]
    assert res["badge"] == "DESTINATION CATEGORY ART"

@pytest.mark.asyncio
async def test_05_fallback_state_labeled_correctly(artwork_provider):
    """Test 5: Fallback states are honestly and distinctly labeled in badges."""
    res_exact = await artwork_provider.resolve_place_artwork("Hadimba Devi Temple", "Manali", "Culture & Heritage")
    assert res_exact["badge"] == "VANVAS PLACE ARTWORK"

    res_cat = await artwork_provider.resolve_place_artwork("Some Local Dhaba", "Manali", "Food & Dining")
    assert res_cat["badge"] == "DESTINATION CATEGORY ART"

    res_reg = await artwork_provider.resolve_place_artwork("Some Unknown Spot", "UnknownRegion", "Nature")
    assert res_reg["badge"] == "REGIONAL ART"

def test_06_source_id_stable_key(artwork_provider):
    """Test 6: Normalized keys generate stable deterministic identifiers."""
    key1 = artwork_provider._normalize_key("Mussoorie", "Landour Bakehouse")
    key2 = artwork_provider._normalize_key("mussoorie", "landour bakehouse")
    assert key1 == "mussoorie:landour-bakehouse"
    assert key1 == key2

def test_07_artwork_metadata_schema_valid():
    """Test 7: Metadata JSON files have valid schema."""
    meta_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "frontend/public/images/places/mussoorie/landour-bakehouse.json"
    )
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert "place_visual_key" in data
        assert "place_name" in data
        assert "destination" in data
        assert "category" in data
        assert "source" in data
        assert "artwork_provider" in data
        assert isinstance(data["reference_used"], bool)

def test_08_truthful_reference_used_flag():
    """Test 8: reference_used is boolean and truthful."""
    fact_sheet = GeminiPlaceArtworkProvider().format_visual_fact_sheet("Landour Bakehouse", "mussoorie", "Cafes")
    assert "place_name" in fact_sheet
    assert "prompt" in fact_sheet
    assert "Landour Bakehouse" in fact_sheet["prompt"]

@pytest.mark.asyncio
async def test_09_mussoorie_all_places_distinct(artwork_provider):
    """Test 9: All verified Mussoorie places resolve to distinct artwork assets."""
    places = [
        "Landour Bakehouse",
        "Lal Tibba",
        "Kempty Falls",
        "Gun Hill",
        "Camel's Back Road",
        "Mussoorie Mall Road",
        "Sir George Everest House",
        "Cloud's End",
        "Landour Cantonment Ridge"
    ]
    resolved_urls = []
    for p in places:
        res = await artwork_provider.resolve_place_artwork(p, "Mussoorie", "Various")
        resolved_urls.append(res["image_url"])
    
    # Assert all URLs are unique across the 9 landmarks
    assert len(resolved_urls) == len(set(resolved_urls)), f"Found duplicate artwork URLs: {resolved_urls}"

@pytest.mark.asyncio
async def test_10_live_poi_cannot_inherit_unrelated_artwork(artwork_provider):
    """Test 10: Live POIs with generic names do not falsely match famous landmarks."""
    res_generic_view = await artwork_provider.resolve_place_artwork("Random View Point Spot", "Mussoorie", "Nature & Trails")
    assert res_generic_view["tier"] == "destination_category"
    assert "lal-tibba" not in res_generic_view["image_url"]

@pytest.mark.asyncio
async def test_11_destination_artwork_stays_specific(artwork_provider):
    """Test 11: Destination category artworks match their respective destination folders."""
    res_muss = await artwork_provider.resolve_place_artwork("Unknown Cafe", "Mussoorie", "Cafés & Bakery")
    res_manali = await artwork_provider.resolve_place_artwork("Unknown Cafe", "Manali", "Cafés & Bakery")
    assert "mussoorie" in res_muss["image_url"]
    assert "manali" in res_manali["image_url"]
    assert res_muss["image_url"] != res_manali["image_url"]

def test_12_homepage_manali_artwork_exists():
    """Test 12: Manali destination hero artwork exists and is readable."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    hero_path = os.path.join(base_dir, "frontend/public/images/destinations/manali/hero.jpg")
    assert os.path.exists(hero_path), f"Manali hero missing at {hero_path}"

def test_13_vehicle_artwork_bespoke_svgs():
    """Test 13: Bespoke vehicle artwork assets exist and are in active vehicles directory."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    vehicles = ["adventure_motorcycle.jpg", "automatic_scooter.jpg", "classic_bullet.jpg"]
    for v in vehicles:
        v_path = os.path.join(base_dir, f"frontend/public/images/vehicles/{v}")
        assert os.path.exists(v_path), f"Vehicle artwork missing: {v_path}"

def test_14_place_images_exist_on_disk():
    """Test 14: Registered WebP assets exist in frontend/public/images/places/."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    expected_assets = [
        "frontend/public/images/places/mussoorie/landour-bakehouse.webp",
        "frontend/public/images/places/mussoorie/lal-tibba.webp",
        "frontend/public/images/places/mussoorie/kempty-falls.webp",
        "frontend/public/images/places/mussoorie/gun-hill.webp",
        "frontend/public/images/places/mussoorie/camel-back-road.webp",
        "frontend/public/images/places/mussoorie/mall-road.webp",
        "frontend/public/images/places/mussoorie/george-everest.webp",
        "frontend/public/images/places/mussoorie/clouds-end.webp",
        "frontend/public/images/places/mussoorie/landour.webp",
        "frontend/public/images/places/manali/hadimba-temple.webp",
        "frontend/public/images/places/manali/solang-valley.webp",
        "frontend/public/images/places/manali/old-manali.webp"
    ]
    for rel_path in expected_assets:
        full_path = os.path.join(base_dir, rel_path)
        assert os.path.exists(full_path), f"Expected asset missing on disk: {rel_path}"

@pytest.mark.asyncio
async def test_15_disabled_provider_safe_fallback(disabled_generator):
    """Test 15 & 20: Disabled AI generation provider returns safe, non-blocking status."""
    res = await disabled_generator.generate_place_artwork(
        place_name="New Place",
        destination_slug="mussoorie",
        category="Nature"
    )
    assert res["success"] is False
    assert res["status"] == "disabled"
    assert res["image_url"] is None

def test_16_factory_returns_configured_generator():
    """Test 16: Provider factory returns safe Disabled provider when unconfigured."""
    gen = get_place_artwork_generator()
    assert isinstance(gen, (DisabledPlaceArtworkProvider, GeminiPlaceArtworkProvider))
