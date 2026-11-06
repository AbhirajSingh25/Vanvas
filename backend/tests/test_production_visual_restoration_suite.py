import os
import sys
import json
import hashlib
import re
import pytest

FRONTEND_PUBLIC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public"))
REELS_REGISTRY_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "lib", "destinationReelsRegistry.ts"))

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.seed.canonical_dataset import CANONICAL_26_DESTINATIONS


def get_file_hash(rel_path: str) -> str:
    full_path = os.path.join(FRONTEND_PUBLIC, rel_path.lstrip("/"))
    assert os.path.exists(full_path), f"Asset missing on disk: {full_path}"
    with open(full_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def test_key_monastery_canonical_asset_integrity():
    """Verify Key Monastery canonical asset exists on disk with Imagen 3 resolution."""
    key_monastery_path = os.path.join(FRONTEND_PUBLIC, "images", "places", "spiti", "key-monastery.webp")
    assert os.path.exists(key_monastery_path), "key-monastery.webp missing from disk"
    assert os.path.getsize(key_monastery_path) > 200_000, "key-monastery.webp is under 200KB (expected master render)"


def test_newly_generated_batch_assets_exist():
    """Verify all 12 newly generated production assets exist and are non-empty."""
    required_assets = [
        "images/places/spiti/key-monastery.webp",
        "images/places/spiti/chandra-taal.webp",
        "images/places/spiti/chicham-bridge.webp",
        "images/places/spiti/dhankar-monastery.webp",
        "images/places/spiti/langza-buddha.webp",
        "images/places/spiti/hikkim-post-office.webp",
        "images/places/varanasi/sarnath.webp",
        "images/places/varanasi/ramnagar-fort.webp",
        "images/places/varanasi/sankat-mochan-temple.webp",
        "images/places/varanasi/tulsi-manas-temple.webp",
        "images/places/varanasi/kashi-chat-bhandar.webp",
        "images/places/mussoorie/pari-tibba-fairies-hill.webp",
        "images/places/mussoorie/kempty-falls.webp",
    ]
    for rel in required_assets:
        fp = os.path.join(FRONTEND_PUBLIC, rel)
        assert os.path.exists(fp), f"Missing generated asset: {rel}"
        assert os.path.getsize(fp) > 50_000, f"Generated asset too small: {rel}"


def test_varanasi_duplicates_resolved():
    """Verify previously duplicated Varanasi places now have completely distinct content hashes."""
    sankat_h = get_file_hash("images/places/varanasi/sankat-mochan-temple.webp")
    corridor_h = get_file_hash("images/places/varanasi/kashi-vishwanath-corridor.webp")
    assert sankat_h != corridor_h, "Sankat Mochan Temple still collides with Kashi Vishwanath Corridor!"

    tulsi_h = get_file_hash("images/places/varanasi/tulsi-manas-temple.webp")
    kashi_h = get_file_hash("images/places/varanasi/kashi-vishwanath.webp")
    assert tulsi_h != kashi_h, "Tulsi Manas Temple still collides with Kashi Vishwanath Temple!"

    ramnagar_h = get_file_hash("images/places/varanasi/ramnagar-fort.webp")
    chet_singh_h = get_file_hash("images/places/varanasi/chet-singh-fort-ghat.webp")
    assert ramnagar_h != chet_singh_h, "Ramnagar Fort still collides with Chet Singh Fort Ghat!"


def test_all_26_canonical_destinations_have_visual_stories():
    """Verify that all 26 canonical destinations are defined in destinationReelsRegistry.ts."""
    assert os.path.exists(REELS_REGISTRY_PATH), "destinationReelsRegistry.ts not found"
    with open(REELS_REGISTRY_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract all top-level keys in DESTINATION_REELS_REGISTRY
    pattern = r'^\s*"?([a-z0-9\-]+)"?\s*:\s*\['
    found_keys = set(re.findall(pattern, content, re.MULTILINE))
    found_keys.discard("waypoints")
    found_keys.discard("itineraryStops")

    canonical_slugs = [d["slug"] for d in CANONICAL_26_DESTINATIONS]
    for slug in canonical_slugs:
        assert slug in found_keys, f"Canonical destination '{slug}' missing from DESTINATION_REELS_REGISTRY!"


def test_all_visual_stories_poster_images_exist_on_disk():
    """Verify that every posterUrl referenced in destinationReelsRegistry.ts exists on disk."""
    with open(REELS_REGISTRY_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    poster_pattern = r'posterUrl:\s*["\']([^"\']+)["\']'
    posters = re.findall(poster_pattern, content)
    assert len(posters) >= 26, f"Expected at least 26 posters, found {len(posters)}"

    for poster in posters:
        clean_path = poster.lstrip("/")
        full_path = os.path.join(FRONTEND_PUBLIC, clean_path)
        assert os.path.exists(full_path), f"Reels poster not found on disk: {poster} (checked {full_path})"

