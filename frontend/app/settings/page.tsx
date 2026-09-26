"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api, resolveAvatarUrl } from "@/lib/api";
import { UserPreferences, PasswordChangePayload } from "@/types";
import {
  User, Compass, Globe, DollarSign, Bell, MapPin, Sparkles,
  Sun, Moon, Shield, Lock, Download, Trash2, CheckCircle2,
  AlertCircle, RefreshCw, ChevronRight, LogOut, Heart, Utensils,
  Car, Users, Clock, Info, Check, Eye, EyeOff, Camera, Upload
} from "lucide-react";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user, logout, updateProfile, updatePreferences, changePassword, deleteAccount, exportData, uploadAvatar, deleteAvatar } = useAuth();

  const [activeSection, setActiveSection] = useState<
    "account" | "travel" | "food" | "language" | "currency" | "notifications" | "location" | "copilot" | "appearance" | "privacy" | "security" | "about"
  >("travel");

  // State for all settings
  const [travelStyle, setTravelStyle] = useState("Balanced");
  const [pace, setPace] = useState("Balanced");
  const [budgetStyle, setBudgetStyle] = useState("Balanced");
  const [transport, setTransport] = useState("Volvo Bus");
  const [companion, setCompanion] = useState("Solo");
  const [interests, setInterests] = useState<string[]>(["Nature", "Cafés", "Adventure", "Food"]);
  const [dietary, setDietary] = useState("All");
  const [language, setLanguage] = useState("en");
  const [region, setRegion] = useState("India");
  const [currency, setCurrency] = useState("INR");
  const [theme, setTheme] = useState("system");
  const [locationMode, setLocationMode] = useState("ask_every_time");

  // Notifications
  const [notifyReminders, setNotifyReminders] = useState(true);
  const [notifyChanges, setNotifyChanges] = useState(true);
  const [notifyBookings, setNotifyBookings] = useState(true);
  const [notifySuggestions, setNotifySuggestions] = useState(true);
  const [notifyCopilot, setNotifyCopilot] = useState(false);
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(false);

  // AI & Copilot
  const [copilotEnabled, setCopilotEnabled] = useState(true);
  const [personalizedRecs, setPersonalizedRecs] = useState(true);
  const [useTravelPrefs, setUseTravelPrefs] = useState(true);
  const [useTripContext, setUseTripContext] = useState(true);

  // UX & Async Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Export & Delete Modals
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Avatar Upload States (Phase 10)
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setAvatarError("Please select a JPG, PNG, or WebP image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Selected image exceeds 5 MB limit. Please choose a smaller photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setAvatarLoading(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    try {
      await uploadAvatar(file);
      setAvatarSuccess("Profile photo updated and saved!");
      setTimeout(() => setAvatarSuccess(null), 3000);
    } catch (err: any) {
      setAvatarError(err.message || "Failed to upload profile photo.");
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    setAvatarLoading(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    try {
      await deleteAvatar();
      setAvatarSuccess("Profile photo removed.");
      setTimeout(() => setAvatarSuccess(null), 3000);
    } catch (err: any) {
      setAvatarError(err.message || "Failed to remove profile photo.");
    } finally {
      setAvatarLoading(false);
    }
  };

  // Initialize from user preferences
  useEffect(() => {
    if (user) {
      const p = user.preferences || {};
      setTravelStyle(p.preferred_travel_style || "Balanced");
      setPace(p.activity_intensity || "Balanced");
      setBudgetStyle(p.preferred_travel_style || "Balanced");
      setTransport(p.transport_preference || "Volvo Bus");
      setCompanion(p.companion_style || "Solo");
      setInterests(p.interests ? p.interests.split(",").map(s => s.trim()).filter(Boolean) : ["Nature", "Cafés", "Adventure", "Food"]);
      setDietary(p.dietary_preference || "All");
      setLanguage(p.language || "en");
      setRegion(p.region || "India");
      setCurrency(p.currency || "INR");
      setTheme(p.theme || "system");
      setLocationMode(p.location_mode || "ask_every_time");
      setNotifyReminders(p.notify_trip_reminders !== false);
      setNotifyChanges(p.notify_trip_changes !== false);
      setNotifyBookings(p.notify_booking_updates !== false);
      setNotifySuggestions(p.notify_suggestions !== false);
      setNotifyCopilot(!!p.notify_copilot_updates);
      setNotifyAnnouncements(!!p.notify_announcements);
      setCopilotEnabled(p.ai_copilot_enabled !== false);
      setPersonalizedRecs(p.ai_personalized_recommendations !== false);
      setUseTravelPrefs(p.ai_use_travel_preferences !== false);
      setUseTripContext(p.ai_use_trip_context !== false);
    }
  }, [user]);

  // Apply Theme Preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        // System preference
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    }
  }, [theme]);

  const handleToggleInterest = (tag: string) => {
    setInterests(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const payload: Partial<UserPreferences> = {
      preferred_travel_style: travelStyle,
      activity_intensity: pace,
      transport_preference: transport,
      companion_style: companion,
      interests: interests.join(","),
      dietary_preference: dietary,
      language,
      region,
      currency,
      theme,
      location_mode: locationMode,
      notify_trip_reminders: notifyReminders,
      notify_trip_changes: notifyChanges,
      notify_booking_updates: notifyBookings,
      notify_suggestions: notifySuggestions,
      notify_copilot_updates: notifyCopilot,
      notify_announcements: notifyAnnouncements,
      ai_copilot_enabled: copilotEnabled,
      ai_personalized_recommendations: personalizedRecs,
      ai_use_travel_preferences: useTravelPrefs,
      ai_use_trip_context: useTripContext,
    };

    try {
      await updatePreferences(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || "Failed to persist settings. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPasswordSuccess(res.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password. Ensure current password is correct.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const exportBundle = await exportData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportBundle, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `vanvas_user_data_${user?.id || "export"}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert("Failed to export data: " + (err.message || "Please try again later."));
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    setDeleteLoading(true);

    try {
      await deleteAccount(deletePassword || undefined);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account. Ensure password is correct.");
      setDeleteLoading(false);
    }
  };

  const sections = [
    { id: "travel", label: "Travel DNA", icon: Compass },
    { id: "food", label: "Food & Dietary", icon: Utensils },
    { id: "language", label: "Language & Region", icon: Globe },
    { id: "currency", label: "Currency", icon: DollarSign },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "location", label: "Location & Privacy", icon: MapPin },
    { id: "copilot", label: "AI & Copilot", icon: Sparkles },
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "privacy", label: "Data & Privacy", icon: Download },
    { id: "security", label: "Security & Password", icon: Lock },
    { id: "account", label: "Account Overview", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FAF4E8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#D8CBB2]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B49252]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalization Layer</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#173B32] mt-1">
              Account & Travel Settings
            </h1>
          </div>

          {/* Sticky Save Action */}
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#173B32] animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-[#173B32]" />
                <span>Preferences Saved</span>
              </span>
            )}
            {saveError && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#B65E3C] animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-[#B65E3C]" />
                <span>Error Saving</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveAllSettings}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#173B32] text-xs font-bold uppercase tracking-wider text-[#EFE5D2] hover:bg-[#20453B] transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-[#B49252]" />
              )}
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

        {/* Settings Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Section Navigation Sidebar */}
          <nav className="md:col-span-4 lg:col-span-3 space-y-1">
            <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-2 shadow-xs space-y-1">
              {sections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id as any)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-[#173B32] text-[#EFE5D2] font-bold shadow-xs"
                        : "text-[#20211D]/80 hover:bg-[#E5D5BA]/60 hover:text-[#173B32]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#B49252]" : "text-[#20211D]/60"}`} />
                      <span>{sec.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#B49252]" />}
                  </button>
                );
              })}
            </div>

            {/* Quick Sign Out Card in Sidebar */}
            <div className="pt-2">
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#B65E3C] hover:bg-[#B65E3C]/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </nav>

          {/* Section Detail Content Panels */}
          <main className="md:col-span-8 lg:col-span-9">
            <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
              {/* Section 1: Travel DNA */}
              {activeSection === "travel" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Travel DNA & Style
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Configure your travel rhythm. VANVAS uses these parameters when generating dynamic multi-day mountain routes.
                    </p>
                  </div>

                  {/* Travel Style */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                      Travel Style
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Relaxed", "Balanced", "Packed"].map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setTravelStyle(style)}
                          className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                            travelStyle === style
                              ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                              : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Transport */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                      Preferred Transport
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {["Volvo Bus", "Self-Drive 4x4", "Walking", "Cab / Taxi", "Train", "Rental Scooter", "Public Transport", "Mixed"].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTransport(mode)}
                          className={`py-2.5 px-3 rounded-xl font-semibold border transition-all text-center cursor-pointer ${
                            transport === mode
                              ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                              : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Companion Style */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                      Companion Style
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {["Solo", "Couple", "Friends", "Family", "Mixed"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCompanion(c)}
                          className={`py-2.5 px-3 rounded-xl font-semibold border transition-all text-center cursor-pointer ${
                            companion === c
                              ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                              : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interests Multi-Select */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                      Trip Interests & Exploration Focus
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Nature", "Culture & Heritage", "Food", "Adventure",
                        "Spiritual", "Nightlife", "Shopping", "Scenic Viewpoints",
                        "Riverside Cafés", "Glacier Trails"
                      ].map((tag) => {
                        const isSelected = interests.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleInterest(tag)}
                            className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-[#B65E3C] text-[#EFE5D2] border-[#7B4D36]/40 shadow-xs"
                                : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-[#EFE5D2]" />}
                            <span>{tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Food & Dietary */}
              {activeSection === "food" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Food & Dietary Preferences
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      VANVAS filters culinary stops, mountain dhabas, and artisan cafés based on your dietary guidelines.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                      Dietary Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: "Veg", label: "Vegetarian", desc: "Pure vegetarian spots & dhabas" },
                        { id: "Non-Veg", label: "Non-Vegetarian", desc: "Includes local meat specialties" },
                        { id: "Vegan", label: "Vegan", desc: "Plant-based dining options" },
                        { id: "All", label: "No Preference", desc: "Show all culinary gems" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDietary(item.id)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            dietary === item.id
                              ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                              : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                          }`}
                        >
                          <div className="font-bold text-sm mb-1">{item.label}</div>
                          <div className={`text-[11px] ${dietary === item.id ? "text-[#EFE5D2]/70" : "text-[#20211D]/60"}`}>
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Language & Region */}
              {activeSection === "language" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Language & Regional Focus
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Choose preferred script and regional destination ecosystem.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-2">
                        Interface Language
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-w-md">
                        <button
                          type="button"
                          onClick={() => setLanguage("en")}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            language === "en"
                              ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                              : "bg-white text-[#20211D] border-[#D8CBB2]"
                          }`}
                        >
                          <div className="font-bold text-sm">English</div>
                          <div className="text-[11px] opacity-70">Primary editorial layout</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage("hi")}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            language === "hi"
                              ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32]"
                              : "bg-white text-[#20211D] border-[#D8CBB2]"
                          }`}
                        >
                          <div className="font-bold text-sm font-devanagari">हिन्दी (Hindi)</div>
                          <div className="text-[11px] opacity-70">Devanagari annotations</div>
                        </button>
                      </div>
                      <span className="text-[11px] text-[#20211D]/60 mt-2 block">
                        VANVAS incorporates bilingual Devanagari headings and cultural place descriptors. Full translation coverage is expanding.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-2">
                        Region Focus
                      </label>
                      <div className="p-3.5 rounded-2xl bg-white border border-[#D8CBB2] max-w-md text-xs font-bold text-[#173B32]">
                        India (Himachal, Uttarakhand, Ladakh & Kashmir)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Currency */}
              {activeSection === "currency" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Display Currency
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Select your preferred display currency for estimated costs and budget tracking.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { code: "INR", symbol: "₹", name: "Indian Rupee" },
                      { code: "USD", symbol: "$", name: "US Dollar" },
                      { code: "EUR", symbol: "€", name: "Euro" },
                      { code: "GBP", symbol: "£", name: "British Pound" }
                    ].map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => setCurrency(curr.code)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          currency === curr.code
                            ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                            : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                        }`}
                      >
                        <div className="font-serif text-lg font-bold">{curr.symbol} {curr.code}</div>
                        <div className={`text-[11px] ${currency === curr.code ? "text-[#EFE5D2]/70" : "text-[#20211D]/60"}`}>
                          {curr.name}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-[#E5D5BA]/40 border border-[#D8CBB2] text-xs text-[#20211D]/80 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#B49252] shrink-0 mt-0.5" />
                    <div>
                      <strong>Provider Currency Notice:</strong> Live partner accommodations and bookings (Amadeus, StayingAPI) execute checkout transactions in the native currency required by the host provider.
                    </div>
                  </div>
                </div>
              )}

              {/* Section 5: Notifications */}
              {activeSection === "notifications" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Notification Preferences
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Choose which travel updates and expedition suggestions you wish to receive.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: "reminders", label: "Trip Reminders", desc: "Weather alerts, morning departure briefs, and trail tips", val: notifyReminders, setVal: setNotifyReminders },
                      { id: "changes", label: "Trip Schedule Changes", desc: "Group voting updates and itinerary adjustments", val: notifyChanges, setVal: setNotifyChanges },
                      { id: "bookings", label: "Stay & Travel Updates", desc: "Live booking confirmations and status changes", val: notifyBookings, setVal: setNotifyBookings },
                      { id: "suggestions", label: "Smart Route Suggestions", desc: "AI recommendations for nearby hidden spots", val: notifySuggestions, setVal: setNotifySuggestions },
                      { id: "announcements", label: "Product & Destination Releases", desc: "New curated regions in Ladakh and Kashmir", val: notifyAnnouncements, setVal: setNotifyAnnouncements },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#D8CBB2]/70"
                      >
                        <div>
                          <div className="font-bold text-xs text-[#173B32]">{item.label}</div>
                          <div className="text-[11px] text-[#20211D]/60 mt-0.5">{item.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => item.setVal(!item.val)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                            item.val ? "bg-[#173B32]" : "bg-[#D8CBB2]"
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              item.val ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#E5D5BA]/40 border border-[#D8CBB2] text-[11px] text-[#20211D]/70 italic">
                    Notification preferences are persisted to your account. Active email/push delivery pipelines will trigger as scheduled.
                  </div>
                </div>
              )}

              {/* Section 6: Location & Privacy */}
              {activeSection === "location" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Location & Exploration Privacy
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Control how VANVAS handles your device location for nearby trails and cafes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: "ask_every_time", title: "Ask Every Time", desc: "Request location access only when opening Nearby Search" },
                      { id: "while_using", title: "Use While Using VANVAS", desc: "Automatically compute proximity to mountain attractions" },
                      { id: "never", title: "Don't Use Location", desc: "Manual destination search only without GPS geolocation" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setLocationMode(mode.id)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          locationMode === mode.id
                            ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                            : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{mode.title}</div>
                          <div className={`text-[11px] ${locationMode === mode.id ? "text-[#EFE5D2]/70" : "text-[#20211D]/60"}`}>
                            {mode.desc}
                          </div>
                        </div>
                        {locationMode === mode.id && <Check className="w-4 h-4 text-[#B49252]" />}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#D8CBB2] space-y-2 text-xs text-[#20211D]/80">
                    <strong className="text-[#173B32]">Privacy Commitment:</strong>
                    <p className="text-[11px] leading-relaxed">
                      VANVAS never tracks or sells your background location. Geolocation coordinates are evaluated locally for distance calculations to verified Himalayan places.
                    </p>
                  </div>
                </div>
              )}

              {/* Section 7: AI & Copilot */}
              {activeSection === "copilot" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      AI Copilot & Travel Intelligence
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Configure your Gemini travel assistant preferences.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#D8CBB2]/70">
                      <div>
                        <div className="font-bold text-xs text-[#173B32]">Enable AI Copilot</div>
                        <div className="text-[11px] text-[#20211D]/60 mt-0.5">Activate Gemini autonomous replanning & chat assistant</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCopilotEnabled(!copilotEnabled)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          copilotEnabled ? "bg-[#173B32]" : "bg-[#D8CBB2]"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            copilotEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#D8CBB2]/70">
                      <div>
                        <div className="font-bold text-xs text-[#173B32]">Use Saved Travel Preferences</div>
                        <div className="text-[11px] text-[#20211D]/60 mt-0.5">Allow Copilot to incorporate your pace, dietary, and transport styles</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUseTravelPrefs(!useTravelPrefs)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          useTravelPrefs ? "bg-[#173B32]" : "bg-[#D8CBB2]"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            useTravelPrefs ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#D8CBB2]/70">
                      <div>
                        <div className="font-bold text-xs text-[#173B32]">Trip Context Awareness</div>
                        <div className="text-[11px] text-[#20211D]/60 mt-0.5">Allow Copilot to reference active trip members and itinerary timeline</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUseTripContext(!useTripContext)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          useTripContext ? "bg-[#173B32]" : "bg-[#D8CBB2]"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            useTripContext ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#E5D5BA]/40 border border-[#D8CBB2] text-xs text-[#20211D]/80">
                    <strong>Runtime Architecture:</strong> VANVAS AI runs on Google Gemini (Flash Lite runtime). Your private travel logs are never used to train public models.
                  </div>
                </div>
              )}

              {/* Section 8: Appearance */}
              {activeSection === "appearance" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Appearance & Theme
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Customize visual presentation while preserving the VANVAS travel-journal aesthetic.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "light", label: "Light (Cream)", icon: Sun },
                      { id: "dark", label: "Night Camp (Dark)", icon: Moon },
                      { id: "system", label: "System Sync", icon: Globe },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSel = theme === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTheme(item.id)}
                          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                            isSel
                              ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                              : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSel ? "text-[#B49252]" : "text-[#20211D]/70"}`} />
                          <span className="font-bold text-xs">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 9: Data & Privacy */}
              {activeSection === "privacy" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Personal Data & Export
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Download a complete copy of your personal travel logs, itineraries, saved gems, and reviews.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#D8CBB2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-[#173B32]">Export Travel Data (JSON)</div>
                      <div className="text-[11px] text-[#20211D]/60 max-w-md">
                        Includes your complete account profile, travel preferences, all created expeditions, saved places, and authored reviews.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={exportLoading}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors shadow-xs disabled:opacity-60 cursor-pointer shrink-0"
                    >
                      {exportLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-[#B49252]" />
                      )}
                      <span>Export My Data</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Section 10: Security & Password */}
              {activeSection === "security" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Security & Password
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Manage your password and active login session.
                    </p>
                  </div>

                  {passwordSuccess && (
                    <div className="p-3.5 rounded-2xl bg-[#173B32]/10 border border-[#173B32]/30 text-xs text-[#173B32] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#173B32]" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-3.5 rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 text-xs text-[#7B4D36] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#B65E3C]" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                        Current Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-sm text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                        New Password (min 6 chars)
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-sm text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-sm text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-xs text-[#173B32] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? "Hide Passwords" : "Show Passwords"}</span>
                      </button>

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="px-5 py-2.5 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-xs"
                      >
                        {passwordLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Update Password</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Section 11: Account Overview & Deletion */}
              {activeSection === "account" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-[#D8CBB2]/60 pb-4">
                    <h2 className="font-serif text-xl font-bold text-[#173B32]">
                      Account Overview
                    </h2>
                    <p className="text-xs text-[#20211D]/70 mt-1">
                      Manage account identity, session credentials, and permanent account deactivation.
                    </p>
                  </div>

                  {/* Profile Photo & Avatar Management (Phase 10) */}
                  <div className="p-5 rounded-2xl bg-white border border-[#D8CBB2] space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full bg-[#173B32] text-[#EFE5D2] flex items-center justify-center font-serif font-bold text-xl border-2 border-[#B49252] overflow-hidden shadow-sm shrink-0">
                          {user?.avatar_url ? (
                            <img
                              src={resolveAvatarUrl(user.avatar_url)}
                              alt={user.full_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span>{user?.full_name?.charAt(0).toUpperCase() || "V"}</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="font-bold text-sm text-[#173B32]">
                            Profile Photo / Avatar
                          </div>
                          <p className="text-[11px] text-[#20211D]/60 max-w-sm">
                            JPG, PNG, or WebP. Max 5 MB. Appears in navigation, journey logs, and account records.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarFileSelect}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={avatarLoading}
                          className="px-4 py-2 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                        >
                          {avatarLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-[#B49252]" />
                          )}
                          <span>Upload Photo</span>
                        </button>

                        {user?.avatar_url && (
                          <button
                            type="button"
                            onClick={handleAvatarDelete}
                            disabled={avatarLoading}
                            className="px-3 py-2 rounded-xl bg-[#B65E3C]/10 text-[#B65E3C] hover:bg-[#B65E3C]/20 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {avatarSuccess && (
                      <div className="p-3 rounded-xl bg-[#173B32]/10 border border-[#173B32]/30 text-xs text-[#173B32] flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-[#173B32]" />
                        <span>{avatarSuccess}</span>
                      </div>
                    )}

                    {avatarError && (
                      <div className="p-3 rounded-xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 text-xs text-[#7B4D36] flex items-center gap-2 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-[#B65E3C]" />
                        <span>{avatarError}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#D8CBB2] space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-[#D8CBB2]/40">
                      <span className="text-[#20211D]/70 font-medium">Display Name</span>
                      <span className="font-bold text-[#173B32]">{user?.full_name}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-[#D8CBB2]/40">
                      <span className="text-[#20211D]/70 font-medium">Email Address</span>
                      <span className="font-bold text-[#173B32]">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-[#D8CBB2]/40">
                      <span className="text-[#20211D]/70 font-medium">Account ID</span>
                      <span className="font-mono text-[11px] text-[#20211D]/60">{user?.id}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[#20211D]/70 font-medium">Role</span>
                      <span className="font-bold text-[#173B32] uppercase text-[11px]">{user?.role}</span>
                    </div>
                  </div>

                  {/* Danger Zone: Account Deletion */}
                  <div className="pt-4 border-t border-[#B65E3C]/30 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#B65E3C]">
                      Danger Zone
                    </div>
                    <div className="p-5 rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-xs text-[#7B4D36]">Delete Account & Travel Data</div>
                        <div className="text-[11px] text-[#7B4D36]/80 mt-0.5">
                          Permanently removes your account, personal travel DNA, itineraries, and bookmarks. This action cannot be reversed.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-[#B65E3C] text-xs font-bold text-[#EFE5D2] hover:bg-[#9E4D2E] transition-colors shrink-0 shadow-xs cursor-pointer"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#B65E3C]/10 text-[#B65E3C] flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-xl font-bold text-[#173B32]">
              Permanently Delete Account?
            </h3>
            <p className="text-xs text-[#20211D]/80 leading-relaxed">
              This will permanently erase your user profile (<span className="font-bold">{user?.email}</span>), all created expeditions, saved places, and travel preferences.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 text-xs text-[#7B4D36] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#B65E3C]" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                  Confirm Password (Optional)
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-sm text-[#20211D] focus:ring-2 focus:ring-[#B65E3C] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#20211D]/70 hover:bg-[#E5D5BA]/50 transition-colors"
                >
                  Keep Account
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#B65E3C] text-xs font-bold text-[#EFE5D2] hover:bg-[#9E4D2E] transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {deleteLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Permanent Deletion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
