"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowRight, Compass } from "lucide-react";
import { TravelStamp } from "@/components/ui/TravelStamp";

interface EmptyStateProps {
  icon?: LucideIcon;
  stampText?: string;
  hindiTitle?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Compass,
  stampText = "VANVAS JOURNAL",
  hindiTitle,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  secondaryActionLabel,
  onSecondaryActionClick,
}) => {
  return (
    <div className="p-8 sm:p-12 text-center rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-4 max-w-lg mx-auto shadow-xs animate-vanvas-fade">
      <div className="flex flex-col items-center gap-2">
        <TravelStamp label={stampText} variant="terracotta" />
        <div className="w-14 h-14 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] flex items-center justify-center text-[#173B32] mt-2">
          <Icon className="w-7 h-7 text-[#B65E3C]" />
        </div>
      </div>

      <div className="space-y-1">
        {hindiTitle && (
          <p className="font-devanagari text-xs text-[#7B4D36] font-semibold opacity-90">
            {hindiTitle}
          </p>
        )}
        <h3 className="font-serif font-bold text-lg sm:text-xl text-[#173B32]">
          {title}
        </h3>
        <p className="text-xs text-[#7B4D36] max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {actionLabel && !actionHref && onActionClick && (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF4E8] text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {secondaryActionLabel && onSecondaryActionClick && (
            <button
              type="button"
              onClick={onSecondaryActionClick}
              className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA] hover:bg-[#E5D5BA] text-[#173B32] text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
