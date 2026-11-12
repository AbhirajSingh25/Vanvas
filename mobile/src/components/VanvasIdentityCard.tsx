import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Modal,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { User } from "@vanvas/shared";
import { resolveAvatarUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface VanvasIdentityCardProps {
  user: User | null;
  onProfileUpdated?: () => void;
  onPickAvatar?: () => void;
  onDeleteAvatar?: () => void;
  avatarUploading?: boolean;
}

function formatMemberSince(createdAt?: string | null): string | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return `Member since ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

export function VanvasIdentityCard({
  user,
  onProfileUpdated,
  onPickAvatar,
  onDeleteAvatar,
  avatarUploading = false,
}: VanvasIdentityCardProps) {
  const reducedMotion = useReducedMotion();
  const { updatePreferences, regenerateVanvasId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const initialPrivacy =
    user?.preferences?.allow_friend_requests_via_id ??
    user?.allow_friend_requests_via_id ??
    true;
  const [privacyAllowed, setPrivacyAllowed] = useState<boolean>(initialPrivacy);

  useEffect(() => {
    setPrivacyAllowed(
      user?.preferences?.allow_friend_requests_via_id ??
        user?.allow_friend_requests_via_id ??
        true
    );
  }, [user?.preferences?.allow_friend_requests_via_id, user?.allow_friend_requests_via_id]);

  const vanvasId = user?.vanvas_id?.trim() || null;
  const avatarUri = user?.avatar_url ? resolveAvatarUrl(user.avatar_url) : undefined;
  const isVerified = Boolean(user?.email_verified_at || user?.is_verified);
  const isAdmin = user?.role === "admin";
  const memberSince = formatMemberSince(user?.created_at);

  const styleParts = [
    user?.preferred_travel_style,
    user?.companion_style,
  ].filter((v): v is string => Boolean(v && v.trim()));
  const travelStyleLabel =
    styleParts.length > 0 ? styleParts.join(" · ") : "Travel style not set yet";

  const qrUrl = vanvasId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        `https://vanvasai.vercel.app/friends?add=${vanvasId}`
      )}`
    : null;

  const handleCopy = async () => {
    if (!vanvasId) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    await Share.share({ message: vanvasId }).catch(() => {
      Alert.alert("VANVAS ID", vanvasId);
    });
  };

  const handleShare = async () => {
    if (!vanvasId) return;
    try {
      await Share.share({
        message: `Add me on VANVAS! My Traveler ID is ${vanvasId}. https://vanvasai.vercel.app/friends?add=${vanvasId}`,
      });
    } catch {
      // Cancelled
    }
  };

  const handleTogglePrivacy = async (nextVal: boolean) => {
    if (updatingPrivacy) return;
    setPrivacyAllowed(nextVal);
    setUpdatingPrivacy(true);
    try {
      await updatePreferences({ allow_friend_requests_via_id: nextVal });
      if (onProfileUpdated) onProfileUpdated();
    } catch (err: any) {
      setPrivacyAllowed(!nextVal);
      Alert.alert("Error", err?.message || "Failed to update privacy setting");
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const handleRegenerateId = () => {
    if (!vanvasId || regenerating) return;
    Alert.alert(
      "Regenerate VANVAS ID?",
      `Your previous ID (${vanvasId}) and QR code will stop working immediately. Existing friends remain connected.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate ID",
          style: "destructive",
          onPress: async () => {
            setRegenerating(true);
            try {
              const newId = await regenerateVanvasId();
              if (onProfileUpdated) onProfileUpdated();
              Alert.alert("VANVAS ID Updated", `Your new ID is ${newId}`);
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Could not regenerate VANVAS ID");
            } finally {
              setRegenerating(false);
            }
          },
        },
      ]
    );
  };

  const initials = (user?.full_name || user?.email || "T").trim().charAt(0).toUpperCase();

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.duration(260)}
      style={styles.card}
    >
      {/* 1. Top Passport Header Row (no overlapping badges) */}
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>VANVAS IDENTITY PASSPORT</Text>
        <View style={styles.officialBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#B49252" />
          <Text style={styles.officialBadgeText}>OFFICIAL PASSPORT</Text>
        </View>
      </View>

      {/* 2. Traveler Identity Row */}
      <View style={styles.identityRow}>
        <TouchableOpacity
          onPress={onPickAvatar}
          disabled={!onPickAvatar || avatarUploading}
          style={styles.avatarContainer}
          accessibilityLabel="Change profile photo"
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {avatarUploading ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="small" color="#FAF7F0" />
            </View>
          ) : onPickAvatar ? (
            <View style={styles.cameraPill}>
              <Ionicons name="camera" size={12} color="#FAF7F0" />
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.identityInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.full_name || "Traveler"}
            </Text>
            <View
              style={[
                styles.statusChip,
                isAdmin ? styles.statusChipGold : isVerified ? styles.statusChipVerified : styles.statusChipMuted,
              ]}
            >
              <Text style={styles.statusChipText}>
                {isAdmin ? "Admin" : isVerified ? "Verified" : "Registered"}
              </Text>
            </View>
          </View>

          {user?.email ? (
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}

          <Text style={styles.metaText} numberOfLines={2}>
            {travelStyleLabel}
            {memberSince ? ` · ${memberSince}` : ""}
          </Text>
        </View>
      </View>

      {/* 3. VANVAS ID & Quick Actions */}
      <View style={styles.idBox}>
        <View style={styles.idTextWrap}>
          <Text style={styles.idLabel}>UNIQUE VANVAS ID</Text>
          <Text style={styles.idText} numberOfLines={1}>
            {vanvasId || "Assigning VANVAS ID…"}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, !vanvasId && styles.disabledBtn]}
            onPress={handleCopy}
            disabled={!vanvasId}
          >
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={15} color="#FAF7F0" />
            <Text style={styles.actionText}>{copied ? "Copied" : "Copy"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.qrBtn, !vanvasId && styles.disabledBtn]}
            onPress={() => setShowQrModal(true)}
            disabled={!vanvasId}
          >
            <Ionicons name="qr-code-outline" size={15} color="#F6E2B3" />
            <Text style={styles.qrText}>QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, !vanvasId && styles.disabledBtn]}
            onPress={handleShare}
            disabled={!vanvasId}
            accessibilityLabel="Share VANVAS ID"
          >
            <Ionicons name="share-outline" size={16} color="#FAF7F0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Friend Request Privacy Switch + Regenerate ID */}
      <View style={styles.privacyRow}>
        <View style={styles.privacyTextCol}>
          <Text style={styles.privacyTitle}>Allow friend requests via VANVAS ID</Text>
          <Text style={styles.privacySubtitle}>
            {privacyAllowed ? "Discoverable by your VANVAS ID" : "Hidden from ID lookup"}
          </Text>
        </View>
        <Switch
          value={privacyAllowed}
          onValueChange={handleTogglePrivacy}
          disabled={updatingPrivacy}
          trackColor={{ false: "#3E3A33", true: "#B65E3C" }}
          thumbColor="#FAF7F0"
        />
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity
          onPress={handleRegenerateId}
          disabled={!vanvasId || regenerating}
          style={[styles.regenBtn, (!vanvasId || regenerating) && styles.disabledBtn]}
        >
          <Ionicons name="refresh-outline" size={14} color="#E5D5BA" />
          <Text style={styles.regenText}>
            {regenerating ? "Regenerating…" : "Regenerate ID"}
          </Text>
        </TouchableOpacity>

        {avatarUri && onDeleteAvatar ? (
          <TouchableOpacity onPress={onDeleteAvatar} disabled={avatarUploading} style={styles.removePhotoBtn}>
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* QR Code Modal */}
      <Modal
        visible={showQrModal && Boolean(vanvasId)}
        transparent
        animationType={reducedMotion ? "none" : "fade"}
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share VANVAS Passport</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)}>
                <Ionicons name="close" size={24} color="#173B32" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Friends can scan this QR code or enter your VANVAS ID
            </Text>

            {qrUrl ? (
              <View style={styles.qrWrapper}>
                <Image source={{ uri: qrUrl }} style={styles.qrImage} contentFit="contain" />
              </View>
            ) : null}

            <Text style={styles.modalIdText}>{vanvasId}</Text>

            <TouchableOpacity style={styles.modalCopyBtn} onPress={handleCopy}>
              <Text style={styles.modalCopyText}>{copied ? "Copied!" : "Copy ID"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#173B32",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(180, 146, 82, 0.45)",
    shadowColor: "#112B24",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(250, 247, 240, 0.14)",
    gap: 8,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(229, 213, 186, 0.85)",
    letterSpacing: 1.4,
    flexShrink: 1,
  },
  officialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(180, 146, 82, 0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(180, 146, 82, 0.45)",
  },
  officialBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#E5D5BA",
    letterSpacing: 0.8,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "#B49252",
    backgroundColor: "#112B24",
    position: "relative",
    overflow: "visible",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    backgroundColor: "#245347",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FAF7F0",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 32,
    backgroundColor: "rgba(17, 43, 36, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraPill: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#B65E3C",
    borderWidth: 2,
    borderColor: "#173B32",
    alignItems: "center",
    justifyContent: "center",
  },
  identityInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FAF7F0",
    flexShrink: 1,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipVerified: {
    backgroundColor: "rgba(250, 247, 240, 0.14)",
    borderColor: "rgba(180, 146, 82, 0.45)",
  },
  statusChipGold: {
    backgroundColor: "rgba(180, 146, 82, 0.25)",
    borderColor: "rgba(180, 146, 82, 0.55)",
  },
  statusChipMuted: {
    backgroundColor: "rgba(250, 247, 240, 0.08)",
    borderColor: "rgba(250, 247, 240, 0.2)",
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F6E2B3",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 13,
    color: "rgba(229, 213, 186, 0.85)",
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: "rgba(229, 213, 186, 0.72)",
    marginTop: 4,
  },
  idBox: {
    backgroundColor: "rgba(17, 43, 36, 0.85)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(180, 146, 82, 0.3)",
    marginBottom: 14,
    gap: 10,
  },
  idTextWrap: {
    minWidth: 0,
  },
  idLabel: {
    fontSize: 10,
    color: "rgba(229, 213, 186, 0.72)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  idText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F6E2B3",
    letterSpacing: 1.5,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(250, 247, 240, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FAF7F0",
  },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(180, 146, 82, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(180, 146, 82, 0.45)",
  },
  qrText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F6E2B3",
  },
  shareBtn: {
    backgroundColor: "rgba(250, 247, 240, 0.12)",
    padding: 8,
    borderRadius: 10,
  },
  disabledBtn: {
    opacity: 0.45,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(250, 247, 240, 0.12)",
    gap: 12,
  },
  privacyTextCol: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FAF7F0",
  },
  privacySubtitle: {
    fontSize: 11,
    color: "rgba(229, 213, 186, 0.72)",
    marginTop: 2,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  regenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  regenText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(229, 213, 186, 0.85)",
  },
  removePhotoBtn: {
    paddingVertical: 4,
  },
  removePhotoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F3B098",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 43, 36, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FAF7F0",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#173B32",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#7B4D36",
    textAlign: "center",
    marginBottom: 20,
  },
  qrWrapper: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5D5BA",
    marginBottom: 16,
  },
  qrImage: {
    width: 190,
    height: 190,
  },
  modalIdText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#173B32",
    letterSpacing: 1.5,
    marginBottom: 18,
  },
  modalCopyBtn: {
    width: "100%",
    backgroundColor: "#173B32",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCopyText: {
    color: "#FAF7F0",
    fontSize: 15,
    fontWeight: "700",
  },
});
