"use client";

import React from "react";
import Link from "next/link";
import {
  X, CheckCircle2, MapPin, Calendar, Users, CreditCard,
  Printer, ArrowRight, ExternalLink, ShieldCheck, HeartHandshake,
  HelpCircle, Sparkles, Building2
} from "lucide-react";
import { Booking } from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onBookingCancelled?: (cancelled: Booking) => void;
}

export function BookingConfirmationModal({
  isOpen,
  onClose,
  booking,
  onBookingCancelled,
}: BookingConfirmationModalProps) {
  if (!isOpen || !booking) return null;

  const firstItem = booking.items && booking.items.length > 0 ? booking.items[0] : null;
  const metadata = booking.metadata_json ? JSON.parse(booking.metadata_json) : {};

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0F2924]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header with Celebration Stamp */}
        <div className="p-6 border-b border-[#E5D5BA] bg-[#EFE5D2] text-center relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#E5D5BA] text-[#7B4D36] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-700 text-[#FAF4E8] flex items-center justify-center shadow-lg mb-3">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-[#173B32] text-[#EFE5D2] inline-block shadow-xs">
            Reservation Confirmed
          </span>

          <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] mt-2">
            Pack Your Bags! 🎒
          </h2>
          <p className="text-xs text-[#7B4D36] mt-1 font-light">
            Your travel reservation has been permanently secured and verified.
          </p>

          <div className="mt-4 p-2.5 rounded-xl bg-white/80 border border-[#E5D5BA] inline-block">
            <span className="text-[10px] font-mono text-[#7B4D36] uppercase tracking-wider block">
              VANVAS Booking Reference
            </span>
            <span className="font-mono font-black text-lg text-[#B65E3C] tracking-widest">
              {booking.public_booking_reference || booking.id.substring(0, 12).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Details Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Reservation Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-semibold block">
                  {booking.booking_type} • {booking.provider}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#173B32]">
                  {firstItem?.title || "Himalayan Sanctuary"}
                </h3>
                <p className="text-xs text-[#7B4D36] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>{firstItem?.destination || "Himalayas"}</span>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-600 text-white shadow-xs">
                {booking.status}
              </span>
            </div>

            {/* Timing & Dates */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5D5BA] text-xs text-[#7B4D36]">
              {firstItem?.start_at && (
                <div className="p-2 rounded-xl bg-[#FAF7F0]">
                  <span className="text-[10px] font-mono uppercase block text-[#7B4D36]/80">Check-In</span>
                  <span className="font-semibold text-[#173B32]">
                    {new Date(firstItem.start_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              {firstItem?.end_at && (
                <div className="p-2 rounded-xl bg-[#FAF7F0]">
                  <span className="text-[10px] font-mono uppercase block text-[#7B4D36]/80">Check-Out</span>
                  <span className="font-semibold text-[#173B32]">
                    {new Date(firstItem.end_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {/* Primary Guest */}
            {metadata.traveller_name && (
              <div className="p-2.5 rounded-xl bg-[#FAF7F0] text-xs flex items-center justify-between">
                <span className="text-[#7B4D36]">Primary Traveller:</span>
                <span className="font-bold text-[#173B32]">{metadata.traveller_name}</span>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-mono text-[#7B4D36] uppercase block">Total Amount Paid</span>
              <span className="font-serif font-black text-xl text-[#173B32]">
                ₹{booking.total_amount || 0}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#7B4D36] uppercase block">Payment Status</span>
              <span className="font-bold text-emerald-800 flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{booking.payment_status}</span>
              </span>
            </div>
          </div>

          {/* Policy Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs">
            <span className="font-bold block">Cancellation Terms:</span>
            <span className="text-[11px] text-emerald-900">
              {booking.refundable
                ? "This booking is eligible for 100% refund up to 48 hours prior to start."
                : "Non-refundable promotional rate."}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E5D5BA] bg-[#EFE5D2]/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 sticky bottom-0 z-20">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-2xl bg-white border border-[#E5D5BA] text-[#173B32] font-semibold text-xs hover:bg-[#FAF7F0] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span>Print Voucher</span>
            </button>

            <Link
              href="/bookings"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-white border border-[#E5D5BA] text-[#173B32] font-semibold text-xs hover:bg-[#FAF7F0] transition-colors flex items-center gap-1.5"
            >
              <span>Booking History</span>
            </Link>
          </div>

          {booking.trip_id ? (
            <Link
              href={`/trips/${booking.trip_id}?tab=bookings`}
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#173B32] hover:bg-[#B65E3C] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <span>View in Trip Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#173B32] hover:bg-[#B65E3C] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
