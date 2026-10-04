"use client";

import React from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "./useOnlineStatus";

export const ConnectivityBanner: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  if (!isOnline) {
    return (
      <aside
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 bg-[#7B4D36] text-[#FAF7F0] px-3 py-1.5 text-xs font-mono flex items-center justify-center gap-2 shadow-md transition-all duration-300 animate-slide-down border-b border-[#B65E3C]"
      >
        <WifiOff className="w-3.5 h-3.5 text-[#EFE5D2] shrink-0" />
        <span className="font-medium">
          You&apos;re offline &bull; Showing your saved trip information.
        </span>
      </aside>
    );
  }

  if (wasOffline) {
    return (
      <aside
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 bg-[#173B32] text-[#FAF7F0] px-3 py-1.5 text-xs font-mono flex items-center justify-center gap-2 shadow-md transition-all duration-300 animate-slide-down border-b border-[#B49252]"
      >
        <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-medium flex items-center gap-1.5">
          <span>Back online &bull; Refreshing live information...</span>
          <RefreshCw className="w-3 h-3 text-[#B49252] animate-spin" />
        </span>
      </aside>
    );
  }

  return null;
};
