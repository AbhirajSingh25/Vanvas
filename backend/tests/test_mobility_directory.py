import pytest
import asyncio
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import Base, get_db
from app.models.models import Destination, MobilityProvider, MobilityVehicle, RentalOption
from app.services.action_link_generator import ActionLinkGenerator, is_valid_url, is_valid_phone
from app.providers.live_providers import LiveRentalsProvider
from app.services.mobility_service import MobilityService

# In-memory test SQLite DB setup
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    db = TestingSessionLocal()
    
    # Create test destination
    dest = Destination(
        id="dest-manali-test",
        name="Manali",
        slug="manali",
        state="Himachal Pradesh",
        region="Himalayan",
        tagline="Valley of the Gods",
        description="High-altitude Himalayan resort town.",
        latitude=32.2396,
        longitude=77.1887,
        is_featured=True
    )
    db.add(dest)
    db.commit()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)



client = TestClient(app)

# -------------------------------------------------------------
# 1. Action Link Generator & Truthfulness Tests
# -------------------------------------------------------------
def test_action_links_truthful_generation():
    """Verify action links only use genuine coordinates, phones, and websites."""
    # Complete real data
    links = ActionLinkGenerator.generate_rental_action_links(
        provider_name="Himalayan Two Wheels",
        latitude=32.2450,
        longitude=77.1890,
        phone="+91 98160 12345",
        whatsapp="+91 98160 12345",
        website="https://himalayantwowheels.in",
    )
    link_types = [l["type"] for l in links]
    assert "directions" in link_types
    assert "phone" in link_types
    assert "whatsapp" in link_types
    assert "website" in link_types

    dir_link = next(l for l in links if l["type"] == "directions")
    assert "32.245000,77.189000" in dir_link["url"]

    phone_link = next(l for l in links if l["type"] == "phone")
    assert phone_link["url"] == "tel:+919816012345"

    wa_link = next(l for l in links if l["type"] == "whatsapp")
    assert "wa.me/919816012345" in wa_link["url"]

def test_action_links_missing_and_dummy_rejection():
    """Verify action link generator strictly omits fake/missing data."""
    # Missing phone and dummy website
    links = ActionLinkGenerator.generate_rental_action_links(
        provider_name="Test Hub",
        latitude=32.2450,
        longitude=77.1890,
        phone=None,
        whatsapp=None,
        website="https://example.com/fake",
    )
    link_types = [l["type"] for l in links]
    assert "phone" not in link_types
    assert "whatsapp" not in link_types
    assert "website" not in link_types
    assert "directions" in link_types


# -------------------------------------------------------------
# 2. Live OSM Provider Discovery & Parsing Tests
# -------------------------------------------------------------
@pytest.mark.asyncio
async def test_live_rentals_provider_osm_parsing():
    """Verify LiveRentalsProvider accurately extracts OSM tags without fabrication."""
    provider = LiveRentalsProvider()
    
    mock_elements = [
        {
            "type": "node",
            "id": 10101,
            "lat": 32.2410,
            "lon": 77.1895,
            "tags": {
                "name": "Manali Bikers Club",
                "amenity": "motorcycle_rental",
                "addr:street": "Club House Road",
                "addr:suburb": "Old Manali",
                "addr:city": "Manali",
                "phone": "+91 98050 55555",
                "contact:whatsapp": "+91 98050 55555",
                "website": "https://manalibikersclub.com",
                "opening_hours": "09:00-20:00"
            }
        },
        {
            "type": "node",
            "id": 10102,
            "lat": 32.2425,
            "lon": 77.1880,
            "tags": {
                "name": "Himalayan MTB Cycles",
                "amenity": "bicycle_rental",
                "shop": "bicycle"
                # missing phone, website, price
            }
        }
    ]

    from app.services.cache_service import cache_service
    cache_service.clear()

    with patch.object(provider, "_execute_overpass_query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = mock_elements
        results = await provider.search_rentals(
            destination="TestManaliValley",
            lat=32.2396,
            lng=77.1887,
            radius_km=10.0
        )

        assert len(results) == 2

        # Item 1: Complete real details
        item1 = next(r for r in results if r["provider_name"] == "Manali Bikers Club")
        assert item1["phone"] == "+91 98050 55555"
        assert item1["website"] == "https://manalibikersclub.com"
        assert item1["price_per_day"] is None  # Never fabricated
        assert item1["deposit_amount"] is None  # Never fabricated
        assert "Old Manali" in item1["location"]
        assert item1["verification_status"] == "LIVE_OSM"
        assert item1["image_url"] in [
            "/images/vehicles/adventure_motorcycle.jpg",
            "/images/vehicles/classic_bullet.jpg",
            "/images/vehicles/universal_mobility.jpg"
        ]

        # Item 2: Missing phone and website
        item2 = next(r for r in results if r["provider_name"] == "Himalayan MTB Cycles")
        assert item2["phone"] is None
        assert item2["website"] is None
        assert item2["price_per_day"] is None
        assert item2["vehicle_type"] == "Mountain Bike / Bicycle"
        assert item2["image_url"] == "/images/vehicles/mountain_bike.jpg"


# -------------------------------------------------------------
# 3. Provider Data Priority & Truthful Hierarchy
# -------------------------------------------------------------
@pytest.mark.asyncio
async def test_provider_priority_hierarchy(setup_test_db):
    """Verify Priority: (1) Verified Provider -> (2) Live OSM -> (3) Curated."""
    db = setup_test_db

    # Create a verified provider in DB
    prov = MobilityProvider(
        id="prov-verified-1",
        business_name="Tiger Riders Manali",
        owner_name="Vikram Singh",
        phone="+91 98160 99999",
        whatsapp="+91 98160 99999",
        website="https://tigerriders.com",
        address="Near Mall Road, Manali",
        latitude=32.2400,
        longitude=77.1890,
        city="Manali",
        service_area="Manali, Solang, Rohtang",
        verification_status="LIVE_PROVIDER",
        claimed=True,
    )
    db.add(prov)
    db.commit()

    # Add a vehicle to the verified provider
    veh = MobilityVehicle(
        id="veh-1",
        provider_id="prov-verified-1",
        vehicle_type="Touring Motorcycle",
        brand="Royal Enfield",
        model="Himalayan 450",
        daily_price=1400.0,
        deposit=3000.0,
        availability_status="AVAILABLE",
    )
    db.add(veh)
    db.commit()

    # Mock OSM returning another listing
    mock_osm = [{
        "id": "osm-rent-999",
        "destination_id": "live",
        "provider_name": "Local Bike Point",
        "vehicle_type": "Scooter & Motorcycle",
        "vehicle_name": "Local Bike Point Fleet",
        "price_per_day": None,
        "deposit_amount": None,
        "location": "Old Manali Road",
        "latitude": 32.2420,
        "longitude": 77.1900,
        "opening_hours": "Hours not listed",
        "image_url": "/images/vehicles/universal_mobility.jpg",
        "verification_status": "LIVE_OSM",
        "distance_km": 0.5,
        "action_links": []
    }]

    with patch("app.providers.provider_factory.ProviderFactory.get_rentals_provider") as mock_factory:
        mock_provider_instance = AsyncMock()
        mock_provider_instance.search_rentals.return_value = mock_osm
        mock_factory.return_value = mock_provider_instance

        listings = await MobilityService.get_mobility_listings(
            db=db,
            destination_slug_or_id="manali"
        )

        assert len(listings) >= 2
        # Priority 1: Verified provider must appear first with LIVE_PROVIDER status and real price
        assert listings[0]["verification_status"] == "LIVE_PROVIDER"
        assert listings[0]["provider_name"] == "Tiger Riders Manali"
        assert listings[0]["price_per_day"] == 1400.0
        assert listings[0]["deposit_amount"] == 3000.0
        assert listings[0]["vehicle_name"] == "Royal Enfield Himalayan 450"

        # Priority 2: Live OSM provider
        assert listings[1]["verification_status"] == "LIVE_OSM"
        assert listings[1]["provider_name"] == "Local Bike Point"


# -------------------------------------------------------------
# 4. Truthful Empty State Test
# -------------------------------------------------------------
@pytest.mark.asyncio
async def test_truthful_empty_state(setup_test_db):
    """Verify empty list is returned when no verified or OSM data exists (no fake data)."""
    db = setup_test_db

    # Empty destination with no rentals and empty OSM response
    with patch("app.providers.provider_factory.ProviderFactory.get_rentals_provider") as mock_factory:
        mock_provider_instance = AsyncMock()
        mock_provider_instance.search_rentals.return_value = []
        mock_factory.return_value = mock_provider_instance

        listings = await MobilityService.get_mobility_listings(
            db=db,
            destination_slug_or_id="manali"
        )

        assert listings == []


# -------------------------------------------------------------
# 5. Image Hierarchy & Category Isolation Tests
# -------------------------------------------------------------
def test_vehicle_artwork_category_isolation():
    """Verify rental visuals resolve to dedicated vehicle assets and NEVER cross into monastery/trail/hotel."""
    from app.services.mobility_service import MobilityService

    # 1. Himalayan tourer
    img_himalayan = MobilityService._resolve_category_artwork("Touring Motorcycle", "Royal Enfield Himalayan 450")
    assert img_himalayan == "/images/vehicles/adventure_motorcycle.jpg"

    # 2. Classic Bullet
    img_bullet = MobilityService._resolve_category_artwork("Classic Motorcycle", "Royal Enfield Bullet 350")
    assert img_bullet == "/images/vehicles/classic_bullet.jpg"

    # 3. Automatic Scooter
    img_scooter = MobilityService._resolve_category_artwork("Scooter", "Honda Activa 6G")
    assert img_scooter == "/images/vehicles/automatic_scooter.jpg"

    # 4. Electric Scooter
    img_ev = MobilityService._resolve_category_artwork("Electric Scooter", "Ather 450X")
    assert img_ev == "/images/vehicles/electric_scooter.jpg"

    # 5. Mountain Bike
    img_mtb = MobilityService._resolve_category_artwork("Mountain Bike", "Trek Marlin MTB")
    assert img_mtb == "/images/vehicles/mountain_bike.jpg"

    # Strict check: NEVER contains stay, monastery, or random non-vehicle category
    forbidden_terms = ["monastery", "hotel", "stay", "trail", "lake", "viewpoint"]
    for img in [img_himalayan, img_bullet, img_scooter, img_ev, img_mtb]:
        assert not any(t in img.lower() for t in forbidden_terms)


# -------------------------------------------------------------
# 6. Provider Claim Foundation & Public API Endpoints
# -------------------------------------------------------------
def test_provider_claim_foundation_api():
    """Verify backend provider registration, claim, and vehicle addition endpoints."""
    # 1. Register a provider
    res_reg = client.post("/api/v1/mobility/providers", json={
        "business_name": "Solang Adventure Wheels",
        "latitude": 32.3160,
        "longitude": 77.1570,
        "city": "Manali",
        "service_area": "Solang Valley"
    })
    assert res_reg.status_code == 200
    prov_data = res_reg.json()
    prov_id = prov_data["id"]
    assert prov_data["verification_status"] == "UNVERIFIED"

    # 2. Claim the provider
    res_claim = client.post(f"/api/v1/mobility/providers/{prov_id}/claim", json={
        "owner_name": "Rajesh Thakur",
        "phone": "+91 98161 22222",
        "whatsapp": "+91 98161 22222",
        "email": "rajesh@solangwheels.com",
        "address": "Solang Valley Road, Manali",
    })
    assert res_claim.status_code == 200
    claimed_data = res_claim.json()
    assert claimed_data["claimed"] is True
    assert claimed_data["verification_status"] == "LIVE_PROVIDER"

    # 3. Add fleet vehicles
    res_veh = client.post(f"/api/v1/mobility/providers/{prov_id}/vehicles", json={
        "vehicle_type": "Electric Scooter",
        "brand": "Ather",
        "model": "450X Gen 3",
        "daily_price": 750.0,
        "hourly_price": 120.0,
        "deposit": 1500.0,
        "quantity": 4
    })
    assert res_veh.status_code == 200
    veh_data = res_veh.json()
    assert veh_data["model"] == "450X Gen 3"
    assert veh_data["daily_price"] == 750.0

    # 4. Get provider actions
    res_actions = client.get(f"/api/v1/mobility/providers/{prov_id}/actions")
    assert res_actions.status_code == 200
    actions = res_actions.json()
    action_types = [a["type"] for a in actions]
    assert "directions" in action_types
    assert "phone" in action_types
    assert "whatsapp" in action_types

    # 5. Query /api/v1/rentals endpoint
    res_rentals = client.get("/api/v1/rentals?destination_id=manali")
    assert res_rentals.status_code == 200
    rentals_list = res_rentals.json()
    assert any(r["provider_name"] == "Solang Adventure Wheels" for r in rentals_list)
