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
        dest_slug = (destination.slug or "").lower().strip()
        is_trek_destination = dest_slug == "tungnath-chandrashila" or "trek" in dest_slug
        
        # Determine items per day based on intensity and duration
        if is_trek_destination:
            items_per_day = 3 if activity_intensity == "Relaxed" else 4
        elif num_days == 1:
            items_per_day = 3 if activity_intensity == "Relaxed" else 4
        elif activity_intensity == "Relaxed":
            items_per_day = 3
        elif activity_intensity == "Packed":
            items_per_day = 5
        else:
            items_per_day = 4

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

        # =====================================================================
        # DEDICATED HIGH-ALTITUDE TREK PLANNING (e.g. Tungnath-Chandrashila)
        # =====================================================================
        if is_trek_destination:
            # Look for specific landmark places in db if available
            chopta_p = next((p for p in all_places if "chopta" in p.name.lower()), None)
            tungnath_p = next((p for p in all_places if "tungnath" in p.name.lower()), None)
            chandrashila_p = next((p for p in all_places if "chandrashila" in p.name.lower()), None)

            for day_idx in range(num_days):
                current_day_date = start_date + timedelta(days=day_idx)
                day_num = day_idx + 1
                day_items = []

                if day_idx == 0:
                    # Day 1: Chopta Roadhead Arrival & Bugyal Acclimatization
                    day_items.append({
                        "place_id": chopta_p.id if chopta_p else None,
                        "title": "Chopta Roadhead Base Camp Arrival (2,680m)",
                        "category": "Nature & Trails",
                        "start_time": "08:30",
                        "end_time": "10:00",
                        "duration_mins": 90,
                        "estimated_cost": 200.0,
                        "travel_time_from_prev_mins": 0,
                        "distance_from_prev_km": 0.0,
                        "notes": "Arrive at Chopta roadhead base camp. Altitude is 2,680m; vehicular road ends here. Settle in and acclimatize.",
                        "reason_for_recommendation": "Crucial roadhead transition point before entering walking-only Himalayan reserve.",
                        "map_lat": chopta_p.latitude if chopta_p else 30.4850,
                        "map_lng": chopta_p.longitude if chopta_p else 79.1790,
                        "booking_url": None,
                        "opening_hours": "Open 24 Hours",
                        "status": "upcoming",
                        "is_locked": True
                    })
                    day_items.append({
                        "place_id": None,
                        "title": "Alpine Camp Check-In & Mountain Briefing",
                        "category": "Stay",
                        "start_time": "10:15",
                        "end_time": "11:30",
                        "duration_mins": 75,
                        "estimated_cost": 0.0,
                        "travel_time_from_prev_mins": 15,
                        "distance_from_prev_km": 0.5,
                        "notes": "Check in to alpine tent / wooden lodge in Chopta. Gear check (headlamps, layers, waterproof shell, trekking poles).",
                        "reason_for_recommendation": "Rest and hydration ensure altitude acclimatization.",
                        "map_lat": 30.4850,
                        "map_lng": 79.1790,
                        "booking_url": None,
                        "opening_hours": "All Day",
                        "status": "upcoming",
                        "is_locked": True
                    })
                    day_items.append({
                        "place_id": None,
                        "title": "Chopta Bugyal Acclimatization & Rhododendron Trail Walk",
                        "category": "Nature & Trails",
                        "start_time": "14:00",
                        "end_time": "16:30",
                        "duration_mins": 150,
                        "estimated_cost": 0.0,
                        "travel_time_from_prev_mins": 10,
                        "distance_from_prev_km": 1.5,
                        "notes": "Gentle 2 km acclimatization stroll along lush bugyal meadows and pine forest canopy. Strictly walking only.",
                        "reason_for_recommendation": "Prepares lungs and legs for the 4,000m summit push tomorrow.",
                        "map_lat": 30.4860,
                        "map_lng": 79.1820,
                        "booking_url": None,
                        "opening_hours": "Daylight hours",
                        "status": "upcoming",
                        "is_locked": False
                    })
                    day_items.append({
                        "place_id": None,
                        "title": "Early Alpine Dinner & Pre-Dawn Summit Briefing",
                        "category": "Food",
                        "start_time": "19:00",
                        "end_time": "20:30",
                        "duration_mins": 90,
                        "estimated_cost": 350.0,
                        "travel_time_from_prev_mins": 10,
                        "distance_from_prev_km": 0.5,
                        "notes": "Warm Garhwali meal (Mandua roti, dal, hot mountain soup). Early bedtime for 04:30 AM alpine start.",
                        "reason_for_recommendation": "Essential nutrition and rest before summit day.",
                        "map_lat": 30.4850,
                        "map_lng": 79.1790,
                        "booking_url": None,
                        "opening_hours": "18:30 - 21:30",
                        "status": "upcoming",
                        "is_locked": False
                    })

                    generated_days.append({
                        "day_number": day_num,
                        "date": current_day_date,
                        "title": "Day 1: Chopta Roadhead Arrival & Alpine Acclimatization",
                        "theme": "Base Camp & Acclimatization",
                        "status": "in_progress",
                        "items": day_items
                    })

                elif day_idx == 1:
                    # Day 2: Summit Push (Tungnath Temple 3,680m -> Chandrashila 4,000m)
                    day_items.append({
                        "place_id": None,
                        "title": "Pre-Dawn Trailhead Departure from Chopta (04:30 AM)",
                        "category": "Nature & Trails",
                        "start_time": "04:30",
                        "end_time": "05:00",
                        "duration_mins": 30,
                        "estimated_cost": 50.0,
                        "travel_time_from_prev_mins": 0,
                        "distance_from_prev_km": 0.0,
                        "notes": "Hot black tea at trailhead. Begin stone paved ascent with headlamps under starlit Himalayan sky.",
                        "reason_for_recommendation": "Early start avoids midday mountain wind and catches the 360° Chaukhamba golden sunrise.",
                        "map_lat": 30.4850,
                        "map_lng": 79.1790,
                        "booking_url": None,
                        "opening_hours": "Trailhead Open 24/7",
                        "status": "upcoming",
                        "is_locked": True
                    })
                    day_items.append({
                        "place_id": tungnath_p.id if tungnath_p else None,
                        "title": "Tungnath Temple Ascent (3,680m • Panch Kedar)",
                        "category": "Culture & Heritage",
                        "start_time": "05:00",
                        "end_time": "07:30",
                        "duration_mins": 150,
                        "estimated_cost": 0.0,
                        "travel_time_from_prev_mins": 10,
                        "distance_from_prev_km": 3.5,
                        "notes": "3.5 km stone paved walking trail through alpine ridge. World's highest Shiva shrine (1000+ years old Nagara stone architecture).",
                        "reason_for_recommendation": "Third Panch Kedar and sacred high-altitude sanctuary.",
                        "map_lat": tungnath_p.latitude if tungnath_p else 30.4886,
                        "map_lng": tungnath_p.longitude if tungnath_p else 79.2173,
                        "booking_url": None,
                        "opening_hours": "06:00 - 19:00 (Shrine open May to Nov)",
                        "status": "upcoming",
                        "is_locked": True
                    })
                    day_items.append({
                        "place_id": chandrashila_p.id if chandrashila_p else None,
                        "title": "Chandrashila Summit Sunrise Panorama (4,000m)",
                        "category": "Nature & Trails",
                        "start_time": "07:30",
                        "end_time": "09:30",
                        "duration_mins": 120,
                        "estimated_cost": 0.0,
                        "travel_time_from_prev_mins": 10,
                        "distance_from_prev_km": 1.5,
                        "notes": "Steep 1.5 km summit push from Temple. Unrivalled 360-degree panorama of Chaukhamba, Nanda Devi, Trishul, and Kedarnath peaks.",
                        "reason_for_recommendation": "The pinnacle high-altitude vista of Garhwal Himalayas.",
                        "map_lat": chandrashila_p.latitude if chandrashila_p else 30.4930,
                        "map_lng": chandrashila_p.longitude if chandrashila_p else 79.2185,
                        "booking_url": None,
                        "opening_hours": "Summit Ridge",
                        "status": "upcoming",
                        "is_locked": True
                    })
                    day_items.append({
                        "place_id": None,
                        "title": "Descent to Chopta Base Camp & Celebratory Warm Lunch",
                        "category": "Food",
                        "start_time": "11:30",
                        "end_time": "13:30",
                        "duration_mins": 120,
                        "estimated_cost": 300.0,
                        "travel_time_from_prev_mins": 30,
                        "distance_from_prev_km": 5.0,
                        "notes": "Careful 5 km downhill descent back to Chopta. Enjoy steaming maggi, thukpa, and hot ginger lemon honey tea.",
                        "reason_for_recommendation": "Rest and refuel after completing a 4,000m Himalayan summit.",
                        "map_lat": 30.4850,
                        "map_lng": 79.1790,
                        "booking_url": None,
                        "opening_hours": "11:00 - 22:00",
                        "status": "upcoming",
                        "is_locked": False
                    })

                    generated_days.append({
                        "day_number": day_num,
                        "date": current_day_date,
                        "title": "Day 2: Tungnath (3,680m) & Chandrashila 4,000m Summit Sunrise",
                        "theme": "Sacred Peak & Summit Push",
                        "status": "pending",
                        "items": day_items
                    })

                else:
                    # Day 3+: Deoria Tal Lake / Meadow Loop / Farewell Return
                    day_items.append({
                        "place_id": None,
                        "title": "Sari Village Roadhead & Deoria Tal Trailhead (2,438m)",
                        "category": "Nature & Trails",
                        "start_time": "08:30",
                        "end_time": "11:30",
                        "duration_mins": 180,
                        "estimated_cost": 150.0,
                        "travel_time_from_prev_mins": 25,
                        "distance_from_prev_km": 12.0,
                        "notes": "Scenic 2.5 km gentle forest trail from Sari village to emerald Deoria Tal lake with reflection of Chaukhamba peaks.",
                        "reason_for_recommendation": "Complementary serene lake trek to conclude the Garhwal expedition.",
                        "map_lat": 30.5230,
                        "map_lng": 79.1300,
                        "booking_url": None,
                        "opening_hours": "Daylight hours",
                        "status": "upcoming",
                        "is_locked": False
                    })
                    day_items.append({
                        "place_id": None,
                        "title": "Valley Farewell Lunch & Return Descent towards Rishikesh",
                        "category": "Food",
                        "start_time": "12:30",
                        "end_time": "14:00",
                        "duration_mins": 90,
                        "estimated_cost": 300.0,
                        "travel_time_from_prev_mins": 20,
                        "distance_from_prev_km": 5.0,
                        "notes": "Wrap up gear, collect memories, and begin scenic highway descent through Rudraprayag and Devprayag.",
                        "reason_for_recommendation": "Safe daytime mountain driving back to lower transit hubs.",
                        "map_lat": 30.4850,
                        "map_lng": 79.1790,
                        "booking_url": None,
                        "opening_hours": "All Day",
                        "status": "upcoming",
                        "is_locked": False
                    })

                    generated_days.append({
                        "day_number": day_num,
                        "date": current_day_date,
                        "title": f"Day {day_num}: Deoria Tal Emerald Lake & Himalayan Farewell",
                        "theme": "Lake Sanctuary & Return",
                        "status": "pending",
                        "items": day_items
                    })

            return generated_days

        # =====================================================================
        # STANDARD DESTINATIONS: ONE-DAY, WEEKEND & MULTI-DAY FLOWS
        # =====================================================================

        for day_idx in range(num_days):
            current_day_date = start_date + timedelta(days=day_idx)
            day_num = day_idx + 1
            day_places = clusters[day_idx] if day_idx < len(clusters) and clusters[day_idx] else ([activity_places[day_idx % len(activity_places)]] if activity_places else [])
            
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

                # 10:00 Luggage Drop / Hotel check-in preparation (for multi-day trips)
                if num_days > 1:
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

            # Add Daytime Activities (2 for 1-day trip, 3-4 for multi-day)
            max_act = 2 if num_days == 1 else (items_per_day - 1)
            for p in ordered_day_places[:max_act]:
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
                    "notes": (p.description[:140] + "...") if p.description and len(p.description) > 140 else (p.description or p.why_vanvas_recommends or "Exploration point."),
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
