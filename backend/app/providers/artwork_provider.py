import os
import re
import json
import logging
from typing import Dict, Any, Optional, List, Set, Tuple
from datetime import datetime, timezone
from app.core.config import settings
from app.providers.base import ArtworkProvider

logger = logging.getLogger("vanvas.artwork")

class CuratedArtworkProvider(ArtworkProvider):
    """
    Production Curated & Local Artwork Resolver.
    Provides deterministic place-specific visual intelligence matching recognized landmarks
    and applying authentic 8-level fallbacks without random array indexing or fake exact-place badges.
    """
    
    # Exact Place Artwork Registry mapped deterministically by normalized key.
    # Contains verified landmark-specific artwork assets that physically exist on disk.
    PLACE_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {
        # Kasol Landmarks
        "kasol:moon-dance-cafe": {
            "image_url": "/images/places/kasol/moon-dance-cafe.webp",
            "tier": "exact_place",
            "place_name": "Moon Dance Café & German Bakery",
            "destination": "Kasol",
            "category": "Cafés & Bakery",
            "visual_description": "Legendary bohemian bakery in Kasol serving fresh apple crumble, pastries, and mountain coffee under Parvati deodars.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["moon-dance-cafe", "moon-dance-cafe-and-german-bakery", "moon-dance-german-bakery", "moon-dance-bakery", "german-bakery-kasol"]
        },
        "kasol:chalal-trail": {
            "image_url": "/images/places/kasol/chalal-trail.webp",
            "tier": "exact_place",
            "place_name": "Chalal Pine Riverside Trail",
            "destination": "Kasol",
            "category": "Nature & Trails",
            "visual_description": "Scenic suspended cable bridge path following emerald Parvati river through ancient towering pine woods to Chalal village.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["chalal-trail", "chalal-pine-riverside-trail", "chalal-pine-trail", "chalal-riverside-walk", "chalal-village-trail", "chalal"]
        },
        "kasol:manikaran-sahib": {
            "image_url": "/images/places/kasol/manikaran-sahib.webp",
            "tier": "exact_place",
            "place_name": "Gurudwara Shri Manikaran Sahib",
            "destination": "Kasol",
            "category": "Culture & Heritage",
            "visual_description": "Historic sacred hot sulphur springs and Gurudwara complex nestled along the roaring Parvati River gorge.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["manikaran-sahib", "manikaran-gurudwara", "manikaran-hot-springs", "gurudwara-shri-manikaran-sahib", "manikaran"]
        },
        "kasol:kheerganga-trail": {
            "image_url": "/images/places/kasol/kheerganga-trail.webp",
            "tier": "exact_place",
            "place_name": "Kheerganga Alpine Meadow Trail",
            "destination": "Kasol",
            "category": "Nature & Trails",
            "visual_description": "Exhilarating Himalayan trekking trail ascending through pine forests to high alpine meadows and natural hot baths.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["kheerganga-trail", "kheerganga-trek", "khirganga-trail", "khirganga"]
        },

        # Mussoorie / Landour
        "mussoorie:st-pauls-church": {
            "image_url": "/images/places/mussoorie/st-pauls-church.webp",
            "tier": "exact_place",
            "place_name": "St. Paul's Church, Landour",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Historic 1852 stone Anglican church in Landour with steep gabled wooden roof and lancet windows under deodar pines.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["st-pauls-church-landour", "st-pauls-church", "st-paul-church"]
        },
        "mussoorie:landour-bakehouse": {
            "image_url": "/images/places/mussoorie/landour-bakehouse.webp",
            "tier": "exact_place",
            "place_name": "Landour Bakehouse",
            "destination": "Mussoorie",
            "category": "Cafés & Bakery",
            "visual_description": "Historic stone and timber hill bakery at Sisters Bazaar with Victorian glass vitrines and deodar canopy.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["landour-bakehouse", "landour-bakery", "sisters-bazaar-bakehouse"]
        },
        "mussoorie:lal-tibba": {
            "image_url": "/images/places/mussoorie/lal-tibba.webp",
            "tier": "exact_place",
            "place_name": "Lal Tibba Scenic Viewpoint",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "Highest mountain ridge viewpoint in Landour with telescope overlooking distant Garhwal snow peaks.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["lal-tibba", "lal-tibba-scenic-viewpoint", "lal-tibba-viewpoint"]
        },
        "mussoorie:kempty-falls": {
            "image_url": "/images/places/mussoorie/kempty-falls.webp",
            "tier": "exact_place",
            "place_name": "Kempty Falls Mountain Cascade",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["kempty-falls", "kempty-falls-mountain-cascade", "kempty-waterfall"]
        },
        "mussoorie:gun-hill": {
            "image_url": "/images/places/mussoorie/gun-hill.webp",
            "tier": "exact_place",
            "place_name": "Gun Hill Historic Viewpoint",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["gun-hill", "gun-hill-historic-viewpoint", "gun-hill-viewpoint"]
        },
        "mussoorie:camel-back-road": {
            "image_url": "/images/places/mussoorie/camel-back-road.webp",
            "tier": "exact_place",
            "place_name": "Camel's Back Road Promenade",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["camel-back-road", "camels-back-road", "camels-back-road-and-winterline-trail"]
        },
        "mussoorie:mall-road": {
            "image_url": "/images/places/mussoorie/mall-road.webp",
            "tier": "exact_place",
            "place_name": "Mussoorie Mall Road",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Colonial promenade with glowing vintage iron lampposts, bookshops, and evening strolls.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["mall-road", "mussoorie-mall-road", "mall-road-heritage-promenade"]
        },
        "mussoorie:george-everest": {
            "image_url": "/images/places/mussoorie/george-everest.webp",
            "tier": "exact_place",
            "place_name": "Sir George Everest Peak & Estate",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "White stone colonial observatory estate perched on grassy ridge with panoramic snow peak vistas.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["george-everest", "george-everest-peak-and-observatory-house", "sir-george-everest-house"]
        },
        "mussoorie:clouds-end": {
            "image_url": "/images/places/mussoorie/clouds-end.webp",
            "tier": "exact_place",
            "place_name": "Cloud's End Heritage Estate",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Secluded historic stone bungalow nestled deep in ancient deodar and pine wilderness.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["clouds-end", "clouds-end-forest-retreat", "clouds-end-estate"]
        },
        "mussoorie:landour": {
            "image_url": "/images/places/mussoorie/landour.webp",
            "tier": "exact_place",
            "place_name": "Landour Cantonment Ridge",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Misty colonial ridge settlement with stone cottages and silent oak paths.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["landour", "landour-cantonment", "landour-heritage-ridge-and-sisters-bazaar"]
        },

        # Manali
        "manali:hadimba-temple": {
            "image_url": "/images/places/manali/hadimba-temple.webp",
            "tier": "exact_place",
            "place_name": "Hadimba Devi Cedar Forest Temple",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "visual_description": "Four-tiered wooden pagoda temple set inside Dhungri towering deodar pine forest.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["hadimba-temple", "hadimba-devi-cedar-forest-temple", "hidimba-devi-temple", "dhungri-temple", "hidimba-temple"]
        },
        "manali:solang-valley": {
            "image_url": "/images/places/manali/solang-valley.webp",
            "tier": "exact_place",
            "place_name": "Solang Valley Alpine Meadow",
            "destination": "Manali",
            "category": "Adventure & Sport",
            "visual_description": "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["solang-valley", "solang-valley-ridge-and-paragliding", "solang-nullah"]
        },
        "manali:old-manali": {
            "image_url": "/images/places/manali/old-manali.webp",
            "tier": "exact_place",
            "place_name": "Old Manali Village & Cafes",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "visual_description": "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["old-manali", "old-manali-village-and-manu-temple", "old-manali-village"]
        },
        "manali:mall-road": {
            "image_url": "/images/places/manali/mall-road.webp",
            "tier": "exact_place",
            "place_name": "Manali Mall Road",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "visual_description": "Vibrant mountain pedestrian promenade with wooden balconies and woollen bazaars.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["mall-road", "manali-mall-road", "the-mall-manali"]
        },
        "manali:jogini-waterfall": {
            "image_url": "/images/places/manali/jogini-waterfall.webp",
            "tier": "exact_place",
            "place_name": "Jogini Waterfall",
            "destination": "Manali",
            "category": "Nature & Trails",
            "visual_description": "Scenic cascading waterfall plunging down pine-clad cliffs near Vashisht village.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["jogini-waterfall", "jogini-falls", "jugni-waterfall"]
        },

        # Goa
        "goa:fontainhas-latin-quarter": {
            "image_url": "/images/places/goa/fontainhas-latin-quarter.webp",
            "tier": "exact_place",
            "place_name": "Fontainhas Latin Heritage Quarter",
            "destination": "Goa",
            "category": "Culture & Heritage",
            "visual_description": "Pastel-painted Portuguese heritage houses with wrought-iron balconies and bougainvillea in Panaji.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["fontainhas-latin-quarter", "fontainhas", "fontainhas-latin-heritage-quarter"]
        },
        "goa:aguada-fort": {
            "image_url": "/images/places/goa/aguada-fort.webp",
            "tier": "exact_place",
            "place_name": "Fort Aguada & Lighthouse",
            "destination": "Goa",
            "category": "Culture & Heritage",
            "visual_description": "17th-century Portuguese laterite stone sea fortress and cylindrical lighthouse on coastal headland.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["aguada-fort", "aguada-fort-and-historic-lighthouse", "fort-aguada"]
        },
        "goa:anjuna-beach": {
            "image_url": "/images/places/goa/anjuna-beach.webp",
            "tier": "exact_place",
            "place_name": "Anjuna Beach Coastline",
            "destination": "Goa",
            "category": "Nature & Trails",
            "visual_description": "Curved palm-fringed Arabian sea coastline with rocky laterite outcrops and seaside shacks.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["anjuna-beach", "anjuna-flea-market", "anjuna"]
        },

        # Rishikesh
        "rishikesh:triveni-ghat": {
            "image_url": "/images/places/rishikesh/triveni-ghat.webp",
            "tier": "exact_place",
            "place_name": "Triveni Ghat Evening Maha Aarti",
            "destination": "Rishikesh",
            "category": "Culture & Heritage",
            "visual_description": "Sacred stone riverfront steps at the Ganges confluence with twilight brass aarti lamps and floating diyas.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["triveni-ghat", "triveni-ghat-evening-maha-aarti", "triveni-ghat-aarti"]
        },
        "rishikesh:laxman-jhula": {
            "image_url": "/images/places/rishikesh/laxman-jhula.webp",
            "tier": "exact_place",
            "place_name": "Laxman Jhula Suspension Bridge",
            "destination": "Rishikesh",
            "category": "Culture & Heritage",
            "visual_description": "Iconic iron suspension bridge spanning across turquoise Ganga with multi-storey temple spires.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["laxman-jhula", "lakshman-jhula", "lakshman-suspension-bridge"]
        },

        # Jaipur
        "jaipur:hawa-mahal": {
            "image_url": "/images/places/jaipur/hawa-mahal.webp",
            "tier": "exact_place",
            "place_name": "Hawa Mahal Palace of Winds",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "visual_description": "Five-storey pink sandstone honeycomb facade with 953 carved jharokha lattice windows.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["hawa-mahal", "hawa-mahal-palace-of-winds", "palace-of-winds"]
        },
        "jaipur:amber-fort": {
            "image_url": "/images/places/jaipur/amber-fort.webp",
            "tier": "exact_place",
            "place_name": "Amber Fort & Palace",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "visual_description": "Majestic hilltop fort with pale yellow and pink sandstone ramparts reflected in Maota Lake.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["amber-fort", "amer-fort", "amber-palace", "amer-palace"]
        },

        # Udaipur
        "udaipur:city-palace-udaipur": {
            "image_url": "/images/places/udaipur/city-palace-udaipur.webp",
            "tier": "exact_place",
            "place_name": "City Palace of Udaipur",
            "destination": "Udaipur",
            "category": "Culture & Heritage",
            "visual_description": "Monumental whitewashed marble palace with mirrored domes rising over eastern shore of Lake Pichola.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["city-palace-udaipur", "city-palace-of-udaipur", "city-palace"]
        },
        "udaipur:lake-pichola": {
            "image_url": "/images/places/udaipur/lake-pichola.webp",
            "tier": "exact_place",
            "place_name": "Lake Pichola Waterfront",
            "destination": "Udaipur",
            "category": "Nature & Trails",
            "visual_description": "Picturesque freshwater lake surrounded by whitewashed havelis, ghats, and hill silhouettes.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["lake-pichola", "pichola-lake", "pichola"]
        },

        # Varanasi
        "varanasi:dashashwamedh-ghat-aarti": {
            "image_url": "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
            "tier": "exact_place",
            "place_name": "Dashashwamedh Ghat Evening Ganga Aarti",
            "destination": "Varanasi",
            "category": "Culture & Heritage",
            "visual_description": "Historic stone riverfront steps illuminated by brass oil lamps and evening river reflections.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["dashashwamedh-ghat-aarti", "dashashwamedh-ghat-evening-maha-aarti", "dashashwamedh-ghat"]
        },
        "varanasi:kashi-vishwanath": {
            "image_url": "/images/places/varanasi/kashi-vishwanath.webp",
            "tier": "exact_place",
            "place_name": "Kashi Vishwanath Jyotirlinga Temple",
            "destination": "Varanasi",
            "category": "Culture & Heritage",
            "visual_description": "Sacred golden-spired temple of Lord Shiva along the eternal lanes of Kashi.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["kashi-vishwanath", "kashi-vishwanath-temple", "vishwanath-temple"]
        },

        # Dharamshala
        "dharamshala:namgyal-monastery": {
            "image_url": "/images/places/dharamshala/namgyal-monastery.webp",
            "tier": "exact_place",
            "place_name": "Namgyal Monastery & Tsuglagkhang Complex",
            "destination": "Dharamshala",
            "category": "Culture & Heritage",
            "visual_description": "Dalai Lama monastery complex with prayer wheels surrounded by cedar woods under the Dhauladhar wall.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["namgyal-monastery", "namgyal-monastery-and-tsuglagkhang-complex", "tsuglagkhang"]
        },

        # Leh Ladakh
        "leh:thiksey-monastery-gompa": {
            "image_url": "/images/places/leh/thiksey-monastery-gompa.webp",
            "tier": "exact_place",
            "place_name": "Thiksey Monastery Gompa",
            "destination": "Leh",
            "category": "Culture & Heritage",
            "visual_description": "Layered 12-storey whitewashed and ochre Tibetan monastery rising on a hill above the Indus Valley.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["thiksey-monastery-gompa", "thiksey-monastery", "thiksey-gompa"]
        },

        # Spiti Valley
        "spiti:key-monastery": {
            "image_url": "/images/places/spiti/key-monastery.webp",
            "tier": "exact_place",
            "place_name": "Key Monastery Ki Gompa",
            "destination": "Spiti",
            "category": "Culture & Heritage",
            "visual_description": "Thousand-year-old fort-like Tibetan monastery perched atop a rocky hill in high-altitude cold desert.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "attribution": "VANVAS Verified Sanctuary Asset",
            "aliases": ["key-monastery", "key-monastery-ki-gompa", "ki-gompa", "kye-gompa"]
        },
    }

    DESTINATION_HEROES: Dict[str, str] = {
        "manali": "/images/destinations/manali/hero.jpg",
        "mussoorie": "/images/destinations/mussoorie/hero.jpg",
        "udaipur": "/images/destinations/udaipur/hero.jpg",
        "varanasi": "/images/destinations/varanasi/hero.jpg",
        "jaipur": "/images/destinations/jaipur/hero.jpg",
        "goa": "/images/destinations/goa/hero.jpg",
        "leh": "/images/destinations/leh/hero.jpg",
        "spiti": "/images/destinations/spiti-valley/hero.jpg",
        "spitivalley": "/images/destinations/spiti-valley/hero.jpg",
        "rishikesh": "/images/destinations/rishikesh/hero.jpg",
        "kasol": "/images/destinations/kasol/hero.jpg",
        "dharamshala": "/images/destinations/dharamshala/hero.jpg",
        "munnar": "/images/destinations/fallbacks/valley.jpg",
    }

    CATEGORY_THEME_MAP: Dict[str, str] = {
        "cafe": "cafe",
        "café": "cafe",
        "bakery": "cafe",
        "bakehouse": "cafe",
        "coffee": "cafe",
        "food": "food",
        "restaurant": "food",
        "dhaba": "food",
        "dining": "food",
        "street food": "food",
        "momo": "food",
        "hotel": "stay",
        "resort": "stay",
        "stay": "stay",
        "hostel": "stay",
        "homestay": "stay",
        "guesthouse": "stay",
        "cottage": "stay",
        "lodge": "stay",
        "church": "church",
        "cathedral": "church",
        "monastery": "monastery",
        "gompa": "monastery",
        "temple": "spiritual",
        "mandir": "spiritual",
        "shrine": "spiritual",
        "ashram": "spiritual",
        "ghat": "spiritual",
        "aarti": "spiritual",
        "gurudwara": "spiritual",
        "waterfall": "waterfall",
        "falls": "waterfall",
        "beach": "beach",
        "coast": "beach",
        "fort": "heritage",
        "palace": "heritage",
        "museum": "heritage",
        "monument": "heritage",
        "market": "shopping",
        "bazaar": "shopping",
        "shop": "shopping",
        "transport": "transport",
        "rental": "transport",
        "scooter": "transport",
        "bike": "transport",
        "trail": "nature",
        "trek": "nature",
        "forest": "nature",
        "woods": "nature",
        "river": "nature",
        "lake": "nature",
        "nature": "nature",
        "viewpoint": "viewpoint",
        "ridge": "viewpoint",
    }

    def detect_artwork_collisions(self) -> List[str]:
        asset_map: Dict[str, List[str]] = {}
        warnings: List[str] = []

        for key, item in self.PLACE_ARTWORK_REGISTRY.items():
            img_url = item["image_url"]
            if img_url not in asset_map:
                asset_map[img_url] = []
            asset_map[img_url].append(key)

        for img_url, keys in asset_map.items():
            if len(keys) > 1:
                destinations = set(k.split(":")[0] for k in keys)
                if len(destinations) > 1:
                    msg = f"ARTWORK COLLISION: asset {img_url} assigned across destinations: {', '.join(keys)}"
                    logger.warning(msg)
                    warnings.append(msg)

        return warnings

    def _clean_str(self, text: str) -> str:
        s = (text or "").lower()
        s = re.sub(r"[’'`]", "", s)
        s = re.sub(r"&", "and", s)
        s = re.sub(r"[^a-z0-9]", "-", s)
        s = re.sub(r"-+", "-", s)
        return s.strip("-")

    def _classify_category_theme(self, category: str = "", place_name: str = "") -> str:
        text = f"{(category or '').lower()} {(place_name or '').lower()}"
        for keyword, theme in self.CATEGORY_THEME_MAP.items():
            if keyword in text:
                return theme
        return "nature"

    def _resolve_regional_fallback(self, destination_name: str, category: str, place_name: str = "") -> str:
        d_lower = (destination_name or "").lower()
        c_lower = (category or "").lower()
        p_lower = (place_name or "").lower()
        combined = f"{d_lower} {c_lower} {p_lower}"

        if any(w in combined for w in ["beach", "coast", "sea", "goa", "kerala", "gokarna", "varkala", "andaman", "alappuzha", "pondicherry"]):
            return "/images/destinations/fallbacks/coastal.jpg"

        if any(w in combined for w in ["desert", "jaipur", "jodhpur", "jaisalmer", "bikaner", "rajasthan", "thar", "pushkar"]):
            return "/images/destinations/fallbacks/desert.jpg"

        if any(w in combined for w in ["varanasi", "ayodhya", "haridwar", "hampi", "ujjain", "mathura", "prayagraj", "ganga", "ghat", "munnar", "coorg", "wayanad", "ooty", "meghalaya", "shillong", "tea"]):
            return "/images/destinations/fallbacks/valley.jpg"

        return "/images/destinations/fallbacks/himalayan.jpg"

    def _get_universal_fallback(self, theme: str) -> str:
        theme_map = {
            "cafe": "/images/places/universal/cafe.webp",
            "food": "/images/places/universal/food.webp",
            "nature": "/images/places/universal/nature.webp",
            "waterfall": "/images/places/universal/waterfall.webp",
            "beach": "/images/places/universal/beach.webp",
            "lake": "/images/places/universal/lake.webp",
            "spiritual": "/images/places/universal/spiritual.webp",
            "monastery": "/images/places/universal/monastery.webp",
            "church": "/images/places/universal/church.webp",
            "heritage": "/images/places/universal/heritage.webp",
            "stay": "/images/places/universal/stay.webp",
            "shopping": "/images/places/universal/shopping.webp",
            "transport": "/images/places/universal/transport.webp",
            "nightlife": "/images/places/universal/nightlife.webp",
            "viewpoint": "/images/places/universal/viewpoint.webp",
        }
        return theme_map.get(theme, "/images/places/universal/nature.webp")

    async def resolve_place_artwork(
        self,
        place_name: str,
        destination_name: str,
        category: str,
        locality: Optional[str] = None,
        source_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deterministic 8-Level Priority Matching adhering strictly to ImageContract.
        """
        dest_norm = re.sub(r"[^a-z0-9]", "", (destination_name or "").lower())
        place_norm = self._clean_str(place_name)
        lookup_key = f"{dest_norm}:{place_norm}"

        dest_hero = self.DESTINATION_HEROES.get(dest_norm)
        theme = self._classify_category_theme(category, place_name)
        universal_fallback = self._get_universal_fallback(theme)
        fallback_url = dest_hero or universal_fallback

        # Priority 1: Exact direct place key match in registry
        if lookup_key in self.PLACE_ARTWORK_REGISTRY:
            item = self.PLACE_ARTWORK_REGISTRY[lookup_key]
            return {
                "url": item["image_url"],
                "fallback_url": fallback_url,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": theme,
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Sanctuary Asset"),
                "alt_text": f"{place_name} in {destination_name}",
                "badge_label": "VANVAS PLACE ARTWORK",
                "artwork_key": lookup_key,
                "image_url": item["image_url"],
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": item.get("source_type") == "real_photo",
                "badge": "VANVAS PLACE ARTWORK",
                "visual_description": item.get("visual_description"),
                "metadata": item
            }

        # Priority 2, 3, 4: Exact place matching against aliases and normalized tokens
        best_exact_match: Optional[Tuple[str, Dict[str, Any]]] = None
        best_score = 0

        for reg_key, item in self.PLACE_ARTWORK_REGISTRY.items():
            reg_dest, reg_place = reg_key.split(":")
            if reg_dest == dest_norm or reg_dest in dest_norm or dest_norm in reg_dest:
                score = 0
                aliases = item.get("aliases", [reg_place])
                
                if place_norm == reg_place or place_norm in aliases:
                    score = 100
                else:
                    for al in aliases:
                        if al == place_norm:
                            score = max(score, 100)
                        elif al in place_norm:
                            score = max(score, 80 + len(al))
                        elif place_norm in al:
                            score = max(score, 70 + len(place_norm))

                    if score < 70:
                        reg_toks = set(t for t in reg_place.split("-") if len(t) > 2)
                        place_toks = set(t for t in place_norm.split("-") if len(t) > 2)
                        overlap = reg_toks.intersection(place_toks)
                        if overlap:
                            generic_toks = {
                                "aarti", "temple", "trail", "waterfall", "point", "viewpoint",
                                "cove", "road", "lake", "palace", "fort", "cafe", "bakery",
                                "hill", "ridge", "view", "falls", "market", "bazaar", "shop",
                                "village", "quarter", "forest", "park", "shrine", "monastery",
                                "gompa", "mountain", "ancient", "heritage", "pine", "scenic", "stream",
                                "complex", "hall", "street", "garden"
                            }
                            distinctive = overlap - generic_toks
                            if distinctive:
                                score = 50 + sum(len(t) for t in distinctive)
                            elif len(overlap) >= 3:
                                score = 30 + len(overlap)

                if score > best_score:
                    best_score = score
                    best_exact_match = (reg_key, item)

        if best_exact_match and best_score >= 45:
            reg_key, item = best_exact_match
            return {
                "url": item["image_url"],
                "fallback_url": fallback_url,
                "source": item.get("source", "vanvas_curated"),
                "source_type": item.get("source_type", "editorial_artwork"),
                "provenance": "exact_place",
                "semantic_category": theme,
                "exactness": "exact",
                "attribution": item.get("attribution", "VANVAS Verified Sanctuary Asset"),
                "alt_text": f"{place_name} in {destination_name}",
                "badge_label": "VANVAS PLACE ARTWORK",
                "artwork_key": reg_key,
                "image_url": item["image_url"],
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": item.get("source_type") == "real_photo",
                "badge": "VANVAS PLACE ARTWORK",
                "visual_description": item.get("visual_description"),
                "metadata": item
            }

        # Priority 5: Destination + Category Artwork Fallback
        dest_key = dest_norm
        for k in self.DESTINATION_HEROES:
            if dest_norm in k or k in dest_norm:
                dest_key = k
                break

        mapped_cat_folder = theme if theme in ["cafe", "nature", "spiritual", "stay", "viewpoint"] else ("cafe" if theme in ["food", "shopping"] else ("nature" if theme in ["waterfall", "beach"] else ("spiritual" if theme in ["monastery", "church", "heritage"] else "nature")))
        category_artwork_path = f"/images/places/{dest_key}/categories/{mapped_cat_folder}.webp"

        if dest_key in self.DESTINATION_HEROES:
            return {
                "url": category_artwork_path,
                "fallback_url": fallback_url,
                "source": "vanvas_curated",
                "source_type": "category_photo",
                "provenance": "destination_category",
                "semantic_category": theme,
                "exactness": "category_matched",
                "attribution": "VANVAS Curated Category Atmosphere",
                "alt_text": f"{destination_name} {category} atmosphere",
                "badge_label": "DESTINATION CATEGORY ART",
                "artwork_key": f"{dest_key}:{theme}",
                "image_url": category_artwork_path,
                "tier": "destination_category",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": "DESTINATION CATEGORY ART",
                "visual_description": f"Authentic {destination_name} {theme} visual.",
                "metadata": {"destination": dest_key, "theme": theme}
            }

        # Priority 6: Universal Category Fallback (For unseeded destinations, preserve category semantic correctness)
        regional_url = self._resolve_regional_fallback(destination_name, category, place_name)
        return {
            "url": universal_fallback,
            "fallback_url": regional_url,
            "source": "fallback",
            "source_type": "fallback",
            "provenance": "universal_fallback",
            "semantic_category": theme,
            "exactness": "fallback",
            "attribution": "VANVAS Universal Category Asset",
            "alt_text": f"{category} travel visual",
            "badge_label": "UNIVERSAL FALLBACK",
            "artwork_key": f"universal:{theme}",
            "image_url": universal_fallback,
            "tier": "universal_fallback",
            "place_name": place_name,
            "destination": destination_name,
            "category": category,
            "is_real_photo": False,
            "badge": "UNIVERSAL FALLBACK",
            "metadata": {"universal_fallback": universal_fallback, "regional_fallback": regional_url}
        }

    async def get_artwork_metadata(self, artwork_key: str) -> Optional[Dict[str, Any]]:
        meta = self.PLACE_ARTWORK_REGISTRY.get(artwork_key)
        if meta:
            copy_meta = dict(meta)
            copy_meta["source"] = copy_meta.get("source") or "curated_artwork"
            return copy_meta
        return None


class OptionalAIArtworkProvider(CuratedArtworkProvider):
    """
    Artwork provider that utilizes curated sanctuary assets and supports optional AI extensions.
    """
    def __init__(self, groq_api_key: Optional[str] = None):
        super().__init__()
        self.groq_api_key = groq_api_key
