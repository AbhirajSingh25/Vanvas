import pytest
import json
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


def test_secure_itinerary_update_endpoint(db):
    """Verify PUT /trips/{trip_id}/items/{item_id} verifies authenticated user and membership."""
    from app.models.models import TripMember

    owner = db.query(User).filter(User.email == "owner_test@vanvas.local").first()
    if not owner:
        owner = User(
            id="user-owner-update",
            email="owner_test@vanvas.local",
            hashed_password=get_password_hash("password123"),
            full_name="Owner User",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(owner)

    member = db.query(User).filter(User.email == "member_test@vanvas.local").first()
    if not member:
        member = User(
            id="user-member-update",
            email="member_test@vanvas.local",
            hashed_password=get_password_hash("password123"),
            full_name="Member User",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(member)

    stranger = db.query(User).filter(User.email == "stranger_test@vanvas.local").first()
    if not stranger:
        stranger = User(
            id="user-stranger-update",
            email="stranger_test@vanvas.local",
            hashed_password=get_password_hash("password123"),
            full_name="Stranger User",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(stranger)

    db.commit()

    dest = db.query(Destination).filter(Destination.id == "dest-manali-coh").first()
    if not dest:
        dest = Destination(
            id="dest-manali-coh",
            name="Manali",
            slug="manali-coh",
            state="Himachal Pradesh",
            region="Himalayan",
            tagline="Valley of the Gods",
            description="Alpine paradise in Himachal Pradesh",
            latitude=32.2396,
            longitude=77.1887
        )
        db.add(dest)
        db.commit()

    trip_a = db.query(Trip).filter(Trip.id == "trip-auth-a").first()
    if not trip_a:
        trip_a = Trip(
            id="trip-auth-a",
            user_id=owner.id,
            destination_id=dest.id,
            title="Trip A",
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 3),
            num_days=3,
            budget_total=10000.0,
            travellers_count=2
        )
        db.add(trip_a)
        db.commit()

        itin_a = Itinerary(
            id="itin-auth-a",
            trip_id=trip_a.id,
            day_number=1,
            date=date(2026, 8, 1),
            theme="Day 1"
        )
        db.add(itin_a)
        db.commit()

        item_a = ItineraryItem(
            id="item-auth-a-1",
            itinerary_id=itin_a.id,
            title="Old Temple",
            start_time="10:00",
            end_time="11:30",
            duration_mins=90,
            status="upcoming",
            is_locked=False
        )
        db.add(item_a)
        db.commit()

    # Add member to Trip A
    tm = db.query(TripMember).filter(TripMember.trip_id == trip_a.id, TripMember.user_id == member.id).first()
    if not tm:
        tm = TripMember(id="tm-auth-1", trip_id=trip_a.id, user_id=member.id, role="editor")
        db.add(tm)
        db.commit()

    trip_b = db.query(Trip).filter(Trip.id == "trip-auth-b").first()
    if not trip_b:
        trip_b = Trip(
            id="trip-auth-b",
            user_id=stranger.id,
            destination_id=dest.id,
            title="Trip B",
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 3),
            num_days=3,
            budget_total=10000.0,
            travellers_count=1
        )
        db.add(trip_b)
        db.commit()

        itin_b = Itinerary(
            id="itin-auth-b",
            trip_id=trip_b.id,
            day_number=1,
            date=date(2026, 8, 1),
            theme="Day 1 B"
        )
        db.add(itin_b)
        db.commit()

        item_b = ItineraryItem(
            id="item-auth-b-1",
            itinerary_id=itin_b.id,
            title="Stranger Place",
            start_time="12:00",
            end_time="13:00",
            duration_mins=60,
            status="upcoming",
            is_locked=False
        )
        db.add(item_b)
        db.commit()

    owner_token = create_access_token(subject=owner.id)
    member_token = create_access_token(subject=member.id)
    stranger_token = create_access_token(subject=stranger.id)

    # 1. Unauthorized stranger cannot update Trip A item -> 403
    res_stranger = client.put(
        f"/api/v1/trips/{trip_a.id}/items/item-auth-a-1?status=completed",
        headers={"Authorization": f"Bearer {stranger_token}"}
    )
    assert res_stranger.status_code == 403

    # 2. Member can update Trip A item -> 200
    res_member = client.put(
        f"/api/v1/trips/{trip_a.id}/items/item-auth-a-1?status=completed",
        headers={"Authorization": f"Bearer {member_token}"}
    )
    assert res_member.status_code == 200
    assert res_member.json()["status"] == "completed"

    # 3. Owner can update Trip A item -> 200
    res_owner = client.put(
        f"/api/v1/trips/{trip_a.id}/items/item-auth-a-1?is_locked=true",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert res_owner.status_code == 200
    assert res_owner.json()["is_locked"] is True

    # 4. Item from another trip cannot be updated in Trip A -> 404
    res_cross = client.put(
        f"/api/v1/trips/{trip_a.id}/items/item-auth-b-1?status=completed",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert res_cross.status_code == 404


def test_deterministic_add_place_calculates_real_metrics(db):
    """Verify add place endpoint calculates realistic travel metrics and never hardcodes 15m/1.5km blindly."""
    test_email = "metrics_user@vanvas.local"
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            id="user-metrics-test",
            email=test_email,
            hashed_password=get_password_hash("password123"),
            full_name="Metrics User",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()

    dest = db.query(Destination).filter(Destination.id == "dest-manali-coh").first()
    if not dest:
        dest = Destination(
            id="dest-manali-coh",
            name="Manali",
            slug="manali-metrics",
            latitude=32.2396,
            longitude=77.1887,
            state="Himachal Pradesh",
            region="Himalayan",
            tagline="Valley of the Gods",
            description="Mountain sanctuary"
        )
        db.add(dest)
        db.commit()

    # Place A: Solang Valley (approx 10km north)
    place_a = db.query(Place).filter(Place.id == "pl-solang-metrics").first()
    if not place_a:
        place_a = Place(
            id="pl-solang-metrics",
            destination_id=dest.id,
            name="Solang Valley",
            slug="solang-valley-metrics",
            latitude=32.3160,
            longitude=77.1570,
            description="High mountain valley and adventure center",
            approx_cost=500.0,
            recommended_duration_mins=120
        )
        db.add(place_a)
        db.commit()

    trip = db.query(Trip).filter(Trip.id == "trip-metrics-test").first()
    if not trip:
        trip = Trip(
            id="trip-metrics-test",
            user_id=user.id,
            destination_id=dest.id,
            title="Metrics Trip",
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 3),
            num_days=3,
            budget_total=20000.0,
            travellers_count=2
        )
        db.add(trip)
        db.commit()

        itin = Itinerary(
            id="itin-metrics-1",
            trip_id=trip.id,
            day_number=1,
            date=date(2026, 9, 1),
            theme="Day 1"
        )
        db.add(itin)
        db.commit()

        # Item 1 in Town Center
        first_item = ItineraryItem(
            id="item-metrics-first",
            itinerary_id=itin.id,
            title="Mall Road Center",
            start_time="09:00",
            end_time="10:00",
            duration_mins=60,
            map_lat=32.2400,
            map_lng=77.1890,
            status="upcoming",
            is_locked=False
        )
        db.add(first_item)
        db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        f"/api/v1/trips/{trip.id}/itineraries/1/places/{place_a.id}",
        headers=headers
    )
    assert res.status_code == 200, res.text
    item_data = res.json()

    # Distance between Mall Road (32.2400, 77.1890) and Solang (32.3160, 77.1570) is ~8-10 km, NOT 1.5 km
    dist = item_data["distance_from_prev_km"]
    assert dist is not None
    assert 7.0 <= dist <= 12.0, f"Expected realistic distance 7-12km, got {dist}"

    travel_time = item_data["travel_time_from_prev_mins"]
    assert travel_time is not None
    assert travel_time >= 20, f"Expected realistic travel time >= 20 mins for ~9km mountain driving, got {travel_time}"


def test_whats_next_day_context_and_completed_states(db):
    """Verify 'what's next' respects active day, skips completed/skipped stops, and reports day done."""
    test_email = "whats_next_user@vanvas.local"
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            id="user-wn-test",
            email=test_email,
            hashed_password=get_password_hash("password123"),
            full_name="Whats Next User",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()

    dest = db.query(Destination).filter(Destination.id == "dest-manali-coh").first()
    if not dest:
        dest = Destination(id="dest-manali-coh", name="Manali", slug="manali-wn", state="Himachal Pradesh", region="Himalayan", tagline="Valley of the Gods", description="Himalayan Town", latitude=32.2396, longitude=77.1887)
        db.add(dest)
        db.commit()

    trip = db.query(Trip).filter(Trip.id == "trip-wn-test").first()
    if trip:
        for it in trip.itineraries:
            for item in it.items:
                db.delete(item)
            db.delete(it)
        db.delete(trip)
        db.commit()

    trip = Trip(
        id="trip-wn-test",
        user_id=user.id,
        destination_id=dest.id,
        title="Multi Day Whats Next Trip",
        start_date=date(2026, 10, 1),
        end_date=date(2026, 10, 3),
        num_days=2,
        budget_total=15000.0,
        travellers_count=1
    )
    db.add(trip)
    db.commit()

    itin1 = Itinerary(id="itin-wn-1", trip_id=trip.id, day_number=1, date=date(2026, 10, 1), theme="Day 1")
    itin2 = Itinerary(id="itin-wn-2", trip_id=trip.id, day_number=2, date=date(2026, 10, 2), theme="Day 2")
    db.add_all([itin1, itin2])
    db.commit()

    # Day 1 items: 1 completed, 1 planned
    it1 = ItineraryItem(id="wn-1-1", itinerary_id=itin1.id, title="Day 1 Completed Walk", start_time="09:00", end_time="10:00", status="completed")
    it2 = ItineraryItem(id="wn-1-2", itinerary_id=itin1.id, title="Day 1 Afternoon Cafe", start_time="14:00", end_time="15:00", status="upcoming")
    # Day 2 items: 2 planned
    it3 = ItineraryItem(id="wn-2-1", itinerary_id=itin2.id, title="Day 2 Morning Hike", start_time="08:00", end_time="11:00", status="upcoming")
    it4 = ItineraryItem(id="wn-2-2", itinerary_id=itin2.id, title="Day 2 Hot Springs", start_time="12:00", end_time="14:00", status="upcoming")
    db.add_all([it1, it2, it3, it4])
    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Day 1 active: skips completed it1, returns Day 1 Afternoon Cafe
    res_d1 = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "what's next", "trip_id": trip.id, "context": {"activeDayNumber": 1}}
    )
    assert res_d1.status_code == 200
    assert "Day 1 Afternoon Cafe" in res_d1.json()["message"]
    assert "Day 1 Completed Walk" not in res_d1.json()["message"]

    # 2. Day 2 active: returns Day 2 Morning Hike, never returns obsolete Day 1 item
    res_d2 = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "what's next", "trip_id": trip.id, "context": {"activeDayNumber": 2}}
    )
    assert res_d2.status_code == 200
    assert "Day 2 Morning Hike" in res_d2.json()["message"]
    assert "Day 1" not in res_d2.json()["message"]

    # 3. Mark all Day 1 items completed -> What's next on Day 1 returns "Today is done" + Day 2 preview
    it2_rec = db.query(ItineraryItem).filter(ItineraryItem.id == "wn-1-2").first()
    it2_rec.status = "completed"
    db.commit()

    res_d1_done = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "what's next", "trip_id": trip.id, "context": {"activeDayNumber": 1}}
    )
    assert res_d1_done.status_code == 200
    msg = res_d1_done.json()["message"]
    assert "Today is done" in msg
    assert "Tomorrow" in msg or "Day 2" in msg


def test_departure_language_truthful_distinction(db):
    """Verify departure timing fast path distinguishes confirmed booking vs estimated recommendation."""
    test_email = "dep_user@vanvas.local"
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            id="user-dep-test",
            email=test_email,
            hashed_password=get_password_hash("password123"),
            full_name="Departure User",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()

    dest = db.query(Destination).filter(Destination.id == "dest-manali-coh").first()
    if not dest:
        dest = Destination(id="dest-manali-coh", name="Manali", slug="manali-dep", state="Himachal Pradesh", region="Himalayan", tagline="Valley of the Gods", description="Himalayan Town", latitude=32.2396, longitude=77.1887)
        db.add(dest)
        db.commit()

    # Trip with specific booked bus
    trip_booked = db.query(Trip).filter(Trip.id == "trip-dep-booked").first()
    if not trip_booked:
        trip_booked = Trip(
            id="trip-dep-booked",
            user_id=user.id,
            destination_id=dest.id,
            title="Booked Bus Trip",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 3),
            transport_mode="bus",
            transport_details_json=json.dumps({
                "operator_name": "Zingbus Maxx",
                "departure_time": "21:30",
                "departure_location": "Majnu Ka Tilla",
                "arrival_time": "09:00",
                "arrival_location": "Private Bus Parking Manali"
            })
        )
        db.add(trip_booked)

    # Trip without selected transport
    trip_unbooked = db.query(Trip).filter(Trip.id == "trip-dep-unbooked").first()
    if not trip_unbooked:
        trip_unbooked = Trip(
            id="trip-dep-unbooked",
            user_id=user.id,
            destination_id=dest.id,
            title="Unbooked Road Trip",
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 3),
            transport_mode="road_trip",
            transport_details_json=None
        )
        db.add(trip_unbooked)

    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Booked transport query
    res_b = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "when should i leave?", "trip_id": trip_booked.id}
    )
    assert res_b.status_code == 200
    msg_b = res_b.json()["message"]
    assert "21:30" in msg_b
    assert "Majnu Ka Tilla" in msg_b

    # Unbooked estimated recommendation query
    res_u = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "when should i leave?", "trip_id": trip_unbooked.id}
    )
    assert res_u.status_code == 200
    msg_u = res_u.json()["message"]
    assert "VANVAS recommends" in msg_u or "recommends leaving" in msg_u
    assert "05:30–06:30 AM" in msg_u or "05:30" in msg_u


def test_transport_to_itinerary_validation_all_modalities():
    """Verify automated assertions that first real experience_start > transport arrival + realistic buffer across all transport modes."""
    engine = ItineraryEngine()
    dest = Destination(
        id="dest-transport-mod-test",
        name="Manali",
        slug="manali",
        state="Himachal Pradesh",
        latitude=32.2396,
        longitude=77.1887
    )
    places = [
        Place(
            id="pl-mod-1",
            destination_id=dest.id,
            name="Hadimba Temple",
            category="Culture & Heritage",
            latitude=32.2483,
            longitude=77.1800,
            approx_cost=50.0,
            recommended_duration_mins=60
        ),
        Place(
            id="pl-mod-2",
            destination_id=dest.id,
            name="Cafe 1947",
            category="Café",
            latitude=32.2560,
            longitude=77.1820,
            approx_cost=300.0,
            recommended_duration_mins=60
        )
    ]

    modes = [
        ("bus", {"arrival_time": "08:30", "arrival_location": "Volvo Stand"}),
        ("train", {"arrival_time": "10:15", "arrival_location": "Chandigarh Railhead"}),
        ("flight", {"arrival_time": "09:45", "arrival_location": "Kullu Airport"}),
        ("road_trip", {"arrival_time": "16:00", "arrival_location": "Valley Hotel"}),
        ("cab", {"arrival_time": "15:30", "arrival_location": "Doorstep"})
    ]

    for mode_name, t_details in modes:
        itins = engine.generate_trip_itinerary(
            destination=dest,
            all_places=places,
            start_date=date(2026, 10, 10),
            end_date=date(2026, 10, 11),
            budget=15000.0,
            companion_type="Solo",
            travel_style="Balanced",
            wake_up_preference="Normal",
            activity_intensity="Balanced",
            interests=["Culture", "Café"],
            transport_mode=mode_name,
            transport_details=t_details
        )
        assert len(itins) >= 1
        day1_items = itins[0]["items"]

        # Parse arrival time in minutes
        arr_parts = t_details["arrival_time"].split(":")
        arr_mins = int(arr_parts[0]) * 60 + int(arr_parts[1])

        # Find first experience (non-transit, non-stay)
        first_exp = next((it for it in day1_items if (it.get("category") or "").lower() not in ["transit", "stay"]), None)
        assert first_exp is not None, f"Mode {mode_name} produced no experience items"

        exp_start_parts = first_exp["start_time"].split(":")
        exp_start_mins = int(exp_start_parts[0]) * 60 + int(exp_start_parts[1])

        # First real experience must be strictly after arrival + buffer (at least 30 mins)
        assert exp_start_mins >= arr_mins + 30, (
            f"Mode {mode_name}: first experience '{first_exp['title']}' starts at {first_exp['start_time']} "
            f"({exp_start_mins} mins) which is less than 30 mins after arrival {t_details['arrival_time']} ({arr_mins} mins)"
        )


def test_whats_next_all_scenarios_and_isolation(db):
    """Verify What's Next:
    - No activeDayNumber defaults to current day or day 1
    - Skipped/cancelled items are ignored
    - When all items across all days are done, returns appropriate 'Today is done'
    - Multi-day isolation ensures no cross-day pollution
    """
    test_email = "wn_full_user@vanvas.local"
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            id="user-wn-full",
            email=test_email,
            hashed_password=get_password_hash("password123"),
            full_name="WN Full User",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()

    dest = db.query(Destination).filter(Destination.id == "dest-manali-coh").first()
    if not dest:
        dest = Destination(id="dest-manali-coh", name="Manali", slug="manali-full", state="Himachal Pradesh", latitude=32.2396, longitude=77.1887)
        db.add(dest)
        db.commit()

    trip = Trip(
        id="trip-wn-full-test",
        user_id=user.id,
        destination_id=dest.id,
        title="Full What's Next Verification Trip",
        start_date=date(2026, 10, 8),
        end_date=date(2026, 10, 10),
        num_days=2,
        budget_total=18000.0,
        travellers_count=2
    )
    db.add(trip)
    db.commit()

    itin1 = Itinerary(id="itin-wnf-1", trip_id=trip.id, day_number=1, date=date(2026, 10, 8), theme="Day 1")
    itin2 = Itinerary(id="itin-wnf-2", trip_id=trip.id, day_number=2, date=date(2026, 10, 9), theme="Day 2")
    db.add_all([itin1, itin2])
    db.commit()

    # Day 1: it1 skipped, it2 upcoming, it3 cancelled
    it1 = ItineraryItem(id="wnf-1-1", itinerary_id=itin1.id, title="Skipped Monastery", start_time="07:00", end_time="08:30", status="skipped")
    it2 = ItineraryItem(id="wnf-1-2", itinerary_id=itin1.id, title="Active River Walk", start_time="11:00", end_time="12:30", status="upcoming")
    it3 = ItineraryItem(id="wnf-1-3", itinerary_id=itin1.id, title="Cancelled Rafting", start_time="15:00", end_time="17:00", status="cancelled")

    # Day 2: it4 upcoming
    it4 = ItineraryItem(id="wnf-2-1", itinerary_id=itin2.id, title="High Pass Trek", start_time="08:00", end_time="12:00", status="upcoming")
    db.add_all([it1, it2, it3, it4])
    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Without explicit activeDayNumber, resolves active day and returns Active River Walk (skipping Skipped Monastery)
    res_auto = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "whats next", "trip_id": trip.id}
    )
    assert res_auto.status_code == 200
    msg_auto = res_auto.json()["message"]
    assert "Active River Walk" in msg_auto
    assert "Skipped Monastery" not in msg_auto
    assert "Cancelled Rafting" not in msg_auto

    # 2. Focus Day 2 explicitly: returns High Pass Trek, never leaks Day 1 items
    res_d2 = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "what is next", "trip_id": trip.id, "context": {"activeDayNumber": 2}}
    )
    assert res_d2.status_code == 200
    msg_d2 = res_d2.json()["message"]
    assert "High Pass Trek" in msg_d2
    assert "Active River Walk" not in msg_d2

    # 3. Mark Day 2 item completed -> Day 2 What's next returns "Today is done!"
    it4_rec = db.query(ItineraryItem).filter(ItineraryItem.id == "wnf-2-1").first()
    it4_rec.status = "completed"
    db.commit()

    res_d2_done = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "what is next on our itinerary right now?", "trip_id": trip.id, "context": {"activeDayNumber": 2}}
    )
    assert res_d2_done.status_code == 200
    msg_d2_done = res_d2_done.json()["message"]
    assert "Today is done" in msg_d2_done


