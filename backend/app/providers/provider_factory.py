from app.core.config import settings
from app.providers.base import (
    WeatherProvider, TransportProvider, HotelsProvider,
    RentalsProvider, PlacesProvider, RoutingProvider,
    GeocodingProvider, ImageProvider, CreativeArtProvider,
    WebSearchProvider, ArtworkProvider
)
from app.providers.demo_providers import (
    DemoWeatherProvider, DemoTransportProvider, DemoHotelsProvider,
    DemoRentalsProvider, DemoPlacesProvider, DemoRoutingProvider
)
from app.providers.live_providers import (
    LiveWeatherProvider, LivePlacesProvider, LiveImageProvider,
    HaversineRoutingProvider, LiveHotelsProvider, LiveRentalsProvider
)
from app.providers.geocoding_provider import LiveGeocodingProvider
from app.providers.web_search_provider import LiveWebSearchProvider
from app.providers.creative_art_provider import CuratedCreativeArtProvider, OpenAICreativeArtProvider
from app.providers.artwork_provider import CuratedArtworkProvider, OptionalAIArtworkProvider

class ProviderFactory:
    @staticmethod
    def get_artwork_provider() -> ArtworkProvider:
        return OptionalAIArtworkProvider(groq_api_key=getattr(settings, "GROQ_API_KEY", ""))
    @staticmethod
    def get_geocoding_provider() -> GeocodingProvider:
        return LiveGeocodingProvider()

    @staticmethod
    def get_weather_provider() -> WeatherProvider:
        # Open-Meteo live provider does not require an API key and provides real global & Indian forecasts
        return LiveWeatherProvider(api_key=settings.WEATHER_API_KEY)

    @staticmethod
    def get_places_provider() -> PlacesProvider:
        return LivePlacesProvider(api_key=settings.GOOGLE_PLACES_API_KEY or settings.PLACES_API_KEY)

    @staticmethod
    def get_web_search_provider() -> WebSearchProvider:
        return LiveWebSearchProvider(
            api_key=settings.WEB_SEARCH_API_KEY,
            provider=settings.WEB_SEARCH_PROVIDER
        )

    @staticmethod
    def get_image_provider() -> ImageProvider:
        return LiveImageProvider()

    @staticmethod
    def get_transport_provider() -> TransportProvider:
        return DemoTransportProvider()

    @staticmethod
    def get_hotels_provider() -> HotelsProvider:
        return LiveHotelsProvider(api_key=settings.GOOGLE_PLACES_API_KEY or settings.PLACES_API_KEY)

    @staticmethod
    def get_rentals_provider() -> RentalsProvider:
        return LiveRentalsProvider(api_key=settings.GOOGLE_PLACES_API_KEY or settings.PLACES_API_KEY)

    @staticmethod
    def get_routing_provider() -> RoutingProvider:
        return HaversineRoutingProvider()

    @staticmethod
    def get_creative_art_provider() -> CreativeArtProvider:
        provider_type = (settings.IMAGE_PROVIDER or "curated").lower().strip()
        if provider_type == "openai":
            return OpenAICreativeArtProvider(
                api_key=settings.OPENAI_API_KEY,
                model=settings.IMAGE_GENERATION_MODEL,
                output_dir=settings.IMAGE_OUTPUT_DIR,
                image_format=settings.IMAGE_FORMAT
            )
        return CuratedCreativeArtProvider()

    @staticmethod
    def get_provider_health():
        from app.services.provider_health_tracker import health_tracker
        return health_tracker.get_provider_health_summary()

