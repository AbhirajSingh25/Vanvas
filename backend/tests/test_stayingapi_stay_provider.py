"""
Unit & Integration Tests for StayingAPI Accommodation Commerce Provider
Validates zero price/inventory fabrication, explicit provenance, external checkout handoff,
availability mapping, error handling, and secure unconfigured states.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.providers.commerce.stayingapi_stay_adapter import StayingAPIStayCommerceAdapter
from app.schemas.schemas import Offer

client = TestClient(app)

MOCK_STAYINGAPI_SEARCH_RESPONSE = {
    "data": [
        {
            "id": "stays_vrbo_5663861ha",
            "platform": "vrbo",
            "platformListingId": "5663861ha",
            "url": "https://www.vrbo.com/5663861ha",
            "name": "Himalayan Cedar Pine Chalet",
            "propertyType": "chalet",
            "location": {
                "lat": 32.2396,
                "lng": 77.1887,
                "city": "Manali",
                "region": "Himachal Pradesh",
                "country": "India"
            },
            "starRating": 4.5,
            "guestRating": 4.9,
            "ratingScale": 5,
            "reviewCount": 84,
            "maxOccupancy": 6,
            "bedrooms": 3,
            "bathrooms": 2,
            "amenities": ["wifi", "fireplace", "mountain_view", "kitchen", "parking_free"],
            "images": ["https://images.stayingapi.example/chalet1.jpg"],
            "host": {"name": "Kullu Valley Retreats", "isSuperhost": True},
            "price": {
                "platform": "vrbo",
                "listingId": "5663861ha",
                "currency": "INR",
                "nightlyPrice": 4500.0,
                "totalPrice": 13500.0,
                "url": "https://www.vrbo.com/5663861ha?chkin=2026-10-10&chkout=2026-10-13"
            }
        },
        {
            "id": "stays_airbnb_98765432",
            "platform": "airbnb",
            "platformListingId": "98765432",
            "url": "https://www.airbnb.com/rooms/98765432",
            "name": "Riverside Wooden Cottage Old Manali",
            "propertyType": "cottage",
            "location": {
                "lat": 32.2512,
                "lng": 77.1795,
                "city": "Manali",
                "region": "Himachal Pradesh",
                "country": "India"
            },
            "starRating": None,
            "guestRating": 4.8,
            "ratingScale": 5,
            "reviewCount": 39,
            "maxOccupancy": 4,
            "bedrooms": 2,
            "bathrooms": 1,
            "amenities": ["wifi", "kitchen", "balcony", "river_view"],
            "images": ["https://images.stayingapi.example/cottage1.jpg"],
            "host": {"name": "Rohit Thakur", "isSuperhost": False},
            "price": {
                "platform": "airbnb",
                "listingId": "98765432",
                "currency": "INR",
                "nightlyPrice": 3200.0,
                "totalPrice": 6400.0,
                "url": "https://www.airbnb.com/rooms/98765432"
            }
        },
        {
            "id": "stays_booking_11223344",
            "platform": "booking",
            "platformListingId": "11223344",
            "url": "",
            "name": "Manali Snow Peak View Inn",
            "propertyType": "hotel",
            "location": {
                "lat": 32.2450,
                "lng": 77.1850,
                "city": "Manali",
                "region": "Himachal Pradesh",
                "country": "India"
            },
            "starRating": 3.0,
            "guestRating": 4.2,
            "ratingScale": 5,
            "reviewCount": 110,
            "maxOccupancy": 2,
            "bedrooms": 1,
            "bathrooms": 1,
            "amenities": ["wifi", "room_service"],
            "images": [],
            "host": {},
            "price": None  # Missing price test
        }
    ],
    "meta": {
        "requestId": "req_mock_stayingapi_001",
        "platforms": ["vrbo", "airbnb", "booking"],
        "cached": False,
        "partial": False,
        "creditsCharged": 0,
        "currency": "INR"
    }
}

MOCK_STAYINGAPI_AVAILABILITY_RESPONSE = {
    "data": [
        {
            "platform": "vrbo",
            "listingId": "5663861ha",
            "dates": [
                {"date": "2026-10-10", "available": True, "minNights": 2, "bookable": True},
                {"date": "2026-10-11", "available": True, "minNights": 2, "bookable": True},
                {"date": "2026-10-12", "available": True, "minNights": 2, "bookable": True}
            ]
        }
    ],
    "meta": {
        "requestId": "req_mock_avail_001",
        "creditsCharged": 0
    }
}


def test_stayingapi_adapter_unconfigured():
    """Adapter initializes with is_configured=False when key is empty."""
    adapter = StayingAPIStayCommerceAdapter(api_key="")
    assert adapter.is_configured is False
    assert adapter.provider_name == "stayingapi"

    # Search returns empty list when unconfigured
    offers = adapter.search_offers(destination="manali")
    assert offers == []

    # Availability returns NOT_CONFIGURED state
    avail = adapter.check_availability(offer_id="stayingapi-stays_vrbo_123")
    assert avail["status"] == "NOT_CONFIGURED"
    assert avail["availability_state"] == "UNKNOWN"
    assert avail["is_available"] is False


def test_stayingapi_adapter_configured():
    """Adapter reports is_configured=True when non-empty key is provided."""
    adapter = StayingAPIStayCommerceAdapter(api_key="stay_test_secret_key_mock")
    assert adapter.is_configured is True
    assert adapter.provider_name == "stayingapi"


@pytest.mark.asyncio
async def test_stayingapi_search_offers_mapping():
    """Adapter maps live StayingAPI listings into typed Offer schemas with provenance."""
    adapter = StayingAPIStayCommerceAdapter(api_key="stay_test_mock_key")

    mock_resp = MagicMock(status_code=200, json=lambda: MOCK_STAYINGAPI_SEARCH_RESPONSE)

    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        offers = await adapter.search_offers_async(destination="manali", product_type="stay")

        assert len(offers) == 3

        # 1. Vrbo Chalet Offer
        vrbo_offer = offers[0]
        assert vrbo_offer.provider == "stayingapi"
        assert vrbo_offer.provider_offer_id == "stayingapi-stays_vrbo_5663861ha"
        assert vrbo_offer.title == "Himalayan Cedar Pine Chalet"
        assert vrbo_offer.destination == "Manali"
        assert vrbo_offer.price == 4500.0
        assert vrbo_offer.currency == "INR"
        assert vrbo_offer.availability_state == "AVAILABLE"
        assert vrbo_offer.booking_capability == "EXTERNAL_CHECKOUT"
        assert vrbo_offer.deep_link == "https://www.vrbo.com/5663861ha?chkin=2026-10-10&chkout=2026-10-13"
        assert vrbo_offer.trust_source == "STAYINGAPI_VRBO"
        assert vrbo_offer.source_id == "5663861ha"
        assert vrbo_offer.is_live is True

        # 2. Airbnb Cottage Offer
        airbnb_offer = offers[1]
        assert airbnb_offer.provider == "stayingapi"
        assert airbnb_offer.provider_offer_id == "stayingapi-stays_airbnb_98765432"
        assert airbnb_offer.price == 3200.0
        assert airbnb_offer.trust_source == "STAYINGAPI_AIRBNB"
        assert airbnb_offer.booking_capability == "EXTERNAL_CHECKOUT"
        assert airbnb_offer.deep_link == "https://www.airbnb.com/rooms/98765432"

        # 3. Booking.com Inn Offer (Missing Price & URL)
        booking_offer = offers[2]
        assert booking_offer.provider == "stayingapi"
        assert booking_offer.price is None  # Must remain None, never 0
        assert booking_offer.deep_link is None
        assert booking_offer.booking_capability == "DISCOVERY_ONLY"
        assert booking_offer.trust_source == "STAYINGAPI_BOOKING"


@pytest.mark.asyncio
async def test_stayingapi_filtering():
    """Adapter respects query and max_price filters."""
    adapter = StayingAPIStayCommerceAdapter(api_key="stay_test_mock_key")
    mock_resp = MagicMock(status_code=200, json=lambda: MOCK_STAYINGAPI_SEARCH_RESPONSE)

    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        # Filter by query
        chalet_offers = await adapter.search_offers_async(destination="manali", query="Chalet")
        assert len(chalet_offers) == 1
        assert "Chalet" in chalet_offers[0].title

        # Filter by budget threshold
        budget_offers = await adapter.search_offers_async(destination="manali", max_price=3500.0)
        assert len(budget_offers) == 1
        assert budget_offers[0].price == 3200.0


def test_stayingapi_check_availability_live():
    """check_availability queries /v1/availability and maps real availability status."""
    adapter = StayingAPIStayCommerceAdapter(api_key="stay_test_mock_key")

    # Populate cache
    adapter._listing_meta_cache["stayingapi-stays_vrbo_5663861ha"] = {
        "platform": "vrbo",
        "platformListingId": "5663861ha"
    }

    mock_resp = MagicMock(status_code=200, json=lambda: MOCK_STAYINGAPI_AVAILABILITY_RESPONSE)

    with patch("httpx.Client.get", return_value=mock_resp):
        res = adapter.check_availability(
            offer_id="stayingapi-stays_vrbo_5663861ha",
            start_date="2026-10-10",
            end_date="2026-10-13",
        )
        assert res["status"] == "AVAILABLE"
        assert res["availability_state"] == "AVAILABLE"
        assert res["is_available"] is True
        assert res["provider"] == "stayingapi"


def test_stayingapi_check_availability_error_handling():
    """check_availability handles API failures without mapping errors to sold-out."""
    adapter = StayingAPIStayCommerceAdapter(api_key="stay_test_mock_key")

    adapter._listing_meta_cache["stayingapi-stays_vrbo_5663861ha"] = {
        "platform": "vrbo",
        "platformListingId": "5663861ha"
    }

    mock_err_resp = MagicMock(status_code=400, text="Invalid parameters")

    with patch("httpx.Client.get", return_value=mock_err_resp):
        res = adapter.check_availability(
            offer_id="stayingapi-stays_vrbo_5663861ha",
            start_date="2026-10-10",
            end_date="2026-10-13",
        )
        assert res["status"] == "ERROR"
        assert res["availability_state"] == "UNKNOWN"
        assert res["is_available"] is False


def test_stayingapi_create_booking_handoff():
    """create_booking returns EXTERNAL_HANDOFF_REQUIRED when verified checkout deep link exists."""
    adapter = StayingAPIStayCommerceAdapter(api_key="stay_test_mock_key")

    test_offer = Offer(
        provider="stayingapi",
        provider_offer_id="stayingapi-stays_vrbo_5663861ha",
        product_type="stay",
        title="Himalayan Cedar Chalet",
        destination="Manali",
        price=4500.0,
        currency="INR",
        booking_capability="EXTERNAL_CHECKOUT",
        deep_link="https://www.vrbo.com/5663861ha",
        trust_source="STAYINGAPI_VRBO",
        is_live=True
    )
    adapter._offer_cache["stayingapi-stays_vrbo_5663861ha"] = test_offer

    res = adapter.create_booking(
        user_id="usr-123",
        offer_id="stayingapi-stays_vrbo_5663861ha",
        payload={"guests": 2}
    )

    assert res["status"] == "EXTERNAL_HANDOFF_REQUIRED"
    assert res["booking_capability"] == "EXTERNAL_CHECKOUT"
    assert res["checkout_url"] == "https://www.vrbo.com/5663861ha"


def test_offers_endpoint_with_stayingapi(db_session=None):
    """GET /api/v1/offers includes StayingAPI live offers when configured."""
    with patch.object(StayingAPIStayCommerceAdapter, "is_configured", True):
        mock_resp = MagicMock(status_code=200, json=lambda: MOCK_STAYINGAPI_SEARCH_RESPONSE)
        with patch("httpx.AsyncClient.get", return_value=mock_resp):
            resp = client.get("/api/v1/offers?destination=manali&product_type=stay")
            assert resp.status_code == 200
            data = resp.json()

            # Verify StayingAPI offers are present in unified endpoint
            staying_offers = [o for o in data if o.get("provider") == "stayingapi"]
            assert len(staying_offers) == 3
            assert staying_offers[0]["provider_offer_id"] == "stayingapi-stays_vrbo_5663861ha"
            assert staying_offers[0]["booking_capability"] == "EXTERNAL_CHECKOUT"


def test_availability_endpoint_stayingapi_routing():
    """GET /api/v1/offers/{offer_id}/availability routes stayingapi IDs to StayingAPI adapter."""
    with patch.object(StayingAPIStayCommerceAdapter, "is_configured", True):
        mock_resp = MagicMock(status_code=200, json=lambda: MOCK_STAYINGAPI_AVAILABILITY_RESPONSE)
        with patch("httpx.Client.get", return_value=mock_resp):
            resp = client.get(
                "/api/v1/offers/stayingapi-stays_vrbo_5663861ha/availability?start_date=2026-10-10&end_date=2026-10-13"
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["provider"] == "stayingapi"
            assert data["status"] in ["AVAILABLE", "UNAVAILABLE", "UNKNOWN"]
