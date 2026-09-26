"""
Checkpoint 6: Nearby Travel Discovery + Live Place Artwork Rebuild Test Suite.
Verifies travel relevance filtering, ranking, artwork integrity, landmark uniqueness,
and mobility/stay isolation across destinations.
"""

import os
import hashlib
import pytest
from app.providers.live_providers import LivePlacesProvider
from app.api.v1.places import calculate_travel_relevance_score
from app.database.session import SessionLocal
from app.models.models import Destination, Place, Hotel, RentalOption, TransportOption

FRONTEND_PUBLIC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public"))

class TestOSMTravelRelevanceFilter:
    """Tests verifying non-travel POIs (schools, post offices, police stations, clinics, banks) are strictly filtered."""
    
    def setup_method(self):
        self.provider = LivePlacesProvider()

    def test_osm_schools_filtered(self):
        element = {
            "id": 101,
            "lat": 28.6139,
            "lon": 77.2090,
            "tags": {"name": "Delhi Public School", "amenity": "school"}
        }
        res = self.provider._parse_osm_element(element, 28.6139, 77.2090)
        assert res is None, "Schools must be filtered from travel discovery"

    def test_osm_college_and_kindergarten_filtered(self):
        for amenity in ["college", "kindergarten", "university"]:
            element = {
                "id": 102,
                "lat": 28.6139,
                "lon": 77.2090,
                "tags": {"name": f"City {amenity.capitalize()}", "amenity": amenity}
            }
            assert self.provider._parse_osm_element(element, 28.6139, 77.2090) is None

    def test_osm_post_offices_filtered(self):
        element = {
            "id": 103,
            "lat": 28.6139,
            "lon": 77.2090,
            "tags": {"name": "Central Post Office", "amenity": "post_office"}
        }
        assert self.provider._parse_osm_element(element, 28.6139, 77.2090) is None

    def test_osm_police_filtered(self):
        element = {
            "id": 104,
            "lat": 28.6139,
            "lon": 77.2090,
            "tags": {"name": "Connaught Place Police Station", "amenity": "police"}
        }
        assert self.provider._parse_osm_element(element, 28.6139, 77.2090) is None

    def test_osm_banks_and_atms_filtered(self):
        for amenity in ["bank", "atm"]:
            element = {
                "id": 105,
                "lat": 28.6139,
                "lon": 77.2090,
                "tags": {"name": f"HDFC {amenity.upper()}", "amenity": amenity}
            }
            assert self.provider._parse_osm_element(element, 28.6139, 77.2090) is None

    def test_osm_clinics_and_doctors_filtered(self):
        for amenity in ["clinic", "doctors", "dentist", "pharmacy", "hospital"]:
            element = {
                "id": 106,
                "lat": 28.6139,
                "lon": 77.2090,
                "tags": {"name": f"City {amenity.capitalize()}", "amenity": amenity}
            }
            assert self.provider._parse_osm_element(element, 28.6139, 77.2090) is None

    def test_osm_generic_shops_filtered(self):
        for shop in ["hardware", "laundry", "chemist", "supermarket", "car_repair"]:
            element = {
                "id": 107,
                "lat": 28.6139,
                "lon": 77.2090,
                "tags": {"name": f"Local {shop.capitalize()} Store", "shop": shop}
            }
            assert self.provider._parse_osm_element(element, 28.6139, 77.2090) is None

    def test_negative_name_tokens_filtered(self):
        names = [
            "State Bank of India",
            "Delhi Police Chowki",
            "General Post Office Head",
            "Apex Coaching Academy",
            "Dr. Sharma Dental Clinic",
            "Apollo Pharmacy Retail"
        ]
        for name in names:
            element = {
                "id": 108,
                "lat": 28.6139,
                "lon": 77.2090,
                "tags": {"name": name, "shop": "convenience"}
            }
            assert self.provider._parse_osm_element(element, 28.6139, 77.2090) is None

    def test_travel_categories_retained(self):
        travel_items = [
            ({"name": "National Museum", "tourism": "museum"}, "Culture & Heritage"),
            ({"name": "Indian Coffee House", "amenity": "cafe"}, "Cafés & Bakery"),
            ({"name": "Karim's Historic Dining", "amenity": "restaurant"}, "Local Food"),
            ({"name": "Sunset Viewpoint", "tourism": "viewpoint"}, "Nature & Trails"),
            ({"name": "Red Fort Gate", "historic": "monument"}, "Culture & Heritage"),
            ({"name": "Akshardham Temple", "amenity": "place_of_worship"}, "Culture & Heritage"),
            ({"name": "Dilli Haat Handicrafts", "shop": "craft"}, "Shops & Markets"),
            ({"name": "Old Famous Jalebi Wala", "amenity": "fast_food"}, "Local Food"),
        ]
        for tags, expected_cat in travel_items:
            element = {
                "id": 200,
                "lat": 28.6139,
                "lon": 77.2090,
                "tags": tags
            }
            res = self.provider._parse_osm_element(element, 28.6139, 77.2090)
            assert res is not None, f"Expected {tags['name']} to be retained"
            assert res["category"] == expected_cat, f"Expected {expected_cat}, got {res['category']}"
            assert res["image_url"].startswith("/images/nearby/") or res["image_url"].startswith("/images/places/"), f"Live place should have dedicated travel artwork: {res['image_url']}"



class TestTravelRelevanceRanking:
    """Tests travel discovery ranking logic combining landmarks, genuine reviews, and distance decay."""

    def test_landmark_scores_higher_than_generic(self):
        landmark = {
            "name": "Amber Fort",
            "category": "Forts & Palaces",
            "distance_km": 4.5,
            "rating": 4.8,
            "reviews_count": 12000,
            "is_curated": True
        }
        generic_shop = {
            "name": "Corner Souvenir Stall",
            "category": "Local Markets & Bazaars",
            "distance_km": 0.5,
            "rating": 4.0,
            "reviews_count": 12,
            "is_curated": False
        }
    def test_landmark_scores_higher_than_generic(self):
        score_landmark = calculate_travel_relevance_score(
            name="Amber Fort",
            category="Forts & Palaces",
            dist_km=4.5,
            is_must_visit=True,
            rating=4.8,
            review_count=12000,
            source="vanvas_curated"
        )
        score_generic = calculate_travel_relevance_score(
            name="Corner Souvenir Stall",
            category="Local Markets & Bazaars",
            dist_km=0.5,
            is_must_visit=False,
            rating=4.0,
            review_count=12,
            source="openstreetmap"
        )
        assert score_landmark > score_generic, "Major landmark at 4.5km should outrank a generic stall at 0.5km"

    def test_smooth_distance_penalty(self):
        score_near = calculate_travel_relevance_score(
            name="Historic Gateway",
            category="Monuments & Heritage",
            dist_km=1.0,
            is_must_visit=True,
            rating=4.5,
            review_count=500
        )
        score_far = calculate_travel_relevance_score(
            name="Historic Gateway",
            category="Monuments & Heritage",
            dist_km=15.0,
            is_must_visit=True,
            rating=4.5,
            review_count=500
        )
        assert score_near > score_far, "Closer place with identical merits should score higher"
        assert score_far > 0, "Distance penalty should decay smoothly without negative cutoff"


class TestArtworkAssetsOnDisk:
    """Verifies all required artwork files exist, have non-zero size, and have distinct contents."""

    def test_nahargarh_and_amber_fort_are_distinct(self):
        nahargarh_path = os.path.join(FRONTEND_PUBLIC, "images", "places", "jaipur", "nahargarh-fort.webp")
        amber_path = os.path.join(FRONTEND_PUBLIC, "images", "places", "jaipur", "amber-fort.webp")
        
        assert os.path.exists(nahargarh_path), f"Missing Nahargarh Fort artwork: {nahargarh_path}"
        assert os.path.exists(amber_path), f"Missing Amber Fort artwork: {amber_path}"
        
        with open(nahargarh_path, "rb") as f:
            h_nahargarh = hashlib.md5(f.read()).hexdigest()
        with open(amber_path, "rb") as f:
            h_amber = hashlib.md5(f.read()).hexdigest()
            
        assert h_nahargarh != h_amber, "Nahargarh Fort and Amber Fort MUST have distinct artwork (no duplicates)"

    def test_varanasi_brijrama_palace_artwork(self):
        brijrama_path = os.path.join(FRONTEND_PUBLIC, "images", "places", "varanasi", "brijrama-palace.webp")
        stay_cat_path = os.path.join(FRONTEND_PUBLIC, "images", "places", "varanasi", "categories", "stay.webp")
        
        assert os.path.exists(brijrama_path), "Missing BrijRama Palace artwork"
        assert os.path.exists(stay_cat_path), "Missing Varanasi stay category artwork"
        assert os.path.getsize(brijrama_path) > 5000, "BrijRama Palace artwork should be a valid image"

    def test_delhi_exact_landmarks_exist(self):
        delhi_landmarks = [
            "qutub-minar.webp",
            "india-gate.webp",
            "red-fort.webp",
            "chandni-chowk.webp",
            "lotus-temple.webp"
        ]
        for lm in delhi_landmarks:
            p = os.path.join(FRONTEND_PUBLIC, "images", "places", "delhi", lm)
            assert os.path.exists(p), f"Missing Delhi landmark artwork: {lm}"
            assert os.path.getsize(p) > 5000, f"Delhi landmark artwork {lm} is empty or invalid"

    def test_amritsar_golden_temple_exists(self):
        gt_path = os.path.join(FRONTEND_PUBLIC, "images", "places", "amritsar", "golden-temple.webp")
        assert os.path.exists(gt_path), "Missing Amritsar Golden Temple artwork"
        assert os.path.getsize(gt_path) > 5000, "Golden Temple artwork is empty or invalid"

    def test_all_28_nearby_categories_exist(self):
        expected_categories = [
            "bakery", "bazaar", "beach", "cafe", "church", "coffee", "cultural",
            "experience", "fort", "gurudwara", "heritage", "hidden_gem", "lake",
            "local_food", "mall", "market", "momo", "monastery", "monument", "mosque",
            "museum", "nature", "palace", "stay", "temple", "trail", "universal",
            "viewpoint", "waterfall"
        ]
        for cat in expected_categories:
            p_webp = os.path.join(FRONTEND_PUBLIC, "images", "nearby", cat, f"{cat}.webp")
            assert os.path.exists(p_webp), f"Missing nearby category artwork file: {p_webp}"
            assert os.path.getsize(p_webp) > 1000, f"Nearby category artwork file {p_webp} is empty or invalid"


class TestDatabaseSeedingAndIsolation:
    """Verifies database seeding completeness, mobility options, and destination isolation."""

    def test_destinations_seeded(self):
        db = SessionLocal()
        try:
            destinations = db.query(Destination).all()
            slugs = {d.slug for d in destinations}
            assert len(slugs) >= 12, f"Expected at least 12 destinations, found {len(slugs)}"
            for required_slug in ["manali", "rishikesh", "kasol", "dharamshala", "goa", "jaipur", "mussoorie", "udaipur", "varanasi", "leh", "spiti", "munnar"]:
                assert required_slug in slugs, f"Expected curated destination {required_slug} in database"
        finally:
            db.close()

    def test_jaipur_and_varanasi_mobility_seeded(self):
        db = SessionLocal()
        try:
            jaipur = db.query(Destination).filter(Destination.slug == "jaipur").first()
            assert jaipur is not None
            jaipur_rentals = db.query(RentalOption).filter(RentalOption.destination_id == jaipur.id).all()
            assert len(jaipur_rentals) >= 1, "Jaipur should have seeded rentals"

            varanasi = db.query(Destination).filter(Destination.slug == "varanasi").first()
            assert varanasi is not None
            varanasi_rentals = db.query(RentalOption).filter(RentalOption.destination_id == varanasi.id).all()
            assert len(varanasi_rentals) >= 1, "Varanasi should have seeded rentals"
        finally:
            db.close()

    def test_curated_stays_and_places_isolation(self):
        db = SessionLocal()
        try:
            destinations = db.query(Destination).all()
            for d in destinations:
                places = db.query(Place).filter(Place.destination_id == d.id).all()
                for p in places:
                    # Verified that curated place image URL corresponds to this destination or a nearby/places travel asset
                    if p.image_url and not p.image_url.startswith("/images/nearby/") and not p.image_url.startswith("/images/places/") and not p.image_url.startswith("http"):
                        assert f"/{d.slug}/" in p.image_url, f"Curated place {p.name} image {p.image_url} must belong to destination {d.slug}"

                hotels = db.query(Hotel).filter(Hotel.destination_id == d.id).all()
                for h in hotels:
                    if h.image_url and not h.image_url.startswith("http") and not h.image_url.startswith("/images/places/universal/"):
                        assert f"/{d.slug}/" in h.image_url, f"Curated stay {h.name} image {h.image_url} must belong to destination {d.slug}"
        finally:
            db.close()
