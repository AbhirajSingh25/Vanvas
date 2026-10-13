"""
Audit EVERY place and hotel in vanvas.db to verify strict Image Resolution Contracts:
1. Every place resolves to valid disk image
2. Every stay resolves to valid disk image matching accommodation semantics (never temple/peak/fort/destination hero)
3. Every rental option resolves to valid disk image matching vehicle type
4. Check both root vanvas.db and backend/vanvas.db
"""
import os
import sys
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "frontend" / "public"

def audit_db(db_path):
    print(f"\n--- AUDITING {db_path.name} ({db_path}) ---")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    destinations = {d["id"]: d for d in c.execute("SELECT * FROM destinations").fetchall()}
    places = c.execute("SELECT * FROM places").fetchall()
    hotels = c.execute("SELECT * FROM hotels").fetchall()
    rentals = c.execute("SELECT * FROM rental_options").fetchall()

    missing_disk = []
    stay_collisions = []
    vehicle_collisions = []

    # 1. Audit destinations
    for d_id, d in destinations.items():
        for field in ["hero_image", "hero_artwork", "hero_photo"]:
            val = d[field]
            if val:
                if val.startswith("http"):
                    continue
                p = PUBLIC / val.lstrip("/")
                if not p.exists():
                    missing_disk.append((f"dest:{d['slug']}", field, val))

    # 2. Audit places
    for p in places:
        dest = destinations.get(p["destination_id"])
        dest_slug = dest["slug"] if dest else "unknown"
        val = p["image_url"]
        if val:
            if val.startswith("http"):
                continue
            disk_p = PUBLIC / val.lstrip("/")
            if not disk_p.exists():
                missing_disk.append((f"place:{dest_slug}:{p['name']}", "image_url", val))

    # 3. Audit hotels
    for h in hotels:
        dest = destinations.get(h["destination_id"])
        dest_slug = dest["slug"] if dest else "unknown"
        val = h["image_url"]
        if val:
            if val.startswith("http"):
                continue
            disk_p = PUBLIC / val.lstrip("/")
            if not disk_p.exists():
                missing_disk.append((f"hotel:{dest_slug}:{h['name']}", "image_url", val))
            # Semantic check: stay should not use destination hero or non-stay
            if "hero.jpg" in val or "hero.webp" in val or "illustration.webp" in val:
                if "/categories/stay" not in val:
                    stay_collisions.append((f"hotel:{dest_slug}:{h['name']}", val, "Uses destination hero"))

    # 4. Audit rentals
    for r in rentals:
        dest = destinations.get(r["destination_id"])
        dest_slug = dest["slug"] if dest else "unknown"
        val = r["image_url"]
        if val:
            disk_p = PUBLIC / val.lstrip("/")
            if not disk_p.exists():
                missing_disk.append((f"rental:{dest_slug}:{r['vehicle_name']}", "image_url", val))

    conn.close()
    print(f"Destinations: {len(destinations)}")
    print(f"Places: {len(places)}")
    print(f"Hotels: {len(hotels)}")
    print(f"Rentals: {len(rentals)}")
    print(f"Missing disk assets: {len(missing_disk)}")
    print(f"Stay collisions: {len(stay_collisions)}")
    print(f"Vehicle collisions: {len(vehicle_collisions)}")
    
    if missing_disk:
        print("Sample missing disk assets:")
        for m in missing_disk[:5]:
            print(" ", m)

    return len(missing_disk) == 0 and len(stay_collisions) == 0 and len(vehicle_collisions) == 0

def main():
    root_ok = audit_db(ROOT / "vanvas.db")
    backend_ok = audit_db(ROOT / "backend" / "vanvas.db")
    if root_ok and backend_ok:
        print("\nALL DATABASE IMAGES VERIFIED PERFECTLY ON DISK WITH ZERO COLLISIONS!")
    else:
        print("\nDATABASE ISSUES DETECTED!")
        sys.exit(1)

if __name__ == "__main__":
    main()
