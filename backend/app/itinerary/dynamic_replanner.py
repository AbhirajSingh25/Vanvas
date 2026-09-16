import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.models import Itinerary, ItineraryItem, Place

class DynamicReplanner:
    def replan_day(
        self,
        itinerary: Itinerary,
        action_type: str,
        available_places: List[Place],
        target_item_id: Optional[str] = None,
        current_time_str: Optional[str] = None,
    ) -> Dict[str, Any]:
        items = list(itinerary.items)
        now_time = current_time_str or datetime.now(timezone.utc).strftime("%H:%M")
        
        # Parse current time into minutes
        try:
            h, m = map(int, now_time.split(":"))
            curr_mins = h * 60 + m
        except Exception:
            curr_mins = 14 * 60 # default 2 PM

        message = ""

        if action_type == "late":
            # Shift upcoming items forward, compress or drop least critical
            shifted_mins = curr_mins + 15
            modified_count = 0
            for item in items:
                if item.status == "completed":
                    continue
                
                # Check item start minutes
                try:
                    ih, im = map(int, item.start_time.split(":"))
                    item_start_mins = ih * 60 + im
                except Exception:
                    item_start_mins = shifted_mins

                if item_start_mins < shifted_mins:
                    dur = item.duration_mins or 60
                    # compress duration slightly
                    new_dur = max(40, int(dur * 0.8))
                    item.start_time = f"{shifted_mins // 60:02d}:{shifted_mins % 60:02d}"
                    item.end_time = f"{(shifted_mins + new_dur) // 60:02d}:{(shifted_mins + new_dur) % 60:02d}"
                    item.duration_mins = new_dur
                    shifted_mins += new_dur + (item.travel_time_from_prev_mins or 15)
                    modified_count += 1
            
            message = f"VANVAS adjusted your schedule for being late. Compressed upcoming stops and shifted remaining times smoothly."

        elif action_type == "tired":
            # Remove long treks/intense outdoor items, insert cozy tea/café and early rest
            cozy_cafes = [p for p in available_places if "café" in p.category.lower() or "sunset" in (p.tags or "").lower()]
            for item in items:
                if item.status == "completed":
                    continue
                if any(k in item.title.lower() for k in ["trek", "hike", "waterfall", "climb", "valley trek"]):
                    if cozy_cafes:
                        c = cozy_cafes[0]
                        item.title = f"Relax & Warm Herbal Tea at {c.name}"
                        item.category = "Café"
                        item.place_id = c.id
                        item.duration_mins = 60
                        item.notes = "Take it easy with mountain views, ginger lemon honey tea, and quiet reading."
                        item.reason_for_recommendation = "Low energy recovery stop swapped in for strenuous outdoor trek."
            message = "VANVAS swapped intense outdoor walks with relaxing riverside cafés and a calmer evening."

        elif action_type == "rain":
            # Swap outdoor viewpoints & open-air activities with indoor cafés, monasteries, art houses, local dhabas
            indoor_options = [p for p in available_places if p.is_indoor or p.category.lower() in ["café", "culture", "market", "food"]]
            swapped_count = 0
            for item in items:
                if item.status == "completed":
                    continue
                if not item.is_locked and any(k in item.title.lower() for k in ["peak", "viewpoint", "pass", "trek", "outdoor", "adventure"]):
                    if indoor_options:
                        repl = indoor_options[swapped_count % len(indoor_options)]
                        item.title = f"Indoor Haven: {repl.name}"
                        item.category = repl.category
                        item.place_id = repl.id
                        item.notes = f"Rain-friendly cultural shelter. {repl.description[:100]}..."
                        item.reason_for_recommendation = "Weather-adaptive swap: sheltered, cozy, and vibrant during mountain rain."
                        swapped_count += 1
            message = "Mountain shower detected. Outdoor viewpoints replaced with warm indoor spots, galleries, and covered bazaars."

        elif action_type == "less_money":
            # Swap high cost activities with free scenic walks, viewpoints, and budget dhabas
            budget_places = [p for p in available_places if p.price_level in ["₹", "Free"] or p.approx_cost <= 200]
            for item in items:
                if item.status == "completed":
                    continue
                if (item.estimated_cost or 0) > 400:
                    if budget_places:
                        bp = random.choice(budget_places)
                        item.title = f"Pocket-Friendly: {bp.name}"
                        item.category = bp.category
                        item.place_id = bp.id
                        item.estimated_cost = bp.approx_cost
                        item.reason_for_recommendation = "Cost optimized: High scenic value with near-zero entry cost."
            message = "Budget trimmed. Swapped premium activities with hidden scenic viewpoints and authentic local dhabas."

        elif action_type == "more_adventure":
            # Inject adventure sport or high ridge viewpoint
            adventure_places = [p for p in available_places if "adventure" in p.category.lower() or "nature" in p.category.lower()]
            if adventure_places:
                adv = adventure_places[0]
                for item in items:
                    if item.status != "completed" and not item.is_locked:
                        item.title = f"Adrenaline Stop: {adv.name}"
                        item.category = "Adventure"
                        item.place_id = adv.id
                        item.notes = adv.description
                        item.reason_for_recommendation = "Added high-thrill mountain activity per your request."
                        break
            message = "Added an exhilarating mountain adventure to your day's plan."

        elif action_type == "skip" and target_item_id:
            for item in items:
                if item.id == target_item_id:
                    item.status = "skipped"
                    message = f"Skipped '{item.title}'. Subsequent schedule preserved."
                    break

        return {
            "message": message or "Plan dynamically updated.",
            "itinerary_id": itinerary.id,
            "items_count": len(items)
        }
