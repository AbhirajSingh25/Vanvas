"use client";

import React from "react";
import {
  MapPin, Calendar, Users, Compass, Clock, Wallet, CheckSquare,
  BedDouble, Bike, Coffee, Navigation, Sparkles, ShieldCheck,
  CheckCircle2, Circle, ArrowRight, Tag, Info, Heart
} from "lucide-react";
import {
  Trip, BudgetSummary, GroupSummary, ChecklistItem, TripMemberItem
} from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";

interface TravelJournalDocProps {
  trip: Trip;
  budgetData: BudgetSummary | null;
  members: TripMemberItem[];
  checklist: ChecklistItem[];
}

export const TravelJournalDoc: React.FC<TravelJournalDocProps> = ({
  trip,
  budgetData,
  members,
  checklist,
}) => {
  const destination = trip.destination;
  const remainingBudget = Math.max(0, (trip.budget_total || 10000) - (trip.budget_spent || 0));

  // Fallback members if empty
  const activeMembers = members && members.length > 0 ? members : [
    {
      id: "owner-fallback",
      user_id: trip.user_id,
      full_name: "Expedition Leader",
      role: "owner"
    }
  ];

  // Group checklist by category
  const checklistByCategory = checklist.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const cat = item.category || "Essentials";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Interests tags
  const interestList = trip.interests
    ? trip.interests.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <article className="journal-doc-container w-full max-w-4xl mx-auto bg-[#FAF4E8] print:bg-white text-[#20211D] border-2 border-[#D8CBB2] print:border-stone-300 rounded-3xl print:rounded-none shadow-xl print:shadow-none p-6 sm:p-10 md:p-12 space-y-10 transition-all font-sans">
      
      {/* ===================================================
          1. HEADER & COVER SECTION
          =================================================== */}
      <header className="itinerary-day-section pb-8 border-b-2 border-[#173B32]/20 print:border-stone-300 space-y-6">
        {/* Top Editorial Crest */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8CBB2] print:border-stone-300 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173B32] print:bg-stone-800 text-[#EFE5D2] flex items-center justify-center font-serif font-black text-base shadow-xs">
              V
            </div>
            <div>
              <span className="font-serif font-black text-sm tracking-widest text-[#173B32] print:text-black uppercase block">
                VANVAS • THE SORTED CLUB
              </span>
              <span className="text-[10px] text-[#7B4D36] tracking-wider uppercase font-semibold">
                Expedition Operating Log • यात्रा दैनिकी
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TravelStamp label={`${trip.num_days} DAYS`} variant="forest" />
            <TravelStamp label={`${trip.travel_style || "CURATED"} STYLE`} variant="terracotta" />
            <TravelStamp label={`${trip.companion_type || "SOLO"}`} variant="mustard" />
          </div>
        </div>

        {/* Destination & Expedition Title */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#7B4D36] uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span>{destination?.name || "Himalayan"}, {destination?.state || "India"}</span>
            </span>
            {destination?.altitude_meters && (
              <>
                <span>•</span>
                <span>Altitude: {destination.altitude_meters}m</span>
              </>
            )}
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#B49252]" />
              <span>{trip.start_date} to {trip.end_date}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-[#173B32] print:text-black leading-tight">
            {trip.title || `${destination?.name || "Himalayan"} Expedition Journal`}
          </h1>

          {destination?.tagline && (
            <p className="text-sm font-serif italic text-[#7B4D36] print:text-stone-700">
              &ldquo;{destination.tagline}&rdquo;
            </p>
          )}
        </div>

        {/* Destination Editorial Banner (Screen & Print Friendly) */}
        <div className="relative rounded-2xl overflow-hidden border border-[#D8CBB2] print:border-stone-300 h-48 sm:h-64 bg-[#173B32]/10">
          <DestinationArtwork
            slug={destination?.slug || "manali"}
            destination={destination?.name || "Manali"}
            state={destination?.state}
            aspectRatio="wide"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 right-3 bg-[#FAF4E8]/90 print:bg-white/90 backdrop-blur-xs px-3 py-1 rounded-xl text-[10px] font-mono text-[#173B32] font-semibold border border-[#D8CBB2]">
            INVITE REF: {trip.invite_code}
          </div>
        </div>

        {/* Travel Philosophy & Roster Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Fellowship Roster */}
          <div className="p-4 rounded-2xl bg-white/70 print:bg-white border border-[#D8CBB2] print:border-stone-300 space-y-2 fellowship-roster">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4D36] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span>Expedition Fellowship ({activeMembers.length} Travelers)</span>
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {activeMembers.map((m) => (
                <div
                  key={m.id || m.user_id}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF4E8] print:bg-stone-50 border border-[#D8CBB2] text-xs text-[#173B32] flex items-center gap-1.5"
                >
                  <span className="w-4 h-4 rounded-full bg-[#173B32] text-[#EFE5D2] text-[9px] font-bold flex items-center justify-center">
                    {m.full_name ? m.full_name.charAt(0).toUpperCase() : "T"}
                  </span>
                  <span className="font-semibold">{m.full_name}</span>
                  {m.role === "owner" && (
                    <span className="text-[9px] uppercase font-bold text-[#B49252]">(Leader)</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Travel Profile Summary */}
          <div className="p-4 rounded-2xl bg-white/70 print:bg-white border border-[#D8CBB2] print:border-stone-300 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4D36] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span>Pacing &amp; Preferences</span>
            </span>
            <div className="text-xs text-[#20211D]/80 space-y-1">
              <div className="flex justify-between">
                <span className="text-[#7B4D36]">Morning Rhythm:</span>
                <span className="font-semibold text-[#173B32]">{trip.wake_up_preference || "Early Riser (6 AM)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B4D36]">Daily Pace:</span>
                <span className="font-semibold text-[#173B32]">{trip.activity_intensity || "Curated Balance"}</span>
              </div>
              {interestList.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1">
                  {interestList.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#EFE5D2] text-[10px] text-[#7B4D36] font-semibold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================
          2. DAY-BY-DAY SEQUENCED ITINERARY
          =================================================== */}
      <section className="space-y-8">
        <div className="flex items-center justify-between pb-2 border-b border-[#D8CBB2] print:border-stone-300">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B65E3C]">
              CHRONOLOGICAL TRAIL SEQUENCE
            </span>
            <h2 className="text-2xl font-serif font-black text-[#173B32] print:text-black">
              Daily Itinerary Log (समय सारिणी)
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold text-[#7B4D36]">
            {trip.itineraries?.length || 0} Days Planned
          </span>
        </div>

        {trip.itineraries && trip.itineraries.length > 0 ? (
          trip.itineraries.map((day) => (
            <div
              key={day.id || day.day_number}
              className="itinerary-day-section p-6 rounded-3xl bg-white/60 print:bg-white border-2 border-[#E5D5BA] print:border-stone-300 space-y-4 page-break-avoid"
            >
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5D5BA] print:border-stone-200">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-[#173B32] print:bg-stone-800 text-[#EFE5D2] font-serif font-bold text-sm">
                    Day {day.day_number}
                  </span>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#173B32] print:text-black leading-snug">
                      {day.title}
                    </h3>
                    <span className="text-xs text-[#7B4D36] font-mono">{day.date}</span>
                  </div>
                </div>

                {day.theme && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B65E3C] bg-[#EFE5D2]/70 px-3 py-1 rounded-lg self-start sm:self-auto">
                    Theme: {day.theme}
                  </span>
                )}
              </div>

              {/* Day Stops Timeline */}
              <div className="space-y-3">
                {day.items && day.items.length > 0 ? (
                  day.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="journal-item p-3.5 rounded-2xl bg-[#FAF4E8] print:bg-stone-50 border border-[#D8CBB2] print:border-stone-200 flex flex-col sm:flex-row items-start gap-3.5 page-break-avoid"
                    >
                      {/* Time Column */}
                      <div className="w-full sm:w-28 shrink-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] font-bold text-[11px]">
                          {item.start_time}
                        </span>
                        <span className="text-[10px] text-[#7B4D36] mt-1">
                          {item.duration_mins} mins
                        </span>
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-serif font-bold text-sm text-[#173B32] print:text-black">
                            {item.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white border border-[#D8CBB2] text-[#7B4D36]">
                            {item.category}
                          </span>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-[#20211D]/80 leading-relaxed">
                            {item.notes}
                          </p>
                        )}

                        {item.reason_for_recommendation && (
                          <p className="text-[11px] text-[#7B4D36] italic flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#B49252]" />
                            <span>{item.reason_for_recommendation}</span>
                          </p>
                        )}

                        {/* Transit from prev stop indicator */}
                        {(item.distance_from_prev_km > 0 || item.travel_time_from_prev_mins > 0) && (
                          <div className="pt-1 text-[10px] font-mono text-[#7B4D36]/80 flex items-center gap-1.5">
                            <Navigation className="w-3 h-3 text-[#B65E3C]" />
                            <span>
                              {item.distance_from_prev_km} km winding transit (~{item.travel_time_from_prev_mins} mins)
                            </span>
                            {item.estimated_cost > 0 && (
                              <>
                                <span>•</span>
                                <span>Approx ₹{item.estimated_cost}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-[#7B4D36] py-2">
                    Open spontaneous exploration allocated for this day.
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 rounded-2xl bg-white/60 border border-[#D8CBB2] text-center text-xs text-[#7B4D36]">
            No daily itinerary generated yet.
          </div>
        )}
      </section>

      {/* ===================================================
          3. STAY & TRANSIT OVERVIEW
          =================================================== */}
      {(trip.hotel || trip.rental) && (
        <section className="itinerary-day-section space-y-4 page-break-avoid">
          <div className="pb-1 border-b border-[#D8CBB2] print:border-stone-300">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B65E3C]">
              EXPEDITION LOGISTICS
            </span>
            <h2 className="text-xl font-serif font-bold text-[#173B32] print:text-black">
              Stay &amp; Mountain Transit (आशियाना और सवारी)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Booked Stay */}
            {trip.hotel && (
              <div className="stay-card p-5 rounded-2xl bg-white/80 print:bg-white border border-[#D8CBB2] print:border-stone-300 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-[#7B4D36] flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-[#B65E3C]" />
                    <span>Booked Accommodation</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#B65E3C] px-2 py-0.5 rounded bg-[#FAF4E8] border border-[#D8CBB2]">
                    {trip.hotel.badge || "Verified"}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#173B32] print:text-black">
                  {trip.hotel.name}
                </h4>
                <p className="text-xs text-[#7B4D36]">{trip.hotel.address}</p>
                <div className="pt-2 border-t border-[#D8CBB2] flex justify-between text-xs font-mono font-medium text-[#173B32]">
                  <span>Check-in: {trip.hotel.check_in_time}</span>
                  <span>{trip.hotel.price_per_night ? `₹${trip.hotel.price_per_night}/night` : "Check availability"}</span>
                </div>
              </div>
            )}

            {/* Rental Scooter / Vehicle */}
            {trip.rental && (
              <div className="stay-card p-5 rounded-2xl bg-white/80 print:bg-white border border-[#D8CBB2] print:border-stone-300 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-[#7B4D36] flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5 text-[#B65E3C]" />
                    <span>Active Mountain Rental</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    Ready
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#173B32] print:text-black">
                  {trip.rental.vehicle_name}
                </h4>
                <p className="text-xs text-[#7B4D36]">Provider: {trip.rental.provider_name} • Deposit: ₹{trip.rental.deposit_amount}</p>
                <div className="pt-2 border-t border-[#D8CBB2] flex justify-between text-xs font-mono font-medium text-[#173B32]">
                  <span>Pickup: {trip.rental.location}</span>
                  <span>{trip.rental.price_per_day ? `₹${trip.rental.price_per_day}/day` : "Price on enquiry"}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===================================================
          4. EXPEDITION BUDGET & TRAVEL LEDGER
          =================================================== */}
      <section className="itinerary-day-section space-y-4 page-break-avoid">
        <div className="flex items-center justify-between pb-1 border-b border-[#D8CBB2] print:border-stone-300">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B65E3C]">
              FINANCIAL AUDIT
            </span>
            <h2 className="text-xl font-serif font-bold text-[#173B32] print:text-black">
              Budget &amp; Travel Ledger Summary (खर्च)
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-[#173B32]">
            Total: ₹{trip.budget_total?.toLocaleString() || "10,000"}
          </span>
        </div>

        {/* Budget 3-Card Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-white/80 print:bg-white border border-[#D8CBB2] print:border-stone-300">
            <span className="text-[10px] text-[#7B4D36] uppercase font-bold">Planned Budget</span>
            <div className="text-lg font-mono font-bold text-[#173B32] mt-0.5">
              ₹{trip.budget_total?.toLocaleString() || "10,000"}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 print:bg-white border border-[#D8CBB2] print:border-stone-300">
            <span className="text-[10px] text-[#7B4D36] uppercase font-bold">Total Spent</span>
            <div className="text-lg font-mono font-bold text-[#B65E3C] mt-0.5">
              ₹{Math.round(trip.budget_spent || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 print:bg-white border border-[#D8CBB2] print:border-stone-300">
            <span className="text-[10px] text-[#7B4D36] uppercase font-bold">Remaining Balance</span>
            <div className="text-lg font-mono font-bold text-emerald-800 mt-0.5">
              ₹{Math.round(remainingBudget).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Categories Breakdown Table */}
        {budgetData && budgetData.categories && budgetData.categories.length > 0 && (
          <div className="budget-table rounded-2xl overflow-hidden border border-[#D8CBB2] print:border-stone-300">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EFE5D2] print:bg-stone-100 text-[#173B32] font-serif font-bold uppercase text-[10px] tracking-wider border-b border-[#D8CBB2]">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Estimated</th>
                  <th className="p-3 text-right">Spent</th>
                  <th className="p-3 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CBB2]/60 print:divide-stone-200 bg-white/60 print:bg-white">
                {budgetData.categories.map((cat, idx) => (
                  <tr key={idx} className="font-mono">
                    <td className="p-3 font-sans font-semibold text-[#173B32]">{cat.category}</td>
                    <td className="p-3 text-right text-[#7B4D36]">₹{cat.estimated.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-[#B65E3C]">₹{cat.spent.toLocaleString()}</td>
                    <td className="p-3 text-right text-emerald-800">₹{cat.remaining.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Logged Expenses / Ledger Items */}
        {budgetData && budgetData.recent_expenses && budgetData.recent_expenses.length > 0 && (
          <div className="budget-table space-y-2 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B4D36]">
              Logged Expense Entries ({budgetData.recent_expenses.length} Records)
            </span>
            <div className="rounded-2xl overflow-hidden border border-[#D8CBB2] print:border-stone-300">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#EFE5D2] print:bg-stone-100 text-[#173B32] font-serif font-bold uppercase text-[10px] tracking-wider border-b border-[#D8CBB2]">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Title</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Payer</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8CBB2]/60 print:divide-stone-200 bg-white/60 print:bg-white font-mono">
                  {budgetData.recent_expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="p-2.5 text-[#7B4D36]">{exp.date}</td>
                      <td className="p-2.5 font-sans font-medium text-[#173B32]">{exp.title}</td>
                      <td className="p-2.5 text-[#7B4D36]">{exp.category}</td>
                      <td className="p-2.5 font-sans text-xs">{exp.user_name || "Self"}</td>
                      <td className="p-2.5 text-right font-bold text-[#173B32]">₹{exp.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ===================================================
          5. HIGH ALTITUDE PACKING CHECKLIST
          =================================================== */}
      {checklist && checklist.length > 0 && (
        <section className="itinerary-day-section space-y-4 page-break-avoid">
          <div className="pb-1 border-b border-[#D8CBB2] print:border-stone-300 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#B65E3C]">
                EXPEDITION PREPARATION
              </span>
              <h2 className="text-xl font-serif font-bold text-[#173B32] print:text-black">
                Packing Checklist (तैयारी)
              </h2>
            </div>
            <span className="text-xs font-mono text-[#7B4D36]">
              {checklist.filter((c) => c.is_checked).length} of {checklist.length} Checked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(checklistByCategory).map(([cat, items]) => (
              <div
                key={cat}
                className="p-4 rounded-2xl bg-white/70 print:bg-white border border-[#D8CBB2] print:border-stone-300 space-y-2 page-break-avoid"
              >
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#173B32] print:text-black pb-1 border-b border-[#D8CBB2]">
                  {cat}
                </h4>
                <div className="space-y-1.5 pt-1">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      {it.is_checked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[#7B4D36] shrink-0" />
                      )}
                      <span className={it.is_checked ? "text-[#7B4D36] line-through font-light" : "text-[#173B32] font-medium"}>
                        {it.item_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================================================
          6. FIELD NOTES & REFLECTIONS SECTION
          =================================================== */}
      <section className="itinerary-day-section p-6 rounded-3xl bg-white/80 print:bg-white border-2 border-[#D8CBB2] print:border-stone-300 space-y-3 page-break-avoid">
        <div className="flex items-center justify-between pb-1 border-b border-[#D8CBB2] print:border-stone-300">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B65E3C]">
              HANDWRITTEN FIELD OBSERVATIONS
            </span>
            <h3 className="font-serif font-bold text-lg text-[#173B32] print:text-black">
              Traveler Notes &amp; Mountain Reflections
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#7B4D36]">
            EXPEDITION LOGBOOK
          </span>
        </div>

        <p className="text-xs text-[#7B4D36] italic">
          Use this section for physical ink notes on high mountain passes, weather observations, local café conversations, and travel stamps.
        </p>

        {/* Ruled lines for handwritten notes */}
        <div className="space-y-4 pt-2">
          <div className="h-6 border-b border-dashed border-[#D8CBB2] print:border-stone-300" />
          <div className="h-6 border-b border-dashed border-[#D8CBB2] print:border-stone-300" />
          <div className="h-6 border-b border-dashed border-[#D8CBB2] print:border-stone-300" />
          <div className="h-6 border-b border-dashed border-[#D8CBB2] print:border-stone-300" />
        </div>
      </section>

      {/* ===================================================
          7. EDITORIAL SEAL & FOOTER
          =================================================== */}
      <footer className="pt-6 border-t-2 border-[#173B32]/20 print:border-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7B4D36] font-mono page-break-avoid">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#B49252]" />
          <span>VANVAS Authenticated Expedition Journal</span>
        </div>

        <div className="text-right text-[11px]">
          <span>Generated for {trip.destination?.name || "Himalayan"} Trail • {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      </footer>
    </article>
  );
};
