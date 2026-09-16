import React from "react";

export interface DevanagariHeadingProps {
  devanagari?: string;
  hindi?: string;
  english: string;
  subtitle?: string;
  alignment?: "left" | "center" | "right";
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const DevanagariHeading: React.FC<DevanagariHeadingProps> = ({
  devanagari,
  hindi,
  english,
  subtitle,
  alignment = "left",
  theme = "light",
  size = "md",
  className = "",
}) => {
  const isDark = theme === "dark";
  const hindiText = hindi || devanagari || "";

  const alignClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[alignment];

  const sizeClass = {
    sm: "text-xl sm:text-2xl",
    md: "text-2xl sm:text-4xl",
    lg: "text-3xl sm:text-5xl md:text-6xl",
  }[size];

  return (
    <div className={`flex flex-col ${alignClass} space-y-1.5 ${className}`}>
      {/* Devanagari Visual Tag */}
      {hindiText && (
        <span
          className={`font-devanagari text-base sm:text-lg font-bold tracking-widest ${
            isDark ? "text-[#B49252]" : "text-[#B65E3C]"
          }`}
        >
          {hindiText}
        </span>
      )}

      {/* English Editorial Headline */}
      <h2
        className={`font-serif font-black tracking-tight leading-[1.1] ${
          isDark ? "text-[#EFE5D2]" : "text-[#173B32]"
        } ${sizeClass}`}
      >
        {english}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p
          className={`text-xs sm:text-sm font-light max-w-2xl leading-relaxed pt-1 ${
            isDark ? "text-[#D8DED5]/80" : "text-[#7B4D36]"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
