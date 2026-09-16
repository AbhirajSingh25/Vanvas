"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Printer, ArrowLeft, Download, ShieldAlert, Sparkles,
  MapPin, Calendar, Compass, RefreshCw
} from "lucide-react";
import { api } from "@/lib/api";
import { Trip, BudgetSummary, GroupSummary, ChecklistItem } from "@/types";
import { TravelJournalDoc } from "@/components/journal/TravelJournalDoc";
import { TravelStamp } from "@/components/ui/TravelStamp";

export default function TripJournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = use(params);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetSummary | null>(null);
  const [groupData, setGroupData] = useState<GroupSummary | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJournalData = async () => {
      try {
        setLoading(true);
        setAuthError(null);
        const t = await api.getTrip(tripId);
        setTrip(t);

        // Fetch supplementary journal data concurrently
        await Promise.allSettled([
          api.getBudget(tripId).then(setBudgetData).catch(() => {}),
          api.getGroupDetails(tripId).then(setGroupData).catch(() => {}),
          api.getChecklist(tripId).then(setChecklist).catch(() => {}),
        ]);
      } catch (err: any) {
        console.error("Failed to load journal:", err);
        if (err.message && (err.message.includes("403") || err.message.includes("Forbidden") || err.message.includes("Not a member"))) {
          setAuthError("You are not a member of this expedition. Only authorized travelers can view and export this journal.");
        } else if (err.message && err.message.includes("404")) {
          setAuthError("This expedition journal could not be found.");
        } else {
          setAuthError(err.message || "Failed to load expedition journal.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJournalData();
  }, [tripId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFE5D2] flex flex-col items-center justify-center text-[#173B32] gap-3">
        <div className="w-10 h-10 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-serif italic text-[#7B4D36]">
          Typesetting expedition travel journal...
        </span>
      </div>
    );
  }

  if (authError || !trip) {
    return (
      <div className="min-h-screen bg-[#EFE5D2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FAF4E8] rounded-3xl p-8 border-2 border-[#D8CBB2] shadow-xl text-center space-y-5 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-[#173B32]">
              Expedition Journal Access Restricted
            </h2>
            <p className="text-xs text-[#7B4D36] leading-relaxed">
              {authError || "Unable to access this trip journal."}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#173B32] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider hover:bg-[#20453B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Expeditions</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFE5D2] print:bg-white text-[#20211D] pb-24 print:pb-0">
      
      {/* ===================================================
          TOP STICKY ACTION BAR (Screen Only - Hidden in Print)
          =================================================== */}
      <aside className="sticky top-0 z-40 bg-[#FAF4E8]/95 print:hidden backdrop-blur-md border-b-2 border-[#D8CBB2] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Back to Trip Operating Hub */}
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#173B32] hover:text-[#B65E3C] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Trip Hub</span>
          </Link>

          {/* Center Trip Stamp / Meta */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#7B4D36]">
            <span className="font-bold text-[#173B32]">{trip.destination?.name || "Himalayan"} Expedition</span>
            <span>•</span>
            <span>{trip.start_date} to {trip.end_date}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              title="Print or Save as PDF (Ctrl + P)"
            >
              <Printer className="w-4 h-4 text-[#B49252]" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===================================================
          MAIN EDITORIAL JOURNAL DOCUMENT CONTAINER
          =================================================== */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-6 sm:pt-10 print:p-0">
        <TravelJournalDoc
          trip={trip}
          budgetData={budgetData}
          members={groupData?.members || []}
          checklist={checklist}
        />
      </main>
    </div>
  );
}
