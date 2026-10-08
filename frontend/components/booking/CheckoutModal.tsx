"use client";

import React, { useState, useEffect } from "react";
import {
  X, Sparkles, ShieldCheck, CreditCard, Lock, CheckCircle2,
  AlertCircle, RefreshCw, Calendar, Users, Home, MapPin,
  Clock, ArrowRight, ExternalLink, Shield, Info, HelpCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { Booking, BookingCheckoutPayload, Offer, TripSummary } from "@/types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | {
    provider?: string | null;
    provider_offer_id?: string | null;
    product_type?: string | null; // stay, transport, rental, activity
    title: string;
    destination: string;
    unit_price: number;
    price_formatted?: string | null;
    image_url?: string | null;
    cancellation_policy?: string | null;
    refundable?: boolean | null;
    check_in?: string | null;
    check_out?: string | null;
  } | null;
  initialTripId?: string;
  userEmail?: string;
  userName?: string;
  onBookingSuccess: (booking: Booking) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  offer,
  initialTripId,
  userEmail = "",
  userName = "",
  onBookingSuccess,
}: CheckoutModalProps) {
  // Form State
  const [travellerName, setTravellerName] = useState(userName || "");
  const [travellerEmail, setTravellerEmail] = useState(userEmail || "");
  const [travellerPhone, setTravellerPhone] = useState("");
  const [checkInDate, setCheckInDate] = useState(offer?.check_in || "");
  const [checkOutDate, setCheckOutDate] = useState(offer?.check_out || "");
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string>(initialTripId || "");
  const [userTrips, setUserTrips] = useState<TripSummary[]>([]);

  // Execution & Step State
  // steps: 'review' | 'verifying' | 'paying' | 'confirming' | 'timeout_reconciling' | 'error'
  const [currentStep, setCurrentStep] = useState<string>("review");
  const [stepMessage, setStepMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  // Initialize idempotency key and default dates on open
  useEffect(() => {
    if (isOpen && offer) {
      const uniqueKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setIdempotencyKey(uniqueKey);
      setCurrentStep("review");
      setErrorMessage(null);

      // Default dates to next weekend if not set
      if (!checkInDate) {
        const d1 = new Date();
        d1.setDate(d1.getDate() + 3);
        const d2 = new Date();
        d2.setDate(d2.getDate() + 5);
        setCheckInDate(d1.toISOString().split("T")[0]);
        setCheckOutDate(d2.toISOString().split("T")[0]);
      }

      // Track analytics
      trackEvent("booking_checkout_opened", {
        offer_title: offer.title,
        destination: offer.destination,
        provider: offer.provider || "sandbox_stay",
      });

      // Load user trips for attachment selector
      api.getTrips()
        .then((trips) => setUserTrips(trips || []))
        .catch(() => {});
    }
  }, [isOpen, offer]);

  if (!isOpen || !offer) return null;

  // Calculate pricing breakdown
  const calculateNights = (): number => {
    if (!checkInDate || !checkOutDate) return 1;
    const diff = Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const nights = calculateNights();
  const unitPrice = offer.unit_price ?? 0;
  const destinationName = offer.destination || "Destination";
  const baseRate = unitPrice * nights * roomsCount;
  const taxes = Math.round(baseRate * 0.12); // 12% GST
  const serviceFee = Math.round(baseRate * 0.02); // 2% Vanvas Platform Fee
  const totalPayable = baseRate + taxes + serviceFee;

  // Handle Checkout & Payment Execution
  const handleExecuteBooking = async () => {
    if (!offer) return;
    if (!travellerName.trim() || !travellerEmail.trim()) {
      setErrorMessage("Please enter the primary traveller's full name and email address.");
      return;
    }

    setErrorMessage(null);
    setCurrentStep("verifying");
    setStepMessage("Verifying real-time availability and provider rates...");

    trackEvent("booking_availability_checked", {
      destination: destinationName,
      offer_title: offer.title,
    });

    try {
      // 1. Initiate Checkout via API (Revalidates price & creates booking in PAYMENT_REQUIRED)
      const payload: BookingCheckoutPayload = {
        trip_id: selectedTripId || null,
        provider: offer.provider || "sandbox_stay",
        provider_offer_id: offer.provider_offer_id || `sbox-${destinationName.toLowerCase()}`,
        booking_type: offer.product_type || "stay",
        title: offer.title,
        destination: destinationName,
        check_in: checkInDate,
        check_out: checkOutDate,
        guests: guestsCount,
        rooms: roomsCount,
        traveller_name: travellerName,
        traveller_email: travellerEmail,
        traveller_phone: travellerPhone,
        special_requests: specialRequests,
        unit_price: unitPrice,
        idempotency_key: idempotencyKey,
      };

      const booking = await api.initiateCheckout(payload);
      setCreatedBooking(booking);

      trackEvent("booking_created", {
        booking_id: booking.id,
        public_ref: booking.public_booking_reference,
        total_amount: booking.total_amount,
      });

      // 2. Initiate Payment Order
      setCurrentStep("paying");
      setStepMessage("Preparing secure transaction order...");

      trackEvent("booking_payment_started", {
        booking_id: booking.id,
        gateway: "vanvas_pay_sandbox",
      });

      const paymentOrder = await api.initiatePayment(
        booking.id,
        "vanvas_pay_sandbox",
        `pay_${idempotencyKey}`
      );

      // 3. Confirm and Verify Payment
      setCurrentStep("confirming");
      setStepMessage("Processing transaction and securing reservation...");

      const paymentId = paymentOrder.checkout_payload?.sandbox_simulated_payment_id || `pay_${paymentOrder.order_id}`;
      const signature = paymentOrder.checkout_payload?.sandbox_simulated_signature;

      const verifyRes = await api.verifyPayment(booking.id, {
        gateway_order_id: paymentOrder.order_id,
        gateway_payment_id: paymentId,
        gateway_signature: signature,
        payment_transaction_id: paymentOrder.payment_transaction_id,
      });

      trackEvent("booking_payment_succeeded", {
        booking_id: booking.id,
        public_ref: verifyRes.public_booking_reference,
      });

      trackEvent("booking_confirmed", {
        booking_id: booking.id,
        public_ref: verifyRes.public_booking_reference,
      });

      onBookingSuccess(verifyRes.booking);
    } catch (err: any) {
      console.error("Booking execution error:", err);
      // Check if timeout happened during processing
      if (currentStep === "paying" || currentStep === "confirming") {
        setCurrentStep("timeout_reconciling");
        setStepMessage("Checking your transaction status with VANVAS servers...");
        // Reconcile status
        if (createdBooking) {
          try {
            const reconcileRes = await api.reconcileBooking(createdBooking.id);
            if (reconcileRes.booking.status === "CONFIRMED") {
              onBookingSuccess(reconcileRes.booking);
              return;
            }
          } catch {}
        }
      }

      trackEvent("booking_payment_failed", {
        offer_title: offer?.title || "Booking",
        error: err.message,
      });

      setCurrentStep("error");
      setErrorMessage(err.message || "Unable to complete transaction. No amount was charged.");
    }
  };

  if (!isOpen || !offer) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0F2924]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Modal Header — Explorer's Desk Style */}
        <div className="p-5 sm:p-6 border-b border-[#E5D5BA] bg-[#EFE5D2]/70 flex items-start justify-between gap-4 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#173B32] text-[#EFE5D2]">
                VANVAS Travel Execution
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#B65E3C] text-white">
                Live Verification
              </span>
            </div>
            <h2 className="font-serif font-black text-xl sm:text-2xl text-[#173B32] mt-1">
              You&rsquo;re about to execute your trip
            </h2>
            <p className="text-xs text-[#7B4D36] font-light mt-0.5">
              Authoritative reservation, transparent pricing, and instant trip sync.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={currentStep === "verifying" || currentStep === "paying" || currentStep === "confirming"}
            className="p-2 rounded-full hover:bg-[#E5D5BA] text-[#7B4D36] transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Processing Stepper */}
          {(currentStep === "verifying" || currentStep === "paying" || currentStep === "confirming" || currentStep === "timeout_reconciling") && (
            <div className="p-6 rounded-2xl bg-[#EFE5D2] border-2 border-[#B65E3C] text-center space-y-4 animate-pulse">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#173B32] text-[#EFE5D2] flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-[#B49252]" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#173B32]">
                  {currentStep === "timeout_reconciling" ? "Checking Booking Status..." : "Securing Your Reservation"}
                </h3>
                <p className="text-xs text-[#7B4D36] mt-1 font-mono">
                  {stepMessage}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono text-[#7B4D36]">
                <div className={`p-2 rounded-lg ${currentStep === "verifying" ? "bg-[#173B32] text-[#EFE5D2] font-bold" : "bg-white/60"}`}>
                  1. Live Check
                </div>
                <div className={`p-2 rounded-lg ${currentStep === "paying" ? "bg-[#173B32] text-[#EFE5D2] font-bold" : "bg-white/60"}`}>
                  2. Payment Prep
                </div>
                <div className={`p-2 rounded-lg ${currentStep === "confirming" ? "bg-[#173B32] text-[#EFE5D2] font-bold" : "bg-white/60"}`}>
                  3. Reservation
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Transaction Notice</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Offer Summary Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#B65E3C] font-semibold tracking-wider">
                {offer.product_type || "Accommodation"} • {offer.destination}
              </span>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#173B32]">
                {offer.title}
              </h3>
              <p className="text-xs text-[#7B4D36] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Verified Himalayan Property</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Base Rate</span>
              <span className="font-serif font-bold text-lg text-[#B65E3C]">
                ₹{offer.unit_price}
                <span className="text-xs text-[#7B4D36] font-normal">/night</span>
              </span>
            </div>
          </div>

          {/* Date & Occupancy Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-2">
              <label className="text-[11px] font-mono uppercase font-bold text-[#173B32] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Check-in &amp; Check-out</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#7B4D36] block">Check-in</span>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-semibold text-xs mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#7B4D36] block">Check-out</span>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-semibold text-xs mt-0.5"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-2">
              <label className="text-[11px] font-mono uppercase font-bold text-[#173B32] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#B65E3C]" />
                <span>Travellers &amp; Units</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#7B4D36] block">Guests</span>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-semibold text-xs mt-0.5"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-[#7B4D36] block">Rooms</span>
                  <select
                    value={roomsCount}
                    onChange={(e) => setRoomsCount(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-semibold text-xs mt-0.5"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "Room" : "Rooms"}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Traveller Information */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-3">
            <h4 className="font-serif font-bold text-sm text-[#173B32] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Primary Traveller Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-[#7B4D36] block">Full Legal Name *</label>
                <input
                  type="text"
                  value={travellerName}
                  onChange={(e) => setTravellerName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-medium text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#7B4D36] block">Email Address (for voucher) *</label>
                <input
                  type="email"
                  value={travellerEmail}
                  onChange={(e) => setTravellerEmail(e.target.value)}
                  placeholder="aarav@example.com"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-medium text-xs mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-[#7B4D36] block">Mobile Phone (WhatsApp confirmations)</label>
                <input
                  type="tel"
                  value={travellerPhone}
                  onChange={(e) => setTravellerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] text-[#173B32] font-medium text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Attach to Trip Context (Optional) */}
          {userTrips.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#EFE5D2]/50 border border-[#E5D5BA] space-y-2">
              <label className="text-[11px] font-mono uppercase font-bold text-[#173B32] block">
                Attach to Trip Workspace (Optional)
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-[#E5D5BA] text-[#173B32] text-xs font-semibold"
              >
                <option value="">No Trip (Standalone Booking)</option>
                {userTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} • {t.destination_name || (t.destination as any)?.name || "Himalayas"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Authoritative Price Breakdown */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-2.5">
            <h4 className="font-serif font-bold text-sm text-[#173B32]">
              Authoritative Price Breakdown
            </h4>

            <div className="space-y-1.5 text-xs text-[#7B4D36]">
              <div className="flex items-center justify-between">
                <span>Room Rate ({nights} {nights === 1 ? "night" : "nights"} × {roomsCount} {roomsCount === 1 ? "room" : "rooms"})</span>
                <span className="font-semibold text-[#173B32]">₹{baseRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Goods &amp; Services Tax (12% GST)</span>
                <span className="font-semibold text-[#173B32]">₹{taxes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>VANVAS Protection &amp; Booking Guarantee (2%)</span>
                <span className="font-semibold text-[#173B32]">₹{serviceFee}</span>
              </div>
              <div className="pt-2 border-t border-[#E5D5BA] flex items-center justify-between text-sm">
                <span className="font-serif font-bold text-[#173B32]">Total Payable Amount</span>
                <span className="font-serif font-black text-xl text-[#B65E3C]">₹{totalPayable}</span>
              </div>
            </div>
          </div>

          {/* Cancellation Policy Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Cancellation &amp; Refund Policy</span>
              <span className="text-[11px] text-emerald-800">
                {offer.cancellation_policy || "Free cancellation up to 48 hours before check-in with 100% instant refund."}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer — Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-[#E5D5BA] bg-[#EFE5D2]/70 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="text-left w-full sm:w-auto">
            <span className="text-[10px] font-mono uppercase text-[#7B4D36] block">Final Authoritative Total</span>
            <span className="font-serif font-black text-xl text-[#173B32]">₹{totalPayable}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={currentStep === "verifying" || currentStep === "paying" || currentStep === "confirming"}
              className="w-1/3 sm:w-auto px-4 py-3 rounded-2xl border border-[#E5D5BA] text-[#173B32] font-semibold text-xs hover:bg-[#E5D5BA] transition-colors cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              onClick={handleExecuteBooking}
              disabled={currentStep === "verifying" || currentStep === "paying" || currentStep === "confirming"}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-[#173B32] hover:bg-[#B65E3C] text-[#EFE5D2] font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4 text-[#B49252]" />
              <span>Confirm &amp; Pay ₹{totalPayable}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
