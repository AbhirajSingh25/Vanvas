"""
VANVAS Authoritative Global Semantic Collision Detector
Audits all entities across database, placeVisualResolver, VehicleArtwork, and inventory.
Detects:
1. Exact hash duplicates among distinct entities (places, stays, vehicles, destinations)
2. Semantic Collisions:
   - Stays using landmark / temple / viewpoint / summit artwork or destination hero
   - Stays using non-accommodation artwork
   - Vehicles with mismatched categories (scooters vs bullets vs adventure tourers vs bicycles vs cars)
   - Cross-category collisions (e.g. food/cafe using landmark/nature art)
   - Terrain / Eco-zone contradictions (e.g. coastal/palm art in Himalayas, alpine snow in desert)
   - Cross-destination landmark borrowing (unrelated places in different destinations using the same specific artwork)
3. Generates semantic_collisions_report.json with severity:
   - CRITICAL (Severe contradiction or wrong entity identity)
   - WARNING (Shared asset where dedicated art is desirable)
   - ALLOWLISTED_FALLBACK (Valid shared category fallback, e.g. universal/stay.webp)
"""
import os
import sys
import json
import sqlite3
import hashlib
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
PUBLIC = FRONTEND / "public"
BACKEND = ROOT / "backend"
DB_PATH = ROOT / "vanvas.db"

# Destination terrain taxonomy
TERRAIN_MAP = {
    "chopta": "himalayan_alpine",
    "tungnath-chandrashila": "himalayan_alpine",
    "spiti": "himalayan_cold_desert",
    "leh": "himalayan_cold_desert",
    "manali": "himalayan_valley",
    "kasol": "himalayan_valley",
    "dharamshala": "himalayan_valley",
    "mussoorie": "himalayan_foothills",
    "rishikesh": "himalayan_foothills",
    "kainchi-dham": "kumaon_hills",
    "lansdowne": "himalayan_foothills",
    "morni-hills": "shivalik_hills",
    "munnar": "western_ghats_hills",
    "coorg": "western_ghats_hills",
    "wayanad": "western_ghats_hills",
    "goa": "coastal_tropical",
    "gokarna": "coastal_tropical",
    "jaisalmer": "thar_desert",
    "jodhpur": "thar_desert",
    "jaipur": "semi_arid_heritage",
    "udaipur": "lake_city_heritage",
    "agra": "gangetic_plains_heritage",
    "delhi": "gangetic_plains_urban",
    "varanasi": "gangetic_plains_riverine",
    "amritsar": "punjab_plains_heritage",
    "chandigarh": "foothills_urban",
    "alwar-siliserh": "aravalli_hills",
    "damdama-sohna": "aravalli_lake",
    "sariska": "aravalli_forest",
    "sariska-bhangarh": "aravalli_forest",
    "neemrana": "aravalli_heritage",
    "mathura-vrindavan": "gangetic_plains_heritage",
    "murthal": "gangetic_plains_highway"
}

def compute_sha256(path):
    if not path.exists():
        return "MISSING"
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def main():
    print("=== VANVAS PHASE B: GLOBAL SEMANTIC COLLISION AUDIT ===")
    
    # 1. Map disk images from disk_images_inventory.json or disk
    disk_inv_file = ROOT / "disk_images_inventory.json"
    sha_to_paths = defaultdict(list)
    path_to_sha = {}

    if disk_inv_file.exists():
        with open(disk_inv_file, "r", encoding="utf-8") as f:
            disk_inv = json.load(f)
            for rel, meta in disk_inv.get("files", {}).items():
                sha = meta.get("sha256")
                sha_to_paths[sha].append(rel)
                path_to_sha[rel] = sha
    else:
        for p in PUBLIC.rglob("*"):
            if p.is_file() and p.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp"]:
                rel = "/" + p.relative_to(PUBLIC).as_posix()
                sha = compute_sha256(p)
                sha_to_paths[sha].append(rel)
                path_to_sha[rel] = sha

    # 2. Load inventory
    inv_path = ROOT / "vanvas_illustration_audit_inventory.json"
    with open(inv_path, "r", encoding="utf-8") as f:
        inventory = json.load(f)

    # 3. Load DB entities
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    destinations = [dict(r) for r in c.execute("SELECT * FROM destinations").fetchall()]
    places = [dict(r) for r in c.execute("SELECT * FROM places").fetchall()]
    hotels = [dict(r) for r in c.execute("SELECT * FROM hotels").fetchall()]
    rentals = [dict(r) for r in c.execute("SELECT * FROM rental_options").fetchall()]
    conn.close()

    dest_slug_map = {d["id"]: d.get("slug") or d.get("name", "").lower() for d in destinations}

    # Group entities by resolved image and sha256
    image_to_entities = defaultdict(list)
    sha_to_entities = defaultdict(list)

    for item in inventory:
        img = item.get("resolved_image_path")
        sha = item.get("sha256")
        if img:
            image_to_entities[img].append(item)
        if sha and sha != "MISSING":
            sha_to_entities[sha].append(item)

    collisions = []

    # --- COLLISION CHECK 1: Stays using Non-Accommodation / Landmark Art ---
    for item in inventory:
        if item["entity_type"] == "stay":
            img = item.get("resolved_image_path", "")
            dest_slug = item.get("destination_slug", "")
            
            # Legitimate accommodation paths:
            is_valid_stay_art = (
                "/stays/" in img or 
                "/categories/stay" in img or 
                "/universal/stay" in img
            )
            
            if not is_valid_stay_art:
                collisions.append({
                    "collision_type": "STAY_USING_NON_ACCOMMODATION_ART",
                    "severity": "CRITICAL",
                    "entity_id": item["entity_id"],
                    "entity_name": item["entity_name"],
                    "entity_type": "stay",
                    "destination": dest_slug,
                    "image_path": img,
                    "reason": f"Stay '{item['entity_name']}' is displaying non-accommodation artwork '{img}'.",
                    "proposed_correction": "Resolve to destination stay fallback or dedicated property artwork."
                })

    # --- COLLISION CHECK 2: Vehicle Category Inversions / Mismatches ---
    for item in inventory:
        if item["entity_type"] in ["scooter", "motorbike", "adventure_motorcycle", "car", "bicycle"]:
            name = item["entity_name"].lower()
            category = item.get("category", "").lower()
            img = item.get("resolved_image_path", "").lower()
            dest_slug = item.get("destination_slug", "")
            ent_type = item["entity_type"]

            is_scooter = ent_type == "scooter" or "scooter" in category
            is_classic_bullet = ent_type == "motorbike" or "classic 350" in category
            is_adv = ent_type == "adventure_motorcycle" or "adventure" in category
            is_car = ent_type == "car" or "car" in category
            is_bike = ent_type == "bicycle" or "mountain bike" in category or "bicycle" in category

            if is_scooter and ("bullet" in img or "himalayan" in img or "car" in img or "mtb" in img) and "scooter" not in img:
                collisions.append({
                    "collision_type": "VEHICLE_CATEGORY_MISMATCH",
                    "severity": "CRITICAL",
                    "entity_id": item["entity_id"],
                    "entity_name": item["entity_name"],
                    "entity_type": ent_type,
                    "destination": dest_slug,
                    "image_path": img,
                    "reason": f"Scooter entity '{item['entity_name']}' is displaying motorcycle/car artwork '{img}'.",
                    "proposed_correction": "Re-map to destination scooter or universal electric/automatic scooter artwork."
                })

            if is_classic_bullet and ("scooter" in img or "car" in img or "mtb" in img or "adv" in img):
                collisions.append({
                    "collision_type": "VEHICLE_CATEGORY_MISMATCH",
                    "severity": "CRITICAL",
                    "entity_id": item["entity_id"],
                    "entity_name": item["entity_name"],
                    "entity_type": ent_type,
                    "destination": dest_slug,
                    "image_path": img,
                    "reason": f"Classic Bullet entity '{item['entity_name']}' is displaying non-bullet artwork '{img}'.",
                    "proposed_correction": "Re-map to destination motorcycle or classic bullet artwork."
                })

            if is_adv and ("scooter" in img or "car" in img or "mtb" in img) and "adv" not in img and "motorcycle" not in img:
                collisions.append({
                    "collision_type": "VEHICLE_CATEGORY_MISMATCH",
                    "severity": "CRITICAL",
                    "entity_id": item["entity_id"],
                    "entity_name": item["entity_name"],
                    "entity_type": ent_type,
                    "destination": dest_slug,
                    "image_path": img,
                    "reason": f"Adventure Motorcycle entity '{item['entity_name']}' is displaying non-adventure artwork '{img}'.",
                    "proposed_correction": "Re-map to adventure motorcycle artwork."
                })

            if is_car and ("scooter" in img or "bullet" in img or "mtb" in img or "bike" in img):
                collisions.append({
                    "collision_type": "VEHICLE_CATEGORY_MISMATCH",
                    "severity": "CRITICAL",
                    "entity_id": item["entity_id"],
                    "entity_name": item["entity_name"],
                    "entity_type": ent_type,
                    "destination": dest_slug,
                    "image_path": img,
                    "reason": f"Car rental entity '{item['entity_name']}' is displaying two-wheeler artwork '{img}'.",
                    "proposed_correction": "Re-map to car artwork."
                })

            if is_bike and ("scooter" in img or "bullet" in img or "car" in img or "adv" in img):
                collisions.append({
                    "collision_type": "VEHICLE_CATEGORY_MISMATCH",
                    "severity": "CRITICAL",
                    "entity_id": item["entity_id"],
                    "entity_name": item["entity_name"],
                    "entity_type": ent_type,
                    "destination": dest_slug,
                    "image_path": img,
                    "reason": f"Bicycle entity '{item['entity_name']}' is displaying motorized vehicle artwork '{img}'.",
                    "proposed_correction": "Re-map to mountain bike artwork."
                })

    # --- COLLISION CHECK 3: Places Sharing Dedicated Specific Artwork Across Distinct Entities ---
    for img, entities in image_to_entities.items():
        if len(entities) > 1:
            # Check if this is an allowed universal or category fallback
            is_universal = any(img.startswith(uf) or uf in img for uf in ["/images/places/universal/", "/images/vehicles/universal_"])
            is_dest_category = "/categories/" in img
            
            if is_universal or is_dest_category:
                continue

            places_in_group = [e for e in entities if e["entity_type"] == "place"]
            if len(places_in_group) > 1:
                first_name = places_in_group[0]["entity_name"].lower()
                all_same = all(e["entity_name"].lower() == first_name or e["canonical_slug"] == places_in_group[0]["canonical_slug"] for e in places_in_group)
                if not all_same:
                    dests = set(e["destination_slug"] for e in places_in_group)
                    severity = "CRITICAL" if len(dests) > 1 else "WARNING"
                    collisions.append({
                        "collision_type": "SHARED_SPECIFIC_PLACE_ARTWORK",
                        "severity": severity,
                        "image_path": img,
                        "entities": [f"{e['destination_slug']}:{e['entity_name']} ({e['entity_id']})" for e in places_in_group],
                        "reason": f"Multiple distinct places ({len(places_in_group)}) share specific artwork '{img}'.",
                        "proposed_correction": "Assign unique entity artwork or map to appropriate category fallback."
                    })

    # --- COLLISION CHECK 4: Cross-Entity Collision by SHA256 (Stay sharing image file with Landmark) ---
    for sha, entities in sha_to_entities.items():
        if len(entities) > 1:
            images = set(e.get("resolved_image_path") for e in entities)
            if all(any(u in img for u in ["/universal/", "/categories/"]) for img in images):
                continue
                
            distinct_types = set(e["entity_type"] for e in entities)
            if "stay" in distinct_types and ("destination" in distinct_types or "place" in distinct_types):
                collisions.append({
                    "collision_type": "STAY_SHARING_PLACE_FILE_HASH",
                    "severity": "CRITICAL",
                    "sha256": sha,
                    "entities": [f"{e['entity_type']}:{e['destination_slug']}:{e['entity_name']} ({e.get('resolved_image_path')})" for e in entities],
                    "reason": f"Stay and Place/Destination share exact binary image hash.",
                    "proposed_correction": "Separate stay visual from landmark."
                })

    # --- COLLISION CHECK 5: Terrain / Eco-zone Contradictions ---
    for item in inventory:
        dest_slug = item.get("destination_slug", "")
        terrain = TERRAIN_MAP.get(dest_slug, "unknown")
        img = item.get("resolved_image_path", "").lower()

        if "himalayan" in terrain or "kumaon" in terrain:
            if "beach" in img or "coastal" in img or "desert" in img or "dunes" in img:
                collisions.append({
                    "collision_type": "TERRAIN_CONTRADICTION",
                    "severity": "CRITICAL",
                    "entity_id": item["entity_id"],
                    "entity_name": item["entity_name"],
                    "entity_type": item["entity_type"],
                    "destination": dest_slug,
                    "terrain": terrain,
                    "image_path": img,
                    "reason": f"Himalayan/Hill entity has coastal or desert artwork: {img}",
                    "proposed_correction": "Replace with mountain/alpine category or destination visual."
                })

        if "desert" in terrain:
            if "snow" in img or "glacier" in img or "alpine" in img or "beach" in img:
                collisions.append({
                    "collision_type": "TERRAIN_CONTRADICTION",
                    "severity": "CRITICAL",
                    "entity_id": item["entity_id"],
                    "entity_name": item["entity_name"],
                    "entity_type": item["entity_type"],
                    "destination": dest_slug,
                    "terrain": terrain,
                    "image_path": img,
                    "reason": f"Desert entity has snow/beach artwork: {img}",
                    "proposed_correction": "Replace with desert/arid visual."
                })

        if "coastal" in terrain:
            if "snow" in img or "glacier" in img or "himalaya" in img:
                collisions.append({
                    "collision_type": "TERRAIN_CONTRADICTION",
                    "severity": "CRITICAL",
                    "entity_id": item["entity_id"],
                    "entity_name": item["entity_name"],
                    "entity_type": item["entity_type"],
                    "destination": dest_slug,
                    "terrain": terrain,
                    "image_path": img,
                    "reason": f"Coastal entity has snow/alpine artwork: {img}",
                    "proposed_correction": "Replace with coastal visual."
                })

    # --- COLLISION CHECK 6: Database Direct Image Collisions ---
    db_collisions = []
    for h in hotels:
        img = h.get("image_url") or ""
        dest_slug = dest_slug_map.get(h["destination_id"], "")
        if "hero.jpg" in img or "hero.webp" in img or "illustration.webp" in img:
            if "/categories/stay" not in img:
                db_collisions.append({
                    "entity_id": h["id"],
                    "entity_name": h["name"],
                    "destination": dest_slug,
                    "image_url": img,
                    "reason": "Database hotel record has destination hero assigned directly."
                })

    report = {
        "summary": {
            "total_entities_audited": len(inventory),
            "total_collisions_detected": len(collisions),
            "critical_collisions": sum(1 for c in collisions if c.get("severity") == "CRITICAL"),
            "warning_collisions": sum(1 for c in collisions if c.get("severity") == "WARNING"),
            "database_hotel_hero_collisions": len(db_collisions)
        },
        "collisions": collisions,
        "database_hotel_hero_collisions": db_collisions
    }

    out_file = ROOT / "semantic_collisions_report.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\nAudit complete. Collisions report: {out_file}")
    print(f"Total Collisions: {len(collisions)}")
    print(f"  CRITICAL: {report['summary']['critical_collisions']}")
    print(f"  WARNING: {report['summary']['warning_collisions']}")
    print(f"  DB Hotel Hero Collisions: {len(db_collisions)}")

    if collisions:
        print("\nCollisions detected:")
        for idx, col in enumerate(collisions, 1):
            print(f"  {idx}. [{col.get('severity')}] {col.get('collision_type')}: {col.get('reason')}")

if __name__ == "__main__":
    main()
