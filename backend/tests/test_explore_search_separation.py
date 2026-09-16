import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.orm import Session
from app.main import app
from app.database.session import SessionLocal
from app.models.models import Destination

@pytest.mark.asyncio
async def test_explore_catalogue_contains_only_curated_destinations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/v1/destinations")
        assert r.status_code == 200
        dests = r.json()
        slugs = [d["slug"] for d in dests]
        
        # Verify approved curated destinations
        assert "manali" in slugs
        assert "mussoorie" in slugs
        assert "udaipur" in slugs
        assert "varanasi" in slugs
        assert "jaipur" in slugs
        assert "goa" in slugs

        # Verify unapproved dynamic destinations are NOT in the explore catalogue
        assert "indore" not in slugs
        assert "bhopal" not in slugs
        assert "resolven" not in slugs
        assert "london" not in slugs
        assert "new-york" not in slugs

@pytest.mark.asyncio
async def test_search_and_resolve_does_not_mutate_database():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        db: Session = SessionLocal()
        count_before = db.query(Destination).count()
        db.close()

        # Perform live search for unseeded destination
        r_search = await client.get("/api/v1/destinations/search?q=indore")
        assert r_search.status_code == 200
        results = r_search.json()
        assert len(results) > 0
        assert "indore" in results[0]["name"].lower()

        # Perform resolve
        r_resolve = await client.post("/api/v1/destinations/resolve?query=indore")
        assert r_resolve.status_code == 200
        resolve_data = r_resolve.json()
        assert resolve_data["is_curated"] is False
        assert resolve_data["is_dynamic"] is True

        # Perform dynamic destination detail fetch
        r_detail = await client.get("/api/v1/destinations/indore")
        assert r_detail.status_code == 200
        detail_data = r_detail.json()
        assert detail_data["is_curated"] is False
        assert detail_data["is_dynamic"] is True
        assert detail_data["destination"]["name"] == "Indore"

        # Verify DB count has NOT increased
        db = SessionLocal()
        count_after = db.query(Destination).count()
        assert count_after == count_before
        indore_in_db = db.query(Destination).filter(Destination.slug == "indore").first()
        assert indore_in_db is None
        db.close()

        # Verify explore catalogue still contains only curated items
        r_explore = await client.get("/api/v1/destinations")
        explore_slugs = [d["slug"] for d in r_explore.json()]
        assert "indore" not in explore_slugs
