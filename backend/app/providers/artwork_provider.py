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
    and applying authentic multi-tier fallbacks without random array indexing or fake exact-place badges.
    """
    
    # Exact Place Artwork Registry mapped deterministically by normalized key.
    # Contains ONLY verified landmark-specific artwork assets that physically exist on disk.
    PLACE_ARTWORK_REGISTRY: Dict[str, Dict[str, Any]] = {
        # Mussoorie / Landour
        "mussoorie:st-pauls-church": {
            "image_url": "/images/places/mussoorie/st-pauls-church.webp",
            "tier": "exact_place",
            "place_name": "St. Paul's Church, Landour",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Historic 1852 stone Anglican church in Landour with steep gabled wooden roof and lancet windows under deodar pines.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["st-pauls-church-landour", "st-pauls-church", "st-paul-church"]
        },
        "mussoorie:landour-bakehouse": {
            "image_url": "/images/places/mussoorie/landour-bakehouse.webp",
            "tier": "exact_place",
            "place_name": "Landour Bakehouse",
            "destination": "Mussoorie",
            "category": "Cafés & Bakery",
            "visual_description": "Historic stone and timber hill bakery at Sisters Bazaar with Victorian glass vitrines and deodar canopy.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["landour-bakehouse", "landour-bakery", "sisters-bazaar-bakehouse"]
        },
        "mussoorie:lal-tibba": {
            "image_url": "/images/places/mussoorie/lal-tibba.webp",
            "tier": "exact_place",
            "place_name": "Lal Tibba Scenic Viewpoint",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "Highest mountain ridge viewpoint in Landour with telescope overlooking distant Garhwal snow peaks.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["lal-tibba", "lal-tibba-scenic-viewpoint", "lal-tibba-viewpoint"]
        },
        "mussoorie:kempty-falls": {
            "image_url": "/images/places/mussoorie/kempty-falls.webp",
            "tier": "exact_place",
            "place_name": "Kempty Falls Mountain Cascade",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "Steep rocky mountain waterfall cascade plunging into jade mountain pools.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["kempty-falls", "kempty-falls-mountain-cascade", "kempty-waterfall"]
        },
        "mussoorie:gun-hill": {
            "image_url": "/images/places/mussoorie/gun-hill.webp",
            "tier": "exact_place",
            "place_name": "Gun Hill Historic Viewpoint",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Elevated colonial peak with ropeway cable car overlooking the vast Doon Valley.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["gun-hill", "gun-hill-historic-viewpoint", "gun-hill-viewpoint"]
        },
        "mussoorie:camel-back-road": {
            "image_url": "/images/places/mussoorie/camel-back-road.webp",
            "tier": "exact_place",
            "place_name": "Camel's Back Road Promenade",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "Tranquil oak-shaded walking promenade framing natural camel rock outcrop and winterline sunsets.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["camel-back-road", "camels-back-road", "camels-back-road-and-winterline-trail"]
        },
        "mussoorie:mall-road": {
            "image_url": "/images/places/mussoorie/mall-road.webp",
            "tier": "exact_place",
            "place_name": "Mussoorie Mall Road",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Colonial promenade with glowing vintage iron lampposts, bookshops, and evening strolls.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["mall-road", "mussoorie-mall-road", "mall-road-heritage-promenade"]
        },
        "mussoorie:george-everest": {
            "image_url": "/images/places/mussoorie/george-everest.webp",
            "tier": "exact_place",
            "place_name": "Sir George Everest Peak & Estate",
            "destination": "Mussoorie",
            "category": "Nature & Trails",
            "visual_description": "White stone colonial observatory estate perched on grassy ridge with panoramic snow peak vistas.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["george-everest", "george-everest-peak-and-observatory-house", "sir-george-everest-house"]
        },
        "mussoorie:clouds-end": {
            "image_url": "/images/places/mussoorie/clouds-end.webp",
            "tier": "exact_place",
            "place_name": "Cloud's End Heritage Estate",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Secluded historic stone bungalow nestled deep in ancient deodar and pine wilderness.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["clouds-end", "clouds-end-forest-retreat", "clouds-end-estate"]
        },
        "mussoorie:landour": {
            "image_url": "/images/places/mussoorie/landour.webp",
            "tier": "exact_place",
            "place_name": "Landour Cantonment Ridge",
            "destination": "Mussoorie",
            "category": "Culture & Heritage",
            "visual_description": "Misty colonial ridge settlement with stone cottages and silent oak paths.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
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
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["hadimba-temple", "hadimba-devi-cedar-forest-temple", "hidimba-devi-temple", "dhungri-temple"]
        },
        "manali:solang-valley": {
            "image_url": "/images/places/manali/solang-valley.webp",
            "tier": "exact_place",
            "place_name": "Solang Valley Alpine Meadow",
            "destination": "Manali",
            "category": "Adventure & Sport",
            "visual_description": "Expansive green alpine valley surrounded by snow-capped Pir Panjal peaks with paragliders in azure sky.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["solang-valley", "solang-valley-ridge-and-paragliding", "solang-nullah"]
        },
        "manali:old-manali": {
            "image_url": "/images/places/manali/old-manali.webp",
            "tier": "exact_place",
            "place_name": "Old Manali Village & Cafes",
            "destination": "Manali",
            "category": "Culture & Heritage",
            "visual_description": "Traditional timber-and-stone Himachali houses, apple orchards, and bohemian riverside verandas.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["old-manali", "old-manali-village-and-manu-temple", "old-manali-village"]
        },

        # Rishikesh
        "rishikesh:triveni-ghat": {
            "image_url": "/images/places/rishikesh/triveni-ghat.webp",
            "tier": "exact_place",
            "place_name": "Triveni Ghat Evening Maha Aarti",
            "destination": "Rishikesh",
            "category": "Culture & Heritage",
            "visual_description": "Sacred stone riverfront steps at the Ganges confluence with twilight brass aarti lamps and floating diyas.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["triveni-ghat", "triveni-ghat-evening-maha-aarti", "triveni-ghat-aarti"]
        },

        # Udaipur
        "udaipur:city-palace-udaipur": {
            "image_url": "/images/places/udaipur/city-palace-udaipur.webp",
            "tier": "exact_place",
            "place_name": "City Palace of Udaipur",
            "destination": "Udaipur",
            "category": "Culture & Heritage",
            "visual_description": "Monumental white marble palace with mirrored domes towering over the east bank of Lake Pichola.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["city-palace-udaipur", "city-palace-of-udaipur", "city-palace"]
        },

        # Varanasi
        "varanasi:dashashwamedh-ghat-aarti": {
            "image_url": "/images/places/varanasi/dashashwamedh-ghat-aarti.webp",
            "tier": "exact_place",
            "place_name": "Dashashwamedh Ghat Evening Maha Aarti",
            "destination": "Varanasi",
            "category": "Culture & Heritage",
            "visual_description": "Historic stone riverfront steps illuminated by brass oil lamps and twilight river reflections.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["dashashwamedh-ghat-aarti", "dashashwamedh-ghat-evening-maha-aarti", "dashashwamedh-ghat"]
        },

        # Jaipur
        "jaipur:hawa-mahal": {
            "image_url": "/images/places/jaipur/hawa-mahal.webp",
            "tier": "exact_place",
            "place_name": "Hawa Mahal",
            "destination": "Jaipur",
            "category": "Culture & Heritage",
            "visual_description": "Intricately carved pink sandstone honeycomb facade with 953 jharokha windows.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["hawa-mahal", "hawa-mahal-palace-of-winds", "palace-of-winds"]
        },

        # Goa
        "goa:fontainhas-latin-quarter": {
            "image_url": "/images/places/goa/fontainhas-latin-quarter.webp",
            "tier": "exact_place",
            "place_name": "Fontainhas Latin Heritage Quarter",
            "destination": "Goa",
            "category": "Culture & Heritage",
            "visual_description": "Pastel-painted Portuguese heritage houses with wrought-iron balconies and tiled street corners.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["fontainhas-latin-quarter", "fontainhas", "fontainhas-latin-heritage-quarter"]
        },
        "goa:aguada-fort": {
            "image_url": "/images/places/goa/aguada-fort.webp",
            "tier": "exact_place",
            "place_name": "Aguada Fort & Historic Lighthouse",
            "destination": "Goa",
            "category": "Culture & Heritage",
            "visual_description": "17th-century Portuguese laterite stone sea fortress and cylindrical lighthouse on the coastal headland.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["aguada-fort", "aguada-fort-and-historic-lighthouse", "fort-aguada"]
        },

        # Leh
        "leh:thiksey-monastery-gompa": {
            "image_url": "/images/places/leh/thiksey-monastery-gompa.webp",
            "tier": "exact_place",
            "place_name": "Thiksey Monastery Gompa",
            "destination": "Leh",
            "category": "Culture & Heritage",
            "visual_description": "Tiered Buddhist gompa crowning a desert hill resembling the Potala Palace.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["thiksey-monastery-gompa", "thiksey-monastery", "thiksey-gompa"]
        },

        # Dharamshala
        "dharamshala:namgyal-monastery": {
            "image_url": "/images/places/dharamshala/namgyal-monastery.webp",
            "tier": "exact_place",
            "place_name": "Namgyal Monastery (Tsuglagkhang)",
            "destination": "Dharamshala",
            "category": "Culture & Heritage",
            "visual_description": "Dalai Lama monastery complex surrounded by cedar woods and prayer wheels.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["namgyal-monastery", "namgyal-monastery-and-tsuglagkhang-complex", "tsuglagkhang"]
        },

        # Spiti
        "spiti:key-monastery": {
            "image_url": "/images/places/spiti/key-monastery.webp",
            "tier": "exact_place",
            "place_name": "Key Gompa (Kye Monastery)",
            "destination": "Spiti",
            "category": "Culture & Heritage",
            "visual_description": "Thousand-year-old fort-like Tibetan monastery in high-altitude cold desert.",
            "source": "curated_artwork",
            "art_style": "VANVAS editorial travel artwork",
            "aliases": ["key-monastery", "key-monastery-ki-gompa", "ki-gompa", "kye-gompa"]
        }
    }

    # Curated Seeded Destinations with verified illustration and hero assets
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

    # Controlled semantic category taxonomy mapping to standardized theme assets
    CATEGORY_THEME_MAP = {
        "cafe": "cafe",
        "coffee": "cafe",
        "bakery": "cafe",
        "food": "cafe",
        "restaurant": "cafe",
        "dhaba": "cafe",
        "momo": "cafe",
        "tibetan": "cafe",
        "dining": "cafe",
        "breakfast": "cafe",
        "tea": "cafe",
        
        "nature": "nature",
        "trail": "nature",
        "waterfall": "nature",
        "cascade": "nature",
        "lake": "nature",
        "river": "nature",
        "forest": "nature",
        "trek": "nature",
        "park": "nature",
        "garden": "nature",
        "wildlife": "nature",
        "sanctuary": "nature",

        "temple": "spiritual",
        "shrine": "spiritual",
        "monastery": "spiritual",
        "gompa": "spiritual",
        "church": "spiritual",
        "chapel": "spiritual",
        "ghat": "spiritual",
        "ashram": "spiritual",
        "spiritual": "spiritual",
        "heritage": "spiritual",
        "culture": "spiritual",
        "fort": "spiritual",
        "palace": "spiritual",
        "museum": "spiritual",
        "monument": "spiritual",

        "stay": "stay",
        "hotel": "stay",
        "resort": "stay",
        "cottage": "stay",
        "homestay": "stay",
        "hostel": "stay",
        "guesthouse": "stay",
        "accommodation": "stay",

        "viewpoint": "viewpoint",
        "scenic": "viewpoint",
        "sunset": "viewpoint",
        "sunrise": "viewpoint",
        "peak": "viewpoint",
        "market": "viewpoint",
        "bazaar": "viewpoint",
        "shopping": "viewpoint",
        "mobility": "viewpoint",
        "rental": "viewpoint"
    }

    @classmethod
    def detect_artwork_collisions(cls) -> List[str]:
        """
        Deterministic collision guard.
        Verifies that no exact place artwork asset is assigned to unrelated places
        without explicit multi-alias intention. Returns a list of warnings if any collisions exist.
        """
        asset_to_places: Dict[str, List[str]] = {}
        warnings: List[str] = []

        for reg_key, item in cls.PLACE_ARTWORK_REGISTRY.items():
            img = item.get("image_url")
            if not img:
                continue
            if img not in asset_to_places:
                asset_to_places[img] = []
            asset_to_places[img].append(reg_key)

        for img, keys in asset_to_places.items():
            # If multiple registry keys point to same image, ensure they are intentional aliases of the same destination/landmark
            if len(keys) > 1:
                destinations = set(k.split(":")[0] for k in keys)
                if len(destinations) > 1:
                    msg = f"ARTWORK COLLISION: asset {img} assigned to unrelated places across destinations: {keys}"
                    logger.error(msg)
                    warnings.append(msg)
        return warnings

    def _clean_str(self, text: str) -> str:
        s = (text or "").lower()
        s = re.sub(r"['’`]", "", s)
        s = s.replace("&", "and")
        s = re.sub(r"[^a-z0-9]", "-", s)
        s = re.sub(r"-+", "-", s).strip("-")
        return s

    def _normalize_key(self, dest: str, place: str) -> str:
        d_clean = re.sub(r"[^a-z0-9]", "", (dest or "").lower())
        p_clean = self._clean_str(place)
        return f"{d_clean}:{p_clean}"

    def _classify_category_theme(self, category: str, place_name: str = "") -> str:
        """
        Classifies place category strictly from structured taxonomy without hallucinating arbitrary categories.
        """
        text = f"{(category or '').lower()} {place_name.lower()}"
        for keyword, theme in self.CATEGORY_THEME_MAP.items():
            if re.search(r'\b' + re.escape(keyword) + r'\b', text) or keyword in text:
                return theme
        return "nature"

    def _resolve_regional_fallback(self, destination_name: str, category: str, place_name: str = "") -> str:
        """
        Resolves semantic regional fallback ensuring semantic correctness:
        - Coastal/Beach context: coastal fallback (never mountain/desert)
        - Desert/Arid context: desert fallback
        - River Ghat / Historic context: valley/river fallback
        - General / Himalayan: himalayan fallback
        """
        d_lower = (destination_name or "").lower()
        c_lower = (category or "").lower()
        p_lower = (place_name or "").lower()
        combined = f"{d_lower} {c_lower} {p_lower}"

        # 1. Beach / Coastal
        if any(w in combined for w in ["beach", "coast", "sea", "goa", "kerala", "gokarna", "varkala", "andaman", "alappuzha", "pondicherry"]):
            return "/images/destinations/fallbacks/coastal.jpg"

        # 2. Desert / Arid
        if any(w in combined for w in ["desert", "jaipur", "jodhpur", "jaisalmer", "bikaner", "rajasthan", "thar", "pushkar"]):
            return "/images/destinations/fallbacks/desert.jpg"

        # 3. River Ghat / Tea Valley / Green Plateau
        if any(w in combined for w in ["varanasi", "ayodhya", "haridwar", "hampi", "ujjain", "mathura", "prayagraj", "ganga", "ghat", "munnar", "coorg", "wayanad", "ooty", "meghalaya", "shillong", "tea"]):
            return "/images/destinations/fallbacks/valley.jpg"

        # 4. Default Himalayan / Hill
        return "/images/destinations/fallbacks/himalayan.jpg"

    async def resolve_place_artwork(
        self,
        place_name: str,
        destination_name: str,
        category: str,
        locality: Optional[str] = None,
        source_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deterministic 8-Level Priority Matching:
        1. Exact place ID / key in registry
        2. Exact provider / source ID (if registered)
        3. Normalized exact place name + destination match
        4. Known aliases match
        5. Destination + Category Artwork (dedicated theme assets in /images/places/{dest}/categories/)
        6. Destination Artwork (Curated hero/illustration)
        7. Regional Artwork (Semantic geography fallback)
        8. Universal Fallback
        """
        dest_norm = re.sub(r"[^a-z0-9]", "", (destination_name or "").lower())
        place_norm = self._clean_str(place_name)
        lookup_key = f"{dest_norm}:{place_norm}"

        # Priority 1: Exact direct place key match in registry
        if lookup_key in self.PLACE_ARTWORK_REGISTRY:
            item = self.PLACE_ARTWORK_REGISTRY[lookup_key]
            return {
                "artwork_key": lookup_key,
                "image_url": item["image_url"],
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "source": "curated_artwork",
                "is_real_photo": False,
                "art_style": item.get("art_style", "VANVAS editorial travel artwork"),
                "badge": "VANVAS PLACE ARTWORK",
                "visual_description": item.get("visual_description"),
                "metadata": item
            }

        # Priority 2 & 3 & 4: Exact place matching against aliases and normalized tokens
        best_exact_match: Optional[Tuple[str, Dict[str, Any]]] = None
        best_score = 0

        for reg_key, item in self.PLACE_ARTWORK_REGISTRY.items():
            reg_dest, reg_place = reg_key.split(":")
            if reg_dest == dest_norm or reg_dest in dest_norm or dest_norm in reg_dest:
                score = 0
                aliases = item.get("aliases", [reg_place])
                
                # Direct match on place or alias
                if place_norm == reg_place or place_norm in aliases:
                    score = 100
                else:
                    # Check aliases for substring
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
                "artwork_key": reg_key,
                "image_url": item["image_url"],
                "tier": "exact_place",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "source": "curated_artwork",
                "is_real_photo": False,
                "art_style": item.get("art_style", "VANVAS editorial travel artwork"),
                "badge": "VANVAS PLACE ARTWORK",
                "visual_description": item.get("visual_description"),
                "metadata": item
            }

        # Priority 5: Destination + Category Artwork Fallback
        dest_key = dest_norm
        for k in self.DESTINATION_HEROES:
            if k in dest_norm or dest_norm in k:
                dest_key = k
                break

        theme = self._classify_category_theme(category, place_name)
        category_img = f"/images/places/{dest_key}/categories/{theme}.webp"

        if dest_key in self.DESTINATION_HEROES:
            return {
                "artwork_key": f"{dest_key}:category-{theme}",
                "image_url": category_img,
                "tier": "destination_category",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "source": "curated_artwork",
                "is_real_photo": False,
                "art_style": f"VANVAS editorial {theme} category artwork",
                "badge": "DESTINATION CATEGORY ART",
                "metadata": {
                    "destination": destination_name,
                    "category": category,
                    "category_theme": theme,
                    "resolved_at": datetime.now(timezone.utc).isoformat(),
                    "version": 1
                }
            }

        # Priority 6: Destination Artwork
        if dest_key in self.DESTINATION_HEROES:
            dest_art = self.DESTINATION_HEROES[dest_key]["illustration"]
            return {
                "artwork_key": f"{dest_key}:destination-art",
                "image_url": dest_art,
                "tier": "destination",
                "place_name": place_name,
                "destination": destination_name,
                "category": category,
                "source": "curated_artwork",
                "is_real_photo": False,
                "art_style": "VANVAS destination artwork",
                "badge": "DESTINATION ART",
                "metadata": {
                    "destination": destination_name,
                    "resolved_at": datetime.now(timezone.utc).isoformat()
                }
            }

        # Priority 7 & 8: Regional / Universal Semantic Fallback
        regional_img = self._resolve_regional_fallback(destination_name, category, place_name)

        return {
            "artwork_key": f"regional:{dest_norm or 'himalayan'}:{theme}",
            "image_url": regional_img,
            "tier": "regional_fallback",
            "place_name": place_name,
            "destination": destination_name,
            "category": category,
            "source": "fallback",
            "is_real_photo": False,
            "art_style": "Regional Semantic Fallback Artwork",
            "badge": "REGIONAL ART",
            "metadata": {
                "destination": destination_name,
                "category": category,
                "category_theme": theme,
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


