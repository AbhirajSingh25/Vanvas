"""
VANVAS AI Provider Base Interface
Defines the contract for LLM providers (Gemini Free-First, Disabled fallback).
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class AIProvider(ABC):
    """Abstract interface for VANVAS AI / Copilot LLM providers."""

    def __init__(self, name: str, model: str, is_enabled: bool = True):
        self.name = name
        self.model = model
        self.is_enabled = is_enabled

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Check connectivity and availability of the AI provider.
        Must return a structured status dict with keys:
        - status: "ok" | "disabled" | "error" | "unconfigured"
        - provider: str
        - model: str
        - message: str
        """
        pass

    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_output_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Generate a text response or tool call invocation from the model.
        Must return a structured dict:
        - text: str (the generated content)
        - tool_calls: Optional[List[Dict[str, Any]]]
        - provider: str
        - model: str
        - usage: Dict[str, Any]
        """
        pass

    def get_metadata(self) -> Dict[str, Any]:
        """Return basic metadata about this provider."""
        return {
            "provider": self.name,
            "model": self.model,
            "is_enabled": self.is_enabled,
        }
