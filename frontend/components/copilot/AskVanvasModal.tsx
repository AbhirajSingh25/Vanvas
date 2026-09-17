"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, X, Compass, ArrowRight, Bot, MapPin, Clock, Coins, Calendar, Navigation, ShieldCheck, Mountain } from "lucide-react";
import { api } from "@/lib/api";
import { CopilotChatResponse } from "@/types";

interface AskVanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDestination?: string;
}

interface MessageItem {
  role: "user" | "assistant";
  text: string;
  actions?: Array<{ label: string; action: string; payload?: any }>;
  places?: any[];
  plan?: any;
  metadata?: any;
}

export const AskVanvasModal: React.FC<AskVanvasModalProps> = ({
  isOpen,
  onClose,
  defaultDestination,
}) => {
  const [selectedDest, setSelectedDest] = useState<string>(defaultDestination || "Mussoorie");
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      role: "assistant",
      text: `नमस्ते! I am VANVAS Intelligence, powered by Google Gemini reasoning over verified Himalayan travel knowledge. Where would you like to explore?`,
      actions: [
        { label: "Top Cafes in Mussoorie", action: "explore_mussoorie" },
        { label: "Manali 3-Day Itinerary", action: "plan_manali" },
        { label: "Leh Altitude & Weather", action: "weather_leh" },
        { label: "Rishikesh Quiet Stays", action: "stays_rishikesh" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const destinations = ["Mussoorie", "Manali", "Rishikesh", "Dharamshala", "Leh Ladakh", "Spiti Valley"];

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
      const res: CopilotChatResponse = await api.copilotChat({
        message: textToSend,
        destination_slug: selectedDest.toLowerCase().replace(/\s+/g, "-"),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.message || "I have analyzed your expedition query.",
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
          text: "I encountered a minor network disruption. Your verified destination guides remain fully available.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string, label: string, payload?: any) => {
    if (action === "explore_mussoorie") {
      setSelectedDest("Mussoorie");
      handleSend("What are the best cafes and heritage viewpoints in Mussoorie?");
    } else if (action === "plan_manali") {
      setSelectedDest("Manali");
      handleSend("Give me a curated plan for 3 days in Manali with verified spots");
    } else if (action === "weather_leh") {
      setSelectedDest("Leh Ladakh");
      handleSend("What is the current weather forecast and acclimatization advice for Leh?");
    } else if (action === "stays_rishikesh") {
      setSelectedDest("Rishikesh");
      handleSend("Recommend quiet scenic riverside spots in Rishikesh");
    } else {
      handleSend(label);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F2924]/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col h-[680px] max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#B65E3C] text-[#FAF7F0] flex items-center justify-center shadow-md border border-[#D8CBB2]/20">
              <Sparkles className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#FAF7F0]">Ask VANVAS</h3>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#173B32] border border-[#B49252]/40 text-[#B49252] font-semibold">
                  GEMINI INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-[#D8DED5]/80 font-mono mt-0.5">
                Zero Hallucinations • Real-Time Himalayan Mountain Reasoning
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

        {/* Destination Switcher Bar */}
        <div className="px-4 py-2 bg-[#EFE5D2] border-b border-[#E5D5BA] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-mono text-[#7B4D36] font-bold flex items-center gap-1 shrink-0">
            <Mountain className="w-3 h-3 text-[#B65E3C]" /> Valley:
          </span>
          {destinations.map((dest) => (
            <button
              key={dest}
              onClick={() => setSelectedDest(dest)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedDest === dest
                  ? "bg-[#173B32] text-[#FAF7F0] shadow-2xs"
                  : "bg-[#FAF7F0] text-[#20211D]/80 hover:bg-[#D8CBB2] border border-[#E5D5BA]"
              }`}
            >
              {dest}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-sm bg-[#FAF7F0]">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              {/* Message Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl px-4.5 py-3.5 shadow-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#173B32] text-[#FAF7F0] rounded-br-xs font-medium"
                    : "bg-[#EFE5D2] text-[#20211D] rounded-bl-xs border border-[#E5D5BA] font-normal"
                }`}
              >
                <p className="whitespace-pre-line text-[13px]">{m.text}</p>

                {/* Referenced Places Cards */}
                {m.places && m.places.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-[#D8CBB2]/60 space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] font-bold">
                      Verified Destination Spots ({m.places.length})
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
                              <span className="capitalize">{place.category || "Spot"}</span>
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
                      <span className="text-xs font-bold font-serif text-[#173B32] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#B65E3C]" />
                        {m.plan.headline || "Himalayan Itinerary"}
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
        <div className="p-3.5 sm:p-4 border-t border-[#E5D5BA] bg-[#EFE5D2]">
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
              placeholder={`Ask anything about ${selectedDest}... (e.g. Best chai spot with sunset view?)`}
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
