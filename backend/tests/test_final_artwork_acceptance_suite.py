import os
import sys
import json
import hashlib
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"

def test_inventory_completeness():
    with open(BACKEND_DIR / "authoritative_entity_inventory.json", "r", encoding="utf-8") as f:
        inv = json.load(f)

    assert len(inv) == 365, f"Expected 365 entities, got {len(inv)}"
    
    places = [e for e in inv if e['entity_type'] == 'place']
    hotels = [e for e in inv if e['entity_type'] == 'hotel']
    rentals = [e for e in inv if e['entity_type'] == 'rental']
    
    assert len(places) == 208, f"Expected 208 places, got {len(places)}"
    assert len(hotels) == 104, f"Expected 104 hotels, got {len(hotels)}"
    assert len(rentals) == 53, f"Expected 53 rentals, got {len(rentals)}"
    
    # Check all 26 destinations
    destinations = set(e['destination'] for e in inv)
    assert len(destinations) == 26, f"Expected 26 destinations, got {len(destinations)}"
    
    # Check physical files exist and are unique
    paths = set()
    hashes = set()
    
    for e in inv:
        p = e['artwork_path']
        assert p not in paths, f"Duplicate artwork path found: {p} for {e['entity_id']}"
        paths.add(p)
        
        local_p = PUBLIC_DIR / p.lstrip('/')
        assert local_p.exists(), f"Physical file missing on disk: {local_p}"
        assert local_p.stat().st_size > 5000, f"File unexpectedly small: {local_p}"
        
        with open(local_p, 'rb') as f:
            chash = hashlib.md5(f.read()).hexdigest()
        assert chash not in hashes, f"Duplicate content hash found: {chash} for {local_p}"
        hashes.add(chash)
        
        # Verify Pillow can open image cleanly
        with Image.open(local_p) as im:
            w, h = im.size
            assert w >= 400 and h >= 250, f"Invalid dimensions {w}x{h} for {local_p}"

    print(f"\nALL 365 ENTITIES PASSED INTEGRITY & UNIQUENESS VERIFICATION!")
    print(f"Places: {len(places)}/208 dedicated")
    print(f"Hotels: {len(hotels)}/104 dedicated")
    print(f"Rentals: {len(rentals)}/53 dedicated")
    print(f"Total: {len(inv)}/365 dedicated")

if __name__ == '__main__':
    test_inventory_completeness()
