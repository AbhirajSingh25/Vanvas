import os
import re
import json
import logging
from typing import Dict, Any, Optional, List, Set, Tuple
from app.core.config import settings
from app.providers.base import ArtworkProvider

logger = logging.getLogger("vanvas.artwork")

class CuratedArtworkProvider(ArtworkProvider):
    """
    Production Curated & Local Artwork Resolver.
    Provides deterministic place-specific visual intelligence adhering to the strict 10-Level Resolution Hierarchy:
    LEVEL 1: Verified exact-place real photograph -> [ EXACT PLACE PHOTO ]
    LEVEL 2: Verified exact-place Wikimedia / trusted photo -> [ EXACT PLACE PHOTO ]
    LEVEL 3: Verified provider / live place photo -> [ LIVE PLACE PHOTO ]
    LEVEL 4: Curated exact-place artwork (unique to landmark) -> [ VANVAS PLACE ARTWORK ]
    LEVEL 5: Place-type / category-specific real photograph -> [ DESTINATION CATEGORY ART ]
    LEVEL 6: Place-type / category-specific destination artwork -> [ DESTINATION CATEGORY ART ]
    LEVEL 7: Regional category artwork -> [ REGIONAL ART ]
    LEVEL 8: Universal category artwork -> [ UNIVERSAL FALLBACK ]
    LEVEL 9: Generic destination artwork (ONLY IF semantically safe) -> [ DESTINATION ART ]
    LEVEL 10: Guaranteed universal safety fallback -> [ UNIVERSAL FALLBACK ]
    """

    PLACE_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {
        # --- Jaipur Landmarks ---
        "jaipur:hawa-mahal": {
            "image_url": "/images/places/jaipur/hawa-mahal.webp",
            "tier": "exact_place",
            "place_name": "Hawa Mahal (Palace of Winds)",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "Five-storey pink sandstone honeycomb facade with 953 carved jharokha lattice windows.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["hawa-mahal", "hawa-mahal-palace-of-winds", "palace-of-winds", "hawa-mahal-jaipur", "hawa"]
        },
        "jaipur:amber-fort": {
            "image_url": "/images/places/jaipur/amber-fort.webp",
            "tier": "exact_place",
            "place_name": "Amber Fort & Maota Lake",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "Majestic hilltop fort with pale yellow and pink sandstone ramparts reflected in Maota Lake.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["amber-fort", "amber-fort-and-maota-lake", "amber-palace-fort", "amer-fort", "amber-palace", "amer-palace", "amber-fort-maota-lake", "amber", "amer"]
        },
        "jaipur:nahargarh-fort": {
            "image_url": "/images/places/jaipur/nahargarh-fort.webp",
            "tier": "exact_place",
            "place_name": "Nahargarh Fort Sunset Bastion",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "Aravalli ridge fortress offering panoramic sunset views across the pink city expanse.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["nahargarh-fort", "nahargarh-fort-sunset", "nahargarh-fort-sunset-bastion", "nahargarh"]
        },
        "jaipur:city-palace": {
            "image_url": "/images/places/jaipur/city-palace.webp",
            "tier": "exact_place",
            "place_name": "City Palace Jaipur",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "Royal complex of courtyards, gardens, and ornate pavilions fusing Rajput and Mughal architecture.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["city-palace", "city-palace-jaipur", "jaipur-city-palace", "city-palace-complex-jaipur"]
        },
        "jaipur:jantar-mantar": {
            "image_url": "/images/places/jaipur/jantar-mantar.webp",
            "tier": "exact_place",
            "place_name": "Jantar Mantar Jaipur",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "UNESCO World Heritage 18th-century astronomical observatory with stone sundials.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["jantar-mantar", "jantar-mantar-jaipur", "jantar-mantar-observatory"]
        },

        # --- Leh Ladakh Landmarks ---
        "leh:leh-palace": {
            "image_url": "/images/places/leh/leh-palace.webp",
            "tier": "exact_place",
            "place_name": "Leh Palace",
            "destination": "Leh",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "Historic 17th-century Tibetan royal palace crowning the mountain ridge over Leh old town.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["leh-palace", "palace-of-leh", "leh-chen-spalkhar", "leh-royal-palace", "royal-leh-palace"]
        },
        "leh:pangong-tso": {
            "image_url": "/images/places/leh/pangong-tso.webp",
            "tier": "exact_place",
            "place_name": "Pangong Tso Alpine Lake",
            "destination": "Leh",
            "category": "Nature & Trails",
            "semantic_theme": "lake",
            "visual_description": "High-altitude saline lake shifting in shades of cobalt and turquoise under barren Himalayan crags.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["pangong-tso", "pangong-tso-lake", "pangong-tso-alpine-lake", "pangong-lake", "pangong"]
        },
        "leh:thiksey-monastery-gompa": {
            "image_url": "/images/places/leh/thiksey-monastery-gompa.webp",
            "tier": "exact_place",
            "place_name": "Thiksey Monastery (Gompa)",
            "destination": "Leh",
            "category": "Culture & Heritage",
            "semantic_theme": "monastery",
            "visual_description": "Layered 12-storey whitewashed and ochre Tibetan monastery rising on a hill above the Indus Valley.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["thiksey-monastery-gompa", "thiksey-monastery", "thiksey-gompa", "thiksay", "thiksey"]
        },

        # --- Udaipur Landmarks ---
        "udaipur:city-palace-udaipur": {
            "image_url": "/images/places/udaipur/city-palace-udaipur.webp",
            "tier": "exact_place",
            "place_name": "City Palace of Udaipur",
            "destination": "Udaipur",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "Monumental whitewashed marble palace with mirrored domes rising over the eastern shore of Lake Pichola.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["city-palace-udaipur", "city-palace-of-udaipur", "city-palace", "udaipur-city-palace"]
        },
        "udaipur:lake-pichola": {
            "image_url": "/images/places/udaipur/lake-pichola.webp",
            "tier": "exact_place",
            "place_name": "Lake Pichola Sunset Boat Voyage",
            "destination": "Udaipur",
            "category": "Nature & Trails",
            "semantic_theme": "lake",
            "visual_description": "Picturesque freshwater lake surrounded by whitewashed havelis, ghats, and hill silhouettes.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["lake-pichola", "lake-pichola-boat", "lake-pichola-sunset-boat-voyage", "pichola-lake", "pichola"]
        },
        "udaipur:jagdish-temple": {
            "image_url": "/images/places/udaipur/jagdish-temple.webp",
            "tier": "exact_place",
            "place_name": "Jagdish Temple",
            "destination": "Udaipur",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "visual_description": "Indo-Aryan carved stone temple dedicated to Lord Vishnu in the heart of Udaipur.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["jagdish-temple", "jagdish-mandir", "shri-jagdish-temple", "jagdish"]
        },
        "udaipur:saheliyon-ki-bari": {
            "image_url": "/images/places/udaipur/saheliyon-ki-bari.webp",
            "tier": "exact_place",
            "place_name": "Saheliyon Ki Bari (Garden of the Maids)",
            "destination": "Udaipur",
            "category": "Nature & Trails",
            "semantic_theme": "nature",
            "visual_description": "Historic royal garden with marble pavilions, lotus pools, and natural rain fountains.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["saheliyon-ki-bari", "saheliyon-ki-bari-garden-of-the-maids", "garden-of-the-maids", "saheliyon-bari"]
        },

        # --- Dharamshala / McLeod Ganj Landmarks ---
        "dharamshala:namgyal-monastery": {
            "image_url": "/images/places/dharamshala/namgyal-monastery.webp",
            "tier": "exact_place",
            "place_name": "Namgyal Monastery & Tsuglagkhang Complex",
            "destination": "Dharamshala",
            "category": "Culture & Heritage",
            "semantic_theme": "monastery",
            "visual_description": "Dalai Lama monastery complex with prayer wheels surrounded by cedar woods under the Dhauladhar wall.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["namgyal-monastery", "namgyal-monastery-and-tsuglagkhang-complex", "tsuglagkhang-complex", "namgyal-gompa", "namgyal"]
        },
        "dharamshala:bhagsunag-waterfall": {
            "image_url": "/images/places/dharamshala/bhagsunag-waterfall.webp",
            "tier": "exact_place",
            "place_name": "Bhagsunag Waterfall & Shiva Café",
            "destination": "Dharamshala",
            "category": "Nature & Trails",
            "semantic_theme": "waterfall",
            "visual_description": "Fresh mountain waterfall tumbling down rocky cliffs with bohemian Shiva Café above.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["bhagsunag-waterfall", "bhagsunag-waterfall-and-shiva-cafe", "bhagsu-waterfall", "bhagsu-falls", "bhagsunag"]
        },
        "dharamshala:triund-trek": {
            "image_url": "/images/places/dharamshala/triund-trek.webp",
            "tier": "exact_place",
            "place_name": "Triund High Ridge Himalayan Trek",
            "destination": "Dharamshala",
            "category": "Adventure",
            "semantic_theme": "trail",
            "visual_description": "High-altitude ridge trail opening to views of the sheer Dhauladhar granite wall and Kangra valley.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["triund-trek", "triund-high-ridge-himalayan-trek", "triund-trail", "triund"]
        },

        # --- Varanasi Landmarks ---
        "varanasi:dashashwamedh-ghat-aarti": {
            "image_url": "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
            "tier": "exact_place",
            "place_name": "Dashashwamedh Ghat Evening Maha Aarti",
            "destination": "Varanasi",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "visual_description": "Historic stone riverfront steps illuminated by brass oil lamps and evening river reflections.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["dashashwamedh-ghat-aarti", "dashashwamedh-ghat-evening-maha-aarti", "dashashwamedh-ghat", "dashashwamedh"]
        },
        "varanasi:assi-ghat": {
            "image_url": "/images/places/varanasi/assi-ghat.webp",
            "tier": "exact_place",
            "place_name": "Assi Ghat & Subah-e-Banaras Dawn Chants",
            "destination": "Varanasi",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "visual_description": "Southernmost sacred ghat at the Assi-Ganga confluence famous for morning yoga, Vedic chants, and sunrise mist.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["assi-ghat", "assi-ghat-subah", "assi-ghat-and-subah-e-banaras-dawn-chants", "asi-ghat", "assi"]
        },
        "varanasi:kashi-vishwanath": {
            "image_url": "/images/places/varanasi/kashi-vishwanath.webp",
            "tier": "exact_place",
            "place_name": "Kashi Vishwanath Golden Temple Corridor",
            "destination": "Varanasi",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "visual_description": "Sacred golden-spired temple of Lord Shiva along the eternal sandstone corridor of Kashi.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["kashi-vishwanath", "kashi-vishwanath-golden-temple-corridor", "kashi-vishwanath-temple", "vishwanath-temple", "kashi-vishwanath-golden-temple"]
        },
        "varanasi:blue-lassi-shop": {
            "image_url": "/images/places/varanasi/blue-lassi-shop.webp",
            "tier": "exact_place",
            "place_name": "Blue Lassi Traditional Shop",
            "destination": "Varanasi",
            "category": "Local Food",
            "semantic_theme": "food",
            "visual_description": "Historic alley shop serving thick hand-churned curd lassi in clay kulhad with fresh fruit and rabri.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["blue-lassi-shop", "blue-lassi", "blue-lassi-traditional-shop"]
        },
        "varanasi:sarnath": {
            "image_url": "/images/places/varanasi/sarnath.webp",
            "tier": "exact_place",
            "place_name": "Sarnath Sacred Deer Park & Dhamek Stupa",
            "destination": "Varanasi",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "visual_description": "Sacred deer park and monumental Dhamek Stupa where Lord Buddha gave his first sermon.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["sarnath", "sarnath-stupa", "sarnath-sacred-deer-park-and-dhamek-stupa", "dhamek-stupa"]
        },

        # --- Manali Landmarks ---
        "manali:hadimba-temple": {
            "image_url": "/images/places/manali/hadimba-temple.webp",
            "tier": "exact_place",
            "place_name": "Hadimba Devi Cedar Forest Temple",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "visual_description": "Four-tiered wooden pagoda temple set inside Dhungri towering deodar pine forest.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["hadimba-temple", "hadimba-devi-cedar-forest-temple", "hidimba-devi-temple", "dhungri-temple", "hidimba-temple", "hadimba"]
        },
        "manali:solang-valley": {
            "image_url": "/images/places/manali/solang-valley.webp",
            "tier": "exact_place",
            "place_name": "Solang Valley Alpine Meadow",
            "destination": "Manali",
            "category": "Adventure & Sport",
            "semantic_theme": "viewpoint",
            "visual_description": "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["solang-valley", "solang-valley-alpine-meadow", "solang-valley-ridge-and-paragliding", "solang-nullah", "solang"]
        },
        "manali:old-manali": {
            "image_url": "/images/places/manali/old-manali.webp",
            "tier": "exact_place",
            "place_name": "Old Manali Village & Manu Temple",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["old-manali", "old-manali-village-and-manu-temple", "old-manali-village", "old-manali-village-and-cafes"]
        },
        "manali:jogini-waterfall": {
            "image_url": "/images/places/manali/jogini-waterfall.webp",
            "tier": "exact_place",
            "place_name": "Jogini Waterfall Pine Trail",
            "destination": "Manali",
            "category": "Nature & Trails",
            "semantic_theme": "waterfall",
            "visual_description": "Scenic cascading waterfall plunging down pine-clad cliffs near Vashisht village.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["jogini-waterfall", "jogini-waterfall-pine-trail", "jogini-falls", "jugni-waterfall", "jogini"]
        },
        "manali:mall-road": {
            "image_url": "/images/places/manali/mall-road.webp",
            "tier": "exact_place",
            "place_name": "Manali Mall Road",
            "destination": "Manali",
            "category": "Markets & Craft",
            "semantic_theme": "shopping",
            "visual_description": "Bustling Himalayan pedestrian promenade with wooden shops, local woolen shawls, and mountain views.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["mall-road", "manali-mall-road", "the-mall-road-manali"]
        },
        "manali:manu-temple": {
            "image_url": "/images/places/manali/manu-temple.webp",
            "tier": "exact_place",
            "place_name": "Manu Temple",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "visual_description": "Ancient stone and wood pagoda temple dedicated to Sage Manu above Old Manali.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["manu-temple", "sage-manu-temple", "manu-mandir"]
        },
        "manali:vashisht-baths": {
            "image_url": "/images/places/manali/vashisht-baths.webp",
            "tier": "exact_place",
            "place_name": "Vashisht Hot Sulphur Baths",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "visual_description": "Natural sacred hot sulphur springs and ancient carved stone temple in Vashisht village.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["vashisht-baths", "vashisht-hot-water-springs", "vashisht-temple-and-springs", "vashisht"]
        },

        # --- Kasol / Parvati Valley Landmarks ---
        "kasol:moon-dance-cafe": {
            "image_url": "/images/places/kasol/moon-dance-cafe.webp",
            "tier": "exact_place",
            "place_name": "Moon Dance Café & German Bakery",
            "destination": "Kasol",
            "category": "Cafés & Bakery",
            "semantic_theme": "cafe",
            "visual_description": "Legendary bohemian bakery in Kasol serving fresh apple crumble, pastries, and mountain coffee under Parvati deodars.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["moon-dance-cafe", "moon-dance-cafe-and-german-bakery", "moon-dance-german-bakery", "moon-dance-bakery", "german-bakery-kasol", "moon-dance"]
        },
        "kasol:chalal-trail": {
            "image_url": "/images/places/kasol/chalal-trail.webp",
            "tier": "exact_place",
            "place_name": "Chalal Pine Riverside Trail",
            "destination": "Kasol",
            "category": "Nature & Trails",
            "semantic_theme": "trail",
            "visual_description": "Scenic suspended cable bridge path following emerald Parvati river through ancient towering pine woods to Chalal village.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["chalal-trail", "chalal-pine-riverside-trail", "chalal-pine-trail", "chalal-riverside-walk", "chalal-village-trail", "chalal"]
        },
        "kasol:manikaran-sahib": {
            "image_url": "/images/places/kasol/manikaran-sahib.webp",
            "tier": "exact_place",
            "place_name": "Gurudwara Shri Manikaran Sahib",
            "destination": "Kasol",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "visual_description": "Historic sacred hot sulphur springs and Gurudwara complex nestled along the roaring Parvati River gorge.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["manikaran-sahib", "manikaran-gurudwara", "manikaran-hot-springs", "gurudwara-shri-manikaran-sahib", "gurudwara-shri-manikaran-sahib-and-hot-springs", "manikaran"]
        },
        "kasol:kheerganga-trail": {
            "image_url": "/images/places/kasol/kheerganga-trail.webp",
            "tier": "exact_place",
            "place_name": "Kheerganga Alpine Meadow Trail",
            "destination": "Kasol",
            "category": "Nature & Trails",
            "semantic_theme": "trail",
            "visual_description": "Exhilarating Himalayan trekking trail ascending through pine forests to high alpine meadows and natural hot baths.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["kheerganga-trail", "kheerganga-trek", "kheerganga-alpine-meadow-trail", "khirganga-trail", "khirganga", "kheerganga"]
        },
        "kasol:tosh-village": {
            "image_url": "/images/places/kasol/tosh-village.webp",
            "tier": "exact_place",
            "place_name": "Tosh Traditional Wooden Village",
            "destination": "Kasol",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "Traditional wooden Himachali village at 2,400m perched at the edge of Tosh Glacier with panoramic snow peak vistas.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["tosh-village", "tosh-traditional-wooden-village", "tosh-glacier-view", "tosh-village-and-waterfall-trail", "tosh"]
        },
        "kasol:evergreen-cafe": {
            "image_url": "/images/places/kasol/evergreen-cafe.webp",
            "tier": "exact_place",
            "place_name": "Evergreen Café & Garden",
            "destination": "Kasol",
            "category": "Cafés & Bakery",
            "semantic_theme": "cafe",
            "visual_description": "Beloved garden café shaded by deodar pines famous for fresh Israeli platters, wood-fired pizza, and mountain teas.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["evergreen-cafe", "evergreen-cafe-and-garden-patio", "evergreen-cafe-and-garden", "evergreen-kasol", "evergreen"]
        },

        # --- Mussoorie / Landour Landmarks ---
        "mussoorie:st-pauls-church": {
            "image_url": "/images/places/mussoorie/st-pauls-church.webp",
            "tier": "exact_place",
            "place_name": "St. Paul's Church Landour",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "semantic_theme": "church",
            "visual_description": "Historic 1852 stone Anglican church in Landour with steep gabled wooden roof and lancet windows under deodar pines.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["st-pauls-church-landour", "st-pauls-church", "st-paul-church"]
        },
        "mussoorie:landour-bakehouse": {
            "image_url": "/images/places/mussoorie/landour-bakehouse.webp",
            "tier": "exact_place",
            "place_name": "Landour Bakehouse",
            "destination": "Mussoorie",
            "category": "Cafés & Bakery",
            "semantic_theme": "cafe",
            "visual_description": "Historic stone and timber hill bakery at Sisters Bazaar with Victorian glass vitrines and deodar canopy.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["landour-bakehouse", "landour-bakery", "sisters-bazaar-bakehouse"]
        },
        "mussoorie:lal-tibba": {
            "image_url": "/images/places/mussoorie/lal-tibba.webp",
            "tier": "exact_place",
            "place_name": "Lal Tibba Scenic Viewpoint",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "semantic_theme": "viewpoint",
            "visual_description": "Highest mountain ridge viewpoint in Landour with telescope overlooking distant Garhwal snow peaks.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["lal-tibba", "lal-tibba-scenic-viewpoint", "lal-tibba-viewpoint"]
        },
        "mussoorie:kempty-falls": {
            "image_url": "/images/places/mussoorie/kempty-falls.webp",
            "tier": "exact_place",
            "place_name": "Kempty Falls Mountain Cascade",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "semantic_theme": "waterfall",
            "visual_description": "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["kempty-falls", "kempty-falls-mountain-cascade", "kempty-waterfall", "kempty"]
        },
        "mussoorie:gun-hill": {
            "image_url": "/images/places/mussoorie/gun-hill.webp",
            "tier": "exact_place",
            "place_name": "Gun Hill Historic Viewpoint",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "semantic_theme": "viewpoint",
            "visual_description": "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["gun-hill", "gun-hill-historic-viewpoint", "gun-hill-viewpoint"]
        },
        "mussoorie:camel-back-road": {
            "image_url": "/images/places/mussoorie/camel-back-road.webp",
            "tier": "exact_place",
            "place_name": "Camel's Back Road & Winterline Trail",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "semantic_theme": "trail",
            "visual_description": "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["camel-back-road", "camels-back-road", "camels-back-road-and-winterline-trail", "camels-back-road-promenade"]
        },
        "mussoorie:clouds-end": {
            "image_url": "/images/places/mussoorie/clouds-end.webp",
            "tier": "exact_place",
            "place_name": "Clouds End",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "semantic_theme": "nature",
            "visual_description": "Dense oak and deodar wilderness marking the geographical end of the Mussoorie hill ridge.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["clouds-end", "clouds-end-forest-retreat", "clouds-end-heritage"]
        },
        "mussoorie:george-everest": {
            "image_url": "/images/places/mussoorie/george-everest.webp",
            "tier": "exact_place",
            "place_name": "George Everest Peak & House",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "semantic_theme": "viewpoint",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["george-everest", "george-everest-peak", "george-everest-house", "sir-george-everest"]
        },
        "mussoorie:landour": {
            "image_url": "/images/places/mussoorie/landour.webp",
            "tier": "exact_place",
            "place_name": "Landour Cantonment",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["landour", "landour-cantonment", "landour-hill"]
        },
        "mussoorie:mall-road": {
            "image_url": "/images/places/mussoorie/mall-road.webp",
            "tier": "exact_place",
            "place_name": "Mussoorie Mall Road",
            "destination": "Mussoorie",
            "category": "Markets & Craft",
            "semantic_theme": "shopping",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["mall-road", "mussoorie-mall-road", "the-mall-road-mussoorie"]
        },

        # --- Goa Landmarks ---
        "goa:fontainhas-latin-quarter": {
            "image_url": "/images/places/goa/fontainhas-latin-quarter.webp",
            "tier": "exact_place",
            "place_name": "Fontainhas Latin Heritage Quarter",
            "destination": "Goa",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "visual_description": "Pastel-painted Portuguese heritage houses with wrought-iron balconies and bougainvillea in Panaji.",
            "source": "vanvas_curated",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["fontainhas-latin-quarter", "fontainhas", "fontainhas-latin-heritage-quarter"]
        },
        "goa:aguada-fort": {
            "image_url": "/images/places/goa/aguada-fort.webp",
            "tier": "exact_place",
            "place_name": "Fort Aguada & Historic Lighthouse",
            "destination": "Goa",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["aguada-fort", "aguada-fort-and-historic-lighthouse", "fort-aguada", "aguada"]
        },
        "goa:anjuna-beach": {
            "image_url": "/images/places/goa/anjuna-beach.webp",
            "tier": "exact_place",
            "place_name": "Anjuna Beach & Flea Market",
            "destination": "Goa",
            "category": "Nature & Trails",
            "semantic_theme": "beach",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["anjuna-beach", "anjuna-flea-market", "anjuna"]
        },
        "goa:basilica-bom-jesus": {
            "image_url": "/images/places/goa/basilica-bom-jesus.webp",
            "tier": "exact_place",
            "place_name": "Basilica of Bom Jesus",
            "destination": "Goa",
            "category": "Culture & Heritage",
            "semantic_theme": "church",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["basilica-bom-jesus", "basilica-of-bom-jesus", "bom-jesus-basilica", "bom-jesus"]
        },
        "goa:dudhsagar-falls": {
            "image_url": "/images/places/goa/dudhsagar-falls.webp",
            "tier": "exact_place",
            "place_name": "Dudhsagar Falls",
            "destination": "Goa",
            "category": "Nature & Trails",
            "semantic_theme": "waterfall",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["dudhsagar-falls", "dudhsagar-waterfalls", "dudhsagar"]
        },

        # --- Munnar Landmarks ---
        "munnar:kolukkumalai-tea": {
            "image_url": "/images/places/munnar/kolukkumalai-tea.webp",
            "tier": "exact_place",
            "place_name": "Kolukkumalai Highest Tea Estate",
            "destination": "Munnar",
            "category": "Nature & Trails",
            "semantic_theme": "nature",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["kolukkumalai-tea", "kolukkumalai-highest-tea-estate", "kolukkumalai-tea-estate", "kolukkumalai"]
        },
        "munnar:eravikulam-park": {
            "image_url": "/images/places/munnar/eravikulam-park.webp",
            "tier": "exact_place",
            "place_name": "Eravikulam National Park & Anamudi Ridge",
            "destination": "Munnar",
            "category": "Nature & Trails",
            "semantic_theme": "nature",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["eravikulam-park", "eravikulam-national-park-and-anamudi-ridge", "eravikulam-national-park", "eravikulam"]
        },
        "munnar:mattupetty-dam": {
            "image_url": "/images/places/munnar/mattupetty-dam.webp",
            "tier": "exact_place",
            "place_name": "Mattupetty Dam & Reflection Lake",
            "destination": "Munnar",
            "category": "Nature & Trails",
            "semantic_theme": "lake",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["mattupetty-dam", "mattupetty-dam-and-reflection-lake", "mattupetty-lake", "mattupetty"]
        },

        # --- Rishikesh Landmarks ---
        "rishikesh:triveni-ghat": {
            "image_url": "/images/places/rishikesh/triveni-ghat.webp",
            "tier": "exact_place",
            "place_name": "Triveni Ghat Evening Maha Aarti",
            "destination": "Rishikesh",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["triveni-ghat", "triveni-ghat-evening-maha-aarti", "triveni-ghat-aarti", "triveni"]
        },
        "rishikesh:little-buddha-cafe": {
            "image_url": "/images/places/rishikesh/little-buddha-cafe.webp",
            "tier": "exact_place",
            "place_name": "Little Buddha Café & Treehouse",
            "destination": "Rishikesh",
            "category": "Cafés & Bakery",
            "semantic_theme": "cafe",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["little-buddha-cafe", "the-little-buddha-cafe", "little-buddha"]
        },
        "rishikesh:beatles-ashram": {
            "image_url": "/images/places/rishikesh/beatles-ashram.webp",
            "tier": "exact_place",
            "place_name": "The Beatles Ashram (Chaurasi Kutia)",
            "destination": "Rishikesh",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["beatles-ashram", "the-beatles-ashram-chaurasi-kutia", "chaurasi-kutia", "beatles-ashram-rishikesh"]
        },
        "rishikesh:neer-garh-waterfall": {
            "image_url": "/images/places/rishikesh/neer-garh-waterfall.webp",
            "tier": "exact_place",
            "place_name": "Neer Garh Multi-Tier Waterfall",
            "destination": "Rishikesh",
            "category": "Nature & Trails",
            "semantic_theme": "waterfall",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["neer-garh-waterfall", "neer-garh-multi-tier-waterfall", "neer-garh", "neer-waterfall"]
        },
        "rishikesh:laxman-jhula": {
            "image_url": "/images/places/rishikesh/laxman-jhula.webp",
            "tier": "exact_place",
            "place_name": "Laxman Jhula",
            "destination": "Rishikesh",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["laxman-jhula", "lakshman-jhula", "laxman-suspension-bridge"]
        },
        "rishikesh:ram-jhula": {
            "image_url": "/images/places/rishikesh/ram-jhula.webp",
            "tier": "exact_place",
            "place_name": "Ram Jhula",
            "destination": "Rishikesh",
            "category": "Culture & Heritage",
            "semantic_theme": "heritage",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["ram-jhula", "ram-suspension-bridge"]
        },
        "rishikesh:parmarth-niketan": {
            "image_url": "/images/places/rishikesh/parmarth-niketan.webp",
            "tier": "exact_place",
            "place_name": "Parmarth Niketan Ganga Aarti",
            "destination": "Rishikesh",
            "category": "Culture & Heritage",
            "semantic_theme": "spiritual",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["parmarth-niketan", "parmarth-niketan-ganga-aarti", "parmarth-ashram", "parmarth-niketan-ashram", "parmarth"]
        },
        "rishikesh:shivpuri-rafting": {
            "image_url": "/images/places/rishikesh/shivpuri-rafting.webp",
            "tier": "exact_place",
            "place_name": "Shivpuri White Water Rafting",
            "destination": "Rishikesh",
            "category": "Adventure",
            "semantic_theme": "activity",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["shivpuri-rafting", "shivpuri-white-water-rafting", "shivpuri-river-rafting", "rishikesh-rafting", "shivpuri"]
        },

        # --- Spiti Valley Landmarks ---
        "spiti:key-monastery": {
            "image_url": "/images/places/spiti/key-monastery.webp",
            "tier": "exact_place",
            "place_name": "Key Monastery (Kye Gompa)",
            "destination": "Spiti Valley",
            "category": "Culture & Heritage",
            "semantic_theme": "monastery",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["key-monastery", "key-monastery-ki-gompa", "key-monastery-kye-gompa", "ki-gompa", "kye-gompa", "key-gompa"]
        },
        "spiti:chandratal-lake": {
            "image_url": "/images/places/spiti/chandratal-lake.webp",
            "tier": "exact_place",
            "place_name": "Chandratal (Moon Lake) Glacial Sanctuary",
            "destination": "Spiti Valley",
            "category": "Nature & Trails",
            "semantic_theme": "lake",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["chandratal-lake", "chandratal", "chandra-taal", "chandratal-moon-lake-glacial-sanctuary", "moon-lake"]
        },
        "spiti:dhankar-gompa": {
            "image_url": "/images/places/spiti/dhankar-gompa.webp",
            "tier": "exact_place",
            "place_name": "Dhankar Gompa Cliffside Monastery",
            "destination": "Spiti Valley",
            "category": "Culture & Heritage",
            "semantic_theme": "monastery",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["dhankar-gompa", "dhankar-monastery", "dankhar"]
        },
        "spiti:tabo-monastery": {
            "image_url": "/images/places/spiti/tabo-monastery.webp",
            "tier": "exact_place",
            "place_name": "Tabo Monastery (Ajanta of the Himalayas)",
            "destination": "Spiti Valley",
            "category": "Culture & Heritage",
            "semantic_theme": "monastery",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["tabo-monastery", "tabo-gompa", "tabo", "tabo-monastery-ajanta-of-the-himalayas"]
        },
        "spiti:kaza": {
            "image_url": "/images/places/spiti/kaza.webp",
            "tier": "exact_place",
            "place_name": "Kaza High Town & Local Bazaar",
            "destination": "Spiti Valley",
            "category": "Shops & Markets",
            "semantic_theme": "heritage",
            "source_type": "editorial_artwork",
            "attribution": "VANVAS Verified Editorial Asset",
            "aliases": ["kaza", "kaza-town", "kaza-market", "kaza-high-town-and-local-bazaar"]
        }
    }

    DESTINATION_CATEGORY_REGISTRY: Dict[str, Dict[str, Any]] = {
        "jaipur": {
            "generic": "/images/destinations/jaipur/hero.jpg",
            "categories": {
                "stay": "/images/places/jaipur/categories/stay.webp",
                "cafe": "/images/places/jaipur/categories/cafe.webp",
                "food": "/images/places/jaipur/categories/cafe.webp",
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
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "leh": {
            "generic": "/images/destinations/leh/hero.jpg",
            "categories": {
                "stay": "/images/places/leh/categories/stay.webp",
                "cafe": "/images/places/leh/categories/cafe.webp",
                "food": "/images/places/leh/categories/cafe.webp",
                "nature": "/images/places/leh/categories/nature.webp",
                "trail": "/images/places/leh/categories/nature.webp",
                "lake": "/images/places/leh/categories/lake.webp",
                "monastery": "/images/places/leh/categories/monastery.webp",
                "heritage": "/images/places/leh/categories/heritage.webp",
                "spiritual": "/images/places/leh/categories/spiritual.webp",
                "viewpoint": "/images/places/leh/categories/viewpoint.webp",
                "waterfall": "/images/places/leh/categories/waterfall.webp",
                "church": "/images/places/leh/categories/church.webp",
                "beach": "/images/places/leh/categories/beach.webp",
                "shopping": "/images/places/leh/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "udaipur": {
            "generic": "/images/destinations/udaipur/hero.jpg",
            "categories": {
                "stay": "/images/places/udaipur/categories/stay.webp",
                "cafe": "/images/places/udaipur/categories/cafe.webp",
                "food": "/images/places/udaipur/categories/cafe.webp",
                "nature": "/images/places/udaipur/categories/nature.webp",
                "trail": "/images/places/udaipur/categories/nature.webp",
                "lake": "/images/places/udaipur/categories/lake.webp",
                "heritage": "/images/places/udaipur/categories/heritage.webp",
                "spiritual": "/images/places/udaipur/categories/spiritual.webp",
                "viewpoint": "/images/places/udaipur/categories/viewpoint.webp",
                "waterfall": "/images/places/udaipur/categories/waterfall.webp",
                "monastery": "/images/places/udaipur/categories/monastery.webp",
                "church": "/images/places/udaipur/categories/church.webp",
                "beach": "/images/places/udaipur/categories/beach.webp",
                "shopping": "/images/places/udaipur/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "dharamshala": {
            "generic": "/images/destinations/dharamshala/hero.jpg",
            "categories": {
                "stay": "/images/places/dharamshala/categories/stay.webp",
                "cafe": "/images/places/dharamshala/categories/cafe.webp",
                "food": "/images/places/dharamshala/categories/cafe.webp",
                "nature": "/images/places/dharamshala/categories/nature.webp",
                "trail": "/images/places/dharamshala/categories/nature.webp",
                "waterfall": "/images/places/dharamshala/categories/waterfall.webp",
                "monastery": "/images/places/dharamshala/categories/monastery.webp",
                "spiritual": "/images/places/dharamshala/categories/spiritual.webp",
                "heritage": "/images/places/dharamshala/categories/heritage.webp",
                "viewpoint": "/images/places/dharamshala/categories/viewpoint.webp",
                "lake": "/images/places/dharamshala/categories/lake.webp",
                "church": "/images/places/dharamshala/categories/church.webp",
                "beach": "/images/places/dharamshala/categories/beach.webp",
                "shopping": "/images/places/dharamshala/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "varanasi": {
            "generic": "/images/destinations/varanasi/hero.jpg",
            "categories": {
                "stay": "/images/places/varanasi/categories/stay.webp",
                "cafe": "/images/places/varanasi/categories/cafe.webp",
                "food": "/images/places/varanasi/categories/cafe.webp",
                "nature": "/images/places/varanasi/categories/nature.webp",
                "trail": "/images/places/varanasi/categories/nature.webp",
                "spiritual": "/images/places/varanasi/categories/spiritual.webp",
                "heritage": "/images/places/varanasi/categories/heritage.webp",
                "viewpoint": "/images/places/varanasi/categories/viewpoint.webp",
                "lake": "/images/places/varanasi/categories/lake.webp",
                "waterfall": "/images/places/varanasi/categories/waterfall.webp",
                "monastery": "/images/places/varanasi/categories/monastery.webp",
                "church": "/images/places/varanasi/categories/church.webp",
                "beach": "/images/places/varanasi/categories/beach.webp",
                "shopping": "/images/places/varanasi/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "manali": {
            "generic": "/images/destinations/manali/hero.jpg",
            "categories": {
                "stay": "/images/places/manali/categories/stay.webp",
                "cafe": "/images/places/manali/categories/cafe.webp",
                "food": "/images/places/manali/categories/cafe.webp",
                "nature": "/images/places/manali/categories/nature.webp",
                "trail": "/images/places/manali/categories/nature.webp",
                "waterfall": "/images/places/manali/categories/waterfall.webp",
                "spiritual": "/images/places/manali/categories/spiritual.webp",
                "heritage": "/images/places/manali/categories/heritage.webp",
                "viewpoint": "/images/places/manali/categories/viewpoint.webp",
                "lake": "/images/places/manali/categories/lake.webp",
                "monastery": "/images/places/manali/categories/monastery.webp",
                "church": "/images/places/manali/categories/church.webp",
                "beach": "/images/places/manali/categories/beach.webp",
                "shopping": "/images/places/manali/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
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
                "spiritual": "/images/places/kasol/categories/spiritual.webp",
                "heritage": "/images/places/kasol/categories/heritage.webp",
                "viewpoint": "/images/places/kasol/categories/viewpoint.webp",
                "waterfall": "/images/places/kasol/categories/waterfall.webp",
                "lake": "/images/places/kasol/categories/lake.webp",
                "monastery": "/images/places/kasol/categories/monastery.webp",
                "church": "/images/places/kasol/categories/church.webp",
                "beach": "/images/places/kasol/categories/beach.webp",
                "shopping": "/images/places/kasol/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "mussoorie": {
            "generic": "/images/destinations/mussoorie/hero.jpg",
            "categories": {
                "stay": "/images/places/mussoorie/categories/stay.webp",
                "cafe": "/images/places/mussoorie/categories/cafe.webp",
                "food": "/images/places/mussoorie/categories/cafe.webp",
                "nature": "/images/places/mussoorie/categories/nature.webp",
                "trail": "/images/places/mussoorie/categories/nature.webp",
                "waterfall": "/images/places/mussoorie/categories/waterfall.webp",
                "church": "/images/places/mussoorie/categories/church.webp",
                "spiritual": "/images/places/mussoorie/categories/spiritual.webp",
                "heritage": "/images/places/mussoorie/categories/heritage.webp",
                "viewpoint": "/images/places/mussoorie/categories/viewpoint.webp",
                "lake": "/images/places/mussoorie/categories/lake.webp",
                "monastery": "/images/places/mussoorie/categories/monastery.webp",
                "beach": "/images/places/mussoorie/categories/beach.webp",
                "shopping": "/images/places/mussoorie/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "goa": {
            "generic": "/images/destinations/goa/hero.jpg",
            "categories": {
                "stay": "/images/places/goa/categories/stay.webp",
                "cafe": "/images/places/goa/categories/cafe.webp",
                "food": "/images/places/goa/categories/cafe.webp",
                "nature": "/images/places/goa/categories/nature.webp",
                "trail": "/images/places/goa/categories/nature.webp",
                "beach": "/images/places/goa/categories/beach.webp",
                "heritage": "/images/places/goa/categories/heritage.webp",
                "spiritual": "/images/places/goa/categories/spiritual.webp",
                "church": "/images/places/goa/categories/church.webp",
                "waterfall": "/images/places/goa/categories/waterfall.webp",
                "viewpoint": "/images/places/goa/categories/viewpoint.webp",
                "lake": "/images/places/goa/categories/lake.webp",
                "monastery": "/images/places/goa/categories/monastery.webp",
                "shopping": "/images/places/goa/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "munnar": {
            "generic": "/images/destinations/fallbacks/valley.jpg",
            "categories": {
                "stay": "/images/places/munnar/categories/stay.webp",
                "cafe": "/images/places/munnar/categories/cafe.webp",
                "food": "/images/places/munnar/categories/cafe.webp",
                "nature": "/images/places/munnar/categories/nature.webp",
                "trail": "/images/places/munnar/categories/nature.webp",
                "waterfall": "/images/places/munnar/categories/waterfall.webp",
                "lake": "/images/places/munnar/categories/lake.webp",
                "heritage": "/images/places/munnar/categories/heritage.webp",
                "spiritual": "/images/places/munnar/categories/spiritual.webp",
                "viewpoint": "/images/places/munnar/categories/viewpoint.webp",
                "monastery": "/images/places/munnar/categories/monastery.webp",
                "church": "/images/places/munnar/categories/church.webp",
                "beach": "/images/places/munnar/categories/beach.webp",
                "shopping": "/images/places/munnar/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "rishikesh": {
            "generic": "/images/destinations/rishikesh/hero.jpg",
            "categories": {
                "stay": "/images/places/rishikesh/categories/stay.webp",
                "cafe": "/images/places/rishikesh/categories/cafe.webp",
                "food": "/images/places/rishikesh/categories/cafe.webp",
                "nature": "/images/places/rishikesh/categories/nature.webp",
                "trail": "/images/places/rishikesh/categories/nature.webp",
                "spiritual": "/images/places/rishikesh/categories/spiritual.webp",
                "heritage": "/images/places/rishikesh/categories/heritage.webp",
                "waterfall": "/images/places/rishikesh/categories/waterfall.webp",
                "viewpoint": "/images/places/rishikesh/categories/viewpoint.webp",
                "lake": "/images/places/rishikesh/categories/lake.webp",
                "monastery": "/images/places/rishikesh/categories/monastery.webp",
                "church": "/images/places/rishikesh/categories/church.webp",
                "beach": "/images/places/rishikesh/categories/beach.webp",
                "shopping": "/images/places/rishikesh/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        },
        "spiti": {
            "generic": "/images/destinations/spiti-valley/hero.jpg",
            "categories": {
                "stay": "/images/places/spiti/categories/stay.webp",
                "cafe": "/images/places/spiti/categories/cafe.webp",
                "food": "/images/places/spiti/categories/food.webp",
                "nature": "/images/places/spiti/categories/nature.webp",
                "trail": "/images/places/spiti/categories/nature.webp",
                "lake": "/images/places/spiti/categories/lake.webp",
                "monastery": "/images/places/spiti/categories/monastery.webp",
                "spiritual": "/images/places/spiti/categories/spiritual.webp",
                "heritage": "/images/places/spiti/categories/heritage.webp",
                "viewpoint": "/images/places/spiti/categories/viewpoint.webp",
                "waterfall": "/images/places/spiti/categories/waterfall.webp",
                "church": "/images/places/spiti/categories/church.webp",
                "beach": "/images/places/spiti/categories/beach.webp",
                "shopping": "/images/places/spiti/categories/cafe.webp",
                "transport": "/images/places/universal/transport.webp"
            }
        }
    }

    DESTINATION_HEROES: Dict[str, Dict[str, str]] = {
        "manali": {"hero": "/images/destinations/manali/hero.jpg", "illustration": "/images/destinations/manali/illustration.jpg"},
        "kasol": {"hero": "/images/destinations/kasol/hero.jpg", "illustration": "/images/destinations/kasol/illustration.jpg"},
        "spiti": {"hero": "/images/destinations/spiti/hero.jpg", "illustration": "/images/destinations/spiti/illustration.jpg"},
        "dharamshala": {"hero": "/images/destinations/dharamshala/hero.jpg", "illustration": "/images/destinations/dharamshala/illustration.jpg"},
        "mussoorie": {"hero": "/images/destinations/mussoorie/hero.jpg", "illustration": "/images/destinations/mussoorie/illustration.jpg"},
        "rishikesh": {"hero": "/images/destinations/rishikesh/hero.jpg", "illustration": "/images/destinations/rishikesh/illustration.jpg"},
        "udaipur": {"hero": "/images/destinations/udaipur/hero.jpg", "illustration": "/images/destinations/udaipur/illustration.jpg"},
        "jaipur": {"hero": "/images/destinations/jaipur/hero.jpg", "illustration": "/images/destinations/jaipur/illustration.jpg"},
        "goa": {"hero": "/images/destinations/goa/hero.jpg", "illustration": "/images/destinations/goa/illustration.jpg"},
        "varanasi": {"hero": "/images/destinations/varanasi/hero.jpg", "illustration": "/images/destinations/varanasi/illustration.jpg"},
        "leh": {"hero": "/images/destinations/leh/hero.jpg", "illustration": "/images/destinations/leh/illustration.jpg"},
        "munnar": {"hero": "/images/destinations/munnar/hero.jpg", "illustration": "/images/destinations/munnar/illustration.jpg"},
    }

    def _clean_str(self, text: str) -> str:
        s = (text or "").lower()
        s = re.sub(r"[’'`]", "", s)
        s = re.sub(r"&", "and", s)
        s = re.sub(r"[^a-z0-9]", "-", s)
        s = re.sub(r"-+", "-", s)
        return s.strip("-")

    def _normalize_key(self, destination: str, place: str) -> str:
        return f"{self._clean_str(destination)}:{self._clean_str(place)}"

    def _classify_category_theme(self, category: str = "", place_name: str = "", tags: str = "") -> str:
        text = f"{(category or '').lower()} {(place_name or '').lower()} {(tags or '').lower()}"

        if any(w in text for w in ["hotel", "resort", "cottage", "homestay", "hostel", "guesthouse", "guest house", "lodge", "stay", "accommodation", "villa", "inn", "mudhouse", "sanctuary retreat", "boutique retreat", "retreat", "niwas", "manor", "residency", "camp", "tent", "bed & breakfast", "b&b"]) or ("haveli" in text and any(s in text for s in ["stay", "hotel", "room", "sanctuary", "heritage", "jagat"])) or ("palace" in text and any(s in text for s in ["hotel", "retreat", "resort", "stay", "lakeside", "niwas", "brijrama"])):
            return "stay"
        if any(w in text for w in ["cafe", "café", "coffee", "bakery", "bakehouse", "tea house", "espresso", "german bakery", "patisserie", "tibetan kitchen"]):
            return "cafe"
        if any(w in text for w in ["food", "restaurant", "dhaba", "momo", "tibetan food", "dining", "kitchen", "eatery", "street food", "bhojanalaya", "sweet", "chaat", "thukpa", "lassi", "rasoi", "thali"]):
            return "food"
        if any(w in text for w in ["church", "cathedral", "chapel", "basilica"]):
            return "church"
        if any(w in text for w in ["monastery", "gompa", "stupa", "tibetan temple", "dzong", "kye gompa", "ki gompa"]):
            return "monastery"
        if any(w in text for w in ["waterfall", "falls", "cascade"]):
            return "waterfall"
        if any(w in text for w in ["lake", "tso", "taal", "tal", "river", "stream", "pond", "dam"]):
            return "lake"
        if any(w in text for w in ["beach", "coast", "cove", "shore", "cliff beach"]):
            return "beach"
        if any(w in text for w in ["trail", "trek", "walk", "hike", "promenade", "climb", "pass"]):
            return "trail"
        if any(w in text for w in ["temple", "mandir", "shrine", "ashram", "gurudwara", "mosque", "masjid", "ghat", "aarti", "spiritual", "jyotirlinga"]):
            return "spiritual"
        if any(w in text for w in ["fort", "palace", "haveli", "museum", "monument", "heritage", "ruins", "castle", "latin quarter"]):
            return "heritage"
        if any(w in text for w in ["market", "bazaar", "shop", "store", "boutique", "souvenir", "craft"]):
            return "shopping"
        if any(w in text for w in ["rental", "scooter", "motorcycle", "bike", "taxi", "transport", "bus stand", "railway", "mobility"]):
            return "transport"
        if any(w in text for w in ["hospital", "clinic", "pharmacy", "doctor", "medical", "police", "atm", "essential"]):
            return "medical"
        if any(w in text for w in ["viewpoint", "view point", "ridge", "peak", "tibba", "top", "scenic point"]):
            return "viewpoint"
        if any(w in text for w in ["forest", "woods", "pine", "deodar", "jungle", "park", "garden", "sanctuary", "tea", "plantation", "nature"]):
            return "nature"
        return "nature"

    def _themes_compatible(self, t1: str, t2: str) -> bool:
        if t1 == t2:
            return True
        # Hard isolation guardrails:
        # 1. Stay/Accommodation must NEVER match non-stay
        if t1 == "stay" or t2 == "stay":
            return False
        # 2. Food/Cafe must NEVER match spiritual/temple/monastery/church
        food_group = {"cafe", "food"}
        spirit_group = {"spiritual", "monastery", "church"}
        if (t1 in food_group and t2 in spirit_group) or (t1 in spirit_group and t2 in food_group):
            return False
        return True

    def _resolve_regional_fallback(self, destination: str = "", category_or_theme: str = "") -> str:
        dest_lower = (destination or "").lower()
        cat_lower = (category_or_theme or "").lower()
        if any(w in cat_lower for w in ["beach", "coast", "sea", "ocean", "cove"]) or any(w in dest_lower for w in ["goa", "gokarna", "kerala", "andaman", "pondicherry"]):
            return "/images/destinations/fallbacks/coastal.jpg"
        if any(w in cat_lower for w in ["desert", "fort", "sand", "dune"]) or any(w in dest_lower for w in ["jaipur", "jodhpur", "jaisalmer", "rajasthan", "bikaner", "pushkar"]):
            return "/images/destinations/fallbacks/desert.jpg"
        if any(w in cat_lower for w in ["ghat", "river", "temple", "spiritual", "aarti"]) or any(w in dest_lower for w in ["varanasi", "ayodhya", "rishikesh", "haridwar", "ujjain", "hampi"]):
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
            "nature": "/images/places/universal/nature.webp",
            "waterfall": "/images/places/universal/waterfall.webp",
            "lake": "/images/places/universal/lake.webp",
            "beach": "/images/places/universal/beach.webp",
            "viewpoint": "/images/places/universal/viewpoint.webp",
            "shopping": "/images/places/universal/shopping.webp",
            "nightlife": "/images/places/universal/nightlife.webp",
            "activity": "/images/places/universal/viewpoint.webp",
            "transport": "/images/places/universal/transport.webp",
            "medical": "/images/places/universal/medical.webp",
            "service": "/images/places/universal/service.webp",
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
        """
        Deterministic 10-Level Priority Matching adhering strictly to ImageContract.
        """
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

        # LEVEL 1 & 2 & 3: Verified Real Photograph URL
        if existing_image_url and (existing_image_url.startswith("http://") or existing_image_url.startswith("https://")) and "placeholder" not in existing_image_url:
            is_wm = "wikimedia.org" in existing_image_url or "wikidata.org" in existing_image_url
            badge = "EXACT PLACE PHOTO" if is_wm else ("LIVE PLACE PHOTO" if is_live else "DESTINATION CATEGORY ART")
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

        # HARD ISOLATION FOR STAYS: Never inherit landmark artwork
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
                "alt_text": f"{place_name} accommodation in {destination_name}",
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

        # LEVEL 4: Curated Exact Place Match
        lookup_key = f"{dest_norm}:{place_norm}"
        if lookup_key in self.PLACE_ARTWORK_REGISTRY:
            item = self.PLACE_ARTWORK_REGISTRY[lookup_key]
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
                "artwork_key": lookup_key,
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

        # LEVEL 4B: Alias / Distinctive token matching
        best_exact_match: Optional[Tuple[str, Dict[str, Any]]] = None
        best_score = 0
        generic_toks = {
            "aarti", "temple", "trail", "waterfall", "point", "viewpoint",
            "cove", "crescent", "road", "lake", "palace", "fort", "cafe", "bakery",
            "hill", "ridge", "view", "falls", "market", "bazaar", "shop", "beach",
            "village", "quarter", "forest", "park", "shrine", "monastery", "meadow",
            "gompa", "mountain", "ancient", "heritage", "pine", "scenic", "stream",
            "house", "complex", "center", "centre", "and", "the", "near", "rd", "hall",
            "stupa", "dam", "river", "sanctuary", "town", "valley", "cascade", "pool",
            "retreat", "resort", "hotel", "villa", "lodge", "camp", "treehouse",
            "walk", "promenade", "dome", "institute", "cultural", "woods", "stone"
        }

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
                        elif al in place_norm and len(al) >= 4:
                            score = max(score, 80 + len(al))
                        elif place_norm in al and len(place_norm) >= 4:
                            score = max(score, 70 + len(place_norm))

                    if score < 70:
                        reg_toks = set(t for t in reg_place.split("-") if len(t) > 2)
                        place_toks = set(t for t in place_norm.split("-") if len(t) > 2)
                        overlap = reg_toks.intersection(place_toks)
                        distinctive = overlap - generic_toks
                        if distinctive:
                            score = 50 + sum(len(t) for t in distinctive)

                if score > best_score:
                    best_score = score
                    best_exact_match = (reg_key, item)

        if best_exact_match and best_score >= 55:
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

        # LEVEL 6: Destination-Specific Category Visual
        if dest_category_fallback:
            return {
                "url": dest_category_fallback,
                "fallback_url": universal_fallback,
                "source": "vanvas_curated",
                "source_type": "category_photo",
                "provenance": "destination_category",
                "semantic_category": theme,
                "exactness": "category_matched",
                "attribution": f"VANVAS Curated {destination_name} Atmosphere",
                "alt_text": f"{destination_name} {category} visual atmosphere",
                "badge_label": "DESTINATION CATEGORY ART",
                "artwork_key": f"{matched_dest}:{theme}",
                "image_url": dest_category_fallback,
                "tier": "destination_category",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "is_real_photo": False,
                "badge": "DESTINATION CATEGORY ART",
                "visual_description": f"Authentic {destination_name} {theme} visual.",
                "metadata": {"destination": matched_dest, "theme": theme, "category_theme": theme}
            }

        # LEVEL 7 & 8: Regional / Universal Category Visual
        if theme in ["cafe", "food", "waterfall", "monastery", "church", "shopping", "nightlife", "medical", "transport"]:
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
            "source": "fallback",
            "source_type": tier_name,
            "provenance": tier_name,
            "semantic_category": theme,
            "exactness": "fallback",
            "attribution": "VANVAS Curated Atmospheric Visual",
            "alt_text": f"{category} travel visual",
            "badge_label": badge_name,
            "artwork_key": f"{tier_name}:{theme}",
            "image_url": fallback_img,
            "tier": tier_name,
            "place_name": place_name,
            "destination": destination_name,
            "category": category,
            "is_real_photo": False,
            "badge": badge_name,
            "metadata": {"category_theme": theme, "regional_fallback": fallback_img, "universal_fallback": universal_fallback}
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
