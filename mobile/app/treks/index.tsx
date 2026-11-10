import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CANONICAL_HIMALAYAN_TREKS, CanonicalTrekSummary } from "@vanvas/shared";
import { theme } from "../../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TreksScreen() {
  const router = useRouter();
  const [selectedTrek, setSelectedTrek] = useState<CanonicalTrekSummary>(
    CANONICAL_HIMALAYAN_TREKS[0]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Himalayan Treks",
          headerStyle: { backgroundColor: theme.colors.forestDark },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>VERIFIED HIMALAYAN TRAILS</Text>
          <Text style={styles.title}>High Altitude Expeditions</Text>
          <Text style={styles.subtitle}>
            Authentic mountain trails with altitude maps, ridge profiles, and acclimatization advisories.
          </Text>
        </View>

        {/* Horizontal Trek Carousel Picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trekScroll}
        >
          {CANONICAL_HIMALAYAN_TREKS.map((trek) => {
            const isSelected = selectedTrek.id === trek.id;
            return (
              <TouchableOpacity
                key={trek.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTrek(trek);
                }}
                style={[styles.trekPill, isSelected && styles.trekPillActive]}
              >
                <Text style={[styles.trekPillTitle, isSelected && styles.trekPillTitleActive]}>
                  {trek.title.split("–")[0].trim()}
                </Text>
                <Text style={[styles.trekPillAlt, isSelected && styles.trekPillAltActive]}>
                  {trek.peakAltitudeFormatted}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Selected Trek Profile Card */}
        <View style={styles.trekProfile}>
          {/* Hero Image */}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: selectedTrek.heroImage }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.imageOverlay}>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>{selectedTrek.difficulty}</Text>
              </View>
              <Text style={styles.hindiTitle}>{selectedTrek.hindiTitle}</Text>
              <Text style={styles.trekTitle}>{selectedTrek.title}</Text>
              <Text style={styles.regionText}>
                {selectedTrek.region} • {selectedTrek.state}
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <Ionicons name="trending-up" size={16} color={theme.colors.forest} />
              <Text style={styles.metricValue}>{selectedTrek.peakAltitudeFormatted}</Text>
              <Text style={styles.metricLabel}>Max Altitude</Text>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={16} color={theme.colors.forest} />
              <Text style={styles.metricValue}>{selectedTrek.durationHours}</Text>
              <Text style={styles.metricLabel}>Duration</Text>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="walk-outline" size={16} color={theme.colors.forest} />
              <Text style={styles.metricValue}>{selectedTrek.totalDistanceKm} km</Text>
              <Text style={styles.metricLabel}>Trail Length</Text>
            </View>
          </View>

          {/* Tagline & Overview */}
          <View style={styles.overviewCard}>
            <Text style={styles.tagline}>{selectedTrek.tagline}</Text>
            <Text style={styles.overviewText}>{selectedTrek.expeditionOverview}</Text>
          </View>

          {/* Acclimatization Guidance (High Importance) */}
          <View style={styles.advisoryCard}>
            <View style={styles.advisoryHeader}>
              <Ionicons name="shield-checkmark" size={18} color={theme.colors.brass} />
              <Text style={styles.advisoryHeading}>Acclimatization & Altitude Safety</Text>
            </View>
            <Text style={styles.acclimatizationText}>
              {selectedTrek.acclimatizationGuidance}
            </Text>
            <View style={styles.advisoriesList}>
              {selectedTrek.safetyAdvisories.map((adv, idx) => (
                <View key={idx} style={styles.advisoryRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.advisoryItemText}>{adv}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Waypoint Sequence */}
          <View style={styles.waypointsSection}>
            <Text style={styles.waypointsTitle}>Key Trail Waypoints</Text>
            {selectedTrek.keyWaypoints.map((wp, idx) => (
              <View key={idx} style={styles.waypointRow}>
                <View style={styles.wpDotContainer}>
                  <View style={styles.wpDot} />
                  {idx < selectedTrek.keyWaypoints.length - 1 && <View style={styles.wpLine} />}
                </View>
                <View style={styles.wpContent}>
                  <View style={styles.wpTop}>
                    <Text style={styles.wpName}>{wp.name}</Text>
                    <Text style={styles.wpElevation}>{wp.elevation}</Text>
                  </View>
                  <Text style={styles.wpType}>{wp.type}</Text>
                  <Text style={styles.wpNotes}>{wp.notes}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Plan This Trek Action */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/plan");
            }}
            style={styles.planTrekBtn}
          >
            <Ionicons name="compass" size={18} color={theme.colors.parchment} />
            <Text style={styles.planTrekBtnText}>Plan Trip to {selectedTrek.title.split("–")[0].trim()}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
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
    padding: 20,
    gap: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: theme.colors.brass,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.mist,
    lineHeight: 18,
  },
  trekScroll: {
    padding: 16,
    gap: 8,
  },
  trekPill: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  trekPillActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  trekPillTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  trekPillTitleActive: {
    color: theme.colors.parchment,
  },
  trekPillAlt: {
    fontSize: 10,
    color: theme.colors.foregroundMuted,
    marginTop: 2,
  },
  trekPillAltActive: {
    color: theme.colors.mist,
  },
  trekProfile: {
    paddingHorizontal: 16,
    gap: 16,
  },
  imageWrapper: {
    height: 240,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 16, 13, 0.45)",
    justifyContent: "flex-end",
    padding: 18,
    gap: 4,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
    marginBottom: 4,
  },
  difficultyText: {
    color: theme.colors.parchment,
    fontSize: 10,
    fontWeight: "700",
  },
  hindiTitle: {
    fontSize: 13,
    color: theme.colors.brass,
    fontWeight: "600",
  },
  trekTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  regionText: {
    fontSize: 12,
    color: theme.colors.mist,
  },
  metricsBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  metricLabel: {
    fontSize: 10,
    color: theme.colors.foregroundSubtle,
    textTransform: "uppercase",
  },
  overviewCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  overviewText: {
    fontSize: 13,
    color: theme.colors.foreground,
    lineHeight: 20,
  },
  advisoryCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.brass,
    padding: 16,
    gap: 8,
  },
  advisoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  advisoryHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  acclimatizationText: {
    fontSize: 13,
    color: theme.colors.foreground,
    lineHeight: 18,
    fontStyle: "italic",
  },
  advisoriesList: {
    gap: 6,
    marginTop: 4,
  },
  advisoryRow: {
    flexDirection: "row",
    gap: 6,
  },
  bullet: {
    color: theme.colors.terracotta,
    fontSize: 14,
    lineHeight: 18,
  },
  advisoryItemText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.foreground,
    lineHeight: 18,
  },
  waypointsSection: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  waypointsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  waypointRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  wpDotContainer: {
    width: 24,
    alignItems: "center",
  },
  wpDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.forest,
    marginTop: 4,
  },
  wpLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border,
    marginTop: 2,
  },
  wpContent: {
    flex: 1,
    marginLeft: 8,
    gap: 2,
  },
  wpTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  wpName: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  wpElevation: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.terracotta,
  },
  wpType: {
    fontSize: 11,
    color: theme.colors.forest,
    fontWeight: "600",
  },
  wpNotes: {
    fontSize: 11,
    color: theme.colors.foregroundMuted,
    lineHeight: 16,
  },
  planTrekBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.forest,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    marginTop: 8,
  },
  planTrekBtnText: {
    color: theme.colors.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
});
