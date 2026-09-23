import pytest
import os
from app.providers.geocoding_provider import LiveGeocodingProvider
from app.providers.artwork_provider import CuratedArtworkProvider
from app.models.models import Destination, Place
from app.database.session import SessionLocal

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_single_tungnath_chandrashila_explore_destination(db):
    """1. Verify Tungnath-Chandrashila is exactly ONE curated Explore entry and no separate duplicate entries exist."""
    dest = db.query(Destination).filter(Destination.slug == "tungnath-chandrashila").first()
    assert dest is not None, "tungnath-chandrashila destination must exist in DB"
    assert "Tungnath" in dest.name and "Chandrashila" in dest.name
    assert dest.hindi_name == "तुंगनाथ–चंद्रशिला"
    assert dest.altitude_meters == 4000
    assert dest.is_featured is True

    # Ensure no separate orphan destinations exist for Tungnath or Chandrashila
    separate_tungnath = db.query(Destination).filter(Destination.slug == "tungnath").first()
    assert separate_tungnath is None, "Separate 'tungnath' destination should not exist"

    separate_chandrashila = db.query(Destination).filter(Destination.slug == "chandrashila").first()
    assert separate_chandrashila is None, "Separate 'chandrashila' destination should not exist"

def test_tungnath_chandrashila_places_structure(db):
    """2. Verify Tungnath Temple and Chandrashila Summit are 2 sequential places inside the combined experience."""
    dest = db.query(Destination).filter(Destination.slug == "tungnath-chandrashila").first()
    assert dest is not None

    places = db.query(Place).filter(Place.destination_id == dest.id).order_by(Place.name).all()
    assert len(places) == 2, f"Expected exactly 2 places in experience, got {len(places)}"
    
    place_slugs = {p.slug for p in places}
    assert "tungnath-temple" in place_slugs
    assert "chandrashila-summit" in place_slugs

    temple = next(p for p in places if p.slug == "tungnath-temple")
    assert "01" in temple.name
    assert temple.category == "Culture & Heritage"

    summit = next(p for p in places if p.slug == "chandrashila-summit")
    assert "02" in summit.name
    assert summit.category == "Nature & Trails"

@pytest.mark.asyncio
async def test_tungnath_chandrashila_search_aliases_resolution():
    """3. Verify all search aliases resolve to the ONE combined experience 'tungnath-chandrashila'."""
    geo_provider = LiveGeocodingProvider()
    aliases = [
        "Tungnath",
        "Tunganath",
        "Tungnath Temple",
        "Chandrashila",
        "Chandrashila Peak",
        "Chandrashila Summit",
        "Tungnath Chandrashila",
        "Tungnath–Chandrashila Trek",
        "Tungnath-Chandrashila Trek",
        "Chopta Tungnath Chandrashila",
    ]

    for alias in aliases:
        res = await geo_provider.geocode(alias)
        assert res is not None, f"Geocode failed for alias '{alias}'"
        assert res["canonical_slug"] == "tungnath-chandrashila", f"Alias '{alias}' resolved to '{res.get('canonical_slug')}' instead of 'tungnath-chandrashila'"

@pytest.mark.asyncio
async def test_exact_artwork_registration_for_tungnath_and_chandrashila():
    """4. Verify exact artwork registration for Tungnath and Chandrashila in ArtworkProvider."""
    art_provider = CuratedArtworkProvider()
    
    temple_art = await art_provider.resolve_place_artwork(
        place_name="01 — Tungnath Temple",
        destination_name="Tungnath–Chandrashila Trek",
        category="Culture & Heritage"
    )
    assert temple_art["tier"] == "exact_place"
    assert "tungnath-temple" in temple_art["image_url"]
    assert temple_art.get("semantic_category") == "spiritual" or temple_art.get("metadata", {}).get("semantic_theme") == "spiritual"

    summit_art = await art_provider.resolve_place_artwork(
        place_name="02 — Chandrashila Summit",
        destination_name="Tungnath–Chandrashila Trek",
        category="Nature & Trails"
    )
    assert summit_art["tier"] == "exact_place"
    assert "chandrashila-summit" in summit_art["image_url"]
    assert summit_art.get("semantic_category") == "viewpoint" or summit_art.get("metadata", {}).get("semantic_theme") == "viewpoint"

    # Must NOT collide
    assert temple_art["image_url"] != summit_art["image_url"]

@pytest.mark.asyncio
async def test_jaipur_landmark_artwork_separation():
    """5. Verify Nahargarh Fort and Amber Fort in Jaipur receive completely distinct artwork."""
    art_provider = CuratedArtworkProvider()

    nahargarh = await art_provider.resolve_place_artwork(
        place_name="Nahargarh Fort Sunset Bastion",
        destination_name="Jaipur",
        category="Culture & Heritage"
    )
    amber = await art_provider.resolve_place_artwork(
        place_name="Amber Fort & Maota Lake",
        destination_name="Jaipur",
        category="Culture & Heritage"
    )

    assert nahargarh["tier"] == "exact_place"
    assert amber["tier"] == "exact_place"
    assert nahargarh["image_url"] != amber["image_url"], "Nahargarh and Amber Fort must have different artwork URLs"
    assert "nahargarh" in nahargarh["image_url"]
    assert "amber" in amber["image_url"]

@pytest.mark.asyncio
async def test_varanasi_stay_artwork_provenance():
    """6. Verify Varanasi stay artwork does not receive unrelated mountain or desert artwork."""
    art_provider = CuratedArtworkProvider()

    brijrama = await art_provider.resolve_place_artwork(
        place_name="BrijRama Palace River Heritage",
        destination_name="Varanasi",
        category="Stay"
    )
    assert "himalayan" not in brijrama["image_url"].lower()
    assert "desert" not in brijrama["image_url"].lower()
    assert "manali" not in brijrama["image_url"].lower()
    assert "rishikesh" not in brijrama["image_url"].lower()
    assert brijrama.get("semantic_category") == "stay" or brijrama.get("metadata", {}).get("semantic_theme") == "stay"
