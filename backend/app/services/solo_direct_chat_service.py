import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.models.models import User, SoloMatch, SoloDirectMessage, UserNotification, TravelerBlock
from app.schemas.schemas import SoloDirectMessageResponse
from app.services.solo_matching_service import SoloMatchingService

logger = logging.getLogger("vanvas.solo_chat")


class SoloDirectChatService:
    @staticmethod
    def get_accepted_match(db: Session, user_a_id: str, user_b_id: str) -> Optional[SoloMatch]:
        """Verifies that user_a and user_b have an active ACCEPTED match."""
        return db.query(SoloMatch).filter(
            SoloMatch.status == "ACCEPTED",
            or_(
                and_(SoloMatch.sender_user_id == user_a_id, SoloMatch.receiver_user_id == user_b_id),
                and_(SoloMatch.sender_user_id == user_b_id, SoloMatch.receiver_user_id == user_a_id)
            )
        ).first()

    @classmethod
    def get_messages(
        cls,
        db: Session,
        current_user_id: str,
        partner_user_or_match_id: str,
        limit: int = 100
    ) -> List[SoloDirectMessageResponse]:
        """
        Retrieves direct chat history between two connected travelers.
        partner_user_or_match_id can be the partner's user_id OR the match_id.
        """
        # Determine match
        match = db.query(SoloMatch).filter(SoloMatch.id == partner_user_or_match_id).first()
        if match:
            if current_user_id not in [match.sender_user_id, match.receiver_user_id]:
                raise HTTPException(status_code=403, detail="Not authorized to view messages in this connection.")
            partner_id = match.receiver_user_id if match.sender_user_id == current_user_id else match.sender_user_id
        else:
            partner_id = partner_user_or_match_id
            match = cls.get_accepted_match(db, current_user_id, partner_id)

        if not match or match.status != "ACCEPTED":
            # If not connected yet, return empty list rather than hard error to allow clean UI state
            return []

        # Check blocking
        blocked_ids = SoloMatchingService.get_blocked_user_ids(db, current_user_id)
        if partner_id in blocked_ids:
            raise HTTPException(status_code=403, detail="Unable to message this traveler.")

        # Mark unread messages received by current_user as read
        db.query(SoloDirectMessage).filter(
            SoloDirectMessage.match_id == match.id,
            SoloDirectMessage.receiver_user_id == current_user_id,
            SoloDirectMessage.is_read == False
        ).update({"is_read": True})
        db.commit()

        messages = db.query(SoloDirectMessage).filter(
            SoloDirectMessage.match_id == match.id
        ).order_by(SoloDirectMessage.created_at.asc()).limit(limit).all()

        results = []
        for m in messages:
            sender_u = m.sender
            results.append(SoloDirectMessageResponse(
                id=m.id,
                match_id=m.match_id,
                sender_user_id=m.sender_user_id,
                receiver_user_id=m.receiver_user_id,
                sender_name=sender_u.full_name if sender_u else "Traveler",
                sender_avatar_url=sender_u.avatar_url if sender_u else None,
                content=m.content,
                is_read=m.is_read,
                created_at=m.created_at
            ))
        return results

    @classmethod
    def send_message(
        cls,
        db: Session,
        current_user: User,
        partner_user_or_match_id: str,
        content: str
    ) -> SoloDirectMessageResponse:
        """Sends a private message to a connected traveler."""
        clean_content = (content or "").strip()
        if not clean_content:
            raise HTTPException(status_code=400, detail="Message content cannot be empty.")

        # Determine match
        match = db.query(SoloMatch).filter(SoloMatch.id == partner_user_or_match_id).first()
        if match:
            if current_user.id not in [match.sender_user_id, match.receiver_user_id]:
                raise HTTPException(status_code=403, detail="Not authorized to send messages in this connection.")
            partner_id = match.receiver_user_id if match.sender_user_id == current_user.id else match.sender_user_id
        else:
            partner_id = partner_user_or_match_id
            match = cls.get_accepted_match(db, current_user.id, partner_id)

        if not match:
            raise HTTPException(status_code=403, detail="You must be connected with this traveler to send private messages.")

        if match.status != "ACCEPTED":
            raise HTTPException(status_code=403, detail="Connection request must be accepted before sending messages.")

        # Check blocking
        blocked_ids = SoloMatchingService.get_blocked_user_ids(db, current_user.id)
        if partner_id in blocked_ids:
            raise HTTPException(status_code=403, detail="Unable to message this traveler.")

        new_msg = SoloDirectMessage(
            match_id=match.id,
            sender_user_id=current_user.id,
            receiver_user_id=partner_id,
            content=clean_content,
            is_read=False
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)

        # Notify receiver
        SoloMatchingService.create_notification(
            db,
            partner_id,
            f"New Message from {current_user.full_name}",
            clean_content[:120] + ("..." if len(clean_content) > 120 else ""),
            "private_message",
            entity_id=match.id
        )

        return SoloDirectMessageResponse(
            id=new_msg.id,
            match_id=new_msg.match_id,
            sender_user_id=new_msg.sender_user_id,
            receiver_user_id=new_msg.receiver_user_id,
            sender_name=current_user.full_name,
            sender_avatar_url=current_user.avatar_url,
            content=new_msg.content,
            is_read=new_msg.is_read,
            created_at=new_msg.created_at
        )
