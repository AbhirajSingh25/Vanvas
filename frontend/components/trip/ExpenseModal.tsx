"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Wallet, X, DollarSign, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Expense } from "@/types";

interface ExpenseModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: (newExpense: Expense) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  tripId,
  isOpen,
  onClose,
  onExpenseAdded,
}) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

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
    "Transport",
    "Hotel",
    "Scooter/rental",
    "Local transport",
    "Activities",
    "Shopping",
    "Misc",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0 || loading) return;

    setLoading(true);
    try {
      const exp = await api.addExpense(tripId, {
        title,
        amount: parseFloat(amount),
        category,
        payment_method: paymentMethod,
        notes,
      });
      onExpenseAdded(exp);
      onClose();
      setTitle("");
      setAmount("");
      setNotes("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#0F2924] text-[#EFE5D2] flex items-center justify-between border-b border-[#243E36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg">खर्च जोड़ें • Log Expense</h3>
              <p className="text-xs text-[#D8DED5]/80 font-mono">Live on-the-road budget tracker</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-[#173B32]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block mb-1">
              रक़म • Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-[#173B32] text-lg">₹</span>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250"
                className="w-full pl-8 pr-4 py-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl font-bold font-mono text-lg text-[#20211D] focus:outline-none focus:border-[#173B32]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block mb-1">
              कहाँ खर्च किया? • Description
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hot Siddu & Herbal Chai at Chhotu Dhaba"
              className="w-full px-3.5 py-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl text-xs text-[#20211D] focus:outline-none focus:border-[#173B32]"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center transition-all border ${
                    category === cat
                      ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] font-bold"
                      : "bg-[#EFE5D2] text-[#20211D] border-[#E5D5BA] hover:bg-[#E5D5BA]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["UPI", "Cash", "Card"].map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-2 rounded-xl text-xs font-bold text-center transition-all border ${
                    paymentMethod === pm
                      ? "bg-[#B65E3C] text-[#EFE5D2] border-[#B65E3C]"
                      : "bg-[#EFE5D2] text-[#20211D] border-[#E5D5BA] hover:bg-[#E5D5BA]"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !title || !amount}
              className="w-full py-3 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-[#B49252]" />
              {loading ? "Logging..." : "Add to Budget Tracker"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
