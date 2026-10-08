"use client";

import React, { useState, useEffect } from "react";
import { checkAppUpdate, VersionInfo } from "@/lib/version";
import { openExternalUrl } from "@/lib/capacitor";

export function UpdateNotificationBanner() {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkAppUpdate().then((info) => {
      if (info && info.update_available) {
        setUpdateInfo(info);
      }
    });
  }, []);

  if (!updateInfo || dismissed) return null;

  return (
    <div className="bg-[#102C26] text-[#FAF7F0] px-4 py-2.5 text-xs flex items-center justify-between border-b border-[#1E4A3F] shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="w-2 h-2 rounded-full bg-[#E5B25D] shrink-0" />
        <span className="truncate">
          <strong>VANVAS Update Available:</strong> Version {updateInfo.latest_version} is now live.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <button
          onClick={() => openExternalUrl(updateInfo.store_url_android)}
          className="bg-[#B65E3C] hover:bg-[#A04E2E] text-[#FAF7F0] font-medium px-2.5 py-1 rounded-md text-[11px] transition-colors"
        >
          Update
        </button>
        {!updateInfo.force_update && (
          <button
            onClick={() => setDismissed(true)}
            className="text-[#D8DFDC] hover:text-[#FAF7F0] px-1.5 py-0.5 text-[11px]"
            aria-label="Dismiss update banner"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
