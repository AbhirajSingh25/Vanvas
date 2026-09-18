"""
VANVAS Action Link Generator
Provider-neutral, truthful generation of real-world outbound actions and booking handoffs.

Strict Security & Truthfulness Rules:
1. Directions Action:
   - Generated from verified coordinates (latitude, longitude).
   - Valid Google Maps / OpenStreetMap navigation link.
2. Website Action:
   - Validated genuine HTTP/HTTPS URL from verified source.
   - Strictly rejects placeholder domains (example.com, test.com, localhost) or fake strings.
3. Phone Action:
   - Validated genuine telephone number with international or local formatting.
   - Formats as 'tel:<cleaned_number>'.
4. Booking Action:
   - ONLY generated when a genuine booking or provider reservation URL exists.
   - Never fabricated or guessed.
5. Missing data:
   - Does NOT emit actions with empty, guessed, or placeholder URLs.
"""

import re
import urllib.parse
from typing import List, Dict, Any, Optional

INVALID_DOMAINS = {
    "example.com", "example.org", "example.net",
    "test.com", "placeholder.com", "fake.com", "domain.com",
    "none", "null", "undefined", "localhost"
}


def is_valid_url(url: Optional[str]) -> bool:
    """Validates that a URL is a well-formed HTTP/HTTPS URL and not a dummy domain."""
    if not url or not isinstance(url, str):
        return False
    clean = url.strip()
    if not (clean.startswith("http://") or clean.startswith("https://")):
        return False
    try:
        parsed = urllib.parse.urlparse(clean)
        hostname = (parsed.hostname or "").lower()
        if not hostname or hostname in INVALID_DOMAINS or any(hostname.endswith("." + d) for d in INVALID_DOMAINS):
            return False
        return len(clean) >= 10
    except Exception:
        return False


def is_valid_phone(phone: Optional[str]) -> bool:
    """Validates that a phone string contains actual digits."""
    if not phone or not isinstance(phone, str):
        return False
    clean = phone.strip()
    digits = re.sub(r"[^\d]", "", clean)
    return len(digits) >= 6


def format_tel_url(phone: str) -> str:
    """Formats phone into standard tel: URI."""
    clean = re.sub(r"[^\d+]", "", phone.strip())
    return f"tel:{clean}"


class ActionLinkGenerator:
    """Generates strictly verified ActionLink objects for places, hotels, rentals, and transport."""

    @classmethod
    def generate_place_action_links(
        cls,
        name: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        website: Optional[str] = None,
        phone: Optional[str] = None,
        booking_url: Optional[str] = None,
        source: Optional[str] = None,
        source_id: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        links: List[Dict[str, str]] = []

        # 1. Directions link (from verified coordinates)
        if latitude is not None and longitude is not None and abs(latitude) <= 90 and abs(longitude) <= 180:
            maps_url = f"https://www.google.com/maps/dir/?api=1&destination={latitude:.6f},{longitude:.6f}"
            links.append({
                "type": "directions",
                "label": "Get Directions",
                "url": maps_url,
            })

        # 2. Website link (if genuine URL)
        if is_valid_url(website):
            links.append({
                "type": "website",
                "label": "Visit Website",
                "url": website.strip(),
            })

        # 3. Phone action (if genuine phone)
        if is_valid_phone(phone):
            links.append({
                "type": "phone",
                "label": f"Call {phone.strip()}",
                "url": format_tel_url(phone),
            })

        # 4. Booking link (only if genuine)
        if is_valid_url(booking_url):
            links.append({
                "type": "booking",
                "label": "Book Now",
                "url": booking_url.strip(),
            })

        # 5. OpenStreetMap POI link (if live OSM item)
        if source == "openstreetmap" and source_id and source_id.isdigit():
            osm_url = f"https://www.openstreetmap.org/node/{source_id}"
            links.append({
                "type": "provider",
                "label": "View on OpenStreetMap",
                "url": osm_url,
            })

        return links

    @classmethod
    def generate_hotel_action_links(
        cls,
        name: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        website: Optional[str] = None,
        phone: Optional[str] = None,
        booking_url: Optional[str] = None,
        source: Optional[str] = None,
        source_id: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        links: List[Dict[str, str]] = []

        # 1. Directions link
        if latitude is not None and longitude is not None:
            maps_url = f"https://www.google.com/maps/dir/?api=1&destination={latitude:.6f},{longitude:.6f}"
            links.append({
                "type": "directions",
                "label": "Directions to Sanctuary",
                "url": maps_url,
            })

        # 2. Genuine Booking link
        if is_valid_url(booking_url):
            links.append({
                "type": "booking",
                "label": "View Stay & Book",
                "url": booking_url.strip(),
            })
        elif is_valid_url(website):
            # Fallback to official stay website
            links.append({
                "type": "website",
                "label": "Official Stay Website",
                "url": website.strip(),
            })

        # 3. Verified Phone
        if is_valid_phone(phone):
            links.append({
                "type": "phone",
                "label": f"Call Front Desk",
                "url": format_tel_url(phone),
            })

        return links

    @classmethod
    def generate_rental_action_links(
        cls,
        provider_name: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        website: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        links: List[Dict[str, str]] = []

        # 1. Directions
        if latitude is not None and longitude is not None:
            maps_url = f"https://www.google.com/maps/dir/?api=1&destination={latitude:.6f},{longitude:.6f}"
            links.append({
                "type": "directions",
                "label": "Directions to Rental Hub",
                "url": maps_url,
            })

        # 2. Website
        if is_valid_url(website):
            links.append({
                "type": "website",
                "label": "Visit Rental Site",
                "url": website.strip(),
            })

        # 3. Phone
        if is_valid_phone(phone):
            links.append({
                "type": "phone",
                "label": "Call Rental Provider",
                "url": format_tel_url(phone),
            })

        return links

    @classmethod
    def generate_transport_action_links(
        cls,
        operator_name: str,
        booking_url: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        links: List[Dict[str, str]] = []
        if is_valid_url(booking_url):
            links.append({
                "type": "booking",
                "label": f"Book with {operator_name}",
                "url": booking_url.strip(),
            })
        return links
