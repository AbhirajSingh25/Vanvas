"""
VANVAS Collaborative Finance Router
Supports 3-layer finance architecture:
1. Trip Plan Budget (forecast only, zero debt impact)
2. Main Group Expense Ledger (shared expenses, settlements, audit logs, optimistic concurrency)
3. Split Pods (isolated subgroup ledgers with strict zero-leakage guarantee)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, date
import json

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import (
    User, Trip, TripMember, CrewCircle, CrewCircleMember, SplitPod, SplitPodMember,
    TripBudgetPlan, TripBudgetItem, Expense, ExpenseShare, ExpenseAuditLog,
    SettlementPayment, generate_uuid
)
from app.schemas.schemas import (
    TripBudgetPlanCreate, TripBudgetPlanUpdate, TripBudgetPlanResponse,
    TripBudgetItemCreate, TripBudgetItemUpdate, TripBudgetItemResponse,
    CollaborativeExpenseCreate, CollaborativeExpenseUpdate, CollaborativeExpenseResponse,
    ExpenseAuditLogResponse, SettlementPaymentCreate, SettlementPaymentResponse,
    ContextBalanceResponse
)
from app.services.finance_service import (
    to_paise, from_paise, calculate_split_shares, validate_payers_allocation,
    calculate_group_balances, FinanceCalculationException
)

TupleMembers = tuple[List[str], Dict[str, str]]

router = APIRouter()


# ---------------------------------------------------------
# Helper Functions: Authorization & Member Resolution
# ---------------------------------------------------------

def _verify_context_access(
    db: Session,
    user: User,
    trip_id: Optional[str] = None,
    circle_id: Optional[str] = None,
    split_pod_id: Optional[str] = None
) -> TupleMembers:
    """
    Verify current user has access to the given context and return list of all member IDs and names.
    Raises 403 or 404 if unauthorized or not found.
    """
    if split_pod_id:
        pod = db.query(SplitPod).filter(SplitPod.id == split_pod_id).first()
        if not pod:
            raise HTTPException(status_code=404, detail="Split Pod not found")
        # Check membership
        member_record = db.query(SplitPodMember).filter(
            SplitPodMember.pod_id == split_pod_id,
            SplitPodMember.user_id == user.id
        ).first()
        if not member_record and pod.created_by_user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not a member of this Split Pod")

        members = db.query(SplitPodMember).filter(SplitPodMember.pod_id == split_pod_id).all()
        member_ids = list(set([m.user_id for m in members] + [pod.created_by_user_id]))
        users = db.query(User).filter(User.id.in_(member_ids)).all()
        user_names = {u.id: u.full_name for u in users}
        return member_ids, user_names

    if circle_id:
        circle = db.query(CrewCircle).filter(CrewCircle.id == circle_id).first()
        if not circle:
            raise HTTPException(status_code=404, detail="Crew Circle not found")
        member_record = db.query(CrewCircleMember).filter(
            CrewCircleMember.circle_id == circle_id,
            CrewCircleMember.user_id == user.id
        ).first()
        if not member_record and circle.created_by_user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not a member of this Crew Circle")

        members = db.query(CrewCircleMember).filter(CrewCircleMember.circle_id == circle_id).all()
        member_ids = list(set([m.user_id for m in members] + [circle.created_by_user_id]))
        users = db.query(User).filter(User.id.in_(member_ids)).all()
        user_names = {u.id: u.full_name for u in users}
        return member_ids, user_names

    if trip_id:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        trip_member = db.query(TripMember).filter(
            TripMember.trip_id == trip_id,
            TripMember.user_id == user.id
        ).first()
        if trip.user_id != user.id and not trip_member and user.role != "admin":
            raise HTTPException(status_code=403, detail="Not a member of this trip")

        trip_members = db.query(TripMember).filter(TripMember.trip_id == trip_id).all()
        member_ids = list(set([m.user_id for m in trip_members] + [trip.user_id]))
        users = db.query(User).filter(User.id.in_(member_ids)).all()
        user_names = {u.id: u.full_name for u in users}
        return member_ids, user_names

    # If no context provided
    return [user.id], {user.id: user.full_name}


# ---------------------------------------------------------
# LAYER 1: TRIP PLAN BUDGET (Planning Forecast Only)
# ---------------------------------------------------------

@router.post("/budget-plans", response_model=TripBudgetPlanResponse)
def create_or_get_budget_plan(
    data: TripBudgetPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or retrieve a planned budget for a Trip or Crew Circle."""
    _verify_context_access(db, current_user, trip_id=data.trip_id, circle_id=data.circle_id)

    # If plan already exists for this trip, return it
    if data.trip_id:
        existing = db.query(TripBudgetPlan).filter(TripBudgetPlan.trip_id == data.trip_id).first()
        if existing:
            return _format_budget_plan_response(existing)

    plan = TripBudgetPlan(
        id=generate_uuid(),
        trip_id=data.trip_id,
        circle_id=data.circle_id,
        user_id=current_user.id,
        name=data.name,
        target_budget=data.target_budget
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # Add initial items if provided
    for it in data.items:
        item = TripBudgetItem(
            id=generate_uuid(),
            plan_id=plan.id,
            name=it.name,
            category=it.category,
            amount=it.amount,
            calculation_basis=it.calculation_basis,
            unit_price=it.unit_price,
            quantity=it.quantity,
            split_scope=it.split_scope,
            split_pod_id=it.split_pod_id,
            split_method=it.split_method,
            participants_json=it.participants_json,
            notes=it.notes
        )
        db.add(item)
    if data.items:
        db.commit()
        db.refresh(plan)

    return _format_budget_plan_response(plan)


@router.get("/budget-plans/trip/{trip_id}", response_model=TripBudgetPlanResponse)
def get_budget_plan_by_trip(
    trip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get planned budget forecast for a trip."""
    _verify_context_access(db, current_user, trip_id=trip_id)

    plan = db.query(TripBudgetPlan).filter(TripBudgetPlan.trip_id == trip_id).first()
    if not plan:
        # Create a default plan
        plan = TripBudgetPlan(
            id=generate_uuid(),
            trip_id=trip_id,
            user_id=current_user.id,
            name="Trip Planned Budget",
            target_budget=0.0
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

    return _format_budget_plan_response(plan)


@router.get("/budget-plans/{plan_id}", response_model=TripBudgetPlanResponse)
def get_budget_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get planned budget forecast by plan ID."""
    plan = db.query(TripBudgetPlan).filter(TripBudgetPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Budget plan not found")

    _verify_context_access(db, current_user, trip_id=plan.trip_id, circle_id=plan.circle_id)
    return _format_budget_plan_response(plan)


@router.put("/budget-plans/{plan_id}", response_model=TripBudgetPlanResponse)
def update_budget_plan(
    plan_id: str,
    data: TripBudgetPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update overall planned target budget or name."""
    plan = db.query(TripBudgetPlan).filter(TripBudgetPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Budget plan not found")

    _verify_context_access(db, current_user, trip_id=plan.trip_id, circle_id=plan.circle_id)

    if data.name is not None:
        plan.name = data.name
    if data.target_budget is not None:
        plan.target_budget = data.target_budget

    db.commit()
    db.refresh(plan)
    return _format_budget_plan_response(plan)


@router.post("/budget-plans/{plan_id}/items", response_model=TripBudgetItemResponse)
def add_budget_item(
    plan_id: str,
    data: TripBudgetItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a planned item to a budget forecast."""
    plan = db.query(TripBudgetPlan).filter(TripBudgetPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Budget plan not found")

    _verify_context_access(db, current_user, trip_id=plan.trip_id, circle_id=plan.circle_id)

    item = TripBudgetItem(
        id=generate_uuid(),
        plan_id=plan.id,
        name=data.name,
        category=data.category,
        amount=data.amount,
        calculation_basis=data.calculation_basis,
        unit_price=data.unit_price,
        quantity=data.quantity,
        split_scope=data.split_scope,
        split_pod_id=data.split_pod_id,
        split_method=data.split_method,
        participants_json=data.participants_json,
        notes=data.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _format_budget_item_response(item)


@router.put("/budget-plans/items/{item_id}", response_model=TripBudgetItemResponse)
def update_budget_item(
    item_id: str,
    data: TripBudgetItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a planned budget line item."""
    item = db.query(TripBudgetItem).filter(TripBudgetItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Budget item not found")

    plan = db.query(TripBudgetPlan).filter(TripBudgetPlan.id == item.plan_id).first()
    _verify_context_access(db, current_user, trip_id=plan.trip_id, circle_id=plan.circle_id)

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(item, field, val)

    db.commit()
    db.refresh(item)
    return _format_budget_item_response(item)


@router.delete("/budget-plans/items/{item_id}")
def delete_budget_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a planned budget line item."""
    item = db.query(TripBudgetItem).filter(TripBudgetItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Budget item not found")

    plan = db.query(TripBudgetPlan).filter(TripBudgetPlan.id == item.plan_id).first()
    _verify_context_access(db, current_user, trip_id=plan.trip_id, circle_id=plan.circle_id)

    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Budget item removed"}


def _format_budget_item_response(item: TripBudgetItem) -> TripBudgetItemResponse:
    p_count = 1
    if item.participants_json:
        try:
            arr = json.loads(item.participants_json)
            if isinstance(arr, list) and len(arr) > 0:
                p_count = len(arr)
        except Exception:
            p_count = 1
    per_person = round(item.amount / max(1, p_count), 2)
    return TripBudgetItemResponse(
        id=item.id,
        plan_id=item.plan_id,
        name=item.name,
        category=item.category,
        amount=item.amount,
        calculation_basis=item.calculation_basis or "FIXED",
        unit_price=item.unit_price,
        quantity=item.quantity,
        split_scope=item.split_scope or "EVERYONE",
        split_pod_id=item.split_pod_id,
        split_method=item.split_method or "EQUAL",
        participants_json=item.participants_json,
        notes=item.notes,
        estimated_per_person=per_person,
        participant_count=p_count,
        created_at=item.created_at
    )


def _format_budget_plan_response(plan: TripBudgetPlan) -> TripBudgetPlanResponse:
    items = [_format_budget_item_response(it) for it in plan.items]
    total_planned = sum(it.amount for it in items)
    return TripBudgetPlanResponse(
        id=plan.id,
        trip_id=plan.trip_id,
        circle_id=plan.circle_id,
        user_id=plan.user_id,
        name=plan.name,
        target_budget=plan.target_budget,
        total_planned_amount=round(total_planned, 2),
        items=items,
        created_at=plan.created_at
    )


# ---------------------------------------------------------
# LAYER 2 & 3: COLLABORATIVE EXPENSES & LEDGER
# ---------------------------------------------------------

@router.post("/expenses", response_model=CollaborativeExpenseResponse)
def create_collaborative_expense(
    data: CollaborativeExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record an actual collaborative expense with:
    - Single or multi-payer validation
    - Paise-level exact share distribution
    - Optimistic version initialization (version=1)
    - Full immutable audit log entry
    """
    member_ids, user_names = _verify_context_access(
        db, current_user,
        trip_id=data.trip_id,
        circle_id=data.circle_id,
        split_pod_id=data.split_pod_id
    )

    primary_payer_id = data.paid_by_user_id or current_user.id
    if primary_payer_id not in member_ids and current_user.role != "admin":
        raise HTTPException(status_code=400, detail="Primary payer must be a member of the context")

    try:
        validated_payers = validate_payers_allocation(data.amount, data.payers_json, primary_payer_id)
    except FinanceCalculationException as e:
        raise HTTPException(status_code=400, detail=e.message)

    # Default participants to all context members if not provided
    participants = data.participant_user_ids if data.participant_user_ids else member_ids
    # Ensure all participants belong to context
    for p_id in participants:
        if p_id not in member_ids and current_user.role != "admin":
            raise HTTPException(status_code=400, detail=f"Participant {p_id} is not in this context")

    try:
        calculated_shares = calculate_split_shares(
            total_amount=data.amount,
            split_method=data.split_method,
            participant_user_ids=participants,
            split_data=data.split_data
        )
    except FinanceCalculationException as e:
        raise HTTPException(status_code=400, detail=e.message)

    expense_id = generate_uuid()
    expense = Expense(
        id=expense_id,
        trip_id=data.trip_id,
        circle_id=data.circle_id,
        split_pod_id=data.split_pod_id,
        user_id=primary_payer_id,
        created_by_user_id=current_user.id,
        last_edited_by_user_id=current_user.id,
        title=data.title,
        category=data.category,
        amount=data.amount,
        payment_method=data.payment_method,
        date=data.date or date.today(),
        notes=data.notes,
        split_method=data.split_method.upper(),
        receipt_url=data.receipt_url,
        receipt_data_json=data.receipt_data_json,
        payers_json=json.dumps(validated_payers) if len(validated_payers) > 1 else data.payers_json,
        version=1,
        is_deleted=False
    )
    db.add(expense)

    # Persist ExpenseShare records
    for share in calculated_shares:
        u_name = user_names.get(share["user_id"], "Traveller")
        db_share = ExpenseShare(
            id=generate_uuid(),
            expense_id=expense_id,
            user_id=share["user_id"],
            user_name=u_name,
            owed_amount=share["owed_amount"],
            percentage=share.get("percentage"),
            shares_count=share.get("shares_count"),
            item_details_json=share.get("item_details_json")
        )
        db.add(db_share)

    # Audit log creation
    new_snapshot = {
        "title": expense.title,
        "amount": expense.amount,
        "split_method": expense.split_method,
        "payers": validated_payers,
        "shares": calculated_shares
    }
    audit = ExpenseAuditLog(
        id=generate_uuid(),
        expense_id=expense_id,
        action="CREATED",
        actor_user_id=current_user.id,
        new_snapshot_json=json.dumps(new_snapshot),
        reason="Initial expense creation"
    )
    db.add(audit)

    db.commit()
    db.refresh(expense)

    return _format_expense_response(expense, db)


@router.get("/expenses/{expense_id}", response_model=CollaborativeExpenseResponse)
def get_expense_detail(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve expense details with shares and full audit trail."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    _verify_context_access(db, current_user, trip_id=expense.trip_id, circle_id=expense.circle_id, split_pod_id=expense.split_pod_id)
    return _format_expense_response(expense, db)


@router.put("/expenses/{expense_id}", response_model=CollaborativeExpenseResponse)
def update_collaborative_expense(
    expense_id: str,
    data: CollaborativeExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update collaborative expense with optimistic locking:
    - Validates expected version; throws 409 Conflict if concurrent modification detected.
    - Records old snapshot and new snapshot in ExpenseAuditLog.
    - Recomputes exact participant shares in paise.
    """
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    member_ids, user_names = _verify_context_access(
        db, current_user,
        trip_id=expense.trip_id,
        circle_id=expense.circle_id,
        split_pod_id=expense.split_pod_id
    )

    # Optimistic locking check
    if data.version and data.version != expense.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Concurrent modification conflict. Current expense version is {expense.version}, but client submitted version {data.version}."
        )

    # Save previous snapshot for audit trail
    prev_snapshot = {
        "title": expense.title,
        "amount": expense.amount,
        "split_method": expense.split_method,
        "payers_json": expense.payers_json,
        "version": expense.version,
        "shares": [{"user_id": s.user_id, "owed_amount": s.owed_amount} for s in expense.shares]
    }

    new_amount = data.amount if data.amount is not None else expense.amount
    new_payer_id = data.paid_by_user_id or expense.user_id
    new_split_method = (data.split_method or expense.split_method).upper()

    try:
        new_payers = validate_payers_allocation(new_amount, data.payers_json or expense.payers_json, new_payer_id)
    except FinanceCalculationException as e:
        raise HTTPException(status_code=400, detail=e.message)

    current_shares_users = [s.user_id for s in expense.shares] if expense.shares else member_ids
    participants = data.participant_user_ids if data.participant_user_ids is not None else current_shares_users

    try:
        new_shares = calculate_split_shares(
            total_amount=new_amount,
            split_method=new_split_method,
            participant_user_ids=participants,
            split_data=data.split_data
        )
    except FinanceCalculationException as e:
        raise HTTPException(status_code=400, detail=e.message)

    # Apply updates
    if data.title is not None:
        expense.title = data.title
    expense.amount = new_amount
    expense.user_id = new_payer_id
    expense.split_method = new_split_method
    if data.category is not None:
        expense.category = data.category
    if data.payment_method is not None:
        expense.payment_method = data.payment_method
    if data.date is not None:
        expense.date = data.date
    if data.notes is not None:
        expense.notes = data.notes
    if data.receipt_url is not None:
        expense.receipt_url = data.receipt_url
    if data.receipt_data_json is not None:
        expense.receipt_data_json = data.receipt_data_json

    expense.payers_json = json.dumps(new_payers) if len(new_payers) > 1 else data.payers_json
    expense.last_edited_by_user_id = current_user.id
    expense.version = (expense.version or 1) + 1

    # Replace shares
    db.query(ExpenseShare).filter(ExpenseShare.expense_id == expense.id).delete()
    for share in new_shares:
        u_name = user_names.get(share["user_id"], "Traveller")
        db_share = ExpenseShare(
            id=generate_uuid(),
            expense_id=expense.id,
            user_id=share["user_id"],
            user_name=u_name,
            owed_amount=share["owed_amount"],
            percentage=share.get("percentage"),
            shares_count=share.get("shares_count"),
            item_details_json=share.get("item_details_json")
        )
        db.add(db_share)

    # Record Audit Log
    new_snapshot = {
        "title": expense.title,
        "amount": expense.amount,
        "split_method": expense.split_method,
        "payers": new_payers,
        "shares": new_shares,
        "version": expense.version
    }
    audit = ExpenseAuditLog(
        id=generate_uuid(),
        expense_id=expense.id,
        action="UPDATED",
        actor_user_id=current_user.id,
        previous_snapshot_json=json.dumps(prev_snapshot),
        new_snapshot_json=json.dumps(new_snapshot),
        reason=data.change_reason or "Expense updated"
    )
    db.add(audit)

    db.commit()
    db.refresh(expense)

    return _format_expense_response(expense, db)


@router.delete("/expenses/{expense_id}")
def delete_collaborative_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete an expense with audit log entry and version increment."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    _verify_context_access(db, current_user, trip_id=expense.trip_id, circle_id=expense.circle_id, split_pod_id=expense.split_pod_id)

    prev_snapshot = {
        "title": expense.title,
        "amount": expense.amount,
        "version": expense.version
    }

    expense.is_deleted = True
    expense.version = (expense.version or 1) + 1
    expense.last_edited_by_user_id = current_user.id

    audit = ExpenseAuditLog(
        id=generate_uuid(),
        expense_id=expense.id,
        action="DELETED",
        actor_user_id=current_user.id,
        previous_snapshot_json=json.dumps(prev_snapshot),
        new_snapshot_json=json.dumps({"is_deleted": True, "version": expense.version}),
        reason="Expense soft deleted"
    )
    db.add(audit)

    db.commit()
    return {"status": "success", "message": "Expense soft deleted"}


@router.get("/expenses", response_model=List[CollaborativeExpenseResponse])
def list_collaborative_expenses(
    trip_id: Optional[str] = None,
    circle_id: Optional[str] = None,
    split_pod_id: Optional[str] = None,
    category: Optional[str] = None,
    include_deleted: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List expenses for a specific context (trip, circle, or split pod).
    Strict pod isolation: If querying circle_id, expenses assigned to a split_pod_id are excluded.
    """
    if not trip_id and not circle_id and not split_pod_id:
        raise HTTPException(status_code=400, detail="Must supply at least one of trip_id, circle_id, or split_pod_id")

    _verify_context_access(db, current_user, trip_id=trip_id, circle_id=circle_id, split_pod_id=split_pod_id)

    query = db.query(Expense)
    if not include_deleted:
        query = query.filter(Expense.is_deleted.is_(False))

    if split_pod_id:
        query = query.filter(Expense.split_pod_id == split_pod_id)
    elif circle_id:
        # Exclude pod expenses from main circle ledger
        query = query.filter(Expense.circle_id == circle_id, Expense.split_pod_id.is_(None))
    elif trip_id:
        query = query.filter(Expense.trip_id == trip_id, Expense.split_pod_id.is_(None))

    if category:
        query = query.filter(Expense.category == category)

    expenses = query.order_by(Expense.date.desc(), Expense.created_at.desc()).all()
    return [_format_expense_response(exp, db) for exp in expenses]


def _format_expense_response(expense: Expense, db: Session) -> CollaborativeExpenseResponse:
    payer = db.query(User).filter(User.id == expense.user_id).first()
    creator = db.query(User).filter(User.id == expense.created_by_user_id).first() if expense.created_by_user_id else None
    editor = db.query(User).filter(User.id == expense.last_edited_by_user_id).first() if expense.last_edited_by_user_id else None

    shares_data = []
    for s in expense.shares:
        shares_data.append({
            "id": s.id,
            "user_id": s.user_id,
            "user_name": s.user_name,
            "owed_amount": s.owed_amount,
            "percentage": s.percentage,
            "shares_count": s.shares_count
        })

    audit_logs_data = []
    for log in expense.audit_logs:
        actor = db.query(User).filter(User.id == log.actor_user_id).first() if log.actor_user_id else None
        audit_logs_data.append(ExpenseAuditLogResponse(
            id=log.id,
            expense_id=log.expense_id,
            action=log.action,
            actor_user_id=log.actor_user_id,
            actor_name=actor.full_name if actor else None,
            previous_snapshot_json=log.previous_snapshot_json,
            new_snapshot_json=log.new_snapshot_json,
            reason=log.reason,
            created_at=log.created_at
        ))

    return CollaborativeExpenseResponse(
        id=expense.id,
        trip_id=expense.trip_id,
        circle_id=expense.circle_id,
        split_pod_id=expense.split_pod_id,
        user_id=expense.user_id,
        payer_name=payer.full_name if payer else "Traveller",
        created_by_user_id=expense.created_by_user_id,
        created_by_name=creator.full_name if creator else None,
        last_edited_by_user_id=expense.last_edited_by_user_id,
        last_edited_by_name=editor.full_name if editor else None,
        title=expense.title,
        category=expense.category,
        amount=expense.amount,
        payment_method=expense.payment_method,
        date=expense.date,
        notes=expense.notes,
        split_method=expense.split_method,
        receipt_url=expense.receipt_url,
        receipt_data_json=expense.receipt_data_json,
        payers_json=expense.payers_json,
        version=expense.version or 1,
        is_deleted=expense.is_deleted or False,
        shares=shares_data,
        created_at=expense.created_at,
        audit_logs=audit_logs_data
    )


# ---------------------------------------------------------
# BALANCES & SETTLEMENTS ENGINE
# ---------------------------------------------------------

@router.get("/balances", response_model=ContextBalanceResponse)
def get_context_balances(
    trip_id: Optional[str] = None,
    circle_id: Optional[str] = None,
    split_pod_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate real-time net balances and simplified debt graph.
    Strict pod isolation:
    - If split_pod_id is queried, only that pod's members, expenses, and settlements are factored.
    - If circle_id is queried, pod expenses and settlements are completely excluded.
    """
    if not trip_id and not circle_id and not split_pod_id:
        raise HTTPException(status_code=400, detail="Must supply at least one of trip_id, circle_id, or split_pod_id")

    member_ids, user_names = _verify_context_access(
        db, current_user,
        trip_id=trip_id,
        circle_id=circle_id,
        split_pod_id=split_pod_id
    )

    # Fetch expenses for context
    exp_query = db.query(Expense).filter(Expense.is_deleted.is_(False))
    settle_query = db.query(SettlementPayment)

    if split_pod_id:
        exp_query = exp_query.filter(Expense.split_pod_id == split_pod_id)
        settle_query = settle_query.filter(SettlementPayment.split_pod_id == split_pod_id)
    elif circle_id:
        exp_query = exp_query.filter(Expense.circle_id == circle_id, Expense.split_pod_id.is_(None))
        settle_query = settle_query.filter(SettlementPayment.circle_id == circle_id, SettlementPayment.split_pod_id.is_(None))
    elif trip_id:
        exp_query = exp_query.filter(Expense.trip_id == trip_id, Expense.split_pod_id.is_(None))
        settle_query = settle_query.filter(SettlementPayment.trip_id == trip_id, SettlementPayment.split_pod_id.is_(None))

    expenses = exp_query.all()
    settlements = settle_query.all()

    balances_result = calculate_group_balances(
        member_user_ids=member_ids,
        expenses=expenses,
        settlements=settlements,
        user_names=user_names
    )

    return balances_result


@router.post("/settlements", response_model=SettlementPaymentResponse)
def record_settlement_payment(
    data: SettlementPaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record an authoritative debt settlement payment between two members.
    Affects net balances immediately.
    """
    member_ids, user_names = _verify_context_access(
        db, current_user,
        trip_id=data.trip_id,
        circle_id=data.circle_id,
        split_pod_id=data.split_pod_id
    )

    if data.payer_user_id not in member_ids or data.receiver_user_id not in member_ids:
        raise HTTPException(status_code=400, detail="Payer and receiver must both belong to this financial context")

    if data.payer_user_id == data.receiver_user_id:
        raise HTTPException(status_code=400, detail="Payer and receiver cannot be the same user")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Settlement amount must be positive")

    settlement = SettlementPayment(
        id=generate_uuid(),
        trip_id=data.trip_id,
        circle_id=data.circle_id,
        split_pod_id=data.split_pod_id,
        payer_user_id=data.payer_user_id,
        receiver_user_id=data.receiver_user_id,
        recorded_by_user_id=current_user.id,
        amount=round(data.amount, 2),
        payment_method=data.payment_method,
        notes=data.notes,
        settled_at=datetime.now(timezone.utc)
    )
    db.add(settlement)
    db.commit()
    db.refresh(settlement)

    payer = db.query(User).filter(User.id == settlement.payer_user_id).first()
    receiver = db.query(User).filter(User.id == settlement.receiver_user_id).first()

    return SettlementPaymentResponse(
        id=settlement.id,
        trip_id=settlement.trip_id,
        circle_id=settlement.circle_id,
        split_pod_id=settlement.split_pod_id,
        payer_user_id=settlement.payer_user_id,
        payer_name=payer.full_name if payer else "Traveller",
        receiver_user_id=settlement.receiver_user_id,
        receiver_name=receiver.full_name if receiver else "Traveller",
        amount=settlement.amount,
        payment_method=settlement.payment_method,
        notes=settlement.notes,
        settled_at=settlement.settled_at,
        created_at=settlement.created_at
    )


@router.get("/settlements", response_model=List[SettlementPaymentResponse])
def list_settlement_payments(
    trip_id: Optional[str] = None,
    circle_id: Optional[str] = None,
    split_pod_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List settlement history for a context."""
    if not trip_id and not circle_id and not split_pod_id:
        raise HTTPException(status_code=400, detail="Must supply at least one of trip_id, circle_id, or split_pod_id")

    _verify_context_access(db, current_user, trip_id=trip_id, circle_id=circle_id, split_pod_id=split_pod_id)

    query = db.query(SettlementPayment)
    if split_pod_id:
        query = query.filter(SettlementPayment.split_pod_id == split_pod_id)
    elif circle_id:
        query = query.filter(SettlementPayment.circle_id == circle_id, SettlementPayment.split_pod_id.is_(None))
    elif trip_id:
        query = query.filter(SettlementPayment.trip_id == trip_id, SettlementPayment.split_pod_id.is_(None))

    settlements = query.order_by(SettlementPayment.created_at.desc()).all()
    results = []
    for st in settlements:
        payer = db.query(User).filter(User.id == st.payer_user_id).first()
        receiver = db.query(User).filter(User.id == st.receiver_user_id).first()
        results.append(SettlementPaymentResponse(
            id=st.id,
            trip_id=st.trip_id,
            circle_id=st.circle_id,
            split_pod_id=st.split_pod_id,
            payer_user_id=st.payer_user_id,
            payer_name=payer.full_name if payer else "Traveller",
            receiver_user_id=st.receiver_user_id,
            receiver_name=receiver.full_name if receiver else "Traveller",
            amount=st.amount,
            payment_method=st.payment_method,
            notes=st.notes,
            settled_at=st.settled_at,
            created_at=st.created_at
        ))
    return results
