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
FRONTEND_APP = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "app"))
FRONTEND_COMPONENTS = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "components"))

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
    comp_path = os.path.join(FRONTEND_COMPONENTS, "ui", "SynchronizedTwoRowCarousel.tsx")
    assert os.path.exists(comp_path), "SynchronizedTwoRowCarousel.tsx must exist"
    with open(comp_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "SynchronizedTwoRowCarousel" in content
    assert "pairedColumns" in content
    assert "data-carousel-col" in content

def test_single_row_carousel_component_exists():
    """Verify SingleRowCarousel component is present and enforces single horizontal track."""
    comp_path = os.path.join(FRONTEND_COMPONENTS, "ui", "SingleRowCarousel.tsx")
    assert os.path.exists(comp_path), "SingleRowCarousel.tsx must exist"
    with open(comp_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "SingleRowCarousel" in content
    assert "data-carousel-item" in content
    # SingleRowCarousel must not use pairedColumns
    assert "pairedColumns" not in content

def test_featured_cards_component_exists():
    """Verify DestinationFeaturedCard component is present in frontend components."""
    comp_path = os.path.join(FRONTEND_COMPONENTS, "destinations", "DestinationFeaturedCard.tsx")
    assert os.path.exists(comp_path), "DestinationFeaturedCard.tsx must exist"
    with open(comp_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "FeaturedPlaceCard" in content
    assert "FeaturedStayCard" in content
    assert "FeaturedVehicleCard" in content

def test_strict_carousel_layout_rules_on_explore_page():
    """
    Enforce Non-Negotiable Layout Invariant:
    A. FAMOUS PLACES: Two synchronized rows (SynchronizedTwoRowCarousel).
    B. HOTELS & STAYS: Exactly ONE horizontal row (SingleRowCarousel).
    C. MOBILITY & RENTALS: Exactly ONE horizontal row (SingleRowCarousel).
    D. FOOD & RESTAURANTS: Exactly ONE horizontal row (SingleRowCarousel).
    """
    explore_page = os.path.join(FRONTEND_APP, "explore", "[slug]", "page.tsx")
    assert os.path.exists(explore_page), "explore/[slug]/page.tsx must exist"
    with open(explore_page, "r", encoding="utf-8") as f:
        content = f.read()

    # Places must use SynchronizedTwoRowCarousel
    assert "SynchronizedTwoRowCarousel" in content
    assert "Curated Sanctuaries & Landmarks" in content

    # Hotels must use SingleRowCarousel
    assert "SingleRowCarousel" in content
    assert "Remaining Stays & Retreats" in content
    assert "CURATED STAYS ROW" in content

    # Rentals must use SingleRowCarousel
    assert "Expedition Fleet & Rentals" in content
    assert "MOBILITY FLEET ROW" in content

    # Food must use SingleRowCarousel
    assert "Signature Gastronomy & Delicacies" in content
    assert "SIGNATURE FLAVOURS TRACK" in content

def test_strict_carousel_layout_rules_on_place_page():
    """
    Enforce Layout Invariant on /places/[id]:
    - Related places in two-row carousel.
    - Related food in one-row carousel.
    - Nearby hotels in one-row carousel.
    """
    place_page = os.path.join(FRONTEND_APP, "places", "[id]", "page.tsx")
    assert os.path.exists(place_page), "places/[id]/page.tsx must exist"
    with open(place_page, "r", encoding="utf-8") as f:
        content = f.read()

    # Attractions: SynchronizedTwoRowCarousel
    assert "<SynchronizedTwoRowCarousel" in content
    # Food & Stays: SingleRowCarousel
    assert "<SingleRowCarousel" in content
    assert "Where to Eat & Drink Nearby" in content
    assert "Verified Stays & Retreats Nearby" in content

def test_reels_single_active_video_and_visual_stories_fallback():
    """
    Verify DestinationReelsCarousel behavior:
    1. Pauses non-active videos.
    2. Respects document visibility / blur.
    3. Distinctly labels real videos as Video Reel and fallbacks as Visual Story.
    """
    reels_path = os.path.join(FRONTEND_COMPONENTS, "destinations", "DestinationReelsCarousel.tsx")
    assert os.path.exists(reels_path), "DestinationReelsCarousel.tsx must exist"
    with open(reels_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "video.pause()" in content
    assert "visibilitychange" in content
    assert "Video Reel" in content
    assert "Visual Story" in content
    assert "hasRealVideos" in content

def test_newly_generated_authentic_artwork_assets_exist():
    """Verify all newly generated painterly assets are present, high-res, and > 100KB."""
    new_assets = [
        "images/places/jaipur/hawa-mahal.webp",
        "images/places/jaipur/amber-fort.webp",
        "images/places/udaipur/city-palace-udaipur.webp",
        "images/places/dharamshala/hpca-stadium.webp",
        "images/places/dharamshala/kareri-lake-trek-base.webp",
        "images/places/dharamshala/naddi-sunset-viewpoint.webp",
        "images/places/manali/hadimba-temple.webp",
        "images/places/manali/rohtang-pass.webp",
        "images/places/leh/thiksey-monastery.webp",
        "images/places/leh/pangong-tso.webp",
        "images/places/leh/shanti-stupa.webp",
        "images/places/mussoorie/char-dukan-prakash-store.webp",
        "images/places/tungnath-chandrashila/chandrashila-summit.webp",
    ]

    for rel_path in new_assets:
        full_path = os.path.join(FRONTEND_PUBLIC, rel_path)
        assert os.path.exists(full_path), f"Asset {rel_path} must exist on disk"
        size = os.path.getsize(full_path)
        assert size > 100000, f"Asset {rel_path} size ({size} bytes) must be > 100KB"
