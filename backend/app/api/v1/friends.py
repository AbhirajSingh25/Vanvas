"""
VANVAS Friend Connection & Identity Router
Handles unique VANVAS ID discovery, friend requests, relationships, and blocking.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import (
    User, UserPreference, FriendRequest, Friendship, TravelerBlock, generate_vanvas_id
)
from app.schemas.schemas import (
    VanvasIdResponse, UserPublicProfile, FriendRequestCreate,
    FriendRequestResponse, FriendResponse
)

router = APIRouter()


@router.get("/me/vanvas-id", response_model=VanvasIdResponse)
def get_my_vanvas_id(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve authenticated user's unique VANVAS ID."""
    if not current_user.vanvas_id:
        current_user.vanvas_id = generate_vanvas_id()
        db.commit()
        db.refresh(current_user)
    return VanvasIdResponse(vanvas_id=current_user.vanvas_id)


@router.post("/me/vanvas-id/regenerate", response_model=VanvasIdResponse)
def regenerate_my_vanvas_id(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Explicitly regenerate user's VANVAS ID with collision avoidance."""
    for _ in range(10):
        new_id = generate_vanvas_id()
        existing = db.query(User).filter(User.vanvas_id == new_id).first()
        if not existing:
            current_user.vanvas_id = new_id
            db.commit()
            db.refresh(current_user)
            return VanvasIdResponse(vanvas_id=current_user.vanvas_id)
    raise HTTPException(status_code=500, detail="Failed to generate unique VANVAS ID")


@router.get("/lookup/{vanvas_id}", response_model=UserPublicProfile)
def lookup_by_vanvas_id(
    vanvas_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search a traveler by their shareable VANVAS ID.
    Returns minimal public profile information.
    """
    vid = vanvas_id.strip().upper()
    target_user = db.query(User).filter(User.vanvas_id == vid).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Traveler with this VANVAS ID not found")

    if target_user.id == current_user.id:
        return UserPublicProfile(
            id=current_user.id,
            vanvas_id=current_user.vanvas_id,
            full_name=current_user.full_name,
            avatar_url=current_user.avatar_url,
            avatar_preset=current_user.avatar_preset,
            friendship_status="self"
        )

    # Check privacy setting
    pref = db.query(UserPreference).filter(UserPreference.user_id == target_user.id).first()
    if pref and not pref.allow_friend_requests_via_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This traveler has disabled discovery via VANVAS ID"
        )

    # Check blocks
    is_blocked = db.query(TravelerBlock).filter(
        ((TravelerBlock.blocker_user_id == current_user.id) & (TravelerBlock.blocked_user_id == target_user.id)) |
        ((TravelerBlock.blocker_user_id == target_user.id) & (TravelerBlock.blocked_user_id == current_user.id))
    ).first()
    if is_blocked:
        return UserPublicProfile(
            id=target_user.id,
            vanvas_id=target_user.vanvas_id,
            full_name="VANVAS Traveler",
            friendship_status="blocked"
        )

    # Determine friendship status
    friendship = db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) & (Friendship.friend_id == target_user.id)) |
        ((Friendship.user_id == target_user.id) & (Friendship.friend_id == current_user.id))
    ).first()
    if friendship:
        status_str = "friends"
    else:
        incoming = db.query(FriendRequest).filter(
            FriendRequest.sender_id == target_user.id,
            FriendRequest.receiver_id == current_user.id,
            FriendRequest.status == "PENDING"
        ).first()
        if incoming:
            status_str = "pending_incoming"
        else:
            outgoing = db.query(FriendRequest).filter(
                FriendRequest.sender_id == current_user.id,
                FriendRequest.receiver_id == target_user.id,
                FriendRequest.status == "PENDING"
            ).first()
            status_str = "pending_outgoing" if outgoing else "none"

    return UserPublicProfile(
        id=target_user.id,
        vanvas_id=target_user.vanvas_id,
        full_name=target_user.full_name,
        avatar_url=target_user.avatar_url,
        avatar_preset=target_user.avatar_preset,
        friendship_status=status_str
    )


@router.post("/requests", response_model=FriendRequestResponse)
def send_friend_request(
    payload: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a friend request to a user via their VANVAS ID or user ID."""
    target_user = None
    if payload.target_user_id:
        target_user = db.query(User).filter(User.id == payload.target_user_id).first()
    if not target_user and payload.vanvas_id:
        vid = payload.vanvas_id.strip().upper()
        target_user = db.query(User).filter(User.vanvas_id == vid).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="Traveler not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot send a friend request to yourself")

    # Check privacy setting
    pref = db.query(UserPreference).filter(UserPreference.user_id == target_user.id).first()
    if pref and not pref.allow_friend_requests_via_id:
        raise HTTPException(status_code=403, detail="This user does not accept friend requests via VANVAS ID")

    # Check blocks
    blocked = db.query(TravelerBlock).filter(
        ((TravelerBlock.blocker_user_id == current_user.id) & (TravelerBlock.blocked_user_id == target_user.id)) |
        ((TravelerBlock.blocker_user_id == target_user.id) & (TravelerBlock.blocked_user_id == current_user.id))
    ).first()
    if blocked:
        raise HTTPException(status_code=403, detail="Cannot send friend request to this user")

    # Check if already friends
    existing_friendship = db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) & (Friendship.friend_id == target_user.id)) |
        ((Friendship.user_id == target_user.id) & (Friendship.friend_id == current_user.id))
    ).first()
    if existing_friendship:
        raise HTTPException(status_code=400, detail="You are already friends with this traveler")

    # Check if target user already sent a pending request to us -> auto-accept
    mutual_request = db.query(FriendRequest).filter(
        FriendRequest.sender_id == target_user.id,
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == "PENDING"
    ).first()

    if mutual_request:
        mutual_request.status = "ACCEPTED"
        # Create mutual friendships
        f1 = Friendship(user_id=current_user.id, friend_id=target_user.id)
        f2 = Friendship(user_id=target_user.id, friend_id=current_user.id)
        db.add_all([f1, f2])
        db.commit()
        db.refresh(mutual_request)
        return FriendRequestResponse(
            id=mutual_request.id,
            sender_id=target_user.id,
            sender_name=target_user.full_name,
            sender_vanvas_id=target_user.vanvas_id or "",
            receiver_id=current_user.id,
            receiver_name=current_user.full_name,
            receiver_vanvas_id=current_user.vanvas_id or "",
            status="ACCEPTED",
            created_at=mutual_request.created_at
        )

    # Check existing outgoing request
    existing_request = db.query(FriendRequest).filter(
        FriendRequest.sender_id == current_user.id,
        FriendRequest.receiver_id == target_user.id
    ).first()

    if existing_request:
        if existing_request.status == "PENDING":
            raise HTTPException(status_code=400, detail="Friend request already pending")
        # Reuse or update existing record
        existing_request.status = "PENDING"
        existing_request.updated_at = datetime.now(timezone.utc)
        req = existing_request
    else:
        req = FriendRequest(
            sender_id=current_user.id,
            receiver_id=target_user.id,
            status="PENDING"
        )
        db.add(req)

    db.commit()
    db.refresh(req)

    return FriendRequestResponse(
        id=req.id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_vanvas_id=current_user.vanvas_id or "",
        sender_avatar_url=current_user.avatar_url,
        sender_avatar_preset=current_user.avatar_preset,
        receiver_id=target_user.id,
        receiver_name=target_user.full_name,
        receiver_vanvas_id=target_user.vanvas_id or "",
        receiver_avatar_url=target_user.avatar_url,
        status="PENDING",
        created_at=req.created_at
    )


@router.get("/requests/incoming", response_model=List[FriendRequestResponse])
def list_incoming_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List pending friend requests received by current user."""
    reqs = db.query(FriendRequest).filter(
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == "PENDING"
    ).order_by(FriendRequest.created_at.desc()).all()

    items = []
    for r in reqs:
        sender = db.query(User).filter(User.id == r.sender_id).first()
        if sender:
            items.append(FriendRequestResponse(
                id=r.id,
                sender_id=sender.id,
                sender_name=sender.full_name,
                sender_vanvas_id=sender.vanvas_id or "",
                sender_avatar_url=sender.avatar_url,
                sender_avatar_preset=sender.avatar_preset,
                receiver_id=current_user.id,
                receiver_name=current_user.full_name,
                receiver_vanvas_id=current_user.vanvas_id or "",
                receiver_avatar_url=current_user.avatar_url,
                status=r.status,
                created_at=r.created_at
            ))
    return items


@router.get("/requests/outgoing", response_model=List[FriendRequestResponse])
def list_outgoing_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List pending friend requests sent by current user."""
    reqs = db.query(FriendRequest).filter(
        FriendRequest.sender_id == current_user.id,
        FriendRequest.status == "PENDING"
    ).order_by(FriendRequest.created_at.desc()).all()

    items = []
    for r in reqs:
        receiver = db.query(User).filter(User.id == r.receiver_id).first()
        if receiver:
            items.append(FriendRequestResponse(
                id=r.id,
                sender_id=current_user.id,
                sender_name=current_user.full_name,
                sender_vanvas_id=current_user.vanvas_id or "",
                sender_avatar_url=current_user.avatar_url,
                sender_avatar_preset=current_user.avatar_preset,
                receiver_id=receiver.id,
                receiver_name=receiver.full_name,
                receiver_vanvas_id=receiver.vanvas_id or "",
                receiver_avatar_url=receiver.avatar_url,
                status=r.status,
                created_at=r.created_at
            ))
    return items


@router.post("/requests/{request_id}/accept", response_model=FriendRequestResponse)
def accept_friend_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept an incoming friend request."""
    req = db.query(FriendRequest).filter(
        FriendRequest.id == request_id,
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == "PENDING"
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Pending friend request not found")

    sender = db.query(User).filter(User.id == req.sender_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")

    req.status = "ACCEPTED"
    req.updated_at = datetime.now(timezone.utc)

    # Establish mutual friendship idempotently
    f1 = db.query(Friendship).filter(Friendship.user_id == current_user.id, Friendship.friend_id == sender.id).first()
    if not f1:
        f1 = Friendship(user_id=current_user.id, friend_id=sender.id)
        db.add(f1)

    f2 = db.query(Friendship).filter(Friendship.user_id == sender.id, Friendship.friend_id == current_user.id).first()
    if not f2:
        f2 = Friendship(user_id=sender.id, friend_id=current_user.id)
        db.add(f2)

    db.commit()

    return FriendRequestResponse(
        id=req.id,
        sender_id=sender.id,
        sender_name=sender.full_name,
        sender_vanvas_id=sender.vanvas_id or "",
        sender_avatar_url=sender.avatar_url,
        sender_avatar_preset=sender.avatar_preset,
        receiver_id=current_user.id,
        receiver_name=current_user.full_name,
        receiver_vanvas_id=current_user.vanvas_id or "",
        receiver_avatar_url=current_user.avatar_url,
        status="ACCEPTED",
        created_at=req.created_at
    )


@router.post("/requests/{request_id}/decline")
def decline_friend_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline an incoming friend request."""
    req = db.query(FriendRequest).filter(
        FriendRequest.id == request_id,
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == "PENDING"
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Pending friend request not found")

    req.status = "DECLINED"
    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Friend request declined", "status": "DECLINED"}


@router.post("/requests/{request_id}/cancel")
def cancel_friend_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an outgoing pending friend request."""
    req = db.query(FriendRequest).filter(
        FriendRequest.id == request_id,
        FriendRequest.sender_id == current_user.id,
        FriendRequest.status == "PENDING"
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Pending outgoing request not found")

    req.status = "CANCELLED"
    req.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Friend request cancelled", "status": "CANCELLED"}


@router.get("", response_model=List[FriendResponse])
def list_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all accepted friends of the current user."""
    friendships = db.query(Friendship).filter(
        Friendship.user_id == current_user.id
    ).order_by(Friendship.created_at.desc()).all()

    items = []
    for f in friendships:
        friend_user = db.query(User).filter(User.id == f.friend_id).first()
        if friend_user:
            items.append(FriendResponse(
                id=f.id,
                user_id=current_user.id,
                friend_id=friend_user.id,
                friend_name=friend_user.full_name,
                friend_vanvas_id=friend_user.vanvas_id or "",
                friend_avatar_url=friend_user.avatar_url,
                friend_avatar_preset=friend_user.avatar_preset,
                created_at=f.created_at
            ))
    return items


@router.delete("/{friend_id}")
def remove_friend(
    friend_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove friendship between two users.
    Preserves all historical expenses, trips, and circle records.
    """
    db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) & (Friendship.friend_id == friend_id)) |
        ((Friendship.user_id == friend_id) & (Friendship.friend_id == current_user.id))
    ).delete(synchronize_session=False)

    db.commit()
    return {"message": "Friend removed successfully", "status": "removed"}


@router.post("/{target_user_id}/block")
def block_user(
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Block a user: cancels pending requests and removes friendship."""
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")

    # Add block if not exists
    existing = db.query(TravelerBlock).filter(
        TravelerBlock.blocker_user_id == current_user.id,
        TravelerBlock.blocked_user_id == target_user_id
    ).first()
    if not existing:
        blk = TravelerBlock(
            blocker_user_id=current_user.id,
            blocked_user_id=target_user_id,
            reason="Blocked via Friends Hub"
        )
        db.add(blk)

    # Cancel any requests between them
    db.query(FriendRequest).filter(
        ((FriendRequest.sender_id == current_user.id) & (FriendRequest.receiver_id == target_user_id)) |
        ((FriendRequest.sender_id == target_user_id) & (FriendRequest.receiver_id == current_user.id))
    ).delete(synchronize_session=False)

    # Remove friendship
    db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) & (Friendship.friend_id == target_user_id)) |
        ((Friendship.user_id == target_user_id) & (Friendship.friend_id == current_user.id))
    ).delete(synchronize_session=False)

    db.commit()
    return {"message": "User blocked", "status": "blocked"}


@router.post("/{target_user_id}/unblock")
def unblock_user(
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unblock a user."""
    db.query(TravelerBlock).filter(
        TravelerBlock.blocker_user_id == current_user.id,
        TravelerBlock.blocked_user_id == target_user_id
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": "User unblocked", "status": "unblocked"}
