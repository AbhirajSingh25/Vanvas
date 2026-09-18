"""
Factory for instantiating AI / LLM Providers.
"""
from app.core.config import settings
from app.providers.ai.base import AIProvider
from app.providers.ai.gemini_provider import GeminiProvider, DisabledAIProvider


class AIFactory:
    """Factory to obtain the configured AI LLM provider."""

    @staticmethod
    def get_provider() -> AIProvider:
        provider_name = (settings.AI_PROVIDER or "gemini").lower().strip()
        
        # In VANVAS architecture, the standard free-first AI provider is Google Gemini.
        # "gemini", "default", "auto", "google" all resolve to GeminiProvider.
        if provider_name in ("gemini", "default", "auto", "google"):
            return GeminiProvider(
                api_key=settings.GEMINI_API_KEY,
                model=settings.GEMINI_MODEL or "gemini-3.5-flash-lite"
            )
        
        return DisabledAIProvider()
