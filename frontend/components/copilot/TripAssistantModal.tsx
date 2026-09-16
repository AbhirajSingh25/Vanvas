"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Sparkles, X, Compass, ArrowRight, Bot } from "lucide-react";
import { api } from "@/lib/api";
import { CopilotResponse } from "@/types";

interface TripAssistantModalProps {
  tripId?: string;
  destinationName?: string;
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (actionType: string) => void;
  trip?: any;
}

export const TripAssistantModal: React.FC<TripAssistantModalProps> = ({
  tripId,
  destinationName = "Manali",
  isOpen,
  onClose,
  onTriggerAction,
  trip,
}) => {
  const resolvedTripId = trip?.id || tripId || "";
  const resolvedDest = trip?.destination?.name || destinationName;

  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string; actions?: Array<{ label: string; action: string }> }>>([
    {
      role: "assistant",
      text: `नमस्ते! I'm your VANVAS expedition copilot for ${resolvedDest}. Tell me if you're hungry, tired, late, or caught in the rain!`,
      actions: [
        { label: "कहाँ खाएं? • Where to eat?", action: "find_food" },
        { label: "थक गए • I'm tired", action: "tired" },
        { label: "बजट कम है • Less money", action: "budget" },
        { label: "देरी हो गई • I'm late", action: "late" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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

    const newMessages = [...messages, { role: "user" as const, text: textToSend }];
    setMessages(newMessages);
    if (!msgText) setInput("");
    setLoading(true);

    try {
      const res: CopilotResponse = await api.askCopilot(resolvedTripId, textToSend);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.reply,
          actions: res.suggested_actions?.map((a: any) => ({ label: a.label || a.title, action: a.action || a.id })),
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string, label: string) => {
    if (onTriggerAction) {
      onTriggerAction(action);
      onClose();
    } else {
      handleSend(label);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-lg shadow-2xl flex flex-col h-[580px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base">VANVAS Trail Copilot</h3>
              <p className="text-[11px] text-[#D8DED5]/80 font-mono">Real-time Mountain Companion • {resolvedDest}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-[#D8DED5] hover:bg-[#173B32]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-sm">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#173B32] text-[#EFE5D2] rounded-br-xs font-medium"
                    : "bg-[#EFE5D2] text-[#20211D] rounded-bl-xs border border-[#E5D5BA] font-light"
                }`}
              >
                {m.text}
              </div>

              {/* Action Chips */}
              {m.actions && m.actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {m.actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleActionClick(act.action, act.label)}
                      className="text-xs bg-[#FAF7F0] hover:bg-[#B65E3C] hover:text-[#EFE5D2] text-[#173B32] px-3 py-1.5 rounded-full border border-[#E5D5BA] font-semibold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>{act.label}</span>
                      <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#7B4D36] animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span className="font-serif italic">Scouting trail conditions &amp; nearby spots...</span>
            </div>
          )}
        </div>

        {/* Footer Input */}
        <div className="p-3.5 border-t border-[#E5D5BA] bg-[#EFE5D2]">
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
              placeholder="Ask anything... (e.g. Best chai spot near Old Manali?)"
              className="flex-1 bg-white border border-[#E5D5BA] rounded-xl px-4 py-2.5 text-xs text-[#20211D] placeholder:text-[#20211D]/40 focus:outline-none focus:border-[#173B32]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] disabled:opacity-40 transition-all shadow-xs"
            >
              <Send className="w-4 h-4 text-[#B49252]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
