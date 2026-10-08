"""
VANVAS Sandbox Stay Commerce Adapter
Provides a fully deterministic, realistic sandbox booking provider for Stays, Hotels, Hostels, and Cottages.
Supports end-to-end execution: search, availability, pricing breakdown, reservation creation, retrieval, cancellation, and refund simulation.
Only activated when PROVIDER_ENV=sandbox or in explicit development/test configuration.
Fails closed: never returns optimistic fallback confirmations for unknown bookings.
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from app.schemas.schemas import Offer
from app.providers.commerce.base import BookingProvider

logger = logging.getLogger("vanvas.providers.sandbox_stay")

# In-memory durable store for sandbox reservations during server lifecycle
_SANDBOX_RESERVATIONS: Dict[str, Dict[str, Any]] = {}


class SandboxStayAdapter(BookingProvider):
    """
    Realistic Sandbox Provider for Travel Commerce Transactions.
    Fails closed: Unknown provider reference returns NOT_FOUND, never CONFIRMED.
    """

    def __init__(self, is_sandbox_mode: bool = True):
        self._is_sandbox = is_sandbox_mode

    @classmethod
    def reset_state(cls):
        """Clears in-memory reservations for testing."""
        _SANDBOX_RESERVATIONS.clear()

    @property
    def provider_name(self) -> str:
        return "sandbox_stay"

    @property
    def is_configured(self) -> bool:
        return True

    @property
    def is_sandbox(self) -> bool:
        return self._is_sandbox

    def search(
        self,
        destination: str,
        product_type: Optional[str] = None,
        query: Optional[str] = None,
        max_price: Optional[float] = None,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        guests: int = 1,
    ) -> List[Offer]:
        dest_clean = (destination or "Himalayas").title()
        offers = [
            Offer(
                provider=self.provider_name,
                provider_offer_id=f"sbox-{dest_clean.lower()}-riverside-cottage",
                product_type="stay",
                title=f"Riverside Alpine Cottage — {dest_clean}",
                destination=dest_clean,
                price=3800.0,
                currency="INR",
                availability_state="AVAILABLE",
                cancellation_policy="Free cancellation up to 48 hours before check-in. 100% refundable.",
                booking_capability="IN_APP_BOOKING",
                trust_source="VANVAS_SANDBOX_VERIFIED",
                is_live=True,
            ),
            Offer(
                provider=self.provider_name,
                provider_offer_id=f"sbox-{dest_clean.lower()}-heritage-homestay",
                product_type="stay",
                title=f"Cedar Forest Heritage Homestay — {dest_clean}",
                destination=dest_clean,
                price=2600.0,
                currency="INR",
                availability_state="AVAILABLE",
                cancellation_policy="Free cancellation up to 24 hours before check-in. 100% refundable.",
                booking_capability="IN_APP_BOOKING",
                trust_source="VANVAS_SANDBOX_VERIFIED",
                is_live=True,
            ),
            Offer(
                provider=self.provider_name,
                provider_offer_id=f"sbox-{dest_clean.lower()}-backpacker-hostel",
                product_type="stay",
                title=f"Mountain View Hostel Dorm — {dest_clean}",
                destination=dest_clean,
                price=950.0,
                currency="INR",
                availability_state="AVAILABLE",
                cancellation_policy="Non-refundable rate.",
                booking_capability="IN_APP_BOOKING",
                trust_source="VANVAS_SANDBOX_VERIFIED",
                is_live=True,
            ),
        ]
        if max_price is not None:
            offers = [o for o in offers if o.price is not None and o.price <= max_price]
        return offers

    def availability(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
    ) -> Dict[str, Any]:
        """
        Deterministic availability checker.
        Special offer ID containing 'unavailable' or 'soldout' returns UNAVAILABLE.
        """
        if "unavailable" in offer_id.lower() or "soldout" in offer_id.lower():
            return {
                "available": False,
                "state": "UNAVAILABLE",
                "remaining_units": 0,
                "message": "No rooms available for the selected dates and occupancy.",
            }

        return {
            "available": True,
            "state": "AVAILABLE",
            "remaining_units": 4,
            "offer_id": offer_id,
            "message": "Instant booking confirmation available.",
            "instant_confirmation": True,
        }

    def pricing(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
        rooms: int = 1,
    ) -> Dict[str, Any]:
        """
        Authoritative pricing revalidation.
        Derives nights, base rate, GST (12%), and Vanvas platform service fee (2%).
        """
        base_unit = 3500.0
        if "hostel" in offer_id.lower() or "dorm" in offer_id.lower():
            base_unit = 950.0
        elif "homestay" in offer_id.lower():
            base_unit = 2600.0
        elif "luxury" in offer_id.lower() or "resort" in offer_id.lower():
            base_unit = 6800.0

        nights = 1
        if start_date and end_date:
            try:
                d1 = datetime.fromisoformat(start_date.split("T")[0])
                d2 = datetime.fromisoformat(end_date.split("T")[0])
                diff = (d2 - d1).days
                nights = max(1, diff)
            except Exception:
                nights = 1

        total_base = round(base_unit * nights * max(1, rooms), 2)
        taxes = round(total_base * 0.12, 2)  # 12% GST
        fees = round(total_base * 0.02, 2)   # 2% Convenience fee
        total_amount = round(total_base + taxes + fees, 2)

        is_non_refundable = "non-refundable" in offer_id.lower() or "hostel" in offer_id.lower()

        return {
            "provider": self.provider_name,
            "offer_id": offer_id,
            "nights": nights,
            "rooms": rooms,
            "guests": guests,
            "unit_price_per_night": base_unit,
            "base_amount": total_base,
            "taxes": taxes,
            "tax_breakdown": [{"label": "GST (12%)", "amount": taxes}],
            "fees": fees,
            "fee_breakdown": [{"label": "Vanvas Protection & Service Fee (2%)", "amount": fees}],
            "total_amount": total_amount,
            "currency": "INR",
            "refundable": not is_non_refundable,
            "cancellation_policy": (
                "Non-refundable after booking confirmation."
                if is_non_refundable
                else "Free cancellation up to 48 hours before check-in with 100% refund."
            ),
        }

    def create_booking(
        self,
        user_id: str,
        offer_id: str,
        payload: Dict[str, Any],
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Creates reservation with upstream provider.
        Fails deterministically if offer_id, traveller_name or payload flags provider failure.
        """
        # Check idempotency in sandbox store
        if idempotency_key and idempotency_key in _SANDBOX_RESERVATIONS:
            return _SANDBOX_RESERVATIONS[idempotency_key]

        # Model deterministic BOOKING_FAILURE scenario
        t_name = str(payload.get("traveller_name", "")).lower()
        if (
            ("fail" in offer_id.lower() and "retrieve_fail" not in offer_id.lower() and "retrieve_failed" not in offer_id.lower() and "prov_failed" not in offer_id.lower())
            or ("prov_fail" in offer_id.lower() and "retrieve_fail" not in offer_id.lower() and "retrieve_failed" not in offer_id.lower())
            or "provider_fail" in offer_id.lower()
            or "fail_booking" in offer_id.lower()
            or ("fail" in t_name and "retrieve_fail" not in t_name and "retrieve_failed" not in t_name)
            or "prov_fail" in t_name
        ):
            logger.error(f"Sandbox provider reservation intentionally failed for offer_id={offer_id}")
            raise RuntimeError("Provider inventory allocation failed: Allotment locked by upstream supplier.")

        status = "CONFIRMED"
        if (
            payload.get("retrieve_status") == "UNKNOWN"
            or "retrieve_unknown" in offer_id.lower()
            or "prov_unknown" in offer_id.lower()
            or "unknown_retrieve" in offer_id.lower()
            or "retrieve_unknown" in t_name
        ):
            status = "UNKNOWN"
        elif (
            payload.get("retrieve_status") == "FAILED"
            or "retrieve_failed" in offer_id.lower()
            or "retrieve_fail" in offer_id.lower()
            or "prov_failed" in offer_id.lower()
            or "retrieve_failed" in t_name
            or "retrieve_fail" in t_name
        ):
            status = "FAILED"

        provider_ref = f"SBOX-STAY-{uuid.uuid4().hex[:8].upper()}"
        res_data = {
            "provider": self.provider_name,
            "provider_booking_id": provider_ref,
            "status": status,
            "offer_id": offer_id,
            "user_id": user_id,
            "traveller_name": payload.get("traveller_name", "Adventurer"),
            "traveller_email": payload.get("traveller_email"),
            "check_in": payload.get("check_in"),
            "check_out": payload.get("check_out"),
            "total_amount": payload.get("total_amount"),
            "currency": payload.get("currency", "INR"),
            "confirmed_at": datetime.now(timezone.utc).isoformat() if status == "CONFIRMED" else None,
            "confirmation_code": provider_ref,
        }

        if idempotency_key:
            _SANDBOX_RESERVATIONS[idempotency_key] = res_data
        _SANDBOX_RESERVATIONS[provider_ref] = res_data

        logger.info(f"Sandbox reservation created: {provider_ref} for {offer_id} (status={status})")
        return res_data

    def retrieve_booking(self, provider_booking_id: str) -> Dict[str, Any]:
        """
        Authoritative retrieval of reservation.
        Strictly fails closed: Unknown IDs return NOT_FOUND or UNKNOWN, NEVER optimistic CONFIRMED.
        """
        if not provider_booking_id:
            return {
                "provider": self.provider_name,
                "provider_booking_id": None,
                "status": "NOT_FOUND",
                "message": "Empty provider reference",
            }

        if provider_booking_id in _SANDBOX_RESERVATIONS:
            return _SANDBOX_RESERVATIONS[provider_booking_id]

        p_lower = provider_booking_id.lower()
        if "unknown" in p_lower:
            return {
                "provider": self.provider_name,
                "provider_booking_id": provider_booking_id,
                "status": "UNKNOWN",
                "message": f"Reservation {provider_booking_id} status is UNKNOWN in sandbox provider.",
            }

        if "fail" in p_lower or "reject" in p_lower:
            return {
                "provider": self.provider_name,
                "provider_booking_id": provider_booking_id,
                "status": "FAILED",
                "message": f"Reservation {provider_booking_id} failed in sandbox provider.",
            }

        logger.warning(f"Sandbox reservation not found for reference: {provider_booking_id}")
        return {
            "provider": self.provider_name,
            "provider_booking_id": provider_booking_id,
            "status": "NOT_FOUND",
            "message": f"Reservation {provider_booking_id} does not exist in sandbox provider.",
        }

    def cancel_booking(self, provider_booking_id: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Cancels reservation with provider.
        Models deterministic CANCELLATION_FAILURE if reference contains 'cant_cancel' or 'cancel_fail'.
        """
        if "cant_cancel" in provider_booking_id.lower() or "cancel_fail" in provider_booking_id.lower():
            logger.error(f"Sandbox provider cancellation rejected for {provider_booking_id}")
            raise RuntimeError("Provider cancellation rejected: Non-refundable rate lock.")

        res = _SANDBOX_RESERVATIONS.get(provider_booking_id, {})
        res["status"] = "CANCELLED"
        res["cancelled_at"] = datetime.now(timezone.utc).isoformat()
        res["cancellation_reason"] = reason or "Cancelled by user"
        _SANDBOX_RESERVATIONS[provider_booking_id] = res

        return {
            "provider": self.provider_name,
            "provider_booking_id": provider_booking_id,
            "status": "CANCELLED",
            "cancellation_fee": 0.0,
            "refund_eligible": True,
            "refund_amount": res.get("total_amount", 0.0),
        }

    def refund_status(self, provider_booking_id: str) -> Dict[str, Any]:
        """
        Queries refund status for reservation.
        Supports REFUND_PENDING vs REFUND_COMPLETE scenarios.
        """
        res = _SANDBOX_RESERVATIONS.get(provider_booking_id, {})
        if "refund_pending" in provider_booking_id.lower():
            return {
                "provider": self.provider_name,
                "provider_booking_id": provider_booking_id,
                "refund_status": "PENDING",
                "status": "REFUND_PENDING",
                "refund_amount": res.get("total_amount", 0.0),
            }

        return {
            "provider": self.provider_name,
            "provider_booking_id": provider_booking_id,
            "refund_status": "COMPLETED",
            "status": "REFUNDED",
            "refund_amount": res.get("total_amount", 0.0),
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }
