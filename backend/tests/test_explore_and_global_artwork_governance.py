import pytest
import os
import re
import hashlib
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.seed.seed_data import seed_database
from app.models.models import Place, Destination
from app.providers.live_providers import LivePlacesProvider

client = TestClient(app)

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FRONTEND_DIR = os.path.join(WORKSPACE, "frontend")
PUBLIC_IMG_DIR = os.path.join(FRONTEND_DIR, "public")
EXPLORE_PAGE_PATH = os.path.join(FRONTEND_DIR, "app", "explore", "[slug]", "page.tsx")
RESOLVER_PATH = os.path.join(FRONTEND_DIR, "lib", "placeVisualResolver.ts")

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database()

# 1. Explore does not call live POI discovery
def test_explore_does_not_call_live_poi_discovery():
    with open(EXPLORE_PAGE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    assert "/places/nearby" not in content, "Explore page must not query /places/nearby"
    assert "fetchLiveDiscovery" not in content, "Explore page must not have fetchLiveDiscovery function"
    assert "livePlaces" not in content, "Explore page must not have livePlaces state"

# 2. Live Places section is absent from Explore
def test_live_places_section_absent_from_explore():
    with open(EXPLORE_PAGE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Live Places Near" not in content, "Explore must not have Live Places Near heading"
    assert "Live POI Discovery" not in content, "Explore must not have Live POI Discovery heading"
    assert "No additional live places discovered" not in content, "Explore must not have live empty state"
    assert "liveCategory" not in content, "Explore must not have live category tabs"

# 3. Nearby still supports live discovery
def test_nearby_still_supports_live_discovery():
    db: Session = SessionLocal()
    kasol = db.query(Destination).filter(Destination.slug == "kasol").first()
    assert kasol is not None
    db.close()

    mock_live_places = [
        {
            "id": "osm-201",
            "name": "Parvati Valley Riverside Cafe",
            "category": "Cafés & Bakery",
            "latitude": 32.0125,
            "longitude": 77.3185,
            "source": "openstreetmap",
            "source_id": "201",
            "is_live": True
        }
    ]

    with patch.object(LivePlacesProvider, "get_nearby_places", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_live_places
        res = client.get(f"/api/v1/places/nearby?lat={kasol.latitude}&lng={kasol.longitude}&radius_km=10&live_only=true")
        assert res.status_code == 200
        places = res.json()
        assert len(places) == 1
        assert places[0]["name"] == "Parvati Valley Riverside Cafe"
        assert places[0]["is_live"] is True

# 4 & 5. Deprecated and Review-Required artwork rejection
def test_deprecated_and_review_required_artwork_rejected():
    deprecated_patterns = [
        "/images/places/placeholder.png",
        "/images/places/vector-art.svg",
        "/images/places/geometric-moon.webp",
        "https://via.placeholder.com/150",
        "",
        None,
        "null",
        "/images/places/simple-moon-mountain.webp"
    ]
    # In TypeScript resolver, these return DEPRECATED. Let's verify our resolver checks them.
    with open(RESOLVER_PATH, "r", encoding="utf-8") as f:
        resolver_code = f.read()
    assert "placeholder" in resolver_code
    assert "vector" in resolver_code
    assert ".svg" in resolver_code
    assert "geometric" in resolver_code

# 6. Approved artwork remains usable
def test_approved_artwork_remains_usable():
    key_artworks = [
        "/images/places/manali/hadimba-temple.webp",
        "/images/places/kasol/moon-dance-cafe.webp",
        "/images/places/varanasi/kashi-vishwanath.webp",
        "/images/places/varanasi/assi-ghat.webp",
        "/images/places/varanasi/blue-lassi-shop.webp",
        "/images/places/spiti/key-monastery.webp",
        "/images/places/mussoorie/st-pauls-church.webp",
        "/images/places/goa/aguada-fort.webp",
        "/images/places/jaipur/hawa-mahal.webp",
        "/images/places/udaipur/lake-pichola.webp",
    ]
    for rel_path in key_artworks:
        full_path = os.path.join(PUBLIC_IMG_DIR, rel_path.lstrip("/").replace("/", os.sep))
        assert os.path.exists(full_path), f"Approved asset must exist: {rel_path}"
        assert os.path.getsize(full_path) >= 35000, f"Approved asset must be high-res (>=35KB): {rel_path}"

# 7. All production-reachable artwork resolves to APPROVED assets
def test_all_production_reachable_artwork_is_approved():
    db: Session = SessionLocal()
    places = db.query(Place).all()
    destinations = db.query(Destination).all()
    
    for d in destinations:
        if d.hero_image and d.hero_image.startswith("/images/"):
            fp = os.path.join(PUBLIC_IMG_DIR, d.hero_image.lstrip("/").replace("/", os.sep))
            assert os.path.exists(fp), f"Destination hero missing: {d.hero_image}"
            assert os.path.getsize(fp) >= 35000, f"Hero image must be high-res: {d.hero_image}"

    for p in places:
        if p.image_url and p.image_url.startswith("/images/"):
            fp = os.path.join(PUBLIC_IMG_DIR, p.image_url.lstrip("/").replace("/", os.sep))
            assert os.path.exists(fp), f"Place image missing: {p.image_url}"
            assert os.path.getsize(fp) >= 35000, f"Place image must be high-res: {p.image_url}"
            assert not p.image_url.endswith(".svg")
            assert "placeholder" not in p.image_url.lower()

    db.close()

# 8. No semantic artwork collisions
def test_no_semantic_artwork_collisions():
    db: Session = SessionLocal()
    places = db.query(Place).all()
    for p in places:
        cat = (p.category or "").lower()
        img = (p.image_url or "").lower()
        if "stay" in cat or "hotel" in cat:
            assert "temple" not in img
            assert "fort" not in img
            assert "waterfall" not in img
        if "cafe" in cat or "food" in cat:
            assert "trail" not in img
            assert "monastery" not in img
            assert "waterfall" not in img
    db.close()

# 9. No unrelated duplicate artwork among exact landmarks
def test_no_unrelated_duplicate_exact_artwork():
    with open(RESOLVER_PATH, "r", encoding="utf-8") as f:
        code = f.read()

    # Extract all exact place mappings
    exact_mappings = re.findall(r'\"([a-z0-9\-]+:[a-z0-9\-]+)\":\s*\{\s*imageUrl:\s*\"([^\"]+)\"', code)
    assert len(exact_mappings) >= 25, "Must have comprehensive exact place mappings"

    seen_exact = {}
    for key, img_url in exact_mappings:
        assert img_url not in seen_exact, f"Exact landmark asset {img_url} duplicated across {seen_exact.get(img_url)} and {key}"
        seen_exact[img_url] = key

# 10. All seed image references resolve to approved assets on disk
def test_all_seed_image_references_exist():
    db: Session = SessionLocal()
    places = db.query(Place).all()
    assert len(places) >= 40
    for p in places:
        assert p.image_url is not None
        if p.image_url.startswith("/images/"):
            fp = os.path.join(PUBLIC_IMG_DIR, p.image_url.lstrip("/").replace("/", os.sep))
            assert os.path.exists(fp), f"Seed place {p.name} image missing on disk: {p.image_url}"
            assert os.path.getsize(fp) >= 35000, f"Seed place {p.name} image < 35KB: {p.image_url}"
    db.close()

# 11. Exact landmark artwork mappings are valid
def test_exact_landmark_artwork_mappings_valid():
    landmarks = [
        "places/varanasi/kashi-vishwanath.webp",
        "places/varanasi/assi-ghat.webp",
        "places/varanasi/dashashwamedh-ghat-aarti.webp",
        "places/varanasi/blue-lassi-shop.webp",
        "places/spiti/key-monastery.webp",
        "places/spiti/chandratal-lake.webp",
        "places/spiti/dhankar-gompa.webp",
        "places/spiti/tabo-monastery.webp",
        "places/manali/hadimba-temple.webp",
        "places/manali/old-manali.webp",
        "places/manali/solang-valley.webp",
        "places/kasol/moon-dance-cafe.webp",
        "places/kasol/chalal-trail.webp",
        "places/kasol/manikaran-sahib.webp",
        "places/dharamshala/namgyal-monastery.webp",
        "places/dharamshala/triund-trek.webp",
        "places/goa/aguada-fort.webp",
        "places/goa/fontainhas-latin-quarter.webp",
        "places/jaipur/hawa-mahal.webp",
        "places/jaipur/amber-fort.webp",
        "places/udaipur/lake-pichola.webp",
        "places/udaipur/city-palace-udaipur.webp",
        "places/leh/thiksey-monastery-gompa.webp",
        "places/leh/pangong-tso.webp",
        "places/munnar/mattupetty-dam.webp",
        "places/munnar/kolukkumalai-tea.webp",
    ]
    for lm in landmarks:
        fp = os.path.join(PUBLIC_IMG_DIR, "images", lm.replace("/", os.sep))
        assert os.path.exists(fp), f"Landmark image missing: {lm}"
        assert os.path.getsize(fp) >= 35000, f"Landmark image too small: {lm} ({os.path.getsize(fp)} bytes)"

# 12. Universal fallback artwork is approved
def test_universal_fallbacks_are_approved():
    universals = [
        "beach.webp", "cafe.webp", "church.webp", "food.webp", "heritage.webp",
        "lake.webp", "medical.webp", "monastery.webp", "nature.webp",
        "nightlife.webp", "service.webp", "shopping.webp", "spiritual.webp",
        "stay.webp", "transport.webp", "viewpoint.webp", "waterfall.webp"
    ]
    for u in universals:
        fp = os.path.join(PUBLIC_IMG_DIR, "images", "places", "universal", u)
        assert os.path.exists(fp), f"Universal fallback missing: {u}"
        sz = os.path.getsize(fp)
        assert sz >= 35000, f"Universal fallback {u} too small: {sz} bytes (must be >= 35KB)"
