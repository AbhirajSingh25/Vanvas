import pytest
from datetime import date
from app.recommendation.scorer import RecommendationScorer
from app.itinerary.clustering import haversine_distance_km, cluster_places_by_day
from app.itinerary.arrival_optimizer import ArrivalOptimizer
from app.models.models import TransportOption

class MockPlace:
    def __init__(self, name, category, tags, price_level, approx_cost, rating, lat=32.24, lng=77.18):
        self.name = name
        self.category = category
        self.tags = tags
        self.price_level = price_level
        self.approx_cost = approx_cost
        self.rating = rating
        self.latitude = lat
        self.longitude = lng
        self.opening_time = "08:00"
        self.closing_time = "20:00"

def test_recommendation_scorer():
    scorer = RecommendationScorer()
    p1 = MockPlace("Mountain Café", "Café", "nature,coffee,sunset", "₹₹", 400.0, 4.8)
    p2 = MockPlace("High Luxury Spa", "Luxury", "spa,resort", "₹₹₹₹", 5000.0, 4.0)

    # Budget traveller looking for nature/cafes
    score1 = scorer.score_place(p1, user_interests=["Nature", "Cafés"], user_budget_tier="Balanced")
    score2 = scorer.score_place(p2, user_interests=["Nature", "Cafés"], user_budget_tier="Budget")

    assert score1 > score2
    assert 0.0 <= score1 <= 1.0

def test_haversine_distance():
    # Distance between Old Manali (32.253, 77.175) and Hadimba (32.248, 77.180) ~0.7km
    dist = haversine_distance_km(32.253, 77.175, 32.248, 77.180)
    assert 0.4 < dist < 1.5

def test_arrival_optimizer():
    optimizer = ArrivalOptimizer()
    options = [
        TransportOption(
            origin_city="Delhi",
            destination_id="dest-1",
            transport_type="Bus",
            operator_name="HimSutra Volvo",
            departure_time="20:00",
            arrival_time="08:30",
            duration_hours=12.5,
            price=1450.0,
            departure_location="ISBT",
            arrival_location="Manali Stand",
            recommendation_badge="Best Arrival Time"
        ),
        TransportOption(
            origin_city="Delhi",
            destination_id="dest-1",
            transport_type="Bus",
            operator_name="Late Bus",
            departure_time="03:00",
            arrival_time="15:30",
            duration_hours=12.5,
            price=1200.0,
            departure_location="ISBT",
            arrival_location="Manali Stand",
            recommendation_badge="Cheapest"
        )
    ]

    res = optimizer.optimize_arrival("Manali", options)
    assert res["best_option"] is not None
    assert res["best_option"]["transport_option"].operator_name == "HimSutra Volvo"
