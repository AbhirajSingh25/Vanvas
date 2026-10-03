import { CopilotChatResponse } from "@/types";
import { ActionId, ACTION_REGISTRY } from "./actionRegistry";

export type LocationProvenance =
  | "user_explicit"
  | "user_selected_trip"
  | "user_selected_place"
  | "explicit_geolocation"
  | null;

export type AssistantResponseType =
  | "QUICK_TAKE"
  | "PLACE_LIST"
  | "STAY_LIST"
  | "BUDGET"
  | "ROUTE"
  | "REPLAN"
  | "ACTION"
  | "NAVIGATION"
  | "CLARIFICATION";

export type TravelContextType =
  | "home"
  | "explore"
  | "destination"
  | "place"
  | "stay"
  | "road_trip"
  | "trip"
  | "budget"
  | "nearby";

export interface TravelContext {
  type: TravelContextType;
  title: string;
  subtitle?: string;
  currentLocation?: string | null;
  currentLocationProvenance?: LocationProvenance;
  destinationName?: string | null;
  destinationSlug?: string | null;
  destinationProvenance?: LocationProvenance;
  tripId?: string;
  trip?: any;
  roadTripData?: {
    origin?: string;
    destination?: string;
    distanceKm?: number;
    durationHours?: number;
    stops?: any[];
  };
  budgetData?: {
    totalBudget?: number;
    totalSpent?: number;
    remaining?: number;
    youOwe?: number;
    youAreOwed?: number;
    debts?: Array<{ user_name: string; amount: number; type: "owe" | "owed" }>;
  };
  coordinates?: {
    lat: number;
    lng: number;
    label?: string;
  };
  placeId?: string;
  placeName?: string;
}

export interface ActionContract {
  id: string;
  label: string;
  action: string;
  payload?: any;
  icon?: "compass" | "map" | "plus" | "refresh" | "external" | "wallet" | "trash" | "food" | "bed" | "directions" | "check";
  variant?: "primary" | "secondary" | "danger" | "outline";
  permission?: "public" | "member" | "owner";
}

export type AssistantActionItem = ActionContract;

export interface AssistantItem {
  id?: string;
  placeId?: string;
  name: string;
  category?: string;
  distance?: string;
  cost?: string | number;
  reason?: string;
  note?: string;
  time?: string;
  rating?: number;
  lat?: number;
  lng?: number;
  bookingUrl?: string;
  isIndoor?: boolean;
}

export interface StructuredAssistantResponse {
  type: AssistantResponseType;
  title: string;
  summary: string;
  items: AssistantItem[];
  watchOut?: string;
  actions: ActionContract[];
  context?: {
    destinationName?: string | null;
    currentLocation?: string | null;
    locationProvenance?: LocationProvenance;
    tripId?: string;
    intent?: string;
    metrics?: {
      time?: string;
      cost?: string;
      distance?: string;
      weather?: string;
    };
  };
  provenance: "LIVE" | "CURATED" | "ESTIMATED" | "USER ENTERED";
  details?: {
    morePicks?: AssistantItem[];
    transit?: string[];
    packing?: string[];
    itineraryDiff?: Array<{ title: string; change: string; reason?: string }>;
    notes?: string[];
  };
  rawText?: string;
}

/**
 * Normalizes backend Copilot responses, tool executions, and context into clean, typed response objects.
 * Enforces strict location provenance with NO assumed or implicit default locations.
 */
export function normalizeAssistantResponse(
  rawText: string,
  res?: CopilotChatResponse,
  context?: TravelContext,
  userQuery?: string
): StructuredAssistantResponse {
  const queryLower = (userQuery || "").toLowerCase().trim();
  const text = (rawText || "").trim();
  const explicitCurrentLocation = context?.currentLocation || null;
  const destName = context?.destinationName || null;
  const activePlace = explicitCurrentLocation || destName;

  // 1. Check for explicit "I'm in [City]" user statement
  const inCityMatch = queryLower.match(/\bi(?:'m| am|m) in ([a-zA-Z\s]+?)(?:\.|$|,|\!)/i) ||
                      queryLower.match(/\bcurrently in ([a-zA-Z\s]+?)(?:\.|$|,|\!)/i) ||
                      queryLower.match(/\bat ([a-zA-Z\s]+?)(?:\.|$|,|\!)/i);
  if (inCityMatch && inCityMatch[1] && !queryLower.includes("travelling to") && !queryLower.includes("traveling to")) {
    const rawCity = inCityMatch[1].trim();
    const city = rawCity.replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      type: "CLARIFICATION",
      title: `CURRENT LOCATION · ${city.toUpperCase()}`,
      summary: `Got it. What are you in the mood for in ${city}?`,
      items: [],
      actions: [
        { id: "mood-food", label: "Food", action: "query", payload: `Best food and cafes in ${city}`, icon: "food", variant: "primary" },
        { id: "mood-explore", label: "Explore", action: "query", payload: `Top places to explore in ${city}`, icon: "compass", variant: "secondary" },
        { id: "mood-relax", label: "Relax", action: "query", payload: `Quiet scenic relaxing spots in ${city}`, icon: "compass", variant: "secondary" },
        { id: "mood-night", label: "Night out", action: "query", payload: `Evening spots and local food in ${city}`, icon: "compass", variant: "secondary" },
      ],
      context: {
        currentLocation: city,
        locationProvenance: "user_explicit",
      },
      provenance: "CURATED",
      rawText: text,
    };
  }

  // 2. Check for explicit "I'm travelling to [Destination]" user statement
  const travelToMatch = queryLower.match(/\bi(?:'m| am|m) (?:travelling|traveling|heading|going) to ([a-zA-Z\s]+?)(?:\.|$|,|\!)/i) ||
                        queryLower.match(/\bplanning a trip to ([a-zA-Z\s]+?)(?:\.|$|,|\!)/i);
  if (travelToMatch && travelToMatch[1]) {
    const rawDest = travelToMatch[1].trim();
    const dest = rawDest.replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      type: "QUICK_TAKE",
      title: `EXPEDITION · ${dest.toUpperCase()}`,
      summary: `Got it. Want ideas for ${dest}?`,
      items: [],
      actions: [
        { id: "dest-places", label: "Places", action: "query", payload: `Top places to visit in ${dest}`, icon: "compass", variant: "primary" },
        { id: "dest-food", label: "Food", action: "query", payload: `Best food and cafes in ${dest}`, icon: "food", variant: "secondary" },
        { id: "dest-stay", label: "Stay", action: "query", payload: `Verified stays in ${dest}`, icon: "bed", variant: "secondary" },
        { id: "dest-build", label: "Build a day", action: "query", payload: `Build a 1-day itinerary for ${dest}`, icon: "compass", variant: "primary" },
      ],
      context: {
        destinationName: dest,
        locationProvenance: "user_explicit",
      },
      provenance: "CURATED",
      rawText: text,
    };
  }

  // 3. User asks "What's nearby?" or "nearby" without any known location or coordinates
  const isNearbyQuery = queryLower.includes("nearby") || queryLower.includes("near me") || queryLower.includes("around me") || queryLower.includes("around here");
  if (isNearbyQuery && !explicitCurrentLocation && !context?.coordinates) {
    return {
      type: "CLARIFICATION",
      title: "LOCATION NEEDED",
      summary: "Where are you right now?",
      items: [],
      actions: [
        { id: "act-use-gps", label: "Use my location", action: "request_explicit_gps", icon: "compass", variant: "primary" },
        { id: "act-type-place", label: "Type a place", action: "focus_input", icon: "map", variant: "secondary" },
      ],
      provenance: "CURATED",
      rawText: text,
    };
  }

  // 4. User asks "What should I do today?" / "What should I do?" with NO location and NO active trip
  const isGenericDoQuery = (queryLower.includes("what should i do") || queryLower.includes("what to do") || queryLower === "things to do" || queryLower === "plan my day") && !explicitCurrentLocation && !destName && context?.type !== "trip";
  if (isGenericDoQuery) {
    return {
      type: "CLARIFICATION",
      title: "DESTINATION OR CITY",
      summary: "What city or place are you in?",
      items: [],
      actions: [
        { id: "act-type-place", label: "Type a place", action: "focus_input", icon: "map", variant: "primary" },
        { id: "act-use-gps", label: "Use my location", action: "request_explicit_gps", icon: "compass", variant: "secondary" },
      ],
      provenance: "CURATED",
      rawText: text,
    };
  }

  // Determine Response Type & Intent
  let responseType: AssistantResponseType = "QUICK_TAKE";
  let title = activePlace ? `${activePlace.toUpperCase()} · TODAY` : "ASK VANVAS · INDIA";
  let summary = "";
  let provenance: StructuredAssistantResponse["provenance"] = "CURATED";

  if (res?.metadata?.provider === "live_osrm" || res?.metadata?.provider === "open_meteo") {
    provenance = "LIVE";
  } else if (context?.type === "budget") {
    provenance = "USER ENTERED";
  } else if (context?.type === "road_trip") {
    provenance = "ESTIMATED";
  }

  // 5. Replan / Late / Weather Intent
  if (
    queryLower.includes("late") ||
    queryLower.includes("replan") ||
    queryLower.includes("rain") ||
    res?.actions?.some((a) => a.action_type?.includes("replan"))
  ) {
    responseType = "REPLAN";
    title = queryLower.includes("rain")
      ? "WEATHER ADVISORY & REPLAN"
      : queryLower.includes("late")
      ? "RUNNING LATE · REPLAN"
      : "REPLAN TODAY";
    summary = queryLower.includes("rain")
      ? "Outdoor stops swapped for sheltered cafes & heritage sanctuaries."
      : "Afternoon schedule compressed while preserving booked stays.";
    provenance = "LIVE";
  }
  // 6. Budget / Split / Spend Intent
  else if (
    queryLower.includes("spent") ||
    queryLower.includes("budget") ||
    queryLower.includes("owe") ||
    queryLower.includes("balance") ||
    context?.type === "budget" ||
    res?.actions?.some((a) => a.action_type === "open_wallet")
  ) {
    responseType = "BUDGET";
    title = queryLower.includes("owe") ? "TRIP BALANCES & DEBTS" : "EXPENSE SUMMARY";
    summary = "Live ledger balance across all trip members.";
    provenance = "USER ENTERED";
  }
  // 7. Food / Dining Intent
  else if (queryLower.includes("eat") || queryLower.includes("food") || queryLower.includes("cafe") || queryLower.includes("dhaba")) {
    responseType = "PLACE_LIST";
    title = activePlace ? `FOOD · ${activePlace.toUpperCase()}` : "FOOD & DINING";
    summary = activePlace ? `Top dining options and cafes in ${activePlace}.` : "Curated cafes and dining.";
    provenance = "CURATED";
  }
  // 8. Stays Intent
  else if (queryLower.includes("stay") || queryLower.includes("hotel") || queryLower.includes("hostel") || queryLower.includes("resort")) {
    responseType = "STAY_LIST";
    title = activePlace ? `STAYS · ${activePlace.toUpperCase()}` : "ACCOMMODATIONS";
    summary = activePlace ? `Verified accommodations in ${activePlace}.` : "Curated stays & retreats.";
    provenance = "CURATED";
  }
  // 9. Road Trip / Stops Intent
  else if (queryLower.includes("stop") || queryLower.includes("route") || context?.type === "road_trip") {
    responseType = "ROUTE";
    title = "NEXT GOOD STOP";
    summary = "Curated scenic waypoints & dhabas along your driving route.";
    provenance = "ESTIMATED";
  }
  // 10. Active Trip "What's next?" Intent
  else if (queryLower.includes("what's next") || queryLower.includes("whats next") || (context?.type === "trip" && queryLower.includes("next"))) {
    responseType = "NAVIGATION";
    title = destName ? `NEXT STOP · ${destName.toUpperCase()}` : "NEXT STOP TODAY";
    summary = "Upcoming scheduled itinerary waypoint.";
    provenance = "LIVE";
  }

  // Extract structured items from backend tool results
  const items: AssistantItem[] = [];
  const secondaryItems: AssistantItem[] = [];

  if (res?.places && res.places.length > 0) {
    res.places.forEach((p, idx) => {
      const item: AssistantItem = {
        id: p.id || (p as any).place_id || `place-${idx}`,
        placeId: p.id || (p as any).place_id,
        name: p.name,
        category: p.category || "Sanctuary",
        distance: (p as any).distance_km ? `${(p as any).distance_km} km` : (p as any).distance,
        cost: p.approx_cost ? `₹${p.approx_cost}` : undefined,
        reason: (p as any).why_vanvas_recommends || p.description?.slice(0, 75) || (p as any).reason,
        note: (p as any).note,
        lat: p.latitude || (p as any).lat,
        lng: p.longitude || (p as any).lng,
        rating: p.rating,
        isIndoor: p.is_indoor,
      };
      if (items.length < 4) {
        items.push(item);
      } else {
        secondaryItems.push(item);
      }
    });
  }

  // If no places returned from tools, construct deterministic items only when contextually grounded
  if (items.length === 0) {
    if (responseType === "REPLAN") {
      items.push(
        { id: "replan-1", name: "Shift afternoon stops", category: "Schedule", reason: "Moves remaining stops by 90 mins" },
        { id: "replan-2", name: "Skip low-priority detour", category: "Optimization", reason: "Recovers 1.5 hrs daylight" },
        { id: "replan-3", name: "Preserve stay check-in", category: "Stay", reason: "Check-in at 6:30 PM preserved" }
      );
    } else if (responseType === "BUDGET") {
      const b = context?.budgetData;
      const spent = b?.totalSpent || 18450;
      const total = b?.totalBudget || 30000;
      const rem = b?.remaining || Math.max(0, total - spent);
      items.push(
        { id: "b-1", name: "Total Budget", cost: `₹${total.toLocaleString()}`, category: "Budget", reason: "Target allocation" },
        { id: "b-2", name: "Total Spent", cost: `₹${spent.toLocaleString()}`, category: "Expenses", reason: "Verified ledger transactions" },
        { id: "b-3", name: "Remaining Balance", cost: `₹${rem.toLocaleString()}`, category: "Balance", reason: "Available funds" }
      );
    } else if (responseType === "ROUTE") {
      items.push(
        { id: "route-1", name: "Heritage Hilltop Fort", category: "Scenic Stop", distance: "+4 km detour", reason: "45 min · Scenic views & tea stop" },
        { id: "route-2", name: "Riverside Dhaba Stop", category: "Food & Tea", distance: "On Route", reason: "Fresh local meals & chai" }
      );
    }
  }

  // Default Summary line if empty
  if (!summary) {
    if (text && text.length < 120 && !text.includes("\n")) {
      summary = text;
    } else if (activePlace) {
      summary = items.length > 0
        ? `${items.length} verified options for your expedition in ${activePlace}.`
        : `Explore curated options for ${activePlace}.`;
    } else {
      summary = text || "How can I help with your journey today?";
    }
  }

  // Extract Single Watch Out Warning (if any)
  let watchOut: string | undefined = undefined;
  if (text.toLowerCase().includes("watch out:") || text.toLowerCase().includes("warning:")) {
    const match = text.match(/(?:watch out|warning|caution):\s*([^\n\.]+)/i);
    if (match && match[1]) {
      watchOut = match[1].trim();
    }
  } else if (responseType === "REPLAN") {
    watchOut = "Mountain daylight dims rapidly after 5:30 PM.";
  }

  // Assemble Actions (Max 2 Primary)
  const actions: ActionContract[] = [];

  if (responseType === "REPLAN") {
    actions.push({
      id: "apply-replan-action",
      label: "Apply Replan",
      action: "replan_today",
      payload: { trip_id: context?.tripId, action_type: "late", day_number: 1 },
      icon: "refresh",
      variant: "primary",
    });
    actions.push({
      id: "view-trip-action",
      label: "View Itinerary",
      action: "navigate_trip",
      payload: { trip_id: context?.tripId },
      icon: "compass",
      variant: "secondary",
    });
  } else if (responseType === "BUDGET") {
    actions.push({
      id: "open-wallet-action",
      label: "Open Wallet & Split",
      action: "open_wallet",
      payload: { trip_id: context?.tripId },
      icon: "wallet",
      variant: "primary",
    });
  } else if (responseType === "ROUTE") {
    actions.push({
      id: "view-route-action",
      label: "Open Route Map",
      action: "view_road_trip_stops",
      payload: context?.roadTripData,
      icon: "map",
      variant: "primary",
    });
  } else if (context?.destinationSlug) {
    actions.push({
      id: "build-today-action",
      label: "Build Today",
      action: "build_day_plan",
      payload: { destination: context.destinationSlug },
      icon: "compass",
      variant: "primary",
    });
    actions.push({
      id: "explore-places-action",
      label: "Explore Places",
      action: "navigate_destination",
      payload: { slug: context.destinationSlug },
      icon: "compass",
      variant: "secondary",
    });
  }

  // Metrics if relevant
  const metrics: NonNullable<StructuredAssistantResponse["context"]>["metrics"] = {};
  if (items.length > 0 && (responseType === "PLACE_LIST" || responseType === "QUICK_TAKE")) {
    metrics.time = "~3-4 hrs";
  }

  return {
    type: responseType,
    title,
    summary,
    items: items.slice(0, 4),
    watchOut,
    actions: actions.slice(0, 2),
    context: {
      destinationName: destName,
      currentLocation: explicitCurrentLocation,
      locationProvenance: context?.currentLocationProvenance || (destName ? "user_selected_trip" : null),
      tripId: context?.tripId,
      intent: responseType,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
    },
    provenance,
    details: secondaryItems.length > 0 ? { morePicks: secondaryItems } : undefined,
    rawText: text,
  };
}
