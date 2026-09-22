"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Compass, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface SearchResultItem {
  name: string;
  hindi_name?: string;
  state?: string;
  country?: string;
  region?: string;
  slug: string;
  altitude_meters?: number;
  source?: string;
}

interface DestinationSearchBarProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSelect?: (item: SearchResultItem) => void;
}

export const DestinationSearchBar: React.FC<DestinationSearchBarProps> = ({
  placeholder = "Search destinations, valleys, ghats, or heritage trails...",
  className = "",
  autoFocus = false,
  onSelect,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced live autocomplete search with cancellation
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchDestinations(query, 6, abortController.signal);
        setResults(res || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Destination search error:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery("");
    const targetSlug = (item as any).canonical_slug || item.slug;
    if (onSelect) {
      onSelect({ ...item, slug: targetSlug });
    } else {
      router.push(`/explore/${targetSlug}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        const slug = query.trim().toLowerCase().replace(/^(dyn|dest)-/, "").replace(/\s+/g, "-");
        router.push(`/explore/${slug}`);
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
      } else {
        const slug = query.trim().toLowerCase().replace(/\s+/g, "-");
        router.push(`/explore/${slug}`);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-3 bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-2xl text-xs sm:text-sm font-semibold text-[#20211D] placeholder:text-[#7B4D36]/60 focus:outline-none focus:border-[#173B32] shadow-sm transition-all"
        />
        <Search className="w-4 h-4 text-[#7B4D36] absolute left-3.5 pointer-events-none" />
        {loading && (
          <Loader2 className="w-4 h-4 text-[#B65E3C] animate-spin absolute right-3.5 pointer-events-none" />
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-[#E5D5BA] bg-[#EFE5D2] flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B4D36]">
            <span>कहाँ चलें? • Destination Suggestions</span>
            <span>{results.length} Found</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#E5D5BA]/60">
            {results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left p-3 flex items-center justify-between transition-colors ${
                    isSelected ? "bg-[#173B32] text-[#EFE5D2]" : "hover:bg-[#EFE5D2] text-[#20211D]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-[#B65E3C] text-[#EFE5D2]" : "bg-[#E5D5BA] text-[#173B32]"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-sm leading-none">{item.name}</span>
                        {item.hindi_name && (
                          <span
                            className={`text-xs font-serif ${
                              isSelected ? "text-[#B49252]" : "text-[#B65E3C]"
                            }`}
                          >
                            ({item.hindi_name})
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 font-light ${
                          isSelected ? "text-[#D8DED5]" : "text-[#7B4D36]"
                        }`}
                      >
                        {item.state ? `${item.state}, ${item.country || "India"}` : item.region || item.country}
                        {item.altitude_meters && item.altitude_meters > 500 ? ` • ${item.altitude_meters}m` : ""}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-3.5 h-3.5 ${
                      isSelected ? "text-[#B49252] translate-x-1" : "text-[#7B4D36] opacity-40"
                    } transition-all`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
