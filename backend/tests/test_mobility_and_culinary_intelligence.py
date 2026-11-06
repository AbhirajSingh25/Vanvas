import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_spiti_mobility_access_plan():
    res = client.get("/api/v1/mobility/access-plan?destination=spiti")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["destination_slug"] == "spiti"
    assert "Spiti Valley" in data["destination_name"]
    assert len(data["recommended_pickup_hubs"]) >= 2
    hub_names = [h["hub_name"].lower() for h in data["recommended_pickup_hubs"]]
    assert any("manali" in h for h in hub_names)
    assert any("shimla" in h for h in hub_names)
    assert "Kaza" in data["remote_rental_advisory"]
    assert "Spiti Taxi Union" in data["syndicate_rules"]
    assert data["fuel_and_logistics"]["jerry_can_recommended"] is True
    assert any("Tandi" in p for p in data["fuel_and_logistics"]["critical_fuel_points"])
    assert len(data["vehicle_recommendations"]) >= 2
    assert len(data["verified_fleet"]) > 0

def test_leh_mobility_access_plan():
    res = client.get("/api/v1/mobility/access-plan?destination=leh")
    assert res.status_code == 200
    data = res.json()
    assert data["destination_slug"] == "leh"
    assert "Ladakh" in data["remote_rental_advisory"]
    assert data["fuel_and_logistics"]["jerry_can_recommended"] is True

def test_goa_mobility_access_plan():
    res = client.get("/api/v1/mobility/access-plan?destination=goa")
    assert res.status_code == 200
    data = res.json()
    assert data["destination_slug"] == "goa"
    hub_names = [h["hub_name"].lower() for h in data["recommended_pickup_hubs"]]
    assert any("panaji" in h or "goa" in h for h in hub_names)

def test_spiti_culinary_guide():
    res = client.get("/api/v1/destinations/spiti/food")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["destination_slug"] == "spiti"
    assert len(data["signature_dishes"]) >= 3
    dish_names = [d["dish_name"].lower() for d in data["signature_dishes"]]
    assert any("thukpa" in d for d in dish_names)
    assert any("tingmo" in d for d in dish_names)
    assert any("butter tea" in d or "po cha" in d for d in dish_names)
    assert len(data["dining_spots"]) > 0

def test_jaipur_culinary_guide():
    res = client.get("/api/v1/destinations/jaipur/food")
    assert res.status_code == 200
    data = res.json()
    dish_names = [d["dish_name"].lower() for d in data["signature_dishes"]]
    assert any("dal baati" in d for d in dish_names)
    assert any("pyaaz kachori" in d for d in dish_names)

def test_varanasi_culinary_guide():
    res = client.get("/api/v1/destinations/varanasi/food")
    assert res.status_code == 200
    data = res.json()
    dish_names = [d["dish_name"].lower() for d in data["signature_dishes"]]
    assert any("tamatar chaat" in d for d in dish_names)
    assert any("malaiyo" in d for d in dish_names)

