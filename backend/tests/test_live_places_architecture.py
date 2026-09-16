import pytest
import pytest_asyncio
from app.providers.live_providers import LivePlacesProvider, HaversineRoutingProvider
from app.schemas.schemas import PlaceResponse, PlaceBase

@pytest.fixture
def places_provider():
    return LivePlacesProvider()

@pytest.fixture
def routing_provider():
    return HaversineRoutingProvider()

def test_place_schema_safe_normalization_missing_fields():
    """
    Verify PlaceBase and PlaceResponse handle missing/undefined optional fields safely without crashing.
    """
    # Minimum required fields
    minimal_data = {
        "destination_id": "dest-test",
        "name": "Mountain Vista Point",
        "slug": "mountain-vista-point",
        "latitude": 32.2396,
        "longitude": 77.1887,
    }
    
    # Should construct safely with defaults
    place_base = PlaceBase(**minimal_data)
    assert place_base.category == "Attractions"
    assert place_base.rating is None
    assert place_base.review_count is None
    assert place_base.source == "vanvas_curated"
    assert place_base.is_live is False
    assert place_base.distance_km is None

    # PlaceResponse with ID
    place_res = PlaceResponse(id="p-123", **minimal_data)
    assert place_res.id == "p-123"
    assert place_res.category == "Attractions"
    assert place_res.source == "vanvas_curated"

def test_haversine_distance_calculation(routing_provider):
    """
    Verify Haversine distance correctly calculates straight-line and mountain-adjusted distance.
    Manali Mall Road (32.2396, 77.1887) to Old Manali (32.2532, 77.1750) is ~2.0 km straight line.
    """
    dist_matrix = routing_provider.calculate_distance_matrix([
        {"lat": 32.2396, "lng": 77.1887},
        {"lat": 32.2532, "lng": 77.1750}
    ])
    assert len(dist_matrix) == 2
    assert dist_matrix[0][0]["distance_km"] == 0.0
    
    dist_between = dist_matrix[0][1]["distance_km"]
    assert 1.5 <= dist_between <= 4.0, f"Unexpected distance: {dist_between}"

@pytest.mark.asyncio
async def test_live_places_source_labeling_and_fallback(places_provider):
    """
    Verify LivePlacesProvider returns structured places with explicit source metadata and distance.
    """
    # Query Manali coordinates
    places = await places_provider.get_nearby_places(32.2396, 77.1887, radius_km=10.0)
    assert isinstance(places, list)
    assert len(places) > 0

    for p in places:
        assert "name" in p
        assert "latitude" in p
        assert "longitude" in p
        assert "category" in p
        assert "source" in p
        assert p["source"] in ["google_places", "openstreetmap", "vanvas_curated", "vanvas_fallback"]
        assert isinstance(p.get("is_live", False), bool)
        assert isinstance(p.get("distance_km", 0.0), (int, float))

@pytest.mark.asyncio
async def test_live_places_category_filter(places_provider):
    """
    Verify category filtering works safely and doesn't crash on unrecognized categories.
    """
    cafe_places = await places_provider.get_nearby_places(32.2396, 77.1887, radius_km=10.0, category="café")
    assert isinstance(cafe_places, list)
    
    unknown_places = await places_provider.get_nearby_places(32.2396, 77.1887, radius_km=10.0, category="unrecognized_category_xyz")
    assert isinstance(unknown_places, list)
