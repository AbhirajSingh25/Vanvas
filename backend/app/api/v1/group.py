from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Trip, TripMember, Vote, Place, User
from app.schemas.schemas import SubmitVoteRequest, GroupSummaryResponse, GroupCompatibilityResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/{trip_id}/members", response_model=GroupSummaryResponse)
def get_group_members_and_votes(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    members = db.query(TripMember).filter(TripMember.trip_id == trip_id).all()
    members_data = []
    for m in members:
        u = m.user
        members_data.append({
            "id": m.id,
            "user_id": u.id,
            "full_name": u.full_name,
            "role": m.role,
            "avatar_url": u.avatar_url,
            "joined_at": m.joined_at
        })

    # Group voting aggregation (anonymous privacy preserved)
    votes = db.query(Vote).filter(Vote.trip_id == trip_id).all()
    place_votes: Dict[str, List[str]] = {}
    for v in votes:
        if v.place_id not in place_votes:
            place_votes[v.place_id] = []
        place_votes[v.place_id].append(v.vote_type)

    all_places = db.query(Place).filter(Place.destination_id == trip.destination_id).all()
    place_lookup = {p.id: p for p in all_places}

    ranking: List[GroupCompatibilityResponse] = []
    for pid, v_list in place_votes.items():
        pl = place_lookup.get(pid)
        if not pl:
            continue
        
        love = v_list.count("LOVE")
        like = v_list.count("LIKE")
        no = v_list.count("NO")
        total = len(v_list)
        
        # Compatibility percentage
        raw_score = (love * 1.0 + like * 0.6 - no * 0.5) / max(1, total)
        comp_pct = round(max(0.0, min(100.0, (raw_score + 0.5) * 66.6)), 1)

        ranking.append(GroupCompatibilityResponse(
            place_id=pid,
            place_name=pl.name,
            category=pl.category,
            love_count=love,
            like_count=like,
            no_count=no,
            total_votes=total,
            compatibility_score=comp_pct,
            is_consensus_favorite=comp_pct >= 75.0 and no == 0
        ))

    ranking.sort(key=lambda x: x.compatibility_score, reverse=True)

    return GroupSummaryResponse(
        trip_id=trip.id,
        members_count=len(members_data),
        members=members_data,
        compatibility_ranking=ranking
    )

@router.post("/{trip_id}/vote")
def submit_vote(
    trip_id: str,
    vote_in: SubmitVoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    is_member = db.query(TripMember).filter(
        TripMember.trip_id == trip_id,
        TripMember.user_id == current_user.id
    ).first()
    if not is_member and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only trip members can vote on activities.")

    if vote_in.vote_type not in ["NO", "LIKE", "LOVE"]:
        raise HTTPException(status_code=400, detail="Invalid vote type. Must be NO, LIKE, or LOVE")

    existing_vote = db.query(Vote).filter(
        Vote.trip_id == trip_id,
        Vote.user_id == current_user.id,
        Vote.place_id == vote_in.place_id
    ).first()

    if existing_vote:
        existing_vote.vote_type = vote_in.vote_type
    else:
        new_vote = Vote(
            trip_id=trip_id,
            user_id=current_user.id,
            place_id=vote_in.place_id,
            vote_type=vote_in.vote_type
        )
        db.add(new_vote)

    db.commit()
    return {"success": True, "message": "Vote registered privately and factored into group compatibility ranking."}

@router.post("/join/{invite_code}")
def join_trip_by_invite(
    invite_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.invite_code == invite_code.upper()).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip invite code not found")

    existing_member = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == current_user.id
    ).first()

    if not existing_member:
        new_member = TripMember(
            trip_id=trip.id,
            user_id=current_user.id,
            role="member"
        )
        db.add(new_member)
        trip.travellers_count += 1
        db.commit()

    return {"success": True, "trip_id": trip.id, "title": trip.title}
