"""
VANVAS Split Pods Router
Subgroup ledgers inside a Crew Circle or Trip (e.g. Smokers, Room 2, Bike Crew).
Expenses and balances inside a pod remain strictly isolated from the main group ledger.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import (
    User, CrewCircle, CrewCircleMember, SplitPod, SplitPodMember,
    Expense, SettlementPayment
)
from app.schemas.schemas import (
    SplitPodCreate, SplitPodUpdate, SplitPodResponse,
    SplitPodMemberResponse, ContextBalanceResponse
)
from app.services.finance_service import calculate_group_balances

router = APIRouter()


def require_circle_membership(circle_id: str, user_id: str, db: Session) -> CrewCircleMember:
    mem = db.query(CrewCircleMember).filter(
        CrewCircleMember.circle_id == circle_id,
        CrewCircleMember.user_id == user_id
    ).first()
    if not mem:
        raise HTTPException(status_code=403, detail="You are not a member of this Crew Circle")
    return mem


def require_pod_membership(pod_id: str, user_id: str, db: Session) -> SplitPodMember:
    mem = db.query(SplitPodMember).filter(
        SplitPodMember.pod_id == pod_id,
        SplitPodMember.user_id == user_id
    ).first()
    if not mem:
        raise HTTPException(status_code=403, detail="You are not a member of this Split Pod")
    return mem


@router.post("", response_model=SplitPodResponse)
def create_split_pod(
    payload: SplitPodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new Split Pod within a Crew Circle.
    Validates that every selected member belongs to the parent circle.
    """
    require_circle_membership(payload.circle_id, current_user.id, db)
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Pod name cannot be empty")

    pod = SplitPod(
        circle_id=payload.circle_id,
        trip_id=payload.trip_id,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        created_by_user_id=current_user.id
    )
    db.add(pod)
    db.flush()

    # Add creator
    initial_uids = set(payload.get_all_member_ids())
    initial_uids.add(current_user.id)

    # Validate circle membership for each candidate
    circle_members = {
        m.user_id for m in db.query(CrewCircleMember).filter(
            CrewCircleMember.circle_id == payload.circle_id
        ).all()
    }

    for uid in initial_uids:
        if uid not in circle_members:
            raise HTTPException(
                status_code=400,
                detail=f"User {uid} is not a member of the parent Crew Circle"
            )
        pmem = SplitPodMember(pod_id=pod.id, user_id=uid)
        db.add(pmem)

    db.commit()
    db.refresh(pod)

    return get_pod_detail(pod.id, current_user, db)


@router.get("/circle/{circle_id}", response_model=List[SplitPodResponse])
def list_pods_in_circle(
    circle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List Split Pods in a circle. Returns pods where current user is a member or creator."""
    require_circle_membership(circle_id, current_user.id, db)

    # Get pods user belongs to
    my_pod_ids = [
        pm.pod_id for pm in db.query(SplitPodMember).filter(
            SplitPodMember.user_id == current_user.id
        ).all()
    ]

    pods = db.query(SplitPod).filter(
        SplitPod.circle_id == circle_id,
        SplitPod.id.in_(my_pod_ids)
    ).order_by(SplitPod.created_at.desc()).all()

    items = []
    for p in pods:
        members = db.query(SplitPodMember).filter(SplitPodMember.pod_id == p.id).all()
        m_items = []
        for m in members:
            u = db.query(User).filter(User.id == m.user_id).first()
            if u:
                m_items.append(SplitPodMemberResponse(
                    id=m.id,
                    user_id=u.id,
                    user_name=u.full_name,
                    vanvas_id=u.vanvas_id,
                    avatar_url=u.avatar_url,
                    joined_at=m.joined_at
                ))
        items.append(SplitPodResponse(
            id=p.id,
            circle_id=p.circle_id,
            trip_id=p.trip_id,
            name=p.name,
            description=p.description,
            created_by_user_id=p.created_by_user_id,
            member_count=len(m_items),
            created_at=p.created_at,
            members=m_items
        ))
    return items


@router.get("/{pod_id}", response_model=SplitPodResponse)
def get_pod_detail(
    pod_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a Split Pod. Requires pod membership."""
    require_pod_membership(pod_id, current_user.id, db)
    pod = db.query(SplitPod).filter(SplitPod.id == pod_id).first()
    if not pod:
        raise HTTPException(status_code=404, detail="Split Pod not found")

    members = db.query(SplitPodMember).filter(SplitPodMember.pod_id == pod_id).all()
    m_items = []
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        if u:
            m_items.append(SplitPodMemberResponse(
                id=m.id,
                user_id=u.id,
                user_name=u.full_name,
                vanvas_id=u.vanvas_id,
                avatar_url=u.avatar_url,
                joined_at=m.joined_at
            ))

    return SplitPodResponse(
        id=pod.id,
        circle_id=pod.circle_id,
        trip_id=pod.trip_id,
        name=pod.name,
        description=pod.description,
        created_by_user_id=pod.created_by_user_id,
        member_count=len(m_items),
        created_at=pod.created_at,
        members=m_items
    )


@router.put("/{pod_id}", response_model=SplitPodResponse)
def update_split_pod(
    pod_id: str,
    payload: SplitPodUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update Split Pod name or description."""
    require_pod_membership(pod_id, current_user.id, db)
    pod = db.query(SplitPod).filter(SplitPod.id == pod_id).first()
    if not pod:
        raise HTTPException(status_code=404, detail="Split Pod not found")

    if payload.name is not None and payload.name.strip():
        pod.name = payload.name.strip()
    if payload.description is not None:
        pod.description = payload.description.strip()

    pod.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(pod)
    return get_pod_detail(pod.id, current_user, db)


@router.delete("/{pod_id}")
def delete_split_pod(
    pod_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a Split Pod. Requires pod creator or circle owner/admin."""
    pod = db.query(SplitPod).filter(SplitPod.id == pod_id).first()
    if not pod:
        raise HTTPException(status_code=404, detail="Split Pod not found")

    if pod.created_by_user_id != current_user.id:
        cm = db.query(CrewCircleMember).filter(
            CrewCircleMember.circle_id == pod.circle_id,
            CrewCircleMember.user_id == current_user.id
        ).first()
        if not cm or cm.role not in ("owner", "admin"):
            raise HTTPException(status_code=403, detail="Only pod creator or circle admin can delete the pod")

    db.delete(pod)
    db.commit()
    return {"message": "Split Pod deleted successfully", "pod_id": pod_id}


@router.post("/{pod_id}/members", response_model=SplitPodMemberResponse)
def add_pod_member(
    pod_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a circle member to the pod."""
    require_pod_membership(pod_id, current_user.id, db)
    pod = db.query(SplitPod).filter(SplitPod.id == pod_id).first()
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")

    # Verify target is circle member
    is_circle_mem = db.query(CrewCircleMember).filter(
        CrewCircleMember.circle_id == pod.circle_id,
        CrewCircleMember.user_id == user_id
    ).first()
    if not is_circle_mem:
        raise HTTPException(status_code=400, detail="User must belong to the parent circle")

    existing = db.query(SplitPodMember).filter(
        SplitPodMember.pod_id == pod_id,
        SplitPodMember.user_id == user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already in this pod")

    pm = SplitPodMember(pod_id=pod_id, user_id=user_id)
    db.add(pm)
    db.commit()
    db.refresh(pm)

    u = db.query(User).filter(User.id == user_id).first()
    return SplitPodMemberResponse(
        id=pm.id,
        user_id=u.id,
        user_name=u.full_name,
        vanvas_id=u.vanvas_id,
        avatar_url=u.avatar_url,
        joined_at=pm.joined_at
    )


@router.delete("/{pod_id}/members/{user_id}")
def remove_pod_member(
    pod_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove member from pod or leave pod."""
    require_pod_membership(pod_id, current_user.id, db)
    pod = db.query(SplitPod).filter(SplitPod.id == pod_id).first()
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")

    if user_id != current_user.id and pod.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only pod creator can remove other members")

    pm = db.query(SplitPodMember).filter(
        SplitPodMember.pod_id == pod_id,
        SplitPodMember.user_id == user_id
    ).first()
    if not pm:
        raise HTTPException(status_code=404, detail="Member not in pod")

    db.delete(pm)
    db.commit()
    return {"message": "Member removed from pod", "status": "removed"}


@router.get("/{pod_id}/finance", response_model=ContextBalanceResponse)
def get_pod_finance_balances(
    pod_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get isolated balances and debt settlements for this Split Pod.
    Expenses and debts here NEVER affect non-pod members or the Main Group Ledger.
    """
    require_pod_membership(pod_id, current_user.id, db)
    pod = db.query(SplitPod).filter(SplitPod.id == pod_id).first()
    if not pod:
        raise HTTPException(status_code=404, detail="Split Pod not found")

    members = db.query(SplitPodMember).filter(SplitPodMember.pod_id == pod_id).all()
    member_uids = [m.user_id for m in members]

    user_names = {}
    for uid in member_uids:
        u = db.query(User).filter(User.id == uid).first()
        if u:
            user_names[uid] = u.full_name

    expenses = db.query(Expense).filter(
        Expense.split_pod_id == pod_id,
        Expense.is_deleted.is_(False)
    ).all()

    settlements = db.query(SettlementPayment).filter(
        SettlementPayment.split_pod_id == pod_id
    ).all()

    balances = calculate_group_balances(member_uids, expenses, settlements, user_names)
    return ContextBalanceResponse(**balances)
