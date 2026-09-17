import re
import uuid
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.models import Destination, Place, Hotel, RentalOption, WeatherSnapshot
from app.providers.provider_factory import ProviderFactory

logger = logging.getLogger("vanvas.intelligence")

class DestinationIntelligenceService:
    @staticmethod
    async def resolve_destination(query: str, db: Session) -> Optional[Destination]:
        """
        Looks up an approved curated destination from the database.
        Never inserts dynamic search results into the database.
        """
        clean_q = query.strip().lower().replace("-", " ")
        slug = query.strip().lower().replace(" ", "-").replace(",", "").replace("'", "")

        # 1. Exact match by slug or name
        dest = db.query(Destination).filter(
            (Destination.slug == slug) |
            (Destination.name.ilike(clean_q))
        ).first()

        # 2. Prefix match for curated destinations
        if not dest:
            dest = db.query(Destination).filter(
                (Destination.name.ilike(f"{clean_q}%")) |
                (Destination.slug.ilike(f"{clean_q.replace(' ', '-')}%"))
            ).first()

        if dest:
            return dest

        return None

    @staticmethod
    async def resolve_dynamic_destination(query: str) -> Optional[Dict[str, Any]]:
        """
        Dynamically geocodes an unseeded / searched destination (e.g. Indore, London, etc.)
        and builds a transient live discovery payload WITHOUT saving to the database.
        """
        geocoder = ProviderFactory.get_geocoding_provider()
        geo_data = await geocoder.geocode(query)
        if not geo_data:
            logger.warning(f"Could not dynamically geocode '{query}'")
            return None

        name = geo_data["name"]
        slug = geo_data.get("slug") or query.strip().lower().replace(" ", "-")
        state = geo_data.get("state") or "Global"
        country = geo_data.get("country") or "India"
        region = geo_data.get("region") or f"{state}, {country}"
        lat = geo_data.get("lat", 22.7196)
        lng = geo_data.get("lng", 75.8577)
        altitude = geo_data.get("altitude_meters", 550)

        # High-res photography mapping with regional fallback
        image_provider = ProviderFactory.get_image_provider()
        images = await image_provider.search_images(name)
        hero_image = images[0] if images else "/images/destinations/fallbacks/himalayan.jpg"

        # Honest dynamic tagline & description
        tagline = f"Live travel discovery and verified local points of interest in {name}."
        desc = f"{name} is located in {state}, {country} at {altitude}m elevation ({lat:.4f}°N, {lng:.4f}°E). Live weather, local eateries, attractions, and essentials are retrieved in real-time."

        # Live weather forecast directly from Open-Meteo
        weather_provider = ProviderFactory.get_weather_provider()
        forecasts = await weather_provider.get_forecast(lat, lng, days=5)

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

        return {
            "id": f"dyn-{slug}",
            "name": name,
            "slug": slug,
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
            "source": "live_geocoding",
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
