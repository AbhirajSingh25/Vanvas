/**
 * VANVAS Recent Destinations Storage Manager
 * Tracks actual visited canonical destinations locally without server profiling or tracking.
 */

import { CANONICAL_DESTINATIONS, CanonicalDestination } from "./canonicalDestinations";

const RECENT_DESTINATIONS_STORAGE_KEY = "vanvas_recent_destinations";
const MAX_RECENT_DESTINATIONS = 6;

export interface RecentDestinationEntry {
  slug: string;
  name: string;
  visitedAt: number;
}

export function recordRecentDestination(slug: string, name?: string): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    const raw = localStorage.getItem(RECENT_DESTINATIONS_STORAGE_KEY);
    let items: RecentDestinationEntry[] = raw ? JSON.parse(raw) : [];
    
    // Remove duplicate of this slug if already present
    items = items.filter((item) => item.slug !== slug);

    // Prepend new entry
    items.unshift({
      slug,
      name: name || slug,
      visitedAt: Date.now(),
    });

    // Cap to max
    items = items.slice(0, MAX_RECENT_DESTINATIONS);
    localStorage.setItem(RECENT_DESTINATIONS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Graceful fallback if localStorage is disabled
  }
}

export function getRecentDestinations(): CanonicalDestination[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_DESTINATIONS_STORAGE_KEY);
    if (!raw) return [];
    const entries: RecentDestinationEntry[] = JSON.parse(raw);
    if (!Array.isArray(entries)) return [];

    // Map to canonical destination records with artwork and coordinates
    const results: CanonicalDestination[] = [];
    for (const entry of entries) {
      const match = CANONICAL_DESTINATIONS.find((d) => d.slug === entry.slug);
      if (match) {
        results.push(match);
      }
    }
    return results.slice(0, MAX_RECENT_DESTINATIONS);
  } catch {
    return [];
  }
}

export function clearRecentDestinations(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_DESTINATIONS_STORAGE_KEY);
  } catch {}
}
