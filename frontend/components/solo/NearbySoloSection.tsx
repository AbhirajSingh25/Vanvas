"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Sparkles, MapPin, Compass, Calendar, ArrowRight,
  Plus, CheckCircle2, AlertCircle, RefreshCw, Shield, Footprints,
  Clock, Navigation, UserPlus
} from "lucide-react";
import { SoloTravelerCard, TravelCircle } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { TravelerDetailModal } from "@/components/solo/TravelerDetailModal";
import { CreateCircleModal } from "@/components/circles/CreateCircleModal";
import { CircleDetailModal } from "@/components/circles/CircleDetailModal";
import { api } from "@/lib/api";

interface NearbySoloSectionProps {
  currentLat: number;
  currentLng: number;
  currentUserId?: string;
  onRefreshLocation?: () => void;
}

export function NearbySoloSection({
  currentLat,
  currentLng,
  currentUserId,
  onRefreshLocation,
}: NearbySoloSectionProps) {
  const [timeMode, setTimeMode] = useState<"here_now" | "today" | "this_week">("here_now");
  const [travelers, setTravelers] = useState<SoloTravelerCard[]>([]);
  const [circles, setCircles] = useState<TravelCircle[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedTraveler, setSelectedTraveler] = useState<SoloTravelerCard | null>(null);
  const [isTravelerModalOpen, setIsTravelerModalOpen] = useState(false);
  const [isCreateCircleOpen, setIsCreateCircleOpen] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);

  const loadNearbyData = async () => {
    setLoading(true);
    try {
      // 1. Discover nearby solo travelers
      const discRes = await api.discoverNearbySolo(currentLat, currentLng, timeMode, 35);
      setTravelers(discRes.travelers || []);

      // 2. Discover nearby circles
      const circleRes = await api.discoverCircles({});
      setCircles(circleRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNearbyData();
  }, [currentLat, currentLng, timeMode]);

  const handleOpenTraveler = (traveler: SoloTravelerCard) => {
    setSelectedTraveler(traveler);
    setIsTravelerModalOpen(true);
  };

  const handleOpenCircle = (circleId: string) => {
    setSelectedCircleId(circleId);
    setIsCircleModalOpen(true);
  };

  const handleConnectionUpdated = (userId: string, newStatus: string) => {
    setTravelers((prev) =>
      prev.map((t) => (t.user_id === userId ? { ...t, connection_status: newStatus as any } : t))
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Find My Circle & Filter Tabs */}
      <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E05A2B]/10 text-[#E05A2B] text-[10px] font-mono font-bold uppercase tracking-wider">
                I&apos;M HERE • LIVE SOLO MATCHING
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                GPS Verified
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#173B32]">
              Solo Travelers Around You
            </h3>
            <p className="text-xs text-[#20211D]/70 max-w-lg leading-relaxed">
              Discover verified travelers currently in your area looking for companions to explore cafés, viewpoints, and trails together.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsCreateCircleOpen(true)}
              className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Users className="w-4 h-4" />
              <span>Find My Circle</span>
            </button>
          </div>
        </div>

        {/* Time Mode Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#D8CBB2]/60">
          {[
            { id: "here_now", label: "Here Now (< 15 km)", icon: Navigation },
            { id: "today", label: "Exploring Today", icon: Clock },
            { id: "this_week", label: "This Week", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = timeMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimeMode(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#173B32] text-[#FAF4E8] shadow-xs"
                    : "bg-white border border-[#D8CBB2] text-[#20211D]/70 hover:bg-[#E5D5BA]/40"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#B49252]" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-[#B49252] animate-spin mx-auto" />
          <p className="text-xs text-[#20211D]/70">Scanning nearby coordinates for compatible solo travelers...</p>
        </div>
      ) : travelers.length === 0 ? (
        <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E5D5BA]/50 flex items-center justify-center mx-auto text-[#173B32]">
            <Compass className="w-6 h-6 text-[#B49252]" />
          </div>
          <h4 className="font-serif text-lg font-bold text-[#173B32]">
            No solo travelers match your location yet.
          </h4>
          <p className="text-xs text-[#20211D]/70 max-w-md mx-auto leading-relaxed">
            Be the first solo traveler to check in here, or start a new Travel Circle for other arrivals.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setIsCreateCircleOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            >
              Start a Local Circle
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {travelers.map((traveler) => (
            <div
              key={traveler.user_id}
              className="bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      user={{
                        full_name: traveler.full_name,
                        avatar_url: traveler.avatar_url,
                        avatar_type: traveler.avatar_type,
                        avatar_preset: traveler.avatar_preset,
                      }}
                      size="lg"
                    />
                    <div>
                      <h5 className="font-serif text-sm font-bold text-[#173B32]">
                        {traveler.full_name}
                      </h5>
                      <span className="text-[11px] text-[#20211D]/70 block">
                        {traveler.travel_style} • {traveler.trek_pace} Pace
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                    {traveler.proximity_label}
                  </span>
                </div>

                {traveler.bio && (
                  <p className="text-xs text-[#20211D]/80 line-clamp-2 italic">
                    &ldquo;{traveler.bio}&rdquo;
                  </p>
                )}

                {/* Interest Tags */}
                {traveler.interests && traveler.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {traveler.interests.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-[#D8CBB2] text-[10px] font-medium text-[#173B32]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#D8CBB2]/50">
                <button
                  onClick={() => handleOpenTraveler(traveler)}
                  className="flex-1 py-2 rounded-xl bg-white border border-[#D8CBB2] hover:bg-[#E5D5BA]/50 text-[#173B32] text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  View Traveler
                </button>

                <button
                  onClick={() => handleOpenTraveler(traveler)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    traveler.connection_status === "ACCEPTED"
                      ? "bg-emerald-700 text-white"
                      : traveler.connection_status === "PENDING_OUTGOING"
                      ? "bg-amber-600 text-white"
                      : "bg-[#E05A2B] hover:bg-[#C8491D] text-white"
                  }`}
                >
                  {traveler.connection_status === "ACCEPTED" ? (
                    <span>Connected</span>
                  ) : traveler.connection_status === "PENDING_OUTGOING" ? (
                    <span>Pending</span>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <TravelerDetailModal
        traveler={selectedTraveler}
        isOpen={isTravelerModalOpen}
        onClose={() => setIsTravelerModalOpen(false)}
        onConnectionUpdated={handleConnectionUpdated}
      />

      <CreateCircleModal
        isOpen={isCreateCircleOpen}
        onClose={() => setIsCreateCircleOpen(false)}
        onCircleCreated={(c) => {
          setCircles((prev) => [c, ...prev]);
          setSelectedCircleId(c.id);
          setIsCircleModalOpen(true);
        }}
      />

      <CircleDetailModal
        circleId={selectedCircleId}
        isOpen={isCircleModalOpen}
        onClose={() => setIsCircleModalOpen(false)}
        currentUserId={currentUserId}
      />
    </div>
  );
}
