import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.schemas import RoadTripPlanRequest
from app.services.road_trip_service import RoadTripService

client = TestClient(app)

def test_road_trip_service_delhi_goa():
    req = RoadTripPlanRequest(
        origin="Delhi",
        destination="Goa",
        travellers_count=4,
        vehicle_type="Car",
        trip_style="Balanced",
        start_date=date(2026, 10, 15)
    )
    plan = RoadTripService.plan_road_trip(req)
    assert plan.origin == "Delhi"
    assert plan.destination == "Goa"
    assert plan.total_distance_km > 1200
    assert plan.num_days >= 4
    assert len(plan.days) >= 4
    assert len(plan.recommended_stops) > 0
    assert plan.fuel_breakdown.estimated_fuel_cost_inr > 0
    assert plan.budget_estimate.total_estimated > 0
    assert plan.budget_estimate.per_person_estimated > 0

def test_road_trip_service_delhi_manali():
    req = RoadTripPlanRequest(
        origin="Delhi",
        destination="Manali",
        travellers_count=2,
        vehicle_type="Bike",
        trip_style="Explore",
        start_date=date(2026, 10, 20)
    )
    plan = RoadTripService.plan_road_trip(req)
    assert plan.origin == "Delhi"
    assert plan.destination == "Manali"
    assert plan.total_distance_km > 450
    assert any("Murthal" in s.name for s in plan.recommended_stops)

def test_road_trip_api_plan():
    payload = {
        "origin": "Bangalore",
        "destination": "Goa",
        "travellers_count": 3,
        "vehicle_type": "SUV",
        "trip_style": "Balanced",
        "start_date": "2026-11-01"
    }
    resp = client.post("/api/v1/road-trip/plan", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["origin"] == "Bangalore"
    assert data["destination"] == "Goa"
    assert "days" in data
    assert "fuel_breakdown" in data
    assert "budget_estimate" in data

def test_road_trip_corridors():
    resp = client.get("/api/v1/road-trip/corridors")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 4
    assert any(c["id"] == "delhi-goa" for c in data)
