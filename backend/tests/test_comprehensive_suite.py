import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.models.models import (
    Destination, Place, Hotel, RentalOption, Trip, TripMember,
    Itinerary, ItineraryItem, Vote, Expense, WeatherSnapshot
)
from app.itinerary.generator import ItineraryEngine
from app.itinerary.dynamic_replanner import DynamicReplanner
from app.services.destination_intelligence import DestinationIntelligenceService
from app.recommendation.scorer import RecommendationScorer

from sqlalchemy.pool import StaticPool

# In-memory SQLite DB for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)

@pytest.mark.asyncio
async def test_dynamic_destination_resolution(db):
    # Test transient dynamic resolution of an unseeded destination without DB pollution
    dest = await DestinationIntelligenceService.resolve_dynamic_destination("Spiti Valley")
    assert dest is not None
    assert "Spiti" in dest["name"]
    assert dest["latitude"] > 0
    assert dest["longitude"] > 0
    assert dest["altitude_meters"] > 500
    assert dest["is_dynamic"] is True
    assert dest["is_curated"] is False
    assert len(dest["weather"]) >= 1

    # Verify zero database pollution
    db_dests = db.query(Destination).all()
    assert len(db_dests) == 0

    # Verify resolving a seeded/saved destination from DB works via resolve_destination
    curated = Destination(
        id="dest-curated-1",
        name="Manali",
        slug="manali",
        state="Himachal Pradesh",
        region="Himalayan",
        tagline="Pine valley",
        description="Alpine haven",
        latitude=32.2396,
        longitude=77.1887,
        altitude_meters=2050,
        is_featured=True
    )
    db.add(curated)
    db.commit()

    resolved_curated = await DestinationIntelligenceService.resolve_destination("Manali", db)
    assert resolved_curated is not None
    assert resolved_curated.id == "dest-curated-1"


@pytest.mark.asyncio
async def test_itinerary_generation_with_real_places(db):
    # Create destination and places
    dest = Destination(
        id="dest-test-1",
        name="Manali",
        slug="manali",
        state="Himachal Pradesh",
        region="Himalayan",
        tagline="Pine valley",
        description="Alpine haven",
        latitude=32.2396,
        longitude=77.1887,
        altitude_meters=2050,
        is_featured=True
    )
    db.add(dest)

    p1 = Place(
        id="pl-1",
        destination_id=dest.id,
        name="Old Manali Village",
        slug="old-manali",
        category="Culture & Heritage",
        description="Timber houses and cafes",
        latitude=32.253,
        longitude=77.175,
        price_level="Free",
        approx_cost=0.0,
        rating=4.8,
        review_count=300,
        opening_time="08:00",
        closing_time="20:00",
        tags="Culture,Walking",
        is_must_visit=True,
        is_active=True
    )
    p2 = Place(
        id="pl-2",
        destination_id=dest.id,
        name="Café 1947",
        slug="cafe-1947",
        category="Cafés & Bakery",
        description="Riverside pizza and coffee",
        latitude=32.254,
        longitude=77.173,
        price_level="₹₹",
        approx_cost=400.0,
        rating=4.9,
        review_count=500,
        opening_time="11:00",
        closing_time="23:00",
        tags="Café,Riverside",
        is_must_visit=True,
        is_active=True
    )
    db.add(p1)
    db.add(p2)
    db.commit()

    engine = ItineraryEngine()
    days = engine.generate_trip_itinerary(
        destination=dest,
        all_places=[p1, p2],
        start_date=date(2026, 9, 20),
        end_date=date(2026, 9, 21),
        budget=10000.0,
        companion_type="Friends",
        travel_style="Balanced",
        wake_up_preference="Normal",
        activity_intensity="Balanced",
        interests=["Culture", "Cafés"],
        hotel=None,
        rental=None
    )

    assert len(days) == 2
    assert len(days[0]["items"]) >= 1
    # Check that items have start and end times, costs, and valid coordinates
    for item in days[0]["items"]:
        assert ":" in item["start_time"]
        assert ":" in item["end_time"]
        assert item["estimated_cost"] >= 0

def test_dynamic_replanning_scenarios():
    replanner = DynamicReplanner()
    
    # Mock itinerary and items
    itin = Itinerary(id="it-1", trip_id="tr-1", day_number=1, date=date.today())
    it1 = ItineraryItem(id="item-1", itinerary_id="it-1", title="Solang Valley High Peak Trek", category="Adventure", start_time="09:00", end_time="12:00", duration_mins=180, estimated_cost=800.0, is_locked=False, status="upcoming")
    it2 = ItineraryItem(id="item-2", itinerary_id="it-1", title="Riverside Café Lunch", category="Café", start_time="12:30", end_time="13:30", duration_mins=60, estimated_cost=500.0, is_locked=False, status="upcoming")
    itin.items = [it1, it2]

    cozy_place = Place(id="pl-cozy", destination_id="d1", name="Artisan Bakery & Tea House", slug="artisan-bakery", category="Café", description="Indoor warm haven", latitude=32.25, longitude=77.17, price_level="₹₹", approx_cost=250.0, rating=4.8, is_indoor=True, is_active=True)

    # Test rain replanning (outdoor trek replaced with indoor haven)
    res_rain = replanner.replan_day(itin, action_type="rain", available_places=[cozy_place])
    assert "Indoor Haven" in it1.title or "Café" in it1.category
    assert "shower" in res_rain["message"].lower() or "rain" in res_rain["message"].lower()

    # Test less money replanning
    cheap_place = Place(id="pl-cheap", destination_id="d1", name="Local Dhaba", slug="dhaba", category="Local Food", description="Cheap thali", latitude=32.25, longitude=77.17, price_level="₹", approx_cost=100.0, rating=4.5, is_active=True)
    res_budget = replanner.replan_day(itin, action_type="less_money", available_places=[cheap_place])
    assert "Pocket-Friendly" in it1.title or it1.estimated_cost <= 250
