import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/context/AuthContext";
import { nativeApi } from "../../src/services/api";
import { theme } from "../../src/theme";
import {
  CrewCircleDetail,
  CrewCircleMember,
  CrewCircleSuggestion,
  CrewCircleActivity,
  SplitPod,
  ContextBalances,
} from "@vanvas/shared";

export default function CircleWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const circleId = id as string;

  const [activeTab, setActiveTab] = useState<"overview" | "suggestions" | "money" | "chat" | "ai">("overview");
  const [circle, setCircle] = useState<CrewCircleDetail | null>(null);
  const [suggestions, setSuggestions] = useState<CrewCircleSuggestion[]>([]);
  const [activityFeed, setActivityFeed] = useState<CrewCircleActivity[]>([]);
  const [splitPods, setSplitPods] = useState<SplitPod[]>([]);
  const [balances, setBalances] = useState<ContextBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberVanvasId, setMemberVanvasId] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Propose Suggestion Modal
  const [showSuggModal, setShowSuggModal] = useState(false);
  const [suggTitle, setSuggTitle] = useState("");
  const [suggDesc, setSuggDesc] = useState("");
  const [suggType, setSuggType] = useState("destination");
  const [isProposing, setIsProposing] = useState(false);

  // Chat message
  const [chatMessage, setChatMessage] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // AI Copilot state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Settle Up Modal
  const [settleModal, setSettleModal] = useState(false);
  const [settlePayerId, setSettlePayerId] = useState("");
  const [settleReceiverId, setSettleReceiverId] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [isSettling, setIsSettling] = useState(false);

  const loadData = useCallback(async () => {
    if (!circleId) return;
    try {
      const [cDetail, sList, aList, pList, bal] = await Promise.all([
        nativeApi.getCrewCircleDetail(circleId),
        nativeApi.getCrewCircleDetail(circleId).then((c) => c.suggestions || []).catch(() => []),
        nativeApi.getCrewCircleActivity(circleId).catch(() => []),
        nativeApi.getSplitPodsInCircle(circleId).catch(() => []),
        nativeApi.getCollaborativeBalances({ circle_id: circleId }).catch(() => null),
      ]);

      setCircle(cDetail);
      setSuggestions(sList);
      setActivityFeed(aList);
      setSplitPods(pList);
      setBalances(bal);
    } catch (err: any) {
      console.log("[CircleDetail] Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [circleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddMember = async () => {
    const cleanId = memberVanvasId.trim().toUpperCase();
    if (!cleanId) return;
    setIsAddingMember(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await nativeApi.addMemberToCrewCircle(circleId, cleanId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Member added to circle!");
      setShowAddMemberModal(false);
      setMemberVanvasId("");
      loadData();
    } catch (err: any) {
      Alert.alert("Failed", err.message || "Could not add member.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleVote = async (suggestionId: string, voteType: "YES" | "NO" | "HELL_YEAH") => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await nativeApi.voteCrewCircleSuggestion(circleId, suggestionId, voteType);
      loadData();
    } catch (err: any) {
      Alert.alert("Vote Failed", err.message || "Could not register vote.");
    }
  };

  const handleProposeSuggestion = async () => {
    if (!suggTitle.trim()) return;
    setIsProposing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await nativeApi.createCrewCircleSuggestion(circleId, {
        title: suggTitle.trim(),
        description: suggDesc.trim() || undefined,
        suggestion_type: suggType,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuggModal(false);
      setSuggTitle("");
      setSuggDesc("");
      loadData();
    } catch (err: any) {
      Alert.alert("Failed", err.message || "Could not propose suggestion.");
    } finally {
      setIsProposing(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    setIsSendingChat(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await nativeApi.postCrewCircleActivity(circleId, chatMessage.trim(), "chat");
      setChatMessage("");
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not send message.");
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleAskVanvas = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiReply(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await nativeApi.askVanvasForCrewCircle(circleId, aiPrompt.trim());
      setAiReply(res.reply);
    } catch (err: any) {
      setAiReply("VANVAS Copilot is currently recalibrating mountain trails. Please retry.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRecordSettlement = async () => {
    const amt = parseFloat(settleAmount);
    if (!settlePayerId || !settleReceiverId || isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Input", "Please enter valid settlement details.");
      return;
    }
    setIsSettling(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await nativeApi.recordCollaborativeSettlement({
        circle_id: circleId,
        payer_user_id: settlePayerId,
        receiver_user_id: settleReceiverId,
        amount: amt,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSettleModal(false);
      setSettleAmount("");
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to record settlement.");
    } finally {
      setIsSettling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={theme.colors.forest} />
      </View>
    );
  }

  if (!circle) {
    return (
      <View style={styles.centerLoading}>
        <Text style={styles.notFoundText}>Circle not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Circle Top Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.circleName}>{circle.name}</Text>
          <Text style={styles.circleSub}>
            {circle.members?.length || 0} Members · {circle.destination_hint || "Himalayan Expedition"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddMemberModal(true)}
          style={styles.addMemberBtn}
          accessibilityLabel="Add Member"
        >
          <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
          <Text style={styles.addMemberBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab("overview")}
          style={[styles.tabBtn, activeTab === "overview" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "overview" && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("suggestions")}
          style={[styles.tabBtn, activeTab === "suggestions" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "suggestions" && styles.tabTextActive]}>Explore ({suggestions.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("money")}
          style={[styles.tabBtn, activeTab === "money" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "money" && styles.tabTextActive]}>Money & Pods</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("chat")}
          style={[styles.tabBtn, activeTab === "chat" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "chat" && styles.tabTextActive]}>Activity</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("ai")}
          style={[styles.tabBtn, activeTab === "ai" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === "ai" && styles.tabTextActive]}>Ask AI</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.forest} />}
      >
        {activeTab === "overview" && (
          <View style={styles.section}>
            {circle.description && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>About Circle</Text>
                <Text style={styles.descText}>{circle.description}</Text>
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Circle Members ({circle.members?.length || 0})</Text>
                <TouchableOpacity onPress={() => setShowAddMemberModal(true)}>
                  <Text style={styles.linkText}>+ Add by ID</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.memberList}>
                {circle.members?.map((member: CrewCircleMember) => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberLeft}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberLetter}>
                          {member.user?.full_name?.charAt(0) || "U"}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.memberName}>{member.user?.full_name || "Explorer"}</Text>
                        <Text style={styles.memberVanvasId}>{member.user?.vanvas_id || "VNV-XXXX"}</Text>
                      </View>
                    </View>

                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>{member.role}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === "suggestions" && (
          <View style={styles.section}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Candidate Spots & Voting</Text>
              <TouchableOpacity
                onPress={() => setShowSuggModal(true)}
                style={styles.proposeBtn}
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
                <Text style={styles.proposeBtnText}>Propose Idea</Text>
              </TouchableOpacity>
            </View>

            {suggestions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="compass-outline" size={36} color={theme.colors.brass} />
                <Text style={styles.emptyCardText}>No ideas proposed yet. Propose your first spot!</Text>
              </View>
            ) : (
              <View style={styles.suggList}>
                {suggestions.map((sugg) => (
                  <View key={sugg.id} style={styles.suggCard}>
                    <View style={styles.suggHeader}>
                      <Text style={styles.suggTitle}>{sugg.title}</Text>
                      <View style={styles.typePill}>
                        <Text style={styles.typePillText}>{sugg.suggestion_type}</Text>
                      </View>
                    </View>

                    {sugg.description && (
                      <Text style={styles.suggDesc}>{sugg.description}</Text>
                    )}

                    {/* Voting Counts & Buttons */}
                    <View style={styles.votingRow}>
                      <TouchableOpacity
                        onPress={() => handleVote(sugg.id, "HELL_YEAH")}
                        style={styles.voteBtn}
                      >
                        <Text style={styles.voteBtnText}>🔥 {sugg.hell_yeah_count} Hell Yeah</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleVote(sugg.id, "YES")}
                        style={styles.voteBtn}
                      >
                        <Text style={styles.voteBtnText}>👍 {sugg.yes_count} Yes</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleVote(sugg.id, "NO")}
                        style={styles.voteBtn}
                      >
                        <Text style={styles.voteBtnText}>👎 {sugg.no_count} No</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === "money" && (
          <View style={styles.section}>
            {/* Split Pods (Layer 3) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Layer 3 · Isolated Split Pods</Text>
              <Text style={styles.podDesc}>
                Subgroups for specific expenses (e.g. Cigarettes, Cab Share, Drinks). Pod debts never leak into non-pod members.
              </Text>

              {splitPods.length === 0 ? (
                <Text style={styles.emptyPodText}>No split pods created yet in this circle.</Text>
              ) : (
                <View style={styles.podList}>
                  {splitPods.map((pod) => (
                    <View key={pod.id} style={styles.podCard}>
                      <View style={styles.podHeader}>
                        <Text style={styles.podName}>{pod.name}</Text>
                        <Text style={styles.podCount}>{pod.members?.length || 0} Members</Text>
                      </View>
                      {pod.description && <Text style={styles.podNotes}>{pod.description}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Balances & Debts */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Who Owes Whom</Text>
                <TouchableOpacity
                  onPress={() => setSettleModal(true)}
                  style={styles.settleBtn}
                >
                  <Text style={styles.settleBtnText}>Record Settle Up</Text>
                </TouchableOpacity>
              </View>

              {!balances?.simplified_debts || balances.simplified_debts.length === 0 ? (
                <Text style={styles.evenText}>All settled up! Everyone is even.</Text>
              ) : (
                <View style={styles.debtList}>
                  {balances.simplified_debts.map((debt, idx) => (
                    <View key={idx} style={styles.debtRow}>
                      <Text style={styles.debtText}>
                        <Text style={{ fontWeight: "800" }}>{debt.debtor_name}</Text> owes{" "}
                        <Text style={{ fontWeight: "800" }}>{debt.creditor_name}</Text>
                      </Text>
                      <Text style={styles.debtAmount}>₹{debt.amount.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === "chat" && (
          <View style={styles.section}>
            <View style={styles.chatFeed}>
              {activityFeed.length === 0 ? (
                <Text style={styles.emptyChatText}>No activity yet. Say hello to your mandali!</Text>
              ) : (
                activityFeed.map((act) => (
                  <View key={act.id} style={styles.chatBubble}>
                    <Text style={styles.chatAuthor}>{act.user?.full_name || "Explorer"}</Text>
                    <Text style={styles.chatContent}>{act.content}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Chat Composer */}
            <View style={styles.chatComposer}>
              <TextInput
                value={chatMessage}
                onChangeText={setChatMessage}
                placeholder="Message circle..."
                placeholderTextColor="#888"
                style={styles.chatInput}
              />
              <TouchableOpacity
                onPress={handleSendChat}
                disabled={isSendingChat || !chatMessage.trim()}
                style={styles.chatSendBtn}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "ai" && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ask VANVAS AI for Circle</Text>
              <Text style={styles.aiSubtitle}>
                Get group-aware recommendations for food, stays, offbeat trails, and timing.
              </Text>

              {/* Quick Prompt Chips */}
              <View style={styles.chipsRow}>
                {[
                  "Suggest 3 offbeat spots for our group",
                  "Plan a relaxed evening chai trail",
                  "Find a scenic group campsite",
                ].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => setAiPrompt(chip)}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.aiComposer}>
                <TextInput
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  placeholder="Ask anything for your group..."
                  placeholderTextColor="#888"
                  style={styles.aiInput}
                />
                <TouchableOpacity
                  onPress={handleAskVanvas}
                  disabled={aiLoading || !aiPrompt.trim()}
                  style={styles.aiSendBtn}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              {aiReply && (
                <View style={styles.aiReplyBox}>
                  <Text style={styles.aiReplyText}>{aiReply}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Member by VANVAS ID</Text>
            <TextInput
              value={memberVanvasId}
              onChangeText={(t) => setMemberVanvasId(t.toUpperCase())}
              placeholder="e.g. VNV-XXXX-XXXX"
              placeholderTextColor="#888"
              autoCapitalize="characters"
              style={styles.modalInput}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setShowAddMemberModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddMember}
                disabled={isAddingMember}
                style={styles.modalSubmitBtn}
              >
                {isAddingMember ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Add Member</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Propose Idea Modal */}
      <Modal
        visible={showSuggModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSuggModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Propose Idea for Circle</Text>
            <TextInput
              value={suggTitle}
              onChangeText={setSuggTitle}
              placeholder="Title (e.g. Parvati Valley Riverside Trek)"
              placeholderTextColor="#888"
              style={styles.modalInput}
            />
            <TextInput
              value={suggDesc}
              onChangeText={setSuggDesc}
              placeholder="Why this would be great for the group..."
              placeholderTextColor="#888"
              multiline
              numberOfLines={2}
              style={[styles.modalInput, { height: 60 }]}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setShowSuggModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleProposeSuggestion}
                disabled={isProposing}
                style={styles.modalSubmitBtn}
              >
                {isProposing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Propose</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settle Up Modal */}
      <Modal
        visible={settleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSettleModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Record Settle Up</Text>
            <TextInput
              value={settleAmount}
              onChangeText={setSettleAmount}
              placeholder="Amount (₹)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              style={styles.modalInput}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setSettleModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRecordSettlement}
                disabled={isSettling}
                style={styles.modalSubmitBtn}
              >
                {isSettling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Record Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: 14,
    color: "#666",
  },
  header: {
    backgroundColor: theme.colors.forestDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerInfo: {
    flex: 1,
    paddingRight: 10,
  },
  circleName: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.parchment,
  },
  circleSub: {
    fontSize: 11,
    color: "rgba(239,229,210,0.7)",
    marginTop: 2,
    fontFamily: "monospace",
  },
  addMemberBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.terracotta,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addMemberBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#EFE5D2",
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.forestDark,
  },
  tabText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  tabTextActive: {
    color: theme.colors.parchment,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  section: {
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.forestDark,
  },
  descText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginTop: 4,
  },
  linkText: {
    fontSize: 11,
    color: theme.colors.terracotta,
    fontWeight: "700",
  },
  memberList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F4EBD9",
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.forestDark,
    justifyContent: "center",
    alignItems: "center",
  },
  memberLetter: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  memberName: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  memberVanvasId: {
    fontSize: 10,
    fontFamily: "monospace",
    color: theme.colors.terracotta,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 9.5,
    fontFamily: "monospace",
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  proposeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.terracotta,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  proposeBtnText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "700",
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCardText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  suggList: {
    gap: 10,
  },
  suggCard: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  suggHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  suggTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.forestDark,
    flex: 1,
  },
  typePill: {
    backgroundColor: "rgba(182,94,60,0.1)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 9.5,
    color: theme.colors.terracotta,
    fontWeight: "700",
  },
  suggDesc: {
    fontSize: 11.5,
    color: "#666",
    marginTop: 4,
  },
  votingRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  voteBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    alignItems: "center",
  },
  voteBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  podDesc: {
    fontSize: 11,
    color: "#666",
    marginVertical: 4,
  },
  emptyPodText: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
    marginTop: 6,
  },
  podList: {
    gap: 6,
    marginTop: 8,
  },
  podCard: {
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  podHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  podName: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.forestDark,
  },
  podCount: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "purple",
    fontWeight: "700",
  },
  podNotes: {
    fontSize: 10.5,
    color: "#666",
    marginTop: 2,
  },
  settleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.forestDark,
    borderRadius: 8,
  },
  settleBtnText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  evenText: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "600",
    marginTop: 6,
  },
  debtList: {
    gap: 6,
    marginTop: 6,
  },
  debtRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F4EBD9",
  },
  debtText: {
    fontSize: 12,
    color: theme.colors.forestDark,
  },
  debtAmount: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "800",
    color: theme.colors.terracotta,
  },
  chatFeed: {
    gap: 8,
  },
  emptyChatText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    paddingVertical: 20,
  },
  chatBubble: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  chatAuthor: {
    fontSize: 10.5,
    fontWeight: "800",
    color: theme.colors.terracotta,
  },
  chatContent: {
    fontSize: 12,
    color: theme.colors.forestDark,
    marginTop: 2,
  },
  chatComposer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5D5BA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: theme.colors.forestDark,
  },
  chatSendBtn: {
    backgroundColor: theme.colors.terracotta,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  aiSubtitle: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  chipText: {
    fontSize: 10,
    color: theme.colors.forestDark,
    fontWeight: "600",
  },
  aiComposer: {
    flexDirection: "row",
    gap: 8,
  },
  aiInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5D5BA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  aiSendBtn: {
    backgroundColor: theme.colors.forestDark,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  aiReplyBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  aiReplyText: {
    fontSize: 12,
    color: theme.colors.forestDark,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: theme.colors.parchment,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 320,
    gap: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.forestDark,
  },
  modalInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5D5BA",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: theme.colors.forestDark,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#DDD",
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: theme.colors.terracotta,
    borderRadius: 10,
    alignItems: "center",
  },
  modalSubmitBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
