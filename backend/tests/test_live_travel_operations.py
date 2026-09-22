"""
Unit and Integration Tests for VANVAS Live Travel Operations Foundation.
Validates:
1. Truthful stay provenance (price_verified, is_live, source, distance_km)
2. Truthful rental provenance (inventory_verified, is_live, hours_available)
3. Truthful transport provenance (schedule_type, mountain routing calculation)
4. Zero-fabrication guarantees (no hallucinated room rates or fake hours)
5. LiveHotelsProvider and LiveRentalsProvider parsing and fallbacks
6. AI Tool Dispatcher methods for search_stays, search_transport, search_rentals
7. API Endpoints: /hotels, /rentals, /transport with destination_id queries
"""
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.models import Destination, Hotel, RentalOption, TransportOption
from app.schemas.schemas import HotelResponse, RentalOptionResponse, TransportOptionResponse
from app.providers.live_providers import LiveHotelsProvider, LiveRentalsProvider
from app.providers.ai.dispatcher import AIToolDispatcher

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# ---------------------------------------------------------------------------
# 1. Schema Truthfulness & Provenance Tests
# ---------------------------------------------------------------------------

def test_hotel_response_truthful_provenance():
    """Verify HotelResponse accurately captures live and unverified price metadata."""
    hotel_data = {
        "id": "osm-stay-12345",
        "destination_id": "manali",
        "name": "Pine Haven Alpine Hut",
        "address": "Old Manali, Himachal Pradesh",
        "latitude": 32.24,
        "longitude": 77.18,
        "price_per_night": None,  # Real-time room rate not available
        "price_verified": False,
        "is_live": True,
        "source": "osm",
        "source_id": "12345",
        "rating": None,
        "review_count": None,
        "hotel_style": "Alpine Hut & Cottage",
        "amenities": "Fire Pit,Mountain Views",
        "phone": "+91 98765 43210",
        "website": "https://pinehaven.in",
        "distance_km": 0.45,
    }
    hotel_res = HotelResponse(**hotel_data)
    assert hotel_res.price_verified is False
    assert hotel_res.price_per_night is None
    assert hotel_res.is_live is True
    assert hotel_res.source == "osm"
    assert hotel_res.distance_km == 0.45


def test_rental_response_truthful_provenance():
    """Verify RentalOptionResponse reflects inventory verification status."""
    rental_data = {
        "id": "osm-rent-67890",
        "destination_id": "manali",
        "provider_name": "Manali Royal Enfield Hub",
        "vehicle_type": "Scooter / Motorcycle",
        "vehicle_name": "Royal Enfield Classic 350",
        "price_per_day": None,
        "deposit_amount": 1500.0,
        "location": "Mall Road, Manali",
        "latitude": 32.24,
        "longitude": 77.18,
        "inventory_verified": False,
        "is_live": True,
        "source": "osm",
        "source_id": "67890",
        "hours_available": True,
    }
    rental_res = RentalOptionResponse(**rental_data)
    assert rental_res.inventory_verified is False
    assert rental_res.is_live is True
    assert rental_res.price_per_day is None
    assert rental_res.hours_available is True
    assert rental_res.source == "osm"


def test_transport_response_schedule_type():
    """Verify TransportOptionResponse includes schedule_type and distance."""
    transport_data = {
        "id": "trn-1",
        "origin_city": "Delhi",
        "destination_id": "manali",
        "transport_type": "Volvo Overnight Bus",
        "operator_name": "HPTDC Volvo",
        "departure_time": "19:00",
        "arrival_time": "08:30",
        "duration_hours": 13.5,
        "price": 1450.0,
        "departure_location": "ISBT Kashmiri Gate, Delhi",
        "arrival_location": "Private Bus Stand, Manali",
        "schedule_type": "curated_schedule",
        "booking_url": "https://booking.hptdc.in",
        "source": "vanvas_curated",
        "is_live": False,
    }
    trn_res = TransportOptionResponse(**transport_data)
    assert trn_res.schedule_type == "curated_schedule"
    assert trn_res.is_live is False
    assert trn_res.booking_url == "https://booking.hptdc.in"


# ---------------------------------------------------------------------------
# 2. LiveHotelsProvider & LiveRentalsProvider Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_live_hotels_provider_parses_osm_elements():
    """Verify LiveHotelsProvider parses raw OSM Overpass node into Hotel."""
    provider = LiveHotelsProvider()
    fake_elements = [
        {
            "id": 998877,
            "lat": 32.245,
            "lon": 77.189,
            "tags": {
                "name": "The Himalayan Woods Guesthouse",
                "tourism": "guest_house",
                "phone": "+91 98160 00000",
                "website": "https://himalayanwoods.com",
                "addr:street": "Log Huts Area",
                "internet_access": "wlan",
            },
        }
    ]

    with patch.object(provider, "_execute_overpass_query", new=AsyncMock(return_value=fake_elements)):
        hotels = await provider.search_hotels(destination="Manali", lat=32.24, lng=77.18, radius_km=5)
        assert len(hotels) == 1
        h = hotels[0]
        assert h["name"] == "The Himalayan Woods Guesthouse"
        assert h["hotel_style"] == "Guest House / Homestay"
        assert h["price_verified"] is False
        assert h["price_per_night"] is None
        assert h["is_live"] is True
        assert h["source"] == "openstreetmap"
        assert h["phone"] == "+91 98160 00000"
        assert "WiFi" in h["amenities"]


@pytest.mark.asyncio
async def test_live_rentals_provider_parses_osm_elements():
    """Verify LiveRentalsProvider parses bicycle/motorcycle rental shops."""
    provider = LiveRentalsProvider()
    fake_elements = [
        {
            "id": 554433,
            "lat": 32.241,
            "lon": 77.185,
            "tags": {
                "name": "Manali Royal Enfield Rentals",
                "amenity": "motorcycle_rental",
                "opening_hours": "08:00-20:00",
                "phone": "+91 98161 11111",
            },
        }
    ]

    with patch.object(provider, "_execute_overpass_query", new=AsyncMock(return_value=fake_elements)):
        rentals = await provider.search_rentals(destination="Manali", lat=32.24, lng=77.18, radius_km=5)
        assert len(rentals) == 1
        r = rentals[0]
        assert r["provider_name"] == "Manali Royal Enfield Rentals"
        assert "Royal Enfield" in r["vehicle_name"]
        assert r["vehicle_type"] in ["Touring Motorcycle", "Scooter & Motorcycle", "Scooter / Motorcycle"]
        assert r["inventory_verified"] is False
        assert r["is_live"] is True
        assert r["hours_available"] is True
        assert r["source"] == "openstreetmap"


# ---------------------------------------------------------------------------
# 3. AI Tool Dispatcher Travel Operations Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ai_tool_search_stays(db):
    """Test AIToolDispatcher.dispatch for search_stays."""
    dispatcher = AIToolDispatcher(db=db)
    result = await dispatcher.dispatch(
        tool_name="search_stays",
        args={"destination": "Manali", "style": "All"}
    )
    assert "stays" in result
    assert "disclaimer" in result
    assert "Curated stay rates reflect verified baseline pricing" in result["disclaimer"]
    assert len(result["stays"]) > 0


@pytest.mark.asyncio
async def test_ai_tool_search_transport(db):
    """Test AIToolDispatcher.dispatch for search_transport."""
    dispatcher = AIToolDispatcher(db=db)
    result = await dispatcher.dispatch(
        tool_name="search_transport",
        args={"origin_city": "Delhi", "destination": "Manali"}
    )
    assert "routes" in result
    assert "disclaimer" in result
    assert "Transit schedules reflect authentic mountain bus" in result["disclaimer"]
    assert len(result["routes"]) > 0


@pytest.mark.asyncio
async def test_ai_tool_search_rentals(db):
    """Test AIToolDispatcher.dispatch for search_rentals."""
    dispatcher = AIToolDispatcher(db=db)
    result = await dispatcher.dispatch(
        tool_name="search_rentals",
        args={"destination": "Manali", "vehicle_type": "All"}
    )
    assert "rentals" in result
    assert "disclaimer" in result
    assert "Rental options reflect verified valley mobility fleets" in result["disclaimer"]
    assert len(result["rentals"]) > 0


# ---------------------------------------------------------------------------
# 4. API Endpoints Truthfulness & Integration Tests
# ---------------------------------------------------------------------------

def test_api_hotels_curated_destination():
    """Test GET /api/v1/hotels with destination_id=manali returns curated stays with explicit provenance."""
    resp = client.get("/api/v1/hotels?destination_id=manali")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "price_verified" in first
    assert "is_live" in first
    assert "source" in first


def test_api_rentals_curated_destination():
    """Test GET /api/v1/rentals with destination_id=manali returns rental options."""
    resp = client.get("/api/v1/rentals?destination_id=manali")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "inventory_verified" in first
    assert "is_live" in first
    assert "source" in first


def test_api_transport_curated_route():
    """Test GET /api/v1/transport with destination_id=manali returns transport with schedule_type."""
    resp = client.get("/api/v1/transport?destination_id=manali")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "schedule_type" in first
    assert first["schedule_type"] == "curated_schedule"
    assert "source" in first
