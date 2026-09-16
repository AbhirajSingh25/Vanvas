import React from "react";
import Link from "next/link";
import { Emblem } from "./Emblem";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark" | "default";
  size?: "sm" | "md" | "lg";
  hideSignature?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = "default",
  size = "md",
  hideSignature = false,
}) => {
  const isLight = variant === "light";
  const primaryColor = isLight ? "#EFE5D2" : "#173B32";
  const signatureColor = isLight ? "#D8DED5" : "#7B4D36";
  const accentColor = isLight ? "#B49252" : "#B65E3C";

  const sizeStyles = {
    sm: { text: "text-xl", emblemSize: 28, sig: "text-[9px]" },
    md: { text: "text-2xl", emblemSize: 34, sig: "text-[10px]" },
    lg: { text: "text-3xl", emblemSize: 42, sig: "text-[11px]" },
  }[size];

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 group select-none transition-transform active:scale-98 ${className}`}
    >
      {/* Expedition Seal Emblem */}
      <Emblem
        size={sizeStyles.emblemSize}
        variant={isLight ? "light" : "forest"}
      />

      {/* Bespoke Wordmark + Signature */}
      <div className="flex flex-col">
        <div
          className={`font-serif font-black tracking-[0.22em] leading-none transition-colors duration-200 flex items-center ${sizeStyles.text}`}
          style={{ color: primaryColor }}
        >
          {/* V with Top Ridge Line */}
          <span className="relative inline-block">
            V
            <span
              className="absolute -top-1 left-0 right-0 h-[2px] rounded-full opacity-70"
              style={{ backgroundColor: accentColor }}
            />
          </span>
          <span className="inline-block">A</span>
          {/* N with Mountain Notch */}
          <span className="relative inline-block">
            N
            <span
              className="absolute -bottom-0.5 left-0.5 right-0.5 h-[1.5px] rounded-full opacity-60"
              style={{ backgroundColor: accentColor }}
            />
          </span>
          <span className="inline-block">V</span>
          <span className="inline-block">A</span>
          {/* S with Subtle Indian Heritage Serif */}
          <span className="relative inline-block">
            S
            <span
              className="absolute -top-1 left-0.5 right-0.5 h-[1.5px] rounded-full opacity-50"
              style={{ backgroundColor: accentColor }}
            />
          </span>
        </div>

        {/* Artisan Signature "by The Sorted Club" */}
        {!hideSignature && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-[1px] w-3 opacity-50" style={{ backgroundColor: signatureColor }} />
            <span
              className={`font-serif italic tracking-wider uppercase font-medium ${sizeStyles.sig}`}
              style={{ color: signatureColor }}
            >
              by The Sorted Club
            </span>
            <span className="h-[1px] w-3 opacity-50" style={{ backgroundColor: signatureColor }} />
          </div>
        )}
      </div>
    </Link>
  );
};
