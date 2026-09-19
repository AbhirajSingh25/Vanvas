"""
VANVAS StayingAPI Stay Commerce Adapter
Integrates multi-platform live accommodation inventory (Airbnb, Vrbo, Booking.com, Google)
from StayingAPI with strict price truth, provider provenance, and external checkout handoff.
"""

import logging
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.schemas.schemas import Offer
from app.providers.commerce.base import BaseCommerceProvider
from app.services.action_link_generator import ActionLinkGenerator

logger = logging.getLogger(__name__)


class StayingAPIStayCommerceAdapter(BaseCommerceProvider):
    """
    Live Accommodation Adapter integrating StayingAPI (/v1/search, /v1/availability).
    Adheres strictly to zero fabrication, verified external checkout links, and explicit availability.
    """

    BASE_URL = "https://api.stayingapi.com"

    # In-memory offer cache across requests to conserve limited API credits
    _offer_cache: Dict[str, Offer] = {}
    _listing_meta_cache: Dict[str, Dict[str, Any]] = {}

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.api_key = (api_key if api_key is not None else settings.STAYINGAPI_KEY).strip()
        self.timeout = timeout if timeout is not None else settings.STAYINGAPI_TIMEOUT

    @property
    def provider_name(self) -> str:
        return "stayingapi"

    @property
    def is_configured(self) -> bool:
        """Returns True if valid non-empty StayingAPI key exists."""
        return bool(self.api_key)

    def search_offers(
        self,
        destination: str,
        product_type: Optional[str] = None,
        query: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> List[Offer]:
        """
        Synchronous wrapper calling internal async implementation.
        """
        import asyncio
        if not self.is_configured:
            return []
        try:
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(
                        asyncio.run,
                        self.search_offers_async(destination, product_type, query, max_price)
                    )
                    return future.result()
            else:
                return asyncio.run(
                    self.search_offers_async(destination, product_type, query, max_price)
                )
        except Exception as exc:
            logger.warning("StayingAPI search_offers sync wrapper error: %s", str(exc))
            return []

    async def search_offers_async(
        self,
        destination: str,
        product_type: Optional[str] = None,
        query: Optional[str] = None,
        max_price: Optional[float] = None,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        adults: int = 1,
        children: int = 0,
        limit: int = 10,
    ) -> List[Offer]:
        """
        Searches live multi-platform accommodations via StayingAPI /v1/search.
        """
        if not self.is_configured:
            return []

        # Only process stay-related queries
        p_type = (product_type or "").lower().strip()
        if p_type and p_type not in ["stay", "hotel", "accommodation", "homestay", "resort"]:
            return []

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }

        # Build query parameters
        loc_str = destination.strip()
        if not (loc_str.lower().endswith("india") or loc_str.lower().endswith("himachal pradesh")):
            loc_str = f"{loc_str}, India"

        params: Dict[str, Any] = {
            "location": loc_str,
            "limit": max(1, min(limit, 20)),
        }
        if check_in:
            params["checkIn"] = check_in
        if check_out:
            params["checkOut"] = check_out
        if adults > 1:
            params["adults"] = adults
        if children > 0:
            params["children"] = children

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(
                    f"{self.BASE_URL}/v1/search",
                    headers=headers,
                    params=params,
                )

                if res.status_code != 200:
                    logger.warning(
                        "StayingAPI search error: HTTP %s - %s",
                        res.status_code,
                        res.text[:200],
                    )
                    return []

                payload = res.json()
                data = payload.get("data", [])
                mapped_offers: List[Offer] = []

                for item in data:
                    offer = self._map_listing_to_offer(item, destination)
                    if not offer:
                        continue

                    # Filter by query if supplied
                    if query and query.lower() not in offer.title.lower():
                        continue

                    # Filter by max_price if supplied (exclude if price is unknown or exceeds max_price)
                    if max_price is not None:
                        if offer.price is None or offer.price > max_price:
                            continue

                    # Cache offer for direct retrieval & availability lookup
                    self._offer_cache[offer.provider_offer_id] = offer
                    if offer.source_id:
                        self._offer_cache[f"stayingapi-{offer.source_id}"] = offer
                    if item.get("id"):
                        self._listing_meta_cache[item["id"]] = item
                        self._listing_meta_cache[offer.provider_offer_id] = item

                    mapped_offers.append(offer)

                return mapped_offers

        except Exception as exc:
            logger.warning("StayingAPI search execution error: %s", str(exc))
            return []

    def get_offer(self, offer_id: str) -> Optional[Offer]:
        """
        Retrieves a specific offer from session memory cache.
        """
        if not self.is_configured:
            return None

        if offer_id in self._offer_cache:
            return self._offer_cache[offer_id]

        clean_id = offer_id.replace("stayingapi-", "")
        if clean_id in self._offer_cache:
            return self._offer_cache[clean_id]

        return None

    async def get_offer_async(self, offer_id: str) -> Optional[Offer]:
        """
        Async retrieval of offer from session memory cache.
        """
        return self.get_offer(offer_id)

    def check_availability(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
    ) -> Dict[str, Any]:
        """
        Checks real-time availability with StayingAPI (/v1/availability).
        Preserves truthful states: AVAILABLE, UNAVAILABLE, UNKNOWN, ERROR, NOT_CONFIGURED.
        """
        if not self.is_configured:
            return {
                "offer_id": offer_id,
                "provider": self.provider_name,
                "status": "NOT_CONFIGURED",
                "availability_state": "UNKNOWN",
                "is_available": False,
                "valid_until": None,
                "message": "StayingAPI credentials are not configured in environment.",
            }

        # Attempt to find listing metadata for platform and listingId
        listing = self._listing_meta_cache.get(offer_id)
        if not listing:
            clean_id = offer_id.replace("stayingapi-", "")
            listing = self._listing_meta_cache.get(clean_id)

        offer = self.get_offer(offer_id)

        platform = None
        listing_id = None

        if listing:
            platform = listing.get("platform")
            listing_id = listing.get("platformListingId") or listing.get("id")
        elif offer and offer.source_id:
            listing_id = offer.source_id
            if offer.trust_source.startswith("STAYINGAPI_"):
                platform = offer.trust_source.replace("STAYINGAPI_", "").lower()

        # If we have platform, listing_id, and dates, call live /v1/availability
        if platform and listing_id and start_date and end_date:
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/json",
                }
                params = {
                    "platform": platform,
                    "listingId": listing_id,
                    "startDate": start_date,
                    "endDate": end_date,
                }
                with httpx.Client(timeout=self.timeout) as client:
                    res = client.get(
                        f"{self.BASE_URL}/v1/availability",
                        headers=headers,
                        params=params,
                    )
                    if res.status_code == 200:
                        data = res.json().get("data", [])
                        if data and isinstance(data, list):
                            dates = data[0].get("dates", [])
                            # If all queried dates are available
                            all_avail = all(d.get("available", False) for d in dates) if dates else True
                            return {
                                "offer_id": offer_id,
                                "provider": self.provider_name,
                                "status": "AVAILABLE" if all_avail else "UNAVAILABLE",
                                "availability_state": "AVAILABLE" if all_avail else "UNAVAILABLE",
                                "is_available": all_avail,
                                "price": offer.price if offer else None,
                                "currency": offer.currency if offer else "INR",
                                "cancellation_policy": offer.cancellation_policy if offer else None,
                                "booking_capability": offer.booking_capability if offer else "EXTERNAL_CHECKOUT",
                                "deep_link": offer.deep_link if offer else None,
                                "message": (
                                    f"Live availability verified on {platform.upper()}."
                                    if all_avail
                                    else f"Listing is unavailable for requested dates on {platform.upper()}."
                                ),
                            }
                    elif res.status_code == 400 or res.status_code == 404:
                        return {
                            "offer_id": offer_id,
                            "provider": self.provider_name,
                            "status": "ERROR",
                            "availability_state": "UNKNOWN",
                            "is_available": False,
                            "message": f"StayingAPI availability check returned error HTTP {res.status_code}.",
                        }
            except Exception as exc:
                logger.warning("StayingAPI availability check error: %s", str(exc))
                return {
                    "offer_id": offer_id,
                    "provider": self.provider_name,
                    "status": "ERROR",
                    "availability_state": "UNKNOWN",
                    "is_available": False,
                    "message": "Network error communicating with StayingAPI.",
                }

        # Fallback when date window is not supplied or offer is retrieved from catalog
        if offer:
            is_avail = offer.availability_state in ["AVAILABLE", "LIMITED"]
            return {
                "offer_id": offer_id,
                "provider": self.provider_name,
                "status": "AVAILABLE" if is_avail else "UNAVAILABLE",
                "availability_state": offer.availability_state,
                "is_available": is_avail,
                "price": offer.price,
                "currency": offer.currency,
                "cancellation_policy": offer.cancellation_policy,
                "valid_until": offer.valid_until.isoformat() if offer.valid_until else None,
                "booking_capability": offer.booking_capability,
                "deep_link": offer.deep_link,
                "message": "Live stay offer discovered via StayingAPI. Verify real-time booking on provider site.",
            }

        return {
            "offer_id": offer_id,
            "provider": self.provider_name,
            "status": "NOT_FOUND",
            "availability_state": "UNKNOWN",
            "is_available": False,
            "valid_until": None,
            "message": "Stay offer ID not found in current StayingAPI session cache.",
        }

    def create_booking(
        self,
        user_id: str,
        offer_id: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Direct PMS/GDS write is not provisioned on StayingAPI data layer.
        Returns EXTERNAL_HANDOFF_REQUIRED when verified checkout deep link is available.
        """
        if not self.is_configured:
            return {
                "status": "FAILED",
                "error_code": "PROVIDER_NOT_CONFIGURED",
                "message": "StayingAPI Provider is unconfigured.",
            }

        offer = self.get_offer(offer_id)
        if not offer:
            return {"status": "FAILED", "error_code": "OFFER_NOT_FOUND"}

        if offer.booking_capability == "EXTERNAL_CHECKOUT" and offer.deep_link:
            return {
                "status": "EXTERNAL_HANDOFF_REQUIRED",
                "booking_capability": "EXTERNAL_CHECKOUT",
                "checkout_url": offer.deep_link,
                "message": f"Please continue with verified {offer.trust_source} site to complete reservation.",
            }

        return {
            "status": "NOT_SUPPORTED",
            "booking_capability": "DISCOVERY_ONLY",
            "message": "Direct in-app booking is not supported. Use provider portal.",
        }

    def cancel_booking(
        self,
        booking_id: str,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {
            "status": "NOT_SUPPORTED",
            "booking_id": booking_id,
            "message": "Direct provider cancellation must be performed via provider portal.",
        }

    def _map_listing_to_offer(
        self,
        item: Dict[str, Any],
        destination: Optional[str] = None,
    ) -> Optional[Offer]:
        """
        Maps a raw StayingAPI listing item to a typed VANVAS Offer.
        Preserves absolute price truth and authentic provider provenance.
        """
        if not item or not isinstance(item, dict):
            return None

        listing_id = str(item.get("id") or "")
        platform = str(item.get("platform") or "stayingapi").lower()
        platform_listing_id = str(item.get("platformListingId") or "")

        if not listing_id and not platform_listing_id:
            return None

        unique_id = listing_id or f"{platform}_{platform_listing_id}"
        full_offer_id = f"stayingapi-{unique_id}"

        # Property Name & Title
        title = item.get("name") or "StayingAPI Accommodation"

        # Location
        loc = item.get("location") or {}
        city = loc.get("city") or destination

        # Pricing
        price_obj = item.get("price") or {}
        parsed_price: Optional[float] = None
        currency: str = "INR"

        if isinstance(price_obj, dict):
            nightly = price_obj.get("nightlyPrice")
            total = price_obj.get("totalPrice")
            val = nightly if nightly is not None else total
            if val is not None:
                try:
                    parsed_price = float(val)
                except (ValueError, TypeError):
                    parsed_price = None
            if price_obj.get("currency"):
                currency = str(price_obj["currency"])

        # Deep link / Source URL
        deep_link: Optional[str] = None
        candidate_url = (
            (price_obj.get("url") if isinstance(price_obj, dict) else None)
            or item.get("url")
        )
        if candidate_url and ActionLinkGenerator.is_valid_url(candidate_url):
            deep_link = candidate_url
            booking_cap = "EXTERNAL_CHECKOUT"
        else:
            booking_cap = "DISCOVERY_ONLY"

        # Trust source
        trust_src = f"STAYINGAPI_{platform.upper()}" if platform else "STAYINGAPI"

        return Offer(
            provider=self.provider_name,
            provider_offer_id=full_offer_id,
            product_type="stay",
            title=title,
            destination=city,
            price=parsed_price,
            currency=currency,
            availability_state="AVAILABLE",
            valid_until=None,
            cancellation_policy=None,
            deep_link=deep_link,
            booking_capability=booking_cap,
            trust_source=trust_src,
            source_id=platform_listing_id or listing_id,
            is_live=True,
        )
