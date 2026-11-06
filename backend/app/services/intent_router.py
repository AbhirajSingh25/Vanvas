"""
Enhanced Search Intent Router for VANVAS.
Integrates destination resolution, landmark discovery, category filtering,
dietary detection, mobility search, and meteorological queries.
"""
import re
import unicodedata
from typing import Dict, Any, Optional

def clean_norm(s: str) -> str:
    if not s:
        return ""
    s_norm = unicodedata.normalize('NFKD', str(s)).encode('ASCII', 'ignore').decode('utf-8')
    return s_norm.lower().strip()

class SearchIntentRouter:
    """
    Intelligent Search Intent Router for VANVAS.
    Routes user queries to the most appropriate provider layer:
    - destination: Geocoding & destination resolution (e.g. "Ujjain", "Munsiyari", "Spiti", "Paris")
    - place: Location-aware POI discovery or landmark lookup (e.g. "Key Monastery", "Chicham Bridge", "Hawa Mahal", "Taj Mahal", "Tungnath", "Pangong Tso")
    - category_search: Category + location searches (e.g. "Cafés in Landour", "Bike rentals in Spiti", "Vegetarian food in Jaipur", "Hotels in Kasol")
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
        "Cafés & Bakery": [r"\bcafes?\b", r"\bcaf[eé]s?\b", r"\bbaker(y|ies)\b", r"\bcoffee\b", r"\btea\b", r"\bbreakfast\b"],
        "Local Food": [r"\brestaurants?\b", r"\bdhabas?\b", r"\bfood\b", r"\bdine\b", r"\beat\b", r"\blunch\b", r"\bdinner\b", r"\bstreet\s*food\b", r"\bvegetarian\b", r"\bveg\b", r"\bvegan\b", r"\bnon[- ]?veg\b", r"\bseafood\b", r"\bmomos?\b", r"\bthali\b", r"\bcuisine\b", r"\bdishes?\b", r"\bsweets?\b"],
        "Attractions": [r"\bthings\s+to\s+do\b", r"\bplaces\s+to\s+visit\b", r"\battractions?\b", r"\bsightseeing\b", r"\blandmarks?\b", r"\bmuseums?\b", r"\bphotograph(y|ic)\b"],
        "Nature & Trails": [r"\btrails?\b", r"\btreks?\b", r"\bwaterfalls?\b", r"\bviewpoints?\b", r"\bhikes?\b", r"\blakes?\b"],
        "Culture & Heritage": [r"\btemples?\b", r"\bforts?\b", r"\bpalaces?\b", r"\bmonaster(y|ies)\b", r"\bghats?\b", r"\baartis?\b", r"\bchurch(es)?\b", r"\bcathedrals?\b", r"\bchapels?\b", r"\bashrams?\b", r"\bshrines?\b"],
        "Adventure": [r"\brafting\b", r"\bparagliding\b", r"\bkayaking\b", r"\bzipline\b", r"\bcamping\b", r"\badventure\b"],
        "Shopping": [r"\bmarkets?\b", r"\bshops?\b", r"\bshopping\b", r"\bbazaars?\b", r"\bgrocery\b", r"\bmalls?\b"],
        "Mobility": [r"\bbike\s+rentals?\b", r"\bscooter\s+rentals?\b", r"\brent\s+a\s+bike\b", r"\btaxis?\b", r"\bcabs?\b", r"\brentals?\b", r"\bhire\b", r"\bscooters?\b", r"\bmotorcycles?\b", r"\bvehicles?\b", r"\bself[- ]?drive\b"],
        "Stays": [r"\bhotels?\b", r"\bresorts?\b", r"\bhomestays?\b", r"\bhostels?\b", r"\bguesthouses?\b", r"\bstays?\b", r"\baccommodations?\b"],
        "Essentials & Medical": [r"\bhospitals?\b", r"\bpharmac(y|ies)\b", r"\bchemists?\b", r"\bdoctors?\b", r"\bmedical\b", r"\bfuel\b", r"\bpetrol\b", r"\batms?\b", r"\bpolice\b"]
    }

    LOCATION_ALIAS_MAP = {
        "landour": "mussoorie",
        "mcleodganj": "dharamshala",
        "mcleod ganj": "dharamshala",
        "dharamkot": "dharamshala",
        "old manali": "manali",
        "kaza": "spiti",
        "tabo": "spiti",
        "tapovan": "rishikesh",
        "bhowali": "kainchi-dham",
        "chopta": "tungnath-chandrashila",
        "spiti valley": "spiti",
    }

    DESTINATION_SLUGS = {
        "agra", "alwar", "alwar-siliserh", "chandigarh", "damdama", "damdama-sohna",
        "dehradun", "dharamshala", "goa", "jaipur", "jaisalmer", "kainchi-dham",
        "kasol", "lansdowne", "leh", "manali", "mathura", "mathura-vrindavan",
        "morni-hills", "munnar", "murthal", "mussoorie", "neemrana", "rishikesh",
        "sariska", "sariska-bhangarh", "spiti", "tungnath", "tungnath-chandrashila",
        "udaipur", "varanasi", "ujjain", "munsiyari", "tirthan", "tirthan-valley",
        "tirthan valley", "zanskar", "chitkul", "landour", "paris", "bali",
        "tokyo", "rome", "london", "dubai", "indore"
    }

    _LANDMARK_MAP = None

    @classmethod
    def _build_landmark_map(cls) -> Dict[str, Any]:
        if cls._LANDMARK_MAP is not None:
            return cls._LANDMARK_MAP
        mapping = {}
        try:
            from app.seed.canonical_dataset import ADDITIONAL_PLACES_BY_DEST, CANONICAL_26_DESTINATIONS
            dest_name_map = {d["slug"]: d["name"] for d in CANONICAL_26_DESTINATIONS}
            
            # Temporary storage to prioritize monuments over cafes/shops
            candidates = []
            
            for d_slug, places in ADDITIONAL_PLACES_BY_DEST.items():
                d_name = dest_name_map.get(d_slug, d_slug.title())
                for p in places:
                    name_raw = p.get("name", "")
                    name_clean = clean_norm(name_raw)
                    slug_clean = p.get("slug", "").replace("-", " ").lower()
                    cat = p.get("category", "Attractions")
                    cat_key = "coffee" if "Café" in cat or "Cafe" in cat else ("food" if "Food" in cat else ("culture" if "Culture" in cat else ("mobility" if "Mobility" in cat else "attractions")))
                    item = {
                        "name": name_raw,
                        "slug": p.get("slug"),
                        "destination_slug": d_slug,
                        "destination_name": d_name,
                        "category": cat,
                        "category_key": cat_key,
                        "image_url": p.get("image_url", ""),
                        "approx_cost": p.get("approx_cost", 0.0),
                        "price_level": p.get("price_level", "Free"),
                        "why_vanvas_recommends": p.get("why_vanvas_recommends", ""),
                        "is_primary": cat in ["Must Visit", "Culture & Heritage", "Nature & Trails", "Attractions"]
                    }
                    candidates.append((item, name_clean, slug_clean))

            # Sort so primary monuments come first
            candidates.sort(key=lambda x: 0 if x[0]["is_primary"] else 1)

            for item, name_clean, slug_clean in candidates:
                mapping[slug_clean] = item
                clean_title = re.sub(r"\(.*?\)", "", name_clean).strip()
                if clean_title and clean_title not in mapping:
                    mapping[clean_title] = item
                first_part = clean_title.split("&")[0].split("-")[0].strip()
                if len(first_part) >= 4 and first_part not in mapping:
                    mapping[first_part] = item

            # Explicit famous landmark keywords with deterministic exact assignments
            explicit_landmarks = [
                ("key monastery", "key-monastery", "spiti"),
                ("ki monastery", "key-monastery", "spiti"),
                ("key gompa", "key-monastery", "spiti"),
                ("chicham bridge", "chicham-bridge", "spiti"),
                ("chicham suspension bridge", "chicham-bridge", "spiti"),
                ("chandratal", "chandratal-lake", "spiti"),
                ("chandratal lake", "chandratal-lake", "spiti"),
                ("dhankar monastery", "dhankar-monastery", "spiti"),
                ("tabo monastery", "tabo-monastery", "spiti"),
                ("pin valley", "pin-valley-national-park", "spiti"),
                ("langza", "langza-buddha-fossil-village", "spiti"),
                ("hikkim", "hikkim-highest-post-office", "spiti"),
                ("komic", "komic-highest-village-monastery", "spiti"),
                ("hawa mahal", "hawa-mahal", "jaipur"),
                ("palace of winds", "hawa-mahal", "jaipur"),
                ("amber fort", "amber-fort", "jaipur"),
                ("nahargarh", "nahargarh-fort", "jaipur"),
                ("nahargarh fort", "nahargarh-fort", "jaipur"),
                ("jal mahal", "jal-mahal", "jaipur"),
                ("taj mahal", "taj-mahal", "agra"),
                ("fatehpur sikri", "fatehpur-sikri", "agra"),
                ("mehtab bagh", "mehtab-bagh", "agra"),
                ("tungnath", "tungnath-temple", "tungnath-chandrashila"),
                ("tungnath temple", "tungnath-temple", "tungnath-chandrashila"),
                ("chandrashila", "chandrashila-summit", "tungnath-chandrashila"),
                ("chandrashila summit", "chandrashila-summit", "tungnath-chandrashila"),
                ("chopta bugyal", "chopta-meadows-bugyal", "tungnath-chandrashila"),
                ("deoria tal", "deoria-tal-lake", "tungnath-chandrashila"),
                ("pangong tso", "pangong-tso", "leh"),
                ("pangong lake", "pangong-tso", "leh"),
                ("leh palace", "leh-palace", "leh"),
                ("thiksey monastery", "thiksey-monastery", "leh"),
                ("hadimba temple", "hadimba-devi-cedar-forest-temple", "manali"),
                ("hadimba", "hadimba-devi-cedar-forest-temple", "manali"),
                ("solang valley", "solang-valley-adventure-hub", "manali"),
                ("triund", "triund-crest", "dharamshala"),
                ("bhangarh fort", "bhangarh-fort-ruins", "sariska-bhangarh"),
                ("amrik sukhdev", "amrik-sukhdev-dhaba", "murthal"),
                ("kainchi dham", "neem-karoli-baba-ashram", "kainchi-dham"),
                ("city palace", "city-palace-udaipur", "udaipur"),
                ("lake pichola", "lake-pichola-sunset-boat-voyage", "udaipur"),
                ("kashi vishwanath", "kashi-vishwanath-corridor", "varanasi"),
                ("dashashwamedh ghat", "dashashwamedh-ghat-ganga-aarti", "varanasi"),
                ("assi ghat", "assi-ghat-sunrise-subah-e-banaras", "varanasi"),
            ]

            for term, slug, dest in explicit_landmarks:
                # Find matching place candidate
                for item, name_c, slug_c in candidates:
                    if item["destination_slug"] == dest and item["slug"] == slug:
                        mapping[term] = item
                        break

        except Exception as e:
            pass
            
        cls._LANDMARK_MAP = mapping
        return mapping

    @classmethod
    def match_landmark(cls, query: str) -> Optional[Dict[str, Any]]:
        l_map = cls._build_landmark_map()
        q_norm = clean_norm(query)
        q_clean = re.sub(r"\b(visit|go\s+to|explore|see|check\s+out|where\s+is|tell\s+me\s+about)\b", "", q_norm).strip()
        if not q_clean or len(q_clean) < 3:
            return None
            
        # 1. Exact match
        if q_clean in l_map:
            return l_map[q_clean]
            
        # 2. Key phrase lookup with strict bounds
        for k, meta in l_map.items():
            if len(k) >= 4:
                if q_clean == k:
                    return meta
                if q_clean in k:
                    if len(q_clean) >= len(k) * 0.7:
                        return meta
                elif k in q_clean:
                    if len(k) >= len(q_clean) * 0.6:
                        return meta
        return None

    @classmethod
    def classify_intent(cls, query: str) -> Dict[str, Any]:
        q_raw = query.strip()
        q = clean_norm(q_raw)
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

        # 2. Web Info / Current Advisory Intent Check (e.g. "Is Rohtang Pass open today?", "travel advisory for Kashmir")
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

        # 3. Direct Destination Slug Check (e.g. "Zanskar", "Ujjain", "Spiti", "Manali", "Munsiyari", "Paris")
        clean_dest = re.sub(r"\b(visit|go\s+to|travel\s+to|trip\s+to|explore)\b", "", q).strip()
        if clean_dest in cls.DESTINATION_SLUGS:
            return {
                "intent": "destination",
                "confidence": 0.98,
                "category": "Destination",
                "extracted_category": "destination",
                "extracted_location": clean_dest.title(),
                "extracted_destination": clean_dest.title(),
                "destination_slug": clean_dest.lower().replace(" ", "-"),
                "clean_query": q,
                "recommended_action": "search_destinations",
                "suggested_action": "search_destinations"
            }

        # 4. Famous Landmark Interception Check (e.g. "Key Monastery", "Chicham Bridge", "Hawa Mahal", "Taj Mahal", "Tungnath", "Pangong Tso")
        # Only when query doesn't explicitly look like a category search ("cafes in...", "things to do in...", "bike rental in...")
        is_category_query = any(w in q for w in ["in ", "near ", "around ", "things to do", "places to visit", "best ", "top ", "rental in", "rentals in"])
        if not is_category_query:
            matched_landmark = cls.match_landmark(q)
            if matched_landmark:
                return {
                    "intent": "place",
                    "confidence": 0.96,
                    "category": matched_landmark["category"],
                    "extracted_category": matched_landmark["category_key"],
                    "extracted_location": matched_landmark["destination_name"],
                    "extracted_destination": matched_landmark["destination_name"],
                    "extracted_place": matched_landmark["name"],
                    "place_slug": matched_landmark["slug"],
                    "destination_slug": matched_landmark["destination_slug"],
                    "image_url": matched_landmark.get("image_url"),
                    "why_vanvas_recommends": matched_landmark.get("why_vanvas_recommends"),
                    "clean_query": q,
                    "recommended_action": "query_live_places_provider",
                    "suggested_action": "query_live_places_provider"
                }

        # 5. Colloquial Indian Destination Aliases (e.g. "Banaras" -> Varanasi, "Chopta" -> Tungnath, "Bombay" -> Mumbai)
        from app.services.destination_aliases import resolve_alias_to_slug
        alias_res = resolve_alias_to_slug(clean_dest or q)
        if alias_res:
            target_slug, alias_display = alias_res
            return {
                "intent": "destination",
                "confidence": 0.98,
                "category": "Destination",
                "extracted_category": "destination",
                "extracted_location": alias_display,
                "extracted_destination": alias_display,
                "destination_slug": target_slug,
                "clean_query": q,
                "recommended_action": "search_destinations",
                "suggested_action": "search_destinations"
            }

        # 4. Place / POI Category Intent Check (e.g. "Cafés in Landour", "Bike rentals in Spiti", "Vegetarian food in Jaipur", "Hotels in Kasol")
        for cat_name, patterns in cls.PLACE_CATEGORY_PATTERNS.items():
            if any(re.search(pat, q) for pat in patterns):
                stop_words = r"\b(cafes?|caf[eé]s?|restaurants?|dhabas?|coffee|bakery|food|vegetarian|veg|vegan|non[- ]?veg|seafood|momos?|thali|cuisine|dishes?|things\s+to\s+do|places\s+to\s+visit|in|near|at|around|bike\s+rentals?|scooters?|scooter\s+rentals?|motorcycles?|car\s+rentals?|rentals?|hire|hotels?|resorts?|homestays?|hostels?|stays?|temples?|waterfalls?|viewpoints?|best|top|good|quiet|famous|hospitals?|pharmacy|chemist|scooter\s+hire|church(es)?|cathedrals?|chapels?|monaster(y|ies)|forts?|palaces?|ghats?|treks?|trails?|photography|locations?)\b"
                loc = re.sub(stop_words, "", q).strip()
                loc = re.sub(r"\s+", " ", loc).strip()
                loc_clean = loc.title() if len(loc) >= 3 else None
                
                # Check location alias
                dest_slug = None
                if loc.lower() in cls.LOCATION_ALIAS_MAP:
                    dest_slug = cls.LOCATION_ALIAS_MAP[loc.lower()]
                elif loc_clean:
                    dest_slug = loc.lower().replace(" ", "-")

                # Dietary detection
                dietary = None
                if "vegetarian" in q or " veg " in f" {q} ":
                    dietary = "Vegetarian"
                elif "vegan" in q:
                    dietary = "Vegan"
                elif "seafood" in q:
                    dietary = "Seafood"
                elif "non-veg" in q or "non veg" in q:
                    dietary = "Non-Vegetarian"

                cat_key = "coffee" if "Café" in cat_name or "Cafe" in cat_name else ("food" if "Food" in cat_name else ("attractions" if "Attraction" in cat_name else ("mobility" if "Mobility" in cat_name else ("stay" if "Stay" in cat_name else ("essentials" if "Essential" in cat_name else ("culture" if "Culture" in cat_name else cat_name.lower()))))))
                
                return {
                    "intent": "place",
                    "sub_intent": "category_search" if loc_clean else "place",
                    "is_category_search": bool(loc_clean),
                    "confidence": 0.92,
                    "category": cat_name,
                    "extracted_category": cat_key,
                    "extracted_location": loc_clean,
                    "extracted_destination": loc_clean,
                    "destination_slug": dest_slug,
                    "dietary": dietary,
                    "clean_query": q,
                    "recommended_action": "filter_category",
                    "suggested_action": "filter_category"
                }

        # 5. Fallback Landmark Check (if query contained filler words)
        matched_landmark = cls.match_landmark(q)
        if matched_landmark:
            return {
                "intent": "place",
                "confidence": 0.90,
                "category": matched_landmark["category"],
                "extracted_category": matched_landmark["category_key"],
                "extracted_location": matched_landmark["destination_name"],
                "extracted_destination": matched_landmark["destination_name"],
                "extracted_place": matched_landmark["name"],
                "place_slug": matched_landmark["slug"],
                "destination_slug": matched_landmark["destination_slug"],
                "image_url": matched_landmark.get("image_url"),
                "why_vanvas_recommends": matched_landmark.get("why_vanvas_recommends"),
                "clean_query": q,
                "recommended_action": "query_live_places_provider",
                "suggested_action": "query_live_places_provider"
            }

        # 6. Default: Destination Search Intent
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
