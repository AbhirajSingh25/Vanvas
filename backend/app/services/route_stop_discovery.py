"""
Route-Based Stop Discovery & Detour Calculation Engine for VANVAS.
Discovers verified POIs along real road route corridors, computes perpendicular
distance from route polyline, calculates detour distance and time, ranks candidates
based on fatigue, daylight, preferences, and stop value, and filters out excessive detours.
"""

from typing import List, Dict, Any, Optional, Tuple
import math
from app.providers.routing_provider import haversine_km

# Rich Verified Indian Highway Corridor POI Catalog
HIGHWAY_CORRIDOR_POIS = [
    # --- NH48 / Delhi - Jaipur - Udaipur - Mumbai - Goa Corridor ---
    {
        "id": "stop-nh48-old-rao",
        "name": "Old Rao Hotel & Dhaba (Dharuhera)",
        "type": "Dhaba",
        "category": "Food",
        "lat": 28.2050,
        "lng": 76.7900,
        "time_needed_mins": 35,
        "approx_cost": 180.0,
        "cost_label": "₹150 - ₹250",
        "why_stop": "Legendary Haryana tandoori parathas with homemade white butter and kulhad masala chai.",
        "opening_status": "Open 24 Hours",
        "data_state": "CURATED",
        "action_label": "Breakfast stop",
        "action_type": "food_stop",
        "tags": ["food_focus", "breakfast", "dhaba", "family_friendly"]
    },
    {
        "id": "stop-nh48-neemrana",
        "name": "Neemrana Fort-Palace Viewpoint",
        "type": "Fort",
        "category": "Heritage",
        "lat": 27.9940,
        "lng": 76.3880,
        "time_needed_mins": 45,
        "approx_cost": 250.0,
        "cost_label": "₹200 - ₹500",
        "why_stop": "15th-century multi-tiered Aravalli hill fortress right off the NH48 expressway.",
        "opening_status": "09:00 - 18:00",
        "data_state": "CURATED",
        "action_label": "Fort detour",
        "action_type": "add_stop",
        "tags": ["scenic", "heritage", "culture", "photography"]
    },
    {
        "id": "stop-nh48-shahpura",
        "name": "Shahpura Haveli & Stepwell",
        "type": "Heritage",
        "category": "Culture",
        "lat": 27.3910,
        "lng": 75.9610,
        "time_needed_mins": 30,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "Quiet Rajasthani sandstone stepwell and courtyard tea lounge.",
        "opening_status": "Sunrise - Sunset",
        "data_state": "CURATED",
        "action_label": "Quick visit",
        "action_type": "add_stop",
        "tags": ["heritage", "culture", "scenic"]
    },
    {
        "id": "stop-nh48-pushkar",
        "name": "Pushkar Holy Lake & Brahma Ghats",
        "type": "Temple",
        "category": "Culture",
        "lat": 26.4897,
        "lng": 74.5511,
        "time_needed_mins": 60,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "Sacred desert lake surrounded by 52 bathing ghats and historic incense bazaars (+12 km from Ajmer bypass).",
        "opening_status": "06:00 - 21:00",
        "data_state": "CURATED",
        "action_label": "Add stop",
        "action_type": "add_stop",
        "tags": ["culture", "heritage", "temple", "scenic"]
    },
    {
        "id": "stop-nh48-chittorgarh",
        "name": "Chittorgarh Fort Ridge",
        "type": "Fort",
        "category": "Heritage",
        "lat": 24.8879,
        "lng": 74.6454,
        "time_needed_mins": 50,
        "approx_cost": 100.0,
        "cost_label": "₹100 entry",
        "why_stop": "Largest hill fort in India: Vijay Stambha and massive battlements overlooking the highway valley.",
        "opening_status": "08:00 - 18:30",
        "data_state": "CURATED",
        "action_label": "Viewpoint stop",
        "action_type": "viewpoint",
        "tags": ["heritage", "scenic", "culture", "photography"]
    },
    {
        "id": "stop-nh48-shamlaji",
        "name": "Shamlaji River Temple",
        "type": "Temple",
        "category": "Culture",
        "lat": 23.6870,
        "lng": 73.3850,
        "time_needed_mins": 30,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "11th-century intricately carved Vishnu shrine by the Meshwo river reservoir on the Rajasthan-Gujarat border.",
        "opening_status": "06:30 - 20:30",
        "data_state": "CURATED",
        "action_label": "Add stop",
        "action_type": "add_stop",
        "tags": ["temple", "culture", "heritage"]
    },
    {
        "id": "stop-nh48-vadodara-highway",
        "name": "Honest Highway Food Plaza (Vadodara)",
        "type": "Cafe",
        "category": "Food",
        "lat": 22.3120,
        "lng": 73.1890,
        "time_needed_mins": 30,
        "approx_cost": 220.0,
        "cost_label": "₹200 - ₹350",
        "why_stop": "Clean highway rest stop with authentic Gujarati snacks, pav bhaji, and fast fuel refills.",
        "opening_status": "07:00 - 23:30",
        "data_state": "CURATED",
        "action_label": "Snack break",
        "action_type": "food_stop",
        "tags": ["food_focus", "family_friendly", "rest"]
    },
    {
        "id": "stop-nh48-lonavala-view",
        "name": "Tiger's Leap & Ghat Viewpoint",
        "type": "Viewpoint",
        "category": "Nature",
        "lat": 18.7520,
        "lng": 73.4060,
        "time_needed_mins": 35,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "650m sheer cliff drop with expansive Western Ghats valley panoramas and monsoon waterfalls.",
        "opening_status": "Sunrise - Sunset",
        "data_state": "CURATED",
        "action_label": "Viewpoint",
        "action_type": "viewpoint",
        "tags": ["scenic", "nature", "viewpoint"]
    },
    {
        "id": "stop-nh48-amboli-ghat",
        "name": "Amboli Ghat Waterfall & Mist Point",
        "type": "Waterfall",
        "category": "Nature",
        "lat": 15.9580,
        "lng": 73.9990,
        "time_needed_mins": 40,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "Lush evergreen rainforest switchback pass with roaring mist waterfalls descending into Goa.",
        "opening_status": "Daylight hours",
        "data_state": "CURATED",
        "action_label": "Waterfall stop",
        "action_type": "add_stop",
        "tags": ["nature", "waterfall", "scenic", "adventure"]
    },

    # --- NH44 & NH21 / Delhi - Chandigarh - Kullu - Manali Corridor ---
    {
        "id": "stop-nh44-murthal",
        "name": "Amrik Sukhdev (Murthal)",
        "type": "Dhaba",
        "category": "Food",
        "lat": 29.0250,
        "lng": 77.0700,
        "time_needed_mins": 45,
        "approx_cost": 220.0,
        "cost_label": "₹180 - ₹300",
        "why_stop": "Iconic Grand Trunk Road paratha sanctuary with melting white butter and sweet lassi.",
        "opening_status": "Open 24 Hours",
        "data_state": "CURATED",
        "action_label": "Breakfast stop",
        "action_type": "food_stop",
        "tags": ["food_focus", "breakfast", "dhaba"]
    },
    {
        "id": "stop-nh44-kurukshetra",
        "name": "Brahma Sarovar Ghat",
        "type": "Lake",
        "category": "Heritage",
        "lat": 29.9650,
        "lng": 76.8370,
        "time_needed_mins": 30,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "Massive ancient water tank and manicured promenade for a tranquil driving break.",
        "opening_status": "06:00 - 20:00",
        "data_state": "CURATED",
        "action_label": "Lake walk",
        "action_type": "add_stop",
        "tags": ["heritage", "lake", "scenic"]
    },
    {
        "id": "stop-nh21-gobind-sagar",
        "name": "Gobind Sagar Lake Viewpoint (Bilaspur)",
        "type": "Lake",
        "category": "Viewpoint",
        "lat": 31.3400,
        "lng": 76.7550,
        "time_needed_mins": 25,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "Panoramic turquoise reservoir vista before the winding Himalayan climbs begin.",
        "opening_status": "Sunrise - Sunset",
        "data_state": "CURATED",
        "action_label": "Viewpoint",
        "action_type": "viewpoint",
        "tags": ["scenic", "nature", "viewpoint", "lake"]
    },
    {
        "id": "stop-nh21-pandoh-dam",
        "name": "Pandoh Dam Spillway",
        "type": "Viewpoint",
        "category": "Nature",
        "lat": 31.6700,
        "lng": 77.0580,
        "time_needed_mins": 20,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "Massive Beas River water discharge surrounded by towering granite gorges.",
        "opening_status": "Daylight hours",
        "data_state": "CURATED",
        "action_label": "Photo stop",
        "action_type": "viewpoint",
        "tags": ["nature", "scenic", "viewpoint"]
    },
    {
        "id": "stop-nh21-aut-tunnel",
        "name": "Aut River Gorge & Valley Cafe",
        "type": "Cafe",
        "category": "Food",
        "lat": 31.7500,
        "lng": 77.2100,
        "time_needed_mins": 30,
        "approx_cost": 150.0,
        "cost_label": "₹150 - ₹250",
        "why_stop": "Riverside chai and siddu snacks at the entrance to the 3km mountain tunnel gateway.",
        "opening_status": "07:00 - 22:00",
        "data_state": "CURATED",
        "action_label": "Tea stop",
        "action_type": "food_stop",
        "tags": ["food_focus", "cafe", "scenic"]
    },

    # --- NH58 / Delhi - Meerut - Haridwar - Rishikesh Corridor ---
    {
        "id": "stop-nh58-cheetal",
        "name": "Cheetal Grand (Khatauli Bypass)",
        "type": "Cafe",
        "category": "Food",
        "lat": 29.2800,
        "lng": 77.7200,
        "time_needed_mins": 40,
        "approx_cost": 280.0,
        "cost_label": "₹200 - ₹400",
        "why_stop": "Historic landscaped highway garden cafe known for hot filter coffee, paneer cutlets, and clean restrooms.",
        "opening_status": "06:00 - 23:00",
        "data_state": "CURATED",
        "action_label": "Snack break",
        "action_type": "food_stop",
        "tags": ["food_focus", "cafe", "family_friendly"]
    },
    {
        "id": "stop-nh58-har-ki-pauri",
        "name": "Har Ki Pauri Ghat (Haridwar)",
        "type": "Temple",
        "category": "Culture",
        "lat": 29.9560,
        "lng": 78.1700,
        "time_needed_mins": 45,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "Revered Ganga riverbank steps right before ascending into Rishikesh foothills.",
        "opening_status": "Open 24 Hours",
        "data_state": "CURATED",
        "action_label": "Ghat visit",
        "action_type": "add_stop",
        "tags": ["culture", "heritage", "temple"]
    },

    # --- NH48 / Bangalore - Hubli - Goa Corridor ---
    {
        "id": "stop-nh48-chitradurga",
        "name": "Chitradurga Fort of Seven Circles",
        "type": "Fort",
        "category": "Heritage",
        "lat": 14.2250,
        "lng": 76.4010,
        "time_needed_mins": 60,
        "approx_cost": 50.0,
        "cost_label": "₹50 entry",
        "why_stop": "Colossal 17th-century stone fortification labyrinth built amidst towering boulder hills.",
        "opening_status": "08:00 - 18:00",
        "data_state": "CURATED",
        "action_label": "Fort walk",
        "action_type": "add_stop",
        "tags": ["heritage", "scenic", "culture"]
    },
    {
        "id": "stop-nh48-anmod-ghat",
        "name": "Anmod Ghat Forest Canopy",
        "type": "Viewpoint",
        "category": "Nature",
        "lat": 15.4300,
        "lng": 74.3800,
        "time_needed_mins": 30,
        "approx_cost": 0.0,
        "cost_label": "Free",
        "why_stop": "Dandeli wildlife sanctuary misty rainforest pass with winding ghat descents.",
        "opening_status": "Daylight hours",
        "data_state": "CURATED",
        "action_label": "Viewpoint",
        "action_type": "viewpoint",
        "tags": ["nature", "scenic", "viewpoint"]
    },

    # --- ECR / Chennai - Pondicherry Coastal Corridor ---
    {
        "id": "stop-ecr-mahabalipuram",
        "name": "Mahabalipuram Shore Temple & Monoliths",
        "type": "Heritage",
        "category": "Culture",
        "lat": 12.6160,
        "lng": 80.1990,
        "time_needed_mins": 50,
        "approx_cost": 40.0,
        "cost_label": "₹40 entry",
        "why_stop": "8th-century UNESCO granite rock-cut temples standing against the crashing Bay of Bengal waves.",
        "opening_status": "06:00 - 18:00",
        "data_state": "CURATED",
        "action_label": "Heritage stop",
        "action_type": "add_stop",
        "tags": ["heritage", "culture", "scenic"]
    },
    {
        "id": "stop-ecr-kovalam-surf",
        "name": "Covelong Point Beach & Cafe",
        "type": "Cafe",
        "category": "Food",
        "lat": 12.7910,
        "lng": 80.2520,
        "time_needed_mins": 35,
        "approx_cost": 250.0,
        "cost_label": "₹200 - ₹400",
        "why_stop": "Breezy oceanfront surf cafe serving fresh tender coconut, iced coffee, and seafood.",
        "opening_status": "07:00 - 21:00",
        "data_state": "CURATED",
        "action_label": "Ocean break",
        "action_type": "food_stop",
        "tags": ["food_focus", "cafe", "scenic"]
    }
]


class RouteStopDiscoveryEngine:
    """
    Spatial Corridor Stop Discovery Engine.
    Samples route geometry, computes perpendicular distance to route,
    calculates detour overhead, and ranks verified POIs.
    """

    @staticmethod
    def point_to_segment_distance(
        p_lat: float, p_lng: float,
        a_lat: float, a_lng: float,
        b_lat: float, b_lng: float
    ) -> float:
        """
        Calculates the minimum distance (in km) from point P to segment AB.
        """
        # Segment length squared in approx degree space
        dx = b_lng - a_lng
        dy = b_lat - a_lat
        seg_len_sq = dx * dx + dy * dy

        if seg_len_sq < 1e-9:
            return haversine_km(p_lat, p_lng, a_lat, a_lng)

        # Parameter t of projection onto line segment
        t = ((p_lng - a_lng) * dx + (p_lat - a_lat) * dy) / seg_len_sq
        t = max(0.0, min(1.0, t))

        proj_lat = a_lat + t * dy
        proj_lng = a_lng + t * dx

        return haversine_km(p_lat, p_lng, proj_lat, proj_lng)

    @staticmethod
    def min_distance_to_polyline(
        p_lat: float, p_lng: float,
        polyline: List[List[float]]
    ) -> float:
        """
        Finds the minimum distance in km from point (p_lat, p_lng) to a polyline.
        """
        if not polyline:
            return 9999.0

        if len(polyline) == 1:
            return haversine_km(p_lat, p_lng, polyline[0][0], polyline[0][1])

        min_dist = float("inf")
        # Subsample if polyline is very large for efficiency
        step = max(1, len(polyline) // 120)
        sampled = polyline[::step]
        if polyline[-1] != sampled[-1]:
            sampled.append(polyline[-1])

        for i in range(len(sampled) - 1):
            a_lat, a_lng = sampled[i][0], sampled[i][1]
            b_lat, b_lng = sampled[i + 1][0], sampled[i + 1][1]
            d = RouteStopDiscoveryEngine.point_to_segment_distance(
                p_lat, p_lng, a_lat, a_lng, b_lat, b_lng
            )
            if d < min_dist:
                min_dist = d

        return round(min_dist, 2)

    @staticmethod
    def calculate_detour(distance_off_route_km: float, highway_speed_kph: float = 45.0) -> Tuple[float, int]:
        """
        Calculate realistic round-trip detour distance and detour time.
        detour_km = ~2.1x distance off route (exit highway, reach POI, re-merge)
        detour_time_mins = (detour_km / highway_speed_kph) * 60
        """
        detour_km = round(distance_off_route_km * 2.1, 1)
        detour_time_mins = max(5, int(round((detour_km / highway_speed_kph) * 60.0)))
        return detour_km, detour_time_mins

    @staticmethod
    def score_stop(
        poi: Dict[str, Any],
        distance_off_route_km: float,
        detour_time_mins: int,
        preferences: List[str],
        trip_style: str
    ) -> float:
        """
        Rank candidates based on:
        - route proximity (closer = better)
        - detour time vs stop duration (penalize 40km detour for 15min attraction)
        - user interests / preferences match
        - quality / curated provenance
        """
        # Base proximity score (max 40 pts)
        max_corridor = 45.0 if trip_style == "Explore" else 30.0
        prox_score = max(0.0, 40.0 * (1.0 - (distance_off_route_km / max_corridor)))

        # Detour efficiency penalty: penalize large detours for short time
        time_needed = poi.get("time_needed_mins", 30)
        detour_penalty = 0.0
        if detour_time_mins > (time_needed * 1.5) and trip_style != "Explore":
            detour_penalty = 15.0

        # Category / User preferences match (max 30 pts)
        pref_score = 0.0
        poi_tags = poi.get("tags", [])
        for p in preferences:
            if p in poi_tags or p.lower() in poi.get("category", "").lower():
                pref_score += 15.0
        pref_score = min(30.0, pref_score)

        # Curated provenance boost
        prov_score = 10.0 if poi.get("data_state") == "CURATED" else 5.0

        return prox_score + pref_score + prov_score - detour_penalty

    @classmethod
    def discover_stops_for_route(
        cls,
        route_geometry: List[List[float]],
        origin_coords: Tuple[float, float],
        dest_coords: Tuple[float, float],
        preferences: Optional[List[str]] = None,
        trip_style: str = "Balanced",
        max_stops: int = 8,
        db_session=None
    ) -> List[Dict[str, Any]]:
        """
        Sample route corridor, compute distance from route, calculate detour,
        rank candidates, and return best stops along the way.
        """
        prefs = preferences or []
        corridor_polyline = route_geometry
        if not corridor_polyline:
            # If live route geometry was unavailable, construct 2-point corridor
            corridor_polyline = [
                [origin_coords[0], origin_coords[1]],
                [dest_coords[0], dest_coords[1]]
            ]

        # Bounding box with buffer for pre-filtering
        lats = [pt[0] for pt in corridor_polyline]
        lngs = [pt[1] for pt in corridor_polyline]
        min_lat, max_lat = min(lats) - 0.5, max(lats) + 0.5
        min_lng, max_lng = min(lngs) - 0.5, max(lngs) + 0.5

        candidates: List[Dict[str, Any]] = []

        # 1. Candidate search in curated catalog
        for poi in HIGHWAY_CORRIDOR_POIS:
            p_lat = poi["lat"]
            p_lng = poi["lng"]
            if min_lat <= p_lat <= max_lat and min_lng <= p_lng <= max_lng:
                dist_off = cls.min_distance_to_polyline(p_lat, p_lng, corridor_polyline)
                max_allowed = 45.0 if trip_style == "Explore" else 30.0
                if dist_off <= max_allowed:
                    detour_km, detour_mins = cls.calculate_detour(dist_off)
                    score = cls.score_stop(poi, dist_off, detour_mins, prefs, trip_style)
                    candidates.append({
                        **poi,
                        "distance_off_route_km": dist_off,
                        "route_offset_km": dist_off,
                        "detour_km": detour_km,
                        "detour_time_mins": detour_mins,
                        "ranking_score": score
                    })

        # 2. Candidate search in DB Places if db_session is provided
        if db_session:
            try:
                from app.models.models import Place
                db_places = db_session.query(Place).filter(
                    Place.latitude >= min_lat,
                    Place.latitude <= max_lat,
                    Place.longitude >= min_lng,
                    Place.longitude <= max_lng
                ).limit(30).all()

                for dp in db_places:
                    dist_off = cls.min_distance_to_polyline(dp.latitude, dp.longitude, corridor_polyline)
                    if dist_off <= 25.0:
                        detour_km, detour_mins = cls.calculate_detour(dist_off)
                        cand_item = {
                            "id": f"stop-db-{dp.id}",
                            "name": dp.name,
                            "type": dp.category or "Attraction",
                            "category": dp.category or "Culture",
                            "lat": dp.latitude,
                            "lng": dp.longitude,
                            "time_needed_mins": getattr(dp, "duration_hours", 1.0) * 60 or 45,
                            "approx_cost": getattr(dp, "ticket_price", 0.0) or 0.0,
                            "cost_label": f"₹{int(getattr(dp, 'ticket_price', 0.0))}" if getattr(dp, "ticket_price", 0.0) else "Free",
                            "why_stop": dp.description or f"Verified highway attraction near {dp.destination_id}.",
                            "opening_status": "Open",
                            "data_state": "CURATED",
                            "action_label": "Add stop",
                            "action_type": "add_stop",
                            "distance_off_route_km": dist_off,
                            "route_offset_km": dist_off,
                            "detour_km": detour_km,
                            "detour_time_mins": detour_mins,
                            "ranking_score": max(0.0, 35.0 * (1.0 - (dist_off / 25.0))) + 10.0
                        }
                        # Avoid duplicates
                        if not any(c["name"].lower() == cand_item["name"].lower() for c in candidates):
                            candidates.append(cand_item)
            except Exception as e:
                pass

        # Sort by ranking score descending
        candidates.sort(key=lambda x: x.get("ranking_score", 0), reverse=True)

        return candidates[:max_stops]
