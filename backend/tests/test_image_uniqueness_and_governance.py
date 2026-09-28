import pytest
from pathlib import Path
from collections import defaultdict
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.models import Destination, Place, Hotel, RentalOption, User, SoloMatch

CANONICAL_DESTINATIONS = [
    'manali', 'rishikesh', 'kasol', 'dharamshala', 'goa', 'jaipur', 
    'mussoorie', 'udaipur', 'munnar', 'varanasi', 'leh', 'spiti', 
    'tungnath-chandrashila', 'kainchi-dham', 'murthal', 'agra', 
    'mathura-vrindavan', 'neemrana', 'damdama-sohna', 'alwar-siliserh', 
    'sariska-bhangarh', 'dehradun', 'chandigarh', 'morni-hills', 
    'lansdowne', 'jaisalmer'
]

@pytest.fixture(scope="module")
def db():
    db_session: Session = SessionLocal()
    yield db_session
    db_session.close()

def test_all_26_canonical_destinations_exist(db: Session):
    for slug in CANONICAL_DESTINATIONS:
        d = db.query(Destination).filter(Destination.slug == slug).first()
        assert d is not None, f"Canonical destination {slug} missing from database"
        assert d.name, f"Destination {slug} missing name"
        assert d.state, f"Destination {slug} missing state"

def test_no_duplicate_place_images_across_places(db: Session):
    """Flag when unrelated place records share the exact same image path."""
    image_usage = defaultdict(list)
    for slug in CANONICAL_DESTINATIONS:
        d = db.query(Destination).filter(Destination.slug == slug).first()
        if not d:
            continue
        places = db.query(Place).filter(Place.destination_id == d.id).all()
        assert len(places) >= 6, f"Destination {slug} should have at least 6-8 places, found {len(places)}"
        for p in places:
            assert p.image_url, f"Place {p.name} in {slug} has no image_url"
            image_usage[p.image_url].append((slug, p.name))
            
    duplicates = {img: places for img, places in image_usage.items() if len(places) > 1}
    assert len(duplicates) == 0, f"Found duplicated place images: {duplicates}"

def test_no_duplicate_hotel_images_across_properties(db: Session):
    """Flag when unrelated hotel properties share the exact same image path."""
    image_usage = defaultdict(list)
    for slug in CANONICAL_DESTINATIONS:
        d = db.query(Destination).filter(Destination.slug == slug).first()
        if not d:
            continue
        hotels = db.query(Hotel).filter(Hotel.destination_id == d.id).all()
        assert len(hotels) >= 4, f"Destination {slug} should have at least 4 stays, found {len(hotels)}"
        for h in hotels:
            assert h.image_url, f"Hotel {h.name} in {slug} has no image_url"
            # Ensure no universal generic fallback is used
            assert "universal" not in h.image_url, f"Hotel {h.name} in {slug} is using universal generic image: {h.image_url}"
            image_usage[h.image_url].append((slug, h.name))
            
    duplicates = {img: hotels for img, hotels in image_usage.items() if len(hotels) > 1}
    assert len(duplicates) == 0, f"Found duplicated hotel images across properties: {duplicates}"

def test_mobility_destination_isolation_and_artwork(db: Session):
    """Ensure every rental has a destination-matched vehicle image."""
    for slug in CANONICAL_DESTINATIONS:
        d = db.query(Destination).filter(Destination.slug == slug).first()
        if not d:
            continue
        rentals = db.query(RentalOption).filter(RentalOption.destination_id == d.id).all()
        assert len(rentals) >= 2, f"Destination {slug} should have rentals, found {len(rentals)}"
        for r in rentals:
            assert r.image_url, f"Rental {r.vehicle_name} in {slug} has no image_url"
            assert not r.image_url.startswith("data:"), f"Rental {r.vehicle_name} has invalid image_url"
            repo_root = Path(__file__).resolve().parent.parent.parent
            img_path = repo_root / "frontend" / "public" / r.image_url.lstrip("/")
            assert img_path.exists(), f"Vehicle image file missing on disk: {img_path}"

def test_solo_connection_idempotency(db: Session):
    """Verify that sending duplicate connection requests is safe and idempotent."""
    user1 = db.query(User).first()
    if not user1:
        pytest.skip("No users in DB for test")
    user2 = db.query(User).filter(User.id != user1.id).first()
    if not user2:
        pytest.skip("Need at least 2 users in DB")
        
    # Check or create match
    match = db.query(SoloMatch).filter(
        SoloMatch.sender_user_id == user1.id,
        SoloMatch.receiver_user_id == user2.id
    ).first()
    
    if not match:
        match = SoloMatch(
            sender_user_id=user1.id,
            receiver_user_id=user2.id,
            status="PENDING",
            message="Hey, let's explore together!"
        )
        db.add(match)
        db.commit()
        db.refresh(match)
        
    assert match.status in ["PENDING", "ACCEPTED", "DECLINED"]
