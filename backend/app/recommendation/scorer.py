"""
VANVAS Recommendation Scoring & Personalization Ranking Engine
Computes multi-criteria match scores and evidence-backed explanations for places,
stays, and itinerary candidates.

Pipeline:
CANDIDATE OPTIONS -> HARD CONSTRAINT VALIDATION -> MEMORY-AWARE RANKING -> EXPLANATION -> USER SELECTION
"""
import math
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings


class RecommendationScorer:
    def __init__(
        self,
        w_interest: float = settings.WEIGHT_INTEREST,
        w_budget: float = settings.WEIGHT_BUDGET,
        w_location: float = settings.WEIGHT_LOCATION,
        w_rating: float = settings.WEIGHT_RATING,
        w_time_fit: float = settings.WEIGHT_TIME_FIT,
        w_group_vote: float = settings.WEIGHT_GROUP_VOTE,
        w_personalization: float = settings.WEIGHT_PERSONALIZATION,
    ):
        self.w_interest = w_interest
        self.w_budget = w_budget
        self.w_location = w_location
        self.w_rating = w_rating
        self.w_time_fit = w_time_fit
        self.w_group_vote = w_group_vote
        self.w_personalization = w_personalization

    def score_place(
        self,
        place: Any,
        user_interests: List[str],
        user_budget_tier: str, # "Budget", "Balanced", "Comfort", "Premium"
        current_lat: Optional[float] = None,
        current_lng: Optional[float] = None,
        target_time_slot: Optional[str] = None, # "morning", "afternoon", "evening", "night"
        group_votes: Optional[List[str]] = None, # list of "LOVE", "LIKE", "NO"
        user_preference_tags: Optional[List[str]] = None,
        memory_preferences: Optional[Dict[str, Any]] = None,
    ) -> float:
        # 1. Interest match (0.0 to 1.0)
        interest_score = 0.5
        place_category = getattr(place, "category", "") or ""
        place_tags = (getattr(place, "tags", "") or "").lower().split(",")
        place_tags = [t.strip() for t in place_tags if t.strip()]

        matched_interests = 0
        for interest in user_interests:
            interest_lower = interest.lower().strip()
            if interest_lower in place_category.lower() or any(interest_lower in tag for tag in place_tags):
                matched_interests += 1
        
        if user_interests:
            interest_score = min(1.0, 0.4 + 0.6 * (matched_interests / max(1, len(user_interests))))

        # 2. Budget match (0.0 to 1.0)
        price_level = getattr(place, "price_level", "₹₹") or "₹₹"
        approx_cost = getattr(place, "approx_cost", 0.0) or 0.0
        budget_score = 0.8

        if user_budget_tier == "Budget":
            if price_level in ["₹", "Free"] or approx_cost <= 300:
                budget_score = 1.0
            elif price_level == "₹₹" or approx_cost <= 800:
                budget_score = 0.7
            else:
                budget_score = 0.3
        elif user_budget_tier == "Balanced":
            if price_level in ["₹", "₹₹", "Free"]:
                budget_score = 1.0
            elif price_level == "₹₹₹":
                budget_score = 0.8
            else:
                budget_score = 0.5
        elif user_budget_tier in ["Comfort", "Premium"]:
            budget_score = 1.0 # high budget can afford all

        # 3. Location / Proximity score (0.0 to 1.0)
        location_score = 0.8
        if current_lat is not None and current_lng is not None:
            p_lat = getattr(place, "latitude", 0.0)
            p_lng = getattr(place, "longitude", 0.0)
            dist_km = math.sqrt((p_lat - current_lat)**2 + (p_lng - current_lng)**2) * 111.0
            if dist_km <= 2.0:
                location_score = 1.0
            elif dist_km <= 5.0:
                location_score = 0.85
            elif dist_km <= 10.0:
                location_score = 0.65
            else:
                location_score = max(0.2, 1.0 - (dist_km / 25.0))

        # 4. Rating score (0.0 to 1.0)
        raw_rating = getattr(place, "rating", 4.0) or 4.0
        rating_score = max(0.0, min(1.0, (raw_rating - 3.0) / 2.0))

        # 5. Time fit score (0.0 to 1.0)
        time_fit_score = 0.8
        opening_time = getattr(place, "opening_time", "08:00") or "08:00"
        closing_time = getattr(place, "closing_time", "20:00") or "20:00"
        if target_time_slot:
            slot_lower = target_time_slot.lower()
            if slot_lower == "morning":
                if opening_time <= "09:00":
                    time_fit_score = 1.0
                else:
                    time_fit_score = 0.4
            elif slot_lower == "evening":
                if closing_time >= "19:00" or "sunset" in place_tags or "café" in place_category.lower() or "market" in place_category.lower():
                    time_fit_score = 1.0
                else:
                    time_fit_score = 0.5
            elif slot_lower == "night":
                if closing_time >= "21:30" or "nightlife" in place_tags or "dinner" in place_tags:
                    time_fit_score = 1.0
                else:
                    time_fit_score = 0.2

        # 6. Group vote score (0.0 to 1.0)
        group_vote_score = 0.7
        if group_votes:
            love_count = group_votes.count("LOVE")
            like_count = group_votes.count("LIKE")
            no_count = group_votes.count("NO")
            total = len(group_votes)
            if total > 0:
                raw_vote_val = (love_count * 1.0 + like_count * 0.6 - no_count * 0.8) / total
                group_vote_score = max(0.0, min(1.0, 0.5 + 0.5 * raw_vote_val))

        # 7. Personalization score (0.0 to 1.0) from tags & TravellerMemory
        personalization_score = 0.7
        tags_to_check = list(user_preference_tags or [])

        # Integrate TravellerMemory signals
        if memory_preferences:
            nature_pref = memory_preferences.get("nature_trails") or memory_preferences.get("activity_type")
            if nature_pref:
                tags_to_check.append(str(nature_pref))
            env_pref = memory_preferences.get("environment")
            if env_pref:
                tags_to_check.append(str(env_pref))
            stay_pref = memory_preferences.get("stay_category") or memory_preferences.get("accommodation_preference")
            if stay_pref:
                tags_to_check.append(str(stay_pref))

        if tags_to_check:
            matches = sum(1 for tag in tags_to_check if any(tag.lower() in t for t in place_tags) or tag.lower() in place_category.lower())
            personalization_score = min(1.0, 0.5 + 0.5 * (matches / max(1, len(tags_to_check))))

        # Composite weighted formula
        final_score = (
            interest_score * self.w_interest
            + budget_score * self.w_budget
            + location_score * self.w_location
            + rating_score * self.w_rating
            + time_fit_score * self.w_time_fit
            + group_vote_score * self.w_group_vote
            + personalization_score * self.w_personalization
        )

        return round(final_score, 4)

    def explain_recommendation(
        self,
        place: Any,
        user_interests: List[str],
        user_budget_tier: str,
        memory_preferences: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generates an honest, evidence-backed explanation for why a place or stay was recommended.
        """
        place_name = getattr(place, "name", "This place")
        place_cat = getattr(place, "category", "") or ""
        place_tags = (getattr(place, "tags", "") or "").lower()

        if memory_preferences:
            # Check stay memory
            stay_pref = memory_preferences.get("stay_category") or memory_preferences.get("accommodation_preference")
            if stay_pref and stay_pref.lower() in place_cat.lower():
                return f"Ranked higher because you selected {stay_pref} as your preferred stay type."

            # Check activity memory
            nature_pref = memory_preferences.get("nature_trails") or memory_preferences.get("activity_type")
            if nature_pref and (nature_pref.lower() in place_cat.lower() or nature_pref.lower() in place_tags):
                return f"Suggested because of your confirmed preference for {nature_pref.lower()} experiences."

            # Check pacing / crowd
            crowd_pref = memory_preferences.get("crowd_preference")
            if crowd_pref == "quieter_places" and ("nature" in place_cat.lower() or "viewpoint" in place_tags):
                return "Suggested because you prefer quieter nature spots away from heavy crowds."

        # Interest matches
        matched = [i for i in user_interests if i.lower() in place_cat.lower() or i.lower() in place_tags]
        if matched:
            return f"Curated for your interest in {', '.join(matched)}."

        raw_rating = getattr(place, "rating", None)
        if raw_rating and raw_rating >= 4.5:
            return f"Highly rated destination experience ({raw_rating}★)."

        return "Curated Himalayan destination experience."
