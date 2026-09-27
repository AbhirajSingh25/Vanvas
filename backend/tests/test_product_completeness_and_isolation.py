import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.seed.canonical_dataset import (
    CANONICAL_25_DESTINATIONS,
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST,
)
from app.services.mobility_service import MobilityService

client = TestClient(app)

CANONICAL_26_SLUGS = [
    "goa", "jaipur", "udaipur", "varanasi", "leh", "spiti", "mussoorie",
    "rishikesh", "manali", "dharamshala", "kasol", "jaisalmer", "munnar",
    "dehradun", "tungnath-chandrashila", "kainchi-dham", "agra",
    "mathura-vrindavan", "neemrana", "damdama-sohna", "alwar-siliserh",
    "sariska-bhangarh", "chandigarh", "morni-hills", "lansdowne", "murthal"
]

EXPECTED_PLACES_PER_DEST = {
    "goa": 3, "jaipur": 3, "udaipur": 4, "varanasi": 4, "leh": 3, "spiti": 5,
    "mussoorie": 5, "rishikesh": 6, "manali": 5, "dharamshala": 5, "kasol": 6,
    "jaisalmer": 2, "munnar": 4, "dehradun": 2, "tungnath-chandrashila": 2,
    "kainchi-dham": 2, "agra": 2, "mathura-vrindavan": 2, "neemrana": 2,
    "damdama-sohna": 2, "alwar-siliserh": 2, "sariska-bhangarh": 2,
    "chandigarh": 2, "morni-hills": 2, "lansdowne": 2, "murthal": 2
}

EXPECTED_STAYS_PER_DEST = {
    "goa": 1, "jaipur": 1, "udaipur": 1, "varanasi": 1, "leh": 1, "spiti": 1,
    "mussoorie": 1, "rishikesh": 1, "manali": 1, "dharamshala": 1, "kasol": 1,
    "jaisalmer": 1, "munnar": 1, "dehradun": 1, "tungnath-chandrashila": 2,
    "kainchi-dham": 1, "agra": 1, "mathura-vrindavan": 1, "neemrana": 1,
    "damdama-sohna": 1, "alwar-siliserh": 1, "sariska-bhangarh": 1,
    "chandigarh": 1, "morni-hills": 1, "lansdowne": 1, "murthal": 1
}


def test_canonical_destination_count():
    assert len(CANONICAL_26_SLUGS) == 26
    assert len(CANONICAL_25_DESTINATIONS) == 26
    assert len(CANONICAL_26_DESTINATIONS) == 26
    
    res = client.get("/api/v1/destinations")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 26
    slugs = [d["slug"] for d in data]
    for s in CANONICAL_26_SLUGS:
        assert s in slugs, f"Missing canonical slug: {s}"


def test_canonical_place_inventory_total_81():
    total_places = sum(len(v) for v in ADDITIONAL_PLACES_BY_DEST.values())
    assert total_places == 81, f"Expected 81 places, found {total_places}"
    
    for s in CANONICAL_26_SLUGS:
        expected = EXPECTED_PLACES_PER_DEST[s]
        actual = len(ADDITIONAL_PLACES_BY_DEST.get(s, []))
        assert actual == expected, f"{s}: expected {expected} places, found {actual}"


def test_canonical_stay_inventory_total_27():
    total_hotels = sum(len(v) for v in ADDITIONAL_HOTELS_BY_DEST.values())
    assert total_hotels == 27, f"Expected 27 stays, found {total_hotels}"
    
    for s in CANONICAL_26_SLUGS:
        expected = EXPECTED_STAYS_PER_DEST[s]
        actual = len(ADDITIONAL_HOTELS_BY_DEST.get(s, []))
        assert actual == expected, f"{s}: expected {expected} stays, found {actual}"


def test_canonical_mobility_inventory_completeness():
    total_rentals = sum(len(v) for v in ADDITIONAL_RENTALS_BY_DEST.values())
    assert total_rentals >= 33, f"Expected at least 33 mobility options, found {total_rentals}"
    
    for s in CANONICAL_26_SLUGS:
        actual = len(ADDITIONAL_RENTALS_BY_DEST.get(s, []))
        assert actual >= 1, f"{s} must have at least 1 mobility option, found {actual}"


from unittest.mock import patch, AsyncMock


def test_destination_isolation_and_all_26_routes():
    with patch("app.services.destination_intelligence.DestinationIntelligenceService._ensure_weather", new=AsyncMock(return_value=None)):
        for s in CANONICAL_26_SLUGS:
            res = client.get(f"/api/v1/destinations/{s}")
            assert res.status_code == 200, f"Failed route for /explore/{s}"
            data = res.json()
            
            # Check destination object
            dest = data.get("destination") or {}
            assert dest.get("slug") == s, f"Mismatched destination slug in response for {s}"
            
            # Check places isolation
            places = data.get("places", [])
            assert len(places) == EXPECTED_PLACES_PER_DEST[s], f"{s} expected {EXPECTED_PLACES_PER_DEST[s]} places in detail API, got {len(places)}"
            for p in places:
                assert p.get("destination_id") in [s, f"dest-{s}"], f"Place {p.get('name')} has destination_id {p.get('destination_id')} leaked into {s}"
                
            # Check stays isolation
            hotels = data.get("hotels", [])
            assert len(hotels) >= EXPECTED_STAYS_PER_DEST[s], f"{s} expected at least {EXPECTED_STAYS_PER_DEST[s]} stays, got {len(hotels)}"
            
            # Check rentals isolation
            rentals = data.get("rentals", [])
            assert len(rentals) >= 1, f"{s} expected at least 1 rental in detail API, got {len(rentals)}"


def test_destination_specific_mobility_artwork_resolution():
    # 1. Manali
    manali_scooter_img = MobilityService.resolve_mobility_artwork(
        vehicle_type="Scooter",
        vehicle_name="Honda Activa 6G (Hill Tuned)",
        destination_name="Manali",
        destination_slug="manali",
    )
    assert manali_scooter_img == "/images/vehicles/manali_beas_scooter.jpg"
    
    manali_bullet_img = MobilityService.resolve_mobility_artwork(
        vehicle_type="Royal Enfield Himalayan 450",
        vehicle_name="Himalayan 450 Adventure",
        destination_name="Manali",
        destination_slug="manali",
    )
    assert manali_bullet_img == "/images/vehicles/manali_solang_bullet.jpg"
    assert "himachal_pine_forest_bike.jpg" not in manali_bullet_img

    # 2. Rishikesh
    rksh_scooter_img = MobilityService.resolve_mobility_artwork(
        vehicle_type="Scooter",
        vehicle_name="Honda Activa 6G River Edition",
        destination_name="Rishikesh",
        destination_slug="rishikesh",
    )
    assert rksh_scooter_img == "/images/vehicles/rishikesh_tapovan_scooter.jpg"

    # 3. Kasol
    kasol_scooter_img = MobilityService.resolve_mobility_artwork(
        vehicle_type="Scooter",
        vehicle_name="Parvati Valley Pine Scooter",
        destination_name="Kasol",
        destination_slug="kasol",
    )
    assert kasol_scooter_img == "/images/vehicles/kasol_valley_scooter.jpg"

    # 4. Dharamshala
    dhar_scooter_img = MobilityService.resolve_mobility_artwork(
        vehicle_type="Scooter",
        vehicle_name="Honda Activa 6G",
        destination_name="Dharamshala",
        destination_slug="dharamshala",
    )
    assert dhar_scooter_img == "/images/vehicles/dharamshala_mcleod_scooter.jpg"

    # 5. Jaisalmer
    jais_scooter_img = MobilityService.resolve_mobility_artwork(
        vehicle_type="Scooter",
        vehicle_name="Honda Activa 6G Desert Edition",
        destination_name="Jaisalmer",
        destination_slug="jaisalmer",
    )
    assert jais_scooter_img == "/images/vehicles/jaisalmer_fort_scooter.jpg"


def test_stays_and_mobility_dual_query_param_contract():
    mock_hotels = AsyncMock()
    mock_hotels.search_hotels = AsyncMock(return_value=[])
    with patch("app.providers.provider_factory.ProviderFactory.get_hotels_provider", return_value=mock_hotels):
        for s in ["manali", "rishikesh", "goa", "jaipur", "kainchi-dham"]:
            # Test Stays by destination vs destination_id
            r_h1 = client.get(f"/api/v1/hotels?destination={s}")
            r_h2 = client.get(f"/api/v1/hotels?destination_id=dest-{s}")
            assert r_h1.status_code == 200
            assert r_h2.status_code == 200
            assert len(r_h1.json()) >= 1
            assert len(r_h2.json()) >= 1

            # Test Rentals by destination vs destination_id
            r_r1 = client.get(f"/api/v1/rentals?destination={s}")
            r_r2 = client.get(f"/api/v1/rentals?destination_id=dest-{s}")
            assert r_r1.status_code == 200
            assert r_r2.status_code == 200
            assert len(r_r1.json()) >= 1
            assert len(r_r2.json()) >= 1
