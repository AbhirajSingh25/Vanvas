import { CopilotChatResponse, Place } from "@/types";

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

export interface AssistantActionItem {
  label: string;
  action: string;
  payload?: any;
  icon?: "compass" | "map" | "plus" | "refresh" | "external" | "wallet" | "trash" | "food" | "bed";
  variant?: "primary" | "secondary" | "danger" | "outline";
}

export interface StructuredAssistantResponse {
  quickTake: {
    headline: string;
    metrics?: {
      time?: string;
      cost?: string;
      distance?: string;
      weather?: string;
      status?: string;
    };
  };
  bestFor: string[];
  topPicks: Array<{
    id?: string;
    name: string;
    category?: string;
    note?: string;
    cost?: string | number;
    distance?: string;
    actionUrl?: string;
    placeId?: string;
    lat?: number;
    lng?: number;
    isIndoor?: boolean;
    rating?: number;
  }>;
  watchOut?: string;
  primaryActions: AssistantActionItem[];
  details?: {
    transit?: string[];
    food?: string[];
    morePicks?: string[];
    packing?: string[];
    prose?: string[];
    itineraryDiff?: Array<{ title: string; change: string; reason?: string }>;
  };
  rawText?: string;
  provenance: "LIVE VERIFIED" | "DATABASE VERIFIED" | "CURATED" | "ESTIMATED";
}

/**
 * Normalizes raw Copilot text + tool executions + context into a clean, punchy structured card.
 * Never outputs walls of AI prose.
 */
export function normalizeAssistantResponse(
  rawText: string,
  res?: CopilotChatResponse,
  context?: TravelContext,
  userQuery?: string
): StructuredAssistantResponse {
  const queryLower = (userQuery || "").toLowerCase();
  const text = rawText || "";

  // 1. Metric Matchers
  const budgetMatch = text.match(/₹\s*[\d,]+(?:\s*-\s*₹?\s*[\d,]+)?(?:\s*(?:per person|total|each|\/day|\/night))?/i);
  const timeMatch = text.match(/\b(?:\d+(?:\.\d+)?\s*(?:-\s*\d+)?\s*(?:hours?|hrs?|days?|nights?|mins?|minutes))\b/i);
  const distMatch = text.match(/\b(?:\d+(?:\.\d+)?\s*(?:-\s*\d+)?\s*(?:km|kms|kilometers))\b/i);
  const tempMatch = text.match(/\b(?:\d+°C|\d+–\d+°C|\d+-\d+°C)\b/i);

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let quickTakeHeadline = "";
  const bestForTags: string[] = [];
  const parsedPicks: Array<{ name: string; note?: string; category?: string; cost?: string }> = [];
  let parsedWatchOut = "";
  const transitLines: string[] = [];
  const foodLines: string[] = [];
  const packingLines: string[] = [];
  const proseLines: string[] = [];

  let currentSection: "quick" | "bestfor" | "picks" | "watchout" | "transit" | "food" | "packing" | "prose" = "quick";

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Section headers detection
    if (lower.startsWith("quick take") || lower.startsWith("summary") || lower.startsWith("now:") || lower.startsWith("verdict:")) {
      currentSection = "quick";
      const clean = line.replace(/^[#*_\-\s]*(quick take|summary|now|verdict)[:\s]*/i, "").trim();
      if (clean) quickTakeHeadline = clean;
      continue;
    } else if (lower.startsWith("best for") || lower.startsWith("tags") || lower.startsWith("ideal for")) {
      currentSection = "bestfor";
      const clean = line.replace(/^[#*_\-\s]*(best for|tags|ideal for)[:\s]*/i, "").trim();
      if (clean) {
        clean.split(/[•·,\/]+/).map((t) => t.trim()).filter(Boolean).forEach((t) => bestForTags.push(t));
      }
      continue;
    } else if (lower.startsWith("top picks") || lower.startsWith("picks") || lower.startsWith("what to do") || lower.startsWith("recommendations") || lower.startsWith("highlights") || lower.startsWith("next:")) {
      currentSection = "picks";
      continue;
    } else if (lower.startsWith("watch out") || lower.startsWith("warning") || lower.startsWith("important") || lower.startsWith("advisory") || lower.startsWith("caution")) {
      currentSection = "watchout";
      const clean = line.replace(/^[#*_\-\s]*(watch out|warnings?|important|advisory|caution)[:\s]*/i, "").trim();
      if (clean) parsedWatchOut = clean;
      continue;
    } else if (lower.startsWith("getting there") || lower.startsWith("transit") || lower.startsWith("route") || lower.startsWith("how to reach")) {
      currentSection = "transit";
      const clean = line.replace(/^[#*_\-\s]*(getting there|transit|route|how to reach)[:\s]*/i, "").trim();
      if (clean) transitLines.push(clean);
      continue;
    } else if (lower.startsWith("where to eat") || lower.startsWith("food nearby") || lower.startsWith("dining")) {
      currentSection = "food";
      const clean = line.replace(/^[#*_\-\s]*(where to eat|food nearby|dining)[:\s]*/i, "").trim();
      if (clean) foodLines.push(clean);
      continue;
    } else if (lower.startsWith("pack") || lower.startsWith("what to pack") || lower.startsWith("checklist")) {
      currentSection = "packing";
      const clean = line.replace(/^[#*_\-\s]*(pack|what to pack|checklist)[:\s]*/i, "").trim();
      if (clean) packingLines.push(clean);
      continue;
    }

    const cleanContent = line.replace(/^[•\-\*]\s*|\d+[\.\)]\s*/, "").replace(/\*\*/g, "").trim();
    if (!cleanContent) continue;

    if (currentSection === "quick") {
      if (!quickTakeHeadline) quickTakeHeadline = cleanContent;
      else proseLines.push(cleanContent);
    } else if (currentSection === "bestfor") {
      cleanContent.split(/[•·,\/]+/).map((t) => t.trim()).filter(Boolean).forEach((t) => bestForTags.push(t));
    } else if (currentSection === "picks") {
      const parts = cleanContent.split(/—|-|–|:/);
      parsedPicks.push({
        name: parts[0]?.trim() || cleanContent,
        note: parts.slice(1).join(" - ").trim() || undefined,
      });
    } else if (currentSection === "watchout") {
      if (!parsedWatchOut) parsedWatchOut = cleanContent;
      else proseLines.push(cleanContent);
    } else if (currentSection === "transit") {
      transitLines.push(cleanContent);
    } else if (currentSection === "food") {
      foodLines.push(cleanContent);
    } else if (currentSection === "packing") {
      packingLines.push(cleanContent);
    } else {
      proseLines.push(cleanContent);
    }
  }

  // Default headline if empty
  if (!quickTakeHeadline) {
    if (proseLines.length > 0) {
      quickTakeHeadline = proseLines.shift() || "Travel intelligence ready.";
    } else {
      quickTakeHeadline = context?.destinationName
        ? `Verified travel options for ${context.destinationName}.`
        : "Verified travel recommendations.";
    }
  }

  // 2. Resolve Top Picks from Tool Results or Parsed List
  const topPicks: StructuredAssistantResponse["topPicks"] = [];

  if (res?.places && res.places.length > 0) {
    for (const p of res.places.slice(0, 4)) {
      topPicks.push({
        id: p.id,
        placeId: p.id,
        name: p.name,
        category: p.category,
        note: (p as any).why_vanvas_recommends || p.description?.slice(0, 80) || undefined,
        cost: p.approx_cost ? `₹${p.approx_cost}` : undefined,
        distance: (p as any).distance_km ? `${(p as any).distance_km} km` : undefined,
        lat: p.latitude,
        lng: p.longitude,
        isIndoor: p.is_indoor,
        rating: p.rating,
      });
    }
  } else if (parsedPicks.length > 0) {
    for (const pp of parsedPicks.slice(0, 4)) {
      topPicks.push({
        name: pp.name,
        note: pp.note,
        category: pp.category,
        cost: pp.cost,
      });
    }
  }

  // 3. Assemble Actions
  const actions: AssistantActionItem[] = [];

  // Backend returned actions
  if (res?.actions && res.actions.length > 0) {
    for (const act of res.actions) {
      const actType = act.action_type || (act as any).action || "";
      const title = act.title || (act as any).label || "Action";

      let icon: AssistantActionItem["icon"] = "compass";
      let variant: AssistantActionItem["variant"] = "primary";

      if (actType.includes("replan")) {
        icon = "refresh";
        variant = "primary";
      } else if (actType.includes("add")) {
        icon = "plus";
        variant = "primary";
      } else if (actType.includes("save")) {
        icon = "map";
        variant = "secondary";
      } else if (actType.includes("wallet") || actType.includes("split") || actType.includes("budget")) {
        icon = "wallet";
        variant = "primary";
      } else if (actType.includes("stay") || actType.includes("hotel")) {
        icon = "bed";
        variant = "primary";
      } else if (actType.includes("remove") || actType.includes("delete")) {
        icon = "trash";
        variant = "danger";
      }

      actions.push({
        label: title,
        action: actType,
        payload: act.payload,
        icon,
        variant,
      });
    }
  }

  // Context-specific fallback actions if none returned
  if (actions.length === 0) {
    if (context?.type === "trip" && context.tripId) {
      if (queryLower.includes("late") || queryLower.includes("rain") || queryLower.includes("replan")) {
        actions.push({
          label: "Replan Today",
          action: "replan_today",
          payload: { trip_id: context.tripId, reason: queryLower.includes("rain") ? "rain" : "late" },
          icon: "refresh",
          variant: "primary",
        });
      } else {
        actions.push({
          label: "Open Itinerary",
          action: "navigate_trip",
          payload: { trip_id: context.tripId },
          icon: "map",
          variant: "primary",
        });
      }
    } else if (context?.type === "road_trip") {
      actions.push({
        label: "View Route Stops",
        action: "view_road_trip_stops",
        payload: context.roadTripData,
        icon: "compass",
        variant: "primary",
      });
    } else if (context?.type === "budget") {
      actions.push({
        label: "Open Ledger",
        action: "open_wallet",
        payload: context.budgetData,
        icon: "wallet",
        variant: "primary",
      });
    } else if (context?.destinationSlug) {
      actions.push({
        label: `Explore ${context.destinationName || "Destination"}`,
        action: "navigate_destination",
        payload: { slug: context.destinationSlug },
        icon: "compass",
        variant: "primary",
      });
      actions.push({
        label: "Build 1-Day Plan",
        action: "build_plan",
        payload: { destination: context.destinationSlug },
        icon: "plus",
        variant: "secondary",
      });
    } else {
      actions.push({
        label: "Plan Trip",
        action: "navigate_plan",
        icon: "plus",
        variant: "primary",
      });
    }
  }

  // 4. Fallback Best For tags if empty
  if (bestForTags.length === 0) {
    if (queryLower.includes("food") || queryLower.includes("eat") || queryLower.includes("cafe")) {
      bestForTags.push("Cafés", "Local Food", "Sunset Dining");
    } else if (queryLower.includes("stay") || queryLower.includes("hotel")) {
      bestForTags.push("Riverside Stays", "Boutique", "Homestays");
    } else if (context?.destinationName) {
      bestForTags.push("Nature", "Cafes", "Culture", "Walks");
    }
  }

  // 5. Provenance calculation
  const provenance: StructuredAssistantResponse["provenance"] = res?.metadata?.is_enabled
    ? "LIVE VERIFIED"
    : res?.places && res.places.length > 0
    ? "DATABASE VERIFIED"
    : "CURATED";

  return {
    quickTake: {
      headline: quickTakeHeadline,
      metrics: {
        time: timeMatch ? timeMatch[0] : undefined,
        cost: budgetMatch ? budgetMatch[0] : undefined,
        distance: distMatch ? distMatch[0] : undefined,
        weather: tempMatch ? tempMatch[0] : undefined,
      },
    },
    bestFor: bestForTags.slice(0, 4),
    topPicks,
    watchOut: parsedWatchOut || undefined,
    primaryActions: actions.slice(0, 3),
    details: {
      transit: transitLines.length > 0 ? transitLines : undefined,
      food: foodLines.length > 0 ? foodLines : undefined,
      packing: packingLines.length > 0 ? packingLines : undefined,
      prose: proseLines.length > 0 ? proseLines : undefined,
    },
    rawText: text,
    provenance,
  };
}
