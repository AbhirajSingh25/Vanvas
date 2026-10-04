import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from app.providers.base import (
    PlacesProvider, WeatherProvider, TransportProvider,
    HotelsProvider, RentalsProvider, RoutingProvider
)

class DemoPlacesProvider(PlacesProvider):
    async def search_places(self, query: str, destination_name: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        return await self.get_nearby_places(32.2396, 77.1887, category=category)

    async def get_nearby_places(self, lat: float, lng: float, radius_km: float = 5.0, category: Optional[str] = None) -> List[Dict[str, Any]]:
        # Authentic curated fallback places with strict geographic radius filtering
        seed_places = [
            {
                "id": "curated-hidimba",
                "name": "Hidimba Devi Ancient Temple",
                "category": "Culture & Heritage",
                "description": "Historic 16th-century wooden pagoda temple surrounded by cedar forest.",
                "address": "Dhungri Forest, Old Manali",
                "latitude": 32.2483,
                "longitude": 77.1804,
                "price_level": "Free",
                "approx_cost": 0.0,
                "rating": 4.8,
                "review_count": 340,
                "opening_time": "08:00",
                "closing_time": "18:00",
                "recommended_duration_mins": 60,
                "tags": "Heritage,Cedar Forest,Pagoda",
                "image_url": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800",
                "why_vanvas_recommends": "Ancient architectural masterpiece set in peaceful deodar forest.",
                "is_must_visit": True,
                "is_hidden_gem": False,
                "is_indoor": False,
                "source": "vanvas_curated",
                "source_id": "curated-hidimba",
                "is_live": False,
            },
            {
                "id": "curated-drifters",
                "name": "Drifters' Mountain Café & Lounge",
                "category": "Cafés & Bakery",
                "description": "Cozy pine-wood cafe with artisanal espresso, trout, and valley views.",
                "address": "Manu Temple Road, Old Manali",
                "latitude": 32.2530,
                "longitude": 77.1750,
                "price_level": "₹₹",
                "approx_cost": 350.0,
                "rating": 4.7,
                "review_count": 210,
                "opening_time": "09:00",
                "closing_time": "22:00",
                "recommended_duration_mins": 90,
                "tags": "Café,Espresso,Mountain View",
                "image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
                "why_vanvas_recommends": "Quintessential mountain cafe vibe with great coffee and acoustic evenings.",
                "is_must_visit": False,
                "is_hidden_gem": True,
                "is_indoor": True,
                "source": "vanvas_curated",
                "source_id": "curated-drifters",
                "is_live": False,
            },
            {
                "id": "curated-jogini",
                "name": "Jogini Waterfalls Trail",
                "category": "Nature & Trails",
                "description": "Scenic hiking trail past apple orchards leading to cascading mountain falls.",
                "address": "Vashisht Village, Manali",
                "latitude": 32.2670,
                "longitude": 77.1970,
                "price_level": "Free",
                "approx_cost": 0.0,
                "rating": 4.9,
                "review_count": 480,
                "opening_time": "06:00",
                "closing_time": "17:00",
                "recommended_duration_mins": 120,
                "tags": "Waterfall,Trek,Nature",
                "image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
                "why_vanvas_recommends": "Invigorating walk with rewarding cliffside waterfall views.",
                "is_must_visit": True,
                "is_hidden_gem": False,
                "is_indoor": False,
                "source": "vanvas_curated",
                "source_id": "curated-jogini",
                "is_live": False,
            }
        ]

        nearby = []
        for p in seed_places:
            p_lat = p["latitude"]
            p_lng = p["longitude"]
            dlat = math.radians(p_lat - lat)
            dlng = math.radians(p_lng - lng)
            a = math.sin(dlat/2.0)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(p_lat)) * math.sin(dlng/2.0)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist = 6371.0 * c
            if dist <= radius_km:
                if not category or category.lower() == "all" or category.lower() in p["category"].lower():
                    p_copy = dict(p)
                    p_copy["distance_km"] = round(dist, 1)
                    nearby.append(p_copy)
        return nearby

class DemoWeatherProvider(WeatherProvider):
    async def get_forecast(self, lat: float, lng: float, days: int = 5) -> List[Dict[str, Any]]:
        # Simulate realistic mountain weather pattern
        forecasts = []
        today = datetime.now(timezone.utc).date()
        
        weather_states = [
            {"temp": 19.5, "condition": "Misty & Crisp", "is_rain": False, "advisory": "Crisp morning breeze. Ideal for trails and river walks."},
            {"temp": 17.0, "condition": "Mountain Rain & Fog", "is_rain": True, "advisory": "Afternoon mountain shower expected. Great for cosy riverside cafés and hot siddu."},
            {"temp": 21.0, "condition": "Sunny with High Clouds", "is_rain": False, "advisory": "Clear alpine views. Excellent time for viewpoints and local village walks."},
            {"temp": 18.5, "condition": "Mild Overcast", "is_rain": False, "advisory": "Comfortable weather for scooter rides across the valley."},
            {"temp": 16.0, "condition": "Evening Drizzle", "is_rain": True, "advisory": "Brisk winds in the evening. Keep a woollen layer handy."}
        ]

        for i in range(days):
            day_date = today + timedelta(days=i)
            state = weather_states[i % len(weather_states)]
            forecasts.append({
                "date": str(day_date),
                "temp_c": state["temp"],
                "condition": state["condition"],
                "is_rain": state["is_rain"],
                "humidity": 68 if not state["is_rain"] else 88,
                "wind_kph": 9.5,
                "advisory": state["advisory"],
                "icon": "cloud-rain" if state["is_rain"] else "cloud-sun"
            })
        return forecasts

class DemoTransportProvider(TransportProvider):
    async def search_routes(
        self,
        origin: str,
        destination: str,
        travel_date: Optional[str] = None,
        transport_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        orig_clean = origin.strip().title() if origin else "Delhi"
        dest_clean = destination.strip().title() if destination else "Manali"
        
        orig_lower = orig_clean.lower()
        dest_lower = dest_clean.lower()

        # Origin terminal mapping
        if "delhi" in orig_lower:
            bus_orig = "Delhi (ISBT Kashmiri Gate / Majnu Ka Tilla)"
            train_orig = "New Delhi Railway Station (NDLS)"
            flight_orig = "Delhi IGI Airport (DEL T1/T3)"
        elif "chandigarh" in orig_lower:
            bus_orig = "Chandigarh (ISBT Sector 43)"
            train_orig = "Chandigarh Junction (CDG)"
            flight_orig = "Chandigarh International Airport (IXC)"
        elif "dehradun" in orig_lower:
            bus_orig = "Dehradun ISBT"
            train_orig = "Dehradun Railway Station (DDN)"
            flight_orig = "Dehradun Jolly Grant Airport (DED)"
        elif "mumbai" in orig_lower:
            bus_orig = "Mumbai (Borivali / Dadar)"
            train_orig = "Mumbai CSMT / Bandra Terminus (BDTS)"
            flight_orig = "Chhatrapati Shivaji Maharaj Airport (BOM)"
        elif "ahmedabad" in orig_lower:
            bus_orig = "Ahmedabad (Paldi / Geeta Mandir)"
            train_orig = "Ahmedabad Kalupur Junction (ADI)"
            flight_orig = "Sardar Vallabhbhai Patel Airport (AMD)"
        elif "bengaluru" in orig_lower or "bangalore" in orig_lower:
            bus_orig = "Bangalore (Majestic / Shantinagar)"
            train_orig = "KSR Bengaluru City Junction (SBC)"
            flight_orig = "Kempegowda International Airport (BLR)"
        elif "jaipur" in orig_lower:
            bus_orig = "Jaipur (Sindhi Camp)"
            train_orig = "Jaipur Junction (JP)"
            flight_orig = "Jaipur International Airport (JAI)"
        else:
            bus_orig = f"{orig_clean} Central Bus Terminal"
            train_orig = f"{orig_clean} Railway Junction"
            flight_orig = f"{orig_clean} Regional Airport"

        # Determine mountain destination
        is_mountain = any(m in dest_lower for m in [
            "manali", "kasol", "rishikesh", "chopta", "spiti", "dharamshala",
            "leh", "jibhi", "shimla", "mussoorie", "mcleodganj", "nainital", "kullu", "almora", "lansdowne"
        ])

        # Configure Destination specific endpoints
        if "manali" in dest_lower or "kasol" in dest_lower or "jibhi" in dest_lower:
            bus_dest = f"{dest_clean} Private Volvo Stand"
            train_dest = f"Chandigarh Junction (CDG) / Una Station → Onward 8h Scenic Road Transit to {dest_clean}"
            train_op = "Vande Bharat Express (to Railhead Hub + Connecting Transit)"
            train_dur = 5.25 + 7.5
            train_price = 1180.0 + 850.0
            flight_dest = f"Bhuntar (KUU) Valley Airstrip (50km from {dest_clean}) or Chandigarh (IXC)"
            flight_op = "Alliance Air / IndiGo (to Valley Hub Airport)"
            flight_dur = 1.35
            flight_price = 5200.0
            road_time = 10.5 if "delhi" in orig_lower else 6.5 if "chandigarh" in orig_lower else 14.0
            road_dist = 520 if "delhi" in orig_lower else 280 if "chandigarh" in orig_lower else 800
            cab_fare = 8500.0 if "delhi" in orig_lower else 4800.0 if "chandigarh" in orig_lower else 14000.0
        elif "rishikesh" in dest_lower:
            bus_dest = "Rishikesh Bus Stand / Tapovan Drop"
            train_dest = "Yog Nagari Rishikesh (YNRK) / Haridwar (HW)"
            train_op = "Vande Bharat Express (22457 to Anand Vihar - Dehradun)"
            train_dur = 4.2
            train_price = 1060.0
            flight_dest = "Dehradun Jolly Grant Airport (DED) (22km to Rishikesh)"
            flight_op = "IndiGo Direct Shuttle"
            flight_dur = 0.95
            flight_price = 3400.0
            road_time = 5.0 if "delhi" in orig_lower else 7.0
            road_dist = 245 if "delhi" in orig_lower else 350
            cab_fare = 4200.0 if "delhi" in orig_lower else 6500.0
        elif "mussoorie" in dest_lower:
            bus_dest = "Mussoorie Library Bus Stand"
            train_dest = "Dehradun Railway Station (DDN) → 35km Hill Taxi to Mussoorie"
            train_op = "Dehradun Shatabdi Express (12017) + Hill Transfer"
            train_dur = 5.8
            train_price = 980.0 + 400.0
            flight_dest = "Dehradun Jolly Grant Airport (DED) (58km to Mussoorie)"
            flight_op = "IndiGo Shuttle to DED"
            flight_dur = 1.0
            flight_price = 3600.0
            road_time = 6.0 if "delhi" in orig_lower else 8.0
            road_dist = 280 if "delhi" in orig_lower else 400
            cab_fare = 4800.0 if "delhi" in orig_lower else 7000.0
        elif "dharamshala" in dest_lower or "mcleodganj" in dest_lower:
            bus_dest = f"{dest_clean} ISBT / Main Square"
            train_dest = f"Pathankot Junction (PTK) / Una Station → 3h Connecting Transit to {dest_clean}"
            train_op = "Dhauladhar Express / Vande Bharat (to Railhead)"
            train_dur = 8.5
            train_price = 1100.0 + 500.0
            flight_dest = f"Kangra Gaggal Airport (DHM) (14km to {dest_clean})"
            flight_op = "SpiceJet / Alliance Air Direct to Kangra"
            flight_dur = 1.2
            flight_price = 4800.0
            road_time = 9.5 if "delhi" in orig_lower else 5.5 if "chandigarh" in orig_lower else 15.0
            road_dist = 480 if "delhi" in orig_lower else 245 if "chandigarh" in orig_lower else 850
            cab_fare = 7800.0 if "delhi" in orig_lower else 4500.0 if "chandigarh" in orig_lower else 13500.0
        elif "goa" in dest_lower:
            bus_dest = "Panaji Kadamba Bus Stand / Mapusa"
            train_dest = "Madgaon Junction (MAO) / Thivim (THVM)"
            train_op = "Vande Bharat / Tejas Superfast Express"
            train_dur = 8.0 if "mumbai" in orig_lower else 14.0
            train_price = 1850.0
            flight_dest = "Goa Dabolim (GOI) / Manohar International MOPA (GOX)"
            flight_op = "IndiGo / Akasa Air Direct Flight"
            flight_dur = 1.25 if "mumbai" in orig_lower or "bengaluru" in orig_lower else 2.5
            flight_price = 3800.0
            road_time = 11.0 if "mumbai" in orig_lower else 10.0 if "bengaluru" in orig_lower else 24.0
            road_dist = 580 if "mumbai" in orig_lower else 560 if "bengaluru" in orig_lower else 1800
            cab_fare = 12000.0 if "mumbai" in orig_lower else 11000.0 if "bengaluru" in orig_lower else 28000.0
        else:
            bus_dest = f"{dest_clean} Main Bus Stand"
            train_dest = f"{dest_clean} Railway Station"
            train_op = "Intercity Superfast Express"
            train_dur = 6.0
            train_price = 750.0
            flight_dest = f"{dest_clean} Airport"
            flight_op = "Domestic Airline Shuttle"
            flight_dur = 1.5
            flight_price = 4200.0
            road_time = 7.0
            road_dist = 360
            cab_fare = 5500.0

        routes = [
            # 1. BUS OPTION 1: State / Flagship RTC
            {
                "id": f"curated-bus-rtc-{orig_clean.lower()[:4]}-{dest_clean.lower()[:4]}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Bus",
                "operator_name": "State RTC HimSutra Volvo AC Sleeper",
                "departure_time": "20:00",
                "arrival_time": "08:30",
                "duration_hours": 12.5 if is_mountain and "delhi" in orig_lower else 7.5,
                "price": 1450.0 if is_mountain else 850.0,
                "departure_location": bus_orig,
                "arrival_location": bus_dest,
                "booking_url": "https://online.hptdc.in",
                "booking_label": "Book with operator",
                "recommendation_badge": "Overnight Transit (Saves 1 Night Stay)",
                "source": "vanvas_curated",
                "source_id": "rtc-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "availability_state": "INDICATIVE",
                "data_state": "CURATED",
                "trust_source": "VANVAS_CURATED",
                "disclaimer": "Indicative curated schedule. Verify exact departures and seat availability on operator website."
            },
            # 2. BUS OPTION 2: Private Electric / Multi-Axle Lounge
            {
                "id": f"curated-bus-zingbus-{orig_clean.lower()[:4]}-{dest_clean.lower()[:4]}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Bus",
                "operator_name": "Zingbus Electric Lounge Multi-Axle",
                "departure_time": "19:15",
                "arrival_time": "07:45",
                "duration_hours": 12.5 if is_mountain and "delhi" in orig_lower else 7.0,
                "price": 1290.0 if is_mountain else 780.0,
                "departure_location": bus_orig,
                "arrival_location": bus_dest,
                "booking_url": "https://www.zingbus.com",
                "booking_label": "Book with operator",
                "recommendation_badge": "Best for Budget",
                "source": "vanvas_curated",
                "source_id": "zingbus-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "availability_state": "INDICATIVE",
                "data_state": "CURATED",
                "trust_source": "VANVAS_CURATED",
                "disclaimer": "Indicative curated schedule. Check live boarding points on operator website."
            },
            # 3. TRAIN OPTION
            {
                "id": f"curated-train-{orig_clean.lower()[:4]}-{dest_clean.lower()[:4]}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Train",
                "operator_name": train_op,
                "departure_time": "05:50",
                "arrival_time": "11:05 (Railhead)",
                "duration_hours": round(train_dur, 2),
                "price": train_price,
                "departure_location": train_orig,
                "arrival_location": train_dest,
                "booking_url": "https://www.irctc.co.in",
                "booking_label": "Book rail with IRCTC",
                "recommendation_badge": "Fastest Rail Transit",
                "source": "vanvas_curated",
                "source_id": "irctc-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "availability_state": "INDICATIVE",
                "data_state": "CURATED",
                "trust_source": "VANVAS_CURATED",
                "disclaimer": "Indicative Indian Railways timetable. Verify seat availability and book on IRCTC."
            },
            # 4. FLIGHT OPTION
            {
                "id": f"curated-flight-{orig_clean.lower()[:4]}-{dest_clean.lower()[:4]}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Flight",
                "operator_name": flight_op,
                "departure_time": "07:20",
                "arrival_time": "08:45",
                "duration_hours": flight_dur,
                "price": flight_price,
                "departure_location": flight_orig,
                "arrival_location": flight_dest,
                "booking_url": "https://www.goindigo.in",
                "booking_label": "Check airline site",
                "recommendation_badge": "Fastest Travel Time",
                "source": "vanvas_curated",
                "source_id": "airline-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "availability_state": "INDICATIVE",
                "data_state": "CURATED",
                "trust_source": "VANVAS_CURATED",
                "disclaimer": "Indicative airline schedule. Mountain airstrip flights are subject to visual flight weather conditions."
            },
            # 5. ROAD TRIP OPTION
            {
                "id": f"curated-roadtrip-{orig_clean.lower()[:4]}-{dest_clean.lower()[:4]}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Road Trip",
                "operator_name": f"Self-Drive Highway & Mountain Corridor ({road_dist} km)",
                "departure_time": "05:00 (Suggested Early Departure)",
                "arrival_time": "15:30 (Estimated)",
                "duration_hours": round(road_time, 1),
                "price": round(road_dist * 7.5 + 450.0, 0),  # Fuel + Fastag Toll Estimate
                "departure_location": f"{orig_clean} Origin Point",
                "arrival_location": f"{dest_clean} Destination Stay",
                "booking_url": None,
                "booking_label": "View Route Guidance",
                "recommendation_badge": "Best for Flexibility",
                "source": "vanvas_curated",
                "source_id": "road-trip-engine",
                "is_live": False,
                "schedule_type": "calculated_route",
                "availability_state": "ESTIMATED",
                "data_state": "ESTIMATED",
                "trust_source": "VANVAS_CURATED",
                "disclaimer": f"Estimated fuel and toll calculation based on {road_dist}km road corridor. Route navigation powered by Vanvas engine."
            },
            # 6. CAB / PRIVATE TRANSFER
            {
                "id": f"curated-cab-{orig_clean.lower()[:4]}-{dest_clean.lower()[:4]}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Cab",
                "operator_name": f"Private Outstation Taxi ({orig_clean} → {dest_clean})",
                "departure_time": "Flexible / On-Demand Pickup",
                "arrival_time": "Door-to-Door Direct",
                "duration_hours": round(road_time + 0.5, 1),
                "price": cab_fare,
                "departure_location": f"{orig_clean} Doorstep Pickup",
                "arrival_location": f"{dest_clean} Stay Direct",
                "booking_url": None,
                "booking_label": "Estimated Route Guidance",
                "recommendation_badge": "Door-to-Door Comfort",
                "source": "vanvas_curated",
                "source_id": "cab-network",
                "is_live": False,
                "schedule_type": "estimated_transfer",
                "availability_state": "ESTIMATED",
                "data_state": "ESTIMATED",
                "trust_source": "VANVAS_CURATED",
                "disclaimer": "Indicative outstation cab fare estimate. Booking is arranged directly with local taxi unions or outstation operators."
            }
        ]
        
        if transport_type and transport_type.lower() != "all":
            tt_clean = transport_type.lower().replace(" ", "").replace("_", "")
            filtered = [
                r for r in routes 
                if tt_clean in r["transport_type"].lower().replace(" ", "").replace("_", "") or 
                   tt_clean in r["operator_name"].lower()
            ]
            if filtered:
                return filtered
        return routes

class DemoHotelsProvider(HotelsProvider):
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
        return []

class DemoRentalsProvider(RentalsProvider):
    async def search_rentals(
        self,
        destination: str,
        vehicle_type: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: float = 15.0
    ) -> List[Dict[str, Any]]:
        return []

class DemoRoutingProvider(RoutingProvider):
    def calculate_distance_matrix(self, points: List[Dict[str, float]]) -> List[List[Dict[str, Any]]]:
        # Realistic Haversine distance with mountain road tortuosity factor (1.45x)
        matrix = []
        for p1 in points:
            row = []
            for p2 in points:
                lat1, lon1 = p1.get("lat", 0.0), p1.get("lng", 0.0)
                lat2, lon2 = p2.get("lat", 0.0), p2.get("lng", 0.0)
                
                # Haversine
                r = 6371.0 # km
                phi1, phi2 = math.radians(lat1), math.radians(lat2)
                dphi = math.radians(lat2 - lat1)
                dlambda = math.radians(lon2 - lon1)
                
                a = math.sin(dphi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2.0)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                straight_km = r * c
                
                # Mountain road adjustment
                road_km = round(straight_km * 1.45, 1)
                # Average mountain speed ~25-35 km/h + 5 mins traffic/parking
                duration_mins = int((road_km / 28.0) * 60) + (5 if road_km > 0.5 else 0)
                
                row.append({
                    "distance_km": road_km,
                    "duration_mins": max(duration_mins, 5 if road_km > 0.1 else 0)
                })
            matrix.append(row)
        return matrix
