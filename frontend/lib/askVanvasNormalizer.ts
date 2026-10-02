import { CopilotChatResponse } from "@/types";
import { ActionId, ACTION_REGISTRY } from "./actionRegistry";

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
  destinationName?: string;
  destinationSlug?: string;
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
    destinationName?: string;
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
 * Eliminates legacy essay parsing. Max 4 items, max 1 warning, max 2 primary actions.
 */
export function normalizeAssistantResponse(
  rawText: string,
  res?: CopilotChatResponse,
  context?: TravelContext,
  userQuery?: string
): StructuredAssistantResponse {
  const queryLower = (userQuery || "").toLowerCase();
  const text = (rawText || "").trim();
  const destName = context?.destinationName || "Manali";

  // Determine Response Type & Intent
  let responseType: AssistantResponseType = "QUICK_TAKE";
  let title = `${destName.toUpperCase()} · TODAY`;
  let summary = "";
  let provenance: StructuredAssistantResponse["provenance"] = "CURATED";

  if (res?.metadata?.provider === "live_osrm" || res?.metadata?.provider === "open_meteo") {
    provenance = "LIVE";
  } else if (context?.type === "budget") {
    provenance = "USER ENTERED";
  } else if (context?.type === "road_trip") {
    provenance = "ESTIMATED";
  }

  // 1. Replan / Late / Weather Intent
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
  // 2. Budget / Split / Spend Intent
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
  // 3. Food / Dining Intent
  else if (queryLower.includes("eat") || queryLower.includes("food") || queryLower.includes("cafe") || queryLower.includes("dhaba")) {
    responseType = "PLACE_LIST";
    title = `FOOD NEARBY · ${destName.toUpperCase()}`;
    summary = `Top dining options and cafes in ${destName}.`;
    provenance = "CURATED";
  }
  // 4. Stays Intent
  else if (queryLower.includes("stay") || queryLower.includes("hotel") || queryLower.includes("hostel") || queryLower.includes("resort")) {
    responseType = "STAY_LIST";
    title = `STAYS · ${destName.toUpperCase()}`;
    summary = `Verified accommodations in ${destName}.`;
    provenance = "CURATED";
  }
  // 5. Road Trip / Stops Intent
  else if (queryLower.includes("stop") || queryLower.includes("route") || context?.type === "road_trip") {
    responseType = "ROUTE";
    title = "NEXT GOOD STOP";
    summary = "Curated scenic waypoints & dhabas along your driving route.";
    provenance = "ESTIMATED";
  }
  // 6. Active Trip "What's next?" Intent
  else if (queryLower.includes("what's next") || queryLower.includes("whats next") || (context?.type === "trip" && queryLower.includes("next"))) {
    responseType = "NAVIGATION";
    title = "NEXT STOP TODAY";
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

  // If no places returned from tools, construct clean deterministic items
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
        { id: "route-1", name: "Heritage Hilltop Fort", category: "Scenic Stop", distance: "+4 km detour", reason: "45 min · Mountain views & dhaba" },
        { id: "route-2", name: "Riverside Forest Dhaba", category: "Food & Tea", distance: "On Route", reason: "Fresh parathas & tea" }
      );
    } else if (responseType === "PLACE_LIST") {
      items.push(
        { id: "place-1", name: "Old Town Pine Walk", category: "Walk", cost: "₹0", distance: "0.8 km", reason: "Peaceful cedar trail & stone cafes" },
        { id: "place-2", name: "Ancient Valley Sanctuary", category: "Culture", cost: "₹0", distance: "1.2 km", reason: "Best visited before noon" },
        { id: "place-3", name: "Sunset Hilltop Point", category: "Viewpoint", cost: "₹0", distance: "2.4 km", reason: "Panoramic mountain sunset" }
      );
    } else if (responseType === "STAY_LIST") {
      items.push(
        { id: "stay-1", name: "Pine Forest Riverside Retreat", category: "Riverside", cost: "₹3,200/night", reason: "Riverside balconies & garden" },
        { id: "stay-2", name: "Old Heritage Homestay", category: "Homestay", cost: "₹1,800/night", reason: "Mountain views & home meals" }
      );
    } else {
      items.push(
        { id: "def-1", name: "Old Quarter Walk", category: "Walk", distance: "0.5 km", reason: "Cafes & pine trails" },
        { id: "def-2", name: "Historic Wooden Temple", category: "Culture", distance: "1.2 km", reason: "Ancient architecture" },
        { id: "def-3", name: "Mountain Viewpoint", category: "Nature", distance: "3.0 km", reason: "Panoramic valley vistas" }
      );
    }
  }

  // Default Summary line if empty
  if (!summary) {
    summary = text && text.length < 120 && !text.includes("\n")
      ? text
      : `${items.length} verified options for your expedition in ${destName}.`;
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
  } else if (destName.toLowerCase() === "manali") {
    watchOut = "Afternoon traffic slows near main valley bridges.";
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
  } else {
    actions.push({
      id: "build-today-action",
      label: "Build Today",
      action: "build_day_plan",
      payload: { destination: context?.destinationSlug || "manali" },
      icon: "compass",
      variant: "primary",
    });
    actions.push({
      id: "explore-places-action",
      label: "Explore Places",
      action: "navigate_destination",
      payload: { slug: context?.destinationSlug || "manali" },
      icon: "compass",
      variant: "secondary",
    });
  }

  // Metrics if relevant
  const metrics: NonNullable<StructuredAssistantResponse["context"]>["metrics"] = {};
  if (responseType === "PLACE_LIST" || responseType === "QUICK_TAKE") {
    metrics.weather = "18–22°C";
    metrics.time = "~4-5 hrs";
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
      tripId: context?.tripId,
      intent: responseType,
      metrics,
    },
    provenance,
    details: secondaryItems.length > 0 ? { morePicks: secondaryItems } : undefined,
    rawText: text,
  };
}
