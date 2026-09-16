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
        provider_name = (settings.AI_PROVIDER or "disabled").lower().strip()
        
        if provider_name == "gemini":
            return GeminiProvider(
                api_key=settings.GEMINI_API_KEY,
                model=settings.GEMINI_MODEL
            )
        
        return DisabledAIProvider()
