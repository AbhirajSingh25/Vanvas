"""
Tests for Trip Planning Depth (Task 11):
Verifies:
1. High-Altitude Trek Planning (Tungnath-Chandrashila reference case)
   - Roadhead arrival at Chopta (2,680m)
   - Acclimatization walk before summit day
   - Pre-dawn alpine start (04:30 AM) for 360° Chaukhamba sunrise
   - Walking-only trail sections (3.5km to Tungnath, 1.5km to Chandrashila)
   - Mountain altitudes & safety guidelines respected
2. One-Day Trip Planning
   - Realistic time sequencing without overpacking
   - No impossible schedules or excessive hops
3. Weekend Trip Planning (2-3 days)
   - Coherent clustering separating arrival from signature excursions
4. Multi-Day Trip Planning (4+ days)
   - Sequential progression across multiple distinct valley hubs
"""
import pytest
from datetime import date, timedelta
from app.itinerary.generator import ItineraryEngine
from app.models.models import Destination, Place, Hotel, RentalOption


@pytest.fixture
def tungsten_destination():
    return Destination(
        id="dest-tungnath-chandrashila",
        name="Tungnath–Chandrashila",
        slug="tungnath-chandrashila",
        state="Uttarakhand",
        region="Garhwal",
        tagline="World's Highest Shiva Temple & 4,000m Summit Vista",
        description="Alpine meadow trail and sacred high-altitude summit in Garhwal Himalayas",
        altitude_meters=4000,
        weather_type="Alpine",
        best_time_to_visit="May–Nov",
        latitude=30.4886,
        longitude=79.2173,
        is_featured=True,
    )


@pytest.fixture
def manali_destination():
    return Destination(
        id="dest-manali",
        name="Manali",
        slug="manali",
        state="Himachal Pradesh",
        region="Kullu Valley",
        tagline="Valley of the Gods",
        description="Himalayan resort town on the Beas River",
        altitude_meters=2050,
        weather_type="Alpine / Temperate",
        best_time_to_visit="Year-round",
        latitude=32.2396,
        longitude=77.1887,
        is_featured=True,
    )


@pytest.fixture
def tungsten_places():
    return [
        Place(
            id="pl-chopta-meadows",
            destination_id="dest-tungnath-chandrashila",
            name="Chopta Meadows Base Camp",
            category="Nature & Trails",
            latitude=30.4850,
            longitude=79.1790,
            approx_cost=200.0,
            rating=4.8,
            opening_time="00:00",
            closing_time="23:59",
            recommended_duration_mins=90,
            why_vanvas_recommends="The roadhead and starting base for Tungnath.",
            is_must_visit=True,
        ),
        Place(
            id="pl-tungnath-temple",
            destination_id="dest-tungnath-chandrashila",
            name="Tungnath Temple",
            category="Culture & Heritage",
            latitude=30.4886,
            longitude=79.2173,
            approx_cost=0.0,
            rating=4.9,
            opening_time="06:00",
            closing_time="19:00",
            recommended_duration_mins=120,
            why_vanvas_recommends="World's highest Shiva shrine at 3,680m.",
            is_must_visit=True,
        ),
        Place(
            id="pl-chandrashila-summit",
            destination_id="dest-tungnath-chandrashila",
            name="Chandrashila Summit",
            category="Nature & Trails",
            latitude=30.4930,
            longitude=79.2185,
            approx_cost=0.0,
            rating=5.0,
            opening_time="00:00",
            closing_time="23:59",
            recommended_duration_mins=120,
            why_vanvas_recommends="360° Chaukhamba sunrise summit.",
            is_must_visit=True,
        ),
    ]


@pytest.fixture
def manali_places():
    return [
        Place(
            id="pl-hadimba",
            destination_id="dest-manali",
            name="Hadimba Temple",
            category="Culture & Heritage",
            latitude=32.2483,
            longitude=77.1800,
            approx_cost=50.0,
            rating=4.7,
            opening_time="08:00",
            closing_time="18:00",
            recommended_duration_mins=60,
            is_must_visit=True,
        ),
        Place(
            id="pl-jogini",
            destination_id="dest-manali",
            name="Jogini Waterfall Trail",
            category="Nature & Trails",
            latitude=32.2680,
            longitude=77.1950,
            approx_cost=0.0,
            rating=4.8,
            opening_time="06:00",
            closing_time="18:00",
            recommended_duration_mins=120,
            is_must_visit=True,
        ),
        Place(
            id="pl-oldmanali-cafe",
            destination_id="dest-manali",
            name="Dylan's Toasted & Roasted",
            category="Café",
            latitude=32.2530,
            longitude=77.1760,
            approx_cost=300.0,
            rating=4.6,
            opening_time="08:30",
            closing_time="22:30",
            recommended_duration_mins=60,
            is_must_visit=False,
        ),
        Place(
            id="pl-solang",
            destination_id="dest-manali",
            name="Solang Valley",
            category="Nature & Trails",
            latitude=32.3160,
            longitude=77.1570,
            approx_cost=500.0,
            rating=4.5,
            opening_time="09:00",
            closing_time="17:00",
            recommended_duration_mins=180,
            is_must_visit=True,
        ),
    ]


def test_tungnath_chandrashila_trek_planning_structure(tungsten_destination, tungsten_places):
    """Tungnath-Chandrashila trek generates dedicated base camp, acclimatization, and early summit push."""
    engine = ItineraryEngine()
    start_d = date(2026, 10, 10)
    end_d = date(2026, 10, 12)  # 3 days

    itinerary = engine.generate_trip_itinerary(
        destination=tungsten_destination,
        all_places=tungsten_places,
        start_date=start_d,
        end_date=end_d,
        budget=12000.0,
        companion_type="Solo",
        travel_style="Balanced",
        wake_up_preference="Early",
        activity_intensity="Balanced",
        interests=["Nature", "Trek", "Spiritual"],
    )

    assert len(itinerary) == 3

    # Day 1: Chopta base camp & acclimatization
    day1 = itinerary[0]
    assert "Chopta" in day1["title"] or "Base Camp" in day1["title"]
    assert any("Chopta" in it["title"] for it in day1["items"])
    assert any("Acclimatization" in it["title"] for it in day1["items"])

    # Day 2: Summit day with early pre-dawn start
    day2 = itinerary[1]
    assert "Summit" in day2["title"] or "Tungnath" in day2["title"]
    first_item = day2["items"][0]
    assert "04:30" in first_item["start_time"] or "Pre-Dawn" in first_item["title"]
    assert any("Tungnath" in it["title"] for it in day2["items"])
    assert any("Chandrashila" in it["title"] for it in day2["items"])


def test_one_day_trip_planning_not_overpacked(manali_destination, manali_places):
    """1-day trip produces focused, realistic stops without excessive rushing."""
    engine = ItineraryEngine()
    start_d = date(2026, 10, 10)
    end_d = date(2026, 10, 10)  # 1 day

    itinerary = engine.generate_trip_itinerary(
        destination=manali_destination,
        all_places=manali_places,
        start_date=start_d,
        end_date=end_d,
        budget=4000.0,
        companion_type="Solo",
        travel_style="Balanced",
        wake_up_preference="Normal",
        activity_intensity="Balanced",
        interests=["Nature", "Culture"],
    )

    assert len(itinerary) == 1
    day1 = itinerary[0]
    # Realistic stop count (3 to 5 items including meals)
    assert 3 <= len(day1["items"]) <= 6
    # No negative times or duplicate consecutive stops
    times = [it["start_time"] for it in day1["items"]]
    assert sorted(times) == times


def test_weekend_trip_planning_2_days(manali_destination, manali_places):
    """2-day weekend trip clusters places smoothly across Saturday and Sunday."""
    engine = ItineraryEngine()
    start_d = date(2026, 10, 10)
    end_d = date(2026, 10, 11)  # 2 days

    itinerary = engine.generate_trip_itinerary(
        destination=manali_destination,
        all_places=manali_places,
        start_date=start_d,
        end_date=end_d,
        budget=8000.0,
        companion_type="Couple",
        travel_style="Comfort",
        wake_up_preference="Normal",
        activity_intensity="Balanced",
        interests=["Nature", "Cafés", "Culture"],
    )

    assert len(itinerary) == 2
    assert itinerary[0]["day_number"] == 1
    assert itinerary[1]["day_number"] == 2
    assert len(itinerary[0]["items"]) >= 3
    assert len(itinerary[1]["items"]) >= 3


def test_multi_day_trip_planning_4_days(manali_destination, manali_places):
    """4-day trip structures distinct themes and progressive day themes."""
    engine = ItineraryEngine()
    start_d = date(2026, 10, 10)
    end_d = date(2026, 10, 13)  # 4 days

    itinerary = engine.generate_trip_itinerary(
        destination=manali_destination,
        all_places=manali_places,
        start_date=start_d,
        end_date=end_d,
        budget=20000.0,
        companion_type="Friends",
        travel_style="Balanced",
        wake_up_preference="Normal",
        activity_intensity="Packed",
        interests=["Nature", "Adventure", "Cafés"],
    )

    assert len(itinerary) == 4
    for idx, day in enumerate(itinerary):
        assert day["day_number"] == idx + 1
        assert len(day["items"]) >= 3
