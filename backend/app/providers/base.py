from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class GeocodingProvider(ABC):
    @abstractmethod
    async def geocode(self, query: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def autocomplete(self, query: str, limit: int = 6) -> List[Dict[str, Any]]:
        pass

class PlacesProvider(ABC):
    @abstractmethod
    async def search_places(self, query: str, destination_name: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_nearby_places(self, lat: float, lng: float, radius_km: float = 5.0, category: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

class WeatherProvider(ABC):
    @abstractmethod
    async def get_forecast(self, lat: float, lng: float, days: int = 5) -> List[Dict[str, Any]]:
        pass

class TransportProvider(ABC):
    @abstractmethod
    async def search_routes(self, origin: str, destination: str, travel_date: str) -> List[Dict[str, Any]]:
        pass

class HotelsProvider(ABC):
    @abstractmethod
    async def search_hotels(self, destination: str, check_in: str, check_out: str, budget_tier: str) -> List[Dict[str, Any]]:
        pass

class RentalsProvider(ABC):
    @abstractmethod
    async def search_rentals(self, destination: str, vehicle_type: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

class RoutingProvider(ABC):
    @abstractmethod
    def calculate_distance_matrix(self, points: List[Dict[str, float]]) -> List[List[Dict[str, Any]]]:
        pass

class ImageProvider(ABC):
    @abstractmethod
    async def search_images(self, query: str, limit: int = 3) -> List[str]:
        pass

class CreativeArtProvider(ABC):
    @abstractmethod
    async def generate_destination_art(
        self,
        destination_name: str,
        slug: str,
        terrain_type: str,
        visual_role: str = "illustration",
        aspect_ratio: str = "wide",
        state: Optional[str] = None,
        elevation_meters: Optional[int] = None,
        auto_promote: bool = False
    ) -> Dict[str, Any]:
        pass

class WebSearchProvider(ABC):
    @abstractmethod
    async def search_travel_web(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """
        Searches web information for current travel events, road status, passes, advisories.
        Returns structured results:
        {
            "query": str,
            "is_available": bool,
            "source": str,
            "results": List[Dict[str, Any]],
            "summary": Optional[str],
            "message": Optional[str]
        }
        """
        pass

class ArtworkProvider(ABC):
    @abstractmethod
    async def resolve_place_artwork(
        self,
        place_name: str,
        destination_name: str,
        category: str,
        locality: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Resolves place-specific artwork following multi-tier fallback hierarchy:
        EXACT PLACE ARTWORK -> DESTINATION + CATEGORY -> DESTINATION -> REGIONAL -> UNIVERSAL FALLBACK
        """
        pass

    @abstractmethod
    async def get_artwork_metadata(self, artwork_key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves structured metadata brief for a stored artwork.
        """
        pass

class PlaceArtworkGenerationProvider(ABC):
    """
    Provider abstraction for AI place artwork generation (e.g. Gemini).
    Generates editorial place-specific illustrations from factual visual briefs and verified references.
    """
    @abstractmethod
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
        pass

    @abstractmethod
    def validate_artwork(self, file_path: str, expected_key: str) -> bool:
        pass

    @abstractmethod
    def format_visual_fact_sheet(
        self,
        place_name: str,
        destination_slug: str,
        category: str,
        locality: Optional[str] = None,
        source: str = "osm"
    ) -> Dict[str, Any]:
        pass



