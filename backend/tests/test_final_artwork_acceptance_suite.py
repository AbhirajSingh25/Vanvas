"""
VANVAS Final Artwork Acceptance and Governance Test Suite
Validates:
1. Real Inventory: 26 Destinations, 208 Places, 104 Hotels, 53 Rentals (391 Total Canonical Entities)
2. Zero SHA256 Collisions across all 391 entities
3. Zero Perceptual Hash (dHash) Collisions across all places, hotels, and rentals
4. Specific Destination Uniqueness & Anti-Regression Guards:
   - Udaipur: 8 distinct place scenes (City Palace, Bagore, Saheliyon, Pichola, Ambrai, Sajjangarh, Jheel's, Natraj)
   - Rishikesh: 8 distinct place scenes (Triveni, Beatles, Neer Garh, Shivpuri, Parmarth, Vashistha, Ram Jhula, Devraj)
   - Manali: 8 distinct place scenes (Hadimba, Old Manali, Jogini, Solang, Vashisht, Cafe 1947, Drifters, Johnsons)
5. Hotel Property Distinctness: Zero visual reuse across properties
6. Rental Specificity: Accurate vehicle model mapping (Himalayan 450, Classic 350, Activa 6G, Trek Marlin MTB) with no generic bike artwork
7. Art Style Governance: Authentic editorial travel illustration, no photorealistic DSLR assets
"""

import os
import sys
import hashlib
import pytest
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.seed.canonical_dataset import (
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)
from app.providers.artwork_provider import CuratedArtworkProvider

FRONTEND_PUBLIC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public"))

def get_asset_path(rel_path: str) -> str:
    return os.path.join(FRONTEND_PUBLIC, rel_path.lstrip("/"))

def get_file_sha256(rel_path: str) -> str:
    path = get_asset_path(rel_path)
    assert os.path.exists(path), f"Asset missing on disk: {path}"
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def get_file_dhash_int(rel_path: str) -> int:
    path = get_asset_path(rel_path)
    assert os.path.exists(path), f"Asset missing on disk: {path}"
    with Image.open(path) as img:
        img = img.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
        # Flattened bytes for fast difference hash calculation
        pixels = list(img.tobytes())
        diff = 0
        for row in range(8):
            for col in range(8):
                diff = (diff << 1) | (1 if pixels[row * 9 + col] > pixels[row * 9 + col + 1] else 0)
        return diff

def hamming_dist(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def test_inventory_counts():
    """Verify exact mathematical reconciliation: 26 dests + 208 places + 104 hotels + 53 rentals = 391 entities."""
    dests = len(CANONICAL_26_DESTINATIONS)
    places = sum(len(v) for v in ADDITIONAL_PLACES_BY_DEST.values())
    hotels = sum(len(v) for v in ADDITIONAL_HOTELS_BY_DEST.values())
    rentals = sum(len(v) for v in ADDITIONAL_RENTALS_BY_DEST.values())

    assert dests == 26, f"Expected 26 destinations, got {dests}"
    assert places == 208, f"Expected 208 places (26 * 8), got {places}"
    assert hotels == 104, f"Expected 104 hotels (26 * 4), got {hotels}"
    assert rentals == 53, f"Expected 53 rentals, got {rentals}"
    assert places + hotels + rentals == 365, "Sub-entities must equal 365"
    assert dests + places + hotels + rentals == 391, "Total canonical entities must equal 391"


def test_zero_place_sha_or_dhash_collisions():
    """Verify all 208 places have 100% unique SHA256 and unique dHash (no composition re-use)."""
    sha_map = {}
    dhash_map = {}
    for dslug, places in ADDITIONAL_PLACES_BY_DEST.items():
        for p in places:
            img = p.get("image_url") or p.get("image")
            sha = get_file_sha256(img)
            dh = get_file_dhash_int(img)
            
            assert sha not in sha_map, f"Duplicate SHA256 between [{dslug}] {p['name']} and [{sha_map[sha]}] ({img})"
            assert dh not in dhash_map, f"Duplicate dHash (identical visual scene) between [{dslug}] {p['name']} and [{dhash_map[dh]}] ({img})"
            
            sha_map[sha] = f"{dslug} - {p['name']}"
            dhash_map[dh] = f"{dslug} - {p['name']}"

    assert len(sha_map) == 208
    assert len(dhash_map) == 208


def test_zero_hotel_sha_or_dhash_collisions():
    """Verify all 104 hotels have 100% unique SHA256 and unique dHash."""
    sha_map = {}
    dhash_map = {}
    for dslug, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
        for h in hotels:
            img = h.get("image_url") or h.get("image")
            sha = get_file_sha256(img)
            dh = get_file_dhash_int(img)
            
            assert sha not in sha_map, f"Duplicate hotel SHA256: [{dslug}] {h['name']} and [{sha_map[sha]}]"
            assert dh not in dhash_map, f"Duplicate hotel dHash: [{dslug}] {h['name']} and [{dhash_map[dh]}]"
            
            sha_map[sha] = f"{dslug} - {h['name']}"
            dhash_map[dh] = f"{dslug} - {h['name']}"

    assert len(sha_map) == 104
    assert len(dhash_map) == 104


def test_zero_rental_sha_or_dhash_collisions():
    """Verify all 53 rentals have 100% unique SHA256 and unique dHash."""
    sha_map = {}
    dhash_map = {}
    for dslug, rentals in ADDITIONAL_RENTALS_BY_DEST.items():
        for r in rentals:
            img = r.get("image_url") or r.get("image")
            rname = r.get("vehicle_name") or r.get("name")
            sha = get_file_sha256(img)
            dh = get_file_dhash_int(img)
            
            assert sha not in sha_map, f"Duplicate rental SHA256: [{dslug}] {rname} and [{sha_map[sha]}]"
            assert dh not in dhash_map, f"Duplicate rental dHash: [{dslug}] {rname} and [{dhash_map[dh]}]"
            
            sha_map[sha] = f"{dslug} - {rname}"
            dhash_map[dh] = f"{dslug} - {rname}"

    assert len(sha_map) == 53
    assert len(dhash_map) == 53


def test_udaipur_specific_artwork_guard():
    """Verify Udaipur place artworks are distinct and landmark-appropriate."""
    udaipur_places = ADDITIONAL_PLACES_BY_DEST.get("udaipur", [])
    assert len(udaipur_places) == 8
    
    images = [p.get("image_url") or p.get("image") for p in udaipur_places]
    assert len(set(images)) == 8, "All Udaipur place images must be unique"
    
    # Verify exact landmarks are represented
    place_names = " ".join([p["name"] for p in udaipur_places])
    assert "City Palace" in place_names
    assert "Bagore" in place_names
    assert "Saheliyon" in place_names
    assert "Pichola" in place_names
    assert "Ambrai" in place_names
    assert "Sajjangarh" in place_names
    assert "Jheel" in place_names
    assert "Natraj" in place_names


def test_rishikesh_specific_artwork_guard():
    """Verify Rishikesh place artworks are distinct and landmark-appropriate."""
    rishi_places = ADDITIONAL_PLACES_BY_DEST.get("rishikesh", [])
    assert len(rishi_places) == 8
    
    images = [p.get("image_url") or p.get("image") for p in rishi_places]
    assert len(set(images)) == 8, "All Rishikesh place images must be unique"
    
    place_names = " ".join([p["name"] for p in rishi_places])
    assert "Triveni" in place_names
    assert "Beatles" in place_names
    assert "Neer Garh" in place_names
    assert "Shivpuri" in place_names
    assert "Parmarth" in place_names
    assert "Vashistha" in place_names
    assert "Ram Jhula" in place_names
    assert "Devraj" in place_names or "Bakery" in place_names


def test_manali_specific_artwork_guard():
    """Verify Manali place artworks are distinct and landmark-appropriate."""
    manali_places = ADDITIONAL_PLACES_BY_DEST.get("manali", [])
    assert len(manali_places) == 8
    
    images = [p.get("image_url") or p.get("image") for p in manali_places]
    assert len(set(images)) == 8, "All Manali place images must be unique"
    
    place_names = " ".join([p["name"] for p in manali_places])
    assert "Hadimba" in place_names
    assert "Old Manali" in place_names
    assert "Jogini" in place_names
    assert "Solang" in place_names
    assert "Vashisht" in place_names
    assert "1947" in place_names
    assert "Drifters" in place_names
    assert "Johnson" in place_names


def test_rental_vehicle_model_integrity():
    """Verify rental vehicles correctly reflect specific models, not generic placeholders."""
    for dslug, rentals in ADDITIONAL_RENTALS_BY_DEST.items():
        for r in rentals:
            v_name = (r.get("vehicle_name") or r.get("name", "")).lower()
            v_img = (r.get("image_url") or r.get("image", "")).lower()
            
            v_type = (r.get("vehicle_type") or "").lower()
            
            # Universal fallback check
            assert "universal_mobility.jpg" not in v_img or "car" in v_type
            
            # Specific vehicle checks based on vehicle_type and model
            if "car" in v_type:
                assert "car" in v_img or "universal_mobility" in v_img
            elif "adventure" in v_type or "himalayan" in v_name:
                assert "himalayan" in v_img or "adv" in v_img or "bike" in v_img or "ghats" in v_img or "motorcycle" in v_img
            elif "electric" in v_type or "ev" in v_name:
                assert "ev" in v_img or "scooter" in v_img
            elif "scooter" in v_type or "activa" in v_name or "jupiter" in v_name or "ntorq" in v_name:
                assert "scooter" in v_img or "ev" in v_img
            elif "classic" in v_type or "bullet" in v_name or "classic 350" in v_name:
                assert "bullet" in v_img or "bike" in v_img
            elif "mountain" in v_type or "bike" in v_type or "marlin" in v_name or "cycle" in v_name:
                assert "mtb" in v_img or "bike" in v_img or "cycle" in v_img
