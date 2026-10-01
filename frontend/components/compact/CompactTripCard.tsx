"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Users, Wallet } from "lucide-react";
import { TripSummary } from "@/types";

interface CompactTripCardProps {
  trip: TripSummary;
}

export const CompactTripCard: React.FC<CompactTripCardProps> = ({ trip }) => {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] hover:border-[#173B32] p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4"
    >
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#173B32] text-[#EFE5D2] text-[9px] font-mono font-bold uppercase tracking-wider">
            {trip.status}
          </span>
          <span className="text-[10px] font-mono text-[#7B4D36]">
            {trip.start_date} → {trip.end_date}
          </span>
        </div>

        <h3 className="font-serif font-black text-base text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight truncate">
          {trip.title}
        </h3>

        <div className="flex items-center gap-2 text-[10px] font-mono text-[#536B52]">
          <span>{trip.num_days} DAYS</span>
          <span>·</span>
          <span>{trip.companion_type?.toUpperCase() || "SOLO"}</span>
          <span>·</span>
          <span className="font-bold text-[#173B32]">₹{Math.round(trip.budget_total / 1000)}K</span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 text-[#B65E3C] group-hover:translate-x-1 transition-transform text-xs font-bold">
        <span>Hub</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
};
