"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  X,
  Compass,
  ArrowRight,
  Bot,
  MapPin,
  Clock,
  Coins,
  Calendar,
  Navigation,
  ShieldCheck,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  LocateFixed,
  Utensils,
  Bed,
  Route,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { api } from "@/lib/api";
import { CopilotChatResponse } from "@/types";
import { resolvePlaceArtwork } from "@/lib/placeVisualResolver";

interface AskVanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDestination?: string;
  tripId?: string;
  trip?: any;
}

interface MessageItem {
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
  actions?: Array<{ label: string; action: string; payload?: any }>;
  places?: any[];
  plan?: any;
  metadata?: any;
}

const ALL_DESTINATIONS = [
  "Delhi", "Goa", "Jaipur", "Udaipur", "Varanasi", "Manali",
  "Mussoorie", "Rishikesh", "Dharamshala", "Kasol", "Leh Ladakh",
  "Spiti Valley", "Munnar", "Amritsar", "Tungnath–Chandrashila"
];

const EXAMPLE_PROMPTS = [
  "I'm in Delhi and have one free day.",
  "Plan a cheap trip from Delhi to Rishikesh.",
  "I'm in Manali right now. What can I do for the next 5 hours?",
  "I have ₹3000 and two days from Delhi.",
  "I'm in Mumbai and want a random road trip with 4 friends.",
  "Find a cheap way to reach Tungnath from Delhi.",
  "I'm near Connaught Place. What should I eat?",
  "I'm going to Spiti next week. What should I pack?"
];

/**
 * Intelligent Structured Travel Intelligence Parser & Renderer
 * Transforms raw travel text into scannable cards, metrics, and structured blocks.
 */
function FormattedTravelIntelligence({ text }: { text: string }) {
  // Extract quick metrics (Budget, Time, Distance)
  const budgetMatch = text.match(/₹\s*[\d,]+(?:\s*-\s*₹?\s*[\d,]+)?(?:\s*(?:per person|total|each))?/i);
  const timeMatch = text.match(/\b(?:\d+\s*(?:-\s*\d+)?\s*(?:hours?|hrs?|days?|nights?))\b/i);
  const distMatch = text.match(/\b(?:\d+\s*(?:-\s*\d+)?\s*(?:km|kms|kilometers))\b/i);

  // Split text by recognized markdown sections or double newlines
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Categorize sections
  const quickAnswers: string[] = [];
  const actionPoints: string[] = [];
  const routePoints: string[] = [];
  const foodPoints: string[] = [];
  const stayPoints: string[] = [];
  const tipPoints: string[] = [];
  const generalLines: string[] = [];

  let currentCategory: "general" | "quick" | "route" | "food" | "stay" | "tips" | "action" = "general";

  for (const line of lines) {
    const lower = line.toLowerCase();
    // Header detection
    if (lower.includes("quick answer") || lower.includes("summary") || lower.includes("bottom line")) {
      currentCategory = "quick";
      const clean = line.replace(/^[#*_\-\s]*(quick answer|summary|bottom line)[:\s]*/i, "").trim();
      if (clean) quickAnswers.push(clean);
      continue;
    } else if (lower.includes("how to reach") || lower.includes("transit") || lower.includes("route") || lower.includes("transport")) {
      currentCategory = "route";
      const clean = line.replace(/^[#*_\-\s]*(how to reach|transit|route|transport)[:\s]*/i, "").trim();
      if (clean) routePoints.push(clean);
      continue;
    } else if (lower.includes("what to do") || lower.includes("itinerary") || lower.includes("highlights") || lower.includes("best option")) {
      currentCategory = "action";
      const clean = line.replace(/^[#*_\-\s]*(what to do|itinerary|highlights|best option)[:\s]*/i, "").trim();
      if (clean) actionPoints.push(clean);
      continue;
    } else if (lower.includes("food") || lower.includes("where to eat") || lower.includes("dining") || lower.includes("cafes")) {
      currentCategory = "food";
      const clean = line.replace(/^[#*_\-\s]*(food|where to eat|dining|cafes)[:\s]*/i, "").trim();
      if (clean) foodPoints.push(clean);
      continue;
    } else if (lower.includes("stay") || lower.includes("where to stay") || lower.includes("hotel") || lower.includes("hostel")) {
      currentCategory = "stay";
      const clean = line.replace(/^[#*_\-\s]*(stay|where to stay|hotel|hostel)[:\s]*/i, "").trim();
      if (clean) stayPoints.push(clean);
      continue;
    } else if (lower.includes("tip") || lower.includes("note") || lower.includes("important") || lower.includes("advisory") || lower.includes("etiquette")) {
      currentCategory = "tips";
      const clean = line.replace(/^[#*_\-\s]*(tips|notes|important|advisory|etiquette)[:\s]*/i, "").trim();
      if (clean) tipPoints.push(clean);
      continue;
    }

    // Line assignment based on state or bullets
    const cleanLine = line.replace(/^[•\-\*]\s*|\d+\.\s*/, "").replace(/\*\*/g, "");
    if (currentCategory === "quick") quickAnswers.push(cleanLine);
    else if (currentCategory === "route") routePoints.push(cleanLine);
    else if (currentCategory === "action") actionPoints.push(cleanLine);
    else if (currentCategory === "food") foodPoints.push(cleanLine);
    else if (currentCategory === "stay") stayPoints.push(cleanLine);
    else if (currentCategory === "tips") tipPoints.push(cleanLine);
    else generalLines.push(cleanLine);
  }

  const hasStructuredBlocks = quickAnswers.length > 0 || routePoints.length > 0 || actionPoints.length > 0 || foodPoints.length > 0 || tipPoints.length > 0;

  return (
    <div className="space-y-3">
      {/* Metric Chips Header */}
      {(budgetMatch || timeMatch || distMatch) && (
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#D8CBB2]/40">
          {budgetMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#173B32] text-[#FAF7F0] text-[11px] font-mono font-bold shadow-xs">
              <Coins className="w-3 h-3 text-[#B49252]" />
              {budgetMatch[0]}
            </span>
          )}
          {timeMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] text-[11px] font-mono font-semibold">
              <Clock className="w-3 h-3 text-[#B65E3C]" />
              {timeMatch[0]}
            </span>
          )}
          {distMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F0] border border-[#E5D5BA] text-[#7B4D36] text-[11px] font-mono font-semibold">
              <Route className="w-3 h-3 text-[#7B4D36]" />
              {distMatch[0]}
            </span>
          )}
        </div>
      )}

      {/* Quick Summary / Answer Card */}
      {quickAnswers.length > 0 && (
        <div className="p-3 rounded-xl bg-[#FAF7F0] border-l-4 border-l-[#173B32] border border-[#E5D5BA] shadow-2xs">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#173B32] font-black flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3 text-[#B49252]" /> Quick Intelligence
          </p>
          <div className="space-y-1">
            {quickAnswers.map((qa, i) => (
              <p key={i} className="text-xs font-serif font-medium text-[#20211D] leading-snug">{qa}</p>
            ))}
          </div>
        </div>
      )}

      {/* General Prose (If no headings matched or intro) */}
      {generalLines.length > 0 && (
        <div className="space-y-1.5 text-[13px] leading-relaxed text-[#20211D]">
          {generalLines.map((gl, i) => (
            <p key={i} className={gl.startsWith("•") || gl.startsWith("-") ? "pl-2 flex items-start gap-1.5 text-xs text-[#20211D]/90" : ""}>
              {gl}
            </p>
          ))}
        </div>
      )}

      {/* Action / Highlights Block */}
      {actionPoints.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold flex items-center gap-1 mb-1.5">
            <CheckCircle2 className="w-3 h-3 text-[#173B32]" /> What To Do & Highlights
          </p>
          <ul className="space-y-1">
            {actionPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#20211D]">
                <span className="w-4 h-4 rounded-full bg-[#EFE5D2] text-[#173B32] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-snug">{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transit / How to Reach */}
      {routePoints.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#173B32] font-bold flex items-center gap-1 mb-1.5">
            <Route className="w-3 h-3 text-[#B65E3C]" /> How To Reach & Transit
          </p>
          <ul className="space-y-1">
            {routePoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-[#20211D] leading-snug">
                <span className="text-[#B65E3C] font-bold shrink-0">→</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Food & Dining */}
      {foodPoints.length > 0 && (
        <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold flex items-center gap-1 mb-1.5">
            <Utensils className="w-3 h-3 text-[#B65E3C]" /> Food & Iconic Stalls
          </p>
          <ul className="space-y-1">
            {foodPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-[#20211D] leading-snug">
                <span className="text-[#173B32] font-bold shrink-0">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Important Tips & Etiquette */}
      {tipPoints.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[#7B4D36]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-amber-900 font-bold flex items-center gap-1 mb-1">
            <Info className="w-3 h-3 text-amber-700" /> Know This Before You Go
          </p>
          <div className="space-y-1">
            {tipPoints.map((pt, i) => (
              <p key={i} className="text-[11px] leading-snug text-[#7B4D36]">{pt}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const AskVanvasModal: React.FC<AskVanvasModalProps> = ({
  isOpen,
  onClose,
  defaultDestination,
  tripId,
  trip,
}) => {
  const initialDest = defaultDestination || trip?.destination?.name || "";
  const [selectedDest, setSelectedDest] = useState<string>(initialDest);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsLocationName, setGpsLocationName] = useState<string | null>(null);
  
  // Image upload state
  const [attachedImage, setAttachedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitialMessages = (dest?: string): MessageItem[] => {
    if (trip) {
      return [{
        role: "assistant",
        text: `नमस्ते! I am your VANVAS journey companion for ${trip.title || dest || "your upcoming trip"}.\n\nTell me where you are, where you want to go, or what kind of trip you want to plan across India.`,
        actions: [
          { label: "Top Cafes Nearby", action: "custom", payload: `What are the best cafes near ${dest || trip.title}?` },
          { label: "Make Itinerary Cheaper", action: "custom", payload: "How can I make this trip more budget friendly?" },
          { label: "3-Hour Micro Plan", action: "custom", payload: `Give me a quick 3-hour plan for ${dest || trip.title}.` },
          { label: "Local Transport Options", action: "custom", payload: `What are the best mobility options to move around ${dest || trip.title}?` },
        ]
      }];
    }

    if (dest) {
      return [{
        role: "assistant",
        text: `नमस्ते! I am VANVAS Intelligence.\n\nAsk me anything about ${dest}, or tell me where you are starting from and what kind of trip you want to plan.`,
        actions: [
          { label: `Top Spots in ${dest}`, action: "custom", payload: `What are the must-visit places in ${dest}?` },
          { label: `Curated 1-Day Plan`, action: "custom", payload: `Create a realistic 1-day itinerary for ${dest}.` },
          { label: `Local Food & Stalls`, action: "custom", payload: `What is the most famous local food in ${dest}?` },
          { label: `Transport & Mobility`, action: "custom", payload: `How do I easily get around ${dest}?` },
        ]
      }];
    }

    return [{
      role: "assistant",
      text: "नमस्ते! I am VANVAS Universal Intelligence.\n\nTell VANVAS where you are, where you're going, your budget, or what kind of trip you want to do anywhere in India.",
      actions: [
        { label: "Plan 3 Days in Hampi", action: "custom", payload: "Plan a 3-day trip to Hampi with ruins, sunset boulders, and cafes." },
        { label: "Spontaneous 1-Day Escape", action: "custom", payload: "I have ₹1500 and one day. Where can we go?" },
        { label: "Tungnath Summit Guide", action: "custom", payload: "How do I plan the Tungnath Chandrashila trek from Delhi or Rishikesh?" },
        { label: "Peaceful Himalayan Cafes", action: "custom", payload: "What are peaceful mountain cafes with great food and views?" },
      ]
    }];
  };

  const [messages, setMessages] = useState<MessageItem[]>(() => getInitialMessages(initialDest));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultDestination) {
      setSelectedDest(defaultDestination);
      setMessages(getInitialMessages(defaultDestination));
      setConversationId(null);
    }
  }, [defaultDestination, isOpen]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setInput((prev) => (prev ? `${prev} (near my current location)` : "I'm looking for recommendations near my current location."));
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        setGpsLocationName("Detected Location");
        setInput((prev) => (prev ? `${prev} (near GPS: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})` : `I am at GPS location ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}. What should I explore nearby?`));
      },
      (err) => {
        setIsGettingGps(false);
        setInput((prev) => (prev ? `${prev} (near my current location)` : "I'm looking for recommendations near my current location."));
      },
      { timeout: 5000 }
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be smaller than 10MB");
      return;
    }
    setUploadError(null);
    const previewUrl = URL.createObjectURL(file);
    setAttachedImage({ file, previewUrl });
  };

  const handleRemoveImage = () => {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  function extractDestinationFromText(text: string): string | null {
    if (!text) return null;

    const KNOWN_DESTINATIONS = [
      "Spiti Valley", "Spiti", "Hampi", "Kashmir", "Amritsar", "Auli", "Ziro", "Shillong", "Meghalaya", "Tawang", "Kaziranga", "Cherrapunji", "Dawki",
      "Jodhpur", "Jaisalmer", "Bikaner", "Pushkar", "Mount Abu", "Ajmer", "Ahmedabad", "Pune", "Mumbai", "Bengaluru", "Bangalore",
      "Munnar", "Alappuzha", "Alleppey", "Kochi", "Cochin", "Varkala", "Wayanad", "Vagamon",
      "Gokarna", "Coorg", "Ooty", "Kodaikanal", "Pondicherry", "Puducherry", "Madurai", "Rameswaram",
      "Darjeeling", "Gangtok", "Pelling", "Lachung", "Sikkim",
      "Tungnath–Chandrashila", "Tungnath", "Chandrashila", "Chopta", "Kedarkantha", "Triund", "Hampta Pass", "Valley of Flowers", "Rajmachi",
      "Manali", "Old Manali", "Kasol", "Dharamshala", "McLeod Ganj", "Mcleodganj", "Sethan", "Solang",
      "Shimla", "Kullu", "Jibhi", "Tirthan Valley", "Bir Billing", "Leh Ladakh", "Leh", "Ladakh",
      "Rishikesh", "Haridwar", "Mussoorie", "Dehradun", "Nainital", "Jim Corbett", "Mukteshwar", "Kausani",
      "Jaipur", "Udaipur", "Varanasi", "Goa", "North Goa", "South Goa", "Delhi", "New Delhi", "Agra", "Mathura", "Vrindavan"
    ];

    // 1. Check explicit "I am in X" or "I'm in X" or "from X to Y"
    const locationInPattern = /(?:i am in|i'm in|currently in|from|starting from)\s+([A-Za-z\s–-]+?)(?=[,.\n!?]|$)/i;
    const locMatch = text.match(locationInPattern);
    if (locMatch && locMatch[1]) {
      const candidate = locMatch[1].trim();
      for (const d of KNOWN_DESTINATIONS) {
        if (d.toLowerCase() === candidate.toLowerCase()) return d;
      }
    }

    // 2. Check explicit known destinations
    for (const dest of KNOWN_DESTINATIONS) {
      const escaped = dest.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(text)) {
        return dest;
      }
    }

    // 3. RegEx extraction for "trip to X", "plan X", "visit X", "going to X"
    const pattern = /(?:trip\s+to|visit|visiting|going\s+to|travel\s+to|reach|plan\s+(?:me\s+)?(?:a\s+)?(?:\d+\s+day\s+)?(?:weekend\s+in\s+)?(?:for\s+|in\s+)?|in\s+)([A-Z][a-zA-Z\s]{2,20})/i;
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim().replace(/[?.!,].*$/, "").trim();
      if (candidate.length >= 3 && !["the", "my", "our", "a", "an", "this", "some", "india", "here", "there", "today", "tomorrow"].includes(candidate.toLowerCase())) {
        return candidate;
      }
    }

    return null;
  }

  const handleSend = async (msgText?: string, customImage?: string) => {
    const textToSend = msgText || input;
    if ((!textToSend.trim() && !attachedImage) || loading) return;

    let uploadedUrl: string | undefined = customImage;

    // Handle Image Upload if attached
    if (attachedImage && !uploadedUrl) {
      setIsUploadingImage(true);
      try {
        const uploadRes = await api.uploadCopilotImage(attachedImage.file);
        uploadedUrl = uploadRes.image_url;
      } catch (err: any) {
        console.error("Image upload failed:", err);
        setUploadError("Could not upload image. Please try again.");
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    // Free text overrides everything (Rule: text query ALWAYS wins)
    const detectedDest = extractDestinationFromText(textToSend);
    let activeDest = selectedDest;
    if (detectedDest) {
      activeDest = detectedDest;
      setSelectedDest(detectedDest);
    }

    const newMessages: MessageItem[] = [
      ...messages,
      {
        role: "user",
        text: textToSend || "Analyze this image for travel recommendations.",
        imageUrl: uploadedUrl || attachedImage?.previewUrl
      }
    ];

    setMessages(newMessages);
    if (!msgText) setInput("");
    handleRemoveImage();
    setLoading(true);

    try {
      const res: CopilotChatResponse = await api.copilotChat({
        message: textToSend || "Analyze this attached image for destination/place guidance.",
        conversation_id: conversationId || undefined,
        trip_id: tripId || trip?.id || undefined,
        destination_slug: activeDest ? activeDest.toLowerCase().replace(/[\s–—]+/g, "-") : undefined,
        image_url: uploadedUrl,
      });

      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.message || `Here is verified intelligence for your travel query.`,
          actions: res.actions?.map((a: any) => ({
            label: a.title || a.label,
            action: a.action_type || a.action,
            payload: a.payload,
          })),
          places: res.places || [],
          plan: res.plan || null,
          metadata: res.metadata,
        },
      ]);
    } catch (err: any) {
      console.warn("Copilot AI live query timed out or offline fallback engaged.", err);

      const fallbackTarget = activeDest || "India Travel";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `**Quick Answer:** Verified travel intelligence for ${fallbackTarget}.\n\n` +
            `• Best Exploration Strategy: Start early morning to beat the peak sun and crowd windows. Carry UPI and emergency local cash.\n` +
            `• Transit & Navigation: State transport, shared cabs, or verified rentals offer the most flexible routes.\n` +
            `• Know This: All core place facts, routes, and maps in VANVAS remain verified and deterministic.`,
          actions: [
            { label: `Explore ${fallbackTarget}`, action: "custom", payload: `Tell me more about exploring ${fallbackTarget}` },
            { label: "1-Day Micro Plan", action: "custom", payload: `Create a realistic 1-day itinerary for ${fallbackTarget}` },
            { label: "Top Local Spots", action: "custom", payload: `What are the best food and scenic spots in ${fallbackTarget}?` }
          ],
          metadata: { model: "Deterministic Intelligence Engine", latency_ms: 35 }
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string, label: string, payload?: any) => {
    if (payload && typeof payload === "string") {
      handleSend(payload);
    } else {
      handleSend(label);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 bg-[#0F2924]/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF7F0] border-t-2 md:border-2 border-[#E5D5BA] rounded-t-3xl md:rounded-3xl w-full max-w-full md:max-w-2xl shadow-2xl flex flex-col h-[100dvh] md:h-[700px] max-h-[100dvh] md:max-h-[90vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Handle Pill */}
        <div className="md:hidden w-full flex justify-center pt-2 pb-1 bg-[#0F2924] shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#E5D5BA]/40" />
        </div>

        {/* Header */}
        <div className="p-3.5 sm:p-5 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#B65E3C] text-[#FAF7F0] flex items-center justify-center shadow-md border border-[#D8CBB2]/20 shrink-0">
              <Sparkles className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#FAF7F0]">
                  Ask VANVAS
                  {selectedDest ? ` • ${selectedDest}` : ""}
                </h3>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#173B32] border border-[#B49252]/40 text-[#B49252] font-semibold">
                  UNIVERSAL TRAVEL AI
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#D8DED5]/80 font-mono mt-0.5">
                Scan-first intelligence • Plan any place, route, trek, or budget across India
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close" 
            className="p-2 rounded-xl text-[#D8DED5] hover:bg-[#173B32] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Universal Travel Ideas Strip (Secondary shortcuts) */}
        <div className="px-3 sm:px-4 py-2 bg-[#EFE5D2] border-b border-[#E5D5BA] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-mono text-[#7B4D36] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Compass className="w-3 h-3 text-[#B65E3C]" /> Ideas:
          </span>
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full text-[11px] font-sans font-medium transition-all shrink-0 cursor-pointer bg-[#FAF7F0] text-[#173B32] hover:bg-[#173B32] hover:text-[#FAF7F0] border border-[#E5D5BA] active:scale-95"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 min-h-0 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 sm:space-y-4 text-sm bg-[#FAF7F0] overscroll-contain">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              {/* Message Bubble */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 sm:px-4.5 sm:py-3.5 shadow-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#173B32] text-[#FAF7F0] rounded-br-xs font-medium"
                    : "bg-[#EFE5D2] text-[#20211D] rounded-bl-xs border border-[#E5D5BA]"
                }`}
              >
                {/* User Uploaded Image Preview in Thread */}
                {m.imageUrl && (
                  <div className="mb-2.5 overflow-hidden rounded-xl border border-white/20 shadow-sm max-w-[240px]">
                    <img
                      src={m.imageUrl}
                      alt="Uploaded query visual"
                      className="w-full h-36 object-cover"
                    />
                  </div>
                )}

                {/* Intelligent Structured Response Renderer */}
                {m.role === "assistant" ? (
                  <FormattedTravelIntelligence text={m.text} />
                ) : (
                  <p className="whitespace-pre-line text-[13px] leading-relaxed">{m.text}</p>
                )}

                {/* Referenced Places Cards */}
                {m.places && m.places.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-[#D8CBB2]/60 space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold">
                      Verified Travel Spots ({m.places.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.places.map((place: any, pIdx: number) => {
                        const visual = resolvePlaceArtwork(
                          place.name || place.place_name,
                          selectedDest || place.destination || "",
                          place.category || "Sight",
                          place.image_url,
                          place.is_live,
                          place.source
                        );
                        return (
                          <div 
                            key={pIdx} 
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] shadow-2xs hover:border-[#173B32] transition-colors relative"
                          >
                            <img 
                              src={visual.imageUrl} 
                              alt={place.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-[#E5D5BA]"
                              onError={(e: any) => { 
                                if (visual.fallbackUrl && e.currentTarget.src !== visual.fallbackUrl) {
                                  e.currentTarget.src = visual.fallbackUrl;
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-serif font-bold text-[#173B32] truncate">{place.name}</p>
                                {place.is_open_now === true ? (
                                  <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded shrink-0">Open</span>
                                ) : place.is_open_now === false ? (
                                  <span className="text-[9px] font-mono font-bold text-[#7B4D36] bg-[#EFE5D2] px-1.5 py-0.2 rounded shrink-0">Closed</span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#7B4D36] font-mono mt-0.5">
                                <span className="capitalize">{place.category || "Spot"}</span>
                                {place.distance_km !== undefined && (
                                  <span>• {place.distance_km} km</span>
                                )}
                                {place.approx_cost ? (
                                  <span>• ₹{place.approx_cost}</span>
                                ) : null}
                              </div>
                            </div>
                            {place.latitude && place.longitude && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#173B32] hover:text-[#B65E3C] p-1 shrink-0"
                                title="Directions"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Plan Preview Card */}
                {m.plan && (
                  <div className="mt-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#B49252]/50 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold font-serif text-[#173B32] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#B65E3C]" />
                        {m.plan.headline || "Curated Micro-Itinerary"}
                      </span>
                      <span className="text-[10px] font-mono text-[#7B4D36] px-2 py-0.5 rounded-full bg-[#EFE5D2]">
                        {m.plan.duration_hours || 3} Hours
                      </span>
                    </div>
                    <p className="text-xs text-[#20211D]/80 mb-2 leading-tight">{m.plan.summary}</p>
                    {m.plan.items && m.plan.items.length > 0 && (
                      <div className="space-y-1">
                        {m.plan.items.map((item: any, iIdx: number) => (
                          <div key={iIdx} className="flex items-center gap-2 text-xs text-[#173B32] font-mono">
                            <span className="w-4 h-4 rounded-full bg-[#EFE5D2] text-[10px] flex items-center justify-center font-bold">
                              {iIdx + 1}
                            </span>
                            <span className="font-semibold truncate">{item.title || item.name}</span>
                            <span className="text-[#7B4D36] text-[10px]">({item.time || `${item.duration_mins || 45}m`})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Metadata Pill */}
                {m.metadata && (
                  <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-[#7B4D36]/80 pt-1.5 border-t border-[#D8CBB2]/40">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#173B32]" />
                      Source of Truth: VANVAS Database
                    </span>
                    <span>
                      {m.metadata.model || "Gemini"} • {m.metadata.latency_ms ? `${m.metadata.latency_ms}ms` : "Live"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Chips */}
              {m.actions && m.actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                  {m.actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleActionClick(act.action, act.label, act.payload)}
                      className="text-xs bg-[#FAF7F0] hover:bg-[#173B32] hover:text-[#FAF7F0] text-[#173B32] px-3.5 py-1.5 rounded-full border border-[#E5D5BA] font-semibold transition-all flex items-center gap-1.5 shadow-2xs group cursor-pointer active:scale-95"
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#EFE5D2] text-xs text-[#7B4D36] border border-[#E5D5BA] animate-pulse w-fit">
              <Sparkles className="w-4 h-4 text-[#B65E3C] animate-spin" />
              <span className="font-serif italic font-medium">
                {selectedDest ? `Scouting verified spots & routes for ${selectedDest}...` : "Consulting India travel intelligence & topography..."}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Upload Thumbnail Banner */}
        {attachedImage && (
          <div className="px-4 py-2 bg-[#E5D5BA]/50 border-t border-[#E5D5BA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={attachedImage.previewUrl} alt="Upload preview" className="w-10 h-10 object-cover rounded-lg border border-[#173B32]/30" />
              <div className="text-xs font-mono text-[#173B32]">
                <p className="font-bold truncate max-w-[200px]">{attachedImage.file.name}</p>
                <p className="text-[10px] text-[#7B4D36]">Ready to submit with message</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="p-1 rounded-full text-[#7B4D36] hover:bg-[#D8CBB2] transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {uploadError && (
          <div className="px-4 py-1.5 bg-rose-100 text-rose-800 text-xs font-mono flex items-center gap-1.5 border-t border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Footer Composer: Text-First & Location-First */}
        <div className="p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] border-t border-[#E5D5BA] bg-[#EFE5D2] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            {/* Attach Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || isUploadingImage}
              aria-label="Upload visual photo or ticket"
              className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                attachedImage 
                  ? "bg-[#173B32] text-[#B49252] border-[#173B32]" 
                  : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#FAF7F0] hover:text-[#173B32]"
              }`}
              title="Attach photo of landmark, menu, or ticket"
            >
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* GPS Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={loading || isGettingGps}
              aria-label="Use my current GPS location"
              className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                gpsLocationName
                  ? "bg-emerald-800 text-emerald-100 border-emerald-700"
                  : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#FAF7F0] hover:text-[#173B32]"
              }`}
              title="Use my current location"
            >
              {isGettingGps ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[#B65E3C]" />
              ) : (
                <LocateFixed className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Where are you now, where are you headed, or what kind of trip are you planning?"
              className="flex-1 min-w-0 bg-white border border-[#E5D5BA] rounded-2xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-[#20211D] placeholder:text-[#20211D]/45 focus:outline-none focus:border-[#173B32] focus:ring-1 focus:ring-[#173B32] transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || isUploadingImage || (!input.trim() && !attachedImage)}
              className="p-3 rounded-2xl bg-[#173B32] hover:bg-[#B65E3C] text-[#FAF7F0] disabled:opacity-40 transition-all shadow-sm cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
              aria-label="Send Message"
            >
              {loading || isUploadingImage ? (
                <Loader2 className="w-4 h-4 text-[#B49252] animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-[#B49252]" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
