import os
import sys
import re
import json
from pathlib import Path
from typing import List, Set, Dict, Any, Tuple

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
BACKEND_PROVIDER = BACKEND_DIR / "app" / "providers" / "artwork_provider.py"

import unicodedata

def slugify(s: str) -> str:
    if not s:
        return ""
    s_clean = str(s).lower().strip()
    s_clean = s_clean.replace("&", "and").replace("'", "").replace("’", "").replace("`", "").replace("\u2019", "").replace("\ufffd", "e")
    for dash in ["—", "–", "‐", "‑", "‒", "–", "—", "―", "−", "－", "_", "/", "\\"]:
        s_clean = s_clean.replace(dash, "-")
    s_norm = unicodedata.normalize('NFKD', s_clean).encode('ASCII', 'ignore').decode('utf-8')
    return re.sub(r"[^a-z0-9]+", "-", s_norm).strip("-")

GENERIC_WORDS = {
    "hill", "view", "cafe", "cafes", "park", "road", "ridge", "trail", "walk", "bazaar",
    "market", "dining", "kitchen", "dhaba", "food", "temple", "falls", "lake",
    "gate", "tomb", "fort", "palace", "house", "villa", "resort", "hotel",
    "point", "sunset", "river", "riverside", "lakeside", "ghat", "beach", "cove",
    "village", "forest", "rock", "center", "square", "gardens", "garden", "monastery",
    "church", "and", "the", "for", "with", "near", "hall", "lounge", "complex",
    "sanctuary", "heritage", "boutique", "retreat", "cottage", "cottages", "hostel",
    "luxury", "classic", "grand", "royal", "suites", "inn", "old", "city", "stay", "stays"
}

def extract_place_aliases(place_name: str, dest_slug: str, image_url: str) -> List[str]:
    aliases: Set[str] = set()
    s_full = slugify(place_name)
    if s_full:
        aliases.add(s_full)
    
    # Asset stem
    if image_url:
        asset_stem = Path(image_url).stem
        if asset_stem and asset_stem not in ["hero", "nature", "stay", "cafe", "food", "heritage", "spiritual", "viewpoint", "waterfall", "lake", "monastery", "church", "beach", "transport"]:
            aliases.add(asset_stem)
            stem_no_dest = slugify(asset_stem.replace(dest_slug, ""))
            if stem_no_dest and len(stem_no_dest) >= 3 and stem_no_dest not in GENERIC_WORDS:
                aliases.add(stem_no_dest)
    
    # Parts split by parens, &, commas
    for part in re.split(r"[\(\)&/,\—\–\:]", place_name):
        p_clean = slugify(part)
        if p_clean and len(p_clean) >= 3 and p_clean not in GENERIC_WORDS:
            aliases.add(p_clean)

    # Specific common landmark name variations
    if "city-palace" in s_full:
        aliases.update(["city-palace", f"city-palace-{dest_slug}", f"{dest_slug}-city-palace", f"city-palace-of-{dest_slug}", "city-palace-of-udaipur", "city-palace-udaipur"])
    if "bagore" in s_full:
        aliases.update(["bagore-ki-haveli", "bagore-haveli", "bagore", "bagore-ki-haveli-and-dharohar-dance"])
    if "saheliyon" in s_full:
        aliases.update(["saheliyon-ki-bari", "saheliyon-bari", "saheliyon", "saheliyon-ki-bari-garden-of-maidens"])
    if "pichola" in s_full:
        aliases.update(["lake-pichola", "lake-pichola-sunset-boat-voyage", "lake-pichola-boat-ride", "lake-pichola-ghats", "lake-pichola-ghats-and-island-cruise", "pichola-boat-ride", "pichola-cruise"])
    if "ambrai" in s_full:
        aliases.update(["ambrai-ghat", "ambrai", "manjhi-ghat", "ambrai-ghat-sunset-promenade"])
    if "sajjangarh" in s_full:
        aliases.update(["sajjangarh", "sajjangarh-monsoon-palace", "monsoon-palace", "sajjangarh-monsoon-palace-ridge"])
    if "jheel" in s_full or "jeel" in s_full:
        aliases.update(["jheels-ginger-coffee", "jeels-ginger-coffee-bar", "jheels-coffee", "jeels-coffee", "jheels-ginger-coffee-bar-and-bakery", "jeels-ginger-coffee-bar"])
    if "natraj" in s_full:
        aliases.update(["natraj-dining-hall", "natraj-thali", "natraj", "natraj-dining-hall-unlimited-mewari-thali"])
    if "ganga-kinare" in s_full:
        aliases.update(["ganga-kinare", "ganga-kinare-riverside-retreat", "ganga-kinare-riverside-sanctuary"])
    if "aloha" in s_full:
        aliases.update(["aloha-on-the-ganges", "aloha-ganges", "aloha"])
    if "glasshouse" in s_full:
        aliases.update(["glasshouse-on-the-ganges", "glasshouse-ganges", "glasshouse"])
    if "himalayan" in s_full and ("cottage" in s_full or "castle" in s_full or "woods" in s_full):
        aliases.update(["the-himalayan-castle-stone-cottages", "the-himalayan-woods-boutique-retreat", "the-himalayan-castle", "the-himalayan", "the-himalayan-castle-and-stone-cottages"])
    if "larisa" in s_full:
        aliases.update(["larisa-resort-apple-orchard", "larisa-resort", "larisa", "larisa-resort-and-apple-orchard"])
    if "drifters" in s_full:
        aliases.update(["drifters-inn-wooden-loft", "drifters-inn", "drifters-cafe", "drifters-inn-and-wooden-loft", "drifters-cafe-and-acoustic-inn"])
    if "parmarth" in s_full:
        aliases.update(["parmarth-niketan", "parmarth-niketan-ganga-aarti", "parmarth-niketan-aarti", "parmarth-aarti"])
    if "beatles" in s_full:
        aliases.update(["beatles-ashram", "chaurasi-kutia", "the-beatles-ashram", "beatles-ashram-chaurasi-kutia"])
    if "neer-garh" in s_full or "neer-guddu" in s_full:
        aliases.update(["neer-garh-waterfall", "neer-waterfall", "neer-garh", "neer-garh-cascading-waterfall"])
    if "shivpuri" in s_full:
        aliases.update(["shivpuri-rafting", "shivpuri-river-rafting", "shivpuri-white-water-river-rafting"])
    if "triveni" in s_full:
        aliases.update(["triveni-ghat", "triveni-ghat-aarti", "triveni-ghat-evening-maha-aarti"])
    if "vashistha" in s_full:
        aliases.update(["vashistha-cave", "vashistha-gufa", "vashistha-cave-gufa"])
    if "german-bakery" in s_full or "devraj" in s_full:
        aliases.update(["german-bakery", "devraj-coffee", "devraj-coffee-german-bakery", "german-bakery-tapovan", "devraj-coffee-and-german-bakery"])
    if "ram-jhula" in s_full:
        aliases.update(["ram-jhula", "ram-jhula-promenade", "ram-jhula-suspension-bridge-promenade"])
    if "hadimba" in s_full:
        aliases.update(["hadimba-temple", "hadimba-devi-temple", "hadimba-devi-cedar-forest-temple"])
    if "1947" in s_full:
        aliases.update(["cafe-1947", "café-1947", "cafe-1947-riverside", "cafe-1947-riverside-stone-cafe", "cafe-1947-riverside-stone-café"])
    if "jogini" in s_full:
        aliases.update(["jogini-waterfall", "jogini-falls", "jogini-waterfall-pine-trail"])
    if "solang" in s_full:
        aliases.update(["solang-valley", "solang-valley-alpine-adventure-grounds"])
    if "vashisht" in s_full:
        aliases.update(["vashisht-springs", "vashisht-hot-springs", "vashisht-hot-sulphur-springs", "vashisht-hot-sulphur-springs-and-ancient-temple"])
    if "johnson" in s_full:
        aliases.update(["johnsons-cafe", "the-johnsons-cafe", "johnsons-cafe-trout-bar", "the-johnsons-cafe-and-trout-bar"])
    if "jain-temple" in s_full or "seven-jain" in s_full:
        aliases.update(["jain-temples-fort", "jaisalmer-fort-seven-jain-temples", "jain-temples", "seven-jain-temples"])

    final_aliases = [a for a in aliases if len(a) >= 3 and a not in GENERIC_WORDS]
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

def build_data_structures():
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
        ('mussoorie:landour-bakehouse', '/images/places/mussoorie/landour-bakehouse.webp', 'Landour Bakehouse', 'Cafés & Bakery', 'cafe', ['landour-bakehouse', 'landour-bakehouse-and-sisters-bazaar', 'landour-bakehouse-sisters-bazaar']),
        ('mussoorie:lal-tibba', '/images/places/mussoorie/lal-tibba.webp', 'Lal Tibba', 'Nature & Trails', 'viewpoint', ['lal-tibba', 'lal-tibba-scenic-viewpoint', 'lal-tibba-viewpoint']),
        ('mussoorie:kempty-falls', '/images/places/mussoorie/kempty-falls.webp', 'Kempty Falls', 'Nature & Trails', 'waterfall', ['kempty-falls', 'kempty-falls-cascades', 'kempty']),
        ('mussoorie:gun-hill', '/images/places/mussoorie/gun-hill.webp', 'Gun Hill', 'Nature & Trails', 'viewpoint', ['gun-hill', 'gun-hill-ropeway', 'gun-hill-viewpoint']),
        ('mussoorie:camels-back-road', '/images/places/mussoorie/camels-back-road.webp', "Camel's Back Road", 'Nature & Trails', 'nature', ['camels-back-road', 'camel-back-road', 'camels-back', 'camel-back']),
        ('mussoorie:mall-road', '/images/places/mussoorie/mall-road.webp', 'Mussoorie Mall Road', 'Shops & Markets', 'shopping', ['mall-road', 'mussoorie-mall-road', 'the-mall-road']),
        ('mussoorie:george-everest', '/images/places/mussoorie/george-everest.webp', 'Sir George Everest House', 'Nature & Trails', 'heritage', ['george-everest', 'sir-george-everest-house', 'george-everest-peak', 'george-everest-house']),
        ('mussoorie:clouds-end', '/images/places/mussoorie/clouds-end.webp', "Cloud's End", 'Nature & Trails', 'nature', ['clouds-end', 'clouds-end-forest', 'clouds-end-heritage']),
        ('mussoorie:landour', '/images/places/mussoorie/landour.webp', 'Landour Cantonment Ridge', 'Nature & Trails', 'nature', ['landour', 'landour-cantonment-ridge', 'landour-ridge']),
        ('mussoorie:st-pauls-church', '/images/places/mussoorie/st-pauls-church.webp', "St. Paul's Church", 'Culture & Heritage', 'church', ['st-pauls-church', 'st-paul-church', 'st-pauls-church-landour']),
        ('dharamshala:bhagsunag-waterfall', '/images/places/dharamshala/bhagsunag-waterfall.webp', 'Bhagsunag Waterfall', 'Nature & Trails', 'waterfall', ['bhagsunag-waterfall', 'bhagsu-waterfall', 'bhagsunag-waterfall-and-shiva-cafe', 'bhagsu-waterfall-shiva-cafe', 'bhagsunag']),
        ('dharamshala:namgyal-monastery', '/images/places/dharamshala/namgyal-monastery.webp', 'Namgyal Monastery & Tsuglagkhang Complex', 'Culture & Heritage', 'monastery', ['namgyal-monastery', 'namgyal', 'namgyal-monastery-and-tsuglagkhang-complex', 'tsuglagkhang-complex', 'namgyal-monastery-tsuglagkhang-complex']),
        ('dharamshala:triund-trek', '/images/places/dharamshala/triund-trek.webp', 'Triund High Ridge Himalayan Trek', 'Adventure & Treks', 'nature', ['triund-trek', 'triund', 'triund-high-ridge-himalayan-trek', 'triund-trail', 'triund-trek-base']),
        ('dharamshala:norbulingka-institute', '/images/places/dharamshala/norbulingka-institute.webp', 'Norbulingka Tibetan Cultural Institute', 'Culture & Heritage', 'heritage', ['norbulingka-institute', 'norbulingka-tibetan-cultural-institute', 'norbulingka']),
        ('jaipur:nahargarh-fort', '/images/places/jaipur/nahargarh-fort.webp', 'Nahargarh Fort Sunset Bastion', 'Nature & Trails', 'viewpoint', ['nahargarh-fort', 'nahargarh-fort-sunset-bastion', 'nahargarh', 'nahargarh-fort-sunset', 'nahargarh-fort-sunset-ridge']),
        ('jaipur:amber-fort', '/images/places/jaipur/amber-fort.webp', 'Amber Fort & Maota Lake', 'Culture & Heritage', 'heritage', ['amber-fort', 'amber-fort-and-maota-lake', 'amber-fort-and-sheesh-mahal', 'amber', 'amer-fort']),
        ('jaipur:hawa-mahal', '/images/places/jaipur/hawa-mahal.webp', 'Hawa Mahal (Palace of Winds)', 'Culture & Heritage', 'heritage', ['hawa-mahal', 'hawa-mahal-palace-of-winds', 'hawa-mahal-palace']),
        ('leh:leh-palace', '/images/places/leh/leh-palace.webp', 'Leh Palace', 'Culture & Heritage', 'heritage', ['leh-palace', 'leh-palace-17th-century-fortress', 'lachen-palkhar']),
        ('leh:pangong-tso', '/images/places/leh/pangong-tso.webp', 'Pangong Tso Alpine Lake', 'Nature & Trails', 'lake', ['pangong-tso', 'pangong-tso-high-altitude-salt-lake', 'pangong-lake', 'pangong-tso-alpine-lake', 'pangong']),
        ('leh:thiksey-monastery-gompa', '/images/places/leh/thiksey-monastery-gompa.webp', 'Thiksey Monastery (Gompa)', 'Culture & Heritage', 'monastery', ['thiksey-monastery-gompa', 'thiksey-monastery', 'thiksey', 'thiksey-gompa']),
        ('goa:anjuna-beach', '/images/places/goa/anjuna-beach.webp', 'Anjuna Beach & Flea Market', 'Nature & Trails', 'beach', ['anjuna-beach', 'anjuna-beach-and-flea-market', 'anjuna']),
        ('varanasi:brijrama-palace', '/images/places/varanasi/brijrama-palace.webp', 'BrijRama Palace River Heritage', 'Stays & Sanctuaries', 'stay', ['brijrama-palace', 'brijrama-palace-river-heritage', 'brijrama', 'brijrama-palace-heritage']),
        ('kasol:chalal-trail', '/images/places/kasol/chalal-trail.webp', 'Chalal Pine Riverside Trail', 'Nature & Trails', 'nature', ['chalal-trail', 'chalal-pine-riverside-trail', 'chalal', 'chalal-trail-pine-riverside-trail']),
        ('rishikesh:shivpuri-rafting', '/images/places/rishikesh/shivpuri-rafting.webp', 'Shivpuri White Water Rafting', 'Adventure & Treks', 'nature', ['shivpuri-rafting', 'shivpuri-white-water-rafting', 'shivpuri-river-rafting', 'shivpuri', 'shivpuri-white-water-river-rafting']),
        ('tungnath-chandrashila:tungnath-temple', '/images/places/tungnath-chandrashila/tungnath-temple.webp', 'Tungnath Temple', 'Culture & Heritage', 'spiritual', ['tungnath-temple', '01-tungnath-temple', 'tungnath-temple-highest-shiva-shrine', 'tungnath', '01-tungnath']),
        ('tungnath-chandrashila:chandrashila-summit', '/images/places/tungnath-chandrashila/chandrashila-summit.webp', 'Chandrashila Summit', 'Nature & Trails', 'viewpoint', ['chandrashila-summit', '02-chandrashila-summit', 'chandrashila-peak', '02-chandrashila-peak', 'chandrashila-summit-ridge', 'chandrashila', '02-chandrashila']),
    ]

    places_dict: Dict[str, Dict[str, Any]] = {}
    place_alias_map: Dict[str, str] = {}
    seen_place_images: Dict[str, str] = {}

    for dest_slug, places in ADDITIONAL_PLACES_BY_DEST.items():
        for p in places:
            p_name = p["name"]
            p_slug = slugify(p_name)
            key = f"{dest_slug}:{p_slug}"
            theme = get_theme_from_place(p_name, p.get("category", "Must Visit"))
            img_url = p.get("image_url") or f"/images/places/{dest_slug}/{p_slug}.webp"
            desc = (p.get("description") or f"Curated visual of {p_name}.").replace('"', '\\"')
            if len(desc) > 150:
                desc = desc[:147] + "..."

            aliases = extract_place_aliases(p_name, dest_slug, img_url)
            stem = Path(img_url).stem
            stem_key = f"{dest_slug}:{stem}"

            if img_url in seen_place_images:
                canon_key = seen_place_images[img_url]
                places_dict[canon_key]["aliases"] = sorted(list(set(places_dict[canon_key]["aliases"] + aliases + [p_slug, stem])))
                place_alias_map[key] = canon_key
                place_alias_map[stem_key] = canon_key
                for a in aliases:
                    place_alias_map[f"{dest_slug}:{a}"] = canon_key
                continue

            seen_place_images[img_url] = key
            places_dict[key] = {
                "place_name": p_name,
                "image_url": img_url,
                "visual_description": desc,
                "category": p.get("category", "Curated Place"),
                "semantic_theme": theme,
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": aliases
            }
            
            place_alias_map[key] = key
            place_alias_map[stem_key] = key
            for a in aliases:
                place_alias_map[f"{dest_slug}:{a}"] = key

    for key, img, desc, cat, theme, aliases in preset_landmarks:
        dest_k, place_k = key.split(":")
        stem = Path(img).stem
        stem_key = f"{dest_k}:{stem}"

        if img in seen_place_images:
            old_canon = seen_place_images[img]
            if old_canon != key and old_canon in places_dict:
                del places_dict[old_canon]
        
        seen_place_images[img] = key
        places_dict[key] = {
            "place_name": desc,
            "image_url": img,
            "visual_description": desc,
            "category": cat,
            "semantic_theme": theme,
            "source_type": "editorial_artwork",
            "source": "vanvas_curated",
            "aliases": aliases
        }
        place_alias_map[key] = key
        place_alias_map[stem_key] = key
        place_alias_map[f"{dest_k}:{place_k}"] = key
        for a in aliases:
            place_alias_map[f"{dest_k}:{a}"] = key

    # Hotels
    hotels_dict: Dict[str, Dict[str, Any]] = {}
    hotel_alias_map: Dict[str, str] = {}

    for dest_slug, hotels in ADDITIONAL_HOTELS_BY_DEST.items():
        for h in hotels:
            h_name = h["name"]
            h_slug = slugify(h_name)
            key = f"{dest_slug}:{h_slug}"
            img_url = h.get("image_url") or f"/images/places/{dest_slug}/stays/{h_slug}.webp"
            style = h.get("hotel_style") or h.get("badge") or "Boutique Sanctuary"
            desc = f"Verified property artwork for {h_name} in {dest_slug.title()}."
            aliases = extract_place_aliases(h_name, dest_slug, img_url)
            stem = Path(img_url).stem
            stem_key = f"{dest_slug}:{stem}"

            hotels_dict[key] = {
                "place_name": h_name,
                "hotel_name": h_name,
                "image_url": img_url,
                "visual_description": desc,
                "category": "Stays & Sanctuaries",
                "hotel_style": style,
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": aliases
            }

            hotel_alias_map[key] = key
            hotel_alias_map[stem_key] = key
            for a in aliases:
                hotel_alias_map[f"{dest_slug}:{a}"] = key

    # Destination Category entries
    dest_cat_dict: Dict[str, Dict[str, Any]] = {}
    for d in CANONICAL_26_DESTINATIONS:
        slug = d["slug"]
        hero_img = d.get("hero_image") or f"/images/destinations/{slug}/hero.jpg"
        dest_cat_dict[slug] = {
            "generic": hero_img,
            "categories": {
                "stay": f"/images/places/{slug}/categories/stay.webp",
                "cafe": f"/images/places/{slug}/categories/cafe.webp",
                "food": f"/images/places/{slug}/categories/food.webp",
                "nature": f"/images/places/{slug}/categories/nature.webp",
                "trail": f"/images/places/{slug}/categories/nature.webp",
                "heritage": f"/images/places/{slug}/categories/heritage.webp",
                "spiritual": f"/images/places/{slug}/categories/spiritual.webp",
                "viewpoint": f"/images/places/{slug}/categories/viewpoint.webp",
                "waterfall": f"/images/places/{slug}/categories/waterfall.webp",
                "lake": f"/images/places/{slug}/categories/lake.webp",
                "monastery": f"/images/places/{slug}/categories/monastery.webp",
                "church": f"/images/places/{slug}/categories/church.webp",
                "beach": f"/images/places/{slug}/categories/beach.webp",
                "shopping": f"/images/places/{slug}/categories/cafe.webp",
                "transport": "/images/nearby/transport/transport.webp"
            }
        }

    return places_dict, place_alias_map, hotels_dict, hotel_alias_map, dest_cat_dict

def generate_frontend_ts(places_dict, place_alias_map, hotels_dict, hotel_alias_map, dest_cat_dict) -> str:
    exact_place_lines = []
    for k, item in places_dict.items():
        alias_str = ",\n      ".join(f'"{a}"' for a in item["aliases"])
        exact_place_lines.append(f"""  "{k}": {{
    imageUrl: "{item['image_url']}",
    visualDescription: "{item['visual_description']}",
    category: "{item['category']}",
    semanticTheme: "{item['semantic_theme']}",
    sourceType: "{item['source_type']}",
    source: "{item['source']}",
    aliases: [
      {alias_str}
    ]
  }}""")

    exact_hotel_lines = []
    for k, item in hotels_dict.items():
        alias_str = ",\n      ".join(f'"{a}"' for a in item["aliases"])
        exact_hotel_lines.append(f"""  "{k}": {{
    imageUrl: "{item['image_url']}",
    visualDescription: "{item['visual_description']}",
    category: "{item['category']}",
    hotelStyle: "{item['hotel_style']}",
    semanticTheme: "{item['semantic_theme']}",
    sourceType: "{item['source_type']}",
    source: "{item['source']}",
    aliases: [
      {alias_str}
    ]
  }}""")

    dest_cat_lines = []
    for slug, d in dest_cat_dict.items():
        cats = d["categories"]
        dest_cat_lines.append(f"""  "{slug}": {{
    generic: "{d['generic']}",
    categories: {{
      stay: "{cats['stay']}",
      cafe: "{cats['cafe']}",
      food: "{cats['food']}",
      nature: "{cats['nature']}",
      trail: "{cats['trail']}",
      heritage: "{cats['heritage']}",
      spiritual: "{cats['spiritual']}",
      viewpoint: "{cats['viewpoint']}",
      waterfall: "{cats['waterfall']}",
      lake: "{cats['lake']}",
      monastery: "{cats['monastery']}",
      church: "{cats['church']}",
      beach: "{cats['beach']}",
      shopping: "{cats['shopping']}",
      transport: "{cats['transport']}"
    }}
  }}""")

    place_alias_lines = [f'  "{k}": "{v}",' for k, v in place_alias_map.items()]
    hotel_alias_lines = [f'  "{k}": "{v}",' for k, v in hotel_alias_map.items()]

    ts_code = f"""/**
 * VANVAS Central Visual Intelligence & Place / Hotel Artwork Resolver
 * 
 * Strict Resolution Hierarchy:
 * LEVEL 1: Verified exact-place real photograph -> [ EXACT PLACE PHOTO ]
 * LEVEL 2: Verified exact-place Wikimedia / trusted photo -> [ EXACT PLACE PHOTO ]
 * LEVEL 3: Verified provider / live place photo -> [ LIVE PLACE PHOTO ]
 * LEVEL 4: Curated exact-place / hotel artwork (unique to landmark/property) -> [ VANVAS PLACE ARTWORK ]
 * LEVEL 5: Verified exact local asset on disk
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
  sourceType?: ImageSourceType;
  source_type?: ImageSourceType;
  source?: string;
  aliases?: string[];
  hotelStyle?: string;
}}

export const EXACT_PLACE_REGISTRY: Record<string, ExactPlaceEntry> = {{
{',\n'.join(exact_place_lines)}
}};

export const EXACT_HOTEL_REGISTRY: Record<string, ExactPlaceEntry> = {{
{',\n'.join(exact_hotel_lines)}
}};

export const DESTINATION_CATEGORY_REGISTRY: Record<
  string,
  {{
    generic: string;
    categories: Partial<Record<string, string>>;
  }}
> = {{
{',\n'.join(dest_cat_lines)}
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
    adventure: "/images/destinations/fallbacks/desert.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/heritage.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  }},
  valley: {{
    nature: "/images/destinations/fallbacks/valley.jpg",
    trail: "/images/destinations/fallbacks/valley.jpg",
    viewpoint: "/images/destinations/fallbacks/valley.jpg",
    adventure: "/images/destinations/fallbacks/valley.jpg",
    spiritual: "/images/places/universal/spiritual.webp",
    stay: "/images/places/universal/stay.webp",
    cafe: "/images/places/universal/cafe.webp",
    food: "/images/places/universal/food.webp",
    transport: "/images/places/universal/transport.webp",
  }},
}};

export const UNIVERSAL_CATEGORY_FALLBACKS: Record<string, string> = {{
  nature: "/images/places/universal/nature.webp",
  trail: "/images/places/universal/trail.webp",
  waterfall: "/images/places/universal/waterfall.webp",
  lake: "/images/places/universal/lake.webp",
  beach: "/images/places/universal/beach.webp",
  viewpoint: "/images/places/universal/viewpoint.webp",
  spiritual: "/images/places/universal/spiritual.webp",
  temple: "/images/places/universal/spiritual.webp",
  monastery: "/images/places/universal/monastery.webp",
  church: "/images/places/universal/church.webp",
  heritage: "/images/places/universal/heritage.webp",
  cafe: "/images/places/universal/cafe.webp",
  food: "/images/places/universal/food.webp",
  shopping: "/images/places/universal/cafe.webp",
  adventure: "/images/places/universal/nature.webp",
  transport: "/images/places/universal/transport.webp",
  stay: "/images/places/universal/stay.webp",
  hostel: "/images/places/universal/hostel.webp",
  homestay: "/images/places/universal/homestay.webp",
  resort: "/images/places/universal/resort.webp",
  boutique: "/images/places/universal/boutique.webp",
}};

export const PLACE_ALIAS_MAP: Record<string, string> = {{
{'\n'.join(place_alias_lines)}
}};

export const HOTEL_ALIAS_MAP: Record<string, string> = {{
{'\n'.join(hotel_alias_lines)}
}};

const GENERIC_WORDS_SET = new Set([
  "hotel", "resort", "homestay", "hostel", "guesthouse", "guest-house", "cottage", "palace", "haveli",
  "cafe", "cafes", "restaurant", "dhaba", "dining", "retreat", "sanctuary", "temple", "monastery",
  "ashram", "waterfall", "falls", "lake", "viewpoint", "point", "sunset", "trail", "trek", "park",
  "garden", "gardens", "bazaar", "market", "chowk", "ghat", "dham", "mandir", "wood", "woods", "stone",
  "himalayan", "apple", "orchard", "loft", "lodge", "camp", "camps", "villa", "villas", "inn", "house",
  "hub", "fleet", "rentals", "rental", "scooters", "scooter", "bike", "bikes", "motorcycle", "self-drive",
  "drift", "acoustic", "hill", "hills", "view", "views", "pine", "cedar", "beach", "coast", "coastline",
  "cove", "ridge", "estate", "residency", "stay", "stays", "traveler", "circle", "square"
]);

// Deprecated artwork filter: reject placeholder and vector SVG assets
export function isDeprecatedArtwork(url?: string): boolean {{
  if (!url || typeof url !== "string") return true;
  const u = url.toLowerCase();
  return u.includes("placeholder") || u.includes("vector") || u.includes(".svg") || u.includes("geometric-moon") || u.includes("simple-moon-mountain");
}}

export function isApprovedAsset(url?: string): boolean {{
  return !isDeprecatedArtwork(url);
}}

export function cleanString(s: string): string {{
  if (!s) return "";
  let clean = s.toLowerCase().trim().replace(/&/g, "and").replace(/['’`\\u2019\\ufffd]/g, "");
  for (const dash of ["—", "–", "‐", "‑", "‒", "–", "—", "―", "−", "－", "_", "/", "\\\\"]) {{
    clean = clean.split(dash).join("-");
  }}
  return clean
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}}

export function classifyCategoryTheme(category: string, placeName: string = ""): string {{
  const cat = (category || "").toLowerCase();
  const name = (placeName || "").toLowerCase();

  if (cat.includes("mobility") || cat.includes("rental") || cat.includes("transport") || cat.includes("scooter") || cat.includes("bike") || cat.includes("vehicle")) {{
    return "transport";
  }}
  if (name.includes("rentals") || name.includes("rental") || name.includes("scooters") || name.includes("scooter") || name.includes("motorcycle") || name.includes("bike hub") || name.includes("fleet") || name.includes("self-drive")) {{
    return "transport";
  }}
  if (cat.includes("stay") || cat.includes("hotel") || cat.includes("resort") || cat.includes("hostel") || cat.includes("homestay") || cat.includes("sanctuary")) {{
    return "stay";
  }}
  if (name.includes("hotel") || name.includes("resort") || name.includes("homestay") || name.includes("hostel") || name.includes("guesthouse") || name.includes("guest house") || name.includes("cottage") || name.includes("palace hotel") || name.includes("inn &") || name.includes("inn and")) {{
    return "stay";
  }}
  if (name.includes("temple") || name.includes("ashram") || name.includes("mandir") || name.includes("kund") || name.includes("aarti") || name.includes("ghat") || name.includes("dham") || name.includes("gurudwara") || name.includes("math")) {{
    return "spiritual";
  }}
  if (cat.includes("spiritual") || cat.includes("temple") || cat.includes("ashram") || cat.includes("pilgrim")) {{
    return "spiritual";
  }}
  if (name.includes("monastery") || name.includes("gompa") || name.includes("stupa") || cat.includes("monastery")) {{
    return "monastery";
  }}
  if (name.includes("church") || name.includes("cathedral") || name.includes("basilica") || cat.includes("church")) {{
    return "church";
  }}
  if (cat.includes("caf") || cat.includes("bakery") || cat.includes("coffee") || name.includes("cafe") || name.includes("café") || name.includes("bakery") || name.includes("coffee") || name.includes("bistro") || name.includes("roastery")) {{
    return "cafe";
  }}
  if (cat.includes("food") || cat.includes("dining") || cat.includes("restaurant") || cat.includes("street") || name.includes("dhaba") || name.includes("restaurant") || name.includes("dining") || name.includes("lassi") || name.includes("sweets") || name.includes("food") || name.includes("kitchen") || name.includes("thali") || name.includes("bhojanalaya")) {{
    return "food";
  }}
  if (cat.includes("heritage") || cat.includes("culture") || cat.includes("monument") || cat.includes("historic") || cat.includes("fort") || cat.includes("palace") || cat.includes("museum") || name.includes("fort") || name.includes("palace") || name.includes("haveli") || name.includes("museum") || name.includes("ruins") || name.includes("memorial") || name.includes("tomb") || name.includes("archaeological")) {{
    return "heritage";
  }}
  if (cat.includes("waterfall") || cat.includes("falls") || name.includes("waterfall") || name.includes("falls")) {{
    return "waterfall";
  }}
  if (cat.includes("lake") || cat.includes("dam") || name.includes("lake") || name.includes("taal") || name.includes("tso") || name.includes("dam") || name.includes("pichola")) {{
    return "lake";
  }}
  if (cat.includes("beach") || cat.includes("coast") || name.includes("beach") || name.includes("cove") || name.includes("coast")) {{
    return "beach";
  }}
  if (cat.includes("viewpoint") || cat.includes("scenic") || name.includes("viewpoint") || name.includes("crest") || name.includes("top") || name.includes("sunset point") || name.includes("peak") || name.includes("summit") || name.includes("pass")) {{
    return "viewpoint";
  }}
  if (cat.includes("nature") || cat.includes("trail") || cat.includes("wildlife") || cat.includes("forest") || cat.includes("park") || cat.includes("garden") || cat.includes("trek") || cat.includes("adventure") || name.includes("trail") || name.includes("meadow") || name.includes("forest") || name.includes("park") || name.includes("garden") || name.includes("wildlife") || name.includes("safari") || name.includes("sanctuary")) {{
    return "nature";
  }}
  if (cat.includes("market") || cat.includes("shopping") || cat.includes("craft") || cat.includes("shop") || name.includes("market") || name.includes("bazaar") || name.includes("mall") || name.includes("chowk") || name.includes("plaza") || name.includes("shop")) {{
    return "shopping";
  }}

  return "nature";
}}

function getUniversalFallback(theme: string): string {{
  return UNIVERSAL_CATEGORY_FALLBACKS[theme] || UNIVERSAL_CATEGORY_FALLBACKS.nature;
}}

function buildContract(data: {{
  url: string;
  fallbackUrl: string;
  source: string;
  sourceType: ImageSourceType;
  provenance: ImageProvenanceTier;
  semanticCategory: string;
  exactness: ImageExactness;
  attribution: string;
  altText: string;
  badgeLabel: ProvenanceBadge;
  artworkKey?: string;
  visualDescription?: string;
  isRealPhoto?: boolean;
}}): ImageContract {{
  return {{
    url: data.url,
    imageUrl: data.url,
    fallback_url: data.fallbackUrl,
    fallbackUrl: data.fallbackUrl,
    source: data.source,
    source_type: data.sourceType,
    sourceType: data.sourceType,
    provenance: data.provenance,
    semantic_category: data.semanticCategory,
    semanticCategory: data.semanticCategory,
    exactness: data.exactness,
    attribution: data.attribution,
    alt_text: data.altText,
    altText: data.altText,
    badge_label: data.badgeLabel,
    badgeLabel: data.badgeLabel,
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

  // PRIORITY 1: Verified Real External Photograph (Live / Wikimedia photo)
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

  // PRIORITY 2: Curated Exact Hotel Registry (Direct Key Lookup & Alias Map)
  const lookupKey = `${{destNorm}}:${{hotelNorm}}`;
  const matchedKey = matchedDest ? `${{matchedDest}}:${{hotelNorm}}` : lookupKey;
  let targetKey: string | undefined;

  if (EXACT_HOTEL_REGISTRY[lookupKey]) {{
    targetKey = lookupKey;
  }} else if (HOTEL_ALIAS_MAP[lookupKey]) {{
    targetKey = HOTEL_ALIAS_MAP[lookupKey];
  }} else if (EXACT_HOTEL_REGISTRY[matchedKey]) {{
    targetKey = matchedKey;
  }} else if (HOTEL_ALIAS_MAP[matchedKey]) {{
    targetKey = HOTEL_ALIAS_MAP[matchedKey];
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

  // PRIORITY 3: Destination-Scoped Alias Matching against EXACT_HOTEL_REGISTRY
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
        if (al.length >= 3 && !GENERIC_WORDS_SET.has(al) && (hotelNorm.startsWith(`${{al}}-`) || hotelNorm.endsWith(`-${{al}}`) || hotelNorm.includes(`-${{al}}-`))) {{
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

  // PRIORITY 4: Verified Local Property Asset on Disk (Explicit Stays Path)
  if (existingImageUrl && existingImageUrl.startsWith("/images/places/") && existingImageUrl.includes("/stays/") && !existingImageUrl.includes("/categories/") && !existingImageUrl.includes("/fallbacks/") && !existingImageUrl.includes("/universal/")) {{
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

  // PRIORITY 5: Destination Stay Category Fallback
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

  // PRIORITY 6: Universal Fallback
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

  // PRIORITY 1: Verified Real External Photograph (Live / Wikimedia photo)
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

  // PRIORITY 2: Curated Exact Place Match (Direct Key Lookup & Alias Map)
  const lookupKey = `${{destNorm}}:${{placeNorm}}`;
  const matchedKey = matchedDest ? `${{matchedDest}}:${{placeNorm}}` : lookupKey;
  let targetKey: string | undefined;

  if (EXACT_PLACE_REGISTRY[lookupKey]) {{
    targetKey = lookupKey;
  }} else if (PLACE_ALIAS_MAP[lookupKey]) {{
    targetKey = PLACE_ALIAS_MAP[lookupKey];
  }} else if (EXACT_PLACE_REGISTRY[matchedKey]) {{
    targetKey = matchedKey;
  }} else if (PLACE_ALIAS_MAP[matchedKey]) {{
    targetKey = PLACE_ALIAS_MAP[matchedKey];
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

  // PRIORITY 3: Destination-Scoped Alias Matching against EXACT_PLACE_REGISTRY
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
        if (al.length >= 3 && !GENERIC_WORDS_SET.has(al) && (placeNorm.startsWith(`${{al}}-`) || placeNorm.endsWith(`-${{al}}`) || placeNorm.includes(`-${{al}}-`))) {{
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

  // PRIORITY 4: Verified Local Asset on Disk (Exact Place Path)
  if (existingImageUrl && existingImageUrl.startsWith("/images/places/") && !existingImageUrl.includes("/categories/") && !existingImageUrl.includes("/fallbacks/") && !existingImageUrl.includes("/universal/")) {{
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

  // PRIORITY 5: Destination Category Fallback
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

  // PRIORITY 6 & 7: Universal Fallback
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

def generate_backend_py(places_dict, place_alias_map, hotels_dict, hotel_alias_map, dest_cat_dict) -> str:
    destination_heroes_dict = {
        d["slug"]: {
            "hero": f"/images/destinations/{d['slug']}/hero.jpg",
            "illustration": f"/images/destinations/{d['slug']}/illustration.jpg"
        }
        for d in CANONICAL_26_DESTINATIONS
    }

    py_code = f'''import os
import re
import json
import logging
from typing import Dict, Any, Optional, List, Set, Tuple
from app.core.config import settings
from app.providers.base import ArtworkProvider

logger = logging.getLogger("vanvas.artwork")

GENERIC_WORDS = {{
    "hotel", "resort", "homestay", "hostel", "guesthouse", "guest-house", "cottage", "palace", "haveli",
    "cafe", "cafes", "restaurant", "dhaba", "dining", "retreat", "sanctuary", "temple", "monastery",
    "ashram", "waterfall", "falls", "lake", "viewpoint", "point", "sunset", "trail", "trek", "park",
    "garden", "gardens", "bazaar", "market", "chowk", "ghat", "dham", "mandir", "wood", "woods", "stone",
    "himalayan", "apple", "orchard", "loft", "lodge", "camp", "camps", "villa", "villas", "inn", "house",
    "hub", "fleet", "rentals", "rental", "scooters", "scooter", "bike", "bikes", "motorcycle", "self-drive",
    "drift", "acoustic", "hill", "hills", "view", "views", "pine", "cedar", "beach", "coast", "coastline",
    "cove", "ridge", "estate", "residency", "stay", "stays", "traveler", "circle", "square"
}}

import unicodedata

def clean_string(s: str) -> str:
    if not s:
        return ""
    s_clean = str(s).lower().strip()
    s_clean = s_clean.replace("&", "and").replace("'", "").replace("’", "").replace("`", "").replace("\\u2019", "").replace("\\ufffd", "e")
    for dash in ["—", "–", "‐", "‑", "‒", "–", "—", "―", "−", "－", "_", "/", "\\\\"]:
        s_clean = s_clean.replace(dash, "-")
    s_norm = unicodedata.normalize('NFKD', s_clean).encode('ASCII', 'ignore').decode('utf-8')
    return re.sub(r"[^a-z0-9]+", "-", s_norm).strip("-")

def classify_category_theme(category: str, place_name: str = "") -> str:
    cat = (category or "").lower()
    name = (place_name or "").lower()

    if any(k in cat for k in ["mobility", "rental", "transport", "scooter", "bike", "vehicle"]):
        return "transport"
    if any(k in name for k in ["rentals", "rental", "scooters", "scooter", "motorcycle", "bike hub", "fleet", "self-drive"]):
        return "transport"
    if any(k in cat for k in ["stay", "hotel", "resort", "hostel", "homestay", "sanctuary"]):
        return "stay"
    if any(k in name for k in ["hotel", "resort", "homestay", "hostel", "guesthouse", "guest house", "cottage", "palace hotel", "inn &", "inn and"]):
        return "stay"
    if any(k in name for k in ["temple", "ashram", "mandir", "kund", "aarti", "ghat", "dham", "gurudwara", "math"]):
        return "spiritual"
    if any(k in cat for k in ["spiritual", "temple", "ashram", "pilgrim"]):
        return "spiritual"
    if any(k in name for k in ["monastery", "gompa", "stupa"]) or "monastery" in cat:
        return "monastery"
    if any(k in name for k in ["church", "cathedral", "basilica"]) or "church" in cat:
        return "church"
    if any(k in cat for k in ["caf", "bakery", "coffee"]) or any(k in name for k in ["cafe", "café", "bakery", "coffee", "bistro", "roastery"]):
        return "cafe"
    if any(k in cat for k in ["food", "dining", "restaurant", "street"]) or any(k in name for k in ["dhaba", "restaurant", "dining", "lassi", "sweets", "food", "kitchen", "thali", "bhojanalaya"]):
        return "food"
    if any(k in cat for k in ["heritage", "culture", "monument", "historic", "fort", "palace", "museum"]) or any(k in name for k in ["fort", "palace", "haveli", "museum", "ruins", "memorial", "tomb", "archaeological"]):
        return "heritage"
    if any(k in cat for k in ["waterfall", "falls"]) or any(k in name for k in ["waterfall", "falls"]):
        return "waterfall"
    if any(k in cat for k in ["lake", "dam"]) or any(k in name for k in ["lake", "taal", "tso", "dam", "pichola"]):
        return "lake"
    if any(k in cat for k in ["beach", "coast"]) or any(k in name for k in ["beach", "cove", "coast"]):
        return "beach"
    if any(k in cat for k in ["viewpoint", "scenic"]) or any(k in name for k in ["viewpoint", "crest", "top", "sunset point", "peak", "summit", "pass"]):
        return "viewpoint"
    if any(k in cat for k in ["nature", "trail", "wildlife", "forest", "park", "garden", "trek", "adventure"]) or any(k in name for k in ["trail", "meadow", "forest", "park", "garden", "wildlife", "safari", "sanctuary"]):
        return "nature"
    if any(k in cat for k in ["market", "shopping", "craft", "shop"]) or any(k in name for k in ["market", "bazaar", "mall", "chowk", "plaza", "shop"]):
        return "shopping"
    return "nature"

class CuratedArtworkProvider(ArtworkProvider):
    """
    Production Curated & Local Artwork Resolver.
    Provides deterministic place and hotel visual intelligence adhering to strict Resolution Hierarchy:
    LEVEL 1: Verified real external / live photograph
    LEVEL 2: Curated exact-place / hotel artwork (Direct Key & Alias Lookup)
    LEVEL 3: Destination-scoped alias matching
    LEVEL 4: Verified local asset file on disk
    LEVEL 5: Destination category fallback
    LEVEL 6: Universal fallback
    """

    PLACE_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {json.dumps(places_dict, indent=8)}

    HOTEL_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {json.dumps(hotels_dict, indent=8)}

    DESTINATION_CATEGORY_REGISTRY: Dict[str, Dict[str, Any]] = {json.dumps(dest_cat_dict, indent=8)}

    DESTINATION_HEROES: Dict[str, Dict[str, str]] = {json.dumps(destination_heroes_dict, indent=8)}

    PLACE_ALIAS_MAP: Dict[str, str] = {json.dumps(place_alias_map, indent=8)}

    HOTEL_ALIAS_MAP: Dict[str, str] = {json.dumps(hotel_alias_map, indent=8)}

    def __init__(self):
        self._alias_map = self.PLACE_ALIAS_MAP
        self._hotel_alias_map = self.HOTEL_ALIAS_MAP

    def _normalize_key(self, destination: str, place_name: str) -> str:
        return f"{{clean_string(destination)}}:{{clean_string(place_name)}}"

    def _classify_category_theme(self, category: str, place_name: str = "") -> str:
        return classify_category_theme(category, place_name)

    def _resolve_regional_fallback(self, destination: str = "", category_or_theme: str = "") -> str:
        dest_lower = (destination or "").lower()
        cat_lower = (category_or_theme or "").lower()
        if any(w in cat_lower for w in ["beach", "coast", "sea", "ocean", "cove"]) or any(w in dest_lower for w in ["goa", "gokarna", "kerala", "andaman", "pondicherry"]):
            return "/images/destinations/fallbacks/coastal.jpg"
        if any(w in cat_lower for w in ["desert", "sand", "dune"]) or any(w in dest_lower for w in ["jaipur", "jodhpur", "jaisalmer", "rajasthan", "bikaner", "pushkar"]):
            return "/images/destinations/fallbacks/desert.jpg"
        if any(w in cat_lower for w in ["ghat", "river", "temple", "spiritual", "aarti", "monument", "heritage", "bazaar", "market", "metro", "city"]) or any(w in dest_lower for w in ["varanasi", "ayodhya", "rishikesh", "haridwar", "ujjain", "hampi", "delhi", "agra", "lucknow", "amritsar", "ncr", "pune", "kolkata"]):
            return "/images/destinations/fallbacks/valley.jpg"
        return "/images/destinations/fallbacks/himalayan.jpg"

    def _get_universal_fallback(self, theme: str) -> str:
        theme_map = {{
            "cafe": "/images/places/universal/cafe.webp",
            "food": "/images/places/universal/food.webp",
            "stay": "/images/places/universal/stay.webp",
            "monastery": "/images/places/universal/monastery.webp",
            "church": "/images/places/universal/church.webp",
            "spiritual": "/images/places/universal/spiritual.webp",
            "heritage": "/images/places/universal/heritage.webp",
            "trail": "/images/places/universal/nature.webp",
            "waterfall": "/images/places/universal/waterfall.webp",
            "lake": "/images/places/universal/lake.webp",
            "beach": "/images/places/universal/beach.webp",
            "viewpoint": "/images/places/universal/viewpoint.webp",
            "shopping": "/images/places/universal/cafe.webp",
            "transport": "/images/places/universal/transport.webp",
        }}
        return theme_map.get(theme, "/images/places/universal/nature.webp")

    @classmethod
    def detect_artwork_collisions(cls) -> List[str]:
        asset_map: Dict[str, List[str]] = {{}}
        warnings: List[str] = []

        for key, item in cls.PLACE_ARTWORK_REGISTRY.items():
            img_url = item["image_url"]
            if img_url not in asset_map:
                asset_map[img_url] = []
            asset_map[img_url].append(key)

        for img_url, keys in asset_map.items():
            if len(keys) > 1:
                msg = f"ARTWORK COLLISION: asset {{img_url}} assigned to multiple exact keys: {{', '.join(keys)}}"
                logger.warning(msg)
                warnings.append(msg)

        return warnings

    async def get_artwork_metadata(self, artwork_key: str) -> Optional[Dict[str, Any]]:
        meta = self.PLACE_ARTWORK_REGISTRY.get(artwork_key) or self.HOTEL_ARTWORK_REGISTRY.get(artwork_key)
        if meta:
            copy_meta = dict(meta)
            copy_meta["source"] = copy_meta.get("source") or "vanvas_curated"
            return copy_meta
        return None

    async def resolve_place_artwork(
        self,
        place_name: str,
        destination_name: str,
        category: str = "Must Visit",
        locality: Optional[str] = None,
        existing_image_url: Optional[str] = None,
        source: Optional[str] = None,
        is_live: bool = False,
        **kwargs: Any
    ) -> Dict[str, Any]:
        dest_norm = clean_string(destination_name)
        place_norm = clean_string(place_name)
        theme = classify_category_theme(category, place_name)
        universal_fallback = f"/images/places/universal/{{theme}}.webp" if theme in ["spiritual", "monastery", "church", "cafe", "food", "heritage", "waterfall", "lake", "beach", "viewpoint", "trail", "nature", "stay", "hostel", "homestay", "resort", "boutique", "transport"] else "/images/places/universal/nature.webp"

        matched_dest = None
        for k in self.DESTINATION_CATEGORY_REGISTRY:
            if dest_norm == k or dest_norm in k or k in dest_norm:
                matched_dest = k
                break

        dest_config = self.DESTINATION_CATEGORY_REGISTRY.get(matched_dest) if matched_dest else None
        dest_cat_fallback = dest_config["categories"].get(theme) if dest_config else None
        safe_fallback = dest_cat_fallback or universal_fallback

        # PRIORITY 1: Verified Real External Photograph
        if existing_image_url and (existing_image_url.startswith("http://") or existing_image_url.startswith("https://")) and "placeholder" not in existing_image_url:
            is_wm = "wikimedia.org" in existing_image_url or "wikidata.org" in existing_image_url
            badge = "EXACT PLACE PHOTO" if is_wm else ("LIVE PLACE PHOTO" if is_live else "VANVAS PLACE ARTWORK")
            return {{
                "url": existing_image_url,
                "fallback_url": safe_fallback,
                "source": "wikimedia" if is_wm else (source or "live_provider"),
                "source_type": "real_photo",
                "provenance": "exact_place" if is_wm else ("live_place" if is_live else "destination_category"),
                "semantic_category": theme,
                "exactness": "exact" if (is_wm or is_live) else "approximate",
                "attribution": "Wikimedia Commons / Verified Open Source" if is_wm else "Live Provider Photograph",
                "alt_text": f"{{place_name}} in {{destination_name}}",
                "badge_label": badge,
                "artwork_key": f"photo:{{place_norm}}",
                "image_url": existing_image_url,
                "tier": "exact_place" if is_wm else "live_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": True,
                "badge": badge,
                "visual_description": f"Verified photograph of {{place_name}}."
            }}

        # PRIORITY 2: Curated Exact Place Match (Direct Key Lookup & Alias Map)
        lookup_key = f"{{dest_norm}}:{{place_norm}}"
        matched_key = f"{{matched_dest}}:{{place_norm}}" if matched_dest else lookup_key
        target_key = None
        if lookup_key in self.PLACE_ARTWORK_REGISTRY:
            target_key = lookup_key
        elif lookup_key in self._alias_map:
            target_key = self._alias_map[lookup_key]
        elif matched_key in self.PLACE_ARTWORK_REGISTRY:
            target_key = matched_key
        elif matched_key in self._alias_map:
            target_key = self._alias_map[matched_key]

        if target_key and target_key in self.PLACE_ARTWORK_REGISTRY:
            item = self.PLACE_ARTWORK_REGISTRY[target_key]
            return {{
                "url": item["image_url"],
                "fallback_url": safe_fallback,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": item.get("semantic_theme", theme),
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Editorial Asset"),
                "alt_text": f"{{place_name}} in {{destination_name}}",
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
            }}

        # PRIORITY 3: Destination-Scoped Alias Matching against PLACE_ARTWORK_REGISTRY
        best_exact_match = None
        for reg_key, item in self.PLACE_ARTWORK_REGISTRY.items():
            reg_dest, reg_place = reg_key.split(":")
            if reg_dest == dest_norm or reg_dest in dest_norm or dest_norm in reg_dest:
                aliases = item.get("aliases", [reg_place])
                if place_norm == reg_place or place_norm in aliases:
                    best_exact_match = (reg_key, item)
                    break
                for al in aliases:
                    if len(al) >= 3 and al not in GENERIC_WORDS and (place_norm.startswith(f"{{al}}-") or place_norm.endswith(f"-{{al}}") or f"-{{al}}-" in place_norm):
                        best_exact_match = (reg_key, item)
                        break
                if best_exact_match:
                    break

        if best_exact_match:
            reg_key, item = best_exact_match
            return {{
                "url": item["image_url"],
                "fallback_url": safe_fallback,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": item.get("semantic_theme", theme),
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Editorial Asset"),
                "alt_text": f"{{place_name}} in {{destination_name}}",
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
            }}

        # PRIORITY 4: Verified Local Asset File on Disk
        if existing_image_url and existing_image_url.startswith("/images/places/") and not any(k in existing_image_url for k in ["/categories/", "/fallbacks/", "/universal/"]):
            badge = "VANVAS PLACE ARTWORK"
            return {{
                "url": existing_image_url,
                "fallback_url": safe_fallback,
                "source": source or "vanvas_curated",
                "source_type": "editorial_artwork",
                "provenance": "exact_place",
                "semantic_category": theme,
                "exactness": "exact",
                "attribution": "VANVAS Verified Editorial Asset",
                "alt_text": f"{{place_name}} in {{destination_name}}",
                "badge_label": badge,
                "artwork_key": f"exact:{{dest_norm}}:{{place_norm}}",
                "image_url": existing_image_url,
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": badge,
                "visual_description": f"Verified editorial asset for {{place_name}}."
            }}

        # HARD ISOLATION FOR STAYS: Never inherit generic non-stay or landmark artwork
        if theme == "stay":
            stay_asset = (dest_config["categories"].get("stay") if dest_config else None) or universal_fallback
            tier_name = "destination_category" if dest_config else "regional_fallback"
            badge_name = "DESTINATION CATEGORY ART" if dest_config else "REGIONAL ART"
            return {{
                "url": stay_asset,
                "fallback_url": universal_fallback,
                "source": "vanvas_curated",
                "source_type": "category_photo",
                "provenance": tier_name,
                "semantic_category": "stay",
                "exactness": "category_matched" if dest_config else "fallback",
                "attribution": f"VANVAS Curated {{destination_name}} Stay Sanctuary",
                "alt_text": f"{{place_name}} in {{destination_name}}",
                "badge_label": badge_name,
                "artwork_key": f"{{matched_dest or 'universal'}}:stay",
                "image_url": stay_asset,
                "tier": tier_name,
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": badge_name,
                "visual_description": f"Serene stay and hospitality sanctuary in {{destination_name}}.",
                "metadata": {{"destination": matched_dest, "theme": "stay", "category_theme": "stay"}}
            }}

        # PRIORITY 5: Destination Category Fallback
        if dest_cat_fallback:
            return {{
                "url": dest_cat_fallback,
                "fallback_url": universal_fallback,
                "source": "vanvas_curated",
                "source_type": "category_photo",
                "provenance": "destination_category",
                "semantic_category": theme,
                "exactness": "category_matched",
                "attribution": f"VANVAS Curated {{destination_name}} Atmosphere",
                "alt_text": f"{{place_name}} in {{destination_name}}",
                "badge_label": "DESTINATION CATEGORY ART",
                "artwork_key": f"{{matched_dest}}:{{theme}}",
                "image_url": dest_cat_fallback,
                "tier": "destination_category",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": "DESTINATION CATEGORY ART",
                "visual_description": f"Authentic {{destination_name}} {{theme}} visual.",
                "metadata": {{"destination": matched_dest, "theme": theme, "category_theme": theme}}
            }}

        # PRIORITY 6: Regional / Universal Category Fallback
        if theme in ["cafe", "food", "waterfall", "monastery", "church", "shopping", "transport"]:
            fallback_img = universal_fallback
            tier_name = "regional_fallback"
            badge_name = "REGIONAL ART"
        else:
            fallback_img = self._resolve_regional_fallback(destination_name, f"{{category}} {{theme}}")
            tier_name = "regional_fallback"
            badge_name = "REGIONAL ART"

        return {{
            "url": fallback_img,
            "fallback_url": universal_fallback,
            "source": "vanvas_regional",
            "source_type": tier_name,
            "provenance": tier_name,
            "semantic_category": theme,
            "exactness": "fallback",
            "attribution": "VANVAS Curated Atmospheric Visual",
            "alt_text": f"{{place_name}} in {{destination_name}}",
            "badge_label": badge_name,
            "artwork_key": f"{{tier_name}}:{{theme}}",
            "image_url": fallback_img,
            "tier": tier_name,
            "place_name": place_name,
            "destination": destination_name,
            "category": category,
            "is_real_photo": False,
            "badge": badge_name,
            "visual_description": f"Regional atmospheric visual for {{category}}.",
            "metadata": {{"category_theme": theme, "regional_fallback": fallback_img, "universal_fallback": universal_fallback}}
        }}

    async def resolve_hotel_artwork(
        self,
        property_name: str,
        destination_name: str,
        hotel_style: str = "Boutique Sanctuary",
        locality: Optional[str] = None,
        existing_image_url: Optional[str] = None,
        source: Optional[str] = None,
        is_live: bool = False,
        **kwargs: Any
    ) -> Dict[str, Any]:
        dest_norm = clean_string(destination_name)
        hotel_norm = clean_string(property_name)
        universal_fallback = "/images/places/universal/stay.webp"

        matched_dest = None
        for k in self.DESTINATION_CATEGORY_REGISTRY:
            if dest_norm == k or dest_norm in k or k in dest_norm:
                matched_dest = k
                break

        dest_config = self.DESTINATION_CATEGORY_REGISTRY.get(matched_dest) if matched_dest else None
        dest_stay_fallback = dest_config["categories"].get("stay") if dest_config else universal_fallback

        # PRIORITY 1: Verified Real External Photograph
        if existing_image_url and (existing_image_url.startswith("http://") or existing_image_url.startswith("https://")) and "placeholder" not in existing_image_url:
            is_wm = "wikimedia.org" in existing_image_url or "wikidata.org" in existing_image_url
            badge = "EXACT PLACE PHOTO" if is_wm else ("LIVE PLACE PHOTO" if is_live else "VANVAS PLACE ARTWORK")
            return {{
                "url": existing_image_url,
                "fallback_url": dest_stay_fallback,
                "source": "wikimedia" if is_wm else (source or "live_provider"),
                "source_type": "real_photo",
                "provenance": "exact_place" if is_wm else ("live_place" if is_live else "destination_category"),
                "semantic_category": "stay",
                "exactness": "exact" if (is_wm or is_live) else "approximate",
                "attribution": "Wikimedia Commons / Verified Open Source" if is_wm else "Verified Hotel Photograph",
                "alt_text": f"{{property_name}} in {{destination_name}}",
                "badge_label": badge,
                "artwork_key": f"stay:photo:{{hotel_norm}}",
                "image_url": existing_image_url,
                "tier": "exact_place" if is_wm else "live_place",
                "place_name": property_name,
                "destination": destination_name,
                "category": "Stays & Sanctuaries",
                "is_real_photo": True,
                "badge": badge,
                "visual_description": f"Verified photograph of {{property_name}}."
            }}

        # PRIORITY 2: Curated Exact Hotel Registry (Direct Key Lookup & Alias Map)
        lookup_key = f"{{dest_norm}}:{{hotel_norm}}"
        matched_key = f"{{matched_dest}}:{{hotel_norm}}" if matched_dest else lookup_key
        target_key = None
        if lookup_key in self.HOTEL_ARTWORK_REGISTRY:
            target_key = lookup_key
        elif lookup_key in self._hotel_alias_map:
            target_key = self._hotel_alias_map[lookup_key]
        elif matched_key in self.HOTEL_ARTWORK_REGISTRY:
            target_key = matched_key
        elif matched_key in self._hotel_alias_map:
            target_key = self._hotel_alias_map[matched_key]

        if target_key and target_key in self.HOTEL_ARTWORK_REGISTRY:
            item = self.HOTEL_ARTWORK_REGISTRY[target_key]
            return {{
                "url": item["image_url"],
                "fallback_url": dest_stay_fallback,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": "stay",
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Property Asset"),
                "alt_text": f"{{property_name}} in {{destination_name}}",
                "badge_label": "VANVAS PLACE ARTWORK",
                "artwork_key": target_key,
                "image_url": item["image_url"],
                "tier": "exact_place",
                "place_name": property_name,
                "destination": destination_name,
                "category": "Stays & Sanctuaries",
                "is_real_photo": False,
                "badge": "VANVAS PLACE ARTWORK",
                "visual_description": item.get("visual_description"),
                "metadata": item
            }}

        # PRIORITY 3: Destination-Scoped Alias Matching against HOTEL_ARTWORK_REGISTRY
        best_exact_match = None
        for reg_key, item in self.HOTEL_ARTWORK_REGISTRY.items():
            reg_dest, reg_hotel = reg_key.split(":")
            if reg_dest == dest_norm or reg_dest in dest_norm or dest_norm in reg_dest:
                aliases = item.get("aliases", [reg_hotel])
                if hotel_norm == reg_hotel or hotel_norm in aliases:
                    best_exact_match = (reg_key, item)
                    break
                for al in aliases:
                    if len(al) >= 3 and al not in GENERIC_WORDS and (hotel_norm.startswith(f"{{al}}-") or hotel_norm.endswith(f"-{{al}}") or f"-{{al}}-" in hotel_norm):
                        best_exact_match = (reg_key, item)
                        break
                if best_exact_match:
                    break

        if best_exact_match:
            reg_key, item = best_exact_match
            return {{
                "url": item["image_url"],
                "fallback_url": dest_stay_fallback,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": "stay",
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Property Asset"),
                "alt_text": f"{{property_name}} in {{destination_name}}",
                "badge_label": "VANVAS PLACE ARTWORK",
                "artwork_key": reg_key,
                "image_url": item["image_url"],
                "tier": "exact_place",
                "place_name": property_name,
                "destination": destination_name,
                "category": "Stays & Sanctuaries",
                "is_real_photo": False,
                "badge": "VANVAS PLACE ARTWORK",
                "visual_description": item.get("visual_description"),
                "metadata": item
            }}

        # PRIORITY 4: Verified Local Property Asset on Disk
        if existing_image_url and existing_image_url.startswith("/images/places/") and "/stays/" in existing_image_url and not any(k in existing_image_url for k in ["/categories/", "/fallbacks/", "/universal/"]):
            badge = "VANVAS PLACE ARTWORK"
            return {{
                "url": existing_image_url,
                "fallback_url": dest_stay_fallback,
                "source": source or "vanvas_curated",
                "source_type": "editorial_artwork",
                "provenance": "exact_place",
                "semantic_category": "stay",
                "exactness": "exact",
                "attribution": "VANVAS Verified Property Asset",
                "alt_text": f"{{property_name}} in {{destination_name}}",
                "badge_label": badge,
                "artwork_key": f"stay:exact:{{dest_norm}}:{{hotel_norm}}",
                "image_url": existing_image_url,
                "tier": "exact_place",
                "place_name": property_name,
                "destination": destination_name,
                "category": "Stays & Sanctuaries",
                "is_real_photo": False,
                "badge": badge,
                "visual_description": f"Verified property artwork for {{property_name}}."
            }}

        # PRIORITY 5: Destination Stay Fallback
        if dest_stay_fallback:
            return {{
                "url": dest_stay_fallback,
                "fallback_url": universal_fallback,
                "source": "vanvas_curated",
                "source_type": "category_photo",
                "provenance": "destination_category",
                "semantic_category": "stay",
                "exactness": "category_matched",
                "attribution": f"VANVAS Curated {{destination_name}} Stay Sanctuary",
                "alt_text": f"{{property_name}} in {{destination_name}}",
                "badge_label": "DESTINATION CATEGORY ART",
                "artwork_key": f"{{matched_dest}}:stay",
                "image_url": dest_stay_fallback,
                "tier": "destination_category",
                "place_name": property_name,
                "destination": destination_name,
                "category": "Stays & Sanctuaries",
                "is_real_photo": False,
                "badge": "DESTINATION CATEGORY ART",
                "visual_description": f"Authentic {{destination_name}} stay sanctuary visual."
            }}

        # PRIORITY 6: Universal Fallback
        return {{
            "url": universal_fallback,
            "fallback_url": universal_fallback,
            "source": "vanvas_universal",
            "source_type": "category_photo",
            "provenance": "universal_fallback",
            "semantic_category": "stay",
            "exactness": "approximate",
            "attribution": "VANVAS Universal Stay Atmosphere",
            "alt_text": f"{{property_name}} in {{destination_name}}",
            "badge_label": "UNIVERSAL FALLBACK",
            "artwork_key": "universal:stay",
            "image_url": universal_fallback,
            "tier": "universal_fallback",
            "place_name": property_name,
            "destination": destination_name,
            "category": "Stays & Sanctuaries",
            "is_real_photo": False,
            "badge": "UNIVERSAL FALLBACK",
            "visual_description": f"Universal accommodation sanctuary visual."
        }}

class OptionalAIArtworkProvider(CuratedArtworkProvider):
    """
    Artwork provider that utilizes curated sanctuary assets and supports optional AI extensions.
    """
    def __init__(self, groq_api_key: Optional[str] = None):
        super().__init__()
        self.groq_api_key = groq_api_key
'''
    return py_code

def main():
    print("Building visual registries across all 26 destinations...")
    places_dict, place_alias_map, hotels_dict, hotel_alias_map, dest_cat_dict = build_data_structures()
    
    print(f"Places registered: {len(places_dict)}, Place Aliases: {len(place_alias_map)}")
    print(f"Hotels registered: {len(hotels_dict)}, Hotel Aliases: {len(hotel_alias_map)}")
    print(f"Destinations configured: {len(dest_cat_dict)}")

    # 1. Generate frontend
    ts_code = generate_frontend_ts(places_dict, place_alias_map, hotels_dict, hotel_alias_map, dest_cat_dict)
    with open(FRONTEND_RESOLVER, "w", encoding="utf-8") as f:
        f.write(ts_code)
    print(f"[SUCCESS] Wrote frontend resolver to {FRONTEND_RESOLVER} ({len(ts_code)} bytes)")

    # 2. Generate backend
    py_code = generate_backend_py(places_dict, place_alias_map, hotels_dict, hotel_alias_map, dest_cat_dict)
    with open(BACKEND_PROVIDER, "w", encoding="utf-8") as f:
        f.write(py_code)
    print(f"[SUCCESS] Wrote backend provider to {BACKEND_PROVIDER} ({len(py_code)} bytes)")

if __name__ == "__main__":
    main()
