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
        Fast, resilient autocomplete search:
        1. Resolves aliases instantly (e.g. 'Banaras' -> Varanasi, 'Chopta' -> Tungnath-Chandrashila).
        2. Matches in-memory Canonical Destinations and active database destinations.
        3. If matches < limit, queries Photon geocoder with a strict 1.5s timeout.
        Guarantees sub-10ms response for known destinations and never leaves a hanging spinner.
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
            matched_alias: Optional[str] = None
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
                "place_type": "city",
                "type": "city",
                "altitude_meters": altitude_meters,
                "hindi_name": hindi_name,
                "hero_image": hero_image,
                "matched_alias": matched_alias,
                "source": "curated" if is_curated else "database",
                "is_curated": is_curated,
                "is_dynamic": not is_curated
            }

        from app.services.destination_aliases import resolve_alias_to_slug, DESTINATION_ALIASES

        # 1. Check exact or prefix alias match
        alias_res = resolve_alias_to_slug(clean_raw)
        if alias_res:
            target_slug, alias_display = alias_res
            # Find in Canonical 26
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

        # 4. If NO results found locally (unseeded / arbitrary destination), query live geocoder with strict 1.5s timeout
        if len(results) == 0:
            try:
                geocoder = ProviderFactory.get_geocoding_provider()
                geo_results = await asyncio.wait_for(geocoder.autocomplete(clean_raw, limit=limit), timeout=1.5)
                for gr in (geo_results or []):
                    gr_slug = gr.get("canonical_slug") or gr.get("slug") or gr["name"].lower().replace(" ", "-")
                    if gr_slug not in seen_slugs and gr["name"].lower() not in [r["name"].lower() for r in results]:
                        results.append(gr)
                        seen_slugs.add(gr_slug)
            except asyncio.TimeoutError:
                logger.info(f"Geocoding autocomplete timed out after 1.5s for '{clean_raw}', returning local matches")
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

        hero_image = images[0] if images else "/images/destinations/fallbacks/himalayan.jpg"

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
