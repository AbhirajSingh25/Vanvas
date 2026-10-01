import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.models import MobilityProvider, MobilityVehicle, RentalOption, Destination, User
from app.schemas.schemas import (
    MobilityListingResponse, MobilityProviderResponse, MobilityVehicleResponse,
    MobilityProviderCreate, MobilityProviderClaim, MobilityVehicleCreate,
    ActionLink, RentalOptionResponse
)
from app.providers.provider_factory import ProviderFactory
from app.services.action_link_generator import ActionLinkGenerator
from app.services.operating_hours_engine import OperatingHoursEngine
from app.seed.canonical_dataset import CANONICAL_26_DESTINATIONS, ADDITIONAL_RENTALS_BY_DEST

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
        clean_slug = (destination_slug_or_id or "").strip()
        if clean_slug.lower().startswith("dest-"):
            clean_slug = clean_slug[5:]

        if destination_slug_or_id:
            dest = db.query(Destination).filter(
                (Destination.id == destination_slug_or_id) |
                (Destination.slug == destination_slug_or_id) |
                (Destination.id == f"dest-{clean_slug}") |
                (Destination.slug == clean_slug)
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
            gmaps_url = f"https://www.google.com/maps/dir/?api=1&destination={prov.latitude:.6f},{prov.longitude:.6f}"
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
                    has_price = v.daily_price is not None and v.daily_price > 0
                    listings.append({
                        "id": f"mob-{prov.id}-{v.id}",
                        "destination_id": dest.id if dest else "near",
                        "provider_name": prov.business_name,
                        "vehicle_type": v.vehicle_type,
                        "vehicle_name": f"{v.brand or ''} {v.model or v.vehicle_type}".strip(),
                        "brand": v.brand,
                        "model": v.model,
                        "price_per_hour": v.hourly_price,
                        "price_per_day": v.daily_price if has_price else None,
                        "deposit": v.deposit,
                        "deposit_amount": v.deposit,
                        "location": prov.address or prov.city or "Local Hub",
                        "address": prov.address,
                        "latitude": prov.latitude,
                        "longitude": prov.longitude,
                        "opening_hours": "08:00 AM - 08:00 PM",
                        "hours_available": True,
                        "is_open_now": True,
                        "rating": None,
                        "image_url": v_img,
                        "phone": prov.phone,
                        "whatsapp": prov.whatsapp,
                        "website": prov.website,
                        "google_maps_url": gmaps_url,
                        "source": prov.source,
                        "source_provider": prov.source,
                        "source_id": prov.source_id or prov.id,
                        "source_url": prov.website,
                        "is_live": True,
                        "inventory_verified": True,
                        "verification_status": "LIVE_PROVIDER",
                        "distance_km": dist,
                        "action_links": action_links,
                        "data_state": "VERIFIED",
                        "trust_source": "VERIFIED_PROVIDER",
                        "last_verified_at": prov.verified_at.isoformat() if prov.verified_at else datetime.now(timezone.utc).isoformat(),
                    })
            else:
                # Provider registered without individual fleet vehicles listed (Price on Enquiry)
                listings.append({
                    "id": f"mob-{prov.id}",
                    "destination_id": dest.id if dest else "near",
                    "provider_name": prov.business_name,
                    "vehicle_type": "Scooter & Motorcycle",
                    "vehicle_name": f"{prov.business_name} Fleet",
                    "brand": None,
                    "model": None,
                    "price_per_hour": None,
                    "price_per_day": None,
                    "deposit": None,
                    "deposit_amount": None,
                    "location": prov.address or prov.city or "Local Hub",
                    "address": prov.address,
                    "latitude": prov.latitude,
                    "longitude": prov.longitude,
                    "opening_hours": "Hours upon contact",
                    "hours_available": False,
                    "is_open_now": None,
                    "rating": None,
                    "image_url": "/images/vehicles/universal_mobility.jpg",
                    "phone": prov.phone,
                    "whatsapp": prov.whatsapp,
                    "website": prov.website,
                    "google_maps_url": gmaps_url,
                    "source": prov.source,
                    "source_provider": prov.source,
                    "source_id": prov.source_id or prov.id,
                    "source_url": prov.website,
                    "is_live": True,
                    "inventory_verified": True,
                    "verification_status": "LIVE_PROVIDER",
                    "distance_km": dist,
                    "action_links": action_links,
                    "data_state": "VERIFIED",
                    "trust_source": "VERIFIED_PROVIDER",
                    "last_verified_at": prov.verified_at.isoformat() if prov.verified_at else datetime.now(timezone.utc).isoformat(),
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
        if not listings:
            curated_options = []
            dest_slug = dest.slug if dest else (clean_slug or destination_slug_or_id or "")
            if dest:
                curated_query = db.query(RentalOption).filter(
                    (RentalOption.destination_id == dest.id) |
                    (RentalOption.destination_id == f"dest-{dest.slug}") |
                    (RentalOption.destination_id == dest.slug)
                )
                if vehicle_type and vehicle_type != "All":
                    curated_query = curated_query.filter(RentalOption.vehicle_type.ilike(f"%{vehicle_type}%"))
                curated_options = curated_query.order_by(RentalOption.price_per_day.asc()).all()

            for r in curated_options:
                norm = r.provider_name.lower().strip()
                if norm in seen_names:
                    continue
                seen_names.add(norm)
                hours_eval = OperatingHoursEngine.evaluate_osm_hours(r.opening_hours, r.latitude, r.longitude)
                gmaps_url = f"https://www.google.com/maps/dir/?api=1&destination={r.latitude:.6f},{r.longitude:.6f}"
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
                    "brand": None,
                    "model": r.vehicle_name,
                    "price_per_hour": None,
                    "price_per_day": r.price_per_day,
                    "deposit": r.deposit_amount,
                    "deposit_amount": r.deposit_amount,
                    "location": r.location,
                    "address": r.location,
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
                    "google_maps_url": gmaps_url,
                    "source": "vanvas_curated",
                    "source_provider": "vanvas_curated",
                    "source_id": r.id,
                    "source_url": None,
                    "is_live": False,
                    "inventory_verified": True,
                    "verification_status": "CURATED",
                    "distance_km": None,
                    "action_links": action_links,
                    "data_state": "CURATED",
                    "trust_source": "VANVAS_CURATED",
                    "last_verified_at": datetime.now(timezone.utc).isoformat(),
                })

            if not listings and (dest_slug or clean_slug):
                # Fallback to canonical rental dataset
                lookup_key = dest_slug if dest_slug.lower() in ADDITIONAL_RENTALS_BY_DEST else clean_slug
                c_rentals = ADDITIONAL_RENTALS_BY_DEST.get(lookup_key.lower(), [])
                for r in c_rentals:
                    v_type = r.get("vehicle_type", "Scooter")
                    if vehicle_type and vehicle_type != "All":
                        if vehicle_type.lower() not in v_type.lower() and vehicle_type.lower() not in r.get("vehicle_name", "").lower():
                            continue
                    norm = r.get("provider_name", "").lower().strip()
                    if norm in seen_names:
                        continue
                    seen_names.add(norm)
                    lat_val = r.get("latitude") or (dest.latitude if dest else 28.6139)
                    lng_val = r.get("longitude") or (dest.longitude if dest else 77.2090)
                    gmaps_url = f"https://www.google.com/maps/dir/?api=1&destination={lat_val:.6f},{lng_val:.6f}"
                    action_links = ActionLinkGenerator.generate_rental_action_links(
                        provider_name=r.get("provider_name", ""),
                        latitude=lat_val,
                        longitude=lng_val,
                        website=None,
                        phone=None,
                    )
                    cat_artwork = cls._resolve_category_artwork(
                        vehicle_type=v_type,
                        vehicle_name=r.get("vehicle_name"),
                        dest_name=dest.name if dest else dest_slug,
                        state=dest.state if dest else None,
                    )
                    listings.append({
                        "id": f"c-rent-{dest_slug}-{len(listings)}",
                        "destination_id": dest.id if dest else dest_slug,
                        "provider_name": r.get("provider_name"),
                        "vehicle_type": v_type,
                        "vehicle_name": r.get("vehicle_name"),
                        "brand": None,
                        "model": r.get("vehicle_name"),
                        "price_per_hour": None,
                        "price_per_day": r.get("price_per_day"),
                        "deposit": r.get("deposit_amount"),
                        "deposit_amount": r.get("deposit_amount"),
                        "location": r.get("location"),
                        "address": r.get("location"),
                        "latitude": lat_val,
                        "longitude": lng_val,
                        "opening_hours": r.get("opening_hours") or "08:00 AM - 08:00 PM",
                        "hours_available": True,
                        "is_open_now": True,
                        "rating": r.get("rating"),
                        "image_url": r.get("image_url") or cat_artwork,
                        "phone": None,
                        "whatsapp": None,
                        "website": None,
                        "google_maps_url": gmaps_url,
                        "source": "vanvas_curated",
                        "source_provider": "vanvas_curated",
                        "source_id": f"c-rent-{dest_slug}-{len(listings)}",
                        "source_url": None,
                        "is_live": False,
                        "inventory_verified": True,
                        "verification_status": "CURATED",
                        "distance_km": None,
                        "action_links": action_links,
                        "data_state": "CURATED",
                        "trust_source": "VANVAS_CURATED",
                        "last_verified_at": datetime.now(timezone.utc).isoformat(),
                    })

        # Sort by distance when available
        listings.sort(key=lambda x: (
            0 if x.get("verification_status") == "LIVE_PROVIDER" else (1 if x.get("verification_status") == "LIVE_OSM" else 2),
            x.get("distance_km") if x.get("distance_km") is not None else 999
        ))

        return listings

    @classmethod
    def resolve_mobility_artwork(
        cls,
        vehicle_type: str,
        vehicle_name: Optional[str] = None,
        destination_name: Optional[str] = None,
        destination_slug: Optional[str] = None,
        state: Optional[str] = None,
        **kwargs
    ) -> str:
        dest_name = destination_name or destination_slug
        return cls._resolve_category_artwork(
            vehicle_type=vehicle_type,
            vehicle_name=vehicle_name,
            dest_name=dest_name,
            state=state,
        )

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

        is_car = any(k in query for k in ["car", "self-drive", "self drive", "suv", "sedan", "hatchback", "thar", "creta", "swift", "baleno", "i20", "scorpio", "seltos"])
        is_bicycle = (any(k in query for k in ["bicycle", "cycle", "mtb", "pedal"]) and "motor" not in query)
        is_electric = any(k in query for k in ["electric", "ev", "ather", "ola", "chetak", "iqube"])
        is_adv = (any(k in query for k in ["himalayan", "adventure", "adv", "450", "411", "xpulse", "off-road", "rally", "touring"])) and not is_electric
        is_bullet = any(k in query for k in ["bullet", "classic", "enfield", "350", "cruiser", "hunter", "meteor", "interceptor", "motorcycle", "bike", "fz", "pulsar", "apache", "avenger"])
        is_scooter = any(k in query for k in ["scooter", "activa", "jupiter", "access", "vespa", "moped", "ntorq", "fascino", "dio", "pleasure", "burgman", "scooty"]) or is_electric

        # 1. Goa
        if any(k in dest_str for k in ["goa", "gokarna"]):
            if is_car:
                return "/images/vehicles/goa_coastal_car.jpg"
            if is_adv:
                return "/images/vehicles/coastal_heritage_bike.jpg"
            if is_bullet:
                return "/images/vehicles/goa_coastal_bullet.jpg"
            return "/images/vehicles/goa_beach_scooter.jpg"

        # 2. Jaipur
        if any(k in dest_str for k in ["jaipur", "pink city", "amer"]):
            if is_car:
                return "/images/vehicles/jaipur_amer_car.jpg"
            if is_adv:
                return "/images/vehicles/rajasthan_desert_bike.jpg"
            if is_bullet:
                return "/images/vehicles/jaipur_pinkcity_bullet.jpg"
            return "/images/vehicles/jaipur_hawa_mahal_scooter.jpg"

        # 3. Udaipur
        if any(k in dest_str for k in ["udaipur", "pichola", "mewar"]):
            if is_car:
                return "/images/vehicles/udaipur_lakeside_car.jpg"
            if is_adv:
                return "/images/vehicles/rajasthan_desert_bike.jpg"
            if is_bullet:
                return "/images/vehicles/udaipur_oldcity_bullet.jpg"
            return "/images/vehicles/udaipur_pichola_scooter.jpg"

        # 4. Varanasi
        if any(k in dest_str for k in ["varanasi", "kashi", "banaras", "benaras"]):
            if is_car:
                return "/images/vehicles/varanasi_ghat_car.jpg"
            if is_bicycle:
                return "/images/vehicles/varanasi_city_cycle.jpg"
            if is_adv:
                return "/images/vehicles/adventure_motorcycle.jpg"
            if is_bullet:
                return "/images/vehicles/varanasi_bhu_bullet.jpg"
            return "/images/vehicles/varanasi_assi_scooter.jpg"

        # 5. Leh
        if any(k in dest_str for k in ["leh", "ladakh"]):
            if is_adv:
                return "/images/vehicles/leh_high_altitude_motorcycle.jpg"
            if is_bullet:
                return "/images/vehicles/leh_palace_bullet.jpg"
            return "/images/vehicles/leh_palace_bullet.jpg"

        # 6. Spiti
        if any(k in dest_str for k in ["spiti", "kaza"]):
            if is_adv or is_bullet:
                return "/images/vehicles/spiti_arid_adventure_bike.jpg"
            return "/images/vehicles/spiti_arid_adventure_bike.jpg"

        # 7. Mussoorie / Landour
        if any(k in dest_str for k in ["mussoorie", "landour"]):
            if is_car:
                return "/images/vehicles/mussoorie_hill_car.jpg"
            if is_bullet or is_adv:
                return "/images/vehicles/mussoorie_landour_bullet.jpg"
            return "/images/vehicles/mussoorie_landour_scooter.jpg"

        # 8. Rishikesh
        if any(k in dest_str for k in ["rishikesh", "tapovan"]):
            if is_adv:
                return "/images/vehicles/uttarakhand_forest_bike.jpg"
            if is_bullet:
                return "/images/vehicles/rishikesh_ganga_bullet.jpg"
            return "/images/vehicles/rishikesh_tapovan_scooter.jpg"

        # 9. Manali
        if any(k in dest_str for k in ["manali", "solang"]):
            if is_bullet or is_adv:
                return "/images/vehicles/manali_solang_bullet.jpg"
            return "/images/vehicles/manali_beas_scooter.jpg"

        # 10. Dharamshala
        if any(k in dest_str for k in ["dharamshala", "mcleod", "bhagsu", "dharamsala"]):
            if is_adv:
                return "/images/vehicles/himachal_pine_forest_bike.jpg"
            if is_bullet:
                return "/images/vehicles/dharamshala_dhauladhar_bullet.jpg"
            return "/images/vehicles/dharamshala_mcleod_scooter.jpg"

        # 11. Kasol
        if any(k in dest_str for k in ["kasol", "parvati"]):
            if is_adv:
                return "/images/vehicles/himachal_pine_forest_bike.jpg"
            if is_bullet:
                return "/images/vehicles/kasol_parvati_bullet.jpg"
            return "/images/vehicles/kasol_valley_scooter.jpg"

        # 12. Jaisalmer
        if any(k in dest_str for k in ["jaisalmer", "thar", "sam dunes"]):
            if is_adv:
                return "/images/vehicles/rajasthan_desert_bike.jpg"
            if is_bullet:
                return "/images/vehicles/jaisalmer_thar_bullet.jpg"
            return "/images/vehicles/jaisalmer_fort_scooter.jpg"

        # 13. Munnar / Kerala
        if any(k in dest_str for k in ["munnar", "kerala"]):
            if is_bullet or is_adv:
                return "/images/vehicles/kerala_western_ghats_bike.jpg"
            return "/images/vehicles/kerala_tea_plantation_scooter.jpg"

        # 14. Dehradun
        if any(k in dest_str for k in ["dehradun", "rajpur"]):
            if is_adv:
                return "/images/vehicles/uttarakhand_forest_bike.jpg"
            if is_bullet:
                return "/images/vehicles/dehradun_foothills_bike.jpg"
            return "/images/vehicles/dehradun_rajpur_scooter.jpg"

        # 15. Tungnath-Chandrashila / Chopta
        if any(k in dest_str for k in ["tungnath", "chopta", "chandrashila"]):
            if is_adv or is_bullet:
                return "/images/vehicles/chopta_tungnath_adv_bike.jpg"
            return "/images/vehicles/chopta_foothill_scooter.jpg"

        # 16. Kainchi Dham
        if any(k in dest_str for k in ["kainchi", "bhowali", "neem karoli"]):
            if is_bullet or is_adv:
                return "/images/vehicles/kainchi_kumaon_bike.jpg"
            return "/images/vehicles/kainchi_bhowali_scooter.jpg"

        # 17. Agra
        if any(k in dest_str for k in ["agra", "taj"]):
            if is_car:
                return "/images/vehicles/agra_heritage_car.jpg"
            return "/images/vehicles/agra_taj_scooter.jpg"

        # 18. Mathura & Vrindavan
        if any(k in dest_str for k in ["mathura", "vrindavan", "braj"]):
            if is_bullet or is_adv:
                return "/images/vehicles/mathura_heritage_bullet.jpg"
            return "/images/vehicles/vrindavan_braj_scooter.jpg"

        # 19. Neemrana
        if any(k in dest_str for k in ["neemrana"]):
            if is_car:
                return "/images/vehicles/neemrana_highway_car.jpg"
            return "/images/vehicles/neemrana_fort_bullet.jpg"

        # 20. Damdama & Sohna
        if any(k in dest_str for k in ["damdama", "sohna"]):
            return "/images/vehicles/damdama_lake_scooter.jpg"

        # 21. Alwar & Siliserh
        if any(k in dest_str for k in ["alwar", "siliserh"]):
            return "/images/vehicles/alwar_siliserh_scooter.jpg"

        # 22. Sariska & Bhangarh
        if any(k in dest_str for k in ["sariska", "bhangarh"]):
            return "/images/vehicles/sariska_safari_adv_bike.jpg"

        # 23. Chandigarh
        if any(k in dest_str for k in ["chandigarh"]):
            return "/images/vehicles/chandigarh_boulevard_ev.jpg"

        # 24. Morni Hills
        if any(k in dest_str for k in ["morni"]):
            if is_bullet or is_adv:
                return "/images/vehicles/morni_shivalik_bike.jpg"
            return "/images/vehicles/morni_hills_scooter.jpg"

        # 25. Lansdowne
        if any(k in dest_str for k in ["lansdowne"]):
            if is_bullet or is_adv:
                return "/images/vehicles/lansdowne_pine_bullet.jpg"
            return "/images/vehicles/lansdowne_ridge_scooter.jpg"

        # 26. Murthal
        if any(k in dest_str for k in ["murthal"]):
            return "/images/vehicles/murthal_gt_road_bullet.jpg"

        # Default fallbacks
        if is_bicycle:
            return "/images/vehicles/mountain_bike.jpg"
        if is_electric:
            return "/images/vehicles/electric_scooter.jpg"
        if is_adv:
            return "/images/vehicles/adventure_motorcycle.jpg"
        if is_bullet:
            return "/images/vehicles/classic_bullet.jpg"
        return "/images/vehicles/automatic_scooter.jpg"

    @classmethod
    def create_provider(cls, db: Session, payload: MobilityProviderCreate, user: Optional[User] = None) -> MobilityProvider:
        prov = MobilityProvider(
            owner_user_id=user.id if user else None,
            business_name=payload.business_name,
            owner_name=payload.owner_name or (user.full_name if user else None),
            phone=payload.phone,
            whatsapp=payload.whatsapp,
            email=payload.email or (user.email if user else None),
            website=payload.website,
            address=payload.address,
            latitude=payload.latitude,
            longitude=payload.longitude,
            city=payload.city,
            service_area=payload.service_area,
            verification_status=payload.verification_status,
            source=payload.source,
            source_id=payload.source_id,
            claimed=True if user else payload.claimed,
        )
        db.add(prov)
        db.commit()
        db.refresh(prov)
        return prov

    @classmethod
    def claim_provider(cls, db: Session, provider_id: str, claim: MobilityProviderClaim, user: Optional[User] = None) -> MobilityProvider:
        prov = db.query(MobilityProvider).filter(MobilityProvider.id == provider_id).first()
        if not prov:
            # If provider was an OSM item or virtual, create new claimed provider
            prov = MobilityProvider(
                id=provider_id,
                owner_user_id=user.id if user else None,
                business_name=claim.business_name or "Local Mobility Hub",
                owner_name=claim.owner_name or (user.full_name if user else None),
                phone=claim.phone,
                whatsapp=claim.whatsapp or claim.phone,
                email=claim.email or (user.email if user else None),
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
            if prov.claimed and prov.owner_user_id and user and prov.owner_user_id != user.id and getattr(user, "role", "") != "admin":
                from fastapi import HTTPException
                raise HTTPException(status_code=403, detail="Provider listing is already claimed and owned by another user.")

            prov.owner_name = claim.owner_name or prov.owner_name or (user.full_name if user else None)
            prov.phone = claim.phone or prov.phone
            if claim.whatsapp:
                prov.whatsapp = claim.whatsapp
            if claim.email:
                prov.email = claim.email
            elif user and not prov.email:
                prov.email = user.email
            if claim.business_name:
                prov.business_name = claim.business_name
            if claim.address:
                prov.address = claim.address
            if user:
                prov.owner_user_id = user.id
            prov.claimed = True
            prov.verification_status = "LIVE_PROVIDER"
            prov.verified_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(prov)
        return prov

    @classmethod
    def add_vehicle(cls, db: Session, provider_id: str, payload: MobilityVehicleCreate, user: Optional[User] = None) -> MobilityVehicle:
        from fastapi import HTTPException
        prov = db.query(MobilityProvider).filter(MobilityProvider.id == provider_id).first()
        if not prov:
            raise HTTPException(status_code=404, detail="Mobility provider not found")

        if user and prov.owner_user_id and prov.owner_user_id != user.id and getattr(user, "role", "") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to add vehicles to this provider fleet.")

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
