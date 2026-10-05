"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  RefreshCw,
  Fuel,
  BedDouble,
  Utensils,
  Landmark,
  Car,
  Zap,
  Check,
  RotateCcw,
  Sliders,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { CustomExpenseItem, RoadTripBudgetEstimate } from "@/types";

export interface BudgetModelValues {
  travellersCount: number;
  distanceKm: number;
  numDays: number;
  // Vehicle & Fuel
  fuelType: "Petrol" | "Diesel" | "CNG" | "Electric" | "Custom";
  fuelEfficiency: number;
  fuelRate: number;
  fuelUnit: string;
  // Stay
  stayNights: number;
  stayRatePerNight: number;
  stayRooms: number;
  // Food
  foodPerPersonPerDay: number;
  foodTotalOverride: number | null;
  useFoodOverride: boolean;
  // Toggles & Amounts
  includeFuel: boolean;
  includeTolls: boolean;
  tollsAmount: number;
  includeParking: boolean;
  parkingAmount: number;
  includeFood: boolean;
  includeStay: boolean;
  includeActivities: boolean;
  activitiesAmount: number;
  // Custom Expenses
  customExpenses: CustomExpenseItem[];
}

interface InteractiveBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: BudgetModelValues;
  onSave: (values: BudgetModelValues, computed: ComputedBudget) => void;
  onResetToDefaults?: () => void;
  defaultValues?: BudgetModelValues;
}

export interface ComputedBudget {
  fuelCost: number;
  stayCost: number;
  foodCost: number;
  tollsCost: number;
  parkingCost: number;
  activitiesCost: number;
  customExpensesCost: number;
  totalCost: number;
  perPersonCost: number;
}

export function computeBudget(values: BudgetModelValues): ComputedBudget {
  const {
    distanceKm,
    travellersCount,
    numDays,
    fuelEfficiency,
    fuelRate,
    stayNights,
    stayRatePerNight,
    stayRooms,
    foodPerPersonPerDay,
    foodTotalOverride,
    useFoodOverride,
    includeFuel,
    includeTolls,
    tollsAmount,
    includeParking,
    parkingAmount,
    includeFood,
    includeStay,
    includeActivities,
    activitiesAmount,
    customExpenses,
  } = values;

  const travellers = Math.max(1, travellersCount);

  // 1. Fuel Cost
  const unitsNeeded = distanceKm / Math.max(0.1, fuelEfficiency);
  const fuelRaw = Math.round(unitsNeeded * fuelRate);
  const fuelCost = includeFuel ? fuelRaw : 0;

  // 2. Stay Cost
  const stayRaw = Math.round(stayNights * stayRooms * stayRatePerNight);
  const stayCost = includeStay ? stayRaw : 0;

  // 3. Food Cost
  let foodRaw = 0;
  if (useFoodOverride && foodTotalOverride !== null && foodTotalOverride >= 0) {
    foodRaw = Math.round(foodTotalOverride);
  } else {
    foodRaw = Math.round(numDays * travellers * foodPerPersonPerDay);
  }
  const foodCost = includeFood ? foodRaw : 0;

  // 4. Tolls Cost
  const tollsCost = includeTolls ? Math.round(tollsAmount) : 0;

  // 5. Parking Cost
  const parkingCost = includeParking ? Math.round(parkingAmount) : 0;

  // 6. Activities Cost
  const activitiesCost = includeActivities ? Math.round(activitiesAmount) : 0;

  // 7. Custom Expenses
  let customExpensesCost = 0;
  customExpenses.forEach((ce) => {
    if (ce.basis === "per_person") {
      customExpensesCost += Math.round(ce.amount * travellers);
    } else {
      customExpensesCost += Math.round(ce.amount);
    }
  });

  const totalCost =
    fuelCost +
    stayCost +
    foodCost +
    tollsCost +
    parkingCost +
    activitiesCost +
    customExpensesCost;

  const perPersonCost = Math.round(totalCost / travellers);

  return {
    fuelCost,
    stayCost,
    foodCost,
    tollsCost,
    parkingCost,
    activitiesCost,
    customExpensesCost,
    totalCost,
    perPersonCost,
  };
}

export const InteractiveBudgetModal: React.FC<InteractiveBudgetModalProps> = ({
  isOpen,
  onClose,
  initialValues,
  onSave,
  onResetToDefaults,
  defaultValues,
}) => {
  const [form, setForm] = useState<BudgetModelValues>(initialValues);
  const [activeTab, setActiveTab] = useState<"all" | "travel" | "stay" | "food" | "custom">("all");

  // Custom expense creation fields
  const [newExpName, setNewExpName] = useState("");
  const [newExpCat, setNewExpCat] = useState<"Food" | "Fuel" | "Stay" | "Transport" | "Activity" | "Other">("Food");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpBasis, setNewExpBasis] = useState<"trip_total" | "per_person">("trip_total");
  const [newExpNotes, setNewExpNotes] = useState("");
  const [showAddExpense, setShowAddExpense] = useState(false);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  // Live Recalculation
  const computed = useMemo(() => computeBudget(form), [form]);

  if (!isOpen) return null;

  // Fuel Preset Handlers
  const handleFuelTypeChange = (type: "Petrol" | "Diesel" | "CNG" | "Electric" | "Custom") => {
    let eff = form.fuelEfficiency;
    let rate = form.fuelRate;
    let unit = "km/l";

    if (type === "Petrol") {
      eff = 12.0;
      rate = 95.5;
      unit = "km/l";
    } else if (type === "Diesel") {
      eff = 18.0;
      rate = 88.0;
      unit = "km/l";
    } else if (type === "CNG") {
      eff = 22.0;
      rate = 78.0;
      unit = "km/kg";
    } else if (type === "Electric") {
      eff = 7.0;
      rate = 10.0;
      unit = "km/kWh";
    } else if (type === "Custom") {
      unit = form.fuelUnit || "km/unit";
    }

    setForm((prev) => ({
      ...prev,
      fuelType: type,
      fuelEfficiency: eff,
      fuelRate: rate,
      fuelUnit: unit,
    }));
  };

  const handleAddCustomExpense = () => {
    const amt = parseFloat(newExpAmount);
    if (!newExpName.trim() || isNaN(amt) || amt <= 0) return;

    const newItem: CustomExpenseItem = {
      id: `custom-${Date.now()}`,
      name: newExpName.trim(),
      category: newExpCat,
      amount: amt,
      basis: newExpBasis,
      notes: newExpNotes.trim() || undefined,
    };

    setForm((prev) => ({
      ...prev,
      customExpenses: [...prev.customExpenses, newItem],
    }));

    setNewExpName("");
    setNewExpAmount("");
    setNewExpNotes("");
    setShowAddExpense(false);
  };

  const handleRemoveCustomExpense = (id: string) => {
    setForm((prev) => ({
      ...prev,
      customExpenses: prev.customExpenses.filter((ce) => ce.id !== id),
    }));
  };

  const handleReset = () => {
    if (defaultValues) {
      setForm(defaultValues);
    } else if (onResetToDefaults) {
      onResetToDefaults();
    }
  };

  const handleSave = () => {
    onSave(form, computed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#FAF7F0] border-t-2 sm:border-2 border-[#173B32] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-6 duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5D5BA] flex items-center justify-between shrink-0 bg-[#FAF7F0] rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#173B32] text-[#FAF4E8] flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4 text-[#B49252]" />
            </div>
            <div>
              <h2 className="font-serif font-black text-lg sm:text-xl text-[#173B32] leading-none">
                ADJUST TRIP BUDGET
              </h2>
              <span className="text-[10px] font-mono text-[#7B4D36] tracking-wider uppercase font-semibold">
                Interactive Travel &amp; Expense Engine
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close budget editor"
            className="w-8 h-8 rounded-full bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-6 flex-1 text-[#20211D]">
          {/* Travellers Bar */}
          <div className="p-3.5 bg-white border-2 border-[#E5D5BA] rounded-2xl flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#B65E3C] block">
                TRAVELLERS COUNT
              </span>
              <span className="text-xs text-[#7B4D36] font-mono">
                Used to split costs per person
              </span>
            </div>
            <div className="flex items-center gap-3 bg-[#EFE5D2] px-3 py-1.5 rounded-xl border border-[#E5D5BA]">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, travellersCount: Math.max(1, p.travellersCount - 1) }))}
                aria-label="Decrease travellers count"
                className="w-6 h-6 rounded-lg bg-white text-[#173B32] font-black text-sm flex items-center justify-center hover:bg-[#FAF7F0] cursor-pointer shadow-2xs"
              >
                -
              </button>
              <span className="font-mono font-bold text-sm text-[#173B32] min-w-[20px] text-center">
                {form.travellersCount}
              </span>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, travellersCount: Math.min(20, p.travellersCount + 1) }))}
                aria-label="Increase travellers count"
                className="w-6 h-6 rounded-lg bg-white text-[#173B32] font-black text-sm flex items-center justify-center hover:bg-[#FAF7F0] cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Section 1: Travel & Fuel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-1.5">
              <span className="text-xs font-mono font-bold uppercase text-[#173B32] flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-[#B65E3C]" />
                <span>TRAVEL &amp; VEHICLE ASSUMPTIONS</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold border border-amber-300">
                ESTIMATE ({form.distanceKm} km route)
              </span>
            </div>

            {/* Fuel Type Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#7B4D36] block font-semibold">
                FUEL / VEHICLE TYPE
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(["Petrol", "Diesel", "CNG", "Electric", "Custom"] as const).map((type) => {
                  const isSel = form.fuelType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleFuelTypeChange(type)}
                      className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center border ${
                        isSel
                          ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-xs"
                          : "bg-white text-[#7B4D36] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Efficiency & Pricing Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Efficiency */}
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl space-y-1">
                <label className="text-[10px] font-mono text-[#7B4D36] font-bold block uppercase">
                  {form.fuelType === "Electric" ? "BATTERY EFFICIENCY" : "MILEAGE / EFFICIENCY"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={form.fuelEfficiency}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setForm((p) => ({ ...p, fuelEfficiency: isNaN(val) ? 1 : val }));
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-[#173B32] focus:outline-none focus:border-[#B65E3C]"
                  />
                  <span className="text-xs font-mono font-bold text-[#7B4D36] shrink-0">
                    {form.fuelUnit}
                  </span>
                </div>
              </div>

              {/* Price / Rate */}
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl space-y-1">
                <label className="text-[10px] font-mono text-[#7B4D36] font-bold block uppercase">
                  {form.fuelType === "Electric" ? "CHARGING COST RATE" : "FUEL PRICE"}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-[#7B4D36]">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="500"
                    value={form.fuelRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setForm((p) => ({ ...p, fuelRate: isNaN(val) ? 0 : val }));
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-[#173B32] focus:outline-none focus:border-[#B65E3C]"
                  />
                  <span className="text-xs font-mono font-bold text-[#7B4D36] shrink-0">
                    / {form.fuelType === "Electric" ? "kWh" : form.fuelType === "CNG" ? "kg" : "L"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#7B4D36] bg-[#EFE5D2]/60 p-2.5 rounded-xl border border-[#E5D5BA] flex items-center justify-between">
              <span>Fuel Estimate ({form.distanceKm} km @ {form.fuelEfficiency} {form.fuelUnit}):</span>
              <strong className="text-[#173B32] font-bold">₹{computed.fuelCost.toLocaleString()}</strong>
            </div>
          </div>

          {/* Section 2: Stays & Accommodations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-1.5">
              <span className="text-xs font-mono font-bold uppercase text-[#173B32] flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-indigo-700" />
                <span>OVERNIGHT STAYS</span>
              </span>
              <span className="text-[10px] font-mono text-[#7B4D36]">
                Per room basis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Nights */}
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl space-y-1">
                <label className="text-[10px] font-mono text-[#7B4D36] font-bold block uppercase">
                  NIGHTS
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, stayNights: Math.max(0, p.stayNights - 1) }))}
                    className="w-7 h-7 rounded-lg bg-[#EFE5D2] text-[#173B32] font-bold text-xs flex items-center justify-center hover:bg-[#E5D5BA] cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={form.stayNights}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setForm((p) => ({ ...p, stayNights: isNaN(val) ? 0 : val }));
                    }}
                    className="w-full text-center bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl py-1 text-sm font-mono font-bold text-[#173B32]"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, stayNights: p.stayNights + 1 }))}
                    className="w-7 h-7 rounded-lg bg-[#EFE5D2] text-[#173B32] font-bold text-xs flex items-center justify-center hover:bg-[#E5D5BA] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Rate per night */}
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl space-y-1">
                <label className="text-[10px] font-mono text-[#7B4D36] font-bold block uppercase">
                  RATE / NIGHT (PER ROOM)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono font-bold text-[#7B4D36]">₹</span>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={form.stayRatePerNight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setForm((p) => ({ ...p, stayRatePerNight: isNaN(val) ? 0 : val }));
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl px-2.5 py-1 text-sm font-mono font-bold text-[#173B32]"
                  />
                </div>
              </div>

              {/* Rooms */}
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl space-y-1">
                <label className="text-[10px] font-mono text-[#7B4D36] font-bold block uppercase">
                  ROOMS
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, stayRooms: Math.max(1, p.stayRooms - 1) }))}
                    className="w-7 h-7 rounded-lg bg-[#EFE5D2] text-[#173B32] font-bold text-xs flex items-center justify-center hover:bg-[#E5D5BA] cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.stayRooms}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setForm((p) => ({ ...p, stayRooms: isNaN(val) ? 1 : val }));
                    }}
                    className="w-full text-center bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl py-1 text-sm font-mono font-bold text-[#173B32]"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, stayRooms: p.stayRooms + 1 }))}
                    className="w-7 h-7 rounded-lg bg-[#EFE5D2] text-[#173B32] font-bold text-xs flex items-center justify-center hover:bg-[#E5D5BA] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#7B4D36] bg-[#EFE5D2]/60 p-2.5 rounded-xl border border-[#E5D5BA] flex items-center justify-between">
              <span>{form.stayNights} nights × ₹{form.stayRatePerNight.toLocaleString()} × {form.stayRooms} room(s):</span>
              <strong className="text-[#173B32] font-bold">₹{computed.stayCost.toLocaleString()}</strong>
            </div>
          </div>

          {/* Section 3: Food & Dhabas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-1.5">
              <span className="text-xs font-mono font-bold uppercase text-[#173B32] flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-[#B65E3C]" />
                <span>FOOD &amp; HIGHWAY DHABAS</span>
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, useFoodOverride: false }))}
                  className={`px-2 py-0.5 rounded ${!form.useFoodOverride ? "bg-[#173B32] text-white font-bold" : "text-[#7B4D36]"}`}
                >
                  Per Person / Day
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, useFoodOverride: true, foodTotalOverride: p.foodTotalOverride || 3000 }))}
                  className={`px-2 py-0.5 rounded ${form.useFoodOverride ? "bg-[#173B32] text-white font-bold" : "text-[#7B4D36]"}`}
                >
                  Trip Total
                </button>
              </div>
            </div>

            {!form.useFoodOverride ? (
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl space-y-1">
                <label className="text-[10px] font-mono text-[#7B4D36] font-bold block uppercase">
                  FOOD RATE PER PERSON / DAY
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-[#7B4D36]">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={form.foodPerPersonPerDay}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setForm((p) => ({ ...p, foodPerPersonPerDay: isNaN(val) ? 0 : val }));
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-[#173B32]"
                  />
                  <span className="text-xs font-mono text-[#7B4D36] shrink-0">
                    × {form.numDays} days × {form.travellersCount} travellers
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl space-y-1">
                <label className="text-[10px] font-mono text-[#7B4D36] font-bold block uppercase">
                  TOTAL TRIP FOOD BUDGET OVERRIDE
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-[#7B4D36]">₹</span>
                  <input
                    type="number"
                    step="200"
                    min="0"
                    value={form.foodTotalOverride || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setForm((p) => ({ ...p, foodTotalOverride: isNaN(val) ? 0 : val }));
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-[#173B32]"
                  />
                </div>
              </div>
            )}

            <div className="text-[11px] font-mono text-[#7B4D36] bg-[#EFE5D2]/60 p-2.5 rounded-xl border border-[#E5D5BA] flex items-center justify-between">
              <span>Food Total:</span>
              <strong className="text-[#173B32] font-bold">₹{computed.foodCost.toLocaleString()}</strong>
            </div>
          </div>

          {/* Section 4: Included Costs / Toggles */}
          <div className="space-y-3">
            <div className="border-b border-[#E5D5BA] pb-1.5">
              <span className="text-xs font-mono font-bold uppercase text-[#173B32]">
                INCLUDED CATEGORIES &amp; CONTROLS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Tolls Toggle */}
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl flex items-center justify-between gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.includeTolls}
                    onChange={(e) => setForm((p) => ({ ...p, includeTolls: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#173B32] accent-[#173B32]"
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-[#173B32] block">Fastag Tolls</span>
                    <span className="text-[10px] font-mono text-[#7B4D36]">Corridor toll booths</span>
                  </div>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-[#7B4D36]">₹</span>
                  <input
                    type="number"
                    disabled={!form.includeTolls}
                    value={form.tollsAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setForm((p) => ({ ...p, tollsAmount: isNaN(val) ? 0 : val }));
                    }}
                    className={`w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border text-right ${
                      form.includeTolls
                        ? "bg-[#FAF7F0] border-[#E5D5BA] text-[#173B32]"
                        : "bg-gray-100 border-gray-200 text-gray-400"
                    }`}
                  />
                </div>
              </div>

              {/* Parking Toggle */}
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl flex items-center justify-between gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.includeParking}
                    onChange={(e) => setForm((p) => ({ ...p, includeParking: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#173B32] accent-[#173B32]"
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-[#173B32] block">Parking &amp; Entry</span>
                    <span className="text-[10px] font-mono text-[#7B4D36]">Stops &amp; monuments</span>
                  </div>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-[#7B4D36]">₹</span>
                  <input
                    type="number"
                    disabled={!form.includeParking}
                    value={form.parkingAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setForm((p) => ({ ...p, parkingAmount: isNaN(val) ? 0 : val }));
                    }}
                    className={`w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border text-right ${
                      form.includeParking
                        ? "bg-[#FAF7F0] border-[#E5D5BA] text-[#173B32]"
                        : "bg-gray-100 border-gray-200 text-gray-400"
                    }`}
                  />
                </div>
              </div>

              {/* Activities Toggle */}
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl flex items-center justify-between gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.includeActivities}
                    onChange={(e) => setForm((p) => ({ ...p, includeActivities: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#173B32] accent-[#173B32]"
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-[#173B32] block">Activities</span>
                    <span className="text-[10px] font-mono text-[#7B4D36]">Entry &amp; experiences</span>
                  </div>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-[#7B4D36]">₹</span>
                  <input
                    type="number"
                    disabled={!form.includeActivities}
                    value={form.activitiesAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setForm((p) => ({ ...p, activitiesAmount: isNaN(val) ? 0 : val }));
                    }}
                    className={`w-20 px-2 py-1 text-xs font-mono font-bold rounded-lg border text-right ${
                      form.includeActivities
                        ? "bg-[#FAF7F0] border-[#E5D5BA] text-[#173B32]"
                        : "bg-gray-100 border-gray-200 text-gray-400"
                    }`}
                  />
                </div>
              </div>

              {/* Fuel Toggle */}
              <div className="p-3 bg-white border border-[#E5D5BA] rounded-2xl flex items-center justify-between gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.includeFuel}
                    onChange={(e) => setForm((p) => ({ ...p, includeFuel: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#173B32] accent-[#173B32]"
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-[#173B32] block">Vehicle Fuel / Charge</span>
                    <span className="text-[10px] font-mono text-[#7B4D36]">Include in total</span>
                  </div>
                </label>
                <span className="text-xs font-mono font-bold text-[#173B32]">
                  {form.includeFuel ? `₹${computed.fuelCost.toLocaleString()}` : "Excluded"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Custom Expenses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-1.5">
              <span className="text-xs font-mono font-bold uppercase text-[#173B32] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>CUSTOM EXPENSES ({form.customExpenses.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-[#B65E3C] hover:bg-[#B65E3C]/10 border border-[#B65E3C]/30 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            </div>

            {/* Custom Expense Creation Card */}
            {showAddExpense && (
              <div className="p-3.5 bg-white border-2 border-[#B49252] rounded-2xl space-y-3 shadow-xs animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-[#7B4D36] block font-semibold">NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. Snacks, Photography, Permits"
                      value={newExpName}
                      onChange={(e) => setNewExpName(e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#173B32] focus:outline-none focus:border-[#B65E3C]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#7B4D36] block font-semibold">CATEGORY</label>
                    <select
                      value={newExpCat}
                      onChange={(e: any) => setNewExpCat(e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#173B32] focus:outline-none"
                    >
                      <option value="Food">Food &amp; Snacks</option>
                      <option value="Fuel">Fuel / Energy</option>
                      <option value="Stay">Stay &amp; Camp</option>
                      <option value="Transport">Transport</option>
                      <option value="Activity">Activity / Entry</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-[#7B4D36] block font-semibold">AMOUNT (₹)</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={newExpAmount}
                      onChange={(e) => setNewExpAmount(e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#173B32] focus:outline-none focus:border-[#B65E3C]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#7B4D36] block font-semibold">BASIS</label>
                    <select
                      value={newExpBasis}
                      onChange={(e: any) => setNewExpBasis(e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#E5D5BA] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#173B32] focus:outline-none"
                    >
                      <option value="trip_total">Trip Total</option>
                      <option value="per_person">Per Person</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-mono text-[#7B4D36] hover:bg-[#EFE5D2] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomExpense}
                    className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold uppercase bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] cursor-pointer shadow-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* List of Custom Expenses */}
            {form.customExpenses.length > 0 ? (
              <div className="space-y-1.5">
                {form.customExpenses.map((ce) => (
                  <div
                    key={ce.id}
                    className="p-2.5 bg-white border border-[#E5D5BA] rounded-xl flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#EFE5D2] text-[#7B4D36] text-[9px] uppercase font-bold">
                        {ce.category}
                      </span>
                      <span className="font-bold text-[#173B32]">{ce.name}</span>
                      {ce.basis === "per_person" && (
                        <span className="text-[10px] text-[#7B4D36] italic">
                          (₹{ce.amount} × {form.travellersCount} = ₹{(ce.amount * form.travellersCount).toLocaleString()})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-[#173B32]">
                        ₹{ce.basis === "per_person" ? (ce.amount * form.travellersCount).toLocaleString() : ce.amount.toLocaleString()}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomExpense(ce.id)}
                        className="text-[#7B4D36] hover:text-red-700 p-1 cursor-pointer"
                        aria-label={`Remove ${ce.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs font-mono text-[#7B4D36] bg-[#EFE5D2]/40 rounded-xl border border-dashed border-[#E5D5BA]">
                No custom expenses added yet. Tap &ldquo;+ Add Expense&rdquo; to add snacks, permits, gear, etc.
              </div>
            )}
          </div>
        </div>

        {/* Footer with Live Summary & Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E5D5BA] bg-linear-to-b from-[#FAF7F0] to-[#EFE5D2] rounded-b-3xl shrink-0 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#7B4D36] uppercase block font-bold">
                RECALCULATED TRIP TOTAL
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-serif font-black text-[#173B32]">
                  ₹{computed.totalCost.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-[#7B4D36]">
                  (₹{computed.perPersonCost.toLocaleString()} / person)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono text-[#7B4D36] hover:text-[#B65E3C] flex items-center gap-1 cursor-pointer underline underline-offset-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to estimate</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border-2 border-[#E5D5BA] bg-white hover:bg-[#FAF7F0] text-[#173B32] font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-2 py-3 px-4 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-[#B49252]" />
              <span>Save Budget</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
