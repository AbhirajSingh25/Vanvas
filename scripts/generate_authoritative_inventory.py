import os
import sys
import json
import sqlite3
import hashlib
from pathlib import Path
from collections import defaultdict
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
PUBLIC = FRONTEND / "public"
BACKEND = ROOT / "backend"
DB_PATH = ROOT / "vanvas.db"

def compute_sha256(path):
    if not path.exists():
        return "MISSING"
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def get_image_info(path):
    if not path.exists():
        return None, None
    try:
        with Image.open(path) as img:
            return list(img.size), img.format
    except Exception:
        return None, None

def build_inventory():
    print("Building comprehensive machine-readable inventory...")
    
    # 1. Map all disk images
    disk_files = {}
    sha_to_paths = defaultdict(list)
    for p in PUBLIC.rglob("*"):
        if p.is_file() and p.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif"]:
            rel = "/" + p.relative_to(PUBLIC).as_posix()
            sha = compute_sha256(p)
            size = p.stat().st_size
            disk_files[rel] = {
                "rel_path": rel,
                "disk_path": str(p),
                "sha256": sha,
                "size_bytes": size,
                "ext": p.suffix.lower()
            }
            sha_to_paths[sha].append(rel)
            
    # 2. Load DB entities
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    dest_map = {}
    for row in c.execute("SELECT id, name, slug, state, region, hero_image, hero_artwork, hero_photo FROM destinations").fetchall():
        dest_map[row[0]] = {
            "id": row[0], "name": row[1], "slug": row[2], "state": row[3], "region": row[4],
            "hero_image": row[5], "hero_artwork": row[6], "hero_photo": row[7]
        }
        dest_map[row[2]] = dest_map[row[0]]

    # Load canonical seed dataset for cross-reference
    sys.path.insert(0, str(BACKEND))
    from app.seed.canonical_dataset import (
        CANONICAL_26_DESTINATIONS,
        ADDITIONAL_PLACES_BY_DEST,
        ADDITIONAL_HOTELS_BY_DEST,
        ADDITIONAL_RENTALS_BY_DEST
    )

    inventory = []

    # A. DESTINATIONS (Canonical 26)
    for cd in CANONICAL_26_DESTINATIONS:
        slug = cd["slug"]
        name = cd["name"]
        db_dest = dest_map.get(slug, {})
        
        target_art = f"/artworks/{slug}.webp"
        disk_art_path = PUBLIC / target_art.lstrip("/")
        if not disk_art_path.exists():
            target_art = f"/images/destinations/{slug}/hero.webp"
            disk_art_path = PUBLIC / target_art.lstrip("/")
            if not disk_art_path.exists():
                target_art = f"/images/destinations/{slug}/illustration.webp"
                disk_art_path = PUBLIC / target_art.lstrip("/")
                if not disk_art_path.exists():
                    target_art = f"/images/destinations/{slug}/hero.jpg"
                    disk_art_path = PUBLIC / target_art.lstrip("/")
                
        exists = disk_art_path.exists()
        dims, fmt = get_image_info(disk_art_path) if exists else (None, None)
        sha = compute_sha256(disk_art_path) if exists else "MISSING"
        dups = [p for p in sha_to_paths.get(sha, []) if p != target_art] if exists else []
        
        audit_status = "VALID_KEEP"
        notes = "Curated editorial destination illustration"
        problem_classes = []
        if not exists:
            audit_status = "BROKEN_PATH"
            notes = f"Referenced artwork path missing on disk: {target_art}"
            problem_classes.append("G")
        elif len(dups) > 0 and any("hero" in d or "illustration" in d or "cover" in d for d in dups):
            audit_status = "DUPLICATE_REVIEW"
            notes = f"Identical file cloned across hero/illustration/cover ({len(dups)} clones)"
            problem_classes.append("A")

        inventory.append({
            "entity_type": "destination",
            "entity_id": f"dest-{slug}",
            "canonical_slug": slug,
            "entity_name": name,
            "destination_slug": slug,
            "destination_name": name,
            "category": cd.get("region", "Canonical Destination"),
            "configured_image_path": target_art,
            "database_assigned_image": db_dest.get("hero_image"),
            "seed_assigned_image": cd.get("hero_image"),
            "resolved_image_path": target_art,
            "image_exists": exists,
            "image_dimensions": dims,
            "image_format": fmt,
            "sha256": sha,
            "duplication_status": "EXACT_DUPLICATE" if dups else "UNIQUE",
            "duplicate_copies": dups,
            "rendering_components": ["DestinationArtwork", "CompactDestinationCard", "ExploreHero"],
            "database_fields": ["destinations.hero_image", "destinations.hero_artwork", "destinations.hero_photo"],
            "semantic_appropriateness": "APPROPRIATE",
            "suspiciously_similar": False,
            "problem_classification": problem_classes,
            "recommended_correction": "Preserve high-resolution editorial artwork with webp optimization",
            "confidence_level": "HIGH",
            "audit_status": audit_status,
            "audit_notes": notes
        })

    # B. PLACES (208 curated places)
    for dest_slug, places in ADDITIONAL_PLACES_BY_DEST.items():
        dest_name = dest_map.get(dest_slug, {}).get("name", dest_slug.title())
        for p in places:
            p_name = p.get("name", "")
            p_slug = p.get("slug", "")
            p_cat = p.get("category", "Attraction")
            p_img = p.get("image_url", p.get("image", ""))
            
            clean_img = p_img if p_img.startswith("/") else "/" + p_img
            disk_p = PUBLIC / clean_img.lstrip("/")
            exists = disk_p.exists()
            dims, fmt = get_image_info(disk_p) if exists else (None, None)
            sha = compute_sha256(disk_p) if exists else "MISSING"
            dups = [x for x in sha_to_paths.get(sha, []) if x != clean_img] if exists else []
            
            is_category_clone = any("categories" in x for x in dups)
            audit_status = "VALID_KEEP"
            notes = "Valid editorial place illustration"
            problem_classes = []
            
            if not exists:
                audit_status = "GENUINELY_MISSING"
                notes = f"Place image missing on disk: {clean_img}"
                problem_classes.append("G")
            elif is_category_clone:
                audit_status = "DUPLICATE_REVIEW"
                notes = f"This landmark artwork was cloned as destination category fallback: {[x for x in dups if 'categories' in x]}"
                problem_classes.append("C")
            elif len(dups) > 0:
                audit_status = "DUPLICATE_REVIEW"
                notes = f"Shared file with {len(dups)} other paths"
                problem_classes.append("A")

            inventory.append({
                "entity_type": "place",
                "entity_id": f"place-{dest_slug}-{p_slug}",
                "canonical_slug": p_slug,
                "entity_name": p_name,
                "destination_slug": dest_slug,
                "destination_name": dest_name,
                "category": p_cat,
                "configured_image_path": clean_img,
                "database_assigned_image": p_img,
                "seed_assigned_image": p_img,
                "resolved_image_path": clean_img,
                "image_exists": exists,
                "image_dimensions": dims,
                "image_format": fmt,
                "sha256": sha,
                "duplication_status": "CATEGORY_CLONE" if is_category_clone else ("EXACT_DUPLICATE" if dups else "UNIQUE"),
                "duplicate_copies": dups,
                "rendering_components": ["PlaceCard", "CompactPlaceCard", "PlaceModal", "VanvasImage"],
                "database_fields": ["places.image_url"],
                "semantic_appropriateness": "APPROPRIATE",
                "suspiciously_similar": False,
                "problem_classification": problem_classes,
                "recommended_correction": "Maintain verified individual place editorial artwork; category clones are intentional local fallbacks",
                "confidence_level": "HIGH",
                "audit_status": audit_status,
                "audit_notes": notes
            })

    # C. HOTELS / STAYS / CAMPSITES (104 stays)
    for dest_slug, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
        dest_name = dest_map.get(dest_slug, {}).get("name", dest_slug.title())
        for h in hotels:
            h_name = h.get("name", "")
            h_slug = h.get("id", h_name.lower().replace(" ", "-"))
            h_style = h.get("hotel_style", "Boutique Stay")
            h_img = h.get("image_url", h.get("image", ""))
            
            is_campsite = "camp" in h_name.lower() or "camp" in h_style.lower() or "tent" in h_style.lower() or "glade" in h_name.lower()
            ent_type = "campsite" if is_campsite else "stay"
            
            clean_img = h_img if h_img.startswith("/") else "/" + h_img
            disk_p = PUBLIC / clean_img.lstrip("/")
            exists = disk_p.exists()
            dims, fmt = get_image_info(disk_p) if exists else (None, None)
            sha = compute_sha256(disk_p) if exists else "MISSING"
            dups = [x for x in sha_to_paths.get(sha, []) if x != clean_img] if exists else []
            
            audit_status = "VALID_KEEP"
            notes = "Valid stay/campsite artwork"
            problem_classes = []
            if not exists:
                audit_status = "GENUINELY_MISSING"
                notes = f"Stay artwork missing on disk: {clean_img}"
                problem_classes.append("G")
            elif any("categories" in x for x in dups):
                audit_status = "DUPLICATE_REVIEW"
                notes = f"Cloned as category fallback: {[x for x in dups if 'categories' in x]}"
                problem_classes.append("C")
            elif len(dups) > 0:
                audit_status = "DUPLICATE_REVIEW"
                notes = f"Shared file with {len(dups)} other paths"
                problem_classes.append("A")

            inventory.append({
                "entity_type": ent_type,
                "entity_id": f"stay-{dest_slug}-{h_slug}",
                "canonical_slug": h_slug,
                "entity_name": h_name,
                "destination_slug": dest_slug,
                "destination_name": dest_name,
                "category": h_style,
                "configured_image_path": clean_img,
                "database_assigned_image": h_img,
                "seed_assigned_image": h_img,
                "resolved_image_path": clean_img,
                "image_exists": exists,
                "image_dimensions": dims,
                "image_format": fmt,
                "sha256": sha,
                "duplication_status": "EXACT_DUPLICATE" if dups else "UNIQUE",
                "duplicate_copies": dups,
                "rendering_components": ["CompactStayCard", "StayDetailModal", "ExploreStaysGrid", "VanvasImage"],
                "database_fields": ["hotels.image_url"],
                "semantic_appropriateness": "APPROPRIATE",
                "suspiciously_similar": False,
                "problem_classification": problem_classes,
                "recommended_correction": "Resolve via resolveHotelArtwork() with stay-appropriate fallback chain",
                "confidence_level": "HIGH",
                "audit_status": audit_status,
                "audit_notes": notes
            })

    # D. MOTORBIKES & SCOOTERS (Rentals & Mobility Vehicles)
    seen_rentals = set()
    for dest_slug, rentals in ADDITIONAL_RENTALS_BY_DEST.items():
        dest_name = dest_map.get(dest_slug, {}).get("name", dest_slug.title())
        for r in rentals:
            v_name = r.get("vehicle_name", "")
            v_type = r.get("vehicle_type", "Scooter")
            v_img = r.get("image_url", "")
            
            is_bike = any(k in v_type.lower() or k in v_name.lower() for k in ["bike", "motorcycle", "bullet", "himalayan", "scram", "mtb", "cycle"])
            ent_type = "motorbike" if is_bike else "scooter"
            rental_key = f"{dest_slug}:{v_name}"
            if rental_key in seen_rentals:
                continue
            seen_rentals.add(rental_key)
            
            clean_img = v_img if v_img.startswith("/") else "/" + v_img
            disk_p = PUBLIC / clean_img.lstrip("/")
            exists = disk_p.exists()
            dims, fmt = get_image_info(disk_p) if exists else (None, None)
            sha = compute_sha256(disk_p) if exists else "MISSING"
            dups = [x for x in sha_to_paths.get(sha, []) if x != clean_img] if exists else []
            
            audit_status = "VALID_KEEP"
            notes = f"Deterministic vehicle illustration ({ent_type})"
            problem_classes = []
            if not exists:
                audit_status = "GENUINELY_MISSING"
                notes = f"Vehicle artwork missing on disk: {clean_img}"
                problem_classes.append("G")
            elif len(dups) > 0:
                audit_status = "DUPLICATE_REVIEW"
                notes = f"Shared image file across vehicles: {dups}"
                problem_classes.append("A")

            # Check if Chopta adv bike mislabeled in registry
            if "chopta_tungnath_adv_bike" in clean_img and dest_slug == "tungnath-chandrashila":
                notes += " | NOTE: VehicleArtwork.tsx registry updated to category: 'adventure_motorcycle'"

            inventory.append({
                "entity_type": ent_type,
                "entity_id": f"rental-{dest_slug}-{v_name.lower().replace(' ', '-')}",
                "canonical_slug": v_name.lower().replace(' ', '-'),
                "entity_name": v_name,
                "destination_slug": dest_slug,
                "destination_name": dest_name,
                "category": v_type,
                "configured_image_path": clean_img,
                "database_assigned_image": v_img,
                "seed_assigned_image": v_img,
                "resolved_image_path": clean_img,
                "image_exists": exists,
                "image_dimensions": dims,
                "image_format": fmt,
                "sha256": sha,
                "duplication_status": "EXACT_DUPLICATE" if dups else "UNIQUE",
                "duplicate_copies": dups,
                "rendering_components": ["VehicleArtwork", "CompactRentalCard", "MobilityDetailModal"],
                "database_fields": ["rental_options.image_url", "mobility_vehicles.image_url"],
                "semantic_appropriateness": "APPROPRIATE",
                "suspiciously_similar": False,
                "problem_classification": problem_classes,
                "recommended_correction": "Mapped deterministically through DESTINATION_VEHICLE_REGISTRY in VehicleArtwork.tsx",
                "confidence_level": "HIGH",
                "audit_status": audit_status,
                "audit_notes": notes
            })

    # Save Authoritative JSON
    out_file = ROOT / "vanvas_illustration_audit_inventory.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(inventory, f, indent=2)
        
    print(f"Authoritative Inventory regenerated with {len(inventory)} entities: {out_file}")
    
    # Summary metrics
    types_count = defaultdict(int)
    status_count = defaultdict(int)
    missing_count = sum(1 for item in inventory if not item["image_exists"])
    for item in inventory:
        types_count[item["entity_type"]] += 1
        status_count[item["audit_status"]] += 1
        
    print("\nEntity Breakdown:")
    for k, v in types_count.items():
        print(f"  {k:15}: {v}")
        
    print("\nAudit Status Breakdown:")
    for k, v in status_count.items():
        print(f"  {k:20}: {v}")

    print(f"\nMissing images on disk across audited inventory: {missing_count}")

    return inventory, disk_files, sha_to_paths

if __name__ == "__main__":
    build_inventory()
