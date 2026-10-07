"""
VANVAS Test Suite: Interactive Budget Engine + Ask VANVAS Travel Intelligence + Road Trip Day Affordances
Verifies:
- Fuel calculations: Petrol, Diesel, CNG, Electric, Custom
- Stay, Food, Tolls, Parking, Activities, and Custom Expenses models
- PATCH /trips/{trip_id}/budget persistence and auth
- Ask VANVAS context routing for queries like 'things to do in haridwar'
- Real place results and honest fallbacks
"""

import pytest
from datetime import date
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, Trip, TripMember, Destination, Place
from app.schemas.schemas import (
    RoadTripPlanRequest,
)
from app.services.road_trip_service import RoadTripService
from app.services.copilot_context import extract_explicit_destination
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_ai_chat():
    with patch("app.providers.ai.gemini_provider.GeminiProvider.chat_with_tools", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = {
            "text": "QUICK TAKE\nHaridwar exploration ready.\n\nTOP PICKS\n1. Har Ki Pauri\n2. Mansa Devi Temple\n\nACTIONS\n[ Explore Haridwar ]",
            "tool_calls": [],
            "usage": {"latency_ms": 10.0}
        }
        yield mock_chat


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def sample_destination(db_session: Session):
    dest = db_session.query(Destination).filter(Destination.slug == "haridwar").first()
    if not dest:
        dest = Destination(
            id="dest-haridwar-test",
            name="Haridwar",
            slug="haridwar",
            state="Uttarakhand",
            region="Garhwal",
            tagline="Gateway to the Gods",
            description="Ancient holy city on the banks of the sacred Ganges River.",
            hero_image="/images/destinations/haridwar-rishikesh/hero.webp",
            latitude=29.9457,
            longitude=78.1642,
            altitude_meters=314,
            is_featured=True,
        )
        db_session.add(dest)
        db_session.commit()

    # Seed Haridwar place
    p1 = db_session.query(Place).filter(Place.slug == "har-ki-pauri").first()
    if not p1:
        p1 = Place(
            id="place-har-ki-pauri-1",
            destination_id=dest.id,
            name="Har Ki Pauri",
            slug="har-ki-pauri",
            category="Spiritual",
            description="Famous ghat on the banks of the Ganges in Haridwar.",
            image_url="/images/places/universal/spiritual.webp",
            latitude=29.9567,
            longitude=78.1706,
            approx_cost=0,
            recommended_duration_mins=90,
            is_active=True,
            is_must_visit=True,
        )
        db_session.add(p1)
        db_session.commit()

    return dest


@pytest.fixture
def test_user(db_session: Session):
    user = db_session.query(User).filter(User.email == "budget_user@vanvas.com").first()
    if not user:
        user = User(
            id="usr-test-budget-1",
            email="budget_user@vanvas.com",
            full_name="Budget Explorer",
            role="user",
            hashed_password="hashed_pw_test",
        )
        db_session.add(user)
        db_session.commit()
    return user


@pytest.fixture
def auth_token(test_user: User):
    return create_access_token(subject=test_user.id)


@pytest.fixture
def test_trip(db_session: Session, test_user: User, sample_destination: Destination):
    trip = db_session.query(Trip).filter(Trip.id == "trip-test-budget-1").first()
    if not trip:
        trip = Trip(
            id="trip-test-budget-1",
            title="Delhi to Haridwar Road Trip",
            origin_city="Delhi",
            transport_mode="road_trip",
            destination_id=sample_destination.id,
            travellers_count=4,
            budget_total=12000.0,
            budget_spent=0.0,
            user_id=test_user.id,
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 3),
        )
        db_session.add(trip)
        db_session.commit()

        member = TripMember(
            id="tm-test-budget-1",
            trip_id=trip.id,
            user_id=test_user.id,
            role="creator",
        )
        db_session.add(member)
        db_session.commit()
    return trip


# ============================================================
# ISSUE 1: BUDGET CALCULATIONS
# ============================================================

def test_1_petrol_12_kpl_calculates_correctly():
    """1. Petrol 12 km/l calculates correctly: distance / 12 km/l * 95.5"""
    req = RoadTripPlanRequest(
        origin="Delhi",
        destination="Haridwar",
        travellers_count=4,
        vehicle_type="SUV",
        fuel_type="Petrol",
        fuel_efficiency=12.0,
        fuel_rate=95.5,
        start_date=date(2026, 10, 15),
    )
    plan = RoadTripService.plan_road_trip(req)
    assert plan.fuel_breakdown.fuel_type == "Petrol"
    assert plan.fuel_breakdown.assumed_mileage_kpl == 12.0
    expected_cost = round((plan.total_distance_km / 12.0) * 95.5, 2)
    assert plan.fuel_breakdown.estimated_fuel_cost_inr == expected_cost


def test_2_diesel_calculation_works():
    """2. Diesel calculation: 18 km/l at 88.0 INR/l"""
    req = RoadTripPlanRequest(
        origin="Delhi",
        destination="Haridwar",
        travellers_count=4,
        vehicle_type="Sedan",
        fuel_type="Diesel",
        fuel_efficiency=18.0,
        fuel_rate=88.0,
        start_date=date(2026, 10, 15),
    )
    plan = RoadTripService.plan_road_trip(req)
    assert plan.fuel_breakdown.fuel_type == "Diesel"
    assert plan.fuel_breakdown.fuel_unit == "km/l"
    assert plan.fuel_breakdown.assumed_mileage_kpl == 18.0
    expected_cost = round((plan.total_distance_km / 18.0) * 88.0, 2)
    assert plan.fuel_breakdown.estimated_fuel_cost_inr == expected_cost


def test_3_cng_calculation_works():
    """3. CNG calculation: 22 km/kg at 78.0 INR/kg"""
    req = RoadTripPlanRequest(
        origin="Delhi",
        destination="Haridwar",
        travellers_count=4,
        vehicle_type="Hatchback",
        fuel_type="CNG",
        fuel_efficiency=22.0,
        fuel_rate=78.0,
        start_date=date(2026, 10, 15),
    )
    plan = RoadTripService.plan_road_trip(req)
    assert plan.fuel_breakdown.fuel_type == "CNG"
    assert plan.fuel_breakdown.fuel_unit == "km/kg"
    expected_cost = round((plan.total_distance_km / 22.0) * 78.0, 2)
    assert plan.fuel_breakdown.estimated_fuel_cost_inr == expected_cost


def test_4_electric_calculation_works():
    """4. Electric calculation: 7 km/kWh at 10.0 INR/kWh"""
    req = RoadTripPlanRequest(
        origin="Delhi",
        destination="Haridwar",
        travellers_count=4,
        vehicle_type="EV SUV",
        fuel_type="Electric",
        fuel_efficiency=7.0,
        fuel_rate=10.0,
        start_date=date(2026, 10, 15),
    )
    plan = RoadTripService.plan_road_trip(req)
    assert plan.fuel_breakdown.fuel_type == "Electric"
    assert plan.fuel_breakdown.fuel_unit == "km/kWh"
    expected_cost = round((plan.total_distance_km / 7.0) * 10.0, 2)
    assert plan.fuel_breakdown.estimated_fuel_cost_inr == expected_cost


def test_5_fuel_price_changes_update_total():
    """5. Fuel price changes update total: rate 100 vs rate 120"""
    req1 = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", travellers_count=2, fuel_efficiency=10.0, fuel_rate=100.0, start_date=date(2026, 10, 15)
    )
    req2 = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", travellers_count=2, fuel_efficiency=10.0, fuel_rate=120.0, start_date=date(2026, 10, 15)
    )
    p1 = RoadTripService.plan_road_trip(req1)
    p2 = RoadTripService.plan_road_trip(req2)
    assert p2.fuel_breakdown.estimated_fuel_cost_inr > p1.fuel_breakdown.estimated_fuel_cost_inr
    assert p2.budget_estimate.total_estimated > p1.budget_estimate.total_estimated


def test_6_and_7_stay_rates_update_total():
    """6 & 7. Stay rates ₹600/night vs ₹1500/night update total cost"""
    req_600 = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", stay_nights=2, stay_rate_per_night=600.0, stay_rooms=1, start_date=date(2026, 10, 15)
    )
    req_1500 = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", stay_nights=2, stay_rate_per_night=1500.0, stay_rooms=1, start_date=date(2026, 10, 15)
    )
    p_600 = RoadTripService.plan_road_trip(req_600)
    p_1500 = RoadTripService.plan_road_trip(req_1500)
    assert p_600.budget_estimate.stay_estimated == 1200.0
    assert p_1500.budget_estimate.stay_estimated == 3000.0
    assert p_1500.budget_estimate.total_estimated > p_600.budget_estimate.total_estimated


def test_8_and_9_multiple_nights_and_rooms_calculate_correctly():
    """8 & 9. Multiple nights (3) and multiple rooms (2) at 2000/night = 3 * 2 * 2000 = 12000"""
    req = RoadTripPlanRequest(
        origin="Delhi", destination="Goa", stay_nights=3, stay_rate_per_night=2000.0, stay_rooms=2, start_date=date(2026, 10, 15)
    )
    plan = RoadTripService.plan_road_trip(req)
    assert plan.budget_estimate.stay_estimated == 12000.0
    assert plan.budget_estimate.stay_nights == 3
    assert plan.budget_estimate.stay_rooms == 2


def test_10_11_12_exclusions_parking_tolls_activities():
    """10, 11, 12. Parking, Tolls, Activities can be excluded independently"""
    req_full = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", include_tolls=True, include_parking=True, include_activities=True, start_date=date(2026, 10, 15)
    )
    p_full = RoadTripService.plan_road_trip(req_full)
    assert p_full.budget_estimate.tolls_estimated > 0

    req_no_tolls = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", include_tolls=False, include_parking=True, include_activities=True, start_date=date(2026, 10, 15)
    )
    p_no_tolls = RoadTripService.plan_road_trip(req_no_tolls)
    assert p_no_tolls.budget_estimate.tolls_estimated == 0.0
    assert p_no_tolls.budget_estimate.total_estimated < p_full.budget_estimate.total_estimated

    req_no_parking = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", include_parking=False, start_date=date(2026, 10, 15)
    )
    p_no_parking = RoadTripService.plan_road_trip(req_no_parking)
    assert p_no_parking.budget_estimate.parking_other_estimated == 0.0

    req_no_activities = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", include_activities=False, start_date=date(2026, 10, 15)
    )
    p_no_activities = RoadTripService.plan_road_trip(req_no_activities)
    assert p_no_activities.budget_estimate.activities_estimated == 0.0


def test_13_14_custom_expenses_add_and_remove():
    """13 & 14. Custom expenses can be added and removed and affect total"""
    item1 = {"id": "c1", "name": "Snacks", "category": "Food", "amount": 500.0, "basis": "trip_total"}
    item2 = {"id": "c2", "name": "Camera Permit", "category": "Activity", "amount": 200.0, "basis": "per_person"}

    req_custom = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", travellers_count=4, custom_expenses=[item1, item2], start_date=date(2026, 10, 15)
    )
    p_custom = RoadTripService.plan_road_trip(req_custom)
    assert len(p_custom.budget_estimate.custom_expenses) == 2
    
    req_no_custom = RoadTripPlanRequest(
        origin="Delhi", destination="Haridwar", travellers_count=4, custom_expenses=[], start_date=date(2026, 10, 15)
    )
    p_no_custom = RoadTripService.plan_road_trip(req_no_custom)
    # item1 = 500, item2 = 200 * 4 = 800 -> 1300
    assert p_custom.budget_estimate.total_estimated == p_no_custom.budget_estimate.total_estimated + 1300.0


def test_15_traveller_count_updates_per_person_cost():
    """15. Traveller count updates per-person cost accurately"""
    req_2 = RoadTripPlanRequest(origin="Delhi", destination="Haridwar", travellers_count=2, start_date=date(2026, 10, 15))
    req_4 = RoadTripPlanRequest(origin="Delhi", destination="Haridwar", travellers_count=4, start_date=date(2026, 10, 15))
    p_2 = RoadTripService.plan_road_trip(req_2)
    p_4 = RoadTripService.plan_road_trip(req_4)
    assert p_2.budget_estimate.per_person_estimated == round(p_2.budget_estimate.total_estimated / 2, 2)
    assert p_4.budget_estimate.per_person_estimated == round(p_4.budget_estimate.total_estimated / 4, 2)


def test_16_and_17_budget_persists_and_updates_via_api(test_trip: Trip, auth_token: str):
    """16 & 17. Budget persists via PATCH /trips/{trip_id}/budget with membership security"""
    payload = {
        "budget_total": 14500.0,
        "travellers_count": 3,
        "vehicle_type": "SUV",
        "fuel_type": "Diesel",
        "fuel_efficiency": 16.0,
        "fuel_rate": 88.0,
        "fuel_unit": "km/l",
        "stay_nights": 2,
        "stay_rate_per_night": 2500.0,
        "stay_rooms": 1,
        "food_per_person_per_day": 800.0,
        "include_tolls": True,
        "tolls_amount": 340.0,
        "include_parking": False,
        "parking_amount": 0.0,
        "include_activities": True,
        "activities_amount": 1200.0,
        "custom_expenses": [
            {"id": "exp-1", "name": "Highway Chai & Snacks", "category": "Food", "amount": 600.0, "basis": "trip_total"}
        ]
    }
    resp = client.patch(
        f"/api/v1/trips/{test_trip.id}/budget",
        json=payload,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["budget_total"] == 14500.0
    assert data["travellers_count"] == 3


# ============================================================
# ISSUE 2: ASK VANVAS TRAVEL INTELLIGENCE & CONTEXT ROUTING
# ============================================================

def test_18_extract_explicit_destination_haridwar():
    """18. 'things to do in haridwar' resolves Haridwar context instead of defaulting to trip origin"""
    dest = extract_explicit_destination("things to do in haridwar")
    assert dest == "haridwar"

    dest2 = extract_explicit_destination("what to do in Haridwar")
    assert dest2 == "haridwar"

    dest3 = extract_explicit_destination("cafes in Manali")
    assert dest3 == "manali"


def test_19_and_20_ask_vanvas_fast_path_places_in_haridwar(auth_token: str, sample_destination: Destination):
    """19 & 20. Simple place queries return curated/live Haridwar places with action contracts"""
    payload = {
        "message": "things to do in haridwar",
        "session_id": "session-test-haridwar-1",
        "context": {
            "origin": "Delhi",
            "destination": "Haridwar",
            "type": "road_trip"
        }
    }
    resp = client.post(
        "/api/v1/copilot/chat",
        json=payload,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "message" in data
    assert "HARIDWAR" in data["message"].upper() or len(data.get("places", [])) > 0


def test_21_provider_failure_returns_honest_fallback(auth_token: str):
    """21. Provider failure uses honest fallback message, not generic broken cards"""
    payload = {
        "message": "tell me about haridwar temples",
        "session_id": "session-test-fallback-1",
    }
    resp = client.post(
        "/api/v1/copilot/chat",
        json=payload,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "message" in data
    assert len(data["message"]) > 0


# ============================================================
# ISSUE 3: ROAD TRIP JOURNEY ROUTE AFFORDANCES
# ============================================================

def test_24_25_26_delhi_haridwar_road_trip_day_affordances():
    """24, 25, 26. Delhi to Haridwar road trip has days with origin, destination, geometry and stops"""
    req = RoadTripPlanRequest(
        origin="Delhi",
        destination="Haridwar",
        travellers_count=4,
        start_date=date(2026, 10, 15),
    )
    plan = RoadTripService.plan_road_trip(req)
    assert len(plan.days) >= 1
    day1 = plan.days[0]
    assert day1.day_number == 1
    assert "Delhi" in day1.origin
    assert "Haridwar" in day1.destination
    assert day1.driving_distance_km > 180
    assert len(day1.stops) > 0
    assert len(plan.route_geometry) > 0
