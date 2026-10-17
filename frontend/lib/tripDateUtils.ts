/**
 * VANVAS Trip Date & Cadence Utility
 * Timezone-safe date computations for trip planning, day offsets, and status derivation.
 */

export type TripDayStatus = "today" | "upcoming" | "in_progress" | "completed";

export interface TripCadenceInfo {
  status: TripDayStatus;
  badgeLabel: string;
  isToday: boolean;
  dayDateStr: string;      // Formatted date string, e.g. "20 Oct 2026"
  relativeLabel: string;   // e.g. "Today", "Starts in 6 days", "Completed"
  dayDateISO: string;      // "YYYY-MM-DD"
}

/**
 * Normalizes a Date or date string (YYYY-MM-DD) into YYYY-MM-DD without UTC conversion shifts.
 */
export function normalizeDateOnly(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  if (typeof dateInput === "string") {
    // If it's already YYYY-MM-DD or contains T, take the first 10 characters
    const clean = dateInput.trim();
    if (clean.length >= 10 && clean[4] === "-" && clean[7] === "-") {
      return clean.slice(0, 10);
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

/**
 * Returns today's date in local YYYY-MM-DD.
 */
export function getLocalTodayDateString(referenceDate: Date = new Date()): string {
  const yr = referenceDate.getFullYear();
  const mo = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const da = String(referenceDate.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

/**
 * Adds integer days to a YYYY-MM-DD string safely.
 */
export function addDaysToDateString(dateStr: string, daysToAdd: number): string {
  const [yr, mo, da] = dateStr.split("-").map((v) => parseInt(v, 10));
  if (!yr || !mo || !da) return dateStr;
  const d = new Date(yr, mo - 1, da);
  d.setDate(d.getDate() + daysToAdd);
  const nextYr = d.getFullYear();
  const nextMo = String(d.getMonth() + 1).padStart(2, "0");
  const nextDa = String(d.getDate()).padStart(2, "0");
  return `${nextYr}-${nextMo}-${nextDa}`;
}

/**
 * Calculates day difference between two YYYY-MM-DD strings (b - a).
 */
export function diffDays(dateA: string, dateB: string): number {
  const [y1, m1, d1] = dateA.split("-").map((v) => parseInt(v, 10));
  const [y2, m2, d2] = dateB.split("-").map((v) => parseInt(v, 10));
  const utcA = Date.UTC(y1, m1 - 1, d1);
  const utcB = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/**
 * Formats a YYYY-MM-DD string into a concise human-readable date, e.g. "20 Oct".
 */
export function formatReadableDate(dateStr: string, includeYear: boolean = false): string {
  if (!dateStr || dateStr.length < 10) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const yr = parseInt(parts[0], 10);
  const moIdx = parseInt(parts[1], 10) - 1;
  const da = parseInt(parts[2], 10);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mo = months[moIdx] || "";
  return includeYear ? `${da} ${mo} ${yr}` : `${da} ${mo}`;
}

/**
 * Comprehensive cadence evaluator for trip days.
 * Strictly prevents future trips from showing "TODAY".
 */
export function evaluateTripDayCadence(
  startDateStr?: string | null,
  endDateStr?: string | null,
  dayNumber: number = 1,
  todayOverride?: string
): TripCadenceInfo {
  const start = normalizeDateOnly(startDateStr);
  const end = normalizeDateOnly(endDateStr) || start;
  const today = todayOverride ? normalizeDateOnly(todayOverride) : getLocalTodayDateString();

  if (!start) {
    return {
      status: "upcoming",
      badgeLabel: `DAY ${String(dayNumber).padStart(2, "0")}`,
      isToday: false,
      dayDateStr: "",
      relativeLabel: "Planned",
      dayDateISO: "",
    };
  }

  // Target date for this specific day number (Day 1 is start + 0 days)
  const targetDayDate = addDaysToDateString(start, Math.max(0, dayNumber - 1));
  const dayDateFormatted = formatReadableDate(targetDayDate);
  const daysUntilStart = diffDays(today, start);
  const daysUntilTarget = diffDays(today, targetDayDate);
  const isTripInPast = diffDays(today, end) < 0;

  // Case 1: Trip has ended
  if (isTripInPast) {
    return {
      status: "completed",
      badgeLabel: "COMPLETED",
      isToday: false,
      dayDateStr: dayDateFormatted,
      relativeLabel: "Completed",
      dayDateISO: targetDayDate,
    };
  }

  // Case 2: Target day is strictly TODAY
  if (targetDayDate === today) {
    return {
      status: "today",
      badgeLabel: "TODAY",
      isToday: true,
      dayDateStr: dayDateFormatted,
      relativeLabel: "Today",
      dayDateISO: targetDayDate,
    };
  }

  // Case 3: Target day is in the FUTURE
  if (daysUntilTarget > 0) {
    let relLabel = "";
    let badge = "UPCOMING";

    if (daysUntilStart > 0) {
      // Entire trip starts in the future
      relLabel = daysUntilStart === 1 ? "Starts tomorrow" : `Starts in ${daysUntilStart} days`;
      badge = `UPCOMING · ${dayDateFormatted}`;
    } else {
      // Trip is in progress, but this specific day is upcoming
      relLabel = daysUntilTarget === 1 ? "Tomorrow" : `In ${daysUntilTarget} days`;
      badge = `DAY ${String(dayNumber).padStart(2, "0")} · ${dayDateFormatted}`;
    }

    return {
      status: "upcoming",
      badgeLabel: badge,
      isToday: false,
      dayDateStr: dayDateFormatted,
      relativeLabel: relLabel,
      dayDateISO: targetDayDate,
    };
  }

  // Case 4: Target day is in the past, but trip as a whole is still ongoing
  return {
    status: "completed",
    badgeLabel: `DAY ${String(dayNumber).padStart(2, "0")} · COMPLETED`,
    isToday: false,
    dayDateStr: dayDateFormatted,
    relativeLabel: "Completed",
    dayDateISO: targetDayDate,
  };
}
