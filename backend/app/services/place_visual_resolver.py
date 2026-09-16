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
        locality: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Resolves place visual identity adhering to the multi-tier hierarchy:
        1. Exact Place Artwork
        2. Destination + Category Artwork
        3. Destination Hero/Illustration
        4. Regional / Universal Fallback
        """
        provider = ProviderFactory.get_artwork_provider()
        res = await provider.resolve_place_artwork(
            place_name=place_name,
            destination_name=destination_name,
            category=category,
            locality=locality
        )
        return res

    @staticmethod
    async def get_metadata(artwork_key: str) -> Optional[Dict[str, Any]]:
        provider = ProviderFactory.get_artwork_provider()
        return await provider.get_artwork_metadata(artwork_key)
