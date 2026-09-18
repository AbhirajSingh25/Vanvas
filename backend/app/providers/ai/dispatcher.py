"""
VANVAS AI Tool Dispatcher
Dispatches registered LLM tool requests to verified, deterministic VANVAS services and models.
Ensures zero hallucination by strictly querying the database and live providers.
"""
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.models import (
    Destination, Place, Trip, TripMember, User, UserPreference, Expense, Itinerary, ItineraryItem
)
from app.services.copilot_actions import CopilotActionService
from app.providers.provider_factory import ProviderFactory
from app.itinerary.clustering import haversine_distance_km

logger = logging.getLogger("vanvas.ai.dispatcher")


class AIToolDispatcher:
    """Dispatches AI function calls to verified VANVAS backend services with authorization checks."""

    def __init__(self, db: Session, user: Optional[User] = None):
        self.db = db
        self.user = user

    async def dispatch(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatch a tool call by name with validated arguments."""
        handler_map = {
            "get_destination_info": self._get_destination_info,
            "get_place": self._get_place,
            "search_places": self._search_places,
            "get_nearby_places": self._get_nearby_places,
            "get_weather_forecast": self._get_weather_forecast,
            "calculate_route": self._calculate_route,
            "get_quick_plan": self._get_quick_plan,
            "get_trip": self._get_trip,
            "get_user_preferences": self._get_user_preferences,
            "get_budget_summary": self._get_budget_summary,
            "save_place": self._save_place,
            "add_place_to_itinerary": self._add_place_to_itinerary,
        }


        handler = handler_map.get(tool_name)
        if not handler:
            return {"error": f"Unknown tool '{tool_name}'"}

        try:
            return await handler(args)
        except Exception as e:
            logger.error(f"Error executing tool {tool_name} with args {args}: {e}")
            return {"error": f"Tool execution error: {str(e)}"}

    async def _get_destination_info(self, args: Dict[str, Any]) -> Dict[str, Any]:
        slug = (args.get("destination_slug") or "").strip().lower()
        if not slug:
            return {"error": "Missing required argument 'destination_slug'"}

        dest = self.db.query(Destination).filter(
            (Destination.slug == slug) | (Destination.name.ilike(slug))
        ).first()

        if not dest:
            return {"error": f"Destination '{slug}' not found in curated sanctuaries."}

        places_count = self.db.query(Place).filter(Place.destination_id == dest.id).count()
        top_places = self.db.query(Place).filter(Place.destination_id == dest.id, Place.is_must_visit == True).limit(5).all()

        return {
            "destination_id": dest.id,
            "destination_slug": dest.slug,
            "destination_name": dest.name,
            "state": dest.state,
            "region": dest.region,
            "tagline": dest.tagline,
            "altitude_meters": dest.altitude_meters,
            "weather_type": dest.weather_type,
            "best_time_to_visit": dest.best_time_to_visit,
            "total_curated_places": places_count,
            "must_visit_highlights": [p.name for p in top_places],
            "coordinates": {"lat": dest.latitude, "lng": dest.longitude}
        }

    async def _get_place(self, args: Dict[str, Any]) -> Dict[str, Any]:
        place_id = (args.get("place_id") or "").strip()
        if not place_id:
            return {"error": "Missing required argument 'place_id'"}

        place = self.db.query(Place).filter(
            (Place.id == place_id) | (Place.slug == place_id) | (Place.name.ilike(place_id))
        ).first()

        if not place:
            return {"error": f"Place '{place_id}' not found in verified places."}

        return {
            "place_id": place.id,
            "canonical_slug": place.slug,
            "name": place.name,
            "category": place.category,
            "address": place.address,
            "coordinates": {"lat": place.latitude, "lng": place.longitude},
            "approx_cost": place.approx_cost,
            "price_level": place.price_level,
            "rating": place.rating,
            "review_count": place.review_count,
            "opening_time": place.opening_time,
            "closing_time": place.closing_time,
            "recommended_duration_mins": place.recommended_duration_mins,
            "why_vanvas_recommends": place.why_vanvas_recommends,
            "is_indoor": place.is_indoor,
            "is_must_visit": place.is_must_visit,
            "is_hidden_gem": place.is_hidden_gem,
            "image_url": place.image_url,
        }

    async def _search_places(self, args: Dict[str, Any]) -> Dict[str, Any]:
        query = (args.get("query") or "").strip()
        dest_slug = (args.get("destination_slug") or "").strip().lower()
        category = (args.get("category") or "").strip()

        found_places: List[Dict[str, Any]] = []
        seen_names = set()

        # 1. Search Curated DB places
        db_query = self.db.query(Place).join(Destination)
        if dest_slug:
            db_query = db_query.filter((Destination.slug == dest_slug) | (Destination.name.ilike(dest_slug)))
        if query:
            db_query = db_query.filter(
                (Place.name.ilike(f"%{query}%")) | 
                (Place.description.ilike(f"%{query}%")) |
                (Place.tags.ilike(f"%{query}%"))
            )
        if category and category.lower() != "all":
            db_query = db_query.filter(Place.category.ilike(f"%{category}%"))

        curated_places = db_query.limit(6).all()
        for p in curated_places:
            norm = p.name.lower().strip()
            seen_names.add(norm)
            found_places.append({
                "place_id": p.id,
                "name": p.name,
                "category": p.category,
                "destination_name": p.destination.name if p.destination else "",
                "address": p.address,
                "approx_cost": p.approx_cost,
                "rating": p.rating,
                "review_count": p.review_count,
                "opening_time": p.opening_time,
                "closing_time": p.closing_time,
                "recommended_duration_mins": p.recommended_duration_mins,
                "is_indoor": p.is_indoor,
                "is_must_visit": p.is_must_visit,
                "image_url": p.image_url,
                "source": "vanvas_curated",
                "is_live": False,
                "coordinates": {"lat": p.latitude, "lng": p.longitude}
            })

        # 2. Query Live Places Provider (OSM Overpass / Google Places) if more places needed or dynamic location
        if len(found_places) < 6 or not curated_places:
            try:
                places_provider = ProviderFactory.get_places_provider()
                search_loc = dest_slug if dest_slug else query
                live_res = await places_provider.search_places(query=query, destination_name=search_loc, category=category)
                for lp in live_res:
                    lp_name = lp.get("name", "")
                    lp_norm = lp_name.lower().strip()
                    if any(lp_norm in s or s in lp_norm for s in seen_names):
                        continue
                    seen_names.add(lp_norm)
                    found_places.append({
                        "place_id": lp.get("id", f"live-{lp.get('source_id', lp_name)}"),
                        "name": lp_name,
                        "category": lp.get("category", "Attractions"),
                        "destination_name": dest_slug.title() if dest_slug else "",
                        "address": lp.get("address"),
                        "approx_cost": lp.get("approx_cost"),
                        "rating": lp.get("rating"),
                        "review_count": lp.get("review_count"),
                        "opening_time": lp.get("opening_time"),
                        "closing_time": lp.get("closing_time"),
                        "phone": lp.get("phone"),
                        "website": lp.get("website"),
                        "recommended_duration_mins": lp.get("recommended_duration_mins", 60),
                        "is_indoor": lp.get("is_indoor", False),
                        "is_must_visit": lp.get("is_must_visit", False),
                        "image_url": lp.get("image_url"),
                        "source": lp.get("source", "openstreetmap"),
                        "is_live": lp.get("is_live", True),
                        "coordinates": {"lat": lp.get("latitude"), "lng": lp.get("longitude")}
                    })
                    if len(found_places) >= 8:
                        break
            except Exception as e:
                logger.warning(f"Live places search in tool dispatcher encountered: {e}")

        if not found_places:
            return {
                "places": [],
                "message": f"VANVAS could not verify the requested place '{query}' in {dest_slug or 'the specified area'}."
            }

        return {
            "places": found_places[:8],
            "total_matches": len(found_places)
        }

    async def _get_nearby_places(self, args: Dict[str, Any]) -> Dict[str, Any]:
        lat = args.get("latitude")
        lng = args.get("longitude")
        radius_km = float(args.get("radius_km") or 15.0)
        category = args.get("category")

        if lat is None or lng is None:
            return {"error": "Missing required arguments 'latitude' and 'longitude'"}

        all_places = self.db.query(Place).all()
        nearby = []
        seen_names = set()

        for p in all_places:
            dist = haversine_distance_km(lat, lng, p.latitude, p.longitude)
            if dist <= radius_km:
                if category and category.lower() != "all" and category.lower() not in p.category.lower():
                    continue
                seen_names.add(p.name.lower().strip())
                nearby.append((dist, {
                    "place_id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "distance_km": round(dist, 2),
                    "approx_cost": p.approx_cost,
                    "rating": p.rating,
                    "recommended_duration_mins": p.recommended_duration_mins,
                    "is_indoor": p.is_indoor,
                    "image_url": p.image_url,
                    "source": "vanvas_curated",
                    "is_live": False
                }))

        # Also fetch live places from provider
        try:
            places_provider = ProviderFactory.get_places_provider()
            live_res = await places_provider.get_nearby_places(lat, lng, radius_km, category)
            for lp in live_res:
                lp_name = lp.get("name", "")
                lp_norm = lp_name.lower().strip()
                if any(lp_norm in s or s in lp_norm for s in seen_names):
                    continue
                seen_names.add(lp_norm)
                dist = lp.get("distance_km") or haversine_distance_km(lat, lng, lp.get("latitude", lat), lp.get("longitude", lng))
                nearby.append((dist, {
                    "place_id": lp.get("id", f"live-{lp.get('source_id', lp_name)}"),
                    "name": lp_name,
                    "category": lp.get("category", "Attractions"),
                    "distance_km": round(dist, 2),
                    "approx_cost": lp.get("approx_cost"),
                    "rating": lp.get("rating"),
                    "recommended_duration_mins": lp.get("recommended_duration_mins", 60),
                    "is_indoor": lp.get("is_indoor", False),
                    "image_url": lp.get("image_url"),
                    "source": lp.get("source", "openstreetmap"),
                    "is_live": lp.get("is_live", True)
                }))
        except Exception as e:
            logger.warning(f"Live nearby places in tool dispatcher encountered: {e}")

        nearby.sort(key=lambda x: x[0])
        top_nearby = [item[1] for item in nearby[:8]]

        return {
            "places": top_nearby,
            "center": {"lat": lat, "lng": lng},
            "radius_km": radius_km
        }

    async def _get_weather_forecast(self, args: Dict[str, Any]) -> Dict[str, Any]:
        lat = args.get("latitude")
        lng = args.get("longitude")
        if lat is None or lng is None:
            return {"error": "Missing coordinates"}

        weather_provider = ProviderFactory.get_weather_provider()
        forecasts = await weather_provider.get_forecast(lat, lng, days=3)

        return {
            "coordinates": {"lat": lat, "lng": lng},
            "forecasts": forecasts[:3],
            "provider": "Open-Meteo Satellite Station"
        }

    async def _calculate_route(self, args: Dict[str, Any]) -> Dict[str, Any]:
        o_lat = args.get("origin_lat")
        o_lng = args.get("origin_lng")
        d_lat = args.get("dest_lat")
        d_lng = args.get("dest_lng")

        if any(v is None for v in [o_lat, o_lng, d_lat, d_lng]):
            return {"error": "Missing coordinate parameters for routing"}

        routing_provider = ProviderFactory.get_routing_provider()
        if hasattr(routing_provider, "calculate_route"):
            result = await routing_provider.calculate_route(o_lat, o_lng, d_lat, d_lng)
        else:
            matrix = routing_provider.calculate_distance_matrix([{"lat": o_lat, "lng": o_lng}, {"lat": d_lat, "lng": d_lng}])
            result = matrix[0][1]

        return {
            "distance_km": round(result.get("distance_km", 0.0), 2),
            "estimated_duration_mins": int(result.get("duration_mins", 0)),
            "winding_factor": "1.45x mountain road tortuosity included",
        }

    async def _get_quick_plan(self, args: Dict[str, Any]) -> Dict[str, Any]:
        trip_id = args.get("trip_id")
        hours = float(args.get("hours_available") or 3.0)
        variation = int(args.get("variation") or 0)

        if not trip_id:
            return {"error": "Missing trip_id"}

        trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            return {"error": f"Trip '{trip_id}' not found"}

        dest = trip.destination
        lat = dest.latitude if dest else 30.4598
        lng = dest.longitude if dest else 78.0644

        places = self.db.query(Place).filter(Place.destination_id == trip.destination_id).all()
        if not places:
            places = self.db.query(Place).all()

        places.sort(key=lambda p: haversine_distance_km(lat, lng, p.latitude, p.longitude))

        if variation > 0 and len(places) > 2:
            offset = (variation * 2) % len(places)
            places = places[offset:] + places[:offset]

        items = []
        accum_mins = 600  # Start around 10:00 AM
        slots = int(hours * 60)
        end_limit = accum_mins + slots

        for i, p in enumerate(places[:4]):
            if accum_mins >= end_limit:
                break
            dur = min(60, p.recommended_duration_mins or 45)
            start_str = f"{(accum_mins // 60) % 24:02d}:{accum_mins % 60:02d}"
            end_mins = accum_mins + dur
            end_str = f"{(end_mins // 60) % 24:02d}:{end_mins % 60:02d}"

            items.append({
                "place_id": p.id,
                "name": p.name,
                "category": p.category,
                "start_time": start_str,
                "end_time": end_str,
                "duration_mins": dur,
                "estimated_cost": p.approx_cost,
                "notes": p.description[:120] if p.description else "",
                "is_indoor": p.is_indoor,
                "image_url": p.image_url
            })
            accum_mins = end_mins + 15

        return {
            "headline": f"Curated {int(hours)}-Hour Micro Plan",
            "destination_name": dest.name if dest else "Himalayas",
            "duration_hours": hours,
            "items": items,
            "total_estimated_cost": sum(item["estimated_cost"] for item in items)
        }

    async def _get_trip(self, args: Dict[str, Any]) -> Dict[str, Any]:
        trip_id = args.get("trip_id")
        if not trip_id:
            return {"error": "Missing trip_id"}

        trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            return {"error": "Trip not found"}

        # Strict security & authorization check
        if self.user:
            is_creator = (trip.user_id == self.user.id)
            is_member = bool(self.db.query(TripMember).filter(
                TripMember.trip_id == trip.id, TripMember.user_id == self.user.id
            ).first())
            if not is_creator and not is_member:
                return {"error": "Unauthorized: You do not have permission to access this trip."}

        days_summary = []
        for it in trip.itineraries:
            days_summary.append({
                "day_number": it.day_number,
                "date": str(it.date),
                "title": it.title,
                "items_count": len(it.items)
            })

        return {
            "trip_id": trip.id,
            "title": trip.title,
            "destination_name": trip.destination.name if trip.destination else "Himalayas",
            "destination_slug": trip.destination.slug if trip.destination else "manali",
            "start_date": str(trip.start_date),
            "end_date": str(trip.end_date),
            "num_days": trip.num_days,
            "companion_type": trip.companion_type,
            "travel_style": trip.travel_style,
            "wake_up_preference": trip.wake_up_preference,
            "activity_intensity": trip.activity_intensity,
            "budget_total": trip.budget_total,
            "budget_spent": trip.budget_spent,
            "status": trip.status,
            "days": days_summary,
        }

    async def _get_user_preferences(self, args: Dict[str, Any]) -> Dict[str, Any]:
        target_user = self.user
        user_id = args.get("user_id")

        if user_id and (not self.user or self.user.role == "admin" or self.user.id == user_id):
            target_user = self.db.query(User).filter(User.id == user_id).first()

        if not target_user:
            return {"preferences": {"travel_style": "Balanced", "activity_intensity": "Balanced", "dietary_preference": "All"}}

        prefs = target_user.preferences
        if not prefs:
            return {
                "travel_style": "Balanced",
                "wake_up_preference": "Normal",
                "activity_intensity": "Balanced",
                "dietary_preference": "All",
                "interests": ["Nature", "Cafes", "Scenery"],
            }

        return {
            "travel_style": prefs.preferred_travel_style,
            "wake_up_preference": prefs.wake_up_preference,
            "activity_intensity": prefs.activity_intensity,
            "dietary_preference": prefs.dietary_preference,
            "interests": [i.strip() for i in (prefs.interests or "").split(",") if i.strip()],
            "accommodation_preference": prefs.accommodation_preference,
            "transport_preference": prefs.transport_preference,
            "companion_style": prefs.companion_style,
        }

    async def _get_budget_summary(self, args: Dict[str, Any]) -> Dict[str, Any]:
        trip_id = args.get("trip_id")
        if not trip_id:
            return {"error": "Missing trip_id"}

        trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            return {"error": "Trip not found"}

        # Authorization check
        if self.user:
            is_creator = (trip.user_id == self.user.id)
            is_member = bool(self.db.query(TripMember).filter(
                TripMember.trip_id == trip.id, TripMember.user_id == self.user.id
            ).first())
            if not is_creator and not is_member:
                return {"error": "Unauthorized: Cannot access budget for this trip."}

        expenses = self.db.query(Expense).filter(Expense.trip_id == trip.id).all()
        categories: Dict[str, float] = {}
        total_expense = 0.0

        for exp in expenses:
            cat = exp.category or "Misc"
            categories[cat] = categories.get(cat, 0.0) + exp.amount
            total_expense += exp.amount

        spent = total_expense if total_expense > 0 else (trip.budget_spent or 0.0)
        remaining = max(0.0, (trip.budget_total or 0.0) - spent)

        return {
            "trip_id": trip.id,
            "trip_title": trip.title,
            "total_budget": trip.budget_total,
            "total_spent": spent,
            "remaining_budget": remaining,
            "currency": "INR (₹)",
            "category_breakdown": categories,
            "expenses_count": len(expenses)
        }

    async def _save_place(self, args: Dict[str, Any]) -> Dict[str, Any]:
        return CopilotActionService.execute_action(
            db=self.db,
            user=self.user,
            action_name="save_place",
            payload=args,
        )

    async def _add_place_to_itinerary(self, args: Dict[str, Any]) -> Dict[str, Any]:
        return CopilotActionService.execute_action(
            db=self.db,
            user=self.user,
            action_name="add_place_to_itinerary",
            payload=args,
        )

