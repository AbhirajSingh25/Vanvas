import pytest
import asyncio
from app.providers.geocoding_provider import LiveGeocodingProvider
from app.providers.live_providers import LiveWeatherProvider, HaversineRoutingProvider
from app.providers.provider_factory import ProviderFactory

@pytest.mark.asyncio
async def test_geocoding_seeded_autocomplete():
    provider = LiveGeocodingProvider()
    results = await provider.autocomplete("man", limit=5)
    assert len(results) > 0
    manali_match = next((r for r in results if "Manali" in r["name"]), None)
    assert manali_match is not None
    assert manali_match["state"] == "Himachal Pradesh"

@pytest.mark.asyncio
async def test_geocoding_live_fallback():
    provider = LiveGeocodingProvider()
    # Test an unseeded destination query
    results = await provider.autocomplete("Spiti", limit=5)
    assert len(results) > 0
    assert any("Spiti" in r["name"] for r in results)

@pytest.mark.asyncio
async def test_live_weather_provider():
    weather_provider = LiveWeatherProvider()
    # Manali coordinates
    forecast = await weather_provider.get_forecast(32.2396, 77.1887, days=3)
    assert len(forecast) >= 1
    assert "temp_c" in forecast[0]
    assert "condition" in forecast[0]
    assert "wind_kph" in forecast[0]

@pytest.mark.asyncio
async def test_mountain_routing_provider():
    routing_provider = HaversineRoutingProvider()
    # Distance between Manali and Solang Valley (~13 km straight line, ~18 km winding mountain road)
    route = await routing_provider.calculate_route(32.2396, 77.1887, 32.3166, 77.1575)
    assert route["distance_km"] > 5
    assert route["duration_mins"] > 10
    assert route["is_mountain_adjusted"] is True

def test_provider_health_diagnostics():
    health = ProviderFactory.get_provider_health()
    assert len(health) >= 4
    names = [h["provider_name"] for h in health]
    assert any("Weather" in n for n in names)
    assert any("Geocoding" in n for n in names)
    assert any("Routing" in n for n in names)

@pytest.mark.asyncio
async def test_creative_art_provider():
    provider = ProviderFactory.get_creative_art_provider()
    # 1. Seeded destination resolution
    res_manali = await provider.generate_destination_art("Manali", "manali", "himalayan")
    assert res_manali["is_curated"] is True
    assert "manali" in res_manali["asset_url"]
    assert "no text" in res_manali["prompt_blueprint"]

    # 2. Unseeded arbitrary destination resolution
    res_munnar = await provider.generate_destination_art("Munnar", "munnar", "valley")
    assert res_munnar["is_curated"] is False
    assert "valley" in res_munnar["asset_url"]
    assert "Munnar" in res_munnar["prompt_blueprint"]

