"use client";

import React, { useState } from "react";
import {
  X, Compass, MapPin, Calendar, Users, Sparkles, Footprints,
  Clock, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2
} from "lucide-react";
import { TravelCircle } from "@/types";
import { api } from "@/lib/api";

interface CreateCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationId?: string;
  destinationName?: string;
  trekSlug?: string;
  onCircleCreated?: (circle: TravelCircle) => void;
}

export function CreateCircleModal({
  isOpen,
  onClose,
  destinationId,
  destinationName,
  trekSlug,
  onCircleCreated,
}: CreateCircleModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];

  const [name, setName] = useState(
    trekSlug
      ? `${trekSlug.replace("-", " ").toUpperCase()} Summit Circle`
      : destinationName
      ? `${destinationName} Explorers Circle`
      : "Himalayan Solo Circle"
  );
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);
  const [maxMembers, setMaxMembers] = useState(6);
  const [activityType, setActivityType] = useState(trekSlug ? "Trek" : "Exploration");
  const [meetupPoint, setMeetupPoint] = useState("Market Center / Main Gate");
  const [meetupTime, setMeetupTime] = useState("09:30 AM");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name for the circle.");
      return;
    }
    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const circle = await api.createCircle({
        destination_id: destinationId,
        destination_name: destinationName,
        trek_slug: trekSlug,
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: startDate,
        end_date: endDate,
        max_members: maxMembers,
        activity_type: activityType,
        meetup_point: meetupPoint.trim(),
        meetup_time: meetupTime.trim(),
      });
      onCircleCreated?.(circle);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create Circle.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A100D]/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF7F0] border border-[#D8CBB2] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#173B32] p-6 text-[#FAF4E8] relative flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#B49252] font-bold block">
              VANVAS CIRCLES
            </span>
            <h3 className="font-serif text-xl font-bold text-[#FAF4E8]">
              Create a Solo Travel Circle
            </h3>
            <p className="text-xs text-[#8FA699]">
              Form a verified temporary travel circle for {destinationName || "mountain"} exploration.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#FAF4E8]/10 hover:bg-[#FAF4E8]/20 text-[#FAF4E8] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-[#20211D]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Circle Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
              Circle Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs p-3 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none focus:ring-1 focus:ring-[#173B32]"
              placeholder="e.g. Parvati Valley Sunset Explorers"
            />
          </div>

          {/* Activity Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
              Expedition Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Trek", "Exploration", "Café Hopping", "Sightseeing", "Photography", "Cultural"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    activityType === type
                      ? "bg-[#173B32] text-[#FAF4E8] shadow-xs"
                      : "bg-white border border-[#D8CBB2] text-[#20211D]/80 hover:bg-[#E5D5BA]/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Meetup Point & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
                Public Meetup Point
              </label>
              <input
                type="text"
                value={meetupPoint}
                onChange={(e) => setMeetupPoint(e.target.value)}
                required
                placeholder="e.g. Kasol Market Entrance"
                className="w-full text-xs p-2.5 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
                Meetup Time
              </label>
              <input
                type="text"
                value={meetupTime}
                onChange={(e) => setMeetupTime(e.target.value)}
                placeholder="e.g. 09:30 AM"
                className="w-full text-xs p-2.5 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Max Members */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#173B32]">
              <span className="uppercase tracking-wider text-[11px]">Maximum Circle Size</span>
              <span className="text-[#E05A2B]">{maxMembers} Solo Travelers</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
              className="w-full accent-[#E05A2B]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#173B32] uppercase tracking-wider block">
              Short Description / Trail Objective
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are we exploring? e.g. Morning trek to Chalal followed by riverside lunch..."
              className="w-full text-xs p-2.5 rounded-xl border border-[#D8CBB2] bg-white focus:outline-none resize-none h-16"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#E05A2B] hover:bg-[#C8491D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-60"
          >
            {isLoading ? "Creating Circle..." : "Launch Travel Circle"}
          </button>
        </form>
      </div>
    </div>
  );
}
