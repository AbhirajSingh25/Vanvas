"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

/**
 * Base shimmering parchment block with warm explorer tones.
 */
export const SkeletonBlock: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div
    className={`bg-[#E5D5BA]/60 dark:bg-[#1A2C24]/60 skeleton-shimmer rounded-xl ${className}`}
  />
);

/**
 * Place & Destination Card Skeleton matching PlaceCard / CompactDestinationCard geometry.
 */
export const CardSkeleton: React.FC<{ variant?: "standard" | "compact" }> = ({
  variant = "standard",
}) => {
  if (variant === "compact") {
    return (
      <div className="bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] p-3 shadow-2xs flex items-center justify-between gap-3 min-h-[88px] animate-vanvas-fade">
        <SkeletonBlock className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <SkeletonBlock className="w-20 h-3" />
          <SkeletonBlock className="w-3/4 h-4" />
          <SkeletonBlock className="w-1/2 h-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F0] rounded-2xl border border-[#E5D5BA] overflow-hidden shadow-xs flex flex-col animate-vanvas-fade">
      <SkeletonBlock className="w-full h-48 sm:h-52 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="w-24 h-4" />
          <SkeletonBlock className="w-12 h-4 rounded-full" />
        </div>
        <SkeletonBlock className="w-4/5 h-5" />
        <SkeletonBlock className="w-full h-3" />
        <SkeletonBlock className="w-2/3 h-3" />
        <div className="pt-2 border-t border-[#E5D5BA]/60 flex justify-between items-center">
          <SkeletonBlock className="w-16 h-3" />
          <SkeletonBlock className="w-20 h-3" />
        </div>
      </div>
    </div>
  );
};

/**
 * Trip Card Skeleton matching TripSummary grid items.
 */
export const TripCardSkeleton: React.FC<{ isCompact?: boolean }> = ({ isCompact = false }) => {
  if (isCompact) {
    return (
      <div className="bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] p-4 shadow-2xs flex items-center justify-between gap-4 animate-vanvas-fade">
        <div className="space-y-2 flex-1">
          <div className="flex gap-2">
            <SkeletonBlock className="w-16 h-3.5" />
            <SkeletonBlock className="w-24 h-3.5" />
          </div>
          <SkeletonBlock className="w-3/4 h-5" />
          <SkeletonBlock className="w-1/2 h-3.5" />
        </div>
        <SkeletonBlock className="w-12 h-6 rounded-lg shrink-0" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E5D5BA] overflow-hidden shadow-xs flex flex-col justify-between animate-vanvas-fade">
      <SkeletonBlock className="w-full h-48 rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="w-20 h-4" />
          <SkeletonBlock className="w-28 h-3.5" />
        </div>
        <SkeletonBlock className="w-4/5 h-6" />
        <div className="flex gap-2 pt-1">
          <SkeletonBlock className="w-16 h-3.5" />
          <SkeletonBlock className="w-16 h-3.5" />
          <SkeletonBlock className="w-16 h-3.5" />
        </div>
      </div>
    </div>
  );
};

/**
 * Itinerary Item Timeline Skeleton matching Trip Itinerary activities.
 */
export const ItineraryItemSkeleton: React.FC = () => (
  <div className="bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] p-4 shadow-xs flex flex-col sm:flex-row items-start gap-4 animate-vanvas-fade">
    <SkeletonBlock className="w-full sm:w-28 h-24 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2 w-full">
      <div className="flex justify-between items-center">
        <SkeletonBlock className="w-20 h-4 rounded-md" />
        <SkeletonBlock className="w-16 h-4" />
      </div>
      <SkeletonBlock className="w-3/5 h-5" />
      <SkeletonBlock className="w-full h-3.5" />
      <SkeletonBlock className="w-4/5 h-3.5" />
    </div>
  </div>
);

/**
 * Booking Card Skeleton matching Bookings history rows.
 */
export const BookingCardSkeleton: React.FC = () => (
  <div className="p-5 rounded-3xl bg-white border-2 border-[#E5D5BA] shadow-sm flex flex-col justify-between space-y-4 animate-vanvas-fade">
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-[#E5D5BA]/60 pb-3">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="w-8 h-8 rounded-xl shrink-0" />
          <div className="space-y-1">
            <SkeletonBlock className="w-16 h-2.5" />
            <SkeletonBlock className="w-24 h-3.5" />
          </div>
        </div>
        <SkeletonBlock className="w-20 h-5 rounded-full" />
      </div>
      <SkeletonBlock className="w-3/4 h-5" />
      <SkeletonBlock className="w-1/2 h-3.5" />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <SkeletonBlock className="h-10 rounded-xl" />
        <SkeletonBlock className="h-10 rounded-xl" />
      </div>
    </div>
  </div>
);

/**
 * Destination Detail Screen Skeleton (Full layout matching explore/[slug]).
 */
export const DestinationDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#EFE5D2] animate-vanvas-fade">
    {/* Top Hero Shimmer */}
    <div className="relative h-72 sm:h-96 w-full bg-[#173B32]/30 overflow-hidden">
      <SkeletonBlock className="w-full h-full rounded-none opacity-40" />
      <div className="absolute bottom-6 left-4 right-4 sm:left-8 sm:right-8 space-y-3 max-w-4xl mx-auto">
        <SkeletonBlock className="w-28 h-5 rounded-md" />
        <SkeletonBlock className="w-3/5 h-10 sm:h-12" />
        <SkeletonBlock className="w-2/5 h-4" />
      </div>
    </div>

    {/* Metadata Strip */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
      <div className="bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] p-4 shadow-md flex items-center justify-between gap-4">
        <SkeletonBlock className="w-1/4 h-4" />
        <SkeletonBlock className="w-1/4 h-4" />
        <SkeletonBlock className="w-1/4 h-4" />
      </div>
    </div>

    {/* Place Cards Grid Placeholder */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBlock key={i} className="w-28 h-9 rounded-xl shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Trip Workspace Detail Screen Skeleton (matching trips/[id]).
 */
export const TripWorkspaceSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#EFE5D2] pb-28 animate-vanvas-fade">
    {/* Header Cockpit Strip */}
    <div className="bg-[#173B32] text-[#EFE5D2] px-4 py-8 sm:py-12 border-b-2 border-[#E5D5BA]">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex gap-2">
          <SkeletonBlock className="w-24 h-4 rounded-md" />
          <SkeletonBlock className="w-32 h-4 rounded-md" />
        </div>
        <SkeletonBlock className="w-2/3 h-8 sm:h-10" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-14 rounded-2xl opacity-60" />
          ))}
        </div>
      </div>
    </div>

    {/* Sticky Tabs Placeholder */}
    <div className="bg-[#FAF7F0] border-b-2 border-[#E5D5BA] px-4 py-3">
      <div className="max-w-7xl mx-auto flex gap-3 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonBlock key={i} className="w-24 h-8 rounded-xl shrink-0" />
        ))}
      </div>
    </div>

    {/* Content Placeholder */}
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <ItineraryItemSkeleton key={i} />
      ))}
    </div>
  </div>
);
