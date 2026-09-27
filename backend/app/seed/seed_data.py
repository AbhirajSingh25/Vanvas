import json
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    User, UserPreference, Destination, PlaceCategory, Place, Hotel,
    RentalOption, TransportOption, Trip, TripMember, Itinerary, ItineraryItem,
    Vote, Expense, SavedPlace, ChecklistItem, WeatherSnapshot
)
from app.itinerary.generator import ItineraryEngine

from app.seed.canonical_dataset import (
    CANONICAL_25_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)

def seed_database():
    from app.database.session import ensure_database_schema
    ensure_database_schema(engine)
    db: Session = SessionLocal()

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

        # 3. All Approved Curated Canonical Destinations
        destinations_data = CANONICAL_25_DESTINATIONS

        dest_objects = {}
        for d_info in destinations_data:
            dest_id = f"dest-{d_info['slug']}"
            existing = db.query(Destination).filter(
                (Destination.slug == d_info["slug"]) | (Destination.id == dest_id)
            ).first()
            if not existing:
                dest = Destination(id=dest_id, **d_info)
                db.add(dest)
                db.flush()
                dest_objects[dest.slug] = dest
            else:
                existing.id = dest_id
                for k, v in d_info.items():
                    setattr(existing, k, v)
                db.flush()
                dest_objects[existing.slug] = existing

        # 4. Authentic Verified Places per Destination (Strict Isolation)
        curated_places_by_dest = ADDITIONAL_PLACES_BY_DEST
        curated_place_keys = set()
        for dest_slug, places_list in curated_places_by_dest.items():
            if dest_slug in dest_objects:
                dest_obj = dest_objects[dest_slug]
                for p_data in places_list:
                    curated_place_keys.add((dest_obj.id, p_data["slug"]))
                    existing_p = db.query(Place).filter(Place.destination_id == dest_obj.id, Place.slug == p_data["slug"]).first()
                    if not existing_p:
                        p = Place(destination_id=dest_obj.id, **p_data)
                        db.add(p)
                    else:
                        for k, v in p_data.items():
                            setattr(existing_p, k, v)

        # Clean up legacy / orphan / duplicate places
        seen_dest_slug = set()
        for old_p in db.query(Place).all():
            key = (old_p.destination_id, old_p.slug)
            if key not in curated_place_keys or key in seen_dest_slug:
                db.query(Vote).filter(Vote.place_id == old_p.id).delete()
                db.query(ItineraryItem).filter(ItineraryItem.place_id == old_p.id).delete()
                db.query(SavedPlace).filter(SavedPlace.place_id == old_p.id).delete()
                db.delete(old_p)
            else:
                seen_dest_slug.add(key)
        db.flush()

        # 5. Seed Curated Stays (Hotels) for all 26 destinations
        curated_hotels_by_dest = ADDITIONAL_HOTELS_BY_DEST
        for dest_slug, hotel_list in curated_hotels_by_dest.items():
            if dest_slug in dest_objects:
                dest_obj = dest_objects[dest_slug]
                for h_data in hotel_list:
                    existing_h = db.query(Hotel).filter(Hotel.destination_id == dest_obj.id, Hotel.name == h_data["name"]).first()
                    if not existing_h:
                        h = Hotel(destination_id=dest_obj.id, **h_data)
                        db.add(h)
                    else:
                        for k, v in h_data.items():
                            setattr(existing_h, k, v)

        # Clean up legacy / orphan hotels
        curated_hotel_names = {h["name"] for hotel_list in curated_hotels_by_dest.values() for h in hotel_list}
        valid_dest_ids = {d.id for d in db.query(Destination).all()}
        for old_h in db.query(Hotel).all():
            if old_h.name not in curated_hotel_names or old_h.destination_id not in valid_dest_ids:
                db.delete(old_h)
        db.flush()

        # 6. Seed Curated Rentals for all 26 destinations
        curated_rentals_by_dest = ADDITIONAL_RENTALS_BY_DEST
        for dest_slug, rental_list in curated_rentals_by_dest.items():
            if dest_slug in dest_objects:
                dest_obj = dest_objects[dest_slug]
                for r_data in rental_list:
                    existing_r = db.query(RentalOption).filter(RentalOption.destination_id == dest_obj.id, RentalOption.vehicle_name == r_data["vehicle_name"]).first()
                    if not existing_r:
                        r = RentalOption(destination_id=dest_obj.id, **r_data)
                        db.add(r)
                    else:
                        for k, v in r_data.items():
                            setattr(existing_r, k, v)
        db.flush()

        # Clean up legacy rentals with stale/invalid image URLs or missing destinations
        valid_dest_ids = {d.id for d in db.query(Destination).all()}
        for old_r in db.query(RentalOption).all():
            if old_r.destination_id not in valid_dest_ids:
                db.delete(old_r)
                continue
            if old_r.image_url and (".svg" in old_r.image_url or "unsplash" in old_r.image_url):
                if "himalayan" in old_r.vehicle_name.lower():
                    old_r.image_url = "/images/vehicles/adventure_motorcycle.jpg"
                elif "bullet" in old_r.vehicle_name.lower() or "classic" in old_r.vehicle_name.lower():
                    old_r.image_url = "/images/vehicles/classic_bullet.jpg"
                elif "activa" in old_r.vehicle_name.lower() or "scooter" in old_r.vehicle_name.lower() or "jupiter" in old_r.vehicle_name.lower():
                    old_r.image_url = "/images/vehicles/automatic_scooter.jpg"
                elif "bike" in old_r.vehicle_name.lower() or "cycle" in old_r.vehicle_name.lower():
                    old_r.image_url = "/images/vehicles/mountain_bike.jpg"
                else:
                    old_r.image_url = "/images/vehicles/universal_mobility.jpg"
        db.flush()

        # 7. Seed Verified Real Rental Providers
        from app.seed.seed_real_rentals import seed_verified_rentals
        seed_verified_rentals(db)

        db.flush()
        db.commit()

        print("VANVAS curated travel database successfully seeded with all 26 canonical destinations, places, hotels, and rentals.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
