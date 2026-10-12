import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
conn = sqlite3.connect(ROOT / "vanvas.db")
c = conn.cursor()

print("=== ALL RENTAL OPTIONS IN vanvas.db ===")
rows = c.execute("""
    SELECT r.id, d.name, d.slug, r.provider_name, r.vehicle_name, r.vehicle_type, r.image_url
    FROM rental_options r
    JOIN destinations d ON r.destination_id = d.id
""").fetchall()
print(f"Total rental options in DB: {len(rows)}")
for r in rows:
    v_name = r[4].lower()
    v_type = r[5].lower()
    img = r[6].lower() if r[6] else ""
    is_scooter = "scooter" in v_type or "activa" in v_name or "jupiter" in v_name or "access" in v_name or "ather" in v_name
    is_bike = "motorcycle" in v_type or "bullet" in v_name or "classic" in v_name or "himalayan" in v_name or "bike" in v_type
    mismatch = False
    if is_scooter and ("bike" in img or "bullet" in img or "motorcycle" in img) and "scooter" not in img:
        mismatch = True
    if is_bike and "scooter" in img and ("bike" not in img and "bullet" not in img and "motorcycle" not in img):
        mismatch = True
    flag = " [MISMATCH!]" if mismatch else ""
    print(f"{r[2]:22} | {r[5]:20} | {r[4]:35} | {r[6]}{flag}")

conn.close()
