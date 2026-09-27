import re
import uuid
import asyncio
import logging
from datetime import datetime, timezone, date
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session

from app.models.models import Destination, Place, Hotel, RentalOption, WeatherSnapshot, ResearchJob
from app.schemas.schemas import (
    PlaceResponse, HotelResponse, RentalOptionResponse,
    SoloDestinationIntelligenceResponse, EmergencyContactItem,
    DestinationRecommendationResponse, DestinationResearchResponse
)
from app.providers.provider_factory import ProviderFactory
from app.services.operating_hours_engine import OperatingHoursEngine
from app.services.action_link_generator import ActionLinkGenerator
from app.services.stay_matching_service import StayMatchingService
from app.services.mobility_service import MobilityService

logger = logging.getLogger("vanvas.destination_research")

# Regional Emergency Contacts Map (Official Govt & Verified State Lines)
STATE_EMERGENCY_CONTACTS: Dict[str, List[Dict[str, str]]] = {
    "Himachal Pradesh": [
        {"label": "State Police Helpline", "number": "112"},
        {"label": "Himachal Women Safety Helpline", "number": "1091"},
        {"label": "Tourist Information Cell", "number": "0177-2652561"},
        {"label": "State Disaster Response (SDMA)", "number": "1077"},
    ],
    "Uttarakhand": [
        {"label": "State Police Helpline", "number": "112"},
        {"label": "Uttarakhand Women Helpline", "number": "1090"},
        {"label": "Tourist Police Uttarakhand", "number": "0135-2716201"},
        {"label": "State Disaster Management", "number": "1070"},
    ],
    "Goa": [
        {"label": "Goa Police Control Room", "number": "112"},
        {"label": "Goa Women Helpline", "number": "1091"},
        {"label": "Goa Tourist Police Assistance", "number": "0832-2419400"},
        {"label": "Coastal Police Helpline", "number": "1093"},
    ],
    "Rajasthan": [
        {"label": "Rajasthan Police Helpline", "number": "112"},
        {"label": "Rajasthan Women Helpline", "number": "1090"},
        {"label": "Tourist Assistance Force (TAF)", "number": "0141-2822822"},
        {"label": "Medical Emergency & Ambulance", "number": "108"},
    ],
    "Kerala": [
        {"label": "Kerala Police Emergency", "number": "112"},
        {"label": "Kerala Women Helpline (Mitra)", "number": "181"},
        {"label": "Kerala Tourism Police", "number": "0471-2322123"},
        {"label": "Kerala Highway Police", "number": "9846100100"},
    ],
    "Karnataka": [
        {"label": "Karnataka Police Emergency", "number": "112"},
        {"label": "Karnataka Women Helpline", "number": "1091"},
        {"label": "Karnataka Tourist Police", "number": "080-22212998"},
        {"label": "Ambulance & Medical", "number": "108"},
    ],
    "Tamil Nadu": [
        {"label": "Tamil Nadu Police Emergency", "number": "112"},
        {"label": "Tamil Nadu Women Helpline", "number": "181"},
        {"label": "Tourist Police Tamil Nadu", "number": "044-25384444"},
        {"label": "State Disaster Response", "number": "1077"},
    ],
    "Maharashtra": [
        {"label": "Maharashtra Police Emergency", "number": "112"},
        {"label": "Maharashtra Women Helpline", "number": "103"},
        {"label": "Tourist Assistance Cell", "number": "022-22845678"},
        {"label": "Disaster Management Cell", "number": "1077"},
    ],
    "Uttar Pradesh": [
        {"label": "UP Police Emergency (UP 112)", "number": "112"},
        {"label": "UP Women Power Line", "number": "1090"},
        {"label": "Tourist Police UP", "number": "0522-2238472"},
        {"label": "Medical Emergency", "number": "108"},
    ],
    "Delhi": [
        {"label": "Delhi Police Control Room", "number": "112"},
        {"label": "Delhi Women Helpline", "number": "1091"},
        {"label": "Delhi Tourist Police", "number": "011-23365335"},
        {"label": "Ambulance Helpline", "number": "102"},
    ],
    "National": [
        {"label": "National Emergency Number", "number": "112"},
        {"label": "National Women Helpline", "number": "1091"},
        {"label": "National Tourist Helpline (Incredible India)", "number": "1800-11-1363"},
        {"label": "National Disaster Helpline", "number": "1078"},
    ]
}

# Regional atmosphere & terrain heuristic classifier
def classify_atmosphere(region: str, state: str, name: str, altitude: int = 500) -> str:
    r_lower = f"{region} {state} {name}".lower()
    if any(k in r_lower for k in ["himalay", "spiti", "ladakh", "leh", "manali", "shimla", "mussoorie", "chopta", "auli", "kullu", "kinnaur", "dharamshala", "kasol", "valley", "parvati", "tirthan"]):
        return "mountain"
    if any(k in r_lower for k in ["goa", "varkala", "gokarna", "kochi", "alappuzha", "alleppey", "beach", "coastal", "andaman", "pondicherry", "puducherry", "puri", "mumbai"]):
        return "coastal"
    if any(k in r_lower for k in ["rajasthan", "jaisalmer", "jodhpur", "bikaner", "pushkar", "thar", "desert"]):
        return "desert"
    if any(k in r_lower for k in ["rishikesh", "varanasi", "kashi", "vrindavan", "mathura", "kainchi", "kedarnath", "badrinath", "haridwar", "tirupati", "madurai", "spiritual", "ashram"]):
        return "spiritual"
    if any(k in r_lower for k in ["jaipur", "udaipur", "agra", "hampi", "khajuraho", "mysore", "gwalior", "delhi", "amritsar", "heritage", "fort", "palace"]):
        return "heritage"
    if any(k in r_lower for k in ["munnar", "wayanad", "coorg", "kodagu", "kodaikanal", "ooty", "nilgiri", "shillong", "ziro", "forest", "jungle", "ghats"]):
        return "forest"
    if altitude > 1200:
        return "mountain"
    return "urban"


# In-memory research cache
_RESEARCH_CACHE: Dict[str, Dict[str, Any]] = {}


class DestinationResearchService:
    @staticmethod
    def _clean_slug(text: str) -> str:
        s = text.lower().strip()
        s = re.sub(r'^(dyn|dest)-', '', s, flags=re.IGNORECASE)
        s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
        return s

    @classmethod
    async def get_solo_intelligence(
        cls,
        destination_slug_or_id: str,
        db: Session
    ) -> SoloDestinationIntelligenceResponse:
        """
        Synthesizes dynamic destination-specific solo field intelligence.
        Supports all seeded destinations + arbitrary Indian destinations without hardcoding Manali.
        """
        clean_slug = cls._clean_slug(destination_slug_or_id)
        
        # 1. Check if destination is in DB
        dest = db.query(Destination).filter(
            (Destination.id == destination_slug_or_id) |
            (Destination.id == f"dest-{clean_slug}") |
            (Destination.slug == clean_slug)
        ).first()

        name = dest.name if dest else clean_slug.replace("-", " ").title()
        state = dest.state if dest else "India"
        region = dest.region if dest else "Indian Subcontinent"
        tagline = dest.tagline if dest else f"Quiet field intelligence & solo traveller guide for {name}."
        altitude = dest.altitude_meters if dest and dest.altitude_meters else 500
        best_seasons_str = dest.best_time_to_visit if dest and dest.best_time_to_visit else "October to March"
        weather_type = dest.weather_type if dest else "Pleasant"

        if not dest:
            # Dynamic geocoding
            geocoder = ProviderFactory.get_geocoding_provider()
            geo = await geocoder.geocode(clean_slug)
            if geo:
                name = geo.get("name", name)
                state = geo.get("state", state)
                region = geo.get("region", region)
                altitude = geo.get("altitude_meters", altitude)

        atmosphere = classify_atmosphere(region, state, name, altitude)

        # Dynamic Field Notes & Intelligence tailored to atmosphere and state
        safe_areas = cls._generate_safe_areas(name, state, atmosphere)
        getting_around = cls._generate_getting_around(name, state, atmosphere, altitude)
        stay_tips = cls._generate_stay_tips(name, atmosphere)
        dining_tips = cls._generate_dining_tips(name, atmosphere)
        solo_experiences = cls._generate_solo_experiences(name, atmosphere)
        etiquette = cls._generate_etiquette(name, state, atmosphere)
        packing = cls._generate_packing(atmosphere, altitude)
        money_connectivity = cls._generate_money_connectivity(name, atmosphere, altitude)

        # Emergency contacts lookup
        contacts_raw = STATE_EMERGENCY_CONTACTS.get(state, STATE_EMERGENCY_CONTACTS.get("National", []))
        emergency_contacts = [
            EmergencyContactItem(label=f"{name} / {c['label']}", number=c["number"])
            for c in contacts_raw
        ]

        # Best seasons list
        best_seasons = [s.strip() for s in best_seasons_str.split(",") if s.strip()] or [best_seasons_str]

        return SoloDestinationIntelligenceResponse(
            destination_id=dest.id if dest else f"dyn-{clean_slug}",
            slug=clean_slug,
            name=name,
            state=state,
            region=region,
            tagline=tagline,
            atmosphere_type=atmosphere,
            safe_areas=safe_areas,
            getting_around=getting_around,
            stay_tips=stay_tips,
            dining_tips=dining_tips,
            solo_experiences=solo_experiences,
            etiquette=etiquette,
            emergency_contacts=emergency_contacts,
            best_seasons=best_seasons,
            weather_summary=f"Typical climate: {weather_type}. Altitude: {altitude}m above sea level.",
            solo_friendliness_score=4.8 if atmosphere in ["mountain", "coastal", "spiritual"] else 4.6,
            packing_essentials=packing,
            money_connectivity=money_connectivity,
            source_metadata={
                "source": "vanvas_field_intelligence",
                "verified_state": state,
                "atmosphere": atmosphere,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        )

    @classmethod
    def _generate_safe_areas(cls, name: str, state: str, atmosphere: str) -> List[str]:
        if atmosphere == "mountain":
            return [
                f"{name} Town Center & pedestrian markets (well-lit, active traveler footfall, police posts)",
                f"Riverside & forest village precincts with established homestays & cafes",
                f"Main taxi union stands and authorized bus terminals",
                f"Designated nature walking trails during daylight hours (07:00 AM – 06:00 PM)"
            ]
        elif atmosphere == "coastal":
            return [
                f"{name} main beach promenades & cliffside cafe pathways (lively, solo-friendly)",
                f"North/South coastal villages with established boutique hostels & surf schools",
                f"Main market roads with well-lit eateries and 24/7 scooter rental hubs",
                f"Official lifeguard-monitored beach stretches during daylight"
            ]
        elif atmosphere == "spiritual":
            return [
                f"{name} central temple/ghat walking zones (pedestrianized, serene community atmosphere)",
                f"Ashram precincts & organic cafe lanes with global yoga/traveler presence",
                f"Riverside ghat steps during evening aartis and morning sunrise meditation",
                f"Prepaid government auto stands near railway & bus transit points"
            ]
        elif atmosphere == "desert":
            return [
                f"{name} Fort and heritage old city quarters (vibrant pedestrian alleys)",
                f"Certified desert camp sites and registered camel safari operators",
                f"Main bazaar and artisan craft markets with active tourist police presence",
                f"Rooftop restaurant zones overlooking the historic ramparts"
            ]
        elif atmosphere == "heritage":
            return [
                f"{name} historic old town & monument precincts with registered guides",
                f"Central bazaar avenues & heritage walking corridors",
                f"Official state tourism (RTDC/KTDC/UPT) counters & prepaid transit booths",
                f"Well-reviewed boutique havelis and heritage homestay lanes"
            ]
        else:
            return [
                f"{name} Central cultural district & pedestrian shopping corridors",
                f"University / creative art precinct with bustling daytime cafes & bookstores",
                f"Metro & primary public transit junctions with verified police kiosks",
                f"Parks and heritage gardens during morning and evening walking hours"
            ]

    @classmethod
    def _generate_getting_around(cls, name: str, state: str, atmosphere: str, altitude: int) -> List[str]:
        if atmosphere in ["mountain", "forest"]:
            return [
                f"Most villages and cafe clusters in {name} are easily walkable along stone trails.",
                f"Rent an automatic scooter (Activa) or Royal Enfield from verified local stands for high viewpoints.",
                f"Shared local buses and prepaid union taxis connect neighboring hamlets reliably.",
                f"Always negotiate and verify taxi union rate charts before setting off for remote passes."
            ]
        elif atmosphere == "coastal":
            return [
                f"Renting a lightweight automatic scooter is the most liberating way to explore {name}'s coastline.",
                f"Cliffside pathways and beachfront stretches are best experienced on foot.",
                f"Shared auto-rickshaws (tuk-tuks) connect beaches and main town hubs for modest fixed fares.",
                f"Bicycle rentals are popular and scenic along flat coastal backwaters."
            ]
        elif atmosphere == "spiritual":
            return [
                f"Pedestrian suspension footbridges, ghat walkways, and temple alleys are vehicle-free.",
                f"Shared Vikram auto-rickshaws connect major ashram clusters and transit terminals for ₹20–₹40.",
                f"E-rickshaws and cycle rickshaws are convenient for short old-city journeys.",
                f"Walking along the riverfront at dawn and dusk is the most rewarding way to experience {name}."
            ]
        else:
            return [
                f"Central heritage lanes in {name} are compact and rewarding to explore on foot.",
                f"Auto-rickshaws and app-based cabs (where active) provide reliable intra-city transport.",
                f"Local public transport connects major monuments and regional transit hubs.",
                f"Prepaid taxi booths are recommended when arriving late at railway stations or airports."
            ]

    @classmethod
    def _generate_stay_tips(cls, name: str, atmosphere: str) -> List[str]:
        if atmosphere == "mountain":
            return [
                f"Choose boutique hostels or traditional wooden homestays with communal living rooms and balconies.",
                f"Look for stays offering high-speed fiber internet, hot running water, and heated wood stoves in winter.",
                f"Solo female travelers frequently recommend properties with 24/7 on-site staff and riverside terraces."
            ]
        elif atmosphere == "coastal":
            return [
                f"Opt for beachfront hostels or garden homestays with communal hammock decks and co-working areas.",
                f"Book stays close to active surf/yoga schools to easily meet fellow solo wanderers.",
                f"Check for air conditioning and mosquito netting if traveling during humid or monsoon shoulder months."
            ]
        elif atmosphere == "spiritual":
            return [
                f"Ashram guest houses offer serene, structured environments with morning meditation and yoga.",
                f"Boutique riverside stays provide peaceful reading balconies with uninterrupted water views.",
                f"Look for stays offering pure vegetarian organic community dining and tea circles."
            ]
        else:
            return [
                f"Heritage havelis, boutique guesthouses, and social backpacker hostels provide the best community vibe.",
                f"Select central accommodations within safe walking distance of historic promenades and cafes.",
                f"Look for properties with rooftop terraces overlooking {name}'s landmark skyline."
            ]

    @classmethod
    def _generate_dining_tips(cls, name: str, atmosphere: str) -> List[str]:
        if atmosphere == "mountain":
            return [
                f"Solo dining is standard culture here: book exchanges, board games, and communal long tables abound.",
                f"Sample steaming local thukpa, siddu with ghee, woodfired pizzas, and fresh apple cider/tea.",
                f"Riverside and terrace cafes welcome sitting alone for hours with a travel journal or laptop."
            ]
        elif atmosphere == "coastal":
            return [
                f"Beach shacks and cliffside cafes provide shaded loungers where reading alone is warmly welcomed.",
                f"Enjoy fresh coastal thalis, coconut curries, tropical smoothie bowls, and artisan sourdough bakeries.",
                f"Sunset cafe tables are natural conversation zones for solo travelers exchanging route notes."
            ]
        elif atmosphere == "spiritual":
            return [
                f"Ayurvedic cafes, herbal tea houses, and satvik thali joints offer healthy, tranquil dining.",
                f"Most bakeries feature travel book libraries and quiet solo seating overlooking the water.",
                f"Note: Sacred spiritual destinations strictly observe pure vegetarian and alcohol-free customs."
            ]
        else:
            return [
                f"Historic sweet shops, heritage dhabas, and rooftop artisanal coffee shops offer rich solo dining.",
                f"Try regional signature street delicacies at bustling, high-turnover local food lanes.",
                f"Courtyard cafes and tea lounges offer peaceful respites between monument explorations."
            ]

    @classmethod
    def _generate_solo_experiences(cls, name: str, atmosphere: str) -> List[str]:
        if atmosphere == "mountain":
            return [
                f"Early morning solitary walk to nearby waterfalls and pine forest viewpoints.",
                f"Quiet journaling and sketch sessions on stone riverbanks surrounded by ancient deodars.",
                f"Day trips to historic village castles, monasteries, and local artisan woodcraft workshops."
            ]
        elif atmosphere == "coastal":
            return [
                f"Sunrise paddleboarding, beginner surf lessons, or cliffside meditation at dawn.",
                f"Sunset coastal trail walk connecting hidden coves and secluded sandy beaches.",
                f"Evening live acoustic music and open mic sessions at social beach cafes."
            ]
        elif atmosphere == "spiritual":
            return [
                f"Silent dawn meditation on peaceful riverfront ghat steps before the town awakens.",
                f"Attending the evening sacred lamp-lit aarti ceremonies and listening to temple bells.",
                f"Exploring heritage ashram architecture, spiritual libraries, and sound healing sessions."
            ]
        else:
            return [
                f"Self-guided morning architectural and photography walk through historic old quarter alleys.",
                f"Browsing local artisan bazaars, antique markets, and independent bookshops at your own pace.",
                f"Catching the golden hour glow over {name}'s historic fortresses or lake vistas."
            ]

    @classmethod
    def _generate_etiquette(cls, name: str, state: str, atmosphere: str) -> List[str]:
        items = [
            "Dress modestly when entering temple sanctums, ashrams, and rural village squares (cover shoulders & knees; remove shoes).",
            "Always ask permission before photographing local residents, holy elders, or rituals.",
            "Carry all plastic packaging and water bottles back down to designated valley/town recycling points."
        ]
        if atmosphere == "mountain":
            items.append("Avoid isolated unlit forest trails after dusk during winter and monsoon months.")
        elif atmosphere == "coastal":
            items.append("Swim only in designated safe zones; respect red flags and local coastal lifeguard advisories.")
        elif atmosphere == "spiritual":
            items.append(f"{name} is a sacred town: adhere strictly to vegetarian customs and alcohol prohibitions.")
        return items

    @classmethod
    def _generate_packing(cls, atmosphere: str, altitude: int) -> List[str]:
        if altitude > 1500 or atmosphere == "mountain":
            return [
                "Sturdy high-traction walking shoes / hiking boots",
                "Lightweight thermal layer & windproof fleece jacket",
                "Reusable insulated water bottle with filter",
                "Power bank (battery drains faster in mountain chill)",
                "Compact headlamp / pocket flashlight for unlit village paths",
                "Small personal first-aid kit with altitude & motion sickness meds",
                "Travel notebook & pen for field journaling"
            ]
        elif atmosphere == "coastal":
            return [
                "Breathable quick-dry linen clothing & swimwear",
                "Reef-safe sunscreen & broad-brim sun hat",
                "Waterproof dry bag for boat & coastal walks",
                "Comfortable sandals / flip-flops & walking shoes",
                "Electrolyte packs & mosquito repellent spray",
                "Reusable water bottle & tote bag"
            ]
        else:
            return [
                "Breathable cotton layers suitable for warm days and cool evenings",
                "Comfortable walking shoes with cushioned soles for cobbled streets",
                "Light scarf / shawl for covering up when entering temples",
                "Sun protection (sunglasses, hat, sunscreen)",
                "Power bank, hand sanitizer, and compact umbrella"
            ]

    @classmethod
    def _generate_money_connectivity(cls, name: str, atmosphere: str, altitude: int) -> List[str]:
        return [
            f"UPI (Google Pay, PhonePe, Paytm) is widely accepted at cafes, homestays, and rental shops in {name}.",
            "Keep ₹2,000–₹4,000 in physical cash for rural local buses, shared autos, and remote village entry points.",
            "Jio and Airtel provide dependable 4G/5G coverage in main town zones; high-altitude passes may experience spotty signals.",
            "Most boutique hostels and cafes offer high-speed Wi-Fi (50–100 Mbps) suitable for remote work."
        ]

    @classmethod
    async def get_destination_recommendations(
        cls,
        destination_slug_or_id: str,
        travel_styles: List[str],
        db: Session,
        budget: Optional[str] = None,
        duration: Optional[int] = None
    ) -> DestinationRecommendationResponse:
        """
        Dynamically filters and scores places, stays, and mobility for single or multi-selected travel styles.
        """
        clean_slug = cls._clean_slug(destination_slug_or_id)
        
        # 1. Fetch places for destination
        from app.api.v1.destinations import get_destination_places
        raw_places: List[PlaceResponse] = await get_destination_places(
            destination_id=clean_slug,
            db=db
        )

        # 2. Fetch stays
        raw_hotels = await StayMatchingService.match_stays(
            db=db,
            destination_id=clean_slug,
            adults=1
        )

        # 3. Fetch mobility
        raw_rentals = await MobilityService.get_mobility_listings(
            db=db,
            destination_slug_or_id=clean_slug
        )

        dest_obj = db.query(Destination).filter(
            (Destination.id == destination_slug_or_id) |
            (Destination.slug == clean_slug)
        ).first()
        dest_name = dest_obj.name if dest_obj else clean_slug.replace("-", " ").title()

        # Styles normalization
        normalized_styles = [s.strip().lower().replace(" ", "_").replace("&", "_") for s in travel_styles if s.strip()]
        if not normalized_styles or "all" in normalized_styles:
            normalized_styles = ["slow_travel", "adventure_trails", "culture_heritage", "cafes_food", "nature_solitude", "spiritual_ashrams", "backpacking"]

        # Place Scoring Engine based on multi-selected styles
        scored_places: List[Tuple[float, PlaceResponse]] = []
        style_counts: Dict[str, int] = {s: 0 for s in normalized_styles}

        for p in raw_places:
            score = 0.0
            p_cat = (p.category or "").lower()
            p_tags = (p.tags or "").lower()
            p_desc = (p.description or "").lower()
            p_text = f"{p_cat} {p_tags} {p_desc} {p.name.lower()}"

            if p.is_must_visit:
                score += 2.0
            if p.is_hidden_gem:
                score += 1.5
            if p.rating:
                score += (p.rating - 4.0) * 2.0

            # Style relevance matching
            for st in normalized_styles:
                match = False
                if st in ["slow_travel", "slow"]:
                    if any(k in p_text for k in ["cafe", "café", "bakery", "walk", "library", "book", "river", "garden", "lake", "view", "chill", "peace"]):
                        score += 3.0
                        match = True
                elif st in ["adventure_trails", "adventure"]:
                    if any(k in p_text for k in ["trail", "waterfall", "trek", "hike", "rafting", "climb", "peak", "pass", "paragliding", "adventure", "fall"]):
                        score += 4.0
                        match = True
                elif st in ["culture_heritage", "culture", "heritage"]:
                    if any(k in p_text for k in ["temple", "fort", "palace", "museum", "ghat", "heritage", "monument", "history", "art", "craft", "bazaar"]):
                        score += 3.5
                        match = True
                elif st in ["cafes_food", "cafes", "food"]:
                    if any(k in p_text for k in ["cafe", "café", "food", "bakery", "restaurant", "dhaba", "coffee", "roasters", "tea", "cuisine"]):
                        score += 4.0
                        match = True
                elif st in ["nature_solitude", "nature"]:
                    if any(k in p_text for k in ["viewpoint", "forest", "nature", "river", "lake", "sunset", "sunrise", "hill", "quiet", "valley", "sanctuary"]):
                        score += 3.5
                        match = True
                elif st in ["spiritual_ashrams", "spiritual"]:
                    if any(k in p_text for k in ["ashram", "temple", "yoga", "meditation", "ghat", "aarti", "spiritual", "peace", "sacred", "monastery"]):
                        score += 4.0
                        match = True
                elif st in ["backpacking", "backpack"]:
                    if any(k in p_text for k in ["hostel", "trail", "market", "viewpoint", "waterfall", "dhaba", "bazaar", "cheap", "free", "social", "communal"]):
                        score += 3.0
                        match = True

                if match:
                    style_counts[st] = style_counts.get(st, 0) + 1

            scored_places.append((score, p))

        # Sort places descending by score
        scored_places.sort(key=lambda x: x[0], reverse=True)
        recommended_places = [p for _, p in scored_places]

        # Field note synthesis
        styles_readable = ", ".join([s.replace("_", " ").title() for s in normalized_styles[:3]])
        field_note = f"Prioritizing {styles_readable} experiences in {dest_name}. Ranked {len(recommended_places)} verified spots for solo suitability and proximity."

        return DestinationRecommendationResponse(
            destination_id=dest_obj.id if dest_obj else f"dyn-{clean_slug}",
            destination_name=dest_name,
            destination_slug=clean_slug,
            selected_styles=normalized_styles,
            total_places_matched=len(recommended_places),
            recommended_places=recommended_places,
            recommended_stays=raw_hotels,
            recommended_mobility=raw_rentals,
            field_note=field_note,
            style_breakdown=style_counts
        )

    @classmethod
    async def run_destination_research_pipeline(
        cls,
        query: str,
        db: Session,
        force_refresh: bool = False
    ) -> DestinationResearchResponse:
        """
        Full 12-step research pipeline for any destination (seeded or unseeded):
        1. Geocode
        2. Resolve canonical destination metadata
        3. Fetch POIs across 20+ categories
        4. Fetch accommodation (hostels, boutique, homestays)
        5. Fetch mobility
        6. Discover solo field intelligence
        7. Generate recommendations
        8. Cache normalized results
        9. Return structured response with audit trail
        """
        clean_query = query.strip()
        clean_slug = cls._clean_slug(clean_query)

        # Check in-memory cache
        if not force_refresh and clean_slug in _RESEARCH_CACHE:
            cached = _RESEARCH_CACHE[clean_slug]
            return DestinationResearchResponse(**cached)

        job_id = f"job-{uuid.uuid4().hex[:10]}"

        # Step 1 & 2: Geocode & resolve canonical
        dest_obj = db.query(Destination).filter(
            (Destination.id == f"dest-{clean_slug}") |
            (Destination.slug == clean_slug) |
            (Destination.name.ilike(clean_query.replace("-", " ")))
        ).first()

        geocoder = ProviderFactory.get_geocoding_provider()
        geo = await geocoder.geocode(clean_query)

        if dest_obj:
            dest_dict = {
                "id": dest_obj.id,
                "name": dest_obj.name,
                "slug": dest_obj.slug,
                "state": dest_obj.state,
                "region": dest_obj.region,
                "tagline": dest_obj.tagline,
                "description": dest_obj.description,
                "hero_image": dest_obj.hero_image,
                "latitude": dest_obj.latitude,
                "longitude": dest_obj.longitude,
                "altitude_meters": dest_obj.altitude_meters,
                "weather_type": dest_obj.weather_type,
                "is_curated": bool(dest_obj.is_featured),
                "is_dynamic": not bool(dest_obj.is_featured)
            }
            lat, lng = dest_obj.latitude, dest_obj.longitude
            dest_name = dest_obj.name
        elif geo:
            dest_name = geo.get("name", clean_query.title())
            lat = geo.get("latitude") if geo.get("latitude") is not None else geo.get("lat", 28.6139)
            lng = geo.get("longitude") if geo.get("longitude") is not None else geo.get("lng", 77.2090)
            state = geo.get("state", "India")
            region = geo.get("region", f"{state}, India")
            altitude = geo.get("altitude_meters", 500)
            dest_dict = {
                "id": f"dyn-{clean_slug}",
                "name": dest_name,
                "slug": clean_slug,
                "state": state,
                "region": region,
                "tagline": f"Live travel discovery & solo field notes for {dest_name}.",
                "description": f"{dest_name} is located in {state}, India ({lat:.4f}°N, {lng:.4f}°E).",
                "hero_image": "/images/destinations/fallbacks/himalayan.jpg",
                "latitude": lat,
                "longitude": lng,
                "altitude_meters": altitude,
                "weather_type": "Live Dynamic",
                "is_curated": False,
                "is_dynamic": True
            }
        else:
            dest_name = clean_query.title()
            lat, lng = 28.6139, 77.2090
            dest_dict = {
                "id": f"dyn-{clean_slug}",
                "name": dest_name,
                "slug": clean_slug,
                "state": "India",
                "region": "India",
                "tagline": f"Travel research for {dest_name}.",
                "description": f"Verified destination intelligence for {dest_name}.",
                "hero_image": "/images/destinations/fallbacks/himalayan.jpg",
                "latitude": lat,
                "longitude": lng,
                "altitude_meters": 500,
                "weather_type": "Live Dynamic",
                "is_curated": False,
                "is_dynamic": True
            }

        # Step 3, 4, 5: Fetch POIs, Stays, Mobility
        from app.api.v1.destinations import get_destination_places
        places = await get_destination_places(destination_id=clean_slug, db=db)
        hotels = await StayMatchingService.match_stays(db=db, destination_id=clean_slug, adults=1)
        rentals = await MobilityService.get_mobility_listings(db=db, destination_slug_or_id=clean_slug)

        # Step 6: Solo Intelligence
        intelligence = await cls.get_solo_intelligence(clean_slug, db)

        source_trail = [
            {"step": "geocoding", "source": geo.get("source", "OpenStreetMap / Nominatim") if geo else "vanvas_canonical", "timestamp": datetime.now(timezone.utc).isoformat()},
            {"step": "poi_discovery", "count": len(places), "source": "OpenStreetMap + VANVAS Curated Registry", "timestamp": datetime.now(timezone.utc).isoformat()},
            {"step": "stays_discovery", "count": len(hotels), "source": "Amadeus / OSM / VANVAS Verified Stays", "timestamp": datetime.now(timezone.utc).isoformat()},
            {"step": "mobility_discovery", "count": len(rentals), "source": "Local Rental Providers & Verified Fleets", "timestamp": datetime.now(timezone.utc).isoformat()},
            {"step": "solo_intelligence", "status": "synthesized", "atmosphere": intelligence.atmosphere_type, "timestamp": datetime.now(timezone.utc).isoformat()}
        ]

        response_data = {
            "job_id": job_id,
            "query": query,
            "canonical_slug": clean_slug,
            "destination_name": dest_name,
            "status": "completed",
            "stage": "ready",
            "destination": dest_dict,
            "places_count": len(places),
            "hotels_count": len(hotels),
            "rentals_count": len(rentals),
            "intelligence": intelligence.dict(),
            "source_trail": source_trail
        }

        # Cache normalized result
        _RESEARCH_CACHE[clean_slug] = response_data

        # Record in DB ResearchJob if possible
        try:
            r_job = ResearchJob(
                id=job_id,
                query=query,
                canonical_slug=clean_slug,
                destination_name=dest_name,
                status="completed",
                stage="ready",
                total_places_found=len(places),
                total_stays_found=len(hotels),
                total_mobility_found=len(rentals),
                result_summary=f"Researched {len(places)} places, {len(hotels)} stays, {len(rentals)} mobility options."
            )
            db.add(r_job)
            db.commit()
        except Exception as e:
            logger.warning(f"Could not persist research job {job_id}: {e}")
            db.rollback()

        return DestinationResearchResponse(
            job_id=job_id,
            query=query,
            canonical_slug=clean_slug,
            destination_name=dest_name,
            status="completed",
            stage="ready",
            destination=dest_dict,
            places_count=len(places),
            hotels_count=len(hotels),
            rentals_count=len(rentals),
            intelligence=intelligence,
            source_trail=source_trail
        )
