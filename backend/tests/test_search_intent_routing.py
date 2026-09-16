import pytest
from app.services.intent_router import SearchIntentRouter

def test_search_intent_classification():
    """
    Test basic intent routing across different query patterns:
    - "Indore" -> destination search
    - "Cafes near Mall Road Manali" -> place search (category: coffee/cafe)
    - "Things to do in Udaipur" -> place search (category: attractions)
    - "Is Rohtang Pass open today?" -> web_info search
    - "Weather in Mussoorie" -> weather search
    - "bike rental Manali" -> place search (category: mobility)
    """
    test_queries = [
        ("Indore", "destination"),
        ("Manali", "destination"),
        ("Mussoorie", "destination"),
        ("Udaipur", "destination"),
        ("Paris", "destination"),
        ("Cafes near Mall Road Manali", "place"),
        ("best bakery in Old Manali", "place"),
        ("Things to do in Udaipur", "place"),
        ("attractions in Rishikesh", "place"),
        ("bike rental Manali", "place"),
        ("scooter hire in Goa", "place"),
        ("hospitals in Dharamshala", "place"),
        ("pharmacy nearby", "place"),
        ("Weather in Mussoorie", "weather"),
        ("climate in Leh next week", "weather"),
        ("temperature in Kasol", "weather"),
        ("Is Rohtang Pass open today?", "web_info"),
        ("What is happening in Mussoorie this weekend?", "web_info"),
        ("latest travel advisory for Kashmir", "web_info"),
        ("recently opened cafes in Jaipur", "web_info"),
    ]

    for q, expected_intent in test_queries:
        res = SearchIntentRouter.classify_intent(q)
        assert res["intent"] == expected_intent, f"Query '{q}' classified as '{res['intent']}', expected '{expected_intent}'"
        assert res["confidence"] >= 0.5
        assert "suggested_action" in res

def test_intent_entity_and_category_extraction():
    """
    Verify extracted destination names and categories.
    """
    res1 = SearchIntentRouter.classify_intent("Cafes near Mall Road Manali")
    assert res1["intent"] == "place"
    assert res1["extracted_category"] in ["coffee", "cafes", "food"]
    assert res1["extracted_destination"] is not None
    assert "manali" in res1["extracted_destination"].lower()

    res2 = SearchIntentRouter.classify_intent("Weather in Mussoorie")
    assert res2["intent"] == "weather"
    assert res2["extracted_destination"] is not None
    assert "mussoorie" in res2["extracted_destination"].lower()

    res3 = SearchIntentRouter.classify_intent("bike rental Manali")
    assert res3["intent"] == "place"
    assert res3["extracted_category"] == "mobility"
    assert res3["extracted_destination"] is not None
    assert "manali" in res3["extracted_destination"].lower()
