"""
Google Gemini LLM Provider & Disabled AI Provider Implementation.
Leverages Google Gemini 1.5 Flash (Free Tier) with zero OpenAI dependencies.
"""
import logging
import httpx
from typing import Dict, Any, List, Optional
from app.providers.ai.base import AIProvider

logger = logging.getLogger(__name__)


class DisabledAIProvider(AIProvider):
    """Fallback provider when AI features are disabled."""

    def __init__(self):
        super().__init__(name="disabled", model="none", is_enabled=False)

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "disabled",
            "provider": self.name,
            "model": self.model,
            "is_enabled": False,
            "message": "AI Provider is disabled by configuration (AI_PROVIDER=disabled). Pure deterministic mode active.",
        }

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_output_tokens: int = 1024,
    ) -> Dict[str, Any]:
        return {
            "text": "AI assistance is currently disabled in system configuration.",
            "provider": self.name,
            "model": self.model,
            "is_enabled": False,
            "tool_calls": None,
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        }


class GeminiProvider(AIProvider):
    """
    Google Gemini AI Provider utilizing the Gemini REST API.
    Designed for free-tier usage (e.g. gemini-1.5-flash / gemini-1.5-pro).
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, api_key: str = "", model: str = "gemini-1.5-flash"):
        clean_key = (api_key or "").strip()
        is_enabled = bool(clean_key)
        super().__init__(name="gemini", model=model, is_enabled=is_enabled)
        self.api_key = clean_key

    async def health_check(self) -> Dict[str, Any]:
        """Check connection to the Gemini API."""
        if not self.api_key:
            return {
                "status": "unconfigured",
                "provider": self.name,
                "model": self.model,
                "is_enabled": False,
                "message": "GEMINI_API_KEY is not configured in environment.",
            }

        url = f"{self.BASE_URL}/models/{self.model}?key={self.api_key}"
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    display_name = data.get("displayName", self.model)
                    return {
                        "status": "ok",
                        "provider": self.name,
                        "model": self.model,
                        "display_name": display_name,
                        "is_enabled": True,
                        "message": f"Gemini API connection healthy ({display_name}).",
                    }
                else:
                    return {
                        "status": "error",
                        "provider": self.name,
                        "model": self.model,
                        "is_enabled": False,
                        "status_code": res.status_code,
                        "message": f"Gemini API returned status {res.status_code}: {res.text[:200]}",
                    }
        except Exception as e:
            logger.warning(f"Gemini health check exception: {e}")
            return {
                "status": "error",
                "provider": self.name,
                "model": self.model,
                "is_enabled": False,
                "message": f"Gemini connectivity error: {str(e)}",
            }

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_output_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Send prompt to Gemini generateContent endpoint.
        """
        if not self.api_key:
            return {
                "text": "GEMINI_API_KEY is not configured. Please supply a valid Gemini API Key in .env.",
                "provider": self.name,
                "model": self.model,
                "is_enabled": False,
                "tool_calls": None,
                "usage": {},
            }

        url = f"{self.BASE_URL}/models/{self.model}:generateContent?key={self.api_key}"

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            }
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code != 200:
                    logger.error(f"Gemini API error ({res.status_code}): {res.text}")
                    return {
                        "text": f"Gemini API returned error ({res.status_code}): {res.text[:200]}",
                        "provider": self.name,
                        "model": self.model,
                        "is_enabled": True,
                        "tool_calls": None,
                        "usage": {},
                    }

                data = res.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return {
                        "text": "No response generated by model.",
                        "provider": self.name,
                        "model": self.model,
                        "is_enabled": True,
                        "tool_calls": None,
                        "usage": data.get("usageMetadata", {}),
                    }

                first_cand = candidates[0]
                content = first_cand.get("content", {})
                parts = content.get("parts", [])
                text_pieces = [p.get("text", "") for p in parts if "text" in p]
                full_text = "".join(text_pieces)

                return {
                    "text": full_text,
                    "provider": self.name,
                    "model": self.model,
                    "is_enabled": True,
                    "tool_calls": None,
                    "usage": data.get("usageMetadata", {}),
                }
        except Exception as e:
            logger.error(f"Gemini request exception: {e}")
            return {
                "text": f"Error communicating with Gemini: {str(e)}",
                "provider": self.name,
                "model": self.model,
                "is_enabled": False,
                "tool_calls": None,
                "usage": {},
            }
