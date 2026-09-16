import pytest
import pytest_asyncio
from app.providers.geocoding_provider import LiveGeocodingProvider, SEED_DESTINATIONS
from app.services.destination_intelligence import DestinationIntelligenceService
from app.database.session import SessionLocal
from app.models.models import Destination

@pytest.fixture
def geocoder():
    return LiveGeocodingProvider()

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.mark.asyncio
async def test_search_indore_resolves_to_city_not_country(geocoder):
    """
    Critical requirement: 'indore' must resolve to Indore, Madhya Pradesh, NOT India.
    """
    res = await geocoder.geocode("indore")
    assert res is not None, "Geocoding for 'indore' returned None"
    assert "indore" in res["name"].lower() or "indore" in res["slug"].lower()
    assert res["name"].lower() != "india", "Indore was incorrectly resolved to country 'India'"
    assert res.get("state") is not None
    assert "madhya" in res.get("state", "").lower() or "india" in res.get("country", "").lower()

@pytest.mark.asyncio
async def test_search_seeded_destinations(geocoder):
    """
    Test standard Indian & Himalayan destinations resolve with accurate metadata.
    """
    test_cases = [
        ("manali", "Manali", "Himachal Pradesh"),
        ("mussoorie", "Mussoorie", "Uttarakhand"),
        ("udaipur", "Udaipur", "Rajasthan"),
        ("rishikesh", "Rishikesh", "Uttarakhand"),
        ("jaipur", "Jaipur", "Rajasthan"),
        ("goa", "Goa", "Goa"),
        ("varanasi", "Varanasi", "Uttar Pradesh"),
        ("leh", "Leh Ladakh", "Ladakh"),
        ("spiti", "Spiti Valley", "Himachal Pradesh"),
        ("delhi", "Delhi", "Delhi"),
        ("mumbai", "Mumbai", "Maharashtra"),
        ("bangalore", "Bengaluru", "Karnataka"),
    ]

    for query, expected_name, expected_state in test_cases:
        res = await geocoder.geocode(query)
        assert res is not None, f"Failed to geocode '{query}'"
        assert expected_name.lower() in res["name"].lower() or res["name"].lower() in expected_name.lower() or query in res["slug"].lower()
        if expected_state:
            assert expected_state.lower() in res.get("state", "").lower() or expected_state.lower() in res.get("region", "").lower() or expected_state.lower() in res.get("display_name", "").lower()

@pytest.mark.asyncio
async def test_search_international_cities_matrix(geocoder):
    """
    Test major international destinations: new york, london, paris, dubai, bali.
    """
    international_cases = ["new york", "london", "paris", "dubai", "bali"]
    for city in international_cases:
        res = await geocoder.geocode(city)
        assert res is not None, f"Failed to geocode international destination '{city}'"
        assert city in res["name"].lower() or city in res["slug"].lower() or city in res.get("display_name", "").lower()

@pytest.mark.asyncio
async def test_search_ambiguous_names(geocoder):
    """
    Test ambiguous queries (e.g., 'springfield', 'victoria', 'aurora', 'santiago') resolve gracefully with structured fields.
    """
    for amb in ["springfield", "victoria", "santiago"]:
        results = await geocoder.autocomplete(amb, limit=3)
        assert isinstance(results, list)
        if len(results) > 0:
            top = results[0]
            assert "name" in top
            assert "latitude" in top
            assert "longitude" in top
            assert "source" in top

@pytest.mark.asyncio
async def test_search_autocomplete_ranking(geocoder):
    """
    Autocomplete should rank exact/prefix city matches ahead of generic broad matches.
    """
    results = await geocoder.autocomplete("indore", limit=5)
    assert len(results) > 0
    top = results[0]
    assert "indore" in top["name"].lower()
    assert top["name"].lower() != "india"

@pytest.mark.asyncio
async def test_search_empty_and_unknown_queries(geocoder):
    """
    Verify empty and invalid queries handle gracefully.
    """
    empty_res = await geocoder.geocode("")
    assert empty_res is None

    empty_auto = await geocoder.autocomplete("")
    assert len(empty_auto) > 0  # Returns seed destinations default

@pytest.mark.asyncio
async def test_destination_intelligence_db_resolution(db_session):
    """
    Verify DestinationIntelligenceService resolves existing and newly queried destinations without collision.
    """
    dest = await DestinationIntelligenceService.resolve_destination("manali", db_session)
    assert dest is not None
    assert dest.slug == "manali"
    assert dest.name == "Manali"
