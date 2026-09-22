"""
Regression Test Suite: Destination Integrity, Search Performance & Curated Explore Isolation

Ensures:
1. Searching for Delhi returns Delhi (never Bromsgrove).
2. Selecting Delhi resolves the canonical identity for Delhi.
3. Creating a Delhi trip assigns the destination accurately as Delhi (and not Bromsgrove or any fallback).
4. Creating dynamic trips for Delhi, Pune, Gokarna, Kolkata does NOT mutate or contaminate the curated Explore destination catalog.
5. Curated Explore (/explore and GET /api/v1/destinations) strictly contains only the 12 approved curated destinations.
6. Queries with internal synthetic prefixes (e.g. 'dyn-delhi', 'dest-delhi') resolve cleanly to the canonical destination identity.
"""

import pytest
from datetime import datetime, timezone, date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, Destination, Trip
from app.services.destination_intelligence import DestinationIntelligenceService
from app.providers.geocoding_provider import LiveGeocodingProvider, APPROVED_CURATED_SLUGS

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module")
def auth_headers(db_session):
    user = db_session.query(User).filter(User.email == "integrity_test@vanvas.com").first()
    if not user:
        user = User(
            email="integrity_test@vanvas.com",
            hashed_password="hashed_test_password",
            full_name="Integrity Tester",
            role="traveller",
            email_verified_at=datetime.now(timezone.utc),
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    from app.core.security import create_access_token
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


# 1. Search Delhi -> Returns Delhi, Never Bromsgrove
@pytest.mark.asyncio
async def test_search_delhi_returns_delhi_not_bromsgrove():
    geocoder = LiveGeocodingProvider()
    results = await geocoder.autocomplete("delhi", limit=6)
    assert len(results) > 0

    first = results[0]
    assert "delhi" in first["name"].lower() or "delhi" in first["slug"].lower()
    assert "bromsgrove" not in first["name"].lower()
    assert "bromsgrove" not in first["slug"].lower()
    assert first["country"] == "India"
    assert abs(first["latitude"] - 28.6139) < 1.0


# 2. Synthetic Prefix Query Sanitization: dyn-delhi resolves to Delhi
@pytest.mark.asyncio
async def test_synthetic_prefix_sanitization_delhi():
    geocoder = LiveGeocodingProvider()
    res = await geocoder.geocode("dyn-delhi")
    assert res is not None
    assert "delhi" in res["name"].lower() or res["canonical_slug"] == "delhi"
    assert "bromsgrove" not in res["name"].lower()
    assert "bromsgrove" not in res["slug"].lower()
    assert res["country"] == "India"
    assert abs(res["latitude"] - 28.6139) < 1.0


# 3. Resolve Destination API endpoint resolves Delhi accurately
def test_resolve_destination_api_delhi():
    resp = client.post("/api/v1/destinations/resolve?query=delhi")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Delhi" or "delhi" in data["slug"]
    assert data["canonical_slug"] == "delhi"
    assert "bromsgrove" not in data["name"].lower()
    assert abs(data["latitude"] - 28.6139) < 1.0
    assert abs(data["longitude"] - 77.2090) < 1.0


# 4. Resolve Destination with dyn- prefix resolves cleanly
def test_resolve_destination_with_dyn_prefix():
    resp = client.post("/api/v1/destinations/resolve?query=dyn-delhi")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Delhi" or "delhi" in data["slug"]
    assert data["canonical_slug"] == "delhi"
    assert "bromsgrove" not in data["name"].lower()


# 5. Full Trip Planning & Curated Explore Isolation for Delhi
def test_create_delhi_trip_and_explore_isolation(auth_headers, db_session):
    # Check baseline curated count
    curated_before = client.get("/api/v1/destinations").json()
    curated_before_slugs = {d["slug"] for d in curated_before}
    assert len(curated_before) == 12
    assert "delhi" not in curated_before_slugs
    assert "bromsgrove" not in curated_before_slugs

    # Create Delhi trip
    start_str = date.today().isoformat()
    end_str = (date.today() + timedelta(days=3)).isoformat()
    trip_payload = {
        "destination_id": "dyn-delhi",
        "start_date": start_str,
        "end_date": end_str,
        "budget": 15000,
        "travellers_count": 1,
        "companion_type": "Solo",
        "travel_style": "Balanced",
        "wake_up_preference": "Normal",
        "activity_intensity": "Balanced",
        "interests": ["Nature", "Cafés", "Food"]
    }

    create_resp = client.post("/api/v1/trips", json=trip_payload, headers=auth_headers)
    assert create_resp.status_code == 200
    trip = create_resp.json()

    # Assert trip.destination is Delhi
    assert trip["destination"]["name"] == "Delhi" or "delhi" in trip["destination"]["slug"]
    assert "bromsgrove" not in trip["destination"]["name"].lower()
    assert "bromsgrove" not in trip["destination"]["slug"].lower()
    assert abs(trip["destination"]["latitude"] - 28.6139) < 1.0

    # Assert curated Explore destinations did NOT change
    curated_after = client.get("/api/v1/destinations").json()
    curated_after_slugs = {d["slug"] for d in curated_after}
    assert len(curated_after) == 12
    assert curated_after_slugs == curated_before_slugs
    assert "delhi" not in curated_after_slugs
    assert "bromsgrove" not in curated_after_slugs


# 6. Test Dynamic Destinations: Pune, Gokarna, Kolkata, Ayodhya
@pytest.mark.parametrize("city,expected_state", [
    ("Pune", "Maharashtra"),
    ("Gokarna", "Karnataka"),
    ("Kolkata", "West Bengal"),
    ("Ayodhya", "Uttar Pradesh")
])
def test_dynamic_destinations_isolation(city, expected_state, auth_headers):
    # Check baseline Explore catalog
    curated_before = client.get("/api/v1/destinations").json()
    before_slugs = {d["slug"] for d in curated_before}

    # 1. Resolve city
    res_resp = client.post(f"/api/v1/destinations/resolve?query={city}")
    assert res_resp.status_code == 200
    data = res_resp.json()
    assert city.lower() in data["name"].lower() or city.lower() in data["slug"].lower()
    assert data["is_curated"] is False
    assert data["is_dynamic"] is True

    # 2. Create trip for city
    start_str = date.today().isoformat()
    end_str = (date.today() + timedelta(days=2)).isoformat()
    trip_payload = {
        "destination_id": data["id"],
        "start_date": start_str,
        "end_date": end_str,
        "budget": 12000,
        "travellers_count": 1,
        "companion_type": "Solo",
        "travel_style": "Balanced",
        "wake_up_preference": "Normal",
        "activity_intensity": "Balanced",
        "interests": ["Culture", "Local Food"]
    }
    trip_resp = client.post("/api/v1/trips", json=trip_payload, headers=auth_headers)
    assert trip_resp.status_code == 200
    trip_data = trip_resp.json()
    assert city.lower() in trip_data["destination"]["name"].lower() or city.lower() in trip_data["destination"]["slug"].lower()

    # 3. Assert Explore catalog was NOT mutated
    curated_after = client.get("/api/v1/destinations").json()
    after_slugs = {d["slug"] for d in curated_after}
    assert after_slugs == before_slugs
    assert data["slug"] not in after_slugs
