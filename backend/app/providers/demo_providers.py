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
        # Seeded authentic transport routes with explicit curated schedule provenance
        routes = [
            {
                "id": f"curated-transit-hptdc-{origin.lower()}-{destination.lower()}",
                "origin_city": origin,
                "destination_id": destination,
                "transport_type": "Volvo AC Sleeper Bus",
                "operator_name": "HPTDC HimSutra Volvo",
                "departure_time": "20:00",
                "arrival_time": "08:30",
                "duration_hours": 12.5,
                "price": 1450.0,
                "departure_location": f"{origin} ISBT Kashmiri Gate",
                "arrival_location": f"{destination} Private Bus Stand",
                "booking_url": "https://online.hptdc.in",
                "recommendation_badge": "Best Arrival Time",
                "source": "vanvas_curated",
                "source_id": "hptdc-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule"
            },
            {
                "id": f"curated-transit-zingbus-{origin.lower()}-{destination.lower()}",
                "origin_city": origin,
                "destination_id": destination,
                "transport_type": "Luxury Multi-Axle Bus",
                "operator_name": "Zingbus Electric Lounge",
                "departure_time": "19:15",
                "arrival_time": "07:45",
                "duration_hours": 12.5,
                "price": 1290.0,
                "departure_location": f"{origin} Majnu Ka Tilla",
                "arrival_location": f"{destination} Mall Road Drop Point",
                "booking_url": "https://www.zingbus.com",
                "recommendation_badge": "Cheapest Option",
                "source": "vanvas_curated",
                "source_id": "zingbus-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule"
            },
            {
                "id": f"curated-transit-intrcity-{origin.lower()}-{destination.lower()}",
                "origin_city": origin,
                "destination_id": destination,
                "transport_type": "Overnight Sleeper",
                "operator_name": "IntrCity SmartBus",
                "departure_time": "21:30",
                "arrival_time": "10:15",
                "duration_hours": 12.75,
                "price": 1650.0,
                "departure_location": f"{origin} RK Ashram Metro",
                "arrival_location": f"{destination} Volvo Stand",
                "booking_url": "https://www.intrcity.com",
                "recommendation_badge": "Direct Check-In Fit",
                "source": "vanvas_curated",
                "source_id": "intrcity-schedule",
                "is_live": False,
                "schedule_type": "curated_schedule"
            }
        ]
        if transport_type and transport_type.lower() != "all":
            return [r for r in routes if transport_type.lower() in r["transport_type"].lower()]
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
