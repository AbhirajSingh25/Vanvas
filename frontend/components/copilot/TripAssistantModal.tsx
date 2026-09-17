"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Sparkles, X, Compass, ArrowRight, Bot, MapPin, Clock, Coins, Calendar, Navigation, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { CopilotChatResponse } from "@/types";

interface TripAssistantModalProps {
  tripId?: string;
  destinationName?: string;
  destinationSlug?: string;
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (actionType: string, payload?: any) => void;
  trip?: any;
}

interface MessageItem {
  role: "user" | "assistant";
  text: string;
  actions?: Array<{ label: string; action: string; payload?: any }>;
  places?: any[];
  plan?: any;
  metadata?: any;
}

export const TripAssistantModal: React.FC<TripAssistantModalProps> = ({
  tripId,
  destinationName = "Manali",
  destinationSlug,
  isOpen,
  onClose,
  onTriggerAction,
  trip,
}) => {
  const resolvedTripId = trip?.id || tripId || "";
  const resolvedDest = trip?.destination?.name || destinationName;
  const resolvedSlug = trip?.destination?.slug || destinationSlug || "";

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      role: "assistant",
      text: `नमस्ते! I'm your VANVAS expedition copilot for ${resolvedDest}. How can I assist your mountain journey today?`,
      actions: [
        { label: "कहाँ खाएं? • Where to eat?", action: "find_food" },
        { label: "3-Hour Micro Plan", action: "quick_plan" },
        { label: "Trail Weather", action: "check_weather" },
        { label: "Quiet Cafes Nearby", action: "quiet_cafes" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (msgText?: string) => {
    const textToSend = msgText || input;
    if (!textToSend.trim() || loading) return;

    const newMessages: MessageItem[] = [...messages, { role: "user", text: textToSend }];
    setMessages(newMessages);
    if (!msgText) setInput("");
    setLoading(true);

    try {
      let res: CopilotChatResponse;
      if (resolvedTripId) {
        res = await api.askCopilot(resolvedTripId, textToSend, undefined, conversationId || undefined);
      } else {
        res = await api.copilotChat({
          message: textToSend,
          conversation_id: conversationId || undefined,
          destination_slug: resolvedSlug,
        });
      }

      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.message || "I have gathered your mountain details.",
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
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I encountered a minor trail disruption. Your saved places and offline maps remain fully available.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string, label: string, payload?: any) => {
    if (action === "view_quick_plan" && payload && onTriggerAction) {
      onTriggerAction("view_quick_plan", payload);
      onClose();
    } else if (action === "quick_plan") {
      handleSend("Generate a 3-hour quick plan for me");
    } else if (action === "find_food") {
      handleSend("Recommend top local cafes and food places nearby");
    } else if (action === "check_weather") {
      handleSend("What is the current mountain weather and forecast?");
    } else if (action === "quiet_cafes") {
      handleSend("Find quiet scenic spots or cafes to relax");
    } else if (onTriggerAction) {
      onTriggerAction(action, payload);
      onClose();
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
        className="bg-[#FAF7F0] border-t-2 md:border-2 border-[#E5D5BA] rounded-t-3xl md:rounded-3xl w-full md:max-w-xl shadow-2xl flex flex-col h-[90vh] md:h-[640px] max-h-[95vh] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Handle Pill */}
        <div className="md:hidden w-full flex justify-center pt-2.5 pb-1 bg-[#0F2924] shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#E5D5BA]/40" />
        </div>

        {/* Header */}
        <div className="p-3.5 sm:p-5 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center shadow-inner border border-[#D8CBB2]/20">
              <Bot className="w-5 h-5 text-[#FAF7F0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#FAF7F0]">VANVAS Trail Copilot</h3>
                <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-[#173B32] border border-[#B49252]/40 text-[#B49252]">
                  GEMINI AI
                </span>
              </div>
              <p className="text-[11px] text-[#D8DED5]/80 font-mono flex items-center gap-1.5 mt-0.5">
                <Compass className="w-3 h-3 text-[#B49252]" />
                {resolvedDest} Valley • Verified Local Knowledge
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close" 
            className="p-2 rounded-xl text-[#D8DED5] hover:bg-[#173B32] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-sm bg-radial-gradient">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              {/* Message Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#173B32] text-[#FAF7F0] rounded-br-xs font-medium"
                    : "bg-[#EFE5D2] text-[#20211D] rounded-bl-xs border border-[#E5D5BA] font-normal"
                }`}
              >
                <p className="whitespace-pre-line text-[13px]">{m.text}</p>

                {/* Referenced Places Cards */}
                {m.places && m.places.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#D8CBB2]/60 space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold">
                      Referenced Verified Spots ({m.places.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.places.map((place: any, pIdx: number) => (
                        <div 
                          key={pIdx} 
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] shadow-2xs hover:border-[#173B32] transition-colors"
                        >
                          {place.image_url ? (
                            <img 
                              src={place.image_url} 
                              alt={place.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-[#E5D5BA]"
                              onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#EFE5D2] flex items-center justify-center text-[#173B32]">
                              <MapPin className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-serif font-bold text-[#173B32] truncate">{place.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-[#7B4D36] font-mono mt-0.5">
                              <span className="capitalize">{place.category || "Sight"}</span>
                              {place.distance_km !== undefined && (
                                <span>• {place.distance_km} km</span>
                              )}
                              {place.approx_cost ? (
                                <span>• ₹{place.approx_cost}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan Preview Card */}
                {m.plan && (
                  <div className="mt-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#B49252]/50 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold font-serif text-[#173B32] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#B65E3C]" />
                        {m.plan.headline || "Generated Micro-Plan"}
                      </span>
                      <span className="text-[10px] font-mono text-[#7B4D36] px-2 py-0.5 rounded-full bg-[#EFE5D2]">
                        {m.plan.duration_hours || 3} Hours
                      </span>
                    </div>
                    <p className="text-[11px] text-[#20211D]/80 mb-2 leading-tight">{m.plan.summary}</p>
                    {m.plan.items && m.plan.items.length > 0 && (
                      <div className="space-y-1">
                        {m.plan.items.map((item: any, iIdx: number) => (
                          <div key={iIdx} className="flex items-center gap-2 text-[11px] text-[#173B32] font-mono">
                            <span className="w-4 h-4 rounded-full bg-[#EFE5D2] text-[9px] flex items-center justify-center font-bold">
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
                      Data Source: VANVAS Verified DB
                    </span>
                    <span>
                      {m.metadata.model || "Gemini"} • {m.metadata.latency_ms ? `${m.metadata.latency_ms}ms` : "Live"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Chips */}
              {m.actions && m.actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[90%]">
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
              <span className="font-serif italic font-medium">Scouting mountain coordinates &amp; verified spots...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input */}
        <div className="p-3.5 sm:p-4 pb-6 sm:pb-4 border-t border-[#E5D5BA] bg-[#EFE5D2] safe-area-bottom shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask anything about ${resolvedDest}... (e.g. Scenic sunset trek? Best cafe?)`}
              className="flex-1 bg-white border border-[#E5D5BA] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#20211D] placeholder:text-[#20211D]/45 focus:outline-none focus:border-[#173B32] focus:ring-1 focus:ring-[#173B32] transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 rounded-2xl bg-[#173B32] hover:bg-[#B65E3C] text-[#FAF7F0] disabled:opacity-40 transition-all shadow-sm cursor-pointer active:scale-95 flex items-center justify-center"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4 text-[#B49252]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

