"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X, Check, Sparkles, User, Sun, Moon, Coffee, Trees, Compass,
  Flame, Wallet, BedDouble, Car, Users, Utensils, Heart,
  ShieldCheck, AlertCircle, RefreshCw, ChevronRight, CheckCircle2,
  Tag, Award, Landmark, MapPin, Tent, Plane, Bus, Bike
} from "lucide-react";
import { TravelStamp } from "@/components/ui/TravelStamp";

interface ProfilePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePreferencesModal: React.FC<ProfilePreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateProfile } = useAuth();

  // Form State
  const [fullName, setFullName] = useState("");
  const [wakeUp, setWakeUp] = useState("Normal");
  const [intensity, setIntensity] = useState("Balanced");
  const [budgetStyle, setBudgetStyle] = useState("Balanced");
  const [dietary, setDietary] = useState("All");
  const [accommodation, setAccommodation] = useState("Riverside & Forest Stays");
  const [transport, setTransport] = useState("Volvo Bus");
  const [companion, setCompanion] = useState("Solo");
  const [interests, setInterests] = useState<string[]>([]);

  // UX & Async Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Initial State Snapshot for Dirty Checking
  const initialSnapshot = useRef<string>("");

  // Sync state when modal opens or user updates
  useEffect(() => {
    if (isOpen && user) {
      const prefs = user.preferences || {};
      const initialName = user.full_name || "Aarav Sharma";
      const initialWakeUp = prefs.wake_up_preference || "Normal";
      const initialIntensity = prefs.activity_intensity || "Balanced";
      const initialBudget = prefs.preferred_travel_style || "Balanced";
      const initialDietary = prefs.dietary_preference || "All";
      const initialAccommodation = prefs.accommodation_preference || "Riverside & Forest Stays";
      const initialTransport = prefs.transport_preference || "Volvo Bus";
      const initialCompanion = prefs.companion_style || "Solo";
      const initialInterests = prefs.interests
        ? prefs.interests.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Nature", "Cafés", "Adventure", "Food"];

      setFullName(initialName);
      setWakeUp(initialWakeUp);
      setIntensity(initialIntensity);
      setBudgetStyle(initialBudget);
      setDietary(initialDietary);
      setAccommodation(initialAccommodation);
      setTransport(initialTransport);
      setCompanion(initialCompanion);
      setInterests(initialInterests);

      setSaveSuccess(false);
      setErrorMessage(null);
      setShowDiscardConfirm(false);

      initialSnapshot.current = JSON.stringify({
        fullName: initialName,
        wakeUp: initialWakeUp,
        intensity: initialIntensity,
        budgetStyle: initialBudget,
        dietary: initialDietary,
        accommodation: initialAccommodation,
        transport: initialTransport,
        companion: initialCompanion,
        interests: initialInterests.sort(),
      });
    }
  }, [isOpen, user]);

  // Compute if form is dirty
  const isDirty = (): boolean => {
    if (!initialSnapshot.current) return false;
    const current = JSON.stringify({
      fullName,
      wakeUp,
      intensity,
      budgetStyle,
      dietary,
      accommodation,
      transport,
      companion,
      interests: [...interests].sort(),
    });
    return current !== initialSnapshot.current;
  };

  // Keyboard Escape Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleAttemptClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, fullName, wakeUp, intensity, budgetStyle, dietary, accommodation, transport, companion, interests]);

  if (!isOpen) return null;

  const handleAttemptClose = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleToggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((i) => i !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage("Please enter a display name.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await updateProfile({
        full_name: fullName.trim(),
        preferred_travel_style: budgetStyle,
        wake_up_preference: wakeUp,
        activity_intensity: intensity,
        dietary_preference: dietary,
        interests: interests.join(","),
        accommodation_preference: accommodation,
        transport_preference: transport,
        companion_style: companion,
      });

      // Update snapshot
      initialSnapshot.current = JSON.stringify({
        fullName: fullName.trim(),
        wakeUp,
        intensity,
        budgetStyle,
        dietary,
        accommodation,
        transport,
        companion,
        interests: [...interests].sort(),
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Curated Preference Option Definitions
  const wakeUpOptions = [
    {
      id: "Early",
      title: "Early Bird",
      time: "6:00 AM",
      desc: "Dawn mist, sunrises & quiet trails",
      icon: Sun,
    },
    {
      id: "Normal",
      title: "Alpine Normal",
      time: "8:00 AM",
      desc: "Fresh morning chai & hearty breakfast",
      icon: Coffee,
    },
    {
      id: "Late",
      title: "Slow Living",
      time: "10:00 AM",
      desc: "Lazy brunch, sleep in & stargazing",
      icon: Moon,
    },
  ];

  const intensityOptions = [
    {
      id: "Relaxed",
      title: "Slow & Mindful",
      subtitle: "1-2 spots/day",
      desc: "Hammock reads, café pauses, zero rush",
      icon: Trees,
    },
    {
      id: "Balanced",
      title: "Curated Rhythm",
      subtitle: "2-3 spots/day",
      desc: "Scenic balance of sights and breathing room",
      icon: Compass,
    },
    {
      id: "Packed",
      title: "Sunup to Sundown",
      subtitle: "Full throttle",
      desc: "Treks, viewpoints, multiple valleys",
      icon: Flame,
    },
  ];

  const budgetOptions = [
    {
      id: "Budget",
      title: "Backpacker",
      indicative: "₹800 - ₹1.8k / day",
      desc: "Dhabas, shared transit, cozy hostels",
      icon: Wallet,
    },
    {
      id: "Balanced",
      title: "Smart Value",
      indicative: "₹2k - ₹4k / day",
      desc: "Boutique homestays, local cabs, good meals",
      icon: Sparkles,
    },
    {
      id: "Comfort",
      title: "Heritage Comfort",
      indicative: "₹4.5k - ₹8k / day",
      desc: "Handcrafted havelis, private cab, artisan dining",
      icon: BedDouble,
    },
    {
      id: "Premium",
      title: "Luxury Retreat",
      indicative: "₹9k+ / day",
      desc: "Bespoke mountain villas, private guide, wellness",
      icon: Award,
    },
  ];

  const dietaryOptions = [
    { id: "All", label: "Everything / Local Treats", devanagari: "सब कुछ", desc: "Local siddu, trout, curries & cafes" },
    { id: "Veg", label: "Pure Vegetarian", devanagari: "शाकाहारी", desc: "Traditional Himachali dham & organic food" },
    { id: "Non-Veg", label: "Non-Vegetarian", devanagari: "मांसाहारी", desc: "Mountain trout & regional specialties" },
    { id: "Vegan", label: "Plant-based / Vegan", devanagari: "वीगन", desc: "Orchard produce, plant milk & clean meals" },
    { id: "Local Dhabas", label: "Rustic Roadside Dhabas", devanagari: "ढाबा", desc: "Authentic wooden tandoors & chai stalls" },
  ];

  const accommodationOptions = [
    { id: "Riverside & Forest Stays", label: "Riverside & Pine Forest Stays", icon: Trees },
    { id: "Boutique Heritage Havelis", label: "Boutique Heritage & Stone Havelis", icon: Landmark },
    { id: "Mountain Homestays", label: "Warm Local Mountain Homestays", icon: BedDouble },
    { id: "Luxury Resorts & Spas", label: "Luxury Forest Resorts & Spas", icon: Award },
    { id: "Glamping & Alpine Tents", label: "Glamping & Star-dome Alpine Tents", icon: Tent },
    { id: "Hostels & Social Pods", label: "Vibrant Hostels & Backpacker Pods", icon: Users },
  ];

  const transportOptions = [
    { id: "Volvo Bus", label: "Overnight Luxury Volvo Bus", icon: Bus },
    { id: "Self-Drive 4x4", label: "Self-Drive SUV / 4x4", icon: Car },
    { id: "Scenic Mountain Trains", label: "Scenic Heritage Mountain Train", icon: Compass },
    { id: "Flight + Private Cab", label: "Flight + Dedicated Local Cab", icon: Plane },
    { id: "Royal Enfield / Bike", label: "Royal Enfield / Mountain Bike", icon: Bike },
  ];

  const companionOptions = [
    { id: "Solo", label: "Solo Wanderer", desc: "Quiet reflection & independence" },
    { id: "Couple", label: "Couple Escapes", desc: "Romantic sunsets & cozy evenings" },
    { id: "Friends", label: "Adventure Crew", desc: "Bonfires, treks & group banter" },
    { id: "Family", label: "Family Vacation", desc: "Comfortable pace & all-age comfort" },
  ];

  const interestTagPool = [
    { name: "Nature", devanagari: "प्रकृति", icon: "🌲" },
    { name: "Cafés", devanagari: "कैफे", icon: "☕" },
    { name: "Adventure", devanagari: "रोमांच", icon: "🧗" },
    { name: "Food", devanagari: "स्वाद", icon: "🍲" },
    { name: "Heritage", devanagari: "धरोहर", icon: "🏛️" },
    { name: "Hidden places", devanagari: "अनछुए रास्ते", icon: "🧭" },
    { name: "Photography", devanagari: "तस्वीरें", icon: "📷" },
    { name: "Spiritual", devanagari: "सुकून", icon: "🛕" },
    { name: "Stargazing", devanagari: "तारे", icon: "✨" },
    { name: "Relaxation", devanagari: "आराम", icon: "🍃" },
  ];

  // Derived Traveller Character
  const getTravellerPersona = () => {
    if (wakeUp === "Early" && intensity === "Packed") return "The Alpine Dawn Adventurer";
    if (intensity === "Relaxed") return "The Mindful Slow Voyager";
    if (budgetStyle === "Premium") return "The Luxury Sanctuary Connoisseur";
    if (companion === "Solo") return "The Independent Mountain Soul";
    return "The Curious Himalayan Explorer";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-[#173B32]/75 backdrop-blur-sm transition-all duration-300 animate-fadeIn"
      onClick={handleAttemptClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Container */}
      <div
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl bg-[#FAF4E8] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#D8CBB2] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 px-5 sm:px-8 py-4.5 bg-[#FAF4E8]/95 backdrop-blur-md border-b border-[#D8CBB2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center font-serif font-bold text-lg shadow-sm">
              {fullName ? fullName.charAt(0).toUpperCase() : "T"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-title" className="text-lg sm:text-xl font-serif font-bold text-[#173B32]">
                  Travel Profile & Preferences
                </h2>
                <span className="font-devanagari text-xs text-[#B49252] font-semibold">
                  (मेरी पसंद)
                </span>
              </div>
              <p className="text-xs text-[#20211D]/70">
                Persistent defaults tailored across all your VANVAS journeys
              </p>
            </div>
          </div>

          <button
            onClick={handleAttemptClose}
            className="p-2 rounded-xl text-[#20211D]/70 hover:text-[#173B32] hover:bg-[#E5D5BA]/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-7 custom-scrollbar pb-24 sm:pb-8">
          {/* Persona Card / Traveler Stamp */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#173B32] to-[#255246] text-[#EFE5D2] shadow-md relative overflow-hidden">
            <div className="absolute right-3 -bottom-4 opacity-10 font-serif text-8xl pointer-events-none select-none">
              वनवास
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#B49252] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>VANVAS Traveler Identity</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#EFE5D2] mt-0.5">
                  {getTravellerPersona()}
                </h3>
                <p className="text-xs text-[#EFE5D2]/80 mt-1 max-w-md">
                  {companion} · {wakeUp} Rhythm · {budgetStyle} Style · {intensity} Pace
                </p>
              </div>

              <div className="flex items-center gap-2">
                <TravelStamp
                  label="AUTHENTIC"
                  sub="HIMALAYAN SOUL"
                  variant="mustard"
                />
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-[#173B32]/10 border border-[#173B32]/30 text-[#173B32] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-[#173B32] shrink-0" />
              <span>Preferences saved successfully! Future trip plans will automatically inherit these settings.</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: Display Name & Identity */}
          <div className="space-y-2">
            <label htmlFor="user-display-name" className="block text-xs font-bold uppercase tracking-wider text-[#173B32]">
              1. Display Name / Traveler Call-sign
            </label>
            <div className="relative">
              <input
                id="user-display-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-4 py-3 rounded-xl border border-[#D8CBB2] bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173B32]/30 focus:border-[#173B32] text-sm text-[#20211D] font-medium transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#20211D]/50">
                {user?.email}
              </div>
            </div>
          </div>

          {/* SECTION 2: Wake-up Rhythm */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                2. Preferred Wake-Up Time & Morning Rhythm
              </label>
              <span className="font-devanagari text-[11px] text-[#B49252]">सुबह की शुरुआत</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {wakeUpOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = wakeUp === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWakeUp(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? "border-[#173B32] bg-[#173B32] text-[#EFE5D2] shadow-sm ring-1 ring-[#173B32]"
                        : "border-[#D8CBB2] bg-white/70 hover:bg-white hover:border-[#173B32]/60 text-[#20211D]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-[#B49252]" : "text-[#173B32]"}`} />
                        <span className="text-xs font-bold">{opt.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                        isSelected ? "bg-white/20 text-[#EFE5D2]" : "bg-[#E5D5BA]/60 text-[#20211D]"
                      }`}>
                        {opt.time}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isSelected ? "text-[#EFE5D2]/80" : "text-[#20211D]/70"}`}>
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Travel Pace / Intensity */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                3. Travel Pace & Daily Intensity
              </label>
              <span className="font-devanagari text-[11px] text-[#B49252]">यात्रा की गति</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {intensityOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = intensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIntensity(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-[#173B32] bg-[#173B32] text-[#EFE5D2] shadow-sm ring-1 ring-[#173B32]"
                        : "border-[#D8CBB2] bg-white/70 hover:bg-white hover:border-[#173B32]/60 text-[#20211D]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-[#B49252]" : "text-[#173B32]"}`} />
                        <span className="text-xs font-bold">{opt.title}</span>
                      </div>
                    </div>
                    <span className={`inline-block text-[10px] uppercase font-bold tracking-wider mb-1 ${
                      isSelected ? "text-[#B49252]" : "text-[#B65E3C]"
                    }`}>
                      {opt.subtitle}
                    </span>
                    <p className={`text-[11px] leading-relaxed ${isSelected ? "text-[#EFE5D2]/80" : "text-[#20211D]/70"}`}>
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Budget Style */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                4. Default Budget Philosophy
              </label>
              <span className="font-devanagari text-[11px] text-[#B49252]">बजट शैली</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {budgetOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = budgetStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBudgetStyle(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-[#173B32] bg-[#173B32] text-[#EFE5D2] shadow-sm ring-1 ring-[#173B32]"
                        : "border-[#D8CBB2] bg-white/70 hover:bg-white hover:border-[#173B32]/60 text-[#20211D]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-[#B49252]" : "text-[#173B32]"}`} />
                        <span className="text-xs font-bold">{opt.title}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-white/20 text-[#EFE5D2]" : "bg-[#E5D5BA]/60 text-[#20211D]"
                      }`}>
                        {opt.indicative}
                      </span>
                    </div>
                    <p className={`text-[11px] ${isSelected ? "text-[#EFE5D2]/80" : "text-[#20211D]/70"}`}>
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: Food & Dietary Preferences */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                5. Food & Culinary Preference
              </label>
              <span className="font-devanagari text-[11px] text-[#B49252]">खान-पान</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dietaryOptions.map((opt) => {
                const isSelected = dietary === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDietary(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                      isSelected
                        ? "border-[#173B32] bg-[#173B32] text-[#EFE5D2] shadow-sm"
                        : "border-[#D8CBB2] bg-white/70 hover:bg-white hover:border-[#173B32]/60 text-[#20211D]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className="font-devanagari text-[10px] opacity-60">({opt.devanagari})</span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isSelected ? "text-[#EFE5D2]/80" : "text-[#20211D]/70"}`}>
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#B49252] shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: Accommodation & Transport Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Accommodation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                  6. Preferred Stays
                </label>
                <span className="font-devanagari text-[11px] text-[#B49252]">ठहरने की जगह</span>
              </div>
              <div className="space-y-1.5">
                {accommodationOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = accommodation === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAccommodation(opt.id)}
                      className={`w-full px-3 py-2 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-[#173B32] bg-[#173B32] text-[#EFE5D2] font-bold"
                          : "border-[#D8CBB2] bg-white/70 hover:bg-white text-[#20211D]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#B49252]" : "text-[#173B32]"}`} />
                        <span className="truncate">{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#B49252] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transport */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                  7. Preferred Transit
                </label>
                <span className="font-devanagari text-[11px] text-[#B49252]">सवारी / साधन</span>
              </div>
              <div className="space-y-1.5">
                {transportOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = transport === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTransport(opt.id)}
                      className={`w-full px-3 py-2 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-[#173B32] bg-[#173B32] text-[#EFE5D2] font-bold"
                          : "border-[#D8CBB2] bg-white/70 hover:bg-white text-[#20211D]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#B49252]" : "text-[#173B32]"}`} />
                        <span className="truncate">{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#B49252] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 8: Travel Companion Style */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                8. Travel Companion Persona
              </label>
              <span className="font-devanagari text-[11px] text-[#B49252]">सफ़र के साथी</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {companionOptions.map((opt) => {
                const isSelected = companion === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCompanion(opt.id)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "border-[#173B32] bg-[#173B32] text-[#EFE5D2] shadow-sm font-bold"
                        : "border-[#D8CBB2] bg-white/70 hover:bg-white hover:border-[#173B32]/60 text-[#20211D]"
                    }`}
                  >
                    <span className="block text-xs font-bold">{opt.label}</span>
                    <span className={`block text-[10px] mt-0.5 ${isSelected ? "text-[#EFE5D2]/70" : "text-[#20211D]/60"}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 9: Travel Interests Multi-Select */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                9. Core Travel Interests & Passions
              </label>
              <span className="text-[11px] text-[#20211D]/60">
                {interests.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {interestTagPool.map((tag) => {
                const isSelected = interests.includes(tag.name);
                return (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => handleToggleInterest(tag.name)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? "border-[#B65E3C] bg-[#B65E3C] text-[#EFE5D2] shadow-sm font-bold scale-[1.02]"
                        : "border-[#D8CBB2] bg-white/70 hover:bg-white text-[#20211D] hover:border-[#B65E3C]/60"
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.name}</span>
                    <span className="font-devanagari text-[10px] opacity-70">
                      ({tag.devanagari})
                    </span>
                    {isSelected && <Check className="w-3 h-3 ml-1 text-[#EFE5D2]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-20 px-5 sm:px-8 py-4 bg-[#FAF4E8]/95 backdrop-blur-md border-t border-[#D8CBB2] flex items-center justify-between gap-4">
          <div className="text-xs text-[#20211D]/70 hidden sm:block">
            {isDirty() ? (
              <span className="text-[#B65E3C] font-semibold flex items-center gap-1">
                ● Unsaved changes
              </span>
            ) : (
              <span className="text-emerald-800 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> All preferences up to date
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2.5 rounded-xl border border-[#D8CBB2] bg-white/80 hover:bg-white text-xs font-bold text-[#20211D] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-[#7B4D36]/20 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <span>Save Preferences</span>
                  <span className="font-devanagari text-[10px] lowercase opacity-80">सहेजें</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Discard Changes Confirmation Dialog */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-50 bg-[#173B32]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#FAF4E8] rounded-2xl p-6 max-w-sm w-full border border-[#D8CBB2] shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#B65E3C]/10 text-[#B65E3C]">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-[#173B32]">
                    Discard Unsaved Changes?
                  </h4>
                  <p className="text-xs text-[#20211D]/75 mt-1 leading-relaxed">
                    You have edited your travel preferences. If you close now without saving, these modifications will be lost.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB2] text-xs font-semibold text-[#20211D] hover:bg-white"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-[#EFE5D2] text-xs font-bold uppercase tracking-wider"
                >
                  Discard & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
