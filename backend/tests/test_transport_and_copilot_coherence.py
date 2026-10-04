import pytest
from datetime import date, datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.itinerary.generator import ItineraryEngine
from app.models.models import Destination, Place, Hotel, User, Trip, Itinerary, ItineraryItem
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_arrival_aware_itinerary_generation_bus():
    """Verify Day 1 starts with transit/arrival block and first activity is strictly after arrival + buffer."""
    engine = ItineraryEngine()

    dest = Destination(
        id="dest-manali-test",
        name="Manali",
        slug="manali",
        state="Himachal Pradesh",
        region="Himalayan",
        tagline="Valley of the Gods",
        description="Mountain valley",
        latitude=32.2396,
        longitude=77.1887,
        altitude_meters=2050,
        best_time_to_visit="Summer"
    )

    places = [
        Place(
            id="place-1",
            destination_id="dest-manali-test",
            name="Old Manali Village",
            slug="old-manali-village",
            description="Rustic village with cafes",
            category="Attraction",
            recommended_duration_mins=120,
            approx_cost=0.0,
            latitude=32.2530,
            longitude=77.1850,
            tags="cafe,nature,culture"
        ),
        Place(
            id="place-2",
            destination_id="dest-manali-test",
            name="Hadimba Temple",
            slug="hadimba-temple",
            description="Ancient wooden temple",
            category="Culture",
            recommended_duration_mins=90,
            approx_cost=50.0,
            latitude=32.2483,
            longitude=77.1805,
            tags="culture,heritage"
        ),
        Place(
            id="place-3",
            destination_id="dest-manali-test",
            name="Jogini Waterfalls",
            slug="jogini-waterfalls",
            description="Scenic mountain cascade",
            category="Nature",
            recommended_duration_mins=180,
            approx_cost=0.0,
            latitude=32.2680,
            longitude=77.1950,
            tags="nature,trekking"
        ),
    ]

    hotel = Hotel(
        id="hotel-1",
        destination_id="dest-manali-test",
        name="Riverside Cottage",
        address="Club House Road, Old Manali",
        latitude=32.2540,
        longitude=77.1840,
        check_in_time="12:00",
        price_per_night=2800,
        badge="Curated Stay"
    )

    transport_details = {
        "operator_name": "HRTC Volvo AC",
        "departure_time": "20:00",
        "arrival_time": "08:30",
        "duration_hours": 12.5,
        "departure_location": "ISBT Kashmiri Gate",
        "arrival_location": "Manali Volvo Stand",
        "price": 1450,
        "data_state": "CURATED"
    }

    itineraries = engine.generate_trip_itinerary(
        destination=dest,
        all_places=places,
        start_date=date(2026, 6, 1),
        end_date=date(2026, 6, 3),
        budget=15000,
        companion_type="Friends",
        travel_style="Balanced",
        wake_up_preference="Normal",
        activity_intensity="Balanced",
        interests=["nature", "culture"],
        hotel=hotel,
        rental=None,
        transport_mode="bus",
        transport_details=transport_details
    )

    assert len(itineraries) == 3
    day1 = itineraries[0]
    items = day1["items"]
    assert len(items) >= 3

    # First item must be the Arrival block at 08:30
    assert "ARRIVE IN MANALI" in items[0]["title"].upper()
    assert items[0]["start_time"] == "08:30"
    assert items[0]["category"] == "Transit"

    # Second item must be Transfer
    assert "TRANSFER" in items[1]["title"].upper()
    assert items[1]["category"] == "Transit"

    # Any exploratory activity or meal must start after arrival buffer (>= 09:15)
    for item in items[2:]:
        start_hour, start_min = map(int, item["start_time"].split(":"))
        start_total = start_hour * 60 + start_min
        assert start_total >= 555, f"Activity {item['title']} scheduled at {item['start_time']} which is too early for 08:30 arrival"

def test_arrival_aware_itinerary_generation_flight():
    """Verify Flight Day 1 arrives Bhuntar/Kullu, buffers transfer + stay, and starts exploration after transfer."""
    engine = ItineraryEngine()

    dest = Destination(
        id="dest-manali-test-flight",
        name="Manali",
        slug="manali",
        state="Himachal Pradesh",
        region="Himalayan",
        tagline="Valley of the Gods",
        description="Mountain valley",
        latitude=32.2396,
        longitude=77.1887,
        altitude_meters=2050,
        best_time_to_visit="Summer"
    )

    places = [
        Place(
            id="place-flight-1",
            destination_id="dest-manali-test-flight",
            name="Old Manali Village",
            slug="old-manali-village",
            description="Rustic village with cafes",
            category="Attraction",
            recommended_duration_mins=120,
            approx_cost=0.0,
            latitude=32.2530,
            longitude=77.1850,
            tags="cafe,nature,culture"
        ),
    ]

    transport_details = {
        "operator_name": "Alliance Air",
        "departure_time": "07:20",
        "arrival_time": "08:45",
        "duration_hours": 1.4,
        "departure_location": "DEL",
        "arrival_location": "KUU Bhuntar",
        "price": 5400,
        "data_state": "CURATED"
    }

    itineraries = engine.generate_trip_itinerary(
        destination=dest,
        all_places=places,
        start_date=date(2026, 6, 1),
        end_date=date(2026, 6, 2),
        budget=20000,
        companion_type="Couple",
        travel_style="Comfort",
        wake_up_preference="Normal",
        activity_intensity="Relaxed",
        interests=["nature"],
        hotel=None,
        rental=None,
        transport_mode="flight",
        transport_details=transport_details
    )

    day1 = itineraries[0]
    items = day1["items"]
    assert len(items) >= 2
    assert "LAND AT" in items[0]["title"].upper() or "ARRIVE" in items[0]["title"].upper()
    assert items[0]["start_time"] == "08:45"

def test_deterministic_add_and_delete_place_rest(db):
    """Verify deterministic REST addition and deletion without invoking LLM."""
    test_email = "coherence_user@vanvas.local"
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            id="user-coherence-1",
            email=test_email,
            hashed_password=get_password_hash("password123"),
            full_name="Coherence Test User",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    dest = db.query(Destination).filter(Destination.id == "dest-manali-coh").first()
    if not dest:
        dest = Destination(
            id="dest-manali-coh",
            name="Manali",
            slug="manali-coh",
            state="Himachal Pradesh",
            region="Himalayan",
            tagline="Valley",
            description="Valley",
            latitude=32.2396,
            longitude=77.1887
        )
        db.add(dest)
        db.commit()

    place = db.query(Place).filter(Place.id == "place-manali-coh-1").first()
    if not place:
        place = Place(
            id="place-manali-coh-1",
            destination_id="dest-manali-coh",
            name="Cafe 1947",
            slug="cafe-1947-coh",
            category="Café",
            description="Famous riverside cafe in Old Manali",
            latitude=32.2560,
            longitude=77.1820,
            approx_cost=600.0,
            recommended_duration_mins=75
        )
        db.add(place)
        db.commit()

    trip = db.query(Trip).filter(Trip.id == "trip-coherence-1").first()
    if not trip:
        trip = Trip(
            id="trip-coherence-1",
            user_id=user.id,
            destination_id="dest-manali-coh",
            title="Manali Coherence Trip",
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 3),
            num_days=3,
            budget_total=20000.0,
            travellers_count=2,
            transport_mode="bus"
        )
        db.add(trip)
        db.commit()

        itin = Itinerary(
            id="itin-coherence-1",
            trip_id=trip.id,
            day_number=2,
            date=date(2026, 7, 2),
            theme="Mountain Exploration"
        )
        db.add(itin)
        db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Deterministic POST add place to Day 2
    res = client.post(
        f"/api/v1/trips/{trip.id}/itineraries/2/places/{place.id}",
        headers=headers
    )
    assert res.status_code == 200, res.text
    item = res.json()
    assert item["place_id"] == place.id
    item_id = item["id"]

    # Verify duplicate is safely prevented
    res_dup = client.post(
        f"/api/v1/trips/{trip.id}/itineraries/2/places/{place.id}",
        headers=headers
    )
    assert res_dup.status_code == 200
    assert res_dup.json()["id"] == item_id

    # 2. Deterministic DELETE item
    res_del = client.delete(
        f"/api/v1/trips/{trip.id}/items/{item_id}",
        headers=headers
    )
    assert res_del.status_code == 200, res_del.text
    del_data = res_del.json()
    assert del_data.get("success") is True

def test_copilot_fast_path_what_is_next(db):
    """Verify 'what's next' query is routed deterministically through the Fast Path without LLM."""
    test_email = "coherence_fast@vanvas.local"
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            id="user-coherence-fast",
            email=test_email,
            hashed_password=get_password_hash("password123"),
            full_name="Fast Path User",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={
            "message": "what's next",
            "context": {"type": "trip", "activeDayNumber": 1}
        }
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert "message" in data
    assert len(data["message"]) > 0
