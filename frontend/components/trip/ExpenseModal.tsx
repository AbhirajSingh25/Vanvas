"use client";

import React, { useState, useEffect } from "react";
import {
  PlusCircle, Wallet, X, Check, Users, Receipt, Percent,
  Split, DollarSign, Sparkles, FileText, ChevronDown, Plus, Trash2
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
  const [splitMethod, setSplitMethod] = useState<"EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES" | "ITEMIZED">("EQUAL");
  const [showAdvancedSplits, setShowAdvancedSplits] = useState(false);
  
  // Participants selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Custom shares state
  const [exactAmounts, setExactAmounts] = useState<Record<string, number>>({});
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [sharesCounts, setSharesCounts] = useState<Record<string, number>>({});

  // Itemized bill state (Part 16)
  const [billItems, setBillItems] = useState<Array<{ name: string; cost: number; user_id: string }>>([
    { name: "Main Dish", cost: 0, user_id: "" }
  ]);
  const [taxPercent, setTaxPercent] = useState<number>(5);
  const [tipPercent, setTipPercent] = useState<number>(10);

  // OCR state (Part 17)
  const [showOcrDrawer, setShowOcrDrawer] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMerchant, setOcrMerchant] = useState("Highway Dhaba Express");
  const [ocrTotal, setOcrTotal] = useState("1850");

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

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length > 1) {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
      }
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleApplyOcrReview = () => {
    setTitle(ocrMerchant);
    setAmount(ocrTotal);
    setShowOcrDrawer(false);
  };

  const handleAddItemizedRow = () => {
    setBillItems([...billItems, { name: "", cost: 0, user_id: selectedUserIds[0] || payerId }]);
  };

  const handleRemoveItemizedRow = (idx: number) => {
    if (billItems.length > 1) {
      setBillItems(billItems.filter((_, i) => i !== idx));
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
          owed_amount: (parsedAmt * pct) / 100
        };
      });
    } else if (splitMethod === "SHARES") {
      customSharesPayload = selectedUserIds.map((uId) => {
        const u = members.find((m) => m.user_id === uId);
        return {
          user_id: uId,
          user_name: u?.full_name || "Traveller",
          shares_count: sharesCounts[uId] || 1.0
        };
      });
    } else if (splitMethod === "ITEMIZED") {
      // Aggregate itemized bill per user
      const userOwed: Record<string, number> = {};
      selectedUserIds.forEach((id) => (userOwed[id] = 0));
      billItems.forEach((it) => {
        const uId = it.user_id || payerId;
        userOwed[uId] = (userOwed[uId] || 0) + (it.cost || 0);
      });

      // Distribute tax and tip proportionally
      const subtotal = billItems.reduce((acc, it) => acc + (it.cost || 0), 0);
      const taxAndTipMultiplier = subtotal > 0 ? (1 + (taxPercent + tipPercent) / 100) : 1;

      customSharesPayload = selectedUserIds.map((uId) => {
        const u = members.find((m) => m.user_id === uId);
        const rawOwed = userOwed[uId] || 0;
        return {
          user_id: uId,
          user_name: u?.full_name || "Traveller",
          owed_amount: round2(rawOwed * taxAndTipMultiplier)
        };
      });
    }

    try {
      const newExp = await api.addExpense(tripId, {
        title: title.trim(),
        amount: parsedAmt,
        category,
        payment_method: paymentMethod,
        payer_user_id: payerId || undefined,
        split_method: splitMethod,
        participant_user_ids: selectedUserIds,
        custom_shares: customSharesPayload
      });
      onExpenseAdded(newExp);
      onClose();
    } catch (err: any) {
      alert(err?.message || "Could not add expense");
    } finally {
      setLoading(false);
    }

  };

  function round2(val: number) {
    return Math.round(val * 100) / 100;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xl p-5 sm:p-6 space-y-4 animate-fadeIn my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#B65E3C]" />
            <h3 className="font-serif font-black text-lg text-[#173B32]">
              Add Expense
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#7B4D36] hover:bg-[#EFE5D2] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* OCR Trigger Pill */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#E5D5BA] text-xs">
          <div className="flex items-center gap-2 font-mono text-[#7B4D36]">
            <Receipt className="w-3.5 h-3.5 text-[#B65E3C]" />
            <span>Have a receipt?</span>
          </div>
          <button
            type="button"
            onClick={() => setShowOcrDrawer(!showOcrDrawer)}
            className="px-2.5 py-1 rounded-xl bg-[#EFE5D2] text-[#173B32] font-mono text-[10.5px] font-bold cursor-pointer"
          >
            {showOcrDrawer ? "Close OCR" : "Scan / OCR"}
          </button>
        </div>

        {/* OCR Review Box (Part 17) */}
        {showOcrDrawer && (
          <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#D8CBB2] space-y-2 text-xs font-mono animate-fadeIn">
            <span className="font-bold uppercase text-[9.5px] text-[#B65E3C] block">
              Receipt Review (Verify extracted fields)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Merchant"
                value={ocrMerchant}
                onChange={(e) => setOcrMerchant(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-white border border-[#D8CBB2] text-xs font-bold"
              />
              <input
                type="number"
                placeholder="Amount"
                value={ocrTotal}
                onChange={(e) => setOcrTotal(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-white border border-[#D8CBB2] text-xs font-bold"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyOcrReview}
              className="w-full py-1.5 rounded-xl bg-[#173B32] text-[#EFE5D2] font-bold text-[10px] uppercase cursor-pointer"
            >
              Confirm &amp; Apply Fields
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount (Part 12) */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
              AMOUNT
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-mono font-bold text-[#173B32]">
                ₹
              </span>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#E5D5BA] text-xl font-mono font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
              />
            </div>
          </div>

          {/* What? & Category (Part 12) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
                WHAT?
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Petrol, Lunch, Hotel"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5D5BA] text-xs font-bold text-[#173B32] focus:outline-none focus:border-[#173B32]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5D5BA] text-xs font-bold text-[#173B32] focus:outline-none"
              >
                {["Food", "Fuel", "Transport", "Tolls", "Stay", "Activities", "Other"].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By (Part 12) */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
              PAID BY
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5D5BA] text-xs font-bold text-[#173B32] focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name || "Traveller"}
                </option>
              ))}
            </select>
          </div>

          {/* Split With Checkboxes (Part 12) */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-[#7B4D36] mb-1">
              SPLIT WITH
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
              {members.map((m) => {
                const isSelected = selectedUserIds.includes(m.user_id);
                return (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => toggleUserSelection(m.user_id)}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-mono font-bold flex items-center justify-between border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                        : "bg-white text-[#7B4D36] border-[#E5D5BA]"
                    }`}
                  >
                    <span className="truncate">{m.full_name || "Traveller"}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#B49252]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Method Selector (Part 13: Equal by default) */}
          <div className="pt-1 border-t border-[#E5D5BA]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono font-bold uppercase text-[#7B4D36]">
                SPLIT METHOD
              </label>
              <button
                type="button"
                onClick={() => setShowAdvancedSplits(!showAdvancedSplits)}
                className="text-[10px] font-mono text-[#B65E3C] font-bold cursor-pointer"
              >
                {showAdvancedSplits ? "Fewer options" : "More split options"}
              </button>
            </div>

            {/* Split Method Tabs */}
            <div className="grid grid-cols-3 gap-1">
              {["EQUAL", "EXACT", "PERCENTAGE"].map((sm) => (
                <button
                  key={sm}
                  type="button"
                  onClick={() => setSplitMethod(sm as any)}
                  className={`py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer ${
                    splitMethod === sm
                      ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                      : "bg-white text-[#7B4D36] border-[#E5D5BA]"
                  }`}
                >
                  {sm}
                </button>
              ))}
            </div>

            {showAdvancedSplits && (
              <div className="grid grid-cols-2 gap-1 mt-1 animate-fadeIn">
                {["SHARES", "ITEMIZED"].map((sm) => (
                  <button
                    key={sm}
                    type="button"
                    onClick={() => setSplitMethod(sm as any)}
                    className={`py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer ${
                      splitMethod === sm
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                        : "bg-white text-[#7B4D36] border-[#E5D5BA]"
                    }`}
                  >
                    {sm === "ITEMIZED" ? "Itemized Bill" : "Shares Ratio"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dedicated Itemized Bill Step (Part 16) */}
          {splitMethod === "ITEMIZED" && (
            <div className="p-3 rounded-2xl bg-white border border-[#E5D5BA] space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#7B4D36]">
                <span>ITEMIZED BILL</span>
                <button
                  type="button"
                  onClick={handleAddItemizedRow}
                  className="text-[#B65E3C] hover:underline"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {billItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs">
                    <input
                      type="text"
                      placeholder="Dish/Item"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...billItems];
                        newItems[idx].name = e.target.value;
                        setBillItems(newItems);
                      }}
                      className="flex-1 px-2 py-1 rounded bg-[#FAF7F0] border border-[#E5D5BA] text-xs"
                    />
                    <input
                      type="number"
                      placeholder="₹"
                      value={item.cost || ""}
                      onChange={(e) => {
                        const newItems = [...billItems];
                        newItems[idx].cost = parseFloat(e.target.value) || 0;
                        setBillItems(newItems);
                      }}
                      className="w-16 px-2 py-1 rounded bg-[#FAF7F0] border border-[#E5D5BA] text-xs font-mono"
                    />
                    <select
                      value={item.user_id}
                      onChange={(e) => {
                        const newItems = [...billItems];
                        newItems[idx].user_id = e.target.value;
                        setBillItems(newItems);
                      }}
                      className="w-20 px-1 py-1 rounded bg-[#FAF7F0] border border-[#E5D5BA] text-[10px]"
                    >
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.full_name?.split(" ")[0] || "User"}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveItemizedRow(idx)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-[#B49252]" />
            <span>{loading ? "Adding Expense..." : "Add Expense"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
