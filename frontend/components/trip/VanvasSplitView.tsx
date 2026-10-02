"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet, Plus, ArrowRight, CheckCircle2, DollarSign,
  Receipt, Users, Search, Filter, Trash2, Edit2, Sparkles,
  ArrowUpRight, ArrowDownLeft, ShieldCheck, RefreshCw, Layers
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [settleModalDebt, setSettleModalDebt] = useState<DebtSimplificationItem | null>(null);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<string>("UPI");
  const [settleNote, setSettleNote] = useState<string>("");
  const [isSettling, setIsSettling] = useState(false);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);

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
    try {
      await api.deleteExpense(trip.id, expenseId);
      loadLedgerData();
      onExpenseMutated();
    } catch (err: any) {
      alert(err?.message || "Could not delete expense");
    }
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalDebt) return;
    try {
      setIsSettling(true);
      await api.recordSettlementPayment(trip.id, {
        receiver_user_id: settleModalDebt.creditor_user_id,
        amount: settleModalDebt.amount,
        payment_method: settlePaymentMethod,
        notes: settleNote || `Settled ₹${settleModalDebt.amount} via ${settlePaymentMethod}`
      });
      setSettleSuccessMsg(`Recorded payment of ₹${settleModalDebt.amount.toLocaleString()} to ${settleModalDebt.creditor_name}`);
      setSettleModalDebt(null);
      setSettleNote("");
      loadLedgerData();
      onExpenseMutated();
      setTimeout(() => setSettleSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Could not record settlement");
    } finally {
      setIsSettling(false);
    }
  };

  const activeDebts = useSimplified
    ? (balancesData?.simplified_debts || [])
    : (balancesData?.direct_debts || []);

  const totalSpent = balancesData?.total_spent ?? trip.budget_spent ?? 0;
  const userNet = balancesData?.user_net_balance ?? 0;
  const userYouOwe = balancesData?.user_you_owe ?? 0;
  const userYouAreOwed = balancesData?.user_you_are_owed ?? 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {settleSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-800 text-emerald-100 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn border border-emerald-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{settleSuccessMsg}</span>
        </div>
      )}

      {/* Top Banner: Title & Primary CTA */}
      <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
            <Wallet className="w-4 h-4" />
            <span>VANVAS SPLIT • GROUP EXPENSE LEDGER</span>
          </div>
          <h3 className="text-2xl font-serif font-black text-[#173B32] mt-0.5">
            Trip Wallet &amp; Group Balances
          </h3>
          <p className="text-xs text-[#7B4D36] font-light mt-0.5">
            Transparent group sharing. Equal, exact, percentage, or itemized bill splits.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddExpenseModal}
          className="px-5 py-3 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-[#B49252]" />
          <span>Log Trip Expense</span>
        </button>
      </div>

      {/* 3 Metric Balance Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Trip Spending */}
        <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] flex flex-col justify-between">
          <span className="text-[10.5px] font-mono font-bold uppercase text-[#7B4D36]">Total Trip Spent</span>
          <div className="text-3xl font-serif font-black text-[#173B32] my-1">
            ₹{Math.round(totalSpent).toLocaleString()}
          </div>
          <span className="text-[11px] text-[#7B4D36] font-mono">
            ₹{Math.round(balancesData?.per_person_average ?? (totalSpent / Math.max(1, members.length || 1))).toLocaleString()} / person avg ({Math.max(1, members.length || 1)} travellers)
          </span>
        </div>

        {/* Your Net Position */}
        <div className={`p-5 rounded-3xl border-2 flex flex-col justify-between ${
          userNet > 0
            ? "bg-emerald-50/80 border-emerald-300"
            : userNet < 0
            ? "bg-amber-50/80 border-amber-300"
            : "bg-[#FAF7F0] border-[#E5D5BA]"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-bold uppercase text-[#7B4D36]">Your Net Position</span>
            {userNet > 0 ? (
              <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[9px] font-mono font-bold">GETTING BACK</span>
            ) : userNet < 0 ? (
              <span className="px-2 py-0.5 rounded bg-amber-700 text-white text-[9px] font-mono font-bold">OWED TO GROUP</span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] text-[9px] font-mono font-bold">SETTLED</span>
            )}
          </div>
          <div className={`text-3xl font-serif font-black my-1 ${
            userNet > 0 ? "text-emerald-800" : userNet < 0 ? "text-amber-800" : "text-[#173B32]"
          }`}>
            {userNet > 0 ? `+₹${Math.round(userNet).toLocaleString()}` : userNet < 0 ? `-₹${Math.round(Math.abs(userNet)).toLocaleString()}` : "₹0"}
          </div>
          <span className="text-[11px] text-[#7B4D36] font-mono">
            {userNet > 0 ? "You are owed money by fellow travellers" : userNet < 0 ? "You have pending settlements" : "All balances settled"}
          </span>
        </div>

        {/* Detailed Owe / Owed Breakdown */}
        <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] flex flex-col justify-between space-y-2">
          <span className="text-[10.5px] font-mono font-bold uppercase text-[#7B4D36]">Balance Breakdown</span>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" /> You are owed:
              </span>
              <span className="font-bold text-emerald-900">₹{Math.round(userYouAreOwed).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-800 font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> You owe:
              </span>
              <span className="font-bold text-amber-900">₹{Math.round(userYouOwe).toLocaleString()}</span>
            </div>
          </div>
          <div className="text-[10px] text-[#7B4D36] border-t border-[#E5D5BA] pt-1">
            {activeDebts.length} active group settlements
          </div>
        </div>
      </div>

      {/* Group Balances & Debt Simplification Matrix */}
      <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5D5BA] pb-3">
          <div>
            <h4 className="font-serif font-black text-lg text-[#173B32] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#B65E3C]" />
              <span>Who Owes Whom (Settlements)</span>
            </h4>
            <p className="text-xs text-[#7B4D36] font-light">
              Smallest set of payments to settle the whole group without changing anyone&rsquo;s net balance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setUseSimplified(!useSimplified)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
              useSimplified
                ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                : "bg-white text-[#173B32] border-[#E5D5BA] hover:bg-[#EFE5D2]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
            <span>{useSimplified ? "Simplified (Optimal)" : "Direct Pairwise"}</span>
          </button>
        </div>

        {activeDebts.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
            <div className="font-serif font-bold text-sm text-[#173B32]">Everyone is completely settled up!</div>
            <p className="text-xs text-[#7B4D36]">No pending debts across the group.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeDebts.map((debt, idx) => {
              const isUserDebtor = debt.debtor_user_id === currentUserId;
              const isUserCreditor = debt.creditor_user_id === currentUserId;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                    isUserDebtor
                      ? "bg-amber-50/70 border-amber-300"
                      : isUserCreditor
                      ? "bg-emerald-50/70 border-emerald-300"
                      : "bg-white border-[#E5D5BA]"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="text-xs text-[#173B32] font-semibold flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[#173B32] truncate">{debt.debtor_name}</span>
                      <span className="text-[#7B4D36] text-[10px] uppercase font-mono">owes</span>
                      <span className="font-bold text-[#173B32] truncate">{debt.creditor_name}</span>
                    </div>
                    <div className="font-mono font-black text-base text-[#173B32]">
                      ₹{debt.amount.toLocaleString()}
                    </div>
                  </div>

                  {/* Settle Up Action */}
                  <button
                    type="button"
                    onClick={() => setSettleModalDebt(debt)}
                    className="px-3.5 py-2 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-xs transition-colors"
                  >
                    Settle Up
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual Member Balances Strip */}
      {balancesData?.balances && balancesData.balances.length > 0 && (
        <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-3">
          <span className="text-[10.5px] font-mono font-bold uppercase text-[#7B4D36]">Group Member Balances</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {balancesData.balances.map((mb) => (
              <div key={mb.user_id} className="p-3 rounded-2xl bg-white border border-[#E5D5BA] space-y-1">
                <div className="font-serif font-bold text-xs text-[#173B32] truncate">{mb.user_name}</div>
                <div className="text-[10px] text-[#7B4D36] font-mono">Paid: ₹{Math.round(mb.total_paid).toLocaleString()}</div>
                <div className={`text-xs font-mono font-bold ${
                  mb.net_balance > 0 ? "text-emerald-700" : mb.net_balance < 0 ? "text-amber-700" : "text-[#7B4D36]"
                }`}>
                  {mb.net_balance > 0 ? `+₹${Math.round(mb.net_balance).toLocaleString()}` : mb.net_balance < 0 ? `-₹${Math.round(Math.abs(mb.net_balance)).toLocaleString()}` : "₹0"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense History, Search & Filter Section */}
      <div className="p-6 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-serif font-black text-xl text-[#173B32] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#B65E3C]" />
              <span>Expense History ({expenses.length})</span>
            </h4>
            <p className="text-xs text-[#7B4D36] font-light">Every recorded bill, dhaba meal, fuel fill, and stay payment.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7B4D36]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#E5D5BA] text-xs text-[#173B32] focus:outline-none focus:border-[#173B32]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {["all", "Food", "Fuel", "Transport", "Stay", "Activities", "Tolls", "Shopping", "Parking", "Other"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#173B32] text-[#EFE5D2]"
                  : "bg-white border border-[#E5D5BA] text-[#7B4D36] hover:bg-[#EFE5D2]"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Expense List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#7B4D36]">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Receipt className="w-8 h-8 text-[#7B4D36] mx-auto opacity-60" />
            <div className="font-serif font-bold text-sm text-[#173B32]">No expenses logged yet.</div>
            <p className="text-xs text-[#7B4D36]">Record your first fuel stop, meal, or hotel booking above.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-2xl bg-white border border-[#E5D5BA] hover:border-[#173B32]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] text-[9px] font-mono font-bold uppercase">
                      {exp.category}
                    </span>
                    <span className="font-serif font-bold text-sm text-[#173B32] truncate">
                      {exp.title}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#7B4D36] font-mono flex items-center gap-2 flex-wrap">
                    <span>Paid by <strong>{exp.payer_name || exp.user_name}</strong></span>
                    <span>•</span>
                    <span>{exp.date}</span>
                    <span>•</span>
                    <span>Split: {exp.split_method || "EQUAL"} ({exp.shares?.length || members.length || 1} people)</span>
                    {exp.notes && (
                      <>
                        <span>•</span>
                        <span className="italic truncate max-w-[200px]">{exp.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5D5BA]">
                  <div className="text-right">
                    <div className="font-mono font-black text-base text-[#173B32]">
                      ₹{exp.amount.toLocaleString()}
                    </div>
                    <span className="text-[9.5px] font-mono text-[#7B4D36]">
                      {exp.payment_method}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-2 rounded-lg text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
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

      {/* Settle Up Modal */}
      {settleModalDebt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C]">Record Payment</span>
                <h4 className="font-serif font-black text-xl text-[#173B32]">Settle Up</h4>
              </div>
              <button
                type="button"
                onClick={() => setSettleModalDebt(null)}
                className="text-[#7B4D36] hover:text-[#173B32] text-xs font-bold font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#7B4D36]">Paying to:</span>
                <strong className="text-[#173B32]">{settleModalDebt.creditor_name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7B4D36]">Amount to Settle:</span>
                <strong className="text-[#173B32] font-mono text-base">₹{settleModalDebt.amount.toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handleRecordSettlement} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#7B4D36] font-bold uppercase text-[10px] mb-1">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["UPI", "Cash", "Bank Transfer", "Other"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettlePaymentMethod(m)}
                      className={`p-2 rounded-xl text-center font-bold text-xs transition-colors cursor-pointer border ${
                        settlePaymentMethod === m
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                          : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#7B4D36] font-bold uppercase text-[10px] mb-1">Optional Reference / Note</label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="e.g. GPay transaction #849204"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E5D5BA] text-xs text-[#173B32] focus:outline-none focus:border-[#173B32]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettleModalDebt(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white border border-[#E5D5BA] text-xs font-bold text-[#7B4D36] hover:bg-[#EFE5D2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="flex-1 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {isSettling ? "Saving..." : "Mark as Paid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
