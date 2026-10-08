"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Building2, Bus, Train, Plane, Car, Sparkles,
  Calendar, MapPin, CheckCircle2, Clock, XCircle, AlertCircle,
  Receipt, ExternalLink, Plus, RefreshCw, ArrowRight
} from "lucide-react";
import { Trip, Booking } from "@/types";
import { api } from "@/lib/api";

interface TripBookingsTabProps {
  trip: Trip;
  bookings: Booking[];
  onRefresh: () => void;
  onOpenVoucher: (booking: Booking) => void;
}

export const TripBookingsTab: React.FC<TripBookingsTabProps> = ({
  trip,
  bookings,
  onRefresh,
  onOpenVoucher,
}) => {
  const [attachingRef, setAttachingRef] = useState(false);
  const [externalRefInput, setExternalRefInput] = useState("");
  const [attachingLoading, setAttachingLoading] = useState(false);
  const [attachMessage, setAttachMessage] = useState<string | null>(null);

  const parseSnapshot = (b: Booking): any => {
    if (!b.booking_snapshot) return {};
    if (typeof b.booking_snapshot === "string") {
      try {
        return JSON.parse(b.booking_snapshot);
      } catch {
        return {};
      }
    }
    return b.booking_snapshot;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CONFIRMED
          </span>
        );
      case "PROVIDER_HANDOFF":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" />
            PROVIDER HANDOFF
          </span>
        );
      case "PENDING":
      case "PAYMENT_PROCESSING":
      case "CONFIRMING":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            PROCESSING
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-neutral-200 text-neutral-700 border border-neutral-300 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            CANCELLED
          </span>
        );
      case "REFUNDED":
      case "REFUND_PENDING":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" />
            {status === "REFUNDED" ? "REFUNDED" : "REFUND PENDING"}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case "stay":
      case "hotel":
      case "hostel":
      case "homestay":
        return Building2;
      case "bus":
        return Bus;
      case "train":
        return Train;
      case "flight":
        return Plane;
      case "cab":
      case "rental":
        return Car;
      default:
        return Sparkles;
    }
  };

  const handleAttachExternalBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalRefInput.trim()) return;
    try {
      setAttachingLoading(true);
      setAttachMessage(null);
      await api.attachBookingToTrip(externalRefInput.trim(), trip.id);
      setAttachMessage("Booking successfully connected to this expedition.");
      setExternalRefInput("");
      setAttachingRef(false);
      onRefresh();
    } catch (err: any) {
      setAttachMessage(err?.message || "Could not link booking reference. Please verify the code.");
    } finally {
      setAttachingLoading(false);
    }
  };

  const totalSpent = bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((acc, b) => acc + (b.total_amount || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Trip Bookings</span>
          <span className="text-2xl font-bold font-mono text-[#173B32]">{bookings.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Confirmed</span>
          <span className="text-2xl font-bold font-mono text-emerald-700">
            {bookings.filter((b) => b.status === "CONFIRMED").length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Total Committed Spend</span>
          <span className="text-2xl font-bold font-mono text-[#B65E3C]">₹{totalSpent.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Provider Handoffs</span>
          <span className="text-2xl font-bold font-mono text-sky-800">
            {bookings.filter((b) => b.status === "PROVIDER_HANDOFF").length}
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#B49252]" />
          <span className="font-serif font-bold text-sm text-[#173B32]">
            Authoritative Expedition Ledger
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAttachingRef(!attachingRef)}
            className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-white border border-[#E5D5BA] text-[#173B32] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#B65E3C]" />
            <span>Link Booking ID</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-[#FAF7F0] hover:bg-white border border-[#E5D5BA] text-[#173B32] transition-colors cursor-pointer"
            title="Refresh Bookings"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Attach Booking Reference Form */}
      {attachingRef && (
        <form
          onSubmit={handleAttachExternalBooking}
          className="p-4 rounded-2xl bg-white border-2 border-[#173B32] space-y-3 animate-fadeIn"
        >
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-sm text-[#173B32]">
              Connect an Existing VANVAS Booking
            </h4>
            <p className="text-xs text-[#7B4D36]">
              Enter the VANVAS public reference (e.g., VV-2026-XXXX or UUID) to associate it with this trip workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. VV-2026-ABCD1234"
              value={externalRefInput}
              onChange={(e) => setExternalRefInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-xs text-[#173B32] font-mono focus:outline-none focus:border-[#173B32]"
            />
            <button
              type="submit"
              disabled={attachingLoading || !externalRefInput.trim()}
              className="px-4 py-2 bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {attachingLoading ? "Linking..." : "Link"}
            </button>
            <button
              type="button"
              onClick={() => setAttachingRef(false)}
              className="px-3 py-2 bg-[#FAF7F0] text-[#7B4D36] text-xs font-bold rounded-xl hover:bg-[#E5D5BA] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {attachMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
          {attachMessage}
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
          <ShieldCheck className="w-12 h-12 text-[#B49252] mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-[#173B32]">
              No confirmed bookings attached to this trip yet
            </h3>
            <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
              Book verified stays, cabs, or Himalayan transit to anchor your itinerary days with real confirmation references.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/explore/${trip.destination?.slug || "manali"}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <span>Explore Stays in {trip.destination?.name || "Destination"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((b) => {
            const Icon = getBookingIcon(b.booking_type);
            const snapshot = parseSnapshot(b);
            const itemName = snapshot.item_name || snapshot.title || "Trip Reservation";
            const ref = b.public_booking_reference || b.id;

            return (
              <div
                key={b.id}
                className="p-5 rounded-3xl bg-white border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Card Header: Reference + Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#E5D5BA]/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#EFE5D2] text-[#173B32] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#7B4D36] uppercase block">REFERENCE</span>
                        <span className="font-mono font-bold text-xs text-[#173B32]">{ref}</span>
                      </div>
                    </div>
                    <div>{getStatusBadge(b.status)}</div>
                  </div>

                  {/* Title & Info */}
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#173B32] leading-snug line-clamp-1">
                      {itemName}
                    </h4>
                    {snapshot.location && (
                      <p className="text-xs text-[#7B4D36] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#B65E3C] shrink-0" />
                        <span className="truncate">{snapshot.location}</span>
                      </p>
                    )}
                  </div>

                  {/* Date Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF7F0] p-3 rounded-2xl border border-[#E5D5BA]">
                    <div>
                      <span className="text-[10px] font-mono text-[#7B4D36]/80 uppercase block">Check-In / Start</span>
                      <span className="font-bold text-[#173B32]">{snapshot.start_date || "Confirmed"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#7B4D36]/80 uppercase block">Check-Out / End</span>
                      <span className="font-bold text-[#173B32]">{snapshot.end_date || "Confirmed"}</span>
                    </div>
                    {snapshot.guests && (
                      <div className="col-span-2 pt-1 border-t border-[#E5D5BA]/40 text-[11px] text-[#7B4D36]">
                        {snapshot.guests} travellers • Provider: {b.provider || "Direct"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Price + Voucher CTA */}
                <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#7B4D36] uppercase block">Amount</span>
                    <span className="font-bold font-mono text-base text-[#B65E3C]">
                      ₹{b.total_amount ? b.total_amount.toLocaleString() : "0"}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenVoucher(b)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Voucher</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
