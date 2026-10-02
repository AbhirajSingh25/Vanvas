"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  X,
  Compass,
  ArrowRight,
  MapPin,
  Clock,
  Coins,
  Navigation,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  LocateFixed,
  Utensils,
  Bed,
  Route,
  CheckCircle2,
  Info,
  RefreshCw,
  Wallet,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useAskVanvas, MessageItem } from "@/context/AskVanvasContext";
import { AskVanvasResponseCard } from "./AskVanvasResponseCard";
import { api } from "@/lib/api";
import { getCurrentGPSPosition } from "@/lib/locationService";

interface AskVanvasModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultDestination?: string;
  tripId?: string;
  trip?: any;
}

export const AskVanvasModal: React.FC<AskVanvasModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  defaultDestination,
  tripId,
  trip,
}) => {
  const context = useAskVanvas();

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : context.isOpen;
  const handleClose = propOnClose || context.closeAskVanvas;

  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync prop context if passed directly
  useEffect(() => {
    if (defaultDestination || tripId || trip) {
      context.setTravelContext({
        destinationName: defaultDestination || trip?.destination?.name,
        destinationSlug: defaultDestination?.toLowerCase() || trip?.destination?.slug,
        tripId: tripId || trip?.id,
        trip,
      });
    }
  }, [defaultDestination, tripId, trip]);

  // Lock body scroll when open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isModalOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [context.messages, isModalOpen, context.loading]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, handleClose]);

  if (!isModalOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setImageError("Image must be smaller than 10MB");
      setTimeout(() => setImageError(null), 4000);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAttachedImage({ file, previewUrl });
  };

  const handleRemoveImage = () => {
    setImageError(null);
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToSend = customQuery || input;
    if ((!queryToSend.trim() && !attachedImage) || context.loading) return;

    let uploadedUrl: string | undefined = undefined;

    if (attachedImage) {
      setIsUploadingImage(true);
      try {
        const uploadRes = await api.uploadCopilotImage(attachedImage.file);
        uploadedUrl = uploadRes.image_url;
      } catch (err) {
        console.error("Image upload failed:", err);
      } finally {
        setIsUploadingImage(false);
        handleRemoveImage();
      }
    }

    if (!customQuery) setInput("");
    await context.sendMessage(queryToSend, uploadedUrl);
  };

  const handleUseGPS = async () => {
    setIsGettingGps(true);
    const res = await getCurrentGPSPosition();
    setIsGettingGps(false);

    if (res.status === "GRANTED" && res.coords) {
      context.setTravelContext({
        coordinates: {
          lat: res.coords.latitude,
          lng: res.coords.longitude,
          label: "Detected GPS Location",
        },
      });
      await context.sendMessage(
        `What can I explore near my GPS location [${res.coords.latitude.toFixed(3)}°N, ${res.coords.longitude.toFixed(3)}°E]?`
      );
    } else {
      await context.sendMessage("Where should we go near me?");
    }
  };

  // Dynamic Suggested Prompts based on Context
  const getSuggestedPrompts = () => {
    if (context.currentContext.type === "trip") {
      return [
        { label: "What's next?", query: "What is next on our itinerary right now?" },
        { label: "Good food nearby?", query: "Where should we eat nearby?" },
        { label: "Replan today", query: "I'm 2 hours late. Replan today" },
        { label: "Who owes me?", query: "Who owes me money on this trip?" },
      ];
    }
    if (context.currentContext.type === "road_trip") {
      return [
        { label: "Where should we stop?", query: "Where should we stop on this route?" },
        { label: "Best dhaba", query: "Best dhaba for lunch on this road trip?" },
        { label: "Find stay near stop", query: "Find verified stays near our next stop" },
      ];
    }
    if (context.currentContext.type === "budget") {
      return [
        { label: "How much spent?", query: "How much have we spent so far?" },
        { label: "Who owes me?", query: "Who owes me money on this trip?" },
        { label: "Split an expense", query: "How do we split our latest expense?" },
      ];
    }
    const dest = context.currentContext.destinationName || "Manali";
    return [
      { label: "What should I do?", query: `What should I do in ${dest} today?` },
      { label: "Good food nearby?", query: `Where should we eat in ${dest}?` },
      { label: "Find verified stays", query: `Find verified stays in ${dest}` },
      { label: "What's next?", query: `What are the best afternoon highlights in ${dest}?` },
    ];
  };

  // Resolve Header Identity
  const headerTitle = context.currentContext.destinationName
    ? `ASK VANVAS · ${context.currentContext.destinationName.toUpperCase()}`
    : context.currentContext.type === "trip"
    ? `ASK VANVAS · YOUR TRIP`
    : context.currentContext.type === "road_trip"
    ? `ASK VANVAS · ROAD TRIP`
    : context.currentContext.type === "budget"
    ? `ASK VANVAS · BUDGET & SPLIT`
    : context.currentContext.type === "nearby"
    ? `ASK VANVAS · NEARBY`
    : `ASK VANVAS · INDIA`;

  const headerSubtitle =
    context.currentContext.subtitle ||
    (context.currentContext.type === "trip"
      ? "Trip · Today · 2 travellers"
      : context.currentContext.type === "road_trip"
      ? "Route · Scenic waypoints & stops"
      : "Spontaneous expedition companion");

  const promptChips = getSuggestedPrompts();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask VANVAS Travel Assistant"
      className="fixed inset-0 z-50 flex justify-end items-end sm:items-stretch bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
    >
      {/* Background Click to Dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Main Assistant Drawer / Bottom Sheet Container */}
      <div className="relative z-10 w-full sm:max-w-xl md:max-w-2xl h-[92vh] sm:h-full bg-[#FAF7F0] dark:bg-[#172019] text-[#20211D] dark:text-[#EFE5D2] rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-[#E5D5BA] dark:border-[#384A3E] shadow-2xl flex flex-col overflow-hidden animate-slideUp sm:animate-slideLeft">
        {/* Mobile Swipe Handle */}
        <div className="sm:hidden flex items-center justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-[#D8CBB2] dark:bg-[#384A3E]" />
        </div>

        {/* 1. TOP BAR / IDENTITY HEADER */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#E5D5BA] dark:border-[#384A3E] bg-[#FAF7F0]/90 dark:bg-[#172019]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#B65E3C] animate-pulse" />
              <h2 className="font-serif font-black text-sm sm:text-base text-[#173B32] dark:text-[#FAF7F0] tracking-tight truncate">
                {headerTitle}
              </h2>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#B49252]/20 text-[#B49252] text-[9px] font-mono font-bold uppercase border border-[#B49252]/30">
                Copilot
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#7B4D36] dark:text-[#D8CBB2] truncate mt-0.5">
              {headerSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleUseGPS}
              disabled={isGettingGps}
              title="Use current GPS location"
              className="p-1.5 rounded-xl bg-[#EFE5D2] dark:bg-[#2A382E] hover:bg-[#B49252] hover:text-[#FAF7F0] text-[#173B32] dark:text-[#FAF7F0] transition-colors cursor-pointer"
            >
              <LocateFixed className={`w-4 h-4 ${isGettingGps ? "animate-spin text-[#B65E3C]" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close Ask VANVAS"
              className="p-1.5 rounded-xl bg-[#EFE5D2] dark:bg-[#2A382E] hover:bg-red-500 hover:text-white text-[#173B32] dark:text-[#FAF7F0] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {context.actionFeedback && (
          <div
            className={`px-4 py-2 text-xs font-mono font-bold flex items-center justify-between gap-2 border-b ${
              context.actionFeedback.type === "success"
                ? "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
                : context.actionFeedback.type === "error"
                ? "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800"
                : "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{context.actionFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={context.clearActionFeedback}
              className="text-xs hover:opacity-70 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. CONVERSATION MESSAGES SCROLL AREA */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 space-y-4">
          {context.messages.map((msg) => (
            <div key={msg.id} className="w-full">
              {msg.role === "user" ? (
                /* USER MESSAGE BUBBLE */
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#173B32] text-[#FAF7F0] p-3 sm:p-3.5 shadow-xs space-y-1.5">
                    {msg.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-[#B49252]/40 max-h-48 mb-1.5">
                        <img
                          src={msg.imageUrl}
                          alt="User attachment"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs sm:text-sm font-sans font-medium leading-relaxed">
                      {msg.text}
                    </p>
                    <span className="block text-[9px] font-mono text-[#D8DED5]/60 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ) : (
                /* ASSISTANT STRUCTURED RESPONSE CARD */
                <div className="w-full">
                  {msg.structured ? (
                    <AskVanvasResponseCard
                      data={msg.structured}
                      onExecuteAction={(act) => context.executeAction(act)}
                    />
                  ) : (
                    /* Fallback Card */
                    <div className="p-3.5 rounded-2xl bg-[#FAF7F0] dark:bg-[#1E2620] border border-[#E5D5BA] dark:border-[#384A3E] text-xs font-serif leading-relaxed text-[#20211D] dark:text-[#FAF7F0]">
                      {msg.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Compact Loading Indicator */}
          {context.loading && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#FAF7F0] dark:bg-[#1E2620] border border-[#E5D5BA] dark:border-[#384A3E] text-[#7B4D36] dark:text-[#D8CBB2] w-fit shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#B65E3C]" />
              <span className="text-xs font-mono font-medium">
                {context.statusMessage || "Finding places..."}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. INPUT AREA & SUGGESTED PROMPT CHIPS */}
        <div className="p-3 sm:p-4 border-t border-[#E5D5BA] dark:border-[#384A3E] bg-[#FAF7F0] dark:bg-[#172019] shrink-0 space-y-2">
          {/* Suggested Prompts Chips Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSubmit(undefined, chip.query)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-[#EFE5D2] dark:bg-[#2A382E] hover:bg-[#173B32] hover:text-[#FAF7F0] dark:hover:bg-[#B49252] dark:hover:text-[#172019] text-[#173B32] dark:text-[#FAF7F0] text-[11px] font-mono font-bold border border-[#E5D5BA] dark:border-[#384A3E] transition-all cursor-pointer active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Image Preview Thumbnail if attached */}
          {attachedImage && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#EFE5D2] dark:bg-[#2A382E] border border-[#B49252]/40 w-fit">
              <img
                src={attachedImage.previewUrl}
                alt="Selected preview"
                className="w-10 h-10 object-cover rounded-lg"
              />
              <div className="text-[11px] font-mono truncate max-w-40 text-[#173B32] dark:text-[#FAF7F0]">
                {attachedImage.file.name}
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1 rounded-full hover:bg-red-100 text-red-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Image Error Notice */}
          {imageError && (
            <div className="text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 w-fit">
              {imageError}
            </div>
          )}

          {/* Form Input Container */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={context.loading || isUploadingImage}
              title="Attach photo for travel reasoning"
              className="p-2.5 rounded-xl bg-[#EFE5D2] dark:bg-[#2A382E] hover:bg-[#E5D5BA] dark:hover:bg-[#384A3E] text-[#173B32] dark:text-[#FAF7F0] transition-colors cursor-pointer shrink-0"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this trip, place or route..."
              disabled={context.loading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] dark:bg-[#1E2620] border border-[#E5D5BA] dark:border-[#384A3E] focus:outline-none focus:ring-2 focus:ring-[#B49252] text-xs sm:text-sm font-sans placeholder:text-[#7B4D36]/60 dark:placeholder:text-[#D8CBB2]/50 text-[#173B32] dark:text-[#FAF7F0]"
            />

            <button
              type="submit"
              disabled={(!input.trim() && !attachedImage) || context.loading}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-[#173B32] dark:bg-[#B49252] hover:bg-[#20453B] dark:hover:bg-[#C5A260] text-[#FAF7F0] dark:text-[#172019] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 4. CONFIRMATION DIALOG (For Destructive Actions) */}
      {context.confirmation && context.confirmation.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#FAF7F0] dark:bg-[#1E2620] border border-[#E5D5BA] dark:border-[#384A3E] p-4.5 shadow-2xl space-y-3 font-sans animate-scaleIn">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-serif font-bold text-base text-[#173B32] dark:text-[#FAF7F0]">
                {context.confirmation.title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#7B4D36] dark:text-[#D8CBB2] leading-relaxed">
              {context.confirmation.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={context.confirmation.onCancel}
                className="px-3.5 py-1.5 rounded-xl bg-[#EFE5D2] dark:bg-[#2A382E] text-[#173B32] dark:text-[#FAF7F0] text-xs font-mono font-semibold hover:bg-[#E5D5BA] transition-colors cursor-pointer"
              >
                {context.confirmation.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={context.confirmation.onConfirm}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold transition-colors cursor-pointer shadow-xs"
              >
                {context.confirmation.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
