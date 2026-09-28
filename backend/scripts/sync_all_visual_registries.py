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

FRONTEND_RESOLVER = ROOT_DIR / "frontend" / "lib" / "placeVisualResolver.ts"

def slugify(s: str) -> str:
    if not s:
        return ""
    s = s.lower().strip()
    s = s.replace("'", "").replace("’", "").replace("`", "")
    s = s.replace("&", "and")
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")

GENERIC_WORDS = {
    "hill", "view", "cafe", "park", "road", "ridge", "trail", "walk", "bazaar",
    "market", "dining", "kitchen", "dhaba", "food", "temple", "falls", "lake",
    "gate", "tomb", "fort", "palace", "house", "villa", "resort", "hotel",
    "point", "sunset", "river", "riverside", "lakeside", "ghat", "beach", "cove",
    "village", "forest", "rock", "center", "square", "gardens", "garden", "monastery",
    "church", "and", "the", "for", "with", "near", "hall", "lounge", "complex",
    "sanctuary", "heritage", "boutique", "retreat", "cottage", "cottages", "hostel",
    "luxury", "classic", "grand", "royal", "suites", "inn", "old", "city"
}

def extract_place_aliases(place_name: str, dest_slug: str, image_url: str) -> List[str]:
    aliases: Set[str] = set()
    s_full = slugify(place_name)
    if s_full:
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
            if len(two_word) >= 5:
                aliases.add(two_word)
                aliases.add(f"{two_word}-{dest_slug}")
            clean_name = "-".join(tokens)
            if len(clean_name) >= 5:
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

def generate_frontend_code():
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
    ]

    exact_place_entries = []
    registered_place_keys = set()

    for key, img, desc, cat, theme, aliases in preset_landmarks:
        alias_str = ",\n      ".join(f'"{a}"' for a in aliases)
        entry = f"""  "{key}": {{
    imageUrl: "{img}",
    visualDescription: "{desc}",
    category: "{cat}",
    semanticTheme: "{theme}",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      {alias_str}
    ]
  }}"""
        exact_place_entries.append(entry)
        registered_place_keys.add(key)

    # Add all canonical places
    for dest_slug, places in ADDITIONAL_PLACES_BY_DEST.items():
        for p in places:
            p_slug = slugify(p.get("slug") or p["name"])
            key1 = f"{dest_slug}:{p_slug}"
            
            theme = get_theme_from_place(p["name"], p.get("category", "Must Visit"))
            img_url = p.get("image_url") or f"/images/places/{dest_slug}/{p_slug}.webp"
            
            desc = (p.get("description") or f"Curated visual of {p['name']}.").replace('"', '\\"')
            if len(desc) > 150:
                desc = desc[:147] + "..."

            aliases = extract_place_aliases(p["name"], dest_slug, img_url)
            alias_str = ",\n      ".join(f'"{a}"' for a in aliases)

            entry = f"""  "{key1}": {{
    imageUrl: "{img_url}",
    visualDescription: "{desc}",
    category: "{p.get('category', 'Curated Place')}",
    semanticTheme: "{theme}",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      {alias_str}
    ]
  }}"""
            if key1 not in registered_place_keys:
                exact_place_entries.append(entry)
                registered_place_keys.add(key1)

    # 2. Build EXACT_HOTEL_REGISTRY
    exact_hotel_entries = []
    registered_hotel_keys = set()

    for dest_slug, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
        for h in hotels:
            h_slug = slugify(h["name"])
            key = f"{dest_slug}:{h_slug}"
            img_url = h.get("image_url") or f"/images/places/{dest_slug}/stays/{h_slug}.webp"
            style = h.get("hotel_style") or h.get("badge") or "Boutique Sanctuary"
            desc = f"Verified property artwork for {h['name']} in {dest_slug.title()}."
            
            aliases = extract_place_aliases(h["name"], dest_slug, img_url)
            alias_str = ",\n      ".join(f'"{a}"' for a in aliases)

            entry = f"""  "{key}": {{
    imageUrl: "{img_url}",
    visualDescription: "{desc}",
    category: "Stays & Sanctuaries",
    hotelStyle: "{style}",
    semanticTheme: "stay",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      {alias_str}
    ]
  }}"""
            if key not in registered_hotel_keys:
                exact_hotel_entries.append(entry)
                registered_hotel_keys.add(key)

    # 3. Build DESTINATION_CATEGORY_REGISTRY
    dest_cat_entries = []
    for d in CANONICAL_26_DESTINATIONS:
        slug = d["slug"]
        hero_img = d.get("hero_image") or f"/images/destinations/{slug}/hero.jpg"
        entry = f"""  "{slug}": {{
    generic: "{hero_img}",
    categories: {{
      stay: "/images/places/{slug}/categories/stay.webp",
      cafe: "/images/places/{slug}/categories/cafe.webp",
      food: "/images/places/{slug}/categories/food.webp",
      nature: "/images/places/{slug}/categories/nature.webp",
      trail: "/images/places/{slug}/categories/nature.webp",
      heritage: "/images/places/{slug}/categories/heritage.webp",
      spiritual: "/images/places/{slug}/categories/spiritual.webp",
      viewpoint: "/images/places/{slug}/categories/viewpoint.webp",
      waterfall: "/images/places/{slug}/categories/waterfall.webp",
      lake: "/images/places/{slug}/categories/lake.webp",
      monastery: "/images/places/{slug}/categories/monastery.webp",
      church: "/images/places/{slug}/categories/church.webp",
      beach: "/images/places/{slug}/categories/beach.webp",
      shopping: "/images/places/{slug}/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }}
  }}"""
        dest_cat_entries.append(entry)

    # Generate the whole placeVisualResolver.ts file
    ts_code = f"""/**
 * VANVAS Central Visual Intelligence & Place / Hotel Artwork Resolver
 * 
 * Strict 10-Level Resolution Hierarchy:
 * LEVEL 1: Verified exact-place real photograph -> [ EXACT PLACE PHOTO ]
 * LEVEL 2: Verified exact-place Wikimedia / trusted photo -> [ EXACT PLACE PHOTO ]
 * LEVEL 3: Verified provider / live place photo -> [ LIVE PLACE PHOTO ]
 * LEVEL 4: Curated exact-place / hotel artwork (unique to landmark/property) -> [ VANVAS PLACE ARTWORK ]
 * LEVEL 5: Place-type / category-specific real photograph -> [ DESTINATION CATEGORY ART ]
 * LEVEL 6: Place-type / category-specific destination artwork -> [ DESTINATION CATEGORY ART ]
 * LEVEL 7: Regional category artwork -> [ REGIONAL ART ]
 * LEVEL 8: Universal category artwork -> [ UNIVERSAL FALLBACK ]
 * LEVEL 9: Generic destination artwork -> [ DESTINATION ART ]
 * LEVEL 10: Guaranteed universal safety fallback -> [ UNIVERSAL FALLBACK ]
 */

import {{ ImageContract, ProvenanceBadge, ImageProvenanceTier, ImageSourceType, ImageExactness }} from "@/types";

export type VisualCategory =
  | "food"
  | "restaurant"
  | "cafe"
  | "bakery"
  | "street_food"
  | "market"
  | "shopping"
  | "hotel"
  | "hostel"
  | "homestay"
  | "guesthouse"
  | "stay"
  | "temple"
  | "church"
  | "mosque"
  | "monastery"
  | "ashram"
  | "heritage"
  | "fort"
  | "palace"
  | "museum"
  | "gallery"
  | "trail"
  | "nature"
  | "waterfall"
  | "lake"
  | "beach"
  | "viewpoint"
  | "adventure"
  | "wildlife"
  | "transport"
  | "scooter"
  | "bike"
  | "mobility"
  | "activity"
  | "wellness"
  | "yoga";

export interface ExactPlaceEntry {{
  imageUrl: string;
  visualDescription?: string;
  category?: string;
  semanticTheme?: string;
  sourceType?: string;
  source?: string;
  aliases?: string[];
  hotelStyle?: string;
}}

export const EXACT_PLACE_REGISTRY: Record<string, ExactPlaceEntry> = {{
{',\n'.join(exact_place_entries)}
}};

export const EXACT_HOTEL_REGISTRY: Record<string, ExactPlaceEntry> = {{
{',\n'.join(exact_hotel_entries)}
}};

export const DESTINATION_CATEGORY_REGISTRY: Record<
  string,
  {{
    generic: string;
    categories: Partial<Record<string, string>>;
  }}
> = {{
{',\n'.join(dest_cat_entries)}
}};

export const REGIONAL_FALLBACK_REGISTRY: Record<
  "himalayan" | "coastal" | "desert" | "valley",
  Partial<Record<string, string>>
> = {{
  himalayan: {{
    nature: "/images/destinations/fallbacks/himalayan.jpg",
    trail: "/images/destinations/fallbacks/himalayan.jpg",
    viewpoint: "/images/destinations/fallbacks/himalayan.jpg",
    adventure: "/images/destinations/fallbacks/himalayan.jpg",
    waterfall: "/images/destinations/fallbacks/himalayan.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/homestay.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  }},
  coastal: {{
    nature: "/images/destinations/fallbacks/coastal.jpg",
    beach: "/images/destinations/fallbacks/coastal.jpg",
    viewpoint: "/images/destinations/fallbacks/coastal.jpg",
    adventure: "/images/destinations/fallbacks/coastal.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/resort.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  }},
  desert: {{
    nature: "/images/destinations/fallbacks/desert.jpg",
    heritage: "/images/destinations/fallbacks/desert.jpg",
    viewpoint: "/images/destinations/fallbacks/desert.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/heritage.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  }},
  valley: {{
    nature: "/images/destinations/fallbacks/valley.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    heritage: "/images/destinations/fallbacks/valley.jpg",
    viewpoint: "/images/destinations/fallbacks/valley.jpg",
    stay: "/images/places/universal/stay.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  }},
}};

function cleanString(str?: string): string {{
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[''’`]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/[\\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}}

export function classifyCategoryTheme(category?: string, placeName?: string): string {{
  const cat = (category || "").toLowerCase();
  const name = (placeName || "").toLowerCase();

  if (
    cat.includes("stay") ||
    cat.includes("hotel") ||
    cat.includes("resort") ||
    cat.includes("hostel") ||
    cat.includes("homestay") ||
    cat.includes("retreat") ||
    cat.includes("sanctuary") ||
    name.includes("hotel") ||
    name.includes("resort") ||
    name.includes("homestay") ||
    name.includes("hostel") ||
    name.includes("guesthouse") ||
    name.includes("cottage") ||
    name.includes("palace hotel") ||
    name.includes("inn &") ||
    name.includes("inn and")
  ) {{
    return "stay";
  }}

  if (
    cat.includes("cafe") ||
    cat.includes("café") ||
    cat.includes("bakery") ||
    cat.includes("coffee") ||
    cat.includes("bistro") ||
    cat.includes("roastery") ||
    name.includes("cafe") ||
    name.includes("café") ||
    name.includes("bakery") ||
    name.includes("coffee") ||
    name.includes("bistro") ||
    name.includes("roastery")
  ) {{
    return "cafe";
  }}

  if (
    cat.includes("food") ||
    cat.includes("restaurant") ||
    cat.includes("dhaba") ||
    cat.includes("dining") ||
    cat.includes("thali") ||
    cat.includes("sweets") ||
    cat.includes("lassi") ||
    name.includes("dhaba") ||
    name.includes("restaurant") ||
    name.includes("dining") ||
    name.includes("lassi") ||
    name.includes("sweets") ||
    name.includes("food") ||
    name.includes("kitchen") ||
    name.includes("thali") ||
    name.includes("bhojanalaya")
  ) {{
    return "food";
  }}

  if (cat.includes("waterfall") || cat.includes("falls") || name.includes("waterfall") || name.includes("falls")) {{
    return "waterfall";
  }}

  if (cat.includes("lake") || cat.includes("taal") || cat.includes("tso") || cat.includes("dam") || name.includes("lake") || name.includes("taal") || name.includes("tso") || name.includes("dam") || name.includes("pichola")) {{
    return "lake";
  }}

  if (cat.includes("beach") || cat.includes("cove") || cat.includes("coast") || name.includes("beach") || name.includes("cove") || name.includes("coast")) {{
    return "beach";
  }}

  if (
    cat.includes("viewpoint") ||
    cat.includes("crest") ||
    cat.includes("top") ||
    cat.includes("sunset") ||
    cat.includes("peak") ||
    cat.includes("summit") ||
    cat.includes("pass") ||
    name.includes("viewpoint") ||
    name.includes("crest") ||
    name.includes("top") ||
    name.includes("sunset point") ||
    name.includes("peak") ||
    name.includes("summit") ||
    name.includes("pass")
  ) {{
    return "viewpoint";
  }}

  if (cat.includes("monastery") || cat.includes("gompa") || cat.includes("stupa") || name.includes("monastery") || name.includes("gompa") || name.includes("stupa")) {{
    return "monastery";
  }}

  if (cat.includes("church") || cat.includes("cathedral") || cat.includes("basilica") || name.includes("church") || name.includes("cathedral") || name.includes("basilica")) {{
    return "church";
  }}

  if (
    cat.includes("spiritual") ||
    cat.includes("temple") ||
    cat.includes("ashram") ||
    cat.includes("mandir") ||
    cat.includes("kund") ||
    cat.includes("aarti") ||
    cat.includes("ghat") ||
    cat.includes("dham") ||
    cat.includes("gurudwara") ||
    name.includes("temple") ||
    name.includes("ashram") ||
    name.includes("mandir") ||
    name.includes("kund") ||
    name.includes("aarti") ||
    name.includes("ghat") ||
    name.includes("dham") ||
    name.includes("gurudwara") ||
    name.includes("math")
  ) {{
    return "spiritual";
  }}

  if (
    cat.includes("heritage") ||
    cat.includes("fort") ||
    cat.includes("palace") ||
    cat.includes("haveli") ||
    cat.includes("museum") ||
    cat.includes("ruins") ||
    cat.includes("memorial") ||
    cat.includes("tomb") ||
    cat.includes("archaeological") ||
    cat.includes("monument") ||
    name.includes("fort") ||
    name.includes("palace") ||
    name.includes("haveli") ||
    name.includes("museum") ||
    name.includes("ruins") ||
    name.includes("memorial") ||
    name.includes("tomb") ||
    name.includes("archaeological")
  ) {{
    return "heritage";
  }}

  if (
    cat.includes("shopping") ||
    cat.includes("market") ||
    cat.includes("bazaar") ||
    cat.includes("mall") ||
    cat.includes("chowk") ||
    cat.includes("plaza") ||
    cat.includes("shop") ||
    name.includes("market") ||
    name.includes("bazaar") ||
    name.includes("mall") ||
    name.includes("chowk") ||
    name.includes("plaza") ||
    name.includes("shop")
  ) {{
    return "shopping";
  }}

  if (
    cat.includes("mobility") ||
    cat.includes("rental") ||
    cat.includes("transport") ||
    cat.includes("scooter") ||
    cat.includes("motorcycle") ||
    cat.includes("bike") ||
    cat.includes("vehicle") ||
    name.includes("rentals") ||
    name.includes("rental") ||
    name.includes("scooters") ||
    name.includes("scooter") ||
    name.includes("bike hub") ||
    name.includes("fleet")
  ) {{
    return "transport";
  }}

  if (
    cat.includes("nature") ||
    cat.includes("trail") ||
    cat.includes("trek") ||
    cat.includes("park") ||
    cat.includes("wildlife") ||
    cat.includes("safari") ||
    cat.includes("sanctuary") ||
    cat.includes("forest") ||
    cat.includes("meadow") ||
    cat.includes("adventure") ||
    name.includes("trail") ||
    name.includes("meadow") ||
    name.includes("forest") ||
    name.includes("park") ||
    name.includes("garden") ||
    name.includes("wildlife") ||
    name.includes("safari") ||
    name.includes("sanctuary") ||
    name.includes("nature")
  ) {{
    return "nature";
  }}

  return "nature";
}}

export function getUniversalFallback(theme: string): string {{
  const mapping: Record<string, string> = {{
    stay: "/images/places/universal/stay.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    nature: "/images/places/universal/nature.webp",
    trail: "/images/places/universal/nature.webp",
    heritage: "/images/places/universal/heritage.webp",
    spiritual: "/images/places/universal/spiritual.webp",
    viewpoint: "/images/places/universal/viewpoint.webp",
    waterfall: "/images/places/universal/waterfall.webp",
    lake: "/images/places/universal/lake.webp",
    monastery: "/images/places/universal/monastery.webp",
    church: "/images/places/universal/church.webp",
    beach: "/images/places/universal/beach.webp",
    shopping: "/images/places/universal/cafe.webp",
    transport: "/images/places/universal/transport.webp",
  }};
  return mapping[theme] || "/images/places/universal/nature.webp";
}}

export function getRegionalFallback(category: string, destinationName: string): string {{
  const cat = category.toLowerCase();
  const dest = destinationName.toLowerCase();
  if (
    cat.includes("beach") ||
    cat.includes("sea") ||
    cat.includes("ocean") ||
    cat.includes("coast") ||
    dest.includes("goa") ||
    dest.includes("gokarna") ||
    dest.includes("varkala") ||
    dest.includes("pondicherry") ||
    dest.includes("alappuzha")
  ) {{
    return REGIONAL_FALLBACK_REGISTRY.coastal.beach || "/images/destinations/fallbacks/coastal.jpg";
  }}
  if (
    cat.includes("desert") ||
    cat.includes("dune") ||
    cat.includes("camel") ||
    dest.includes("jaisalmer") ||
    dest.includes("jodhpur") ||
    dest.includes("bikaner") ||
    dest.includes("pushkar") ||
    dest.includes("jaipur") ||
    dest.includes("udaipur")
  ) {{
    return REGIONAL_FALLBACK_REGISTRY.desert.heritage || "/images/destinations/fallbacks/desert.jpg";
  }}
  if (
    cat.includes("ghat") ||
    cat.includes("temple") ||
    cat.includes("spiritual") ||
    cat.includes("heritage") ||
    dest.includes("varanasi") ||
    dest.includes("ayodhya") ||
    dest.includes("rishikesh") ||
    dest.includes("haridwar") ||
    dest.includes("delhi") ||
    dest.includes("agra") ||
    dest.includes("amritsar")
  ) {{
    return REGIONAL_FALLBACK_REGISTRY.valley.heritage || "/images/destinations/fallbacks/valley.jpg";
  }}
  return REGIONAL_FALLBACK_REGISTRY.himalayan.nature || "/images/destinations/fallbacks/himalayan.jpg";
}}

// Build precomputed alias map for O(1) matching
const PLACE_ALIAS_MAP: Record<string, string> = {{}};
for (const [key, item] of Object.entries(EXACT_PLACE_REGISTRY)) {{
  const dest = key.split(":")[0];
  if (item.aliases) {{
    for (const al of item.aliases) {{
      PLACE_ALIAS_MAP[`${{dest}}:${{al}}`] = key;
    }}
  }}
}}

const HOTEL_ALIAS_MAP: Record<string, string> = {{}};
for (const [key, item] of Object.entries(EXACT_HOTEL_REGISTRY)) {{
  const dest = key.split(":")[0];
  if (item.aliases) {{
    for (const al of item.aliases) {{
      HOTEL_ALIAS_MAP[`${{dest}}:${{al}}`] = key;
    }}
  }}
}}

function buildContract(data: {{
  url: string;
  fallbackUrl?: string;
  source: string;
  sourceType: string;
  provenance: string;
  semanticCategory: string;
  exactness: string;
  attribution?: string;
  altText: string;
  badgeLabel: string;
  visualDescription?: string;
  artworkKey?: string;
  isRealPhoto?: boolean;
}}): ImageContract {{
  return {{
    url: data.url,
    imageUrl: data.url,
    fallback_url: data.fallbackUrl,
    fallbackUrl: data.fallbackUrl,
    source: data.source as any,
    source_type: data.sourceType as any,
    sourceType: data.sourceType as any,
    provenance: data.provenance as any,
    semantic_category: data.semanticCategory,
    semanticCategory: data.semanticCategory,
    exactness: data.exactness as any,
    attribution: data.attribution,
    alt_text: data.altText,
    altText: data.altText,
    badge_label: data.badgeLabel as any,
    badgeLabel: data.badgeLabel as any,
    visual_description: data.visualDescription,
    visualDescription: data.visualDescription,
    artwork_key: data.artworkKey,
    artworkKey: data.artworkKey,
    is_real_photo: data.isRealPhoto ?? false,
    badge: data.badgeLabel,
  }};
}}

export interface ResolveHotelParams {{
  propertyName?: string;
  destinationName?: string;
  hotelStyle?: string;
  existingImageUrl?: string;
  isLive?: boolean;
  source?: string;
}}

export function resolveHotelArtwork(
  propertyOrParams: string | ResolveHotelParams,
  destinationNameArg?: string,
  hotelStyleArg?: string,
  existingImageUrlArg?: string,
  isLiveArg?: boolean,
  sourceArg?: string
): ImageContract {{
  let propertyName = "";
  let destinationName = "";
  let hotelStyle = "Boutique Sanctuary";
  let existingImageUrl: string | undefined;
  let source: string | undefined;
  let isLive: boolean | undefined;

  if (typeof propertyOrParams === "object" && propertyOrParams !== null) {{
    propertyName = propertyOrParams.propertyName || "";
    destinationName = propertyOrParams.destinationName || "";
    hotelStyle = propertyOrParams.hotelStyle || "Boutique Sanctuary";
    existingImageUrl = propertyOrParams.existingImageUrl;
    source = propertyOrParams.source;
    isLive = propertyOrParams.isLive;
  }} else {{
    const arg1 = propertyOrParams || "";
    const arg2 = destinationNameArg || "";
    if (DESTINATION_CATEGORY_REGISTRY[cleanString(arg1)] && !DESTINATION_CATEGORY_REGISTRY[cleanString(arg2)]) {{
      destinationName = arg1;
      propertyName = arg2;
    }} else {{
      propertyName = arg1;
      destinationName = arg2;
    }}
    hotelStyle = hotelStyleArg || "Boutique Sanctuary";
    existingImageUrl = existingImageUrlArg;
    isLive = isLiveArg;
    source = sourceArg;
  }}

  const destNorm = cleanString(destinationName);
  const hotelNorm = cleanString(propertyName);
  const universalFallback = "/images/places/universal/stay.webp";

  let matchedDest: string | undefined;
  for (const k of Object.keys(DESTINATION_CATEGORY_REGISTRY)) {{
    if (destNorm === k || destNorm.includes(k) || k.includes(destNorm)) {{
      matchedDest = k;
      break;
    }}
  }}

  const destConfig = matchedDest ? DESTINATION_CATEGORY_REGISTRY[matchedDest] : undefined;
  const destStayFallback = destConfig?.categories?.stay || universalFallback;

  // LEVEL 1: Verified Real External Photograph
  if (existingImageUrl && (existingImageUrl.startsWith("http://") || existingImageUrl.startsWith("https://")) && !existingImageUrl.includes("placeholder")) {{
    const isWM = existingImageUrl.includes("wikimedia.org") || existingImageUrl.includes("wikidata.org");
    return buildContract({{
      url: existingImageUrl,
      fallbackUrl: destStayFallback,
      source: isWM ? "wikimedia" : (source || "live_provider"),
      sourceType: "real_photo",
      provenance: isWM ? "exact_place" : "destination_category",
      semanticCategory: "stay",
      exactness: isWM ? "exact" : "approximate",
      attribution: isWM ? "Wikimedia Commons / Verified Open Source" : "Verified Hotel Photograph",
      altText: `${{propertyName}} in ${{destinationName}}`,
      badgeLabel: isWM ? "EXACT PLACE PHOTO" : "LIVE PLACE PHOTO",
      artworkKey: `stay:photo:${{hotelNorm}}`,
      isRealPhoto: true,
      visualDescription: `Verified photograph of ${{propertyName}}.`,
    }});
  }}

  // LEVEL 2: Verified Local Asset on Disk (Direct Exact Property Match)
  if (existingImageUrl && existingImageUrl.startsWith("/images/") && !existingImageUrl.includes("/categories/") && !existingImageUrl.includes("/fallbacks/") && !existingImageUrl.includes("/universal/")) {{
    return buildContract({{
      url: existingImageUrl,
      fallbackUrl: destStayFallback,
      source: source || "vanvas_curated",
      sourceType: "editorial_artwork",
      provenance: "exact_place",
      semanticCategory: "stay",
      exactness: "exact",
      attribution: "VANVAS Verified Property Asset",
      altText: `${{propertyName}} in ${{destinationName}}`,
      badgeLabel: "VANVAS PLACE ARTWORK",
      artworkKey: `stay:exact:${{destNorm}}:${{hotelNorm}}`,
      visualDescription: `Verified property artwork for ${{propertyName}}.`,
    }});
  }}

  // LEVEL 3: Curated Exact Hotel Registry (Direct Key Lookup & Alias Map)
  const lookupKey = `${{destNorm}}:${{hotelNorm}}`;
  let targetKey: string | undefined;

  if (EXACT_HOTEL_REGISTRY[lookupKey]) {{
    targetKey = lookupKey;
  }} else if (HOTEL_ALIAS_MAP[lookupKey]) {{
    targetKey = HOTEL_ALIAS_MAP[lookupKey];
  }}

  if (targetKey && EXACT_HOTEL_REGISTRY[targetKey]) {{
    const item = EXACT_HOTEL_REGISTRY[targetKey];
    return buildContract({{
      url: item.imageUrl,
      fallbackUrl: destStayFallback,
      source: item.source || "vanvas_curated",
      sourceType: item.sourceType || "editorial_artwork",
      provenance: "exact_place",
      semanticCategory: "stay",
      exactness: "exact",
      attribution: "VANVAS Verified Property Asset",
      altText: `${{propertyName}} in ${{destinationName}}`,
      badgeLabel: "VANVAS PLACE ARTWORK",
      artworkKey: targetKey,
      visualDescription: item.visualDescription || `Curated stay artwork for ${{propertyName}}.`,
    }});
  }}

  // LEVEL 4: Destination-Scoped Alias Matching
  for (const [regKey, item] of Object.entries(EXACT_HOTEL_REGISTRY)) {{
    const [regDest, regHotel] = regKey.split(":");
    if (regDest === destNorm || regDest.includes(destNorm) || destNorm.includes(regDest)) {{
      const aliases = item.aliases || [regHotel];
      if (hotelNorm === regHotel || aliases.includes(hotelNorm)) {{
        return buildContract({{
          url: item.imageUrl,
          fallbackUrl: destStayFallback,
          source: item.source || "vanvas_curated",
          sourceType: "editorial_artwork",
          provenance: "exact_place",
          semanticCategory: "stay",
          exactness: "exact",
          attribution: "VANVAS Verified Property Asset",
          altText: `${{propertyName}} in ${{destinationName}}`,
          badgeLabel: "VANVAS PLACE ARTWORK",
          artworkKey: regKey,
          visualDescription: item.visualDescription || `Curated stay artwork for ${{propertyName}}.`,
        }});
      }}
      for (const al of aliases) {{
        if (al.length >= 4 && (hotelNorm.startsWith(`${{al}}-`) || hotelNorm.endsWith(`-${{al}}`) || hotelNorm.includes(`-${{al}}-`))) {{
          return buildContract({{
            url: item.imageUrl,
            fallbackUrl: destStayFallback,
            source: item.source || "vanvas_curated",
            sourceType: "editorial_artwork",
            provenance: "exact_place",
            semanticCategory: "stay",
            exactness: "exact",
            attribution: "VANVAS Verified Property Asset",
            altText: `${{propertyName}} in ${{destinationName}}`,
            badgeLabel: "VANVAS PLACE ARTWORK",
            artworkKey: regKey,
            visualDescription: item.visualDescription || `Curated stay artwork for ${{propertyName}}.`,
          }});
        }}
      }}
    }}
  }}

  // LEVEL 5: Destination Stay Fallback
  if (destConfig?.categories?.stay) {{
    return buildContract({{
      url: destConfig.categories.stay,
      fallbackUrl: universalFallback,
      source: "vanvas_curated",
      sourceType: "category_photo",
      provenance: "destination_category",
      semanticCategory: "stay",
      exactness: "category_matched",
      attribution: `VANVAS Curated ${{destinationName}} Stay Sanctuary`,
      altText: `${{propertyName}} in ${{destinationName}}`,
      badgeLabel: "DESTINATION CATEGORY ART",
      artworkKey: `${{matchedDest}}:stay`,
      visualDescription: `Authentic ${{destinationName}} stay sanctuary visual.`,
    }});
  }}

  // LEVEL 6: Universal Fallback
  return buildContract({{
    url: universalFallback,
    fallbackUrl: universalFallback,
    source: "vanvas_universal",
    sourceType: "category_photo",
    provenance: "universal_fallback",
    semanticCategory: "stay",
    exactness: "approximate",
    attribution: "VANVAS Universal Stay Atmosphere",
    altText: `${{propertyName}} in ${{destinationName}}`,
    badgeLabel: "UNIVERSAL FALLBACK",
    artworkKey: "universal:stay",
    visualDescription: `Universal accommodation sanctuary visual.`,
  }});
}}

export interface ResolvePlaceParams {{
  placeName?: string;
  destinationName?: string;
  category?: string;
  existingImageUrl?: string;
  source?: string;
  isLive?: boolean;
}}

export function resolvePlaceArtwork(
  placeOrParams: string | ResolvePlaceParams,
  destinationNameArg?: string,
  categoryArg?: string,
  existingImageUrlArg?: string,
  isLiveArg?: boolean,
  sourceArg?: string
): ImageContract {{
  let placeName = "";
  let destinationName = "";
  let category = "Must Visit";
  let existingImageUrl: string | undefined;
  let source: string | undefined;
  let isLive: boolean | undefined;

  if (typeof placeOrParams === "object" && placeOrParams !== null) {{
    placeName = placeOrParams.placeName || "";
    destinationName = placeOrParams.destinationName || "";
    category = placeOrParams.category || "Must Visit";
    existingImageUrl = placeOrParams.existingImageUrl;
    source = placeOrParams.source;
    isLive = placeOrParams.isLive;
  }} else {{
    const arg1 = placeOrParams || "";
    const arg2 = destinationNameArg || "";
    if (DESTINATION_CATEGORY_REGISTRY[cleanString(arg1)] && !DESTINATION_CATEGORY_REGISTRY[cleanString(arg2)]) {{
      destinationName = arg1;
      placeName = arg2;
    }} else {{
      placeName = arg1;
      destinationName = arg2;
    }}
    category = categoryArg || "Must Visit";
    existingImageUrl = existingImageUrlArg;
    isLive = isLiveArg;
    source = sourceArg;
  }}

  const destNorm = cleanString(destinationName);
  const placeNorm = cleanString(placeName);
  const theme = classifyCategoryTheme(category, placeName);
  const universalFallback = getUniversalFallback(theme);

  // If this is explicitly a stay property, forward to property-first resolver
  if (theme === "stay") {{
    return resolveHotelArtwork({{
      propertyName: placeName,
      destinationName,
      hotelStyle: category,
      existingImageUrl,
      source,
    }});
  }}

  let matchedDest: string | undefined;
  for (const k of Object.keys(DESTINATION_CATEGORY_REGISTRY)) {{
    if (destNorm === k || destNorm.includes(k) || k.includes(destNorm)) {{
      matchedDest = k;
      break;
    }}
  }}

  const destConfig = matchedDest ? DESTINATION_CATEGORY_REGISTRY[matchedDest] : undefined;
  const destCategoryFallback = destConfig?.categories?.[theme] || undefined;
  const safeFallback = destCategoryFallback || universalFallback;

  // LEVEL 1: Verified Real External Photograph
  if (existingImageUrl && (existingImageUrl.startsWith("http://") || existingImageUrl.startsWith("https://")) && !existingImageUrl.includes("placeholder")) {{
    const isWM = existingImageUrl.includes("wikimedia.org") || existingImageUrl.includes("wikidata.org");
    const badgeLabel: ProvenanceBadge = isWM ? "EXACT PLACE PHOTO" : isLive ? "LIVE PLACE PHOTO" : "VANVAS PLACE ARTWORK";
    return buildContract({{
      url: existingImageUrl,
      fallbackUrl: safeFallback,
      source: isWM ? "wikimedia" : (source || "live_provider"),
      sourceType: "real_photo",
      provenance: isWM ? "exact_place" : isLive ? "live_place" : "destination_category",
      semanticCategory: theme,
      exactness: isWM || isLive ? "exact" : "approximate",
      attribution: isWM ? "Wikimedia Commons / Verified Open Source" : "Live Provider Photograph",
      altText: `${{placeName}} in ${{destinationName}}`,
      badgeLabel,
      artworkKey: `photo:${{placeNorm}}`,
      isRealPhoto: true,
      visualDescription: `Verified photograph of ${{placeName}}.`,
    }});
  }}

  // LEVEL 2: Verified Local Asset on Disk (Direct Exact Place Match)
  if (existingImageUrl && existingImageUrl.startsWith("/images/") && !existingImageUrl.includes("/categories/") && !existingImageUrl.includes("/fallbacks/") && !existingImageUrl.includes("/universal/")) {{
    return buildContract({{
      url: existingImageUrl,
      fallbackUrl: safeFallback,
      source: source || "vanvas_curated",
      sourceType: "editorial_artwork",
      provenance: "exact_place",
      semanticCategory: theme,
      exactness: "exact",
      attribution: "VANVAS Verified Editorial Asset",
      altText: `${{placeName}} in ${{destinationName}}`,
      badgeLabel: "VANVAS PLACE ARTWORK",
      artworkKey: `exact:${{destNorm}}:${{placeNorm}}`,
      visualDescription: `Verified editorial asset for ${{placeName}}.`,
    }});
  }}

  // LEVEL 3: Curated Exact Place Match (Direct Key Lookup & Alias Map)
  const lookupKey = `${{destNorm}}:${{placeNorm}}`;
  let targetKey: string | undefined;

  if (EXACT_PLACE_REGISTRY[lookupKey]) {{
    targetKey = lookupKey;
  }} else if (PLACE_ALIAS_MAP[lookupKey]) {{
    targetKey = PLACE_ALIAS_MAP[lookupKey];
  }}

  if (targetKey && EXACT_PLACE_REGISTRY[targetKey]) {{
    const item = EXACT_PLACE_REGISTRY[targetKey];
    return buildContract({{
      url: item.imageUrl,
      fallbackUrl: safeFallback,
      source: item.source || "vanvas_curated",
      sourceType: item.sourceType || "editorial_artwork",
      provenance: "exact_place",
      semanticCategory: item.semanticTheme || theme,
      exactness: "exact",
      attribution: "VANVAS Verified Editorial Asset",
      altText: `${{placeName}} in ${{destinationName}}`,
      badgeLabel: "VANVAS PLACE ARTWORK",
      artworkKey: targetKey,
      visualDescription: item.visualDescription || `Curated experience at ${{placeName}}.`,
    }});
  }}

  // LEVEL 4: Destination-Scoped Alias Matching
  for (const [regKey, item] of Object.entries(EXACT_PLACE_REGISTRY)) {{
    const [regDest, regPlace] = regKey.split(":");
    if (regDest === destNorm || regDest.includes(destNorm) || destNorm.includes(regDest)) {{
      const aliases = item.aliases || [regPlace];
      if (placeNorm === regPlace || aliases.includes(placeNorm)) {{
        return buildContract({{
          url: item.imageUrl,
          fallbackUrl: safeFallback,
          source: item.source || "vanvas_curated",
          sourceType: "editorial_artwork",
          provenance: "exact_place",
          semanticCategory: item.semanticTheme || theme,
          exactness: "exact",
          attribution: "VANVAS Verified Editorial Asset",
          altText: `${{placeName}} in ${{destinationName}}`,
          badgeLabel: "VANVAS PLACE ARTWORK",
          artworkKey: regKey,
          visualDescription: item.visualDescription || `Curated experience at ${{placeName}}.`,
        }});
      }}
      for (const al of aliases) {{
        if (al.length >= 4 && (placeNorm.startsWith(`${{al}}-`) || placeNorm.endsWith(`-${{al}}`) || placeNorm.includes(`-${{al}}-`))) {{
          return buildContract({{
            url: item.imageUrl,
            fallbackUrl: safeFallback,
            source: item.source || "vanvas_curated",
            sourceType: "editorial_artwork",
            provenance: "exact_place",
            semanticCategory: item.semanticTheme || theme,
            exactness: "exact",
            attribution: "VANVAS Verified Editorial Asset",
            altText: `${{placeName}} in ${{destinationName}}`,
            badgeLabel: "VANVAS PLACE ARTWORK",
            artworkKey: regKey,
            visualDescription: item.visualDescription || `Curated experience at ${{placeName}}.`,
          }});
        }}
      }}
    }}
  }}

  // LEVEL 5: Destination Category Fallback
  if (destCategoryFallback) {{
    return buildContract({{
      url: destCategoryFallback,
      fallbackUrl: universalFallback,
      source: "vanvas_curated",
      sourceType: "category_photo",
      provenance: "destination_category",
      semanticCategory: theme,
      exactness: "category_matched",
      attribution: `VANVAS Curated ${{destinationName}} Atmosphere`,
      altText: `${{placeName}} in ${{destinationName}}`,
      badgeLabel: "DESTINATION CATEGORY ART",
      artworkKey: `${{matchedDest}}:${{theme}}`,
      visualDescription: `Authentic ${{destinationName}} ${{theme}} visual.`,
    }});
  }}

  // LEVEL 6 & 7: Universal Fallback
  return buildContract({{
    url: universalFallback,
    fallbackUrl: universalFallback,
    source: "vanvas_universal",
    sourceType: "category_photo",
    provenance: "universal_fallback",
    semanticCategory: theme,
    exactness: "approximate",
    attribution: "VANVAS Universal Travel Atmosphere",
    altText: `${{placeName}} in ${{destinationName}}`,
    badgeLabel: "UNIVERSAL FALLBACK",
    artworkKey: `universal:${{theme}}`,
    visualDescription: `Universal visual for ${{category}}.`,
  }});
}}
"""
    return ts_code

if __name__ == "__main__":
    ts_code = generate_frontend_code()
    with open(FRONTEND_RESOLVER, "w", encoding="utf-8") as f:
        f.write(ts_code)
    print(f"[SUCCESS] Wrote {len(ts_code)} bytes to {FRONTEND_RESOLVER}")
