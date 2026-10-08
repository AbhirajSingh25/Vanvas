"""
VANVAS Phase 3.1 Transaction Integrity Hardening Tests
Zero Fake Confirmations: Cryptographic payment verification, provider confirmation authority,
reconciliation against external truth, webhook HMAC & idempotency, state machine hardening.
"""

import hmac
import hashlib
import json
import uuid
import pytest
from datetime import datetime, timezone, date
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.models import Booking, PaymentTransaction, WebhookEvent, User, Trip, Destination
from app.services.booking_service import BookingService
from app.services.payment_service import PaymentService
from app.providers.commerce.sandbox_payment_adapter import SandboxPaymentGateway
from app.providers.commerce.sandbox_stay_adapter import SandboxStayAdapter

client = TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def auth_user_and_headers(db_session):
    test_user = db_session.query(User).filter_by(email="tx_hardening_user@vanvas.com").first()
    if not test_user:
        test_user = User(
            email="tx_hardening_user@vanvas.com",
            full_name="Transaction Hardening Explorer",
            hashed_password="hash",
            role="traveler",
            email_verified_at=datetime.now(timezone.utc),
        )
        db_session.add(test_user)
        db_session.commit()
        db_session.refresh(test_user)

    from app.core.security import create_access_token
    token = create_access_token(subject=test_user.id)
    return test_user, {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user_and_headers(db_session):
    admin_user = db_session.query(User).filter_by(email="tx_admin@vanvas.com").first()
    if not admin_user:
        admin_user = User(
            email="tx_admin@vanvas.com",
            full_name="Transaction Admin",
            hashed_password="hash",
            role="admin",
            email_verified_at=datetime.now(timezone.utc),
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)

    from app.core.security import create_access_token
    token = create_access_token(subject=admin_user.id)
    return admin_user, {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_destination_and_trip(db_session, auth_user_and_headers):
    user, _ = auth_user_and_headers
    dest = db_session.query(Destination).first()
    if not dest:
        dest = Destination(name="Manali", slug="manali", state="Himachal Pradesh", description="Valley of Gods")
        db_session.add(dest)
        db_session.commit()
        db_session.refresh(dest)

    trip = Trip(
        user_id=user.id,
        destination_id=dest.id,
        title="Hardening Expedition",
        num_days=3,
        start_date=date(2026, 11, 10),
        end_date=date(2026, 11, 13),
        status="active",
    )
    db_session.add(trip)
    db_session.commit()
    db_session.refresh(trip)
    return dest, trip


def create_test_checkout_booking(headers, trip_id, offer_id="sbox-manali-riverside-cottage", traveller_name="Hardening Explorer"):
    idem = f"chk_{uuid.uuid4().hex[:8]}"
    payload = {
        "provider_offer_id": offer_id,
        "provider": "sandbox_stay",
        "booking_type": "stay",
        "trip_id": trip_id,
        "title": "Riverside Alpine Cottage",
        "destination": "Manali",
        "check_in": "2026-11-10",
        "check_out": "2026-11-13",
        "guests": 2,
        "rooms": 1,
        "traveller_name": traveller_name,
        "traveller_email": "hardening@vanvas.com",
        "traveller_phone": "+919876543210",
        "unit_price": 3800.0,
        "idempotency_key": idem,
    }
    res = client.post("/api/v1/bookings/checkout", json=payload, headers=headers)
    assert res.status_code == 201
    return res.json()


# =========================================================================
# 1. PAYMENT VERIFICATION TESTS
# =========================================================================

class TestPaymentVerificationIntegrity:

    def test_missing_payment_transaction_rejected(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        # Attempt to verify payment without ever initiating a payment transaction on server
        fake_order_id = f"order_fake_{uuid.uuid4().hex[:10]}"
        fake_payment_id = f"pay_fake_{uuid.uuid4().hex[:10]}"
        sig = SandboxPaymentGateway.generate_signature(fake_order_id, fake_payment_id)

        res = client.post(
            f"/api/v1/bookings/{booking_id}/verify-payment",
            json={
                "gateway_order_id": fake_order_id,
                "gateway_payment_id": fake_payment_id,
                "gateway_signature": sig,
            },
            headers=headers,
        )
        assert res.status_code == 404
        assert "PAYMENT_TRANSACTION_NOT_FOUND" in res.json()["detail"]

        # Ensure booking status did NOT become CONFIRMED
        b_res = client.get(f"/api/v1/bookings/{booking_id}", headers=headers)
        assert b_res.json()["status"] != "CONFIRMED"

    def test_invalid_gateway_signature_rejected(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        # Initiate genuine payment
        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        assert pay_res.status_code == 200
        pay_data = pay_res.json()

        # Submit forged / invalid signature
        res = client.post(
            f"/api/v1/bookings/{booking_id}/verify-payment",
            json={
                "gateway_order_id": pay_data["order_id"],
                "gateway_payment_id": f"pay_{pay_data['order_id']}",
                "gateway_signature": "forged_cryptographic_signature_vanvas",
                "payment_transaction_id": pay_data["payment_transaction_id"],
            },
            headers=headers,
        )
        assert res.status_code == 400
        assert "Invalid payment gateway signature" in res.json()["detail"]

        # Verify booking is not confirmed
        b_res = client.get(f"/api/v1/bookings/{booking_id}", headers=headers)
        assert b_res.json()["status"] != "CONFIRMED"

    def test_missing_gateway_signature_rejected(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data = pay_res.json()

        res = client.post(
            f"/api/v1/bookings/{booking_id}/verify-payment",
            json={
                "gateway_order_id": pay_data["order_id"],
                "gateway_payment_id": f"pay_{pay_data['order_id']}",
                "gateway_signature": "",
                "payment_transaction_id": pay_data["payment_transaction_id"],
            },
            headers=headers,
        )
        assert res.status_code == 400
        assert "Missing payment gateway signature" in res.json()["detail"]

    def test_mismatched_order_rejected(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data = pay_res.json()

        mismatched_order_id = f"order_other_{uuid.uuid4().hex[:8]}"
        payment_id = f"pay_{mismatched_order_id}"
        sig = SandboxPaymentGateway.generate_signature(mismatched_order_id, payment_id)

        res = client.post(
            f"/api/v1/bookings/{booking_id}/verify-payment",
            json={
                "gateway_order_id": mismatched_order_id,
                "gateway_payment_id": payment_id,
                "gateway_signature": sig,
                "payment_transaction_id": pay_data["payment_transaction_id"],
            },
            headers=headers,
        )
        assert res.status_code == 400
        assert "Mismatched gateway order ID" in res.json()["detail"]

    def test_mismatched_booking_rejected(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking1 = create_test_checkout_booking(headers, trip.id)
        booking2 = create_test_checkout_booking(headers, trip.id)

        # Pay for booking 1
        pay_res1 = client.post(f"/api/v1/bookings/{booking1['id']}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data1 = pay_res1.json()

        payment_id = f"pay_{pay_data1['order_id']}"
        sig = SandboxPaymentGateway.generate_signature(pay_data1["order_id"], payment_id)

        # Attempt to verify payment on booking 2 using booking 1's transaction ID
        res = client.post(
            f"/api/v1/bookings/{booking2['id']}/verify-payment",
            json={
                "gateway_order_id": pay_data1["order_id"],
                "gateway_payment_id": payment_id,
                "gateway_signature": sig,
                "payment_transaction_id": pay_data1["payment_transaction_id"],
            },
            headers=headers,
        )
        # Should be rejected because transaction was created for booking 1
        assert res.status_code in (400, 404)

    def test_mismatched_amount_rejected(self, auth_user_and_headers, sample_destination_and_trip, db_session):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data = pay_res.json()

        # Tamper transaction amount in DB
        tx = db_session.query(PaymentTransaction).filter(PaymentTransaction.id == pay_data["payment_transaction_id"]).first()
        tx.amount = 1.0  # Tampered
        db_session.commit()

        payment_id = f"pay_{pay_data['order_id']}"
        sig = SandboxPaymentGateway.generate_signature(pay_data["order_id"], payment_id)

        res = client.post(
            f"/api/v1/bookings/{booking_id}/verify-payment",
            json={
                "gateway_order_id": pay_data["order_id"],
                "gateway_payment_id": payment_id,
                "gateway_signature": sig,
                "payment_transaction_id": pay_data["payment_transaction_id"],
            },
            headers=headers,
        )
        assert res.status_code == 400

    def test_mismatched_currency_rejected(self, auth_user_and_headers, sample_destination_and_trip, db_session):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data = pay_res.json()

        # Tamper currency in DB
        tx = db_session.query(PaymentTransaction).filter(PaymentTransaction.id == pay_data["payment_transaction_id"]).first()
        tx.currency = "USD"
        db_session.commit()

        payment_id = f"pay_{pay_data['order_id']}"
        sig = SandboxPaymentGateway.generate_signature(pay_data["order_id"], payment_id)

        res = client.post(
            f"/api/v1/bookings/{booking_id}/verify-payment",
            json={
                "gateway_order_id": pay_data["order_id"],
                "gateway_payment_id": payment_id,
                "gateway_signature": sig,
                "payment_transaction_id": pay_data["payment_transaction_id"],
            },
            headers=headers,
        )
        assert res.status_code == 400


# =========================================================================
# 2. PROVIDER CONFIRMATION & FAILURE BLOCKING TESTS
# =========================================================================

class TestProviderConfirmationIntegrity:

    def test_provider_failure_does_not_confirm_booking(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        # Offer ID designed to fail provider reservation
        booking_data = create_test_checkout_booking(
            headers, trip.id, offer_id="sbox-prov_fail-cottage", traveller_name="Fail Prov User"
        )
        booking_id = booking_data["id"]

        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        assert pay_res.status_code == 200
        pay_data = pay_res.json()

        payment_id = f"pay_{pay_data['order_id']}"
        sig = SandboxPaymentGateway.generate_signature(pay_data["order_id"], payment_id)

        ver_res = client.post(
            f"/api/v1/bookings/{booking_id}/verify-payment",
            json={
                "gateway_order_id": pay_data["order_id"],
                "gateway_payment_id": payment_id,
                "gateway_signature": sig,
                "payment_transaction_id": pay_data["payment_transaction_id"],
            },
            headers=headers,
        )
        assert ver_res.status_code == 200
        data = ver_res.json()
        assert data["success"] is False
        assert data["booking"]["status"] == "CONFIRMATION_FAILED"
        assert data["booking"]["status"] != "CONFIRMED"

    def test_missing_provider_reference_does_not_confirm_booking(self, db_session, auth_user_and_headers):
        user, _ = auth_user_and_headers
        # Create a booking directly in CONFIRMING state
        booking = Booking(
            user_id=user.id,
            public_booking_reference="VV-2026-TESTREF",
            provider="sandbox_stay",
            booking_type="stay",
            status="CONFIRMING",
            payment_status="PAYMENT_SUCCESS",
            total_amount=5000.0,
            confirmation_reference=None,  # Missing
        )
        db_session.add(booking)
        db_session.commit()

        # Attempt transition to CONFIRMED without provider reference
        with pytest.raises(ValueError) as exc:
            BookingService.transition_booking_status(
                db=db_session,
                booking_id=booking.id,
                target_status="CONFIRMED",
                user=user,
            )
        assert "authoritative provider confirmation reference" in str(exc.value)

    def test_unknown_provider_reference_not_confirmed(self):
        adapter = SandboxStayAdapter()
        res = adapter.retrieve_booking("UNKNOWN-REF-99999")
        assert res["status"] in ("NOT_FOUND", "UNKNOWN")
        assert res["status"] != "CONFIRMED"

    def test_provider_failure_after_successful_payment(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(
            headers, trip.id, offer_id="sbox-prov_fail-error-homestay", traveller_name="Prov Fail Traveller"
        )
        booking_id = booking_data["id"]

        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data = pay_res.json()

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

        b_res = client.get(f"/api/v1/bookings/{booking_id}", headers=headers)
        b_data = b_res.json()
        assert b_data["status"] == "CONFIRMATION_FAILED"
        assert b_data["payment_status"] == "PAYMENT_SUCCESS"


# =========================================================================
# 3. RECONCILIATION TESTS
# =========================================================================

class TestReconciliationAuthoritativeState:

    def test_reconcile_queries_authoritative_state(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        rec_res = client.post(f"/api/v1/bookings/{booking_id}/reconcile", headers=headers)
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert "booking" in rec_data
        assert rec_data["booking"]["id"] == booking_id

    def test_payment_timeout_reconciliation(self, auth_user_and_headers, sample_destination_and_trip, db_session):
        user, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data = pay_res.json()

        # Simulate payment captured on gateway (e.g. user paid but browser tab closed)
        payment_id = f"pay_{pay_data['order_id']}"
        SandboxPaymentGateway.capture(pay_data["order_id"], payment_id, amount=pay_data["amount"])

        # Client reconnects and calls reconcile
        rec_res = client.post(f"/api/v1/bookings/{booking_id}/reconcile", headers=headers)
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert rec_data["booking"]["status"] == "CONFIRMED"
        assert rec_data["booking"]["payment_status"] == "PAYMENT_SUCCESS"

    def test_failed_payment_reconciliation(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data = pay_res.json()

        # Simulate gateway marking payment FAILED
        payment_id = f"pay_{pay_data['order_id']}"
        SandboxPaymentGateway.fail_payment(pay_data["order_id"], payment_id, reason="Card declined")

        # Client calls reconcile
        rec_res = client.post(f"/api/v1/bookings/{booking_id}/reconcile", headers=headers)
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert rec_data["booking"]["status"] == "PAYMENT_FAILED"
        assert rec_data["booking"]["status"] != "CONFIRMED"


# =========================================================================
# 4. WEBHOOK CRYPTOGRAPHIC VALIDATION & IDEMPOTENCY TESTS
# =========================================================================

class TestWebhookSecurityAndIdempotency:

    def test_webhook_invalid_signature_rejected(self):
        payload = json.dumps({"event": "payment.captured", "order_id": "order_123"}).encode("utf-8")
        res = client.post(
            "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
            content=payload,
            headers={"X-Webhook-Signature": "invalid_forged_sig", "Content-Type": "application/json"},
        )
        assert res.status_code == 401
        assert "Invalid sandbox webhook signature" in res.json()["detail"]

    def test_webhook_missing_signature_rejected(self):
        payload = json.dumps({"event": "payment.captured", "order_id": "order_123"}).encode("utf-8")
        res = client.post(
            "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
            content=payload,
            headers={"Content-Type": "application/json"},
        )
        assert res.status_code == 400
        assert "Missing sandbox webhook signature" in res.json()["detail"]

    def test_webhook_duplicate_event_is_idempotent(self):
        secret = "vanvas_sandbox_webhook_secret_2026"
        event_id = f"evt_{uuid.uuid4().hex[:12]}"
        payload_dict = {"event": "payment.captured", "id": event_id, "order_id": f"order_{uuid.uuid4().hex[:8]}"}
        payload_bytes = json.dumps(payload_dict).encode("utf-8")
        sig = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()

        # First call
        res1 = client.post(
            "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
            content=payload_bytes,
            headers={"X-Webhook-Signature": sig, "X-Event-ID": event_id, "Content-Type": "application/json"},
        )
        assert res1.status_code == 200
        assert res1.json()["status"] == "success"

        # Duplicate call with exact same event ID
        res2 = client.post(
            "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
            content=payload_bytes,
            headers={"X-Webhook-Signature": sig, "X-Event-ID": event_id, "Content-Type": "application/json"},
        )
        assert res2.status_code == 200
        assert res2.json()["status"] == "already_processed"

    def test_webhook_processing_failure_is_retryable(self):
        secret = "vanvas_sandbox_webhook_secret_2026"
        event_id = f"evt_fail_{uuid.uuid4().hex[:12]}"
        # Simulate initial transient failure
        payload_fail = json.dumps({"event": "payment.captured", "id": event_id, "simulate_processing_failure": True}).encode("utf-8")
        sig_fail = hmac.new(secret.encode("utf-8"), payload_fail, hashlib.sha256).hexdigest()

        res_fail = client.post(
            "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
            content=payload_fail,
            headers={"X-Webhook-Signature": sig_fail, "X-Event-ID": event_id, "Content-Type": "application/json"},
        )
        assert res_fail.status_code == 500

        # Retry with fixed payload
        payload_retry = json.dumps({"event": "payment.captured", "id": event_id, "simulate_processing_failure": False}).encode("utf-8")
        sig_retry = hmac.new(secret.encode("utf-8"), payload_retry, hashlib.sha256).hexdigest()

        res_retry = client.post(
            "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
            content=payload_retry,
            headers={"X-Webhook-Signature": sig_retry, "X-Event-ID": event_id, "Content-Type": "application/json"},
        )
        assert res_retry.status_code == 200
        assert res_retry.json()["status"] == "success"


# =========================================================================
# 5. STATE MACHINE PRIVILEGE & REFUND SAFETY TESTS
# =========================================================================

class TestStateMachineAndRefundSafety:

    def test_client_cannot_transition_to_confirmed(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        # Client attempts direct POST /transition to CONFIRMED
        res = client.post(
            f"/api/v1/bookings/{booking_id}/transition",
            json={"target_status": "CONFIRMED", "reason": "Client privilege escalation attempt"},
            headers=headers,
        )
        assert res.status_code == 403
        assert "Direct client transition to privileged state 'CONFIRMED' is forbidden" in res.json()["detail"]

    def test_client_cannot_transition_to_refunded(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        # Client attempts direct POST /transition to REFUNDED
        res = client.post(
            f"/api/v1/bookings/{booking_id}/transition",
            json={"target_status": "REFUNDED", "reason": "Client privilege escalation attempt"},
            headers=headers,
        )
        assert res.status_code == 403
        assert "Direct client transition to privileged state 'REFUNDED' is forbidden" in res.json()["detail"]

    def test_refund_requires_provider_confirmation(self, auth_user_and_headers, sample_destination_and_trip):
        _, headers = auth_user_and_headers
        _, trip = sample_destination_and_trip
        booking_data = create_test_checkout_booking(headers, trip.id)
        booking_id = booking_data["id"]

        # Pay & confirm genuine booking
        pay_res = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
        pay_data = pay_res.json()
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

        # Cancel booking
        cancel_res = client.post(
            f"/api/v1/bookings/{booking_id}/cancel",
            json={"reason": "Customer travel cancellation"},
            headers=headers,
        )
        assert cancel_res.status_code == 200
        cancel_data = cancel_res.json()
        assert cancel_data["success"] is True
        assert cancel_data["status"] in ("CANCELLED", "REFUNDED")
        assert cancel_data["refund_amount"] > 0
