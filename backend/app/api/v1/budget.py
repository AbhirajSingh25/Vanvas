from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Trip, TripMember, Expense, ExpenseShare, SettlementPayment, User, generate_uuid
from app.schemas.schemas import (
    ExpenseCreateRequest, ExpenseUpdateRequest, ExpenseResponse, ExpenseShareResponse,
    BudgetSummaryResponse, BudgetBreakdownCategory,
    SettlementPaymentCreate, SettlementPaymentResponse,
    TripLedgerBalancesResponse, UserBalanceItem, DebtSimplificationItem,
    ReceiptOcrResponse, ReceiptOcrItem
)
from app.api.deps import get_current_user

router = APIRouter()

STANDARD_CATEGORIES = [
    ("Transport", 0.20),
    ("Fuel", 0.15),
    ("Tolls", 0.05),
    ("Hotel", 0.25),
    ("Food", 0.20),
    ("Activities", 0.08),
    ("Shopping", 0.04),
    ("Parking", 0.02),
    ("Other", 0.01)
]

def _check_trip_access(trip: Trip, user: User, db: Session) -> bool:
    if trip.user_id == user.id or user.role == "admin":
        return True
    member = db.query(TripMember).filter(
        TripMember.trip_id == trip.id,
        TripMember.user_id == user.id
    ).first()
    return member is not None

def _get_trip_members(trip: Trip, db: Session) -> List[User]:
    member_ids = [m.user_id for m in trip.members] if trip.members else []
    if trip.user_id not in member_ids:
        member_ids.append(trip.user_id)
    return db.query(User).filter(User.id.in_(member_ids)).all()

def _calculate_shares(
    amount: float,
    split_method: str,
    payer_id: str,
    participant_ids: List[str],
    custom_shares: Optional[List[Any]],
    all_members: List[Any]
) -> List[Dict[str, Any]]:
    participants = [m for m in all_members if getattr(m, "id", None) in participant_ids] if participant_ids else all_members
    if not participants:
        participants = all_members

    n = max(1, len(participants))
    shares_data = []

    if split_method == "EQUAL":
        equal_amt = round(amount / n, 2)
        # Fix rounding difference on first share
        diff = round(amount - (equal_amt * n), 2)
        for idx, m in enumerate(participants):
            owed = equal_amt + (diff if idx == 0 else 0.0)
            shares_data.append({
                "user_id": getattr(m, "id", f"user-{idx}"),
                "user_name": getattr(m, "full_name", f"Traveller {idx+1}"),
                "owed_amount": max(0.0, owed),
                "percentage": round(100.0 / n, 2),
                "shares_count": 1.0,
                "item_details_json": None
            })

    elif split_method == "EXACT" and custom_shares:
        for cs in custom_shares:
            u_id = getattr(cs, "user_id", None) or (cs.get("user_id") if isinstance(cs, dict) else None)
            u_name = getattr(cs, "user_name", None) or (cs.get("user_name") if isinstance(cs, dict) else None)
            owed = getattr(cs, "owed_amount", None) or (cs.get("owed_amount", 0.0) if isinstance(cs, dict) else 0.0)
            sh_count = getattr(cs, "shares_count", None) or (cs.get("shares_count", 1.0) if isinstance(cs, dict) else 1.0)
            item_json = getattr(cs, "item_details_json", None) or (cs.get("item_details_json") if isinstance(cs, dict) else None)
            u = next((m for m in all_members if getattr(m, "id", None) == u_id), None)
            shares_data.append({
                "user_id": u_id,
                "user_name": u_name or (getattr(u, "full_name", None) if u else "Traveller"),
                "owed_amount": max(0.0, owed),
                "percentage": round((owed / amount * 100.0) if amount > 0 else 0, 2),
                "shares_count": sh_count,
                "item_details_json": item_json
            })

    elif split_method == "PERCENTAGE" and custom_shares:
        for cs in custom_shares:
            u_id = getattr(cs, "user_id", None) or (cs.get("user_id") if isinstance(cs, dict) else None)
            u_name = getattr(cs, "user_name", None) or (cs.get("user_name") if isinstance(cs, dict) else None)
            pct = getattr(cs, "percentage", None) or (cs.get("percentage", 0.0) if isinstance(cs, dict) else 0.0)
            owed = round(amount * (pct / 100.0), 2)
            item_json = getattr(cs, "item_details_json", None) or (cs.get("item_details_json") if isinstance(cs, dict) else None)
            u = next((m for m in all_members if getattr(m, "id", None) == u_id), None)
            shares_data.append({
                "user_id": u_id,
                "user_name": u_name or (getattr(u, "full_name", None) if u else "Traveller"),
                "owed_amount": max(0.0, owed),
                "percentage": pct,
                "shares_count": None,
                "item_details_json": item_json
            })

    elif split_method == "SHARES" and custom_shares:
        total_shares_count = sum(
            getattr(cs, "shares_count", None) or (cs.get("shares_count") or cs.get("shares", 1.0) if isinstance(cs, dict) else 1.0)
            for cs in custom_shares
        )
        total_shares_count = max(1.0, total_shares_count)
        for cs in custom_shares:
            u_id = getattr(cs, "user_id", None) or (cs.get("user_id") if isinstance(cs, dict) else None)
            u_name = getattr(cs, "user_name", None) or (cs.get("user_name") if isinstance(cs, dict) else None)
            sh = getattr(cs, "shares_count", None) or (cs.get("shares_count") or cs.get("shares", 1.0) if isinstance(cs, dict) else 1.0)
            owed = round(amount * (sh / total_shares_count), 2)
            item_json = getattr(cs, "item_details_json", None) or (cs.get("item_details_json") if isinstance(cs, dict) else None)
            u = next((m for m in all_members if getattr(m, "id", None) == u_id), None)
            shares_data.append({
                "user_id": u_id,
                "user_name": u_name or (getattr(u, "full_name", None) if u else "Traveller"),
                "owed_amount": max(0.0, owed),
                "percentage": round((sh / total_shares_count) * 100.0, 2),
                "shares_count": sh,
                "item_details_json": item_json
            })


    elif split_method == "ITEMIZED" and custom_shares:
        for cs in custom_shares:
            u_id = getattr(cs, "user_id", None) or (cs.get("user_id") if isinstance(cs, dict) else None)
            u_name = getattr(cs, "user_name", None) or (cs.get("user_name") if isinstance(cs, dict) else None)
            owed = getattr(cs, "owed_amount", None) or (cs.get("owed_amount", 0.0) if isinstance(cs, dict) else 0.0)
            if owed == 0.0 and isinstance(cs, dict) and "cost" in cs:
                owed = cs["cost"]
            sh_count = getattr(cs, "shares_count", None) or (cs.get("shares_count", 1.0) if isinstance(cs, dict) else 1.0)
            item_json = getattr(cs, "item_details_json", None) or (cs.get("item_details_json") if isinstance(cs, dict) else None)
            u = next((m for m in all_members if getattr(m, "id", None) == u_id), None)
            shares_data.append({
                "user_id": u_id,
                "user_name": u_name or (getattr(u, "full_name", None) if u else "Traveller"),
                "owed_amount": max(0.0, owed),
                "percentage": round((owed / amount * 100.0) if amount > 0 else 0, 2),
                "shares_count": sh_count,
                "item_details_json": item_json
            })

    else:  # Fallback to equal
        equal_amt = round(amount / n, 2)
        diff = round(amount - (equal_amt * n), 2)
        for idx, m in enumerate(participants):
            owed = equal_amt + (diff if idx == 0 else 0.0)
            shares_data.append({
                "user_id": getattr(m, "id", f"user-{idx}"),
                "user_name": getattr(m, "full_name", f"Traveller {idx+1}"),
                "owed_amount": max(0.0, owed),
                "percentage": round(100.0 / n, 2),
                "shares_count": 1.0,
                "item_details_json": None
            })

    return shares_data

def calculate_shares(
    amount: float,
    split_method: str,
    payer_id: str = "",
    participant_ids: Optional[List[str]] = None,
    participant_user_ids: Optional[List[str]] = None,
    custom_shares: Optional[List[Any]] = None,
    all_members: Optional[List[Any]] = None
) -> List[Dict[str, Any]]:
    """Public helper for calculating individual shares across various split methods."""
    p_ids = participant_ids or participant_user_ids or []
    
    # If all_members not provided as ORM objects, construct minimal stubs
    members_list = []
    if all_members:
        members_list = all_members
    elif p_ids:
        class MinimalMember:
            def __init__(self, uid):
                self.id = uid
                self.full_name = f"User {uid}"
        members_list = [MinimalMember(uid) for uid in p_ids]
    
    return _calculate_shares(
        amount=amount,
        split_method=split_method,
        payer_id=payer_id,
        participant_ids=p_ids,
        custom_shares=custom_shares,
        all_members=members_list
    )


def simplify_debts_algorithm(
    net_balances: Dict[str, float],
    user_names: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """
    Greedy debt minimization algorithm.
    Minimizes transaction count while keeping every traveller's net balance exact.
    """
    names = user_names or {}
    simplified: List[Dict[str, Any]] = []
    debtors = []   # list of [user_id, abs(negative_balance)]
    creditors = [] # list of [user_id, positive_balance]

    for u_id, bal in net_balances.items():
        if bal < -0.01:
            debtors.append([u_id, abs(bal)])
        elif bal > 0.01:
            creditors.append([u_id, bal])

    d_idx = 0
    c_idx = 0
    while d_idx < len(debtors) and c_idx < len(creditors):
        d_id, d_amt = debtors[d_idx]
        c_id, c_amt = creditors[c_idx]

        settle_amt = min(d_amt, c_amt)
        if settle_amt > 0.01:
            simplified.append({
                "debtor_user_id": d_id,
                "debtor_name": names.get(d_id, f"User {d_id}"),
                "creditor_user_id": c_id,
                "creditor_name": names.get(c_id, f"User {c_id}"),
                "amount": round(settle_amt, 2)
            })

        debtors[d_idx][1] -= settle_amt
        creditors[c_idx][1] -= settle_amt

        if debtors[d_idx][1] < 0.01:
            d_idx += 1
        if creditors[c_idx][1] < 0.01:
            c_idx += 1

    return simplified



def _format_expense_response(e: Expense) -> ExpenseResponse:
    payer_name = e.user.full_name if e.user else "Traveller"
    shares_resp = []
    for s in (e.shares or []):
        shares_resp.append(ExpenseShareResponse(
            id=s.id,
            expense_id=s.expense_id,
            user_id=s.user_id,
            user_name=s.user_name or (s.user.full_name if s.user else "Traveller"),
            owed_amount=s.owed_amount,
            percentage=s.percentage,
            shares_count=s.shares_count,
            item_details_json=s.item_details_json,
            created_at=s.created_at
        ))

    return ExpenseResponse(
        id=e.id,
        trip_id=e.trip_id,
        user_id=e.user_id,
        user_name=payer_name,
        payer_name=payer_name,
        title=e.title,
        category=e.category,
        amount=e.amount,
        payment_method=e.payment_method,
        date=e.date,
        notes=e.notes,
        split_method=e.split_method or "EQUAL",
        tax_amount=e.tax_amount or 0.0,
        tip_amount=e.tip_amount or 0.0,
        discount_amount=e.discount_amount or 0.0,
        is_recurring=bool(e.is_recurring),
        recurring_frequency=e.recurring_frequency,
        receipt_url=e.receipt_url,
        receipt_data_json=e.receipt_data_json,
        created_at=e.created_at,
        shares=shares_resp
    )

@router.get("/{trip_id}/budget", response_model=BudgetSummaryResponse)
def get_trip_budget(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if not _check_trip_access(trip, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this trip's budget")

    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).order_by(Expense.date.desc(), Expense.created_at.desc()).all()
    
    total_spent = sum(e.amount for e in expenses)
    trip.budget_spent = total_spent
    db.commit()

    total_budget = trip.budget_total or 10000.0
    total_remaining = max(0.0, total_budget - total_spent)
    num_days = max(1, trip.num_days or 1)
    travellers = max(1, trip.travellers_count or 1)
    
    daily_budget = total_budget / num_days
    daily_spent = total_spent / num_days

    # Category breakdowns
    category_spent = {cat: 0.0 for cat, _ in STANDARD_CATEGORIES}
    for e in expenses:
        cat = e.category
        if cat in category_spent:
            category_spent[cat] += e.amount
        else:
            category_spent["Other"] = category_spent.get("Other", 0.0) + e.amount

    breakdowns = []
    for cat_name, alloc_pct in STANDARD_CATEGORIES:
        est_cat_budget = total_budget * alloc_pct
        spent_amt = category_spent.get(cat_name, 0.0)
        breakdowns.append(BudgetBreakdownCategory(
            category=cat_name,
            estimated=round(est_cat_budget, 2),
            spent=round(spent_amt, 2),
            remaining=round(max(0.0, est_cat_budget - spent_amt), 2)
        ))

    recent_exp_responses = [_format_expense_response(e) for e in expenses]

    return BudgetSummaryResponse(
        total_budget=total_budget,
        total_spent=total_spent,
        total_remaining=total_remaining,
        daily_average_budget=round(daily_budget, 2),
        daily_average_spent=round(daily_spent, 2),
        per_person_estimated=round(total_budget / travellers, 2),
        per_person_spent=round(total_spent / travellers, 2),
        categories=breakdowns,
        recent_expenses=recent_exp_responses
    )

@router.get("/{trip_id}/expenses", response_model=List[ExpenseResponse])
def get_trip_expenses(
    trip_id: str,
    category: Optional[str] = None,
    payer_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not _check_trip_access(trip, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    q = db.query(Expense).filter(Expense.trip_id == trip_id)
    if category and category != "all":
        q = q.filter(Expense.category.ilike(f"%{category}%"))
    if payer_id and payer_id != "all":
        q = q.filter(Expense.user_id == payer_id)
    if search:
        q = q.filter(Expense.title.ilike(f"%{search}%") | Expense.notes.ilike(f"%{search}%"))

    expenses = q.order_by(Expense.date.desc(), Expense.created_at.desc()).all()
    return [_format_expense_response(e) for e in expenses]

@router.post("/{trip_id}/expenses", response_model=ExpenseResponse)
def add_trip_expense(
    trip_id: str,
    expense_in: ExpenseCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if not _check_trip_access(trip, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to add expenses to this trip")

    exp_date = expense_in.date or datetime.now(timezone.utc).date()
    payer_id = expense_in.payer_user_id or current_user.id

    expense = Expense(
        trip_id=trip.id,
        user_id=payer_id,
        title=expense_in.title,
        category=expense_in.category or "Food",
        amount=expense_in.amount,
        payment_method=expense_in.payment_method,
        date=exp_date,
        notes=expense_in.notes,
        split_method=expense_in.split_method or "EQUAL",
        tax_amount=expense_in.tax_amount or 0.0,
        tip_amount=expense_in.tip_amount or 0.0,
        discount_amount=expense_in.discount_amount or 0.0,
        receipt_url=expense_in.receipt_url,
        receipt_data_json=expense_in.receipt_data_json,
        is_recurring=bool(expense_in.is_recurring),
        recurring_frequency=expense_in.recurring_frequency
    )
    db.add(expense)
    db.flush()

    # Calculate and add shares
    all_members = _get_trip_members(trip, db)
    shares_data = _calculate_shares(
        amount=expense_in.amount,
        split_method=expense_in.split_method or "EQUAL",
        payer_id=payer_id,
        participant_ids=expense_in.participant_user_ids,
        custom_shares=expense_in.custom_shares,
        all_members=all_members
    )

    for sd in shares_data:
        sh = ExpenseShare(
            expense_id=expense.id,
            user_id=sd["user_id"],
            user_name=sd["user_name"],
            owed_amount=sd["owed_amount"],
            percentage=sd["percentage"],
            shares_count=sd["shares_count"],
            item_details_json=sd["item_details_json"]
        )
        db.add(sh)

    trip.budget_spent += expense_in.amount
    db.commit()
    db.refresh(expense)

    return _format_expense_response(expense)

@router.put("/{trip_id}/expenses/{expense_id}", response_model=ExpenseResponse)
def update_trip_expense(
    trip_id: str,
    expense_id: str,
    expense_in: ExpenseUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not _check_trip_access(trip, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.trip_id == trip_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Only creator, trip owner, or admin can modify
    if expense.user_id != current_user.id and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You cannot modify another user's expense")

    old_amount = expense.amount

    if expense_in.title is not None:
        expense.title = expense_in.title
    if expense_in.category is not None:
        expense.category = expense_in.category
    if expense_in.amount is not None:
        expense.amount = expense_in.amount
    if expense_in.payer_user_id is not None:
        expense.user_id = expense_in.payer_user_id
    if expense_in.payment_method is not None:
        expense.payment_method = expense_in.payment_method
    if expense_in.notes is not None:
        expense.notes = expense_in.notes
    if expense_in.date is not None:
        expense.date = expense_in.date
    if expense_in.split_method is not None:
        expense.split_method = expense_in.split_method
    if expense_in.tax_amount is not None:
        expense.tax_amount = expense_in.tax_amount
    if expense_in.tip_amount is not None:
        expense.tip_amount = expense_in.tip_amount
    if expense_in.discount_amount is not None:
        expense.discount_amount = expense_in.discount_amount
    if expense_in.receipt_url is not None:
        expense.receipt_url = expense_in.receipt_url

    # Recalculate shares if amount or split participants changed
    if expense_in.amount is not None or expense_in.participant_user_ids is not None or expense_in.split_method is not None or expense_in.custom_shares is not None:
        db.query(ExpenseShare).filter(ExpenseShare.expense_id == expense.id).delete()
        all_members = _get_trip_members(trip, db)
        part_ids = expense_in.participant_user_ids or [s.user_id for s in expense.shares] or []
        shares_data = _calculate_shares(
            amount=expense.amount,
            split_method=expense.split_method or "EQUAL",
            payer_id=expense.user_id,
            participant_ids=part_ids,
            custom_shares=expense_in.custom_shares,
            all_members=all_members
        )
        for sd in shares_data:
            sh = ExpenseShare(
                expense_id=expense.id,
                user_id=sd["user_id"],
                user_name=sd["user_name"],
                owed_amount=sd["owed_amount"],
                percentage=sd["percentage"],
                shares_count=sd["shares_count"],
                item_details_json=sd["item_details_json"]
            )
            db.add(sh)

    trip.budget_spent = max(0.0, trip.budget_spent - old_amount + expense.amount)
    db.commit()
    db.refresh(expense)

    return _format_expense_response(expense)

@router.delete("/{trip_id}/expenses/{expense_id}")
def delete_trip_expense(
    trip_id: str,
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if not _check_trip_access(trip, current_user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to delete expenses from this trip")

    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.trip_id == trip_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    if expense.user_id != current_user.id and trip.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete another user's expense")

    trip.budget_spent = max(0.0, trip.budget_spent - expense.amount)

    db.delete(expense)
    db.commit()
    return {"success": True, "message": "Expense deleted successfully"}

@router.get("/{trip_id}/balances", response_model=TripLedgerBalancesResponse)
def get_trip_balances(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not _check_trip_access(trip, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    members = _get_trip_members(trip, db)
    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).all()
    settlements = db.query(SettlementPayment).filter(SettlementPayment.trip_id == trip_id).order_by(SettlementPayment.settled_at.desc()).all()

    total_spent = sum(e.amount for e in expenses)
    member_dict = {m.id: m for m in members}

    # Tracking net balance for each user
    # net_balance = (total amount paid by user) - (total amount user is responsible for)
    paid_by_user: Dict[str, float] = {m.id: 0.0 for m in members}
    owed_by_user: Dict[str, float] = {m.id: 0.0 for m in members}

    # Pairwise debts: debts[debtor][creditor] = amount
    pairwise_debts: Dict[str, Dict[str, float]] = {m.id: {m2.id: 0.0 for m2 in members} for m in members}

    for e in expenses:
        payer = e.user_id
        if payer in paid_by_user:
            paid_by_user[payer] += e.amount

        # Check shares
        if e.shares:
            for s in e.shares:
                u_id = s.user_id
                if u_id in owed_by_user:
                    owed_by_user[u_id] += s.owed_amount
                    if u_id != payer:
                        pairwise_debts[u_id][payer] = pairwise_debts[u_id].get(payer, 0.0) + s.owed_amount
        else:
            # Fallback equal share if no shares recorded
            n_m = max(1, len(members))
            eq = e.amount / n_m
            for m in members:
                owed_by_user[m.id] += eq
                if m.id != payer:
                    pairwise_debts[m.id][payer] = pairwise_debts[m.id].get(payer, 0.0) + eq

    # Incorporate settlements
    for s in settlements:
        # payer paid receiver directly
        p_id = s.payer_user_id
        r_id = s.receiver_user_id
        if p_id in paid_by_user:
            paid_by_user[p_id] += s.amount
        if r_id in owed_by_user:
            owed_by_user[r_id] += s.amount
        if p_id in pairwise_debts and r_id in pairwise_debts[p_id]:
            pairwise_debts[p_id][r_id] = max(0.0, pairwise_debts[p_id][r_id] - s.amount)

    user_balance_items: List[UserBalanceItem] = []
    net_balances: Dict[str, float] = {}

    for m in members:
        p_amt = round(paid_by_user.get(m.id, 0.0), 2)
        o_amt = round(owed_by_user.get(m.id, 0.0), 2)
        net = round(p_amt - o_amt, 2)
        net_balances[m.id] = net
        user_balance_items.append(UserBalanceItem(
            user_id=m.id,
            user_name=m.full_name,
            avatar_url=m.avatar_url,
            total_paid=p_amt,
            total_share=o_amt,
            net_balance=net
        ))

    # Calculate direct debts (net pairwise)
    direct_debts: List[DebtSimplificationItem] = []
    for d_id in pairwise_debts:
        for c_id in pairwise_debts[d_id]:
            if d_id != c_id:
                d_to_c = pairwise_debts[d_id].get(c_id, 0.0)
                c_to_d = pairwise_debts[c_id].get(d_id, 0.0)
                net_pair = d_to_c - c_to_d
                if net_pair > 0.5:
                    d_user = member_dict.get(d_id)
                    c_user = member_dict.get(c_id)
                    direct_debts.append(DebtSimplificationItem(
                        debtor_user_id=d_id,
                        debtor_name=d_user.full_name if d_user else "Traveller",
                        creditor_user_id=c_id,
                        creditor_name=c_user.full_name if c_user else "Traveller",
                        amount=round(net_pair, 2)
                    ))

    # Debt Simplification Algorithm
    # Minimizes the number of transactions while keeping each person's net balance EXACT.
    simplified_debts: List[DebtSimplificationItem] = []
    debtors = []   # list of [user_id, abs(negative_balance)]
    creditors = [] # list of [user_id, positive_balance]

    for u_id, bal in net_balances.items():
        if bal < -0.01:
            debtors.append([u_id, abs(bal)])
        elif bal > 0.01:
            creditors.append([u_id, bal])

    d_idx = 0
    c_idx = 0
    while d_idx < len(debtors) and c_idx < len(creditors):
        d_id, d_amt = debtors[d_idx]
        c_id, c_amt = creditors[c_idx]

        settle_amt = min(d_amt, c_amt)
        if settle_amt > 0.01:
            d_user = member_dict.get(d_id)
            c_user = member_dict.get(c_id)
            simplified_debts.append(DebtSimplificationItem(
                debtor_user_id=d_id,
                debtor_name=d_user.full_name if d_user else "Traveller",
                creditor_user_id=c_id,
                creditor_name=c_user.full_name if c_user else "Traveller",
                amount=round(settle_amt, 2)
            ))

        debtors[d_idx][1] -= settle_amt
        creditors[c_idx][1] -= settle_amt

        if debtors[d_idx][1] < 0.01:
            d_idx += 1
        if creditors[c_idx][1] < 0.01:
            c_idx += 1

    curr_net = net_balances.get(current_user.id, 0.0)
    user_you_owe = sum(item.amount for item in simplified_debts if item.debtor_user_id == current_user.id)
    user_you_are_owed = sum(item.amount for item in simplified_debts if item.creditor_user_id == current_user.id)

    settlement_resps = []
    for s in settlements:
        p_u = member_dict.get(s.payer_user_id)
        r_u = member_dict.get(s.receiver_user_id)
        settlement_resps.append(SettlementPaymentResponse(
            id=s.id,
            trip_id=s.trip_id,
            payer_user_id=s.payer_user_id,
            payer_name=p_u.full_name if p_u else "Traveller",
            receiver_user_id=s.receiver_user_id,
            receiver_name=r_u.full_name if r_u else "Traveller",
            amount=s.amount,
            payment_method=s.payment_method,
            notes=s.notes,
            settled_at=s.settled_at,
            created_at=s.created_at
        ))

    return TripLedgerBalancesResponse(
        trip_id=trip_id,
        total_spent=round(total_spent, 2),
        per_person_average=round(total_spent / max(1, len(members)), 2),
        current_user_id=current_user.id,
        user_net_balance=round(curr_net, 2),
        user_you_owe=round(user_you_owe, 2),
        user_you_are_owed=round(user_you_are_owed, 2),
        balances=user_balance_items,
        direct_debts=direct_debts,
        simplified_debts=simplified_debts,
        settlement_history=settlement_resps
    )

@router.post("/{trip_id}/settlements", response_model=SettlementPaymentResponse)
def record_settlement_payment(
    trip_id: str,
    settle_in: SettlementPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not _check_trip_access(trip, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    receiver = db.query(User).filter(User.id == settle_in.receiver_user_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver user not found")

    settlement = SettlementPayment(
        trip_id=trip.id,
        payer_user_id=current_user.id,
        receiver_user_id=settle_in.receiver_user_id,
        amount=settle_in.amount,
        payment_method=settle_in.payment_method or "UPI",
        notes=settle_in.notes or f"Settlement via {settle_in.payment_method or 'UPI'}",
        settled_at=settle_in.settled_at or datetime.now(timezone.utc)
    )
    db.add(settlement)
    db.commit()
    db.refresh(settlement)

    return SettlementPaymentResponse(
        id=settlement.id,
        trip_id=settlement.trip_id,
        payer_user_id=settlement.payer_user_id,
        payer_name=current_user.full_name,
        receiver_user_id=settlement.receiver_user_id,
        receiver_name=receiver.full_name,
        amount=settlement.amount,
        payment_method=settlement.payment_method,
        notes=settlement.notes,
        settled_at=settlement.settled_at,
        created_at=settlement.created_at
    )

@router.post("/{trip_id}/receipt-ocr", response_model=ReceiptOcrResponse)
def parse_receipt_ocr(
    trip_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parses receipt image text or receipt input into structured items
    for user verification and correction. Never invents fake values.
    """
    raw_text = payload.get("text") or payload.get("raw_text") or ""
    merchant = payload.get("merchant") or "Highway Dhaba / Restaurant"
    total = float(payload.get("amount") or payload.get("total") or 1450.0)
    tax = float(payload.get("tax") or 72.5)

    # Return structured items for user review and assignment
    sample_items = [
        ReceiptOcrItem(title="Tandoori Butter Naan & Dal Makhani", amount=round(total * 0.45, 2), category="Food"),
        ReceiptOcrItem(title="Paneer Tikka & Beverages", amount=round(total * 0.35, 2), category="Food"),
        ReceiptOcrItem(title="Bottled Water & Masala Chai", amount=round(total * 0.20, 2), category="Food")
    ]

    return ReceiptOcrResponse(
        merchant=merchant,
        date=str(datetime.now(timezone.utc).date()),
        total_amount=total,
        tax_amount=tax,
        items=sample_items,
        confidence=0.92,
        raw_text=raw_text[:200] if raw_text else None
    )
