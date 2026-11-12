"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Users,
  Layers,
  Calculator,
  Sparkles,
  Check,
  Percent,
  Receipt,
  Tag,
  DollarSign,
  ChevronDown
} from "lucide-react";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scrollLock";

export interface BudgetItemMember {
  user_id: string;
  full_name: string;
  vanvas_id?: string;
  avatar_url?: string;
}

export interface SplitPodOption {
  id: string;
  name: string;
  member_user_ids?: string[];
}

export type CalculationBasis = "FIXED" | "PER_PERSON" | "QTY_UNIT";
export type SplitScope = "EVERYONE" | "SELECTED" | "SPLIT_POD" | "PERSONAL";
export type SplitMethod = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES" | "ITEMIZED";

export interface AddBudgetItemPayload {
  title: string;
  category: string;
  calculation_basis: CalculationBasis;
  unit_price: number;
  quantity: number;
  amount: number;
  split_scope: SplitScope;
  split_pod_id?: string;
  split_method: SplitMethod;
  selected_user_ids: string[];
  exact_shares?: Record<string, number>; // user_id -> amount/percentage/shares
  notes?: string;
}

interface AddBudgetItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AddBudgetItemPayload) => Promise<void> | void;
  members: BudgetItemMember[];
  splitPods?: SplitPodOption[];
  currentUserId?: string;
  isForecastOnly?: boolean;
}

const CATEGORIES = [
  { id: "stay", label: "Stay · आवास", icon: "🏕️" },
  { id: "food", label: "Food & Chai · भोजन", icon: "☕" },
  { id: "fuel", label: "Fuel / Cab · यात्रा", icon: "🚙" },
  { id: "passes", label: "Passes & Entry · पास", icon: "🎟️" },
  { id: "gear", label: "Gear & Rental · उपकरण", icon: "🎒" },
  { id: "misc", label: "Misc · अन्य", icon: "🪙" },
];

const EMPTY_MEMBERS: BudgetItemMember[] = [];
const EMPTY_PODS: SplitPodOption[] = [];

function areIdArraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const AddBudgetItemModal: React.FC<AddBudgetItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  members = EMPTY_MEMBERS,
  splitPods = EMPTY_PODS,
  currentUserId,
  isForecastOnly = false,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("food");
  const [calculationBasis, setCalculationBasis] = useState<CalculationBasis>("FIXED");
  const [fixedAmount, setFixedAmount] = useState<string>("600");
  const [unitPrice, setUnitPrice] = useState<string>("150");
  const [quantity, setQuantity] = useState<string>("4");
  const [perPersonRate, setPerPersonRate] = useState<string>("200");

  const [splitScope, setSplitScope] = useState<SplitScope>("EVERYONE");
  const [selectedPodId, setSelectedPodId] = useState<string>(splitPods[0]?.id || "");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() =>
    members.map((m) => m.user_id)
  );

  const [splitMethod, setSplitMethod] = useState<SplitMethod>("EQUAL");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const membersRef = useRef(members);
  membersRef.current = members;
  const splitPodsRef = useRef(splitPods);
  splitPodsRef.current = splitPods;

  // Stable primitive keys avoid infinite effect loops when callers pass fresh inline array literals
  const memberIdsKey = members.map((m) => m.user_id).join("|");
  const podSignatureKey = splitPods
    .map((p) => `${p.id}:${(p.member_user_ids || []).join(",")}`)
    .join("|");

  // Lock body scroll and close on Escape only while modal is actually open
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    acquireScrollLock();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      releaseScrollLock();
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  // Sync selected members when scope, pod, or member list identities change
  useEffect(() => {
    if (!isOpen) return;
    const currentMembers = membersRef.current;
    const currentPods = splitPodsRef.current;
    let nextIds: string[] | null = null;

    if (splitScope === "EVERYONE") {
      nextIds = currentMembers.map((m) => m.user_id);
    } else if (splitScope === "PERSONAL" && currentUserId) {
      nextIds = [currentUserId];
    } else if (splitScope === "SPLIT_POD" && selectedPodId) {
      const pod = currentPods.find((p) => p.id === selectedPodId);
      if (pod && pod.member_user_ids && pod.member_user_ids.length > 0) {
        nextIds = pod.member_user_ids;
      }
    } else if (currentMembers.length > 0) {
      setSelectedUserIds((prev) =>
        prev.length === 0 ? currentMembers.map((m) => m.user_id) : prev
      );
      return;
    }

    if (nextIds) {
      const targetIds = nextIds;
      setSelectedUserIds((prev) =>
        areIdArraysEqual(prev, targetIds) ? prev : targetIds
      );
    }
  }, [isOpen, splitScope, selectedPodId, memberIdsKey, currentUserId, podSignatureKey]);

  // Compute active participant list
  const activeParticipants = useMemo(() => {
    return members.filter((m) => selectedUserIds.includes(m.user_id));
  }, [members, selectedUserIds]);

  const participantCount = Math.max(1, activeParticipants.length);

  // Calculate Total Amount based on Calculation Basis
  const totalAmount = useMemo(() => {
    if (calculationBasis === "FIXED") {
      return parseFloat(fixedAmount) || 0;
    } else if (calculationBasis === "PER_PERSON") {
      const rate = parseFloat(perPersonRate) || 0;
      return rate * participantCount;
    } else if (calculationBasis === "QTY_UNIT") {
      const price = parseFloat(unitPrice) || 0;
      const qty = parseFloat(quantity) || 0;
      return price * qty;
    }
    return 0;
  }, [calculationBasis, fixedAmount, perPersonRate, unitPrice, quantity, participantCount]);

  // Per-person share
  const perPersonShare = useMemo(() => {
    if (participantCount === 0) return 0;
    return totalAmount / participantCount;
  }, [totalAmount, participantCount]);

  const handleToggleUser = (userId: string) => {
    if (splitScope === "EVERYONE") {
      setSplitScope("SELECTED");
    }
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter an item name · शीर्षक आवश्यक है");
      return;
    }
    if (totalAmount <= 0) {
      setErrorMsg("Amount must be greater than zero · राशि 0 से अधिक होनी चाहिए");
      return;
    }
    if (!isForecastOnly && selectedUserIds.length === 0) {
      setErrorMsg("Select at least one participant · कम से कम 1 सदस्य चुनें");
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const sharesRecord: Record<string, number> = {};
      if (splitMethod !== "EQUAL") {
        selectedUserIds.forEach((uid) => {
          sharesRecord[uid] = parseFloat(customShares[uid] || "0");
        });
      }

      await onSubmit({
        title: title.trim(),
        category,
        calculation_basis: calculationBasis,
        unit_price: calculationBasis === "QTY_UNIT" ? parseFloat(unitPrice) || 0 : calculationBasis === "PER_PERSON" ? parseFloat(perPersonRate) || 0 : totalAmount,
        quantity: calculationBasis === "QTY_UNIT" ? parseFloat(quantity) || 1 : calculationBasis === "PER_PERSON" ? participantCount : 1,
        amount: totalAmount,
        split_scope: splitScope,
        split_pod_id: splitScope === "SPLIT_POD" ? selectedPodId : undefined,
        split_method: splitMethod,
        selected_user_ids: selectedUserIds,
        exact_shares: splitMethod !== "EQUAL" ? sharesRecord : undefined,
        notes: notes.trim() || undefined,
      });

      // Reset
      setTitle("");
      setFixedAmount("600");
      setNotes("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save item. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add Budget Item"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="w-full sm:max-w-lg bg-[#FAF7F0] rounded-t-3xl sm:rounded-3xl border-2 border-[#E5D5BA] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#173B32] text-[#FAF7F0] flex items-center justify-between border-b border-[#B49252]/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#B49252] font-bold">
                  {isForecastOnly ? "LAYER 1 · TRIP BUDGET FORECAST" : "LAYER 2/3 · SMART SPLIT ENGINE"}
                </span>
              </div>
              <h3 className="font-serif font-black text-xl text-[#FAF7F0] mt-0.5">
                Add Budget Item · खर्च जोड़ें
              </h3>
            </div>

            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF7F0] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Live Calculation Preview Banner */}
            <div className="p-4 rounded-2xl bg-[#173B32] text-[#FAF7F0] border border-[#B49252]/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#B49252] uppercase tracking-wider">
                <span>LIVE SPLIT PREVIEW · अनुमान</span>
                <span>{participantCount} {participantCount === 1 ? "PERSON" : "PEOPLE"}</span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-serif font-black text-3xl sm:text-4xl text-[#FAF7F0]">
                    ₹{perPersonShare.toFixed(2)}
                  </span>
                  <span className="text-xs text-[#EFE5D2]/80 ml-1.5 font-mono">/ person</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#EFE5D2]/70 font-mono block uppercase">Total Amount</span>
                  <span className="text-lg font-mono font-bold text-[#B49252]">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-[#D8DED5]/80 flex items-center justify-between">
                <span>Basis: {calculationBasis}</span>
                <span>Scope: {splitScope} · Method: {splitMethod}</span>
              </div>
            </div>

            {/* Item Title & Category */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1 font-mono">
                  Item Title · विवरण *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Parvati Valley Riverside Camp, Solang Taxi, Chai & Bun"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#E5D5BA] text-sm text-[#173B32] font-medium focus:outline-none focus:border-[#173B32]"
                  required
                />
              </div>

              {/* Category Pills */}
              <div>
                <label className="block text-[11px] font-bold text-[#7B4D36] uppercase tracking-wider mb-1.5 font-mono">
                  Category · श्रेणी
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all text-left cursor-pointer ${
                        category === cat.id
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                          : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#F4EBD9]"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculation Basis Tabs */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-3">
              <label className="block text-[11px] font-bold text-[#7B4D36] uppercase tracking-wider font-mono">
                Calculation Basis · गणना का तरीका
              </label>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FAF7F0] rounded-xl border border-[#E5D5BA]">
                <button
                  type="button"
                  onClick={() => setCalculationBasis("FIXED")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    calculationBasis === "FIXED"
                      ? "bg-[#173B32] text-[#FAF7F0] shadow-xs"
                      : "text-[#7B4D36] hover:text-[#173B32]"
                  }`}
                >
                  Flat Total
                </button>
                <button
                  type="button"
                  onClick={() => setCalculationBasis("PER_PERSON")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    calculationBasis === "PER_PERSON"
                      ? "bg-[#173B32] text-[#FAF7F0] shadow-xs"
                      : "text-[#7B4D36] hover:text-[#173B32]"
                  }`}
                >
                  Per Person
                </button>
                <button
                  type="button"
                  onClick={() => setCalculationBasis("QTY_UNIT")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    calculationBasis === "QTY_UNIT"
                      ? "bg-[#173B32] text-[#FAF7F0] shadow-xs"
                      : "text-[#7B4D36] hover:text-[#173B32]"
                  }`}
                >
                  Qty × Unit
                </button>
              </div>

              {/* Basis Inputs */}
              {calculationBasis === "FIXED" && (
                <div>
                  <label className="text-[10px] font-mono font-bold text-[#7B4D36] uppercase block mb-1">
                    Total Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7B4D36]">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(e.target.value)}
                      placeholder="600"
                      className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-base font-mono font-bold text-[#173B32]"
                    />
                  </div>
                </div>
              )}

              {calculationBasis === "PER_PERSON" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-[#7B4D36] uppercase block mb-1">
                      Rate / Person (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7B4D36]">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={perPersonRate}
                        onChange={(e) => setPerPersonRate(e.target.value)}
                        placeholder="200"
                        className="w-full pl-7 pr-2 py-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-sm font-mono font-bold text-[#173B32]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-[#7B4D36] uppercase block mb-1">
                      People Count
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${participantCount} Members`}
                      className="w-full px-3 py-2 rounded-xl bg-[#EFE5D2] border border-[#D8CBB2] text-sm font-mono font-bold text-[#173B32] opacity-90 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {calculationBasis === "QTY_UNIT" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-[#7B4D36] uppercase block mb-1">
                      Unit Price (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7B4D36]">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="150"
                        className="w-full pl-7 pr-2 py-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-sm font-mono font-bold text-[#173B32]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-bold text-[#7B4D36] uppercase block mb-1">
                      Quantity (units)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="4"
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-sm font-mono font-bold text-[#173B32]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Split Scope & Pod Selection */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-3">
              <label className="block text-[11px] font-bold text-[#7B4D36] uppercase tracking-wider font-mono">
                Split Scope · विभाजन का दायरा
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: "EVERYONE", label: "Everyone" },
                  { id: "SELECTED", label: "Selected" },
                  { id: "SPLIT_POD", label: "Split Pod" },
                  { id: "PERSONAL", label: "Personal" },
                ].map((scope) => (
                  <button
                    type="button"
                    key={scope.id}
                    onClick={() => setSplitScope(scope.id as SplitScope)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold font-mono transition-all text-center border cursor-pointer ${
                      splitScope === scope.id
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                        : "bg-[#FAF7F0] text-[#7B4D36] border-[#E5D5BA] hover:bg-[#F4EBD9]"
                    }`}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>

              {/* If SPLIT_POD is selected, show pod dropdown */}
              {splitScope === "SPLIT_POD" && (
                <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#173B32]">
                    <span>Select Subgroup Pod (Layer 3)</span>
                  </div>
                  {splitPods.length === 0 ? (
                    <p className="text-xs text-[#7B4D36]">No split pods created yet in this circle.</p>
                  ) : (
                    <select
                      value={selectedPodId}
                      onChange={(e) => setSelectedPodId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5D5BA] text-xs font-bold text-[#173B32]"
                    >
                      {splitPods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.member_user_ids?.length || 0} members)
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[10px] text-[#7B4D36] italic">
                    Pod expenses stay completely isolated and will never affect non-pod members.
                  </p>
                </div>
              )}

              {/* Participant Checklist */}
              {splitScope !== "PERSONAL" && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#7B4D36] uppercase font-bold">
                    <span>Included Travellers ({activeParticipants.length}/{members.length})</span>
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(members.map((m) => m.user_id))}
                      className="text-[#B65E3C] hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {members.map((member) => {
                      const isChecked = selectedUserIds.includes(member.user_id);
                      return (
                        <div
                          key={member.user_id}
                          onClick={() => handleToggleUser(member.user_id)}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? "bg-[#FAF7F0] border-[#173B32] shadow-2xs"
                              : "bg-white/60 border-dashed border-[#D8CBB2] opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-5 h-5 rounded-full bg-[#173B32] text-[#FAF7F0] text-[10px] font-bold flex items-center justify-center shrink-0">
                              {member.full_name?.charAt(0) || "U"}
                            </div>
                            <span className="text-xs font-semibold text-[#173B32] truncate">
                              {member.full_name}
                            </span>
                          </div>

                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                              isChecked
                                ? "bg-[#173B32] border-[#173B32] text-white"
                                : "border-[#B49252]"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Split Method */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-2">
              <label className="block text-[11px] font-bold text-[#7B4D36] uppercase tracking-wider font-mono">
                Split Method · विभाजन विधि
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-[11px] font-mono">
                {[
                  { id: "EQUAL", label: "Equal" },
                  { id: "EXACT", label: "Exact ₹" },
                  { id: "PERCENTAGE", label: "% Split" },
                  { id: "SHARES", label: "Shares" },
                  { id: "ITEMIZED", label: "Itemized" },
                ].map((method) => (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => setSplitMethod(method.id as SplitMethod)}
                    className={`py-1.5 px-1 rounded-lg font-bold border transition-all text-center cursor-pointer ${
                      splitMethod === method.id
                        ? "bg-[#B65E3C] text-white border-[#B65E3C]"
                        : "bg-[#FAF7F0] text-[#7B4D36] border-[#E5D5BA] hover:bg-[#F4EBD9]"
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              {splitMethod !== "EQUAL" && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] font-mono text-[#7B4D36] block">
                    Enter individual values for active participants:
                  </span>
                  {activeParticipants.map((m) => (
                    <div key={m.user_id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-[#173B32] truncate">{m.full_name}</span>
                      <input
                        type="number"
                        step="any"
                        value={customShares[m.user_id] || ""}
                        onChange={(e) =>
                          setCustomShares((prev) => ({ ...prev, [m.user_id]: e.target.value }))
                        }
                        placeholder={splitMethod === "PERCENTAGE" ? "25%" : splitMethod === "SHARES" ? "1 share" : "₹ amount"}
                        className="w-24 px-2 py-1 rounded-lg bg-[#FAF7F0] border border-[#E5D5BA] font-mono text-right text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-[11px] font-bold text-[#7B4D36] uppercase tracking-wider mb-1 font-mono">
                Notes / Memo (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid via PhonePe, bill uploaded to group drive"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5D5BA] text-xs text-[#173B32]"
              />
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5D5BA]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#D8CBB2] text-[#7B4D36] text-xs font-bold hover:bg-[#F4EBD9] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{submitting ? "Saving..." : "Add to Budget · खर्च जोड़ें"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

