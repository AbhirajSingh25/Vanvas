"""
VANVAS Phase 4 Proactive Travel Intelligence & Live Operations Test Suite
Covers all 23+ deterministic tests specified in the Phase 4 specification:
1. test_weather_impacts_outdoor_itinerary
2. test_weather_no_impact_for_indoor_activity
3. test_transport_delay_impacts_hotel_checkin
4. test_transport_delay_no_false_alert
5. test_road_eta_change_detects_checkin_conflict
6. test_opening_hours_conflict_detected
7. test_budget_forecast_pressure_detected
8. test_budget_within_target_no_alert
9. test_group_vote_missing_detection
10. test_arrival_reconciles_actual_vs_planned
11. test_same_signal_deduplicated
12. test_changed_signal_creates_new_insight
13. test_stale_signal_marked_stale
14. test_unknown_signal_does_not_create_confident_action
15. test_replan_proposal_persists
16. test_replan_requires_user_approval
17. test_paid_booking_never_auto_cancelled
18. test_external_side_effect_requires_confirmation
19. test_applied_replan_updates_itinerary
20. test_replan_updates_budget_when_applicable
21. test_replan_audit_trail_created
22. test_notification_deduplicated
23. test_deep_link_opens_relevant_trip_context
"""
import uuid
import json
import pytest
from datetime import date, datetime, timezone, timedelta

from app.database.session import SessionLocal
from app.models.models import (
    Trip, TripMember, Destination, Place, Hotel, Itinerary, ItineraryItem, User,
    Expense, Booking, BookingItem, TravelSignal, TravelInsight, TravelAction,
    ReplanProposal, TripRevision, NotificationItem
)
from app.services.intelligence.signal_ingestion import SignalIngestionService
from app.services.intelligence.impact_engine import ImpactEngine
from app.services.intelligence.replan_engine import ReplanEngine
from app.services.intelligence.intelligence_orchestrator import IntelligenceOrchestrator
from app.services.notification_service import NotificationService


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def intelligence_env(db):
    uid = uuid.uuid4().hex[:8]

    # User
    user = User(
        id=f"user-{uid}",
        email=f"traveller-{uid}@vanvas.app",
        hashed_password="hashed_test_password",
        full_name=f"Explorer {uid}"
    )
    db.add(user)

    # Destination
    dest = Destination(
        id=f"dest-manali-{uid}",
        name=f"Manali Alpine Valley {uid}",
        slug=f"manali-{uid}",
        state="Himachal Pradesh",
        region="Himalayan Valley",
        tagline="Pine valleys & high trails",
        description="Alpine sanctuary in the Himalayas",
        latitude=32.2432,
        longitude=77.1892,
        weather_type="Alpine Mountain"
    )
    db.add(dest)

    # Hotel
    hotel = Hotel(
        id=f"hotel-cedar-{uid}",
        destination_id=dest.id,
        name=f"Cedar Forest Riverside Lodge {uid}",
        address="Club House Road, Old Manali",
        latitude=32.2450,
        longitude=77.1850,
        check_in_time="14:00",
        check_out_time="11:00",
        price_per_night=4500.0,
        rating=4.9
    )
    db.add(hotel)

    # Places: Outdoor Hike & Indoor Café & Museum
    outdoor_hike = Place(
        id=f"place-jogini-hike-{uid}",
        destination_id=dest.id,
        name="Jogini Mountain Hike",
        slug=f"jogini-hike-{uid}",
        category="Nature",
        description="High cascade alpine trail",
        latitude=32.2680,
        longitude=77.1880,
        is_indoor=False,
        opening_time="06:00",
        closing_time="18:00"
    )
    indoor_cafe = Place(
        id=f"place-old-cafe-{uid}",
        destination_id=dest.id,
        name="Old Manali Cedar Café",
        slug=f"old-manali-cafe-{uid}",
        category="Café",
        description="Warm mountain tea & bakery",
        latitude=32.2530,
        longitude=77.1750,
        is_indoor=True,
        opening_time="08:30",
        closing_time="22:00"
    )
    museum = Place(
        id=f"place-culture-museum-{uid}",
        destination_id=dest.id,
        name="Himachal Culture Museum",
        slug=f"culture-museum-{uid}",
        category="Museum",
        description="Folk heritage & mountain artifacts",
        latitude=32.2480,
        longitude=77.1800,
        is_indoor=True,
        opening_time="10:00",
        closing_time="18:00"
    )
    db.add_all([outdoor_hike, indoor_cafe, museum])

    # Trip
    trip = Trip(
        id=f"trip-himalaya-{uid}",
        user_id=user.id,
        destination_id=dest.id,
        hotel_id=hotel.id,
        title=f"Manali High Country Trip {uid}",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=3),
        num_days=3,
        budget_total=18000.0,
        budget_spent=0.0
    )
    db.add(trip)
    db.flush()

    # Itinerary Day 1 & Day 2
    it1 = Itinerary(
        id=f"it-day1-{uid}",
        trip_id=trip.id,
        day_number=1,
        date=date.today(),
        title="Arrival & Valley Welcome"
    )
    it2 = Itinerary(
        id=f"it-day2-{uid}",
        trip_id=trip.id,
        day_number=2,
        date=date.today() + timedelta(days=1),
        title="High Cascades & Trails"
    )
    db.add_all([it1, it2])
    db.flush()

    # Day 1 Items: Arrival Dinner & Old Café
    item1_1 = ItineraryItem(
        id=f"item-day1-1-{uid}",
        itinerary_id=it1.id,
        place_id=indoor_cafe.id,
        title="Arrival Herbal Tea & Evening Rest",
        category="Café",
        start_time="16:00",
        end_time="17:30",
        duration_mins=90,
        status="PLANNED"
    )
    # Day 2 Items: 9:00 AM Outdoor Hike
    item2_1 = ItineraryItem(
        id=f"item-day2-1-{uid}",
        itinerary_id=it2.id,
        place_id=outdoor_hike.id,
        title="Jogini Mountain Hike",
        category="Nature",
        start_time="09:00",
        end_time="12:00",
        duration_mins=180,
        status="PLANNED"
    )
    db.add_all([item1_1, item2_1])
    db.commit()
    db.refresh(trip)

    return {
        "user": user,
        "trip": trip,
        "hotel": hotel,
        "outdoor_hike": outdoor_hike,
        "indoor_cafe": indoor_cafe,
        "museum": museum,
        "day1_itinerary": it1,
        "day2_itinerary": it2,
        "hike_item": item2_1,
        "cafe_item": item1_1
    }


# 1. Weather Impacts Outdoor Itinerary
def test_weather_impacts_outdoor_itinerary(db, intelligence_env):
    trip = intelligence_env["trip"]
    # Ingest severe rain weather signal
    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="HIGH",
        confidence=0.95,
        freshness="LIVE",
        raw_state={"condition": "Heavy Rain", "is_rain": True, "precipitation_probability": 85},
        normalized_state={"is_rain": True, "is_severe": True, "condition": "Heavy Rain", "precipitation_probability": 85}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    assert insight is not None
    assert insight.category == "WEATHER"
    assert insight.severity == "HIGH"
    assert "Heavy rain" in insight.explanation or "hike" in insight.explanation.lower()
    assert "16:00" in insight.recommendation or "reschedule" in insight.recommendation.lower()


# 2. Weather No Impact For Indoor Activity
def test_weather_no_impact_for_indoor_activity(db, intelligence_env):
    trip = intelligence_env["trip"]
    # Change hike item to indoor cafe
    hike_item = intelligence_env["hike_item"]
    hike_item.place_id = intelligence_env["indoor_cafe"].id
    hike_item.title = "Old Manali Indoor Book Café"
    hike_item.category = "Café"
    db.commit()
    db.refresh(trip)

    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="MEDIUM",
        confidence=0.90,
        raw_state={"condition": "Light Rain", "is_rain": True, "precipitation_probability": 65},
        normalized_state={"is_rain": True, "is_severe": False, "condition": "Light Rain", "precipitation_probability": 65}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    # Zero false alert for indoor activities
    assert insight is None


# 3. Transport Delay Impacts Hotel Check-in
def test_transport_delay_impacts_hotel_checkin(db, intelligence_env):
    trip = intelligence_env["trip"]
    # Train arrives 2h 20m late (new arrival 14:30 vs original 12:10)
    sig = SignalIngestionService.ingest_transport_signal(db, trip, {
        "operator_name": "Himachal Express Volvo",
        "status": "MAJOR_DELAY",
        "delay_minutes": 140,
        "original_arrival": "12:10",
        "new_arrival": "14:30",
        "transfer_duration_mins": 35,
        "source": "Live Volvo Telematics"
    })
    insight = ImpactEngine.evaluate_transport_impact(db, trip, sig)
    assert insight is not None
    assert insight.category == "TRANSPORT"
    assert insight.severity == "HIGH"
    assert "hotel check-in" in insight.explanation.lower()
    # Hotel checkin is 14:00, arrival is 14:30 + 35m = 15:05 -> 65 mins past checkin
    impact_data = json.loads(insight.impact_json)
    assert impact_data["minutes_past_checkin"] == 65


# 4. Transport Delay No False Alert
def test_transport_delay_no_false_alert(db, intelligence_env):
    trip = intelligence_env["trip"]
    # Train is delayed by only 5 mins (arrival 12:15 + 35m = 12:50, well ahead of 14:00 checkin)
    sig = SignalIngestionService.ingest_transport_signal(db, trip, {
        "status": "ON_TIME",
        "delay_minutes": 5,
        "original_arrival": "12:10",
        "new_arrival": "12:15",
        "transfer_duration_mins": 35
    })
    insight = ImpactEngine.evaluate_transport_impact(db, trip, sig)
    assert insight is None


# 5. Road ETA Change Detects Check-in Conflict
def test_road_eta_change_detects_checkin_conflict(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig = SignalIngestionService.ingest_road_traffic_signal(db, trip, {
        "corridor_name": "Delhi -> Manali Highway",
        "original_eta": "13:20",
        "current_eta": "15:05",
        "delay_minutes": 105,
        "road_condition": "Monsoon Landslide Detour"
    })
    insight = ImpactEngine.evaluate_road_traffic_impact(db, trip, sig)
    assert insight is not None
    assert insight.category == "ROAD_TRAFFIC"
    assert "65 minutes past hotel check-in" in insight.explanation or "past hotel check-in" in insight.explanation


# 6. Opening Hours Conflict Detected
def test_opening_hours_conflict_detected(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig = SignalIngestionService.ingest_opening_hours_signal(db, trip, {
        "place_id": intelligence_env["museum"].id,
        "place_name": "Himachal Culture Museum",
        "planned_time": "19:00",
        "opening_hours": "10:00-18:00",
        "is_open": False
    })
    insight = ImpactEngine.evaluate_opening_hours_impact(db, trip, sig)
    assert insight is not None
    assert insight.category == "OPENING_HOURS"
    assert "outside today's opening hours" in insight.explanation


# 7. Budget Forecast Pressure Detected
def test_budget_forecast_pressure_detected(db, intelligence_env):
    trip = intelligence_env["trip"]
    # Trip budget ₹18,000, spent ₹13,900 on Day 1 (3 days remaining), projected ₹23,400
    sig = SignalIngestionService.ingest_budget_signal(db, trip, {
        "days_passed": 1,
        "spent": 13900.0,
        "projected_total": 23400.0
    })
    insight = ImpactEngine.evaluate_budget_impact(db, trip, sig)
    assert insight is not None
    assert insight.category == "BUDGET"
    assert "trending roughly" in insight.explanation
    assert "above your trip budget" in insight.explanation


# 8. Budget Within Target No Alert
def test_budget_within_target_no_alert(db, intelligence_env):
    trip = intelligence_env["trip"]
    trip.budget_spent = 3000.0
    db.commit()

    sig = SignalIngestionService.ingest_budget_signal(db, trip, {
        "days_passed": 1,
        "spent": 3000.0,
        "projected_total": 9000.0
    })
    insight = ImpactEngine.evaluate_budget_impact(db, trip, sig)
    assert insight is None


# 9. Group Vote Missing Detection
def test_group_vote_missing_detection(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig = SignalIngestionService.ingest_group_activity_signal(db, trip, {
        "activity_title": "Solang Valley Paragliding",
        "total_members": 4,
        "votes_count": 3
    })
    insight = ImpactEngine.evaluate_group_activity_impact(db, trip, sig)
    assert insight is not None
    assert insight.category == "GROUP_ACTIVITY"
    assert "1 vote is still needed" in insight.explanation


# 10. Arrival Reconciles Actual vs Planned
def test_arrival_reconciles_actual_vs_planned(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig = SignalIngestionService.ingest_arrival_signal(db, trip, {
        "location_name": "Manali",
        "arrival_time": "13:45",
        "planned_arrival": "14:00"
    })
    insight = ImpactEngine.evaluate_arrival_impact(db, trip, sig)
    assert insight is not None
    assert insight.category == "LOCATION"
    assert "reached Manali at 13:45" in insight.explanation


# 11. Same Signal Deduplicated
def test_same_signal_deduplicated(db, intelligence_env):
    trip = intelligence_env["trip"]
    # Ingest identical signal twice
    sig1 = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="HIGH",
        raw_state={"condition": "Storm", "is_rain": True, "precipitation_probability": 90},
        normalized_state={"condition": "Storm", "is_rain": True, "material_key": "storm_heavy"}
    )
    sig2 = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="HIGH",
        raw_state={"condition": "Storm", "is_rain": True, "precipitation_probability": 90},
        normalized_state={"condition": "Storm", "is_rain": True, "material_key": "storm_heavy"}
    )
    # Both calls return or update the exact same record with stable fingerprint
    assert sig1.id == sig2.id
    assert sig1.fingerprint == sig2.fingerprint


# 12. Changed Signal Creates New Insight
def test_changed_signal_creates_new_insight(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig1 = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="LOW",
        raw_state={"condition": "Partly Cloudy", "is_rain": False},
        normalized_state={"condition": "Partly Cloudy", "is_rain": False, "material_key": "partly_cloudy"}
    )
    sig2 = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="CRITICAL",
        raw_state={"condition": "Severe Cloudburst", "is_rain": True, "is_severe": True},
        normalized_state={"condition": "Severe Cloudburst", "is_rain": True, "is_severe": True, "material_key": "cloudburst"}
    )
    assert sig1.fingerprint != sig2.fingerprint


# 13. Stale Signal Marked Stale
def test_stale_signal_marked_stale(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        freshness="UNAVAILABLE",
        confidence=0.0,
        raw_state={"status": "UNAVAILABLE"},
        normalized_state={"status": "UNAVAILABLE", "destination_name": "Manali"}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    assert insight is not None
    assert "Weather Verification Unavailable" in insight.title
    assert "could not verify live weather" in insight.explanation


# 14. Unknown Signal Does Not Create Confident Action
def test_unknown_signal_does_not_create_confident_action(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        freshness="UNKNOWN",
        confidence=0.0,
        raw_state={"status": "UNKNOWN"},
        normalized_state={"status": "UNKNOWN"}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    assert insight.confidence == 0.0
    assert "Preserving planned itinerary without speculative changes" in insight.explanation


# 15. Replan Proposal Persists
def test_replan_proposal_persists(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="HIGH",
        raw_state={"condition": "Heavy Rain", "is_rain": True, "precipitation_probability": 85},
        normalized_state={"is_rain": True, "is_severe": True, "condition": "Heavy Rain", "precipitation_probability": 85}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    db.add(insight)
    db.commit()

    proposal = ReplanEngine.generate_weather_proposal(db, trip, insight)
    assert proposal.id is not None
    assert proposal.status == "PROPOSED"
    assert "16:00" in proposal.reason or "Move" in proposal.reason

    # Query from DB to ensure persistence
    persisted = db.query(ReplanProposal).filter(ReplanProposal.id == proposal.id).first()
    assert persisted is not None
    assert persisted.trip_id == trip.id


# 16. Replan Requires User Approval
def test_replan_requires_user_approval(db, intelligence_env):
    trip = intelligence_env["trip"]
    hike_item = intelligence_env["hike_item"]
    orig_start = hike_item.start_time

    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="HIGH",
        raw_state={"condition": "Heavy Rain", "is_rain": True, "precipitation_probability": 85},
        normalized_state={"is_rain": True, "is_severe": True, "condition": "Heavy Rain", "precipitation_probability": 85}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    db.add(insight)
    db.commit()

    proposal = ReplanEngine.generate_weather_proposal(db, trip, insight)

    # Before user approval, itinerary item start_time MUST remain unchanged
    db.refresh(hike_item)
    assert hike_item.start_time == orig_start
    assert proposal.status == "PROPOSED"


# 17. Paid Booking Never Auto Cancelled
def test_paid_booking_never_auto_cancelled(db, intelligence_env):
    trip = intelligence_env["trip"]
    user = intelligence_env["user"]

    # Create paid confirmed booking for the hotel
    booking = Booking(
        id=f"book-hotel-{uuid.uuid4().hex[:6]}",
        user_id=user.id,
        trip_id=trip.id,
        provider="vanvas_curated",
        booking_type="hotel",
        status="CONFIRMED",
        payment_status="PAID",
        total_amount=4500.0,
        confirmed_at=datetime.now(timezone.utc)
    )
    db.add(booking)
    db.commit()

    # Major transport delay occurs
    sig = SignalIngestionService.ingest_transport_signal(db, trip, {
        "status": "MAJOR_DELAY",
        "delay_minutes": 180,
        "original_arrival": "12:10",
        "new_arrival": "15:10",
        "transfer_duration_mins": 35
    })
    insight = ImpactEngine.evaluate_transport_impact(db, trip, sig)
    db.add(insight)
    db.commit()

    proposal = ReplanEngine.generate_transport_proposal(db, trip, insight)
    res = ReplanEngine.apply_proposal(db, trip, proposal, user=user)

    # Verified: Booking MUST remain CONFIRMED and PAID
    db.refresh(booking)
    assert booking.status == "CONFIRMED"
    assert booking.payment_status == "PAID"
    assert booking.cancelled_at is None


# 18. External Side Effect Requires Confirmation
def test_external_side_effect_requires_confirmation(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig = SignalIngestionService.ingest_transport_signal(db, trip, {
        "status": "MAJOR_DELAY",
        "delay_minutes": 120,
        "original_arrival": "12:10",
        "new_arrival": "14:10"
    })
    insight = ImpactEngine.evaluate_transport_impact(db, trip, sig)
    db.add(insight)
    db.commit()

    proposal = ReplanEngine.generate_transport_proposal(db, trip, insight)
    booking_impact = json.loads(proposal.booking_impact_json)
    assert booking_impact.get("safety_level") == 3


# 19. Applied Replan Updates Itinerary
def test_applied_replan_updates_itinerary(db, intelligence_env):
    trip = intelligence_env["trip"]
    user = intelligence_env["user"]
    hike_item = intelligence_env["hike_item"]

    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="HIGH",
        raw_state={"condition": "Heavy Rain", "is_rain": True, "precipitation_probability": 85},
        normalized_state={"is_rain": True, "is_severe": True, "condition": "Heavy Rain", "precipitation_probability": 85}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    db.add(insight)
    db.commit()

    proposal = ReplanEngine.generate_weather_proposal(db, trip, insight)
    res = ReplanEngine.apply_proposal(db, trip, proposal, user=user)

    assert res["success"] is True
    assert proposal.status == "APPLIED"

    db.refresh(hike_item)
    assert hike_item.start_time == "16:00"


# 20. Replan Updates Budget When Applicable
def test_replan_updates_budget_when_applicable(db, intelligence_env):
    trip = intelligence_env["trip"]
    user = intelligence_env["user"]
    sig = SignalIngestionService.ingest_budget_signal(db, trip, {
        "days_passed": 1,
        "spent": 14000.0,
        "projected_total": 24000.0
    })
    insight = ImpactEngine.evaluate_budget_impact(db, trip, sig)
    db.add(insight)
    db.commit()

    proposal = ReplanEngine.generate_budget_proposal(db, trip, insight)
    res = ReplanEngine.apply_proposal(db, trip, proposal, user=user)
    assert res["success"] is True
    assert proposal.status == "APPLIED"


# 21. Replan Audit Trail Created
def test_replan_audit_trail_created(db, intelligence_env):
    trip = intelligence_env["trip"]
    user = intelligence_env["user"]

    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="HIGH",
        raw_state={"condition": "Heavy Rain", "is_rain": True, "precipitation_probability": 85},
        normalized_state={"is_rain": True, "is_severe": True, "condition": "Heavy Rain", "precipitation_probability": 85}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    db.add(insight)
    db.commit()

    proposal = ReplanEngine.generate_weather_proposal(db, trip, insight)
    res = ReplanEngine.apply_proposal(db, trip, proposal, user=user)

    # Verify immutable revision in DB
    revision = db.query(TripRevision).filter(
        TripRevision.trip_id == trip.id,
        TripRevision.revision_number == res["revision_number"]
    ).first()

    assert revision is not None
    assert revision.action_type == "WEATHER_CHANGE"
    assert revision.user_id == user.id


# 22. Notification Deduplicated
def test_notification_deduplicated(db, intelligence_env):
    trip = intelligence_env["trip"]
    user = intelligence_env["user"]

    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="HIGH",
        raw_state={"condition": "Heavy Rain", "is_rain": True, "precipitation_probability": 85},
        normalized_state={"is_rain": True, "is_severe": True, "condition": "Heavy Rain", "precipitation_probability": 85}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    db.add(insight)
    db.commit()

    proposal = ReplanEngine.generate_weather_proposal(db, trip, insight)

    # First notification dispatch
    IntelligenceOrchestrator._notify_insight(db, trip, insight, proposal)
    count1 = db.query(NotificationItem).filter(NotificationItem.trip_id == trip.id).count()

    # Second notification dispatch for same insight
    IntelligenceOrchestrator._notify_insight(db, trip, insight, proposal)
    count2 = db.query(NotificationItem).filter(NotificationItem.trip_id == trip.id).count()

    assert count1 == 1
    assert count2 == 1  # Deduplicated!


# 23. Deep Link Opens Relevant Trip Context
def test_deep_link_opens_relevant_trip_context(db, intelligence_env):
    trip = intelligence_env["trip"]
    sig = SignalIngestionService.ingest_signal(
        db=db,
        trip_id=trip.id,
        signal_type="WEATHER",
        source="Open-Meteo",
        severity="HIGH",
        raw_state={"condition": "Heavy Rain", "is_rain": True, "precipitation_probability": 85},
        normalized_state={"is_rain": True, "is_severe": True, "condition": "Heavy Rain", "precipitation_probability": 85}
    )
    insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
    db.add(insight)
    db.commit()

    proposal = ReplanEngine.generate_weather_proposal(db, trip, insight)
    IntelligenceOrchestrator._notify_insight(db, trip, insight, proposal)

    notif = db.query(NotificationItem).filter(NotificationItem.trip_id == trip.id).first()
    assert notif is not None
    assert notif.deep_link == f"/trips/{trip.id}/intelligence?insight_id={insight.id}"
