"use client";

import React, { useState } from "react";
import { Heart, ThumbsUp, ThumbsDown, Sparkles, Check } from "lucide-react";
import { api } from "@/lib/api";
import { VanvasImage } from "@/components/ui/VanvasImage";

interface VotingCardProps {
  tripId: string;
  placeId: string;
  placeName: string;
  category: string;
  imageUrl?: string;
  approxCost?: number;
  initialVote?: "NO" | "LIKE" | "LOVE" | null;
  compatibilityScore?: number;
  loveCount?: number;
  likeCount?: number;
  noCount?: number;
  onVoteSubmitted?: (newVote: "NO" | "LIKE" | "LOVE") => void;
}

export const VotingCard: React.FC<VotingCardProps> = ({
  tripId,
  placeId,
  placeName,
  category,
  imageUrl,
  approxCost,
  initialVote = null,
  compatibilityScore,
  loveCount = 0,
  likeCount = 0,
  noCount = 0,
  onVoteSubmitted,
}) => {
  const [currentVote, setCurrentVote] = useState<"NO" | "LIKE" | "LOVE" | null>(initialVote);
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async (type: "NO" | "LIKE" | "LOVE") => {
    setCurrentVote(type);
    setSubmitting(true);
    try {
      await api.submitVote(tripId, placeId, type);
      if (onVoteSubmitted) onVoteSubmitted(type);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs hover:border-[#173B32]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Place info */}
      <div className="flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E5D5BA] shadow-2xs shrink-0">
          <VanvasImage
            src={imageUrl}
            alt={placeName}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="text-[10px] font-bold text-[#7B4D36] uppercase tracking-wider">
            {category} {approxCost ? `• ~₹${approxCost}` : ""}
          </div>
          <h4 className="font-serif font-bold text-base text-[#173B32]">{placeName}</h4>

          {/* Group Match Bar if available */}
          {compatibilityScore !== undefined && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 bg-[#E5D5BA] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${compatibilityScore}%`,
                    backgroundColor: compatibilityScore > 70 ? "#173B32" : "#B65E3C",
                  }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-[#173B32]">{compatibilityScore}% Match</span>
            </div>
          )}
        </div>
      </div>

      {/* Private Vote Buttons */}
      <div className="flex items-center gap-1.5 self-end sm:self-center">
        <button
          onClick={() => handleVote("NO")}
          disabled={submitting}
          title="Not for me"
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
            currentVote === "NO"
              ? "bg-rose-100 text-rose-800 border-rose-400 shadow-2xs scale-105"
              : "bg-[#EFE5D2] text-[#20211D]/70 border-[#E5D5BA] hover:bg-rose-50"
          }`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          <span>Pass</span>
        </button>

        <button
          onClick={() => handleVote("LIKE")}
          disabled={submitting}
          title="I like this"
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
            currentVote === "LIKE"
              ? "bg-emerald-100 text-emerald-800 border-emerald-400 shadow-2xs scale-105"
              : "bg-[#EFE5D2] text-[#20211D]/70 border-[#E5D5BA] hover:bg-emerald-50"
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Like</span>
        </button>

        <button
          onClick={() => handleVote("LOVE")}
          disabled={submitting}
          title="Must do!"
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
            currentVote === "LOVE"
              ? "bg-[#B65E3C] text-[#EFE5D2] border-[#B65E3C] shadow-2xs scale-105"
              : "bg-[#EFE5D2] text-[#20211D]/70 border-[#E5D5BA] hover:bg-orange-50"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${currentVote === "LOVE" ? "fill-current" : ""}`} />
          <span>Love</span>
        </button>
      </div>
    </div>
  );
};
