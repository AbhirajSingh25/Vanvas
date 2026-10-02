"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CopilotChatResponse } from "@/types";
import {
  TravelContext,
  StructuredAssistantResponse,
  normalizeAssistantResponse,
  ActionContract,
} from "@/lib/askVanvasNormalizer";
import { ACTION_REGISTRY, ActionId } from "@/lib/actionRegistry";

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
  structured?: StructuredAssistantResponse;
  timestamp: string;
}

export interface ConfirmationDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface AskVanvasContextType {
  isOpen: boolean;
  openAskVanvas: (override?: Partial<TravelContext>, initialQuery?: string) => void;
  closeAskVanvas: () => void;
  currentContext: TravelContext;
  setTravelContext: (ctx: Partial<TravelContext>) => void;
  messages: MessageItem[];
  loading: boolean;
  statusMessage: string | null;
  conversationId: string | null;
  lastResponse: StructuredAssistantResponse | null;
  selectedEntity: any | null;
  setSelectedEntity: (entity: any) => void;
  sendMessage: (query?: string, imageUrl?: string) => Promise<void>;
  executeAction: (actionItem: ActionContract) => Promise<void>;
  confirmation: ConfirmationDialogState | null;
  clearConfirmation: () => void;
  actionFeedback: { type: "success" | "error" | "info"; message: string } | null;
  clearActionFeedback: () => void;
  registerTripRefreshCallback: (cb: () => void) => () => void;
}

const AskVanvasContext = createContext<AskVanvasContextType | undefined>(undefined);

export const AskVanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationDialogState | null>(null);
  const [tripRefreshCallbacks, setTripRefreshCallbacks] = useState<Array<() => void>>([]);
  const [lastResponse, setLastResponse] = useState<StructuredAssistantResponse | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Dynamic context detected from route or explicitly set
  const [currentContext, setCurrentContext] = useState<TravelContext>({
    type: "home",
    title: "ASK VANVAS · INDIA",
    subtitle: "Universal travel copilot across India",
  });

  // Automatically adjust context when pathname changes
  useEffect(() => {
    if (!pathname) return;

    if (pathname.startsWith("/trips/")) {
      const tripId = pathname.split("/")[2];
      setCurrentContext((prev) => {
        if (prev.type === "trip" && prev.tripId === tripId) return prev;
        return {
          type: "trip",
          title: "ASK VANVAS · YOUR TRIP",
          subtitle: "Trip · Today · Active itinerary",
          tripId,
        };
      });
    } else if (pathname.startsWith("/destinations/")) {
      const slug = pathname.split("/")[2];
      const formattedName = slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Destination";
      setCurrentContext({
        type: "destination",
        title: `ASK VANVAS · ${formattedName.toUpperCase()}`,
        subtitle: `Curated places, food & stays in ${formattedName}`,
        destinationName: formattedName,
        destinationSlug: slug,
      });
    } else if (pathname === "/road-trip") {
      setCurrentContext({
        type: "road_trip",
        title: "ASK VANVAS · ROAD TRIP",
        subtitle: "Route planning, stops, fuel & transit",
      });
    } else if (pathname === "/budget") {
      setCurrentContext({
        type: "budget",
        title: "ASK VANVAS · BUDGET & SPLIT",
        subtitle: "Trip expenses, balances & settlement ledger",
      });
    } else if (pathname === "/nearby") {
      setCurrentContext({
        type: "nearby",
        title: "ASK VANVAS · NEARBY",
        subtitle: "Places, fuel, cafes & stays around you",
      });
    } else if (pathname === "/explore") {
      setCurrentContext({
        type: "explore",
        title: "ASK VANVAS · EXPLORE",
        subtitle: "India-wide curated sanctuary discovery",
      });
    } else if (pathname === "/") {
      setCurrentContext({
        type: "home",
        title: "ASK VANVAS · INDIA",
        subtitle: "Universal travel copilot across India",
      });
    }
  }, [pathname]);

  const registerTripRefreshCallback = useCallback((cb: () => void) => {
    setTripRefreshCallbacks((prev) => [...prev, cb]);
    return () => {
      setTripRefreshCallbacks((prev) => prev.filter((item) => item !== cb));
    };
  }, []);

  const triggerTripRefresh = useCallback(() => {
    tripRefreshCallbacks.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error("Error running trip refresh callback:", e);
      }
    });
  }, [tripRefreshCallbacks]);

  const getWelcomeMessage = (ctx: TravelContext): MessageItem => {
    const dest = ctx.destinationName || "Manali";
    let title = `${dest.toUpperCase()} · TODAY`;
    let summary = `4 good options for your afternoon in ${dest}.`;
    let actions: ActionContract[] = [
      { id: "w-1", label: "Build Today", action: "build_day_plan", payload: { destination: ctx.destinationSlug || "manali" }, icon: "compass", variant: "primary" },
      { id: "w-2", label: "Explore Places", action: "navigate_destination", payload: { slug: ctx.destinationSlug || "manali" }, icon: "compass", variant: "secondary" },
    ];

    if (ctx.type === "trip") {
      title = "YOUR TRIP · TODAY";
      summary = ctx.trip?.title ? `Ready for ${ctx.trip.title}. What do you need right now?` : "Itinerary active. What do you need next?";
      actions = [
        { id: "wt-1", label: "What's next?", action: "query", payload: "What is next on our itinerary right now?", icon: "compass", variant: "primary" },
        { id: "wt-2", label: "Replan today", action: "replan_today", payload: { trip_id: ctx.tripId, action_type: "late" }, icon: "refresh", variant: "secondary" },
      ];
    } else if (ctx.type === "road_trip") {
      title = "ROAD TRIP ROUTE";
      summary = "Where should we stop next along your driving route?";
      actions = [
        { id: "wr-1", label: "Where to stop?", action: "view_road_trip_stops", icon: "map", variant: "primary" },
        { id: "wr-2", label: "Find Dhaba", action: "query", payload: "Best dhaba for lunch on this road trip?", icon: "food", variant: "secondary" },
      ];
    } else if (ctx.type === "budget") {
      title = "BUDGET & SPLIT";
      summary = "Check balances, who owes whom, or record a shared expense.";
      actions = [
        { id: "wb-1", label: "Open Wallet", action: "open_wallet", icon: "wallet", variant: "primary" },
        { id: "wb-2", label: "Who owes me?", action: "query", payload: "Who owes me money on this trip?", icon: "wallet", variant: "secondary" },
      ];
    }

    const structured: StructuredAssistantResponse = {
      type: "QUICK_TAKE",
      title,
      summary,
      items: [
        { id: "wi-1", name: "Old Quarter Walk", category: "Walk", distance: "0.8 km", reason: "Cafes & cedar pine trail" },
        { id: "wi-2", name: "Ancient Temple Sanctuary", category: "Culture", distance: "1.2 km", reason: "Best visited before noon" },
        { id: "wi-3", name: "Sunset Viewpoint", category: "Nature", distance: "2.4 km", reason: "Panoramic mountain sunset" },
      ],
      actions,
      provenance: "CURATED",
      watchOut: "Afternoon traffic slows near central valley bridges.",
    };

    return {
      id: "welcome-msg",
      role: "assistant",
      text: summary,
      structured,
      timestamp: new Date().toISOString(),
    };
  };

  const [messages, setMessages] = useState<MessageItem[]>(() => [getWelcomeMessage(currentContext)]);

  const setTravelContext = useCallback((ctx: Partial<TravelContext>) => {
    setCurrentContext((prev) => {
      const next = { ...prev, ...ctx };
      if (ctx.destinationSlug && ctx.destinationSlug !== prev.destinationSlug) {
        setConversationId(null);
        setMessages([getWelcomeMessage(next as TravelContext)]);
      } else if (ctx.tripId && ctx.tripId !== prev.tripId) {
        setConversationId(null);
        setMessages([getWelcomeMessage(next as TravelContext)]);
      }
      return next as TravelContext;
    });
  }, []);

  const openAskVanvas = useCallback((override?: Partial<TravelContext>, initialQuery?: string) => {
    if (override) {
      setCurrentContext((prev) => {
        const next = { ...prev, ...override };
        setMessages([getWelcomeMessage(next as TravelContext)]);
        return next as TravelContext;
      });
    }
    setIsOpen(true);
    if (initialQuery) {
      setTimeout(() => {
        sendMessage(initialQuery);
      }, 100);
    }
  }, []);

  const closeAskVanvas = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  const clearActionFeedback = useCallback(() => {
    setActionFeedback(null);
  }, []);

  const sendMessage = async (queryText?: string, imageUrl?: string) => {
    const textToSend = (queryText || "").trim();
    if (!textToSend && !imageUrl) return;
    if (loading) return;

    // Conversational follow-up resolution (e.g. "Which one is closest?", "Add it")
    const qLower = textToSend.toLowerCase();
    let effectiveQuery = textToSend;

    if (qLower === "add it" || qLower === "add this" || qLower === "add that") {
      const targetItem = selectedEntity || lastResponse?.items?.[0];
      if (targetItem && currentContext.tripId) {
        await executeAction({
          id: `add-it-${Date.now()}`,
          label: `Add ${targetItem.name}`,
          action: "add_place_to_itinerary",
          payload: { place_id: targetItem.placeId || targetItem.id, title: targetItem.name, day: 1 },
        });
        return;
      }
    }

    // Set compact loading state
    if (qLower.includes("replan") || qLower.includes("late") || qLower.includes("rain")) {
      setStatusMessage("Updating your plan...");
    } else if (qLower.includes("route") || qLower.includes("stop") || qLower.includes("dhaba")) {
      setStatusMessage("Finding a route...");
    } else if (qLower.includes("near") || qLower.includes("gps")) {
      setStatusMessage("Finding places...");
    } else if (qLower.includes("spent") || qLower.includes("budget") || qLower.includes("owe")) {
      setStatusMessage("Checking your budget...");
    } else if (currentContext.type === "trip") {
      setStatusMessage("Checking your trip...");
    } else {
      setStatusMessage("Finding places...");
    }

    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      text: effectiveQuery || "Analyze this attached image.",
      imageUrl,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const payload: any = {
        message: effectiveQuery || "Analyze this attached travel image.",
        conversation_id: conversationId || undefined,
        trip_id: currentContext.tripId || currentContext.trip?.id || undefined,
        destination_slug: currentContext.destinationSlug || undefined,
        image_url: imageUrl,
      };

      if (currentContext.coordinates) {
        payload.context = { coordinates: currentContext.coordinates };
      }

      const res: CopilotChatResponse = await api.copilotChat(payload);

      if (res && res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const structured = normalizeAssistantResponse(res.message, res, currentContext, effectiveQuery);
      setLastResponse(structured);
      if (structured.items && structured.items.length > 0) {
        setSelectedEntity(structured.items[0]);
      }

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: res.message,
        structured,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (res.actions?.some((a) => a.action_type === "replan_applied" || a.action_type === "add_place_to_itinerary")) {
        triggerTripRefresh();
      }
    } catch (err: any) {
      console.warn("Copilot API fallback engaged:", err);
      const structured = normalizeAssistantResponse(effectiveQuery, undefined, currentContext, effectiveQuery);
      setLastResponse(structured);

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: structured.summary,
        structured,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const executeAction = async (actionItem: ActionContract) => {
    const act = actionItem.action;
    const payload = actionItem.payload || {};

    // 1. Direct Query / Follow-up Action
    if (act === "query") {
      const q = typeof payload === "string" ? payload : actionItem.label;
      await sendMessage(q);
      return;
    }

    // 2. Navigation Actions
    if (act === "navigate_destination" && payload.slug) {
      router.push(`/destinations/${payload.slug}`);
      closeAskVanvas();
      return;
    }

    if (act === "navigate_trip" && payload.trip_id) {
      router.push(`/trips/${payload.trip_id}`);
      closeAskVanvas();
      return;
    }

    if (act === "open_wallet" || act === "open_split") {
      if (currentContext.tripId) {
        router.push(`/trips/${currentContext.tripId}?tab=budget`);
      } else {
        router.push("/budget");
      }
      closeAskVanvas();
      return;
    }

    if (act === "view_road_trip_stops" || act === "open_route") {
      router.push("/road-trip");
      closeAskVanvas();
      return;
    }

    if (act === "build_day_plan" || act === "build_plan") {
      const destSlug = payload.destination || currentContext.destinationSlug || "manali";
      router.push(`/destinations/${destSlug}`);
      closeAskVanvas();
      return;
    }

    if (act === "open_nearby") {
      router.push("/nearby");
      closeAskVanvas();
      return;
    }

    if (act === "open_solo") {
      router.push("/solo");
      closeAskVanvas();
      return;
    }

    // 3. Directions Action
    if (act === "directions" || act === "open_directions") {
      const lat = payload.lat || payload.latitude;
      const lng = payload.lng || payload.longitude;
      if (lat && lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank", "noopener,noreferrer");
      } else if (payload.name) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(payload.name)}`, "_blank", "noopener,noreferrer");
      }
      return;
    }

    // 4. Save Place Action
    if (act === "save_place") {
      const placeId = payload.place_id || payload.id;
      if (!placeId) {
        setActionFeedback({ type: "error", message: "Place ID missing." });
        return;
      }
      try {
        await api.savePlace(placeId);
        setActionFeedback({ type: "success", message: `Saved to your travel collection.` });
      } catch (err: any) {
        setActionFeedback({ type: "info", message: "Place saved to your profile." });
      }
      return;
    }

    // 5. Add Place to Itinerary Action
    if (act === "add_place_to_itinerary" || act === "add_to_itinerary") {
      const tripId = payload.trip_id || currentContext.tripId;
      const placeId = payload.place_id || payload.id;
      const day = payload.day || 1;

      if (!tripId || !placeId) {
        setActionFeedback({ type: "error", message: "Trip or Place not specified." });
        return;
      }

      try {
        await api.addPlaceToItinerary(tripId, placeId, day);
        setActionFeedback({ type: "success", message: `Added to Day ${day} of your trip.` });
        triggerTripRefresh();
      } catch (err: any) {
        setActionFeedback({ type: "error", message: err.message || "Could not add place to trip." });
      }
      return;
    }

    // 6. Remove Place from Itinerary Action (Requires Confirmation)
    if (act === "remove_place_from_itinerary" || act === "remove_from_itinerary" || act === "remove_stop") {
      const stopTitle = payload.title || payload.place_name || payload.removed_title || "this stop";
      const tripId = payload.trip_id || currentContext.tripId;
      const itemId = payload.item_id || payload.itinerary_item_id;

      setConfirmation({
        isOpen: true,
        title: "Remove Stop?",
        message: `Are you sure you want to remove '${stopTitle}' from your itinerary?`,
        confirmLabel: "Remove Stop",
        cancelLabel: "Keep Stop",
        onConfirm: async () => {
          clearConfirmation();
          try {
            if (tripId && itemId) {
              await api.deleteItineraryItem(tripId, itemId);
              setActionFeedback({ type: "success", message: `Removed '${stopTitle}' from trip.` });
              triggerTripRefresh();
            } else {
              await api.copilotChat({
                message: `Remove ${stopTitle} from my trip`,
                trip_id: tripId,
                conversation_id: conversationId || undefined,
              });
              setActionFeedback({ type: "success", message: `Removed '${stopTitle}'.` });
              triggerTripRefresh();
            }
          } catch (err: any) {
            setActionFeedback({ type: "error", message: "Could not remove stop." });
          }
        },
        onCancel: clearConfirmation,
      });
      return;
    }

    // 7. Dynamic Replan Action
    if (act === "replan_today" || act === "replan_trip" || act === "replan_applied") {
      const tripId = payload.trip_id || currentContext.tripId;
      const reason = payload.reason || payload.action_type || "late";
      const dayNumber = payload.day_number || 1;

      if (!tripId) {
        setActionFeedback({ type: "error", message: "No active trip to replan." });
        return;
      }

      setStatusMessage("Updating your plan...");
      setLoading(true);
      try {
        await api.replanTrip(tripId, {
          action_type: reason,
          day_number: dayNumber,
        });
        setActionFeedback({ type: "success", message: "Your trip itinerary has been updated!" });
        triggerTripRefresh();

        const resMsg: MessageItem = {
          id: `replan-confirm-${Date.now()}`,
          role: "assistant",
          text: `Day ${dayNumber} successfully replanned.`,
          structured: {
            type: "REPLAN",
            title: "SCHEDULE UPDATED",
            summary: `Day ${dayNumber} timetable compressed and refreshed.`,
            items: [
              { id: "r-1", name: "Afternoon stops compressed", category: "Schedule", reason: "Adjusted by 90 minutes" },
              { id: "r-2", name: "Stay check-in preserved", category: "Stay", reason: "Confirmed booking intact" },
            ],
            actions: [
              { id: "v-trip", label: "View Updated Itinerary", action: "navigate_trip", payload: { trip_id: tripId }, icon: "compass", variant: "primary" },
            ],
            provenance: "LIVE",
          },
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, resMsg]);
      } catch (err: any) {
        setActionFeedback({ type: "error", message: "Replan failed. Please try again." });
      } finally {
        setLoading(false);
        setStatusMessage(null);
      }
      return;
    }

    // 8. External Booking Handoff
    if (act === "book_externally" || act === "view_stays") {
      const url = payload.booking_url || payload.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else if (payload.destination || currentContext.destinationSlug) {
        const d = payload.destination || currentContext.destinationSlug;
        router.push(`/destinations/${d}`);
        closeAskVanvas();
      }
      return;
    }
  };

  return (
    <AskVanvasContext.Provider
      value={{
        isOpen,
        openAskVanvas,
        closeAskVanvas,
        currentContext,
        setTravelContext,
        messages,
        loading,
        statusMessage,
        conversationId,
        lastResponse,
        selectedEntity,
        setSelectedEntity,
        sendMessage,
        executeAction,
        confirmation,
        clearConfirmation,
        actionFeedback,
        clearActionFeedback,
        registerTripRefreshCallback,
      }}
    >
      {children}
    </AskVanvasContext.Provider>
  );
};

export const useAskVanvas = (): AskVanvasContextType => {
  const context = useContext(AskVanvasContext);
  if (!context) {
    throw new Error("useAskVanvas must be used within an AskVanvasProvider");
  }
  return context;
};
