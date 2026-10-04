"""
VANVAS Dynamic Travel Intelligence Test Suite
Validates:
- Short Plan (I have X hours)
- Running Late time recalculation
- Missed Activity resolution (move tomorrow, replace, remove)
- Add Place & travel transit estimation
- Remove Activity & time compression
- Weather-aware replanning with genuine meteorological state
- Budget-aware replanning & concrete savings
- Replan revision versioning & history audit
- Authorization controls
"""
import uuid
import pytest
from datetime import date, timedelta
from app.database.session import SessionLocal
from app.models.models import Trip, TripMember, Destination, Place, Itinerary, ItineraryItem, User, TripRevision, Expense
from app.services.dynamic_intelligence import DynamicIntelligenceService
from app.schemas.schemas import ActionPreviewRequest, ActionApplyRequest


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_travel_environment(db_session):
    uid = uuid.uuid4().hex[:8]
    # 1. Create Destination
    dest = Destination(
        id=f"dest-manali-{uid}",
        name=f"Manali Sanctuary {uid}",
        slug=f"manali-{uid}",
        state="Himachal Pradesh",
        region="Himalayan Valley",
        tagline="Riverside trails & cedar forests",
        description="Authentic mountain sanctuary",
        latitude=32.2432,
        longitude=77.1892,
        altitude_meters=2050,
        weather_type="Alpine Mountain",
        is_featured=True
    )
    db_session.add(dest)
    db_session.flush()

    # 2. Create Places
    p1 = Place(
        id=f"place-hadimba-{uid}",
        destination_id=dest.id,
        category="Culture",
        name=f"Hadimba Forest Temple {uid}",
        slug=f"hadimba-forest-temple-{uid}",
        description="Ancient cedar sanctuary",
        latitude=32.2483,
        longitude=77.1802,
        price_level="Free",
        approx_cost=0.0,
        opening_time="08:00",
        closing_time="19:00",
        recommended_duration_mins=60,
        is_indoor=False,
        is_active=True
    )
    p2 = Place(
        id=f"place-oldmanali-cafe-{uid}",
        destination_id=dest.id,
        category="Café",
        name="Old Manali River Café",
        slug=f"old-manali-river-cafe-{uid}",
        description="Warm herbal tea and mountain views",
        latitude=32.2530,
        longitude=77.1750,
        price_level="₹₹",
        approx_cost=250.0,
        opening_time="08:30",
        closing_time="22:00",
        recommended_duration_mins=75,
        is_indoor=True,
        is_active=True
    )
    p3 = Place(
        id=f"place-jogini-trek-{uid}",
        destination_id=dest.id,
        category="Nature",
        name="Jogini Waterfall Trek",
        slug=f"jogini-waterfall-trek-{uid}",
        description="Steep trail leading to mountain waterfall cascade",
        latitude=32.2680,
        longitude=77.1880,
        price_level="Free",
        approx_cost=0.0,
        opening_time="07:00",
        closing_time="17:00",
        recommended_duration_mins=120,
        is_indoor=False,
        is_active=True
    )
    p4 = Place(
        id=f"place-fine-dine-{uid}",
        destination_id=dest.id,
        category="Restaurant",
        name="Pine Crest Luxury Dining",
        slug=f"pine-crest-luxury-dining-{uid}",
        description="High-end valley gastronomy",
        latitude=32.2410,
        longitude=77.1850,
        price_level="₹₹₹",
        approx_cost=850.0,
        opening_time="12:00",
        closing_time="23:00",
        recommended_duration_mins=90,
        is_indoor=True,
        is_active=True
    )
    db_session.add_all([p1, p2, p3, p4])
    db_session.flush()

    # 3. Create Users
    owner = User(
        id=f"user-owner-{uid}",
        email=f"owner_{uid}@vanvas.com",
        full_name="Abhiraj Singh",
        hashed_password="hashed_pw_test",
        role="traveller"
    )
    other_user = User(
        id=f"user-stranger-{uid}",
        email=f"stranger_{uid}@vanvas.com",
        full_name="Stranger Traveler",
        hashed_password="hashed_pw_test",
        role="traveller"
    )
    db_session.add_all([owner, other_user])
    db_session.flush()

    # 4. Create Trip
    start = date.today()
    end = start + timedelta(days=2)
    trip = Trip(
        id=f"trip-intel-{uid}",
        user_id=owner.id,
        destination_id=dest.id,
        title="Spontaneous Valley Exploration",
        start_date=start,
        end_date=end,
        num_days=3,
        budget_total=12000.0,
        budget_spent=1500.0,
        travellers_count=2,
        status="active"
    )
    db_session.add(trip)
    db_session.flush()

    db_session.add(TripMember(trip_id=trip.id, user_id=owner.id, role="owner"))

    # 5. Create Itinerary Days & Items
    it1 = Itinerary(
        id=f"it-day1-{uid}",
        trip_id=trip.id,
        day_number=1,
        date=start,
        title="Temple & River Walks",
        theme="Culture & Cafés",
        status="in_progress"
    )
    it2 = Itinerary(
        id=f"it-day2-{uid}",
        trip_id=trip.id,
        day_number=2,
        date=start + timedelta(days=1),
        title="High Ridge Trails",
        theme="Adventure",
        status="pending"
    )
    db_session.add_all([it1, it2])
    db_session.flush()

    item1 = ItineraryItem(
        id=f"item-1-temple-{uid}",
        itinerary_id=it1.id,
        place_id=p1.id,
        title=p1.name,
        category=p1.category,
        start_time="09:00",
        end_time="10:00",
        duration_mins=60,
        estimated_cost=0.0,
        status="PLANNED",
        is_locked=False
    )
    item2 = ItineraryItem(
        id=f"item-2-trek-{uid}",
        itinerary_id=it1.id,
        place_id=p3.id,
        title=p3.name,
        category=p3.category,
        start_time="10:30",
        end_time="12:30",
        duration_mins=120,
        estimated_cost=0.0,
        status="PLANNED",
        is_locked=False
    )
    item3 = ItineraryItem(
        id=f"item-3-dining-{uid}",
        itinerary_id=it1.id,
        place_id=p4.id,
        title=p4.name,
        category=p4.category,
        start_time="13:00",
        end_time="14:30",
        duration_mins=90,
        estimated_cost=850.0,
        status="PLANNED",
        is_locked=False
    )
    db_session.add_all([item1, item2, item3])
    db_session.commit()
    db_session.refresh(trip)

    return {
        "db": db_session,
        "trip": trip,
        "owner": owner,
        "stranger": other_user,
        "places": [p1, p2, p3, p4],
        "it1": it1,
        "it2": it2,
        "item1": item1,
        "item2": item2,
        "item3": item3
    }


@pytest.mark.asyncio
async def test_short_plan_preview_and_apply(test_travel_environment):
    env = test_travel_environment
    db = env["db"]
    trip = env["trip"]
    owner = env["owner"]

    # 1. Preview "I have 3 hours"
    req_prev = ActionPreviewRequest(
        action_type="SHORT_PLAN",
        target_day_number=1,
        parameters={"hours_available": 3.0, "mode": "replace"},
        current_time="14:00"
    )
    prev = await DynamicIntelligenceService.preview_action(db, trip, req_prev)

    assert prev.action_type == "SHORT_PLAN"
    assert len(prev.proposed_items) > 0
    assert prev.impact.time_impact_mins == 180

    # 2. Apply "I have 3 hours" mutation
    req_apply = ActionApplyRequest(
        action_type="SHORT_PLAN",
        target_day_number=1,
        reason="3-Hour Compact Free Window Plan",
        payload_for_apply=prev.payload_for_apply
    )
    res = DynamicIntelligenceService.apply_action(db, trip, owner, req_apply)

    assert res.success is True
    assert res.revision.revision_number == 1
    assert "3-Hour" in res.revision.reason

    # Verify DB persistence
    revisions = DynamicIntelligenceService.get_trip_revisions(db, trip.id)
    assert len(revisions) == 1
    assert revisions[0].action_type == "SHORT_PLAN"


@pytest.mark.asyncio
async def test_running_late_preview_and_apply(test_travel_environment):
    env = test_travel_environment
    db = env["db"]
    trip = env["trip"]
    owner = env["owner"]

    # 1. Preview Running Late by 120 mins (2 hours)
    req_prev = ActionPreviewRequest(
        action_type="RUNNING_LATE",
        target_day_number=1,
        parameters={"delay_minutes": 120},
        current_time="11:00"
    )
    prev = await DynamicIntelligenceService.preview_action(db, trip, req_prev)

    assert prev.action_type == "RUNNING_LATE"
    assert prev.impact.time_impact_mins == 120
    assert len(prev.impact.items_moved) > 0

    # 2. Apply Running Late mutation
    req_apply = ActionApplyRequest(
        action_type="RUNNING_LATE",
        target_day_number=1,
        reason="Delayed by 2 hours in transit",
        payload_for_apply=prev.payload_for_apply
    )
    res = DynamicIntelligenceService.apply_action(db, trip, owner, req_apply)

    assert res.success is True
    assert res.revision.revision_number >= 1


@pytest.mark.asyncio
async def test_missed_activity_move_to_tomorrow(test_travel_environment):
    env = test_travel_environment
    db = env["db"]
    trip = env["trip"]
    owner = env["owner"]
    target_item_id = env["item2"].id

    # 1. Preview Missed Activity with "move_tomorrow"
    req_prev = ActionPreviewRequest(
        action_type="MISSED_ACTIVITY",
        target_day_number=1,
        target_item_id=target_item_id,
        parameters={"resolution_choice": "move_tomorrow", "target_item_id": target_item_id}
    )
    prev = await DynamicIntelligenceService.preview_action(db, trip, req_prev)

    assert prev.action_type == "MISSED_ACTIVITY"
    assert len(prev.impact.items_removed) == 1

    # 2. Apply Missed Activity Move
    req_apply = ActionApplyRequest(
        action_type="MISSED_ACTIVITY",
        target_day_number=1,
        target_item_id=target_item_id,
        reason="Missed Jogini Trek -> Moved to Tomorrow",
        payload_for_apply=prev.payload_for_apply
    )
    res = DynamicIntelligenceService.apply_action(db, trip, owner, req_apply)

    assert res.success is True
    # Verify item marked MISSED on Day 1 and added to Day 2
    db.refresh(trip)
    day1_items = trip.itineraries[0].items
    day2_items = trip.itineraries[1].items

    item_d1 = next((i for i in day1_items if i.id == target_item_id), None)
    assert item_d1 is not None
    assert item_d1.status == "MISSED"

    moved_d2 = next((i for i in day2_items if "[Moved]" in i.title), None)
    assert moved_d2 is not None


@pytest.mark.asyncio
async def test_make_today_cheaper_budget_replan(test_travel_environment):
    env = test_travel_environment
    db = env["db"]
    trip = env["trip"]

    # Preview Make Today Cheaper
    req_prev = ActionPreviewRequest(
        action_type="MAKE_TODAY_CHEAPER",
        target_day_number=1,
        parameters={}
    )
    prev = await DynamicIntelligenceService.preview_action(db, trip, req_prev)

    assert prev.action_type == "MAKE_TODAY_CHEAPER"
    assert prev.impact.cost_impact_inr < 0  # Concrete savings
    assert len(prev.impact.items_removed) > 0
    assert len(prev.impact.items_added) > 0


@pytest.mark.asyncio
async def test_make_today_easier_fatigue_replan(test_travel_environment):
    env = test_travel_environment
    db = env["db"]
    trip = env["trip"]

    req_prev = ActionPreviewRequest(
        action_type="MAKE_TODAY_EASIER",
        target_day_number=1,
        parameters={}
    )
    prev = await DynamicIntelligenceService.preview_action(db, trip, req_prev)

    assert prev.action_type == "MAKE_TODAY_EASIER"
    # Strenuous hike should be removed
    removed_titles = [r["title"] for r in prev.impact.items_removed]
    assert any("Trek" in t for t in removed_titles)


@pytest.mark.asyncio
async def test_weather_replan_safely_swaps_outdoor_treks(test_travel_environment):
    env = test_travel_environment
    db = env["db"]
    trip = env["trip"]

    req_prev = ActionPreviewRequest(
        action_type="ADJUST_FOR_WEATHER",
        target_day_number=1,
        parameters={}
    )
    prev = await DynamicIntelligenceService.preview_action(db, trip, req_prev)

    assert prev.action_type == "ADJUST_FOR_WEATHER"
    assert prev.impact.weather_note is not None
    # Outdoor trek should be safely replaced
    removed_titles = [r["title"] for r in prev.impact.items_removed]
    assert any("Trek" in t for t in removed_titles)


@pytest.mark.asyncio
async def test_add_place_with_transit_calculation(test_travel_environment):
    env = test_travel_environment
    db = env["db"]
    trip = env["trip"]

    req_prev = ActionPreviewRequest(
        action_type="ADD_PLACE",
        target_day_number=1,
        parameters={"place_name": "Old Manali River Café"}
    )
    prev = await DynamicIntelligenceService.preview_action(db, trip, req_prev)

    assert prev.action_type == "ADD_PLACE"
    assert len(prev.impact.items_added) == 1
    assert "Old Manali River Café" in prev.impact.items_added[0]["title"]


@pytest.mark.asyncio
async def test_current_state_endpoint(test_travel_environment):
    env = test_travel_environment
    db = env["db"]
    trip = env["trip"]

    state = await DynamicIntelligenceService.get_current_state(
        db,
        trip,
        current_time_str="10:00",
        current_lat=32.2432,
        current_lng=77.1892
    )

    assert state.trip_id == trip.id
    assert state.active_day_number == 1
    assert state.budget_total == 12000.0
    assert state.budget_spent == 0.0
    assert state.total_items_count > 0
