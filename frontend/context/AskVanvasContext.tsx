"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
    } else if (pathname.startsWith("/explore/") || pathname.startsWith("/destinations/")) {
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
    if (ctx.type === "trip" && (ctx.destinationName || ctx.trip?.destination?.name)) {
      const dest = ctx.destinationName || ctx.trip?.destination?.name;
      const title = `YOUR ${dest.toUpperCase()} TRIP`;
      const summary = `Your ${dest} trip itinerary is active. What do you need next?`;
      const actions: ActionContract[] = [
        { id: "wt-1", label: "What's next?", action: "query", payload: "What is next on our itinerary right now?", icon: "compass", variant: "primary" },
        { id: "wt-2", label: "Replan today", action: "replan_today", payload: { trip_id: ctx.tripId, action_type: "late" }, icon: "refresh", variant: "secondary" },
      ];

      return {
        id: "welcome-msg",
        role: "assistant",
        text: summary,
        structured: {
          type: "QUICK_TAKE",
          title,
          summary,
          items: [],
          actions,
          provenance: "CURATED",
        },
        timestamp: new Date().toISOString(),
      };
    } else if (ctx.type === "destination" && ctx.destinationName) {
      const dest = ctx.destinationName;
      const title = `${dest.toUpperCase()} · EXPLORATION`;
      const summary = `Curated guide for ${dest}. What are you looking for?`;
      const actions: ActionContract[] = [
        { id: "wd-1", label: "Things to do", action: "query", payload: `Top things to do in ${dest}`, icon: "compass", variant: "primary" },
        { id: "wd-2", label: "Food & Cafes", action: "query", payload: `Best cafes and food in ${dest}`, icon: "food", variant: "secondary" },
        { id: "wd-3", label: "Verified Stays", action: "query", payload: `Verified stays in ${dest}`, icon: "bed", variant: "secondary" },
        { id: "wd-4", label: "Build a day", action: "build_day_plan", payload: { destination: ctx.destinationSlug }, icon: "compass", variant: "primary" },
      ];

      return {
        id: "welcome-msg",
        role: "assistant",
        text: summary,
        structured: {
          type: "QUICK_TAKE",
          title,
          summary,
          items: [],
          actions,
          provenance: "CURATED",
        },
        timestamp: new Date().toISOString(),
      };
    } else if (ctx.type === "road_trip") {
      return {
        id: "welcome-msg",
        role: "assistant",
        text: "Where should we stop next along your driving route?",
        structured: {
          type: "ROUTE",
          title: "ROAD TRIP ROUTE",
          summary: "Where should we stop next along your driving route?",
          items: [],
          actions: [
            { id: "wr-1", label: "Where to stop?", action: "view_road_trip_stops", icon: "map", variant: "primary" },
            { id: "wr-2", label: "Find Dhaba", action: "query", payload: "Best dhaba for lunch on this road trip?", icon: "food", variant: "secondary" },
          ],
          provenance: "ESTIMATED",
        },
        timestamp: new Date().toISOString(),
      };
    } else if (ctx.type === "budget") {
      return {
        id: "welcome-msg",
        role: "assistant",
        text: "Check balances, who owes whom, or record a shared expense.",
        structured: {
          type: "BUDGET",
          title: "BUDGET & SPLIT",
          summary: "Check balances, who owes whom, or record a shared expense.",
          items: [],
          actions: [
            { id: "wb-1", label: "Open Wallet", action: "open_wallet", icon: "wallet", variant: "primary" },
            { id: "wb-2", label: "Who owes me?", action: "query", payload: "Who owes me money on this trip?", icon: "wallet", variant: "secondary" },
          ],
          provenance: "USER ENTERED",
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Default conversational welcome with NO assumed destination or pre-baked place cards
    return {
      id: "welcome-msg",
      role: "assistant",
      text: "What are you looking for?",
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

  const isSendingRef = useRef(false);

  const sendMessage = async (queryText?: string, imageUrl?: string) => {
    const textToSend = (queryText || "").trim();
    if (!textToSend && !imageUrl) return;
    if (loading || isSendingRef.current) return;

    isSendingRef.current = true;

    // Check if user explicitly stated their current location (e.g., "I'm in Indore", "I am in Dehradun")
    const inCityMatch = textToSend.match(/\bi(?:'m| am|m) in ([a-zA-Z\s]+?)(?:\.|$|,|\!)/i) ||
                        textToSend.match(/\bcurrently in ([a-zA-Z\s]+?)(?:\.|$|,|\!)/i);
    if (inCityMatch && inCityMatch[1] && !textToSend.toLowerCase().includes("travelling to") && !textToSend.toLowerCase().includes("traveling to")) {
      const explicitCity = inCityMatch[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
      setCurrentContext((prev) => ({
        ...prev,
        currentLocation: explicitCity,
        currentLocationProvenance: "user_explicit",
      }));
    }

    // Check if user explicitly stated a destination they are travelling to (e.g. "I'm travelling to Manali")
    const travelToMatch = textToSend.match(/\bi(?:'m| am|m) (?:travelling|traveling|heading|going) to ([a-zA-Z\s]+?)(?:\.|$|,|\!)/i) ||
                          textToSend.match(/\bplanning a trip to ([a-zA-Z\s]+?)(?:\.|$|,|\!)/i);
    if (travelToMatch && travelToMatch[1]) {
      const explicitDest = travelToMatch[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
      const explicitSlug = explicitDest.toLowerCase().replace(/\s+/g, "-");
      setCurrentContext((prev) => ({
        ...prev,
        destinationName: explicitDest,
        destinationSlug: explicitSlug,
        destinationProvenance: "user_explicit",
      }));
    }

    // Conversational follow-up resolution (e.g. "Which one is closest?", "Add it")
    const qLower = textToSend.toLowerCase();
    let effectiveQuery = textToSend;

    if (qLower === "add it" || qLower === "add this" || qLower === "add that") {
      const targetItem = selectedEntity || lastResponse?.items?.[0];
      if (targetItem && currentContext.tripId) {
        const targetDay = currentContext.activeDayNumber || 1;
        await executeAction({
          id: `add-it-${Date.now()}`,
          label: `Add ${targetItem.name}`,
          action: "add_place_to_itinerary",
          payload: { place_id: targetItem.placeId || targetItem.id, title: targetItem.name, day: targetDay },
        });
        isSendingRef.current = false;
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

    // Offline safety guard: honestly report unavailable without endless network retries
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const offlineMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: "Ask VANVAS requires an active internet connection.\n\nLive AI queries and discovery are unavailable while offline. Your saved itineraries and offline trip packs remain fully accessible on your device.",
        structured: {
          type: "CLARIFICATION",
          title: "ASK VANVAS UNAVAILABLE OFFLINE",
          summary: "Connect to the internet to chat with Ask VANVAS. Your saved trip details remain accessible.",
          items: [],
          actions: [],
          provenance: "UNAVAILABLE",
          rawText: "Ask VANVAS requires an internet connection.",
        },
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, offlineMsg]);
      isSendingRef.current = false;
      setLoading(false);
      setStatusMessage(null);
      return;
    }

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
      console.warn("Copilot API response handling error:", err);
      const isAuthError =
        err?.status === 401 ||
        err?.message?.toLowerCase().includes("authentication required") ||
        err?.message?.toLowerCase().includes("not authenticated");

      if (isAuthError) {
        const authTitle = "SIGN IN TO ASK VANVAS";
        const authText = "Sign in to chat with Ask VANVAS, receive personalized mountain recommendations, and access live travel intelligence.";
        const authStructured: StructuredAssistantResponse = {
          type: "CLARIFICATION",
          title: authTitle,
          summary: authText,
          items: [],
          actions: [
            { id: "auth-signin", label: "Sign In", action: "navigate", payload: "/login", icon: "compass", variant: "primary" },
            { id: "auth-register", label: "Create Account", action: "navigate", payload: "/register", icon: "compass", variant: "secondary" },
          ],
          provenance: "CURATED",
          rawText: authText,
        };
        setLastResponse(authStructured);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: authText,
            structured: authStructured,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else if (err?.isTimeout || err?.status === 504) {
        const timeoutTitle = "MOUNTAIN ENGINE WAKING UP";
        const timeoutText = "Our mountain reasoning engine is warming up from a brief pause. Please tap Retry below in just a moment.";
        const timeoutStructured: StructuredAssistantResponse = {
          type: "CLARIFICATION",
          title: timeoutTitle,
          summary: timeoutText,
          items: [],
          actions: [
            { id: "retry-query", label: "Retry Now", action: "query", payload: effectiveQuery, icon: "refresh", variant: "primary" },
          ],
          provenance: "UNAVAILABLE",
          rawText: timeoutText,
        };
        setLastResponse(timeoutStructured);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: timeoutText,
            structured: timeoutStructured,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        const fallbackTitle = "TRAVEL INTELLIGENCE TEMPORARILY UNAVAILABLE";
        const fallbackText = err?.message || "Live place discovery is temporarily unavailable. You can still view your saved trip information.\n\nYour trip data is safe.";
        const errorStructured: StructuredAssistantResponse = {
          type: "CLARIFICATION",
          title: fallbackTitle,
          summary: "Live place discovery is temporarily unavailable. Your trip data is safe.",
          items: [],
          actions: [
            { id: "retry-query", label: "Retry", action: "query", payload: effectiveQuery, icon: "refresh", variant: "primary" },
          ],
          provenance: "UNAVAILABLE",
          rawText: fallbackText,
        };
        setLastResponse(errorStructured);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: fallbackText,
            structured: errorStructured,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      isSendingRef.current = false;
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const executeAction = async (actionItem: ActionContract) => {
    const act = actionItem.action;
    const payload = actionItem.payload || {};

    // Explicit Geolocation Permission & Query
    if (act === "request_explicit_gps") {
      try {
        const { getCurrentGPSPosition } = await import("@/lib/locationService");
        const res = await getCurrentGPSPosition();
        if (res.status === "GRANTED" && res.coords) {
          const lat = res.coords.latitude;
          const lng = res.coords.longitude;
          setCurrentContext((prev) => ({
            ...prev,
            coordinates: { lat, lng, label: "Detected GPS Location" },
            currentLocationProvenance: "explicit_geolocation",
          }));
          await sendMessage(`What can I explore near my GPS location [${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E]?`);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              text: "Tell me your area or city instead.",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: "Tell me your area or city instead.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      return;
    }

    if (act === "focus_input") {
      const inputEl = document.querySelector<HTMLInputElement>('input[placeholder*="Ask"]');
      if (inputEl) {
        inputEl.focus();
      }
      return;
    }

    // 1. Direct Query / Follow-up Action
    if (act === "query") {
      const q = typeof payload === "string" ? payload : actionItem.label;
      await sendMessage(q);
      return;
    }

    // 2. Navigation Actions
    if (act === "navigate" && (typeof payload === "string" || payload.path || payload.href)) {
      const dest = typeof payload === "string" ? payload : (payload.path || payload.href);
      router.push(dest);
      closeAskVanvas();
      return;
    }

    if (act === "navigate_destination" && payload.slug) {
      router.push(`/explore/${payload.slug}`);
      closeAskVanvas();
      return;
    }

    if (act === "navigate_trip" && payload.trip_id) {
      router.push(`/trips/${payload.trip_id}`);
      closeAskVanvas();
      return;
    }

    if (act === "open_place" && (payload.slug || payload.id || payload.name)) {
      const destSlug = payload.destination || currentContext.destinationSlug || "manali";
      const placeIdentifier = payload.slug || payload.id || payload.name;
      router.push(`/explore/${destSlug}?place=${encodeURIComponent(placeIdentifier)}`);
      closeAskVanvas();
      return;
    }

    if (act === "open_stays" || act === "view_stays") {
      if (currentContext.tripId) {
        router.push(`/trips/${currentContext.tripId}?tab=stays_rentals`);
      } else {
        const destSlug = currentContext.destinationSlug || payload.destination || "manali";
        router.push(`/explore/${destSlug}?tab=stays`);
      }
      closeAskVanvas();
      return;
    }

    if (act === "open_rentals" || act === "view_rentals") {
      if (currentContext.tripId) {
        router.push(`/trips/${currentContext.tripId}?tab=stays_rentals`);
      } else {
        const destSlug = currentContext.destinationSlug || payload.destination || "manali";
        router.push(`/explore/${destSlug}?tab=rentals`);
      }
      closeAskVanvas();
      return;
    }

    if (act === "open_journal") {
      if (currentContext.tripId) {
        router.push(`/trips/${currentContext.tripId}/journal`);
      } else {
        router.push("/trips");
      }
      closeAskVanvas();
      return;
    }

    if (act === "open_checklist") {
      if (currentContext.tripId) {
        router.push(`/trips/${currentContext.tripId}?tab=checklist`);
      } else {
        router.push("/plan");
      }
      closeAskVanvas();
      return;
    }

    if (act === "open_messages") {
      if (currentContext.tripId) {
        router.push(`/trips/${currentContext.tripId}?tab=group`);
      } else {
        router.push("/circles");
      }
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
      if (currentContext.tripId) {
        const activeDay = currentContext.activeDayNumber || payload.day_number || 1;
        setStatusMessage("Preparing day plan preview...");
        setLoading(true);
        try {
          const preview = await api.previewTripAction(currentContext.tripId, {
            action_type: "SHORT_PLAN",
            target_day_number: activeDay,
          });

          const proposedCount = preview.proposed_items?.length || 0;
          setConfirmation({
            isOpen: true,
            title: `Apply Curated Plan for Day ${activeDay}?`,
            message: `We've prepared a realistic ${proposedCount}-stop plan. Would you like to apply and save this to Day ${activeDay} of your trip?`,
            confirmLabel: "Apply Plan to Trip",
            cancelLabel: "Cancel",
            onConfirm: async () => {
              clearConfirmation();
              setStatusMessage("Applying day plan to your itinerary...");
              setLoading(true);
              try {
                await api.applyTripAction(currentContext.tripId!, {
                  action_type: "SHORT_PLAN",
                  target_day_number: activeDay,
                  reason: "Curated day plan applied via Ask VANVAS",
                  payload_for_apply: preview.payload_for_apply,
                });
                setActionFeedback({ type: "success", message: `Curated plan applied to Day ${activeDay} of your trip!` });
                triggerTripRefresh();
              } catch (err: any) {
                setActionFeedback({ type: "error", message: err.message || "Failed to persist day plan changes." });
              } finally {
                setLoading(false);
                setStatusMessage(null);
              }
            },
            onCancel: clearConfirmation,
          });
        } catch (e: any) {
          setActionFeedback({ type: "error", message: e.message || "Could not generate day plan preview." });
        } finally {
          setLoading(false);
          setStatusMessage(null);
        }
      } else {
        router.push(`/plan?dest=${encodeURIComponent(destSlug)}`);
        closeAskVanvas();
      }
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
        setActionFeedback({ type: "error", message: err.message || "Could not save place." });
      }
      return;
    }

    // 5. Add Place to Itinerary Action
    if (act === "add_place_to_itinerary" || act === "add_to_itinerary") {
      const tripId = payload.trip_id || currentContext.tripId;
      const placeId = payload.place_id || payload.id;
      const day = payload.day || currentContext.activeDayNumber || 1;

      if (!tripId || !placeId) {
        setActionFeedback({ type: "error", message: "Trip or Place not specified." });
        return;
      }

      setStatusMessage("Adding to your itinerary...");
      try {
        await api.addPlaceToItinerary(tripId, placeId, day);
        setActionFeedback({ type: "success", message: `Added to Day ${day} of your trip.` });
        triggerTripRefresh();
      } catch (err: any) {
        setActionFeedback({ type: "error", message: err.message || "Could not add place to trip." });
      } finally {
        setStatusMessage(null);
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
              setActionFeedback({ type: "error", message: "Item ID missing for removal." });
            }
          } catch (err: any) {
            setActionFeedback({ type: "error", message: err.message || "Could not remove stop." });
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
      const dayNumber = payload.day_number || currentContext.activeDayNumber || 1;

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
        setActionFeedback({ type: "success", message: `Day ${dayNumber} itinerary updated!` });
        triggerTripRefresh();

        const resMsg: MessageItem = {
          id: `replan-confirm-${Date.now()}`,
          role: "assistant",
          text: `Day ${dayNumber} successfully replanned.`,
          structured: {
            type: "REPLAN",
            title: "SCHEDULE UPDATED",
            summary: `Day ${dayNumber} timetable compressed and refreshed.`,
            items: [],
            actions: [
              { id: "v-trip", label: "View Updated Itinerary", action: "navigate_trip", payload: { trip_id: tripId }, icon: "compass", variant: "primary" },
            ],
            provenance: "LIVE",
          },
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, resMsg]);
      } catch (err: any) {
        setActionFeedback({ type: "error", message: err.message || "Replan failed. Please try again." });
      } finally {
        setLoading(false);
        setStatusMessage(null);
      }
      return;
    }

    // 8. External Booking Handoff
    if (act === "book_externally") {
      const url = payload.booking_url || payload.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const d = payload.destination || currentContext.destinationSlug || "manali";
        router.push(`/explore/${d}?tab=stays`);
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
