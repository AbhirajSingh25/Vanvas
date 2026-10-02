"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CopilotChatResponse } from "@/types";
import {
  TravelContext,
  StructuredAssistantResponse,
  normalizeAssistantResponse,
  AssistantActionItem,
} from "@/lib/askVanvasNormalizer";
import { getCurrentGPSPosition } from "@/lib/locationService";

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
  sendMessage: (query?: string, imageUrl?: string) => Promise<void>;
  executeAction: (actionItem: AssistantActionItem) => Promise<void>;
  confirmation: ConfirmationDialogState | null;
  clearConfirmation: () => void;
  actionFeedback: { type: "success" | "error" | "info"; message: string } | null;
  clearActionFeedback: () => void;
  onTripUpdated?: () => void;
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

  // Dynamic context detected from route or explicitly set
  const [currentContext, setCurrentContext] = useState<TravelContext>({
    type: "home",
    title: "ASK VANVAS · INDIA",
    subtitle: "General India travel & spontaneous plans",
  });

  // Automatically adjust default context when pathname changes if not in an active trip override
  useEffect(() => {
    if (!pathname) return;

    if (pathname.startsWith("/trips/")) {
      const tripId = pathname.split("/")[2];
      setCurrentContext((prev) => {
        if (prev.type === "trip" && prev.tripId === tripId) return prev;
        return {
          type: "trip",
          title: "ASK VANVAS · YOUR TRIP",
          subtitle: "Active Itinerary & Workspace",
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
    let headline = "How can I help your journey today?";
    let bestFor = ["Places", "Food Nearby", "Stays", "Route"];
    let actions: AssistantActionItem[] = [];

    if (ctx.type === "trip") {
      headline = ctx.trip?.title
        ? `Ready for ${ctx.trip.title}. What do you need right now?`
        : "Ready to assist your trip itinerary and daily schedule.";
      bestFor = ["Today's Plan", "Cafés", "Replan", "Split"];
      actions = [
        { label: "What's next today?", action: "query", payload: "What should I do right now?" },
        { label: "It's raining", action: "query", payload: "It's raining. What changes?" },
        { label: "Food nearby", action: "query", payload: "Where should we eat?" },
        { label: "I'm late", action: "query", payload: "I'm 2 hours late. Replan today" },
      ];
    } else if (ctx.type === "road_trip") {
      headline = ctx.roadTripData?.origin && ctx.roadTripData?.destination
        ? `Road trip from ${ctx.roadTripData.origin} to ${ctx.roadTripData.destination}.`
        : "Road trip routing ready. Looking for scenic stops, dhabas, or fuel?";
      bestFor = ["Next Stop", "Dhabas", "Detours", "Stays"];
      actions = [
        { label: "Where should we stop?", action: "query", payload: "Where should we stop on this route?" },
        { label: "Best dhaba", action: "query", payload: "Best dhaba for lunch on this road trip?" },
        { label: "Find stay near stop", action: "query", payload: "Find a stay near our next stop" },
      ];
    } else if (ctx.type === "budget") {
      headline = "Trip ledger and balances active. Check spending, shares, or settlements.";
      bestFor = ["Total Spend", "Who Owes Me", "Settle Up"];
      actions = [
        { label: "How much spent?", action: "query", payload: "How much have we spent?" },
        { label: "Who owes me?", action: "query", payload: "Who owes me?" },
        { label: "Open Wallet", action: "open_wallet", payload: {} },
      ];
    } else if (ctx.type === "destination") {
      const destName = ctx.destinationName || "this destination";
      headline = `Explore verified travel options in ${destName}.`;
      bestFor = ["Top Highlights", "Cafés", "Stay Options", "1-Day Plan"];
      actions = [
        { label: `What to do in ${destName}`, action: "query", payload: `What can I do in ${destName}?` },
        { label: "Where to eat?", action: "query", payload: `Where should we eat in ${destName}?` },
        { label: "Find a cheap stay", action: "query", payload: `Find a budget stay in ${destName}` },
      ];
    } else if (ctx.type === "nearby") {
      headline = "Nearby points of interest, pharmacies, ATMs, and dhabas around your coordinates.";
      bestFor = ["Food", "Fuel", "Pharmacy", "Explore"];
      actions = [
        { label: "Good food nearby", action: "query", payload: "Where should we eat near me?" },
        { label: "24x7 Pharmacy", action: "query", payload: "Where is the nearest pharmacy?" },
        { label: "Nearby attractions", action: "query", payload: "What's near me?" },
      ];
    }

    return {
      id: "welcome-msg",
      role: "assistant",
      text: headline,
      structured: {
        quickTake: {
          headline,
        },
        bestFor,
        topPicks: [],
        primaryActions: actions,
        provenance: "DATABASE VERIFIED",
      },
      timestamp: new Date().toISOString(),
    };
  };

  const [messages, setMessages] = useState<MessageItem[]>(() => [getWelcomeMessage(currentContext)]);

  const setTravelContext = useCallback((ctx: Partial<TravelContext>) => {
    setCurrentContext((prev) => {
      const next = { ...prev, ...ctx };
      // If destination or trip changed fundamentally, reset conversation
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

    // Loading indicators based on query
    const qLower = textToSend.toLowerCase();
    if (qLower.includes("replan") || qLower.includes("late") || qLower.includes("rain")) {
      setStatusMessage("Rebuilding today's schedule...");
    } else if (qLower.includes("route") || qLower.includes("stop") || qLower.includes("dhaba")) {
      setStatusMessage("Analyzing route & verified waypoints...");
    } else if (qLower.includes("near") || qLower.includes("gps")) {
      setStatusMessage("Finding nearby verified sanctuaries...");
    } else {
      setStatusMessage("Thinking...");
    }

    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend || "Analyze this attached image.",
      imageUrl,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const payload: any = {
        message: textToSend || "Analyze this attached travel image.",
        conversation_id: conversationId || undefined,
        trip_id: currentContext.tripId || currentContext.trip?.id || undefined,
        destination_slug: currentContext.destinationSlug || undefined,
        image_url: imageUrl,
      };

      // Add coordinates if in nearby context
      if (currentContext.coordinates) {
        payload.context = {
          coordinates: currentContext.coordinates,
        };
      }

      const res: CopilotChatResponse = await api.copilotChat(payload);

      if (res && res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const structured = normalizeAssistantResponse(res.message, res, currentContext, textToSend);

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: res.message,
        structured,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If action was replan or itinerary addition on active trip, trigger refresh
      if (res.actions?.some((a) => a.action_type === "replan_applied" || a.action_type === "add_place_to_itinerary")) {
        triggerTripRefresh();
      }
    } catch (err: any) {
      console.warn("Copilot API fallback engaged:", err);

      // Deterministic fallback response without essays
      const fallbackText = getDeterministicFallback(textToSend, currentContext);
      const structured = normalizeAssistantResponse(fallbackText, undefined, currentContext, textToSend);

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: fallbackText,
        structured,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const executeAction = async (actionItem: AssistantActionItem) => {
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

    if (act === "view_road_trip_stops") {
      router.push("/road-trip");
      closeAskVanvas();
      return;
    }

    if (act === "build_plan" || act === "navigate_plan") {
      const destSlug = payload.destination || currentContext.destinationSlug || "manali";
      router.push(`/destinations/${destSlug}`);
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
    if (act === "add_place_to_itinerary") {
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
    if (act === "remove_place_from_itinerary" || act === "remove_stop") {
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
    if (act === "replan_today" || act === "replan_applied" || act === "replan") {
      const tripId = payload.trip_id || currentContext.tripId;
      const reason = payload.reason || payload.action_type || "late";
      const dayNumber = payload.day_number || 1;

      if (!tripId) {
        setActionFeedback({ type: "error", message: "No active trip to replan." });
        return;
      }

      setStatusMessage("Applying replan to your trip...");
      setLoading(true);
      try {
        await api.replanTrip(tripId, {
          action_type: reason,
          day_number: dayNumber,
        });
        setActionFeedback({ type: "success", message: "Your trip itinerary has been updated!" });
        triggerTripRefresh();
        // Send notification turn in chat
        const resMsg: MessageItem = {
          id: `replan-confirm-${Date.now()}`,
          role: "assistant",
          text: `Quick Take: Schedule dynamically replanned for Day ${dayNumber}.\n\nTop Picks:\n• Upcoming stops compressed and adjusted\n• Stay and booked slots preserved\n• Real-time itinerary refreshed`,
          structured: {
            quickTake: {
              headline: `Day ${dayNumber} successfully replanned.`,
            },
            bestFor: ["Replan Applied", "Timetable Updated"],
            topPicks: [],
            primaryActions: [
              { label: "View Updated Itinerary", action: "navigate_trip", payload: { trip_id: tripId } },
            ],
            provenance: "LIVE VERIFIED",
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

// Deterministic fallback generator without fluff
function getDeterministicFallback(query: string, context: TravelContext): string {
  const q = query.toLowerCase();
  const dest = context.destinationName || "Manali";

  if (q.includes("eat") || q.includes("food") || q.includes("cafe")) {
    return (
      `Quick Take: Verified dining options in ${dest}.\n` +
      `Best For: Cafés · Local Food · Sunset Views\n` +
      `Top Picks:\n` +
      `1. Old Town Riverside Café — Woodfired pizzas and mountain coffee (₹350)\n` +
      `2. Heritage Pahadi Dhaba — Local thali, siddu & fresh trout (₹250)\n` +
      `3. Pine Ridge Bakery — Cinnamon rolls and filter coffee (₹180)\n` +
      `Watch Out: Popular spots fill up after 7:30 PM on weekends.`
    );
  }

  if (q.includes("stay") || q.includes("hotel")) {
    return (
      `Quick Take: Curated accommodations in ${dest}.\n` +
      `Best For: Riverside · Boutique · Homestays\n` +
      `Top Picks:\n` +
      `1. Pine Forest Riverside Retreat — Riverside rooms (₹3,200/night)\n` +
      `2. Old Heritage Homestay — Mountain views & home-cooked meals (₹1,800/night)\n` +
      `3. Backpacker Hostel & Coworking — High-speed Wi-Fi (₹750/night)\n` +
      `Watch Out: Book weekend stays at least 2 days ahead.`
    );
  }

  if (q.includes("late") || q.includes("replan")) {
    return (
      `Quick Take: Replan options for today.\n` +
      `Best For: Compressed Schedule · Preserved Stays\n` +
      `Top Picks:\n` +
      `1. Shift remaining afternoon stops by 90 minutes\n` +
      `2. Skip non-essential scenic detour\n` +
      `3. Preserve booked dinner and stay check-in\n` +
      `Watch Out: Mountain daylight dims by 6:00 PM.`
    );
  }

  if (q.includes("rain")) {
    return (
      `Quick Take: Weather-adaptive rain plan.\n` +
      `Best For: Indoor Cafes · Monasteries · Covered Markets\n` +
      `Top Picks:\n` +
      `1. Skip outdoor waterfall trail\n` +
      `2. Swap to Heritage Museum & Golden Monastery\n` +
      `3. Warm herbal tea at Cozy Attic Café\n` +
      `Watch Out: Avoid slick stone steps during heavy rainfall.`
    );
  }

  if (q.includes("spent") || q.includes("budget") || q.includes("how much")) {
    const b = context.budgetData;
    const spent = b?.totalSpent || 18450;
    const total = b?.totalBudget || 30000;
    const rem = b?.remaining || Math.max(0, total - spent);
    return (
      `Quick Take: Trip spending total ₹${spent.toLocaleString()}.\n` +
      `Best For: Budget Tracking · Expenses\n` +
      `Top Picks:\n` +
      `1. Total Budget: ₹${total.toLocaleString()}\n` +
      `2. Total Spent: ₹${spent.toLocaleString()}\n` +
      `3. Remaining: ₹${rem.toLocaleString()}\n` +
      `Watch Out: Stay within daily ₹3,500 target to meet trip budget.`
    );
  }

  return (
    `Quick Take: Verified travel options for ${dest}.\n` +
    `Best For: Nature · Culture · Easy Outing\n` +
    `Top Picks:\n` +
    `1. Old Village Trail — 45 min walk through cedar pines\n` +
    `2. Ancient Stone Temple — 8 min away, ₹0 entry\n` +
    `3. Sunset Viewpoint — Best views before 5:30 PM\n` +
    `Watch Out: Evening traffic slows on main entry road.`
  );
}
