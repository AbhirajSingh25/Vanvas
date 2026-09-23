import logging
from typing import Dict, Any, Optional
from app.providers.provider_factory import ProviderFactory

logger = logging.getLogger("vanvas.visual_resolver")

class PlaceVisualResolverService:
    @staticmethod
    async def resolve_place(
        place_name: str,
        destination_name: str,
        category: str,
        locality: Optional[str] = None,
        existing_image_url: Optional[str] = None,
        is_live: Optional[bool] = None,
        source: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Resolves place visual identity adhering to the multi-tier hierarchy:
        1. Verified Real Provider/External Photo
        2. Exact Place Artwork
        3. Destination + Category Artwork
        4. Universal Semantic Fallback
        """
        provider = ProviderFactory.get_artwork_provider()
        res = await provider.resolve_place_artwork(
            place_name=place_name,
            destination_name=destination_name,
            category=category,
            locality=locality,
            existing_image_url=existing_image_url,
            is_live=is_live,
            source=source
        )
        return res

    @staticmethod
    async def get_metadata(artwork_key: str) -> Optional[Dict[str, Any]]:
        provider = ProviderFactory.get_artwork_provider()
        return await provider.get_artwork_metadata(artwork_key)
