/**
 * VANVAS Itinerary Normalization & Presentation Layer
 * 
 * Transforms raw / AI-generated travel plans into concise, scannable,
 * field-guide structured data stops (Time -> Place -> Short Purpose).
 * 
 * Preserves full rich context for progressive disclosure (Expand -> Why, Getting there, Cost, Notes).
 */

import { ItineraryItem } from "@/types";

export interface NormalizedStop {
  id: string;
  time: string;
  endTime?: string;
  durationMins: number;
  placeName: string;
  shortPurpose: string;
  category: string;
  costFormatted: string;
  estimatedCost: number;
  distanceFormatted: string;
  distanceKm: number;
  transitFormatted?: string;
  travelTimeMins: number;
  isCompleted: boolean;
  isLocked: boolean;
  // Progressive disclosure fields
  whyThisStop?: string;
  gettingThere?: string;
  notes?: string;
  bookingUrl?: string;
  mapLat?: number;
  mapLng?: number;
}

/**
 * Extracts a concise, scannable 2-6 word purpose line from potentially verbose AI prose.
 */
export function extractShortPurpose(
  title: string,
  category: string,
  notes?: string | null,
  reason?: string | null
): string {
  // 1. If reason is already a concise phrase (< 45 chars), use it directly
  if (reason && reason.trim().length > 0 && reason.trim().length <= 45 && !isAiFluff(reason)) {
    return cleanSentence(reason);
  }

  // 2. Try to extract concise essence from notes if present
  if (notes && notes.trim().length > 0) {
    const cleaned = cleanAiFluff(notes);
    // Grab the first clause or short sentence
    const firstClause = cleaned.split(/[.;!—\n]/)[0].trim();
    if (firstClause.length > 0 && firstClause.length <= 48) {
      return firstClause;
    }
  }

  // 3. Fallback based on category and title keywords
  const cat = (category || "").toLowerCase();
  const t = title.toLowerCase();

  if (t.includes("arrival") || t.includes("bus stand") || t.includes("airport") || t.includes("station")) {
    return "Arrival & bag drop";
  }
  if (t.includes("lunch") || t.includes("dinner") || t.includes("breakfast") || cat.includes("food") || cat.includes("dining") || cat.includes("dhaba")) {
    if (t.includes("siddu") || t.includes("kachori") || t.includes("thali")) return "Authentic local food";
    return "Local food & relaxed meal";
  }
  if (cat.includes("caf") || t.includes("caf") || t.includes("coffee") || t.includes("bakery")) {
    return "Cafés + slow streets";
  }
  if (t.includes("temple") || t.includes("shrine") || t.includes("ghat") || t.includes("monastery") || cat.includes("culture") || cat.includes("spiritual") || cat.includes("temple")) {
    if (t.includes("hidimba") || t.includes("hadimba")) return "Ancient forest shrine";
    if (t.includes("ghat") || t.includes("aarti")) return "Riverside bells & evening aarti";
    if (t.includes("monastery") || t.includes("gompa")) return "Peaceful monastery & prayer flags";
    return "Heritage & forest shrine";
  }
  if (t.includes("waterfall") || t.includes("jogini") || t.includes("trail") || t.includes("ridge") || cat.includes("nature") || cat.includes("adventure")) {
    if (t.includes("waterfall")) return "Pine trail to waterfall";
    if (t.includes("walk") || t.includes("stroll")) return "Easy riverside walk";
    return "Scenic mountain viewpoint";
  }
  if (t.includes("sunset") || t.includes("viewpoint")) {
    return "Golden hour sunset viewpoint";
  }
  if (t.includes("market") || t.includes("bazaar") || cat.includes("shop")) {
    return "Artisan lanes & local shopping";
  }

  return "Exploration & local atmosphere";
}

function isAiFluff(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.startsWith("start your day") ||
    lower.startsWith("after enjoying") ||
    lower.startsWith("since you have") ||
    lower.startsWith("make your way") ||
    lower.startsWith("head over to") ||
    lower.startsWith("take your time") ||
    lower.startsWith("you will love") ||
    lower.startsWith("this is a great")
  );
}

function cleanAiFluff(text: string): string {
  let res = text.trim();
  const fluffPrefixes = [
    /^start your day by heading (over )?to\s+/i,
    /^start by visiting\s+/i,
    /^head over to\s+/i,
    /^make your way (over )?to(ward)?\s+/i,
    /^after enjoying the [^,]+,\s*/i,
    /^after (a )?short [^,]+,\s*/i,
    /^since you have [^,]+,\s*/i,
    /^take your time (exploring|enjoying)\s+/i,
    /^next,?\s+(head to|visit|explore)\s+/i,
    /^spend the afternoon at\s+/i,
  ];

  for (const prefix of fluffPrefixes) {
    res = res.replace(prefix, "");
  }

  // Capitalize first letter
  if (res.length > 0) {
    res = res.charAt(0).toUpperCase() + res.slice(1);
  }
  return res;
}

function cleanSentence(text: string): string {
  let cleaned = text.trim().replace(/^★\s*/, "").replace(/[.]+$/, "");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Normalizes an ItineraryItem into a clean, structured NormalizedStop.
 */
export function normalizeItineraryItem(item: ItineraryItem): NormalizedStop {
  const shortPurpose = extractShortPurpose(
    item.title,
    item.category,
    item.notes,
    item.reason_for_recommendation
  );

  const costFormatted =
    item.estimated_cost && item.estimated_cost > 0
      ? `₹${item.estimated_cost.toLocaleString()}`
      : "Free / Included";

  const distanceFormatted =
    item.distance_from_prev_km && item.distance_from_prev_km > 0
      ? `${item.distance_from_prev_km} km`
      : "Nearby";

  const transitFormatted =
    item.travel_time_from_prev_mins && item.travel_time_from_prev_mins > 0
      ? `${item.travel_time_from_prev_mins} min transit`
      : undefined;

  return {
    id: item.id,
    time: item.start_time,
    endTime: item.end_time,
    durationMins: item.duration_mins,
    placeName: item.title,
    shortPurpose,
    category: item.category || "Stop",
    costFormatted,
    estimatedCost: item.estimated_cost || 0,
    distanceFormatted,
    distanceKm: item.distance_from_prev_km || 0,
    transitFormatted,
    travelTimeMins: item.travel_time_from_prev_mins || 0,
    isCompleted: item.status === "completed",
    isLocked: !!item.is_locked,
    whyThisStop: item.reason_for_recommendation || undefined,
    gettingThere: transitFormatted
      ? `${transitFormatted} (${distanceFormatted} from previous stop)`
      : undefined,
    notes: item.notes || undefined,
    bookingUrl: item.booking_url || undefined,
    mapLat: item.map_lat || undefined,
    mapLng: item.map_lng || undefined,
  };
}
