import os
import hashlib
import pytest
from app.seed.canonical_dataset import (
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)

FRONTEND_PUBLIC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public"))

def test_zero_image_collision_across_all_canonical_places():
    """Verify that every place in canonical_dataset resolves to a distinct, non-colliding image."""
    hash_to_places = {}
    missing = []

    for dest_slug, places in ADDITIONAL_PLACES_BY_DEST.items():
        for p in places:
            img = (p.get("image_url") or "").lstrip("/")
            disk_path = os.path.join(FRONTEND_PUBLIC, img)
            if not os.path.exists(disk_path):
                missing.append((dest_slug, p.get("name"), img))
            else:
                with open(disk_path, "rb") as f:
                    file_hash = hashlib.sha256(f.read()).hexdigest()[:10]
                if file_hash not in hash_to_places:
                    hash_to_places[file_hash] = []
                hash_to_places[file_hash].append((dest_slug, p.get("name"), img))

    assert len(missing) == 0, f"Found {len(missing)} missing place images: {missing[:5]}"

    # Check for duplicate hashes across different entities
    collisions = {h: items for h, items in hash_to_places.items() if len(items) > 1}
    assert len(collisions) == 0, f"Found {len(collisions)} hash collisions: {list(collisions.items())[:5]}"

def test_vashistha_cave_distinct_authentic_asset():
    """Verify Rishikesh Vashistha Cave has its dedicated, authentic asset with no collision."""
    vashistha_path = os.path.join(FRONTEND_PUBLIC, "images", "places", "rishikesh", "vashistha-cave.webp")
    rajaji_path = os.path.join(FRONTEND_PUBLIC, "images", "places", "rishikesh", "rajaji-national-park-chilla.webp")

    assert os.path.exists(vashistha_path), "vashistha-cave.webp must exist"
    assert os.path.exists(rajaji_path), "rajaji-national-park-chilla.webp must exist"

    with open(vashistha_path, "rb") as f1, open(rajaji_path, "rb") as f2:
        h1 = hashlib.sha256(f1.read()).hexdigest()
        h2 = hashlib.sha256(f2.read()).hexdigest()

    assert h1 != h2, "Vashistha Cave and Rajaji National Park must not share image content"

def test_existing_mp4_reels_exist_and_non_empty():
    """Verify all 12 field video MP4 reels exist on disk and have valid video sizes (> 100KB)."""
    expected_reels = [
        "dharamshala_bhagsunag_falls.mp4",
        "dharamshala_namgyal_monastery.mp4",
        "dharamshala_triund_trek.mp4",
        "jaipur_amber_fort.mp4",
        "kainchi_ashram_morning.mp4",
        "kainchi_bhimtal_lake.mp4",
        "kainchi_sattal_lakes.mp4",
        "manali_hadimba_loop.mp4",
        "manali_jogini_falls.mp4",
        "manali_solang_valley.mp4",
        "rishikesh_beatles_ashram.mp4",
        "udaipur_pichola_cruise.mp4"
    ]

    reels_dir = os.path.join(FRONTEND_PUBLIC, "videos", "reels")
    assert os.path.exists(reels_dir), "videos/reels directory must exist"

    for reel in expected_reels:
        path = os.path.join(reels_dir, reel)
        assert os.path.exists(path), f"Reel {reel} must exist on disk"
        size = os.path.getsize(path)
        assert size > 100000, f"Reel {reel} size ({size} bytes) must be > 100KB"

def test_synchronized_two_row_carousel_component_exists():
    """Verify SynchronizedTwoRowCarousel component is present in frontend components."""
    comp_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "components", "ui", "SynchronizedTwoRowCarousel.tsx"))
    assert os.path.exists(comp_path), "SynchronizedTwoRowCarousel.tsx must exist"
    with open(comp_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "SynchronizedTwoRowCarousel" in content
    assert "pairedColumns" in content
    assert "data-carousel-col" in content

def test_featured_cards_component_exists():
    """Verify DestinationFeaturedCard component is present in frontend components."""
    comp_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "components", "destinations", "DestinationFeaturedCard.tsx"))
    assert os.path.exists(comp_path), "DestinationFeaturedCard.tsx must exist"
    with open(comp_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "FeaturedPlaceCard" in content
    assert "FeaturedStayCard" in content
    assert "FeaturedVehicleCard" in content
