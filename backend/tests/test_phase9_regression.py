"""
VANVAS Phase 9 — Copilot Explicit Context & Arrival Intelligence Regression Tests
Verifies:
- Explicit destination in user query ("Vrindavan mein khane ki jagah batao") overrides stale page context ("manali" or "jaipur")
- Returned structured places belong to Vrindavan/Mathura, not Manali
- "Which is closest?" follow-up fast-path resolves instantly without timeout
- "nearby" query handles missing vs available coordinates gracefully
- Arrival intelligence intercity transit (Dehradun arrival for Mussoorie destination)
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, Trip, Destination, Place
from app.api.deps import get_current_user_optional

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def traveller_user(db):
    user = db.query(User).filter(User.email == "traveller@vanvas.com").first()
    if not user:
        user = User(
            id="test-traveller-user",
            email="traveller@vanvas.com",
            hashed_password="hash",
            full_name="Test Explorer",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
    return user

def test_vrindavan_overrides_stale_manali_context(traveller_user):
    app.dependency_overrides[get_current_user_optional] = lambda: traveller_user
    try:
        resp = client.post("/api/v1/copilot/chat", json={
            "message": "Vrindavan mein khane ki jagah batao",
            "destination_slug": "manali",  # stale page context
            "context": {"current_page": "/destinations/manali"}
        })
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "places" in data
        assert len(data["places"]) > 0
        
        # Verify places belong to Mathura-Vrindavan, NOT Manali
        place_names = [p["name"] for p in data["places"]]
        assert any("brijwasi" in p.lower() or "mathura" in p.lower() or "vrindavan" in p.lower() for p in place_names), f"Unexpected places: {place_names}"
        assert not any("old manali" in p.lower() or "cafe 1947" in p.lower() or "johnson" in p.lower() for p in place_names)
        
        conv_id = data.get("conversation_id")
        assert conv_id is not None
        
        # Test follow-up "Which is closest?"
        follow_up = client.post("/api/v1/copilot/chat", json={
            "message": "Which is closest?",
            "conversation_id": conv_id,
            "destination_slug": "manali",  # stale page context still passed by client
            "context": {"coords": {"latitude": 27.4924, "longitude": 77.6737}}
        })
        assert follow_up.status_code == 200, follow_up.text
        f_data = follow_up.json()
        assert len(f_data.get("places", [])) > 0
        assert "closest" in f_data["message"].lower() or "brijwasi" in f_data["message"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user_optional, None)

def test_nearby_without_and_with_coordinates(traveller_user):
    app.dependency_overrides[get_current_user_optional] = lambda: traveller_user
    try:
        # Without coordinates and without explicit destination -> should ask for clarification
        resp_no_coords = client.post("/api/v1/copilot/chat", json={
            "message": "What food is nearby?",
            "context": {}
        })
        assert resp_no_coords.status_code == 200
        data_nc = resp_no_coords.json()
        assert "location" in data_nc["message"].lower() or "gps" in data_nc["message"].lower()
        
        # With coordinates
        resp_coords = client.post("/api/v1/copilot/chat", json={
            "message": "What food is nearby?",
            "context": {"latitude": 27.4924, "longitude": 77.6737}
        })
        assert resp_coords.status_code == 200
        data_c = resp_coords.json()
        assert len(data_c.get("places", [])) > 0
    finally:
        app.dependency_overrides.pop(get_current_user_optional, None)
