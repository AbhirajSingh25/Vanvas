import sqlite3
import os

db_path = "vanvas.db"
if not os.path.exists(db_path):
    print("No vanvas.db found")
    exit(0)

conn = sqlite3.connect(db_path)
c = conn.cursor()

print("=== CHECKING DESTINATIONS ===")
c.execute("SELECT id, name, hero_image FROM destinations")
for row in c.fetchall():
    if "unsplash" in str(row[2]) or "http" in str(row[2]):
        print("External destination hero:", row)

print("\n=== CHECKING RENTALS WITH MISMATCHES ===")
c.execute("SELECT id, vehicle_name, vehicle_type, destination_id, image_url FROM rental_options")
rentals = c.fetchall()
print(f"Total rentals in DB: {len(rentals)}")
for r in rentals[:10]:
    print(r)

for table in ['destinations', 'places', 'hotels', 'rental_options']:
    col = 'hero_image' if table == 'destinations' else 'image_url'
    c.execute(f"SELECT id, {col} FROM {table} WHERE {col} LIKE '%unsplash%' OR {col} LIKE 'http%'")
    rows = c.fetchall()
    print(f"{table} external count: {len(rows)}")
    for r in rows:
        print("  ", r)

conn.close()
