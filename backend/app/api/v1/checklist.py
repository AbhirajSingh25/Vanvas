from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Trip, ChecklistItem, User
from app.schemas.schemas import (
    ChecklistItemResponse, ChecklistItemCreateRequest, ChecklistItemToggleRequest
)
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/{trip_id}/checklist", response_model=List[ChecklistItemResponse])
def get_trip_checklist(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    items = db.query(ChecklistItem).filter(ChecklistItem.trip_id == trip_id).order_by(ChecklistItem.category.asc()).all()
    return items

@router.post("/{trip_id}/checklist", response_model=ChecklistItemResponse)
def add_checklist_item(
    trip_id: str,
    item_in: ChecklistItemCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    new_item = ChecklistItem(
        trip_id=trip_id,
        category=item_in.category,
        item_name=item_in.item_name,
        is_checked=False,
        is_custom=True
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/{trip_id}/checklist/{item_id}", response_model=ChecklistItemResponse)
def toggle_checklist_item(
    trip_id: str,
    item_id: str,
    toggle_in: ChecklistItemToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.trip_id == trip_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    item.is_checked = toggle_in.is_checked
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{trip_id}/checklist/{item_id}")
def delete_checklist_item(
    trip_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.trip_id == trip_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    db.delete(item)
    db.commit()
    return {"success": True, "message": "Checklist item removed"}
