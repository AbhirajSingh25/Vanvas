import sys
import os

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, 'backend')

from app.database.session import SessionLocal
from app.models.models import Destination, Place, Hotel, RentalOption

db = SessionLocal()

destinations_to_test = [
    "goa", "jaipur", "udaipur", "varanasi", "leh", "spiti", "mussoorie", "rishikesh",
    "manali", "dharamshala", "kasol", "jaisalmer", "munnar", "dehradun",
    "tungnath-chandrashila", "kainchi-dham", "agra", "mathura-vrindavan", "neemrana",
    "damdama-sohna", "alwar-siliserh", "sariska-bhangarh", "chandigarh", "morni-hills",
    "lansdowne", "murthal"
]

results = []
for slug in destinations_to_test:
    dest = db.query(Destination).filter((Destination.slug == slug) | (Destination.id == f"dest-{slug}")).first()
    if dest:
        places = db.query(Place).filter(Place.destination_id == dest.id).all()
        hotels = db.query(Hotel).filter(Hotel.destination_id == dest.id).all()
        rentals = db.query(RentalOption).filter(RentalOption.destination_id == dest.id).all()
        vehicle_imgs = [r.image_url for r in rentals if r.image_url]
        results.append({
            "slug": slug,
            "name": dest.name,
            "status": "OK",
            "places_count": len(places),
            "hotels_count": len(hotels),
            "rentals_count": len(rentals),
            "vehicle_imgs": vehicle_imgs
        })
    else:
        results.append({
            "slug": slug,
            "status": "NOT FOUND IN DB"
        })

db.close()

print("\n" + "="*95)
print(f"VANVAS 26-DESTINATION AUDIT MATRIX ({sum(1 for r in results if r['status'] == 'OK')}/26 verified):")
print("="*95)
for r in results:
    if r["status"] == "OK":
        fleet_str = ", ".join(r["vehicle_imgs"]) if r["vehicle_imgs"] else "None"
        print(f"✓ {r['slug']:<22} | {r['name']:<25} | Places: {r['places_count']} | Hotels: {r['hotels_count']} | Rentals: {r['rentals_count']}")
        print(f"   Fleet: {fleet_str}")
    else:
        print(f"✗ {r['slug']:<22} | {r['status']}")
