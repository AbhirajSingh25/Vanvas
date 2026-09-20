"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api } from "@/lib/api";
import { UserStats, Place, TripSummary } from "@/types";
import {
  User as UserIcon, Settings as SettingsIcon, Bookmark, Calendar,
  Sparkles, MapPin, Compass, Edit3, CheckCircle2, AlertCircle,
  ExternalLink, Trash2, Shield, Heart, Utensils, Car, Trees,
  Clock, ArrowRight, X, RefreshCw, Camera, Upload, Image as ImageIcon
} from "lucide-react";
import { TravelStamp } from "@/components/ui/TravelStamp";

function ProfileContent() {
  const { user, updateProfile, uploadAvatar, deleteAvatar } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "saved" ? "saved" : "overview";

  const [activeTab, setActiveTab] = useState<"overview" | "saved" | "trips" | "persona">(
    initialTab === "saved" ? "saved" : "overview"
  );

  // Real backend data states
  const [stats, setStats] = useState<UserStats | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load real statistics, saved places, and trips
  const loadProfileData = async () => {
    setLoadingData(true);
    try {
      const [statsData, placesData, tripsData] = await Promise.all([
        api.getProfileStats().catch(() => null),
        api.getSavedPlaces().catch(() => []),
        api.getTrips().catch(() => []),
      ]);
      if (statsData) setStats(statsData);
      setSavedPlaces(placesData);
      setTrips(tripsData);
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const openEditModal = () => {
    if (user) {
      setEditName(user.full_name);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setRemoveAvatarRequested(false);
      setProfileSaveError(null);
      setProfileSaveSuccess(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditModalOpen(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setProfileSaveError("Please select a JPG, PNG, or WebP image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileSaveError("Selected photo exceeds the 5 MB limit. Please choose a smaller photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreview = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(newPreview);
    setRemoveAvatarRequested(false);
    setProfileSaveError(null);
  };

  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveAvatarRequested(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setProfileSaveError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileSaveError("Display name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveError(null);

    try {
      if (selectedFile) {
        await uploadAvatar(selectedFile);
      } else if (removeAvatarRequested) {
        await deleteAvatar();
      }

      if (editName.trim() !== user?.full_name) {
        await updateProfile({
          full_name: editName.trim(),
        });
      }

      setProfileSaveSuccess(true);
      setAvatarLoadFailed(false);
      setTimeout(() => {
        setEditModalOpen(false);
        setProfileSaveSuccess(false);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setSelectedFile(null);
        setRemoveAvatarRequested(false);
      }, 1000);
    } catch (err: any) {
      setProfileSaveError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemoveSavedPlace = async (placeId: string, placeName: string) => {
    try {
      await api.toggleSavePlace(placeId);
      setSavedPlaces((prev) => prev.filter((p) => p.id !== placeId));
      if (stats) {
        setStats({
          ...stats,
          saved_places_count: Math.max(0, stats.saved_places_count - 1),
        });
      }
    } catch (err) {
      console.error(`Failed to remove saved place ${placeName}:`, err);
    }
  };

  const formatMemberDate = (dateStr?: string) => {
    if (!dateStr) return "Himalayan Explorer";
    try {
      const d = new Date(dateStr);
      return `Member since ${d.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    } catch {
      return "Member since 2026";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "V";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const prefs = user?.preferences || {};

  return (
    <div className="min-h-screen bg-[#FAF4E8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header Card */}
        <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          {/* Subtle Decorative Background Stamp */}
          <div className="absolute top-4 right-4 opacity-15 pointer-events-none hidden sm:block">
            <TravelStamp label="HIMALAYAS" sublabel="SORTED CLUB" variant="forest" rotate={-5} />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar with gold ring & initials fallback */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#173B32] text-[#EFE5D2] flex items-center justify-center font-serif text-2xl sm:text-3xl font-bold border-3 border-[#B49252] shadow-inner overflow-hidden">
                  {user?.avatar_url && !avatarLoadFailed ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    <span>{getInitials(user?.full_name)}</span>
                  )}
                </div>
              </div>

              {/* User Identity Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                    {user?.full_name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#173B32]/10 border border-[#173B32]/20 text-[10px] font-bold text-[#173B32] uppercase tracking-wider">
                    <Shield className="w-3 h-3 text-[#B49252]" />
                    <span>{user?.role === "admin" ? "Admin" : "Verified Traveler"}</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#20211D]/70 font-medium">
                  {user?.email}
                </p>
                <div className="flex items-center gap-3 text-xs text-[#B49252] font-semibold pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatMemberDate(user?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={openEditModal}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#173B32] hover:bg-[#E5D5BA]/50 transition-colors shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Edit Profile</span>
              </button>
              <Link
                href="/settings"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors shadow-xs"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Real Travel Snapshot Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#B49252] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#20211D]/70">Saved Places</span>
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
              {loadingData ? "—" : (stats?.saved_places_count ?? savedPlaces.length)}
            </div>
            <div className="text-[11px] text-[#20211D]/60 mt-1">Curated gems & cafés</div>
          </div>

          <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#B49252] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#20211D]/70">Expeditions</span>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
              {loadingData ? "—" : (stats?.saved_trips_count ?? trips.length)}
            </div>
            <div className="text-[11px] text-[#20211D]/60 mt-1">Total planned & active trips</div>
          </div>

          <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#B49252] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#20211D]/70">Upcoming</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#B65E3C]">
              {loadingData ? "—" : (stats?.upcoming_trips_count ?? trips.filter(t => new Date(t.start_date) >= new Date()).length)}
            </div>
            <div className="text-[11px] text-[#20211D]/60 mt-1">Departing soon</div>
          </div>

          <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#B49252] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#20211D]/70">Completed</span>
              <Compass className="w-4 h-4" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
              {loadingData ? "—" : (stats?.completed_trips_count ?? 0)}
            </div>
            <div className="text-[11px] text-[#20211D]/60 mt-1">Conquered Himalayan trails</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#D8CBB2] pb-1 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Persona", icon: UserIcon },
            { id: "saved", label: `Saved Places (${savedPlaces.length})`, icon: Bookmark },
            { id: "trips", label: `Expeditions (${trips.length})`, icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#173B32] text-[#EFE5D2] shadow-sm"
                    : "text-[#20211D]/70 hover:text-[#173B32] hover:bg-[#E5D5BA]/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#B49252]" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview & Persona */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Travel Preferences Card */}
            <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8CBB2]/60">
                <div className="flex items-center gap-2 text-[#173B32] font-serif font-bold text-base">
                  <Trees className="w-4 h-4 text-[#B49252]" />
                  <span>Travel DNA & Persona</span>
                </div>
                <Link
                  href="/settings"
                  className="text-xs font-bold text-[#B65E3C] hover:underline flex items-center gap-1"
                >
                  <span>Customize</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#D8CBB2]/60">
                  <span className="text-[10px] text-[#20211D]/60 uppercase font-bold tracking-wider block mb-1">Travel Style</span>
                  <span className="font-bold text-[#173B32]">{prefs.preferred_travel_style || "Balanced"}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#D8CBB2]/60">
                  <span className="text-[10px] text-[#20211D]/60 uppercase font-bold tracking-wider block mb-1">Pace & Intensity</span>
                  <span className="font-bold text-[#173B32]">{prefs.activity_intensity || "Balanced"}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#D8CBB2]/60">
                  <span className="text-[10px] text-[#20211D]/60 uppercase font-bold tracking-wider block mb-1">Dietary Preference</span>
                  <span className="font-bold text-[#173B32]">{prefs.dietary_preference || "All"}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#D8CBB2]/60">
                  <span className="text-[10px] text-[#20211D]/60 uppercase font-bold tracking-wider block mb-1">Transport Style</span>
                  <span className="font-bold text-[#173B32]">{prefs.transport_preference || "Volvo Bus"}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-[#20211D]/60 uppercase font-bold tracking-wider block mb-2">Favorite Interests</span>
                <div className="flex flex-wrap gap-1.5">
                  {(prefs.interests || "Nature,Cafés,Adventure,Food").split(",").map((tag) => (
                    <span
                      key={tag.trim()}
                      className="px-2.5 py-1 rounded-full bg-[#E5D5BA]/60 text-[11px] font-semibold text-[#173B32] border border-[#D8CBB2]"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Copilot Integration Card */}
            <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8CBB2]/60">
                <div className="flex items-center gap-2 text-[#173B32] font-serif font-bold text-base">
                  <Sparkles className="w-4 h-4 text-[#B49252]" />
                  <span>Gemini Copilot Context</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[10px] font-bold text-[#173B32] uppercase">
                  {prefs.ai_copilot_enabled !== false ? "Active" : "Disabled"}
                </span>
              </div>

              <p className="text-xs text-[#20211D]/80 leading-relaxed">
                VANVAS utilizes your saved preferences to autonomously tailor mountain itineraries, discover hidden streams, and recommend authentic local food spots.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-[#D8CBB2]/40">
                  <span className="text-[#20211D]/70">Personalized Recommendations</span>
                  <span className="font-bold text-[#173B32]">{prefs.ai_personalized_recommendations !== false ? "Enabled" : "Off"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#D8CBB2]/40">
                  <span className="text-[#20211D]/70">Display Currency</span>
                  <span className="font-bold text-[#173B32]">{prefs.currency || "INR"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#20211D]/70">Location Privacy</span>
                  <span className="font-bold text-[#173B32]">
                    {prefs.location_mode === "never" ? "Don't use location" : prefs.location_mode === "while_using" ? "While Using" : "Ask Every Time"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Saved Places */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {savedPlaces.length === 0 ? (
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-12 text-center space-y-3">
                <Bookmark className="w-10 h-10 text-[#B49252] mx-auto opacity-60" />
                <h3 className="font-serif text-lg font-bold text-[#173B32]">No saved places yet</h3>
                <p className="text-xs text-[#20211D]/70 max-w-md mx-auto">
                  Browse destinations in Himachal, Uttarakhand, and Ladakh to bookmark your favorite riverside stays, heritage cafés, and viewpoints.
                </p>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173B32] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider hover:bg-[#20453B] transition-colors mt-2"
                >
                  <Compass className="w-4 h-4 text-[#B49252]" />
                  <span>Explore Destinations</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-4 shadow-xs flex flex-col justify-between group hover:border-[#173B32] transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#E5D5BA] text-[10px] font-bold text-[#173B32] uppercase tracking-wider">
                          {place.category || "Attraction"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSavedPlace(place.id, place.name)}
                          className="p-1 rounded-lg text-[#20211D]/40 hover:text-[#B65E3C] hover:bg-[#B65E3C]/10 transition-colors"
                          title="Remove from saved collection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-serif font-bold text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors line-clamp-1">
                        {place.name}
                      </h4>
                      <p className="text-xs text-[#20211D]/70 line-clamp-2 mt-1">
                        {place.description || "Scenic mountain attraction recommended by VANVAS."}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#D8CBB2]/50 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#B49252]">{place.price_level || "₹₹"}</span>
                      <Link
                        href={`/explore/${place.destination_id}`}
                        className="inline-flex items-center gap-1 font-bold text-[#173B32] hover:text-[#B65E3C]"
                      >
                        <span>View Destination</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Trips */}
        {activeTab === "trips" && (
          <div className="space-y-4">
            {trips.length === 0 ? (
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-12 text-center space-y-3">
                <Calendar className="w-10 h-10 text-[#B49252] mx-auto opacity-60" />
                <h3 className="font-serif text-lg font-bold text-[#173B32]">No active expeditions</h3>
                <p className="text-xs text-[#20211D]/70 max-w-md mx-auto">
                  Ready to head into the mountains? Create an AI-crafted multi-day itinerary in seconds with VANVAS.
                </p>
                <Link
                  href="/plan"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B65E3C] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider hover:bg-[#9E4D2E] transition-colors mt-2"
                >
                  <Sparkles className="w-4 h-4 text-[#EFE5D2]" />
                  <span>Plan My Trip</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#173B32] hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#173B32]/10 text-[10px] font-bold text-[#173B32] uppercase tracking-wider">
                          {trip.destination_name || "Mountain Journey"}
                        </span>
                        <span className="text-xs text-[#B49252] font-semibold">
                          {trip.num_days} Days
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-lg text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                        {trip.title}
                      </h4>
                    </div>

                    <div className="pt-3 mt-4 border-t border-[#D8CBB2]/50 flex items-center justify-between text-xs text-[#20211D]/70">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#B49252]" />
                        {new Date(trip.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(trip.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="font-bold text-[#173B32] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Trip</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-[#20211D]/60 hover:text-[#173B32] hover:bg-[#E5D5BA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="font-serif text-xl font-bold text-[#173B32]">
                Edit Traveler Profile
              </h3>
              <p className="text-xs text-[#20211D]/70 mt-1">
                Update your identity details shown on group expeditions and travel passports.
              </p>
            </div>

            {profileSaveError && (
              <div className="mb-4 p-3 rounded-xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 text-xs text-[#7B4D36] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B65E3C]" />
                <span>{profileSaveError}</span>
              </div>
            )}

            {profileSaveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-[#173B32]/10 border border-[#173B32]/30 text-xs text-[#173B32] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#173B32]" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-sm text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden"
                />
              </div>

              {/* Profile Photo Upload Section */}
              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white border border-[#D8CBB2]/80 shadow-xs">
                  {/* Circular Avatar Preview */}
                  <div className="relative w-16 h-16 rounded-full bg-[#173B32] text-[#EFE5D2] flex items-center justify-center font-serif text-xl font-bold border-2 border-[#B49252] overflow-hidden shrink-0 shadow-inner">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Selected Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : !removeAvatarRequested && user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span>{getInitials(editName || user?.full_name)}</span>
                    )}
                  </div>

                  {/* Actions & Description */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="vanvas-profile-photo-input"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF4E8] hover:bg-[#E5D5BA]/70 border border-[#D8CBB2] text-xs font-bold text-[#173B32] transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#B49252]" />
                        <span>{previewUrl || (!removeAvatarRequested && user?.avatar_url) ? "Change Photo" : "Upload Photo"}</span>
                      </button>

                      {(previewUrl || (!removeAvatarRequested && user?.avatar_url)) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-[#20211D]/60 flex items-center gap-1">
                      <span>JPG, PNG or WebP · Max 5 MB</span>
                    </div>
                    <div className="text-[10px] text-[#20211D]/40">
                      Auto-cropped square and optimized for Himalayan travel stamps.
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-[#E5D5BA]/30 text-sm text-[#20211D]/60 cursor-not-allowed"
                />
                <span className="text-[10px] text-[#7B4D36] mt-1 block italic">
                  Email address is verified as your primary account identifier and cannot be changed without email verification infrastructure.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#20211D]/70 hover:bg-[#E5D5BA]/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {isSavingProfile && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#173B32] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </ProtectedRoute>
  );
}
