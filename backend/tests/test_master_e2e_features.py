import pytest
import uuid
import hashlib
import secrets
from datetime import datetime, timezone, timedelta, date
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import Base, get_db, SessionLocal
from app.models.models import (
    User, UserPreference, Destination, Place, Hotel, RentalOption,
    Trip, TripMember, Itinerary, Expense, ChecklistItem,
    TravelCircle, CircleMember, CircleMessage, CircleActivity, CircleActivityVote,
    SoloTravelerProfile, SoloTripIntent, SoloDirectMessage,
    Booking, BookingItem, EmailVerificationOTP
)
from app.core.security import get_password_hash, create_access_token
from app.core.config import settings

@pytest.fixture
def client():
    return TestClient(app)


# ==========================================
# PHASE 1: AUTHENTICATION & USER ACCOUNT
# ==========================================
def test_phase1_auth_lifecycle(client):
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"aarav.{unique_id}@vanvas.app"

    # 1. Register User
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": "SecurePassword123!",
        "full_name": "Aarav Sharma"
    })
    assert reg_resp.status_code == 200
    assert reg_resp.json()["email_verified"] is False

    # 2. Login before verification must fail (403)
    login_fail = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert login_fail.status_code == 403

    # 3. Retrieve OTP from DB and verify
    db = SessionLocal()
    user = db.query(User).filter(User.email == test_email).first()
    assert user is not None
    # Insert known OTP for testing
    otp_code = "654321"
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
    otp_rec = db.query(EmailVerificationOTP).filter(EmailVerificationOTP.user_id == user.id).first()
    if otp_rec:
        otp_rec.otp_hash = otp_hash
        otp_rec.expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()
    db.close()

    # Invalid OTP fails
    verify_bad = client.post("/api/v1/auth/verify-email/confirm", json={
        "email": test_email,
        "otp": "000000"
    })
    assert verify_bad.status_code == 400

    # Correct OTP succeeds
    verify_good = client.post("/api/v1/auth/verify-email/confirm", json={
        "email": test_email,
        "otp": "654321"
    })
    assert verify_good.status_code == 200
    assert verify_good.json()["success"] is True

    # 4. Login succeeds with JWT token
    login_good = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert login_good.status_code == 200
    token = login_good.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 5. Get current user profile
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == test_email

    # 6. Update preferences
    pref_resp = client.put("/api/v1/auth/preferences", headers=headers, json={
        "preferred_travel_style": "Explorer",
        "activity_intensity": "High",
        "currency": "INR"
    })
    assert pref_resp.status_code == 200
    assert pref_resp.json()["preferred_travel_style"] == "Explorer"

    # 7. Select Avatar Preset
    avatar_resp = client.post("/api/v1/auth/profile/avatar/preset", headers=headers, json={
        "preset": "himalayan-explorer"
    })
    assert avatar_resp.status_code == 200
    assert "himalayan-explorer" in avatar_resp.json()["avatar_preset"]

    # 8. Export user data
    export_resp = client.get("/api/v1/auth/export", headers=headers)
    assert export_resp.status_code == 200
    assert export_resp.json()["user"]["email"] == test_email


# ==========================================
# PHASE 2 & 3: EXPLORE & PLACE DISCOVERY
# ==========================================
def test_phase2_and_3_explore_places(client):
    # List canonical destinations
    d_resp = client.get("/api/v1/destinations")
    assert d_resp.status_code == 200
    destinations = d_resp.json()
    assert len(destinations) >= 8
    slugs = [d["slug"] for d in destinations]
    for required_slug in ["manali", "rishikesh", "udaipur", "goa", "jaipur", "varanasi", "leh", "spiti"]:
        assert required_slug in slugs

    # Destination Detail for Manali
    m_resp = client.get("/api/v1/destinations/manali")
    assert m_resp.status_code == 200
    m_data = m_resp.json()
    assert "destination" in m_data
    assert m_data["destination"]["name"] == "Manali"
    assert len(m_data["places"]) >= 1

    # Place Detail
    first_place = m_data["places"][0]
    p_resp = client.get(f"/api/v1/places/{first_place['id']}")
    assert p_resp.status_code == 200
    place_detail = p_resp.json()
    assert place_detail["name"] == first_place["name"]
    assert "latitude" in place_detail and "longitude" in place_detail


# ==========================================
# PHASE 4 & 5: STAYS & RENTALS
# ==========================================
def test_phase4_and_5_stays_rentals(client):
    # Stays for Manali
    stays_resp = client.get("/api/v1/destinations/manali/hotels")
    assert stays_resp.status_code == 200
    stays = stays_resp.json()
    assert len(stays) >= 1
    assert "price_per_night" in stays[0]
    assert stays[0]["price_per_night"] > 0

    # Rentals for Manali
    rentals_resp = client.get("/api/v1/destinations/manali/rentals")
    assert rentals_resp.status_code == 200
    rentals = rentals_resp.json()
    assert len(rentals) >= 1
    assert any("Himalayan" in r.get("vehicle_name", "") or "Activa" in r.get("vehicle_name", "") for r in rentals)


# ==========================================
# PHASE 7 & 8: TRIP PLANNING & QUICK PLAN
# ==========================================
def test_phase7_and_8_planning_engine(client):
    # Create authenticated user
    u_id = str(uuid.uuid4())
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"planner.{unique_id}@vanvas.app"
    db = SessionLocal()
    user = User(
        id=u_id,
        email=test_email,
        full_name="Pooja Planner",
        hashed_password=get_password_hash("pass12345"),
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.close()

    token = create_access_token(u_id)
    headers = {"Authorization": f"Bearer {token}"}

    # Plan Trip via POST /api/v1/trips
    plan_resp = client.post("/api/v1/trips", headers=headers, json={
        "destination_id": "manali",
        "start_date": "2026-10-10",
        "end_date": "2026-10-12",
        "origin_city": "Delhi",
        "transport_mode": "bus",
        "travellers_count": 2,
        "budget": 25000.0,
        "interests": ["Nature", "Cafes", "Adventure"],
        "companion_type": "Friends",
        "travel_style": "Balanced"
    })
    assert plan_resp.status_code in [200, 201]
    trip_data = plan_resp.json()
    assert "id" in trip_data


# ==========================================
# PHASE 9 & 10: SOLO TRAVEL & CIRCLES
# ==========================================
def test_phase9_and_10_solo_and_circles(client):
    # Setup 2 distinct users
    u1_id = str(uuid.uuid4())
    u2_id = str(uuid.uuid4())
    id1 = uuid.uuid4().hex[:8]
    id2 = uuid.uuid4().hex[:8]
    db = SessionLocal()
    u1 = User(
        id=u1_id,
        email=f"solo1.{id1}@vanvas.app",
        full_name="Solo Explorer One",
        hashed_password=get_password_hash("pass12345"),
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    u2 = User(
        id=u2_id,
        email=f"solo2.{id2}@vanvas.app",
        full_name="Solo Explorer Two",
        hashed_password=get_password_hash("pass12345"),
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add_all([u1, u2])
    db.commit()
    dest = db.query(Destination).filter(Destination.slug == "manali").first()
    dest_id = dest.id if dest else "dest-manali"
    db.close()

    t1 = create_access_token(u1_id)
    t2 = create_access_token(u2_id)
    h1 = {"Authorization": f"Bearer {t1}"}
    h2 = {"Authorization": f"Bearer {t2}"}

    # User 1 sets Solo profile via PUT /api/v1/solo/profile
    p1_resp = client.put("/api/v1/solo/profile", headers=h1, json={
        "bio": "Himalayan hiker seeking serene trails",
        "travel_style": "Backpacker",
        "is_enabled": True
    })
    assert p1_resp.status_code == 200

    # User 2 sets Solo profile
    p2_resp = client.put("/api/v1/solo/profile", headers=h2, json={
        "bio": "Cafe enthusiast & landscape photographer",
        "travel_style": "Explorer",
        "is_enabled": True
    })
    assert p2_resp.status_code == 200

    # User 2 discovers travelers
    disc_resp = client.get("/api/v1/solo/discover?destination_slug=manali", headers=h2)
    assert disc_resp.status_code == 200

    # Circle Management: User 1 creates Circle
    circle_resp = client.post("/api/v1/circles", headers=h1, json={
        "name": f"Manali Trekkers {id1}",
        "description": "Planning October trek to Jogini falls",
        "destination_id": dest_id,
        "start_date": "2026-10-15",
        "end_date": "2026-10-18",
        "max_members": 6,
        "activity_type": "Exploration",
        "meetup_point": "Mall Road Square"
    })
    assert circle_resp.status_code == 200
    circle = circle_resp.json()
    circle_id = circle["id"]

    # Post message to Circle
    msg_resp = client.post(f"/api/v1/circles/{circle_id}/messages", headers=h1, json={
        "content": "Excited for the upcoming trek!"
    })
    assert msg_resp.status_code == 200


# ==========================================
# PHASE 11, 12, 13: TRIPS, JOURNAL, BUDGET & DETERMINISTIC MATH
# ==========================================
def test_phase11_12_13_trips_journal_budget(client):
    u_id = str(uuid.uuid4())
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"budgeter.{unique_id}@vanvas.app"
    db = SessionLocal()
    user = User(
        id=u_id,
        email=test_email,
        full_name="Rohan Verma",
        hashed_password=get_password_hash("pass12345"),
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    dest = db.query(Destination).filter(Destination.slug == "manali").first()
    db.add(user)
    db.commit()

    trip = Trip(
        id=str(uuid.uuid4()),
        user_id=u_id,
        destination_id=dest.id,
        title="Manali Autumn Retreat",
        budget_total=20000.0,
        budget_spent=0.0,
        start_date=datetime.now(timezone.utc).date() + timedelta(days=2),
        end_date=datetime.now(timezone.utc).date() + timedelta(days=5),
        num_days=4
    )
    db.add(trip)
    db.commit()
    trip_id = trip.id
    db.close()

    token = create_access_token(u_id)
    headers = {"Authorization": f"Bearer {token}"}

    # Add Expenses: ₹5000, ₹2500, ₹1200 -> Total: ₹8700, Remaining: ₹11300
    e1 = client.post(f"/api/v1/trips/{trip_id}/expenses", headers=headers, json={
        "title": "Volvo Bus Tickets",
        "amount": 5000.0,
        "category": "Transport"
    })
    assert e1.status_code in [200, 201]

    e2 = client.post(f"/api/v1/trips/{trip_id}/expenses", headers=headers, json={
        "title": "Old Manali Homestay Deposit",
        "amount": 2500.0,
        "category": "Hotel"
    })
    assert e2.status_code in [200, 201]

    e3 = client.post(f"/api/v1/trips/{trip_id}/expenses", headers=headers, json={
        "title": "Cafe 1947 Dinner",
        "amount": 1200.0,
        "category": "Food"
    })
    assert e3.status_code in [200, 201]

    # Get Trip Budget & Verify Exact Deterministic Calculations
    budget_resp = client.get(f"/api/v1/trips/{trip_id}/budget", headers=headers)
    assert budget_resp.status_code == 200
    b_data = budget_resp.json()
    assert b_data["total_spent"] == 8700.0
    assert b_data["total_remaining"] == 11300.0
    assert b_data["total_budget"] == 20000.0


# ==========================================
# PHASE 14 & 15: NEARBY & ARRIVAL MODE
# ==========================================
def test_phase14_and_15_nearby_and_arrival(client):
    # Nearby places query near Manali coords (32.2432, 77.1892)
    nearby_resp = client.get("/api/v1/places/nearby?lat=32.2432&lng=77.1892&radius_km=15")
    assert nearby_resp.status_code == 200
    places = nearby_resp.json()
    assert isinstance(places, list)
    assert len(places) >= 1


# ==========================================
# PHASE 17: SEARCH INTENT RESOLUTION
# ==========================================
def test_phase17_search_intents(client):
    test_queries = [
        "best cafes in Manali",
        "hotels in Manali",
        "bike rental in Manali"
    ]
    for q in test_queries:
        resp = client.get(f"/api/v1/search/intent?q={q}")
        assert resp.status_code == 200
        data = resp.json()
        assert "intent" in data


# ==========================================
# PHASE 20: SECURITY & DATA ISOLATION
# ==========================================
def test_phase20_security_and_isolation(client):
    # Setup User A and User B
    a_id = str(uuid.uuid4())
    b_id = str(uuid.uuid4())
    trip_a_id = str(uuid.uuid4())
    id_a = uuid.uuid4().hex[:8]
    id_b = uuid.uuid4().hex[:8]
    db = SessionLocal()
    user_a = User(
        id=a_id,
        email=f"user_alpha.{id_a}@vanvas.app",
        full_name="User Alpha",
        hashed_password=get_password_hash("password123"),
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    user_b = User(
        id=b_id,
        email=f"user_bravo.{id_b}@vanvas.app",
        full_name="User Bravo",
        hashed_password=get_password_hash("password123"),
        role="traveller",
        email_verified_at=datetime.now(timezone.utc)
    )
    db.add_all([user_a, user_b])
    db.commit()

    dest = db.query(Destination).first()
    # Trip owned by User A
    trip_a = Trip(
        id=trip_a_id,
        user_id=a_id,
        destination_id=dest.id,
        title="User A Secret Expedition",
        budget_total=50000.0,
        budget_spent=0.0,
        start_date=datetime.now(timezone.utc).date() + timedelta(days=2),
        end_date=datetime.now(timezone.utc).date() + timedelta(days=5)
    )
    db.add(trip_a)
    db.commit()
    db.close()

    token_b = create_access_token(b_id)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B attempts to access User A's private trip -> must be 403 or 404
    hack_resp = client.get(f"/api/v1/trips/{trip_a_id}", headers=headers_b)
    assert hack_resp.status_code in [403, 404]

    # User B attempts to add expense to User A's private trip -> must be 403 or 404
    hack_mutate = client.post(f"/api/v1/trips/{trip_a_id}/expenses", headers=headers_b, json={
        "title": "Malicious Expense",
        "amount": 9999.0,
        "category": "Other"
    })
    assert hack_mutate.status_code in [403, 404]
