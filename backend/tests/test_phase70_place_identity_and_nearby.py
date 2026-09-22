import pytest
import os
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, Base, engine
from app.models.models import User, Destination, Place, SavedPlace
from app.core.security import get_password_hash
from app.itinerary.clustering import haversine_distance_km
from app.providers.artwork_provider import CuratedArtworkProvider
from app.providers.live_providers import LivePlacesProvider

client = TestClient(app)

@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture(scope="module")
def auth_headers(test_db):
    user = test_db.query(User).filter(User.email == "traveller@vanvas.com").first()
    if not user:
        user = User(
            email="traveller@vanvas.com",
            hashed_password=get_password_hash("vanvas123"),
            full_name="Test Traveller",
            role="traveller"
        )
        test_db.add(user)
        test_db.commit()
    
    res = client.post("/api/v1/auth/login", json={"email": "traveller@vanvas.com", "password": "vanvas123"})
    token = res.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}

# ==========================================================
# PHASE 1: DISK ASSETS & ARTWORK INTEGRITY
# ==========================================================

def test_artwork_identity_on_disk_assets():
    frontend_public = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public"))
    
    # 1. Bagore Ki Haveli
    bagore_path = os.path.join(frontend_public, "images", "places", "udaipur", "bagore-ki-haveli.webp")
    assert os.path.exists(bagore_path), f"Bagore Ki Haveli asset missing at {bagore_path}"
    
    # 2. Saheliyon Ki Bari
    saheliyon_path = os.path.join(frontend_public, "images", "places", "udaipur", "saheliyon-ki-bari.webp")
    assert os.path.exists(saheliyon_path), f"Saheliyon Ki Bari asset missing at {saheliyon_path}"
    
    # 3. City Palace
    city_palace_path = os.path.join(frontend_public, "images", "places", "udaipur", "city-palace-udaipur.webp")
    assert os.path.exists(city_palace_path), f"City Palace asset missing at {city_palace_path}"
    
    # 4. Lake Pichola
    lake_pichola_path = os.path.join(frontend_public, "images", "places", "udaipur", "lake-pichola.webp")
    assert os.path.exists(lake_pichola_path), f"Lake Pichola asset missing at {lake_pichola_path}"
    
    # 5. Universal Transport (Motorcycle / Mobility)
    transport_path = os.path.join(frontend_public, "images", "places", "universal", "transport.webp")
    assert os.path.exists(transport_path), f"Universal Transport asset missing at {transport_path}"
    
    # 6. Spiti Stay Sanctuary
    spiti_stay_path = os.path.join(frontend_public, "images", "places", "spiti", "categories", "stay.webp")
    assert os.path.exists(spiti_stay_path), f"Spiti Stay asset missing at {spiti_stay_path}"

    # 7. Rishikesh Distinct Landmark Assets
    beatles_path = os.path.join(frontend_public, "images", "places", "rishikesh", "beatles-ashram.webp")
    neer_garh_path = os.path.join(frontend_public, "images", "places", "rishikesh", "neer-garh-waterfall.webp")
    parmarth_path = os.path.join(frontend_public, "images", "places", "rishikesh", "parmarth-niketan.webp")
    shivpuri_path = os.path.join(frontend_public, "images", "places", "rishikesh", "shivpuri-rafting.webp")
    little_buddha_path = os.path.join(frontend_public, "images", "places", "rishikesh", "little-buddha-cafe.webp")
    triveni_path = os.path.join(frontend_public, "images", "places", "rishikesh", "triveni-ghat.webp")
    
    assert os.path.exists(beatles_path), f"Beatles Ashram asset missing at {beatles_path}"
    assert os.path.exists(neer_garh_path), f"Neer Garh Waterfall asset missing at {neer_garh_path}"
    assert os.path.exists(parmarth_path), f"Parmarth Niketan asset missing at {parmarth_path}"
    assert os.path.exists(shivpuri_path), f"Shivpuri Rafting asset missing at {shivpuri_path}"
    assert os.path.exists(little_buddha_path), f"Little Buddha Cafe asset missing at {little_buddha_path}"
    assert os.path.exists(triveni_path), f"Triveni Ghat asset missing at {triveni_path}"

    # Verify uniqueness of files
    rishikesh_sizes = {
        "beatles": os.path.getsize(beatles_path),
        "neer_garh": os.path.getsize(neer_garh_path),
        "parmarth": os.path.getsize(parmarth_path),
        "shivpuri": os.path.getsize(shivpuri_path),
        "little_buddha": os.path.getsize(little_buddha_path),
        "triveni": os.path.getsize(triveni_path),
    }
    assert len(set(rishikesh_sizes.values())) == len(rishikesh_sizes), "All Rishikesh landmarks must have unique distinct assets!"

def test_stay_artwork_isolation_backend():
    provider = CuratedArtworkProvider()
    
    # 1. Jagat Niwas Palace Lakeside Heritage (Udaipur Stay)
    jagat_res = asyncio.run(provider.resolve_place_artwork(
        place_name="Jagat Niwas Palace Lakeside Heritage",
        destination_name="Udaipur",
        category="Stays & Sanctuaries"
    ))
    assert "lake-pichola" not in jagat_res["image_url"], "Jagat Niwas stay MUST NEVER resolve to Lake Pichola artwork!"
    assert "stay" in jagat_res["image_url"], f"Jagat Niwas must resolve to stay category asset, got {jagat_res['image_url']}"
    
    # 2. Ganga Kinare Riverside Retreat (Rishikesh Stay)
    ganga_res = asyncio.run(provider.resolve_place_artwork(
        place_name="Ganga Kinare Riverside Retreat",
        destination_name="Rishikesh",
        category="Stays & Sanctuaries"
    ))
    assert "hero.jpg" not in ganga_res["image_url"], "Ganga Kinare must NOT resolve to destination hero bridge!"
    assert "stay" in ganga_res["image_url"], f"Ganga Kinare must resolve to stay category asset, got {ganga_res['image_url']}"

def test_rishikesh_semantic_place_artwork():
    provider = CuratedArtworkProvider()
    
    # Beatles Ashram
    beatles = asyncio.run(provider.resolve_place_artwork(
        place_name="The Beatles Ashram (Chaurasi Kutia)",
        destination_name="Rishikesh",
        category="Culture & Heritage"
    ))
    assert "beatles-ashram" in beatles["image_url"]

    # Neer Garh Waterfall
    waterfall = asyncio.run(provider.resolve_place_artwork(
        place_name="Neer Garh Multi-Tier Waterfall",
        destination_name="Rishikesh",
        category="Nature & Trails"
    ))
    assert "neer-garh-waterfall" in waterfall["image_url"]

    # Parmarth Niketan Ganga Aarti
    parmarth = asyncio.run(provider.resolve_place_artwork(
        place_name="Parmarth Niketan Ganga Aarti",
        destination_name="Rishikesh",
        category="Culture & Heritage"
    ))
    assert "parmarth-niketan" in parmarth["image_url"]

    # Shivpuri White Water Rafting
    rafting = asyncio.run(provider.resolve_place_artwork(
        place_name="Shivpuri White Water Rafting",
        destination_name="Rishikesh",
        category="Adventure"
    ))
    assert "shivpuri-rafting" in rafting["image_url"]

# ==========================================================
# PHASE 2: GPS NEARBY & LIVE DISCOVERY PIPELINE
# ==========================================================

def test_nearby_raw_gps_coordinates_delhi():
    # Production test coordinates
    delhi_lat = 28.6746
    delhi_lng = 77.0666
    
    res = client.get(f"/api/v1/places/nearby?lat={delhi_lat}&lng={delhi_lng}&radius_km=10.0")
    assert res.status_code == 200
    places = res.json()
    assert isinstance(places, list)
    assert len(places) > 0, "GPS nearby for Delhi coordinates (28.6746, 77.0666) must return real live POIs!"
    
    for p in places:
        assert "id" in p
        assert "name" in p
        assert "category" in p
        assert "latitude" in p
        assert "longitude" in p
        assert "distance_km" in p
        assert p["distance_km"] <= 10.1, f"Place distance {p['distance_km']} exceeds requested radius 10.0 km"
        assert p["distance_km"] >= 0.0

def test_nearby_second_arbitrary_location_connaught_place():
    cp_lat = 28.6315
    cp_lng = 77.2167
    
    res = client.get(f"/api/v1/places/nearby?lat={cp_lat}&lng={cp_lng}&radius_km=5.0")
    assert res.status_code == 200
    places = res.json()
    assert isinstance(places, list)
    assert len(places) > 0, "Nearby search for Connaught Place must return live places!"
    
    # Must contain live POI with valid source
    live_sources = {p.get("source") for p in places}
    assert any(s in live_sources for s in ["openstreetmap", "google_places"]), "Must contain live provider sources"

def test_nearby_distance_sorting():
    lat = 28.6746
    lng = 77.0666
    res = client.get(f"/api/v1/places/nearby?lat={lat}&lng={lng}&radius_km=10.0&sort_by=distance")
    assert res.status_code == 200
    places = res.json()
    assert len(places) > 0
    
    distances = [p["distance_km"] for p in places if p.get("distance_km") is not None]
    assert distances == sorted(distances), f"Distances must be sorted ascending: {distances}"

def test_nearby_category_filtering():
    lat = 28.6746
    lng = 77.0666
    
    res_coffee = client.get(f"/api/v1/places/nearby?lat={lat}&lng={lng}&radius_km=15.0&category=coffee")
    assert res_coffee.status_code == 200
    coffee_places = res_coffee.json()
    assert len(coffee_places) > 0, "Coffee filter must return coffee/cafes"
    for p in coffee_places:
        assert any(term in p["category"].lower() for term in ["caf", "bakery", "coffee"])

def test_nearby_radius_enforcement():
    lat = 28.6746
    lng = 77.0666
    
    res_1km = client.get(f"/api/v1/places/nearby?lat={lat}&lng={lng}&radius_km=1.0")
    assert res_1km.status_code == 200
    places_1km = res_1km.json()
    for p in places_1km:
        assert p["distance_km"] <= 1.1, f"Radius 1km violation: {p['name']} at {p['distance_km']}km"
    
    res_25km = client.get(f"/api/v1/places/nearby?lat={lat}&lng={lng}&radius_km=25.0")
    assert res_25km.status_code == 200
    places_25km = res_25km.json()
    assert len(places_25km) >= len(places_1km), "25km radius must return equal or more places than 1km"

def test_save_and_retrieve_live_poi(auth_headers):
    live_poi_id = "osm-node-99887766"
    
    res_save = client.post(f"/api/v1/places/saved/{live_poi_id}", headers=auth_headers)
    assert res_save.status_code == 200
    data = res_save.json()
    assert data["saved"] is True
    
    res_saved_list = client.get("/api/v1/places/saved", headers=auth_headers)
    assert res_saved_list.status_code == 200
    saved = res_saved_list.json()
    saved_ids = [p["id"] for p in saved]
    assert live_poi_id in saved_ids
    
    res_unsave = client.post(f"/api/v1/places/saved/{live_poi_id}", headers=auth_headers)
    assert res_unsave.status_code == 200
    assert res_unsave.json()["saved"] is False

def test_get_place_detail_live_id():
    live_id = "osm-12345678"
    res = client.get(f"/api/v1/places/{live_id}")
    assert res.status_code == 200
    place = res.json()
    assert place["id"] == live_id
    assert place["data_state"] == "LIVE"
