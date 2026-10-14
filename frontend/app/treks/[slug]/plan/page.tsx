"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mountain, Compass, Calendar, Users, Shield, ShieldAlert,
  ArrowRight, ArrowLeft, Check, AlertTriangle, Sparkles,
  Footprints, MapPin, Backpack, Heart, RefreshCw, Layers,
  CheckCircle2, Clock, DollarSign, ExternalLink
} from "lucide-react";
import {
  TREK_REGISTRY,
  getTrekBySlug,
  TrekItem,
  TrekRouteOption,
  TrekGearItem
} from "@/lib/trekContentModel";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { useAuth } from "@/context/AuthContext";
import { useDensity } from "@/context/DensityContext";
import { api } from "@/lib/api";

export default function DedicatedTrekPlannerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { isCompact } = useDensity();

  const trek = useMemo(() => getTrekBySlug(slug), [slug]);

  // If trek slug is not found in the verified Himalayan registry
  if (!trek) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#EFE5D2]">
        <div className="max-w-md w-full bg-[#FAF7F0] p-8 rounded-3xl border-2 border-[#D8CBB2] shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#B65E3C]/10 text-[#B65E3C] mx-auto flex items-center justify-center">
            <Mountain className="w-7 h-7" />
          </div>
          <h2 className="font-serif font-black text-2xl text-[#173B32]">
            Trek Not Found
          </h2>
          <p className="text-xs text-[#7B4D36] leading-relaxed">
            The requested trek &ldquo;{slug}&rdquo; is not part of the verified Himalayan expedition registry.
          </p>
          <Link
            href="/treks"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider shadow-md hover:bg-[#20453B] transition-all"
          >
            <Compass className="w-4 h-4 text-[#B49252]" />
            <span>Browse Himalayan Trails</span>
          </Link>
        </div>
      </div>
    );
  }

  return <TrekPlannerFlow key={trek.slug} trek={trek} isCompact={isCompact} user={user} router={router} />;
}

interface TrekPlannerFlowProps {
  trek: TrekItem;
  isCompact: boolean;
  user: any;
  router: any;
}

function TrekPlannerFlow({ trek, isCompact, user, router }: TrekPlannerFlowProps) {
  // 5 Dedicated Progressive Steps
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 2: Dates & Party
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [groupSize, setGroupSize] = useState<number>(2);
  const [approachTransport, setApproachTransport] = useState<string>("shared_jeep");

  // Step 3: Readiness & Safety
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "moderate" | "experienced">("moderate");
  const [pacePreference, setPacePreference] = useState<"comfort" | "steady" | "fast">("steady");
  const [guidePreference, setGuidePreference] = useState<"guided" | "independent">("guided");
  const [safetyAcknowledged, setSafetyAcknowledged] = useState<boolean>(false);

  // Step 4: Route & Gear
  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => trek.routes[0]?.id || "default");
  const [rentalSelections, setRentalSelections] = useState<Record<string, "own" | "rent" | "skip">>({});

  // Switch Trek selector modal
  const [isSwitchTrekOpen, setIsSwitchTrekOpen] = useState(false);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Compute calculated end date
  const durationDays = trek.durationDays || 1;
  const endDate = useMemo(() => {
    const s = new Date(startDate);
    s.setDate(s.getDate() + Math.max(0, durationDays - 1));
    return s.toISOString().split("T")[0];
  }, [startDate, durationDays]);

  const activeRoute = useMemo(() => {
    return trek.routes.find((r) => r.id === selectedRouteId) || trek.routes[0];
  }, [trek, selectedRouteId]);

  // Gear Rental Calculation
  const totalGearRentalCost = useMemo(() => {
    return trek.gearChecklist.reduce((sum, item) => {
      const mode = rentalSelections[item.id];
      if (mode === "rent") {
        return sum + (item.rentApproxCostPerDay || 150) * durationDays;
      }
      return sum;
    }, 0);
  }, [trek, rentalSelections, durationDays]);

  // Itemized Estimated Budget
  const estimatedCostBreakdown = useMemo(() => {
    const transportPerPerson = approachTransport === "private_cab" ? 3500 : approachTransport === "self_drive" ? 2200 : 1200;
    const stayPerPerson = (trek.budget?.campStayCostPerNight || 800) * Math.max(1, durationDays);
    const foodPerPerson = (trek.budget?.foodPerDayCost || 600) * durationDays;
    const permitPerPerson = trek.budget?.permitCost || 250;
    const guidePerPerson = guidePreference === "guided" ? Math.round(1500 / Math.max(1, groupSize)) * durationDays : 0;
    const gearRentalPerPerson = Math.round(totalGearRentalCost);

    const totalPerPerson = transportPerPerson + stayPerPerson + foodPerPerson + permitPerPerson + guidePerPerson + gearRentalPerPerson;
    return {
      transport: transportPerPerson,
      stay: stayPerPerson,
      food: foodPerPerson,
      permits: permitPerPerson,
      guide: guidePerPerson,
      gearRental: gearRentalPerPerson,
      totalPerPerson,
      totalGroup: totalPerPerson * groupSize,
    };
  }, [trek, approachTransport, durationDays, guidePreference, groupSize, totalGearRentalCost]);

  // Handle Save Trek Expedition
  const handleSaveExpedition = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const tripPayload = {
        destination_id: trek.destinationSlug || trek.slug,
        title: `${trek.title} Expedition`,
        start_date: startDate,
        end_date: endDate,
        origin_city: trek.baseCamp,
        transport_mode: "trek",
        budget: estimatedCostBreakdown.totalGroup,
        travellers_count: groupSize,
        companion_type: groupSize === 1 ? "Solo" : "Friends",
        travel_style: pacePreference === "comfort" ? "Comfort" : "Balanced",
        wake_up_preference: "Early",
        activity_intensity: "Packed",
        interests: ["Trek", "Mountains", "Alpine", trek.mountainRange],
        planning_mode: "trek",
        transport_details: {
          trek_slug: trek.slug,
          route_id: activeRoute?.id,
          route_name: activeRoute?.name,
          base_camp: trek.baseCamp,
          peak_altitude: trek.peakAltitudeFormatted,
          trail_distance_km: activeRoute?.distanceKm || trek.totalDistanceKm,
          approach_logistics: approachTransport,
          experience_level: experienceLevel,
          guide_mode: guidePreference,
          gear_rentals: rentalSelections,
        },
      };

      const res = await api.createTrip(tripPayload);

      if (res && res.id) {
        router.push(`/trips/${res.id}`);
      } else {
        router.push("/trips");
      }
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save trek expedition. Please try again or sign in.");
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#EFE5D2] text-[#20211D] ${isCompact ? "py-4 sm:py-6" : "py-8 sm:py-12"} px-3 sm:px-6 lg:px-8`}>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Top Breadcrumb & Step Navigation */}
        <div className="flex items-center justify-between pb-2 border-b border-[#D8CBB2]">
          <Link
            href="/treks"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#7B4D36] hover:text-[#173B32] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trek Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
              EXPEDITION PLANNER · STEP {currentStep} OF 5
            </span>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="relative w-full h-2 bg-[#D8CBB2] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#173B32] via-[#B65E3C] to-[#B49252] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* ======================================================== */}
        {/* STEP 1: CONFIRM THE TREK                                */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <div className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-5 sm:p-7 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D5BA] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252] block">
                  STEP 1 • EXPEDITION TARGET
                </span>
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] leading-tight">
                  Confirm Selected Trail
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setIsSwitchTrekOpen(true)}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-[#D8CBB2] bg-white text-[#7B4D36] text-xs font-bold hover:border-[#173B32] hover:text-[#173B32] transition-all cursor-pointer shadow-2xs"
              >
                Change Trek
              </button>
            </div>

            {/* Trek Hero Card */}
            <div className="rounded-2xl border-2 border-[#E5D5BA] overflow-hidden bg-white shadow-xs">
              <div className="relative h-48 sm:h-64 w-full bg-[#173B32] overflow-hidden">
                <VanvasImage
                  src={trek.heroImage}
                  alt={trek.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-black/60 text-[#FAF4E8] text-[10px] font-mono font-bold backdrop-blur-xs uppercase">
                    {trek.region}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-[#FAF4E8] space-y-0.5">
                  <div className="font-devanagari text-xs text-[#B49252] font-semibold">
                    {trek.hindiTitle}
                  </div>
                  <h2 className="font-serif font-black text-xl sm:text-2xl leading-tight">
                    {trek.title}
                  </h2>
                  <p className="text-[11px] font-mono text-[#D8DED5]">
                    Base: {trek.baseCamp} · Summit: {trek.peakAltitudeFormatted}
                  </p>
                </div>
              </div>

              {/* Verified Metrics Strip */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F0] border-t border-[#E5D5BA] text-center">
                <div className="space-y-0.5">
                  <span className="text-[9.5px] font-mono text-[#7B4D36] uppercase font-bold block">Difficulty</span>
                  <span className="font-serif font-bold text-xs text-[#173B32]">{trek.difficulty}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] font-mono text-[#7B4D36] uppercase font-bold block">Peak Altitude</span>
                  <span className="font-serif font-bold text-xs text-[#173B32]">{trek.peakAltitudeFormatted}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] font-mono text-[#7B4D36] uppercase font-bold block">Distance</span>
                  <span className="font-serif font-bold text-xs text-[#173B32]">{trek.totalDistanceKm} km trail</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] font-mono text-[#7B4D36] uppercase font-bold block">Standard Time</span>
                  <span className="font-serif font-bold text-xs text-[#173B32]">
                    {trek.durationDays === 1 ? trek.durationHours : `${trek.durationDays} Days`}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#7B4D36] leading-relaxed font-sans">
              {trek.expeditionOverview}
            </p>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold uppercase tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Dates &amp; Party</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: DATES AND PARTY                                  */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <div className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-5 sm:p-7 shadow-md space-y-6">
            <div className="border-b border-[#E5D5BA] pb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252] block">
                STEP 2 • EXPEDITION TIMELINE &amp; CREW
              </span>
              <h2 className="font-serif font-black text-2xl text-[#173B32] leading-tight">
                When and who is trekking?
              </h2>
            </div>

            {/* Start Date & Trail Duration */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[#7B4D36] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#B65E3C]" />
                <span>Expedition Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#D8CBB2] bg-white font-mono text-xs text-[#173B32] focus:outline-none focus:ring-2 focus:ring-[#173B32]"
              />
              <div className="text-[11px] font-mono text-[#536B52] bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                Trail schedule: {startDate} → {endDate} ({durationDays === 1 ? trek.durationHours : `${durationDays} Days locked to verified trail route`})
              </div>
            </div>

            {/* Group Size */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[#7B4D36] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#B65E3C]" />
                <span>Group Size ({groupSize} {groupSize === 1 ? "Hiker" : "Hikers"})</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGroupSize(num)}
                    className={`py-2.5 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                      groupSize === num
                        ? "bg-[#173B32] text-white border-[#173B32] shadow-xs"
                        : "bg-white text-[#173B32] border-[#D8CBB2] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    {num === 1 ? "Solo" : `${num} Hikers`}
                  </button>
                ))}
              </div>
            </div>

            {/* Approach Logistics to Base Camp */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[#7B4D36] flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#B65E3C]" />
                <span>Approach Logistics to Base Camp ({trek.baseCamp})</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "shared_jeep", title: "Shared Mountain Sumo", sub: "Most popular & budget friendly" },
                  { id: "private_cab", title: "Private Cab Transfer", sub: "Flexible timings directly to trailhead" },
                  { id: "self_drive", title: "Self Drive / Own Vehicle", sub: "Drive yourself to the roadhead" },
                ].map((log) => (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setApproachTransport(log.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      approachTransport === log.id
                        ? "bg-white border-[#B65E3C] shadow-xs ring-1 ring-[#B65E3C]/30"
                        : "bg-white border-[#E5D5BA] hover:border-[#173B32]"
                    }`}
                  >
                    <div className="font-serif font-bold text-xs text-[#173B32]">{log.title}</div>
                    <div className="text-[10px] text-[#7B4D36] mt-0.5">{log.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#E5D5BA]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-3 px-4 rounded-xl border border-[#D8CBB2] text-[#173B32] text-xs font-bold hover:bg-[#EFE5D2] transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Readiness &amp; Safety</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: TREK READINESS & SAFETY                          */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <div className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-5 sm:p-7 shadow-md space-y-6">
            <div className="border-b border-[#E5D5BA] pb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252] block">
                STEP 3 • READINESS &amp; MOUNTAIN PROTOCOL
              </span>
              <h2 className="font-serif font-black text-2xl text-[#173B32] leading-tight">
                Trail Readiness &amp; Acclimatisation
              </h2>
            </div>

            {/* High Altitude Safety Warning */}
            {trek.peakAltitudeMeters >= 3000 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-serif font-bold text-sm text-amber-900">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>High Altitude Notice ({trek.peakAltitudeFormatted})</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-sans">
                  Risk Level: <strong className="font-bold">{trek.altitudeRiskIndicator}</strong>.
                  Stay thoroughly hydrated with 3–4L water daily. Never rush altitude gains. If experiencing dizziness, persistent headache, or breathlessness at rest, descend immediately.
                </p>
              </div>
            )}

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[#7B4D36]">
                Your Alpine Experience Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "beginner", title: "First Himalayan Trail", desc: "No previous high altitude experience" },
                  { id: "moderate", title: "Moderate Hiker", desc: "Comfortable with 5–7 hrs continuous hiking" },
                  { id: "experienced", title: "Alpine Experienced", desc: "Comfortable on scree, snow & ridge traverses" },
                ].map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setExperienceLevel(exp.id as any)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      experienceLevel === exp.id
                        ? "bg-white border-[#B65E3C] shadow-xs ring-1 ring-[#B65E3C]/30"
                        : "bg-white border-[#E5D5BA] hover:border-[#173B32]"
                    }`}
                  >
                    <div className="font-serif font-bold text-xs text-[#173B32]">{exp.title}</div>
                    <div className="text-[10px] text-[#7B4D36] mt-0.5">{exp.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Guided vs Independent */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold uppercase text-[#7B4D36]">
                Expedition Guidance &amp; Regulations
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setGuidePreference("guided")}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    guidePreference === "guided"
                      ? "bg-white border-[#B65E3C] shadow-xs ring-1 ring-[#B65E3C]/30"
                      : "bg-white border-[#E5D5BA] hover:border-[#173B32]"
                  }`}
                >
                  <div className="font-serif font-bold text-xs text-[#173B32]">Certified Local Guide</div>
                  <div className="text-[10px] text-[#7B4D36] mt-0.5">Recommended for weather changes &amp; route safety</div>
                </button>

                <button
                  type="button"
                  onClick={() => setGuidePreference("independent")}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    guidePreference === "independent"
                      ? "bg-white border-[#B65E3C] shadow-xs ring-1 ring-[#B65E3C]/30"
                      : "bg-white border-[#E5D5BA] hover:border-[#173B32]"
                  }`}
                >
                  <div className="font-serif font-bold text-xs text-[#173B32]">Self-Navigated / Independent</div>
                  <div className="text-[10px] text-[#7B4D36] mt-0.5">Requires verified offline maps &amp; mountain experience</div>
                </button>
              </div>

              {trek.fieldIntelligence?.localGuideRule && (
                <div className="text-[10px] font-mono text-[#7B4D36] bg-[#EFE5D2] p-2.5 rounded-xl">
                  Rule: {trek.fieldIntelligence.localGuideRule}
                </div>
              )}
            </div>

            {/* Safety Protocol Acknowledgement */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#D8CBB2] cursor-pointer">
              <input
                type="checkbox"
                checked={safetyAcknowledged}
                onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#B65E3C] focus:ring-[#B65E3C]"
              />
              <span className="text-xs text-[#173B32] font-medium leading-relaxed">
                I understand Himalayan mountain conditions change rapidly. I will carry adequate warm layers, offline trail waypoints, and prioritize altitude acclimatisation.
              </span>
            </label>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#E5D5BA]">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-3 px-4 rounded-xl border border-[#D8CBB2] text-[#173B32] text-xs font-bold hover:bg-[#EFE5D2] transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Route &amp; Gear</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: ROUTE AND GEAR                                   */}
        {/* ======================================================== */}
        {currentStep === 4 && (
          <div className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-5 sm:p-7 shadow-md space-y-6">
            <div className="border-b border-[#E5D5BA] pb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252] block">
                STEP 4 • ROUTE VARIANT &amp; GEAR MANIFEST
              </span>
              <h2 className="font-serif font-black text-2xl text-[#173B32] leading-tight">
                Select Route &amp; Gear Checklist
              </h2>
            </div>

            {/* Route Options Selection */}
            {trek.routes && trek.routes.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-[#7B4D36] flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-[#B65E3C]" />
                  <span>Choose Route Option</span>
                </label>
                <div className="space-y-2.5">
                  {trek.routes.map((rt) => (
                    <div
                      key={rt.id}
                      onClick={() => setSelectedRouteId(rt.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedRouteId === rt.id
                          ? "bg-white border-[#B65E3C] shadow-sm ring-1 ring-[#B65E3C]/30"
                          : "bg-white border-[#E5D5BA] hover:border-[#173B32]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-sm text-[#173B32]">{rt.name}</h4>
                        <span className="text-[10px] font-mono font-bold text-[#B65E3C] bg-[#B65E3C]/10 px-2 py-0.5 rounded-full">
                          {rt.distanceKm} km · {rt.estimatedTime}
                        </span>
                      </div>
                      <p className="text-xs text-[#7B4D36] mt-1 line-clamp-2">{rt.summary}</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-[#536B52] mt-2 pt-2 border-t border-[#E5D5BA]">
                        <span>Trailhead: {rt.trailhead}</span>
                        <span>·</span>
                        <span>Technical: {rt.technicalExposure}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Gear Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold uppercase text-[#7B4D36] flex items-center gap-1.5">
                  <Backpack className="w-4 h-4 text-[#B65E3C]" />
                  <span>Essential Gear &amp; Rental Manifest</span>
                </label>
                {totalGearRentalCost > 0 && (
                  <span className="text-[11px] font-mono font-bold text-[#B65E3C]">
                    Rental Total: ₹{totalGearRentalCost}
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {trek.gearChecklist.map((item) => {
                  const currentChoice = rentalSelections[item.id] || "own";

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white border border-[#E5D5BA] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-serif font-bold text-[#173B32] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#7B4D36] font-mono">
                          {item.priority} · {item.rentApproxCostPerDay ? `Rent approx ₹${item.rentApproxCostPerDay}/day` : "Buy only"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setRentalSelections((prev) => ({ ...prev, [item.id]: "own" }))}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                            currentChoice === "own"
                              ? "bg-[#173B32] text-white"
                              : "bg-[#EFE5D2] text-[#7B4D36] hover:bg-[#D8CBB2]"
                          }`}
                        >
                          I Have
                        </button>
                        {item.rentApproxCostPerDay > 0 && (
                          <button
                            type="button"
                            onClick={() => setRentalSelections((prev) => ({ ...prev, [item.id]: "rent" }))}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                              currentChoice === "rent"
                                ? "bg-[#B65E3C] text-white"
                                : "bg-[#EFE5D2] text-[#7B4D36] hover:bg-[#D8CBB2]"
                            }`}
                          >
                            Rent (₹{item.rentApproxCostPerDay}/d)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#E5D5BA]">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="py-3 px-4 rounded-xl border border-[#D8CBB2] text-[#173B32] text-xs font-bold hover:bg-[#EFE5D2] transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Review Expedition Summary</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 5: REVIEW THE EXPEDITION                            */}
        {/* ======================================================== */}
        {currentStep === 5 && (
          <div className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-5 sm:p-7 shadow-md space-y-6">
            <div className="border-b border-[#E5D5BA] pb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252] block">
                STEP 5 • EXPEDITION MANIFEST &amp; PERSISTENCE
              </span>
              <h2 className="font-serif font-black text-2xl text-[#173B32] leading-tight">
                Review &amp; Save Trek Plan
              </h2>
            </div>

            {/* Expedition Header Summary */}
            <div className="p-4 rounded-2xl bg-[#173B32] text-[#FAF4E8] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#B49252]">
                <span>{trek.mountainRange}</span>
                <span>{trek.peakAltitudeFormatted}</span>
              </div>
              <h3 className="font-serif font-black text-xl text-white">{trek.title}</h3>
              <div className="text-xs text-[#D8DED5] flex flex-wrap items-center gap-3 font-mono pt-1">
                <span>{startDate} → {endDate}</span>
                <span>·</span>
                <span>{durationDays === 1 ? trek.durationHours : `${durationDays} Days`}</span>
                <span>·</span>
                <span>{groupSize} {groupSize === 1 ? "Solo Hiker" : "Hikers"}</span>
              </div>
            </div>

            {/* Route & Waypoint Sequence */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#173B32] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#B65E3C]" />
                <span>Trail Route: {activeRoute?.name || "Standard Trail"}</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-white border border-[#E5D5BA] space-y-2">
                <div className="text-xs text-[#7B4D36] font-mono">
                  Approach: {approachTransport.replace(/_/g, " ").toUpperCase()} to {trek.baseCamp}
                </div>
                {trek.waypoints && trek.waypoints.length > 0 && (
                  <div className="pt-2 border-t border-[#E5D5BA] flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                    {trek.waypoints.slice(0, 5).map((wp, i) => (
                      <React.Fragment key={wp.id || i}>
                        <span className="px-2 py-0.5 rounded bg-[#EFE5D2] text-[#173B32] font-semibold">
                          {wp.name} ({wp.elevationFormatted})
                        </span>
                        {i < Math.min(trek.waypoints.length, 5) - 1 && <span className="text-[#B65E3C]">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Estimated Itemized Cost Breakdown */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#173B32] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#B65E3C]" />
                <span>Itemized Estimated Budget</span>
              </h4>
              <div className="p-4 rounded-2xl bg-white border border-[#E5D5BA] space-y-2 text-xs">
                <div className="flex justify-between text-[#7B4D36]">
                  <span>Approach Transport (Sumo/Cab share):</span>
                  <span className="font-mono font-bold text-[#173B32]">₹{estimatedCostBreakdown.transport} / person</span>
                </div>
                <div className="flex justify-between text-[#7B4D36]">
                  <span>Camp / Base Stay ({durationDays} days):</span>
                  <span className="font-mono font-bold text-[#173B32]">₹{estimatedCostBreakdown.stay} / person</span>
                </div>
                <div className="flex justify-between text-[#7B4D36]">
                  <span>Trail Meals &amp; Hydration:</span>
                  <span className="font-mono font-bold text-[#173B32]">₹{estimatedCostBreakdown.food} / person</span>
                </div>
                {estimatedCostBreakdown.gearRental > 0 && (
                  <div className="flex justify-between text-[#7B4D36]">
                    <span>Gear Rentals (Rented items):</span>
                    <span className="font-mono font-bold text-[#173B32]">₹{estimatedCostBreakdown.gearRental}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#7B4D36]">
                  <span>Forest &amp; Trail Permits:</span>
                  <span className="font-mono font-bold text-[#173B32]">₹{estimatedCostBreakdown.permits} / person</span>
                </div>
                <div className="pt-2 border-t border-[#E5D5BA] flex justify-between font-serif font-bold text-sm text-[#173B32]">
                  <span>Total Estimated Expedition Budget:</span>
                  <span className="text-[#B65E3C] font-mono text-base">₹{estimatedCostBreakdown.totalGroup.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Error Message if Save Fails */}
            {saveError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Unable to Save Expedition</span>
                </div>
                <p className="mt-1 text-red-700">{saveError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#E5D5BA]">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="py-3 px-4 rounded-xl border border-[#D8CBB2] text-[#173B32] text-xs font-bold hover:bg-[#EFE5D2] transition-colors cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSaveExpedition}
                disabled={saving}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#B49252]" />
                    <span>Saving Trek Expedition...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#B49252]" />
                    <span>Save Trek Expedition to Journeys</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Change Trek Modal */}
        {isSwitchTrekOpen && (
          <div className="fixed inset-0 z-50 bg-[#173B32]/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#E5D5BA] pb-3">
                <h3 className="font-serif font-black text-lg text-[#173B32]">
                  Select Himalayan Trail
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSwitchTrekOpen(false)}
                  className="text-xs font-mono font-bold text-[#7B4D36] hover:text-[#173B32] cursor-pointer"
                >
                  Close ✕
                </button>
              </div>

              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {Object.values(TREK_REGISTRY).map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => {
                      setIsSwitchTrekOpen(false);
                      router.push(`/treks/${t.slug}/plan`);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      t.slug === trek.slug
                        ? "bg-white border-[#B65E3C] shadow-xs ring-1 ring-[#B65E3C]/30"
                        : "bg-white border-[#E5D5BA] hover:border-[#173B32]"
                    }`}
                  >
                    <div>
                      <div className="font-serif font-bold text-xs text-[#173B32]">{t.title}</div>
                      <div className="text-[10px] text-[#7B4D36] font-mono">
                        {t.region} · {t.peakAltitudeFormatted} · {t.difficulty}
                      </div>
                    </div>
                    {t.slug === trek.slug && (
                      <Check className="w-4 h-4 text-[#B65E3C] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
