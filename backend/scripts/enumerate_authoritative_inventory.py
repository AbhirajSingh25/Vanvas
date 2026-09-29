import os
import sys
import json
import re
import hashlib
from pathlib import Path
from PIL import Image

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
PUBLIC_DIR = ROOT_DIR / "frontend" / "public"
sys.path.insert(0, str(BACKEND_DIR))

from app.seed.canonical_dataset import (
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)

def slugify(s: str) -> str:
    s = s.lower().strip()
    s = s.replace("&", "and").replace("'", "").replace("’", "")
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")

dest_lookup = {d["slug"]: d for d in CANONICAL_26_DESTINATIONS}

inventory = []

# 1. Places (208)
for dest_slug, places in ADDITIONAL_PLACES_BY_DEST.items():
    dest = dest_lookup.get(dest_slug, {"name": dest_slug.title(), "region": "", "state": ""})
    for p in places:
        pslug = p.get("slug") or slugify(p["name"])
        existing_img = p.get("image_url", "")
        if existing_img and existing_img.startswith("/images/places/"):
            artwork_path = existing_img
            if not artwork_path.endswith(".webp"):
                artwork_path = str(Path(artwork_path).with_suffix(".webp")).replace("\\", "/")
        else:
            artwork_path = f"/images/places/{dest_slug}/{pslug}.webp"
            
        # Check if file exists
        local_file = PUBLIC_DIR / artwork_path.lstrip("/")
        if not local_file.exists():
            # Check for jpg
            jpg_file = local_file.with_suffix(".jpg")
            if jpg_file.exists():
                local_file = jpg_file
                artwork_path = str(Path(artwork_path).with_suffix(".webp")).replace("\\", "/")
        
        file_hash = ""
        gen_status = "verified"
        if local_file.exists():
            file_hash = hashlib.sha256(local_file.read_bytes()).hexdigest()[:16]
        else:
            gen_status = "pending"

        inventory.append({
            "entity_id": f"place-{dest_slug}-{pslug}",
            "entity_type": "place",
            "destination": dest_slug,
            "destination_name": dest["name"],
            "entity_name": p["name"],
            "slug": pslug,
            "category": p.get("category", "Nature & Trails"),
            "description": p.get("description", ""),
            "tags": p.get("tags", ""),
            "latitude": p.get("latitude"),
            "longitude": p.get("longitude"),
            "reference_source": f"VANVAS Verified Landmark Reference: {p['name']}, {dest['name']}",
            "artwork_path": artwork_path,
            "artwork_generation_status": gen_status,
            "artwork_content_hash": file_hash,
            "property_identity": None,
            "vehicle_model": None
        })

# 2. Hotels / Stays (104)
for dest_slug, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
    dest = dest_lookup.get(dest_slug, {"name": dest_slug.title(), "region": "", "state": ""})
    for h in hotels:
        hslug = h.get("slug") or slugify(h["name"])
        existing_img = h.get("image_url", "")
        if existing_img and existing_img.startswith("/images/places/"):
            artwork_path = existing_img
            if not artwork_path.endswith(".webp"):
                artwork_path = str(Path(artwork_path).with_suffix(".webp")).replace("\\", "/")
        else:
            artwork_path = f"/images/places/{dest_slug}/stays/{hslug}.webp"
            
        local_file = PUBLIC_DIR / artwork_path.lstrip("/")
        if not local_file.exists():
            jpg_file = local_file.with_suffix(".jpg")
            if jpg_file.exists():
                local_file = jpg_file
                artwork_path = str(Path(artwork_path).with_suffix(".webp")).replace("\\", "/")

        file_hash = ""
        gen_status = "verified"
        if local_file.exists():
            file_hash = hashlib.sha256(local_file.read_bytes()).hexdigest()[:16]
        else:
            gen_status = "pending"

        inventory.append({
            "entity_id": f"hotel-{dest_slug}-{hslug}",
            "entity_type": "hotel",
            "destination": dest_slug,
            "destination_name": dest["name"],
            "entity_name": h["name"],
            "slug": hslug,
            "category": h.get("property_type") or h.get("category", "Heritage Stay"),
            "description": h.get("description", ""),
            "tags": h.get("tags", ""),
            "latitude": h.get("latitude"),
            "longitude": h.get("longitude"),
            "reference_source": f"VANVAS Verified Stay Reference: {h['name']}, {dest['name']}",
            "artwork_path": artwork_path,
            "artwork_generation_status": gen_status,
            "artwork_content_hash": file_hash,
            "property_identity": h.get("property_type") or h.get("name"),
            "vehicle_model": None
        })

# 3. Rentals (53)
for dest_slug, rentals in ADDITIONAL_RENTALS_BY_DEST.items():
    dest = dest_lookup.get(dest_slug, {"name": dest_slug.title(), "region": "", "state": ""})
    for r in rentals:
        r_name = r.get("vehicle_name") or r.get("name")
        rslug = r.get("slug") or slugify(r_name)
        existing_img = r.get("image_url", "")
        if existing_img:
            stem = Path(existing_img).stem
            artwork_path = f"/images/vehicles/{stem}.webp"
        else:
            clean_m = slugify(r_name)
            artwork_path = f"/images/vehicles/{dest_slug}_{clean_m}.webp"
            
        local_file = PUBLIC_DIR / artwork_path.lstrip("/")
        if not local_file.exists():
            jpg_file = local_file.with_suffix(".jpg")
            if jpg_file.exists():
                local_file = jpg_file
                artwork_path = str(Path(artwork_path).with_suffix(".webp")).replace("\\", "/")

        file_hash = ""
        gen_status = "verified"
        if local_file.exists():
            file_hash = hashlib.sha256(local_file.read_bytes()).hexdigest()[:16]
        else:
            gen_status = "pending"

        inventory.append({
            "entity_id": f"rental-{dest_slug}-{rslug}",
            "entity_type": "rental",
            "destination": dest_slug,
            "destination_name": dest["name"],
            "entity_name": r_name,
            "slug": rslug,
            "category": r.get("vehicle_type", "Vehicle Rental"),
            "description": r.get("description", "") or f"{r_name} in {dest['name']}",
            "tags": r.get("fuel_type", ""),
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "reference_source": f"VANVAS Verified Mobility Reference: {r_name}, {dest['name']}",
            "artwork_path": artwork_path,
            "artwork_generation_status": gen_status,
            "artwork_content_hash": file_hash,
            "property_identity": None,
            "vehicle_model": r_name
        })

output_file = BACKEND_DIR / "authoritative_entity_inventory.json"
output_file.write_text(json.dumps(inventory, indent=2, ensure_ascii=False), encoding="utf-8")

# Also write to frontend/public/entity_art_manifest.json as required by section 9
manifest_frontend = ROOT_DIR / "frontend" / "public" / "entity_art_manifest.json"
manifest_frontend.write_text(json.dumps(inventory, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"Generated Authoritative Inventory with {len(inventory)} entities.")
places_count = sum(1 for x in inventory if x['entity_type'] == 'place')
hotels_count = sum(1 for x in inventory if x['entity_type'] == 'hotel')
rentals_count = sum(1 for x in inventory if x['entity_type'] == 'rental')
verified_count = sum(1 for x in inventory if x['artwork_generation_status'] == 'verified')
print(f"Places: {places_count}, Hotels: {hotels_count}, Rentals: {rentals_count}")
print(f"Verified & on-disk: {verified_count} / {len(inventory)}")
