"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Sparkles, MapPin, Compass, Calendar, ArrowRight,
  Plus, CheckCircle2, AlertCircle, RefreshCw, Shield, Footprints,
  MessageCircle, Heart, UserPlus
} from "lucide-react";
import { SoloTravelerCard, TravelCircle } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { TravelerDetailModal } from "@/components/solo/TravelerDetailModal";
import { CreateCircleModal } from "@/components/circles/CreateCircleModal";
import { CircleDetailModal } from "@/components/circles/CircleDetailModal";
import { api } from "@/lib/api";

interface TravelingSoloSectionProps {
  destinationId?: string;
  destinationSlug?: string;
  destinationName?: string;
  trekSlug?: string;
  currentUserId?: string;
  startDate?: string;
  endDate?: string;
  tripId?: string;
  title?: string;
  subtitle?: string;
}

export function TravelingSoloSection({
  destinationId,
  destinationSlug,
  destinationName,
  trekSlug,
  currentUserId,
  startDate,
  endDate,
  tripId,
  title = "Traveling Solo?",
  subtitle = "Discover compatible solo travelers with overlapping dates & join verified circles.",
}: TravelingSoloSectionProps) {
  const [travelers, setTravelers] = useState<SoloTravelerCard[]>([]);
  const [circles, setCircles] = useState<TravelCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSoloEnabled, setUserSoloEnabled] = useState(true);

  // Modals
  const [selectedTraveler, setSelectedTraveler] = useState<SoloTravelerCard | null>(null);
  const [isTravelerModalOpen, setIsTravelerModalOpen] = useState(false);
  const [isCreateCircleOpen, setIsCreateCircleOpen] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const discRes = await api.discoverSoloTravelers({
        destination_id: destinationId,
        destination_slug: destinationSlug,
        trek_slug: trekSlug,
        mode: trekSlug ? "trek" : "before_trip",
      });
      setTravelers(discRes.travelers || []);
      setUserSoloEnabled(discRes.user_solo_enabled !== false);

      const circleRes = await api.discoverCircles({
        destination_id: destinationId,
        destination_slug: destinationSlug,
        trek_slug: trekSlug,
      });
      setCircles(circleRes || []);
    } catch (err) {
      console.error("Failed to load solo discovery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [destinationId, destinationSlug, trekSlug]);

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
    <section className="space-y-6">
      {/* Section Header */}
      <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E05A2B]/10 text-[#E05A2B] text-[10px] font-mono font-bold uppercase tracking-wider">
                VANVAS CIRCLES
              </span>
              {travelers.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32] text-[10px] font-bold">
                  {travelers.length} Solo {travelers.length === 1 ? "Traveler" : "Travelers"} Match
                </span>
              )}
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#20211D]/80 leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsCreateCircleOpen(true)}
              className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Travel Circle</span>
            </button>
            <Link
              href="/profile?tab=solo"
              className="px-4 py-3 rounded-2xl bg-white border border-[#D8CBB2] hover:bg-[#E5D5BA]/50 text-[#173B32] text-xs font-bold transition-colors shadow-xs whitespace-nowrap"
            >
              Solo Settings
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-[#B49252] animate-spin mx-auto" />
          <p className="text-xs text-[#20211D]/60">Scanning for verified solo travelers & circles...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Travel Circles */}
          {circles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#173B32] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#B49252]" />
                  <span>Forming Circles ({circles.length})</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {circles.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32] text-[10px] font-bold uppercase">
                          {c.activity_type}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#B49252]">
                          {c.members_count}/{c.max_members} Travelers
                        </span>
                      </div>
                      <h5 className="font-serif text-base font-bold text-[#173B32] line-clamp-1">
                        {c.name}
                      </h5>
                      <p className="text-xs text-[#20211D]/70 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#E05A2B] shrink-0" />
                        <span className="line-clamp-1">{c.meetup_point}</span>
                      </p>
                      <div className="text-[11px] text-[#20211D]/60 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#B49252]" />
                        <span>{c.start_date} to {c.end_date}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenCircle(c.id)}
                      className="w-full py-2 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>{c.is_member ? "Open Circle Chat" : "View / Join Circle"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solo Travelers Matching Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#173B32] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#E05A2B]" />
                <span>Compatible Solo Travelers</span>
              </h4>
            </div>

            {travelers.length === 0 ? (
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E5D5BA]/50 flex items-center justify-center mx-auto text-[#173B32]">
                  <Users className="w-6 h-6 text-[#B49252]" />
                </div>
                <h5 className="font-serif text-lg font-bold text-[#173B32]">
                  No solo travelers match your trip yet.
                </h5>
                <p className="text-xs text-[#20211D]/70 max-w-md mx-auto leading-relaxed">
                  Turn on Solo Discovery in your profile preferences, create a travel intent for these dates, or check again when you arrive at your destination.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    href="/profile?tab=solo"
                    className="px-4 py-2.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#20453B] transition-colors"
                  >
                    Turn on Solo Discovery
                  </Link>
                  <button
                    onClick={() => setIsCreateCircleOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-[#D8CBB2] text-[#173B32] text-xs font-bold hover:bg-[#E5D5BA]/50 transition-colors cursor-pointer"
                  >
                    Start a New Circle
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

                        <span className="px-2 py-0.5 rounded-full bg-[#B49252]/15 text-[#B49252] text-[10px] font-bold shrink-0">
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

                    {/* Actions */}
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
          </div>
        </div>
      )}

      {/* Modals */}
      <TravelerDetailModal
        traveler={selectedTraveler}
        isOpen={isTravelerModalOpen}
        onClose={() => setIsTravelerModalOpen(false)}
        onConnectionUpdated={handleConnectionUpdated}
        destinationName={destinationName}
        trekSlug={trekSlug}
      />

      <CreateCircleModal
        isOpen={isCreateCircleOpen}
        onClose={() => setIsCreateCircleOpen(false)}
        destinationId={destinationId}
        destinationName={destinationName}
        trekSlug={trekSlug}
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
        onCircleLeft={(cId) => setCircles((prev) => prev.filter((c) => c.id !== cId))}
      />
    </section>
  );
}
