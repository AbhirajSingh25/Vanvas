import pytest
from datetime import date
from app.schemas.schemas import RoadTripPlanRequest, RoadTripPlanResponse, RoadTripLeg
from app.services.road_trip_service import RoadTripService
from app.providers.routing_provider import (
    BaseRoutingProvider, RouteResult, RouteLeg,
    OSRMKeylessRoutingProvider, RoutingProviderDispatcher, haversine_km
)
from app.services.route_stop_discovery import RouteStopDiscoveryEngine
from app.api.v1.budget import (
    calculate_shares, simplify_debts_algorithm
)


class MockUnavailableRoutingProvider(BaseRoutingProvider):
    """Simulate routing provider offline / unreachable."""
    def route(self, origin_coords, destination_coords, origin_name="Origin", destination_name="Destination", waypoints=None):
        o_lat, o_lng = origin_coords
        d_lat, d_lng = destination_coords
        straight_dist = haversine_km(o_lat, o_lng, d_lat, d_lng)
        est_km = round(straight_dist * 1.25, 1)
        est_mins = round((est_km / 55.0) * 60.0, 1)
        fallback_leg = RouteLeg(
            origin=origin_name,
            destination=destination_name,
            origin_lat=o_lat,
            origin_lng=o_lng,
            dest_lat=d_lat,
            dest_lng=d_lng,
            distance_km=est_km,
            duration_minutes=est_mins,
            geometry=[],  # Empty geometry: NEVER fabricate false road lines
            departure_time="06:30",
            arrival_time="14:00",
            route_source="ROUTING_PROVIDER_UNAVAILABLE",
            is_live=False,
            summary="Provider unreachable fallback",
        )
        return RouteResult(
            distance_km=est_km,
            duration_minutes=est_mins,
            geometry=[],
            legs=[fallback_leg],
            route_source="ROUTING_PROVIDER_UNAVAILABLE",
            is_live=False,
            status="ROUTING_PROVIDER_UNAVAILABLE",
            warning="Live road routing provider currently unavailable. Route geometry omitted.",
        )


def test_routing_provider_real_and_fallback():
    # Test unavailable provider behavior: geometry must be empty, source marked UNAVAILABLE
    prev_provider = RoutingProviderDispatcher.get_provider()
    try:
        RoutingProviderDispatcher.set_provider(MockUnavailableRoutingProvider())
        req = RoadTripPlanRequest(
            origin="Delhi",
            destination="Jaipur",
            travellers_count=3,
            vehicle_type="Car",
            trip_style="Balanced",
            start_date=date(2026, 11, 10)
        )
        plan = RoadTripService.plan_road_trip(req)
        assert plan.route_source == "ROUTING_PROVIDER_UNAVAILABLE"
        assert plan.is_live_route is False
        assert plan.route_geometry == []  # No fake sine waves
        assert plan.total_distance_km > 200
        assert len(plan.legs) >= 1
        assert plan.legs[0].route_source == "ROUTING_PROVIDER_UNAVAILABLE"
    finally:
        RoutingProviderDispatcher.set_provider(prev_provider)


def test_route_leg_model_and_schedule():
    req = RoadTripPlanRequest(
        origin="Delhi",
        destination="Goa",
        travellers_count=4,
        vehicle_type="Car",
        trip_style="Balanced",
        start_date=date(2026, 12, 1)
    )
    plan = RoadTripService.plan_road_trip(req)
    assert plan.num_days >= 4
    assert len(plan.days) >= 4
    assert len(plan.legs) >= 4

    for leg in plan.legs:
        assert leg.origin != ""
        assert leg.destination != ""
        assert leg.distance_km > 0
        assert leg.duration_minutes > 0
        assert leg.departure_time == "06:30"
        assert ":" in leg.arrival_time

    for day in plan.days:
        assert len(day.food_options) >= 3
        assert len(day.stay_options) >= 1
        assert any(item.category == "Transit" for item in day.timeline)
        assert any(item.category == "Stay" for item in day.timeline)


def test_detour_calculation_and_stop_discovery():
    # Polyline from Delhi to Jaipur
    delhi_jaipur_line = [
        [28.6139, 77.2090],
        [28.2050, 76.7900], # Dharuhera
        [27.9940, 76.3880], # Neemrana
        [27.3910, 75.9610], # Shahpura
        [26.9124, 75.7873], # Jaipur
    ]

    # Neemrana Fort is right near (27.9940, 76.3880)
    dist_off = RouteStopDiscoveryEngine.min_distance_to_polyline(27.9940, 76.3880, delhi_jaipur_line)
    assert dist_off < 1.0  # right on route

    detour_km, detour_mins = RouteStopDiscoveryEngine.calculate_detour(dist_off)
    assert detour_km < 3.0
    assert detour_mins >= 5

    # Remote point (e.g. Bikaner 28.0229, 73.3119) is ~300km away
    dist_far = RouteStopDiscoveryEngine.min_distance_to_polyline(28.0229, 73.3119, delhi_jaipur_line)
    assert dist_far > 200.0

    # Discover stops along corridor
    stops = RouteStopDiscoveryEngine.discover_stops_for_route(
        route_geometry=delhi_jaipur_line,
        origin_coords=(28.6139, 77.2090),
        dest_coords=(26.9124, 75.7873),
        preferences=["scenic", "food_focus"],
        trip_style="Balanced"
    )
    assert len(stops) > 0
    assert any("Rao" in s["name"] or "Neemrana" in s["name"] for s in stops)
    for s in stops:
        assert s["distance_off_route_km"] <= 35.0
        assert s["data_state"] == "CURATED"
        assert s["detour_km"] > 0 or s["distance_off_route_km"] == 0


def test_fuel_and_budget_transparent_calculation():
    req = RoadTripPlanRequest(
        origin="Delhi",
        destination="Manali",
        travellers_count=2,
        vehicle_type="SUV",
        trip_style="Explore",
        start_date=date(2026, 11, 20)
    )
    plan = RoadTripService.plan_road_trip(req)
    assert plan.fuel_breakdown.data_state == "ESTIMATED"
    assert "ESTIMATED" in plan.fuel_breakdown.calculation_text
    assert plan.fuel_breakdown.assumed_mileage_kpl == 11.5
    assert plan.fuel_breakdown.estimated_fuel_cost_inr > 0
    assert plan.budget_estimate.tolls_estimated > 0
    assert plan.budget_estimate.stay_estimated > 0
    assert plan.budget_estimate.food_estimated > 0
    assert plan.budget_estimate.per_person_estimated == round(plan.budget_estimate.total_estimated / 2, 2)


def test_split_methods_shares():
    # 1. Equal Split
    eq_shares = calculate_shares(
        amount=1200.0,
        participant_user_ids=["u1", "u2", "u3"],
        split_method="EQUAL",
        custom_shares=None
    )
    assert len(eq_shares) == 3
    assert sum(s["owed_amount"] for s in eq_shares) == 1200.0
    assert eq_shares[0]["owed_amount"] == 400.0

    # 2. Exact Split
    exact_input = [
        {"user_id": "u1", "owed_amount": 700.0},
        {"user_id": "u2", "owed_amount": 300.0},
        {"user_id": "u3", "owed_amount": 200.0}
    ]
    exact_shares = calculate_shares(
        amount=1200.0,
        participant_user_ids=["u1", "u2", "u3"],
        split_method="EXACT",
        custom_shares=exact_input
    )
    assert exact_shares[0]["owed_amount"] == 700.0
    assert sum(s["owed_amount"] for s in exact_shares) == 1200.0

    # 3. Percentage Split
    pct_input = [
        {"user_id": "u1", "percentage": 50.0},
        {"user_id": "u2", "percentage": 25.0},
        {"user_id": "u3", "percentage": 25.0}
    ]
    pct_shares = calculate_shares(
        amount=2000.0,
        participant_user_ids=["u1", "u2", "u3"],
        split_method="PERCENTAGE",
        custom_shares=pct_input
    )
    assert pct_shares[0]["owed_amount"] == 1000.0
    assert pct_shares[1]["owed_amount"] == 500.0
    assert sum(s["owed_amount"] for s in pct_shares) == 2000.0

    # 4. Shares (Ratio) Split
    ratio_input = [
        {"user_id": "u1", "shares": 2.0},
        {"user_id": "u2", "shares": 1.0},
        {"user_id": "u3", "shares": 1.0}
    ]
    ratio_shares = calculate_shares(
        amount=1000.0,
        participant_user_ids=["u1", "u2", "u3"],
        split_method="SHARES",
        custom_shares=ratio_input
    )
    assert ratio_shares[0]["owed_amount"] == 500.0
    assert ratio_shares[1]["owed_amount"] == 250.0
    assert sum(s["owed_amount"] for s in ratio_shares) == 1000.0

    # 5. Itemized Bill Split
    itemized_input = [
        {"title": "Butter Chicken", "cost": 600.0, "user_id": "u1"},
        {"title": "Paneer Tikka", "cost": 400.0, "user_id": "u2"},
        {"title": "Naan & Drinks", "cost": 200.0, "user_id": "u3"}
    ]
    item_shares = calculate_shares(
        amount=1200.0,
        participant_user_ids=["u1", "u2", "u3"],
        split_method="ITEMIZED",
        custom_shares=itemized_input
    )
    assert item_shares[0]["owed_amount"] == 600.0
    assert item_shares[1]["owed_amount"] == 400.0
    assert sum(s["owed_amount"] for s in item_shares) == 1200.0


def test_debt_simplification():
    # Net balances: u1 is owed 1000 (+1000), u2 owes 600 (-600), u3 owes 400 (-400)
    net_balances = {
        "u1": 1000.0,
        "u2": -600.0,
        "u3": -400.0
    }
    user_names = {
        "u1": "Abhiraj",
        "u2": "Rahul",
        "u3": "Aman"
    }
    debts = simplify_debts_algorithm(net_balances, user_names)
    assert len(debts) == 2
    # Rahul owes Abhiraj 600
    # Aman owes Abhiraj 400
    total_simplified_transfers = sum(d["amount"] for d in debts)
    assert total_simplified_transfers == 1000.0
    assert any(d["debtor_name"] == "Rahul" and d["creditor_name"] == "Abhiraj" and d["amount"] == 600.0 for d in debts)
    assert any(d["debtor_name"] == "Aman" and d["creditor_name"] == "Abhiraj" and d["amount"] == 400.0 for d in debts)
