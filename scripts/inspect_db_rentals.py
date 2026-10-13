import sqlite3

conn = sqlite3.connect("vanvas.db")
c = conn.cursor()

c.execute("SELECT destination_id, vehicle_name, vehicle_type, image_url FROM rental_options WHERE destination_id IN ('dest-varanasi', 'dest-udaipur', 'dest-munnar', 'dest-manali', 'dest-rishikesh')")
rows = c.fetchall()
print(f"Matching rental options: {len(rows)}")
for r in rows:
    print(r)

conn.close()
