"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useAskVanvas } from "@/context/AskVanvasContext";

interface FloatingCopilotTriggerProps {
  onClick?: () => void;
  isOpen?: boolean;
}

export const FloatingCopilotTrigger: React.FC<FloatingCopilotTriggerProps> = ({
  onClick,
  isOpen: propIsOpen,
}) => {
  const context = useAskVanvas();
  const isOpen = propIsOpen !== undefined ? propIsOpen : context.isOpen;
  const handleClick = onClick || (() => context.openAskVanvas());

  if (isOpen) return null;

  // Context-aware badge text
  let contextLabel = "Ask VANVAS";
  if (context.currentContext.destinationName) {
    contextLabel = `Ask · ${context.currentContext.destinationName}`;
  } else if (context.currentContext.type === "trip") {
    contextLabel = "Ask · Trip";
  } else if (context.currentContext.type === "road_trip") {
    contextLabel = "Ask · Route";
  } else if (context.currentContext.type === "budget") {
    contextLabel = "Ask · Budget";
  } else if (context.currentContext.type === "nearby") {
    contextLabel = "Ask · Nearby";
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Ask VANVAS Travel Assistant"
      className="md:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-3.5 z-40 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B49252] focus:ring-offset-2 focus:ring-offset-[#EFE5D2] transition-all duration-300 transform active:scale-95 shadow-xl"
    >
      <div className="relative flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full bg-[#173B32] text-[#FAF7F0] border border-[#B49252]/80 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:bg-[#20453B] group-hover:border-[#B49252]">
        <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-[#B65E3C] text-[#FAF7F0] shadow-inner shrink-0 group-hover:rotate-12 transition-transform duration-300">
          <Sparkles className="w-3 h-3 text-[#B49252]" />
        </div>

        <div className="flex flex-col text-left leading-none">
          <span className="font-serif font-bold text-xs tracking-tight text-[#FAF7F0] truncate max-w-28">
            {contextLabel}
          </span>
        </div>
      </div>
    </button>
  );
};
