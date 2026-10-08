"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck, Calendar, MapPin, Clock, ArrowRight, ExternalLink,
  RefreshCw, CheckCircle2, AlertCircle, XCircle, Search, Filter,
  Building2, Bus, Train, Plane, Car, Sparkles, Receipt, ArrowLeft
} from "lucide-react";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import { BookingConfirmationModal } from "@/components/booking/BookingConfirmationModal";
import { TravelStamp } from "@/components/ui/TravelStamp";

type BookingFilterTab = "all" | "upcoming" | "completed" | "cancelled" | "refunded";

export default function BookingsHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BookingFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<Booking | null>(null);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBookings();
      setBookings(data || []);
    } catch (err: any) {
      console.error("Failed to load bookings:", err);
      setError(err?.message || "Could not load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const snap = parseSnapshot(b);
      // Filter by tab
      if (activeFilter === "upcoming") {
        if (!["CONFIRMED", "PENDING", "PAYMENT_REQUIRED", "PAYMENT_PROCESSING", "PROVIDER_HANDOFF"].includes(b.status)) return false;
      } else if (activeFilter === "completed") {
        if (b.status !== "CONFIRMED") return false;
        // If end date passed
        if (snap.end_date) {
          const endDate = new Date(snap.end_date);
          if (endDate > new Date()) return false;
        }
      } else if (activeFilter === "cancelled") {
        if (!["CANCELLED", "PAYMENT_FAILED", "CONFIRMATION_FAILED", "UNAVAILABLE"].includes(b.status)) return false;
      } else if (activeFilter === "refunded") {
        if (!["REFUNDED", "REFUND_PENDING"].includes(b.status)) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const ref = (b.public_booking_reference || b.id).toLowerCase();
        const title = (snap.item_name || snap.title || "").toLowerCase();
        const provider = (b.provider || "").toLowerCase();
        return ref.includes(query) || title.includes(query) || provider.includes(query);
      }

      return true;
    });
  }, [bookings, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
      active: bookings.filter((b) => ["CONFIRMED", "PENDING", "PROVIDER_HANDOFF"].includes(b.status)).length,
      refunded: bookings.filter((b) => ["REFUNDED", "REFUND_PENDING"].includes(b.status)).length,
    };
  }, [bookings]);

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

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#173B32] pb-24">
      {/* Hero / Header Section */}
      <div className="bg-[#173B32] text-[#FAF4E8] pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b-4 border-[#B49252]">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#E5D5BA] hover:text-[#FAF4E8] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              BACK TO VANVAS
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <TravelStamp label="आरक्षण" variant="mustard" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#B49252] font-bold">
                  EXPLORER'S VAULT • TRANSACTION LEDGER
                </span>
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl text-[#FAF4E8]">
                My Bookings &amp; Reservations
              </h1>
              <p className="text-xs sm:text-sm text-[#E5D5BA]/90 max-w-xl">
                Durable transaction records, verified room and transport vouchers, provider handoffs, and instant cancellation management.
              </p>
            </div>

            <button
              onClick={fetchBookings}
              disabled={loading}
              className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#20453B] hover:bg-[#28574B] border border-[#B49252]/40 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>REFRESH RECORDS</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-mono text-[#E5D5BA] uppercase block">Total Bookings</span>
              <span className="text-xl font-bold font-mono text-[#FAF4E8]">{stats.total}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-mono text-[#E5D5BA] uppercase block">Confirmed Stays &amp; Travel</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{stats.confirmed}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-mono text-[#E5D5BA] uppercase block">Active / Upcoming</span>
              <span className="text-xl font-bold font-mono text-amber-300">{stats.active}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-mono text-[#E5D5BA] uppercase block">Refunded / Reconciled</span>
              <span className="text-xl font-bold font-mono text-purple-300">{stats.refunded}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Filters & Search Toolbar */}
        <div className="p-4 rounded-3xl bg-[#EFE5D2] border-2 border-[#E5D5BA] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(
              [
                { id: "all", label: "All Bookings" },
                { id: "upcoming", label: "Upcoming & Active" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
                { id: "refunded", label: "Refunded" },
              ] as { id: BookingFilterTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-[#173B32] text-[#FAF4E8] shadow-xs"
                    : "bg-[#FAF7F0] text-[#7B4D36] hover:bg-[#E5D5BA]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7B4D36]" />
            <input
              type="text"
              placeholder="Search reference or stay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-xs text-[#173B32] focus:outline-none focus:border-[#173B32]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#173B32] animate-spin mx-auto" />
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
              Loading verified transaction ledger...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-200 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="font-serif font-bold text-base text-rose-900">Unable to retrieve bookings</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchBookings}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4">
            <ShieldCheck className="w-12 h-12 text-[#B49252] mx-auto opacity-70" />
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#173B32]">
                {searchQuery ? "No bookings match your search query" : "No bookings found in this view"}
              </h3>
              <p className="text-xs text-[#7B4D36] max-w-md mx-auto">
                Ready to secure your Himalayan retreat or mountain transit? Explore verified stays and book directly with instant confirmation.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-all shadow-md"
              >
                <span>Explore Destinations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Booking Cards Grid */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBookings.map((b) => {
              const Icon = getBookingIcon(b.booking_type);
              const snapshot = parseSnapshot(b);
              const itemName = snapshot.item_name || snapshot.title || "Mountain Stay & Transit";
              const ref = b.public_booking_reference || b.id;

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-white border-2 border-[#E5D5BA] hover:border-[#173B32]/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Card Top: Reference + Status */}
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

                    {/* Card Body: Item Title + Dates + Specs */}
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#173B32] leading-snug line-clamp-1">
                        {itemName}
                      </h3>
                      {snapshot.location && (
                        <p className="text-xs text-[#7B4D36] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#B65E3C] shrink-0" />
                          <span className="truncate">{snapshot.location}</span>
                        </p>
                      )}
                    </div>

                    {/* Date / Time / Guests Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF7F0] p-3 rounded-2xl border border-[#E5D5BA]">
                      <div>
                        <span className="text-[10px] font-mono text-[#7B4D36]/80 uppercase block">Check-In / Departure</span>
                        <span className="font-bold text-[#173B32]">{snapshot.start_date || "Confirmed Date"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#7B4D36]/80 uppercase block">Check-Out / Arrival</span>
                        <span className="font-bold text-[#173B32]">{snapshot.end_date || "Confirmed Schedule"}</span>
                      </div>
                      {snapshot.guests && (
                        <div className="col-span-2 pt-1 border-t border-[#E5D5BA]/40 flex items-center justify-between text-[11px]">
                          <span className="text-[#7B4D36]">Guests: {snapshot.guests} travellers</span>
                          <span className="font-mono text-[10px] text-[#7B4D36] uppercase">Provider: {b.provider || "Direct"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Price + Actions */}
                  <div className="pt-3 border-t border-[#E5D5BA] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-[#7B4D36] uppercase block">Total Amount</span>
                      <span className="font-bold font-mono text-base text-[#B65E3C]">
                        ₹{b.total_amount ? b.total_amount.toLocaleString() : "0"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.trip_id && (
                        <Link
                          href={`/trips/${b.trip_id}`}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] hover:bg-[#EFE5D2] text-xs font-semibold transition-colors"
                        >
                          View Trip
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setSelectedBookingForModal(b);
                          setConfirmationModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Voucher</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Confirmation / Voucher Modal */}
      <BookingConfirmationModal
        isOpen={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        booking={selectedBookingForModal}
        onBookingCancelled={(cancelled: Booking) => {
          setSelectedBookingForModal(cancelled);
          setBookings((prev) => prev.map((item) => (item.id === cancelled.id ? cancelled : item)));
        }}
      />
    </div>
  );
}
