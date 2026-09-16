import pytest
import time
from app.core.cache import MemoryCache, places_cache, geo_cache
from app.providers.live_providers import LivePlacesProvider

def test_memory_cache_ttl_and_eviction():
    """
    Test in-memory cache TTL expiration and capacity bounding.
    """
    cache = MemoryCache(max_size=5, default_ttl_seconds=1)
    cache.set("key1", "val1", ttl_seconds=1)
    assert cache.get("key1") == "val1"

    # Wait for TTL expiration
    time.sleep(1.1)
    assert cache.get("key1") is None

    # Test capacity pruning
    cache2 = MemoryCache(max_size=3, default_ttl_seconds=60)
    for i in range(5):
        cache2.set(f"k{i}", f"v{i}")
    assert cache2.size() <= 3

def test_place_deduplication_by_name_and_proximity():
    """
    Test LivePlacesProvider deduplication strategy across Google Places, OSM, and Curated sources.
    - Two places within 150m with matching normalized name should be deduplicated.
    - Google Places > OpenStreetMap > Curated priority.
    - Distinct places with different coordinates or distinct names should both be preserved.
    """
    provider = LivePlacesProvider()

    raw_places = [
        {
            "id": "osm-101",
            "name": "Drifters' Inn & Cafe",
            "latitude": 32.2530,
            "longitude": 77.1750,
            "category": "Cafés & Bakery",
            "source": "openstreetmap",
            "source_id": "101",
            "rating": None,
        },
        {
            "id": "gp-999",
            "name": "Drifters Inn Cafe Manali",
            "latitude": 32.2531,
            "longitude": 77.1751,
            "category": "Cafés & Bakery",
            "source": "google_places",
            "source_id": "gp-999",
            "rating": 4.6,
        },
        {
            "id": "curated-1",
            "name": "Old Manali German Bakery",
            "latitude": 32.2540,
            "longitude": 77.1760,
            "category": "Cafés & Bakery",
            "source": "vanvas_curated",
            "source_id": "c-1",
            "rating": 4.7,
        }
    ]

    deduped = provider._deduplicate_places(raw_places)
    # The duplicate "Drifters" should be collapsed into 1 (prioritizing google_places), while German Bakery remains distinct
    assert len(deduped) == 2

    # Verify google_places won over openstreetmap for Drifters
    drifters_entry = next(p for p in deduped if "drifters" in p["name"].lower())
    assert drifters_entry["source"] == "google_places"
    assert drifters_entry["rating"] == 4.6
