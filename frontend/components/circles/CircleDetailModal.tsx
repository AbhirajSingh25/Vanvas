"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X, Users, MessageSquare, Compass, MapPin, Calendar, Clock,
  Heart, ThumbsUp, ThumbsDown, Send, Sparkles, Footprints, Shield,
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw, LogOut, Navigation,
  Coffee, Utensils, Mountain
} from "lucide-react";
import { TravelCircle, CircleMember, CircleMessage, CircleActivity, AskVanvasCircleResponse } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { VanvasMap, VanvasMapMarker, VanvasMapRouteSegment } from "@/components/ui/VanvasMap";
import { api } from "@/lib/api";

interface CircleDetailModalProps {
  circleId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onCircleUpdated?: (circle: TravelCircle) => void;
  onCircleLeft?: (circleId: string) => void;
}

export function CircleDetailModal({
  circleId,
  isOpen,
  onClose,
  currentUserId,
  onCircleUpdated,
  onCircleLeft,
}: CircleDetailModalProps) {
  const [circle, setCircle] = useState<TravelCircle | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "voting" | "map" | "ai">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat states
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Voting states
  const [activities, setActivities] = useState<CircleActivity[]>([]);
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityCategory, setNewActivityCategory] = useState("attraction");
  const [isProposing, setIsProposing] = useState(false);

  // Ask VANVAS AI states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<AskVanvasCircleResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Leave circle state
  const [isLeaving, setIsLeaving] = useState(false);

  const loadCircleData = async () => {
    if (!circleId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCircleDetails(circleId);
      setCircle(data);
      setActivities(data.activities || []);

      // Load initial messages
      const msgs = await api.getCircleMessages(circleId);
      setMessages(msgs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load circle details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && circleId) {
      loadCircleData();
    }
  }, [isOpen, circleId]);

  // WebSocket Live Chat Setup
  useEffect(() => {
    if (!isOpen || !circleId || activeTab !== "chat") {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("vanvas_token") : null;
    if (!token) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_HOST || "127.0.0.1:8000";
    const wsUrl = `${protocol}//${host}/api/v1/circles/${circleId}/ws?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const newMsg = JSON.parse(event.data);
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } catch {}
      };

      ws.onerror = () => {
        // Fallback to REST polling if WebSocket fails in restricted environments
      };
    } catch {
      // Ignored
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen, circleId, activeTab]);

  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  if (!isOpen || !circleId) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingMsg) return;

    const content = chatInput.trim();
    setChatInput("");
    setIsSendingMsg(true);

    try {
      // Send via WebSocket if connected, otherwise via REST API
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ content, message_type: "user" }));
      } else {
        const sent = await api.sendCircleMessage(circleId, { content });
        setMessages((prev) => [...prev, sent]);
      }
    } catch (err: any) {
      setError("Failed to send message.");
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleVote = async (activityId: string, voteType: "LOVE" | "LIKE" | "NO") => {
    try {
      await api.voteCircleActivity(circleId, activityId, voteType);
      // Reload activities
      const updated = await api.getCircleActivities(circleId);
      setActivities(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProposeActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim() || isProposing) return;
    setIsProposing(true);
    try {
      await api.proposeCircleActivity(circleId, {
        custom_title: newActivityTitle.trim(),
        category: newActivityCategory,
      });
      setNewActivityTitle("");
      const updated = await api.getCircleActivities(circleId);
      setActivities(updated);
    } catch (err: any) {
      setError(err.message || "Failed to propose activity.");
    } finally {
      setIsProposing(false);
    }
  };

  const handleAskVanvas = async (promptText?: string) => {
    const query = promptText || aiPrompt.trim();
    if (!query || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await api.askVanvasForCircle(circleId, { query });
      setAiResponse(res);
      // Refresh messages as Ask VANVAS posts summary to chat
      api.getCircleMessages(circleId).then(setMessages).catch(() => {});
    } catch (err: any) {
      setError(err.message || "Ask VANVAS planning failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleLeaveCircle = async () => {
    setIsLeaving(true);
    try {
      await api.leaveCircle(circleId);
      onCircleLeft?.(circleId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to leave circle.");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A100D]/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF7F0] border border-[#D8CBB2] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[820px]">
        {/* Header */}
        <div className="bg-[#173B32] p-5 sm:p-6 text-[#FAF4E8] relative flex items-start justify-between border-b border-[#2A4D43]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-[#B49252]/20 text-[#B49252] text-[10px] font-mono font-bold uppercase tracking-wider">
                {circle?.activity_type || "Expedition Circle"}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF4E8]/10 text-[#FAF4E8] text-[10px] font-bold">
                {circle?.members_count || 1} / {circle?.max_members || 6} Travelers
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                {circle?.status || "FORMING"}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF4E8]">
              {circle?.name || "Travel Circle"}
            </h2>
            <p className="text-xs text-[#8FA699] flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#B49252]" />
              <span>{circle?.start_date} – {circle?.end_date}</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5 text-[#E05A2B]" />
              <span>{circle?.destination_name || "Destination"}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#FAF4E8]/10 hover:bg-[#FAF4E8]/20 text-[#FAF4E8] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-[#D8CBB2] px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          {[
            { id: "overview", label: "Overview & Members", icon: Users },
            { id: "chat", label: `Live Chat (${messages.length})`, icon: MessageSquare },
            { id: "voting", label: `Group Voting (${activities.length})`, icon: Heart },
            { id: "map", label: "Meetup Route", icon: Navigation },
            { id: "ai", label: "Ask VANVAS", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#173B32] text-[#FAF4E8] shadow-xs"
                    : "text-[#20211D]/70 hover:bg-[#E5D5BA]/50 hover:text-[#173B32]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#B49252]" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F0] text-[#20211D]">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#B49252] animate-spin mx-auto" />
              <p className="text-xs text-[#20211D]/70">Loading circle details & itinerary...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Meetup Banner */}
                  <div className="bg-white border border-[#D8CBB2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E05A2B]/10 flex items-center justify-center text-[#E05A2B]">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#20211D]/60 block">
                          Verified Public Meetup Point
                        </span>
                        <span className="text-sm font-bold text-[#173B32]">
                          {circle?.meetup_point}
                        </span>
                        {circle?.meetup_time && (
                          <div className="text-xs text-[#E05A2B] font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>Meetup Time: {circle.meetup_time}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("map")}
                      className="px-3 py-1.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold flex items-center gap-1.5 hover:bg-[#20453B] transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#B49252]" />
                      <span>View Route on Map</span>
                    </button>
                  </div>

                  {/* Description */}
                  {circle?.description && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#20211D]/60 tracking-wider">
                        Expedition Objective
                      </span>
                      <p className="text-xs text-[#20211D]/80 bg-white border border-[#D8CBB2] rounded-2xl p-4 leading-relaxed">
                        {circle.description}
                      </p>
                    </div>
                  )}

                  {/* Circle Members */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#173B32] uppercase tracking-wider">
                        Circle Members ({circle?.members.length} / {circle?.max_members})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {circle?.members.map((m) => (
                        <div
                          key={m.id}
                          className="bg-white border border-[#D8CBB2] rounded-2xl p-3 shadow-xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              user={{
                                full_name: m.full_name,
                                avatar_url: m.avatar_url,
                                avatar_type: m.avatar_type,
                                avatar_preset: m.avatar_preset,
                              }}
                              size="md"
                            />
                            <div>
                              <div className="text-xs font-bold text-[#173B32] flex items-center gap-1.5">
                                <span>{m.full_name}</span>
                                {m.role === "creator" && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#B49252]/15 text-[#B49252] text-[9px] font-bold">
                                    Creator
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#20211D]/60">
                                {m.travel_style || "Balanced"} • Joined {new Date(m.joined_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leave Circle Button */}
                  <div className="pt-4 border-t border-[#D8CBB2]/60 flex justify-end">
                    <button
                      onClick={handleLeaveCircle}
                      disabled={isLeaving}
                      className="text-xs text-red-700 hover:text-red-900 font-bold flex items-center gap-1.5 p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isLeaving ? "Leaving..." : "Leave Circle"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE CHAT */}
              {activeTab === "chat" && (
                <div className="flex flex-col h-full space-y-3 animate-fadeIn">
                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-xs text-[#20211D]/60">
                        No messages in circle yet. Introduce yourself!
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.user_id === currentUserId;
                        const isSystem = msg.message_type === "system";
                        const isAi = msg.message_type === "ask_vanvas";

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="text-center py-1.5">
                              <span className="px-3 py-1 rounded-full bg-[#E5D5BA]/60 text-[11px] font-medium text-[#173B32]">
                                {msg.content}
                              </span>
                            </div>
                          );
                        }

                        if (isAi) {
                          return (
                            <div key={msg.id} className="bg-[#173B32]/10 border border-[#173B32]/20 rounded-2xl p-3.5 space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#173B32]">
                                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                                <span>VANVAS Copilot</span>
                              </div>
                              <p className="text-xs text-[#20211D] whitespace-pre-line leading-relaxed">
                                {msg.content}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <Avatar
                              user={{
                                full_name: msg.sender_name || "Traveler",
                                avatar_url: msg.sender_avatar,
                              }}
                              size="sm"
                            />
                            <div className={`max-w-[78%] space-y-0.5 ${isMe ? "items-end" : "items-start"}`}>
                              <div className={`text-[10px] text-[#20211D]/60 font-semibold ${isMe ? "text-right" : "text-left"}`}>
                                {msg.sender_name || "Traveler"}
                              </div>
                              <div
                                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                  isMe
                                    ? "bg-[#173B32] text-[#FAF4E8] rounded-tr-xs"
                                    : "bg-white border border-[#D8CBB2] text-[#20211D] rounded-tl-xs"
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-[#D8CBB2]/60">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Message the circle..."
                      className="flex-1 text-xs p-3 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none focus:ring-1 focus:ring-[#173B32]"
                    />
                    <button
                      type="submit"
                      disabled={isSendingMsg || !chatInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: GROUP VOTING */}
              {activeTab === "voting" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Propose Form */}
                  <form onSubmit={handleProposeActivity} className="bg-white border border-[#D8CBB2] rounded-2xl p-4 shadow-xs space-y-3">
                    <span className="text-xs font-bold text-[#173B32] uppercase tracking-wider block">
                      Propose a Place or Activity to Vote
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newActivityTitle}
                        onChange={(e) => setNewActivityTitle(e.target.value)}
                        placeholder="e.g. Manikaran Hot Springs or Evergreen Café lunch..."
                        className="flex-1 text-xs p-2.5 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none"
                      />
                      <select
                        value={newActivityCategory}
                        onChange={(e) => setNewActivityCategory(e.target.value)}
                        className="text-xs p-2.5 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none font-medium"
                      >
                        <option value="attraction">Attraction</option>
                        <option value="restaurant">Restaurant/Café</option>
                        <option value="activity">Trek/Activity</option>
                        <option value="meetup_time">Meetup Timing</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isProposing || !newActivityTitle.trim()}
                        className="px-4 py-2.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#20453B] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isProposing ? "Proposing..." : "Propose"}
                      </button>
                    </div>
                  </form>

                  {/* Activities Voting Cards */}
                  <div className="space-y-3">
                    {activities.length === 0 ? (
                      <div className="text-center py-12 text-xs text-[#20211D]/60">
                        No proposed activities yet. Be the first to suggest a meetup spot or trail!
                      </div>
                    ) : (
                      activities.map((act) => (
                        <div
                          key={act.id}
                          className="bg-white border border-[#D8CBB2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32] text-[10px] font-bold uppercase">
                                {act.category}
                              </span>
                              {act.is_consensus_favorite && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  Consensus Favorite
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-[#173B32]">
                              {act.place_name || act.custom_title}
                            </h4>
                            <p className="text-[11px] text-[#20211D]/60">
                              Suggested by {act.suggested_by_name} • {act.compatibility_score}% Circle Approval
                            </p>
                          </div>

                          {/* Voting Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVote(act.id, "LOVE")}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                act.my_vote === "LOVE"
                                  ? "bg-red-500 text-white shadow-xs"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                              title="Love it"
                            >
                              <Heart className="w-3.5 h-3.5 fill-current" />
                              <span>{act.love_count}</span>
                            </button>

                            <button
                              onClick={() => handleVote(act.id, "LIKE")}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                act.my_vote === "LIKE"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                              title="Like it"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{act.like_count}</span>
                            </button>

                            <button
                              onClick={() => handleVote(act.id, "NO")}
                              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                act.my_vote === "NO"
                                  ? "bg-neutral-600 text-white shadow-xs"
                                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                              }`}
                              title="Skip"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>{act.no_count}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: MAP & ROUTE */}
              {activeTab === "map" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-white border border-[#D8CBB2] rounded-2xl p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1">
                      Public Meetup Point Navigation
                    </h4>
                    <p className="text-xs text-[#20211D]/70">
                      Meet your travel circle at <span className="font-bold text-[#173B32]">{circle?.meetup_point}</span>. Private user GPS coordinates are isolated for traveler safety.
                    </p>
                  </div>

                  <div className="h-96 rounded-2xl overflow-hidden border border-[#D8CBB2] relative shadow-md">
                    <VanvasMap
                      center={{ lat: circle?.meetup_lat || 32.0100, lng: circle?.meetup_lng || 77.3150 }}
                      zoom={14}
                      markers={[
                        {
                          id: "meetup-point",
                          lat: circle?.meetup_lat || 32.0100,
                          lng: circle?.meetup_lng || 77.3150,
                          title: circle?.meetup_point || "Meetup Point",
                          description: circle?.name,
                          type: "attraction",
                          provenance: "VERIFIED",
                        },
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: ASK VANVAS AI */}
              {activeTab === "ai" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="bg-white border border-[#D8CBB2] rounded-2xl p-4 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#B49252]" />
                      <h4 className="text-xs font-bold text-[#173B32] uppercase tracking-wider">
                        Ask VANVAS Circle Intelligence
                      </h4>
                    </div>
                    <p className="text-xs text-[#20211D]/70 leading-relaxed">
                      Synthesizes all circle members&apos; travel styles, verified POIs, live weather forecast, and opening hours for cohesive group scheduling.
                    </p>
                  </div>

                  {/* Preset Prompt Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Plan our day.",
                      "We have 6 hours.",
                      "Find something everyone can do.",
                      "Make the plan cheaper.",
                      "Suggest scenic cafes for our group.",
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskVanvas(prompt)}
                        disabled={aiLoading}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#D8CBB2] hover:bg-[#173B32] hover:text-[#FAF4E8] text-xs font-semibold text-[#173B32] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Custom Prompt Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ask copilot to plan or optimize circle itinerary..."
                      className="flex-1 text-xs p-3 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none focus:ring-1 focus:ring-[#173B32]"
                    />
                    <button
                      onClick={() => handleAskVanvas()}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{aiLoading ? "Planning..." : "Ask AI"}</span>
                    </button>
                  </div>

                  {/* AI Response Card */}
                  {aiResponse && (
                    <div className="bg-white border border-[#B49252]/40 rounded-2xl p-5 shadow-sm space-y-4 animate-fadeIn">
                      <div className="border-b border-[#D8CBB2]/60 pb-3">
                        <span className="text-[10px] font-mono uppercase text-[#B49252] font-bold block">
                          GENERATED GROUP EXPEDITION
                        </span>
                        <h4 className="font-serif text-lg font-bold text-[#173B32]">
                          {aiResponse.plan_title}
                        </h4>
                        <p className="text-xs text-[#20211D]/80 mt-1 leading-relaxed">
                          {aiResponse.narrative}
                        </p>
                      </div>

                      {/* Suggested POIs */}
                      {aiResponse.suggested_activities && aiResponse.suggested_activities.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-[#173B32] uppercase tracking-wider block">
                            Recommended POIs & Flow
                          </span>
                          <div className="space-y-2">
                            {aiResponse.suggested_activities.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2] text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-[#173B32]">{item.place_name}</span>
                                  <span className="text-[10px] text-[#20211D]/60 ml-2">({item.category})</span>
                                  <div className="text-[11px] text-[#20211D]/70">{item.highlight}</div>
                                </div>
                                <span className="font-mono text-xs font-bold text-[#B49252] shrink-0">
                                  {item.timing}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safety Advisories */}
                      {aiResponse.safety_advisories && aiResponse.safety_advisories.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                          <span className="font-bold flex items-center gap-1 text-[11px] uppercase">
                            <Shield className="w-3 h-3 text-amber-700" />
                            Safety & Trail Etiquette
                          </span>
                          <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                            {aiResponse.safety_advisories.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
