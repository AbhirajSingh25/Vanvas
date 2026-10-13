import sqlite3
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

db_paths = [ROOT / "vanvas.db", ROOT / "backend" / "vanvas.db"]

destination_updates = {
    'dyn-delhi': '/images/destinations/fallbacks/valley.jpg',
    'dyn-pune': '/images/destinations/fallbacks/valley.jpg',
    'dyn-gokarna': '/images/destinations/fallbacks/coastal.jpg',
    'dyn-kolkata': '/images/destinations/fallbacks/valley.jpg',
    'dyn-ayodhya': '/images/destinations/fallbacks/valley.jpg',
}

rental_updates = [
    ('/images/vehicles/udaipur_pichola_scooter.jpg', '%Jupiter%', 'dest-udaipur'),
    ('/images/vehicles/varanasi_ghat_approach_scooter.jpg', '%Ather%', 'dest-varanasi'),
    ('/images/vehicles/rishikesh_ganga_mtb.jpg', '%Trek Marlin%', 'dest-rishikesh'),
    ('/images/vehicles/kerala_tea_plantation_scooter.jpg', '%Ntorq%', 'dest-munnar'),
    ('/images/vehicles/manali_himalayan_adv_bike.jpg', '%Himalayan 450 Adventure%', 'dest-manali'),
]

for db_path in db_paths:
    if not db_path.exists():
        continue
    print(f"\n==========================================")
    print(f"Synchronizing database: {db_path.relative_to(ROOT)}")
    print(f"==========================================")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    for dest_id, hero_img in destination_updates.items():
        c.execute("UPDATE destinations SET hero_image = ?, hero_artwork = ? WHERE id = ?", (hero_img, hero_img, dest_id))
        print(f"Updated destination {dest_id} -> {hero_img} (rows affected: {c.rowcount})")

    # Update any null hero_image/hero_artwork in dynamic destinations to valley fallback
    c.execute("UPDATE destinations SET hero_image = '/images/destinations/fallbacks/valley.jpg', hero_artwork = '/images/destinations/fallbacks/valley.jpg' WHERE hero_image IS NULL")
    print(f"Backfilled NULL hero_images in destinations (rows affected: {c.rowcount})")

    for img, name_pat, dest_id in rental_updates:
        c.execute("UPDATE rental_options SET image_url = ? WHERE destination_id = ? AND vehicle_name LIKE ?", (img, dest_id, name_pat))
        print(f"Updated rental {dest_id} {name_pat} -> {img} (rows affected: {c.rowcount})")

    conn.commit()

    print("\nVerifying external URLs remaining in DB:")
    for table in ['destinations', 'places', 'hotels', 'rental_options']:
        col = 'hero_image' if table == 'destinations' else 'image_url'
        c.execute(f"SELECT id, {col} FROM {table} WHERE {col} LIKE '%unsplash%' OR {col} LIKE 'http%'")
        rows = c.fetchall()
        print(f"  {table:15} external count: {len(rows)}")

    conn.close()

print("\nDatabase synchronization completed successfully.")
