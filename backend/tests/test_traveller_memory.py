import pytest
from datetime import datetime, timezone, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import Base, get_db, ensure_database_schema
from app.core.security import get_password_hash, create_access_token
from app.models.models import User, UserPreference, TravellerMemory, MemoryObservation, Trip, TripMember, Destination, Place
from app.services.traveller_memory_service import TravellerMemoryService
from app.recommendation.scorer import RecommendationScorer
from app.itinerary.generator import ItineraryEngine
from app.services.copilot_context import CopilotContextEngine

# Test DB Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_db():
    ensure_database_schema(test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def create_test_user(email="traveller@vanvas.com", full_name="Aarav Sharma"):
    db = TestingSessionLocal()
    try:
        user = User(
            id=f"usr-{email.split('@')[0]}",
            email=email,
            hashed_password=get_password_hash("mountainPass123!"),
            full_name=full_name,
            email_verified_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc)
        )
        db.add(user)
        pref = UserPreference(
            user_id=user.id,
            preferred_travel_style="Balanced",
            activity_intensity="Balanced",
            memory_learning_enabled=True,
            memory_learning_paused=False
        )
        db.add(pref)
        db.commit()
        return user.id
    finally:
        db.close()

def auth_headers(user_id: str):
    token = create_access_token(user_id)
    return {"Authorization": f"Bearer {token}"}

# =========================================================================
# 1. EXPLICIT PREFERENCE PERSISTENCE & LIFECYCLE
# =========================================================================

def test_explicit_preference_create_and_fetch():
    user_id = create_test_user("explicit_test@vanvas.com")
    headers = auth_headers(user_id)
    
    # Create explicit preference
    create_resp = client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={
            "category": "timing",
            "preference_key": "early_starts",
            "preference_value": "avoid",
            "trip_id": None
        }
    )
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert data["category"] == "timing"
    assert data["preference_key"] == "early_starts"
    assert data["preference_value"] == "avoid"
    assert data["memory_type"] == "EXPLICIT"
    assert data["confidence"] == 1.0
    assert data["status"] == "ACTIVE"

    # Fetch active memories
    get_resp = client.get("/api/v1/memory", headers=headers)
    assert get_resp.status_code == 200
    mems = get_resp.json()
    assert len(mems) == 1
    assert mems[0]["preference_key"] == "early_starts"

def test_explicit_preference_update():
    user_id = create_test_user("update_test@vanvas.com")
    headers = auth_headers(user_id)
    
    client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={"category": "planning_style", "preference_key": "pace", "preference_value": "relaxed"}
    )
    
    # Update preference to packed
    up_resp = client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={"category": "planning_style", "preference_key": "pace", "preference_value": "packed"}
    )
    assert up_resp.status_code == 201
    assert up_resp.json()["preference_value"] == "packed"
    
    # Verify only 1 active memory exists with the updated value
    get_resp = client.get("/api/v1/memory", headers=headers)
    mems = get_resp.json()
    assert len(mems) == 1
    assert mems[0]["preference_value"] == "packed"

# =========================================================================
# 2. DETERMINISTIC OBSERVATION & INFERENCE ENGINE
# =========================================================================

def test_single_observation_does_not_create_inferred_preference():
    user_id = create_test_user("single_obs@vanvas.com")
    db = TestingSessionLocal()
    try:
        # 1 observation of choosing hiking
        obs = TravellerMemoryService.record_observation(
            db=db,
            user_id=user_id,
            category="activities",
            event_type="activity_selected",
            observed_key="hiking",
            observed_value="hiking",
            idempotency_key="evt-1"
        )
        assert obs is not None
        
        # Check active memories - should be 0 (threshold is >= 2)
        active = TravellerMemoryService.get_active_memories(db=db, user_id=user_id)
        assert len(active) == 0
    finally:
        db.close()

def test_repeated_observations_create_tentative_inference():
    user_id = create_test_user("repeated_obs@vanvas.com")
    db = TestingSessionLocal()
    try:
        # 1st observation
        TravellerMemoryService.record_observation(
            db=db,
            user_id=user_id,
            category="activities",
            event_type="activity_selected",
            observed_key="hiking",
            observed_value="hiking",
            idempotency_key="evt-1"
        )
        # 2nd observation -> meets threshold of 2!
        TravellerMemoryService.record_observation(
            db=db,
            user_id=user_id,
            category="activities",
            event_type="activity_selected",
            observed_key="hiking",
            observed_value="hiking",
            idempotency_key="evt-2"
        )
        
        active = TravellerMemoryService.get_active_memories(db=db, user_id=user_id)
        assert len(active) == 1
        inf_mem = active[0]
        assert inf_mem.memory_type == "INFERRED"
        assert inf_mem.preference_key == "hiking"
        assert inf_mem.preference_value == "hiking"
        assert inf_mem.confidence >= 0.6
        assert inf_mem.evidence_count == 2
        assert "Observed 2" in inf_mem.provenance_summary
    finally:
        db.close()

def test_confirm_inferred_preference():
    user_id = create_test_user("confirm_test@vanvas.com")
    headers = auth_headers(user_id)
    db = TestingSessionLocal()
    try:
        for i in range(2):
            TravellerMemoryService.record_observation(
                db=db,
                user_id=user_id,
                category="accommodation",
                event_type="stay_selected",
                observed_key="stay_type",
                observed_value="homestay",
                idempotency_key=f"evt-stay-{i}"
            )
        active = TravellerMemoryService.get_active_memories(db=db, user_id=user_id)
        assert len(active) == 1
        mem_id = active[0].id
    finally:
        db.close()
    
    # Confirm via API
    conf_resp = client.post(f"/api/v1/memory/{mem_id}/confirm", headers=headers)
    assert conf_resp.status_code == 200
    cdata = conf_resp.json()
    assert cdata["confirmation_status"] == "CONFIRMED"
    assert cdata["confidence"] == 1.0

def test_explicit_correction_overrides_inferred_preference():
    user_id = create_test_user("override_test@vanvas.com")
    db = TestingSessionLocal()
    try:
        # Create inferred preference for boutique hotel
        for i in range(3):
            TravellerMemoryService.record_observation(
                db=db,
                user_id=user_id,
                category="accommodation",
                event_type="stay_selected",
                observed_key="stay_type",
                observed_value="boutique hotel",
                idempotency_key=f"evt-hotel-{i}"
            )
        active = TravellerMemoryService.get_active_memories(db=db, user_id=user_id)
        assert len(active) == 1
        assert active[0].preference_value == "boutique hotel"
        
        # User explicitly says they prefer hostel
        explicit_mem = TravellerMemoryService.create_or_update_explicit_preference(
            db=db,
            user_id=user_id,
            category="accommodation",
            preference_key="stay_type",
            preference_value="hostel"
        )
        
        # Resolved active memories must prioritize EXPLICIT "hostel"
        active_now = TravellerMemoryService.get_active_memories(db=db, user_id=user_id)
        assert len(active_now) == 1
        assert active_now[0].preference_value == "hostel"
        assert active_now[0].memory_type == "EXPLICIT"
    finally:
        db.close()

# =========================================================================
# 3. TRIP-SPECIFIC PREFERENCES & PRECEDENCE
# =========================================================================

def test_trip_specific_preference_isolation():
    user_id = create_test_user("trip_scope_test@vanvas.com")
    db = TestingSessionLocal()
    try:
        # 1. Global explicit preference: pace = relaxed
        TravellerMemoryService.create_or_update_explicit_preference(
            db=db,
            user_id=user_id,
            category="planning_style",
            preference_key="pace",
            preference_value="relaxed"
        )
        
        # 2. Trip-specific temporary constraint: pace = packed for trip-weekend-42
        TravellerMemoryService.create_or_update_explicit_preference(
            db=db,
            user_id=user_id,
            category="planning_style",
            preference_key="pace",
            preference_value="packed",
            trip_id="trip-weekend-42",
            is_trip_specific=True
        )
        
        # Global context (no trip_id specified) should still see relaxed
        global_active = TravellerMemoryService.get_active_memories(db=db, user_id=user_id, trip_id=None)
        assert len(global_active) == 1
        assert global_active[0].preference_value == "relaxed"
        
        # Trip-weekend-42 context should see packed (TRIP_SPECIFIC takes precedence)
        trip_active = TravellerMemoryService.get_active_memories(db=db, user_id=user_id, trip_id="trip-weekend-42")
        assert len(trip_active) == 1
        assert trip_active[0].preference_value == "packed"
        assert trip_active[0].memory_type == "TRIP_SPECIFIC"
    finally:
        db.close()

# =========================================================================
# 4. LEARNING TOGGLE GOVERNANCE
# =========================================================================

def test_disabled_learning_blocks_observations_and_inferences():
    user_id = create_test_user("disabled_learn@vanvas.com")
    db = TestingSessionLocal()
    try:
        # Disable learning
        TravellerMemoryService.update_learning_settings(db=db, user_id=user_id, enabled=False, paused=False)
        
        # Attempt to record 3 observations
        for i in range(3):
            obs = TravellerMemoryService.record_observation(
                db=db,
                user_id=user_id,
                category="activities",
                event_type="activity_selected",
                observed_key="cafes",
                observed_value="cafes",
                idempotency_key=f"evt-cafe-{i}"
            )
            assert obs is None  # Dropped because learning is disabled
            
        active = TravellerMemoryService.get_active_memories(db=db, user_id=user_id)
        assert len(active) == 0
    finally:
        db.close()

# =========================================================================
# 5. SENSITIVE TRAIT REJECTION
# =========================================================================

def test_sensitive_trait_rejection():
    user_id = create_test_user("sensitive_test@vanvas.com")
    headers = auth_headers(user_id)
    
    # Attempting to store religious, political, medical or racial traits must fail
    resp1 = client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={"category": "practical", "preference_key": "religion", "preference_value": "hindu"}
    )
    assert resp1.status_code == 400
    assert "Sensitive" in resp1.json()["detail"] or "prohibited" in resp1.json()["detail"]

    resp2 = client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={"category": "practical", "preference_key": "political_views", "preference_value": "liberal"}
    )
    assert resp2.status_code == 400

    resp3 = client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={"category": "practical", "preference_key": "medical_condition", "preference_value": "asthma"}
    )
    assert resp3.status_code == 400

# =========================================================================
# 6. PRIVACY, OWNERSHIP, GROUP ISOLATION & DELETION
# =========================================================================

def test_cross_user_isolation():
    user_a = create_test_user("user_a@vanvas.com")
    user_b = create_test_user("user_b@vanvas.com")
    headers_a = auth_headers(user_a)
    headers_b = auth_headers(user_b)
    
    # User A creates memory
    resp = client.post(
        "/api/v1/memory/explicit",
        headers=headers_a,
        json={"category": "transport", "preference_key": "mode", "preference_value": "train"}
    )
    assert resp.status_code == 201
    mem_a_id = resp.json()["id"]
    
    # User B cannot view User A's memory list
    resp_b_list = client.get("/api/v1/memory", headers=headers_b)
    assert len(resp_b_list.json()) == 0
    
    # User B cannot delete User A's memory
    resp_b_del = client.delete(f"/api/v1/memory/{mem_a_id}", headers=headers_b)
    assert resp_b_del.status_code == 404

def test_group_vote_isolation():
    user_1 = create_test_user("group_voter@vanvas.com")
    user_2 = create_test_user("group_companion@vanvas.com")
    
    db = TestingSessionLocal()
    try:
        # User 1 votes LOVE on an activity
        TravellerMemoryService.record_observation(
            db=db,
            user_id=user_1,
            category="activities",
            event_type="group_vote_love",
            observed_key="stargazing",
            observed_value="stargazing",
            idempotency_key="vote-1"
        )
        TravellerMemoryService.record_observation(
            db=db,
            user_id=user_1,
            category="activities",
            event_type="group_vote_love",
            observed_key="stargazing",
            observed_value="stargazing",
            idempotency_key="vote-2"
        )
        
        # User 1 has inferred stargazing memory
        active_1 = TravellerMemoryService.get_active_memories(db=db, user_id=user_1)
        assert len(active_1) == 1
        assert active_1[0].preference_value == "stargazing"
        
        # User 2 MUST NOT have any memory attributed from User 1's vote
        active_2 = TravellerMemoryService.get_active_memories(db=db, user_id=user_2)
        assert len(active_2) == 0
    finally:
        db.close()

def test_individual_memory_deletion_and_clear_all():
    user_id = create_test_user("delete_test@vanvas.com")
    headers = auth_headers(user_id)
    
    resp1 = client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={"category": "activities", "preference_key": "fav", "preference_value": "photography"}
    )
    mem_id = resp1.json()["id"]
    
    # Delete individual memory
    del_resp = client.delete(f"/api/v1/memory/{mem_id}", headers=headers)
    assert del_resp.status_code == 200
    
    # Verify memory is immediately gone
    get_resp = client.get("/api/v1/memory", headers=headers)
    assert len(get_resp.json()) == 0

    # Test Clear All
    client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={"category": "practical", "preference_key": "diet", "preference_value": "vegetarian"}
    )
    clear_resp = client.post("/api/v1/memory/clear", headers=headers)
    assert clear_resp.status_code == 200
    
    # Context is now empty
    get_resp2 = client.get("/api/v1/memory", headers=headers)
    assert len(get_resp2.json()) == 0

def test_data_export_includes_memories():
    user_id = create_test_user("export_user@vanvas.com")
    headers = auth_headers(user_id)
    
    client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={"category": "timing", "preference_key": "start_time", "preference_value": "late"}
    )
    
    # Auth export endpoint
    export_resp = client.get("/api/v1/auth/export", headers=headers)
    assert export_resp.status_code == 200
    export_data = export_resp.json()
    assert "traveller_memories" in export_data
    assert len(export_data["traveller_memories"]) == 1
    assert export_data["traveller_memories"][0]["preference_key"] == "start_time"

# =========================================================================
# 7. PERSONALIZATION RANKING & REASON EXPLANATION
# =========================================================================

class MockPlace:
    def __init__(self, id, name, category, rating=4.8, price_level=2, tags=""):
        self.id = id
        self.name = name
        self.category = category
        self.rating = rating
        self.price_level = price_level
        self.tags = tags

def test_recommendation_scorer_memory_boost_and_explanation():
    place = MockPlace(id="place-1", name="Buran Ghati High Trail", category="hiking", tags="hiking,nature", rating=4.8)
    scorer = RecommendationScorer()
    
    # Neutral state (no memories)
    neutral_score = scorer.score_place(place, user_interests=[], user_budget_tier="Balanced", memory_preferences={})
    neutral_exp = scorer.explain_recommendation(place, user_interests=[], user_budget_tier="Balanced", memory_preferences={})
    assert "Highly rated" in neutral_exp or "Curated" in neutral_exp
    
    # Memory preference for hiking
    memory_prefs = {
        "activity_type": "hiking"
    }
    boosted_score = scorer.score_place(place, user_interests=[], user_budget_tier="Balanced", memory_preferences=memory_prefs)
    assert boosted_score > neutral_score
    
    # Explanation references actual memory
    boosted_exp = scorer.explain_recommendation(place, user_interests=[], user_budget_tier="Balanced", memory_preferences=memory_prefs)
    assert "hiking" in boosted_exp.lower()

def test_dynamic_itinerary_pace_and_timing():
    destination = Destination(
        id="dest-test-1",
        name="Manali Valley",
        slug="manali-valley",
        description="High mountain valley",
        latitude=32.2396,
        longitude=77.1887
    )
    places = [
        Place(
            id=f"p-{i}",
            name=f"Spot {i}",
            destination_id="dest-test-1",
            recommended_duration_mins=120,
            category="Nature",
            slug=f"spot-{i}",
            description=f"Description for spot {i}",
            latitude=32.24 + i*0.01,
            longitude=77.19,
            tags="nature,scenic"
        )
        for i in range(8)
    ]
    
    engine = ItineraryEngine()
    
    # Relaxed pace + avoid early starts memory
    memory_prefs = {
        "pace": "relaxed",
        "start_time": "late",
    }
    
    days = engine.generate_trip_itinerary(
        destination=destination,
        all_places=places,
        start_date=date(2026, 10, 10),
        end_date=date(2026, 10, 11),
        budget=20000.0,
        companion_type="Solo",
        travel_style="Balanced",
        wake_up_preference="Normal",
        activity_intensity="Balanced",
        interests=["nature"],
        memory_preferences=memory_prefs
    )
    assert len(days) == 2
    # Verify density and items
    assert len(days[0]["items"]) > 0
    assert "reason_for_recommendation" in days[0]["items"][0]

# =========================================================================
# 8. COPILOT / ASK VANVAS MEMORY FAST PATHS
# =========================================================================

def test_copilot_context_engine_includes_memories():
    user_id = create_test_user("copilot_ctx@vanvas.com")
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        TravellerMemoryService.create_or_update_explicit_preference(
            db=db,
            user_id=user_id,
            category="accommodation",
            preference_key="preferred_stay_type",
            preference_value="homestay"
        )
        
        ctx = CopilotContextEngine.build_full_context(db=db, user=user)
        assert "verified_facts" in ctx
        assert "traveller_memories" in ctx["verified_facts"]
        mems = ctx["verified_facts"]["traveller_memories"]
        assert len(mems) == 1
        assert mems[0]["category"] == "accommodation"
        assert mems[0]["value"] == "homestay"
    finally:
        db.close()

def test_copilot_memory_fast_path_ask_and_forget():
    user_id = create_test_user("copilot_chat@vanvas.com")
    headers = auth_headers(user_id)
    
    # 1. Set a preference
    client.post(
        "/api/v1/memory/explicit",
        headers=headers,
        json={"category": "accommodation", "preference_key": "preferred_stay_type", "preference_value": "hostel"}
    )
    
    # 2. Ask "What kind of trips do I usually prefer?"
    chat_resp = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "What kind of trips do I usually prefer?", "trip_id": None}
    )
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    assert "hostel" in chat_data["message"].lower()
    
    # 3. Command "Forget my preference for hostels"
    forget_resp = client.post(
        "/api/v1/copilot/chat",
        headers=headers,
        json={"message": "Forget my preference for hostels", "trip_id": None}
    )
    assert forget_resp.status_code == 200
    forget_data = forget_resp.json()
    assert "forgotten" in forget_data["message"].lower() or "cleared" in forget_data["message"].lower()
    
    # 4. Verify memory is deleted in DB
    get_resp = client.get("/api/v1/memory", headers=headers)
    assert len(get_resp.json()) == 0
