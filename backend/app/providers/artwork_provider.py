import os
import re
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.core.config import settings
from app.providers.base import ArtworkProvider

logger = logging.getLogger("vanvas.artwork")

class CuratedArtworkProvider(ArtworkProvider):
    """
    Production Curated & Local Artwork Resolver.
    Provides deterministic place-specific visual intelligence matching recognized landmarks
    and applying authentic multi-tier fallbacks without random array indexing.
    """
    
    # Exact Place Artwork Registry mapped deterministically by normalized key
    PLACE_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {
        # Mussoorie
        "mussoorie:landour-bakehouse": {
            "image_url": "/images/places/mussoorie/landour-bakehouse.webp",
            "tier": "exact_place",
            "place_name": "Landour Bakehouse",
            "destination": "Mussoorie",
            "category": "Cafés & Bakery",
            "visual_description": "Historic stone and timber hill bakery at Sisters Bazaar with Victorian glass vitrines and deodar canopy.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "mussoorie:lal-tibba": {
            "image_url": "/images/places/mussoorie/lal-tibba.webp",
            "tier": "exact_place",
            "place_name": "Lal Tibba Scenic Viewpoint",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "Highest mountain ridge viewpoint in Landour with telescope overlooking distant Garhwal snow peaks.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "mussoorie:kempty-falls": {
            "image_url": "/images/places/mussoorie/kempty-falls.webp",
            "tier": "exact_place",
            "place_name": "Kempty Falls Mountain Cascade",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "mussoorie:gun-hill": {
            "image_url": "/images/places/mussoorie/gun-hill.webp",
            "tier": "exact_place",
            "place_name": "Gun Hill Historic Viewpoint",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "mussoorie:camel-back-road": {
            "image_url": "/images/places/mussoorie/camel-back-road.webp",
            "tier": "exact_place",
            "place_name": "Camel's Back Road Promenade",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "mussoorie:mall-road": {
            "image_url": "/images/places/mussoorie/mall-road.webp",
            "tier": "exact_place",
            "place_name": "Mussoorie Mall Road",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Colonial promenade with glowing vintage iron lampposts, bookshops, and evening strolls.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "mussoorie:george-everest": {
            "image_url": "/images/places/mussoorie/george-everest.webp",
            "tier": "exact_place",
            "place_name": "Sir George Everest Peak & Estate",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "White stone colonial observatory estate perched on grassy ridge with panoramic snow peak vistas.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "mussoorie:clouds-end": {
            "image_url": "/images/places/mussoorie/clouds-end.webp",
            "tier": "exact_place",
            "place_name": "Cloud's End Heritage Estate",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Secluded historic stone bungalow nestled deep in ancient deodar and pine wilderness.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "mussoorie:landour": {
            "image_url": "/images/places/mussoorie/landour.webp",
            "tier": "exact_place",
            "place_name": "Landour Cantonment Ridge",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Misty colonial ridge settlement with St. Paul church, stone cottages, and silent oak paths.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Manali
        "manali:hadimba-temple": {
            "image_url": "/images/places/manali/hadimba-temple.webp",
            "tier": "exact_place",
            "place_name": "Hadimba Devi Cedar Forest Temple",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "visual_description": "Four-tiered wooden pagoda temple set inside Dhungri towering deodar pine forest.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "manali:solang-valley": {
            "image_url": "/images/places/manali/solang-valley.webp",
            "tier": "exact_place",
            "place_name": "Solang Valley Alpine Meadow",
            "destination": "Manali",
            "category": "Adventure & Sport",
            "visual_description": "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "manali:old-manali": {
            "image_url": "/images/places/manali/old-manali.webp",
            "tier": "exact_place",
            "place_name": "Old Manali Village & Cafes",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "visual_description": "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "manali:cafe-1947": {
            "image_url": "/images/places/manali/old-manali.webp",
            "tier": "exact_place",
            "place_name": "Café 1947",
            "destination": "Manali",
            "category": "Cafés & Bakery",
            "visual_description": "Rustic stone mountain cafe with wooden deck sitting directly over the rushing Manalsu river.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "manali:jogini-waterfall": {
            "image_url": "/images/destinations/manali/hero.jpg",
            "tier": "exact_place",
            "place_name": "Jogini Waterfall Pine Trail",
            "destination": "Manali",
            "category": "Nature & Trails",
            "visual_description": "Gentle cascading multi-tier waterfall surrounded by apple orchards and pine groves.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Udaipur
        "udaipur:city-palace-udaipur": {
            "image_url": "/images/destinations/udaipur/hero.jpg",
            "tier": "exact_place",
            "place_name": "City Palace of Udaipur",
            "destination": "Udaipur",
            "category": "Culture & Heritage",
            "visual_description": "Monumental white marble palace with mirrored domes towering over the east bank of Lake Pichola.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "udaipur:lake-pichola-boat": {
            "image_url": "/images/destinations/udaipur/illustration.jpg",
            "tier": "exact_place",
            "place_name": "Lake Pichola Sunset Boat Voyage",
            "destination": "Udaipur",
            "category": "Nature & Trails",
            "visual_description": "Tranquil evening lake waters reflecting whitewashed Mewari palaces and Jag Mandir island.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Varanasi
        "varanasi:dashashwamedh-ghat-aarti": {
            "image_url": "/images/destinations/varanasi/hero.jpg",
            "tier": "exact_place",
            "place_name": "Dashashwamedh Ghat Evening Maha Aarti",
            "destination": "Varanasi",
            "category": "Culture & Heritage",
            "visual_description": "Historic stone riverfront steps illuminated by brass oil lamps and twilight river reflections.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "varanasi:assi-ghat-subah": {
            "image_url": "/images/destinations/varanasi/illustration.jpg",
            "tier": "exact_place",
            "place_name": "Assi Ghat & Subah-e-Banaras",
            "destination": "Varanasi",
            "category": "Culture & Heritage",
            "visual_description": "Dawn light on the southern ghats with wooden rowboats resting on calm holy waters.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Jaipur
        "jaipur:hawa-mahal": {
            "image_url": "/images/destinations/jaipur/hero.jpg",
            "tier": "exact_place",
            "place_name": "Hawa Mahal",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "visual_description": "Intricately carved pink sandstone honeycomb facade with 953 jharokha windows.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "jaipur:amber-palace-fort": {
            "image_url": "/images/destinations/jaipur/illustration.jpg",
            "tier": "exact_place",
            "place_name": "Amber Fort & Maota Lake",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "visual_description": "Hilltop sandstone fortress reflected over Maota Lake with fortified mountain ramparts.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Goa
        "goa:palolem-beach-cove": {
            "image_url": "/images/destinations/goa/hero.jpg",
            "tier": "exact_place",
            "place_name": "Palolem Beach Crescent Cove",
            "destination": "Goa",
            "category": "Nature & Trails",
            "visual_description": "Curved white sand cove framed by coconut palms and calm turquoise waters.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "goa:fontainhas-latin-quarter": {
            "image_url": "/images/destinations/goa/illustration.jpg",
            "tier": "exact_place",
            "place_name": "Fontainhas Latin Heritage Quarter",
            "destination": "Goa",
            "category": "Culture & Heritage",
            "visual_description": "Pastel-painted Portuguese heritage houses with wrought-iron balconies and tiled street corners.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Leh
        "leh:thiksey-monastery-gompa": {
            "image_url": "/images/destinations/leh/hero.jpg",
            "tier": "exact_place",
            "place_name": "Thiksey Monastery Gompa",
            "destination": "Leh",
            "category": "Culture & Heritage",
            "visual_description": "Tiered Buddhist gompa crowning a desert hill resembling the Potala Palace.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "leh:pangong-lake-edge": {
            "image_url": "/images/destinations/leh/illustration.jpg",
            "tier": "exact_place",
            "place_name": "Pangong Tso Alpine Shore",
            "destination": "Leh",
            "category": "Nature & Trails",
            "visual_description": "Vibrant cobalt and turquoise saline lake mirroring stark Ladakhi mountain peaks.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Kasol
        "kasol:chalal-trail": {
            "image_url": "/images/destinations/kasol/hero.jpg",
            "tier": "exact_place",
            "place_name": "Chalal Pine Riverside Trail",
            "destination": "Kasol",
            "category": "Nature & Trails",
            "visual_description": "Suspended bridge path winding through deep deodar pine forest along the roaring river.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Dharamshala
        "dharamshala:namgyal-monastery": {
            "image_url": "/images/destinations/dharamshala/hero.jpg",
            "tier": "exact_place",
            "place_name": "Namgyal Monastery (Tsuglagkhang)",
            "destination": "Dharamshala",
            "category": "Culture & Heritage",
            "visual_description": "Dalai Lama monastery complex surrounded by cedar woods and prayer wheels.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "dharamshala:bhagsunag-waterfall": {
            "image_url": "/images/destinations/dharamshala/illustration.jpg",
            "tier": "exact_place",
            "place_name": "Bhagsunag Mountain Waterfall",
            "destination": "Dharamshala",
            "category": "Nature & Trails",
            "visual_description": "Mountain waterfall with bohemian cliffside cafe above Bhagsu village.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Spiti
        "spiti:key-monastery": {
            "image_url": "/images/destinations/spiti-valley/hero.jpg",
            "tier": "exact_place",
            "place_name": "Key Gompa (Kye Monastery)",
            "destination": "Spiti",
            "category": "Culture & Heritage",
            "visual_description": "Thousand-year-old fort-like Tibetan monastery in high-altitude cold desert.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "spiti:chandratal-lake": {
            "image_url": "/images/destinations/spiti-valley/hero.jpg",
            "tier": "exact_place",
            "place_name": "Chandratal Moon Lake",
            "destination": "Spiti",
            "category": "Nature & Trails",
            "visual_description": "Crescent-shaped glacial lake reflecting clear starlit high-altitude skies.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },

        # Munnar
        "munnar:kolukkumalai-tea": {
            "image_url": "/images/destinations/fallbacks/valley.jpg",
            "tier": "exact_place",
            "place_name": "Kolukkumalai High-Altitude Tea Estate",
            "destination": "Munnar",
            "category": "Nature & Trails",
            "visual_description": "World's highest tea plantation with sunrise cloud inversions over rolling green hills.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        },
        "munnar:eravikulam-park": {
            "image_url": "/images/destinations/fallbacks/valley.jpg",
            "tier": "exact_place",
            "place_name": "Eravikulam National Park",
            "destination": "Munnar",
            "category": "Nature & Trails",
            "visual_description": "Rolling shola grasslands home to the endangered Nilgiri Tahr and Anamudi peak.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork"
        }
    }

    DESTINATION_HEROES: Dict[str, Dict[str, str]] = {
        "manali": {"hero": "/images/destinations/manali/hero.jpg", "illustration": "/images/destinations/manali/illustration.jpg"},
        "mussoorie": {"hero": "/images/destinations/mussoorie/hero.jpg", "illustration": "/images/destinations/mussoorie/illustration.jpg"},
        "udaipur": {"hero": "/images/destinations/udaipur/hero.jpg", "illustration": "/images/destinations/udaipur/illustration.jpg"},
        "varanasi": {"hero": "/images/destinations/varanasi/hero.jpg", "illustration": "/images/destinations/varanasi/illustration.jpg"},
        "jaipur": {"hero": "/images/destinations/jaipur/hero.jpg", "illustration": "/images/destinations/jaipur/illustration.jpg"},
        "goa": {"hero": "/images/destinations/goa/hero.jpg", "illustration": "/images/destinations/goa/illustration.jpg"},
        "leh": {"hero": "/images/destinations/leh/hero.jpg", "illustration": "/images/destinations/leh/illustration.jpg"},
        "spiti": {"hero": "/images/destinations/spiti-valley/hero.jpg", "illustration": "/images/destinations/spiti-valley/illustration.jpg"},
        "rishikesh": {"hero": "/images/destinations/rishikesh/hero.jpg", "illustration": "/images/destinations/rishikesh/illustration.jpg"},
        "kasol": {"hero": "/images/destinations/kasol/hero.jpg", "illustration": "/images/destinations/kasol/illustration.jpg"},
        "dharamshala": {"hero": "/images/destinations/dharamshala/hero.jpg", "illustration": "/images/destinations/dharamshala/illustration.jpg"},
        "munnar": {"hero": "/images/destinations/fallbacks/valley.jpg", "illustration": "/images/destinations/fallbacks/valley.jpg"}
    }

    def _normalize_key(self, dest: str, place: str) -> str:
        d_clean = re.sub(r"[^a-z0-9]", "", (dest or "").lower())
        p_clean = re.sub(r"[^a-z0-9]", "-", (place or "").lower().strip("-"))
        p_clean = re.sub(r"-+", "-", p_clean)
        return f"{d_clean}:{p_clean}"

    async def resolve_place_artwork(
        self,
        place_name: str,
        destination_name: str,
        category: str,
        locality: Optional[str] = None
    ) -> Dict[str, Any]:
        dest_norm = re.sub(r"[^a-z0-9]", "", (destination_name or "").lower())
        place_norm = re.sub(r"[^a-z0-9]", "-", (place_name or "").lower().strip("-"))
        place_norm = re.sub(r"-+", "-", place_norm)
        
        # 1. Check Exact Place Artwork (scored by best match)
        best_exact_match = None
        best_score = 0
        for reg_key, item in self.PLACE_ARTWORK_REGISTRY.items():
            reg_dest, reg_place = reg_key.split(":")
            if reg_dest == dest_norm or reg_dest in dest_norm or dest_norm in reg_dest:
                score = 0
                if reg_place == place_norm:
                    score = 100
                elif reg_place in place_norm:
                    score = 80 + len(reg_place)
                elif place_norm in reg_place:
                    score = 60 + len(place_norm)
                else:
                    reg_toks = set(t for t in reg_place.split("-") if len(t) > 2)
                    place_toks = set(t for t in place_norm.split("-") if len(t) > 2)
                    overlap = reg_toks.intersection(place_toks)
                    if overlap:
                        generic_toks = {
                            "aarti", "temple", "trail", "waterfall", "point", "viewpoint",
                            "cove", "road", "lake", "palace", "fort", "cafe", "bakery",
                            "hill", "ridge", "view", "falls", "market", "bazaar", "shop",
                            "village", "quarter", "forest", "park", "shrine", "monastery",
                            "gompa", "mountain", "ancient", "heritage", "pine", "scenic", "stream"
                        }
                        distinctive = overlap - generic_toks
                        if distinctive:
                            score = 40 + sum(len(t) for t in distinctive)
                        elif len(overlap) >= 3:
                            score = 25 + len(overlap)

                if score > best_score:
                    best_score = score
                    best_exact_match = (reg_key, item)

        if best_exact_match and best_score >= 25:
            reg_key, item = best_exact_match
            return {
                "artwork_key": reg_key,
                "image_url": item["image_url"],
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "source": "curated_artwork",
                "is_real_photo": False,
                "art_style": "VANVAS editorial travel artwork",
                "badge": "VANVAS PLACE ARTWORK",
                "metadata": item
            }

        # 2. Destination + Category Artwork Fallback (uses dedicated category artwork if available)
        dest_key = dest_norm
        for k in self.DESTINATION_HEROES:
            if k in dest_norm or dest_norm in k:
                dest_key = k
                break

        cat_lower = (category or "").lower()
        cat_file = "viewpoint"
        if any(c in cat_lower for c in ["cafe", "bakery", "dining", "food", "restaurant", "dhaba"]):
            cat_file = "cafe"
        elif any(c in cat_lower for c in ["temple", "spiritual", "shrine", "ashram", "monastery", "ghat", "culture", "heritage"]):
            cat_file = "spiritual"
        elif any(c in cat_lower for c in ["waterfall", "trail", "nature", "forest", "lake", "river"]):
            cat_file = "nature"
        elif any(c in cat_lower for c in ["hotel", "stay", "resort", "homestay", "hostel", "cottage"]):
            cat_file = "stay"

        category_img = f"/images/places/{dest_key}/categories/{cat_file}.webp"

        if dest_key in self.DESTINATION_HEROES:
            return {
                "artwork_key": f"{dest_key}:category-{cat_file}",
                "image_url": category_img,
                "tier": "destination_category",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "source": "generated_artwork",
                "is_real_photo": False,
                "art_style": "VANVAS editorial category artwork",
                "badge": "DESTINATION CATEGORY ART",
                "metadata": {
                    "destination": destination_name,
                    "category": category,
                    "category_theme": cat_file,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "version": 1
                }
            }

        # 3. Regional / Universal Fallback
        fallback_img = "/images/destinations/fallbacks/himalayan.jpg"
        if any(w in dest_norm for w in ["beach", "goa", "kerala", "coast"]):
            fallback_img = "/images/destinations/fallbacks/coastal.jpg"
        elif any(w in dest_norm for w in ["desert", "jaipur", "rajasthan", "jodhpur"]):
            fallback_img = "/images/destinations/fallbacks/desert.jpg"
        elif any(w in dest_norm for w in ["river", "varanasi", "ganga"]):
            fallback_img = "/images/destinations/fallbacks/river_ghat.jpg"

        return {
            "artwork_key": f"regional:{dest_norm or 'himalayan'}",
            "image_url": fallback_img,
            "tier": "regional_fallback",
            "place_name": place_name,
            "destination": destination_name,
            "category": category,
            "source": "fallback",
            "is_real_photo": False,
            "art_style": "Regional Fallback Artwork",
            "badge": "REGIONAL ART",
            "metadata": {
                "destination": destination_name,
                "category": category,
                "resolved_at": datetime.now(timezone.utc).isoformat()
            }
        }

    async def get_artwork_metadata(self, artwork_key: str) -> Optional[Dict[str, Any]]:
        return self.PLACE_ARTWORK_REGISTRY.get(artwork_key)

class OptionalAIArtworkProvider(CuratedArtworkProvider):
    """
    Optional AI Artwork Provider supporting Groq text reasoning when configured,
    and inheriting full deterministic curated artwork resolution.
    """
    def __init__(self, groq_api_key: Optional[str] = None):
        super().__init__()
        self.groq_api_key = groq_api_key

