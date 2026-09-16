from typing import List, Dict, Any, Optional
from datetime import date
from app.models.models import TransportOption, Hotel

class ArrivalOptimizer:
    def optimize_arrival(
        self,
        destination_name: str,
        transport_options: List[TransportOption],
        hotel: Optional[Hotel] = None
    ) -> Dict[str, Any]:
        if not transport_options:
            return {
                "destination_name": destination_name,
                "best_option": None,
                "alternative_options": [],
                "traveller_tip": "No transport options found for this route."
            }

        hotel_checkin_str = hotel.check_in_time if hotel else "11:00 AM"
        
        recommendations = []
        for t in transport_options:
            # Parse arrival time
            arr_parts = t.arrival_time.split(":")
            arr_hour = int(arr_parts[0]) if len(arr_parts) > 0 else 8
            arr_min = int(arr_parts[1]) if len(arr_parts) > 1 else 0

            # Evaluate suitability
            # Best arrival is 07:30 to 09:30 AM: enough time for breakfast, luggage drop, and check-in without waiting 6 hours
            if 7 <= arr_hour <= 9:
                score = 0.95
                verdict = "Optimal Arrival: Arrive with mountain sunrise, enjoy breakfast, drop bags, and start exploring right as hotel check-in opens."
                bf_window = "08:30 AM - 09:30 AM"
                luggage_plan = "09:45 AM - Drop heavy rucksacks at hotel front desk."
                first_activity = "10:15 AM - Riverside Old Village walk."
            elif 10 <= arr_hour <= 12:
                score = 0.88
                verdict = "Direct Check-In Fit: Arrive just in time to check straight into your room and freshen up before lunch."
                bf_window = "En-route or early brunch on arrival (11:15 AM)"
                luggage_plan = "11:30 AM - Direct check-in to room."
                first_activity = "12:30 PM - Head out for valley exploration."
            elif arr_hour < 7:
                score = 0.75
                verdict = "Early Bird: Early morning arrival. Recommended to warm up with tea at 24/7 highway dhabas until luggage storage opens."
                bf_window = "06:30 AM - 07:30 AM Early Chai & Parathas"
                luggage_plan = "08:00 AM - Early baggage drop."
                first_activity = "08:30 AM - Morning pine forest trail."
            else:
                score = 0.70
                verdict = "Late Arrival: Leaves less daylight for daytime activities, but great if you prefer starting with dinner."
                bf_window = "Completed prior to arrival"
                luggage_plan = "Immediate evening check-in"
                first_activity = "Evening market & dinner"

            recommendations.append({
                "transport_option": t,
                "expected_arrival": t.arrival_time,
                "hotel_check_in_time": hotel_checkin_str,
                "breakfast_window": bf_window,
                "luggage_drop_plan": luggage_plan,
                "first_activity_time": first_activity,
                "overall_verdict": verdict,
                "recommendation_score": score
            })

        # Sort by recommendation score descending
        recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
        best = recommendations[0]
        alts = recommendations[1:]

        tip = f"VANVAS recommends taking the {best['transport_option'].operator_name} departing at {best['transport_option'].departure_time}. Arriving at {best['expected_arrival']} gives you a comfortable morning window to stretch, eat, and store luggage before {hotel_checkin_str}."

        return {
            "destination_name": destination_name,
            "best_option": best,
            "alternative_options": alts,
            "traveller_tip": tip
        }
