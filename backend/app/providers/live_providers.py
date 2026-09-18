import httpx
import math
import logging
from typing import List, Dict, Any, Optional
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

logger = logging.getLogger("vanvas.providers")

class LiveWeatherProvider(WeatherProvider):
    """
    Open-Meteo Live Weather Provider
    Free, highly accurate real-time & 7-day forecast API supporting any coordinate globally and in Indian mountain ranges.
    """
    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.demo_fallback = DemoWeatherProvider()

    async def get_forecast(self, lat: float, lng: float, days: int = 5) -> List[Dict[str, Any]]:
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
                            "source": "live_open_meteo"
                        })
                    if forecasts:
                        return forecasts
        except Exception as e:
            logger.warning(f"Open-Meteo live forecast request failed: {e}. Using verified seed fallback.")
            
        return await self.demo_fallback.get_forecast(lat, lng, days)


import re
from app.core.cache import places_cache

class LivePlacesProvider(PlacesProvider):
    """
    Genuine Location-Aware Live Places Provider.
    Discovers live nearby attractions, cafes, restaurants, heritage sites,
    mobility services, shops, and essentials using OpenStreetMap Overpass API & Google Places (when configured),
    with multi-tier curated fallback and strict data-source transparency.
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
        self.demo_fallback = DemoPlacesProvider()
        self._geocoder: Optional[Any] = None

    def _get_geocoder(self):
        if self._geocoder is None:
            from app.providers.geocoding_provider import LiveGeocodingProvider
            self._geocoder = LiveGeocodingProvider()
        return self._geocoder

    def _normalize_name(self, name: str) -> str:
        clean = re.sub(r"[^a-zA-Z0-9\s]", "", (name or "").lower())
        stop_words = {"cafe", "café", "restaurant", "hotel", "resort", "dhaba", "bake", "bakery", "shop", "store", "point", "viewpoint", "temple", "the", "and"}
        tokens = [t for t in clean.split() if t not in stop_words]
        return " ".join(tokens) if tokens else clean

    def _deduplicate_places(self, places: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        unique = []
        seen_source_ids = set()

        source_priority = {"google_places": 3, "openstreetmap": 2, "vanvas_curated": 1}
        sorted_places = sorted(places, key=lambda p: source_priority.get(p.get("source", ""), 0), reverse=True)

        for p in sorted_places:
            sid = p.get("source_id")
            if sid and sid in seen_source_ids:
                continue

            p_lat = p.get("latitude")
            p_lng = p.get("longitude")
            p_norm = self._normalize_name(p.get("name", ""))

            is_dup = False
            for existing in unique:
                e_lat = existing.get("latitude")
                e_lng = existing.get("longitude")
                if p_lat is not None and p_lng is not None and e_lat is not None and e_lng is not None:
                    dist = self._haversine(p_lat, p_lng, e_lat, e_lng)
                    if dist < 0.15:  # within 150m
                        e_norm = self._normalize_name(existing.get("name", ""))
                        if p_norm and e_norm and (p_norm in e_norm or e_norm in p_norm):
                            is_dup = True
                            break

            if not is_dup:
                unique.append(p)
                if sid:
                    seen_source_ids.add(sid)

        return unique

    def _map_osm_category(self, tags: Dict[str, str]) -> str:
        amenity = tags.get("amenity", "").lower()
        tourism = tags.get("tourism", "").lower()
        historic = tags.get("historic", "").lower()
        leisure = tags.get("leisure", "").lower()
        shop = tags.get("shop", "").lower()

        if amenity in ["cafe", "bakery", "coffee_shop"] or shop in ["bakery", "pastry"]:
            return "Cafés & Bakery"
        elif amenity in ["restaurant", "food_court", "fast_food", "dhaba", "pub", "bar"]:
            return "Local Food"
        elif tourism in ["viewpoint", "camp_site", "wilderness_hut"] or leisure in ["park", "nature_reserve", "track"]:
            return "Nature & Trails"
        elif (
            historic in ["monument", "memorial", "castle", "ruins", "archaeological_site", "temple", "shrine", "fort", "palace", "church", "cathedral", "chapel"]
            or tourism in ["museum", "gallery", "artwork"]
            or amenity in ["place_of_worship"]
        ):
            return "Culture & Heritage"
        elif leisure in ["sports_centre", "water_park", "marina", "slipway"] or tags.get("sport"):
            return "Adventure"
        elif amenity in ["bicycle_rental", "car_rental", "parking", "fuel", "bus_station", "taxi"] or shop in ["motorcycle", "bicycle"]:
            return "Mobility & Transport"
        elif shop in ["convenience", "supermarket", "general", "department_store", "clothes", "craft", "gift", "mall"]:
            return "Shops & Markets"
        elif amenity in ["pharmacy", "hospital", "clinic", "doctors", "atm", "bank", "police", "post_office"]:
            return "Essentials & Medical"
        elif tourism in ["attraction", "theme_park", "zoo"]:
            return "Attractions"
        return "Attractions"

    def _category_image(self, category: str) -> str:
        images = {
            "Cafés & Bakery": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
            "Local Food": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
            "Nature & Trails": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
            "Culture & Heritage": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800",
            "Adventure": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
            "Shops & Markets": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
            "Mobility & Transport": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800",
            "Essentials & Medical": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
            "Attractions": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
        }
        return images.get(category, "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800")

    def _haversine(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        r = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lng2 - lng1)
        a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(r * c, 1)

    async def _execute_overpass_query(self, query_str: str) -> List[Dict[str, Any]]:
        """Executes an Overpass QL query across primary and backup endpoints with tight timeout."""
        for endpoint in self.OVERPASS_ENDPOINTS:
            try:
                async with httpx.AsyncClient(timeout=3.5, headers=self.headers) as client:
                    res = await client.post(endpoint, data={"data": query_str})
                    if res.status_code == 200:
                        data = res.json()
                        return data.get("elements", [])
            except Exception as e:
                logger.debug(f"Overpass endpoint {endpoint} failed: {e}")
        return []

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

        p_lat = el.get("lat") or el.get("center", {}).get("lat", center_lat)
        p_lng = el.get("lon") or el.get("center", {}).get("lon", center_lng)
        if p_lat is None or p_lng is None:
            return None

        p_cat = self._map_osm_category(tags)

        if category_filter and category_filter.lower() != "all":
            cat_lower = category_filter.lower()
            if cat_lower in ["food", "restaurant", "dining"] and p_cat not in ["Local Food", "Cafés & Bakery"]:
                return None
            elif cat_lower in ["coffee", "cafe", "cafes", "bakery"] and p_cat != "Cafés & Bakery":
                return None
            elif cat_lower in ["attractions", "things to do", "attraction"] and p_cat not in ["Attractions", "Culture & Heritage", "Nature & Trails", "Adventure"]:
                return None
            elif cat_lower in ["shopping", "market", "markets"] and p_cat != "Shops & Markets":
                return None
            elif cat_lower in ["mobility", "transport", "rentals"] and p_cat != "Mobility & Transport":
                return None
            elif cat_lower in ["essentials", "medical", "hospital"] and p_cat != "Essentials & Medical":
                return None
            elif cat_lower in ["culture", "heritage", "spiritual", "temple", "church"] and p_cat != "Culture & Heritage":
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

        osm_rating = None
        if "rating" in tags:
            try:
                osm_rating = float(tags["rating"])
            except Exception:
                osm_rating = None

        action_links = ActionLinkGenerator.generate_place_action_links(
            name=p_name,
            latitude=p_lat,
            longitude=p_lng,
            website=website,
            phone=phone,
            booking_url=None,
            source="openstreetmap",
            source_id=str(el.get("id")),
        )

        return {
            "id": f"osm-{el.get('id')}",
            "name": p_name,
            "category": p_cat,
            "description": tags.get("description") or f"OpenStreetMap verified {p_cat.lower()}.",
            "address": addr,
            "latitude": p_lat,
            "longitude": p_lng,
            "price_level": None,
            "approx_cost": None,
            "rating": osm_rating,
            "review_count": None,
            "opening_time": hours_eval.opening_time,
            "closing_time": hours_eval.closing_time,
            "hours_available": hours_eval.hours_available,
            "is_open_now": hours_eval.is_open_now,
            "phone": phone,
            "website": website,
            "recommended_duration_mins": 60,
            "tags": f"{p_cat},OpenStreetMap",
            "image_url": self._category_image(p_cat),
            "why_vanvas_recommends": None,
            "is_must_visit": False,
            "is_hidden_gem": tags.get("tourism") == "viewpoint",
            "is_indoor": p_cat in ["Cafés & Bakery", "Essentials & Medical", "Shops & Markets"],
            "source": "openstreetmap",
            "source_id": str(el.get("id")),
            "is_live": True,
            "distance_km": dist,
            "action_links": action_links,
            "data_state": "LIVE",
            "trust_source": "OPENSTREETMAP",
        }

    async def search_places(self, query: str, destination_name: str = "", category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Discovers real-world places for a query and destination using live providers with curated fallback.
        """
        cache_key = f"search:{query.lower().strip()}:{destination_name.lower().strip()}:{category or 'all'}"
        cached = places_cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. Fetch curated matches first
        curated_matches = await self.demo_fallback.search_places(query, destination_name, category)
        for p in curated_matches:
            p["source"] = "vanvas_curated"
            p["is_live"] = False

        # 2. Resolve destination coordinates
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
            radius_m = 12000

            # 3. Google Places Text Search (when configured)
            if self.api_key and len(self.api_key) > 10 and not self.api_key.startswith("your_"):
                try:
                    clean_q = f"{query} in {target_location}" if target_location not in query else query
                    gp_url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={httpx.URL(clean_q)}&location={lat},{lng}&radius={radius_m}&key={self.api_key}"
                    async with httpx.AsyncClient(timeout=3.5) as client:
                        res = await client.get(gp_url)
                        if res.status_code == 200:
                            gp_data = res.json()
                            for item in gp_data.get("results", [])[:15]:
                                p_name = item.get("name")
                                if not p_name:
                                    continue
                                p_geom = item.get("geometry", {}).get("location", {})
                                p_lat = p_geom.get("lat", lat)
                                p_lng = p_geom.get("lng", lng)
                                types = item.get("types", [])
                                cat = "Attractions"
                                if any(t in types for t in ["cafe", "bakery"]):
                                    cat = "Cafés & Bakery"
                                elif any(t in types for t in ["restaurant", "food", "bar", "meal_takeaway"]):
                                    cat = "Local Food"
                                elif any(t in types for t in ["park", "natural_feature", "campground"]):
                                    cat = "Nature & Trails"
                                elif any(t in types for t in ["hindu_temple", "place_of_worship", "museum", "church", "tourist_attraction"]):
                                    cat = "Culture & Heritage"

                                dist = self._haversine(lat, lng, p_lat, p_lng)
                                rating_val = float(item["rating"]) if "rating" in item and item["rating"] is not None else None
                                review_cnt = int(item["user_ratings_total"]) if "user_ratings_total" in item and item["user_ratings_total"] is not None else None
                                price_lvl = ("₹" * int(item["price_level"])) if "price_level" in item and item["price_level"] is not None else None

                                gp_action_links = ActionLinkGenerator.generate_place_action_links(
                                    name=p_name,
                                    latitude=p_lat,
                                    longitude=p_lng,
                                    website=None,
                                    phone=None,
                                    booking_url=None,
                                    source="google_places",
                                    source_id=item.get("place_id"),
                                )

                                gathered_live.append({
                                    "id": f"gp-{item.get('place_id', '')[:16]}",
                                    "name": p_name,
                                    "category": cat,
                                    "description": f"Verified venue at {item.get('formatted_address', item.get('vicinity', 'the area'))}.",
                                    "address": item.get("formatted_address") or item.get("vicinity"),
                                    "latitude": p_lat,
                                    "longitude": p_lng,
                                    "price_level": price_lvl,
                                    "approx_cost": None,
                                    "rating": rating_val,
                                    "review_count": review_cnt,
                                    "opening_time": None,
                                    "closing_time": None,
                                    "hours_available": False,
                                    "is_open_now": None,
                                    "phone": None,
                                    "website": None,
                                    "recommended_duration_mins": 60,
                                    "tags": ",".join(types[:3]),
                                    "image_url": self._category_image(cat),
                                    "why_vanvas_recommends": None,
                                    "is_must_visit": False,
                                    "is_hidden_gem": False,
                                    "is_indoor": False,
                                    "source": "google_places",
                                    "source_id": item.get("place_id"),
                                    "is_live": True,
                                    "distance_km": dist,
                                    "action_links": gp_action_links,
                                    "data_state": "LIVE",
                                    "trust_source": "GOOGLE_PLACES",
                                })
                except Exception as e:
                    logger.warning(f"Google Places text search failed: {e}")

            # 4. OpenStreetMap Overpass Search
            clean_search_tokens = [t for t in re.sub(r"[^a-zA-Z0-9\s]", "", query.lower()).split() if t not in {"in", "near", "best", "quiet", "famous", "top", "good", "the", "and", target_location.lower()}]
            keyword_regex = "|".join(clean_search_tokens) if clean_search_tokens else "cafe|restaurant|temple|church|attraction"

            query_str = f"""
            [out:json][timeout:3];
            (
              node["name"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              node["amenity"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              node["tourism"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              node["historic"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              node["shop"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
              node["leisure"~"{keyword_regex}",i](around:{radius_m},{lat},{lng});
            );
            out body 25;
            """
            elements = await self._execute_overpass_query(query_str)
            for el in elements:
                parsed = self._parse_osm_element(el, lat, lng, category)
                if parsed:
                    gathered_live.append(parsed)

        # 5. Merge Curated and Live Results
        combined = curated_matches + gathered_live
        if combined:
            deduped = self._deduplicate_places(combined)
            places_cache.set(cache_key, deduped, ttl_seconds=300)
            return deduped

        return []

    async def get_nearby_places(self, lat: float, lng: float, radius_km: float = 5.0, category: Optional[str] = None) -> List[Dict[str, Any]]:
        cache_key = f"{round(lat, 3)}:{round(lng, 3)}:{radius_km}:{category or 'all'}"
        cached = places_cache.get(cache_key)
        if cached is not None:
            return cached

        radius_m = min(int(radius_km * 1000), 25000)
        gathered_places: List[Dict[str, Any]] = []

        # 1. Try Google Places if configured with valid API Key (backend only)
        if self.api_key and len(self.api_key) > 10 and not self.api_key.startswith("your_"):
            try:
                gp_url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius={radius_m}&key={self.api_key}"
                async with httpx.AsyncClient(timeout=3.5) as client:
                    res = await client.get(gp_url)
                    if res.status_code == 200:
                        gp_data = res.json()
                        for item in gp_data.get("results", [])[:20]:
                            p_name = item.get("name")
                            if not p_name:
                                continue
                            p_geom = item.get("geometry", {}).get("location", {})
                            p_lat = p_geom.get("lat", lat)
                            p_lng = p_geom.get("lng", lng)
                            types = item.get("types", [])

                            cat = "Attractions"
                            if any(t in types for t in ["cafe", "bakery"]):
                                cat = "Cafés & Bakery"
                            elif any(t in types for t in ["restaurant", "food", "bar", "meal_takeaway"]):
                                cat = "Local Food"
                            elif any(t in types for t in ["park", "natural_feature", "campground"]):
                                cat = "Nature & Trails"
                            elif any(t in types for t in ["hindu_temple", "place_of_worship", "museum", "church", "tourist_attraction"]):
                                cat = "Culture & Heritage"
                            elif any(t in types for t in ["pharmacy", "hospital", "doctor", "atm", "bank", "police", "gas_station"]):
                                cat = "Essentials & Medical"
                            elif any(t in types for t in ["store", "supermarket", "shopping_mall", "clothing_store"]):
                                cat = "Shops & Markets"
                            elif any(t in types for t in ["car_rental", "parking", "gas_station", "transit_station"]):
                                cat = "Mobility & Transport"

                            if category and category.lower() != "all":
                                if category.lower() not in cat.lower():
                                    continue

                            dist = self._haversine(lat, lng, p_lat, p_lng)
                            rating_val = float(item["rating"]) if "rating" in item and item["rating"] is not None else None
                            review_cnt = int(item["user_ratings_total"]) if "user_ratings_total" in item and item["user_ratings_total"] is not None else None
                            price_lvl = ("₹" * int(item["price_level"])) if "price_level" in item and item["price_level"] is not None else None

                            gp_nb_links = ActionLinkGenerator.generate_place_action_links(
                                name=p_name,
                                latitude=p_lat,
                                longitude=p_lng,
                                website=None,
                                phone=None,
                                booking_url=None,
                                source="google_places",
                                source_id=item.get("place_id"),
                            )

                            gathered_places.append({
                                "id": f"gp-{item.get('place_id', '')[:16]}",
                                "name": p_name,
                                "category": cat,
                                "description": f"Verified venue located at {item.get('vicinity', 'the area')}.",
                                "address": item.get("vicinity"),
                                "latitude": p_lat,
                                "longitude": p_lng,
                                "price_level": price_lvl,
                                "approx_cost": None,
                                "rating": rating_val,
                                "review_count": review_cnt,
                                "opening_time": None,
                                "closing_time": None,
                                "hours_available": False,
                                "is_open_now": None,
                                "phone": None,
                                "website": None,
                                "recommended_duration_mins": 60,
                                "tags": ",".join(types[:3]),
                                "image_url": self._category_image(cat),
                                "why_vanvas_recommends": None,
                                "is_must_visit": False,
                                "is_hidden_gem": False,
                                "is_indoor": False,
                                "source": "google_places",
                                "source_id": item.get("place_id"),
                                "is_live": True,
                                "distance_km": dist,
                                "action_links": gp_nb_links,
                                "data_state": "LIVE",
                                "trust_source": "GOOGLE_PLACES",
                            })
            except Exception as e:
                logger.warning(f"Google Places live discovery failed: {e}")

        # 2. Try OpenStreetMap Overpass Live Query (Free, Open, Global & Indian mountain coverage)
        query_str = f"""
        [out:json][timeout:3];
        (
          node["tourism"~"attraction|viewpoint|museum|gallery|theme_park|zoo|artwork|camp_site|wilderness_hut"](around:{radius_m},{lat},{lng});
          node["amenity"~"cafe|restaurant|fast_food|food_court|pub|bar|marketplace|pharmacy|hospital|clinic|doctors|atm|bank|police|fuel|bicycle_rental|car_rental|parking|place_of_worship"](around:{radius_m},{lat},{lng});
          node["historic"~"monument|memorial|castle|ruins|archaeological_site|fort|palace|city_gate|church|cathedral|chapel"](around:{radius_m},{lat},{lng});
          node["shop"~"bakery|pastry|supermarket|convenience|department_store|clothes|craft|gift|mall|general|motorcycle|bicycle"](around:{radius_m},{lat},{lng});
          node["leisure"~"park|nature_reserve|track|sports_centre"](around:{radius_m},{lat},{lng});
        );
        out body 25;
        """
        elements = await self._execute_overpass_query(query_str)
        for el in elements:
            parsed = self._parse_osm_element(el, lat, lng, category)
            if parsed:
                gathered_places.append(parsed)

        # 3. Deduplicate across Google Places and OSM
        if gathered_places:
            deduped = self._deduplicate_places(gathered_places)
            deduped.sort(key=lambda x: x.get("distance_km", 999))
            places_cache.set(cache_key, deduped, ttl_seconds=300)
            return deduped

        # 4. Transparent Fallback: Return Curated Places marked clearly as Curated
        curated_fallback = await self.demo_fallback.get_nearby_places(lat, lng, radius_km, category)
        for p in curated_fallback:
            p["source"] = "vanvas_curated"
            p["is_live"] = False
            p["distance_km"] = self._haversine(lat, lng, p.get("latitude", lat), p.get("longitude", lng))
        
        places_cache.set(cache_key, curated_fallback, ttl_seconds=120)
        return curated_fallback


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
    Routing provider calculating realistic road distances and driving times taking Himalayan terrain curves into account.
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
        Direct route calculation between two geographic coordinates with mountain tortuosity correction.
        """
        matrix = self.calculate_distance_matrix([{"lat": lat1, "lng": lng1}, {"lat": lat2, "lng": lng2}])
        res = matrix[0][1]
        return {
            "distance_km": res["distance_km"],
            "duration_mins": res["duration_mins"],
            "is_mountain_adjusted": True,
            "schedule_type": "estimated_route",
            "source": "internal",
            "data_state": "VERIFIED",
            "trust_source": "INTERNAL",
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

        radius_m = min(int(radius_km * 1000), 20000)
        query_str = f"""
        [out:json][timeout:3];
        (
          node["tourism"~"hotel|guest_house|hostel|motel|chalet|alpine_hut|camp_site|apartment"](around:{radius_m},{target_lat},{target_lng});
          way["tourism"~"hotel|guest_house|hostel|motel|chalet|alpine_hut|camp_site|apartment"](around:{radius_m},{target_lat},{target_lng});
        );
        out center 25;
        """
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
        return results


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

        radius_m = min(int(radius_km * 1000), 20000)
        query_str = f"""
        [out:json][timeout:3];
        (
          node["amenity"~"bicycle_rental|car_rental|motorcycle_rental"](around:{radius_m},{target_lat},{target_lng});
          node["shop"~"motorcycle|bicycle"](around:{radius_m},{target_lat},{target_lng});
        );
        out body 20;
        """
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
            addr_parts = [tags.get("addr:housenumber"), tags.get("addr:street"), tags.get("addr:suburb"), tags.get("addr:city")]
            addr = ", ".join([p for p in addr_parts if p]) or f"{dist} km from center"

            op_hours = tags.get("opening_hours")
            r_hours_eval = OperatingHoursEngine.evaluate_osm_hours(op_hours, r_lat, r_lng)
            phone = tags.get("phone") or tags.get("contact:phone")
            website = tags.get("website") or tags.get("url")

            v_type = "Scooter / Motorcycle"
            if tags.get("amenity") == "bicycle_rental" or tags.get("shop") == "bicycle":
                v_type = "Bicycle"
            elif tags.get("amenity") == "car_rental":
                v_type = "Car"

            rental_action_links = ActionLinkGenerator.generate_rental_action_links(
                provider_name=r_name,
                latitude=r_lat,
                longitude=r_lng,
                website=website,
                phone=phone,
            )

            results.append({
                "id": f"osm-rent-{el.get('id')}",
                "destination_id": "live",
                "provider_name": r_name,
                "vehicle_type": v_type,
                "vehicle_name": f"{r_name} Fleet",
                "price_per_day": None,
                "deposit_amount": None,
                "location": addr,
                "latitude": r_lat,
                "longitude": r_lng,
                "opening_hours": op_hours or "Hours not listed",
                "hours_available": r_hours_eval.hours_available,
                "is_open_now": r_hours_eval.is_open_now,
                "rating": None,
                "image_url": "/images/vehicles/automatic_scooter.svg",
                "phone": phone,
                "website": website,
                "source": "openstreetmap",
                "source_id": str(el.get("id")),
                "is_live": True,
                "inventory_verified": False,
                "distance_km": dist,
                "action_links": rental_action_links,
                "data_state": "LIVE",
                "trust_source": "OPENSTREETMAP",
            })

        results.sort(key=lambda x: x.get("distance_km", 999))
        return results

