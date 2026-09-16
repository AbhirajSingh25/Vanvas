import React from "react";

interface EmblemProps {
  className?: string;
  size?: number;
  variant?: "forest" | "terracotta" | "mustard" | "parchment" | "light";
}

export const Emblem: React.FC<EmblemProps> = ({
  className = "",
  size = 40,
  variant = "forest"
}) => {
  const colors = {
    forest: {
      bg: "#E5D5BA",
      border: "#173B32",
      path: "#173B32",
      accent: "#B65E3C",
      trail: "#B49252"
    },
    terracotta: {
      bg: "#B65E3C",
      border: "#FAF4E8",
      path: "#FAF4E8",
      accent: "#B49252",
      trail: "#EFE5D2"
    },
    mustard: {
      bg: "#B49252",
      border: "#173B32",
      path: "#173B32",
      accent: "#B65E3C",
      trail: "#FAF4E8"
    },
    parchment: {
      bg: "#FAF4E8",
      border: "#173B32",
      path: "#173B32",
      accent: "#B65E3C",
      trail: "#B49252"
    },
    light: {
      bg: "rgba(239, 229, 210, 0.15)",
      border: "#D8DED5",
      path: "#EFE5D2",
      accent: "#B49252",
      trail: "#B65E3C"
    }
  }[variant];

  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 54 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transform transition-transform duration-300 group-hover:scale-105"
      >
        {/* Outer Hexagonal Expedition / Travel Seal */}
        <polygon
          points="27,3 49,15 49,39 27,51 5,39 5,15"
          fill={colors.bg}
          stroke={colors.border}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Inner Top Devanagari Shirorekha / Ridge Line */}
        <line x1="14" y1="15" x2="40" y2="15" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" />

        {/* Winding Mountain Pass & Valley Trail Geometry */}
        <path
          d="M17 17L27 37L37 17"
          stroke={colors.path}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Subtle Central River Path */}
        <path
          d="M27 22V43"
          stroke={colors.trail}
          strokeWidth="2"
          strokeDasharray="2 3"
          strokeLinecap="round"
        />

        {/* Dawn Horizon / Peak Sun */}
        <circle cx="27" cy="10" r="2.2" fill={colors.accent} />
      </svg>
    </div>
  );
};
