import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone, timedelta
from app.main import app
from app.database.session import SessionLocal
from app.models.models import Booking, PaymentTransaction, WebhookEvent, User, Trip, Destination
from app.services.booking_service import (
    BookingService,
    ALLOWED_TRANSITIONS,
    VALID_BOOKING_TYPES,
)
from app.services.payment_service import PaymentService

client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def auth_headers(db_session):
    test_user = db_session.query(User).filter_by(email="booking_explorer@vanvas.com").first()
    if not test_user:
        test_user = User(
            email="booking_explorer@vanvas.com",
            full_name="Booking Explorer",
            hashed_password="hash",
            email_verified_at=datetime.now(timezone.utc),
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

    from app.core.security import create_access_token
    token = create_access_token(subject=test_user.id)
    return {"Authorization": f"Bearer {token}"}, test_user

from datetime import datetime, timezone, timedelta, date

@pytest.fixture
def sample_trip(db_session, auth_headers):
    _, user = auth_headers
    dest = db_session.query(Destination).first()
    if not dest:
        dest = Destination(name="Manali", slug="manali", state="Himachal Pradesh", description="Valley of Gods")
        db_session.add(dest)
        db_session.commit()
        db_session.refresh(dest)

    trip = Trip(
        user_id=user.id,
        destination_id=dest.id,
        title="Manali Autumn Expedition",
        num_days=4,
        start_date=date(2026, 10, 15),
        end_date=date(2026, 10, 19),
        status="active",
    )
    db_session.add(trip)
    db_session.commit()
    db_session.refresh(trip)
    return trip


class TestBookingDomainAndStateMachine:
    def test_booking_state_machine_valid_transitions(self):
        assert "CHECKING_AVAILABILITY" in ALLOWED_TRANSITIONS["DRAFT"]
        assert "AVAILABLE" in ALLOWED_TRANSITIONS["CHECKING_AVAILABILITY"]
        assert "UNAVAILABLE" in ALLOWED_TRANSITIONS["CHECKING_AVAILABILITY"]
        assert "PAYMENT_REQUIRED" in ALLOWED_TRANSITIONS["AVAILABLE"]
        assert "PAYMENT_PROCESSING" in ALLOWED_TRANSITIONS["PAYMENT_REQUIRED"]
        assert "CONFIRMING" in ALLOWED_TRANSITIONS["PAYMENT_PROCESSING"]
        assert "CONFIRMED" in ALLOWED_TRANSITIONS["CONFIRMING"]
        assert "CANCELLED" in ALLOWED_TRANSITIONS["CONFIRMED"]
        assert "REFUND_PENDING" in ALLOWED_TRANSITIONS["CONFIRMED"]
        assert "REFUNDED" in ALLOWED_TRANSITIONS["REFUND_PENDING"]

    def test_booking_types_supported(self):
        expected_types = {"stay", "hotel", "hostel", "homestay", "rental", "bus", "train", "flight", "cab", "activity"}
        for t in expected_types:
            assert t in VALID_BOOKING_TYPES


import uuid

class TestEndToEndBookingCheckoutFlow:
    def test_checkout_initiate_revalidates_price_and_creates_draft(self, auth_headers, sample_trip, db_session):
        headers, user = auth_headers
        idem_key = f"idem_chk_{uuid.uuid4().hex[:8]}"
        payload = {
            "provider_offer_id": "offer_manali_himalayan_001",
            "provider": "sandbox_stay",
            "booking_type": "stay",
            "trip_id": sample_trip.id,
            "title": "Himalayan Cedar Sanctuary",
            "destination": "Manali",
            "check_in": "2026-10-15",
            "check_out": "2026-10-18",
            "guests": 2,
            "rooms": 1,
            "traveller_name": "Explorer Sharma",
            "traveller_email": "explorer@vanvas.com",
            "traveller_phone": "+919876543210",
            "unit_price": 4500.0,
            "idempotency_key": idem_key,
            "special_requests": "Quiet room with mountain view",
        }

        response = client.post("/api/v1/bookings/checkout", json=payload, headers=headers)
        assert response.status_code == 201
        booking_data = response.json()

        assert booking_data["public_booking_reference"].startswith("VV-2026-")
        assert booking_data["status"] in ["AVAILABLE", "PAYMENT_REQUIRED"]
        assert booking_data["base_amount"] > 0
        assert booking_data["taxes"] > 0
        assert booking_data["total_amount"] == booking_data["base_amount"] + booking_data["taxes"] + booking_data["fees"]
        assert len(booking_data["items"]) >= 1

        # Verify duplicate tap with same idempotency key returns exact same booking
        dup_response = client.post("/api/v1/bookings/checkout", json=payload, headers=headers)
        assert dup_response.status_code == 201
        assert dup_response.json()["id"] == booking_data["id"]

    def test_payment_initiation_and_verification_flow(self, auth_headers, sample_trip, db_session):
        headers, user = auth_headers
        idem_key = f"idem_pay_{uuid.uuid4().hex[:8]}"
        checkout_payload = {
            "provider_offer_id": "offer_manali_luxury_002",
            "provider": "sandbox_stay",
            "booking_type": "stay",
            "trip_id": sample_trip.id,
            "title": "Old Manali Riverside Cottage",
            "destination": "Manali",
            "check_in": "2026-11-01",
            "check_out": "2026-11-04",
            "guests": 2,
            "rooms": 1,
            "traveller_name": "Aarav Mehta",
            "traveller_email": "aarav@vanvas.com",
            "traveller_phone": "+919988776655",
            "unit_price": 5200.0,
            "idempotency_key": idem_key,
        }

        chk_res = client.post("/api/v1/bookings/checkout", json=checkout_payload, headers=headers)
        assert chk_res.status_code == 201
        booking_id = chk_res.json()["id"]

        # 1. Initiate Payment
        pay_res = client.post(
            f"/api/v1/bookings/{booking_id}/pay",
            json={"payment_gateway": "vanvas_pay_sandbox", "idempotency_key": f"pay_{idem_key}"},
            headers=headers,
        )
        assert pay_res.status_code == 200
        pay_data = pay_res.json()
        assert pay_data["order_id"] is not None
        assert pay_data["amount"] > 0
        assert pay_data["currency"] == "INR"

        # 2. Verify Payment (Server derives amount & signature, confirms booking)
        from app.providers.commerce.sandbox_payment_adapter import SandboxPaymentGateway
        payment_id = f"pay_sandbox_{pay_data['order_id']}"
        sig = SandboxPaymentGateway.generate_signature(pay_data["order_id"], payment_id)
        verify_payload = {
            "gateway_order_id": pay_data["order_id"],
            "gateway_payment_id": payment_id,
            "gateway_signature": sig,
            "payment_transaction_id": pay_data["payment_transaction_id"],
        }
        ver_res = client.post(
            f"/api/v1/bookings/{booking_id}/verify-payment",
            json=verify_payload,
            headers=headers,
        )
        assert ver_res.status_code == 200
        ver_data = ver_res.json()
        assert ver_data["success"] is True
        assert ver_data["booking"]["status"] == "CONFIRMED"
        assert ver_data["booking"]["payment_status"] == "PAYMENT_SUCCESS"
        assert ver_data["booking"]["confirmed_at"] is not None
        assert ver_data["booking"]["booking_snapshot"] is not None

        # 3. Retrieve by ID
        get_res = client.get(f"/api/v1/bookings/{booking_id}", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["status"] == "CONFIRMED"

        # 4. Trip Bookings endpoint
        trip_b_res = client.get(f"/api/v1/trips/{sample_trip.id}/bookings", headers=headers)
        assert trip_b_res.status_code == 200
        trip_bookings = trip_b_res.json()
        assert len(trip_bookings) >= 1
        assert any(b["id"] == booking_id for b in trip_bookings)

    def test_cancellation_and_refund_lifecycle(self, auth_headers, sample_trip, db_session):
        headers, user = auth_headers
        idem_key = f"idem_cancel_{uuid.uuid4().hex[:8]}"
        checkout_payload = {
            "provider_offer_id": "offer_manali_cancel_test",
            "provider": "sandbox_stay",
            "booking_type": "stay",
            "trip_id": sample_trip.id,
            "title": "Snow Peak Homestay",
            "destination": "Manali",
            "check_in": "2026-12-10",
            "check_out": "2026-12-12",
            "guests": 1,
            "rooms": 1,
            "traveller_name": "Cancel Tester",
            "traveller_email": "cancel@vanvas.com",
            "traveller_phone": "+919123456780",
            "unit_price": 3000.0,
            "idempotency_key": idem_key,
        }

        chk_res = client.post("/api/v1/bookings/checkout", json=checkout_payload, headers=headers)
        assert chk_res.status_code == 201
        booking_id = chk_res.json()["id"]

        # Pay & confirm
        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data = pay_res.json()
        from app.providers.commerce.sandbox_payment_adapter import SandboxPaymentGateway
        payment_id = f"pay_{pay_data['order_id']}"
        sig = SandboxPaymentGateway.generate_signature(pay_data["order_id"], payment_id)
        client.post(
            f"/api/v1/bookings/{booking_id}/verify-payment",
            json={
                "gateway_order_id": pay_data["order_id"],
                "gateway_payment_id": payment_id,
                "gateway_signature": sig,
                "payment_transaction_id": pay_data["payment_transaction_id"],
            },
            headers=headers,
        )

        # Cancel Booking
        cancel_res = client.post(
            f"/api/v1/bookings/{booking_id}/cancel",
            json={"reason": "Travel plans changed"},
            headers=headers,
        )
        assert cancel_res.status_code == 200
        cancel_data = cancel_res.json()
        assert cancel_data["success"] is True
        assert cancel_data["status"] in ["CANCELLED", "REFUNDED", "REFUND_PENDING"]
        assert cancel_data["refund_amount"] > 0

    def test_security_cross_user_isolation(self, auth_headers, sample_trip, db_session):
        headers, user = auth_headers
        # Create user B
        user_b = User(
            email=f"intruder_{uuid.uuid4().hex[:6]}@vanvas.com",
            full_name="Intruder",
            hashed_password="hash",
            email_verified_at=datetime.now(timezone.utc),
        )
        db_session.add(user_b)
        db_session.commit()
        db_session.refresh(user_b)

        from app.core.security import create_access_token
        token_b = create_access_token(subject=user_b.id)
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # User A creates a booking
        chk_res = client.post(
            "/api/v1/bookings/checkout",
            json={
                "provider_offer_id": "offer_isolated_stay",
                "provider": "sandbox_stay",
                "booking_type": "stay",
                "title": "Private Villa Isolation",
                "destination": "Manali",
                "check_in": "2026-11-20",
                "check_out": "2026-11-22",
                "guests": 2,
                "rooms": 1,
                "traveller_name": "Owner User",
                "traveller_email": "booking_explorer@vanvas.com",
                "traveller_phone": "+919876543210",
                "unit_price": 6000.0,
                "idempotency_key": f"idem_iso_{uuid.uuid4().hex[:8]}",
            },
            headers=headers,
        )
        assert chk_res.status_code == 201
        booking_id = chk_res.json()["id"]

        # User B tries to view or cancel User A's booking -> 404 / 403 Forbidden
        intrude_get = client.get(f"/api/v1/bookings/{booking_id}", headers=headers_b)
        assert intrude_get.status_code in [403, 404]

        intrude_cancel = client.post(f"/api/v1/bookings/{booking_id}/cancel", json={"reason": "Malicious attempt"}, headers=headers_b)
        assert intrude_cancel.status_code in [403, 404]
