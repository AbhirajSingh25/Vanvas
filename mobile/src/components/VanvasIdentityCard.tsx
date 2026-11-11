import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Modal,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { User } from "@vanvas/shared";
import { nativeApi } from "../services/api";
import { theme } from "../theme";

interface VanvasIdentityCardProps {
  user: User | null;
  onProfileUpdated?: (updated: User) => void;
}

export const VanvasIdentityCard: React.FC<VanvasIdentityCardProps> = ({
  user,
  onProfileUpdated,
}) => {
  const router = useRouter();
  const [showQrModal, setShowQrModal] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [allowRequests, setAllowRequests] = useState(
    user?.allow_friend_requests_via_id ?? true
  );

  const vanvasId = user?.vanvas_id || "VNV-XXXX-XXXX";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=VANVAS:${encodeURIComponent(vanvasId)}`;

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Add me on VANVAS! My permanent VANVAS ID is: ${vanvasId}\nhttps://vanvasai.vercel.app/friends?id=${vanvasId}`,
        title: "My VANVAS ID",
      });
    } catch (err) {
      // User cancelled or error
    }
  };

  const handleTogglePrivacy = async (value: boolean) => {
    setAllowRequests(value);
    setIsUpdatingPrivacy(true);
    try {
      await Haptics.selectionAsync();
      const updated = await nativeApi.updateProfile({
        allow_friend_requests_via_id: value,
      });
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch {
      setAllowRequests(!value); // revert
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.idBadge}>
          <Ionicons name="finger-print" size={14} color={theme.colors.brass} />
          <Text style={styles.badgeText}>VANVAS IDENTITY</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowQrModal(true)}
          style={styles.qrIconBtn}
          accessibilityLabel="Show QR Code"
        >
          <Ionicons name="qr-code-outline" size={20} color={theme.colors.parchment} />
        </TouchableOpacity>
      </View>

      {/* VANVAS ID Display */}
      <View style={styles.idBox}>
        <Text style={styles.idLabel}>Permanent Travel ID</Text>
        <Text style={styles.idCode}>{vanvasId}</Text>
      </View>

      {/* Action Buttons: Share & Nav to Friends / Circles */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
          <Text style={styles.shareBtnText}>Share ID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/friends")}
          style={styles.navBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="people-outline" size={16} color={theme.colors.forestDark} />
          <Text style={styles.navBtnText}>Friends Hub</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/circles")}
          style={styles.navBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="bonfire-outline" size={16} color={theme.colors.forestDark} />
          <Text style={styles.navBtnText}>Crew Circles</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Switch */}
      <View style={styles.privacyRow}>
        <View style={styles.privacyInfo}>
          <Text style={styles.privacyTitle}>Allow Friend Requests via ID</Text>
          <Text style={styles.privacySubtitle}>
            When disabled, others cannot send you requests using your VANVAS ID
          </Text>
        </View>

        {isUpdatingPrivacy ? (
          <ActivityIndicator size="small" color={theme.colors.brass} />
        ) : (
          <Switch
            value={allowRequests}
            onValueChange={handleTogglePrivacy}
            trackColor={{ false: "#767577", true: theme.colors.terracotta }}
            thumbColor={allowRequests ? theme.colors.brass : "#f4f3f4"}
          />
        )}
      </View>

      {/* QR Code Modal */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your VANVAS QR Code</Text>
              <TouchableOpacity
                onPress={() => setShowQrModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.colors.forestDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.qrWrapper}>
              <Image
                source={{ uri: qrUrl }}
                style={styles.qrImage}
                contentFit="contain"
              />
            </View>

            <Text style={styles.qrVanvasId}>{vanvasId}</Text>
            <Text style={styles.qrInstruction}>
              Let friends scan this QR code to add you instantly on VANVAS.
            </Text>

            <TouchableOpacity
              onPress={handleShare}
              style={styles.qrShareBtn}
            >
              <Ionicons name="share-outline" size={16} color="#FFFFFF" />
              <Text style={styles.qrShareBtnText}>Share My Travel ID</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.forestDark,
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: `${theme.colors.brass}50`,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  idBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    color: theme.colors.brass,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  qrIconBtn: {
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
  },
  idBox: {
    marginTop: 14,
    marginBottom: 14,
  },
  idLabel: {
    color: "rgba(239,229,210,0.7)",
    fontSize: 11,
    fontFamily: "monospace",
  },
  idCode: {
    color: theme.colors.parchment,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: "monospace",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 10,
    borderRadius: 14,
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: theme.colors.parchment,
    paddingVertical: 10,
    borderRadius: 14,
  },
  navBtnText: {
    color: theme.colors.forestDark,
    fontSize: 11,
    fontWeight: "700",
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
  },
  privacyInfo: {
    flex: 1,
    paddingRight: 10,
  },
  privacyTitle: {
    color: theme.colors.parchment,
    fontSize: 12,
    fontWeight: "700",
  },
  privacySubtitle: {
    color: "rgba(239,229,210,0.6)",
    fontSize: 10,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.parchment,
    borderRadius: 28,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.forestDark,
  },
  modalCloseBtn: {
    padding: 4,
  },
  qrWrapper: {
    width: 200,
    height: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  qrVanvasId: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: "monospace",
    color: theme.colors.forestDark,
  },
  qrInstruction: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  qrShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: "100%",
  },
  qrShareBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});

