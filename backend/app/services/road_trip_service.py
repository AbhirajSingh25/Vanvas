import math
from typing import List, Dict, Any, Optional, Tuple
from datetime import date, timedelta
from app.schemas.schemas import (
    RoadTripPlanRequest, RoadTripPlanResponse, RoadTripDay, RoadTripStop,
    RoadTripFuelBreakdown, RoadTripBudgetEstimate, ItineraryItemResponse,
    HotelResponse
)

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
    "kolkata": (22.5726, 88.3639),
    "varanasi": (25.3176, 82.9739),
    "amritsar": (31.6340, 74.8723),
}

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

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
    def plan_road_trip(req: RoadTripPlanRequest, db_session=None) -> RoadTripPlanResponse:
        o_lat, o_lng, o_name = RoadTripService.resolve_city_coords(req.origin)
        d_lat, d_lng, d_name = RoadTripService.resolve_city_coords(req.destination)

        # Straight line baseline vs realistic road distance factor
        straight_dist = haversine_km(o_lat, o_lng, d_lat, d_lng)
        # Indian road factor: hills = 1.35x, plains/expressways = 1.18x - 1.25x
        is_hill = any(h in req.destination.lower() or h in req.origin.lower() for h in ["manali", "shimla", "spiti", "leh", "kasol", "rishikesh", "dehradun", "mussoorie", "ooty", "munnar", "coorg"])
        road_factor = 1.38 if is_hill else 1.24
        total_road_km = max(35.0, round(straight_dist * road_factor, 1))

        # Speed estimation
        avg_speed_kph = 42.0 if is_hill else (68.0 if req.trip_style == "Fast" else 58.0)
        total_driving_hours = round(total_road_km / avg_speed_kph, 1)

        # Determine number of days & overnight stops
        # Driving limit: ~350-500km per day for comfortable road trip
        daily_km_limit = 500 if req.trip_style == "Fast" else 350
        recommended_days = max(1, math.ceil(total_road_km / daily_km_limit))
        if req.end_date:
            days_from_dates = max(1, (req.end_date - req.start_date).days + 1)
            num_days = max(recommended_days, days_from_dates)
        else:
            num_days = recommended_days

        corridor_name = RoadTripService.get_corridor_name(o_name, d_name)

        # Generate route geometry interpolation with realistic road waypoints
        geometry = RoadTripService._generate_route_geometry(o_lat, o_lng, d_lat, d_lng, corridor_name)

        # Generate Day by Day Road Timeline
        days, all_stops = RoadTripService._generate_days_and_stops(
            o_name, d_name, o_lat, o_lng, d_lat, d_lng, num_days, total_road_km, req, corridor_name
        )

        # Vehicle Fuel & Consumption calculations
        fuel_breakdown = RoadTripService._calculate_fuel(total_road_km, req.vehicle_type)

        # Trip Budget Estimates
        budget_estimate = RoadTripService._calculate_budget(
            fuel_cost=fuel_breakdown.estimated_fuel_cost_inr,
            total_km=total_road_km,
            num_days=num_days,
            travellers=req.travellers_count,
            custom_budget=req.budget_inr
        )

        travel_tips = [
            f"Road distance is {total_road_km} km with approx {total_driving_hours} hours total wheel time.",
            "Start early between 05:30 AM – 06:30 AM to bypass city exit bottlenecks.",
            "Keep Fastag topped up with at least ₹2,000 before starting.",
            "Avoid night driving through mountain passes or unlit state highways.",
            "Fuel prices fluctuate slightly between state borders; fuel up before entering remote mountain sectors."
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
            route_geometry=geometry,
            corridor_name=corridor_name,
            days=days,
            fuel_breakdown=fuel_breakdown,
            budget_estimate=budget_estimate,
            recommended_stops=all_stops,
            travel_tips=travel_tips
        )

    @staticmethod
    def _generate_route_geometry(o_lat: float, o_lng: float, d_lat: float, d_lng: float, corridor: str) -> List[List[float]]:
        # Interpolate waypoints with realistic curvature
        points = [[o_lat, o_lng]]
        steps = 10
        for i in range(1, steps):
            frac = i / steps
            # Add slight realistic sine curve to avoid straight stick line
            curve_lat = math.sin(frac * math.pi) * 0.15
            curve_lng = math.cos(frac * math.pi * 0.5) * 0.12
            lat = o_lat + (d_lat - o_lat) * frac + curve_lat
            lng = o_lng + (d_lng - o_lng) * frac + curve_lng
            points.append([round(lat, 5), round(lng, 5)])
        points.append([d_lat, d_lng])
        return points

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
        else: # Standard Sedan / Hatchback car
            mileage = 16.0  # km/L
            fuel_rate = 95.50

        litres_needed = distance_km / mileage
        fuel_cost = round(litres_needed * fuel_rate, 2)
        calc_text = f"{distance_km:,.0f} km · {mileage} km/L assumed · ₹{fuel_rate:.2f}/L"

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
    def _calculate_budget(fuel_cost: float, total_km: float, num_days: int, travellers: int, custom_budget: Optional[float]) -> RoadTripBudgetEstimate:
        # Tolls: ~₹1.2 to ₹1.8 per km on NH
        tolls_est = round(total_km * 1.45, 0)
        # Stays: ~₹2,200/night per room (assume 2 travellers per room)
        rooms_needed = max(1, math.ceil(travellers / 2))
        stay_nights = max(1, num_days - 1)
        stay_est = round(stay_nights * rooms_needed * 2400.0, 0)
        # Food: ~₹800/day per person (highway dhabas & dinners)
        food_est = round(num_days * travellers * 750.0, 0)
        # Activities & Sightseeing tickets
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

    @staticmethod
    def _generate_days_and_stops(
        o_name: str, d_name: str, o_lat: float, o_lng: float, d_lat: float, d_lng: float,
        num_days: int, total_km: float, req: RoadTripPlanRequest, corridor: str
    ) -> Tuple[List[RoadTripDay], List[RoadTripStop]]:
        days: List[RoadTripDay] = []
        all_stops: List[RoadTripStop] = []

        is_delhi_goa = "delhi" in o_name.lower() and "goa" in d_name.lower()
        is_delhi_manali = "delhi" in o_name.lower() and "manali" in d_name.lower()
        is_delhi_rishikesh = "delhi" in o_name.lower() and "rishikesh" in d_name.lower()
        is_bangalore_goa = "bangalore" in o_name.lower() and "goa" in d_name.lower()

        # Day breakdown logic
        if is_delhi_goa:
            # Multi-day flagship road trip: Delhi -> Jaipur -> Udaipur -> Pune/Kolhapur -> Goa
            legs = [
                ("Delhi", "Jaipur", 280, 5.0, "Heritage Highway & Fort Gateways", [
                    RoadTripStop(
                        id="stop-neemrana", name="Neemrana Fort-Palace", type="Fort", category="Heritage",
                        distance_off_route_km=4.5, time_needed_mins=45, approx_cost=250.0,
                        why_stop="15th century step fortress & scenic ridge tea stop right along NH48.",
                        lat=27.9940, lng=76.3880, action_label="Add stop", action_type="add_stop",
                        next_leg_info="Neemrana → Jaipur (2h 10m · 145 km)"
                    ),
                    RoadTripStop(
                        id="stop-amrik-rao", name="Old Rao Dhaba (Dharuhera)", type="Dhaba", category="Food",
                        distance_off_route_km=0.5, time_needed_mins=35, approx_cost=180.0,
                        why_stop="Iconic tandoori parathas with white butter and kulhad chai.",
                        lat=28.2050, lng=76.7900, action_label="Breakfast stop", action_type="food_stop",
                        next_leg_info="Dharuhera → Neemrana (45m · 48 km)"
                    )
                ]),
                ("Jaipur", "Udaipur", 395, 6.5, "Royal Mewar Transit & Lake Vistas", [
                    RoadTripStop(
                        id="stop-ajmer-pushkar", name="Pushkar Ghats & Stepwells", type="Heritage Site", category="Culture",
                        distance_off_route_km=12.0, time_needed_mins=60, approx_cost=0.0,
                        why_stop="Historic sacred lake & desert bazaar detour (+12 km from Ajmer bypass).",
                        lat=26.4897, lng=74.5511, action_label="Add stop", action_type="add_stop",
                        next_leg_info="Pushkar → Udaipur (4h 45m · 280 km)"
                    ),
                    RoadTripStop(
                        id="stop-chittorgarh", name="Chittorgarh Fort Viewpoint", type="Fort", category="Heritage",
                        distance_off_route_km=6.0, time_needed_mins=50, approx_cost=100.0,
                        why_stop="Largest hill fort complex in India visible right from the bypass highway.",
                        lat=24.8879, lng=74.6454, action_label="Viewpoint stop", action_type="viewpoint",
                        next_leg_info="Chittor → Udaipur (1h 45m · 112 km)"
                    )
                ]),
                ("Udaipur", "Ahmedabad / Surat", 450, 7.0, "Aravalli Ghats to Coastal Plains", [
                    RoadTripStop(
                        id="stop-shamlaji", name="Shamlaji Temple & Riverfront", type="Temple", category="Culture",
                        distance_off_route_km=2.0, time_needed_mins=30, approx_cost=0.0,
                        why_stop="Ancient stone carvings by the Meshwo River right on Gujarat border.",
                        lat=23.6870, lng=73.3850, action_label="Add stop", action_type="add_stop"
                    )
                ]),
                ("Surat / Mumbai", "Goa", 540, 8.5, "Western Ghats to Arabian Palms", [
                    RoadTripStop(
                        id="stop-amboli", name="Amboli Ghat Waterfall & Mist Point", type="Waterfall", category="Nature",
                        distance_off_route_km=8.0, time_needed_mins=40, approx_cost=0.0,
                        why_stop="Lush evergreen mountain pass before descending into North Goa.",
                        lat=15.9580, lng=73.9990, action_label="Add stop", action_type="add_stop"
                    )
                ])
            ]
        elif is_delhi_manali:
            legs = [
                ("Delhi", "Chandigarh", 245, 4.5, "Grand Trunk Highway & Murthal Dhabas", [
                    RoadTripStop(
                        id="stop-murthal", name="Amrik Sukhdev (Murthal)", type="Dhaba", category="Food",
                        distance_off_route_km=0.2, time_needed_mins=45, approx_cost=250.0,
                        why_stop="Legendary highway breakfast stop on NH44: hot aloo pyaaz parathas with fresh makhan.",
                        lat=29.0250, lng=77.0700, action_label="Breakfast stop", action_type="food_stop"
                    ),
                    RoadTripStop(
                        id="stop-kurukshetra", name="Brahma Sarovar Ghat", type="Lake", category="Heritage",
                        distance_off_route_km=6.0, time_needed_mins=30, approx_cost=0.0,
                        why_stop="Sprawling historic water sanctuary and quiet walking esplanade.",
                        lat=29.9650, lng=76.8370, action_label="Add stop", action_type="add_stop"
                    )
                ]),
                ("Chandigarh", "Manali", 295, 7.0, "Beas River Canyons & Aut Tunnel", [
                    RoadTripStop(
                        id="stop-bilaspur", name="Gobind Sagar Lake Viewpoint", type="Lake", category="Viewpoint",
                        distance_off_route_km=2.5, time_needed_mins=25, approx_cost=0.0,
                        why_stop="Wide emerald reservoir viewpoint before the steep hill curves begin.",
                        lat=31.3400, lng=76.7550, action_label="Viewpoint", action_type="viewpoint"
                    ),
                    RoadTripStop(
                        id="stop-pandoh", name="Pandoh Dam Spillway", type="Viewpoint", category="Nature",
                        distance_off_route_km=1.0, time_needed_mins=20, approx_cost=0.0,
                        why_stop="Massive water discharge point surrounded by pine-covered cliffs.",
                        lat=31.6700, lng=77.0580, action_label="Add stop", action_type="add_stop"
                    )
                ])
            ]
        elif is_delhi_rishikesh:
            legs = [
                ("Delhi", "Rishikesh", 240, 5.0, "Meerut Expressway to Himalayan Foothills", [
                    RoadTripStop(
                        id="stop-cheetal", name="Cheetal Grand (Khatauli Bypass)", type="Café", category="Food",
                        distance_off_route_km=0.5, time_needed_mins=40, approx_cost=300.0,
                        why_stop="Green manicured garden café with filter coffee, paneer cutlets, and clean restrooms.",
                        lat=29.2800, lng=77.7200, action_label="Snack stop", action_type="food_stop"
                    ),
                    RoadTripStop(
                        id="stop-haridwar-ghat", name="Har Ki Pauri Ghat (Haridwar)", type="Heritage Site", category="Culture",
                        distance_off_route_km=4.0, time_needed_mins=45, approx_cost=0.0,
                        why_stop="Sacred riverbank right before the final 20 km drive up into Rishikesh.",
                        lat=29.9560, lng=78.1700, action_label="Add stop", action_type="add_stop"
                    )
                ])
            ]
        elif is_bangalore_goa:
            legs = [
                ("Bangalore", "Hubli / Dharwad", 410, 6.0, "Deccan Plains & NH48 Expressway", [
                    RoadTripStop(
                        id="stop-chitradurga", name="Chitradurga Fort of Seven Circles", type="Fort", category="Heritage",
                        distance_off_route_km=3.5, time_needed_mins=60, approx_cost=50.0,
                        why_stop="Massive 17th century stone fortification built into boulder hills.",
                        lat=14.2250, lng=76.4010, action_label="Add stop", action_type="add_stop"
                    )
                ]),
                ("Hubli", "Goa", 160, 4.0, "Dandeli Forest & Anmod Ghat Pass", [
                    RoadTripStop(
                        id="stop-dudhsagar-view", name="Anmod Ghat Forest Canopy", type="Viewpoint", category="Nature",
                        distance_off_route_km=2.0, time_needed_mins=30, approx_cost=0.0,
                        why_stop="Misty mountain switchbacks descending from Karnataka into Goa palms.",
                        lat=15.4300, lng=74.3800, action_label="Add stop", action_type="add_stop"
                    )
                ])
            ]
        else:
            # Generic synthetic realistic corridor
            km_per_day = round(total_km / num_days, 1)
            legs = []
            for d in range(1, num_days + 1):
                d_orig = o_name if d == 1 else f"Overnight Halt #{d-1}"
                d_dest = d_name if d == num_days else f"Overnight Halt #{d}"
                legs.append((
                    d_orig, d_dest, km_per_day, round(km_per_day / 55.0, 1),
                    f"Day {d}: Highway Leg ({km_per_day} km)",
                    [
                        RoadTripStop(
                            id=f"stop-gen-{d}-1", name=f"Scenic Highway Rest Stop (NH)", type="Rest Stop", category="Transit",
                            distance_off_route_km=1.0, time_needed_mins=30, approx_cost=150.0,
                            why_stop="Clean highway fuel, food & tea pavilion along the corridor.",
                            lat=round(o_lat + (d_lat - o_lat) * (d / (num_days + 1)), 4),
                            lng=round(o_lng + (d_lng - o_lng) * (d / (num_days + 1)), 4),
                            action_label="Rest stop", action_type="food_stop"
                        )
                    ]
                ))

        # Build day objects
        for idx, leg_data in enumerate(legs[:num_days]):
            d_num = idx + 1
            orig_leg, dest_leg, dist_leg, time_leg, theme_leg, leg_stops = leg_data
            all_stops.extend(leg_stops)

            # Build timeline items for this day
            timeline = [
                ItineraryItemResponse(
                    id=f"road-tl-{d_num}-1", itinerary_id=f"day-{d_num}", place_id=None,
                    title=f"Leave {orig_leg}", category="Transit",
                    start_time="06:30", end_time="07:00", duration_mins=30, estimated_cost=0.0,
                    travel_time_from_prev_mins=0, distance_from_prev_km=0.0,
                    notes=f"Early start from {orig_leg}. Clear city limits before rush hour.",
                    reason_for_recommendation="Saves 45 mins in morning traffic.",
                    status="upcoming", is_locked=True
                )
            ]

            curr_mins = 7 * 60
            for s_idx, st in enumerate(leg_stops):
                curr_mins += int(st.time_needed_mins + 60)
                start_h = f"{(curr_mins // 60) % 24:02d}:{(curr_mins % 60):02d}"
                end_m = curr_mins + st.time_needed_mins
                end_h = f"{(end_m // 60) % 24:02d}:{(end_m % 60):02d}"

                timeline.append(ItineraryItemResponse(
                    id=f"road-tl-{d_num}-{s_idx+2}", itinerary_id=f"day-{d_num}", place_id=None,
                    title=st.name, category=st.category,
                    start_time=start_h, end_time=end_h, duration_mins=st.time_needed_mins,
                    estimated_cost=st.approx_cost, travel_time_from_prev_mins=45, distance_from_prev_km=st.distance_off_route_km,
                    notes=st.why_stop, reason_for_recommendation=f"{st.type} stop along route (+{st.distance_off_route_km} km detour).",
                    map_lat=st.lat, map_lng=st.lng,
                    status="upcoming", is_locked=False
                ))

            # Arrival at day's destination
            arr_time_h = f"{min(21, 8 + int(time_leg)):02d}:30"
            timeline.append(ItineraryItemResponse(
                id=f"road-tl-{d_num}-arr", itinerary_id=f"day-{d_num}", place_id=None,
                title=f"Arrive in {dest_leg} & Check-in", category="Stay",
                start_time=arr_time_h, end_time=f"{int(arr_time_h[:2])+1:02d}:30", duration_mins=60,
                estimated_cost=0.0, travel_time_from_prev_mins=60, distance_from_prev_km=dist_leg,
                notes=f"Check into overnight stay in {dest_leg}. Evening walk & hot dinner.",
                reason_for_recommendation="End of driving day before sunset.",
                status="upcoming", is_locked=True
            ))

            # Curated overnight stay option
            stay_options = [
                HotelResponse(
                    id=f"stay-{d_num}-1", destination_id="highway",
                    name=f"Heritage Highway Retreat ({dest_leg})", address=f"Main Highway Junction, {dest_leg}",
                    latitude=d_lat, longitude=d_lng, price_per_night=2800.0,
                    hotel_style="Comfort Highway Stay", amenities="Parking,24h Check-in,Hot Water,Restaurant",
                    check_in_time="12:00 PM", check_out_time="11:00 AM",
                    badge="Best Highway Access", trust_source="VANVAS_CURATED", is_live=False, price_verified=True
                ),
                HotelResponse(
                    id=f"stay-{d_num}-2", destination_id="highway",
                    name=f"Boutique City Inn ({dest_leg})", address=f"Old City Center, {dest_leg}",
                    latitude=d_lat, longitude=d_lng, price_per_night=3500.0,
                    hotel_style="Boutique Heritage", amenities="WiFi,Breakfast Included,Safe Parking",
                    check_in_time="01:00 PM", check_out_time="11:00 AM",
                    badge="City Center Pick", trust_source="VANVAS_CURATED", is_live=False, price_verified=True
                )
            ]

            # Curated food options
            food_options = [
                {"name": f"Highway Dhaba ({orig_leg} Exit)", "type": "Dhaba", "price": "₹150 - ₹250", "timing": "06:00 - 23:00", "specialty": "Hot Tandoori Parathas & Masala Chai"},
                {"name": f"Midway Garden Restaurant", "type": "Casual Dining", "price": "₹350 - ₹500", "timing": "11:00 - 22:30", "specialty": "Dal Makhani & Thali Lunch"},
                {"name": f"Evening Dhaba & Tea Point ({dest_leg})", "type": "Local Food", "price": "₹200 - ₹350", "timing": "18:00 - 00:00", "specialty": "Biryani & Fresh Tawa Roti"}
            ]

            days.append(RoadTripDay(
                day_number=d_num,
                title=f"{orig_leg} → {dest_leg}",
                theme=theme_leg,
                origin=orig_leg,
                destination=dest_leg,
                driving_distance_km=dist_leg,
                driving_time_hours=time_leg,
                timeline=timeline,
                stops=leg_stops,
                food_options=food_options,
                stay_options=stay_options,
                fuel_estimated_inr=round((dist_leg / 15.0) * 95.5, 0)
            ))

        return days, all_stops
