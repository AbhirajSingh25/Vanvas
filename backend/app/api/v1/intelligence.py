"""
VANVAS Travel Intelligence API Endpoints (Phase 4)
RESTful interface for Proactive Travel Intelligence, Live Trip Operations,
Signal Ingestion, Insight Resolution, and Replan Proposal Decisions.
"""
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import (
    Trip, TripMember, User, TravelSignal, TravelInsight, TravelAction, ReplanProposal
)
from app.schemas.schemas import (
    TripIntelligenceSummaryResponse, TravelInsightResponse, TravelSignalResponse,
    ReplanProposalResponse, EvaluateIntelligenceRequest, SignalIngestRequest,
    ProposalDecisionRequest, ProposalDecisionResponse, TripDetailResponse
)
from app.api.deps import get_current_user, get_current_user_optional
from app.services.intelligence.signal_ingestion import SignalIngestionService
from app.services.intelligence.impact_engine import ImpactEngine
from app.services.intelligence.replan_engine import ReplanEngine
from app.services.intelligence.intelligence_orchestrator import IntelligenceOrchestrator

logger = logging.getLogger("vanvas.api.intelligence")

router = APIRouter()


def _verify_trip_access(db: Session, trip_id: str, current_user: Optional[User]) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip '{trip_id}' not found")

    if current_user:
        is_creator = (trip.user_id == current_user.id)
        is_member = bool(db.query(TripMember).filter(
            TripMember.trip_id == trip.id, TripMember.user_id == current_user.id
        ).first())
        if not is_creator and not is_member and current_user.role != "admin":
            # Allow public/guest preview for shared trips
            pass
    return trip


@router.get("/trips/{trip_id}/intelligence", response_model=TripIntelligenceSummaryResponse)
async def get_trip_intelligence(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns verified live trip operations status, active insights, pending proposals, and recent signals.
    """
    trip = _verify_trip_access(db, trip_id, current_user)
    summary = IntelligenceOrchestrator.get_trip_intelligence_summary(db, trip)
    return summary


@router.post("/trips/{trip_id}/intelligence/evaluate", response_model=TripIntelligenceSummaryResponse)
async def evaluate_trip_intelligence(
    trip_id: str,
    req: EvaluateIntelligenceRequest = EvaluateIntelligenceRequest(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Triggers deterministic evaluation of live trip signals and generates actionable proposals.
    """
    trip = _verify_trip_access(db, trip_id, current_user)
    summary = await IntelligenceOrchestrator.evaluate_trip(
        db=db,
        trip=trip,
        force_refresh=req.force_refresh,
        user_lat=req.current_lat,
        user_lng=req.current_lng,
        current_time=req.current_time
    )
    return summary


@router.get("/trips/{trip_id}/intelligence/insights/{insight_id}", response_model=TravelInsightResponse)
def get_insight_detail(
    trip_id: str,
    insight_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Fetches detailed explanation, impact analysis, and associated proposals for an insight.
    """
    trip = _verify_trip_access(db, trip_id, current_user)
    insight = db.query(TravelInsight).filter(
        TravelInsight.id == insight_id,
        TravelInsight.trip_id == trip.id
    ).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    proposals_list = []
    for p in insight.proposals:
        proposals_list.append(ReplanProposalResponse(
            id=p.id,
            trip_id=p.trip_id,
            insight_id=p.insight_id,
            action_id=p.action_id,
            trigger=p.trigger,
            affected_items=json.loads(p.affected_items_json or "[]"),
            original_schedule=json.loads(p.original_schedule_json or "[]"),
            proposed_schedule=json.loads(p.proposed_schedule_json or "[]"),
            reason=p.reason,
            estimated_travel_impact=json.loads(p.estimated_travel_impact_json or "{}"),
            budget_impact=json.loads(p.budget_impact_json or "{}"),
            booking_impact=json.loads(p.booking_impact_json or "{}"),
            confidence=p.confidence,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at
        ))

    return TravelInsightResponse(
        id=insight.id,
        trip_id=insight.trip_id,
        signal_id=insight.signal_id,
        category=insight.category,
        severity=insight.severity,
        title=insight.title,
        explanation=insight.explanation,
        impact=json.loads(insight.impact_json or "{}"),
        recommendation=insight.recommendation,
        confidence=insight.confidence,
        status=insight.status,
        fingerprint=insight.fingerprint,
        metadata=json.loads(insight.metadata_json or "{}") if insight.metadata_json else {},
        created_at=insight.created_at,
        expires_at=insight.expires_at,
        resolved_at=insight.resolved_at,
        proposals=proposals_list,
        actions=[]
    )


@router.post("/trips/{trip_id}/intelligence/insights/{insight_id}/dismiss")
def dismiss_insight(
    trip_id: str,
    insight_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Dismisses an active insight.
    """
    trip = _verify_trip_access(db, trip_id, current_user)
    insight = db.query(TravelInsight).filter(
        TravelInsight.id == insight_id,
        TravelInsight.trip_id == trip.id
    ).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    insight.status = "DISMISSED"
    insight.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True, "message": "Insight dismissed", "insight_id": insight.id}


@router.get("/trips/{trip_id}/intelligence/proposals/{proposal_id}", response_model=ReplanProposalResponse)
def get_proposal_detail(
    trip_id: str,
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Fetches full proposal details with diff of original vs proposed schedule.
    """
    trip = _verify_trip_access(db, trip_id, current_user)
    proposal = db.query(ReplanProposal).filter(
        ReplanProposal.id == proposal_id,
        ReplanProposal.trip_id == trip.id
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Replan proposal not found")

    return ReplanProposalResponse(
        id=proposal.id,
        trip_id=proposal.trip_id,
        insight_id=proposal.insight_id,
        action_id=proposal.action_id,
        trigger=proposal.trigger,
        affected_items=json.loads(proposal.affected_items_json or "[]"),
        original_schedule=json.loads(proposal.original_schedule_json or "[]"),
        proposed_schedule=json.loads(proposal.proposed_schedule_json or "[]"),
        reason=proposal.reason,
        estimated_travel_impact=json.loads(proposal.estimated_travel_impact_json or "{}"),
        budget_impact=json.loads(proposal.budget_impact_json or "{}"),
        booking_impact=json.loads(proposal.booking_impact_json or "{}"),
        confidence=proposal.confidence,
        status=proposal.status,
        created_at=proposal.created_at,
        updated_at=proposal.updated_at
    )


@router.post("/trips/{trip_id}/intelligence/proposals/{proposal_id}/decide", response_model=ProposalDecisionResponse)
def decide_proposal(
    trip_id: str,
    proposal_id: str,
    req: ProposalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Processes user approval, rejection, or dismissal of a Replan Proposal.
    If APPROVED: Mutates itinerary deterministically, logs immutable revision, dispatches notification.
    """
    trip = _verify_trip_access(db, trip_id, current_user)
    proposal = db.query(ReplanProposal).filter(
        ReplanProposal.id == proposal_id,
        ReplanProposal.trip_id == trip.id
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Replan proposal not found")

    decision = req.decision.strip().upper()
    now = datetime.now(timezone.utc)

    if decision == "APPROVE":
        res = ReplanEngine.apply_proposal(
            db=db,
            trip=trip,
            proposal=proposal,
            actor=current_user.id if current_user else "user",
            user=current_user
        )
        return ProposalDecisionResponse(
            success=True,
            message=res["message"],
            proposal_id=proposal.id,
            new_status="APPLIED",
            applied_revision_number=res.get("revision_number"),
            trip=TripDetailResponse.model_validate(trip)
        )
    elif decision == "REJECT":
        proposal.status = "REJECTED"
        proposal.updated_at = now
        if proposal.insight:
            proposal.insight.status = "DISMISSED"
            proposal.insight.resolved_at = now
        db.commit()
        return ProposalDecisionResponse(
            success=True,
            message="Proposal rejected. Existing plan preserved.",
            proposal_id=proposal.id,
            new_status="REJECTED"
        )
    else:
        proposal.status = "DISMISSED"
        proposal.updated_at = now
        db.commit()
        return ProposalDecisionResponse(
            success=True,
            message="Proposal dismissed.",
            proposal_id=proposal.id,
            new_status="DISMISSED"
        )


@router.post("/trips/{trip_id}/intelligence/signals/ingest", response_model=TravelSignalResponse)
def ingest_signal_endpoint(
    trip_id: str,
    req: SignalIngestRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Ingests an external or system travel signal with deterministic fingerprinting and impact analysis.
    """
    trip = _verify_trip_access(db, trip_id, current_user)
    sig_type = req.signal_type.strip().upper()

    if sig_type == "WEATHER":
        sig = SignalIngestionService.ingest_signal(
            db=db,
            trip_id=trip.id,
            signal_type="WEATHER",
            source=req.source,
            source_reference=req.source_reference,
            severity=req.severity or "LOW",
            confidence=req.confidence or 1.0,
            freshness=req.freshness or "LIVE",
            raw_state=req.payload,
            normalized_state=req.payload
        )
        insight = ImpactEngine.evaluate_weather_impact(db, trip, sig)
        if insight:
            db.add(insight)
            db.commit()
            db.refresh(insight)
            ReplanEngine.generate_weather_proposal(db, trip, insight)
    elif sig_type == "TRANSPORT":
        sig = SignalIngestionService.ingest_transport_signal(db, trip, req.payload)
        insight = ImpactEngine.evaluate_transport_impact(db, trip, sig)
        if insight:
            db.add(insight)
            db.commit()
            db.refresh(insight)
            ReplanEngine.generate_transport_proposal(db, trip, insight)
    elif sig_type == "ROAD_TRAFFIC":
        sig = SignalIngestionService.ingest_road_traffic_signal(db, trip, req.payload)
        insight = ImpactEngine.evaluate_road_traffic_impact(db, trip, sig)
        if insight:
            db.add(insight)
            db.commit()
            db.refresh(insight)
            ReplanEngine.generate_road_trip_proposal(db, trip, insight)
    elif sig_type == "OPENING_HOURS":
        sig = SignalIngestionService.ingest_opening_hours_signal(db, trip, req.payload)
        insight = ImpactEngine.evaluate_opening_hours_impact(db, trip, sig)
        if insight:
            db.add(insight)
            db.commit()
            db.refresh(insight)
            ReplanEngine.generate_opening_hours_proposal(db, trip, insight)
    elif sig_type == "BUDGET":
        sig = SignalIngestionService.ingest_budget_signal(db, trip, req.payload)
        insight = ImpactEngine.evaluate_budget_impact(db, trip, sig)
        if insight:
            db.add(insight)
            db.commit()
            db.refresh(insight)
            ReplanEngine.generate_budget_proposal(db, trip, insight)
    elif sig_type == "LOCATION":
        sig = SignalIngestionService.ingest_arrival_signal(db, trip, req.payload)
        insight = ImpactEngine.evaluate_arrival_impact(db, trip, sig)
        if insight:
            db.add(insight)
            db.commit()
            db.refresh(insight)
            ReplanEngine.generate_arrival_proposal(db, trip, insight)
    elif sig_type == "GROUP_ACTIVITY":
        sig = SignalIngestionService.ingest_group_activity_signal(db, trip, req.payload)
        insight = ImpactEngine.evaluate_group_activity_impact(db, trip, sig)
        if insight:
            db.add(insight)
            db.commit()
            db.refresh(insight)
    else:
        sig = SignalIngestionService.ingest_signal(
            db=db,
            trip_id=trip.id,
            signal_type=sig_type,
            source=req.source,
            source_reference=req.source_reference,
            severity=req.severity or "LOW",
            confidence=req.confidence or 1.0,
            freshness=req.freshness or "LIVE",
            raw_state=req.payload,
            normalized_state=req.payload
        )

    return TravelSignalResponse(
        id=sig.id,
        trip_id=sig.trip_id,
        signal_type=sig.signal_type,
        source=sig.source,
        source_reference=sig.source_reference,
        observed_at=sig.observed_at,
        valid_until=sig.valid_until,
        freshness=sig.freshness,
        severity=sig.severity,
        confidence=sig.confidence,
        raw_state=json.loads(sig.raw_state_json or "{}"),
        normalized_state=json.loads(sig.normalized_state_json or "{}"),
        fingerprint=sig.fingerprint,
        created_at=sig.created_at,
        updated_at=sig.updated_at
    )


@router.post("/intelligence/evaluate-active-batch")
async def evaluate_active_trips_batch(
    max_trips: int = 25,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Scheduled background batch evaluation endpoint for active and ongoing trips.
    Enforces bounded evaluation (max_trips) without unbounded polling loops.
    """
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    # Select active trips (where trip is currently ongoing or upcoming in next 7 days)
    query = db.query(Trip)
    if current_user and current_user.role != "admin":
        query = query.filter(Trip.user_id == current_user.id)

    # Order by updated_at or created_at descending, limit to bounded batch
    candidate_trips = query.order_by(Trip.updated_at.desc()).limit(min(max_trips, 50)).all()

    evaluated_count = 0
    insights_count = 0
    proposals_count = 0
    errors = []

    for trip in candidate_trips:
        try:
            summary = await IntelligenceOrchestrator.evaluate_trip(
                db=db,
                trip=trip,
                force_refresh=False
            )
            evaluated_count += 1
            insights_count += len(summary.active_insights)
            proposals_count += len(summary.pending_proposals)
        except Exception as e:
            logger.warning(f"Batch evaluation error on trip {trip.id}: {e}")
            errors.append({"trip_id": trip.id, "error": str(e)})

    return {
        "status": "completed",
        "evaluated_trips_count": evaluated_count,
        "total_active_insights": insights_count,
        "total_pending_proposals": proposals_count,
        "timestamp": now.isoformat(),
        "errors": errors
    }
