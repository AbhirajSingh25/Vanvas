import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal, get_db
from app.models.models import User, Destination, Trip
from app.providers.demo_providers import DemoTransportProvider

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def auth_user(db_session):
    user = db_session.query(User).filter(User.email == "transport_truth_user@vanvas.app").first()
    if not user:
        user = User(
            email="transport_truth_user@vanvas.app",
            hashed_password="mockhashedpassword123",
            full_name="Truth Tester",
            role="traveller"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user


# 1. Validation: Origin is required for trip creation, returns 422 on missing/empty
def test_trip_creation_requires_origin(auth_user):
    from app.api.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: auth_user
    try:
        start_d = date.today() + timedelta(days=7)
        end_d = start_d + timedelta(days=3)
        
        # Missing origin_city
        payload_missing = {
            "destination_id": "manali",
            "start_date": str(start_d),
            "end_date": str(end_d),
            "transport_mode": "bus",
            "budget": 15000,
        }
        resp = client.post("/api/v1/trips", json=payload_missing)
        assert resp.status_code == 422

        # Empty origin_city
        payload_empty = {
            "destination_id": "manali",
            "start_date": str(start_d),
            "end_date": str(end_d),
            "origin_city": "   ",
            "transport_mode": "bus",
            "budget": 15000,
        }
        resp = client.post("/api/v1/trips", json=payload_empty)
        assert resp.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# 2. Validation: Transport mode is required and validated for trip creation
def test_trip_creation_requires_transport_mode(auth_user):
    from app.api.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: auth_user
    try:
        start_d = date.today() + timedelta(days=7)
        end_d = start_d + timedelta(days=3)
        
        # Missing transport_mode
        payload_missing = {
            "destination_id": "manali",
            "start_date": str(start_d),
            "end_date": str(end_d),
            "origin_city": "Chandigarh",
            "budget": 15000,
        }
        resp = client.post("/api/v1/trips", json=payload_missing)
        assert resp.status_code == 422

        # Invalid transport_mode
        payload_invalid = {
            "destination_id": "manali",
            "start_date": str(start_d),
            "end_date": str(end_d),
            "origin_city": "Chandigarh",
            "transport_mode": "teleportation",
            "budget": 15000,
        }
        resp = client.post("/api/v1/trips", json=payload_invalid)
        assert resp.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# 3. Trip Creation Persists Exact Origin and Chosen Transport without Fallback
def test_trip_creation_persists_exact_origin_and_transport(auth_user):
    from app.api.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: auth_user
    try:
        start_d = date.today() + timedelta(days=10)
        end_d = start_d + timedelta(days=4)
        
        # Explicit non-Delhi origin and non-bus mode
        payload = {
            "destination_id": "manali",
            "start_date": str(start_d),
            "end_date": str(end_d),
            "origin_city": "Dehradun",
            "transport_mode": "road_trip",
            "budget": 20000,
            "travellers_count": 3,
            "companion_type": "Friends",
            "travel_style": "Comfort",
            "transport_details": {
                "operator_name": "Self-Drive SUV Corridor",
                "price": 6400.0,
                "duration_hours": 9.0,
                "booking_label": "View Route Guidance"
            }
        }
        resp = client.post("/api/v1/trips", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["origin_city"] == "Dehradun"
        assert data["transport_mode"] == "road_trip"
        assert data["trip_mode"] == "road_trip"
        assert "Self-Drive SUV Corridor" in data["transport_details_json"]

        # Fetch trip by ID and verify persistence
        trip_id = data["id"]
        get_resp = client.get(f"/api/v1/trips/{trip_id}")
        assert get_resp.status_code == 200
        trip_data = get_resp.json()
        assert trip_data["origin_city"] == "Dehradun"
        assert trip_data["transport_mode"] == "road_trip"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# 4. Transport Provider Returns Truthful Provenance and Corridor-Aware Terminals
@pytest.mark.asyncio
async def test_transport_provider_corridor_truth():
    provider = DemoTransportProvider()

    # Corridor 1: Delhi -> Manali
    routes_delhi = await provider.search_routes(origin="Delhi", destination="Manali")
    assert len(routes_delhi) >= 5

    # Check Bus: labeled as CURATED, INDICATIVE with disclaimer and operator action
    bus_opt = next(r for r in routes_delhi if r["transport_type"] == "Bus")
    assert bus_opt["data_state"] == "CURATED"
    assert bus_opt["availability_state"] == "INDICATIVE"
    assert bus_opt["is_live"] is False
    assert bus_opt["booking_label"] == "Book with operator"
    assert "ISBT Kashmiri Gate" in bus_opt["departure_location"]
    assert "Indicative curated schedule" in bus_opt["disclaimer"]

    # Check Train: Truthful railhead + connecting transit (no fake direct train to Manali)
    train_opt = next(r for r in routes_delhi if r["transport_type"] == "Train")
    assert "Chandigarh" in train_opt["arrival_location"] or "Una" in train_opt["arrival_location"]
    assert "IRCTC" in train_opt["booking_label"]
    assert train_opt["data_state"] == "CURATED"

    # Check Road Trip: calculated route with ESTIMATED state
    road_opt = next(r for r in routes_delhi if r["transport_type"] == "Road Trip")
    assert road_opt["data_state"] == "ESTIMATED"
    assert road_opt["availability_state"] == "ESTIMATED"
    assert road_opt["booking_url"] is None
    assert road_opt["booking_label"] == "View Route Guidance"

    # Check Cab: ESTIMATED private transfer without claiming fake commercial operator
    cab_opt = next(r for r in routes_delhi if r["transport_type"] == "Cab")
    assert cab_opt["data_state"] == "ESTIMATED"
    assert cab_opt["booking_label"] == "Estimated Route Guidance"
    assert "local taxi unions" in cab_opt["disclaimer"]


# 5. Multi-Origin Corridor Integrity: Chandigarh to Manali
@pytest.mark.asyncio
async def test_transport_provider_chandigarh_origin():
    provider = DemoTransportProvider()
    routes = await provider.search_routes(origin="Chandigarh", destination="Manali")
    
    # Must use Chandigarh terminals, NOT Delhi
    bus_opt = next(r for r in routes if r["transport_type"] == "Bus")
    assert "Chandigarh (ISBT Sector 43)" in bus_opt["departure_location"]
    assert "Delhi" not in bus_opt["departure_location"]

    train_opt = next(r for r in routes if r["transport_type"] == "Train")
    assert "Chandigarh Junction (CDG)" in train_opt["departure_location"]
    assert "New Delhi" not in train_opt["departure_location"]
