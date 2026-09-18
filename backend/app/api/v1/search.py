from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, Optional
from app.services.intent_router import SearchIntentRouter
from app.providers.provider_factory import ProviderFactory

router = APIRouter()

@router.get("/intent")
def classify_search_intent(
    q: str = Query(..., min_length=1, description="User search query")
) -> Dict[str, Any]:
    """
    Classifies search intent (destination, place, weather, web_info).
    """
    return SearchIntentRouter.classify_intent(q)

@router.get("/web")
async def search_travel_web(
    q: str = Query(..., min_length=1, description="Travel search query"),
    limit: int = Query(5, ge=1, le=10)
) -> Dict[str, Any]:
    """
    Legitimate web search for travel advisories, pass closures, and event information.
    """
    web_provider = ProviderFactory.get_web_search_provider()
    return await web_provider.search_travel_web(q, limit=limit)

@router.get("/unified")
async def unified_travel_search(
    q: str = Query(..., min_length=1, description="Query across all VANVAS layers")
) -> Dict[str, Any]:
    """
    Unified search routing queries to destinations, places, weather, or web intelligence based on classified intent.
    """
    intent = SearchIntentRouter.classify_intent(q)
    intent_type = intent["intent"]

    if intent_type == "web_info":
        web_res = await ProviderFactory.get_web_search_provider().search_travel_web(q)
        return {
            "intent": intent,
            "result_type": "web_info",
            "data": web_res
        }
    elif intent_type == "weather":
        loc = intent["extracted_location"] or "Manali"
        geocoder = ProviderFactory.get_geocoding_provider()
        geo = await geocoder.geocode(loc)
        lat = geo["lat"] if geo else 32.2396
        lng = geo["lng"] if geo else 77.1887
        weather = await ProviderFactory.get_weather_provider().get_forecast(lat, lng, days=5)
        return {
            "intent": intent,
            "result_type": "weather",
            "location": geo,
            "data": weather
        }
    elif intent_type == "place":
        loc = intent.get("extracted_location") or "Manali"
        geocoder = ProviderFactory.get_geocoding_provider()
        geo = await geocoder.geocode(loc)
        places_provider = ProviderFactory.get_places_provider()
        places = await places_provider.search_places(query=q, destination_name=loc, category=intent.get("category"))
        if not places and geo:
            lat = geo.get("lat", 32.2396)
            lng = geo.get("lng", 77.1887)
            places = await places_provider.get_nearby_places(lat, lng, radius_km=10.0, category=intent.get("category"))
        return {
            "intent": intent,
            "result_type": "places",
            "location": geo,
            "data": places
        }
    else:
        # Default destination search
        destinations = await ProviderFactory.get_geocoding_provider().autocomplete(q, limit=6)
        return {
            "intent": intent,
            "result_type": "destinations",
            "data": destinations
        }
