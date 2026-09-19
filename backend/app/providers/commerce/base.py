"""
VANVAS Travel Commerce Provider Abstraction
Defines the provider-neutral interface for search, offers, availability, and booking lifecycle.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.schemas import Offer


class BaseCommerceProvider(ABC):

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def search_offers(
        self,
        destination: str,
        product_type: Optional[str] = None,
        query: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> List[Offer]:
        """Searches for verified offers or discovery entities."""
        pass

    @abstractmethod
    def get_offer(self, offer_id: str) -> Optional[Offer]:
        """Fetches a specific offer."""
        pass

    @abstractmethod
    def check_availability(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
    ) -> Dict[str, Any]:
        """
        Checks real-time availability.
        Returns explicit UNKNOWN or UNAVAILABLE states when live booking is unsupported.
        """
        pass

    @abstractmethod
    def create_booking(
        self,
        user_id: str,
        offer_id: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Creates or initiates a booking.
        Returns explicit NOT_SUPPORTED / EXTERNAL_HANDOFF when live direct PMS/GDS is not attached.
        """
        pass

    @abstractmethod
    def cancel_booking(
        self,
        booking_id: str,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cancels a booking."""
        pass
