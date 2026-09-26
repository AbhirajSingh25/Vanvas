"use client";

import React, { useState, useEffect } from "react";
import {
  Users, Compass, Footprints, Shield, Sparkles, Check, CheckCircle2,
  AlertCircle, RefreshCw, MapPin, Eye, EyeOff
} from "lucide-react";
import { SoloTravelerProfile } from "@/types";
import { api } from "@/lib/api";

export function SoloSettingsTab() {
  const [profile, setProfile] = useState<SoloTravelerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [travelMode, setTravelMode] = useState<"SOLO" | "GROUP" | "COUPLE">("SOLO");
  const [isEnabled, setIsEnabled] = useState(true);
  const [discoverBeforeTrip, setDiscoverBeforeTrip] = useState(true);
  const [discoverWhenHere, setDiscoverWhenHere] = useState(true);
  const [preferredGroupSize, setPreferredGroupSize] = useState(4);
  const [travelStyle, setTravelStyle] = useState("Balanced");
  const [trekPace, setTrekPace] = useState("Moderate");
  const [interests, setInterests] = useState("Trekking,Cafés,Photography,Local Culture");
  const [bio, setBio] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getSoloProfile();
      setProfile(data);
      setTravelMode(data.travel_mode || "SOLO");
      setIsEnabled(data.is_enabled !== false);
      setDiscoverBeforeTrip(data.discover_before_trip !== false);
      setDiscoverWhenHere(data.discover_when_here !== false);
      setPreferredGroupSize(data.preferred_group_size || 4);
      setTravelStyle(data.travel_style || "Balanced");
      setTrekPace(data.trek_pace || "Moderate");
      setInterests(data.interests || "Trekking,Cafés,Photography,Local Culture");
      setBio(data.bio || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const updated = await api.updateSoloProfile({
        travel_mode: travelMode,
        is_enabled: isEnabled,
        discover_before_trip: discoverBeforeTrip,
        discover_when_here: discoverWhenHere,
        preferred_group_size: preferredGroupSize,
        travel_style: travelStyle,
        trek_pace: trekPace,
        interests,
        bio: bio.trim(),
      });
      setProfile(updated);
      setSuccessMsg("Solo Traveler profile and discovery settings saved!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update solo settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-2">
        <RefreshCw className="w-6 h-6 text-[#B49252] animate-spin mx-auto" />
        <p className="text-xs text-[#20211D]/70">Loading solo traveler profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#173B32] flex items-center justify-center text-[#B49252]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#173B32]">
              Solo Traveler Circles & Discovery Mode
            </h3>
            <p className="text-xs text-[#20211D]/70">
              Customize how you discover fellow solo travelers across Himalayan destinations, treks, and nearby spots.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Travel Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block">
            Current Travel Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "SOLO", label: "Solo Explorer", icon: Compass },
              { id: "GROUP", label: "Group Travel", icon: Users },
              { id: "COUPLE", label: "Couple Stays", icon: Sparkles },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = travelMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTravelMode(mode.id as any)}
                  className={`p-4 rounded-2xl border transition-all text-center space-y-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#173B32] text-[#FAF4E8] border-[#173B32] shadow-sm"
                      : "bg-white border-[#D8CBB2] text-[#20211D] hover:bg-[#E5D5BA]/40"
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto ${isSelected ? "text-[#B49252]" : "text-[#173B32]"}`} />
                  <div className="text-xs font-bold">{mode.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Discovery Toggles */}
        <div className="space-y-3 pt-4 border-t border-[#D8CBB2]/60">
          <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block">
            Discovery Preferences
          </label>

          <div className="space-y-2">
            {/* Enable Solo Discovery */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#D8CBB2] cursor-pointer hover:bg-[#E5D5BA]/20 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#173B32] block">
                  Enable Solo Discovery
                </span>
                <span className="text-[11px] text-[#20211D]/70 block">
                  Allow other solo travelers with matching dates/destinations to discover your profile card.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#173B32]"
              />
            </label>

            {/* Discover Before Trip */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#D8CBB2] cursor-pointer hover:bg-[#E5D5BA]/20 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#173B32] block">
                  Discover Before Trip
                </span>
                <span className="text-[11px] text-[#20211D]/70 block">
                  Appear on destination and trek expedition pages for future planning dates.
                </span>
              </div>
              <input
                type="checkbox"
                checked={discoverBeforeTrip}
                onChange={(e) => setDiscoverBeforeTrip(e.target.checked)}
                className="w-4 h-4 accent-[#173B32]"
              />
            </label>

            {/* Discover When Here */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#D8CBB2] cursor-pointer hover:bg-[#E5D5BA]/20 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#173B32] block">
                  Discover When Here (Nearby GPS)
                </span>
                <span className="text-[11px] text-[#20211D]/70 block">
                  Appear under Nearby Solo Travelers when in the same town (exact coordinates remain private).
                </span>
              </div>
              <input
                type="checkbox"
                checked={discoverWhenHere}
                onChange={(e) => setDiscoverWhenHere(e.target.checked)}
                className="w-4 h-4 accent-[#173B32]"
              />
            </label>
          </div>
        </div>

        {/* Travel Style & Trek Pace */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#D8CBB2]/60">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
              Travel Style
            </label>
            <select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-[#D8CBB2] bg-white font-medium focus:outline-none"
            >
              <option value="Balanced">Balanced (Culture & Cafes)</option>
              <option value="Budget">Budget Backpacking</option>
              <option value="Adventure">Adventure & Trekking</option>
              <option value="Comfort">Comfort & Boutique</option>
              <option value="Slow Travel">Slow Travel & Quiet Trails</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
              Trek Pace
            </label>
            <select
              value={trekPace}
              onChange={(e) => setTrekPace(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-[#D8CBB2] bg-white font-medium focus:outline-none"
            >
              <option value="Leisurely">Leisurely (Photography & Frequent Breaks)</option>
              <option value="Moderate">Moderate (Steady Alpine Rhythm)</option>
              <option value="Fast">Fast (High-Endurance Ridge Trekking)</option>
            </select>
          </div>
        </div>

        {/* Group Size Slider */}
        <div className="space-y-2 pt-4 border-t border-[#D8CBB2]/60">
          <div className="flex items-center justify-between text-xs font-bold text-[#173B32]">
            <span className="uppercase tracking-wider text-[11px]">Preferred Circle Group Size</span>
            <span className="text-[#E05A2B]">{preferredGroupSize} Travelers</span>
          </div>
          <input
            type="range"
            min={2}
            max={8}
            value={preferredGroupSize}
            onChange={(e) => setPreferredGroupSize(parseInt(e.target.value))}
            className="w-full accent-[#E05A2B]"
          />
        </div>

        {/* Short Bio */}
        <div className="space-y-1 pt-4 border-t border-[#D8CBB2]/60">
          <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
            Short Solo Bio / Travel Note
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Introduce your travel vibe: e.g. Early riser exploring Himalayan bakeries, sunset viewpoints, and serene cedar trails..."
            className="w-full text-xs p-3 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none resize-none h-20"
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-60"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-[#B49252]" />}
            <span>{saving ? "Saving Changes..." : "Save Solo Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
