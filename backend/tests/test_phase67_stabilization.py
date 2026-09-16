"""
VANVAS Phase 6.7 — Master Product Stabilization & Gemini AI Foundation Test Suite.
Tests:
- Quick Plan variation rotation
- Explore stay category image resolution
- AI Provider abstraction (Gemini Free-First / Disabled fallback)
- AI health diagnostic endpoints
- Deterministic systems preservation
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.providers.ai.base import AIProvider
from app.providers.ai.gemini_provider import GeminiProvider, DisabledAIProvider
from app.providers.ai.factory import AIFactory
from app.providers.ai.tools import VANVAS_COPILOT_TOOLS
from app.database.session import get_db, SessionLocal
from app.models.models import Destination, Trip, Place, Hotel

client = TestClient(app)


def test_ai_provider_base_interface():
    """Verify AI provider interface conforms to expected abstraction."""
    disabled = DisabledAIProvider()
    assert isinstance(disabled, AIProvider)
    assert disabled.name == "disabled"
    assert disabled.model == "none"
    assert disabled.is_enabled is False


@pytest.mark.asyncio
async def test_disabled_ai_provider_behavior():
    """Disabled provider must cleanly indicate disabled status without raising."""
    provider = DisabledAIProvider()
    health = await provider.health_check()
    assert health["status"] == "disabled"
    assert health["is_enabled"] is False

    response = await provider.generate_response(prompt="Hello VANVAS")
    assert "disabled" in response["text"].lower()
    assert response["is_enabled"] is False


@pytest.mark.asyncio
async def test_gemini_provider_unconfigured():
    """Gemini provider with empty API key reports unconfigured status cleanly."""
    provider = GeminiProvider(api_key="", model="gemini-1.5-flash")
    health = await provider.health_check()
    assert health["status"] == "unconfigured"
    assert health["is_enabled"] is False

    response = await provider.generate_response(prompt="Hello VANVAS")
    assert "not configured" in response["text"].lower()


def test_ai_factory_selection(monkeypatch):
    """AIFactory selects correct provider according to config."""
    # When disabled
    monkeypatch.setattr(settings, "AI_PROVIDER", "disabled")
    p1 = AIFactory.get_provider()
    assert isinstance(p1, DisabledAIProvider)

    # When gemini
    monkeypatch.setattr(settings, "AI_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test_key_123")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
    p2 = AIFactory.get_provider()
    assert isinstance(p2, GeminiProvider)
    assert p2.api_key == "test_key_123"
    assert p2.model == "gemini-1.5-flash"


def test_ai_tools_schema_validity():
    """Validate copilot tool schemas have standard parameters."""
    assert len(VANVAS_COPILOT_TOOLS) >= 4
    tool_names = [t["name"] for t in VANVAS_COPILOT_TOOLS]
    assert "get_destination_info" in tool_names
    assert "get_nearby_places" in tool_names
    assert "get_weather_forecast" in tool_names
    assert "get_quick_plan" in tool_names

    for tool in VANVAS_COPILOT_TOOLS:
        assert "name" in tool
        assert "description" in tool
        assert "parameters" in tool
        assert tool["parameters"]["type"] == "object"


def test_admin_ai_health_endpoint():
    """GET /api/v1/admin/ai/health returns valid status structure."""
    res = client.get("/api/v1/admin/ai/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "active_provider" in data
    assert "model" in data
    assert "details" in data


def test_quick_plan_variation_rotation():
    """POST /trips/{id}/quick-plan supports variation rotation without crashes."""
    db = SessionLocal()
    try:
        # Get any destination
        dest = db.query(Destination).filter(Destination.slug == "mussoorie").first()
        if not dest:
            dest = db.query(Destination).first()
        if not dest:
            pytest.skip("No destination in DB to test quick plan")

        trip = db.query(Trip).filter(Trip.destination_id == dest.id).first()
        if not trip:
            trip = db.query(Trip).first()
        if not trip:
            pytest.skip("No trip in DB to test quick plan")

        # Variation 0
        r0 = client.post(f"/api/v1/trips/{trip.id}/quick-plan", json={
            "hours_available": 3.0,
            "variation": 0
        })
        assert r0.status_code == 200
        data0 = r0.json()
        assert "headline" in data0
        assert "items" in data0

        # Variation 1
        r1 = client.post(f"/api/v1/trips/{trip.id}/quick-plan", json={
            "hours_available": 3.0,
            "variation": 1
        })
        assert r1.status_code == 200
        data1 = r1.json()
        assert "headline" in data1
        assert "items" in data1
    finally:
        db.close()


def test_stay_category_images_seeded():
    """Verify seeded hotels map to category stay artwork rather than hero images."""
    db = SessionLocal()
    try:
        hotels = db.query(Hotel).all()
        for h in hotels:
            if h.image_url and "destinations" in h.image_url and "hero" in h.image_url:
                pytest.fail(f"Hotel {h.name} is still using destination hero image: {h.image_url}")
    finally:
        db.close()
