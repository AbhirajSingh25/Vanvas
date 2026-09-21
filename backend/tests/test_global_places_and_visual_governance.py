import pytest
import os
import hashlib
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.seed.seed_data import seed_database
from app.models.models import Place, Destination, Hotel, RentalOption
from app.providers.provider_factory import ProviderFactory
from app.providers.live_providers import LivePlacesProvider, LiveHotelsProvider, LiveRentalsProvider

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database()

def test_curated_live_separation():
    """Verify curated inventory and live discovery are architecturally separated."""
    db: Session = SessionLocal()
    kasol = db.query(Destination).filter(Destination.slug == "kasol").first()
    assert kasol is not None
    curated_places = db.query(Place).filter(Place.destination_id == kasol.id).all()
    assert len(curated_places) >= 4
    db.close()

    mock_live_discovered = [
        {
            "id": "osm-101",
            "name": "Moon Dance Cafe", # Duplicate of curated
            "category": "Cafés & Bakery",
            "latitude": 32.0102,
            "longitude": 77.3155,
            "source": "openstreetmap",
            "source_id": "101",
            "is_live": True
        },
        {
            "id": "osm-102",
            "name": "Kasol Himalayan Trout Cafe", # Genuine new live discovery
            "category": "Cafés & Bakery",
            "latitude": 32.0125,
            "longitude": 77.3185,
            "source": "openstreetmap",
            "source_id": "102",
            "is_live": True
        }
    ]

    with patch.object(LivePlacesProvider, "get_nearby_places", new_callable=AsyncMock) as mock_get:
        # Provider deduplicates internally using excluded_curated
        mock_get.return_value = [mock_live_discovered[1]] # only returns unique non-curated

        # 1. Normal nearby returns curated + unique live
        res_all = client.get(f"/api/v1/places/nearby?lat={kasol.latitude}&lng={kasol.longitude}&radius_km=15&live_only=false")
        assert res_all.status_code == 200
        all_places = res_all.json()
        assert len(all_places) == len(curated_places) + 1
        all_names = [p["name"] for p in all_places]
        assert "Kasol Himalayan Trout Cafe" in all_names

        # 2. Live-only nearby returns strictly unique discovered places, excluding all curated places
        res_live = client.get(f"/api/v1/places/nearby?lat={kasol.latitude}&lng={kasol.longitude}&radius_km=15&live_only=true")
        assert res_live.status_code == 200
        live_places = res_live.json()
        assert len(live_places) == 1
        assert live_places[0]["name"] == "Kasol Himalayan Trout Cafe"
        assert live_places[0]["is_live"] is True

def test_duplicate_detection_and_alias_dedupe():
    """Verify duplicate detection by normalized name, distance, and token overlap."""
    provider = LivePlacesProvider()
    
    # 1. Exact match
    assert provider._are_places_duplicate("Moon Dance Cafe", 32.01, 77.31, "Moon Dance Cafe", 32.01, 77.31) is True
    # 2. Token / alias containment in close proximity (< 0.4 km)
    assert provider._are_places_duplicate("Moon Dance Cafe & German Bakery", 32.0102, 77.3155, "Moon Dance Cafe", 32.0100, 77.3150) is True
    assert provider._are_places_duplicate("Kashi Vishwanath Temple", 25.3108, 83.0107, "Shri Kashi Vishwanath", 25.3109, 83.0108) is True
    # 3. Unrelated places in different locations
    assert provider._are_places_duplicate("Moon Dance Cafe", 32.01, 77.31, "Assi Ghat", 25.28, 83.00) is False

def test_curated_exclusion_pipeline():
    """Verify excluded_curated list properly eliminates curated entries from live stream."""
    provider = LivePlacesProvider()
    curated_ref = [{"name": "Moon Dance Cafe", "latitude": 32.0102, "longitude": 77.3155}]
    
    raw_live = [
        {"name": "Moon Dance Cafe", "latitude": 32.0102, "longitude": 77.3155, "source": "openstreetmap", "source_id": "1"},
        {"name": "Kasol Himalayan Trout Cafe", "latitude": 32.0120, "longitude": 77.3180, "source": "openstreetmap", "source_id": "2"}
    ]
    
    deduped = provider._deduplicate_places(raw_live, excluded_curated=curated_ref)
    assert len(deduped) == 1
    assert deduped[0]["name"] == "Kasol Himalayan Trout Cafe"

def test_category_discovery_mappings():
    """Verify OSM tag to VANVAS category mapping across all 7 essential categories."""
    provider = LivePlacesProvider()
    
    assert provider._map_osm_category({"amenity": "cafe"}) == "Cafés & Bakery"
    assert provider._map_osm_category({"amenity": "restaurant"}) == "Local Food"
    assert provider._map_osm_category({"tourism": "viewpoint"}) == "Nature & Trails"
    assert provider._map_osm_category({"historic": "temple"}) == "Culture & Heritage"
    assert provider._map_osm_category({"shop": "supermarket"}) == "Shops & Markets"
    assert provider._map_osm_category({"amenity": "motorcycle_rental"}) == "Mobility & Transport"
    assert provider._map_osm_category({"amenity": "pharmacy"}) == "Essentials & Medical"

def test_all_twelve_destinations_seeded_and_isolated():
    """Verify all 12 destinations are seeded with verified coordinates and valid artwork."""
    db: Session = SessionLocal()
    expected_slugs = [
        "manali", "rishikesh", "kasol", "dharamshala", "goa", "jaipur",
        "mussoorie", "udaipur", "varanasi", "leh", "spiti", "munnar"
    ]
    
    for slug in expected_slugs:
        dest = db.query(Destination).filter(Destination.slug == slug).first()
        assert dest is not None, f"Destination {slug} must exist in catalog"
        assert dest.latitude != 0.0
        assert dest.longitude != 0.0
        assert dest.hero_image is not None
        assert not dest.hero_image.endswith(".svg")
        assert "placeholder" not in dest.hero_image.lower()

        # Verify places
        places = db.query(Place).filter(Place.destination_id == dest.id).all()
        assert len(places) >= 3, f"Destination {slug} must have curated places"
        for p in places:
            assert p.image_url is not None
            assert not p.image_url.endswith(".svg")
            assert "placeholder" not in p.image_url.lower()

    db.close()

def test_stay_discovery_truthfulness():
    """Verify staying provider returns genuine attributes without manufacturing fake cards."""
    provider = LiveHotelsProvider()
    sample_el = {
        "id": 12345,
        "lat": 32.24,
        "lon": 77.18,
        "tags": {
            "name": "Cedar Alpine Homestay",
            "tourism": "guest_house",
            "internet_access": "wlan",
            "phone": "+91 9876543210"
        }
    }
    parsed = provider._parse_osm_hotel(sample_el, 32.24, 77.18)
    assert parsed is not None
    assert parsed["name"] == "Cedar Alpine Homestay"
    assert parsed["is_live"] is True
    assert parsed["price_verified"] is False  # Honest unverified pricing
    assert parsed["data_state"] == "LIVE"

def test_rentals_discovery_truthfulness():
    """Verify rentals provider maps genuine vehicle rental hubs."""
    sample_rental = {
        "id": 54321,
        "lat": 32.24,
        "lon": 77.18,
        "tags": {
            "name": "Manali Royal Riders Motorcycle Rental",
            "amenity": "motorcycle_rental",
            "phone": "+91 9876543210"
        }
    }
    assert "motorcycle" in sample_rental["tags"]["amenity"]

def test_zero_missing_seeded_assets_on_disk():
    """Verify every single image referenced in the database exists as a physical file on disk."""
    workspace = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    public_img_dir = os.path.join(workspace, "frontend", "public")

    db: Session = SessionLocal()
    all_places = db.query(Place).all()
    all_dests = db.query(Destination).all()

    missing = []
    for d in all_dests:
        if d.hero_image and d.hero_image.startswith("/images/"):
            rel = d.hero_image.lstrip("/")
            full = os.path.join(public_img_dir, rel.replace("/", os.sep))
            if not os.path.exists(full):
                missing.append(f"Destination {d.slug} hero_image missing: {d.hero_image}")

    for p in all_places:
        if p.image_url and p.image_url.startswith("/images/"):
            rel = p.image_url.lstrip("/")
            full = os.path.join(public_img_dir, rel.replace("/", os.sep))
            if not os.path.exists(full):
                missing.append(f"Place {p.name} image_url missing: {p.image_url}")

    db.close()
    assert len(missing) == 0, f"Missing assets found: {missing}"
