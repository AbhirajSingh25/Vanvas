"use client";

import React from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "./useOnlineStatus";

export const ConnectivityBanner: React.FC = () => {
  const { status, isOffline, wasOffline } = useOnlineStatus();

  // If online, checking, or unknown: do not display any banner
  if (!isOffline && !wasOffline) {
    return null;
  }

  if (isOffline) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-[#7B4D36] text-[#FAF7F0] px-3 py-1.5 text-xs font-mono flex items-center justify-center gap-2 border-b border-[#B65E3C] transition-all duration-300 animate-slide-down shrink-0"
      >
        <WifiOff className="w-3.5 h-3.5 text-[#EFE5D2] shrink-0" />
        <span className="font-medium text-center">
          You&apos;re offline &bull; Showing your saved trip information.
        </span>
      </aside>
    );
  }

  if (wasOffline || status === "RECONNECTING") {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="w-full bg-[#173B32] text-[#FAF7F0] px-3 py-1.5 text-xs font-mono flex items-center justify-center gap-2 border-b border-[#B49252] transition-all duration-300 animate-slide-down shrink-0"
      >
        <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-medium flex items-center gap-1.5 text-center">
          <span>Back online &bull; Refreshing live information...</span>
          <RefreshCw className="w-3 h-3 text-[#B49252] animate-spin" />
        </span>
      </aside>
    );
  }

  return null;
};
