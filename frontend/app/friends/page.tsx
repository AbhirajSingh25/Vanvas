"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { api } from "@/lib/api";
import { FriendItem, FriendRequest, UserPublicProfile } from "@/types";
import {
  Users, UserPlus, Search, Check, X, Shield, Clock, AlertCircle,
  Copy, UserMinus, Ban, Sparkles, Compass, ArrowLeft, RefreshCw
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { motion, AnimatePresence } from "motion/react";

function FriendsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialAddId = searchParams.get("add") || "";

  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "find">("friends");

  // Data states
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Connect States
  const [searchQuery, setSearchQuery] = useState(initialAddId);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<UserPublicProfile | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadFriendsData();
    if (initialAddId) {
      setActiveTab("find");
      performLookup(initialAddId);
    }
  }, [initialAddId]);

  const loadFriendsData = async () => {
    setLoading(true);
    try {
      const [fList, incList, outList] = await Promise.all([
        api.getFriends(),
        api.getIncomingFriendRequests(),
        api.getOutgoingFriendRequests()
      ]);
      setFriends(fList || []);
      setIncoming(incList || []);
      setOutgoing(outList || []);
    } catch (err) {
      console.error("Failed to load friends data:", err);
    } finally {
      setLoading(false);
    }
  };

  const performLookup = async (idToSearch: string) => {
    const clean = idToSearch.trim();
    if (!clean) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const profile = await api.lookupTravelerByVanvasId(clean);
      setLookupResult(profile);
    } catch (err: any) {
      setLookupError(err.message || "No traveler found with this VANVAS ID, or they have disabled discovery.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    try {
      await api.sendFriendRequest({ target_user_id: targetId });
      setActionSuccess("Friend request sent successfully!");
      setTimeout(() => setActionSuccess(null), 3000);
      if (lookupResult) {
        setLookupResult({ ...lookupResult, friendship_status: "pending_outgoing" });
      }
      loadFriendsData();
    } catch (err: any) {
      alert(err.message || "Could not send friend request");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      loadFriendsData();
    } catch (err: any) {
      alert(err.message || "Failed to accept request");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await api.declineFriendRequest(requestId);
      loadFriendsData();
    } catch (err: any) {
      alert(err.message || "Failed to decline request");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await api.cancelFriendRequest(requestId);
      loadFriendsData();
    } catch (err: any) {
      alert(err.message || "Failed to cancel request");
    }
  };

  const handleRemoveFriend = async (friendId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from your friends?`)) return;
    try {
      await api.removeFriend(friendId);
      loadFriendsData();
    } catch (err: any) {
      alert(err.message || "Failed to remove friend");
    }
  };

  const handleBlockUser = async (friendId: string, name: string) => {
    if (!window.confirm(`Block ${name}? They will no longer be able to find your profile or message you.`)) return;
    try {
      await api.blockUser(friendId);
      loadFriendsData();
    } catch (err: any) {
      alert(err.message || "Failed to block user");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#173B32] hover:text-[#B65E3C] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </Link>
          <div className="text-xs text-[#20211D]/60 font-mono">
            VANVAS Travel ID: <span className="font-bold text-[#173B32]">{user?.vanvas_id}</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-[#173B32] text-[#FAF7F0]">
                <Users className="w-5 h-5 text-[#B49252]" />
              </span>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32]">
                  Friends & Connections
                </h1>
                <p className="text-xs sm:text-sm text-[#20211D]/70 mt-0.5">
                  Connect with fellow mountain travelers using shareable VANVAS IDs
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab("find");
              setSearchQuery("");
              setLookupResult(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold transition-all shadow-md active:scale-97 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#B49252]" />
            <span>Add by VANVAS ID</span>
          </button>
        </div>

        {/* Action Success Toast */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Hub Tabs */}
        <div className="flex border-b border-[#D8CBB2] gap-2">
          <button
            onClick={() => setActiveTab("friends")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === "friends"
                ? "text-[#173B32] border-b-2 border-[#173B32]"
                : "text-[#20211D]/60 hover:text-[#173B32]"
            }`}
          >
            My Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === "requests"
                ? "text-[#173B32] border-b-2 border-[#173B32]"
                : "text-[#20211D]/60 hover:text-[#173B32]"
            }`}
          >
            Requests ({incoming.length + outgoing.length})
            {incoming.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#B65E3C] text-white text-[10px] font-bold">
                {incoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("find")}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === "find"
                ? "text-[#173B32] border-b-2 border-[#173B32]"
                : "text-[#20211D]/60 hover:text-[#173B32]"
            }`}
          >
            Find Traveler
          </button>
        </div>

        {/* TAB 1: FRIENDS LIST */}
        {activeTab === "friends" && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-[#20211D]/60">Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-12 text-center space-y-3">
                <Users className="w-10 h-10 text-[#B49252] mx-auto opacity-50" />
                <h3 className="font-serif text-lg font-bold text-[#173B32]">No friends added yet</h3>
                <p className="text-xs text-[#20211D]/70 max-w-sm mx-auto">
                  Share your VANVAS ID with travel companions or look up their ID to plan trips and split expenses together.
                </p>
                <button
                  onClick={() => setActiveTab("find")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173B32] text-[#FAF7F0] text-xs font-bold transition-colors mt-2"
                >
                  <Search className="w-4 h-4 text-[#B49252]" />
                  <span>Find by VANVAS ID</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 hover:border-[#173B32] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        user={{
                          id: friend.friend_id,
                          full_name: friend.friend_name,
                          avatar_url: friend.friend_avatar_url,
                          avatar_preset: friend.friend_avatar_preset,
                        } as any}
                        size="md"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#173B32]">
                          {friend.friend_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#B49252]">
                          <span>{friend.friend_vanvas_id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRemoveFriend(friend.friend_id, friend.friend_name)}
                        className="p-2 text-[#20211D]/50 hover:text-[#B65E3C] hover:bg-black/5 rounded-xl transition-colors"
                        title="Remove Friend"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleBlockUser(friend.friend_id, friend.friend_name)}
                        className="p-2 text-[#20211D]/50 hover:text-red-700 hover:bg-black/5 rounded-xl transition-colors"
                        title="Block Traveler"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REQUESTS */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-base text-[#173B32] flex items-center gap-2">
                <span>Incoming Friend Requests</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32]">
                  {incoming.length}
                </span>
              </h3>

              {incoming.length === 0 ? (
                <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-6 text-center text-xs text-[#20211D]/60">
                  No pending incoming requests
                </div>
              ) : (
                <div className="space-y-2.5">
                  {incoming.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          user={{
                            id: req.sender_id,
                            full_name: req.sender_name || "Traveler",
                            avatar_url: req.sender_avatar_url,
                          } as any}
                          size="md"
                        />
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#173B32]">
                            {req.sender_name || "Traveler"}
                          </h4>
                          <span className="text-[11px] font-mono text-[#B49252]">
                            {req.sender_vanvas_id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#173B32] text-white text-xs font-bold hover:bg-[#20453B] transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id)}
                          className="p-1.5 rounded-xl text-[#20211D]/60 hover:text-[#B65E3C] hover:bg-black/5 transition-colors"
                          title="Decline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="space-y-3 pt-4 border-t border-[#D8CBB2]">
              <h3 className="font-serif font-bold text-base text-[#173B32] flex items-center gap-2">
                <span>Outgoing Friend Requests</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#173B32]/10 text-[#173B32]">
                  {outgoing.length}
                </span>
              </h3>

              {outgoing.length === 0 ? (
                <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-6 text-center text-xs text-[#20211D]/60">
                  No pending outgoing requests
                </div>
              ) : (
                <div className="space-y-2.5">
                  {outgoing.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          user={{
                            id: req.receiver_id,
                            full_name: req.receiver_name || "Traveler",
                            avatar_url: req.receiver_avatar_url,
                          } as any}
                          size="md"
                        />
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#173B32]">
                            {req.receiver_name || "Traveler"}
                          </h4>
                          <span className="text-[11px] font-mono text-[#B49252]">
                            {req.receiver_vanvas_id}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        className="px-3 py-1.5 rounded-xl border border-[#D8CBB2] text-xs font-semibold text-[#20211D]/70 hover:bg-[#B65E3C]/10 hover:text-[#B65E3C] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FIND TRAVELER */}
        {activeTab === "find" && (
          <div className="space-y-6">
            <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#173B32]">
                Look up Traveler by VANVAS ID
              </h3>
              <p className="text-xs text-[#20211D]/70">
                Enter an ambiguity-resistant format ID (e.g. <span className="font-mono font-bold text-[#173B32]">VNV-4R7T-K92X</span>)
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  performLookup(searchQuery);
                }}
                className="flex gap-2 max-w-lg"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#B49252] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    placeholder="VNV-XXXX-XXXX"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#D8CBB2] text-sm font-mono tracking-wider text-[#173B32] focus:outline-none focus:ring-2 focus:ring-[#173B32]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading || !searchQuery.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {lookupLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Search</span>
                </button>
              </form>

              {lookupError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>{lookupError}</span>
                </div>
              )}
            </div>

            {/* Profile Preview Card */}
            {lookupResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FAF7F0] border-2 border-[#173B32] rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar
                      user={{
                        id: lookupResult.id,
                        full_name: lookupResult.full_name,
                        avatar_url: lookupResult.avatar_url,
                        avatar_preset: lookupResult.avatar_preset,
                      } as any}
                      size="xl"
                    />
                    <div>
                      <h4 className="font-serif text-xl font-bold text-[#173B32]">
                        {lookupResult.full_name}
                      </h4>
                      <p className="text-xs font-mono text-[#B49252] font-semibold mt-0.5">
                        {lookupResult.vanvas_id}
                      </p>
                      <p className="text-xs text-[#20211D]/70 mt-1">
                        {lookupResult.preferred_travel_style || "Explorer"} · {lookupResult.companion_style || "Solo Traveler"}
                      </p>
                    </div>
                  </div>

                  <div>
                    {lookupResult.friendship_status === "self" ? (
                      <span className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-xs font-bold">
                        This is you!
                      </span>
                    ) : lookupResult.friendship_status === "friends" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                        <span>Already Friends</span>
                      </span>
                    ) : lookupResult.friendship_status === "pending_outgoing" ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                        Request Pending
                      </span>
                    ) : lookupResult.friendship_status === "pending_incoming" ? (
                      <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
                        Sent You a Request!
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(lookupResult.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-white text-xs font-bold transition-all shadow-md active:scale-97 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Send Friend Request</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <ProtectedRoute>
      <FriendsContent />
    </ProtectedRoute>
  );
}
