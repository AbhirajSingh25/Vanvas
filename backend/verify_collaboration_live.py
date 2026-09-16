import sys
import os
from datetime import date, timedelta
from app.database.session import SessionLocal, Base, engine, ensure_sqlite_schema
from app.models.models import User, Destination, Trip, TripMember, TripInvite, Place, Vote
from app.core.security import get_password_hash, create_access_token
from fastapi.testclient import TestClient
from app.main import app

def run_live_collaboration_check():
    print("==================================================")
    print("VANVAS PHASE 4.2: LIVE COLLABORATION VERIFICATION")
    print("==================================================")
    
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_schema(engine)
    db = SessionLocal()
    client = TestClient(app)

    # 1. Ensure a starter destination exists
    dest = db.query(Destination).filter(Destination.slug == "manali").first()
    if not dest:
        dest = Destination(
            name="Manali",
            slug="manali",
            state="Himachal Pradesh",
            region="Kullu Valley",
            tagline="Valley of the Gods",
            description="Alpine Himalayan retreat.",
            latitude=32.2432,
            longitude=77.1892,
            altitude_meters=2050,
            is_featured=True
        )
        db.add(dest)
        db.commit()
        db.refresh(dest)

    # 2. Setup 3 distinct test users
    def get_or_create_user(email, name):
        u = db.query(User).filter(User.email == email).first()
        if not u:
            u = User(
                email=email,
                full_name=name,
                hashed_password=get_password_hash("pass123"),
                role="traveller"
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        token = create_access_token(u.id)
        return u, token, {"Authorization": f"Bearer {token}"}

    owner_user, token_owner, headers_owner = get_or_create_user("owner_live@vanvas.com", "Vikram Batra")
    friend_b, token_b, headers_b = get_or_create_user("friend_b_live@vanvas.com", "Kavya Sharma")
    friend_c, token_c, headers_c = get_or_create_user("friend_c_live@vanvas.com", "Rohan Mehta")

    print(f"[OK] Created/Loaded test users: {owner_user.full_name}, {friend_b.full_name}, {friend_c.full_name}")

    # 3. Owner creates a Trip
    trip_resp = client.post("/api/v1/trips", json={
        "title": "Himalayan Ridge Expedition 2026",
        "destination_id": dest.id,
        "companion_type": "Friends",
        "travel_style": "Comfort",
        "start_date": str(date.today() + timedelta(days=10)),
        "end_date": str(date.today() + timedelta(days=14)),
        "budget_total": 45000
    }, headers=headers_owner)
    assert trip_resp.status_code == 200, f"Trip creation failed: {trip_resp.text}"
    trip_data = trip_resp.json()
    trip_id = trip_data["id"]
    invite_code = trip_data["invite_code"]
    print(f"[OK] Owner created Trip {trip_id} with invite code: {invite_code}")

    # 4. Verify preview invite endpoint without auth
    prev_resp = client.get(f"/api/v1/trips/invite/{invite_code}")
    assert prev_resp.status_code == 200, f"Invite preview failed: {prev_resp.text}"
    prev_data = prev_resp.json()
    assert "Manali" in prev_data["title"]
    assert prev_data["destination_name"] == "Manali"
    assert prev_data["owner_name"] == "Vikram Batra"
    assert prev_data["members_count"] >= 1
    print(f"[OK] Public preview endpoint validated for {invite_code} (Owner: {prev_data['owner_name']}, Members: {prev_data['members_count']})")

    # 5. Non-member access to private trip details is blocked
    unauth_resp = client.get(f"/api/v1/trips/{trip_id}", headers=headers_b)
    assert unauth_resp.status_code == 403, "Expected 403 Forbidden for non-member before joining"
    print("[OK] Non-member private trip access correctly rejected with 403 Forbidden")

    # 6. Friend B joins via invite code
    join_b_resp = client.post(f"/api/v1/trips/join/{invite_code}", headers=headers_b)
    assert join_b_resp.status_code == 200, f"Friend B join failed: {join_b_resp.text}"
    assert join_b_resp.json()["already_joined"] is False
    print("[OK] Friend B successfully joined the trip")

    # 7. Duplicate join is idempotent
    join_b_dup = client.post(f"/api/v1/trips/join/{invite_code}", headers=headers_b)
    assert join_b_dup.status_code == 200
    assert join_b_dup.json()["already_joined"] is True
    print("[OK] Duplicate join handled idempotently with already_joined=True")

    # 8. Friend B can now access private trip details
    auth_b_resp = client.get(f"/api/v1/trips/{trip_id}", headers=headers_b)
    assert auth_b_resp.status_code == 200
    print("[OK] Friend B can now access private trip details")

    # 9. Friend C joins
    join_c_resp = client.post(f"/api/v1/trips/join/{invite_code}", headers=headers_c)
    assert join_c_resp.status_code == 200
    print("[OK] Friend C joined the trip")

    # 10. Check group details has 3 members
    grp_resp = client.get(f"/api/v1/trips/{trip_id}/members", headers=headers_owner)
    assert grp_resp.status_code == 200, f"Group details failed: {grp_resp.text}"
    grp_data = grp_resp.json()
    assert len(grp_data["members"]) == 3
    print(f"[OK] Group now has {len(grp_data['members'])} active members")

    # 11. Friend B submits a private consensus vote
    place = db.query(Place).filter(Place.destination_id == dest.id).first()
    if not place:
        place = Place(
            destination_id=dest.id,
            category="Cafés",
            name="Café 1947",
            slug="cafe-1947",
            description="Riverside café",
            latitude=32.256,
            longitude=77.182,
            price_level="Moderate",
            approx_cost_inr=450
        )
        db.add(place)
        db.commit()
        db.refresh(place)

    vote_resp = client.post(f"/api/v1/trips/{trip_id}/vote", json={
        "place_id": place.id,
        "vote_type": "LOVE"
    }, headers=headers_b)
    assert vote_resp.status_code == 200, f"Vote failed: {vote_resp.text}"
    print("[OK] Friend B cast a private consensus vote")

    # 12. Non-owner cannot remove member
    non_owner_remove = client.delete(f"/api/v1/trips/{trip_id}/members/{friend_c.id}", headers=headers_b)
    assert non_owner_remove.status_code == 403
    print("[OK] Non-owner removal attempt correctly rejected with 403 Forbidden")

    # 13. Owner removes Friend C
    owner_remove = client.delete(f"/api/v1/trips/{trip_id}/members/{friend_c.id}", headers=headers_owner)
    assert owner_remove.status_code == 200
    print("[OK] Owner successfully removed Friend C")

    # 14. Friend B leaves the trip
    leave_resp = client.post(f"/api/v1/trips/{trip_id}/leave", headers=headers_b)
    assert leave_resp.status_code == 200
    print("[OK] Friend B successfully left the trip voluntarily")

    # 15. Owner cannot leave their own trip
    owner_leave = client.post(f"/api/v1/trips/{trip_id}/leave", headers=headers_owner)
    assert owner_leave.status_code == 400
    print("[OK] Owner protected from leaving their own trip (400 Bad Request)")

    # 16. Verify trip list endpoint includes collaborative trips
    # When user A lists trips, trip is included
    trips_list_resp = client.get("/api/v1/trips", headers=headers_owner)
    assert trips_list_resp.status_code == 200
    assert any(t["id"] == trip_id for t in trips_list_resp.json())
    print("[OK] Trip listing properly filters and includes member's trips")

    print("==================================================")
    print("ALL 16 LIVE COLLABORATION INTEGRATION CHECKS PASSED!")
    print("==================================================")
    db.close()

if __name__ == "__main__":
    run_live_collaboration_check()
