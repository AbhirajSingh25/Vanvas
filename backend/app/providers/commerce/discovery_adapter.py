"""
VANVAS Discovery Commerce Adapter
Maps discovered places, curated stays, mobility rentals, and transport options into provider-neutral Offer contracts.

Capabilities:
- DISCOVERY_ONLY: Entity exists in directory / live OSM, but has no verified checkout endpoint.
- EXTERNAL_CHECKOUT: Entity has a validated external provider reservation link ("Continue with Provider").
- IN_APP_BOOKING: (Future) Direct in-app PMS/GDS API integration.
- UNAVAILABLE: Entity is explicitly marked closed or inventory exhausted.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Place, Hotel, RentalOption, TransportOption, Destination
from app.schemas.schemas import Offer
from app.providers.commerce.base import BaseCommerceProvider
from app.services.action_link_generator import is_valid_url


class DiscoveryCommerceAdapter(BaseCommerceProvider):

    def __init__(self, db: Session):
        self.db = db

    @property
    def provider_name(self) -> str:
        return "vanvas_discovery_adapter"

    async def search(
        self,
        destination: str,
        product_type: Optional[str] = None,
        query: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> List[Offer]:
        """Async alias for search_offers."""
        return self.search_offers(destination, product_type, query, max_price)

    def search_offers(
        self,
        destination: str,
        product_type: Optional[str] = None,
        query: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> List[Offer]:
        dest_slug = destination.strip().lower()
        dest = self.db.query(Destination).filter(
            (Destination.slug == dest_slug) | (Destination.name.ilike(dest_slug))
        ).first()
        dest_id = dest.id if dest else dest_slug
        dest_name = dest.name if dest else destination

        offers: List[Offer] = []
        p_type = (product_type or "").lower().strip()

        # 1. Hotels / Stays
        if not p_type or p_type in ["stay", "hotel", "accommodation"]:
            h_q = self.db.query(Hotel).filter(Hotel.destination_id == dest_id)
            if query:
                h_q = h_q.filter(Hotel.name.ilike(f"%{query}%"))
            if max_price is not None:
                h_q = h_q.filter(Hotel.price_per_night <= max_price)
            for h in h_q.all():
                cap = "EXTERNAL_CHECKOUT" if is_valid_url(h.booking_url) else "DISCOVERY_ONLY"
                offers.append(Offer(
                    provider="vanvas_curated_stays",
                    provider_offer_id=h.id,
                    product_type="stay",
                    title=h.name,
                    destination=dest_name,
                    price=h.price_per_night,
                    currency="INR",
                    availability_state="UNKNOWN",
                    cancellation_policy="Refer to provider checkout terms",
                    deep_link=h.booking_url if is_valid_url(h.booking_url) else None,
                    booking_capability=cap,
                    trust_source="VANVAS_CURATED",
                    source_id=h.id,
                    is_live=False,
                ))

        # 2. Mobility & Rentals
        if not p_type or p_type in ["rental", "vehicle", "scooter", "cab"]:
            r_q = self.db.query(RentalOption).filter(RentalOption.destination_id == dest_id)
            if query:
                r_q = r_q.filter(RentalOption.vehicle_type.ilike(f"%{query}%") | RentalOption.provider_name.ilike(f"%{query}%"))
            if max_price is not None:
                r_q = r_q.filter(RentalOption.price_per_day <= max_price)
            for r in r_q.all():
                offers.append(Offer(
                    provider=r.provider_name or "vanvas_curated_rentals",
                    provider_offer_id=r.id,
                    product_type="rental",
                    title=f"{r.vehicle_type} ({r.provider_name})",
                    destination=dest_name,
                    price=r.price_per_day,
                    currency="INR",
                    availability_state="UNKNOWN",
                    cancellation_policy="Flexible on-site deposit terms",
                    deep_link=None,
                    booking_capability="DISCOVERY_ONLY",
                    trust_source="VANVAS_CURATED",
                    source_id=r.id,
                    is_live=False,
                ))

        # 3. Transport Options
        if not p_type or p_type in ["transport", "bus", "train", "flight"]:
            t_q = self.db.query(TransportOption).filter(TransportOption.destination_id == dest_id)
            if query:
                t_q = t_q.filter(TransportOption.operator_name.ilike(f"%{query}%") | TransportOption.transport_type.ilike(f"%{query}%"))
            if max_price is not None:
                t_q = t_q.filter(TransportOption.price <= max_price)
            for t in t_q.all():
                cap = "EXTERNAL_CHECKOUT" if is_valid_url(t.booking_url) else "DISCOVERY_ONLY"
                offers.append(Offer(
                    provider=t.operator_name or "vanvas_curated_transport",
                    provider_offer_id=t.id,
                    product_type="transport",
                    title=f"{t.transport_type}: {t.operator_name} ({t.origin_city} -> {dest_name})",
                    destination=dest_name,
                    price=t.price,
                    currency="INR",
                    availability_state="UNKNOWN",
                    cancellation_policy=None,
                    deep_link=t.booking_url if is_valid_url(t.booking_url) else None,
                    booking_capability=cap,
                    trust_source="VANVAS_CURATED",
                    source_id=t.id,
                    is_live=False,
                ))

        # 4. Verified Places (Discovery Only unless explicit ticketing link exists)
        if not p_type or p_type in ["place", "attraction", "experience"]:
            p_q = self.db.query(Place).filter(Place.destination_id == dest_id)
            if query:
                p_q = p_q.filter(Place.name.ilike(f"%{query}%"))
            for p in p_q.limit(10).all():
                cap = "EXTERNAL_CHECKOUT" if is_valid_url(p.booking_url) else "DISCOVERY_ONLY"
                offers.append(Offer(
                    provider="vanvas_curated_places",
                    provider_offer_id=p.id,
                    product_type="place",
                    title=p.name,
                    destination=dest_name,
                    price=p.approx_cost,
                    currency="INR",
                    availability_state="UNKNOWN",
                    cancellation_policy=None,
                    deep_link=p.booking_url if is_valid_url(p.booking_url) else None,
                    booking_capability=cap,
                    trust_source="VANVAS_CURATED",
                    source_id=p.id,
                    is_live=False,
                ))

        return offers

    def get_offer(self, offer_id: str) -> Optional[Offer]:
        # Try Hotel
        h = self.db.query(Hotel).filter(Hotel.id == offer_id).first()
        if h:
            dest = self.db.query(Destination).filter(Destination.id == h.destination_id).first()
            cap = "EXTERNAL_CHECKOUT" if is_valid_url(h.booking_url) else "DISCOVERY_ONLY"
            return Offer(
                provider="vanvas_curated_stays",
                provider_offer_id=h.id,
                product_type="stay",
                title=h.name,
                destination=dest.name if dest else None,
                price=h.price_per_night,
                currency="INR",
                availability_state="UNKNOWN",
                deep_link=h.booking_url if is_valid_url(h.booking_url) else None,
                booking_capability=cap,
                trust_source="VANVAS_CURATED",
                source_id=h.id,
            )

        # Try Place
        p = self.db.query(Place).filter(Place.id == offer_id).first()
        if p:
            dest = self.db.query(Destination).filter(Destination.id == p.destination_id).first()
            cap = "EXTERNAL_CHECKOUT" if is_valid_url(p.booking_url) else "DISCOVERY_ONLY"
            return Offer(
                provider="vanvas_curated_places",
                provider_offer_id=p.id,
                product_type="place",
                title=p.name,
                destination=dest.name if dest else None,
                price=p.approx_cost,
                currency="INR",
                availability_state="UNKNOWN",
                deep_link=p.booking_url if is_valid_url(p.booking_url) else None,
                booking_capability=cap,
                trust_source="VANVAS_CURATED",
                source_id=p.id,
            )

        return None

    def check_availability(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
    ) -> Dict[str, Any]:
        """
        Discovery adapter does not maintain a live inventory engine.
        Returns explicit UNKNOWN availability state.
        """
        offer = self.get_offer(offer_id)
        if not offer:
            return {
                "offer_id": offer_id,
                "status": "NOT_FOUND",
                "availability_state": "UNAVAILABLE",
                "message": "Offer does not exist in verified catalog.",
            }

        return {
            "offer_id": offer_id,
            "status": "DISCOVERY_SUPPORTED",
            "availability_state": "UNKNOWN",
            "booking_capability": offer.booking_capability,
            "deep_link": offer.deep_link,
            "message": (
                "Live real-time inventory is not attached in this tier. "
                f"Booking capability is {offer.booking_capability}."
            ),
        }

    def create_booking(
        self,
        user_id: str,
        offer_id: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Direct PMS/GDS booking is not supported in Discovery Tier.
        Redirects to external checkout handoff when available.
        """
        offer = self.get_offer(offer_id)
        if not offer:
            return {"status": "FAILED", "error_code": "OFFER_NOT_FOUND"}

        if offer.booking_capability == "EXTERNAL_CHECKOUT" and offer.deep_link:
            return {
                "status": "EXTERNAL_HANDOFF_REQUIRED",
                "booking_capability": "EXTERNAL_CHECKOUT",
                "checkout_url": offer.deep_link,
                "message": "Please continue with verified provider site to complete booking.",
            }

        return {
            "status": "NOT_SUPPORTED",
            "booking_capability": "DISCOVERY_ONLY",
            "message": "In-app automated booking is not supported for discovery-only entities.",
        }

    def cancel_booking(
        self,
        booking_id: str,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {
            "status": "NOT_SUPPORTED",
            "booking_id": booking_id,
            "message": "Direct provider cancellation must be performed via external provider.",
        }
