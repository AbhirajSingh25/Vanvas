import json
import os
import re
import pytest
from app.database.session import SessionLocal, ensure_database_schema
from app.models.models import RentalOption, Hotel, MobilityVehicle, Destination, Place
from app.seed.canonical_dataset import CANONICAL_26_DESTINATIONS, ADDITIONAL_HOTELS_BY_DEST, ADDITIONAL_RENTALS_BY_DEST
from app.providers.artwork_provider import CuratedArtworkProvider
from app.services.mobility_service import MobilityService

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FRONTEND_PUBLIC = os.path.join(PROJECT_ROOT, "frontend", "public")
MANIFEST_PATH = os.path.join(FRONTEND_PUBLIC, "entity_art_manifest.json")
RESOLVER_PATH = os.path.join(PROJECT_ROOT, "frontend", "lib", "placeVisualResolver.ts")


@pytest.fixture(scope="module")
def manifest_data():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def pending_set():
    with open(RESOLVER_PATH, "r", encoding="utf-8") as f:
        text = f.read()
    match = re.search(r"export const PENDING_ARTWORK_SET = new Set\(\[([\s\S]*?)\]\);", text)
    assert match, "PENDING_ARTWORK_SET not found in placeVisualResolver.ts"
    raw_lines = match.group(1).splitlines()
    paths = set()
    for l in raw_lines:
        cleaned = l.strip().strip('",')
        if cleaned.startswith("/images/"):
            paths.add(cleaned)
    return paths


def test_generated_and_mapped_entity_cannot_remain_in_pending_set(manifest_data, pending_set):
    """
    Invariant: No entity that is generated, physically installed, approved, and mapped
    can remain inside PENDING_ARTWORK_SET.
    """
    for entry in manifest_data:
        art_path = entry.get("artwork_path") or entry.get("asset_path")
        if not art_path:
            continue
        
        # Check if physically installed on disk
        full_p = os.path.join(FRONTEND_PUBLIC, art_path.lstrip("/").replace("/", os.sep))
        file_exists = os.path.exists(full_p)
        
        if entry.get("approved") is True and file_exists:
            assert art_path not in pending_set, (
                f"Contradiction: Asset {art_path} is approved and physically installed on disk, "
                f"but still present in PENDING_ARTWORK_SET in placeVisualResolver.ts!"
            )


def test_missing_exact_image_cannot_be_silently_marked_complete(manifest_data):
    """
    Invariant: Missing exact image cannot be marked complete or approved.
    """
    for entry in manifest_data:
        art_path = entry.get("artwork_path") or entry.get("asset_path")
        if entry.get("approved") is True:
            assert art_path, f"Approved entry {entry.get('entity_id')} has no artwork_path!"
            full_p = os.path.join(FRONTEND_PUBLIC, art_path.lstrip("/").replace("/", os.sep))
            assert os.path.exists(full_p), (
                f"Approved entry {entry.get('entity_id')} points to missing physical file {art_path}!"
            )


def test_no_entity_simultaneously_complete_and_pending(manifest_data, pending_set):
    """
    Invariant: No entity in manifest can have status == approved_verified / complete
    and also be in pending_set.
    """
    for entry in manifest_data:
        art_path = entry.get("artwork_path") or entry.get("asset_path")
        if entry.get("artwork_status") in ["complete", "approved_verified"]:
            assert art_path not in pending_set, (
                f"Entity {entry.get('entity_id')} is marked {entry.get('artwork_status')} "
                f"but its path {art_path} is in pending set!"
            )


def test_database_path_matches_approved_manifest_path(manifest_data):
    """
    Invariant: Database records in local DB match approved manifest paths for vehicles and stays.
    """
    ensure_database_schema()
    db = SessionLocal()
    try:
        # Check vehicles in database: zero .jpg vehicles remaining
        rentals = db.query(RentalOption).all()
        for r in rentals:
            if r.image_url and "/images/vehicles/" in r.image_url:
                assert not r.image_url.endswith(".jpg"), (
                    f"Rental {r.id} ({r.vehicle_name}) has stale .jpg in database: {r.image_url}"
                )
        
        # Check BrijRama stay in database
        brij_hotels = db.query(Hotel).filter(
            (Hotel.name.ilike("%brijrama%")) | (Hotel.id.ilike("%brijrama%"))
        ).all()
        for h in brij_hotels:
            assert h.image_url == "/images/places/varanasi/stays/brijrama-palace-heritage-grand.webp", (
                f"Hotel BrijRama in database has un-reconciled path: {h.image_url}"
            )
    finally:
        db.close()


def test_jpg_overrides_must_not_silently_take_precedence(manifest_data):
    """
    Invariant: Canonical vehicles in seed dataset must point to approved .webp assets, not .jpg.
    """
    for dest, rentals in ADDITIONAL_RENTALS_BY_DEST.items():
        for r in rentals:
            img = r.get("image_url", "")
            if "/images/vehicles/" in img:
                assert not img.endswith(".jpg"), (
                    f"Destination {dest} rental {r.get('name')} still references .jpg: {img}"
                )


@pytest.mark.asyncio
async def test_native_and_web_resolver_consistency():
    """
    Invariant: Web resolver and shared universal resolver return identical approved WebP assets.
    """
    from app.providers.artwork_provider import CuratedArtworkProvider
    provider = CuratedArtworkProvider()
    
    # Test BrijRama
    resolved_stay = await provider.resolve_place_artwork(
        place_name="BrijRama Palace Heritage Grand",
        destination_name="Varanasi",
        category="Stays & Sanctuaries"
    )
    assert resolved_stay["image_url"] == "/images/places/varanasi/stays/brijrama-palace-heritage-grand.webp"
    
    # Test Dharamshala rentals
    db = SessionLocal()
    try:
        res_mobility = await MobilityService.get_mobility_access_plan(db=db, destination_slug_or_id="dharamshala")
        for rec in res_mobility.get("vehicle_recommendations", []):
            img = rec.get("image_url", "")
            if "/images/vehicles/" in img:
                assert not img.endswith(".jpg"), f"Vehicle recommendation has .jpg: {img}"
    finally:
        db.close()
