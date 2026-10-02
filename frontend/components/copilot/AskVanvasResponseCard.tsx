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
  AssistantItem,
  ActionContract,
} from "@/lib/askVanvasNormalizer";

interface AskVanvasResponseCardProps {
  data: StructuredAssistantResponse;
  onExecuteAction: (actionItem: ActionContract) => void;
  onPlaceClick?: (placeId: string) => void;
}

export const AskVanvasResponseCard: React.FC<AskVanvasResponseCardProps> = ({
  data,
  onExecuteAction,
  onPlaceClick,
}) => {
  const [showMore, setShowMore] = useState(false);

  const hasDetails = Boolean(
    data.details?.morePicks?.length ||
    data.details?.transit?.length ||
    data.details?.packing?.length ||
    data.details?.itineraryDiff?.length ||
    data.details?.notes?.length
  );

  const renderActionIcon = (icon?: ActionContract["icon"]) => {
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
      case "directions":
        return <Navigation className="w-3.5 h-3.5" />;
      case "external":
        return <ExternalLink className="w-3.5 h-3.5" />;
      case "compass":
      default:
        return <Compass className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#FAF7F0] dark:bg-[#1E2620] border border-[#E5D5BA] dark:border-[#384A3E] p-3.5 sm:p-4 shadow-sm space-y-3 font-sans text-[#20211D] dark:text-[#EFE5D2] transition-all animate-vanvas-slide-up">
      {/* 1. HEADER: TYPE TITLE + PROVENANCE BADGE */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#173B32] dark:text-[#B49252]">
            <Sparkles className="w-3 h-3 text-[#B65E3C]" />
            <span>{data.title}</span>
          </div>
          <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#EFE5D2] dark:bg-[#2A382E] text-[#7B4D36] dark:text-[#D8CBB2] border border-[#E5D5BA]/80 dark:border-[#384A3E]">
            {data.provenance}
          </span>
        </div>

        {/* 1 Short Summary Line */}
        <p className="text-xs sm:text-sm font-serif text-[#7B4D36] dark:text-[#D8CBB2] leading-snug">
          {data.summary}
        </p>

        {/* Metrics Row if present */}
        {data.context?.metrics && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {data.context.metrics.weather && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFE5D2]/70 dark:bg-[#2A382E] text-[11px] font-mono font-medium text-[#173B32] dark:text-[#FAF7F0] border border-[#E5D5BA]/60 dark:border-[#384A3E]">
                {data.context.metrics.weather}
              </span>
            )}
            {data.context.metrics.time && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFE5D2]/70 dark:bg-[#2A382E] text-[11px] font-mono font-medium text-[#7B4D36] dark:text-[#D8CBB2] border border-[#E5D5BA]/60 dark:border-[#384A3E]">
                <Clock className="w-3 h-3" />
                {data.context.metrics.time}
              </span>
            )}
            {data.context.metrics.cost && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFE5D2]/70 dark:bg-[#2A382E] text-[11px] font-mono font-semibold text-[#173B32] dark:text-[#B49252] border border-[#E5D5BA]/60 dark:border-[#384A3E]">
                <Coins className="w-3 h-3 text-[#B65E3C]" />
                {data.context.metrics.cost}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. TOP PICKS / ITEMS (3-4 Items Maximum) */}
      {data.items && data.items.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7B4D36] dark:text-[#D8CBB2] font-bold">
            TOP PICKS
          </div>
          <div className="space-y-1">
            {data.items.map((item, i) => (
              <div
                key={item.id || i}
                className="group flex items-center justify-between p-2 rounded-xl bg-[#FAF7F0] dark:bg-[#172019] border border-[#E5D5BA]/70 dark:border-[#2E3C32] hover:border-[#B49252] dark:hover:border-[#B49252] transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded-full bg-[#173B32] dark:bg-[#B49252] text-[#FAF7F0] dark:text-[#172019] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#173B32] dark:text-[#FAF7F0] truncate">
                        {item.name}
                      </span>
                      {item.category && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#EFE5D2] dark:bg-[#2A382E] text-[#7B4D36] dark:text-[#D8CBB2]">
                          {item.category}
                        </span>
                      )}
                      {item.cost && (
                        <span className="text-[10px] font-mono text-[#B65E3C] font-semibold">
                          {item.cost}
                        </span>
                      )}
                      {item.distance && (
                        <span className="text-[10px] font-mono text-[#7B4D36] dark:text-[#D8CBB2]">
                          · {item.distance}
                        </span>
                      )}
                    </div>
                    {item.reason && (
                      <p className="text-[11px] font-serif text-[#7B4D36] dark:text-[#C5BAA5] truncate leading-tight mt-0.5">
                        {item.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Micro Action Button on Item */}
                {(item.lat && item.lng) || item.placeId ? (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {item.lat && item.lng && (
                      <button
                        type="button"
                        onClick={() =>
                          onExecuteAction({
                            id: `dir-${item.id || i}`,
                            label: "Directions",
                            action: "directions",
                            payload: { lat: item.lat, lng: item.lng, name: item.name },
                          })
                        }
                        title="Open Directions in Maps"
                        className="p-1.5 rounded-lg bg-[#EFE5D2] dark:bg-[#2A382E] hover:bg-[#B49252] hover:text-[#FAF7F0] text-[#173B32] dark:text-[#FAF7F0] transition-colors cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                      </button>
                    )}
                    {item.placeId && (
                      <button
                        type="button"
                        onClick={() =>
                          onExecuteAction({
                            id: `add-${item.id || i}`,
                            label: "Add to Trip",
                            action: "add_place_to_itinerary",
                            payload: { place_id: item.placeId, title: item.name },
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

      {/* 3. WATCH OUT WARNING (Single Alert Strip, Max 1) */}
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

      {/* 4. PRIMARY ACTIONS (Max 2 Primary Buttons) */}
      {data.actions && data.actions.length > 0 && (
        <div className="pt-1 flex flex-wrap items-center gap-2">
          {data.actions.map((act, i) => {
            const isPrimary = act.variant === "primary" || i === 0;
            const isDanger = act.variant === "danger";

            return (
              <button
                key={act.id || i}
                type="button"
                onClick={() => onExecuteAction(act)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                  isDanger
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : isPrimary
                    ? "bg-[#173B32] dark:bg-[#B49252] text-[#FAF7F0] dark:text-[#172019] hover:bg-[#20453B] dark:hover:bg-[#C5A260]"
                    : "bg-[#EFE5D2] dark:bg-[#2A382E] text-[#173B32] dark:text-[#FAF7F0] hover:bg-[#E5D5BA] dark:hover:bg-[#384A3E] border border-[#E5D5BA] dark:border-[#384A3E]"
                }`}
              >
                {renderActionIcon(act.icon)}
                <span>{act.label}</span>
                <ArrowRight className="w-3 h-3 opacity-60 ml-0.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* 5. ACCORDION [ Show more ] FOR SECONDARY DETAILS */}
      {hasDetails && (
        <div className="pt-1 border-t border-[#E5D5BA]/60 dark:border-[#384A3E]/60">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center justify-between w-full text-[11px] font-mono font-semibold text-[#7B4D36] dark:text-[#D8CBB2] hover:text-[#173B32] dark:hover:text-[#FAF7F0] transition-colors py-1 cursor-pointer"
          >
            <span>{showMore ? "Show less" : "Show more"}</span>
            {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showMore && (
            <div className="pt-2 space-y-2 text-xs font-serif leading-relaxed animate-fadeIn">
              {data.details?.morePicks && data.details.morePicks.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#7B4D36] dark:text-[#D8CBB2] font-bold">
                    Additional Options
                  </div>
                  {data.details.morePicks.map((p, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-[#EFE5D2]/40 dark:bg-[#2A382E]/40 text-xs flex justify-between">
                      <span className="font-bold">{p.name}</span>
                      <span className="text-[11px] text-[#7B4D36] dark:text-[#D8CBB2]">{p.reason || p.category}</span>
                    </div>
                  ))}
                </div>
              )}

              {data.details?.itineraryDiff && data.details.itineraryDiff.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#7B4D36] dark:text-[#D8CBB2] font-bold">
                    Schedule Changes
                  </div>
                  {data.details.itineraryDiff.map((diff, idx) => (
                    <div key={idx} className="text-[11px] font-mono flex items-center gap-1.5 text-[#7B4D36] dark:text-[#D8CBB2]">
                      <span className="font-bold">{diff.title}:</span>
                      <span>{diff.change}</span>
                    </div>
                  ))}
                </div>
              )}

              {data.details?.transit && data.details.transit.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#7B4D36] dark:text-[#D8CBB2] font-bold">
                    Transit & Route
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {data.details.transit.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
