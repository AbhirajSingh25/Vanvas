import os
import sys
import re
import json
from pathlib import Path
from typing import List, Set

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.seed.canonical_dataset import (
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)

BACKEND_PROVIDER = BACKEND_DIR / "app" / "providers" / "artwork_provider.py"

def slugify(s: str) -> str:
    if not s:
        return ""
    s = s.lower().strip()
    s = s.replace("'", "").replace("’", "").replace("`", "")
    s = s.replace("&", "and")
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")

DESTINATION_SLUGS = {
    "goa", "jaipur", "udaipur", "varanasi", "leh", "spiti", "mussoorie", "rishikesh",
    "manali", "dharamshala", "kasol", "jaisalmer", "munnar", "dehradun", "tungnath", "chandrashila",
    "tungnath-chandrashila", "kainchi", "kainchi-dham", "agra", "mathura", "vrindavan",
    "mathura-vrindavan", "neemrana", "damdama", "sohna", "damdama-sohna", "alwar", "siliserh",
    "alwar-siliserh", "sariska", "bhangarh", "sariska-bhangarh", "chandigarh", "morni", "morni-hills",
    "lansdowne", "murthal", "delhi", "mumbai", "amritsar"
}

GENERIC_WORDS = {
    "hill", "view", "cafe", "park", "road", "ridge", "trail", "walk", "bazaar",
    "market", "dining", "kitchen", "dhaba", "food", "temple", "falls", "lake",
    "gate", "tomb", "fort", "palace", "house", "villa", "resort", "hotel",
    "point", "sunset", "river", "riverside", "lakeside", "ghat", "beach", "cove",
    "village", "forest", "rock", "center", "square", "gardens", "garden", "monastery",
    "church", "and", "the", "for", "with", "near", "hall", "lounge", "complex",
    "sanctuary", "heritage", "boutique", "retreat", "cottage", "cottages", "hostel",
    "luxury", "classic", "grand", "royal", "suites", "inn", "old", "city"
} | DESTINATION_SLUGS

def extract_place_aliases(place_name: str, dest_slug: str, image_url: str) -> List[str]:
    aliases: Set[str] = set()
    s_full = slugify(place_name)
    if s_full and s_full not in GENERIC_WORDS:
        aliases.add(s_full)
    
    if image_url:
        asset_stem = Path(image_url).stem
        if asset_stem and asset_stem not in ["hero", "nature", "stay", "cafe", "food", "heritage", "spiritual", "viewpoint", "waterfall", "lake", "monastery", "church", "beach", "transport"]:
            aliases.add(asset_stem)
            stem_no_dest = slugify(asset_stem.replace(dest_slug, ""))
            if stem_no_dest and len(stem_no_dest) >= 4 and stem_no_dest not in GENERIC_WORDS:
                aliases.add(stem_no_dest)
    
    for part in re.split(r"[\(\)&/,\—\–\:]", place_name):
        p_clean = slugify(part)
        if p_clean and len(p_clean) >= 4 and p_clean not in GENERIC_WORDS:
            aliases.add(p_clean)
            
    tokens = [t for t in s_full.split("-") if t and t not in GENERIC_WORDS]
    if tokens:
        if len(tokens[0]) >= 4 and tokens[0] not in GENERIC_WORDS:
            aliases.add(tokens[0])
            aliases.add(f"{tokens[0]}-{dest_slug}")
        if len(tokens) >= 2:
            two_word = f"{tokens[0]}-{tokens[1]}"
            if len(two_word) >= 5 and two_word not in GENERIC_WORDS:
                aliases.add(two_word)
                aliases.add(f"{two_word}-{dest_slug}")
            clean_name = "-".join(tokens)
            if len(clean_name) >= 5 and clean_name not in GENERIC_WORDS:
                aliases.add(clean_name)
                aliases.add(f"{clean_name}-{dest_slug}")
                aliases.add(f"{clean_name}-of-{dest_slug}")
                aliases.add(f"{dest_slug}-{clean_name}")
    
    final_aliases = [a for a in aliases if len(a) >= 4 and a not in GENERIC_WORDS]
    return sorted(list(set(final_aliases)))

def get_theme_from_place(name: str, cat: str) -> str:
    n = name.lower()
    c = (cat or "").lower()
    if any(k in c for k in ["mobility", "rental", "rentals", "transport", "scooter", "motorcycle", "bike", "vehicle", "self-drive", "taxi", "cab"]) or \
       any(k in n for k in ["rentals", "rental", "scooters", "scooter", "motorcycle", "bike hub", "fleet", "self-drive"]):
        return "transport"
    if any(k in c for k in ["stay", "hotel", "resort", "hostel", "homestay", "sanctuary"]):
        return "stay"
    if any(k in n for k in ["hotel", "resort", "homestay", "hostel", "guesthouse", "guest house", "cottage", "palace hotel", "inn &", "inn and"]):
        return "stay"
    if any(k in n for k in ["temple", "ashram", "mandir", "kund", "aarti", "ghat", "dham", "gurudwara", "math"]):
        return "spiritual"
    if any(k in n for k in ["monastery", "gompa", "stupa"]):
        return "monastery"
    if any(k in n for k in ["church", "cathedral", "basilica"]):
        return "church"
    if any(k in n for k in ["cafe", "café", "bakery", "coffee", "bistro", "roastery"]):
        return "cafe"
    if any(k in n for k in ["dhaba", "restaurant", "dining", "lassi", "sweets", "food", "kitchen", "thali", "bhojanalaya"]):
        return "food"
    if any(k in n for k in ["fort", "palace", "haveli", "museum", "ruins", "memorial", "tomb", "archaeological"]):
        return "heritage"
    if any(k in n for k in ["waterfall", "falls"]):
        return "waterfall"
    if any(k in n for k in ["lake", "taal", "tso", "dam", "pichola"]):
        return "lake"
    if any(k in n for k in ["beach", "cove", "coast"]):
        return "beach"
    if any(k in n for k in ["viewpoint", "crest", "top", "sunset point", "peak", "summit", "pass"]):
        return "viewpoint"
    if any(k in n for k in ["trail", "meadow", "forest", "park", "garden", "wildlife", "safari", "sanctuary", "nature"]):
        return "nature"
    if any(k in n for k in ["market", "bazaar", "mall", "chowk", "plaza", "shop"]):
        return "shopping"
    return "nature"

def generate_backend_provider():
    preset_landmarks = [
        ('delhi:qutub-minar', '/images/places/delhi/qutub-minar.jpg', 'Qutub Minar', 'Culture & Heritage', 'heritage', ['qutub-minar', 'qutub', 'qutb-minar']),
        ('delhi:red-fort', '/images/places/delhi/red-fort.jpg', 'Red Fort', 'Culture & Heritage', 'heritage', ['red-fort', 'lal-qila']),
        ('delhi:india-gate', '/images/places/delhi/india-gate.jpg', 'India Gate', 'Culture & Heritage', 'heritage', ['india-gate']),
        ('delhi:lotus-temple', '/images/places/delhi/lotus-temple.jpg', 'Lotus Temple', 'Culture & Heritage', 'spiritual', ['lotus-temple']),
        ('delhi:humayuns-tomb', '/images/places/delhi/humayuns-tomb.webp', "Humayun's Tomb", 'Culture & Heritage', 'heritage', ['humayuns-tomb']),
        ('delhi:akshardham', '/images/places/delhi/akshardham.webp', 'Akshardham Temple', 'Culture & Heritage', 'spiritual', ['akshardham', 'swaminarayan-akshardham']),
        ('delhi:chandni-chowk', '/images/places/delhi/chandni-chowk.jpg', 'Chandni Chowk', 'Shops & Markets', 'shopping', ['chandni-chowk']),
        ('mumbai:gateway-of-india', '/images/places/mumbai/gateway-of-india.webp', 'Gateway of India', 'Culture & Heritage', 'heritage', ['gateway-of-india', 'gateway']),
        ('amritsar:golden-temple', '/images/places/amritsar/golden-temple.jpg', 'Golden Temple', 'Culture & Heritage', 'spiritual', ['golden-temple', 'harmandir-sahib']),
        ('mussoorie:landour-bakehouse', '/images/places/mussoorie/landour-bakehouse.webp', 'Landour Bakehouse', 'Cafés & Bakery', 'cafe', ['landour-bakehouse', 'landour-bakehouse-and-sisters-bazaar', 'landour']),
        ('dharamshala:bhagsunag-waterfall', '/images/places/dharamshala/bhagsunag-waterfall.webp', 'Bhagsunag Waterfall', 'Nature & Trails', 'waterfall', ['bhagsunag-waterfall', 'bhagsu-waterfall', 'bhagsunag-waterfall-and-shiva-cafe', 'bhagsu-waterfall-shiva-cafe', 'bhagsunag']),
        ('dharamshala:namgyal-monastery', '/images/places/dharamshala/namgyal-monastery.webp', 'Namgyal Monastery & Tsuglagkhang Complex', 'Culture & Heritage', 'monastery', ['namgyal-monastery', 'namgyal', 'namgyal-monastery-and-tsuglagkhang-complex', 'tsuglagkhang-complex', 'namgyal-monastery-tsuglagkhang-complex']),
        ('dharamshala:triund-trek', '/images/places/dharamshala/triund-trek.webp', 'Triund High Ridge Himalayan Trek', 'Adventure & Treks', 'nature', ['triund-trek', 'triund', 'triund-high-ridge-himalayan-trek', 'triund-trail', 'triund-trek-base']),
        ('kasol:chalal-trail', '/images/places/kasol/chalal-trail.webp', 'Chalal Trail', 'Nature & Trails', 'nature', ['chalal-trail', 'chalal-pine-trail', 'chalal-riverside-pine-trail', 'chalal-pine-riverside-trail', 'chalal']),
        ('goa:anjuna-beach', '/images/places/goa/anjuna-beach-cove.webp', 'Anjuna Beach Coastline', 'Nature & Trails', 'beach', ['anjuna-beach', 'anjuna-beach-coastline', 'anjuna-beach-cove', 'anjuna']),
    ]

    registry_entries = []
    registered_keys = set()

    for key, img, name, cat, theme, aliases in preset_landmarks:
        alias_str = json.dumps(aliases)
        dest_name = key.split(":")[0].title()
        entry = f"""        "{key}": {{
            "image_url": "{img}",
            "tier": "exact_place",
            "place_name": "{name}",
            "destination": "{dest_name}",
            "category": "{cat}",
            "semantic_theme": "{theme}",
            "visual_description": "Curated sanctuary artwork for {name} in {dest_name}.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": {alias_str}
        }}"""
        registry_entries.append(entry)
        registered_keys.add(key)

    # 1. Add all places
    for dest_slug, places in ADDITIONAL_PLACES_BY_DEST.items():
        dest_name = dest_slug.replace("-", " ").title()
        for p in places:
            p_slug = slugify(p["name"])
            theme = get_theme_from_place(p["name"], p.get("category", ""))
            img_url = p.get("image_url") or f"/images/places/{dest_slug}/{p_slug}.webp"
            desc = p.get("description") or f"Curated experience at {p['name']} in {dest_name}."
            desc = desc.replace('"', '\\"').replace("\n", " ")

            aliases = extract_place_aliases(p["name"], dest_slug, img_url)
            alias_str = json.dumps(aliases)

            key = f"{dest_slug}:{p_slug}"
            entry = f"""        "{key}": {{
            "image_url": "{img_url}",
            "tier": "exact_place",
            "place_name": "{p['name'].replace('"', '\\"')}",
            "destination": "{dest_name}",
            "category": "{p.get('category', 'Curated Place')}",
            "semantic_theme": "{theme}",
            "visual_description": "{desc}",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": {alias_str}
        }}"""
            if key not in registered_keys:
                registry_entries.append(entry)
                registered_keys.add(key)

    # 2. Add all hotels (Stays)
    for dest_slug, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
        dest_name = dest_slug.replace("-", " ").title()
        for h in hotels:
            h_slug = slugify(h["name"])
            key = f"{dest_slug}:{h_slug}"
            img_url = h.get("image_url") or f"/images/places/{dest_slug}/stays/{h_slug}.webp"
            style = h.get("hotel_style") or h.get("badge") or "Boutique Sanctuary"
            desc = f"Verified property artwork for {h['name']} in {dest_name}."
            
            aliases = extract_place_aliases(h["name"], dest_slug, img_url)
            alias_str = json.dumps(aliases)

            entry = f"""        "{key}": {{
            "image_url": "{img_url}",
            "tier": "exact_place",
            "place_name": "{h['name'].replace('"', '\\"')}",
            "destination": "{dest_name}",
            "category": "Stays & Sanctuaries",
            "hotel_style": "{style}",
            "semantic_theme": "stay",
            "visual_description": "{desc}",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": {alias_str}
        }}"""
            if key not in registered_keys:
                registry_entries.append(entry)
                registered_keys.add(key)

    # 3. Build DESTINATION_CATEGORY_REGISTRY
    dest_cat_entries = []
    for d in CANONICAL_26_DESTINATIONS:
        slug = d["slug"]
        hero_img = d.get("hero_image") or f"/images/destinations/{slug}/hero.jpg"
        entry = f"""        "{slug}": {{
            "generic": "{hero_img}",
            "categories": {{
                "stay": "/images/places/{slug}/categories/stay.webp",
                "cafe": "/images/places/{slug}/categories/cafe.webp",
                "food": "/images/places/{slug}/categories/food.webp",
                "nature": "/images/places/{slug}/categories/nature.webp",
                "trail": "/images/places/{slug}/categories/nature.webp",
                "heritage": "/images/places/{slug}/categories/heritage.webp",
                "spiritual": "/images/places/{slug}/categories/spiritual.webp",
                "viewpoint": "/images/places/{slug}/categories/viewpoint.webp",
                "waterfall": "/images/places/{slug}/categories/waterfall.webp",
                "lake": "/images/places/{slug}/categories/lake.webp",
                "monastery": "/images/places/{slug}/categories/monastery.webp",
                "church": "/images/places/{slug}/categories/church.webp",
                "beach": "/images/places/{slug}/categories/beach.webp",
                "shopping": "/images/places/{slug}/categories/cafe.webp",
                "transport": "/images/nearby/transport/transport.webp"
            }}
        }}"""
        dest_cat_entries.append(entry)

    joined_registry = ",\n".join(registry_entries)
    joined_dest_cats = ",\n".join(dest_cat_entries)

    part1 = """import os
import re
import json
import logging
from typing import Dict, Any, Optional, List, Set, Tuple
from app.core.config import settings
from app.providers.base import ArtworkProvider

logger = logging.getLogger("vanvas.artwork")

GENERIC_WORDS = {
    "hotel", "resort", "homestay", "hostel", "guesthouse", "guest-house", "cottage", "palace", "haveli",
    "cafe", "cafes", "restaurant", "dhaba", "dining", "retreat", "sanctuary", "temple", "monastery",
    "ashram", "waterfall", "falls", "lake", "viewpoint", "point", "sunset", "trail", "trek", "park",
    "garden", "gardens", "bazaar", "market", "chowk", "ghat", "dham", "mandir", "wood", "woods", "stone",
    "himalayan", "apple", "orchard", "loft", "lodge", "camp", "camps", "villa", "villas", "inn", "house",
    "hub", "fleet", "rentals", "rental", "scooters", "scooter", "bike", "bikes", "motorcycle", "self-drive",
    "drift", "acoustic", "hill", "hills", "view", "views", "pine", "cedar", "beach", "coast", "coastline",
    "cove", "ridge", "estate", "residency", "stay", "stays", "traveler", "circle", "square"
}

class CuratedArtworkProvider(ArtworkProvider):
    \"\"\"
    Production Curated & Local Artwork Resolver.
    Provides deterministic place-specific visual intelligence adhering to the strict Resolution Hierarchy:
    LEVEL 1: Verified real external / live photograph
    LEVEL 2: Verified local asset file on disk
    LEVEL 3: Curated exact-place / hotel artwork
    LEVEL 4: Destination-scoped alias matching
    LEVEL 5: Destination category fallback
    LEVEL 6: Universal fallback
    \"\"\"

    PLACE_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {
""" + joined_registry + """
    }

    DESTINATION_CATEGORY_REGISTRY: Dict[str, Dict[str, Any]] = {
""" + joined_dest_cats + """
    }

    REGIONAL_FALLBACK_REGISTRY: Dict[str, Dict[str, str]] = {
        "himalayan": {
            "nature": "/images/destinations/fallbacks/himalayan.jpg",
            "trail": "/images/destinations/fallbacks/himalayan.jpg",
            "viewpoint": "/images/destinations/fallbacks/himalayan.jpg",
            "spiritual": "/images/places/universal/spiritual.webp",
            "stay": "/images/places/universal/homestay.webp",
            "cafe": "/images/places/universal/cafe.webp",
            "food": "/images/places/universal/food.webp",
            "transport": "/images/places/universal/transport.webp",
        },
        "coastal": {
            "nature": "/images/destinations/fallbacks/coastal.jpg",
            "beach": "/images/destinations/fallbacks/coastal.jpg",
            "viewpoint": "/images/destinations/fallbacks/coastal.jpg",
            "spiritual": "/images/places/universal/spiritual.webp",
            "stay": "/images/places/universal/resort.webp",
            "cafe": "/images/places/universal/cafe.webp",
            "food": "/images/places/universal/food.webp",
            "transport": "/images/places/universal/transport.webp",
        },
        "desert": {
            "nature": "/images/destinations/fallbacks/desert.jpg",
            "heritage": "/images/destinations/fallbacks/desert.jpg",
            "viewpoint": "/images/destinations/fallbacks/desert.jpg",
            "spiritual": "/images/places/universal/spiritual.webp",
            "stay": "/images/places/universal/heritage.webp",
            "cafe": "/images/places/universal/cafe.webp",
            "food": "/images/places/universal/food.webp",
            "transport": "/images/places/universal/transport.webp",
        },
        "valley": {
            "nature": "/images/destinations/fallbacks/valley.jpg",
            "spiritual": "/images/places/universal/spiritual.webp",
            "heritage": "/images/destinations/fallbacks/valley.jpg",
            "stay": "/images/places/universal/stay.webp",
            "cafe": "/images/places/universal/cafe.webp",
            "food": "/images/places/universal/food.webp",
            "transport": "/images/places/universal/transport.webp",
        }
    }

    def __init__(self):
        super().__init__()
        self._alias_map: Dict[str, str] = {}
        for key, item in self.PLACE_ARTWORK_REGISTRY.items():
            dest = key.split(":")[0]
            for al in item.get("aliases", []):
                self._alias_map[f"{dest}:{al}"] = key

    def _clean_str(self, s: str) -> str:
        if not s:
            return ""
        s = s.lower().strip()
        s = s.replace("'", "").replace("’", "").replace("`", "")
        s = s.replace("&", "and")
        s = re.sub(r"[^\\w\\s-]", "", s)
        s = re.sub(r"[\\s_-]+", "-", s)
        return s.strip("-")

    def _classify_category_theme(self, category: str, place_name: str = "") -> str:
        cat = (category or "").lower()
        name = (place_name or "").lower()

        if any(w in cat for w in ["mobility", "rental", "rentals", "transport", "scooter", "motorcycle", "bike", "vehicle", "self-drive", "taxi", "cab"]) or \
           any(w in name for w in ["rentals", "rental", "scooters", "scooter", "motorcycle", "bike hub", "fleet", "self-drive"]):
            return "transport"
        if any(w in cat for w in ["stay", "hotel", "resort", "hostel", "homestay", "retreat", "sanctuary"]) or \
           any(w in name for w in ["hotel", "resort", "homestay", "hostel", "guesthouse", "guest house", "cottage", "palace hotel", "inn &", "inn and"]):
            return "stay"
        if any(w in cat for w in ["cafe", "café", "bakery", "coffee", "bistro", "roastery"]) or \
           any(w in name for w in ["cafe", "café", "bakery", "coffee", "bistro", "roastery"]):
            return "cafe"
        if any(w in cat for w in ["food", "dining", "restaurant", "dhaba", "thali", "sweets", "lassi", "eatery"]) or \
           any(w in name for w in ["dhaba", "restaurant", "dining", "lassi", "sweets", "food", "kitchen", "thali", "bhojanalaya"]):
            return "food"
        if any(w in cat for w in ["waterfall", "falls"]) or any(w in name for w in ["waterfall", "falls"]):
            return "waterfall"
        if any(w in cat for w in ["lake", "taal", "tso", "dam", "pichola"]) or any(w in name for w in ["lake", "taal", "tso", "dam", "pichola"]):
            return "lake"
        if any(w in cat for w in ["beach", "cove", "coast"]) or any(w in name for w in ["beach", "cove", "coast"]):
            return "beach"
        if any(w in cat for w in ["viewpoint", "view", "sunset", "crest", "top", "peak", "summit", "pass"]) or \
           any(w in name for w in ["viewpoint", "crest", "top", "sunset point", "peak", "summit", "pass"]):
            return "viewpoint"
        if any(w in cat for w in ["monastery", "gompa", "stupa"]) or any(w in name for w in ["monastery", "gompa", "stupa"]):
            return "monastery"
        if any(w in cat for w in ["church", "cathedral", "basilica"]) or any(w in name for w in ["church", "cathedral", "basilica"]):
            return "church"
        if any(w in cat for w in ["spiritual", "temple", "ashram", "mandir", "kund", "aarti", "ghat", "dham", "gurudwara", "mosque", "dargah"]) or \
           any(w in name for w in ["temple", "ashram", "mandir", "kund", "aarti", "ghat", "dham", "gurudwara", "math"]):
            return "spiritual"
        if any(w in cat for w in ["heritage", "fort", "palace", "haveli", "museum", "ruins", "memorial", "tomb", "archaeological", "monument", "history", "culture"]) or \
           any(w in name for w in ["fort", "palace", "haveli", "museum", "ruins", "memorial", "tomb", "archaeological"]):
            return "heritage"
        if any(w in cat for w in ["shopping", "market", "bazaar", "mall", "chowk", "plaza", "shop"]) or \
           any(w in name for w in ["market", "bazaar", "mall", "chowk", "plaza", "shop"]):
            return "shopping"
        if any(w in cat for w in ["nature", "trail", "trek", "park", "wildlife", "safari", "sanctuary", "forest", "meadow", "adventure", "gardens"]) or \
           any(w in name for w in ["trail", "meadow", "forest", "park", "garden", "wildlife", "safari", "sanctuary", "nature"]):
            return "nature"

        return "nature"

    def _get_universal_fallback(self, theme: str) -> str:
        mapping = {
            "stay": "/images/places/universal/stay.webp",
            "cafe": "/images/places/universal/cafe.webp",
            "food": "/images/places/universal/food.webp",
            "nature": "/images/places/universal/nature.webp",
            "trail": "/images/places/universal/nature.webp",
            "heritage": "/images/places/universal/heritage.webp",
            "spiritual": "/images/places/universal/spiritual.webp",
            "viewpoint": "/images/places/universal/viewpoint.webp",
            "waterfall": "/images/places/universal/waterfall.webp",
            "lake": "/images/places/universal/lake.webp",
            "monastery": "/images/places/universal/monastery.webp",
            "church": "/images/places/universal/church.webp",
            "beach": "/images/places/universal/beach.webp",
            "shopping": "/images/places/universal/cafe.webp",
            "transport": "/images/places/universal/transport.webp"
        }
        return mapping.get(theme, "/images/places/universal/nature.webp")

    def _get_regional_fallback(self, category: str, destination_name: str) -> str:
        cat_lower = category.lower()
        dest_lower = destination_name.lower()
        if any(w in cat_lower for w in ["beach", "sea", "ocean", "coast", "cove", "island"]) or any(w in dest_lower for w in ["goa", "gokarna", "varkala", "andaman", "pondicherry", "alappuzha"]):
            return "/images/destinations/fallbacks/coastal.jpg"
        if any(w in cat_lower for w in ["desert", "dune", "camel", "fort", "haveli", "sand"]) or any(w in dest_lower for w in ["jaisalmer", "jodhpur", "bikaner", "pushkar", "jaipur", "udaipur", "alwar", "sariska", "neemrana"]):
            return "/images/destinations/fallbacks/desert.jpg"
        if any(w in cat_lower for w in ["ghat", "river", "temple", "spiritual", "aarti", "monument", "heritage", "bazaar", "market", "metro", "city"]) or any(w in dest_lower for w in ["varanasi", "ayodhya", "rishikesh", "haridwar", "ujjain", "hampi", "delhi", "agra", "lucknow", "amritsar", "ncr", "chandigarh", "mathura"]):
            return "/images/destinations/fallbacks/valley.jpg"
        return "/images/destinations/fallbacks/himalayan.jpg"

    @classmethod
    def detect_artwork_collisions(cls) -> List[str]:
        asset_map: Dict[str, List[str]] = {}
        warnings: List[str] = []
        for key, item in cls.PLACE_ARTWORK_REGISTRY.items():
            img_url = item["image_url"]
            if img_url not in asset_map:
                asset_map[img_url] = []
            asset_map[img_url].append(key)
        for img_url, keys in asset_map.items():
            if len(keys) > 1:
                first_place = keys[0].split(":")[0]
                same_dest = all(k.split(":")[0] == first_place for k in keys)
                if not same_dest and "/places/universal/" not in img_url and "/categories/" not in img_url:
                    msg = f"ARTWORK COLLISION: asset {img_url} assigned to multiple exact keys: {', '.join(keys)}"
                    logger.warning(msg)
                    warnings.append(msg)
        return warnings

    async def get_artwork_metadata(self, artwork_key: str) -> Optional[Dict[str, Any]]:
        if artwork_key in self.PLACE_ARTWORK_REGISTRY:
            return self.PLACE_ARTWORK_REGISTRY[artwork_key]
        if artwork_key in self._alias_map:
            return self.PLACE_ARTWORK_REGISTRY[self._alias_map[artwork_key]]
        return None

    async def resolve_place_artwork(
        self,
        place_name: str,
        destination_name: str,
        category: str,
        locality: Optional[str] = None,
        source_id: Optional[str] = None,
        existing_image_url: Optional[str] = None,
        is_live: Optional[bool] = None,
        source: Optional[str] = None
    ) -> Dict[str, Any]:
        dest_norm = self._clean_str(destination_name)
        place_norm = self._clean_str(place_name)
        theme = self._classify_category_theme(category, place_name)
        universal_fallback = self._get_universal_fallback(theme)

        # Match destination key in category registry
        matched_dest = None
        for k in self.DESTINATION_CATEGORY_REGISTRY:
            if dest_norm == k or dest_norm in k or k in dest_norm:
                matched_dest = k
                break

        dest_config = self.DESTINATION_CATEGORY_REGISTRY.get(matched_dest) if matched_dest else None
        dest_category_fallback = dest_config["categories"].get(theme) if dest_config else None
        safe_fallback = dest_category_fallback or universal_fallback

        # LEVEL 1: Verified Real External / Live Provider Photograph
        if existing_image_url and (existing_image_url.startswith("http://") or existing_image_url.startswith("https://")) and "placeholder" not in existing_image_url:
            is_wm = "wikimedia.org" in existing_image_url or "wikidata.org" in existing_image_url
            badge = "EXACT PLACE PHOTO" if is_wm else ("LIVE PLACE PHOTO" if is_live else "VANVAS PLACE ARTWORK")
            return {
                "url": existing_image_url,
                "fallback_url": safe_fallback,
                "source": "wikimedia" if is_wm else (source or "live_provider"),
                "source_type": "real_photo",
                "provenance": "exact_place" if is_wm else ("live_place" if is_live else "destination_category"),
                "semantic_category": theme,
                "exactness": "exact" if (is_wm or is_live) else "approximate",
                "attribution": "Wikimedia Commons / Verified Open Source" if is_wm else "Live Provider Photograph",
                "alt_text": f"{place_name} in {destination_name}",
                "badge_label": badge,
                "artwork_key": f"photo:{place_norm}",
                "image_url": existing_image_url,
                "tier": "exact_place" if is_wm else "live_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": True,
                "badge": badge,
                "visual_description": f"Verified photograph of {place_name}."
            }

        # LEVEL 2: Verified Local Asset File on Disk (Direct Exact Match)
        if existing_image_url and existing_image_url.startswith("/images/") and not any(k in existing_image_url for k in ["/categories/", "/fallbacks/", "/universal/"]):
            badge = "VANVAS PLACE ARTWORK"
            return {
                "url": existing_image_url,
                "fallback_url": safe_fallback,
                "source": source or "vanvas_curated",
                "source_type": "editorial_artwork",
                "provenance": "exact_place",
                "semantic_category": theme,
                "exactness": "exact",
                "attribution": "VANVAS Verified Editorial Asset",
                "alt_text": f"{place_name} in {destination_name}",
                "badge_label": badge,
                "artwork_key": f"exact:{dest_norm}:{place_norm}",
                "image_url": existing_image_url,
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": badge,
                "visual_description": f"Verified editorial asset for {place_name}."
            }

        # LEVEL 3: Curated Exact Place Match (Direct Key Lookup & Alias Map)
        lookup_key = f"{dest_norm}:{place_norm}"
        target_key = None
        if lookup_key in self.PLACE_ARTWORK_REGISTRY:
            target_key = lookup_key
        elif lookup_key in self._alias_map:
            target_key = self._alias_map[lookup_key]

        if target_key:
            item = self.PLACE_ARTWORK_REGISTRY[target_key]
            return {
                "url": item["image_url"],
                "fallback_url": safe_fallback,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": item.get("semantic_theme", theme),
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Editorial Asset"),
                "alt_text": f"{place_name} in {destination_name}",
                "badge_label": "VANVAS PLACE ARTWORK",
                "artwork_key": target_key,
                "image_url": item["image_url"],
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": "VANVAS PLACE ARTWORK",
                "visual_description": item.get("visual_description"),
                "metadata": item
            }

        # LEVEL 4: Destination-Scoped Alias Matching
        best_exact_match: Optional[Tuple[str, Dict[str, Any]]] = None
        for reg_key, item in self.PLACE_ARTWORK_REGISTRY.items():
            reg_dest, reg_place = reg_key.split(":")
            if reg_dest == dest_norm:
                aliases = item.get("aliases", [reg_place])
                if place_norm == reg_place or place_norm in aliases:
                    best_exact_match = (reg_key, item)
                    break
                for al in aliases:
                    if len(al) >= 4 and al not in GENERIC_WORDS and (place_norm.startswith(f"{al}-") or place_norm.endswith(f"-{al}") or f"-{al}-" in place_norm):
                        best_exact_match = (reg_key, item)
                        break
                if best_exact_match:
                    break

        if best_exact_match:
            reg_key, item = best_exact_match
            return {
                "url": item["image_url"],
                "fallback_url": safe_fallback,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": item.get("semantic_theme", theme),
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Editorial Asset"),
                "alt_text": f"{place_name} in {destination_name}",
                "badge_label": "VANVAS PLACE ARTWORK",
                "artwork_key": reg_key,
                "image_url": item["image_url"],
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": "VANVAS PLACE ARTWORK",
                "visual_description": item.get("visual_description"),
                "metadata": item
            }

        # LEVEL 5: Destination Category Fallback
        if dest_config and dest_config["categories"].get(theme):
            cat_asset = dest_config["categories"][theme]
            return {
                "url": cat_asset,
                "fallback_url": universal_fallback,
                "source": "vanvas_curated",
                "source_type": "category_photo",
                "provenance": "destination_category",
                "semantic_category": theme,
                "exactness": "category_matched",
                "attribution": f"VANVAS Curated {destination_name} Atmosphere",
                "alt_text": f"{place_name} in {destination_name}",
                "badge_label": "DESTINATION CATEGORY ART",
                "artwork_key": f"{matched_dest}:{theme}",
                "image_url": cat_asset,
                "tier": "destination_category",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": "DESTINATION CATEGORY ART",
                "visual_description": f"Authentic {destination_name} {theme} visual."
            }

        # LEVEL 6 & 7: Universal Fallback
        return {
            "url": universal_fallback,
            "fallback_url": universal_fallback,
            "source": "vanvas_universal",
            "source_type": "category_photo",
            "provenance": "universal_fallback",
            "semantic_category": theme,
            "exactness": "approximate",
            "attribution": "VANVAS Universal Travel Atmosphere",
            "alt_text": f"{place_name} in {destination_name}",
            "badge_label": "UNIVERSAL FALLBACK",
            "artwork_key": f"universal:{theme}",
            "image_url": universal_fallback,
            "tier": "universal_fallback",
            "place_name": place_name,
            "destination": destination_name,
            "category": category,
            "is_real_photo": False,
            "badge": "UNIVERSAL FALLBACK",
            "visual_description": f"Universal visual for {category}."
        }

class OptionalAIArtworkProvider(CuratedArtworkProvider):
    \"\"\"
    Artwork provider that utilizes curated sanctuary assets and supports optional AI extensions.
    \"\"\"
    def __init__(self, groq_api_key: Optional[str] = None):
        super().__init__()
        self.groq_api_key = groq_api_key
"""
    return part1

if __name__ == "__main__":
    py_code = generate_backend_provider()
    with open(BACKEND_PROVIDER, "w", encoding="utf-8") as f:
        f.write(py_code)
    print(f"[SUCCESS] Wrote {len(py_code)} bytes to {BACKEND_PROVIDER}")
