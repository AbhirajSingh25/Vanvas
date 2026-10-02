/**
 * VANVAS Copilot Action Registry
 * Centralized, type-safe registry of all executable actions.
 * Ensures zero fake actions and provides clear execution contracts.
 */

export type ActionId =
  | "OPEN_DESTINATION"
  | "OPEN_PLACE"
  | "OPEN_STAYS"
  | "OPEN_RENTALS"
  | "OPEN_ROUTE"
  | "OPEN_BUDGET"
  | "OPEN_JOURNAL"
  | "BUILD_DAY_PLAN"
  | "REPLAN_TRIP"
  | "ADD_TO_ITINERARY"
  | "REMOVE_FROM_ITINERARY"
  | "OPEN_NEARBY"
  | "OPEN_SOLO"
  | "OPEN_MESSAGES"
  | "OPEN_CHECKLIST"
  | "OPEN_DIRECTIONS"
  | "SAVE_PLACE"
  | "BOOK_EXTERNALLY";

export interface ActionDefinition {
  id: ActionId;
  action: string;
  label: string;
  category: "navigation" | "mutation" | "external" | "query";
  permissions: "public" | "member" | "owner";
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: (payload: any) => string;
  confirmButtonLabel?: string;
  loadingMessage?: string;
  successMessage?: (payload: any) => string;
  errorMessage?: string;
}

export const ACTION_REGISTRY: Record<ActionId, ActionDefinition> = {
  OPEN_DESTINATION: {
    id: "OPEN_DESTINATION",
    action: "navigate_destination",
    label: "Explore Destination",
    category: "navigation",
    permissions: "public",
  },
  OPEN_PLACE: {
    id: "OPEN_PLACE",
    action: "open_place",
    label: "View Place",
    category: "navigation",
    permissions: "public",
  },
  OPEN_STAYS: {
    id: "OPEN_STAYS",
    action: "view_stays",
    label: "Explore Stays",
    category: "navigation",
    permissions: "public",
  },
  OPEN_RENTALS: {
    id: "OPEN_RENTALS",
    action: "view_rentals",
    label: "View Rentals",
    category: "navigation",
    permissions: "public",
  },
  OPEN_ROUTE: {
    id: "OPEN_ROUTE",
    action: "view_road_trip_stops",
    label: "View Route",
    category: "navigation",
    permissions: "public",
  },
  OPEN_BUDGET: {
    id: "OPEN_BUDGET",
    action: "open_wallet",
    label: "Open Wallet & Split",
    category: "navigation",
    permissions: "member",
  },
  OPEN_JOURNAL: {
    id: "OPEN_JOURNAL",
    action: "open_journal",
    label: "Open Journal",
    category: "navigation",
    permissions: "member",
  },
  BUILD_DAY_PLAN: {
    id: "BUILD_DAY_PLAN",
    action: "build_day_plan",
    label: "Build Today",
    category: "navigation",
    permissions: "public",
  },
  REPLAN_TRIP: {
    id: "REPLAN_TRIP",
    action: "replan_trip",
    label: "Apply Replan",
    category: "mutation",
    permissions: "member",
    loadingMessage: "Updating your schedule...",
    successMessage: (p) => `Day ${p?.day_number || 1} schedule updated!`,
    errorMessage: "Could not replan itinerary.",
  },
  ADD_TO_ITINERARY: {
    id: "ADD_TO_ITINERARY",
    action: "add_place_to_itinerary",
    label: "Add to Trip",
    category: "mutation",
    permissions: "member",
    loadingMessage: "Adding stop to trip...",
    successMessage: (p) => `Added '${p?.name || p?.title || "place"}' to Day ${p?.day || 1}.`,
    errorMessage: "Could not add place to trip.",
  },
  REMOVE_FROM_ITINERARY: {
    id: "REMOVE_FROM_ITINERARY",
    action: "remove_place_from_itinerary",
    label: "Remove Stop",
    category: "mutation",
    permissions: "member",
    requiresConfirmation: true,
    confirmationTitle: "Remove Stop?",
    confirmationMessage: (p) => `Are you sure you want to remove '${p?.title || p?.name || "this stop"}' from your itinerary?`,
    confirmButtonLabel: "Remove Stop",
    loadingMessage: "Removing stop...",
    successMessage: (p) => `Removed '${p?.title || p?.name || "stop"}' from trip.`,
    errorMessage: "Could not remove stop.",
  },
  OPEN_NEARBY: {
    id: "OPEN_NEARBY",
    action: "open_nearby",
    label: "Explore Nearby",
    category: "navigation",
    permissions: "public",
  },
  OPEN_SOLO: {
    id: "OPEN_SOLO",
    action: "open_solo",
    label: "Solo Matchmaker",
    category: "navigation",
    permissions: "public",
  },
  OPEN_MESSAGES: {
    id: "OPEN_MESSAGES",
    action: "open_messages",
    label: "Trip Messages",
    category: "navigation",
    permissions: "member",
  },
  OPEN_CHECKLIST: {
    id: "OPEN_CHECKLIST",
    action: "open_checklist",
    label: "Trip Checklist",
    category: "navigation",
    permissions: "member",
  },
  OPEN_DIRECTIONS: {
    id: "OPEN_DIRECTIONS",
    action: "directions",
    label: "Directions",
    category: "external",
    permissions: "public",
  },
  SAVE_PLACE: {
    id: "SAVE_PLACE",
    action: "save_place",
    label: "Save Place",
    category: "mutation",
    permissions: "public",
    loadingMessage: "Saving to collection...",
    successMessage: (p) => `Saved '${p?.name || "place"}' to your travel collection.`,
    errorMessage: "Could not save place.",
  },
  BOOK_EXTERNALLY: {
    id: "BOOK_EXTERNALLY",
    action: "book_externally",
    label: "Book with Provider",
    category: "external",
    permissions: "public",
  },
};
