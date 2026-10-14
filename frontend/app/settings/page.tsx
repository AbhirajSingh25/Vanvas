"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserPreferences, PasswordChangePayload } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import {
  User, Compass, Globe, DollarSign, Bell, MapPin, Sparkles,
  Sun, Moon, Shield, Lock, Download, Trash2, CheckCircle2,
  AlertCircle, RefreshCw, ChevronRight, ChevronLeft, LogOut, Heart, Utensils,
  Car, Users, Clock, Info, Check, Eye, EyeOff, Camera, ArrowRight,
  Brain, SlidersHorizontal, Layers, CheckSquare
} from "lucide-react";
import { SoloSettingsTab } from "@/components/solo/SoloSettingsTab";
import { TravellerMemoryTab } from "@/components/memory/TravellerMemoryTab";
import { useTheme } from "@/context/ThemeContext";
import { useDensity } from "@/context/DensityContext";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#173B32] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </ProtectedRoute>
  );
}

type SettingsSectionId =
  | "account"
  | "travel"
  | "memory"
  | "solo"
  | "food"
  | "language"
  | "currency"
  | "notifications"
  | "location"
  | "copilot"
  | "appearance"
  | "privacy"
  | "security";

interface CategoryGroup {
  groupTitle: string;
  items: Array<{
    id: SettingsSectionId;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

function SettingsContent() {
  const { user, logout, updatePreferences, changePassword, deleteAccount, exportData } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { density, setDensity } = useDensity();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sectionParam = searchParams.get("section") as SettingsSectionId | null;

  // Active section for desktop (always has a section selected)
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(() => {
    return sectionParam || "travel";
  });

  // Mobile active section (null = Settings Hub Index; string = focused Detail Screen)
  const [mobileSection, setMobileSection] = useState<SettingsSectionId | null>(() => {
    return sectionParam || null;
  });

  // Keep state synchronized with URL query parameter for browser & Android back navigation
  useEffect(() => {
    if (sectionParam) {
      setActiveSection(sectionParam);
      setMobileSection(sectionParam);
    } else {
      setMobileSection(null);
    }
  }, [sectionParam]);

  // Form State: Travel DNA
  const [travelStyle, setTravelStyle] = useState("Balanced");
  const [pace, setPace] = useState("Balanced");
  const [budgetStyle, setBudgetStyle] = useState("Balanced / Moderate");
  const [transport, setTransport] = useState("Volvo Bus");
  const [companion, setCompanion] = useState("Solo");
  const [interests, setInterests] = useState<string[]>(["Nature", "Cafés", "Adventure", "Food"]);

  // Food & Dietary
  const [dietary, setDietary] = useState("All");

  // Regional & Localization
  const [language, setLanguage] = useState("en");
  const [region, setRegion] = useState("India (Himachal, Uttarakhand, Ladakh & Kashmir)");
  const [currency, setCurrency] = useState("INR");

  // Location & Privacy
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

  // UX & Async Status per section
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [sectionSuccess, setSectionSuccess] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);

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
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Initialize from user preferences on load/change
  useEffect(() => {
    if (user) {
      const p = user.preferences || {};
      setTravelStyle(p.preferred_travel_style || "Balanced");
      setPace(p.activity_intensity || "Balanced");
      setBudgetStyle(p.preferred_travel_style || "Balanced / Moderate");
      setTransport(p.transport_preference || "Volvo Bus");
      setCompanion(p.companion_style || "Solo");
      setInterests(
        p.interests
          ? p.interests.split(",").map((s) => s.trim()).filter(Boolean)
          : ["Nature", "Cafés", "Adventure", "Food"]
      );
      setDietary(p.dietary_preference || "All");
      setLanguage(p.language || "en");
      setRegion(p.region || "India (Himachal, Uttarakhand, Ladakh & Kashmir)");
      setCurrency(p.currency || "INR");
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

  // Navigation handlers
  const handleSelectSection = (sectionId: SettingsSectionId) => {
    setActiveSection(sectionId);
    setMobileSection(sectionId);
    setSectionSuccess(null);
    setSectionError(null);
    router.push(`/settings?section=${sectionId}`);
  };

  const handleBackToSettingsIndex = () => {
    setMobileSection(null);
    setSectionSuccess(null);
    setSectionError(null);
    router.push("/settings");
  };

  const handleToggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Section-specific save handler
  const handleSaveSection = async (sectionKey: string, payload: Partial<UserPreferences>) => {
    setSavingSection(sectionKey);
    setSectionError(null);
    setSectionSuccess(null);

    try {
      await updatePreferences(payload);
      setSectionSuccess("Preferences saved successfully!");
      setTimeout(() => setSectionSuccess(null), 3000);
    } catch (err: any) {
      setSectionError(err.message || "Failed to persist preferences. Please retry.");
    } finally {
      setSavingSection(null);
    }
  };

  // Password Change
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
      setPasswordError(err.message || "Failed to change password. Verify your current password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Export Data
  const handleExportData = async () => {
    setExportLoading(true);
    setExportError(null);
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
      setExportError("Failed to export data: " + (err.message || "Please try again later."));
    } finally {
      setExportLoading(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    setDeleteLoading(true);

    try {
      await deleteAccount(deletePassword || undefined);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account. Ensure your password is correct.");
      setDeleteLoading(false);
    }
  };

  // 3 Clear Groups of Settings Categories
  const categoryGroups: CategoryGroup[] = useMemo(() => [
    {
      groupTitle: "Account",
      items: [
        {
          id: "account",
          label: "Profile & Identity",
          description: user?.full_name ? `${user.full_name} (${user.email})` : "Identity & session credentials",
          icon: User,
        },
        {
          id: "security",
          label: "Security & Password",
          description: "Password reset and active authentication",
          icon: Lock,
        },
        {
          id: "privacy",
          label: "Data & Privacy",
          description: "Download travel archives or erase account data",
          icon: Download,
        },
      ],
    },
    {
      groupTitle: "Travel Preferences",
      items: [
        {
          id: "travel",
          label: "Travel DNA & Rhythm",
          description: `${travelStyle} • ${pace} Pace • ${transport}`,
          icon: Compass,
          badge: travelStyle,
        },
        {
          id: "food",
          label: "Food & Dietary",
          description: `${dietary} • Culinary stop recommendations`,
          icon: Utensils,
          badge: dietary,
        },
        {
          id: "solo",
          label: "Solo & Circles",
          description: "Solo radar discovery & verified traveler circles",
          icon: Users,
        },
      ],
    },
    {
      groupTitle: "App Experience",
      items: [
        {
          id: "appearance",
          label: "Appearance & Density",
          description: `${theme === "dark" ? "Night Camp (Dark)" : "Forest Day"} • ${density === "compact" ? "Compact Layout" : "Original Layout"}`,
          icon: Sun,
          badge: density === "compact" ? "Compact" : "Original",
        },
        {
          id: "language",
          label: "Language, Region & Currency",
          description: `${language.toUpperCase()} • ${currency} (₹)`,
          icon: Globe,
        },
        {
          id: "notifications",
          label: "Notifications",
          description: "Trip alerts, weather briefs, and Copilot updates",
          icon: Bell,
        },
        {
          id: "location",
          label: "Location Permissions",
          description: locationMode === "never" ? "Location disabled" : "GPS proximity & nearby spots",
          icon: MapPin,
        },
        {
          id: "copilot",
          label: "AI & Copilot",
          description: copilotEnabled ? "Gemini active assistant" : "Copilot disabled",
          icon: Sparkles,
        },
        {
          id: "memory",
          label: "Traveller Memory",
          description: "Learned preferences & expedition context",
          icon: Brain,
        },
      ],
    },
  ], [user, travelStyle, pace, transport, dietary, theme, density, language, currency, locationMode, copilotEnabled]);

  // Active section metadata helper
  const currentSectionMeta = useMemo(() => {
    for (const group of categoryGroups) {
      const found = group.items.find((item) => item.id === (mobileSection || activeSection));
      if (found) return found;
    }
    return categoryGroups[0].items[0];
  }, [categoryGroups, mobileSection, activeSection]);

  return (
    <div className="min-h-screen bg-[#FAF4E8] py-4 sm:py-8 lg:py-12 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ======================================================== */}
        {/* DESKTOP HEADER (>= md)                                   */}
        {/* ======================================================== */}
        <div className="hidden md:flex items-center justify-between pb-4 border-b border-[#D8CBB2]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B49252]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalization Layer</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#173B32] mt-1">
              Account &amp; Travel Settings
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#173B32] hover:bg-[#E5D5BA]/50 transition-colors shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-[#B49252]" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE VIEW: SETTINGS INDEX (when mobileSection === null)*/}
        {/* ======================================================== */}
        <div className="md:hidden">
          {mobileSection === null ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Mobile Settings Hub Title */}
              <div className="pb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B49252]">
                  VANVAS EXPEDITION CONTROL
                </span>
                <h1 className="font-serif text-2xl font-bold text-[#173B32]">
                  Settings Hub
                </h1>
                <p className="text-xs text-[#7B4D36]">
                  Personalize your mountain journeys, travel DNA, and device preferences.
                </p>
              </div>

              {/* Account Summary Hub Card */}
              <div className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-4 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar user={user} size="lg" showBorder borderColor="border-[#B49252]" />
                    <div className="min-w-0">
                      <div className="font-serif font-bold text-base text-[#173B32] truncate">
                        {user?.full_name || "Traveler"}
                      </div>
                      <div className="text-xs text-[#7B4D36] truncate">
                        {user?.email}
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>Profile</span>
                    <ArrowRight className="w-3 h-3 text-[#B49252]" />
                  </Link>
                </div>

                {/* Appearance & Density Quick Summary */}
                <div className="pt-2.5 border-t border-[#D8CBB2]/60 flex items-center justify-between text-xs">
                  <span className="text-[#7B4D36] font-mono text-[11px] uppercase tracking-wider">
                    VIEW &amp; THEME
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectSection("appearance")}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFE5D2] text-[#173B32] font-semibold text-[11px] hover:bg-[#E5D5BA] cursor-pointer"
                  >
                    <span>{density === "compact" ? "Compact" : "Original"}</span>
                    <span>•</span>
                    <span>{theme === "dark" ? "Night Camp" : "Forest Day"}</span>
                    <ChevronRight className="w-3 h-3 text-[#B49252]" />
                  </button>
                </div>
              </div>

              {/* Grouped Category Index */}
              {categoryGroups.map((group) => (
                <div key={group.groupTitle} className="space-y-1.5">
                  <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7B4D36] px-2 pt-1">
                    {group.groupTitle}
                  </h2>

                  <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl overflow-hidden shadow-2xs divide-y divide-[#D8CBB2]/60">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSection(item.id)}
                          className="w-full flex items-center justify-between p-3.5 text-left active:bg-[#E5D5BA]/60 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-xl bg-[#173B32]/10 text-[#173B32] flex items-center justify-center shrink-0 group-hover:bg-[#173B32] group-hover:text-[#FAF4E8] transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-serif font-bold text-xs text-[#173B32] truncate">
                                {item.label}
                              </div>
                              <div className="text-[11px] text-[#7B4D36] truncate">
                                {item.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 text-[#B49252]">
                            {item.badge && (
                              <span className="hidden xs:inline-block px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[9.5px] font-bold text-[#173B32]">
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-[#B49252]" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Mobile Sign Out Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#B65E3C] hover:bg-[#B65E3C]/10 active:scale-98 transition-all cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-[#B65E3C]" />
                  <span>Sign Out of VANVAS</span>
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* MOBILE VIEW: FOCUSED DETAIL SCREEN                      */
            /* ======================================================== */
            <div className="space-y-4 animate-fadeIn">
              {/* Back to Settings Header Bar */}
              <div className="flex items-center justify-between gap-2 pb-2">
                <button
                  type="button"
                  onClick={handleBackToSettingsIndex}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#173B32] active:scale-95 transition-all shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-[#173B32]" />
                  <span>Settings Hub</span>
                </button>

                <span className="text-[11px] font-mono font-bold text-[#B49252] uppercase tracking-wider truncate">
                  {currentSectionMeta.label}
                </span>
              </div>

              {/* Section Detail Content Container */}
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
                {renderSectionContent(mobileSection)}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* DESKTOP VIEW: MASTER-DETAIL SIDEBAR + MAIN PANEL (>= md) */}
        {/* ======================================================== */}
        <div className="hidden md:grid md:grid-cols-12 gap-8">
          {/* Master Navigation Sidebar */}
          <nav className="md:col-span-4 lg:col-span-3 space-y-4">
            {categoryGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36] px-2 block">
                  {group.groupTitle}
                </span>
                <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-1.5 shadow-2xs space-y-0.5">
                  {group.items.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        id={`settings-nav-${sec.id}`}
                        type="button"
                        onClick={() => handleSelectSection(sec.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                          isActive
                            ? "bg-[#173B32] text-[#EFE5D2] font-bold shadow-xs"
                            : "text-[#20211D]/80 hover:bg-[#E5D5BA]/60 hover:text-[#173B32]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#B49252]" : "text-[#20211D]/60"}`} />
                          <span className="truncate">{sec.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#B49252] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Desktop Sign Out */}
            <div className="pt-2">
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#B65E3C] hover:bg-[#B65E3C]/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>

          {/* Active Detail Panel */}
          <main className="md:col-span-8 lg:col-span-9">
            <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
              {renderSectionContent(activeSection)}
            </div>
          </main>
        </div>

      </div>

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
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
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-sm text-[#20211D] focus:ring-2 focus:ring-[#B65E3C] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#20211D]/70 hover:bg-[#E5D5BA]/50 transition-colors cursor-pointer"
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

  // ========================================================
  // RENDER SECTION CONTENT COMPONENT
  // ========================================================
  function renderSectionContent(section: SettingsSectionId) {
    switch (section) {
      case "travel":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#173B32]">
                  Travel DNA &amp; Rhythm
                </h2>
                <p className="text-xs text-[#20211D]/70 mt-0.5">
                  Configure your travel rhythm for dynamic mountain routes and day trips.
                </p>
              </div>

              {renderSaveButton("travel", {
                preferred_travel_style: budgetStyle,
                activity_intensity: pace,
                transport_preference: transport,
                companion_style: companion,
                interests: interests.join(","),
              })}
            </div>

            {/* Travel Pace */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                Pace &amp; Intensity
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "Relaxed", desc: "Leisurely mornings, long café breaks" },
                  { id: "Balanced", desc: "Curated sightseeing with rest hours" },
                  { id: "Packed", desc: "First light till nightfall expeditions" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPace(item.id)}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all text-left cursor-pointer flex flex-col justify-between ${
                      pace === item.id
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                        : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                    }`}
                  >
                    <span>{item.id}</span>
                    <span className={`text-[10px] font-normal mt-1 leading-tight ${pace === item.id ? "text-[#EFE5D2]/75" : "text-[#7B4D36]"}`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Tier (wired to budgetStyle) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                Budget Style &amp; Accommodations
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "Backpacker / Student", label: "Backpacker (₹)", desc: "Hostels, dhabas & buses" },
                  { id: "Balanced / Moderate", label: "Moderate (₹₹)", desc: "Homestays, boutique cafés" },
                  { id: "Boutique / Premium", label: "Boutique (₹₹₹)", desc: "Heritage resorts, private 4x4" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBudgetStyle(item.id)}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all text-left cursor-pointer flex flex-col justify-between ${
                      budgetStyle === item.id
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                        : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`text-[10px] font-normal mt-1 leading-tight ${budgetStyle === item.id ? "text-[#EFE5D2]/75" : "text-[#7B4D36]"}`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Transport */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                Preferred Transport Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {["Volvo Bus", "Self-Drive 4x4", "Walking", "Cab / Taxi", "Train", "Rental Scooter", "Public Transport", "Mixed"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTransport(mode)}
                    className={`py-2 px-3 rounded-xl font-semibold border transition-all text-center cursor-pointer ${
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
                    className={`py-2 px-3 rounded-xl font-semibold border transition-all text-center cursor-pointer ${
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
                Trip Interests &amp; Focus
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
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
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
        );

      case "food":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#173B32]">
                  Food &amp; Dietary Preferences
                </h2>
                <p className="text-xs text-[#20211D]/70 mt-0.5">
                  Filters culinary stops, mountain dhabas, and cafés across all route plans.
                </p>
              </div>

              {renderSaveButton("food", { dietary_preference: dietary })}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                Dietary Guideline
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "Veg", label: "Vegetarian", desc: "Pure vegetarian spots & highway dhabas" },
                  { id: "Non-Veg", label: "Non-Vegetarian", desc: "Includes mountain trout & local mutton/chicken specialties" },
                  { id: "Vegan", label: "Vegan", desc: "Plant-based dining & dairy-free cafés" },
                  { id: "All", label: "No Preference", desc: "Show all verified culinary stops" }
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
                    <div className={`text-[11px] ${dietary === item.id ? "text-[#EFE5D2]/75" : "text-[#7B4D36]"}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "solo":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
                <Users className="w-3.5 h-3.5" />
                <span>Fellowship &amp; Safety</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[#173B32] mt-0.5">
                Solo Traveler &amp; Circles Discovery
              </h2>
              <p className="text-xs text-[#20211D]/70 mt-0.5">
                Manage how you appear to verified solo travelers with overlapping itineraries. Your exact GPS coordinates are never disclosed.
              </p>
            </div>
            <SoloSettingsTab />
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3">
              <h2 className="font-serif text-xl font-bold text-[#173B32]">
                Appearance &amp; Layout Density
              </h2>
              <p className="text-xs text-[#20211D]/70 mt-0.5">
                Preferences apply immediately across all application views and persist to your account.
              </p>
            </div>

            {/* Theme Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                Color Palette &amp; Theme
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "light",
                    label: "Light (Forest Day)",
                    desc: "Warm parchment cream, forest green & terracotta accents",
                    icon: Sun,
                  },
                  {
                    id: "dark",
                    label: "Night Camp (Dark)",
                    desc: "Deep Himalayan pine mist & dark camp glow",
                    icon: Moon,
                  },
                  {
                    id: "system",
                    label: "System Sync",
                    desc: `Matches OS setting (${resolvedTheme === "dark" ? "Night Camp" : "Light"})`,
                    icon: Globe,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTheme(item.id as any);
                        updatePreferences({ theme: item.id }).catch(() => {});
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md ring-2 ring-[#B49252]/50"
                          : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <Icon className={`w-5 h-5 ${isSel ? "text-[#B49252]" : "text-[#173B32]"}`} />
                        {isSel && (
                          <span className="px-2 py-0.5 rounded-full bg-[#B49252]/30 text-[9.5px] font-bold text-[#FAF7F0] uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{item.label}</div>
                        <div className={`text-[11px] mt-0.5 leading-snug ${isSel ? "text-[#EFE5D2]/80" : "text-[#7B4D36]"}`}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout Density Setting */}
            <div className="pt-4 border-t border-[#D8CBB2]/60 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                  Layout Density (लेआउट घनत्व)
                </label>
                <p className="text-xs text-[#7B4D36] mt-0.5">
                  Adjust information density and card spacing across all travel surfaces.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    id: "original",
                    title: "Original",
                    subtitle: "Immersive Editorial Layout",
                    desc: "Generous margins, full narrative breathing room, and immersive travel journal cards.",
                    tag: "Comfortable",
                  },
                  {
                    id: "compact",
                    title: "Compact",
                    subtitle: "Information-Dense Catalogue",
                    desc: "Tighter section gaps, compact headers, and higher information visibility without long scrolling.",
                    tag: "High Density",
                  },
                ].map((item) => {
                  const isSel = density === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`density-setting-${item.id}`}
                      type="button"
                      onClick={() => {
                        setDensity(item.id as any);
                        updatePreferences({ layout_density: item.id as any }).catch(() => {});
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md ring-2 ring-[#B49252]/50"
                          : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${
                          isSel ? "bg-[#B49252] text-[#173B32]" : "bg-[#E5D5BA] text-[#173B32]"
                        }`}>
                          {item.tag}
                        </span>
                        {isSel && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[#B49252]">
                            <Check className="w-3.5 h-3.5 text-[#B49252]" />
                            <span>Selected</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-serif font-bold text-base">{item.title}</div>
                        <div className={`text-xs font-semibold ${isSel ? "text-[#B49252]" : "text-[#B65E3C]"}`}>
                          {item.subtitle}
                        </div>
                        <div className={`text-[11px] mt-1 leading-relaxed ${isSel ? "text-[#EFE5D2]/80" : "text-[#20211D]/70"}`}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#E5D5BA]/40 border border-[#D8CBB2] text-xs text-[#20211D]/80 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#B49252] shrink-0 mt-0.5" />
              <div>
                <strong>Global Control:</strong> You can also switch layout density from the top bar on any page across the entire application using the View button.
              </div>
            </div>
          </div>
        );

      case "language":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#173B32]">
                  Language, Region &amp; Currency
                </h2>
                <p className="text-xs text-[#20211D]/70 mt-0.5">
                  Configure interface language, geographic corridor focus, and display currency.
                </p>
              </div>

              {renderSaveButton("language", { language, region, currency })}
            </div>

            <div className="space-y-4">
              {/* Language */}
              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-2">
                  Content &amp; Interface Language
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {[
                    { code: "en", label: "English", sub: "Standard editorial layout" },
                    { code: "hi", label: "हिन्दी (Hindi)", sub: "Bilingual Devanagari labels" },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        language === l.code
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                          : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                      }`}
                    >
                      <div className="font-bold text-sm">{l.label}</div>
                      <div className={`text-[10.5px] ${language === l.code ? "text-[#EFE5D2]/75" : "text-[#7B4D36]"}`}>
                        {l.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Region Selector (working region state) */}
              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-2">
                  Regional Focus Area
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-xs font-bold text-[#173B32] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden cursor-pointer"
                >
                  <option value="India (Himachal, Uttarakhand, Ladakh & Kashmir)">
                    Northern Himalayas (Himachal, Uttarakhand, Ladakh, Kashmir)
                  </option>
                  <option value="Pan-India Mountain Corridors">
                    Pan-India Mountain &amp; Hill Sanctuaries
                  </option>
                  <option value="Western Ghats & Coastal India">
                    Western Ghats, Goa &amp; Coastal Trails
                  </option>
                  <option value="All India Heritage & Wild Sanctuaries">
                    All India Heritage &amp; Wilderness
                  </option>
                </select>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-2">
                  Display Currency (अनुमानित मुद्रा)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { code: "INR", symbol: "₹", name: "Indian Rupee" },
                    { code: "USD", symbol: "$", name: "US Dollar" },
                    { code: "EUR", symbol: "€", name: "Euro" },
                    { code: "GBP", symbol: "£", name: "British Pound" },
                  ].map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setCurrency(curr.code)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        currency === curr.code
                          ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-xs"
                          : "bg-white text-[#20211D] border-[#D8CBB2] hover:bg-[#E5D5BA]/40"
                      }`}
                    >
                      <div className="font-serif text-base font-bold">{curr.symbol} {curr.code}</div>
                      <div className={`text-[10px] ${currency === curr.code ? "text-[#EFE5D2]/75" : "text-[#7B4D36]"}`}>
                        {curr.name}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[10.5px] text-[#7B4D36] mt-2">
                  * Note: Partner hotel checkouts are processed in the host provider&apos;s native currency.
                </p>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#173B32]">
                  Notification Preferences
                </h2>
                <p className="text-xs text-[#20211D]/70 mt-0.5">
                  Select which updates and expedition alerts VANVAS may send to your device.
                </p>
              </div>

              {renderSaveButton("notifications", {
                notify_trip_reminders: notifyReminders,
                notify_trip_changes: notifyChanges,
                notify_booking_updates: notifyBookings,
                notify_suggestions: notifySuggestions,
                notify_copilot_updates: notifyCopilot,
                notify_announcements: notifyAnnouncements,
              })}
            </div>

            <div className="space-y-2.5">
              {[
                { id: "reminders", label: "Trip Reminders", desc: "Weather advisories, departure alerts & trail guides", val: notifyReminders, setVal: setNotifyReminders },
                { id: "changes", label: "Schedule Changes", desc: "Group voting updates and collaborative plan modifications", val: notifyChanges, setVal: setNotifyChanges },
                { id: "bookings", label: "Stay & Travel Updates", desc: "Live booking confirmations and status alerts", val: notifyBookings, setVal: setNotifyBookings },
                { id: "suggestions", label: "Smart Route Suggestions", desc: "Hidden gems and scenic detours near your route", val: notifySuggestions, setVal: setNotifySuggestions },
                { id: "copilot", label: "VANVAS Copilot Updates", desc: "Proactive AI alerts when optimal weather or road detours are identified", val: notifyCopilot, setVal: setNotifyCopilot },
                { id: "announcements", label: "Destination & Release Notes", desc: "New curated mountain valleys and seasonal trail openings", val: notifyAnnouncements, setVal: setNotifyAnnouncements },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#D8CBB2]/70"
                >
                  <div className="pr-3 min-w-0">
                    <div className="font-bold text-xs text-[#173B32]">{item.label}</div>
                    <div className="text-[11px] text-[#7B4D36] mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.val}
                    onClick={() => item.setVal(!item.val)}
                    className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
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
          </div>
        );

      case "location":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#173B32]">
                  Location &amp; Exploration Privacy
                </h2>
                <p className="text-xs text-[#20211D]/70 mt-0.5">
                  Control when VANVAS accesses your device GPS for nearby trails and cafés.
                </p>
              </div>

              {renderSaveButton("location", { location_mode: locationMode })}
            </div>

            <div className="space-y-3">
              {[
                { id: "ask_every_time", title: "Ask Every Time", desc: "Request location access only when opening Nearby Search" },
                { id: "while_using", title: "Use While Using VANVAS", desc: "Automatically compute proximity to mountain attractions and dhabas" },
                { id: "never", title: "Don't Use Location", desc: "Manual destination exploration only without GPS coordinates" },
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
                    <div className={`text-[11px] mt-0.5 ${locationMode === mode.id ? "text-[#EFE5D2]/75" : "text-[#7B4D36]"}`}>
                      {mode.desc}
                    </div>
                  </div>
                  {locationMode === mode.id && <Check className="w-4 h-4 text-[#B49252]" />}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#D8CBB2] space-y-1.5 text-xs text-[#20211D]/80">
              <strong className="text-[#173B32]">Privacy Standard:</strong>
              <p className="text-[11px] leading-relaxed text-[#7B4D36]">
                VANVAS never tracks or sells background location coordinates. GPS measurements are calculated locally to compute distances to verified trails and viewpoints.
              </p>
            </div>
          </div>
        );

      case "copilot":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#173B32]">
                  AI Copilot &amp; Travel Intelligence
                </h2>
                <p className="text-xs text-[#20211D]/70 mt-0.5">
                  Configure your Gemini travel assistant and personalization bounds.
                </p>
              </div>

              {renderSaveButton("copilot", {
                ai_copilot_enabled: copilotEnabled,
                ai_personalized_recommendations: personalizedRecs,
                ai_use_travel_preferences: useTravelPrefs,
                ai_use_trip_context: useTripContext,
              })}
            </div>

            <div className="space-y-2.5">
              {[
                { id: "copilot", label: "Enable AI Copilot", desc: "Activate Gemini autonomous replanning & conversational assistant", val: copilotEnabled, setVal: setCopilotEnabled },
                { id: "recs", label: "Personalized Recommendations", desc: "Allow Copilot to tailor suggested spots based on your travel history", val: personalizedRecs, setVal: setPersonalizedRecs },
                { id: "prefs", label: "Use Saved Travel DNA", desc: "Allow Copilot to incorporate your pace, dietary, and transport styles", val: useTravelPrefs, setVal: setUseTravelPrefs },
                { id: "context", label: "Trip Context Awareness", desc: "Allow Copilot to reference active trip itinerary dates and fellow travelers", val: useTripContext, setVal: setUseTripContext },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#D8CBB2]/70"
                >
                  <div className="pr-3 min-w-0">
                    <div className="font-bold text-xs text-[#173B32]">{item.label}</div>
                    <div className="text-[11px] text-[#7B4D36] mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.val}
                    onClick={() => item.setVal(!item.val)}
                    className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
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

            <div className="p-3.5 rounded-2xl bg-[#E5D5BA]/40 border border-[#D8CBB2] text-xs text-[#20211D]/80">
              <strong>Runtime Architecture:</strong> VANVAS AI runs on Google Gemini. Private travel logs are never used to train external foundational models.
            </div>
          </div>
        );

      case "memory":
        return (
          <div className="space-y-6 animate-fadeIn">
            <TravellerMemoryTab />
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3">
              <h2 className="font-serif text-xl font-bold text-[#173B32]">
                Personal Data &amp; Export
              </h2>
              <p className="text-xs text-[#20211D]/70 mt-0.5">
                Download a complete copy of your personal travel logs, itineraries, saved gems, and reviews.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#D8CBB2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-xs text-[#173B32]">Export Travel Data (JSON Archive)</div>
                <div className="text-[11px] text-[#7B4D36] max-w-md">
                  Includes your account profile, travel preferences, all created expeditions, saved places, and authored reviews.
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

            {exportError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{exportError}</span>
              </div>
            )}
          </div>
        );

      case "security":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3">
              <h2 className="font-serif text-xl font-bold text-[#173B32]">
                Security &amp; Password
              </h2>
              <p className="text-xs text-[#20211D]/70 mt-0.5">
                Update your account password and secure your authentication session.
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
                  New Password (min 6 characters)
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
        );

      case "account":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#D8CBB2]/60 pb-3">
              <h2 className="font-serif text-xl font-bold text-[#173B32]">
                Profile &amp; Identity Overview
              </h2>
              <p className="text-xs text-[#20211D]/70 mt-0.5">
                Manage your traveler profile, display credentials, and permanent account deactivation.
              </p>
            </div>

            {/* Profile Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#D8CBB2] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar user={user} size="xl" showBorder borderColor="border-[#B49252]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-bold text-[#173B32]">
                        {user?.full_name || "Traveler"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[10px] font-mono font-bold text-[#173B32] uppercase">
                        {user?.avatar_type === "uploaded" ? "Custom Photo" : (user?.avatar_preset || "himalayan-explorer")}
                      </span>
                    </div>
                    <p className="text-xs text-[#7B4D36] mt-0.5">
                      Avatar cropping and traveler presets are managed in your Travel Profile.
                    </p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors shadow-xs shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>Open Profile Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Account Details */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#D8CBB2] space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#D8CBB2]/40">
                <span className="text-[#7B4D36] font-medium">Display Name</span>
                <span className="font-bold text-[#173B32]">{user?.full_name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#D8CBB2]/40">
                <span className="text-[#7B4D36] font-medium">Email Address</span>
                <span className="font-bold text-[#173B32]">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#D8CBB2]/40">
                <span className="text-[#7B4D36] font-medium">Account ID</span>
                <span className="font-mono text-[11px] text-[#20211D]/60">{user?.id}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#7B4D36] font-medium">Role</span>
                <span className="font-bold text-[#173B32] uppercase text-[11px]">{user?.role}</span>
              </div>
            </div>

            {/* Danger Zone: Account Deletion */}
            <div className="pt-4 border-t border-[#B65E3C]/30 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B65E3C]">
                Danger Zone
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-xs text-[#7B4D36]">Delete Account &amp; Travel Logs</div>
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
        );

      default:
        return null;
    }
  }

  // ========================================================
  // REUSABLE SECTION SAVE BUTTON COMPONENT
  // ========================================================
  function renderSaveButton(sectionKey: string, payload: Partial<UserPreferences>) {
    const isSaving = savingSection === sectionKey;
    const hasSuccess = sectionSuccess !== null && savingSection === null;
    const hasError = sectionError !== null;

    return (
      <div className="flex items-center gap-2 shrink-0">
        {hasSuccess && (
          <span className="flex items-center gap-1 text-xs font-bold text-[#173B32] animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#173B32]" />
            <span>Saved</span>
          </span>
        )}
        {hasError && (
          <span className="flex items-center gap-1 text-xs font-bold text-[#B65E3C] animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 text-[#B65E3C]" />
            <span>Error</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => handleSaveSection(sectionKey, payload)}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173B32] text-xs font-bold uppercase tracking-wider text-[#EFE5D2] hover:bg-[#20453B] transition-all shadow-xs active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {isSaving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5 text-[#B49252]" />
          )}
          <span>Save Changes</span>
        </button>
      </div>
    );
  }
}
