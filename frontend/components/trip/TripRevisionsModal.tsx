"use client";

import React, { useState, useEffect } from "react";
import { History, Sparkles, Clock, CheckCircle2, X, RefreshCw, Layers } from "lucide-react";
import { TripRevision } from "@/types";
import { api } from "@/lib/api";

interface TripRevisionsModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TripRevisionsModal: React.FC<TripRevisionsModalProps> = ({
  tripId,
  isOpen,
  onClose,
}) => {
  const [revisions, setRevisions] = useState<TripRevision[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tripId) {
      setLoading(true);
      api.getTripRevisions(tripId)
        .then((res) => setRevisions(res || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, tripId]);

  if (!isOpen) return null;

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
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B49252]">
                AUDIT & VERSIONING
              </span>
              <h3 className="font-serif font-black text-lg text-[#FAF4E8]">
                Itinerary Revision History
              </h3>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-[#D8DED5] hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline List */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-[#7B4D36] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#B49252]" />
              <span>Fetching revision audit trail...</span>
            </div>
          ) : revisions.length > 0 ? (
            <div className="relative border-l-2 border-[#B49252]/40 ml-3 pl-5 space-y-5">
              {revisions.map((rev) => {
                const dateStr = new Date(rev.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                return (
                  <div key={rev.id} className="relative group">
                    {/* Dot */}
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-[#173B32] border-2 border-[#B49252]" />
                    
                    <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#173B32] text-[#FAF4E8] text-[10px] font-mono font-bold">
                          v{rev.revision_number}
                        </span>
                        <span className="text-[10px] font-mono text-[#7B4D36]">
                          {dateStr}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-sm text-[#2D2A26] mt-1.5">
                        {rev.reason}
                      </h4>

                      <div className="mt-2 text-[11px] font-mono text-[#5A534A] bg-white/60 p-2 rounded-xl border border-[#E5D5BA]/60">
                        <span className="font-bold text-[#173B32]">Action:</span> {rev.action_type.replace(/_/g, " ")}
                        {rev.changes?.items_count !== undefined && (
                          <span className="ml-2">· {rev.changes.items_count} stops</span>
                        )}
                        {rev.changes?.travellers_count !== undefined && (
                          <span className="ml-2">· {rev.changes.travellers_count} travellers</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-[#7B4D36]">
              Plan is on original release (v1). Any accepted replans will be versioned here.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#FAF7F0] border-t border-[#E5D5BA] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#173B32] text-[#FAF4E8] text-xs font-mono font-bold hover:bg-[#0F2924] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
