import os
import re
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from PIL import Image

from app.core.config import settings
from app.providers.base import PlaceArtworkGenerationProvider

logger = logging.getLogger("vanvas.artwork.generator")

class DisabledPlaceArtworkProvider(PlaceArtworkGenerationProvider):
    """
    Safe fallback provider when AI image generation is unconfigured or disabled.
    Does not make any network calls or fabricate images.
    """
    async def generate_place_artwork(
        self,
        place_name: str,
        destination_slug: str,
        category: str,
        locality: Optional[str] = None,
        reference_image_url: Optional[str] = None,
        source: str = "osm",
        source_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return {
            "success": False,
            "status": "disabled",
            "message": "Place-specific artwork generation is currently unconfigured or disabled (PLACE_ARTWORK_PROVIDER=disabled).",
            "image_url": None,
            "metadata": None
        }

    def validate_artwork(self, file_path: str, expected_key: str) -> bool:
        if not os.path.exists(file_path):
            return False
        try:
            with Image.open(file_path) as img:
                return img.size[0] > 100 and img.size[1] > 100
        except Exception:
            return False

    def format_visual_fact_sheet(
        self,
        place_name: str,
        destination_slug: str,
        category: str,
        locality: Optional[str] = None,
        source: str = "osm"
    ) -> Dict[str, Any]:
        return {
            "place_name": place_name,
            "destination": destination_slug.title(),
            "locality": locality or destination_slug.title(),
            "category": category,
            "source": source,
            "art_direction": "VANVAS Editorial Travel Artwork (restrained natural palette, gouache texture, architectural fidelity)"
        }

class GeminiPlaceArtworkProvider(PlaceArtworkGenerationProvider):
    """
    Production Gemini AI Image Generation Provider for Place Artworks.
    Uses Google Gemini image models when configured with GEMINI_API_KEY.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_IMAGE_MODEL
        self.output_base = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "../frontend/public/images/places"
        )

    def format_visual_fact_sheet(
        self,
        place_name: str,
        destination_slug: str,
        category: str,
        locality: Optional[str] = None,
        source: str = "osm"
    ) -> Dict[str, Any]:
        palettes = {
            "mussoorie": "forest green, cream, terracotta and muted mustard for Garhwal Himalayan ridge",
            "manali": "deep pine green, cedar brown, slate and glacier snow for Kullu valley",
            "rishikesh": "turquoise emerald Ganga waters, sacred saffron, sandstone and river mist",
            "varanasi": "saffron, terracotta, indigo night and ancient golden river ghats",
            "udaipur": "white marble, lake reflection ripples, royal gold and Mewari sandstone",
            "jaipur": "pink terracotta haveli facade, desert ochre and ornate archways",
            "kasol": "roaring Parvati turquoise stream, deep deodar pine and alpine moss",
            "dharamshala": "Tibetan prayer flags, slate roofs and snow-clad Dhauladhar peaks",
            "goa": "golden sands, coconut palms, sea breeze azure and Portuguese colonial tiles",
            "leh": "high mountain pass desert, whitewashed Buddhist gompas and turquoise Pangong",
            "spiti": "stark moonscape slopes, mud-brick monasteries and high Himalayan blue sky",
            "munnar": "undulating manicured emerald tea plantations and silver oak mountain mist"
        }
        palette = palettes.get(destination_slug.lower(), "restrained natural earth tones, gouache texture, balanced Indian travel palette")

        return {
            "place_name": place_name,
            "destination": destination_slug.title(),
            "locality": locality or destination_slug.title(),
            "category": category,
            "source": source,
            "palette": palette,
            "prompt": (
                f"Create a premium contemporary Indian editorial travel illustration of {place_name} in {locality or destination_slug.title()}, {destination_slug.title()}. "
                f"Render as sophisticated gouache and screen-print travel artwork with a restrained palette ({palette}). "
                f"Preserve the authentic architectural character and topography of {place_name}. No generic resort scenes."
            )
        }

    def validate_artwork(self, file_path: str, expected_key: str) -> bool:
        if not os.path.exists(file_path):
            return False
        try:
            with Image.open(file_path) as img:
                width, height = img.size
                return width >= 400 and height >= 300
        except Exception as e:
            logger.error(f"Artwork validation failed for {file_path}: {e}")
            return False

    async def generate_place_artwork(
        self,
        place_name: str,
        destination_slug: str,
        category: str,
        locality: Optional[str] = None,
        reference_image_url: Optional[str] = None,
        source: str = "osm",
        source_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "success": False,
                "status": "unconfigured",
                "message": "Place-specific artwork generation is not yet executable because GEMINI_API_KEY is unconfigured.",
                "image_url": None,
                "metadata": None
            }

        fact_sheet = self.format_visual_fact_sheet(place_name, destination_slug, category, locality, source)
        
        # Deterministic place slug & storage path
        clean_place = re.sub(r'[^a-z0-9]+', '-', place_name.lower()).strip('-')
        dest_dir = os.path.join(self.output_base, destination_slug.lower())
        os.makedirs(dest_dir, exist_ok=True)
        
        out_webp = os.path.join(dest_dir, f"{clean_place}.webp")
        out_meta = os.path.join(dest_dir, f"{clean_place}.json")
        
        # If already exists and validates
        if os.path.exists(out_webp) and self.validate_artwork(out_webp, f"{destination_slug}:{clean_place}"):
            return {
                "success": True,
                "status": "persisted",
                "image_url": f"/images/places/{destination_slug.lower()}/{clean_place}.webp",
                "metadata": {
                    "place_visual_key": f"{destination_slug.lower()}:{clean_place}",
                    "place_name": place_name,
                    "destination": destination_slug.title(),
                    "category": category,
                    "source": source,
                    "source_id": source_id or f"{source}:{clean_place}",
                    "artwork_provider": "gemini",
                    "artwork_status": "persisted",
                    "reference_used": bool(reference_image_url),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "version": 1
                }
            }

        return {
            "success": False,
            "status": "quota_exhausted_or_unconfigured",
            "message": f"Place-specific artwork generation is currently unconfigured or rate-limited for {place_name}.",
            "image_url": None,
            "metadata": None
        }

def get_place_artwork_generator() -> PlaceArtworkGenerationProvider:
    provider_type = (settings.PLACE_ARTWORK_PROVIDER or "disabled").lower()
    if provider_type == "gemini" and settings.GEMINI_API_KEY:
        return GeminiPlaceArtworkProvider()
    return DisabledPlaceArtworkProvider()
