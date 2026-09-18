import re
from typing import Dict, Any, Optional

class SearchIntentRouter:
    """
    Intelligent Search Intent Router for VANVAS.
    Routes user queries to the most appropriate provider layer:
    - destination: Geocoding & destination resolution (e.g. "Indore", "Mussoorie", "Bali")
    - place: Location-aware POI discovery (e.g. "Cafes near Mall Road Manali", "Things to do in Udaipur", "bike rental Manali")
    - weather: Real-time meteorological intelligence (e.g. "Weather in Mussoorie", "Is it raining in Manali")
    - web_info: Live web advisories, pass closures, road status (e.g. "Is Rohtang Pass open today?", "events in Udaipur")
    """

    WEATHER_PATTERNS = [
        r"\bweather\b", r"\bforecast\b", r"\btemperature\b", r"\brain\b", r"\braining\b",
        r"\bsnow\b", r"\bsnowing\b", r"\bclimate\b", r"\bwind\b"
    ]

    WEB_INFO_PATTERNS = [
        r"\bis\s+.*\s+(open|closed|blocked)\b",
        r"\bpass\s+(open|status|closed)\b",
        r"\broad\s+(status|condition|blocked|open)\b",
        r"\badvisory\b", r"\bnews\b", r"\bevents?\b",
        r"\bthis\s+weekend\b", r"\btoday\b", r"\bpermit\b",
        r"\blandslide\b", r"\bhighway\s+status\b",
        r"\brecently\s+opened\b", r"\bnewly\s+opened\b",
        r"\bwhat\s+is\s+happening\b", r"\blatest\b", r"\brecent\b"
    ]

    PLACE_CATEGORY_PATTERNS = {
        "Cafés & Bakery": [r"\bcafes?\b", r"\bcafés?\b", r"\bbaker(y|ies)\b", r"\bcoffee\b", r"\btea\b", r"\bbreakfast\b"],
        "Local Food": [r"\brestaurants?\b", r"\bdhabas?\b", r"\bfood\b", r"\bdine\b", r"\beat\b", r"\blunch\b", r"\bdinner\b", r"\bstreet\s*food\b"],
        "Attractions": [r"\bthings\s+to\s+do\b", r"\bplaces\s+to\s+visit\b", r"\battractions?\b", r"\bsightseeing\b", r"\blandmarks?\b", r"\bmuseums?\b"],
        "Nature & Trails": [r"\btrails?\b", r"\btreks?\b", r"\bwaterfalls?\b", r"\bviewpoints?\b", r"\bhikes?\b", r"\blakes?\b"],
        "Culture & Heritage": [r"\btemples?\b", r"\bforts?\b", r"\bpalaces?\b", r"\bmonaster(y|ies)\b", r"\bghats?\b", r"\baartis?\b", r"\bchurch(es)?\b", r"\bcathedrals?\b", r"\bchapels?\b", r"\bashrams?\b", r"\bshrines?\b"],
        "Adventure": [r"\brafting\b", r"\bparagliding\b", r"\bkayaking\b", r"\bzipline\b", r"\bcamping\b", r"\badventure\b"],
        "Shopping": [r"\bmarkets?\b", r"\bshops?\b", r"\bshopping\b", r"\bbazaars?\b", r"\bgrocery\b", r"\bmalls?\b"],
        "Mobility": [r"\bbike\s+rentals?\b", r"\bscooter\s+rentals?\b", r"\brent\s+a\s+bike\b", r"\btaxis?\b", r"\bcabs?\b", r"\brentals?\b", r"\bhire\b", r"\bscooters?\b", r"\bmotorcycles?\b"],
        "Essentials & Medical": [r"\bhospitals?\b", r"\bpharmac(y|ies)\b", r"\bchemists?\b", r"\bdoctors?\b", r"\bmedical\b", r"\bfuel\b", r"\bpetrol\b", r"\batms?\b", r"\bpolice\b"]
    }

    @classmethod
    def classify_intent(cls, query: str) -> Dict[str, Any]:
        q = query.strip().lower()
        if not q:
            return {
                "intent": "destination",
                "confidence": 0.0,
                "category": None,
                "extracted_category": None,
                "extracted_location": None,
                "extracted_destination": None,
                "clean_query": "",
                "recommended_action": "search_destinations",
                "suggested_action": "search_destinations"
            }

        # 1. Weather Intent Check
        if any(re.search(pat, q) for pat in cls.WEATHER_PATTERNS):
            loc = re.sub(r"\b(weather|forecast|temperature|rain|raining|snow|climate|wind|in|at|for|is|it|current|next\s+week)\b", "", q).strip()
            loc_clean = loc.title() if loc else None
            return {
                "intent": "weather",
                "confidence": 0.95,
                "category": "Weather",
                "extracted_category": "weather",
                "extracted_location": loc_clean,
                "extracted_destination": loc_clean,
                "clean_query": q,
                "recommended_action": "query_weather_provider",
                "suggested_action": "query_weather_provider"
            }

        # 2. Web Info / Current Advisory Intent Check
        if any(re.search(pat, q) for pat in cls.WEB_INFO_PATTERNS):
            return {
                "intent": "web_info",
                "confidence": 0.90,
                "category": "Advisory / Events",
                "extracted_category": "web_info",
                "extracted_location": None,
                "extracted_destination": None,
                "clean_query": q,
                "recommended_action": "query_web_search_provider",
                "suggested_action": "query_web_search_provider"
            }

        # 3. Place / POI Category Intent Check
        for cat_name, patterns in cls.PLACE_CATEGORY_PATTERNS.items():
            if any(re.search(pat, q) for pat in patterns):
                # Extract potential destination name
                stop_words = r"\b(cafes?|restaurants?|dhabas?|coffee|bakery|food|things\s+to\s+do|places\s+to\s+visit|in|near|at|around|bike\s+rentals?|scooters?|temples?|waterfalls?|viewpoints?|best|top|good|quiet|famous|hospitals?|pharmacy|chemist|scooter\s+hire|church(es)?|cathedrals?|chapels?|monaster(y|ies)|forts?|palaces?|ghats?)\b"
                loc = re.sub(stop_words, "", q).strip()
                loc_clean = loc.title() if len(loc) >= 3 else None
                cat_key = "coffee" if "Café" in cat_name else ("food" if "Food" in cat_name else ("attractions" if "Attraction" in cat_name else ("mobility" if "Mobility" in cat_name else ("essentials" if "Essential" in cat_name else ("culture" if "Culture" in cat_name else cat_name.lower())))))
                return {
                    "intent": "place",
                    "confidence": 0.88,
                    "category": cat_name,
                    "extracted_category": cat_key,
                    "extracted_location": loc_clean,
                    "extracted_destination": loc_clean,
                    "clean_query": q,
                    "recommended_action": "query_live_places_provider",
                    "suggested_action": "query_live_places_provider"
                }

        # 4. Default: Destination Search Intent
        clean_name = re.sub(r"\b(visit|go\s+to|travel\s+to|trip\s+to|explore)\b", "", q).strip()
        loc_clean = clean_name.title() if clean_name else q.title()
        return {
            "intent": "destination",
            "confidence": 0.85,
            "category": "Destination",
            "extracted_category": "destination",
            "extracted_location": loc_clean,
            "extracted_destination": loc_clean,
            "clean_query": q,
            "recommended_action": "search_destinations",
            "suggested_action": "search_destinations"
        }
