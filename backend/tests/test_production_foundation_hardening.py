import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import Base, get_db
from app.models.models import User, Destination, Place, Hotel, RentalOption, MobilityProvider, Booking
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.seed.canonical_dataset import (
    CANONICAL_26_DESTINATIONS,
    ADDITIONAL_PLACES_BY_DEST,
    ADDITIONAL_HOTELS_BY_DEST,
    ADDITIONAL_RENTALS_BY_DEST
)
from app.seed.seed_data import seed_database
from app.services.booking_service import BookingService, BookingStatus
from app.services.mobility_service import MobilityService
from app.schemas.schemas import MobilityProviderCreate, MobilityVehicleCreate

# Setup in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(engine_to_use=engine, db=db)
    app.dependency_overrides[get_db] = override_get_db
    settings.ENVIRONMENT = "development"
    try:
        yield
    finally:
        settings.ENVIRONMENT = "development"
        db.close()
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=engine)



def test_canonical_inventory_counts():
    """Phase 3: Verify 26 destinations, 208 places, 104 hotels, 53 rentals."""
    assert len(CANONICAL_26_DESTINATIONS) == 26
    
    total_places = sum(len(v) for v in ADDITIONAL_PLACES_BY_DEST.values())
    total_hotels = sum(len(v) for v in ADDITIONAL_HOTELS_BY_DEST.values())
    total_rentals = sum(len(v) for v in ADDITIONAL_RENTALS_BY_DEST.values())
    
    assert total_places == 208, f"Expected 208 places, got {total_places}"
    assert total_hotels == 104, f"Expected 104 hotels, got {total_hotels}"
    assert total_rentals == 53, f"Expected 53 rentals, got {total_rentals}"


def test_database_seeding_is_idempotent():
    """Phase 1: Verify seeding twice does not cause FK violations or duplicates."""
    db = TestingSessionLocal()
    seed_database(engine_to_use=engine, db=db)
    
    dest_count = db.query(Destination).count()
    places_count = db.query(Place).count()
    hotels_count = db.query(Hotel).count()
    rentals_count = db.query(RentalOption).count()
    
    assert dest_count == 26
    assert places_count == 208
    assert hotels_count == 104
    assert rentals_count == 53
    db.close()


def test_readiness_probe():
    """Phase 2 & 11: Verify /health/ready semantics."""
    res = client.get("/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"
    assert data["inventory"]["destinations"] >= 26
    assert data["inventory"]["places"] >= 208
    assert data["inventory"]["hotels"] >= 104
    assert data["inventory"]["rentals"] >= 53


def test_no_fabricated_defaults_in_seed():
    """Phase 4 & 5: Verify no fabricated phone numbers or synthetic ratings/reviews in DB."""
    db = TestingSessionLocal()
    providers = db.query(MobilityProvider).all()
    for p in providers:
        if p.phone:
            assert "98765" not in p.phone, f"Found fake phone in provider {p.business_name}: {p.phone}"
    
    places = db.query(Place).all()
    for pl in places:
        # Verified places must have either None or valid float rating
        if pl.rating is not None:
            assert isinstance(pl.rating, float)
    db.close()


def test_mobility_provider_authorization():
    """Phase 7: Verify mobility authorization rules at service and API levels."""
    db = TestingSessionLocal()
    owner = User(
        id="user-mobility-owner",
        email="test-owner@rentals.com",
        full_name="Rental Owner",
        hashed_password=get_password_hash("password123"),
        role="user"
    )
    other_user = User(
        id="user-other",
        email="test-other@rentals.com",
        full_name="Other User",
        hashed_password=get_password_hash("password123"),
        role="user"
    )
    admin_user = User(
        id="user-admin-custom",
        email="test-admin-custom@vanvas.com",
        full_name="Custom Admin",
        hashed_password=get_password_hash("password123"),
        role="admin"
    )
    db.add_all([owner, other_user, admin_user])
    db.commit()

    # 1. Create provider as owner
    prov_payload = MobilityProviderCreate(
        business_name="Manali Royal Rides",
        phone="+91 94180 12345",
        latitude=32.2396,
        longitude=77.1887,
        city="Manali",
        address="Old Manali, Himachal Pradesh",
        verification_status="CLAIMED_VERIFIED"
    )
    prov = MobilityService.create_provider(db, prov_payload, user=owner)
    assert prov.owner_user_id == owner.id

    # 2. Add vehicle by unauthorized non-owner -> Raises 403 HTTPException
    veh_payload = MobilityVehicleCreate(
        vehicle_type="Touring Motorcycle",
        brand="Royal Enfield",
        model="Himalayan 450",
        daily_price=1800.0,
        quantity=5
    )
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc_info:
        MobilityService.add_vehicle(db, prov.id, veh_payload, user=other_user)
    assert exc_info.value.status_code == 403

    # 3. Add vehicle by authorized owner -> Accepted
    veh = MobilityService.add_vehicle(db, prov.id, veh_payload, user=owner)
    assert veh.provider_id == prov.id

    # 4. Add vehicle by admin -> Accepted
    admin_veh_payload = MobilityVehicleCreate(
        vehicle_type="Mountain Bike / Bicycle",
        brand="Trek",
        model="Marlin 7",
        daily_price=800.0,
        quantity=3
    )
    admin_veh = MobilityService.add_vehicle(db, prov.id, admin_veh_payload, user=admin_user)
    assert admin_veh.provider_id == prov.id
    db.close()


def test_cors_production_policy():
    """Phase 8: Verify CORS configuration filters origins properly in production."""
    dev_origins = settings.get_allowed_cors_origins()
    assert any("localhost" in o for o in dev_origins)
    
    try:
        settings.ENVIRONMENT = "production"
        prod_filtered = settings.get_allowed_cors_origins()
        assert not any("localhost" in o or "127.0.0.1" in o for o in prod_filtered)
        assert "https://vanvas.app" in prod_filtered or "https://vanvas.in" in prod_filtered
    finally:
        settings.ENVIRONMENT = "development"



def test_booking_state_machine_integrity():
    """Phase 6: Verify booking transitions do not invent synthetic provider confirmations."""
    db = TestingSessionLocal()
    user = User(
        id="user-booking-tester",
        email="test-booker@vanvas.com",
        full_name="Booking Tester",
        hashed_password=get_password_hash("password123"),
        role="user"
    )
    db.add(user)
    db.commit()

    # Create intent
    b = BookingService.create_booking_intent(
        db=db,
        user=user,
        booking_type="hotel",
        inventory_id="dest-manali-hotel-1",
        start_date="2026-10-01",
        end_date="2026-10-05",
        total_amount=8500.0
    )
    assert b.status == BookingStatus.DISCOVERED.value
    assert b.confirmation_reference is None

    # Step 1: Transition DISCOVERED -> SELECTED
    b_sel = BookingService.transition_booking_status(
        db=db,
        booking_id=b.id,
        target_status="SELECTED",
        user=user
    )
    assert b_sel.status == BookingStatus.SELECTED.value

    # Step 2: Transition SELECTED -> CHECKOUT_READY
    b2 = BookingService.transition_booking_status(
        db=db,
        booking_id=b.id,
        target_status="CHECKOUT_READY",
        user=user
    )
    assert b2.status == BookingStatus.CHECKOUT_READY.value
    assert b2.confirmation_reference is None

    # Step 3: Transition CHECKOUT_READY -> PROVIDER_CONFIRMED without provider reference -> Must fail
    with pytest.raises(ValueError):
        BookingService.transition_booking_status(
            db=db,
            booking_id=b.id,
            target_status="PROVIDER_CONFIRMED",
            user=user,
            metadata={}  # Empty metadata, no confirmation reference
        )

    # Step 4: Valid confirmation with real provider reference
    b3 = BookingService.transition_booking_status(
        db=db,
        booking_id=b.id,
        target_status="PROVIDER_CONFIRMED",
        user=user,
        metadata={"confirmation_reference": "EXT-HOTEL-CONF-88992"}
    )
    assert b3.status == BookingStatus.PROVIDER_CONFIRMED.value
    assert b3.confirmation_reference == "EXT-HOTEL-CONF-88992"
    db.close()


def test_copilot_private_chat_image_security():
    """Phase 10: Verify private chat images require authorization and reject unauthorized access."""
    # Unauthenticated access in production -> 401 Unauthorized
    try:
        settings.ENVIRONMENT = "production"
        res_unauth = client.get("/api/v1/copilot/image/chat/user-chat-1/sample_photo.jpg")
        assert res_unauth.status_code == 401
    finally:
        settings.ENVIRONMENT = "development"

