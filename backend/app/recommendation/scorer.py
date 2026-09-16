import math
from typing import List, Dict, Any, Optional
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

        # 7. Personalization score (0.0 to 1.0)
        personalization_score = 0.7
        if user_preference_tags:
            matches = sum(1 for tag in user_preference_tags if any(tag.lower() in t for t in place_tags))
            personalization_score = min(1.0, 0.5 + 0.5 * (matches / max(1, len(user_preference_tags))))

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
