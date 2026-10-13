import os
import sys
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "frontend" / "public"
DB_PATH = ROOT / "vanvas.db"

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
c = conn.cursor()

rows = c.execute("""
  SELECT r.id, d.slug as dest_slug, d.name as dest_name, r.provider_name, r.vehicle_name, r.vehicle_type, r.image_url
  FROM rental_options r
  JOIN destinations d ON r.destination_id = d.id
""").fetchall()

print(f"Auditing {len(rows)} rental vehicles in vanvas.db...")
errors = 0
verified = 0

for r in rows:
    v_name = r["vehicle_name"].lower()
    v_type = r["vehicle_type"].lower()
    img = (r["image_url"] or "").lower()
    clean_path = r["image_url"].lstrip("/")
    disk_path = PUBLIC / clean_path

    # 1. Existence
    if not disk_path.exists():
        print(f"[MISSING ON DISK] {r['dest_slug']}: {r['vehicle_name']} -> {r['image_url']}")
        errors += 1
        continue

    # 2. Semantic consistency
    is_scooter = "scooter" in v_type or any(k in v_name for k in ["activa", "jupiter", "access", "ather", "ntorq"])
    is_classic_bullet = "classic 350" in v_type or "bullet" in v_name or "reborn" in v_name
    is_adventure = "adventure" in v_type or "himalayan" in v_name or "adv" in v_name
    is_car = "car" in v_type or any(k in v_name for k in ["innova", "mahindra thar", "thar 4x4", "ertiga", "scorpio"])
    is_bicycle = "mountain bike" in v_type or any(k in v_name for k in ["marlin", "mtb", "cycle"])

    collision = False
    if is_scooter:
        if ("bullet" in img or "himalayan" in img or "car" in img or "mtb" in img) and "scooter" not in img:
            print(f"[COLLISION: SCOOTER MISMATCH] {r['dest_slug']}: {r['vehicle_name']} ({r['vehicle_type']}) -> {r['image_url']}")
            collision = True

    if is_classic_bullet:
        if "scooter" in img or "car" in img or "mtb" in img or "adv" in img:
            print(f"[COLLISION: BULLET MISMATCH] {r['dest_slug']}: {r['vehicle_name']} ({r['vehicle_type']}) -> {r['image_url']}")
            collision = True

    if is_adventure:
        if "scooter" in img or "car" in img or "mtb" in img:
            print(f"[COLLISION: ADV MISMATCH] {r['dest_slug']}: {r['vehicle_name']} ({r['vehicle_type']}) -> {r['image_url']}")
            collision = True

    if is_car:
        if "scooter" in img or "bullet" in img or "mtb" in img or "bike" in img:
            print(f"[COLLISION: CAR MISMATCH] {r['dest_slug']}: {r['vehicle_name']} ({r['vehicle_type']}) -> {r['image_url']}")
            collision = True

    if is_bicycle:
        if "scooter" in img or "bullet" in img or "car" in img or "adv" in img:
            print(f"[COLLISION: BICYCLE MISMATCH] {r['dest_slug']}: {r['vehicle_name']} ({r['vehicle_type']}) -> {r['image_url']}")
            collision = True

    if collision:
        errors += 1
    else:
        verified += 1

print(f"\nAudit complete: {verified}/{len(rows)} verified perfectly. Total errors: {errors}")
conn.close()
