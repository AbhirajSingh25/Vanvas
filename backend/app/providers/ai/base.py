"""
VANVAS AI Provider Base Interface
Defines the contract for LLM providers (Gemini Free-First, Disabled fallback).
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class AIUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0


class AIToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None


class AITextResponse(BaseModel):
    text: str
    provider: str
    model: str
    is_enabled: bool = True
    tool_calls: Optional[List[AIToolCall]] = None
    usage: AIUsage = Field(default_factory=AIUsage)


class AIStructuredResponse(BaseModel):
    data: Dict[str, Any]
    provider: str
    model: str
    is_enabled: bool = True
    usage: AIUsage = Field(default_factory=AIUsage)


class AIError(BaseModel):
    error_code: str  # "AI_DISABLED", "AI_UNCONFIGURED", "AI_QUOTA_EXCEEDED", "AI_TIMEOUT", "AI_INVALID_RESPONSE"
    message: str
    provider: str = "none"
    model: str = "none"


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

    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        response_schema: Dict[str, Any],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """
        Generate a strictly validated JSON structure conforming to response_schema.
        """
        pass

    @abstractmethod
    async def chat_with_tools(
        self,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        tool_dispatcher: Any,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_turns: int = 3,
    ) -> Dict[str, Any]:
        """
        Conduct a multi-turn conversation with tool dispatching.
        Executes returned tool calls via tool_dispatcher, passes outputs back to the model,
        and returns the final reasoned response.
        """
        pass

    def get_metadata(self) -> Dict[str, Any]:
        """Return basic metadata about this provider."""
        return {
            "provider": self.name,
            "model": self.model,
            "is_enabled": self.is_enabled,
        }
