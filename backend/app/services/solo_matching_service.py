import math
import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.models import (
    User, Destination, Trip, Place,
    SoloTravelerProfile, SoloTripIntent, SoloMatch,
    TravelCircle, CircleMember, TravelerBlock, TravelerReport, UserNotification
)
from app.schemas.schemas import SoloTravelerCardResponse, SoloDiscoverySummaryResponse

logger = logging.getLogger("vanvas.services.solo_matching")


def calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in km."""
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_proximity_label(distance_km: Optional[float], has_date_overlap: bool = False, overlap_days: int = 0) -> str:
    """Return a privacy-safe human readable proximity label without revealing exact coordinates."""
    if distance_km is not None:
        if distance_km <= 5.0:
            return "Nearby (< 5 km)"
        elif distance_km <= 15.0:
            return "Same area (5–15 km)"
        elif distance_km <= 40.0:
            return "Around destination"
    if has_date_overlap and overlap_days > 0:
        return f"Planning ({overlap_days}d overlap)"
    return "Planning"


class SoloMatchingService:
    @staticmethod
    def get_or_create_solo_profile(db: Session, user: User) -> SoloTravelerProfile:
        profile = db.query(SoloTravelerProfile).filter(SoloTravelerProfile.user_id == user.id).first()
        if not profile:
            profile = SoloTravelerProfile(
                user_id=user.id,
                travel_mode="SOLO",
                is_enabled=True,
                discover_before_trip=True,
                discover_when_here=True,
                preferred_group_size=4,
                interests=user.preferences.interests if (user.preferences and user.preferences.interests) else "Trekking,Cafés,Photography,Local Culture",
                travel_style=user.preferences.preferred_travel_style if (user.preferences and user.preferences.preferred_travel_style) else "Balanced",
                trek_pace="Moderate",
                bio=""
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
        return profile

    @staticmethod
    def get_blocked_user_ids(db: Session, user_id: str) -> Set[str]:
        """Returns all user IDs where either user_id blocked them, or they blocked user_id."""
        blocked_by_me = db.query(TravelerBlock.blocked_user_id).filter(TravelerBlock.blocker_user_id == user_id).all()
        blocking_me = db.query(TravelerBlock.blocker_user_id).filter(TravelerBlock.blocked_user_id == user_id).all()
        result = {row[0] for row in blocked_by_me}.union({row[0] for row in blocking_me})
        return result

    @staticmethod
    def calculate_date_overlap(start1: date, end1: date, start2: date, end2: date) -> Tuple[int, Optional[str]]:
        """Calculate number of overlapping days between two date ranges."""
        latest_start = max(start1, start2)
        earliest_end = min(end1, end2)
        overlap = (earliest_end - latest_start).days + 1
        if overlap > 0:
            label = f"{latest_start.strftime('%b %d')} – {earliest_end.strftime('%b %d')}"
            return overlap, label
        return 0, None

    @classmethod
    def find_solo_matches(
        cls,
        db: Session,
        current_user: User,
        destination_id: Optional[str] = None,
        destination_slug: Optional[str] = None,
        destination_name: Optional[str] = None,
        trek_slug: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        client_lat: Optional[float] = None,
        client_lng: Optional[float] = None,
        mode: str = "all",  # "all", "before_trip", "here_now", "today", "this_week", "trek"
        radius_km: float = 40.0
    ) -> List[SoloTravelerCardResponse]:
        """
        Find real compatible solo travelers matching hard filters and ranked by compatibility factors.
        Zero fake data.
        """
        my_profile = cls.get_or_create_solo_profile(db, current_user)
        blocked_ids = cls.get_blocked_user_ids(db, current_user.id)
        blocked_ids.add(current_user.id)

        # Resolve destination if slug is given
        dest_obj = None
        if destination_slug and not destination_id:
            dest_obj = db.query(Destination).filter(Destination.slug == destination_slug.lower()).first()
            if dest_obj:
                destination_id = dest_obj.id
                destination_name = dest_obj.name
        elif destination_id:
            dest_obj = db.query(Destination).filter(Destination.id == destination_id).first()
            if dest_obj:
                destination_name = dest_obj.name

        # Query all candidate users not blocked and resolve their profile
        candidate_users = db.query(User).filter(User.id.notin_(blocked_ids)).all()
        candidate_profiles = []
        for u in candidate_users:
            p = cls.get_or_create_solo_profile(db, u)
            if not p.is_enabled:
                continue
            if (mode == "here_now" or mode in ["today", "this_week"]) and not p.discover_when_here:
                continue
            if mode == "before_trip" and not p.discover_before_trip:
                continue
            candidate_profiles.append(p)

        today = datetime.now(timezone.utc).date()
        target_start = start_date or today
        target_end = end_date or (target_start + timedelta(days=7))

        if mode == "today":
            target_start = today
            target_end = today
        elif mode == "this_week":
            target_start = today
            target_end = today + timedelta(days=7)

        # Fetch existing match requests for current user
        existing_matches = db.query(SoloMatch).filter(
            or_(
                SoloMatch.sender_user_id == current_user.id,
                SoloMatch.receiver_user_id == current_user.id
            )
        ).all()

        match_status_map: Dict[str, Tuple[str, str]] = {}
        for m in existing_matches:
            other_id = m.receiver_user_id if m.sender_user_id == current_user.id else m.sender_user_id
            if m.status == "ACCEPTED":
                match_status_map[other_id] = ("ACCEPTED", m.id)
            elif m.status == "DECLINED":
                match_status_map[other_id] = ("DECLINED", m.id)
            elif m.status == "PENDING":
                if m.sender_user_id == current_user.id:
                    match_status_map[other_id] = ("PENDING_OUTGOING", m.id)
                else:
                    match_status_map[other_id] = ("PENDING_INCOMING", m.id)

        # Parse user interests
        my_interests = set(tag.strip().lower() for tag in my_profile.interests.split(",") if tag.strip())

        scored_cards: List[Tuple[float, SoloTravelerCardResponse]] = []

        for candidate in candidate_profiles:
            cand_user = candidate.user
            if not cand_user:
                continue

            # Query candidate's active intents & trips
            cand_intents = db.query(SoloTripIntent).filter(
                SoloTripIntent.user_id == cand_user.id,
                SoloTripIntent.status == "active"
            ).all()

            cand_trips = db.query(Trip).filter(
                Trip.user_id == cand_user.id,
                Trip.status.in_(["planned", "active"])
            ).all()

            matched = False
            best_overlap_days = 0
            best_overlap_label = None
            distance_km: Optional[float] = None
            proximity_label = "Planning"
            matched_dest_name = destination_name
            matched_trek_slug = trek_slug

            # Check GPS proximity if coordinates available
            if client_lat is not None and client_lng is not None:
                if candidate.last_approx_lat is not None and candidate.last_approx_lng is not None:
                    d = calculate_haversine_km(client_lat, client_lng, candidate.last_approx_lat, candidate.last_approx_lng)
                    if d <= radius_km:
                        matched = True
                        distance_km = d
                        proximity_label = get_proximity_label(d)

            # Check trek match
            if trek_slug:
                trek_matched = False
                for intent in cand_intents:
                    if intent.trek_slug and intent.trek_slug.lower() == trek_slug.lower():
                        ov_days, ov_lbl = cls.calculate_date_overlap(target_start, target_end, intent.start_date, intent.end_date)
                        if ov_days > 0 or mode in ["here_now", "today", "this_week"]:
                            trek_matched = True
                            if ov_days > best_overlap_days:
                                best_overlap_days = ov_days
                                best_overlap_label = ov_lbl
                if trek_matched:
                    matched = True
                elif not (mode in ["here_now", "today", "this_week"] and matched):
                    # Hard filter for trek mode
                    continue

            # Check destination match
            if destination_id or destination_name:
                dest_matched = False
                for intent in cand_intents:
                    if (destination_id and intent.destination_id == destination_id) or \
                       (destination_name and intent.destination_name and destination_name.lower() in intent.destination_name.lower()):
                        ov_days, ov_lbl = cls.calculate_date_overlap(target_start, target_end, intent.start_date, intent.end_date)
                        if ov_days > 0 or intent.intent_type in ["CURRENTLY_THERE", "BOTH"] or mode in ["here_now", "today", "this_week"]:
                            dest_matched = True
                            if ov_days > best_overlap_days:
                                best_overlap_days = ov_days
                                best_overlap_label = ov_lbl

                for t in cand_trips:
                    if (destination_id and t.destination_id == destination_id):
                        ov_days, ov_lbl = cls.calculate_date_overlap(target_start, target_end, t.start_date, t.end_date)
                        if ov_days > 0 or t.status == "active":
                            dest_matched = True
                            if ov_days > best_overlap_days:
                                best_overlap_days = ov_days
                                best_overlap_label = ov_lbl

                if dest_matched:
                    matched = True
                elif not matched and mode not in ["all", "here_now", "today", "this_week"]:
                    # Destination is specified and no match
                    continue

            # If general discovery without specific destination, check date overlap across all intents/trips
            if not matched and (destination_id is None and trek_slug is None and (client_lat is None or distance_km is None)):
                for intent in cand_intents:
                    ov_days, ov_lbl = cls.calculate_date_overlap(target_start, target_end, intent.start_date, intent.end_date)
                    if ov_days > 0:
                        matched = True
                        if ov_days > best_overlap_days:
                            best_overlap_days = ov_days
                            best_overlap_label = ov_lbl
                            matched_dest_name = intent.destination_name
                            matched_trek_slug = intent.trek_slug

            # If mode is here_now / today / this_week, only keep if distance <= radius_km or candidate intent is CURRENTLY_THERE
            if mode in ["here_now", "today", "this_week"]:
                has_current = any(i.intent_type in ["CURRENTLY_THERE", "BOTH"] for i in cand_intents)
                if not matched and not has_current and distance_km is None:
                    continue
                matched = True

            if not matched:
                continue

            # Calculate proximity label
            if distance_km is not None:
                proximity_label = get_proximity_label(distance_km, has_date_overlap=best_overlap_days > 0, overlap_days=best_overlap_days)
            elif best_overlap_days > 0:
                proximity_label = f"Planning ({best_overlap_days}d overlap)"
            else:
                proximity_label = "Planning"

            # Parse interests & compute overlap score
            cand_interests_list = [tag.strip() for tag in candidate.interests.split(",") if tag.strip()]
            cand_interests_set = set(tag.lower() for tag in cand_interests_list)
            shared_interests = my_interests.intersection(cand_interests_set)

            # Compatibility score for ranking
            score = 0.0
            score += len(shared_interests) * 15.0
            score += min(best_overlap_days, 10) * 10.0
            if candidate.travel_style.lower() == my_profile.travel_style.lower():
                score += 20.0
            if candidate.trek_pace.lower() == my_profile.trek_pace.lower():
                score += 15.0
            if distance_km is not None:
                score += max(0.0, 50.0 - distance_km)

            conn_status, match_id = match_status_map.get(cand_user.id, ("NONE", None))

            card = SoloTravelerCardResponse(
                user_id=cand_user.id,
                full_name=cand_user.full_name,
                avatar_url=cand_user.avatar_url,
                avatar_type=cand_user.avatar_type or "preset",
                avatar_preset=cand_user.avatar_preset or "himalayan-explorer",
                travel_mode=candidate.travel_mode,
                travel_style=candidate.travel_style,
                trek_pace=candidate.trek_pace,
                interests=cand_interests_list,
                bio=candidate.bio or "",
                proximity_label=proximity_label,
                overlapping_days=best_overlap_days,
                overlap_dates_label=best_overlap_label,
                connection_status=conn_status,
                match_id=match_id,
                destination_name=matched_dest_name,
                trek_slug=matched_trek_slug
            )
            scored_cards.append((score, card))

        # Sort descending by score
        scored_cards.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_cards]


    @classmethod
    def create_notification(
        cls,
        db: Session,
        user_id: str,
        title: str,
        body: str,
        category: str,
        entity_id: Optional[str] = None
    ) -> UserNotification:
        notif = UserNotification(
            user_id=user_id,
            title=title,
            body=body,
            category=category,
            entity_id=entity_id,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
