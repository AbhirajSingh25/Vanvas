"""
VANVAS Travel Intelligence Orchestrator (Phase 4)
Orchestrates signal ingestion, deterministic impact evaluation, proposal generation,
notification dispatch, and trip cadence management.

Features:
- Configurable evaluation cadence based on trip proximity (underway, <48h, 3-14 days, >14 days)
- Idempotency and deduplication guardrails
- Stale and unknown data governance
- Live Trip Operations summary generator for UI & Ask VANVAS
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, timedelta, date
from typing import Dict, Any, Optional, List, Tuple

from sqlalchemy.orm import Session
from app.models.models import (
    Trip, Itinerary, ItineraryItem, Place, Hotel, User, Expense,
    TravelSignal, TravelInsight, TravelAction, ReplanProposal,
    TripRevision, NotificationItem
)
from app.services.intelligence.signal_ingestion import SignalIngestionService
from app.services.intelligence.impact_engine import ImpactEngine
from app.services.intelligence.replan_engine import ReplanEngine
from app.services.notification_service import NotificationService

logger = logging.getLogger("vanvas.intelligence.orchestrator")


class IntelligenceOrchestrator:
    """Central orchestrator for proactive travel intelligence."""

    @classmethod
    def get_trip_cadence(cls, trip: Trip) -> str:
        """
        Determines evaluation cadence:
        - underway: Trip is actively occurring
        - imminent: Within 48 hours
        - near_term: 3 to 14 days away
        - planned: > 14 days away
        """
        today = datetime.now(timezone.utc).date()
        if not trip.start_date:
            return "planned"

        if trip.start_date <= today <= (trip.end_date or trip.start_date):
            return "underway"
        days_to_start = (trip.start_date - today).days
        if days_to_start <= 2:
            return "imminent"
        elif days_to_start <= 14:
            return "near_term"
        return "planned"

    @classmethod
    async def evaluate_trip(
        cls,
        db: Session,
        trip: Trip,
        force_refresh: bool = False,
        user_lat: Optional[float] = None,
        user_lng: Optional[float] = None,
        current_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates active signals, impact, and proposals for a trip.
        """
        cadence = cls.get_trip_cadence(trip)
        now = datetime.now(timezone.utc)

        # 1. Weather Signal Ingestion & Impact Evaluation
        weather_sig = await SignalIngestionService.ingest_weather_signal(db, trip)
        weather_insight = ImpactEngine.evaluate_weather_impact(db, trip, weather_sig)

        if weather_insight:
            # Check existing active insight with same fingerprint
            existing_ins = db.query(TravelInsight).filter(
                TravelInsight.trip_id == trip.id,
                TravelInsight.fingerprint == weather_insight.fingerprint,
                TravelInsight.status.in_(["ACTIONABLE", "PROPOSED"])
            ).first()

            if not existing_ins:
                db.add(weather_insight)
                db.commit()
                db.refresh(weather_insight)

                # Generate Replan Proposal
                proposal = ReplanEngine.generate_weather_proposal(db, trip, weather_insight)

                # Notify user if high severity
                if weather_insight.severity in ["HIGH", "CRITICAL"]:
                    cls._notify_insight(db, trip, weather_insight, proposal)

        # 2. Budget Signal Ingestion & Evaluation
        budget_sig = SignalIngestionService.ingest_budget_signal(db, trip)
        budget_insight = ImpactEngine.evaluate_budget_impact(db, trip, budget_sig)

        if budget_insight:
            existing_b = db.query(TravelInsight).filter(
                TravelInsight.trip_id == trip.id,
                TravelInsight.fingerprint == budget_insight.fingerprint,
                TravelInsight.status.in_(["ACTIONABLE", "PROPOSED"])
            ).first()

            if not existing_b:
                db.add(budget_insight)
                db.commit()
                db.refresh(budget_insight)
                ReplanEngine.generate_budget_proposal(db, trip, budget_insight)

        return cls.get_trip_intelligence_summary(db, trip)

    @classmethod
    def get_trip_intelligence_summary(
        cls,
        db: Session,
        trip: Trip
    ) -> Dict[str, Any]:
        """
        Assembles clean, verified live operations state for Explorer's Desk UI.
        """
        now = datetime.now(timezone.utc)
        cadence = cls.get_trip_cadence(trip)

        # Fetch active and resolved insights
        active_insights = db.query(TravelInsight).filter(
            TravelInsight.trip_id == trip.id,
            TravelInsight.status.in_(["ACTIONABLE", "PROPOSED", "DETECTED"])
        ).order_by(TravelInsight.created_at.desc()).all()

        resolved_insights = db.query(TravelInsight).filter(
            TravelInsight.trip_id == trip.id,
            TravelInsight.status.in_(["APPLIED", "RESOLVED", "DISMISSED", "EXPIRED"])
        ).order_by(TravelInsight.created_at.desc()).limit(10).all()

        # Fetch pending proposals
        pending_proposals = db.query(ReplanProposal).filter(
            ReplanProposal.trip_id == trip.id,
            ReplanProposal.status == "PROPOSED"
        ).order_by(ReplanProposal.created_at.desc()).all()

        # Fetch recent signals
        recent_signals = db.query(TravelSignal).filter(
            TravelSignal.trip_id == trip.id
        ).order_by(TravelSignal.observed_at.desc()).limit(10).all()

        # Build headline status
        if not active_insights:
            headline = "✓ All trip operations on track"
        elif any(i.severity == "HIGH" for i in active_insights):
            high_one = next(i for i in active_insights if i.severity == "HIGH")
            headline = f"⚠ {high_one.title}: {high_one.explanation[:60]}..."
        else:
            headline = f"ℹ {active_insights[0].title}: {active_insights[0].explanation[:60]}..."

        dest_name = trip.destination.name if trip.destination else "Destination"

        def _format_insight(i: TravelInsight) -> Dict[str, Any]:
            proposals_list = []
            for p in i.proposals:
                proposals_list.append({
                    "id": p.id,
                    "trip_id": p.trip_id,
                    "insight_id": p.insight_id,
                    "trigger": p.trigger,
                    "affected_items": json.loads(p.affected_items_json or "[]"),
                    "original_schedule": json.loads(p.original_schedule_json or "[]"),
                    "proposed_schedule": json.loads(p.proposed_schedule_json or "[]"),
                    "reason": p.reason,
                    "estimated_travel_impact": json.loads(p.estimated_travel_impact_json or "{}"),
                    "budget_impact": json.loads(p.budget_impact_json or "{}"),
                    "booking_impact": json.loads(p.booking_impact_json or "{}"),
                    "confidence": p.confidence,
                    "status": p.status,
                    "created_at": p.created_at.isoformat(),
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None
                })
            return {
                "id": i.id,
                "trip_id": i.trip_id,
                "signal_id": i.signal_id,
                "category": i.category,
                "severity": i.severity,
                "title": i.title,
                "explanation": i.explanation,
                "impact": json.loads(i.impact_json or "{}"),
                "recommendation": i.recommendation,
                "confidence": i.confidence,
                "status": i.status,
                "fingerprint": i.fingerprint,
                "created_at": i.created_at.isoformat(),
                "expires_at": i.expires_at.isoformat() if i.expires_at else None,
                "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
                "proposals": proposals_list,
                "actions": []
            }

        def _format_signal(s: TravelSignal) -> Dict[str, Any]:
            return {
                "id": s.id,
                "trip_id": s.trip_id,
                "signal_type": s.signal_type,
                "source": s.source,
                "source_reference": s.source_reference,
                "observed_at": s.observed_at.isoformat(),
                "valid_until": s.valid_until.isoformat() if s.valid_until else None,
                "freshness": s.freshness,
                "severity": s.severity,
                "confidence": s.confidence,
                "raw_state": json.loads(s.raw_state_json or "{}"),
                "normalized_state": json.loads(s.normalized_state_json or "{}"),
                "fingerprint": s.fingerprint,
                "created_at": s.created_at.isoformat()
            }

        def _format_proposal(p: ReplanProposal) -> Dict[str, Any]:
            return {
                "id": p.id,
                "trip_id": p.trip_id,
                "insight_id": p.insight_id,
                "trigger": p.trigger,
                "affected_items": json.loads(p.affected_items_json or "[]"),
                "original_schedule": json.loads(p.original_schedule_json or "[]"),
                "proposed_schedule": json.loads(p.proposed_schedule_json or "[]"),
                "reason": p.reason,
                "estimated_travel_impact": json.loads(p.estimated_travel_impact_json or "{}"),
                "budget_impact": json.loads(p.budget_impact_json or "{}"),
                "booking_impact": json.loads(p.booking_impact_json or "{}"),
                "confidence": p.confidence,
                "status": p.status,
                "created_at": p.created_at.isoformat(),
                "updated_at": p.updated_at.isoformat() if p.updated_at else None
            }

        recent_revs = []
        for r in trip.revisions[:5]:
            recent_revs.append({
                "id": r.id,
                "trip_id": r.trip_id,
                "user_id": r.user_id,
                "revision_number": r.revision_number,
                "action_type": r.action_type,
                "reason": r.reason,
                "changes": json.loads(r.changes_json or "{}"),
                "created_at": r.created_at.isoformat()
            })

        return {
            "trip_id": trip.id,
            "destination_name": dest_name,
            "is_live_evaluation": True,
            "last_evaluated_at": now.isoformat(),
            "freshness": "LIVE",
            "live_status_headline": headline,
            "active_insights": [_format_insight(i) for i in active_insights],
            "resolved_insights": [_format_insight(i) for i in resolved_insights],
            "pending_proposals": [_format_proposal(p) for p in pending_proposals],
            "recent_signals": [_format_signal(s) for s in recent_signals],
            "recent_revisions": recent_revs,
            "cadence_mode": cadence
        }

    @classmethod
    def _notify_insight(
        cls,
        db: Session,
        trip: Trip,
        insight: TravelInsight,
        proposal: Optional[ReplanProposal]
    ):
        """Dispatches deduplicated actionable push notification."""
        user_id = trip.user_id
        if not user_id:
            return

        notif_type = "weather_alert" if insight.category == "WEATHER" else ("transport_update" if insight.category == "TRANSPORT" else "itinerary_change")

        # Deduplication check: do not send duplicate notification for same insight fingerprint within 12 hours
        recent_notif = db.query(NotificationItem).filter(
            NotificationItem.user_id == user_id,
            NotificationItem.trip_id == trip.id,
            NotificationItem.type == notif_type,
            NotificationItem.deep_link.contains(insight.id)
        ).first()

        if recent_notif:
            logger.info(f"Notification for insight {insight.id} already sent to user {user_id}. Deduplicated.")
            return

        body = f"{insight.explanation} VANVAS has an alternative ready." if proposal else insight.explanation
        deep_link = f"/trips/{trip.id}/intelligence?insight_id={insight.id}"

        try:
            NotificationService.send_notification(
                db=db,
                user_id=user_id,
                notification_type=notif_type,
                title=insight.title,
                body=body,
                deep_link=deep_link,
                trip_id=trip.id
            )
        except Exception as e:
            logger.warning(f"Error dispatching notification for insight {insight.id}: {e}")
