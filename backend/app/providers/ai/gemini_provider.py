"""
Google Gemini LLM Provider & Disabled AI Provider Implementation.
Leverages Google Gemini Free Tier (gemini-1.5-flash / gemini-2.0-flash) with zero OpenAI dependencies.
"""
import time
import json
import logging
import asyncio
import httpx
from typing import Dict, Any, List, Optional
from app.providers.ai.base import AIProvider

logger = logging.getLogger("vanvas.ai.gemini")


class DisabledAIProvider(AIProvider):
    """Fallback provider when AI features are disabled (AI_PROVIDER=disabled)."""

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
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "latency_ms": 0.0},
        }

    async def generate_structured(
        self,
        prompt: str,
        response_schema: Dict[str, Any],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        return {
            "data": {},
            "provider": self.name,
            "model": self.model,
            "is_enabled": False,
            "error": "AI provider is disabled.",
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "latency_ms": 0.0},
        }

    async def chat_with_tools(
        self,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        tool_dispatcher: Any,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_turns: int = 3,
    ) -> Dict[str, Any]:
        return {
            "text": "AI assistance is currently disabled in system configuration. All core VANVAS travel tools remain available.",
            "provider": self.name,
            "model": self.model,
            "is_enabled": False,
            "tool_calls": [],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "latency_ms": 0.0},
        }


class GeminiProvider(AIProvider):
    """
    Google Gemini AI Provider utilizing the Gemini REST API.
    Designed for free-tier usage (e.g. gemini-1.5-flash / gemini-2.0-flash).
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self, api_key: str = "", model: str = "gemini-3.5-flash-lite"):
        clean_key = (api_key or "").strip()
        is_enabled = bool(clean_key)
        super().__init__(name="gemini", model=model, is_enabled=is_enabled)
        self.api_key = clean_key

    async def health_check(self) -> Dict[str, Any]:
        """Check connectivity and model availability."""
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
                elif res.status_code == 429:
                    return {
                        "status": "quota_exceeded",
                        "provider": self.name,
                        "model": self.model,
                        "is_enabled": False,
                        "status_code": 429,
                        "message": "Gemini API rate limit or free quota exceeded.",
                    }
                else:
                    return {
                        "status": "error",
                        "provider": self.name,
                        "model": self.model,
                        "is_enabled": False,
                        "status_code": res.status_code,
                        "message": f"Gemini API returned status {res.status_code}",
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
        """Generate text completion from Gemini."""
        if not self.api_key:
            return {
                "text": "GEMINI_API_KEY is not configured. Please supply a valid Gemini API Key in .env.",
                "provider": self.name,
                "model": self.model,
                "is_enabled": False,
                "tool_calls": None,
                "usage": {},
            }

        start_time = time.time()
        url = f"{self.BASE_URL}/models/{self.model}:generateContent?key={self.api_key}"

        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
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
            async with httpx.AsyncClient(timeout=35.0) as client:
                res = await client.post(url, json=payload)
                latency = round((time.time() - start_time) * 1000, 2)

                if res.status_code == 429:
                    return {
                        "text": "Gemini API rate limit or quota exceeded. Please try again shortly.",
                        "error_code": "AI_QUOTA_EXCEEDED",
                        "provider": self.name,
                        "model": self.model,
                        "is_enabled": True,
                        "usage": {"latency_ms": latency},
                    }
                elif res.status_code != 200:
                    logger.error(f"Gemini API error ({res.status_code}): {res.text[:200]}")
                    return {
                        "text": f"Gemini API returned error ({res.status_code})",
                        "error_code": "AI_ERROR",
                        "provider": self.name,
                        "model": self.model,
                        "is_enabled": True,
                        "usage": {"latency_ms": latency},
                    }

                data = res.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return {
                        "text": "No response generated by model.",
                        "provider": self.name,
                        "model": self.model,
                        "is_enabled": True,
                        "usage": {**data.get("usageMetadata", {}), "latency_ms": latency},
                    }

                first_cand = candidates[0]
                content = first_cand.get("content", {})
                parts = content.get("parts", [])
                text_pieces = [p.get("text", "") for p in parts if "text" in p]
                full_text = "".join(text_pieces)

                usage_meta = data.get("usageMetadata", {})
                return {
                    "text": full_text,
                    "provider": self.name,
                    "model": self.model,
                    "is_enabled": True,
                    "tool_calls": None,
                    "usage": {
                        "prompt_tokens": usage_meta.get("promptTokenCount", 0),
                        "completion_tokens": usage_meta.get("candidatesTokenCount", 0),
                        "total_tokens": usage_meta.get("totalTokenCount", 0),
                        "latency_ms": latency,
                    },
                }
        except httpx.TimeoutException:
            return {
                "text": "Request to Gemini API timed out.",
                "error_code": "AI_TIMEOUT",
                "provider": self.name,
                "model": self.model,
                "is_enabled": True,
                "usage": {},
            }
        except Exception as e:
            logger.error(f"Gemini request exception: {e}")
            return {
                "text": f"Error communicating with Gemini: {str(e)}",
                "error_code": "AI_ERROR",
                "provider": self.name,
                "model": self.model,
                "is_enabled": False,
                "usage": {},
            }

    async def generate_structured(
        self,
        prompt: str,
        response_schema: Dict[str, Any],
        system_instruction: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """Generate strictly structured JSON from Gemini."""
        if not self.api_key:
            return {
                "data": {},
                "provider": self.name,
                "model": self.model,
                "is_enabled": False,
                "error": "GEMINI_API_KEY is not configured.",
            }

        start_time = time.time()
        url = f"{self.BASE_URL}/models/{self.model}:generateContent?key={self.api_key}"

        system_prompt = (system_instruction or "") + "\nYou MUST respond with valid JSON only. Do not wrap in markdown quotes if possible, or return a clean JSON object."

        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
            }
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, json=payload)
                latency = round((time.time() - start_time) * 1000, 2)

                if res.status_code != 200:
                    return {
                        "data": {},
                        "error": f"Gemini API returned status {res.status_code}",
                        "provider": self.name,
                        "model": self.model,
                        "usage": {"latency_ms": latency},
                    }

                data = res.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return {"data": {}, "error": "Empty model candidates", "provider": self.name, "model": self.model}

                parts = candidates[0].get("content", {}).get("parts", [])
                raw_text = "".join([p.get("text", "") for p in parts if "text" in p]).strip()

                # Clean markdown backticks if present
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()

                parsed = json.loads(raw_text)
                usage_meta = data.get("usageMetadata", {})

                return {
                    "data": parsed,
                    "provider": self.name,
                    "model": self.model,
                    "is_enabled": True,
                    "usage": {
                        "prompt_tokens": usage_meta.get("promptTokenCount", 0),
                        "completion_tokens": usage_meta.get("candidatesTokenCount", 0),
                        "total_tokens": usage_meta.get("totalTokenCount", 0),
                        "latency_ms": latency,
                    }
                }
        except json.JSONDecodeError as jde:
            logger.warning(f"Failed to parse Gemini JSON: {jde}")
            return {"data": {}, "error": "Malformed JSON in model response", "provider": self.name, "model": self.model}
        except Exception as e:
            return {"data": {}, "error": str(e), "provider": self.name, "model": self.model}

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
        Execute multi-turn reasoning with function calling.
        """
        if not self.api_key:
            return {
                "text": "GEMINI_API_KEY is not configured. Pure deterministic fallback active.",
                "provider": self.name,
                "model": self.model,
                "is_enabled": False,
                "tool_calls": [],
                "usage": {},
            }

        start_time = time.time()
        url = f"{self.BASE_URL}/models/{self.model}:generateContent?key={self.api_key}"

        # Convert tool schemas to Gemini function declarations
        gemini_tools = [{"functionDeclarations": tools}] if tools else []

        # Convert messages to Gemini contents format.
        # System messages are handled via systemInstruction — skip them here.
        # Gemini requires strictly alternating user/model turns with non-empty parts.
        contents = []
        for msg in messages:
            role = msg.get("role", "user")
            if role == "system":
                continue  # Supplied via systemInstruction field instead
            gemini_role = "model" if role == "assistant" else "user"
            content_text = (msg.get("content") or "").strip()
            parts = []
            if content_text:
                parts.append({"text": content_text})

            # Multimodal vision support for user images
            image_b64 = msg.get("image_base64")
            image_mime = msg.get("image_mime_type") or "image/jpeg"
            if image_b64:
                parts.append({
                    "inlineData": {
                        "mimeType": image_mime,
                        "data": image_b64
                    }
                })
            elif msg.get("image_url"):
                img_url = msg.get("image_url")
                if "/api/v1/copilot/image/" in img_url or "/api/v1/auth/profile/avatar/file/" in img_url:
                    from app.services.storage_service import StorageService
                    import base64
                    key_part = img_url.split("/file/")[-1] if "/file/" in img_url else img_url.split("/image/")[-1]
                    file_bytes, mime = StorageService.read_local_file(key_part)
                    if file_bytes:
                        parts.append({
                            "inlineData": {
                                "mimeType": mime or "image/jpeg",
                                "data": base64.b64encode(file_bytes).decode("utf-8")
                            }
                        })

            if parts:
                contents.append({"role": gemini_role, "parts": parts})

        executed_tool_calls = []
        total_prompt_tokens = 0
        total_completion_tokens = 0

        async with httpx.AsyncClient(timeout=8.0) as client:
            for turn in range(max_turns):
                payload: Dict[str, Any] = {
                    "contents": contents,
                    "generationConfig": {"temperature": temperature},
                }
                if gemini_tools:
                    payload["tools"] = gemini_tools
                if system_instruction:
                    payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

                try:
                    res = await client.post(url, json=payload)
                    if res.status_code in [503, 429]:
                        logger.warning(f"Gemini API returned status {res.status_code}. Retrying once after backoff...")
                        await asyncio.sleep(1.0)
                        res = await client.post(url, json=payload)

                    if res.status_code == 429:
                        return {
                            "text": "Gemini API rate limit or quota reached. Please try again in a moment.",
                            "error_code": "AI_QUOTA_EXCEEDED",
                            "provider": self.name,
                            "model": self.model,
                            "tool_calls": executed_tool_calls,
                            "usage": {"latency_ms": round((time.time() - start_time) * 1000, 2)},
                        }
                    elif res.status_code != 200:
                        logger.error(f"Gemini function calling error ({res.status_code}): {res.text[:200]}")
                        return {
                            "text": "I encountered an error gathering travel details. Please try again.",
                            "error_code": f"HTTP_{res.status_code}",
                            "provider": self.name,
                            "model": self.model,
                            "tool_calls": executed_tool_calls,
                            "usage": {},
                        }

                    data = res.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        # No candidates — safety block or empty model response
                        logger.warning(f"Gemini returned no candidates on turn {turn}. Returning graceful fallback.")
                        fallback = (
                            "I've gathered your travel details. Let me know if you need anything else!"
                            if executed_tool_calls
                            else "I wasn't able to produce a response. Please rephrase your question."
                        )
                        return {
                            "text": fallback,
                            "error_code": "GEMINI_EMPTY_CANDIDATES",
                            "provider": self.name,
                            "model": self.model,
                            "tool_calls": executed_tool_calls,
                            "usage": {"latency_ms": round((time.time() - start_time) * 1000, 2)},
                        }

                    usage_meta = data.get("usageMetadata", {})
                    total_prompt_tokens += usage_meta.get("promptTokenCount", 0)
                    total_completion_tokens += usage_meta.get("candidatesTokenCount", 0)

                    first_candidate = candidates[0]
                    finish_reason = first_candidate.get("finishReason", "STOP")
                    content_obj = first_candidate.get("content", {})
                    parts = content_obj.get("parts", [])

                    # Handle non-STOP finish reasons that produce no usable content
                    if finish_reason in ("SAFETY", "RECITATION", "OTHER"):
                        logger.warning(f"Gemini finish_reason={finish_reason} on turn {turn}")
                        return {
                            "text": "I was unable to generate a response for that request. Please try rephrasing.",
                            "error_code": f"GEMINI_{finish_reason}",
                            "provider": self.name,
                            "model": self.model,
                            "tool_calls": executed_tool_calls,
                            "usage": {"latency_ms": round((time.time() - start_time) * 1000, 2)},
                        }

                    # Check for function calls
                    function_calls = [p.get("functionCall") for p in parts if "functionCall" in p]

                    if not function_calls:
                        # Model produced final text response
                        text_parts = [p.get("text", "") for p in parts if "text" in p]
                        final_text = "".join(text_parts).strip()

                        # Guard against empty text — known Gemini edge case after multi-turn tool use
                        if not final_text:
                            logger.warning(
                                f"Gemini returned empty text on turn {turn} "
                                f"(finish_reason={finish_reason}). Using contextual fallback."
                            )
                            final_text = (
                                "I've gathered the travel information you requested. "
                                "Let me know if you need anything else!"
                                if executed_tool_calls
                                else "I didn't find anything specific. Try asking about a destination, place, or travel plan!"
                            )

                        return {
                            "text": final_text,
                            "provider": self.name,
                            "model": self.model,
                            "is_enabled": True,
                            "tool_calls": executed_tool_calls,
                            "usage": {
                                "prompt_tokens": total_prompt_tokens,
                                "completion_tokens": total_completion_tokens,
                                "total_tokens": total_prompt_tokens + total_completion_tokens,
                                "latency_ms": round((time.time() - start_time) * 1000, 2),
                            }
                        }

                    # Append model's function call message to contents
                    contents.append(content_obj)

                    # Execute each requested function call through the dispatcher
                    response_parts = []
                    for fc in function_calls:
                        func_name = fc.get("name")
                        func_args = fc.get("args", {})
                        logger.info(f"AI Dispatching tool: {func_name} with args {func_args}")

                        # Execute tool synchronously/asynchronously via dispatcher
                        try:
                            tool_result = await tool_dispatcher.dispatch(func_name, func_args)
                        except Exception as e:
                            logger.error(f"Tool execution error for {func_name}: {e}")
                            tool_result = {"error": f"Tool execution failed: {str(e)}"}

                        executed_tool_calls.append({
                            "name": func_name,
                            "arguments": func_args,
                            "result": tool_result
                        })

                        response_parts.append({
                            "functionResponse": {
                                "name": func_name,
                                "response": {"name": func_name, "content": tool_result}
                            }
                        })

                    # Feed function results back to model
                    contents.append({
                        "role": "user",
                        "parts": response_parts
                    })

                except httpx.TimeoutException:
                    return {
                        "text": "The request timed out while gathering travel details.",
                        "error_code": "AI_TIMEOUT",
                        "provider": self.name,
                        "model": self.model,
                        "tool_calls": executed_tool_calls,
                        "usage": {},
                    }
                except Exception as e:
                    logger.error(f"Exception during Gemini tool calling loop: {e}")
                    return {
                        "text": "An unexpected error occurred while communicating with the travel intelligence layer.",
                        "error_code": "AI_EXCEPTION",
                        "provider": self.name,
                        "model": self.model,
                        "tool_calls": executed_tool_calls,
                        "usage": {},
                    }

        # Exhausted max_turns — return graceful fallback
        fallback_msg = (
            "Here is what I gathered for your journey. Let me know if you need more details!"
            if executed_tool_calls
            else "I wasn't able to find a specific answer. Could you rephrase your question?"
        )
        return {
            "text": fallback_msg,
            "provider": self.name,
            "model": self.model,
            "is_enabled": True,
            "tool_calls": executed_tool_calls,
            "usage": {
                "total_tokens": total_prompt_tokens + total_completion_tokens,
                "latency_ms": round((time.time() - start_time) * 1000, 2),
            }
        }
