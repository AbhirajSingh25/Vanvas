"""
Script to clean up old duplicate place rows from the database and reseed with fresh canonical places.
"""
import sys
from pathlib import Path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.session import SessionLocal
from app.models.models import Place, Destination, Vote, ItineraryItem, SavedPlace
from app.seed.canonical_dataset import ADDITIONAL_PLACES_BY_DEST
from app.seed.seed_data import seed_database

OLD_DUPLICATE_SLUGS = [
    "beatles-ashram-chaurasi-kutia",
    "vashistha-cave-gufa",
    "devraj-german-bakery",
    "divar-island-goa",
    "artjuna-garden-cafe",
    "vinayak-restaurant-goa",
    "manikarnika-ghat-kashi",
    "ramnagar-fort-museum",
    "blue-lassi-shop-kashi",
    "sangam-indus-zanskar",
    "shanti-stupa-leh",
    "gesmo-restaurant-leh",
    "lalas-art-cafe-leh",
    "pari-tibba-fairies-hill"
]

def clean_and_reseed():
    db = SessionLocal()
    for slug in OLD_DUPLICATE_SLUGS:
        places = db.query(Place).filter(Place.slug == slug).all()
        for p in places:
            db.query(Vote).filter(Vote.place_id == p.id).delete()
            db.query(ItineraryItem).filter(ItineraryItem.place_id == p.id).delete()
            db.query(SavedPlace).filter(SavedPlace.place_id == p.id).delete()
            db.delete(p)
            print(f"Deleted old duplicate place: {slug}")
    db.commit()
    db.close()

    seed_database()
    print("Database reseeded successfully.")

if __name__ == "__main__":
    clean_and_reseed()

