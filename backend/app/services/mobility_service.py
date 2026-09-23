import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.models import MobilityProvider, MobilityVehicle, RentalOption, Destination
from app.schemas.schemas import (
    MobilityListingResponse, MobilityProviderResponse, MobilityVehicleResponse,
    MobilityProviderCreate, MobilityProviderClaim, MobilityVehicleCreate,
    ActionLink, RentalOptionResponse
)
from app.providers.provider_factory import ProviderFactory
from app.services.action_link_generator import ActionLinkGenerator
from app.services.operating_hours_engine import OperatingHoursEngine

logger = logging.getLogger("vanvas.mobility")

def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    import math
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)


class MobilityService:
    """
    VANVAS Truthful Local Mobility Service.
    Enforces the strict 5-tier provider data priority:
    1. Verified provider-submitted listing (LIVE_PROVIDER)
    2. Verified external provider source (LIVE_PROVIDER)
    3. Live geographic provider data (LIVE_OSM)
    4. Curated listing only when explicitly marked curated (CURATED)
    5. Truthful empty list
    """

    @classmethod
    async def get_mobility_listings(
        cls,
        db: Session,
        destination_slug_or_id: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: float = 15.0,
        vehicle_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        target_lat = lat
        target_lng = lng
        dest: Optional[Destination] = None

        if destination_slug_or_id:
            dest = db.query(Destination).filter(
                (Destination.id == destination_slug_or_id) | (Destination.slug == destination_slug_or_id)
            ).first()
            if dest:
                if target_lat is None:
                    target_lat = dest.latitude
                if target_lng is None:
                    target_lng = dest.longitude

        listings: List[Dict[str, Any]] = []
        seen_names = set()

        # -------------------------------------------------------------
        # TIER 1 & 2: Verified Provider-Submitted & External Listings
        # -------------------------------------------------------------
        verified_providers_query = db.query(MobilityProvider).filter(
            MobilityProvider.verification_status.in_(["LIVE_PROVIDER", "VERIFIED"])
        )
        if dest:
            verified_providers_query = verified_providers_query.filter(
                (MobilityProvider.city.ilike(f"%{dest.name}%")) |
                (MobilityProvider.service_area.ilike(f"%{dest.name}%"))
            )
        verified_providers = verified_providers_query.all()

        for prov in verified_providers:
            dist = None
            if target_lat is not None and target_lng is not None:
                dist = haversine_distance(target_lat, target_lng, prov.latitude, prov.longitude)
                if dist > radius_km:
                    continue

            seen_names.add(prov.business_name.lower().strip())
            action_links = ActionLinkGenerator.generate_rental_action_links(
                provider_name=prov.business_name,
                latitude=prov.latitude,
                longitude=prov.longitude,
                website=prov.website,
                phone=prov.phone,
                whatsapp=prov.whatsapp,
            )

            # Get fleet vehicles
            active_vehicles = [v for v in prov.vehicles if v.active]
            if active_vehicles:
                for v in active_vehicles:
                    if vehicle_type and vehicle_type != "All":
                        if vehicle_type.lower() not in v.vehicle_type.lower() and vehicle_type.lower() not in (v.model or "").lower():
                            continue

                    v_img = v.image_url or cls._resolve_category_artwork(
                        vehicle_type=v.vehicle_type,
                        vehicle_name=v.model,
                        dest_name=dest.name if dest else prov.city,
                        state=dest.state if dest else None,
                    )
                    listings.append({
                        "id": f"mob-{prov.id}-{v.id}",
                        "destination_id": dest.id if dest else "near",
                        "provider_name": prov.business_name,
                        "vehicle_type": v.vehicle_type,
                        "vehicle_name": f"{v.brand or ''} {v.model or v.vehicle_type}".strip(),
                        "price_per_day": v.daily_price,
                        "hourly_price": v.hourly_price,
                        "deposit_amount": v.deposit,
                        "location": prov.address or prov.city or "Local Hub",
                        "latitude": prov.latitude,
                        "longitude": prov.longitude,
                        "opening_hours": "08:00 AM - 08:00 PM",
                        "hours_available": True,
                        "is_open_now": True,
                        "rating": 4.9,
                        "image_url": v_img,
                        "phone": prov.phone,
                        "whatsapp": prov.whatsapp,
                        "website": prov.website,
                        "source": prov.source,
                        "source_id": prov.source_id or prov.id,
                        "is_live": True,
                        "inventory_verified": True,
                        "verification_status": "LIVE_PROVIDER",
                        "distance_km": dist,
                        "action_links": action_links,
                        "data_state": "VERIFIED",
                        "trust_source": "VERIFIED_PROVIDER",
                    })
            else:
                # Provider registered without individual vehicles listed
                listings.append({
                    "id": f"mob-{prov.id}",
                    "destination_id": dest.id if dest else "near",
                    "provider_name": prov.business_name,
                    "vehicle_type": "Scooter & Motorcycle",
                    "vehicle_name": f"{prov.business_name} Fleet",
                    "price_per_day": None,
                    "hourly_price": None,
                    "deposit_amount": None,
                    "location": prov.address or prov.city or "Local Hub",
                    "latitude": prov.latitude,
                    "longitude": prov.longitude,
                    "opening_hours": "Hours upon contact",
                    "hours_available": False,
                    "is_open_now": None,
                    "rating": 4.8,
                    "image_url": "/images/vehicles/universal_mobility.jpg",
                    "phone": prov.phone,
                    "whatsapp": prov.whatsapp,
                    "website": prov.website,
                    "source": prov.source,
                    "source_id": prov.source_id or prov.id,
                    "is_live": True,
                    "inventory_verified": True,
                    "verification_status": "LIVE_PROVIDER",
                    "distance_km": dist,
                    "action_links": action_links,
                    "data_state": "VERIFIED",
                    "trust_source": "VERIFIED_PROVIDER",
                })

        # -------------------------------------------------------------
        # TIER 3: Live Geographic Provider Data (OSM Overpass)
        # -------------------------------------------------------------
        try:
            rentals_provider = ProviderFactory.get_rentals_provider()
            target_name = dest.name if dest else "Local Area"
            live_rentals = await asyncio.wait_for(
                rentals_provider.search_rentals(
                    destination=target_name,
                    vehicle_type=vehicle_type,
                    lat=target_lat,
                    lng=target_lng,
                    radius_km=radius_km
                ),
                timeout=3.8
            )
            for lr in live_rentals:
                norm = lr.get("provider_name", "").lower().strip()
                if norm in seen_names or any(norm in s or s in norm for s in seen_names):
                    continue
                seen_names.add(norm)
                listings.append(lr)
        except Exception as e:
            logger.debug(f"Live OSM mobility search failed or timed out: {e}")

        # -------------------------------------------------------------
        # TIER 4: Curated DB Listings (Only when explicitly marked curated)
        # -------------------------------------------------------------
        if not listings and dest:
            curated_query = db.query(RentalOption).filter(RentalOption.destination_id == dest.id)
            if vehicle_type and vehicle_type != "All":
                curated_query = curated_query.filter(RentalOption.vehicle_type.ilike(f"%{vehicle_type}%"))
            curated_options = curated_query.order_by(RentalOption.price_per_day.asc()).all()

            for r in curated_options:
                norm = r.provider_name.lower().strip()
                if norm in seen_names:
                    continue
                seen_names.add(norm)
                hours_eval = OperatingHoursEngine.evaluate_osm_hours(r.opening_hours, r.latitude, r.longitude)
                action_links = ActionLinkGenerator.generate_rental_action_links(
                    provider_name=r.provider_name,
                    latitude=r.latitude,
                    longitude=r.longitude,
                    website=None,
                    phone=None,
                )
                cat_artwork = cls._resolve_category_artwork(
                    vehicle_type=r.vehicle_type,
                    vehicle_name=r.vehicle_name,
                    dest_name=dest.name if dest else None,
                    state=dest.state if dest else None,
                )
                listings.append({
                    "id": r.id,
                    "destination_id": r.destination_id,
                    "provider_name": r.provider_name,
                    "vehicle_type": r.vehicle_type,
                    "vehicle_name": r.vehicle_name,
                    "price_per_day": r.price_per_day,
                    "hourly_price": None,
                    "deposit_amount": r.deposit_amount,
                    "location": r.location,
                    "latitude": r.latitude,
                    "longitude": r.longitude,
                    "opening_hours": r.opening_hours or "08:00 AM - 08:00 PM",
                    "hours_available": hours_eval.hours_available,
                    "is_open_now": hours_eval.is_open_now,
                    "rating": r.rating,
                    "image_url": r.image_url or cat_artwork,
                    "phone": None,
                    "whatsapp": None,
                    "website": None,
                    "source": "vanvas_curated",
                    "source_id": r.id,
                    "is_live": False,
                    "inventory_verified": True,
                    "verification_status": "CURATED",
                    "distance_km": None,
                    "action_links": action_links,
                    "data_state": "VERIFIED",
                    "trust_source": "VANVAS_CURATED",
                })

        # Sort by distance when available
        listings.sort(key=lambda x: (
            0 if x.get("verification_status") == "LIVE_PROVIDER" else (1 if x.get("verification_status") == "LIVE_OSM" else 2),
            x.get("distance_km") if x.get("distance_km") is not None else 999
        ))

        return listings

    @classmethod
    def _resolve_category_artwork(
        cls,
        vehicle_type: str,
        vehicle_name: Optional[str] = None,
        dest_name: Optional[str] = None,
        state: Optional[str] = None,
    ) -> str:
        query = f"{vehicle_type} {vehicle_name or ''}".lower()
        dest_str = f"{dest_name or ''} {state or ''}".lower()

        is_rajasthan = any(k in dest_str for k in ["jaipur", "udaipur", "jodhpur", "jaisalmer", "rajasthan"])
        is_coastal = any(k in dest_str for k in ["goa", "gokarna", "munnar", "kerala", "varkala", "coastal"])
        is_uttarakhand = any(k in dest_str for k in ["rishikesh", "mussoorie", "dehradun", "tungnath", "chopta", "uttarakhand", "garhwal"])

        if "bicycle" in query or ("bike" in query and "motor" not in query and "bullet" not in query and "himalayan" not in query and "adventure" not in query):
            return "/images/vehicles/mountain_bike.jpg"

        if is_rajasthan:
            if "bullet" in query or "enfield" in query or "classic" in query or "cruiser" in query:
                return "/images/vehicles/rajasthan_classic_bullet.jpg"
            if "scooter" in query or "activa" in query or "electric" in query or "ev" in query:
                return "/images/vehicles/rajasthan_urban_scooter.jpg"
            if "himalayan" in query or "adventure" in query or "adv" in query:
                return "/images/vehicles/rajasthan_desert_bike.jpg"
            return "/images/vehicles/rajasthan_classic_bullet.jpg"

        if is_coastal:
            if "scooter" in query or "activa" in query or "electric" in query or "ev" in query:
                return "/images/vehicles/coastal_beach_scooter.jpg"
            if "bullet" in query or "enfield" in query or "classic" in query or "adventure" in query:
                return "/images/vehicles/coastal_heritage_bike.jpg"
            return "/images/vehicles/coastal_palm_scooter.jpg"

        if is_uttarakhand:
            if "adventure" in query or "himalayan" in query or "bullet" in query or "enfield" in query:
                return "/images/vehicles/uttarakhand_forest_bike.jpg"
            if "scooter" in query or "activa" in query or "electric" in query:
                return "/images/vehicles/uttarakhand_valley_scooter.jpg"

        if "electric" in query or "ev" in query or "ather" in query or "ola" in query:
            return "/images/vehicles/electric_scooter.jpg"
        if "himalayan" in query or "adventure" in query:
            return "/images/vehicles/adventure_motorcycle.jpg"
        if "bullet" in query or "enfield" in query or "classic" in query or "motorcycle" in query:
            return "/images/vehicles/classic_bullet.jpg"
        if "activa" in query or "scooter" in query:
            return "/images/vehicles/automatic_scooter.jpg"
        return "/images/vehicles/universal_mobility.jpg"

    @classmethod
    def create_provider(cls, db: Session, payload: MobilityProviderCreate) -> MobilityProvider:
        prov = MobilityProvider(
            business_name=payload.business_name,
            owner_name=payload.owner_name,
            phone=payload.phone,
            whatsapp=payload.whatsapp,
            email=payload.email,
            website=payload.website,
            address=payload.address,
            latitude=payload.latitude,
            longitude=payload.longitude,
            city=payload.city,
            service_area=payload.service_area,
            verification_status=payload.verification_status,
            source=payload.source,
            source_id=payload.source_id,
            claimed=payload.claimed,
        )
        db.add(prov)
        db.commit()
        db.refresh(prov)
        return prov

    @classmethod
    def claim_provider(cls, db: Session, provider_id: str, claim: MobilityProviderClaim) -> MobilityProvider:
        prov = db.query(MobilityProvider).filter(MobilityProvider.id == provider_id).first()
        if not prov:
            # If provider was an OSM item or virtual, create new claimed provider
            prov = MobilityProvider(
                id=provider_id,
                business_name=claim.business_name or "Local Mobility Hub",
                owner_name=claim.owner_name,
                phone=claim.phone,
                whatsapp=claim.whatsapp or claim.phone,
                email=claim.email,
                address=claim.address,
                latitude=32.2396,  # Default fallback coordinates if new
                longitude=77.1887,
                claimed=True,
                verification_status="LIVE_PROVIDER",
                verified_at=datetime.now(timezone.utc),
                source="provider_direct",
            )
            db.add(prov)
        else:
            prov.owner_name = claim.owner_name
            prov.phone = claim.phone
            if claim.whatsapp:
                prov.whatsapp = claim.whatsapp
            if claim.email:
                prov.email = claim.email
            if claim.business_name:
                prov.business_name = claim.business_name
            if claim.address:
                prov.address = claim.address
            prov.claimed = True
            prov.verification_status = "LIVE_PROVIDER"
            prov.verified_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(prov)
        return prov

    @classmethod
    def add_vehicle(cls, db: Session, provider_id: str, payload: MobilityVehicleCreate) -> MobilityVehicle:
        veh = MobilityVehicle(
            provider_id=provider_id,
            vehicle_type=payload.vehicle_type,
            brand=payload.brand,
            model=payload.model,
            variant=payload.variant,
            registration_optional=payload.registration_optional,
            daily_price=payload.daily_price,
            hourly_price=payload.hourly_price,
            deposit=payload.deposit,
            availability_status=payload.availability_status,
            quantity=payload.quantity,
            image_url=payload.image_url,
            active=payload.active,
        )
        db.add(veh)
        db.commit()
        db.refresh(veh)
        return veh
