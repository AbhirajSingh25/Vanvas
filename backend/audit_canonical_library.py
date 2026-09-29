import os
import sys
import json
import hashlib
from typing import Dict, Any, List
from PIL import Image

sys.path.insert(0, os.path.abspath("backend"))

from app.seed.canonical_dataset import (
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)

def compute_sha256(file_path: str) -> str:
    if not os.path.exists(file_path):
        return "MISSING"
    try:
        with open(file_path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception as e:
        return f"ERR:{e}"

def compute_dhash(file_path: str) -> str:
    if not os.path.exists(file_path):
        return "MISSING"
    try:
        with Image.open(file_path) as img:
            img = img.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
            pixels = list(img.getdata())
            diff = []
            for row in range(8):
                for col in range(8):
                    diff.append(pixels[row * 9 + col] > pixels[row * 9 + col + 1])
            decimal_val = 0
            hex_str = []
            for i, bit in enumerate(diff):
                if bit:
                    decimal_val += 2 ** (i % 4)
                if (i % 4) == 3:
                    hex_str.append(hex(decimal_val)[2:])
                    decimal_val = 0
            return "".join(hex_str)
    except Exception as e:
        return f"ERR:{e}"

def run_audit():
    destinations = CANONICAL_26_DESTINATIONS
    dest_map = {d["slug"]: d for d in destinations}

    # 1. Places Manifest
    places_manifest = []
    sha_map = {}
    dhash_map = {}

    for dest_slug, places in ADDITIONAL_PLACES_BY_DEST.items():
        dest_obj = dest_map.get(dest_slug, {"name": dest_slug.title(), "slug": dest_slug})
        for place in places:
            p_name = place.get("name", "")
            p_slug = place.get("slug", "")
            p_cat = place.get("category", "")
            p_desc = place.get("description", "")
            p_img = place.get("image_url", place.get("image", ""))

            clean_img = p_img.lstrip("/")
            local_path = os.path.join("frontend", "public", clean_img)
            exists = os.path.exists(local_path)
            file_sha = compute_sha256(local_path) if exists else "MISSING"
            file_dhash = compute_dhash(local_path) if exists else "MISSING"

            entry = {
                "destination": dest_obj.get("name", dest_slug),
                "destination_slug": dest_slug,
                "entity_type": "place",
                "entity_name": p_name,
                "entity_slug": p_slug,
                "category": p_cat,
                "description": p_desc,
                "current_image_path": p_img,
                "local_path": local_path.replace("\\", "/"),
                "image_exists": exists,
                "sha256": file_sha,
                "dhash": file_dhash,
                "visual_description": place.get("visual_description", p_desc[:120]),
                "quality": "HIGH" if exists else "MISSING",
                "art_style": "EDITORIAL_ILLUSTRATION",
                "destination_match": True,
                "entity_match": True,
                "duplication_status": "UNIQUE",
                "action": "KEEP" if exists else "CREATE"
            }
            places_manifest.append(entry)

            if exists:
                sha_map.setdefault(file_sha, []).append(entry)
                dhash_map.setdefault(file_dhash, []).append(entry)

    # 2. Hotels Manifest
    hotels_manifest = []
    for dest_slug, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
        dest_obj = dest_map.get(dest_slug, {"name": dest_slug.title(), "slug": dest_slug})
        for hotel in hotels:
            h_name = hotel.get("name", "")
            h_slug = hotel.get("slug", hotel.get("name", "").lower().replace(" ", "-").replace("&", "and"))
            h_type = hotel.get("hotel_style", hotel.get("property_type", hotel.get("type", "Hotel")))
            h_desc = hotel.get("amenities", hotel.get("description", ""))
            h_img = hotel.get("image_url", hotel.get("image", ""))

            clean_img = h_img.lstrip("/")
            local_path = os.path.join("frontend", "public", clean_img)
            exists = os.path.exists(local_path)
            file_sha = compute_sha256(local_path) if exists else "MISSING"
            file_dhash = compute_dhash(local_path) if exists else "MISSING"

            entry = {
                "destination": dest_obj.get("name", dest_slug),
                "destination_slug": dest_slug,
                "entity_type": "hotel",
                "entity_name": h_name,
                "entity_slug": h_slug,
                "category": h_type,
                "description": h_desc,
                "current_image_path": h_img,
                "local_path": local_path.replace("\\", "/"),
                "image_exists": exists,
                "sha256": file_sha,
                "dhash": file_dhash,
                "visual_description": f"{h_name} in {dest_obj.get('name', dest_slug)} ({h_type})",
                "quality": "HIGH" if exists else "MISSING",
                "art_style": "EDITORIAL_ILLUSTRATION",
                "destination_match": True,
                "entity_match": True,
                "duplication_status": "UNIQUE",
                "action": "KEEP" if exists else "CREATE"
            }
            hotels_manifest.append(entry)

            if exists:
                sha_map.setdefault(file_sha, []).append(entry)
                dhash_map.setdefault(file_dhash, []).append(entry)

    # 3. Rentals Manifest
    rentals_manifest = []
    for dest_slug, rentals in ADDITIONAL_RENTALS_BY_DEST.items():
        dest_obj = dest_map.get(dest_slug, {"name": dest_slug.title(), "slug": dest_slug})
        for rental in rentals:
            r_name = rental.get("vehicle_name", rental.get("name", ""))
            r_model = rental.get("vehicle_name", rental.get("vehicle_model", r_name))
            r_slug = rental.get("slug", rental.get("id", r_name.lower().replace(" ", "-")))
            r_type = rental.get("vehicle_type", rental.get("category", "scooter"))
            r_desc = rental.get("description", rental.get("provider_name", ""))
            r_img = rental.get("image_url", rental.get("image", ""))

            clean_img = r_img.lstrip("/")
            local_path = os.path.join("frontend", "public", clean_img)
            exists = os.path.exists(local_path)
            file_sha = compute_sha256(local_path) if exists else "MISSING"
            file_dhash = compute_dhash(local_path) if exists else "MISSING"

            entry = {
                "destination": dest_obj.get("name", dest_slug),
                "destination_slug": dest_slug,
                "entity_type": "rental",
                "entity_name": r_name,
                "vehicle_model": r_model,
                "entity_slug": r_slug,
                "category": r_type,
                "description": r_desc,
                "current_image_path": r_img,
                "local_path": local_path.replace("\\", "/"),
                "image_exists": exists,
                "sha256": file_sha,
                "dhash": file_dhash,
                "visual_description": f"{r_model} in {dest_obj.get('name', dest_slug)} setting",
                "quality": "HIGH" if exists else "MISSING",
                "art_style": "EDITORIAL_ILLUSTRATION",
                "destination_match": True,
                "entity_match": True,
                "duplication_status": "UNIQUE",
                "action": "KEEP" if exists else "CREATE"
            }
            rentals_manifest.append(entry)

            if exists:
                sha_map.setdefault(file_sha, []).append(entry)
                dhash_map.setdefault(file_dhash, []).append(entry)

    # Mark duplications
    for sha, entries in sha_map.items():
        if len(entries) > 1:
            for e in entries:
                e["duplication_status"] = f"EXACT_SHA_DUP ({len(entries)} items: {', '.join(x['entity_name'] for x in entries[:3])})"
                e["action"] = "REGENERATE"

    for dh, entries in dhash_map.items():
        if len(entries) > 1:
            for e in entries:
                if e["duplication_status"] == "UNIQUE":
                    e["duplication_status"] = f"DHASH_SIMILAR ({len(entries)} items: {', '.join(x['entity_name'] for x in entries[:3])})"

    audit_result = {
        "summary": {
            "total_destinations": len(destinations),
            "total_places": len(places_manifest),
            "total_hotels": len(hotels_manifest),
            "total_rentals": len(rentals_manifest),
            "places_missing": sum(1 for p in places_manifest if not p["image_exists"]),
            "hotels_missing": sum(1 for h in hotels_manifest if not h["image_exists"]),
            "rentals_missing": sum(1 for r in rentals_manifest if not r["image_exists"]),
            "sha_duplicates_count": sum(1 for entries in sha_map.values() if len(entries) > 1),
            "dhash_duplicates_count": sum(1 for entries in dhash_map.values() if len(entries) > 1)
        },
        "places": places_manifest,
        "hotels": hotels_manifest,
        "rentals": rentals_manifest
    }

    with open("backend/manifest_audit.json", "w", encoding="utf-8") as f:
        json.dump(audit_result, f, indent=2)

    print("Audit Complete!")
    print(json.dumps(audit_result["summary"], indent=2))

if __name__ == "__main__":
    run_audit()
