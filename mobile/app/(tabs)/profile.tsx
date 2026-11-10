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
  const { user, logout, uploadAvatar, refreshProfile } = useAuth();
  const { themeMode, setThemeMode, density, toggleDensity } = useTheme();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

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

      {/* Security & Account */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          <View style={styles.card}>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutRow}>
              <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Version Tag */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>VANVAS Native v0.2.0 • ai.vanvas.app</Text>
        <Text style={styles.copyrightText}>Crafted for Indian slow travel by The Sorted Club</Text>
      </View>
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
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 12,
  },
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.error,
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
});
