import os
import sys
import hashlib
import pytest
from collections import defaultdict

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.providers.artwork_provider import CuratedArtworkProvider
from app.seed.canonical_dataset import (
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)

FRONTEND_PUBLIC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public"))

def get_file_hash(rel_path: str) -> str:
    full_path = os.path.join(FRONTEND_PUBLIC, rel_path.lstrip("/"))
    assert os.path.exists(full_path), f"Asset missing on disk: {full_path}"
    with open(full_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


@pytest.mark.asyncio
async def test_no_duplicate_place_images():
    """1. Ensure all 208 curated place image files have unique content hashes."""
    hashes = defaultdict(list)
    for dest, places in ADDITIONAL_PLACES_BY_DEST.items():
        assert len(places) == 8, f"Destination {dest} must have exactly 8 curated places"
        for p in places:
            img = p.get("image_url")
            assert img, f"Place {p['name']} missing image_url"
            h = get_file_hash(img)
            hashes[h].append((dest, p["name"], img))

    duplicates = {h: items for h, items in hashes.items() if len(items) > 1}
    assert len(duplicates) == 0, f"Found duplicate place images: {duplicates}"


@pytest.mark.asyncio
async def test_no_duplicate_hotel_images():
    """2. Ensure all 104 curated hotel image files have unique content hashes."""
    hashes = defaultdict(list)
    for dest, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
        assert len(hotels) == 4, f"Destination {dest} must have exactly 4 curated hotels"
        for h in hotels:
            img = h.get("image_url")
            assert img, f"Hotel {h['name']} missing image_url"
            h_hash = get_file_hash(img)
            hashes[h_hash].append((dest, h["name"], img))

    duplicates = {h: items for h, items in hashes.items() if len(items) > 1}
    assert len(duplicates) == 0, f"Found duplicate hotel images: {duplicates}"


@pytest.mark.asyncio
async def test_hotel_artwork_is_property_specific():
    """3. Verify hotel resolver returns property-specific artwork for every curated hotel across all 26 destinations."""
    provider = CuratedArtworkProvider()
    for dest, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
        dest_hotel_images = set()
        for h in hotels:
            res = await provider.resolve_place_artwork(
                place_name=h["name"],
                destination_name=dest,
                category="Stays & Sanctuaries",
                existing_image_url=h.get("image_url")
            )
            assert res["tier"] == "exact_place", f"Hotel {h['name']} failed exact resolution: {res}"
            assert "/categories/" not in res["image_url"], f"Hotel {h['name']} fell back to category image: {res['image_url']}"
            assert res["image_url"] not in dest_hotel_images, f"Duplicate hotel image in {dest}: {res['image_url']}"
            dest_hotel_images.add(res["image_url"])


@pytest.mark.asyncio
async def test_places_resolver_never_overridden_by_category_art():
    """4. Verify place resolver returns exact curated place artwork for all 208 places even when called without existing_image_url."""
    provider = CuratedArtworkProvider()
    for dest, places in ADDITIONAL_PLACES_BY_DEST.items():
        dest_place_images = set()
        for p in places:
            res = await provider.resolve_place_artwork(
                place_name=p["name"],
                destination_name=dest,
                category=p.get("category", "Must Visit"),
                existing_image_url=None  # Test pure resolver lookup
            )
            assert res["tier"] == "exact_place", f"Place {p['name']} in {dest} failed exact resolution: {res}"
            assert "/categories/" not in res["image_url"], f"Place {p['name']} fell back to category art: {res['image_url']}"
            assert res["image_url"] not in dest_place_images, f"Duplicate place image in {dest}: {res['image_url']}"
            dest_place_images.add(res["image_url"])


@pytest.mark.asyncio
async def test_no_cross_destination_visual_leakage():
    """5. Verify that artwork resolved for a destination never leaks from another destination."""
    provider = CuratedArtworkProvider()
    for dest, places in ADDITIONAL_PLACES_BY_DEST.items():
        for p in places:
            res = await provider.resolve_place_artwork(
                place_name=p["name"],
                destination_name=dest,
                category=p.get("category", "Must Visit"),
                existing_image_url=p.get("image_url")
            )
            url = res["image_url"]
            if "/images/places/" in url and "/universal/" not in url:
                assert f"/{dest}/" in url or f"/{dest}." in url, f"Place {p['name']} in {dest} received asset from another destination: {url}"


@pytest.mark.asyncio
async def test_rentals_have_valid_and_distinct_assets():
    """6. Verify all 61 canonical rentals have valid, non-fallback vehicle artwork."""
    for dest, rentals in ADDITIONAL_RENTALS_BY_DEST.items():
        assert len(rentals) >= 1, f"Destination {dest} missing rentals"
        for r in rentals:
            img = r.get("image_url")
            assert img, f"Rental {r['vehicle_name']} in {dest} missing image_url"
            assert not img.endswith("universal_mobility.jpg"), f"Rental {r['vehicle_name']} using universal fallback"
            assert os.path.exists(os.path.join(FRONTEND_PUBLIC, img.lstrip("/"))), f"Rental file missing: {img}"
