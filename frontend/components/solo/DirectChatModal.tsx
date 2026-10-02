"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Shield, AlertTriangle, CheckCircle2, User, RefreshCw, Phone, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { SoloTravelerCard, SoloDirectMessage } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

interface DirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: SoloTravelerCard | null;
  currentUserId?: string;
  onBlock?: (userId: string) => void;
  onReport?: (userId: string) => void;
}

export function DirectChatModal({
  isOpen,
  onClose,
  partner,
  currentUserId,
  onBlock,
  onReport,
}: DirectChatModalProps) {
  const [messages, setMessages] = useState<SoloDirectMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!partner) return;
    try {
      setLoading(true);
      const res = await api.getSoloDirectMessages(partner.user_id);
      setMessages(res || []);
    } catch (err: any) {
      console.error("Failed to load direct messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && partner) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000); // Polling sync
      return () => clearInterval(interval);
    }
  }, [isOpen, partner]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen || !partner) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || sending) return;

    try {
      setSending(true);
      const newMsg = await api.sendSoloDirectMessage(partner.user_id, clean);
      setMessages((prev) => [...prev, newMsg]);
      setInputText("");
    } catch (err: any) {
      setActionNotice(err.message || "Failed to send message.");
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setSending(false);
    }
  };

  const handleBlockUser = async () => {
    if (!confirm(`Are you sure you want to block ${partner.full_name}? They will no longer be able to message you.`)) {
      return;
    }
    try {
      await api.blockTraveler({ blocked_user_id: partner.user_id, reason: "Blocked from chat" });
      if (onBlock) onBlock(partner.user_id);
      onClose();
    } catch (err: any) {
      setActionNotice(err.message || "Could not block user.");
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleReportUser = async () => {
    const reason = prompt(`Report ${partner.full_name} to VANVAS Safety Desk. Please provide details:`);
    if (!reason || !reason.trim()) return;
    try {
      await api.reportTraveler({ reported_user_id: partner.user_id, reason: reason.trim() });
      setActionNotice("Report submitted to VANVAS Safety Desk. Thank you for keeping solo travel safe.");
      if (onReport) onReport(partner.user_id);
      setShowSafetyMenu(false);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice(err.message || "Could not submit report.");
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl shadow-2xl flex flex-col h-[640px] max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#D8CBB2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={partner.full_name}
              user={{
                full_name: partner.full_name,
                avatar_url: partner.avatar_url,
                avatar_type: partner.avatar_type,
                avatar_preset: partner.avatar_preset,
              }}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-[#173B32] text-base sm:text-lg">
                  {partner.full_name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32] text-[10px] font-bold">
                  Connected
                </span>
              </div>
              <p className="text-xs text-[#20211D]/70">
                {partner.travel_style || "Solo Explorer"} · {partner.overlapping_days || 0} overlapping days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSafetyMenu(!showSafetyMenu)}
              title="Safety & Moderation"
              className="p-2 rounded-xl text-[#20211D]/60 hover:text-[#E05A2B] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
            >
              <Shield className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#20211D]/60 hover:text-[#173B32] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety Menu Dropdown */}
        {showSafetyMenu && (
          <div className="absolute top-16 right-6 z-20 w-52 bg-white border border-[#D8CBB2] rounded-2xl shadow-xl p-2 text-xs space-y-1 animate-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase font-bold text-[#20211D]/50 border-b border-[#D8CBB2]/50">
              Safety Controls
            </div>
            <button
              onClick={handleReportUser}
              className="w-full text-left px-3 py-2 rounded-xl text-[#E05A2B] hover:bg-[#E05A2B]/10 font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report to Safety Desk</span>
            </button>
            <button
              onClick={handleBlockUser}
              className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Block Traveler</span>
            </button>
          </div>
        )}

        {/* Action Notice */}
        {actionNotice && (
          <div className="px-4 py-2 bg-[#E05A2B]/10 border-b border-[#E05A2B]/20 text-[#E05A2B] text-xs font-medium text-center">
            {actionNotice}
          </div>
        )}

        {/* Safety Reminder Banner */}
        <div className="px-4 py-2 bg-[#FAF7F0] border-b border-[#D8CBB2]/60 flex items-center justify-between text-[11px] text-[#20211D]/70">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#B49252]" />
            <span>Meet in public spaces · Never share private banking or room keys</span>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#FAF7F0]">
          {loading && messages.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-5 h-5 text-[#B49252] animate-spin mx-auto" />
              <p className="text-xs text-[#20211D]/60">Opening secure conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center max-w-xs mx-auto space-y-2">
              <div className="w-12 h-12 rounded-full bg-white border border-[#D8CBB2] flex items-center justify-center mx-auto text-[#173B32]">
                <Send className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-[#173B32] text-sm">
                You are now connected!
              </h4>
              <p className="text-xs text-[#20211D]/70">
                Say hello, compare trek itineraries, or propose a morning cafe meetup.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_user_id === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isMine
                        ? "bg-[#173B32] text-white rounded-br-xs"
                        : "bg-white text-[#20211D] border border-[#D8CBB2] rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                  <span className="text-[10px] text-[#20211D]/50 mt-1 px-1 font-mono">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white border-t border-[#D8CBB2] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${partner.full_name}...`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] text-xs sm:text-sm text-[#20211D] placeholder:text-[#20211D]/50 focus:outline-none focus:ring-1 focus:ring-[#173B32]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 rounded-2xl bg-[#E05A2B] hover:bg-[#C8491D] disabled:opacity-40 text-white transition-colors cursor-pointer shadow-sm"
          >
            {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

      </div>
    </div>
  );
}
