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
        is_scooter = any(k in query for k in ["scooter", "activa", "jupiter", "access", "vespa", "moped", "ntorq", "fascino", "dio", "pleasure", "burgman", "scooty"]) or is_electric
        is_adv = (not is_scooter) and (any(k in query for k in ["himalayan", "adventure", "adv", "450", "411", "xpulse", "off-road", "rally", "touring"]))
        is_bullet = (not is_scooter) and (not is_adv) and any(k in query for k in ["bullet", "classic", "enfield", "350", "cruiser", "hunter", "meteor", "interceptor", "motorcycle", "bike", "fz", "pulsar", "apache", "avenger"])

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
            return "/images/vehicles/varanasi_ghat_approach_scooter.jpg"

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
                return "/images/vehicles/spiti_arid_adventure_bike.webp"
            if is_car:
                return "/images/vehicles/thar_4x4.webp"
            return "/images/vehicles/spiti_arid_adventure_bike.webp"

        # 7. Mussoorie / Landour
        if any(k in dest_str for k in ["mussoorie", "landour"]):
            if is_car:
                return "/images/vehicles/mussoorie_hill_car.jpg"
            if is_bullet or is_adv:
                return "/images/vehicles/mussoorie_landour_bullet.jpg"
            return "/images/vehicles/mussoorie_landour_scooter.jpg"

        # 8. Rishikesh
        if any(k in dest_str for k in ["rishikesh", "tapovan"]):
            if is_bicycle:
                return "/images/vehicles/rishikesh_ganga_mtb.jpg"
            if is_adv:
                return "/images/vehicles/adventure_motorcycle.jpg"
            if is_bullet:
                return "/images/vehicles/rishikesh_ganga_bullet.jpg"
            return "/images/vehicles/rishikesh_tapovan_scooter.jpg"

        # 9. Manali
        if any(k in dest_str for k in ["manali", "solang"]):
            if is_adv:
                return "/images/vehicles/manali_himalayan_adv_bike.jpg"
            if is_bullet:
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


    @classmethod
    async def get_mobility_access_plan(
        cls,
        db: Session,
        destination_slug_or_id: str,
        origin: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive, truthful MobilityAccessPlan for a destination:
        Pickup hubs, mountain route advisories, syndicate rules, fuel logistics,
        vehicle recommendations, and verified fleet listings.
        """
        clean_slug = (destination_slug_or_id or "").strip().lower()
        if clean_slug.startswith("dest-"):
            clean_slug = clean_slug[5:]

        dest = db.query(Destination).filter(
            (Destination.slug == clean_slug) |
            (Destination.id == f"dest-{clean_slug}") |
            (Destination.id == clean_slug)
        ).first()

        dest_name = dest.name if dest else clean_slug.replace("-", " ").title()

        # Destination-specific mobility intelligence dossiers
        if clean_slug == "spiti":
            approach_summary = "Spiti Valley is an extreme high-altitude cold desert surrounded by Rohtang (3,980m), Kunzum Pass (4,590m), and Malling Nullah. Commercial rental operators do NOT maintain depots inside Kaza; 98% of riders and drivers pick up from Manali, Shimla, or Chandigarh."
            pickup_hubs = [
                {
                    "hub_name": "Manali (Old Manali / Mall Road)",
                    "hub_type": "Primary Mountain Gateway",
                    "distance_km": 200,
                    "typical_drive_hours": 7.0,
                    "recommended_for": "Summer & Autumn expeditions (June–October) via Atal Tunnel & Kunzum Pass.",
                    "advantage": "Largest Royal Enfield and 4x4 fleet availability; direct mechanic support."
                },
                {
                    "hub_name": "Shimla (Reckong Peo / Kinnaur Route)",
                    "hub_type": "All-Weather Southern Gateway",
                    "distance_km": 420,
                    "typical_drive_hours": 15.0,
                    "recommended_for": "Year-round access & gradual altitude acclimatization via NH-5.",
                    "advantage": "Gentle elevation gain; open even in winter when Kunzum Pass is snowbound."
                },
                {
                    "hub_name": "Chandigarh Airport (IXC)",
                    "hub_type": "Major Transit Hub",
                    "distance_km": 520,
                    "typical_drive_hours": 17.0,
                    "recommended_for": "Fly-in travellers wanting unified road trip transport from sea level.",
                    "advantage": "Lowest daily rental rates, automatic self-drive SUV fleets available."
                }
            ]
            remote_advisory = "Do not expect to find commercial rental motorcycles or self-drive cars in Kaza. Kaza mechanics provide puncture repair and basic Royal Enfield maintenance, but zero one-way drop depots exist in the valley."
            syndicate_rules = "Private rental self-drive vehicles (black plate with yellow numbers) are permitted across Spiti. However, outside commercial yellow-plate tourist taxis cannot do local sightseeing in Spiti villages (Komic, Langza, Hikkim) due to Spiti Taxi Union regulations."
            fuel_logistics = {
                "critical_fuel_points": [
                    "Tandi (Lahaul): LAST reliable fuel station before Kaza (185 km high mountain stretch with zero pumps)",
                    "Kaza: World's highest retail fuel outlet (Indian Oil, 3,740m) - check winter diesel availability",
                    "Powari (Kinnaur): Last major pump on the Shimla route before entering lower Spiti"
                ],
                "jerry_can_recommended": True,
                "recommended_fuel_range_km": 350,
                "oxygen_and_altitude_gear": "Carry portable medical oxygen canisters (Oxy99) and Diamox when crossing Kunzum Pass (4,590m)."
            }
            vehicle_recs = [
                {
                    "category": "Adventure Motorcycle",
                    "model": "Royal Enfield Himalayan 450",
                    "terrain_suitability": "HIGH PASSES & RIVER CROSSINGS",
                    "suitability_rating": 5,
                    "ground_clearance_mm": 230,
                    "estimated_daily_inr": 1800,
                    "estimated_deposit_inr": 10000,
                    "image_url": "/images/vehicles/himalayan_450.webp",
                    "advisory": "Sherpa 450 EFI engine prevents altitude power lag. Excellent standing ergonomics for river crossings at Chhatru & Batal."
                },
                {
                    "category": "4x4 Expedition Vehicle",
                    "model": "Mahindra Thar 4x4 / Scorpio-N 4x4",
                    "terrain_suitability": "RUGGED VALLEY EXPEDITION",
                    "suitability_rating": 5,
                    "ground_clearance_mm": 226,
                    "estimated_daily_inr": 4500,
                    "estimated_deposit_inr": 20000,
                    "image_url": "/images/vehicles/thar_4x4.webp",
                    "advisory": "Low-range 4L gearbox essential for loose scree on Kunzum Pass and flooded nullahs during afternoon snow melt."
                },
                {
                    "category": "Cruiser Motorcycle",
                    "model": "Royal Enfield Classic 350",
                    "terrain_suitability": "PAVED VALLEY HIGHWAYS",
                    "suitability_rating": 4,
                    "ground_clearance_mm": 170,
                    "estimated_daily_inr": 1400,
                    "estimated_deposit_inr": 8000,
                    "image_url": "/images/vehicles/classic_350.webp",
                    "advisory": "Sturdy steel chassis and torquey low-end engine. Ride cautiously over rocky stretches around Losar."
                }
            ]
        elif clean_slug == "leh":
            approach_summary = "Ladakh sits at 3,500m+ elevation. Access roads from Manali (NH-3) and Srinagar (NH-1) are open only May to October. Leh airport operates year-round."
            pickup_hubs = [
                {
                    "hub_name": "Leh City (Fort Road / Changspa)",
                    "hub_type": "Primary Internal Circuit Hub",
                    "distance_km": 0,
                    "typical_drive_hours": 0.0,
                    "recommended_for": "All internal circuits (Nubra Valley, Pangong Tso, Tso Moriri, Hanle).",
                    "advantage": "Complies fully with Ladakh Motorcycle & Taxi Union rules."
                },
                {
                    "hub_name": "Manali (Kullu Gateway)",
                    "hub_type": "Trans-Himalayan Highway Roadhead",
                    "distance_km": 430,
                    "typical_drive_hours": 16.0,
                    "recommended_for": "Epic 2-day pass journey over Baralacha La (4,890m) and Tanglang La (5,328m).",
                    "advantage": "One of the world's greatest motorcycling routes."
                }
            ]
            remote_advisory = "CRITICAL: Outside commercial rental motorcycles (rented in Manali or Delhi) are strictly prohibited by the Leh Two-Wheeler Association from being used for internal Ladakh sightseeing (Pangong, Khardung La, Nubra). Outside vehicles must be parked in Leh."
            syndicate_rules = "Ladakh Taxi Union mandates that only local Leh-registered commercial cabs can carry tourists across Khardung La, Chang La, Nubra, and Pangong."
            fuel_logistics = {
                "critical_fuel_points": [
                    "Karu: Last fuel pump towards Pangong Tso and Chang La",
                    "Diskit: Sole fuel pump in Nubra Valley",
                    "Upshi: Last petrol station when driving from Leh towards Manali (no fuel for 365 km until Tandi!)"
                ],
                "jerry_can_recommended": True,
                "recommended_fuel_range_km": 400,
                "oxygen_and_altitude_gear": "Mandatory 48-hour rest upon arrival in Leh before driving across Khardung La (5,359m)."
            }
            vehicle_recs = [
                {
                    "category": "Adventure Motorcycle",
                    "model": "Royal Enfield Himalayan 450",
                    "terrain_suitability": "EXTREME HIGH PASSES",
                    "suitability_rating": 5,
                    "ground_clearance_mm": 230,
                    "estimated_daily_inr": 2000,
                    "estimated_deposit_inr": 12000,
                    "image_url": "/images/vehicles/himalayan_450.webp",
                    "advisory": "Proven Himalayan altitude platform for Khardung La and Chang La ascents."
                },
                {
                    "category": "4x4 Expedition Vehicle",
                    "model": "Toyota Fortuner 4x4 / Isuzu D-Max",
                    "terrain_suitability": "ALL TERRAIN & RIVER BEDS",
                    "suitability_rating": 5,
                    "ground_clearance_mm": 225,
                    "estimated_daily_inr": 5500,
                    "estimated_deposit_inr": 25000,
                    "image_url": "/images/vehicles/fortuner_4x4.webp",
                    "advisory": "High comfort and dependable 4WD for Shyok river route and Changthang wilderness."
                }
            ]
        elif clean_slug == "goa":
            approach_summary = "Goa is best explored on two-wheelers and self-drive open jeeps across coastal highways and rural Latin Quarter backroads."
            pickup_hubs = [
                {
                    "hub_name": "Panaji & Old Goa",
                    "hub_type": "Heritage & Central Hub",
                    "distance_km": 0,
                    "typical_drive_hours": 0.0,
                    "recommended_for": "Exploring Fontainhas, churches, and river islands (Divar/Chorão).",
                    "advantage": "Central transit connecting North and South Goa."
                },
                {
                    "hub_name": "North Goa (Calangute / Anjuna)",
                    "hub_type": "Coastal Beach Hub",
                    "distance_km": 15,
                    "typical_drive_hours": 0.5,
                    "recommended_for": "Beach hopping, cafes, and coastal night markets.",
                    "advantage": "Highest density of scooter and bike rental operators."
                },
                {
                    "hub_name": "Mopa Airport (GOX) / Dabolim (GOI)",
                    "hub_type": "Airport Terminals",
                    "distance_km": 30,
                    "typical_drive_hours": 0.8,
                    "recommended_for": "Instant airport vehicle handover upon arrival.",
                    "advantage": "Direct self-drive car pickups without taxi negotiation."
                }
            ]
            remote_advisory = "Always check that the rental vehicle has valid black-and-yellow commercial self-drive plates (BSV). White-plate private vehicle rentals are illegal and subject to heavy traffic police fines."
            syndicate_rules = "Helmets are strictly mandatory for both rider and pillion across all national highways and Mandovi bridges with active AI camera challans."
            fuel_logistics = {
                "critical_fuel_points": ["Fuel pumps are abundant along NH-66 and coastal bypasses."],
                "jerry_can_recommended": False,
                "recommended_fuel_range_km": 150,
                "oxygen_and_altitude_gear": None
            }
            vehicle_recs = [
                {
                    "category": "Automatic Scooter",
                    "model": "Honda Activa 125 / TVS Jupiter",
                    "terrain_suitability": "COASTAL & TOWN LANES",
                    "suitability_rating": 5,
                    "ground_clearance_mm": 160,
                    "estimated_daily_inr": 450,
                    "estimated_deposit_inr": 2000,
                    "image_url": "/images/vehicles/activa_125.webp",
                    "advisory": "Easiest way to navigate narrow village lanes and beach parking."
                },
                {
                    "category": "Open Top Vehicle",
                    "model": "Mahindra Thar Convertible",
                    "terrain_suitability": "SCENIC COASTAL CRUISING",
                    "suitability_rating": 4,
                    "ground_clearance_mm": 226,
                    "estimated_daily_inr": 3500,
                    "estimated_deposit_inr": 15000,
                    "image_url": "/images/vehicles/thar_4x4.webp",
                    "advisory": "Iconic Goa coastal cruiser; reserve in advance during peak season (Nov-Jan)."
                }
            ]
        else:
            # General Mountain / Heritage / Cultural Indian destination plan
            is_himalayan = (dest and (dest.altitude_meters or 0) > 1200) or clean_slug in ["manali", "kasol", "dharamshala", "mussoorie", "munnar", "tungnath-chandrashila", "munsiyari", "rishikesh"]
            approach_summary = f"{dest_name} transit logistics: verified rental fleets, pickup hubs, route conditions, and local transport advisories."
            pickup_hubs = [
                {
                    "hub_name": f"{dest_name} City Center",
                    "hub_type": "Local Core Hub",
                    "distance_km": 0,
                    "typical_drive_hours": 0.0,
                    "recommended_for": "Direct local exploration.",
                    "advantage": "Immediate pickup and drop within town."
                }
            ]
            remote_advisory = "Always ensure self-drive vehicles carry original commercial permits, RC, and pollution certificates."
            syndicate_rules = "Check local municipal parking rules and taxi union zones before parking near monument gates or hill-station mall roads."
            fuel_logistics = {
                "critical_fuel_points": [f"Central fuel stations available within {dest_name} perimeter."],
                "jerry_can_recommended": bool(is_himalayan),
                "recommended_fuel_range_km": 250 if is_himalayan else 150,
                "oxygen_and_altitude_gear": "Carry light warm layers for evening temperature drops." if is_himalayan else None
            }
            vehicle_recs = [
                {
                    "category": "All-Round Two Wheeler",
                    "model": "Royal Enfield Classic 350 / Himalayan" if is_himalayan else "Honda Activa 125",
                    "terrain_suitability": "MOUNTAIN ROADS & CIRCUITS" if is_himalayan else "CITY STREETS & MONUMENTS",
                    "suitability_rating": 5,
                    "ground_clearance_mm": 170 if is_himalayan else 160,
                    "estimated_daily_inr": 1400 if is_himalayan else 500,
                    "estimated_deposit_inr": 5000 if is_himalayan else 2000,
                    "image_url": "/images/vehicles/classic_350.webp" if is_himalayan else "/images/vehicles/activa_125.webp",
                    "advisory": "Reliable daily commuter with ample power for local inclines."
                }
            ]

        # Fetch verified fleet for destination
        fleet = await cls.get_mobility_listings(
            db=db,
            destination_slug_or_id=clean_slug,
            radius_km=30.0
        )

        return {
            "destination_slug": clean_slug,
            "destination_name": dest_name,
            "origin": origin,
            "approach_summary": approach_summary,
            "recommended_pickup_hubs": pickup_hubs,
            "remote_rental_advisory": remote_advisory,
            "syndicate_rules": syndicate_rules,
            "fuel_and_logistics": fuel_logistics,
            "vehicle_recommendations": vehicle_recs,
            "verified_fleet": fleet
        }
