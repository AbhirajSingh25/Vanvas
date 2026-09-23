import re
import uuid
import asyncio
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.models import Destination, Place, Hotel, RentalOption, WeatherSnapshot
from app.providers.provider_factory import ProviderFactory

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
        """
        clean_raw = DestinationIntelligenceService._clean_query(query)
        if not clean_raw:
            return None

        clean_q = clean_raw.lower().replace("-", " ")
        slug = clean_raw.lower().replace(" ", "-").replace(",", "").replace("'", "")

        # 1. Exact match by id, slug, or name
        dest = db.query(Destination).filter(
            (Destination.id == query.strip()) |
            (Destination.id == f"dest-{slug}") |
            (Destination.slug == slug) |
            (Destination.name.ilike(clean_q))
        ).first()

        # 2. Prefix match for curated destinations
        if not dest:
            dest = db.query(Destination).filter(
                (Destination.name.ilike(f"{clean_q}%")) |
                (Destination.slug.ilike(f"{slug}%"))
            ).first()

        if dest:
            return dest

        return None

    @staticmethod
    async def resolve_dynamic_destination(query: str) -> Optional[Dict[str, Any]]:
        """
        Dynamically geocodes an unseeded / searched destination (e.g. Delhi, Pune, Indore, etc.)
        and builds a transient live discovery payload WITHOUT saving to the database.
        """
        clean_query = DestinationIntelligenceService._clean_query(query)
        if not clean_query:
            return None

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
