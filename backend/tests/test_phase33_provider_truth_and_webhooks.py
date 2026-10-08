"""
VANVAS Phase 3.3 Provider Truth & Webhook Boundary Hardening Tests
Zero Fake Confirmations: Cryptographic verification, authoritative retrieve confirmation,
strict supported webhook provider registry, amount/currency bindings, idempotency on retry.
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


@pytest.fixture(autouse=True)
def clean_sandbox_state():
    SandboxPaymentGateway.reset_state()
    SandboxStayAdapter.reset_state()
    yield
    SandboxPaymentGateway.reset_state()
    SandboxStayAdapter.reset_state()


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def auth_user_and_headers(db_session):
    test_user = db_session.query(User).filter_by(email="phase33_user@vanvas.com").first()
    if not test_user:
        test_user = User(
            email="phase33_user@vanvas.com",
            full_name="Phase33 Truth Explorer",
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
        title="Phase 3.3 Hardening Expedition",
        num_days=3,
        start_date=date(2026, 11, 10),
        end_date=date(2026, 11, 13),
        status="active",
    )
    db_session.add(trip)
    db_session.commit()
    db_session.refresh(trip)
    return dest, trip


def create_test_checkout_booking(headers, trip_id, offer_id="sbox-manali-riverside-cottage", traveller_name="Phase33 Explorer"):
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
        "traveller_email": "phase33@vanvas.com",
        "traveller_phone": "+919876543210",
        "unit_price": 3800.0,
        "idempotency_key": idem,
    }
    res = client.post("/api/v1/bookings/checkout", json=payload, headers=headers)
    assert res.status_code == 201
    return res.json()


def compute_sandbox_webhook_signature(body_bytes: bytes) -> str:
    secret = "vanvas_sandbox_webhook_secret_2026"
    return hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()


# =========================================================================
# REQUIRED TESTS (PHASE 3.3)
# =========================================================================

def test_reconcile_recovered_provider_reference_requires_retrieve_confirmation(
    auth_user_and_headers, sample_destination_and_trip
):
    """
    Reconciliation must verify recovered provider reference via retrieve_booking before confirming.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id, offer_id="sbox-manali-riverside-cottage")
    booking_id = booking["id"]

    # Initiate payment order
    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    assert pay_init.status_code == 200
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"

    # Capture payment in sandbox gateway
    SandboxPaymentGateway.capture(order_id, payment_id, amount=booking["total_amount"])

    # Reconcile booking state
    res = client.post(f"/api/v1/bookings/{booking_id}/reconcile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["booking"]["status"] == "CONFIRMED"
    assert data["booking"]["payment_status"] == "PAYMENT_SUCCESS"
    assert data["booking"]["confirmation_reference"] is not None
    assert data["booking"]["confirmation_reference"].startswith("SBOX-STAY-")


def test_reconcile_recovered_provider_reference_unknown_not_confirmed(
    auth_user_and_headers, sample_destination_and_trip
):
    """
    If retrieve_booking on recovered reference returns UNKNOWN, do NOT confirm.
    Must remain in CONFIRMING state.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    # Use offer that causes sandbox provider to create reservation with status UNKNOWN
    booking = create_test_checkout_booking(headers, trip.id, offer_id="sbox-manali-retrieve_unknown-cottage")
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    assert pay_init.status_code == 200
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"

    # Capture payment in sandbox gateway
    SandboxPaymentGateway.capture(order_id, payment_id, amount=booking["total_amount"])

    # Reconcile booking state
    res = client.post(f"/api/v1/bookings/{booking_id}/reconcile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    # MUST NOT be CONFIRMED
    assert data["booking"]["status"] != "CONFIRMED"
    assert data["booking"]["status"] == "CONFIRMING"
    assert data["is_terminal"] is False


def test_reconcile_recovered_provider_reference_failed_not_confirmed(
    auth_user_and_headers, sample_destination_and_trip
):
    """
    If retrieve_booking on recovered reference returns FAILED/NOT_FOUND,
    booking transitions to CONFIRMATION_FAILED.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id, offer_id="sbox-manali-retrieve_failed-cottage")
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    assert pay_init.status_code == 200
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"

    # Capture payment in sandbox gateway
    SandboxPaymentGateway.capture(order_id, payment_id, amount=booking["total_amount"])

    # Reconcile booking state
    res = client.post(f"/api/v1/bookings/{booking_id}/reconcile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["booking"]["status"] == "CONFIRMATION_FAILED"
    assert data["booking"]["status"] != "CONFIRMED"


def test_unknown_webhook_provider_rejected(db_session):
    """
    Arbitrary/unsupported webhook providers must be rejected with 400 and explicit message.
    Must not create WebhookEvent or mutate any records.
    """
    events_count_before = db_session.query(WebhookEvent).count()

    payload = json.dumps({"event": "payment.captured", "id": "evt_fake_unsupported"}).encode("utf-8")
    sig = hmac.new(b"secret", payload, hashlib.sha256).hexdigest()

    res = client.post(
        "/api/v1/bookings/webhooks/unsupported_gateway_xyz",
        content=payload,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": sig,
            "X-Event-ID": "evt_fake_unsupported",
        }
    )
    assert res.status_code == 400
    assert "Webhook provider is not configured." in res.json()["detail"]

    # Verify no WebhookEvent was saved
    events_count_after = db_session.query(WebhookEvent).count()
    assert events_count_after == events_count_before


def test_supported_webhook_requires_valid_signature(
    auth_user_and_headers, sample_destination_and_trip
):
    """
    Supported webhook providers must require and cryptographically verify signature.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id)
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"

    body_dict = {
        "event": "payment.captured",
        "id": f"evt_{uuid.uuid4().hex[:12]}",
        "order_id": order_id,
        "payment_id": payment_id,
        "amount": booking["total_amount"],
        "currency": "INR",
    }
    body_bytes = json.dumps(body_dict).encode("utf-8")

    # 1. Missing signature
    res_missing = client.post(
        "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
        content=body_bytes,
        headers={"Content-Type": "application/json"}
    )
    assert res_missing.status_code == 400
    assert "Missing sandbox webhook signature header." in res_missing.json()["detail"]

    # 2. Invalid signature
    res_invalid = client.post(
        "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": "invalid_signature_hex_code",
        }
    )
    assert res_invalid.status_code == 401
    assert "Invalid sandbox webhook signature." in res_invalid.json()["detail"]

    # 3. Valid signature
    valid_sig = compute_sandbox_webhook_signature(body_bytes)
    res_valid = client.post(
        "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": valid_sig,
        }
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["status"] == "success"


def test_webhook_amount_mismatch_rejected(
    auth_user_and_headers, sample_destination_and_trip, db_session
):
    """
    Webhook reporting amount inconsistent with server transaction must be rejected.
    Must not mark payment SUCCESS.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id)
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"

    # Send webhook with forged/mismatched amount (e.g. 100.0 instead of actual booking total)
    mismatched_amount = 100.0
    assert mismatched_amount != booking["total_amount"]

    body_dict = {
        "event": "payment.captured",
        "id": f"evt_mismatch_amt_{uuid.uuid4().hex[:8]}",
        "order_id": order_id,
        "payment_id": payment_id,
        "amount": mismatched_amount,
        "currency": "INR",
    }
    body_bytes = json.dumps(body_dict).encode("utf-8")
    sig = compute_sandbox_webhook_signature(body_bytes)

    res = client.post(
        "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": sig,
        }
    )
    assert res.status_code == 400
    assert "Webhook amount mismatch" in res.json()["detail"]

    # Ensure transaction did not become SUCCESS
    tx = db_session.query(PaymentTransaction).filter(PaymentTransaction.gateway_order_id == order_id).first()
    assert tx.status != "SUCCESS"

    # Ensure booking did not become CONFIRMED
    b_res = client.get(f"/api/v1/bookings/{booking_id}", headers=headers)
    assert b_res.json()["status"] != "CONFIRMED"


def test_webhook_currency_mismatch_rejected(
    auth_user_and_headers, sample_destination_and_trip, db_session
):
    """
    Webhook reporting currency inconsistent with server transaction must be rejected.
    Must not mark payment SUCCESS.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id)
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"

    # Send webhook with mismatched currency (e.g. USD instead of INR)
    body_dict = {
        "event": "payment.captured",
        "id": f"evt_mismatch_curr_{uuid.uuid4().hex[:8]}",
        "order_id": order_id,
        "payment_id": payment_id,
        "amount": booking["total_amount"],
        "currency": "USD",
    }
    body_bytes = json.dumps(body_dict).encode("utf-8")
    sig = compute_sandbox_webhook_signature(body_bytes)

    res = client.post(
        "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": sig,
        }
    )
    assert res.status_code == 400
    assert "Webhook currency mismatch" in res.json()["detail"]

    # Ensure transaction did not become SUCCESS
    tx = db_session.query(PaymentTransaction).filter(PaymentTransaction.gateway_order_id == order_id).first()
    assert tx.status != "SUCCESS"


def test_webhook_order_mismatch_rejected(
    auth_user_and_headers, sample_destination_and_trip, db_session
):
    """
    Webhook with order_id that does not match server transaction must be rejected.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id)
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"

    # Associate gateway_payment_id on tx so payment_id lookup finds the transaction,
    # but the webhook provides a mismatched order_id
    tx = db_session.query(PaymentTransaction).filter(PaymentTransaction.gateway_order_id == order_id).first()
    tx.gateway_payment_id = payment_id
    db_session.commit()

    body_dict = {
        "event": "payment.captured",
        "id": f"evt_order_mismatch_{uuid.uuid4().hex[:8]}",
        "order_id": "order_mismatched_forged_9999",
        "payment_id": payment_id,
        "amount": booking["total_amount"],
        "currency": "INR",
    }
    body_bytes = json.dumps(body_dict).encode("utf-8")
    sig = compute_sandbox_webhook_signature(body_bytes)

    res = client.post(
        "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": sig,
        }
    )
    assert res.status_code == 400
    assert "Webhook order mismatch with transaction." in res.json()["detail"]

    # Ensure transaction did not become SUCCESS
    db_session.refresh(tx)
    assert tx.status != "SUCCESS"


def test_unknown_webhook_event_does_not_mutate_booking(
    auth_user_and_headers, sample_destination_and_trip, db_session
):
    """
    Unknown webhook events (e.g. unknown.event) must be safely acknowledged without mutating booking or payment state.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id)
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    order_id = pay_init.json()["order_id"]

    body_dict = {
        "event": "unknown.marketing.tracking_event",
        "id": f"evt_unknown_{uuid.uuid4().hex[:8]}",
        "order_id": order_id,
        "amount": booking["total_amount"],
    }
    body_bytes = json.dumps(body_dict).encode("utf-8")
    sig = compute_sandbox_webhook_signature(body_bytes)

    res = client.post(
        "/api/v1/bookings/webhooks/vanvas_pay_sandbox",
        content=body_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Webhook-Signature": sig,
        }
    )
    assert res.status_code == 200
    assert res.json()["status"] == "ignored"

    # Verify transaction and booking remain unchanged
    tx = db_session.query(PaymentTransaction).filter(PaymentTransaction.gateway_order_id == order_id).first()
    assert tx.status == "INITIATED"

    b_res = client.get(f"/api/v1/bookings/{booking_id}", headers=headers)
    assert b_res.json()["status"] == "PAYMENT_PROCESSING"
    assert b_res.json()["status"] != "CONFIRMED"


def test_reconciliation_provider_retry_is_idempotent(
    auth_user_and_headers, sample_destination_and_trip
):
    """
    When reconciliation retries provider.create_booking(), it must reuse the idempotency key,
    ensuring exactly one external reservation is created.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id)
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"

    SandboxPaymentGateway.capture(order_id, payment_id, amount=booking["total_amount"])

    # First reconciliation
    res1 = client.post(f"/api/v1/bookings/{booking_id}/reconcile", headers=headers)
    assert res1.status_code == 200
    ref1 = res1.json()["booking"]["confirmation_reference"]
    assert ref1 is not None

    # Second reconciliation (retry)
    res2 = client.post(f"/api/v1/bookings/{booking_id}/reconcile", headers=headers)
    assert res2.status_code == 200
    ref2 = res2.json()["booking"]["confirmation_reference"]

    # Must be exact same provider reference
    assert ref1 == ref2
    assert res2.json()["booking"]["status"] == "CONFIRMED"


def test_provider_create_success_but_retrieve_unknown(
    auth_user_and_headers, sample_destination_and_trip
):
    """
    Payment verify flow: Provider create_booking returns a reference, but retrieve_booking returns UNKNOWN.
    Booking must remain in CONFIRMING, NOT CONFIRMED.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id, offer_id="sbox-manali-retrieve_unknown-cottage")
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"
    sig = SandboxPaymentGateway.generate_signature(order_id, payment_id)

    res = client.post(
        f"/api/v1/bookings/{booking_id}/verify-payment",
        json={
            "gateway_order_id": order_id,
            "gateway_payment_id": payment_id,
            "gateway_signature": sig,
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["booking"]["status"] == "CONFIRMING"
    assert data["booking"]["status"] != "CONFIRMED"


def test_provider_create_success_and_retrieve_confirmed(
    auth_user_and_headers, sample_destination_and_trip
):
    """
    Payment verify flow: Provider create_booking returns reference AND retrieve_booking returns CONFIRMED.
    Booking successfully transitions to CONFIRMED.
    """
    _, headers = auth_user_and_headers
    _, trip = sample_destination_and_trip
    booking = create_test_checkout_booking(headers, trip.id, offer_id="sbox-manali-riverside-cottage")
    booking_id = booking["id"]

    pay_init = client.post(f"/api/v1/bookings/{booking_id}/pay", json={"payment_gateway": "vanvas_pay_sandbox"}, headers=headers)
    order_id = pay_init.json()["order_id"]
    payment_id = f"pay_{order_id}"
    sig = SandboxPaymentGateway.generate_signature(order_id, payment_id)

    res = client.post(
        f"/api/v1/bookings/{booking_id}/verify-payment",
        json={
            "gateway_order_id": order_id,
            "gateway_payment_id": payment_id,
            "gateway_signature": sig,
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["booking"]["status"] == "CONFIRMED"
    assert data["booking"]["confirmation_reference"] is not None
