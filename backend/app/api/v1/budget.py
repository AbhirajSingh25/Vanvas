from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Trip, Expense, User
from app.schemas.schemas import (
    ExpenseCreateRequest, ExpenseResponse, BudgetSummaryResponse, BudgetBreakdownCategory
)
from app.api.deps import get_current_user

router = APIRouter()

STANDARD_CATEGORIES = [
    ("Transport", 0.25),
    ("Hotel", 0.30),
    ("Food", 0.20),
    ("Local transport", 0.05),
    ("Scooter/rental", 0.05),
    ("Activities", 0.10),
    ("Shopping", 0.03),
    ("Misc", 0.02)
]

@router.get("/{trip_id}/budget", response_model=BudgetSummaryResponse)
def get_trip_budget(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).order_by(Expense.date.desc(), Expense.created_at.desc()).all()
    
    total_spent = sum(e.amount for e in expenses)
    trip.budget_spent = total_spent
    db.commit()

    total_budget = trip.budget_total or 10000.0
    total_remaining = max(0.0, total_budget - total_spent)
    num_days = max(1, trip.num_days or 1)
    
    daily_budget = total_budget / num_days
    daily_spent = total_spent / num_days

    # Category breakdowns
    category_spent = {cat: 0.0 for cat, _ in STANDARD_CATEGORIES}
    for e in expenses:
        cat = e.category
        if cat in category_spent:
            category_spent[cat] += e.amount
        else:
            category_spent["Misc"] += e.amount

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

    recent_exp_responses = []
    for e in expenses:
        recent_exp_responses.append(ExpenseResponse(
            id=e.id,
            trip_id=e.trip_id,
            user_name=e.user.full_name if e.user else "Traveller",
            title=e.title,
            category=e.category,
            amount=e.amount,
            payment_method=e.payment_method,
            date=e.date,
            notes=e.notes,
            created_at=e.created_at
        ))

    return BudgetSummaryResponse(
        total_budget=total_budget,
        total_spent=total_spent,
        total_remaining=total_remaining,
        daily_average_budget=round(daily_budget, 2),
        daily_average_spent=round(daily_spent, 2),
        categories=breakdowns,
        recent_expenses=recent_exp_responses
    )

@router.post("/{trip_id}/expenses", response_model=ExpenseResponse)
def add_trip_expense(
    trip_id: str,
    expense_in: ExpenseCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    exp_date = expense_in.date or datetime.now(timezone.utc).date()

    expense = Expense(
        trip_id=trip.id,
        user_id=current_user.id,
        title=expense_in.title,
        category=expense_in.category,
        amount=expense_in.amount,
        payment_method=expense_in.payment_method,
        date=exp_date,
        notes=expense_in.notes
    )
    db.add(expense)
    
    trip.budget_spent += expense_in.amount
    db.commit()
    db.refresh(expense)

    return ExpenseResponse(
        id=expense.id,
        trip_id=expense.trip_id,
        user_name=current_user.full_name,
        title=expense.title,
        category=expense.category,
        amount=expense.amount,
        payment_method=expense.payment_method,
        date=expense.date,
        notes=expense.notes,
        created_at=expense.created_at
    )

@router.delete("/{trip_id}/expenses/{expense_id}")
def delete_trip_expense(
    trip_id: str,
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.trip_id == trip_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip:
        trip.budget_spent = max(0.0, trip.budget_spent - expense.amount)

    db.delete(expense)
    db.commit()
    return {"success": True, "message": "Expense deleted successfully"}
