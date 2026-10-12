import os
import sys
import json
import sqlite3
import hashlib
from pathlib import Path
from collections import defaultdict
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"
BACKEND_DIR = ROOT / "backend"
DB_PATH = ROOT / "vanvas.db"

def compute_file_hash(path: Path):
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def main():
    print("=== VANVAS ILLUSTRATION LIBRARY AUDIT - PHASE 1 ===")
    
    # 1. Catalog all files on disk in frontend/public
    disk_images = {}
    sha_map = defaultdict(list)
    
    for p in PUBLIC_DIR.rglob("*"):
        if p.is_file() and p.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif"]:
            rel_path = "/" + p.relative_to(PUBLIC_DIR).as_posix()
            sha = compute_file_hash(p)
            size = p.stat().st_size
            
            # Read image metadata if valid format
            dim = None
            mode = None
            fmt = None
            if p.suffix.lower() in [".png", ".jpg", ".jpeg", ".webp"]:
                try:
                    with Image.open(p) as img:
                        dim = img.size
                        mode = img.mode
                        fmt = img.format
                except Exception as e:
                    dim = f"ERR: {e}"
            
            disk_images[rel_path] = {
                "rel_path": rel_path,
                "disk_path": str(p),
                "sha256": sha,
                "size_bytes": size,
                "dimensions": dim,
                "mode": mode,
                "format": fmt,
                "ext": p.suffix.lower()
            }
            sha_map[sha].append(rel_path)
            
    print(f"Total disk images cataloged: {len(disk_images)}")
    print(f"Unique SHA256 hashes: {len(sha_map)}")
    
    # Duplicate clusters
    duplicate_clusters = {k: v for k, v in sha_map.items() if len(v) > 1}
    print(f"Duplicate clusters: {len(duplicate_clusters)}")

    # 2. Extract database references from vanvas.db
    db_conn = sqlite3.connect(DB_PATH)
    cursor = db_conn.cursor()
    
    db_entities = []
    
    # Destinations
    for row in cursor.execute("SELECT id, name, slug, state, region, hero_image, hero_artwork, hero_photo FROM destinations").fetchall():
        db_entities.append({
            "entity_type": "destination",
            "id": row[0],
            "name": row[1],
            "slug": row[2],
            "state": row[3],
            "region": row[4],
            "images": {
                "hero_image": row[5],
                "hero_artwork": row[6],
                "hero_photo": row[7]
            }
        })
        
    # Places
    for row in cursor.execute("""
        SELECT p.id, p.destination_id, d.slug, d.name, p.name, p.slug, p.category, p.image_url, p.is_must_visit
        FROM places p
        LEFT JOIN destinations d ON p.destination_id = d.id
    """).fetchall():
        db_entities.append({
            "entity_type": "place",
            "id": row[0],
            "destination_id": row[1],
            "destination_slug": row[2] or "unknown",
            "destination_name": row[3] or "Unknown",
            "name": row[4],
            "slug": row[5],
            "category": row[6],
            "image_url": row[7],
            "is_must_visit": bool(row[8])
        })
        
    # Hotels / Stays
    for row in cursor.execute("""
        SELECT h.id, h.destination_id, d.slug, d.name, h.name, h.hotel_style, h.image_url, h.badge, h.price_per_night
        FROM hotels h
        LEFT JOIN destinations d ON h.destination_id = d.id
    """).fetchall():
        db_entities.append({
            "entity_type": "stay",
            "id": row[0],
            "destination_id": row[1],
            "destination_slug": row[2] or "unknown",
            "destination_name": row[3] or "Unknown",
            "name": row[4],
            "hotel_style": row[5],
            "image_url": row[6],
            "badge": row[7],
            "price_per_night": row[8]
        })
        
    # Rental Options
    for row in cursor.execute("""
        SELECT r.id, r.destination_id, d.slug, d.name, r.provider_name, r.vehicle_type, r.vehicle_name, r.image_url
        FROM rental_options r
        LEFT JOIN destinations d ON r.destination_id = d.id
    """).fetchall():
        db_entities.append({
            "entity_type": "rental_option",
            "id": row[0],
            "destination_id": row[1],
            "destination_slug": row[2] or "unknown",
            "destination_name": row[3] or "Unknown",
            "provider_name": row[4],
            "vehicle_type": row[5],
            "vehicle_name": row[6],
            "image_url": row[7]
        })
        
    # Mobility Vehicles
    for row in cursor.execute("""
        SELECT mv.id, mv.provider_id, mp.business_name, mp.city, mv.vehicle_type, mv.brand, mv.model, mv.image_url
        FROM mobility_vehicles mv
        LEFT JOIN mobility_providers mp ON mv.provider_id = mp.id
    """).fetchall():
        db_entities.append({
            "entity_type": "mobility_vehicle",
            "id": row[0],
            "provider_id": row[1],
            "provider_name": row[2],
            "city": row[3],
            "vehicle_type": row[4],
            "brand": row[5],
            "model": row[6],
            "image_url": row[7]
        })
        
    db_conn.close()
    print(f"Total DB entities with image fields: {len(db_entities)}")
    
    # 3. Check broken paths in DB
    broken_db_refs = []
    for ent in db_entities:
        imgs = []
        if ent["entity_type"] == "destination":
            imgs = [ent["images"]["hero_image"], ent["images"]["hero_artwork"], ent["images"]["hero_photo"]]
        else:
            imgs = [ent.get("image_url")]
            
        for img in imgs:
            if img:
                clean_img = img if img.startswith("/") else "/" + img
                if clean_img not in disk_images:
                    broken_db_refs.append({
                        "entity": ent.get("name", ent.get("id")),
                        "type": ent["entity_type"],
                        "dest": ent.get("destination_slug", ent.get("city", "n/a")),
                        "ref_url": img
                    })
                    
    print(f"Broken DB image references: {len(broken_db_refs)}")

    # 4. Save intermediate data
    with open(ROOT / "disk_images_inventory.json", "w", encoding="utf-8") as f:
        json.dump({
            "total_files": len(disk_images),
            "unique_sha256": len(sha_map),
            "duplicate_clusters": len(duplicate_clusters),
            "files": disk_images,
            "clusters": duplicate_clusters
        }, f, indent=2)

    with open(ROOT / "db_entities_inventory.json", "w", encoding="utf-8") as f:
        json.dump({
            "total_entities": len(db_entities),
            "broken_refs_count": len(broken_db_refs),
            "broken_refs": broken_db_refs,
            "entities": db_entities
        }, f, indent=2)
        
    print("Exported disk_images_inventory.json and db_entities_inventory.json")

if __name__ == "__main__":
    main()
