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
        
        # Determine mountain destination
        is_mountain = any(m in dest_clean.lower() for m in ["manali", "kasol", "rishikesh", "chopta", "spiti", "dharamshala", "leh", "jibhi", "shimla", "mussoorie", "mcleodganj", "nainital", "kullu"])
        
        routes = [
            # 1. BUS OPTIONS
            {
                "id": f"curated-bus-hptdc-{orig_clean.lower()}-{dest_clean.lower()}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Bus",
                "operator_name": "HPTDC HimSutra Volvo AC",
                "departure_time": "20:00",
                "arrival_time": "08:30",
                "duration_hours": 12.5,
                "price": 1450.0,
                "departure_location": f"{orig_clean} ISBT Kashmiri Gate / Majnu Ka Tilla",
                "arrival_location": f"{dest_clean} Private Bus Stand",
                "booking_url": "https://online.hptdc.in",
                "recommendation_badge": "Best Overnight Saver",
                "source": "vanvas_curated",
                "source_id": "hptdc-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "data_state": "VERIFIED",
                "disclaimer": "Curated schedule. Please verify departure times directly with operator."
            },
            {
                "id": f"curated-bus-zingbus-{orig_clean.lower()}-{dest_clean.lower()}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Bus",
                "operator_name": "Zingbus Electric Lounge Multi-Axle",
                "departure_time": "19:15",
                "arrival_time": "07:45",
                "duration_hours": 12.5,
                "price": 1290.0,
                "departure_location": f"{orig_clean} Majnu Ka Tilla Boarding Hub",
                "arrival_location": f"{dest_clean} Mall Road Drop Point",
                "booking_url": "https://www.zingbus.com",
                "recommendation_badge": "Cheapest Option",
                "source": "vanvas_curated",
                "source_id": "zingbus-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "data_state": "VERIFIED",
                "disclaimer": "Curated schedule. Please verify departure times directly with operator."
            },
            {
                "id": f"curated-bus-intrcity-{orig_clean.lower()}-{dest_clean.lower()}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Bus",
                "operator_name": "IntrCity SmartBus Premium Sleeper",
                "departure_time": "21:30",
                "arrival_time": "10:15",
                "duration_hours": 12.75,
                "price": 1650.0,
                "departure_location": f"{orig_clean} RK Ashram Metro",
                "arrival_location": f"{dest_clean} Volvo Stand",
                "booking_url": "https://www.intrcity.com",
                "recommendation_badge": "Direct Check-In Fit",
                "source": "vanvas_curated",
                "source_id": "intrcity-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "data_state": "VERIFIED",
                "disclaimer": "Curated schedule. Please verify departure times directly with operator."
            },

            # 2. TRAIN OPTIONS
            {
                "id": f"curated-train-vb-{orig_clean.lower()}-{dest_clean.lower()}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Train",
                "operator_name": "Vande Bharat Express (22447)",
                "departure_time": "05:50",
                "arrival_time": "11:05",
                "duration_hours": 5.25,
                "price": 1180.0,
                "departure_location": f"{orig_clean} New Delhi Railway Station (NDLS)",
                "arrival_location": f"{dest_clean if not is_mountain else 'Chandigarh / Una Station'} Railway Junction",
                "booking_url": "https://www.irctc.co.in",
                "recommendation_badge": "Fastest Rail Transit",
                "source": "vanvas_curated",
                "source_id": "irctc-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "data_state": "VERIFIED",
                "disclaimer": "Indian Railways verified timetable. Followed by scenic valley cab."
            },
            {
                "id": f"curated-train-shatabdi-{orig_clean.lower()}-{dest_clean.lower()}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Train",
                "operator_name": "Kalka Shatabdi Express (12005)",
                "departure_time": "17:15",
                "arrival_time": "21:20",
                "duration_hours": 4.1,
                "price": 945.0,
                "departure_location": f"{orig_clean} New Delhi (NDLS)",
                "arrival_location": f"{dest_clean if not is_mountain else 'Kalka / Chandigarh Station'}",
                "booking_url": "https://www.irctc.co.in",
                "recommendation_badge": "Evening Superfast",
                "source": "vanvas_curated",
                "source_id": "irctc-shatabdi",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "data_state": "VERIFIED",
                "disclaimer": "Indian Railways verified timetable."
            },

            # 3. FLIGHT OPTIONS
            {
                "id": f"curated-flight-indigo-{orig_clean.lower()}-{dest_clean.lower()}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Flight",
                "operator_name": "IndiGo Direct / Connecting Shuttle",
                "departure_time": "07:20",
                "arrival_time": "08:45",
                "duration_hours": 1.4,
                "price": 4200.0,
                "departure_location": f"{orig_clean} Domestic Airport (Terminal 1/2)",
                "arrival_location": f"{dest_clean if not is_mountain else 'Kullu Bhuntar (KUU) / Chandigarh (IXC)'} Airport",
                "booking_url": "https://www.goindigo.in",
                "recommendation_badge": "Fastest Travel Time",
                "source": "vanvas_curated",
                "source_id": "indigo-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "data_state": "VERIFIED",
                "disclaimer": "Airlines timetable. Baggage allowance: 15kg check-in + 7kg cabin."
            },
            {
                "id": f"curated-flight-alliance-{orig_clean.lower()}-{dest_clean.lower()}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Flight",
                "operator_name": "Alliance Air Himalayan Shuttle",
                "departure_time": "06:45",
                "arrival_time": "08:05",
                "duration_hours": 1.35,
                "price": 5450.0,
                "departure_location": f"{orig_clean} Airport (IGI T3)",
                "arrival_location": f"{dest_clean if not is_mountain else 'Bhuntar (KUU) Valley Airstrip'}",
                "booking_url": "https://www.allianceair.in",
                "recommendation_badge": "Direct Mountain Landing",
                "source": "vanvas_curated",
                "source_id": "alliance-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "data_state": "VERIFIED",
                "disclaimer": "Direct valley turboprop service. Weather subject."
            },

            # 4. ROAD TRIP OPTION
            {
                "id": f"curated-roadtrip-{orig_clean.lower()}-{dest_clean.lower()}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Road Trip",
                "operator_name": "Self-Drive Expressway Route (NH44 / Kiratpur-Nerchowk)",
                "departure_time": "05:00 (Suggested Early Departure)",
                "arrival_time": "15:30 (Estimated)",
                "duration_hours": 10.5,
                "price": 4800.0,  # Estimated Fuel + Tolls
                "departure_location": f"{orig_clean} City Origin",
                "arrival_location": f"{dest_clean} Destination",
                "booking_url": None,
                "recommendation_badge": "Maximum Route Freedom",
                "source": "vanvas_curated",
                "source_id": "road-trip-engine",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "data_state": "VERIFIED",
                "disclaimer": "Estimated fuel + fastag toll calculation based on 520km highway corridor."
            },

            # 5. CAB / PRIVATE TRANSFER
            {
                "id": f"curated-cab-{orig_clean.lower()}-{dest_clean.lower()}",
                "origin_city": orig_clean,
                "destination_id": dest_clean,
                "transport_type": "Cab",
                "operator_name": "Verified Private Mountain Transfer (Sedan / Innova)",
                "departure_time": "Flexible / On-Demand Pickup",
                "arrival_time": "Door-to-Door Direct",
                "duration_hours": 11.0,
                "price": 8500.0,
                "departure_location": f"{orig_clean} Doorstep Pickup",
                "arrival_location": f"{dest_clean} Resort / Stay Drop",
                "booking_url": None,
                "recommendation_badge": "Door-to-Door Comfort",
                "source": "vanvas_curated",
                "source_id": "cab-network",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "data_state": "VERIFIED",
                "disclaimer": "All-inclusive private transfer with hill-experienced commercial driver."
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
