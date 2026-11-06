import os
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

import unicodedata

def clean_string(s: str) -> str:
    if not s:
        return ""
    s_clean = str(s).lower().strip()
    s_clean = s_clean.replace("&", "and").replace("'", "").replace("’", "").replace("`", "").replace("\u2019", "").replace("\ufffd", "e")
    for dash in ["—", "–", "‐", "‑", "‒", "–", "—", "―", "−", "－", "_", "/", "\\"]:
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

    PLACE_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {
        "agra:taj-mahal-white-marble-monument": {
                "place_name": "Taj Mahal White Marble Monument",
                "image_url": "/images/places/agra/taj-mahal.webp",
                "visual_description": "17th-century UNESCO World Heritage white marble mausoleum built by Shah Jahan on the banks of the Yamuna River.",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "taj-mahal",
                        "taj-mahal-white-marble-monument"
                ]
        },
        "agra:agra-red-fort-and-jahangiri-mahal": {
                "place_name": "Agra Red Fort & Jahangiri Mahal",
                "image_url": "/images/places/agra/agra-red-fort.webp",
                "visual_description": "Historic red sandstone fortress residence of the Mughal emperors with expansive courtyards and direct vistas of the Taj Mahal.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "agra-red-fort",
                        "agra-red-fort-and-jahangiri-mahal",
                        "jahangiri-mahal",
                        "red-fort"
                ]
        },
        "agra:mehtab-bagh-moonlight-river-gardens": {
                "place_name": "Mehtab Bagh (Moonlight River Gardens)",
                "image_url": "/images/places/agra/mehtab-bagh.webp",
                "visual_description": "Charbagh-style Mughal garden complex aligned perfectly across the Yamuna from the Taj Mahal, ideal for peaceful reflection photography.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mehtab-bagh",
                        "mehtab-bagh-moonlight-river-gardens",
                        "moonlight-river-gardens"
                ]
        },
        "agra:fatehpur-sikri-imperial-capital-city": {
                "place_name": "Fatehpur Sikri Imperial Capital City",
                "image_url": "/images/places/agra/fatehpur-sikri.webp",
                "visual_description": "Emperor Akbar's 16th-century red sandstone capital featuring the towering 54m Buland Darwaza and the marble tomb of Salim Chishti.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "fatehpur-sikri",
                        "fatehpur-sikri-imperial-capital-city"
                ]
        },
        "agra:tomb-of-itimad-ud-daulah-baby-taj": {
                "place_name": "Tomb of I'timad-ud-Daulah (Baby Taj)",
                "image_url": "/images/places/agra/itmad-ud-daulah.webp",
                "visual_description": "Exquisite jewel-box mausoleum built in 1628 with fine marble lattice screens and pioneering pietra dura semi-precious stone inlay work.",
                "category": "Hidden Gems",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "baby-taj",
                        "itmad-ud-daulah",
                        "tomb-of-itimad-ud-daulah",
                        "tomb-of-itimad-ud-daulah-baby-taj"
                ]
        },
        "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi": {
                "place_name": "Shankar Mithai Bhandar (Bedmi Puri & Jalebi)",
                "image_url": "/images/places/agra/shankar-mithai-bedmi.webp",
                "visual_description": "Historic Agra breakfast spot in the Old City serving hot urad-dal stuffed Bedmi Puris with spicy Hing aloo sabzi and crisp saffron jalebis.",
                "category": "Local Food",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bedmi-puri",
                        "jalebi",
                        "shankar-mithai-bedmi",
                        "shankar-mithai-bhandar",
                        "shankar-mithai-bhandar-bedmi-puri-and-jalebi"
                ]
        },
        "agra:panchhi-petha-original-sadar-bazaar": {
                "place_name": "Panchhi Petha Original Sadar Bazaar",
                "image_url": "/images/places/agra/panchhi-petha-store.webp",
                "visual_description": "The authentic master confectioner of Agra serving Angoori Petha, Kesar Petha, Chocolate Petha, and crunchy Dalmoth namkeen.",
                "category": "Local Food",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "panchhi-petha-original-sadar-bazaar",
                        "panchhi-petha-store"
                ]
        },
        "agra:akbars-great-tomb-at-sikandra": {
                "place_name": "Akbar's Great Tomb at Sikandra",
                "image_url": "/images/places/agra/akbar-tomb-sikandra.webp",
                "visual_description": "Grand five-tiered red sandstone and white marble tomb set within a vast 119-acre garden where blackbuck deer and peacocks roam freely.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "akbar-tomb-sikandra",
                        "akbars-great-tomb-at-sikandra"
                ]
        },
        "agra:chini-ka-rauza-persian-glazed-tile-tomb": {
                "place_name": "Chini Ka Rauza (Persian Glazed Tile Tomb)",
                "image_url": "/images/places/agra/hero.webp",
                "visual_description": "A 1635 Persian architectural masterpiece dedicated to Afzal Khan Shirazi, famous for vibrant turquoise and lapis-lazuli glazed tilework.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chini-ka-rauza",
                        "chini-ka-rauza-persian-glazed-tile-tomb",
                        "persian-glazed-tile-tomb"
                ]
        },
        "agra:mariam-uz-zamani-tomb-empress-jodha-bai": {
                "place_name": "Mariam-uz-Zamani Tomb (Empress Jodha Bai)",
                "image_url": "/images/places/agra/mariams-tomb-sikandra.webp",
                "visual_description": "The peaceful red sandstone garden tomb of Emperor Akbar\u2019s Rajput queen Mariam-uz-Zamani, originally built by Sikandar Lodi in 1495.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "empress-jodha-bai",
                        "mariam-uz-zamani-tomb",
                        "mariam-uz-zamani-tomb-empress-jodha-bai",
                        "mariams-tomb-sikandra"
                ]
        },
        "agra:kinari-bazaar-heritage-zardozi-and-spice-market": {
                "place_name": "Kinari Bazaar Heritage Zardozi & Spice Market",
                "image_url": "/images/places/agra/kinari-bazaar-crafts.webp",
                "visual_description": "A vibrant maze of medieval alleys behind Jama Masjid packed with artisan marble inlay carvers, gold zardozi embroiderers, and spice merchants.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kinari-bazaar-crafts",
                        "kinari-bazaar-heritage-zardozi",
                        "kinari-bazaar-heritage-zardozi-and-spice-market",
                        "spice-market"
                ]
        },
        "agra:soor-sarovar-bird-sanctuary-and-keetham-lake": {
                "place_name": "Soor Sarovar Bird Sanctuary & Keetham Lake",
                "image_url": "/images/places/agra/soor-sarovar-lake.webp",
                "visual_description": "A 4 sq km wetland bird sanctuary and Keetham Lake housing over 165 species of migratory waterfowl and the Wildlife SOS sloth bear conservation centre.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "keetham-lake",
                        "soor-sarovar-bird-sanctuary",
                        "soor-sarovar-bird-sanctuary-and-keetham-lake",
                        "soor-sarovar-lake"
                ]
        },
        "agra:taj-nature-walk-forest-ridge-trail": {
                "place_name": "Taj Nature Walk Forest Ridge Trail",
                "image_url": "/images/places/agra/taj-nature-walk-ridge.webp",
                "visual_description": "A 70-hectare woodland reserve with elevated timber watchtowers offering secluded vistas of the Taj Mahal dome through native dhau trees.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "taj-nature-walk-forest-ridge-trail",
                        "taj-nature-walk-ridge"
                ]
        },
        "agra:aram-bagh-babur-1528-charbagh-garden": {
                "place_name": "Aram Bagh (Babur 1528 Charbagh Garden)",
                "image_url": "/images/places/agra/ram-bagh-gardens.webp",
                "visual_description": "The oldest surviving Mughal garden in India built by first emperor Babur in 1528, using three stepped water terraces fed by the Yamuna.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "aram-bagh",
                        "aram-bagh-babur-1528-charbagh-garden",
                        "babur-1528-charbagh-garden",
                        "ram-bagh-gardens"
                ]
        },
        "agra:dasaprakash-heritage-south-indian-dining": {
                "place_name": "Dasaprakash Heritage South Indian Dining",
                "image_url": "/images/places/agra/dasaprakash-agra-cantt.webp",
                "visual_description": "A historic cantonment restaurant operating since the 1950s famous for crisp ghee roast dosas, idlis, and signature fresh ice cream sundaes.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dasaprakash-agra-cantt",
                        "dasaprakash-cantt",
                        "dasaprakash-heritage-south-indian-dining"
                ]
        },
        "agra:korai-tribal-craft-village-en-route-fatehpur": {
                "place_name": "Korai Tribal Craft Village En-Route Fatehpur",
                "image_url": "/images/places/agra/korai-rural-village.webp",
                "visual_description": "A rural settlement of the Qalandar community showcasing traditional mud huts, folk songs, and rustic craft life away from the highway.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "korai-rural-village",
                        "korai-tribal-craft-village-en-route-fatehpur"
                ]
        },
        "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club": {
                "place_name": "Siliserh Lake Palace & Royal Boat Club",
                "image_url": "/images/places/alwar-siliserh/siliserh-lake-palace.webp",
                "visual_description": "1845 royal hunting lodge built by Maharaja Vinay Singh atop a hillock jutting into the peaceful 10.5 sq km Siliserh water reservoir.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "royal-boat-club",
                        "siliserh-lake-palace",
                        "siliserh-lake-palace-and-royal-boat-club"
                ]
        },
        "alwar-siliserh:bala-quila-alwar-hilltop-fort": {
                "place_name": "Bala Quila (Alwar Hilltop Fort)",
                "image_url": "/images/places/alwar-siliserh/bala-quila-alwar-fort.webp",
                "visual_description": "Massive 10th-century fortification standing 300m above the city with 51 large towers, 446 loopholes for musketry, and grand city ramparts.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "alwar-hilltop-fort",
                        "bala-quila",
                        "bala-quila-alwar-fort",
                        "bala-quila-alwar-hilltop-fort"
                ]
        },
        "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal": {
                "place_name": "Alwar City Palace (Vinay Vilas Mahal)",
                "image_url": "/images/places/alwar-siliserh/alwar-city-palace.webp",
                "visual_description": "18th-century palace blending Rajput and Mughal architecture featuring stepped open courtyards, marble pavilions, and the royal Sagar tank.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "alwar-city-palace",
                        "alwar-city-palace-vinay-vilas-mahal",
                        "alwar-siliserh-city-palace",
                        "city-palace",
                        "city-palace-alwar",
                        "city-palace-alwar-siliserh",
                        "city-palace-of-alwar",
                        "city-palace-of-alwar-siliserh",
                        "vinay-vilas-mahal"
                ]
        },
        "alwar-siliserh:moosi-maharani-ki-chhatri-cenotaph": {
                "place_name": "Moosi Maharani Ki Chhatri Cenotaph",
                "image_url": "/images/places/alwar-siliserh/moosi-maharani-chhatri.webp",
                "visual_description": "Double-story cenotaph of red sandstone and pure white marble dedicated to Maharaja Bakhtawar Singh and Rani Moosi, with intricate mythological fres...",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "moosi-maharani-chhatri",
                        "moosi-maharani-ki-chhatri-cenotaph"
                ]
        },
        "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand": {
                "place_name": "Baba Thakur Das & Sons (Origin of Alwar Kalakand)",
                "image_url": "/images/places/alwar-siliserh/baba-thakur-das-kalakand.webp",
                "visual_description": "The historic confectioner operating since 1947 who invented the world-famous Alwar Milk Cake (Kalakand), made from condensed milk and cardamom.",
                "category": "Local Food",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "baba-thakur-das",
                        "baba-thakur-das-and-sons-origin-of-alwar-kalakand",
                        "baba-thakur-das-kalakand",
                        "origin-of-alwar-kalakand",
                        "sons"
                ]
        },
        "alwar-siliserh:jai-samand-lake-oasis": {
                "place_name": "Jai Samand Lake Oasis",
                "image_url": "/images/places/alwar-siliserh/jai-samand-lake-alwar.webp",
                "visual_description": "Large artificial lake built by Maharaja Jai Singh in 1910, surrounded by green lawns, scenic chhattris, and seasonal flamingo flocks.",
                "category": "Nature & Trails",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jai-samand-lake-alwar",
                        "jai-samand-lake-oasis"
                ]
        },
        "alwar-siliserh:government-museum-royal-armor-and-manuscripts": {
                "place_name": "Government Museum (Royal Armor & Manuscripts)",
                "image_url": "/images/places/alwar-siliserh/government-museum-alwar.webp",
                "visual_description": "Museum housed inside the City Palace top floor containing priceless Mughal miniature paintings, Persian manuscripts, and ancient Rajput swords.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "government-museum",
                        "government-museum-alwar",
                        "government-museum-royal-armor-and-manuscripts",
                        "manuscripts",
                        "royal-armor"
                ]
        },
        "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb": {
                "place_name": "Fateh Jung Ka Gumbad (1647 Tomb)",
                "image_url": "/images/places/alwar-siliserh/fateh-jung-gumbad.webp",
                "visual_description": "Majestic 5-story 60-foot domed tomb blending Pathan and Rajput architectural styles, set within quiet gardens near Alwar railway station.",
                "category": "Hidden Gems",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1647-tomb",
                        "fateh-jung-gumbad",
                        "fateh-jung-ka-gumbad",
                        "fateh-jung-ka-gumbad-1647-tomb"
                ]
        },
        "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats": {
                "place_name": "Sagar Water Kund & Royal Bathing Stepped Ghats",
                "image_url": "/images/places/alwar-siliserh/sagar-water-reservoir.webp",
                "visual_description": "An 1813 sacred step-reservoir behind the City Palace enclosed by twelve arched chhatris reflecting in emerald water beneath Bala Quila.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "royal-bathing-stepped-ghats",
                        "sagar-water-kund",
                        "sagar-water-kund-and-royal-bathing-stepped-ghats",
                        "sagar-water-reservoir"
                ]
        },
        "alwar-siliserh:purjan-vihar-company-garden-british-oasis": {
                "place_name": "Purjan Vihar (Company Garden British Oasis)",
                "image_url": "/images/places/alwar-siliserh/hero.webp",
                "visual_description": "A historic garden laid out in 1868 by Maharaja Sheodan Singh with lush fern houses, grand fountains, and a unique summer cooling palace (Shimla).",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "company-garden-british-oasis",
                        "purjan-vihar",
                        "purjan-vihar-company-garden-british-oasis"
                ]
        },
        "alwar-siliserh:tijara-atishaya-kshetra-jain-tirtha": {
                "place_name": "Tijara Atishaya Kshetra Jain Tirtha",
                "image_url": "/images/places/alwar-siliserh/tijara-jain-temple.webp",
                "visual_description": "A revered Jain pilgrimage shrine established in 1956 following the miraculous subterranean discovery of the idol of Bhagwan Chandraprabhu.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tijara-atishaya-kshetra-jain-tirtha",
                        "tijara-jain-temple"
                ]
        },
        "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage": {
                "place_name": "Talvriksha Sacred Springs & Mandavya Hermitage",
                "image_url": "/images/places/alwar-siliserh/talvriksha-hot-springs.webp",
                "visual_description": "A scenic pilgrimage spot nestled between rocky hills where hot and cold natural sulphur water springs flow side-by-side under ancient palm trees.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mandavya-hermitage",
                        "talvriksha-hot-springs",
                        "talvriksha-sacred-springs",
                        "talvriksha-sacred-springs-and-mandavya-hermitage"
                ]
        },
        "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple": {
                "place_name": "Vijay Mandir Palace & Sita Ram Temple",
                "image_url": "/images/places/alwar-siliserh/vijay-mandir-palace.webp",
                "visual_description": "A sprawling 105-room royal palace built in 1918 by Maharaja Jai Singh designed in the silhouette of a grand ship overlooking a scenic lake reservoir.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sita-ram-temple",
                        "vijay-mandir-palace",
                        "vijay-mandir-palace-and-sita-ram-temple"
                ]
        },
        "alwar-siliserh:neelkanth-mahadev-ancient-hilltop-sanctuary": {
                "place_name": "Neelkanth Mahadev Ancient Hilltop Sanctuary",
                "image_url": "/images/places/alwar-siliserh/neelkanth-mahadev-alwar.webp",
                "visual_description": "An ancient stone temple located high in the Rajgarh hill range boasting ornate pillars, carved apsaras, and natural mountain breezes.",
                "category": "Culture & Heritage",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "neelkanth-mahadev-alwar",
                        "neelkanth-mahadev-ancient-hilltop-sanctuary"
                ]
        },
        "alwar-siliserh:hope-circus-heritage-market-and-clock-tower": {
                "place_name": "Hope Circus Heritage Market & Clock Tower",
                "image_url": "/images/places/alwar-siliserh/hope-circus-bazaar.webp",
                "visual_description": "The historic circular roundabout pavilion built in 1937 to commemorate Lady Hope, surrounded by traditional bangle makers, silversmiths, and sweet ...",
                "category": "Local Food & Street Eats",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "clock-tower",
                        "hope-circus-bazaar",
                        "hope-circus-heritage-market",
                        "hope-circus-heritage-market-and-clock-tower"
                ]
        },
        "alwar-siliserh:kalakand-gali-mawa-artisans-street": {
                "place_name": "Kalakand Gali (Mawa Artisans Street)",
                "image_url": "/images/places/alwar-siliserh/kalakand-gali-food.webp",
                "visual_description": "A narrow alley near Sarafa Bazaar lined with copper pans bubbling with fresh buffalo milk being turned into Alwar\u2019s world-renowned fudge.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kalakand-gali",
                        "kalakand-gali-food",
                        "kalakand-gali-mawa-artisans-street",
                        "mawa-artisans-street"
                ]
        },
        "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy": {
                "place_name": "Rock Garden of Chandigarh (Nek Chand's Fantasy)",
                "image_url": "/images/places/chandigarh/rock-garden-chandigarh.webp",
                "visual_description": "A 40-acre sculpture garden built entirely by Nek Chand using industrial, ceramic, and domestic waste, featuring stone courtyards and waterfalls.",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "nek-chands-fantasy",
                        "rock-garden",
                        "rock-garden-chandigarh",
                        "rock-garden-of-chandigarh",
                        "rock-garden-of-chandigarh-nek-chands-fantasy"
                ]
        },
        "chandigarh:sukhna-lake-promenade-and-shivalik-views": {
                "place_name": "Sukhna Lake Promenade & Shivalik Views",
                "image_url": "/images/places/chandigarh/sukhna-lake-promenade.webp",
                "visual_description": "A 3 sq km pristine rain-fed reservoir at the foothills of the Shivalik hills, famous for morning jogging tracks, solar boats, and quiet sunset benc...",
                "category": "Must Visit",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shivalik-views",
                        "sukhna-lake-promenade",
                        "sukhna-lake-promenade-and-shivalik-views"
                ]
        },
        "chandigarh:le-corbusier-capitol-complex-unesco-heritage": {
                "place_name": "Le Corbusier Capitol Complex (UNESCO Heritage)",
                "image_url": "/images/places/chandigarh/capitol-complex-unesco.webp",
                "visual_description": "Le Corbusier's modernist masterwork featuring the monumental Open Hand Monument, Secretariat, High Court, and Palace of Assembly.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "capitol-complex-unesco",
                        "le-corbusier-capitol-complex",
                        "le-corbusier-capitol-complex-unesco-heritage",
                        "unesco-heritage"
                ]
        },
        "chandigarh:zakir-hussain-rose-garden": {
                "place_name": "Zakir Hussain Rose Garden",
                "image_url": "/images/places/chandigarh/rose-garden-chandigarh.webp",
                "visual_description": "Asia's largest botanical rose garden spread over 30 acres, showcasing over 50,000 rose bushes across 1,600 distinct varieties and medicinal trees.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "rose-garden",
                        "rose-garden-chandigarh",
                        "zakir-hussain-rose-garden"
                ]
        },
        "chandigarh:sector-17-open-plaza-and-pedestrian-promenade": {
                "place_name": "Sector 17 Open Plaza & Pedestrian Promenade",
                "image_url": "/images/places/chandigarh/sector-17-plaza.webp",
                "visual_description": "The pedestrian-only open heart of Chandigarh lined with fountain squares, Phulkari embroidery emporiums, bookstores, and coffee houses.",
                "category": "Markets & Craft",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "pedestrian-promenade",
                        "sector-17-open-plaza",
                        "sector-17-open-plaza-and-pedestrian-promenade",
                        "sector-17-plaza"
                ]
        },
        "chandigarh:indian-coffee-house-sector-17-legacy-since-1957": {
                "place_name": "Indian Coffee House (Sector 17 Legacy Since 1957)",
                "image_url": "/images/places/chandigarh/indian-coffee-house-sec17.webp",
                "visual_description": "Iconic vintage institution staffed by turbaned waiters serving filter coffee in white porcelain cups, mutton dosas, and cheese omelettes.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "indian-coffee-house",
                        "indian-coffee-house-sec17",
                        "indian-coffee-house-sector-17-legacy-since-1957",
                        "sector-17-legacy-since-1957"
                ]
        },
        "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema": {
                "place_name": "Pal Dhaba (Legendary Butter Chicken & Keema)",
                "image_url": "/images/places/chandigarh/pal-dhaba-sector28.webp",
                "visual_description": "Chandigarh's most celebrated non-veg dhaba operating since 1968, famous for rich Punjabi Butter Chicken, Mutton Rogan Josh, and garlic naan.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "keema",
                        "legendary-butter-chicken",
                        "pal-dhaba",
                        "pal-dhaba-legendary-butter-chicken-and-keema",
                        "pal-dhaba-sector28"
                ]
        },
        "chandigarh:sector-10-tree-lined-boulevard-cycling-route": {
                "place_name": "Sector 10 Tree-Lined Boulevard Cycling Route",
                "image_url": "/images/places/chandigarh/boulevard-cycling-trail.webp",
                "visual_description": "Dedicated green cycle track running beneath giant banyan and jacaranda canopies connecting the Government Museum to the Arts College.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "boulevard-cycling-trail",
                        "sector-10-tree-lined-boulevard-cycling-route"
                ]
        },
        "chandigarh:japanese-garden-sector-31-zen-sanctuary": {
                "place_name": "Japanese Garden Sector 31 Zen Sanctuary",
                "image_url": "/images/places/chandigarh/japanese-garden-sec31.webp",
                "visual_description": "A 13-acre themed Japanese garden featuring traditional pagodas, Zen rock gardens, koi ponds, a meditation hut, and an illuminated underground tunnel.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "japanese-garden-sec31",
                        "japanese-garden-sector-31-zen-sanctuary"
                ]
        },
        "chandigarh:terraced-garden-and-musical-water-cascade": {
                "place_name": "Terraced Garden & Musical Water Cascade",
                "image_url": "/images/places/chandigarh/terraced-garden-sec33.webp",
                "visual_description": "A 10-acre landscaped park in Sector 33 famous for illuminated musical fountains, annual chrysanthemum shows, and stepped flower terraces.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "musical-water-cascade",
                        "terraced-garden",
                        "terraced-garden-and-musical-water-cascade",
                        "terraced-garden-sec33"
                ]
        },
        "chandigarh:government-museum-and-art-gallery-sector-10": {
                "place_name": "Government Museum & Art Gallery Sector 10",
                "image_url": "/images/places/chandigarh/government-museum-sec10.webp",
                "visual_description": "Designed by Le Corbusier, housing an exceptional collection of ancient Gandhara sculptures, Pahari miniature paintings, and modern Indian art.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "art-gallery-sector-10",
                        "government-museum",
                        "government-museum-and-art-gallery-sector-10",
                        "government-museum-sec10"
                ]
        },
        "chandigarh:national-cactus-and-succulent-botanical-garden": {
                "place_name": "National Cactus and Succulent Botanical Garden",
                "image_url": "/images/places/chandigarh/cactus-garden-panchkula.webp",
                "visual_description": "A 7-acre botanical conservatory holding over 3,500 species of rare, endangered desert cacti and succulents from across four continents.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "cactus-garden-panchkula",
                        "national-cactus-and-succulent-botanical-garden"
                ]
        },
        "chandigarh:open-hand-monument-symbol-of-peace-and-giving": {
                "place_name": "Open Hand Monument (Symbol of Peace & Giving)",
                "image_url": "/images/places/chandigarh/open-hand-monument.webp",
                "visual_description": "A 28-meter tall rotating metal hand sculpture designed by Le Corbusier as the official symbol of Chandigarh: open to give and open to receive.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "giving",
                        "open-hand-monument",
                        "open-hand-monument-symbol-of-peace-and-giving",
                        "symbol-of-peace"
                ]
        },
        "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces": {
                "place_name": "Yadavindra Gardens Pinjore (17th Century Mughal Terraces)",
                "image_url": "/images/places/chandigarh/pinjore-yadavindra-gardens.webp",
                "visual_description": "A 100-acre 17th-century stepped terraced Mughal garden with central water canals, illuminated fountains, and Sheesh Mahal water pavilions.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "17th-century-mughal-terraces",
                        "pinjore-yadavindra-gardens",
                        "yadavindra-gardens-pinjore",
                        "yadavindra-gardens-pinjore-17th-century-mughal-terraces"
                ]
        },
        "chandigarh:sindhi-sweets-sector-17-chole-bhature-hub": {
                "place_name": "Sindhi Sweets Sector 17 Chole Bhature Hub",
                "image_url": "/images/places/chandigarh/sindhi-sweets-sec17.webp",
                "visual_description": "An iconic Chandigarh culinary institution operating since 1976 famed for puffed bhatures, pindi chole, and fresh rasmalai in rose syrup.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sindhi-sweets-sec17",
                        "sindhi-sweets-sector-17-chole-bhature-hub"
                ]
        },
        "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge": {
                "place_name": "Timber Trail Mountain Cable Car (Shivalik Gorge)",
                "image_url": "/images/places/chandigarh/timber-trail-ropeway-base.webp",
                "visual_description": "A thrilling 1.8 km cable car ropeway soaring 1,500 feet across a dramatic Shivalik mountain canyon connecting two mountain peaks.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shivalik-gorge",
                        "timber-trail-mountain-cable-car",
                        "timber-trail-mountain-cable-car-shivalik-gorge",
                        "timber-trail-ropeway-base"
                ]
        },
        "damdama-sohna:damdama-lake-natural-boating-basin": {
                "place_name": "Damdama Lake Natural Boating Basin",
                "image_url": "/images/places/damdama-sohna/damdama-lake-boating.webp",
                "visual_description": "Haryana's largest natural lake basin nestled in a scenic hollow of the Aravalli hills, offering row boating, kayaking, and migratory birdwatching.",
                "category": "Must Visit",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "damdama-lake-boating",
                        "damdama-lake-natural-boating-basin"
                ]
        },
        "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund": {
                "place_name": "Sohna Sulphur Hot Springs & Ancient Shiva Kund",
                "image_url": "/images/places/damdama-sohna/sohna-hot-springs.webp",
                "visual_description": "Natural geothermal sulphur springs bubbling from the Aravalli rock bed since antiquity, known for therapeutic mineral baths and Shiva temple.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ancient-shiva-kund",
                        "sohna-hot-springs",
                        "sohna-sulphur-hot-springs",
                        "sohna-sulphur-hot-springs-and-ancient-shiva-kund"
                ]
        },
        "damdama-sohna:aravalli-bio-diversity-ridge-nature-trails": {
                "place_name": "Aravalli Bio-Diversity Ridge Nature Trails",
                "image_url": "/images/places/damdama-sohna/aravalli-bio-trails.webp",
                "visual_description": "Indigenous thorny scrub forest trails across rocky Aravalli ridges featuring leopards, nilgai, peacocks, and over 190 bird species.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "aravalli-bio-diversity-ridge-nature-trails",
                        "aravalli-bio-trails"
                ]
        },
        "damdama-sohna:botanix-nature-adventure-park-and-organic-farm": {
                "place_name": "Botanix Nature Adventure Park & Organic Farm",
                "image_url": "/images/places/damdama-sohna/botanix-nature-resort-camp.webp",
                "visual_description": "30-acre botanical garden park at the foothills of the Aravallis featuring obstacle courses, rope climbing, pottery, and organic farm meals.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "botanix-nature-adventure-park",
                        "botanix-nature-adventure-park-and-organic-farm",
                        "botanix-nature-resort-camp",
                        "organic-farm"
                ]
        },
        "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint": {
                "place_name": "Sohna Hilltop Fort Ruins & Viewpoint",
                "image_url": "/images/places/damdama-sohna/sohna-hilltop-fort-ruins.webp",
                "visual_description": "Historic Bharatpur-era fort ruins standing on the crest of the Sohna ridge offering sweeping panoramas of the Gurgaon plains.",
                "category": "Hidden Gems",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sohna-hilltop-fort-ruins",
                        "sohna-hilltop-fort-ruins-and-viewpoint",
                        "viewpoint"
                ]
        },
        "damdama-sohna:shiva-tourist-complex-and-gardens": {
                "place_name": "Shiva Tourist Complex & Gardens",
                "image_url": "/images/places/damdama-sohna/shiva-tourist-complex.webp",
                "visual_description": "Haryana Tourism landscaped gardens perched on a ridge top with stone gazebo viewpoints, children's park, and restaurant.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shiva-tourist-complex",
                        "shiva-tourist-complex-and-gardens"
                ]
        },
        "damdama-sohna:dawat-e-khas-aravalli-highway-dhaba": {
                "place_name": "Dawat-e-Khas Aravalli Highway Dhaba",
                "image_url": "/images/places/damdama-sohna/dawat-aravalli-dhaba.webp",
                "visual_description": "Rustic open-air highway dhaba on the Sohna-Alwar corridor serving traditional Bajra Khichdi, Sarson ka Saag, and Makki ki Roti with white butter.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dawat-aravalli-dhaba",
                        "dawat-e-khas-aravalli-highway-dhaba"
                ]
        },
        "damdama-sohna:saras-tourist-resort-damdama-promenade": {
                "place_name": "Saras Tourist Resort Damdama Promenade",
                "image_url": "/images/places/damdama-sohna/saras-lake-promenade.webp",
                "visual_description": "Lakeside dining terrace offering hot snacks, tea, and outdoor seating with direct unobstructed views over the Damdama water basin.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "saras-lake-promenade",
                        "saras-tourist-resort-damdama-promenade"
                ]
        },
        "damdama-sohna:camp-mustang-aravalli-obstacle-base": {
                "place_name": "Camp Mustang Aravalli Obstacle Base",
                "image_url": "/images/places/damdama-sohna/camp-mustang-adventure.webp",
                "visual_description": "An outdoor adventure enclave set in the Aravalli valleys offering rock climbing, commando nets, obstacle trails, and night star-gazing.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "camp-mustang-adventure",
                        "camp-mustang-aravalli-obstacle-base"
                ]
        },
        "damdama-sohna:badkhal-aravalli-ridge-mountain-drive": {
                "place_name": "Badkhal Aravalli Ridge Mountain Drive",
                "image_url": "/images/places/damdama-sohna/badkhal-ridge-lake-drive.webp",
                "visual_description": "A winding, elevated country drive along the rocky spine of the Aravallis passing rustic stone quarry pools and acacia scrub ridges.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "badkhal-aravalli-ridge-mountain-drive",
                        "badkhal-ridge-lake-drive"
                ]
        },
        "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir": {
                "place_name": "Lost Lake (Hidden Aravalli Water Reservoir)",
                "image_url": "/images/places/damdama-sohna/lost-lake-damdama-trail.webp",
                "visual_description": "A secluded blue-water stone quarry lake tucked behind the ridge, reached via a 3 km scrubland trek popular with adventure hikers.",
                "category": "Adventure & Treks",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hidden-aravalli-water-reservoir",
                        "lost-lake",
                        "lost-lake-damdama-trail",
                        "lost-lake-hidden-aravalli-water-reservoir"
                ]
        },
        "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove": {
                "place_name": "Bhondsi Nature Park & Bhuvneshwari Devi Grove",
                "image_url": "/images/places/damdama-sohna/bhondsi-eco-park.webp",
                "visual_description": "A 450-acre protected ecological park on the Aravalli range featuring herbal trails, bird hides, natural lakes, and serene meditation rocks.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhondsi-eco-park",
                        "bhondsi-nature-park",
                        "bhondsi-nature-park-and-bhuvneshwari-devi-grove",
                        "bhuvneshwari-devi-grove"
                ]
        },
        "damdama-sohna:aravalli-hills-footprint-and-golf-glades": {
                "place_name": "Aravalli Hills Footprint & Golf Glades",
                "image_url": "/images/places/damdama-sohna/aravalli-golf-greens.webp",
                "visual_description": "Expansive undulating green fairways framed by the jagged rocky slopes of the Aravallis, offering morning fresh air walks.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "aravalli-golf-greens",
                        "aravalli-hills-footprint",
                        "aravalli-hills-footprint-and-golf-glades",
                        "golf-glades"
                ]
        },
        "damdama-sohna:historic-sohna-vintage-car-circuit-trail": {
                "place_name": "Historic Sohna Vintage Car Circuit Trail",
                "image_url": "/images/places/damdama-sohna/sohna-car-rally-trail.webp",
                "visual_description": "The legendary trail of the annual Vintage Car Rally that has traversed these hill roads since 1964, terminating at the hot springs plateau.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "historic-sohna-vintage-car-circuit-trail",
                        "sohna-car-rally-trail"
                ]
        },
        "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor": {
                "place_name": "Mangar Bani Sacred Forest & Wildlife Corridor",
                "image_url": "/images/places/damdama-sohna/leopold-aravalli-sanctuary.webp",
                "visual_description": "A virgin sacred grove protected for centuries by local Gujjar clans, representing the last surviving patch of original primary Aravalli forest.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "leopold-aravalli-sanctuary",
                        "mangar-bani-sacred-forest",
                        "mangar-bani-sacred-forest-and-wildlife-corridor",
                        "wildlife-corridor"
                ]
        },
        "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden": {
                "place_name": "Tau Devi Lal Botanical Park & Butterfly Garden",
                "image_url": "/images/places/damdama-sohna/tau-devi-lal-bio-park.webp",
                "visual_description": "A 22-acre botanical sanctuary featuring blooming medicinal herb collections, jogging tracks, and specialized butterfly habitats.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "butterfly-garden",
                        "tau-devi-lal-bio-park",
                        "tau-devi-lal-botanical-park",
                        "tau-devi-lal-botanical-park-and-butterfly-garden"
                ]
        },
        "dehradun:robbers-cave-guchhupani-limestone-gorge": {
                "place_name": "Robber's Cave (Guchhupani Limestone Gorge)",
                "image_url": "/images/places/dehradun/robbers-cave.webp",
                "visual_description": "A natural 600m limestone cave formation where knee-deep subterranean icy cold water flows through narrow rock canyon walls.",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "guchhupani-limestone-gorge",
                        "robbers-cave",
                        "robbers-cave-guchhupani-limestone-gorge"
                ]
        },
        "dehradun:forest-research-institute-colonial-colonnades": {
                "place_name": "Forest Research Institute (Colonial Colonnades)",
                "image_url": "/images/places/dehradun/forest-research-institute.webp",
                "visual_description": "A magnificent 450-hectare Greco-Roman colonial brick heritage complex founded in 1906, housing six specialized forestry museums and botanical gardens.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "colonial-colonnades",
                        "forest-research-institute",
                        "forest-research-institute-colonial-colonnades"
                ]
        },
        "dehradun:mindrolling-monastery-and-great-stupa": {
                "place_name": "Mindrolling Monastery & Great Stupa",
                "image_url": "/images/places/dehradun/mindrolling-monastery.webp",
                "visual_description": "One of the largest Tibetan Buddhist centers in India, featuring a 60m Great Stupa, gilded Buddha statues, and serene Japanese gardens.",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "great-stupa",
                        "mindrolling-monastery",
                        "mindrolling-monastery-and-great-stupa"
                ]
        },
        "dehradun:sahastradhara-thousandfold-sulphur-springs": {
                "place_name": "Sahastradhara Thousandfold Sulphur Springs",
                "image_url": "/images/places/dehradun/sahastradhara-springs.webp",
                "visual_description": "Natural sulphur water spring and stepped travertine limestone cascades along the Baddi river known for medicinal mineral properties.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sahastradhara-springs",
                        "sahastradhara-thousandfold-sulphur-springs"
                ]
        },
        "dehradun:tapkeshwar-mahadev-cave-temple": {
                "place_name": "Tapkeshwar Mahadev Cave Temple",
                "image_url": "/images/places/dehradun/tapkeshwar-temple.webp",
                "visual_description": "Ancient Shiva shrine situated inside a natural river cave where water droplets continuously drip from the ceiling onto the Shivalinga.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tapkeshwar-mahadev-cave-temple",
                        "tapkeshwar-temple"
                ]
        },
        "dehradun:rajpur-road-artisan-bakeries-and-cafes": {
                "place_name": "Rajpur Road Artisan Bakeries & Caf\u00e9s",
                "image_url": "/images/places/dehradun/rajpur-road-cafes.webp",
                "visual_description": "The heritage colonial stretch leading to Old Rajpur lined with independent bakeries, artisanal espresso bars, and shaded outdoor patios.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "rajpur-road-artisan-bakeries",
                        "rajpur-road-artisan-bakeries-and-cafes",
                        "rajpur-road-cafes"
                ]
        },
        "dehradun:elloras-melting-moments-since-1953": {
                "place_name": "Ellora's Melting Moments (Since 1953)",
                "image_url": "/images/places/dehradun/elloras-bakery.webp",
                "visual_description": "Dehradun's legendary bakery on Rajpur Road renowned for stick jaws toffees, butter rusks, plum cakes, and signature pistachio cookies.",
                "category": "Local Food",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "elloras-bakery",
                        "elloras-melting-moments",
                        "elloras-melting-moments-since-1953",
                        "since-1953"
                ]
        },
        "dehradun:malsi-deer-park-dehradun-zoo": {
                "place_name": "Malsi Deer Park (Dehradun Zoo)",
                "image_url": "/images/places/dehradun/malsi-deer-park.webp",
                "visual_description": "A tranquil zoological woodland park in the Shivalik foothills featuring spotted deer herds, peacocks, native birds, and walking trails.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dehradun-zoo",
                        "malsi-deer-park",
                        "malsi-deer-park-dehradun-zoo"
                ]
        },
        "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower": {
                "place_name": "Paltan Bazaar & 1953 Ghanta Ghar Clock Tower",
                "image_url": "/images/places/dehradun/hero.webp",
                "visual_description": "The historic hex-faced stone clock tower and pedestrian bazaar famous for Basmati rice stalls, pahadi spices, woolen shawls, and street food.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1953-ghanta-ghar-clock-tower",
                        "paltan-bazaar",
                        "paltan-bazaar-and-1953-ghanta-ghar-clock-tower"
                ]
        },
        "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery": {
                "place_name": "Khalanga War Memorial (British Tribute to Gurkha Bravery)",
                "image_url": "/images/places/dehradun/khalanga-war-memorial.webp",
                "visual_description": "The unique 1814 war memorial erected by the British East India Company to honour their enemy Balbhadra Thapa and his brave Gurkha defenders.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "british-tribute-to-gurkha-bravery",
                        "khalanga-war-memorial",
                        "khalanga-war-memorial-british-tribute-to-gurkha-bravery"
                ]
        },
        "dehradun:shikhar-fall-woodland-cascade-and-stream": {
                "place_name": "Shikhar Fall Woodland Cascade & Stream",
                "image_url": "/images/places/dehradun/shikhar-fall-trail.webp",
                "visual_description": "A secluded natural waterfall hidden in the hills near Kairwaan village reached by a rocky stream bed walk through dense oak and ferns.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shikhar-fall-trail",
                        "shikhar-fall-woodland-cascade",
                        "shikhar-fall-woodland-cascade-and-stream",
                        "stream"
                ]
        },
        "dehradun:lachhiwala-nature-park-and-stream-pools": {
                "place_name": "Lachhiwala Nature Park & Stream Pools",
                "image_url": "/images/places/dehradun/lachhiwala-nature-park.webp",
                "visual_description": "A forest reserve on the banks of the Song River featuring natural stream-fed swimming pools shaded by magnificent virgin sal tree forests.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "lachhiwala-nature-park",
                        "lachhiwala-nature-park-and-stream-pools",
                        "stream-pools"
                ]
        },
        "dehradun:maldevta-pebble-riverbed-and-camping-meadows": {
                "place_name": "Maldevta Pebble Riverbed & Camping Meadows",
                "image_url": "/images/places/dehradun/maldevta-riverside-meadows.webp",
                "visual_description": "A picturesque mountain river valley flanked by limestone cliffs and rolling fields, ideal for river wading, birding, and paragliding flights.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "camping-meadows",
                        "maldevta-pebble-riverbed",
                        "maldevta-pebble-riverbed-and-camping-meadows",
                        "maldevta-riverside-meadows"
                ]
        },
        "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai": {
                "place_name": "Kumar Sweets & Confectioners (Kumaoni Bal Mithai)",
                "image_url": "/images/places/dehradun/kumar-sweets-legend.webp",
                "visual_description": "Dehradun\u2019s celebrated heritage sweet maker since 1950 famous for brown roasted mawa bal mithai coated with sugar balls, singori, and rasgullas.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "confectioners",
                        "kumaoni-bal-mithai",
                        "kumar-sweets",
                        "kumar-sweets-and-confectioners-kumaoni-bal-mithai",
                        "kumar-sweets-legend"
                ]
        },
        "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce": {
                "place_name": "Kalsi Ashokan Rock Edict (3rd Century BCE)",
                "image_url": "/images/places/dehradun/kalsi-ashoka-rock-edict.webp",
                "visual_description": "A monumental quartz rock inscribed in Brahmi script in Prakrit by Emperor Ashoka in 250 BCE outlining his edicts of non-violence and ethical conduct.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "3rd-century-bce",
                        "kalsi-ashoka-rock-edict",
                        "kalsi-ashokan-rock-edict",
                        "kalsi-ashokan-rock-edict-3rd-century-bce"
                ]
        },
        "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve": {
                "place_name": "Asan Barrage Bird Sanctuary & Wetland Reserve",
                "image_url": "/images/places/dehradun/asani-barrage-wetland.webp",
                "visual_description": "A scenic reservoir at the confluence of the Asan and Yamuna rivers, hosting over 53 species of migratory waterfowl including Brahminy ducks and poc...",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "asan-barrage-bird-sanctuary",
                        "asan-barrage-bird-sanctuary-and-wetland-reserve",
                        "asani-barrage-wetland",
                        "wetland-reserve"
                ]
        },
        "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple": {
                "place_name": "Tsuglagkhang Complex & Dalai Lama Temple",
                "image_url": "/images/places/dharamshala/tsuglagkhang-temple.webp",
                "visual_description": "The spiritual center of Tibetan Buddhism in exile, housing the main temple, Namgyal Monastery, Tibet Museum, and giant gilded statues.",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dalai-lama-temple",
                        "tsuglagkhang-complex",
                        "tsuglagkhang-complex-and-dalai-lama-temple",
                        "tsuglagkhang-temple"
                ]
        },
        "dharamshala:bhagsu-waterfall-and-shiva-cafe": {
                "place_name": "Bhagsu Waterfall & Shiva Caf\u00e9",
                "image_url": "/images/places/dharamshala/bhagsu-waterfall-shiva-cafe.webp",
                "visual_description": "A 20m mountain cascade above Bhagsu village leading up a stone-stepped mountain trail to the famous bohemian cliffside Shiva Caf\u00e9.",
                "category": "Nature & Trails",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhagsu-waterfall",
                        "bhagsu-waterfall-and-shiva-cafe",
                        "bhagsu-waterfall-shiva-cafe",
                        "shiva-cafe"
                ]
        },
        "dharamshala:triund-ridge-alpine-trek-trail": {
                "place_name": "Triund Ridge Alpine Trek Trail",
                "image_url": "/images/places/dharamshala/triund-trek-base.webp",
                "visual_description": "The crown jewel trek of Kangra Valley, climbing through mixed oak and rhododendron forests to a 2,828m ridge under the Dhauladhars.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "triund-ridge-alpine-trek-trail",
                        "triund-trek-base"
                ]
        },
        "dharamshala:illiterati-books-and-coffee": {
                "place_name": "Illiterati Books & Coffee",
                "image_url": "/images/places/dharamshala/illiterati-cafe.webp",
                "visual_description": "Renowned wooden library caf\u00e9 with floor-to-ceiling bookshelves, vintage pianos, and open balcony views of the Kangra Valley.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "coffee",
                        "illiterati-books",
                        "illiterati-books-and-coffee",
                        "illiterati-cafe"
                ]
        },
        "dharamshala:st-john-in-the-wilderness-church-1852": {
                "place_name": "St. John in the Wilderness Church (1852)",
                "image_url": "/images/places/dharamshala/st-john-wilderness.webp",
                "visual_description": "Neo-Gothic 1852 stone Anglican church set amidst towering deodar forests, featuring Belgian stained-glass windows and Lord Elgin's memorial.",
                "category": "Culture & Heritage",
                "semantic_theme": "church",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1852",
                        "st-john-in-the-wilderness-church",
                        "st-john-in-the-wilderness-church-1852",
                        "st-john-wilderness"
                ]
        },
        "dharamshala:tibet-kitchen-traditional-momos-and-thukpa": {
                "place_name": "Tibet Kitchen (Traditional Momos & Thukpa)",
                "image_url": "/images/places/dharamshala/tibet-kitchen.webp",
                "visual_description": "Popular multi-story dining institution in the central square serving authentic Tibetan Tingmo, steaming Thukpa, Shaphaley, and Butter Tea.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "thukpa",
                        "tibet-kitchen",
                        "tibet-kitchen-traditional-momos-and-thukpa",
                        "traditional-momos"
                ]
        },
        "dharamshala:dharamkot-yoga-and-meditation-village": {
                "place_name": "Dharamkot Yoga & Meditation Village",
                "image_url": "/images/places/dharamshala/dharamkot-village.webp",
                "visual_description": "Quiet hilltop hamlet above McLeod Ganj known as the yoga haven of Himachal, featuring silent meditation centers and organic vegan caf\u00e9s.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dharamkot-village",
                        "dharamkot-yoga",
                        "dharamkot-yoga-and-meditation-village",
                        "meditation-village"
                ]
        },
        "dharamshala:kangra-fort-ancient-4th-century-bce-citadel": {
                "place_name": "Kangra Fort (Ancient 4th Century BCE Citadel)",
                "image_url": "/images/places/dharamshala/kangra-fort.webp",
                "visual_description": "The oldest surviving fort in the Himalayas built by the Katoch dynasty, featuring massive multi-tiered stone gateways, Jain shrines, and river gorg...",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ancient-4th-century-bce-citadel",
                        "kangra-fort",
                        "kangra-fort-ancient-4th-century-bce-citadel"
                ]
        },
        "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat": {
                "place_name": "Gyuto Monastery (Tantric Chanting & Karmapa Seat)",
                "image_url": "/images/places/dharamshala/gyuto-monastery.webp",
                "visual_description": "A renowned Tibetan monastery specializing in Tantric Buddhist meditation and deep throat-singing choral chanting, backed by the snowy Dhauladhar cr...",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "gyuto-monastery",
                        "gyuto-monastery-tantric-chanting-and-karmapa-seat",
                        "karmapa-seat",
                        "tantric-chanting"
                ]
        },
        "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves": {
                "place_name": "Dal Lake Dharamshala & Sacred Deodar Groves",
                "image_url": "/images/places/dharamshala/dal-lake-dharamshala.webp",
                "visual_description": "A sacred small high-altitude lake ringed by ancient Himalayan deodar trees, revered for an annual September fair dedicated to Lord Shiva.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dal-lake",
                        "dal-lake-dharamshala",
                        "dal-lake-dharamshala-and-sacred-deodar-groves",
                        "sacred-deodar-groves"
                ]
        },
        "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane": {
                "place_name": "Tibetan Butter Tea & Tingmo Bakery Lane",
                "image_url": "/images/places/dharamshala/tibetan-butter-tea.webp",
                "visual_description": "A charming row of traditional morning Tibetan kitchens near the monastery preparing warm salted po cha (yak butter tea), steamed tingmo bread, and ...",
                "category": "Local Food & Street Eats",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tibetan-butter-tea",
                        "tibetan-butter-tea-and-tingmo-bakery-lane",
                        "tingmo-bakery-lane"
                ]
        },
        "dharamshala:masroor-monolithic-rock-cut-temples-8th-century": {
                "place_name": "Masroor Monolithic Rock-Cut Temples (8th Century)",
                "image_url": "/images/places/dharamshala/masroor-rock-temples.webp",
                "visual_description": "The Himalayan Ellora: a complex of 15 monolithic rock-hewn temples carved out of a single sandstone outcrop with reflecting water pools.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "8th-century",
                        "masroor-monolithic-rock-cut-temples",
                        "masroor-monolithic-rock-cut-temples-8th-century",
                        "masroor-rock-temples"
                ]
        },
        "dharamshala:tashi-jong-buddhist-craft-community-and-stupas": {
                "place_name": "Tashi Jong Buddhist Craft Community & Stupas",
                "image_url": "/images/places/dharamshala/tashi-jong-monastery.webp",
                "visual_description": "A peaceful Tibetan refugee settlement and Drukpa Kagyu monastery renowned for intricate carpet weaving, woodblock printing, and sacred cham dances.",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "stupas",
                        "tashi-jong-buddhist-craft-community",
                        "tashi-jong-buddhist-craft-community-and-stupas",
                        "tashi-jong-monastery"
                ]
        },
        "goa:chapora-fort-hilltop-viewpoint": {
                "place_name": "Chapora Fort Hilltop Viewpoint",
                "image_url": "/images/places/goa/chapora-fort.webp",
                "visual_description": "Historic red laterite fort overlooking the dramatic confluence of Chapora River and the Arabian Sea with vast ocean vistas.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chapora-fort",
                        "chapora-fort-hilltop-viewpoint"
                ]
        },
        "goa:fontainhas-heritage-latin-quarter": {
                "place_name": "Fontainhas Heritage Latin Quarter",
                "image_url": "/images/places/goa/fontainhas-latin-quarter.webp",
                "visual_description": "Asia's only preserved Portuguese Latin Quarter featuring pastel-painted heritage villas, azulejo tile work, and quiet bakeries.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "fontainhas-heritage-latin-quarter",
                        "fontainhas-latin-quarter"
                ]
        },
        "goa:divar-island-village-ferry-and-backwaters": {
                "place_name": "Divar Island Village Ferry & Backwaters",
                "image_url": "/images/places/goa/divar-island.webp",
                "visual_description": "A tranquil river island reached via a traditional wooden ferry, famous for emerald paddy fields, ancient churches, and serene cycling routes.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "backwaters",
                        "divar-island",
                        "divar-island-village-ferry",
                        "divar-island-village-ferry-and-backwaters"
                ]
        },
        "goa:ashwem-beach-casuarina-pines": {
                "place_name": "Ashwem Beach Casuarina Pines",
                "image_url": "/images/places/goa/ashwem-beach.webp",
                "visual_description": "Wide, white sandy beach lined with casuarina groves and calm shallow waters, ideal for quiet swims and tranquil seaside reading.",
                "category": "Nature & Trails",
                "semantic_theme": "beach",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ashwem-beach",
                        "ashwem-beach-casuarina-pines"
                ]
        },
        "goa:anjuna-flea-and-night-art-market": {
                "place_name": "Anjuna Flea & Night Art Market",
                "image_url": "/images/places/goa/anjuna-flea-market.webp",
                "visual_description": "Bohemian open-air bazaar beneath the palm trees featuring handcrafted silver jewelry, spice sacks, indie artwork, and live musicians.",
                "category": "Markets & Craft",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "anjuna-flea",
                        "anjuna-flea-and-night-art-market",
                        "anjuna-flea-market",
                        "night-art-market"
                ]
        },
        "goa:dudhsagar-waterfall-jungle-trek": {
                "place_name": "Dudhsagar Waterfall Jungle Trek",
                "image_url": "/images/places/goa/dudhsagar-falls.webp",
                "visual_description": "A magnificent four-tiered 310m milky white waterfall inside Bhagwan Mahavir Wildlife Sanctuary with scenic rail bridge views.",
                "category": "Adventure & Treks",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dudhsagar-falls",
                        "dudhsagar-waterfall-jungle-trek"
                ]
        },
        "goa:artjuna-lifestyle-garden-cafe": {
                "place_name": "Artjuna Lifestyle Garden Caf\u00e9",
                "image_url": "/images/places/goa/artjuna-cafe.webp",
                "visual_description": "Open-air garden sanctuary set under mango trees, serving artisanal cold brews, tahini salads, fresh sourdough, and house smoothies.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "artjuna-cafe",
                        "artjuna-lifestyle-garden-cafe"
                ]
        },
        "goa:vinayak-family-restaurant-authentic-goan-fish-thali": {
                "place_name": "Vinayak Family Restaurant (Authentic Goan Fish Thali)",
                "image_url": "/images/places/goa/vinayak-family-restaurant.webp",
                "visual_description": "Legendary village restaurant overlooking emerald fields, serving authentic freshly caught kingfish thalis, prawn curry, and sol kadi.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "authentic-goan-fish-thali",
                        "vinayak-family-restaurant",
                        "vinayak-family-restaurant-authentic-goan-fish-thali"
                ]
        },
        "goa:basilica-of-bom-jesus-unesco-world-heritage": {
                "place_name": "Basilica of Bom Jesus (UNESCO World Heritage)",
                "image_url": "/images/places/goa/basilica-bom-jesus.webp",
                "visual_description": "Consecrated in 1605, this masterpiece of Baroque architecture holds the mortal remains of St. Francis Xavier inside a silver casket atop an ornate ...",
                "category": "Culture & Heritage",
                "semantic_theme": "church",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "basilica-bom-jesus",
                        "basilica-of-bom-jesus",
                        "basilica-of-bom-jesus-unesco-world-heritage",
                        "unesco-world-heritage"
                ]
        },
        "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail": {
                "place_name": "Arambol Sweet Water Lagoon & Banyan Tree Trail",
                "image_url": "/images/places/goa/arambol-sweet-lake.webp",
                "visual_description": "A fresh spring-water lagoon tucked just meters from the crashing waves of Kalacha Beach, fed by natural mountain streams with gentle jungle walking...",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "arambol-sweet-lake",
                        "arambol-sweet-water-lagoon",
                        "arambol-sweet-water-lagoon-and-banyan-tree-trail",
                        "banyan-tree-trail"
                ]
        },
        "goa:reis-magos-fort-and-mandovi-estuary": {
                "place_name": "Reis Magos Fort & Mandovi Estuary",
                "image_url": "/images/places/goa/reis-magos-fort.webp",
                "visual_description": "Restored 1551 CE Portuguese bastion perched atop the Mandovi river mouth offering panoramic views of Panaji and the Arabian Sea.preserved from mode...",
                "category": "Hidden Gems",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mandovi-estuary",
                        "reis-magos-fort",
                        "reis-magos-fort-and-mandovi-estuary"
                ]
        },
        "goa:palolem-crescent-beach-and-butterfly-island": {
                "place_name": "Palolem Crescent Beach & Butterfly Island",
                "image_url": "/images/places/goa/palolem-beach.webp",
                "visual_description": "A tranquil 1.6 km semi-circular crescent bay lined with coconut palms and gentle shallow waters, with wooden boats taking travelers to secluded But...",
                "category": "Must Visit",
                "semantic_theme": "beach",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "butterfly-island",
                        "palolem-beach",
                        "palolem-crescent-beach",
                        "palolem-crescent-beach-and-butterfly-island"
                ]
        },
        "goa:baba-au-rhum-french-bamboo-garden": {
                "place_name": "Baba Au Rhum French Bamboo Garden",
                "image_url": "/images/places/goa/baba-au-rhum-cafe.webp",
                "visual_description": "Open-air bamboo dining terrace nestled in Anjuna paddies, celebrated for wood-fired artisan sourdough pizzas and espresso.serves Mediterranean tahi...",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "baba-au-rhum-cafe",
                        "baba-au-rhum-french-bamboo-garden"
                ]
        },
        "goa:gunpowder-assagao-heritage-peninsular-dining": {
                "place_name": "Gunpowder Assagao Heritage Peninsular Dining",
                "image_url": "/images/places/goa/gunpowder-assagao.webp",
                "visual_description": "Restored Portuguese heritage courtyard in Assagao serving authentic peninsular and coastal specialties.among locals for authentic Goan fish thalis,...",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "gunpowder-assagao",
                        "gunpowder-assagao-heritage-peninsular-dining"
                ]
        },
        "goa:fort-aguada-and-1864-portuguese-lighthouse": {
                "place_name": "Fort Aguada & 1864 Portuguese Lighthouse",
                "image_url": "/images/places/goa/aguada-fort.webp",
                "visual_description": "A 17th-century Portuguese fortress commanding the mouth of the Mandovi River, housing a 4-tiered freshwater cistern and ancient oil lighthouse.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1864-portuguese-lighthouse",
                        "aguada-fort",
                        "fort-aguada",
                        "fort-aguada-and-1864-portuguese-lighthouse"
                ]
        },
        "goa:anjuna-rocky-beach-cove-and-curlies-point": {
                "place_name": "Anjuna Rocky Beach Cove & Curlies Point",
                "image_url": "/images/places/goa/anjuna-beach-cove.webp",
                "visual_description": "A dramatic red-laterite rocky cove fringed by coconut palms, renowned since the 1960s for bohemian sunset gatherings and psychedelic trance heritage.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "beach",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "anjuna-beach-cove",
                        "anjuna-rocky-beach-cove",
                        "anjuna-rocky-beach-cove-and-curlies-point",
                        "curlies-point"
                ]
        },
        "jaipur:nahargarh-fort-sunset-ridge": {
                "place_name": "Nahargarh Fort Sunset Ridge",
                "image_url": "/images/places/jaipur/nahargarh-fort-sunset.webp",
                "visual_description": "Perched on the edge of the Aravalli hills, offering the most dramatic panoramic sunset viewpoint overlooking the entire Pink City.",
                "category": "Nature & Trails",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "nahargarh-fort-sunset",
                        "nahargarh-fort-sunset-ridge"
                ]
        },
        "jaipur:panna-meena-ka-kund-stepwell": {
                "place_name": "Panna Meena Ka Kund Stepwell",
                "image_url": "/images/places/jaipur/panna-meena-kund.webp",
                "visual_description": "An exquisite 16th-century geometric stepwell with interlocking symmetrical staircases and octagonal gazebos near Amer.",
                "category": "Hidden Gems",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "panna-meena-ka-kund-stepwell",
                        "panna-meena-kund"
                ]
        },
        "jaipur:jaipur-city-palace-and-chandra-mahal": {
                "place_name": "Jaipur City Palace & Chandra Mahal",
                "image_url": "/images/places/jaipur/city-palace-jaipur.webp",
                "visual_description": "The regal heart of Jaipur featuring courtyards, Peacock Gate mosaics, royal textile museums, and royal Rajput heritage.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chandra-mahal",
                        "city-palace",
                        "city-palace-jaipur",
                        "city-palace-of-jaipur",
                        "jaipur-city-palace",
                        "jaipur-city-palace-and-chandra-mahal"
                ]
        },
        "jaipur:laxmi-misthan-bhandar-lmb-1727": {
                "place_name": "Laxmi Misthan Bhandar (LMB 1727)",
                "image_url": "/images/places/jaipur/lmb-sweets.webp",
                "visual_description": "Historic Johari Bazaar institution famous for crisp Pyaz Kachoris, Paneer Ghewar, Royal Rajasthani Thalis, and Mawa Kachori.",
                "category": "Local Food",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "laxmi-misthan-bhandar",
                        "laxmi-misthan-bhandar-lmb-1727",
                        "lmb-1727",
                        "lmb-sweets"
                ]
        },
        "jaipur:anokhi-museum-of-hand-printing": {
                "place_name": "Anokhi Museum of Hand Printing",
                "image_url": "/images/places/jaipur/anokhi-museum.webp",
                "visual_description": "Restored 16th-century stone haveli dedicated to the traditional art of Rajasthani woodblock hand printing with live artisan demos.",
                "category": "Markets & Craft",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "anokhi-museum",
                        "anokhi-museum-of-hand-printing"
                ]
        },
        "jaipur:tapri-central-rooftop-tea-lounge": {
                "place_name": "Tapri Central Rooftop Tea Lounge",
                "image_url": "/images/places/jaipur/tapri-central.webp",
                "visual_description": "Beloved rooftop tea salon overlooking Central Park, serving artisanal Masala Chai in clay kulhads, Bun Maska, and hand-rolled snacks.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tapri-central",
                        "tapri-central-rooftop-tea-lounge"
                ]
        },
        "jaipur:jantar-mantar-unesco-astronomical-observatory": {
                "place_name": "Jantar Mantar UNESCO Astronomical Observatory",
                "image_url": "/images/places/jaipur/jantar-mantar.webp",
                "visual_description": "Completed in 1734 by Maharaja Sawai Jai Singh II, this UNESCO World Heritage site features nineteen architectural astronomical instruments, includi...",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jantar-mantar",
                        "jantar-mantar-unesco-astronomical-observatory"
                ]
        },
        "jaipur:jaigarh-fort-and-jaivana-royal-cannon": {
                "place_name": "Jaigarh Fort & Jaivana Royal Cannon",
                "image_url": "/images/places/jaipur/jaigarh-fort.webp",
                "visual_description": "Built in 1726 by Jai Singh II to protect the Amber Fort complex, this rugged military fortress houses 'Jaivana', once the world's largest cannon on...",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jaigarh-fort",
                        "jaigarh-fort-and-jaivana-royal-cannon",
                        "jaivana-royal-cannon"
                ]
        },
        "jaipur:jal-mahal-the-floating-water-palace": {
                "place_name": "Jal Mahal (The Floating Water Palace)",
                "image_url": "/images/places/jaipur/jal-mahal.webp",
                "visual_description": "A stunning 18th-century Rajput-style palace made of red sandstone, floating in the center of Man Sagar Lake with four submerged lower levels and a ...",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jal-mahal",
                        "jal-mahal-the-floating-water-palace",
                        "the-floating-water-palace"
                ]
        },
        "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds": {
                "place_name": "Galta Ji (The Sacred Monkey Temple & Kunds)",
                "image_url": "/images/places/jaipur/galta-ji-temple.webp",
                "visual_description": "An ancient prehistoric Hindu pilgrimage complex tucked inside a narrow mountain gorge, featuring natural freshwater springs feeding seven sacred st...",
                "category": "Hidden Gems",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "galta-ji",
                        "galta-ji-temple",
                        "galta-ji-the-sacred-monkey-temple-and-kunds",
                        "kunds",
                        "the-sacred-monkey-temple"
                ]
        },
        "jaipur:albert-hall-state-museum-indo-saracenic": {
                "place_name": "Albert Hall State Museum (Indo-Saracenic)",
                "image_url": "/images/places/jaipur/albert-hall-museum.webp",
                "visual_description": "The oldest museum in Rajasthan, housed in a breathtaking Indo-Saracenic building designed by Sir Samuel Swinton Jacob, exhibiting rare miniature pa...",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "albert-hall-museum",
                        "albert-hall-state-museum",
                        "albert-hall-state-museum-indo-saracenic",
                        "indo-saracenic"
                ]
        },
        "jaipur:patrika-gate-and-jawahar-circle-garden": {
                "place_name": "Patrika Gate & Jawahar Circle Garden",
                "image_url": "/images/places/jaipur/patrika-gate.webp",
                "visual_description": "A magnificent hand-painted monumental gateway celebrating the art, architectural history, and culture of every region of Rajasthan through vibrant ...",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jawahar-circle-garden",
                        "patrika-gate",
                        "patrika-gate-and-jawahar-circle-garden"
                ]
        },
        "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori": {
                "place_name": "Rawat Mishthan Bhandar (Original Pyaaz Kachori)",
                "image_url": "/images/places/jaipur/rawat-mishthan-bhandar.webp",
                "visual_description": "The undisputed home of Rajasthan's most famous Pyaaz Kachori (spiced onion pastry), fried crisp and served with sweet tamarind and spicy mint chutn...",
                "category": "Local Food",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "original-pyaaz-kachori",
                        "rawat-mishthan-bhandar",
                        "rawat-mishthan-bhandar-original-pyaaz-kachori"
                ]
        },
        "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace": {
                "place_name": "Wind View Cafe (Hawa Mahal Eye-Level Terrace)",
                "image_url": "/images/places/jaipur/wind-view-cafe.webp",
                "visual_description": "A rooftop terrace cafe directly facing the intricate pink sandstone facade of Hawa Mahal, offering eye-level views of the 953 jharokha honeycomb wi...",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hawa-mahal-eye-level-terrace",
                        "wind-view-cafe",
                        "wind-view-cafe-hawa-mahal-eye-level-terrace"
                ]
        },
        "jaisalmer:jaisalmer-golden-living-fort-sonar-qila": {
                "place_name": "Jaisalmer Golden Living Fort (Sonar Qila)",
                "image_url": "/images/places/jaisalmer/jaisalmer-fort.webp",
                "visual_description": "One of the world's few living forts, housing over 4,000 residents inside its 12th-century yellow sandstone ramparts, palaces, and Jain temples.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jaisalmer-fort",
                        "jaisalmer-golden-living-fort",
                        "jaisalmer-golden-living-fort-sonar-qila",
                        "sonar-qila"
                ]
        },
        "jaisalmer:patwon-ki-haveli-filigree-architecture": {
                "place_name": "Patwon Ki Haveli Filigree Architecture",
                "image_url": "/images/places/jaisalmer/patwon-ki-haveli.webp",
                "visual_description": "A cluster of five palatial 19th-century merchant havelis featuring over 60 exquisitely carved sandstone jharokha balconies.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "patwon-ki-haveli",
                        "patwon-ki-haveli-filigree-architecture"
                ]
        },
        "jaisalmer:sam-sand-dunes-and-thar-desert-safari": {
                "place_name": "Sam Sand Dunes & Thar Desert Safari",
                "image_url": "/images/places/jaisalmer/sam-sand-dunes.webp",
                "visual_description": "Expansive golden sand dunes in the Thar Desert offering camel safaris, 4x4 dune bashing, and authentic Rajasthani folk dance under the stars.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sam-sand-dunes",
                        "sam-sand-dunes-and-thar-desert-safari",
                        "thar-desert-safari"
                ]
        },
        "jaisalmer:gadisar-lake-ghats-and-chattris": {
                "place_name": "Gadisar Lake Ghats & Chattris",
                "image_url": "/images/places/jaisalmer/gadisar-lake.webp",
                "visual_description": "Historic 14th-century rainwater reservoir surrounded by ornate sandstone shrines, ghats, and the graceful Tilon Ki Pol gateway.",
                "category": "Nature & Trails",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chattris",
                        "gadisar-lake",
                        "gadisar-lake-ghats",
                        "gadisar-lake-ghats-and-chattris"
                ]
        },
        "jaisalmer:kuldhara-abandoned-ghost-village": {
                "place_name": "Kuldhara Abandoned Ghost Village",
                "image_url": "/images/places/jaisalmer/kuldhara-abandoned-village.webp",
                "visual_description": "An eerie 13th-century Paliwal Brahmin settlement abandoned overnight in the 1800s, preserved in silent sandstone ruin in the Thar.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kuldhara-abandoned-ghost-village",
                        "kuldhara-abandoned-village"
                ]
        },
        "jaisalmer:jaisalmer-fort-seven-jain-temples": {
                "place_name": "Jaisalmer Fort Seven Jain Temples",
                "image_url": "/images/places/jaisalmer/jain-temples-fort.webp",
                "visual_description": "Interconnected group of 15th-century yellow sandstone Jain shrines renowned for breathtaking marble idols and ornate ceiling carvings.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jain-temples",
                        "jain-temples-fort",
                        "jaisalmer-fort-seven-jain-temples",
                        "seven-jain-temples"
                ]
        },
        "jaisalmer:the-trio-rooftop-authentic-laal-maas": {
                "place_name": "The Trio Rooftop (Authentic Laal Maas)",
                "image_url": "/images/places/jaisalmer/the-trio-restaurant.webp",
                "visual_description": "Celebrated tented rooftop restaurant overlooking Mandi Chowk, famous for authentic slow-cooked Laal Maas, Ker Sangri, and Gatta Curry.",
                "category": "Local Food",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "authentic-laal-maas",
                        "the-trio-restaurant",
                        "the-trio-rooftop",
                        "the-trio-rooftop-authentic-laal-maas"
                ]
        },
        "jaisalmer:salim-singh-ki-haveli-moti-mahal": {
                "place_name": "Salim Singh Ki Haveli (Moti Mahal)",
                "image_url": "/images/places/jaisalmer/salim-singh-ki-haveli.webp",
                "visual_description": "Distinctive 300-year-old mansion with a narrow stone base expanding into a top floor modeled like a dancing peacock with 38 carved balconies.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "moti-mahal",
                        "salim-singh-ki-haveli",
                        "salim-singh-ki-haveli-moti-mahal"
                ]
        },
        "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills": {
                "place_name": "Bada Bagh (Royal Cenotaphs & Desert Windmills)",
                "image_url": "/images/places/jaisalmer/bada-bagh-chhatris.webp",
                "visual_description": "A striking desert ridge populated by carved golden sandstone cenotaphs of the Maharawals of Jaisalmer, framed against modern wind turbines.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bada-bagh",
                        "bada-bagh-chhatris",
                        "bada-bagh-royal-cenotaphs-and-desert-windmills",
                        "desert-windmills",
                        "royal-cenotaphs"
                ]
        },
        "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays": {
                "place_name": "Khuri Village (Quiet Sand Dunes & Mud Homestays)",
                "image_url": "/images/places/jaisalmer/khuri-desert-sand-dunes.webp",
                "visual_description": "A peaceful desert village 45 km south of Jaisalmer with pristine sand dunes untouched by commercial noise, mud huts, and traditional folk campfires.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "khuri-desert-sand-dunes",
                        "khuri-village",
                        "khuri-village-quiet-sand-dunes-and-mud-homestays",
                        "mud-homestays",
                        "quiet-sand-dunes"
                ]
        },
        "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine": {
                "place_name": "Tanot Mata Temple (The Miraculous Indo-Pak Border Shrine)",
                "image_url": "/images/places/jaisalmer/tanot-mata-temple.webp",
                "visual_description": "A sacred desert temple 120 km northwest of Jaisalmer near the Pakistan border, celebrated for surviving hundreds of unexploded enemy bombs in 1965.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tanot-mata-temple",
                        "tanot-mata-temple-the-miraculous-indo-pak-border-shrine",
                        "the-miraculous-indo-pak-border-shrine"
                ]
        },
        "jaisalmer:desert-national-park-great-indian-bustard-safari": {
                "place_name": "Desert National Park (Great Indian Bustard Safari)",
                "image_url": "/images/places/jaisalmer/desert-national-park-safari.webp",
                "visual_description": "A 3,162 sq km fragile desert ecosystem sanctuary conserving the critically endangered Great Indian Bustard, desert foxes, and chinkara gazelles.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "desert-national-park",
                        "desert-national-park-great-indian-bustard-safari",
                        "desert-national-park-safari",
                        "great-indian-bustard-safari"
                ]
        },
        "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree": {
                "place_name": "Lodurva Ancient Capital & Kalpavriksha Wish Tree",
                "image_url": "/images/places/jaisalmer/lodurva-jain-temple.webp",
                "visual_description": "The 10th-century medieval capital of the Bhati Rajputs featuring yellow sandstone temples, ornate Torana arches, and a copper wish-fulfilling tree.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kalpavriksha-wish-tree",
                        "lodurva-ancient-capital",
                        "lodurva-ancient-capital-and-kalpavriksha-wish-tree",
                        "lodurva-jain-temple"
                ]
        },
        "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph": {
                "place_name": "Vyas Chhatri (Sage Vyas Sandstone Cenotaph)",
                "image_url": "/images/places/jaisalmer/vyas-chhatri-sunset-point.webp",
                "visual_description": "A cluster of golden sandstone cenotaphs dedicated to Sage Vyas (author of the Mahabharata) situated atop a hillock catching sunset over the fort.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sage-vyas-sandstone-cenotaph",
                        "vyas-chhatri",
                        "vyas-chhatri-sage-vyas-sandstone-cenotaph",
                        "vyas-chhatri-sunset-point"
                ]
        },
        "jaisalmer:surya-kishore-authentic-dal-baati-churma": {
                "place_name": "Surya Kishore Authentic Dal Baati Churma",
                "image_url": "/images/places/jaisalmer/surya-kishore-rooftop.webp",
                "visual_description": "A family-run heritage rooftop within the fort ramparts serving wood-fired baatis crushed in pure desi ghee, panchkuta, and ker sangri.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "surya-kishore-authentic-dal-baati-churma",
                        "surya-kishore-rooftop"
                ]
        },
        "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum": {
                "place_name": "Desert Cultural Centre & Folk Puppetry Museum",
                "image_url": "/images/places/jaisalmer/desert-cultural-centre-museum.webp",
                "visual_description": "A treasure trove of Thar desert heritage housing ancient textiles, folk musical instruments, coins, and live evening Rajasthani puppet shows.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "desert-cultural-centre",
                        "desert-cultural-centre-and-folk-puppetry-museum",
                        "desert-cultural-centre-museum",
                        "folk-puppetry-museum"
                ]
        },
        "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple": {
                "place_name": "Neem Karoli Baba Sacred Ashram & Temple",
                "image_url": "/images/places/kainchi-dham/neem-karoli-baba-ashram.webp",
                "visual_description": "Spiritual hermitage founded in 1962 by Neem Karoli Baba Maharaj-ji, visited by global seekers for meditation, Hanuman chalisa, and prasad.",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "neem-karoli-baba-ashram",
                        "neem-karoli-baba-sacred-ashram",
                        "neem-karoli-baba-sacred-ashram-and-temple"
                ]
        },
        "kainchi-dham:bhowali-fruit-market-and-tea-terraces": {
                "place_name": "Bhowali Fruit Market & Tea Terraces",
                "image_url": "/images/places/kainchi-dham/bhowali-fruit-orchards.webp",
                "visual_description": "The fruit basket of Kumaon famous for juicy Himalayan apples, apricots, plums, hill strawberries, and Shyamkhet tea gardens.",
                "category": "Nature & Trails",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhowali-fruit-market",
                        "bhowali-fruit-market-and-tea-terraces",
                        "bhowali-fruit-orchards",
                        "tea-terraces"
                ]
        },
        "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells": {
                "place_name": "Golu Devta Temple Ghorakhal (Temple of Bells)",
                "image_url": "/images/places/kainchi-dham/golu-devta-ghorakhal.webp",
                "visual_description": "Historic shrine dedicated to the Kumaoni God of Justice, famous for thousands of brass bells hung by devotees whose prayers were answered.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "golu-devta-ghorakhal",
                        "golu-devta-temple-ghorakhal",
                        "golu-devta-temple-ghorakhal-temple-of-bells",
                        "temple-of-bells"
                ]
        },
        "kainchi-dham:bhimtal-lake-and-central-aquarium-island": {
                "place_name": "Bhimtal Lake & Central Aquarium Island",
                "image_url": "/images/places/kainchi-dham/bhimtal-island-lake.webp",
                "visual_description": "Picturesque C-shaped lake larger than Naini Lake, featuring a central island aquarium accessible via traditional wooden rowing boats.",
                "category": "Nature & Trails",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhimtal-island-lake",
                        "bhimtal-lake",
                        "bhimtal-lake-and-central-aquarium-island",
                        "central-aquarium-island"
                ]
        },
        "kainchi-dham:sattal-seven-interconnected-freshwater-lakes": {
                "place_name": "Sattal Seven Interconnected Freshwater Lakes",
                "image_url": "/images/places/kainchi-dham/sattal-interconnected-lakes.webp",
                "visual_description": "An unspoiled cluster of seven interconnected freshwater lakes nestled in dense oak and pine forests, celebrated for birdwatching and kayaking.",
                "category": "Hidden Gems",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sattal-interconnected-lakes",
                        "sattal-seven-interconnected-freshwater-lakes"
                ]
        },
        "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat": {
                "place_name": "Subhash Dhaba (Traditional Kumaoni Ras-Bhaat)",
                "image_url": "/images/places/kainchi-dham/subhash-dhaba-bhowali.webp",
                "visual_description": "Famed local roadside eatery serving authentic Bhatt ki Churkani (black bean curry), Aloo ke Gutke, Rai ka Raita, and Kumaoni Singori sweets.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "subhash-dhaba",
                        "subhash-dhaba-bhowali",
                        "subhash-dhaba-traditional-kumaoni-ras-bhaat",
                        "traditional-kumaoni-ras-bhaat"
                ]
        },
        "kainchi-dham:naukuchiatal-nine-cornered-lake": {
                "place_name": "Naukuchiatal (Nine-Cornered Lake)",
                "image_url": "/images/places/kainchi-dham/naukuchiatal-lake.webp",
                "visual_description": "Deep nine-cornered mountain lake famous for paragliding over pine ridges, quiet pedal boating, and tranquil lotus ponds.",
                "category": "Adventure & Treks",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "naukuchiatal",
                        "naukuchiatal-lake",
                        "naukuchiatal-nine-cornered-lake",
                        "nine-cornered-lake"
                ]
        },
        "kainchi-dham:shyamkhet-organic-tea-garden-walk": {
                "place_name": "Shyamkhet Organic Tea Garden Walk",
                "image_url": "/images/places/kainchi-dham/shyamkhet-tea-estate.webp",
                "visual_description": "Boutique tea plantation producing organic Himalayan orthodox green and black teas, with an open tea tasting lounge overlooking the slopes.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shyamkhet-organic-tea-garden-walk",
                        "shyamkhet-tea-estate"
                ]
        },
        "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary": {
                "place_name": "Pangot Oak Forest & Himalayan Birding Sanctuary",
                "image_url": "/images/places/kainchi-dham/pangot-birding-sanctuary.webp",
                "visual_description": "A tranquil mountain village enveloped by dense ban-oak and rhododendron forests, globally renowned for sightings of cheer pheasants and minivets.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "himalayan-birding-sanctuary",
                        "pangot-birding-sanctuary",
                        "pangot-oak-forest",
                        "pangot-oak-forest-and-himalayan-birding-sanctuary"
                ]
        },
        "kainchi-dham:mukteshwar-dham-350-year-hilltop-shiva-temple": {
                "place_name": "Mukteshwar Dham 350-Year Hilltop Shiva Temple",
                "image_url": "/images/places/kainchi-dham/mukteshwar-dham-shiva-temple.webp",
                "visual_description": "A 350-year-old stone temple perched at 2,286m on the highest ridge in Kumaon, offering a sweeping 180-degree view of Trishul and Nanda Devi.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mukteshwar-dham-350-year-hilltop-shiva-temple",
                        "mukteshwar-dham-shiva-temple"
                ]
        },
        "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag": {
                "place_name": "Chauli Ki Jali (Vertical Mountain Ridge & Sunset Crag)",
                "image_url": "/images/places/kainchi-dham/chauli-ki-jali-cliffs.webp",
                "visual_description": "A dramatic vertical rocky cliff behind Mukteshwar temple overlooking the valleys of Kumaon, renowned for rock climbing, zipline, and sunsets.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chauli-ki-jali",
                        "chauli-ki-jali-cliffs",
                        "chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
                        "sunset-crag",
                        "vertical-mountain-ridge"
                ]
        },
        "kainchi-dham:hidimba-parvat-pine-forest-trail": {
                "place_name": "Hidimba Parvat Pine Forest Trail",
                "image_url": "/images/places/kainchi-dham/hidimba-parvat-trek.webp",
                "visual_description": "A gentle forested hike leading up to a serene monk hermitage through fragrant Himalayan pine woods, offering aerial views of Sattal lakes.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hidimba-parvat-pine-forest-trail",
                        "hidimba-parvat-trek"
                ]
        },
        "kainchi-dham:chaubatia-apple-and-apricot-research-orchards": {
                "place_name": "Chaubatia Apple & Apricot Research Orchards",
                "image_url": "/images/places/kainchi-dham/ranikhet-chaubatia-orchards.webp",
                "visual_description": "A 265-acre sprawling government horticultural research garden cultivating over 30 varieties of apples, plums, and walnuts with views of Nanda Devi.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "apricot-research-orchards",
                        "chaubatia-apple",
                        "chaubatia-apple-and-apricot-research-orchards",
                        "ranikhet-chaubatia-orchards"
                ]
        },
        "kainchi-dham:karkotak-nag-mandir-hilltop-crest": {
                "place_name": "Karkotak Nag Mandir Hilltop Crest",
                "image_url": "/images/places/kainchi-dham/karkotak-nag-mandir.webp",
                "visual_description": "An ancient snake deity shrine situated atop Karkotak hill, offering an aerial 360-degree bird\u2019s-eye perspective over Bhimtal lake and surrounding r...",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "karkotak-nag-mandir",
                        "karkotak-nag-mandir-hilltop-crest"
                ]
        },
        "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal": {
                "place_name": "Kamal Tal (The Secluded Lotus Lake of Naukuchiatal)",
                "image_url": "/images/places/kainchi-dham/kamal-tal-lotus-lake.webp",
                "visual_description": "A tranquil freshwater cove adjoined to Naukuchiatal that bursts into thousands of vibrant pink water lilies and lotus blooms during warmer months.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kamal-tal",
                        "kamal-tal-lotus-lake",
                        "kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
                        "the-secluded-lotus-lake-of-naukuchiatal"
                ]
        },
        "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams": {
                "place_name": "Kumaoni Heritage Tea Room & Mountain Jams",
                "image_url": "/images/places/kainchi-dham/kumaoni-heritage-cafe-bhowali.webp",
                "visual_description": "A rustic wooden tea room on the Kainchi highway serving organic ginger green tea, apricot preserves, mountain honey pancakes, and bal mithai.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kumaoni-heritage-cafe-bhowali",
                        "kumaoni-heritage-tea-room",
                        "kumaoni-heritage-tea-room-and-mountain-jams",
                        "mountain-jams"
                ]
        },
        "kasol:chalal-riverside-pine-trail": {
                "place_name": "Chalal Riverside Pine Trail",
                "image_url": "/images/places/kasol/chalal-pine-trail.webp",
                "visual_description": "Scenic 2 km walking trail from Kasol suspension bridge through dense deodar forests alongside the turquoise Parvati River.",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chalal-pine-trail",
                        "chalal-riverside-pine-trail"
                ]
        },
        "kasol:manikaran-sahib-gurudwara-and-hot-springs": {
                "place_name": "Manikaran Sahib Gurudwara & Hot Springs",
                "image_url": "/images/places/kasol/manikaran-sahib-gurudwara.webp",
                "visual_description": "Sacred pilgrimage center where boiling geothermal springs power massive community langar kitchens on the banks of Parvati River.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hot-springs",
                        "manikaran-sahib-gurudwara",
                        "manikaran-sahib-gurudwara-and-hot-springs"
                ]
        },
        "kasol:tosh-village-apple-orchard-ridge": {
                "place_name": "Tosh Village Apple Orchard Ridge",
                "image_url": "/images/places/kasol/tosh-village.webp",
                "visual_description": "Rustic wooden Himalayan village perched at 2,400m overlooking snow-clad peaks, waterfalls, and steep tiered apple orchards.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tosh-village",
                        "tosh-village-apple-orchard-ridge"
                ]
        },
        "kasol:moon-dance-cafe-and-german-bakery": {
                "place_name": "Moon Dance Caf\u00e9 & German Bakery",
                "image_url": "/images/places/kasol/moon-dance-cafe.webp",
                "visual_description": "Kasol's iconic culinary hub since the 1990s, famous for cinnamon rolls, fresh hummus platters, shakshuka, and wood-fired pizzas.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "devraj-coffee",
                        "devraj-coffee-and-german-bakery",
                        "devraj-coffee-german-bakery",
                        "german-bakery",
                        "german-bakery-tapovan",
                        "moon-dance-cafe",
                        "moon-dance-cafe-and-german-bakery"
                ]
        },
        "kasol:grahan-village-heritage-trek": {
                "place_name": "Grahan Village Heritage Trek",
                "image_url": "/images/places/kasol/grahan-village-trek.webp",
                "visual_description": "An offbeat 8 km trek through pine canopies and rushing stream bridges to a traditional Himachali village with no motor road.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "grahan-village-heritage-trek",
                        "grahan-village-trek"
                ]
        },
        "kasol:evergreen-cafe-and-garden-lounge": {
                "place_name": "Evergreen Caf\u00e9 & Garden Lounge",
                "image_url": "/images/places/kasol/evergreen-cafe.webp",
                "visual_description": "Bohemian open garden restaurant serving legendary wood-fired laffa wraps, falafel platters, lamb schnitzel, and ginger mint tea.",
                "category": "Local Food",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "evergreen-cafe",
                        "evergreen-cafe-and-garden-lounge",
                        "garden-lounge"
                ]
        },
        "kasol:kasol-nature-park-pine-walk": {
                "place_name": "Kasol Nature Park Pine Walk",
                "image_url": "/images/places/kasol/nature-park-kasol.webp",
                "visual_description": "Protected riverbank forest park with wooden bridges, large river boulders, and shaded paths directly alongside the gushing Parvati.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kasol-nature-park-pine-walk",
                        "nature-park",
                        "nature-park-kasol"
                ]
        },
        "kasol:malana-village-ancient-approach-trail": {
                "place_name": "Malana Village Ancient Approach Trail",
                "image_url": "/images/places/kasol/malana-village-gate.webp",
                "visual_description": "Ancient autonomous mountain village known as the oldest surviving democracy in the world, with distinct customs and Kanashi language.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "malana-village-ancient-approach-trail",
                        "malana-village-gate"
                ]
        },
        "kasol:kheerganga-natural-sulphur-pool-and-meadow": {
                "place_name": "Kheerganga Natural Sulphur Pool & Meadow",
                "image_url": "/images/places/kasol/kheerganga-trail.webp",
                "visual_description": "A high alpine clearing at 2,960m at the end of a 12 km trek through Parvati valley, famous for natural hot thermal baths overlooking snow ridges.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kheerganga-natural-sulphur-pool",
                        "kheerganga-natural-sulphur-pool-and-meadow",
                        "kheerganga-trail",
                        "meadow"
                ]
        },
        "kasol:pulga-fairy-forest-ancient-deodar-enclave": {
                "place_name": "Pulga Fairy Forest (Ancient Deodar Enclave)",
                "image_url": "/images/places/kasol/pulga-fairy-forest.webp",
                "visual_description": "An ancient moss-covered deodar forest behind the traditional wooden village of Pulga, filled with fallen tree bridges, wild mushrooms, and wooden h...",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ancient-deodar-enclave",
                        "pulga-fairy-forest",
                        "pulga-fairy-forest-ancient-deodar-enclave"
                ]
        },
        "kasol:kalga-village-and-terraced-apple-orchards": {
                "place_name": "Kalga Village & Terraced Apple Orchards",
                "image_url": "/images/places/kasol/kalga-village.webp",
                "visual_description": "A vehicle-free mountain settlement situated on a sunny plateau surrounded by apple orchards, rustic wooden chalets, and views of Tosh river.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kalga-village",
                        "kalga-village-and-terraced-apple-orchards",
                        "terraced-apple-orchards"
                ]
        },
        "kasol:tulga-rustic-wooden-hamlet": {
                "place_name": "Tulga Rustic Wooden Hamlet",
                "image_url": "/images/places/kasol/tulga-hamlet.webp",
                "visual_description": "The quietest of the trio of villages (Kalga, Pulga, Tulga) preserving classical Kathkuni dry-stone and timber architecture and slow pastoral life.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tulga-hamlet",
                        "tulga-rustic-wooden-hamlet"
                ]
        },
        "kasol:rasol-high-alpine-village-trail-2-600m": {
                "place_name": "Rasol High Alpine Village Trail (2,600m)",
                "image_url": "/images/places/kasol/rasol-trail.webp",
                "visual_description": "A steep 4-hour mountain trek from Chalal winding up 1,000 vertical meters through pine woods to an ancient isolated wooden village.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "600m",
                        "rasol-high-alpine-village-trail",
                        "rasol-high-alpine-village-trail-2-600m",
                        "rasol-trail"
                ]
        },
        "kasol:chojh-riverside-pebble-beach-and-suspension-bridge": {
                "place_name": "Chojh Riverside Pebble Beach & Suspension Bridge",
                "image_url": "/images/places/kasol/chojh-bridge.webp",
                "visual_description": "A hidden village just across the Parvati River from Kasol accessed by a swaying iron suspension bridge, with sandy river banks and quiet cafes.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "beach",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chojh-bridge",
                        "chojh-riverside-pebble-beach",
                        "chojh-riverside-pebble-beach-and-suspension-bridge",
                        "suspension-bridge"
                ]
        },
        "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe": {
                "place_name": "Jim Morrison Wooden Terrace & Shakshuka Cafe",
                "image_url": "/images/places/kasol/jim-morrison-cafe.webp",
                "visual_description": "A legendary hilltop wooden cafe in Kasol requiring a short forest climb, known for floor seating, rock vinyl playlists, and Middle Eastern platters.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jim-morrison-cafe",
                        "jim-morrison-wooden-terrace",
                        "jim-morrison-wooden-terrace-and-shakshuka-cafe",
                        "shakshuka-cafe"
                ]
        },
        "kasol:waichin-valley-magic-valley-glacial-meadow": {
                "place_name": "Waichin Valley (Magic Valley Glacial Meadow)",
                "image_url": "/images/places/kasol/waichin-valley.webp",
                "visual_description": "An alpine valley situated high above the Malana dam at 2,700m offering uninterrupted, jaw-dropping vistas of the Animal Pass and glacier peaks.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "magic-valley-glacial-meadow",
                        "waichin-valley",
                        "waichin-valley-magic-valley-glacial-meadow"
                ]
        },
        "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge": {
                "place_name": "Tip-in-Top (Tiffin Top) Snow Crest Ridge",
                "image_url": "/images/places/lansdowne/tip-in-top-viewpoint.webp",
                "visual_description": "Scenic hilltop ridge at 1,700m surrounded by oak and pine forests, offering sweeping panoramic views of snow-capped Chaukhamba and Trishul peaks.",
                "category": "Must Visit",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "snow-crest-ridge",
                        "tiffin-top",
                        "tip-in-top",
                        "tip-in-top-tiffin-top-snow-crest-ridge",
                        "tip-in-top-viewpoint"
                ]
        },
        "lansdowne:bhulla-tal-lake-and-pine-promenade": {
                "place_name": "Bhulla Tal Lake & Pine Promenade",
                "image_url": "/images/places/lansdowne/bhulla-tal-lake.webp",
                "visual_description": "Immaculately maintained artificial lake built by the Garhwal Rifles in memory of soldier martyrs, featuring pedal boating and bamboo bridges.",
                "category": "Must Visit",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhulla-tal-lake",
                        "bhulla-tal-lake-and-pine-promenade",
                        "pine-promenade"
                ]
        },
        "lansdowne:st-johns-catholic-church-1936": {
                "place_name": "St. John's Catholic Church (1936)",
                "image_url": "/images/places/lansdowne/st-johns-church-1936.webp",
                "visual_description": "Historic colonial stone church established in 1936 along the Mall Road, surrounded by towering blue pines and colonial walking trails.",
                "category": "Culture & Heritage",
                "semantic_theme": "church",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1936",
                        "st-johns-catholic-church",
                        "st-johns-catholic-church-1936",
                        "st-johns-church-1936"
                ]
        },
        "lansdowne:darwan-singh-regimental-museum": {
                "place_name": "Darwan Singh Regimental Museum",
                "image_url": "/images/places/lansdowne/garhwal-rifles-museum.webp",
                "visual_description": "Historical military museum commemorating the valor of the Garhwal Rifles since 1887, exhibiting Victoria Crosses, war trophies, and uniforms.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "darwan-singh-regimental-museum",
                        "garhwal-rifles-museum"
                ]
        },
        "lansdowne:bhim-pakora-balancing-stone-wonder": {
                "place_name": "Bhim Pakora Balancing Stone Wonder",
                "image_url": "/images/places/lansdowne/bhim-pakora-stones.webp",
                "visual_description": "A natural geological curiosity of two massive stone boulders perched on top of each other that can be moved with a single finger without falling.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhim-pakora-balancing-stone-wonder",
                        "bhim-pakora-stones"
                ]
        },
        "lansdowne:hawaghar-pine-forest-ridge-promenade": {
                "place_name": "Hawaghar Pine Forest Ridge Promenade",
                "image_url": "/images/places/lansdowne/hawaghar-pine-walk.webp",
                "visual_description": "A scenic mountain pass overlooking the snow-covered peaks of the northern Garhwal range, ideal for morning walks and birdwatching.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hawaghar-pine-forest-ridge-promenade",
                        "hawaghar-pine-walk"
                ]
        },
        "lansdowne:lansdowne-hills-colonial-cafe-and-bakery": {
                "place_name": "Lansdowne Hills Colonial Caf\u00e9 & Bakery",
                "image_url": "/images/places/lansdowne/lansdowne-tripund-cafe.webp",
                "visual_description": "Rustic wooden caf\u00e9 serving freshly brewed Kumaon filter coffee, apple cinnamon cake, grilled sandwiches, and mountain herbal tea.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bakery",
                        "lansdowne-hills-colonial-cafe",
                        "lansdowne-hills-colonial-cafe-and-bakery",
                        "lansdowne-tripund-cafe",
                        "tripund-cafe"
                ]
        },
        "lansdowne:kalagarh-tiger-reserve-northern-gate": {
                "place_name": "Kalagarh Tiger Reserve Northern Gate",
                "image_url": "/images/places/lansdowne/kalagarh-tiger-gateway.webp",
                "visual_description": "The northern buffer zone of Corbett Tiger Reserve accessible from Lansdowne, featuring dense sal forests, wild Asian elephants, and tigers.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kalagarh-tiger-gateway",
                        "kalagarh-tiger-reserve-northern-gate"
                ]
        },
        "lansdowne:tarkeshwar-mahadev-giant-deodar-sanctuary": {
                "place_name": "Tarkeshwar Mahadev Giant Deodar Sanctuary",
                "image_url": "/images/places/lansdowne/tarkeshwar-mahadev-temple.webp",
                "visual_description": "An ancient Shiva shrine 38 km from Lansdowne nestled within a dense virgin forest of thousand-year-old towering deodars and brass bells.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tarkeshwar-mahadev-giant-deodar-sanctuary",
                        "tarkeshwar-mahadev-temple"
                ]
        },
        "lansdowne:st-marys-anglican-church-1896-heritage-archive": {
                "place_name": "St. Mary's Anglican Church (1896 Heritage Archive)",
                "image_url": "/images/places/lansdowne/st-marys-church-1896.webp",
                "visual_description": "A Victorian stone chapel built in 1896 by Colonel A.H.B. Hume, beautifully preserved as an audio-visual museum documenting Lansdowne\u2019s cantonment o...",
                "category": "Culture & Heritage",
                "semantic_theme": "church",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1896-heritage-archive",
                        "st-marys-anglican-church",
                        "st-marys-anglican-church-1896-heritage-archive",
                        "st-marys-church-1896"
                ]
        },
        "lansdowne:kaleshwar-mahadev-500-year-sage-meditation-cave": {
                "place_name": "Kaleshwar Mahadev 500-Year Sage Meditation Cave",
                "image_url": "/images/places/lansdowne/kaleshwar-mahadev-temple.webp",
                "visual_description": "The oldest temple in Lansdowne where local shepherds once worshipped Shiva, serving as a peaceful meditation sanctuary for centuries of ascetics.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kaleshwar-mahadev-500-year-sage-meditation-cave",
                        "kaleshwar-mahadev-temple"
                ]
        },
        "lansdowne:santoshi-mata-temple-sunset-peak-crest": {
                "place_name": "Santoshi Mata Temple (Sunset Peak Crest)",
                "image_url": "/images/places/lansdowne/santoshi-mata-temple-sunset.webp",
                "visual_description": "A small hilltop shrine located past Tip-in-Top offering an unobstructed vantage point to watch sunsets dissolve into the lower Shivalik and plains.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "santoshi-mata-temple",
                        "santoshi-mata-temple-sunset",
                        "santoshi-mata-temple-sunset-peak-crest",
                        "sunset-peak-crest"
                ]
        },
        "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail": {
                "place_name": "Deriyakhal Oak & Rhododendron Birding Trail",
                "image_url": "/images/places/lansdowne/deriyakhal-oak-forest-trail.webp",
                "visual_description": "A serene woodland hiking path through moss-covered oak trees where blue whistling thrushes, woodpeckers, and barking deer are frequently seen.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "deriyakhal-oak",
                        "deriyakhal-oak-and-rhododendron-birding-trail",
                        "deriyakhal-oak-forest-trail",
                        "rhododendron-birding-trail"
                ]
        },
        "lansdowne:kanvashram-historic-sanctuary-on-malini-river": {
                "place_name": "Kanvashram Historic Sanctuary on Malini River",
                "image_url": "/images/places/lansdowne/kanvashram-historic-sanctuary.webp",
                "visual_description": "The ancient Vedic hermitage on the river Malini where sage Kanva raised Shakuntala and where Emperor Bharata (namesake of India) spent his childhood.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kanvashram-historic-sanctuary",
                        "kanvashram-historic-sanctuary-on-malini-river"
                ]
        },
        "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea": {
                "place_name": "Mayur Cafe Steaming Momos & Ginger Tea",
                "image_url": "/images/places/lansdowne/mayur-cafe-mall-road.webp",
                "visual_description": "A cozy wooden eatery on Mall Road loved by generations of travellers for juicy steamed chicken and vegetable momos, thukpa, and adrak chai.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ginger-tea",
                        "mayur-cafe-mall-road",
                        "mayur-cafe-steaming-momos",
                        "mayur-cafe-steaming-momos-and-ginger-tea"
                ]
        },
        "lansdowne:sadar-bazaar-cantonment-heritage-lane": {
                "place_name": "Sadar Bazaar Cantonment Heritage Lane",
                "image_url": "/images/places/lansdowne/sadar-bazaar-wooden-curios.webp",
                "visual_description": "A quaint 19th-century hill cantonment lane featuring wooden general stores, locally hand-knitted woolen caps, pine crafts, and bakeries.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sadar-bazaar-cantonment-heritage-lane",
                        "sadar-bazaar-wooden-curios"
                ]
        },
        "leh:shanti-stupa-white-peace-pagoda": {
                "place_name": "Shanti Stupa White Peace Pagoda",
                "image_url": "/images/places/leh/shanti-stupa.webp",
                "visual_description": "White-domed Buddhist stupa atop Changspa ridge holding relics of the Buddha, famous for golden hour mountain panoramas.",
                "category": "Must Visit",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shanti-stupa",
                        "shanti-stupa-white-peace-pagoda"
                ]
        },
        "leh:thiksey-gompa-and-15m-maitreya-buddha": {
                "place_name": "Thiksey Gompa & 15m Maitreya Buddha",
                "image_url": "/images/places/leh/thiksey-monastery.webp",
                "visual_description": "A twelve-story monastery complex resembling the Potala Palace in Lhasa, housing a magnificent two-story gilded statue of Maitreya Buddha.",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "15m-maitreya-buddha",
                        "thiksey-gompa",
                        "thiksey-gompa-and-15m-maitreya-buddha",
                        "thiksey-monastery"
                ]
        },
        "leh:confluence-of-indus-and-zanskar-rivers-sangam": {
                "place_name": "Confluence of Indus & Zanskar Rivers (Sangam)",
                "image_url": "/images/places/leh/sangam-confluence.webp",
                "visual_description": "The dramatic meeting point where the emerald green waters of the Indus merge with the muddy ochre currents of the rushing Zanskar.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "confluence-of-indus",
                        "confluence-of-indus-and-zanskar-rivers-sangam",
                        "sangam",
                        "sangam-confluence",
                        "zanskar-rivers"
                ]
        },
        "leh:lalas-art-cafe-restored-heritage-labrang": {
                "place_name": "Lala's Art Caf\u00e9 (Restored Heritage Labrang)",
                "image_url": "/images/places/leh/lalas-art-cafe.webp",
                "visual_description": "Historic mud-brick Buddhist temple building in Old Town Leh converted into an intimate art gallery and caf\u00e9 serving Ladakhi Khambir bread.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "lalas-art-cafe",
                        "lalas-art-cafe-restored-heritage-labrang",
                        "restored-heritage-labrang"
                ]
        },
        "leh:gesmo-restaurant-and-german-bakery-since-1989": {
                "place_name": "Gesmo Restaurant & German Bakery (Since 1989)",
                "image_url": "/images/places/leh/gesmo-restaurant.webp",
                "visual_description": "Leh's oldest beloved travelers' hub renowned for handmade yak cheese pizza, apricot pies, spicy Thukpa, and cinnamon buns.",
                "category": "Local Food",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "devraj-coffee",
                        "devraj-coffee-and-german-bakery",
                        "devraj-coffee-german-bakery",
                        "german-bakery",
                        "german-bakery-tapovan",
                        "gesmo-restaurant",
                        "gesmo-restaurant-and-german-bakery-since-1989",
                        "since-1989"
                ]
        },
        "leh:hall-of-fame-military-and-cultural-museum": {
                "place_name": "Hall of Fame Military & Cultural Museum",
                "image_url": "/images/places/leh/hall-of-fame-leh.webp",
                "visual_description": "A comprehensive museum managed by the Indian Army showcasing Ladakh's war history, Siachen Glacier expeditions, and cultural artifacts.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "cultural-museum",
                        "hall-of-fame",
                        "hall-of-fame-leh",
                        "hall-of-fame-military",
                        "hall-of-fame-military-and-cultural-museum"
                ]
        },
        "leh:khardung-la-high-mountain-pass-5-359m": {
                "place_name": "Khardung La High Mountain Pass (5,359m)",
                "image_url": "/images/places/leh/khardung-la.webp",
                "visual_description": "The world-famous gateway mountain pass connecting Leh to the Nubra and Shyok valleys, situated at an altitude of 5,359m (17,582 ft) amidst snow cor...",
                "category": "Must Visit",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "359m",
                        "khardung-la",
                        "khardung-la-high-mountain-pass",
                        "khardung-la-high-mountain-pass-5-359m"
                ]
        },
        "leh:nubra-valley-and-hunder-sand-dunes": {
                "place_name": "Nubra Valley & Hunder Sand Dunes",
                "image_url": "/images/places/leh/nubra-hunder-sand-dunes.webp",
                "visual_description": "A surreal cold desert valley of white sand dunes surrounded by barren snow peaks, famous for the double-humped Bactrian camels of the ancient Silk ...",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hunder-sand-dunes",
                        "nubra-hunder-sand-dunes",
                        "nubra-valley",
                        "nubra-valley-and-hunder-sand-dunes"
                ]
        },
        "leh:hemis-monastery-and-sacred-museum": {
                "place_name": "Hemis Monastery & Sacred Museum",
                "image_url": "/images/places/leh/hemis-monastery.webp",
                "visual_description": "The largest, wealthiest, and most culturally prominent Drukpa Kagyu monastery in Ladakh, home to a world-class underground museum of ancient tantri...",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hemis-monastery",
                        "hemis-monastery-and-sacred-museum",
                        "sacred-museum"
                ]
        },
        "leh:magnetic-hill-gravity-defying-ridge": {
                "place_name": "Magnetic Hill Gravity Defying Ridge",
                "image_url": "/images/places/leh/magnetic-hill.webp",
                "visual_description": "Famous optical illusion hill on the Leh-Kargil highway where stationary vehicles appear to roll uphill.rushing mud-tinted Zanskar, carving through ...",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "magnetic-hill",
                        "magnetic-hill-gravity-defying-ridge"
                ]
        },
        "leh:general-zorawar-fort-and-military-museum": {
                "place_name": "General Zorawar Fort & Military Museum",
                "image_url": "/images/places/leh/zorawar-fort.webp",
                "visual_description": "Historic mud and stone fortress built by General Zorawar Singh in 1836, overlooking Old Leh town.promote world peace, perched atop a steep hill ove...",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "general-zorawar-fort",
                        "general-zorawar-fort-and-military-museum",
                        "military-museum",
                        "zorawar-fort"
                ]
        },
        "leh:lamayuru-moonland-and-ancient-monastery": {
                "place_name": "Lamayuru Moonland & Ancient Monastery",
                "image_url": "/images/places/leh/lamayuru-moonland.webp",
                "visual_description": "Leh's oldest bakery and traveler restaurant operating since 1989, legendary for hearty yak cheese pizzas, freshly baked apple crumble, and ginger l...",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ancient-monastery",
                        "lamayuru-moonland",
                        "lamayuru-moonland-and-ancient-monastery"
                ]
        },
        "leh:lalas-art-cafe-in-old-town-leh": {
                "place_name": "Lala's Art Cafe in Old Town Leh",
                "image_url": "/images/places/leh/alchi-monastery.webp",
                "visual_description": "UNESCO-recognized ancient monastic complex on the banks of the Indus, celebrated for preserved Kashmiri-style Buddhist wall frescoes.this artistic ...",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "alchi-monastery",
                        "lalas-art-cafe-in-old-town-leh"
                ]
        },
        "leh:bon-appetit-organic-garden-dining": {
                "place_name": "Bon Appetit Organic Garden Dining",
                "image_url": "/images/places/leh/bon-appetit-leh.webp",
                "visual_description": "Designed by French architects using raw rammed-earth and black slate, this fine-dining sanctuary sits in a quiet apple garden with floor-to-ceiling...",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bon-appetit",
                        "bon-appetit-leh",
                        "bon-appetit-organic-garden-dining"
                ]
        },
        "manali:hadimba-devi-cedar-forest-temple": {
                "place_name": "Hadimba Devi Cedar Forest Temple",
                "image_url": "/images/places/manali/hadimba-temple.webp",
                "visual_description": "A 16th-century four-tiered pagoda-style wooden temple nestled deep inside towering Dhungri deodar forests.",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hadimba-devi-cedar-forest-temple",
                        "hadimba-devi-temple",
                        "hadimba-temple"
                ]
        },
        "manali:cafe-1947-riverside-stone-cafe": {
                "place_name": "Caf\u00e9 1947 (Riverside Stone Caf\u00e9)",
                "image_url": "/images/places/manali/cafe-1947.webp",
                "visual_description": "Old Manali's iconic stone caf\u00e9 sitting directly over the rushing Manalsu river stream, renowned for wood-fired pizza and acoustic indie sets.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "cafe-1947",
                        "cafe-1947-riverside",
                        "cafe-1947-riverside-stone-cafe",
                        "cafe-1947-riverside-stone-caf\u00e9",
                        "caf\u00e9-1947",
                        "riverside-stone-cafe"
                ]
        },
        "manali:jogini-waterfall-pine-trail": {
                "place_name": "Jogini Waterfall Pine Trail",
                "image_url": "/images/places/manali/jogini-waterfall.webp",
                "visual_description": "A gentle 3 km hike through apple orchards and pine groves starting from Vashisht village leading to a cascading multi-tier waterfall.",
                "category": "Nature & Trails",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jogini-falls",
                        "jogini-waterfall",
                        "jogini-waterfall-pine-trail"
                ]
        },
        "manali:old-manali-village-and-manu-temple": {
                "place_name": "Old Manali Village & Manu Temple",
                "image_url": "/images/places/manali/old-manali-village.webp",
                "visual_description": "Traditional wooden Himachali architecture surrounded by apple orchards and narrow stone alleys lined with bohemian caf\u00e9s.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "manu-temple",
                        "old-manali-village",
                        "old-manali-village-and-manu-temple",
                        "old-village"
                ]
        },
        "manali:drifters-cafe-and-acoustic-inn": {
                "place_name": "Drifters' Caf\u00e9 & Acoustic Inn",
                "image_url": "/images/places/manali/drifters-cafe.webp",
                "visual_description": "Warm wooden caf\u00e9 offering board games, live acoustic indie sets, cinnamon French toast, and handcrafted espresso.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "acoustic-inn",
                        "drifters-cafe",
                        "drifters-cafe-and-acoustic-inn",
                        "drifters-inn",
                        "drifters-inn-and-wooden-loft",
                        "drifters-inn-wooden-loft"
                ]
        },
        "manali:solang-valley-alpine-adventure-grounds": {
                "place_name": "Solang Valley Alpine Adventure Grounds",
                "image_url": "/images/places/manali/solang-valley.webp",
                "visual_description": "High alpine valley famous for paragliding over pine slopes, zorbing, winter ski slopes, and panoramic snow peak vistas.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "solang-valley",
                        "solang-valley-alpine-adventure-grounds"
                ]
        },
        "manali:vashisht-hot-sulphur-springs-and-ancient-temple": {
                "place_name": "Vashisht Hot Sulphur Springs & Ancient Temple",
                "image_url": "/images/places/manali/vashisht-springs.webp",
                "visual_description": "Natural geothermal hot springs with stone bathing tanks attached to a 4,000-year-old wooden temple dedicated to Sage Vashistha.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ancient-temple",
                        "vashisht-hot-springs",
                        "vashisht-hot-sulphur-springs",
                        "vashisht-hot-sulphur-springs-and-ancient-temple",
                        "vashisht-springs"
                ]
        },
        "manali:the-johnsons-cafe-and-trout-bar": {
                "place_name": "The Johnson's Caf\u00e9 & Trout Bar",
                "image_url": "/images/places/manali/johnsons-cafe.webp",
                "visual_description": "Celebrated garden restaurant set in a manicured lawn serving fresh wood-smoked Himalayan river trout and authentic apple cider.",
                "category": "Local Food",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "johnsons-cafe",
                        "johnsons-cafe-trout-bar",
                        "the-johnsons-cafe",
                        "the-johnsons-cafe-and-trout-bar",
                        "trout-bar"
                ]
        },
        "manali:naggar-castle-kath-kuni-royal-palace": {
                "place_name": "Naggar Castle (Kath-Kuni Royal Palace)",
                "image_url": "/images/places/manali/naggar-castle.webp",
                "visual_description": "A magnificent 15th-century wood-and-stone castle built by Raja Sidh Singh, showcasing earthquake-resistant Kath-Kuni architecture with sweeping vie...",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kath-kuni-royal-palace",
                        "naggar-castle",
                        "naggar-castle-kath-kuni-royal-palace"
                ]
        },
        "manali:rohtang-pass-snow-crest-and-alpine-gateway": {
                "place_name": "Rohtang Pass Snow Crest & Alpine Gateway",
                "image_url": "/images/places/manali/rohtang-pass.webp",
                "visual_description": "At an elevation of 3,978m (13,050 ft), Rohtang Pass connects the lush Kullu Valley to the stark arid mountains of Lahaul and Spiti, offering breath...",
                "category": "Must Visit",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "alpine-gateway",
                        "rohtang-pass",
                        "rohtang-pass-snow-crest",
                        "rohtang-pass-snow-crest-and-alpine-gateway"
                ]
        },
        "manali:atal-tunnel-north-portal-and-sissu-waterfall": {
                "place_name": "Atal Tunnel North Portal & Sissu Waterfall",
                "image_url": "/images/places/manali/atal-tunnel-sissu.webp",
                "visual_description": "Passing through the 9.02 km Atal Tunnel brings you into the dramatic high-desert valley of Lahaul, where the spectacular Sissu Waterfall drops 50 m...",
                "category": "Nature & Trails",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "atal-tunnel-north-portal",
                        "atal-tunnel-north-portal-and-sissu-waterfall",
                        "atal-tunnel-sissu",
                        "sissu-waterfall"
                ]
        },
        "manali:manu-temple-historic-shrine-of-sage-manu": {
                "place_name": "Manu Temple (Historic Shrine of Sage Manu)",
                "image_url": "/images/places/manali/manu-temple.webp",
                "visual_description": "Perched on the top ridge of Old Manali, this ancient pagoda-style temple is believed to be the only temple dedicated to Sage Manu, who saved humani...",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "historic-shrine-of-sage-manu",
                        "manu-temple",
                        "manu-temple-historic-shrine-of-sage-manu"
                ]
        },
        "manali:sethan-igloo-village-and-hampta-valley-ridge": {
                "place_name": "Sethan Igloo Village & Hampta Valley Ridge",
                "image_url": "/images/places/manali/sethan-igloo-village.webp",
                "visual_description": "A quiet Buddhist village perched at 2,700m inhabited by the Khampa tribe, famous for winter igloo stays, bouldering, and the gateway to Hampta Pass.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hampta-valley-ridge",
                        "sethan-igloo-village",
                        "sethan-igloo-village-and-hampta-valley-ridge"
                ]
        },
        "manali:beas-river-nature-park-and-deodar-walk": {
                "place_name": "Beas River Nature Park & Deodar Walk",
                "image_url": "/images/places/manali/beas-river-park.webp",
                "visual_description": "A protected forested sanctuary along the rushing waters of the Manalsu and Beas rivers, with towering centuries-old deodars and natural pebble ston...",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "beas-river-nature-park",
                        "beas-river-nature-park-and-deodar-walk",
                        "beas-river-park",
                        "deodar-walk"
                ]
        },
        "manali:lazy-dog-lounge-riverside-deck": {
                "place_name": "Lazy Dog Lounge Riverside Deck",
                "image_url": "/images/places/manali/lazy-dog-lounge.webp",
                "visual_description": "Old Manali's iconic riverside lounge featuring a sunlit wooden deck over the rushing Manalsu river, craft beverages, grilled trout, and acoustic mu...",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "lazy-dog-lounge",
                        "lazy-dog-lounge-riverside-deck"
                ]
        },
        "manali:dylans-toasted-and-roasted-coffee-house": {
                "place_name": "Dylan's Toasted & Roasted Coffee House",
                "image_url": "/images/places/manali/dylans-cafe.webp",
                "visual_description": "Serving travelers since 2005, Dylan's is famous for fresh-roasted Arabica coffee, gooey homemade cinnamon rolls, and chocolate chip cookies.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dylans-cafe",
                        "dylans-toasted",
                        "dylans-toasted-and-roasted-coffee-house",
                        "roasted-coffee-house"
                ]
        },
        "manali:gulaba-meadows-and-alpine-snow-line": {
                "place_name": "Gulaba Meadows & Alpine Snow Line",
                "image_url": "/images/places/manali/gulaba-meadows.webp",
                "visual_description": "Picturesque high alpine meadows situated along the Rohtang road, surrounded by cascading streams and blooming rhododendron wildflowers in summer.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "alpine-snow-line",
                        "gulaba-meadows",
                        "gulaba-meadows-and-alpine-snow-line"
                ]
        },
        "manali:chopsticks-tibetan-and-asian-kitchen": {
                "place_name": "Chopsticks Tibetan & Asian Kitchen",
                "image_url": "/images/places/manali/chopsticks-manali.webp",
                "visual_description": "A beloved Mall Road establishment serving steaming Tibetan thukpa, hand-folded momos, gyathuk, and local fruit wines for over three decades.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "asian-kitchen",
                        "chopsticks",
                        "chopsticks-manali",
                        "chopsticks-tibetan",
                        "chopsticks-tibetan-and-asian-kitchen"
                ]
        },
        "mathura-vrindavan:bankey-bihari-temple-vrindavan": {
                "place_name": "Bankey Bihari Temple Vrindavan",
                "image_url": "/images/places/mathura-vrindavan/bankey-bihari-temple.webp",
                "visual_description": "The most revered temple in Vrindavan dedicated to Lord Krishna in the Tribhanga posture, famous for dynamic curtain darshans and kirtans.",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bankey-bihari-temple",
                        "bankey-bihari-temple-vrindavan"
                ]
        },
        "mathura-vrindavan:shri-krishna-janmabhoomi-temple-complex": {
                "place_name": "Shri Krishna Janmabhoomi Temple Complex",
                "image_url": "/images/places/mathura-vrindavan/shri-krishna-janmabhoomi.webp",
                "visual_description": "The sacred birthplace of Lord Krishna in Mathura containing the ancient prison cell (Garbha Griha), Keshavdev temple, and sacred kund.",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shri-krishna-janmabhoomi",
                        "shri-krishna-janmabhoomi-temple-complex"
                ]
        },
        "mathura-vrindavan:prem-mandir-italian-carrara-marble-temple": {
                "place_name": "Prem Mandir Italian Carrara Marble Temple",
                "image_url": "/images/places/mathura-vrindavan/prem-mandir-vrindavan.webp",
                "visual_description": "Spectacular 54-acre temple carved entirely of pure Italian Carrara marble, illuminated at night with vibrant multi-colored light fountains.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "prem-mandir-italian-carrara-marble-temple",
                        "prem-mandir-vrindavan"
                ]
        },
        "mathura-vrindavan:iskcon-sri-krishna-balaram-temple": {
                "place_name": "ISKCON Sri Krishna Balaram Temple",
                "image_url": "/images/places/mathura-vrindavan/iskcon-vrindavan.webp",
                "visual_description": "International center of Hare Krishna devotion featuring pure white marble courtyards, Srila Prabhupada's Samadhi, and 24-hour Kirtan.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "iskcon-sri-krishna-balaram-temple",
                        "iskcon-vrindavan"
                ]
        },
        "mathura-vrindavan:vishram-ghat-evening-yamuna-maha-aarti": {
                "place_name": "Vishram Ghat Evening Yamuna Maha Aarti",
                "image_url": "/images/places/mathura-vrindavan/vishram-ghat-aarti.webp",
                "visual_description": "The central sacred ghat of Mathura where Lord Krishna rested after slaying Kansa; features glittering brass evening aarti over the Yamuna.",
                "category": "Nature & Trails",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "vishram-ghat-aarti",
                        "vishram-ghat-evening-yamuna-maha-aarti"
                ]
        },
        "mathura-vrindavan:nidhivan-sacred-basil-forest-grove": {
                "place_name": "Nidhivan Sacred Basil Forest Grove",
                "image_url": "/images/places/mathura-vrindavan/nidhivan-grove.webp",
                "visual_description": "Mystical forest of intertwined Tulsi (holy basil) trees where divine Rasleela is believed to take place every night in complete seclusion.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "nidhivan-grove",
                        "nidhivan-sacred-basil-forest-grove"
                ]
        },
        "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda": {
                "place_name": "Brijwasi Mithai Wala (Original Mathura Peda)",
                "image_url": "/images/places/mathura-vrindavan/brijwasi-mithai-wala.webp",
                "visual_description": "Legendary confectioner since the 1920s famous for caramelized golden Mathura Peda made from slow-cooked mawa, cardamom, and pure ghee.",
                "category": "Local Food",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "brijwasi-mithai-wala",
                        "brijwasi-mithai-wala-original-mathura-peda",
                        "original-mathura-peda"
                ]
        },
        "mathura-vrindavan:radha-raman-ancient-self-manifested-deity": {
                "place_name": "Radha Raman Ancient Self-Manifested Deity",
                "image_url": "/images/places/mathura-vrindavan/radha-raman-temple.webp",
                "visual_description": "500-year-old temple holding the self-manifested Shaligram deity of Lord Krishna, with an eternal sacred cooking fire burning since 1542.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "radha-raman-ancient-self-manifested-deity",
                        "radha-raman-temple"
                ]
        },
        "mathura-vrindavan:kusum-sarovar-18th-century-sandstone-reservoir": {
                "place_name": "Kusum Sarovar 18th-Century Sandstone Reservoir",
                "image_url": "/images/places/mathura-vrindavan/kusum-sarovar-govardhan.webp",
                "visual_description": "A magnificent 450-foot long carved sandstone water palace and tiered ghats built in 1764 by Maharaja Jawahar Singh in memory of Raja Suraj Mal.",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kusum-sarovar-18th-century-sandstone-reservoir",
                        "kusum-sarovar-govardhan"
                ]
        },
        "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path": {
                "place_name": "Govardhan Hill (Giriraj Sacred Parikrama Path)",
                "image_url": "/images/places/mathura-vrindavan/govardhan-hill-parikrama.webp",
                "visual_description": "The sacred 21 km circumambulation route around Mount Govardhan, which Lord Krishna lifted on his little finger to shelter the villagers from Indra\u2019...",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "giriraj-sacred-parikrama-path",
                        "govardhan-hill",
                        "govardhan-hill-giriraj-sacred-parikrama-path",
                        "govardhan-hill-parikrama"
                ]
        },
        "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace": {
                "place_name": "Barsana Shri Radha Rani Temple (Ladli Ji Palace)",
                "image_url": "/images/places/mathura-vrindavan/barsana-shri-radha-rani-temple.webp",
                "visual_description": "A grand hilltop fortress-palace dedicated to Shri Radha perched atop Bhanugarh peak, world-famous as the home of the exuberant Lathmar Holi.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "barsana-shri-radha-rani-temple",
                        "barsana-shri-radha-rani-temple-ladli-ji-palace",
                        "ladli-ji-palace"
                ]
        },
        "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes": {
                "place_name": "Radha Kund & Shyam Kund Sacred Twin Lakes",
                "image_url": "/images/places/mathura-vrindavan/radha-kund-shyam-kund.webp",
                "visual_description": "Two adjoining holy lakes considered the most sacred bathing water in the Vaishnava tradition, created by Radha and Krishna during the slaying of Ar...",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "radha-kund",
                        "radha-kund-and-shyam-kund-sacred-twin-lakes",
                        "radha-kund-shyam-kund",
                        "shyam-kund-sacred-twin-lakes"
                ]
        },
        "mathura-vrindavan:potra-kund-sacred-stepped-stepwell": {
                "place_name": "Potra Kund Sacred Stepped Stepwell",
                "image_url": "/images/places/mathura-vrindavan/potra-kund-mathura.webp",
                "visual_description": "A massive red sandstone stepped water reservoir near Janmabhoomi where Mother Devaki washed the baby garments of infant Krishna.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "potra-kund-mathura",
                        "potra-kund-sacred-stepped-stepwell"
                ]
        },
        "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset": {
                "place_name": "Keshi Ghat Stone Palace & Riverfront Sunset",
                "image_url": "/images/places/mathura-vrindavan/keshi-ghat-yamuna-sunset.webp",
                "visual_description": "The most imposing ghat in Vrindavan featuring continuous arched stone jharokhas and towers where Krishna bathed after subduing the horse demon Keshi.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "keshi-ghat-stone-palace",
                        "keshi-ghat-stone-palace-and-riverfront-sunset",
                        "keshi-ghat-yamuna-sunset",
                        "riverfront-sunset"
                ]
        },
        "mathura-vrindavan:vrindavan-chandrodaya-mandir-cultural-park": {
                "place_name": "Vrindavan Chandrodaya Mandir Cultural Park",
                "image_url": "/images/places/mathura-vrindavan/chandrodaya-mandir-lookout.webp",
                "visual_description": "The monumental spiritual and architectural park featuring heritage gardens, laser presentations, and traditional Braj heritage pavilions.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chandrodaya-mandir-lookout",
                        "vrindavan-chandrodaya-mandir-cultural-park"
                ]
        },
        "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store": {
                "place_name": "Chappan Bhog Malai Rabri & Khurchan Store",
                "image_url": "/images/places/mathura-vrindavan/brij-chappan-bhog-sweets.webp",
                "visual_description": "A renowned traditional confectioner in Mathura preparing rich buffalo milk khurchan, layered malai rabri, crisp kachoris, and badam milk.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "brij-chappan-bhog-sweets",
                        "chappan-bhog-malai-rabri",
                        "chappan-bhog-malai-rabri-and-khurchan-store",
                        "khurchan-store"
                ]
        },
        "morni-hills:tikkar-taal-twin-lakes-and-boating": {
                "place_name": "Tikkar Taal Twin Lakes & Boating",
                "image_url": "/images/places/morni-hills/tikkar-taal-lakes.webp",
                "visual_description": "Sacred interconnected twin lakes (Bada Taal and Chhota Taal) separated by a scenic hillock, offering calm pedal boating and camping.",
                "category": "Must Visit",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "boating",
                        "tikkar-taal-lakes",
                        "tikkar-taal-twin-lakes",
                        "tikkar-taal-twin-lakes-and-boating"
                ]
        },
        "morni-hills:morni-fort-17th-century-ramparts": {
                "place_name": "Morni Fort 17th-Century Ramparts",
                "image_url": "/images/places/morni-hills/morni-fort-heritage.webp",
                "visual_description": "Historic hill fortress built in the 17th century on a commanding ridge overlooking the entire Morni mountain basin.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "morni-fort-17th-century-ramparts",
                        "morni-fort-heritage"
                ]
        },
        "morni-hills:morni-shivalik-herbal-forest-and-bird-trail": {
                "place_name": "Morni Shivalik Herbal Forest & Bird Trail",
                "image_url": "/images/places/morni-hills/herbal-nature-trail.webp",
                "visual_description": "Extensive nature trails through pine, oak, and wild medicinal herbs, home to red junglefowl, kalij pheasants, and quails.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bird-trail",
                        "herbal-nature-trail",
                        "morni-shivalik-herbal-forest",
                        "morni-shivalik-herbal-forest-and-bird-trail"
                ]
        },
        "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course": {
                "place_name": "Adventure Park Tikkar Taal (Zip & Obstacle Course)",
                "image_url": "/images/places/morni-hills/adventure-park-tikkar.webp",
                "visual_description": "Lakeside adventure park offering ziplining across hillocks, Burma bridges, rope climbing, and lakeside trekking trails.",
                "category": "Adventure & Treks",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "adventure-park-tikkar",
                        "adventure-park-tikkar-taal",
                        "adventure-park-tikkar-taal-zip-and-obstacle-course",
                        "obstacle-course",
                        "zip"
                ]
        },
        "morni-hills:gurudwara-nada-sahib-en-route": {
                "place_name": "Gurudwara Nada Sahib En-Route",
                "image_url": "/images/places/morni-hills/gurudwara-nada-sahib.webp",
                "visual_description": "Sacred Sikh shrine situated on the bank of the Ghaggar River where Guru Gobind Singh Ji stayed in 1688 after the Battle of Bhangani.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "gurudwara-nada-sahib",
                        "gurudwara-nada-sahib-en-route"
                ]
        },
        "morni-hills:pheasant-breeding-centre-berwala": {
                "place_name": "Pheasant Breeding Centre Berwala",
                "image_url": "/images/places/morni-hills/berwala-pheasant-breeding.webp",
                "visual_description": "Asia's premier breeding facility for endangered Red Junglefowl and Cheer Pheasants dedicated to conservation and rewilding.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "berwala-pheasant-breeding",
                        "pheasant-breeding-centre-berwala"
                ]
        },
        "morni-hills:mountain-quail-terrace-dhaba": {
                "place_name": "Mountain Quail Terrace Dhaba",
                "image_url": "/images/places/morni-hills/mountain-quail-resort-dhaba.webp",
                "visual_description": "Haryana Tourism scenic terrace overlooking the valleys serving hot aloo pyaz parathas, Kadhi Pakora, and spiced ginger tea.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mountain-quail-resort-dhaba",
                        "mountain-quail-terrace-dhaba"
                ]
        },
        "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge": {
                "place_name": "Shivalik Viewpoint Crest & Sunset Ridge",
                "image_url": "/images/places/morni-hills/shivalik-viewpoint-crest.webp",
                "visual_description": "Elevated road crest along the Morni-Tikkar Taal link road offering wide unobstructed views towards the snowlines on clear winter days.",
                "category": "Hidden Gems",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shivalik-viewpoint-crest",
                        "shivalik-viewpoint-crest-and-sunset-ridge",
                        "sunset-ridge"
                ]
        },
        "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy": {
                "place_name": "Kalesar Wildlife Sanctuary & Sal Canopy",
                "image_url": "/images/places/morni-hills/kalesar-national-park-border.webp",
                "visual_description": "A 13,000-acre dense sal forest reserve bordering the Shivaliks where wild leopards, barking deer, sambar, and grey hornbills roam freely.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kalesar-national-park-border",
                        "kalesar-wildlife-sanctuary",
                        "kalesar-wildlife-sanctuary-and-sal-canopy",
                        "sal-canopy"
                ]
        },
        "morni-hills:mandhana-high-pine-crest-trail": {
                "place_name": "Mandhana High Pine Crest Trail",
                "image_url": "/images/places/morni-hills/mandhana-pine-ridge-trail.webp",
                "visual_description": "A breezy walking trail along the narrow ridge connecting Morni to Mandhana village, offering views down into Himachal valleys on both sides.",
                "category": "Adventure & Treks",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mandhana-high-pine-crest-trail",
                        "mandhana-pine-ridge-trail"
                ]
        },
        "morni-hills:bada-taal-the-greater-sacred-wetland-lake": {
                "place_name": "Bada Taal (The Greater Sacred Wetland Lake)",
                "image_url": "/images/places/morni-hills/bada-taal-lotus-wetland.webp",
                "visual_description": "The larger of the twin Tikkar lakes revered as a sacred body of water, flanked by lush green reeds, water lilies, and wandering egrets.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bada-taal",
                        "bada-taal-lotus-wetland",
                        "bada-taal-the-greater-sacred-wetland-lake",
                        "the-greater-sacred-wetland-lake"
                ]
        },
        "morni-hills:bhuru-singh-deota-cliff-sanctuary": {
                "place_name": "Bhuru Singh Deota Cliff Sanctuary",
                "image_url": "/images/places/morni-hills/bhurusingh-deota-temple.webp",
                "visual_description": "A historic tribal hill shrine dedicated to the legendary protector deity of the Morni hills, overlooking the seasonal river ravine.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhuru-singh-deota-cliff-sanctuary",
                        "bhurusingh-deota-temple"
                ]
        },
        "morni-hills:saketi-shivalik-prehistoric-fossil-park": {
                "place_name": "Saketi Shivalik Prehistoric Fossil Park",
                "image_url": "/images/places/morni-hills/shivalik-fossil-park-saketi.webp",
                "visual_description": "A 2.5-million-year-old prehistoric mammalian fossil park showcasing life-size fiberglass reconstructions of sabre-toothed tigers and giant elephants.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "saketi-shivalik-prehistoric-fossil-park",
                        "shivalik-fossil-park-saketi"
                ]
        },
        "morni-hills:morni-pine-canopy-treehouse-platform": {
                "place_name": "Morni Pine Canopy Treehouse Platform",
                "image_url": "/images/places/morni-hills/morni-tree-house-lookout.webp",
                "visual_description": "An elevated wooden timber watchtower built among chir pine treetops offering aerial binoculars views over the Shivalik bird corridors.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "morni-pine-canopy-treehouse-platform",
                        "morni-tree-house-lookout"
                ]
        },
        "morni-hills:morni-forest-wild-multifloral-honey-apiary": {
                "place_name": "Morni Forest Wild Multifloral Honey Apiary",
                "image_url": "/images/places/morni-hills/haryana-agro-honey-center.webp",
                "visual_description": "An eco-apiary and processing outlet producing raw, unprocessed wild floral honey gathered from Shivalik acacia and eucalyptus blossoms.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "haryana-agro-honey-center",
                        "morni-forest-wild-multifloral-honey-apiary"
                ]
        },
        "morni-hills:ghaggar-river-pebble-banks-and-shallows": {
                "place_name": "Ghaggar River Pebble Banks & Shallows",
                "image_url": "/images/places/morni-hills/ghaggar-river-pebble-banks.webp",
                "visual_description": "Clean, broad stone riverbeds where the Ghaggar emerges from the hills, perfect for water wading, skipping stones, and quiet family picnics.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ghaggar-river-pebble-banks",
                        "ghaggar-river-pebble-banks-and-shallows",
                        "shallows"
                ]
        },
        "munnar:eravikulam-national-park-rajamalai": {
                "place_name": "Eravikulam National Park (Rajamalai)",
                "image_url": "/images/places/munnar/eravikulam-national-park.webp",
                "visual_description": "Sanctuary for the endangered Nilgiri Tahr mountain goat, featuring rolling shola grasslands, Anamudi Peak vistas, and blooming Neelakurinji flowers.",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "eravikulam-national-park",
                        "eravikulam-national-park-rajamalai",
                        "rajamalai"
                ]
        },
        "munnar:mattupetty-dam-and-speedboating-basin": {
                "place_name": "Mattupetty Dam & Speedboating Basin",
                "image_url": "/images/places/munnar/mattupetty-dam-lake.webp",
                "visual_description": "Concrete gravity storage dam nestled amidst tea hills and dense eucalyptus forests, popular for quiet speedboating and wild elephant sightings.",
                "category": "Nature & Trails",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mattupetty-dam",
                        "mattupetty-dam-and-speedboating-basin",
                        "mattupetty-dam-lake",
                        "speedboating-basin"
                ]
        },
        "munnar:kdhp-tea-museum-and-factory-processing": {
                "place_name": "KDHP Tea Museum & Factory Processing",
                "image_url": "/images/places/munnar/tata-tea-museum.webp",
                "visual_description": "Historic 1880s tea factory showcasing the evolution of Kerala's tea plantations with live orthodox tea plucking and tasting sessions.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "factory-processing",
                        "kdhp-tea-museum",
                        "kdhp-tea-museum-and-factory-processing",
                        "tata-tea-museum"
                ]
        },
        "munnar:top-station-western-ghats-cloud-viewpoint": {
                "place_name": "Top Station Western Ghats Cloud Viewpoint",
                "image_url": "/images/places/munnar/top-station-viewpoint.webp",
                "visual_description": "The highest point on the Munnar-Kodaikanal road (1,880m) on the Kerala-Tamil Nadu border, famous for sweeping views of the Western Ghats and cloud ...",
                "category": "Adventure & Treks",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "top-station-viewpoint",
                        "top-station-western-ghats-cloud-viewpoint"
                ]
        },
        "munnar:attukad-waterfalls-jungle-trail": {
                "place_name": "Attukad Waterfalls Jungle Trail",
                "image_url": "/images/places/munnar/attukad-waterfalls.webp",
                "visual_description": "A roaring multi-tiered waterfall cascading through deep jungle ravines and lush tea slopes, reachable via a scenic suspension bridge.",
                "category": "Nature & Trails",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "attukad-waterfalls",
                        "attukad-waterfalls-jungle-trail"
                ]
        },
        "munnar:pothamedu-viewpoint-sunset-over-tea-valleys": {
                "place_name": "Pothamedu Viewpoint (Sunset over Tea Valleys)",
                "image_url": "/images/places/munnar/pothamedu-viewpoint.webp",
                "visual_description": "A serene elevated viewpoint offering wide vistas of tea, coffee, and cardamom plantations and the winding Muthirapuzha river.",
                "category": "Hidden Gems",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "pothamedu-viewpoint",
                        "pothamedu-viewpoint-sunset-over-tea-valleys",
                        "sunset-over-tea-valleys"
                ]
        },
        "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry": {
                "place_name": "Rapsy Restaurant (Kerala Parotta & Beef Fry)",
                "image_url": "/images/places/munnar/rapsy-restaurant.webp",
                "visual_description": "Famous town center eatery serving hot layered Malabar parottas, spicy pepper beef roast, chicken biryani, and Spanish omelettes.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "beef-fry",
                        "kerala-parotta",
                        "rapsy-restaurant",
                        "rapsy-restaurant-kerala-parotta-and-beef-fry"
                ]
        },
        "munnar:kundala-lake-and-shikara-boating": {
                "place_name": "Kundala Lake & Shikara Boating",
                "image_url": "/images/places/munnar/kundala-lake-dam.webp",
                "visual_description": "Asia's first arch dam creating a scenic reservoir fringed by cherry blossom trees, where Kashmiri-style shikara boats glide on still waters.",
                "category": "Nature & Trails",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kundala-lake",
                        "kundala-lake-and-shikara-boating",
                        "kundala-lake-dam",
                        "shikara-boating"
                ]
        },
        "munnar:kolukkumalai-tea-estate-worlds-highest": {
                "place_name": "Kolukkumalai Tea Estate (World's Highest)",
                "image_url": "/images/places/munnar/kolukkumalai-tea.webp",
                "visual_description": "Perched at an altitude of 7,900 ft (2,400m), Kolukkumalai is the highest organic orthodox tea plantation in the world, reached via a thrilling 4x4 ...",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kolukkumalai-tea",
                        "kolukkumalai-tea-estate",
                        "kolukkumalai-tea-estate-worlds-highest",
                        "worlds-highest"
                ]
        },
        "munnar:lockhart-gap-and-bison-valley-viewpoint": {
                "place_name": "Lockhart Gap & Bison Valley Viewpoint",
                "image_url": "/images/places/munnar/lockhart-gap.webp",
                "visual_description": "A natural heart-shaped gap between two mist-shrouded mountain ridges offering sweeping aerial views of lush green tea slopes and the fertile Bison ...",
                "category": "Nature & Trails",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bison-valley-viewpoint",
                        "lockhart-gap",
                        "lockhart-gap-and-bison-valley-viewpoint"
                ]
        },
        "munnar:anamudi-peak-base-and-shola-forest-edge": {
                "place_name": "Anamudi Peak Base & Shola Forest Edge",
                "image_url": "/images/places/munnar/anamudi-peak-base.webp",
                "visual_description": "Rising to 2,695m (8,842 ft), Anamudi is the highest peak in South India and the Western Ghats, resembling an elephant's forehead amidst montane sho...",
                "category": "Nature & Trails",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "anamudi-peak-base",
                        "anamudi-peak-base-and-shola-forest-edge",
                        "shola-forest-edge"
                ]
        },
        "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens": {
                "place_name": "Marayoor Sandalwood Forest & Megalithic Dolmens",
                "image_url": "/images/places/munnar/marayoor-sandalwood-forest.webp",
                "visual_description": "The only natural sandalwood forest in Kerala, surrounded by ancient Neolithic burial dolmens (Muniyaras) dating back thousands of years and traditi...",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "marayoor-sandalwood-forest",
                        "marayoor-sandalwood-forest-and-megalithic-dolmens",
                        "megalithic-dolmens"
                ]
        },
        "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail": {
                "place_name": "Chinnar Wildlife Sanctuary & Thorny Scrub Trail",
                "image_url": "/images/places/munnar/chinnar-wildlife-sanctuary.webp",
                "visual_description": "A rain-shadow wildlife sanctuary in the Western Ghats known for the endangered Grizzled Giant Squirrel, wild elephants, Indian star tortoises, and ...",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chinnar-wildlife-sanctuary",
                        "chinnar-wildlife-sanctuary-and-thorny-scrub-trail",
                        "thorny-scrub-trail"
                ]
        },
        "munnar:lakkom-cascading-waterfalls": {
                "place_name": "Lakkom Cascading Waterfalls",
                "image_url": "/images/places/munnar/lakkom-waterfalls.webp",
                "visual_description": "Originating from the Eravikulam plateau, this crystal-clear stream tumbles down granite boulders into a serene emerald pool framed by dense bamboo ...",
                "category": "Nature & Trails",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "lakkom-cascading-waterfalls",
                        "lakkom-waterfalls"
                ]
        },
        "munnar:saravana-bhavan-munnar-town": {
                "place_name": "Saravana Bhavan Munnar Town",
                "image_url": "/images/places/munnar/saravana-bhavan-munnar.webp",
                "visual_description": "The bustling morning hub of Munnar town serving crispy golden ghee roast dosas, fluffy idlis, piping hot sambar, and authentic South Indian filter ...",
                "category": "Local Food",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "saravana-bhavan",
                        "saravana-bhavan-munnar",
                        "saravana-bhavan-munnar-town"
                ]
        },
        "munnar:eastend-chai-bazaar-and-plantation-tasting": {
                "place_name": "Eastend Chai Bazaar & Plantation Tasting",
                "image_url": "/images/places/munnar/eastend-chai-bazaar.webp",
                "visual_description": "An artisanal tea tasting lounge showcasing single-estate orthodox teas, green tea infusions, fresh cardamom cookies, and banana fritters.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "eastend-chai-bazaar",
                        "eastend-chai-bazaar-and-plantation-tasting",
                        "plantation-tasting"
                ]
        },
        "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba": {
                "place_name": "Amrik Sukhdev (Legendary 24/7 Paratha Dhaba)",
                "image_url": "/images/places/murthal/amrik-sukhdev-dhaba.webp",
                "visual_description": "The undisputed capital of highway gastronomy since 1956, famous for hot tandoori Aloo-Pyaaz and Gobhi parathas loaded with pure white butter.",
                "category": "Must Visit",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "7-paratha-dhaba",
                        "amrik-sukhdev",
                        "amrik-sukhdev-dhaba",
                        "amrik-sukhdev-legendary-24-7-paratha-dhaba",
                        "legendary-24"
                ]
        },
        "murthal:haveli-murthal-punjabi-cultural-theme-village": {
                "place_name": "Haveli Murthal (Punjabi Cultural Theme Village)",
                "image_url": "/images/places/murthal/haveli-murthal-punjabi.webp",
                "visual_description": "A grand Punjabi heritage palace on GT Road featuring traditional village courtyards, folk dancers, camel rides, and authentic clay oven feasts.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "haveli-murthal",
                        "haveli-murthal-punjabi",
                        "haveli-murthal-punjabi-cultural-theme-village",
                        "haveli-punjabi",
                        "punjabi-cultural-theme-village"
                ]
        },
        "murthal:gulshan-dhaba-traditional-tandoori-kitchen": {
                "place_name": "Gulshan Dhaba Traditional Tandoori Kitchen",
                "image_url": "/images/places/murthal/gulshan-dhaba-traditional.webp",
                "visual_description": "Historic 1950s open highway kitchen serving authentic rustic spiced parathas, Chana Masala, Kadai Paneer, and thick sweet Lassi.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "gulshan-dhaba-traditional",
                        "gulshan-dhaba-traditional-tandoori-kitchen"
                ]
        },
        "murthal:pahalwan-dhaba-pure-desi-ghee-roasters": {
                "place_name": "Pahalwan Dhaba Pure Desi Ghee Roasters",
                "image_url": "/images/places/murthal/pahalwan-dhaba-murthal.webp",
                "visual_description": "Traditional wrestler-style dhaba renowned for pure desi ghee parathas, slow-cooked Dal Tadka, and hot Kadhai Doodh with thick malai.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "pahalwan-dhaba",
                        "pahalwan-dhaba-murthal",
                        "pahalwan-dhaba-pure-desi-ghee-roasters"
                ]
        },
        "murthal:mojoland-multi-theme-adventure-park": {
                "place_name": "Mojoland Multi-Theme Adventure Park",
                "image_url": "/images/places/murthal/mojoland-adventure-park.webp",
                "visual_description": "Expansive multi-theme amusement park on NH-44 featuring high-rope courses, bungee jumping, water park slides, and ATV off-roading.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mojoland-adventure-park",
                        "mojoland-multi-theme-adventure-park"
                ]
        },
        "murthal:mannat-haveli-grand-highway-palace": {
                "place_name": "Mannat Haveli Grand Highway Palace",
                "image_url": "/images/places/murthal/mannat-haveli-murthal.webp",
                "visual_description": "Palatial Rajasthani-Punjabi architectural stop on GT Road featuring carved stone archways, elephant fountains, and luxury dining halls.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mannat-haveli",
                        "mannat-haveli-grand-highway-palace",
                        "mannat-haveli-murthal"
                ]
        },
        "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture": {
                "place_name": "Tomb of Khwaja Khizr (1522 Pathan Architecture)",
                "image_url": "/images/places/murthal/khwaja-khizr-tomb.webp",
                "visual_description": "A magnificent 16th-century red sandstone and kankar tomb built during Ibrahim Lodi's reign, surrounded by quiet heritage gardens in Sonipat.",
                "category": "Hidden Gems",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1522-pathan-architecture",
                        "khwaja-khizr-tomb",
                        "tomb-of-khwaja-khizr",
                        "tomb-of-khwaja-khizr-1522-pathan-architecture"
                ]
        },
        "murthal:dhingra-sweets-and-pure-milk-kadhai": {
                "place_name": "Dhingra Sweets & Pure Milk Kadhai",
                "image_url": "/images/places/murthal/dhingra-sweets-milk-bar.webp",
                "visual_description": "Famed dairy stop serving thick saffron rabri, hot jalebis fried in pure ghee, sweet lassi, and traditional pinni sweets.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dhingra-sweets",
                        "dhingra-sweets-and-pure-milk-kadhai",
                        "dhingra-sweets-milk-bar",
                        "pure-milk-kadhai"
                ]
        },
        "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor": {
                "place_name": "Shiva Tourist Dhaba (Pure Desi Ghee Tandoor)",
                "image_url": "/images/places/murthal/shiva-dhaba-pure-desi-ghee.webp",
                "visual_description": "A favourite local highway stop operating traditional earthen ovens that use 100% pure desi ghee for their crispy stuffed gobi and paneer parathas.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "pure-desi-ghee-tandoor",
                        "shiva-dhaba-pure-desi-ghee",
                        "shiva-tourist-dhaba",
                        "shiva-tourist-dhaba-pure-desi-ghee-tandoor"
                ]
        },
        "murthal:chokhi-dhani-sonepat-heritage-cultural-fair": {
                "place_name": "Chokhi Dhani Sonepat Heritage Cultural Fair",
                "image_url": "/images/places/murthal/chokhi-dhani-sonipat-village.webp",
                "visual_description": "An evening cultural destination showcasing Rajasthani folk dance, puppet shows, camel rides, pottery wheels, and authentic chaupal dining.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chokhi-dhani-sonepat-heritage-cultural-fair",
                        "chokhi-dhani-sonipat-village"
                ]
        },
        "murthal:badkhalsa-memorial-and-sikh-heritage-museum": {
                "place_name": "Badkhalsa Memorial & Sikh Heritage Museum",
                "image_url": "/images/places/murthal/badkhalsa-memorial-museum.webp",
                "visual_description": "A commemorative national memorial dedicated to Bhai Kushal Singh (Bhai Jaita Ji) who carried the severed sacred head of Guru Tegh Bahadur from Delhi.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "badkhalsa-memorial",
                        "badkhalsa-memorial-and-sikh-heritage-museum",
                        "badkhalsa-memorial-museum",
                        "sikh-heritage-museum"
                ]
        },
        "murthal:haryana-tourism-ethnic-craft-village-and-loom": {
                "place_name": "Haryana Tourism Ethnic Craft Village & Loom",
                "image_url": "/images/places/murthal/haryana-tourism-ethnic-hub.webp",
                "visual_description": "A state craft emporium showcasing traditional Haryanvi durrie weaving, terracotta pottery wheels, folk wooden toys, and brass artefacts.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "haryana-tourism-ethnic-craft-village",
                        "haryana-tourism-ethnic-craft-village-and-loom",
                        "haryana-tourism-ethnic-hub",
                        "loom"
                ]
        },
        "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields": {
                "place_name": "Murthal Rural Canal Lanes & Yellow Mustard Fields",
                "image_url": "/images/places/murthal/hero.webp",
                "visual_description": "Rustic farm lanes branching off the highway along irrigation canals, lined with eucalyptus trees and endless blooming yellow mustard fields in winter.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "murthal-rural-canal-lanes",
                        "murthal-rural-canal-lanes-and-yellow-mustard-fields",
                        "yellow-mustard-fields"
                ]
        },
        "murthal:farm-fresh-kadhai-milk-and-rabri-counter": {
                "place_name": "Farm Fresh Kadhai Milk & Rabri Counter",
                "image_url": "/images/places/murthal/sukhdev-farm-fresh-milk-counter.webp",
                "visual_description": "Giant wide iron cauldrons continuously simmering saffron-spiced milk with almonds and pistachios, served boiling hot in earthenware kulhads.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "farm-fresh-kadhai-milk",
                        "farm-fresh-kadhai-milk-and-rabri-counter",
                        "rabri-counter",
                        "sukhdev-farm-fresh-milk-counter"
                ]
        },
        "murthal:sonipat-yamuna-riverfront-sand-banks": {
                "place_name": "Sonipat Yamuna Riverfront Sand Banks",
                "image_url": "/images/places/murthal/yamuna-river-ghats-sonipat.webp",
                "visual_description": "A wide expanse of quiet sandy riverbeds 12 km east of Murthal where local wooden boats operate and watermelon farmers tend seasonal fields.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sonipat-yamuna-riverfront-sand-banks",
                        "yamuna-river-ghats-sonipat"
                ]
        },
        "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo": {
                "place_name": "Pahalwan Khasta Dal Kachori & Heeng Aloo",
                "image_url": "/images/places/murthal/pehalwan-kachori-subzi-corner.webp",
                "visual_description": "Flaky, deep-fried urad dal kachoris crushed into bowls of hot, spicy asafoetida potato curry with sweet tamarind and green coriander chutneys.",
                "category": "Local Food & Street Eats",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "heeng-aloo",
                        "pahalwan-khasta-dal-kachori",
                        "pahalwan-khasta-dal-kachori-and-heeng-aloo",
                        "pehalwan-kachori-subzi-corner"
                ]
        },
        "mussoorie:sir-george-everest-peak-and-heritage-house": {
                "place_name": "Sir George Everest Peak & Heritage House",
                "image_url": "/images/places/mussoorie/george-everest-peak.webp",
                "visual_description": "The 1832 estate and laboratory of Surveyor-General Sir George Everest, offering a scenic ridge hike with views of Aglar Valley and Doon Plains.",
                "category": "Nature & Trails",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "george-everest-peak",
                        "heritage-house",
                        "sir-george-everest-peak",
                        "sir-george-everest-peak-and-heritage-house"
                ]
        },
        "mussoorie:clouds-end-heritage-forest-sanctuary": {
                "place_name": "Cloud's End Heritage Forest Sanctuary",
                "image_url": "/images/places/mussoorie/clouds-end-forest.webp",
                "visual_description": "The western boundary of Mussoorie surrounded by dense virgin oak and deodar forests, marking the entrance to the Benog Wildlife Sanctuary.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "clouds-end-forest",
                        "clouds-end-heritage-forest-sanctuary"
                ]
        },
        "mussoorie:gun-hill-historical-viewpoint-and-cable-car": {
                "place_name": "Gun Hill Historical Viewpoint & Cable Car",
                "image_url": "/images/places/mussoorie/gun-hill-ropeway.webp",
                "visual_description": "Mussoorie's second-highest peak (2,024m) where a mid-day cannon was fired during colonial times, accessible by a 400m aerial ropeway.",
                "category": "Culture & Heritage",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "cable-car",
                        "gun-hill-historical-viewpoint",
                        "gun-hill-historical-viewpoint-and-cable-car",
                        "gun-hill-ropeway"
                ]
        },
        "mussoorie:kempty-falls-mountain-cascades": {
                "place_name": "Kempty Falls Mountain Cascades",
                "image_url": "/images/places/mussoorie/kempty-falls-cascades.webp",
                "visual_description": "Gigantic mountain waterfall cascading down 40 feet into natural rock plunge pools in a steep mountain valley.",
                "category": "Nature & Trails",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kempty-falls-cascades",
                        "kempty-falls-mountain-cascades"
                ]
        },
        "mussoorie:char-dukan-heritage-cafe-lane-landour": {
                "place_name": "Char Dukan Heritage Cafe Lane (Landour)",
                "image_url": "/images/places/mussoorie/char-dukan-prakash-store.webp",
                "visual_description": "A historic cluster of four quaint wooden shops in Landour operating since colonial times, famous for ginger lemon honey tea, cheese omelettes, and ...",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "char-dukan-heritage-cafe-lane",
                        "char-dukan-heritage-cafe-lane-landour",
                        "char-dukan-prakash-store",
                        "landour"
                ]
        },
        "mussoorie:pari-tibba-witches-hill-pine-ridge-trail": {
                "place_name": "Pari Tibba (Witches' Hill) Pine Ridge Trail",
                "image_url": "/images/places/mussoorie/pari-tibba-fairies-hill.webp",
                "visual_description": "An enchanting, secluded pine-and-oak hill trail made famous in Ruskin Bond's ghost stories, prone to lightning strikes and rich in rare Himalayan b...",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "pari-tibba",
                        "pari-tibba-fairies-hill",
                        "pari-tibba-witches-hill-pine-ridge-trail",
                        "pine-ridge-trail",
                        "witches-hill"
                ]
        },
        "mussoorie:rokeby-manor-and-emilys-tea-room": {
                "place_name": "Rokeby Manor & Emily's Tea Room",
                "image_url": "/images/places/mussoorie/rokeby-manor.webp",
                "visual_description": "An 1840 stone manor with wooden beams, rustic stone fireplaces, and an elegant dining room serving colonial stews, mustard chicken, and herbal teas.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "emilys-tea-room",
                        "rokeby-manor",
                        "rokeby-manor-and-emilys-tea-room"
                ]
        },
        "mussoorie:prakash-store-and-handmade-cheese-deli-1928": {
                "place_name": "Prakash Store & Handmade Cheese Deli (1928)",
                "image_url": "/images/places/mussoorie/prakash-store.webp",
                "visual_description": "A legendary family-run store operating since 1928, famous for authentic homemade peanut butter, cheddar cheese, gooseberry jams, and apricot preser...",
                "category": "Markets & Craft",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1928",
                        "handmade-cheese-deli",
                        "prakash-store",
                        "prakash-store-and-handmade-cheese-deli-1928"
                ]
        },
        "mussoorie:company-garden-and-artificial-falls": {
                "place_name": "Company Garden & Artificial Falls",
                "image_url": "/images/places/mussoorie/company-garden.webp",
                "visual_description": "A historic municipal botanical garden laid out in the 19th century with vibrant dahlias, an amusement lake, and a cascading artificial rock waterfall.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "artificial-falls",
                        "company-garden",
                        "company-garden-and-artificial-falls"
                ]
        },
        "neemrana:neemrana-fort-palace-15th-century-ramparts": {
                "place_name": "Neemrana Fort-Palace 15th-Century Ramparts",
                "image_url": "/images/places/neemrana/neemrana-fort-palace.webp",
                "visual_description": "14-tiered medieval fort-palace built into the Aravalli hills in 1464, featuring stepped courtyards, hanging gardens, and grand ramparts.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "fort-palace",
                        "neemrana-fort-palace",
                        "neemrana-fort-palace-15th-century-ramparts"
                ]
        },
        "neemrana:flying-fox-aerial-zipline-tour": {
                "place_name": "Flying Fox Aerial Zipline Tour",
                "image_url": "/images/places/neemrana/flying-fox-zipline.webp",
                "visual_description": "India's premier 5-stage aerial zipline tour soaring up to 400m across the dramatic rocky gorges and ramparts of Neemrana Fort.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "flying-fox-aerial-zipline-tour",
                        "flying-fox-zipline"
                ]
        },
        "neemrana:ancient-9-story-stepwell-neemrana-baori": {
                "place_name": "Ancient 9-Story Stepwell (Neemrana Baori)",
                "image_url": "/images/places/neemrana/neemrana-stepwell-baori.webp",
                "visual_description": "Massive 18th-century 9-tiered subterranean stepwell with 170 stone steps leading down to water, built for desert travelers and royal horses.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ancient-9-story-stepwell",
                        "ancient-9-story-stepwell-neemrana-baori",
                        "neemrana-baori",
                        "neemrana-stepwell-baori",
                        "stepwell-baori"
                ]
        },
        "neemrana:kesroli-14th-century-hill-fort-en-route": {
                "place_name": "Kesroli 14th-Century Hill Fort En-Route",
                "image_url": "/images/places/neemrana/kesroli-hill-fort.webp",
                "visual_description": "Rare 700-year-old fort perched on a lone dark volcanic rock surrounded by yellow mustard fields and tranquil Mewat rural landscapes.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kesroli-14th-century-hill-fort-en-route",
                        "kesroli-hill-fort"
                ]
        },
        "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub": {
                "place_name": "Neemrana Japanese Industrial Zone & Ramen Hub",
                "image_url": "/images/places/neemrana/japanese-zone-cuisine.webp",
                "visual_description": "Unique international pocket housing Japanese hospitality and authentic dining spots serving handmade ramen, sushi, and matcha tea.",
                "category": "Local Food",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "japanese-zone-cuisine",
                        "neemrana-japanese-industrial-zone",
                        "neemrana-japanese-industrial-zone-and-ramen-hub",
                        "ramen-hub"
                ]
        },
        "neemrana:highway-king-nh-48-express-dhaba": {
                "place_name": "Highway King NH-48 Express Dhaba",
                "image_url": "/images/places/neemrana/highway-king-dhaba.webp",
                "visual_description": "The quintessential highway stop on NH-48 serving tandoori parathas, creamy Dal Makhani, paneer tikka, and masala chai in earthen pots.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "highway-king-dhaba",
                        "highway-king-nh-48-express-dhaba"
                ]
        },
        "neemrana:baba-khetanath-hilltop-ashram-and-ridge": {
                "place_name": "Baba Khetanath Hilltop Ashram & Ridge",
                "image_url": "/images/places/neemrana/baba-khetanath-ashram.webp",
                "visual_description": "Peaceful hilltop spiritual hermitage atop an Aravalli peak offering panoramic views of the Rajasthan plains and serene meditation walks.",
                "category": "Nature & Trails",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "baba-khetanath-ashram",
                        "baba-khetanath-hilltop-ashram",
                        "baba-khetanath-hilltop-ashram-and-ridge"
                ]
        },
        "neemrana:siliserh-lake-gateway-en-route": {
                "place_name": "Siliserh Lake Gateway En-Route",
                "image_url": "/images/places/neemrana/siliserh-en-route-neemrana.webp",
                "visual_description": "Royal 1845 reservoir stop en-route to Alwar with boating, crocodile sightings, and historic heritage palace terraces.",
                "category": "Nature & Trails",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "siliserh-en-route",
                        "siliserh-en-route-neemrana",
                        "siliserh-lake-gateway-en-route"
                ]
        },
        "neemrana:tijara-fort-palace-19th-century-hilltop-citadel": {
                "place_name": "Tijara Fort-Palace (19th Century Hilltop Citadel)",
                "image_url": "/images/places/neemrana/tijara-fort-palace-heritage.webp",
                "visual_description": "A dramatic 19th-century Rajput palace fortress perched atop an Aravalli crest with sunken sunken amphitheatre gardens and royal pavilions.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "19th-century-hilltop-citadel",
                        "tijara-fort-palace",
                        "tijara-fort-palace-19th-century-hilltop-citadel",
                        "tijara-fort-palace-heritage"
                ]
        },
        "neemrana:aravalli-quartzite-canyon-and-scrub-trail": {
                "place_name": "Aravalli Quartzite Canyon & Scrub Trail",
                "image_url": "/images/places/neemrana/aravalli-hidden-gorge-trek.webp",
                "visual_description": "A rugged dry-canyon hike behind Neemrana village winding through red quartzite boulders and thorny dhau trees inhabited by peacocks and neelgai.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "aravalli-hidden-gorge-trek",
                        "aravalli-quartzite-canyon",
                        "aravalli-quartzite-canyon-and-scrub-trail",
                        "scrub-trail"
                ]
        },
        "neemrana:mothooka-ancient-copper-archaeology-site": {
                "place_name": "Mothooka Ancient Copper Archaeology Site",
                "image_url": "/images/places/neemrana/mothooka-ancient-copper-mines.webp",
                "visual_description": "An ancient proto-historic copper smelting and mining archaeological site dating back to the Ganeshwar-Jodhpura cultural complex.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mothooka-ancient-copper-archaeology-site",
                        "mothooka-ancient-copper-mines"
                ]
        },
        "neemrana:kotputli-traditional-terracotta-pottery-street": {
                "place_name": "Kotputli Traditional Terracotta Pottery Street",
                "image_url": "/images/places/neemrana/kotputli-earthen-pottery-lane.webp",
                "visual_description": "A lively artisan hamlet on the highway where hundreds of traditional potter families craft unglazed terracotta urns, planters, and wind chimes.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kotputli-earthen-pottery-lane",
                        "kotputli-traditional-terracotta-pottery-street"
                ]
        },
        "neemrana:nazara-open-air-medieval-amphitheatre": {
                "place_name": "Nazara Open-Air Medieval Amphitheatre",
                "image_url": "/images/places/neemrana/neemrana-rooftop-amphitheatre.webp",
                "visual_description": "A tiered stone open-air theatre carved into the upper fortress battlements hosting evening Rajasthani Kalbelia dances and folk sufi music.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "nazara-open-air-medieval-amphitheatre",
                        "neemrana-rooftop-amphitheatre",
                        "rooftop-amphitheatre"
                ]
        },
        "neemrana:shyam-sarovar-subterranean-baori-oasis": {
                "place_name": "Shyam Sarovar Subterranean Baori Oasis",
                "image_url": "/images/places/neemrana/shyam-sarovar-kund.webp",
                "visual_description": "A historic water stepwell and shaded stone colonnade near the village bazaar built to catch monsoon runoff from the surrounding rocky ridges.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shyam-sarovar-kund",
                        "shyam-sarovar-subterranean-baori-oasis"
                ]
        },
        "neemrana:karni-mata-hilltop-staircase-shrine": {
                "place_name": "Karni Mata Hilltop Staircase Shrine",
                "image_url": "/images/places/neemrana/karni-mata-shrine-neemrana.webp",
                "visual_description": "A revered shrine perched on a rocky crag reached by 250 white stone steps, commanding 360-degree vistas of the Neemrana valley and highway corridor.",
                "category": "Culture & Heritage",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "karni-mata-hilltop-staircase-shrine",
                        "karni-mata-shrine",
                        "karni-mata-shrine-neemrana"
                ]
        },
        "neemrana:old-alwar-byroad-blooming-mustard-lane": {
                "place_name": "Old Alwar Byroad Blooming Mustard Lane",
                "image_url": "/images/places/neemrana/old-alwar-road-sarson-fields.webp",
                "visual_description": "A quiet country road winding between ancient Aravalli hillocks through blooming yellow mustard fields and traditional camel cart trails.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "old-alwar-byroad-blooming-mustard-lane",
                        "old-alwar-road-sarson-fields"
                ]
        },
        "rishikesh:parmarth-niketan-ganga-aarti": {
                "place_name": "Parmarth Niketan Ganga Aarti",
                "image_url": "/images/places/rishikesh/parmarth-niketan-aarti.webp",
                "visual_description": "The world-famous evening fire ceremony on the sacred banks of the Ganges at sunset, featuring soulful Vedic kirtans and floating lamps.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "parmarth-aarti",
                        "parmarth-niketan",
                        "parmarth-niketan-aarti",
                        "parmarth-niketan-ganga-aarti"
                ]
        },
        "rishikesh:beatles-ashram-chaurasi-kutia": {
                "place_name": "Beatles Ashram (Chaurasi Kutia)",
                "image_url": "/images/places/rishikesh/beatles-ashram.webp",
                "visual_description": "The historic 1968 Maharishi Mahesh Yogi ashram inside Rajaji Tiger Reserve, covered in graffiti murals, meditation domes, and banyan trees.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "beatles-ashram",
                        "beatles-ashram-chaurasi-kutia",
                        "chaurasi-kutia",
                        "the-beatles-ashram"
                ]
        },
        "rishikesh:neer-garh-cascading-waterfall": {
                "place_name": "Neer Garh Cascading Waterfall",
                "image_url": "/images/places/rishikesh/neer-garh-waterfall.webp",
                "visual_description": "A crystal-clear natural limestone waterfall cascading into turquoise plunge pools reachable via a 1.5 km scenic jungle trail.",
                "category": "Nature & Trails",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "neer-garh",
                        "neer-garh-cascading-waterfall",
                        "neer-garh-waterfall",
                        "neer-waterfall"
                ]
        },
        "rishikesh:shivpuri-white-water-river-rafting": {
                "place_name": "Shivpuri White Water River Rafting",
                "image_url": "/images/places/rishikesh/shivpuri-river-rafting.webp",
                "visual_description": "Grade III and IV white water river rafting starting from Shivpuri down to Nim Beach through Roller Coaster and Golf Course rapids.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shivpuri-rafting",
                        "shivpuri-river-rafting",
                        "shivpuri-white-water-river-rafting"
                ]
        },
        "rishikesh:triveni-ghat-evening-maha-aarti": {
                "place_name": "Triveni Ghat Evening Maha Aarti",
                "image_url": "/images/places/rishikesh/triveni-ghat-aarti.webp",
                "visual_description": "Sacred confluence of three holy rivers featuring massive brass lamp ceremonies, conch shells, and floating leaf diyas.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "triveni-ghat",
                        "triveni-ghat-aarti",
                        "triveni-ghat-evening-maha-aarti"
                ]
        },
        "rishikesh:vashistha-cave-gufa": {
                "place_name": "Vashistha Cave (Gufa)",
                "image_url": "/images/places/rishikesh/vashistha-cave.webp",
                "visual_description": "An ancient natural cave on the banks of the Ganges where Sage Vashistha meditated, renowned for deep meditative silence.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "gufa",
                        "vashistha-cave",
                        "vashistha-cave-gufa",
                        "vashistha-gufa"
                ]
        },
        "rishikesh:devraj-coffee-and-german-bakery": {
                "place_name": "Devraj Coffee & German Bakery",
                "image_url": "/images/places/rishikesh/german-bakery-tapovan.webp",
                "visual_description": "Classic hillside bakery at Lakshman Jhula serving fresh apple strudel, yak cheese sandwiches, and organic espresso.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "devraj-coffee",
                        "devraj-coffee-and-german-bakery",
                        "devraj-coffee-german-bakery",
                        "german-bakery",
                        "german-bakery-tapovan"
                ]
        },
        "rishikesh:ram-jhula-suspension-bridge-promenade": {
                "place_name": "Ram Jhula Suspension Bridge Promenade",
                "image_url": "/images/places/rishikesh/ram-jhula-promenade.webp",
                "visual_description": "Historic 230m iron suspension bridge linking Shivananda Ashram to Swarg Ashram across the turquoise waters of the Ganga.",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ram-jhula",
                        "ram-jhula-promenade",
                        "ram-jhula-suspension-bridge-promenade"
                ]
        },
        "rishikesh:swarg-ashram-and-sacred-kutiyas": {
                "place_name": "Swarg Ashram & Sacred Kutiyas",
                "image_url": "/images/places/rishikesh/swarg-ashram.webp",
                "visual_description": "Historic spiritual enclave on the eastern bank of the Ganga, established by Swami Vishudhanand, renowned for tranquil meditation kutiyas and evenin...",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sacred-kutiyas",
                        "swarg-ashram",
                        "swarg-ashram-and-sacred-kutiyas"
                ]
        },
        "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m": {
                "place_name": "Kunjapuri Devi Sunrise Temple Ridge (1,645m)",
                "image_url": "/images/places/rishikesh/triveni-ghat.webp",
                "visual_description": "Perched on a high Himalayan foothill crest, this sacred Shaktipeeth offers a 360-degree sunrise spectacle of Chaukhamba, Swargarohini, and Bandarpo...",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "645m",
                        "kunjapuri-devi-sunrise-temple-ridge",
                        "kunjapuri-devi-sunrise-temple-ridge-1-645m",
                        "triveni-ghat"
                ]
        },
        "rishikesh:kaudiyala-white-sand-river-bank": {
                "place_name": "Kaudiyala White Sand River Bank",
                "image_url": "/images/places/rishikesh/kaudiyala-white-sands.webp",
                "visual_description": "Pristine white sand beach corridor along the jade-green waters of the upper Ganga, flanked by steep Himalayan ridges.of the Ganga, where Sage Vashi...",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kaudiyala-white-sand-river-bank",
                        "kaudiyala-white-sands"
                ]
        },
        "rishikesh:patna-cascading-waterfall-and-limestone-caves": {
                "place_name": "Patna Cascading Waterfall & Limestone Caves",
                "image_url": "/images/places/rishikesh/patna-waterfall.webp",
                "visual_description": "A secluded limestone waterfall hidden inside deep Rajaji foothill forest, featuring natural calcified dripstone caves behind the cascading curtains...",
                "category": "Nature & Trails",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "limestone-caves",
                        "patna-cascading-waterfall",
                        "patna-cascading-waterfall-and-limestone-caves",
                        "patna-waterfall"
                ]
        },
        "rishikesh:little-buddha-cafe-treehouse-lounge": {
                "place_name": "Little Buddha Cafe Treehouse Lounge",
                "image_url": "/images/places/rishikesh/little-buddha-cafe.webp",
                "visual_description": "A treehouse-style bamboo cafe overlooking the turquoise waters of the Ganga, famous for Israeli shakshuka, fresh fruit lassis, momos, and acoustic ...",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "little-buddha-cafe",
                        "little-buddha-cafe-treehouse-lounge"
                ]
        },
        "rishikesh:the-sitting-elephant-rooftop-dining": {
                "place_name": "The Sitting Elephant Rooftop Dining",
                "image_url": "/images/places/rishikesh/sitting-elephant-restaurant.webp",
                "visual_description": "Panoramic rooftop restaurant overlooking the river bend at Swarg Ashram, serving regional Indian delicacies.freshly baked apple strudel, yak cheese...",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sitting-elephant-restaurant",
                        "the-sitting-elephant-rooftop-dining"
                ]
        },
        "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m": {
                "place_name": "Kunjapuri Devi Sunrise Temple Crest (1,665m)",
                "image_url": "/images/places/rishikesh/kunjapuri-devi-sunrise-crest.webp",
                "visual_description": "A sacred Shakti Peeth temple perched atop a mountain ridge 25 km north of Rishikesh offering sunrise panoramas of Bandarpoonch, Swargarohini, and C...",
                "category": "Nature & Viewpoints",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "665m",
                        "kunjapuri-devi-sunrise-crest",
                        "kunjapuri-devi-sunrise-temple-crest",
                        "kunjapuri-devi-sunrise-temple-crest-1-665m"
                ]
        },
        "rishikesh:rajaji-national-park-chilla-elephant-safari-gate": {
                "place_name": "Rajaji National Park (Chilla Elephant Safari Gate)",
                "image_url": "/images/places/rishikesh/rajaji-national-park-chilla.webp",
                "visual_description": "An 820 sq km tiger and elephant reserve spanning the Shivalik foothills on the southern banks of the Ganga, famous for wild elephant herds and leop...",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chilla-elephant-safari-gate",
                        "rajaji-national-park",
                        "rajaji-national-park-chilla",
                        "rajaji-national-park-chilla-elephant-safari-gate"
                ]
        },
        "sariska-bhangarh:sariska-tiger-reserve-jungle-safari": {
                "place_name": "Sariska Tiger Reserve Jungle Safari",
                "image_url": "/images/places/sariska-bhangarh/sariska-tiger-reserve.webp",
                "visual_description": "An 881 sq km wildlife sanctuary in the Aravallis home to Royal Bengal tigers, leopards, sambar deer, striped hyenas, and rich birdlife.",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sariska-tiger-reserve",
                        "sariska-tiger-reserve-jungle-safari"
                ]
        },
        "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins": {
                "place_name": "Bhangarh Fort (Legendary Medieval Ruins)",
                "image_url": "/images/places/sariska-bhangarh/bhangarh-fort-ruins.webp",
                "visual_description": "17th-century fortified township surrounded by Aravalli hills, featuring preserved royal palaces, bazaar streets, and ancient stone temples.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhangarh-fort",
                        "bhangarh-fort-legendary-medieval-ruins",
                        "bhangarh-fort-ruins",
                        "legendary-medieval-ruins"
                ]
        },
        "sariska-bhangarh:kankwari-fort-hilltop-fortress": {
                "place_name": "Kankwari Fort Hilltop Fortress",
                "image_url": "/images/places/sariska-bhangarh/kankwari-fort.webp",
                "visual_description": "Remote 17th-century fort deep inside the Sariska tiger jungle where Mughal Emperor Aurangzeb imprisoned his elder brother Dara Shikoh.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kankwari-fort",
                        "kankwari-fort-hilltop-fortress"
                ]
        },
        "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm": {
                "place_name": "Pandupol Hanuman Temple & Natural Water Chasm",
                "image_url": "/images/places/sariska-bhangarh/pandupol-hanuman-temple.webp",
                "visual_description": "Sacred shrine inside the sanctuary where strongman Bhima is believed to have cracked open the mountain with his mace to create a pathway.",
                "category": "Nature & Trails",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "natural-water-chasm",
                        "pandupol-hanuman-temple",
                        "pandupol-hanuman-temple-and-natural-water-chasm"
                ]
        },
        "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century": {
                "place_name": "Neelkanth Ancient Temple Complex (6th-Century)",
                "image_url": "/images/places/sariska-bhangarh/neelkanth-temple-sariska.webp",
                "visual_description": "Ruined 6th-to-10th-century stone temple complex deep in the hills featuring detailed erotic and divine carvings resembling Khajuraho.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "6th-century",
                        "neelkanth-ancient-temple-complex",
                        "neelkanth-ancient-temple-complex-6th-century",
                        "neelkanth-temple-sariska"
                ]
        },
        "sariska-bhangarh:bhartrihari-temple-and-sacred-kund": {
                "place_name": "Bhartrihari Temple & Sacred Kund",
                "image_url": "/images/places/sariska-bhangarh/bhartrihari-temple-kund.webp",
                "visual_description": "Ancient pilgrimage site where King Bhartrihari of Ujjain renounced his throne and performed deep meditation in an Aravalli valley.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhartrihari-temple",
                        "bhartrihari-temple-and-sacred-kund",
                        "bhartrihari-temple-kund",
                        "sacred-kund"
                ]
        },
        "sariska-bhangarh:the-sariska-palace-royal-french-courtyards": {
                "place_name": "The Sariska Palace Royal French Courtyards",
                "image_url": "/images/places/sariska-bhangarh/sariska-palace-courtyard.webp",
                "visual_description": "1892 hunting lodge built by Maharaja Sawai Jai Singh of Alwar, blending French and Rajput architecture with sprawling lawns and royal tea service.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sariska-palace-courtyard",
                        "the-sariska-palace-royal-french-courtyards"
                ]
        },
        "sariska-bhangarh:gola-ka-baas-traditional-rajasthani-dhaba": {
                "place_name": "Gola ka Baas Traditional Rajasthani Dhaba",
                "image_url": "/images/places/sariska-bhangarh/gola-ka-baas-dhaba.webp",
                "visual_description": "Authentic rural roadside eatery near Bhangarh serving clay oven Baati, smoked Dal, spicy Lehsun ki Chutney, and fresh buttermilk.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "gola-ka-baas-dhaba",
                        "gola-ka-baas-traditional-rajasthani-dhaba"
                ]
        },
        "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh": {
                "place_name": "Ajabgarh Fort & Reservoir (The Twin of Bhangarh)",
                "image_url": "/images/places/sariska-bhangarh/ajabgarh-fort-and-dam.webp",
                "visual_description": "Built in 1635 by Ajab Singh Rajawat, this dramatic fortified hill citadel overlooks a scenic green water dam surrounded by mythological tales.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ajabgarh-fort",
                        "ajabgarh-fort-and-dam",
                        "ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
                        "reservoir",
                        "the-twin-of-bhangarh"
                ]
        },
        "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis": {
                "place_name": "Natni Ka Bara Stone Weir & Forest Oasis",
                "image_url": "/images/places/sariska-bhangarh/natni-ka-bara-weir.webp",
                "visual_description": "A historic water weir on the Ruparel river flanked by dense jungle, attracting spotted chital, wild boars, and colourful pied kingfishers.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "forest-oasis",
                        "natni-ka-bara-stone-weir",
                        "natni-ka-bara-stone-weir-and-forest-oasis",
                        "natni-ka-bara-weir"
                ]
        },
        "sariska-bhangarh:narayani-mata-natural-spring-sanctuary": {
                "place_name": "Narayani Mata Natural Spring Sanctuary",
                "image_url": "/images/places/sariska-bhangarh/narayani-mata-sacred-spring.webp",
                "visual_description": "A sacred shrine on the edge of Sariska National Park where hot natural spring water emerges from under the temple, holy to the Sain community.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "narayani-mata-natural-spring-sanctuary",
                        "narayani-mata-sacred-spring"
                ]
        },
        "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds": {
                "place_name": "Talvriksha Arjuna Tree & Thermal Kunds",
                "image_url": "/images/places/sariska-bhangarh/talvriksha-holy-springs-sanctuary.webp",
                "visual_description": "An ancient spring hermitage where Arjuna of the Mahabharata took shelter, celebrated for twin hot and cold natural sulphur water reservoirs.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "talvriksha-arjuna-tree",
                        "talvriksha-arjuna-tree-and-thermal-kunds",
                        "talvriksha-holy-springs-sanctuary",
                        "thermal-kunds"
                ]
        },
        "sariska-bhangarh:kushalgarh-colonial-teak-forest-bungalow": {
                "place_name": "Kushalgarh Colonial Teak Forest Bungalow",
                "image_url": "/images/places/sariska-bhangarh/kushalgarh-forest-rest-house.webp",
                "visual_description": "A historic 19th-century British hunting lodge situated on the primary tiger movement corridor within Sariska, shaded by massive teak trees.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kushalgarh-colonial-teak-forest-bungalow",
                        "kushalgarh-forest-rest-house"
                ]
        },
        "sariska-bhangarh:mansa-devi-hilltop-cliff-lookout": {
                "place_name": "Mansa Devi Hilltop Cliff Lookout",
                "image_url": "/images/places/sariska-bhangarh/mansa-devi-hill-climb.webp",
                "visual_description": "A steep stone-stairway ascent up an isolated mountain spur near Sariska gate offering breathtaking views of the surrounding tiger reserve ravines.",
                "category": "Adventure & Treks",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mansa-devi-hill-climb",
                        "mansa-devi-hilltop-cliff-lookout"
                ]
        },
        "sariska-bhangarh:deoli-lake-and-tiger-watering-hole": {
                "place_name": "Deoli Lake & Tiger Watering Hole",
                "image_url": "/images/places/sariska-bhangarh/deoli-lake-waterhole.webp",
                "visual_description": "A natural waterhole in the southern reaches of Sariska that serves as the premier drinking station for Bengal tigers, leopards, and herds of sambar.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "deoli-lake",
                        "deoli-lake-and-tiger-watering-hole",
                        "deoli-lake-waterhole",
                        "tiger-watering-hole"
                ]
        },
        "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel": {
                "place_name": "Rajgarh Hill Fort (Ancient Bargujar Citadel)",
                "image_url": "/images/places/sariska-bhangarh/rajgarh-fort-palace-ruins.webp",
                "visual_description": "A crumbling 18th-century palace fortification built atop a granite crag guarding the southern mountain pass connecting Alwar to Dausa.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ancient-bargujar-citadel",
                        "rajgarh-fort-palace-ruins",
                        "rajgarh-hill-fort",
                        "rajgarh-hill-fort-ancient-bargujar-citadel"
                ]
        },
        "spiti:key-gompa-11th-century-fort-monastery": {
                "place_name": "Key Gompa (11th-Century Fort Monastery)",
                "image_url": "/images/places/spiti/key-monastery.webp",
                "visual_description": "Perched at 4,166m atop a conical hill in the Spiti Valley, Key Gompa is a fortress-like Buddhist monastery housing ancient murals and sacred texts.",
                "category": "Must Visit",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "11th-century-fort-monastery",
                        "key-gompa",
                        "key-gompa-11th-century-fort-monastery",
                        "key-monastery"
                ]
        },
        "spiti:dhankar-gompa-and-cliffside-fortress": {
                "place_name": "Dhankar Gompa & Cliffside Fortress",
                "image_url": "/images/places/spiti/dhankar-monastery.webp",
                "visual_description": "The dramatic ancient capital of Spiti, clinging precariously to a razor-sharp cliff 300m above the confluence of Spiti and Pin rivers.",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "cliffside-fortress",
                        "dhankar-gompa",
                        "dhankar-gompa-and-cliffside-fortress",
                        "dhankar-monastery"
                ]
        },
        "spiti:hikkim-worlds-highest-post-office": {
                "place_name": "Hikkim (World's Highest Post Office)",
                "image_url": "/images/places/spiti/hikkim-post-office.webp",
                "visual_description": "Located at 4,400m elevation, sending a handwritten postcard from this whitewashed stone post office is a timeless Himalayan tradition.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hikkim",
                        "hikkim-post-office",
                        "hikkim-worlds-highest-post-office",
                        "worlds-highest-post-office"
                ]
        },
        "spiti:chandratal-crescent-moon-lake": {
                "place_name": "Chandratal (Crescent Moon Lake)",
                "image_url": "/images/places/spiti/chandra-taal.webp",
                "visual_description": "A breathtaking high-altitude crescent lake at 4,300m surrounded by scree mountains, reflecting deep azure blues and dramatic cloudscapes.",
                "category": "Nature & Trails",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chandra-taal",
                        "chandratal",
                        "chandratal-crescent-moon-lake",
                        "crescent-moon-lake"
                ]
        },
        "spiti:langza-giant-buddha-and-marine-fossil-village": {
                "place_name": "Langza Giant Buddha & Marine Fossil Village",
                "image_url": "/images/places/spiti/langza-buddha.webp",
                "visual_description": "High village guarded by a giant golden Buddha statue facing Chau Chau Kang Nilda peak, famed for prehistoric ammonite sea fossils.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "langza-buddha",
                        "langza-giant-buddha",
                        "langza-giant-buddha-and-marine-fossil-village",
                        "marine-fossil-village"
                ]
        },
        "spiti:komic-worlds-highest-motor-connected-village": {
                "place_name": "Komic (World's Highest Motor-Connected Village)",
                "image_url": "/images/places/spiti/komic-village.webp",
                "visual_description": "Sitting at 4,587m, this stark village features the 14th-century Tangyud Gompa and the world's highest eco-caf\u00e9.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "komic",
                        "komic-village",
                        "komic-worlds-highest-motor-connected-village",
                        "worlds-highest-motor-connected-village"
                ]
        },
        "spiti:pin-valley-national-park-and-mudh-village": {
                "place_name": "Pin Valley National Park & Mudh Village",
                "image_url": "/images/places/spiti/pin-valley-park.webp",
                "visual_description": "Glacial mountain valley renowned for rare snow leopards, Siberian ibex, and the endpoint village of Mudh with emerald barley fields.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mudh-village",
                        "pin-valley-national-park",
                        "pin-valley-national-park-and-mudh-village",
                        "pin-valley-park"
                ]
        },
        "spiti:cafe-deyzor-and-travelers-lounge": {
                "place_name": "Caf\u00e9 Deyzor & Travelers' Lounge",
                "image_url": "/images/places/spiti/cafe-deyzor.webp",
                "visual_description": "Beloved cozy dining den in Kaza serving Spitian sea buckthorn drinks, yak cheese pastas, apple crumble, and hot momos.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "cafe-deyzor",
                        "cafe-deyzor-and-travelers-lounge",
                        "travelers-lounge"
                ]
        },
        "spiti:chicham-suspension-bridge-asias-highest": {
                "place_name": "Chicham Suspension Bridge (Asia's Highest)",
                "image_url": "/images/places/spiti/chicham-bridge.webp",
                "visual_description": "Perched at an astonishing 4,145m (13,596 ft), Chicham Bridge spans a dramatic 1,000-foot deep vertical canyon, connecting Kibber to the remote high...",
                "category": "Must Visit",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "asias-highest",
                        "chicham-bridge",
                        "chicham-suspension-bridge",
                        "chicham-suspension-bridge-asias-highest"
                ]
        },
        "spiti:kibber-village-and-wildlife-sanctuary": {
                "place_name": "Kibber Village & Wildlife Sanctuary",
                "image_url": "/images/places/spiti/kibber-village.webp",
                "visual_description": "One of the highest continuously inhabited settlements in the world at 4,270m, Kibber features traditional whitewashed stone houses and serves as th...",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kibber-village",
                        "kibber-village-and-wildlife-sanctuary",
                        "wildlife-sanctuary"
                ]
        },
        "spiti:tabo-monastery-the-ajanta-of-the-himalayas": {
                "place_name": "Tabo Monastery (The Ajanta of the Himalayas)",
                "image_url": "/images/places/spiti/tabo-monastery.webp",
                "visual_description": "Founded in 996 CE, Tabo is a UNESCO World Heritage tentative site housing priceless thousand-year-old Buddhist clay statues, thangkas, and pristine...",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tabo-monastery",
                        "tabo-monastery-the-ajanta-of-the-himalayas",
                        "the-ajanta-of-the-himalayas"
                ]
        },
        "spiti:dhankar-glacial-lake-alpine-tarn": {
                "place_name": "Dhankar Glacial Lake Alpine Tarn",
                "image_url": "/images/places/spiti/dhankar-lake.webp",
                "visual_description": "A high-altitude glacial tarn at 4,270m reached via a steep 1.5-hour scree trail from Dhankar Monastery, offering crystal reflections of surrounding...",
                "category": "Adventure & Treks",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dhankar-glacial-lake-alpine-tarn",
                        "dhankar-lake"
                ]
        },
        "spiti:tashigang-worlds-highest-polling-station": {
                "place_name": "Tashigang (World's Highest Polling Station)",
                "image_url": "/images/places/spiti/tashigang.webp",
                "visual_description": "At an elevation of 4,650m (15,256 ft), Tashigang is officially recognized as the world's highest voting station, offering staggering panoramic vist...",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tashigang",
                        "tashigang-worlds-highest-polling-station",
                        "worlds-highest-polling-station"
                ]
        },
        "spiti:gue-monastery-and-500-year-old-natural-mummy": {
                "place_name": "Gue Monastery & 500-Year-Old Natural Mummy",
                "image_url": "/images/places/spiti/gue-monastery.webp",
                "visual_description": "Preserved inside a climate-controlled glass chamber sits the remarkably intact 500-year-old natural mummy of Tibetan Buddhist monk Sangha Tenzin, p...",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "500-year-old-natural-mummy",
                        "gue-monastery",
                        "gue-monastery-and-500-year-old-natural-mummy"
                ]
        },
        "spiti:kaza-old-town-and-central-himalayan-bazaar": {
                "place_name": "Kaza Old Town & Central Himalayan Bazaar",
                "image_url": "/images/places/spiti/kaza.webp",
                "visual_description": "The administrative and social hub of Spiti, where travelers and locals gather to purchase warm yak wool shawls, sea buckthorn concentrates, and han...",
                "category": "Markets & Craft",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "central-himalayan-bazaar",
                        "kaza",
                        "kaza-old-town",
                        "kaza-old-town-and-central-himalayan-bazaar"
                ]
        },
        "spiti:kunzum-pass-gateway-to-spiti-at-4-551m": {
                "place_name": "Kunzum Pass (Gateway to Spiti at 4,551m)",
                "image_url": "/images/places/spiti/kunzum-pass.webp",
                "visual_description": "The dramatic high mountain pass connecting Lahaul and Spiti at 4,551m (14,931 ft), marked by 15 colorful Buddhist stupas and sweeping vistas of the...",
                "category": "Must Visit",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "551m",
                        "gateway-to-spiti-at-4",
                        "kunzum-pass",
                        "kunzum-pass-gateway-to-spiti-at-4-551m"
                ]
        },
        "spiti:mudh-village-terminal-hamlet-of-pin-valley": {
                "place_name": "Mudh Village (Terminal Hamlet of Pin Valley)",
                "image_url": "/images/places/spiti/mudh-village.webp",
                "visual_description": "Situated at 3,810m, Mudh is the last motorable settlement in Pin Valley, flanked by vertical red-and-ochre geological formations and barley fields.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mudh-village",
                        "mudh-village-terminal-hamlet-of-pin-valley",
                        "terminal-hamlet-of-pin-valley"
                ]
        },
        "spiti:the-himalayan-cafe-and-slow-travel-lounge": {
                "place_name": "The Himalayan Cafe & Slow Travel Lounge",
                "image_url": "/images/places/spiti/himalayan-cafe-spiti.webp",
                "visual_description": "A cozy wood-clad travelers retreat in central Kaza serving freshly brewed espresso, authentic woodfired crust pizzas, and organic sea buckthorn tea.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "himalayan-cafe",
                        "himalayan-cafe-spiti",
                        "slow-travel-lounge",
                        "the-himalayan-cafe",
                        "the-himalayan-cafe-and-slow-travel-lounge"
                ]
        },
        "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland": {
                "place_name": "Chopta Alpine Meadows (Mini Switzerland)",
                "image_url": "/images/places/tungnath-chandrashila/chopta-meadows-bugyal.webp",
                "visual_description": "Lush undulating high-altitude alpine grasslands (bugyals) at 2,700m flanked by dense deodar, pine, and scarlet rhododendron forests.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chopta-alpine-meadows",
                        "chopta-alpine-meadows-mini-switzerland",
                        "chopta-meadows-bugyal",
                        "mini-switzerland"
                ]
        },
        "tungnath-chandrashila:deoria-tal-sacred-reflection-lake": {
                "place_name": "Deoria Tal Sacred Reflection Lake",
                "image_url": "/images/places/tungnath-chandrashila/deoria-tal-lake.webp",
                "visual_description": "An emerald high-altitude lake at 2,438m reflecting the four-peaked Chaukhamba mountain massif on its still mirror-like water surface.",
                "category": "Nature & Trails",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "deoria-tal-lake",
                        "deoria-tal-sacred-reflection-lake"
                ]
        },
        "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk": {
                "place_name": "Rohida Oak & Rhododendron Forest Walk",
                "image_url": "/images/places/tungnath-chandrashila/rohida-forest-trail.webp",
                "visual_description": "Ancient moss-draped evergreen oak trail blooming with crimson rhododendrons in spring, home to rare Himalayan monal pheasants.",
                "category": "Hidden Gems",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "rhododendron-forest-walk",
                        "rohida-forest-trail",
                        "rohida-oak",
                        "rohida-oak-and-rhododendron-forest-walk"
                ]
        },
        "tungnath-chandrashila:dugalbitta-eco-camp-glade": {
                "place_name": "Dugalbitta Eco Camp Glade",
                "image_url": "/images/places/tungnath-chandrashila/dugalbitta-eco-glade.webp",
                "visual_description": "Peaceful riverside glade 6 km below Chopta offering traditional wooden tea dhabas, local Garhwali red rice meals, and camp sites.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dugalbitta-eco-camp-glade",
                        "dugalbitta-eco-glade"
                ]
        },
        "tungnath-chandrashila:ukhimath-omkareshwar-winter-temple": {
                "place_name": "Ukhimath Omkareshwar Winter Temple",
                "image_url": "/images/places/tungnath-chandrashila/ukhimath-omkareshwar.webp",
                "visual_description": "The historic 1,200-year-old wooden seat where Lord Kedarnath and Lord Madhyamaheshwar are worshipped during winter snowfall.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ukhimath-omkareshwar",
                        "ukhimath-omkareshwar-winter-temple"
                ]
        },
        "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk": {
                "place_name": "Sari Village Apple Terraces & Homestay Walk",
                "image_url": "/images/places/tungnath-chandrashila/sari-village-base.webp",
                "visual_description": "Traditional stone-roofed Garhwali hamlet situated amidst terraced apple orchards, famous for authentic Mandua (finger millet) rotis and Jhangora kh...",
                "category": "Local Food",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "homestay-walk",
                        "sari-village-apple-terraces",
                        "sari-village-apple-terraces-and-homestay-walk",
                        "sari-village-base"
                ]
        },
        "tungnath-chandrashila:kanchula-korak-musk-deer-sanctuary": {
                "place_name": "Kanchula Korak Musk Deer Sanctuary",
                "image_url": "/images/places/tungnath-chandrashila/kanchula-korak-musk-deer-sanctuary.webp",
                "visual_description": "A 9.6 sq km high-altitude sanctuary at 2,600m dedicated to breeding the endangered Himalayan musk deer amidst dense oak and rhododendron forest.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kanchula-korak-musk-deer-sanctuary"
                ]
        },
        "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath": {
                "place_name": "Makkumath Temple (Winter Abode of Lord Tungnath)",
                "image_url": "/images/places/tungnath-chandrashila/makku-math-winter-tungnath.webp",
                "visual_description": "The historic wooden and stone village temple where the symbolic deity of Lord Tungnath is brought down in a grand procession when high cliffs are s...",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "makku-math-winter-tungnath",
                        "makkumath-temple",
                        "makkumath-temple-winter-abode-of-lord-tungnath",
                        "winter-abode-of-lord-tungnath"
                ]
        },
        "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps": {
                "place_name": "Baniyakund High Alpine Meadows & Eco-Camps",
                "image_url": "/images/places/tungnath-chandrashila/baniyakund-high-meadows.webp",
                "visual_description": "A sweeping grassy alpine basin 4 km before Chopta surrounded by deodar forest, popular for luxury eco-camps and unobstructed star-gazing.",
                "category": "Nature & Viewpoints",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "baniyakund-high-alpine-meadows",
                        "baniyakund-high-alpine-meadows-and-eco-camps",
                        "baniyakund-high-meadows",
                        "eco-camps"
                ]
        },
        "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m": {
                "place_name": "Ravan Shila (The Cliff of Penance at 3,800m)",
                "image_url": "/images/places/tungnath-chandrashila/ravan-shila-cliff.webp",
                "visual_description": "A sheer rocky ledge above Tungnath where King Ravana performed rigorous penance to please Lord Shiva, commanding dizzying vertical drops.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "800m",
                        "ravan-shila",
                        "ravan-shila-cliff",
                        "ravan-shila-the-cliff-of-penance-at-3-800m",
                        "the-cliff-of-penance-at-3"
                ]
        },
        "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple": {
                "place_name": "Kalpeshwar Fifth Kedar (Sacred Hair Temple)",
                "image_url": "/images/places/tungnath-chandrashila/kalpeshwar-cave-temple.webp",
                "visual_description": "The fifth and only Panch Kedar shrine open throughout all twelve months, situated inside a natural cave where Shiva\u2019s matted locks (Jata) are worsh...",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kalpeshwar-cave-temple",
                        "kalpeshwar-fifth-kedar",
                        "kalpeshwar-fifth-kedar-sacred-hair-temple",
                        "sacred-hair-temple"
                ]
        },
        "tungnath-chandrashila:madhyamaheshwar-valley-circuit-base": {
                "place_name": "Madhyamaheshwar Valley Circuit Base",
                "image_url": "/images/places/tungnath-chandrashila/madhyamaheshwar-base-circuit.webp",
                "visual_description": "The second Panch Kedar trail base in Ransi village where the holy naval (nabhi) of Lord Shiva is worshipped in a high alpine bowl beneath Chaukhamba.",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "madhyamaheshwar-base-circuit",
                        "madhyamaheshwar-valley-circuit-base"
                ]
        },
        "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail": {
                "place_name": "Ansuya Devi Jungle Waterfall & Hermitage Trail",
                "image_url": "/images/places/tungnath-chandrashila/ansuya-devi-waterfall-trail.webp",
                "visual_description": "A 5 km forest trek through dense oak woods to the cave shrine of Devi Ansuya, featuring a majestic 30-meter waterfall tumbling over limestone cliffs.",
                "category": "Adventure & Treks",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ansuya-devi-jungle-waterfall",
                        "ansuya-devi-jungle-waterfall-and-hermitage-trail",
                        "ansuya-devi-waterfall-trail",
                        "hermitage-trail"
                ]
        },
        "tungnath-chandrashila:chopta-alpine-shepherd-encampments": {
                "place_name": "Chopta Alpine Shepherd Encampments",
                "image_url": "/images/places/tungnath-chandrashila/chopta-shepherds-stone-huts.webp",
                "visual_description": "Traditional summer dry-stone and slate-roof huts (chhani) built by Garhwali shepherds who graze their sheep and goats on the high bugyals.",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chopta-alpine-shepherd-encampments",
                        "chopta-shepherds-stone-huts"
                ]
        },
        "udaipur:city-palace-complex-and-zenana-mahal": {
                "place_name": "City Palace Complex & Zenana Mahal",
                "image_url": "/images/places/udaipur/city-palace-udaipur.webp",
                "visual_description": "Rajasthan's largest palace complex perched over Lake Pichola with ornate courtyards, mirror work, and marble balconies.",
                "category": "Must Visit",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "city-palace",
                        "city-palace-complex",
                        "city-palace-complex-and-zenana-mahal",
                        "city-palace-of-udaipur",
                        "city-palace-udaipur",
                        "udaipur-city-palace",
                        "zenana-mahal"
                ]
        },
        "udaipur:lake-pichola-ghats-and-island-cruise": {
                "place_name": "Lake Pichola Ghats & Island Cruise",
                "image_url": "/images/places/udaipur/lake-pichola-boat-ride.webp",
                "visual_description": "Scenic boat cruise across Lake Pichola offering close views of Jag Mandir Island, Taj Lake Palace, and the Old City ghats.",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "island-cruise",
                        "lake-pichola",
                        "lake-pichola-boat-ride",
                        "lake-pichola-ghats",
                        "lake-pichola-ghats-and-island-cruise",
                        "lake-pichola-sunset-boat-voyage",
                        "pichola-boat-ride",
                        "pichola-cruise"
                ]
        },
        "udaipur:bagore-ki-haveli-and-dharohar-dance": {
                "place_name": "Bagore Ki Haveli & Dharohar Dance",
                "image_url": "/images/places/udaipur/bagore-ki-haveli.webp",
                "visual_description": "18th-century waterfront haveli at Gangaur Ghat hosting the nightly Dharohar cultural folk dance and puppet performance.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bagore",
                        "bagore-haveli",
                        "bagore-ki-haveli",
                        "bagore-ki-haveli-and-dharohar-dance",
                        "dharohar-dance"
                ]
        },
        "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat": {
                "place_name": "Ambrai Ghat Sunset Promenade (Manjhi Ghat)",
                "image_url": "/images/places/udaipur/ambrai-ghat.webp",
                "visual_description": "Peaceful marble ghat located directly across from the City Palace, offering the most poetic unobstructed water views in Udaipur.",
                "category": "Hidden Gems",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ambrai",
                        "ambrai-ghat",
                        "ambrai-ghat-sunset-promenade",
                        "ambrai-ghat-sunset-promenade-manjhi-ghat",
                        "manjhi-ghat"
                ]
        },
        "udaipur:saheliyon-ki-bari-garden-of-maidens": {
                "place_name": "Saheliyon Ki Bari (Garden of Maidens)",
                "image_url": "/images/places/udaipur/saheliyon-ki-bari.webp",
                "visual_description": "Historic royal garden built in the 18th century featuring marble lotus fountains, shaded bougainvillea walkways, and bird pools.",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "garden-of-maidens",
                        "saheliyon",
                        "saheliyon-bari",
                        "saheliyon-ki-bari",
                        "saheliyon-ki-bari-garden-of-maidens"
                ]
        },
        "udaipur:sajjangarh-monsoon-palace-ridge": {
                "place_name": "Sajjangarh Monsoon Palace Ridge",
                "image_url": "/images/places/udaipur/sajjangarh-monsoon-palace.webp",
                "visual_description": "White marble hilltop palace perched 944m high on Bansdara mountain with panoramic views of Udaipur's lakes and Aravalli hills.",
                "category": "Adventure & Treks",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "monsoon-palace",
                        "sajjangarh",
                        "sajjangarh-monsoon-palace",
                        "sajjangarh-monsoon-palace-ridge"
                ]
        },
        "udaipur:jheels-ginger-coffee-bar-and-bakery": {
                "place_name": "Jheel's Ginger Coffee Bar & Bakery",
                "image_url": "/images/places/udaipur/jheels-ginger-coffee.webp",
                "visual_description": "Intimate lakeside caf\u00e9 with overhanging stone jharokha balconies serving specialty coffees, lemon tarts, and fresh shakes.",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bakery",
                        "jeels-coffee",
                        "jeels-ginger-coffee-bar",
                        "jheels-coffee",
                        "jheels-ginger-coffee",
                        "jheels-ginger-coffee-bar",
                        "jheels-ginger-coffee-bar-and-bakery"
                ]
        },
        "udaipur:natraj-dining-hall-unlimited-mewari-thali": {
                "place_name": "Natraj Dining Hall (Unlimited Mewari Thali)",
                "image_url": "/images/places/udaipur/natraj-dining-hall.webp",
                "visual_description": "Celebrated local dining hall serving authentic unlimited Rajasthani-Gujarati thalis featuring Dal Baati Churma, Gatta Curry, and Kadhai.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "natraj",
                        "natraj-dining-hall",
                        "natraj-dining-hall-unlimited-mewari-thali",
                        "natraj-thali",
                        "unlimited-mewari-thali"
                ]
        },
        "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine": {
                "place_name": "Jagdish Temple (1651 CE Indo-Aryan Shrine)",
                "image_url": "/images/places/udaipur/jagdish-temple.webp",
                "visual_description": "Constructed by Maharana Jagat Singh in 1651, this three-tiered stone temple rises 79 feet on carved pillars, showcasing extraordinary sculptures of...",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1651-ce-indo-aryan-shrine",
                        "jagdish-temple",
                        "jagdish-temple-1651-ce-indo-aryan-shrine"
                ]
        },
        "udaipur:fateh-sagar-lake-and-nehru-island-park": {
                "place_name": "Fateh Sagar Lake & Nehru Island Park",
                "image_url": "/images/places/udaipur/fateh-sagar-lake.webp",
                "visual_description": "An artificial freshwater lake framed by the rolling Aravalli mountains on three sides, featuring three scenic islands including Nehru Park with its...",
                "category": "Nature & Trails",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "fateh-sagar-lake",
                        "fateh-sagar-lake-and-nehru-island-park",
                        "nehru-island-park"
                ]
        },
        "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar": {
                "place_name": "Ahar Royal Cenotaphs (Mahasatyas of Mewar)",
                "image_url": "/images/places/udaipur/ahar-cenotaphs.webp",
                "visual_description": "A hauntingly serene archaeological field containing over 250 carved marble and white sandstone chhatris (cenotaphs) built over 400 years to honor t...",
                "category": "Culture & Heritage",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ahar-cenotaphs",
                        "ahar-royal-cenotaphs",
                        "ahar-royal-cenotaphs-mahasatyas-of-mewar",
                        "mahasatyas-of-mewar"
                ]
        },
        "udaipur:shilpgram-rural-arts-and-crafts-complex": {
                "place_name": "Shilpgram (Rural Arts & Crafts Complex)",
                "image_url": "/images/places/udaipur/shilpgram-crafts.webp",
                "visual_description": "A 70-acre living ethnographic museum featuring 26 authentic regional village huts from Rajasthan, Gujarat, Goa, and Maharashtra, with master artisa...",
                "category": "Markets & Craft",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "crafts-complex",
                        "rural-arts",
                        "shilpgram",
                        "shilpgram-crafts",
                        "shilpgram-rural-arts-and-crafts-complex"
                ]
        },
        "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata": {
                "place_name": "Doodh Talai Lake & Ropeway to Karni Mata",
                "image_url": "/images/places/udaipur/doodh-talai-lake.webp",
                "visual_description": "A small picturesque lake adjacent to Lake Pichola with rock gardens, musical fountains, and an aerial ropeway gondola leading up to the Machla Magr...",
                "category": "Nature & Trails",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "doodh-talai-lake",
                        "doodh-talai-lake-and-ropeway-to-karni-mata",
                        "ropeway-to-karni-mata"
                ]
        },
        "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining": {
                "place_name": "Upre by 1559 AD (Lake Pichola Rooftop Dining)",
                "image_url": "/images/places/udaipur/upre-rooftop-dining.webp",
                "visual_description": "An open-air terrace restaurant right on the edge of Lake Pichola, offering private white-draped cabanas with unmatched panoramic vistas of the illu...",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "lake-pichola",
                        "lake-pichola-boat-ride",
                        "lake-pichola-ghats",
                        "lake-pichola-ghats-and-island-cruise",
                        "lake-pichola-rooftop-dining",
                        "lake-pichola-sunset-boat-voyage",
                        "pichola-boat-ride",
                        "pichola-cruise",
                        "upre-by-1559-ad",
                        "upre-by-1559-ad-lake-pichola-rooftop-dining",
                        "upre-rooftop-dining"
                ]
        },
        "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen": {
                "place_name": "Millets of Mewar (Pioneering Healthy Rajasthani Kitchen)",
                "image_url": "/images/places/udaipur/millets-of-mewar.webp",
                "visual_description": "Udaipur's pioneering dedicated health cafe reviving ancient Indian super-grains: bajra, ragi, and jowar thalis, gluten-free rotis, raw salads, and ...",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "millets-of-mewar",
                        "millets-of-mewar-pioneering-healthy-rajasthani-kitchen",
                        "pioneering-healthy-rajasthani-kitchen"
                ]
        },
        "udaipur:paliwal-kachori-old-city-breakfast-stand": {
                "place_name": "Paliwal Kachori Old City Breakfast Stand",
                "image_url": "/images/places/udaipur/paliwal-kachori.webp",
                "visual_description": "A legendary old city standing counter that has served golden, piping hot dal kachoris and crisp jalebis to morning templegoers and travelers since ...",
                "category": "Local Food",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "paliwal-kachori",
                        "paliwal-kachori-old-city-breakfast-stand"
                ]
        },
        "varanasi:dashashwamedh-ghat-evening-maha-aarti": {
                "place_name": "Dashashwamedh Ghat Evening Maha Aarti",
                "image_url": "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
                "visual_description": "The world-renowned sacred fire ritual performed at twilight by saffron-clad priests with multi-tiered brass lamps and conch shells.",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dashashwamedh-ghat-aarti",
                        "dashashwamedh-ghat-evening-maha-aarti"
                ]
        },
        "varanasi:assi-ghat-subah-e-banaras-morning-ceremony": {
                "place_name": "Assi Ghat Subah-e-Banaras Morning Ceremony",
                "image_url": "/images/places/varanasi/assi-ghat-subah-e-banaras.webp",
                "visual_description": "Dawn cultural ceremony featuring Vedic chanting, sunrise Yajna, classical Indian raga performances, and group yoga by the river.",
                "category": "Must Visit",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "assi-ghat-subah-e-banaras",
                        "assi-ghat-subah-e-banaras-morning-ceremony"
                ]
        },
        "varanasi:kashi-vishwanath-temple-corridor": {
                "place_name": "Kashi Vishwanath Temple Corridor",
                "image_url": "/images/places/varanasi/kashi-vishwanath-corridor.webp",
                "visual_description": "One of the 12 sacred Jyotirlingas, newly restored with an expansive red sandstone corridor connecting directly to the Ganga riverbank.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kashi-vishwanath-corridor",
                        "kashi-vishwanath-temple-corridor"
                ]
        },
        "varanasi:blue-lassi-shop-historic-churn-since-1925": {
                "place_name": "Blue Lassi Shop (Historic Churn Since 1925)",
                "image_url": "/images/places/varanasi/blue-lassi-shop.webp",
                "visual_description": "Celebrated hole-in-the-wall shop serving over 80 varieties of handcrafted hand-churned lassi served in traditional earthen kulhads.",
                "category": "Local Food",
                "semantic_theme": "food",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "blue-lassi-shop",
                        "blue-lassi-shop-historic-churn-since-1925",
                        "historic-churn-since-1925"
                ]
        },
        "varanasi:sarnath-dhamek-stupa-and-deer-park": {
                "place_name": "Sarnath Dhamek Stupa & Deer Park",
                "image_url": "/images/places/varanasi/sarnath-deer-park.webp",
                "visual_description": "The sacred site where Lord Buddha delivered his first sermon after enlightenment; features the massive 43m Dhamek Stupa and Ashokan Pillar.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "deer-park",
                        "sarnath-deer-park",
                        "sarnath-dhamek-stupa",
                        "sarnath-dhamek-stupa-and-deer-park"
                ]
        },
        "varanasi:manikarnika-ghat-the-eternal-flame": {
                "place_name": "Manikarnika Ghat (The Eternal Flame)",
                "image_url": "/images/places/varanasi/manikarnika-ghat.webp",
                "visual_description": "The primary sacred cremation ghat of Varanasi where the sacred funeral pyre has burned continuously for over two millennia.",
                "category": "Hidden Gems",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "manikarnika-ghat",
                        "manikarnika-ghat-the-eternal-flame",
                        "the-eternal-flame"
                ]
        },
        "varanasi:ramnagar-fort-and-vintage-royal-museum": {
                "place_name": "Ramnagar Fort & Vintage Royal Museum",
                "image_url": "/images/places/varanasi/ramnagar-fort.webp",
                "visual_description": "18th-century cream-coloured sandstone fortification on the eastern bank of the Ganga, housing royal vintage cars, palanquins, and medieval armories.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ramnagar-fort",
                        "ramnagar-fort-and-vintage-royal-museum",
                        "vintage-royal-museum"
                ]
        },
        "varanasi:laxmi-tea-stall-and-malaiyo-hub": {
                "place_name": "Laxmi Tea Stall & Malaiyo Hub",
                "image_url": "/images/places/varanasi/kashi-tea-stall.webp",
                "visual_description": "Iconic alley tea corner serving spiced lemon tea, rich saffron malai toast, and seasonal winter Malaiyo (foamed milk sweet).",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kashi-tea-stall",
                        "laxmi-tea-stall",
                        "laxmi-tea-stall-and-malaiyo-hub",
                        "malaiyo-hub"
                ]
        },
        "varanasi:harishchandra-ghat-and-silent-sacred-pyres": {
                "place_name": "Harishchandra Ghat & Silent Sacred Pyres",
                "image_url": "/images/places/varanasi/harishchandra-ghat.webp",
                "visual_description": "One of the two historic cremation ghats on the sacred Ganga, named after King Harishchandra who served here.without interruption for thousands of y...",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "harishchandra-ghat",
                        "harishchandra-ghat-and-silent-sacred-pyres",
                        "silent-sacred-pyres"
                ]
        },
        "varanasi:scindia-ghat-and-the-leaning-shiva-temple": {
                "place_name": "Scindia Ghat & The Leaning Shiva Temple",
                "image_url": "/images/places/varanasi/scindia-ghat-leaning-temple.webp",
                "visual_description": "A quiet, architecturally fascinating ghat featuring the Ratneshwar Mahadev Temple, which tilted dramatically 9 degrees into the Ganga during constr...",
                "category": "Hidden Gems",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "scindia-ghat",
                        "scindia-ghat-and-the-leaning-shiva-temple",
                        "scindia-ghat-leaning-temple",
                        "the-leaning-shiva-temple"
                ]
        },
        "varanasi:bharat-kala-bhavan-archeological-museum": {
                "place_name": "Bharat Kala Bhavan Archeological Museum",
                "image_url": "/images/places/varanasi/bharat-kala-bhavan.webp",
                "visual_description": "Prestigious museum inside Banaras Hindu University campus housing rare 12th-century sculptures and miniature paintings.Naresh (Maharaja of Banaras)...",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bharat-kala-bhavan",
                        "bharat-kala-bhavan-archeological-museum"
                ]
        },
        "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun": {
                "place_name": "Deena Chaat Bhandar (Tamatar Chaat & Gulab Jamun)",
                "image_url": "/images/places/varanasi/deena-chaat-bhandar.webp",
                "visual_description": "Legendary street food stall in Godowlia known for authentic Banarasi Tamatar Chaat served in clay purwas.varieties of thick creamy curd lassi toppe...",
                "category": "Local Food",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "deena-chaat-bhandar",
                        "deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
                        "gulab-jamun",
                        "tamatar-chaat"
                ]
        },
        "varanasi:kashi-chat-bhandar-godowlia-chowk": {
                "place_name": "Kashi Chat Bhandar (Godowlia Chowk)",
                "image_url": "/images/places/varanasi/kashi-chat-bhandar.webp",
                "visual_description": "Varanasi's most celebrated chaat house, famous for its signature Tamatar Chaat (pureed spiced tomatoes and mawa served bubbling hot in kulhad), pal...",
                "category": "Local Food",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "godowlia-chowk",
                        "kashi-chat-bhandar",
                        "kashi-chat-bhandar-godowlia-chowk"
                ]
        },
        "varanasi:tulsi-manas-white-marble-temple": {
                "place_name": "Tulsi Manas White Marble Temple",
                "image_url": "/images/places/varanasi/tulsi-manas-temple.webp",
                "visual_description": "A pristine white marble temple built at the site where Goswami Tulsidas composed the Ramcharitmanas, with the entire epic engraved upon marble walls.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tulsi-manas-temple",
                        "tulsi-manas-white-marble-temple"
                ]
        },
        "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos": {
                "place_name": "Sankat Mochan Hanuman Temple & Besan Laddoos",
                "image_url": "/images/places/varanasi/sankat-mochan-temple.webp",
                "visual_description": "A sacred shrine founded by Tulsidas in the 16th century dedicated to Lord Hanuman, world-famous for pure desi ghee besan laddoos and peaceful gardens.",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "besan-laddoos",
                        "sankat-mochan-hanuman-temple",
                        "sankat-mochan-hanuman-temple-and-besan-laddoos",
                        "sankat-mochan-temple"
                ]
        },
        "varanasi:chet-singh-fort-and-river-ramparts": {
                "place_name": "Chet Singh Fort & River Ramparts",
                "image_url": "/images/places/varanasi/chet-singh-fort-ghat.webp",
                "visual_description": "A fortified 18th-century palace built by Maharaja Chet Singh overlooking the Ganga where the historic battle against Warren Hastings took place.",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chet-singh-fort",
                        "chet-singh-fort-and-river-ramparts",
                        "chet-singh-fort-ghat",
                        "river-ramparts"
                ]
        },
        "delhi:qutub-minar": {
                "place_name": "Qutub Minar",
                "image_url": "/images/places/delhi/qutub-minar.jpg",
                "visual_description": "Qutub Minar",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "qutub-minar",
                        "qutub",
                        "qutb-minar"
                ]
        },
        "delhi:red-fort": {
                "place_name": "Red Fort",
                "image_url": "/images/places/delhi/red-fort.jpg",
                "visual_description": "Red Fort",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "red-fort",
                        "lal-qila"
                ]
        },
        "delhi:india-gate": {
                "place_name": "India Gate",
                "image_url": "/images/places/delhi/india-gate.jpg",
                "visual_description": "India Gate",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "india-gate"
                ]
        },
        "delhi:lotus-temple": {
                "place_name": "Lotus Temple",
                "image_url": "/images/places/delhi/lotus-temple.jpg",
                "visual_description": "Lotus Temple",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "lotus-temple"
                ]
        },
        "delhi:humayuns-tomb": {
                "place_name": "Humayun's Tomb",
                "image_url": "/images/places/delhi/humayuns-tomb.webp",
                "visual_description": "Humayun's Tomb",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "humayuns-tomb"
                ]
        },
        "delhi:akshardham": {
                "place_name": "Akshardham Temple",
                "image_url": "/images/places/delhi/akshardham.webp",
                "visual_description": "Akshardham Temple",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "akshardham",
                        "swaminarayan-akshardham"
                ]
        },
        "delhi:chandni-chowk": {
                "place_name": "Chandni Chowk",
                "image_url": "/images/places/delhi/chandni-chowk.jpg",
                "visual_description": "Chandni Chowk",
                "category": "Shops & Markets",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chandni-chowk"
                ]
        },
        "mumbai:gateway-of-india": {
                "place_name": "Gateway of India",
                "image_url": "/images/places/mumbai/gateway-of-india.webp",
                "visual_description": "Gateway of India",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "gateway-of-india",
                        "gateway"
                ]
        },
        "amritsar:golden-temple": {
                "place_name": "Golden Temple",
                "image_url": "/images/places/amritsar/golden-temple.jpg",
                "visual_description": "Golden Temple",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "golden-temple",
                        "harmandir-sahib"
                ]
        },
        "mussoorie:landour-bakehouse": {
                "place_name": "Landour Bakehouse",
                "image_url": "/images/places/mussoorie/landour-bakehouse.webp",
                "visual_description": "Landour Bakehouse",
                "category": "Caf\u00e9s & Bakery",
                "semantic_theme": "cafe",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "landour-bakehouse",
                        "landour-bakehouse-and-sisters-bazaar",
                        "landour-bakehouse-sisters-bazaar"
                ]
        },
        "mussoorie:lal-tibba": {
                "place_name": "Lal Tibba",
                "image_url": "/images/places/mussoorie/lal-tibba.webp",
                "visual_description": "Lal Tibba",
                "category": "Nature & Trails",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "lal-tibba",
                        "lal-tibba-scenic-viewpoint",
                        "lal-tibba-viewpoint"
                ]
        },
        "mussoorie:kempty-falls": {
                "place_name": "Kempty Falls",
                "image_url": "/images/places/mussoorie/kempty-falls.webp",
                "visual_description": "Kempty Falls",
                "category": "Nature & Trails",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kempty-falls",
                        "kempty-falls-cascades",
                        "kempty"
                ]
        },
        "mussoorie:gun-hill": {
                "place_name": "Gun Hill",
                "image_url": "/images/places/mussoorie/gun-hill.webp",
                "visual_description": "Gun Hill",
                "category": "Nature & Trails",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "gun-hill",
                        "gun-hill-ropeway",
                        "gun-hill-viewpoint"
                ]
        },
        "mussoorie:camels-back-road": {
                "place_name": "Camel's Back Road",
                "image_url": "/images/places/mussoorie/camels-back-road.webp",
                "visual_description": "Camel's Back Road",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "camels-back-road",
                        "camel-back-road",
                        "camels-back",
                        "camel-back"
                ]
        },
        "mussoorie:mall-road": {
                "place_name": "Mussoorie Mall Road",
                "image_url": "/images/places/mussoorie/mall-road.webp",
                "visual_description": "Mussoorie Mall Road",
                "category": "Shops & Markets",
                "semantic_theme": "shopping",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mall-road",
                        "mussoorie-mall-road",
                        "the-mall-road"
                ]
        },
        "mussoorie:george-everest": {
                "place_name": "Sir George Everest House",
                "image_url": "/images/places/mussoorie/george-everest.webp",
                "visual_description": "Sir George Everest House",
                "category": "Nature & Trails",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "george-everest",
                        "sir-george-everest-house",
                        "george-everest-peak",
                        "george-everest-house"
                ]
        },
        "mussoorie:clouds-end": {
                "place_name": "Cloud's End",
                "image_url": "/images/places/mussoorie/clouds-end.webp",
                "visual_description": "Cloud's End",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "clouds-end",
                        "clouds-end-forest",
                        "clouds-end-heritage"
                ]
        },
        "mussoorie:landour": {
                "place_name": "Landour Cantonment Ridge",
                "image_url": "/images/places/mussoorie/landour.webp",
                "visual_description": "Landour Cantonment Ridge",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "landour",
                        "landour-cantonment-ridge",
                        "landour-ridge"
                ]
        },
        "mussoorie:st-pauls-church": {
                "place_name": "St. Paul's Church",
                "image_url": "/images/places/mussoorie/st-pauls-church.webp",
                "visual_description": "St. Paul's Church",
                "category": "Culture & Heritage",
                "semantic_theme": "church",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "st-pauls-church",
                        "st-paul-church",
                        "st-pauls-church-landour"
                ]
        },
        "dharamshala:bhagsunag-waterfall": {
                "place_name": "Bhagsunag Waterfall",
                "image_url": "/images/places/dharamshala/bhagsunag-waterfall.webp",
                "visual_description": "Bhagsunag Waterfall",
                "category": "Nature & Trails",
                "semantic_theme": "waterfall",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "bhagsunag-waterfall",
                        "bhagsu-waterfall",
                        "bhagsunag-waterfall-and-shiva-cafe",
                        "bhagsu-waterfall-shiva-cafe",
                        "bhagsunag"
                ]
        },
        "dharamshala:namgyal-monastery": {
                "place_name": "Namgyal Monastery & Tsuglagkhang Complex",
                "image_url": "/images/places/dharamshala/namgyal-monastery.webp",
                "visual_description": "Namgyal Monastery & Tsuglagkhang Complex",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "namgyal-monastery",
                        "namgyal",
                        "namgyal-monastery-and-tsuglagkhang-complex",
                        "tsuglagkhang-complex",
                        "namgyal-monastery-tsuglagkhang-complex"
                ]
        },
        "dharamshala:triund-trek": {
                "place_name": "Triund High Ridge Himalayan Trek",
                "image_url": "/images/places/dharamshala/triund-trek.webp",
                "visual_description": "Triund High Ridge Himalayan Trek",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "triund-trek",
                        "triund",
                        "triund-high-ridge-himalayan-trek",
                        "triund-trail",
                        "triund-trek-base"
                ]
        },
        "dharamshala:norbulingka-institute": {
                "place_name": "Norbulingka Tibetan Cultural Institute",
                "image_url": "/images/places/dharamshala/norbulingka-institute.webp",
                "visual_description": "Norbulingka Tibetan Cultural Institute",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "norbulingka-institute",
                        "norbulingka-tibetan-cultural-institute",
                        "norbulingka"
                ]
        },
        "jaipur:nahargarh-fort": {
                "place_name": "Nahargarh Fort Sunset Bastion",
                "image_url": "/images/places/jaipur/nahargarh-fort.webp",
                "visual_description": "Nahargarh Fort Sunset Bastion",
                "category": "Nature & Trails",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "nahargarh-fort",
                        "nahargarh-fort-sunset-bastion",
                        "nahargarh",
                        "nahargarh-fort-sunset",
                        "nahargarh-fort-sunset-ridge"
                ]
        },
        "jaipur:amber-fort": {
                "place_name": "Amber Fort & Maota Lake",
                "image_url": "/images/places/jaipur/amber-fort.webp",
                "visual_description": "Amber Fort & Maota Lake",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "amber-fort",
                        "amber-fort-and-maota-lake",
                        "amber-fort-and-sheesh-mahal",
                        "amber",
                        "amer-fort"
                ]
        },
        "jaipur:hawa-mahal": {
                "place_name": "Hawa Mahal (Palace of Winds)",
                "image_url": "/images/places/jaipur/hawa-mahal.webp",
                "visual_description": "Hawa Mahal (Palace of Winds)",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hawa-mahal",
                        "hawa-mahal-palace-of-winds",
                        "hawa-mahal-palace"
                ]
        },
        "leh:leh-palace": {
                "place_name": "Leh Palace",
                "image_url": "/images/places/leh/leh-palace.webp",
                "visual_description": "Leh Palace",
                "category": "Culture & Heritage",
                "semantic_theme": "heritage",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "leh-palace",
                        "leh-palace-17th-century-fortress",
                        "lachen-palkhar"
                ]
        },
        "leh:pangong-tso": {
                "place_name": "Pangong Tso Alpine Lake",
                "image_url": "/images/places/leh/pangong-tso.webp",
                "visual_description": "Pangong Tso Alpine Lake",
                "category": "Nature & Trails",
                "semantic_theme": "lake",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "pangong-tso",
                        "pangong-tso-high-altitude-salt-lake",
                        "pangong-lake",
                        "pangong-tso-alpine-lake",
                        "pangong"
                ]
        },
        "leh:thiksey-monastery-gompa": {
                "place_name": "Thiksey Monastery (Gompa)",
                "image_url": "/images/places/leh/thiksey-monastery-gompa.webp",
                "visual_description": "Thiksey Monastery (Gompa)",
                "category": "Culture & Heritage",
                "semantic_theme": "monastery",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "thiksey-monastery-gompa",
                        "thiksey-monastery",
                        "thiksey",
                        "thiksey-gompa"
                ]
        },
        "goa:anjuna-beach": {
                "place_name": "Anjuna Beach & Flea Market",
                "image_url": "/images/places/goa/anjuna-beach.webp",
                "visual_description": "Anjuna Beach & Flea Market",
                "category": "Nature & Trails",
                "semantic_theme": "beach",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "anjuna-beach",
                        "anjuna-beach-and-flea-market",
                        "anjuna"
                ]
        },
        "varanasi:brijrama-palace": {
                "place_name": "BrijRama Palace River Heritage",
                "image_url": "/images/places/varanasi/brijrama-palace.webp",
                "visual_description": "BrijRama Palace River Heritage",
                "category": "Stays & Sanctuaries",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "brijrama-palace",
                        "brijrama-palace-river-heritage",
                        "brijrama",
                        "brijrama-palace-heritage"
                ]
        },
        "kasol:chalal-trail": {
                "place_name": "Chalal Pine Riverside Trail",
                "image_url": "/images/places/kasol/chalal-trail.webp",
                "visual_description": "Chalal Pine Riverside Trail",
                "category": "Nature & Trails",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chalal-trail",
                        "chalal-pine-riverside-trail",
                        "chalal",
                        "chalal-trail-pine-riverside-trail"
                ]
        },
        "rishikesh:shivpuri-rafting": {
                "place_name": "Shivpuri White Water Rafting",
                "image_url": "/images/places/rishikesh/shivpuri-rafting.webp",
                "visual_description": "Shivpuri White Water Rafting",
                "category": "Adventure & Treks",
                "semantic_theme": "nature",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shivpuri-rafting",
                        "shivpuri-white-water-rafting",
                        "shivpuri-river-rafting",
                        "shivpuri",
                        "shivpuri-white-water-river-rafting"
                ]
        },
        "tungnath-chandrashila:tungnath-temple": {
                "place_name": "Tungnath Temple",
                "image_url": "/images/places/tungnath-chandrashila/tungnath-temple.webp",
                "visual_description": "Tungnath Temple",
                "category": "Culture & Heritage",
                "semantic_theme": "spiritual",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tungnath-temple",
                        "01-tungnath-temple",
                        "tungnath-temple-highest-shiva-shrine",
                        "tungnath",
                        "01-tungnath"
                ]
        },
        "tungnath-chandrashila:chandrashila-summit": {
                "place_name": "Chandrashila Summit",
                "image_url": "/images/places/tungnath-chandrashila/chandrashila-summit.webp",
                "visual_description": "Chandrashila Summit",
                "category": "Nature & Trails",
                "semantic_theme": "viewpoint",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chandrashila-summit",
                        "02-chandrashila-summit",
                        "chandrashila-peak",
                        "02-chandrashila-peak",
                        "chandrashila-summit-ridge",
                        "chandrashila",
                        "02-chandrashila"
                ]
        }
}

    HOTEL_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {
        "agra:the-oberoi-amarvilas": {
                "place_name": "The Oberoi Amarvilas",
                "hotel_name": "The Oberoi Amarvilas",
                "image_url": "/images/places/agra/stays/the-oberoi-amarvilas.webp",
                "visual_description": "Verified property artwork for The Oberoi Amarvilas in Agra.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Ultra-Luxury Taj View Palace",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-oberoi-amarvilas"
                ]
        },
        "agra:itc-mughal-luxury-collection": {
                "place_name": "ITC Mughal Luxury Collection",
                "hotel_name": "ITC Mughal Luxury Collection",
                "image_url": "/images/places/agra/stays/itc-mughal-luxury-collection.webp",
                "visual_description": "Verified property artwork for ITC Mughal Luxury Collection in Agra.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Mughal Architecture Luxury Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "itc-mughal-luxury-collection"
                ]
        },
        "agra:coral-tree-homestay": {
                "place_name": "Coral Tree Homestay",
                "hotel_name": "Coral Tree Homestay",
                "image_url": "/images/places/agra/stays/coral-tree-homestay.webp",
                "visual_description": "Verified property artwork for Coral Tree Homestay in Agra.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Eco Boutique Garden Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "coral-tree-homestay"
                ]
        },
        "agra:zostel-agra": {
                "place_name": "Zostel Agra",
                "hotel_name": "Zostel Agra",
                "image_url": "/images/places/agra/stays/zostel-agra.webp",
                "visual_description": "Verified property artwork for Zostel Agra in Agra.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Monument Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "zostel",
                        "zostel-agra"
                ]
        },
        "alwar-siliserh:siliserh-lake-palace-rtdc-heritage": {
                "place_name": "Siliserh Lake Palace (RTDC Heritage)",
                "hotel_name": "Siliserh Lake Palace (RTDC Heritage)",
                "image_url": "/images/places/alwar-siliserh/stays/siliserh-lake-palace-rtdc-heritage.webp",
                "visual_description": "Verified property artwork for Siliserh Lake Palace (RTDC Heritage) in Alwar-Siliserh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "1845 Royal Hunting Lodge Palace",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "rtdc-heritage",
                        "siliserh-lake-palace",
                        "siliserh-lake-palace-rtdc-heritage"
                ]
        },
        "alwar-siliserh:dadhikar-fort-heritage-hotel": {
                "place_name": "Dadhikar Fort Heritage Hotel",
                "hotel_name": "Dadhikar Fort Heritage Hotel",
                "image_url": "/images/places/alwar-siliserh/stays/dadhikar-fort-heritage-hotel.webp",
                "visual_description": "Verified property artwork for Dadhikar Fort Heritage Hotel in Alwar-Siliserh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "1,100-Year-Old Aravalli Fortress",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dadhikar-fort-heritage-hotel"
                ]
        },
        "alwar-siliserh:lemon-tree-hotel-alwar": {
                "place_name": "Lemon Tree Hotel Alwar",
                "hotel_name": "Lemon Tree Hotel Alwar",
                "image_url": "/images/places/alwar-siliserh/stays/lemon-tree-hotel-alwar.webp",
                "visual_description": "Verified property artwork for Lemon Tree Hotel Alwar in Alwar-Siliserh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Modern Comfortable City Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "lemon-tree-hotel-alwar"
                ]
        },
        "alwar-siliserh:fort-view-homestay-alwar": {
                "place_name": "Fort View Homestay Alwar",
                "hotel_name": "Fort View Homestay Alwar",
                "image_url": "/images/places/alwar-siliserh/stays/fort-view-homestay-alwar.webp",
                "visual_description": "Verified property artwork for Fort View Homestay Alwar in Alwar-Siliserh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Traditional Rajasthani Town Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "fort-view-homestay-alwar"
                ]
        },
        "chandigarh:taj-chandigarh-sector-17": {
                "place_name": "Taj Chandigarh Sector 17",
                "hotel_name": "Taj Chandigarh Sector 17",
                "image_url": "/images/places/chandigarh/stays/taj-chandigarh-sector-17.webp",
                "visual_description": "Verified property artwork for Taj Chandigarh Sector 17 in Chandigarh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Luxury City Landmark Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "taj-chandigarh-sector-17",
                        "taj-sector-17"
                ]
        },
        "chandigarh:the-lalit-chandigarh": {
                "place_name": "The Lalit Chandigarh",
                "hotel_name": "The Lalit Chandigarh",
                "image_url": "/images/places/chandigarh/stays/the-lalit-chandigarh.webp",
                "visual_description": "Verified property artwork for The Lalit Chandigarh in Chandigarh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Modern Le Corbusier Design Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-lalit",
                        "the-lalit-chandigarh"
                ]
        },
        "chandigarh:jw-marriott-hotel-chandigarh": {
                "place_name": "JW Marriott Hotel Chandigarh",
                "hotel_name": "JW Marriott Hotel Chandigarh",
                "image_url": "/images/places/chandigarh/stays/jw-marriott-hotel-chandigarh.webp",
                "visual_description": "Verified property artwork for JW Marriott Hotel Chandigarh in Chandigarh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Contemporary Luxury Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jw-marriott-hotel",
                        "jw-marriott-hotel-chandigarh"
                ]
        },
        "chandigarh:backpackers-villa-chandigarh": {
                "place_name": "Backpackers Villa Chandigarh",
                "hotel_name": "Backpackers Villa Chandigarh",
                "image_url": "/images/places/chandigarh/stays/backpackers-villa-chandigarh.webp",
                "visual_description": "Verified property artwork for Backpackers Villa Chandigarh in Chandigarh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Boutique Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "backpackers-villa",
                        "backpackers-villa-chandigarh"
                ]
        },
        "damdama-sohna:the-gateway-resort-damdama-lake": {
                "place_name": "The Gateway Resort Damdama Lake",
                "hotel_name": "The Gateway Resort Damdama Lake",
                "image_url": "/images/places/damdama-sohna/stays/the-gateway-resort-damdama-lake.webp",
                "visual_description": "Verified property artwork for The Gateway Resort Damdama Lake in Damdama-Sohna.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Taj Luxury Nature Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-gateway-resort-damdama-lake"
                ]
        },
        "damdama-sohna:heritage-village-resort-and-spa": {
                "place_name": "Heritage Village Resort & Spa",
                "hotel_name": "Heritage Village Resort & Spa",
                "image_url": "/images/places/damdama-sohna/stays/heritage-village-resort-spa.webp",
                "visual_description": "Verified property artwork for Heritage Village Resort & Spa in Damdama-Sohna.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Rajasthani Haveli Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "heritage-village-resort",
                        "heritage-village-resort-and-spa",
                        "heritage-village-resort-spa",
                        "spa"
                ]
        },
        "damdama-sohna:botanix-nature-resort-and-eco-camp": {
                "place_name": "Botanix Nature Resort & Eco Camp",
                "hotel_name": "Botanix Nature Resort & Eco Camp",
                "image_url": "/images/places/damdama-sohna/stays/botanix-nature-resort-eco-camp.webp",
                "visual_description": "Verified property artwork for Botanix Nature Resort & Eco Camp in Damdama-Sohna.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Botanical Adventure Eco-Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "botanix-nature-resort",
                        "botanix-nature-resort-and-eco-camp",
                        "botanix-nature-resort-eco-camp",
                        "eco-camp"
                ]
        },
        "damdama-sohna:country-inn-and-suites-sohna-road": {
                "place_name": "Country Inn & Suites Sohna Road",
                "hotel_name": "Country Inn & Suites Sohna Road",
                "image_url": "/images/places/damdama-sohna/stays/country-inn-suites-sohna-road.webp",
                "visual_description": "Verified property artwork for Country Inn & Suites Sohna Road in Damdama-Sohna.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Contemporary Country Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "country-inn",
                        "country-inn-and-suites-sohna-road",
                        "country-inn-suites-sohna-road",
                        "suites-sohna-road"
                ]
        },
        "dehradun:walterre-resort-boutique-lodge": {
                "place_name": "Walterre Resort Boutique Lodge",
                "hotel_name": "Walterre Resort Boutique Lodge",
                "image_url": "/images/places/dehradun/stays/walterre-resort-boutique-lodge.webp",
                "visual_description": "Verified property artwork for Walterre Resort Boutique Lodge in Dehradun.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Colonial Foothill Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "walterre-resort-boutique-lodge"
                ]
        },
        "dehradun:lemon-tree-hotel-dehradun": {
                "place_name": "Lemon Tree Hotel Dehradun",
                "hotel_name": "Lemon Tree Hotel Dehradun",
                "image_url": "/images/places/dehradun/stays/lemon-tree-hotel-dehradun.webp",
                "visual_description": "Verified property artwork for Lemon Tree Hotel Dehradun in Dehradun.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Contemporary City Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "lemon-tree-hotel",
                        "lemon-tree-hotel-dehradun"
                ]
        },
        "dehradun:saiva-hill-resort-rajpur": {
                "place_name": "Saiva Hill Resort Rajpur",
                "hotel_name": "Saiva Hill Resort Rajpur",
                "image_url": "/images/places/dehradun/stays/saiva-hill-resort-rajpur.webp",
                "visual_description": "Verified property artwork for Saiva Hill Resort Rajpur in Dehradun.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Eco-Retreat Foothill Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "saiva-hill-resort-rajpur"
                ]
        },
        "dehradun:nomads-hostel-dehradun": {
                "place_name": "Nomads Hostel Dehradun",
                "hotel_name": "Nomads Hostel Dehradun",
                "image_url": "/images/places/dehradun/stays/nomads-hostel-dehradun.webp",
                "visual_description": "Verified property artwork for Nomads Hostel Dehradun in Dehradun.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Garden Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "nomads-hostel",
                        "nomads-hostel-dehradun"
                ]
        },
        "dharamshala:fortune-park-moksha": {
                "place_name": "Fortune Park Moksha",
                "hotel_name": "Fortune Park Moksha",
                "image_url": "/images/places/dharamshala/stays/fortune-park-moksha.webp",
                "visual_description": "Verified property artwork for Fortune Park Moksha in Dharamshala.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Luxury Mountain Resort & Spa",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "fortune-park-moksha"
                ]
        },
        "dharamshala:chonor-house-tibetan-guesthouse": {
                "place_name": "Chonor House Tibetan Guesthouse",
                "hotel_name": "Chonor House Tibetan Guesthouse",
                "image_url": "/images/places/dharamshala/stays/chonor-house-tibetan-guesthouse.webp",
                "visual_description": "Verified property artwork for Chonor House Tibetan Guesthouse in Dharamshala.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Tibetan Heritage Guesthouse",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chonor-house-tibetan-guesthouse"
                ]
        },
        "dharamshala:clouds-end-villa-heritage-estate": {
                "place_name": "Clouds End Villa Heritage Estate",
                "hotel_name": "Clouds End Villa Heritage Estate",
                "image_url": "/images/places/dharamshala/stays/clouds-end-villa-heritage-estate.webp",
                "visual_description": "Verified property artwork for Clouds End Villa Heritage Estate in Dharamshala.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Colonial Heritage Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "clouds-end-villa-heritage-estate"
                ]
        },
        "dharamshala:zostel-dharamkot": {
                "place_name": "Zostel Dharamkot",
                "hotel_name": "Zostel Dharamkot",
                "image_url": "/images/places/dharamshala/stays/zostel-dharamkot.webp",
                "visual_description": "Verified property artwork for Zostel Dharamkot in Dharamshala.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Forest Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "zostel-dharamkot"
                ]
        },
        "goa:ahilya-by-the-sea": {
                "place_name": "Ahilya by the Sea",
                "hotel_name": "Ahilya by the Sea",
                "image_url": "/images/places/goa/stays/ahilya-by-the-sea.webp",
                "visual_description": "Verified property artwork for Ahilya by the Sea in Goa.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Heritage Luxury Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ahilya-by-the-sea"
                ]
        },
        "goa:the-postcard-velha": {
                "place_name": "The Postcard Velha",
                "hotel_name": "The Postcard Velha",
                "image_url": "/images/places/goa/stays/the-postcard-velha.webp",
                "visual_description": "Verified property artwork for The Postcard Velha in Goa.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Estate",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-postcard-velha"
                ]
        },
        "goa:casa-da-graca-heritage-homestay": {
                "place_name": "Casa da Gra\u00e7a Heritage Homestay",
                "hotel_name": "Casa da Gra\u00e7a Heritage Homestay",
                "image_url": "/images/places/goa/stays/casa-da-gra\u00e7a-heritage-homestay.webp",
                "visual_description": "Verified property artwork for Casa da Gra\u00e7a Heritage Homestay in Goa.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Portuguese Heritage Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "casa-da-graca-heritage-homestay",
                        "casa-da-gra\u00e7a-heritage-homestay"
                ]
        },
        "goa:jungle-by-the-hosteller": {
                "place_name": "Jungle by the Hosteller",
                "hotel_name": "Jungle by the Hosteller",
                "image_url": "/images/places/goa/stays/jungle-by-the-hosteller.webp",
                "visual_description": "Verified property artwork for Jungle by the Hosteller in Goa.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Social Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jungle-by-the-hosteller"
                ]
        },
        "jaipur:samode-haveli": {
                "place_name": "Samode Haveli",
                "hotel_name": "Samode Haveli",
                "image_url": "/images/places/jaipur/stays/samode-haveli.webp",
                "visual_description": "Verified property artwork for Samode Haveli in Jaipur.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Royal Heritage Haveli",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "samode-haveli"
                ]
        },
        "jaipur:28-kothi-boutique-guesthouse": {
                "place_name": "28 Kothi Boutique Guesthouse",
                "hotel_name": "28 Kothi Boutique Guesthouse",
                "image_url": "/images/places/jaipur/stays/28-kothi-boutique-guesthouse.webp",
                "visual_description": "Verified property artwork for 28 Kothi Boutique Guesthouse in Jaipur.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Design Boutique Stay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "28-kothi-boutique-guesthouse"
                ]
        },
        "jaipur:royal-heritage-haveli-by-khatukar": {
                "place_name": "Royal Heritage Haveli by Khatukar",
                "hotel_name": "Royal Heritage Haveli by Khatukar",
                "image_url": "/images/places/jaipur/stays/royal-heritage-haveli-by-khatukar.webp",
                "visual_description": "Verified property artwork for Royal Heritage Haveli by Khatukar in Jaipur.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Heritage Palace Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "royal-heritage-haveli-by-khatukar"
                ]
        },
        "jaipur:moustache-jaipur": {
                "place_name": "Moustache Jaipur",
                "hotel_name": "Moustache Jaipur",
                "image_url": "/images/places/jaipur/stays/moustache-jaipur.webp",
                "visual_description": "Verified property artwork for Moustache Jaipur in Jaipur.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Cultural Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "moustache",
                        "moustache-jaipur"
                ]
        },
        "jaisalmer:suryagarh-jaisalmer": {
                "place_name": "Suryagarh Jaisalmer",
                "hotel_name": "Suryagarh Jaisalmer",
                "image_url": "/images/places/jaisalmer/stays/suryagarh-jaisalmer.webp",
                "visual_description": "Verified property artwork for Suryagarh Jaisalmer in Jaisalmer.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Luxury Desert Fortress Palace",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "suryagarh",
                        "suryagarh-jaisalmer"
                ]
        },
        "jaisalmer:killa-bhawan-heritage-stay": {
                "place_name": "Killa Bhawan Heritage Stay",
                "hotel_name": "Killa Bhawan Heritage Stay",
                "image_url": "/images/places/jaisalmer/stays/killa-bhawan-heritage-stay.webp",
                "visual_description": "Verified property artwork for Killa Bhawan Heritage Stay in Jaisalmer.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Inside Fort Heritage Boutique",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "killa-bhawan-heritage-stay"
                ]
        },
        "jaisalmer:jaisalmer-marriott-resort-and-spa": {
                "place_name": "Jaisalmer Marriott Resort & Spa",
                "hotel_name": "Jaisalmer Marriott Resort & Spa",
                "image_url": "/images/places/jaisalmer/stays/jaisalmer-marriott-resort-spa.webp",
                "visual_description": "Verified property artwork for Jaisalmer Marriott Resort & Spa in Jaisalmer.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Modern Luxury Palace Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jaisalmer-marriott-resort",
                        "jaisalmer-marriott-resort-and-spa",
                        "jaisalmer-marriott-resort-spa",
                        "marriott-resort-spa",
                        "spa"
                ]
        },
        "jaisalmer:zostel-jaisalmer": {
                "place_name": "Zostel Jaisalmer",
                "hotel_name": "Zostel Jaisalmer",
                "image_url": "/images/places/jaisalmer/stays/zostel-jaisalmer.webp",
                "visual_description": "Verified property artwork for Zostel Jaisalmer in Jaisalmer.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Fort View Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "zostel",
                        "zostel-jaisalmer"
                ]
        },
        "kainchi-dham:bara-bungalow-gethia-1898-heritage": {
                "place_name": "Bara Bungalow Gethia (1898 Heritage)",
                "hotel_name": "Bara Bungalow Gethia (1898 Heritage)",
                "image_url": "/images/places/kainchi-dham/stays/bara-bungalow-gethia-1898-heritage.webp",
                "visual_description": "Verified property artwork for Bara Bungalow Gethia (1898 Heritage) in Kainchi-Dham.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Historic Kumaon Heritage Estate",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "1898-heritage",
                        "bara-bungalow-gethia",
                        "bara-bungalow-gethia-1898-heritage"
                ]
        },
        "kainchi-dham:the-hermitage-bhowali": {
                "place_name": "The Hermitage Bhowali",
                "hotel_name": "The Hermitage Bhowali",
                "image_url": "/images/places/kainchi-dham/stays/the-hermitage-bhowali.webp",
                "visual_description": "Verified property artwork for The Hermitage Bhowali in Kainchi-Dham.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Pine Valley Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-hermitage-bhowali"
                ]
        },
        "kainchi-dham:kainchi-valley-spiritual-homestay": {
                "place_name": "Kainchi Valley Spiritual Homestay",
                "hotel_name": "Kainchi Valley Spiritual Homestay",
                "image_url": "/images/places/kainchi-dham/stays/kainchi-valley-spiritual-homestay.webp",
                "visual_description": "Verified property artwork for Kainchi Valley Spiritual Homestay in Kainchi-Dham.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Devotional Valley Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kainchi-valley-spiritual-homestay"
                ]
        },
        "kainchi-dham:the-green-glade-resort-bhimtal": {
                "place_name": "The Green Glade Resort Bhimtal",
                "hotel_name": "The Green Glade Resort Bhimtal",
                "image_url": "/images/places/kainchi-dham/stays/the-green-glade-resort-bhimtal.webp",
                "visual_description": "Verified property artwork for The Green Glade Resort Bhimtal in Kainchi-Dham.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Lakeside Valley Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-green-glade-resort-bhimtal"
                ]
        },
        "kasol:the-himalayan-village": {
                "place_name": "The Himalayan Village",
                "hotel_name": "The Himalayan Village",
                "image_url": "/images/places/kasol/stays/the-himalayan-village.webp",
                "visual_description": "Verified property artwork for The Himalayan Village in Kasol.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Kathkuni Heritage Eco-Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-himalayan-village"
                ]
        },
        "kasol:parvati-kuteer-riverside-wood-cottages": {
                "place_name": "Parvati Kuteer Riverside Wood Cottages",
                "hotel_name": "Parvati Kuteer Riverside Wood Cottages",
                "image_url": "/images/places/kasol/stays/parvati-kuteer-riverside-wood-cottages.webp",
                "visual_description": "Verified property artwork for Parvati Kuteer Riverside Wood Cottages in Kasol.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Riverside Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "parvati-kuteer-riverside-wood-cottages"
                ]
        },
        "kasol:kasol-heights-resort": {
                "place_name": "Kasol Heights Resort",
                "hotel_name": "Kasol Heights Resort",
                "image_url": "/images/places/kasol/stays/kasol-heights-resort.webp",
                "visual_description": "Verified property artwork for Kasol Heights Resort in Kasol.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Mountain View Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "heights-resort",
                        "kasol-heights-resort"
                ]
        },
        "kasol:the-hosteller-kasol-riverside": {
                "place_name": "The Hosteller Kasol (Riverside)",
                "hotel_name": "The Hosteller Kasol (Riverside)",
                "image_url": "/images/places/kasol/stays/the-hosteller-kasol-riverside.webp",
                "visual_description": "Verified property artwork for The Hosteller Kasol (Riverside) in Kasol.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Social River Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-hosteller-kasol",
                        "the-hosteller-kasol-riverside",
                        "the-hosteller-riverside"
                ]
        },
        "lansdowne:the-lansdowne-woods-boutique-resort": {
                "place_name": "The Lansdowne Woods Boutique Resort",
                "hotel_name": "The Lansdowne Woods Boutique Resort",
                "image_url": "/images/places/lansdowne/stays/the-lansdowne-woods-boutique-resort.webp",
                "visual_description": "Verified property artwork for The Lansdowne Woods Boutique Resort in Lansdowne.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Pine Valley Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-lansdowne-woods-boutique-resort",
                        "the-woods-boutique-resort"
                ]
        },
        "lansdowne:kasang-regency-hill-resort": {
                "place_name": "Kasang Regency Hill Resort",
                "hotel_name": "Kasang Regency Hill Resort",
                "image_url": "/images/places/lansdowne/stays/kasang-regency-hill-resort.webp",
                "visual_description": "Verified property artwork for Kasang Regency Hill Resort in Lansdowne.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Garhwal Hilltop Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kasang-regency-hill-resort"
                ]
        },
        "lansdowne:fairydale-resort-colonial-cottage": {
                "place_name": "Fairydale Resort Colonial Cottage",
                "hotel_name": "Fairydale Resort Colonial Cottage",
                "image_url": "/images/places/lansdowne/stays/fairydale-resort-colonial-cottage.webp",
                "visual_description": "Verified property artwork for Fairydale Resort Colonial Cottage in Lansdowne.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "1912 Colonial Oak Cottage",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "fairydale-resort-colonial-cottage"
                ]
        },
        "lansdowne:sb-mount-resort-lansdowne": {
                "place_name": "SB Mount Resort Lansdowne",
                "hotel_name": "SB Mount Resort Lansdowne",
                "image_url": "/images/places/lansdowne/stays/sb-mount-resort-lansdowne.webp",
                "visual_description": "Verified property artwork for SB Mount Resort Lansdowne in Lansdowne.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Mountain View Valley Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "sb-mount-resort",
                        "sb-mount-resort-lansdowne"
                ]
        },
        "leh:the-grand-dragon-ladakh": {
                "place_name": "The Grand Dragon Ladakh",
                "hotel_name": "The Grand Dragon Ladakh",
                "image_url": "/images/places/leh/stays/the-grand-dragon-ladakh.webp",
                "visual_description": "Verified property artwork for The Grand Dragon Ladakh in Leh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Luxury High-Altitude Solar Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-grand-dragon-ladakh"
                ]
        },
        "leh:nimmu-house-heritage-eco-resort": {
                "place_name": "Nimmu House Heritage Eco-Resort",
                "hotel_name": "Nimmu House Heritage Eco-Resort",
                "image_url": "/images/places/leh/stays/nimmu-house-heritage-eco-resort.webp",
                "visual_description": "Verified property artwork for Nimmu House Heritage Eco-Resort in Leh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "1905 Ladakhi Heritage Mansion",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "nimmu-house-heritage-eco-resort"
                ]
        },
        "leh:stok-palace-heritage-guesthouse": {
                "place_name": "Stok Palace Heritage Guesthouse",
                "hotel_name": "Stok Palace Heritage Guesthouse",
                "image_url": "/images/places/leh/stays/stok-palace-heritage-guesthouse.webp",
                "visual_description": "Verified property artwork for Stok Palace Heritage Guesthouse in Leh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Royal Residence Heritage Stay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "stok-palace-heritage-guesthouse"
                ]
        },
        "leh:zostel-leh": {
                "place_name": "Zostel Leh",
                "hotel_name": "Zostel Leh",
                "image_url": "/images/places/leh/stays/zostel-leh.webp",
                "visual_description": "Verified property artwork for Zostel Leh in Leh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker High-Pass Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "zostel",
                        "zostel-leh"
                ]
        },
        "manali:the-himalayan-castle-and-stone-cottages": {
                "place_name": "The Himalayan Castle & Stone Cottages",
                "hotel_name": "The Himalayan Castle & Stone Cottages",
                "image_url": "/images/places/manali/stays/the-himalayan-castle-stone-cottages.webp",
                "visual_description": "Verified property artwork for The Himalayan Castle & Stone Cottages in Manali.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Victorian Gothic Mountain Castle",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "stone-cottages",
                        "the-himalayan",
                        "the-himalayan-castle",
                        "the-himalayan-castle-and-stone-cottages",
                        "the-himalayan-castle-stone-cottages",
                        "the-himalayan-woods-boutique-retreat"
                ]
        },
        "manali:larisa-resort-and-apple-orchard": {
                "place_name": "Larisa Resort & Apple Orchard",
                "hotel_name": "Larisa Resort & Apple Orchard",
                "image_url": "/images/places/manali/stays/larisa-resort-apple-orchard.webp",
                "visual_description": "Verified property artwork for Larisa Resort & Apple Orchard in Manali.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Luxury Eco-Resort & Spa",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "apple-orchard",
                        "larisa",
                        "larisa-resort",
                        "larisa-resort-and-apple-orchard",
                        "larisa-resort-apple-orchard"
                ]
        },
        "manali:drifters-inn-and-wooden-loft": {
                "place_name": "Drifters' Inn & Wooden Loft",
                "hotel_name": "Drifters' Inn & Wooden Loft",
                "image_url": "/images/places/manali/stays/drifters-inn-wooden-loft.webp",
                "visual_description": "Verified property artwork for Drifters' Inn & Wooden Loft in Manali.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Mountain Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "drifters-cafe",
                        "drifters-cafe-and-acoustic-inn",
                        "drifters-inn",
                        "drifters-inn-and-wooden-loft",
                        "drifters-inn-wooden-loft",
                        "wooden-loft"
                ]
        },
        "manali:zostel-manali-old-manali": {
                "place_name": "Zostel Manali (Old Manali)",
                "hotel_name": "Zostel Manali (Old Manali)",
                "image_url": "/images/places/manali/stays/zostel-manali-old-manali.webp",
                "visual_description": "Verified property artwork for Zostel Manali (Old Manali) in Manali.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Pine View Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "old-manali",
                        "zostel-manali",
                        "zostel-manali-old-manali",
                        "zostel-old"
                ]
        },
        "mathura-vrindavan:nidhivan-sarovar-portico": {
                "place_name": "Nidhivan Sarovar Portico",
                "hotel_name": "Nidhivan Sarovar Portico",
                "image_url": "/images/places/mathura-vrindavan/stays/nidhivan-sarovar-portico.webp",
                "visual_description": "Verified property artwork for Nidhivan Sarovar Portico in Mathura-Vrindavan.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Upscale Spiritual Pilgrimage Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "nidhivan-sarovar-portico"
                ]
        },
        "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant": {
                "place_name": "MVT Guesthouse & Garden Restaurant",
                "hotel_name": "MVT Guesthouse & Garden Restaurant",
                "image_url": "/images/places/mathura-vrindavan/stays/mvt-guesthouse-garden-restaurant.webp",
                "visual_description": "Verified property artwork for MVT Guesthouse & Garden Restaurant in Mathura-Vrindavan.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Vrindavan Ashram Guesthouse",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "garden-restaurant",
                        "mvt-guesthouse",
                        "mvt-guesthouse-and-garden-restaurant",
                        "mvt-guesthouse-garden-restaurant"
                ]
        },
        "mathura-vrindavan:brij-view-vrindavan-luxury-suites": {
                "place_name": "Brij View Vrindavan Luxury Suites",
                "hotel_name": "Brij View Vrindavan Luxury Suites",
                "image_url": "/images/places/mathura-vrindavan/stays/brij-view-vrindavan-luxury-suites.webp",
                "visual_description": "Verified property artwork for Brij View Vrindavan Luxury Suites in Mathura-Vrindavan.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Temple View Suites",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "brij-view-vrindavan-luxury-suites"
                ]
        },
        "mathura-vrindavan:radha-krishna-kripa-dham-homestay": {
                "place_name": "Radha Krishna Kripa Dham Homestay",
                "hotel_name": "Radha Krishna Kripa Dham Homestay",
                "image_url": "/images/places/mathura-vrindavan/stays/radha-krishna-kripa-dham-homestay.webp",
                "visual_description": "Verified property artwork for Radha Krishna Kripa Dham Homestay in Mathura-Vrindavan.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Traditional Braj Pilgrim Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "radha-krishna-kripa-dham-homestay"
                ]
        },
        "morni-hills:royal-morni-resort": {
                "place_name": "Royal Morni Resort",
                "hotel_name": "Royal Morni Resort",
                "image_url": "/images/places/morni-hills/stays/royal-morni-resort.webp",
                "visual_description": "Verified property artwork for Royal Morni Resort in Morni-Hills.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Shivalik Mountain View Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "royal-morni-resort"
                ]
        },
        "morni-hills:mountain-quail-tourist-resort-tikkar-taal": {
                "place_name": "Mountain Quail Tourist Resort Tikkar Taal",
                "hotel_name": "Mountain Quail Tourist Resort Tikkar Taal",
                "image_url": "/images/places/morni-hills/stays/mountain-quail-tourist-resort-tikkar-taal.webp",
                "visual_description": "Verified property artwork for Mountain Quail Tourist Resort Tikkar Taal in Morni-Hills.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Lakeside Tourist Eco-Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mountain-quail-tourist-resort-tikkar-taal"
                ]
        },
        "morni-hills:shivalik-ridge-village-homestay": {
                "place_name": "Shivalik Ridge Village Homestay",
                "hotel_name": "Shivalik Ridge Village Homestay",
                "image_url": "/images/places/morni-hills/stays/shivalik-ridge-village-homestay.webp",
                "visual_description": "Verified property artwork for Shivalik Ridge Village Homestay in Morni-Hills.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Traditional Hill Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shivalik-ridge-village-homestay"
                ]
        },
        "morni-hills:hilltop-forest-cottage-morni": {
                "place_name": "Hilltop Forest Cottage Morni",
                "hotel_name": "Hilltop Forest Cottage Morni",
                "image_url": "/images/places/morni-hills/stays/hilltop-forest-cottage-morni.webp",
                "visual_description": "Verified property artwork for Hilltop Forest Cottage Morni in Morni-Hills.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Wood Cottage",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hilltop-forest-cottage-morni"
                ]
        },
        "munnar:windermere-estate": {
                "place_name": "Windermere Estate",
                "hotel_name": "Windermere Estate",
                "image_url": "/images/places/munnar/stays/windermere-estate.webp",
                "visual_description": "Verified property artwork for Windermere Estate in Munnar.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Colonial Tea Plantation Retreat",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "windermere-estate"
                ]
        },
        "munnar:blanket-luxury-villa-and-spa": {
                "place_name": "Blanket Luxury Villa & Spa",
                "hotel_name": "Blanket Luxury Villa & Spa",
                "image_url": "/images/places/munnar/stays/blanket-luxury-villa-spa.webp",
                "visual_description": "Verified property artwork for Blanket Luxury Villa & Spa in Munnar.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Attukad Waterfall Luxury Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "blanket-luxury-villa",
                        "blanket-luxury-villa-and-spa",
                        "blanket-luxury-villa-spa",
                        "spa"
                ]
        },
        "munnar:olive-brook-plantation-homestay": {
                "place_name": "Olive Brook Plantation Homestay",
                "hotel_name": "Olive Brook Plantation Homestay",
                "image_url": "/images/places/munnar/stays/olive-brook-plantation-homestay.webp",
                "visual_description": "Verified property artwork for Olive Brook Plantation Homestay in Munnar.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Spice Garden Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "olive-brook-plantation-homestay"
                ]
        },
        "munnar:the-hosteller-munnar": {
                "place_name": "The Hosteller Munnar",
                "hotel_name": "The Hosteller Munnar",
                "image_url": "/images/places/munnar/stays/the-hosteller-munnar.webp",
                "visual_description": "Verified property artwork for The Hosteller Munnar in Munnar.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Tea Hills Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-hosteller",
                        "the-hosteller-munnar"
                ]
        },
        "murthal:grand-haveli-resort-murthal": {
                "place_name": "Grand Haveli Resort Murthal",
                "hotel_name": "Grand Haveli Resort Murthal",
                "image_url": "/images/places/murthal/stays/grand-haveli-resort-murthal.webp",
                "visual_description": "Verified property artwork for Grand Haveli Resort Murthal in Murthal.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Royal Punjabi Heritage Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "grand-haveli-resort",
                        "grand-haveli-resort-murthal"
                ]
        },
        "murthal:tivoli-heritage-grand-nh-44": {
                "place_name": "Tivoli Heritage Grand NH-44",
                "hotel_name": "Tivoli Heritage Grand NH-44",
                "image_url": "/images/places/murthal/stays/tivoli-heritage-grand-nh-44.webp",
                "visual_description": "Verified property artwork for Tivoli Heritage Grand NH-44 in Murthal.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Luxury Highway Resort & Spa",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tivoli-heritage-grand-nh-44"
                ]
        },
        "murthal:highway-king-hotel-sonipat": {
                "place_name": "Highway King Hotel Sonipat",
                "hotel_name": "Highway King Hotel Sonipat",
                "image_url": "/images/places/murthal/stays/highway-king-hotel-sonipat.webp",
                "visual_description": "Verified property artwork for Highway King Hotel Sonipat in Murthal.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Comfortable Highway Transit Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "highway-king-hotel-sonipat"
                ]
        },
        "murthal:star-hotel-and-suites-murthal": {
                "place_name": "Star Hotel & Suites Murthal",
                "hotel_name": "Star Hotel & Suites Murthal",
                "image_url": "/images/places/murthal/stays/star-hotel-suites-murthal.webp",
                "visual_description": "Verified property artwork for Star Hotel & Suites Murthal in Murthal.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Modern Highway Boutique Stay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "star-hotel",
                        "star-hotel-and-suites-murthal",
                        "star-hotel-suites",
                        "star-hotel-suites-murthal",
                        "suites-murthal"
                ]
        },
        "mussoorie:rokeby-manor-landour": {
                "place_name": "Rokeby Manor Landour",
                "hotel_name": "Rokeby Manor Landour",
                "image_url": "/images/places/mussoorie/stays/rokeby-manor-landour.webp",
                "visual_description": "Verified property artwork for Rokeby Manor Landour in Mussoorie.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "1840 English Country Manor",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "rokeby-manor-landour"
                ]
        },
        "mussoorie:welcomhotel-the-savoy": {
                "place_name": "Welcomhotel The Savoy",
                "hotel_name": "Welcomhotel The Savoy",
                "image_url": "/images/places/mussoorie/stays/welcomhotel-the-savoy.webp",
                "visual_description": "Verified property artwork for Welcomhotel The Savoy in Mussoorie.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Historic Royal Heritage Grand",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "welcomhotel-the-savoy"
                ]
        },
        "mussoorie:domas-inn-tibetan-guesthouse": {
                "place_name": "Doma's Inn Tibetan Guesthouse",
                "hotel_name": "Doma's Inn Tibetan Guesthouse",
                "image_url": "/images/places/mussoorie/stays/domas-inn-tibetan-guesthouse.webp",
                "visual_description": "Verified property artwork for Doma's Inn Tibetan Guesthouse in Mussoorie.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Tibetan Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "domas-inn-tibetan-guesthouse"
                ]
        },
        "mussoorie:the-hosteller-mussoorie-mall-road": {
                "place_name": "The Hosteller Mussoorie (Mall Road)",
                "hotel_name": "The Hosteller Mussoorie (Mall Road)",
                "image_url": "/images/places/mussoorie/stays/the-hosteller-mussoorie-mall-road.webp",
                "visual_description": "Verified property artwork for The Hosteller Mussoorie (Mall Road) in Mussoorie.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Valley Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "mall-road",
                        "the-hosteller-mall-road",
                        "the-hosteller-mussoorie",
                        "the-hosteller-mussoorie-mall-road"
                ]
        },
        "neemrana:neemrana-fort-palace": {
                "place_name": "Neemrana Fort-Palace",
                "hotel_name": "Neemrana Fort-Palace",
                "image_url": "/images/places/neemrana/stays/neemrana-fort-palace.webp",
                "visual_description": "Verified property artwork for Neemrana Fort-Palace in Neemrana.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "15th-Century Stepped Royal Fortress",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "fort-palace",
                        "neemrana-fort-palace"
                ]
        },
        "neemrana:ramada-by-wyndham-neemrana": {
                "place_name": "Ramada by Wyndham Neemrana",
                "hotel_name": "Ramada by Wyndham Neemrana",
                "image_url": "/images/places/neemrana/stays/ramada-by-wyndham-neemrana.webp",
                "visual_description": "Verified property artwork for Ramada by Wyndham Neemrana in Neemrana.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Modern Business & Leisure Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ramada-by-wyndham",
                        "ramada-by-wyndham-neemrana"
                ]
        },
        "neemrana:shiva-oasis-resort": {
                "place_name": "Shiva Oasis Resort",
                "hotel_name": "Shiva Oasis Resort",
                "image_url": "/images/places/neemrana/stays/shiva-oasis-resort.webp",
                "visual_description": "Verified property artwork for Shiva Oasis Resort in Neemrana.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Aravalli Garden Resort",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "shiva-oasis-resort"
                ]
        },
        "neemrana:fort-view-heritage-homestay": {
                "place_name": "Fort View Heritage Homestay",
                "hotel_name": "Fort View Heritage Homestay",
                "image_url": "/images/places/neemrana/stays/fort-view-heritage-homestay.webp",
                "visual_description": "Verified property artwork for Fort View Heritage Homestay in Neemrana.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Village Heritage Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "fort-view-heritage-homestay"
                ]
        },
        "rishikesh:aloha-on-the-ganges": {
                "place_name": "Aloha On The Ganges",
                "hotel_name": "Aloha On The Ganges",
                "image_url": "/images/places/rishikesh/stays/aloha-on-the-ganges.webp",
                "visual_description": "Verified property artwork for Aloha On The Ganges in Rishikesh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Riverside Resort & Spa",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "aloha",
                        "aloha-ganges",
                        "aloha-on-the-ganges"
                ]
        },
        "rishikesh:glasshouse-on-the-ganges": {
                "place_name": "Glasshouse on the Ganges",
                "hotel_name": "Glasshouse on the Ganges",
                "image_url": "/images/places/rishikesh/stays/glasshouse-on-the-ganges.webp",
                "visual_description": "Verified property artwork for Glasshouse on the Ganges in Rishikesh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Citrus Orchard Retreat",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "glasshouse",
                        "glasshouse-ganges",
                        "glasshouse-on-the-ganges"
                ]
        },
        "rishikesh:ganga-kinare-riverside-sanctuary": {
                "place_name": "Ganga Kinare Riverside Sanctuary",
                "hotel_name": "Ganga Kinare Riverside Sanctuary",
                "image_url": "/images/places/rishikesh/stays/ganga-kinare-riverside-sanctuary.webp",
                "visual_description": "Verified property artwork for Ganga Kinare Riverside Sanctuary in Rishikesh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Riverside Hotel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ganga-kinare",
                        "ganga-kinare-riverside-retreat",
                        "ganga-kinare-riverside-sanctuary"
                ]
        },
        "rishikesh:zostel-rishikesh-tapovan": {
                "place_name": "Zostel Rishikesh (Tapovan)",
                "hotel_name": "Zostel Rishikesh (Tapovan)",
                "image_url": "/images/places/rishikesh/stays/zostel-rishikesh-tapovan.webp",
                "visual_description": "Verified property artwork for Zostel Rishikesh (Tapovan) in Rishikesh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Adventure Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tapovan",
                        "zostel-rishikesh",
                        "zostel-rishikesh-tapovan",
                        "zostel-tapovan"
                ]
        },
        "sariska-bhangarh:the-sariska-palace-heritage-hotel": {
                "place_name": "The Sariska Palace Heritage Hotel",
                "hotel_name": "The Sariska Palace Heritage Hotel",
                "image_url": "/images/places/sariska-bhangarh/stays/the-sariska-palace-heritage-hotel.webp",
                "visual_description": "Verified property artwork for The Sariska Palace Heritage Hotel in Sariska-Bhangarh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "1892 Royal French Hunting Palace",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "the-sariska-palace-heritage-hotel"
                ]
        },
        "sariska-bhangarh:amanbagh-luxury-sanctuary": {
                "place_name": "Amanbagh Luxury Sanctuary",
                "hotel_name": "Amanbagh Luxury Sanctuary",
                "image_url": "/images/places/sariska-bhangarh/stays/amanbagh-luxury-sanctuary.webp",
                "visual_description": "Verified property artwork for Amanbagh Luxury Sanctuary in Sariska-Bhangarh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Ultra-Luxury Mughal Haveli Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "amanbagh-luxury-sanctuary"
                ]
        },
        "sariska-bhangarh:trees-and-tigers-wildlife-resort": {
                "place_name": "Trees & Tigers Wildlife Resort",
                "hotel_name": "Trees & Tigers Wildlife Resort",
                "image_url": "/images/places/sariska-bhangarh/stays/trees-tigers-wildlife-resort.webp",
                "visual_description": "Verified property artwork for Trees & Tigers Wildlife Resort in Sariska-Bhangarh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Eco-Wildlife Jungle Lodge",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tigers-wildlife-resort",
                        "trees",
                        "trees-and-tigers-wildlife-resort",
                        "trees-tigers-wildlife-resort"
                ]
        },
        "sariska-bhangarh:vanaashrya-resort-sariska": {
                "place_name": "Vanaashrya Resort Sariska",
                "hotel_name": "Vanaashrya Resort Sariska",
                "image_url": "/images/places/sariska-bhangarh/stays/vanaashrya-resort-sariska.webp",
                "visual_description": "Verified property artwork for Vanaashrya Resort Sariska in Sariska-Bhangarh.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Luxury Cottages & Glamping",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "vanaashrya-resort-sariska"
                ]
        },
        "spiti:hotel-deyzor-kaza": {
                "place_name": "Hotel Deyzor Kaza",
                "hotel_name": "Hotel Deyzor Kaza",
                "image_url": "/images/places/spiti/stays/hotel-deyzor-kaza.webp",
                "visual_description": "Verified property artwork for Hotel Deyzor Kaza in Spiti.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique High-Altitude Lodge",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "hotel-deyzor-kaza"
                ]
        },
        "spiti:spiti-valley-eco-lodge": {
                "place_name": "Spiti Valley Eco Lodge",
                "hotel_name": "Spiti Valley Eco Lodge",
                "image_url": "/images/places/spiti/stays/spiti-valley-eco-lodge.webp",
                "visual_description": "Verified property artwork for Spiti Valley Eco Lodge in Spiti.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Eco-Sustainable Mountain Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "spiti-valley-eco-lodge",
                        "valley-eco-lodge"
                ]
        },
        "spiti:dekit-norbu-homestay-kaza": {
                "place_name": "Dekit Norbu Homestay Kaza",
                "hotel_name": "Dekit Norbu Homestay Kaza",
                "image_url": "/images/places/spiti/stays/dekit-norbu-homestay-kaza.webp",
                "visual_description": "Verified property artwork for Dekit Norbu Homestay Kaza in Spiti.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Traditional Spitian Mud Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "dekit-norbu-homestay-kaza"
                ]
        },
        "spiti:zostel-spiti-kaza": {
                "place_name": "Zostel Spiti (Kaza)",
                "hotel_name": "Zostel Spiti (Kaza)",
                "image_url": "/images/places/spiti/stays/zostel-spiti-kaza.webp",
                "visual_description": "Verified property artwork for Zostel Spiti (Kaza) in Spiti.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Trans-Himalayan Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "kaza",
                        "zostel-kaza",
                        "zostel-spiti",
                        "zostel-spiti-kaza"
                ]
        },
        "tungnath-chandrashila:alpine-meadow-eco-lodge-chopta": {
                "place_name": "Alpine Meadow Eco Lodge Chopta",
                "hotel_name": "Alpine Meadow Eco Lodge Chopta",
                "image_url": "/images/places/tungnath-chandrashila/stays/alpine-meadow-eco-lodge-chopta.webp",
                "visual_description": "Verified property artwork for Alpine Meadow Eco Lodge Chopta in Tungnath-Chandrashila.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "High Alpine Eco Lodge",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "alpine-meadow-eco-lodge-chopta"
                ]
        },
        "tungnath-chandrashila:magpie-jungle-camp-chopta": {
                "place_name": "Magpie Jungle Camp Chopta",
                "hotel_name": "Magpie Jungle Camp Chopta",
                "image_url": "/images/places/tungnath-chandrashila/stays/magpie-jungle-camp-chopta.webp",
                "visual_description": "Verified property artwork for Magpie Jungle Camp Chopta in Tungnath-Chandrashila.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "High-Altitude Wilderness Safari Camp",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "magpie-jungle-camp-chopta"
                ]
        },
        "tungnath-chandrashila:chopta-meadows-homestay-sari-base": {
                "place_name": "Chopta Meadows Homestay (Sari Base)",
                "hotel_name": "Chopta Meadows Homestay (Sari Base)",
                "image_url": "/images/places/tungnath-chandrashila/stays/chopta-meadows-homestay-sari-base.webp",
                "visual_description": "Verified property artwork for Chopta Meadows Homestay (Sari Base) in Tungnath-Chandrashila.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Traditional Garhwali Village Homestay",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "chopta-meadows-homestay",
                        "chopta-meadows-homestay-sari-base",
                        "sari-base"
                ]
        },
        "tungnath-chandrashila:monal-himalayan-resort-dugalbitta": {
                "place_name": "Monal Himalayan Resort Dugalbitta",
                "hotel_name": "Monal Himalayan Resort Dugalbitta",
                "image_url": "/images/places/tungnath-chandrashila/stays/monal-himalayan-resort-dugalbitta.webp",
                "visual_description": "Verified property artwork for Monal Himalayan Resort Dugalbitta in Tungnath-Chandrashila.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Mountain View Stone Lodge",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "monal-himalayan-resort-dugalbitta"
                ]
        },
        "udaipur:jagat-niwas-palace-hotel": {
                "place_name": "Jagat Niwas Palace Hotel",
                "hotel_name": "Jagat Niwas Palace Hotel",
                "image_url": "/images/places/udaipur/stays/jagat-niwas-palace-hotel.webp",
                "visual_description": "Verified property artwork for Jagat Niwas Palace Hotel in Udaipur.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "17th-Century Lakeside Haveli",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "jagat-niwas-palace-hotel"
                ]
        },
        "udaipur:amet-haveli-heritage-hotel": {
                "place_name": "Amet Haveli Heritage Hotel",
                "hotel_name": "Amet Haveli Heritage Hotel",
                "image_url": "/images/places/udaipur/stays/amet-haveli-heritage-hotel.webp",
                "visual_description": "Verified property artwork for Amet Haveli Heritage Hotel in Udaipur.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Waterfront Heritage Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "amet-haveli-heritage-hotel"
                ]
        },
        "udaipur:tribute-lakeside-boutique-stay": {
                "place_name": "Tribute Lakeside Boutique Stay",
                "hotel_name": "Tribute Lakeside Boutique Stay",
                "image_url": "/images/places/udaipur/stays/tribute-lakeside-boutique-stay.webp",
                "visual_description": "Verified property artwork for Tribute Lakeside Boutique Stay in Udaipur.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Lake Retreat",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "tribute-lakeside-boutique-stay"
                ]
        },
        "udaipur:zostel-udaipur": {
                "place_name": "Zostel Udaipur",
                "hotel_name": "Zostel Udaipur",
                "image_url": "/images/places/udaipur/stays/zostel-udaipur.webp",
                "visual_description": "Verified property artwork for Zostel Udaipur in Udaipur.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Lakeside Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "zostel",
                        "zostel-udaipur"
                ]
        },
        "varanasi:brijrama-palace-heritage-grand": {
                "place_name": "BrijRama Palace Heritage Grand",
                "hotel_name": "BrijRama Palace Heritage Grand",
                "image_url": "/images/places/varanasi/stays/brijrama-palace.webp",
                "visual_description": "Verified property artwork for BrijRama Palace Heritage Grand in Varanasi.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "18th-Century Ghat Palace",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "brijrama-palace",
                        "brijrama-palace-heritage-grand"
                ]
        },
        "varanasi:ganges-view-heritage-hotel": {
                "place_name": "Ganges View Heritage Hotel",
                "hotel_name": "Ganges View Heritage Hotel",
                "image_url": "/images/places/varanasi/stays/ganges-view-heritage-hotel.webp",
                "visual_description": "Verified property artwork for Ganges View Heritage Hotel in Varanasi.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Cultural Heritage Sanctuary",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "ganges-view-heritage-hotel"
                ]
        },
        "varanasi:amritara-suryauday-haveli": {
                "place_name": "Amritara Suryauday Haveli",
                "hotel_name": "Amritara Suryauday Haveli",
                "image_url": "/images/places/varanasi/stays/amritara-suryauday-haveli.webp",
                "visual_description": "Verified property artwork for Amritara Suryauday Haveli in Varanasi.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Boutique Riverfront Haveli",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "amritara-suryauday-haveli"
                ]
        },
        "varanasi:stops-hostel-varanasi": {
                "place_name": "Stops Hostel Varanasi",
                "hotel_name": "Stops Hostel Varanasi",
                "image_url": "/images/places/varanasi/stays/stops-hostel-varanasi.webp",
                "visual_description": "Verified property artwork for Stops Hostel Varanasi in Varanasi.",
                "category": "Stays & Sanctuaries",
                "hotel_style": "Backpacker Social Hostel",
                "semantic_theme": "stay",
                "source_type": "editorial_artwork",
                "source": "vanvas_curated",
                "aliases": [
                        "stops-hostel",
                        "stops-hostel-varanasi"
                ]
        }
}

    DESTINATION_CATEGORY_REGISTRY: Dict[str, Dict[str, Any]] = {
        "goa": {
                "generic": "/images/destinations/goa/hero.jpg",
                "categories": {
                        "stay": "/images/places/goa/categories/stay.webp",
                        "cafe": "/images/places/goa/categories/cafe.webp",
                        "food": "/images/places/goa/categories/food.webp",
                        "nature": "/images/places/goa/categories/nature.webp",
                        "trail": "/images/places/goa/categories/nature.webp",
                        "heritage": "/images/places/goa/categories/heritage.webp",
                        "spiritual": "/images/places/goa/categories/spiritual.webp",
                        "viewpoint": "/images/places/goa/categories/viewpoint.webp",
                        "waterfall": "/images/places/goa/categories/waterfall.webp",
                        "lake": "/images/places/goa/categories/lake.webp",
                        "monastery": "/images/places/goa/categories/monastery.webp",
                        "church": "/images/places/goa/categories/church.webp",
                        "beach": "/images/places/goa/categories/beach.webp",
                        "shopping": "/images/places/goa/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "jaipur": {
                "generic": "/images/destinations/jaipur/hero.jpg",
                "categories": {
                        "stay": "/images/places/jaipur/categories/stay.webp",
                        "cafe": "/images/places/jaipur/categories/cafe.webp",
                        "food": "/images/places/jaipur/categories/food.webp",
                        "nature": "/images/places/jaipur/categories/nature.webp",
                        "trail": "/images/places/jaipur/categories/nature.webp",
                        "heritage": "/images/places/jaipur/categories/heritage.webp",
                        "spiritual": "/images/places/jaipur/categories/spiritual.webp",
                        "viewpoint": "/images/places/jaipur/categories/viewpoint.webp",
                        "waterfall": "/images/places/jaipur/categories/waterfall.webp",
                        "lake": "/images/places/jaipur/categories/lake.webp",
                        "monastery": "/images/places/jaipur/categories/monastery.webp",
                        "church": "/images/places/jaipur/categories/church.webp",
                        "beach": "/images/places/jaipur/categories/beach.webp",
                        "shopping": "/images/places/jaipur/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "udaipur": {
                "generic": "/images/destinations/udaipur/hero.jpg",
                "categories": {
                        "stay": "/images/places/udaipur/categories/stay.webp",
                        "cafe": "/images/places/udaipur/categories/cafe.webp",
                        "food": "/images/places/udaipur/categories/food.webp",
                        "nature": "/images/places/udaipur/categories/nature.webp",
                        "trail": "/images/places/udaipur/categories/nature.webp",
                        "heritage": "/images/places/udaipur/categories/heritage.webp",
                        "spiritual": "/images/places/udaipur/categories/spiritual.webp",
                        "viewpoint": "/images/places/udaipur/categories/viewpoint.webp",
                        "waterfall": "/images/places/udaipur/categories/waterfall.webp",
                        "lake": "/images/places/udaipur/categories/lake.webp",
                        "monastery": "/images/places/udaipur/categories/monastery.webp",
                        "church": "/images/places/udaipur/categories/church.webp",
                        "beach": "/images/places/udaipur/categories/beach.webp",
                        "shopping": "/images/places/udaipur/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "varanasi": {
                "generic": "/images/destinations/varanasi/hero.jpg",
                "categories": {
                        "stay": "/images/places/varanasi/categories/stay.webp",
                        "cafe": "/images/places/varanasi/categories/cafe.webp",
                        "food": "/images/places/varanasi/categories/food.webp",
                        "nature": "/images/places/varanasi/categories/nature.webp",
                        "trail": "/images/places/varanasi/categories/nature.webp",
                        "heritage": "/images/places/varanasi/categories/heritage.webp",
                        "spiritual": "/images/places/varanasi/categories/spiritual.webp",
                        "viewpoint": "/images/places/varanasi/categories/viewpoint.webp",
                        "waterfall": "/images/places/varanasi/categories/waterfall.webp",
                        "lake": "/images/places/varanasi/categories/lake.webp",
                        "monastery": "/images/places/varanasi/categories/monastery.webp",
                        "church": "/images/places/varanasi/categories/church.webp",
                        "beach": "/images/places/varanasi/categories/beach.webp",
                        "shopping": "/images/places/varanasi/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "mussoorie": {
                "generic": "/images/destinations/mussoorie/hero.jpg",
                "categories": {
                        "stay": "/images/places/mussoorie/categories/stay.webp",
                        "cafe": "/images/places/mussoorie/categories/cafe.webp",
                        "food": "/images/places/mussoorie/categories/food.webp",
                        "nature": "/images/places/mussoorie/categories/nature.webp",
                        "trail": "/images/places/mussoorie/categories/nature.webp",
                        "heritage": "/images/places/mussoorie/categories/heritage.webp",
                        "spiritual": "/images/places/mussoorie/categories/spiritual.webp",
                        "viewpoint": "/images/places/mussoorie/categories/viewpoint.webp",
                        "waterfall": "/images/places/mussoorie/categories/waterfall.webp",
                        "lake": "/images/places/mussoorie/categories/lake.webp",
                        "monastery": "/images/places/mussoorie/categories/monastery.webp",
                        "church": "/images/places/mussoorie/categories/church.webp",
                        "beach": "/images/places/mussoorie/categories/beach.webp",
                        "shopping": "/images/places/mussoorie/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "rishikesh": {
                "generic": "/images/destinations/rishikesh/hero.jpg",
                "categories": {
                        "stay": "/images/places/rishikesh/categories/stay.webp",
                        "cafe": "/images/places/rishikesh/categories/cafe.webp",
                        "food": "/images/places/rishikesh/categories/food.webp",
                        "nature": "/images/places/rishikesh/categories/nature.webp",
                        "trail": "/images/places/rishikesh/categories/nature.webp",
                        "heritage": "/images/places/rishikesh/categories/heritage.webp",
                        "spiritual": "/images/places/rishikesh/categories/spiritual.webp",
                        "viewpoint": "/images/places/rishikesh/categories/viewpoint.webp",
                        "waterfall": "/images/places/rishikesh/categories/waterfall.webp",
                        "lake": "/images/places/rishikesh/categories/lake.webp",
                        "monastery": "/images/places/rishikesh/categories/monastery.webp",
                        "church": "/images/places/rishikesh/categories/church.webp",
                        "beach": "/images/places/rishikesh/categories/beach.webp",
                        "shopping": "/images/places/rishikesh/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "manali": {
                "generic": "/images/destinations/manali/hero.jpg",
                "categories": {
                        "stay": "/images/places/manali/categories/stay.webp",
                        "cafe": "/images/places/manali/categories/cafe.webp",
                        "food": "/images/places/manali/categories/food.webp",
                        "nature": "/images/places/manali/categories/nature.webp",
                        "trail": "/images/places/manali/categories/nature.webp",
                        "heritage": "/images/places/manali/categories/heritage.webp",
                        "spiritual": "/images/places/manali/categories/spiritual.webp",
                        "viewpoint": "/images/places/manali/categories/viewpoint.webp",
                        "waterfall": "/images/places/manali/categories/waterfall.webp",
                        "lake": "/images/places/manali/categories/lake.webp",
                        "monastery": "/images/places/manali/categories/monastery.webp",
                        "church": "/images/places/manali/categories/church.webp",
                        "beach": "/images/places/manali/categories/beach.webp",
                        "shopping": "/images/places/manali/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "dharamshala": {
                "generic": "/images/destinations/dharamshala/hero.jpg",
                "categories": {
                        "stay": "/images/places/dharamshala/categories/stay.webp",
                        "cafe": "/images/places/dharamshala/categories/cafe.webp",
                        "food": "/images/places/dharamshala/categories/food.webp",
                        "nature": "/images/places/dharamshala/categories/nature.webp",
                        "trail": "/images/places/dharamshala/categories/nature.webp",
                        "heritage": "/images/places/dharamshala/categories/heritage.webp",
                        "spiritual": "/images/places/dharamshala/categories/spiritual.webp",
                        "viewpoint": "/images/places/dharamshala/categories/viewpoint.webp",
                        "waterfall": "/images/places/dharamshala/categories/waterfall.webp",
                        "lake": "/images/places/dharamshala/categories/lake.webp",
                        "monastery": "/images/places/dharamshala/categories/monastery.webp",
                        "church": "/images/places/dharamshala/categories/church.webp",
                        "beach": "/images/places/dharamshala/categories/beach.webp",
                        "shopping": "/images/places/dharamshala/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "kasol": {
                "generic": "/images/destinations/kasol/hero.jpg",
                "categories": {
                        "stay": "/images/places/kasol/categories/stay.webp",
                        "cafe": "/images/places/kasol/categories/cafe.webp",
                        "food": "/images/places/kasol/categories/food.webp",
                        "nature": "/images/places/kasol/categories/nature.webp",
                        "trail": "/images/places/kasol/categories/nature.webp",
                        "heritage": "/images/places/kasol/categories/heritage.webp",
                        "spiritual": "/images/places/kasol/categories/spiritual.webp",
                        "viewpoint": "/images/places/kasol/categories/viewpoint.webp",
                        "waterfall": "/images/places/kasol/categories/waterfall.webp",
                        "lake": "/images/places/kasol/categories/lake.webp",
                        "monastery": "/images/places/kasol/categories/monastery.webp",
                        "church": "/images/places/kasol/categories/church.webp",
                        "beach": "/images/places/kasol/categories/beach.webp",
                        "shopping": "/images/places/kasol/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "leh": {
                "generic": "/images/destinations/leh/hero.jpg",
                "categories": {
                        "stay": "/images/places/leh/categories/stay.webp",
                        "cafe": "/images/places/leh/categories/cafe.webp",
                        "food": "/images/places/leh/categories/food.webp",
                        "nature": "/images/places/leh/categories/nature.webp",
                        "trail": "/images/places/leh/categories/nature.webp",
                        "heritage": "/images/places/leh/categories/heritage.webp",
                        "spiritual": "/images/places/leh/categories/spiritual.webp",
                        "viewpoint": "/images/places/leh/categories/viewpoint.webp",
                        "waterfall": "/images/places/leh/categories/waterfall.webp",
                        "lake": "/images/places/leh/categories/lake.webp",
                        "monastery": "/images/places/leh/categories/monastery.webp",
                        "church": "/images/places/leh/categories/church.webp",
                        "beach": "/images/places/leh/categories/beach.webp",
                        "shopping": "/images/places/leh/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "spiti": {
                "generic": "/images/destinations/spiti/hero.jpg",
                "categories": {
                        "stay": "/images/places/spiti/categories/stay.webp",
                        "cafe": "/images/places/spiti/categories/cafe.webp",
                        "food": "/images/places/spiti/categories/food.webp",
                        "nature": "/images/places/spiti/categories/nature.webp",
                        "trail": "/images/places/spiti/categories/nature.webp",
                        "heritage": "/images/places/spiti/categories/heritage.webp",
                        "spiritual": "/images/places/spiti/categories/spiritual.webp",
                        "viewpoint": "/images/places/spiti/categories/viewpoint.webp",
                        "waterfall": "/images/places/spiti/categories/waterfall.webp",
                        "lake": "/images/places/spiti/categories/lake.webp",
                        "monastery": "/images/places/spiti/categories/monastery.webp",
                        "church": "/images/places/spiti/categories/church.webp",
                        "beach": "/images/places/spiti/categories/beach.webp",
                        "shopping": "/images/places/spiti/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "jaisalmer": {
                "generic": "/images/destinations/jaisalmer/hero.jpg",
                "categories": {
                        "stay": "/images/places/jaisalmer/categories/stay.webp",
                        "cafe": "/images/places/jaisalmer/categories/cafe.webp",
                        "food": "/images/places/jaisalmer/categories/food.webp",
                        "nature": "/images/places/jaisalmer/categories/nature.webp",
                        "trail": "/images/places/jaisalmer/categories/nature.webp",
                        "heritage": "/images/places/jaisalmer/categories/heritage.webp",
                        "spiritual": "/images/places/jaisalmer/categories/spiritual.webp",
                        "viewpoint": "/images/places/jaisalmer/categories/viewpoint.webp",
                        "waterfall": "/images/places/jaisalmer/categories/waterfall.webp",
                        "lake": "/images/places/jaisalmer/categories/lake.webp",
                        "monastery": "/images/places/jaisalmer/categories/monastery.webp",
                        "church": "/images/places/jaisalmer/categories/church.webp",
                        "beach": "/images/places/jaisalmer/categories/beach.webp",
                        "shopping": "/images/places/jaisalmer/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "munnar": {
                "generic": "/images/destinations/munnar/hero.jpg",
                "categories": {
                        "stay": "/images/places/munnar/categories/stay.webp",
                        "cafe": "/images/places/munnar/categories/cafe.webp",
                        "food": "/images/places/munnar/categories/food.webp",
                        "nature": "/images/places/munnar/categories/nature.webp",
                        "trail": "/images/places/munnar/categories/nature.webp",
                        "heritage": "/images/places/munnar/categories/heritage.webp",
                        "spiritual": "/images/places/munnar/categories/spiritual.webp",
                        "viewpoint": "/images/places/munnar/categories/viewpoint.webp",
                        "waterfall": "/images/places/munnar/categories/waterfall.webp",
                        "lake": "/images/places/munnar/categories/lake.webp",
                        "monastery": "/images/places/munnar/categories/monastery.webp",
                        "church": "/images/places/munnar/categories/church.webp",
                        "beach": "/images/places/munnar/categories/beach.webp",
                        "shopping": "/images/places/munnar/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "dehradun": {
                "generic": "/images/destinations/dehradun/hero.jpg",
                "categories": {
                        "stay": "/images/places/dehradun/categories/stay.webp",
                        "cafe": "/images/places/dehradun/categories/cafe.webp",
                        "food": "/images/places/dehradun/categories/food.webp",
                        "nature": "/images/places/dehradun/categories/nature.webp",
                        "trail": "/images/places/dehradun/categories/nature.webp",
                        "heritage": "/images/places/dehradun/categories/heritage.webp",
                        "spiritual": "/images/places/dehradun/categories/spiritual.webp",
                        "viewpoint": "/images/places/dehradun/categories/viewpoint.webp",
                        "waterfall": "/images/places/dehradun/categories/waterfall.webp",
                        "lake": "/images/places/dehradun/categories/lake.webp",
                        "monastery": "/images/places/dehradun/categories/monastery.webp",
                        "church": "/images/places/dehradun/categories/church.webp",
                        "beach": "/images/places/dehradun/categories/beach.webp",
                        "shopping": "/images/places/dehradun/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "tungnath-chandrashila": {
                "generic": "/images/destinations/tungnath-chandrashila/hero.jpg",
                "categories": {
                        "stay": "/images/places/tungnath-chandrashila/categories/stay.webp",
                        "cafe": "/images/places/tungnath-chandrashila/categories/cafe.webp",
                        "food": "/images/places/tungnath-chandrashila/categories/food.webp",
                        "nature": "/images/places/tungnath-chandrashila/categories/nature.webp",
                        "trail": "/images/places/tungnath-chandrashila/categories/nature.webp",
                        "heritage": "/images/places/tungnath-chandrashila/categories/heritage.webp",
                        "spiritual": "/images/places/tungnath-chandrashila/categories/spiritual.webp",
                        "viewpoint": "/images/places/tungnath-chandrashila/categories/viewpoint.webp",
                        "waterfall": "/images/places/tungnath-chandrashila/categories/waterfall.webp",
                        "lake": "/images/places/tungnath-chandrashila/categories/lake.webp",
                        "monastery": "/images/places/tungnath-chandrashila/categories/monastery.webp",
                        "church": "/images/places/tungnath-chandrashila/categories/church.webp",
                        "beach": "/images/places/tungnath-chandrashila/categories/beach.webp",
                        "shopping": "/images/places/tungnath-chandrashila/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "kainchi-dham": {
                "generic": "/images/destinations/kainchi-dham/hero.jpg",
                "categories": {
                        "stay": "/images/places/kainchi-dham/categories/stay.webp",
                        "cafe": "/images/places/kainchi-dham/categories/cafe.webp",
                        "food": "/images/places/kainchi-dham/categories/food.webp",
                        "nature": "/images/places/kainchi-dham/categories/nature.webp",
                        "trail": "/images/places/kainchi-dham/categories/nature.webp",
                        "heritage": "/images/places/kainchi-dham/categories/heritage.webp",
                        "spiritual": "/images/places/kainchi-dham/categories/spiritual.webp",
                        "viewpoint": "/images/places/kainchi-dham/categories/viewpoint.webp",
                        "waterfall": "/images/places/kainchi-dham/categories/waterfall.webp",
                        "lake": "/images/places/kainchi-dham/categories/lake.webp",
                        "monastery": "/images/places/kainchi-dham/categories/monastery.webp",
                        "church": "/images/places/kainchi-dham/categories/church.webp",
                        "beach": "/images/places/kainchi-dham/categories/beach.webp",
                        "shopping": "/images/places/kainchi-dham/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "agra": {
                "generic": "/images/destinations/agra/hero.jpg",
                "categories": {
                        "stay": "/images/places/agra/categories/stay.webp",
                        "cafe": "/images/places/agra/categories/cafe.webp",
                        "food": "/images/places/agra/categories/food.webp",
                        "nature": "/images/places/agra/categories/nature.webp",
                        "trail": "/images/places/agra/categories/nature.webp",
                        "heritage": "/images/places/agra/categories/heritage.webp",
                        "spiritual": "/images/places/agra/categories/spiritual.webp",
                        "viewpoint": "/images/places/agra/categories/viewpoint.webp",
                        "waterfall": "/images/places/agra/categories/waterfall.webp",
                        "lake": "/images/places/agra/categories/lake.webp",
                        "monastery": "/images/places/agra/categories/monastery.webp",
                        "church": "/images/places/agra/categories/church.webp",
                        "beach": "/images/places/agra/categories/beach.webp",
                        "shopping": "/images/places/agra/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "mathura-vrindavan": {
                "generic": "/images/destinations/mathura-vrindavan/hero.jpg",
                "categories": {
                        "stay": "/images/places/mathura-vrindavan/categories/stay.webp",
                        "cafe": "/images/places/mathura-vrindavan/categories/cafe.webp",
                        "food": "/images/places/mathura-vrindavan/categories/food.webp",
                        "nature": "/images/places/mathura-vrindavan/categories/nature.webp",
                        "trail": "/images/places/mathura-vrindavan/categories/nature.webp",
                        "heritage": "/images/places/mathura-vrindavan/categories/heritage.webp",
                        "spiritual": "/images/places/mathura-vrindavan/categories/spiritual.webp",
                        "viewpoint": "/images/places/mathura-vrindavan/categories/viewpoint.webp",
                        "waterfall": "/images/places/mathura-vrindavan/categories/waterfall.webp",
                        "lake": "/images/places/mathura-vrindavan/categories/lake.webp",
                        "monastery": "/images/places/mathura-vrindavan/categories/monastery.webp",
                        "church": "/images/places/mathura-vrindavan/categories/church.webp",
                        "beach": "/images/places/mathura-vrindavan/categories/beach.webp",
                        "shopping": "/images/places/mathura-vrindavan/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "neemrana": {
                "generic": "/images/destinations/neemrana/hero.jpg",
                "categories": {
                        "stay": "/images/places/neemrana/categories/stay.webp",
                        "cafe": "/images/places/neemrana/categories/cafe.webp",
                        "food": "/images/places/neemrana/categories/food.webp",
                        "nature": "/images/places/neemrana/categories/nature.webp",
                        "trail": "/images/places/neemrana/categories/nature.webp",
                        "heritage": "/images/places/neemrana/categories/heritage.webp",
                        "spiritual": "/images/places/neemrana/categories/spiritual.webp",
                        "viewpoint": "/images/places/neemrana/categories/viewpoint.webp",
                        "waterfall": "/images/places/neemrana/categories/waterfall.webp",
                        "lake": "/images/places/neemrana/categories/lake.webp",
                        "monastery": "/images/places/neemrana/categories/monastery.webp",
                        "church": "/images/places/neemrana/categories/church.webp",
                        "beach": "/images/places/neemrana/categories/beach.webp",
                        "shopping": "/images/places/neemrana/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "damdama-sohna": {
                "generic": "/images/destinations/damdama-sohna/hero.jpg",
                "categories": {
                        "stay": "/images/places/damdama-sohna/categories/stay.webp",
                        "cafe": "/images/places/damdama-sohna/categories/cafe.webp",
                        "food": "/images/places/damdama-sohna/categories/food.webp",
                        "nature": "/images/places/damdama-sohna/categories/nature.webp",
                        "trail": "/images/places/damdama-sohna/categories/nature.webp",
                        "heritage": "/images/places/damdama-sohna/categories/heritage.webp",
                        "spiritual": "/images/places/damdama-sohna/categories/spiritual.webp",
                        "viewpoint": "/images/places/damdama-sohna/categories/viewpoint.webp",
                        "waterfall": "/images/places/damdama-sohna/categories/waterfall.webp",
                        "lake": "/images/places/damdama-sohna/categories/lake.webp",
                        "monastery": "/images/places/damdama-sohna/categories/monastery.webp",
                        "church": "/images/places/damdama-sohna/categories/church.webp",
                        "beach": "/images/places/damdama-sohna/categories/beach.webp",
                        "shopping": "/images/places/damdama-sohna/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "alwar-siliserh": {
                "generic": "/images/destinations/alwar-siliserh/hero.jpg",
                "categories": {
                        "stay": "/images/places/alwar-siliserh/categories/stay.webp",
                        "cafe": "/images/places/alwar-siliserh/categories/cafe.webp",
                        "food": "/images/places/alwar-siliserh/categories/food.webp",
                        "nature": "/images/places/alwar-siliserh/categories/nature.webp",
                        "trail": "/images/places/alwar-siliserh/categories/nature.webp",
                        "heritage": "/images/places/alwar-siliserh/categories/heritage.webp",
                        "spiritual": "/images/places/alwar-siliserh/categories/spiritual.webp",
                        "viewpoint": "/images/places/alwar-siliserh/categories/viewpoint.webp",
                        "waterfall": "/images/places/alwar-siliserh/categories/waterfall.webp",
                        "lake": "/images/places/alwar-siliserh/categories/lake.webp",
                        "monastery": "/images/places/alwar-siliserh/categories/monastery.webp",
                        "church": "/images/places/alwar-siliserh/categories/church.webp",
                        "beach": "/images/places/alwar-siliserh/categories/beach.webp",
                        "shopping": "/images/places/alwar-siliserh/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "sariska-bhangarh": {
                "generic": "/images/destinations/sariska-bhangarh/hero.jpg",
                "categories": {
                        "stay": "/images/places/sariska-bhangarh/categories/stay.webp",
                        "cafe": "/images/places/sariska-bhangarh/categories/cafe.webp",
                        "food": "/images/places/sariska-bhangarh/categories/food.webp",
                        "nature": "/images/places/sariska-bhangarh/categories/nature.webp",
                        "trail": "/images/places/sariska-bhangarh/categories/nature.webp",
                        "heritage": "/images/places/sariska-bhangarh/categories/heritage.webp",
                        "spiritual": "/images/places/sariska-bhangarh/categories/spiritual.webp",
                        "viewpoint": "/images/places/sariska-bhangarh/categories/viewpoint.webp",
                        "waterfall": "/images/places/sariska-bhangarh/categories/waterfall.webp",
                        "lake": "/images/places/sariska-bhangarh/categories/lake.webp",
                        "monastery": "/images/places/sariska-bhangarh/categories/monastery.webp",
                        "church": "/images/places/sariska-bhangarh/categories/church.webp",
                        "beach": "/images/places/sariska-bhangarh/categories/beach.webp",
                        "shopping": "/images/places/sariska-bhangarh/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "chandigarh": {
                "generic": "/images/destinations/chandigarh/hero.jpg",
                "categories": {
                        "stay": "/images/places/chandigarh/categories/stay.webp",
                        "cafe": "/images/places/chandigarh/categories/cafe.webp",
                        "food": "/images/places/chandigarh/categories/food.webp",
                        "nature": "/images/places/chandigarh/categories/nature.webp",
                        "trail": "/images/places/chandigarh/categories/nature.webp",
                        "heritage": "/images/places/chandigarh/categories/heritage.webp",
                        "spiritual": "/images/places/chandigarh/categories/spiritual.webp",
                        "viewpoint": "/images/places/chandigarh/categories/viewpoint.webp",
                        "waterfall": "/images/places/chandigarh/categories/waterfall.webp",
                        "lake": "/images/places/chandigarh/categories/lake.webp",
                        "monastery": "/images/places/chandigarh/categories/monastery.webp",
                        "church": "/images/places/chandigarh/categories/church.webp",
                        "beach": "/images/places/chandigarh/categories/beach.webp",
                        "shopping": "/images/places/chandigarh/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "morni-hills": {
                "generic": "/images/destinations/morni-hills/hero.jpg",
                "categories": {
                        "stay": "/images/places/morni-hills/categories/stay.webp",
                        "cafe": "/images/places/morni-hills/categories/cafe.webp",
                        "food": "/images/places/morni-hills/categories/food.webp",
                        "nature": "/images/places/morni-hills/categories/nature.webp",
                        "trail": "/images/places/morni-hills/categories/nature.webp",
                        "heritage": "/images/places/morni-hills/categories/heritage.webp",
                        "spiritual": "/images/places/morni-hills/categories/spiritual.webp",
                        "viewpoint": "/images/places/morni-hills/categories/viewpoint.webp",
                        "waterfall": "/images/places/morni-hills/categories/waterfall.webp",
                        "lake": "/images/places/morni-hills/categories/lake.webp",
                        "monastery": "/images/places/morni-hills/categories/monastery.webp",
                        "church": "/images/places/morni-hills/categories/church.webp",
                        "beach": "/images/places/morni-hills/categories/beach.webp",
                        "shopping": "/images/places/morni-hills/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "lansdowne": {
                "generic": "/images/destinations/lansdowne/hero.jpg",
                "categories": {
                        "stay": "/images/places/lansdowne/categories/stay.webp",
                        "cafe": "/images/places/lansdowne/categories/cafe.webp",
                        "food": "/images/places/lansdowne/categories/food.webp",
                        "nature": "/images/places/lansdowne/categories/nature.webp",
                        "trail": "/images/places/lansdowne/categories/nature.webp",
                        "heritage": "/images/places/lansdowne/categories/heritage.webp",
                        "spiritual": "/images/places/lansdowne/categories/spiritual.webp",
                        "viewpoint": "/images/places/lansdowne/categories/viewpoint.webp",
                        "waterfall": "/images/places/lansdowne/categories/waterfall.webp",
                        "lake": "/images/places/lansdowne/categories/lake.webp",
                        "monastery": "/images/places/lansdowne/categories/monastery.webp",
                        "church": "/images/places/lansdowne/categories/church.webp",
                        "beach": "/images/places/lansdowne/categories/beach.webp",
                        "shopping": "/images/places/lansdowne/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        },
        "murthal": {
                "generic": "/images/destinations/murthal/hero.jpg",
                "categories": {
                        "stay": "/images/places/murthal/categories/stay.webp",
                        "cafe": "/images/places/murthal/categories/cafe.webp",
                        "food": "/images/places/murthal/categories/food.webp",
                        "nature": "/images/places/murthal/categories/nature.webp",
                        "trail": "/images/places/murthal/categories/nature.webp",
                        "heritage": "/images/places/murthal/categories/heritage.webp",
                        "spiritual": "/images/places/murthal/categories/spiritual.webp",
                        "viewpoint": "/images/places/murthal/categories/viewpoint.webp",
                        "waterfall": "/images/places/murthal/categories/waterfall.webp",
                        "lake": "/images/places/murthal/categories/lake.webp",
                        "monastery": "/images/places/murthal/categories/monastery.webp",
                        "church": "/images/places/murthal/categories/church.webp",
                        "beach": "/images/places/murthal/categories/beach.webp",
                        "shopping": "/images/places/murthal/categories/cafe.webp",
                        "transport": "/images/nearby/transport/transport.webp"
                }
        }
}

    DESTINATION_HEROES: Dict[str, Dict[str, str]] = {
        "goa": {
                "hero": "/images/destinations/goa/hero.jpg",
                "illustration": "/images/destinations/goa/illustration.jpg"
        },
        "jaipur": {
                "hero": "/images/destinations/jaipur/hero.jpg",
                "illustration": "/images/destinations/jaipur/illustration.jpg"
        },
        "udaipur": {
                "hero": "/images/destinations/udaipur/hero.jpg",
                "illustration": "/images/destinations/udaipur/illustration.jpg"
        },
        "varanasi": {
                "hero": "/images/destinations/varanasi/hero.jpg",
                "illustration": "/images/destinations/varanasi/illustration.jpg"
        },
        "mussoorie": {
                "hero": "/images/destinations/mussoorie/hero.jpg",
                "illustration": "/images/destinations/mussoorie/illustration.jpg"
        },
        "rishikesh": {
                "hero": "/images/destinations/rishikesh/hero.jpg",
                "illustration": "/images/destinations/rishikesh/illustration.jpg"
        },
        "manali": {
                "hero": "/images/destinations/manali/hero.jpg",
                "illustration": "/images/destinations/manali/illustration.jpg"
        },
        "dharamshala": {
                "hero": "/images/destinations/dharamshala/hero.jpg",
                "illustration": "/images/destinations/dharamshala/illustration.jpg"
        },
        "kasol": {
                "hero": "/images/destinations/kasol/hero.jpg",
                "illustration": "/images/destinations/kasol/illustration.jpg"
        },
        "leh": {
                "hero": "/images/destinations/leh/hero.jpg",
                "illustration": "/images/destinations/leh/illustration.jpg"
        },
        "spiti": {
                "hero": "/images/destinations/spiti/hero.jpg",
                "illustration": "/images/destinations/spiti/illustration.jpg"
        },
        "jaisalmer": {
                "hero": "/images/destinations/jaisalmer/hero.jpg",
                "illustration": "/images/destinations/jaisalmer/illustration.jpg"
        },
        "munnar": {
                "hero": "/images/destinations/munnar/hero.jpg",
                "illustration": "/images/destinations/munnar/illustration.jpg"
        },
        "dehradun": {
                "hero": "/images/destinations/dehradun/hero.jpg",
                "illustration": "/images/destinations/dehradun/illustration.jpg"
        },
        "tungnath-chandrashila": {
                "hero": "/images/destinations/tungnath-chandrashila/hero.jpg",
                "illustration": "/images/destinations/tungnath-chandrashila/illustration.jpg"
        },
        "kainchi-dham": {
                "hero": "/images/destinations/kainchi-dham/hero.jpg",
                "illustration": "/images/destinations/kainchi-dham/illustration.jpg"
        },
        "agra": {
                "hero": "/images/destinations/agra/hero.jpg",
                "illustration": "/images/destinations/agra/illustration.jpg"
        },
        "mathura-vrindavan": {
                "hero": "/images/destinations/mathura-vrindavan/hero.jpg",
                "illustration": "/images/destinations/mathura-vrindavan/illustration.jpg"
        },
        "neemrana": {
                "hero": "/images/destinations/neemrana/hero.jpg",
                "illustration": "/images/destinations/neemrana/illustration.jpg"
        },
        "damdama-sohna": {
                "hero": "/images/destinations/damdama-sohna/hero.jpg",
                "illustration": "/images/destinations/damdama-sohna/illustration.jpg"
        },
        "alwar-siliserh": {
                "hero": "/images/destinations/alwar-siliserh/hero.jpg",
                "illustration": "/images/destinations/alwar-siliserh/illustration.jpg"
        },
        "sariska-bhangarh": {
                "hero": "/images/destinations/sariska-bhangarh/hero.jpg",
                "illustration": "/images/destinations/sariska-bhangarh/illustration.jpg"
        },
        "chandigarh": {
                "hero": "/images/destinations/chandigarh/hero.jpg",
                "illustration": "/images/destinations/chandigarh/illustration.jpg"
        },
        "morni-hills": {
                "hero": "/images/destinations/morni-hills/hero.jpg",
                "illustration": "/images/destinations/morni-hills/illustration.jpg"
        },
        "lansdowne": {
                "hero": "/images/destinations/lansdowne/hero.jpg",
                "illustration": "/images/destinations/lansdowne/illustration.jpg"
        },
        "murthal": {
                "hero": "/images/destinations/murthal/hero.jpg",
                "illustration": "/images/destinations/murthal/illustration.jpg"
        }
}

    PLACE_ALIAS_MAP: Dict[str, str] = {
        "agra:taj-mahal-white-marble-monument": "agra:taj-mahal-white-marble-monument",
        "agra:taj-mahal": "agra:taj-mahal-white-marble-monument",
        "agra:agra-red-fort-and-jahangiri-mahal": "agra:agra-red-fort-and-jahangiri-mahal",
        "agra:agra-red-fort": "agra:agra-red-fort-and-jahangiri-mahal",
        "agra:jahangiri-mahal": "agra:agra-red-fort-and-jahangiri-mahal",
        "agra:red-fort": "agra:agra-red-fort-and-jahangiri-mahal",
        "agra:mehtab-bagh-moonlight-river-gardens": "agra:mehtab-bagh-moonlight-river-gardens",
        "agra:mehtab-bagh": "agra:mehtab-bagh-moonlight-river-gardens",
        "agra:moonlight-river-gardens": "agra:mehtab-bagh-moonlight-river-gardens",
        "agra:fatehpur-sikri-imperial-capital-city": "agra:fatehpur-sikri-imperial-capital-city",
        "agra:fatehpur-sikri": "agra:fatehpur-sikri-imperial-capital-city",
        "agra:tomb-of-itimad-ud-daulah-baby-taj": "agra:tomb-of-itimad-ud-daulah-baby-taj",
        "agra:itmad-ud-daulah": "agra:tomb-of-itimad-ud-daulah-baby-taj",
        "agra:baby-taj": "agra:tomb-of-itimad-ud-daulah-baby-taj",
        "agra:tomb-of-itimad-ud-daulah": "agra:tomb-of-itimad-ud-daulah-baby-taj",
        "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
        "agra:shankar-mithai-bedmi": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
        "agra:bedmi-puri": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
        "agra:jalebi": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
        "agra:shankar-mithai-bhandar": "agra:shankar-mithai-bhandar-bedmi-puri-and-jalebi",
        "agra:panchhi-petha-original-sadar-bazaar": "agra:panchhi-petha-original-sadar-bazaar",
        "agra:panchhi-petha-store": "agra:panchhi-petha-original-sadar-bazaar",
        "agra:akbars-great-tomb-at-sikandra": "agra:akbars-great-tomb-at-sikandra",
        "agra:akbar-tomb-sikandra": "agra:akbars-great-tomb-at-sikandra",
        "agra:chini-ka-rauza-persian-glazed-tile-tomb": "agra:chini-ka-rauza-persian-glazed-tile-tomb",
        "agra:hero": "agra:chini-ka-rauza-persian-glazed-tile-tomb",
        "agra:chini-ka-rauza": "agra:chini-ka-rauza-persian-glazed-tile-tomb",
        "agra:persian-glazed-tile-tomb": "agra:chini-ka-rauza-persian-glazed-tile-tomb",
        "agra:mariam-uz-zamani-tomb-empress-jodha-bai": "agra:mariam-uz-zamani-tomb-empress-jodha-bai",
        "agra:mariams-tomb-sikandra": "agra:mariam-uz-zamani-tomb-empress-jodha-bai",
        "agra:empress-jodha-bai": "agra:mariam-uz-zamani-tomb-empress-jodha-bai",
        "agra:mariam-uz-zamani-tomb": "agra:mariam-uz-zamani-tomb-empress-jodha-bai",
        "agra:kinari-bazaar-heritage-zardozi-and-spice-market": "agra:kinari-bazaar-heritage-zardozi-and-spice-market",
        "agra:kinari-bazaar-crafts": "agra:kinari-bazaar-heritage-zardozi-and-spice-market",
        "agra:kinari-bazaar-heritage-zardozi": "agra:kinari-bazaar-heritage-zardozi-and-spice-market",
        "agra:spice-market": "agra:kinari-bazaar-heritage-zardozi-and-spice-market",
        "agra:soor-sarovar-bird-sanctuary-and-keetham-lake": "agra:soor-sarovar-bird-sanctuary-and-keetham-lake",
        "agra:soor-sarovar-lake": "agra:soor-sarovar-bird-sanctuary-and-keetham-lake",
        "agra:keetham-lake": "agra:soor-sarovar-bird-sanctuary-and-keetham-lake",
        "agra:soor-sarovar-bird-sanctuary": "agra:soor-sarovar-bird-sanctuary-and-keetham-lake",
        "agra:taj-nature-walk-forest-ridge-trail": "agra:taj-nature-walk-forest-ridge-trail",
        "agra:taj-nature-walk-ridge": "agra:taj-nature-walk-forest-ridge-trail",
        "agra:aram-bagh-babur-1528-charbagh-garden": "agra:aram-bagh-babur-1528-charbagh-garden",
        "agra:ram-bagh-gardens": "agra:aram-bagh-babur-1528-charbagh-garden",
        "agra:aram-bagh": "agra:aram-bagh-babur-1528-charbagh-garden",
        "agra:babur-1528-charbagh-garden": "agra:aram-bagh-babur-1528-charbagh-garden",
        "agra:dasaprakash-heritage-south-indian-dining": "agra:dasaprakash-heritage-south-indian-dining",
        "agra:dasaprakash-agra-cantt": "agra:dasaprakash-heritage-south-indian-dining",
        "agra:dasaprakash-cantt": "agra:dasaprakash-heritage-south-indian-dining",
        "agra:korai-tribal-craft-village-en-route-fatehpur": "agra:korai-tribal-craft-village-en-route-fatehpur",
        "agra:korai-rural-village": "agra:korai-tribal-craft-village-en-route-fatehpur",
        "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club": "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club",
        "alwar-siliserh:siliserh-lake-palace": "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club",
        "alwar-siliserh:royal-boat-club": "alwar-siliserh:siliserh-lake-palace-and-royal-boat-club",
        "alwar-siliserh:bala-quila-alwar-hilltop-fort": "alwar-siliserh:bala-quila-alwar-hilltop-fort",
        "alwar-siliserh:bala-quila-alwar-fort": "alwar-siliserh:bala-quila-alwar-hilltop-fort",
        "alwar-siliserh:alwar-hilltop-fort": "alwar-siliserh:bala-quila-alwar-hilltop-fort",
        "alwar-siliserh:bala-quila": "alwar-siliserh:bala-quila-alwar-hilltop-fort",
        "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
        "alwar-siliserh:alwar-city-palace": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
        "alwar-siliserh:alwar-siliserh-city-palace": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
        "alwar-siliserh:city-palace": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
        "alwar-siliserh:city-palace-alwar": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
        "alwar-siliserh:city-palace-alwar-siliserh": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
        "alwar-siliserh:city-palace-of-alwar": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
        "alwar-siliserh:city-palace-of-alwar-siliserh": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
        "alwar-siliserh:vinay-vilas-mahal": "alwar-siliserh:alwar-city-palace-vinay-vilas-mahal",
        "alwar-siliserh:moosi-maharani-ki-chhatri-cenotaph": "alwar-siliserh:moosi-maharani-ki-chhatri-cenotaph",
        "alwar-siliserh:moosi-maharani-chhatri": "alwar-siliserh:moosi-maharani-ki-chhatri-cenotaph",
        "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
        "alwar-siliserh:baba-thakur-das-kalakand": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
        "alwar-siliserh:baba-thakur-das": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
        "alwar-siliserh:origin-of-alwar-kalakand": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
        "alwar-siliserh:sons": "alwar-siliserh:baba-thakur-das-and-sons-origin-of-alwar-kalakand",
        "alwar-siliserh:jai-samand-lake-oasis": "alwar-siliserh:jai-samand-lake-oasis",
        "alwar-siliserh:jai-samand-lake-alwar": "alwar-siliserh:jai-samand-lake-oasis",
        "alwar-siliserh:government-museum-royal-armor-and-manuscripts": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
        "alwar-siliserh:government-museum-alwar": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
        "alwar-siliserh:government-museum": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
        "alwar-siliserh:manuscripts": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
        "alwar-siliserh:royal-armor": "alwar-siliserh:government-museum-royal-armor-and-manuscripts",
        "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb": "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb",
        "alwar-siliserh:fateh-jung-gumbad": "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb",
        "alwar-siliserh:1647-tomb": "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb",
        "alwar-siliserh:fateh-jung-ka-gumbad": "alwar-siliserh:fateh-jung-ka-gumbad-1647-tomb",
        "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats": "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats",
        "alwar-siliserh:sagar-water-reservoir": "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats",
        "alwar-siliserh:royal-bathing-stepped-ghats": "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats",
        "alwar-siliserh:sagar-water-kund": "alwar-siliserh:sagar-water-kund-and-royal-bathing-stepped-ghats",
        "alwar-siliserh:purjan-vihar-company-garden-british-oasis": "alwar-siliserh:purjan-vihar-company-garden-british-oasis",
        "alwar-siliserh:hero": "alwar-siliserh:purjan-vihar-company-garden-british-oasis",
        "alwar-siliserh:company-garden-british-oasis": "alwar-siliserh:purjan-vihar-company-garden-british-oasis",
        "alwar-siliserh:purjan-vihar": "alwar-siliserh:purjan-vihar-company-garden-british-oasis",
        "alwar-siliserh:tijara-atishaya-kshetra-jain-tirtha": "alwar-siliserh:tijara-atishaya-kshetra-jain-tirtha",
        "alwar-siliserh:tijara-jain-temple": "alwar-siliserh:tijara-atishaya-kshetra-jain-tirtha",
        "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage": "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage",
        "alwar-siliserh:talvriksha-hot-springs": "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage",
        "alwar-siliserh:mandavya-hermitage": "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage",
        "alwar-siliserh:talvriksha-sacred-springs": "alwar-siliserh:talvriksha-sacred-springs-and-mandavya-hermitage",
        "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple": "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple",
        "alwar-siliserh:vijay-mandir-palace": "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple",
        "alwar-siliserh:sita-ram-temple": "alwar-siliserh:vijay-mandir-palace-and-sita-ram-temple",
        "alwar-siliserh:neelkanth-mahadev-ancient-hilltop-sanctuary": "alwar-siliserh:neelkanth-mahadev-ancient-hilltop-sanctuary",
        "alwar-siliserh:neelkanth-mahadev-alwar": "alwar-siliserh:neelkanth-mahadev-ancient-hilltop-sanctuary",
        "alwar-siliserh:hope-circus-heritage-market-and-clock-tower": "alwar-siliserh:hope-circus-heritage-market-and-clock-tower",
        "alwar-siliserh:hope-circus-bazaar": "alwar-siliserh:hope-circus-heritage-market-and-clock-tower",
        "alwar-siliserh:clock-tower": "alwar-siliserh:hope-circus-heritage-market-and-clock-tower",
        "alwar-siliserh:hope-circus-heritage-market": "alwar-siliserh:hope-circus-heritage-market-and-clock-tower",
        "alwar-siliserh:kalakand-gali-mawa-artisans-street": "alwar-siliserh:kalakand-gali-mawa-artisans-street",
        "alwar-siliserh:kalakand-gali-food": "alwar-siliserh:kalakand-gali-mawa-artisans-street",
        "alwar-siliserh:kalakand-gali": "alwar-siliserh:kalakand-gali-mawa-artisans-street",
        "alwar-siliserh:mawa-artisans-street": "alwar-siliserh:kalakand-gali-mawa-artisans-street",
        "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
        "chandigarh:rock-garden-chandigarh": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
        "chandigarh:nek-chands-fantasy": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
        "chandigarh:rock-garden": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
        "chandigarh:rock-garden-of-chandigarh": "chandigarh:rock-garden-of-chandigarh-nek-chands-fantasy",
        "chandigarh:sukhna-lake-promenade-and-shivalik-views": "chandigarh:sukhna-lake-promenade-and-shivalik-views",
        "chandigarh:sukhna-lake-promenade": "chandigarh:sukhna-lake-promenade-and-shivalik-views",
        "chandigarh:shivalik-views": "chandigarh:sukhna-lake-promenade-and-shivalik-views",
        "chandigarh:le-corbusier-capitol-complex-unesco-heritage": "chandigarh:le-corbusier-capitol-complex-unesco-heritage",
        "chandigarh:capitol-complex-unesco": "chandigarh:le-corbusier-capitol-complex-unesco-heritage",
        "chandigarh:le-corbusier-capitol-complex": "chandigarh:le-corbusier-capitol-complex-unesco-heritage",
        "chandigarh:unesco-heritage": "chandigarh:le-corbusier-capitol-complex-unesco-heritage",
        "chandigarh:zakir-hussain-rose-garden": "chandigarh:zakir-hussain-rose-garden",
        "chandigarh:rose-garden-chandigarh": "chandigarh:zakir-hussain-rose-garden",
        "chandigarh:rose-garden": "chandigarh:zakir-hussain-rose-garden",
        "chandigarh:sector-17-open-plaza-and-pedestrian-promenade": "chandigarh:sector-17-open-plaza-and-pedestrian-promenade",
        "chandigarh:sector-17-plaza": "chandigarh:sector-17-open-plaza-and-pedestrian-promenade",
        "chandigarh:pedestrian-promenade": "chandigarh:sector-17-open-plaza-and-pedestrian-promenade",
        "chandigarh:sector-17-open-plaza": "chandigarh:sector-17-open-plaza-and-pedestrian-promenade",
        "chandigarh:indian-coffee-house-sector-17-legacy-since-1957": "chandigarh:indian-coffee-house-sector-17-legacy-since-1957",
        "chandigarh:indian-coffee-house-sec17": "chandigarh:indian-coffee-house-sector-17-legacy-since-1957",
        "chandigarh:indian-coffee-house": "chandigarh:indian-coffee-house-sector-17-legacy-since-1957",
        "chandigarh:sector-17-legacy-since-1957": "chandigarh:indian-coffee-house-sector-17-legacy-since-1957",
        "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
        "chandigarh:pal-dhaba-sector28": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
        "chandigarh:keema": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
        "chandigarh:legendary-butter-chicken": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
        "chandigarh:pal-dhaba": "chandigarh:pal-dhaba-legendary-butter-chicken-and-keema",
        "chandigarh:sector-10-tree-lined-boulevard-cycling-route": "chandigarh:sector-10-tree-lined-boulevard-cycling-route",
        "chandigarh:boulevard-cycling-trail": "chandigarh:sector-10-tree-lined-boulevard-cycling-route",
        "chandigarh:japanese-garden-sector-31-zen-sanctuary": "chandigarh:japanese-garden-sector-31-zen-sanctuary",
        "chandigarh:japanese-garden-sec31": "chandigarh:japanese-garden-sector-31-zen-sanctuary",
        "chandigarh:terraced-garden-and-musical-water-cascade": "chandigarh:terraced-garden-and-musical-water-cascade",
        "chandigarh:terraced-garden-sec33": "chandigarh:terraced-garden-and-musical-water-cascade",
        "chandigarh:musical-water-cascade": "chandigarh:terraced-garden-and-musical-water-cascade",
        "chandigarh:terraced-garden": "chandigarh:terraced-garden-and-musical-water-cascade",
        "chandigarh:government-museum-and-art-gallery-sector-10": "chandigarh:government-museum-and-art-gallery-sector-10",
        "chandigarh:government-museum-sec10": "chandigarh:government-museum-and-art-gallery-sector-10",
        "chandigarh:art-gallery-sector-10": "chandigarh:government-museum-and-art-gallery-sector-10",
        "chandigarh:government-museum": "chandigarh:government-museum-and-art-gallery-sector-10",
        "chandigarh:national-cactus-and-succulent-botanical-garden": "chandigarh:national-cactus-and-succulent-botanical-garden",
        "chandigarh:cactus-garden-panchkula": "chandigarh:national-cactus-and-succulent-botanical-garden",
        "chandigarh:open-hand-monument-symbol-of-peace-and-giving": "chandigarh:open-hand-monument-symbol-of-peace-and-giving",
        "chandigarh:open-hand-monument": "chandigarh:open-hand-monument-symbol-of-peace-and-giving",
        "chandigarh:giving": "chandigarh:open-hand-monument-symbol-of-peace-and-giving",
        "chandigarh:symbol-of-peace": "chandigarh:open-hand-monument-symbol-of-peace-and-giving",
        "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces": "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces",
        "chandigarh:pinjore-yadavindra-gardens": "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces",
        "chandigarh:17th-century-mughal-terraces": "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces",
        "chandigarh:yadavindra-gardens-pinjore": "chandigarh:yadavindra-gardens-pinjore-17th-century-mughal-terraces",
        "chandigarh:sindhi-sweets-sector-17-chole-bhature-hub": "chandigarh:sindhi-sweets-sector-17-chole-bhature-hub",
        "chandigarh:sindhi-sweets-sec17": "chandigarh:sindhi-sweets-sector-17-chole-bhature-hub",
        "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge": "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge",
        "chandigarh:timber-trail-ropeway-base": "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge",
        "chandigarh:shivalik-gorge": "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge",
        "chandigarh:timber-trail-mountain-cable-car": "chandigarh:timber-trail-mountain-cable-car-shivalik-gorge",
        "damdama-sohna:damdama-lake-natural-boating-basin": "damdama-sohna:damdama-lake-natural-boating-basin",
        "damdama-sohna:damdama-lake-boating": "damdama-sohna:damdama-lake-natural-boating-basin",
        "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund": "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund",
        "damdama-sohna:sohna-hot-springs": "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund",
        "damdama-sohna:ancient-shiva-kund": "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund",
        "damdama-sohna:sohna-sulphur-hot-springs": "damdama-sohna:sohna-sulphur-hot-springs-and-ancient-shiva-kund",
        "damdama-sohna:aravalli-bio-diversity-ridge-nature-trails": "damdama-sohna:aravalli-bio-diversity-ridge-nature-trails",
        "damdama-sohna:aravalli-bio-trails": "damdama-sohna:aravalli-bio-diversity-ridge-nature-trails",
        "damdama-sohna:botanix-nature-adventure-park-and-organic-farm": "damdama-sohna:botanix-nature-adventure-park-and-organic-farm",
        "damdama-sohna:botanix-nature-resort-camp": "damdama-sohna:botanix-nature-adventure-park-and-organic-farm",
        "damdama-sohna:botanix-nature-adventure-park": "damdama-sohna:botanix-nature-adventure-park-and-organic-farm",
        "damdama-sohna:organic-farm": "damdama-sohna:botanix-nature-adventure-park-and-organic-farm",
        "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint": "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint",
        "damdama-sohna:sohna-hilltop-fort-ruins": "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint",
        "damdama-sohna:viewpoint": "damdama-sohna:sohna-hilltop-fort-ruins-and-viewpoint",
        "damdama-sohna:shiva-tourist-complex-and-gardens": "damdama-sohna:shiva-tourist-complex-and-gardens",
        "damdama-sohna:shiva-tourist-complex": "damdama-sohna:shiva-tourist-complex-and-gardens",
        "damdama-sohna:dawat-e-khas-aravalli-highway-dhaba": "damdama-sohna:dawat-e-khas-aravalli-highway-dhaba",
        "damdama-sohna:dawat-aravalli-dhaba": "damdama-sohna:dawat-e-khas-aravalli-highway-dhaba",
        "damdama-sohna:saras-tourist-resort-damdama-promenade": "damdama-sohna:saras-tourist-resort-damdama-promenade",
        "damdama-sohna:saras-lake-promenade": "damdama-sohna:saras-tourist-resort-damdama-promenade",
        "damdama-sohna:camp-mustang-aravalli-obstacle-base": "damdama-sohna:camp-mustang-aravalli-obstacle-base",
        "damdama-sohna:camp-mustang-adventure": "damdama-sohna:camp-mustang-aravalli-obstacle-base",
        "damdama-sohna:badkhal-aravalli-ridge-mountain-drive": "damdama-sohna:badkhal-aravalli-ridge-mountain-drive",
        "damdama-sohna:badkhal-ridge-lake-drive": "damdama-sohna:badkhal-aravalli-ridge-mountain-drive",
        "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir": "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir",
        "damdama-sohna:lost-lake-damdama-trail": "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir",
        "damdama-sohna:hidden-aravalli-water-reservoir": "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir",
        "damdama-sohna:lost-lake": "damdama-sohna:lost-lake-hidden-aravalli-water-reservoir",
        "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove": "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove",
        "damdama-sohna:bhondsi-eco-park": "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove",
        "damdama-sohna:bhondsi-nature-park": "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove",
        "damdama-sohna:bhuvneshwari-devi-grove": "damdama-sohna:bhondsi-nature-park-and-bhuvneshwari-devi-grove",
        "damdama-sohna:aravalli-hills-footprint-and-golf-glades": "damdama-sohna:aravalli-hills-footprint-and-golf-glades",
        "damdama-sohna:aravalli-golf-greens": "damdama-sohna:aravalli-hills-footprint-and-golf-glades",
        "damdama-sohna:aravalli-hills-footprint": "damdama-sohna:aravalli-hills-footprint-and-golf-glades",
        "damdama-sohna:golf-glades": "damdama-sohna:aravalli-hills-footprint-and-golf-glades",
        "damdama-sohna:historic-sohna-vintage-car-circuit-trail": "damdama-sohna:historic-sohna-vintage-car-circuit-trail",
        "damdama-sohna:sohna-car-rally-trail": "damdama-sohna:historic-sohna-vintage-car-circuit-trail",
        "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor": "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor",
        "damdama-sohna:leopold-aravalli-sanctuary": "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor",
        "damdama-sohna:mangar-bani-sacred-forest": "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor",
        "damdama-sohna:wildlife-corridor": "damdama-sohna:mangar-bani-sacred-forest-and-wildlife-corridor",
        "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden": "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden",
        "damdama-sohna:tau-devi-lal-bio-park": "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden",
        "damdama-sohna:butterfly-garden": "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden",
        "damdama-sohna:tau-devi-lal-botanical-park": "damdama-sohna:tau-devi-lal-botanical-park-and-butterfly-garden",
        "dehradun:robbers-cave-guchhupani-limestone-gorge": "dehradun:robbers-cave-guchhupani-limestone-gorge",
        "dehradun:robbers-cave": "dehradun:robbers-cave-guchhupani-limestone-gorge",
        "dehradun:guchhupani-limestone-gorge": "dehradun:robbers-cave-guchhupani-limestone-gorge",
        "dehradun:forest-research-institute-colonial-colonnades": "dehradun:forest-research-institute-colonial-colonnades",
        "dehradun:forest-research-institute": "dehradun:forest-research-institute-colonial-colonnades",
        "dehradun:colonial-colonnades": "dehradun:forest-research-institute-colonial-colonnades",
        "dehradun:mindrolling-monastery-and-great-stupa": "dehradun:mindrolling-monastery-and-great-stupa",
        "dehradun:mindrolling-monastery": "dehradun:mindrolling-monastery-and-great-stupa",
        "dehradun:great-stupa": "dehradun:mindrolling-monastery-and-great-stupa",
        "dehradun:sahastradhara-thousandfold-sulphur-springs": "dehradun:sahastradhara-thousandfold-sulphur-springs",
        "dehradun:sahastradhara-springs": "dehradun:sahastradhara-thousandfold-sulphur-springs",
        "dehradun:tapkeshwar-mahadev-cave-temple": "dehradun:tapkeshwar-mahadev-cave-temple",
        "dehradun:tapkeshwar-temple": "dehradun:tapkeshwar-mahadev-cave-temple",
        "dehradun:rajpur-road-artisan-bakeries-and-cafes": "dehradun:rajpur-road-artisan-bakeries-and-cafes",
        "dehradun:rajpur-road-cafes": "dehradun:rajpur-road-artisan-bakeries-and-cafes",
        "dehradun:rajpur-road-artisan-bakeries": "dehradun:rajpur-road-artisan-bakeries-and-cafes",
        "dehradun:elloras-melting-moments-since-1953": "dehradun:elloras-melting-moments-since-1953",
        "dehradun:elloras-bakery": "dehradun:elloras-melting-moments-since-1953",
        "dehradun:elloras-melting-moments": "dehradun:elloras-melting-moments-since-1953",
        "dehradun:since-1953": "dehradun:elloras-melting-moments-since-1953",
        "dehradun:malsi-deer-park-dehradun-zoo": "dehradun:malsi-deer-park-dehradun-zoo",
        "dehradun:malsi-deer-park": "dehradun:malsi-deer-park-dehradun-zoo",
        "dehradun:dehradun-zoo": "dehradun:malsi-deer-park-dehradun-zoo",
        "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower": "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower",
        "dehradun:hero": "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower",
        "dehradun:1953-ghanta-ghar-clock-tower": "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower",
        "dehradun:paltan-bazaar": "dehradun:paltan-bazaar-and-1953-ghanta-ghar-clock-tower",
        "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery": "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery",
        "dehradun:khalanga-war-memorial": "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery",
        "dehradun:british-tribute-to-gurkha-bravery": "dehradun:khalanga-war-memorial-british-tribute-to-gurkha-bravery",
        "dehradun:shikhar-fall-woodland-cascade-and-stream": "dehradun:shikhar-fall-woodland-cascade-and-stream",
        "dehradun:shikhar-fall-trail": "dehradun:shikhar-fall-woodland-cascade-and-stream",
        "dehradun:shikhar-fall-woodland-cascade": "dehradun:shikhar-fall-woodland-cascade-and-stream",
        "dehradun:stream": "dehradun:shikhar-fall-woodland-cascade-and-stream",
        "dehradun:lachhiwala-nature-park-and-stream-pools": "dehradun:lachhiwala-nature-park-and-stream-pools",
        "dehradun:lachhiwala-nature-park": "dehradun:lachhiwala-nature-park-and-stream-pools",
        "dehradun:stream-pools": "dehradun:lachhiwala-nature-park-and-stream-pools",
        "dehradun:maldevta-pebble-riverbed-and-camping-meadows": "dehradun:maldevta-pebble-riverbed-and-camping-meadows",
        "dehradun:maldevta-riverside-meadows": "dehradun:maldevta-pebble-riverbed-and-camping-meadows",
        "dehradun:camping-meadows": "dehradun:maldevta-pebble-riverbed-and-camping-meadows",
        "dehradun:maldevta-pebble-riverbed": "dehradun:maldevta-pebble-riverbed-and-camping-meadows",
        "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
        "dehradun:kumar-sweets-legend": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
        "dehradun:confectioners": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
        "dehradun:kumaoni-bal-mithai": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
        "dehradun:kumar-sweets": "dehradun:kumar-sweets-and-confectioners-kumaoni-bal-mithai",
        "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce": "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce",
        "dehradun:kalsi-ashoka-rock-edict": "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce",
        "dehradun:3rd-century-bce": "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce",
        "dehradun:kalsi-ashokan-rock-edict": "dehradun:kalsi-ashokan-rock-edict-3rd-century-bce",
        "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve": "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve",
        "dehradun:asani-barrage-wetland": "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve",
        "dehradun:asan-barrage-bird-sanctuary": "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve",
        "dehradun:wetland-reserve": "dehradun:asan-barrage-bird-sanctuary-and-wetland-reserve",
        "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple": "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple",
        "dharamshala:tsuglagkhang-temple": "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple",
        "dharamshala:dalai-lama-temple": "dharamshala:tsuglagkhang-complex-and-dalai-lama-temple",
        "dharamshala:tsuglagkhang-complex": "dharamshala:namgyal-monastery",
        "dharamshala:bhagsu-waterfall-and-shiva-cafe": "dharamshala:bhagsu-waterfall-and-shiva-cafe",
        "dharamshala:bhagsu-waterfall-shiva-cafe": "dharamshala:bhagsunag-waterfall",
        "dharamshala:bhagsu-waterfall": "dharamshala:bhagsunag-waterfall",
        "dharamshala:shiva-cafe": "dharamshala:bhagsu-waterfall-and-shiva-cafe",
        "dharamshala:norbulingka-institute-of-tibetan-arts": "dharamshala:norbulingka-institute-of-tibetan-arts",
        "dharamshala:norbulingka-institute": "dharamshala:norbulingka-institute",
        "dharamshala:triund-ridge-alpine-trek-trail": "dharamshala:triund-ridge-alpine-trek-trail",
        "dharamshala:triund-trek-base": "dharamshala:triund-trek",
        "dharamshala:illiterati-books-and-coffee": "dharamshala:illiterati-books-and-coffee",
        "dharamshala:illiterati-cafe": "dharamshala:illiterati-books-and-coffee",
        "dharamshala:coffee": "dharamshala:illiterati-books-and-coffee",
        "dharamshala:illiterati-books": "dharamshala:illiterati-books-and-coffee",
        "dharamshala:st-john-in-the-wilderness-church-1852": "dharamshala:st-john-in-the-wilderness-church-1852",
        "dharamshala:st-john-wilderness": "dharamshala:st-john-in-the-wilderness-church-1852",
        "dharamshala:1852": "dharamshala:st-john-in-the-wilderness-church-1852",
        "dharamshala:st-john-in-the-wilderness-church": "dharamshala:st-john-in-the-wilderness-church-1852",
        "dharamshala:tibet-kitchen-traditional-momos-and-thukpa": "dharamshala:tibet-kitchen-traditional-momos-and-thukpa",
        "dharamshala:tibet-kitchen": "dharamshala:tibet-kitchen-traditional-momos-and-thukpa",
        "dharamshala:thukpa": "dharamshala:tibet-kitchen-traditional-momos-and-thukpa",
        "dharamshala:traditional-momos": "dharamshala:tibet-kitchen-traditional-momos-and-thukpa",
        "dharamshala:dharamkot-yoga-and-meditation-village": "dharamshala:dharamkot-yoga-and-meditation-village",
        "dharamshala:dharamkot-village": "dharamshala:dharamkot-yoga-and-meditation-village",
        "dharamshala:dharamkot-yoga": "dharamshala:dharamkot-yoga-and-meditation-village",
        "dharamshala:meditation-village": "dharamshala:dharamkot-yoga-and-meditation-village",
        "dharamshala:kangra-fort-ancient-4th-century-bce-citadel": "dharamshala:kangra-fort-ancient-4th-century-bce-citadel",
        "dharamshala:kangra-fort": "dharamshala:kangra-fort-ancient-4th-century-bce-citadel",
        "dharamshala:ancient-4th-century-bce-citadel": "dharamshala:kangra-fort-ancient-4th-century-bce-citadel",
        "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat": "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat",
        "dharamshala:gyuto-monastery": "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat",
        "dharamshala:karmapa-seat": "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat",
        "dharamshala:tantric-chanting": "dharamshala:gyuto-monastery-tantric-chanting-and-karmapa-seat",
        "dharamshala:naddi-village-dhauladhar-sunset-crest": "dharamshala:naddi-village-dhauladhar-sunset-crest",
        "dharamshala:triund-trek": "dharamshala:triund-trek",
        "dharamshala:kareri-glacial-lake-trailhead-ghera-base": "dharamshala:kareri-glacial-lake-trailhead-ghera-base",
        "dharamshala:bhagsunag-waterfall": "dharamshala:bhagsunag-waterfall",
        "dharamshala:ghera-base": "dharamshala:kareri-glacial-lake-trailhead-ghera-base",
        "dharamshala:kareri-glacial-lake-trailhead": "dharamshala:kareri-glacial-lake-trailhead-ghera-base",
        "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves": "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves",
        "dharamshala:dal-lake-dharamshala": "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves",
        "dharamshala:dal-lake": "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves",
        "dharamshala:sacred-deodar-groves": "dharamshala:dal-lake-dharamshala-and-sacred-deodar-groves",
        "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane": "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane",
        "dharamshala:tibetan-butter-tea": "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane",
        "dharamshala:tingmo-bakery-lane": "dharamshala:tibetan-butter-tea-and-tingmo-bakery-lane",
        "dharamshala:masroor-monolithic-rock-cut-temples-8th-century": "dharamshala:masroor-monolithic-rock-cut-temples-8th-century",
        "dharamshala:masroor-rock-temples": "dharamshala:masroor-monolithic-rock-cut-temples-8th-century",
        "dharamshala:8th-century": "dharamshala:masroor-monolithic-rock-cut-temples-8th-century",
        "dharamshala:masroor-monolithic-rock-cut-temples": "dharamshala:masroor-monolithic-rock-cut-temples-8th-century",
        "dharamshala:tashi-jong-buddhist-craft-community-and-stupas": "dharamshala:tashi-jong-buddhist-craft-community-and-stupas",
        "dharamshala:tashi-jong-monastery": "dharamshala:tashi-jong-buddhist-craft-community-and-stupas",
        "dharamshala:stupas": "dharamshala:tashi-jong-buddhist-craft-community-and-stupas",
        "dharamshala:tashi-jong-buddhist-craft-community": "dharamshala:tashi-jong-buddhist-craft-community-and-stupas",
        "goa:chapora-fort-hilltop-viewpoint": "goa:chapora-fort-hilltop-viewpoint",
        "goa:chapora-fort": "goa:chapora-fort-hilltop-viewpoint",
        "goa:fontainhas-heritage-latin-quarter": "goa:fontainhas-heritage-latin-quarter",
        "goa:fontainhas-latin-quarter": "goa:fontainhas-heritage-latin-quarter",
        "goa:divar-island-village-ferry-and-backwaters": "goa:divar-island-village-ferry-and-backwaters",
        "goa:divar-island": "goa:divar-island-village-ferry-and-backwaters",
        "goa:backwaters": "goa:divar-island-village-ferry-and-backwaters",
        "goa:divar-island-village-ferry": "goa:divar-island-village-ferry-and-backwaters",
        "goa:ashwem-beach-casuarina-pines": "goa:ashwem-beach-casuarina-pines",
        "goa:ashwem-beach": "goa:ashwem-beach-casuarina-pines",
        "goa:anjuna-flea-and-night-art-market": "goa:anjuna-flea-and-night-art-market",
        "goa:anjuna-flea-market": "goa:anjuna-flea-and-night-art-market",
        "goa:anjuna-flea": "goa:anjuna-flea-and-night-art-market",
        "goa:night-art-market": "goa:anjuna-flea-and-night-art-market",
        "goa:dudhsagar-waterfall-jungle-trek": "goa:dudhsagar-waterfall-jungle-trek",
        "goa:dudhsagar-falls": "goa:dudhsagar-waterfall-jungle-trek",
        "goa:artjuna-lifestyle-garden-cafe": "goa:artjuna-lifestyle-garden-cafe",
        "goa:artjuna-cafe": "goa:artjuna-lifestyle-garden-cafe",
        "goa:vinayak-family-restaurant-authentic-goan-fish-thali": "goa:vinayak-family-restaurant-authentic-goan-fish-thali",
        "goa:vinayak-family-restaurant": "goa:vinayak-family-restaurant-authentic-goan-fish-thali",
        "goa:authentic-goan-fish-thali": "goa:vinayak-family-restaurant-authentic-goan-fish-thali",
        "goa:basilica-of-bom-jesus-unesco-world-heritage": "goa:basilica-of-bom-jesus-unesco-world-heritage",
        "goa:basilica-bom-jesus": "goa:basilica-of-bom-jesus-unesco-world-heritage",
        "goa:basilica-of-bom-jesus": "goa:basilica-of-bom-jesus-unesco-world-heritage",
        "goa:unesco-world-heritage": "goa:basilica-of-bom-jesus-unesco-world-heritage",
        "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail": "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail",
        "goa:arambol-sweet-lake": "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail",
        "goa:arambol-sweet-water-lagoon": "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail",
        "goa:banyan-tree-trail": "goa:arambol-sweet-water-lagoon-and-banyan-tree-trail",
        "goa:reis-magos-fort-and-mandovi-estuary": "goa:reis-magos-fort-and-mandovi-estuary",
        "goa:reis-magos-fort": "goa:reis-magos-fort-and-mandovi-estuary",
        "goa:mandovi-estuary": "goa:reis-magos-fort-and-mandovi-estuary",
        "goa:palolem-crescent-beach-and-butterfly-island": "goa:palolem-crescent-beach-and-butterfly-island",
        "goa:palolem-beach": "goa:palolem-crescent-beach-and-butterfly-island",
        "goa:butterfly-island": "goa:palolem-crescent-beach-and-butterfly-island",
        "goa:palolem-crescent-beach": "goa:palolem-crescent-beach-and-butterfly-island",
        "goa:baba-au-rhum-french-bamboo-garden": "goa:baba-au-rhum-french-bamboo-garden",
        "goa:baba-au-rhum-cafe": "goa:baba-au-rhum-french-bamboo-garden",
        "goa:gunpowder-assagao-heritage-peninsular-dining": "goa:gunpowder-assagao-heritage-peninsular-dining",
        "goa:gunpowder-assagao": "goa:gunpowder-assagao-heritage-peninsular-dining",
        "goa:fort-aguada-and-1864-portuguese-lighthouse": "goa:fort-aguada-and-1864-portuguese-lighthouse",
        "goa:aguada-fort": "goa:fort-aguada-and-1864-portuguese-lighthouse",
        "goa:1864-portuguese-lighthouse": "goa:fort-aguada-and-1864-portuguese-lighthouse",
        "goa:fort-aguada": "goa:fort-aguada-and-1864-portuguese-lighthouse",
        "goa:anjuna-rocky-beach-cove-and-curlies-point": "goa:anjuna-rocky-beach-cove-and-curlies-point",
        "goa:anjuna-beach-cove": "goa:anjuna-rocky-beach-cove-and-curlies-point",
        "goa:anjuna-rocky-beach-cove": "goa:anjuna-rocky-beach-cove-and-curlies-point",
        "goa:curlies-point": "goa:anjuna-rocky-beach-cove-and-curlies-point",
        "jaipur:amber-fort-and-sheesh-mahal": "jaipur:amber-fort",
        "jaipur:amber-fort": "jaipur:amber-fort",
        "jaipur:sheesh-mahal": "jaipur:amber-fort-and-sheesh-mahal",
        "jaipur:hawa-mahal-palace-of-winds": "jaipur:hawa-mahal",
        "jaipur:hawa-mahal": "jaipur:hawa-mahal",
        "jaipur:palace-of-winds": "jaipur:hawa-mahal-palace-of-winds",
        "jaipur:nahargarh-fort-sunset-ridge": "jaipur:nahargarh-fort",
        "jaipur:nahargarh-fort-sunset": "jaipur:nahargarh-fort",
        "jaipur:panna-meena-ka-kund-stepwell": "jaipur:panna-meena-ka-kund-stepwell",
        "jaipur:panna-meena-kund": "jaipur:panna-meena-ka-kund-stepwell",
        "jaipur:jaipur-city-palace-and-chandra-mahal": "jaipur:jaipur-city-palace-and-chandra-mahal",
        "jaipur:city-palace-jaipur": "jaipur:jaipur-city-palace-and-chandra-mahal",
        "jaipur:chandra-mahal": "jaipur:jaipur-city-palace-and-chandra-mahal",
        "jaipur:city-palace": "jaipur:jaipur-city-palace-and-chandra-mahal",
        "jaipur:city-palace-of-jaipur": "jaipur:jaipur-city-palace-and-chandra-mahal",
        "jaipur:jaipur-city-palace": "jaipur:jaipur-city-palace-and-chandra-mahal",
        "jaipur:laxmi-misthan-bhandar-lmb-1727": "jaipur:laxmi-misthan-bhandar-lmb-1727",
        "jaipur:lmb-sweets": "jaipur:laxmi-misthan-bhandar-lmb-1727",
        "jaipur:laxmi-misthan-bhandar": "jaipur:laxmi-misthan-bhandar-lmb-1727",
        "jaipur:lmb-1727": "jaipur:laxmi-misthan-bhandar-lmb-1727",
        "jaipur:anokhi-museum-of-hand-printing": "jaipur:anokhi-museum-of-hand-printing",
        "jaipur:anokhi-museum": "jaipur:anokhi-museum-of-hand-printing",
        "jaipur:tapri-central-rooftop-tea-lounge": "jaipur:tapri-central-rooftop-tea-lounge",
        "jaipur:tapri-central": "jaipur:tapri-central-rooftop-tea-lounge",
        "jaipur:jantar-mantar-unesco-astronomical-observatory": "jaipur:jantar-mantar-unesco-astronomical-observatory",
        "jaipur:jantar-mantar": "jaipur:jantar-mantar-unesco-astronomical-observatory",
        "jaipur:jaigarh-fort-and-jaivana-royal-cannon": "jaipur:jaigarh-fort-and-jaivana-royal-cannon",
        "jaipur:jaigarh-fort": "jaipur:jaigarh-fort-and-jaivana-royal-cannon",
        "jaipur:jaivana-royal-cannon": "jaipur:jaigarh-fort-and-jaivana-royal-cannon",
        "jaipur:jal-mahal-the-floating-water-palace": "jaipur:jal-mahal-the-floating-water-palace",
        "jaipur:jal-mahal": "jaipur:jal-mahal-the-floating-water-palace",
        "jaipur:the-floating-water-palace": "jaipur:jal-mahal-the-floating-water-palace",
        "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
        "jaipur:galta-ji-temple": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
        "jaipur:galta-ji": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
        "jaipur:kunds": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
        "jaipur:the-sacred-monkey-temple": "jaipur:galta-ji-the-sacred-monkey-temple-and-kunds",
        "jaipur:albert-hall-state-museum-indo-saracenic": "jaipur:albert-hall-state-museum-indo-saracenic",
        "jaipur:albert-hall-museum": "jaipur:albert-hall-state-museum-indo-saracenic",
        "jaipur:albert-hall-state-museum": "jaipur:albert-hall-state-museum-indo-saracenic",
        "jaipur:indo-saracenic": "jaipur:albert-hall-state-museum-indo-saracenic",
        "jaipur:patrika-gate-and-jawahar-circle-garden": "jaipur:patrika-gate-and-jawahar-circle-garden",
        "jaipur:patrika-gate": "jaipur:patrika-gate-and-jawahar-circle-garden",
        "jaipur:jawahar-circle-garden": "jaipur:patrika-gate-and-jawahar-circle-garden",
        "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori": "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori",
        "jaipur:rawat-mishthan-bhandar": "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori",
        "jaipur:original-pyaaz-kachori": "jaipur:rawat-mishthan-bhandar-original-pyaaz-kachori",
        "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace": "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace",
        "jaipur:wind-view-cafe": "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace",
        "jaipur:hawa-mahal-eye-level-terrace": "jaipur:wind-view-cafe-hawa-mahal-eye-level-terrace",
        "jaisalmer:jaisalmer-golden-living-fort-sonar-qila": "jaisalmer:jaisalmer-golden-living-fort-sonar-qila",
        "jaisalmer:jaisalmer-fort": "jaisalmer:jaisalmer-golden-living-fort-sonar-qila",
        "jaisalmer:jaisalmer-golden-living-fort": "jaisalmer:jaisalmer-golden-living-fort-sonar-qila",
        "jaisalmer:sonar-qila": "jaisalmer:jaisalmer-golden-living-fort-sonar-qila",
        "jaisalmer:patwon-ki-haveli-filigree-architecture": "jaisalmer:patwon-ki-haveli-filigree-architecture",
        "jaisalmer:patwon-ki-haveli": "jaisalmer:patwon-ki-haveli-filigree-architecture",
        "jaisalmer:sam-sand-dunes-and-thar-desert-safari": "jaisalmer:sam-sand-dunes-and-thar-desert-safari",
        "jaisalmer:sam-sand-dunes": "jaisalmer:sam-sand-dunes-and-thar-desert-safari",
        "jaisalmer:thar-desert-safari": "jaisalmer:sam-sand-dunes-and-thar-desert-safari",
        "jaisalmer:gadisar-lake-ghats-and-chattris": "jaisalmer:gadisar-lake-ghats-and-chattris",
        "jaisalmer:gadisar-lake": "jaisalmer:gadisar-lake-ghats-and-chattris",
        "jaisalmer:chattris": "jaisalmer:gadisar-lake-ghats-and-chattris",
        "jaisalmer:gadisar-lake-ghats": "jaisalmer:gadisar-lake-ghats-and-chattris",
        "jaisalmer:kuldhara-abandoned-ghost-village": "jaisalmer:kuldhara-abandoned-ghost-village",
        "jaisalmer:kuldhara-abandoned-village": "jaisalmer:kuldhara-abandoned-ghost-village",
        "jaisalmer:jaisalmer-fort-seven-jain-temples": "jaisalmer:jaisalmer-fort-seven-jain-temples",
        "jaisalmer:jain-temples-fort": "jaisalmer:jaisalmer-fort-seven-jain-temples",
        "jaisalmer:jain-temples": "jaisalmer:jaisalmer-fort-seven-jain-temples",
        "jaisalmer:seven-jain-temples": "jaisalmer:jaisalmer-fort-seven-jain-temples",
        "jaisalmer:the-trio-rooftop-authentic-laal-maas": "jaisalmer:the-trio-rooftop-authentic-laal-maas",
        "jaisalmer:the-trio-restaurant": "jaisalmer:the-trio-rooftop-authentic-laal-maas",
        "jaisalmer:authentic-laal-maas": "jaisalmer:the-trio-rooftop-authentic-laal-maas",
        "jaisalmer:the-trio-rooftop": "jaisalmer:the-trio-rooftop-authentic-laal-maas",
        "jaisalmer:salim-singh-ki-haveli-moti-mahal": "jaisalmer:salim-singh-ki-haveli-moti-mahal",
        "jaisalmer:salim-singh-ki-haveli": "jaisalmer:salim-singh-ki-haveli-moti-mahal",
        "jaisalmer:moti-mahal": "jaisalmer:salim-singh-ki-haveli-moti-mahal",
        "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
        "jaisalmer:bada-bagh-chhatris": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
        "jaisalmer:bada-bagh": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
        "jaisalmer:desert-windmills": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
        "jaisalmer:royal-cenotaphs": "jaisalmer:bada-bagh-royal-cenotaphs-and-desert-windmills",
        "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
        "jaisalmer:khuri-desert-sand-dunes": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
        "jaisalmer:khuri-village": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
        "jaisalmer:mud-homestays": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
        "jaisalmer:quiet-sand-dunes": "jaisalmer:khuri-village-quiet-sand-dunes-and-mud-homestays",
        "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine": "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine",
        "jaisalmer:tanot-mata-temple": "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine",
        "jaisalmer:the-miraculous-indo-pak-border-shrine": "jaisalmer:tanot-mata-temple-the-miraculous-indo-pak-border-shrine",
        "jaisalmer:desert-national-park-great-indian-bustard-safari": "jaisalmer:desert-national-park-great-indian-bustard-safari",
        "jaisalmer:desert-national-park-safari": "jaisalmer:desert-national-park-great-indian-bustard-safari",
        "jaisalmer:desert-national-park": "jaisalmer:desert-national-park-great-indian-bustard-safari",
        "jaisalmer:great-indian-bustard-safari": "jaisalmer:desert-national-park-great-indian-bustard-safari",
        "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree": "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree",
        "jaisalmer:lodurva-jain-temple": "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree",
        "jaisalmer:kalpavriksha-wish-tree": "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree",
        "jaisalmer:lodurva-ancient-capital": "jaisalmer:lodurva-ancient-capital-and-kalpavriksha-wish-tree",
        "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph": "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph",
        "jaisalmer:vyas-chhatri-sunset-point": "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph",
        "jaisalmer:sage-vyas-sandstone-cenotaph": "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph",
        "jaisalmer:vyas-chhatri": "jaisalmer:vyas-chhatri-sage-vyas-sandstone-cenotaph",
        "jaisalmer:surya-kishore-authentic-dal-baati-churma": "jaisalmer:surya-kishore-authentic-dal-baati-churma",
        "jaisalmer:surya-kishore-rooftop": "jaisalmer:surya-kishore-authentic-dal-baati-churma",
        "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum": "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum",
        "jaisalmer:desert-cultural-centre-museum": "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum",
        "jaisalmer:desert-cultural-centre": "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum",
        "jaisalmer:folk-puppetry-museum": "jaisalmer:desert-cultural-centre-and-folk-puppetry-museum",
        "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple": "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple",
        "kainchi-dham:neem-karoli-baba-ashram": "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple",
        "kainchi-dham:neem-karoli-baba-sacred-ashram": "kainchi-dham:neem-karoli-baba-sacred-ashram-and-temple",
        "kainchi-dham:bhowali-fruit-market-and-tea-terraces": "kainchi-dham:bhowali-fruit-market-and-tea-terraces",
        "kainchi-dham:bhowali-fruit-orchards": "kainchi-dham:bhowali-fruit-market-and-tea-terraces",
        "kainchi-dham:bhowali-fruit-market": "kainchi-dham:bhowali-fruit-market-and-tea-terraces",
        "kainchi-dham:tea-terraces": "kainchi-dham:bhowali-fruit-market-and-tea-terraces",
        "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells": "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells",
        "kainchi-dham:golu-devta-ghorakhal": "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells",
        "kainchi-dham:golu-devta-temple-ghorakhal": "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells",
        "kainchi-dham:temple-of-bells": "kainchi-dham:golu-devta-temple-ghorakhal-temple-of-bells",
        "kainchi-dham:bhimtal-lake-and-central-aquarium-island": "kainchi-dham:bhimtal-lake-and-central-aquarium-island",
        "kainchi-dham:bhimtal-island-lake": "kainchi-dham:bhimtal-lake-and-central-aquarium-island",
        "kainchi-dham:bhimtal-lake": "kainchi-dham:bhimtal-lake-and-central-aquarium-island",
        "kainchi-dham:central-aquarium-island": "kainchi-dham:bhimtal-lake-and-central-aquarium-island",
        "kainchi-dham:sattal-seven-interconnected-freshwater-lakes": "kainchi-dham:sattal-seven-interconnected-freshwater-lakes",
        "kainchi-dham:sattal-interconnected-lakes": "kainchi-dham:sattal-seven-interconnected-freshwater-lakes",
        "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat": "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat",
        "kainchi-dham:subhash-dhaba-bhowali": "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat",
        "kainchi-dham:subhash-dhaba": "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat",
        "kainchi-dham:traditional-kumaoni-ras-bhaat": "kainchi-dham:subhash-dhaba-traditional-kumaoni-ras-bhaat",
        "kainchi-dham:naukuchiatal-nine-cornered-lake": "kainchi-dham:naukuchiatal-nine-cornered-lake",
        "kainchi-dham:naukuchiatal-lake": "kainchi-dham:naukuchiatal-nine-cornered-lake",
        "kainchi-dham:naukuchiatal": "kainchi-dham:naukuchiatal-nine-cornered-lake",
        "kainchi-dham:nine-cornered-lake": "kainchi-dham:naukuchiatal-nine-cornered-lake",
        "kainchi-dham:shyamkhet-organic-tea-garden-walk": "kainchi-dham:shyamkhet-organic-tea-garden-walk",
        "kainchi-dham:shyamkhet-tea-estate": "kainchi-dham:shyamkhet-organic-tea-garden-walk",
        "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary": "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary",
        "kainchi-dham:pangot-birding-sanctuary": "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary",
        "kainchi-dham:himalayan-birding-sanctuary": "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary",
        "kainchi-dham:pangot-oak-forest": "kainchi-dham:pangot-oak-forest-and-himalayan-birding-sanctuary",
        "kainchi-dham:mukteshwar-dham-350-year-hilltop-shiva-temple": "kainchi-dham:mukteshwar-dham-350-year-hilltop-shiva-temple",
        "kainchi-dham:mukteshwar-dham-shiva-temple": "kainchi-dham:mukteshwar-dham-350-year-hilltop-shiva-temple",
        "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
        "kainchi-dham:chauli-ki-jali-cliffs": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
        "kainchi-dham:chauli-ki-jali": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
        "kainchi-dham:sunset-crag": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
        "kainchi-dham:vertical-mountain-ridge": "kainchi-dham:chauli-ki-jali-vertical-mountain-ridge-and-sunset-crag",
        "kainchi-dham:hidimba-parvat-pine-forest-trail": "kainchi-dham:hidimba-parvat-pine-forest-trail",
        "kainchi-dham:hidimba-parvat-trek": "kainchi-dham:hidimba-parvat-pine-forest-trail",
        "kainchi-dham:chaubatia-apple-and-apricot-research-orchards": "kainchi-dham:chaubatia-apple-and-apricot-research-orchards",
        "kainchi-dham:ranikhet-chaubatia-orchards": "kainchi-dham:chaubatia-apple-and-apricot-research-orchards",
        "kainchi-dham:apricot-research-orchards": "kainchi-dham:chaubatia-apple-and-apricot-research-orchards",
        "kainchi-dham:chaubatia-apple": "kainchi-dham:chaubatia-apple-and-apricot-research-orchards",
        "kainchi-dham:karkotak-nag-mandir-hilltop-crest": "kainchi-dham:karkotak-nag-mandir-hilltop-crest",
        "kainchi-dham:karkotak-nag-mandir": "kainchi-dham:karkotak-nag-mandir-hilltop-crest",
        "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal": "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
        "kainchi-dham:kamal-tal-lotus-lake": "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
        "kainchi-dham:kamal-tal": "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
        "kainchi-dham:the-secluded-lotus-lake-of-naukuchiatal": "kainchi-dham:kamal-tal-the-secluded-lotus-lake-of-naukuchiatal",
        "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams": "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams",
        "kainchi-dham:kumaoni-heritage-cafe-bhowali": "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams",
        "kainchi-dham:kumaoni-heritage-tea-room": "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams",
        "kainchi-dham:mountain-jams": "kainchi-dham:kumaoni-heritage-tea-room-and-mountain-jams",
        "kasol:chalal-riverside-pine-trail": "kasol:chalal-riverside-pine-trail",
        "kasol:chalal-pine-trail": "kasol:chalal-riverside-pine-trail",
        "kasol:manikaran-sahib-gurudwara-and-hot-springs": "kasol:manikaran-sahib-gurudwara-and-hot-springs",
        "kasol:manikaran-sahib-gurudwara": "kasol:manikaran-sahib-gurudwara-and-hot-springs",
        "kasol:hot-springs": "kasol:manikaran-sahib-gurudwara-and-hot-springs",
        "kasol:tosh-village-apple-orchard-ridge": "kasol:tosh-village-apple-orchard-ridge",
        "kasol:tosh-village": "kasol:tosh-village-apple-orchard-ridge",
        "kasol:moon-dance-cafe-and-german-bakery": "kasol:moon-dance-cafe-and-german-bakery",
        "kasol:moon-dance-cafe": "kasol:moon-dance-cafe-and-german-bakery",
        "kasol:devraj-coffee": "kasol:moon-dance-cafe-and-german-bakery",
        "kasol:devraj-coffee-and-german-bakery": "kasol:moon-dance-cafe-and-german-bakery",
        "kasol:devraj-coffee-german-bakery": "kasol:moon-dance-cafe-and-german-bakery",
        "kasol:german-bakery": "kasol:moon-dance-cafe-and-german-bakery",
        "kasol:german-bakery-tapovan": "kasol:moon-dance-cafe-and-german-bakery",
        "kasol:grahan-village-heritage-trek": "kasol:grahan-village-heritage-trek",
        "kasol:grahan-village-trek": "kasol:grahan-village-heritage-trek",
        "kasol:evergreen-cafe-and-garden-lounge": "kasol:evergreen-cafe-and-garden-lounge",
        "kasol:evergreen-cafe": "kasol:evergreen-cafe-and-garden-lounge",
        "kasol:garden-lounge": "kasol:evergreen-cafe-and-garden-lounge",
        "kasol:kasol-nature-park-pine-walk": "kasol:kasol-nature-park-pine-walk",
        "kasol:nature-park-kasol": "kasol:kasol-nature-park-pine-walk",
        "kasol:nature-park": "kasol:kasol-nature-park-pine-walk",
        "kasol:malana-village-ancient-approach-trail": "kasol:malana-village-ancient-approach-trail",
        "kasol:malana-village-gate": "kasol:malana-village-ancient-approach-trail",
        "kasol:kheerganga-natural-sulphur-pool-and-meadow": "kasol:kheerganga-natural-sulphur-pool-and-meadow",
        "kasol:kheerganga-trail": "kasol:kheerganga-natural-sulphur-pool-and-meadow",
        "kasol:kheerganga-natural-sulphur-pool": "kasol:kheerganga-natural-sulphur-pool-and-meadow",
        "kasol:meadow": "kasol:kheerganga-natural-sulphur-pool-and-meadow",
        "kasol:pulga-fairy-forest-ancient-deodar-enclave": "kasol:pulga-fairy-forest-ancient-deodar-enclave",
        "kasol:pulga-fairy-forest": "kasol:pulga-fairy-forest-ancient-deodar-enclave",
        "kasol:ancient-deodar-enclave": "kasol:pulga-fairy-forest-ancient-deodar-enclave",
        "kasol:kalga-village-and-terraced-apple-orchards": "kasol:kalga-village-and-terraced-apple-orchards",
        "kasol:kalga-village": "kasol:kalga-village-and-terraced-apple-orchards",
        "kasol:terraced-apple-orchards": "kasol:kalga-village-and-terraced-apple-orchards",
        "kasol:tulga-rustic-wooden-hamlet": "kasol:tulga-rustic-wooden-hamlet",
        "kasol:tulga-hamlet": "kasol:tulga-rustic-wooden-hamlet",
        "kasol:rasol-high-alpine-village-trail-2-600m": "kasol:rasol-high-alpine-village-trail-2-600m",
        "kasol:rasol-trail": "kasol:rasol-high-alpine-village-trail-2-600m",
        "kasol:600m": "kasol:rasol-high-alpine-village-trail-2-600m",
        "kasol:rasol-high-alpine-village-trail": "kasol:rasol-high-alpine-village-trail-2-600m",
        "kasol:chojh-riverside-pebble-beach-and-suspension-bridge": "kasol:chojh-riverside-pebble-beach-and-suspension-bridge",
        "kasol:chojh-bridge": "kasol:chojh-riverside-pebble-beach-and-suspension-bridge",
        "kasol:chojh-riverside-pebble-beach": "kasol:chojh-riverside-pebble-beach-and-suspension-bridge",
        "kasol:suspension-bridge": "kasol:chojh-riverside-pebble-beach-and-suspension-bridge",
        "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe": "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe",
        "kasol:jim-morrison-cafe": "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe",
        "kasol:jim-morrison-wooden-terrace": "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe",
        "kasol:shakshuka-cafe": "kasol:jim-morrison-wooden-terrace-and-shakshuka-cafe",
        "kasol:waichin-valley-magic-valley-glacial-meadow": "kasol:waichin-valley-magic-valley-glacial-meadow",
        "kasol:waichin-valley": "kasol:waichin-valley-magic-valley-glacial-meadow",
        "kasol:magic-valley-glacial-meadow": "kasol:waichin-valley-magic-valley-glacial-meadow",
        "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
        "lansdowne:tip-in-top-viewpoint": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
        "lansdowne:snow-crest-ridge": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
        "lansdowne:tiffin-top": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
        "lansdowne:tip-in-top": "lansdowne:tip-in-top-tiffin-top-snow-crest-ridge",
        "lansdowne:bhulla-tal-lake-and-pine-promenade": "lansdowne:bhulla-tal-lake-and-pine-promenade",
        "lansdowne:bhulla-tal-lake": "lansdowne:bhulla-tal-lake-and-pine-promenade",
        "lansdowne:pine-promenade": "lansdowne:bhulla-tal-lake-and-pine-promenade",
        "lansdowne:st-johns-catholic-church-1936": "lansdowne:st-johns-catholic-church-1936",
        "lansdowne:st-johns-church-1936": "lansdowne:st-johns-catholic-church-1936",
        "lansdowne:1936": "lansdowne:st-johns-catholic-church-1936",
        "lansdowne:st-johns-catholic-church": "lansdowne:st-johns-catholic-church-1936",
        "lansdowne:darwan-singh-regimental-museum": "lansdowne:darwan-singh-regimental-museum",
        "lansdowne:garhwal-rifles-museum": "lansdowne:darwan-singh-regimental-museum",
        "lansdowne:bhim-pakora-balancing-stone-wonder": "lansdowne:bhim-pakora-balancing-stone-wonder",
        "lansdowne:bhim-pakora-stones": "lansdowne:bhim-pakora-balancing-stone-wonder",
        "lansdowne:hawaghar-pine-forest-ridge-promenade": "lansdowne:hawaghar-pine-forest-ridge-promenade",
        "lansdowne:hawaghar-pine-walk": "lansdowne:hawaghar-pine-forest-ridge-promenade",
        "lansdowne:lansdowne-hills-colonial-cafe-and-bakery": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
        "lansdowne:lansdowne-tripund-cafe": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
        "lansdowne:bakery": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
        "lansdowne:lansdowne-hills-colonial-cafe": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
        "lansdowne:tripund-cafe": "lansdowne:lansdowne-hills-colonial-cafe-and-bakery",
        "lansdowne:kalagarh-tiger-reserve-northern-gate": "lansdowne:kalagarh-tiger-reserve-northern-gate",
        "lansdowne:kalagarh-tiger-gateway": "lansdowne:kalagarh-tiger-reserve-northern-gate",
        "lansdowne:tarkeshwar-mahadev-giant-deodar-sanctuary": "lansdowne:tarkeshwar-mahadev-giant-deodar-sanctuary",
        "lansdowne:tarkeshwar-mahadev-temple": "lansdowne:tarkeshwar-mahadev-giant-deodar-sanctuary",
        "lansdowne:st-marys-anglican-church-1896-heritage-archive": "lansdowne:st-marys-anglican-church-1896-heritage-archive",
        "lansdowne:st-marys-church-1896": "lansdowne:st-marys-anglican-church-1896-heritage-archive",
        "lansdowne:1896-heritage-archive": "lansdowne:st-marys-anglican-church-1896-heritage-archive",
        "lansdowne:st-marys-anglican-church": "lansdowne:st-marys-anglican-church-1896-heritage-archive",
        "lansdowne:kaleshwar-mahadev-500-year-sage-meditation-cave": "lansdowne:kaleshwar-mahadev-500-year-sage-meditation-cave",
        "lansdowne:kaleshwar-mahadev-temple": "lansdowne:kaleshwar-mahadev-500-year-sage-meditation-cave",
        "lansdowne:santoshi-mata-temple-sunset-peak-crest": "lansdowne:santoshi-mata-temple-sunset-peak-crest",
        "lansdowne:santoshi-mata-temple-sunset": "lansdowne:santoshi-mata-temple-sunset-peak-crest",
        "lansdowne:santoshi-mata-temple": "lansdowne:santoshi-mata-temple-sunset-peak-crest",
        "lansdowne:sunset-peak-crest": "lansdowne:santoshi-mata-temple-sunset-peak-crest",
        "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail": "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail",
        "lansdowne:deriyakhal-oak-forest-trail": "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail",
        "lansdowne:deriyakhal-oak": "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail",
        "lansdowne:rhododendron-birding-trail": "lansdowne:deriyakhal-oak-and-rhododendron-birding-trail",
        "lansdowne:kanvashram-historic-sanctuary-on-malini-river": "lansdowne:kanvashram-historic-sanctuary-on-malini-river",
        "lansdowne:kanvashram-historic-sanctuary": "lansdowne:kanvashram-historic-sanctuary-on-malini-river",
        "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea": "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea",
        "lansdowne:mayur-cafe-mall-road": "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea",
        "lansdowne:ginger-tea": "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea",
        "lansdowne:mayur-cafe-steaming-momos": "lansdowne:mayur-cafe-steaming-momos-and-ginger-tea",
        "lansdowne:sadar-bazaar-cantonment-heritage-lane": "lansdowne:sadar-bazaar-cantonment-heritage-lane",
        "lansdowne:sadar-bazaar-wooden-curios": "lansdowne:sadar-bazaar-cantonment-heritage-lane",
        "leh:leh-palace-17th-century-fortress": "leh:leh-palace",
        "leh:leh-palace": "leh:leh-palace",
        "leh:shanti-stupa-white-peace-pagoda": "leh:shanti-stupa-white-peace-pagoda",
        "leh:shanti-stupa": "leh:shanti-stupa-white-peace-pagoda",
        "leh:thiksey-gompa-and-15m-maitreya-buddha": "leh:thiksey-gompa-and-15m-maitreya-buddha",
        "leh:thiksey-monastery": "leh:thiksey-monastery-gompa",
        "leh:15m-maitreya-buddha": "leh:thiksey-gompa-and-15m-maitreya-buddha",
        "leh:thiksey-gompa": "leh:thiksey-monastery-gompa",
        "leh:pangong-tso-high-altitude-salt-lake": "leh:pangong-tso",
        "leh:pangong-tso": "leh:pangong-tso",
        "leh:confluence-of-indus-and-zanskar-rivers-sangam": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
        "leh:sangam-confluence": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
        "leh:confluence-of-indus": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
        "leh:sangam": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
        "leh:zanskar-rivers": "leh:confluence-of-indus-and-zanskar-rivers-sangam",
        "leh:lalas-art-cafe-restored-heritage-labrang": "leh:lalas-art-cafe-restored-heritage-labrang",
        "leh:lalas-art-cafe": "leh:lalas-art-cafe-restored-heritage-labrang",
        "leh:restored-heritage-labrang": "leh:lalas-art-cafe-restored-heritage-labrang",
        "leh:gesmo-restaurant-and-german-bakery-since-1989": "leh:gesmo-restaurant-and-german-bakery-since-1989",
        "leh:gesmo-restaurant": "leh:gesmo-restaurant-and-german-bakery-since-1989",
        "leh:devraj-coffee": "leh:gesmo-restaurant-and-german-bakery-since-1989",
        "leh:devraj-coffee-and-german-bakery": "leh:gesmo-restaurant-and-german-bakery-since-1989",
        "leh:devraj-coffee-german-bakery": "leh:gesmo-restaurant-and-german-bakery-since-1989",
        "leh:german-bakery": "leh:gesmo-restaurant-and-german-bakery-since-1989",
        "leh:german-bakery-tapovan": "leh:gesmo-restaurant-and-german-bakery-since-1989",
        "leh:since-1989": "leh:gesmo-restaurant-and-german-bakery-since-1989",
        "leh:hall-of-fame-military-and-cultural-museum": "leh:hall-of-fame-military-and-cultural-museum",
        "leh:hall-of-fame-leh": "leh:hall-of-fame-military-and-cultural-museum",
        "leh:cultural-museum": "leh:hall-of-fame-military-and-cultural-museum",
        "leh:hall-of-fame": "leh:hall-of-fame-military-and-cultural-museum",
        "leh:hall-of-fame-military": "leh:hall-of-fame-military-and-cultural-museum",
        "leh:khardung-la-high-mountain-pass-5-359m": "leh:khardung-la-high-mountain-pass-5-359m",
        "leh:khardung-la": "leh:khardung-la-high-mountain-pass-5-359m",
        "leh:359m": "leh:khardung-la-high-mountain-pass-5-359m",
        "leh:khardung-la-high-mountain-pass": "leh:khardung-la-high-mountain-pass-5-359m",
        "leh:nubra-valley-and-hunder-sand-dunes": "leh:nubra-valley-and-hunder-sand-dunes",
        "leh:nubra-hunder-sand-dunes": "leh:nubra-valley-and-hunder-sand-dunes",
        "leh:hunder-sand-dunes": "leh:nubra-valley-and-hunder-sand-dunes",
        "leh:nubra-valley": "leh:nubra-valley-and-hunder-sand-dunes",
        "leh:hemis-monastery-and-sacred-museum": "leh:hemis-monastery-and-sacred-museum",
        "leh:hemis-monastery": "leh:hemis-monastery-and-sacred-museum",
        "leh:sacred-museum": "leh:hemis-monastery-and-sacred-museum",
        "leh:magnetic-hill-gravity-defying-ridge": "leh:magnetic-hill-gravity-defying-ridge",
        "leh:magnetic-hill": "leh:magnetic-hill-gravity-defying-ridge",
        "leh:general-zorawar-fort-and-military-museum": "leh:general-zorawar-fort-and-military-museum",
        "leh:zorawar-fort": "leh:general-zorawar-fort-and-military-museum",
        "leh:general-zorawar-fort": "leh:general-zorawar-fort-and-military-museum",
        "leh:military-museum": "leh:general-zorawar-fort-and-military-museum",
        "leh:lamayuru-moonland-and-ancient-monastery": "leh:lamayuru-moonland-and-ancient-monastery",
        "leh:lamayuru-moonland": "leh:lamayuru-moonland-and-ancient-monastery",
        "leh:ancient-monastery": "leh:lamayuru-moonland-and-ancient-monastery",
        "leh:lalas-art-cafe-in-old-town-leh": "leh:lalas-art-cafe-in-old-town-leh",
        "leh:alchi-monastery": "leh:lalas-art-cafe-in-old-town-leh",
        "leh:bon-appetit-organic-garden-dining": "leh:bon-appetit-organic-garden-dining",
        "leh:bon-appetit-leh": "leh:bon-appetit-organic-garden-dining",
        "leh:bon-appetit": "leh:bon-appetit-organic-garden-dining",
        "manali:hadimba-devi-cedar-forest-temple": "manali:hadimba-devi-cedar-forest-temple",
        "manali:hadimba-temple": "manali:hadimba-devi-cedar-forest-temple",
        "manali:hadimba-devi-temple": "manali:hadimba-devi-cedar-forest-temple",
        "manali:cafe-1947-riverside-stone-cafe": "manali:cafe-1947-riverside-stone-cafe",
        "manali:cafe-1947": "manali:cafe-1947-riverside-stone-cafe",
        "manali:cafe-1947-riverside": "manali:cafe-1947-riverside-stone-cafe",
        "manali:cafe-1947-riverside-stone-caf\u00e9": "manali:cafe-1947-riverside-stone-cafe",
        "manali:caf\u00e9-1947": "manali:cafe-1947-riverside-stone-cafe",
        "manali:riverside-stone-cafe": "manali:cafe-1947-riverside-stone-cafe",
        "manali:jogini-waterfall-pine-trail": "manali:jogini-waterfall-pine-trail",
        "manali:jogini-waterfall": "manali:jogini-waterfall-pine-trail",
        "manali:jogini-falls": "manali:jogini-waterfall-pine-trail",
        "manali:old-manali-village-and-manu-temple": "manali:old-manali-village-and-manu-temple",
        "manali:old-manali-village": "manali:old-manali-village-and-manu-temple",
        "manali:manu-temple": "manali:manu-temple-historic-shrine-of-sage-manu",
        "manali:old-village": "manali:old-manali-village-and-manu-temple",
        "manali:drifters-cafe-and-acoustic-inn": "manali:drifters-cafe-and-acoustic-inn",
        "manali:drifters-cafe": "manali:drifters-cafe-and-acoustic-inn",
        "manali:acoustic-inn": "manali:drifters-cafe-and-acoustic-inn",
        "manali:drifters-inn": "manali:drifters-cafe-and-acoustic-inn",
        "manali:drifters-inn-and-wooden-loft": "manali:drifters-cafe-and-acoustic-inn",
        "manali:drifters-inn-wooden-loft": "manali:drifters-cafe-and-acoustic-inn",
        "manali:solang-valley-alpine-adventure-grounds": "manali:solang-valley-alpine-adventure-grounds",
        "manali:solang-valley": "manali:solang-valley-alpine-adventure-grounds",
        "manali:vashisht-hot-sulphur-springs-and-ancient-temple": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
        "manali:vashisht-springs": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
        "manali:ancient-temple": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
        "manali:vashisht-hot-springs": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
        "manali:vashisht-hot-sulphur-springs": "manali:vashisht-hot-sulphur-springs-and-ancient-temple",
        "manali:the-johnsons-cafe-and-trout-bar": "manali:the-johnsons-cafe-and-trout-bar",
        "manali:johnsons-cafe": "manali:the-johnsons-cafe-and-trout-bar",
        "manali:johnsons-cafe-trout-bar": "manali:the-johnsons-cafe-and-trout-bar",
        "manali:the-johnsons-cafe": "manali:the-johnsons-cafe-and-trout-bar",
        "manali:trout-bar": "manali:the-johnsons-cafe-and-trout-bar",
        "manali:naggar-castle-kath-kuni-royal-palace": "manali:naggar-castle-kath-kuni-royal-palace",
        "manali:naggar-castle": "manali:naggar-castle-kath-kuni-royal-palace",
        "manali:kath-kuni-royal-palace": "manali:naggar-castle-kath-kuni-royal-palace",
        "manali:rohtang-pass-snow-crest-and-alpine-gateway": "manali:rohtang-pass-snow-crest-and-alpine-gateway",
        "manali:rohtang-pass": "manali:rohtang-pass-snow-crest-and-alpine-gateway",
        "manali:alpine-gateway": "manali:rohtang-pass-snow-crest-and-alpine-gateway",
        "manali:rohtang-pass-snow-crest": "manali:rohtang-pass-snow-crest-and-alpine-gateway",
        "manali:atal-tunnel-north-portal-and-sissu-waterfall": "manali:atal-tunnel-north-portal-and-sissu-waterfall",
        "manali:atal-tunnel-sissu": "manali:atal-tunnel-north-portal-and-sissu-waterfall",
        "manali:atal-tunnel-north-portal": "manali:atal-tunnel-north-portal-and-sissu-waterfall",
        "manali:sissu-waterfall": "manali:atal-tunnel-north-portal-and-sissu-waterfall",
        "manali:manu-temple-historic-shrine-of-sage-manu": "manali:manu-temple-historic-shrine-of-sage-manu",
        "manali:historic-shrine-of-sage-manu": "manali:manu-temple-historic-shrine-of-sage-manu",
        "manali:sethan-igloo-village-and-hampta-valley-ridge": "manali:sethan-igloo-village-and-hampta-valley-ridge",
        "manali:sethan-igloo-village": "manali:sethan-igloo-village-and-hampta-valley-ridge",
        "manali:hampta-valley-ridge": "manali:sethan-igloo-village-and-hampta-valley-ridge",
        "manali:beas-river-nature-park-and-deodar-walk": "manali:beas-river-nature-park-and-deodar-walk",
        "manali:beas-river-park": "manali:beas-river-nature-park-and-deodar-walk",
        "manali:beas-river-nature-park": "manali:beas-river-nature-park-and-deodar-walk",
        "manali:deodar-walk": "manali:beas-river-nature-park-and-deodar-walk",
        "manali:lazy-dog-lounge-riverside-deck": "manali:lazy-dog-lounge-riverside-deck",
        "manali:lazy-dog-lounge": "manali:lazy-dog-lounge-riverside-deck",
        "manali:dylans-toasted-and-roasted-coffee-house": "manali:dylans-toasted-and-roasted-coffee-house",
        "manali:dylans-cafe": "manali:dylans-toasted-and-roasted-coffee-house",
        "manali:dylans-toasted": "manali:dylans-toasted-and-roasted-coffee-house",
        "manali:roasted-coffee-house": "manali:dylans-toasted-and-roasted-coffee-house",
        "manali:gulaba-meadows-and-alpine-snow-line": "manali:gulaba-meadows-and-alpine-snow-line",
        "manali:gulaba-meadows": "manali:gulaba-meadows-and-alpine-snow-line",
        "manali:alpine-snow-line": "manali:gulaba-meadows-and-alpine-snow-line",
        "manali:chopsticks-tibetan-and-asian-kitchen": "manali:chopsticks-tibetan-and-asian-kitchen",
        "manali:chopsticks-manali": "manali:chopsticks-tibetan-and-asian-kitchen",
        "manali:asian-kitchen": "manali:chopsticks-tibetan-and-asian-kitchen",
        "manali:chopsticks": "manali:chopsticks-tibetan-and-asian-kitchen",
        "manali:chopsticks-tibetan": "manali:chopsticks-tibetan-and-asian-kitchen",
        "mathura-vrindavan:bankey-bihari-temple-vrindavan": "mathura-vrindavan:bankey-bihari-temple-vrindavan",
        "mathura-vrindavan:bankey-bihari-temple": "mathura-vrindavan:bankey-bihari-temple-vrindavan",
        "mathura-vrindavan:shri-krishna-janmabhoomi-temple-complex": "mathura-vrindavan:shri-krishna-janmabhoomi-temple-complex",
        "mathura-vrindavan:shri-krishna-janmabhoomi": "mathura-vrindavan:shri-krishna-janmabhoomi-temple-complex",
        "mathura-vrindavan:prem-mandir-italian-carrara-marble-temple": "mathura-vrindavan:prem-mandir-italian-carrara-marble-temple",
        "mathura-vrindavan:prem-mandir-vrindavan": "mathura-vrindavan:prem-mandir-italian-carrara-marble-temple",
        "mathura-vrindavan:iskcon-sri-krishna-balaram-temple": "mathura-vrindavan:iskcon-sri-krishna-balaram-temple",
        "mathura-vrindavan:iskcon-vrindavan": "mathura-vrindavan:iskcon-sri-krishna-balaram-temple",
        "mathura-vrindavan:vishram-ghat-evening-yamuna-maha-aarti": "mathura-vrindavan:vishram-ghat-evening-yamuna-maha-aarti",
        "mathura-vrindavan:vishram-ghat-aarti": "mathura-vrindavan:vishram-ghat-evening-yamuna-maha-aarti",
        "mathura-vrindavan:nidhivan-sacred-basil-forest-grove": "mathura-vrindavan:nidhivan-sacred-basil-forest-grove",
        "mathura-vrindavan:nidhivan-grove": "mathura-vrindavan:nidhivan-sacred-basil-forest-grove",
        "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda": "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda",
        "mathura-vrindavan:brijwasi-mithai-wala": "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda",
        "mathura-vrindavan:original-mathura-peda": "mathura-vrindavan:brijwasi-mithai-wala-original-mathura-peda",
        "mathura-vrindavan:radha-raman-ancient-self-manifested-deity": "mathura-vrindavan:radha-raman-ancient-self-manifested-deity",
        "mathura-vrindavan:radha-raman-temple": "mathura-vrindavan:radha-raman-ancient-self-manifested-deity",
        "mathura-vrindavan:kusum-sarovar-18th-century-sandstone-reservoir": "mathura-vrindavan:kusum-sarovar-18th-century-sandstone-reservoir",
        "mathura-vrindavan:kusum-sarovar-govardhan": "mathura-vrindavan:kusum-sarovar-18th-century-sandstone-reservoir",
        "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path": "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path",
        "mathura-vrindavan:govardhan-hill-parikrama": "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path",
        "mathura-vrindavan:giriraj-sacred-parikrama-path": "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path",
        "mathura-vrindavan:govardhan-hill": "mathura-vrindavan:govardhan-hill-giriraj-sacred-parikrama-path",
        "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace": "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace",
        "mathura-vrindavan:barsana-shri-radha-rani-temple": "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace",
        "mathura-vrindavan:ladli-ji-palace": "mathura-vrindavan:barsana-shri-radha-rani-temple-ladli-ji-palace",
        "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes": "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes",
        "mathura-vrindavan:radha-kund-shyam-kund": "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes",
        "mathura-vrindavan:radha-kund": "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes",
        "mathura-vrindavan:shyam-kund-sacred-twin-lakes": "mathura-vrindavan:radha-kund-and-shyam-kund-sacred-twin-lakes",
        "mathura-vrindavan:potra-kund-sacred-stepped-stepwell": "mathura-vrindavan:potra-kund-sacred-stepped-stepwell",
        "mathura-vrindavan:potra-kund-mathura": "mathura-vrindavan:potra-kund-sacred-stepped-stepwell",
        "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset": "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset",
        "mathura-vrindavan:keshi-ghat-yamuna-sunset": "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset",
        "mathura-vrindavan:keshi-ghat-stone-palace": "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset",
        "mathura-vrindavan:riverfront-sunset": "mathura-vrindavan:keshi-ghat-stone-palace-and-riverfront-sunset",
        "mathura-vrindavan:vrindavan-chandrodaya-mandir-cultural-park": "mathura-vrindavan:vrindavan-chandrodaya-mandir-cultural-park",
        "mathura-vrindavan:chandrodaya-mandir-lookout": "mathura-vrindavan:vrindavan-chandrodaya-mandir-cultural-park",
        "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store": "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store",
        "mathura-vrindavan:brij-chappan-bhog-sweets": "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store",
        "mathura-vrindavan:chappan-bhog-malai-rabri": "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store",
        "mathura-vrindavan:khurchan-store": "mathura-vrindavan:chappan-bhog-malai-rabri-and-khurchan-store",
        "morni-hills:tikkar-taal-twin-lakes-and-boating": "morni-hills:tikkar-taal-twin-lakes-and-boating",
        "morni-hills:tikkar-taal-lakes": "morni-hills:tikkar-taal-twin-lakes-and-boating",
        "morni-hills:boating": "morni-hills:tikkar-taal-twin-lakes-and-boating",
        "morni-hills:tikkar-taal-twin-lakes": "morni-hills:tikkar-taal-twin-lakes-and-boating",
        "morni-hills:morni-fort-17th-century-ramparts": "morni-hills:morni-fort-17th-century-ramparts",
        "morni-hills:morni-fort-heritage": "morni-hills:morni-fort-17th-century-ramparts",
        "morni-hills:morni-shivalik-herbal-forest-and-bird-trail": "morni-hills:morni-shivalik-herbal-forest-and-bird-trail",
        "morni-hills:herbal-nature-trail": "morni-hills:morni-shivalik-herbal-forest-and-bird-trail",
        "morni-hills:bird-trail": "morni-hills:morni-shivalik-herbal-forest-and-bird-trail",
        "morni-hills:morni-shivalik-herbal-forest": "morni-hills:morni-shivalik-herbal-forest-and-bird-trail",
        "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
        "morni-hills:adventure-park-tikkar": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
        "morni-hills:adventure-park-tikkar-taal": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
        "morni-hills:obstacle-course": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
        "morni-hills:zip": "morni-hills:adventure-park-tikkar-taal-zip-and-obstacle-course",
        "morni-hills:gurudwara-nada-sahib-en-route": "morni-hills:gurudwara-nada-sahib-en-route",
        "morni-hills:gurudwara-nada-sahib": "morni-hills:gurudwara-nada-sahib-en-route",
        "morni-hills:pheasant-breeding-centre-berwala": "morni-hills:pheasant-breeding-centre-berwala",
        "morni-hills:berwala-pheasant-breeding": "morni-hills:pheasant-breeding-centre-berwala",
        "morni-hills:mountain-quail-terrace-dhaba": "morni-hills:mountain-quail-terrace-dhaba",
        "morni-hills:mountain-quail-resort-dhaba": "morni-hills:mountain-quail-terrace-dhaba",
        "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge": "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge",
        "morni-hills:shivalik-viewpoint-crest": "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge",
        "morni-hills:sunset-ridge": "morni-hills:shivalik-viewpoint-crest-and-sunset-ridge",
        "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy": "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy",
        "morni-hills:kalesar-national-park-border": "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy",
        "morni-hills:kalesar-wildlife-sanctuary": "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy",
        "morni-hills:sal-canopy": "morni-hills:kalesar-wildlife-sanctuary-and-sal-canopy",
        "morni-hills:mandhana-high-pine-crest-trail": "morni-hills:mandhana-high-pine-crest-trail",
        "morni-hills:mandhana-pine-ridge-trail": "morni-hills:mandhana-high-pine-crest-trail",
        "morni-hills:bada-taal-the-greater-sacred-wetland-lake": "morni-hills:bada-taal-the-greater-sacred-wetland-lake",
        "morni-hills:bada-taal-lotus-wetland": "morni-hills:bada-taal-the-greater-sacred-wetland-lake",
        "morni-hills:bada-taal": "morni-hills:bada-taal-the-greater-sacred-wetland-lake",
        "morni-hills:the-greater-sacred-wetland-lake": "morni-hills:bada-taal-the-greater-sacred-wetland-lake",
        "morni-hills:bhuru-singh-deota-cliff-sanctuary": "morni-hills:bhuru-singh-deota-cliff-sanctuary",
        "morni-hills:bhurusingh-deota-temple": "morni-hills:bhuru-singh-deota-cliff-sanctuary",
        "morni-hills:saketi-shivalik-prehistoric-fossil-park": "morni-hills:saketi-shivalik-prehistoric-fossil-park",
        "morni-hills:shivalik-fossil-park-saketi": "morni-hills:saketi-shivalik-prehistoric-fossil-park",
        "morni-hills:morni-pine-canopy-treehouse-platform": "morni-hills:morni-pine-canopy-treehouse-platform",
        "morni-hills:morni-tree-house-lookout": "morni-hills:morni-pine-canopy-treehouse-platform",
        "morni-hills:morni-forest-wild-multifloral-honey-apiary": "morni-hills:morni-forest-wild-multifloral-honey-apiary",
        "morni-hills:haryana-agro-honey-center": "morni-hills:morni-forest-wild-multifloral-honey-apiary",
        "morni-hills:ghaggar-river-pebble-banks-and-shallows": "morni-hills:ghaggar-river-pebble-banks-and-shallows",
        "morni-hills:ghaggar-river-pebble-banks": "morni-hills:ghaggar-river-pebble-banks-and-shallows",
        "morni-hills:shallows": "morni-hills:ghaggar-river-pebble-banks-and-shallows",
        "munnar:eravikulam-national-park-rajamalai": "munnar:eravikulam-national-park-rajamalai",
        "munnar:eravikulam-national-park": "munnar:eravikulam-national-park-rajamalai",
        "munnar:rajamalai": "munnar:eravikulam-national-park-rajamalai",
        "munnar:mattupetty-dam-and-speedboating-basin": "munnar:mattupetty-dam-and-speedboating-basin",
        "munnar:mattupetty-dam-lake": "munnar:mattupetty-dam-and-speedboating-basin",
        "munnar:mattupetty-dam": "munnar:mattupetty-dam-and-speedboating-basin",
        "munnar:speedboating-basin": "munnar:mattupetty-dam-and-speedboating-basin",
        "munnar:kdhp-tea-museum-and-factory-processing": "munnar:kdhp-tea-museum-and-factory-processing",
        "munnar:tata-tea-museum": "munnar:kdhp-tea-museum-and-factory-processing",
        "munnar:factory-processing": "munnar:kdhp-tea-museum-and-factory-processing",
        "munnar:kdhp-tea-museum": "munnar:kdhp-tea-museum-and-factory-processing",
        "munnar:top-station-western-ghats-cloud-viewpoint": "munnar:top-station-western-ghats-cloud-viewpoint",
        "munnar:top-station-viewpoint": "munnar:top-station-western-ghats-cloud-viewpoint",
        "munnar:attukad-waterfalls-jungle-trail": "munnar:attukad-waterfalls-jungle-trail",
        "munnar:attukad-waterfalls": "munnar:attukad-waterfalls-jungle-trail",
        "munnar:pothamedu-viewpoint-sunset-over-tea-valleys": "munnar:pothamedu-viewpoint-sunset-over-tea-valleys",
        "munnar:pothamedu-viewpoint": "munnar:pothamedu-viewpoint-sunset-over-tea-valleys",
        "munnar:sunset-over-tea-valleys": "munnar:pothamedu-viewpoint-sunset-over-tea-valleys",
        "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry": "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry",
        "munnar:rapsy-restaurant": "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry",
        "munnar:beef-fry": "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry",
        "munnar:kerala-parotta": "munnar:rapsy-restaurant-kerala-parotta-and-beef-fry",
        "munnar:kundala-lake-and-shikara-boating": "munnar:kundala-lake-and-shikara-boating",
        "munnar:kundala-lake-dam": "munnar:kundala-lake-and-shikara-boating",
        "munnar:kundala-lake": "munnar:kundala-lake-and-shikara-boating",
        "munnar:shikara-boating": "munnar:kundala-lake-and-shikara-boating",
        "munnar:kolukkumalai-tea-estate-worlds-highest": "munnar:kolukkumalai-tea-estate-worlds-highest",
        "munnar:kolukkumalai-tea": "munnar:kolukkumalai-tea-estate-worlds-highest",
        "munnar:kolukkumalai-tea-estate": "munnar:kolukkumalai-tea-estate-worlds-highest",
        "munnar:worlds-highest": "munnar:kolukkumalai-tea-estate-worlds-highest",
        "munnar:lockhart-gap-and-bison-valley-viewpoint": "munnar:lockhart-gap-and-bison-valley-viewpoint",
        "munnar:lockhart-gap": "munnar:lockhart-gap-and-bison-valley-viewpoint",
        "munnar:bison-valley-viewpoint": "munnar:lockhart-gap-and-bison-valley-viewpoint",
        "munnar:anamudi-peak-base-and-shola-forest-edge": "munnar:anamudi-peak-base-and-shola-forest-edge",
        "munnar:anamudi-peak-base": "munnar:anamudi-peak-base-and-shola-forest-edge",
        "munnar:shola-forest-edge": "munnar:anamudi-peak-base-and-shola-forest-edge",
        "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens": "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens",
        "munnar:marayoor-sandalwood-forest": "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens",
        "munnar:megalithic-dolmens": "munnar:marayoor-sandalwood-forest-and-megalithic-dolmens",
        "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail": "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail",
        "munnar:chinnar-wildlife-sanctuary": "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail",
        "munnar:thorny-scrub-trail": "munnar:chinnar-wildlife-sanctuary-and-thorny-scrub-trail",
        "munnar:lakkom-cascading-waterfalls": "munnar:lakkom-cascading-waterfalls",
        "munnar:lakkom-waterfalls": "munnar:lakkom-cascading-waterfalls",
        "munnar:saravana-bhavan-munnar-town": "munnar:saravana-bhavan-munnar-town",
        "munnar:saravana-bhavan-munnar": "munnar:saravana-bhavan-munnar-town",
        "munnar:saravana-bhavan": "munnar:saravana-bhavan-munnar-town",
        "munnar:eastend-chai-bazaar-and-plantation-tasting": "munnar:eastend-chai-bazaar-and-plantation-tasting",
        "munnar:eastend-chai-bazaar": "munnar:eastend-chai-bazaar-and-plantation-tasting",
        "munnar:plantation-tasting": "munnar:eastend-chai-bazaar-and-plantation-tasting",
        "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
        "murthal:amrik-sukhdev-dhaba": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
        "murthal:7-paratha-dhaba": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
        "murthal:amrik-sukhdev": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
        "murthal:legendary-24": "murthal:amrik-sukhdev-legendary-24-7-paratha-dhaba",
        "murthal:haveli-murthal-punjabi-cultural-theme-village": "murthal:haveli-murthal-punjabi-cultural-theme-village",
        "murthal:haveli-murthal-punjabi": "murthal:haveli-murthal-punjabi-cultural-theme-village",
        "murthal:haveli-murthal": "murthal:haveli-murthal-punjabi-cultural-theme-village",
        "murthal:haveli-punjabi": "murthal:haveli-murthal-punjabi-cultural-theme-village",
        "murthal:punjabi-cultural-theme-village": "murthal:haveli-murthal-punjabi-cultural-theme-village",
        "murthal:gulshan-dhaba-traditional-tandoori-kitchen": "murthal:gulshan-dhaba-traditional-tandoori-kitchen",
        "murthal:gulshan-dhaba-traditional": "murthal:gulshan-dhaba-traditional-tandoori-kitchen",
        "murthal:pahalwan-dhaba-pure-desi-ghee-roasters": "murthal:pahalwan-dhaba-pure-desi-ghee-roasters",
        "murthal:pahalwan-dhaba-murthal": "murthal:pahalwan-dhaba-pure-desi-ghee-roasters",
        "murthal:pahalwan-dhaba": "murthal:pahalwan-dhaba-pure-desi-ghee-roasters",
        "murthal:mojoland-multi-theme-adventure-park": "murthal:mojoland-multi-theme-adventure-park",
        "murthal:mojoland-adventure-park": "murthal:mojoland-multi-theme-adventure-park",
        "murthal:mannat-haveli-grand-highway-palace": "murthal:mannat-haveli-grand-highway-palace",
        "murthal:mannat-haveli-murthal": "murthal:mannat-haveli-grand-highway-palace",
        "murthal:mannat-haveli": "murthal:mannat-haveli-grand-highway-palace",
        "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture": "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture",
        "murthal:khwaja-khizr-tomb": "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture",
        "murthal:1522-pathan-architecture": "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture",
        "murthal:tomb-of-khwaja-khizr": "murthal:tomb-of-khwaja-khizr-1522-pathan-architecture",
        "murthal:dhingra-sweets-and-pure-milk-kadhai": "murthal:dhingra-sweets-and-pure-milk-kadhai",
        "murthal:dhingra-sweets-milk-bar": "murthal:dhingra-sweets-and-pure-milk-kadhai",
        "murthal:dhingra-sweets": "murthal:dhingra-sweets-and-pure-milk-kadhai",
        "murthal:pure-milk-kadhai": "murthal:dhingra-sweets-and-pure-milk-kadhai",
        "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor": "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor",
        "murthal:shiva-dhaba-pure-desi-ghee": "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor",
        "murthal:pure-desi-ghee-tandoor": "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor",
        "murthal:shiva-tourist-dhaba": "murthal:shiva-tourist-dhaba-pure-desi-ghee-tandoor",
        "murthal:chokhi-dhani-sonepat-heritage-cultural-fair": "murthal:chokhi-dhani-sonepat-heritage-cultural-fair",
        "murthal:chokhi-dhani-sonipat-village": "murthal:chokhi-dhani-sonepat-heritage-cultural-fair",
        "murthal:badkhalsa-memorial-and-sikh-heritage-museum": "murthal:badkhalsa-memorial-and-sikh-heritage-museum",
        "murthal:badkhalsa-memorial-museum": "murthal:badkhalsa-memorial-and-sikh-heritage-museum",
        "murthal:badkhalsa-memorial": "murthal:badkhalsa-memorial-and-sikh-heritage-museum",
        "murthal:sikh-heritage-museum": "murthal:badkhalsa-memorial-and-sikh-heritage-museum",
        "murthal:haryana-tourism-ethnic-craft-village-and-loom": "murthal:haryana-tourism-ethnic-craft-village-and-loom",
        "murthal:haryana-tourism-ethnic-hub": "murthal:haryana-tourism-ethnic-craft-village-and-loom",
        "murthal:haryana-tourism-ethnic-craft-village": "murthal:haryana-tourism-ethnic-craft-village-and-loom",
        "murthal:loom": "murthal:haryana-tourism-ethnic-craft-village-and-loom",
        "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields": "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields",
        "murthal:hero": "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields",
        "murthal:murthal-rural-canal-lanes": "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields",
        "murthal:yellow-mustard-fields": "murthal:murthal-rural-canal-lanes-and-yellow-mustard-fields",
        "murthal:farm-fresh-kadhai-milk-and-rabri-counter": "murthal:farm-fresh-kadhai-milk-and-rabri-counter",
        "murthal:sukhdev-farm-fresh-milk-counter": "murthal:farm-fresh-kadhai-milk-and-rabri-counter",
        "murthal:farm-fresh-kadhai-milk": "murthal:farm-fresh-kadhai-milk-and-rabri-counter",
        "murthal:rabri-counter": "murthal:farm-fresh-kadhai-milk-and-rabri-counter",
        "murthal:sonipat-yamuna-riverfront-sand-banks": "murthal:sonipat-yamuna-riverfront-sand-banks",
        "murthal:yamuna-river-ghats-sonipat": "murthal:sonipat-yamuna-riverfront-sand-banks",
        "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo": "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo",
        "murthal:pehalwan-kachori-subzi-corner": "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo",
        "murthal:heeng-aloo": "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo",
        "murthal:pahalwan-khasta-dal-kachori": "murthal:pahalwan-khasta-dal-kachori-and-heeng-aloo",
        "mussoorie:landour-bakehouse-and-sisters-bazaar": "mussoorie:landour-bakehouse",
        "mussoorie:landour-bakehouse": "mussoorie:landour-bakehouse",
        "mussoorie:sisters-bazaar": "mussoorie:landour-bakehouse-and-sisters-bazaar",
        "mussoorie:lal-tibba-scenic-viewpoint": "mussoorie:lal-tibba",
        "mussoorie:lal-tibba": "mussoorie:lal-tibba",
        "mussoorie:char-dukan-and-st-pauls-church": "mussoorie:char-dukan-and-st-pauls-church",
        "mussoorie:st-pauls-church": "mussoorie:st-pauls-church",
        "mussoorie:char-dukan": "mussoorie:char-dukan-and-st-pauls-church",
        "mussoorie:sir-george-everest-peak-and-heritage-house": "mussoorie:sir-george-everest-peak-and-heritage-house",
        "mussoorie:george-everest-peak": "mussoorie:george-everest",
        "mussoorie:heritage-house": "mussoorie:sir-george-everest-peak-and-heritage-house",
        "mussoorie:sir-george-everest-peak": "mussoorie:sir-george-everest-peak-and-heritage-house",
        "mussoorie:camels-back-road-deodar-promenade": "mussoorie:camels-back-road-deodar-promenade",
        "mussoorie:camels-back-road": "mussoorie:camels-back-road",
        "mussoorie:clouds-end-heritage-forest-sanctuary": "mussoorie:clouds-end-heritage-forest-sanctuary",
        "mussoorie:clouds-end-forest": "mussoorie:clouds-end",
        "mussoorie:gun-hill-historical-viewpoint-and-cable-car": "mussoorie:gun-hill-historical-viewpoint-and-cable-car",
        "mussoorie:gun-hill-ropeway": "mussoorie:gun-hill",
        "mussoorie:cable-car": "mussoorie:gun-hill-historical-viewpoint-and-cable-car",
        "mussoorie:gun-hill-historical-viewpoint": "mussoorie:gun-hill-historical-viewpoint-and-cable-car",
        "mussoorie:kempty-falls-mountain-cascades": "mussoorie:kempty-falls-mountain-cascades",
        "mussoorie:kempty-falls-cascades": "mussoorie:kempty-falls",
        "mussoorie:char-dukan-heritage-cafe-lane-landour": "mussoorie:char-dukan-heritage-cafe-lane-landour",
        "mussoorie:char-dukan-prakash-store": "mussoorie:char-dukan-heritage-cafe-lane-landour",
        "mussoorie:char-dukan-heritage-cafe-lane": "mussoorie:char-dukan-heritage-cafe-lane-landour",
        "mussoorie:landour": "mussoorie:landour",
        "mussoorie:pari-tibba-witches-hill-pine-ridge-trail": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
        "mussoorie:pari-tibba-fairies-hill": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
        "mussoorie:pari-tibba": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
        "mussoorie:pine-ridge-trail": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
        "mussoorie:witches-hill": "mussoorie:pari-tibba-witches-hill-pine-ridge-trail",
        "mussoorie:clouds-end-virgin-oak-sanctuary": "mussoorie:clouds-end-virgin-oak-sanctuary",
        "mussoorie:clouds-end": "mussoorie:clouds-end",
        "mussoorie:rokeby-manor-and-emilys-tea-room": "mussoorie:rokeby-manor-and-emilys-tea-room",
        "mussoorie:rokeby-manor": "mussoorie:rokeby-manor-and-emilys-tea-room",
        "mussoorie:emilys-tea-room": "mussoorie:rokeby-manor-and-emilys-tea-room",
        "mussoorie:jharipani-cascading-waterfall-trail": "mussoorie:jharipani-cascading-waterfall-trail",
        "mussoorie:kempty-falls": "mussoorie:kempty-falls",
        "mussoorie:prakash-store-and-handmade-cheese-deli-1928": "mussoorie:prakash-store-and-handmade-cheese-deli-1928",
        "mussoorie:prakash-store": "mussoorie:prakash-store-and-handmade-cheese-deli-1928",
        "mussoorie:1928": "mussoorie:prakash-store-and-handmade-cheese-deli-1928",
        "mussoorie:handmade-cheese-deli": "mussoorie:prakash-store-and-handmade-cheese-deli-1928",
        "mussoorie:company-garden-and-artificial-falls": "mussoorie:company-garden-and-artificial-falls",
        "mussoorie:company-garden": "mussoorie:company-garden-and-artificial-falls",
        "mussoorie:artificial-falls": "mussoorie:company-garden-and-artificial-falls",
        "mussoorie:the-mall-road-mussoorie-and-kulri-bazaar": "mussoorie:the-mall-road-mussoorie-and-kulri-bazaar",
        "mussoorie:mall-road": "mussoorie:mall-road",
        "neemrana:neemrana-fort-palace-15th-century-ramparts": "neemrana:neemrana-fort-palace-15th-century-ramparts",
        "neemrana:neemrana-fort-palace": "neemrana:neemrana-fort-palace-15th-century-ramparts",
        "neemrana:fort-palace": "neemrana:neemrana-fort-palace-15th-century-ramparts",
        "neemrana:flying-fox-aerial-zipline-tour": "neemrana:flying-fox-aerial-zipline-tour",
        "neemrana:flying-fox-zipline": "neemrana:flying-fox-aerial-zipline-tour",
        "neemrana:ancient-9-story-stepwell-neemrana-baori": "neemrana:ancient-9-story-stepwell-neemrana-baori",
        "neemrana:neemrana-stepwell-baori": "neemrana:ancient-9-story-stepwell-neemrana-baori",
        "neemrana:ancient-9-story-stepwell": "neemrana:ancient-9-story-stepwell-neemrana-baori",
        "neemrana:neemrana-baori": "neemrana:ancient-9-story-stepwell-neemrana-baori",
        "neemrana:stepwell-baori": "neemrana:ancient-9-story-stepwell-neemrana-baori",
        "neemrana:kesroli-14th-century-hill-fort-en-route": "neemrana:kesroli-14th-century-hill-fort-en-route",
        "neemrana:kesroli-hill-fort": "neemrana:kesroli-14th-century-hill-fort-en-route",
        "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub": "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub",
        "neemrana:japanese-zone-cuisine": "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub",
        "neemrana:neemrana-japanese-industrial-zone": "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub",
        "neemrana:ramen-hub": "neemrana:neemrana-japanese-industrial-zone-and-ramen-hub",
        "neemrana:highway-king-nh-48-express-dhaba": "neemrana:highway-king-nh-48-express-dhaba",
        "neemrana:highway-king-dhaba": "neemrana:highway-king-nh-48-express-dhaba",
        "neemrana:baba-khetanath-hilltop-ashram-and-ridge": "neemrana:baba-khetanath-hilltop-ashram-and-ridge",
        "neemrana:baba-khetanath-ashram": "neemrana:baba-khetanath-hilltop-ashram-and-ridge",
        "neemrana:baba-khetanath-hilltop-ashram": "neemrana:baba-khetanath-hilltop-ashram-and-ridge",
        "neemrana:siliserh-lake-gateway-en-route": "neemrana:siliserh-lake-gateway-en-route",
        "neemrana:siliserh-en-route-neemrana": "neemrana:siliserh-lake-gateway-en-route",
        "neemrana:siliserh-en-route": "neemrana:siliserh-lake-gateway-en-route",
        "neemrana:tijara-fort-palace-19th-century-hilltop-citadel": "neemrana:tijara-fort-palace-19th-century-hilltop-citadel",
        "neemrana:tijara-fort-palace-heritage": "neemrana:tijara-fort-palace-19th-century-hilltop-citadel",
        "neemrana:19th-century-hilltop-citadel": "neemrana:tijara-fort-palace-19th-century-hilltop-citadel",
        "neemrana:tijara-fort-palace": "neemrana:tijara-fort-palace-19th-century-hilltop-citadel",
        "neemrana:aravalli-quartzite-canyon-and-scrub-trail": "neemrana:aravalli-quartzite-canyon-and-scrub-trail",
        "neemrana:aravalli-hidden-gorge-trek": "neemrana:aravalli-quartzite-canyon-and-scrub-trail",
        "neemrana:aravalli-quartzite-canyon": "neemrana:aravalli-quartzite-canyon-and-scrub-trail",
        "neemrana:scrub-trail": "neemrana:aravalli-quartzite-canyon-and-scrub-trail",
        "neemrana:mothooka-ancient-copper-archaeology-site": "neemrana:mothooka-ancient-copper-archaeology-site",
        "neemrana:mothooka-ancient-copper-mines": "neemrana:mothooka-ancient-copper-archaeology-site",
        "neemrana:kotputli-traditional-terracotta-pottery-street": "neemrana:kotputli-traditional-terracotta-pottery-street",
        "neemrana:kotputli-earthen-pottery-lane": "neemrana:kotputli-traditional-terracotta-pottery-street",
        "neemrana:nazara-open-air-medieval-amphitheatre": "neemrana:nazara-open-air-medieval-amphitheatre",
        "neemrana:neemrana-rooftop-amphitheatre": "neemrana:nazara-open-air-medieval-amphitheatre",
        "neemrana:rooftop-amphitheatre": "neemrana:nazara-open-air-medieval-amphitheatre",
        "neemrana:shyam-sarovar-subterranean-baori-oasis": "neemrana:shyam-sarovar-subterranean-baori-oasis",
        "neemrana:shyam-sarovar-kund": "neemrana:shyam-sarovar-subterranean-baori-oasis",
        "neemrana:karni-mata-hilltop-staircase-shrine": "neemrana:karni-mata-hilltop-staircase-shrine",
        "neemrana:karni-mata-shrine-neemrana": "neemrana:karni-mata-hilltop-staircase-shrine",
        "neemrana:karni-mata-shrine": "neemrana:karni-mata-hilltop-staircase-shrine",
        "neemrana:old-alwar-byroad-blooming-mustard-lane": "neemrana:old-alwar-byroad-blooming-mustard-lane",
        "neemrana:old-alwar-road-sarson-fields": "neemrana:old-alwar-byroad-blooming-mustard-lane",
        "rishikesh:parmarth-niketan-ganga-aarti": "rishikesh:parmarth-niketan-ganga-aarti",
        "rishikesh:parmarth-niketan-aarti": "rishikesh:parmarth-niketan-ganga-aarti",
        "rishikesh:parmarth-aarti": "rishikesh:parmarth-niketan-ganga-aarti",
        "rishikesh:parmarth-niketan": "rishikesh:parmarth-niketan-ganga-aarti",
        "rishikesh:beatles-ashram-chaurasi-kutia": "rishikesh:beatles-ashram-chaurasi-kutia",
        "rishikesh:beatles-ashram": "rishikesh:beatles-ashram-chaurasi-kutia",
        "rishikesh:chaurasi-kutia": "rishikesh:beatles-ashram-chaurasi-kutia",
        "rishikesh:the-beatles-ashram": "rishikesh:beatles-ashram-chaurasi-kutia",
        "rishikesh:neer-garh-cascading-waterfall": "rishikesh:neer-garh-cascading-waterfall",
        "rishikesh:neer-garh-waterfall": "rishikesh:neer-garh-cascading-waterfall",
        "rishikesh:neer-garh": "rishikesh:neer-garh-cascading-waterfall",
        "rishikesh:neer-waterfall": "rishikesh:neer-garh-cascading-waterfall",
        "rishikesh:shivpuri-white-water-river-rafting": "rishikesh:shivpuri-rafting",
        "rishikesh:shivpuri-river-rafting": "rishikesh:shivpuri-rafting",
        "rishikesh:shivpuri-rafting": "rishikesh:shivpuri-rafting",
        "rishikesh:triveni-ghat-evening-maha-aarti": "rishikesh:triveni-ghat-evening-maha-aarti",
        "rishikesh:triveni-ghat-aarti": "rishikesh:triveni-ghat-evening-maha-aarti",
        "rishikesh:triveni-ghat": "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m",
        "rishikesh:vashistha-cave-gufa": "rishikesh:vashistha-cave-gufa",
        "rishikesh:vashistha-cave": "rishikesh:vashistha-cave-gufa",
        "rishikesh:gufa": "rishikesh:vashistha-cave-gufa",
        "rishikesh:vashistha-gufa": "rishikesh:vashistha-cave-gufa",
        "rishikesh:devraj-coffee-and-german-bakery": "rishikesh:devraj-coffee-and-german-bakery",
        "rishikesh:german-bakery-tapovan": "rishikesh:devraj-coffee-and-german-bakery",
        "rishikesh:devraj-coffee": "rishikesh:devraj-coffee-and-german-bakery",
        "rishikesh:devraj-coffee-german-bakery": "rishikesh:devraj-coffee-and-german-bakery",
        "rishikesh:german-bakery": "rishikesh:devraj-coffee-and-german-bakery",
        "rishikesh:ram-jhula-suspension-bridge-promenade": "rishikesh:ram-jhula-suspension-bridge-promenade",
        "rishikesh:ram-jhula-promenade": "rishikesh:ram-jhula-suspension-bridge-promenade",
        "rishikesh:ram-jhula": "rishikesh:ram-jhula-suspension-bridge-promenade",
        "rishikesh:swarg-ashram-and-sacred-kutiyas": "rishikesh:swarg-ashram-and-sacred-kutiyas",
        "rishikesh:swarg-ashram": "rishikesh:swarg-ashram-and-sacred-kutiyas",
        "rishikesh:sacred-kutiyas": "rishikesh:swarg-ashram-and-sacred-kutiyas",
        "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m": "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m",
        "rishikesh:645m": "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m",
        "rishikesh:kunjapuri-devi-sunrise-temple-ridge": "rishikesh:kunjapuri-devi-sunrise-temple-ridge-1-645m",
        "rishikesh:kaudiyala-white-sand-river-bank": "rishikesh:kaudiyala-white-sand-river-bank",
        "rishikesh:kaudiyala-white-sands": "rishikesh:kaudiyala-white-sand-river-bank",
        "rishikesh:patna-cascading-waterfall-and-limestone-caves": "rishikesh:patna-cascading-waterfall-and-limestone-caves",
        "rishikesh:patna-waterfall": "rishikesh:patna-cascading-waterfall-and-limestone-caves",
        "rishikesh:limestone-caves": "rishikesh:patna-cascading-waterfall-and-limestone-caves",
        "rishikesh:patna-cascading-waterfall": "rishikesh:patna-cascading-waterfall-and-limestone-caves",
        "rishikesh:little-buddha-cafe-treehouse-lounge": "rishikesh:little-buddha-cafe-treehouse-lounge",
        "rishikesh:little-buddha-cafe": "rishikesh:little-buddha-cafe-treehouse-lounge",
        "rishikesh:the-sitting-elephant-rooftop-dining": "rishikesh:the-sitting-elephant-rooftop-dining",
        "rishikesh:sitting-elephant-restaurant": "rishikesh:the-sitting-elephant-rooftop-dining",
        "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m": "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m",
        "rishikesh:kunjapuri-devi-sunrise-crest": "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m",
        "rishikesh:665m": "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m",
        "rishikesh:kunjapuri-devi-sunrise-temple-crest": "rishikesh:kunjapuri-devi-sunrise-temple-crest-1-665m",
        "rishikesh:rajaji-national-park-chilla-elephant-safari-gate": "rishikesh:rajaji-national-park-chilla-elephant-safari-gate",
        "rishikesh:rajaji-national-park-chilla": "rishikesh:rajaji-national-park-chilla-elephant-safari-gate",
        "rishikesh:chilla-elephant-safari-gate": "rishikesh:rajaji-national-park-chilla-elephant-safari-gate",
        "rishikesh:rajaji-national-park": "rishikesh:rajaji-national-park-chilla-elephant-safari-gate",
        "sariska-bhangarh:sariska-tiger-reserve-jungle-safari": "sariska-bhangarh:sariska-tiger-reserve-jungle-safari",
        "sariska-bhangarh:sariska-tiger-reserve": "sariska-bhangarh:sariska-tiger-reserve-jungle-safari",
        "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins": "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins",
        "sariska-bhangarh:bhangarh-fort-ruins": "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins",
        "sariska-bhangarh:bhangarh-fort": "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins",
        "sariska-bhangarh:legendary-medieval-ruins": "sariska-bhangarh:bhangarh-fort-legendary-medieval-ruins",
        "sariska-bhangarh:kankwari-fort-hilltop-fortress": "sariska-bhangarh:kankwari-fort-hilltop-fortress",
        "sariska-bhangarh:kankwari-fort": "sariska-bhangarh:kankwari-fort-hilltop-fortress",
        "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm": "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm",
        "sariska-bhangarh:pandupol-hanuman-temple": "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm",
        "sariska-bhangarh:natural-water-chasm": "sariska-bhangarh:pandupol-hanuman-temple-and-natural-water-chasm",
        "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century": "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century",
        "sariska-bhangarh:neelkanth-temple-sariska": "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century",
        "sariska-bhangarh:6th-century": "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century",
        "sariska-bhangarh:neelkanth-ancient-temple-complex": "sariska-bhangarh:neelkanth-ancient-temple-complex-6th-century",
        "sariska-bhangarh:bhartrihari-temple-and-sacred-kund": "sariska-bhangarh:bhartrihari-temple-and-sacred-kund",
        "sariska-bhangarh:bhartrihari-temple-kund": "sariska-bhangarh:bhartrihari-temple-and-sacred-kund",
        "sariska-bhangarh:bhartrihari-temple": "sariska-bhangarh:bhartrihari-temple-and-sacred-kund",
        "sariska-bhangarh:sacred-kund": "sariska-bhangarh:bhartrihari-temple-and-sacred-kund",
        "sariska-bhangarh:the-sariska-palace-royal-french-courtyards": "sariska-bhangarh:the-sariska-palace-royal-french-courtyards",
        "sariska-bhangarh:sariska-palace-courtyard": "sariska-bhangarh:the-sariska-palace-royal-french-courtyards",
        "sariska-bhangarh:gola-ka-baas-traditional-rajasthani-dhaba": "sariska-bhangarh:gola-ka-baas-traditional-rajasthani-dhaba",
        "sariska-bhangarh:gola-ka-baas-dhaba": "sariska-bhangarh:gola-ka-baas-traditional-rajasthani-dhaba",
        "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
        "sariska-bhangarh:ajabgarh-fort-and-dam": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
        "sariska-bhangarh:ajabgarh-fort": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
        "sariska-bhangarh:reservoir": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
        "sariska-bhangarh:the-twin-of-bhangarh": "sariska-bhangarh:ajabgarh-fort-and-reservoir-the-twin-of-bhangarh",
        "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis": "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis",
        "sariska-bhangarh:natni-ka-bara-weir": "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis",
        "sariska-bhangarh:forest-oasis": "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis",
        "sariska-bhangarh:natni-ka-bara-stone-weir": "sariska-bhangarh:natni-ka-bara-stone-weir-and-forest-oasis",
        "sariska-bhangarh:narayani-mata-natural-spring-sanctuary": "sariska-bhangarh:narayani-mata-natural-spring-sanctuary",
        "sariska-bhangarh:narayani-mata-sacred-spring": "sariska-bhangarh:narayani-mata-natural-spring-sanctuary",
        "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds": "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds",
        "sariska-bhangarh:talvriksha-holy-springs-sanctuary": "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds",
        "sariska-bhangarh:talvriksha-arjuna-tree": "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds",
        "sariska-bhangarh:thermal-kunds": "sariska-bhangarh:talvriksha-arjuna-tree-and-thermal-kunds",
        "sariska-bhangarh:kushalgarh-colonial-teak-forest-bungalow": "sariska-bhangarh:kushalgarh-colonial-teak-forest-bungalow",
        "sariska-bhangarh:kushalgarh-forest-rest-house": "sariska-bhangarh:kushalgarh-colonial-teak-forest-bungalow",
        "sariska-bhangarh:mansa-devi-hilltop-cliff-lookout": "sariska-bhangarh:mansa-devi-hilltop-cliff-lookout",
        "sariska-bhangarh:mansa-devi-hill-climb": "sariska-bhangarh:mansa-devi-hilltop-cliff-lookout",
        "sariska-bhangarh:deoli-lake-and-tiger-watering-hole": "sariska-bhangarh:deoli-lake-and-tiger-watering-hole",
        "sariska-bhangarh:deoli-lake-waterhole": "sariska-bhangarh:deoli-lake-and-tiger-watering-hole",
        "sariska-bhangarh:deoli-lake": "sariska-bhangarh:deoli-lake-and-tiger-watering-hole",
        "sariska-bhangarh:tiger-watering-hole": "sariska-bhangarh:deoli-lake-and-tiger-watering-hole",
        "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel": "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel",
        "sariska-bhangarh:rajgarh-fort-palace-ruins": "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel",
        "sariska-bhangarh:ancient-bargujar-citadel": "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel",
        "sariska-bhangarh:rajgarh-hill-fort": "sariska-bhangarh:rajgarh-hill-fort-ancient-bargujar-citadel",
        "spiti:key-gompa-11th-century-fort-monastery": "spiti:key-gompa-11th-century-fort-monastery",
        "spiti:key-monastery": "spiti:key-gompa-11th-century-fort-monastery",
        "spiti:11th-century-fort-monastery": "spiti:key-gompa-11th-century-fort-monastery",
        "spiti:key-gompa": "spiti:key-gompa-11th-century-fort-monastery",
        "spiti:dhankar-gompa-and-cliffside-fortress": "spiti:dhankar-gompa-and-cliffside-fortress",
        "spiti:dhankar-monastery": "spiti:dhankar-gompa-and-cliffside-fortress",
        "spiti:cliffside-fortress": "spiti:dhankar-gompa-and-cliffside-fortress",
        "spiti:dhankar-gompa": "spiti:dhankar-gompa-and-cliffside-fortress",
        "spiti:hikkim-worlds-highest-post-office": "spiti:hikkim-worlds-highest-post-office",
        "spiti:hikkim-post-office": "spiti:hikkim-worlds-highest-post-office",
        "spiti:hikkim": "spiti:hikkim-worlds-highest-post-office",
        "spiti:worlds-highest-post-office": "spiti:hikkim-worlds-highest-post-office",
        "spiti:chandratal-crescent-moon-lake": "spiti:chandratal-crescent-moon-lake",
        "spiti:chandra-taal": "spiti:chandratal-crescent-moon-lake",
        "spiti:chandratal": "spiti:chandratal-crescent-moon-lake",
        "spiti:crescent-moon-lake": "spiti:chandratal-crescent-moon-lake",
        "spiti:langza-giant-buddha-and-marine-fossil-village": "spiti:langza-giant-buddha-and-marine-fossil-village",
        "spiti:langza-buddha": "spiti:langza-giant-buddha-and-marine-fossil-village",
        "spiti:langza-giant-buddha": "spiti:langza-giant-buddha-and-marine-fossil-village",
        "spiti:marine-fossil-village": "spiti:langza-giant-buddha-and-marine-fossil-village",
        "spiti:komic-worlds-highest-motor-connected-village": "spiti:komic-worlds-highest-motor-connected-village",
        "spiti:komic-village": "spiti:komic-worlds-highest-motor-connected-village",
        "spiti:komic": "spiti:komic-worlds-highest-motor-connected-village",
        "spiti:worlds-highest-motor-connected-village": "spiti:komic-worlds-highest-motor-connected-village",
        "spiti:pin-valley-national-park-and-mudh-village": "spiti:pin-valley-national-park-and-mudh-village",
        "spiti:pin-valley-park": "spiti:pin-valley-national-park-and-mudh-village",
        "spiti:mudh-village": "spiti:mudh-village-terminal-hamlet-of-pin-valley",
        "spiti:pin-valley-national-park": "spiti:pin-valley-national-park-and-mudh-village",
        "spiti:cafe-deyzor-and-travelers-lounge": "spiti:cafe-deyzor-and-travelers-lounge",
        "spiti:cafe-deyzor": "spiti:cafe-deyzor-and-travelers-lounge",
        "spiti:travelers-lounge": "spiti:cafe-deyzor-and-travelers-lounge",
        "spiti:chicham-suspension-bridge-asias-highest": "spiti:chicham-suspension-bridge-asias-highest",
        "spiti:chicham-bridge": "spiti:chicham-suspension-bridge-asias-highest",
        "spiti:asias-highest": "spiti:chicham-suspension-bridge-asias-highest",
        "spiti:chicham-suspension-bridge": "spiti:chicham-suspension-bridge-asias-highest",
        "spiti:kibber-village-and-wildlife-sanctuary": "spiti:kibber-village-and-wildlife-sanctuary",
        "spiti:kibber-village": "spiti:kibber-village-and-wildlife-sanctuary",
        "spiti:wildlife-sanctuary": "spiti:kibber-village-and-wildlife-sanctuary",
        "spiti:tabo-monastery-the-ajanta-of-the-himalayas": "spiti:tabo-monastery-the-ajanta-of-the-himalayas",
        "spiti:tabo-monastery": "spiti:tabo-monastery-the-ajanta-of-the-himalayas",
        "spiti:the-ajanta-of-the-himalayas": "spiti:tabo-monastery-the-ajanta-of-the-himalayas",
        "spiti:dhankar-glacial-lake-alpine-tarn": "spiti:dhankar-glacial-lake-alpine-tarn",
        "spiti:dhankar-lake": "spiti:dhankar-glacial-lake-alpine-tarn",
        "spiti:tashigang-worlds-highest-polling-station": "spiti:tashigang-worlds-highest-polling-station",
        "spiti:tashigang": "spiti:tashigang-worlds-highest-polling-station",
        "spiti:worlds-highest-polling-station": "spiti:tashigang-worlds-highest-polling-station",
        "spiti:gue-monastery-and-500-year-old-natural-mummy": "spiti:gue-monastery-and-500-year-old-natural-mummy",
        "spiti:gue-monastery": "spiti:gue-monastery-and-500-year-old-natural-mummy",
        "spiti:500-year-old-natural-mummy": "spiti:gue-monastery-and-500-year-old-natural-mummy",
        "spiti:kaza-old-town-and-central-himalayan-bazaar": "spiti:kaza-old-town-and-central-himalayan-bazaar",
        "spiti:kaza": "spiti:kaza-old-town-and-central-himalayan-bazaar",
        "spiti:central-himalayan-bazaar": "spiti:kaza-old-town-and-central-himalayan-bazaar",
        "spiti:kaza-old-town": "spiti:kaza-old-town-and-central-himalayan-bazaar",
        "spiti:kunzum-pass-gateway-to-spiti-at-4-551m": "spiti:kunzum-pass-gateway-to-spiti-at-4-551m",
        "spiti:kunzum-pass": "spiti:kunzum-pass-gateway-to-spiti-at-4-551m",
        "spiti:551m": "spiti:kunzum-pass-gateway-to-spiti-at-4-551m",
        "spiti:gateway-to-spiti-at-4": "spiti:kunzum-pass-gateway-to-spiti-at-4-551m",
        "spiti:mudh-village-terminal-hamlet-of-pin-valley": "spiti:mudh-village-terminal-hamlet-of-pin-valley",
        "spiti:terminal-hamlet-of-pin-valley": "spiti:mudh-village-terminal-hamlet-of-pin-valley",
        "spiti:the-himalayan-cafe-and-slow-travel-lounge": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
        "spiti:himalayan-cafe-spiti": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
        "spiti:himalayan-cafe": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
        "spiti:slow-travel-lounge": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
        "spiti:the-himalayan-cafe": "spiti:the-himalayan-cafe-and-slow-travel-lounge",
        "tungnath-chandrashila:tungnath-worlds-highest-shiva-shrine": "tungnath-chandrashila:tungnath-worlds-highest-shiva-shrine",
        "tungnath-chandrashila:tungnath-temple": "tungnath-chandrashila:tungnath-temple",
        "tungnath-chandrashila:tungnath": "tungnath-chandrashila:tungnath-temple",
        "tungnath-chandrashila:worlds-highest-shiva-shrine": "tungnath-chandrashila:tungnath-worlds-highest-shiva-shrine",
        "tungnath-chandrashila:chandrashila-4-000m-peak-summit": "tungnath-chandrashila:chandrashila-4-000m-peak-summit",
        "tungnath-chandrashila:chandrashila-summit": "tungnath-chandrashila:chandrashila-summit",
        "tungnath-chandrashila:000m-peak-summit": "tungnath-chandrashila:chandrashila-4-000m-peak-summit",
        "tungnath-chandrashila:chandrashila-4": "tungnath-chandrashila:chandrashila-4-000m-peak-summit",
        "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland": "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland",
        "tungnath-chandrashila:chopta-meadows-bugyal": "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland",
        "tungnath-chandrashila:chopta-alpine-meadows": "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland",
        "tungnath-chandrashila:mini-switzerland": "tungnath-chandrashila:chopta-alpine-meadows-mini-switzerland",
        "tungnath-chandrashila:deoria-tal-sacred-reflection-lake": "tungnath-chandrashila:deoria-tal-sacred-reflection-lake",
        "tungnath-chandrashila:deoria-tal-lake": "tungnath-chandrashila:deoria-tal-sacred-reflection-lake",
        "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk": "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk",
        "tungnath-chandrashila:rohida-forest-trail": "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk",
        "tungnath-chandrashila:rhododendron-forest-walk": "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk",
        "tungnath-chandrashila:rohida-oak": "tungnath-chandrashila:rohida-oak-and-rhododendron-forest-walk",
        "tungnath-chandrashila:dugalbitta-eco-camp-glade": "tungnath-chandrashila:dugalbitta-eco-camp-glade",
        "tungnath-chandrashila:dugalbitta-eco-glade": "tungnath-chandrashila:dugalbitta-eco-camp-glade",
        "tungnath-chandrashila:ukhimath-omkareshwar-winter-temple": "tungnath-chandrashila:ukhimath-omkareshwar-winter-temple",
        "tungnath-chandrashila:ukhimath-omkareshwar": "tungnath-chandrashila:ukhimath-omkareshwar-winter-temple",
        "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk": "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk",
        "tungnath-chandrashila:sari-village-base": "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk",
        "tungnath-chandrashila:homestay-walk": "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk",
        "tungnath-chandrashila:sari-village-apple-terraces": "tungnath-chandrashila:sari-village-apple-terraces-and-homestay-walk",
        "tungnath-chandrashila:kanchula-korak-musk-deer-sanctuary": "tungnath-chandrashila:kanchula-korak-musk-deer-sanctuary",
        "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath": "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath",
        "tungnath-chandrashila:makku-math-winter-tungnath": "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath",
        "tungnath-chandrashila:makkumath-temple": "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath",
        "tungnath-chandrashila:winter-abode-of-lord-tungnath": "tungnath-chandrashila:makkumath-temple-winter-abode-of-lord-tungnath",
        "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps": "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps",
        "tungnath-chandrashila:baniyakund-high-meadows": "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps",
        "tungnath-chandrashila:baniyakund-high-alpine-meadows": "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps",
        "tungnath-chandrashila:eco-camps": "tungnath-chandrashila:baniyakund-high-alpine-meadows-and-eco-camps",
        "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
        "tungnath-chandrashila:ravan-shila-cliff": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
        "tungnath-chandrashila:800m": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
        "tungnath-chandrashila:ravan-shila": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
        "tungnath-chandrashila:the-cliff-of-penance-at-3": "tungnath-chandrashila:ravan-shila-the-cliff-of-penance-at-3-800m",
        "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple": "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple",
        "tungnath-chandrashila:kalpeshwar-cave-temple": "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple",
        "tungnath-chandrashila:kalpeshwar-fifth-kedar": "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple",
        "tungnath-chandrashila:sacred-hair-temple": "tungnath-chandrashila:kalpeshwar-fifth-kedar-sacred-hair-temple",
        "tungnath-chandrashila:madhyamaheshwar-valley-circuit-base": "tungnath-chandrashila:madhyamaheshwar-valley-circuit-base",
        "tungnath-chandrashila:madhyamaheshwar-base-circuit": "tungnath-chandrashila:madhyamaheshwar-valley-circuit-base",
        "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail": "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail",
        "tungnath-chandrashila:ansuya-devi-waterfall-trail": "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail",
        "tungnath-chandrashila:ansuya-devi-jungle-waterfall": "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail",
        "tungnath-chandrashila:hermitage-trail": "tungnath-chandrashila:ansuya-devi-jungle-waterfall-and-hermitage-trail",
        "tungnath-chandrashila:chopta-alpine-shepherd-encampments": "tungnath-chandrashila:chopta-alpine-shepherd-encampments",
        "tungnath-chandrashila:chopta-shepherds-stone-huts": "tungnath-chandrashila:chopta-alpine-shepherd-encampments",
        "udaipur:city-palace-complex-and-zenana-mahal": "udaipur:city-palace-complex-and-zenana-mahal",
        "udaipur:city-palace-udaipur": "udaipur:city-palace-complex-and-zenana-mahal",
        "udaipur:city-palace": "udaipur:city-palace-complex-and-zenana-mahal",
        "udaipur:city-palace-complex": "udaipur:city-palace-complex-and-zenana-mahal",
        "udaipur:city-palace-of-udaipur": "udaipur:city-palace-complex-and-zenana-mahal",
        "udaipur:udaipur-city-palace": "udaipur:city-palace-complex-and-zenana-mahal",
        "udaipur:zenana-mahal": "udaipur:city-palace-complex-and-zenana-mahal",
        "udaipur:lake-pichola-ghats-and-island-cruise": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:lake-pichola-boat-ride": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:island-cruise": "udaipur:lake-pichola-ghats-and-island-cruise",
        "udaipur:lake-pichola": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:lake-pichola-ghats": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:lake-pichola-sunset-boat-voyage": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:pichola-boat-ride": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:pichola-cruise": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:bagore-ki-haveli-and-dharohar-dance": "udaipur:bagore-ki-haveli-and-dharohar-dance",
        "udaipur:bagore-ki-haveli": "udaipur:bagore-ki-haveli-and-dharohar-dance",
        "udaipur:bagore": "udaipur:bagore-ki-haveli-and-dharohar-dance",
        "udaipur:bagore-haveli": "udaipur:bagore-ki-haveli-and-dharohar-dance",
        "udaipur:dharohar-dance": "udaipur:bagore-ki-haveli-and-dharohar-dance",
        "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
        "udaipur:ambrai-ghat": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
        "udaipur:ambrai": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
        "udaipur:ambrai-ghat-sunset-promenade": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
        "udaipur:manjhi-ghat": "udaipur:ambrai-ghat-sunset-promenade-manjhi-ghat",
        "udaipur:saheliyon-ki-bari-garden-of-maidens": "udaipur:saheliyon-ki-bari-garden-of-maidens",
        "udaipur:saheliyon-ki-bari": "udaipur:saheliyon-ki-bari-garden-of-maidens",
        "udaipur:garden-of-maidens": "udaipur:saheliyon-ki-bari-garden-of-maidens",
        "udaipur:saheliyon": "udaipur:saheliyon-ki-bari-garden-of-maidens",
        "udaipur:saheliyon-bari": "udaipur:saheliyon-ki-bari-garden-of-maidens",
        "udaipur:sajjangarh-monsoon-palace-ridge": "udaipur:sajjangarh-monsoon-palace-ridge",
        "udaipur:sajjangarh-monsoon-palace": "udaipur:sajjangarh-monsoon-palace-ridge",
        "udaipur:monsoon-palace": "udaipur:sajjangarh-monsoon-palace-ridge",
        "udaipur:sajjangarh": "udaipur:sajjangarh-monsoon-palace-ridge",
        "udaipur:jheels-ginger-coffee-bar-and-bakery": "udaipur:jheels-ginger-coffee-bar-and-bakery",
        "udaipur:jheels-ginger-coffee": "udaipur:jheels-ginger-coffee-bar-and-bakery",
        "udaipur:bakery": "udaipur:jheels-ginger-coffee-bar-and-bakery",
        "udaipur:jeels-coffee": "udaipur:jheels-ginger-coffee-bar-and-bakery",
        "udaipur:jeels-ginger-coffee-bar": "udaipur:jheels-ginger-coffee-bar-and-bakery",
        "udaipur:jheels-coffee": "udaipur:jheels-ginger-coffee-bar-and-bakery",
        "udaipur:jheels-ginger-coffee-bar": "udaipur:jheels-ginger-coffee-bar-and-bakery",
        "udaipur:natraj-dining-hall-unlimited-mewari-thali": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
        "udaipur:natraj-dining-hall": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
        "udaipur:natraj": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
        "udaipur:natraj-thali": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
        "udaipur:unlimited-mewari-thali": "udaipur:natraj-dining-hall-unlimited-mewari-thali",
        "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine": "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine",
        "udaipur:jagdish-temple": "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine",
        "udaipur:1651-ce-indo-aryan-shrine": "udaipur:jagdish-temple-1651-ce-indo-aryan-shrine",
        "udaipur:fateh-sagar-lake-and-nehru-island-park": "udaipur:fateh-sagar-lake-and-nehru-island-park",
        "udaipur:fateh-sagar-lake": "udaipur:fateh-sagar-lake-and-nehru-island-park",
        "udaipur:nehru-island-park": "udaipur:fateh-sagar-lake-and-nehru-island-park",
        "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar": "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar",
        "udaipur:ahar-cenotaphs": "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar",
        "udaipur:ahar-royal-cenotaphs": "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar",
        "udaipur:mahasatyas-of-mewar": "udaipur:ahar-royal-cenotaphs-mahasatyas-of-mewar",
        "udaipur:shilpgram-rural-arts-and-crafts-complex": "udaipur:shilpgram-rural-arts-and-crafts-complex",
        "udaipur:shilpgram-crafts": "udaipur:shilpgram-rural-arts-and-crafts-complex",
        "udaipur:crafts-complex": "udaipur:shilpgram-rural-arts-and-crafts-complex",
        "udaipur:rural-arts": "udaipur:shilpgram-rural-arts-and-crafts-complex",
        "udaipur:shilpgram": "udaipur:shilpgram-rural-arts-and-crafts-complex",
        "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata": "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata",
        "udaipur:doodh-talai-lake": "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata",
        "udaipur:ropeway-to-karni-mata": "udaipur:doodh-talai-lake-and-ropeway-to-karni-mata",
        "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:upre-rooftop-dining": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:lake-pichola-rooftop-dining": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:upre-by-1559-ad": "udaipur:upre-by-1559-ad-lake-pichola-rooftop-dining",
        "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen": "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen",
        "udaipur:millets-of-mewar": "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen",
        "udaipur:pioneering-healthy-rajasthani-kitchen": "udaipur:millets-of-mewar-pioneering-healthy-rajasthani-kitchen",
        "udaipur:paliwal-kachori-old-city-breakfast-stand": "udaipur:paliwal-kachori-old-city-breakfast-stand",
        "udaipur:paliwal-kachori": "udaipur:paliwal-kachori-old-city-breakfast-stand",
        "varanasi:dashashwamedh-ghat-evening-maha-aarti": "varanasi:dashashwamedh-ghat-evening-maha-aarti",
        "varanasi:dashashwamedh-ghat-aarti": "varanasi:dashashwamedh-ghat-evening-maha-aarti",
        "varanasi:assi-ghat-subah-e-banaras-morning-ceremony": "varanasi:assi-ghat-subah-e-banaras-morning-ceremony",
        "varanasi:assi-ghat-subah-e-banaras": "varanasi:assi-ghat-subah-e-banaras-morning-ceremony",
        "varanasi:kashi-vishwanath-temple-corridor": "varanasi:kashi-vishwanath-temple-corridor",
        "varanasi:kashi-vishwanath-corridor": "varanasi:kashi-vishwanath-temple-corridor",
        "varanasi:blue-lassi-shop-historic-churn-since-1925": "varanasi:blue-lassi-shop-historic-churn-since-1925",
        "varanasi:blue-lassi-shop": "varanasi:blue-lassi-shop-historic-churn-since-1925",
        "varanasi:historic-churn-since-1925": "varanasi:blue-lassi-shop-historic-churn-since-1925",
        "varanasi:sarnath-dhamek-stupa-and-deer-park": "varanasi:sarnath-dhamek-stupa-and-deer-park",
        "varanasi:sarnath-deer-park": "varanasi:sarnath-dhamek-stupa-and-deer-park",
        "varanasi:deer-park": "varanasi:sarnath-dhamek-stupa-and-deer-park",
        "varanasi:sarnath-dhamek-stupa": "varanasi:sarnath-dhamek-stupa-and-deer-park",
        "varanasi:manikarnika-ghat-the-eternal-flame": "varanasi:manikarnika-ghat-the-eternal-flame",
        "varanasi:manikarnika-ghat": "varanasi:manikarnika-ghat-the-eternal-flame",
        "varanasi:the-eternal-flame": "varanasi:manikarnika-ghat-the-eternal-flame",
        "varanasi:ramnagar-fort-and-vintage-royal-museum": "varanasi:ramnagar-fort-and-vintage-royal-museum",
        "varanasi:ramnagar-fort": "varanasi:ramnagar-fort-and-vintage-royal-museum",
        "varanasi:vintage-royal-museum": "varanasi:ramnagar-fort-and-vintage-royal-museum",
        "varanasi:laxmi-tea-stall-and-malaiyo-hub": "varanasi:laxmi-tea-stall-and-malaiyo-hub",
        "varanasi:kashi-tea-stall": "varanasi:laxmi-tea-stall-and-malaiyo-hub",
        "varanasi:laxmi-tea-stall": "varanasi:laxmi-tea-stall-and-malaiyo-hub",
        "varanasi:malaiyo-hub": "varanasi:laxmi-tea-stall-and-malaiyo-hub",
        "varanasi:harishchandra-ghat-and-silent-sacred-pyres": "varanasi:harishchandra-ghat-and-silent-sacred-pyres",
        "varanasi:harishchandra-ghat": "varanasi:harishchandra-ghat-and-silent-sacred-pyres",
        "varanasi:silent-sacred-pyres": "varanasi:harishchandra-ghat-and-silent-sacred-pyres",
        "varanasi:scindia-ghat-and-the-leaning-shiva-temple": "varanasi:scindia-ghat-and-the-leaning-shiva-temple",
        "varanasi:scindia-ghat-leaning-temple": "varanasi:scindia-ghat-and-the-leaning-shiva-temple",
        "varanasi:scindia-ghat": "varanasi:scindia-ghat-and-the-leaning-shiva-temple",
        "varanasi:the-leaning-shiva-temple": "varanasi:scindia-ghat-and-the-leaning-shiva-temple",
        "varanasi:bharat-kala-bhavan-archeological-museum": "varanasi:bharat-kala-bhavan-archeological-museum",
        "varanasi:bharat-kala-bhavan": "varanasi:bharat-kala-bhavan-archeological-museum",
        "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun": "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
        "varanasi:deena-chaat-bhandar": "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
        "varanasi:gulab-jamun": "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
        "varanasi:tamatar-chaat": "varanasi:deena-chaat-bhandar-tamatar-chaat-and-gulab-jamun",
        "varanasi:kashi-chat-bhandar-godowlia-chowk": "varanasi:kashi-chat-bhandar-godowlia-chowk",
        "varanasi:kashi-chat-bhandar": "varanasi:kashi-chat-bhandar-godowlia-chowk",
        "varanasi:godowlia-chowk": "varanasi:kashi-chat-bhandar-godowlia-chowk",
        "varanasi:tulsi-manas-white-marble-temple": "varanasi:tulsi-manas-white-marble-temple",
        "varanasi:tulsi-manas-temple": "varanasi:tulsi-manas-white-marble-temple",
        "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos": "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos",
        "varanasi:sankat-mochan-temple": "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos",
        "varanasi:besan-laddoos": "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos",
        "varanasi:sankat-mochan-hanuman-temple": "varanasi:sankat-mochan-hanuman-temple-and-besan-laddoos",
        "varanasi:chet-singh-fort-and-river-ramparts": "varanasi:chet-singh-fort-and-river-ramparts",
        "varanasi:chet-singh-fort-ghat": "varanasi:chet-singh-fort-and-river-ramparts",
        "varanasi:chet-singh-fort": "varanasi:chet-singh-fort-and-river-ramparts",
        "varanasi:river-ramparts": "varanasi:chet-singh-fort-and-river-ramparts",
        "delhi:qutub-minar": "delhi:qutub-minar",
        "delhi:qutub": "delhi:qutub-minar",
        "delhi:qutb-minar": "delhi:qutub-minar",
        "delhi:red-fort": "delhi:red-fort",
        "delhi:lal-qila": "delhi:red-fort",
        "delhi:india-gate": "delhi:india-gate",
        "delhi:lotus-temple": "delhi:lotus-temple",
        "delhi:humayuns-tomb": "delhi:humayuns-tomb",
        "delhi:akshardham": "delhi:akshardham",
        "delhi:swaminarayan-akshardham": "delhi:akshardham",
        "delhi:chandni-chowk": "delhi:chandni-chowk",
        "mumbai:gateway-of-india": "mumbai:gateway-of-india",
        "mumbai:gateway": "mumbai:gateway-of-india",
        "amritsar:golden-temple": "amritsar:golden-temple",
        "amritsar:harmandir-sahib": "amritsar:golden-temple",
        "mussoorie:landour-bakehouse-sisters-bazaar": "mussoorie:landour-bakehouse",
        "mussoorie:lal-tibba-viewpoint": "mussoorie:lal-tibba",
        "mussoorie:kempty": "mussoorie:kempty-falls",
        "mussoorie:gun-hill": "mussoorie:gun-hill",
        "mussoorie:gun-hill-viewpoint": "mussoorie:gun-hill",
        "mussoorie:camel-back-road": "mussoorie:camels-back-road",
        "mussoorie:camels-back": "mussoorie:camels-back-road",
        "mussoorie:camel-back": "mussoorie:camels-back-road",
        "mussoorie:mussoorie-mall-road": "mussoorie:mall-road",
        "mussoorie:the-mall-road": "mussoorie:mall-road",
        "mussoorie:george-everest": "mussoorie:george-everest",
        "mussoorie:sir-george-everest-house": "mussoorie:george-everest",
        "mussoorie:george-everest-house": "mussoorie:george-everest",
        "mussoorie:clouds-end-heritage": "mussoorie:clouds-end",
        "mussoorie:landour-cantonment-ridge": "mussoorie:landour",
        "mussoorie:landour-ridge": "mussoorie:landour",
        "mussoorie:st-paul-church": "mussoorie:st-pauls-church",
        "mussoorie:st-pauls-church-landour": "mussoorie:st-pauls-church",
        "dharamshala:bhagsunag-waterfall-and-shiva-cafe": "dharamshala:bhagsunag-waterfall",
        "dharamshala:bhagsunag": "dharamshala:bhagsunag-waterfall",
        "dharamshala:namgyal-monastery": "dharamshala:namgyal-monastery",
        "dharamshala:namgyal": "dharamshala:namgyal-monastery",
        "dharamshala:namgyal-monastery-and-tsuglagkhang-complex": "dharamshala:namgyal-monastery",
        "dharamshala:namgyal-monastery-tsuglagkhang-complex": "dharamshala:namgyal-monastery",
        "dharamshala:triund": "dharamshala:triund-trek",
        "dharamshala:triund-high-ridge-himalayan-trek": "dharamshala:triund-trek",
        "dharamshala:triund-trail": "dharamshala:triund-trek",
        "dharamshala:norbulingka-tibetan-cultural-institute": "dharamshala:norbulingka-institute",
        "dharamshala:norbulingka": "dharamshala:norbulingka-institute",
        "jaipur:nahargarh-fort": "jaipur:nahargarh-fort",
        "jaipur:nahargarh-fort-sunset-bastion": "jaipur:nahargarh-fort",
        "jaipur:nahargarh": "jaipur:nahargarh-fort",
        "jaipur:amber-fort-and-maota-lake": "jaipur:amber-fort",
        "jaipur:amber": "jaipur:amber-fort",
        "jaipur:amer-fort": "jaipur:amber-fort",
        "jaipur:hawa-mahal-palace": "jaipur:hawa-mahal",
        "leh:lachen-palkhar": "leh:leh-palace",
        "leh:pangong-lake": "leh:pangong-tso",
        "leh:pangong-tso-alpine-lake": "leh:pangong-tso",
        "leh:pangong": "leh:pangong-tso",
        "leh:thiksey-monastery-gompa": "leh:thiksey-monastery-gompa",
        "leh:thiksey": "leh:thiksey-monastery-gompa",
        "goa:anjuna-beach": "goa:anjuna-beach",
        "goa:anjuna-beach-and-flea-market": "goa:anjuna-beach",
        "goa:anjuna": "goa:anjuna-beach",
        "varanasi:brijrama-palace": "varanasi:brijrama-palace",
        "varanasi:brijrama-palace-river-heritage": "varanasi:brijrama-palace",
        "varanasi:brijrama": "varanasi:brijrama-palace",
        "varanasi:brijrama-palace-heritage": "varanasi:brijrama-palace",
        "kasol:chalal-trail": "kasol:chalal-trail",
        "kasol:chalal-pine-riverside-trail": "kasol:chalal-trail",
        "kasol:chalal": "kasol:chalal-trail",
        "kasol:chalal-trail-pine-riverside-trail": "kasol:chalal-trail",
        "rishikesh:shivpuri-white-water-rafting": "rishikesh:shivpuri-rafting",
        "rishikesh:shivpuri": "rishikesh:shivpuri-rafting",
        "tungnath-chandrashila:01-tungnath-temple": "tungnath-chandrashila:tungnath-temple",
        "tungnath-chandrashila:tungnath-temple-highest-shiva-shrine": "tungnath-chandrashila:tungnath-temple",
        "tungnath-chandrashila:01-tungnath": "tungnath-chandrashila:tungnath-temple",
        "tungnath-chandrashila:02-chandrashila-summit": "tungnath-chandrashila:chandrashila-summit",
        "tungnath-chandrashila:chandrashila-peak": "tungnath-chandrashila:chandrashila-summit",
        "tungnath-chandrashila:02-chandrashila-peak": "tungnath-chandrashila:chandrashila-summit",
        "tungnath-chandrashila:chandrashila-summit-ridge": "tungnath-chandrashila:chandrashila-summit",
        "tungnath-chandrashila:chandrashila": "tungnath-chandrashila:chandrashila-summit",
        "tungnath-chandrashila:02-chandrashila": "tungnath-chandrashila:chandrashila-summit"
}

    HOTEL_ALIAS_MAP: Dict[str, str] = {
        "agra:the-oberoi-amarvilas": "agra:the-oberoi-amarvilas",
        "agra:itc-mughal-luxury-collection": "agra:itc-mughal-luxury-collection",
        "agra:coral-tree-homestay": "agra:coral-tree-homestay",
        "agra:zostel-agra": "agra:zostel-agra",
        "agra:zostel": "agra:zostel-agra",
        "alwar-siliserh:siliserh-lake-palace-rtdc-heritage": "alwar-siliserh:siliserh-lake-palace-rtdc-heritage",
        "alwar-siliserh:rtdc-heritage": "alwar-siliserh:siliserh-lake-palace-rtdc-heritage",
        "alwar-siliserh:siliserh-lake-palace": "alwar-siliserh:siliserh-lake-palace-rtdc-heritage",
        "alwar-siliserh:dadhikar-fort-heritage-hotel": "alwar-siliserh:dadhikar-fort-heritage-hotel",
        "alwar-siliserh:lemon-tree-hotel-alwar": "alwar-siliserh:lemon-tree-hotel-alwar",
        "alwar-siliserh:fort-view-homestay-alwar": "alwar-siliserh:fort-view-homestay-alwar",
        "chandigarh:taj-chandigarh-sector-17": "chandigarh:taj-chandigarh-sector-17",
        "chandigarh:taj-sector-17": "chandigarh:taj-chandigarh-sector-17",
        "chandigarh:the-lalit-chandigarh": "chandigarh:the-lalit-chandigarh",
        "chandigarh:the-lalit": "chandigarh:the-lalit-chandigarh",
        "chandigarh:jw-marriott-hotel-chandigarh": "chandigarh:jw-marriott-hotel-chandigarh",
        "chandigarh:jw-marriott-hotel": "chandigarh:jw-marriott-hotel-chandigarh",
        "chandigarh:backpackers-villa-chandigarh": "chandigarh:backpackers-villa-chandigarh",
        "chandigarh:backpackers-villa": "chandigarh:backpackers-villa-chandigarh",
        "damdama-sohna:the-gateway-resort-damdama-lake": "damdama-sohna:the-gateway-resort-damdama-lake",
        "damdama-sohna:heritage-village-resort-and-spa": "damdama-sohna:heritage-village-resort-and-spa",
        "damdama-sohna:heritage-village-resort-spa": "damdama-sohna:heritage-village-resort-and-spa",
        "damdama-sohna:heritage-village-resort": "damdama-sohna:heritage-village-resort-and-spa",
        "damdama-sohna:spa": "damdama-sohna:heritage-village-resort-and-spa",
        "damdama-sohna:botanix-nature-resort-and-eco-camp": "damdama-sohna:botanix-nature-resort-and-eco-camp",
        "damdama-sohna:botanix-nature-resort-eco-camp": "damdama-sohna:botanix-nature-resort-and-eco-camp",
        "damdama-sohna:botanix-nature-resort": "damdama-sohna:botanix-nature-resort-and-eco-camp",
        "damdama-sohna:eco-camp": "damdama-sohna:botanix-nature-resort-and-eco-camp",
        "damdama-sohna:country-inn-and-suites-sohna-road": "damdama-sohna:country-inn-and-suites-sohna-road",
        "damdama-sohna:country-inn-suites-sohna-road": "damdama-sohna:country-inn-and-suites-sohna-road",
        "damdama-sohna:country-inn": "damdama-sohna:country-inn-and-suites-sohna-road",
        "damdama-sohna:suites-sohna-road": "damdama-sohna:country-inn-and-suites-sohna-road",
        "dehradun:walterre-resort-boutique-lodge": "dehradun:walterre-resort-boutique-lodge",
        "dehradun:lemon-tree-hotel-dehradun": "dehradun:lemon-tree-hotel-dehradun",
        "dehradun:lemon-tree-hotel": "dehradun:lemon-tree-hotel-dehradun",
        "dehradun:saiva-hill-resort-rajpur": "dehradun:saiva-hill-resort-rajpur",
        "dehradun:nomads-hostel-dehradun": "dehradun:nomads-hostel-dehradun",
        "dehradun:nomads-hostel": "dehradun:nomads-hostel-dehradun",
        "dharamshala:fortune-park-moksha": "dharamshala:fortune-park-moksha",
        "dharamshala:chonor-house-tibetan-guesthouse": "dharamshala:chonor-house-tibetan-guesthouse",
        "dharamshala:clouds-end-villa-heritage-estate": "dharamshala:clouds-end-villa-heritage-estate",
        "dharamshala:zostel-dharamkot": "dharamshala:zostel-dharamkot",
        "goa:ahilya-by-the-sea": "goa:ahilya-by-the-sea",
        "goa:the-postcard-velha": "goa:the-postcard-velha",
        "goa:casa-da-graca-heritage-homestay": "goa:casa-da-graca-heritage-homestay",
        "goa:casa-da-gra\u00e7a-heritage-homestay": "goa:casa-da-graca-heritage-homestay",
        "goa:jungle-by-the-hosteller": "goa:jungle-by-the-hosteller",
        "jaipur:samode-haveli": "jaipur:samode-haveli",
        "jaipur:28-kothi-boutique-guesthouse": "jaipur:28-kothi-boutique-guesthouse",
        "jaipur:royal-heritage-haveli-by-khatukar": "jaipur:royal-heritage-haveli-by-khatukar",
        "jaipur:moustache-jaipur": "jaipur:moustache-jaipur",
        "jaipur:moustache": "jaipur:moustache-jaipur",
        "jaisalmer:suryagarh-jaisalmer": "jaisalmer:suryagarh-jaisalmer",
        "jaisalmer:suryagarh": "jaisalmer:suryagarh-jaisalmer",
        "jaisalmer:killa-bhawan-heritage-stay": "jaisalmer:killa-bhawan-heritage-stay",
        "jaisalmer:jaisalmer-marriott-resort-and-spa": "jaisalmer:jaisalmer-marriott-resort-and-spa",
        "jaisalmer:jaisalmer-marriott-resort-spa": "jaisalmer:jaisalmer-marriott-resort-and-spa",
        "jaisalmer:jaisalmer-marriott-resort": "jaisalmer:jaisalmer-marriott-resort-and-spa",
        "jaisalmer:marriott-resort-spa": "jaisalmer:jaisalmer-marriott-resort-and-spa",
        "jaisalmer:spa": "jaisalmer:jaisalmer-marriott-resort-and-spa",
        "jaisalmer:zostel-jaisalmer": "jaisalmer:zostel-jaisalmer",
        "jaisalmer:zostel": "jaisalmer:zostel-jaisalmer",
        "kainchi-dham:bara-bungalow-gethia-1898-heritage": "kainchi-dham:bara-bungalow-gethia-1898-heritage",
        "kainchi-dham:1898-heritage": "kainchi-dham:bara-bungalow-gethia-1898-heritage",
        "kainchi-dham:bara-bungalow-gethia": "kainchi-dham:bara-bungalow-gethia-1898-heritage",
        "kainchi-dham:the-hermitage-bhowali": "kainchi-dham:the-hermitage-bhowali",
        "kainchi-dham:kainchi-valley-spiritual-homestay": "kainchi-dham:kainchi-valley-spiritual-homestay",
        "kainchi-dham:the-green-glade-resort-bhimtal": "kainchi-dham:the-green-glade-resort-bhimtal",
        "kasol:the-himalayan-village": "kasol:the-himalayan-village",
        "kasol:parvati-kuteer-riverside-wood-cottages": "kasol:parvati-kuteer-riverside-wood-cottages",
        "kasol:kasol-heights-resort": "kasol:kasol-heights-resort",
        "kasol:heights-resort": "kasol:kasol-heights-resort",
        "kasol:the-hosteller-kasol-riverside": "kasol:the-hosteller-kasol-riverside",
        "kasol:the-hosteller-kasol": "kasol:the-hosteller-kasol-riverside",
        "kasol:the-hosteller-riverside": "kasol:the-hosteller-kasol-riverside",
        "lansdowne:the-lansdowne-woods-boutique-resort": "lansdowne:the-lansdowne-woods-boutique-resort",
        "lansdowne:the-woods-boutique-resort": "lansdowne:the-lansdowne-woods-boutique-resort",
        "lansdowne:kasang-regency-hill-resort": "lansdowne:kasang-regency-hill-resort",
        "lansdowne:fairydale-resort-colonial-cottage": "lansdowne:fairydale-resort-colonial-cottage",
        "lansdowne:sb-mount-resort-lansdowne": "lansdowne:sb-mount-resort-lansdowne",
        "lansdowne:sb-mount-resort": "lansdowne:sb-mount-resort-lansdowne",
        "leh:the-grand-dragon-ladakh": "leh:the-grand-dragon-ladakh",
        "leh:nimmu-house-heritage-eco-resort": "leh:nimmu-house-heritage-eco-resort",
        "leh:stok-palace-heritage-guesthouse": "leh:stok-palace-heritage-guesthouse",
        "leh:zostel-leh": "leh:zostel-leh",
        "leh:zostel": "leh:zostel-leh",
        "manali:the-himalayan-castle-and-stone-cottages": "manali:the-himalayan-castle-and-stone-cottages",
        "manali:the-himalayan-castle-stone-cottages": "manali:the-himalayan-castle-and-stone-cottages",
        "manali:stone-cottages": "manali:the-himalayan-castle-and-stone-cottages",
        "manali:the-himalayan": "manali:the-himalayan-castle-and-stone-cottages",
        "manali:the-himalayan-castle": "manali:the-himalayan-castle-and-stone-cottages",
        "manali:the-himalayan-woods-boutique-retreat": "manali:the-himalayan-castle-and-stone-cottages",
        "manali:larisa-resort-and-apple-orchard": "manali:larisa-resort-and-apple-orchard",
        "manali:larisa-resort-apple-orchard": "manali:larisa-resort-and-apple-orchard",
        "manali:apple-orchard": "manali:larisa-resort-and-apple-orchard",
        "manali:larisa": "manali:larisa-resort-and-apple-orchard",
        "manali:larisa-resort": "manali:larisa-resort-and-apple-orchard",
        "manali:drifters-inn-and-wooden-loft": "manali:drifters-inn-and-wooden-loft",
        "manali:drifters-inn-wooden-loft": "manali:drifters-inn-and-wooden-loft",
        "manali:drifters-cafe": "manali:drifters-inn-and-wooden-loft",
        "manali:drifters-cafe-and-acoustic-inn": "manali:drifters-inn-and-wooden-loft",
        "manali:drifters-inn": "manali:drifters-inn-and-wooden-loft",
        "manali:wooden-loft": "manali:drifters-inn-and-wooden-loft",
        "manali:zostel-manali-old-manali": "manali:zostel-manali-old-manali",
        "manali:old-manali": "manali:zostel-manali-old-manali",
        "manali:zostel-manali": "manali:zostel-manali-old-manali",
        "manali:zostel-old": "manali:zostel-manali-old-manali",
        "mathura-vrindavan:nidhivan-sarovar-portico": "mathura-vrindavan:nidhivan-sarovar-portico",
        "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant": "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant",
        "mathura-vrindavan:mvt-guesthouse-garden-restaurant": "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant",
        "mathura-vrindavan:garden-restaurant": "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant",
        "mathura-vrindavan:mvt-guesthouse": "mathura-vrindavan:mvt-guesthouse-and-garden-restaurant",
        "mathura-vrindavan:brij-view-vrindavan-luxury-suites": "mathura-vrindavan:brij-view-vrindavan-luxury-suites",
        "mathura-vrindavan:radha-krishna-kripa-dham-homestay": "mathura-vrindavan:radha-krishna-kripa-dham-homestay",
        "morni-hills:royal-morni-resort": "morni-hills:royal-morni-resort",
        "morni-hills:mountain-quail-tourist-resort-tikkar-taal": "morni-hills:mountain-quail-tourist-resort-tikkar-taal",
        "morni-hills:shivalik-ridge-village-homestay": "morni-hills:shivalik-ridge-village-homestay",
        "morni-hills:hilltop-forest-cottage-morni": "morni-hills:hilltop-forest-cottage-morni",
        "munnar:windermere-estate": "munnar:windermere-estate",
        "munnar:blanket-luxury-villa-and-spa": "munnar:blanket-luxury-villa-and-spa",
        "munnar:blanket-luxury-villa-spa": "munnar:blanket-luxury-villa-and-spa",
        "munnar:blanket-luxury-villa": "munnar:blanket-luxury-villa-and-spa",
        "munnar:spa": "munnar:blanket-luxury-villa-and-spa",
        "munnar:olive-brook-plantation-homestay": "munnar:olive-brook-plantation-homestay",
        "munnar:the-hosteller-munnar": "munnar:the-hosteller-munnar",
        "munnar:the-hosteller": "munnar:the-hosteller-munnar",
        "murthal:grand-haveli-resort-murthal": "murthal:grand-haveli-resort-murthal",
        "murthal:grand-haveli-resort": "murthal:grand-haveli-resort-murthal",
        "murthal:tivoli-heritage-grand-nh-44": "murthal:tivoli-heritage-grand-nh-44",
        "murthal:highway-king-hotel-sonipat": "murthal:highway-king-hotel-sonipat",
        "murthal:star-hotel-and-suites-murthal": "murthal:star-hotel-and-suites-murthal",
        "murthal:star-hotel-suites-murthal": "murthal:star-hotel-and-suites-murthal",
        "murthal:star-hotel": "murthal:star-hotel-and-suites-murthal",
        "murthal:star-hotel-suites": "murthal:star-hotel-and-suites-murthal",
        "murthal:suites-murthal": "murthal:star-hotel-and-suites-murthal",
        "mussoorie:rokeby-manor-landour": "mussoorie:rokeby-manor-landour",
        "mussoorie:welcomhotel-the-savoy": "mussoorie:welcomhotel-the-savoy",
        "mussoorie:domas-inn-tibetan-guesthouse": "mussoorie:domas-inn-tibetan-guesthouse",
        "mussoorie:the-hosteller-mussoorie-mall-road": "mussoorie:the-hosteller-mussoorie-mall-road",
        "mussoorie:mall-road": "mussoorie:the-hosteller-mussoorie-mall-road",
        "mussoorie:the-hosteller-mall-road": "mussoorie:the-hosteller-mussoorie-mall-road",
        "mussoorie:the-hosteller-mussoorie": "mussoorie:the-hosteller-mussoorie-mall-road",
        "neemrana:neemrana-fort-palace": "neemrana:neemrana-fort-palace",
        "neemrana:fort-palace": "neemrana:neemrana-fort-palace",
        "neemrana:ramada-by-wyndham-neemrana": "neemrana:ramada-by-wyndham-neemrana",
        "neemrana:ramada-by-wyndham": "neemrana:ramada-by-wyndham-neemrana",
        "neemrana:shiva-oasis-resort": "neemrana:shiva-oasis-resort",
        "neemrana:fort-view-heritage-homestay": "neemrana:fort-view-heritage-homestay",
        "rishikesh:aloha-on-the-ganges": "rishikesh:aloha-on-the-ganges",
        "rishikesh:aloha": "rishikesh:aloha-on-the-ganges",
        "rishikesh:aloha-ganges": "rishikesh:aloha-on-the-ganges",
        "rishikesh:glasshouse-on-the-ganges": "rishikesh:glasshouse-on-the-ganges",
        "rishikesh:glasshouse": "rishikesh:glasshouse-on-the-ganges",
        "rishikesh:glasshouse-ganges": "rishikesh:glasshouse-on-the-ganges",
        "rishikesh:ganga-kinare-riverside-sanctuary": "rishikesh:ganga-kinare-riverside-sanctuary",
        "rishikesh:ganga-kinare": "rishikesh:ganga-kinare-riverside-sanctuary",
        "rishikesh:ganga-kinare-riverside-retreat": "rishikesh:ganga-kinare-riverside-sanctuary",
        "rishikesh:zostel-rishikesh-tapovan": "rishikesh:zostel-rishikesh-tapovan",
        "rishikesh:tapovan": "rishikesh:zostel-rishikesh-tapovan",
        "rishikesh:zostel-rishikesh": "rishikesh:zostel-rishikesh-tapovan",
        "rishikesh:zostel-tapovan": "rishikesh:zostel-rishikesh-tapovan",
        "sariska-bhangarh:the-sariska-palace-heritage-hotel": "sariska-bhangarh:the-sariska-palace-heritage-hotel",
        "sariska-bhangarh:amanbagh-luxury-sanctuary": "sariska-bhangarh:amanbagh-luxury-sanctuary",
        "sariska-bhangarh:trees-and-tigers-wildlife-resort": "sariska-bhangarh:trees-and-tigers-wildlife-resort",
        "sariska-bhangarh:trees-tigers-wildlife-resort": "sariska-bhangarh:trees-and-tigers-wildlife-resort",
        "sariska-bhangarh:tigers-wildlife-resort": "sariska-bhangarh:trees-and-tigers-wildlife-resort",
        "sariska-bhangarh:trees": "sariska-bhangarh:trees-and-tigers-wildlife-resort",
        "sariska-bhangarh:vanaashrya-resort-sariska": "sariska-bhangarh:vanaashrya-resort-sariska",
        "spiti:hotel-deyzor-kaza": "spiti:hotel-deyzor-kaza",
        "spiti:spiti-valley-eco-lodge": "spiti:spiti-valley-eco-lodge",
        "spiti:valley-eco-lodge": "spiti:spiti-valley-eco-lodge",
        "spiti:dekit-norbu-homestay-kaza": "spiti:dekit-norbu-homestay-kaza",
        "spiti:zostel-spiti-kaza": "spiti:zostel-spiti-kaza",
        "spiti:kaza": "spiti:zostel-spiti-kaza",
        "spiti:zostel-kaza": "spiti:zostel-spiti-kaza",
        "spiti:zostel-spiti": "spiti:zostel-spiti-kaza",
        "tungnath-chandrashila:alpine-meadow-eco-lodge-chopta": "tungnath-chandrashila:alpine-meadow-eco-lodge-chopta",
        "tungnath-chandrashila:magpie-jungle-camp-chopta": "tungnath-chandrashila:magpie-jungle-camp-chopta",
        "tungnath-chandrashila:chopta-meadows-homestay-sari-base": "tungnath-chandrashila:chopta-meadows-homestay-sari-base",
        "tungnath-chandrashila:chopta-meadows-homestay": "tungnath-chandrashila:chopta-meadows-homestay-sari-base",
        "tungnath-chandrashila:sari-base": "tungnath-chandrashila:chopta-meadows-homestay-sari-base",
        "tungnath-chandrashila:monal-himalayan-resort-dugalbitta": "tungnath-chandrashila:monal-himalayan-resort-dugalbitta",
        "udaipur:jagat-niwas-palace-hotel": "udaipur:jagat-niwas-palace-hotel",
        "udaipur:amet-haveli-heritage-hotel": "udaipur:amet-haveli-heritage-hotel",
        "udaipur:tribute-lakeside-boutique-stay": "udaipur:tribute-lakeside-boutique-stay",
        "udaipur:zostel-udaipur": "udaipur:zostel-udaipur",
        "udaipur:zostel": "udaipur:zostel-udaipur",
        "varanasi:brijrama-palace-heritage-grand": "varanasi:brijrama-palace-heritage-grand",
        "varanasi:brijrama-palace": "varanasi:brijrama-palace-heritage-grand",
        "varanasi:ganges-view-heritage-hotel": "varanasi:ganges-view-heritage-hotel",
        "varanasi:amritara-suryauday-haveli": "varanasi:amritara-suryauday-haveli",
        "varanasi:stops-hostel-varanasi": "varanasi:stops-hostel-varanasi",
        "varanasi:stops-hostel": "varanasi:stops-hostel-varanasi"
}

    def __init__(self):
        self._alias_map = self.PLACE_ALIAS_MAP
        self._hotel_alias_map = self.HOTEL_ALIAS_MAP

    def _normalize_key(self, destination: str, place_name: str) -> str:
        return f"{clean_string(destination)}:{clean_string(place_name)}"

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
        theme_map = {
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
        }
        return theme_map.get(theme, "/images/places/universal/nature.webp")

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
                msg = f"ARTWORK COLLISION: asset {img_url} assigned to multiple exact keys: {', '.join(keys)}"
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
        universal_fallback = f"/images/places/universal/{theme}.webp" if theme in ["spiritual", "monastery", "church", "cafe", "food", "heritage", "waterfall", "lake", "beach", "viewpoint", "trail", "nature", "stay", "hostel", "homestay", "resort", "boutique", "transport"] else "/images/places/universal/nature.webp"

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

        # PRIORITY 1.5: Dedicated Verified Property Stays Asset
        if existing_image_url and "/stays/" in existing_image_url and not existing_image_url.endswith("/stay.webp"):
            return {
                "url": existing_image_url,
                "fallback_url": safe_fallback,
                "source": source or "vanvas_curated",
                "source_type": "editorial_artwork",
                "provenance": "exact_place",
                "semantic_category": "stay",
                "exactness": "exact",
                "attribution": "VANVAS Verified Editorial Asset",
                "alt_text": f"{place_name} in {destination_name}",
                "badge_label": "VANVAS PLACE ARTWORK",
                "artwork_key": f"stay:{dest_norm}:{place_norm}",
                "image_url": existing_image_url,
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": "VANVAS PLACE ARTWORK",
                "visual_description": f"Verified property artwork for {place_name} in {destination_name}."
            }

        # PRIORITY 2: Curated Exact Place Match (Direct Key Lookup & Alias Map)
        lookup_key = f"{dest_norm}:{place_norm}"
        matched_key = f"{matched_dest}:{place_norm}" if matched_dest else lookup_key
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

        # PRIORITY 3: Destination-Scoped Alias Matching against PLACE_ARTWORK_REGISTRY
        is_stay_query = any(w in category.lower() for w in ["stay", "hotel", "resort", "homestay", "sanctuary"])
        best_exact_match = None
        for reg_key, item in self.PLACE_ARTWORK_REGISTRY.items():
            if is_stay_query and item.get("semantic_theme") != "stay":
                continue
            reg_dest, reg_place = reg_key.split(":")
            if reg_dest == dest_norm or reg_dest in dest_norm or dest_norm in reg_dest:
                aliases = item.get("aliases", [reg_place])
                if place_norm == reg_place or place_norm in aliases:
                    best_exact_match = (reg_key, item)
                    break
                for al in aliases:
                    if len(al) >= 3 and al not in GENERIC_WORDS and (place_norm.startswith(f"{al}-") or place_norm.endswith(f"-{al}") or f"-{al}-" in place_norm):
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

        # PRIORITY 4: Verified Local Asset File on Disk
        if existing_image_url and existing_image_url.startswith("/images/places/") and not any(k in existing_image_url for k in ["/categories/", "/fallbacks/", "/universal/"]):
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

        # HARD ISOLATION FOR STAYS: Never inherit generic non-stay or landmark artwork
        if theme == "stay":
            stay_asset = (dest_config["categories"].get("stay") if dest_config else None) or universal_fallback
            tier_name = "destination_category" if dest_config else "regional_fallback"
            badge_name = "DESTINATION CATEGORY ART" if dest_config else "REGIONAL ART"
            return {
                "url": stay_asset,
                "fallback_url": universal_fallback,
                "source": "vanvas_curated",
                "source_type": "category_photo",
                "provenance": tier_name,
                "semantic_category": "stay",
                "exactness": "category_matched" if dest_config else "fallback",
                "attribution": f"VANVAS Curated {destination_name} Stay Sanctuary",
                "alt_text": f"{place_name} in {destination_name}",
                "badge_label": badge_name,
                "artwork_key": f"{matched_dest or 'universal'}:stay",
                "image_url": stay_asset,
                "tier": tier_name,
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": badge_name,
                "visual_description": f"Serene stay and hospitality sanctuary in {destination_name}.",
                "metadata": {"destination": matched_dest, "theme": "stay", "category_theme": "stay"}
            }

        # PRIORITY 5: Destination Category Fallback
        if dest_cat_fallback:
            return {
                "url": dest_cat_fallback,
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
                "image_url": dest_cat_fallback,
                "tier": "destination_category",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": "DESTINATION CATEGORY ART",
                "visual_description": f"Authentic {destination_name} {theme} visual.",
                "metadata": {"destination": matched_dest, "theme": theme, "category_theme": theme}
            }

        # PRIORITY 6: Regional / Universal Category Fallback
        if theme in ["cafe", "food", "waterfall", "monastery", "church", "shopping", "transport"]:
            fallback_img = universal_fallback
            tier_name = "regional_fallback"
            badge_name = "REGIONAL ART"
        else:
            fallback_img = self._resolve_regional_fallback(destination_name, f"{category} {theme}")
            tier_name = "regional_fallback"
            badge_name = "REGIONAL ART"

        return {
            "url": fallback_img,
            "fallback_url": universal_fallback,
            "source": "vanvas_regional",
            "source_type": tier_name,
            "provenance": tier_name,
            "semantic_category": theme,
            "exactness": "fallback",
            "attribution": "VANVAS Curated Atmospheric Visual",
            "alt_text": f"{place_name} in {destination_name}",
            "badge_label": badge_name,
            "artwork_key": f"{tier_name}:{theme}",
            "image_url": fallback_img,
            "tier": tier_name,
            "place_name": place_name,
            "destination": destination_name,
            "category": category,
            "is_real_photo": False,
            "badge": badge_name,
            "visual_description": f"Regional atmospheric visual for {category}.",
            "metadata": {"category_theme": theme, "regional_fallback": fallback_img, "universal_fallback": universal_fallback}
        }

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
            return {
                "url": existing_image_url,
                "fallback_url": dest_stay_fallback,
                "source": "wikimedia" if is_wm else (source or "live_provider"),
                "source_type": "real_photo",
                "provenance": "exact_place" if is_wm else ("live_place" if is_live else "destination_category"),
                "semantic_category": "stay",
                "exactness": "exact" if (is_wm or is_live) else "approximate",
                "attribution": "Wikimedia Commons / Verified Open Source" if is_wm else "Verified Hotel Photograph",
                "alt_text": f"{property_name} in {destination_name}",
                "badge_label": badge,
                "artwork_key": f"stay:photo:{hotel_norm}",
                "image_url": existing_image_url,
                "tier": "exact_place" if is_wm else "live_place",
                "place_name": property_name,
                "destination": destination_name,
                "category": "Stays & Sanctuaries",
                "is_real_photo": True,
                "badge": badge,
                "visual_description": f"Verified photograph of {property_name}."
            }

        # PRIORITY 2: Curated Exact Hotel Registry (Direct Key Lookup & Alias Map)
        lookup_key = f"{dest_norm}:{hotel_norm}"
        matched_key = f"{matched_dest}:{hotel_norm}" if matched_dest else lookup_key
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
            return {
                "url": item["image_url"],
                "fallback_url": dest_stay_fallback,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": "stay",
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Property Asset"),
                "alt_text": f"{property_name} in {destination_name}",
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
            }

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
                    if len(al) >= 3 and al not in GENERIC_WORDS and (hotel_norm.startswith(f"{al}-") or hotel_norm.endswith(f"-{al}") or f"-{al}-" in hotel_norm):
                        best_exact_match = (reg_key, item)
                        break
                if best_exact_match:
                    break

        if best_exact_match:
            reg_key, item = best_exact_match
            return {
                "url": item["image_url"],
                "fallback_url": dest_stay_fallback,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": "stay",
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Property Asset"),
                "alt_text": f"{property_name} in {destination_name}",
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
            }

        # PRIORITY 4: Verified Local Property Asset on Disk
        if existing_image_url and existing_image_url.startswith("/images/places/") and "/stays/" in existing_image_url and not any(k in existing_image_url for k in ["/categories/", "/fallbacks/", "/universal/"]):
            badge = "VANVAS PLACE ARTWORK"
            return {
                "url": existing_image_url,
                "fallback_url": dest_stay_fallback,
                "source": source or "vanvas_curated",
                "source_type": "editorial_artwork",
                "provenance": "exact_place",
                "semantic_category": "stay",
                "exactness": "exact",
                "attribution": "VANVAS Verified Property Asset",
                "alt_text": f"{property_name} in {destination_name}",
                "badge_label": badge,
                "artwork_key": f"stay:exact:{dest_norm}:{hotel_norm}",
                "image_url": existing_image_url,
                "tier": "exact_place",
                "place_name": property_name,
                "destination": destination_name,
                "category": "Stays & Sanctuaries",
                "is_real_photo": False,
                "badge": badge,
                "visual_description": f"Verified property artwork for {property_name}."
            }

        # PRIORITY 5: Destination Stay Fallback
        if dest_stay_fallback:
            return {
                "url": dest_stay_fallback,
                "fallback_url": universal_fallback,
                "source": "vanvas_curated",
                "source_type": "category_photo",
                "provenance": "destination_category",
                "semantic_category": "stay",
                "exactness": "category_matched",
                "attribution": f"VANVAS Curated {destination_name} Stay Sanctuary",
                "alt_text": f"{property_name} in {destination_name}",
                "badge_label": "DESTINATION CATEGORY ART",
                "artwork_key": f"{matched_dest}:stay",
                "image_url": dest_stay_fallback,
                "tier": "destination_category",
                "place_name": property_name,
                "destination": destination_name,
                "category": "Stays & Sanctuaries",
                "is_real_photo": False,
                "badge": "DESTINATION CATEGORY ART",
                "visual_description": f"Authentic {destination_name} stay sanctuary visual."
            }

        # PRIORITY 6: Universal Fallback
        return {
            "url": universal_fallback,
            "fallback_url": universal_fallback,
            "source": "vanvas_universal",
            "source_type": "category_photo",
            "provenance": "universal_fallback",
            "semantic_category": "stay",
            "exactness": "approximate",
            "attribution": "VANVAS Universal Stay Atmosphere",
            "alt_text": f"{property_name} in {destination_name}",
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
        }

class OptionalAIArtworkProvider(CuratedArtworkProvider):
    """
    Artwork provider that utilizes curated sanctuary assets and supports optional AI extensions.
    """
    def __init__(self, groq_api_key: Optional[str] = None):
        super().__init__()
        self.groq_api_key = groq_api_key
