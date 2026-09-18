import httpx
import logging
from typing import List, Dict, Any, Optional
from app.providers.base import GeocodingProvider

logger = logging.getLogger("vanvas.geocoding")

# Known Curated Indian & Global destinations with accurate coordinates and elevation
SEED_DESTINATIONS: List[Dict[str, Any]] = [
    {
        "name": "Manali",
        "hindi_name": "मनाली",
        "state": "Himachal Pradesh",
        "country": "India",
        "region": "Himalayan Valley",
        "lat": 32.2396,
        "lng": 77.1887,
        "altitude_meters": 2050,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "manali",
    },
    {
        "name": "Rishikesh",
        "hindi_name": "ऋषिकेश",
        "state": "Uttarakhand",
        "country": "India",
        "region": "Himalayan Foothills",
        "lat": 30.0869,
        "lng": 78.2676,
        "altitude_meters": 372,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "rishikesh",
    },
    {
        "name": "Kasol",
        "hindi_name": "कसोल",
        "state": "Himachal Pradesh",
        "country": "India",
        "region": "Parvati Valley",
        "lat": 32.0100,
        "lng": 77.3150,
        "altitude_meters": 1580,
        "timezone": "Asia/Kolkata",
        "type": "village",
        "slug": "kasol",
    },
    {
        "name": "Dharamshala & McLeod Ganj",
        "hindi_name": "धर्मशाला",
        "state": "Himachal Pradesh",
        "country": "India",
        "region": "Kangra Valley",
        "lat": 32.2190,
        "lng": 76.3234,
        "altitude_meters": 1457,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "dharamshala",
    },
    {
        "name": "Goa",
        "hindi_name": "गोवा",
        "state": "Goa",
        "country": "India",
        "region": "Coastal Western Ghats",
        "lat": 15.2993,
        "lng": 74.1240,
        "altitude_meters": 10,
        "timezone": "Asia/Kolkata",
        "type": "state",
        "slug": "goa",
    },
    {
        "name": "Jaipur",
        "hindi_name": "जयपुर",
        "state": "Rajasthan",
        "country": "India",
        "region": "Royal Heritage",
        "lat": 26.9124,
        "lng": 75.7873,
        "altitude_meters": 431,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "jaipur",
    },
    {
        "name": "Udaipur",
        "hindi_name": "उदयपुर",
        "state": "Rajasthan",
        "country": "India",
        "region": "Mewar Lakes",
        "lat": 24.5854,
        "lng": 73.7125,
        "altitude_meters": 598,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "udaipur",
    },
    {
        "name": "Mussoorie",
        "hindi_name": "मसूरी",
        "state": "Uttarakhand",
        "country": "India",
        "region": "Garhwal Hills",
        "lat": 30.4598,
        "lng": 78.0644,
        "altitude_meters": 2005,
        "timezone": "Asia/Kolkata",
        "type": "hill_station",
        "slug": "mussoorie",
    },
    {
        "name": "Spiti Valley",
        "hindi_name": "स्पीति घाटी",
        "state": "Himachal Pradesh",
        "country": "India",
        "region": "High Altitude Cold Desert",
        "lat": 32.2461,
        "lng": 78.0349,
        "altitude_meters": 3800,
        "timezone": "Asia/Kolkata",
        "type": "valley",
        "slug": "spiti-valley",
    },
    {
        "name": "Leh Ladakh",
        "hindi_name": "लेह लद्दाख",
        "state": "Ladakh",
        "country": "India",
        "region": "Trans-Himalayas",
        "lat": 34.1526,
        "lng": 77.5771,
        "altitude_meters": 3500,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "leh-ladakh",
    },
    {
        "name": "Kedarnath",
        "hindi_name": "केदारनाथ",
        "state": "Uttarakhand",
        "country": "India",
        "region": "Garhwal Himalayas",
        "lat": 30.7352,
        "lng": 79.0669,
        "altitude_meters": 3583,
        "timezone": "Asia/Kolkata",
        "type": "sanctuary",
        "slug": "kedarnath",
    },
    {
        "name": "Varanasi",
        "hindi_name": "वाराणसी",
        "state": "Uttar Pradesh",
        "country": "India",
        "region": "Holy Ganga Ghats",
        "lat": 25.3176,
        "lng": 82.9739,
        "altitude_meters": 80,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "varanasi",
    },
    {
        "name": "Munnar",
        "hindi_name": "मुन्नार",
        "state": "Kerala",
        "country": "India",
        "region": "Western Ghats Tea Valleys",
        "lat": 10.0889,
        "lng": 77.0595,
        "altitude_meters": 1600,
        "timezone": "Asia/Kolkata",
        "type": "hill_station",
        "slug": "munnar",
    },
    {
        "name": "Meghalaya (Shillong)",
        "hindi_name": "मेघालय",
        "state": "Meghalaya",
        "country": "India",
        "region": "Abode of Clouds",
        "lat": 25.5788,
        "lng": 91.8933,
        "altitude_meters": 1525,
        "timezone": "Asia/Kolkata",
        "type": "region",
        "slug": "meghalaya",
    },
    {
        "name": "Sikkim (Gangtok)",
        "hindi_name": "सिक्किम",
        "state": "Sikkim",
        "country": "India",
        "region": "Kanchenjunga Foothills",
        "lat": 27.3389,
        "lng": 88.6065,
        "altitude_meters": 1650,
        "timezone": "Asia/Kolkata",
        "type": "state",
        "slug": "sikkim",
    },
    {
        "name": "Mumbai",
        "hindi_name": "मुंबई",
        "state": "Maharashtra",
        "country": "India",
        "region": "Konkan Coast",
        "lat": 19.0760,
        "lng": 72.8777,
        "altitude_meters": 14,
        "timezone": "Asia/Kolkata",
        "type": "metropolis",
        "slug": "mumbai",
    },
    {
        "name": "Delhi",
        "hindi_name": "दिल्ली",
        "state": "Delhi",
        "country": "India",
        "region": "Northern Capital",
        "lat": 28.6139,
        "lng": 77.2090,
        "altitude_meters": 216,
        "timezone": "Asia/Kolkata",
        "type": "metropolis",
        "slug": "delhi",
    },
    {
        "name": "Bengaluru",
        "hindi_name": "बेंगलुरु",
        "state": "Karnataka",
        "country": "India",
        "region": "Deccan Plateau",
        "lat": 12.9716,
        "lng": 77.5946,
        "altitude_meters": 920,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "bengaluru",
    },
    {
        "name": "Kerala (Alleppey & Fort Kochi)",
        "hindi_name": "केरल",
        "state": "Kerala",
        "country": "India",
        "region": "Tropical Backwaters",
        "lat": 9.4981,
        "lng": 76.3388,
        "altitude_meters": 5,
        "timezone": "Asia/Kolkata",
        "type": "region",
        "slug": "kerala",
    },
    {
        "name": "Nepal (Kathmandu & Pokhara)",
        "hindi_name": "नेपाल",
        "state": "Bagmati",
        "country": "Nepal",
        "region": "Himalayan Kingdom",
        "lat": 27.7172,
        "lng": 85.3240,
        "altitude_meters": 1400,
        "timezone": "Asia/Kathmandu",
        "type": "country",
        "slug": "nepal",
    },
    {
        "name": "Bhutan (Paro & Thimphu)",
        "hindi_name": "भूटान",
        "state": "Thimphu",
        "country": "Bhutan",
        "region": "Eastern Himalayas",
        "lat": 27.4728,
        "lng": 89.6393,
        "altitude_meters": 2334,
        "timezone": "Asia/Thimphu",
        "type": "country",
        "slug": "bhutan",
    },
    {
        "name": "Bali",
        "hindi_name": "बाली",
        "state": "Bali",
        "country": "Indonesia",
        "region": "Tropical Archipelago",
        "lat": -8.4095,
        "lng": 115.1889,
        "altitude_meters": 50,
        "timezone": "Asia/Makassar",
        "type": "island",
        "slug": "bali",
    },
    {
        "name": "Dubai",
        "hindi_name": "दुबई",
        "state": "Dubai",
        "country": "United Arab Emirates",
        "region": "Arabian Gulf",
        "lat": 25.2048,
        "lng": 55.2708,
        "altitude_meters": 16,
        "timezone": "Asia/Dubai",
        "type": "city",
        "slug": "dubai",
    },
    {
        "name": "Thailand (Bangkok & Phuket)",
        "hindi_name": "थाईलैंड",
        "state": "Bangkok",
        "country": "Thailand",
        "region": "Southeast Asia",
        "lat": 13.7563,
        "lng": 100.5018,
        "altitude_meters": 20,
        "timezone": "Asia/Bangkok",
        "type": "country",
        "slug": "thailand",
    },
    {
        "name": "Landour",
        "hindi_name": "लैण्डौर",
        "state": "Uttarakhand",
        "country": "India",
        "region": "Garhwal Hills",
        "lat": 30.4628,
        "lng": 78.0936,
        "altitude_meters": 2250,
        "timezone": "Asia/Kolkata",
        "type": "hill_station",
        "slug": "landour",
    },
    {
        "name": "McLeod Ganj",
        "hindi_name": "मैकलोडगंज",
        "state": "Himachal Pradesh",
        "country": "India",
        "region": "Kangra Valley",
        "lat": 32.2426,
        "lng": 76.3213,
        "altitude_meters": 2082,
        "timezone": "Asia/Kolkata",
        "type": "hill_station",
        "slug": "mcleod-ganj",
    },
    {
        "name": "Shimla",
        "hindi_name": "शिमला",
        "state": "Himachal Pradesh",
        "country": "India",
        "region": "Himalayan Ridge",
        "lat": 31.1048,
        "lng": 77.1734,
        "altitude_meters": 2276,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "shimla",
    },
    {
        "name": "Jodhpur",
        "hindi_name": "जोधपुर",
        "state": "Rajasthan",
        "country": "India",
        "region": "Marwar Blue City",
        "lat": 26.2389,
        "lng": 73.0243,
        "altitude_meters": 231,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "jodhpur",
    },
    {
        "name": "Indore",
        "hindi_name": "इंदौर",
        "state": "Madhya Pradesh",
        "country": "India",
        "region": "Malwa Plateau",
        "lat": 22.7196,
        "lng": 75.8577,
        "altitude_meters": 553,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "indore",
    },
    {
        "name": "Bhopal",
        "hindi_name": "भोपाल",
        "state": "Madhya Pradesh",
        "country": "India",
        "region": "City of Lakes",
        "lat": 23.2599,
        "lng": 77.4126,
        "altitude_meters": 527,
        "timezone": "Asia/Kolkata",
        "type": "city",
        "slug": "bhopal",
    }
]

import time
from app.core.cache import geo_cache
from app.services.cache_service import cache_service
from app.services.provider_health_tracker import health_tracker

class LiveGeocodingProvider(GeocodingProvider):
    def __init__(self):
        self.headers = {
            "User-Agent": "VANVAS-Travel-Operating-System/2.0 (expedition@vanvas.com)"
        }

    def _score_place_type(self, place_type: str, name: str, query: str) -> int:
        pt = (place_type or "").lower()
        q = query.strip().lower()
        nm = (name or "").lower()

        score = 0
        # 1. City / Town / Village / Hill Station / Suburb prioritize highest
        if pt in ["city", "town", "village", "municipality", "suburb", "hamlet", "hill_station", "neighbourhood"]:
            score += 100
        elif pt in ["district", "county", "state_district", "administrative"]:
            score += 50
        elif pt in ["state", "province", "region"]:
            score += 20
        elif pt in ["country", "nation"]:
            # If user explicitly searched country (e.g. "india", "nepal", "bhutan", "france"), allow it
            if q == nm or q in nm:
                score += 30
            else:
                score -= 150 # Heavy penalty for broad country collapse when searching a city
        else:
            score += 40

        # Exact / Prefix name matching bonus
        if nm == q:
            score += 80
        elif nm.startswith(q):
            score += 40
        elif q in nm:
            score += 20

        return score

    def _format_destination_result(
        self,
        name: str,
        state: str,
        country: str,
        lat: float,
        lng: float,
        place_type: str,
        source: str,
        hindi_name: Optional[str] = None,
        source_id: Optional[str] = None,
        altitude_meters: int = 1000
    ) -> Dict[str, Any]:
        slug = name.lower().replace(" ", "-").replace(",", "").replace("'", "").replace("&", "and")
        display_parts = [name]
        if state and state.lower() != name.lower():
            display_parts.append(state)
        if country and country.lower() != name.lower() and country.lower() != (state or "").lower():
            display_parts.append(country)
        display_name = ", ".join(display_parts)

        return {
            "name": name,
            "city": name,
            "state": state or ("India" if country == "India" else country),
            "country": country or "India",
            "region": f"{state}, {country}" if state else country,
            "display_name": display_name,
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
            "lat": round(lat, 4),
            "lng": round(lng, 4),
            "place_type": place_type or "city",
            "type": place_type or "city",
            "altitude_meters": altitude_meters,
            "slug": slug,
            "hindi_name": hindi_name,
            "source": source,
            "source_id": source_id,
        }

    async def autocomplete(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        q = query.strip().lower()
        if not q:
            return [
                self._format_destination_result(
                    name=d["name"],
                    state=d["state"],
                    country=d["country"],
                    lat=d["lat"],
                    lng=d["lng"],
                    place_type=d.get("type", "city"),
                    source="curated",
                    hindi_name=d.get("hindi_name"),
                    altitude_meters=d.get("altitude_meters", 1000)
                ) for d in SEED_DESTINATIONS[:limit]
            ]

        cache_key = f"auto:{q}:{limit}"
        cached = geo_cache.get(cache_key)
        if cached:
            return cached

        matched: List[Dict[str, Any]] = []

        # 1. Match against known curated destinations (exact slug / prefix first)
        exact_seeds = []
        prefix_seeds = []
        sub_seeds = []

        for dest in SEED_DESTINATIONS:
            d_name = dest["name"].lower()
            d_slug = dest["slug"].lower()
            d_hindi = dest.get("hindi_name", "").lower()
            d_state = dest["state"].lower()

            item = self._format_destination_result(
                name=dest["name"],
                state=dest["state"],
                country=dest["country"],
                lat=dest["lat"],
                lng=dest["lng"],
                place_type=dest.get("type", "city"),
                source="curated",
                hindi_name=dest.get("hindi_name"),
                altitude_meters=dest.get("altitude_meters", 1000)
            )

            if q == d_slug or q == d_name:
                exact_seeds.append(item)
            elif d_name.startswith(q) or d_slug.startswith(q):
                prefix_seeds.append(item)
            elif (len(q) >= 3 and (q in d_name or q in d_hindi or q in d_state or q in d_slug)):
                sub_seeds.append(item)

        matched.extend(exact_seeds + prefix_seeds + sub_seeds)

        if len(matched) >= limit:
            geo_cache.set(cache_key, matched[:limit], ttl_seconds=600)
            return matched[:limit]

        # 2. Query Photon Komoot API with multi-result ranking
        try:
            url = f"https://photon.komoot.io/api/?q={httpx.URL(q)}&limit={max(limit, 6)}"
            async with httpx.AsyncClient(timeout=2.5, headers=self.headers) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    candidates = []
                    for feature in data.get("features", []):
                        props = feature.get("properties", {})
                        geom = feature.get("geometry", {})
                        coords = geom.get("coordinates", [0, 0])

                        osm_val = props.get("osm_value") or props.get("type") or "city"
                        city_name = props.get("city") or props.get("town") or props.get("village") or props.get("name") or q.title()
                        state = props.get("state") or props.get("county") or ""
                        country = props.get("country") or "India"

                        score = self._score_place_type(osm_val, city_name, q)
                        item = self._format_destination_result(
                            name=city_name,
                            state=state,
                            country=country,
                            lat=float(coords[1]),
                            lng=float(coords[0]),
                            place_type=osm_val,
                            source="openstreetmap",
                            source_id=str(props.get("osm_id", "")),
                            altitude_meters=1000
                        )
                        candidates.append((score, item))

                    candidates.sort(key=lambda x: x[0], reverse=True)
                    for _, cand in candidates:
                        if not any(m["name"].lower() == cand["name"].lower() for m in matched):
                            matched.append(cand)
        except Exception as e:
            logger.warning(f"Photon autocomplete failed: {e}")

        if len(matched) >= limit:
            geo_cache.set(cache_key, matched[:limit], ttl_seconds=600)
            return matched[:limit]

        # 3. Query OpenStreetMap Nominatim with structured ranking
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={httpx.URL(q)}&format=json&addressdetails=1&limit={max(limit, 6)}"
            async with httpx.AsyncClient(timeout=3.0, headers=self.headers) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    candidates = []
                    for item in data:
                        addr = item.get("address", {})
                        place_type = item.get("type") or item.get("class") or "city"
                        city_name = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality") or addr.get("county") or item.get("name") or q.title()
                        state = addr.get("state") or addr.get("region") or ""
                        country = addr.get("country") or "India"

                        score = self._score_place_type(place_type, city_name, q)
                        formatted = self._format_destination_result(
                            name=city_name,
                            state=state,
                            country=country,
                            lat=float(item.get("lat", 0.0)),
                            lng=float(item.get("lon", 0.0)),
                            place_type=place_type,
                            source="openstreetmap",
                            source_id=str(item.get("osm_id", "")),
                            altitude_meters=1000
                        )
                        candidates.append((score, formatted))

                    candidates.sort(key=lambda x: x[0], reverse=True)
                    for _, cand in candidates:
                        if not any(m["name"].lower() == cand["name"].lower() for m in matched):
                            matched.append(cand)
        except Exception as e:
            logger.warning(f"Live geocoding autocomplete error: {e}")

        result = matched[:limit]
        health_tracker.record_success("geocoding", 1.0)
        geo_cache.set(cache_key, result, ttl_seconds=600)
        return result

    async def geocode(self, query: str) -> Optional[Dict[str, Any]]:
        q = query.strip().lower()
        if not q:
            return None

        cache_key = f"geocode:{q}"
        cached = geo_cache.get(cache_key)
        if cached:
            return cached

        # 1. Exact match in seed
        for dest in SEED_DESTINATIONS:
            if q == dest["slug"].lower() or q == dest["name"].lower():
                res = self._format_destination_result(
                    name=dest["name"],
                    state=dest["state"],
                    country=dest["country"],
                    lat=dest["lat"],
                    lng=dest["lng"],
                    place_type=dest.get("type", "city"),
                    source="curated",
                    hindi_name=dest.get("hindi_name"),
                    altitude_meters=dest.get("altitude_meters", 1000)
                )
                geo_cache.set(cache_key, res, ttl_seconds=600)
                return res

        # Prefix seed match
        for dest in SEED_DESTINATIONS:
            if dest["slug"].lower().startswith(q) or dest["name"].lower().startswith(q):
                res = self._format_destination_result(
                    name=dest["name"],
                    state=dest["state"],
                    country=dest["country"],
                    lat=dest["lat"],
                    lng=dest["lng"],
                    place_type=dest.get("type", "city"),
                    source="curated",
                    hindi_name=dest.get("hindi_name"),
                    altitude_meters=dest.get("altitude_meters", 1000)
                )
                geo_cache.set(cache_key, res, ttl_seconds=600)
                return res

        # 2. Photon Komoot Fast Geocoder with multi-result city ranking
        try:
            url = f"https://photon.komoot.io/api/?q={httpx.URL(q)}&limit=6"
            async with httpx.AsyncClient(timeout=2.5, headers=self.headers) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    features = data.get("features", [])
                    if features:
                        scored_candidates = []
                        for f in features:
                            props = f.get("properties", {})
                            coords = f.get("geometry", {}).get("coordinates", [0, 0])
                            osm_val = props.get("osm_value") or props.get("type") or "city"
                            city_name = props.get("city") or props.get("town") or props.get("village") or props.get("name") or query.title()
                            state = props.get("state") or props.get("county") or ""
                            country = props.get("country") or "India"

                            score = self._score_place_type(osm_val, city_name, q)
                            item = self._format_destination_result(
                                name=city_name,
                                state=state,
                                country=country,
                                lat=float(coords[1]),
                                lng=float(coords[0]),
                                place_type=osm_val,
                                source="openstreetmap",
                                source_id=str(props.get("osm_id", "")),
                                altitude_meters=1000
                            )
                            scored_candidates.append((score, item))

                        scored_candidates.sort(key=lambda x: x[0], reverse=True)
                        best = scored_candidates[0][1]

                        # Altitude estimation
                        altitude = 1200
                        state_lower = f"{best['state']} {best['country']}".lower()
                        if any(k in state_lower for k in ["himachal", "ladakh", "uttarakhand", "sikkim", "nepal", "bhutan", "kashmir", "spiti"]):
                            altitude = 2200
                        elif any(k in state_lower for k in ["goa", "kerala", "mumbai", "bali", "coast", "chennai"]):
                            altitude = 35
                        elif any(k in state_lower for k in ["madhya pradesh", "indore", "bhopal", "deccan", "pune", "bengaluru"]):
                            altitude = 550

                        best["altitude_meters"] = altitude
                        geo_cache.set(cache_key, best, ttl_seconds=600)
                        return best
        except Exception as e:
            logger.warning(f"Photon geocode failed: {e}")

        # 3. Live Nominatim Search with structured address details
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={httpx.URL(q)}&format=json&addressdetails=1&limit=6"
            async with httpx.AsyncClient(timeout=3.5, headers=self.headers) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    if data:
                        scored_candidates = []
                        for item in data:
                            addr = item.get("address", {})
                            place_type = item.get("type") or item.get("class") or "city"
                            city_name = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality") or addr.get("county") or item.get("name") or query.title()
                            state = addr.get("state") or addr.get("region") or ""
                            country = addr.get("country") or "India"

                            score = self._score_place_type(place_type, city_name, q)
                            formatted = self._format_destination_result(
                                name=city_name,
                                state=state,
                                country=country,
                                lat=float(item.get("lat", 0.0)),
                                lng=float(item.get("lon", 0.0)),
                                place_type=place_type,
                                source="openstreetmap",
                                source_id=str(item.get("osm_id", "")),
                                altitude_meters=1000
                            )
                            scored_candidates.append((score, formatted))

                        scored_candidates.sort(key=lambda x: x[0], reverse=True)
                        best = scored_candidates[0][1]

                        altitude = 1200
                        state_lower = f"{best['state']} {best['country']}".lower()
                        if any(k in state_lower for k in ["himachal", "ladakh", "uttarakhand", "sikkim", "nepal", "bhutan"]):
                            altitude = 2200
                        elif any(k in state_lower for k in ["goa", "kerala", "mumbai", "bali", "coast"]):
                            altitude = 35
                        elif any(k in state_lower for k in ["madhya pradesh", "indore", "bhopal", "deccan"]):
                            altitude = 550

                        best["altitude_meters"] = altitude
                        health_tracker.record_success("geocoding", 2.0)
                        geo_cache.set(cache_key, best, ttl_seconds=600)
                        return best
        except Exception as e:
            health_tracker.record_failure("geocoding", str(e))
            logger.error(f"Live geocode failed for '{query}': {e}")

        return None
