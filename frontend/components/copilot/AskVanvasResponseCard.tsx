"use client";

import React, { useState } from "react";
import {
  Sparkles,
  MapPin,
  Clock,
  Coins,
  AlertTriangle,
  Compass,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
  Wallet,
  Trash2,
  Utensils,
  Bed,
  ChevronDown,
  ChevronUp,
  Navigation,
  CheckCircle2,
  Info,
  ShieldCheck,
} from "lucide-react";
import {
  StructuredAssistantResponse,
  AssistantActionItem,
} from "@/lib/askVanvasNormalizer";

interface AskVanvasResponseCardProps {
  data: StructuredAssistantResponse;
  onExecuteAction: (actionItem: AssistantActionItem) => void;
  onPlaceClick?: (placeId: string) => void;
}

export const AskVanvasResponseCard: React.FC<AskVanvasResponseCardProps> = ({
  data,
  onExecuteAction,
  onPlaceClick,
}) => {
  const [showMore, setShowMore] = useState(false);

  const hasDetails =
    (data.details?.transit && data.details.transit.length > 0) ||
    (data.details?.food && data.details.food.length > 0) ||
    (data.details?.packing && data.details.packing.length > 0) ||
    (data.details?.prose && data.details.prose.length > 0);

  const renderActionIcon = (icon?: AssistantActionItem["icon"]) => {
    switch (icon) {
      case "plus":
        return <Plus className="w-3.5 h-3.5" />;
      case "refresh":
        return <RefreshCw className="w-3.5 h-3.5" />;
      case "wallet":
        return <Wallet className="w-3.5 h-3.5" />;
      case "bed":
        return <Bed className="w-3.5 h-3.5" />;
      case "food":
        return <Utensils className="w-3.5 h-3.5" />;
      case "map":
        return <MapPin className="w-3.5 h-3.5" />;
      case "trash":
        return <Trash2 className="w-3.5 h-3.5" />;
      case "external":
        return <ExternalLink className="w-3.5 h-3.5" />;
      case "compass":
      default:
        return <Compass className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#FAF7F0] dark:bg-[#1E2620] border border-[#E5D5BA] dark:border-[#384A3E] p-3.5 sm:p-4 shadow-sm space-y-3 font-sans text-[#20211D] dark:text-[#EFE5D2] transition-all">
      {/* 1. QUICK TAKE HEADER & METRICS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#173B32] dark:text-[#B49252]">
            <Sparkles className="w-3 h-3 text-[#B65E3C]" />
            <span>QUICK TAKE</span>
          </div>
          <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#EFE5D2] dark:bg-[#2A382E] text-[#7B4D36] dark:text-[#D8CBB2] border border-[#E5D5BA]/80 dark:border-[#384A3E]">
            {data.provenance}
          </span>
        </div>

        <p className="text-sm sm:text-base font-serif font-bold text-[#173B32] dark:text-[#FAF7F0] leading-snug">
          {data.quickTake.headline}
        </p>

        {/* METRICS ROW */}
        {data.quickTake.metrics && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {data.quickTake.metrics.time && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFE5D2]/70 dark:bg-[#2A382E] text-[11px] font-mono font-medium text-[#7B4D36] dark:text-[#D8CBB2] border border-[#E5D5BA]/60 dark:border-[#384A3E]">
                <Clock className="w-3 h-3" />
                {data.quickTake.metrics.time}
              </span>
            )}
            {data.quickTake.metrics.cost && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFE5D2]/70 dark:bg-[#2A382E] text-[11px] font-mono font-semibold text-[#173B32] dark:text-[#B49252] border border-[#E5D5BA]/60 dark:border-[#384A3E]">
                <Coins className="w-3 h-3 text-[#B65E3C]" />
                {data.quickTake.metrics.cost}
              </span>
            )}
            {data.quickTake.metrics.distance && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFE5D2]/70 dark:bg-[#2A382E] text-[11px] font-mono font-medium text-[#173B32] dark:text-[#FAF7F0] border border-[#E5D5BA]/60 dark:border-[#384A3E]">
                <Navigation className="w-3 h-3 text-[#173B32] dark:text-[#B49252]" />
                {data.quickTake.metrics.distance}
              </span>
            )}
            {data.quickTake.metrics.weather && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFE5D2]/70 dark:bg-[#2A382E] text-[11px] font-mono font-medium text-[#173B32] dark:text-[#FAF7F0] border border-[#E5D5BA]/60 dark:border-[#384A3E]">
                {data.quickTake.metrics.weather}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. BEST FOR TAGS */}
      {data.bestFor && data.bestFor.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono uppercase text-[#7B4D36] dark:text-[#B49252] font-semibold">
            Best for:
          </span>
          {data.bestFor.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full bg-[#FAF7F0] dark:bg-[#172019] text-[11px] font-serif text-[#173B32] dark:text-[#EFE5D2] border border-[#E5D5BA] dark:border-[#384A3E]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 3. TOP PICKS (Clean, Non-Nested List) */}
      {data.topPicks && data.topPicks.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] dark:text-[#D8CBB2] font-bold">
            TOP PICKS
          </div>
          <div className="space-y-1">
            {data.topPicks.map((pick, i) => (
              <div
                key={pick.id || i}
                className="group flex items-center justify-between p-2 rounded-xl bg-[#FAF7F0] dark:bg-[#172019] border border-[#E5D5BA]/70 dark:border-[#2E3C32] hover:border-[#B49252] dark:hover:border-[#B49252] transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded-full bg-[#173B32] dark:bg-[#B49252] text-[#FAF7F0] dark:text-[#172019] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#173B32] dark:text-[#FAF7F0] truncate">
                        {pick.name}
                      </span>
                      {pick.category && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#EFE5D2] dark:bg-[#2A382E] text-[#7B4D36] dark:text-[#D8CBB2]">
                          {pick.category}
                        </span>
                      )}
                      {pick.cost && (
                        <span className="text-[10px] font-mono text-[#B65E3C] font-semibold">
                          {pick.cost}
                        </span>
                      )}
                      {pick.distance && (
                        <span className="text-[10px] font-mono text-[#7B4D36] dark:text-[#D8CBB2]">
                          · {pick.distance}
                        </span>
                      )}
                    </div>
                    {pick.note && (
                      <p className="text-[11px] font-serif text-[#7B4D36] dark:text-[#C5BAA5] truncate leading-tight mt-0.5">
                        {pick.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Micro Action Button on Pick */}
                {(pick.lat && pick.lng) || pick.placeId ? (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {pick.lat && pick.lng && (
                      <button
                        type="button"
                        onClick={() =>
                          onExecuteAction({
                            label: "Directions",
                            action: "directions",
                            payload: { lat: pick.lat, lng: pick.lng, name: pick.name },
                          })
                        }
                        title="Open Directions in Google Maps"
                        className="p-1.5 rounded-lg bg-[#EFE5D2] dark:bg-[#2A382E] hover:bg-[#B49252] hover:text-[#FAF7F0] text-[#173B32] dark:text-[#FAF7F0] transition-colors cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                      </button>
                    )}
                    {pick.placeId && (
                      <button
                        type="button"
                        onClick={() =>
                          onExecuteAction({
                            label: "Add to Trip",
                            action: "add_place_to_itinerary",
                            payload: { place_id: pick.placeId, title: pick.name },
                          })
                        }
                        title="Add to Itinerary"
                        className="p-1.5 rounded-lg bg-[#EFE5D2] dark:bg-[#2A382E] hover:bg-[#173B32] hover:text-[#FAF7F0] text-[#173B32] dark:text-[#FAF7F0] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. WATCH OUT WARNING (Single Alert Strip) */}
      {data.watchOut && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#B65E3C]/10 dark:bg-[#B65E3C]/20 border border-[#B65E3C]/30 text-[#7B4D36] dark:text-[#E8B5A2]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#B65E3C] shrink-0 mt-0.5" />
          <div className="text-xs font-serif leading-snug">
            <span className="font-bold font-mono text-[10px] uppercase text-[#B65E3C] mr-1">
              Watch Out:
            </span>
            {data.watchOut}
          </div>
        </div>
      )}

      {/* 5. PRIMARY ACTIONS (Direct, One-Tap) */}
      {data.primaryActions && data.primaryActions.length > 0 && (
        <div className="pt-1 flex flex-wrap items-center gap-2">
          {data.primaryActions.map((act, i) => {
            const isPrimary = act.variant === "primary" || i === 0;
            const isDanger = act.variant === "danger";

            return (
              <button
                key={i}
                type="button"
                onClick={() => onExecuteAction(act)}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isDanger
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : isPrimary
                    ? "bg-[#173B32] dark:bg-[#B49252] text-[#FAF7F0] dark:text-[#172019] hover:bg-[#20453B] dark:hover:bg-[#C5A260]"
                    : "bg-[#EFE5D2] dark:bg-[#2A382E] text-[#173B32] dark:text-[#FAF7F0] hover:bg-[#E5D5BA] dark:hover:bg-[#384A3E] border border-[#E5D5BA] dark:border-[#384A3E]"
                }`}
              >
                {renderActionIcon(act.icon)}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 6. PROGRESSIVE DISCLOSURE (Show More) */}
      {hasDetails && (
        <div className="pt-1 border-t border-[#E5D5BA]/60 dark:border-[#384A3E]/60">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="w-full py-1 text-xs font-mono font-medium text-[#7B4D36] dark:text-[#D8CBB2] hover:text-[#173B32] dark:hover:text-[#FAF7F0] flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span>{showMore ? "Show less" : "Show more details & transit"}</span>
            {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showMore && (
            <div className="space-y-2 pt-2 text-xs font-serif leading-relaxed text-[#20211D] dark:text-[#D8DED5] animate-fadeIn">
              {data.details?.transit && (
                <div className="space-y-1 p-2 rounded-xl bg-[#FAF7F0] dark:bg-[#172019] border border-[#E5D5BA] dark:border-[#2E3C32]">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#7B4D36] dark:text-[#B49252]">
                    Getting There:
                  </span>
                  {data.details.transit.map((t, idx) => (
                    <p key={idx} className="leading-snug">
                      • {t}
                    </p>
                  ))}
                </div>
              )}

              {data.details?.food && (
                <div className="space-y-1 p-2 rounded-xl bg-[#FAF7F0] dark:bg-[#172019] border border-[#E5D5BA] dark:border-[#2E3C32]">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#173B32] dark:text-[#B49252]">
                    Where to Eat:
                  </span>
                  {data.details.food.map((f, idx) => (
                    <p key={idx} className="leading-snug">
                      • {f}
                    </p>
                  ))}
                </div>
              )}

              {data.details?.packing && (
                <div className="space-y-1 p-2 rounded-xl bg-[#FAF7F0] dark:bg-[#172019] border border-[#E5D5BA] dark:border-[#2E3C32]">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#173B32] dark:text-[#B49252]">
                    Checklist & Packing:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {data.details.packing.map((pk, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-[#EFE5D2] dark:bg-[#2A382E] text-[10.5px] font-mono text-[#173B32] dark:text-[#EFE5D2]"
                      >
                        {pk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.details?.prose && data.details.prose.length > 0 && (
                <div className="space-y-1 p-2">
                  {data.details.prose.map((pr, idx) => (
                    <p key={idx}>{pr}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
