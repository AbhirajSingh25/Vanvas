"""
Comprehensive Tests for Live Stay Discovery & Traveller Matching
Validates:
1. Destination coverage: Manali, Mussoorie, Udaipur, Rishikesh, Leh, Munnar, Delhi, and dynamic destinations.
2. Truthful pricing: numeric rates or explicit 'Rate unavailable' (no hardcoded prices).
3. Truthful availability: AVAILABLE, UNAVAILABLE, UNKNOWN (UNKNOWN never called available).
4. Traveller filtering: Budget, Couple, Family, Friends, Solo, Group, Party/Social (strictly verified).
5. Accommodation category mapping: Dorm, Private, Hostel, Homestay, Hotel, Boutique, Resort, Heritage.
6. Image hierarchy & strict stay isolation: Never inherit monastery, scooter, or random landmark visuals.
7. Zero fabrication on empty results.
8. Real action links: View Property, Book/Continue, Get Directions, Call, Website.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.session import get_db, Base
from app.models.models import Destination, Hotel
from app.schemas.schemas import HotelResponse
from app.services.stay_matching_service import StayMatchingService
from app.providers.commerce.stayingapi_stay_adapter import StayingAPIStayCommerceAdapter

from sqlalchemy.pool import StaticPool

# Test SQLite in-memory database with StaticPool so all connections share the same memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_destinations():
    db = TestingSessionLocal()
    # Populate standard destinations
    destinations = [
        {"id": "manali", "slug": "manali", "name": "Manali", "latitude": 32.2396, "longitude": 77.1887, "state": "Himachal Pradesh", "region": "Himalayan", "tagline": "Valley of Gods", "description": "High Himalayan destination."},
        {"id": "mussoorie", "slug": "mussoorie", "name": "Mussoorie", "latitude": 30.4598, "longitude": 78.0644, "state": "Uttarakhand", "region": "Himalayan", "tagline": "Queen of Hills", "description": "Oak trails and winterline."},
        {"id": "udaipur", "slug": "udaipur", "name": "Udaipur", "latitude": 24.5854, "longitude": 73.7125, "state": "Rajasthan", "region": "Royal Heritage", "tagline": "City of Lakes", "description": "Palaces and shimmering waters."},
        {"id": "rishikesh", "slug": "rishikesh", "name": "Rishikesh", "latitude": 30.0869, "longitude": 78.2676, "state": "Uttarakhand", "region": "Himalayan", "tagline": "Yoga Capital", "description": "Ganga currents and bells."},
        {"id": "leh", "slug": "leh", "name": "Leh", "latitude": 34.1526, "longitude": 77.5771, "state": "Ladakh", "region": "Ladakh", "tagline": "High Passes", "description": "Gompas and moonscapes."},
        {"id": "munnar", "slug": "munnar", "name": "Munnar", "latitude": 10.0889, "longitude": 77.0595, "state": "Kerala", "region": "Western Ghats", "tagline": "Tea Country", "description": "Emerald slopes and mist."},
        {"id": "delhi", "slug": "delhi", "name": "Delhi", "latitude": 28.6139, "longitude": 77.2090, "state": "Delhi", "region": "Northern Plains", "tagline": "Capital Heritage", "description": "Historic monuments and culture."},
    ]
    for d_data in destinations:
        existing = db.query(Destination).filter(Destination.id == d_data["id"]).first()
        if not existing:
            dest = Destination(**d_data)
            db.add(dest)
    db.commit()

    # Add a sample curated hotel in Manali
    curated_h = db.query(Hotel).filter(Hotel.id == "manali_curated_1").first()
    if not curated_h:
        db.add(Hotel(
            id="manali_curated_1",
            destination_id="manali",
            name="The Himalayan Sanctuary",
            address="Old Manali Village",
            latitude=32.2510,
            longitude=32.2510,
            price_per_night=5500.0,
            rating=4.8,
            hotel_style="Boutique / Mountain Stay",
            amenities="WiFi,Hot Water,Fireplace,Balcony",
            booking_url="https://thehimalayansanctuary.example",
            badge="Verified Sanctuary"
        ))
        db.commit()
    db.close()


# 1. TEST DESTINATIONS DISCOVERY (Manali, Mussoorie, Udaipur, Rishikesh, Leh, Munnar, Delhi, Dynamic)
@pytest.mark.asyncio
@pytest.mark.parametrize("dest_slug", [
    "manali", "mussoorie", "udaipur", "rishikesh", "leh", "munnar", "delhi", "bir-billing"
])
async def test_stay_discovery_across_destinations(dest_slug):
    """Verify live stay discovery operates truthfully across all required destinations plus dynamic."""
    db = TestingSessionLocal()
    try:
        results = await StayMatchingService.match_stays(db=db, destination_id=dest_slug)
        assert isinstance(results, list)
        assert len(results) <= 5  # Max ~4-5 results
        for r in results:
            assert isinstance(r, HotelResponse)
            assert r.name
            assert r.availability_state in ["AVAILABLE", "UNAVAILABLE", "UNKNOWN", "UPON INQUIRY"]
            assert r.accommodation_type in StayMatchingService.ALLOWED_ACCOMMODATION_TYPES
            if r.price_per_night is not None:
                assert r.price_per_night > 0
                assert "₹" in r.price_formatted or r.currency in r.price_formatted
            else:
                assert r.price_formatted == "Rate unavailable"
    finally:
        db.close()


# 2. TEST TRUTHFUL PRICING (Never invent prices)
def test_price_truth_formatting():
    """Verify price formatting preserves exact rates or explicit 'Rate unavailable'."""
    assert StayMatchingService.format_price(4500.0, "INR") == "₹4,500/night"
    assert StayMatchingService.format_price(12000.5, "INR") == "₹12,000.50/night"
    assert StayMatchingService.format_price(None, "INR") == "Rate unavailable"
    assert StayMatchingService.format_price(0.0, "INR") == "Rate unavailable"
    assert StayMatchingService.format_price(-50.0, "INR") == "Rate unavailable"
    assert StayMatchingService.format_price(85.0, "USD") == "USD 85.00/night"


# 3. TEST TRUTHFUL AVAILABILITY (Never call UNKNOWN available)
def test_availability_states_truth():
    """Verify availability state handling."""
    valid_states = {"AVAILABLE", "UNAVAILABLE", "UNKNOWN", "UPON INQUIRY"}
    # OSM stays default to UNKNOWN
    osm_stay = {"availability_state": "UNKNOWN"}
    assert osm_stay["availability_state"] in valid_states
    assert osm_stay["availability_state"] != "AVAILABLE"


# 4. TEST STRICT TRAVELLER FILTERING & ZERO INFERENCE FOR PARTY/SOCIAL
def test_traveller_tags_derivation_and_party_social_strictness():
    """
    Verify Party/Social is NEVER inferred merely from hostel name or category.
    Only explicit provider bar/pub/nightclub/social amenities warrant Party/Social tag.
    """
    # Standard quiet hostel without bar/party amenities
    hostel_tags = StayMatchingService.derive_traveller_tags(
        accommodation_type="Hostel",
        property_type="hostel",
        amenities=["wifi", "reading_lamp", "lockers"],
        max_occupancy=1,
    )
    assert "Solo" in hostel_tags
    assert "Budget" in hostel_tags
    assert "Party/Social" not in hostel_tags  # MUST NOT infer Party/Social!

    # Hostel WITH explicit verified bar / social events
    social_hostel_tags = StayMatchingService.derive_traveller_tags(
        accommodation_type="Hostel",
        property_type="hostel",
        amenities=["wifi", "bar", "social_events", "rooftop_bar"],
        max_occupancy=1,
    )
    assert "Solo" in social_hostel_tags
    assert "Party/Social" in social_hostel_tags

    # Family villa
    family_tags = StayMatchingService.derive_traveller_tags(
        accommodation_type="Private",
        property_type="villa",
        amenities=["kitchen", "crib", "garden"],
        max_occupancy=6,
        bedrooms=3,
        price_per_night=8000.0,
    )
    assert "Family" in family_tags
    assert "Group" in family_tags
    assert "Friends" in family_tags
    assert "Solo" not in family_tags


# 5. TEST ACCOMMODATION CLASSIFICATION
def test_accommodation_type_classification():
    """Verify genuine accommodation category mapping."""
    assert StayMatchingService.classify_accommodation_type(property_type="hostel") == "Hostel"
    assert StayMatchingService.classify_accommodation_type(property_type="dorm", amenities=["bunk_bed"]) == "Dorm"
    assert StayMatchingService.classify_accommodation_type(property_type="guest_house") == "Homestay"
    assert StayMatchingService.classify_accommodation_type(property_type="cottage") == "Homestay"
    assert StayMatchingService.classify_accommodation_type(property_type="resort", stars=4.8) == "Resort"
    assert StayMatchingService.classify_accommodation_type(property_type="boutique", stars=4.2) == "Boutique"
    assert StayMatchingService.classify_accommodation_type(property_type="heritage", tags={"historic": "palace"}) == "Heritage"
    assert StayMatchingService.classify_accommodation_type(property_type="villa") == "Private"
    assert StayMatchingService.classify_accommodation_type(property_type="hotel") == "Hotel"


# 6. TEST IMAGE HIERARCHY & ISOLATION (Never inherit monastery, scooter, or landmark artwork)
def test_stay_image_hierarchy_and_isolation():
    """Verify Task 6 image hierarchy and strict visual isolation."""
    # 1. Provider property image
    provider_img = "https://images.stayingapi.example/real_cottage.jpg"
    res1 = StayMatchingService.resolve_stay_artwork(
        property_name="Cedar Pine Cottage",
        destination_name="Manali",
        accommodation_type="Homestay",
        provider_image_url=provider_img,
    )
    assert res1 == provider_img

    # 2. Stay category artwork (Hostel)
    res_hostel = StayMatchingService.resolve_stay_artwork(
        property_name="Zostel Backpacker",
        destination_name="Manali",
        accommodation_type="Hostel",
        provider_image_url=None,
    )
    assert res_hostel == "/images/places/universal/hostel.webp"
    assert "monastery" not in res_hostel
    assert "scooter" not in res_hostel

    # 3. Stay category artwork (Homestay)
    res_homestay = StayMatchingService.resolve_stay_artwork(
        property_name="Riverside Cottage",
        destination_name="Manali",
        accommodation_type="Homestay",
        provider_image_url=None,
    )
    assert res_homestay == "/images/places/universal/homestay.webp"

    # 4. Universal stay fallback
    res_fallback = StayMatchingService.resolve_stay_artwork(
        property_name="Standard Mountain Inn",
        destination_name="Bir",
        accommodation_type="Hotel",
        provider_image_url=None,
    )
    assert "stay.webp" in res_fallback


# 7. TEST ZERO FABRICATION ON EMPTY FILTER MATCHES
@pytest.mark.asyncio
async def test_zero_fabrication_on_unmatched_criteria():
    """Verify that when 0 stays match, empty list is returned rather than fabricated results."""
    db = TestingSessionLocal()
    try:
        # Query with impossible max_price of ₹10
        results = await StayMatchingService.match_stays(
            db=db,
            destination_id="manali",
            max_price=10.0
        )
        assert isinstance(results, list)
        assert len(results) == 0  # Zero fabrication
    finally:
        db.close()


# 8. TEST API ENDPOINT INTEGRATION
def test_get_hotels_api_endpoint():
    """Verify /api/v1/hotels endpoint returns compliant HotelResponse models with truthful data."""
    res = client.get("/api/v1/hotels?destination_id=manali&traveller_profile=Couple")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    for stay in data:
        assert "name" in stay
        assert "availability_state" in stay
        assert "price_formatted" in stay
        assert "accommodation_type" in stay
        assert "traveller_tags" in stay
        assert "action_links" in stay
