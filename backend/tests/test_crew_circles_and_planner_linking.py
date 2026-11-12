from datetime import date, datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.models import (
    User, Destination, Trip, TripMember, CrewCircle, CrewCircleMember,
    CrewCircleTrip, CrewCircleActivity
)
from app.core.security import create_access_token, get_password_hash


client = TestClient(app)


def _ensure_user(db, email: str, full_name: str) -> User:
    u = db.query(User).filter(User.email == email).first()
    if not u:
        u = User(
            email=email,
            hashed_password=get_password_hash("password123"),
            full_name=full_name,
            avatar_type="none",
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(u)
        db.commit()
        db.refresh(u)
    return u


def test_crew_circle_chat_and_trip_linking_json_body():
    db = SessionLocal()
    circle_id = None
    trip_id = None
    try:
        owner = _ensure_user(db, "cc_owner_rebuild@vanvas.com", "Owner One")
        member = _ensure_user(db, "cc_member_rebuild@vanvas.com", "Member Two")
        outsider = _ensure_user(db, "cc_outsider_rebuild@vanvas.com", "Outsider Three")

        dest = db.query(Destination).first()
        assert dest is not None

        h_owner = {"Authorization": f"Bearer {create_access_token(owner.id)}"}
        h_member = {"Authorization": f"Bearer {create_access_token(member.id)}"}
        h_outsider = {"Authorization": f"Bearer {create_access_token(outsider.id)}"}

        # 1. Create circle & add member
        c_res = client.post(
            "/api/v1/crew-circles/",
            headers=h_owner,
            json={"name": "Spiti Winter Crew", "description": "Testing rebuild"},
        )
        assert c_res.status_code == 200
        circle_id = c_res.json()["id"]

        add_res = client.post(
            f"/api/v1/crew-circles/{circle_id}/members",
            headers=h_owner,
            json={"user_id": member.id, "role": "member"},
        )
        assert add_res.status_code == 200

        # 2. Non-member access restriction
        assert client.get(f"/api/v1/crew-circles/{circle_id}/activity", headers=h_outsider).status_code == 403
        assert (
            client.post(
                f"/api/v1/crew-circles/{circle_id}/activity",
                headers=h_outsider,
                json={"content": "Sneak in"},
            ).status_code
            == 403
        )

        # 3. Multiple members exchange chat messages
        m1 = client.post(
            f"/api/v1/crew-circles/{circle_id}/activity",
            headers=h_owner,
            json={"content": "Let's leave at 5 AM"},
        )
        assert m1.status_code == 200
        assert m1.json()["activity_type"] == "chat"

        m2 = client.post(
            f"/api/v1/crew-circles/{circle_id}/activity",
            headers=h_member,
            json={"content": "Packing thermals now!"},
        )
        assert m2.status_code == 200
        assert m2.json()["user_name"] == "Member Two"

        # 4. Create trip and link via JSON body {"trip_id": ...} (exact frontend payload)
        trip = Trip(
            user_id=owner.id,
            destination_id=dest.id,
            title="Spiti Crew Expedition",
            start_date=date(2026, 12, 10),
            end_date=date(2026, 12, 15),
            num_days=6,
            travellers_count=2,
            budget_total=30000.0,
            status="active",
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)
        trip_id = trip.id

        link_res = client.post(
            f"/api/v1/crew-circles/{circle_id}/trips",
            headers=h_owner,
            json={"trip_id": trip_id},
        )
        assert link_res.status_code == 200
        assert link_res.json()["trip_id"] == trip_id

        # 5. Verify circle members were added as trip members & trip appears in circle detail
        tm = db.query(TripMember).filter(
            TripMember.trip_id == trip_id,
            TripMember.user_id == member.id,
        ).first()
        assert tm is not None

        detail = client.get(f"/api/v1/crew-circles/{circle_id}", headers=h_member)
        assert detail.status_code == 200
        assert any(t["trip_id"] == trip_id for t in detail.json()["trips"])

        # 6. System events (trip_created, member_added) remain distinct from chat messages
        feed = client.get(f"/api/v1/crew-circles/{circle_id}/activity", headers=h_member)
        assert feed.status_code == 200
        items = feed.json()
        chat_items = [i for i in items if i["activity_type"] == "chat"]
        sys_items = [i for i in items if i["activity_type"] != "chat"]
        assert len(chat_items) >= 2
        assert any(i["activity_type"] == "trip_created" for i in sys_items)
    finally:
        if circle_id:
            db.query(CrewCircleActivity).filter(CrewCircleActivity.circle_id == circle_id).delete()
            db.query(CrewCircleTrip).filter(CrewCircleTrip.circle_id == circle_id).delete()
            db.query(CrewCircleMember).filter(CrewCircleMember.circle_id == circle_id).delete()
            db.query(CrewCircle).filter(CrewCircle.id == circle_id).delete()
        if trip_id:
            db.query(TripMember).filter(TripMember.trip_id == trip_id).delete()
            db.query(Trip).filter(Trip.id == trip_id).delete()
        db.commit()
        db.close()

