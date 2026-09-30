import json
import logging
from typing import Optional, Dict, Any, List, Set
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine, Base
from app.core.security import get_password_hash

logger = logging.getLogger("vanvas.seed")
from app.models.models import (
    User, UserPreference, Destination, PlaceCategory, Place, Hotel,
    RentalOption, TransportOption, Trip, TripMember, Itinerary, ItineraryItem,
    Vote, Expense, SavedPlace, ChecklistItem, WeatherSnapshot
)
from app.itinerary.generator import ItineraryEngine

from app.seed.canonical_dataset import (
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)

def seed_database(engine_to_use=None, db: Optional[Session] = None) -> bool:
    """
    Idempotent, FK-safe canonical seeding for VANVAS.
    Maintains primary key stability and valid foreign keys for all child records.
    Returns True on success, raises or returns False on critical error.
    """
    eng = engine_to_use or engine
    from app.database.session import ensure_database_schema
    schema_ok = ensure_database_schema(eng)
    if not schema_ok:
        logger.error("Schema validation failed before seeding.")

    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True

    try:
        # 1. Users
        admin_user = db.query(User).filter(User.email == "admin@vanvas.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@vanvas.com",
                hashed_password=get_password_hash("vanvas123"),
                full_name="VANVAS Admin Team",
                role="admin",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                email_verified_at=datetime.now(timezone.utc)
            )
            db.add(admin_user)
        elif admin_user.email_verified_at is None:
            admin_user.email_verified_at = datetime.now(timezone.utc)

        demo_user = db.query(User).filter(User.email == "traveller@vanvas.com").first()
        if not demo_user:
            demo_user = User(
                email="traveller@vanvas.com",
                hashed_password=get_password_hash("vanvas123"),
                full_name="Aarav Sharma",
                role="traveller",
                avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
                email_verified_at=datetime.now(timezone.utc)
            )
            db.add(demo_user)
            db.flush()

            # User Preferences
            user_pref = UserPreference(
                user_id=demo_user.id,
                preferred_travel_style="Balanced",
                wake_up_preference="Normal",
                activity_intensity="Balanced",
                dietary_preference="All",
                interests="Nature,Cafés,Adventure,Food,Hidden places"
            )
            db.add(user_pref)
        elif demo_user.email_verified_at is None:
            demo_user.email_verified_at = datetime.now(timezone.utc)
            db.flush()

        # 2. Categories
        categories_data = [
            ("Must Visit", "must-visit", "sparkles", "Iconic landmarks and valley staples"),
            ("Hidden Gems", "hidden-gems", "eye", "Off-beat tranquil retreats away from crowds"),
            ("Cafés & Bakery", "cafes", "coffee", "Riverside patios, artisan bakes, and mountain views"),
            ("Local Food", "food", "utensils", "Traditional Himachali Dham, thukpa, and local dhabas"),
            ("Nature & Trails", "nature", "tree", "Pine forests, waterfalls, and alpine meadows"),
            ("Adventure", "adventure", "compass", "River rafting, paragliding, high passes, and treks"),
            ("Culture & Heritage", "culture", "landmark", "Centuries-old wooden temples and monasteries"),
            ("Markets & Craft", "markets", "shopping-bag", "Handwoven shawls, wooden crafts, and spice bazaars"),
            ("Essentials & Medical", "essentials", "shield-alert", "Hospitals, 24/7 pharmacies, ATMs, and police")
        ]
        
        category_map = {}
        for name, slug, icon, desc in categories_data:
            cat = db.query(PlaceCategory).filter(PlaceCategory.slug == slug).first()
            if not cat:
                cat = PlaceCategory(name=name, slug=slug, icon=icon, description=desc)
                db.add(cat)
                db.flush()
            category_map[slug] = cat

        # 3. All Approved Curated Canonical Destinations (26 destinations)
        destinations_data = CANONICAL_26_DESTINATIONS

        dest_objects = {}
        for d_info in destinations_data:
            dest_id = f"dest-{d_info['slug']}"
            # Match strictly by stable canonical slug first, or existing ID
            existing = db.query(Destination).filter(Destination.slug == d_info["slug"]).first()
            if not existing:
                existing = db.query(Destination).filter(Destination.id == dest_id).first()

            if not existing:
                dest = Destination(id=dest_id, **d_info)
                db.add(dest)
                db.flush()
                dest_objects[dest.slug] = dest
            else:
                # NEVER overwrite existing.id to prevent FK violations with referenced places/hotels/trips
                for k, v in d_info.items():
                    if k != "id":
                        setattr(existing, k, v)
                db.flush()
                dest_objects[existing.slug] = existing
        db.commit()

        # 4. Authentic Verified Places per Destination (Strict Isolation)
        curated_places_by_dest = ADDITIONAL_PLACES_BY_DEST
        curated_place_keys = set()
        for dest_slug, places_list in curated_places_by_dest.items():
            if dest_slug in dest_objects:
                dest_obj = dest_objects[dest_slug]
                canonical_slugs_for_dest = {p_data["slug"] for p_data in places_list}
                for p_data in places_list:
                    curated_place_keys.add((dest_obj.id, p_data["slug"]))
                    existing_matches = db.query(Place).filter(
                        Place.destination_id == dest_obj.id,
                        Place.slug == p_data["slug"]
                    ).all()
                    if not existing_matches:
                        p = Place(destination_id=dest_obj.id, **p_data)
                        db.add(p)
                    else:
                        existing_p = existing_matches[0]
                        for k, v in p_data.items():
                            if k not in ("id", "destination_id"):
                                setattr(existing_p, k, v)
                        # Clean up duplicate place rows with the same slug on this destination
                        for dup in existing_matches[1:]:
                            db.query(Vote).filter(Vote.place_id == dup.id).delete()
                            db.query(ItineraryItem).filter(ItineraryItem.place_id == dup.id).delete()
                            db.query(SavedPlace).filter(SavedPlace.place_id == dup.id).delete()
                            db.delete(dup)

                # Clean up non-canonical transient/test records erroneously attached to this canonical destination
                for p in db.query(Place).filter(Place.destination_id == dest_obj.id).all():
                    if p.slug not in canonical_slugs_for_dest and (
                        p.id.startswith("osm-") or p.id.startswith("gp-") or p.id.startswith("live-") or p.id.startswith("temp-") or p.id == "mussoorie_landour_bakehouse"
                    ):
                        db.query(Vote).filter(Vote.place_id == p.id).delete()
                        db.query(ItineraryItem).filter(ItineraryItem.place_id == p.id).delete()
                        db.query(SavedPlace).filter(SavedPlace.place_id == p.id).delete()
                        db.delete(p)
        db.flush()

        # Clean up only orphan places referencing non-existent destinations
        valid_dest_ids = {d.id for d in dest_objects.values()}
        for old_p in db.query(Place).all():
            if old_p.destination_id not in valid_dest_ids:
                db.query(Vote).filter(Vote.place_id == old_p.id).delete()
                db.query(ItineraryItem).filter(ItineraryItem.place_id == old_p.id).delete()
                db.query(SavedPlace).filter(SavedPlace.place_id == old_p.id).delete()
                db.delete(old_p)
        db.commit()

        # 5. Seed Curated Stays (Hotels) for all 26 destinations
        curated_hotels_by_dest = ADDITIONAL_HOTELS_BY_DEST
        for dest_slug, hotel_list in curated_hotels_by_dest.items():
            if dest_slug in dest_objects:
                dest_obj = dest_objects[dest_slug]
                for h_data in hotel_list:
                    existing_h = db.query(Hotel).filter(
                        Hotel.destination_id == dest_obj.id,
                        Hotel.name == h_data["name"]
                    ).first()
                    if not existing_h:
                        h = Hotel(destination_id=dest_obj.id, **h_data)
                        db.add(h)
                    else:
                        for k, v in h_data.items():
                            if k not in ("id", "destination_id"):
                                setattr(existing_h, k, v)
        db.flush()

        # Clean up orphan hotels referencing non-existent destinations
        for old_h in db.query(Hotel).all():
            if old_h.destination_id not in valid_dest_ids:
                db.delete(old_h)
        db.commit()

        # 6. Seed Curated Rentals for all 26 destinations
        curated_rentals_by_dest = ADDITIONAL_RENTALS_BY_DEST
        for dest_slug, rental_list in curated_rentals_by_dest.items():
            if dest_slug in dest_objects:
                dest_obj = dest_objects[dest_slug]
                for r_data in rental_list:
                    existing_r = db.query(RentalOption).filter(
                        RentalOption.destination_id == dest_obj.id,
                        RentalOption.vehicle_name == r_data["vehicle_name"]
                    ).first()
                    if not existing_r:
                        r = RentalOption(destination_id=dest_obj.id, **r_data)
                        db.add(r)
                    else:
                        for k, v in r_data.items():
                            if k not in ("id", "destination_id"):
                                setattr(existing_r, k, v)
        db.flush()

        # Clean up legacy rentals with missing destinations
        from app.services.mobility_service import MobilityService
        valid_dest_dict = {d.id: d for d in dest_objects.values()}
        for old_r in db.query(RentalOption).all():
            if old_r.destination_id not in valid_dest_ids:
                db.delete(old_r)
                continue
            dest_obj = valid_dest_dict.get(old_r.destination_id)
            if dest_obj:
                old_r.image_url = MobilityService.resolve_mobility_artwork(
                    vehicle_type=old_r.vehicle_type,
                    vehicle_name=old_r.vehicle_name,
                    destination_name=dest_obj.name,
                    destination_slug=dest_obj.slug,
                )
        db.commit()

        # 7. Seed Verified Real Rental Providers
        from app.seed.seed_real_rentals import seed_verified_rentals
        seed_verified_rentals(db)

        db.commit()

        logger.info("VANVAS curated travel database successfully seeded with all 26 canonical destinations, places, hotels, and rentals.")
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}", exc_info=True)
        raise e
    finally:
        if owns_session:
            db.close()

if __name__ == "__main__":
    seed_database()
