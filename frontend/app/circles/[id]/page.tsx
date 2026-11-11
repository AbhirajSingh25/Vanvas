"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api } from "@/lib/api";
import {
  CrewCircleDetail, CrewCircleMember, CrewCircleTrip,
  CrewCircleSuggestion, CrewCircleActivity, SplitPod,
  CollaborativeExpense, ContextBalances, SettlementRecord
} from "@/types";
import {
  Users, Calendar, Compass, DollarSign, MessageSquare, Sparkles,
  ArrowLeft, Plus, Check, Trash2, ArrowRight, Shield, ThumbsUp,
  AlertCircle, RefreshCw, Send, Layers, Split, CreditCard, ChevronRight
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { motion, AnimatePresence } from "motion/react";

function CircleWorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const circleId = params?.id as string;
  const { user } = useAuth();

  const [circle, setCircle] = useState<CrewCircleDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "explore" | "money" | "activity" | "ai">("overview");
  const [loading, setLoading] = useState(true);

  // Sub-data states
  const [suggestions, setSuggestions] = useState<CrewCircleSuggestion[]>([]);
  const [activityFeed, setActivityFeed] = useState<CrewCircleActivity[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [pods, setPods] = useState<SplitPod[]>([]);
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<CollaborativeExpense[]>([]);
  const [balances, setBalances] = useState<ContextBalances | null>(null);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);

  // Modals
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [memberVanvasId, setMemberVanvasId] = useState("");
  const [addExpenseModal, setAddExpenseModal] = useState(false);
  const [createPodModal, setCreatePodModal] = useState(false);
  const [newPodName, setNewPodName] = useState("");
  const [newPodDesc, setNewPodDesc] = useState("");
  const [selectedPodMemberIds, setSelectedPodMemberIds] = useState<string[]>([]);
  const [settleModal, setSettleModal] = useState(false);
  const [settlePayerId, setSettlePayerId] = useState("");
  const [settleReceiverId, setSettleReceiverId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [newSuggestionModal, setNewSuggestionModal] = useState(false);
  const [suggTitle, setSuggTitle] = useState("");
  const [suggType, setSuggType] = useState("destination");
  const [suggDesc, setSuggDesc] = useState("");

  // Ask VANVAS AI State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReply, setAiReply] = useState<string | null>(null);

  // Expense Composer States
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("Food");
  const [expSplitMethod, setExpSplitMethod] = useState("EQUAL");
  const [expPayerId, setExpPayerId] = useState("");

  useEffect(() => {
    if (circleId) {
      loadCircleAll();
    }
  }, [circleId]);

  useEffect(() => {
    if (circleId && activeTab === "money") {
      loadFinanceData();
    }
  }, [circleId, activeTab, selectedPodId]);

  const loadCircleAll = async () => {
    setLoading(true);
    try {
      const data = await api.getCrewCircleDetail(circleId);
      setCircle(data);
      if (user?.id) setExpPayerId(user.id);
      const [suggs, acts, podList] = await Promise.all([
        api.getCrewCircleSuggestions(circleId),
        api.getCrewCircleActivity(circleId),
        api.getSplitPodsInCircle(circleId),
      ]);
      setSuggestions(suggs || []);
      setActivityFeed(acts || []);
      setPods(podList || []);
    } catch (err) {
      console.error("Failed to load circle workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFinanceData = async () => {
    try {
      const financeParams = selectedPodId
        ? { split_pod_id: selectedPodId }
        : { circle_id: circleId };

      const [expList, balData, setList] = await Promise.all([
        api.getCollaborativeExpenses(financeParams),
        api.getContextBalances(financeParams),
        api.getSettlementPayments(financeParams),
      ]);
      setExpenses(expList || []);
      setBalances(balData || null);
      setSettlements(setList || []);
    } catch (err) {
      console.error("Failed to load finance data:", err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberVanvasId.trim()) return;
    try {
      await api.addCrewCircleMember(circleId, { user_id: memberVanvasId.trim() });
      setAddMemberModal(false);
      setMemberVanvasId("");
      loadCircleAll();
    } catch (err: any) {
      alert(err.message || "Failed to add member");
    }
  };

  const handlePostChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    try {
      await api.postCrewCircleActivity(circleId, chatMessage.trim());
      setChatMessage("");
      const acts = await api.getCrewCircleActivity(circleId);
      setActivityFeed(acts || []);
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    }
  };

  const handleVote = async (suggId: string) => {
    try {
      await api.voteCrewCircleSuggestion(suggId, circleId);
      const suggs = await api.getCrewCircleSuggestions(circleId);
      setSuggestions(suggs || []);
    } catch (err: any) {
      console.error("Vote failed:", err);
    }
  };

  const handleCreateSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggTitle.trim()) return;
    try {
      await api.createCrewCircleSuggestion(circleId, {
        title: suggTitle.trim(),
        suggestion_type: suggType,
        description: suggDesc.trim() || undefined,
      });
      setNewSuggestionModal(false);
      setSuggTitle("");
      setSuggDesc("");
      const suggs = await api.getCrewCircleSuggestions(circleId);
      setSuggestions(suggs || []);
    } catch (err: any) {
      alert(err.message || "Failed to add suggestion");
    }
  };

  const handleCreatePod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPodName.trim()) return;
    try {
      await api.createSplitPod({
        circle_id: circleId,
        name: newPodName.trim(),
        description: newPodDesc.trim() || undefined,
        initial_member_user_ids: selectedPodMemberIds,
      });
      setCreatePodModal(false);
      setNewPodName("");
      setNewPodDesc("");
      setSelectedPodMemberIds([]);
      const podList = await api.getSplitPodsInCircle(circleId);
      setPods(podList || []);
    } catch (err: any) {
      alert(err.message || "Failed to create Split Pod");
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(amt) || amt <= 0) {
      alert("Please provide a valid title and positive amount");
      return;
    }
    try {
      await api.createCollaborativeExpense({
        title: expTitle.trim(),
        amount: amt,
        category: expCategory,
        split_method: expSplitMethod,
        circle_id: selectedPodId ? undefined : circleId,
        split_pod_id: selectedPodId || undefined,
        paid_by_user_id: expPayerId || user?.id,
      });
      setAddExpenseModal(false);
      setExpTitle("");
      setExpAmount("");
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || "Failed to create expense");
    }
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(settleAmount);
    if (!settlePayerId || !settleReceiverId || isNaN(amt) || amt <= 0) {
      alert("Invalid settlement details");
      return;
    }
    try {
      await api.recordCollaborativeSettlement({
        circle_id: selectedPodId ? undefined : circleId,
        split_pod_id: selectedPodId || undefined,
        payer_user_id: settlePayerId,
        receiver_user_id: settleReceiverId,
        amount: amt,
      });
      setSettleModal(false);
      setSettleAmount("");
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || "Failed to record settlement");
    }
  };

  const handleAskVanvas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiReply(null);
    try {
      const res = await api.askVanvasForCrewCircle(circleId, aiPrompt.trim());
      setAiReply(res.reply);
    } catch (err: any) {
      setAiReply("VANVAS Copilot is currently recalibrating mountain routes. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center p-8 text-xs font-mono text-[#173B32]">
        Loading Circle Workspace...
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="min-h-screen bg-[#FAF4E8] p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#173B32]">Circle not found</h2>
        <Link href="/circles" className="text-xs font-bold text-[#B65E3C]">
          ← Back to Circles
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF4E8] py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/circles"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#173B32] hover:text-[#B65E3C] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Circles</span>
          </Link>
          <span className="px-3 py-1 rounded-full bg-[#173B32]/10 text-xs font-bold font-mono text-[#173B32] uppercase">
            {circle.my_role}
          </span>
        </div>

        {/* Hero Header */}
        <div className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#173B32] text-[#B49252] flex items-center justify-center shadow-md">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                {circle.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#20211D]/70 mt-0.5">
                {circle.description || "Mountain expedition and weekend travel crew."}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#B49252] font-semibold mt-1">
                <span>{circle.members.length} Members</span>
                <span>·</span>
                <span>{circle.trips.length} Linked Expeditions</span>
                <span>·</span>
                <span>{pods.length} Split Pods</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAddMemberModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#173B32] hover:bg-[#E5D5BA]/50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Add Member</span>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className="px-4 py-2.5 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Ask VANVAS</span>
            </button>
          </div>
        </div>

        {/* Workspace Tab Navigation */}
        <div className="flex border-b border-[#D8CBB2] gap-1 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "Overview", icon: Users },
            { id: "plans", label: `Plans (${circle.trips.length})`, icon: Calendar },
            { id: "explore", label: `Explore Together (${suggestions.length})`, icon: Compass },
            { id: "money", label: "Money & Split Pods", icon: DollarSign },
            { id: "activity", label: "Chat & Activity", icon: MessageSquare },
            { id: "ai", label: "Ask VANVAS", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#173B32] text-[#FAF7F0] shadow-xs"
                    : "text-[#20211D]/70 hover:text-[#173B32] hover:bg-[#E5D5BA]/40"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#B49252]" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Members & Trips */}
            <div className="lg:col-span-2 space-y-6">
              {/* Members Section */}
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#D8CBB2]/60 pb-3">
                  <h3 className="font-serif font-bold text-lg text-[#173B32] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#B49252]" />
                    <span>Crew Members ({circle.members.length})</span>
                  </h3>
                  <button
                    onClick={() => setAddMemberModal(true)}
                    className="text-xs font-bold text-[#B65E3C] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {circle.members.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white border border-[#D8CBB2]/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          user={{
                            id: m.user_id,
                            full_name: m.user_name,
                            avatar_url: m.avatar_url,
                            avatar_preset: m.avatar_preset,
                          } as any}
                          size="sm"
                        />
                        <div>
                          <h4 className="font-serif font-bold text-xs text-[#173B32]">
                            {m.user_name}
                          </h4>
                          <span className="text-[10px] font-mono text-[#B49252]">
                            {m.vanvas_id || "MEMBER"}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Expeditions */}
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#D8CBB2]/60 pb-3">
                  <h3 className="font-serif font-bold text-lg text-[#173B32] flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#B49252]" />
                    <span>Expeditions ({circle.trips.length})</span>
                  </h3>
                  <Link
                    href="/plan"
                    className="text-xs font-bold text-[#B65E3C] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Trip</span>
                  </Link>
                </div>

                {circle.trips.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#20211D]/60 space-y-2">
                    <p>No trips linked to this circle yet.</p>
                    <Link
                      href="/plan"
                      className="inline-block px-4 py-2 rounded-xl bg-[#173B32] text-white text-xs font-bold mt-1"
                    >
                      Plan Expedition for {circle.name}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {circle.trips.map((t) => (
                      <Link
                        key={t.id}
                        href={`/trips/${t.trip_id}`}
                        className="bg-white border border-[#D8CBB2]/60 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-[#173B32] transition-colors group"
                      >
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                            {t.title}
                          </h4>
                          <span className="text-xs text-[#20211D]/60">
                            {t.destination_name || "Mountain Destination"}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#B49252] group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Quick Finance & Settlement Snapshot */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#173B32] to-[#0F2922] text-[#FAF7F0] border-2 border-[#B49252]/40 rounded-3xl p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B49252]">
                    Smart Ledger Snapshot
                  </span>
                  <DollarSign className="w-4 h-4 text-[#B49252]" />
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-[#E5D5BA]/80 uppercase font-bold">
                    Total Shared Group Spend
                  </div>
                  <div className="font-serif text-3xl font-bold text-white">
                    ₹{balances?.total_shared_expenses.toLocaleString("en-IN") || "0"}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab("money")}
                    className="w-full py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold transition-all text-center"
                  >
                    Open Group Ledger & Pods
                  </button>
                </div>
              </div>

              {/* Split Pods mini summary */}
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-[#173B32]">
                    Subgroup Split Pods ({pods.length})
                  </h4>
                  <button
                    onClick={() => {
                      setActiveTab("money");
                      setCreatePodModal(true);
                    }}
                    className="text-xs font-bold text-[#B65E3C] hover:underline"
                  >
                    + Pod
                  </button>
                </div>

                <p className="text-[11px] text-[#20211D]/70">
                  Isolated expense pods for subgroups (e.g. Smokers, Alcohol, Bike Rental) with zero debt leakage.
                </p>

                <div className="space-y-2 pt-1">
                  {pods.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPodId(p.id);
                        setActiveTab("money");
                      }}
                      className="p-3 bg-white rounded-xl border border-[#D8CBB2]/60 flex items-center justify-between cursor-pointer hover:border-[#173B32] transition-colors"
                    >
                      <div>
                        <span className="font-bold text-xs text-[#173B32]">{p.name}</span>
                        <div className="text-[10px] text-[#20211D]/60">{p.member_count} members</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#B49252]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLANS (MULTI-TRIP ITINERARIES) */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#173B32]">Circle Expeditions</h3>
                <p className="text-xs text-[#20211D]/70">
                  Plan multiple trips together for this circle
                </p>
              </div>
              <Link
                href="/plan"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors"
              >
                <Plus className="w-4 h-4 text-[#B49252]" />
                <span>+ Plan Together</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {circle.trips.map((t) => (
                <Link
                  key={t.id}
                  href={`/trips/${t.trip_id}`}
                  className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-6 shadow-xs hover:border-[#173B32] transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#173B32]/10 text-[10px] font-bold text-[#173B32] uppercase">
                      {t.destination_name || "Mountain Expedition"}
                    </span>
                    <span className="text-xs font-bold text-[#B49252]">
                      ₹{t.budget_total ? t.budget_total.toLocaleString("en-IN") : "0"} Budget
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-lg text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                    {t.title}
                  </h4>
                  <div className="pt-4 mt-4 border-t border-[#D8CBB2]/50 flex items-center justify-between text-xs font-bold text-[#173B32]">
                    <span>View Itinerary & Bookings</span>
                    <ArrowRight className="w-4 h-4 text-[#B49252] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: EXPLORE TOGETHER (SUGGESTIONS & VOTING) */}
        {activeTab === "explore" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#173B32]">
                  Explore Together · Suggestions & Voting
                </h3>
                <p className="text-xs text-[#20211D]/70">
                  Propose destinations, riverside stays, and treks. Vote to build consensus.
                </p>
              </div>
              <button
                onClick={() => setNewSuggestionModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Propose Idea</span>
              </button>
            </div>

            {suggestions.length === 0 ? (
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-12 text-center text-xs text-[#20211D]/60 space-y-2">
                <Compass className="w-10 h-10 text-[#B49252] mx-auto opacity-50" />
                <p>No proposals yet. Suggest a mountain spot to vote with your crew!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#173B32]/10 text-[10px] font-bold text-[#173B32] uppercase">
                          {s.suggestion_type}
                        </span>
                        <span className="text-[11px] text-[#20211D]/60">
                          by {s.user_name}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-[#173B32]">
                        {s.title}
                      </h4>
                      {s.description && (
                        <p className="text-xs text-[#20211D]/70 mt-1">
                          {s.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#D8CBB2]/50 flex items-center justify-between">
                      <button
                        onClick={() => handleVote(s.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          s.has_voted
                            ? "bg-[#173B32] text-white border-[#173B32]"
                            : "bg-white text-[#173B32] border-[#D8CBB2] hover:bg-[#E5D5BA]/50"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{s.votes_count} Votes</span>
                      </button>
                      <span className="text-[11px] text-[#B49252] font-semibold">
                        {s.has_voted ? "You voted" : "Tap to vote"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MONEY & SPLIT PODS (3-LAYER FINANCE SYSTEM) */}
        {activeTab === "money" && (
          <div className="space-y-6">
            {/* Layer Filter / Context Switcher */}
            <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedPodId(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedPodId === null
                      ? "bg-[#173B32] text-white shadow-xs"
                      : "bg-white text-[#20211D]/70 border border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                  }`}
                >
                  Layer 2: Main Group Ledger
                </button>

                {pods.map((pod) => (
                  <button
                    key={pod.id}
                    onClick={() => setSelectedPodId(pod.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedPodId === pod.id
                        ? "bg-[#B65E3C] text-white shadow-xs"
                        : "bg-white text-[#20211D]/70 border border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Layer 3 Pod: {pod.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreatePodModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#173B32] hover:bg-[#E5D5BA]/50 transition-colors"
                >
                  + New Split Pod
                </button>
                <button
                  onClick={() => setAddExpenseModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>

            {/* Context Notification Banner */}
            {selectedPodId ? (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Split className="w-5 h-5 text-amber-700" />
                  <div>
                    <span className="font-bold">Active Isolated Split Pod Ledger</span>
                    <p className="text-[11px] text-amber-800">
                      Expenses and settlements in this pod are strictly private. Zero debt leaks into the main group ledger.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPodId(null)}
                  className="px-3 py-1 rounded-lg bg-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-300"
                >
                  Back to Main Ledger
                </button>
              </div>
            ) : null}

            {/* Balances & Settlement Action Card */}
            {balances && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-bold text-[#20211D]/60 uppercase tracking-wider">
                    Total Shared Spend
                  </span>
                  <div className="font-serif text-3xl font-bold text-[#173B32] my-2">
                    ₹{balances.total_shared_expenses.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[11px] text-[#20211D]/60">
                    Calculated in exact integer paise
                  </span>
                </div>

                <div className="md:col-span-2 bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D8CBB2]/60 pb-2">
                    <span className="text-xs font-bold text-[#173B32] uppercase tracking-wider">
                      Simplified Debts ({balances.simplified_debts.length})
                    </span>
                    <button
                      onClick={() => setSettleModal(true)}
                      className="text-xs font-bold text-[#B65E3C] hover:underline flex items-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  </div>

                  {balances.simplified_debts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#20211D]/60">
                      All balances are completely settled!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {balances.simplified_debts.map((d, i) => (
                        <div
                          key={i}
                          className="p-3 bg-white border border-[#D8CBB2]/60 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#173B32]">{d.debtor_name}</span>
                            <span className="text-[#20211D]/60"> owes </span>
                            <span className="font-bold text-[#173B32]">{d.creditor_name}</span>
                          </div>
                          <span className="font-mono font-bold text-sm text-[#B65E3C]">
                            ₹{d.amount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expenses Ledger */}
            <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 shadow-xs space-y-4">
              <h4 className="font-serif font-bold text-lg text-[#173B32] flex items-center gap-2">
                <span>Expenses Ledger</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32]">
                  {expenses.length}
                </span>
              </h4>

              {expenses.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#20211D]/60">
                  No expenses recorded in this ledger yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-white border border-[#D8CBB2]/60 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-[#E5D5BA]/60 text-[10px] font-bold text-[#173B32] uppercase">
                            {exp.category}
                          </span>
                          <span className="text-[10px] text-[#20211D]/60">
                            v{exp.version}
                          </span>
                        </div>
                        <h5 className="font-serif font-bold text-sm text-[#173B32]">
                          {exp.title}
                        </h5>
                        <p className="text-xs text-[#20211D]/70 mt-0.5">
                          Paid by <span className="font-bold">{exp.payer_name}</span> · {exp.split_method} split among {exp.shares.length} participants
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-serif font-bold text-lg text-[#173B32]">
                          ₹{exp.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-[#20211D]/50 font-mono">
                          {exp.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CHAT & ACTIVITY FEED */}
        {activeTab === "activity" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-lg text-[#173B32]">
                Circle Message Board & Log
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {activityFeed.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#20211D]/60">
                    No circle messages yet. Start the conversation!
                  </div>
                ) : (
                  activityFeed.map((act) => (
                    <div
                      key={act.id}
                      className="bg-white border border-[#D8CBB2]/60 rounded-2xl p-3.5 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#173B32]">{act.user_name}</span>
                        <span className="text-[10px] text-[#20211D]/50 font-mono">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#20211D]/80 leading-relaxed">
                        {act.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handlePostChat} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Share notes, arrival updates, or plans..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32] focus:outline-none focus:ring-2 focus:ring-[#173B32]"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: ASK VANVAS COPILOT */}
        {activeTab === "ai" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-[#FAF7F0] border-2 border-[#173B32] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-[#D8CBB2] pb-3">
                <span className="p-2.5 rounded-2xl bg-[#173B32] text-white">
                  <Sparkles className="w-5 h-5 text-[#B49252]" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#173B32]">
                    Ask VANVAS for Circle · मण्डली मार्गदर्शक
                  </h3>
                  <p className="text-xs text-[#20211D]/70">
                    AI Travel Companion analyzing whole-group preferences, dietary habits, and mountain safety
                  </p>
                </div>
              </div>

              <form onSubmit={handleAskVanvas} className="space-y-3">
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Recommend a 3-day weekend road trip from Delhi for 4 friends who love cafés and high mountain passes."
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-[#D8CBB2] text-xs sm:text-sm text-[#173B32] focus:outline-none focus:ring-2 focus:ring-[#173B32]"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate Group Advice</span>
                </button>
              </form>

              {aiReply && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-white border border-[#D8CBB2] rounded-2xl shadow-inner text-xs sm:text-sm text-[#20211D] leading-relaxed whitespace-pre-line"
                >
                  {aiReply}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD MEMBER */}
      <AnimatePresence>
        {addMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <h3 className="font-serif text-lg font-bold text-[#173B32]">
                Add Member to Circle
              </h3>
              <p className="text-xs text-[#20211D]/70">
                Enter your friend's user ID or VANVAS ID (VNV-XXXX-XXXX)
              </p>
              <form onSubmit={handleAddMember} className="space-y-3">
                <input
                  type="text"
                  required
                  value={memberVanvasId}
                  onChange={(e) => setMemberVanvasId(e.target.value.toUpperCase())}
                  placeholder="VNV-XXXX-XXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8CBB2] text-xs font-mono text-[#173B32]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#173B32] text-white text-xs font-bold"
                  >
                    Add Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMemberModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE SPLIT POD */}
      <AnimatePresence>
        {createPodModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="font-serif text-lg font-bold text-[#173B32] flex items-center gap-2">
                <Split className="w-5 h-5 text-[#B65E3C]" />
                <span>Create Split Pod (Subgroup)</span>
              </h3>
              <p className="text-xs text-[#20211D]/70">
                Create an isolated financial subgroup (e.g. Smokers Pod, Drinkers Pod, Rental Bike Pod). Debts will never leak to other members.
              </p>

              <form onSubmit={handleCreatePod} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#173B32] mb-1">
                    Pod Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPodName}
                    onChange={(e) => setNewPodName(e.target.value)}
                    placeholder="e.g. Smokers Pod"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173B32] mb-1">
                    Select Pod Members ({selectedPodMemberIds.length} selected)
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-white border border-[#D8CBB2] rounded-xl">
                    {circle.members.map((m) => {
                      const isSelected = selectedPodMemberIds.includes(m.user_id);
                      return (
                        <div
                          key={m.id}
                          onClick={() =>
                            setSelectedPodMemberIds((prev) =>
                              prev.includes(m.user_id)
                                ? prev.filter((id) => id !== m.user_id)
                                : [...prev, m.user_id]
                            )
                          }
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                            isSelected ? "bg-[#B65E3C]/10 border border-[#B65E3C]/30 font-bold" : "hover:bg-gray-50"
                          }`}
                        >
                          <span>{m.user_name}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#B65E3C]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#B65E3C] text-white text-xs font-bold hover:bg-[#9E4D2E]"
                  >
                    Create Pod
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatePodModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD EXPENSE */}
      <AnimatePresence>
        {addExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="font-serif text-lg font-bold text-[#173B32]">
                Add Group Expense · खर्च जोड़ें
              </h3>

              <form onSubmit={handleCreateExpense} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#173B32] mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="e.g. Paratha & Chai / Taxi fare"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#173B32] mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      placeholder="900"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#173B32] mb-1">Category</label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                    >
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Stay">Stay</option>
                      <option value="Fuel">Fuel</option>
                      <option value="Activities">Activities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173B32] mb-1">Paid By</label>
                  <select
                    value={expPayerId}
                    onChange={(e) => setExpPayerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                  >
                    {circle.members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B]"
                  >
                    Save Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddExpenseModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SETTLEMENT RECORD */}
      <AnimatePresence>
        {settleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="font-serif text-lg font-bold text-[#173B32]">
                Record Settlement Payment
              </h3>

              <form onSubmit={handleRecordSettlement} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#173B32] mb-1">Payer (Who paid)</label>
                    <select
                      value={settlePayerId}
                      onChange={(e) => setSettlePayerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                    >
                      <option value="">Select Payer</option>
                      {circle.members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.user_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#173B32] mb-1">Receiver (Who got paid)</label>
                    <select
                      value={settleReceiverId}
                      onChange={(e) => setSettleReceiverId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                    >
                      <option value="">Select Receiver</option>
                      {circle.members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.user_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173B32] mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="300"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#173B32] text-white text-xs font-bold"
                  >
                    Confirm Settlement
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NEW SUGGESTION */}
      <AnimatePresence>
        {newSuggestionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="font-serif text-lg font-bold text-[#173B32]">
                Propose Idea for Circle
              </h3>

              <form onSubmit={handleCreateSuggestion} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#173B32] mb-1">Type</label>
                  <select
                    value={suggType}
                    onChange={(e) => setSuggType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                  >
                    <option value="destination">Destination</option>
                    <option value="place">Sightseeing Place</option>
                    <option value="activity">Trek or Activity</option>
                    <option value="stay">Homestay / Camp</option>
                    <option value="food">Local Food Spot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173B32] mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={suggTitle}
                    onChange={(e) => setSuggTitle(e.target.value)}
                    placeholder="e.g. Camp by Chandratal Lake"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173B32] mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={suggDesc}
                    onChange={(e) => setSuggDesc(e.target.value)}
                    placeholder="Why this would be great for the group..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs text-[#173B32]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#B65E3C] text-white text-xs font-bold hover:bg-[#9E4D2E]"
                  >
                    Propose Idea
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSuggestionModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CircleWorkspacePage() {
  return (
    <ProtectedRoute>
      <CircleWorkspaceContent />
    </ProtectedRoute>
  );
}
