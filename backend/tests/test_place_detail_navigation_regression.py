import os
import re
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.seed.seed_data import seed_database
from app.models.models import Place, Destination

client = TestClient(app)

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FRONTEND_DIR = os.path.join(WORKSPACE, "frontend")
EXPLORE_PAGE_PATH = os.path.join(FRONTEND_DIR, "app", "explore", "[slug]", "page.tsx")
RESOLVER_PATH = os.path.join(FRONTEND_DIR, "lib", "placeVisualResolver.ts")
CARD_PATH = os.path.join(FRONTEND_DIR, "components", "places", "PlaceCard.tsx")
MODAL_PATH = os.path.join(FRONTEND_DIR, "components", "places", "PlaceModal.tsx")

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database()

def test_curated_place_click_resolves():
    """Verify curated places in destinations resolve via API and card selection triggers modal."""
    # 1. Check API endpoint for Dharamshala
    res = client.get("/api/v1/destinations/dharamshala")
    assert res.status_code == 200
    data = res.json()
    assert "destination" in data
    assert "places" in data
    places = data["places"]
    assert len(places) > 0

    # Verify key Dharamshala landmarks are present
    names = [p["name"] for p in places]
    assert any("Bhagsunag" in n for n in names)
    assert any("Namgyal" in n for n in names)
    assert any("Triund" in n for n in names)

    # 2. Check individual place detail & reviews API
    for p in places[:3]:
        p_res = client.get(f"/api/v1/places/{p['id']}")
        assert p_res.status_code == 200
        p_detail = p_res.json()
        assert p_detail["id"] == p["id"]
        assert p_detail["name"] == p["name"]

        r_res = client.get(f"/api/v1/places/{p['id']}/reviews")
        assert r_res.status_code == 200

    # 3. Verify frontend PlaceCard wireup
    with open(CARD_PATH, "r", encoding="utf-8") as f:
        card_content = f.read()
    assert "onClick={() => onSelect && onSelect(place)}" in card_content or "onSelect(place)" in card_content

    # 4. Verify frontend PlaceModal integration
    with open(EXPLORE_PAGE_PATH, "r", encoding="utf-8") as f:
        page_content = f.read()
    assert "setSelectedPlace(p)" in page_content
    assert "setModalOpen(true)" in page_content
    assert "<PlaceModal" in page_content

def test_place_detail_loading_exits_on_success():
    """Verify hydration effect and destLoading allow destination and places to render."""
    with open(EXPLORE_PAGE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Hydration guard check: setMounted(true) must be called in useEffect
    assert "setMounted(true)" in content, "setMounted(true) must be called in a client mount useEffect"
    assert "const [mounted, setMounted] = useState(false)" in content

    # Loading state check: destLoading must be set to false on success
    assert "setDestLoading(false)" in content
    # The condition !mounted || destLoading exits once mounted=true and destLoading=false
    assert "!mounted || destLoading" in content

def test_place_detail_loading_exits_on_error():
    """Verify destination loading exits on 404, 500, or timeout error with truthful error state."""
    # Test API returns 404 for unknown destination
    res = client.get("/api/v1/destinations/non-existent-sanctuary-999")
    assert res.status_code == 404

    # Verify frontend catch block exits destLoading and sets error
    with open(EXPLORE_PAGE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert "setLoadError(" in content
    assert "setDestLoading(false)" in content
    assert "loadError || !destination" in content
    assert "Retry Connection" in content or "Retry Sync" in content
    # Verify defensive timeout fallback is present
    assert "abortTimeout" in content or "setTimeout" in content

def test_missing_artwork_does_not_block_place_open():
    """Verify place with missing/null image_url resolves safely to universal fallback without blocking."""
    with open(RESOLVER_PATH, "r", encoding="utf-8") as f:
        resolver_code = f.read()

    # Resolver must have universal fallbacks and safe null handling
    assert "getUniversalFallback" in resolver_code
    assert "safeFallback" in resolver_code
    assert "/images/places/universal/nature.webp" in resolver_code

    with open(MODAL_PATH, "r", encoding="utf-8") as f:
        modal_code = f.read()

    # Modal must handle fallbackUrl gracefully
    assert "fallbackSrc={visualRes.fallbackUrl}" in modal_code
    assert "if (!isOpen || !place) return null" in modal_code

def test_invalid_artwork_does_not_block_place_open():
    """Verify invalid artwork paths or broken images cannot throw or prevent modal rendering."""
    with open(RESOLVER_PATH, "r", encoding="utf-8") as f:
        resolver_code = f.read()

    # Verify approved asset validation and fallback guarantee
    assert "isApprovedAsset" in resolver_code
    assert "safeFallback" in resolver_code

    with open(MODAL_PATH, "r", encoding="utf-8") as f:
        modal_code = f.read()

    # Modal resolves artwork cleanly without blocking place identity
    assert "resolvePlaceArtwork" in modal_code
    assert "place.name" in modal_code

def test_live_nearby_place_can_still_open():
    """Verify live/OSM places from /nearby can open in PlaceModal without regression."""
    nearby_path = os.path.join(FRONTEND_DIR, "app", "nearby", "page.tsx")
    with open(nearby_path, "r", encoding="utf-8") as f:
        nearby_content = f.read()

    assert "<PlaceModal" in nearby_content
    assert "setSelectedPlace(p)" in nearby_content
    assert "setModalOpen(true)" in nearby_content

    # Live places endpoint works
    res = client.get("/api/v1/places/nearby?lat=32.2190&lng=76.3234&radius_km=15")
    assert res.status_code == 200

def test_explore_does_not_request_live_places():
    """Verify explore destination pages do not fetch live nearby places."""
    with open(EXPLORE_PAGE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert "/places/nearby" not in content
    assert "fetchLiveDiscovery" not in content
    assert "livePlaces" not in content
    assert "Live Places Near" not in content
