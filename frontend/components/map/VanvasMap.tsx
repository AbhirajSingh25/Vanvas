"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Compass, MapPin, Navigation, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Layers, Crosshair, Coffee,
  AlertTriangle, Shield, Utensils, Home, ShoppingBag, Fuel,
  Pill, Car, Footprints, Sparkles, Check, Info, ChevronRight, X,
  Clock, Phone, Navigation2, ExternalLink, Bookmark, HelpCircle,
  Tent, Heart, Building2, Store, Plus, RotateCcw, Wine, Bus, Mountain
} from "lucide-react";
import { getCurrentGPSPosition, GeoCoordinate } from "@/lib/locationService";
import "leaflet/dist/leaflet.css";

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

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  food: { bg: "bg-[#2A1D15]", border: "border-[#D95327]", text: "text-[#F58252]", iconBg: "#D95327" },
  dhaba: { bg: "bg-[#2A1D15]", border: "border-[#D95327]", text: "text-[#F58252]", iconBg: "#D95327" },
  cafe: { bg: "bg-[#2A2218]", border: "border-[#C59B47]", text: "text-[#E6C678]", iconBg: "#C59B47" },
  fuel: { bg: "bg-[#2E1815]", border: "border-[#E63946]", text: "text-[#FF6B6B]", iconBg: "#E63946" },
  medical: { bg: "bg-[#142A24]", border: "border-[#2A9D8F]", text: "text-[#48CAE4]", iconBg: "#2A9D8F" },
  hospital: { bg: "bg-[#142A24]", border: "border-[#2A9D8F]", text: "text-[#48CAE4]", iconBg: "#2A9D8F" },
  pharmacy: { bg: "bg-[#142A24]", border: "border-[#2A9D8F]", text: "text-[#48CAE4]", iconBg: "#2A9D8F" },
  stay: { bg: "bg-[#18232C]", border: "border-[#457B9D]", text: "text-[#A8DADC]", iconBg: "#457B9D" },
  camp: { bg: "bg-[#18232C]", border: "border-[#457B9D]", text: "text-[#A8DADC]", iconBg: "#457B9D" },
  rental: { bg: "bg-[#251B2E]", border: "border-[#9D4EDD]", text: "text-[#C77DFF]", iconBg: "#9D4EDD" },
  viewpoint: { bg: "bg-[#16271E]", border: "border-[#52B788]", text: "text-[#74C69D]", iconBg: "#52B788" },
  summit: { bg: "bg-[#16271E]", border: "border-[#52B788]", text: "text-[#74C69D]", iconBg: "#52B788" },
  temple: { bg: "bg-[#2D1F16]", border: "border-[#F4A261]", text: "text-[#F4A261]", iconBg: "#E76F51" },
  landmark: { bg: "bg-[#2D1F16]", border: "border-[#C59B47]", text: "text-[#E6C678]", iconBg: "#C59B47" },
  start: { bg: "bg-[#12241A]", border: "border-[#2D6A4F]", text: "text-[#52B788]", iconBg: "#2D6A4F" },
  origin: { bg: "bg-[#12241A]", border: "border-[#2D6A4F]", text: "text-[#52B788]", iconBg: "#2D6A4F" },
  destination: { bg: "bg-[#301614]", border: "border-[#E63946]", text: "text-[#FF758F]", iconBg: "#E63946" },
  danger: { bg: "bg-[#331111]", border: "border-[#FF0055]", text: "text-[#FF5470]", iconBg: "#FF0055" },
  liquor: { bg: "bg-[#231A26]", border: "border-[#A06CD5]", text: "text-[#C8B6FF]", iconBg: "#7209B7" },
};

function getCategorySymbol(type: string): string {
  switch (type.toLowerCase()) {
    case "food":
    case "dhaba":
      return "🍽️";
    case "cafe":
      return "☕";
    case "fuel":
      return "⛽";
    case "medical":
    case "hospital":
    case "pharmacy":
    case "emergency":
      return "✚";
    case "stay":
    case "camp":
    case "stays":
      return "🛏️";
    case "rental":
    case "rentals":
      return "🚗";
    case "viewpoint":
    case "views":
    case "summit":
      return "⛰️";
    case "temple":
    case "temples":
      return "🛕";
    case "landmark":
    case "landmarks":
    case "heritage":
    case "fort":
      return "🏰";
    case "market":
    case "shop":
    case "convenience":
      return "🛍️";
    case "liquor":
      return "🍷";
    case "danger":
      return "⚠️";
    case "start":
    case "origin":
      return "🏁";
    case "destination":
      return "📍";
    default:
      return "📍";
  }
}

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
  height = 480,
  enableFullscreen = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const leafletPolylinesRef = useRef<any[]>([]);

  const [activeMarker, setActiveMarker] = useState<VanvasMapMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<GeoCoordinate | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(["all"]));
  const [mapReady, setMapReady] = useState(false);

  // Sync external selectedMarkerId
  useEffect(() => {
    if (selectedMarkerId) {
      const found = markers.find((m) => m.id === selectedMarkerId);
      if (found) setActiveMarker(found);
    }
  }, [selectedMarkerId, markers]);

  const handleSelectMarker = useCallback((marker: VanvasMapMarker | null) => {
    setActiveMarker(marker);
    if (onSelectMarker) onSelectMarker(marker);
  }, [onSelectMarker]);

  // Compute default center if not passed
  const effectiveCenter = useMemo(() => {
    if (center && !isNaN(center.lat) && !isNaN(center.lng)) return center;
    if (markers.length > 0 && !isNaN(markers[0].lat) && !isNaN(markers[0].lng)) {
      return { lat: markers[0].lat, lng: markers[0].lng };
    }
    return { lat: 28.6139, lng: 77.2090 }; // Delhi default
  }, [center, markers]);

  // Layer filter handler
  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (layer === "all") return new Set(["all"]);
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

  const filteredMarkers = useMemo(() => {
    if (activeLayers.has("all")) return markers;
    return markers.filter((m) => {
      if (activeLayers.has("food") && ["food", "dhaba", "cafe"].includes(m.type)) return true;
      if (activeLayers.has("fuel") && m.type === "fuel") return true;
      if (activeLayers.has("medical") && ["hospital", "pharmacy", "emergency"].includes(m.type)) return true;
      if (activeLayers.has("stays") && ["stay", "camp"].includes(m.type)) return true;
      if (activeLayers.has("rentals") && m.type === "rental") return true;
      if (activeLayers.has("views") && ["viewpoint", "summit"].includes(m.type)) return true;
      if (activeLayers.has("temples") && m.type === "temple") return true;
      if (activeLayers.has("landmarks") && ["landmark", "heritage", "fort"].includes(m.type)) return true;
      return false;
    });
  }, [markers, activeLayers]);

  // Initialize Leaflet map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof window === "undefined") return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [effectiveCenter.lat, effectiveCenter.lng],
        zoom: zoom,
        zoomControl: false,
        touchExtend: true,
        tapHold: true,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
      } as any);

      // CartoDB Positron / Voyager Tile Layer with warm editorial tone
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      leafletMapRef.current = map;
      setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Markers & Polylines when data or filteredMarkers changes
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;
    const map = leafletMapRef.current;

    (async () => {
      const L = (await import("leaflet")).default;

      // Clear existing markers
      leafletMarkersRef.current.forEach((m) => m.remove());
      leafletMarkersRef.current = [];

      // Clear existing polylines
      leafletPolylinesRef.current.forEach((p) => p.remove());
      leafletPolylinesRef.current = [];

      // Render Routes
      routes.forEach((route) => {
        if (route.coordinates.length < 2) return;
        const latLngs = route.coordinates.map((c) => [c.lat, c.lng]);
        const polyline = L.polyline(latLngs as any, {
          color: route.color || "#D95327",
          weight: 4,
          opacity: 0.85,
          dashArray: route.dashed ? "6, 8" : undefined,
          lineJoin: "round",
        }).addTo(map);

        polyline.bindTooltip(
          `<strong>${route.name}</strong>${route.distanceKm ? ` • ${route.distanceKm} km` : ""}`,
          { className: "vanvas-map-tooltip", direction: "top" }
        );

        leafletPolylinesRef.current.push(polyline);
      });

      // Render Markers
      const boundsArr: any[] = [];

      filteredMarkers.forEach((m) => {
        if (isNaN(m.lat) || isNaN(m.lng)) return;
        boundsArr.push([m.lat, m.lng]);

        const catConfig = CATEGORY_COLORS[m.type] || CATEGORY_COLORS.food;
        const isSelected = activeMarker?.id === m.id;

        const customIcon = L.divIcon({
          className: "vanvas-custom-marker-wrapper",
          html: `
            <div style="
              width: ${isSelected ? "38px" : "30px"};
              height: ${isSelected ? "38px" : "30px"};
              border-radius: 50%;
              background: ${isSelected ? "#D95327" : "#14201A"};
              border: 2px solid ${isSelected ? "#FAF4E8" : catConfig.iconBg};
              box-shadow: 0 4px 12px rgba(0,0,0,0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              color: white;
              font-family: monospace;
              font-weight: bold;
              font-size: 11px;
            ">
              <span style="font-size: ${isSelected ? "14px" : "12px"};">${getCategorySymbol(m.type)}</span>
            </div>
          `,
          iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
          iconAnchor: [isSelected ? 19 : 15, isSelected ? 19 : 15],
        });

        const marker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(map);

        marker.on("click", () => {
          handleSelectMarker(m);
        });

        marker.bindTooltip(
          `<div style="font-family: serif; font-weight: bold; font-size: 12px; color: #FAF4E8;">${m.title}</div>
           ${m.categoryLabel ? `<div style="font-family: monospace; font-size: 9px; color: #C59B47; text-transform: uppercase;">${m.categoryLabel}</div>` : ""}`,
          { className: "vanvas-map-tooltip", direction: "top", offset: [0, -10] }
        );

        leafletMarkersRef.current.push(marker);
      });

      // Fit bounds if multiple points
      if (boundsArr.length > 1) {
        map.fitBounds(boundsArr, { padding: [40, 40], maxZoom: 14 });
      } else if (boundsArr.length === 1) {
        map.setView(boundsArr[0], zoom);
      }
    })();
  }, [filteredMarkers, routes, activeMarker, mapReady, handleSelectMarker, zoom]);

  // GPS Locate Action
  const handleGPSLocate = async () => {
    setIsLocating(true);
    const pos = await getCurrentGPSPosition();
    setIsLocating(false);

    if (pos.status === "GRANTED" && pos.coords && leafletMapRef.current) {
      setUserLocation(pos.coords);
      leafletMapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.2 });
    }
  };

  const handleZoomIn = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomOut();
  };

  const handleResetView = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([effectiveCenter.lat, effectiveCenter.lng], zoom, { duration: 0.8 });
    }
  };

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border-2 border-[#2D4539] bg-[#0E1612] shadow-2xl flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0 h-screen" : ""
      } ${className}`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-[#14201A] border-b border-[#23352B] flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C59B47] font-bold">
              VANVAS UNIVERSAL ROAD &amp; TRAIL MAP ENGINE
            </span>
          </div>
          {title && <h3 className="font-serif font-black text-white text-base leading-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-[#9EB5A9] font-serif">{subtitle}</p>}
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "all", label: "All POIs" },
            { id: "food", label: "Food & Dhabas" },
            { id: "fuel", label: "Fuel Pumps" },
            { id: "medical", label: "Medical / Meds" },
            { id: "stays", label: "Stays & Camps" },
            { id: "rentals", label: "Rentals" },
            { id: "views", label: "Viewpoints" },
            { id: "temples", label: "Temples" },
            { id: "landmarks", label: "Landmarks" },
          ].map((layer) => {
            const isActive = activeLayers.has(layer.id);
            return (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold whitespace-nowrap uppercase transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#D95327] text-white shadow-md border border-[#D95327]"
                    : "bg-[#0E1612] text-[#8FA699] border border-[#23352B] hover:text-white hover:border-[#385141]"
                }`}
              >
                {layer.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Interactive Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden" style={{ touchAction: "none" }}>
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{
            minHeight: "100%",
            touchAction: "pan-x pan-y",
          }}
        />

        {/* Map Control Buttons */}
        {showControls && (
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="w-9 h-9 rounded-2xl bg-[#14201A]/90 backdrop-blur-md border border-[#2D4539] text-white hover:bg-[#253D30] flex items-center justify-center shadow-lg transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-[#EFE5D2]" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-9 h-9 rounded-2xl bg-[#14201A]/90 backdrop-blur-md border border-[#2D4539] text-white hover:bg-[#253D30] flex items-center justify-center shadow-lg transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-[#EFE5D2]" />
            </button>
            <button
              onClick={handleGPSLocate}
              disabled={isLocating}
              className="w-9 h-9 rounded-2xl bg-[#14201A]/90 backdrop-blur-md border border-[#2D4539] text-[#52B788] hover:bg-[#253D30] flex items-center justify-center shadow-lg transition-all cursor-pointer"
              title="My GPS Location"
            >
              <Crosshair className={`w-4 h-4 ${isLocating ? "animate-spin text-[#D95327]" : ""}`} />
            </button>
            <button
              onClick={handleResetView}
              className="w-9 h-9 rounded-2xl bg-[#14201A]/90 backdrop-blur-md border border-[#2D4539] text-white hover:bg-[#253D30] flex items-center justify-center shadow-lg transition-all cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4 text-[#C59B47]" />
            </button>
            {enableFullscreen && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-9 h-9 rounded-2xl bg-[#14201A]/90 backdrop-blur-md border border-[#2D4539] text-white hover:bg-[#253D30] flex items-center justify-center shadow-lg transition-all cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}

        {/* Selected Marker Detail Card Overlay */}
        {activeMarker && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-30 p-5 rounded-3xl bg-[#14201A]/95 backdrop-blur-xl border-2 border-[#D95327] shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#253D30] text-[#C59B47] text-[9px] font-mono uppercase font-bold">
                    {activeMarker.categoryLabel || activeMarker.type.toUpperCase()}
                  </span>
                  {activeMarker.provenance && (
                    <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">
                      [{activeMarker.provenance}]
                    </span>
                  )}
                </div>
                <h4 className="font-serif font-black text-lg text-white leading-snug">
                  {activeMarker.title}
                </h4>
                {activeMarker.hindiTitle && (
                  <p className="font-devanagari text-xs text-[#C59B47]">
                    {activeMarker.hindiTitle}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleSelectMarker(null)}
                className="w-7 h-7 rounded-full bg-[#1F2F26] text-[#9EB5A9] hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeMarker.description && (
              <p className="text-xs text-[#9EB5A9] font-serif leading-relaxed">
                {activeMarker.description}
              </p>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-[#23352B] flex items-center gap-2 flex-wrap">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeMarker.lat},${activeMarker.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-[#D95327] hover:bg-[#C24319] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation2 className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>

              {activeMarker.phone && (
                <a
                  href={`tel:${activeMarker.phone}`}
                  className="py-2 px-3 rounded-xl bg-[#1B2C24] hover:bg-[#253D30] text-emerald-300 text-xs font-mono font-bold flex items-center gap-1 border border-[#3E6550]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              )}

              {onAskVanvas && (
                <button
                  onClick={() => onAskVanvas(`Tell me more about ${activeMarker.title} at coordinates ${activeMarker.lat}, ${activeMarker.lng}`)}
                  className="py-2 px-3 rounded-xl bg-[#1B2C24] hover:bg-[#253D30] text-[#C59B47] text-xs font-mono font-bold flex items-center gap-1 border border-[#C59B47]/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask VANVAS</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .vanvas-map-tooltip {
          background-color: #14201A !important;
          border: 1px solid #2D4539 !important;
          color: #FAF4E8 !important;
          border-radius: 12px !important;
          padding: 6px 10px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.7) !important;
        }
        .vanvas-map-tooltip::before {
          border-top-color: #14201A !important;
        }
        .leaflet-container {
          background-color: #0E1612 !important;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default VanvasMap;
