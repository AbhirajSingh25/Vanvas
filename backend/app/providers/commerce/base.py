"""
VANVAS Travel Commerce Provider Abstraction
Defines the provider-neutral interface for search, offers, availability, pricing, and booking lifecycle.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.schemas import Offer


class BookingProvider(ABC):
    """
    Authoritative provider interface for travel commerce execution (stays, transport, activities).
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    def is_configured(self) -> bool:
        """Returns True if required credentials exist in environment."""
        return True

    @property
    def is_sandbox(self) -> bool:
        """Returns True if running in sandbox/testing mode."""
        return False

    @abstractmethod
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
        """Searches for verified offers or discovery entities."""
        pass

    @abstractmethod
    def availability(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
    ) -> Dict[str, Any]:
        """
        Checks real-time availability.
        Returns explicit UNKNOWN, AVAILABLE, or UNAVAILABLE states.
        """
        pass

    @abstractmethod
    def pricing(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
        rooms: int = 1,
    ) -> Dict[str, Any]:
        """
        Authoritative price revalidation.
        Calculates exact base_amount, taxes, fees, total_amount, currency, and cancellation policy.
        """
        pass

    @abstractmethod
    def create_booking(
        self,
        user_id: str,
        offer_id: str,
        payload: Dict[str, Any],
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Creates a booking reservation with the upstream provider.
        """
        pass

    @abstractmethod
    def retrieve_booking(
        self,
        provider_booking_id: str,
    ) -> Dict[str, Any]:
        """Retrieves booking reservation status from upstream provider."""
        pass

    @abstractmethod
    def cancel_booking(
        self,
        provider_booking_id: str,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cancels a booking reservation with upstream provider."""
        pass

    @abstractmethod
    def refund_status(
        self,
        provider_booking_id: str,
    ) -> Dict[str, Any]:
        """Retrieves refund status from upstream provider."""
        pass


class BaseCommerceProvider(BookingProvider):
    """
    Backward-compatible alias for existing commerce providers.
    """

    def search_offers(
        self,
        destination: str,
        product_type: Optional[str] = None,
        query: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> List[Offer]:
        return self.search(destination=destination, product_type=product_type, query=query, max_price=max_price)

    def get_offer(self, offer_id: str) -> Optional[Offer]:
        return None

    def check_availability(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
    ) -> Dict[str, Any]:
        return self.availability(offer_id=offer_id, start_date=start_date, end_date=end_date, guests=guests)

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
        return []

    def availability(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
    ) -> Dict[str, Any]:
        return {"available": False, "state": "UNKNOWN", "message": "Availability not checked"}

    def pricing(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
        rooms: int = 1,
    ) -> Dict[str, Any]:
        return {
            "base_amount": 0.0,
            "taxes": 0.0,
            "fees": 0.0,
            "total_amount": 0.0,
            "currency": "INR",
            "refundable": True,
            "cancellation_policy": "Standard policy",
        }

    def retrieve_booking(self, provider_booking_id: str) -> Dict[str, Any]:
        return {"status": "UNKNOWN", "provider_booking_id": provider_booking_id}

    def refund_status(self, provider_booking_id: str) -> Dict[str, Any]:
        return {"refund_status": "UNKNOWN", "refund_amount": 0.0}
