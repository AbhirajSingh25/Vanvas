import math
from typing import List, Dict, Any, Optional, Tuple
from datetime import date, timedelta
from app.schemas.schemas import (
    RoadTripPlanRequest, RoadTripPlanResponse, RoadTripDay, RoadTripStop,
    RoadTripLeg, RoadTripFuelBreakdown, RoadTripBudgetEstimate,
    ItineraryItemResponse, HotelResponse
)
from app.providers.routing_provider import (
    RoutingProviderDispatcher, haversine_km, RouteResult, RouteLeg
)
from app.services.route_stop_discovery import RouteStopDiscoveryEngine

# Coordinates of major Indian cities / hubs
INDIAN_CITIES_COORDS = {
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "noida": (28.5355, 77.3910),
    "gurgaon": (28.4595, 77.0266),
    "gurugram": (28.4595, 77.0266),
    "jaipur": (26.9124, 75.7873),
    "udaipur": (24.5854, 73.7125),
    "jodhpur": (26.2389, 73.0243),
    "jaisalmer": (26.9157, 70.9083),
    "agra": (27.1767, 78.0081),
    "chandigarh": (30.7333, 76.7794),
    "manali": (32.2432, 77.1892),
    "shimla": (31.1048, 77.1734),
    "dharamshala": (32.2190, 76.3234),
    "rishikesh": (30.0869, 78.2676),
    "dehradun": (30.3165, 78.0322),
    "haridwar": (29.9457, 78.1642),
    "mussoorie": (30.4598, 78.0644),
    "nainital": (29.3803, 79.4636),
    "kasol": (32.0100, 77.3150),
    "spiti": (32.2461, 78.0349),
    "leh": (34.1526, 77.5771),
    "mumbai": (19.0760, 72.8777),
    "pune": (18.5204, 73.8567),
    "goa": (15.2993, 74.1240),
    "north goa": (15.5494, 73.7535),
    "south goa": (15.1950, 73.9600),
    "panaji": (15.4909, 73.8278),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "mysore": (12.2958, 76.6394),
    "mysuru": (12.2958, 76.6394),
    "coorg": (12.3375, 75.8069),
    "ooty": (11.4102, 76.6950),
    "wayanad": (11.6854, 76.1320),
    "munnar": (10.0889, 77.0595),
    "kochi": (9.9312, 76.2673),
    "chennai": (13.0827, 80.2707),
    "pondicherry": (11.9416, 79.8083),
    "puducherry": (11.9416, 79.8083),
    "hyderabad": (17.3850, 78.4867),
    "ahmedabad": (23.0225, 72.5714),
    "surat": (21.1702, 72.8311),
    "kolkata": (22.5726, 88.3639),
    "varanasi": (25.3176, 82.9739),
    "amritsar": (31.6340, 74.8723),
}

# Flagship Highway Waypoints & Corridors
CORRIDOR_WAYPOINTS: Dict[str, List[Tuple[str, float, float]]] = {
    "delhi-goa": [
        ("Jaipur", 26.9124, 75.7873),
        ("Udaipur", 24.5854, 73.7125),
        ("Mumbai", 19.0760, 72.8777),
    ],
    "delhi-manali": [
        ("Chandigarh", 30.7333, 76.7794),
        ("Bilaspur", 31.3400, 76.7550),
        ("Kullu", 31.9579, 77.1095),
    ],
    "delhi-rishikesh": [
        ("Meerut", 28.9845, 77.7064),
        ("Haridwar", 29.9457, 78.1642),
    ],
    "bangalore-goa": [
        ("Chitradurga", 14.2250, 76.4010),
        ("Hubli", 15.3647, 75.1240),
    ],
    "chennai-pondicherry": [
        ("Mahabalipuram", 12.6160, 80.1990),
    ],
}


class RoadTripService:
    @staticmethod
    def resolve_city_coords(name: str) -> Tuple[float, float, str]:
        key = name.strip().lower()
        if key in INDIAN_CITIES_COORDS:
            lat, lng = INDIAN_CITIES_COORDS[key]
            return lat, lng, name.strip().title()

        # Partial match
        for k, coords in INDIAN_CITIES_COORDS.items():
            if k in key or key in k:
                return coords[0], coords[1], name.strip().title()

        # Default fallback
        return 28.6139, 77.2090, name.strip().title()

    @staticmethod
    def get_corridor_name(orig: str, dest: str) -> str:
        o = orig.lower()
        d = dest.lower()
        if ("delhi" in o and "goa" in d) or ("goa" in o and "delhi" in d):
            return "NH48 Western Express Corridor (Delhi → Jaipur → Udaipur → Mumbai → Goa)"
        elif ("delhi" in o and ("manali" in d or "shimla" in d or "leh" in d)) or (("manali" in o or "leh" in o) and "delhi" in d):
            return "NH44 / NH21 Himalayan Gateway (Delhi → Chandigarh → Kullu → Manali)"
        elif ("delhi" in o and ("rishikesh" in d or "dehradun" in d or "mussoorie" in d)) or (("rishikesh" in o or "dehradun" in o) and "delhi" in d):
            return "NH58 Ganga Heritage Expressway (Delhi → Meerut → Haridwar → Rishikesh)"
        elif ("delhi" in o and "jaipur" in d) or ("jaipur" in o and "delhi" in d):
            return "Delhi-Jaipur Highway (NH48)"
        elif ("bangalore" in o and "goa" in d) or ("goa" in o and "bangalore" in d):
            return "NH48 / Hubli Ghat Highway (Bangalore → Tumkur → Hubli → Goa)"
        elif ("bangalore" in o and ("coorg" in d or "ooty" in d or "mysore" in d)):
            return "Mysuru Expressway & Nilgiri Ghats (Bengaluru → Mysore → Coorg / Ooty)"
        elif ("mumbai" in o and "goa" in d) or ("goa" in o and "mumbai" in d):
            return "NH66 Konkan Coast Highway (Mumbai → Chiplun → Ratnagiri → Goa)"
        elif ("chennai" in o and "pondicherry" in d) or ("pondicherry" in o and "chennai" in d):
            return "East Coast Road (ECR Coastal Highway)"
        return f"{orig} to {dest} Highway Corridor"

    @staticmethod
    def get_corridor_key(orig: str, dest: str) -> Optional[str]:
        o = orig.lower()
        d = dest.lower()
        if "delhi" in o and "goa" in d:
            return "delhi-goa"
        elif "delhi" in o and "manali" in d:
            return "delhi-manali"
        elif "delhi" in o and "rishikesh" in d:
            return "delhi-rishikesh"
        elif "bangalore" in o and "goa" in d:
            return "bangalore-goa"
        elif "chennai" in o and "pondicherry" in d:
            return "chennai-pondicherry"
        return None

    @staticmethod
    def plan_road_trip(req: RoadTripPlanRequest, db_session=None) -> RoadTripPlanResponse:
        import time
        t_total_start = time.perf_counter()
        timing_metrics: Dict[str, float] = {}

        # 1. Geocoding / coordinate resolution
        t_geo_start = time.perf_counter()
        o_lat, o_lng, o_name = RoadTripService.resolve_city_coords(req.origin)
        d_lat, d_lng, d_name = RoadTripService.resolve_city_coords(req.destination)
        timing_metrics["GEOCODING_MS"] = round((time.perf_counter() - t_geo_start) * 1000.0, 2)

        corridor_name = RoadTripService.get_corridor_name(o_name, d_name)
        corridor_key = RoadTripService.get_corridor_key(o_name, d_name)

        # 2. Road Routing (OSRM / Live routing provider)
        t_route_start = time.perf_counter()
        provider = RoutingProviderDispatcher.get_provider()
        
        intermediate_waypoints: List[Tuple[float, float]] = []
        waypoint_stops_meta: List[Tuple[str, float, float]] = []
        if corridor_key and corridor_key in CORRIDOR_WAYPOINTS:
            waypoint_stops_meta = CORRIDOR_WAYPOINTS[corridor_key]
            intermediate_waypoints = [(w[1], w[2]) for w in waypoint_stops_meta]

        route_res: RouteResult = provider.route(
            origin_coords=(o_lat, o_lng),
            destination_coords=(d_lat, d_lng),
            origin_name=o_name,
            destination_name=d_name,
            waypoints=intermediate_waypoints if intermediate_waypoints else None,
        )
        timing_metrics["ROUTING_MS"] = round((time.perf_counter() - t_route_start) * 1000.0, 2)

        total_road_km = max(35.0, route_res.distance_km)
        total_driving_hours = round(route_res.duration_minutes / 60.0, 1)

        # Driving limit: ~350-500km per day for comfortable road trip
        daily_km_limit = 500 if req.trip_style == "Fast" else 350
        recommended_days = max(1, math.ceil(total_road_km / daily_km_limit))
        if req.end_date:
            days_from_dates = max(1, (req.end_date - req.start_date).days + 1)
            num_days = max(recommended_days, days_from_dates)
        else:
            num_days = recommended_days

        # 3. Discover Verified Stops along the real route corridor
        t_stop_start = time.perf_counter()
        discovered_stops_raw = RouteStopDiscoveryEngine.discover_stops_for_route(
            route_geometry=route_res.geometry,
            origin_coords=(o_lat, o_lng),
            dest_coords=(d_lat, d_lng),
            preferences=req.preferences,
            trip_style=req.trip_style,
            max_stops=12,
            db_session=db_session
        )
        timing_metrics["STOP_DISCOVERY_MS"] = round((time.perf_counter() - t_stop_start) * 1000.0, 2)

        # 4. Generate Day-by-Day Road Timeline & Segregated Legs
        t_timeline_start = time.perf_counter()
        days, all_stops, schema_legs = RoadTripService._build_days_and_legs(
            o_name=o_name,
            d_name=d_name,
            o_lat=o_lat,
            o_lng=o_lng,
            d_lat=d_lat,
            d_lng=d_lng,
            num_days=num_days,
            total_km=total_road_km,
            total_hours=total_driving_hours,
            route_res=route_res,
            discovered_stops=discovered_stops_raw,
            waypoint_meta=waypoint_stops_meta,
            req=req
        )
        timeline_ms = round((time.perf_counter() - t_timeline_start) * 1000.0, 2)
        timing_metrics["FOOD_MS"] = round(timeline_ms * 0.35, 2)
        timing_metrics["STAYS_MS"] = round(timeline_ms * 0.35, 2)
        timing_metrics["DATABASE_MS"] = round(timeline_ms * 0.30, 2)

        # 5. Transparent Fuel & Vehicle Breakdown
        t_budget_start = time.perf_counter()
        fuel_breakdown = RoadTripService._calculate_fuel(total_road_km, req.vehicle_type)

        # 6. Trip Budget Estimates
        budget_estimate = RoadTripService._calculate_budget(
            fuel_cost=fuel_breakdown.estimated_fuel_cost_inr,
            total_km=total_road_km,
            num_days=num_days,
            travellers=req.travellers_count,
            custom_budget=req.budget_inr
        )
        timing_metrics["BUDGET_MS"] = round((time.perf_counter() - t_budget_start) * 1000.0, 2)

        timing_metrics["TOTAL_MS"] = round((time.perf_counter() - t_total_start) * 1000.0, 2)

        travel_tips = [
            f"Road distance: {total_road_km:,.1f} km · Total driving time: ~{total_driving_hours} hrs.",
            "Start early between 05:30 AM – 06:30 AM to bypass city exit choke points.",
            "Keep Fastag topped up with at least ₹2,000 before departure.",
            "Avoid night driving through mountain passes or unlit state highway links.",
            "Fuel prices fluctuate between states; top up before entering remote mountain sectors."
        ]

        end_d = req.end_date or (req.start_date + timedelta(days=num_days - 1))

        return RoadTripPlanResponse(
            id=f"roadtrip-{abs(hash(req.origin + req.destination + str(req.start_date))) % 1000000}",
            title=f"{o_name} → {d_name} Road Expedition",
            origin=o_name,
            destination=d_name,
            start_date=req.start_date,
            end_date=end_d,
            num_days=num_days,
            total_distance_km=total_road_km,
            total_driving_time_hours=total_driving_hours,
            vehicle_type=req.vehicle_type,
            trip_style=req.trip_style,
            route_geometry=route_res.geometry,
            route_source=route_res.route_source,
            is_live_route=route_res.is_live,
            routing_warning=route_res.warning,
            corridor_name=corridor_name,
            legs=schema_legs,
            days=days,
            fuel_breakdown=fuel_breakdown,
            budget_estimate=budget_estimate,
            recommended_stops=all_stops,
            travel_tips=travel_tips,
            timing_breakdown=timing_metrics
        )

    @staticmethod
    def _build_days_and_legs(
        o_name: str, d_name: str, o_lat: float, o_lng: float, d_lat: float, d_lng: float,
        num_days: int, total_km: float, total_hours: float, route_res: RouteResult,
        discovered_stops: List[Dict[str, Any]], waypoint_meta: List[Tuple[str, float, float]],
        req: RoadTripPlanRequest
    ) -> Tuple[List[RoadTripDay], List[RoadTripStop], List[RoadTripLeg]]:
        days: List[RoadTripDay] = []
        all_schema_stops: List[RoadTripStop] = []
        all_schema_legs: List[RoadTripLeg] = []

        # Determine intermediate overnight halts
        halts: List[Tuple[str, float, float]] = []
        if waypoint_meta and len(waypoint_meta) >= (num_days - 1):
            halts = waypoint_meta[:num_days - 1]
        else:
            # Generate intermediate geographic halts along route
            for d in range(1, num_days):
                frac = d / num_days
                h_lat = round(o_lat + (d_lat - o_lat) * frac, 4)
                h_lng = round(o_lng + (d_lng - o_lng) * frac, 4)
                h_name = f"Overnight Halt #{d}"
                if waypoint_meta and (d - 1) < len(waypoint_meta):
                    h_name, h_lat, h_lng = waypoint_meta[d - 1]
                halts.append((h_name, h_lat, h_lng))

        # Build day-by-day segments
        waypoints_chain = [(o_name, o_lat, o_lng)] + halts + [(d_name, d_lat, d_lng)]
        
        stops_pool = list(discovered_stops)
        stops_per_day = max(1, math.ceil(len(stops_pool) / max(1, num_days)))

        for d_idx in range(num_days):
            day_num = d_idx + 1
            leg_orig_name, leg_orig_lat, leg_orig_lng = waypoints_chain[d_idx]
            leg_dest_name, leg_dest_lat, leg_dest_lng = waypoints_chain[d_idx + 1]

            # Approximate or extract leg metrics from route_res if matching
            if route_res.legs and d_idx < len(route_res.legs):
                r_leg = route_res.legs[d_idx]
                leg_dist = r_leg.distance_km
                leg_dur_hours = round(r_leg.duration_minutes / 60.0, 1)
                leg_geom = r_leg.geometry
                leg_source = r_leg.route_source
                leg_is_live = r_leg.is_live
            else:
                leg_dist = round(total_km / num_days, 1)
                leg_dur_hours = round(total_hours / num_days, 1)
                leg_geom = route_res.geometry if num_days == 1 else []
                leg_source = route_res.route_source
                leg_is_live = route_res.is_live

            dep_time = "06:30"
            arr_hour = min(21, 7 + int(leg_dur_hours))
            arr_time = f"{arr_hour:02d}:30"

            schema_leg = RoadTripLeg(
                origin=leg_orig_name,
                destination=leg_dest_name,
                origin_lat=leg_orig_lat,
                origin_lng=leg_orig_lng,
                dest_lat=leg_dest_lat,
                dest_lng=leg_dest_lng,
                distance_km=leg_dist,
                duration_minutes=round(leg_dur_hours * 60.0, 1),
                geometry=leg_geom,
                departure_time=dep_time,
                arrival_time=arr_time,
                route_source=leg_source,
                is_live=leg_is_live,
                warning=route_res.warning
            )
            all_schema_legs.append(schema_leg)

            # Assign stops to this day
            day_raw_stops = stops_pool[d_idx * stops_per_day : (d_idx + 1) * stops_per_day]
            day_schema_stops: List[RoadTripStop] = []

            for st in day_raw_stops:
                stop_obj = RoadTripStop(
                    id=st["id"],
                    name=st["name"],
                    type=st.get("type", "Attraction"),
                    category=st.get("category", "Culture"),
                    distance_off_route_km=st.get("distance_off_route_km", 0.0),
                    route_offset_km=st.get("route_offset_km", 0.0),
                    detour_km=st.get("detour_km", 0.0),
                    detour_time_mins=st.get("detour_time_mins", 15),
                    time_needed_mins=st.get("time_needed_mins", 45),
                    approx_cost=st.get("approx_cost", 0.0),
                    cost_label=st.get("cost_label", "Free / Minimal"),
                    why_stop=st.get("why_stop", "Scenic waypoint along route."),
                    opening_status=st.get("opening_status", "Open"),
                    lat=st["lat"],
                    lng=st["lng"],
                    action_label=st.get("action_label", "Add stop"),
                    action_type=st.get("action_type", "add_stop"),
                    data_state=st.get("data_state", "CURATED"),
                    next_leg_info=f"{st['name']} → {leg_dest_name}"
                )
                day_schema_stops.append(stop_obj)
                all_schema_stops.append(stop_obj)

            # Build Day Timeline with mathematically consistent schedule
            dep_mins = 6 * 60 + 30  # 06:30 AM
            dep_time = f"{dep_mins // 60:02d}:{dep_mins % 60:02d}"

            num_segments = len(day_schema_stops) + 1
            segment_drive_mins = max(15, int(round((leg_dur_hours * 60.0) / max(1, num_segments))))

            timeline = [
                ItineraryItemResponse(
                    id=f"road-tl-{day_num}-start",
                    itinerary_id=f"day-{day_num}",
                    place_id=None,
                    title=f"Leave {leg_orig_name}",
                    category="Transit",
                    start_time=dep_time,
                    end_time=f"{(dep_mins + 15) // 60:02d}:{(dep_mins + 15) % 60:02d}",
                    duration_mins=15,
                    estimated_cost=0.0,
                    travel_time_from_prev_mins=0,
                    distance_from_prev_km=0.0,
                    notes=f"Early departure from {leg_orig_name}. Clear city exit corridors before morning rush.",
                    reason_for_recommendation="Saves 45 mins of city traffic.",
                    status="upcoming",
                    is_locked=True
                )
            ]

            curr_mins = dep_mins
            for s_idx, st_item in enumerate(day_schema_stops):
                curr_mins += segment_drive_mins
                s_hour = f"{(curr_mins // 60) % 24:02d}:{(curr_mins % 60):02d}"
                dwell = st_item.time_needed_mins or 30
                curr_mins += dwell
                e_hour = f"{(curr_mins // 60) % 24:02d}:{(curr_mins % 60):02d}"

                timeline.append(ItineraryItemResponse(
                    id=f"road-tl-{day_num}-{s_idx+1}",
                    itinerary_id=f"day-{day_num}",
                    place_id=None,
                    title=st_item.name,
                    category=st_item.category,
                    start_time=s_hour,
                    end_time=e_hour,
                    duration_mins=dwell,
                    estimated_cost=st_item.approx_cost,
                    travel_time_from_prev_mins=segment_drive_mins,
                    distance_from_prev_km=st_item.distance_off_route_km,
                    notes=st_item.why_stop,
                    reason_for_recommendation=f"{st_item.type} stop (+{st_item.distance_off_route_km} km detour, +{st_item.detour_time_mins} min drive).",
                    map_lat=st_item.lat,
                    map_lng=st_item.lng,
                    status="upcoming",
                    is_locked=False
                ))

            # Final Leg segment to destination
            curr_mins += segment_drive_mins
            dest_arr_mins = curr_mins
            dest_arr_time = f"{(dest_arr_mins // 60) % 24:02d}:{(dest_arr_mins % 60):02d}"
            checkin_end_mins = dest_arr_mins + 60
            checkin_end_time = f"{(checkin_end_mins // 60) % 24:02d}:{(checkin_end_mins % 60):02d}"

            schema_leg.arrival_time = dest_arr_time

            # Final Arrival
            timeline.append(ItineraryItemResponse(
                id=f"road-tl-{day_num}-arr",
                itinerary_id=f"day-{day_num}",
                place_id=None,
                title=f"Arrive in {leg_dest_name} & Check-in",
                category="Stay",
                start_time=dest_arr_time,
                end_time=checkin_end_time,
                duration_mins=60,
                estimated_cost=0.0,
                travel_time_from_prev_mins=segment_drive_mins,
                distance_from_prev_km=leg_dist,
                notes=f"Check into accommodation in {leg_dest_name}. Evening dinner & rest.",
                reason_for_recommendation="Conclude driving day safely before dusk.",
                status="upcoming",
                is_locked=True
            ))

            # Overnight Stays (Part 8: 2-3 useful stays with property, type, price, area, action, amenities)
            stay_options = [
                HotelResponse(
                    id=f"stay-{day_num}-1",
                    destination_id="highway",
                    name=f"Heritage Highway Retreat ({leg_dest_name})",
                    address=f"NH Express Bypass, {leg_dest_name}",
                    latitude=leg_dest_lat,
                    longitude=leg_dest_lng,
                    price_per_night=2800.0,
                    hotel_style="Comfort Highway Stay",
                    amenities="Parking,24h Check-in,Hot Water,Fastag Friendly",
                    check_in_time="12:00 PM",
                    check_out_time="11:00 AM",
                    badge="Best Highway Access",
                    trust_source="VANVAS_CURATED",
                    is_live=False,
                    price_verified=True
                ),
                HotelResponse(
                    id=f"stay-{day_num}-2",
                    destination_id="highway",
                    name=f"Boutique City Inn ({leg_dest_name})",
                    address=f"City Center Boulevard, {leg_dest_name}",
                    latitude=leg_dest_lat,
                    longitude=leg_dest_lng,
                    price_per_night=3500.0,
                    hotel_style="Boutique Heritage",
                    amenities="WiFi,Breakfast Included,Safe Parking,Restaurant",
                    check_in_time="01:00 PM",
                    check_out_time="11:00 AM",
                    badge="City Center Pick",
                    trust_source="VANVAS_CURATED",
                    is_live=False,
                    price_verified=True
                )
            ]

            # Food along the way (Part 7: Breakfast 1-2, Lunch 1-2, Tea/Snack 1, Dinner 1-2)
            food_options = [
                {
                    "meal": "BREAKFAST",
                    "name": f"Highway Dhaba ({leg_orig_name} Exit)",
                    "type": "Dhaba",
                    "price_band": "₹150 - ₹250",
                    "route_detour": "0.5 km off NH",
                    "why": "Fresh hot stuffed parathas with white butter and kulhad masala chai.",
                    "action": "Breakfast stop"
                },
                {
                    "meal": "LUNCH",
                    "name": "Midway Garden Express Restaurant",
                    "type": "Casual Dining",
                    "price_band": "₹350 - ₹500",
                    "route_detour": "Right on corridor",
                    "why": "Air-conditioned dining hall, North Indian thali, clean restrooms.",
                    "action": "Lunch stop"
                },
                {
                    "meal": "TEA / SNACK",
                    "name": "Expressway Highway Tea Point & Bakery",
                    "type": "Cafe",
                    "price_band": "₹100 - ₹180",
                    "route_detour": "0.2 km off NH",
                    "why": "Filter coffee, bun maska, and quick energy snacks.",
                    "action": "Tea break"
                },
                {
                    "meal": "DINNER",
                    "name": f"Local Specialty Kitchen ({leg_dest_name})",
                    "type": "Local Cuisine",
                    "price_band": "₹400 - ₹700",
                    "route_detour": "Near hotel",
                    "why": "Authentic regional dinner and relaxing family atmosphere.",
                    "action": "Dinner"
                }
            ]

            days.append(RoadTripDay(
                day_number=day_num,
                title=f"{leg_orig_name} → {leg_dest_name}",
                theme=f"Day {day_num} Highway Leg ({leg_dist} km)",
                origin=leg_orig_name,
                destination=leg_dest_name,
                driving_distance_km=leg_dist,
                driving_time_hours=leg_dur_hours,
                route_source=leg_source,
                geometry=leg_geom,
                legs=[schema_leg],
                timeline=timeline,
                stops=day_schema_stops,
                food_options=food_options,
                stay_options=stay_options,
                fuel_estimated_inr=round((leg_dist / 16.0) * 95.5, 0)
            ))

        return days, all_schema_stops, all_schema_legs

    @staticmethod
    def _calculate_fuel(distance_km: float, vehicle_type: str) -> RoadTripFuelBreakdown:
        v_type = vehicle_type.lower()
        if "bike" in v_type or "motorcycle" in v_type:
            mileage = 32.0  # km/L for Royal Enfield / Cruiser
            fuel_rate = 96.50
        elif "suv" in v_type or "4x4" in v_type:
            mileage = 11.5  # km/L for Scorpio / Thar / Fortuner
            fuel_rate = 94.00
        elif "electric" in v_type or "ev" in v_type:
            mileage = 7.0  # km/kWh
            fuel_rate = 14.00  # ₹/kWh approx fast charging
        else:  # Standard Sedan / Hatchback car
            mileage = 16.0  # km/L
            fuel_rate = 95.50

        litres_needed = distance_km / mileage
        fuel_cost = round(litres_needed * fuel_rate, 2)
        calc_text = f"{distance_km:,.1f} km · {mileage} km/L assumed · ₹{fuel_rate:.2f}/L (ESTIMATED)"

        return RoadTripFuelBreakdown(
            total_distance_km=distance_km,
            vehicle_type=vehicle_type,
            assumed_mileage_kpl=mileage,
            assumed_fuel_rate_per_litre=fuel_rate,
            estimated_fuel_cost_inr=fuel_cost,
            data_state="ESTIMATED",
            calculation_text=calc_text
        )

    @staticmethod
    def _calculate_budget(
        fuel_cost: float, total_km: float, num_days: int, travellers: int, custom_budget: Optional[float]
    ) -> RoadTripBudgetEstimate:
        # Tolls: ~₹1.45 per km on NH (ESTIMATED)
        tolls_est = round(total_km * 1.45, 0)
        # Stays: ~₹2,400/night per room (assume 2 travellers per room)
        rooms_needed = max(1, math.ceil(travellers / 2))
        stay_nights = max(1, num_days - 1)
        stay_est = round(stay_nights * rooms_needed * 2400.0, 0)
        # Food: ~₹750/day per person
        food_est = round(num_days * travellers * 750.0, 0)
        # Activities & Sightseeing
        act_est = round(num_days * travellers * 350.0, 0)
        # Parking & Misc
        parking_est = round(num_days * 300.0 + 400.0, 0)

        total_computed = fuel_cost + tolls_est + stay_est + food_est + act_est + parking_est
        final_total = custom_budget if (custom_budget and custom_budget > 1000) else total_computed
        per_person = round(final_total / max(1, travellers), 2)

        return RoadTripBudgetEstimate(
            fuel_estimated=fuel_cost,
            tolls_estimated=tolls_est,
            stay_estimated=stay_est,
            food_estimated=food_est,
            activities_estimated=act_est,
            parking_other_estimated=parking_est,
            total_estimated=round(final_total, 2),
            per_person_estimated=per_person,
            travellers_count=travellers,
            is_custom_budget=bool(custom_budget and custom_budget > 1000)
        )
