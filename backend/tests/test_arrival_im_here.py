"""
Tests for VANVAS I'M HERE Arrival Feature & Plan Generation.
Verifies:
1. Arrival-time generation with custom arrival_time and chronological step timing.
2. Hotel check-in messaging (open vs starts at check_in_time with bag drop guidance).
3. Missing hotel data gracefully falling back to defaults without errors.
4. Delay and replanning behaviour (delay_minutes shifting start, hours_available constraining plan steps).
"""
import pytest
from datetime import date, datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import Destination, Place, Hotel, User, Trip
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def test_setup(db):
    user = db.query(User).filter(User.email == "arrival_tester@vanvas.local").first()
    if not user:
        user = User(
            id="user-arrival-tester",
            email="arrival_tester@vanvas.local",
            hashed_password=get_password_hash("password123"),
            full_name="Arrival Tester",
            email_verified_at=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()

    dest = db.query(Destination).filter(Destination.id == "dest-arrival-manali").first()
    if not dest:
        dest = Destination(
            id="dest-arrival-manali",
            name="Manali",
            slug="manali-arrival-test",
            state="Himachal Pradesh",
            region="Himalayan",
            tagline="Valley of the Gods",
            description="High mountain paradise",
            latitude=32.2396,
            longitude=77.1887,
            weather_type="Pleasant"
        )
        db.add(dest)
        db.commit()

    hotel = db.query(Hotel).filter(Hotel.id == "hotel-arrival-stay").first()
    if not hotel:
        hotel = Hotel(
            id="hotel-arrival-stay",
            destination_id=dest.id,
            name="Pine View Himalayan Retreat",
            address="Log Huts Area, Old Manali",
            check_in_time="02:00 PM",
            check_out_time="11:00 AM",
            price_per_night=3200,
            latitude=32.2420,
            longitude=77.1890
        )
        db.add(hotel)
        db.commit()

    food_place = db.query(Place).filter(Place.id == "place-arrival-food").first()
    if not food_place:
        food_place = Place(
            id="place-arrival-food",
            destination_id=dest.id,
            name="Cafe 1947",
            slug="cafe-1947-arrival",
            category="Food",
            description="Famous riverside Italian and trout cafe in Old Manali.",
            approx_cost=250.0,
            latitude=32.2530,
            longitude=77.1850,
            recommended_duration_mins=45
        )
        db.add(food_place)
        db.commit()

    attr_place = db.query(Place).filter(Place.id == "place-arrival-attr").first()
    if not attr_place:
        attr_place = Place(
            id="place-arrival-attr",
            destination_id=dest.id,
            name="Hadimba Temple",
            slug="hadimba-temple-arrival",
            category="Attraction",
            description="Ancient wooden temple surrounded by cedar forest.",
            approx_cost=50.0,
            latitude=32.2483,
            longitude=77.1802,
            recommended_duration_mins=60
        )
        db.add(attr_place)
        db.commit()

    trip_with_hotel = db.query(Trip).filter(Trip.id == "trip-arrival-with-hotel").first()
    if not trip_with_hotel:
        trip_with_hotel = Trip(
            id="trip-arrival-with-hotel",
            user_id=user.id,
            destination_id=dest.id,
            hotel_id=hotel.id,
            title="Arrival Trip with Hotel",
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 5),
            num_days=4,
            budget_total=15000.0,
            budget_spent=2000.0,
            travellers_count=2
        )
        db.add(trip_with_hotel)
        db.commit()

    trip_no_hotel = db.query(Trip).filter(Trip.id == "trip-arrival-no-hotel").first()
    if not trip_no_hotel:
        trip_no_hotel = Trip(
            id="trip-arrival-no-hotel",
            user_id=user.id,
            destination_id=dest.id,
            hotel_id=None,
            title="Arrival Trip without Hotel",
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 5),
            num_days=4,
            budget_total=12000.0,
            budget_spent=1000.0,
            travellers_count=1
        )
        db.add(trip_no_hotel)
        db.commit()

    dest_no_hotels = db.query(Destination).filter(Destination.id == "dest-arrival-remote").first()
    if not dest_no_hotels:
        dest_no_hotels = Destination(
            id="dest-arrival-remote",
            name="Remote Valley",
            slug="remote-valley-test",
            state="Uttarakhand",
            region="Himalayan",
            tagline="Pristine Wilderness",
            description="Untouched secluded mountain valley",
            latitude=30.5000,
            longitude=79.3000,
            weather_type="Alpine"
        )
        db.add(dest_no_hotels)
        db.commit()

    trip_completely_no_hotel = db.query(Trip).filter(Trip.id == "trip-arrival-completely-no-hotel").first()
    if not trip_completely_no_hotel:
        trip_completely_no_hotel = Trip(
            id="trip-arrival-completely-no-hotel",
            user_id=user.id,
            destination_id=dest_no_hotels.id,
            hotel_id=None,
            title="Trip with No Hotel",
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 5),
            num_days=4,
            budget_total=10000.0,
            budget_spent=500.0,
            travellers_count=1
        )
        db.add(trip_completely_no_hotel)
        db.commit()

    token = create_access_token(subject=user.email)
    headers = {"Authorization": f"Bearer {token}"}

    return {
        "user": user,
        "dest": dest,
        "hotel": hotel,
        "trip_with_hotel": trip_with_hotel,
        "trip_no_hotel": trip_no_hotel,
        "trip_completely_no_hotel": trip_completely_no_hotel,
        "headers": headers
    }


def test_arrival_time_generation(test_setup):
    """Test custom arrival_time produces valid activation_time and sequential step timing."""
    headers = test_setup["headers"]
    trip_id = test_setup["trip_with_hotel"].id

    payload = {
        "current_time": "10:30",
        "current_location_name": "Manali Volvo Bus Stand",
        "hours_available": 3.0
    }
    response = client.post(f"/api/v1/trips/{trip_id}/im-here", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["activation_time"] == "10:30"
    assert "Arrival at 10:30 AM." in data["timing_guidance"]
    assert len(data["next_3_hours_plan"]) == 3

    # NOW step starts at arrival time
    step1 = data["now_step"]
    assert step1 is not None
    assert step1["start_time"] == "10:30"
    assert step1["category"] == "Stay"

    # NEXT step starts after NOW step + transit
    step2 = data["next_step"]
    assert step2 is not None
    assert step2["category"] == "Food"
    assert step2["start_time"] >= step1["end_time"]


def test_hotel_check_in_messaging_early_arrival(test_setup):
    """When arriving early before check-in time (e.g. 09:00 AM for 02:00 PM check-in),
    guidance directs luggage drop and informs when check-in starts."""
    headers = test_setup["headers"]
    trip_id = test_setup["trip_with_hotel"].id

    payload = {
        "current_time": "09:00",
        "current_location_name": "Manali Bus Stand"
    }
    response = client.post(f"/api/v1/trips/{trip_id}/im-here", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()

    # Guidance should explain bag drop
    assert "Hotel check-in starts at 02:00 PM; bags can be dropped first." in data["timing_guidance"]
    assert "Luggage Drop at Pine View Himalayan Retreat Front Desk" in data["now_step"]["title"]
    assert "Drop heavy backpacks safely at reception cloakroom." in data["now_step"]["notes"]


def test_hotel_check_in_messaging_open(test_setup):
    """When arriving within or after check-in window (e.g. 02:30 PM for 02:00 PM check-in),
    guidance indicates check-in is open."""
    headers = test_setup["headers"]
    trip_id = test_setup["trip_with_hotel"].id

    payload = {
        "current_time": "14:30",
        "current_location_name": "Manali Bus Stand"
    }
    response = client.post(f"/api/v1/trips/{trip_id}/im-here", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()

    assert "Hotel check-in is open." in data["timing_guidance"]
    assert "Check-In & Freshen Up at Pine View Himalayan Retreat" in data["now_step"]["title"]
    assert "Room is ready for check-in" in data["now_step"]["notes"]


def test_missing_hotel_data_graceful_fallback(test_setup):
    """When trip and destination have no hotel attached, defaults to '11:00 AM' check-in without error."""
    headers = test_setup["headers"]
    trip_id = test_setup["trip_completely_no_hotel"].id

    payload = {
        "current_time": "08:30",
        "current_location_name": "Valley Trailhead"
    }
    response = client.post(f"/api/v1/trips/{trip_id}/im-here", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()

    assert "Hotel check-in starts at 11:00 AM; bags can be dropped first." in data["timing_guidance"]
    assert "Luggage Drop at Hotel / Mountain Stay Front Desk" in data["now_step"]["title"]
    assert data["hotel_info"] is None


def test_delay_and_replanning_behaviour(test_setup):
    """Test delay_minutes pushes schedule forward and hours_available trims sequence."""
    headers = test_setup["headers"]
    trip_id = test_setup["trip_with_hotel"].id

    # 1. Delay of 45 minutes on 10:00 arrival -> starts at 10:45
    payload = {
        "current_time": "10:00",
        "delay_minutes": 45,
        "hours_available": 3.0
    }
    response = client.post(f"/api/v1/trips/{trip_id}/im-here", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["activation_time"] == "10:45"
    assert "Arrival at 10:45 AM." in data["timing_guidance"]
    assert data["now_step"]["start_time"] == "10:45"

    # 2. Constrained availability: hours_available = 1.0 -> only 1 step (NOW)
    payload_short = {
        "current_time": "10:00",
        "hours_available": 1.0
    }
    res_short = client.post(f"/api/v1/trips/{trip_id}/im-here", json=payload_short, headers=headers)
    assert res_short.status_code == 200
    data_short = res_short.json()
    assert len(data_short["next_3_hours_plan"]) == 1
    assert data_short["now_step"] is not None
    assert data_short["next_step"] is None
    assert len(data_short["later_steps"]) == 0
    assert "Optimized 1-step sequence for your first 1 hours." in data_short["timing_guidance"]

    # 3. Constrained availability: hours_available = 2.0 -> 2 steps (NOW + NEXT)
    payload_med = {
        "current_time": "10:00",
        "hours_available": 2.0
    }
    res_med = client.post(f"/api/v1/trips/{trip_id}/im-here", json=payload_med, headers=headers)
    assert res_med.status_code == 200
    data_med = res_med.json()
    assert len(data_med["next_3_hours_plan"]) == 2
    assert data_med["now_step"] is not None
    assert data_med["next_step"] is not None
    assert len(data_med["later_steps"]) == 0
    assert "Optimized 2-step sequence for your first 2 hours." in data_med["timing_guidance"]
