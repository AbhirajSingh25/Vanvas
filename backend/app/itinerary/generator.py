import math
from datetime import date, timedelta, datetime
from typing import List, Dict, Any, Optional
from app.models.models import Destination, Place, Hotel, RentalOption, Itinerary, ItineraryItem
from app.recommendation.scorer import RecommendationScorer
from app.itinerary.clustering import cluster_places_by_day, order_route_nearest_neighbor, haversine_distance_km

class ItineraryEngine:
    def __init__(self):
        self.scorer = RecommendationScorer()

    def generate_trip_itinerary(
        self,
        destination: Destination,
        all_places: List[Place],
        start_date: date,
        end_date: date,
        budget: float,
        companion_type: str, # Solo, Couple, Friends, Family
        travel_style: str, # Budget, Balanced, Comfort, Premium
        wake_up_preference: str, # Early, Normal, Late
        activity_intensity: str, # Relaxed, Balanced, Packed
        interests: List[str],
        hotel: Optional[Hotel] = None,
        rental: Optional[RentalOption] = None,
    ) -> List[Dict[str, Any]]:
        num_days = max(1, (end_date - start_date).days + 1)
        
        # Determine items per day based on intensity
        items_per_day = 4
        if activity_intensity == "Relaxed":
            items_per_day = 3
        elif activity_intensity == "Packed":
            items_per_day = 5

        # Determine wake-up and start times
        base_start_hour = 8
        base_start_min = 30
        if wake_up_preference == "Early":
            base_start_hour = 7
            base_start_min = 30
        elif wake_up_preference == "Late":
            base_start_hour = 10
            base_start_min = 0

        # Score all places
        scored_places = []
        for p in all_places:
            score = self.scorer.score_place(
                place=p,
                user_interests=interests,
                user_budget_tier=travel_style,
                current_lat=destination.latitude,
                current_lng=destination.longitude
            )
            scored_places.append((score, p))
        
        # Sort by score descending
        scored_places.sort(key=lambda x: x[0], reverse=True)
        top_places = [p for _, p in scored_places]

        # Separate into categories
        food_places = [p for p in top_places if p.category.lower() in ["café", "restaurant", "food"]]
        activity_places = [p for p in top_places if p.category.lower() not in ["café", "restaurant", "food", "hotel"]]

        if not activity_places:
            activity_places = top_places[:15]
        if not food_places:
            food_places = top_places[:10]

        # Cluster activity places across the trip days
        clusters = cluster_places_by_day(activity_places[:num_days * items_per_day], num_days)

        start_lat = hotel.latitude if hotel else destination.latitude
        start_lng = hotel.longitude if hotel else destination.longitude

        generated_days = []

        for day_idx in range(num_days):
            current_day_date = start_date + timedelta(days=day_idx)
            day_num = day_idx + 1
            day_places = clusters[day_idx] if day_idx < len(clusters) else []
            
            # Sequence places using nearest neighbor to avoid zigzagging
            ordered_day_places = order_route_nearest_neighbor(start_lat, start_lng, day_places)

            # Titles and Themes
            themes = [
                ("Arrival, Riverside Stroll & Sunset Café", "Scenic & Settling In"),
                ("High Trails, Pine Forests & Alpine Views", "Adventure & Nature"),
                ("Old Village Culture, Hidden Cafés & Art", "Culture & Discovery"),
                ("Waterfalls, Local Markets & Artisan Craft", "Exploration & Shopping"),
                ("Pristine Valleys & Farewell Twilight", "Leisure & Memories")
            ]
            day_theme = themes[day_idx % len(themes)]

            day_items = []
            current_time_minutes = base_start_hour * 60 + base_start_min
            prev_lat, prev_lng = start_lat, start_lng

            # Day 1 Arrival & Luggage check-in handling
            if day_idx == 0:
                # 08:30 Arrival / Breakfast
                bf_place = food_places[0] if food_places else None
                bf_title = f"Arrival Breakfast at {bf_place.name}" if bf_place else "Morning Breakfast & Fresh Himalayan Chai"
                bf_cost = bf_place.approx_cost if bf_place else 180.0
                
                day_items.append({
                    "place_id": bf_place.id if bf_place else None,
                    "title": bf_title,
                    "category": "Food",
                    "start_time": f"{current_time_minutes // 60:02d}:{current_time_minutes % 60:02d}",
                    "end_time": f"{(current_time_minutes + 60) // 60:02d}:{(current_time_minutes + 60) % 60:02d}",
                    "duration_mins": 60,
                    "estimated_cost": bf_cost,
                    "travel_time_from_prev_mins": 10,
                    "distance_from_prev_km": 1.5,
                    "notes": "Arrive in the valley, stretch your legs, and grab a hot breakfast with fresh mountain air.",
                    "reason_for_recommendation": "Perfect stop immediately after your journey before hotel check-in opens.",
                    "map_lat": bf_place.latitude if bf_place else start_lat,
                    "map_lng": bf_place.longitude if bf_place else start_lng,
                    "booking_url": None,
                    "opening_hours": "07:30 - 22:00",
                    "status": "upcoming",
                    "is_locked": False
                })
                current_time_minutes += 75 # 60 min + 15 transit

                # 10:00 Luggage Drop / Hotel check-in preparation
                hotel_name = hotel.name if hotel else "Hotel / Mountain Stay"
                day_items.append({
                    "place_id": None,
                    "title": f"Luggage Drop at {hotel_name}",
                    "category": "Stay",
                    "start_time": f"{current_time_minutes // 60:02d}:{current_time_minutes % 60:02d}",
                    "end_time": f"{(current_time_minutes + 30) // 60:02d}:{(current_time_minutes + 30) % 60:02d}",
                    "duration_mins": 30,
                    "estimated_cost": 0.0,
                    "travel_time_from_prev_mins": 15,
                    "distance_from_prev_km": 2.2,
                    "notes": "Drop backpacks at the front desk safely while rooms are prepped for 11:00 AM check-in.",
                    "reason_for_recommendation": "Keeps you lightweight and agile for morning exploration.",
                    "map_lat": start_lat,
                    "map_lng": start_lng,
                    "booking_url": hotel.booking_url if hotel else None,
                    "opening_hours": "24/7 Desk",
                    "status": "upcoming",
                    "is_locked": True
                })
                current_time_minutes += 45
            else:
                # Breakfast for other days
                bf_place = food_places[day_idx % len(food_places)] if food_places else None
                day_items.append({
                    "place_id": bf_place.id if bf_place else None,
                    "title": f"Breakfast & Brews at {bf_place.name}" if bf_place else "Valley Breakfast",
                    "category": "Café",
                    "start_time": f"{current_time_minutes // 60:02d}:{current_time_minutes % 60:02d}",
                    "end_time": f"{(current_time_minutes + 50) // 60:02d}:{(current_time_minutes + 50) % 60:02d}",
                    "duration_mins": 50,
                    "estimated_cost": bf_place.approx_cost if bf_place else 220.0,
                    "travel_time_from_prev_mins": 10,
                    "distance_from_prev_km": 1.2,
                    "notes": "Start the day with warm cinnamon rolls, Tibetan bread, and filter coffee.",
                    "reason_for_recommendation": "High morning energy score and panoramic valley patio.",
                    "map_lat": bf_place.latitude if bf_place else start_lat,
                    "map_lng": bf_place.longitude if bf_place else start_lng,
                    "booking_url": None,
                    "opening_hours": "08:00 - 22:00",
                    "status": "upcoming",
                    "is_locked": False
                })
                current_time_minutes += 65

            # Add Daytime Activities
            for p in ordered_day_places[:items_per_day - 1]:
                dist_km = haversine_distance_km(prev_lat, prev_lng, p.latitude, p.longitude)
                travel_mins = max(10, int((dist_km / 25.0) * 60) + 5)
                dur_mins = p.recommended_duration_mins or 90
                
                start_str = f"{current_time_minutes // 60:02d}:{current_time_minutes % 60:02d}"
                end_time_min = current_time_minutes + dur_mins
                end_str = f"{end_time_min // 60:02d}:{end_time_min % 60:02d}"

                day_items.append({
                    "place_id": p.id,
                    "title": p.name,
                    "category": p.category,
                    "start_time": start_str,
                    "end_time": end_str,
                    "duration_mins": dur_mins,
                    "estimated_cost": p.approx_cost or 0.0,
                    "travel_time_from_prev_mins": travel_mins,
                    "distance_from_prev_km": dist_km,
                    "notes": p.description[:140] + "..." if len(p.description) > 140 else p.description,
                    "reason_for_recommendation": p.why_vanvas_recommends or "Geographically optimized match for your trip style.",
                    "map_lat": p.latitude,
                    "map_lng": p.longitude,
                    "booking_url": p.booking_url,
                    "opening_hours": f"{p.opening_time} - {p.closing_time}",
                    "status": "upcoming",
                    "is_locked": False
                })

                current_time_minutes = end_time_min + travel_mins
                prev_lat, prev_lng = p.latitude, p.longitude

                # Midday Lunch insertion
                if 12 * 60 <= current_time_minutes <= 14 * 60:
                    lunch_place = food_places[(day_idx + 1) % len(food_places)] if food_places else None
                    l_title = f"Local Lunch & Siddu at {lunch_place.name}" if lunch_place else "Authentic Valley Lunch"
                    l_cost = lunch_place.approx_cost if lunch_place else 320.0
                    
                    day_items.append({
                        "place_id": lunch_place.id if lunch_place else None,
                        "title": l_title,
                        "category": "Food",
                        "start_time": f"{current_time_minutes // 60:02d}:{current_time_minutes % 60:02d}",
                        "end_time": f"{(current_time_minutes + 60) // 60:02d}:{(current_time_minutes + 60) % 60:02d}",
                        "duration_mins": 60,
                        "estimated_cost": l_cost,
                        "travel_time_from_prev_mins": 10,
                        "distance_from_prev_km": 1.0,
                        "notes": "Taste authentic Himachali Dham, wood-fired trout, or mountain thukpa.",
                        "reason_for_recommendation": "Located right along your route to eliminate detour fatigue.",
                        "map_lat": lunch_place.latitude if lunch_place else prev_lat,
                        "map_lng": lunch_place.longitude if lunch_place else prev_lng,
                        "booking_url": None,
                        "opening_hours": "11:30 - 22:30",
                        "status": "upcoming",
                        "is_locked": False
                    })
                    current_time_minutes += 75

            # Evening Café / Dinner Finale
            dinner_place = food_places[(day_idx + 2) % len(food_places)] if food_places else None
            d_time = max(current_time_minutes, 19 * 60 + 30)
            d_title = f"Evening Sunset & Dinner at {dinner_place.name}" if dinner_place else "Cozy Mountain Dinner & Live Music"
            d_cost = dinner_place.approx_cost if dinner_place else 450.0

            day_items.append({
                "place_id": dinner_place.id if dinner_place else None,
                "title": d_title,
                "category": "Food",
                "start_time": f"{d_time // 60:02d}:{d_time % 60:02d}",
                "end_time": f"{(d_time + 75) // 60:02d}:{(d_time + 75) % 60:02d}",
                "duration_mins": 75,
                "estimated_cost": d_cost,
                "travel_time_from_prev_mins": 15,
                "distance_from_prev_km": 2.0,
                "notes": "Unwind under fairy lights by the sound of the stream with acoustic tunes and wood-fired pizza.",
                "reason_for_recommendation": "Top rated evening atmosphere in the valley.",
                "map_lat": dinner_place.latitude if dinner_place else prev_lat,
                "map_lng": dinner_place.longitude if dinner_place else prev_lng,
                "booking_url": None,
                "opening_hours": "12:00 - 23:30",
                "status": "upcoming",
                "is_locked": False
            })

            generated_days.append({
                "day_number": day_num,
                "date": current_day_date,
                "title": f"Day {day_num}: {day_theme[0]}",
                "theme": day_theme[1],
                "status": "pending" if day_idx > 0 else "in_progress",
                "items": day_items
            })

        return generated_days
