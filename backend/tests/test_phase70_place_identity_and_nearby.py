import pytest
import os
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, Base, engine
from app.models.models import User, Destination, Place, SavedPlace
from app.core.security import get_password_hash
from app.itinerary.clustering import haversine_distance_km

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
# PHASE 1 & 2 & 22: PLACE ARTWORK IDENTITY AUDIT & REGRESSION
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

    # Verify Bagore and City Palace and Saheliyon Ki Bari and Lake Pichola are NOT identical file sizes
    size_bagore = os.path.getsize(bagore_path)
    size_saheliyon = os.path.getsize(saheliyon_path)
    size_city_palace = os.path.getsize(city_palace_path)
    size_lake_pichola = os.path.getsize(lake_pichola_path)
    size_transport = os.path.getsize(transport_path)
    
    assert size_bagore != size_city_palace, "Bagore Ki Haveli must NOT be identical to City Palace asset!"
    assert size_saheliyon != size_lake_pichola, "Saheliyon Ki Bari must NOT be identical to Lake Pichola asset!"
    assert size_saheliyon != size_city_palace, "Saheliyon Ki Bari must NOT be identical to City Palace asset!"

def test_seed_data_artwork_integrity(test_db):
    udaipur_places = test_db.query(Place).join(Destination).filter(Destination.slug == "udaipur").all()
    assert len(udaipur_places) > 0, "Udaipur places should exist in DB"
    
    place_map = {p.name: p.image_url for p in udaipur_places}
    
    # Check Bagore Ki Haveli
    bagore_names = [n for n in place_map if "Bagore" in n]
    assert len(bagore_names) > 0, "Bagore Ki Haveli should be in seed database"
    assert "bagore-ki-haveli.webp" in place_map[bagore_names[0]]
    assert "city-palace" not in place_map[bagore_names[0]]
    
    # Check Saheliyon Ki Bari
    saheliyon_names = [n for n in place_map if "Saheliyon" in n]
    assert len(saheliyon_names) > 0, "Saheliyon Ki Bari should be in seed database"
    assert "saheliyon-ki-bari.webp" in place_map[saheliyon_names[0]]
    
    # Check City Palace
    cp_names = [n for n in place_map if "City Palace" in n]
    assert len(cp_names) > 0
    assert "city-palace-udaipur.webp" in place_map[cp_names[0]]
    
    # Check Lake Pichola
    lp_names = [n for n in place_map if "Lake Pichola" in n or "Pichola" in n]
    assert len(lp_names) > 0
    assert "lake-pichola.webp" in place_map[lp_names[0]]

# ==========================================================
# PHASE 8 - 21: NEARBY GPS & LIVE POI DISCOVERY SYSTEM TESTS
# ==========================================================

def test_nearby_arbitrary_coordinates_delhi():
    delhi_lat = 28.6315
    delhi_lng = 77.2167
    
    res = client.get(f"/api/v1/places/nearby?lat={delhi_lat}&lng={delhi_lng}&radius_km=10.0")
    assert res.status_code == 200
    places = res.json()
    assert isinstance(places, list)
    
    for p in places:
        assert "id" in p
        assert "name" in p
        assert "category" in p
        assert "latitude" in p
        assert "longitude" in p
        assert "distance_km" in p
        assert p["distance_km"] >= 0.0

def test_nearby_distance_sorting():
    lat = 32.2396
    lng = 77.1887
    res = client.get(f"/api/v1/places/nearby?lat={lat}&lng={lng}&radius_km=15.0&sort_by=distance")
    assert res.status_code == 200
    places = res.json()
    assert len(places) > 0
    
    distances = [p["distance_km"] for p in places if p.get("distance_km") is not None]
    assert distances == sorted(distances)

def test_nearby_category_filtering():
    lat = 32.2396
    lng = 77.1887
    
    res_food = client.get(f"/api/v1/places/nearby?lat={lat}&lng={lng}&radius_km=15.0&category=food")
    assert res_food.status_code == 200
    food_places = res_food.json()
    for p in food_places:
        assert any(term in p["category"].lower() for term in ["food", "caf", "dining", "bakery", "restaurant"])

    res_coffee = client.get(f"/api/v1/places/nearby?lat={lat}&lng={lng}&radius_km=15.0&category=coffee")
    assert res_coffee.status_code == 200
    coffee_places = res_coffee.json()
    for p in coffee_places:
        assert any(term in p["category"].lower() for term in ["caf", "bakery", "coffee"])

def test_nearby_radius_expansion():
    lat = 32.2396
    lng = 77.1887
    
    res_small = client.get(f"/api/v1/places/nearby?lat={lat}&lng={lng}&radius_km=1.0")
    assert res_small.status_code == 200
    places_small = res_small.json()
    
    res_large = client.get(f"/api/v1/places/nearby?lat={lat}&lng={lng}&radius_km=25.0")
    assert res_large.status_code == 200
    places_large = res_large.json()
    
    assert len(places_large) >= len(places_small)

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

def test_destination_autocomplete_arbitrary():
    res = client.get("/api/v1/destinations/search?q=Connaught+Place&limit=5")
    assert res.status_code == 200
    results = res.json()
    assert isinstance(results, list)
