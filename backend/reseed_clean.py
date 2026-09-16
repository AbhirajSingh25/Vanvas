import os
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

from app.database.session import SessionLocal, engine, Base
from app.models.models import Destination, Place, Hotel, RentalOption, User, Trip
from app.seed.seed_data import seed_database

def clean_and_reseed():
    db = SessionLocal()
    approved_slugs = {"manali", "rishikesh", "kasol", "dharamshala", "goa", "jaipur", "mussoorie", "udaipur", "varanasi", "leh", "spiti", "munnar"}
    
    manali = db.query(Destination).filter(Destination.slug == "manali").first()
    if not manali:
        seed_database()
        manali = db.query(Destination).filter(Destination.slug == "manali").first()

    # Reassign any test trips pointing to unapproved destinations to manali
    all_dests = db.query(Destination).all()
    for d in all_dests:
        if d.slug not in approved_slugs:
            print(f"Reassigning trips and removing unapproved dynamic destination: {d.slug} ({d.name})")
            db.query(Trip).filter(Trip.destination_id == d.id).update({"destination_id": manali.id})
            db.delete(d)
    db.commit()
    db.close()
    
    seed_database()
    
    db = SessionLocal()
    curated = db.query(Destination).all()
    print("Curated Destinations in DB:")
    for c in curated:
        print(f" - {c.slug}: {c.name} ({len(c.places)} places, {len(c.hotels)} hotels, {len(c.rentals)} rentals)")
    db.close()

if __name__ == "__main__":
    clean_and_reseed()
