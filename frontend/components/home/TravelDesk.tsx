"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CheckSquare, Calculator, Plus, Trash2, Copy, Check,
  RotateCcw, Sparkles, ArrowRight, Clock, MapPin, X, ChevronRight,
  ShieldCheck, Info, FileText
} from "lucide-react";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";
import { VanvasAdaptiveModal } from "@/components/ui/VanvasAdaptiveModal";
import { getRecentDestinations, clearRecentDestinations } from "@/lib/recentDestinations";
import { CanonicalDestination } from "@/lib/canonicalDestinations";
import { TripSummary } from "@/types";

interface TravelDeskProps {
  activeTrip?: TripSummary | null;
  isCompact?: boolean;
}

interface ChecklistItem {
  id: string;
  category: "Essentials" | "Documents" | "Clothing" | "Gear";
  text: string;
  isChecked: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Essentials
  { id: "c1", category: "Essentials", text: "ID / Aadhaar / Passport & copies", isChecked: true },
  { id: "c2", category: "Essentials", text: "Cash & UPI payment device", isChecked: true },
  { id: "c3", category: "Essentials", text: "First Aid kit & personal medications", isChecked: false },
  { id: "c4", category: "Essentials", text: "Water bottle / Hydration bladder", isChecked: true },
  { id: "c5", category: "Essentials", text: "Powerbank & charging cables", isChecked: false },

  // Documents
  { id: "c6", category: "Documents", text: "Hotel / Homestay confirmations", isChecked: false },
  { id: "c7", category: "Documents", text: "Driver's license & vehicle RC/permit", isChecked: false },
  { id: "c8", category: "Documents", text: "Emergency contacts offline note", isChecked: false },

  // Clothing
  { id: "c9", category: "Clothing", text: "Quick-dry trekking t-shirts", isChecked: false },
  { id: "c10", category: "Clothing", text: "Thermal base layer / Warm fleece", isChecked: false },
  { id: "c11", category: "Clothing", text: "Windproof & rain jacket / Poncho", isChecked: false },
  { id: "c12", category: "Clothing", text: "Trekking shoes & moisture-wick socks", isChecked: false },

  // Gear
  { id: "c13", category: "Gear", text: "UV sunglasses & high-SPF sunscreen", isChecked: false },
  { id: "c14", category: "Gear", text: "Headlamp / High-lumen torch", isChecked: false },
  { id: "c15", category: "Gear", text: "Daypack (20–30L) with rain cover", isChecked: false },
  { id: "c16", category: "Gear", text: "Leave No Trace waste bag", isChecked: true },
];

interface ExpenseRow {
  id: string;
  name: string;
  amount: number;
}

const DEFAULT_EXPENSES: ExpenseRow[] = [
  { id: "e1", name: "Fuel & Transport", amount: 4500 },
  { id: "e2", name: "Stays & Camps", amount: 5000 },
  { id: "e3", name: "Food & Dhabas", amount: 2000 },
  { id: "e4", name: "Tolls & Permits", amount: 500 },
];

export const TravelDesk: React.FC<TravelDeskProps> = ({ activeTrip, isCompact = false }) => {
  // 1. RECENT DESTINATIONS STATE
  const [recentDestinations, setRecentDestinations] = useState<CanonicalDestination[]>([]);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);

  // 2. CHECKLIST STATE & STORAGE
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newChecklistCategory, setNewChecklistCategory] = useState<ChecklistItem["category"]>("Essentials");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 3. BUDGET SPLIT STATE & STORAGE
  const [travellersCount, setTravellersCount] = useState<number>(4);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(DEFAULT_EXPENSES);
  const [copiedToast, setCopiedToast] = useState(false);

  // Load state on client mount
  useEffect(() => {
    // Recents
    setRecentDestinations(getRecentDestinations());

    // Checklist from localStorage
    try {
      const savedChecklist = localStorage.getItem("vanvas_general_checklist");
      if (savedChecklist) {
        const parsed = JSON.parse(savedChecklist);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChecklist(parsed);
        }
      }
    } catch {}

    // Budget from localStorage
    try {
      const savedBudget = localStorage.getItem("vanvas_local_budget_split");
      if (savedBudget) {
        const parsed = JSON.parse(savedBudget);
        if (parsed.travellersCount && parsed.travellersCount > 0) {
          setTravellersCount(parsed.travellersCount);
        }
        if (Array.isArray(parsed.expenses) && parsed.expenses.length > 0) {
          setExpenses(parsed.expenses);
        }
      }
    } catch {}
  }, []);

  // Sync Checklist to localStorage
  const saveChecklist = useCallback((items: ChecklistItem[]) => {
    setChecklist(items);
    try {
      localStorage.setItem("vanvas_general_checklist", JSON.stringify(items));
    } catch {}
  }, []);

  // Sync Budget to localStorage
  const saveBudget = useCallback((count: number, exp: ExpenseRow[]) => {
    setTravellersCount(count);
    setExpenses(exp);
    try {
      localStorage.setItem(
        "vanvas_local_budget_split",
        JSON.stringify({ travellersCount: count, expenses: exp })
      );
    } catch {}
  }, []);

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

  const handleResetChecklist = () => {
    saveChecklist(DEFAULT_CHECKLIST);
    setShowResetConfirm(false);
  };

  // Budget Calculations
  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const perPersonAmount = useMemo(() => {
    const count = Math.max(1, travellersCount);
    return Math.ceil(totalAmount / count);
  }, [totalAmount, travellersCount]);

  const handleExpenseChange = (id: string, amount: number) => {
    const updated = expenses.map((e) =>
      e.id === id ? { ...e, amount: Math.max(0, isNaN(amount) ? 0 : amount) } : e
    );
    saveBudget(travellersCount, updated);
  };

  const handleAddExpenseRow = () => {
    const newRow: ExpenseRow = {
      id: `exp_${Date.now()}`,
      name: "Extra Expense",
      amount: 1000,
    };
    saveBudget(travellersCount, [...expenses, newRow]);
  };

  const handleDeleteExpenseRow = (id: string) => {
    if (expenses.length <= 1) return;
    const updated = expenses.filter((e) => e.id !== id);
    saveBudget(travellersCount, updated);
  };

  const handleCopyBudgetSummary = () => {
    const text = `VANVAS Expedition Budget Split:\nTotal: ₹${totalAmount.toLocaleString()} · ${travellersCount} Travellers\nPer Person: ₹${perPersonAmount.toLocaleString()}\n\nBreakdown:\n${expenses
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
              {packedCount}/{checklist.length}
            </span>
          </div>

          <div className="mt-1">
            <h4 className="font-serif font-bold text-xs text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight">
              Packing Checklist
            </h4>
            <p className="text-[10px] text-[#7B4D36] truncate mt-0.5">
              Essentials, gear &amp; layers
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
            <span className="px-1.5 py-0.5 rounded-full bg-[#B65E3C]/10 text-[9px] font-mono font-bold text-[#B65E3C]">
              ₹{perPersonAmount.toLocaleString()} ea
            </span>
          </div>

          <div className="mt-1">
            <h4 className="font-serif font-bold text-xs text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight">
              Split a Budget
            </h4>
            <p className="text-[10px] text-[#7B4D36] truncate mt-0.5">
              {travellersCount} travellers · equal split
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
              className="text-[10px] font-mono text-[#7B4D36] hover:text-red-700 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {recentDestinations.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 pb-1 snap-x snap-mandatory touch-manipulation">
            {recentDestinations.map((dest) => (
              <Link
                key={`recent-${dest.slug}`}
                href={`/explore/${dest.slug}`}
                data-testid={`recent-dest-${dest.slug}`}
                className={`shrink-0 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] active:scale-98 transition-all flex items-center gap-2.5 snap-start touch-manipulation group ${
                  isCompact ? "w-48 p-2" : "w-54 p-2.5"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#173B32] overflow-hidden shrink-0 relative border border-[#D8CBB2]/60">
                  <DestinationArtwork
                    slug={dest.slug}
                    aspectRatio="square"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-serif font-bold text-xs text-[#173B32] truncate group-hover:text-[#B65E3C] transition-colors">
                    {dest.name}
                  </div>
                  <div className="text-[9.5px] text-[#7B4D36] font-mono truncate">
                    {dest.state} · {dest.altitude_meters ? `${dest.altitude_meters}m` : "Sanctuary"}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#7B4D36] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          /* FIRST-USE EMPTY STATE (NO FABRICATED HISTORY) */
          <div className="p-3 rounded-2xl bg-[#FAF7F0]/80 border border-[#D8CBB2]/70 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#173B32]/10 text-[#173B32] flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#B49252]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-serif font-bold text-[#173B32]">
                  No recently viewed sanctuaries
                </div>
                <p className="text-[10px] text-[#7B4D36] truncate">
                  Explore valleys &amp; high passes to build your travel log.
                </p>
              </div>
            </div>
            <Link
              href="/explore"
              className="text-[10px] font-bold text-[#B65E3C] hover:text-[#9E4D2E] flex items-center gap-0.5 shrink-0"
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
          {/* Active Trip Banner Link if available */}
          {activeTrip && (
            <div className="p-2.5 rounded-xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-between gap-2 shadow-xs">
              <div className="min-w-0">
                <div className="text-[9px] font-mono text-[#B49252] font-bold uppercase tracking-wider">
                  ACTIVE TRIP DETECTED
                </div>
                <div className="text-xs font-serif font-bold truncate">
                  {activeTrip.title}
                </div>
              </div>
              <Link
                href={`/trips/${activeTrip.id}?tab=checklist`}
                className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] text-[#173B32] text-[10px] font-bold shrink-0 hover:bg-[#EFE5D2] transition-colors"
              >
                Open Trip Pack →
              </Link>
            </div>
          )}

          {/* Add custom item form */}
          <form onSubmit={handleAddItem} className="flex items-center gap-2">
            <select
              value={newChecklistCategory}
              onChange={(e) => setNewChecklistCategory(e.target.value as any)}
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

          {/* Categorized Checklist */}
          {(["Essentials", "Documents", "Clothing", "Gear"] as const).map((cat) => {
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
                        <span
                          className={`text-xs ${
                            item.isChecked ? "line-through opacity-65" : "font-medium"
                          }`}
                        >
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
          })}

          {/* Footer Reset & Local notice */}
          <div className="pt-2 border-t border-[#D8CBB2]/60 flex items-center justify-between text-[10px] text-[#7B4D36] font-mono">
            <span>Saved on this device</span>
            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <span>Reset to defaults?</span>
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  className="font-bold text-red-700 underline cursor-pointer"
                >
                  Yes, Reset
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
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="hover:text-red-700 underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset Checklist</span>
              </button>
            )}
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
        subtitle="Equal expense split calculation for your group"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* Big Result Card */}
          <div className="p-4 rounded-2xl bg-[#173B32] text-[#FAF7F0] space-y-2 border border-[#B49252]/40 shadow-sm">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#B49252] uppercase tracking-wider">
              <span>EQUAL PER PERSON SHARE</span>
              <span>{travellersCount} TRAVELLERS</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-serif font-black text-3xl sm:text-4xl text-[#FAF7F0]">
                  ₹{perPersonAmount.toLocaleString()}
                </span>
                <span className="text-xs text-[#EFE5D2]/80 ml-1 font-mono">/ person</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#EFE5D2]/70 font-mono block">Total Expenses</span>
                <span className="text-base font-mono font-bold text-[#B49252]">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EFE5D2]/20 flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#D8DED5]/80">
                Calculated with ceiling rounding
              </span>
              <button
                type="button"
                onClick={handleCopyBudgetSummary}
                className="px-3 py-1 rounded-lg bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
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

          {/* Travellers count stepper */}
          <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#D8CBB2] flex items-center justify-between">
            <div>
              <label className="font-serif font-bold text-xs text-[#173B32] block">
                Number of Travellers
              </label>
              <span className="text-[10px] text-[#7B4D36] font-mono">
                Splitting across group members
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => saveBudget(Math.max(1, travellersCount - 1), expenses)}
                className="w-8 h-8 rounded-xl bg-[#EFE5D2] hover:bg-[#D8CBB2] text-[#173B32] font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="w-8 text-center font-mono font-bold text-base text-[#173B32]">
                {travellersCount}
              </span>
              <button
                type="button"
                onClick={() => saveBudget(travellersCount + 1, expenses)}
                className="w-8 h-8 rounded-xl bg-[#173B32] text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Expense Category Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#7B4D36] uppercase tracking-wider border-b border-[#D8CBB2]/60 pb-1">
              <span>Expense Categories</span>
              <button
                type="button"
                onClick={handleAddExpenseRow}
                className="text-[10px] text-[#B65E3C] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-0.5">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-medium text-[#173B32] flex-1 truncate">
                    {exp.name}
                  </span>
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
                    {expenses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteExpenseRow(exp.id)}
                        className="text-[#7B4D36]/60 hover:text-red-700 p-1 transition-colors"
                        aria-label="Remove category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-[#7B4D36] font-mono text-center">
            Independent local calculator · Does not alter saved trip budgets
          </div>
        </div>
      </VanvasAdaptiveModal>
    </div>
  );
};
