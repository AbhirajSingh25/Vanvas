"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw,
  Navigation, Crosshair, MapPin, Compass, Utensils, Coffee,
  BedDouble, Fuel, Landmark, Trees, Eye, Waves, Sparkles, Check
} from "lucide-react";
import { RoadTripStop, RoadTripFoodOption, Hotel } from "@/types";
import "leaflet/dist/leaflet.css";

export interface RoadTripMapPoi {
  id: string;
  name: string;
  type: string; // 'origin' | 'destination' | 'halt' | 'food' | 'fuel' | 'stay' | 'stop' | 'attraction'
  category?: string;
  lat: number;
  lng: number;
  detour_km?: number;
  detour_time_mins?: number;
  time_needed_mins?: number;
  approx_cost?: number;
  why_stop?: string;
  day_number?: number;
  isAdded?: boolean;
  price_label?: string;
  rawStop?: RoadTripStop;
}

export interface RoadTripMapProps {
  routeGeometry: Array<[number, number]>;
  activeLegGeometry?: Array<[number, number]>;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  halts?: Array<{ name: string; lat: number; lng: number; day: number }>;
  stops?: RoadTripStop[];
  addedStopIds?: Set<string>;
  selectedStopId?: string | null;
  onSelectStop?: (stop: RoadTripMapPoi | null) => void;
  selectedDay?: number;
  activeCategoryFilter?: string;
  className?: string;
  height?: string | number;
}

export const RoadTripMap: React.FC<RoadTripMapProps> = ({
  routeGeometry = [],
  activeLegGeometry = [],
  origin,
  destination,
  halts = [],
  stops = [],
  addedStopIds = new Set(),
  selectedStopId = null,
  onSelectStop,
  selectedDay = 1,
  activeCategoryFilter = "all",
  className = "",
  height = "100%",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const leafletPolylinesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Build unified POI list
  const allPois = useMemo<RoadTripMapPoi[]>(() => {
    const list: RoadTripMapPoi[] = [];

    // Origin
    if (origin && !isNaN(origin.lat) && !isNaN(origin.lng)) {
      list.push({
        id: "poi-origin",
        name: origin.name,
        type: "origin",
        lat: origin.lat,
        lng: origin.lng,
        why_stop: "Starting Point",
      });
    }

    // Destination
    if (destination && !isNaN(destination.lat) && !isNaN(destination.lng)) {
      list.push({
        id: "poi-destination",
        name: destination.name,
        type: "destination",
        lat: destination.lat,
        lng: destination.lng,
        why_stop: "Final Destination",
      });
    }

    // Halts
    halts.forEach((h, idx) => {
      if (!isNaN(h.lat) && !isNaN(h.lng)) {
        list.push({
          id: `poi-halt-${idx + 1}`,
          name: h.name,
          type: "halt",
          lat: h.lat,
          lng: h.lng,
          day_number: h.day,
          why_stop: `Overnight Halt for Day ${h.day}`,
        });
      }
    });

    // Checkpoint Stops
    stops.forEach((s) => {
      if (!isNaN(s.lat) && !isNaN(s.lng)) {
        const cat = (s.category || s.type || "").toLowerCase();
        let pType = "stop";
        if (cat.includes("food") || cat.includes("dhaba") || cat.includes("cafe")) pType = "food";
        else if (cat.includes("fuel") || cat.includes("petrol")) pType = "fuel";
        else if (cat.includes("stay") || cat.includes("hotel") || cat.includes("resort")) pType = "stay";
        else if (cat.includes("fort") || cat.includes("heritage") || cat.includes("temple")) pType = "heritage";
        else if (cat.includes("view") || cat.includes("nature") || cat.includes("lake")) pType = "viewpoint";

        list.push({
          id: s.id,
          name: s.name,
          type: pType,
          category: s.category || s.type,
          lat: s.lat,
          lng: s.lng,
          detour_km: s.detour_km ?? s.distance_off_route_km,
          detour_time_mins: s.detour_time_mins,
          time_needed_mins: s.time_needed_mins,
          approx_cost: s.approx_cost,
          why_stop: s.why_stop,
          isAdded: addedStopIds.has(s.id),
          rawStop: s,
        });
      }
    });

    return list;
  }, [origin, destination, halts, stops, addedStopIds]);

  // Filtered POIs based on active category
  const filteredPois = useMemo(() => {
    if (activeCategoryFilter === "all") return allPois;
    return allPois.filter((p) => {
      if (p.type === "origin" || p.type === "destination" || p.type === "halt") return true;
      const cat = (p.category || p.type || "").toLowerCase();
      if (activeCategoryFilter === "food") return cat.includes("food") || cat.includes("dhaba") || cat.includes("cafe");
      if (activeCategoryFilter === "fuel") return cat.includes("fuel") || cat.includes("petrol");
      if (activeCategoryFilter === "stay") return cat.includes("stay") || cat.includes("hotel") || cat.includes("camp");
      if (activeCategoryFilter === "explore") return cat.includes("heritage") || cat.includes("fort") || cat.includes("view") || cat.includes("nature");
      if (activeCategoryFilter === "activities") return cat.includes("activity") || cat.includes("adventure") || cat.includes("trek");
      return true;
    });
  }, [allPois, activeCategoryFilter]);

  // Initial Leaflet Map Setup
  useEffect(() => {
    if (!mapContainerRef.current || typeof window === "undefined") return;
    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const initialCenter: [number, number] =
        origin && !isNaN(origin.lat) ? [origin.lat, origin.lng] : [28.6139, 77.2090];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        touchExtend: true,
        tapHold: true,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
      } as any);

      // OpenStreetMap standard keyless raster tile layer
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        crossOrigin: true,
      }).addTo(map);

      leafletMapRef.current = map;
      setMapReady(true);

      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 150);

      const handleResize = () => {
        if (map) map.invalidateSize();
      };
      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);
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

  // Update polylines and markers
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;
    const map = leafletMapRef.current;

    (async () => {
      const L = (await import("leaflet")).default;

      // Clear existing markers & polylines
      leafletMarkersRef.current.forEach((m) => m.remove());
      leafletMarkersRef.current = [];
      leafletPolylinesRef.current.forEach((p) => p.remove());
      leafletPolylinesRef.current = [];

      const bounds: [number, number][] = [];

      // 1. Draw Background Route Glow / Casing
      if (routeGeometry.length > 1) {
        const fullLatLngs = routeGeometry.map((pt) => [pt[0], pt[1]]);
        
        // Base dark casing
        const baseCasing = L.polyline(fullLatLngs as any, {
          color: "#0F2924",
          weight: 7,
          opacity: 0.9,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(map);
        leafletPolylinesRef.current.push(baseCasing);

        // Vibrant highway core line
        const mainRoute = L.polyline(fullLatLngs as any, {
          color: "#B65E3C",
          weight: 4.5,
          opacity: 0.95,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(map);
        leafletPolylinesRef.current.push(mainRoute);

        routeGeometry.forEach((pt) => bounds.push([pt[0], pt[1]]));
      }

      // 2. Draw Active Leg Highlight (if available)
      if (activeLegGeometry && activeLegGeometry.length > 1) {
        const legLatLngs = activeLegGeometry.map((pt) => [pt[0], pt[1]]);
        const activeLegLine = L.polyline(legLatLngs as any, {
          color: "#B49252",
          weight: 6,
          opacity: 0.95,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(map);
        leafletPolylinesRef.current.push(activeLegLine);
      }

      // 3. Render Markers
      filteredPois.forEach((poi) => {
        if (isNaN(poi.lat) || isNaN(poi.lng)) return;
        bounds.push([poi.lat, poi.lng]);

        const isSelected = selectedStopId === poi.id;
        const isOrigin = poi.type === "origin";
        const isDestination = poi.type === "destination";
        const isHalt = poi.type === "halt";

        let pinBg = "#173B32";
        let pinBorder = "#EFE5D2";
        let pinSize = isSelected ? 38 : 30;
        let symbol = "📍";
        let pulseRing = "";

        if (isOrigin) {
          pinBg = "#2D6A4F";
          pinBorder = "#52B788";
          pinSize = 34;
          symbol = "🏁";
        } else if (isDestination) {
          pinBg = "#9E2A2B";
          pinBorder = "#E63946";
          pinSize = 34;
          symbol = "🎯";
        } else if (isHalt) {
          pinBg = "#B49252";
          pinBorder = "#FAF4E8";
          pinSize = 32;
          symbol = "🛏️";
        } else if (poi.type === "food") {
          pinBg = "#B65E3C";
          pinBorder = "#E5D5BA";
          symbol = "🍽️";
        } else if (poi.type === "fuel") {
          pinBg = "#D90429";
          pinBorder = "#FFCCD5";
          symbol = "⛽";
        } else if (poi.type === "stay") {
          pinBg = "#1D3557";
          pinBorder = "#A8DADC";
          symbol = "🛏️";
        } else if (poi.type === "heritage") {
          pinBg = "#8C6D37";
          pinBorder = "#F3E9D2";
          symbol = "🏰";
        } else if (poi.type === "viewpoint") {
          pinBg = "#2A9D8F";
          pinBorder = "#E9C46A";
          symbol = "⛰️";
        }

        if (poi.isAdded) {
          pinBorder = "#52B788";
          pulseRing = `box-shadow: 0 0 0 3px #52B788, 0 4px 14px rgba(0,0,0,0.45);`;
        } else if (isSelected) {
          pinBorder = "#FAF4E8";
          pinBg = "#B65E3C";
          pulseRing = `box-shadow: 0 0 0 4px #B65E3C, 0 6px 18px rgba(0,0,0,0.55);`;
        } else {
          pulseRing = `box-shadow: 0 3px 10px rgba(0,0,0,0.35);`;
        }

        const iconHtml = `
          <div style="
            width: ${pinSize}px;
            height: ${pinSize}px;
            border-radius: 50%;
            background: ${pinBg};
            border: 2.5px solid ${pinBorder};
            ${pulseRing}
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? 16 : 13}px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            user-select: none;
          ">
            ${symbol}
          </div>
        `;

        const customIcon = L.divIcon({
          className: "road-trip-custom-marker",
          html: iconHtml,
          iconSize: [pinSize, pinSize],
          iconAnchor: [pinSize / 2, pinSize / 2],
        });

        const marker = L.marker([poi.lat, poi.lng], { icon: customIcon }).addTo(map);

        // Tooltip
        const tooltipContent = `
          <div style="font-family: serif; font-weight: 800; font-size: 12px; color: #FAF4E8;">
            ${poi.name}
          </div>
          ${
            poi.detour_km !== undefined
              ? `<div style="font-family: monospace; font-size: 10px; color: #52B788; font-weight: bold;">
                  +${poi.detour_km} km detour
                </div>`
              : poi.why_stop
              ? `<div style="font-family: monospace; font-size: 9px; color: #C59B47;">
                  ${poi.why_stop}
                </div>`
              : ""
          }
        `;

        marker.bindTooltip(tooltipContent, {
          className: "vanvas-map-tooltip",
          direction: "top",
          offset: [0, -8],
        });

        marker.on("click", () => {
          if (onSelectStop) onSelectStop(poi);
          map.flyTo([poi.lat, poi.lng], Math.max(map.getZoom(), 11), {
            duration: 0.8,
          });
        });

        leafletMarkersRef.current.push(marker);
      });

      // Fit bounds appropriately
      if (bounds.length > 1 && !selectedStopId) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    })();
  }, [filteredPois, routeGeometry, activeLegGeometry, selectedStopId, mapReady, selectedDay]);

  // Focus selected stop smoothly
  useEffect(() => {
    if (!leafletMapRef.current || !selectedStopId) return;
    const target = allPois.find((p) => p.id === selectedStopId);
    if (target && !isNaN(target.lat) && !isNaN(target.lng)) {
      leafletMapRef.current.flyTo([target.lat, target.lng], 12, {
        duration: 0.75,
      });
    }
  }, [selectedStopId, allPois]);

  // Controls Handlers
  const handleZoomIn = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (leafletMapRef.current) leafletMapRef.current.zoomOut();
  };

  const handleFitFullRoute = () => {
    if (!leafletMapRef.current) return;
    const bounds: [number, number][] = [];
    if (origin && !isNaN(origin.lat)) bounds.push([origin.lat, origin.lng]);
    if (destination && !isNaN(destination.lat)) bounds.push([destination.lat, destination.lng]);
    routeGeometry.forEach((pt) => bounds.push([pt[0], pt[1]]));
    if (bounds.length > 1) {
      leafletMapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  };

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border-2 border-[#E5D5BA] bg-[#173B32] shadow-xl flex flex-col isolate ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0 h-screen" : ""
      } ${className}`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* Map Interactive Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden" style={{ minHeight: "280px" }}>
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "100%" }} />

        {/* Floating Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-[#FAF7F0]/90 backdrop-blur-md border border-[#E5D5BA] text-[#173B32] hover:bg-white flex items-center justify-center shadow-md transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-[#FAF7F0]/90 backdrop-blur-md border border-[#E5D5BA] text-[#173B32] hover:bg-white flex items-center justify-center shadow-md transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleFitFullRoute}
            className="w-8 h-8 rounded-xl bg-[#FAF7F0]/90 backdrop-blur-md border border-[#E5D5BA] text-[#B65E3C] hover:bg-white flex items-center justify-center shadow-md transition-all cursor-pointer"
            title="Fit Full Route"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-8 h-8 rounded-xl bg-[#FAF7F0]/90 backdrop-blur-md border border-[#E5D5BA] text-[#173B32] hover:bg-white flex items-center justify-center shadow-md transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Route Source Pill Badge */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-[#173B32]/90 backdrop-blur-md border border-[#B49252] text-[#EFE5D2] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OSRM Highway Geometry</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .vanvas-map-tooltip {
          background-color: #173B32 !important;
          border: 1.5px solid #B49252 !important;
          color: #FAF4E8 !important;
          border-radius: 12px !important;
          padding: 6px 10px !important;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4) !important;
        }
        .vanvas-map-tooltip::before {
          border-top-color: #173B32 !important;
        }
        .leaflet-container {
          background-color: #EFE5D2 !important;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default RoadTripMap;
