import httpx
import logging
from typing import Dict, Any, List, Optional
from app.providers.base import WebSearchProvider
from app.core.config import settings
from app.core.cache import web_search_cache

logger = logging.getLogger("vanvas.web_search")

class LiveWebSearchProvider(WebSearchProvider):
    """
    Legitimate Travel Web Search Provider.
    Queries configured search APIs (Tavily, SerpAPI, Bing) for current travel advisories,
    road closures (e.g. Rohtang / Atal Tunnel passes), events, and weekend happenings.
    Transparently reports when unconfigured without fabricating data.
    """
    def __init__(self, api_key: str = "", provider: str = "auto", provider_name: Optional[str] = None):
        self.api_key = api_key or settings.WEB_SEARCH_API_KEY
        self.provider = provider_name or provider or settings.WEB_SEARCH_PROVIDER
        self.headers = {
            "User-Agent": "VANVAS-Travel-Operating-System/2.0 (expedition@vanvas.com)"
        }

    async def search(self, query: str, limit: int = 5) -> Dict[str, Any]:
        return await self.search_travel_web(query, limit)

    async def search_travel_web(self, query: str, limit: int = 5) -> Dict[str, Any]:
        q = query.strip()
        if not q:
            return {
                "query": "",
                "is_available": False,
                "source": "empty_query",
                "results": [],
                "summary": "No live web search provider is currently configured.",
                "message": "Empty query provided."
            }

        cache_key = f"web:{q.lower()}:{limit}"
        cached = web_search_cache.get(cache_key)
        if cached:
            return cached

        # 1. Tavily Search API (Dedicated for AI & Travel research)
        if self.api_key and (self.api_key.startswith("tvly-") or self.provider.lower() == "tavily" or len(self.api_key) > 5):
            try:
                url = "https://api.tavily.com/search"
                payload = {
                    "api_key": self.api_key,
                    "query": f"{q} travel advisory road status current update",
                    "search_depth": "basic",
                    "include_answer": True,
                    "max_results": limit
                }
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        results = []
                        for item in data.get("results", []):
                            results.append({
                                "title": item.get("title", ""),
                                "snippet": item.get("content", ""),
                                "url": item.get("url", ""),
                                "source": "tavily"
                            })
                        response_data = {
                            "query": q,
                            "is_available": True,
                            "source": "tavily",
                            "results": results,
                            "summary": data.get("answer") or (results[0]["snippet"] if results else None),
                            "message": f"Found {len(results)} live web search results."
                        }
                        web_search_cache.set(cache_key, response_data, ttl_seconds=600)
                        return response_data
            except Exception as e:
                logger.warning(f"Tavily web search failed: {e}")

        # 2. SerpAPI (Google Search provider)
        if self.api_key and self.provider.lower() == "serpapi":
            try:
                url = f"https://serpapi.com/search.json?q={httpx.URL(q)}&api_key={self.api_key}&num={limit}"
                async with httpx.AsyncClient(timeout=4.0) as client:
                    res = await client.get(url)
                    if res.status_code == 200:
                        data = res.json()
                        results = []
                        for item in data.get("organic_results", [])[:limit]:
                            results.append({
                                "title": item.get("title", ""),
                                "snippet": item.get("snippet", ""),
                                "url": item.get("link", ""),
                                "source": "serpapi"
                            })
                        response_data = {
                            "query": q,
                            "is_available": True,
                            "source": "serpapi",
                            "results": results,
                            "summary": None,
                            "message": f"Found {len(results)} live search results."
                        }
                        web_search_cache.set(cache_key, response_data, ttl_seconds=600)
                        return response_data
            except Exception as e:
                logger.warning(f"SerpAPI search failed: {e}")

        # 3. Transparent Unconfigured State: Do not invent fake web search results
        result = {
            "query": q,
            "is_available": False,
            "source": "unavailable",
            "results": [],
            "summary": "No live web search provider is currently configured in this environment.",
            "message": "Web search is currently unconfigured in this environment. Configure WEB_SEARCH_API_KEY (e.g. Tavily / SerpAPI) to retrieve live web advisories and pass status."
        }
        return result
