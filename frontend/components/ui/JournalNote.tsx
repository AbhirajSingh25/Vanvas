import React from "react";

export interface JournalNoteProps {
  note: string;
  author?: string;
  tag?: string;
  location?: string;
  date?: string;
  className?: string;
  tapeColor?: "terracotta" | "mustard" | "parchment";
}

export const JournalNote: React.FC<JournalNoteProps> = ({
  note,
  author,
  tag,
  location,
  date,
  className = "",
  tapeColor = "mustard",
}) => {
  const tapeStyles = {
    mustard: "bg-[#B49252]/40",
    terracotta: "bg-[#B65E3C]/30",
    parchment: "bg-[#E5D5BA]/60",
  }[tapeColor];

  const headerLabel = tag || author || "VANVAS Field Note";
  const metaLabel = date || location;

  return (
    <div className={`relative p-5 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-sm text-xs text-[#20211D] ${className}`}>
      {/* Visual Tape Strip Pinned to Top */}
      <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 ${tapeStyles} backdrop-blur-xs transform -rotate-1 border-t border-b border-black/10`} />

      <p className="font-serif italic text-sm text-[#173B32] leading-relaxed pt-1">
        &ldquo;{note}&rdquo;
      </p>

      <div className="mt-3 pt-2 border-t border-[#E5D5BA] flex items-center justify-between text-[10px] text-[#7B4D36] font-mono uppercase tracking-wider">
        <span>{headerLabel}</span>
        {metaLabel && <span>{metaLabel}</span>}
      </div>
    </div>
  );
};
