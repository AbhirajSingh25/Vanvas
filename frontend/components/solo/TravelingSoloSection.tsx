"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Sparkles, MapPin, Compass, Calendar, ArrowRight,
  Plus, CheckCircle2, AlertCircle, RefreshCw, Shield, Footprints,
  MessageCircle, Heart, UserPlus, Phone, ShieldCheck, BookOpen, Coffee, Navigation, BedDouble
} from "lucide-react";
import { SoloTravelerCard, TravelCircle, SoloDestinationIntelligence } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { TravelerDetailModal } from "@/components/solo/TravelerDetailModal";
import { CreateCircleModal } from "@/components/circles/CreateCircleModal";
import { CircleDetailModal } from "@/components/circles/CircleDetailModal";
import { DirectChatModal } from "@/components/solo/DirectChatModal";
import { CompactTravelerCard } from "@/components/compact";
import { useDensity } from "@/context/DensityContext";
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
  title,
  subtitle,
}: TravelingSoloSectionProps) {
  const { isCompact } = useDensity();
  const [travelers, setTravelers] = useState<SoloTravelerCard[]>([]);
  const [circles, setCircles] = useState<TravelCircle[]>([]);
  const [intelligence, setIntelligence] = useState<SoloDestinationIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSoloEnabled, setUserSoloEnabled] = useState(true);

  // Modals
  const [selectedTraveler, setSelectedTraveler] = useState<SoloTravelerCard | null>(null);
  const [isTravelerModalOpen, setIsTravelerModalOpen] = useState(false);
  const [isCreateCircleOpen, setIsCreateCircleOpen] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);
  const [chatPartner, setChatPartner] = useState<SoloTravelerCard | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const activeSlug = destinationSlug || destinationId || (destinationName ? destinationName.toLowerCase().replace(/ /g, "-") : "india");
  const displayName = destinationName || (intelligence ? intelligence.name : "Destination");

  const loadData = async () => {
    setLoading(true);
    try {
      const discRes = await api.discoverSoloTravelers({
        destination_id: destinationId,
        destination_slug: destinationSlug || activeSlug,
        trek_slug: trekSlug,
        mode: trekSlug ? "trek" : "before_trip",
      });
      setTravelers(discRes.travelers || []);
      setUserSoloEnabled(discRes.user_solo_enabled !== false);

      const circleRes = await api.discoverCircles({
        destination_id: destinationId,
        destination_slug: destinationSlug || activeSlug,
        trek_slug: trekSlug,
      });
      setCircles(circleRes || []);

      if (activeSlug) {
        try {
          const intel = await api.getDestinationSoloIntelligence(activeSlug);
          setIntelligence(intel);
        } catch (e) {
          console.warn("Could not load dynamic solo intelligence:", e);
        }
      }
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

  const handleOpenChat = (traveler: SoloTravelerCard) => {
    setChatPartner(traveler);
    setIsChatOpen(true);
  };

  const handleConnectionUpdated = (userId: string, newStatus: string) => {
    setTravelers((prev) =>
      prev.map((t) => (t.user_id === userId ? { ...t, connection_status: newStatus as any } : t))
    );
  };

  const sectionTitle = title || `Traveling Solo in ${displayName}?`;
  const sectionSubtitle = subtitle || `Discover verified solo wanderers, active circles & local field notes tailored to ${displayName}.`;

  return (
    <section className="space-y-8">
      {/* Section Header */}
      <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E05A2B]/10 text-[#E05A2B] text-[10px] font-mono font-bold uppercase tracking-wider">
                VANVAS SOLO COMPANION
              </span>
              {travelers.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32] text-[10px] font-bold">
                  {travelers.length} Solo {travelers.length === 1 ? "Traveler" : "Travelers"} Match
                </span>
              )}
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
              {sectionTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#20211D]/80 leading-relaxed">
              {sectionSubtitle}
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
        <div className="space-y-8">
          
          {/* 1. Solo Travelers Matching Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#173B32] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#E05A2B]" />
                <span>Solo Travelers Heading to {displayName}</span>
              </h4>
            </div>

            {travelers.length === 0 ? (
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E5D5BA]/50 flex items-center justify-center mx-auto text-[#173B32]">
                  <Users className="w-6 h-6 text-[#B49252]" />
                </div>
                <h5 className="font-serif text-lg font-bold text-[#173B32]">
                  No travellers have joined {displayName} yet.
                </h5>
                <p className="text-xs text-[#20211D]/70 max-w-md mx-auto leading-relaxed">
                  Be the first to set your dates, or create a travel circle for a morning hike, cafe walk, or monument exploration.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    href="/profile?tab=solo"
                    className="px-4 py-2.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold hover:bg-[#20453B] transition-colors"
                  >
                    Set Travel Dates
                  </Link>
                  <button
                    onClick={() => setIsCreateCircleOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white border border-[#D8CBB2] text-[#173B32] text-xs font-bold hover:bg-[#E5D5BA]/50 transition-colors cursor-pointer"
                  >
                    Create a Circle
                  </button>
                </div>
              </div>
            ) : isCompact ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {travelers.map((traveler) => (
                  <CompactTravelerCard
                    key={traveler.user_id}
                    traveler={traveler}
                    onOpenProfile={() => handleOpenTraveler(traveler)}
                    onOpenChat={() => handleOpenChat(traveler)}
                  />
                ))}
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
                              {traveler.travel_style || "Solo Explorer"}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-[#B49252]/15 text-[#B49252] text-[10px] font-bold shrink-0">
                          {traveler.proximity_label || "Heading here"}
                        </span>
                      </div>

                      {traveler.bio && (
                        <p className="text-xs text-[#20211D]/80 line-clamp-2 italic">
                          &ldquo;{traveler.bio}&rdquo;
                        </p>
                      )}

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
                        Profile
                      </button>

                      {traveler.connection_status === "ACCEPTED" ? (
                        <button
                          onClick={() => handleOpenChat(traveler)}
                          className="px-3.5 py-2 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#B49252]" />
                          <span>Chat</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenTraveler(traveler)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                            traveler.connection_status === "PENDING_OUTGOING"
                              ? "bg-amber-600 text-white"
                              : "bg-[#E05A2B] hover:bg-[#C8491D] text-white"
                          }`}
                        >
                          {traveler.connection_status === "PENDING_OUTGOING" ? (
                            <span>Pending</span>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Connect</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Active Travel Circles */}
          {circles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#173B32] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#B49252]" />
                  <span>Travel Circles in {displayName} ({circles.length})</span>
                </h4>
              </div>

              {isCompact ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {circles.map((c) => (
                    <div
                      key={c.id}
                      className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs hover:border-[#173B32] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[9.5px]">
                          <span className="font-bold text-[#173B32] uppercase">{c.activity_type}</span>
                          <span className="text-[#B49252] font-mono font-bold">({c.members_count}/{c.max_members})</span>
                        </div>
                        <h5 className="font-serif text-xs font-bold text-[#173B32] truncate">{c.name}</h5>
                        <p className="text-[10px] text-[#20211D]/60 truncate">{c.meetup_point}</p>
                      </div>
                      <button
                        onClick={() => handleOpenCircle(c.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#173B32] hover:bg-[#20453B] text-white text-[10px] font-bold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{c.is_member ? "Chat" : "Join"}</span>
                        <ArrowRight className="w-3 h-3 text-[#B49252]" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
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
                        <span>{c.is_member ? "Open Group Chat" : "View / Join Circle"}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Essential Field Intelligence for THIS destination */}
          {intelligence && (
            <div className="space-y-4 pt-4 border-t border-[#D8CBB2]/60">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32] text-[10px] font-mono font-bold uppercase tracking-wider">
                  FIELD INTELLIGENCE
                </span>
                <span className="text-xs font-bold text-[#173B32]">
                  Essential Field Notes for {displayName}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Safe Areas */}
                {intelligence.safe_areas && intelligence.safe_areas.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-[#D8CBB2] space-y-2.5">
                    <h5 className="font-serif text-sm font-bold text-[#173B32] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#173B32]" />
                      <span>Recommended Safe Zones & Walking Areas</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-[#20211D]/80">
                      {intelligence.safe_areas.map((area, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#173B32] mt-1.5 shrink-0" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Getting Around */}
                {intelligence.getting_around && intelligence.getting_around.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-[#D8CBB2] space-y-2.5">
                    <h5 className="font-serif text-sm font-bold text-[#173B32] flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-[#E05A2B]" />
                      <span>Local Transit & Solo Mobility</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-[#20211D]/80">
                      {intelligence.getting_around.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E05A2B] mt-1.5 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Solo Dining Tips */}
                {intelligence.dining_tips && intelligence.dining_tips.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-[#D8CBB2] space-y-2.5">
                    <h5 className="font-serif text-sm font-bold text-[#173B32] flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-[#B49252]" />
                      <span>Solo Dining & Cafe Culture</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-[#20211D]/80">
                      {intelligence.dining_tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B49252] mt-1.5 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Emergency Contacts */}
                {intelligence.emergency_contacts && intelligence.emergency_contacts.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-[#D8CBB2] space-y-2.5">
                    <h5 className="font-serif text-sm font-bold text-[#173B32] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-700" />
                      <span>Verified Local Emergency Numbers</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {intelligence.emergency_contacts.map((contact, idx) => (
                        <a
                          key={idx}
                          href={`tel:${contact.number}`}
                          className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2] hover:border-[#173B32] flex items-center justify-between transition-colors"
                        >
                          <span className="text-[#20211D]/80 font-medium truncate pr-2">{contact.label}</span>
                          <span className="font-mono font-bold text-[#173B32] shrink-0">{contact.number}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modals */}
      <TravelerDetailModal
        traveler={selectedTraveler}
        isOpen={isTravelerModalOpen}
        onClose={() => setIsTravelerModalOpen(false)}
        onConnectionUpdated={handleConnectionUpdated}
        destinationName={displayName}
        trekSlug={trekSlug}
      />

      <DirectChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        partner={chatPartner}
        currentUserId={currentUserId}
      />

      <CreateCircleModal
        isOpen={isCreateCircleOpen}
        onClose={() => setIsCreateCircleOpen(false)}
        destinationId={destinationId}
        destinationName={displayName}
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
