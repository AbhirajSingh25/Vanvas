"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mountain, ArrowRight, Compass, ArrowLeft, Footprints, Check } from "lucide-react";
import { TREK_REGISTRY, TrekItem } from "@/lib/trekContentModel";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { useDensity } from "@/context/DensityContext";

export default function GeneralTrekPlanEntryPoint() {
  const router = useRouter();
  const { isCompact } = useDensity();
  const treks = Object.values(TREK_REGISTRY);
  const [selectedTrek, setSelectedTrek] = useState<TrekItem>(treks[0] || null);

  const handleStartPlanning = (slug: string) => {
    router.push(`/treks/${slug}/plan`);
  };

  return (
    <div className={`min-h-screen bg-[#EFE5D2] text-[#20211D] ${isCompact ? "py-4 sm:py-6" : "py-8 sm:py-12"} px-3 sm:px-6 lg:px-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8CBB2]">
          <Link
            href="/treks"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#7B4D36] hover:text-[#173B32] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trek Directory</span>
          </Link>

          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B65E3C]">
            DEDICATED TREK EXPEDITION PLANNER
          </span>
        </div>

        {/* Title banner */}
        <div className="space-y-1">
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] tracking-tight">
            Select a Trail to Plan Your Expedition
          </h1>
          <p className="text-xs text-[#7B4D36] leading-relaxed">
            Every Himalayan trek features locked trail durations, verified route waypoints, elevation gain curves, gear manifests, and altitude safety protocols.
          </p>
        </div>

        {/* Trek Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {treks.map((t) => {
            const isSelected = selectedTrek?.slug === t.slug;

            return (
              <div
                key={t.slug}
                data-testid="trek-selector-card"
                onClick={() => setSelectedTrek(t)}
                className={`rounded-3xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between group touch-manipulation ${
                  isSelected
                    ? "bg-white border-[#B65E3C] shadow-md ring-2 ring-[#B65E3C]/20"
                    : "bg-[#FAF7F0] border-[#E5D5BA] hover:border-[#173B32] hover:shadow-sm"
                }`}
              >
                <div className="relative h-36 w-full overflow-hidden bg-[#173B32]">
                  <VanvasImage
                    src={t.heroImage}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono font-bold uppercase backdrop-blur-xs">
                      {t.difficulty}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 text-white flex items-center justify-between text-xs font-mono">
                    <span className="text-[#B49252] font-bold">{t.peakAltitudeFormatted}</span>
                    <span>{t.durationDays === 1 ? t.durationHours : `${t.durationDays} Days`}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[10px] font-mono text-[#7B4D36]">{t.region}</div>
                    <h3 className="font-serif font-black text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight">
                      {t.title}
                    </h3>
                    <p className="text-[11px] text-[#7B4D36] line-clamp-2 mt-1">
                      {t.tagline || t.expeditionOverview}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E5D5BA] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#173B32] font-bold">
                      ₹{t.approxBudgetPerPerson.toLocaleString()} / person
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartPlanning(t.slug);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Plan Trek</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
