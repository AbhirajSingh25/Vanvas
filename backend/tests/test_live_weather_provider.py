import pytest
from app.providers.live_providers import LiveWeatherProvider

@pytest.mark.asyncio
async def test_live_weather_provider_structured_contract():
    provider = LiveWeatherProvider()
    res = await provider.get_structured_weather(32.2396, 77.1887, "Manali", days=5)
    
    assert res is not None
    assert "temperature" in res
    assert "apparentTemperature" in res
    assert "weatherCode" in res
    assert "condition" in res
    assert "isDay" in res
    assert "windSpeed" in res
    assert "humidity" in res
    assert "is_available" in res
    assert "daily" in res
    assert res["is_available"] is True
    assert len(res["daily"]) >= 1
    assert res["daily"][0]["temp_c"] is not None

@pytest.mark.asyncio
async def test_live_weather_multiple_destinations():
    provider = LiveWeatherProvider()
    destinations = [
        ("Manali", 32.2396, 77.1887),
        ("Goa", 15.2993, 74.1240),
        ("Leh", 34.1526, 77.5771),
        ("Jaipur", 26.9124, 75.7873),
    ]
    for name, lat, lng in destinations:
        res = await provider.get_structured_weather(lat, lng, name, days=3)
        assert res["is_available"] is True
        assert res["temperature"] is not None
        assert res["condition"] != "Weather unavailable"
