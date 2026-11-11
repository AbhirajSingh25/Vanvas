import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useAuth } from "../../src/context/AuthContext";
import { nativeApi, resolveAvatarUrl } from "../../src/services/api";
import { offlineDb } from "../../src/services/db";
import { theme } from "../../src/theme";
import { Friendship, FriendRequest, FriendLookupResult } from "@vanvas/shared";

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"friends" | "incoming" | "outgoing">("friends");
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search state
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<FriendLookupResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const [isSending, setIsSending] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      // Load offline cache first
      try {
        const cached = await offlineDb.getCachedFriends(user.id);
        if (cached && cached.length > 0) setFriends(cached);
      } catch {}

      // Fetch fresh from backend
      const [fList, reqs] = await Promise.all([
        nativeApi.getFriends().catch(() => []),
        nativeApi.getFriendRequests().catch(() => ({ incoming: [], outgoing: [] })),
      ]);

      setFriends(fList);
      setIncomingRequests(reqs.incoming || []);
      setOutgoingRequests(reqs.outgoing || []);

      // Cache fresh friends list
      if (fList && fList.length > 0) {
        await offlineDb.cacheFriends(user.id, fList);
      }
    } catch (err: any) {
      console.log("[Friends] Error loading data:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = async () => {
    const cleanId = searchId.trim().toUpperCase();
    if (!cleanId) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await nativeApi.lookupFriendByVanvasId(cleanId);
      setSearchResult(res);
    } catch (err: any) {
      setSearchError(err.message || "Explorer not found with this VANVAS ID");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    setIsSending(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await nativeApi.sendFriendRequest(searchResult.vanvas_id, requestNote.trim() || undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Request Sent", `Friend request sent to ${searchResult.full_name}!`);
      setSearchResult(null);
      setSearchId("");
      setRequestNote("");
      loadData();
    } catch (err: any) {
      Alert.alert("Could Not Send", err.message || "Failed to send request.");
    } finally {
      setIsSending(false);
    }
  };

  const handleRespondRequest = async (requestId: string, action: "accept" | "decline") => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await nativeApi.respondFriendRequest(requestId, action);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch (err: any) {
      Alert.alert("Action Failed", err.message || "Could not respond to request.");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await nativeApi.cancelFriendRequest(requestId);
      loadData();
    } catch (err: any) {
      Alert.alert("Action Failed", err.message || "Could not cancel request.");
    }
  };

  const handleRemoveFriend = (friendshipId: string, name: string) => {
    Alert.alert("Remove Friend", `Are you sure you want to remove ${name} from your friends?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await nativeApi.removeFriend(friendshipId);
            loadData();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Could not remove friend.");
          }
        },
      },
    ]);
  };

  const handleBlockUser = (targetUserId: string, name: string) => {
    Alert.alert("Block User", `Block ${name}? You will not receive any further messages or invites from them.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await nativeApi.blockUser(targetUserId);
            loadData();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Could not block user.");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.forest} />}
    >
      {/* Search Header */}
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Add Explorer by VANVAS ID</Text>
        <View style={styles.searchBar}>
          <TextInput
            value={searchId}
            onChangeText={(text) => setSearchId(text.toUpperCase())}
            placeholder="e.g. VNV-9B2K-7X4M"
            placeholderTextColor="#888"
            autoCapitalize="characters"
            style={styles.searchInput}
          />
          <TouchableOpacity
            onPress={handleSearch}
            disabled={isSearching || !searchId.trim()}
            style={[styles.searchBtn, (!searchId.trim() || isSearching) && styles.searchBtnDisabled]}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="search" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {searchError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        )}

        {/* Search Result Card */}
        {searchResult && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.avatarBox}>
                {searchResult.avatar_url ? (
                  <Image source={{ uri: resolveAvatarUrl(searchResult.avatar_url) }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>{searchResult.full_name?.charAt(0) || "U"}</Text>
                  </View>
                )}
              </View>

              <View style={styles.resultDetails}>
                <Text style={styles.resultName}>{searchResult.full_name}</Text>
                <Text style={styles.resultVanvasId}>{searchResult.vanvas_id}</Text>
                {searchResult.preferred_travel_style && (
                  <Text style={styles.resultStyle}>🧭 {searchResult.preferred_travel_style}</Text>
                )}
              </View>
            </View>

            {searchResult.friendship_status === "friends" ? (
              <View style={styles.statusPillSuccess}>
                <Ionicons name="checkmark-circle" size={14} color="#065F46" />
                <Text style={styles.statusPillTextSuccess}>Already Friends</Text>
              </View>
            ) : searchResult.friendship_status === "pending_outgoing" ? (
              <View style={styles.statusPillPending}>
                <Ionicons name="time-outline" size={14} color="#92400E" />
                <Text style={styles.statusPillTextPending}>Friend Request Pending</Text>
              </View>
            ) : searchResult.friendship_status === "self" ? (
              <View style={styles.statusPillPending}>
                <Text style={styles.statusPillTextPending}>This is your own profile</Text>
              </View>
            ) : (
              <View style={styles.sendBox}>
                <TextInput
                  value={requestNote}
                  onChangeText={setRequestNote}
                  placeholder="Optional message (e.g. Met on the Spiti trail)..."
                  placeholderTextColor="#888"
                  style={styles.noteInput}
                />
                <TouchableOpacity
                  onPress={handleSendRequest}
                  disabled={isSending}
                  style={styles.sendBtn}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.sendBtnText}>Send Friend Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab("friends")}
          style={[styles.tabBtn, activeTab === "friends" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "friends" && styles.tabTextActive]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("incoming")}
          style={[styles.tabBtn, activeTab === "incoming" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "incoming" && styles.tabTextActive]}>
            Incoming ({incomingRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("outgoing")}
          style={[styles.tabBtn, activeTab === "outgoing" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "outgoing" && styles.tabTextActive]}>
            Outgoing ({outgoingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.forest} style={{ marginTop: 32 }} />
      ) : activeTab === "friends" ? (
        friends.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={48} color={theme.colors.brass} />
            <Text style={styles.emptyTitle}>No Friends Connected Yet</Text>
            <Text style={styles.emptySubtitle}>
              Share your VANVAS ID with travel companions or search theirs above to build your private travel circle.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {friends.map((item) => {
              const friendInfo = item.friend;
              const name = friendInfo?.full_name || "Travel Companion";
              const vId = friendInfo?.vanvas_id || "VNV-XXXX-XXXX";

              return (
                <View key={item.id} style={styles.friendCard}>
                  <View style={styles.friendLeft}>
                    <View style={styles.friendAvatar}>
                      {friendInfo?.avatar_url ? (
                        <Image source={{ uri: resolveAvatarUrl(friendInfo.avatar_url) }} style={styles.avatarImg} />
                      ) : (
                        <Text style={styles.avatarLetter}>{name.charAt(0)}</Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.friendName}>{name}</Text>
                      <Text style={styles.friendVanvasId}>{vId}</Text>
                    </View>
                  </View>

                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      onPress={() => handleRemoveFriend(item.id, name)}
                      style={styles.iconBtn}
                      accessibilityLabel="Remove Friend"
                    >
                      <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleBlockUser(item.friend_user_id, name)}
                      style={styles.iconBtn}
                      accessibilityLabel="Block User"
                    >
                      <Ionicons name="ban-outline" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )
      ) : activeTab === "incoming" ? (
        incomingRequests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="mail-unread-outline" size={48} color={theme.colors.brass} />
            <Text style={styles.emptyTitle}>No Pending Requests</Text>
            <Text style={styles.emptySubtitle}>You have no incoming friend requests right now.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {incomingRequests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.friendLeft}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.avatarLetter}>
                      {req.sender?.full_name?.charAt(0) || "U"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.friendName}>{req.sender?.full_name || "Explorer"}</Text>
                    <Text style={styles.friendVanvasId}>{req.sender?.vanvas_id || "VNV-XXXX"}</Text>
                    {req.note && <Text style={styles.reqNote}>&quot;{req.note}&quot;</Text>}
                  </View>
                </View>

                <View style={styles.reqActions}>
                  <TouchableOpacity
                    onPress={() => handleRespondRequest(req.id, "accept")}
                    style={styles.acceptBtn}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleRespondRequest(req.id, "decline")}
                    style={styles.declineBtn}
                  >
                    <Ionicons name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )
      ) : (
        outgoingRequests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="paper-plane-outline" size={48} color={theme.colors.brass} />
            <Text style={styles.emptyTitle}>No Outgoing Requests</Text>
            <Text style={styles.emptySubtitle}>You have no active pending requests sent to others.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {outgoingRequests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.friendLeft}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.avatarLetter}>
                      {req.receiver?.full_name?.charAt(0) || "U"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.friendName}>{req.receiver?.full_name || "Explorer"}</Text>
                    <Text style={styles.friendVanvasId}>{req.receiver?.vanvas_id || "VNV-XXXX"}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleCancelRequest(req.id)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  searchSection: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5D5BA",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.forestDark,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5D5BA",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  searchBtn: {
    backgroundColor: theme.colors.terracotta,
    paddingHorizontal: 18,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    padding: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
  },
  resultCard: {
    marginTop: 14,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.forestDark,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  resultDetails: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.forestDark,
  },
  resultVanvasId: {
    fontSize: 12,
    fontFamily: "monospace",
    color: theme.colors.terracotta,
    fontWeight: "700",
  },
  resultStyle: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  statusPillSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#D1FAE5",
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusPillTextSuccess: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "700",
  },
  statusPillPending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusPillTextPending: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "700",
  },
  sendBox: {
    marginTop: 12,
    gap: 8,
  },
  noteInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: "#E5D5BA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#EFE5D2",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.forestDark,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  tabTextActive: {
    color: theme.colors.parchment,
  },
  list: {
    gap: 10,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  friendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.forestDark,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  friendName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  friendVanvasId: {
    fontSize: 11,
    fontFamily: "monospace",
    color: theme.colors.terracotta,
    fontWeight: "700",
  },
  actionBtns: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  reqNote: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#666",
    marginTop: 2,
  },
  reqActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.terracotta,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  declineBtn: {
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.forestDark,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 260,
  },
});
