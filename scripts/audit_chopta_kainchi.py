import os
import json
import sqlite3
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
PUBLIC = FRONTEND / "public"

def get_hash(rel_path):
    p = PUBLIC / rel_path.lstrip("/")
    if not p.exists():
        return "MISSING"
    h = hashlib.sha256()
    with open(p, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()[:12]

def audit_target(dest_slug, dest_name):
    print(f"\n==================================================")
    print(f"AUDIT FOR: {dest_name} (slug: {dest_slug})")
    print(f"==================================================")
    
    conn = sqlite3.connect(ROOT / "vanvas.db")
    c = conn.cursor()
    
    # 1. Destination
    dest_row = c.execute("SELECT id, name, slug, hero_image, hero_artwork, hero_photo FROM destinations WHERE slug = ?", (dest_slug,)).fetchone()
    print("\n--- DESTINATION RECORD ---")
    if dest_row:
        print(f"ID: {dest_row[0]}, Name: {dest_row[1]}")
        print(f"hero_image: {dest_row[3]} [hash: {get_hash(dest_row[3]) if dest_row[3] else 'NONE'}]")
        print(f"hero_artwork: {dest_row[4]} [hash: {get_hash(dest_row[4]) if dest_row[4] else 'NONE'}]")
        print(f"hero_photo: {dest_row[5]} [hash: {get_hash(dest_row[5]) if dest_row[5] else 'NONE'}]")
    else:
        print(f"Destination '{dest_slug}' NOT FOUND in DB!")
        
    # 2. Places
    print("\n--- PLACES IN DB ---")
    dest_id = dest_row[0] if dest_row else None
    if dest_id:
        places = c.execute("SELECT id, name, slug, category, image_url, is_must_visit FROM places WHERE destination_id = ?", (dest_id,)).fetchall()
        for p in places:
            h = get_hash(p[4]) if p[4] else "NONE"
            print(f"Place: {p[1]} | Cat: {p[3]} | Img: {p[4]} | Hash: {h} | Exists: {(PUBLIC / p[4].lstrip('/')).exists() if p[4] else False}")
            
    # 3. Hotels / Stays
    print("\n--- STAYS / HOTELS IN DB ---")
    if dest_id:
        hotels = c.execute("SELECT id, name, hotel_style, price_per_night, image_url, badge FROM hotels WHERE destination_id = ?", (dest_id,)).fetchall()
        for h in hotels:
            hh = get_hash(h[4]) if h[4] else "NONE"
            print(f"Stay: {h[1]} | Style: {h[2]} | Rs.{h[3]} | Img: {h[4]} | Hash: {hh} | Exists: {(PUBLIC / h[4].lstrip('/')).exists() if h[4] else False}")
            
    # 4. Rentals
    print("\n--- RENTALS IN DB ---")
    if dest_id:
        rentals = c.execute("SELECT id, provider_name, vehicle_type, vehicle_name, image_url FROM rental_options WHERE destination_id = ?", (dest_id,)).fetchall()
        for r in rentals:
            rh = get_hash(r[4]) if r[4] else "NONE"
            print(f"Rental: {r[3]} ({r[2]}) | Provider: {r[1]} | Img: {r[4]} | Hash: {rh} | Exists: {(PUBLIC / r[4].lstrip('/')).exists() if r[4] else False}")
            
    # 5. Disk Files in Destination & Places
    print("\n--- DISK ASSETS IN /images/destinations/ ---")
    dest_img_dir = PUBLIC / "images" / "destinations" / dest_slug
    if dest_img_dir.exists():
        for f in sorted(dest_img_dir.iterdir()):
            if f.is_file():
                rel = "/" + f.relative_to(PUBLIC).as_posix()
                print(f"  {f.name:30} size: {f.stat().st_size:7} | hash: {get_hash(rel)}")
    else:
        print("  DIR NOT FOUND")
        
    print("\n--- DISK ASSETS IN /images/places/ ---")
    places_img_dir = PUBLIC / "images" / "places" / dest_slug
    if places_img_dir.exists():
        for root, dirs, files in os.walk(places_img_dir):
            for file in sorted(files):
                full_f = Path(root) / file
                rel = "/" + full_f.relative_to(PUBLIC).as_posix()
                print(f"  {rel:65} size: {full_f.stat().st_size:7} | hash: {get_hash(rel)}")
    else:
        print("  DIR NOT FOUND")
        
    conn.close()

if __name__ == "__main__":
    audit_target("tungnath-chandrashila", "Chopta / Tungnath-Chandrashila")
    audit_target("kainchi-dham", "Kainchi Dham")
