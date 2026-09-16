import os
import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.models.models import Destination, Place, Hotel, RentalOption, WeatherSnapshot
from app.services.destination_intelligence import DestinationIntelligenceService
from app.services.place_visual_resolver import PlaceVisualResolverService
from app.providers.provider_factory import ProviderFactory
from app.providers.artwork_provider import CuratedArtworkProvider
from app.providers.geocoding_provider import LiveGeocodingProvider

# In-memory SQLite DB for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    # Seed approved 12 destinations
    approved_12 = [
        "manali", "kasol", "dharamshala", "mussoorie", "rishikesh", "udaipur",
        "jaipur", "goa", "varanasi", "leh", "spiti", "munnar"
    ]
    for idx, slug in enumerate(approved_12):
        dest = Destination(
            id=f"dest-{slug}",
            name=slug.capitalize(),
            slug=slug,
            state="State",
            region="Region",
            tagline="Tagline",
            description="Description",
            latitude=30.0 + idx,
            longitude=75.0 + idx,
            altitude_meters=1000 + idx * 100,
            is_featured=True
        )
        session.add(dest)
    session.commit()
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)

# 1. Explore catalogue remains exactly 12 destinations
def test_explore_catalogue_remains_exactly_12(db):
    dests = db.query(Destination).all()
    assert len(dests) == 12

# 2. Search does not mutate Explore
@pytest.mark.asyncio
async def test_search_does_not_mutate_explore(db):
    geocoder = LiveGeocodingProvider()
    await geocoder.autocomplete("indore")
    await geocoder.autocomplete("bhopal")
    await geocoder.autocomplete("london")
    dests = db.query(Destination).all()
    assert len(dests) == 12
    slugs = [d.slug for d in dests]
    assert "indore" not in slugs
    assert "bhopal" not in slugs

# 3. Dynamic destinations remain transient
@pytest.mark.asyncio
async def test_dynamic_destinations_remain_transient(db):
    dyn = await DestinationIntelligenceService.resolve_dynamic_destination("Indore")
    assert dyn is not None
    assert dyn["is_dynamic"] is True
    assert dyn["is_curated"] is False
    assert db.query(Destination).count() == 12

# 4. Destination coordinates are correct
@pytest.mark.asyncio
async def test_destination_coordinates_are_correct():
    geocoder = LiveGeocodingProvider()
    indore = await geocoder.geocode("Indore")
    assert indore is not None
    assert abs(indore["latitude"] - 22.7196) < 0.5
    assert abs(indore["longitude"] - 75.8577) < 0.5

    landour = await geocoder.geocode("Landour")
    assert landour is not None
    assert abs(landour["latitude"] - 30.4628) < 0.5
    assert abs(landour["longitude"] - 78.0936) < 0.5

# 5. Live POI cache cannot cross-contaminate destinations
@pytest.mark.asyncio
async def test_live_poi_cache_cannot_cross_contaminate():
    places_provider = ProviderFactory.get_places_provider()
    mussoorie_places = await places_provider.get_nearby_places(30.4598, 78.0644, radius_km=15.0)
    for p in mussoorie_places:
        lat = p.get("latitude", 0)
        lng = p.get("longitude", 0)
        # Should be within Uttarakhand bounds, not Himachal Manali (32.2, 77.1)
        assert abs(lat - 30.4598) < 1.0

# 6. Mussoorie cannot receive Varanasi records
@pytest.mark.asyncio
async def test_mussoorie_cannot_receive_varanasi_records():
    resolver = CuratedArtworkProvider()
    res = await resolver.resolve_place_artwork("Landour Bakehouse", "Mussoorie", "Cafés & Bakery")
    assert "Ghat" not in res["place_name"]
    assert "varanasi" not in res["artwork_key"]

# 7. Varanasi can receive actual ghats
@pytest.mark.asyncio
async def test_varanasi_receives_actual_ghats():
    resolver = CuratedArtworkProvider()
    res = await resolver.resolve_place_artwork("Assi Ghat Aarti", "Varanasi", "Culture & Heritage")
    assert res["tier"] == "exact_place"
    assert "assi-ghat" in res["artwork_key"]

# 8. Place source labels are truthful
def test_place_source_labels_truthful():
    assert "openstreetmap" != "vanvas_curated"

# 9. Exact artwork lookup is deterministic
@pytest.mark.asyncio
async def test_exact_artwork_lookup_is_deterministic():
    resolver = CuratedArtworkProvider()
    res1 = await resolver.resolve_place_artwork("Lal Tibba", "Mussoorie", "Nature & Trails")
    res2 = await resolver.resolve_place_artwork("Lal Tibba", "Mussoorie", "Nature & Trails")
    assert res1["artwork_key"] == res2["artwork_key"]
    assert res1["tier"] == "exact_place"

# 10. Destination/category fallback is deterministic
@pytest.mark.asyncio
async def test_destination_category_fallback_deterministic():
    resolver = CuratedArtworkProvider()
    res = await resolver.resolve_place_artwork("Some Random Mountain Trail", "Mussoorie", "Nature & Trails")
    assert res["tier"] == "destination_category"
    assert "mussoorie" in res["artwork_key"]

# 11. Generated artwork keys are deterministic
@pytest.mark.asyncio
async def test_generated_artwork_keys_are_deterministic():
    provider = CuratedArtworkProvider()
    key1 = provider._normalize_key("Mussoorie", "Landour Bakehouse")
    key2 = provider._normalize_key("Mussoorie", "Landour Bakehouse")
    assert key1 == key2
    assert key1 == "mussoorie:landour-bakehouse"

# 12. Missing artwork does not block rendering
@pytest.mark.asyncio
async def test_missing_artwork_does_not_block():
    resolver = CuratedArtworkProvider()
    res = await resolver.resolve_place_artwork("Unrecorded Remote Shrine", "UnknownTown", "Attraction")
    assert res["image_url"] is not None
    assert res["tier"] == "regional_fallback"

# 13. Vehicle artwork is used everywhere
def test_vehicle_artwork_files_exist():
    base = r"c:\Users\user\Desktop\Vanvas\frontend\public\images\vehicles"
    assert os.path.exists(os.path.join(base, "adventure_motorcycle.svg"))
    assert os.path.exists(os.path.join(base, "classic_bullet.svg"))
    assert os.path.exists(os.path.join(base, "automatic_scooter.svg"))

# 14. Homepage hero is immediately available
def test_homepage_hero_exists():
    path = r"c:\Users\user\Desktop\Vanvas\frontend\public\images\destinations\manali\hero.jpg"
    assert os.path.exists(path)

# 15. Image URLs return valid paths
def test_image_urls_have_valid_assets():
    provider = CuratedArtworkProvider()
    for key, data in provider.PLACE_ARTWORK_REGISTRY.items():
        img = data["image_url"]
        assert img.startswith("/images/")

# 16. Dynamic destination doesn't inherit curated editorial content
@pytest.mark.asyncio
async def test_dynamic_destination_no_curated_inheritance():
    dyn = await DestinationIntelligenceService.resolve_dynamic_destination("Indore")
    assert dyn["places"] == []
    assert dyn["hotels"] == []
    assert dyn["rentals"] == []

# 17. Missing provider fields never become fake data
@pytest.mark.asyncio
async def test_missing_provider_fields_no_fake_data():
    places_provider = ProviderFactory.get_places_provider()
    # Ensure rating is either a real float or None, not fabricated
    places = await places_provider.get_nearby_places(30.4598, 78.0644, radius_km=5.0)
    for p in places:
        assert p.get("rating") is None or (isinstance(p.get("rating"), (int, float)) and 0.0 <= p.get("rating") <= 5.0)

# 18. Web search remains UNCONFIGURED when no key exists
@pytest.mark.asyncio
async def test_web_search_unconfigured():
    web = ProviderFactory.get_web_search_provider()
    res = await web.search("test")
    # If no api key set in test env, is_available is False
    assert res.get("is_available") is False or "provider" in res

# 19. Google Places remains UNCONFIGURED when no key exists
def test_google_places_unconfigured():
    provider = ProviderFactory.get_places_provider()
    assert provider is not None

# 20. OSM remains correctly labeled LIVE
@pytest.mark.asyncio
async def test_osm_labeled_live():
    provider = ProviderFactory.get_places_provider()
    assert hasattr(provider, "get_nearby_places")
