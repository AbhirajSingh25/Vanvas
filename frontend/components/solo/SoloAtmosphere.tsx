"use client";

import React from "react";

interface SoloAtmosphereProps {
  atmosphereType?: "mountain" | "coastal" | "desert" | "heritage" | "spiritual" | "forest" | "urban";
  className?: string;
}

export function SoloAtmosphere({
  atmosphereType = "mountain",
  className = ""
}: SoloAtmosphereProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none opacity-40 transition-opacity duration-1000 ${className}`}>
      {/* Universal Fine Topographic Contour Background */}
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="soloLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#173B32" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#B49252" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#E05A2B" stopOpacity="0.06" />
          </linearGradient>
          <pattern id="fineGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#173B32" strokeWidth="0.5" strokeOpacity="0.03" />
          </pattern>
        </defs>

        {/* Ambient Grid */}
        <rect width="100%" height="100%" fill="url(#fineGrid)" />

        {/* Dynamic Contour Themes */}
        {atmosphereType === "mountain" && (
          <g stroke="url(#soloLineGrad)" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 4">
            {/* Topographic Alpine Ridge Lines */}
            <path d="M-100 280 C 200 210, 450 320, 720 230 C 990 140, 1200 290, 1540 200" fill="none" />
            <path d="M-100 320 C 180 250, 420 370, 720 270 C 1020 170, 1260 330, 1540 240" fill="none" />
            <path d="M-100 360 C 220 290, 480 410, 760 310 C 1040 210, 1280 370, 1540 280" fill="none" />
            
            {/* Minimal Mountain Peak Contour */}
            <path d="M 220 180 L 290 80 L 360 180" stroke="#173B32" strokeWidth="1.2" strokeOpacity="0.15" fill="none" />
            <path d="M 270 180 L 320 110 L 370 180" stroke="#B49252" strokeWidth="0.8" strokeOpacity="0.12" fill="none" />
            <path d="M 1120 160 L 1190 70 L 1260 160" stroke="#173B32" strokeWidth="1.2" strokeOpacity="0.15" fill="none" />

            {/* Compass Rose & Elevation Mark */}
            <circle cx="120" cy="140" r="28" stroke="#173B32" strokeWidth="0.6" strokeOpacity="0.12" fill="none" />
            <circle cx="120" cy="140" r="2" fill="#E05A2B" fillOpacity="0.3" />
            <text x="120" y="105" textAnchor="middle" fontSize="8" fill="#173B32" fillOpacity="0.3" fontFamily="monospace">N</text>
            <text x="120" y="180" textAnchor="middle" fontSize="7" fill="#B49252" fillOpacity="0.35" fontFamily="monospace">ELEV. 2,050m</text>
          </g>
        )}

        {atmosphereType === "coastal" && (
          <g stroke="url(#soloLineGrad)" strokeWidth="1" strokeLinecap="round">
            {/* Ocean Wave Contour Curves */}
            <path d="M-100 240 C 250 180, 500 300, 800 210 C 1100 120, 1300 280, 1540 220" fill="none" />
            <path d="M-100 280 C 220 220, 520 340, 820 250 C 1120 160, 1340 320, 1540 260" fill="none" />
            <path d="M-100 320 C 260 260, 540 380, 840 290 C 1140 200, 1360 360, 1540 300" fill="none" />
            
            {/* Coastal Tide Marker */}
            <circle cx="1320" cy="180" r="32" stroke="#B49252" strokeWidth="0.6" strokeOpacity="0.15" fill="none" strokeDasharray="2 3" />
            <text x="1320" y="224" textAnchor="middle" fontSize="7" fill="#173B32" fillOpacity="0.35" fontFamily="monospace">HIGH TIDE · 06:14 AM</text>
          </g>
        )}

        {atmosphereType === "desert" && (
          <g stroke="url(#soloLineGrad)" strokeWidth="1" strokeLinecap="round">
            {/* Dune Ridge Curves */}
            <path d="M-100 220 C 300 160, 600 320, 900 200 C 1200 80, 1400 260, 1540 180" fill="none" />
            <path d="M-100 270 C 280 210, 620 370, 940 250 C 1220 130, 1420 310, 1540 230" fill="none" />
            <path d="M-100 330 C 320 270, 660 420, 980 300 C 1260 180, 1450 360, 1540 290" fill="none" />
            
            {/* Sun Arc */}
            <path d="M 80 200 A 70 70 0 0 1 220 200" stroke="#E05A2B" strokeWidth="0.8" strokeOpacity="0.15" fill="none" strokeDasharray="3 3" />
            <text x="150" y="195" textAnchor="middle" fontSize="7" fill="#B49252" fillOpacity="0.35" fontFamily="monospace">GOLDEN HOUR · 17:42</text>
          </g>
        )}

        {atmosphereType === "spiritual" && (
          <g stroke="url(#soloLineGrad)" strokeWidth="1" strokeLinecap="round">
            {/* Concentric Sacred Water Ripples */}
            <circle cx="720" cy="240" r="80" stroke="#B49252" strokeWidth="0.7" strokeOpacity="0.15" fill="none" strokeDasharray="4 4" />
            <circle cx="720" cy="240" r="140" stroke="#173B32" strokeWidth="0.5" strokeOpacity="0.12" fill="none" strokeDasharray="3 5" />
            <circle cx="720" cy="240" r="220" stroke="#E05A2B" strokeWidth="0.4" strokeOpacity="0.08" fill="none" />
            
            {/* Ghat Steps & River Flow */}
            <path d="M-100 380 L 1540 380" stroke="#173B32" strokeWidth="0.6" strokeOpacity="0.1" />
            <path d="M-100 400 L 1540 400" stroke="#173B32" strokeWidth="0.6" strokeOpacity="0.08" />
            <text x="720" y="244" textAnchor="middle" fontSize="8" fill="#B49252" fillOpacity="0.35" fontFamily="monospace">AARTI · 18:30</text>
          </g>
        )}

        {atmosphereType === "heritage" && (
          <g stroke="url(#soloLineGrad)" strokeWidth="1" strokeLinecap="round">
            {/* Architectural Arch Contours */}
            <path d="M 160 220 C 160 150, 240 150, 240 220" stroke="#B49252" strokeWidth="0.9" strokeOpacity="0.15" fill="none" />
            <path d="M 240 220 C 240 150, 320 150, 320 220" stroke="#B49252" strokeWidth="0.9" strokeOpacity="0.15" fill="none" />
            <path d="M 1120 220 C 1120 150, 1200 150, 1200 220" stroke="#B49252" strokeWidth="0.9" strokeOpacity="0.15" fill="none" />
            <path d="M 1200 220 C 1200 150, 1280 150, 1280 220" stroke="#B49252" strokeWidth="0.9" strokeOpacity="0.15" fill="none" />
            <text x="240" y="240" textAnchor="middle" fontSize="7" fill="#173B32" fillOpacity="0.3" fontFamily="monospace">HISTORIC OLD PRECINCT</text>
          </g>
        )}

        {atmosphereType === "forest" && (
          <g stroke="url(#soloLineGrad)" strokeWidth="1" strokeLinecap="round">
            {/* Valley Canopy Contours */}
            <path d="M-100 260 C 240 200, 480 340, 780 240 C 1080 140, 1320 300, 1540 220" fill="none" />
            <path d="M-100 310 C 220 250, 520 390, 820 290 C 1120 190, 1360 350, 1540 270" fill="none" />
            <circle cx="180" cy="160" r="18" stroke="#173B32" strokeWidth="0.7" strokeOpacity="0.12" fill="none" />
            <text x="180" y="192" textAnchor="middle" fontSize="7" fill="#173B32" fillOpacity="0.3" fontFamily="monospace">RESERVE FOREST</text>
          </g>
        )}
      </svg>
    </div>
  );
}
