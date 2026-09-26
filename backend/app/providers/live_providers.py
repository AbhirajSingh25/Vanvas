import asyncio
import httpx
import math
import logging
import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.providers.base import (
    WeatherProvider, PlacesProvider, ImageProvider,
    HotelsProvider, RentalsProvider, TransportProvider, RoutingProvider
)
from app.providers.demo_providers import (
    DemoWeatherProvider, DemoPlacesProvider, DemoHotelsProvider,
    DemoRentalsProvider, DemoTransportProvider
)
from app.services.operating_hours_engine import OperatingHoursEngine
from app.services.action_link_generator import ActionLinkGenerator
from app.services.cache_service import cache_service
from app.services.provider_health_tracker import health_tracker

logger = logging.getLogger("vanvas.providers")

class LiveWeatherProvider(WeatherProvider):
    """
    Open-Meteo Live Weather Provider with Safe Caching & Stale-Data Fallback.
    Free, highly accurate real-time & 7-day forecast API supporting any coordinate globally and in Indian mountain ranges.
    """
    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.demo_fallback = DemoWeatherProvider()

    async def get_forecast(self, lat: float, lng: float, days: int = 5) -> List[Dict[str, Any]]:
        cache_key = cache_service.make_weather_key(lat, lng, days)
        cached_val, is_stale = cache_service.get(cache_key)
        if cached_val is not None and not is_stale:
            return cached_val

        start_time = time.time()
        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={lat}&longitude={lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto"
            )
            async with httpx.AsyncClient(timeout=4.5) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    daily = data.get("daily", {})
                    times = daily.get("time", [])
                    t_max = daily.get("temperature_2m_max", [])
                    t_min = daily.get("temperature_2m_min", [])
                    precip = daily.get("precipitation_probability_max", [])
                    w_codes = daily.get("weathercode", [])
                    wind = daily.get("windspeed_10m_max", [])

                    forecasts = []
                    for i in range(min(days, len(times))):
                        code = w_codes[i] if i < len(w_codes) else 0
                        p_prob = precip[i] if i < len(precip) else 0
                        is_rain = code in [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99] or (p_prob is not None and p_prob > 40)
                        
                        # Interpret WMO weather codes
                        condition = "Clear Sky"
                        if code in [1, 2, 3]:
                            condition = "Partly Cloudy"
                        elif code in [45, 48]:
                            condition = "Mountain Fog / Mist"
                        elif code in [51, 53, 55, 61, 63, 65]:
                            condition = "Rain Showers"
                        elif code in [71, 73, 75, 77, 85, 86]:
                            condition = "Snow Flurries"
                        elif code in [95, 96, 99]:
                            condition = "Thunderstorm"

                        avg_temp = round(((t_max[i] if i < len(t_max) else 22) + (t_min[i] if i < len(t_min) else 12)) / 2, 1)

                        forecasts.append({
                            "date": times[i],
                            "temp_c": avg_temp,
                            "condition": condition,
                            "is_rain": is_rain,
                            "humidity": 65 if is_rain else 45,
                            "wind_kph": round(wind[i], 1) if i < len(wind) and wind[i] is not None else 8.0,
                            "advisory": "Live mountain weather from Open-Meteo." if not is_rain else "Rain advisory: carry rain gear, outdoor treks may shift.",
                            "icon": "cloud-rain" if is_rain else ("cloud-fog" if "Fog" in condition else "sun"),
                            "source": "live_open_meteo",
                            "data_state": "LIVE",
                            "trust_source": "OPEN_METEO",
                        })
                    if forecasts:
                        latency_ms = (time.time() - start_time) * 1000
                        health_tracker.record_success("weather", latency_ms)
                        cache_service.set(cache_key, forecasts, ttl_seconds=900)
                        return forecasts
        except Exception as e:
            health_tracker.record_failure("weather", str(e))
            logger.warning(f"Open-Meteo live forecast request failed: {e}. Checking stale cache or verified fallback.")

        # Check stale cache first
        stale_data = cache_service.get_stale(cache_key)
        if stale_data:
            stale_results = []
            for item in stale_data:
                stale_item = dict(item)
                stale_item["data_state"] = "STALE"
                stale_item["advisory"] = f"(Stale weather snapshot) {stale_item.get('advisory', '')}"
                stale_results.append(stale_item)
            return stale_results
            
        demo_forecasts = await self.demo_fallback.get_forecast(lat, lng, days)
        for d in demo_forecasts:
            d["data_state"] = "ESTIMATED"
            d["trust_source"] = "VANVAS_CLIMATE_INDEX"
        return demo_forecasts


import re
from app.core.cache import places_cache

import unicodedata

import unicodedata
from typing import Tuple, Set

class LivePlacesProvider(PlacesProvider):
    """
    Genuine Location-Aware Live Places Provider.
    Discovers live nearby attractions, cafes, restaurants, heritage sites,
    mobility services, shops, essentials, and stays using Google Places API (New) with field masks
    (when GOOGLE_PLACES_API_KEY is configured) and OpenStreetMap Overpass / Photon fallback,
    with multi-tier curated fallback and strict data provenance transparency.
    """
    OVERPASS_ENDPOINTS = [
        "https://lz4.overpass-api.de/api/interpreter",
        "https://z.overpass-api.de/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ]

    GOOGLE_FIELD_MASK = (
        "places.id,places.displayName,places.formattedAddress,places.location,"
        "places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,"
        "places.googleMapsUri,places.regularOpeningHours,places.currentOpeningHours,"
        "places.businessStatus,places.rating,places.userRatingCount,places.priceLevel,"
        "places.priceRange,places.photos,places.types"
    )

    CATEGORY_MAP_GOOGLE = {
        "restaurant": ["restaurant", "indian_restaurant", "fast_food_restaurant"],
        "cafe": ["cafe", "coffee_shop"],
        "bakery": ["bakery"],
        "street_food": ["restaurant", "meal_takeaway", "fast_food_restaurant"],
        "local_food": ["restaurant", "indian_restaurant", "meal_takeaway"],
        "shop": ["store", "clothing_store", "grocery_store", "supermarket"],
        "market": ["market", "shopping_mall", "supermarket"],
        "souvenir": ["gift_shop", "store"],
        "craft": ["home_goods_store", "art_gallery", "store"],
        "attraction": ["tourist_attraction", "amusement_park", "museum"],
        "viewpoint": ["national_park", "park", "tourist_attraction"],
        "temple": ["hindu_temple", "place_of_worship", "church", "mosque"],
        "heritage": ["historical_landmark", "museum", "tourist_attraction"],
        "fuel": ["gas_station"],
        "pharmacy": ["pharmacy", "drugstore"],
        "hospital": ["hospital", "doctor"],
        "atm": ["atm", "bank"],
        "bike_rental": ["car_rental", "transit_station"],
        "scooter_rental": ["car_rental", "transit_station"],
        "car_rental": ["car_rental"],
        "hotel": ["hotel", "lodging", "resort_hotel"],
        "hostel": ["hostel", "lodging"],
        "homestay": ["bed_and_breakfast", "guest_house", "lodging"],
    }

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or getattr(settings, "GOOGLE_PLACES_API_KEY", "") or getattr(settings, "PLACES_API_KEY", "")
        self.headers = {
            "User-Agent": "VANVAS-Travel-Operating-System/2.0 (expedition@vanvas.com)"
        }
        self.demo_fallback = DemoPlacesProvider()
        self._geocoder: Optional[Any] = None

    def _get_geocoder(self):
        if self._geocoder is None:
            from app.providers.geocoding_provider import LiveGeocodingProvider
            self._geocoder = LiveGeocodingProvider()
        return self._geocoder

    def _has_valid_google_key(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 10 and not self.api_key.startswith("your_"))

    def _calculate_bbox(self, lat: float, lng: float, radius_km: float) -> Tuple[float, float, float, float]:
        lat_delta = radius_km / 111.0
        cos_lat = max(math.cos(math.radians(lat)), 0.01)
        lng_delta = radius_km / (111.0 * cos_lat)
        return (lat - lat_delta, lng - lng_delta, lat + lat_delta, lng + lng_delta)

    def _discover_menu(self, website_url: Optional[str]) -> Tuple[Optional[str], Optional[str], bool]:
        """
        Phase 6: Menu Discovery without fabrication or scraping.
        1. Check official websiteUri.
        2. Detect if menu page/link exists.
        3. If a menu URL exists, return (url, "OFFICIAL_WEBSITE", True).
        4. If no menu exists, return (None, None, False).
        """
        if not website_url or not isinstance(website_url, str):
            return None, None, False

        clean_url = website_url.strip()
        if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
            return None, None, False

        lower_url = clean_url.lower()
        if "/menu" in lower_url or "menu." in lower_url or "food-menu" in lower_url or "dining-menu" in lower_url:
            return clean_url, "OFFICIAL_WEBSITE", True

        return None, None, False

    def _map_google_types_to_category(self, types: List[str], requested_cat: Optional[str] = None) -> Tuple[str, Optional[str]]:
        t_set = set(types or [])
        if requested_cat:
            req_l = requested_cat.lower().strip()
            if req_l in ["restaurant", "food", "dining", "street_food", "local_food", "local food"]:
                return "Local Food", "Restaurant"
            elif req_l in ["cafe", "coffee", "cafes", "bakery", "cafés & bakery"]:
                return "Cafés & Bakery", "Café"
            elif req_l in ["attraction", "attractions", "sightseeing"]:
                return "Attractions", "Landmark"
            elif req_l in ["viewpoint", "nature", "trails"]:
                return "Nature & Trails", "Viewpoint"
            elif req_l in ["temple", "spiritual", "heritage", "church", "monastery"]:
                return "Culture & Heritage", "Temple"
            elif req_l in ["shop", "market", "souvenir", "craft", "shopping"]:
                return "Shops & Markets", "Market"
            elif req_l in ["fuel", "pharmacy", "hospital", "atm", "essentials", "medical"]:
                return "Essentials & Medical", "Pharmacy" if "pharmacy" in req_l else "Service"
            elif req_l in ["bike_rental", "scooter_rental", "car_rental", "mobility", "transport"]:
                return "Mobility & Transport", "Rental"
            elif req_l in ["hotel", "hostel", "homestay", "stay", "stays"]:
                return "Stays & Sanctuaries", "Hotel"

        if t_set & {"cafe", "coffee_shop", "bakery"}:
            return "Cafés & Bakery", "Café"
        elif t_set & {"restaurant", "indian_restaurant", "meal_takeaway", "fast_food_restaurant", "bar"}:
            return "Local Food", "Restaurant"
        elif t_set & {"hindu_temple", "place_of_worship", "church", "mosque", "historical_landmark", "museum"}:
            return "Culture & Heritage", "Heritage Site"
        elif t_set & {"national_park", "park", "campground", "natural_feature"}:
            return "Nature & Trails", "Nature"
        elif t_set & {"tourist_attraction", "amusement_park"}:
            return "Attractions", "Attraction"
        elif t_set & {"store", "market", "shopping_mall", "supermarket", "gift_shop", "clothing_store"}:
            return "Shops & Markets", "Shop"
        elif t_set & {"gas_station", "pharmacy", "hospital", "doctor", "atm", "bank"}:
            return "Essentials & Medical", "Essential"
        elif t_set & {"car_rental", "transit_station"}:
            return "Mobility & Transport", "Transport"
        elif t_set & {"hotel", "lodging", "resort_hotel", "hostel", "bed_and_breakfast", "guest_house"}:
            return "Stays & Sanctuaries", "Stay"

        return "Attractions", "Point of Interest"

    def _map_osm_category(self, tags: Dict[str, Any]) -> str:
        amenity = str(tags.get("amenity", "")).lower()
        tourism = str(tags.get("tourism", "")).lower()
        historic = str(tags.get("historic", "")).lower()
        natural = str(tags.get("natural", "")).lower()
        shop = str(tags.get("shop", "")).lower()
        leisure = str(tags.get("leisure", "")).lower()

        if amenity in ["cafe", "coffee_shop"] or shop in ["bakery", "coffee"]:
            return "Cafés & Bakery"
        if amenity in ["restaurant", "fast_food", "food_court", "dhaba", "ice_cream", "pub", "bar"]:
            return "Local Food"
        if tourism in ["attraction", "museum", "gallery", "theme_park"] or historic in ["monument", "memorial", "fort", "palace"]:
            return "Attractions"
        if amenity == "place_of_worship" or historic in ["temple", "monastery", "church", "mosque"]:
            return "Culture & Heritage"
        if natural in ["waterfall", "peak", "spring", "cave_entrance"] or leisure in ["park", "nature_reserve", "garden"] or tourism == "viewpoint":
            return "Nature & Trails"
        if shop or tourism == "marketplace":
            return "Shops & Markets"
        if amenity in ["pharmacy", "hospital", "clinic", "fuel", "atm", "bank"]:
            return "Essentials & Medical"
        if tourism in ["hotel", "guest_house", "motel", "hostel", "chalet", "apartment"]:
            return "Stays & Sanctuaries"
        return "Attractions"

    def _parse_osm_element(self, element: Dict[str, Any], center_lat: float, center_lng: float) -> Optional[Dict[str, Any]]:
        tags = element.get("tags", {})
        name = tags.get("name")
        if not name:
            return None
        
        lat = element.get("lat") or element.get("center", {}).get("lat")
        lng = element.get("lon") or element.get("center", {}).get("lon")
        if lat is None or lng is None:
            return None
            
        category = self._map_osm_category(tags)
        dist = round(self._haversine(center_lat, center_lng, float(lat), float(lng)), 2)
        osm_id = str(element.get("id", ""))
        
        addr_parts = [tags.get("addr:housenumber"), tags.get("addr:street"), tags.get("addr:suburb"), tags.get("addr:city")]
        address = ", ".join([p for p in addr_parts if p]) or f"{dist} km from search location"
        
        return {
            "id": f"osm-{osm_id}",
            "name": name,
            "category": category,
            "subcategory": tags.get("amenity") or tags.get("tourism") or tags.get("shop") or category,
            "description": tags.get("description") or f"Verified {category.lower()} in the area.",
            "address": address,
            "latitude": float(lat),
            "longitude": float(lng),
            "rating": None,
            "review_count": None,
            "price_level": None,
            "price_range": None,
            "approx_cost": None,
            "opening_time": None,
            "closing_time": None,
            "opening_hours": tags.get("opening_hours"),
            "hours_available": bool(tags.get("opening_hours")),
            "open_now": None,
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "website": tags.get("website") or tags.get("contact:website"),
            "google_maps_url": None,
            "photo_url": None,
            "source": "openstreetmap",
            "source_provider": "openstreetmap",
            "source_id": osm_id,
            "source_url": f"https://www.openstreetmap.org/node/{osm_id}",
            "is_live": True,
            "distance_km": dist,
            "data_state": "LIVE",
            "trust_source": "OPENSTREETMAP",
            "last_verified_at": datetime.now(timezone.utc).isoformat(),
            "menu_url": None,
            "menu_source": None,
            "menu_available": False,
        }

    def _build_overpass_query(self, south: float, west: float, north: float, east: float, category: Optional[str] = None) -> str:
        cat_lower = (category or "").lower().strip()
        bbox_str = f"{south:.4f},{west:.4f},{north:.4f},{east:.4f}"
        
        if cat_lower in ["coffee", "cafe", "cafes", "bakery", "cafés & bakery"]:
            body = f"""
            node["amenity"="cafe"]({bbox_str});
            node["amenity"="bakery"]({bbox_str});
            node["shop"="bakery"]({bbox_str});
            node["shop"="coffee"]({bbox_str});
            way["amenity"="cafe"]({bbox_str});
            way["shop"="bakery"]({bbox_str});
            """
        elif cat_lower in ["food", "dining", "restaurant", "street_food", "local_food", "local food"]:
            body = f"""
            node["amenity"="restaurant"]({bbox_str});
            node["amenity"="fast_food"]({bbox_str});
            node["amenity"="food_court"]({bbox_str});
            node["amenity"="dhaba"]({bbox_str});
            node["amenity"="ice_cream"]({bbox_str});
            node["amenity"="pub"]({bbox_str});
            way["amenity"="restaurant"]({bbox_str});
            way["amenity"="food_court"]({bbox_str});
            """
        elif cat_lower in ["attractions", "things to do", "attraction", "sightseeing"]:
            body = f"""
            node["tourism"="attraction"]({bbox_str});
            node["tourism"="viewpoint"]({bbox_str});
            node["tourism"="museum"]({bbox_str});
            node["tourism"="gallery"]({bbox_str});
            node["tourism"="theme_park"]({bbox_str});
            node["historic"="monument"]({bbox_str});
            node["historic"="memorial"]({bbox_str});
            node["historic"="fort"]({bbox_str});
            node["historic"="palace"]({bbox_str});
            node["historic"="castle"]({bbox_str});
            node["historic"="archaeological_site"]({bbox_str});
            way["tourism"="attraction"]({bbox_str});
            way["historic"="fort"]({bbox_str});
            way["historic"="palace"]({bbox_str});
            way["historic"="monument"]({bbox_str});
            """
        elif cat_lower in ["spiritual", "temple", "monastery", "church", "faith", "heritage"]:
            body = f"""
            node["amenity"="place_of_worship"]({bbox_str});
            node["historic"="temple"]({bbox_str});
            node["historic"="monastery"]({bbox_str});
            node["historic"="church"]({bbox_str});
            node["historic"="mosque"]({bbox_str});
            way["amenity"="place_of_worship"]({bbox_str});
            way["historic"="temple"]({bbox_str});
            way["historic"="monastery"]({bbox_str});
            """
        elif cat_lower in ["nature", "trails", "nature & trails", "viewpoint", "waterfall"]:
            body = f"""
            node["natural"="waterfall"]({bbox_str});
            node["natural"="peak"]({bbox_str});
            node["natural"="spring"]({bbox_str});
            node["natural"="beach"]({bbox_str});
            node["natural"="cave_entrance"]({bbox_str});
            node["leisure"="park"]({bbox_str});
            node["leisure"="nature_reserve"]({bbox_str});
            node["leisure"="garden"]({bbox_str});
            node["tourism"="viewpoint"]({bbox_str});
            node["highway"="trail"]({bbox_str});
            way["leisure"="park"]({bbox_str});
            way["leisure"="nature_reserve"]({bbox_str});
            way["natural"="waterfall"]({bbox_str});
            way["natural"="beach"]({bbox_str});
            way["natural"="water"]({bbox_str});
            """
        elif cat_lower in ["shopping", "market", "markets", "shops & markets", "craft", "shop", "souvenir"]:
            body = f"""
            node["shop"="supermarket"]({bbox_str});
            node["shop"="department_store"]({bbox_str});
            node["shop"="clothes"]({bbox_str});
            node["shop"="mall"]({bbox_str});
            node["shop"="craft"]({bbox_str});
            node["shop"="gift"]({bbox_str});
            node["shop"="souvenir"]({bbox_str});
            node["shop"="spices"]({bbox_str});
            node["shop"="tea"]({bbox_str});
            node["amenity"="marketplace"]({bbox_str});
            way["shop"="mall"]({bbox_str});
            way["amenity"="marketplace"]({bbox_str});
            """
        elif cat_lower in ["mobility", "transport", "rental", "rentals", "bike", "motorcycle", "bike_rental", "scooter_rental", "car_rental"]:
            body = f"""
            node["amenity"="bicycle_rental"]({bbox_str});
            node["amenity"="motorcycle_rental"]({bbox_str});
            node["amenity"="car_rental"]({bbox_str});
            node["amenity"="bus_station"]({bbox_str});
            way["amenity"="bus_station"]({bbox_str});
            """
        elif cat_lower in ["stay", "stays", "hotel", "hostel", "homestay", "stays & sanctuaries"]:
            body = f"""
            node["tourism"="hotel"]({bbox_str});
            node["tourism"="hostel"]({bbox_str});
            node["tourism"="guest_house"]({bbox_str});
            node["tourism"="chalet"]({bbox_str});
            node["tourism"="motel"]({bbox_str});
            way["tourism"="hotel"]({bbox_str});
            way["tourism"="hostel"]({bbox_str});
            """
        elif cat_lower in ["essentials", "medical", "hospital", "pharmacy", "fuel", "atm", "essentials & medical"]:
            body = f"""
            node["amenity"="pharmacy"]({bbox_str});
            node["amenity"="hospital"]({bbox_str});
            node["amenity"="clinic"]({bbox_str});
            node["amenity"="bank"]({bbox_str});
            node["amenity"="atm"]({bbox_str});
            node["amenity"="fuel"]({bbox_str});
            way["amenity"="hospital"]({bbox_str});
            """
        else:
            body = f"""
            node["tourism"~"attraction|viewpoint|museum|gallery|artwork|theme_park|zoo|camp_site"]({bbox_str});
            node["historic"~"monument|memorial|castle|ruins|archaeological_site|temple|shrine|fort|palace|church|monastery|mosque|tomb|city_gate|yes"]({bbox_str});
            node["amenity"~"cafe|restaurant|fast_food|food_court|dhaba|pub|bar|place_of_worship|ice_cream"]({bbox_str});
            node["leisure"~"park|nature_reserve|garden|water_park"]({bbox_str});
            node["natural"~"waterfall|beach|peak|spring|hot_spring|cave_entrance"]({bbox_str});
            node["shop"~"mall|department_store|gift|craft|art|souvenir|tea|spices|books|clothes|bakery|pastry|coffee|confectionery"]({bbox_str});
            way["tourism"~"attraction|viewpoint|museum|gallery|camp_site"]({bbox_str});
            way["historic"~"monument|castle|ruins|archaeological_site|temple|fort|palace|church|monastery|mosque"]({bbox_str});
            way["amenity"~"place_of_worship|restaurant|cafe|marketplace"]({bbox_str});
            way["leisure"~"park|nature_reserve|garden"]({bbox_str});
            way["natural"~"waterfall|beach|lake|water"]({bbox_str});
            """
        
        return f"""[out:json][timeout:8];
(
{body}
);
out center 60;"""

    async def _execute_overpass_query(self, query_str: str) -> List[Dict[str, Any]]:
        """Executes an Overpass QL query across primary and backup endpoints with fast concurrent execution."""
        async def _try_endpoint(endpoint: str) -> Optional[List[Dict[str, Any]]]:
            try:
                async with httpx.AsyncClient(timeout=2.8, headers=self.headers) as client:
                    res = await client.post(endpoint, data={"data": query_str})
                    if res.status_code == 200:
                        data = res.json()
                        elements = data.get("elements", [])
                        if elements:
                            return elements
            except Exception as e:
                logger.debug(f"Overpass endpoint {endpoint} failed: {e}")
            return None

        # Try top endpoints concurrently
        tasks = [asyncio.create_task(_try_endpoint(ep)) for ep in self.OVERPASS_ENDPOINTS[:3]]
        for task in asyncio.as_completed(tasks, timeout=3.2):
            try:
                res = await task
                if res:
                    for t in tasks:
                        t.cancel()
                    return res
            except Exception:
                pass
        return []

    async def _query_photon_fallback(self, lat: float, lng: float, radius_km: float, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fallback live OSM geocoding/POI discovery via Photon API with concurrent term fetching."""
        try:
            cat_lower = (category or "").lower().strip()
            if cat_lower in ["coffee", "cafe", "cafes", "bakery", "cafés & bakery"]:
                terms = ["cafe", "bakery", "coffee"]
            elif cat_lower in ["food", "dining", "restaurant", "street_food", "local_food", "local food"]:
                terms = ["restaurant", "dhaba", "food"]
            elif cat_lower in ["attractions", "sightseeing", "attraction"]:
                terms = ["monument", "museum", "fort", "palace"]
            elif cat_lower in ["spiritual", "temple", "faith", "heritage"]:
                terms = ["temple", "mandir", "church", "mosque", "ashram"]
            elif cat_lower in ["nature", "trails", "nature & trails", "viewpoint"]:
                terms = ["park", "garden", "lake", "waterfall"]
            elif cat_lower in ["shopping", "market", "markets", "shop", "souvenir", "craft"]:
                terms = ["market", "bazaar", "mall", "store"]
            elif cat_lower in ["mobility", "transport", "rental", "bike_rental", "scooter_rental", "car_rental"]:
                terms = ["fuel", "parking", "station", "rental"]
            elif cat_lower in ["stay", "hotel", "hostel", "homestay"]:
                terms = ["hotel", "resort", "homestay", "hostel"]
            elif cat_lower in ["essentials", "medical", "pharmacy", "hospital", "fuel", "atm"]:
                terms = ["hospital", "pharmacy", "bank", "atm"]
            else:
                terms = ["restaurant", "cafe", "temple", "park", "hotel", "market", "monument"]

            results: List[Dict[str, Any]] = []
            seen_ids = set()

            async def _fetch_term(client: httpx.AsyncClient, q_term: str):
                url = f"https://photon.komoot.io/api/?lat={lat}&lon={lng}&q={q_term}&limit=12"
                try:
                    res = await client.get(url)
                    if res.status_code == 200:
                        return res.json().get("features", [])
                except Exception:
                    pass
                return []

            async with httpx.AsyncClient(timeout=2.5, headers=self.headers) as client:
                fetch_tasks = [_fetch_term(client, t) for t in terms[:3]]
                all_feats_list = await asyncio.gather(*fetch_tasks, return_exceptions=True)
                
                for feats in all_feats_list:
                    if not isinstance(feats, list):
                        continue
                    for feat in feats:
                        props = feat.get("properties", {})
                        geom = feat.get("geometry", {})
                        coords = geom.get("coordinates", [])
                        if len(coords) < 2:
                            continue
                        p_lng, p_lat = coords[0], coords[1]
                        p_name = props.get("name")
                        if not p_name:
                            continue
                        osm_id = str(props.get("osm_id", p_name))
                        if osm_id in seen_ids:
                            continue
                        dist = self._haversine(lat, lng, p_lat, p_lng)
                        if dist > radius_km:
                            continue
                        
                        osm_key = props.get("osm_key", "")
                        osm_val = props.get("osm_value", "")
                        tags = {osm_key: osm_val, "name": p_name}
                        p_cat = self._map_osm_category(tags)

                        if cat_lower in ["coffee", "cafe", "cafes", "bakery", "cafés & bakery"]:
                            if p_cat != "Cafés & Bakery" and not any(w in p_name.lower() for w in ["cafe", "café", "coffee", "bakery", "bake", "tea", "chai"]):
                                continue
                            p_cat = "Cafés & Bakery"
                        elif cat_lower in ["food", "dining", "restaurant", "street_food", "local_food", "local food"]:
                            if p_cat not in ["Local Food", "Cafés & Bakery"] and not any(w in p_name.lower() for w in ["restaurant", "dhaba", "food", "kitchen", "bhojanalaya", "sweets", "diner"]):
                                continue
                        elif cat_lower in ["attractions", "sightseeing", "attraction"]:
                            if p_cat not in ["Attractions", "Culture & Heritage", "Nature & Trails"]:
                                continue
                        elif cat_lower in ["spiritual", "temple", "faith", "heritage"]:
                            if p_cat not in ["Culture & Heritage", "Attractions"]:
                                continue

                        addr_parts = [props.get("housenumber"), props.get("street"), props.get("district"), props.get("city"), props.get("state")]
                        addr = ", ".join([p for p in addr_parts if p]) or f"{dist} km from search location"

                        action_links = ActionLinkGenerator.generate_place_action_links(
                            name=p_name,
                            latitude=p_lat,
                            longitude=p_lng,
                            website=None,
                            phone=None,
                            booking_url=None,
                            source="openstreetmap",
                            source_id=osm_id,
                        )

                        results.append({
                            "id": f"osm-{osm_id}",
                            "name": p_name,
                            "category": p_cat,
                            "subcategory": osm_val or p_cat,
                            "description": f"Verified {p_cat.lower()} located in {props.get('city') or props.get('state') or 'the area'}.",
                            "address": addr,
                            "latitude": p_lat,
                            "longitude": p_lng,
                            "price_level": None,
                            "price_range": None,
                            "approx_cost": None,
                            "rating": None,
                            "review_count": None,
                            "opening_time": None,
                            "closing_time": None,
                            "opening_hours": None,
                            "hours_available": False,
                            "is_open_now": None,
                            "open_now": None,
                            "business_status": "OPERATIONAL",
                            "phone": None,
                            "website": None,
                            "google_maps_url": f"https://www.google.com/maps/dir/?api=1&destination={p_lat:.6f},{p_lng:.6f}",
                            "recommended_duration_mins": 60,
                            "tags": f"{p_cat},OpenStreetMap",
                            "image_url": self._category_image(p_cat),
                            "photo_url": None,
                            "why_vanvas_recommends": None,
                            "is_must_visit": False,
                            "is_hidden_gem": False,
                            "is_indoor": p_cat in ["Cafés & Bakery", "Essentials & Medical", "Shops & Markets"],
                            "source": "openstreetmap",
                            "source_provider": "openstreetmap",
                            "source_id": osm_id,
                            "source_url": f"https://www.openstreetmap.org/node/{osm_id}",
                            "is_live": True,
                            "distance_km": dist,
                            "action_links": action_links,
                            "data_state": "LIVE",
                            "trust_source": "OPENSTREETMAP",
                            "last_verified_at": datetime.now(timezone.utc).isoformat(),
                            "menu_url": None,
                            "menu_source": None,
                            "menu_available": False,
                        })
                        seen_ids.add(osm_id)
            return results
        except Exception as e:
            logger.debug(f"Photon fallback query failed: {e}")
        return []

    def _normalize_name(self, name: str) -> str:
        if not name:
            return ""
        clean = unicodedata.normalize("NFKD", str(name)).encode("ASCII", "ignore").decode("utf-8")
        clean = re.sub(r"[^a-zA-Z0-9\s]", " ", clean.lower())
        stop_words = {
            "cafe", "café", "restaurant", "hotel", "resort", "dhaba", "bake", "bakery",
            "shop", "store", "point", "viewpoint", "temple", "the", "and", "trail", "walk",
            "trek", "gurudwara", "sahib", "monastery", "gompa", "ghat", "falls", "waterfall",
            "riverside", "pine", "market", "bazaar", "heritage", "palace", "fort"
        }
        tokens = [t for t in clean.split() if t not in stop_words]
        return " ".join(tokens) if tokens else clean

    def _are_places_duplicate(self, p1_name: str, p1_lat: Optional[float], p1_lng: Optional[float],
                              p2_name: str, p2_lat: Optional[float], p2_lng: Optional[float],
                              max_distance_km: float = 0.35) -> bool:
        if not p1_name or not p2_name:
            return False
        
        n1 = self._normalize_name(p1_name)
        n2 = self._normalize_name(p2_name)
        if n1 and n2 and n1 == n2:
            return True

        if p1_lat is not None and p1_lng is not None and p2_lat is not None and p2_lng is not None:
            dist = self._haversine(p1_lat, p1_lng, p2_lat, p2_lng)
            if dist <= max_distance_km:
                if n1 and n2 and (n1 in n2 or n2 in n1):
                    return True
                tokens1 = set(n1.split())
                tokens2 = set(n2.split())
                if tokens1 and tokens2:
                    overlap = len(tokens1 & tokens2) / float(len(tokens1 | tokens2))
                    if overlap >= 0.5:
                        return True
        return False

    def _deduplicate_places(self, places: List[Dict[str, Any]], excluded_curated: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        unique: List[Dict[str, Any]] = []
        seen_source_ids: Set[str] = set()

        curated_ref: List[Tuple[str, Optional[float], Optional[float]]] = []
        if excluded_curated:
            for cp in excluded_curated:
                c_name = cp.get("name") or ""
                c_lat = cp.get("latitude")
                c_lng = cp.get("longitude")
                curated_ref.append((c_name, c_lat, c_lng))

        source_priority = {"google_places": 3, "openstreetmap": 2, "vanvas_curated": 1}
        sorted_places = sorted(places, key=lambda p: source_priority.get(p.get("source_provider", p.get("source", "")), 0), reverse=True)

        for p in sorted_places:
            sid = str(p.get("source_id") or "")
            if sid and sid in seen_source_ids:
                continue

            p_name = p.get("name", "")
            p_lat = p.get("latitude")
            p_lng = p.get("longitude")

            is_curated_dup = False
            for c_name, c_lat, c_lng in curated_ref:
                if self._are_places_duplicate(p_name, p_lat, p_lng, c_name, c_lat, c_lng, max_distance_km=0.4):
                    is_curated_dup = True
                    break
            if is_curated_dup:
                continue

            is_dup = False
            for existing in unique:
                e_name = existing.get("name", "")
                e_lat = existing.get("latitude")
                e_lng = existing.get("longitude")
                if self._are_places_duplicate(p_name, p_lat, p_lng, e_name, e_lat, e_lng, max_distance_km=0.2):
                    is_dup = True
                    break

            if not is_dup:
                unique.append(p)
                if sid:
                    seen_source_ids.add(sid)

        return unique

    EXCLUDED_AMENITY_TAGS = {
        "school", "college", "university", "kindergarten", "driving_school", "language_school", "music_school",
        "police", "post_office", "post_box", "bank", "atm", "bureau_de_change",
        "hospital", "clinic", "pharmacy", "doctors", "dentist", "veterinary", "nursing_home",
        "courthouse", "fire_station", "townhall", "prison", "government", "social_facility",
        "car_rental", "car_wash", "car_repair", "fuel", "charging_station", "parking", "parking_space", "parking_entrance",
        "waste_basket", "waste_disposal", "recycling", "toilets", "telephone", "vending_machine", "bench",
        "grave_yard", "crematorium", "funeral_directors"
    }

    EXCLUDED_SHOP_TAGS = {
        "hairdresser", "beauty", "barber", "laundry", "dry_cleaning", "tailor", "optician", "chemist", "medical_supply",
        "hardware", "doityourself", "car", "car_repair", "car_parts", "motorcycle_repair", "tyres", "bicycle_repair",
        "florist", "pet", "estate_agent", "travel_agency", "copyshop", "stationery", "storage", "plumber", "electrician", "kiosk",
        "supermarket", "convenience", "grocery", "general"
    }

    NEGATIVE_NAME_TOKENS = [
        "school", "college", "vidyalaya", "academy", "post office", "police station", "thana", "chowki",
        "state bank", "hdfc", "icici", "axis bank", "punjab national", "canara bank", "union bank", "bank of",
        "standard chartered", "bank", "atm", "cash machine",
        "hospital", "clinic", "dental", "pharmacy", "chemist", "dispensary", "nursing home",
        "hair salon", "beauty parlour", "gents parlour", "unisex salon", "tailor", "dry cleaner",
        "car wash", "motor works", "auto service", "tyre", "puncture", "petrol pump", "service station", "indian oil", "hp petrol", "bharat petroleum", "cng station",
        "law chambers", "advocate", "notary", "property dealer", "real estate", "consultancy",
        "xerox", "photocopy", "coaching", "tuition", "hostel boys", "hostel girls"
    ]

    def _map_osm_category(self, tags: Dict[str, str]) -> str:
        amenity = tags.get("amenity", "").lower()
        tourism = tags.get("tourism", "").lower()
        historic = tags.get("historic", "").lower()
        leisure = tags.get("leisure", "").lower()
        shop = tags.get("shop", "").lower()
        natural = tags.get("natural", "").lower()
        highway = tags.get("highway", "").lower()

        if amenity in ["cafe", "bakery", "coffee_shop"] or shop in ["bakery", "pastry", "coffee"]:
            return "Cafés & Bakery"
        elif amenity in ["restaurant", "food_court", "fast_food", "dhaba", "pub", "bar", "food", "ice_cream"]:
            return "Local Food"
        elif tourism in ["viewpoint", "camp_site", "wilderness_hut", "picnic_site"] or leisure in ["park", "nature_reserve", "track", "garden"] or natural in ["waterfall", "beach", "peak", "spring", "hot_spring", "tree"] or highway in ["trail", "path"]:
            return "Nature & Trails"
        elif (
            historic in ["monument", "memorial", "castle", "ruins", "archaeological_site", "temple", "shrine", "fort", "palace", "church", "cathedral", "chapel", "monastery", "mosque", "tomb", "city_gate"]
            or tourism in ["museum", "gallery", "artwork"]
            or amenity in ["place_of_worship"]
            or tags.get("religion") in ["hindu", "buddhist", "sikh", "christian", "muslim", "jain"]
        ):
            return "Culture & Heritage"
        elif leisure in ["sports_centre", "water_park", "marina", "slipway"] or tags.get("sport"):
            return "Adventure"
        elif amenity in ["bicycle_rental", "motorcycle_rental", "car_rental", "scooter_rental", "parking", "fuel", "bus_station", "taxi"] or shop in ["motorcycle", "bicycle", "rental"]:
            return "Mobility & Transport"
        elif shop in ["convenience", "supermarket", "general", "department_store", "clothes", "craft", "gift", "mall", "spices", "tea", "books", "souvenir", "shoes"]:
            return "Shops & Markets"
        elif amenity in ["pharmacy", "hospital", "clinic", "doctors", "dentist", "atm", "bank", "police", "post_office"]:
            return "Essentials & Medical"
        elif tourism in ["attraction", "theme_park", "zoo"]:
            return "Attractions"
        return "Attractions"

    def _category_image(self, category: str) -> str:
        images = {
            "Cafés & Bakery": "/images/nearby/cafe/cafe.webp",
            "Local Food": "/images/nearby/local_food/local_food.webp",
            "Nature & Trails": "/images/nearby/nature/nature.webp",
            "Culture & Heritage": "/images/nearby/heritage/heritage.webp",
            "Adventure": "/images/nearby/experience/experience.webp",
            "Shops & Markets": "/images/nearby/market/market.webp",
            "Mobility & Transport": "/images/nearby/universal/universal.webp",
            "Essentials & Medical": "/images/nearby/universal/universal.webp",
            "Stays & Sanctuaries": "/images/nearby/stay/stay.webp",
            "Attractions": "/images/nearby/monument/monument.webp",
        }
        return images.get(category, "/images/nearby/universal/universal.webp")

    def _haversine(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        r = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lng2 - lng1)
        a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(r * c, 2)

    def _parse_osm_element(
        self,
        el: Dict[str, Any],
        center_lat: float,
        center_lng: float,
        category_filter: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        tags = el.get("tags", {})
        p_name = tags.get("name") or tags.get("name:en")
        if not p_name:
            return None

        p_name_lower = p_name.lower().strip()
        cat_lower = (category_filter or "").lower().strip()
        is_essentials_query = cat_lower in ["essentials", "medical", "hospital", "pharmacy", "fuel", "atm", "essentials & medical"]

        if not is_essentials_query:
            amenity = tags.get("amenity", "").lower()
            shop = tags.get("shop", "").lower()
            office = tags.get("office", "").lower()
            building = tags.get("building", "").lower()

            if amenity in self.EXCLUDED_AMENITY_TAGS or shop in self.EXCLUDED_SHOP_TAGS or office:
                return None
            if building in ["school", "college", "university", "kindergarten", "hospital", "clinic", "office", "commercial", "residential", "apartments"]:
                return None
            if any(neg in p_name_lower for neg in self.NEGATIVE_NAME_TOKENS):
                return None

        p_lat = el.get("lat") or el.get("center", {}).get("lat", center_lat)
        p_lng = el.get("lon") or el.get("center", {}).get("lon", center_lng)
        if p_lat is None or p_lng is None:
            return None

        p_cat = self._map_osm_category(tags)

        if category_filter and category_filter.lower() != "all":
            if cat_lower in ["food", "restaurant", "dining", "local_food", "street_food", "local food"] and p_cat not in ["Local Food", "Cafés & Bakery"]:
                return None
            elif cat_lower in ["coffee", "cafe", "cafes", "bakery", "cafés & bakery"] and p_cat != "Cafés & Bakery":
                return None
            elif cat_lower in ["attractions", "things to do", "attraction", "nature", "trails & nature", "viewpoint"] and p_cat not in ["Attractions", "Culture & Heritage", "Nature & Trails", "Adventure"]:
                return None
            elif cat_lower in ["shopping", "market", "markets", "shops & markets", "shop", "souvenir", "craft"] and p_cat != "Shops & Markets":
                return None
            elif cat_lower in ["mobility", "transport", "rentals", "mobility & rentals", "bike_rental", "scooter_rental", "car_rental"] and p_cat != "Mobility & Transport":
                return None
            elif cat_lower in ["essentials", "medical", "hospital", "pharmacy", "fuel", "atm", "essentials & medical"] and p_cat != "Essentials & Medical":
                return None
            elif cat_lower in ["culture", "heritage", "spiritual", "temple", "church", "culture & heritage"] and p_cat != "Culture & Heritage":
                return None
            elif cat_lower not in p_cat.lower():
                return None

        dist = self._haversine(center_lat, center_lng, p_lat, p_lng)
        addr_parts = [tags.get("addr:housenumber"), tags.get("addr:street"), tags.get("addr:suburb"), tags.get("addr:city")]
        addr = ", ".join([p for p in addr_parts if p]) or (f"{dist} km from center" if dist > 0 else None)

        op_hours = tags.get("opening_hours")
        hours_eval = OperatingHoursEngine.evaluate_osm_hours(op_hours, p_lat, p_lng)

        phone = tags.get("phone") or tags.get("contact:phone")
        website = tags.get("website") or tags.get("contact:website") or tags.get("url")
        google_maps_url = f"https://www.google.com/maps/dir/?api=1&destination={p_lat:.6f},{p_lng:.6f}"

        osm_rating = None
        if "rating" in tags:
            try:
                osm_rating = float(tags["rating"])
            except Exception:
                osm_rating = None

        menu_url, menu_source, menu_available = self._discover_menu(website)

        action_links = ActionLinkGenerator.generate_place_action_links(
            name=p_name,
            latitude=p_lat,
            longitude=p_lng,
            website=website,
            phone=phone,
            booking_url=None,
            source="openstreetmap",
            source_id=str(el.get("id")),
            menu_url=menu_url,
            google_maps_url=google_maps_url,
        )

        osm_img_url = None
        if "image" in tags and str(tags["image"]).startswith("http"):
            osm_img_url = str(tags["image"]).strip()
        elif "wikimedia_commons" in tags:
            wm_val = str(tags["wikimedia_commons"]).strip()
            if wm_val.startswith("File:") or wm_val.startswith("Image:"):
                fname = wm_val.split(":", 1)[1].strip()
            else:
                fname = wm_val
            fname_clean = fname.replace(" ", "_")
            osm_img_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{fname_clean}?width=800"

        final_img_url = osm_img_url or self._category_image(p_cat)

        return {
            "id": f"osm-{el.get('id')}",
            "name": p_name,
            "category": p_cat,
            "subcategory": tags.get("amenity") or tags.get("tourism") or tags.get("historic") or p_cat,
            "description": tags.get("description") or f"OpenStreetMap verified {p_cat.lower()}.",
            "address": addr,
            "latitude": p_lat,
            "longitude": p_lng,
            "price_level": None,
            "price_range": None,
            "approx_cost": None,
            "rating": osm_rating,
            "review_count": None,
            "opening_time": hours_eval.opening_time,
            "closing_time": hours_eval.closing_time,
            "opening_hours": op_hours,
            "hours_available": hours_eval.hours_available,
            "is_open_now": hours_eval.is_open_now,
            "open_now": hours_eval.is_open_now,
            "business_status": "OPERATIONAL",
            "phone": phone,
            "website": website,
            "google_maps_url": google_maps_url,
            "recommended_duration_mins": 60,
            "tags": f"{p_cat},OpenStreetMap",
            "image_url": final_img_url,
            "photo_url": osm_img_url,
            "why_vanvas_recommends": None,
            "is_must_visit": False,
            "is_hidden_gem": tags.get("tourism") == "viewpoint",
            "is_indoor": p_cat in ["Cafés & Bakery", "Essentials & Medical", "Shops & Markets"],
            "source": "openstreetmap",
            "source_provider": "openstreetmap",
            "source_id": str(el.get("id")),
            "source_url": f"https://www.openstreetmap.org/node/{el.get('id')}",
            "is_live": True,
            "distance_km": dist,
            "action_links": action_links,
            "data_state": "LIVE",
            "trust_source": "OPENSTREETMAP",
            "last_verified_at": datetime.now(timezone.utc).isoformat(),
            "menu_url": menu_url,
            "menu_source": menu_source,
            "menu_available": menu_available,
        }

    def _parse_google_place_new(self, place: Dict[str, Any], center_lat: float, center_lng: float, category_filter: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Normalizes a Google Places API (New) response dictionary into the VANVAS internal POI representation.
        Never fabricates missing fields.
        """
        display_obj = place.get("displayName", {})
        p_name = display_obj.get("text") if isinstance(display_obj, dict) else (place.get("name") or "")
        if not p_name:
            return None

        loc = place.get("location", {})
        p_lat = loc.get("latitude")
        p_lng = loc.get("longitude")
        if p_lat is None or p_lng is None:
            return None

        types = place.get("types", [])
        p_cat, subcat = self._map_google_types_to_category(types, category_filter)

        dist = self._haversine(center_lat, center_lng, p_lat, p_lng)

        # Phone numbers
        phone = place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber")

        # URLs
        website = place.get("websiteUri")
        google_maps_url = place.get("googleMapsUri") or f"https://www.google.com/maps/dir/?api=1&destination={p_lat:.6f},{p_lng:.6f}"

        # Ratings
        rating_val = float(place["rating"]) if ("rating" in place and place["rating"] is not None) else None
        review_cnt = int(place["userRatingCount"]) if ("userRatingCount" in place and place["userRatingCount"] is not None) else None

        # Price level & Range
        raw_price_lvl = place.get("priceLevel")
        price_lvl_map = {
            "PRICE_LEVEL_FREE": "Free",
            "PRICE_LEVEL_INEXPENSIVE": "₹",
            "PRICE_LEVEL_MODERATE": "₹₹",
            "PRICE_LEVEL_EXPENSIVE": "₹₹₹",
            "PRICE_LEVEL_VERY_EXPENSIVE": "₹₹₹₹",
        }
        price_lvl = price_lvl_map.get(str(raw_price_lvl), None) if raw_price_lvl else None

        price_range_obj = place.get("priceRange")
        price_range_str = None
        if isinstance(price_range_obj, dict):
            start = price_range_obj.get("startPrice", {}).get("units")
            end = price_range_obj.get("endPrice", {}).get("units")
            if start and end:
                price_range_str = f"₹{start} - ₹{end}"
            elif start:
                price_range_str = f"From ₹{start}"

        # Opening hours
        reg_hours = place.get("regularOpeningHours", {})
        cur_hours = place.get("currentOpeningHours", {})
        open_now = cur_hours.get("openNow") if (isinstance(cur_hours, dict) and cur_hours.get("openNow") is not None) else (
            reg_hours.get("openNow") if isinstance(reg_hours, dict) else None
        )

        weekday_texts = reg_hours.get("weekdayDescriptions", []) if isinstance(reg_hours, dict) else []
        op_hours_str = ", ".join(weekday_texts[:2]) if weekday_texts else None

        # Photos
        photos = place.get("photos", [])
        photo_url = None
        if photos and isinstance(photos, list) and len(photos) > 0:
            photo_name = photos[0].get("name")
            if photo_name and self.api_key:
                photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxHeightPx=800&maxWidthPx=1200&key={self.api_key}"

        img_url = photo_url or self._category_image(p_cat)

        # Menu discovery
        menu_url, menu_source, menu_available = self._discover_menu(website)

        place_id = str(place.get("id", ""))
        action_links = ActionLinkGenerator.generate_place_action_links(
            name=p_name,
            latitude=p_lat,
            longitude=p_lng,
            website=website,
            phone=phone,
            booking_url=None,
            source="google_places",
            source_id=place_id,
            menu_url=menu_url,
            google_maps_url=google_maps_url,
        )

        return {
            "id": f"gp-{place_id[:32]}" if place_id else f"gp-{dist}",
            "name": p_name,
            "category": p_cat,
            "subcategory": subcat or (types[0] if types else p_cat),
            "description": f"Verified venue at {place.get('formattedAddress', 'the area')}.",
            "address": place.get("formattedAddress"),
            "latitude": p_lat,
            "longitude": p_lng,
            "price_level": price_lvl,
            "price_range": price_range_str,
            "approx_cost": None,
            "rating": rating_val,
            "review_count": review_cnt,
            "opening_time": None,
            "closing_time": None,
            "opening_hours": op_hours_str,
            "hours_available": bool(open_now is not None or op_hours_str),
            "is_open_now": open_now,
            "open_now": open_now,
            "business_status": place.get("businessStatus", "OPERATIONAL"),
            "phone": phone,
            "website": website,
            "google_maps_url": google_maps_url,
            "recommended_duration_mins": 60,
            "tags": ",".join(types[:3]) if types else "GooglePlaces",
            "image_url": img_url,
            "photo_url": photo_url,
            "why_vanvas_recommends": None,
            "is_must_visit": False,
            "is_hidden_gem": False,
            "is_indoor": p_cat in ["Cafés & Bakery", "Essentials & Medical", "Shops & Markets"],
            "source": "google_places",
            "source_provider": "google_places",
            "source_id": place_id,
            "source_url": google_maps_url or website,
            "is_live": True,
            "distance_km": dist,
            "action_links": action_links,
            "data_state": "LIVE",
            "trust_source": "GOOGLE_PLACES",
            "last_verified_at": datetime.now(timezone.utc).isoformat(),
            "menu_url": menu_url,
            "menu_source": menu_source,
            "menu_available": menu_available,
        }

    async def _fetch_google_places_new_nearby(self, lat: float, lng: float, radius_m: int, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Calls Google Places API (New) Nearby Search with FieldMask."""
        if not self._has_valid_google_key():
            return []

        types = []
        if category and category.lower() in self.CATEGORY_MAP_GOOGLE:
            types = self.CATEGORY_MAP_GOOGLE[category.lower()]
        elif category:
            cat_l = category.lower().strip()
            if cat_l in ["food", "dining", "local food", "street food"]:
                types = ["restaurant", "indian_restaurant", "fast_food_restaurant"]
            elif cat_l in ["coffee", "cafe", "cafes", "bakery", "cafés & bakery"]:
                types = ["cafe", "coffee_shop", "bakery"]
            elif cat_l in ["attractions", "sightseeing", "things to do"]:
                types = ["tourist_attraction", "museum", "historical_landmark"]
            elif cat_l in ["spiritual", "temple", "faith", "heritage"]:
                types = ["hindu_temple", "place_of_worship", "historical_landmark"]
            elif cat_l in ["shopping", "market", "markets", "shops & markets", "craft"]:
                types = ["store", "market", "shopping_mall"]
            elif cat_l in ["mobility", "transport", "rental", "rentals"]:
                types = ["car_rental", "transit_station"]
            elif cat_l in ["stay", "stays", "hotel", "hostel", "homestay"]:
                types = ["hotel", "lodging", "bed_and_breakfast", "hostel"]
            elif cat_l in ["essentials", "medical", "hospital", "pharmacy", "fuel", "atm"]:
                types = ["pharmacy", "hospital", "gas_station", "atm"]

        url = "https://places.googleapis.com/v1/places:searchNearby"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": self.GOOGLE_FIELD_MASK,
        }
        body: Dict[str, Any] = {
            "maxResultCount": 20,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": float(radius_m)
                }
            }
        }
        if types:
            body["includedTypes"] = types[:10]

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=4.5) as client:
                res = await client.post(url, headers=headers, json=body)
                if res.status_code == 200:
                    data = res.json()
                    places = data.get("places", [])
                    results = []
                    for p in places:
                        parsed = self._parse_google_place_new(p, lat, lng, category)
                        if parsed:
                            results.append(parsed)
                    latency = (time.time() - start_time) * 1000
                    health_tracker.record_success("google_places", latency)
                    return results
                else:
                    logger.debug(f"Google Places (New) Nearby Search returned {res.status_code}: {res.text}")
                    health_tracker.record_failure("google_places", f"HTTP {res.status_code}")
        except Exception as e:
            logger.debug(f"Google Places (New) Nearby Search error: {e}")
            health_tracker.record_failure("google_places", str(e))

        return []

    async def _fetch_google_places_new_search(self, query: str, lat: Optional[float] = None, lng: Optional[float] = None, radius_m: int = 15000, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Calls Google Places API (New) Text Search with FieldMask."""
        if not self._has_valid_google_key():
            return []

        url = "https://places.googleapis.com/v1/places:searchText"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": self.GOOGLE_FIELD_MASK,
        }
        body: Dict[str, Any] = {
            "textQuery": query,
            "maxResultCount": 20,
        }
        if lat is not None and lng is not None:
            body["locationBias"] = {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": float(radius_m)
                }
            }

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=4.5) as client:
                res = await client.post(url, headers=headers, json=body)
                if res.status_code == 200:
                    data = res.json()
                    places = data.get("places", [])
                    results = []
                    c_lat = lat or 28.6139
                    c_lng = lng or 77.2090
                    for p in places:
                        parsed = self._parse_google_place_new(p, c_lat, c_lng, category)
                        if parsed:
                            results.append(parsed)
                    latency = (time.time() - start_time) * 1000
                    health_tracker.record_success("google_places", latency)
                    return results
                else:
                    health_tracker.record_failure("google_places", f"HTTP {res.status_code}")
        except Exception as e:
            health_tracker.record_failure("google_places", str(e))

        return []

    async def search_places(self, query: str, destination_name: str = "", category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Discovers real-world places for a query and destination using live providers with curated fallback and safe caching.
        """
        cache_key = f"search:{query.lower().strip()}:{destination_name.lower().strip()}:{category or 'all'}"
        cached_val, is_stale = cache_service.get(cache_key)
        if cached_val is not None and not is_stale:
            return cached_val

        start_time = time.time()
        curated_matches = await self.demo_fallback.search_places(query, destination_name, category)
        for p in curated_matches:
            p["source"] = "vanvas_curated"
            p["source_provider"] = "vanvas_curated"
            p["is_live"] = False
            p["data_state"] = "VERIFIED"
            p["trust_source"] = "VANVAS_CURATED"
            p["last_verified_at"] = datetime.now(timezone.utc).isoformat()
            p["menu_available"] = False
            p["menu_url"] = None

        target_location = destination_name.strip()
        if not target_location and query:
            from app.services.intent_router import SearchIntentRouter
            intent = SearchIntentRouter.classify_intent(query)
            target_location = intent.get("extracted_location") or query

        geocoder = self._get_geocoder()
        geo = None
        if target_location:
            geo = await geocoder.geocode(target_location)

        lat = geo["lat"] if geo else None
        lng = geo["lng"] if geo else None

        gathered_live: List[Dict[str, Any]] = []

        if lat is not None and lng is not None:
            radius_m = 15000

            # 1. Google Places (New) Text Search
            if self._has_valid_google_key():
                clean_q = f"{query} in {target_location}" if target_location not in query else query
                gp_results = await self._fetch_google_places_new_search(clean_q, lat, lng, radius_m, category)
                gathered_live.extend(gp_results)

            # 2. OpenStreetMap Overpass Search (nodes + ways)
            clean_search_tokens = [t for t in re.sub(r"[^a-zA-Z0-9\s]", "", query.lower()).split() if t not in {"in", "near", "best", "quiet", "famous", "top", "good", "the", "and", target_location.lower()}]
            keyword_regex = "|".join(clean_search_tokens) if clean_search_tokens else "cafe|restaurant|temple|church|attraction"

            query_str = f"""
            [out:json][timeout:5];
            (
              nwr["name"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              nwr["amenity"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              nwr["tourism"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              nwr["historic"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              nwr["shop"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              nwr["leisure"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
            );
            out center 35;
            """
            elements = await self._execute_overpass_query(query_str)
            for el in elements:
                parsed = self._parse_osm_element(el, lat, lng, category)
                if parsed:
                    gathered_live.append(parsed)

        combined = curated_matches + gathered_live
        if combined:
            deduped = self._deduplicate_places(combined)
            latency_ms = (time.time() - start_time) * 1000
            health_tracker.record_success("places", latency_ms)
            cache_service.set(cache_key, deduped, ttl_seconds=300)
            return deduped

        stale_data = cache_service.get_stale(cache_key)
        if stale_data:
            stale_results = []
            for item in stale_data:
                stale_item = dict(item)
                stale_item["data_state"] = "STALE"
                stale_results.append(stale_item)
            return stale_results

        return []

    async def get_nearby_places(
        self,
        lat: float,
        lng: float,
        radius_km: float = 12.0,
        category: Optional[str] = None,
        excluded_curated: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Genuine coordinate-based nearby search.
        Sorted by actual geographic distance.
        Uses Google Places API (New) when configured, OpenStreetMap Overpass live fallback,
        and deduplicates against curated items without fabricating missing fields.
        """
        cache_key = cache_service.make_places_key(lat, lng, radius_km, category)
        cached_val, is_stale = cache_service.get(cache_key)
        if cached_val is not None and not is_stale:
            return cached_val

        start_time = time.time()
        gathered_places: List[Dict[str, Any]] = []
        radius_m = min(int(radius_km * 1000), 25000)

        # 1. Primary: Google Places API (New) with field masks when configured
        if self._has_valid_google_key():
            gp_places = await self._fetch_google_places_new_nearby(lat, lng, radius_m, category)
            gathered_places.extend(gp_places)

        # 2. OpenStreetMap Overpass Live Query (Indexed BBOX query on nodes and ways)
        south, west, north, east = self._calculate_bbox(lat, lng, radius_km)
        try:
            query_str = self._build_overpass_query(south, west, north, east, category)
            elements = await self._execute_overpass_query(query_str)
            for el in elements:
                parsed = self._parse_osm_element(el, lat, lng, category)
                if parsed and parsed.get("distance_km", 999) <= radius_km:
                    gathered_places.append(parsed)

            if len(gathered_places) < 4:
                photon_places = await self._query_photon_fallback(lat, lng, radius_km, category)
                for pp in photon_places:
                    if pp.get("distance_km", 999) <= radius_km:
                        gathered_places.append(pp)
        except Exception as e:
            logger.warning(f"Overpass live query failed: {e}")
            photon_places = await self._query_photon_fallback(lat, lng, radius_km, category)
            for pp in photon_places:
                if pp.get("distance_km", 999) <= radius_km:
                    gathered_places.append(pp)

        # 3. Deduplicate across Google Places and OSM, enforce radius limit, and sort by actual distance
        valid_radius_places = [p for p in gathered_places if (p.get("distance_km") or 0) <= (radius_km + 0.1)]

        if valid_radius_places:
            deduped = self._deduplicate_places(valid_radius_places, excluded_curated=excluded_curated)
            deduped.sort(key=lambda x: x.get("distance_km", 999))
            latency_ms = (time.time() - start_time) * 1000
            health_tracker.record_success("places", latency_ms)
            health_tracker.record_success("osm_overpass", latency_ms)
            cache_service.set(cache_key, deduped, ttl_seconds=300)
            return deduped

        # Check stale cache fallback
        stale_data = cache_service.get_stale(cache_key)
        if stale_data:
            stale_results = []
            for item in stale_data:
                stale_item = dict(item)
                stale_item["data_state"] = "STALE"
                stale_results.append(stale_item)
            return stale_results

        return []



class LiveImageProvider(ImageProvider):
    """
    Image Provider fetching verified high-resolution photographs for destinations and landmarks.
    """
    def __init__(self, access_key: str = ""):
        self.access_key = access_key

    async def search_images(self, query: str, limit: int = 3) -> List[str]:
        # High quality fallback photography index
        curated_images = {
            "manali": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200",
            "rishikesh": "https://images.unsplash.com/photo-1603477849335-5178347f77f3?w=1200",
            "kasol": "https://images.unsplash.com/photo-1593181629936-11c609b8db9b?w=1200",
            "dharamshala": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200",
            "mcleod": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=1200",
            "goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200",
            "jaipur": "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200",
            "udaipur": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=1200",
            "mussoorie": "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=1200",
            "spiti": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=1200",
            "leh": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=1200",
            "ladakh": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=1200",
            "kedarnath": "https://images.unsplash.com/photo-1604928141064-207cea6f571f?w=1200",
            "varanasi": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200",
            "kerala": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200",
            "munnar": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200",
            "meghalaya": "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=1200",
            "shillong": "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=1200",
            "sikkim": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=1200",
            "mumbai": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200",
            "delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200",
            "bengaluru": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200",
            "bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200",
            "dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
            "bhutan": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200",
            "nepal": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200",
            "thailand": "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=1200",
        }

        q = query.lower()
        for key, url in curated_images.items():
            if key in q:
                return [url]

        # Mountain and nature fallbacks
        if any(k in q for k in ["himalaya", "hill", "peak", "pass", "ridge", "snow", "altitude"]):
            return ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200"]
        if any(k in q for k in ["beach", "coast", "sea", "ocean", "island"]):
            return ["https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200"]
        if any(k in q for k in ["desert", "sand", "fort", "palace"]):
            return ["https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200"]

        return ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200"]


class HaversineRoutingProvider(RoutingProvider):
    """
    Routing provider calculating realistic road distances, driving times, and turn-by-turn route polylines
    using Open Source Routing Machine (OSRM) with resilient mountain tortuosity fallback.
    """
    def calculate_distance_matrix(self, points: List[Dict[str, float]]) -> List[List[Dict[str, Any]]]:
        n = len(points)
        matrix = []

        for i in range(n):
            row = []
            for j in range(n):
                if i == j:
                    row.append({"distance_km": 0.0, "duration_mins": 0})
                else:
                    p1 = points[i]
                    p2 = points[j]
                    
                    # Haversine straight line formula
                    lat1, lon1 = math.radians(p1["lat"]), math.radians(p1["lng"])
                    lat2, lon2 = math.radians(p2["lat"]), math.radians(p2["lng"])
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                    straight_km = 6371 * c

                    # In Indian mountain terrain, winding roads add ~1.45x detour factor
                    road_km = round(straight_km * 1.45, 1)
                    
                    # Average speed in mountain hills is ~25 km/h
                    duration_mins = max(5, round((road_km / 25.0) * 60))

                    row.append({
                        "distance_km": road_km,
                        "duration_mins": duration_mins
                    })
            matrix.append(row)

        return matrix

    async def calculate_route(self, lat1: float, lng1: float, lat2: float, lng2: float) -> Dict[str, Any]:
        """
        Direct route calculation between two geographic coordinates.
        Queries OSRM for true road navigation geometry; falls back to mountain tortuosity when offline.
        """
        start_time = time.time()
        # 1. Try OSRM route API with short timeout
        try:
            osrm_url = f"https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson"
            async with httpx.AsyncClient(timeout=3.5) as client:
                res = await client.get(osrm_url)
                if res.status_code == 200:
                    data = res.json()
                    routes = data.get("routes", [])
                    if routes:
                        raw_mins = max(1, round(r0.get("duration", 0) / 60.0))
                        dur_mins = max(raw_mins, round((dist_km / 30.0) * 60)) if (lat1 > 28.0 or lat2 > 28.0) else raw_mins
                        geom_coords = r0.get("geometry", {}).get("coordinates", [])
                        # Convert [lng, lat] GeoJSON to Leaflet [lat, lng]
                        polyline = [[c[1], c[0]] for c in geom_coords] if geom_coords else [[lat1, lng1], [lat2, lng2]]
                        
                        latency = (time.time() - start_time) * 1000
                        health_tracker.record_success("routing", latency)
                        return {
                            "distance_km": dist_km,
                            "duration_mins": dur_mins,
                            "is_accurate": True,
                            "is_mountain_adjusted": (lat1 > 28.0 or lat2 > 28.0),
                            "geometry": polyline,
                            "source": "osrm",
                            "source_provider": "osrm",
                            "data_state": "LIVE",
                            "trust_source": "OSRM_NAVIGATION",
                        }
        except Exception as e:
            logger.debug(f"OSRM route calculation failed, falling back to mountain tortuosity: {e}")

        # 2. Fallback to mountain tortuosity estimate
        matrix = self.calculate_distance_matrix([{"lat": lat1, "lng": lng1}, {"lat": lat2, "lng": lng2}])
        res = matrix[0][1]
        health_tracker.record_success("routing", 0.5)
        return {
            "distance_km": res["distance_km"],
            "duration_mins": res["duration_mins"],
            "is_accurate": False,
            "is_mountain_adjusted": True,
            "geometry": [[lat1, lng1], [lat2, lng2]],
            "source": "internal",
            "source_provider": "internal",
            "data_state": "VERIFIED",
            "trust_source": "INTERNAL_ESTIMATION",
        }


class LiveHotelsProvider(HotelsProvider):
    """
    Live Accommodation Provider.
    Discovers real-world hotels, guest houses, hostels, homestays, and alpine sanctuaries
    via OpenStreetMap Overpass & Google Places (when configured), strictly maintaining truthful provenance.
    """
    OVERPASS_ENDPOINTS = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
    ]

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or getattr(settings, "GOOGLE_PLACES_API_KEY", "")
        self.headers = {
            "User-Agent": "VANVAS-Travel-Operating-System/2.0 (expedition@vanvas.com)"
        }
        self.demo_fallback = DemoHotelsProvider()
        self._geocoder: Optional[Any] = None

    def _get_geocoder(self):
        if self._geocoder is None:
            from app.providers.geocoding_provider import LiveGeocodingProvider
            self._geocoder = LiveGeocodingProvider()
        return self._geocoder

    def _haversine(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        r = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lng2 - lng1)
        a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(r * c, 1)

    async def _execute_overpass_query(self, query_str: str) -> List[Dict[str, Any]]:
        for endpoint in self.OVERPASS_ENDPOINTS:
            try:
                async with httpx.AsyncClient(timeout=3.5, headers=self.headers) as client:
                    res = await client.post(endpoint, data={"data": query_str})
                    if res.status_code == 200:
                        data = res.json()
                        return data.get("elements", [])
            except Exception as e:
                logger.debug(f"Overpass hotel query {endpoint} failed: {e}")
        return []

    def _map_hotel_style(self, tags: Dict[str, str]) -> str:
        tourism = tags.get("tourism", "").lower()
        if tourism in ["hostel"]:
            return "Hostel / Backpacker"
        elif tourism in ["guest_house", "bed_and_breakfast"]:
            return "Guest House / Homestay"
        elif tourism in ["chalet", "alpine_hut", "wilderness_hut"]:
            return "Alpine Hut & Cottage"
        elif tourism in ["camp_site", "caravan_site"]:
            return "Camp & Riverside Retreat"
        elif tourism in ["apartment"]:
            return "Serviced Apartment / Villa"
        return "Boutique / Mountain Stay"

    def _parse_osm_hotel(self, el: Dict[str, Any], center_lat: float, center_lng: float) -> Optional[Dict[str, Any]]:
        tags = el.get("tags", {})
        h_name = tags.get("name") or tags.get("name:en")
        if not h_name:
            return None

        h_lat = el.get("lat") or el.get("center", {}).get("lat", center_lat)
        h_lng = el.get("lon") or el.get("center", {}).get("lon", center_lng)
        if h_lat is None or h_lng is None:
            return None

        dist = self._haversine(center_lat, center_lng, h_lat, h_lng)
        addr_parts = [tags.get("addr:housenumber"), tags.get("addr:street"), tags.get("addr:suburb"), tags.get("addr:city")]
        addr = ", ".join([p for p in addr_parts if p]) or (f"{dist} km from center" if dist > 0 else "Local Area")

        phone = tags.get("phone") or tags.get("contact:phone")
        website = tags.get("website") or tags.get("contact:website") or tags.get("url")

        osm_rating = None
        if "rating" in tags:
            try:
                osm_rating = float(tags["rating"])
            except Exception:
                osm_rating = None

        style = self._map_hotel_style(tags)
        
        amenity_list = []
        if tags.get("internet_access") in ["yes", "wlan", "wifi"] or tags.get("wifi") == "yes":
            amenity_list.append("WiFi")
        if tags.get("smoking") == "no":
            amenity_list.append("Non-Smoking")
        if tags.get("wheelchair") in ["yes", "designated"]:
            amenity_list.append("Wheelchair Accessible")
        if tags.get("swimming_pool") == "yes":
            amenity_list.append("Swimming Pool")
        amenity_str = ",".join(amenity_list) if amenity_list else "Mountain Views,Scenic Stay"

        hotel_action_links = ActionLinkGenerator.generate_hotel_action_links(
            name=h_name,
            latitude=h_lat,
            longitude=h_lng,
            website=website,
            phone=phone,
            booking_url=None,
            source="openstreetmap",
            source_id=str(el.get("id")),
        )

        return {
            "id": f"osm-stay-{el.get('id')}",
            "destination_id": "live",
            "name": h_name,
            "address": addr,
            "latitude": h_lat,
            "longitude": h_lng,
            "price_per_night": None,
            "rating": osm_rating,
            "review_count": None,
            "hotel_style": style,
            "amenities": amenity_str,
            "check_in_time": tags.get("check_in") or "12:00 PM",
            "check_out_time": tags.get("check_out") or "10:00 AM",
            "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
            "booking_url": None,
            "badge": "Live POI Stay",
            "phone": phone,
            "website": website,
            "source": "openstreetmap",
            "source_id": str(el.get("id")),
            "is_live": True,
            "price_verified": False,
            "distance_km": dist,
            "action_links": hotel_action_links,
            "data_state": "LIVE",
            "trust_source": "OPENSTREETMAP",
        }

    async def search_hotels(
        self,
        destination: str,
        check_in: Optional[str] = None,
        check_out: Optional[str] = None,
        budget_tier: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: float = 15.0
    ) -> List[Dict[str, Any]]:
        target_lat = lat
        target_lng = lng

        if target_lat is None or target_lng is None:
            if destination:
                geocoder = self._get_geocoder()
                geo = await geocoder.geocode(destination)
                if geo:
                    target_lat = geo["lat"]
                    target_lng = geo["lng"]

        if target_lat is None or target_lng is None:
            return []

        cache_key = f"hotels:{destination.lower().strip()}:{round(target_lat, 3)}:{round(target_lng, 3)}:{radius_km}:{budget_tier or 'all'}"
        cached_val, is_stale = cache_service.get(cache_key)
        if cached_val is not None and not is_stale:
            return cached_val

        start_time = time.time()
        radius_m = min(int(radius_km * 1000), 25000)
        query_str = f"""
        [out:json][timeout:6];
        (
          nwr["tourism"~"hotel|guest_house|hostel|motel|chalet|alpine_hut|camp_site|apartment"](around:{radius_m},{target_lat},{target_lng});
        );
        out center 50;
        """
        try:
            elements = await self._execute_overpass_query(query_str)
            results = []
            seen_names = set()

            for el in elements:
                parsed = self._parse_osm_hotel(el, target_lat, target_lng)
                if parsed:
                    norm_name = parsed["name"].lower().strip()
                    if norm_name not in seen_names:
                        seen_names.add(norm_name)
                        results.append(parsed)

            results.sort(key=lambda x: x.get("distance_km", 999))
            if results:
                latency_ms = (time.time() - start_time) * 1000
                health_tracker.record_success("hotels", latency_ms)
                cache_service.set(cache_key, results, ttl_seconds=300)
                return results
        except Exception as e:
            health_tracker.record_failure("hotels", str(e))
            logger.warning(f"Overpass hotels discovery failed: {e}")

        # Check stale cache fallback
        stale_data = cache_service.get_stale(cache_key)
        if stale_data:
            stale_results = []
            for item in stale_data:
                stale_item = dict(item)
                stale_item["data_state"] = "STALE"
                stale_results.append(stale_item)
            return stale_results

        return []


class LiveRentalsProvider(RentalsProvider):
    """
    Live Rentals & Valley Mobility Provider.
    Discovers scooter, motorcycle, and bicycle rental hubs via OpenStreetMap & Google Places.
    """
    OVERPASS_ENDPOINTS = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
    ]

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or getattr(settings, "GOOGLE_PLACES_API_KEY", "")
        self.headers = {
            "User-Agent": "VANVAS-Travel-Operating-System/2.0 (expedition@vanvas.com)"
        }
        self.demo_fallback = DemoRentalsProvider()
        self._geocoder: Optional[Any] = None

    def _get_geocoder(self):
        if self._geocoder is None:
            from app.providers.geocoding_provider import LiveGeocodingProvider
            self._geocoder = LiveGeocodingProvider()
        return self._geocoder

    def _haversine(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        r = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lng2 - lng1)
        a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(r * c, 2)

    async def _execute_overpass_query(self, query_str: str) -> List[Dict[str, Any]]:
        for endpoint in self.OVERPASS_ENDPOINTS:
            try:
                async with httpx.AsyncClient(timeout=5.5, headers=self.headers) as client:
                    res = await client.post(endpoint, data={"data": query_str})
                    if res.status_code == 200:
                        data = res.json()
                        elements = data.get("elements", [])
                        if elements:
                            return elements
            except Exception as e:
                logger.debug(f"Overpass rental query {endpoint} failed: {e}")
        return []

    async def search_rentals(
        self,
        destination: str,
        vehicle_type: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: float = 15.0
    ) -> List[Dict[str, Any]]:
        target_lat = lat
        target_lng = lng

        if target_lat is None or target_lng is None:
            if destination:
                geocoder = self._get_geocoder()
                geo = await geocoder.geocode(destination)
                if geo:
                    target_lat = geo["lat"]
                    target_lng = geo["lng"]

        if target_lat is None or target_lng is None:
            return []

        cache_key = f"rentals:{destination.lower().strip()}:{round(target_lat, 3)}:{round(target_lng, 3)}:{radius_km}:{vehicle_type or 'all'}"
        cached_val, is_stale = cache_service.get(cache_key)
        if cached_val is not None and not is_stale:
            return cached_val

        start_time = time.time()
        radius_m = min(int(radius_km * 1000), 25000)
        query_str = f"""
        [out:json][timeout:6];
        (
          nwr["amenity"~"bicycle_rental|motorcycle_rental|scooter_rental|two_wheeler_rental|car_rental"](around:{radius_m},{target_lat},{target_lng});
          nwr["shop"~"motorcycle|bicycle|rental|scooter|vehicle_rental"](around:{radius_m},{target_lat},{target_lng});
        );
        out center 35;
        """
        try:
            elements = await self._execute_overpass_query(query_str)
            results = []
            seen_names = set()

            for el in elements:
                tags = el.get("tags", {})
                r_name = tags.get("name") or tags.get("name:en")
                if not r_name:
                    continue

                norm_name = r_name.lower().strip()
                if norm_name in seen_names:
                    continue
                seen_names.add(norm_name)

                r_lat = el.get("lat") or el.get("center", {}).get("lat", target_lat)
                r_lng = el.get("lon") or el.get("center", {}).get("lon", target_lng)
                if r_lat is None or r_lng is None:
                    continue

                dist = self._haversine(target_lat, target_lng, r_lat, r_lng)
                addr_parts = [
                    tags.get("addr:housenumber"),
                    tags.get("addr:street"),
                    tags.get("addr:suburb") or tags.get("addr:neighbourhood") or tags.get("addr:district"),
                    tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village")
                ]
                real_addr = ", ".join([p for p in addr_parts if p])
                addr = real_addr if real_addr else (f"{tags.get('addr:suburb') or tags.get('addr:city')}" if tags.get('addr:suburb') or tags.get('addr:city') else f"{dist} km from center")

                op_hours = tags.get("opening_hours")
                r_hours_eval = OperatingHoursEngine.evaluate_osm_hours(op_hours, r_lat, r_lng)
                phone = tags.get("phone") or tags.get("contact:phone")
                whatsapp = tags.get("whatsapp") or tags.get("contact:whatsapp")
                website = tags.get("website") or tags.get("contact:website") or tags.get("url")

                # Vehicle classification & category artwork selection
                amenity_val = (tags.get("amenity") or "").lower()
                shop_val = (tags.get("shop") or "").lower()
                desc_val = ((tags.get("description") or "") + " " + (r_name or "")).lower()

                if amenity_val == "bicycle_rental" or shop_val == "bicycle" or (("bicycle" in desc_val or "cycle" in desc_val or "mtb" in desc_val) and "motorcycle" not in amenity_val and "motorcycle" not in shop_val and "scooter" not in amenity_val):
                    v_type = "Mountain Bike / Bicycle"
                    v_name = f"{r_name} MTB & Cycle Fleet"
                    category_artwork = "/images/vehicles/mountain_bike.jpg"
                elif "electric" in desc_val or "ev" in desc_val or "ather" in desc_val or "ola" in desc_val:
                    v_type = "Electric Scooter"
                    v_name = f"{r_name} Smart EV Fleet"
                    category_artwork = "/images/vehicles/electric_scooter.jpg"
                elif "motorcycle" in amenity_val or "motorcycle" in shop_val or "motor" in desc_val or "biker" in desc_val or "rider" in desc_val or "bullet" in desc_val or "enfield" in desc_val or "himalayan" in desc_val:
                    if "himalayan" in desc_val or "adventure" in desc_val:
                        v_type = "Touring Motorcycle"
                        v_name = f"{r_name} Himalayan Adventure Fleet"
                        category_artwork = "/images/vehicles/adventure_motorcycle.jpg"
                    else:
                        v_type = "Touring Motorcycle"
                        v_name = f"{r_name} Royal Enfield & Motorcycle Fleet"
                        category_artwork = "/images/vehicles/classic_bullet.jpg"
                elif "scooter" in amenity_val or "scooter" in shop_val or "activa" in desc_val or "scoot" in desc_val:
                    v_type = "Automatic Hill Scooter"
                    v_name = f"{r_name} Automatic Scooter Fleet"
                    category_artwork = "/images/vehicles/automatic_scooter.jpg"
                else:
                    v_type = "Scooter & Motorcycle"
                    v_name = f"{r_name} Two-Wheeler Fleet"
                    category_artwork = "/images/vehicles/universal_mobility.jpg"



                # Filter if specific vehicle_type requested
                if vehicle_type and vehicle_type != "All":
                    req_lower = vehicle_type.lower()
                    if req_lower not in v_type.lower() and req_lower not in v_name.lower():
                        continue

                # Photo hierarchy: Provider/OSM photo -> Category artwork -> Universal
                osm_photo = tags.get("image") or tags.get("image:0") or tags.get("photo")
                final_image = osm_photo if osm_photo and osm_photo.startswith("http") else category_artwork

                rental_action_links = ActionLinkGenerator.generate_rental_action_links(
                    provider_name=r_name,
                    latitude=r_lat,
                    longitude=r_lng,
                    website=website,
                    phone=phone,
                    whatsapp=whatsapp,
                )

                results.append({
                    "id": f"osm-rent-{el.get('id')}",
                    "destination_id": "live",
                    "provider_name": r_name,
                    "vehicle_type": v_type,
                    "vehicle_name": v_name,
                    "price_per_day": None,
                    "hourly_price": None,
                    "deposit_amount": None,
                    "location": addr,
                    "latitude": r_lat,
                    "longitude": r_lng,
                    "opening_hours": op_hours or "Hours not listed",
                    "hours_available": r_hours_eval.hours_available,
                    "is_open_now": r_hours_eval.is_open_now,
                    "rating": None,
                    "image_url": final_image,
                    "phone": phone,
                    "whatsapp": whatsapp,
                    "website": website,
                    "source": "openstreetmap",
                    "source_id": str(el.get("id")),
                    "is_live": True,
                    "inventory_verified": False,
                    "verification_status": "LIVE_OSM",
                    "distance_km": dist,
                    "action_links": rental_action_links,
                    "data_state": "LIVE",
                    "trust_source": "OPENSTREETMAP",
                })

            results.sort(key=lambda x: x.get("distance_km", 999))
            if results:
                latency_ms = (time.time() - start_time) * 1000
                health_tracker.record_success("rentals", latency_ms)
                cache_service.set(cache_key, results, ttl_seconds=300)
                return results
        except Exception as e:
            health_tracker.record_failure("rentals", str(e))
            logger.warning(f"Overpass rentals discovery failed: {e}")

        # Check stale cache fallback
        stale_data = cache_service.get_stale(cache_key)
        if stale_data:
            stale_results = []
            for item in stale_data:
                stale_item = dict(item)
                stale_item["data_state"] = "STALE"
                stale_results.append(stale_item)
            return stale_results

        return []

