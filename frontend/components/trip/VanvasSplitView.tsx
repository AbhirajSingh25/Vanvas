"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet, Plus, ArrowRight, CheckCircle2, DollarSign,
  Receipt, Users, Search, Filter, Trash2, Edit2, Sparkles,
  ArrowUpRight, ArrowDownLeft, ShieldCheck, RefreshCw, Layers,
  ChevronRight, Check, AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import {
  Trip, Expense, TripLedgerBalancesResponse, DebtSimplificationItem,
  UserBalanceItem, TripMemberItem
} from "@/types";

interface VanvasSplitViewProps {
  trip: Trip;
  members: TripMemberItem[];
  currentUserId?: string;
  onExpenseMutated: () => void;
  onOpenAddExpenseModal: () => void;
}

export const VanvasSplitView: React.FC<VanvasSplitViewProps> = ({
  trip,
  members,
  currentUserId,
  onExpenseMutated,
  onOpenAddExpenseModal
}) => {
  const [balancesData, setBalancesData] = useState<TripLedgerBalancesResponse | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [useSimplified, setUseSimplified] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  
  // Settle Up Modal State
  const [settleModalDebt, setSettleModalDebt] = useState<DebtSimplificationItem | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<string>("UPI");
  const [isSettling, setIsSettling] = useState(false);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);
  const [splitActionError, setSplitActionError] = useState<string | null>(null);

  const loadLedgerData = async () => {
    try {
      setLoading(true);
      const [bal, expList] = await Promise.all([
        api.getTripBalances(trip.id).catch(() => null),
        api.getExpenses(trip.id, {
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          search: searchQuery || undefined
        }).catch(() => [])
      ]);
      setBalancesData(bal);
      setExpenses(expList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, [trip.id, selectedCategory, searchQuery]);

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to remove this expense?")) return;
    setSplitActionError(null);
    try {
      await api.deleteExpense(trip.id, expenseId);
      loadLedgerData();
      onExpenseMutated();
    } catch (err: any) {
      setSplitActionError(err?.message || "Could not delete expense");
      setTimeout(() => setSplitActionError(null), 4000);
    }
  };

  const handleOpenSettleModal = (debt: DebtSimplificationItem) => {
    setSettleModalDebt(debt);
    setSettleAmount(String(debt.amount));
    setSettlePaymentMethod("UPI");
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalDebt) return;
    const parsedAmt = parseFloat(settleAmount) || settleModalDebt.amount;
    setSplitActionError(null);
    try {
      setIsSettling(true);
      await api.recordSettlementPayment(trip.id, {
        receiver_user_id: settleModalDebt.creditor_user_id,
        amount: parsedAmt,
        payment_method: settlePaymentMethod,
        notes: `Settled ₹${parsedAmt} via ${settlePaymentMethod}`
      });
      setSettleSuccessMsg(`Recorded payment of ₹${parsedAmt.toLocaleString()} to ${settleModalDebt.creditor_name}`);
      setSettleModalDebt(null);
      loadLedgerData();
      onExpenseMutated();
      setTimeout(() => setSettleSuccessMsg(null), 3500);
    } catch (err: any) {
      setSplitActionError(err?.message || "Could not record settlement");
      setTimeout(() => setSplitActionError(null), 4000);
    } finally {
      setIsSettling(false);
    }
  };

  const activeDebts = useSimplified
    ? (balancesData?.simplified_debts || [])
    : (balancesData?.direct_debts || []);

  const totalSpent = balancesData?.total_spent ?? trip.budget_spent ?? 0;
  const travellers = Math.max(1, trip.travellers_count || members.length || 1);
  const spentPerPerson = Math.round(totalSpent / travellers);

  const userYouOwe = balancesData?.user_you_owe ?? 0;
  const userYouAreOwed = balancesData?.user_you_are_owed ?? 0;

  const estimatedTotal = trip.budget_total || 30000;
  const remainingBudget = Math.max(0, estimatedTotal - totalSpent);
  const estimatedPerPerson = Math.round(estimatedTotal / travellers);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Toast Notification */}
      {settleSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-800 text-emerald-100 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn border border-emerald-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{settleSuccessMsg}</span>
        </div>
      )}

      {splitActionError && (
        <div className="p-3 rounded-2xl bg-red-800 text-red-100 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn border border-red-600">
          <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
          <span>{splitActionError}</span>
        </div>
      )}

      {/* TRIP WALLET DEFAULT CARD (Part 11) */}
      <div className="p-6 rounded-3xl bg-[#173B32] text-[#EFE5D2] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
              <Wallet className="w-3.5 h-3.5" />
              <span>TRIP WALLET</span>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#FAF4E8] mt-0.5">
              ₹{Math.round(totalSpent).toLocaleString()} spent
            </div>
            <div className="text-xs font-mono text-[#D8DED5]/80">
              ₹{spentPerPerson.toLocaleString()} / person · {travellers} travellers
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAddExpenseModal}
            className="px-5 py-3 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4 text-[#B49252]" />
            <span>+ Add Expense</span>
          </button>
        </div>

        {/* You Owe & You're Owed Highlights */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between">
            <span className="text-[9.5px] text-[#D8DED5]/70 uppercase font-bold">YOU OWE</span>
            <span className={`text-lg font-bold ${userYouOwe > 0 ? "text-amber-300" : "text-emerald-300"}`}>
              ₹{Math.round(userYouOwe).toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex flex-col justify-between">
            <span className="text-[9.5px] text-[#D8DED5]/70 uppercase font-bold">YOU&apos;RE OWED</span>
            <span className={`text-lg font-bold ${userYouAreOwed > 0 ? "text-emerald-300" : "text-[#D8DED5]/80"}`}>
              ₹{Math.round(userYouAreOwed).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ESTIMATED VS ACTUAL COMPARISON (Part 18) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-[#173B32]">
          <span className="uppercase text-[10px] text-[#7B4D36]">BUDGET COMPARISON</span>
          <span className="text-[#B65E3C]">₹{Math.round(spentPerPerson).toLocaleString()} / PERSON</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white border border-[#E5D5BA]">
            <span className="text-[9px] uppercase text-[#7B4D36] block">ESTIMATED</span>
            <strong className="text-[#173B32] font-bold">₹{Math.round(estimatedTotal).toLocaleString()}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#E5D5BA]">
            <span className="text-[9px] uppercase text-[#7B4D36] block">ACTUAL</span>
            <strong className="text-[#B65E3C] font-bold">₹{Math.round(totalSpent).toLocaleString()}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#E5D5BA]">
            <span className="text-[9px] uppercase text-[#7B4D36] block">REMAINING</span>
            <strong className="text-emerald-700 font-bold">₹{Math.round(remainingBudget).toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* WHO OWES WHOM & BALANCES (Part 14) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-2.5">
          <h4 className="font-serif font-black text-base text-[#173B32]">
            WHO OWES WHOM
          </h4>
          <button
            type="button"
            onClick={() => setUseSimplified(!useSimplified)}
            className="text-[10px] font-mono text-[#7B4D36] hover:text-[#173B32] font-bold underline cursor-pointer"
          >
            {useSimplified ? "Simplified Balances ✓" : "Direct Pairwise"}
          </button>
        </div>

        {activeDebts.length === 0 ? (
          <div className="text-center py-4 text-xs font-mono text-[#7B4D36]">
            All debts settled! Everyone is even.
          </div>
        ) : (
          <div className="space-y-2">
            {activeDebts.map((debt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white border border-[#E5D5BA] flex items-center justify-between gap-3 text-xs"
              >
                <div className="font-mono text-[#173B32]">
                  <span className="font-bold">{debt.debtor_name}</span>
                  <span className="text-[#B65E3C] mx-1.5">→</span>
                  <span className="font-bold">{debt.creditor_name}</span>
                  <span className="ml-2 text-[#7B4D36] font-bold">₹{debt.amount.toLocaleString()}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenSettleModal(debt)}
                  className="px-3 py-1 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-[10px] font-mono font-bold uppercase cursor-pointer transition-colors shrink-0"
                >
                  Settle Up
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPACT ACTIVITY EXPENSE LIST (Part 11) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-2.5">
          <h4 className="font-serif font-black text-base text-[#173B32]">
            EXPENSE ACTIVITY
          </h4>
          <span className="text-[10px] font-mono text-[#7B4D36]">
            {expenses.length} logged
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-[#7B4D36] font-mono">No expenses logged yet.</p>
            <button
              type="button"
              onClick={onOpenAddExpenseModal}
              className="px-4 py-2 rounded-xl bg-[#B65E3C] text-[#EFE5D2] text-xs font-bold font-mono"
            >
              + Log First Expense
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] hover:border-[#173B32]/40 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#173B32] flex items-center gap-1.5">
                    <span>{exp.title}</span>
                    <span className="text-[9.5px] font-mono text-[#B65E3C] font-normal lowercase">({exp.category})</span>
                  </div>
                  <div className="text-[10.5px] font-mono text-[#7B4D36] mt-0.5">
                    {exp.payer_name || exp.user_name} paid · {exp.shares?.length || travellers} people
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="text-sm font-bold text-[#173B32]">
                    ₹{exp.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SETTLE UP MODAL (Part 15) */}
      {settleModalDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-vanvas-fade">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xl p-6 space-y-4 animate-vanvas-scale">
            <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
              <h3 className="font-serif font-black text-lg text-[#173B32]">
                Settle Balance
              </h3>
              <button
                type="button"
                onClick={() => setSettleModalDebt(null)}
                className="text-xs font-mono text-[#7B4D36] hover:text-[#173B32]"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="space-y-4">
              <div className="text-center py-2 space-y-1">
                <span className="text-3xl font-mono font-black text-[#173B32]">
                  ₹{settleAmount}
                </span>
                <p className="text-xs font-mono text-[#7B4D36]">
                  Paying {settleModalDebt.creditor_name}
                </p>
              </div>

              {/* Payment Mode Selector */}
              <div className="grid grid-cols-3 gap-2">
                {["UPI", "Cash", "Bank Transfer"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSettlePaymentMethod(mode)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold cursor-pointer border transition-colors ${
                      settlePaymentMethod === mode
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                        : "bg-white text-[#7B4D36] border-[#E5D5BA]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSettling}
                className="w-full py-3 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-colors"
              >
                {isSettling ? "Recording..." : "Mark as Settled"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
