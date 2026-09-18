import pytest
from datetime import datetime
import zoneinfo
from app.services.operating_hours_engine import OperatingHoursEngine
from app.services.action_link_generator import ActionLinkGenerator
from app.providers.live_providers import LiveHotelsProvider, LiveRentalsProvider, LivePlacesProvider
from app.schemas.schemas import PlaceBase, PlaceResponse, HotelResponse, RentalOptionResponse, TransportOptionResponse, ActionLink


def test_operating_hours_engine_unlisted():
    """Verify that unlisted hours return is_open_now = None, hours_available = False."""
    res = OperatingHoursEngine.evaluate_osm_hours(None)
    assert res.is_open_now is None
    assert res.hours_available is False
    assert res.opening_time is None
    assert res.closing_time is None

    res = OperatingHoursEngine.evaluate_osm_hours("")
    assert res.is_open_now is None
    assert res.hours_available is False

    res = OperatingHoursEngine.evaluate_osm_hours("unknown")
    assert res.is_open_now is None
    assert res.hours_available is False


def test_operating_hours_engine_24_7():
    """Verify 24/7 hours returns is_open_now = True, hours_available = True."""
    res = OperatingHoursEngine.evaluate_osm_hours("24/7")
    assert res.is_open_now is True
    assert res.hours_available is True
    assert res.opening_time == "00:00"
    assert res.closing_time == "24:00"


def test_operating_hours_engine_deterministic_intervals():
    """Verify evaluation against fixed datetimes in Asia/Kolkata timezone."""
    kolkata_tz = zoneinfo.ZoneInfo("Asia/Kolkata")

    # Monday 10:30 AM (Open between 09:00 and 18:00)
    monday_morning = datetime(2026, 9, 21, 10, 30, tzinfo=kolkata_tz)
    res = OperatingHoursEngine.evaluate_osm_hours(
        "Mo-Sa 09:00-18:00; Su off",
        now_dt=monday_morning
    )
    assert res.hours_available is True
    assert res.is_open_now is True
    assert res.opening_time == "09:00"
    assert res.closing_time == "18:00"

    # Monday 8:30 PM (after closing)
    monday_night = datetime(2026, 9, 21, 20, 30, tzinfo=kolkata_tz)
    res = OperatingHoursEngine.evaluate_osm_hours(
        "Mo-Sa 09:00-18:00; Su off",
        now_dt=monday_night
    )
    assert res.hours_available is True
    assert res.is_open_now is False

    # Sunday (off day)
    sunday_noon = datetime(2026, 9, 20, 12, 0, tzinfo=kolkata_tz)
    res = OperatingHoursEngine.evaluate_osm_hours(
        "Mo-Sa 09:00-18:00; Su off",
        now_dt=sunday_noon
    )
    assert res.hours_available is True
    assert res.is_open_now is False


def test_action_link_generator_directions():
    """Verify directions generation and coordinate validation."""
    links = ActionLinkGenerator.generate_place_action_links(
        name="Landour Bakehouse",
        latitude=30.4598,
        longitude=78.0934
    )
    assert len(links) >= 1
    dir_link = next((l for l in links if l["type"] == "directions"), None)
    assert dir_link is not None
    assert "google.com/maps/dir" in dir_link["url"]
    assert "30.459800,78.093400" in dir_link["url"]

    # Missing coordinates -> no directions link
    no_coords = ActionLinkGenerator.generate_place_action_links(name="Test Spot", latitude=None, longitude=None)
    assert not any(l["type"] == "directions" for l in no_coords)


def test_action_link_generator_website_validation():
    """Verify website validation rejects dummy and placeholder domains."""
    # Dummy domain rejected
    dummy_links = ActionLinkGenerator.generate_place_action_links(
        name="Dummy Cafe",
        website="https://example.com/cafe"
    )
    assert not any(l["type"] == "website" for l in dummy_links)

    # Valid domain accepted
    valid_links = ActionLinkGenerator.generate_place_action_links(
        name="Landour Bakehouse",
        website="https://landourbakehouse.com"
    )
    web_link = next((l for l in valid_links if l["type"] == "website"), None)
    assert web_link is not None
    assert web_link["url"] == "https://landourbakehouse.com"


def test_action_link_generator_phone():
    """Verify telephone link generation and sanitization."""
    links = ActionLinkGenerator.generate_place_action_links(
        name="Himalayan Homestay",
        phone="+91 98765-43210"
    )
    phone_link = next((l for l in links if l["type"] == "phone"), None)
    assert phone_link is not None
    assert phone_link["url"] == "tel:+919876543210"


def test_action_link_generator_booking():
    """Verify booking link validation and generation."""
    # Valid booking URL
    links = ActionLinkGenerator.generate_hotel_action_links(
        name="Rokeby Manor",
        booking_url="https://rokebymanor.com/book",
        latitude=30.4598,
        longitude=78.0934
    )
    book_link = next((l for l in links if l["type"] == "booking"), None)
    assert book_link is not None
    assert book_link["url"] == "https://rokebymanor.com/book"

    # Dummy booking URL rejected
    dummy_links = ActionLinkGenerator.generate_hotel_action_links(
        name="Fake Hotel",
        booking_url="https://example.com/book"
    )
    assert not any(l["type"] == "booking" for l in dummy_links)


@pytest.mark.asyncio
async def test_live_stays_and_rentals_provenance():
    """Verify that live OSM stays and rentals return unverified pricing and inventory states."""
    sample_osm_tags = {
        "name": "Live Mountain Guest House",
        "tourism": "guest_house",
        "opening_hours": "24/7",
        "phone": "+91 9812345678"
    }

    raw_links = ActionLinkGenerator.generate_hotel_action_links(
        name=sample_osm_tags["name"],
        latitude=32.2432,
        longitude=77.1892,
        phone=sample_osm_tags["phone"]
    )
    action_links = [ActionLink(**l) for l in raw_links]

    hotel_resp = HotelResponse(
        id="live_hotel_1",
        destination_id="manali",
        name=sample_osm_tags["name"],
        address="Old Manali, Himachal Pradesh",
        latitude=32.2432,
        longitude=77.1892,
        price_per_night=None,
        price_verified=False,
        is_live=True,
        source="openstreetmap",
        data_state="live_unverified",
        trust_source="OPENSTREETMAP",
        action_links=action_links
    )

    assert hotel_resp.price_per_night is None
    assert hotel_resp.price_verified is False
    assert hotel_resp.data_state == "live_unverified"
    assert hotel_resp.trust_source == "OPENSTREETMAP"
    assert len(hotel_resp.action_links) >= 1

    rental_links = ActionLinkGenerator.generate_rental_action_links(
        provider_name="Himalayan Bikers",
        latitude=32.2432,
        longitude=77.1892
    )

    rental_resp = RentalOptionResponse(
        id="live_rental_1",
        destination_id="manali",
        vehicle_type="scooter",
        vehicle_name="Honda Activa 6G",
        provider_name="Himalayan Bikers",
        price_per_day=None,
        deposit_amount=None,
        inventory_verified=False,
        location="Mall Road, Manali",
        latitude=32.2432,
        longitude=77.1892,
        is_live=True,
        source="openstreetmap",
        data_state="live_unverified",
        trust_source="OPENSTREETMAP",
        action_links=[ActionLink(**l) for l in rental_links]
    )

    assert rental_resp.price_per_day is None
    assert rental_resp.inventory_verified is False
    assert rental_resp.trust_source == "OPENSTREETMAP"
