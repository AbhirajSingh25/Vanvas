"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Compass, MapPin, Mountain, Navigation, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Layers, Crosshair, Coffee, Droplets,
  AlertTriangle, Shield, Utensils, Home, ShoppingBag, Fuel,
  Pill, Car, Footprints, Sparkles, Check, Info, ChevronRight, X
} from "lucide-react";

export type VanvasMapMode = "core" | "trek" | "one-day" | "nearby" | "copilot";

export interface VanvasMapMarker {
  id: string;
  title: string;
  hindiTitle?: string;
  type:
    | "start"
    | "summit"
    | "waypoint"
    | "camp"
    | "viewpoint"
    | "food"
    | "dhaba"
    | "cafe"
    | "water"
    | "danger"
    | "emergency"
    | "shop"
    | "temple"
    | "fuel"
    | "pharmacy"
    | "rental"
    | "parking"
    | "convenience"
    | "liquor"
    | "restroom"
    | "destination"
    | "origin";
  lat: number;
  lng: number;
  elevationMeters?: number;
  description?: string;
  categoryLabel?: string;
  provenance?: "VERIFIED" | "DATABASE" | "ESTIMATED";
  actionLabel?: string;
  isCurrentLocation?: boolean;
}

export interface VanvasMapRouteSegment {
  id: string;
  name: string;
  coordinates: Array<{ lat: number; lng: number; alt?: number }>;
  color?: string;
  dashed?: boolean;
  elevationGain?: number;
  distanceKm?: number;
}

export interface VanvasMapProps {
  mode?: VanvasMapMode;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: VanvasMapMarker[];
  routes?: VanvasMapRouteSegment[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (marker: VanvasMapMarker | null) => void;
  title?: string;
  subtitle?: string;
  className?: string;
  showElevationProfile?: boolean;
  showLegend?: boolean;
  showControls?: boolean;
  height?: string | number;
  enableFullscreen?: boolean;
}

export const VanvasMap: React.FC<VanvasMapProps> = ({
  mode = "core",
  center,
  zoom = 12,
  markers = [],
  routes = [],
  selectedMarkerId,
  onSelectMarker,
  title,
  subtitle,
  className = "",
  showElevationProfile = false,
  showLegend = true,
  showControls = true,
  height = 420,
  enableFullscreen = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeMarker, setActiveMarker] = useState<VanvasMapMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<"all" | "food" | "water" | "danger" | "emergency">("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Sync selectedMarkerId prop with activeMarker
  useEffect(() => {
    if (selectedMarkerId) {
      const found = markers.find((m) => m.id === selectedMarkerId);
      if (found) setActiveMarker(found);
    }
  }, [selectedMarkerId, markers]);

  // Compute bounding box for map normalization
  const bounds = useMemo(() => {
    const allCoords: Array<{ lat: number; lng: number }> = [];
    markers.forEach((m) => allCoords.push({ lat: m.lat, lng: m.lng }));
    routes.forEach((r) => r.coordinates.forEach((c) => allCoords.push({ lat: c.lat, lng: c.lng })));
    if (center) allCoords.push(center);
    if (userLocation) allCoords.push(userLocation);

    if (allCoords.length === 0) {
      return { minLat: 30.0, maxLat: 31.0, minLng: 78.0, maxLng: 79.5 };
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    allCoords.forEach((c) => {
      if (c.lat < minLat) minLat = c.lat;
      if (c.lat > maxLat) maxLat = c.lat;
      if (c.lng < minLng) minLng = c.lng;
      if (c.lng > maxLng) maxLng = c.lng;
    });

    const latPad = Math.max(0.015, (maxLat - minLat) * 0.2);
    const lngPad = Math.max(0.015, (maxLng - minLng) * 0.2);

    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad,
    };
  }, [markers, routes, center, userLocation]);

  // Coordinate projection from GPS to SVG viewBox coordinates [0..800, 0..500]
  const project = (lat: number, lng: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const lngSpan = bounds.maxLng - bounds.minLng || 1;
    const x = ((lng - bounds.minLng) / lngSpan) * 700 + 50;
    const y = ((bounds.maxLat - lat) / latSpan) * 400 + 50;
    return { x, y };
  };

  // Filter markers based on active layer
  const filteredMarkers = useMemo(() => {
    if (activeLayer === "all") return markers;
    if (activeLayer === "food") return markers.filter((m) => ["food", "dhaba", "cafe"].includes(m.type));
    if (activeLayer === "water") return markers.filter((m) => m.type === "water");
    if (activeLayer === "danger") return markers.filter((m) => m.type === "danger");
    if (activeLayer === "emergency") return markers.filter((m) => ["emergency", "pharmacy"].includes(m.type));
    return markers;
  }, [markers, activeLayer]);

  // SVG route path generator
  const routePaths = useMemo(() => {
    return routes.map((route) => {
      if (route.coordinates.length < 2) return { ...route, d: "" };
      const pts = route.coordinates.map((c) => {
        const { x, y } = project(c.lat, c.lng);
        return `${x},${y}`;
      });
      return {
        ...route,
        d: `M ${pts.join(" L ")}`,
      };
    });
  }, [routes, bounds]);

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 5000 }
    );
  };

  const resetView = () => {
    setPanOffset({ x: 0, y: 0 });
    setCurrentZoom(zoom);
  };

  // Mode Theme Styling Constants
  const theme = useMemo(() => {
    switch (mode) {
      case "trek":
        return {
          bg: "bg-[#0E1612]",
          cardBg: "bg-[#14201A]",
          border: "border-[#2A3E33]",
          gridStroke: "#1B2E24",
          contourStroke: "#223B2E",
          textColor: "text-[#FAF4E8]",
          mutedText: "text-[#8FA699]",
          accent: "#E05A2B",
          secondaryAccent: "#B49252",
          badgeBg: "bg-[#1A2E24] text-[#B49252] border-[#B49252]/40",
          routeStroke: "#E05A2B",
          routeSecondary: "#B49252",
          compassColor: "#B49252",
        };
      case "one-day":
        return {
          bg: "bg-[#101915]",
          cardBg: "bg-[#182620]",
          border: "border-[#2D4539]",
          gridStroke: "#1D3327",
          contourStroke: "#274233",
          textColor: "text-[#FAF4E8]",
          mutedText: "text-[#9EB5A9]",
          accent: "#D95327",
          secondaryAccent: "#C59B47",
          badgeBg: "bg-[#253D30] text-[#E08A56] border-[#D95327]/40",
          routeStroke: "#E08A56",
          routeSecondary: "#52B788",
          compassColor: "#D95327",
        };
      case "nearby":
        return {
          bg: "bg-[#F7F4EB]",
          cardBg: "bg-[#EFE9DC]",
          border: "border-[#D8CBB5]",
          gridStroke: "#E7DCB8",
          contourStroke: "#D9CEB4",
          textColor: "text-[#1C2822]",
          mutedText: "text-[#627267]",
          accent: "#B65E3C",
          secondaryAccent: "#173B32",
          badgeBg: "bg-[#173B32] text-[#FAF7F0] border-[#173B32]",
          routeStroke: "#173B32",
          routeSecondary: "#B65E3C",
          compassColor: "#173B32",
        };
      case "core":
      default:
        return {
          bg: "bg-[#F8F5EE]",
          cardBg: "bg-[#F0EAE0]",
          border: "border-[#D8C8B0]",
          gridStroke: "#E8DEC8",
          contourStroke: "#DACDB2",
          textColor: "text-[#23201C]",
          mutedText: "text-[#6C6356]",
          accent: "#B85434",
          secondaryAccent: "#1A3D34",
          badgeBg: "bg-[#1A3D34] text-[#FAF6F0] border-[#1A3D34]",
          routeStroke: "#B85434",
          routeSecondary: "#1A3D34",
          compassColor: "#1A3D34",
        };
    }
  }, [mode]);

  // Marker Icon Renderer
  const renderMarkerIcon = (m: VanvasMapMarker, isSelected: boolean) => {
    const isDark = mode === "trek" || mode === "one-day";
    let bg = isDark ? "bg-[#1A2E24] text-[#FAF4E8]" : "bg-white text-[#173B32]";
    let border = isDark ? "border-[#3A5646]" : "border-[#C8B89E]";
    let icon = <MapPin className="w-3.5 h-3.5" />;

    switch (m.type) {
      case "start":
      case "origin":
        bg = "bg-emerald-600 text-white";
        border = "border-white";
        icon = <Footprints className="w-3.5 h-3.5" />;
        break;
      case "summit":
      case "destination":
        bg = "bg-[#E05A2B] text-white";
        border = "border-white shadow-lg";
        icon = <Mountain className="w-4 h-4" />;
        break;
      case "camp":
        bg = "bg-amber-600 text-white";
        border = "border-amber-300";
        icon = <Home className="w-3.5 h-3.5" />;
        break;
      case "viewpoint":
        bg = "bg-indigo-600 text-white";
        border = "border-indigo-300";
        icon = <Compass className="w-3.5 h-3.5" />;
        break;
      case "water":
        bg = "bg-cyan-600 text-white";
        border = "border-cyan-300";
        icon = <Droplets className="w-3.5 h-3.5" />;
        break;
      case "food":
      case "dhaba":
      case "cafe":
        bg = "bg-orange-600 text-white";
        border = "border-orange-300";
        icon = <Utensils className="w-3.5 h-3.5" />;
        break;
      case "danger":
        bg = "bg-red-600 text-white animate-pulse";
        border = "border-red-300";
        icon = <AlertTriangle className="w-3.5 h-3.5" />;
        break;
      case "emergency":
      case "pharmacy":
        bg = "bg-rose-700 text-white";
        border = "border-white";
        icon = <Pill className="w-3.5 h-3.5" />;
        break;
      case "fuel":
        bg = "bg-amber-700 text-white";
        border = "border-white";
        icon = <Fuel className="w-3.5 h-3.5" />;
        break;
      case "rental":
        bg = "bg-blue-600 text-white";
        border = "border-white";
        icon = <Car className="w-3.5 h-3.5" />;
        break;
      case "shop":
      case "convenience":
        bg = "bg-teal-700 text-white";
        border = "border-teal-300";
        icon = <ShoppingBag className="w-3.5 h-3.5" />;
        break;
    }

    if (isSelected) {
      border = "border-[#FAF4E8] ring-4 ring-[#E05A2B] scale-125 z-30";
    }

    return (
      <div
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer ${bg} ${border}`}
        title={m.title}
      >
        {icon}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl border overflow-hidden select-none transition-all duration-300 ${theme.bg} ${theme.border} ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : className
      }`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* MAP HEADER / BANNER */}
      {(title || subtitle) && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 pointer-events-none max-w-xs sm:max-w-md">
          <div className={`p-3 sm:p-4 rounded-2xl backdrop-blur-md border shadow-lg ${theme.cardBg}/90 ${theme.border} pointer-events-auto`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider ${theme.badgeBg}`}>
                {mode === "trek" ? "TOPOGRAPHIC EXPEDITION MAP" : mode === "one-day" ? "ROAD-TRIP ROUTE BOARD" : mode === "nearby" ? "LOCAL DISCOVERY RADAR" : "VANVAS SANCTUARY CARTOGRAPHY"}
              </span>
            </div>
            {title && <h4 className={`text-base sm:text-lg font-serif font-black leading-tight ${theme.textColor}`}>{title}</h4>}
            {subtitle && <p className={`text-[11px] font-sans leading-relaxed line-clamp-2 ${theme.mutedText}`}>{subtitle}</p>}
          </div>
        </div>
      )}

      {/* COMPASS ROSE / CARTOGRAPHIC STAMP */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none opacity-40 hover:opacity-80 transition-opacity hidden sm:flex flex-col items-center">
        <Compass className="w-12 h-12" style={{ color: theme.compassColor }} />
        <span className="text-[9px] font-mono font-bold tracking-widest mt-1 text-[#8FA699]">
          N 30° GARHWAL
        </span>
      </div>

      {/* MAP CONTROLS (Zoom, Fullscreen, Locate) */}
      {showControls && (
        <div className="absolute top-4 right-4 sm:top-20 sm:right-4 z-20 flex flex-col gap-2">
          <div className={`flex flex-col rounded-2xl border shadow-lg overflow-hidden backdrop-blur-md ${theme.cardBg}/90 ${theme.border}`}>
            <button
              onClick={() => setCurrentZoom((z) => Math.min(20, z + 1))}
              className={`p-2.5 hover:bg-black/10 transition-colors ${theme.textColor} border-b ${theme.border}`}
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentZoom((z) => Math.max(5, z - 1))}
              className={`p-2.5 hover:bg-black/10 transition-colors ${theme.textColor} border-b ${theme.border}`}
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className={`p-2.5 hover:bg-black/10 transition-colors ${theme.textColor}`}
              title="Reset View"
              aria-label="Reset map view"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {enableFullscreen && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2.5 rounded-2xl border shadow-lg backdrop-blur-md ${theme.cardBg}/90 ${theme.border} ${theme.textColor} hover:bg-black/10 transition-colors`}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
              aria-label="Toggle map fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={handleLocateMe}
            className={`p-2.5 rounded-2xl border shadow-lg backdrop-blur-md ${theme.cardBg}/90 ${theme.border} ${
              isLocating ? "text-[#E05A2B] animate-pulse" : theme.textColor
            } hover:bg-black/10 transition-colors`}
            title="Locate Me (GPS)"
            aria-label="Detect GPS Location"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FILTER LAYER CHIPS */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-md border shadow-lg bg-black/40 border-white/10 text-white text-[11px] font-mono">
        <button
          onClick={() => setActiveLayer("all")}
          className={`px-3 py-1 rounded-xl transition-colors ${activeLayer === "all" ? "bg-[#E05A2B] text-white font-bold" : "hover:bg-white/10"}`}
        >
          All POIs ({markers.length})
        </button>
        <button
          onClick={() => setActiveLayer("food")}
          className={`px-3 py-1 rounded-xl transition-colors ${activeLayer === "food" ? "bg-[#E05A2B] text-white font-bold" : "hover:bg-white/10"}`}
        >
          Food & Tea
        </button>
        {mode === "trek" && (
          <>
            <button
              onClick={() => setActiveLayer("water")}
              className={`px-3 py-1 rounded-xl transition-colors ${activeLayer === "water" ? "bg-[#E05A2B] text-white font-bold" : "hover:bg-white/10"}`}
            >
              Water Springs
            </button>
            <button
              onClick={() => setActiveLayer("danger")}
              className={`px-3 py-1 rounded-xl transition-colors ${activeLayer === "danger" ? "bg-[#E05A2B] text-white font-bold" : "hover:bg-white/10"}`}
            >
              Exposure / Danger
            </button>
          </>
        )}
      </div>

      {/* MAIN VECTOR CANVAS / SVG VIEWPORT */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${currentZoom / 12})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          <defs>
            {/* Topographic pattern / Grid */}
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={theme.gridStroke} strokeWidth="0.75" />
            </pattern>
            <pattern id="contour-pattern" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M 10 30 Q 40 10, 80 40 T 120 30 M 0 70 Q 50 100, 90 60 T 130 90 M 20 110 Q 60 80, 110 110"
                fill="none"
                stroke={theme.contourStroke}
                strokeWidth="0.85"
                strokeDasharray="4 3"
              />
            </pattern>
          </defs>

          {/* Background Grid & Topo Contours */}
          <rect width="800" height="500" fill="url(#grid-pattern)" opacity="0.6" />
          <rect width="800" height="500" fill="url(#contour-pattern)" opacity="0.5" />

          {/* Decorative Elevation Contour Circles */}
          {mode === "trek" && (
            <g opacity="0.35" stroke={theme.contourStroke} fill="none" strokeWidth="1">
              <ellipse cx="400" cy="250" rx="280" ry="180" />
              <ellipse cx="400" cy="250" rx="210" ry="130" />
              <ellipse cx="400" cy="250" rx="140" ry="85" />
              <ellipse cx="400" cy="250" rx="70" ry="40" />
            </g>
          )}

          {/* Route Polylines */}
          {routePaths.map((rp) => (
            <g key={rp.id}>
              {/* Outer glow/casing */}
              <path
                d={rp.d}
                fill="none"
                stroke={mode === "trek" ? "#0A100D" : "#FAF4E8"}
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
              {/* Main colored trail/road line */}
              <path
                d={rp.d}
                fill="none"
                stroke={rp.color || theme.routeStroke}
                strokeWidth="4"
                strokeDasharray={rp.dashed ? "6 4" : "none"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* User GPS Location Marker */}
          {userLocation && (
            <g transform={`translate(${project(userLocation.lat, userLocation.lng).x}, ${project(userLocation.lat, userLocation.lng).y})`}>
              <circle r="14" fill="#3B82F6" opacity="0.3" className="animate-ping" />
              <circle r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          )}

          {/* Render Vector Interactive Markers */}
          {filteredMarkers.map((m) => {
            const { x, y } = project(m.lat, m.lng);
            const isSelected = activeMarker?.id === m.id;

            return (
              <g
                key={m.id}
                transform={`translate(${x}, ${y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMarker(m);
                  if (onSelectMarker) onSelectMarker(m);
                }}
                className="cursor-pointer"
              >
                {/* Marker Pin Anchor Line */}
                <line x1="0" y1="0" x2="0" y2="10" stroke={theme.textColor} strokeWidth="1.5" opacity="0.4" />

                {/* HTML ForeignObject for rich icon styling */}
                <foreignObject x="-14" y="-30" width="28" height="28" className="overflow-visible">
                  {renderMarkerIcon(m, isSelected)}
                </foreignObject>

                {/* Short title label on map */}
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  fill={theme.textColor}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="pointer-events-none drop-shadow-md select-none"
                  style={{ textShadow: mode === "trek" || mode === "one-day" ? "0 1px 3px rgba(0,0,0,0.9)" : "0 1px 3px rgba(255,255,255,0.9)" }}
                >
                  {m.title.length > 18 ? `${m.title.slice(0, 16)}…` : m.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* SELECTED MARKER DETAIL CARD INSPECTOR */}
      {activeMarker && (
        <div className="absolute bottom-4 right-4 z-30 max-w-xs sm:max-w-sm w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className={`p-4 rounded-3xl backdrop-blur-md border shadow-2xl ${theme.cardBg} ${theme.border} space-y-3`}>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${theme.badgeBg}`}>
                    {activeMarker.categoryLabel || activeMarker.type.toUpperCase()}
                  </span>
                  {activeMarker.provenance && (
                    <span className="text-[9px] font-mono text-[#8FA699]">
                      [{activeMarker.provenance}]
                    </span>
                  )}
                </div>
                <h5 className={`font-serif font-bold text-base ${theme.textColor}`}>
                  {activeMarker.title}
                </h5>
                {activeMarker.hindiTitle && (
                  <p className="font-devanagari text-xs text-[#B49252]">
                    {activeMarker.hindiTitle}
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveMarker(null)}
                className={`p-1.5 rounded-full hover:bg-black/10 ${theme.mutedText}`}
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeMarker.description && (
              <p className={`text-xs font-sans leading-relaxed ${theme.mutedText}`}>
                {activeMarker.description}
              </p>
            )}

            {/* Coordinates / Altitude Specs */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[10px] font-mono">
              <div>
                <span className="block text-[8px] uppercase text-[#6D8578]">Coordinates</span>
                <span className={theme.textColor}>
                  {activeMarker.lat.toFixed(3)}°N, {activeMarker.lng.toFixed(3)}°E
                </span>
              </div>
              {activeMarker.elevationMeters && (
                <div>
                  <span className="block text-[8px] uppercase text-[#6D8578]">Elevation</span>
                  <span className="text-[#E05A2B] font-bold">
                    {activeMarker.elevationMeters.toLocaleString()} m
                  </span>
                </div>
              )}
            </div>

            {activeMarker.actionLabel && (
              <button
                onClick={() => {
                  if (onSelectMarker) onSelectMarker(activeMarker);
                }}
                className="w-full py-2 rounded-xl bg-[#E05A2B] text-white text-xs font-bold font-mono uppercase tracking-wider hover:bg-[#C8491D] transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{activeMarker.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
