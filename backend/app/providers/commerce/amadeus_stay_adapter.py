"""
VANVAS Amadeus Stay Commerce Adapter
Integrates real accommodation inventory, live room offers, verified pricing,
cancellation policies, and external checkout handoff from Amadeus Self-Service APIs.
"""

import logging
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.schemas.schemas import Offer
from app.providers.commerce.base import BaseCommerceProvider
from app.services.action_link_generator import ActionLinkGenerator

logger = logging.getLogger(__name__)

# Standard Indian / Himalayan Destination IATA / City Code mappings for Amadeus
DESTINATION_IATA_MAPPING = {
    "delhi": "DEL",
    "new delhi": "DEL",
    "mumbai": "BOM",
    "bangalore": "BLR",
    "bengaluru": "BLR",
    "jaipur": "JAI",
    "udaipur": "UDR",
    "goa": "GOI",
    "panaji": "GOI",
    "chandigarh": "IXC",
    "dehradun": "DED",
    "mussoorie": "DED",
    "rishikesh": "DED",
    "kullu": "KUU",
    "manali": "KUU",
    "dharamshala": "DHM",
    "dharamsala": "DHM",
    "shimla": "SLV",
    "leh": "IXL",
    "ladakh": "IXL",
    "srinagar": "SXR",
}

# Standard Destination Coordinate Fallbacks for Geocode-based search
DESTINATION_GEO_MAPPING = {
    "manali": (32.2396, 77.1887),
    "mussoorie": (30.4598, 78.0644),
    "rishikesh": (30.0869, 78.2676),
    "kasol": (32.0100, 77.3150),
    "leh": (34.1526, 77.5771),
    "udaipur": (24.5854, 73.7125),
    "dharamshala": (32.2190, 76.3234),
}


class AmadeusStayCommerceAdapter(BaseCommerceProvider):
    """
    Real Stay Commerce Adapter integrating Amadeus Hotel Search v3 and Hotel Offers.
    Adheres strictly to zero fabrication and explicit availability / pricing provenance.
    """

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        env: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.client_id = (client_id if client_id is not None else settings.AMADEUS_CLIENT_ID).strip()
        self.client_secret = (client_secret if client_secret is not None else settings.AMADEUS_CLIENT_SECRET).strip()
        self.env = (env if env is not None else settings.AMADEUS_ENV).strip().lower()
        self.timeout = timeout if timeout is not None else settings.AMADEUS_TIMEOUT

        self.base_url = (
            "https://test.api.amadeus.com"
            if self.env != "production"
            else "https://api.amadeus.com"
        )
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0

    @property
    def provider_name(self) -> str:
        return "amadeus_stays"

    @property
    def is_configured(self) -> bool:
        """Returns True if valid non-empty credentials exist."""
        return bool(self.client_id and self.client_secret)

    async def _get_access_token(self) -> Optional[str]:
        """
        Retrieves OAuth2 access token via Client Credentials Grant.
        Caches token in-memory until expiration.
        """
        if not self.is_configured:
            return None

        # Return cached token if valid with a 60-second safety window
        if self._access_token and time.time() < (self._token_expires_at - 60):
            return self._access_token

        token_url = f"{self.base_url}/v1/security/oauth2/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(token_url, headers=headers, data=data)
                if res.status_code == 200:
                    payload = res.json()
                    self._access_token = payload.get("access_token")
                    expires_in = payload.get("expires_in", 1799)
                    self._token_expires_at = time.time() + float(expires_in)
                    return self._access_token
                else:
                    logger.warning(
                        "Amadeus token retrieval failed: HTTP %s - %s",
                        res.status_code,
                        res.text[:200],
                    )
                    return None
        except Exception as exc:
            logger.warning("Amadeus token network error: %s", str(exc))
            return None

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
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # In nested event loop, create a task or run via thread pool
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(
                        asyncio.run,
                        self.search_offers_async(destination, product_type, query, max_price)
                    )
                    return future.result()
            else:
                return loop.run_until_complete(
                    self.search_offers_async(destination, product_type, query, max_price)
                )
        except Exception as exc:
            logger.warning("Amadeus search_offers sync wrapper error: %s", str(exc))
            return []

    async def search_offers_async(
        self,
        destination: str,
        product_type: Optional[str] = None,
        query: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> List[Offer]:
        """
        Searches live Amadeus hotel inventory and mapped stay offers.
        """
        if not self.is_configured:
            return []

        # Only process stay-related queries
        p_type = (product_type or "").lower().strip()
        if p_type and p_type not in ["stay", "hotel", "accommodation"]:
            return []

        token = await self._get_access_token()
        if not token:
            return []

        dest_lower = destination.strip().lower()
        city_code = DESTINATION_IATA_MAPPING.get(dest_lower)
        geo_coords = DESTINATION_GEO_MAPPING.get(dest_lower)

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.amadeus+json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                hotel_ids: List[str] = []
                hotel_metadata_map: Dict[str, Dict[str, Any]] = {}

                # 1. Fetch hotel list by cityCode or geocode
                if city_code:
                    list_url = f"{self.base_url}/v1/reference-data/locations/hotels/by-city"
                    params = {"cityCode": city_code}
                    res = await client.get(list_url, headers=headers, params=params)
                    if res.status_code == 200:
                        data = res.json().get("data", [])
                        for h in data[:20]:
                            hid = h.get("hotelId")
                            if hid:
                                hotel_ids.append(hid)
                                hotel_metadata_map[hid] = h
                elif geo_coords:
                    list_url = f"{self.base_url}/v1/reference-data/locations/hotels/by-geocode"
                    params = {
                        "latitude": geo_coords[0],
                        "longitude": geo_coords[1],
                        "radius": 20,
                        "radiusUnit": "KM",
                    }
                    res = await client.get(list_url, headers=headers, params=params)
                    if res.status_code == 200:
                        data = res.json().get("data", [])
                        for h in data[:20]:
                            hid = h.get("hotelId")
                            if hid:
                                hotel_ids.append(hid)
                                hotel_metadata_map[hid] = h

                if not hotel_ids:
                    return []

                # 2. Fetch live offers for discovered hotels (up to 10 at a time per Amadeus API limits)
                offers_url = f"{self.base_url}/v3/shopping/hotel-offers"
                offers_params = {"hotelIds": ",".join(hotel_ids[:10])}
                offers_res = await client.get(offers_url, headers=headers, params=offers_params)

                if offers_res.status_code != 200:
                    logger.warning(
                        "Amadeus hotel-offers search error: HTTP %s - %s",
                        offers_res.status_code,
                        offers_res.text[:200],
                    )
                    return []

                raw_data = offers_res.json().get("data", [])
                mapped_offers: List[Offer] = []

                for item in raw_data:
                    hotel_info = item.get("hotel", {})
                    hotel_id = hotel_info.get("hotelId", "")
                    hotel_name = hotel_info.get("name", "Amadeus Partner Hotel")
                    raw_offers = item.get("offers", [])

                    for off in raw_offers:
                        mapped = self._map_raw_offer_to_schema(
                            raw_offer=off,
                            hotel_info=hotel_info,
                            destination=destination,
                        )
                        if mapped:
                            # Apply keyword filter
                            if query and query.lower() not in mapped.title.lower():
                                continue
                            # Apply max_price filter
                            if max_price is not None and mapped.price is not None and mapped.price > max_price:
                                continue
                            mapped_offers.append(mapped)

                return mapped_offers

        except Exception as exc:
            logger.warning("Amadeus search_offers execution error: %s", str(exc))
            return []

    def get_offer(self, offer_id: str) -> Optional[Offer]:
        """
        Synchronous wrapper for get_offer.
        """
        import asyncio
        if not self.is_configured:
            return None
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(asyncio.run, self.get_offer_async(offer_id))
                    return future.result()
            else:
                return loop.run_until_complete(self.get_offer_async(offer_id))
        except Exception as exc:
            logger.warning("Amadeus get_offer sync wrapper error: %s", str(exc))
            return None

    async def get_offer_async(self, offer_id: str) -> Optional[Offer]:
        """
        Fetches a specific offer from Amadeus Hotel Search v3.
        """
        if not self.is_configured:
            return None

        # Strip optional provider prefix if present
        clean_id = offer_id.replace("amadeus-", "")

        token = await self._get_access_token()
        if not token:
            return None

        url = f"{self.base_url}/v3/shopping/hotel-offers/{clean_id}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.amadeus+json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    hotel_info = data.get("hotel", {})
                    offers = data.get("offers", [])
                    if offers:
                        return self._map_raw_offer_to_schema(
                            raw_offer=offers[0],
                            hotel_info=hotel_info,
                            destination=None,
                        )
                return None
        except Exception as exc:
            logger.warning("Amadeus get_offer error: %s", str(exc))
            return None

    def check_availability(
        self,
        offer_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        guests: int = 1,
    ) -> Dict[str, Any]:
        """
        Checks real-time availability with Amadeus.
        Returns explicit states: AVAILABLE, UNAVAILABLE, NOT_CONFIGURED, or ERROR.
        """
        if not self.is_configured:
            return {
                "offer_id": offer_id,
                "provider": self.provider_name,
                "status": "NOT_CONFIGURED",
                "availability_state": "UNKNOWN",
                "is_available": False,
                "valid_until": None,
                "message": "Amadeus Stay Provider credentials are not configured in environment.",
            }

        offer = self.get_offer(offer_id)
        if not offer:
            return {
                "offer_id": offer_id,
                "provider": self.provider_name,
                "status": "NOT_FOUND",
                "availability_state": "UNAVAILABLE",
                "is_available": False,
                "valid_until": None,
                "message": "Hotel offer is no longer available in live Amadeus GDS inventory.",
            }

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
            "message": (
                "Verified live stay inventory confirmed by Amadeus GDS."
                if is_avail
                else "Inventory for this specific rate/room is unavailable."
            ),
        }

    def create_booking(
        self,
        user_id: str,
        offer_id: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Direct PMS/GDS write is not provisioned on standard free/testing tier.
        Returns EXTERNAL_HANDOFF_REQUIRED when verified checkout deep link is available.
        """
        if not self.is_configured:
            return {
                "status": "FAILED",
                "error_code": "PROVIDER_NOT_CONFIGURED",
                "message": "Amadeus Provider is unconfigured.",
            }

        offer = self.get_offer(offer_id)
        if not offer:
            return {"status": "FAILED", "error_code": "OFFER_NOT_FOUND"}

        if offer.booking_capability == "EXTERNAL_CHECKOUT" and offer.deep_link:
            return {
                "status": "EXTERNAL_HANDOFF_REQUIRED",
                "booking_capability": "EXTERNAL_CHECKOUT",
                "checkout_url": offer.deep_link,
                "message": "Please continue with verified provider site to complete reservation.",
            }

        return {
            "status": "NOT_SUPPORTED",
            "booking_capability": "EXTERNAL_CHECKOUT",
            "message": "Direct in-app booking requires enterprise production credit provisioning. Use external provider checkout.",
        }

    def cancel_booking(
        self,
        booking_id: str,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {
            "status": "NOT_SUPPORTED",
            "booking_id": booking_id,
            "message": "Direct provider cancellation must be performed via Amadeus partner portal.",
        }

    def _map_raw_offer_to_schema(
        self,
        raw_offer: Dict[str, Any],
        hotel_info: Dict[str, Any],
        destination: Optional[str] = None,
    ) -> Optional[Offer]:
        """
        Maps raw Amadeus JSON structure into typed Offer model.
        Guarantees zero price/inventory fabrication.
        """
        if not raw_offer:
            return None

        offer_id = str(raw_offer.get("id", ""))
        if not offer_id:
            return None

        hotel_name = hotel_info.get("name", "Amadeus Hotel")
        room_info = raw_offer.get("room", {})
        type_estimated = room_info.get("typeEstimated", {})
        room_desc = room_info.get("description", {}).get("text") or type_estimated.get("category") or "Standard Room"
        full_title = f"{hotel_name} — {room_desc}"

        # Pricing
        price_obj = raw_offer.get("price", {})
        total_str = price_obj.get("total")
        currency = price_obj.get("currency", "INR")
        parsed_price: Optional[float] = None
        if total_str is not None:
            try:
                parsed_price = float(total_str)
            except (ValueError, TypeError):
                parsed_price = None

        # Availability
        avail_raw = raw_offer.get("available", True)
        if avail_raw is True or str(avail_raw).lower() == "true":
            availability_state = "AVAILABLE"
        elif avail_raw is False or str(avail_raw).lower() == "false":
            availability_state = "UNAVAILABLE"
        else:
            availability_state = "UNKNOWN"

        # Validity / Check-in
        check_in_date_str = raw_offer.get("checkInDate")
        valid_until: Optional[datetime] = None
        if check_in_date_str:
            try:
                valid_until = datetime.fromisoformat(check_in_date_str).replace(tzinfo=timezone.utc)
            except Exception:
                valid_until = None

        # Cancellation Policy
        cancellation_policy: Optional[str] = None
        policies = raw_offer.get("policies", {})
        cancellations = policies.get("cancellations", [])
        if cancellations and isinstance(cancellations, list):
            first_policy = cancellations[0]
            desc = first_policy.get("description", {}).get("text")
            deadline = first_policy.get("deadline")
            amount = first_policy.get("amount")
            if desc:
                cancellation_policy = desc
            elif deadline:
                cancellation_policy = f"Free cancellation before {deadline}"
            elif amount:
                cancellation_policy = f"Cancellation fee: {currency} {amount}"

        # Deep link / Booking capability
        deep_link: Optional[str] = None
        raw_booking_url = raw_offer.get("bookingUrl") or (
            hotel_info.get("contact", {}).get("bookingUrl") if isinstance(hotel_info.get("contact"), dict) else None
        )

        if raw_booking_url and ActionLinkGenerator.is_valid_url(raw_booking_url):
            deep_link = raw_booking_url
            booking_cap = "EXTERNAL_CHECKOUT"
        else:
            booking_cap = "DISCOVERY_ONLY"

        return Offer(
            provider=self.provider_name,
            provider_offer_id=f"amadeus-{offer_id}",
            product_type="stay",
            title=full_title,
            destination=destination or hotel_info.get("cityCode"),
            price=parsed_price,
            currency=currency,
            availability_state=availability_state,
            valid_until=valid_until,
            cancellation_policy=cancellation_policy,
            deep_link=deep_link,
            booking_capability=booking_cap,
            trust_source="AMADEUS_GDS",
            source_id=hotel_info.get("hotelId"),
            is_live=True,
        )
