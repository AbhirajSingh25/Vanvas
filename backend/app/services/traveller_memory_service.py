"""
VANVAS Traveller Memory & Personalization Engine (Phase 5)
Core domain service for persistent, production-oriented travel preference learning,
provenance tracking, conflict resolution, sensitive attribute protection,
and evidence-backed personalization.

Non-negotiable principle: VANVAS remembers how someone likes to travel,
not construct an invasive psychological profile of who they are.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple, Union

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.models import (
    User, UserPreference, Trip, TravellerMemory, MemoryObservation, Place, Hotel, RentalOption
)

logger = logging.getLogger("vanvas.services.traveller_memory")

# ---------------------------------------------------------------------------
# CONSTANTS & EVIDENCE THRESHOLDS
# ---------------------------------------------------------------------------

EVIDENCE_THRESHOLD_FOR_INFERENCE = 2  # Min consistent choices across events/trips to create tentative inference
INFERENCE_BASE_CONFIDENCE = 0.65      # Initial tentative confidence
INFERENCE_CONFIDENCE_INCREMENT = 0.10 # Incremental confidence boost per additional consistent observation
MAX_INFERRED_CONFIDENCE = 0.90        # Inferred preferences cap below 1.0 (1.0 is reserved for EXPLICIT / CONFIRMED)
MEMORY_EXPIRY_DAYS = 180              # Inferred memories decay/expire if unconfirmed / not reinforced

VALID_CATEGORIES = {
    "planning_style",
    "timing",
    "activities",
    "accommodation",
    "transport",
    "budget_pace",
    "practical",
}

# Sensitive words and attributes that must NEVER be stored or inferred
SENSITIVE_TRAIT_PATTERNS = [
    "religion", "religious", "hindu", "muslim", "christian", "sikh", "jain", "buddhist", "jewish", "caste",
    "politics", "political", "bjp", "congress", "democrat", "republican", "leftist", "rightwing",
    "race", "ethnicity", "sexual", "sexuality", "gay", "lesbian", "transgender", "queer", "orientation",
    "health", "medical", "disease", "illness", "mental_health", "psychology", "disability", "pregnant"
]


class TravellerMemoryService:
    """
    Authoritative domain service for traveller memory lifecycle and personalization.
    """

    @classmethod
    def is_sensitive_trait(cls, text: str) -> bool:
        """
        Validates whether text or preference keys contain prohibited sensitive traits.
        """
        if not text:
            return False
        clean = text.lower().replace("-", " ").replace("_", " ")
        tokens = set(clean.split())
        for pattern in SENSITIVE_TRAIT_PATTERNS:
            if pattern in tokens or pattern in clean:
                return True
        return False

    @classmethod
    def get_user_learning_state(cls, db: Session, user_id: str) -> Tuple[bool, bool]:
        """
        Returns (memory_learning_enabled, memory_learning_paused).
        """
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            return True, False
        return (
            getattr(pref, "memory_learning_enabled", True) is not False,
            getattr(pref, "memory_learning_paused", False) is True
        )

    # -----------------------------------------------------------------------
    # 1. OBSERVATIONS & EVIDENCE ACCUMULATION
    # -----------------------------------------------------------------------

    @classmethod
    def record_observation(
        cls,
        db: Session,
        user_id: str,
        event_type: str,
        category: str,
        observed_key: str,
        observed_value: str,
        trip_id: Optional[str] = None,
        source_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Optional[MemoryObservation]:
        """
        Records a validated travel observation event with idempotency protection.
        Automatically evaluates evidence thresholds to promote or update tentative inferences.
        """
        # Guard: Check sensitive traits
        if cls.is_sensitive_trait(category) or cls.is_sensitive_trait(observed_key) or cls.is_sensitive_trait(observed_value):
            logger.warning(f"Rejected observation with sensitive traits for user={user_id}")
            return None

        # Guard: Check user learning toggle
        learning_enabled, learning_paused = cls.get_user_learning_state(db, user_id)
        if not learning_enabled or learning_paused:
            logger.debug(f"Learning disabled or paused for user={user_id}. Observation skipped.")
            return None

        # Build deterministic idempotency key if not passed
        if not idempotency_key:
            raw_idempotency = f"{user_id}:{event_type}:{category}:{observed_key}:{observed_value}:{trip_id or ''}:{source_id or ''}"
            idempotency_key = hashlib.sha256(raw_idempotency.encode("utf-8")).hexdigest()[:32]

        # Check existing observation
        existing_obs = db.query(MemoryObservation).filter(
            MemoryObservation.idempotency_key == idempotency_key
        ).first()
        if existing_obs:
            return existing_obs

        # Persist observation
        metadata_json = json.dumps(metadata) if metadata else None
        observation = MemoryObservation(
            user_id=user_id,
            trip_id=trip_id,
            event_type=event_type,
            category=category.lower().strip(),
            observed_key=observed_key.lower().strip(),
            observed_value=observed_value.strip(),
            idempotency_key=idempotency_key,
            source_id=source_id,
            metadata_json=metadata_json,
            created_at=datetime.now(timezone.utc)
        )
        db.add(observation)
        db.commit()
        db.refresh(observation)

        # Trigger deterministic evaluation for tentative inference
        cls.evaluate_inferred_preference(
            db=db,
            user_id=user_id,
            category=category.lower().strip(),
            preference_key=observed_key.lower().strip(),
            observed_value=observed_value.strip(),
            trip_id=trip_id
        )

        return observation

    @classmethod
    def evaluate_inferred_preference(
        cls,
        db: Session,
        user_id: str,
        category: str,
        preference_key: str,
        observed_value: str,
        trip_id: Optional[str] = None,
    ) -> Optional[TravellerMemory]:
        """
        Deterministic evidence evaluation:
        - Counts consistent observations for this (user_id, category, preference_key, observed_value).
        - Compares against contradictory choices for the same key.
        - If evidence threshold is met and no active explicit preference overrides it,
          creates or updates an INFERRED memory.
        """
        # Count matching consistent observations
        consistent_count = db.query(func.count(MemoryObservation.id)).filter(
            MemoryObservation.user_id == user_id,
            MemoryObservation.category == category,
            MemoryObservation.observed_key == preference_key,
            MemoryObservation.observed_value == observed_value
        ).scalar() or 0

        # Count contradictory observations for the same key
        contradictory_count = db.query(func.count(MemoryObservation.id)).filter(
            MemoryObservation.user_id == user_id,
            MemoryObservation.category == category,
            MemoryObservation.observed_key == preference_key,
            MemoryObservation.observed_value != observed_value
        ).scalar() or 0

        # Do not create inference if single observation or contradictory choices dominate
        if consistent_count < EVIDENCE_THRESHOLD_FOR_INFERENCE:
            return None

        if contradictory_count > consistent_count:
            # Contradictory behavior dominates, do not infer this preference
            return None

        # Check if an authoritative EXPLICIT or CONFIRMED preference already exists for this key
        existing_explicit = db.query(TravellerMemory).filter(
            TravellerMemory.user_id == user_id,
            TravellerMemory.category == category,
            TravellerMemory.preference_key == preference_key,
            TravellerMemory.status == "ACTIVE",
            TravellerMemory.memory_type.in_(["EXPLICIT", "TRIP_SPECIFIC"])
        ).first()
        if existing_explicit:
            # Explicit user preference remains authoritative
            return existing_explicit

        # Check if an active INFERRED memory already exists for this key
        existing_inferred = db.query(TravellerMemory).filter(
            TravellerMemory.user_id == user_id,
            TravellerMemory.category == category,
            TravellerMemory.preference_key == preference_key,
            TravellerMemory.status == "ACTIVE"
        ).first()

        calculated_confidence = min(
            MAX_INFERRED_CONFIDENCE,
            INFERENCE_BASE_CONFIDENCE + (consistent_count - EVIDENCE_THRESHOLD_FOR_INFERENCE) * INFERENCE_CONFIDENCE_INCREMENT
        )

        now = datetime.now(timezone.utc)
        provenance = (
            f"Observed {consistent_count} times across travel choices "
            f"(e.g. {observed_value.replace('_', ' ').title()})."
        )

        if existing_inferred:
            if existing_inferred.preference_value == observed_value:
                # Reinforce existing inference
                existing_inferred.confidence = calculated_confidence
                existing_inferred.evidence_count = consistent_count
                existing_inferred.last_observed_at = now
                existing_inferred.provenance_summary = provenance
                existing_inferred.updated_at = now
                db.commit()
                db.refresh(existing_inferred)
                return existing_inferred
            else:
                # Value changed due to new stronger evidence
                if consistent_count > (existing_inferred.evidence_count or 1):
                    existing_inferred.status = "SUPERSEDED"
                    db.commit()

        # Create new INFERRED memory
        new_memory = TravellerMemory(
            user_id=user_id,
            trip_id=None,  # Inferred global preference
            category=category,
            preference_key=preference_key,
            preference_value=observed_value,
            memory_type="INFERRED",
            source_event="REPEATED_OBSERVATIONS",
            source_reference=f"obs_count={consistent_count}",
            confidence=calculated_confidence,
            evidence_count=consistent_count,
            first_observed_at=now,
            last_observed_at=now,
            expires_at=now + timedelta(days=MEMORY_EXPIRY_DAYS),
            confirmation_status="UNCONFIRMED",
            status="ACTIVE",
            provenance_summary=provenance,
            created_at=now,
            updated_at=now
        )
        db.add(new_memory)
        db.commit()
        db.refresh(new_memory)
        return new_memory

    # -----------------------------------------------------------------------
    # 2. EXPLICIT PREFERENCE CREATION & SYNC
    # -----------------------------------------------------------------------

    @classmethod
    def create_or_update_explicit_preference(
        cls,
        db: Session,
        user_id: str,
        category: str,
        preference_key: str,
        preference_value: str,
        trip_id: Optional[str] = None,
        is_trip_specific: bool = False,
        source_event: str = "USER_EXPLICIT_SETTING",
        source_reference: Optional[str] = None,
    ) -> TravellerMemory:
        """
        Creates or updates an explicit preference directly provided or confirmed by user.
        Overrides conflicting inferred memories.
        """
        if cls.is_sensitive_trait(category) or cls.is_sensitive_trait(preference_key) or cls.is_sensitive_trait(preference_value):
            raise ValueError("Preference contains prohibited sensitive traits.")

        clean_cat = category.lower().strip()
        clean_key = preference_key.lower().strip()
        clean_val = preference_value.strip()

        now = datetime.now(timezone.utc)
        mem_type = "TRIP_SPECIFIC" if (is_trip_specific and trip_id) else "EXPLICIT"
        provenance = (
            f"Temporary preference configured for current trip."
            if mem_type == "TRIP_SPECIFIC"
            else f"Explicitly configured by traveller in settings or chat."
        )

        # Mark any previous active conflicting memory for the same key as superseded
        prior_memories = db.query(TravellerMemory).filter(
            TravellerMemory.user_id == user_id,
            TravellerMemory.category == clean_cat,
            TravellerMemory.preference_key == clean_key,
            TravellerMemory.status == "ACTIVE",
            TravellerMemory.trip_id == (trip_id if mem_type == "TRIP_SPECIFIC" else None)
        ).all()
        for m in prior_memories:
            m.status = "SUPERSEDED"
            m.updated_at = now

        # Create new explicit memory
        memory = TravellerMemory(
            user_id=user_id,
            trip_id=trip_id if mem_type == "TRIP_SPECIFIC" else None,
            category=clean_cat,
            preference_key=clean_key,
            preference_value=clean_val,
            memory_type=mem_type,
            source_event=source_event,
            source_reference=source_reference,
            confidence=1.0,
            evidence_count=1,
            first_observed_at=now,
            last_observed_at=now,
            last_confirmed_at=now,
            expires_at=None,
            confirmation_status="CONFIRMED",
            status="ACTIVE",
            provenance_summary=provenance,
            created_at=now,
            updated_at=now
        )
        db.add(memory)

        # Synchronize with UserPreference table if mapping exists (for database coherence)
        if mem_type == "EXPLICIT":
            cls._sync_to_user_preferences(db, user_id, clean_key, clean_val)

        db.commit()
        db.refresh(memory)
        return memory

    @classmethod
    def _sync_to_user_preferences(cls, db: Session, user_id: str, key: str, value: str):
        """
        Synchronizes explicit key/values with core UserPreference columns where applicable.
        """
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            return

        key_mapping = {
            "travel_style": "preferred_travel_style",
            "preferred_travel_style": "preferred_travel_style",
            "pace": "activity_intensity",
            "activity_intensity": "activity_intensity",
            "wake_up_preference": "wake_up_preference",
            "start_time": "wake_up_preference",
            "dietary_preference": "dietary_preference",
            "dietary": "dietary_preference",
            "accommodation_preference": "accommodation_preference",
            "stay_category": "accommodation_preference",
            "transport_preference": "transport_preference",
            "transport_mode": "transport_preference",
            "companion_style": "companion_style",
        }

        col = key_mapping.get(key)
        if col and hasattr(pref, col):
            setattr(pref, col, value)
            pref.updated_at = datetime.now(timezone.utc)

    # -----------------------------------------------------------------------
    # 3. CONFIRMATION, CORRECTION & DELETION CONTROLS
    # -----------------------------------------------------------------------

    @classmethod
    def confirm_preference(cls, db: Session, user_id: str, memory_id: str) -> Optional[TravellerMemory]:
        """
        Promotes an INFERRED memory to CONFIRMED and EXPLICIT with 1.0 confidence.
        """
        memory = db.query(TravellerMemory).filter(
            TravellerMemory.id == memory_id,
            TravellerMemory.user_id == user_id,
            TravellerMemory.status == "ACTIVE"
        ).first()
        if not memory:
            return None

        now = datetime.now(timezone.utc)
        memory.memory_type = "EXPLICIT"
        memory.confirmation_status = "CONFIRMED"
        memory.confidence = 1.0
        memory.last_confirmed_at = now
        memory.provenance_summary = f"Inferred preference confirmed by traveller."
        memory.updated_at = now

        cls._sync_to_user_preferences(db, user_id, memory.preference_key, memory.preference_value)

        db.commit()
        db.refresh(memory)
        return memory

    @classmethod
    def reject_preference(cls, db: Session, user_id: str, memory_id: str) -> Optional[TravellerMemory]:
        """
        Rejects an inferred memory and marks it DELETED/REJECTED.
        """
        memory = db.query(TravellerMemory).filter(
            TravellerMemory.id == memory_id,
            TravellerMemory.user_id == user_id,
            TravellerMemory.status == "ACTIVE"
        ).first()
        if not memory:
            return None

        now = datetime.now(timezone.utc)
        memory.confirmation_status = "REJECTED"
        memory.status = "DELETED"
        memory.updated_at = now

        db.commit()
        db.refresh(memory)
        return memory

    @classmethod
    def edit_preference(cls, db: Session, user_id: str, memory_id: str, new_value: str) -> Optional[TravellerMemory]:
        """
        User corrects a preference. Updates value, sets type EXPLICIT, confidence 1.0, status CORRECTED.
        """
        if cls.is_sensitive_trait(new_value):
            raise ValueError("Value contains prohibited sensitive traits.")

        memory = db.query(TravellerMemory).filter(
            TravellerMemory.id == memory_id,
            TravellerMemory.user_id == user_id
        ).first()
        if not memory:
            return None

        now = datetime.now(timezone.utc)
        memory.preference_value = new_value.strip()
        memory.memory_type = "EXPLICIT"
        memory.confirmation_status = "CORRECTED"
        memory.confidence = 1.0
        memory.status = "ACTIVE"
        memory.last_confirmed_at = now
        memory.provenance_summary = f"Corrected by traveller."
        memory.updated_at = now

        cls._sync_to_user_preferences(db, user_id, memory.preference_key, new_value.strip())

        db.commit()
        db.refresh(memory)
        return memory

    @classmethod
    def delete_preference(cls, db: Session, user_id: str, memory_id: str) -> bool:
        """
        Deletes or tombstones a memory record immediately.
        """
        memory = db.query(TravellerMemory).filter(
            TravellerMemory.id == memory_id,
            TravellerMemory.user_id == user_id
        ).first()
        if not memory:
            return False

        memory.status = "DELETED"
        memory.updated_at = datetime.now(timezone.utc)
        db.commit()
        return True

    @classmethod
    def delete_matching_preference(
        cls, db: Session, user_id: str, search_query: str
    ) -> List[str]:
        """
        Finds and deletes preferences matching conversational search (e.g. "hostels", "early starts").
        Returns list of deleted preference summaries.
        """
        q = search_query.lower().strip()
        active_memories = db.query(TravellerMemory).filter(
            TravellerMemory.user_id == user_id,
            TravellerMemory.status == "ACTIVE"
        ).all()

        deleted_items = []
        now = datetime.now(timezone.utc)

        for m in active_memories:
            if (
                q in m.preference_key.lower()
                or q in m.preference_value.lower()
                or m.preference_key.lower() in q
                or m.preference_value.lower() in q
            ):
                m.status = "DELETED"
                m.updated_at = now
                deleted_items.append(f"{m.preference_key}: {m.preference_value}")

        if deleted_items:
            db.commit()

        return deleted_items

    @classmethod
    def clear_user_memories(cls, db: Session, user_id: str) -> int:
        """
        Clears all active travel memories and observations for user.
        """
        now = datetime.now(timezone.utc)
        count = db.query(TravellerMemory).filter(
            TravellerMemory.user_id == user_id,
            TravellerMemory.status == "ACTIVE"
        ).update({"status": "DELETED", "updated_at": now})

        db.query(MemoryObservation).filter(
            MemoryObservation.user_id == user_id
        ).delete()

        db.commit()
        return count

    @classmethod
    def reset_inferred_preferences(cls, db: Session, user_id: str) -> int:
        """
        Resets only INFERRED preferences without touching explicit user settings.
        """
        now = datetime.now(timezone.utc)
        count = db.query(TravellerMemory).filter(
            TravellerMemory.user_id == user_id,
            TravellerMemory.memory_type == "INFERRED",
            TravellerMemory.status == "ACTIVE"
        ).update({"status": "DELETED", "updated_at": now})

        db.commit()
        return count

    @classmethod
    def update_learning_settings(
        cls,
        db: Session,
        user_id: str,
        enabled: Optional[bool] = None,
        paused: Optional[bool] = None
    ) -> Tuple[bool, bool]:
        """
        Updates memory learning settings for the user.
        """
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if not pref:
            pref = UserPreference(user_id=user_id)
            db.add(pref)

        if enabled is not None:
            pref.memory_learning_enabled = enabled
        if paused is not None:
            pref.memory_learning_paused = paused

        pref.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(pref)

        return (
            getattr(pref, "memory_learning_enabled", True) is not False,
            getattr(pref, "memory_learning_paused", False) is True
        )

    # -----------------------------------------------------------------------
    # 4. CONFLICT RESOLUTION & CONTEXT RETRIEVAL
    # -----------------------------------------------------------------------

    @classmethod
    def get_active_memories(
        cls,
        db: Session,
        user_id: str,
        trip_id: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[TravellerMemory]:
        """
        Retrieves active memories with deterministic conflict resolution precedence:
        1. Current explicit trip instruction / constraint (`TRIP_SPECIFIC` for this trip_id)
        2. Current explicit user preference (`EXPLICIT`)
        3. Confirmed persistent preference (`CONFIRMED`)
        4. Reliable Inferred preference (`INFERRED` with confidence >= 0.6)
        """
        query = db.query(TravellerMemory).filter(
            TravellerMemory.user_id == user_id,
            TravellerMemory.status == "ACTIVE"
        )
        if category:
            query = query.filter(TravellerMemory.category == category.lower().strip())

        all_active = query.order_by(TravellerMemory.updated_at.desc()).all()

        # Group by preference_key and resolve precedence
        resolved_by_key: Dict[str, TravellerMemory] = {}

        for mem in all_active:
            key = mem.preference_key.lower().strip()

            # If trip_id matches trip-specific memory, highest priority
            if mem.memory_type == "TRIP_SPECIFIC":
                if trip_id and mem.trip_id == trip_id:
                    resolved_by_key[key] = mem
                continue

            # If already resolved by a higher-priority memory, skip
            if key in resolved_by_key:
                existing = resolved_by_key[key]
                if existing.memory_type == "TRIP_SPECIFIC":
                    continue
                if existing.memory_type == "EXPLICIT":
                    continue
                if existing.confidence >= mem.confidence:
                    continue

            # Check expiration for inferred memories
            if mem.memory_type == "INFERRED" and mem.expires_at:
                exp = mem.expires_at if mem.expires_at.tzinfo else mem.expires_at.replace(tzinfo=timezone.utc)
                if exp < datetime.now(timezone.utc):
                    continue

            resolved_by_key[key] = mem

        return list(resolved_by_key.values())

    @classmethod
    def build_personalization_context(
        cls,
        db: Session,
        user_id: str,
        trip_id: Optional[str] = None,
        destination_slug: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Builds a compact, sanitized personalization context for Copilot and planning.
        """
        learning_enabled, learning_paused = cls.get_user_learning_state(db, user_id)
        active_memories = cls.get_active_memories(db, user_id, trip_id)

        pref_map: Dict[str, str] = {}
        pref_summaries: List[str] = []
        explanations: List[str] = []

        for m in active_memories:
            pref_map[m.preference_key] = m.preference_value
            badge = m.memory_type
            if m.memory_type == "INFERRED":
                badge = f"Learned ({int(m.confidence * 100)}% confidence)"
            elif m.memory_type == "TRIP_SPECIFIC":
                badge = "Trip constraint"
            elif m.confirmation_status == "CONFIRMED":
                badge = "Confirmed"

            val_display = m.preference_value.replace("_", " ").title()
            pref_summaries.append(f"{m.preference_key.replace('_', ' ').title()}: {val_display} [{badge}]")

            if m.provenance_summary:
                explanations.append(f"{m.preference_key}: {m.provenance_summary}")

        return {
            "is_learning_enabled": learning_enabled,
            "is_learning_paused": learning_paused,
            "active_memories_count": len(active_memories),
            "preferences_summary": pref_summaries,
            "active_preferences_map": pref_map,
            "explanations": explanations,
            "memories_raw": [
                {
                    "id": m.id,
                    "category": m.category,
                    "preference_key": m.preference_key,
                    "preference_value": m.preference_value,
                    "memory_type": m.memory_type,
                    "confidence": m.confidence,
                    "provenance": m.provenance_summary
                }
                for m in active_memories
            ]
        }
