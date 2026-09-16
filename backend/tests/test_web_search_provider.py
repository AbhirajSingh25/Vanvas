import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
from app.providers.web_search_provider import LiveWebSearchProvider
from app.providers.provider_factory import ProviderFactory

@pytest.mark.asyncio
async def test_web_search_unconfigured_behavior():
    """
    When no web search API key is configured:
    - Return clean is_available=False state
    - Do NOT scrape arbitrary websites indiscriminately
    - Do NOT fabricate fake search results
    - Provider is abstract and safe
    """
    provider = LiveWebSearchProvider(api_key="")
    res = await provider.search("Is Rohtang Pass open today?")
    assert res is not None
    assert res["is_available"] is False
    assert len(res["results"]) == 0
    assert "no live web search provider is currently configured" in res["summary"].lower()

@pytest.mark.asyncio
async def test_web_search_mock_tavily_response():
    """
    When a valid search provider returns results, verify normalization into WebSearchResult schema.
    """
    provider = LiveWebSearchProvider(api_key="mock-key-1234567890", provider_name="tavily")

    mock_tavily_payload = {
        "answer": "Rohtang Pass is currently open for light motor vehicles with valid permits.",
        "results": [
            {
                "title": "Rohtang Pass Status Update 2026",
                "content": "BRO has cleared snow from Manali to Rohtang top. Tourists can visit with permit.",
                "url": "https://himachaltourism.gov.in/rohtang-status",
                "published_date": "2026-09-15"
            }
        ]
    }

    mock_res = AsyncMock()
    mock_res.status_code = 200
    mock_res.json = lambda: mock_tavily_payload

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_res

        res = await provider.search("Is Rohtang Pass open today?")
        assert res["is_available"] is True
        assert len(res["results"]) == 1
        assert res["results"][0]["title"] == "Rohtang Pass Status Update 2026"
        assert "himachaltourism.gov.in" in res["results"][0]["url"]
        assert "Rohtang Pass is currently open" in res["summary"]

def test_provider_factory_web_search_instance():
    """
    Verify ProviderFactory instantiates web search provider correctly.
    """
    p = ProviderFactory.get_web_search_provider()
    assert p is not None
    assert hasattr(p, "search")
