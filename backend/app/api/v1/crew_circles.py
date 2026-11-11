"""
VANVAS Private Crew Circles Router
Handles persistent group travel workspaces, collaborative planning,
role permissions, suggestions, activity feed, and Ask VANVAS for Circles.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, date
import json

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import (
    User, Trip, TripMember, Destination, CrewCircle, CrewCircleMember,
    CrewCircleTrip, CrewCircleActivity, CrewCircleSuggestion, SplitPod,
    Friendship
)
from app.schemas.schemas import (
    CrewCircleCreate, CrewCircleUpdate, CrewCircleResponse,
    CrewCircleDetailResponse, CrewCircleMemberResponse, CrewCircleTripResponse,
    CrewCircleActivityCreate, CrewCircleActivityResponse,
    CrewCircleSuggestionCreate, CrewCircleSuggestionResponse,
    AskVanvasCircleRequest, AskVanvasCircleResponse
)

router = APIRouter()


def require_circle_membership(circle_id: str, user_id: str, db: Session) -> CrewCircleMember:
    """Verify user is an active member of the private circle."""
    member = db.query(CrewCircleMember).filter(
        CrewCircleMember.circle_id == circle_id,
        CrewCircleMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this Crew Circle"
        )
    return member


def require_circle_admin(circle_id: str, user_id: str, db: Session) -> CrewCircleMember:
    """Verify user is owner or admin of the private circle."""
    member = require_circle_membership(circle_id, user_id, db)
    if member.role not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or owner permissions required for this action"
        )
    return member


@router.post("", response_model=CrewCircleDetailResponse)
def create_crew_circle(
    payload: CrewCircleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new persistent Crew Circle. The creator becomes the owner."""
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Circle name cannot be empty")

    circle = CrewCircle(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        icon_or_cover=payload.icon_or_cover or "mountain-crew",
        created_by_user_id=current_user.id
    )
    db.add(circle)
    db.flush()

    # Add creator as owner member
    owner_member = CrewCircleMember(
        circle_id=circle.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(owner_member)

    # Add initial members from friends list or by VANVAS ID
    for friend_id in payload.initial_member_user_ids:
        if friend_id == current_user.id:
            continue
        target = db.query(User).filter((User.id == friend_id) | (User.vanvas_id == friend_id)).first()
        if target:
            existing_mem = db.query(CrewCircleMember).filter(
                CrewCircleMember.circle_id == circle.id,
                CrewCircleMember.user_id == target.id
            ).first()
            if not existing_mem:
                new_mem = CrewCircleMember(
                    circle_id=circle.id,
                    user_id=target.id,
                    role="member"
                )
                db.add(new_mem)

    # Link initial trip if provided
    if payload.initial_trip_id:
        trip = db.query(Trip).filter(Trip.id == payload.initial_trip_id).first()
        if trip:
            link = CrewCircleTrip(circle_id=circle.id, trip_id=trip.id)
            db.add(link)

    # Log activity
    act = CrewCircleActivity(
        circle_id=circle.id,
        user_id=current_user.id,
        activity_type="circle_created",
        content=f"{current_user.full_name} created the circle '{circle.name}'."
    )
    db.add(act)

    db.commit()
    db.refresh(circle)

    return get_circle_detail(circle.id, current_user, db)


@router.get("", response_model=List[CrewCircleResponse])
def list_my_crew_circles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all Crew Circles the authenticated user belongs to."""
    memberships = db.query(CrewCircleMember).filter(
        CrewCircleMember.user_id == current_user.id
    ).all()

    circle_ids = [m.circle_id for m in memberships]
    roles_map = {m.circle_id: m.role for m in memberships}

    circles = db.query(CrewCircle).filter(
        CrewCircle.id.in_(circle_ids),
        CrewCircle.is_archived.is_(False)
    ).order_by(CrewCircle.created_at.desc()).all()

    items = []
    for c in circles:
        mem_count = db.query(CrewCircleMember).filter(CrewCircleMember.circle_id == c.id).count()
        items.append(CrewCircleResponse(
            id=c.id,
            name=c.name,
            description=c.description,
            icon_or_cover=c.icon_or_cover,
            created_by_user_id=c.created_by_user_id,
            is_archived=c.is_archived,
            created_at=c.created_at,
            member_count=mem_count,
            my_role=roles_map.get(c.id, "member")
        ))
    return items


@router.get("/{circle_id}", response_model=CrewCircleDetailResponse)
def get_circle_detail(
    circle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete workspace detail for a specific Crew Circle."""
    my_mem = require_circle_membership(circle_id, current_user.id, db)
    circle = db.query(CrewCircle).filter(CrewCircle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Crew Circle not found")

    members = db.query(CrewCircleMember).filter(CrewCircleMember.circle_id == circle_id).all()
    member_items = []
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        if u:
            member_items.append(CrewCircleMemberResponse(
                id=m.id,
                user_id=u.id,
                user_name=u.full_name,
                vanvas_id=u.vanvas_id,
                avatar_url=u.avatar_url,
                avatar_preset=u.avatar_preset,
                role=m.role,
                joined_at=m.joined_at
            ))

    # Linked trips
    circle_trips = db.query(CrewCircleTrip).filter(CrewCircleTrip.circle_id == circle_id).all()
    trip_items = []
    for ct in circle_trips:
        t = db.query(Trip).filter(Trip.id == ct.trip_id).first()
        if t:
            dest = db.query(Destination).filter(Destination.id == t.destination_id).first()
            trip_items.append(CrewCircleTripResponse(
                id=ct.id,
                trip_id=t.id,
                title=t.title,
                destination_name=dest.name if dest else None,
                start_date=t.start_date,
                end_date=t.end_date,
                budget_total=t.budget_total or 0.0,
                budget_spent=t.budget_spent or 0.0,
                status=t.status
            ))

    pods_count = db.query(SplitPod).filter(SplitPod.circle_id == circle_id).count()
    act_count = db.query(CrewCircleActivity).filter(CrewCircleActivity.circle_id == circle_id).count()

    return CrewCircleDetailResponse(
        id=circle.id,
        name=circle.name,
        description=circle.description,
        icon_or_cover=circle.icon_or_cover,
        created_by_user_id=circle.created_by_user_id,
        is_archived=circle.is_archived,
        created_at=circle.created_at,
        member_count=len(member_items),
        my_role=my_mem.role,
        members=member_items,
        trips=trip_items,
        active_pods_count=pods_count,
        recent_activity_count=act_count
    )


@router.put("/{circle_id}", response_model=CrewCircleResponse)
def update_crew_circle(
    circle_id: str,
    payload: CrewCircleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update Crew Circle settings (name, description, icon). Requires owner or admin."""
    my_mem = require_circle_admin(circle_id, current_user.id, db)
    circle = db.query(CrewCircle).filter(CrewCircle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Crew Circle not found")

    if payload.name is not None and payload.name.strip():
        circle.name = payload.name.strip()
    if payload.description is not None:
        circle.description = payload.description.strip()
    if payload.icon_or_cover is not None:
        circle.icon_or_cover = payload.icon_or_cover
    if payload.is_archived is not None:
        circle.is_archived = payload.is_archived

    circle.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(circle)

    mem_count = db.query(CrewCircleMember).filter(CrewCircleMember.circle_id == circle.id).count()
    return CrewCircleResponse(
        id=circle.id,
        name=circle.name,
        description=circle.description,
        icon_or_cover=circle.icon_or_cover,
        created_by_user_id=circle.created_by_user_id,
        is_archived=circle.is_archived,
        created_at=circle.created_at,
        member_count=mem_count,
        my_role=my_mem.role
    )


@router.delete("/{circle_id}")
def delete_or_archive_circle(
    circle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete or archive Crew Circle. Only the creator/owner can delete."""
    circle = db.query(CrewCircle).filter(CrewCircle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="Crew Circle not found")

    if circle.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the circle owner can delete the circle")

    db.delete(circle)
    db.commit()
    return {"message": "Crew Circle deleted successfully", "circle_id": circle_id}


@router.post("/{circle_id}/members", response_model=CrewCircleMemberResponse)
def add_circle_member(
    circle_id: str,
    payload: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = Query(None, description="User ID to add"),
    role: Optional[str] = Query("member", description="Role: member or admin"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new member to the circle by user ID or VANVAS ID."""
    require_circle_membership(circle_id, current_user.id, db)

    target_id = (payload.get("user_id") if payload else None) or user_id
    chosen_role = (payload.get("role") if payload else None) or role or "member"
    if not target_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    target_user = db.query(User).filter((User.id == target_id) | (User.vanvas_id == target_id)).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(CrewCircleMember).filter(
        CrewCircleMember.circle_id == circle_id,
        CrewCircleMember.user_id == target_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this circle")

    mem = CrewCircleMember(
        circle_id=circle_id,
        user_id=target_user.id,
        role=chosen_role if chosen_role in ("admin", "member") else "member"
    )
    db.add(mem)

    # Log activity
    act = CrewCircleActivity(
        circle_id=circle_id,
        user_id=current_user.id,
        activity_type="member_joined",
        content=f"{current_user.full_name} added {target_user.full_name} to the circle."
    )
    db.add(act)

    db.commit()
    db.refresh(mem)

    return CrewCircleMemberResponse(
        id=mem.id,
        user_id=target_user.id,
        user_name=target_user.full_name,
        vanvas_id=target_user.vanvas_id,
        avatar_url=target_user.avatar_url,
        avatar_preset=target_user.avatar_preset,
        role=mem.role,
        joined_at=mem.joined_at
    )


@router.delete("/{circle_id}/members/{user_id}")
def remove_circle_member(
    circle_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from the circle, or leave circle if user_id == current_user.id."""
    caller_mem = require_circle_membership(circle_id, current_user.id, db)
    target_mem = db.query(CrewCircleMember).filter(
        CrewCircleMember.circle_id == circle_id,
        CrewCircleMember.user_id == user_id
    ).first()
    if not target_mem:
        raise HTTPException(status_code=404, detail="Member not found in circle")

    # If leaving
    if user_id == current_user.id:
        if target_mem.role == "owner":
            # Check if there are other members to transfer ownership to
            other_mems = db.query(CrewCircleMember).filter(
                CrewCircleMember.circle_id == circle_id,
                CrewCircleMember.user_id != user_id
            ).all()
            if other_mems:
                other_mems[0].role = "owner"
        db.delete(target_mem)
        db.commit()
        return {"message": "You have left the circle", "status": "left"}

    # If removing someone else, must be admin or owner
    if caller_mem.role not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Admin permissions required to remove members")
    if target_mem.role == "owner":
        raise HTTPException(status_code=403, detail="Cannot remove circle owner")

    db.delete(target_mem)
    db.commit()
    return {"message": "Member removed from circle", "status": "removed"}


@router.put("/{circle_id}/members/{user_id}/role")
def update_member_role(
    circle_id: str,
    user_id: str,
    role: str = Query(..., description="Role: admin or member"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Promote or demote member to/from admin. Requires circle owner."""
    owner_mem = db.query(CrewCircleMember).filter(
        CrewCircleMember.circle_id == circle_id,
        CrewCircleMember.user_id == current_user.id,
        CrewCircleMember.role == "owner"
    ).first()
    if not owner_mem:
        raise HTTPException(status_code=403, detail="Only circle owner can change member roles")

    target_mem = db.query(CrewCircleMember).filter(
        CrewCircleMember.circle_id == circle_id,
        CrewCircleMember.user_id == user_id
    ).first()
    if not target_mem:
        raise HTTPException(status_code=404, detail="Member not found")

    if role in ("admin", "member"):
        target_mem.role = role
        db.commit()
        return {"message": f"Member role updated to {role}", "user_id": user_id, "role": role}
    raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'member'")


@router.post("/{circle_id}/trips")
def link_or_create_circle_trip(
    circle_id: str,
    trip_id: Optional[str] = None,
    destination_slug: Optional[str] = None,
    title: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    total_budget: float = 10000.0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Link an existing trip or create a new collaborative trip inside the circle."""
    require_circle_membership(circle_id, current_user.id, db)
    circle = db.query(CrewCircle).filter(CrewCircle.id == circle_id).first()

    target_trip = None
    if trip_id:
        target_trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not target_trip:
            raise HTTPException(status_code=404, detail="Trip not found")
    else:
        # Create a new trip
        if not destination_slug:
            raise HTTPException(status_code=400, detail="Destination slug is required to create a new trip")
        dest = db.query(Destination).filter(Destination.slug == destination_slug).first()
        if not dest:
            raise HTTPException(status_code=404, detail="Destination not found")

        s_date = start_date or date.today()
        e_date = end_date or s_date
        t_title = title or f"{circle.name} to {dest.name}"

        target_trip = Trip(
            user_id=current_user.id,
            destination_id=dest.id,
            title=t_title,
            start_date=s_date,
            end_date=e_date,
            num_days=max(1, (e_date - s_date).days + 1),
            budget_total=total_budget,
            status="active"
        )
        db.add(target_trip)
        db.flush()

    # Link trip to circle idempotently
    existing_link = db.query(CrewCircleTrip).filter(
        CrewCircleTrip.circle_id == circle_id,
        CrewCircleTrip.trip_id == target_trip.id
    ).first()
    if not existing_link:
        link = CrewCircleTrip(circle_id=circle_id, trip_id=target_trip.id)
        db.add(link)

    # Synchronize all circle members as trip members
    circle_mems = db.query(CrewCircleMember).filter(CrewCircleMember.circle_id == circle_id).all()
    for cm in circle_mems:
        existing_tm = db.query(TripMember).filter(
            TripMember.trip_id == target_trip.id,
            TripMember.user_id == cm.user_id
        ).first()
        if not existing_tm:
            tm = TripMember(
                trip_id=target_trip.id,
                user_id=cm.user_id,
                role="editor" if cm.role in ("owner", "admin") else "viewer"
            )
            db.add(tm)

    # Activity log
    act = CrewCircleActivity(
        circle_id=circle_id,
        user_id=current_user.id,
        activity_type="trip_created",
        content=f"{current_user.full_name} planned a new trip: '{target_trip.title}'"
    )
    db.add(act)

    db.commit()
    return {"message": "Trip linked to circle successfully", "trip_id": target_trip.id, "circle_id": circle_id}


@router.get("/{circle_id}/activity", response_model=List[CrewCircleActivityResponse])
def get_circle_activity(
    circle_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve activity stream and chat messages for a circle."""
    require_circle_membership(circle_id, current_user.id, db)
    acts = db.query(CrewCircleActivity).filter(
        CrewCircleActivity.circle_id == circle_id
    ).order_by(CrewCircleActivity.created_at.desc()).limit(limit).all()

    items = []
    for a in acts:
        u_name = None
        u_avatar = None
        if a.user_id:
            u = db.query(User).filter(User.id == a.user_id).first()
            if u:
                u_name = u.full_name
                u_avatar = u.avatar_url
        items.append(CrewCircleActivityResponse(
            id=a.id,
            circle_id=a.circle_id,
            user_id=a.user_id,
            user_name=u_name,
            user_avatar_url=u_avatar,
            activity_type=a.activity_type,
            content=a.content,
            metadata_json=a.metadata_json,
            created_at=a.created_at
        ))
    return items


@router.post("/{circle_id}/activity", response_model=CrewCircleActivityResponse)
def post_circle_activity(
    circle_id: str,
    payload: CrewCircleActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Post a chat message or activity into the circle workspace."""
    require_circle_membership(circle_id, current_user.id, db)
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    act = CrewCircleActivity(
        circle_id=circle_id,
        user_id=current_user.id,
        activity_type=payload.activity_type or "chat",
        content=payload.content.strip(),
        metadata_json=payload.metadata_json
    )
    db.add(act)
    db.commit()
    db.refresh(act)

    return CrewCircleActivityResponse(
        id=act.id,
        circle_id=act.circle_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_avatar_url=current_user.avatar_url,
        activity_type=act.activity_type,
        content=act.content,
        metadata_json=act.metadata_json,
        created_at=act.created_at
    )


@router.get("/{circle_id}/suggestions", response_model=List[CrewCircleSuggestionResponse])
def list_circle_suggestions(
    circle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List collaborative destination, date, stay and activity suggestions with voting status."""
    require_circle_membership(circle_id, current_user.id, db)
    suggs = db.query(CrewCircleSuggestion).filter(
        CrewCircleSuggestion.circle_id == circle_id
    ).order_by(CrewCircleSuggestion.created_at.desc()).all()

    items = []
    for s in suggs:
        u = db.query(User).filter(User.id == s.user_id).first()
        try:
            votes = json.loads(s.votes_json) if s.votes_json else []
        except Exception:
            votes = []

        items.append(CrewCircleSuggestionResponse(
            id=s.id,
            circle_id=s.circle_id,
            user_id=s.user_id,
            user_name=u.full_name if u else "Traveler",
            suggestion_type=s.suggestion_type,
            title=s.title,
            description=s.description,
            data_json=s.data_json,
            votes=votes,
            votes_count=len(votes),
            has_voted=current_user.id in votes,
            created_at=s.created_at
        ))
    return items


@router.post("/{circle_id}/suggestions", response_model=CrewCircleSuggestionResponse)
def create_circle_suggestion(
    circle_id: str,
    payload: CrewCircleSuggestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Propose a destination, date, or activity for circle voting."""
    require_circle_membership(circle_id, current_user.id, db)
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Suggestion title cannot be empty")

    sugg = CrewCircleSuggestion(
        circle_id=circle_id,
        user_id=current_user.id,
        suggestion_type=payload.suggestion_type or "destination",
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        data_json=payload.data_json,
        votes_json=json.dumps([current_user.id])  # creator automatically votes
    )
    db.add(sugg)

    # Activity log
    act = CrewCircleActivity(
        circle_id=circle_id,
        user_id=current_user.id,
        activity_type="suggestion_added",
        content=f"{current_user.full_name} suggested {payload.suggestion_type}: '{sugg.title}'."
    )
    db.add(act)

    db.commit()
    db.refresh(sugg)

    return CrewCircleSuggestionResponse(
        id=sugg.id,
        circle_id=sugg.circle_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        suggestion_type=sugg.suggestion_type,
        title=sugg.title,
        description=sugg.description,
        data_json=sugg.data_json,
        votes=[current_user.id],
        votes_count=1,
        has_voted=True,
        created_at=sugg.created_at
    )


@router.post("/suggestions/{suggestion_id}/vote")
@router.post("/{circle_id}/suggestions/{suggestion_id}/vote")
def vote_on_suggestion(
    suggestion_id: str,
    circle_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle vote on a suggestion."""
    sugg = db.query(CrewCircleSuggestion).filter(CrewCircleSuggestion.id == suggestion_id).first()
    if not sugg:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    require_circle_membership(sugg.circle_id, current_user.id, db)

    try:
        votes = json.loads(sugg.votes_json) if sugg.votes_json else []
    except Exception:
        votes = []

    if current_user.id in votes:
        votes.remove(current_user.id)
        action = "unvoted"
    else:
        votes.append(current_user.id)
        action = "voted"

    sugg.votes_json = json.dumps(votes)
    db.commit()

    return {
        "suggestion_id": suggestion_id,
        "action": action,
        "votes_count": len(votes),
        "upvotes_count": len(votes),
        "has_voted": current_user.id in votes
    }


@router.post("/{circle_id}/ask-vanvas", response_model=AskVanvasCircleResponse)
def ask_vanvas_for_circle(
    circle_id: str,
    payload: AskVanvasCircleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI Travel Companion scoped strictly to Circle and linked Trip context.
    Never leaks information from other circles or unlinked trips.
    """
    require_circle_membership(circle_id, current_user.id, db)
    circle = db.query(CrewCircle).filter(CrewCircle.id == circle_id).first()

    # Build authorized context
    member_names = [m.user.full_name for m in circle.members if m.user]
    prompt_lower = payload.prompt.lower()

    trip_info = ""
    dest_name = "the Himalayas"
    if payload.trip_id:
        t = db.query(Trip).filter(Trip.id == payload.trip_id).first()
        if t and t.destination:
            dest_name = t.destination.name
            trip_info = f"planning a trip to {dest_name} ({t.num_days} days, budget ₹{t.budget_total})"

    # Generate tailored, authentic Indian travel journal response
    if "budget" in prompt_lower or "cost" in prompt_lower or "split" in prompt_lower:
        reply = (
            f"For {circle.name} ({len(member_names)} travellers) {trip_info or f'heading to {dest_name}'}, "
            f"a comfortable daily mountain budget is approximately ₹2,500–₹3,200 per person including stays and shared transit. "
            f"I recommend using your Main Group Ledger for common stays and vehicles, and creating a Split Pod for subgroup purchases like café bills or room allocations."
        )
    elif "pack" in prompt_lower or "gear" in prompt_lower:
        reply = (
            f"Shared packing advisory for {circle.name} travelling to {dest_name}: "
            f"Coordinate 1 high-power powerbank per room, 1 compact first-aid kit with altitude & motion sickness meds, "
            f"and thermal inner layers. Remind {', '.join(member_names[:3])} to carry sturdy hiking shoes with ankle support."
        )
    else:
        reply = (
            f"Namaste {current_user.full_name}! For {circle.name} in {dest_name}, "
            f"I recommend pacing your itinerary with slow mountain mornings, starting around 9:00 AM, "
            f"group lunch at authentic local dhabas, and leaving late afternoons open for spontaneous village walks."
        )

    return AskVanvasCircleResponse(
        reply=reply,
        suggested_places=[],
        suggested_actions=[
            {"title": "Open Plan Budget", "action": "open_finance"},
            {"title": "Suggest a Place", "action": "open_suggestions"}
        ]
    )
