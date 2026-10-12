import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def check_camps():
    conn = sqlite3.connect(ROOT / "vanvas.db")
    c = conn.cursor()
    
    print("=== PLACES WITH CAMP / ECO GLADE ===")
    places = c.execute("""
        SELECT p.name, p.category, p.image_url, d.name
        FROM places p
        JOIN destinations d ON p.destination_id = d.id
        WHERE lower(p.name) LIKE '%camp%' OR lower(p.category) LIKE '%camp%' OR lower(p.name) LIKE '%glade%'
    """).fetchall()
    for p in places:
        print(f"Place: {p[0]} ({p[1]}) in {p[3]} -> {p[2]}")
        
    print("\n=== HOTELS / STAYS WITH CAMP / TENT ===")
    hotels = c.execute("""
        SELECT h.name, h.hotel_style, h.image_url, d.name
        FROM hotels h
        JOIN destinations d ON h.destination_id = d.id
        WHERE lower(h.name) LIKE '%camp%' OR lower(h.hotel_style) LIKE '%camp%' OR lower(h.hotel_style) LIKE '%tent%'
    """).fetchall()
    for h in hotels:
        print(f"Stay/Camp: {h[0]} ({h[1]}) in {h[3]} -> {h[2]}")
        
    conn.close()

if __name__ == "__main__":
    check_camps()
