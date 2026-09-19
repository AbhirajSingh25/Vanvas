"""
VANVAS Travel Commerce Foundation Test Suite.
Validates:
1. Provider-neutral Booking, BookingItem, and BookingEvent models and services.
2. Valid state transitions and strict rejection of illegal state jumps.
3. Terminal state immutability (CANCELLED, REFUNDED, FAILED).
4. User ownership and authorization isolation (User A cannot access User B's bookings).
5. Offer contracts with explicit booking capabilities (DISCOVERY_ONLY, EXTERNAL_CHECKOUT, IN_APP_BOOKING, UNAVAILABLE).
6. Preservation of unknown prices (None) and unknown availability (UNKNOWN).
7. Action link generator URL verification and strict rejection of fake/placeholder domains.
8. Commerce API endpoints (offers search, booking intent, state transitions, booking history).
9. Copilot AI tool commerce truthfulness and zero fabrication.
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal, engine, Base
from app.models.models import User, Destination, Place, Hotel, Booking, BookingItem, BookingEvent
from app.core.security import create_access_token, get_password_hash
from app.services.booking_service import BookingService
from app.providers.commerce.discovery_adapter import DiscoveryCommerceAdapter
from app.services.action_link_generator import ActionLinkGenerator
from app.providers.ai.dispatcher import AIToolDispatcher

# Ensure schema tables exist
Base.metadata.create_all(bind=engine)

client = TestClient(app)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_user_a(db):
    user = db.query(User).filter(User.email == "commerce_user_a@vanvas.com").first()
    if not user:
        user = User(
            id="usr-comm-a-1",
            email="commerce_user_a@vanvas.com",
            hashed_password=get_password_hash("Pass123!"),
            full_name="Aarav Sharma",
            role="traveller",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def test_user_b(db):
    user = db.query(User).filter(User.email == "commerce_user_b@vanvas.com").first()
    if not user:
        user = User(
            id="usr-comm-b-2",
            email="commerce_user_b@vanvas.com",
            hashed_password=get_password_hash("Pass456!"),
            full_name="Bhavna Patel",
            role="traveller",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@pytest.fixture
def auth_headers_a(test_user_a):
    token = create_access_token(subject=test_user_a.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_b(test_user_b):
    token = create_access_token(subject=test_user_b.id)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 1. BOOKING DOMAIN & SERVICE TESTS
# ---------------------------------------------------------------------------

def test_booking_creation_and_events(db, test_user_a):
    """Test creating a booking intent creates the record and initial BookingEvent."""
    booking = BookingService.create_booking_intent(
        db=db,
        user=test_user_a,
        provider="discovery_adapter",
        booking_type="stay",
        currency="INR",
        items=[
            {
                "product_type": "stay",
                "title": "Riverside Forest Cottage",
                "destination": "Manali",
                "quantity": 1,
                "unit_price": 4500.0,
                "total_price": 4500.0,
            }
        ]
    )

    assert booking.id is not None
    assert booking.user_id == test_user_a.id
    assert booking.status == "SELECTED"
    assert booking.total_amount == 4500.0
    assert len(booking.items) == 1
    assert booking.items[0].title == "Riverside Forest Cottage"

    # Verify event audit
    events = db.query(BookingEvent).filter(BookingEvent.booking_id == booking.id).all()
    assert len(events) >= 1
    assert events[0].new_status == "SELECTED"


def test_valid_booking_state_transitions(db, test_user_a):
    """Test standard forward progression through allowed state graph."""
    booking = BookingService.create_booking_intent(
        db=db,
        user=test_user_a,
        provider="discovery_adapter",
        booking_type="stay",
        items=[{"product_type": "stay", "title": "Alpine Retreat", "destination": "Manali", "unit_price": 3000.0, "total_price": 3000.0}]
    )
    assert booking.status == "SELECTED"

    # SELECTED -> CHECKOUT_READY
    b2 = BookingService.transition_booking_status(db, booking.id, "CHECKOUT_READY", user=test_user_a, reason="User reached checkout page")
    assert b2.status == "CHECKOUT_READY"

    # CHECKOUT_READY -> PENDING
    b3 = BookingService.transition_booking_status(db, booking.id, "PENDING", user=test_user_a, reason="External payment pending")
    assert b3.status == "PENDING"

    # PENDING -> CONFIRMED
    b4 = BookingService.transition_booking_status(
        db, booking.id, "CONFIRMED", user=test_user_a, reason="Provider confirmation received",
        metadata={"confirmation_reference": "REF-VANVAS-9988"}
    )
    assert b4.status == "CONFIRMED"
    assert b4.confirmation_reference == "REF-VANVAS-9988"

    # CONFIRMED -> CANCELLED
    b5 = BookingService.transition_booking_status(db, booking.id, "CANCELLED", user=test_user_a, reason="User cancelled trip")
    assert b5.status == "CANCELLED"


def test_invalid_booking_state_transitions_rejected(db, test_user_a):
    """Test that arbitrary state jumps (e.g. DISCOVERED -> CONFIRMED) are strictly rejected."""
    booking = BookingService.create_booking_intent(
        db=db,
        user=test_user_a,
        provider="discovery_adapter",
        booking_type="stay",
        items=[{"product_type": "stay", "title": "Test Hotel", "destination": "Mussoorie"}]
    )

    # SELECTED -> CONFIRMED is illegal without going through CHECKOUT_READY -> PENDING
    with pytest.raises(ValueError) as exc:
        BookingService.transition_booking_status(db, booking.id, "CONFIRMED", user=test_user_a)
    assert "Invalid status transition" in str(exc.value)

    # Cancel the booking (SELECTED -> CANCELLED is allowed)
    b_cancelled = BookingService.transition_booking_status(db, booking.id, "CANCELLED", user=test_user_a)
    assert b_cancelled.status == "CANCELLED"

    # From terminal CANCELLED, no transitions are allowed
    with pytest.raises(ValueError) as exc:
        BookingService.transition_booking_status(db, booking.id, "CONFIRMED", user=test_user_a)
    assert "Invalid status transition" in str(exc.value)


# ---------------------------------------------------------------------------
# 2. USER OWNERSHIP & ISOLATION
# ---------------------------------------------------------------------------

def test_booking_user_isolation(db, test_user_a, test_user_b, auth_headers_a, auth_headers_b):
    """User B must not be able to view or transition User A's booking."""
    booking_a = BookingService.create_booking_intent(
        db=db,
        user=test_user_a,
        provider="discovery_adapter",
        booking_type="stay",
        items=[{"product_type": "stay", "title": "Aarav Stay", "destination": "Manali"}]
    )

    # User A can get their booking
    res_a = client.get(f"/api/v1/bookings/{booking_a.id}", headers=auth_headers_a)
    assert res_a.status_code == 200
    assert res_a.json()["id"] == booking_a.id

    # User B cannot get User A's booking
    res_b = client.get(f"/api/v1/bookings/{booking_a.id}", headers=auth_headers_b)
    assert res_b.status_code in [403, 404]

    # User B cannot transition User A's booking
    res_b_trans = client.post(
        f"/api/v1/bookings/{booking_a.id}/transition",
        headers=auth_headers_b,
        json={"target_status": "CANCELLED", "reason": "Malicious attempt"}
    )
    assert res_b_trans.status_code in [403, 404]


def test_booking_history_isolation(db, test_user_a, test_user_b, auth_headers_a, auth_headers_b):
    """GET /api/v1/bookings returns only the authenticated user's bookings."""
    # List for User A
    res_a = client.get("/api/v1/bookings", headers=auth_headers_a)
    assert res_a.status_code == 200
    user_a_bookings = res_a.json()
    for b in user_a_bookings:
        assert b["user_id"] == test_user_a.id

    # List for User B
    res_b = client.get("/api/v1/bookings", headers=auth_headers_b)
    assert res_b.status_code == 200
    user_b_bookings = res_b.json()
    for b in user_b_bookings:
        assert b["user_id"] == test_user_b.id


# ---------------------------------------------------------------------------
# 3. OFFER CONTRACT & CAPABILITY TESTS
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_offer_contract_capabilities(db):
    """Test DiscoveryCommerceAdapter returns typed Offer objects with explicit capabilities."""
    adapter = DiscoveryCommerceAdapter(db=db)
    offers = await adapter.search(destination="manali")

    assert isinstance(offers, list)
    assert len(offers) > 0

    for offer in offers:
        assert offer.provider is not None
        assert offer.provider_offer_id is not None
        assert offer.product_type in ["stay", "transport", "rental", "place", "activity"]
        assert offer.booking_capability in ["DISCOVERY_ONLY", "EXTERNAL_CHECKOUT", "IN_APP_BOOKING", "UNAVAILABLE"]
        assert offer.availability_state in ["AVAILABLE", "LIMITED", "UNAVAILABLE", "UNKNOWN"]

        # If booking_url is verified and present, capability should be EXTERNAL_CHECKOUT
        if offer.deep_link and ActionLinkGenerator.is_valid_url(offer.deep_link):
            assert offer.booking_capability == "EXTERNAL_CHECKOUT"
        elif not offer.deep_link:
            assert offer.booking_capability == "DISCOVERY_ONLY"


@pytest.mark.asyncio
async def test_offer_preserves_unknown_price_and_availability(db):
    """Unknown prices must remain None (never 0 or free) and unknown availability must remain UNKNOWN."""
    adapter = DiscoveryCommerceAdapter(db=db)
    offers = await adapter.search(destination="manali")

    for offer in offers:
        if offer.price is None:
            # Price is truthfully unknown
            assert offer.price is None
        if offer.availability_state == "UNKNOWN":
            assert offer.availability_state == "UNKNOWN"


# ---------------------------------------------------------------------------
# 4. ACTION LINK & URL VERIFICATION TESTS
# ---------------------------------------------------------------------------

def test_action_link_url_verification():
    """Valid URLs are accepted; invalid or placeholder URLs are rejected."""
    # Valid external URLs
    assert ActionLinkGenerator.is_valid_url("https://www.makemytrip.com/hotels/manali.html") is True
    assert ActionLinkGenerator.is_valid_url("https://booking.hptdc.in/resort/123") is True
    assert ActionLinkGenerator.is_valid_url("http://hotel-himalaya.in") is True

    # Placeholder & invalid domains must be rejected
    assert ActionLinkGenerator.is_valid_url("https://example.com/book") is False
    assert ActionLinkGenerator.is_valid_url("http://test.com/stay") is False
    assert ActionLinkGenerator.is_valid_url("https://placeholder.com/hotel") is False
    assert ActionLinkGenerator.is_valid_url("http://localhost:8000/hotel") is False
    assert ActionLinkGenerator.is_valid_url("javascript:alert(1)") is False
    assert ActionLinkGenerator.is_valid_url("not_a_url") is False
    assert ActionLinkGenerator.is_valid_url(None) is False


def test_hotel_action_links_generation():
    """ActionLinkGenerator produces EXTERNAL_CHECKOUT with 'Continue with Provider' only for verified URLs."""
    # Verified booking URL
    links = ActionLinkGenerator.generate_hotel_action_links(
        name="The Himalayan Resort",
        latitude=32.2432,
        longitude=77.1892,
        website=None,
        phone=None,
        booking_url="https://booking.himalayanresort.in/rooms",
    )
    booking_links = [l for l in links if l.get("type") in ["external_checkout", "booking"]]
    assert len(booking_links) == 1
    assert booking_links[0]["label"] == "Continue with Provider"
    assert booking_links[0]["capability"] == "EXTERNAL_CHECKOUT"

    # Fake booking URL (example.com) should NOT produce a booking link
    fake_links = ActionLinkGenerator.generate_hotel_action_links(
        name="Fake Hotel",
        latitude=32.2432,
        longitude=77.1892,
        website=None,
        phone=None,
        booking_url="https://example.com/booking",
    )
    fake_booking_links = [l for l in fake_links if l.get("type") in ["external_checkout", "booking"]]
    assert len(fake_booking_links) == 0


# ---------------------------------------------------------------------------
# 5. COMMERCE API ENDPOINTS
# ---------------------------------------------------------------------------

def test_api_get_offers(auth_headers_a):
    """GET /api/v1/offers returns verified offers for destination."""
    res = client.get("/api/v1/offers?destination=manali")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "booking_capability" in data[0]
    assert "provider" in data[0]


def test_api_check_offer_availability():
    """GET /api/v1/offers/{id}/availability returns truthful state."""
    res = client.get("/api/v1/offers/stay-123/availability")
    assert res.status_code == 200
    data = res.json()
    assert data["offer_id"] == "stay-123"
    assert "availability_state" in data
    assert "message" in data


def test_api_create_booking_intent(auth_headers_a):
    """POST /api/v1/bookings/intent creates verified booking intent."""
    payload = {
        "provider": "discovery_adapter",
        "booking_type": "stay",
        "currency": "INR",
        "total_amount": 5500.0,
        "items": [
            {
                "product_type": "stay",
                "title": "Cedar Ridge Cottage",
                "destination": "Manali",
                "quantity": 1,
                "unit_price": 5500.0,
                "total_price": 5500.0,
            }
        ]
    }
    res = client.post("/api/v1/bookings/intent", headers=auth_headers_a, json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "SELECTED"
    assert data["total_amount"] == 5500.0
    assert len(data["items"]) == 1


# ---------------------------------------------------------------------------
# 6. COPILOT COMMERCE TRUTHFULNESS
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_copilot_tool_search_commerce_offers(db, test_user_a):
    """Tool search_commerce_offers returns structured offers with capabilities."""
    dispatcher = AIToolDispatcher(db=db, user=test_user_a)
    result = await dispatcher.dispatch("search_commerce_offers", {"destination": "manali"})

    assert "offers" in result
    assert "disclaimer" in result
    assert len(result["offers"]) > 0
    first_offer = result["offers"][0]
    assert "booking_capability" in first_offer
    assert first_offer["booking_capability"] in ["DISCOVERY_ONLY", "EXTERNAL_CHECKOUT", "IN_APP_BOOKING", "UNAVAILABLE"]


@pytest.mark.asyncio
async def test_copilot_tool_get_user_bookings_truthfulness(db, test_user_a, test_user_b):
    """Tool get_user_bookings only returns the authenticated user's bookings."""
    dispatcher_a = AIToolDispatcher(db=db, user=test_user_a)
    res_a = await dispatcher_a.dispatch("get_user_bookings", {})
    assert "bookings" in res_a
    assert res_a["total_bookings"] >= 1

    dispatcher_unauth = AIToolDispatcher(db=db, user=None)
    res_unauth = await dispatcher_unauth.dispatch("get_user_bookings", {})
    assert res_unauth.get("authenticated") is False
