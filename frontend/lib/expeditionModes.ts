import { LucideIcon, Compass, Navigation, Users, Mountain, Clock } from "lucide-react";

export interface CanonicalExpeditionMode {
  id: string;
  layer: string;
  layerNumber: string;
  title: string;
  compactTitle: string;
  subtitle: string;
  description: string;
  href: string;
  ctaText: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  accentText: string;
  cardBg: string;
  cardBgDark: string;
  borderColor: string;
  hoverBorderColor: string;
  theme: "forest" | "highways" | "terracotta" | "dark" | "amber";
  staggerClass: string;
}

export const CANONICAL_EXPEDITION_MODES: CanonicalExpeditionMode[] = [
  {
    id: "explore",
    layer: "LAYER 01 • EXPLORER'S DESK",
    layerNumber: "LAYER 01",
    title: "Explore India",
    compactTitle: "Explorer's Desk",
    subtitle: "Hill stations, coasts & heritage",
    description: "Discover curated sanctuaries, river ghats, royal palaces, tea plantations, and hidden mountain valleys across India.",
    href: "/explore",
    ctaText: "Explore Catalogue",
    icon: Compass,
    badgeBg: "bg-[#173B32]",
    badgeText: "text-[#B49252]",
    accentText: "text-[#173B32]",
    cardBg: "bg-[#FAF4E8]",
    cardBgDark: "dark:bg-[#111A16]",
    borderColor: "border-[#D8CBB2]",
    hoverBorderColor: "hover:border-[#173B32]",
    theme: "forest",
    staggerClass: "stagger-1",
  },
  {
    id: "road-trip",
    layer: "LAYER 02 • HIGHWAYS & DHABAS",
    layerNumber: "LAYER 02",
    title: "Road Trip Mode",
    compactTitle: "Road Trip",
    subtitle: "Live routing & dhabas",
    description: "Live highway routing, authentic dhabas, fuel stops, and verified driving corridors across India.",
    href: "/road-trip",
    ctaText: "Launch Road Trip",
    icon: Navigation,
    badgeBg: "bg-[#173B32]",
    badgeText: "text-[#B49252]",
    accentText: "text-[#173B32]",
    cardBg: "bg-[#FAF7F0]",
    cardBgDark: "dark:bg-[#111A16]",
    borderColor: "border-[#D8CBB2]",
    hoverBorderColor: "hover:border-[#173B32]",
    theme: "highways",
    staggerClass: "stagger-2",
  },
  {
    id: "solo",
    layer: "LAYER 03 • FIELD COMPANION",
    layerNumber: "LAYER 03",
    title: "Solo Travel",
    compactTitle: "Solo Travel",
    subtitle: "Safe stays & community",
    description: "“Go alone. Never feel unprepared.” Safe quarters, communal tables, walkable loops, and trusted local stays without uncertainty.",
    href: "/solo",
    ctaText: "Solo Mode",
    icon: Users,
    badgeBg: "bg-[#B65E3C]",
    badgeText: "text-[#FAF4E8]",
    accentText: "text-[#173B32]",
    cardBg: "bg-[#FAF7F0]",
    cardBgDark: "dark:bg-[#111A16]",
    borderColor: "border-[#D8CBB2]",
    hoverBorderColor: "hover:border-[#B65E3C]",
    theme: "terracotta",
    staggerClass: "stagger-3",
  },
  {
    id: "treks",
    layer: "LAYER 04 • FIELD JOURNAL",
    layerNumber: "LAYER 04",
    title: "Trek Mode",
    compactTitle: "Trek Mode",
    subtitle: "Elevation profiles & trails",
    description: "Understand the mountain before you climb it. Elevation profiles, route comparisons, gear checklists & live trail cockpit.",
    href: "/treks",
    ctaText: "Find Your Mountain",
    icon: Mountain,
    badgeBg: "bg-[#E05A2B]",
    badgeText: "text-white",
    accentText: "text-white",
    cardBg: "bg-[#111A16]",
    cardBgDark: "dark:bg-[#0E1713]",
    borderColor: "border-[#2C3E35]",
    hoverBorderColor: "hover:border-[#E05A2B]",
    theme: "dark",
    staggerClass: "stagger-4",
  },
  {
    id: "one-day",
    layer: "LAYER 05 • DAY ESCAPE COCKPIT",
    layerNumber: "LAYER 05",
    title: "Day Escape",
    compactTitle: "Day Escape",
    subtitle: "Morning out, night return",
    description: "Morning out, night return. Curated micro-trips within 3–4 hours of major hubs with verified return timelines.",
    href: "/one-day",
    ctaText: "Launch Cockpit",
    icon: Clock,
    badgeBg: "bg-[#173B32]",
    badgeText: "text-[#B49252]",
    accentText: "text-[#173B32]",
    cardBg: "bg-[#FFF9F0]",
    cardBgDark: "dark:bg-[#111A16]",
    borderColor: "border-[#E5D5BA]",
    hoverBorderColor: "hover:border-[#173B32]",
    theme: "amber",
    staggerClass: "stagger-5",
  },
];
