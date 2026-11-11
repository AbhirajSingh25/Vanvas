"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api } from "@/lib/api";
import { CrewCircleItem, FriendItem } from "@/types";
import {
  Users, Plus, Compass, Sparkles, ArrowRight, Shield, Calendar,
  Check, X, AlertCircle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function CirclesListContent() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<CrewCircleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDesc, setNewCircleDesc] = useState("");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    setLoading(true);
    try {
      const data = await api.getCrewCircles();
      setCircles(data || []);
    } catch (err) {
      console.error("Failed to load circles:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    setCreateModalOpen(true);
    setCreateError(null);
    try {
      const fList = await api.getFriends();
      setFriends(fList || []);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  };

  const toggleSelectFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) {
      setCreateError("Circle name is required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await api.createCrewCircle({
        name: newCircleName.trim(),
        description: newCircleDesc.trim() || undefined,
        initial_member_user_ids: selectedFriends,
      });
      setCreateModalOpen(false);
      setNewCircleName("");
      setNewCircleDesc("");
      setSelectedFriends([]);
      loadCircles();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create Crew Circle");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-[#173B32] text-[#FAF7F0]">
              <Users className="w-6 h-6 text-[#B49252]" />
            </span>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                Crew Circles · मण्डली
              </h1>
              <p className="text-xs sm:text-sm text-[#20211D]/70 mt-0.5">
                Private travel pods for groups of friends, shared trips, and isolated expense ledgers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/friends"
              className="px-4 py-2.5 rounded-2xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#173B32] hover:bg-[#E5D5BA]/50 transition-colors shadow-xs"
            >
              Friends Hub
            </Link>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold transition-all shadow-md active:scale-97 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Circle</span>
            </button>
          </div>
        </div>

        {/* Circles Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[#20211D]/60">Loading circles...</div>
        ) : circles.length === 0 ? (
          <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-[#B49252] mx-auto opacity-50" />
            <h3 className="font-serif text-xl font-bold text-[#173B32]">No Crew Circles yet</h3>
            <p className="text-xs text-[#20211D]/70 max-w-md mx-auto">
              Create a circle for your college friends, weekend riders, or expedition group. Plan trips together and track expenses with zero debt leakage.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173B32] text-[#FAF7F0] text-xs font-bold transition-colors mt-2"
            >
              <Plus className="w-4 h-4 text-[#B49252]" />
              <span>Create Your First Circle</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {circles.map((circle) => (
              <Link
                key={circle.id}
                href={`/circles/${circle.id}`}
                className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-[#173B32] hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#173B32]/10 text-[10px] font-bold text-[#173B32] uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3 text-[#B49252]" />
                      <span>{circle.my_role.toUpperCase()}</span>
                    </span>
                    <span className="text-xs font-bold text-[#B49252] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{circle.member_count} Members</span>
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-[#173B32] group-hover:text-[#B65E3C] transition-colors">
                    {circle.name}
                  </h3>
                  <p className="text-xs text-[#20211D]/70 line-clamp-2 mt-1">
                    {circle.description || "Mountain expedition and weekend travel crew."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#D8CBB2]/60 flex items-center justify-between text-xs font-bold text-[#173B32]">
                  <span>Open Workspace</span>
                  <ArrowRight className="w-4 h-4 text-[#B49252] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Circle Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF7F0] border-2 border-[#D8CBB2] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#D8CBB2]">
                <h3 className="font-serif text-lg font-bold text-[#173B32] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#B49252]" />
                  <span>Create Crew Circle · मण्डली</span>
                </h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:bg-black/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCircle} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1">
                    Circle Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCircleName}
                    onChange={(e) => setNewCircleName(e.target.value)}
                    placeholder="e.g. Spiti Valley 2026 Crew"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8CBB2] text-sm text-[#173B32] focus:outline-none focus:ring-2 focus:ring-[#173B32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={newCircleDesc}
                    onChange={(e) => setNewCircleDesc(e.target.value)}
                    placeholder="Brief objective or note for your group"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D8CBB2] text-sm text-[#173B32] focus:outline-none focus:ring-2 focus:ring-[#173B32]"
                  />
                </div>

                {/* Add Friends selector */}
                <div>
                  <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                    Add Initial Friends ({selectedFriends.length} selected)
                  </label>
                  {friends.length === 0 ? (
                    <div className="p-3 bg-white border border-[#D8CBB2] rounded-xl text-xs text-[#20211D]/60 text-center">
                      No friends connected yet. You can invite friends to this circle later!
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-white border border-[#D8CBB2] rounded-xl">
                      {friends.map((f) => {
                        const isSelected = selectedFriends.includes(f.friend_id);
                        return (
                          <div
                            key={f.id}
                            onClick={() => toggleSelectFriend(f.friend_id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? "bg-[#173B32]/10 border border-[#173B32]/30" : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-xs font-bold text-[#173B32]">{f.friend_name}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#173B32]" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {createError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Circle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CirclesListPage() {
  return (
    <ProtectedRoute>
      <CirclesListContent />
    </ProtectedRoute>
  );
}

