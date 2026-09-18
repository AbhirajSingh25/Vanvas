import pytest
import asyncio
from unittest.mock import patch, MagicMock
from app.providers.provider_factory import ProviderFactory
from app.providers.live_providers import LivePlacesProvider
from app.services.intent_router import SearchIntentRouter
from app.providers.ai.dispatcher import AIToolDispatcher
from app.database.session import SessionLocal

@pytest.mark.asyncio
async def test_search_intent_routing_places():
    # Test cafe intent with Landour
    intent1 = SearchIntentRouter.classify_intent("cafes in Landour")
    assert intent1["intent"] == "place"
    assert "Café" in intent1["category"] or "Bakery" in intent1["category"]
    assert intent1["extracted_location"] == "Landour"

    # Test church intent with Landour
    intent2 = SearchIntentRouter.classify_intent("churches in Landour")
    assert intent2["intent"] == "place"
    assert "Culture" in intent2["category"] or "Heritage" in intent2["category"]
    assert intent2["extracted_location"] == "Landour"

    # Test quiet cafes query
    intent3 = SearchIntentRouter.classify_intent("quiet cafes in Landour")
    assert intent3["intent"] == "place"
    assert intent3["extracted_location"] == "Landour"

@pytest.mark.asyncio
async def test_live_places_provider_deduplication():
    provider = LivePlacesProvider()
    raw_places = [
        {
            "id": "osm-101",
            "name": "Cafe Ivy",
            "category": "Cafés & Bakery",
            "latitude": 30.4590,
            "longitude": 78.0640,
            "source": "openstreetmap",
            "source_id": "101",
            "is_live": True
        },
        {
            "id": "osm-102",
            "name": "Cafe Ivy Landour",
            "category": "Cafés & Bakery",
            "latitude": 30.4591,
            "longitude": 78.0641,
            "source": "openstreetmap",
            "source_id": "102",
            "is_live": True
        },
        {
            "id": "curated-1",
            "name": "Landour Bakehouse",
            "category": "Cafés & Bakery",
            "latitude": 30.4610,
            "longitude": 78.0680,
            "source": "vanvas_curated",
            "source_id": "c1",
            "is_live": False
        }
    ]
    deduped = provider._deduplicate_places(raw_places)
    # Cafe Ivy and Cafe Ivy Landour are within 15m and have similar normalized names -> deduplicated to 1
    assert len(deduped) == 2
    names = [p["name"] for p in deduped]
    assert "Landour Bakehouse" in names
    assert any("Ivy" in n for n in names)

@pytest.mark.asyncio
async def test_live_places_provider_graceful_timeout():
    provider = LivePlacesProvider()
    # When Overpass times out or fails, get_nearby_places must return without raising an unhandled exception
    with patch.object(provider, "_execute_overpass_query", return_value=[]):
        res = await provider.get_nearby_places(30.4598, 78.0644, radius_km=5)
        assert isinstance(res, list)

@pytest.mark.asyncio
async def test_ai_tool_dispatcher_search_places():
    db = SessionLocal()
    try:
        dispatcher = AIToolDispatcher(db=db)
        
        # 1. Test search with verified place query in curated DB (e.g. Cafe 1947 in Manali)
        res_curated = await dispatcher.dispatch("search_places", {"query": "Cafe 1947", "destination_slug": "manali"})
        assert "places" in res_curated
        assert len(res_curated["places"]) > 0
        assert res_curated["places"][0]["source"] == "vanvas_curated"
        assert res_curated["places"][0]["is_live"] is False

        # 2. Test live place discovery integration
        mock_live_places = [
            {
                "id": "osm-9999",
                "name": "Live Landour Cafe",
                "category": "Cafés & Bakery",
                "address": "Upper Mall, Landour",
                "latitude": 30.4598,
                "longitude": 78.0644,
                "approx_cost": None,
                "rating": None,
                "review_count": None,
                "opening_time": None,
                "closing_time": None,
                "phone": None,
                "website": None,
                "source": "openstreetmap",
                "source_id": "9999",
                "is_live": True,
            }
        ]
        with patch.object(LivePlacesProvider, "search_places", return_value=mock_live_places):
            res_live = await dispatcher.dispatch("search_places", {"query": "cafes", "destination_slug": "landour"})
            assert "places" in res_live
            assert len(res_live["places"]) > 0
            live_item = next((p for p in res_live["places"] if p["name"] == "Live Landour Cafe"), None)
            assert live_item is not None
            assert live_item["source"] == "openstreetmap"
            assert live_item["is_live"] is True

        # 3. Test impossible place name -> must return graceful unverified message rather than hallucinating
        with patch.object(LivePlacesProvider, "search_places", return_value=[]):
            res_empty = await dispatcher.dispatch("search_places", {"query": "NonExistentPlaceXYZ99999", "destination_slug": "nowhere_land"})
            assert "places" in res_empty
            assert len(res_empty["places"]) == 0
            assert "message" in res_empty
            assert "could not verify" in res_empty["message"].lower() or "no verified" in res_empty["message"].lower()

    finally:
        db.close()
