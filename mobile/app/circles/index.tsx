import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/context/AuthContext";
import { nativeApi } from "../../src/services/api";
import { offlineDb } from "../../src/services/db";
import { theme } from "../../src/theme";
import { CrewCircle, Friendship } from "@vanvas/shared";

export default function CrewCirclesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [circles, setCircles] = useState<CrewCircle[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Circle Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [circleDesc, setCircleDesc] = useState("");
  const [destinationHint, setDestinationHint] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      // Offline cache first
      try {
        const cached = await offlineDb.getCachedCrewCircles(user.id);
        if (cached && cached.length > 0) setCircles(cached);
      } catch {}

      const [cList, fList] = await Promise.all([
        nativeApi.getCrewCircles().catch(() => []),
        nativeApi.getFriends().catch(() => []),
      ]);

      setCircles(cList);
      setFriends(fList);

      if (cList && cList.length > 0) {
        await offlineDb.cacheCrewCircles(user.id, cList);
      }
    } catch (err: any) {
      console.log("[CrewCircles] Load error:", err.message);
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

  const handleToggleFriend = (userId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      Alert.alert("Name Required", "Please enter a name for your crew circle.");
      return;
    }

    setIsCreating(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newCircle = await nativeApi.createCrewCircle({
        name: circleName.trim(),
        description: circleDesc.trim() || undefined,
        destination_hint: destinationHint.trim() || undefined,
        initial_member_ids: selectedFriendIds,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);
      setCircleName("");
      setCircleDesc("");
      setDestinationHint("");
      setSelectedFriendIds([]);
      loadData();
      router.push(`/circles/${newCircle.id}` as any);
    } catch (err: any) {
      Alert.alert("Failed to Create", err.message || "Could not create circle.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.forest} />}
    >
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerBadge}>मण्डली · PRIVATE CREW CIRCLES</Text>
          <Text style={styles.bannerTitle}>Travel Circles</Text>
          <Text style={styles.bannerSubtitle}>
            Collaborative workspaces for real travel groups. Vote privately, track split pods, and explore together.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.createBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Circle List */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.forest} style={{ marginTop: 32 }} />
      ) : circles.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bonfire-outline" size={54} color={theme.colors.brass} />
          <Text style={styles.emptyTitle}>No Crew Circles Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first travel mandali to plan expeditions, share expenses, and vote on mountain spots together.
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.emptyActionBtn}
          >
            <Text style={styles.emptyActionBtnText}>+ Create Travel Circle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {circles.map((circle) => (
            <TouchableOpacity
              key={circle.id}
              onPress={() => router.push(`/circles/${circle.id}` as any)}
              style={styles.circleCard}
              activeOpacity={0.85}
            >
              <View style={styles.circleHeader}>
                <View style={styles.circleTitleRow}>
                  <Text style={styles.circleName}>{circle.name}</Text>
                  {circle.destination_hint && (
                    <View style={styles.destBadge}>
                      <Ionicons name="location-outline" size={12} color={theme.colors.terracotta} />
                      <Text style={styles.destBadgeText}>{circle.destination_hint}</Text>
                    </View>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={18} color="#999" />
              </View>

              {circle.description && (
                <Text style={styles.circleDesc} numberOfLines={2}>
                  {circle.description}
                </Text>
              )}

              <View style={styles.circleFooter}>
                <View style={styles.metaPill}>
                  <Ionicons name="people-outline" size={13} color={theme.colors.forest} />
                  <Text style={styles.metaText}>{circle.member_count} Members</Text>
                </View>

                <View style={styles.metaPill}>
                  <Ionicons name="compass-outline" size={13} color={theme.colors.forest} />
                  <Text style={styles.metaText}>{circle.trip_count} Trips</Text>
                </View>

                <View style={styles.metaPill}>
                  <Ionicons name="chatbubbles-outline" size={13} color={theme.colors.forest} />
                  <Text style={styles.metaText}>{circle.activity_count} Updates</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Create Circle Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Circle · मण्डली</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={theme.colors.forestDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Circle Name *</Text>
                <TextInput
                  value={circleName}
                  onChangeText={setCircleName}
                  placeholder="e.g. Parvati Valley Explorers, Spiti Clan"
                  placeholderTextColor="#888"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Destination / Region</Text>
                <TextInput
                  value={destinationHint}
                  onChangeText={setDestinationHint}
                  placeholder="e.g. Kasol, Spiti, Dharamshala"
                  placeholderTextColor="#888"
                  style={styles.formInput}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Circle Description</Text>
                <TextInput
                  value={circleDesc}
                  onChangeText={setCircleDesc}
                  placeholder="What is this circle about?"
                  placeholderTextColor="#888"
                  multiline
                  numberOfLines={2}
                  style={[styles.formInput, { height: 60 }]}
                />
              </View>

              {/* Add Friends Section */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Add Friends to Circle</Text>
                {friends.length === 0 ? (
                  <Text style={styles.noFriendsText}>
                    No friends connected yet. You can invite friends later via their VANVAS ID.
                  </Text>
                ) : (
                  <View style={styles.friendsChecklist}>
                    {friends.map((item) => {
                      const f = item.friend;
                      const name = f?.full_name || "Friend";
                      const isSelected = selectedFriendIds.includes(item.friend_user_id);

                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => handleToggleFriend(item.friend_user_id)}
                          style={[styles.friendItem, isSelected && styles.friendItemSelected]}
                        >
                          <Text style={[styles.friendItemName, isSelected && styles.friendItemNameSelected]}>
                            {name}
                          </Text>
                          <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={18}
                            color={isSelected ? theme.colors.terracotta : "#888"}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={handleCreateCircle}
              disabled={isCreating}
              style={[styles.submitBtn, isCreating && { opacity: 0.6 }]}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Create Circle · मण्डली बनाएं</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  banner: {
    backgroundColor: theme.colors.forestDark,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: `${theme.colors.brass}50`,
  },
  bannerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  bannerBadge: {
    color: theme.colors.brass,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  bannerTitle: {
    color: theme.colors.parchment,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  bannerSubtitle: {
    color: "rgba(239,229,210,0.75)",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.terracotta,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  list: {
    gap: 12,
  },
  circleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E5D5BA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  circleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circleTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  circleName: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.forestDark,
  },
  destBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(182,94,60,0.1)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  destBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.terracotta,
  },
  circleDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    lineHeight: 16,
  },
  circleFooter: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F4EBD9",
    paddingTop: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.forestDark,
    fontFamily: "monospace",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.forestDark,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyActionBtn: {
    marginTop: 20,
    backgroundColor: theme.colors.terracotta,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: theme.colors.forestDark,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.forestDark,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5D5BA",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.forestDark,
  },
  noFriendsText: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
  },
  friendsChecklist: {
    gap: 6,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  friendItemSelected: {
    borderColor: theme.colors.terracotta,
    backgroundColor: "rgba(182,94,60,0.06)",
  },
  friendItemName: {
    fontSize: 13,
    color: theme.colors.forestDark,
    fontWeight: "600",
  },
  friendItemNameSelected: {
    fontWeight: "800",
    color: theme.colors.terracotta,
  },
  submitBtn: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
