import re
import uuid
import asyncio
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.models import Destination, Place, Hotel, RentalOption, WeatherSnapshot
from app.providers.provider_factory import ProviderFactory
from app.seed.canonical_dataset import CANONICAL_26_DESTINATIONS

logger = logging.getLogger("vanvas.intelligence")

class DestinationIntelligenceService:
    @staticmethod
    def _clean_query(query: str) -> str:
        q = (query or "").strip()
        q = re.sub(r'^(dyn|dest)-', '', q, flags=re.IGNORECASE).strip()
        return q

    @staticmethod
    async def resolve_destination(query: str, db: Session) -> Optional[Destination]:
        """
        Looks up an approved curated destination from the database.
        Never inserts dynamic search results into the database.
        Resolves aliases (e.g. Banaras -> Varanasi, Chopta -> Tungnath) seamlessly.
        """
        clean_raw = DestinationIntelligenceService._clean_query(query)
        if not clean_raw:
            return None

        from app.services.destination_aliases import resolve_alias_to_slug

        # Check alias first
        alias_res = resolve_alias_to_slug(clean_raw)
        target_slug = alias_res[0] if alias_res else None

        clean_q = clean_raw.lower().replace("-", " ")
        slug = clean_raw.lower().replace(" ", "-").replace(",", "").replace("'", "")

        # 1. Exact match by id, slug, name or resolved alias slug
        query_filter = (
            (Destination.id == query.strip()) |
            (Destination.id == f"dest-{slug}") |
            (Destination.slug == slug) |
            (Destination.name.ilike(clean_q))
        )
        if target_slug:
            query_filter = query_filter | (Destination.slug == target_slug) | (Destination.id == f"dest-{target_slug}")

        dest = db.query(Destination).filter(query_filter).first()

        # 2. Prefix match for curated destinations
        if not dest:
            dest = db.query(Destination).filter(
                (Destination.name.ilike(f"{clean_q}%")) |
                (Destination.slug.ilike(f"{slug}%"))
            ).first()

        if dest:
            return dest

        # 3. Canonical dataset fallback
        canon = next((
            d for d in CANONICAL_26_DESTINATIONS
            if d["slug"] == slug
            or (target_slug and d["slug"] == target_slug)
            or d["name"].lower() == clean_q
            or slug in d["slug"]
            or clean_q in d["name"].lower()
        ), None)
        if canon:
            return Destination(id=f"dest-{canon['slug']}", **canon)

        return None

    @staticmethod
    async def search_destinations_autocomplete(query: str, limit: int = 6, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """
        Fast, intelligent Universal Travel Discovery search:
        1. Classifies search intent: destination, famous landmark, category + location, food, mobility.
        2. Injects exact landmark matches (Key Monastery, Chicham Bridge, Hawa Mahal, Taj Mahal, Tungnath, Pangong Tso).
        3. Injects category matches (Cafés in Landour, Bike rental in Spiti, Vegetarian food in Jaipur).
        4. Resolves Indian aliases & canonical destinations instantly (sub-10ms).
        5. Dynamically geocodes unseeded/arbitrary destinations (Ujjain, Munsiyari, Chitkul, Paris) with robust fallbacks.
        """
        clean_raw = DestinationIntelligenceService._clean_query(query)
        if not clean_raw:
            return []

        clean_q = clean_raw.lower()
        slug_norm = clean_q.replace(" ", "-").replace(",", "").replace("'", "")
        results: List[Dict[str, Any]] = []
        seen_slugs = set()

        def format_result(
            dest_id: str,
            name: str,
            slug: str,
            state: str = "India",
            country: str = "India",
            region: str = "",
            lat: float = 0.0,
            lng: float = 0.0,
            hindi_name: Optional[str] = None,
            altitude_meters: int = 1000,
            hero_image: Optional[str] = None,
            is_curated: bool = True,
            matched_alias: Optional[str] = None,
            result_type: str = "destination",
            badge: str = "DESTINATION"
        ) -> Dict[str, Any]:
            disp_parts = [name]
            if matched_alias and matched_alias.lower() != name.lower():
                disp_parts[0] = f"{name} ({matched_alias})"
            if state and state != name:
                disp_parts.append(state)
            elif country and country != "India":
                disp_parts.append(country)

            return {
                "id": dest_id,
                "destination_id": dest_id,
                "canonical_slug": slug,
                "slug": slug,
                "name": name,
                "city": name,
                "display_name": ", ".join(disp_parts),
                "state": state or "India",
                "country": country or "India",
                "region": region or f"{state}, India",
                "latitude": round(lat, 4),
                "longitude": round(lng, 4),
                "lat": round(lat, 4),
                "lng": round(lng, 4),
                "place_type": result_type,
                "type": result_type,
                "badge": badge,
                "altitude_meters": altitude_meters,
                "hindi_name": hindi_name,
                "hero_image": hero_image,
                "matched_alias": matched_alias,
                "source": "curated" if is_curated else "database",
                "is_curated": is_curated,
                "is_dynamic": not is_curated
            }

        # 0. Search Intent Classification (Landmark & Category Discovery)
        from app.services.intent_router import SearchIntentRouter
        from app.seed.canonical_dataset import ADDITIONAL_PLACES_BY_DEST
        from app.services.destination_aliases import resolve_alias_to_slug, DESTINATION_ALIASES
        intent = SearchIntentRouter.classify_intent(clean_raw)

        # 1. Check exact or prefix alias match (e.g. "banaras" -> Varanasi, "chopta" -> Tungnath-Chandrashila)
        # Only when not intercepted as an explicit physical landmark (e.g. "Key Monastery", "Taj Mahal")
        alias_res = resolve_alias_to_slug(clean_raw)
        if alias_res and not (intent["intent"] == "place" and intent.get("extracted_place")):
            target_slug, alias_display = alias_res
            canon = next((d for d in CANONICAL_26_DESTINATIONS if d["slug"] == target_slug), None)
            if canon and canon["slug"] not in seen_slugs:
                results.append(format_result(
                    dest_id=f"dest-{canon['slug']}",
                    name=canon["name"],
                    slug=canon["slug"],
                    state=canon.get("state", "India"),
                    country="India",
                    region=canon.get("region", ""),
                    lat=canon.get("latitude", 0.0),
                    lng=canon.get("longitude", 0.0),
                    hindi_name=canon.get("hindi_name"),
                    altitude_meters=canon.get("altitude_meters", 1000),
                    hero_image=canon.get("hero_image"),
                    is_curated=True,
                    matched_alias=alias_display
                ))
                seen_slugs.add(canon["slug"])

        # 0A. Famous Landmark Interception (e.g. "Key Monastery", "Chicham Bridge", "Hawa Mahal", "Taj Mahal", "Pangong Tso")
        if intent["intent"] == "place" and intent.get("extracted_place"):
            landmark_dest_slug = intent.get("destination_slug", "spiti")
            landmark_place_slug = intent.get("place_slug", "place")
            landmark_name = intent["extracted_place"]
            landmark_dest_name = intent.get("extracted_location", "Destination")
            results.append({
                "id": f"place-{landmark_dest_slug}-{landmark_place_slug}",
                "destination_id": f"dest-{landmark_dest_slug}",
                "canonical_slug": landmark_dest_slug,
                "slug": landmark_place_slug,
                "name": landmark_name,
                "city": landmark_dest_name,
                "display_name": f"{landmark_name} • {landmark_dest_name}",
                "state": landmark_dest_name,
                "country": "India",
                "region": landmark_dest_name,
                "latitude": 0.0,
                "longitude": 0.0,
                "lat": 0.0,
                "lng": 0.0,
                "place_type": "landmark",
                "type": "landmark",
                "badge": "LANDMARK",
                "category": intent.get("category", "Must Visit"),
                "destination_slug": landmark_dest_slug,
                "destination_name": landmark_dest_name,
                "hero_image": intent.get("image_url") or f"/images/places/{landmark_dest_slug}/{landmark_place_slug}.webp",
                "why_vanvas_recommends": intent.get("why_vanvas_recommends", ""),
                "is_curated": True,
                "is_dynamic": False
            })
            seen_slugs.add(f"landmark-{landmark_place_slug}")

        # 0B. Category + Location Interception (e.g. "Cafés in Landour", "Bike rental in Spiti", "Vegetarian food in Jaipur")
        elif (intent.get("sub_intent") == "category_search" or intent.get("is_category_search") or intent["intent"] == "category_search") and intent.get("extracted_location"):
            cat_dest_slug = intent.get("destination_slug")
            cat_dest_name = intent.get("extracted_location")
            cat_name = intent.get("category", "Attractions")
            dietary = intent.get("dietary")
            is_mobility = cat_name == "Mobility"
            is_food = "Food" in cat_name or dietary is not None
            badge_label = "RENTAL" if is_mobility else ("FOOD" if is_food else ("STAY" if cat_name == "Stays" else "CATEGORY"))
            disp_title = f"{dietary + ' ' if dietary else ''}{cat_name} in {cat_dest_name}"

            results.append({
                "id": f"cat-{cat_dest_slug or 'all'}-{intent.get('extracted_category')}",
                "destination_id": f"dest-{cat_dest_slug}" if cat_dest_slug else None,
                "canonical_slug": cat_dest_slug,
                "slug": cat_dest_slug or "all",
                "name": disp_title,
                "city": cat_dest_name,
                "display_name": disp_title,
                "state": cat_dest_name,
                "country": "India",
                "region": cat_dest_name,
                "latitude": 0.0,
                "longitude": 0.0,
                "lat": 0.0,
                "lng": 0.0,
                "place_type": "category",
                "type": "category",
                "badge": badge_label,
                "category": cat_name,
                "dietary": dietary,
                "destination_slug": cat_dest_slug,
                "destination_name": cat_dest_name,
                "is_curated": True,
                "is_dynamic": False
            })

            # Add matching places from that destination
            if cat_dest_slug and cat_dest_slug in ADDITIONAL_PLACES_BY_DEST:
                for p in ADDITIONAL_PLACES_BY_DEST[cat_dest_slug]:
                    p_cat = p.get("category", "")
                    p_tags = p.get("tags", "").lower()
                    p_name = p.get("name", "")
                    match = False
                    if is_mobility and ("mobility" in p_cat.lower() or "rental" in p_tags or "bike" in p_name.lower()):
                        match = True
                    elif is_food and ("food" in p_cat.lower() or "cafe" in p_cat.lower() or "restaurant" in p_cat.lower() or "dining" in p_tags or "bakery" in p_cat.lower()):
                        if dietary and dietary.lower() == "vegetarian":
                            match = ("veg" in p_tags or "vegetarian" in p_tags or "mithai" in p_tags or "pure veg" in p_tags or "dhaba" in p_tags or "sweets" in p_tags)
                        else:
                            match = True
                    elif "caf" in cat_name.lower() and ("caf" in p_cat.lower() or "bakery" in p_cat.lower() or "tea" in p_tags):
                        match = True
                    elif cat_name in p_cat:
                        match = True

                    if match:
                        results.append({
                            "id": f"place-{cat_dest_slug}-{p['slug']}",
                            "destination_id": f"dest-{cat_dest_slug}",
                            "canonical_slug": cat_dest_slug,
                            "slug": p["slug"],
                            "name": p_name,
                            "city": cat_dest_name,
                            "display_name": f"{p_name} ({cat_dest_name})",
                            "state": cat_dest_name,
                            "country": "India",
                            "region": cat_dest_name,
                            "latitude": p.get("latitude", 0.0),
                            "longitude": p.get("longitude", 0.0),
                            "lat": p.get("latitude", 0.0),
                            "lng": p.get("longitude", 0.0),
                            "place_type": "place",
                            "type": "place",
                            "badge": badge_label,
                            "category": p_cat,
                            "destination_slug": cat_dest_slug,
                            "destination_name": cat_dest_name,
                            "hero_image": p.get("image_url"),
                            "is_curated": True,
                            "is_dynamic": False
                        })
                        if len(results) >= limit:
                            break

# 1. Alias match processed in Step 0

        # 2. Match against Canonical 26 Destinations
        for cd in CANONICAL_26_DESTINATIONS:
            cd_name = cd["name"].lower()
            cd_slug = cd["slug"].lower()
            cd_hindi = (cd.get("hindi_name") or "").lower()
            cd_state = (cd.get("state") or "").lower()

            is_match = (
                clean_q == cd_slug or
                clean_q == cd_name or
                cd_name.startswith(clean_q) or
                cd_slug.startswith(clean_q) or
                (len(clean_q) >= 3 and (clean_q in cd_name or clean_q in cd_hindi or clean_q in cd_state or clean_q in cd_slug))
            )

            if is_match and cd["slug"] not in seen_slugs:
                results.append(format_result(
                    dest_id=f"dest-{cd['slug']}",
                    name=cd["name"],
                    slug=cd["slug"],
                    state=cd.get("state", "India"),
                    country="India",
                    region=cd.get("region", ""),
                    lat=cd.get("latitude", 0.0),
                    lng=cd.get("longitude", 0.0),
                    hindi_name=cd.get("hindi_name"),
                    altitude_meters=cd.get("altitude_meters", 1000),
                    hero_image=cd.get("hero_image"),
                    is_curated=True
                ))
                seen_slugs.add(cd["slug"])

        # 2.5 Match against Curated SEED_DESTINATIONS (e.g. Ujjain, Munsiyari, Tirthan Valley, Zanskar, Chitkul, etc.)
        from app.providers.geocoding_provider import SEED_DESTINATIONS
        for sd in SEED_DESTINATIONS:
            sd_name = sd["name"].lower()
            sd_slug = sd["slug"].lower()
            sd_hindi = (sd.get("hindi_name") or "").lower()
            sd_state = (sd.get("state") or "").lower()

            is_match = (
                clean_q == sd_slug or
                clean_q == sd_name or
                sd_name.startswith(clean_q) or
                sd_slug.startswith(clean_q) or
                (len(clean_q) >= 3 and (clean_q in sd_name or clean_q in sd_hindi or clean_q in sd_state or clean_q in sd_slug))
            )

            if is_match and sd["slug"] not in seen_slugs:
                results.append(format_result(
                    dest_id=f"dest-{sd['slug']}",
                    name=sd["name"],
                    slug=sd["slug"],
                    state=sd.get("state", "India"),
                    country=sd.get("country", "India"),
                    region=sd.get("region", ""),
                    lat=sd.get("lat", 0.0),
                    lng=sd.get("lng", 0.0),
                    hindi_name=sd.get("hindi_name"),
                    altitude_meters=sd.get("altitude_meters", 1000),
                    hero_image=None,
                    is_curated=True
                ))
                seen_slugs.add(sd["slug"])

        # 3. Match against Database Destinations (if db provided)
        if db and len(results) < limit:
            try:
                db_matches = db.query(Destination).filter(
                    (Destination.name.ilike(f"%{clean_raw}%")) |
                    (Destination.slug.ilike(f"%{slug_norm}%")) |
                    (Destination.state.ilike(f"%{clean_raw}%")) |
                    (Destination.region.ilike(f"%{clean_raw}%"))
                ).filter(
                    ~Destination.id.contains("-c3365045"),
                    ~Destination.name.contains("Sanctuary c")
                ).limit(limit).all()

                for d in db_matches:
                    clean_d_slug = d.slug.replace("dest-", "")
                    if clean_d_slug not in seen_slugs:
                        results.append(format_result(
                            dest_id=d.id,
                            name=d.name,
                            slug=clean_d_slug,
                            state=d.state,
                            country="India",
                            region=d.region,
                            lat=d.latitude,
                            lng=d.longitude,
                            hindi_name=d.hindi_name,
                            altitude_meters=d.altitude_meters or 1000,
                            hero_image=d.hero_image,
                            is_curated=bool(d.is_featured)
                        ))
                        seen_slugs.add(clean_d_slug)
            except Exception as e:
                logger.warning(f"Database destination search error: {e}")

        # 4. If NO results found locally (unseeded / arbitrary destination), query geocoder with 6.0s timeout
        if len(results) == 0 or (len(results) < limit and not alias_res and not any(r.get("is_curated") for r in results)):
            try:
                geocoder = ProviderFactory.get_geocoding_provider()
                geo_results = await asyncio.wait_for(geocoder.autocomplete(clean_raw, limit=limit), timeout=1.2)
                for gr in (geo_results or []):
                    gr_slug = gr.get("canonical_slug") or gr.get("slug") or gr["name"].lower().replace(" ", "-")
                    if gr_slug not in seen_slugs and gr["name"].lower() not in [r["name"].lower() for r in results]:
                        gr["type"] = "destination"
                        gr["badge"] = "DESTINATION"
                        results.append(gr)
                        seen_slugs.add(gr_slug)
            except asyncio.TimeoutError:
                logger.info(f"Geocoding autocomplete timed out after 2.5s for '{clean_raw}', returning local matches")
            except Exception as e:
                logger.warning(f"Geocoding autocomplete fallback failed: {e}")

        return results[:limit]

    @staticmethod
    async def resolve_dynamic_destination(query: str) -> Optional[Dict[str, Any]]:
        """
        Dynamically geocodes an unseeded / searched destination (e.g. Delhi, Pune, Indore, etc.)
        and builds a transient live discovery payload WITHOUT saving to the database.
        """
        clean_query = DestinationIntelligenceService._clean_query(query)
        if not clean_query:
            return None

        clean_q = clean_query.lower().replace("-", " ")
        slug_norm = clean_query.lower().replace(" ", "-").replace(",", "").replace("'", "")

        # Check canonical registry first before calling unconstrained geocoders
        canon = next((
            d for d in CANONICAL_26_DESTINATIONS
            if d["slug"] == slug_norm
            or d["name"].lower() == clean_q
            or slug_norm in d["slug"]
            or clean_q in d["name"].lower()
        ), None)

        if canon:
            geo_data = {
                "name": canon["name"],
                "canonical_slug": canon["slug"],
                "slug": canon["slug"],
                "state": canon["state"],
                "country": "India",
                "region": canon["region"],
                "latitude": canon["latitude"],
                "longitude": canon["longitude"],
                "altitude_meters": canon["altitude_meters"],
                "display_name": f"{canon['name']}, {canon['state']}, India",
                "city": canon["name"],
            }
        else:
            geocoder = ProviderFactory.get_geocoding_provider()
            geo_data = await geocoder.geocode(clean_query)
            if not geo_data:
                logger.warning(f"Could not dynamically geocode '{clean_query}'")
                return None

        name = geo_data["name"]
        slug = geo_data.get("canonical_slug") or geo_data.get("slug") or clean_query.lower().replace(" ", "-")
        state = geo_data.get("state") or "Global"
        country = geo_data.get("country") or "India"
        region = geo_data.get("region") or f"{state}, {country}"
        lat = geo_data.get("latitude") if geo_data.get("latitude") is not None else geo_data.get("lat")
        lng = geo_data.get("longitude") if geo_data.get("longitude") is not None else geo_data.get("lng")
        if lat is None or lng is None:
            logger.warning(f"Geocoding result for '{clean_query}' missing valid coordinates.")
            return None
        altitude = geo_data.get("altitude_meters", 550)

        # Parallelize photography search and live weather forecast with timeout to keep response snappy
        image_provider = ProviderFactory.get_image_provider()
        weather_provider = ProviderFactory.get_weather_provider()

        async def fetch_images():
            try:
                return await asyncio.wait_for(image_provider.search_images(name), timeout=2.0)
            except Exception:
                return []

        async def fetch_weather():
            try:
                return await asyncio.wait_for(weather_provider.get_forecast(lat, lng, days=5), timeout=2.0)
            except Exception:
                return []

        images_task = asyncio.create_task(fetch_images())
        weather_task = asyncio.create_task(fetch_weather())
        images, forecasts = await asyncio.gather(images_task, weather_task)

        terrain_type = (
            "high_altitude" if altitude > 3000
            else ("mountain" if altitude > 1200
            else ("desert" if any(k in state.lower() for k in ["rajasthan", "gujarat"])
            else ("coastal" if any(k in state.lower() for k in ["goa", "kerala", "tamil nadu", "andhra"])
            else "forested_hills")))
        )

        visual_kind = "verified_photo"
        is_real_photo = True
        badge_label = "LIVE DESTINATION PHOTO"
        validation_status = "verified"

        if images:
            hero_image = images[0]
            hero_photo = images[0]
            hero_artwork = None
        else:
            try:
                creative_art = ProviderFactory.get_creative_art_provider()
                art_res = await asyncio.wait_for(
                    creative_art.generate_destination_art(
                        destination_name=name,
                        slug=slug,
                        terrain_type=terrain_type,
                        state=state,
                        elevation_meters=altitude
                    ),
                    timeout=2.0
                )
                hero_image = art_res.get("public_url") or "/images/destinations/fallbacks/himalayan.jpg"
                visual_kind = art_res.get("visual_kind", "terrain_fallback")
                is_real_photo = False
                badge_label = art_res.get("badge_label", "DESTINATION CATEGORY ART")
                validation_status = art_res.get("validation_status", "biome_fallback")
                hero_photo = None
                hero_artwork = hero_image
            except Exception as e:
                logger.warning(f"Failed to generate destination art for {name}: {e}")
                hero_image = "/images/destinations/fallbacks/himalayan.jpg"
                visual_kind = "terrain_fallback"
                is_real_photo = False
                badge_label = "DESTINATION CATEGORY ART"
                validation_status = "biome_fallback"
                hero_photo = None
                hero_artwork = hero_image

        # Honest dynamic tagline & description
        tagline = f"Live travel discovery and verified local points of interest in {name}."
        desc = f"{name} is located in {state}, {country} at {altitude}m elevation ({lat:.4f}°N, {lng:.4f}°E). Live weather, local eateries, attractions, and essentials are retrieved in real-time."

        weather_snapshots = []
        for fc in forecasts:
            try:
                f_date = fc["date"] if isinstance(fc["date"], str) else fc["date"].strftime("%Y-%m-%d")
            except Exception:
                f_date = str(date.today())

            weather_snapshots.append({
                "id": f"ws-{uuid.uuid4().hex[:8]}",
                "destination_id": f"dyn-{slug}",
                "forecast_date": f_date,
                "temp_c": fc.get("temp_c", 22.0),
                "condition": fc.get("condition", "Pleasant"),
                "is_rain": fc.get("is_rain", False),
                "humidity": fc.get("humidity", 50),
                "wind_kph": fc.get("wind_kph", 10.0),
                "advisory": fc.get("advisory", "Live weather forecast from Open-Meteo."),
                "icon": fc.get("icon", "sun"),
                "source": "live_open_meteo"
            })

        if not weather_snapshots:
            weather_snapshots.append({
                "id": f"ws-{uuid.uuid4().hex[:8]}",
                "destination_id": f"dyn-{slug}",
                "forecast_date": str(date.today()),
                "temp_c": 18.0 if altitude > 1500 else 24.0,
                "condition": "Partly Cloudy",
                "is_rain": False,
                "humidity": 45,
                "wind_kph": 12.0,
                "advisory": f"Estimated climate for {name} at {altitude}m elevation.",
                "icon": "cloud-sun",
                "source": "baseline_estimate"
            })

        display_name = geo_data.get("display_name") or f"{name}, {state}, {country}"

        return {
            "id": f"dyn-{slug}",
            "destination_id": f"dyn-{slug}",
            "name": name,
            "canonical_slug": slug,
            "slug": slug,
            "city": geo_data.get("city") or name,
            "display_name": display_name,
            "state": state,
            "country": country,
            "region": region,
            "tagline": tagline,
            "description": desc,
            "hero_image": hero_image,
            "hero_photo": hero_photo,
            "hero_artwork": hero_artwork,
            "illustration": hero_artwork or hero_image,
            "visual_kind": visual_kind,
            "is_real_photo": is_real_photo,
            "badge_label": badge_label,
            "validation_status": validation_status,
            "latitude": lat,
            "longitude": lng,
            "altitude_meters": altitude,
            "best_time_to_visit": "Check live local conditions",
            "weather_type": "Live Dynamic",
            "is_featured": False,
            "is_curated": False,
            "is_dynamic": True,
            "source": geo_data.get("source", "live_geocoding"),
            "weather": weather_snapshots,
            "places": [],
            "hotels": [],
            "rentals": [],
            "places_count": 0,
            "hotels_count": 0,
            "rentals_count": 0
        }

    @staticmethod
    async def _ensure_weather(dest: Destination, db: Session):
        snapshots = db.query(WeatherSnapshot).filter(WeatherSnapshot.destination_id == dest.id).all()
        if snapshots:
            return

        try:
            weather_provider = ProviderFactory.get_weather_provider()
            forecasts = await weather_provider.get_forecast(dest.latitude, dest.longitude, days=5)

            for fc in forecasts:
                try:
                    if isinstance(fc["date"], str):
                        f_date = datetime.strptime(fc["date"], "%Y-%m-%d").date()
                    else:
                        f_date = fc["date"]
                except Exception:
                    f_date = date.today()

                ws = WeatherSnapshot(
                    id=f"ws-{uuid.uuid4().hex[:8]}",
                    destination_id=dest.id,
                    forecast_date=f_date,
                    temp_c=fc["temp_c"],
                    condition=fc["condition"],
                    is_rain=fc["is_rain"],
                    humidity=fc.get("humidity", 50),
                    wind_kph=fc.get("wind_kph", 10.0),
                    advisory=fc.get("advisory", "Live mountain weather forecast from Open-Meteo."),
                    icon=fc.get("icon", "sun")
                )
                db.add(ws)
            db.commit()
        except Exception as e:
            logger.warning(f"Could not ensure weather for {dest.name}: {e}")
            db.rollback()
