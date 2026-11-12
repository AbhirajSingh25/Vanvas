"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Calculator,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  X,
  Users,
} from "lucide-react";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { VanvasAdaptiveModal } from "@/components/ui/VanvasAdaptiveModal";
import { Avatar } from "@/components/ui/Avatar";
import { getRecentDestinations, clearRecentDestinations } from "@/lib/recentDestinations";
import { CanonicalDestination } from "@/lib/canonicalDestinations";
import { TripSummary, TripMemberItem } from "@/types";
import { AddBudgetItemModal, AddBudgetItemPayload } from "@/components/finance/AddBudgetItemModal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  ChecklistItem,
  ExpenseRow,
  BudgetStorageV3,
  SUGGESTED_CHECKLIST_ESSENTIALS,
  createEmptyBudgetState,
  migrateLegacyGlobalDataOnce,
  loadAccountBudget,
  saveAccountBudget,
  loadAccountChecklist,
  saveAccountChecklist,
  hasLegacyUnassignedData,
  importLegacyUnassignedData,
  dismissLegacyUnassignedData,
} from "@/lib/accountStorage";

interface TravelDeskProps {
  activeTrip?: TripSummary | null;
  isCompact?: boolean;
}

export const TravelDesk: React.FC<TravelDeskProps> = ({ activeTrip, isCompact = false }) => {
  const { user } = useAuth();
  const activeUserId = user?.id ?? null;

  // 1. RECENT DESTINATIONS STATE
  const [recentDestinations, setRecentDestinations] = useState<CanonicalDestination[]>([]);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isAddBudgetItemOpen, setIsAddBudgetItemOpen] = useState(false);

  // 2. ACCOUNT-SCOPED CHECKLIST STATE
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newChecklistCategory, setNewChecklistCategory] =
    useState<ChecklistItem["category"]>("Essentials");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 3. ACCOUNT-SCOPED BUDGET SPLIT STATE (explicitly unset participant count by default)
  const [budgetState, setBudgetState] = useState<BudgetStorageV3>(createEmptyBudgetState);
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);
  const [legacyAvailable, setLegacyAvailable] = useState<{
    hasBudget: boolean;
    hasChecklist: boolean;
  }>({ hasBudget: false, hasChecklist: false });
  const [copiedToast, setCopiedToast] = useState(false);

  // 4. REAL TRIP MEMBERS STATE (for Trip Budget mode)
  const [tripMembers, setTripMembers] = useState<TripMemberItem[]>([]);
  const [tripMembersLoading, setTripMembersLoading] = useState(false);
  const [selectedTripMemberIds, setSelectedTripMemberIds] = useState<string[]>([]);

  // Load account-scoped state whenever authenticated account changes
  useEffect(() => {
    setRecentDestinations(getRecentDestinations());
    migrateLegacyGlobalDataOnce();

    setChecklist(loadAccountChecklist(activeUserId));
    const loadedBudget = loadAccountBudget(activeUserId);
    setBudgetState(loadedBudget);
    setLegacyAvailable(hasLegacyUnassignedData());
    setShowParticipantPicker(false);
  }, [activeUserId]);

  // Fetch genuine trip members when Trip Budget mode is selected
  useEffect(() => {
    if (!isBudgetOpen || budgetState.mode !== "trip" || !activeTrip?.id) return;
    let cancelled = false;
    setTripMembersLoading(true);
    api
      .getGroupDetails(activeTrip.id)
      .then((res: any) => {
        if (cancelled) return;
        const membersList: TripMemberItem[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.members)
            ? res.members
            : [];
        setTripMembers(membersList);
        setSelectedTripMemberIds(membersList.map((m) => m.user_id));
      })
      .catch(() => {
        if (!cancelled) setTripMembers([]);
      })
      .finally(() => {
        if (!cancelled) setTripMembersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isBudgetOpen, budgetState.mode, activeTrip?.id]);

  // Sync Checklist to active account namespace
  const saveChecklist = useCallback(
    (items: ChecklistItem[]) => {
      setChecklist(items);
      saveAccountChecklist(activeUserId, items);
    },
    [activeUserId]
  );

  // Sync Budget to active account namespace
  const persistBudget = useCallback(
    (next: BudgetStorageV3) => {
      setBudgetState(next);
      saveAccountBudget(activeUserId, next);
    },
    [activeUserId]
  );

  // Checklist Actions
  const handleToggleItem = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    );
    saveChecklist(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom_${Date.now()}`,
      category: newChecklistCategory,
      text: newChecklistText.trim(),
      isChecked: false,
    };
    saveChecklist([...checklist, newItem]);
    setNewChecklistText("");
  };

  const handleDeleteItem = (id: string) => {
    saveChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleAddSuggestedEssentials = () => {
    const existingTexts = new Set(checklist.map((item) => item.text.toLowerCase()));
    const additions = SUGGESTED_CHECKLIST_ESSENTIALS.filter(
      (item) => !existingTexts.has(item.text.toLowerCase())
    ).map((item) => ({ ...item, id: `${item.id}_${Date.now()}`, isChecked: false }));
    saveChecklist([...checklist, ...additions]);
  };

  const handleClearChecklist = () => {
    saveChecklist([]);
    setShowResetConfirm(false);
  };

  // Legacy Unassigned Import / Dismiss (explicit user confirmation only)
  const handleImportLegacyData = () => {
    const imported = importLegacyUnassignedData(activeUserId);
    if (imported.budget) setBudgetState(imported.budget);
    if (imported.checklist) setChecklist(imported.checklist);
    setLegacyAvailable({ hasBudget: false, hasChecklist: false });
  };

  const handleDismissLegacyData = () => {
    dismissLegacyUnassignedData();
    setLegacyAvailable({ hasBudget: false, hasChecklist: false });
  };

  // Budget Calculations
  const { expenses, travellersCount, participantsConfigured, allocationType } = budgetState;
  const hasParticipants = participantsConfigured && travellersCount !== null && travellersCount >= 1;

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const perPersonAmount = useMemo(() => {
    if (!hasParticipants || travellersCount === null || expenses.length === 0 || totalAmount <= 0) {
      return null;
    }
    return Math.ceil(totalAmount / travellersCount);
  }, [hasParticipants, travellersCount, expenses.length, totalAmount]);

  const handleSetTravellersCount = (count: number) => {
    const safeCount = Math.max(1, count);
    persistBudget({
      ...budgetState,
      travellersCount: safeCount,
      participantsConfigured: true,
      participantsAmbiguous: false,
    });
  };

  const handleClearParticipants = () => {
    persistBudget({
      ...budgetState,
      travellersCount: null,
      participantsConfigured: false,
      participantsAmbiguous: false,
    });
  };

  const handleExpenseChange = (id: string, amount: number) => {
    const updated = expenses.map((e) =>
      e.id === id ? { ...e, amount: Math.max(0, isNaN(amount) ? 0 : amount) } : e
    );
    persistBudget({ ...budgetState, expenses: updated });
  };

  const handleAddBudgetItemSubmit = (payload: AddBudgetItemPayload) => {
    const rowAllocation: "equal" | "custom" =
      payload.split_method !== "EQUAL" ? "custom" : "equal";
    const newRow: ExpenseRow = {
      id: `exp_${Date.now()}`,
      name: payload.title,
      amount: Math.round(payload.amount),
      allocationType: rowAllocation,
    };
    const nextExpenses = [...expenses, newRow];
    const nextAllocation: "equal" | "custom" =
      budgetState.allocationType === "custom" || rowAllocation === "custom" ? "custom" : "equal";
    persistBudget({
      ...budgetState,
      allocationType: nextAllocation,
      expenses: nextExpenses,
    });
  };

  const handleDeleteExpenseRow = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    const nextAllocation: "equal" | "custom" = updated.some((e) => e.allocationType === "custom")
      ? "custom"
      : "equal";
    persistBudget({
      ...budgetState,
      allocationType: nextAllocation,
      expenses: updated,
    });
  };

  const handleResetBudget = () => {
    persistBudget(createEmptyBudgetState());
    setShowParticipantPicker(false);
  };

  const handleCopyBudgetSummary = () => {
    if (!hasParticipants || perPersonAmount === null || expenses.length === 0) return;
    const splitDesc = allocationType === "custom" ? "Custom Split" : "Equal Split";
    const text = `VANVAS Expedition Budget (${splitDesc}):\nTotal: ₹${totalAmount.toLocaleString()} · ${travellersCount} ${
      travellersCount === 1 ? "Traveller" : "Travellers"
    }\nEstimated Share: ₹${perPersonAmount.toLocaleString()} / person\n\nBreakdown:\n${expenses
      .map((e) => `• ${e.name}: ₹${e.amount.toLocaleString()}`)
      .join("\n")}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      });
    }
  };

  const handleClearHistory = () => {
    clearRecentDestinations();
    setRecentDestinations([]);
  };

  const packedCount = checklist.filter((c) => c.isChecked).length;

  // Budget Summary Card Badge & Subtitle
  const budgetCardBadge = useMemo(() => {
    if (expenses.length === 0) return "Empty";
    if (!hasParticipants || perPersonAmount === null) {
      return `₹${totalAmount.toLocaleString()} total`;
    }
    return `₹${perPersonAmount.toLocaleString()} ea`;
  }, [expenses.length, hasParticipants, perPersonAmount, totalAmount]);

  const budgetCardSubtitle = useMemo(() => {
    if (expenses.length === 0) {
      return hasParticipants && travellersCount
        ? `${travellersCount} ${travellersCount === 1 ? "traveller" : "travellers"} · add expenses`
        : "Start an empty budget split";
    }
    if (!hasParticipants || travellersCount === null) {
      return "Set participants to calculate your share.";
    }
    const label = allocationType === "custom" ? "custom split" : "equal split";
    return `${travellersCount} ${travellersCount === 1 ? "traveller" : "travellers"} · ${label}`;
  }, [expenses.length, hasParticipants, travellersCount, allocationType]);

  return (
    <div data-testid="travel-desk-field-kit" className="space-y-3.5 pt-2 border-t border-[#D8CBB2]/70">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B65E3C]" />
            <h3 className={`font-serif font-black text-[#173B32] ${isCompact ? "text-xs" : "text-sm"}`}>
              Travel Desk · फील्ड किट
            </h3>
          </div>
          <p className={`text-[#7B4D36] font-mono ${isCompact ? "text-[9.5px]" : "text-[10px]"}`}>
            Essential on-the-go tools &amp; recent journeys
          </p>
        </div>
      </div>

      {/* TWO USEFUL ON-THE-GO TOOLS */}
      <div className={`grid grid-cols-2 ${isCompact ? "gap-2" : "gap-2.5"}`}>
        {/* TOOL 1: PACKING CHECKLIST */}
        <button
          type="button"
          onClick={() => setIsChecklistOpen(true)}
          data-testid="tool-packing-checklist"
          className={`rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] active:scale-98 transition-all p-2.5 sm:p-3 text-left flex flex-col justify-between touch-manipulation group shadow-2xs cursor-pointer ${
            isCompact ? "min-h-[76px]" : "min-h-[88px]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-xl bg-[#173B32]/10 text-[#173B32] flex items-center justify-center shrink-0">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <span className="px-1.5 py-0.5 rounded-full bg-[#173B32]/10 text-[9px] font-mono font-bold text-[#173B32]">
              {checklist.length === 0 ? "0 items" : `${packedCount}/${checklist.length}`}
            </span>
          </div>

          <div className="mt-1">
            <h4 className="font-serif font-bold text-xs text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight">
              Packing Checklist
            </h4>
            <p className="text-[10px] text-[#7B4D36] truncate mt-0.5">
              {checklist.length === 0 ? "Tap to build your pack list" : "Essentials, gear & layers"}
            </p>
          </div>
        </button>

        {/* TOOL 2: SPLIT A BUDGET */}
        <button
          type="button"
          onClick={() => setIsBudgetOpen(true)}
          data-testid="tool-split-budget"
          className={`rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] active:scale-98 transition-all p-2.5 sm:p-3 text-left flex flex-col justify-between touch-manipulation group shadow-2xs cursor-pointer ${
            isCompact ? "min-h-[76px]" : "min-h-[88px]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-xl bg-[#B65E3C]/10 text-[#B65E3C] flex items-center justify-center shrink-0">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <span
              data-testid="split-budget-card-badge"
              className="px-1.5 py-0.5 rounded-full bg-[#B65E3C]/10 text-[9px] font-mono font-bold text-[#B65E3C]"
            >
              {budgetCardBadge}
            </span>
          </div>

          <div className="mt-1">
            <h4 className="font-serif font-bold text-xs text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight">
              Split a Budget
            </h4>
            <p
              data-testid="split-budget-card-subtitle"
              className="text-[10px] text-[#7B4D36] truncate mt-0.5"
            >
              {budgetCardSubtitle}
            </p>
          </div>
        </button>
      </div>

      {/* RECENTLY EXPLORED DESTINATIONS */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#B49252]" />
            <h4 className={`font-serif font-bold text-[#173B32] ${isCompact ? "text-[11px]" : "text-xs"}`}>
              Recently Explored Sanctuaries
            </h4>
          </div>
          {recentDestinations.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-[10px] font-mono text-[#7B4D36] hover:text-[#B65E3C] underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {recentDestinations.length > 0 ? (
          <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar -mx-1 px-1">
            {recentDestinations.map((dest) => (
              <Link
                key={dest.slug}
                href={`/explore/${dest.slug}`}
                className="w-32 shrink-0 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] overflow-hidden shadow-2xs hover:border-[#173B32] transition-all flex flex-col group"
              >
                <div className="h-14 w-full relative overflow-hidden bg-[#173B32]">
                  <DestinationArtwork
                    slug={dest.slug}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
                <div className="p-2">
                  <div className="font-serif font-bold text-[11px] text-[#173B32] truncate leading-tight">
                    {dest.name}
                  </div>
                  <div className="text-[9px] text-[#7B4D36] truncate mt-0.5">{dest.state}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#FAF7F0]/70 border border-dashed border-[#D8CBB2] p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#EFE5D2] flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#B49252]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-serif font-bold text-[#173B32] truncate">
                  No recently viewed sanctuaries
                </p>
                <p className="text-[9.5px] text-[#7B4D36] truncate">
                  Explore valleys &amp; high passes to build your travel log
                </p>
              </div>
            </div>
            <Link
              href="/explore"
              className="text-[10px] font-bold text-[#B65E3C] hover:underline shrink-0 flex items-center gap-0.5"
            >
              <span>Explore</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. PACKING CHECKLIST MODAL (ADAPTIVE BOTTOM SHEET)       */}
      {/* ======================================================== */}
      <VanvasAdaptiveModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        title="Packing Checklist • यात्रा चेकलिस्ट"
        subtitle={`${packedCount} of ${checklist.length} items packed`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {legacyAvailable.hasChecklist && (
            <div className="p-3 rounded-xl bg-[#B49252]/15 border border-[#B49252]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#173B32]">
              <span>Previous unassociated checklist items found on this device.</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleImportLegacyData}
                  className="px-2.5 py-1 rounded-lg bg-[#173B32] text-[#FAF7F0] text-[11px] font-bold cursor-pointer"
                >
                  Import
                </button>
                <button
                  type="button"
                  onClick={handleDismissLegacyData}
                  className="text-[#7B4D36] text-[11px] underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {activeTrip && (
            <div className="p-2.5 rounded-xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-between gap-2 shadow-xs">
              <div className="min-w-0">
                <div className="text-[9px] font-mono text-[#B49252] font-bold uppercase tracking-wider">
                  ACTIVE TRIP DETECTED
                </div>
                <div className="text-xs font-serif font-bold truncate">{activeTrip.title}</div>
              </div>
              <Link
                href={`/trips/${activeTrip.id}?tab=checklist`}
                className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] text-[#173B32] text-[10px] font-bold shrink-0 hover:bg-[#EFE5D2] transition-colors"
              >
                Open Trip Pack →
              </Link>
            </div>
          )}

          <form onSubmit={handleAddItem} className="flex items-center gap-2">
            <select
              value={newChecklistCategory}
              onChange={(e) => setNewChecklistCategory(e.target.value as ChecklistItem["category"])}
              className="py-2 px-2.5 rounded-xl border border-[#D8CBB2] bg-[#FAF7F0] text-xs font-mono text-[#173B32] focus:outline-none focus:ring-1 focus:ring-[#173B32]"
            >
              <option value="Essentials">Essentials</option>
              <option value="Documents">Docs</option>
              <option value="Clothing">Clothing</option>
              <option value="Gear">Gear</option>
            </select>
            <input
              type="text"
              placeholder="Add gear or personal item..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              className="flex-1 py-2 px-3 rounded-xl border border-[#D8CBB2] bg-[#FAF7F0] text-xs text-[#20211D] placeholder:text-[#7B4D36]/60 focus:outline-none focus:ring-1 focus:ring-[#173B32]"
            />
            <button
              type="submit"
              disabled={!newChecklistText.trim()}
              className="p-2 rounded-xl bg-[#B65E3C] text-white hover:bg-[#9E4D2E] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
              aria-label="Add Item"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {checklist.length === 0 ? (
            <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-dashed border-[#D8CBB2] text-center space-y-3">
              <p className="text-xs font-medium text-[#173B32]">
                Your packing checklist is empty. Add your own items above or load suggested essentials.
              </p>
              <button
                type="button"
                onClick={handleAddSuggestedEssentials}
                className="px-3.5 py-2 rounded-xl bg-[#173B32] text-[#FAF7F0] text-xs font-bold hover:bg-[#1E4A3F] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Add Suggested Packing Essentials</span>
              </button>
            </div>
          ) : (
            (["Essentials", "Documents", "Clothing", "Gear"] as const).map((cat) => {
              const items = checklist.filter((item) => item.category === cat);
              if (items.length === 0) return null;

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#7B4D36] uppercase tracking-wider border-b border-[#D8CBB2]/60 pb-1">
                    <span>{cat}</span>
                    <span className="text-[10px] text-[#536B52]">
                      {items.filter((i) => i.isChecked).length}/{items.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left touch-manipulation ${
                          item.isChecked
                            ? "bg-[#173B32]/6 border-[#173B32]/30 text-[#173B32]"
                            : "bg-[#FAF7F0] border-[#E5D5BA] hover:bg-white text-[#20211D]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                              item.isChecked
                                ? "bg-[#173B32] border-[#173B32] text-white"
                                : "border-[#D8CBB2] bg-white"
                            }`}
                          >
                            {item.isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-xs ${item.isChecked ? "line-through opacity-65" : "font-medium"}`}>
                            {item.text}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                          className="text-[#7B4D36]/60 hover:text-red-700 p-1 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <div className="pt-2 border-t border-[#D8CBB2]/60 flex items-center justify-between gap-2 text-[10px] text-[#7B4D36] font-mono">
            <span>{activeUserId ? "Saved to this account on this device" : "Saved in guest session"}</span>
            {checklist.length > 0 &&
              (showResetConfirm ? (
                <div className="flex items-center gap-2">
                  <span>Clear all items?</span>
                  <button
                    type="button"
                    onClick={handleClearChecklist}
                    className="font-bold text-red-700 underline cursor-pointer"
                  >
                    Yes, Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="text-[#173B32] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddSuggestedEssentials}
                    className="hover:text-[#173B32] underline cursor-pointer"
                  >
                    + Suggested
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="hover:text-red-700 underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Clear List</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      </VanvasAdaptiveModal>

      {/* ======================================================== */}
      {/* 2. SPLIT A BUDGET MODAL (ADAPTIVE BOTTOM SHEET)          */}
      {/* ======================================================== */}
      <VanvasAdaptiveModal
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        title="Split a Budget • खर्च विभाजन"
        subtitle={
          budgetState.mode === "trip" && activeTrip
            ? "Connected to your active trip members"
            : "Add your expenses and choose who will share them."
        }
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {legacyAvailable.hasBudget && (
            <div
              data-testid="legacy-import-banner"
              className="p-3 rounded-xl bg-[#B49252]/15 border border-[#B49252]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#173B32]"
            >
              <span>Previous unassociated budget entries found on this device.</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleImportLegacyData}
                  className="px-2.5 py-1 rounded-lg bg-[#173B32] text-[#FAF7F0] text-[11px] font-bold cursor-pointer"
                >
                  Import into {activeUserId ? "Account" : "Guest"}
                </button>
                <button
                  type="button"
                  onClick={handleDismissLegacyData}
                  className="text-[#7B4D36] text-[11px] underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Explicit Mode Switcher when an active trip is loaded */}
          {activeTrip && (
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#EFE5D2]/70 border border-[#D8CBB2]">
              <button
                type="button"
                onClick={() => persistBudget({ ...budgetState, mode: "scratch" })}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  budgetState.mode === "scratch"
                    ? "bg-[#173B32] text-[#FAF7F0] shadow-2xs"
                    : "text-[#7B4D36] hover:text-[#173B32]"
                }`}
              >
                Scratch Budget
              </button>
              <button
                type="button"
                onClick={() => persistBudget({ ...budgetState, mode: "trip" })}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  budgetState.mode === "trip"
                    ? "bg-[#173B32] text-[#FAF7F0] shadow-2xs"
                    : "text-[#7B4D36] hover:text-[#173B32]"
                }`}
              >
                Trip Budget
              </button>
            </div>
          )}

          {budgetState.mode === "trip" && activeTrip ? (
            <div className="p-4 rounded-2xl bg-[#173B32] text-[#FAF7F0] space-y-3 border border-[#B49252]/40">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#B49252] uppercase tracking-wider">
                <span>ACTIVE TRIP BUDGET</span>
                <span>{activeTrip.status || "planned"}</span>
              </div>
              <div className="font-serif font-bold text-lg text-[#FAF7F0]">{activeTrip.title}</div>

              {tripMembersLoading ? (
                <p className="text-xs text-[#EFE5D2]/75">Loading trip members…</p>
              ) : tripMembers.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#E5D5BA]/80 block">
                    Trip Members ({selectedTripMemberIds.length}/{tripMembers.length} selected)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tripMembers.map((m) => {
                      const active = selectedTripMemberIds.includes(m.user_id);
                      return (
                        <button
                          key={m.user_id}
                          type="button"
                          onClick={() =>
                            setSelectedTripMemberIds((prev) =>
                              prev.includes(m.user_id)
                                ? prev.filter((id) => id !== m.user_id)
                                : [...prev, m.user_id]
                            )
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            active
                              ? "bg-[#B65E3C] border-[#D9825E] text-white"
                              : "bg-[#112B24] border-[#FAF7F0]/20 text-[#EFE5D2]/75"
                          }`}
                        >
                          <Avatar
                            user={{ full_name: m.full_name, avatar_url: m.avatar_url }}
                            size="xs"
                          />
                          <span>{m.full_name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#EFE5D2]/80">
                  Open your authenticated trip ledger to view and split real backend trip expenses with your crew.
                </p>
              )}

              <Link
                href={`/trips/${activeTrip.id}?tab=budget`}
                onClick={() => setIsBudgetOpen(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold transition-colors"
              >
                <span>Open Trip Budget Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
              {budgetState.participantsAmbiguous && !hasParticipants && (
                <div className="p-3 rounded-xl bg-[#B49252]/15 border border-[#B49252]/40 flex items-center justify-between gap-2 text-xs text-[#173B32]">
                  <span>Please confirm how many travellers are sharing these expenses.</span>
                  <button
                    type="button"
                    onClick={() => setShowParticipantPicker(true)}
                    className="font-bold text-[#B65E3C] underline shrink-0 cursor-pointer"
                  >
                    Set Travellers
                  </button>
                </div>
              )}

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-[#173B32] text-[#FAF7F0] space-y-2 border border-[#B49252]/40 shadow-sm">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#B49252] uppercase tracking-wider">
                  <span>
                    {allocationType === "custom" ? "ESTIMATED SHARE (CUSTOM)" : "EQUAL PER PERSON SHARE"}
                  </span>
                  <span>
                    {hasParticipants && travellersCount !== null
                      ? `${travellersCount} ${travellersCount === 1 ? "TRAVELLER" : "TRAVELLERS"}`
                      : "TRAVELLERS NOT CONFIGURED"}
                  </span>
                </div>

                {expenses.length === 0 && !hasParticipants ? (
                  <div className="py-1 space-y-1">
                    <div className="font-serif font-bold text-xl text-[#FAF7F0]">Start Your Budget</div>
                    <p className="text-xs text-[#EFE5D2]/80">
                      Add your expenses and choose who will share them.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span
                        data-testid="budget-per-person-display"
                        className="font-serif font-black text-3xl sm:text-4xl text-[#FAF7F0]"
                      >
                        {!hasParticipants || perPersonAmount === null
                          ? "Pending"
                          : `₹${perPersonAmount.toLocaleString()}`}
                      </span>
                      {hasParticipants && perPersonAmount !== null && (
                        <span className="text-xs text-[#EFE5D2]/80 ml-1 font-mono">/ person</span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#EFE5D2]/70 font-mono block">Total Expenses</span>
                      <span className="text-base font-mono font-bold text-[#B49252]">
                        ₹{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#EFE5D2]/20 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-[#D8DED5]/80">
                    {!hasParticipants
                      ? "Participant allocation pending"
                      : allocationType === "custom"
                        ? "Custom allocation rules present"
                        : "Calculated with ceiling rounding"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyBudgetSummary}
                    disabled={!hasParticipants || expenses.length === 0 || perPersonAmount === null}
                    className="px-3 py-1 rounded-lg bg-[#B65E3C] hover:bg-[#9E4D2E] disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedToast ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Explicit Participant Configuration */}
              <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="font-serif font-bold text-xs text-[#173B32] block">
                      {hasParticipants ? "Number of Travellers" : "Travellers not configured"}
                    </label>
                    <span className="text-[10px] text-[#7B4D36] font-mono">
                      {hasParticipants
                        ? "Explicitly configured for this scratch budget"
                        : "Set participants to calculate your share."}
                    </span>
                  </div>

                  {!hasParticipants ? (
                    <button
                      type="button"
                      data-testid="set-travellers-btn"
                      onClick={() => setShowParticipantPicker((prev) => !prev)}
                      className="px-3 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#1E4A3F] text-[#FAF7F0] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Users className="w-3.5 h-3.5 text-[#B49252]" />
                      <span>Set Number of Travellers</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          travellersCount && travellersCount > 1
                            ? handleSetTravellersCount(travellersCount - 1)
                            : handleClearParticipants()
                        }
                        className="w-8 h-8 rounded-xl bg-[#EFE5D2] hover:bg-[#D8CBB2] text-[#173B32] font-bold flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Decrease travellers"
                      >
                        -
                      </button>
                      <span
                        data-testid="travellers-count-value"
                        className="w-8 text-center font-mono font-bold text-base text-[#173B32]"
                      >
                        {travellersCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetTravellersCount((travellersCount || 1) + 1)}
                        className="w-8 h-8 rounded-xl bg-[#173B32] text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Increase travellers"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {!hasParticipants && showParticipantPicker && (
                  <div className="pt-2 border-t border-[#D8CBB2]/60 flex flex-wrap items-center gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        type="button"
                        data-testid={`choose-travellers-${n}`}
                        onClick={() => {
                          handleSetTravellersCount(n);
                          setShowParticipantPicker(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#EFE5D2] hover:bg-[#173B32] hover:text-[#FAF7F0] text-[#173B32] text-xs font-mono font-bold transition-colors cursor-pointer"
                      >
                        {n} {n === 1 ? "Traveller" : "Travellers"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Expense Category Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#7B4D36] uppercase tracking-wider border-b border-[#D8CBB2]/60 pb-1">
                  <span>Expense Categories</span>
                  <div className="flex items-center gap-3">
                    {expenses.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetBudget}
                        className="text-[10px] text-[#7B4D36] hover:text-red-700 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid="budget-add-row-btn"
                      onClick={() => setIsAddBudgetItemOpen(true)}
                      className="text-[10px] text-[#B65E3C] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Row</span>
                    </button>
                  </div>
                </div>

                {expenses.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#FAF7F0] border border-dashed border-[#D8CBB2] text-center space-y-2">
                    <p className="text-xs text-[#7B4D36]">
                      No budget items yet. Add an expense row to start planning.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddBudgetItemOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Expense</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-0.5">
                    {expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-[#173B32] block truncate">
                            {exp.name}
                          </span>
                          {!hasParticipants && (
                            <span className="text-[10px] font-mono text-[#7B4D36]">
                              Participant allocation pending
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-mono font-bold text-[#7B4D36]">₹</span>
                          <input
                            type="number"
                            min={0}
                            step={100}
                            value={exp.amount}
                            onChange={(e) => handleExpenseChange(exp.id, parseInt(e.target.value, 10))}
                            className="w-24 py-1 px-2 rounded-lg border border-[#D8CBB2] bg-white text-xs font-mono font-bold text-right text-[#173B32] focus:outline-none focus:ring-1 focus:ring-[#173B32]"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteExpenseRow(exp.id)}
                            className="text-[#7B4D36]/60 hover:text-red-700 p-1 transition-colors"
                            aria-label="Remove category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-[#7B4D36] font-mono text-center">
                {activeUserId
                  ? "Scoped to your account on this device · Does not alter saved trip budgets"
                  : "Guest scratchpad · Does not alter saved trip budgets"}
              </div>
            </>
          )}
        </div>
      </VanvasAdaptiveModal>

      <AddBudgetItemModal
        isOpen={isAddBudgetItemOpen}
        onClose={() => setIsAddBudgetItemOpen(false)}
        onSubmit={handleAddBudgetItemSubmit}
        members={[]}
        isForecastOnly={true}
      />
    </div>
  );
};
