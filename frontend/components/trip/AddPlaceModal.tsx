"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, MapPin, Sparkles, X, RefreshCw, ArrowRight } from "lucide-react";
import { ActionPreviewResponse, Place, Trip } from "@/types";
import { api } from "@/lib/api";

interface AddPlaceModalProps {
  tripId: string;
  destinationId: string;
  dayNumber?: number;
  isOpen: boolean;
  onClose: () => void;
  onPreviewGenerated: (preview: ActionPreviewResponse) => void;
}

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  tripId,
  destinationId,
  dayNumber = 1,
  isOpen,
  onClose,
  onPreviewGenerated,
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && destinationId) {
      setLoadingPlaces(true);
      api.getDestinationPlaces(destinationId)
        .then((res) => {
          setPlaces(res || []);
          if (res && res.length > 0) {
            setSelectedPlace(res[0]);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingPlaces(false));
    }
  }, [isOpen, destinationId]);

  if (!isOpen) return null;

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.tags || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGeneratePreview = async () => {
    if (!selectedPlace && !searchQuery.trim()) return;
    setPreviewing(true);
    setError(null);
    try {
      const preview = await api.previewTripAction(tripId, {
        action_type: "ADD_PLACE",
        target_day_number: dayNumber,
        parameters: {
          place_id: selectedPlace?.id,
          place_name: selectedPlace?.name || searchQuery.trim()
        }
      });
      onPreviewGenerated(preview);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to preview adding place to schedule.");
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2924]/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0F2924] text-[#EFE5D2] border-b border-[#243E36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B65E3C] flex items-center justify-center text-white shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                ITINERARY EXPANSION · DAY {dayNumber}
              </span>
              <h3 className="font-serif font-black text-lg text-[#FAF4E8]">
                Add Place to Day {dayNumber}
              </h3>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 sm:p-5 border-b border-[#E5D5BA] bg-[#FAF7F0]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B4D36]" />
            <input
              type="text"
              placeholder="Search verified sanctuaries, cafes, viewpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] text-[#2D2A26] placeholder-[#7B4D36]/60 text-xs font-mono focus:outline-none focus:border-[#173B32]"
            />
          </div>
        </div>

        {/* Places List */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1">
          {loadingPlaces ? (
            <div className="py-8 text-center text-xs font-mono text-[#7B4D36] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#B49252]" />
              <span>Loading verified destination places...</span>
            </div>
          ) : filteredPlaces.length > 0 ? (
            filteredPlaces.map((p) => {
              const isSelected = selectedPlace?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlace(p)}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-[#173B32] border-[#B49252] text-[#FAF4E8] shadow-md"
                      : "bg-[#EFE5D2] border-[#E5D5BA] text-[#2D2A26] hover:border-[#173B32]/40"
                  }`}
                >
                  <div className="truncate">
                    <div className="font-serif font-black text-sm truncate">{p.name}</div>
                    <div className={`text-[11px] truncate mt-0.5 ${isSelected ? "text-[#D8DED5]" : "text-[#7B4D36]"}`}>
                      {p.category} · {p.opening_time || "09:00"} - {p.closing_time || "20:00"} {p.approx_cost ? `· ₹${p.approx_cost}` : "· Free"}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-[#B49252] text-[#0F2924] flex items-center justify-center text-xs font-bold shrink-0">
                      ✓
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs font-mono text-[#7B4D36]">
              No direct matches found. Enter a custom place name above.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-[#FAF7F0] border-t border-[#E5D5BA] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-[#E5D5BA] hover:bg-[#EFE5D2] text-[#7B4D36] text-xs font-mono font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleGeneratePreview}
            disabled={previewing || (!selectedPlace && !searchQuery.trim())}
            className="flex-1 py-3 px-5 rounded-2xl bg-[#173B32] hover:bg-[#0F2924] text-[#FAF4E8] font-serif font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {previewing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#B49252]" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#B49252]" />
            )}
            <span>Preview & Calculate Travel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
