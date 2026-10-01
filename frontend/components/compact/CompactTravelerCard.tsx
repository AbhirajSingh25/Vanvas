"use client";

import React from "react";
import { MessageCircle, UserPlus } from "lucide-react";
import { SoloTravelerCard } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

interface CompactTravelerCardProps {
  traveler: SoloTravelerCard;
  onOpenProfile: (traveler: SoloTravelerCard) => void;
  onOpenChat?: (traveler: SoloTravelerCard) => void;
}

export const CompactTravelerCard: React.FC<CompactTravelerCardProps> = ({
  traveler,
  onOpenProfile,
  onOpenChat,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenProfile(traveler)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenProfile(traveler);
        }
      }}
      className="group bg-[#FAF7F0] rounded-2xl border-2 border-[#E5D5BA] hover:border-[#173B32] p-3 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-left focus:outline-none min-h-[76px]"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar
          user={{
            full_name: traveler.full_name,
            avatar_url: traveler.avatar_url,
            avatar_type: traveler.avatar_type,
            avatar_preset: traveler.avatar_preset,
          }}
          size="md"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-serif font-black text-sm text-[#173B32] group-hover:text-[#B65E3C] transition-colors leading-tight truncate">
              {traveler.full_name}
            </h4>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#B49252]/20 text-[#7B4D36]">
              Solo
            </span>
          </div>

          <p className="text-[10px] text-[#7B4D36] truncate mt-0.5">
            {traveler.interests && traveler.interests.length > 0
              ? traveler.interests.slice(0, 2).map((t) => `#${t}`).join(" · ")
              : traveler.travel_style || "Explorer"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onOpenChat) onOpenChat(traveler);
          else onOpenProfile(traveler);
        }}
        className="px-3 py-1.5 rounded-xl bg-[#173B32] hover:bg-[#B65E3C] text-[#EFE5D2] text-[11px] font-bold tracking-wider uppercase transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
      >
        <MessageCircle className="w-3 h-3 text-[#B49252]" />
        <span>Connect</span>
      </button>
    </div>
  );
};
