"""
Universal Destination & Dynamic Planning Test Suite
Validates universal destination resolution across India, non-curated live discovery,
StayingAPI integration for arbitrary cities, weather resolution, itinerary generation,
and Copilot destination context without fallback to unrelated destinations.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime, timezone, date, timedelta

from app.main import app
from app.database.session import get_db, Base, engine, SessionLocal
from app.models.models import User, Destination, Place, Trip
from app.services.destination_intelligence import DestinationIntelligenceService
from app.providers.geocoding_provider import LiveGeocodingProvider
from app.providers.commerce.stayingapi_stay_adapter import StayingAPIStayCommerceAdapter
from app.providers.ai.dispatcher import AIToolDispatcher
from app.services.copilot_context import build_copilot_context

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_user(db_session):
    user = db_session.query(User).filter(User.email == "universal_test@vanvas.com").first()
    if not user:
        user = User(
            email="universal_test@vanvas.com",
            hashed_password="mockhashedpassword",
            full_name="Universal Voyager",
            role="traveller",
            email_verified_at=datetime.now(timezone.utc),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user


# 1. Curated destination resolves
@pytest.mark.asyncio
async def test_curated_destination_resolves(db_session):
    dest = await DestinationIntelligenceService.resolve_destination("manali", db_session)
    assert dest is not None
    assert dest.slug == "manali"
    assert dest.name == "Manali"


# 2. Non-curated cities resolve dynamically across India
@pytest.mark.asyncio
async def test_non_curated_cities_resolve():
    cities = ["Delhi", "Pune", "Kolkata", "Ayodhya", "Varanasi"]
    for city in cities:
        dyn = await DestinationIntelligenceService.resolve_dynamic_destination(city)
        assert dyn is not None, f"Failed to resolve {city}"
        assert dyn["is_curated"] is False
        assert dyn["is_dynamic"] is True
        assert dyn["latitude"] is not None
        assert dyn["longitude"] is not None
        assert city.lower() in dyn["name"].lower() or city.lower() in dyn["slug"].lower()
        assert dyn["state"] is not None


# 3. Unknown destination fails truthfully without fake coordinates
@pytest.mark.asyncio
async def test_unknown_destination_fails_truthfully():
    with patch.object(LiveGeocodingProvider, "geocode", new=AsyncMock(return_value=None)):
        dyn = await DestinationIntelligenceService.resolve_dynamic_destination("CompletelyNonExistentPlaceXYZ99999")
        assert dyn is None

    resp = client.post("/api/v1/destinations/resolve?query=CompletelyNonExistentPlaceXYZ99999")
    assert resp.status_code == 404


# 4. Search autocomplete returns arbitrary Indian destinations
def test_destination_search_autocomplete():
    resp = client.get("/api/v1/destinations/search?q=delhi")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert any("delhi" in item.get("name", "").lower() or "delhi" in item.get("slug", "").lower() for item in data)


# 5. Destination resolve API endpoint works for arbitrary destinations
def test_destination_resolve_api_endpoint():
    resp = client.post("/api/v1/destinations/resolve?query=Pune")
    assert resp.status_code == 200
    data = resp.json()
    assert "pune" in data["name"].lower() or "pune" in data["slug"].lower()
    assert data["is_curated"] is False
    assert data["latitude"] is not None
    assert data["longitude"] is not None


# 6. Destination detail for non-curated destination returns live intelligence
def test_destination_detail_dynamic():
    resp = client.get("/api/v1/destinations/delhi")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_curated"] is False
    assert data["is_dynamic"] is True
    dest = data["destination"]
    assert "delhi" in dest["name"].lower() or "delhi" in dest["slug"].lower()
    assert dest["latitude"] is not None
    assert dest["longitude"] is not None


# 7. Live places work for non-curated destination
def test_destination_places_dynamic():
    resp = client.get("/api/v1/destinations/pune/places")
    assert resp.status_code == 200
    data = resp.json()
    # Should return a list (either live POIs or empty if external rate-limited, but HTTP 200)
    assert isinstance(data, list)


# 8. Universal StayingAPI works for arbitrary destination
def test_stayingapi_arbitrary_destination():
    adapter = StayingAPIStayCommerceAdapter(api_key="stay_test_key_mock")
    mock_search_data = {
        "data": [
            {
                "id": "stays_vrbo_delhi_101",
                "platform": "vrbo",
                "platformListingId": "delhi_101",
                "name": "Heritage Haveli Suite Delhi",
                "location": {"city": "Delhi", "lat": 28.6500, "lng": 77.2300},
                "price": {"nightlyPrice": 3800.0, "currency": "INR", "url": "https://vrbo.com/delhi_101"}
            }
        ]
    }
    with patch("httpx.AsyncClient.get", return_value=MagicMock(status_code=200, json=lambda: mock_search_data)):
        offers = adapter.search_offers(destination="Delhi", product_type="stay")
        assert len(offers) == 1
        assert offers[0].title == "Heritage Haveli Suite Delhi"
        assert offers[0].destination == "Delhi"
        assert offers[0].price == 3800.0
        assert offers[0].booking_capability == "EXTERNAL_CHECKOUT"
        assert offers[0].deep_link == "https://vrbo.com/delhi_101"


# 9. Universal weather works for arbitrary destination
@pytest.mark.asyncio
async def test_weather_arbitrary_destination(db_session):
    dispatcher = AIToolDispatcher(db=db_session)
    res = await dispatcher.dispatch("get_weather_forecast", {"destination": "Delhi"})
    assert "error" not in res
    assert "coordinates" in res
    assert res["coordinates"]["lat"] is not None


# 10. Copilot receives arbitrary destination context without falling back to Manali
@pytest.mark.asyncio
async def test_copilot_arbitrary_destination_context(db_session, test_user):
    context = build_copilot_context(db=db_session, user=test_user, destination_slug="kolkata")
    assert context["destination"] is not None
    assert "kolkata" in context["destination"]["slug"].lower() or "kolkata" in context["destination"]["name"].lower()


# 11. Copilot destination info tool resolves arbitrary destination
@pytest.mark.asyncio
async def test_copilot_get_destination_info_dynamic(db_session):
    dispatcher = AIToolDispatcher(db=db_session)
    res = await dispatcher.dispatch("get_destination_info", {"destination_slug": "ayodhya"})
    assert "error" not in res
    assert "ayodhya" in res["destination_name"].lower() or "ayodhya" in res["destination_slug"].lower()
    assert res["is_curated"] is False
    assert res["coordinates"]["lat"] is not None


# 12. Universal Trip creation and Itinerary generation accepts non-curated destination
def test_create_trip_arbitrary_destination(test_user):
    from app.api.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_user
    try:
        start_d = date.today() + timedelta(days=5)
        end_d = start_d + timedelta(days=2)
        payload = {
            "destination_id": "pune",
            "start_date": str(start_d),
            "end_date": str(end_d),
            "budget": 12000,
            "travellers_count": 2,
            "companion_type": "Friends",
            "travel_style": "Balanced",
            "wake_up_preference": "Normal",
            "activity_intensity": "Balanced",
            "interests": ["Food", "Culture", "Nature"],
        }
        resp = client.post("/api/v1/trips", json=payload)
        assert resp.status_code == 200
        trip = resp.json()
        assert trip["destination"]["name"].lower() == "pune"
        assert len(trip["itineraries"]) == 3
    finally:
        app.dependency_overrides.pop(get_current_user, None)
