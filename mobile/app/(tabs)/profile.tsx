import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { resolveAvatarUrl } from "../../src/services/api";
import { theme } from "../../src/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount, changePassword, uploadAvatar, refreshProfile } = useAuth();
  const { themeMode, setThemeMode, density, toggleDensity } = useTheme();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Change Password Modal State
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Delete Account Modal State
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState<boolean>(false);
  const [deletePassword, setDeletePassword] = useState<string>("");
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handlePickAndUploadAvatar = async () => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to update your profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square 1:1 crop
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploadingPhoto(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await uploadAvatar(asset.uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Profile avatar updated and synchronized with VANVAS account.");
      }
    } catch (err: any) {
      Alert.alert("Upload Failed", err.message || "Failed to update profile picture.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out from VANVAS?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  const handleExecuteChangePassword = async () => {
    if (!currentPassword) {
      setChangePasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError("New password and confirmation do not match.");
      return;
    }

    setIsChangingPassword(true);
    setChangePasswordError(null);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsChangePasswordModalVisible(false);
      Alert.alert("Success", "Password updated successfully. Please keep your credentials secure.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setChangePasswordError(err.message || "Failed to update password. Please check your current password.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExecuteDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError("Please enter your current password to confirm deletion.");
      return;
    }
    if (!isDeleteConfirmed) {
      setDeleteError("Please check the confirmation box acknowledging permanent data erasure.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await deleteAccount(deletePassword);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsDeleteModalVisible(false);
      setDeletePassword("");
      setIsDeleteConfirmed(false);
      Alert.alert(
        "Account Deleted",
        "Your VANVAS account and all associated personal travel records have been permanently erased from our servers."
      );
      router.replace("/(tabs)/explore");
    } catch (err: any) {
      setDeleteError(err.message || "Account deletion failed. Please check your password and try again.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={handlePickAndUploadAvatar}
            disabled={isUploadingPhoto || !user}
            style={styles.avatarWrapper}
            accessibilityLabel="Change profile photo"
          >
            {user?.avatar_url ? (
              <Image
                source={{ uri: resolveAvatarUrl(user.avatar_url) }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={40} color={theme.colors.parchment} />
              </View>
            )}

            {isUploadingPhoto ? (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="small" color={theme.colors.parchment} />
              </View>
            ) : (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color={theme.colors.parchment} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{user?.full_name || "Mountain Explorer"}</Text>
        <Text style={styles.userEmail}>{user?.email || "Guest Session"}</Text>

        {!user ? (
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={styles.signInButton}
          >
            <Ionicons name="log-in-outline" size={16} color={theme.colors.forestDark} />
            <Text style={styles.signInText}>Sign In / Register</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color={theme.colors.brass} />
            <Text style={styles.verifiedText}>VANVAS Verified Account</Text>
          </View>
        )}
      </View>

      {/* Travel Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Travel Archetype</Text>

        <View style={styles.card}>
          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Ionicons name="compass-outline" size={18} color={theme.colors.forest} />
              <Text style={styles.prefLabel}>Preferred Style</Text>
            </View>
            <Text style={styles.prefValue}>
              {user?.preferred_travel_style || "Spontaneous & Slow"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Ionicons name="alarm-outline" size={18} color={theme.colors.forest} />
              <Text style={styles.prefLabel}>Wake-up Rhythm</Text>
            </View>
            <Text style={styles.prefValue}>
              {user?.wake_up_preference || "Moderate (8:00 AM)"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Ionicons name="flash-outline" size={18} color={theme.colors.forest} />
              <Text style={styles.prefLabel}>Activity Intensity</Text>
            </View>
            <Text style={styles.prefValue}>
              {user?.activity_intensity || "Moderate"}
            </Text>
          </View>
        </View>
      </View>

      {/* App Experience Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.prefLeft}>
              <Ionicons name="color-palette-outline" size={18} color={theme.colors.forest} />
              <View>
                <Text style={styles.prefLabel}>Appearance Theme</Text>
                <Text style={styles.subLabel}>System default, Light, or Dark</Text>
              </View>
            </View>
            <View style={styles.themePillsRow}>
              {(["system", "light", "dark"] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setThemeMode(m);
                  }}
                  style={[styles.themePill, themeMode === m && styles.themePillActive]}
                >
                  <Text
                    style={[styles.themePillText, themeMode === m && styles.themePillTextActive]}
                  >
                    {m === "system" ? "Auto" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.prefLeft}>
              <Ionicons name="grid-outline" size={18} color={theme.colors.forest} />
              <View>
                <Text style={styles.prefLabel}>Compact Layout Density</Text>
                <Text style={styles.subLabel}>More information per screen</Text>
              </View>
            </View>
            <Switch
              value={density === "compact"}
              onValueChange={toggleDensity}
              trackColor={{ false: theme.colors.border, true: theme.colors.forest }}
              thumbColor={theme.colors.parchment}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() => router.push("/ask-vanvas")}
            style={styles.navRow}
          >
            <View style={styles.prefLeft}>
              <Ionicons name="chatbubbles-outline" size={18} color={theme.colors.forest} />
              <Text style={styles.prefLabel}>Ask VANVAS Copilot</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.foregroundSubtle} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Security & Account Management */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          <View style={styles.card}>
            {/* 1. Change Password */}
            <TouchableOpacity
              onPress={() => {
                setChangePasswordError(null);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setIsChangePasswordModalVisible(true);
              }}
              style={styles.navRow}
            >
              <View style={styles.prefLeft}>
                <Ionicons name="key-outline" size={18} color={theme.colors.forest} />
                <Text style={styles.prefLabel}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.foregroundSubtle} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 2. Sign Out */}
            <TouchableOpacity onPress={handleSignOut} style={styles.navRow}>
              <View style={styles.prefLeft}>
                <Ionicons name="log-out-outline" size={18} color={theme.colors.foregroundSubtle} />
                <Text style={styles.prefLabel}>Sign Out</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.foregroundSubtle} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* 3. Delete Account (Destructive Action) */}
            <TouchableOpacity
              onPress={() => {
                setDeleteError(null);
                setDeletePassword("");
                setIsDeleteConfirmed(false);
                setIsDeleteModalVisible(true);
              }}
              style={styles.deleteRow}
              accessibilityRole="button"
              accessibilityLabel="Delete Account Permanently"
            >
              <View style={styles.prefLeft}>
                <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                <Text style={styles.deleteText}>Delete Account Permanently</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Version Tag */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>VANVAS Native v0.4.0 • ai.vanvas.app</Text>
        <Text style={styles.copyrightText}>Crafted for Indian slow travel by The Sorted Club</Text>
      </View>

      {/* Change Password Native Modal */}
      <Modal
        visible={isChangePasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isChangingPassword) setIsChangePasswordModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="key" size={24} color={theme.colors.forest} />
              <Text style={styles.modalTitle}>Change Password</Text>
            </View>

            {changePasswordError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                <Text style={styles.errorBannerText}>{changePasswordError}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor={theme.colors.foregroundSubtle}
              editable={!isChangingPassword}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>New Password (min. 6 characters)</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={theme.colors.foregroundSubtle}
              editable={!isChangingPassword}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={theme.colors.foregroundSubtle}
              editable={!isChangingPassword}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsChangePasswordModalVisible(false)}
                disabled={isChangingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmChangeButton,
                  (!currentPassword || !newPassword || !confirmPassword || isChangingPassword) && styles.disabledButton,
                ]}
                disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
                onPress={handleExecuteChangePassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator size="small" color={theme.colors.parchment} />
                ) : (
                  <Text style={styles.confirmChangeButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Native Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeletingAccount) setIsDeleteModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.destructiveIconBadge}>
                <Ionicons name="warning" size={24} color={theme.colors.error} />
              </View>
              <Text style={styles.modalTitle}>Delete Account Permanently</Text>
            </View>

            <Text style={styles.modalWarning}>
              This action is immediate and cannot be undone. Once confirmed, all your personal data will be permanently wiped from the active VANVAS platform:
            </Text>

            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>• Account profile, email and login sessions</Text>
              <Text style={styles.bulletItem}>• Saved expeditions and personal itineraries</Text>
              <Text style={styles.bulletItem}>• Travel ledger expenses and settlement history</Text>
              <Text style={styles.bulletItem}>• Saved sanctuary bookmarks and traveller memories</Text>
              <Text style={styles.bulletItem}>• Profile avatars and remote cloud storage assets</Text>
            </View>

            {deleteError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                <Text style={styles.errorBannerText}>{deleteError}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Enter Account Password</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Your current account password"
              placeholderTextColor={theme.colors.foregroundSubtle}
              editable={!isDeletingAccount}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsDeleteConfirmed(!isDeleteConfirmed)}
              disabled={isDeletingAccount}
            >
              <Ionicons
                name={isDeleteConfirmed ? "checkbox" : "square-outline"}
                size={22}
                color={isDeleteConfirmed ? theme.colors.error : theme.colors.foregroundSubtle}
              />
              <Text style={styles.checkboxLabel}>
                I understand that this action is permanent, immediate, and irreversible.
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalVisible(false)}
                disabled={isDeletingAccount}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmDeleteButton,
                  (!deletePassword.trim() || !isDeleteConfirmed || isDeletingAccount) && styles.disabledButton,
                ]}
                disabled={!deletePassword.trim() || !isDeleteConfirmed || isDeletingAccount}
                onPress={handleExecuteDeleteAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color={theme.colors.parchment} />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete My Account</Text>
                )}
              </TouchableOpacity>
            </View>
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
    paddingBottom: 40,
  },
  header: {
    backgroundColor: theme.colors.forestDark,
    paddingTop: 54,
    paddingBottom: 28,
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: theme.colors.brass,
    overflow: "hidden",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: theme.colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: theme.colors.terracotta,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.forestDark,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.mist,
    marginTop: 2,
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.parchment,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    marginTop: 14,
  },
  signInText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    marginTop: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.brass,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.colors.foregroundMuted,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  prefLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  prefValue: {
    fontSize: 13,
    color: theme.colors.forest,
    fontWeight: "600",
  },
  subLabel: {
    fontSize: 11,
    color: theme.colors.foregroundSubtle,
    marginTop: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  deleteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 12,
  },
  themePillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  themePill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  themePillActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.foregroundMuted,
  },
  themePillTextActive: {
    color: theme.colors.parchment,
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 20,
    gap: 2,
  },
  versionText: {
    fontSize: 11,
    color: theme.colors.foregroundSubtle,
    fontWeight: "600",
  },
  copyrightText: {
    fontSize: 10,
    color: theme.colors.foregroundSubtle,
  },
  // Native Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  destructiveIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.foreground,
    flex: 1,
  },
  modalWarning: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  bulletList: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  bulletItem: {
    fontSize: 12,
    color: theme.colors.foreground,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    padding: 10,
    borderRadius: theme.radius.md,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  errorBannerText: {
    fontSize: 12,
    color: theme.colors.error,
    flex: 1,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.foreground,
    marginBottom: 6,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    flex: 1,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceMuted,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  confirmDeleteButton: {
    flex: 2,
    backgroundColor: theme.colors.error,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
  confirmChangeButton: {
    flex: 2,
    backgroundColor: theme.colors.forest,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmChangeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
