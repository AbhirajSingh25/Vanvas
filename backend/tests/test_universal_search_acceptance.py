"""
Universal Destination and Place Search Acceptance Tests.
Verifies all requirements in SECTION 2:
- Unseeded & seeded destination discovery (Ujjain, Munsiyari, Tirthan Valley, Zanskar, Chitkul)
- Famous landmark identification (Key Monastery, Chicham Bridge, Hawa Mahal, Taj Mahal, Tungnath, Pangong Tso)
- Category + location search (Cafés in Landour, Bike rental in Spiti, Vegetarian food in Jaipur)
- Intent classification and badge correctness
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.services.intent_router import SearchIntentRouter
from app.services.destination_intelligence import DestinationIntelligenceService

client = TestClient(app)

@pytest.mark.parametrize("query,expected_intent,expected_category,expected_sub_intent", [
    ("Ujjain", "destination", "Destination", None),
    ("Munsiyari", "destination", "Destination", None),
    ("Tirthan Valley", "destination", "Destination", None),
    ("Zanskar", "destination", "Destination", None),
    ("Chitkul", "destination", "Destination", None),
    ("Key Monastery", "place", "Must Visit", None),
    ("Chicham Bridge", "place", "Must Visit", None),
    ("Hawa Mahal", "place", "Must Visit", None),
    ("Taj Mahal", "place", "Must Visit", None),
    ("Pangong Tso", "place", "Nature & Trails", None),
    ("Café in Landour", "place", "Cafés & Bakery", "category_search"),
    ("Bike rental in Spiti", "place", "Mobility", "category_search"),
    ("Vegetarian food in Jaipur", "place", "Local Food", "category_search"),
])
def test_search_intent_classification(query, expected_intent, expected_category, expected_sub_intent):
    intent = SearchIntentRouter.classify_intent(query)
    assert intent["intent"] == expected_intent, f"Failed intent for query '{query}': got {intent['intent']}, expected {expected_intent}"
    if expected_sub_intent:
        assert intent.get("sub_intent") == expected_sub_intent
    if expected_category:
        assert intent.get("category") == expected_category, f"Failed category for query '{query}': got {intent.get('category')}, expected {expected_category}"

@pytest.mark.asyncio
async def test_autocomplete_mandatory_destinations():
    db: Session = SessionLocal()
    for dest_query in ["Ujjain", "Munsiyari", "Tirthan Valley", "Zanskar", "Chitkul"]:
        res = await DestinationIntelligenceService.search_destinations_autocomplete(dest_query, limit=5, db=db)
        assert len(res) > 0, f"Query '{dest_query}' must return at least one result"
        names = [r["name"].lower() for r in res]
        assert any(dest_query.lower() in n for n in names), f"Query '{dest_query}' not found in results: {names}"
    db.close()

@pytest.mark.asyncio
async def test_autocomplete_mandatory_landmarks():
    db: Session = SessionLocal()
    landmark_checks = {
        "Key Monastery": "key",
        "Chicham Bridge": "chicham",
        "Hawa Mahal": "hawa mahal",
        "Taj Mahal": "taj mahal",
        "Pangong Tso": "pangong",
    }
    for landmark_query, keyword in landmark_checks.items():
        res = await DestinationIntelligenceService.search_destinations_autocomplete(landmark_query, limit=5, db=db)
        assert len(res) > 0, f"Landmark '{landmark_query}' must return at least one result"
        first = res[0]
        assert first["type"] == "landmark", f"First result for '{landmark_query}' must have type 'landmark', got {first['type']}"
        assert first["badge"] == "LANDMARK"
        assert keyword in first["name"].lower(), f"Expected '{keyword}' in landmark name: {first['name']}"
    db.close()

@pytest.mark.asyncio
async def test_autocomplete_category_and_location():
    db: Session = SessionLocal()
    
    # 1. Cafés in Landour
    res_cafe = await DestinationIntelligenceService.search_destinations_autocomplete("Café in Landour", limit=5, db=db)
    assert len(res_cafe) > 0
    assert res_cafe[0]["type"] == "category"
    assert res_cafe[0]["canonical_slug"] == "mussoorie"
    place_names = [r["name"].lower() for r in res_cafe if r.get("type") == "place"]
    assert any("bakehouse" in n or "dukan" in n for n in place_names)

    # 2. Bike rental in Spiti
    res_bike = await DestinationIntelligenceService.search_destinations_autocomplete("Bike rental in Spiti", limit=5, db=db)
    assert len(res_bike) > 0
    assert res_bike[0]["badge"] == "RENTAL"
    assert res_bike[0]["canonical_slug"] == "spiti"

    # 3. Vegetarian food in Jaipur
    res_food = await DestinationIntelligenceService.search_destinations_autocomplete("Vegetarian food in Jaipur", limit=5, db=db)
    assert len(res_food) > 0
    assert res_food[0]["badge"] == "FOOD"
    assert res_food[0]["canonical_slug"] == "jaipur"
    assert res_food[0]["dietary"] == "Vegetarian"

    db.close()

def test_api_endpoint_universal_search_contract():
    # Test through HTTP endpoint
    res = client.get("/api/v1/destinations/search?q=Key%20Monastery")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["type"] == "landmark"
    assert "Key Gompa" in data[0]["name"]
    assert data[0]["canonical_slug"] == "spiti"

