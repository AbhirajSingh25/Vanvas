import React from "react";

export interface TravelStampProps {
  label: string;
  sublabel?: string;
  sub?: string;
  elevation?: string;
  coordinates?: string;
  variant?: "terracotta" | "forest" | "mustard" | "moss" | "indigo";
  className?: string;
  rotate?: number;
}

export const TravelStamp: React.FC<TravelStampProps> = ({
  label,
  sublabel,
  sub,
  elevation,
  coordinates,
  variant = "terracotta",
  className = "",
  rotate = 0,
}) => {
  const styles = {
    terracotta: "border-[#B65E3C] text-[#B65E3C] bg-[#B65E3C]/5",
    forest: "border-[#173B32] text-[#173B32] bg-[#173B32]/5",
    mustard: "border-[#B49252] text-[#B49252] bg-[#B49252]/5",
    moss: "border-[#536B52] text-[#536B52] bg-[#536B52]/5",
    indigo: "border-[#273D52] text-[#273D52] bg-[#273D52]/5",
  }[variant];

  const secondary = sub || sublabel;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border-1.5 border-dashed text-[10px] font-mono tracking-widest uppercase transition-transform select-none ${styles} ${className}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
    >
      <div className="font-bold flex items-center gap-1">
        <span>★</span>
        <span>{label}</span>
        <span>★</span>
      </div>
      {(secondary || elevation || coordinates) && (
        <div className="text-[8px] opacity-80 mt-0.5 tracking-normal font-sans">
          {[secondary, elevation, coordinates].filter(Boolean).join(" • ")}
        </div>
      )}
    </div>
  );
};
