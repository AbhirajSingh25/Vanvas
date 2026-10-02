"use client";

import React, { useState, useEffect } from "react";
import {
  PlusCircle, Wallet, X, Check, Users, Receipt, Percent,
  Split, DollarSign, Sparkles, FileText, ChevronDown
} from "lucide-react";
import { api } from "@/lib/api";
import { Expense, TripMemberItem } from "@/types";

interface ExpenseModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: (newExpense: Expense) => void;
  members?: TripMemberItem[];
  currentUserId?: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  tripId,
  isOpen,
  onClose,
  onExpenseAdded,
  members = [],
  currentUserId,
}) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [payerId, setPayerId] = useState(currentUserId || "");
  const [notes, setNotes] = useState("");
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [splitMethod, setSplitMethod] = useState<"EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES" | "ITEMIZED">("EQUAL");
  
  // Participants selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Custom shares state
  const [exactAmounts, setExactAmounts] = useState<Record<string, number>>({});
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [sharesCounts, setSharesCounts] = useState<Record<string, number>>({});

  // Itemized bill state
  const [billItems, setBillItems] = useState<Array<{ name: string; cost: number; user_id: string }>>([
    { name: "Meal Item 1", cost: 0, user_id: "" }
  ]);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (members.length > 0) {
      const allIds = members.map((m) => m.user_id);
      setSelectedUserIds(allIds);
      if (!payerId && members[0]) {
        setPayerId(members[0].user_id);
      }
    }
  }, [members, isOpen]);

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

  const categories = [
    "Food",
    "Fuel",
    "Transport",
    "Tolls",
    "Stay",
    "Activities",
    "Shopping",
    "Parking",
    "Other",
  ];

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length > 1) {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
      }
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSimulateOcr = async () => {
    setOcrLoading(true);
    try {
      const parsed = await api.parseReceiptOcr(tripId, {
        merchant: "Highway Dhaba Express",
        amount: parseFloat(amount) || 1280.0,
        text: ocrText || "Receipt sample"
      });
      setTitle(parsed.merchant || "Highway Meal");
      setAmount(String(parsed.total_amount));
      setTaxAmount(parsed.tax_amount);
      if (parsed.items.length > 0) {
        setBillItems(parsed.items.map((it: { title: string; amount: number }, idx: number) => ({
          name: it.title,
          cost: it.amount,
          user_id: members[idx % members.length]?.user_id || payerId
        })));
        setSplitMethod("ITEMIZED");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!title.trim() || !amount || parsedAmt <= 0 || loading) return;

    setLoading(true);

    let customSharesPayload: any[] | undefined = undefined;

    if (splitMethod === "EXACT") {
      customSharesPayload = selectedUserIds.map((uId) => {
        const u = members.find((m) => m.user_id === uId);
        return {
          user_id: uId,
          user_name: u?.full_name || "Traveller",
          owed_amount: exactAmounts[uId] || (parsedAmt / selectedUserIds.length)
        };
      });
    } else if (splitMethod === "PERCENTAGE") {
      customSharesPayload = selectedUserIds.map((uId) => {
        const u = members.find((m) => m.user_id === uId);
        const pct = percentages[uId] || (100 / selectedUserIds.length);
        return {
          user_id: uId,
          user_name: u?.full_name || "Traveller",
          percentage: pct,
          owed_amount: round2(parsedAmt * (pct / 100))
        };
      });
    } else if (splitMethod === "SHARES") {
      const totalShares = selectedUserIds.reduce((acc, uId) => acc + (sharesCounts[uId] || 1), 0);
      customSharesPayload = selectedUserIds.map((uId) => {
        const u = members.find((m) => m.user_id === uId);
        const sh = sharesCounts[uId] || 1;
        return {
          user_id: uId,
          user_name: u?.full_name || "Traveller",
          shares_count: sh,
          owed_amount: round2(parsedAmt * (sh / Math.max(1, totalShares)))
        };
      });
    } else if (splitMethod === "ITEMIZED") {
      const userTotals: Record<string, number> = {};
      selectedUserIds.forEach((id) => { userTotals[id] = 0; });
      billItems.forEach((bi) => {
        const targetId = bi.user_id || selectedUserIds[0] || payerId;
        userTotals[targetId] = (userTotals[targetId] || 0) + (bi.cost || 0);
      });
      // Distribute tax & tip proportionally
      const itemsSubtotal = billItems.reduce((acc, bi) => acc + (bi.cost || 0), 0);
      const extra = (taxAmount || 0) + (tipAmount || 0);
      customSharesPayload = selectedUserIds.map((uId) => {
        const u = members.find((m) => m.user_id === uId);
        const userSub = userTotals[uId] || 0;
        const extraShare = itemsSubtotal > 0 ? (userSub / itemsSubtotal) * extra : extra / selectedUserIds.length;
        return {
          user_id: uId,
          user_name: u?.full_name || "Traveller",
          owed_amount: round2(userSub + extraShare)
        };
      });
    }

    try {
      const exp = await api.addExpense(tripId, {
        title,
        amount: parsedAmt,
        category,
        payer_user_id: payerId || undefined,
        payment_method: paymentMethod,
        date: dateStr,
        notes,
        split_method: splitMethod,
        participant_user_ids: selectedUserIds,
        custom_shares: customSharesPayload,
        tax_amount: taxAmount,
        tip_amount: tipAmount
      });
      onExpenseAdded(exp);
      onClose();
      setTitle("");
      setAmount("");
      setNotes("");
    } catch (err) {
      console.error(err);
      alert("Failed to log expense. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const round2 = (val: number) => Math.round(val * 100) / 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/75 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg">Log Trip Expense • VANVAS Split</h3>
              <p className="text-xs text-[#D8DED5]/80 font-mono">Shared wallet &amp; smart balance ledger</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-[#173B32] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Amount & Date in 1 Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#173B32] uppercase tracking-wider block mb-1">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-[#173B32] text-base font-mono">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1450"
                  className="w-full pl-8 pr-3 py-2 bg-white border-2 border-[#E5D5BA] rounded-xl font-bold font-mono text-base text-[#20211D] focus:outline-none focus:border-[#173B32]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#173B32] uppercase tracking-wider block mb-1">
                Date
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl font-mono text-xs text-[#20211D] focus:outline-none focus:border-[#173B32]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-[#173B32] uppercase tracking-wider block mb-1">
              Description / Expense Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Highway Petrol, Murthal Dhaba Lunch, Resort Stay"
              className="w-full px-3.5 py-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs text-[#20211D] focus:outline-none focus:border-[#173B32]"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="text-[10px] font-bold text-[#173B32] uppercase tracking-wider block mb-1">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                    category === cat
                      ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] font-bold"
                      : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Payer & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Payer Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-[#173B32] uppercase tracking-wider block mb-1">
                Paid By
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs text-[#173B32] font-semibold focus:outline-none focus:border-[#173B32]"
              >
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name} {m.user_id === currentUserId ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-[10px] font-bold text-[#173B32] uppercase tracking-wider block mb-1">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-1">
                {["UPI", "Cash", "Card"].map((pm) => (
                  <button
                    type="button"
                    key={pm}
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-2 rounded-xl text-xs font-bold text-center border cursor-pointer transition-colors ${
                      paymentMethod === pm
                        ? "bg-[#B65E3C] text-[#EFE5D2] border-[#B65E3C]"
                        : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Split Method Tabs */}
          <div className="pt-2 border-t border-[#E5D5BA] space-y-2">
            <label className="text-[10px] font-bold text-[#173B32] uppercase tracking-wider block">
              Split Method
            </label>
            <div className="grid grid-cols-5 gap-1 font-mono text-[10.5px]">
              {[
                { id: "EQUAL", label: "Equally" },
                { id: "EXACT", label: "Exact" },
                { id: "PERCENTAGE", label: "% Pct" },
                { id: "SHARES", label: "Shares" },
                { id: "ITEMIZED", label: "Itemized" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSplitMethod(m.id as any)}
                  className={`py-1.5 px-1 rounded-xl text-center font-bold border transition-colors cursor-pointer ${
                    splitMethod === m.id
                      ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                      : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Participants Checkboxes */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-white border border-[#E5D5BA]">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-[#7B4D36]">
              <span>Split Between ({selectedUserIds.length} of {members.length})</span>
              <button
                type="button"
                onClick={() => setSelectedUserIds(members.map((m) => m.user_id))}
                className="text-[#173B32] hover:underline"
              >
                Select All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {members.map((m) => {
                const isSelected = selectedUserIds.includes(m.user_id);
                return (
                  <div
                    key={m.user_id}
                    onClick={() => toggleUserSelection(m.user_id)}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#EFE5D2] border-[#173B32] text-[#173B32] font-bold"
                        : "bg-[#FAF7F0] border-[#E5D5BA] text-[#7B4D36] opacity-60"
                    }`}
                  >
                    <span className="truncate max-w-[140px] text-xs">{m.full_name}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-3.5 h-3.5 accent-[#173B32]"
                    />
                  </div>
                );
              })}
            </div>

            {/* Split Method Details (Equal / Exact / % / Shares preview) */}
            {splitMethod === "EQUAL" && (
              <div className="pt-2 text-[11px] font-mono text-[#7B4D36] flex items-center justify-between border-t border-[#E5D5BA]">
                <span>Each person pays:</span>
                <strong className="text-[#173B32] font-bold text-xs">
                  ₹{amount && selectedUserIds.length > 0 ? (parseFloat(amount) / selectedUserIds.length).toFixed(2) : "0.00"}
                </strong>
              </div>
            )}

            {splitMethod === "EXACT" && (
              <div className="space-y-1.5 pt-2 border-t border-[#E5D5BA]">
                {selectedUserIds.map((uId) => {
                  const u = members.find((m) => m.user_id === uId);
                  return (
                    <div key={uId} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">{u?.full_name}</span>
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1.5 text-xs text-[#7B4D36]">₹</span>
                        <input
                          type="number"
                          value={exactAmounts[uId] || ""}
                          onChange={(e) => setExactAmounts({ ...exactAmounts, [uId]: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full pl-5 pr-2 py-1 rounded-lg border border-[#E5D5BA] font-mono text-xs text-right"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional OCR Assistant */}
          <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5D5BA] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#7B4D36]">
              <Receipt className="w-4 h-4 text-[#B65E3C]" />
              <span>Have a receipt? Extract items with 1 click</span>
            </div>
            <button
              type="button"
              disabled={ocrLoading}
              onClick={handleSimulateOcr}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#E5D5BA] hover:bg-[#EFE5D2] font-bold text-xs text-[#173B32] cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-[#B65E3C]" />
              <span>{ocrLoading ? "Scanning..." : "Scan / OCR"}</span>
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-[#7B4D36] uppercase tracking-wider block mb-1">
              Optional Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via PhonePe, bill uploaded"
              className="w-full px-3 py-2 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs text-[#20211D] focus:outline-none focus:border-[#173B32]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !title || !amount}
              className="w-full py-3.5 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#B49252]" />
              <span>{loading ? "Recording..." : "Save to Trip Ledger"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
