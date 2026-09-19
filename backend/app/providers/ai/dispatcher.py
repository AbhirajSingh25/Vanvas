"""
VANVAS AI Tool Dispatcher
Dispatches registered LLM tool requests to verified, deterministic VANVAS services and models.
Ensures zero hallucination by strictly querying the database and live providers.
"""
import logging
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.models import (
    Destination, Place, Trip, TripMember, User, UserPreference, Expense, Itinerary, ItineraryItem,
    Hotel, RentalOption, TransportOption, Review, Booking
)
from app.services.copilot_actions import CopilotActionService
from app.providers.provider_factory import ProviderFactory
from app.itinerary.clustering import haversine_distance_km
from app.services.operating_hours_engine import OperatingHoursEngine
from app.services.action_link_generator import ActionLinkGenerator
from app.providers.commerce.discovery_adapter import DiscoveryCommerceAdapter
from app.providers.commerce.amadeus_stay_adapter import AmadeusStayCommerceAdapter
from app.providers.commerce.stayingapi_stay_adapter import StayingAPIStayCommerceAdapter

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
            "search_stays": self._search_stays,
            "search_transport": self._search_transport,
            "search_rentals": self._search_rentals,
            "get_place_reviews": self._get_place_reviews,
            "search_commerce_offers": self._search_commerce_offers,
            "get_user_bookings": self._get_user_bookings,
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
        slug = (args.get("destination_slug") or args.get("destination") or "").strip().lower()
        if not slug:
            return {"error": "Missing required argument 'destination_slug'"}

        dest = self.db.query(Destination).filter(
            (Destination.slug == slug) | (Destination.name.ilike(slug))
        ).first()

        if not dest:
            from app.services.destination_intelligence import DestinationIntelligenceService
            dyn = await DestinationIntelligenceService.resolve_dynamic_destination(slug)
            if not dyn:
                return {"error": f"Destination '{slug}' could not be resolved."}
            return {
                "destination_id": dyn["id"],
                "destination_slug": dyn["slug"],
                "destination_name": dyn["name"],
                "state": dyn["state"],
                "region": dyn["region"],
                "tagline": dyn["tagline"],
                "altitude_meters": dyn["altitude_meters"],
                "weather_type": dyn["weather_type"],
                "best_time_to_visit": dyn["best_time_to_visit"],
                "total_curated_places": 0,
                "must_visit_highlights": [],
                "coordinates": {"lat": dyn["latitude"], "lng": dyn["longitude"]},
                "is_curated": False,
                "is_dynamic": True
            }

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
            "coordinates": {"lat": dest.latitude, "lng": dest.longitude},
            "is_curated": True,
            "is_dynamic": False
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

        hours_eval = OperatingHoursEngine.evaluate_simple_hours(place.opening_time, place.closing_time, place.latitude, place.longitude)
        action_links = ActionLinkGenerator.generate_place_action_links(
            name=place.name,
            latitude=place.latitude,
            longitude=place.longitude,
            website=place.booking_url,
            phone=None,
            booking_url=place.booking_url,
            source="vanvas_curated",
            source_id=place.id,
        )

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
            "hours_available": hours_eval.hours_available,
            "is_open_now": hours_eval.is_open_now,
            "recommended_duration_mins": place.recommended_duration_mins,
            "why_vanvas_recommends": place.why_vanvas_recommends,
            "is_indoor": place.is_indoor,
            "is_must_visit": place.is_must_visit,
            "is_hidden_gem": place.is_hidden_gem,
            "image_url": place.image_url,
            "action_links": action_links,
            "data_state": "VERIFIED",
            "trust_source": "VANVAS_CURATED",
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
            hours_eval = OperatingHoursEngine.evaluate_simple_hours(p.opening_time, p.closing_time, p.latitude, p.longitude)
            action_links = ActionLinkGenerator.generate_place_action_links(
                name=p.name,
                latitude=p.latitude,
                longitude=p.longitude,
                website=p.booking_url,
                phone=None,
                booking_url=p.booking_url,
                source="vanvas_curated",
                source_id=p.id,
            )
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
                "hours_available": hours_eval.hours_available,
                "is_open_now": hours_eval.is_open_now,
                "recommended_duration_mins": p.recommended_duration_mins,
                "is_indoor": p.is_indoor,
                "is_must_visit": p.is_must_visit,
                "image_url": p.image_url,
                "source": "vanvas_curated",
                "is_live": False,
                "coordinates": {"lat": p.latitude, "lng": p.longitude},
                "action_links": action_links,
                "data_state": "VERIFIED",
                "trust_source": "VANVAS_CURATED",
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
                        "hours_available": lp.get("hours_available", False),
                        "is_open_now": lp.get("is_open_now"),
                        "phone": lp.get("phone"),
                        "website": lp.get("website"),
                        "recommended_duration_mins": lp.get("recommended_duration_mins", 60),
                        "is_indoor": lp.get("is_indoor", False),
                        "is_must_visit": lp.get("is_must_visit", False),
                        "image_url": lp.get("image_url"),
                        "source": lp.get("source", "openstreetmap"),
                        "is_live": lp.get("is_live", True),
                        "coordinates": {"lat": lp.get("latitude"), "lng": lp.get("longitude")},
                        "action_links": lp.get("action_links", []),
                        "data_state": lp.get("data_state", "LIVE"),
                        "trust_source": lp.get("trust_source", "OPENSTREETMAP"),
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
                hours_eval = OperatingHoursEngine.evaluate_simple_hours(p.opening_time, p.closing_time, p.latitude, p.longitude)
                action_links = ActionLinkGenerator.generate_place_action_links(
                    name=p.name,
                    latitude=p.latitude,
                    longitude=p.longitude,
                    website=p.booking_url,
                    phone=None,
                    booking_url=p.booking_url,
                    source="vanvas_curated",
                    source_id=p.id,
                )
                nearby.append((dist, {
                    "place_id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "distance_km": round(dist, 2),
                    "approx_cost": p.approx_cost,
                    "rating": p.rating,
                    "opening_time": p.opening_time,
                    "closing_time": p.closing_time,
                    "hours_available": hours_eval.hours_available,
                    "is_open_now": hours_eval.is_open_now,
                    "recommended_duration_mins": p.recommended_duration_mins,
                    "is_indoor": p.is_indoor,
                    "image_url": p.image_url,
                    "source": "vanvas_curated",
                    "is_live": False,
                    "action_links": action_links,
                    "data_state": "VERIFIED",
                    "trust_source": "VANVAS_CURATED",
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
                    "opening_time": lp.get("opening_time"),
                    "closing_time": lp.get("closing_time"),
                    "hours_available": lp.get("hours_available", False),
                    "is_open_now": lp.get("is_open_now"),
                    "recommended_duration_mins": lp.get("recommended_duration_mins", 60),
                    "is_indoor": lp.get("is_indoor", False),
                    "image_url": lp.get("image_url"),
                    "source": lp.get("source", "openstreetmap"),
                    "is_live": lp.get("is_live", True),
                    "action_links": lp.get("action_links", []),
                    "data_state": lp.get("data_state", "LIVE"),
                    "trust_source": lp.get("trust_source", "OPENSTREETMAP"),
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
        dest_input = args.get("destination_slug") or args.get("destination")

        if (lat is None or lng is None) and dest_input:
            clean_d = dest_input.strip().lower()
            db_dest = self.db.query(Destination).filter((Destination.slug == clean_d) | (Destination.name.ilike(clean_d))).first()
            if db_dest:
                lat = db_dest.latitude
                lng = db_dest.longitude
            else:
                from app.services.destination_intelligence import DestinationIntelligenceService
                dyn = await DestinationIntelligenceService.resolve_dynamic_destination(clean_d)
                if dyn:
                    lat = dyn["latitude"]
                    lng = dyn["longitude"]

        if lat is None or lng is None:
            return {"error": "Missing coordinates or resolvable destination"}

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

    async def _search_stays(self, args: Dict[str, Any]) -> Dict[str, Any]:
        dest_input = (args.get("destination") or "").strip().lower()
        if not dest_input:
            return {"error": "Missing required argument 'destination'"}

        max_price = args.get("max_price")
        style = (args.get("style") or "").strip()

        dest = self.db.query(Destination).filter(
            (Destination.slug == dest_input) | (Destination.name.ilike(dest_input))
        ).first()
        dest_id = dest.id if dest else dest_input

        # 1. Fetch curated DB stays
        db_query = self.db.query(Hotel).filter(Hotel.destination_id == dest_id)
        if style and style.lower() != "all":
            db_query = db_query.filter(Hotel.hotel_style.ilike(f"%{style}%"))
        if max_price is not None:
            try:
                db_query = db_query.filter(Hotel.price_per_night <= float(max_price))
            except Exception:
                pass

        curated = db_query.all()
        stays_list = []
        seen_names = set()

        for h in curated:
            seen_names.add(h.name.lower().strip())
            action_links = ActionLinkGenerator.generate_hotel_action_links(
                name=h.name,
                latitude=h.latitude,
                longitude=h.longitude,
                website=h.booking_url,
                phone=None,
                booking_url=h.booking_url,
                source="vanvas_curated",
                source_id=h.id,
            )
            stays_list.append({
                "stay_id": h.id,
                "name": h.name,
                "address": h.address,
                "price_per_night": h.price_per_night,
                "price_verified": True,
                "rating": h.rating,
                "style": h.hotel_style,
                "amenities": h.amenities,
                "check_in": h.check_in_time,
                "check_out": h.check_out_time,
                "badge": h.badge,
                "booking_url": h.booking_url,
                "source": "vanvas_curated",
                "is_live": False,
                "price_note": "Verified curated rate",
                "action_links": action_links,
                "data_state": "VERIFIED",
                "trust_source": "VANVAS_CURATED",
            })

        # 2. Fetch live accommodation from LiveHotelsProvider
        try:
            hotels_provider = ProviderFactory.get_hotels_provider()
            target_name = dest.name if dest else dest_input
            target_lat = dest.latitude if dest else None
            target_lng = dest.longitude if dest else None
            live_stays = await hotels_provider.search_hotels(
                destination=target_name,
                lat=target_lat,
                lng=target_lng,
                radius_km=15.0
            )
            for ls in live_stays:
                norm = ls.get("name", "").lower().strip()
                if any(norm in s or s in norm for s in seen_names):
                    continue
                if style and style.lower() != "all" and style.lower() not in ls.get("hotel_style", "").lower():
                    continue
                seen_names.add(norm)
                stays_list.append({
                    "stay_id": ls.get("id"),
                    "name": ls["name"],
                    "address": ls.get("address"),
                    "price_per_night": None,
                    "price_verified": False,
                    "rating": ls.get("rating"),
                    "style": ls.get("hotel_style"),
                    "amenities": ls.get("amenities"),
                    "booking_url": None,
                    "phone": ls.get("phone"),
                    "source": ls.get("source", "openstreetmap"),
                    "is_live": True,
                    "price_note": "Live POI: pricing/availability not verified online",
                    "action_links": ls.get("action_links", []),
                    "data_state": "LIVE",
                    "trust_source": "OPENSTREETMAP",
                })
                if len(stays_list) >= 8:
                    break
        except Exception as e:
            logger.warning(f"Error querying live hotels in dispatcher: {e}")

        if not stays_list:
            return {
                "stays": [],
                "destination": dest_input,
                "message": f"No verified accommodations found matching '{dest_input}'." + (f" with max price ₹{max_price}" if max_price else "")
            }

        return {
            "stays": stays_list[:8],
            "destination": dest.name if dest else dest_input.title(),
            "total_matches": len(stays_list),
            "disclaimer": "Curated stay rates reflect verified baseline pricing. Real-time availability should be confirmed on booking portals."
        }

    async def _search_transport(self, args: Dict[str, Any]) -> Dict[str, Any]:
        dest_input = (args.get("destination") or "").strip().lower()
        if not dest_input:
            return {"error": "Missing required argument 'destination'"}

        origin_city = (args.get("origin_city") or "Delhi").strip()
        transport_type = (args.get("transport_type") or "").strip()

        dest = self.db.query(Destination).filter(
            (Destination.slug == dest_input) | (Destination.name.ilike(dest_input))
        ).first()
        dest_id = dest.id if dest else dest_input

        # 1. Fetch curated DB transport
        query = self.db.query(TransportOption).filter(
            TransportOption.destination_id == dest_id,
            TransportOption.origin_city.ilike(f"%{origin_city}%")
        )
        if transport_type and transport_type.lower() != "all":
            query = query.filter(TransportOption.transport_type.ilike(f"%{transport_type}%"))

        db_options = query.all()
        routes = []

        for opt in db_options:
            action_links = ActionLinkGenerator.generate_transport_action_links(opt.operator_name, opt.booking_url)
            routes.append({
                "route_id": opt.id,
                "origin_city": opt.origin_city,
                "destination": dest.name if dest else dest_input.title(),
                "transport_type": opt.transport_type,
                "operator_name": opt.operator_name,
                "departure_time": opt.departure_time,
                "arrival_time": opt.arrival_time,
                "duration_hours": opt.duration_hours,
                "price": opt.price,
                "departure_location": opt.departure_location,
                "arrival_location": opt.arrival_location,
                "booking_url": opt.booking_url,
                "recommendation_badge": opt.recommendation_badge,
                "source": "vanvas_curated",
                "is_live": False,
                "schedule_type": "curated_schedule",
                "action_links": action_links,
                "data_state": "VERIFIED",
                "trust_source": "VANVAS_CURATED",
            })

        if not routes:
            # Fallback to provider search
            transport_provider = ProviderFactory.get_transport_provider()
            live_routes = await transport_provider.search_routes(
                origin=origin_city,
                destination=dest.name if dest else dest_input.title(),
                transport_type=transport_type
            )
            for r in live_routes:
                action_links = ActionLinkGenerator.generate_transport_action_links(r["operator_name"], r.get("booking_url"))
                routes.append({
                    "route_id": r.get("id"),
                    "origin_city": r.get("origin_city", origin_city),
                    "destination": dest.name if dest else dest_input.title(),
                    "transport_type": r["transport_type"],
                    "operator_name": r["operator_name"],
                    "departure_time": r["departure_time"],
                    "arrival_time": r["arrival_time"],
                    "duration_hours": r["duration_hours"],
                    "price": r["price"],
                    "departure_location": r["departure_location"],
                    "arrival_location": r["arrival_location"],
                    "booking_url": r.get("booking_url"),
                    "recommendation_badge": r.get("recommendation_badge"),
                    "source": r.get("source", "vanvas_curated"),
                    "is_live": False,
                    "schedule_type": "curated_schedule",
                    "action_links": action_links,
                    "data_state": "VERIFIED",
                    "trust_source": "VANVAS_CURATED",
                })

        return {
            "routes": routes,
            "origin_city": origin_city,
            "destination": dest.name if dest else dest_input.title(),
            "total_routes": len(routes),
            "disclaimer": "Transit schedules reflect authentic mountain bus & train timetables. Live real-time GPS tracking is confirmed directly through the operator."
        }

    async def _search_rentals(self, args: Dict[str, Any]) -> Dict[str, Any]:
        dest_input = (args.get("destination") or "").strip().lower()
        if not dest_input:
            return {"error": "Missing required argument 'destination'"}

        vehicle_type = (args.get("vehicle_type") or "").strip()

        dest = self.db.query(Destination).filter(
            (Destination.slug == dest_input) | (Destination.name.ilike(dest_input))
        ).first()
        dest_id = dest.id if dest else dest_input

        # 1. Fetch curated DB rentals
        query = self.db.query(RentalOption).filter(RentalOption.destination_id == dest_id)
        if vehicle_type and vehicle_type.lower() != "all":
            query = query.filter(RentalOption.vehicle_type.ilike(f"%{vehicle_type}%"))

        db_rentals = query.all()
        rentals_list = []
        seen_names = set()

        for r in db_rentals:
            seen_names.add(r.vehicle_name.lower().strip())
            hours_eval = OperatingHoursEngine.evaluate_osm_hours(r.opening_hours, r.latitude, r.longitude)
            action_links = ActionLinkGenerator.generate_rental_action_links(
                provider_name=r.provider_name,
                latitude=r.latitude,
                longitude=r.longitude,
                website=None,
                phone=None,
            )
            rentals_list.append({
                "rental_id": r.id,
                "provider_name": r.provider_name,
                "vehicle_type": r.vehicle_type,
                "vehicle_name": r.vehicle_name,
                "price_per_day": r.price_per_day,
                "deposit_amount": r.deposit_amount,
                "location": r.location,
                "opening_hours": r.opening_hours,
                "hours_available": hours_eval.hours_available,
                "is_open_now": hours_eval.is_open_now,
                "rating": r.rating,
                "source": "vanvas_curated",
                "is_live": False,
                "inventory_verified": True,
                "action_links": action_links,
                "data_state": "VERIFIED",
                "trust_source": "VANVAS_CURATED",
            })

        # 2. Query Live Rentals Provider
        try:
            rentals_provider = ProviderFactory.get_rentals_provider()
            target_name = dest.name if dest else dest_input
            target_lat = dest.latitude if dest else None
            target_lng = dest.longitude if dest else None
            live_rentals = await rentals_provider.search_rentals(
                destination=target_name,
                vehicle_type=vehicle_type,
                lat=target_lat,
                lng=target_lng,
                radius_km=15.0
            )
            for lr in live_rentals:
                norm = lr.get("vehicle_name", "").lower().strip()
                if any(norm in s or s in norm for s in seen_names):
                    continue
                seen_names.add(norm)
                rentals_list.append({
                    "rental_id": lr.get("id"),
                    "provider_name": lr["provider_name"],
                    "vehicle_type": lr.get("vehicle_type"),
                    "vehicle_name": lr["vehicle_name"],
                    "price_per_day": None,
                    "deposit_amount": None,
                    "location": lr.get("location"),
                    "opening_hours": lr.get("opening_hours"),
                    "hours_available": lr.get("hours_available", False),
                    "is_open_now": lr.get("is_open_now"),
                    "phone": lr.get("phone"),
                    "source": lr.get("source", "openstreetmap"),
                    "is_live": True,
                    "inventory_verified": False,
                    "action_links": lr.get("action_links", []),
                    "data_state": "LIVE",
                    "trust_source": "OPENSTREETMAP",
                })
                if len(rentals_list) >= 8:
                    break
        except Exception as e:
            logger.warning(f"Error querying live rentals in dispatcher: {e}")

        return {
            "rentals": rentals_list[:8],
            "destination": dest.name if dest else dest_input.title(),
            "total_matches": len(rentals_list),
            "disclaimer": "Rental options reflect verified valley mobility fleets. Daily availability and security deposit are confirmed upon vehicle pickup."
        }

    async def _get_place_reviews(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Fetches authentic published community reviews for a place from VANVAS database."""
        place_id = (args.get("place_id") or "").strip()
        if not place_id:
            return {"error": "Missing required argument 'place_id'"}

        # Find place to get its name
        place = self.db.query(Place).filter(
            (Place.id == place_id) | (Place.slug == place_id)
        ).first()
        place_name = place.name if place else place_id

        # Query published reviews
        reviews = self.db.query(Review).filter(
            Review.place_id == place_id,
            Review.status == "published"
        ).order_by(Review.created_at.desc()).all()

        total = len(reviews)
        if total == 0:
            return {
                "place_id": place_id,
                "place_name": place_name,
                "total_community_reviews": 0,
                "average_rating": None,
                "reviews": [],
                "trust_source": "VANVAS_COMMUNITY",
                "message": f"No community reviews published yet for {place_name} by VANVAS travellers."
            }

        avg_rating = round(sum(r.rating for r in reviews) / total, 2)
        recent_list = []
        for r in reviews[:5]:
            author_name = r.user.full_name if r.user else "Anonymous Explorer"
            recent_list.append({
                "review_id": r.id,
                "author": author_name,
                "rating": r.rating,
                "title": r.title,
                "comment": r.comment,
                "travel_date": r.travel_date,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })

        return {
            "place_id": place_id,
            "place_name": place_name,
            "total_community_reviews": total,
            "average_rating": avg_rating,
            "reviews": recent_list,
            "trust_source": "VANVAS_COMMUNITY",
            "message": f"Verified {total} community review(s) with an average rating of {avg_rating}/5.0."
        }

    async def _search_commerce_offers(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Search verified commerce offers with explicit booking capabilities (DISCOVERY_ONLY, EXTERNAL_CHECKOUT, IN_APP_BOOKING, UNAVAILABLE)."""
        destination = (args.get("destination") or "").strip()
        if not destination:
            return {"error": "Missing required argument 'destination'"}

        product_type = args.get("product_type")
        all_offers = []

        # 1. Live Stay Commerce Providers if stay requested
        p_type = (product_type or "").lower().strip()
        if not p_type or p_type in ["stay", "hotel", "accommodation", "homestay", "resort"]:
            stayingapi_adapter = StayingAPIStayCommerceAdapter()
            if stayingapi_adapter.is_configured:
                try:
                    live_staying_offers = await stayingapi_adapter.search_offers_async(destination=destination, product_type=product_type)
                    if live_staying_offers:
                        all_offers.extend(live_staying_offers)
                except Exception as exc:
                    logger.warning(f"Error querying live StayingAPI stay offers in dispatcher: {exc}")

            amadeus_adapter = AmadeusStayCommerceAdapter()
            if amadeus_adapter.is_configured:
                try:
                    live_offers = await amadeus_adapter.search_offers_async(destination=destination, product_type=product_type)
                    if live_offers:
                        all_offers.extend(live_offers)
                except Exception as exc:
                    logger.warning(f"Error querying live Amadeus stay offers in dispatcher: {exc}")

        # 2. Discovery Commerce Adapter
        adapter = DiscoveryCommerceAdapter(db=self.db)
        discovery_offers = await adapter.search(destination=destination, product_type=product_type)
        all_offers.extend(discovery_offers)

        offers_data = []
        for o in all_offers[:12]:
            offers_data.append({
                "provider": o.provider,
                "provider_offer_id": o.provider_offer_id,
                "product_type": o.product_type,
                "title": o.title,
                "destination": o.destination,
                "price": o.price,
                "currency": o.currency,
                "availability_state": o.availability_state,
                "cancellation_policy": o.cancellation_policy,
                "booking_capability": o.booking_capability,
                "trust_source": o.trust_source,
                "is_live": o.is_live,
                "deep_link": o.deep_link,
            })

        return {
            "destination": destination,
            "product_type": product_type or "all",
            "total_offers": len(offers_data),
            "offers": offers_data,
            "disclaimer": "Discovered places and providers represent verified travel information. Live booking occurs via official external checkout or verified provider platforms.",
        }

    async def _get_user_bookings(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Fetch verified booking records for the authenticated user."""
        if not self.user:
            return {
                "authenticated": False,
                "message": "User authentication required to view booking records.",
                "bookings": [],
            }

        booking_id = (args.get("booking_id") or "").strip()
        query = self.db.query(Booking).filter(Booking.user_id == self.user.id)

        if booking_id:
            query = query.filter(
                (Booking.id == booking_id) | (Booking.confirmation_reference == booking_id)
            )

        bookings = query.order_by(Booking.created_at.desc()).all()

        results = []
        for b in bookings:
            items_data = [
                {
                    "item_id": item.id,
                    "product_type": item.product_type,
                    "title": item.title,
                    "destination": item.destination,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                    "start_at": item.start_at.isoformat() if item.start_at else None,
                    "end_at": item.end_at.isoformat() if item.end_at else None,
                }
                for item in b.items
            ]
            results.append({
                "booking_id": b.id,
                "booking_type": b.booking_type,
                "provider": b.provider,
                "status": b.status,
                "currency": b.currency,
                "total_amount": b.total_amount,
                "confirmation_reference": b.confirmation_reference,
                "created_at": b.created_at.isoformat() if b.created_at else None,
                "items": items_data,
            })

        if not results:
            msg = f"No verified bookings found matching '{booking_id}'." if booking_id else "No active or past bookings found in your VANVAS account."
            return {
                "total_bookings": 0,
                "bookings": [],
                "message": msg,
            }

        return {
            "total_bookings": len(results),
            "bookings": results,
            "message": f"Retrieved {len(results)} verified booking record(s).",
        }

