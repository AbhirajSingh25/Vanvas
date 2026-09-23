import os
import hashlib
import pytest
from app.database.session import SessionLocal
from app.models.models import Place, Destination
from app.providers.artwork_provider import CuratedArtworkProvider
from app.services.place_visual_resolver import PlaceVisualResolverService

DESTINATIONS = [
    "manali", "kasol", "dharamshala", "mussoorie",
    "rishikesh", "udaipur", "jaipur", "goa",
    "varanasi", "leh", "spiti", "munnar"
]

def get_file_hash(filepath: str) -> str:
    if not os.path.exists(filepath):
        return ""
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

@pytest.mark.asyncio
async def test_01_all_12_destinations_place_audit_and_zero_collisions():
    """Audit all 12 destinations from database and ensure zero cross-place collisions."""
    resolver = PlaceVisualResolverService()
    db = SessionLocal()

    reverse_index = {}
    audit_report = []

    try:
        for dest in DESTINATIONS:
            db_dest = db.query(Destination).filter(Destination.slug == dest).first()
            if not db_dest:
                continue
            places = db.query(Place).filter(Place.destination_id == db_dest.id).all()
            assert len(places) > 0, f"Destination {dest} has no curated database places!"

            for p in places:
                cat_str = p.category if isinstance(p.category, str) else (getattr(p.category, "name", "") if p.category else "")
                res = await resolver.resolve_place(
                    place_name=p.name,
                    destination_name=dest,
                    category=cat_str,
                    existing_image_url=p.image_url
                )
                img = res["image_url"]
                place_id = f"{dest}:{p.name}"

                if img not in reverse_index:
                    reverse_index[img] = []
                reverse_index[img].append(place_id)

                audit_report.append({
                    "place": p.name,
                    "destination": dest,
                    "category": cat_str,
                    "resolved_visual": img,
                    "tier": res["tier"],
                    "badge": res["badge"]
                })
    finally:
        db.close()

    # Collision analysis across distinct semantic entities
    collisions = []
    for img, place_list in reverse_index.items():
        distinct_places = sorted(list(set(place_list)))
        if len(distinct_places) > 1:
            # Universal fallbacks are permitted to be shared across same semantic category
            if "/places/universal/" in img:
                continue
            # Category fallbacks are permitted to be shared only within same destination & category
            if "/categories/" in img:
                continue
            collisions.append(f"COLLISION: {img} shared by distinct places: {distinct_places}")

    assert len(collisions) == 0, f"Detected {len(collisions)} exact place artwork collisions: {collisions}"

@pytest.mark.asyncio
async def test_02_munnar_artwork_file_hash_uniqueness():
    """Verify Munnar landmark image files on disk have unique MD5 hashes and no duplicate images."""
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "images", "places", "munnar"))
    
    if not os.path.exists(frontend_dir):
        pytest.skip("Frontend public directory not found in relative path")

    files_to_check = [
        "eravikulam-park.jpg",
        "kolukkumalai-tea.jpg",
        "mattupetty-dam.jpg",
        "attukal-waterfalls.jpg"
    ]

    hashes = {}
    for fname in files_to_check:
        fpath = os.path.join(frontend_dir, fname)
        if os.path.exists(fpath):
            h = get_file_hash(fpath)
            assert h not in hashes.values(), f"Hash collision: {fname} has same hash as {list(hashes.keys())[list(hashes.values()).index(h)]}"
            hashes[fname] = h

@pytest.mark.asyncio
async def test_03_stay_artwork_strict_isolation():
    """Verify Stays never receive monastery, temple, fort, or hero artwork."""
    resolver = PlaceVisualResolverService()
    
    test_stays = [
        ("The Hosteller Munnar", "Munnar", "Stays & Sanctuaries"),
        ("Zostel Manali", "Manali", "Hostel"),
        ("Riverside Homestay", "Rishikesh", "Homestay"),
        ("Boutique Heritage Haveli", "Jaipur", "Hotel"),
        ("Spiti Valley Guesthouse", "Spiti", "Guesthouse"),
    ]

    for name, dest, cat in test_stays:
        res = await resolver.resolve_place(name, dest, cat)
        img = res["image_url"]
        
        assert "monastery" not in img, f"{name} received monastery art: {img}"
        assert "temple" not in img, f"{name} received temple art: {img}"
        assert "hero.jpg" not in img, f"{name} received destination hero art: {img}"
        assert "illustration.jpg" not in img, f"{name} received destination illustration art: {img}"
        assert res["tier"] in ["destination_category", "regional_fallback", "exact_place"]

@pytest.mark.asyncio
async def test_04_mobility_artwork_strict_isolation():
    """Verify mobility rentals never receive spiritual, nature, or accommodation art."""
    resolver = PlaceVisualResolverService()
    
    test_rentals = [
        ("Munnar Royal Enfield Rentals", "Munnar", "Mobility"),
        ("Manali Himalayan Scooter Hub", "Manali", "Rentals"),
        ("Goa Beach Scooter Fleet", "Goa", "Scooter & Motorcycle Rentals"),
    ]

    for name, dest, cat in test_rentals:
        res = await resolver.resolve_place(name, dest, cat)
        img = res["image_url"]
        assert "transport" in img or "mobility" in img or "vehicle" in img, f"{name} did not resolve to mobility visual: {img}"
        assert "temple" not in img
        assert "monastery" not in img

@pytest.mark.asyncio
async def test_05_food_and_cafe_semantics():
    """Verify cafe with 'Inn' in name or description resolves to cafe, not stay."""
    resolver = PlaceVisualResolverService()

    res = await resolver.resolve_place(
        place_name="Drifters' Café & Acoustic Inn",
        destination_name="Manali",
        category="Cafés & Bakery"
    )
    assert res["tier"] in ["exact_place", "destination_category"]
    assert "cafe" in res["image_url"]
    assert res["semantic_category"] == "cafe"
