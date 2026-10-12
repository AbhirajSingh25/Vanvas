import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.services.destination_aliases import resolve_alias_to_slug, DESTINATION_ALIASES
from app.services.destination_intelligence import DestinationIntelligenceService
from app.database.session import SessionLocal

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_alias_dictionary_integrity():
    """Verify alias map resolves critical Indian aliases correctly."""
    assert resolve_alias_to_slug("banaras") == ("varanasi", "Banaras")
    assert resolve_alias_to_slug("benaras") == ("varanasi", "Benaras")
    assert resolve_alias_to_slug("kashi") == ("varanasi", "Kashi")
    assert resolve_alias_to_slug("chopta") == ("tungnath-chandrashila", "Chopta")
    assert resolve_alias_to_slug("mcleodganj")[0] == "dharamshala"
    assert resolve_alias_to_slug("mcleod ganj") == ("dharamshala", "Mcleod Ganj")
    assert resolve_alias_to_slug("bombay") == ("mumbai", "Bombay")
    assert resolve_alias_to_slug("bangalore") == ("bengaluru", "Bangalore")

@pytest.mark.asyncio
async def test_search_banaras_resolves_to_varanasi(db_session):
    """Critical P0 check: 'banaras' must immediately return Varanasi canonical record."""
    start_t = time.perf_counter()
    results = await DestinationIntelligenceService.search_destinations_autocomplete("banaras", limit=6, db=db_session)
    elapsed_ms = (time.perf_counter() - start_t) * 1000

    assert len(results) >= 1
    top = results[0]
    assert top["slug"] == "varanasi"
    assert top["canonical_slug"] == "varanasi"
    assert "Varanasi" in top["name"]
    assert top["state"] == "Uttar Pradesh"
    assert top["matched_alias"] == "Banaras"
    assert elapsed_ms < 100, f"Search took too long: {elapsed_ms:.1f}ms"

@pytest.mark.asyncio
async def test_search_varanasi_direct(db_session):
    """Direct search for 'Varanasi' returns canonical Varanasi."""
    results = await DestinationIntelligenceService.search_destinations_autocomplete("varanasi", limit=6, db=db_session)
    assert len(results) >= 1
    assert results[0]["slug"] == "varanasi"
    assert results[0]["name"] == "Varanasi"

@pytest.mark.asyncio
async def test_search_chopta_resolves_tungnath(db_session):
    """'Chopta' resolves to Tungnath-Chandrashila trek destination."""
    results = await DestinationIntelligenceService.search_destinations_autocomplete("chopta", limit=6, db=db_session)
    assert len(results) >= 1
    assert "tungnath" in results[0]["slug"]
    assert results[0]["matched_alias"] == "Chopta"

@pytest.mark.asyncio
async def test_search_non_matching_query(db_session):
    """Non-matching gibberish does not crash, hang, or leave hanging spinners."""
    start_t = time.perf_counter()
    results = await DestinationIntelligenceService.search_destinations_autocomplete("xyzzyqwer12345", limit=6, db=db_session)
    elapsed_ms = (time.perf_counter() - start_t) * 1000
    assert isinstance(results, list)
    assert elapsed_ms < 2000, f"Non-matching query took too long: {elapsed_ms:.1f}ms"

def test_api_search_endpoint_contract():
    """Verify GET /api/v1/destinations/search returns expected JSON schema."""
    response = client.get("/api/v1/destinations/search?q=banaras&limit=6")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    item = data[0]
    assert "canonical_slug" in item
    assert "slug" in item
    assert "name" in item
    assert "state" in item
    assert "display_name" in item
    assert item["canonical_slug"] == "varanasi"
    assert item["slug"] == "varanasi"

def test_api_search_endpoint_empty_query():
    """Verify empty query behavior."""
    response = client.get("/api/v1/destinations/search?q=&limit=6")
    # FastAPI min_length=1 triggers 422 Unprocessable Entity
    assert response.status_code == 422

def test_resolve_endpoint_with_alias():
    """Verify POST /api/v1/destinations/resolve resolves 'banaras' to Varanasi."""
    response = client.post("/api/v1/destinations/resolve?query=banaras")
    assert response.status_code == 200
    data = response.json()
    assert data["canonical_slug"] == "varanasi"
    assert data["name"] == "Varanasi"
