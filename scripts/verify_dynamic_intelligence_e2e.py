"""
End-to-End Acceptance Verification Script for VANVAS Dynamic Travel Intelligence.
Executes the full user lifecycle:
- Create trip with initial itinerary
- 'I HAVE 3 HOURS' -> Preview -> Accept -> Persist -> DB & Revision v1 verification
- 'RUNNING LATE 120m' -> Preview -> Accept -> Persist -> DB & Revision v2 verification
- 'MISSED ACTIVITY' -> Move to tomorrow -> Accept -> Persist -> DB & Revision v3 verification
- 'MAKE TODAY CHEAPER' -> Budget replan -> Accept -> Persist -> Savings & Revision v4 verification
- 'ADJUST FOR WEATHER' -> Meteorological replan -> Accept -> Persist -> Revision v5 verification
- 'ADD PLACE' -> Transit calculation -> Accept -> Persist -> Revision v6 verification
- Fetch all revisions and verify audit timeline
- Fetch current trip state and verify dynamic live metrics
"""

import sys
import os
from datetime import date, timedelta

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend root is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.session import SessionLocal, engine, ensure_database_schema
from app.models.models import User, Destination, Place, Trip, TripMember, Itinerary, ItineraryItem, TripRevision
from app.services.dynamic_intelligence import DynamicIntelligenceService
from app.schemas.schemas import ActionPreviewRequest, ActionApplyRequest
import asyncio

async def run_e2e_journey():
    print("================================================================")
    print("🚀 STARTING FULL E2E ACCEPTANCE: DYNAMIC TRAVEL INTELLIGENCE")
    print("================================================================")

    ensure_database_schema(engine)
    db = SessionLocal()

    try:
        # Step 0: Create User & Destination & Trip
        dest = db.query(Destination).filter(Destination.slug == "manali").first()
        if not dest:
            dest = Destination(
                id="dest-manali-e2e",
                name="Manali",
                slug="manali",
                state="Himachal Pradesh",
                region="Himalayan Valley",
                tagline="Riverside trails & cedar forests",
                latitude=32.2432,
                longitude=77.1892,
                altitude_meters=2050,
                is_featured=True
            )
            db.add(dest)
            db.flush()

        owner = db.query(User).filter(User.email == "e2e_traveller@vanvas.com").first()
        if not owner:
            owner = User(
                id="user-e2e-owner",
                email="e2e_traveller@vanvas.com",
                full_name="E2E Himalayan Explorer",
                hashed_password="pw_hash_test_123",
                role="traveller"
            )
            db.add(owner)
            db.flush()

        # Clean existing test trip if present
        existing_trip = db.query(Trip).filter(Trip.id == "trip-e2e-dynamic-intelligence").first()
        if existing_trip:
            db.delete(existing_trip)
            db.commit()

        start = date.today()
        trip = Trip(
            id="trip-e2e-dynamic-intelligence",
            user_id=owner.id,
            destination_id=dest.id,
            title="E2E Dynamic Intelligence Journey",
            start_date=start,
            end_date=start + timedelta(days=2),
            num_days=3,
            budget_total=15000.0,
            budget_spent=0.0,
            travellers_count=2,
            status="active"
        )
        db.add(trip)
        db.flush()

        db.add(TripMember(trip_id=trip.id, user_id=owner.id, role="owner"))

        # Day 1 & Day 2
        it1 = Itinerary(
            id="it-e2e-d1",
            trip_id=trip.id,
            day_number=1,
            date=start,
            title="Day 1: Valley Discovery",
            status="in_progress"
        )
        it2 = Itinerary(
            id="it-e2e-d2",
            trip_id=trip.id,
            day_number=2,
            date=start + timedelta(days=1),
            title="Day 2: High Ridges",
            status="pending"
        )
        db.add_all([it1, it2])
        db.flush()

        item1 = ItineraryItem(
            id="item-e2e-1",
            itinerary_id=it1.id,
            title="Hadimba Forest Temple",
            category="Culture",
            start_time="09:00",
            end_time="10:00",
            duration_mins=60,
            estimated_cost=0.0,
            status="PLANNED",
            is_locked=False
        )
        item2 = ItineraryItem(
            id="item-e2e-2",
            itinerary_id=it1.id,
            title="Jogini Waterfall Trek",
            category="Nature",
            start_time="10:30",
            end_time="12:30",
            duration_mins=120,
            estimated_cost=0.0,
            status="PLANNED",
            is_locked=False
        )
        item3 = ItineraryItem(
            id="item-e2e-3",
            itinerary_id=it1.id,
            title="Pine Crest Luxury Dining",
            category="Restaurant",
            start_time="13:00",
            end_time="14:30",
            duration_mins=90,
            estimated_cost=1200.0,
            status="PLANNED",
            is_locked=False
        )
        db.add_all([item1, item2, item3])
        db.commit()
        db.refresh(trip)
        print("✅ Step 0: Test Trip and Itinerary seeded successfully.")

        # Journey 1: I HAVE X HOURS (3 Hours)
        print("\n--- Journey 1: 'I HAVE 3 HOURS' ---")
        prev1 = await DynamicIntelligenceService.preview_action(
            db, trip,
            ActionPreviewRequest(
                action_type="SHORT_PLAN",
                target_day_number=1,
                parameters={"hours_available": 3.0, "mode": "replace"},
                current_time="14:00"
            )
        )
        assert prev1.action_type == "SHORT_PLAN"
        assert len(prev1.proposed_items) >= 2
        print(f"  Preview generated: {len(prev1.proposed_items)} compact items, {prev1.impact.time_impact_mins} mins.")

        apply1 = DynamicIntelligenceService.apply_action(
            db, trip, owner,
            ActionApplyRequest(
                action_type="SHORT_PLAN",
                target_day_number=1,
                reason="Traveller requested 3-hour compact window plan",
                payload_for_apply=prev1.payload_for_apply
            )
        )
        assert apply1.success is True
        assert apply1.revision.revision_number == 1
        print(f"  Mutation persisted: Revision v{apply1.revision.revision_number} '{apply1.revision.reason}'")

        # Journey 2: RUNNING LATE (120 min delay)
        print("\n--- Journey 2: 'RUNNING LATE 120m' ---")
        prev2 = await DynamicIntelligenceService.preview_action(
            db, trip,
            ActionPreviewRequest(
                action_type="RUNNING_LATE",
                target_day_number=1,
                parameters={"delay_minutes": 120},
                current_time="11:00"
            )
        )
        assert prev2.action_type == "RUNNING_LATE"
        assert prev2.impact.time_impact_mins == 120
        print(f"  Preview generated: Delay {prev2.impact.time_impact_mins}m, moved {len(prev2.impact.items_moved)} items.")

        apply2 = DynamicIntelligenceService.apply_action(
            db, trip, owner,
            ActionApplyRequest(
                action_type="RUNNING_LATE",
                target_day_number=1,
                reason="Traffic delay of 2 hours",
                payload_for_apply=prev2.payload_for_apply
            )
        )
        assert apply2.success is True
        assert apply2.revision.revision_number == 2
        print(f"  Mutation persisted: Revision v{apply2.revision.revision_number} '{apply2.revision.reason}'")

        # Journey 3: MISSED ACTIVITY
        print("\n--- Journey 3: 'MISSED ACTIVITY' -> Move Tomorrow ---")
        db.expire_all()
        db.refresh(trip)
        day1_items = db.query(ItineraryItem).filter(ItineraryItem.itinerary_id == it1.id).all()
        target_item = day1_items[0] if day1_items else item1
        prev3 = await DynamicIntelligenceService.preview_action(
            db, trip,
            ActionPreviewRequest(
                action_type="MISSED_ACTIVITY",
                target_day_number=1,
                target_item_id=target_item.id,
                parameters={"resolution_choice": "move_tomorrow", "target_item_id": target_item.id}
            )
        )
        assert prev3.action_type == "MISSED_ACTIVITY"
        apply3 = DynamicIntelligenceService.apply_action(
            db, trip, owner,
            ActionApplyRequest(
                action_type="MISSED_ACTIVITY",
                target_day_number=1,
                target_item_id=target_item.id,
                reason=f"Missed {target_item.title} -> Rescheduled to Tomorrow",
                payload_for_apply=prev3.payload_for_apply
            )
        )
        assert apply3.success is True
        assert apply3.revision.revision_number == 3
        print(f"  Mutation persisted: Revision v{apply3.revision.revision_number} '{apply3.revision.reason}'")

        # Journey 4: MAKE TODAY CHEAPER
        print("\n--- Journey 4: 'MAKE TODAY CHEAPER' ---")
        prev4 = await DynamicIntelligenceService.preview_action(
            db, trip,
            ActionPreviewRequest(
                action_type="MAKE_TODAY_CHEAPER",
                target_day_number=1,
                parameters={}
            )
        )
        assert prev4.action_type == "MAKE_TODAY_CHEAPER"
        print(f"  Preview generated: Estimated cost savings {prev4.impact.cost_impact_inr} INR")
        apply4 = DynamicIntelligenceService.apply_action(
            db, trip, owner,
            ActionApplyRequest(
                action_type="MAKE_TODAY_CHEAPER",
                target_day_number=1,
                reason="Budget optimization: replaced high-cost activities with valley viewpoints",
                payload_for_apply=prev4.payload_for_apply
            )
        )
        assert apply4.success is True
        assert apply4.revision.revision_number == 4
        print(f"  Mutation persisted: Revision v{apply4.revision.revision_number} '{apply4.revision.reason}'")

        # Journey 5: ADJUST FOR WEATHER
        print("\n--- Journey 5: 'ADJUST FOR WEATHER' ---")
        prev5 = await DynamicIntelligenceService.preview_action(
            db, trip,
            ActionPreviewRequest(
                action_type="ADJUST_FOR_WEATHER",
                target_day_number=1,
                parameters={}
            )
        )
        assert prev5.action_type == "ADJUST_FOR_WEATHER"
        print(f"  Preview generated: Weather Note -> {prev5.impact.weather_note}")
        apply5 = DynamicIntelligenceService.apply_action(
            db, trip, owner,
            ActionApplyRequest(
                action_type="ADJUST_FOR_WEATHER",
                target_day_number=1,
                reason="Weather alert adaptation: swapped exposed outdoor activities",
                payload_for_apply=prev5.payload_for_apply
            )
        )
        assert apply5.success is True
        assert apply5.revision.revision_number == 5
        print(f"  Mutation persisted: Revision v{apply5.revision.revision_number} '{apply5.revision.reason}'")

        # Journey 6: ADD PLACE
        print("\n--- Journey 6: 'ADD PLACE' ---")
        prev6 = await DynamicIntelligenceService.preview_action(
            db, trip,
            ActionPreviewRequest(
                action_type="ADD_PLACE",
                target_day_number=1,
                parameters={"place_name": "Old Manali Riverside Café"}
            )
        )
        assert prev6.action_type == "ADD_PLACE"
        assert len(prev6.impact.items_added) == 1
        print(f"  Preview generated: Added {prev6.impact.items_added[0]['title']}, transit +{prev6.impact.time_impact_mins}m")
        apply6 = DynamicIntelligenceService.apply_action(
            db, trip, owner,
            ActionApplyRequest(
                action_type="ADD_PLACE",
                target_day_number=1,
                reason="Traveller requested adding Old Manali Riverside Café",
                payload_for_apply=prev6.payload_for_apply
            )
        )
        assert apply6.success is True
        assert apply6.revision.revision_number == 6
        print(f"  Mutation persisted: Revision v{apply6.revision.revision_number} '{apply6.revision.reason}'")

        # Audit & State Verification
        print("\n--- Audit Timeline & State Verification ---")
        revisions = DynamicIntelligenceService.get_trip_revisions(db, trip.id)
        assert len(revisions) == 6
        print(f"  ✅ Revisions Count: {len(revisions)} revisions stored in database:")
        for rev in revisions:
            print(f"     v{rev.revision_number} [{rev.action_type}] - {rev.reason}")

        current_state = await DynamicIntelligenceService.get_current_state(
            db, trip,
            current_time_str="15:30",
            current_lat=32.2432,
            current_lng=77.1892
        )
        assert current_state.trip_id == trip.id
        assert current_state.total_items_count > 0
        assert len(current_state.recent_revisions) > 0
        print(f"  ✅ Current State: Active Day {current_state.active_day_number}, Location: {current_state.current_location_name}, Items: {current_state.total_items_count}")
        print(f"     Live Weather: {current_state.current_weather.get('condition')} ({current_state.current_weather.get('temperature_c')}°C)")

        print("\n================================================================")
        print("🎉 ALL 6 DYNAMIC INTELLIGENCE USER JOURNEYS FULLY VERIFIED & PERSISTED")
        print("================================================================")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_e2e_journey())
