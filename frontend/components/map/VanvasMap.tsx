"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Compass, MapPin, Mountain, Navigation, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Layers, Crosshair, Coffee, Droplets,
  AlertTriangle, Shield, Utensils, Home, ShoppingBag, Fuel,
  Pill, Car, Footprints, Sparkles, Check, Info, ChevronRight, X,
  Clock, Phone, Navigation2, ExternalLink, Bookmark, HelpCircle,
  Tent, Heart, Building2, Store, Plus, RotateCcw, Wine, Bus
} from "lucide-react";
import { getCurrentGPSPosition, GeoCoordinate } from "@/lib/locationService";

export type VanvasMapMode = "core" | "trek" | "one-day" | "nearby" | "copilot";

export type MapPoiCategory =
  | "temple"
  | "cafe"
  | "food"
  | "dhaba"
  | "stay"
  | "fuel"
  | "rental"
  | "hospital"
  | "pharmacy"
  | "viewpoint"
  | "market"
  | "shop"
  | "convenience"
  | "parking"
  | "transit"
  | "emergency"
  | "restroom"
  | "water"
  | "danger"
  | "liquor"
  | "summit"
  | "camp"
  | "waypoint"
  | "start"
  | "origin"
  | "destination"
  | string;

export interface VanvasMapMarker {
  id: string;
  title: string;
  hindiTitle?: string;
  type: MapPoiCategory;
  lat: number;
  lng: number;
  elevationMeters?: number;
  description?: string;
  categoryLabel?: string;
  provenance?: "VERIFIED" | "DATABASE" | "ESTIMATED" | "USER PROVIDED";
  actionLabel?: string;
  isCurrentLocation?: boolean;
  distanceFormatted?: string;
  travelTime?: string;
  priceRange?: string;
  openingStatus?: string;
  phone?: string;
  address?: string;
  terrain?: string;
  difficulty?: string;
  facilities?: string[];
  whatToCarry?: string[];
  fieldWarning?: string;
  nearbyBusinesses?: string[];
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
  onAskVanvas?: (prompt: string) => void;
  title?: string;
  subtitle?: string;
  className?: string;
  showElevationProfile?: boolean;
  showLegend?: boolean;
  showControls?: boolean;
  height?: string | number;
  enableFullscreen?: boolean;
}

const COMMON_CITIES = [
  { name: "Delhi NCR", lat: 28.6139, lng: 77.2090 },
  { name: "Dehradun", lat: 30.3165, lng: 78.0322 },
  { name: "Rishikesh", lat: 30.0869, lng: 78.2676 },
  { name: "Nainital / Kainchi", lat: 29.4239, lng: 79.5165 },
  { name: "Manali", lat: 32.2396, lng: 77.1887 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
];

export const VanvasMap: React.FC<VanvasMapProps> = ({
  mode = "core",
  center,
  zoom = 12,
  markers = [],
  routes = [],
  selectedMarkerId,
  onSelectMarker,
  onAskVanvas,
  title,
  subtitle,
  className = "",
  showElevationProfile = false,
  showLegend = true,
  showControls = true,
  height = 460,
  enableFullscreen = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeMarker, setActiveMarker] = useState<VanvasMapMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<GeoCoordinate | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualLocationModal, setShowManualLocationModal] = useState(false);
  const [manualCityInput, setManualCityInput] = useState("");
  const [savedMarkers, setSavedMarkers] = useState<Set<string>>(new Set());

  // Active layer filter state
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["all"]));

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
    if (userLocation) allCoords.push({ lat: userLocation.latitude, lng: userLocation.longitude });

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

    const latPad = Math.max(0.015, (maxLat - minLat) * 0.22);
    const lngPad = Math.max(0.015, (maxLng - minLng) * 0.22);

    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad,
    };
  }, [markers, routes, center, userLocation]);

  // Coordinate projection from GPS to SVG viewBox coordinates [0..850, 0..520]
  const project = (lat: number, lng: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const lngSpan = bounds.maxLng - bounds.minLng || 1;
    const x = ((lng - bounds.minLng) / lngSpan) * 730 + 60;
    const y = ((bounds.maxLat - lat) / latSpan) * 410 + 55;
    return { x, y };
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (layer === "all") {
        return new Set(["all"]);
      }
      next.delete("all");
      if (next.has(layer)) {
        next.delete(layer);
        if (next.size === 0) next.add("all");
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  // Filter markers based on active layers
  const filteredMarkers = useMemo(() => {
    if (activeLayers.has("all")) return markers;
    return markers.filter((m) => {
      if (activeLayers.has("food") && ["food", "dhaba", "cafe"].includes(m.type)) return true;
      if (activeLayers.has("fuel") && m.type === "fuel") return true;
      if (activeLayers.has("medical") && ["hospital", "pharmacy", "emergency"].includes(m.type)) return true;
      if (activeLayers.has("shops") && ["market", "convenience", "shop"].includes(m.type)) return true;
      if (activeLayers.has("parking") && m.type === "parking") return true;
      if (activeLayers.has("stays") && ["stay", "camp"].includes(m.type)) return true;
      if (activeLayers.has("rentals") && m.type === "rental") return true;
      if (activeLayers.has("toilets") && m.type === "restroom") return true;
      if (activeLayers.has("viewpoints") && ["viewpoint", "summit"].includes(m.type)) return true;
      if (activeLayers.has("temples") && m.type === "temple") return true;
      if (activeLayers.has("liquor") && m.type === "liquor") return true;
      if (activeLayers.has("water") && m.type === "water") return true;
      if (activeLayers.has("danger") && m.type === "danger") return true;
      return false;
    });
  }, [markers, activeLayers]);

  // SVG route path generator with gentle curved or segmented aesthetic
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

  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const res = await getCurrentGPSPosition({ enableHighAccuracy: true, timeout: 6000 });
      setIsLocating(false);
      if (res.status === "GRANTED" && res.coords) {
        setUserLocation(res.coords);
      } else {
        setLocationError(res.errorMessage || "Location unavailable.");
        setShowManualLocationModal(true);
      }
    } catch {
      setIsLocating(false);
      setLocationError("Location unavailable. Please enter location manually.");
      setShowManualLocationModal(true);
    }
  };

  const setManualLocation = (city: { name: string; lat: number; lng: number }) => {
    setUserLocation({
      latitude: city.lat,
      longitude: city.lng,
      timestamp: Date.now(),
    });
    setShowManualLocationModal(false);
    setLocationError(null);
  };

  const resetView = () => {
    setPanOffset({ x: 0, y: 0 });
    setCurrentZoom(zoom);
  };

  const toggleSaveMarker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedMarkers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Mode Theme Styling Constants
  const theme = useMemo(() => {
    switch (mode) {
      case "trek":
        return {
          bg: "bg-[#0B1410]",
          cardBg: "bg-[#111F18]",
          border: "border-[#243B30]",
          gridStroke: "#162820",
          contourStroke: "#1F382B",
          textColor: "text-[#FAF4E8]",
          mutedText: "text-[#8EA598]",
          accent: "#E05A2B",
          secondaryAccent: "#B49252",
          badgeBg: "bg-[#1A2E24] text-[#B49252] border-[#B49252]/40",
          routeStroke: "#E05A2B",
          routeSecondary: "#B49252",
          compassColor: "#B49252",
          paperTexture: "opacity-15 bg-[radial-gradient(#E05A2B_1px,transparent_0)]",
        };
      case "one-day":
        return {
          bg: "bg-[#0F1714]",
          cardBg: "bg-[#16241E]",
          border: "border-[#2B4035]",
          gridStroke: "#1B2C24",
          contourStroke: "#243D31",
          textColor: "text-[#FAF4E8]",
          mutedText: "text-[#9EB5A9]",
          accent: "#E08A56",
          secondaryAccent: "#C59B47",
          badgeBg: "bg-[#253D30] text-[#E08A56] border-[#D95327]/40",
          routeStroke: "#E08A56",
          routeSecondary: "#52B788",
          compassColor: "#E08A56",
          paperTexture: "opacity-10 bg-[radial-gradient(#E08A56_1px,transparent_0)]",
        };
      case "nearby":
        return {
          bg: "bg-[#F7F4EB]",
          cardBg: "bg-[#EFE8DC]",
          border: "border-[#D6C8B2]",
          gridStroke: "#E6DCBE",
          contourStroke: "#D8CDB2",
          textColor: "text-[#1C2822]",
          mutedText: "text-[#627267]",
          accent: "#B65E3C",
          secondaryAccent: "#173B32",
          badgeBg: "bg-[#173B32] text-[#FAF7F0] border-[#173B32]",
          routeStroke: "#173B32",
          routeSecondary: "#B65E3C",
          compassColor: "#173B32",
          paperTexture: "opacity-25 bg-[radial-gradient(#173B32_1px,transparent_0)]",
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
          paperTexture: "opacity-20 bg-[radial-gradient(#7B4D36_1px,transparent_0)]",
        };
    }
  }, [mode]);

  // Marker Icon Renderer
  const renderMarkerIcon = (m: VanvasMapMarker, isSelected: boolean) => {
    const isDark = mode === "trek" || mode === "one-day";
    let bg = isDark ? "bg-[#1A2E24] text-[#FAF4E8]" : "bg-[#FAF6EE] text-[#173B32]";
    let border = isDark ? "border-[#3A5646]" : "border-[#C8B89E]";
    let icon = <MapPin className="w-3.5 h-3.5" />;

    switch (m.type) {
      case "start":
      case "origin":
        bg = "bg-emerald-600 text-white";
        border = "border-emerald-400";
        icon = <Footprints className="w-3.5 h-3.5" />;
        break;
      case "summit":
        bg = "bg-amber-500 text-stone-900";
        border = "border-amber-300";
        icon = <Mountain className="w-4 h-4 font-bold" />;
        break;
      case "temple":
        bg = "bg-[#B49252] text-white";
        border = "border-amber-200";
        icon = <Building2 className="w-3.5 h-3.5" />;
        break;
      case "cafe":
        bg = isDark ? "bg-[#3D2C1E] text-amber-300" : "bg-[#F3E8D6] text-[#7B4D36]";
        icon = <Coffee className="w-3.5 h-3.5" />;
        break;
      case "food":
      case "dhaba":
        bg = isDark ? "bg-[#3A2218] text-orange-300" : "bg-[#F8E2D6] text-[#B65E3C]";
        icon = <Utensils className="w-3.5 h-3.5" />;
        break;
      case "water":
        bg = "bg-sky-600 text-white";
        border = "border-sky-300";
        icon = <Droplets className="w-3.5 h-3.5" />;
        break;
      case "danger":
        bg = "bg-rose-600 text-white";
        border = "border-rose-400";
        icon = <AlertTriangle className="w-3.5 h-3.5" />;
        break;
      case "emergency":
      case "hospital":
        bg = "bg-red-700 text-white";
        border = "border-red-400";
        icon = <Shield className="w-3.5 h-3.5" />;
        break;
      case "pharmacy":
        bg = "bg-teal-700 text-white";
        border = "border-teal-300";
        icon = <Pill className="w-3.5 h-3.5" />;
        break;
      case "fuel":
        bg = "bg-amber-600 text-white";
        border = "border-amber-400";
        icon = <Fuel className="w-3.5 h-3.5" />;
        break;
      case "rental":
        bg = "bg-blue-600 text-white";
        border = "border-blue-300";
        icon = <Car className="w-3.5 h-3.5" />;
        break;
      case "stay":
      case "camp":
        bg = isDark ? "bg-[#21352A] text-emerald-300" : "bg-[#E2ECE6] text-[#173B32]";
        icon = <Tent className="w-3.5 h-3.5" />;
        break;
      case "market":
      case "shop":
      case "convenience":
        bg = isDark ? "bg-[#2C2B38] text-purple-300" : "bg-[#EFE8F5] text-purple-900";
        icon = <Store className="w-3.5 h-3.5" />;
        break;
      case "liquor":
        bg = "bg-amber-800 text-amber-100";
        border = "border-amber-500";
        icon = <Wine className="w-3.5 h-3.5" />;
        break;
      case "transit":
        bg = "bg-indigo-600 text-white";
        border = "border-indigo-300";
        icon = <Bus className="w-3.5 h-3.5" />;
        break;
      case "viewpoint":
        bg = "bg-violet-700 text-white";
        border = "border-violet-300";
        icon = <Compass className="w-3.5 h-3.5" />;
        break;
      default:
        break;
    }

    return (
      <div
        className={`relative flex items-center justify-center rounded-full border shadow-md transition-transform ${bg} ${border} ${
          isSelected ? "scale-135 ring-4 ring-amber-400/70 z-30" : "hover:scale-115 z-10"
        }`}
        style={{ width: isSelected ? 34 : 26, height: isSelected ? 34 : 26 }}
      >
        {icon}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-3xl border ${theme.border} ${theme.bg} ${className} ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : ""
      }`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* Background Vintage Paper Texture Layer */}
      <div className={`absolute inset-0 pointer-events-none ${theme.paperTexture} bg-[size:18px_18px]`} />

      {/* Header Bar with Mode Title & Coordinates */}
      <div className="absolute top-3.5 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#173B32]/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-[#D8CBB2]/30 shadow-lg text-[#FAF4E8]">
          <Compass className="w-4 h-4 text-[#B49252] animate-spin-slow" />
          <div>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase block leading-none">
              {title || (mode === "trek" ? "EXPEDITION FIELD MAP" : mode === "one-day" ? "DESI HIGHWAY MAP" : "VANVAS SANCTUARY RADAR")}
            </span>
            {subtitle && (
              <span className="text-[9px] text-[#D8DED5]/80 font-serif block leading-tight">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Layer Filters Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pointer-events-auto p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 scrollbar-none">
          <button
            onClick={() => toggleLayer("all")}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all ${
              activeLayers.has("all") ? "bg-[#B65E3C] text-white shadow-md" : "text-stone-300 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => toggleLayer("food")}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
              activeLayers.has("food") ? "bg-amber-600 text-white" : "text-stone-300 hover:text-white"
            }`}
          >
            <Utensils className="w-3 h-3" /> Food
          </button>
          <button
            onClick={() => toggleLayer("fuel")}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
              activeLayers.has("fuel") ? "bg-amber-500 text-stone-900" : "text-stone-300 hover:text-white"
            }`}
          >
            <Fuel className="w-3 h-3" /> Fuel
          </button>
          <button
            onClick={() => toggleLayer("medical")}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
              activeLayers.has("medical") ? "bg-red-600 text-white" : "text-stone-300 hover:text-white"
            }`}
          >
            <Shield className="w-3 h-3" /> Medical
          </button>
          <button
            onClick={() => toggleLayer("stays")}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
              activeLayers.has("stays") ? "bg-emerald-600 text-white" : "text-stone-300 hover:text-white"
            }`}
          >
            <Tent className="w-3 h-3" /> Stays
          </button>
          <button
            onClick={() => toggleLayer("rentals")}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
              activeLayers.has("rentals") ? "bg-blue-600 text-white" : "text-stone-300 hover:text-white"
            }`}
          >
            <Car className="w-3 h-3" /> Rentals
          </button>
          <button
            onClick={() => toggleLayer("viewpoints")}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
              activeLayers.has("viewpoints") ? "bg-violet-600 text-white" : "text-stone-300 hover:text-white"
            }`}
          >
            <Mountain className="w-3 h-3" /> Views
          </button>
        </div>
      </div>

      {/* Main SVG Interactive Map Canvas */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 850 520"
          className="w-full h-full"
          style={{
            transform: `scale(${currentZoom / 12}) translate(${panOffset.x / (currentZoom / 12)}px, ${
              panOffset.y / (currentZoom / 12)
            }px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <defs>
            {/* Indian Journal Contour Pattern */}
            <pattern id="contour-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M0,30 Q15,10 30,30 T60,30 M0,50 Q20,35 40,50 T60,50 M0,10 Q25,25 50,10"
                fill="none"
                stroke={theme.contourStroke}
                strokeWidth="0.75"
                strokeDasharray="2,2"
              />
            </pattern>
            {/* Vintage Grid */}
            <pattern id="grid-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke={theme.gridStroke} strokeWidth="0.5" opacity="0.6" />
            </pattern>
          </defs>

          {/* Background Grid and Contour Fill */}
          <rect width="850" height="520" fill="url(#grid-pattern)" />
          <rect width="850" height="520" fill="url(#contour-pattern)" />

          {/* Compass Rose Illustrated Symbol */}
          <g transform="translate(780, 70)" opacity="0.35">
            <circle r="30" fill="none" stroke={theme.compassColor} strokeWidth="1" strokeDasharray="3,3" />
            <line x1="0" y1="-32" x2="0" y2="32" stroke={theme.compassColor} strokeWidth="1.5" />
            <line x1="-32" y1="0" x2="32" y2="0" stroke={theme.compassColor} strokeWidth="1.5" />
            <polygon points="0,-32 -5,-10 5,-10" fill={theme.compassColor} />
            <text x="-4" y="-36" fill={theme.compassColor} fontSize="9" fontWeight="bold" fontFamily="monospace">N</text>
          </g>

          {/* Topographic Elevation Rings for Trek mode */}
          {mode === "trek" && (
            <g opacity="0.4">
              <ellipse cx="420" cy="240" rx="280" ry="170" fill="none" stroke="#254234" strokeWidth="1" strokeDasharray="4,4" />
              <ellipse cx="440" cy="230" rx="200" ry="120" fill="none" stroke="#2E5240" strokeWidth="1.2" strokeDasharray="3,3" />
              <ellipse cx="460" cy="210" rx="120" ry="70" fill="none" stroke="#3A6650" strokeWidth="1.5" />
              <text x="490" y="200" fill="#B49252" fontSize="9" fontFamily="monospace">4,000m CHANDRASHILA</text>
            </g>
          )}

          {/* Render Routes */}
          {routePaths.map((r) => (
            <g key={r.id}>
              {/* Route Shadow / Buffer */}
              <path
                d={r.d}
                fill="none"
                stroke={theme.border}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
              />
              {/* Main Hand-Drawn Route Stroke */}
              <path
                d={r.d}
                fill="none"
                stroke={r.color || theme.routeStroke}
                strokeWidth="3.5"
                strokeDasharray={r.dashed ? "6,4" : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Current User GPS Location Ring */}
          {userLocation && (
            <g>
              {(() => {
                const { x, y } = project(userLocation.latitude, userLocation.longitude);
                return (
                  <g transform={`translate(${x}, ${y})`}>
                    <circle r="18" fill="#3B82F6" opacity="0.25" className="animate-ping" />
                    <circle r="8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
                    <text x="12" y="4" fill="#2563EB" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      YOU (GPS)
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Render Markers */}
          {filteredMarkers.map((m) => {
            const { x, y } = project(m.lat, m.lng);
            const isSelected = activeMarker?.id === m.id;

            return (
              <g
                key={m.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMarker(m);
                  if (onSelectMarker) onSelectMarker(m);
                }}
              >
                {/* Marker HTML Overlay */}
                <foreignObject x="-17" y="-17" width="34" height="34" className="overflow-visible">
                  {renderMarkerIcon(m, isSelected)}
                </foreignObject>

                {/* Marker Text Label */}
                <text
                  x="0"
                  y="24"
                  textAnchor="middle"
                  fill={mode === "trek" || mode === "one-day" ? "#FAF4E8" : "#173B32"}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="serif"
                  className="pointer-events-none drop-shadow-sm select-none"
                >
                  {m.title}
                </text>
                {m.elevationMeters && (
                  <text
                    x="0"
                    y="34"
                    textAnchor="middle"
                    fill="#B49252"
                    fontSize="8"
                    fontFamily="monospace"
                    className="pointer-events-none select-none"
                  >
                    {m.elevationMeters}m
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Controls Overlay */}
      {showControls && (
        <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-2">
          <button
            onClick={() => setCurrentZoom((z) => Math.min(20, z + 1))}
            aria-label="Zoom in"
            className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#FAF4E8] hover:bg-[#B65E3C] border border-[#D8CBB2]/40 shadow-lg flex items-center justify-center transition-all active:scale-95"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentZoom((z) => Math.max(6, z - 1))}
            aria-label="Zoom out"
            className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#FAF4E8] hover:bg-[#B65E3C] border border-[#D8CBB2]/40 shadow-lg flex items-center justify-center transition-all active:scale-95"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            aria-label="Locate me GPS"
            className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#FAF4E8] hover:bg-[#B65E3C] border border-[#D8CBB2]/40 shadow-lg flex items-center justify-center transition-all active:scale-95"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={resetView}
            aria-label="Reset route view"
            className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#FAF4E8] hover:bg-[#B65E3C] border border-[#D8CBB2]/40 shadow-lg flex items-center justify-center transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {enableFullscreen && (
            <button
              onClick={() => setIsFullscreen((f) => !f)}
              aria-label="Toggle fullscreen"
              className="w-10 h-10 rounded-2xl bg-[#173B32] text-[#FAF4E8] hover:bg-[#B65E3C] border border-[#D8CBB2]/40 shadow-lg flex items-center justify-center transition-all active:scale-95"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}

      {/* Selected Marker Inspector Card (Bottom / Modal Sheet) */}
      {activeMarker && (
        <div className="absolute bottom-4 left-4 right-16 sm:right-auto sm:max-w-md z-30 animate-slide-up">
          <div className="bg-[#FAF4E8] text-[#173B32] rounded-3xl p-5 border-2 border-[#173B32] shadow-2xl space-y-3 relative">
            <button
              onClick={() => {
                setActiveMarker(null);
                if (onSelectMarker) onSelectMarker(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-full bg-[#173B32]/10 hover:bg-[#173B32]/20 text-[#173B32] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#173B32] text-[#FAF4E8] text-[9px] font-mono uppercase font-bold tracking-wider">
                {activeMarker.categoryLabel || activeMarker.type}
              </span>
              {activeMarker.provenance && (
                <span className="px-2 py-0.5 rounded-full bg-[#B49252]/20 text-[#7B4D36] text-[9px] font-mono font-bold">
                  {activeMarker.provenance}
                </span>
              )}
              {activeMarker.elevationMeters && (
                <span className="text-[10px] font-mono text-[#7B4D36]">
                  {activeMarker.elevationMeters}m Alt
                </span>
              )}
            </div>

            {/* Title & Hindi */}
            <div>
              <h4 className="text-lg font-serif font-black text-[#173B32] leading-tight">
                {activeMarker.title}
              </h4>
              {activeMarker.hindiTitle && (
                <span className="font-devanagari text-sm text-[#B49252] font-bold">
                  {activeMarker.hindiTitle}
                </span>
              )}
            </div>

            {/* Description */}
            {activeMarker.description && (
              <p className="text-xs text-[#7B4D36] font-serif leading-relaxed">
                {activeMarker.description}
              </p>
            )}

            {/* Metadata Chips: Distance, Time, Price */}
            <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[#173B32]">
              {activeMarker.distanceFormatted && (
                <span className="px-2 py-1 rounded-lg bg-[#EFE5D2] flex items-center gap-1">
                  <Navigation2 className="w-3 h-3 text-[#B65E3C]" /> {activeMarker.distanceFormatted}
                </span>
              )}
              {activeMarker.travelTime && (
                <span className="px-2 py-1 rounded-lg bg-[#EFE5D2] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#173B32]" /> {activeMarker.travelTime}
                </span>
              )}
              {activeMarker.priceRange && (
                <span className="px-2 py-1 rounded-lg bg-[#EFE5D2] font-bold text-[#B65E3C]">
                  {activeMarker.priceRange}
                </span>
              )}
            </div>

            {/* Trek Field Intelligence Extra Notes */}
            {activeMarker.fieldWarning && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{activeMarker.fieldWarning}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-[#D8CBB2] flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${activeMarker.lat},${activeMarker.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#B65E3C] transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate</span>
              </a>

              <button
                onClick={(e) => toggleSaveMarker(activeMarker.id, e)}
                className={`p-2 rounded-xl border transition-colors ${
                  savedMarkers.has(activeMarker.id)
                    ? "bg-[#B65E3C] text-white border-[#B65E3C]"
                    : "bg-[#EFE5D2] text-[#173B32] border-[#D8CBB2] hover:bg-[#D8CBB2]"
                }`}
                title="Save marker"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              {onAskVanvas && (
                <button
                  onClick={() => onAskVanvas(`Tell me more about ${activeMarker.title} and practical tips to visit.`)}
                  className="px-3 py-2 rounded-xl bg-[#B49252] text-white text-xs font-bold font-mono uppercase flex items-center gap-1 hover:bg-[#96773B] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Location Fallback Modal */}
      {showManualLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF4E8] text-[#173B32] rounded-3xl max-w-md w-full p-6 border-2 border-[#173B32] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#B65E3C]" />
                <h3 className="text-xl font-serif font-black">Select Your Location</h3>
              </div>
              <button
                onClick={() => setShowManualLocationModal(false)}
                className="p-1 rounded-full hover:bg-black/10 text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#7B4D36] font-serif">
              {locationError || "GPS is unavailable. Choose your departure or current city to center your map and road trip routes."}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {COMMON_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => setManualLocation(city)}
                  className="p-3 rounded-2xl bg-[#EFE5D2] hover:bg-[#173B32] hover:text-[#FAF4E8] text-xs font-mono font-bold text-left transition-all border border-[#D8CBB2]"
                >
                  📍 {city.name}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setManualLocation({ name: "Delhi NCR", lat: 28.6139, lng: 77.2090 });
                }}
                className="w-full py-2.5 rounded-xl bg-[#173B32] text-[#FAF4E8] text-xs font-bold font-mono uppercase tracking-wider"
              >
                Default to Delhi NCR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VanvasMap;
