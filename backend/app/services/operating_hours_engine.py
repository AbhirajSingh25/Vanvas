"""
VANVAS Operating Hours Engine
Provider-neutral, timezone-aware parsing and evaluation of opening hours.

Strict Truthfulness Rules:
1. If hours are missing or unparseable:
   hours_available = False
   is_open_now = None (STRICTLY None, never False or True)
2. If hours are provided:
   hours_available = True
   is_open_now = True (if current time is within open intervals) or False (if outside)
3. Timezone handling:
   Uses destination coordinates / explicit timezone (defaulting to Asia/Kolkata for India)
   Never uses the server's OS timezone blindly.
4. Supports standard OSM opening_hours syntax:
   - "24/7"
   - "Mo-Su 08:00-20:00"
   - "Mo-Fr 09:00-18:00; Sa 10:00-16:00; Su off"
   - "Tu-Su 10:00-22:00"
   - "08:00 AM - 08:00 PM"
   - "09:00 - 22:00"
   - Overnight spans e.g. "18:00-02:00"
   - Multiple daily intervals e.g. "09:00-14:00, 17:00-22:00"
"""

import re
import logging
from datetime import datetime, time as dt_time, timedelta, timezone
from typing import Dict, Any, Optional, List, Tuple

try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

logger = logging.getLogger("vanvas.services.operating_hours")

INDIA_TZ = ZoneInfo("Asia/Kolkata")

# Standard day abbreviations mapped to Python weekday() (0 = Monday, 6 = Sunday)
DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
DAY_INDEX_MAP = {
    "mo": 0, "mon": 0, "monday": 0,
    "tu": 1, "tue": 1, "tuesday": 1,
    "we": 2, "wed": 2, "wednesday": 2,
    "th": 3, "thu": 3, "thursday": 3,
    "fr": 4, "fri": 4, "friday": 4,
    "sa": 5, "sat": 5, "saturday": 5,
    "su": 6, "sun": 6, "sunday": 6,
}


class OperatingHoursResult:
    def __init__(
        self,
        hours_available: bool,
        is_open_now: Optional[bool],
        opening_time: Optional[str] = None,
        closing_time: Optional[str] = None,
        status_label: str = "STATUS UNAVAILABLE",
        raw_hours: Optional[str] = None,
    ):
        self.hours_available = hours_available
        self.is_open_now = is_open_now
        self.opening_time = opening_time
        self.closing_time = closing_time
        self.status_label = status_label
        self.raw_hours = raw_hours

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hours_available": self.hours_available,
            "is_open_now": self.is_open_now,
            "opening_time": self.opening_time,
            "closing_time": self.closing_time,
            "status_label": self.status_label,
            "raw_hours": self.raw_hours,
        }


class OperatingHoursEngine:
    """Evaluates opening hours against destination local time with zero guesswork."""

    @staticmethod
    def get_destination_timezone(lat: Optional[float] = None, lng: Optional[float] = None) -> ZoneInfo:
        """
        Resolves the appropriate timezone for coordinates.
        For Indian subcontinent coordinates (Lat 6-38, Lng 68-98), returns Asia/Kolkata.
        """
        if lat is not None and lng is not None:
            if 6.0 <= lat <= 38.0 and 68.0 <= lng <= 98.0:
                return INDIA_TZ
        return INDIA_TZ

    @classmethod
    def parse_time_str(cls, time_str: str) -> Optional[Tuple[int, int]]:
        """Parses time strings like '08:00', '8:00', '8:00 AM', '10:30 PM' into (hour, minute)."""
        if not time_str or not isinstance(time_str, str):
            return None

        clean = time_str.strip().upper()
        # 12-hour format e.g. 08:00 AM, 8 PM
        m_12 = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(AM|PM)", clean)
        if m_12:
            hour = int(m_12.group(1))
            minute = int(m_12.group(2) or 0)
            ampm = m_12.group(3)
            if ampm == "PM" and hour < 12:
                hour += 12
            elif ampm == "AM" and hour == 12:
                hour = 0
            return (hour, minute)

        # 24-hour format e.g. 08:00, 20:30
        m_24 = re.search(r"(\d{1,2}):(\d{2})", clean)
        if m_24:
            hour = int(m_24.group(1))
            minute = int(m_24.group(2))
            if 0 <= hour <= 24 and 0 <= minute < 60:
                return (hour % 24, minute)

        return None

    @classmethod
    def _parse_day_range(cls, day_str: str) -> List[int]:
        """Parses day specifications like 'Mo-Su', 'Mo-Fr', 'Sa,Su', 'Tu-Sa', 'Mo' into a list of weekday ints."""
        clean = day_str.strip().lower()
        if "-" in clean:
            parts = clean.split("-")
            start_name = parts[0].strip()
            end_name = parts[1].strip()
            start_idx = DAY_INDEX_MAP.get(start_name)
            end_idx = DAY_INDEX_MAP.get(end_name)
            if start_idx is not None and end_idx is not None:
                if start_idx <= end_idx:
                    return list(range(start_idx, end_idx + 1))
                else:
                    return list(range(start_idx, 7)) + list(range(0, end_idx + 1))

        if "," in clean:
            days = []
            for p in clean.split(","):
                idx = DAY_INDEX_MAP.get(p.strip())
                if idx is not None:
                    days.append(idx)
            return days

        single = DAY_INDEX_MAP.get(clean)
        if single is not None:
            return [single]

        # Default: all days if days not specified
        return list(range(7))

    @classmethod
    def evaluate_osm_hours(
        cls,
        raw_hours: Optional[str],
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        now_dt: Optional[datetime] = None,
    ) -> OperatingHoursResult:
        """
        Parses OpenStreetMap opening_hours string and computes is_open_now for the given coordinates and current time.
        """
        if not raw_hours or not isinstance(raw_hours, str) or raw_hours.strip().lower() in ["", "none", "unknown", "hours not listed", "null"]:
            return OperatingHoursResult(
                hours_available=False,
                is_open_now=None,
                status_label="HOURS NOT LISTED",
                raw_hours=None,
            )

        clean = raw_hours.strip()
        tz = cls.get_destination_timezone(lat, lng)
        local_now = now_dt.astimezone(tz) if now_dt else datetime.now(tz)
        current_weekday = local_now.weekday()  # 0 = Monday, 6 = Sunday
        current_time_minutes = local_now.hour * 60 + local_now.minute

        # Case 1: 24/7
        if clean.lower() in ["24/7", "24 / 7", "24 hours", "open 24 hours", "24/7 desk"]:
            return OperatingHoursResult(
                hours_available=True,
                is_open_now=True,
                opening_time="00:00",
                closing_time="24:00",
                status_label="OPEN NOW",
                raw_hours=clean,
            )

        # Case 2: Explicit 'off' or 'closed'
        if clean.lower() in ["off", "closed"]:
            return OperatingHoursResult(
                hours_available=True,
                is_open_now=False,
                status_label="CLOSED NOW",
                raw_hours=clean,
            )

        # Parse rules separated by semicolons
        rules = [r.strip() for r in clean.split(";") if r.strip()]
        is_open = False
        parsed_any_rule = False
        first_op_time = None
        first_cl_time = None

        for rule in rules:
            rule_lower = rule.lower()
            
            # Check if rule is an "off" rule for a day range e.g. "Su off"
            if "off" in rule_lower or "closed" in rule_lower:
                day_part = rule_lower.replace("off", "").replace("closed", "").strip()
                applicable_days = cls._parse_day_range(day_part) if day_part else list(range(7))
                if current_weekday in applicable_days:
                    # Closed today
                    parsed_any_rule = True
                    is_open = False
                continue

            # Extract day portion vs time portion
            # Example: "Mo-Su 08:00-20:00" or "08:00-20:00" or "Mo-Fr 09:00-18:00"
            m_rule = re.search(r"^([A-Za-z,\s\-]+)?\s*(\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?\s*-\s*\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?(?:\s*,\s*\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?\s*-\s*\d{1,2}:?\d{0,2}\s*(?:AM|PM|am|pm)?)*)", rule)
            
            if m_rule:
                day_part = (m_rule.group(1) or "").strip()
                time_intervals_part = (m_rule.group(2) or "").strip()
                applicable_days = cls._parse_day_range(day_part) if day_part else list(range(7))

                # Parse multiple time spans separated by commas
                for span in time_intervals_part.split(","):
                    span = span.strip()
                    if "-" not in span:
                        continue
                    t_parts = span.split("-")
                    start_parsed = cls.parse_time_str(t_parts[0])
                    end_parsed = cls.parse_time_str(t_parts[1])

                    if start_parsed and end_parsed:
                        parsed_any_rule = True
                        s_h, s_m = start_parsed
                        e_h, e_m = end_parsed
                        s_total = s_h * 60 + s_m
                        e_total = e_h * 60 + e_m

                        if not first_op_time:
                            first_op_time = f"{s_h:02d}:{s_m:02d}"
                        if not first_cl_time:
                            first_cl_time = f"{e_h:02d}:{e_m:02d}"

                        if current_weekday in applicable_days:
                            if s_total <= e_total:
                                # Normal intra-day schedule (e.g. 08:00 to 20:00)
                                if s_total <= current_time_minutes < e_total:
                                    is_open = True
                            else:
                                # Overnight schedule (e.g. 18:00 to 02:00)
                                if current_time_minutes >= s_total or current_time_minutes < e_total:
                                    is_open = True

        if not parsed_any_rule:
            # Simple fallback check for "HH:MM - HH:MM" or "HH:MM AM - HH:MM PM"
            if "-" in clean:
                parts = clean.split("-")
                start_p = cls.parse_time_str(parts[0])
                end_p = cls.parse_time_str(parts[1])
                if start_p and end_p:
                    s_h, s_m = start_p
                    e_h, e_m = end_p
                    s_total = s_h * 60 + s_m
                    e_total = e_h * 60 + e_m
                    first_op_time = f"{s_h:02d}:{s_m:02d}"
                    first_cl_time = f"{e_h:02d}:{e_m:02d}"
                    if s_total <= e_total:
                        is_open = s_total <= current_time_minutes < e_total
                    else:
                        is_open = current_time_minutes >= s_total or current_time_minutes < e_total
                    parsed_any_rule = True

        if not parsed_any_rule:
            return OperatingHoursResult(
                hours_available=False,
                is_open_now=None,
                status_label="HOURS NOT LISTED",
                raw_hours=clean,
            )

        return OperatingHoursResult(
            hours_available=True,
            is_open_now=is_open,
            opening_time=first_op_time,
            closing_time=first_cl_time,
            status_label="OPEN NOW" if is_open else "CLOSED NOW",
            raw_hours=clean,
        )

    @classmethod
    def evaluate_simple_hours(
        cls,
        opening_time: Optional[str],
        closing_time: Optional[str],
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        now_dt: Optional[datetime] = None,
    ) -> OperatingHoursResult:
        """
        Evaluates simple opening_time and closing_time string pairs (e.g. curated places).
        """
        if not opening_time or not closing_time:
            return OperatingHoursResult(
                hours_available=False,
                is_open_now=None,
                opening_time=opening_time,
                closing_time=closing_time,
                status_label="HOURS NOT LISTED",
            )

        combined_str = f"{opening_time} - {closing_time}"
        return cls.evaluate_osm_hours(combined_str, lat, lng, now_dt)
