import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import SessionLocal
from app.models.models import Destination, Place

@pytest.mark.asyncio
async def test_mussoorie_has_verified_landmarks_and_no_ghat_leakage():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/destinations/mussoorie")
        assert r.status_code == 200
        data = r.json()
        places = data.get("places", [])
        place_names = [p["name"] for p in places]
        place_slugs = [p["slug"] for p in places]

        # Verify authentic Mussoorie / Landour places
        assert any("Landour Bakehouse" in name for name in place_names)
        assert any("Lal Tibba" in name for name in place_names)
        assert any("Kempty Falls" in name for name in place_names)

        # Verify zero ghat or unrelated regional leakage
        for name in place_names:
            assert "ghat" not in name.lower(), f"Contamination: found ghat '{name}' in Mussoorie!"
            assert "beach" not in name.lower(), f"Contamination: found beach '{name}' in Mussoorie!"
            assert "secret ghat" not in name.lower()

@pytest.mark.asyncio
async def test_varanasi_has_authentic_ghats():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/destinations/varanasi")
        assert r.status_code == 200
        data = r.json()
        places = data.get("places", [])
        place_names = [p["name"] for p in places]

        # Verify authentic Varanasi ghats
        assert any("Dashashwamedh" in name for name in place_names)
        assert any("Assi Ghat" in name for name in place_names)
        assert any("Kashi Vishwanath" in name for name in place_names)

@pytest.mark.asyncio
async def test_udaipur_has_authentic_mewar_landmarks():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/destinations/udaipur")
        assert r.status_code == 200
        data = r.json()
        places = data.get("places", [])
        place_names = [p["name"] for p in places]

        # Verify authentic Udaipur landmarks
        assert any("City Palace" in name for name in place_names)
        assert any("Lake Pichola" in name for name in place_names)
        assert any("Bagore Ki Haveli" in name for name in place_names)

@pytest.mark.asyncio
async def test_geographic_containment_of_all_seeded_places():
    db = SessionLocal()
    destinations = db.query(Destination).all()
    assert len(destinations) >= 10

    for d in destinations:
        places = db.query(Place).filter(Place.destination_id == d.id).all()
        for p in places:
            # Check coordinate bounds: place latitude/longitude should be within 1.5 degrees of destination
            lat_diff = abs(p.latitude - d.latitude)
            lng_diff = abs(p.longitude - d.longitude)
            assert lat_diff < 1.5, f"Place '{p.name}' lat {p.latitude} is too far from {d.name} lat {d.latitude}"
            assert lng_diff < 1.5, f"Place '{p.name}' lng {p.longitude} is too far from {d.name} lng {d.longitude}"
    db.close()
