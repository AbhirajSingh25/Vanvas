import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.database.session import SessionLocal
from app.services.destination_aliases import resolve_alias_to_slug, DESTINATION_ALIASES
from app.seed.canonical_dataset import CANONICAL_26_DESTINATIONS
from app.models.models import Destination

def test_alias_logic():
    print("=== TESTING ALIAS LOGIC ===")
    test_queries = ["banaras", "Banaras", "kashi", "chopta", "kainchi", "mcleodganj", "bombay", "bangalore"]
    for q in test_queries:
        res = resolve_alias_to_slug(q)
        print(f"Query: '{q}' -> Alias Match: {res}")
        assert res is not None, f"Expected alias match for {q}"

    # Verify Varanasi match
    slug, alias = resolve_alias_to_slug("banaras")
    assert slug == "varanasi"
    assert alias == "Banaras"
    print("Alias logic passed!\n")

def test_db_lookup():
    print("=== TESTING DB LOOKUP ===")
    db = SessionLocal()
    try:
        # Lookup varanasi
        dest = db.query(Destination).filter(Destination.slug == "varanasi").first()
        assert dest is not None
        print(f"Found Varanasi in DB: {dest.name}, {dest.state}, {dest.region}, slug={dest.slug}")
        
        # Lookup tungnath-chandrashila
        chopta_dest = db.query(Destination).filter(Destination.slug == "tungnath-chandrashila").first()
        assert chopta_dest is not None
        print(f"Found Chopta in DB: {chopta_dest.name}, slug={chopta_dest.slug}")
    finally:
        db.close()
    print("DB lookup passed!\n")

if __name__ == "__main__":
    test_alias_logic()
    test_db_lookup()
