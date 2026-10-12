"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Sparkles, ArrowRight, Loader2, AlertCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  resolveCanonicalDestination,
  CANONICAL_DESTINATIONS,
  getCanonicalHindiName,
  FRONTEND_DESTINATION_ALIASES
} from "@/lib/canonicalDestinations";

export interface SearchResultItem {
  id?: string;
  destination_id?: string;
  name: string;
  hindi_name?: string;
  state?: string;
  country?: string;
  region?: string;
  slug: string;
  canonical_slug?: string;
  altitude_meters?: number;
  hero_image?: string;
  matched_alias?: string;
  source?: string;
  is_curated?: boolean;
}

interface DestinationSearchBarProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSelect?: (item: SearchResultItem) => void;
  navigationTarget?: "plan" | "explore";
}

// In-memory cache across component lifecycles to avoid repeated keystroke requests
const searchCache = new Map<string, SearchResultItem[]>();

export const DestinationSearchBar: React.FC<DestinationSearchBarProps> = ({
  placeholder = "Search destinations (e.g. Banaras, Manali, Chopta, Goa, Rishikesh)...",
  className = "",
  autoFocus = false,
  onSelect,
  navigationTarget = "plan",
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Local synchronous fallback matcher in case network is down or slow
  const getLocalMatches = useCallback((q: string): SearchResultItem[] => {
    const clean = q.trim().toLowerCase();
    if (!clean) return [];

    const matchedList: SearchResultItem[] = [];
    const seenSlugs = new Set<string>();

    // Check alias match first
    const resolved = resolveCanonicalDestination(clean);
    if (resolved) {
      const aliasData = FRONTEND_DESTINATION_ALIASES[clean];
      matchedList.push({
        id: resolved.id,
        destination_id: resolved.id,
        name: resolved.name,
        hindi_name: resolved.hindi_name,
        slug: resolved.slug,
        canonical_slug: resolved.slug,
        state: resolved.state,
        country: "India",
        region: resolved.region,
        altitude_meters: resolved.altitude_meters,
        hero_image: resolved.hero_image,
        matched_alias: aliasData?.matchedAlias || (clean !== resolved.slug ? clean : undefined),
        source: "local_alias",
        is_curated: true,
      });
      seenSlugs.add(resolved.slug);
    }

    // Match against canonical registry
    for (const d of CANONICAL_DESTINATIONS) {
      if (seenSlugs.has(d.slug)) continue;
      const nameMatch = d.name.toLowerCase().includes(clean);
      const slugMatch = d.slug.toLowerCase().includes(clean);
      const stateMatch = d.state.toLowerCase().includes(clean);
      const hindiMatch = (d.hindi_name || "").includes(clean);

      if (nameMatch || slugMatch || stateMatch || hindiMatch) {
        matchedList.push({
          id: d.id,
          destination_id: d.id,
          name: d.name,
          hindi_name: d.hindi_name,
          slug: d.slug,
          canonical_slug: d.slug,
          state: d.state,
          country: "India",
          region: d.region,
          altitude_meters: d.altitude_meters,
          hero_image: d.hero_image,
          source: "local_canonical",
          is_curated: true,
        });
        seenSlugs.add(d.slug);
        if (matchedList.length >= 6) break;
      }
    }

    return matchedList;
  }, []);

  // Debounced search with requestId check, caching, and instant local fallback
  useEffect(() => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      setError(null);
      setSelectedIndex(-1);
      return;
    }

    const cacheKey = cleanQuery.toLowerCase();
    if (searchCache.has(cacheKey)) {
      setResults(searchCache.get(cacheKey)!);
      setIsOpen(true);
      setLoading(false);
      setError(null);
      return;
    }

    // Set immediate loading state
    setLoading(true);
    setError(null);

    const currentRequestId = ++requestIdRef.current;
    const abortController = new AbortController();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const backendResults = await api.searchDestinations(cleanQuery, 6, abortController.signal);

        // Discard response if a newer query was typed
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        if (Array.isArray(backendResults) && backendResults.length > 0) {
          searchCache.set(cacheKey, backendResults);
          setResults(backendResults);
          setIsOpen(true);
          setError(null);
        } else {
          // If backend returned empty, verify against local alias/canonical registry
          const localFallback = getLocalMatches(cleanQuery);
          if (localFallback.length > 0) {
            searchCache.set(cacheKey, localFallback);
            setResults(localFallback);
          } else {
            setResults([]);
          }
          setIsOpen(true);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (requestIdRef.current !== currentRequestId) return;

        console.warn("Search API failed, using resilient local matching:", err?.message);
        const localFallback = getLocalMatches(cleanQuery);
        if (localFallback.length > 0) {
          setResults(localFallback);
          setError(null);
        } else {
          setResults([]);
          setError("Network slow or offline. Please check your query or try a known destination.");
        }
        setIsOpen(true);
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      abortController.abort();
    };
  }, [query, getLocalMatches]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);

    const canonicalSlug = (item.canonical_slug || item.slug || "").replace(/^(dyn|dest)-/, "");
    const destId = item.id || item.destination_id || (item.is_curated !== false ? `dest-${canonicalSlug}` : `dyn-${canonicalSlug}`);
    const destName = item.name || canonicalSlug;
    const hindiName = item.hindi_name || getCanonicalHindiName(canonicalSlug);

    // Persist pending destination in localStorage for session restoration and auth persistence
    if (typeof window !== "undefined") {
      try {
        const payload = {
          id: destId,
          slug: canonicalSlug,
          name: destName,
          hindi_name: hindiName,
          state: item.state || "",
          region: item.region || "",
          hero_image: item.hero_image || "",
          timestamp: Date.now(),
        };
        localStorage.setItem("vanvas_pending_plan_dest", JSON.stringify(payload));
      } catch (e) {
        console.warn("Could not save pending plan destination:", e);
      }
    }

    if (onSelect) {
      onSelect({
        ...item,
        id: destId,
        slug: canonicalSlug,
        canonical_slug: canonicalSlug,
      });
      return;
    }

    // Default primary journey: Navigate to trip planner with canonical parameters
    if (navigationTarget === "plan") {
      const params = new URLSearchParams({
        dest: canonicalSlug,
        destId: destId,
        destName: destName,
      });
      router.push(`/plan?${params.toString()}`);
    } else {
      router.push(`/explore/${canonicalSlug}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setLoading(false);
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault();
        // Resolve alias or fallback
        const local = getLocalMatches(query.trim());
        if (local.length > 0) {
          handleSelectItem(local[0]);
        } else {
          const rawSlug = query.trim().toLowerCase().replace(/^(dyn|dest)-/, "").replace(/\s+/g, "-");
          if (navigationTarget === "plan") {
            router.push(`/plan?dest=${encodeURIComponent(rawSlug)}`);
          } else {
            router.push(`/explore/${encodeURIComponent(rawSlug)}`);
          }
        }
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectItem(results[selectedIndex]);
      } else if (results.length > 0) {
        // Default to first match on Enter if none highlighted
        handleSelectItem(results[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Field */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || query.trim()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="destination-search-dropdown"
          className="w-full pl-11 pr-16 py-3.5 bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:border-[#D5C2A5] rounded-2xl text-xs sm:text-sm font-semibold text-[#20211D] placeholder:text-[#7B4D36]/60 focus:outline-none focus:border-[#173B32] shadow-sm transition-all"
        />
        <Search className="w-4 h-4 text-[#7B4D36] absolute left-3.5 pointer-events-none" />

        {/* Clear and Loading Icons */}
        <div className="absolute right-3.5 flex items-center gap-1.5">
          {loading && (
            <Loader2
              data-testid="search-loading-spinner"
              className="w-4 h-4 text-[#B65E3C] animate-spin"
            />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-[#7B4D36]/70 hover:text-[#173B32] hover:bg-[#E5D5BA]/50 transition-colors"
              aria-label="Clear destination search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div
          id="destination-search-dropdown"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn max-h-80 overflow-y-auto"
        >
          {/* Header Bar */}
          <div className="px-3.5 py-2 border-b border-[#E5D5BA] bg-[#EFE5D2] flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
            <span>कहाँ चलें? • Destination Suggestions</span>
            <span>
              {loading
                ? "Searching..."
                : `${results.length} ${results.length === 1 ? "Result" : "Results"}`}
            </span>
          </div>

          {/* Loading Indicator State in Dropdown */}
          {loading && results.length === 0 && (
            <div className="p-6 text-center text-[#7B4D36]">
              <Loader2 className="w-5 h-5 mx-auto mb-2 text-[#B65E3C] animate-spin" />
              <p className="text-xs font-semibold">Searching destinations across India & Himalayas...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty / No Results State */}
          {!loading && results.length === 0 && !error && (
            <div className="p-6 text-center text-[#7B4D36]">
              <MapPin className="w-6 h-6 mx-auto mb-2 text-[#B65E3C] opacity-40" />
              <p className="text-sm font-serif font-bold text-[#173B32]">
                No destinations matching &ldquo;{query}&rdquo;
              </p>
              <p className="text-[11px] text-[#7B4D36]/80 mt-1 max-w-xs mx-auto">
                Try searching for <span className="font-semibold text-[#173B32]">Banaras</span>,{" "}
                <span className="font-semibold text-[#173B32]">Manali</span>,{" "}
                <span className="font-semibold text-[#173B32]">Chopta</span>,{" "}
                <span className="font-semibold text-[#173B32]">Rishikesh</span>, or{" "}
                <span className="font-semibold text-[#173B32]">Goa</span>.
              </p>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="divide-y divide-[#E5D5BA]/60">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const canonicalSlug = (item.canonical_slug || item.slug || "").replace(/^(dyn|dest)-/, "");
                const hindi = item.hindi_name || getCanonicalHindiName(canonicalSlug);
                const showAliasBadge = item.matched_alias && item.matched_alias.toLowerCase() !== item.name.toLowerCase();

                return (
                  <button
                    key={`${canonicalSlug}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onPointerDown={(e) => {
                      // Prevent input blur before click registers
                      e.preventDefault();
                      handleSelectItem(item);
                    }}
                    className={`w-full text-left p-3.5 flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected ? "bg-[#173B32] text-[#EFE5D2]" : "hover:bg-[#EFE5D2] text-[#20211D]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center transition-transform ${
                          isSelected ? "bg-[#B65E3C] text-[#EFE5D2] scale-105" : "bg-[#E5D5BA] text-[#173B32]"
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif font-bold text-sm leading-tight truncate">
                            {item.name}
                          </span>
                          {hindi && (
                            <span
                              className={`text-xs font-serif ${
                                isSelected ? "text-[#B49252]" : "text-[#B65E3C]"
                              }`}
                            >
                              ({hindi})
                            </span>
                          )}
                          {showAliasBadge && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-medium tracking-tight ${
                                isSelected
                                  ? "bg-[#FAF7F0]/20 text-[#FAF7F0]"
                                  : "bg-[#173B32]/10 text-[#173B32]"
                              }`}
                            >
                              aka {item.matched_alias}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 font-light truncate ${
                            isSelected ? "text-[#D8DED5]" : "text-[#7B4D36]"
                          }`}
                        >
                          {item.state ? `${item.state}, ${item.country || "India"}` : item.region || item.country || "India"}
                          {item.altitude_meters && item.altitude_meters > 500 ? ` • ${item.altitude_meters}m` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline-block ${
                          isSelected ? "text-[#B49252]" : "text-[#B65E3C] opacity-80"
                        }`}
                      >
                        {navigationTarget === "plan" ? "Plan Trip" : "Explore"}
                      </span>
                      <ArrowRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? "text-[#B49252] translate-x-1" : "text-[#7B4D36] opacity-40"
                        } transition-all`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
